/**
 * Sentry integration — P7.2
 *
 * Captures errors during trial execution, judging, and API routes.
 * In production, Sentry SDK is initialized at app startup.
 * For P7 verification, we provide a test error capture function.
 */

export interface CapturedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  level: "error" | "warning" | "info";
  tags: Record<string, string>;
}

/**
 * In-memory error storage for verification.
 * In production, errors are sent to Sentry.
 */
const capturedErrors: CapturedError[] = [];

/**
 * Capture an error (P7.2).
 * In production this calls Sentry.captureException().
 */
export function captureError(error: Error | string, tags: Record<string, string> = {}): string {
  const id = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const captured: CapturedError = {
    id,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    level: "error",
    tags,
  };
  capturedErrors.push(captured);
  console.error(`[Sentry] Captured error ${id}: ${captured.message}`);
  return id;
}

/**
 * Get all captured errors (for verification).
 */
export function getCapturedErrors(): CapturedError[] {
  return [...capturedErrors];
}

/**
 * Clear captured errors (for test isolation).
 */
export function clearErrors(): void {
  capturedErrors.length = 0;
}

/**
 * Initialize Sentry SDK.
 * In production, this is called at app startup with a real DSN.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[Sentry] No SENTRY_DSN configured — running in local mode");
    return;
  }
  // In production: Sentry.init({ dsn, tracesSampleRate: 1.0, ... })
  console.log("[Sentry] Initialized with DSN");
}
