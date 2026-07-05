/**
 * /api/intake — P6.1, P6.5
 *
 * Submit-your-agent endpoint.
 * Validates the adapter payload contract (P6.1) and rate limits (P6.5).
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { safeValidateSubmission } from "@/lib/adapters/payload-schema";
import { intakeRatelimit } from "@/lib/redis/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // ── Rate limiting (P6.5) ──
  try {
    const identifier = request.headers.get("x-forwarded-for") ?? "anonymous";
    const { success, reset } = await intakeRatelimit().limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many submissions. Please try again later.",
          resetAt: new Date(reset).toISOString(),
        },
        { status: 429 }
      );
    }
  } catch (e) {
    // R4.2: Fail CLOSED — Redis unavailable means we DENY, not allow.
    // Never fail open on a security control. Zero rows written.
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[intake] Rate limiter unavailable — failing CLOSED (denying submission): ${msg}`);
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        message: "Submission intake is temporarily unavailable. Please try again later.",
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

  // ── Parse body ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ── Validate adapter payload contract (P6.1) ──
  const result = safeValidateSubmission(body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return NextResponse.json(
      {
        error: "Validation failed",
        details: errors,
      },
      { status: 422 }
    );
  }

  const payload = result.data;

  // ── Persist submission to Neon ──
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  const sql = neon(databaseUrl);

  try {
    const rows = await sql`
      INSERT INTO submission (submitter_email, product_name, adapter_payload, status)
      VALUES (
        ${payload.contactEmail},
        ${payload.productName},
        ${JSON.stringify(payload)}::jsonb,
        'pending'
      )
      RETURNING id, created_at
    `;

    const submission = rows[0];

    return NextResponse.json(
      {
        id: submission.id,
        status: "pending",
        message: "Submission received. It will be reviewed by the Proving Grounds team.",
        createdAt: submission.created_at,
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create submission", message: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}

/**
 * GET — list pending submissions (admin only).
 * In a real deployment this would check Better Auth session + admin role.
 */
export async function GET(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const sql = neon(databaseUrl);
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";

  const rows = await sql`
    SELECT id, submitter_email, product_name, adapter_payload, status, notes, created_at, reviewed_at
    FROM submission
    WHERE status = ${status}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ submissions: rows });
}
