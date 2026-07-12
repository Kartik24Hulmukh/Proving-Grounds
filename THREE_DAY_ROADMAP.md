# Three-Day Roadmap

## Day 1 — deterministic core
- JSON/YAML claims parser and validation.
- Revision validation; disposable base/head git worktrees with cleanup.
- Frozen-lockfile project setup and timeout-bound probes.
- Four-state truth table and JSON capsule.
- Real fixture histories: authorization regression and vacuous test.
- Gate: one CLI command correctly classifies all four outcomes without an LLM.

## Day 2 — adversarial evidence
- AST mutation of changed TypeScript only.
- Operators: boolean flip, comparison inversion, branch removal, boundary literal, status swap, await removal, return substitution.
- Compile-screen mutants; score valid killed/survived/timeout separately.
- Strict mutation budget; static HTML evidence matrix.
- Optional disabled-by-default model suggestion adapter; human acceptance required.
- Gate: weak evidence lets authorization-removal mutant survive; strong invariant kills it.

## Day 3 — product/release
- `npx` packaging, capsule replay/validation, GitHub Action.
- Three fixture PRs: auth regression, off-by-one, vacuous test.
- Security/privacy/limitations docs, demo, clean-install test, dependency/license audit.
- Static report accessibility and no external assets.
- Produce `BUILD_REPORT.md` and release candidate.
- Gate: every item in `ACCEPTANCE_GATES.md` passes from a clean archive.
