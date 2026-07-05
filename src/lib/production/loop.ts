/**
 * Production loop — P8
 *
 * Closes the loop: scheduled re-runs, leaderboard freshness,
 * graceful failure handling (sandbox crash, adapter hang, judge error
 * => quarantined trial, not a bad verdict).
 */

import { neon } from "@neondatabase/serverless";
import { runTrial } from "@/lib/arena/runner";
import { judgeTrial, persistVerdict, recomputeLeaderboard } from "@/lib/judge/judge";
import { getScenarioBySlug } from "@/lib/scenarios/seeds";
import { actionsToActionLog } from "@/lib/adapters/contract";
import { captureError } from "@/lib/sentry/sentry";
import { startTrialSpan, endTrialSpan } from "@/lib/otel/tracing";

/**
 * P8.1: Run a scheduled re-run of all approved products against all active scenarios.
 * Produces a fresh leaderboard snapshot.
 */
export async function scheduledRerun(): Promise<{
  trialsRun: number;
  verdictsProduced: number;
  leaderboardUpdated: boolean;
}> {
  const databaseUrl = process.env.DATABASE_URL!;
  const sql = neon(databaseUrl);

  // Get all approved products with their latest agent_version
  const products = await sql`
    SELECT
      av.id as agent_version_id,
      p.adapter_key,
      av.label as version_label
    FROM product p
    JOIN agent_version av ON av.product_id = p.id
    WHERE p.status = 'approved'
    ORDER BY av.created_at DESC
  `;

  // Get all active scenarios
  const scenarios = await sql`
    SELECT slug FROM scenario WHERE active = true
  `;

  let trialsRun = 0;
  let verdictsProduced = 0;

  for (const product of products) {
    for (const scenario of scenarios) {
      const scenarioSlug = scenario.slug as string;

      // Create trial
      const scenarioRows = await sql`SELECT id FROM scenario WHERE slug = ${scenarioSlug} LIMIT 1`;
      const scenarioId = scenarioRows[0].id as string;

      const trialRows = await sql`
        INSERT INTO trial (agent_version_id, scenario_id, status)
        VALUES (${product.agent_version_id}, ${scenarioId}, 'queued')
        RETURNING id
      `;
      const trialId = trialRows[0].id as string;

      // Run trial
      const result = await runTrial({
        trialId,
        agentVersionId: product.agent_version_id as string,
        scenarioSlug,
        adapterKey: product.adapter_key as string,
      });

      trialsRun++;

      // Judge if completed
      if (result.status === "completed" && result.agentResult) {
        const scenarioData = getScenarioBySlug(scenarioSlug);
        if (scenarioData) {
          const actionLog = actionsToActionLog(result.agentResult.actions);
          const judgeResult = await judgeTrial({
            oracle: scenarioData.oracle,
            actionLog,
            goal: scenarioData.spec.goal,
            scenarioTitle: scenarioData.spec.title,
            finalAnswer: result.agentResult.finalAnswer,
          });
          await persistVerdict(trialId, judgeResult);
          verdictsProduced++;
        }
      }
    }
  }

  // Recompute leaderboard
  await recomputeLeaderboard("all");
  const leaderboardUpdated = true;

  return { trialsRun, verdictsProduced, leaderboardUpdated };
}

/**
 * P8.2: Quarantine a trial when the sandbox is killed mid-trial.
 * The trial is NOT scored as a real fail — it's marked as quarantined.
 */
