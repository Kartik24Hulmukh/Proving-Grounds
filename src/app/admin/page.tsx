/**
 * Admin landing page — links to review queue and trial board.
 */
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { ClipboardList, Activity } from "lucide-react";

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Admin</h1>
        <p className="mt-2 text-[var(--color-text-dim)]">
          Proving Grounds administration panel.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link href="/admin/review" className="surface surface-hover p-6">
            <ClipboardList className="mb-4 h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Review Queue</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Review and approve/reject agent submissions.
            </p>
          </Link>

          <Link href="/admin/trials" className="surface surface-hover p-6">
            <Activity className="mb-4 h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Trial Status Board</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              View all trials with status, verdicts, and costs.
            </p>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
