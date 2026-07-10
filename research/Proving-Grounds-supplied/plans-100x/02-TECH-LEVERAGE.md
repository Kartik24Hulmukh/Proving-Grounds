# 02 — Tech Leverage (v2)

Current stack (keep — it's correct and current): Next.js 16 App Router, TypeScript, Tailwind v4,
Neon + Drizzle + Better Auth, Vercel Blob (private), Upstash Redis, AI SDK 7, Playwright,
Vitest, OTel + Sentry, gitleaks/semgrep/CodeQL in CI.

## New adoptions (what's changed in the stack, and why)

| Tech | Use for | Notes |
|------|---------|-------|
| **Vercel Workflow SDK (durable workflows)** | Trial orchestration: enqueue → sandbox → k runs → judge → seal → snapshot | Replaces hand-rolled Redis polling loop for the multi-step pipeline; survives restarts, retries steps, pauses for human review. Keep Redis for rate-limit/budget only. |
| **Vercel Sandbox** | Per-trial isolation | You're already designed for it; standardize on it as the default `sandbox_kind`, keep container+gVisor as the self-hosted fallback. Emit `sandbox.*` OTel attrs (already wired). |
| **AI SDK 7 `generateObject` + Gateway** | Judge (existing) + failure→scenario distiller + clip captioner | Pin exact model IDs in DB per rubric_version. Cheap model (e.g. small Gemini/GPT class) for pre-checks and distillation drafts; frontier only for contested judging. |
| **MCP (Model Context Protocol) server** | Read-only PG results for IDEs/agents | Small Next.js route-handler MCP server; free distribution channel. |
| **Ed25519 signing (`@noble/ed25519`)** | Evidence attestation | MIT, audited, zero-dep. Hash-chained transparency table in Neon + public JSON feed. Sigstore/Rekor integration later, not v1. |
| **GitHub Action (`proving-grounds/action`)** | PG-in-CI wedge | Thin wrapper around your public API; publish to the Actions marketplace. |
| **ffmpeg (server-side, worker only)** | Auto-highlight clips | Runs in the worker/sandbox, never in the Next.js bundle. |

## Repo leverage map v2 (delta from v1 manifest — v1 verdicts stand)

### Study for anti-gaming (the new critical category)
| Source | What to mine |
|--------|--------------|
| Terminal-Bench / Harbor harness | Task container structure, checker isolation patterns — and the published exploits against it (reward hacking, trojanized wrappers, dependency interception) as a *checklist of attacks your oracle must survive* |
| Berkeley RDI benchmark-breaking work | Your threat model, literally. Convert each exploit class into a P10 gate |
| mswjs/msw | Network-level fixture control inside the arena (deterministic API responses for scenarios) |
| gitleaks patterns | Canary-token design for leakage detection in scenarios |

### Adopt (new)
| Repo | License | Role |
|------|---------|------|
| @noble/ed25519 | MIT | Attestation signing |
| grafana/k6 (CI-only) | AGPL — **CI/external only, never bundled** | Load-test the trial pipeline (P8.4 gate, keep) |
| artilleryio/artillery | MPL | Alternative load tool if you want it in-repo |
| comet-ml/opik or Helicone | Apache-2.0 | Judge-call logging + cost tracking (v1 verdict stands; wire it in P10) |

### Drive (subjects to add to the inventory — grows the leaderboard's pull)
browser-use, stagehand (already reference adapters) → add: OpenHands (coding), Skyvern (via
network boundary only — AGPL), plus 3–5 commercial agents via their public APIs where ToS allows.
Every new subject = new leaderboard rows = new SEO pages = new reasons for vendors to claim listings.

### Avoid (unchanged + additions)
- All v1 AVOID entries stand (AGPL/GPL bundling, multi-agent frameworks as runner).
- **Don't adopt a blockchain** for the transparency log. A hash chain in Postgres + public feed +
  published signing key gives 95% of the trust at 1% of the complexity. Revisit only if a customer demands it.
- Don't build your own video player/trace viewer — Playwright trace viewer + `<video>` is fine.

## Architecture deltas (small, surgical)

1. `lib/attestation/` — manifest builder, Merkle root, signer, chain writer, verifier (shared with CLI).
2. `packages/pg-cli/` — publishable npm workspace package; imports the verifier; MIT.
3. `lib/flywheel/` — failure→scenario distiller (AI SDK, bounded, human-approval queue in admin).
4. `lib/metrics/` — Pass^k + composite computation; snapshot job recomputes on every sealed verdict.
5. Workflow: `workflows/trial.ts` — the durable end-to-end trial pipeline (replaces worker polling loop for orchestration; the worker keeps doing sandbox execution).
6. New tables: `evidence_manifest`, `attestation_chain`, `trial_run` (k-runs grouping), `scenario_variant` (held-out siblings), `bounty_submission`, `certification` (tier, expiry, badge key), `appeal`.

## Non-negotiables carried forward
Parameterized scoped queries; no untrusted code outside isolation; egress allowlist; per-trial
cost caps; THIRD_PARTY_NOTICES.md kept current; secrets never in repo.
