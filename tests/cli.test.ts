import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, rm } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

test('demo command emits a stable auth run and writes the capsule file', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'demo'], {
    cwd: process.cwd(),
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });

  const payload = JSON.parse(stdout.trim());
  assert.equal(payload.kind, 'demo');
  assert.equal(payload.stable, true);
  assert.equal(payload.runs.length, 5);

  const capsule = JSON.parse(await readFile('demo-capsule.json', 'utf8'));
  assert.equal(capsule.claims[0].verdict, 'demonstrated');
  await rm('demo-capsule.json', { force: true });
});
