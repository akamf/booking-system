# Implementation Tasks

One commit per task. Conventional commit messages. Flip `[ ]` to `[x]` only after the commit lands. Don't skip ahead.

## Phase 0 — Foundation

- [x] **T01**. Add planning docs (`PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TASKS.md`).
    - Commit: `docs: add planning documents (architecture, decisions, tasks)`
- [x] **T02**. Initialize git ignores, editorconfig, root `package.json`, `pnpm-workspace.yaml`, `turbo.json`.
    - Files: `.gitignore`, `.editorconfig`, `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`
    - Commit: `chore: initialize monorepo with pnpm and turborepo`
- [x] **T03**. Add `packages/config` with `tsconfig.base.json`, `eslint.config.mjs`, `prettier.config.cjs`, `tailwind.preset.ts`, and a `tokens.ts` (color/spacing/type design tokens).
    - Commit: `feat(config): add shared tsconfig, eslint, prettier, tailwind, and design tokens`
- [x] **T04**. Add `packages/types` with `package.json`, `tsconfig.json` extending base, and a placeholder Zod schema (`profile.ts`) to verify wiring.
    - Commit: `feat(types): scaffold shared Zod contracts package`
- [x] **T05**. Add `packages/domain` with `package.json`, `tsconfig.json`, and `time.ts` (a thin wrapper around `date-fns-tz` with a `formatInLocationTime` helper) + a vitest test.
    - Commit: `feat(domain): scaffold pure domain package with time helpers and tests`
- [x] **T06**. Add `packages/api` and `packages/ui` skeletons (`package.json`, `tsconfig.json`, `index.ts` empty exports). Confirms workspace graph resolves.
    - Commit: `feat: scaffold api and ui packages`
- [x] **T07**. Add root `README.md` (one-page: prerequisites, install, dev) and a `scripts/setup.sh` for first-time install.
    - Commit: `docs: add root README and setup script`
- [x] **T08**. Add GitHub Actions CI workflow: install, typecheck, lint, test on all packages.
    - File: `.github/workflows/ci.yml`
    - Commit: `ci: add typecheck, lint, and test workflow`

## Phase 1 — Database & domain core

- [x] **T09**. Initialize Supabase locally (`supabase init`) and add `supabase/config.toml`. Add `supabase/migrations/0001_extensions.sql` enabling `btree_gist` and `pgcrypto`.
    - Commit: `feat(db): initialize supabase project with required extensions`
- [x] **T10**. Migration `0002_organizations_locations.sql`: `organizations`, `locations` (with `timezone` IANA text), with RLS scaffolding (default deny).
    - Commit: `feat(db): add organizations and locations tables`
- [x] **T11**. Migration `0003_roles_profiles.sql`: `profiles` (1:1 to `auth.users`, `display_name`, `birth_year`, `guardian_email`, `locale`, `deleted_at`), `roles` lookup, `user_roles`. Insert seed roles.
    - Commit: `feat(db): add profiles, roles, and user_roles tables`
- [x] **T12**. Migration `0004_guardian_links.sql`: `guardian_links` (composite PK, `verified_at`).
    - Commit: `feat(db): add guardian_links table for multi-guardian relationships`
- [x] **T13**. Migration `0005_activities_resources.sql`: `activities`, `resource_types`, `resources`, `activity_resource_compatibility`.
    - Commit: `feat(db): add activities, resources, and compatibility tables`
- [x] **T14**. Migration `0006_opening_hours_blocked_times.sql`: `opening_hours` (weekday + time), `blocked_times` (range, location-or-resource).
    - Commit: `feat(db): add opening_hours and blocked_times tables`
- [ ] **T15**. Migration `0007_bookings.sql`: `booking_status` enum; `bookings` table; the `EXCLUDE USING gist` constraint; `booking_participants` (composite PK).
    - Commit: `feat(db): add bookings with exclusion constraint preventing double-booking`
- [ ] **T16**. Migration `0008_audit_log.sql`: `audit_log` table; a generic trigger function `tg_audit()`; attach triggers to `bookings`, `profiles`, `guardian_links`, `user_roles`, `blocked_times`, `opening_hours`, `activities`, `resources`.
    - Commit: `feat(db): add audit_log table and triggers on mutating tables`
