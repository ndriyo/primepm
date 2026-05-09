# Frontend Auth UI Contract — Google Sign-In Surface

**Feature**: 001-google-oauth-login
**Surface**: `src/auth/LoginPage.tsx`, `src/auth/useAuth.tsx`, plus a new `src/components/Avatar.tsx`
**Status**: Phase 1 — Design

This document captures the *behavioral contract* for the new Google sign-in UI surface, written so it can be verified by automated component tests (vitest + @testing-library/react) and by the manual checklist in `quickstart.md`.

---

## C1. "Continue with Google" button

**Where**: Rendered inside the `pp-sso-row` of `LoginPage` for **both** `signin` and `signup` modes (FR-001).

**Visible behavior**:
- Button label: `"Continue with Google"` (or short label `"Google"` next to the Google G-mark — current visual scaffolding is acceptable).
- Disabled while a Google OAuth request is in flight (visually equivalent to the existing `pp-btn-submit` busy state).
- Re-enabled on `onAuthStateChange` arrival OR on detection of an OAuth error in the post-callback URL.

**Click handler contract**:
- Calls `useAuth().signInWithGoogle()`.
- `signInWithGoogle()` MUST internally call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
- On error from Supabase (network, misconfiguration), surfaces the error message via the same `pp-err` row used by email/password sign-in (FR-008 — non-regression).

**Test plan (vitest)**:
1. Renders the button on both `?tab=signin` and `?tab=signup` URLs.
2. Click triggers `supabase.auth.signInWithOAuth` with the expected arguments.
3. Click while busy is a no-op.
4. Mocked Supabase error renders inside `pp-err`.

---

## C2. Post-callback redirect handling

**Where**: `useAuth` provider, `useEffect` initialization.

**Behavior**:
- On mount, calls `supabase.auth.getSession()` (existing behavior, unchanged).
- Subscribes to `supabase.auth.onAuthStateChange` (existing behavior, unchanged).
- **New**: If the URL contains `?error=` or `#error=` query/hash parameters at mount time, parses the error, stores it in a transient state (so `LoginPage` can render it), and calls `history.replaceState({}, '', window.location.pathname)` to strip the params. (Edge case; FR-009.)

**Test plan (vitest)**:
1. Mounting with `?error=access_denied&error_description=...` strips the URL and exposes a friendly error string.
2. Mounting with no error params is a no-op (no spurious history mutation).

---

## C3. Profile sync after successful sign-in

**Where**: `useAuth` provider, `onAuthStateChange` handler.

**Behavior**:
- On a `SIGNED_IN` event with a non-null session, the provider reads:
  - `session.user.user_metadata.full_name` (Google) or falls back to `session.user.user_metadata.name`, then to `session.user.email.split('@')[0]`.
  - `session.user.user_metadata.avatar_url` (Google) or falls back to `session.user.user_metadata.picture`, then to `null`.
- POSTs `PUT /api/me/profile` with `{ fullName, avatarUrl }` (R4).
- The POST is **fire-and-forget for UI rendering** — i.e. the app shell renders immediately from `session.user.user_metadata` while the server-side write happens in the background.
- A failed POST does NOT block sign-in. It is logged via `console.warn`. The next successful sign-in retries the sync.

**Idempotency**: Re-entering the sign-in flow with the same Google account from the same browser triggers the sync again with the same payload — server-side `PUT` is idempotent.

**Test plan (vitest)**:
1. SIGNED_IN with full Google metadata → fetch called with `PUT /api/me/profile` and the expected body.
2. SIGNED_IN with no `avatar_url` → body has `avatarUrl: null`.
3. Server responds 500 → `console.warn` called, no UI error surfaced.
4. SIGNED_OUT event → no sync call.

---

## C4. App shell avatar rendering

**Where**: New `src/components/Avatar.tsx` consumed by `src/components/layout/PpSidebar.tsx` (and any future surface).

**Props**:
```ts
interface AvatarProps {
  url: string | null | undefined;
  name: string | null | undefined;
  email: string | null | undefined;
  size?: number; // default 32
}
```

**Behavior** (FR-007, FR-010, R5):
- If `url` is a non-empty string → render `<img src={url} alt={name ?? email ?? 'User'} />` with `referrerPolicy="no-referrer"` and `loading="lazy"`.
- If `url` is empty/null → render a div containing the initials chip. Initials derived as:
  1. If `name` has at least one whitespace-separated token, use the first letter of the first two tokens, uppercased.
  2. Else if `name` is one token, use its first letter, uppercased.
  3. Else fall back to the existing `email.split('@')[0]` initials logic (unchanged from `PpSidebar.tsx:68-74`).
  4. If everything is missing, render `"U"`.
- The image element MUST also handle `onError` by switching to the initials fallback (covers the case where Google's avatar URL 404s after a profile change).

**Test plan (vitest)**:
1. With `url` present → renders `<img>` with the correct src/alt.
2. With `url` empty → renders initials from `name`.
3. With both missing → falls back to email initials.
4. With `<img>` `onError` fired → re-renders as initials.

---

## C5. Email/password regression contract (FR-008, US3)

The following MUST remain identically observable before and after this feature ships. Tests assert structural equality, not pixel equality.

| Behavior | Pre-feature | Post-feature |
|---|---|---|
| `<form>` element on `LoginPage` | present | present |
| Email + password fields with current `name`/`autoComplete` attrs | present | present |
| "Forgot?" link in signin mode | present | present |
| `pp-btn-submit` text in signin mode | "Sign in" | "Sign in" |
| `pp-btn-submit` text in signup mode | "Create account" | "Create account" |
| `signIn(email, password)` returns `{ error?: string }` | yes | yes |
| `signUp(email, password)` returns `{ error?: string }` | yes | yes |
| Session arriving from email/password sign-in lands on the same post-sign-in route | yes | yes |

**Test plan (vitest)**: Snapshot-style test of the rendered form structure (not the visual pixels) gated on the absence of the new Google-specific elements. A separate snapshot covers the full layout including the Google button.
