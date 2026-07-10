#!/usr/bin/env node
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { ZodError } from 'zod';
import { buildFixtureRepository, cleanupFixtureRepository } from './fixture.js';
import { attachAgentMetadata, determineExitCode, replayCapsule, verifyEvidence } from './engine.js';
import { loadClaimsDocument, loadCapsule, loadPolicyDocument, loadPluginManifest } from './schema.js';
import { validatePolicy, evaluatePolicy } from './policy.js';
import { validatePluginManifest } from './plugin.js';
import { generateMutations, rangesFromLines } from './mutation.js';
import { canonicalHash, readStructuredText, writeJson } from './utils.js';

interface ParsedArgs {
  positional: string[];
  flags: Map<string, string[]>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string[]>();
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === undefined) {
      continue;
    }
    if (!current.startsWith('--')) {
      positional.push(current);
      continue;
    }

    const split = current.indexOf('=');
    const key = split >= 0 ? current.slice(2, split) : current.slice(2);
    const next = argv[index + 1];
    const value = split >= 0 ? current.slice(split + 1) : next !== undefined && !next.startsWith('--') ? String(argv[++index] ?? 'true') : 'true';
    const entries = flags.get(key) ?? [];
    entries.push(value);
    flags.set(key, entries);
  }
  return { positional, flags };
}

function getFlag(flags: Map<string, string[]>, key: string): string | undefined {
  return flags.get(key)?.[0];
}

