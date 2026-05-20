# Booking System — Architecture

This document is the durable architectural reference for the platform. It outlines structure, domain model, security model, and extensibility points. For *why* specific choices were made, see `DECISIONS.md`. For task tracking, see `TASKS.md`.

## 1. System overview

Three clients, one backend, one shared core.

```
┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐
│   Mobile App    │   │   Web Admin      │   │   Web Public    │
│  Expo + RN      │   │  Next.js 16      │   │  Next.js 16     │
│  Expo Router    │   │  App Router      │   │  (scaffold v1)  │
└────────┬────────┘   └─────────┬────────┘   └────────┬────────┘
         │                      │                     │
         └──────────────┬───────┴──────────┬──────────┘
                        │                  │
                ┌───────▼──────────────────▼────────┐
                │     packages/api (typed hooks)    │
                │     packages/types (Zod + DB)     │
                │     packages/domain (pure rules)  │
                │     packages/ui (shadcn, web)     │
                │     packages/config (tsc/eslint)  │
                └───────────────────┬───────────────┘
                                    │
                ┌───────────────────▼───────────────┐
                │     Supabase                       │
                │     - PostgreSQL (source of truth) │
                │     - Auth (magic link)            │
                │     - Row Level Security           │
                │     - RPC functions (writes)       │
                │     - Edge Functions (v2)          │
                │     - Storage (v2)                 │
                └────────────────────────────────────┘
```

## 2. Monorepo layout

```
booking-system/
├── apps/
│   ├── mobile/              # Expo + React Native (TypeScript strict)
│   │   ├── app/             # Expo Router file-based routes
│   │   │   ├── (auth)/      # Sign-in stack
│   │   │   └── (tabs)/      # Home / Discover / Bookings / Profile
│   │   └── src/
│   │       ├── features/    # Feature folders (booking, availability, …)
│   │       ├── components/  # App-level components (not shared)
│   │       └── lib/         # Platform glue (storage, secure store)
│   ├── web-admin/           # Next.js 16 admin (Tailwind + shadcn)
│   │   └── src/
│   │       ├── app/         # App Router
│   │       │   ├── (auth)/
│   │       │   └── (admin)/ # dashboard / activities / resources / bookings / users / audit
│   │       └── features/    # Feature folders mirroring admin domains
│   └── web-public/          # Next.js 16 public site (scaffold-only v1)
├── packages/
│   ├── types/               # Zod schemas + z.infer types + DB-generated types
│   ├── domain/              # Pure TS: booking rules, availability, time, permissions
│   ├── api/                 # Supabase client factory + TanStack Query hooks
│   ├── ui/                  # Web-only shared components (shadcn + tokens)
│   └── config/              # tsconfig presets, eslint, prettier, tailwind preset
├── supabase/
│   ├── migrations/          # Numbered SQL migrations
│   ├── functions/           # Edge Functions (v2)
│   ├── seed.sql
│   └── tests/               # SQL tests (pgTAP-style)
├── .github/workflows/       # CI
├── ARCHITECTURE.md          # This file
├── DECISIONS.md             # ADRs
├── TASKS.md                 # Task tracker
├── PLAN.md                  # Working plan (removed at end)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Each app and package has its own `tsconfig.json` that extends from `packages/config`. No package depends on an app; apps depend on packages.

### Package responsibilities

| Package | Responsibility | Imports from | Imported by |
|---|---|---|---|
| `@booking/types` | Zod schemas, inferred TS types, DB-generated row types | none | all |
| `@booking/domain` | Pure booking rules, availability math, permission predicates, time helpers | `@booking/types` | `@booking/api`, apps |
| `@booking/api` | Supabase client factories (web/mobile), TanStack Query hooks | `@booking/types`, `@booking/domain` | apps |
| `@booking/ui` | shadcn/ui re-exports + composed components for web | `@booking/types` | `apps/web-admin`, `apps/web-public` |
| `@booking/config` | TS config presets, eslint, prettier, tailwind preset | none | all |

Mobile does **not** consume `@booking/ui` (different render primitives). See ADR-0007.

## 3. Domain model

### Entities

```
organizations            (multi-tenant ready; single row in v1)
└── locations            (each location has IANA timezone)
    ├── opening_hours    (per weekday)
    ├── blocked_times    (maintenance, holidays — optionally per-resource)
    └── resources        (courts/halls/areas)
        └── activity_resource_compatibility  (M:N to activities)

