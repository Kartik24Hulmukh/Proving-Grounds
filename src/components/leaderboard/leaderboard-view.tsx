"use client";

import { useState } from "react";
import { mockScenarioSets, mockLeaderboard, type LeaderboardEntry } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Trophy, Shield, TrendingUp, AlertTriangle } from "lucide-react";

/**
 * Leaderboard page — P1.2
 * Ranks products by score with scenario-set tabs.
 */
export function LeaderboardView() {
  const [activeSet, setActiveSet] = useState("all");

  // Filter by scenario set (mock: all entries show for "all", subset for others)
  const entries = activeSet === "all"
    ? mockLeaderboard
    : mockLeaderboard.filter((e) => {
        // In real data, this filters by scenario set. Mock: show top 3 for non-all.
        return mockLeaderboard.indexOf(e) < 3;
      });

  return (
    <div className="space-y-6">
      {/* Scenario-set tabs */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Scenario set filter"
      >
        {mockScenarioSets.map((set) => (
          <button
            key={set.id}
            role="tab"
            aria-selected={activeSet === set.id}
            onClick={() => setActiveSet(set.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              activeSet === set.id
                ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]"
            )}
          >
            {set.label}
            <span className="ml-2 mono text-xs opacity-60">{set.count}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="surface overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 border-b border-[var(--color-border)] px-4 py-3 text-xs uppercase tracking-wider text-[var(--color-muted)]">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Product</div>
          <div className="col-span-2 text-right">Score</div>
          <div className="col-span-2 text-right">Pass Rate</div>
          <div className="col-span-2 text-right">Adversarial</div>
          <div className="col-span-2 text-right">Trials</div>
        </div>

        {/* Entry rows */}
        {entries.map((entry) => (
          <LeaderboardRow key={entry.productId} entry={entry} />
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Trophy} label="Top Score" value={`${entries[0]?.score ?? 0}`} />
        <StatCard icon={Shield} label="Best Adversarial" value={`${Math.max(...entries.map(e => e.adversarialPassRate))}%`} />
        <StatCard icon={TrendingUp} label="Total Trials" value={String(entries.reduce((s, e) => s + e.trialCount, 0))} />
        <StatCard icon={AlertTriangle} label="Avg Cost" value={`$${(entries.reduce((s, e) => s + e.avgCostCents, 0) / entries.length / 100).toFixed(2)}`} />
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColor =
    entry.rank === 1 ? "text-[var(--color-accent)]" :
    entry.rank === 2 ? "text-[var(--color-text)]" :
    entry.rank === 3 ? "text-[var(--color-text-dim)]" :
    "text-[var(--color-muted)]";

  return (
    <a
      href={`/products/${entry.slug}`}
      className="grid grid-cols-12 gap-2 border-b border-[var(--color-border)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--color-surface-2)]"
    >
      <div className={cn("col-span-1 mono text-lg font-bold", rankColor)}>
        #{entry.rank}
      </div>
      <div className="col-span-3 flex flex-col">
        <span className="text-sm font-medium text-[var(--color-text)]">{entry.productName}</span>
        <span className="mono text-xs text-[var(--color-muted)]">{entry.vendor}</span>
      </div>
      <div className="col-span-2 flex items-center justify-end">
        <ScoreBar score={entry.score} />
      </div>
      <div className="col-span-2 text-right mono text-sm text-[var(--color-text-dim)]">
        {entry.passRate}%
      </div>
      <div className="col-span-2 text-right mono text-sm">
        <span className={cn(
          entry.adversarialPassRate >= 50 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"
        )}>
          {entry.adversarialPassRate}%
        </span>
      </div>
      <div className="col-span-2 text-right mono text-sm text-[var(--color-text-dim)]">
        {entry.trialCount}
      </div>
    </a>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "var(--color-accent)" : score >= 50 ? "#eab308" : "var(--color-danger)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="mono text-sm font-medium" style={{ color }}>
        {score.toFixed(1)}
      </span>
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
