import { cn, timeAgo, formatCost } from "@/lib/utils";
import { CheckCircle2, XCircle, Shield, ShieldAlert, Download, Play, FileText, Network, Code } from "lucide-react";
import type {
  TrialDetailRow,
  TrialStepRow,
  EvidenceRow,
} from "@/lib/db/queries";

/**
 * Trial Replay Viewer (Real) — R1 (Blocker 1) / P4.3.
 * Renders live data from Neon. No mock data. No placeholders.
 */
export function TrialReplayReal({
  trialId,
  trial,
  steps,
  evidence,
}: {
  trialId: string;
  trial: TrialDetailRow;
  steps: TrialStepRow[];
  evidence: EvidenceRow[];
}) {
  const passed = trial.passed;
  const score = trial.score;
  const rationale = trial.rationale;
  const injectedDefenseHeld = trial.injectedDefenseHeld;
  const scenarioTitle = trial.scenarioTitle;
  const scenarioSlug = trial.scenarioSlug;
  const productName = trial.productName;
  const status = trial.status;
  const sandboxKind = trial.sandboxKind;
  const costCents = trial.costCents;
  const startedAt = trial.startedAt;

  const videoEvidence = evidence.find((e) => e.kind === "video");
  const videoUrl = videoEvidence?.url;

  const duration = trial.finishedAt && trial.startedAt
    ? Math.round((new Date(trial.finishedAt).getTime() - new Date(trial.startedAt).getTime()) / 1000)
    : 0;

  return (
    <div className="space-y-6">
      <div className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {passed === true ? (
                <CheckCircle2 className="h-6 w-6 text-[var(--color-accent)]" aria-hidden="true" />
              ) : passed === false ? (
                <XCircle className="h-6 w-6 text-[var(--color-danger)]" aria-hidden="true" />
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-[var(--color-border)]" aria-hidden="true" />
              )}
              <h1 className="text-xl font-bold text-[var(--color-text)]">{scenarioTitle}</h1>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-dim)]">
              <span className="text-[var(--color-accent)]">{productName}</span>
              {" · "}{scenarioSlug}{" · "}{duration}s
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={cn("mono text-3xl font-bold", passed === true ? "text-[var(--color-accent)]" : passed === false ? "text-[var(--color-danger)]" : "text-[var(--color-muted)]")}>
                {score ?? "—"}
              </div>
              <div className="text-xs text-[var(--color-muted)]">score</div>
            </div>
          </div>
        </div>
      </div>

      {rationale && (
        <div className={cn("surface p-4", passed ? "border-l-2 border-l-[var(--color-accent)]" : "border-l-2 border-l-[var(--color-danger)]")}>
          <div className="mb-2 flex items-center gap-2">
            {injectedDefenseHeld ? (
              <Shield className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {injectedDefenseHeld ? "Injection defense held" : "Injection defense failed"}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-dim)]">{rationale}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="surface overflow-hidden">
            {videoUrl ? (
              <video controls className="aspect-video w-full bg-[var(--color-bg)]" aria-label="Trial session video">
                <source src={videoUrl} type="video/webm" />
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-[var(--color-bg)]">
                <div className="text-center">
                  <Play className="mx-auto h-12 w-12 text-[var(--color-muted)]" aria-hidden="true" />
                  <p className="mt-2 text-sm text-[var(--color-muted)]">No video evidence available</p>
                </div>
              </div>
            )}
            <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
              <span className="mono">trial_{trialId}</span> · {sandboxKind ?? "container"} · {duration}s
            </div>
          </div>

          <div className="surface mt-4 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Step Timeline ({steps.length})
            </h2>
            {steps.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No steps recorded.</p>
            ) : (
              <ol className="space-y-1">
                {steps.map((step) => {
                  const action = step.action as { type: string; description?: string };
                  return (
                    <li key={step.id} className="flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-surface-2)]">
                      <span className="mono w-8 shrink-0 text-xs text-[var(--color-muted)]">{step.idx}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--color-text)]">{action?.description ?? action?.type ?? "Unknown action"}</p>
                        <p className="mono text-xs text-[var(--color-muted)]">{action?.type} · {timeAgo(step.ts)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Evidence</h2>
            {evidence.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No evidence artifacts.</p>
            ) : (
              <ul className="space-y-2">
                {evidence.map((ev) => (
                  <li key={ev.id}>
                    <a
                      href={`/api/evidence/${ev.id}`}
                      className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-border-hover)]"
                    >
                      <EvidenceIcon kind={ev.kind} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm capitalize text-[var(--color-text)]">{ev.kind}</div>
                        <div className="mono text-xs text-[var(--color-muted)]">{(ev.bytes / 1000).toFixed(0)} KB · sha256: {ev.sha256.slice(0, 8)}…</div>
                      </div>
                      <Download className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Metadata</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="mono text-[var(--color-text)]">{status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Sandbox</dt>
                <dd className="mono text-[var(--color-text)]">{sandboxKind ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Cost</dt>
                <dd className="mono text-[var(--color-text)]">{formatCost(costCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Started</dt>
                <dd className="mono text-[var(--color-text)]">{startedAt ? timeAgo(startedAt) : "—"}</dd>
              </div>
              {trial.rubricVersion && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-muted)]">Rubric</dt>
                  <dd className="mono text-[var(--color-text)]">{trial.rubricVersion}</dd>
                </div>
              )}
              {trial.judgeModel && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-muted)]">Judge</dt>
                  <dd className="mono text-[var(--color-text)]">{trial.judgeModel}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceIcon({ kind }: { kind: string }) {
  const icons: Record<string, typeof Play> = {
    video: Play,
    trace: FileText,
    har: Network,
    dom: Code,
    log: FileText,
  };
  const Icon = icons[kind] ?? FileText;
  return <Icon className="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />;
}
