# @booking/web-admin

Next.js 15 admin dashboard for the Sportshallen booking platform.

## Prerequisites

Repo-level prerequisites in the root README. To run this app you additionally need the local Supabase stack up.

## Local dev

```bash
# from repo root
pnpm db:start                            # starts local Supabase if not running
cp apps/web-admin/.env.example apps/web-admin/.env

# from anywhere
pnpm dev --filter @booking/web-admin
```

Then open <http://localhost:3001>.

Sign in as `admin@sportshallen.local` (password sign-in detected automatically because the email ends with `@sportshallen.local`). Magic-link is used for any other email.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict (extends `@booking/config/tsconfig/next`)
- Tailwind v3 with `@booking/config/tailwind` preset
- `@supabase/ssr` for auth + RLS-aware reads
- React Query for client mutations
- Server Actions wrapping RPCs for booking writes

## Layout

```
src/
├── app/
│   ├── sign-in/        Magic-link page
│   ├── auth/callback/  Code-exchange route
│   ├── no-access/      Shown to authenticated non-staff users
│   └── (admin)/        Role-gated layout (admin / staff)
│       ├── dashboard/
│       ├── activities/
│       ├── resources/
│       ├── opening-hours/
│       ├── blocked-times/
│       ├── bookings/
│       ├── users/
│       └── audit/
├── features/          Feature folders with Server Actions
├── components/        App-level shared components
├── lib/               Supabase clients, env, session, typed-table helper
└── middleware.ts      Session refresh + auth gate
```

## Notes

- Booking writes route through `book_resource` / `cancel_booking` /
  `override_book_resource` RPCs. Direct INSERT/UPDATE on `bookings` is
  RLS-denied — see `DECISIONS.md` ADR-0006.
- Audit log is RLS-restricted to staff/admin; the layout's role gate is
  the only required guard for the audit page.
- `lib/typed-table.ts` localizes a TS-narrowing workaround for the
  Supabase client; rationale in the file's comment.
