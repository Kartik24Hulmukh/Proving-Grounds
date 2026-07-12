# 04 — Build Loop v2 Prompts (P9–P15)

Same operating loop as v1: one phase at a time, self-verify against `05-ACCEPTANCE-GATES-V2.md`,
write `lib/<area>/verify.ts`, all tests green before advancing. Same rules: parameterized queries,
budget caps, no AGPL/GPL bundling, THIRD_PARTY_NOTICES.md updated on every dependency add.

---

## P9 — Sealed Evidence & Attestation (build first — trust moat)

> Build the attestation layer in `src/lib/attestation/`. (1) Manifest builder: canonical JSON per
> trial listing every artifact {path, sha256, bytes, capturedAt} plus pinned versions {scenarioId@v,
> adapterKey@v, judgeModel, rubricVersion, runnerGitSha}; compute a Merkle root over sorted artifact
> hashes. (2) Signer: Ed25519 via @noble/ed25519; private key from env (rotatable, key-id in
> manifest); publish public keys at /api/attestation/keys and on /methodology. (3) Transparency
> chain: new `attestation_chain` table — append-only rows {seq, trialId, merkleRoot, signature,
> prevHash, createdAt}, where prevHash = sha256 of previous row; public read-only JSON feed at
> /api/attestation/log with pagination. (4) Wire into the trial pipeline: seal every completed
> trial after judging; store `evidence_manifest` row. (5) Verifier module (pure, no server deps)
> that takes a manifest + chain entry + public key and returns pass/fail with reasons. (6) Show
> "Evidence sealed ✓" with Merkle root + copyable verify command on every trial replay page.
> Write `lib/attestation/verify.ts` self-checks + unit tests: tampered artifact detected, tampered
> chain detected, wrong key rejected, valid bundle passes.

## P9.5 — `pg` CLI (npm package)

> Create `packages/pg-cli` (pnpm workspace, MIT license, no server-only imports). Commands:
> `pg verify <trialId>` — fetches manifest + chain entry + keys from the public API, downloads
> artifacts via signed URLs, recomputes hashes, validates signature + chain linkage, prints a
> verdict table. `pg rerun <trialId> --adapter <key>` — fetches pinned scenario/rubric versions
> and executes locally against a reference adapter, printing verdict comparison. Publishable via
> `npm publish` (dry-run in CI). Shares the verifier module from P9. Integration test: seal a
> fixture trial in a temp DB, verify it via the CLI against a local server, then flip one byte in
> an artifact and confirm the CLI fails it.

## P10 — Scorecard v2: Pass^k + anti-gaming oracles

> (1) Add `trial_run` grouping: a scored evaluation = k runs (default 5) of the same
> scenario+agent-version with rotated seeds; store every run. (2) `src/lib/metrics/`: compute
> Pass^1, Pass^k, Injection Defense Score (% trap scenarios defended), Refusal Correctness,
> Cost-per-Success (sum cost / successes), Consistency Index (verdict variance), median wall-time;
> composite score with published weights; recompute leaderboard snapshot on every sealed verdict.
> (3) Anti-gaming: run the oracle/checker in a separate process/container from the agent sandbox;
> checksum scenario fixtures before/after each run and fail the trial on mutation; add per-scenario
> canary tokens (unique strings that must never appear in agent output — appearance = leakage flag);
> add `scenario_variant` table for held-out siblings, score only on variants. (4) Judge upgrades:
> golden-trial self-test suite (fixture trials with known verdicts) that runs on any judge/rubric
> change and blocks on regression; optional 3-model ensemble path for contested trials storing all
> rationales; `appeal` table + admin flow with published resolution notes. (5) Update leaderboard
> UI: multi-axis sortable columns, confidence intervals, k shown per score. Tests: Pass^k math
> property tests, fixture-mutation trips the trial, canary detection fires, golden suite blocks a
> deliberately broken rubric.

## P11 — Certification & Vendor Portal (growth loop)

