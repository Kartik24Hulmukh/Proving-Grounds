# 01 — Product Upgrades (the 100x feature set)

Ordered by leverage. Each maps to a build phase in `04-BUILD-LOOP-V2-PROMPTS.md`.

## U1 — Sealed Evidence + Attestation (Phase P9) — THE trust product

Current state: evidence is captured, hashed per-artifact, stored in private Blob. Upgrade:

- **Evidence bundle manifest**: one canonical JSON per trial listing every artifact, its sha256,
  byte size, capture timestamp, plus pinned versions (scenario@vN, adapter@vN, judge model,
  rubric@vN, runner git sha). Merkle root over the manifest = the trial's identity.
- **Signing**: sign the Merkle root at capture time (Ed25519 key held by the runner; publish the
  public key on /methodology). Rotate keys, keep a key log.
- **Transparency log**: append-only public log of (trial_id, merkle_root, signature, timestamp) —
  a simple hash-chained table + public JSON feed is enough for v1; sigstore/Rekor later.
- **`pg` CLI** (npm package, MIT): `pg verify <trial-id>` downloads the manifest + signed root,
  recomputes hashes, checks the chain. `pg rerun <trial-id>` re-executes the trial from pinned
  versions (requires vendor adapter access or the public reference adapters).
- **Tamper page**: every replay page shows "✓ Evidence sealed — verify it yourself" with the
  Merkle root and a copyable verify command. This line is your brand.

## U2 — Scorecard v2: Pass^k + multi-axis metrics (Phase P10)

- Run every scored trial **k times** (k=5 default, configurable per scenario tier). Store all runs.
- Compute per agent-version: Pass^1, Pass^5, Injection Defense Score, Refusal Correctness,
  Cost-per-Success, Consistency Index, median wall-time.
- Leaderboard ranks by a published composite; every axis is sortable. Show confidence intervals.
- **Anti-reward-hacking oracle upgrades**: verification runs in a separate container from the
  agent (agent can't touch the checker); checksum the fixture pages before/after; detect binary/
  wrapper tampering; canary tokens embedded in scenarios detect answer leakage into training data.

## U3 — PG Certified badge + vendor portal (Phase P11) — THE growth loop

- Auth-gated vendor portal: claim your product, see private full results, request re-tests,
  buy certification runs.
- **Embeddable signed badge** (SVG served from your domain): shows tier (Certified / Verified /
  Listed), links to the live evidence page, cryptographically bound to a trial set + expiry date.
  Stale or failed re-tests auto-downgrade the badge. Every badge on a vendor site = a permanent
  inbound link + distribution.
- Certification = paying for the *trial run and re-runs*, never the outcome. Failed certifications
  are private by default (vendor's choice to publish); *claimed* public listings always show real
  results. Publish this policy.

## U4 — PG in CI (Phase P12) — developer-led growth wedge

- **GitHub Action + API**: vendors run a public subset of scenarios against their agent on every
  PR ("did this change break refund-trap defense?"). Free tier: 3 scenarios, rate-limited.
  Paid: full public bank + private scenarios.
- This makes PG part of the agent developer's daily loop — the Braintrust wedge, but independent.
- **MCP server**: expose read-only PG results (scores, verdicts, evidence links, scenario descrip-
  tions) as an MCP server so any agent/IDE can query "how does browser-use score on injection
  defense?" — free distribution inside the tools your audience already uses.

## U5 — Nastiness flywheel + scenario bounties (Phase P13)

- **Failure → scenario distiller**: after each failed trial, a bounded AI-SDK pipeline drafts a
  generalized scenario (spec + oracle + fixture) from the failure trace; human-approved into the
  bank. Every trial makes the lab nastier.
- **Bounty program**: public form + rubric — submit a scenario that breaks ≥2 listed agents and
  passes review → credit on the scenario page + payout. Community grows your moat.
- **Held-out variants**: every public scenario has ≥1 hidden sibling (same skill, different
  surface) used for scoring; public one is for practice. Rotating seeds randomize entities
  (order numbers, names, amounts) per run.

## U6 — Procurement Pack (Phase P14) — enterprise revenue

- One-click export per agent-version: PDF + JSON bundle mapping trial evidence to what 2026
  buyers must collect — independent adversarial test report (prompt injection, delegation abuse,
  exfiltration attempts), EU AI Act Art. 11-style technical documentation of the evaluation,
  Art. 12-style traceability (who/what/when/model/policy per step), methodology + rubric versions.
- Not legal advice — an *evidence dossier* their compliance team attaches. Sold to buyers
  (per-report) and vendors (attach to sales motions).

## U7 — Spectacle layer (Phase P15) — top-of-funnel

- **Auto-highlight clips**: post-trial pipeline cuts the video at verdict-relevant moments (trap
  encountered, defense held/failed, final answer) into a 30–60s vertical clip with caption
  overlay — one-click share, watermarked with the trial URL.
- **Embeddable replay widget** (iframe) so journalists/bloggers embed real trials.
- **Crash Test Tuesday**: weekly public trial of a well-known agent on a new scenario, results
  thread + clip. Predictable, followable, screenshot-able.
- **Head-to-head pages**: /compare/browser-use-vs-stagehand — SEO magnets that answer the exact
  question buyers google.

## Judging upgrades (cross-cutting, fold into P10)

- Keep: rule-oracle precedence, temperature 0, pinned model + rubric_version (already built).
- Add: **judge ensemble option** for contested trials (3 pinned models, majority vote, all three
  rationales stored); **vendor appeal flow** (dispute → human review → published resolution note —
  authorities have appeal processes); **judge self-test suite** — golden trials with known verdicts
  run on every judge/rubric change; a regression blocks deploy.
