# Quickstart: Google OAuth Login

**Feature**: 001-google-oauth-login
**Audience**: Engineer about to implement, review, or QA this feature.
**Estimated time**: 30 minutes (provider config) + ~2 hours (implementation) + 15 minutes (manual QA).

This is the operational on-ramp. Read this first. It links into [`spec.md`](./spec.md), [`plan.md`](./plan.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), and [`contracts/`](./contracts/).

---

## 1. One-time provider configuration

These steps are performed **once per Supabase environment** (staging + production). They are not part of code review.

### 1.1 Google Cloud Console

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an OAuth 2.0 Client ID of type **Web application**.
3. **Authorized JavaScript origins**: leave empty (Supabase handles the redirect).
4. **Authorized redirect URIs**: add `https://<project-ref>.supabase.co/auth/v1/callback` for each Supabase environment (staging + production).
5. Capture the generated **Client ID** and **Client secret**.

### 1.2 Supabase project

For each environment (staging + production):

1. Open Supabase Dashboard → **Authentication → Providers → Google**.
   - Toggle **Enabled** = on.
   - Paste the Client ID and Client Secret from 1.1.
   - **Skip nonce check**: leave default (off).
2. Open **Authentication → URL Configuration**.
   - **Site URL**: production origin (e.g. `https://primepmdev.pages.dev`).
   - **Redirect URLs** (additional): add
     - `http://localhost:5173`
     - `https://primepmdev.pages.dev`
     - `https://*.primepmdev.pages.dev` (wildcard for PR previews)
3. Open **Authentication → Settings**.
   - Enable **"Allow manual linking"**.
   - Enable **"Automatic linking on email match for verified emails"**.
   *(These are the toggles that satisfy FR-004 + the silent-link clarification from 2026-05-09.)*

> Verification: from the dashboard, click "Send a test sign-in" → "Continue with Google" and confirm a session is issued.

---

## 2. Implementation map

What lives where, in execution order.

| Step | File | Change |
|---|---|---|
| 2.1 | `prisma/schema.prisma` | Add `avatarUrl String? @map("avatar_url") @db.VarChar(2048)` to model `User`. |
| 2.2 | `prisma/migrations/<ts>_add_avatar_url_to_users/migration.sql` | `ALTER TABLE users ADD COLUMN avatar_url VARCHAR(2048);` |
| 2.3 | `supabase/functions/api/routes/me.ts` (new) | `GET /api/me` and `PUT /api/me/profile` per [`contracts/me-profile.openapi.yaml`](./contracts/me-profile.openapi.yaml). Use existing `requireAuth`. |
| 2.4 | `supabase/functions/api/index.ts` | Register the new `meRoutes` router under `/api`. |
| 2.5 | `src/auth/useAuth.tsx` | Add `signInWithGoogle()` to context. Add post-callback URL-error handling (C2). Add profile-sync on `SIGNED_IN` (C3). |
| 2.6 | `src/auth/LoginPage.tsx` | Wire the existing Google `<button>` to `signInWithGoogle()` (replaces the `ssoPlaceholder` call). Render the URL-error message in `pp-err`. Leave Microsoft as a placeholder for now. |
| 2.7 | `src/components/Avatar.tsx` (new) | Per [`contracts/auth-ui.contract.md`](./contracts/auth-ui.contract.md) C4. |
| 2.8 | `src/components/layout/PpSidebar.tsx` | Replace inline initials logic with `<Avatar url={profile.avatarUrl} name={profile.fullName} email={session.user.email} />`. |
| 2.9 | `src/auth/__tests__/*.test.tsx` (new) | Tests per C1, C2, C3, C5. |
| 2.10 | `src/components/__tests__/Avatar.test.tsx` (new) | Tests per C4. |
| 2.11 | `supabase/functions/api/routes/__tests__/me.test.ts` (new) | Deno contract test per `me-profile.openapi.yaml`. |

> Detailed task breakdown (with [P]arallel markers) is produced by `/speckit.tasks` from this plan.

---

## 3. Local development loop

```bash
# Once: install deps + generate Prisma client
npm install
npm run db:generate

# Apply the new migration to your local Supabase Postgres
npm run db:migrate:dev

# Start the Vite dev server (frontend, port 5173)
npm run dev

# In a second terminal, deploy edge function changes to your Supabase staging project
npm run deploy:fn
```

To exercise the Google flow locally you must point the Vite dev server at a Supabase project that has Google configured per §1. Set `.env.local`:

