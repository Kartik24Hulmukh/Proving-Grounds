# Build Report

Status: complete

Scope completed:
- Replaced the scaffold with a real evidence compiler CLI.
- Added git worktree-backed verification, replay, validation, policy, plugin, agent, and mutation commands.
- Added three real fixture histories: auth, off-by-one, and vacuous.
- Added a fixture-backed policy profile and external-style plugin adapter manifest.
- Added an agent bundle path that emits claims and attaches capsule provenance.
- Added stable capsule hashing, HTML reporting, and replay verification.
- Added the package dependency needed for YAML-backed claims, policy, and plugin documents.

Verification evidence:
- `npm run typecheck` passed.
- `npm test` passed with 20 tests.
- `npm run pack:check` passed.
- `npm run verify:kit` passed.
- `npm run demo` is covered by the test suite and produces a stable five-run auth demo.

Loop notes:
- The replay hash initially drifted because runtime-only fields were part of the digest.
- The capsule digest now covers the stable semantic payload only: repository identity, claim statements, probes, verdicts, summary, mutation summary, and policy payload.
- Runtime-only fields such as artifact paths, generated-by metadata, timestamps, and replay paths remain in the capsule for auditability but are excluded from the integrity hash so replay stays stable.

Security posture:
- Probe execution uses subprocesses with explicit argv and timeouts.
- Git history is resolved through `git rev-parse` and worktrees; no shell interpolation is used for probe commands.
- Common secret patterns are redacted from captured probe output.
- The HTML report is self-contained and escapes claim and artifact content.
- Local workspace artifacts are ignored in `.gitignore`: `.evidence/`, `graphify-out/`, `.agents/`, `.codex/`, and `demo-capsule.json`.

Known limitation:
- Mutation screening is AST-based and compile-screen capable, and surviving mutants are treated as evidence gaps rather than proof of a defect.

Release artifacts:
- `src/cli.ts`
- `src/engine.ts`
- `src/capsule.ts`
- `src/mutation.ts`
- `src/report.ts`
- `src/agent.ts`
- `fixtures/auth`
- `fixtures/off-by-one`
- `fixtures/vacuous`
- `fixtures/policy`
- `fixtures/adapters/echo-runner`

Final verdict:
- The kit is now a working evidence compiler with replayable, stable capsules and fixture-backed verification.
