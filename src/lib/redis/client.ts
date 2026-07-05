/**
 * Upstash Redis client — used for the trial job queue, rate limiting,
 * and per-trial budget guards.
 *
 * R4: If Redis is unreachable/misconfigured, all rate-limited endpoints
 * must FAIL CLOSED (deny), never fail open.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit, type Duration } from "@upstash/ratelimit";

/**
 * Get the shared Redis client (singleton per process).
 * Throws if URL/token are missing — callers must catch and fail closed.
 */
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

/**
 * Ping Redis to check health. Returns true if reachable.
 * Used by the health endpoint and fail-closed tests.
 */
export async function pingRedis(): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = getRedis();
    const pong = await r.ping();
    return { ok: pong === "PONG" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Create a rate limiter for a given identifier prefix.
 * Uses a sliding window of `limit` requests per `windowSec` seconds.
 */
export function createRatelimit(
  prefix: string,
  limit: number,
  windowSec: Duration
): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, windowSec),
    prefix: `pg:${prefix}`,
    analytics: true,
  });
}

// Pre-configured limiters for public + intake routes
export const publicRatelimit = () => createRatelimit("public", 60, "60 s");
export const intakeRatelimit = () => createRatelimit("intake", 5, "60 s");
