# THIRD_PARTY_NOTICES.md

This file lists every third-party dependency bundled into the Proving Grounds
distributed application, along with its license type. This is required by
acceptance gate G.4 and is maintained automatically + manually.

**License Policy (G.1):** Nothing AGPL/GPL is bundled into the distributed app.
AGPL-licensed tools (e.g. Skyvern, Grafana) run only as EXTERNAL services or
test subjects — never imported as dependencies.

## Runtime Dependencies

| Package | License | Purpose |
|---------|---------|---------|
| next | MIT | App Router framework (Next.js 16) |
| react | MIT | UI runtime |
| react-dom | MIT | DOM renderer |
| drizzle-orm | Apache-2.0 | TypeScript ORM for Postgres |
| @neondatabase/serverless | MIT | Neon Postgres HTTP driver |
| better-auth | MIT | Admin authentication (email+password) |
| ai | Apache-2.0 | Vercel AI SDK (LLM-as-judge) |
| zod | MIT | Schema validation (env, scenarios, rubric) |
| @upstash/redis | MIT | Upstash Redis client (queue, rate-limit) |
| @upstash/ratelimit | MIT | Rate limiting middleware |
| @vercel/blob | Apache-2.0 | Private evidence artifact storage |
| postgres | MIT | postgres.js driver (worker connections) |
| drizzle-zod | Apache-2.0 | Drizzle → Zod schema generation |
| clsx | MIT | Conditional class names |
| tailwind-merge | MIT | Tailwind class conflict resolution |
| lucide-react | ISC | Icon set |
| class-variance-authority | Apache-2.0 | Component variant management |

## Dev Dependencies (not shipped in bundle)

| Package | License | Purpose |
|---------|---------|---------|
| typescript | Apache-2.0 | Type checking |
| @types/node | MIT | Node.js type definitions |
| @types/react | MIT | React type definitions |
| @types/react-dom | MIT | React DOM type definitions |
| tailwindcss | MIT | Utility-first CSS framework (v4) |
| @tailwindcss/postcss | MIT | Tailwind PostCSS plugin |
| drizzle-kit | MIT | Database migration tooling |
| postcss | MIT | CSS transformer |
| autoprefixer | MIT | CSS vendor prefix automation |

## CI-Only Tools (not bundled, not shipped)

| Tool | License | Purpose |
|------|---------|---------|
| gitleaks | MIT | Secret scanning in CI |
| semgrep | LGPL-2.1 | Static analysis in CI |
| github/codeql | MIT | CodeQL analysis in CI |

## External Services (not bundled, run separately)

| Service | License | Purpose |
|---------|---------|---------|
| Grafana | AGPL-3.0 | Observability dashboards (external only) |

## Test Subjects (DRIVE, not dependencies)

These agent products are tested via network/CLI boundaries. They are never
imported or bundled into the Proving Grounds codebase.

| Repo | License | Role |
|------|---------|------|
| browser-use/browser-use | MIT | Reference adapter #1 |
| browserbase/stagehand | MIT | Reference adapter #2 |
| Skyvern-AI/skyvern | AGPL-3.0 | Test via network/CLI only — never imported |
| All-Hands-AI/OpenHands | MIT | Coding-agent subject |

---

Last updated: P0 — Foundations
