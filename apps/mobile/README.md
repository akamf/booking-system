# @booking/mobile

Expo + React Native mobile client for Sportshallen.

## Prerequisites

- Node 24 (root README's prerequisites)
- Xcode (for iOS simulator) or Android Studio (for Android emulator)
- Expo Go on your physical device, if you'd rather hit a real phone
- Local Supabase running (`pnpm db:start` from repo root)

## Local dev

```bash
# from repo root
pnpm db:start

# from anywhere
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
EXPO_PUBLIC_SUPABASE_ANON_KEY=$(grep SUPABASE_ANON_KEY supabase/.env 2>/dev/null | cut -d= -f2) \
pnpm dev --filter @booking/mobile
```

Press `i` for iOS, `a` for Android. For physical devices on the same network, replace `127.0.0.1` with your machine's LAN IP.

Sign in with `admin@sportshallen.local` to use the seed-admin password fast path.

## Stack

- Expo SDK 52 + React Native 0.76 (new architecture enabled)
- Expo Router (file-based)
- TypeScript strict (extends `@booking/config/tsconfig/expo`)
- React Query for server state
- `@booking/api` for typed Supabase clients
- `@booking/domain` for client-side availability + rule preview

## Layout

```
app/                    Expo Router routes
├── _layout.tsx         Providers + safe area + status bar
├── index.tsx           Session-aware redirect
├── (auth)/             Sign-in stack
├── (tabs)/             Home / Discover / Bookings / Profile
└── modals/book.tsx     Booking confirmation modal

src/
├── components/         App-level components (RN-only)
├── lib/                Supabase client, env, colors, hooks
└── features/           Feature folders (currently empty — screens are simple
                        enough to live inside app/ in v1)
```

## Builds

EAS isn't configured yet — that's a v1.1 step. The Expo Go workflow is sufficient for development. When we're ready: `eas build --profile preview --platform ios`.
