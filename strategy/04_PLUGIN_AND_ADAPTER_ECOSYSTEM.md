# Plugin and Adapter Ecosystem

Define stable interfaces for:
- language adapter (changed-file parsing, build command);
- test runner/probe adapter;
- mutation operator pack;
- behavioral oracle;
- execution backend;
- agent integration (claims/capsule handoff);
- report renderer;
- attestation signer/verifier.

Every plugin declares ID/version/license/capabilities, deterministic inputs, supported languages, security requirements and compatibility range. Plugins run behind explicit boundaries; no arbitrary auto-install. Publish conformance fixtures so third parties can implement adapters independently.
