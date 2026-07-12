import { z } from 'zod';
import type { Capsule, ClaimsDocument, PolicyDocument, PluginManifest, ValidationReport } from './domain.js';
import { readStructuredText } from './utils.js';

export const claimProbeSchema = z
  .object({
    command: z.array(z.string().min(1)).min(1),
    timeoutMs: z.number().int().min(100).max(600000).optional(),
  })
  .strict();

export const claimInputSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
    type: z.enum(['intended_delta', 'invariant']),
    statement: z.string().min(1),
    probe: claimProbeSchema,
  })
  .strict();

export const claimsDocumentSchema = z
  .object({
    version: z.literal('0.1'),
    claims: z.array(claimInputSchema).min(1),
  })
  .strict();

export const claimResultSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]*$/),
    type: z.enum(['intended_delta', 'invariant']),
    statement: z.string().min(1),
    probe: claimProbeSchema,
    base: z.enum(['pass', 'fail', 'unknown']),
    head: z.enum(['pass', 'fail', 'unknown']),
    verdict: z.enum(['demonstrated', 'regression', 'vacuous', 'inconclusive']),
    baseAttempts: z.array(
      z.object({
        command: z.array(z.string()),
        cwd: z.string(),
        timeoutMs: z.number(),
        outcome: z.enum(['pass', 'fail', 'unknown']),
        exitCode: z.number().nullable(),
        signal: z.string().nullable(),
        durationMs: z.number(),
        stdout: z.string(),
        stderr: z.string(),
      }),
    ),
    headAttempts: z.array(
      z.object({
        command: z.array(z.string()),
        cwd: z.string(),
        timeoutMs: z.number(),
        outcome: z.enum(['pass', 'fail', 'unknown']),
        exitCode: z.number().nullable(),
        signal: z.string().nullable(),
        durationMs: z.number(),
        stdout: z.string(),
        stderr: z.string(),
      }),
    ),
  })
  .strict();

export const capsuleSchema = z
  .object({
    version: z.literal('0.1'),
    createdAt: z.string().min(1),
    repository: z
      .object({
        root: z.string().min(1),
        baseRef: z.string().min(1),
        headRef: z.string().min(1),
        baseSha: z.string().min(1),
        headSha: z.string().min(1),
        claimsPath: z.string().min(1),
      })
      .passthrough(),
    claims: z.array(claimResultSchema),
    summary: z
      .object({
        demonstrated: z.number().int().nonnegative(),
        regression: z.number().int().nonnegative(),
        vacuous: z.number().int().nonnegative(),
        inconclusive: z.number().int().nonnegative(),
      })
      .strict(),
    artifacts: z.record(z.string(), z.object({ path: z.string().min(1), sha256: z.string().min(1) })),
    generatedBy: z.record(z.string(), z.unknown()),
    replay: z
      .object({
        command: z.array(z.string().min(1)).min(1),
        workingDirectory: z.string().min(1),
      })
      .strict(),
    mutations: z.record(z.string(), z.unknown()).optional(),
    policy: z.record(z.string(), z.unknown()).optional(),
    integrity: z
      .object({
        capsuleHash: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
  })
  .passthrough();

export const policySchema = z
  .object({
    evidencePolicyVersion: z.literal('0.1'),
    requireCapsule: z.boolean(),
    maximumRegressions: z.number().int().nonnegative().optional(),
    maximumVacuousIntendedClaims: z.number().int().nonnegative().optional(),
    allowInconclusive: z.boolean().optional(),
    minimumValidMutants: z.number().int().nonnegative().optional(),
    minimumMutationStrength: z.number().min(0).max(1).optional(),
    requireReplay: z.boolean().optional(),
  })
  .strict();

export const pluginManifestSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    kind: z.enum([
      'language',
      'runner',
      'mutator',
      'oracle',
      'execution',
      'agent',
      'renderer',
      'attestation',
    ]),
    license: z.string().min(1),
    capabilities: z.array(z.string().min(1)),
    securityRequirements: z.array(z.string().min(1)).optional(),
  })
  .strict();

export async function loadClaimsDocument(path: string): Promise<ClaimsDocument> {
  return claimsDocumentSchema.parse(await readStructuredText(path));
}

export async function loadCapsule(path: string): Promise<Capsule> {
  return capsuleSchema.parse(await readStructuredText(path));
}

export async function loadPolicyDocument(path: string): Promise<PolicyDocument> {
  return policySchema.parse(await readStructuredText(path));
}

export async function loadPluginManifest(path: string): Promise<PluginManifest> {
  return pluginManifestSchema.parse(await readStructuredText(path));
}

export function validationReport(kind: ValidationReport['kind'], path: string, detail: string): ValidationReport {
  return { kind, path, detail, valid: true };
}
