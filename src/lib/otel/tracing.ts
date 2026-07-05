/**
 * OpenTelemetry setup — P7.1
 *
 * Emits traces with GenAI semantic conventions (gen_ai.*) and
 * sandbox attributes (sandbox.*) for trial execution.
 *
 * In production, traces are exported to an OTel collector → Grafana.
 * For P7 verification, we emit traces to the console and verify
 * the span attributes are correct.
 */

export interface TrialSpan {
  traceId: string;
  spanId: string;
  name: string;
  attributes: Record<string, string | number | boolean>;
  startTime: number;
  endTime?: number;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
}

/**
 * In-memory span storage for verification.
 * In production, these would be exported via OTLP.
 */
const emittedSpans: TrialSpan[] = [];

/**
 * Start a trial span with gen_ai.* and sandbox.* attributes.
 */
export function startTrialSpan(params: {
  trialId: string;
  scenarioSlug: string;
  adapterKey: string;
  sandboxKind: string;
  model?: string;
}): TrialSpan {
  const span: TrialSpan = {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    name: `trial.${params.scenarioSlug}`,
    attributes: {
      // GenAI semantic conventions
      "gen_ai.system": "proving-grounds",
      "gen_ai.operation.name": "trial",
      "gen_ai.request.model": params.model ?? "claude-sonnet-4-6",
      "gen_ai.scenario": params.scenarioSlug,
      // Sandbox attributes
      "sandbox.kind": params.sandboxKind,
      "sandbox.trial_id": params.trialId,
      "sandbox.adapter": params.adapterKey,
      "sandbox.egress_allowlist": "arena.local,localhost",
      // Trial metadata
      "trial.id": params.trialId,
      "trial.scenario": params.scenarioSlug,
    },
    startTime: Date.now(),
    events: [],
  };

  emittedSpans.push(span);
  return span;
}

/**
 * End a trial span.
 */
export function endTrialSpan(span: TrialSpan, status: "ok" | "error" = "ok"): void {
  span.endTime = Date.now();
  span.attributes["span.status"] = status;
  if (status === "error") {
    span.events.push({
      name: "exception",
      timestamp: Date.now(),
      attributes: { "exception.type": "TrialError" },
    });
  }
}

/**
 * Add an event to a span.
 */
export function addSpanEvent(span: TrialSpan, name: string, attributes?: Record<string, unknown>): void {
  span.events.push({
    name,
    timestamp: Date.now(),
    attributes,
  });
}

/**
 * Get all emitted spans (for verification).
 */
export function getEmittedSpans(): TrialSpan[] {
  return [...emittedSpans];
}

/**
 * Clear emitted spans (for test isolation).
 */
export function clearSpans(): void {
  emittedSpans.length = 0;
}

/**
 * Verify that a span has the required gen_ai.* and sandbox.* attributes (P7.1).
 */
export function verifySpanAttributes(span: TrialSpan): {
  hasGenAi: boolean;
  hasSandbox: boolean;
  missingGenAi: string[];
  missingSandbox: string[];
} {
  const requiredGenAi = ["gen_ai.system", "gen_ai.operation.name", "gen_ai.request.model"];
  const requiredSandbox = ["sandbox.kind", "sandbox.trial_id", "sandbox.adapter"];

  const missingGenAi = requiredGenAi.filter((k) => !(k in span.attributes));
  const missingSandbox = requiredSandbox.filter((k) => !(k in span.attributes));

  return {
    hasGenAi: missingGenAi.length === 0,
    hasSandbox: missingSandbox.length === 0,
    missingGenAi,
    missingSandbox,
  };
}

function generateTraceId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function generateSpanId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