```
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-key>"
VITE_API_URL="https://<project-ref>.supabase.co/functions/v1"
```

---

## 4. Automated test suite

```bash
npm run test          # watch mode
npm run test:run      # one-shot, what CI runs
npm run test:coverage # with V8 coverage report
```

Add the new test files listed in §2.9 / §2.10 / §2.11. They MUST pass before the PR is merged.

---

## 5. Manual QA checklist (live Supabase staging)

These are the user stories from `spec.md` exercised end-to-end against a real Supabase staging project. Execute each before requesting review.

### US1 — New user signs up with Google in one click (P1)

- [ ] Open the staging app in a fresh incognito browser.
- [ ] Click **Continue with Google** → pick a Google account that has never signed in to primepm before → approve consent.
- [ ] Land on the authenticated dashboard.
- [ ] App shell shows the Google display name and avatar (not initials).
- [ ] In Supabase Dashboard → Authentication → Users, confirm exactly one new user with the Google email.
- [ ] In `public.users`, confirm exactly one row with the matching `id` and a non-null `avatar_url`.
- [ ] In `public.organizations`, confirm a personal organization was auto-provisioned and is referenced by `users.organization_id`.
- [ ] Reload the page → still signed in.

### US2 — Existing email/password user links Google silently (P2)

- [ ] Pre-create a primepm account via the email/password sign-up flow using `linkme@<your-domain>`.
- [ ] Sign out.
- [ ] Click **Continue with Google** with the *same* email address.
- [ ] Land on the authenticated dashboard with the **same** organization and projects visible.
- [ ] In Supabase Dashboard → Authentication → Users, the user has **both** an email identity row and a google identity row, sharing the same `user_id`.
- [ ] In `public.users`, exactly one row exists for `linkme@<your-domain>`.
- [ ] Sign out, sign in with the original email/password — lands in the same account.

### US3 — Email/password regression (P2)

- [ ] Take a pre-feature screenshot of the sign-in form (or compare to `main`).
- [ ] Sign in with email/password — flow, validation messages, post-sign-in route are unchanged.
- [ ] Sign up with email/password — confirmation email path unchanged.

### US4 — SSO architecture readiness (P3)

- [ ] Open the data-model description (`data-model.md` §3 "auth.identities") with a reviewer.
- [ ] Confirm by inspection that adding a new provider (e.g. `azure`) inserts new rows in `auth.identities` against existing `auth.users.id` values, with no schema change to `auth.users` or `public.users`.

### Edge cases

- [ ] **Cancel consent**: click Continue with Google → cancel/deny on Google's screen → land back on the sign-in page with the message *"Sign-in was not completed."* and **zero new rows** in either `auth.users` or `public.users`.
- [ ] **No Google avatar**: sign in with a Google account that has no profile photo → app shell renders initials chip.
- [ ] **Email casing mismatch**: pre-create email/password account `Foo@bar.com` → sign in with Google for `foo@bar.com` → linked to the same account, no duplicate.
- [ ] **Updated Google name/avatar**: change name/photo in Google profile → sign in again → app shell reflects the new values within one reload.
- [ ] **OAuth callback failure**: in DevTools, manually navigate to a callback URL with `?error=server_error` → land on sign-in page with a non-alarming message; URL is cleaned up.
- [ ] **In-app linking**: confirm there is **no** "Link Google" button anywhere inside the authenticated app (out of scope per Clarifications 2026-05-09 Q2).

### Observability

- [ ] In Supabase Dashboard → Authentication → Logs, filter by provider `google` and confirm the test sign-ins appear with expected `event` types (`login`, `user_signedup`).
- [ ] In Cloudflare Pages → deployment logs, confirm the `auth.signin` console.info line is present for the test sign-ins.

---

## 6. Rollback plan

If a critical defect is found post-deploy:

1. **Frontend rollback**: re-deploy the previous Cloudflare Pages build. Restores the placeholder Google button instantly.
2. **Provider rollback**: in Supabase Dashboard → Authentication → Providers → Google, toggle **Enabled** = off. Existing linked identities remain in `auth.identities` but cannot be used for new sign-ins; affected users fall back to email/password.
3. **Schema rollback**: the only schema change is the additive nullable `avatar_url` column on `users`. No rollback is required — the column is harmless to leave in place. If we genuinely need to remove it, a follow-up migration can `ALTER TABLE users DROP COLUMN avatar_url`.

No data loss occurs at any step.
