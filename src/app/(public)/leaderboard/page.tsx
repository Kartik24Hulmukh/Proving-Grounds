import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Leaderboard route — R1 (Blocker 1).
 * Live data from Neon via Drizzle/neon queries. No mock data.
 */
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  const scenarioSet = set ?? "all";
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
        <LeaderboardView scenarioSet={scenarioSet} />
      </main>
      <SiteFooter />
    </>
  );
}
