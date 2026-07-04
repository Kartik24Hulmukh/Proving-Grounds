/**
 * Migration verification script — P0.2
 *
 * Connects to Neon, runs the migration, then verifies all 9 tables exist.
 * Run with: npx tsx src/lib/db/verify-migration.ts
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXPECTED_TABLES = [
  "product",
  "agent_version",
  "scenario",
  "trial",
  "trial_step",
  "evidence",
  "verdict",
  "leaderboard_snapshot",
  "submission",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Read and execute the migration SQL
  const migrationPath = join(__dirname, "..", "..", "..", "drizzle", "0000_noisy_doorman.sql");
  const migrationSql = readFileSync(migrationPath, "utf-8");

  // Split on statement-breakpoint and execute each statement
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`📋 Executing ${statements.length} migration statements...`);

  for (const stmt of statements) {
    try {
      await sql(stmt as unknown as TemplateStringsArray);
    } catch (e) {
      // Ignore "already exists" errors (re-runnable)
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log(`  ⏭️  Skipped (already exists): ${stmt.slice(0, 60)}...`);
      } else {
        console.error(`  ❌ Failed: ${msg}`);
        console.error(`  Statement: ${stmt.slice(0, 100)}...`);
        process.exit(1);
      }
    }
  }

  // Verify all tables exist
  console.log("\n🔍 Verifying tables exist...");
  const result = await sql(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const existingTables = (result as Array<Record<string, string>>).map((r) => r.table_name);
  const missing = EXPECTED_TABLES.filter((t) => !existingTables.includes(t));

  if (missing.length > 0) {
    console.error(`❌ Missing tables: ${missing.join(", ")}`);
    console.error(`   Found: ${existingTables.join(", ")}`);
    process.exit(1);
  }

  console.log(`✅ All ${EXPECTED_TABLES.length} tables verified:`);
  for (const table of EXPECTED_TABLES) {
    const count = await sql(`SELECT count(*) as cnt FROM ${table}` as unknown as TemplateStringsArray);
    console.log(`   • ${table} (${(count as Array<Record<string, number>>)[0].cnt} rows)`);
  }

  console.log("\n✅ P0.2 PASS: All Neon tables exist (migration applied)");
}

main().catch((e) => {
  console.error("❌ Migration verification failed:", e);
  process.exit(1);
});
