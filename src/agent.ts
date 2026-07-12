import { loadCapsule, loadClaimsDocument } from './schema.js';

export interface AgentContext extends Record<string, unknown> {
  name: string;
  pid: number;
  cwd: string;
  node: string;
  platform: string;
  arch: string;
}

export function detectAgentContext(): AgentContext {
  return {
    name: process.env.CODEX_AGENT_NAME ?? process.env.AGENT_NAME ?? 'codex',
    pid: process.pid,
    cwd: process.cwd(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

export function attachAgentContext<T extends Record<string, unknown>>(value: T): T & { generatedBy: AgentContext } {
  return {
    ...value,
    generatedBy: detectAgentContext(),
  };
}

export interface AgentClaimsBundle {
  generatedBy: AgentContext;
  claims: Awaited<ReturnType<typeof loadClaimsDocument>>;
  capsule?: {
    repository: Awaited<ReturnType<typeof loadCapsule>>['repository'];
    summary: Awaited<ReturnType<typeof loadCapsule>>['summary'];
    integrity: Awaited<ReturnType<typeof loadCapsule>>['integrity'];
  };
}

export async function emitAgentClaimsBundle(claimsPath: string, capsulePath?: string): Promise<AgentClaimsBundle> {
  const claims = await loadClaimsDocument(claimsPath);
  const bundle: AgentClaimsBundle = {
    generatedBy: detectAgentContext(),
    claims,
  };

  if (capsulePath) {
    const capsule = await loadCapsule(capsulePath);
    bundle.capsule = {
      repository: capsule.repository,
      summary: capsule.summary,
      integrity: capsule.integrity,
    };
  }

  return bundle;
}
