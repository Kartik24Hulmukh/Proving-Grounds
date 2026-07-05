/**
 * Trial Batch Operator — runs the full pipeline for all 8 scenarios.
 *
 * Pipeline per trial: enqueue → fixture server → adapter → evidence → judge → verdict → leaderboard
 *
 * Scenarios:
 *   Normal: form-fill-basic, job-search-filter, cart-checkout-happy,
 *           support-ticket-triage, data-extract-paginated
 *   Adversarial: prompt-injection-canary, refund-trap-darkpattern, delegation-exfil
 *
 * Subject: Playwright Browser adapter (real browser, real evidence)
 *
 * Run with: npx tsx src/lib/arena/run-batch.ts
 */

import { neon } from "@neondatabase/serverless";
import { runTrial, type TrialRunResult } from "@/lib/arena/runner";
import { startFixtureServer, type FixtureServer } from "@/lib/arena/fixture-server";
import { judgeTrial, persistVerdict, recomputeLeaderboard, rubricVersion, judgeModel } from "@/lib/judge/judge";
import { getScenarioBySlug } from "@/lib/scenarios/seeds";
import { actionsToActionLog } from "@/lib/adapters/contract";
import { head } from "@vercel/blob";
import { createHash } from "node:crypto";

interface BatchTrialResult {
  trialId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  subjectName: string;
  subjectVersion: string;
  status: string;
  ruleOraclePassed: boolean;
  hardFailViolations: string[];
  verdict: {
    passed: boolean;
    score: number;
    rubricVersion: string;
    judgeModel: string;
    injectedDefenseHeld: boolean;
  } | null;
  evidence: {
    kind: string;
    bytes: number;
    sha256: string;
    sha256Verified: boolean;
    url: string;
  }[];
  videoMagicBytes: string | null;
  isWebM: boolean;
  reproducible: boolean | null;
  error?: string;
}

const SUBJECT_NAME = "Playwright Browser";
const SUBJECT_VERSION = "v1.0.0";
const ADAPTER_KEY = "playwright-browser";

const NORMAL_SCENARIOS = [
  "form-fill-basic",
  "job-search-filter",
  "cart-checkout-happy",
  "support-ticket-triage",
  "data-extract-paginated",
];

const ADVERSARIAL_SCENARIOS = [
  "prompt-injection-canary",
  "refund-trap-darkpattern",
  "delegation-exfil",
];

const ALL_SCENARIOS = [...NORMAL_SCENARIOS, ...ADVERSARIAL_SCENARIOS];

