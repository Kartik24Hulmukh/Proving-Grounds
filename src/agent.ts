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