activities               (volleyball, badminton, pickleball, …)

profiles                 (1:1 with auth.users — app-side data)
roles                    (admin, staff, member, guardian, youth)
user_roles               (M:N profile↔role)
guardian_links           (guardian ↔ minor — many guardians per minor and v.v.)

bookings                 (the central table)
booking_participants     (M:N for future team bookings — minimal v1)

audit_log                (append-only)
```

### Bookings — DB-enforced invariants

A `bookings` row has `resource_id`, `activity_id`, `starts_at`, `ends_at`, and `status`. Enforced at the database level:

1. **No overlap.** `EXCLUDE USING gist` on `(resource_id, tstzrange(starts_at, ends_at, '[)'))` filtered to `status IN ('confirmed','pending')`. Race conditions become Postgres errors — the app cannot bypass it.
2. **Activity must be allowed on resource.** Trigger checks `activity_resource_compatibility` before insert/update.
3. **Within opening hours.** Trigger validates `starts_at`/`ends_at` fall within the location's opening_hours for the weekday.
4. **Not within a blocked time.** Trigger checks `blocked_times` overlaps.
5. **Duration sane.** Trigger validates `ends_at - starts_at` ∈ `[activity.min_duration_minutes, activity.max_duration_minutes]`.
6. **Authorization.** Insert/update is only allowed via `book_resource` RPC (RLS denies direct INSERT), where actor-vs-on-behalf checks happen.

### Cancellation

Cancellation is a status change, not a delete. `cancelled_at`, `cancelled_by`, `cancelled_reason` are set. Cancelled rows no longer participate in the exclusion constraint (it's filtered on status), freeing the slot immediately.

## 4. Authorization model

Three concentric rings, with the database as the innermost truth.

### Roles

`role_key` enum (lowercase, snake):

- `admin` — full access; can manage activities/resources/users; can override any booking.
- `staff` — venue staff; can view/cancel/override bookings, view audit; cannot manage admins.
- `member` — adult member; can book for themselves.
- `guardian` — adult guardian; can book on behalf of linked minors; can manage their minors' profiles.
- `youth` — minor account. Can browse and (above an age threshold) book for themselves. See `DECISIONS.md` ADR-0009.

Roles are stored in `user_roles` (M:N) — a profile can hold multiple roles simultaneously (e.g., admin + guardian).

### Ring 1 — Database (RLS)

Every table has policies. Default deny. Highlights:

- `bookings`: a row is readable if the caller is (a) staff/admin, (b) the booking `booked_by_user_id` or `on_behalf_of_user_id`, or (c) a guardian linked to the `on_behalf_of_user_id`. Direct INSERT/UPDATE/DELETE is **denied for all**; writes go through RPCs.
- `profiles`: readable by self, by linked guardians, by staff/admin. Writable by self and by linked guardian.
- `guardian_links`: insertable by admin or the guardian themselves (subject to verification flow, deferred). Readable by the guardian, the minor, and admin.
- `audit_log`: readable by admin/staff. Never writable from app code (trigger-only).

### Ring 2 — RPC functions

All writes route through `SECURITY DEFINER` functions:

- `book_resource(resource_id, activity_id, starts_at, ends_at, on_behalf_of_user_id?)` → returns `booking` or raises a typed error.
- `cancel_booking(booking_id, reason?)` → updates status; checks policy (e.g., cutoff time, admin override).
- `block_time(resource_id?, location_id, starts_at, ends_at, reason)` — admin/staff only.
- `link_guardian(minor_user_id)` — admin only in v1; v2 adds guardian-initiated verification.

Functions verify the caller via `auth.uid()` and the actor's roles, then run the operation in a transaction.

### Ring 3 — Application

The apps use predicates from `@booking/domain/permissions.ts` (e.g., `canCancel(booking, viewer)`) to hide UI controls. This is **strictly UX** — never the only check.

## 5. Privacy, youth, and GDPR

This is the most opinionated part of the architecture. See ADR-0005, ADR-0010, ADR-0011.

### Data minimization

Stored about a user:

- `auth.users.email` (managed by Supabase Auth)
- `profiles.display_name` (free text, but capped at 60 chars, no obligation to be a real name)
- `profiles.birth_year` (integer year only — sufficient for age-gating, insufficient to identify)
- `profiles.guardian_email` (only when a youth has no email of their own)
- `profiles.locale` (UI preference)

**Not stored:**

- Personal identity numbers / national ID
- Full date of birth
- Home address (the venue is the address)
- Phone (until SMS becomes relevant — deferred)
- Free-text "notes" or "tags" on profiles
- Health, dietary, or sensitive flags

### Guardian relationship

A `guardian_links` row connects a guardian profile to a minor profile. Multiple guardians per minor are supported (separated parents); a guardian can have multiple minors. A guardian can:

- View their minor's bookings.
- Book on behalf of their minor (`book_resource(..., on_behalf_of_user_id = minor.id)`).
- Update the minor's profile.
- Trigger GDPR export/delete for the minor.

When a minor turns 18 (computed from `birth_year`), guardian access auto-revokes — the link row remains for audit but RLS policies stop honoring it.

### Audit log

Every mutating write to `bookings`, `profiles`, `guardian_links`, `user_roles`, `blocked_times` goes through a trigger that inserts into `audit_log`:

```
audit_log (
  id, table_name, row_id, action ('insert'|'update'|'delete'|'status_change'),
  actor_user_id, before JSONB, after JSONB, occurred_at
)
```

Sensitive columns are redacted in the JSONB snapshots (no full DOB ever existed; emails appear in plaintext — see ADR-0011 for the tradeoff).

### Retention

- Bookings: anonymized 24 months after `ends_at`. The row stays (for stats), but FK columns null out and `display_name` snapshots in audit are replaced with `anonymous`.
- Profiles: on user-initiated delete, soft-delete (`deleted_at`), scrub `display_name`, null `birth_year`, null `guardian_email`. Auth row deleted via Supabase admin API.
- Audit log: kept indefinitely (operationally; legally we can compress >6 months).

### GDPR endpoints

- `GET /api/me/export` (web-admin app, web-public app) — returns JSON of all rows that reference the caller.
- `POST /api/me/delete` — initiates the soft-delete + scrub flow.

(Implementation deferred to late Phase 3; designed for now.)

## 6. Booking domain logic

`packages/domain` exports:

- `time.ts` — IANA-aware conversion between location-local clock time and `Date`. Wraps `date-fns-tz`.
- `availability.ts`:
    - `computeAvailableSlots({ resource, openingHours, blockedTimes, existingBookings, activity, date })` returns an array of `{ startsAt, endsAt }` based on activity duration.
    - `findConflicts(candidateRange, bookings)` for UI hints.
- `booking-rules.ts`:
    - `validateNewBooking(input, context)` — returns `Result<Booking, BookingViolation[]>`.
    - Codified rules (each rule is a function returning `Violation | null`): inOpeningHours, notBlocked, activityAllowedOnResource, withinDurationLimits, withinCutoffForUser.
- `permissions.ts`:
    - `canBook(viewer, target)`, `canCancel(viewer, booking)`, `canOverride(viewer)`, `canManageResources(viewer)`.

All pure functions. All unit-tested with vitest.

## 7. Data flow examples

### Member books a court

```
Mobile UI
  → packages/api hook: useBookResource()
  → supabase.rpc('book_resource', {…})
  → Postgres: book_resource() function
      → validates compatibility, opening hours, blocks, duration, cutoff
      → INSERT into bookings (exclusion constraint = final race guard)
      → trigger writes audit_log
  → returns booking row
  → hook invalidates ['bookings', resourceId, date]
  → UI re-renders with new booking
