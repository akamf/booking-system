# Manual smoke checklist

Run after every meaningful change to the booking domain or RLS policies.
Automated checks (`pnpm typecheck`, `pnpm test`, `pnpm db:test`) cover the
machinery; this list covers the user-visible behavior.

## Setup

```bash
pnpm db:reset       # apply migrations + seed
pnpm dev --filter @booking/web-admin
```

Sign in as `admin@sportshallen.local` (password fast path).

## Admin

- [ ] **Dashboard** loads with today + week counts (0 on fresh seed).
- [ ] **Activities → New**: create an activity with all fields. List shows it
      with its color dot.
- [ ] **Activities → Edit**: change description, save, list reflects.
- [ ] **Activities → Archive**: row disappears from list. Inspect DB:
      `select archived_at from public.activities where slug = 'x';` should
      have a timestamp (not deleted).
- [ ] **Resources → New**: create. **Edit**: open the compatibility matrix,
      toggle an activity, save. DB:
      `select count(*) from public.activity_resource_compatibility where
      resource_id = '…';` matches.
- [ ] **Opening hours**: add Mon 09:00–22:00 window. Remove a window.
- [ ] **Blocked times**: add an entire-location block for tomorrow.
- [ ] **Bookings**:
  - Try inserting a booking that overlaps a confirmed one (via Supabase
    Studio → SQL editor):
    ```sql
    insert into public.bookings (resource_id, activity_id,
      booked_by_user_id, starts_at, ends_at)
    values ('<resource>', '<activity>', '<user>',
            '2099-01-01 10:00+00', '2099-01-01 11:00+00');
    ```
    Then run again with `10:30+00 / 11:30+00` — should fail with
    `exclusion_violation`.
- [ ] **Users → Search "Site"**: finds the seed admin. Detail page shows
      roles (admin + staff) with Revoke buttons.
- [ ] **Audit**: open. Sort/filter by table. Expand an entry — before/after
      JSON shown side-by-side.

## Mobile (in Expo Go on simulator)

- [ ] **Sign-in**: enter `admin@sportshallen.local`, tap Continue. Lands on
      Home tab.
- [ ] **Home**: today's bookings list (or "No bookings today.").
- [ ] **Discover**: tap an activity → resources show with available slots.
- [ ] **Slot tap → Booking modal**: confirm. Lands on Bookings tab with the
      new row.
- [ ] **Bookings → Cancel**: confirmed booking → tap Cancel → row updates
      to "cancelled".
- [ ] **Profile**: edit display name, save. Toast / saved indicator. Sign out.

## Privacy / youth rules

- [ ] Create a profile with `birth_year = 2018` and no roles. Sign in as them.
      Try to book a `volleyball` slot (self_book_min_age 13) — should be
      rejected with `GUARDIAN_REQUIRED`.
- [ ] As an admin, link the youth to a guardian via Users → Detail → "Link
      guardian".
- [ ] As that guardian, on mobile, book a slot with the minor in the
      "Book for" pill — should succeed.

## RLS spot-checks

- [ ] Sign in as a non-staff user. `select * from public.activities` works.
      `insert into public.bookings (…)` is denied (RLS).
- [ ] As a non-staff user, calling `select * from public.audit_log` returns
      zero rows (RLS).

If any check fails, file an issue, link it from the relevant commit, and
prefer fixing the underlying rule (likely in SQL) over patching the UI.
