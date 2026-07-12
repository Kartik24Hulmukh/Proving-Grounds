# Current Validation — 11 July 2026

## Decision: GO, with a strict category boundary
The problem is more urgent, but the adjacent market is denser. AI reviewers (CodeRabbit/Qodo/Copilot), autonomous test agents (TestSprite), live PR testing (Stably), Meta JiT catching tests, and mutation tools already cover pieces. The defensible product is **not another reviewer or test generator**.

## Category
**Proof-carrying software changes**: a neutral protocol and independent verifier where a change carries bounded, adversarially challenged, replayable evidence for explicit behavioral claims.

## Evidence supporting demand
- GitHub now publishes guidance for reviewing agent PRs; maintainers report review overload.
- Meta JiT testing shows change-aware catching tests improve bug discovery.
- Signadot/Codacy describe validation—not more prose review—as the emerging bottleneck solution.
- OpenSSF is developing guidance for AI-slop contributions.
- Mutation analysis is increasingly used to evaluate AI-generated tests.

## Closest threats
- TestSprite: intent-aware autonomous sandbox testing.
- Meta JiT/ACH: change-aware and mutation-guided testing.
- CodeRabbit/Qodo/Copilot: distribution in PR review.
- Stably: PR preview execution.
- SLSA/in-toto: generic attestations and provenance.

## Unique integrated contract
Explicit claims + base/head truth table + vacuity detection + focused counterfactual mutants + explicit evidence boundary + replayable signed capsule + neutral agent/CI adapters.

## Kill conditions
Stop or reposition if an active open project ships the same integrated contract, if users see only “mutation testing with a report,” or if ten real maintainers do not value vacuity detection/evidence boundaries after demos.
