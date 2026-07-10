import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildFixtureRepository, cleanupFixtureRepository } from '../src/fixture.js';
import { replayCapsule, verifyEvidence, attachAgentMetadata } from '../src/engine.js';
import { validateCapsule } from '../src/capsule.js';
import { emitAgentClaimsBundle } from '../src/agent.js';
import { runStableProbe } from '../src/runner.js';

async function withFixture(name: string, fn: (repo: Awaited<ReturnType<typeof buildFixtureRepository>>, sandboxRoot: string) => Promise<void>) {
  const sandboxRoot = await mkdtemp(join(tmpdir(), 'evidence-fixture-'));
  const fixture = await buildFixtureRepository(resolve(`fixtures/${name}`), sandboxRoot);
  try {
    await fn(fixture, sandboxRoot);
  } finally {
    await cleanupFixtureRepository(fixture.repoRoot);
    await rm(sandboxRoot, { recursive: true, force: true });
  }
}

test('auth fixture demonstrates the intended delta and replays cleanly', async () => {
  await withFixture('auth', async (fixture, sandboxRoot) => {
    const outputDir = join(sandboxRoot, '.evidence');
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir,
      attempts: 1,
    });

    assert.equal(result.capsule.claims[0]?.base, 'fail');
    assert.equal(result.capsule.claims[0]?.head, 'pass');
    assert.equal(result.capsule.claims[0]?.verdict, 'demonstrated');
    assert.ok(result.capsule.integrity.capsuleHash.match(/^[a-f0-9]{64}$/));

    const replay = await replayCapsule(result.capsulePath);
    assert.equal(replay.verified, true);
    assert.equal(replay.capsule.integrity.capsuleHash, result.capsule.integrity.capsuleHash);

    const loaded = validateCapsule(JSON.parse(await readFile(result.capsulePath, 'utf8')));
    assert.equal(loaded.summary.demonstrated, 1);
  });
});

test('off-by-one fixture catches a boundary bug', async () => {
  await withFixture('off-by-one', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    assert.equal(result.capsule.claims[0]?.base, 'fail');
    assert.equal(result.capsule.claims[0]?.head, 'pass');
    assert.equal(result.capsule.claims[0]?.verdict, 'demonstrated');
  });
});

test('vacuous fixture stays vacuous', async () => {
  await withFixture('vacuous', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    assert.equal(result.capsule.claims[0]?.base, 'pass');
    assert.equal(result.capsule.claims[0]?.head, 'pass');
    assert.equal(result.capsule.claims[0]?.verdict, 'vacuous');
  });
});

test('timeout fixture becomes inconclusive', async () => {
  await withFixture('timeout', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    assert.equal(result.capsule.claims[0]?.base, 'unknown');
    assert.equal(result.capsule.claims[0]?.head, 'unknown');
    assert.equal(result.capsule.claims[0]?.verdict, 'inconclusive');
  });
});

test('nondeterministic probes become inconclusive', async () => {
  const sandboxRoot = await mkdtemp(join(tmpdir(), 'evidence-flaky-'));
  try {
    await writeFile(
      join(sandboxRoot, 'flip.mjs'),
      `
        import { readFileSync, writeFileSync, existsSync } from 'node:fs';
        const statePath = new URL('./state.txt', import.meta.url);
        const attempt = existsSync(statePath) ? Number(readFileSync(statePath, 'utf8')) : 0;
        writeFileSync(statePath, String(attempt + 1));
        process.exit(attempt % 2 === 0 ? 0 : 1);
      `,
      'utf8',
    );

    const result = await runStableProbe(['node', 'flip.mjs'], {
      cwd: sandboxRoot,
      timeoutMs: 1000,
      attempts: 2,
    });

    assert.equal(result.outcome, 'unknown');
    assert.equal(result.attempts.length, 2);
  } finally {
    await rm(sandboxRoot, { recursive: true, force: true });
  }
});

test('redaction fixture keeps secrets out of captured probe output', async () => {
  await withFixture('redaction', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    const baseAttempt = result.capsule.claims[0]?.baseAttempts[0];
    const headAttempt = result.capsule.claims[0]?.headAttempts[0];
    assert.ok(baseAttempt);
    assert.ok(headAttempt);
    assert.equal(baseAttempt.stdout.includes('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890AB'), false);
    assert.equal(headAttempt.stdout.includes('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890AB'), false);
    assert.equal(baseAttempt.stdout.includes('[redacted]'), true);
    assert.equal(headAttempt.stdout.includes('[redacted]'), true);
    assert.equal(result.capsule.claims[0]?.verdict, 'demonstrated');
  });
});

test('HTML report mirrors capsule verdicts and stays self-contained', async () => {
  await withFixture('auth', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    const html = await readFile(result.reportPath, 'utf8');
    assert.equal(html.includes('https://'), false);
    assert.equal(html.includes('http://'), false);
    assert.equal(html.includes(result.capsule.claims[0]?.verdict ?? ''), true);
    assert.equal(html.includes(String(result.capsule.summary.demonstrated)), true);
    assert.equal(html.includes(String(result.capsule.summary.regression)), true);
    assert.equal(html.includes(String(result.capsule.summary.vacuous)), true);
    assert.equal(html.includes(String(result.capsule.summary.inconclusive)), true);
  });
});

test('agent metadata can be attached without changing the capsule hash contract', async () => {
  await withFixture('auth', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    const updated = await attachAgentMetadata(result.capsulePath);
    const generatedBy = updated.generatedBy as { name?: string };
    assert.equal((generatedBy.name ?? '').length > 0, true);
    assert.equal(updated.repository.baseSha, result.capsule.repository.baseSha);
  });
});

test('agent bundle emits claims and attaches capsule provenance', async () => {
  await withFixture('auth', async (fixture, sandboxRoot) => {
    const result = await verifyEvidence({
      repoRoot: fixture.repoRoot,
      baseRef: fixture.baseSha,
      headRef: fixture.headSha,
      claimsPath: fixture.claimsPath,
      outputDir: join(sandboxRoot, '.evidence'),
      attempts: 1,
    });

    const bundle = await emitAgentClaimsBundle(fixture.claimsPath, result.capsulePath);
    assert.equal(bundle.claims.claims.length, 1);
    assert.equal(bundle.capsule?.integrity.capsuleHash, result.capsule.integrity.capsuleHash);
  });
});
