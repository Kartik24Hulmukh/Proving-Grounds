/**
 * Per-trial budget guard — P7.4
 *
 * Blocks runaway spend by tracking cost per trial in Redis.
 * If a trial exceeds its budget cap, it is aborted.
 */

import { getRedis } from "@/lib/redis/client";

export interface BudgetGuard {
  trialId: string;
  budgetCents: number;
  spentCents: number;
  remaining: number;
  exceeded: boolean;
}

/**
 * Check and increment the budget for a trial.
 * Returns the updated budget state.
 */
export async function checkTrialBudget(
  trialId: string,
  additionalCostCents: number,
  budgetCapCents: number
): Promise<BudgetGuard> {
  const redis = getRedis();
  const key = `pg:budget:${trialId}`;

  // Atomically increment the spent amount
  const spent = await redis.incrby(key, additionalCostCents);

  // Set TTL so budget keys expire (24h)
  await redis.expire(key, 86400);

  const exceeded = spent > budgetCapCents;
  const remaining = Math.max(0, budgetCapCents - spent);

  return {
    trialId,
    budgetCents: budgetCapCents,
    spentCents: spent,
    remaining,
    exceeded,
  };
}

/**
 * Get the current budget state for a trial without incrementing.
 */
export async function getTrialBudget(
  trialId: string,
  budgetCapCents: number
): Promise<BudgetGuard> {
  const redis = getRedis();
  const key = `pg:budget:${trialId}`;
  const spent = parseInt((await redis.get(key)) ?? "0", 10);

  return {
    trialId,
    budgetCents: budgetCapCents,
    spentCents: spent,
    remaining: Math.max(0, budgetCapCents - spent),
    exceeded: spent > budgetCapCents,
  };
}

/**
 * Reset the budget for a trial (used on re-run).
 */
export async function resetTrialBudget(trialId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`pg:budget:${trialId}`);
}
