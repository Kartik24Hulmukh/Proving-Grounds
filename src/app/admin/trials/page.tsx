/**
 * Admin trial status board — P6.3
 * Shows all trials with their status, verdict, and cost.
 */

import { neon } from "@neondatabase/serverless";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { cn, timeAgo, formatCost } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminTrialsPage() {
  const databaseUrl = process.env.DATABASE_URL;
  let trials: Array<Record<string, unknown>> = [];

  if (databaseUrl) {
    const sql = neon(databaseUrl);
    const rows = await sql`
      SELECT
        t.id, t.status, t.started_at, t.finished_at, t.cost_cents, t.error,
        p.name as product_name, s.title as scenario_title, s.slug as scenario_slug,
        v.passed, v.score, v.rationale
      FROM trial t
      JOIN agent_version av ON t.agent_version_id = av.id
      JOIN product p ON av.product_id = p.id
      JOIN scenario s ON t.scenario_id = s.id
      LEFT JOIN verdict v ON v.trial_id = t.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `;
    trials = rows as Array<Record<string, unknown>>;
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Trial Status Board</h1>
          <p className="mt-2 text-[var(--color-text-dim)]">
            All trials with real-time status, verdicts, and costs.
          </p>
        </div>

        <div className="surface overflow-hidden">
          <div className="grid grid-cols-12 gap-2 border-b border-[var(--color-border)] px-4 py-3 text-xs uppercase tracking-wider text-[var(--color-muted)]">
            <div className="col-span-3">Product / Scenario</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Score</div>
            <div className="col-span-2 text-right">Cost</div>
            <div className="col-span-3 text-right">Time</div>
          </div>

          {trials.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
              No trials yet.
            </div>
          ) : (
            trials.map((t) => {
              const status = t.status as string;
              const passed = t.passed as boolean | null;
              return (
                <div
                  key={t.id as string}
                  className="grid grid-cols-12 gap-2 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
                >
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-[var(--color-text)]">
                      {t.product_name as string}
                    </div>
                    <div className="mono text-xs text-[var(--color-muted)]">
                      {t.scenario_slug as string}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <StatusBadge status={status} passed={passed} />
                  </div>
                  <div className="col-span-2 text-right mono text-sm">
                    {t.score !== null ? (
                      <span className={cn(passed ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]")}>
                        {String(t.score)}
                      </span>
                    ) : (
                      <span className="text-[var(--color-muted)]">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right mono text-sm text-[var(--color-text-dim)]">
                    {formatCost(t.cost_cents as number)}
                  </div>
                  <div className="col-span-3 text-right text-xs text-[var(--color-muted)]">
                    {t.started_at ? timeAgo(t.started_at as string) : "queued"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function StatusBadge({ status, passed }: { status: string; passed: boolean | null }) {
  const config = {
    completed: { icon: passed === true ? CheckCircle2 : passed === false ? XCircle : Clock, color: passed === true ? "var(--color-accent)" : passed === false ? "var(--color-danger)" : "var(--color-muted)" },
    queued: { icon: Clock, color: "var(--color-muted)" },
    running: { icon: Clock, color: "var(--color-accent)" },
    failed: { icon: AlertTriangle, color: "var(--color-danger)" },
    timeout: { icon: AlertTriangle, color: "var(--color-danger)" },
    quarantined: { icon: AlertTriangle, color: "#eab308" },
  };
  const c = config[status as keyof typeof config] ?? config.queued;
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: c.color }}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}
