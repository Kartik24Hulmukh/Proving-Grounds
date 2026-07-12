# 03 — GTM & Traction Engine

The 100x is 60% distribution, 40% product. This is the engine.

## Positioning statement (use everywhere)

> The independent crash-test lab for AI agents. We run agents through the nastiest real-world
> tasks, seal the footage as tamper-proof evidence, and publish verdicts anyone can re-run.
> No vendor pays for a result. Ever.

## The three compounding distribution loops

### Loop 1 — The Badge (vendor-driven inbound)
Vendor claims listing → passes trials → embeds signed **PG Certified** badge on their site →
their visitors click through to your evidence page → some are buyers who now trust PG → they ask
*other* vendors for a PG score → those vendors come to get tested → more badges. Each badge is a
permanent backlink and a trust signal that recruits the next vendor. **This is the primary loop.**

### Loop 2 — PG-in-CI (developer-driven)
Agent devs add the GitHub Action / MCP server to catch regressions → PG becomes part of their
daily loop → they cite PG scores in their own docs/READMEs → their users discover PG → new devs
adopt the action. Land inside the workflow, expand to the leaderboard.

### Loop 3 — The Spectacle (audience-driven)
Crash Test Tuesday clips + head-to-head pages + embeddable replays → shares & embeds → SEO +
social reach → vendors see the attention and want in (feeds Loop 1) → buyers see the rigor and
trust the verdict (feeds Loop 1). Content is the top of the funnel that powers the other two.

## Revenue lines (in order of who pays first)

1. **Certification runs** — vendors pay to be tested + re-tested (never for the result). Tiers by
   scenario breadth + re-test cadence. First dollars.
2. **Procurement Packs** — buyers pay per agent-report (the U6 dossier). Highest willingness to pay.
3. **PG-in-CI subscriptions** — dev teams pay for private scenarios + higher rate limits + trend history.
4. **Private/custom scenarios** — a vendor's real workflow turned into a private test suite they own.
5. **Data/API access** — analysts, VCs, insurers licensing the scores + evidence feed.

Guardrail: lines 1 and 5 must be visibly firewalled from *what the verdict says* to protect
independence — publish the firewall on /methodology. Independence IS the product.

## Beachhead sequence

1. **Wedge:** browser/computer-use agents on hostile commerce + support tasks (refund traps,
   injected pages, non-English checkout, anti-bot walls). ~10 named subjects, public leaderboard.
2. **Expand:** coding agents (OpenHands-class) on adversarial repos (flaky tests, poisoned deps).
3. **Expand:** the buyer side — Procurement Packs as EU AI Act / SOC-adjacent demand grows.
4. **Platform:** open the scenario bounty + MCP + API; become infrastructure others build on.

## 90-day launch plan

**Days 1–30 — Credibility**
- Ship P9 (sealed evidence + `pg verify`) and 20-scenario public bank across 5 real agents.
- Publish methodology + independence firewall + signing key. Every trial page shows the verify line.
- Soft launch: 3 deep head-to-head writeups with embedded replays.

**Days 31–60 — The loop turns**
- Ship P11 (badge + vendor portal). Personally onboard first 5 vendors to claim + certify.
- Ship P12 (GitHub Action + MCP). Launch on HN/Show + agent-dev communities with a live "we broke
  agent X on scenario Y — verify it yourself" post. The re-runnable evidence is the hook.
- Start Crash Test Tuesday.

**Days 61–90 — Monetize + compound**
- Ship P14 (Procurement Pack); close first 3 buyer reports and first 5 paid certifications.
- Open scenario bounties (P13); seed with your own distilled failures. Target bank > 50.
- Ship 5 head-to-head SEO pages; measure badge-driven referral traffic (your north-star loop metric).

## Metrics that matter (north stars per loop)

- **Trust:** # third-party `pg verify` runs; # badges live on vendor domains.
- **Data:** scenario bank size; % community-contributed; agents' Pass^k trend over time.
- **Growth:** badge referral clicks → claimed listings; CI action installs; MCP queries.
- **Revenue:** paid certifications, Procurement Packs sold, CI subscriptions.
- **Reach:** replay views, head-to-head page organic traffic, Crash Test Tuesday followers.

## Objection handling (bake into the site)

- *"How do we know you're independent?"* → published firewall + no-pay-for-result policy + open verify.
- *"Benchmarks are gameable."* → held-out variants, rotating seeds, isolated checker, canary tokens,
  Pass^k — and *you can re-run any trial yourself*. That last clause is the whole pitch.
- *"Our agent scored badly on an old version."* → badges expire; re-test; show the fix→re-test→pass arc (M4).