- [ ] **T17**. Migration `0009_rls_policies.sql`: enable RLS on all app tables; add SELECT/INSERT/UPDATE/DELETE policies per ARCHITECTURE.md §4. Deny direct writes to `bookings`.
    - Commit: `feat(db): add row level security policies for all app tables`
- [ ] **T18**. Migration `0010_book_resource_rpc.sql`: `book_resource()` function (SECURITY DEFINER); validates compatibility, opening hours, blocked times, duration, cutoff, on-behalf-of; INSERTs; surfaces typed errors via `raise exception using errcode + message + hint`.
    - Commit: `feat(db): add book_resource RPC with rule enforcement and typed errors`
- [ ] **T19**. Migration `0011_cancel_and_override_rpcs.sql`: `cancel_booking()`, `override_booking()` (admin-only).
    - Commit: `feat(db): add cancel_booking and override_booking RPCs`
- [ ] **T20**. SQL test suite (`supabase/tests/bookings.sql`): inserting overlap fails; cancelling frees the slot; activity-resource mismatch is rejected; booking outside opening hours is rejected. Use `pgtap` or a simple `do $$ begin … exception when … then … end $$;` harness.
    - Commit: `test(db): add SQL tests for booking constraints and RPC errors`
- [ ] **T21**. Seed file `supabase/seed.sql`: one organization, one location with `Europe/Stockholm`, basic opening hours, several activities (volleyball, badminton, pickleball, basketball), resources, an admin profile.
    - Commit: `feat(db): add seed data for local development`
- [ ] **T22**. Generate types: add `pnpm db:types` script that runs `supabase gen types typescript --local > packages/types/src/db.generated.ts`. Run it and commit the generated file.
    - Commit: `chore(types): generate database types from local supabase schema`
- [ ] **T23**. `packages/types`: hand-written Zod schemas mirroring DB row shapes for `Profile`, `Activity`, `Resource`, `Booking`, `GuardianLink`. `index.ts` re-exports schemas and inferred types.
    - Commit: `feat(types): add zod schemas for core domain entities`
- [ ] **T24**. `packages/domain/availability.ts`: pure `computeAvailableSlots()` and `findConflicts()` with vitest tests covering opening hours, blocked times, existing bookings, activity duration.
    - Commit: `feat(domain): add availability slot computation with tests`
- [ ] **T25**. `packages/domain/booking-rules.ts`: rule functions returning `Violation | null` and `validateNewBooking()` that aggregates. Vitest covers each rule.
    - Commit: `feat(domain): add booking rule validators with tests`
- [ ] **T26**. `packages/domain/permissions.ts`: `canBook`, `canCancel`, `canOverride`, `canManageResources`, `canActOnBehalfOf`. Vitest covers each.
    - Commit: `feat(domain): add permission predicates with tests`

## Phase 2 — API package

- [ ] **T27**. `packages/api/client/web.ts` and `client/mobile.ts`: typed Supabase client factories. Web uses `@supabase/ssr` (cookie-based); mobile uses `@supabase/supabase-js` with `expo-secure-store` adapter.
    - Commit: `feat(api): add typed supabase client factories for web and mobile`
- [ ] **T28**. `packages/api/hooks/`: TanStack Query hooks for `useActivities`, `useResources`, `useAvailability`, `useBookings`, `useProfile`. Each hook is typed with Zod-parsed responses.
    - Commit: `feat(api): add typed react-query hooks for read endpoints`
- [ ] **T29**. `packages/api/mutations/`: `useBookResource`, `useCancelBooking`, `useOverrideBooking`. Each maps known RPC error codes to typed client errors and triggers query invalidation.
    - Commit: `feat(api): add typed mutations for booking RPCs with error mapping`

## Phase 3 — Web admin

- [ ] **T30**. `apps/web-admin`: `next@16` install, App Router, Tailwind, shadcn/ui init, base layout, ESLint extending shared config.
    - Commit: `feat(web-admin): scaffold next.js admin app with tailwind and shadcn`
- [ ] **T31**. Auth: `(auth)/sign-in/page.tsx` with magic-link form; `middleware.ts` (Vercel Routing Middleware, Node runtime per ADR — uses `@supabase/ssr` to refresh session).
    - Commit: `feat(web-admin): add magic-link sign-in and session middleware`
