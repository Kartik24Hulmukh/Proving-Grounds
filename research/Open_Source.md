I read all three proposals end to end and checked their central claims against current projects, research, products, GitHub repositories, and the market as of **10 July 2026**.

# Final verdict

## **Build Idea 1’s underlying concept: the proof-carrying pull request**

But:

- **Do not use the name “MergeProof.”** It is already occupied by at least two adjacent software-review products/protocols: [mergeproof.org](http://mergeproof.org) and [mergeproof.com](http://mergeproof.com).
- Reduce the 3-day scope substantially.
- Describe the output as **bounded executable evidence**, not a mathematical proof.
- Do not build Ideas 2 or 3 in their proposed forms.

### Ranking

1. **Idea 1 — MergeProof concept:** strongest overall
2. **Idea 2 — Cordon:** important problem, but the claimed novelty and technical guarantees are overstated
3. **Idea 3 — AIRLOCK:** valuable category, but already extremely crowded and the name is heavily occupied

---

# Comparison

| Idea | Real pain | Novelty today | OSS traction | Commercial value | Credible 3-day MVP | Defensibility | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| **1. Proof-carrying PR** | 10/10 | 8/10 | 9/10 | 9/10 | 7/10 | 7/10 | **Build** |
| **2. Cordon provenance firewall** | 10/10 | 5/10 | 8/10 | 9/10 | 4/10 | 6/10 | Don’t build as proposed |
| **3. AIRLOCK runtime firewall** | 9/10 | 3/10 | 6/10 | 8/10 | 6/10 | 3/10 | Red ocean |

## OpenClaw-like traction potential

| Idea | Probability of breaking out |
| --- | --- |
| --- | ---: |
| **Proof-carrying PR** | **Highest of the three** |
| Cordon | Medium, if technically repositioned |
| AIRLOCK | Low without an exceptional distribution advantage |

No honest analysis can promise OpenClaw-level traction. OpenClaw’s success involved timing, broad personal utility, personality, accessibility, and strong network effects—not only superior technology. But Idea 1 has the best combination of a broad audience, immediate pain, a deterministic demo, and a new mental model.

---

# Idea 1: the proof-carrying pull request

## What it proposes

The proposal’s core is:

> Every PR should carry replayable, executable evidence demonstrating what behavior changed and what behavior remained invariant.
> 

It would:

1. Interpret the PR’s intended behavior.
2. Create base and head environments.
3. run identical probes against both.
4. Identify:
    - intended deltas;
    - regressions;
    - vacuous tests;
    - inconclusive claims.
5. Mutate the changed implementation.
6. measure whether the evidence detects plausible wrong implementations.
7. Emit a replayable evidence capsule.

This is much more interesting than “an AI that reviews your PR.”

## Does something like it already exist?

### All individual components exist

- Meta’s **Just-in-Time Catching Test Generation** creates change-aware tests designed to expose defects before code lands. Meta evaluated more than 22,000 generated tests and reported significantly improved defect detection.[Meta paper](https://arxiv.org/pdf/2601.22832) [Meta engineering](https://engineering.fb.com/2026/02/11/developer-tools/the-death-of-traditional-testing-agentic-development-jit-testing-revival/)
- Meta’s **Automated Compliance Hardening** uses LLM-generated, problem-specific mutants and corresponding tests.[Meta ACH](https://engineering.fb.com/2025/09/30/security/llms-are-the-key-to-mutation-testing-and-better-compliance/)
- **Mutahunter** already provides open-source, language-agnostic, LLM-assisted mutation testing.[GitHub](https://github.com/codeintegrity-ai/mutahunter)
- **TestSprite** interprets requirements, generates tests, runs them in isolated environments, and provides logs, screenshots, videos, and diagnostics.[TestSprite](https://www.testsprite.com/use-cases/en/ai-code-validation-tool)
- **Stably** validates PRs against live preview environments.[Stably](https://www.stably.ai/use-cases/pull-request-validation)
- CodeRabbit, Qodo, Greptile, and other PR products already provide review and test-generation functionality.
- Differential execution is old; Diffy and similar systems compare old and new behavior.

### But I did not find a mature OSS project with this exact integrated protocol

The differentiated combination is:

- explicit behavioral claims;
- base-versus-head execution;
- intended-delta versus invariant classification;
- rejection of tests that pass on both revisions;
- focused semantic mutation;
- replayable, commit-bound evidence;
- a neutral evidence format usable by any coding agent.

That combination remains meaningfully differentiated.

So the verdict is:

> **The primitives exist, but the productized semantic unit—“a PR carrying bounded, adversarially tested behavioral evidence”—still has real whitespace.**
> 

## Is the problem high-value?

Yes.

AI has made producing code cheap, but understanding and validating generated changes remains expensive. Maintainers and engineering teams are already reporting that AI-generated PR volume is becoming difficult to review carefully.[GitHub guidance](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/) [ITK community](https://discourse.itk.org/t/ai-generated-pull-requests-overwhelming-hard-to-review-carefully/7728) [OpenRefine community](https://forum.openrefine.org/t/how-do-you-deal-with-ai-generated-prs/2578)

That creates a durable asymmetry:

- AI writes 2,000 lines quickly.
- A senior engineer must still understand whether those lines are correct.
- Another model giving a prose review does not eliminate the verification burden.
- Generated tests may repeat the implementation’s mistaken assumptions.
- Ordinary coverage cannot tell whether assertions are meaningful.
- Mutation testing helps, but is not currently packaged around the PR’s claimed intent.

This is a genuine infrastructure problem rather than a temporary trend.

## Why it has the best traction potential

It has a strong, comprehensible meme:

> **No proof, no merge.**
> 

And an excellent deterministic demo:

```
CSV export feature       Base: FAIL   PR: PASS   → intended change demonstrated
Anonymous export blocked Base: PASS   PR: FAIL   → regression
Agent-generated test     Base: PASS   PR: PASS   → vacuous evidence
Authorization removed    Mutant survived         → verification gap
```

This is:

- visual;
- objective;
- controversial enough for Hacker News;
- relevant to every coding-agent ecosystem;
- useful regardless of whether code came from Claude, GPT, OpenHands, Cursor, or a human;
- immediately understandable without reading a 20-page architecture document.

That is stronger OSS launch material than another “agent firewall” dashboard.

## Weaknesses and corrections

### 1. “MergeProof” is not an available identity

The name already has adjacent use:

- [MergeProof — AI-generated code validation](https://mergeproof.org/)
- [MergeProof — staked PR review protocol](https://mergeproof.com/)

Using it would produce confusion, weak searchability, trademark risk, and accusations that the project is a clone.

Choose a new name. Possible naming directions—not availability-verified—include:

- **PRWitness**
- **PatchProof**
- **DiffWitness**
- **EvidenceCI**
- **ClaimCheck**
- **ProofPatch**

Before selecting one, check GitHub, npm, PyPI, domains, Product Hunt, and trademarks.

### 2. The original 3-day scope is too large

The proposal promises, within 72 hours:

- model-generated behavioral contracts;
- two-world environments;
- mutation generation;
- changed-line coverage;
- Semgrep and Gitleaks adapters;
- Playwright;
- flake detection;
- HTML reports;
- GitHub Actions;
- multiple model providers;
- Sigstore;
- replay;
- five production-quality demos.

That is not a credible polished 3-day release, even using frontier models continuously. Code generation is not the limiting factor—debugging arbitrary repositories and environment setup are.

### 3. “Proof” can undermine credibility

The system cannot establish total correctness. It can only produce evidence for bounded claims under particular probes and environments.

The technically honest category is:

> **A differential, adversarial evidence compiler for code changes.**
> 

Use “proof-carrying PR” as the memorable vision, but clearly state:

> This is bounded executable evidence, not formal verification.
> 

### 4. Extracting intent from PR prose is unreliable

A misleading PR description can produce misleading contracts. In v0.1:

- require or strongly encourage a human-readable `claims.yml`;
- infer claims from the PR only as suggestions;
- show every claim before execution;
- never allow the model alone to decide what has been proven.

### 5. It can be absorbed by incumbents

GitHub, Qodo, CodeRabbit, TestSprite, or Meta could add two-world execution and mutation scoring.

The response is not to claim an uncopyable algorithm. The moat has to become:

- the open evidence-capsule specification;
- a large public benchmark;
- language and test-runner adapters;
- a semantic-mutant corpus;
- historical evidence data;
- community expectations around “evidence required”;
- integrations that let every agent produce the same neutral artifact.

---

# Idea 2: Cordon

## What it proposes

Cordon is a provenance-aware firewall for agent tool calls. It would label data as trusted, untrusted, or sensitive and block dangerous source-to-sink paths, especially the “lethal trifecta”:

- untrusted content;
- sensitive data;
- an external communication channel.

Its claimed differentiator is deterministic dataflow enforcement instead of prompt-injection detection based on regexes or another LLM.

## Does something like it exist?

Yes—substantially.

Relevant overlaps include:

- **CodeIntegrity** explicitly describes taint analysis for AI-agent tool calls and runtime control over tool calls and data flow.[Research](https://www.codeintegrity.ai/blog/mcp-tool-calls-security) [Product](https://www.codeintegrity.ai/)
- **AgentFence** has request-side policies, approval gates, audit logging, and string-provenance taint tracking; response-side policy is actively being discussed.[AgentFence limitation](https://medium.com/@diogofcul/agentfence-a-local-mcp-policy-firewall-for-ai-agent-tool-calls-9e012c32f52e)
- **PROV-AGENT** provides an open provenance model and near-real-time implementation for agent interactions.[Paper](https://arxiv.org/html/2508.02866v2)
- **CaMeL** is the obvious research predecessor around capabilities and structured control of untrusted data.
- Multiple projects and papers are working specifically on taint-style MCP vulnerabilities.
- Most damagingly, **a project named Cordon already describes itself as a security gateway between an LLM and MCP servers**, with a policy engine, audit logger, and approval workflows.[Existing Cordon](https://github.com/marras0914/cordon)

Therefore, neither the name nor the high-level category is free.

## The biggest technical problem

The claim:

> “It tracks the taint of every byte an agent touches.”
> 

is not credible when an LLM sits in the middle.

An LLM does not preserve explicit program variables. It can:

- summarize;
- paraphrase;
- combine trusted and untrusted material;
- infer something indirectly;
- encode information through tool selection;
- leak through exceptions, timing, or other implicit channels.

Recent work explicitly identifies implicit-flow and side-channel limitations in CaMeL-style defenses.[Research](https://arxiv.org/html/2606.26479v1)

The proposal tries to solve this by switching to a session-level rule:

> If untrusted content and sensitive data were both accessed, block later egress.
> 

That is safer, but it is no longer precise byte-level taint tracking. It is a conservative session interlock. For many useful workflows—read an untrusted email, consult a private customer record, send a reply—it will produce frequent blocks.

Therefore:

- precise tracking risks false negatives;
- session-wide taint risks severe false positives;
- “obfuscation-proof” is too strong;
- “physically impossible” is false without process/network isolation;
- a proxy can be bypassed if the agent has direct shell or network access.

## Value and impact

The underlying security problem is extremely high impact. Prompt injection and agent exfiltration are real and current. A private-repository leakage incident was reported against GitHub’s agentic workflows on 8 July 2026.[CSO report](https://www.csoonline.com/article/4194448/github-ai-agent-leaks-private-repositories-via-prompt-injection-attack.html)

But high problem severity does not equal high project differentiation.

Cordon would enter a category containing:

- funded runtime-security companies;
- access-control papers;
- MCP gateways;
- DLP/data-lineage vendors;
- open-source firewalls;
- model-provider defenses.

## Verdict on Cordon

> **Excellent research direction; weak 3-day product claim in its current form.**
> 

I would not build it as the primary project unless it is narrowed to a more honest and measurable wedge, such as:

> An open benchmark and reference monitor for explicit-versus-implicit information-flow attacks across MCP agents.
> 

That could be valuable, but it is less likely than Idea 1 to create immediate mass OSS adoption.

---

# Idea 3: AIRLOCK

## What it proposes

AIRLOCK is a general runtime control plane that:

- intercepts tool calls;
- applies deterministic policy;
- blocks or requires approval;
- records calls;
- creates replay cassettes;
- converts incidents into CI regression tests.

The strongest element is:

> **Record = replay = regression test.**
> 

## Does something like it exist?

Yes—very extensively.

Direct or near-direct competitors include:

- **AEGIS:** a pre-execution firewall, policy layer, approvals, kill switch, and cryptographic audit trail, supporting many agent frameworks.[GitHub](https://github.com/Justin0504/Aegis) [Paper](https://arxiv.org/html/2603.12621v1)
- **mcp-firewall:** policy enforcement, threat detection, and compliance-ready audit logging.[GitHub](https://github.com/ressl/mcp-firewall)
- **AgentFence:** local allow/deny/approval policy and audit controls.
- **Permit MCP Gateway:** authentication, authorization, consent, and logging.
- **AgentBound:** declarative permissions and runtime policy enforcement for MCP.[Paper](https://arxiv.org/html/2510.21236v1)
- **Pipelock:** pre-execution tool policy, DLP, egress controls, chain detection, and signed receipts.[GitHub](https://github.com/luckyPipewrench/pipelock)
- **Jamjet:** explicitly advertises blocking, approval, budgets, audit, and replay.
- **AISecOps Interceptor:** policy enforcement, budgets, local enforcement, MCP proxy, replay-diff analysis, and compliance export.[GitHub](https://github.com/viplavfauzdar/aisecops-interceptor)
- Commercial products from Silverfort, Cyberhaven, Trinitite, Gravitee, and others.

Record/replay is also not empty:

- MCP traffic record/replay repositories exist.
- Agent observability systems already convert failures into evaluation datasets and CI gates.
- Replay technologies are proliferating rapidly.

## The name is unusable

“AIRLOCK” is especially congested:

- [agent-airlock](https://github.com/sattyamjjain/agent-airlock)
- [airlock-hq/airlock](https://github.com/airlock-hq/airlock)
- [air-lock.ai](http://air-lock.ai)
- [Airlock cryptographic approval](https://airlockapp.io/)
- [MCP-Airlock](https://crunchtools.com/mcp-airlock-open-source-defense-prompt-injection-ai-agents/)
- an AI-agent sandbox also called Airlock;
- a prior Show HN project called Airlock.

Even a technically good implementation would be practically invisible in search.

## Is there still something useful inside it?

Yes: the **portable incident-to-regression cassette**.

That feature could be extracted as a narrow project:

> Record an agent tool-call incident once, then replay its tool outputs and policy decisions in CI without calling the model again.
> 

But even that faces existing replay tools. It would require a highly specific standard and excellent integrations to differentiate.

## Verdict on AIRLOCK

> **Do not build AIRLOCK as proposed.**
> 

It solves a valuable problem, but it is already a crowded category, its features have substantial direct overlap, its name is unusable, and its alleged moat—cassette format plus policy packs—is too weak against existing gateways and security vendors.

---

# Why Idea 1 beats Ideas 2 and 3

## 1. It has less direct competition

Cordon and AIRLOCK are both inside the expanding “agent runtime firewall/MCP gateway” category. Idea 1 sits at a more distinct intersection:

- AI code generation;
- differential execution;
- change-intent contracts;
- mutation analysis;
- replayable PR evidence.

There are competitors around every edge, but less direct occupation of the exact center.

## 2. Its audience is broader

Cordon and AIRLOCK primarily attract:

- agent-framework developers;
- security-conscious teams;
- enterprise platform teams;
- MCP-heavy deployments.

The proof-carrying PR idea attracts:

- every coding-agent user;
- every engineering team;
- open-source maintainers;
- QA engineers;
- AppSec teams;
- CI/CD vendors;
- model providers;
- GitHub/GitLab ecosystems.

## 3. It has lower adoption friction

Installing an agent firewall requires users to:

- change execution architecture;
- trust a security boundary;
- write policies;
- route tools through a proxy;
- tolerate false positives.

A PR verifier can initially be:

```bash
npx <new-name> verify main..HEAD
```

Users can run it without giving it permanent control of their environment.

## 4. The demo is more credible

A security demo can be accused of using a carefully selected attack that matches its rules.

The two-world PR matrix is easier to validate independently:

- checkout the two SHAs;
- run the probe;
- inspect the generated test;
- inspect the mutant;
- reproduce the outcome.

## 5. It matches where the economic bottleneck is moving

The market has many code producers. Verification capacity has not grown at the same speed. Idea 1 directly attacks that bottleneck rather than adding another producer or another policy gateway.

---

# The correct 72-hour build

Do **not** attempt the full Idea 1 specification.

## Day 1: deterministic core

Build only for Node/TypeScript repositories.

Ship:

- base/head worktrees;
- a manually authored `claims.yml`;
- two claim types:
    - `intended_delta`;
    - `invariant`;
- identical probes against base and head;
- four outcomes:
    - demonstrated;
    - regression;
    - vacuous;
    - inconclusive;
- JSON evidence artifact;
- one fixture containing an authorization regression.

The first “aha” must work without an LLM.

## Day 2: evidence strength

Add:

- Vitest support;
- 5–8 AST mutation operators;
- changed-code mutation only;
- killed/surviving mutant summary;
- one model call that **suggests** claims and probes;
- human-visible acceptance of generated claims;
- static HTML matrix.

Do not build general semantic mutation in three days. Start with deterministic operators such as:

- flip boolean;
- invert comparison;
- remove branch;
- change status code;
- omit `await`;
- alter boundary value.

## Day 3: product and distribution

Add:

- `npx` installation;
- one GitHub Action;
- three reproducible fixture PRs;
- 45-second demo;
- precise README;
- Apache-2.0 license;
- public evidence-capsule JSON schema;
- clear threat/limitations document.

Drop for v0.1:

- Python;
- arbitrary test runners;
- automatic Docker isolation;
- Sigstore;
- performance testing;
- browser screenshots unless the core is finished;
- Semgrep/CodeQL integration;
- production traffic capture;
- generalized agent orchestration.

---

# The launch positioning

Avoid:

> AI proves your code is correct.
> 

Use:

> **AI can write the patch. It shouldn’t grade its own homework.**
> 

Then:

> **A differential, adversarial evidence compiler for pull requests.**
> 

The strongest demo ending is still:

> **The code passed. The evidence failed.**
> 

And the movement-level phrase is:

> **No evidence, no merge.**
> 

That combination is more credible than “100% safe,” “physically impossible,” or “obfuscation-proof.”

---

# Hard final recommendation

## Build Idea 1, but build this version

> A renamed, local-first OSS tool that converts a code change into bounded behavioral claims, executes the same probes against base and head, rejects vacuous evidence, tests evidence against focused semantic mutants, and emits a replayable evidence capsule.
> 

## Do not build

- a general AI reviewer;
- a complete autonomous testing platform;
- AIRLOCK as an agent firewall;
- Cordon with “every-byte taint” or “physically impossible” claims;
- a massive platform covering every language in v0.1.

## Final score for the winner

- **Problem value:** 9.5/10
- **Technical impact:** 9/10
- **OSS usefulness:** 9/10
- **Traction potential:** 8.5/10
- **Current differentiation:** 8/10
- **72-hour MVP feasibility after narrowing:** 8/10
- **OpenClaw-like breakout potential:** best of the three, but dependent on execution and timing
- **Decision:** **GO**

The fundamental insight worth betting on is:

> **The next major layer after coding agents is not another coding agent. It is independent executable evidence for what those agents produce.**
