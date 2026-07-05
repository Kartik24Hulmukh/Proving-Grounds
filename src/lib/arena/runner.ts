/**
 * Arena — Isolated Trial Runner — P3 / R2 (Blocker 2).
 *
 * Runs a trial inside an isolated sandbox with:
 *   - Egress allowlist enforcement (P3.1)
 *   - Timeout cap (P3.3)
 *   - Cost cap (P3.3)
 *   - trial + trial_step rows persisted (P3.4)
 *   - Sandbox destroyed after trial (P3.5)
 *   - Real evidence capture from Playwright adapter (R2)
 *
 * The arena is agent-agnostic: it uses the adapter contract to drive
 * any registered agent against a scenario. The adapter is selected by key
 * from agent_version.adapter_config (R2.4) — no hardcoded adapter.
 */

import { neon } from "@neondatabase/serverless";
import type { TrialContext, AgentResult } from "@/lib/adapters/contract";
import { getAdapter } from "@/lib/adapters/simulated-browser";
import { PlaywrightBrowserAdapter, type PlaywrightEvidencePaths } from "@/lib/adapters/playwright-browser";
import { getScenarioBySlug } from "@/lib/scenarios/seeds";
import { actionsToActionLog } from "@/lib/adapters/contract";
import { runRuleOracle } from "@/lib/scenarios/schema";
import { uploadEvidence, type UploadResult } from "@/lib/blob/client";
import { readFileSync, existsSync } from "node:fs";

export interface TrialRunResult {
  trialId: string;
  status: "completed" | "timeout" | "failed" | "quarantined";
  agentResult: AgentResult | null;
  ruleOraclePassed: boolean;
  hardFailViolations: string[];
  costCents: number;
  durationMs: number;
  evidenceUploaded: number;
  error?: string;
}

/**
 * Default egress allowlist for trials.
 * Only arena.local fixture pages + localhost (for local target testing) are allowed.
 */
export const DEFAULT_EGRESS_ALLOWLIST = [
  "arena.local",
  "localhost",
  "127.0.0.1",
];

export const DEFAULT_COST_CAP_CENTS = 500;
export const DEFAULT_TIMEOUT_MS = 180000;

/**
 * Run a trial end-to-end inside the arena.
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

  const sql = neon(process.env.DATABASE_URL!);
  const startTime = Date.now();
  let agentResult: AgentResult | null = null;
  let status: TrialRunResult["status"] = "completed";
  let errorMessage: string | undefined;
  let evidenceUploaded = 0;

  try {
    // 1. Update trial to running
    await sql`UPDATE trial SET status = 'running', started_at = now(), sandbox_kind = 'container' WHERE id = ${trialId}`;

    // 2. Get scenario + adapter (selected by key — R2.4, no hardcoding)
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

    // 4. Initialize adapter (provisions sandbox/browser)
    const session = await adapter.init(ctx);

    // Get evidence paths if the adapter exposes them (Playwright adapter)
    const sessionAny = session as unknown as { getEvidencePaths?: () => PlaywrightEvidencePaths };
    let evidencePaths: PlaywrightEvidencePaths | null = null;
    if (typeof sessionAny.getEvidencePaths === "function") {
      evidencePaths = sessionAny.getEvidencePaths();
    }

    try {
      // 5. Run the task with timeout enforcement
      const task = {
        startUrl: scenario.spec.startUrl,
        goal: scenario.spec.goal,
        traps: scenario.spec.traps,
        timeoutMs,
      };

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

      // 7. Capture + upload real evidence (R2.2, R2.3)
      if (evidencePaths) {
        evidenceUploaded = await uploadRealEvidence(trialId, evidencePaths, sql);
      }

      // 8. Run rule-oracle
      const actionLog = actionsToActionLog(agentResult.actions);
      const oracleResult = runRuleOracle(scenario.oracle, actionLog);

      // 9. Update trial with results
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
        evidenceUploaded,
      };
    } finally {
      // 10. Destroy sandbox (P3.5, R2.6) — browser is closed in adapter's finally
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
      evidenceUploaded,
      error: errorMessage,
    };
  }
}

/**
 * Upload real evidence artifacts from the Playwright adapter to Vercel Blob.
 * Computes SHA-256 over the ACTUAL file bytes (R2.3).
 * No synthetic generation — reads real files from disk (R2.5).
 */
async function uploadRealEvidence(
  trialId: string,
  paths: PlaywrightEvidencePaths,
  sql: { (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> }
): Promise<number> {
  let count = 0;

  const artifacts: Array<{ kind: string; path: string; contentType: string }> = [
    { kind: "video", path: paths.videoPath, contentType: "video/webm" },
    { kind: "trace", path: paths.tracePath, contentType: "application/zip" },
    { kind: "har", path: paths.harPath, contentType: "application/json" },
    { kind: "dom", path: paths.domPath, contentType: "text/html" },
    { kind: "log", path: paths.logPath, contentType: "application/json" },
  ];

  for (const artifact of artifacts) {
    if (!existsSync(artifact.path)) continue;

    const data = readFileSync(artifact.path);
    const result = await uploadEvidence(
      `trials/${trialId}/${artifact.kind}-${trialId}`,
      data,
      artifact.contentType
    );

    await sql`
      INSERT INTO evidence (trial_id, kind, url, bytes, sha256)
      VALUES (${trialId}, ${artifact.kind}, ${result.url}, ${result.bytes}, ${result.sha256})
    `;
    count++;
  }

  return count;
}

/**
 * Verify egress allowlist enforcement (P3.1).
 */
export function isEgressAllowed(host: string, allowlist: string[]): boolean {
  const normalizedHost = host.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return allowlist.some(
    (allowed) =>
      normalizedHost === allowed.toLowerCase() ||
      normalizedHost.endsWith("." + allowed.toLowerCase())
  );
}
