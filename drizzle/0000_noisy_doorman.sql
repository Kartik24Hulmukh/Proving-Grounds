CREATE TYPE "public"."evidence_kind" AS ENUM('video', 'trace', 'har', 'dom', 'log');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('pending', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sandbox_kind" AS ENUM('vercel-sandbox', 'firecracker', 'gvisor', 'container');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('queued', 'running', 'completed', 'failed', 'quarantined', 'timeout');--> statement-breakpoint
CREATE TABLE "agent_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"label" text NOT NULL,
	"released_at" timestamp with time zone,
	"adapter_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trial_id" uuid NOT NULL,
	"kind" "evidence_kind" NOT NULL,
	"url" text NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenario_set" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rankings" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"vendor" text NOT NULL,
	"homepage" text NOT NULL,
	"adapter_key" text NOT NULL,
	"status" "product_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"is_adversarial" boolean DEFAULT false NOT NULL,
	"spec" jsonb NOT NULL,
	"oracle" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitter_email" text NOT NULL,
	"product_name" text NOT NULL,
	"adapter_payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_version_id" uuid NOT NULL,
	"scenario_id" uuid NOT NULL,
	"status" "trial_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"sandbox_kind" "sandbox_kind",
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trial_id" uuid NOT NULL,
	"idx" integer NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text NOT NULL,
	"action" jsonb NOT NULL,
	"screenshot_url" text
);
--> statement-breakpoint
CREATE TABLE "verdict" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trial_id" uuid NOT NULL,
	"judge_model" text NOT NULL,
	"rubric_version" text NOT NULL,
	"passed" boolean NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"subscores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rationale" text NOT NULL,
	"injected_defense_held" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_version" ADD CONSTRAINT "agent_version_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_trial_id_trial_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trial"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial" ADD CONSTRAINT "trial_agent_version_id_agent_version_id_fk" FOREIGN KEY ("agent_version_id") REFERENCES "public"."agent_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial" ADD CONSTRAINT "trial_scenario_id_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trial_step" ADD CONSTRAINT "trial_step_trial_id_trial_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trial"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdict" ADD CONSTRAINT "verdict_trial_id_trial_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trial"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_version_product_idx" ON "agent_version" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "evidence_trial_idx" ON "evidence" USING btree ("trial_id");--> statement-breakpoint
CREATE INDEX "leaderboard_set_idx" ON "leaderboard_snapshot" USING btree ("scenario_set");--> statement-breakpoint
CREATE UNIQUE INDEX "product_adapter_key_idx" ON "product" USING btree ("adapter_key");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "scenario_slug_version_idx" ON "scenario" USING btree ("slug","version");--> statement-breakpoint
CREATE INDEX "scenario_active_idx" ON "scenario" USING btree ("active");--> statement-breakpoint
CREATE INDEX "scenario_category_idx" ON "scenario" USING btree ("category");--> statement-breakpoint
CREATE INDEX "submission_status_idx" ON "submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trial_status_idx" ON "trial" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trial_agent_version_idx" ON "trial" USING btree ("agent_version_id");--> statement-breakpoint
CREATE INDEX "trial_scenario_idx" ON "trial" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "trial_step_trial_idx" ON "trial_step" USING btree ("trial_id","idx");--> statement-breakpoint
CREATE UNIQUE INDEX "verdict_trial_idx" ON "verdict" USING btree ("trial_id");