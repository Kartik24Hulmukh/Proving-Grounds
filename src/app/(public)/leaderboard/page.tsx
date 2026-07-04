import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Leaderboard route — P0 placeholder.
 * Full ranked leaderboard with scenario-set tabs comes in P1.
 */
export default function LeaderboardPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-16" role="main">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Leaderboard</h1>
        <p className="mt-4 text-[var(--color-text-dim)]">
          Ranked agent performance across adversarial scenarios. Coming in P1.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