> (1) `certification` table {productId, tier: certified|verified|listed, trialSetId, issuedAt,
> expiresAt, badgeKeyId, status}. (2) Vendor portal at /vendor (Better Auth, role=vendor, scoped to
> claimed products): claim flow with domain verification (DNS TXT or meta tag), private full
> results, request re-test, certification purchase stub (Stripe-ready interface, mock provider for
> now). (3) Signed badge: SVG served at /api/badge/{productSlug}.svg — renders tier + score,
> HMAC-signed URL params, auto-renders "expired" state past expiresAt, links to the public evidence
> page; embed snippet shown in portal. (4) Policy enforcement in code: certification price/paid
> status must be unreadable from any judging or scoring path (assert via a dependency-boundary
> test). (5) Public /methodology additions: independence firewall, no-pay-for-result policy,
> signing keys, appeal process. Tests: badge for expired cert renders expired; unclaimed product
> portal access denied; scoring modules import-graph contains no certification/billing module.

## P12 — PG-in-CI + MCP server (developer wedge)

> (1) Public REST API v1 under /api/v1: list scenarios (public subset), trigger evaluation run
> (API-key auth, rate-limited via existing Upstash limiter, budget-capped), poll status, fetch
> verdict + manifest. API keys per vendor account, hashed at rest. (2) `packages/pg-action`:
> GitHub Action (node20) wrapping the API — inputs: apiKey, adapter endpoint, scenario tags;
> outputs: pass/fail + report URL; fails the check on regression vs. the branch baseline. (3) MCP
> server at /api/mcp exposing read-only tools: `get_agent_scorecard`, `list_scenarios`,
> `get_trial_evidence`, `compare_agents` — no auth for public data, key for private. (4) Docs page
> /developers with copy-paste setup for both. Tests: API contract tests, rate-limit fail-closed on
> the new endpoints, MCP tool-call integration test.

## P13 — Nastiness Flywheel + Bounties

> (1) `src/lib/flywheel/`: on each failed sealed trial, a bounded AI SDK pipeline (cheap pinned
> model, temperature 0, max 1 call, cost-capped) drafts a generalized scenario candidate {spec,
> oracle rules, fixture diff} from the failure trace; writes to a `scenario_candidate` review queue.
> (2) Admin review UI: approve → creates scenario + auto-generates a held-out variant skeleton;
> reject with reason (reasons feed prompt improvement). (3) Bounty program: public /bounties page +
> submission form (rate-limited, size-capped), `bounty_submission` table, admin triage queue,
> published rubric (must break ≥2 listed agents, deterministic oracle, no PII); accepted scenarios
> credit the contributor on the scenario page. (4) Seed rotation: entity randomizer (names, order
> ids, amounts) applied per run from the seed. Tests: distiller respects cost cap and produces
> schema-valid candidates from a fixture trace; randomizer is deterministic per seed; bounty
> submission validation rejects malformed oracles.

## P14 — Procurement Pack

> Build /api/products/{slug}/procurement-pack (vendor- or buyer-purchased, auth-gated): generates a
> JSON + printable HTML dossier for an agent-version containing: scorecard v2 with k and CIs,
> adversarial coverage matrix (injection / delegation-abuse / exfiltration / refusal scenarios ×
> results), full traceability appendix (per-trial: models, versions, timestamps, evidence Merkle
> roots + verify instructions), methodology + rubric version, signing key fingerprints, and an
> explicit "evaluation evidence, not a compliance certification" disclaimer. Map sections to EU AI
> Act Art. 11/12 documentation categories as labeled references. Store generated packs in private
> Blob with hash recorded. Tests: pack generation is deterministic for a frozen trial set (stable
> hash), access control enforced, disclaimer present.

## P15 — Spectacle Layer

> (1) Worker-side clip pipeline: after sealing, use ffmpeg (worker only, never bundled in Next)
> to cut a 30–60s highlight from the trial video using step-log timestamps (trap encountered,
> defense held/failed, final verdict), burn in caption overlays + trial URL watermark; store in
> Blob; show on trial page with share buttons. (2) Embeddable replay widget: /embed/trials/{id}
> iframe-safe route (CSP frame-ancestors configurable), minimal player + verdict + verify line.
> (3) /compare/{slugA}-vs-{slugB} SEO pages: head-to-head scorecards, common-scenario diff table,
> generated metadata; statically cached with `use cache`, revalidated on new snapshots. (4)
> "Crash Test Tuesday" admin tool: pick agent + scenario, run, one-click publish page + clip.
> Tests: embed route sends correct frame headers, compare page renders from snapshot fixture,
> clip job is budget/time-capped and skips gracefully when video is missing.
