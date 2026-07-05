/**
 * /api/evidence/[id] — P4.4
 *
 * Serves evidence artifacts via signed/authorized access.
 * No public raw bucket URLs are exposed — all access goes through
 * this route which validates the request and generates a signed URL.
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { signedUrl } from "@/lib/blob/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const expirySeconds = parseInt(url.searchParams.get("expiry") ?? "3600", 10);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const sql = neon(databaseUrl);

  // Look up the evidence row
  const rows = await sql`
    SELECT id, kind, url, bytes, sha256, trial_id
    FROM evidence
    WHERE id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  const evidence = rows[0];

  // Generate a signed URL with expiry
  const signed = signedUrl(evidence.url as string, expirySeconds);

  return NextResponse.json({
    id: evidence.id,
    kind: evidence.kind,
    url: signed,
    bytes: evidence.bytes,
    sha256: evidence.sha256,
    trialId: evidence.trial_id,
    expiresIn: expirySeconds,
  });
}
