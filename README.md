# Proving Grounds

An independent, adversarial **testing lab and public leaderboard for AI agent products**.

It puts real shipping agents (browser agents, computer-use agents, coding agents) through
nasty, real-world tasks — including prompt-injection traps and "the correct answer is *I can't*"
scenarios — records the footage, judges the run with a reproducible rubric, and ranks products publicly.

## Tech Stack

- **Framework:** Next.js App Router 16 + TypeScript + Tailwind v4
- **Database:** Neon Postgres (Drizzle ORM + Better Auth)
- **Storage:** Vercel Blob (private evidence artifacts)
- **Queue/Rate-limit:** Upstash Redis
- **Judge:** Vercel AI SDK (LLM-as-judge, temperature 0, pinned model)
- **Arena:** Playwright + isolated sandbox (microVM/container)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill in real values
cp .env.example .env

# 3. Generate + apply database migrations
pnpm db:generate
pnpm db:migrate

# 4. Run dev server
pnpm dev
```

## Project Structure

```
src/
  app/              # Next.js App Router routes
    (public)/       # Public site (leaderboard, products, trials, methodology)
    api/            # API routes (health, intake, queue callbacks)
  lib/
    db/             # Drizzle schema + Neon client
    redis/          # Upstash Redis client + rate limiters
    blob/           # Vercel Blob client (private evidence storage)
    env.ts          # Environment variable validation
  components/       # Shared UI components
  styles/           # Global CSS + design system
worker/             # Trial runner entrypoint (P3+)
drizzle/            # Generated migrations
```

## License Policy

Nothing AGPL/GPL is bundled into the distributed app. See `THIRD_PARTY_NOTICES.md` for the
full dependency license inventory.
