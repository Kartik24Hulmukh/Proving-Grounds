/**
 * Trial Runner Worker — P3
 *
 * Pulls trial jobs from the Redis queue and executes them via the arena.
 * In production this runs as a separate process. For P3 verification,
 * we run it directly via tsx.
 */

import { runTrial } from "@/lib/arena/runner";

export interface TrialJob {
  trialId: string;
  agentVersionId: string;
  scenarioSlug: string;
  adapterKey: string;
  egressAllowlist?: string[];
  costCapCents?: number;
  timeoutMs?: number;
}

/**
 * Process a single trial job.
 * Used by the worker loop and by the verification script.
 */
export async function processTrialJob(job: TrialJob) {
  console.log(`▶ Processing trial job: ${job.trialId}`);
  console.log(`  Scenario: ${job.scenarioSlug}`);
  console.log(`  Adapter: ${job.adapterKey}`);

  const result = await runTrial({
    trialId: job.trialId,
    agentVersionId: job.agentVersionId,
    scenarioSlug: job.scenarioSlug,
    adapterKey: job.adapterKey,
    egressAllowlist: job.egressAllowlist,
    costCapCents: job.costCapCents,
    timeoutMs: job.timeoutMs,
  });

  console.log(`  Status: ${result.status}`);
  console.log(`  Duration: ${result.durationMs}ms`);
  console.log(`  Cost: ${result.costCents} cents`);
  console.log(`  Rule oracle: ${result.ruleOraclePassed ? "PASS" : "FAIL"}`);
  if (result.hardFailViolations.length > 0) {
    console.log(`  Hard-fail violations: ${result.hardFailViolations.join(", ")}`);
  }
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }

  return result;
}
