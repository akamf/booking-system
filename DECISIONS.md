# Architecture Decision Records

ADRs are append-only. To overturn a decision, add a new ADR that supersedes the old one and mark the old one accordingly. Each record states the context, the decision, the rationale, and what we explicitly rejected — so future readers can tell whether the trade-offs still apply.

---

## ADR-0001 — Monorepo with pnpm + Turborepo

**Status:** Accepted (2026-05-20)

**Context.** We ship three TypeScript surfaces (mobile, admin, public) that share contracts and domain logic. The schemas in `packages/types` must be the single source of truth; copy-paste between repos is unsafe.

**Decision.** A single pnpm workspace orchestrated by Turborepo.

**Rationale.**

- pnpm is strict by default — packages cannot import from siblings they don't depend on, which keeps boundaries honest.
- Workspace symlinks mean a change to `@booking/types` is immediately visible to every consumer without a publish step.
- Turborepo's pipeline cache makes CI fast and Vercel deploys understand it natively.
- The combination is the industry default for Next.js + Expo monorepos in 2026; the documentation paths are well-trodden.

**Rejected:**

- **Polyrepo.** Loses the "single source of truth" property; every shared change becomes a coordinated multi-PR.
- **Nx.** More features than we need; heavier mental load for new contributors.
- **Bun workspaces.** Promising but Expo/EAS compatibility still has rough edges in 2026; revisit in v2.

---

## ADR-0002 — Supabase as backend

**Status:** Accepted

**Context.** We need auth, a relational store, and per-row authorization. We don't want to run our own infrastructure. We also don't want to be locked into a closed product.

**Decision.** Supabase. Postgres is the source of truth; Supabase provides Auth, RLS, RPC, Storage, Edge Functions, and a typed client.

**Rationale.**

- Postgres is the right tool for booking. Exclusion constraints solve double-booking elegantly. We can't get that from Firebase or DynamoDB.
- RLS is the right authorization primitive for a multi-tenant-ish app where the same query needs to return different rows for different users.
- If we ever leave Supabase, the SQL migrations come with us. Auth would be the migration cost — manageable.
- Edge Functions give us a server-side surface without standing up an extra service.

**Rejected:**

- **Firebase.** No relational integrity, no SQL, no exclusion constraints. Wrong shape for booking.
- **Custom Node backend on top of Postgres.** Extra service to deploy and monitor; we'd reinvent RLS in middleware and get it wrong.
- **PlanetScale + custom Node.** PlanetScale removed FKs, won't add gist constraints. Wrong tool.

---

## ADR-0003 — Booking overlaps prevented by a Postgres exclusion constraint

**Status:** Accepted

**Context.** The most damaging bug a booking system can ship is the double-booking. Application-layer checks (`SELECT … WHERE overlaps; if none, INSERT`) lose the race under concurrency.

