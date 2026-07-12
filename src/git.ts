import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { mkdir, rm } from 'node:fs/promises';
import { assertInside } from './utils.js';

const execFileAsync = promisify(execFile);

export interface WorktreeHandle {
  path: string;
  revision: string;
  sha: string;
}

export interface ChangedTypeScriptFile {
  path: string;
  ranges: Array<{ start: number; end: number }>;
}

async function git(repoRoot: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: repoRoot,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  return String(stdout).trim();
}

export async function ensureGitRepository(root: string): Promise<void> {
  await git(root, ['rev-parse', '--is-inside-work-tree']);
}

export async function resolveRevision(repoRoot: string, revision: string): Promise<string> {
  return await git(repoRoot, ['rev-parse', '--verify', `${revision}^{commit}`]);
}

export async function currentHeadSha(repoRoot: string): Promise<string> {
  return await git(repoRoot, ['rev-parse', 'HEAD']);
}

export async function createWorktree(repoRoot: string, revision: string, worktreesRoot: string, label: string): Promise<WorktreeHandle> {
  await mkdir(worktreesRoot, { recursive: true });
  const sha = await resolveRevision(repoRoot, revision);
  const worktreePath = resolve(worktreesRoot, `${label}-${sha.slice(0, 12)}-${randomUUID().slice(0, 8)}`);
  await rm(worktreePath, { recursive: true, force: true });
  await git(repoRoot, ['worktree', 'add', '--detach', '--force', worktreePath, sha]);
  return {
    path: worktreePath,
    revision,
    sha,
  };
}

export async function removeWorktree(repoRoot: string, handle: WorktreeHandle): Promise<void> {
  try {
    await git(repoRoot, ['worktree', 'remove', '--force', handle.path]);
  } catch {
    // Fall back to filesystem cleanup; worktree metadata may already be gone if the run was interrupted.
  }
  await rm(handle.path, { recursive: true, force: true });
}

export async function collectChangedTypeScriptFiles(repoRoot: string, baseRevision: string, headRevision: string): Promise<ChangedTypeScriptFile[]> {
  const diff = await git(repoRoot, ['diff', '--unified=0', '--no-color', baseRevision, headRevision, '--', '*.ts']);
  const files: ChangedTypeScriptFile[] = [];
  let current: ChangedTypeScriptFile | undefined;

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = undefined;
      continue;
    }
    if (line.startsWith('+++ b/')) {
      const filePath = line.slice('+++ b/'.length).trim();
      current = { path: filePath, ranges: [] };
      files.push(current);
      continue;
    }
    const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (match && current) {
      const start = Number(match[1]);
      const count = Number(match[2] ?? '1');
      if (count > 0) {
        current.ranges.push({ start, end: start + count - 1 });
      }
    }
  }

  return files.filter((file) => file.ranges.length > 0);
}

export function isInsideRoot(root: string, candidate: string): boolean {
  try {
    assertInside(root, candidate);
    return true;
  } catch {
    return false;
  }
}

export function normalizeRepoPath(repoRoot: string, filePath: string): string {
  const absolute = resolve(repoRoot, filePath);
  if (!isInsideRoot(repoRoot, absolute)) {
    throw new Error(`Path escapes repository root: ${filePath}`);
  }
  return absolute;
}

export function repoRelativePath(repoRoot: string, absolutePath: string): string {
  return relative(repoRoot, absolutePath);
}