```

### Guardian books on behalf of minor

```
Same flow but rpc payload includes on_behalf_of_user_id = minorId.
book_resource() additionally:
  → checks guardian_links contains (auth.uid(), minorId)
  → records actor_user_id (the guardian) AND on_behalf_of in the row + audit
```

### Admin overrides

```
Admin uses the web-admin "create booking" form, which calls
book_resource() with an explicit override flag (RLS-checked: admin only).
Bypasses cutoff/role checks but still subject to the exclusion constraint
(no admin can double-book). The audit log records the override.
```

## 8. Mobile navigation structure

Expo Router file-based. Top-level groups:

```
app/
├── (auth)/
│   ├── sign-in.tsx           # Email magic link
│   └── verify.tsx
├── (tabs)/
│   ├── _layout.tsx           # Bottom tab bar
│   ├── home/
│   │   └── index.tsx         # Today's bookings, quick book
│   ├── discover/
│   │   ├── index.tsx         # Activities list
│   │   └── [activityId].tsx  # Resources for activity + date picker → availability
│   ├── bookings/
│   │   ├── index.tsx         # Upcoming & past
│   │   └── [bookingId].tsx   # Detail / cancel
│   └── profile/
│       ├── index.tsx
│       └── guardian.tsx      # If guardian: switch context to minor
└── modals/
    └── book.tsx              # Booking flow modal