- [ ] **T32**. Admin shell: `(admin)/layout.tsx` with side nav, top bar, role-gated routes (non-admins bounced to a "no access" page).
    - Commit: `feat(web-admin): add admin layout with role-gated navigation`
- [ ] **T33**. Dashboard page: today's bookings count, upcoming load chart placeholder, recent audit entries.
    - Commit: `feat(web-admin): add dashboard page with bookings overview`
- [ ] **T34**. Activities: list + create + edit pages with shadcn forms + Zod validation + Server Actions wrapping RPCs (admin-only).
    - Commit: `feat(web-admin): add activities management screens`
- [ ] **T35**. Resources: list + create + edit pages, including the activity compatibility matrix editor.
    - Commit: `feat(web-admin): add resources management with compatibility matrix`
- [ ] **T36**. Opening hours + blocked times management pages.
    - Commit: `feat(web-admin): add opening hours and blocked times management`
- [ ] **T37**. Bookings calendar view + list filter + detail page with cancel/override actions.
    - Commit: `feat(web-admin): add bookings calendar, list, and detail screens`
- [ ] **T38**. Users search page (search-only by display name or email; never lists all minors without a filter) + detail page with role assignment and guardian-link management.
    - Commit: `feat(web-admin): add user search and role/guardian management`
- [ ] **T39**. Audit log viewer with table-name and date-range filters; row diff shown as before/after JSON.
    - Commit: `feat(web-admin): add audit log viewer`

## Phase 4 — Mobile

- [ ] **T40**. `apps/mobile`: Expo SDK 53 init with TypeScript template; Expo Router; install `@booking/api`, `@booking/types`, `@booking/domain`; configure strict tsconfig.
    - Commit: `feat(mobile): scaffold expo app with strict typescript and expo router`
- [ ] **T41**. Auth: `(auth)/sign-in.tsx` with email magic-link entry; `(auth)/verify.tsx` deep-link handler.
    - Commit: `feat(mobile): add magic-link sign-in and deep-link verification`
- [ ] **T42**. Tabs layout: `(tabs)/_layout.tsx` with Home, Discover, Bookings, Profile tabs.
    - Commit: `feat(mobile): add bottom-tab navigation`
- [ ] **T43**. Home tab: today's bookings, "Book again" quick actions.
    - Commit: `feat(mobile): add home tab with today's bookings`
- [ ] **T44**. Discover tab: activities list → activity detail with date picker → resources with availability slots.
    - Commit: `feat(mobile): add discover and availability screens`
- [ ] **T45**. Booking modal: slot confirmation, on-behalf-of selector for guardians, submit → success / error mapping.
    - Commit: `feat(mobile): add booking flow with guardian on-behalf-of`
- [ ] **T46**. Bookings tab: upcoming + past sections; detail screen with cancel action.
    - Commit: `feat(mobile): add bookings list and cancel flow`
- [ ] **T47**. Profile tab: display name + birth year edit, locale, guardian-linked minors switcher.
    - Commit: `feat(mobile): add profile screen with guardian context switcher`

## Phase 5 — Hardening & docs

- [ ] **T48**. README per app: `apps/web-admin/README.md`, `apps/mobile/README.md`. Local dev steps end-to-end.
    - Commit: `docs: add per-app readmes`
- [ ] **T49**. Verification pass: `pnpm typecheck && pnpm lint && pnpm test` all green. Manual smoke notes in `docs/smoke.md`.
    - Commit: `docs: add manual smoke test checklist`
- [ ] **T50**. Add `apps/web-public` scaffold (Next.js shell that says "coming soon"). Verifies the workspace graph and Vercel build wiring.
    - Commit: `feat(web-public): add scaffold for future public site`

## Phase 6 — Wrap

- [ ] **T51**. Update `DECISIONS.md` with any ADRs added during implementation; final pass on `ARCHITECTURE.md`.
    - Commit: `docs: finalize architecture and decisions`
- [ ] **T52**. Remove `PLAN.md`. Verify all tasks above are `[x]`.
    - Commit: `chore: complete implementation plan`
