# 04 — Acceptance Criteria (loop gates)

Each gate is pass/fail and should be scriptable. The loop cannot advance a phase until all its gates pass.

## P0 — Foundations
- P0.1 `pnpm build` and typecheck pass with zero errors.
- P0.2 All Neon tables from 00-PLAN.md §3 exist (migration applied).
- P0.3 `/api/health` returns 200 with `{ db: ok, redis: ok, blob: ok }`.
- P0.4 No secrets in repo (gitleaks clean); env validated at boot.

## P1 — Public site shell
- P1.1 `/leaderboard`, `/products/[slug]`, `/trials/[id]`, `/methodology` render 200.
- P1.2 Leaderboard ranks by score and supports scenario-set tabs.
- P1.3 Fully responsive (mobile + desktop screenshots verified in browser).
- P1.4 Accessibility: landmarks, alt text, keyboard nav; no critical a11y violations.
- P1.5 Zero console errors on each route.

## P2 — Scenario engine
- P2.1 8 scenarios seeded; ≥4 flagged adversarial.
- P2.2 Every scenario passes Zod validation for spec + oracle.
- P2.3 Rule-oracle produces the SAME result on the same action log across 3 runs (deterministic).
- P2.4 One scenario is a "correct answer is refuse" case; oracle rewards refusal.

## P3 — Arena + adapter
- P3.1 A trial runs inside isolation with egress allowlist enforced (blocked host test fails closed).
- P3.2 Reference adapter drives a real browser session to completion.
- P3.3 Timeout cap terminates a hung trial; cost cap aborts an over-budget trial.
- P3.4 trial + trial_step rows persist with timestamps and normalized actions.
- P3.5 Sandbox is destroyed after the trial (no leaked containers/VMs).

## P4 — Evidence pipeline
- P4.1 Video, trace.zip, HAR, DOM snapshots, step log all captured for a trial.
- P4.2 Artifacts uploaded to Blob (private) with sha256 recorded.
- P4.3 Replay viewer plays real video and lists real steps (no mocks remain).
- P4.4 Evidence access is signed/authorized (no public raw bucket URLs).
- P4.5 Corrupt/missing artifact is detected via hash mismatch and surfaced.

## P5 — Judge
- P5.1 Rule-oracle runs before LLM; a hard `mustNotDo` violation auto-fails regardless of LLM.
- P5.2 LLM judge uses temperature 0 + pinned model + stored rubric_version.
- P5.3 Judging the same trial twice yields identical passed + subscores (reproducible).
- P5.4 An injection-trap trial that fell for the trap => passed=false, injectedDefenseHeld=false.
- P5.5 Verdict persisted; leaderboard_snapshot recomputed.
- P5.6 Verdict rationale cites specific steps/evidence.

## P6 — Intake + admin
- P6.1 Submit-your-agent validates the adapter payload contract.
- P6.2 Admin auth (Better Auth email+password) gates the review queue.
- P6.3 Approve → enqueue → trial executes → verdict appears, all from admin UI.
- P6.4 Reject path records reason and hides submission from queue.
- P6.5 Rate limiting active on intake endpoint.

## P7 — Harden + observe
- P7.1 OTel traces emitted for a trial with gen_ai.* and sandbox.* attributes.
- P7.2 Sentry captures a deliberately thrown test error.
- P7.3 Public + intake routes rate-limited (429 on burst).
- P7.4 Per-trial budget guard blocks runaway spend.
- P7.5 CI runs gitleaks + semgrep + CodeQL and they pass (CI-only, not shipped in bundle).

## P8 — Production loop
- P8.1 Scheduled re-run produces a fresh leaderboard snapshot.
- P8.2 Sandbox killed mid-trial => trial quarantined, NOT scored as a real fail.
- P8.3 Adapter hang/judge error handled gracefully (no crash, retryable).
- P8.4 Load test: N concurrent trials complete without queue deadlock.
- P8.5 One real live agent product has a publicly viewable trial with evidence.
- P8.6 That trial's verdict reproduces across two independent judge runs.

## Global (must hold at all times)
- G.1 No AGPL/GPL code bundled into the distributed app.
- G.2 All DB queries parameterized + user/data scoped.
- G.3 No untrusted code executes outside isolation.
- G.4 THIRD_PARTY_NOTICES.md lists every dependency + license.
