import { z } from "zod/v4";

/**
 * Environment variable validation.
 * All required secrets are validated at boot — the app refuses to start
 * if any are missing or malformed. No silent fallbacks.
 */

const envSchema = z.object({
  // Database (Neon Postgres)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Neon Postgres connection string)"),

  // Upstash Redis (queue + rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

  // Vercel Blob (private evidence storage)
  BLOB_READ_WRITE_TOKEN: z.string().min(1, "BLOB_READ_WRITE_TOKEN is required"),

  // Better Auth (admin auth)
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // Vercel AI SDK (LLM-as-judge)
  AI_GATEWAY_API_KEY: z.string().min(1, "AI_GATEWAY_API_KEY is required for the judge"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((e) => `  • ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `❌ Invalid environment variables:\n${errors}\n\nEnsure all required env vars are set in .env or your deployment environment.`
    );
  }
  return parsed.data;
}

// Lazy singleton — only validates when first accessed (avoids crashing build)
let _env: Env | null = null;

export function env(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

/**
 * Check if all required env vars are present without throwing.
 * Used by the health endpoint to report configuration status.
 */
export function checkEnv(): { valid: boolean; missing: string[] } {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return { valid: true, missing: [] };
  }
  const missing = result.error.issues.map((e) => e.path.join("."));
  return { valid: false, missing };
}
