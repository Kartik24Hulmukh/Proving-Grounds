/**
 * Drizzle ORM schema for Proving Grounds.
 *
 * Implements the full data model from 00-PLAN.md §3:
 *   product, agent_version, scenario, trial, trial_step,
 *   evidence, verdict, leaderboard_snapshot, submission
 *
 * All queries against these tables must be parameterized (Drizzle handles this)
 * and scoped to the relevant tenant/data context (G.2).
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const productStatus = pgEnum("product_status", [
  "pending",
  "approved",
  "rejected",
  "archived",
]);

export const trialStatus = pgEnum("trial_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "quarantined",
  "timeout",
]);

export const sandboxKind = pgEnum("sandbox_kind", [
  "vercel-sandbox",
  "firecracker",
  "gvisor",
  "container",
]);

export const evidenceKind = pgEnum("evidence_kind", [
  "video",
  "trace",
  "har",
  "dom",
  "log",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

/** A shipping agent product (e.g. browser-use, Stagehand). */
export const product = pgTable(
  "product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    vendor: text("vendor").notNull(),
    homepage: text("homepage").notNull(),
    adapterKey: text("adapter_key").notNull(),
    status: productStatus("status").notNull().default("pending"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("product_adapter_key_idx").on(t.adapterKey),
    index("product_status_idx").on(t.status),
  ]
);

/** A specific version/release of an agent product with its adapter config. */
export const agentVersion = pgTable(
  "agent_version",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    adapterConfig: jsonb("adapter_config").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_version_product_idx").on(t.productId)]
);

/** A versioned adversarial/benign task spec + hidden oracle. */
export const scenario = pgTable(
  "scenario",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    difficulty: text("difficulty").notNull(),
    isAdversarial: boolean("is_adversarial").notNull().default(false),
    spec: jsonb("spec").notNull(),
    oracle: jsonb("oracle").notNull(),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("scenario_slug_version_idx").on(t.slug, t.version),
    index("scenario_active_idx").on(t.active),
    index("scenario_category_idx").on(t.category),
  ]
);

/** A single execution of an agent version against a scenario. */
export const trial = pgTable(
  "trial",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentVersionId: uuid("agent_version_id")
      .notNull()
      .references(() => agentVersion.id, { onDelete: "cascade" }),
    scenarioId: uuid("scenario_id")
      .notNull()
      .references(() => scenario.id, { onDelete: "cascade" }),
    status: trialStatus("status").notNull().default("queued"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    sandboxKind: sandboxKind("sandbox_kind"),
    costCents: integer("cost_cents").notNull().default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("trial_status_idx").on(t.status),
    index("trial_agent_version_idx").on(t.agentVersionId),
    index("trial_scenario_idx").on(t.scenarioId),
  ]
);

/** A normalized action step recorded during a trial. */
export const trialStep = pgTable(
  "trial_step",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trialId: uuid("trial_id")
      .notNull()
      .references(() => trial.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
    actor: text("actor").notNull(),
    action: jsonb("action").notNull(),
    screenshotUrl: text("screenshot_url"),
  },
  (t) => [index("trial_step_trial_idx").on(t.trialId, t.idx)]
);

/** A captured evidence artifact stored in Vercel Blob. */
export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trialId: uuid("trial_id")
      .notNull()
      .references(() => trial.id, { onDelete: "cascade" }),
    kind: evidenceKind("kind").notNull(),
    url: text("url").notNull(),
    bytes: integer("bytes").notNull().default(0),
    sha256: text("sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("evidence_trial_idx").on(t.trialId)]
);

/** The judge's verdict for a trial. */
export const verdict = pgTable(
  "verdict",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trialId: uuid("trial_id")
      .notNull()
      .references(() => trial.id, { onDelete: "cascade" }),
    judgeModel: text("judge_model").notNull(),
    rubricVersion: text("rubric_version").notNull(),
    passed: boolean("passed").notNull(),
    score: numeric("score", { precision: 5, scale: 2 }).notNull(),
    subscores: jsonb("subscores").notNull().default({}),
    rationale: text("rationale").notNull(),
    injectedDefenseHeld: boolean("injected_defense_held").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("verdict_trial_idx").on(t.trialId)]
);

/** A point-in-time snapshot of the public leaderboard. */
export const leaderboardSnapshot = pgTable(
  "leaderboard_snapshot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scenarioSet: text("scenario_set").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    rankings: jsonb("rankings").notNull().default([]),
  },
  (t) => [index("leaderboard_set_idx").on(t.scenarioSet)]
);

/** An agent submission from the public intake form. */
export const submission = pgTable(
  "submission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submitterEmail: text("submitter_email").notNull(),
    productName: text("product_name").notNull(),
    adapterPayload: jsonb("adapter_payload").notNull(),
    status: text("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [index("submission_status_idx").on(t.status)]
);

// ─── Type Exports ────────────────────────────────────────────────────────────

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
export type AgentVersion = typeof agentVersion.$inferSelect;
export type NewAgentVersion = typeof agentVersion.$inferInsert;
export type Scenario = typeof scenario.$inferSelect;
export type NewScenario = typeof scenario.$inferInsert;
export type Trial = typeof trial.$inferSelect;
export type NewTrial = typeof trial.$inferInsert;
export type TrialStep = typeof trialStep.$inferSelect;
export type NewTrialStep = typeof trialStep.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
export type Verdict = typeof verdict.$inferSelect;
export type NewVerdict = typeof verdict.$inferInsert;
export type LeaderboardSnapshot = typeof leaderboardSnapshot.$inferSelect;
export type NewLeaderboardSnapshot = typeof leaderboardSnapshot.$inferInsert;
export type Submission = typeof submission.$inferSelect;
export type NewSubmission = typeof submission.$inferInsert;
