import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { generateMutations } from '../src/mutation.js';
import { validatePolicy, evaluatePolicy } from '../src/policy.js';
import { validatePluginManifest } from '../src/plugin.js';
import { buildFixtureRepository, cleanupFixtureRepository } from '../src/fixture.js';
import { verifyEvidence } from '../src/engine.js';
import { readStructuredText } from '../src/utils.js';

test('mutation engine emits the documented operators', () => {
  const source = `
    export async function probe(score: number) {
      if (score > 10 && score < 20) {
        await Promise.resolve();
        return true;
      }
      return false;
    }
  `;
  const mutants = generateMutations(source, 'probe.ts');
  const operators = new Set(mutants.map((mutant) => mutant.operator));
  assert.ok(operators.has('boolean_flip'));
  assert.ok(operators.has('comparison_inversion'));
  assert.ok(operators.has('boundary_change'));
  assert.ok(operators.has('branch_removal'));
  assert.ok(operators.has('await_removal'));
  assert.ok(operators.has('return_substitution'));
});

test('policy evaluation rejects regressions and excessive vacuity', () => {
  const policy = validatePolicy({
    evidencePolicyVersion: '0.1',
    requireCapsule: true,
    maximumRegressions: 0,
    maximumVacuousIntendedClaims: 0,
    allowInconclusive: false,
    requireReplay: true,
  });

  const capsule = {
      version: '0.1',
      createdAt: new Date().toISOString(),
      repository: {
        root: process.cwd(),
        baseRef: 'base',
        headRef: 'head',
        baseSha: 'base',
        headSha: 'head',
        claimsPath: 'claims.yml',
      },
      claims: [],
      summary: { demonstrated: 0, regression: 1, vacuous: 0, inconclusive: 0 },
      artifacts: {},
      generatedBy: {
        name: 'test',
        pid: 1,
        cwd: process.cwd(),
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      replay: { command: ['evidence', 'replay', 'capsule.json'], workingDirectory: process.cwd() },
      integrity: { capsuleHash: '0'.repeat(64) },
    } as unknown as Parameters<typeof evaluatePolicy>[0];
  const decision = evaluatePolicy(capsule, policy);

  assert.equal(decision.accepted, false);
  assert.ok(decision.reasons.some((reason) => reason.includes('regressions')));
});

test('plugin manifest validation accepts the documented shape', () => {
  const manifest = validatePluginManifest({
    id: 'runner.local',
    version: '0.1.0',
    kind: 'runner',
    license: 'MIT',
    capabilities: ['verify', 'replay'],
  });
  assert.equal(manifest.kind, 'runner');
});

test('policy fixture is enforced against the auth fixture', async () => {
  const sandboxRoot = await mkdtemp(join(tmpdir(), 'evidence-policy-'));
  const fixture = await buildFixtureRepository(resolve('fixtures/auth'), sandboxRoot);
  try {
    const policy = await readStructuredText(resolve('fixtures/policy/strict.yml'));
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      policyPath: resolve('fixtures/policy/strict.yml'),
      attempts: 1,
    });

    assert.equal(result.policyResult?.accepted, true);
    assert.equal(result.capsule.summary.demonstrated, 1);
    assert.equal((policy as { requireCapsule: boolean }).requireCapsule, true);
  } finally {
    await cleanupFixtureRepository(fixture.repoRoot);
    await rm(sandboxRoot, { recursive: true, force: true });
  }
});

test('plugin adapter fixture validates as an external-style runner', async () => {
  const manifest = validatePluginManifest(
    await readStructuredText(resolve('fixtures/adapters/echo-runner/plugin.json')),
  );
  assert.equal(manifest.id, 'echo-runner');
});