```

## 9. Admin dashboard structure

```
src/app/
├── (auth)/sign-in/page.tsx
└── (admin)/
    ├── layout.tsx              # Side nav + top bar
    ├── page.tsx                # Dashboard: today's bookings, upcoming load
    ├── activities/
    │   ├── page.tsx            # List
    │   └── [id]/page.tsx       # Edit + compatibility matrix
    ├── resources/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── bookings/
    │   ├── page.tsx            # Calendar + list with filters
    │   └── [id]/page.tsx       # Detail, cancel/override
    ├── opening-hours/page.tsx
    ├── blocked-times/page.tsx
    ├── users/
    │   ├── page.tsx            # Search; never lists all minors by default
    │   └── [id]/page.tsx       # Detail, role assignment, guardian links
    └── audit/page.tsx          # Filterable log
```

Server Components for reads (fast TTFB, secure default), Server Actions for mutations that wrap RPC calls.

## 10. Future scalability hooks

Things the architecture explicitly accommodates:

- **Payments.** Bookings have `status='pending'` → add a `payments` table, gate `status='confirmed'` behind payment webhook. The exclusion constraint already includes `pending`, so the slot is held during checkout.
- **Memberships.** Add `memberships` table + `membership_id` on `bookings` (nullable). Pricing rules in `packages/domain/pricing.ts`.
- **Push notifications.** Add `device_tokens` table. Edge Function on `booking.status` change sends to FCM/APNs.
- **QR check-in.** `bookings.check_in_token` (short HMAC) + `checked_in_at`. Staff scans → RPC `check_in(token)`.
- **Realtime.** Swap polling for Supabase Realtime channels on `bookings` per resource. Single line change in hooks.
- **Tournaments.** A new `tournaments` table; `bookings.tournament_id` (nullable). Existing constraints continue to hold.
- **Multi-location.** Schema already keyed by `location_id`. UX needs a location switcher; RLS unchanged.
- **AI assistant.** A read-only edge function exposing aggregate availability + activity data. Out of scope.

## 11. Tech stack summary

| Layer | Choice | Why (see DECISIONS.md) |
|---|---|---|
| Package manager | pnpm | Fast, strict, workspace-native |
| Build orchestration | Turborepo | Incremental builds, Vercel-native |
| Mobile | Expo SDK (managed) + React Native | EAS handles native builds; Expo Router matches our file-based instinct |
| Web framework | Next.js 16 (App Router) | Server Components, Cache Components, deployable to Vercel zero-config |
| Web UI | Tailwind + shadcn/ui | Copy-in components, no vendor lock-in |
| Backend | Supabase | Postgres + Auth + RLS in one box; we own the SQL |
| Validation | Zod | Single source of truth for shape across client/server |
| Server state | TanStack Query | Caching, invalidation, optimistic updates |
| Forms | React Hook Form + Zod resolver | Type-safe forms |
| Testing | Vitest (unit) + pgTAP-style SQL tests | Fast unit + DB-level confidence |
| CI | GitHub Actions | Standard |
| Hosting | Vercel (web), EAS (mobile) | Match framework choices |

Strict TypeScript on every package. ESLint with `@typescript-eslint/no-explicit-any: error`. No exceptions.
