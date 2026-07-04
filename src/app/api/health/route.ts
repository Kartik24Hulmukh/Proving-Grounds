/**
 * /api/health — P0.3
 *
 * Checks connectivity to all three infrastructure services:
 *   - Neon Postgres (DB)
 *   - Upstash Redis (queue/rate-limit)
 *   - Vercel Blob (evidence storage)
 *
 * Returns 200 with { db: ok, redis: ok, blob: ok } when all are healthy.
 * Returns 503 with partial status if any service is down.
 */

import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { getRedis } from "@/lib/redis/client";
import { listEvidence } from "@/lib/blob/client";
import { checkEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ServiceCheck {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

async function checkDb(): Promise<ServiceCheck> {
  try {
    const start = Date.now();
    const db = getDb();
    // Simple parameterized query — confirms connection + auth
    await db.execute(sql`SELECT 1 as ok`);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  try {
    const start = Date.now();
    const redis = getRedis();
    const result = await redis.ping();
    return { ok: result === "PONG", latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function checkBlob(): Promise<ServiceCheck> {
  try {
    const start = Date.now();
    // list() with an empty prefix confirms the token is valid
    await listEvidence();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function GET() {
  const envCheck = checkEnv();

  if (!envCheck.valid) {
    return NextResponse.json(
      {
        status: "degraded",
        env: { ok: false, missing: envCheck.missing },
        db: { ok: false, error: "env not configured" },
        redis: { ok: false, error: "env not configured" },
        blob: { ok: false, error: "env not configured" },
      },
      { status: 503 }
    );
  }

  const [db, redis, blob] = await Promise.all([
    checkDb(),
    checkRedis(),
    checkBlob(),
  ]);

  const allOk = db.ok && redis.ok && blob.ok;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      db: db.ok ? "ok" : "error",
      redis: redis.ok ? "ok" : "error",
      blob: blob.ok ? "ok" : "error",
      latency: {
        db: db.latencyMs,
        redis: redis.latencyMs,
        blob: blob.latencyMs,
      },
      errors: {
        db: db.error,
        redis: redis.error,
        blob: blob.error,
      },
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
