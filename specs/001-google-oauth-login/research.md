# Phase 0 Research: Google OAuth Login

**Feature**: 001-google-oauth-login
**Date**: 2026-05-09
**Status**: Complete

This document resolves the technical unknowns surfaced while filling out the Technical Context for [`plan.md`](./plan.md). Each entry follows the Decision / Rationale / Alternatives format mandated by the speckit plan workflow.

---

## R1. OAuth provider integration mechanism

**Decision**: Use Supabase Auth's first-party Google OAuth provider (`supabase.auth.signInWithOAuth({ provider: 'google' })`) with the implicit/PKCE flow handled by `@supabase/supabase-js`. Configure the Google provider on the Supabase project (Auth → Providers → Google) with the production Google OAuth 2.0 Client ID/Secret.

**Rationale**:
- The codebase already runs all authentication through Supabase Auth (`src/auth/supabaseClient.ts`, `src/auth/useAuth.tsx`), and the backend trusts Supabase-issued JWTs (`supabase/functions/api/lib/auth.ts`). Adding Google through Supabase reuses the existing JWT issuance, session refresh, JWKS verification, and `onAuthStateChange` plumbing untouched.
- Spec assumption: *"The existing authentication service supports Google as an OAuth provider directly, so this feature does not require building or hosting an OAuth integration from scratch."* Supabase satisfies this directly.
- Auto-provisioning of the personal organization (FR-005) is already keyed off the JWT `sub` and `email` in `requireAuth`; using Supabase-issued tokens means the same code path covers Google first sign-ins with zero changes.

**Alternatives considered**:
- **Custom OAuth client (e.g., google-auth-library on the edge function)**: Rejected. Re-implements session, refresh, and JWT issuance that Supabase already provides; doubles the surface area to keep secure; explicitly out of scope per spec assumption.
- **Third-party identity broker (Auth0, Clerk, WorkOS)**: Rejected. Would replace Supabase Auth, which is a much larger migration than this feature warrants. The PRD calls for adding a provider to the existing service, not replacing it.

---

## R2. Account linking strategy when Google email matches existing email/password user

**Decision**: Enable Supabase's **"Allow manual linking"** plus **"Automatic linking on email match for verified emails"** project setting. Rely on Supabase's `auth.identities` table to hold the Google identity row alongside the existing `email` identity row, both pointing at the same `auth.users.id`.

**Rationale**:
- Spec FR-004 + Clarifications 2026-05-09 Q1: linking is silent, no extra password re-auth, and trusts Google's verified-email guarantee. Supabase's automatic identity linking does exactly this when the incoming OAuth identity reports `email_verified: true` and the email matches an existing `auth.users.email` (case-insensitive at the database level).
- Keeps the *application-level* `users` table (Prisma model `User`) unchanged: there is still exactly one row per person, keyed by the same `auth.users.id` (which is the JWT `sub`). No data migration of the existing `users` table is required.
- Edge-case coverage: case-insensitive email match (spec edge case) is handled by Supabase's linking logic and by the existing `users.email UNIQUE` constraint at the database level (Postgres `UNIQUE` is case-sensitive, but `auth.users.email` is normalized to lowercase by GoTrue on insert, so matching is effectively case-insensitive at sign-in time).

**Alternatives considered**:
- **Application-level linking table**: Rejected for this release. Spec FR-006 + FR-011 are satisfied by `auth.identities` without us owning a parallel table. We can layer an app-level `linked_identity` table later if we need richer per-link metadata (e.g., link audit trail), without restructuring `users`.
- **Block linking and force the user to log in with their original method first, then link from settings**: Rejected. Clarifications 2026-05-09 Q1 explicitly chose silent auto-link, and Q2 explicitly excluded in-app linking from this release.
- **Create a separate user record for the Google identity**: Rejected. Directly violates FR-004 (no duplicates) and SC-002 (zero duplicates verified across 10+ accounts).

---

## R3. SSO architecture readiness for additional providers (FR-011, US4)

**Decision**: Treat `auth.identities` (managed by Supabase GoTrue) as the canonical multi-identity store. Document that adding Microsoft / SAML / Okta in the future requires only enabling the provider in Supabase + wiring a button in `LoginPage.tsx` — **no changes to the application `users` table, no changes to the Prisma schema, no changes to `requireAuth`**.

**Rationale**:
- `auth.identities` already supports N providers per user (one row per `(provider, user_id)`). Each identity row carries a `provider`, a `provider_id`, and `identity_data` (JSON) — the exact shape needed for SAML/OIDC/SSO providers.
- The application `users` table is keyed by `auth.users.id`, which is provider-agnostic. Adding a new provider does not change which row a user maps to.
- Independent test from spec US4 ("inspect the user / linked-identity data model and confirm that adding a second provider type would not require a schema change to the user record itself") is satisfied by the data-model.md description of this split.

**Alternatives considered**:
- **Build our own `provider_identities` table**: Rejected for this release per R2; would duplicate `auth.identities` for no Phase 1 benefit. Documented as an opt-in extension if/when we need link audit metadata.
- **Single `auth_provider` column on `users`**: Rejected. Locks us into one provider per user, directly violating FR-011 and US4.

