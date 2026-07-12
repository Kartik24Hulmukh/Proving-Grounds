# Mandatory Codex Instructions

## Mission
Turn this kit into a fully functional, end-to-end OSS v0.1. Work continuously through tests; do not stop at scaffolding, mocks, TODOs, or a happy-path demo.

## Source-of-truth order
1. `ACCEPTANCE_GATES.md`
2. `PRODUCT_REQUIREMENTS.md`
3. `ARCHITECTURE.md`
4. `spec/*.schema.json`
5. `THREE_DAY_ROADMAP.md`

## Required loop
Inspect → add failing test → implement → targeted test → full suite → adversarial test → inspect artifacts → document → repeat.

## Hard rules
- Say bounded executable evidence, never guaranteed correctness.
- Models may suggest claims/probes but never decide verdicts.
- Default local, no telemetry.
- Never run untrusted PR code with secrets or unrestricted network.
- Unknown/setup failure/timeout becomes `inconclusive`, never pass.
- No release-critical TODO/FIXME at completion.

## Final output
Create `BUILD_REPORT.md` listing implemented features, commands/results, known limitations, threat posture, package contents, and release readiness.

## Mandatory 100x strategy reading
Before architecture changes, read every file in `strategy/`. Do not merge the supplied Proving Grounds lab architecture into this project; apply only transfers approved in `strategy/02_PROVING_GROUNDS_RESEARCH_ASSESSMENT.md`. Treat the capsule protocol, maintainer policy, plugin boundaries, benchmark, and traction loops as first-class product requirements.
