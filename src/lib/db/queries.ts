/**
 * Live DB queries for public pages — R1 (Blocker 1).
 *
 * All queries use the neon() tagged-template driver (parameterized, G.2).
 * No mock data. Empty tables → empty arrays → empty states.
 */

import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

// ─── Types (matching DB rows) ─────────────────────────────────────────────────

export interface LeaderboardRow {
  rank: number;
  productId: string;
  productName: string;
  vendor: string;
  slug: string;
  score: number;
  passRate: number;
  trialCount: number;
  adversarialPassRate: number;
  avgCostCents: number;
  lastTrialAt: string | null;
}

export interface ScenarioSetRow {
  id: string;
  label: string;
  count: number;
}

export interface ProductDetailRow {
  id: string;
  name: string;
  vendor: string;
  homepage: string;
  adapterKey: string;
  status: string;
  description: string | null;
  createdAt: string;
}

export interface AgentVersionRow {
  id: string;
  label: string;
  releasedAt: string | null;
  createdAt: string;
}

export interface ProductTrialRow {
  id: string;
  scenarioTitle: string;
  scenarioSlug: string;
  status: string;
  costCents: number;
  startedAt: string | null;
  passed: boolean | null;
  score: string | null;
}

export interface TrialDetailRow {
  id: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  sandboxKind: string | null;
  costCents: number;
  error: string | null;
  versionLabel: string;
  productName: string;
  productSlug: string;
  scenarioTitle: string;
  scenarioSlug: string;
  passed: boolean | null;
  score: string | null;
  rationale: string | null;
  injectedDefenseHeld: boolean | null;
  rubricVersion: string | null;
  judgeModel: string | null;
}

export interface TrialStepRow {
  id: string;
  idx: number;
  ts: string;
  actor: string;
  action: Record<string, unknown>;
}

