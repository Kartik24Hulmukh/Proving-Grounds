import { RUBRIC } from "@/lib/judge/rubric";
import { Scale, Shield, Thermometer, Lock } from "lucide-react";

/**
 * Methodology page — R1 (Blocker 1).
 * Renders the ACTUAL rubric from src/lib/judge/rubric.ts (source of truth).
 * No mock data.
 */
export function MethodologyView() {
  return (
    <div className="space-y-8">
      <div className="surface p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Methodology</h1>
        <p className="mt-4 text-[var(--color-text-dim)]">
          Every trial is scored against a published, versioned rubric. The rule-oracle runs
          first — a hard <code className="mono text-[var(--color-accent)]">mustNotDo</code> violation
          auto-fails regardless of what the LLM judge says. Verdicts are reproducible: pinned model,
          temperature 0, stored rubric version.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ConfigCard icon={Scale} label="Rubric Version" value={RUBRIC.version} />
        <ConfigCard icon={Thermometer} label="Temperature" value={String(RUBRIC.temperature)} />
        <ConfigCard icon={Lock} label="Pinned Model" value={RUBRIC.model} />
        <ConfigCard icon={Shield} label="Oracle First" value="Always" />
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Scoring Criteria</h2>
        <div className="space-y-4">
          {RUBRIC.criteria.map((c) => (
            <div key={c.name} className="border-b border-[var(--color-border)] pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text)]">{c.name}</span>
                <span className="mono text-sm text-[var(--color-accent)]">{c.weight}%</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-dim)]">{c.description}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${c.weight}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Pass / Fail Rules</h2>
        <div className="space-y-3">
          <RuleRow label="Pass" value={RUBRIC.scoring.pass} positive />
          <RuleRow label="Fail" value={RUBRIC.scoring.fail} />
          <RuleRow label="Oracle Precedence" value={RUBRIC.scoring.ruleOracleFirst} />
        </div>
      </div>

      <div className="surface p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted)]">Trial Lifecycle</h2>
        <ol className="space-y-3">
          {[
            "Job enqueued (submission approved or scheduled re-run) → Redis queue",
            "Worker dequeues, provisions isolated sandbox, loads adapter + scenario",
            "Adapter runs the task; runner records steps + evidence; enforces timeout + cost cap",
            "Evidence flushed to private Blob storage; trial row updated",
            "Judge scores: rule-oracle first, then LLM-as-judge → verdict persisted",
            "Leaderboard snapshot recomputed; replay page becomes public",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-xs text-[var(--color-accent)]">{i + 1}</span>
              <span className="text-sm text-[var(--color-text-dim)]">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ConfigCard({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  return (
    <div className="surface p-4">
      <Icon className="mb-2 h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
      <div className="mono text-sm font-bold text-[var(--color-text)]">{value}</div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}

function RuleRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--color-border)] pb-3 last:border-b-0 sm:flex-row sm:gap-4">
      <span className={`mono w-32 shrink-0 text-sm font-medium ${positive ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"}`}>{label}</span>
      <span className="text-sm text-[var(--color-text-dim)]">{value}</span>
    </div>
  );
}
