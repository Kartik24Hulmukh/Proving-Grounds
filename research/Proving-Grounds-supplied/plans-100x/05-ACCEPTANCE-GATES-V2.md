# 05 — Acceptance Gates v2 (P9–P15)

Rules unchanged from v1: every gate is machine-checkable; a phase is done only when all its gates
pass plus the standing gates. Do not advance with a red gate.

## Standing gates (every phase, carried from v1)
- `pnpm typecheck`, `pnpm lint`, `pnpm test` all green.
- No secrets in repo (gitleaks clean); semgrep/CodeQL clean.
- All DB access parameterized + scoped; no raw string interpolation into SQL.
- THIRD_PARTY_NOTICES.md updated if dependencies changed; no AGPL/GPL in the shipped bundle.
- Every new lib area ships a `verify.ts` self-check runnable via `tsx`.

## P9 — Attestation
- [ ] Sealing a fixture trial produces an `evidence_manifest` row + `attestation_chain` row; chain `prevHash` linkage validates across ≥3 sequential seals.
- [ ] Flipping one byte of any artifact → verifier fails with an artifact-hash reason.
- [ ] Rewriting any chain row → verifier fails with a chain reason.
- [ ] Signature check fails under a wrong/rotated-out public key; passes under the published key.
- [ ] /api/attestation/log is publicly readable, paginated, and append-only (no UPDATE/DELETE path in code).
- [ ] Trial replay page renders the Merkle root + verify command for a sealed trial.

## P9.5 — CLI
- [ ] `pg verify <trialId>` exits 0 on an untampered fixture trial against a local server; exits non-zero after artifact tamper.
- [ ] Package has no imports from server-only modules (build passes in isolation); `npm publish --dry-run` succeeds in CI.
- [ ] `pg rerun` reproduces the fixture trial verdict using the pinned scenario + reference adapter.

## P10 — Scorecard v2
- [ ] A scored evaluation stores exactly k runs; Pass^1/Pass^k computed correctly on property-test fixtures (k of k successes → Pass^k = 1; one failure → < 1).
- [ ] Mutating a scenario fixture mid-run fails the trial with reason `fixture_tampered`.
- [ ] Canary token appearing in agent output flags the run as `leakage_suspected`.
- [ ] Oracle/checker executes in a separate process from the agent sandbox (asserted in test via process isolation check).
- [ ] Scoring uses only `scenario_variant` (held-out) rows; public siblings excluded (query-level test).
- [ ] Golden-trial judge suite passes; a deliberately broken rubric change makes CI fail.
- [ ] Leaderboard shows Pass^k, Injection Defense, Refusal Correctness, Cost-per-Success with k and CI displayed.

## P11 — Certification
- [ ] Domain-verification claim flow works (TXT or meta); unverified claim cannot access private results.
- [ ] Badge SVG renders correct tier; renders "expired" past `expiresAt`; tampered badge params rejected (HMAC).
- [ ] Import-graph test proves no scoring/judging module imports certification/billing modules.
- [ ] /methodology publishes independence firewall, no-pay-for-result policy, signing keys, appeal process.

## P12 — CI + MCP
- [ ] API v1 contract tests pass; unauthenticated evaluation trigger rejected; rate limit fails closed when Redis is down.
- [ ] Evaluation runs triggered via API respect per-key budget caps.
- [ ] GitHub Action fixture run fails the check on a regression vs. baseline and passes otherwise.
- [ ] MCP server answers `get_agent_scorecard` and `compare_agents` tool calls in an integration test.

## P13 — Flywheel
- [ ] Distiller run on a fixture failure trace produces a schema-valid `scenario_candidate` with total LLM cost under the configured cap (asserted).
- [ ] Candidates require admin approval before entering the scenario bank (no auto-publish path).
- [ ] Seed randomizer: same seed → identical entities; different seed → different entities.
- [ ] Bounty submission with a non-deterministic oracle is rejected by validation.

## P14 — Procurement Pack
- [ ] Pack generation over a frozen trial set is byte-deterministic (stable hash across two runs).
- [ ] Pack includes: scorecard, adversarial coverage matrix, per-trial Merkle roots + verify instructions, rubric/model versions, disclaimer text (string-asserted).
- [ ] Unauthorized user cannot fetch a pack; access logged.

## P15 — Spectacle
- [ ] Embed route returns configured `frame-ancestors` CSP; replay renders inside a test iframe.
- [ ] Compare page renders from a snapshot fixture and is cached (`use cache`) with revalidation wired to snapshot updates.
- [ ] Clip job: capped duration/cost, skips gracefully (no crash, logged) when the trial has no video; ffmpeg absent from the Next.js bundle (bundle-analysis assertion).

## Launch gate (before public announce)
- [ ] ≥20 scenarios (each with ≥1 held-out variant) across ≥5 agents, all sealed and third-party verifiable.
- [ ] `pg verify` succeeds from a clean machine with only the public API.
- [ ] Methodology page complete: firewall, appeal, keys, rubric versions, Pass^k definition.
- [ ] One end-to-end demo path: failed trial → distilled scenario → re-test → badge state change.