export interface EvidenceRow {
  id: string;
  kind: string;
  url: string;
  bytes: number;
  sha256: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Compute the leaderboard from verdicts (live), ranked by score DESC.
 * If scenarioSet !== "all", filter by scenario category.
 */
export async function getLeaderboard(scenarioSet: string = "all"): Promise<{
  rows: LeaderboardRow[];
  sets: ScenarioSetRow[];
}> {
  const sql = getSql();

  const setFilter =
    scenarioSet === "all" ? "" : `AND s.category = ${scenarioSet}`;

  // Use parameterized query via neon tagged template
  const rows = await sql`
    SELECT
      p.id AS "productId",
      p.name AS "productName",
      p.vendor,
      p.adapter_key AS slug,
      COALESCE(AVG(v.score::numeric), 0)::float AS score,
      CASE WHEN COUNT(v.id) > 0
        THEN (SUM(CASE WHEN v.passed THEN 1 ELSE 0 END)::float / COUNT(v.id) * 100)
        ELSE 0 END AS "passRate",
      COUNT(v.id)::int AS "trialCount",
      CASE WHEN COUNT(v.id) > 0
        THEN (SUM(CASE WHEN v.passed AND s.is_adversarial THEN 1 ELSE 0 END)::float /
              NULLIF(SUM(CASE WHEN s.is_adversarial THEN 1 ELSE 0 END), 0) * 100)
        ELSE 0 END AS "adversarialPassRate",
      COALESCE(AVG(t.cost_cents), 0)::int AS "avgCostCents",
      MAX(t.started_at)::text AS "lastTrialAt"
    FROM product p
    JOIN agent_version av ON av.product_id = p.id
    JOIN trial t ON t.agent_version_id = av.id
    LEFT JOIN verdict v ON v.trial_id = t.id
    LEFT JOIN scenario s ON s.id = t.scenario_id
    WHERE p.status = 'approved'
      ${scenarioSet === "all" ? sql`` : sql`AND s.category = ${scenarioSet}`}
    GROUP BY p.id, p.name, p.vendor, p.adapter_key
    HAVING COUNT(v.id) > 0
    ORDER BY score DESC
  ` as unknown as LeaderboardRow[];

  // Assign ranks
  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  // Get scenario sets for tabs
  const setRows = await sql`
    SELECT category AS id, category AS label, COUNT(*)::int AS count
    FROM scenario WHERE active = true
    GROUP BY category ORDER BY count DESC
  `;
  const sets: ScenarioSetRow[] = [
    { id: "all", label: "All Scenarios", count: setRows.reduce((s, r) => s + r.count, 0) },
    ...setRows.map((r) => ({ id: r.id, label: r.label, count: r.count })),
  ];

  return { rows: ranked, sets };
}

/**
 * Get a product by slug (adapter_key).
 */
export async function getProductBySlug(slug: string): Promise<ProductDetailRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, vendor, homepage, adapter_key AS "adapterKey", status, description, created_at::text AS "createdAt"
    FROM product WHERE adapter_key = ${slug} LIMIT 1
  `;
  return (rows[0] as ProductDetailRow) ?? null;
}

/**
 * Get agent versions for a product.
 */
export async function getAgentVersions(productId: string): Promise<AgentVersionRow[]> {
  const sql = getSql();
  return await sql`
    SELECT id, label, released_at::text AS "releasedAt", created_at::text AS "createdAt"
    FROM agent_version WHERE product_id = ${productId} ORDER BY created_at DESC
  ` as AgentVersionRow[];
}

/**
 * Get recent trials for a product (by slug).
 */
export async function getProductTrials(slug: string, limit: number = 10): Promise<ProductTrialRow[]> {
  const sql = getSql();
  return await sql`
    SELECT
      t.id, s.title AS "scenarioTitle", s.slug AS "scenarioSlug",
      t.status, t.cost_cents AS "costCents", t.started_at::text AS "startedAt",
      v.passed, v.score::text AS score
    FROM trial t
    JOIN agent_version av ON t.agent_version_id = av.id
    JOIN product p ON av.product_id = p.id
    JOIN scenario s ON t.scenario_id = s.id
    LEFT JOIN verdict v ON v.trial_id = t.id
    WHERE p.adapter_key = ${slug}
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  ` as ProductTrialRow[];
}

/**
 * Get full trial detail for the replay page.
 */
export async function getTrialDetail(trialId: string): Promise<TrialDetailRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      t.id, t.status,
      t.started_at::text AS "startedAt",
      t.finished_at::text AS "finishedAt",
      t.sandbox_kind::text AS "sandboxKind",
      t.cost_cents AS "costCents",
      t.error,
      av.label AS "versionLabel",
      p.name AS "productName",
      p.adapter_key AS "productSlug",
      s.title AS "scenarioTitle",
      s.slug AS "scenarioSlug",
      v.passed,
      v.score::text AS score,
      v.rationale,
      v.injected_defense_held AS "injectedDefenseHeld",
      v.rubric_version AS "rubricVersion",
      v.judge_model AS "judgeModel"
    FROM trial t
    JOIN agent_version av ON t.agent_version_id = av.id
    JOIN product p ON av.product_id = p.id
    JOIN scenario s ON t.scenario_id = s.id
    LEFT JOIN verdict v ON v.trial_id = t.id
    WHERE t.id = ${trialId}
    LIMIT 1
  `;
  return (rows[0] as TrialDetailRow) ?? null;
}

/**
 * Get trial steps for the replay timeline.
 */
export async function getTrialSteps(trialId: string): Promise<TrialStepRow[]> {
  const sql = getSql();
  return await sql`
    SELECT id, idx, ts::text AS ts, actor, action
    FROM trial_step WHERE trial_id = ${trialId} ORDER BY idx
  ` as TrialStepRow[];
}

/**
 * Get evidence rows for a trial.
 */
export async function getTrialEvidence(trialId: string): Promise<EvidenceRow[]> {
  const sql = getSql();
  return await sql`
    SELECT id, kind::text AS kind, url, bytes, sha256
    FROM evidence WHERE trial_id = ${trialId} ORDER BY kind
  ` as EvidenceRow[];
}