---

## R4. Storage of Google profile data (display name + avatar)

**Decision**:
- Add a nullable `avatar_url VARCHAR(2048)` column to the `users` table via a new Prisma migration.
- On every successful sign-in callback, the frontend reads `session.user.user_metadata.full_name` (or `name`) and `user_metadata.avatar_url` (or `picture`) from the Supabase session and POSTs an idempotent `PUT /api/me/profile` to refresh `users.full_name` and `users.avatar_url` server-side.
- Render the avatar from `users.avatar_url` directly in `<img src>` (browser fetches it from Google's CDN). No server-side proxy, no image caching.

**Rationale**:
- FR-003 + FR-007 + FR-012 require capturing email, display name, avatar URL and refreshing them on each sign-in. The current schema already stores `email` and `full_name`; only `avatar_url` is missing.
- Spec assumption: *"Avatar URLs returned by Google are publicly fetchable from the user's browser; no avatar proxying is in scope."* — Direct browser fetch is the lowest-friction option.
- Clarifications 2026-05-09 Q3: refresh on sign-in only, no render-time refetch and no server-side image caching. A simple per-sign-in profile sync satisfies this without a background worker.

**Alternatives considered**:
- **Use `user_metadata` directly without persisting to `users.avatar_url`**: Rejected. Email/password users (US3) need to render the same avatar field shape, and the app shell (`PpSidebar.tsx`) already reads from app-level user data; mixing sources creates branching display logic.
- **Server-side avatar caching (download bytes, store in object storage)**: Rejected per Clarifications 2026-05-09 Q3.
- **Webhook-driven profile refresh**: Rejected as over-engineered for "refresh on sign-in only".

---

## R5. Avatar fallback for accounts without a Google avatar

**Decision**: Reuse the existing initials-derivation logic in `PpSidebar.tsx` (lines 68-74) as the canonical fallback. When `users.avatar_url` is null/empty, render an initials chip derived from `full_name || email`. Extract this into a small `Avatar` component so the same fallback applies to any future surface that renders a user avatar.

**Rationale**:
- FR-010 requires a deterministic initials fallback derived from the display name. The sidebar already does this from email; we extend it to prefer `full_name` when present.
- Centralizing in one component avoids drift between the sidebar and any future surface (header, comments, mentions).

**Alternatives considered**:
- **Generate a placeholder image server-side (e.g., Gravatar default, generated SVG)**: Rejected. Client-side initials is zero-network, instant, and matches the existing visual style.
- **Use Gravatar as the fallback**: Rejected. Adds a third-party dependency and a cross-origin request for a use case the existing initials chip already covers.

---

## R6. OAuth redirect URL configuration across environments

**Decision**: Configure two Google OAuth redirect URIs in the Google Cloud Console + Supabase Auth → URL Configuration:
1. `https://<project-ref>.supabase.co/auth/v1/callback` — the Supabase-hosted callback (required).
2. `http://localhost:5173` and `https://primepmdev.pages.dev` (and any preview origin matching `https://*.primepmdev.pages.dev`) as **Redirect URLs** (the post-callback destination Supabase will redirect the browser back to).

The frontend calls `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })` so the post-callback redirect always lands back on the same origin the user started from.

**Rationale**:
- Vite dev server runs on `localhost:5173`; production deploys to Cloudflare Pages at `primepmdev.pages.dev` (per `package.json` `deploy:web` script and `wrangler.toml`); preview deploys land on `https://<branch>.primepmdev.pages.dev`. All three need to be allowlisted in Supabase or the post-callback redirect will 400.
- Using `window.location.origin` instead of a hardcoded URL avoids per-environment branching in the frontend code.

**Alternatives considered**:
- **Single hardcoded production redirect URL**: Rejected. Would break local dev and PR previews entirely.
- **Per-environment env var (`VITE_AUTH_REDIRECT_URL`)**: Rejected as unnecessary indirection. `window.location.origin` is correct in 100% of cases for this app and requires no per-environment configuration drift.

---

## R7. Cancelled / denied consent handling (FR-009, edge case)

**Decision**: When the user denies consent or the OAuth provider returns an `access_denied` (or any non-success) `error` query parameter on the post-callback redirect, the frontend detects it (Supabase surfaces it via `onAuthStateChange` as a no-session state plus an error in the URL hash/query), strips the error params from the URL via `history.replaceState`, and renders a non-alarming inline message on the sign-in page: *"Sign-in was not completed. You can try again or use email instead."*

No server-side state is created on this path because Supabase only inserts into `auth.users` after a successful token exchange — so the auto-provisioning flow in `requireAuth` is never triggered, satisfying SC-005 (zero user records on cancel).

**Rationale**:
- The atomicity guarantee (no half-created accounts) comes from Supabase, not from code we write — there is no intermediate state to clean up.
- The UX choice (inline message, not modal/toast) matches the existing error-handling style in `LoginPage.tsx` (the `pp-err` row).

**Alternatives considered**:
- **Redirect to a dedicated `/auth/error` page**: Rejected. Adds a new route for an exceptional path that the existing inline error surface already handles well.
- **Silent redirect back with no message**: Rejected. Users who cancel often don't realize they cancelled; a message helps them reorient. The spec explicitly requires "a non-alarming message indicating sign-in was not completed."

---

## R8. Observability of Google sign-in events (FR-013)

**Decision**: Rely on Supabase Auth's built-in audit log (`auth.audit_log_entries`) which already records `login`, `logout`, `signup`, `user_signedup`, and OAuth provider events with the same shape regardless of provider. Operators inspect adoption and failure rates via the Supabase Dashboard → Auth → Logs view, filtered by `payload.provider = 'google'`.

For application-level signal (e.g., "Google sign-in landed in the dashboard"), add one structured `console.info({ event: 'auth.signin', provider, sub, ts })` log at the point where the frontend first observes a new authenticated session. Cloudflare Pages captures these into the deployment logs.

**Rationale**:
- Spec FR-013 requires Google sign-in events to be observable *"in the same place that email/password sign-in events are observable today"*. Email/password events are already in `auth.audit_log_entries`; Google events land in the same table by default. Zero new infrastructure.
- The frontend `console.info` line gives us a low-cost client-side counter for adoption (SC-006: ≥30% of new sign-ups via Google in 60 days) without standing up an analytics pipeline for this feature alone.

**Alternatives considered**:
- **Add a custom analytics event to a third-party tool (PostHog, Segment, etc.)**: Rejected for this release. No analytics tool is currently wired up and adding one is out of scope.
- **Store sign-in events in our own application table**: Rejected. Duplicates `auth.audit_log_entries`; adds write load to the operational DB.

---

## R9. Personal-organization auto-provisioning trigger

**Decision**: Reuse the existing auto-provisioning logic in `supabase/functions/api/lib/auth.ts` (lines 69-90) **unchanged**. The first authenticated request from a Google-signed-in user will hit `requireAuth`, find no row in `users`, and atomically create the personal organization + `users` row using the JWT's `sub` and `email`.

**Rationale**:
- The existing logic is provider-agnostic — it only reads `payload.sub` and `payload.email`. Both are populated identically by Supabase regardless of whether the user signed in with email/password or Google.
- Spec assumption: *"The current personal-organization auto-provisioning logic … can be triggered by Google first sign-in without functional change."* Confirmed by code inspection.
- Independent test from US1 (personal organization auto-provisioned) is satisfied without code changes to the provisioning path.

**Open follow-up (non-blocking for this feature)**: The current `fullName` on auto-provision is `email.split('@')[0]` — for Google sign-ups we'd prefer the actual Google display name. The `PUT /api/me/profile` from R4 immediately overwrites `users.full_name` with the real Google name on the first authenticated request, so the user-visible result is correct within the same load cycle. The intermediate `fullName = email.split('@')[0]` value is only ever observed if the profile sync request fails; that's acceptable for Phase 1.

**Alternatives considered**:
- **Pass the Google display name into auto-provisioning by reading `user_metadata.full_name` from the JWT inside `requireAuth`**: Deferred. Cleaner but requires touching the provisioning code; the R4 sync covers the user-visible outcome and keeps the provisioning code untouched (lower regression risk for US3).

---

## R10. Testing approach (vitest + integration)

**Decision**:
- **Unit/component tests (vitest + @testing-library/react)**: Add tests for the `Avatar` fallback component, the new "Continue with Google" button rendering on `LoginPage`, the cancelled-consent error handling on the sign-in page, and the profile-sync hook.
- **Contract test for `PUT /api/me/profile`**: Add a Deno test for the new edge-function route (validates auth required, validates payload shape, validates that `users.full_name` and `users.avatar_url` are updated for the authenticated `sub`).
- **Manual integration test in Supabase staging**: A live Google sign-in against a Supabase staging project with the Google provider configured, executed end-to-end against three accounts: (a) brand-new Google email, (b) Google email matching an existing email/password user, (c) consent denial. Documented as a checklist in `quickstart.md`.

**Rationale**:
- The repo already runs vitest with `@testing-library/react` (per `package.json` and `vitest.config.ts`); reusing it for the new UI is the lowest-friction option.
- A genuine OAuth round-trip cannot be exercised in unit tests (the redirect leaves the browser context). The right level of automated coverage for the round-trip itself is contract-test the server endpoints we own + manually verify the live flow in staging. Adding a full Playwright/Cypress harness solely to script Google's consent screen is disproportionate to the risk for Phase 1.

**Alternatives considered**:
- **Mock the entire Supabase auth client and assert call sequences**: Useful for unit-level coverage of the button wiring and is included above; insufficient on its own because it doesn't exercise real provider behavior.
- **Stand up a full Playwright + headless-browser + Google test-account flow in CI**: Rejected for Phase 1 as disproportionate to the risk. Reconsider when/if we add a second SSO provider and need to regression-test the linking behavior across providers.
