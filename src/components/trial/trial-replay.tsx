import { mockTrials, mockTrialSteps, mockEvidence } from "@/lib/mock/data";
import { cn, timeAgo } from "@/lib/utils";
import { CheckCircle2, XCircle, Shield, ShieldAlert, Download, Play, FileText, Network, Code } from "lucide-react";

/**
 * Trial replay viewer — P1.1 (mock), P4 (real evidence)
 * Shows video slot, step timeline, evidence links, verdict.
 */
export function TrialReplay({ id }: { id: string }) {
  const trial = mockTrials.find((t) => t.id === id);
  const steps = mockTrialSteps.filter((s) => s.trialId === id);
  const evidence = mockEvidence.filter((e) => e.trialId === id);

  if (!trial) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-[var(--color-text-dim)]">Trial not found.</p>
      </div>
    );
  }

  const duration = trial.finishedAt && trial.startedAt
    ? Math.round((trial.finishedAt.getTime() - trial.startedAt.getTime()) / 1000)
    : 0;

  return (
    <div className="space-y-6">
      {/* Trial header */}
      <div className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {trial.verdict?.passed ? (
                <CheckCircle2 className="h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
              ) : (
                <XCircle className="h-6 w-6 text-[var(--color-danger)]" aria-hidden="true" />
              )}
              <h1 className="text-xl font-bold text-[var(--color-text)]">{trial.scenarioTitle}</h1>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-dim)]">
              <a href={`/products/${trial.productSlug}`} className="text-[var(--color-accent)] hover:underline">
                {trial.productName}
              </a>
              {" · "} {trial.scenarioSlug} {" · "} {duration}s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={cn("mono text-3xl font-bold", trial.verdict?.passed ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]")}>
                {trial.verdict?.score ?? "—"}
              </div>
              <div className="text-xs text-[var(--color-muted)]">score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict summary */}
      {trial.verdict && (
        <div className={cn("surface p-4", trial.verdict.passed ? "border-l-2 border-l-[var(--color-accent)]" : "border-l-2 border-l-[var(--color-danger)]")}>
          <div className="mb-2 flex items-center gap-2">
            {trial.verdict.injectedDefenseHeld ? (
              <Shield className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {trial.verdict.injectedDefenseHeld ? "Injection defense held" : "Injection defense failed"}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-dim)]">{trial.verdict.rationale}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Video player slot (mock — real video in P4) */}
        <div className="lg:col-span-2">
          <div className="surface overflow-hidden">
            <div className="flex aspect-video items-center justify-center bg-[var(--color-bg)]">
              <div className="text-center">
                <Play className="mx-auto h-12 w-12 text-[var(--color-muted)]" aria-hidden="true" />
                <p className="mt-2 text-sm text-[var(--color-muted)]">Video evidence (P4)</p>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
              <span className="mono">trial_{trial.id}</span> · {trial.sandboxKind} · {duration}s
            </div>
          </div>

          {/* Step timeline */}
          <div className="surface mt-4 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Step Timeline ({steps.length})
            </h2>
            <ol className="space-y-1">
              {steps.map((step) => (
                <li key={step.id} className="flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-surface-2)]">
                  <span className="mono w-8 shrink-0 text-xs text-[var(--color-muted)]">{step.idx}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text)]">{step.description}</p>
                    <p className="mono text-xs text-[var(--color-muted)]">
                      {String(step.action.type)} · {timeAgo(step.ts)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Evidence panel */}
        <div className="space-y-4">
          <div className="surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Evidence</h2>
            <ul className="space-y-2">
              {evidence.map((ev) => (
                <li key={ev.id}>
                  <a
                    href={ev.url}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-border-hover)]"
                  >
                    <EvidenceIcon kind={ev.kind} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[var(--color-text)]">{ev.label}</div>
                      <div className="mono text-xs text-[var(--color-muted)]">{(ev.bytes / 1000).toFixed(0)} KB</div>
                    </div>
                    <Download className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trial metadata */}
          <div className="surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Metadata</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="mono text-[var(--color-text)]">{trial.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Sandbox</dt>
                <dd className="mono text-[var(--color-text)]">{trial.sandboxKind}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Cost</dt>
                <dd className="mono text-[var(--color-text)]">${(trial.costCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Started</dt>
                <dd className="mono text-[var(--color-text)]">{trial.startedAt ? timeAgo(trial.startedAt) : "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceIcon({ kind }: { kind: "video" | "trace" | "har" | "dom" | "log" }) {
  const icons = {
    video: Play,
    trace: FileText,
    har: Network,
    dom: Code,
    log: FileText,
  };
  const Icon = icons[kind];
  return <Icon className="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />;
}
