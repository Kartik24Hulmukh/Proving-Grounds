import { cn, timeAgo, formatCost } from "@/lib/utils";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  getProductBySlug,
  getAgentVersions,
  getProductTrials,
  type ProductDetailRow,
  type AgentVersionRow,
  type ProductTrialRow,
} from "@/lib/db/queries";

/**
 * Product profile — R1 (Blocker 1).
 * Live data from Neon. No mock data. Empty → empty state.
 */
export async function ProductProfile({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-[var(--color-text-dim)]">Product not found.</p>
        <Link href="/leaderboard" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">
          ← Back to leaderboard
        </Link>
      </div>
    );
  }

  const [versions, trials] = await Promise.all([
    getAgentVersions(product.id),
    getProductTrials(slug),
  ]);

  const passedTrials = trials.filter((t) => t.passed === true).length;
  const passRate = trials.length > 0 ? Math.round((passedTrials / trials.length) * 100) : 0;
  const scoredTrials = trials.filter((t) => t.score !== null);
  const avgScore = scoredTrials.length > 0
    ? scoredTrials.reduce((s, t) => s + parseFloat(t.score!), 0) / scoredTrials.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{product.name}</h1>
            <p className="mt-1 mono text-sm text-[var(--color-muted)]">by {product.vendor}</p>
            {product.description && (
              <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-dim)]">{product.description}</p>
            )}
          </div>
          <a
            href={product.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]"
          >
            Homepage <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Avg Score" value={avgScore.toFixed(1)} accent />
        <StatBox label="Pass Rate" value={`${passRate}%`} />
        <StatBox label="Trials Run" value={String(trials.length)} />
        <StatBox label="Status" value={product.status} />
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Versions Tested</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No versions tested yet.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 last:border-b-0">
                <span className="mono text-sm text-[var(--color-text)]">{v.label}</span>
                <span className="text-xs text-[var(--color-muted)]">
                  {v.releasedAt ? `Released ${timeAgo(v.releasedAt)}` : "Unreleased"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Recent Trials</h2>
        {trials.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No trials yet.</p>
        ) : (
          <div className="space-y-3">
            {trials.map((trial) => (
              <Link
                key={trial.id}
                href={`/trials/${trial.id}`}
                className="block rounded-lg border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {trial.passed === true ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
                    ) : trial.passed === false ? (
                      <XCircle className="h-5 w-5 text-[var(--color-danger)]" aria-hidden="true" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-[var(--color-border)]" aria-hidden="true" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">{trial.scenarioTitle}</div>
                      <div className="mono text-xs text-[var(--color-muted)]">{trial.scenarioSlug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="mono text-sm font-medium text-[var(--color-text)]">{trial.score ?? "—"}</div>
                      <div className="text-xs text-[var(--color-muted)]">score</div>
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">{formatCost(trial.costCents)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface p-4">
      <div className={cn("mono text-2xl font-bold", accent ? "text-[var(--color-accent)]" : "text-[var(--color-text)]")}>{value}</div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