function getFlagNumber(flags: Map<string, string[]>, key: string, fallback: number): number {
  const value = getFlag(flags, key);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function emitJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function validateDocument(path: string): Promise<{ kind: string; valid: boolean; detail: string }> {
  try {
    const claims = await loadClaimsDocument(path);
    return { kind: 'claims', valid: true, detail: `Loaded ${claims.claims.length} claim(s)` };
  } catch {
    // Continue.
  }
  try {
    const capsule = await loadCapsule(path);
    return { kind: 'capsule', valid: true, detail: `Loaded ${capsule.claims.length} claim result(s)` };
  } catch {
    // Continue.
  }
  try {
    const policy = await loadPolicyDocument(path);
    return { kind: 'policy', valid: true, detail: `Loaded policy version ${policy.evidencePolicyVersion}` };
  } catch {
    // Continue.
  }
  try {
    const plugin = await loadPluginManifest(path);
    return { kind: 'plugin', valid: true, detail: `Loaded plugin ${plugin.id}` };
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
  }
  throw new Error(`Unrecognized structured document: ${path}`);
}

async function runDemo(flags: Map<string, string[]>): Promise<void> {
  const outputDir = resolve(getFlag(flags, 'output') ?? '.evidence/demo');
  const fixtureRoot = resolve('fixtures/auth');
  const sandboxRoot = await mkdtemp(join(tmpdir(), 'evidence-demo-'));
  const fixtureRepo = await buildFixtureRepository(fixtureRoot, sandboxRoot);

  try {
    const observed: Array<{ base: string; head: string; verdict: string }> = [];
    let firstSummary: string | undefined;
    let firstHash: string | undefined;
    let finalResult: Awaited<ReturnType<typeof verifyEvidence>> | undefined;
    for (let run = 0; run < 5; run += 1) {
      const result = await verifyEvidence({
        repoRoot: fixtureRepo.repoRoot,
        baseRef: fixtureRepo.baseSha,
        headRef: fixtureRepo.headSha,
        claimsPath: fixtureRepo.claimsPath,
        outputDir,
        attempts: 1,
      });
      finalResult = result;
      const claimSummary = result.capsule.claims
        .map((claim) => `${claim.id}:${claim.base}/${claim.head}/${claim.verdict}`)
        .join('|');
      if (firstSummary === undefined) {
        firstSummary = claimSummary;
        firstHash = canonicalHash(result.capsule.claims.map((claim) => ({
          id: claim.id,
          base: claim.base,
          head: claim.head,
          verdict: claim.verdict,
        })));
      } else if (firstSummary !== claimSummary) {
        throw new Error('Auth demo did not remain stable across five consecutive runs');
      }
      observed.push({
        base: result.capsule.claims[0]?.base ?? 'unknown',
        head: result.capsule.claims[0]?.head ?? 'unknown',
        verdict: result.capsule.claims[0]?.verdict ?? 'inconclusive',
      });
    }

    if (!finalResult) {
      throw new Error('Demo did not produce a result');
    }

    await writeFile('demo-capsule.json', `${JSON.stringify(finalResult.capsule, null, 2)}\n`, 'utf8');
    emitJson({
      kind: 'demo',
      stable: true,
      runs: observed,
      capsulePath: finalResult.capsulePath,
      reportPath: finalResult.reportPath,
      claimDigest: firstHash,
    });
  } finally {
    await cleanupFixtureRepository(fixtureRepo.repoRoot);
    await rm(sandboxRoot, { recursive: true, force: true });
  }
}

async function main(): Promise<number> {
  const [command = 'help', ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);

  try {
    switch (command) {
      case 'verify': {
        const revision = positional[0];
        if (!revision || !revision.includes('..')) {
          throw new Error('Expected a <base>..<head> revision pair');
        }
        const [baseRef, headRef] = revision.split('..', 2);
        if (!baseRef || !headRef) {
          throw new Error('Expected a <base>..<head> revision pair');
        }
        const claimsPath = getFlag(flags, 'claims');
        const outputDir = getFlag(flags, 'output') ?? '.evidence';
        if (!claimsPath) {
          throw new Error('--claims is required');
        }
        const result = await verifyEvidence({
          repoRoot: getFlag(flags, 'repo'),
          baseRef,
          headRef,
          claimsPath,
          outputDir,
          policyPath: getFlag(flags, 'policy'),
          attempts: getFlagNumber(flags, 'attempts', 2),
        });
        emitJson({
          kind: 'verify',
          capsulePath: result.capsulePath,
          reportPath: result.reportPath,
          claimsResultsPath: result.claimsResultsPath,
          capsuleHash: result.capsule.integrity.capsuleHash,
          summary: result.capsule.summary,
          policy: result.policyResult,
        });
        return determineExitCode(result.capsule.summary, result.policyResult);
      }
      case 'replay': {
        const capsulePath = positional[0];
        if (!capsulePath) {
          throw new Error('Expected a capsule path');
        }
        const result = await replayCapsule(capsulePath);
        emitJson({
          kind: 'replay',
          verified: result.verified,
          replayPath: result.replayPath,
          capsuleHash: result.capsule.integrity.capsuleHash,
        });
        return 0;
      }
      case 'validate': {
        const path = positional[0];
        if (!path) {
          throw new Error('Expected a claims, capsule, policy, or plugin file path');
        }
        const result = await validateDocument(path);
        emitJson(result);
        return 0;
      }
      case 'policy': {
        const capsulePath = positional[0];
        const policyPath = getFlag(flags, 'policy');
        if (!capsulePath || !policyPath) {
          throw new Error('Expected a capsule path and --policy path');
        }
        const capsule = await loadCapsule(capsulePath);
        const policy = validatePolicy(await readStructuredText(policyPath));
        const decision = evaluatePolicy(capsule, policy);
        emitJson({
          kind: 'policy',
          accepted: decision.accepted,
          reasons: decision.reasons,
        });
        return decision.accepted ? 0 : 1;
      }
      case 'plugin': {
        const subcommand = positional[0];
        const manifestPath = positional[1];
        if (subcommand !== 'validate' || !manifestPath) {
          throw new Error('Usage: evidence plugin validate <manifest.json>');
        }
        const manifest = validatePluginManifest(await readStructuredText(manifestPath));
        emitJson({
          kind: 'plugin',
          valid: true,
          id: manifest.id,
          capabilities: manifest.capabilities,
        });
        return 0;
      }
      case 'agent': {
        const subcommand = positional[0];
        if (subcommand === 'inspect') {
          emitJson(await import('./agent.js').then(({ detectAgentContext }) => detectAgentContext()));
          return 0;
        }
        if (subcommand === 'attach') {
          const capsulePath = positional[1];
          if (!capsulePath) {
            throw new Error('Expected a capsule path');
          }
          const updated = await attachAgentMetadata(capsulePath);
          emitJson({
            kind: 'agent',
            capsuleHash: updated.integrity.capsuleHash,
            generatedBy: updated.generatedBy,
          });
          return 0;
        }
        throw new Error('Usage: evidence agent inspect | attach <capsule.json>');
      }
      case 'mutate': {
        const filePath = positional[0];
        if (!filePath) {
          throw new Error('Expected a TypeScript file path');
        }
        const source = await readFile(filePath, 'utf8');
        const lines = getFlag(flags, 'line')
          ?.split(',')
          .map((entry) => {
            const [startText, endText = startText] = entry.split(':');
            const start = Number(startText);
            const end = Number(endText);
            return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : undefined;
          })
          .filter((value): value is { start: number; end: number } => Boolean(value));
        const mutants = generateMutations(source, filePath, lines ? rangesFromLines(lines) : undefined);
        emitJson({ kind: 'mutate', filePath, count: mutants.length, mutants });
        return 0;
      }
      case 'demo': {
        await runDemo(flags);
        return 0;
      }
      default: {
        process.stdout.write(
          [
            'evidence verify <base>..<head> --claims claims.yml --output .evidence',
            'evidence replay capsule.json',
            'evidence validate <claims-or-capsule.json>',
            'evidence policy capsule.json --policy policy.yml',
            'evidence plugin validate manifest.json',
            'evidence agent inspect',
            'evidence mutate file.ts',
            'evidence demo',
          ].join('\n'),
        );
        return 0;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    if (error instanceof ZodError) {
      return 3;
    }
    if (message.includes('Expected') || message.includes('Usage') || message.includes('Unrecognized')) {
      return 3;
    }
    return 4;
  }
}

const exitCode = await main();
process.exitCode = exitCode;
