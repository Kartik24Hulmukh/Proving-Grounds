# 00 — Vision and Moat (v2)

## One-sentence positioning

> **Proving Grounds is the independent crash-test authority for AI agents — the only verdict that
> ships with cryptographically sealed, independently re-runnable proof.**

Not "a better benchmark." A different category: benchmarks are *scores*; Proving Grounds sells
*verdicts with evidence* — like the difference between a car brochure's horsepower number and an
IIHS crash-test rating.

## The wedge (why now, in one paragraph)

Every major agent leaderboard has been publicly broken — agents hit near-perfect scores without
solving tasks via reward hacking, leaked answer tables, trojanized verification wrappers, and
intercepted dependency downloads. Simultaneously, enterprise procurement in 2026 now *requires*
independent adversarial testing (prompt injection, delegation abuse, exfiltration), EU AI Act
Art. 11/12 documentation, and defensible traces before buying any agent. Demand for un-gameable,
independent proof exists on both sides (vendors need it to sell; buyers need it to buy) and no
trusted referee exists. The referee captures more durable value than any player.

## The five compounding moats

### M1 — Un-fakeable evidence (trust moat)
Every trial produces a **sealed evidence bundle**: content-addressed (sha256 Merkle tree over
video, trace, HAR, DOM, step log), signed at capture time, appended to a public transparency log.
Anyone can run `pg verify <trial-id>` and independently confirm the bundle wasn't altered — and
`pg rerun <trial-id>` to reproduce the verdict from pinned scenario + adapter + judge versions.
Competitors grading their own customers (Galileo/Braintrust/Patronus pattern) structurally cannot
copy independence. This is the product, not a feature.

### M2 — The nastiness flywheel (data moat)
Every failure observed in a trial is distilled into a new adversarial scenario and added to the
private bank. Held-out oracle variants + rotating seeds + canary tokens keep it un-trainable-on.
The bank compounds daily; a 6-month head start is un-catchable the way query logs were for Google.
Add a **scenario bounty program** (break an agent → get paid/credited) to make the community
extend your moat for you.

### M3 — Reliability metrics nobody else publishes (methodology moat)
Single-run pass/fail is dead. Publish a multi-axis scorecard per agent:
- **Pass^k** — probability all k of k runs succeed (the industry's new reliability standard)
- **Injection Defense Score** — % of trap scenarios where defense held
- **Refusal Correctness** — did it say "I can't" when that was the right answer
- **Cost-per-Success** — dollars per completed task (buyers care; nobody publishes)
- **Consistency Index** — variance across seeds/runs
This turns your leaderboard from "who's #1" into procurement-grade due diligence.

### M4 — Closed loop: Test → Fix → Re-test → Publish (combo moat)
No one combines an adversarial lab with a self-verifying build loop. When a trial fails, your loop
generates a candidate fix (for consenting vendors), re-tests with sealed evidence, and publishes
"failed on 3/12 → fixed → passes 12/12, verified." Diagnosis + cure + proof-of-cure in one product.

### M5 — Cost asymmetry (economics moat)
Cheap-model pre-checks, deterministic rule oracles before any LLM call, budget-capped bounded
loops, batch/off-peak trial scheduling. Target: **10–100x more trials per dollar** than frontier-
model-on-everything incumbents. Referee authority scales with trial volume; cost leadership →
coverage leadership → trust leadership.

## Beachhead

Own **"agents on the hostile, messy, real web"**: flaky auth, regional/non-English flows,
anti-bot pages, ambiguous instructions, real payment/refund traps. Terminal-Bench/WebArena chase
clean English US-centric tasks and won't follow. Dominate one adversarial vertical (start with
browser/computer-use agents in commerce + support workflows), then expand to coding agents.

## Anti-goals (where 100x plays die)

- **Never grade your own customers' agents for pay-to-rank.** Certification fees are for *running
  the trial*, never for *the result*. Publish this policy on the methodology page.
- **Never out-build Devin/Factory.** The fix loop exists only to close M4.
- **Never let loops run unbounded.** Bounded, deterministic runs are required for reproducibility
  anyway — your credit discipline is a feature.
- **Never chase clean benchmarks.** The mess is the moat.
- **Never bundle AGPL/GPL** into the shipped app (unchanged from v1).

## Definition of "100x achieved"

1. A vendor puts the **PG Certified badge** on their homepage unprompted.
2. An enterprise buyer asks a vendor "what's your Proving Grounds score?" in procurement.
3. A trial replay clip organically clears 100k views.
4. `pg verify` is run by a third party you've never spoken to.
5. Scenario bank > 200, with >30% community-contributed via bounties.
