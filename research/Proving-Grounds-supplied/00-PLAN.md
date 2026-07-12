# 00 — Detailed Depth Plan

## 0. Product definition (one paragraph)

Proving Grounds is an independent lab that benchmarks **AI agent products** on realistic,
adversarial tasks. Each "trial" runs a target agent inside an isolated sandbox against a
scenario (with hidden traps), captures full evidence (video, trace, network, DOM snapshots),
scores it with an LLM-as-judge against a **published rubric**, and publishes a verdict to a
public leaderboard with a shareable replay. Value = credible, reproducible, entertaining proof
of whether an agent actually works in real life.

## 1. Scope

### In scope (v1)
- Scenario library (adversarial + benign), versioned, with hidden success/trap oracles.
- Trial runner: isolated execution of a target agent against a scenario.
- Evidence pipeline: video + Playwright trace + network HAR + step log, stored in Blob.
- Judge: LLM-as-judge with structured rubric → pass/fail + sub-scores + rationale.
- Public site: leaderboard, product profile pages, trial replay viewer, methodology page.
- Intake: "submit your agent" form (adapter contract) + admin review queue.
- Observability + security hardening of the lab itself (L1/L7).

### Out of scope (v1)
- Running arbitrary untrusted agent *binaries* from the public (v1 = curated adapters only).
- Real-money task execution (no live purchases/transactions).
- Multi-agent orchestration frameworks as the runner.

## 2. Subsystems (the mental model)

1. **Arena** — sandbox + harness where a trial executes.
2. **Subjects** — agents-under-test, wrapped by a uniform adapter contract.
3. **Scenarios** — adversarial/benign tasks + oracles (the differentiator).
4. **Evidence** — capture + storage of everything that happened.
5. **Judge** — reproducible scoring + verdict.
6. **Trust surface** — public leaderboard, replay viewer, methodology, and self-observability.

## 3. Data model (Postgres)

- `product` (id, name, vendor, homepage, adapter_key, status, created_at)
- `agent_version` (id, product_id, label, released_at, adapter_config jsonb)
- `scenario` (id, slug, title, category, difficulty, is_adversarial, spec jsonb, oracle jsonb, version, active)
- `trial` (id, agent_version_id, scenario_id, status, started_at, finished_at, sandbox_kind, cost_cents, error)
- `trial_step` (id, trial_id, idx, ts, actor, action jsonb, screenshot_url)
- `evidence` (id, trial_id, kind[video|trace|har|dom|log], url, bytes, sha256)
- `verdict` (id, trial_id, judge_model, rubric_version, passed bool, score numeric, subscores jsonb, rationale, injected_defense_held bool)
- `leaderboard_snapshot` (id, scenario_set, computed_at, rankings jsonb)
- `submission` (id, submitter_email, product_name, adapter_payload jsonb, status, notes)

All user/data queries are scoped and parameterized. No ORM unless the DB skill mandates it
(Neon → Drizzle + Better Auth per skill).

## 4. Phased milestones

- **P0 — Foundations:** repo, DB schema, env, design system, Blob + DB integrations wired.
- **P1 — Public site shell:** leaderboard, product profile, methodology, replay viewer (mock data).
- **P2 — Scenario engine:** scenario schema, oracle contract, 8 seed scenarios (4 adversarial).
- **P3 — Arena + adapter:** sandbox runner (Playwright + microVM/container), 1 reference adapter (browser-use or Stagehand).
- **P4 — Evidence pipeline:** video + trace + HAR capture → Blob → replay viewer plays real trials.
- **P5 — Judge:** AI-SDK LLM-as-judge, rubric v1, verdict persistence, injection-defense check.
- **P6 — Intake + admin:** submit-your-agent, review queue, re-run/queue controls.
- **P7 — Harden + observe:** OTel GenAI traces, Sentry, secret scanning in CI, rate limits.
- **P8 — Production loop:** end-to-end trial from queue → verdict → leaderboard, load + failure tests.

## 5. Tech choices (grounded)

- **Framework:** Next.js App Router (16), TypeScript, Tailwind v4, shadcn/ui.
- **DB/Auth:** Neon Postgres (+ Better Auth for admin) per the `neon` skill.
- **Storage:** Vercel Blob for evidence artifacts (private).
- **Queue/state:** Upstash Redis for the trial job queue + rate limiting (ephemeral, appropriate use).
- **Arena:** Playwright driver; isolation via Vercel Sandbox / Firecracker-gVisor microVM; camoufox for adversarial pages.
- **Judge:** Vercel AI SDK, LLM-as-judge with a computer-use-capable model as director.
- **Observability:** OpenTelemetry GenAI semantic conventions (`gen_ai.*`) + Sentry + external Grafana.
- **Evidence viewer:** Playwright trace + video; optional replay.io deterministic replay.

## 6. Key risks + mitigations

- **Running untrusted agents = RCE risk.** → v1 curated adapters only; microVM isolation; egress allowlist; no host FS.
- **Judge non-determinism.** → pin model + temperature 0, publish rubric, store rubric_version, add rule-based oracle checks alongside LLM judgment.
- **Legal/ToS (adversarial payloads, AGPL repos).** → never bundle AGPL/offensive tooling; mine for fixtures only; keep scanners CI-only.
- **Gaming the leaderboard.** → hidden oracle variants, rotating scenario seeds, per-run randomization.
- **Cost blowout.** → per-trial cost cap, Redis budget guard, cheap model for pre-checks.

## 7. Definition of production-ready

All gates in `04-ACCEPTANCE-CRITERIA.md` pass, a real trial runs end-to-end against at least one
live agent product, evidence is viewable publicly, and the judge verdict is reproducible across two runs.
