import { cn } from "@/lib/utils";
import { Trophy, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { getLeaderboard, type LeaderboardRow, type ScenarioSetRow } from "@/lib/db/queries";
import Link from "next/link";

/**
 * Leaderboard view — R1 (Blocker 1).
 * Live data from Neon. No mock data. Empty DB → empty state.
 *
 * This is a server component. Scenario-set filtering is done via URL search params
 * so the page re-renders server-side with the filtered query.
 */
export async function LeaderboardView({ scenarioSet }: { scenarioSet: string }) {
  const { rows, sets } = await getLeaderboard(scenarioSet);

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <ScenarioSetTabs sets={sets} activeSet={scenarioSet} />
        <div className="surface p-12 text-center">
          <Trophy className="mx-auto mb-4 h-8 w-8 text-[var(--color-muted)]" aria-hidden="true" />
          <p className="text-[var(--color-text-dim)]">No trials have been scored yet.</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Once agents complete trials with verdicts, they&apos;ll appear here ranked by score.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScenarioSetTabs sets={sets} activeSet={scenarioSet} />

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-[var(--color-border)] px-4 py-3 text-xs uppercase tracking-wider text-[var(--color-muted)]">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Product</div>
          <div className="col-span-2 text-right">Score</div>
          <div className="col-span-2 text-right">Pass Rate</div>
          <div className="col-span-2 text-right">Adversarial</div>
          <div className="col-span-2 text-right">Trials</div>
        </div>
        {rows.map((entry) => (
          <LeaderboardRowComponent key={entry.productId} entry={entry} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Trophy} label="Top Score" value={rows[0]?.score.toFixed(1) ?? "0"} />
        <StatCard icon={Shield} label="Best Adversarial" value={`${Math.max(...rows.map((e) => e.adversarialPassRate))}%`} />
        <StatCard icon={TrendingUp} label="Total Trials" value={String(rows.reduce((s, e) => s + e.trialCount, 0))} />
        <StatCard icon={AlertTriangle} label="Avg Cost" value={`$${(rows.reduce((s, e) => s + e.avgCostCents, 0) / rows.length / 100).toFixed(2)}`} />
      </div>
    </div>
  );
}

function ScenarioSetTabs({ sets, activeSet }: { sets: ScenarioSetRow[]; activeSet: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Scenario set filter">
      {sets.map((set) => (
        <Link
          key={set.id}
          role="tab"
          aria-selected={activeSet === set.id}
          href={set.id === "all" ? "/leaderboard" : `/leaderboard?set=${set.id}`}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
            activeSet === set.id
              ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]"
          )}
        >
          {set.label}
          <span className="ml-2 mono text-xs opacity-60">{set.count}</span>
        </Link>
      ))}
    </div>
  );
}

function LeaderboardRowComponent({ entry }: { entry: LeaderboardRow }) {
  const rankColor =
    entry.rank === 1 ? "text-[var(--color-accent)]" :
    entry.rank === 2 ? "text-[var(--color-text)]" :
    entry.rank === 3 ? "text-[var(--color-text-dim)]" :
    "text-[var(--color-muted)]";

  return (
    <Link
      href={`/products/${entry.slug}`}
      className="grid grid-cols-12 gap-2 border-b border-[var(--color-border)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--color-surface-2)]"
    >
      <div className={cn("col-span-1 mono text-lg font-bold", rankColor)}>#{entry.rank}</div>
      <div className="col-span-3 flex flex-col">
        <span className="text-sm font-medium text-[var(--color-text)]">{entry.productName}</span>
        <span className="mono text-xs text-[var(--color-muted)]">{entry.vendor}</span>
      </div>
      <div className="col-span-2 flex items-center justify-end">
        <ScoreBar score={entry.score} />
      </div>
      <div className="col-span-2 text-right mono text-sm text-[var(--color-text-dim)]">{entry.passRate.toFixed(0)}%</div>
      <div className="col-span-2 text-right mono text-sm">
        <span className={cn(entry.adversarialPassRate >= 50 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]")}>
          {entry.adversarialPassRate.toFixed(0)}%
        </span>
      </div>
      <div className="col-span-2 text-right mono text-sm text-[var(--color-text-dim)]">{entry.trialCount}</div>
    </Link>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "var(--color-accent)" : score >= 50 ? "#eab308" : "var(--color-danger)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="mono text-sm font-medium" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="surface p-4">
      <Icon className="mb-2 h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
      <div className="mono text-2xl font-bold text-[var(--color-text)]">{value}</div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
