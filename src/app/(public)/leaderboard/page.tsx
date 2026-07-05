import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

/**
 * Leaderboard route — P1.1, P1.2
 * Ranks products by score with scenario-set tabs.
 */
export default function LeaderboardPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Leaderboard</h1>
          <p className="mt-2 text-[var(--color-text-dim)]">
            Ranked agent performance across adversarial scenarios. Scores are reproducible.
          </p>
        </div>
        <LeaderboardView />
      </main>
      <SiteFooter />
    </>
  );
}
