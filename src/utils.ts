import { createHash } from 'node:crypto';
import { dirname, extname, isAbsolute, resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import YAML from 'yaml';

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  const ordered: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    ordered[key] = sortValue(nested);
  }
  return ordered;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function canonicalHash(value: unknown): string {
  return sha256(canonicalJson(value));
}

export async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readStructuredText<T>(path: string): Promise<T> {
  const text = await readFile(path, 'utf8');
  const ext = extname(path).toLowerCase();
  if (ext === '.yml' || ext === '.yaml') {
    return YAML.parse(text) as T;
  }
  return JSON.parse(text) as T;
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await ensureDirectory(dirname(path));
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function toAbsolutePath(path: string, base = process.cwd()): string {
  return isAbsolute(path) ? path : resolve(base, path);
}

export function assertInside(root: string, candidate: string): void {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  if (normalizedCandidate === normalizedRoot) {
    return;
  }
  const prefix = normalizedRoot.endsWith('\\') || normalizedRoot.endsWith('/') ? normalizedRoot : `${normalizedRoot}${root.includes('/') ? '/' : '\\'}`;
  if (!normalizedCandidate.startsWith(prefix)) {
    throw new Error(`Path escapes workspace root: ${candidate}`);
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function joinCommand(command: string[]): string {
  return command
    .map((part) => (/^[a-zA-Z0-9._\-/:\\]+$/.test(part) ? part : JSON.stringify(part)))
    .join(' ');
}

export function millis(start: bigint, end: bigint): number {
  return Number((end - start) / 1_000_000n);
}
