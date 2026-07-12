import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildCapsule, capsuleDigest, summarizeClaims, validateCapsule } from './capsule.js';
import { detectAgentContext } from './agent.js';
import { classify } from './classifier.js';
import type { Capsule, ClaimInput, ClaimResult, PolicyDocument, ValidationReport } from './domain.js';
import { loadClaimsDocument, loadPolicyDocument } from './schema.js';
import {
  collectChangedTypeScriptFiles,
  createWorktree,
  currentHeadSha,
  ensureGitRepository,
  removeWorktree,
  resolveRevision,
} from './git.js';
import { runStableProbe } from './runner.js';
import { canonicalHash, ensureDirectory, writeJson } from './utils.js';
import { evaluatePolicy } from './policy.js';
import { renderReport } from './report.js';
import { generateMutations, rangesFromLines, screenMutants, summarizeMutants } from './mutation.js';

export interface VerifyEvidenceOptions {
  repoRoot?: string;
  baseRef: string;
  headRef: string;
  claimsPath: string;
  outputDir: string;
  policyPath?: string;
  attempts?: number;
}

export interface VerifyEvidenceResult {
  capsule: Capsule;
  reportPath: string;
  capsulePath: string;
  claimsResultsPath: string;
  policyResult?: {
    accepted: boolean;
    reasons: string[];
    path: string;
  };
}

export interface ReplayResult {
  capsule: Capsule;
  verified: boolean;
  replayPath: string;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function summarizeResults(results: ClaimResult[]): Capsule['summary'] {
  return summarizeClaims(results);
}

export function determineExitCode(summary: Capsule['summary'], policyResult?: { accepted: boolean }): number {
  if (policyResult && !policyResult.accepted) {
    return 1;
  }
  if (summary.inconclusive > 0) {
    return 2;
  }
  if (summary.regression > 0 || summary.vacuous > 0) {
    return 1;
  }
  return 0;
}

async function runClaim(claim: ClaimInput, cwd: string, attempts: number): Promise<ClaimResult> {
  const baseRun = await runStableProbe(claim.probe.command, {
    cwd,
    timeoutMs: claim.probe.timeoutMs ?? 30000,
    attempts,
  });
  const headRun = await runStableProbe(claim.probe.command, {
    cwd,
    timeoutMs: claim.probe.timeoutMs ?? 30000,
    attempts,
  });
  const verdict = classify(claim.type, baseRun.outcome, headRun.outcome);
  return {
    ...claim,
    base: baseRun.outcome,
    head: headRun.outcome,
    verdict,
    baseAttempts: baseRun.attempts,
    headAttempts: headRun.attempts,
  };
}

async function runClaimInTrees(
  claim: ClaimInput,
  baseCwd: string,
  headCwd: string,
  attempts: number,
): Promise<ClaimResult> {
  const baseRun = await runStableProbe(claim.probe.command, {
    cwd: baseCwd,
    timeoutMs: claim.probe.timeoutMs ?? 30000,
    attempts,
  });
  const headRun = await runStableProbe(claim.probe.command, {
    cwd: headCwd,
    timeoutMs: claim.probe.timeoutMs ?? 30000,
    attempts,
  });
  const verdict = classify(claim.type, baseRun.outcome, headRun.outcome);
  return {
    ...claim,
    base: baseRun.outcome,
    head: headRun.outcome,
    verdict,
    baseAttempts: baseRun.attempts,
    headAttempts: headRun.attempts,
  };
}

function mutationSummaryFromHead(repoRoot: string, baseRef: string, headRef: string, headWorktree: string): Record<string, unknown> {
  return {
    ...summarizeMutants([]),
    generatedMutants: 0,
    validMutants: 0,
    mutationStrength: 0,
    changedFiles: [],
    operators: {},
    note: 'Mutation sweep is available through the CLI mutate command; no changed TypeScript files were present in this run.',
  };
}

async function runMutationSweep(repoRoot: string, baseRef: string, headRef: string, headWorktree: string): Promise<Record<string, unknown>> {
  const changedFiles = await collectChangedTypeScriptFiles(repoRoot, baseRef, headRef);
  const files: Array<{ path: string; generatedMutants: number; operators: Record<string, number> }> = [];
  let generatedMutants = 0;
  let validMutants = 0;
  let invalidMutants = 0;
  const operators: Record<string, number> = {};

  for (const file of changedFiles) {
    const absolute = resolve(headWorktree, file.path);
    if (!(await pathExists(absolute))) {
      continue;
    }
    const source = await readFile(absolute, 'utf8');
    const mutants = generateMutations(source, file.path, rangesFromLines(file.ranges));
    const screened = screenMutants(mutants);
    const validScreened = screened.filter((mutant) => mutant.valid);
    const summary = summarizeMutants(validScreened);
    files.push({
      path: file.path,
      generatedMutants: screened.length,
      operators: summary,
    });
    generatedMutants += screened.length;
    validMutants += validScreened.length;
    invalidMutants += screened.length - validScreened.length;
    for (const [operator, count] of Object.entries(summary)) {
      operators[operator] = (operators[operator] ?? 0) + count;
    }
  }

  return {
    generatedMutants,
    validMutants,
    invalidMutants,
    mutationStrength: generatedMutants === 0 ? 0 : validMutants / generatedMutants,
    changedFiles: files,
    operators,
  };
}

export async function verifyEvidence(options: VerifyEvidenceOptions): Promise<VerifyEvidenceResult> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  await ensureGitRepository(repoRoot);
  const claimsPath = resolve(options.claimsPath);
  const outputDir = resolve(options.outputDir);
  await ensureDirectory(outputDir);
  const runDir = join(outputDir, `run-${Date.now()}-${randomUUID().slice(0, 8)}`);
  await ensureDirectory(runDir);
  const worktreesRoot = join(runDir, 'worktrees');
  await ensureDirectory(worktreesRoot);

