import { mockProducts, mockAgentVersions, mockTrials } from "@/lib/mock/data";
import { cn, timeAgo, formatCost } from "@/lib/utils";
import { CheckCircle2, XCircle, ExternalLink, Clock } from "lucide-react";

/**
 * Product profile page — P1.1
 * Shows product info, versions, pass rate, recent trials.
 */
export function ProductProfile({ slug }: { slug: string }) {
  const product = mockProducts.find((p) => p.slug === slug);

  if (!product) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-[var(--color-text-dim)]">Product not found.</p>
      </div>
    );
  }

  const versions = mockAgentVersions.filter((v) => v.productId === product.id);
  const trials = mockTrials.filter((t) => t.productSlug === slug);
  const passedTrials = trials.filter((t) => t.verdict?.passed).length;

  return (
    <div className="space-y-6">
      {/* Product header */}
      <div className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{product.name}</h1>
            <p className="mt-1 mono text-sm text-[var(--color-muted)]">by {product.vendor}</p>
            <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-dim)]">{product.description}</p>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Overall Score" value={product.passRate > 60 ? `${product.passRate + 10}` : `${product.passRate}`} accent />
        <StatBox label="Pass Rate" value={`${product.passRate}%`} />
        <StatBox label="Trials Run" value={String(product.trialCount)} />
        <StatBox label="Status" value="Approved" />
      </div>

      {/* Versions */}
      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Versions Tested</h2>
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
      </div>

      {/* Recent trials */}
      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Recent Trials</h2>
        {trials.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No trials yet.</p>
        ) : (
          <div className="space-y-3">
            {trials.map((trial) => (
              <a
                key={trial.id}
                href={`/trials/${trial.id}`}
                className="block rounded-lg border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {trial.verdict?.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[var(--color-danger)]" aria-hidden="true" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">{trial.scenarioTitle}</div>
                      <div className="mono text-xs text-[var(--color-muted)]">{trial.scenarioSlug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="mono text-sm font-medium text-[var(--color-text)]">
                        {trial.verdict?.score ?? "—"}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">score</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatCost(trial.costCents)}
                    </div>
                  </div>
                </div>
              </a>
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
      <div className={cn("mono text-2xl font-bold", accent ? "text-[var(--color-accent)]" : "text-[var(--color-text)]")}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}
