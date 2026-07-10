import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildFixtureRepository, cleanupFixtureRepository } from '../src/fixture.js';
import { replayCapsule, verifyEvidence, attachAgentMetadata } from '../src/engine.js';
import { validateCapsule } from '../src/capsule.js';

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
