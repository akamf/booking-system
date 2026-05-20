# Booking System — Implementation Plan

> **Working document.** Removed in the final commit (`chore: complete implementation plan`).
> Architecture, decisions, and task tracking live in `ARCHITECTURE.md`, `DECISIONS.md`, `TASKS.md`.

## 1. Mission

Build a modern, mobile-first booking platform for a youth-focused activity center. The platform must let kids and their guardians find available courts/areas, book activities like volleyball / badminton / pickleball, and let admins run the venue. Privacy and youth safety are non-negotiable; double-booking is impossible; the system is built to grow into payments, memberships, push, and check-in without a rewrite.

## 2. Scope of v1

In scope for v1 (this plan):

- Monorepo skeleton (pnpm + Turborepo)
- Shared contracts (Zod), shared domain logic (pure TS), generated DB types
- Supabase schema with **DB-enforced** booking constraints and Row Level Security
- Auth: email magic-link via Supabase; guardian-created youth accounts
- Web admin (Next.js 16, App Router, Tailwind, shadcn/ui): activities, resources, bookings, users, opening hours, blocked times, audit
- Mobile (Expo, Expo Router, RN, TypeScript strict): sign-in, discover, availability, booking flow, my bookings, profile
- Audit logging via DB triggers
- Seed data + local dev story
- CI: typecheck, lint, test, Supabase migration validate

Explicitly **out of scope** for v1 (designed for, but not implemented):

- Payments / Stripe
- Memberships
- Push notifications (in-app banners only)
- QR check-in
- AI assistant
- Realtime subscriptions (poll-on-focus is good enough at this size)
- Tournaments, waiting lists, recurring bookings
- Multi-location runtime (schema supports it; UX assumes one location)
- Public web app (`apps/web-public` — scaffold only, no features)

See `DECISIONS.md` ADR-0012 for the rationale on each deferral.

## 3. Why this order

The plan is a strict bottom-up: data and domain rules first, UI last. Reasoning:

1. **Booking correctness is the hard problem.** If the DB can be coerced into double-booking, no amount of UI polish saves us. We get the Postgres exclusion constraint working, with tests, before anything else touches it.
2. **Contracts before consumers.** Zod schemas + generated DB types live in `packages/types`. Every app imports from there. We never let a UI invent a shape that the DB doesn't enforce.
3. **Domain logic is pure and testable.** Availability calculation, booking rules, permission predicates live in `packages/domain` as framework-free TS. Unit tests catch regressions in seconds. UIs become thin renderers.
4. **Admin before mobile.** The admin shell exercises the same RPCs the mobile app will, on a more forgiving platform. Bugs surface faster in a browser.
5. **Mobile last.** EAS builds are slower and harder to iterate. Once the API is rock-solid, mobile is a UI exercise.

## 4. Architectural pillars

These are the non-negotiables. Any deviation requires an ADR.

1. **Strict TypeScript everywhere.** `strict: true`, `noUncheckedIndexedAccess: true`. No `any`, no `as any`, no `// @ts-ignore` without a tracked issue.
2. **Database is the source of truth.** Booking rules — overlaps, opening hours, activity/resource compatibility — are enforced in SQL. The app layer is a *second* check for UX, never the only one.
3. **Single shared contract.** Zod schemas define the shape of everything that crosses a boundary. TypeScript types are inferred (`z.infer`), never hand-written.
4. **Pure domain core.** Booking math (slot generation, availability merging, conflict detection in-memory for UI hints) is in `packages/domain`. No React, no Supabase, no fetch.
5. **Authorization is centralized.** RLS at the DB. RPC functions with `SECURITY DEFINER` for writes. Permission predicates in `packages/domain` for UI gating. Three layers, one source of intent.
6. **Data minimization by default.** We collect `birth_year`, never full DOB. No personal identity numbers. No free-text user notes. Audit *what was done*, not *who said what*.
7. **Feature-folder structure.** Apps are organized by domain feature (`features/booking`, `features/availability`), not by technical layer (`components/`, `services/`).
8. **One commit per task.** Small, atomic, conventional commits. Every commit leaves the tree green.

## 5. Phases at a glance

Detailed task breakdown lives in `TASKS.md`. Phases:

