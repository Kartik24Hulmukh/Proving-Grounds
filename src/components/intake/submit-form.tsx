"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/**
 * Submit-your-agent form — P6.1
 * Validates against the adapter payload contract via /api/intake.
 */
export function SubmitForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    { ok: boolean; message: string } | null
  >(null);

  const [form, setForm] = useState({
    productName: "",
    vendor: "",
    homepage: "",
    adapterKey: "",
    description: "",
    contactEmail: "",
    versionLabel: "v1.0.0",
    runtime: "browser",
    entrypoint: "",
    scenarios: "invoice-refund-trap,form-fill-basic",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const payload = {
      productName: form.productName,
      vendor: form.vendor,
      homepage: form.homepage,
      adapterKey: form.adapterKey,
      description: form.description,
      contactEmail: form.contactEmail,
      versionLabel: form.versionLabel,
      adapterConfig: {
        runtime: form.runtime,
        entrypoint: form.entrypoint,
        envVars: [],
        capabilities: [],
      },
      scenarios: form.scenarios.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          ok: true,
          message: `Submission received (ID: ${data.id}). Our team will review it.`,
        });
      } else {
        const details = data.details
          ? data.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join("; ")
          : data.error;
        setResult({ ok: false, message: details ?? "Submission failed" });
      }
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : "Network error",
      });
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {result && (
        <div
          className={cn(
            "surface flex items-start gap-3 p-4",
            result.ok ? "border-l-2 border-l-[var(--color-accent)]" : "border-l-2 border-l-[var(--color-danger)]"
          )}
        >
          {result.ok ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
          )}
          <p className="text-sm text-[var(--color-text-dim)]">{result.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Product Name" required>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => update("productName", e.target.value)}
            required
            className="input"
            placeholder="Browser Use"
          />
        </Field>
        <Field label="Vendor" required>
          <input
            type="text"
            value={form.vendor}
            onChange={(e) => update("vendor", e.target.value)}
            required
            className="input"
            placeholder="browser-use"
          />
        </Field>
      </div>

      <Field label="Homepage URL" required>
        <input
          type="url"
          value={form.homepage}
          onChange={(e) => update("homepage", e.target.value)}
          required
          className="input"
          placeholder="https://github.com/browser-use/browser-use"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Adapter Key" required hint="lowercase, hyphens only">
          <input
            type="text"
            value={form.adapterKey}
            onChange={(e) => update("adapterKey", e.target.value)}
            required
            pattern="[a-z0-9-]+"
            className="input"
            placeholder="browser-use"
          />
        </Field>
        <Field label="Contact Email" required>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            required
            className="input"
            placeholder="team@example.com"
          />
        </Field>
      </div>

      <Field label="Description" required>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          required
          rows={3}
          className="input resize-none"
          placeholder="Describe your agent product in 1-2 sentences."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Version Label" required>
          <input
            type="text"
            value={form.versionLabel}
            onChange={(e) => update("versionLabel", e.target.value)}
            required
            className="input"
            placeholder="v1.0.0"
          />
        </Field>
        <Field label="Runtime" required>
          <select
            value={form.runtime}
            onChange={(e) => update("runtime", e.target.value)}
            className="input"
          >
            <option value="browser">browser</option>
            <option value="cli">cli</option>
            <option value="api">api</option>
          </select>
        </Field>
      </div>

      <Field label="Entrypoint" required>
        <input
          type="text"
          value={form.entrypoint}
          onChange={(e) => update("entrypoint", e.target.value)}
          required
          className="input"
          placeholder="npx browser-use --task"
        />
      </Field>

      <Field label="Scenarios" required hint="comma-separated scenario slugs">
        <input
          type="text"
          value={form.scenarios}
          onChange={(e) => update("scenarios", e.target.value)}
          required
          className="input"
          placeholder="invoice-refund-trap,form-fill-basic"
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          "Submit Agent"
        )}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--color-text);
          transition: border-color 0.15s ease;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-accent);
        }
        .input::placeholder {
          color: var(--color-muted);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
        {label}
        {required && <span className="text-[var(--color-danger)]"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}
