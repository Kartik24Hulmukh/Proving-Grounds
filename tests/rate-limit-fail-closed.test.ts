/**
 * R5.1 Test: Rate-limiter fail-closed (mock Redis down)
 *
 * Verifies that when Redis is unavailable, the rate limiter denies
 * requests (503) instead of allowing them through (fail-open).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/redis/client", () => {
  const mockRatelimit = {
    limit: vi.fn().mockRejectedValue(new Error("Redis connection refused")),
  };
  return {
    getRedis: vi.fn(() => { throw new Error("Redis unreachable"); }),
    pingRedis: vi.fn(async () => ({ ok: false, error: "Redis unreachable" })),
    createRatelimit: vi.fn(() => mockRatelimit),
    publicRatelimit: vi.fn(() => mockRatelimit),
    intakeRatelimit: vi.fn(() => mockRatelimit),
  };
});

describe("Rate-limiter fail-closed (Redis down)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rate-limit middleware returns 503 when Redis is down", async () => {
    const { rateLimitMiddleware } = await import("@/lib/middleware/rate-limit");
    const mockRequest = {
      nextUrl: { pathname: "/api/health" },
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
    } as any;
    const response = await rateLimitMiddleware(mockRequest);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(503);
  });

  it("rate-limit middleware returns 503 for /api/intake when Redis is down", async () => {
    const { rateLimitMiddleware } = await import("@/lib/middleware/rate-limit");
    const mockRequest = {
      nextUrl: { pathname: "/api/intake" },
      headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
    } as any;
    const response = await rateLimitMiddleware(mockRequest);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(503);
  });

  it("rate-limit middleware does not limit non-listed routes", async () => {
    const { rateLimitMiddleware } = await import("@/lib/middleware/rate-limit");
    const mockRequest = {
      nextUrl: { pathname: "/api/evidence/123" },
      headers: new Headers(),
    } as any;
    const response = await rateLimitMiddleware(mockRequest);
    expect(response).toBeNull();
  });

  it("pingRedis returns ok=false when Redis is unreachable", async () => {
    const { pingRedis } = await import("@/lib/redis/client");
    const result = await pingRedis();
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Rate-limiter fail-closed — intake route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("intake rate limiter throws when Redis is down (triggers 503 fail-closed)", async () => {
    const { intakeRatelimit } = await import("@/lib/redis/client");
    const limiter = intakeRatelimit();
    await expect(limiter.limit("test-ip")).rejects.toThrow("Redis connection refused");
  });
});
