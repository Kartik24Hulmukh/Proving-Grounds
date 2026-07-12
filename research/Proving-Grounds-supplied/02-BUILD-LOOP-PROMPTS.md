# 02 — Build-in-a-Loop Prompts

Feed these to a coding agent **one phase at a time**. Each phase has:
- a **Build prompt** (do the work),
- a **Verify prompt** (prove it works),
- a **Repair prompt** (loop until green).

## The master loop (paste this first, once)

```
You are building "Proving Grounds", an adversarial testing lab + public leaderboard for AI
agent products. Follow proving-grounds/00-PLAN.md and 01-ARCHITECTURE.md exactly.

Rules for every phase:
1. Build only the current phase's scope. Do not scaffold future phases.
2. After building, run the phase's acceptance gates from 04-ACCEPTANCE-CRITERIA.md.
3. Print the gate results. If any gate fails, fix it and re-run gates. Repeat until ALL pass.
4. Never mock data once the real integration for that subsystem exists.
5. Use Neon (Drizzle+Better Auth), Vercel Blob (private), Upstash Redis, Vercel AI SDK.
6. Verify user-visible changes in a real browser before declaring the phase done.
7. Only advance when I say "advance to P<n+1>".
Start with P0. Confirm the plan back to me in 5 bullets, then begin.
```

---

## P0 — Foundations

**Build:**
```
Implement P0. Create the Next.js App Router project scaffold with TypeScript, Tailwind v4,
shadcn/ui, and a cohesive design system (3–5 colors, 2 fonts, dark-lab aesthetic).
Wire integrations: Neon (create the full schema from 00-PLAN.md §3 with Drizzle),
Vercel Blob (private), Upstash Redis. Add env validation and a /api/health route that
checks DB + Redis + Blob connectivity. No feature UI yet.
```
**Verify:** `Run gates P0.1–P0.4. Show /api/health returning ok for all three services.`
**Repair:** `A P0 gate failed: <paste>. Fix root cause (not the test), re-run all P0 gates, report.`

---

## P1 — Public site shell (mock data)

**Build:**
```
Implement P1. Build the public site shell against typed mock data:
- Leaderboard page (ranked product cards, per-scenario-set tabs, score bars).
- Product profile page /products/[slug] (versions, pass rate, recent trials).
- Trial replay viewer /trials/[id] (video slot, step timeline, evidence links) — mock.
- Methodology page (renders the rubric + how scoring works).
Split into components, mobile-first, accessible. Use the design system from P0.
```
**Verify:** `Run gates P1.1–P1.5. Open each route in the browser, snapshot + screenshot, confirm layout.`
**Repair:** `P1 gate failed: <paste>. Fix and re-verify in the browser.`

---

## P2 — Scenario engine

**Build:**
```
Implement P2. Create the scenario schema + Zod validation, the oracle contract (rule checks),
and 8 seed scenarios (4 adversarial incl. a prompt-injection trap and a "correct answer is
I-can't" trap). Add lib/scenarios with loader + fixture pages served locally (camoufox-style
adversarial DOM). Add an admin-only scenario browser. Persist scenarios to Neon.
```
**Verify:** `Run gates P2.1–P2.4. Load each scenario, validate oracle rule-check runs deterministically on a sample action log.`
**Repair:** `P2 gate failed: <paste>. Fix and re-run.`

---

## P3 — Arena + reference adapter

**Build:**
```
Implement P3. Build lib/arena: an isolated Playwright runner (Vercel Sandbox or container +
gVisor; egress allowlist; timeout + cost cap). Define the AgentAdapter contract from
01-ARCHITECTURE.md §2 and implement ONE reference adapter (browser-use or Stagehand).
Add worker/ entrypoint that pulls a trial job from Redis and executes scenario+adapter,
writing trial + trial_step rows. Do not judge yet.
```
**Verify:** `Run gates P3.1–P3.5. Execute one real trial end-to-end (no judge); show trial_step rows + timing + cost cap enforcement.`
**Repair:** `P3 gate failed: <paste>. Fix isolation/adapter/runner, re-run a real trial.`

---

## P4 — Evidence pipeline

**Build:**
```
Implement P4. Capture video, Playwright trace.zip, network HAR, DOM snapshots, and step log
during a trial. Upload to Vercel Blob (private), hash sha256, persist evidence rows.
Wire the /trials/[id] replay viewer to play REAL evidence (remove mocks). Signed access only.
```
**Verify:** `Run gates P4.1–P4.5. Run a trial, then load its replay page and confirm real video + trace download + steps.`
**Repair:** `P4 gate failed: <paste>. Fix capture/upload/playback, re-verify in browser.`

---

## P5 — Judge

**Build:**
```
Implement P5. Build lib/judge with the Vercel AI SDK: rule-oracle runs first (hard
mustNotDo violation => auto-fail, LLM cannot override), then generateObject LLM-as-judge
with a Zod rubric (temperature 0, pinned model, rubric_version). Persist verdict incl.
injectedDefenseHeld. Recompute leaderboard_snapshot after each verdict.
```
**Verify:** `Run gates P5.1–P5.6. Judge the same trial twice; verdict must be reproducible. Confirm an injection-trap trial that fell for the trap auto-fails.`
**Repair:** `P5 gate failed: <paste>. Fix determinism/oracle precedence, re-run twice.`

---

## P6 — Intake + admin

**Build:**
```
Implement P6. Build "submit your agent" intake (adapter payload contract + validation) and an
auth-gated admin: review queue (approve/reject submissions), enqueue trials, re-run controls,
trial status board. Better Auth email+password for admins only.
```
**Verify:** `Run gates P6.1–P6.5. Submit an agent, approve it in admin, enqueue a trial, watch it reach a verdict.`
**Repair:** `P6 gate failed: <paste>. Fix intake/admin/queue, re-run the full submit→verdict path.`

---

## P7 — Harden + observe

**Build:**
```
Implement P7. Add OpenTelemetry with GenAI semantic conventions (gen_ai.*) and sandbox.*
attributes across runner + judge; wire Sentry; add Upstash rate limiting on public + intake
routes and a per-trial budget guard. Add CI: gitleaks + semgrep + CodeQL (CI-only, not shipped).
```
**Verify:** `Run gates P7.1–P7.5. Show traces for one trial, a triggered rate limit, and CI security jobs passing.`
**Repair:** `P7 gate failed: <paste>. Fix instrumentation/limits/CI, re-verify.`

---

## P8 — Production loop

**Build:**
```
Implement P8. Close the loop: scheduled re-runs, leaderboard freshness, graceful failure
handling (sandbox crash, adapter hang, judge error => quarantined trial, not a bad verdict).
Add load test (N concurrent trials) and a chaos test (kill a sandbox mid-trial).
Run one FULL end-to-end trial against a real live agent product and publish it.
```
**Verify:** `Run ALL gates in 04-ACCEPTANCE-CRITERIA.md. Provide the public URL of one real published trial + its reproducible verdict.`
**Repair:** `Final gate failed: <paste>. Fix and re-run the full suite until 100% green.`

---

## Loop-exit condition

Stop only when: every gate in `04-ACCEPTANCE-CRITERIA.md` is green, one real agent product has a
publicly viewable trial with evidence, and its verdict reproduces across two independent judge runs.
