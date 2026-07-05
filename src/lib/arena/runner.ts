/**
 * Arena — Isolated Trial Runner — P3
 *
 * Runs a trial inside an isolated sandbox with:
 *   - Egress allowlist enforcement (P3.1)
 *   - Timeout cap (P3.3)
 *   - Cost cap (P3.3)
 *   - trial + trial_step rows persisted (P3.4)
 *   - Sandbox destroyed after trial (P3.5)
 *
 * The arena is agent-agnostic: it uses the adapter contract to drive
 * any registered agent against a scenario.
 */

import { neon } from "@neondatabase/serverless";
import { trial, trialStep } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import type { TrialContext, AgentResult, AgentAction } from "@/lib/adapters/contract";
import { getAdapter } from "@/lib/adapters/simulated-browser";
import { getScenarioBySlug } from "@/lib/scenarios/seeds";
import { actionsToActionLog } from "@/lib/adapters/contract";
import { runRuleOracle } from "@/lib/scenarios/schema";

export interface TrialRunResult {
  trialId: string;
  status: "completed" | "timeout" | "failed" | "quarantined";
  agentResult: AgentResult | null;
  ruleOraclePassed: boolean;
  hardFailViolations: string[];
  costCents: number;
  durationMs: number;
  error?: string;
}

/**
 * Default egress allowlist for trials.
 * Only arena.local fixture pages are allowed.
 * Any attempt to contact a non-allowlisted host fails closed (P3.1).
 */
export const DEFAULT_EGRESS_ALLOWLIST = [
  "arena.local",
  "localhost",
  "127.0.0.1",
];

/**
 * Default cost cap per trial (in cents).
 */
export const DEFAULT_COST_CAP_CENTS = 500; // $5.00

/**
 * Default timeout per trial (in milliseconds).
 */
export const DEFAULT_TIMEOUT_MS = 180000; // 3 minutes

/**
 * Run a trial end-to-end inside the arena.
 *
 * 1. Create trial row (status=running)
 * 2. Initialize adapter with trial context
 * 3. Run adapter against scenario
 * 4. Record trial_step rows
 * 5. Run rule-oracle
 * 6. Update trial row (status=completed/timeout/failed)
 * 7. Destroy sandbox (close adapter)
 */
export async function runTrial(params: {
  trialId: string;
  agentVersionId: string;
  scenarioSlug: string;
  adapterKey: string;
  egressAllowlist?: string[];
  costCapCents?: number;
  timeoutMs?: number;
}): Promise<TrialRunResult> {
  const {
    trialId,
    scenarioSlug,
    adapterKey,
    egressAllowlist = DEFAULT_EGRESS_ALLOWLIST,
    costCapCents = DEFAULT_COST_CAP_CENTS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = params;

  const db = getDb();
  const sql = neon(process.env.DATABASE_URL!);
  const startTime = Date.now();
  let agentResult: AgentResult | null = null;
  let status: TrialRunResult["status"] = "completed";
  let errorMessage: string | undefined;

  try {
    // 1. Update trial to running
    await sql`UPDATE trial SET status = 'running', started_at = now(), sandbox_kind = 'container' WHERE id = ${trialId}`;

    // 2. Get scenario + adapter
    const scenario = getScenarioBySlug(scenarioSlug);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioSlug}`);
    }

    const adapter = getAdapter(adapterKey);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterKey}`);
    }

    // 3. Build trial context
    const ctx: TrialContext = {
      trialId,
      scenarioSlug,
      startUrl: scenario.spec.startUrl,
      goal: scenario.spec.goal,
      timeoutMs,
      egressAllowlist,
      costCapCents,
    };

    // 4. Initialize adapter (provisions sandbox)
    const session = await adapter.init(ctx);

    try {
      // 5. Run the task with timeout enforcement
      const task = {
        startUrl: scenario.spec.startUrl,
        goal: scenario.spec.goal,
        traps: scenario.spec.traps,
        timeoutMs,
      };

      // Race the adapter against the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Trial timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      });

      agentResult = await Promise.race([
        session.run(task),
        timeoutPromise,
      ]);

      // 6. Record trial_step rows
      for (let i = 0; i < agentResult.actions.length; i++) {
        const action = agentResult.actions[i];
        const actionJson = JSON.stringify({
          type: action.type,
          description: action.description,
          selector: action.selector,
          value: action.value,
          url: action.url,
          result: action.result,
        });
        await sql`
          INSERT INTO trial_step (trial_id, idx, ts, actor, action)
          VALUES (${trialId}, ${i}, ${new Date(action.timestamp)}::timestamptz, 'agent', ${actionJson}::jsonb)
        `;
      }

      // 7. Run rule-oracle
      const actionLog = actionsToActionLog(agentResult.actions);
      const oracleResult = runRuleOracle(scenario.oracle, actionLog);

      // 8. Update trial with results
      const durationMs = Date.now() - startTime;
      await sql`UPDATE trial SET status = 'completed', finished_at = now(), cost_cents = ${agentResult.costCents} WHERE id = ${trialId}`;

      return {
        trialId,
        status: "completed",
        agentResult,
        ruleOraclePassed: oracleResult.passed,
        hardFailViolations: oracleResult.hardFailViolations,
        costCents: agentResult.costCents,
        durationMs,
      };
    } finally {
      // 9. Destroy sandbox (P3.5)
      await session.close();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    status = msg.includes("timed out") ? "timeout" : "failed";
    errorMessage = msg;

    const durationMs = Date.now() - startTime;
    const costVal = agentResult?.costCents ?? 0;
    await sql`UPDATE trial SET status = ${status}, finished_at = now(), error = ${msg}, cost_cents = ${costVal} WHERE id = ${trialId}`;

    return {
      trialId,
      status,
      agentResult,
      ruleOraclePassed: false,
      hardFailViolations: [],
      costCents: agentResult?.costCents ?? 0,
      durationMs,
      error: errorMessage,
    };
  }
}

/**
 * Verify egress allowlist enforcement (P3.1).
 * A blocked host test must fail closed.
 */
export function isEgressAllowed(host: string, allowlist: string[]): boolean {
  const normalizedHost = host.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return allowlist.some(
    (allowed) =>
      normalizedHost === allowed.toLowerCase() ||
      normalizedHost.endsWith("." + allowed.toLowerCase())
  );
}
