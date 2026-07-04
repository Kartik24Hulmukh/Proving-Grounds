import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Submit-your-agent route — P0 placeholder.
 * Full intake form with adapter payload validation comes in P6.
 */
export default function SubmitPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-16" role="main">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Submit Your Agent</h1>
        <p className="mt-4 text-[var(--color-text-dim)]">
          Want your agent product on the Proving Grounds leaderboard? Submit your adapter
          payload for review. The intake form with validation comes in P6.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