| # | Phase | Output |
|---|-------|--------|
| 0 | Foundation | pnpm/Turbo monorepo, shared configs, empty packages |
| 1 | Database & domain core | Supabase schema, RLS, RPCs, generated types, pure domain logic with tests |
| 2 | API package | Typed Supabase client factory, TanStack Query hooks |
| 3 | Web admin | Auth, layout, activities, resources, bookings, users, audit |
| 4 | Mobile app | Auth, discover, availability, booking, my bookings, profile |
| 5 | Hardening & docs | Seed data, E2E smoke, READMEs, polish |
| 6 | Wrap | Remove `PLAN.md`, update `DECISIONS.md` |

## 6. Verification per phase

- **Phase 0**: `pnpm i && pnpm turbo run typecheck` succeeds. CI green.
- **Phase 1**: `supabase db reset` succeeds, migrations idempotent. `pnpm test --filter @booking/domain` green. SQL test proves exclusion constraint blocks overlap.
- **Phase 2**: Type-check passes consuming `packages/api` from a dummy import. Hooks have unit-level tests where logic is non-trivial.
- **Phase 3**: Web admin runs on `pnpm dev --filter @booking/web-admin`. Manual smoke: log in, create an activity, create a resource, create a booking, see audit row.
- **Phase 4**: Mobile runs on `pnpm dev --filter @booking/mobile` (Expo Go on simulator). Manual smoke: log in, see resources, book a slot, see it appear in admin.
- **Phase 5**: Seeded DB matches expectations; READMEs let a new dev get to a running app in <15 min.

## 7. Risks

- **R1 — Supabase RLS complexity.** Guardian-on-behalf-of-minor flows are easy to get subtly wrong. Mitigation: pgTAP-style SQL tests for every policy; every write goes through an RPC where possible.
- **R2 — Time zones.** Activity centers operate in local time, but Postgres stores `timestamptz` (UTC). Mitigation: all `bookings.starts_at`/`ends_at` are `timestamptz`; opening hours are stored per-location with a stored `timezone` (IANA name); conversion happens in one place (`packages/domain/time.ts`).
- **R3 — Youth without email.** A 9-year-old won't have a personal inbox. Mitigation: guardian creates the youth profile; youth signs in either by guardian-mediated magic link or, in a later phase, a guardian-issued short PIN. v1 ships guardian-mediated.
- **R4 — Booking race conditions.** Two clients submit identical bookings. Mitigation: Postgres `EXCLUDE USING gist` constraint on `(resource_id, tstzrange(starts_at, ends_at, '[)'))` filtered by status. Race condition becomes a unique-violation we translate to a clean error.
- **R5 — GDPR deletion vs audit.** Hard-deleting a user breaks audit history. Mitigation: soft-delete profile (`deleted_at`), anonymize display name on delete, keep `audit_log.actor_user_id` referentially intact but display "deleted user" in UI.
- **R6 — Monorepo cold-start tax.** Newcomers find pnpm/Turborepo intimidating. Mitigation: a thorough root `README.md` and a `make-dev` script.

## 8. Open questions (decide before Phase 3)

- **Q1**: Do guardians need to *approve* every booking a minor makes, or only configure that requirement per-child? *Working assumption v1*: minors below age 13 require guardian to book on their behalf; 13+ can self-book. Configurable later.
- **Q2**: How long before bookings auto-anonymize for GDPR? *Working assumption*: 24 months after `ends_at`, profile-linked fields scrub to "anonymous". Configurable via a cron in v2.
- **Q3**: Cancellation policy default? *Working assumption*: free cancellation up to 2 hours before `starts_at`. Enforced in RPC.
- **Q4**: Booking duration: fixed (e.g., 60-min volleyball block) or flexible? *Working assumption*: activity declares `default_duration_minutes` and `min/max_duration_minutes`. UI defaults to default; admin can override.

## 9. Definition of done

Every task is "done" only when:

1. Code compiles with `strict` and no `any`/`as any`.
2. Tests for the unit pass (where applicable — domain logic and SQL constraints require tests).
3. Lint passes.
4. A single conventional commit captures *only* the work for that task.
5. `TASKS.md` checkbox is flipped to `[x]`.

When the last task is `[x]`:

1. Verify the full pipeline (`pnpm typecheck && pnpm lint && pnpm test`).
2. Remove `PLAN.md`.
3. Final commit: `chore: complete implementation plan`.