**Decision.** Use a Postgres exclusion constraint:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status IN ('pending','confirmed'));
```

**Rationale.**

- Atomic, transaction-safe, race-proof. The DB rejects the second insert with a constraint violation.
- The `[)` interval makes "ends_at = next.starts_at" valid (back-to-back bookings).
- Filtering on status means cancelled bookings free the slot instantly, with no extra queries.

**Implications.**

- The RPC `book_resource` catches the unique violation and returns a typed `RESOURCE_UNAVAILABLE` error to the client.
- `pending` bookings *do* hold the slot — desirable for future payment-gated reservations.

**Rejected.** Application-level locking (advisory locks, SELECT FOR UPDATE) — adds complexity without matching the durability of a constraint.

---

## ADR-0004 — Zod schemas are the source of truth for shared contracts

**Status:** Accepted

**Context.** The boundaries — RPC inputs/outputs, REST payloads, form data — need shape validation at runtime and type information at compile time. Maintaining two parallel definitions invites drift.

**Decision.** Every external shape is defined as a Zod schema in `packages/types`. TypeScript types are inferred via `z.infer`. Never hand-write a type that mirrors a schema.

**Rationale.**

- Single source of truth eliminates drift.
- Validators are needed anyway for safety at boundaries (RPC payloads from clients, form submissions).
- Zod's TS inference is excellent; refactoring a schema flows to consumers as a type error.

**Rejected.**

- **io-ts.** Less ergonomic, smaller ecosystem.
- **TypeBox / valibot.** Reasonable, but Zod is the default in the Next.js / Supabase community and the network effects matter.

DB-generated row types come from `supabase gen types typescript` into `packages/types/src/db.generated.ts` and are **never edited by hand**.

---

## ADR-0005 — Minimal personal data: `birth_year`, no DOB, no national ID

**Status:** Accepted

**Context.** The platform targets youth. The minimum data needed for our actual use cases is the user's age band (age-gating activities, computing whether they're a minor for guardian rules) and a chosen display name.

**Decision.**

- Store `profiles.birth_year` (integer).
- Do **not** store full date of birth, personal identity number, full legal name, address, or phone (until SMS becomes relevant).
- `display_name` is free text but bounded; nothing forces it to be a real name.

**Rationale.**

- Age-gating only needs the year (off-by-one for a few months at the boundary is acceptable; we're not running a casino).
- A breach of `birth_year + email` is materially less harmful than `DOB + name + ID`.
- GDPR demands data minimization. The simplest way to meet that demand is to not have the data.

**Trade-off.** "Happy birthday" automations are not possible without DOB. We're fine with that.

---

## ADR-0006 — Booking writes route through `SECURITY DEFINER` RPC functions

**Status:** Accepted

**Context.** RLS protects rows but cannot enforce multi-row logic (compatibility checks, opening hours, guardian-on-behalf-of permissions) in a single transaction with clean error responses.

**Decision.** Direct INSERT/UPDATE/DELETE on `bookings` is denied by RLS. All writes go through `book_resource`, `cancel_booking`, `override_booking`, etc. — Postgres functions marked `SECURITY DEFINER`.

**Rationale.**

- One place to maintain the rule set; trivially auditable.
- Returns structured errors the client can switch on (e.g., `BOOKING_OUTSIDE_HOURS`, `RESOURCE_UNAVAILABLE`, `NOT_AUTHORIZED`).
- The exclusion constraint still backs us up if a future migration mis-handles the rule.
- Audit triggers fire naturally since the function still issues an INSERT.

**Rejected.**

- **Direct INSERT with RLS-only.** Cannot express compatibility checks well; rule changes are scattered.
- **Application-only enforcement.** Always loses to concurrency and is opaque to direct DB access (a future BI tool dump would bypass it).

---

## ADR-0007 — No cross-platform shared UI components

**Status:** Accepted

**Context.** React Native and React-on-the-web do not share primitives. A "Button" component cannot be one file used by both. Cross-platform libraries (tamagui, nativewind, react-native-web) exist, but they couple our UI to a framework we don't otherwise need.

**Decision.** `packages/ui` is web-only (shadcn/ui + Tailwind). Mobile has its own component layer in `apps/mobile/src/components`. Design tokens (colors, spacing scale, type scale) are shared via a token file in `packages/config`.

**Rationale.**

- Honest separation; no leaky abstractions.
- shadcn/ui's copy-and-paste model thrives in `packages/ui`.
- Mobile-platform conventions (haptics, native scroll, safe area) want platform-native components anyway.
- Tokens give us visual consistency without forcing a runtime.

**Rejected.** Tamagui — capable but heavy; would dictate the styling model across the codebase. Not worth it for the v1 surface area.

---

## ADR-0008 — Next.js 16 App Router for web; Server Components by default

**Status:** Accepted

**Context.** Web admin and web public are content-heavy and benefit from server rendering. Vercel-hosted, with Cache Components and Partial Prerendering available.

**Decision.** Next.js 16 App Router. Server Components by default. Server Actions wrap RPC calls for mutations. `'use client'` only when interactivity demands it.

**Rationale.**

- Server-first matches our security posture — by default, secrets and DB calls stay on the server.
- Cache Components let us mark slow data as `use cache` with `cacheLife`/`cacheTag`, and invalidate on `updateTag` from Server Actions.
- First-class Vercel deploy.

**Rejected.** Remix — comparable but smaller Vercel ecosystem; less momentum than App Router.

---

## ADR-0009 — Roles via a separate `user_roles` table, not a single `role` column

**Status:** Accepted

**Context.** A person can be both an admin and a guardian. A guardian who joins a league becomes a member without ceasing to be a guardian. A single column forces invented composite roles ("admin_guardian") and complicates RLS predicates.

**Decision.** A `roles` lookup table keyed by `role_key`. A `user_roles` (user_id, role_key) M:N table. RLS uses `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_key = 'admin')`.

**Rationale.**

- Composable. Adding a new role doesn't require a column migration.
- RLS predicates read naturally.
- Easy to reason about in audit ("user gained `staff` role on …").

**Age and `youth`.** `youth` is a derived role assigned at profile creation when `birth_year` indicates the user is under 18, removed at the 18th-birthday milestone (handled by a nightly job; see TASKS.md Phase 5). A self-booking cutoff age (default 13) is checked in `book_resource` separately.

---

## ADR-0010 — Guardian relationships as an explicit M:N table

**Status:** Accepted

**Context.** Modern family structures: multiple guardians per minor (separated parents, foster carers); guardians with multiple minors. A simple "parent_user_id" on profile is wrong.

**Decision.** `guardian_links (guardian_user_id, minor_user_id, created_at, verified_at)`. Composite PK.

**Rationale.**

- Models reality.
- RLS policies for "guardian can act on behalf of minor" read as `EXISTS (SELECT 1 FROM guardian_links WHERE guardian_user_id = auth.uid() AND minor_user_id = :target)`.
- `verified_at` is a future hook for guardian-initiated verification (the v1 admin creates links).

**Termination.** Auto-revocation when the minor turns 18 is implemented in the policies themselves (`AND date_part('year', now())::int - p.birth_year < 18`), not by deleting the row — we keep the history for audit.

---

## ADR-0011 — Audit log via triggers on mutating tables

**Status:** Accepted

**Context.** Audit needs to be impossible to bypass. Putting audit writes in the application is fragile (a forgotten code path skips it).

**Decision.** A single `audit_log` table populated by `AFTER INSERT/UPDATE/DELETE` triggers on `bookings`, `profiles`, `guardian_links`, `user_roles`, `blocked_times`, `opening_hours`, `activities`, `resources`. The trigger captures `actor_user_id` from `auth.uid()`, the action, and JSONB before/after snapshots.

**Rationale.**

- Bypassing audit requires a malicious migration — and that itself is auditable.
- Aligns with security best practice (defense in depth).
- `audit_log` is RLS-protected: visible only to admin/staff; insertable only by the trigger (no GRANT INSERT for any role).

**Trade-off.** Audit rows grow quickly. We size for it and add an archival job in v2.

---

## ADR-0012 — Defer payments, push, realtime, QR, AI, tournaments, waiting lists, recurring bookings to v2

**Status:** Accepted

**Context.** Scope discipline.

**Decision.** v1 ships the booking core. The schema and architecture make room for each item but does not implement them:

- **Payments**: `bookings.status` already includes `pending`; the exclusion constraint already holds slots during checkout.
- **Push notifications**: a `device_tokens` table and Edge Function are designed but not built.
- **Realtime**: hooks have a single point of swap-in (`packages/api/hooks/useBookings.ts`) to switch from polling to a Supabase Realtime channel.
- **QR check-in**: `bookings` will need `check_in_token` and `checked_in_at` columns; deferred.
- **Tournaments / waiting lists / recurring**: new tables; the existing exclusion constraint continues to hold under all.
- **AI assistant**: pure read-side feature on top of Edge Functions; orthogonal.

**Rationale.** Shipping a correct, secure booking core in v1 is the constraint that matters. Half-built scope is worse than zero scope.

---

## ADR-0013 — `timestamptz` for all booking times; per-location IANA timezone

**Status:** Accepted

**Context.** A booking happens "at 18:00 local time" but stores as a moment in time. Mishandling time zones is the next-most-common booking bug after double-booking.

**Decision.**

- `bookings.starts_at` and `ends_at` are `timestamptz` (stored UTC).
- `locations.timezone` is an IANA name (`Europe/Stockholm`).
- `opening_hours.opens_at`/`closes_at` are stored as `time` (clock time, location-local). The trigger that validates "within opening hours" converts the booking's `timestamptz` to the location's local time before comparing.
- All time conversion lives in `packages/domain/time.ts`. No conversion logic in components.

**Rationale.** Standard correct approach. Compactly defendable in code review.

---

## ADR-0014 — Conventional Commits; one task per commit

**Status:** Accepted

**Context.** This plan is built by an AI agent producing many small commits. History needs to read well; tasks need to be revertible.

**Decision.** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). One task = one commit. No bundling unrelated changes.

**Rationale.**

- `git log` becomes a readable changelog.
- `git revert` is safe at task granularity.
- Future tooling (changesets, release-please) plugs in naturally.

---

## ADR-0015 — Strict TypeScript everywhere; `any` is a lint error

**Status:** Accepted

**Context.** TypeScript is only as strong as its strictest tsconfig + lint rules. Loose settings silently rot the type graph.

**Decision.**

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`, `exactOptionalPropertyTypes: true` everywhere.
- ESLint rule `@typescript-eslint/no-explicit-any: error`.
- ESLint rule `@typescript-eslint/consistent-type-assertions` configured to forbid `as any`.
- `// @ts-ignore` and `// @ts-expect-error` require an accompanying issue link.

**Rationale.** The cost of strict types compounds in the right direction. Loose types compound in the wrong one.
