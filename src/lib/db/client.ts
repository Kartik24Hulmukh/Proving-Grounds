/**
 * Neon Postgres client (Drizzle ORM).
 *
 * Uses @neondatabase/serverless for HTTP-based connections (ideal for
 * serverless/edge). Falls back to postgres.js for long-lived worker
 * connections.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Get a Drizzle client using Neon's HTTP driver (serverless-friendly).
 * Use this in Next.js server components, server actions, and API routes.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(databaseUrl);
  return drizzleNeon(sql, { schema });
}

/**
 * Get a Drizzle client using postgres.js (for the worker / long-lived processes).
 * Supports prepared statements and transactions over a real TCP connection.
 */
export function getWorkerDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const pg = postgres(databaseUrl, { max: 5, prepare: false });
  return drizzlePg(pg, { schema });
}

export { schema };
