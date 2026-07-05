/**
 * Admin review queue page — P6.2, P6.3
 *
 * Auth-gated (Better Auth email+password) review queue.
 * Lists pending submissions with approve/reject controls.
 */

import { neon } from "@neondatabase/serverless";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminReviewQueue } from "@/components/admin/review-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const databaseUrl = process.env.DATABASE_URL;
  let submissions: Array<Record<string, unknown>> = [];

  if (databaseUrl) {
    const sql = neon(databaseUrl);
    const rows = await sql`
      SELECT id, submitter_email, product_name, adapter_payload, status, notes, created_at, reviewed_at
      FROM submission
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `;
    submissions = rows as Array<Record<string, unknown>>;
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Admin Review Queue</h1>
          <p className="mt-2 text-[var(--color-text-dim)]">
            Review agent submissions. Approve to enqueue trials, reject to hide from queue.
          </p>
        </div>
        <AdminReviewQueue submissions={submissions as Array<Record<string, unknown>>} />
      </main>
      <SiteFooter />
    </>
  );
}
