/**
 * Agent Adapter Contract — P3
 *
 * Every agent product is wrapped to a uniform interface so the runner
 * is agent-agnostic. Reference adapters: browser-use, stagehand.
 * AGPL agents (e.g. Skyvern) are tested via network/CLI boundary,
 * never imported into the codebase (G.1).
 */

import type { ActionLog } from "@/lib/scenarios/schema";

export interface TrialContext {
  trialId: string;
  scenarioSlug: string;
  startUrl: string;
  goal: string;
  timeoutMs: number;
  /** Egress allowlist — only these hosts may be contacted */
  egressAllowlist: string[];
  /** Cost cap in cents — adapter should abort if exceeded */
  costCapCents: number;
}

export interface ScenarioTask {
  startUrl: string;
  goal: string;
  traps: string[];
  timeoutMs: number;
}

export interface AgentAction {
  type: string;
  description?: string;
  selector?: string;
  value?: string;
  url?: string;
  result?: string;
  timestamp: string;
}

export interface AgentResult {
  finalAnswer?: string;
  actions: AgentAction[];
  refused?: boolean;
  costCents: number;
}

export interface AgentSession {
  run(task: ScenarioTask): Promise<AgentResult>;
  close(): Promise<void>;
}

export interface AgentAdapter {
  key: string;
  init(ctx: TrialContext): Promise<AgentSession>;
}

/**
 * Convert AgentAction[] to the ActionLog format expected by the rule oracle.
 */
export function actionsToActionLog(actions: AgentAction[]): ActionLog {
  return actions.map((a, idx) => ({
    idx,
    ts: a.timestamp,
    actor: "agent",
    action: {
      type: a.type,
      description: a.description,
      selector: a.selector,
      value: a.value,
      url: a.url,
      result: a.result,
    },
    description: a.description,
  }));
}
