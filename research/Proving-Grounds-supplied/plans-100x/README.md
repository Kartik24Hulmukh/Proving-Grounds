# Proving Grounds — 100x Plan Pack (v2)

You already built the lab (P0–P8: arena, evidence, judge, intake, hardening — all present in the repo).
This pack is the next chapter: turn a working lab into **the un-gameable referee for AI agents** —
the Moody's / crash-test authority whose verdict vendors cite and buyers demand.

## Why v2 exists (what changed since v1)

1. **The market caught up to your thesis.** Terminal-Bench-class benchmarks are now publicly known
   to be gameable (reward hacking, trojanized wrappers, intercepted dependency downloads). The
   industry response is `Pass^k` reliability scoring instead of single-run success. Nobody yet sells
   *independent, evidence-backed, re-runnable* verdicts. That gap is yours.
2. **Enterprise procurement now demands exactly what you produce.** 2026 buyers require independent
   adversarial testing (prompt injection, cross-agent delegation, data exfiltration), EU AI Act
   Art. 11/12 documentation, and defensible trace logs. Your evidence pipeline is 80% of a
   procurement artifact — you just need to package it.
3. **Your repo is done with "build the machine."** The 100x is in trust mechanics (attestation),
   distribution loops (badge, CI action, MCP), and the nastiness flywheel — not more infra.

## Files

| File | Purpose |
|------|---------|
| `00-VISION-AND-MOAT.md` | The referee position, 5 compounding moats, positioning + anti-goals |
| `01-PRODUCT-UPGRADES.md` | The 100x feature set: attestation, Pass^k scorecard, certification, flywheel |
| `02-TECH-LEVERAGE.md` | Up-to-date tech choices + repo leverage map v2 (what to adopt/study/avoid) |
| `03-GTM-TRACTION.md` | Traction engine: distribution loops, revenue lines, beachhead, launch plan |
| `04-BUILD-LOOP-V2-PROMPTS.md` | Phased build prompts P9–P15 (feed to your coding agent one at a time) |
| `05-ACCEPTANCE-GATES-V2.md` | Machine-checkable gates for every new phase |

## How to use

1. Read `00` and `03` first — the 100x is mostly strategy + distribution, executed through product.
2. Feed `04` phases to your build loop one at a time, gated by `05`, exactly like the v1 loop.
3. Ship P9 (attestation + verify CLI) and P11 (certification badge) before anything else —
   they are the trust moat and the growth loop respectively. Everything else compounds on them.
