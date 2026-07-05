/**
 * /api/evidence/[id] — P4.4 / R3.2 / R3.3
 *
 * Serves evidence artifacts from PRIVATE Vercel Blob storage.
 *
 * Vercel Blob is private — raw blob URLs return 403 Forbidden.
 * This route uses head(url, { token }) → downloadUrl, then fetches
 * the bytes with the token and streams them to the client.
 *
 * Supports two modes:
 *   1. Default: streams the raw bytes (for video playback, trace download, etc.)
 *   2. ?meta=1: returns JSON metadata (url, sha256, bytes, kind) for verification
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { head } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const metaOnly = url.searchParams.get("meta") === "1";

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

  // Metadata-only mode: return JSON for verification (R3.3)
  if (metaOnly) {
    return NextResponse.json({
      id: evidence.id,
      kind: evidence.kind,
      url: evidence.url,
      bytes: evidence.bytes,
      sha256: evidence.sha256,
      trialId: evidence.trial_id,
    });
  }

  // Stream mode: fetch from private Blob via head() → downloadUrl
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json({ error: "Blob token not configured" }, { status: 500 });
  }

  try {
    // R3.3: Use head() with token to get the real downloadUrl
    const info = await head(evidence.url as string, { token: blobToken });
    if (!info || !info.downloadUrl) {
      return NextResponse.json({ error: "Unable to resolve download URL" }, { status: 500 });
    }

    // Fetch the actual bytes with the token
    const blobResp = await fetch(info.downloadUrl, {
      headers: { Authorization: `Bearer ${blobToken}` },
    });

    if (!blobResp.ok) {
      return NextResponse.json(
        { error: `Blob fetch failed: ${blobResp.status}` },
        { status: 502 }
      );
    }

    // Stream the bytes to the client with appropriate content type
    const contentType = info.contentType ?? getContentType(evidence.kind as string);
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", String(evidence.bytes));
    headers.set("X-Evidence-SHA256", evidence.sha256 as string);
    headers.set("X-Evidence-Kind", evidence.kind as string);
    headers.set("Cache-Control", "private, max-age=3600");

    // For video, allow range requests for seeking
    if (evidence.kind === "video") {
      headers.set("Accept-Ranges", "bytes");
    }

    return new NextResponse(blobResp.body, { status: 200, headers });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch evidence", message: e instanceof Error ? e.message : "unknown" },
      { status: 502 }
    );
  }
}

function getContentType(kind: string): string {
  const types: Record<string, string> = {
    video: "video/webm",
    trace: "application/zip",
    har: "application/json",
    dom: "text/html",
    log: "application/json",
  };
  return types[kind] ?? "application/octet-stream";
}
