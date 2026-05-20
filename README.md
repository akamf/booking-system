# Booking System

A booking platform for a youth-focused activity center. Mobile (Expo), web admin (Next.js), Supabase backend, all in a pnpm + Turborepo monorepo.

For architecture see [`ARCHITECTURE.md`](./ARCHITECTURE.md). For decisions and trade-offs see [`DECISIONS.md`](./DECISIONS.md). For the task list see [`TASKS.md`](./TASKS.md).

## Prerequisites

- **Node.js 24** (use `nvm use` — version pinned in `.nvmrc`)
- **pnpm 10+** (`corepack enable && corepack use pnpm@10`)
- **Docker** (for local Supabase)
- **Supabase CLI** — invoked via `npx supabase`, no global install needed

## First-time setup

```bash
# from the repo root
./scripts/setup.sh
```

This:

1. Verifies your toolchain.
2. Runs `pnpm install` (workspace install).
3. Starts the local Supabase stack (Docker).
4. Applies migrations.
5. Generates the typed DB client into `packages/types/src/db.generated.ts`.
6. Loads seed data.

If you'd rather run it manually:

```bash
nvm use
pnpm install
pnpm db:start       # Docker required
pnpm db:reset       # applies migrations + seed
pnpm db:types       # writes packages/types/src/db.generated.ts
```

## Day-to-day

```bash
pnpm dev                       # everything in parallel
pnpm dev --filter @booking/web-admin
pnpm dev --filter @booking/mobile

pnpm typecheck                 # turbo typecheck across all packages
pnpm lint
pnpm test
```

Stop the database: `pnpm db:stop`.

## Layout

```
apps/
  mobile/           Expo + React Native (TypeScript strict)
  web-admin/        Next.js 16 admin (Tailwind + shadcn/ui)
  web-public/       Next.js 16 public site (scaffold v1)
packages/
  types/            Zod schemas + DB-generated row types (source of truth)
  domain/           Pure booking rules, availability, time, permissions
  api/              Supabase clients + TanStack Query hooks
  ui/               shadcn/ui-based web components (web only)
  config/           tsconfig presets, eslint, prettier, tailwind, tokens
supabase/
  migrations/       SQL migrations (numbered)
  functions/        Edge Functions (v2)
  seed.sql
  tests/            SQL tests for constraints and RPCs
```

## Engineering rules (excerpt)

- `strict: true`, `noUncheckedIndexedAccess`, no `any`, no `as any` — see ADR-0015.
- Zod is the single source of truth for boundary shapes — see ADR-0004.
- Booking writes go through `SECURITY DEFINER` RPCs — see ADR-0006.
- Double-booking is impossible at the DB level — see ADR-0003.
- One commit per task (Conventional Commits) — see ADR-0014.
