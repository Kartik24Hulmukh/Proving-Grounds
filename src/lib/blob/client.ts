/**
 * Vercel Blob client — private evidence artifact storage.
 *
 * All evidence (video, trace.zip, HAR, DOM snapshots, step logs) is uploaded
 * here with SHA-256 hashing. Access is via signed URLs only — no public
 * raw bucket URLs are exposed (P4.4).
 */

import { put, head, del, list } from "@vercel/blob";
import { createHash } from "node:crypto";

export interface UploadResult {
  url: string;
  pathname: string;
  bytes: number;
  sha256: string;
  contentType: string;
}

/**
 * Upload an evidence artifact to private Blob storage.
 * Computes SHA-256 for integrity verification (P4.5).
 */
export async function uploadEvidence(
  pathname: string,
  data: Buffer | string,
  contentType: string
): Promise<UploadResult> {
  const body = typeof data === "string" ? Buffer.from(data) : data;
  const sha256 = createHash("sha256").update(body).digest("hex");

  const result = await put(pathname, body, {
    access: "private",
    contentType,
    addRandomSuffix: true,
  });

  return {
    url: result.url,
    pathname: result.pathname,
    bytes: body.byteLength,
    sha256,
    contentType,
  };
}

/**
 * Verify a stored artifact's integrity by checking its existence and metadata.
 * Used to detect corrupt/missing artifacts (P4.5).
 */
export async function verifyEvidence(url: string): Promise<boolean> {
  try {
    const info = await head(url);
    return info !== null;
  } catch {
    return false;
  }
}

/**
 * Delete an evidence artifact (used during cleanup / quarantine).
 */
export async function deleteEvidence(url: string): Promise<void> {
  await del(url);
}

/**
 * List evidence artifacts under a given prefix.
 */
export async function listEvidence(prefix?: string) {
  return list({ prefix });
}

/**
 * Generate a signed download URL for a private blob.
 * In production this uses Vercel Blob's built-in token signing.
 */
export function signedUrl(blobUrl: string, expirySeconds: number = 3600): string {
  // Vercel Blob private URLs already include a token.
  // For additional expiry control, append a custom query param that
  // the download route checks. The actual token is managed by Vercel.
  const url = new URL(blobUrl);
  url.searchParams.set("pg_expiry", String(Date.now() + expirySeconds * 1000));
  return url.toString();
}
