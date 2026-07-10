# Proving Grounds — Build Package

An independent, adversarial **testing lab and public leaderboard for AI agent products**.
It puts real shipping agents (browser agents, computer-use agents, coding agents) through
nasty, real-world tasks — including prompt-injection traps and "the correct answer is *I can't*"
scenarios — records the footage, judges the run with a reproducible rubric, and ranks products publicly.

> Thesis: the moat is **task nastiness + reproducible evidence + public trust**, not the agents themselves.

## What's in this package

| File | Purpose |
|------|---------|
| `00-PLAN.md` | Detailed, phased depth plan (scope, milestones, data model, risks). |
| `01-ARCHITECTURE.md` | System design: 6 subsystems, services, sequence flows, tech choices. |
| `02-BUILD-LOOP-PROMPTS.md` | The exact prompts to run **in a loop** until the system is production-ready. |
| `03-REPO-MANIFEST.md` | Which of the 89 researched repos to adopt / study / avoid, with licenses + roles. |
| `04-ACCEPTANCE-CRITERIA.md` | Machine-checkable "definition of done" gates the loop must pass. |
| `05-ENV-AND-SECRETS.md` | Env vars, secrets, and integration setup. |

## How to use it

1. Read `00-PLAN.md` and `01-ARCHITECTURE.md` to align on scope.
2. Provision the env from `05-ENV-AND-SECRETS.md`.
3. Feed the prompts in `02-BUILD-LOOP-PROMPTS.md` to your coding agent (v0, Claude Code, etc.),
   one phase at a time. After each phase, run the gates in `04-ACCEPTANCE-CRITERIA.md`.
4. Loop: if a gate fails, re-issue the phase's "repair prompt" until green, then advance.

## Download

Use the three-dot menu (top-right of the Block) → **Download ZIP** to export every file here.