export async function quarantineTrial(trialId: string, reason: string): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE trial SET status = 'quarantined', error = ${reason}, finished_at = now()
    WHERE id = ${trialId}
  `;
  captureError(new Error(`Trial ${trialId} quarantined: ${reason}`), {
    trial: trialId,
    action: "quarantine",
  });
}

/**
 * P8.3: Handle adapter hang / judge error gracefully.
 * Returns a retryable error, not a crash.
 */
export async function handleTrialFailure(
  trialId: string,
  failureType: "adapter_hang" | "judge_error" | "sandbox_crash",
  error: Error
): Promise<{ quarantined: boolean; retryable: boolean }> {
  const span = startTrialSpan({
    trialId,
    scenarioSlug: "unknown",
    adapterKey: "unknown",
    sandboxKind: "container",
  });

  try {
    if (failureType === "judge_error") {
      // Judge errors are retryable — the trial itself may be fine
      await sql_updateTrialStatus(trialId, "completed", error.message);
      endTrialSpan(span, "error");
      return { quarantined: false, retryable: true };
    } else {
      // Adapter hang / sandbox crash → quarantine
      await quarantineTrial(trialId, `${failureType}: ${error.message}`);
      endTrialSpan(span, "error");
      return { quarantined: true, retryable: true };
    }
  } catch (e) {
    endTrialSpan(span, "error");
    captureError(e as Error, { trial: trialId, failureType });
    return { quarantined: true, retryable: false };
  }
}

async function sql_updateTrialStatus(trialId: string, status: string, errorMsg: string): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`UPDATE trial SET status = ${status}, error = ${errorMsg}, finished_at = now() WHERE id = ${trialId}`;
}

/**
 * P8.4: Load test — run N concurrent trials without queue deadlock.
 */
export async function loadTest(
  n: number,
  scenarioSlug: string = "form-fill-basic"
): Promise<{
  completed: number;
  failed: number;
  quarantined: number;
  totalDurationMs: number;
}> {
  const databaseUrl = process.env.DATABASE_URL!;
  const sql = neon(databaseUrl);

  // Get or create a test product
  let productRows = await sql`SELECT av.id as agent_version_id, p.adapter_key FROM product p JOIN agent_version av ON av.product_id = p.id WHERE p.adapter_key = 'simulated-browser' LIMIT 1`;
  let agentVersionId: string;
  let adapterKey: string;

  if (productRows.length === 0) {
    const pRows = await sql`
      INSERT INTO product (name, vendor, homepage, adapter_key, status, description)
      VALUES ('Load Test Agent', 'proving-grounds', 'https://arena.local', 'simulated-browser', 'approved', 'Load test')
      RETURNING id
    `;
    const vRows = await sql`
      INSERT INTO agent_version (product_id, label, adapter_config)
      VALUES (${pRows[0].id}, 'v1.0.0', ${JSON.stringify({})}::jsonb)
      RETURNING id
    `;
    agentVersionId = vRows[0].id as string;
    adapterKey = "simulated-browser";
  } else {
    agentVersionId = productRows[0].agent_version_id as string;
    adapterKey = productRows[0].adapter_key as string;
  }

  const scenarioRows = await sql`SELECT id FROM scenario WHERE slug = ${scenarioSlug} AND active = true LIMIT 1`;
  const scenarioId = scenarioRows[0].id as string;

  // Create N trials
  const trialIds: string[] = [];
  for (let i = 0; i < n; i++) {
    const rows = await sql`
      INSERT INTO trial (agent_version_id, scenario_id, status)
      VALUES (${agentVersionId}, ${scenarioId}, 'queued')
      RETURNING id
    `;
    trialIds.push(rows[0].id as string);
  }

  const startTime = Date.now();

  // Run all trials concurrently
  const results = await Promise.allSettled(
    trialIds.map((id) =>
      runTrial({
        trialId: id,
        agentVersionId,
        scenarioSlug,
        adapterKey,
        timeoutMs: 30000,
        costCapCents: 500,
      })
    )
  );

  const totalDurationMs = Date.now() - startTime;
  let completed = 0;
  let failed = 0;
  let quarantined = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.status === "completed") completed++;
      else if (result.value.status === "quarantined") quarantined++;
      else failed++;
    } else {
      failed++;
    }
  }

  return { completed, failed, quarantined, totalDurationMs };
}
