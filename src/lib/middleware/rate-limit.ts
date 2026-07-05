/**
 * Rate limiting middleware — P7.3
 *
 * Applies Upstash rate limiting to public + intake routes.
 * Returns 429 when the rate limit is exceeded.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicRatelimit } from "@/lib/redis/client";

// Routes that require rate limiting
const RATE_LIMITED_ROUTES = [
  "/api/health",
  "/api/intake",
  "/leaderboard",
  "/methodology",
  "/submit",
];

export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Check if this route needs rate limiting
  const needsLimiting = RATE_LIMITED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!needsLimiting) {
    return null; // No rate limiting needed
  }

  try {
    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    const { success, reset } = await publicRatelimit().limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please slow down.",
          resetAt: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  } catch (e) {
    // R4.3: Fail CLOSED — Redis unavailable means we DENY, not allow.
    // Never fail open on a security control.
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[rate-limit] Redis unavailable — failing CLOSED (denying request): ${msg}`);
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        message: "Rate limiter is unavailable. Please try again later.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Error": "redis-unavailable",
        },
      }
    );
  }

  return null; // Continue to the route handler
}
