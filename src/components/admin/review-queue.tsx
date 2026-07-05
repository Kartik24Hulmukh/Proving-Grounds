"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Clock, ExternalLink } from "lucide-react";

interface Submission {
  id: string;
  submitter_email: string;
  product_name: string;
  adapter_payload: Record<string, unknown>;
  status: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/**
 * Admin review queue — P6.3, P6.4
 * Lists pending submissions with approve/reject controls.
 */
export function AdminReviewQueue({ submissions }: { submissions: Array<Record<string, unknown>> }) {
  const typedSubmissions = submissions as unknown as Submission[];
  const [processing, setProcessing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  async function handleAction(id: string, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults((prev) => ({
          ...prev,
          [id]: action === "approve" ? "✓ Approved and enqueued" : "✓ Rejected",
        }));
      } else {
        setResults((prev) => ({ ...prev, [id]: `✗ ${data.error}` }));
      }
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [id]: `✗ ${e instanceof Error ? e.message : "Failed"}`,
      }));
    }
    setProcessing(null);
  }

  if (submissions.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-[var(--color-text-dim)]">No pending submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {typedSubmissions.map((sub) => {
        const payload = sub.adapter_payload;
        const result = results[sub.id];
        const isProcessing = processing === sub.id;

        return (
          <div key={sub.id} className="surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  {sub.product_name}
                </h3>
                <p className="mono mt-1 text-xs text-[var(--color-muted)]">
                  {sub.submitter_email} · {new Date(sub.created_at).toLocaleDateString()}
                </p>
                <p className="mt-3 text-sm text-[var(--color-text-dim)]">
                  {typeof payload.description === "string" ? String(payload.description) : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(payload.scenarios) &&
                    payload.scenarios.map((s: string) => (
                      <span
                        key={s}
                        className="badge badge-neutral"
                      >
                        {s}
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {result ? (
                  <span
                    className={cn(
                      "text-sm",
                      result.startsWith("✓") ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"
                    )}
                  >
                    {result}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(sub.id, "approve")}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)] px-3 py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(sub.id, "reject")}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-danger)] px-3 py-2 text-sm text-[var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {payload.homepage ? (
              <a
                href={String(payload.homepage)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text-dim)]"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {String(payload.homepage)}
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
