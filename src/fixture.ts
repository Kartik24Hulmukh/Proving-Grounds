import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { cp, mkdtemp, rm } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  return String(stdout).trim();
}

export interface FixtureRepository {
  repoRoot: string;
  baseSha: string;
  headSha: string;
  claimsPath: string;
}

export async function buildFixtureRepository(templateRoot: string, outputRoot: string): Promise<FixtureRepository> {
  const repoRoot = await mkdtemp(join(outputRoot, 'fixture-'));
  await cp(join(templateRoot, 'base'), repoRoot, { recursive: true, force: true });

  await git(repoRoot, ['init', '-b', 'main']);
  await git(repoRoot, ['config', 'user.email', 'codex@example.com']);
  await git(repoRoot, ['config', 'user.name', 'Codex']);
  await git(repoRoot, ['add', '.']);
  await git(repoRoot, ['commit', '-m', 'base']);
  const baseSha = await git(repoRoot, ['rev-parse', 'HEAD']);

  await cp(join(templateRoot, 'head'), repoRoot, { recursive: true, force: true });
  await git(repoRoot, ['add', '-A']);
  await git(repoRoot, ['commit', '-m', 'head']);
  const headSha = await git(repoRoot, ['rev-parse', 'HEAD']);

  return {
    repoRoot,
    baseSha,
    headSha,
    claimsPath: join(templateRoot, 'claims.yml'),
  };
}

export async function cleanupFixtureRepository(repoRoot: string): Promise<void> {
  await rm(repoRoot, { recursive: true, force: true });
}
