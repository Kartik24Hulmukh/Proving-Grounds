# Open Evidence Capsule Protocol v0.1

## Goal
A portable, content-addressed record of bounded behavioral verification tied to exact source revisions.

## Required sections
- subject: repository digest, base/head SHAs, diff digest;
- claims: explicit statements, type, author/origin, acceptance status;
- environment: runner, OS/container, lockfile/dependency and tool digests;
- probes: source/command, normalized inputs, timeouts;
- outcomes: base/head raw and normalized results;
- counterfactuals: operator, patch digest, validity, killed/survived/error;
- evidence boundary: exercised/untested branches and declared risks;
- artifacts: path/media type/bytes/sha256;
- replay: command and required assets;
- integrity: canonical manifest digest and optional in-toto/DSSE signature.

## Compatibility
Use an in-toto Statement-compatible envelope/predicate where practical instead of inventing a competing attestation envelope. The custom value is the behavioral-evidence predicate.

## Rules
Signatures prove integrity/issuer, not correctness. Missing required evidence fails closed. A verifier must work without the originating model or SaaS.
