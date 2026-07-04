/**
 * Upstash Redis client — used for the trial job queue, rate limiting,
 * and per-trial budget guards.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit, type Duration } from "@upstash/ratelimit";

/**
 * Get the shared Redis client (singleton per process).
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