  const claimsDocument = await loadClaimsDocument(claimsPath);
  const baseSha = await resolveRevision(repoRoot, options.baseRef);
  const headSha = await resolveRevision(repoRoot, options.headRef);
  const baseTree = await createWorktree(repoRoot, baseSha, worktreesRoot, 'base');
  const headTree = await createWorktree(repoRoot, headSha, worktreesRoot, 'head');
  const claimResults: ClaimResult[] = [];
  const attempts = options.attempts ?? 2;

  try {
    for (const claim of claimsDocument.claims) {
      claimResults.push(await runClaimInTrees(claim, baseTree.path, headTree.path, attempts));
    }

    const summary = summarizeResults(claimResults);
    const mutationSummary = await runMutationSweep(repoRoot, baseSha, headSha, headTree.path);
    const generatedBy = detectAgentContext();
    const claimsResultsPath = join(runDir, 'claims-results.json');
    const reportPath = join(runDir, 'report.html');
    const capsulePath = join(runDir, 'capsule.json');
    const policy = options.policyPath ? await loadPolicyDocument(options.policyPath) : undefined;
    const capsuleBaseBody = {
      version: '0.1' as const,
      createdAt: new Date().toISOString(),
      repository: {
        root: repoRoot,
        baseRef: options.baseRef,
        headRef: options.headRef,
        baseSha,
        headSha,
        claimsPath,
      },
      claims: claimResults,
      summary,
      artifacts: {
        claimsResults: {
          path: claimsResultsPath,
          sha256: canonicalHash(claimResults),
        },
      } as Capsule['artifacts'],
      generatedBy,
      replay: {
        command: ['node', '--import', 'tsx', 'src/cli.ts', 'replay', capsulePath],
        workingDirectory: repoRoot,
      },
      mutations: mutationSummary,
      policy: policy ? { ...policy } : undefined,
    };
    const capsulePreview = capsuleBaseBody as Omit<Capsule, 'integrity'>;
    const policyDecision = policy ? evaluatePolicy(capsulePreview, policy) : undefined;
    const reportCapsule = policyDecision
      ? { ...capsulePreview, policy: { ...(capsulePreview.policy ?? {}), decision: policyDecision } }
      : capsulePreview;
    const reportHtml = renderReport(reportCapsule);
    const reportArtifact = {
      path: reportPath,
      sha256: canonicalHash(reportHtml),
    };
    const finalCapsule = buildCapsule({
      ...capsulePreview,
      artifacts: {
        claimsResults: {
          path: claimsResultsPath,
          sha256: canonicalHash(claimResults),
        },
        report: reportArtifact,
      },
      policy: policyDecision ? { ...policy, decision: policyDecision } : policy ? { ...policy } : undefined,
    } as Omit<Capsule, 'integrity'>);

    await writeJson(claimsResultsPath, claimResults);
    await writeFile(reportPath, reportHtml, 'utf8');
    await writeJson(capsulePath, finalCapsule);
    return {
      capsule: finalCapsule,
      reportPath,
      capsulePath,
      claimsResultsPath,
      policyResult: policyDecision
        ? {
            accepted: policyDecision.accepted,
            reasons: policyDecision.reasons,
            path: options.policyPath as string,
          }
        : undefined,
    };
  } finally {
    await removeWorktree(repoRoot, headTree);
    await removeWorktree(repoRoot, baseTree);
  }
}

export async function replayCapsule(capsulePath: string): Promise<ReplayResult> {
  const capsule = validateCapsule(JSON.parse(await readFile(capsulePath, 'utf8')));
  const { integrity, ...body } = capsule;
  const expectedHash = canonicalHash(capsuleDigest(body));
  if (expectedHash !== integrity.capsuleHash) {
    throw new Error('Capsule integrity hash mismatch');
  }
  const replayOutput = join(resolve(capsule.repository.root), '.evidence', `replay-${Date.now()}-${randomUUID().slice(0, 8)}`);
  await ensureDirectory(replayOutput);
  const replayed = await verifyEvidence({
    repoRoot: capsule.repository.root,
    baseRef: capsule.repository.baseRef,
    headRef: capsule.repository.headRef,
    claimsPath: capsule.repository.claimsPath,
    outputDir: replayOutput,
    attempts: 2,
  });
  if (replayed.capsule.integrity.capsuleHash !== capsule.integrity.capsuleHash) {
    throw new Error('Replay produced a different capsule hash');
  }
  return {
    capsule,
    verified: true,
    replayPath: replayed.capsulePath,
  };
}

export async function attachAgentMetadata(path: string): Promise<Capsule> {
  const capsule = validateCapsule(JSON.parse(await readFile(path, 'utf8')));
  const updated = buildCapsule({
    ...capsule,
    generatedBy: detectAgentContext(),
  } as Omit<Capsule, 'integrity'>);
  await writeJson(path, updated);
  return updated;
}

export async function validateClaimsDocument(path: string): Promise<ValidationReport> {
  const claims = await loadClaimsDocument(path);
  return {
    kind: 'claims',
    valid: claims.claims.length > 0,
    path,
    detail: `Loaded ${claims.claims.length} claim(s)`,
  };
}
