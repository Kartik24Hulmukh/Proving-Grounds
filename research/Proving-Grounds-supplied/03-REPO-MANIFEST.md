# 03 — Repo Manifest (leverage map)

Legend:
- **ADOPT** = link/import as a dependency.
- **DRIVE** = the agent product you test (inventory, not a dependency).
- **STUDY** = mine for patterns/fixtures; do NOT bundle (license/ToS/liability).
- **EXTERNAL** = run as a separate service only (copyleft — never bundle in your app).
- **AVOID** = off-thesis or license-incompatible for a distributed product.

## 1. Arena — sandbox + harness
| Repo | License | Role | Verdict |
|------|---------|------|---------|
| microsoft/playwright | Apache-2.0 | Browser driver + trace/video evidence | ADOPT |
| daijro/camoufox | MPL-2.0 | Serve adversarial/anti-fingerprint fixture pages | ADOPT |
| testcontainers/testcontainers-node | MIT | Per-trial disposable isolation | ADOPT |
| (Firecracker / gVisor / Vercel Sandbox) | Apache-2.0 | microVM isolation for untrusted execution | ADOPT |

## 2. Subjects — agents-under-test (DRIVE, not deps)
| Repo | License | Note |
|------|---------|------|
| browser-use/browser-use | MIT | Reference adapter #1 |
| browserbase/stagehand | MIT | Reference adapter #2 |
| Skyvern-AI/skyvern | AGPL | Test via network/CLI boundary — never import |
| All-Hands-AI/OpenHands | MIT | Coding-agent subject |
| eigent-ai/eigent, paperclipai/paperclip | mixed | Additional subjects; grow inventory |

## 3. Scenarios / adversarial payloads (STUDY + BUILD)
| Repo | License | Role | Verdict |
|------|---------|------|---------|
| mukul975/Anthropic-Cybersecurity-Skills | Apache-2.0 | Defensive task patterns | STUDY |
| anthropics/knowledge-work-plugins | mixed | Realistic knowledge-work tasks | STUDY |
| Unclecheng-li/VulnClaw | — | Trap ideas only; do not bundle | STUDY |
| (Agent Security Sandbox / AgentTrap concepts) | — | Model IPI + runtime-trust task suite | BUILD |

## 4. Evidence capture
| Repo | License | Role | Verdict |
|------|---------|------|---------|
| replayio/replay-cli | — | Deterministic record/replay | ADOPT (optional) |
| alwaysmeticulous/meticulous-sdk | ISC | Visual/behavior diffing | ADOPT (optional) |
| percy/cli or chromaui/chromatic-cli | MIT | Visual diff proof | ADOPT (optional) |
| Playwright trace + video | Apache-2.0 | Baseline every trial emits | ADOPT |

## 5. Judge + eval
| Repo | License | Role | Verdict |
|------|---------|------|---------|
| comet-ml/opik | Apache-2.0 | Eval logging + scoring | ADOPT |
| Helicone/helicone | Apache-2.0 | LLM logging + cost tracking | ADOPT |
| ianarawjo/ChainForge | MIT | Reproducible eval methodology reference | STUDY |
| Vercel AI SDK | Apache-2.0 | LLM-as-judge (generateObject) | ADOPT |

## 6. Harden + observe yourself
| Repo | License | Role | Verdict |
|------|---------|------|---------|
| gitleaks, semgrep, github/codeql, zaproxy | mixed OSS | L1 security scans — CI only | ADOPT (CI-only) |
| open-telemetry/opentelemetry-js | Apache-2.0 | GenAI + sandbox trace conventions | ADOPT |
| getsentry/sentry-javascript | MIT | Error monitoring | ADOPT |
| grafana/grafana | AGPL | Dashboards — external service only | EXTERNAL |

## AVOID (copyleft or off-thesis for a shipped product)
- chunkr, PilotDeck, karakeep, bigset, vibe_figma, GLOSSOPETRAE — AGPL.
- paperless-ngx, 3x-ui — GPL.
- camel / owl / agent-squad multi-agent frameworks — overkill for a single-director lab.

## License policy (non-negotiable)
- Nothing AGPL/GPL is bundled into the distributed Next.js app; use as EXTERNAL service or not at all.
- Offensive/vuln tooling is never distributed; used only in isolated CI or as fixture inspiration.
- Record each dependency's license in a generated `THIRD_PARTY_NOTICES.md`.