// Reproducibility test subjects: one normal, one adversarial
const REPROducibility_SLUGS = ["form-fill-basic", "prompt-injection-canary"];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const sql = neon(databaseUrl);

  console.log("════════════════════════════════════════════════════════════════");
  console.log("  PROVING GROUNDS — TRIAL BATCH OPERATOR");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`  Subject: ${SUBJECT_NAME} (${SUBJECT_VERSION})`);
  console.log(`  Adapter: ${ADAPTER_KEY}`);
  console.log(`  Scenarios: ${ALL_SCENARIOS.length} (${NORMAL_SCENARIOS.length} normal, ${ADVERSARIAL_SCENARIOS.length} adversarial)`);
  console.log(`  Rubric: ${rubricVersion} | Judge: ${judgeModel}`);
  console.log("");

  // Start fixture server
  const fixtureServer = await startFixtureServer(9876);
  console.log("");

  const results: BatchTrialResult[] = [];

  try {
    // Get or create product + agent_version
    let productRows = await sql`SELECT id FROM product WHERE adapter_key = ${ADAPTER_KEY} LIMIT 1`;
    let productId: string;
    if (productRows.length === 0) {
      const pRows = await sql`
        INSERT INTO product (name, vendor, homepage, adapter_key, status, description)
        VALUES (${SUBJECT_NAME}, 'proving-grounds', 'https://arena.local', ${ADAPTER_KEY}, 'approved', 'Real Playwright browser adapter')
        RETURNING id
      `;
      productId = pRows[0].id as string;
    } else {
      productId = productRows[0].id as string;
    }

    // Create a new agent_version for this batch
    const vRows = await sql`
      INSERT INTO agent_version (product_id, label, adapter_config)
      VALUES (${productId}, ${SUBJECT_VERSION}, ${JSON.stringify({ adapter: ADAPTER_KEY })}::jsonb)
      RETURNING id
    `;
    const agentVersionId = vRows[0].id as string;
    console.log(`  Agent version: ${agentVersionId}`);
    console.log("");

    // Run each scenario
    for (let i = 0; i < ALL_SCENARIOS.length; i++) {
      const slug = ALL_SCENARIOS[i];
      const isAdversarial = ADVERSARIAL_SCENARIOS.includes(slug);
      const category = isAdversarial ? "ADVERSARIAL" : "NORMAL";

      console.log(`┌─── [${i + 1}/${ALL_SCENARIOS.length}] ${category}: ${slug} ───┐`);

      const scenario = getScenarioBySlug(slug);
      if (!scenario) {
        console.log(`  ERROR: Scenario not found: ${slug}`);
        continue;
      }

      // Get scenario DB id
      const sRows = await sql`SELECT id FROM scenario WHERE slug = ${slug} AND active = true LIMIT 1`;
      if (sRows.length === 0) {
        console.log(`  ERROR: Scenario not in DB: ${slug}`);
        continue;
      }
      const scenarioId = sRows[0].id as string;

      // Create trial
      const tRows = await sql`
        INSERT INTO trial (agent_version_id, scenario_id, status)
        VALUES (${agentVersionId}, ${scenarioId}, 'queued')
        RETURNING id
      `;
      const trialId = tRows[0].id as string;
      console.log(`  Trial ID: ${trialId}`);

      // Run trial
      const result: TrialRunResult = await runTrial({
        trialId,
        agentVersionId,
        scenarioSlug: slug,
        adapterKey: ADAPTER_KEY,
        egressAllowlist: ["localhost", "127.0.0.1", "arena.local"],
        timeoutMs: 60000,
        costCapCents: 500,
      });

      console.log(`  Status: ${result.status}`);
      console.log(`  Duration: ${result.durationMs}ms`);
      console.log(`  Rule oracle: ${result.ruleOraclePassed ? "PASS" : "FAIL"}`);
      if (result.hardFailViolations.length > 0) {
        console.log(`  Hard-fail violations: ${result.hardFailViolations.join(", ")}`);
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }

      // Get evidence rows
      const evidenceRows = await sql`
        SELECT kind, url, bytes, sha256 FROM evidence WHERE trial_id = ${trialId} ORDER BY kind
      `;
      console.log(`  Evidence: ${evidenceRows.length} artifacts`);

      // Verify evidence integrity (SHA-256)
      const evidence: BatchTrialResult["evidence"] = [];
      let videoMagicBytes: string | null = null;
      let isWebM = false;

      for (const row of evidenceRows) {
        let sha256Verified = false;
        try {
          const info = await head(row.url);
          const resp = await fetch(info.downloadUrl, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
          });
          const buffer = Buffer.from(await resp.arrayBuffer());
          const recomputedHash = createHash("sha256").update(buffer).digest("hex");
          sha256Verified = recomputedHash === row.sha256;

          // Check WebM magic bytes for video
          if (row.kind === "video") {
            videoMagicBytes = buffer.slice(0, 4).toString("hex");
            isWebM = videoMagicBytes === "1a45dfa3";
            console.log(`  Video: ${buffer.length} bytes, magic=${videoMagicBytes}, WebM=${isWebM}`);
          }
        } catch (e) {
          console.log(`  Evidence verify error (${row.kind}): ${e instanceof Error ? e.message : String(e)}`);
        }
        evidence.push({
          kind: row.kind,
          bytes: row.bytes,
          sha256: row.sha256,
          sha256Verified,
          url: row.url,
        });
        console.log(`    ${row.kind}: ${row.bytes} bytes, sha256=${row.sha256.slice(0, 16)}..., verified=${sha256Verified}`);
      }

      // Run judge
      let verdict: BatchTrialResult["verdict"] = null;
      let reproducible: boolean | null = null;

      if (result.status === "completed" && result.agentResult) {
        const actionLog = actionsToActionLog(result.agentResult.actions);
        const judgeResult = await judgeTrial({
          oracle: scenario.oracle,
          actionLog,
          goal: scenario.spec.goal,
          scenarioTitle: scenario.spec.title,
          finalAnswer: result.agentResult.finalAnswer,
        });

        await persistVerdict(trialId, judgeResult);

        verdict = {
          passed: judgeResult.passed,
          score: judgeResult.score,
          rubricVersion: judgeResult.rubricVersion,
          judgeModel: judgeResult.judgeModel,
          injectedDefenseHeld: judgeResult.injectedDefenseHeld,
        };

        console.log(`  Verdict: ${judgeResult.passed ? "PASS" : "FAIL"} (score=${judgeResult.score})`);
        console.log(`  Defense held: ${judgeResult.injectedDefenseHeld}`);

        // Reproducibility test: judge twice for representative trials
        if (REPROducibility_SLUGS.includes(slug)) {
          const judgeResult2 = await judgeTrial({
            oracle: scenario.oracle,
            actionLog,
            goal: scenario.spec.goal,
            scenarioTitle: scenario.spec.title,
            finalAnswer: result.agentResult.finalAnswer,
          });

          reproducible =
            judgeResult.passed === judgeResult2.passed &&
            judgeResult.score === judgeResult2.score &&
            judgeResult.injectedDefenseHeld === judgeResult2.injectedDefenseHeld;

          console.log(`  Reproducibility: ${reproducible ? "IDENTICAL" : "MISMATCH"}`);
          console.log(`    Run 1: passed=${judgeResult.passed}, score=${judgeResult.score}`);
          console.log(`    Run 2: passed=${judgeResult2.passed}, score=${judgeResult2.score}`);
        }
      }

      // For adversarial trials, verify defense held
      if (isAdversarial && result.status === "completed") {
        const defenseHeld = result.hardFailViolations.length === 0;
        console.log(`  Adversarial defense: ${defenseHeld ? "HELD (PASS)" : "BREACHED (FAIL)"}`);
      }

      // For quarantined trials, verify zero evidence
      if (result.status === "quarantined") {
        console.log(`  Quarantined: ${result.error}`);
        console.log(`  Evidence rows: ${evidenceRows.length} (expected 0)`);
      }

      results.push({
        trialId,
        scenarioSlug: slug,
        scenarioTitle: scenario.spec.title,
        subjectName: SUBJECT_NAME,
        subjectVersion: SUBJECT_VERSION,
        status: result.status,
        ruleOraclePassed: result.ruleOraclePassed,
        hardFailViolations: result.hardFailViolations,
        verdict,
        evidence,
        videoMagicBytes,
        isWebM,
        reproducible,
        error: result.error,
      });

      console.log(`└────────────────────────────────────────────────┘`);
      console.log("");
    }

    // Recompute leaderboard
    await recomputeLeaderboard("all");
    console.log("  Leaderboard recomputed.");

  } finally {
    await fixtureServer.close();
    console.log("\n  Fixture server closed.");
  }

  // Output summary table
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  RESULTS SUMMARY");
  console.log("════════════════════════════════════════════════════════════════");
  console.log("");

  let normalPass = 0;
  let adversarialDefended = 0;
  let allShaVerified = true;
  let allReproducible = true;

  for (const r of results) {
    const isAdv = ADVERSARIAL_SCENARIOS.includes(r.scenarioSlug);
    const verdictStr = r.verdict ? (r.verdict.passed ? "PASS" : "FAIL") : "N/A";
    const oracleStr = r.ruleOraclePassed ? "PASS" : "FAIL";
    const scoreStr = r.verdict ? String(r.verdict.score) : "N/A";
    const shaShort = r.evidence.length > 0 ? r.evidence[0].sha256.slice(0, 12) : "N/A";
    const reproStr = r.reproducible !== null ? (r.reproducible ? "Y" : "N") : "-";

    console.log(`  ${r.scenarioSlug.padEnd(30)} | ${verdictStr.padEnd(6)} | oracle=${oracleStr.padEnd(6)} | score=${scoreStr.padEnd(6)} | sha=${shaShort} | repro=${reproStr}`);

    if (!isAdv && r.verdict?.passed) normalPass++;
    if (isAdv && r.hardFailViolations.length === 0 && r.status === "completed") adversarialDefended++;

    for (const e of r.evidence) {
      if (!e.sha256Verified) allShaVerified = false;
    }
    if (r.reproducible === false) allReproducible = false;
  }

  console.log("");
  console.log(`  Normal pass: ${normalPass}/${NORMAL_SCENARIOS.length}`);
  console.log(`  Adversarial defended: ${adversarialDefended}/${ADVERSARIAL_SCENARIOS.length}`);
  console.log(`  All SHA-256 verified: ${allShaVerified}`);
  console.log(`  All reproducible: ${allReproducible}`);
  console.log("");

  // Output JSON for further processing
  const jsonPath = "/home/user/batch-results.json";
  const { writeFileSync } = await import("node:fs");
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`  Full results saved to: ${jsonPath}`);

  // Output markdown table
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  MARKDOWN RESULTS TABLE");
  console.log("════════════════════════════════════════════════════════════════");
  console.log("");
  console.log("| scenario | subject | verdict | oracle | judge score | sha256(short) | reproducible(Y/N) | evidence_url |");
  console.log("|----------|---------|---------|--------|-------------|---------------|-------------------|--------------|");
  for (const r of results) {
    const verdictStr = r.verdict ? (r.verdict.passed ? "PASS" : "FAIL") : "N/A";
    const oracleStr = r.ruleOraclePassed ? "PASS" : "FAIL";
    const scoreStr = r.verdict ? String(r.verdict.score) : "N/A";
    const shaShort = r.evidence.length > 0 ? r.evidence[0].sha256.slice(0, 12) : "N/A";
    const reproStr = r.reproducible !== null ? (r.reproducible ? "Y" : "N") : "-";
    const evidenceUrl = r.evidence.length > 0 ? r.evidence[0].url : "N/A";
    console.log(`| ${r.scenarioSlug} | ${r.subjectName} ${r.subjectVersion} | ${verdictStr} | ${oracleStr} | ${scoreStr} | ${shaShort} | ${reproStr} | ${evidenceUrl} |`);
  }
}

main().catch((e) => {
  console.error("❌ Batch operator failed:", e);
  process.exit(1);
});
