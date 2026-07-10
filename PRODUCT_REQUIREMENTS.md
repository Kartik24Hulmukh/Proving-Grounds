# Product Requirements

## User/job
Maintainers reviewing human- or AI-authored Node/TypeScript PRs need independent executable evidence for what changed and what stayed invariant.

## Inputs
Repository, base/head revisions, explicit claims file, setup/probe commands, execution policy.

## Outputs
Terminal matrix, schema-valid capsule, exact SHAs/tool versions/hashes, normalized base/head outcomes, mutation results, replay command, static HTML report.

## Claim types
- `intended_delta`: base should fail, head should pass.
- `invariant`: base and head should pass.

## Verdicts
`demonstrated`, `regression`, `vacuous`, `inconclusive`.

## Non-goals v0.1
Formal verification, automatic merge, every language, SaaS, autonomous claim acceptance, production traffic capture, enterprise SSO.
