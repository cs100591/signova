# Signova iOS App — React Native Plan

## Context
User wants an iOS version of Signova so users can manage contracts on mobile. The existing Next.js backend (Supabase + API routes on Vercel) will be reused — the React Native app is a new frontend that talks to the same APIs.

## Recommended Architecture

```
┌─────────────────┐     ┌──────────────────────────┐
│  React Native    │────▶│  Existing Vercel Backend  │
│  (Expo + RN)     │     │  /api/contracts           │
│                  │     │  /api/upload              │
│  iOS (+ Android  │     │  /api/ai/analyze          │
│  later if needed)│     │  /api/terminal/chat       │
└─────────────────┘     │  /api/stripe/*            │
        │               └──────────────────────────┘
        │
        ▼
  Supabase Auth SDK (direct, no cookies)
  JWT stored in SecureStore
```

## Why React Native + Expo

| Factor | React Native + Expo | Swift | Capacitor |
|--------|-------------------|-------|-----------|
| Reuse TS/JS skills | ✅ | ❌ | ✅ |
| Native feel | ✅ | ✅✅ | ❌ (web wrapper) |
| iOS + Android | ✅ single codebase | ❌ separate | ✅ |
| Push notifications | ✅ | ✅ | ⚠️ limited |
| Camera/file access | ✅ | ✅ | ⚠️ |
| Time to ship | ~4-6 weeks | ~10-12 weeks | ~1-2 weeks |
| App Store approval | ✅ | ✅ | ⚠️ may reject |

## What Can Be Shared

Reusable from web (logic only, not components):

- `lib/plans.ts` — plan definitions, limits
- API response types/interfaces
- Color constants, risk thresholds

NOT reusable (must rebuild):

- All React components (different rendering layer)
- Navigation (React Navigation instead of Next.js router)
- Auth flow (SecureStore instead of cookies)
- File upload (expo-document-picker instead of HTML input)

## Suggested Tech Stack for RN App

| Category | Package |
|----------|---------|
| Framework | Expo SDK 52+ (managed workflow) |
| Navigation | @react-navigation/native (stack + bottom tabs) |
| Auth | @supabase/supabase-js + expo-secure-store |
| UI | NativeWind (Tailwind for RN) or Tamagui |
| File picker | expo-document-picker |
| Camera | expo-camera (for scanning contracts) |
| PDF viewer | react-native-pdf |
| Streaming | fetch + ReadableStream (same as web) |
| Push | expo-notifications |
| Storage | @react-native-async-storage/async-storage |

## Key Screens (matching web)

- **Login** — Supabase magic link / email+password / OAuth
- **Contracts list** — search, filter, status badges
- **Contract detail** — metadata, risk score, findings
- **Upload** — document picker + camera scan
- **AI Terminal** — streaming chat, analysis results, finding cards
- **Settings** — profile, billing (opens Stripe portal in-app browser), workspace

## Auth Strategy for Mobile

```
Web:    Supabase SSR → cookies → middleware validates
Mobile: Supabase JS → JWT → stored in SecureStore → sent as Bearer token
```

Your existing API routes already call `supabase.auth.getUser()` which works with both cookie-based and Bearer token auth — no backend changes needed.

## API Compatibility Check

| Endpoint | Mobile compatible? | Notes |
|----------|-------------------|-------|
| GET/POST /api/contracts | ✅ | JSON in/out |
| DELETE /api/contracts/[id] | ✅ | |
| POST /api/upload | ✅ | multipart/form-data works in RN |
| POST /api/ai/analyze | ✅ | |
| POST /api/terminal/chat | ✅ | Streaming works via fetch |
| POST /api/stripe/checkout | ⚠️ | Returns URL → open in in-app browser |
| POST /api/stripe/portal | ⚠️ | Returns URL → open in in-app browser |
| GET /api/contracts/[id]/download | ✅ | Presigned URL redirect |

No backend changes needed — all APIs are already mobile-ready.

## Project Setup Steps

1. `npx create-expo-app signova-mobile --template blank-typescript`
2. Install deps: supabase-js, react-navigation, nativewind, expo-document-picker, expo-secure-store
3. Set up Supabase auth with SecureStore adapter
4. Build screens: Login → Contracts → Detail → Upload → Terminal → Settings
5. Configure EAS Build for iOS App Store submission
6. Set up expo-notifications for push (contract expiry reminders)

## Suggested File Structure

```
signova-mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── index.tsx       # Contracts list
│   │   ├── upload.tsx
│   │   ├── terminal.tsx
│   │   └── settings.tsx
│   ├── contracts/
│   │   └── [id].tsx        # Contract detail
│   └── _layout.tsx
├── components/
├── lib/
│   ├── supabase.ts         # Supabase client with SecureStore
│   ├── api.ts              # API wrapper (fetch + auth header)
│   └── plans.ts            # Copied from web
├── assets/
└── app.json
```

## What NOT to Do

- ❌ Don't try to share React components between web and RN — they use different rendering
- ❌ Don't use a WebView wrapper (defeats the purpose of native)
- ❌ Don't build Android first — iOS has stricter requirements, better to start there
- ❌ Don't implement OCR on-device — keep using the backend /api/upload route

## This is a separate project

The RN app should live in a separate repo (e.g., `signova-mobile/`), not inside the current Next.js project. It shares the same Supabase project and Vercel API endpoints.

## Summary

Your backend is already 100% mobile-ready — no API changes needed. The work is purely frontend: build React Native screens that call the same endpoints, with Supabase auth via SecureStore instead of cookies. Expo makes iOS deployment straightforward with EAS Build.
