---

description: "Task list for feature 001-google-oauth-login"
---

# Tasks: Google OAuth Login

**Input**: Design documents from `/specs/001-google-oauth-login/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — research.md §R10 explicitly mandates vitest UI/component tests, a Deno contract test for the new edge route, and a manual end-to-end checklist in quickstart.md.

**Organization**: Tasks are grouped by user story (US1–US4 from spec.md) so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files, no dependency on incomplete tasks — can run in parallel
- **[Story]**: Maps a task to a spec.md user story (US1, US2, US3, US4)
- File paths are exact and follow plan.md §"Project Structure"

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure the Google OAuth provider and Supabase project settings before any code changes can land.

- [ ] T001 Create Google OAuth 2.0 Client in Google Cloud Console (Web application type) and capture `client_id` / `client_secret` for staging and production. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Document values in the team password manager — **do not commit**.
- [ ] T002 Configure the Google provider in the Supabase Dashboard (Auth → Providers → Google) for both the staging project and the production project, pasting the IDs from T001. Add Redirect URLs (Auth → URL Configuration): `http://localhost:5173`, `https://primepmdev.pages.dev`, and the wildcard `https://*.primepmdev.pages.dev` for preview deploys (research.md §R6).
- [ ] T003 Enable the **"Automatic linking on email match for verified emails"** project setting in both Supabase environments (research.md §R2). This is the switch that makes FR-004 silent linking work without application code.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration, Avatar component scaffold, and the new edge route surface — all required before any user story can fully land.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [ ] T004 Add nullable `avatarUrl String? @map("avatar_url") @db.VarChar(2048)` field to the `User` model in `prisma/schema.prisma` (data-model.md §4).
- [ ] T005 Generate the Prisma migration `prisma/migrations/<ts>_add_avatar_url_to_users/migration.sql` containing a single `ALTER TABLE users ADD COLUMN avatar_url VARCHAR(2048);` (data-model.md §4 "Migration"). Verify it applies cleanly against a fresh local Supabase volume.
- [ ] T006 [P] Create the `Avatar` component skeleton in `src/components/Avatar.tsx` exporting the props shape from contracts/auth-ui.contract.md §C4 (`{ url, name, email, size? }`). Implementation lands in T015.
- [ ] T007 [P] Add `signInWithGoogle()` to the `AuthContext` value shape in `src/auth/useAuth.tsx` (signature only, throws "not implemented"). Implementation lands in T013.
- [ ] T008 [P] Create `supabase/functions/api/routes/me.ts` with empty `meRoutes` Hono router. Two routes (`GET /api/me`, `PUT /api/me/profile`) are wired up in T018.
- [ ] T009 Register `meRoutes` in `supabase/functions/api/index.ts` (matches plan.md §"Project Structure") so the new route surface is reachable. Confirm the dev edge runtime returns 401 on `GET /api/me` without a token.

**Checkpoint**: Schema migration committed, frontend/backend scaffolds in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — New user signs up with Google in one click (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor with no primepm account clicks "Continue with Google", lands on the dashboard with their Google name + avatar visible, and has a personal organization auto-provisioned.

**Independent Test**: From a clean browser session, Google account that has never signed in: complete the flow and assert (a) post-login URL is the authenticated dashboard, (b) display name + avatar render in `PpSidebar` foot, (c) one row exists in `public.users` and one row in `public.organizations` for this user.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and confirm they FAIL before T013–T018 land.

- [ ] T010 [P] [US1] Vitest test for `signInWithGoogle()` wiring in `src/auth/__tests__/useAuth.test.tsx` — assert it calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })` (contracts/auth-ui.contract.md §C1).
- [ ] T011 [P] [US1] Vitest test for the "Continue with Google" button in `src/auth/__tests__/LoginPage.test.tsx` — renders on both `?tab=signin` and `?tab=signup`, click invokes `signInWithGoogle`, click while busy is a no-op, mocked Supabase error renders inside `pp-err` (contracts/auth-ui.contract.md §C1 test plan).
- [ ] T012 [P] [US1] Vitest test for `Avatar` with image present in `src/components/__tests__/Avatar.test.tsx` — assert `<img>` renders with `src=url`, `alt`, `referrerPolicy="no-referrer"`, and `loading="lazy"` (contracts/auth-ui.contract.md §C4 test plan, items 1 + 4).
- [ ] T013 [P] [US1] Deno contract test for `PUT /api/me/profile` in `supabase/functions/api/routes/__tests__/me.test.ts` — assert: 401 without Bearer, 400 on empty `fullName`, 400 on non-https `avatarUrl`, 200 with valid body returns the updated profile shape from contracts/me-profile.openapi.yaml `MeProfile`.

### Implementation for User Story 1

- [ ] T014 [US1] Implement `signInWithGoogle()` in `src/auth/useAuth.tsx` — wraps `supabase.auth.signInWithOAuth` with the redirect option from research.md §R6, returns `{ error?: string }` matching the existing `signIn` / `signUp` shape (contracts/auth-ui.contract.md §C1 click handler contract).
- [ ] T015 [US1] Implement the `Avatar` component in `src/components/Avatar.tsx` — image branch with `referrerPolicy="no-referrer"` + `loading="lazy"` + `onError → fallback`; initials derived from name (1–2 tokens), then email split, then `"U"` (contracts/auth-ui.contract.md §C4 behavior).
- [ ] T016 [US1] Replace the inline initials logic at `src/components/layout/PpSidebar.tsx:68-74` with `<Avatar url={user.avatarUrl} name={user.fullName} email={user.email} />` so `Avatar` is the only place computing initials going forward (research.md §R5).
- [ ] T017 [US1] Wire the Google `<button>` `onClick` handler in `src/auth/LoginPage.tsx` to call `signInWithGoogle()` (replaces the existing `ssoPlaceholder('Google')` placeholder at line 80). Render a busy state on the button while the OAuth round-trip is in flight; surface errors via the existing `pp-err` row.
- [ ] T018 [US1] Implement `GET /api/me` and `PUT /api/me/profile` in `supabase/functions/api/routes/me.ts`. Use `requireAuth` for both. Zod-validate the PUT body per `MeProfileUpdate` (contracts/me-profile.openapi.yaml). Update `users.full_name` and `users.avatar_url` for the authenticated `sub`. Return the `MeProfile` shape on 200.
- [ ] T019 [US1] Implement post-callback profile sync in `src/auth/useAuth.tsx` — on `onAuthStateChange` `SIGNED_IN`, derive `fullName` (`session.user.user_metadata.full_name || .name || email-prefix`) and `avatarUrl` (`session.user.user_metadata.avatar_url || .picture || null`), then fire-and-forget `PUT /api/me/profile`. A failed POST `console.warn`s and does not block sign-in (contracts/auth-ui.contract.md §C3).
- [ ] T020 [US1] Implement OAuth-error URL capture in `src/auth/useAuth.tsx` — on mount, parse `?error=` / `#error=`, expose a transient error string for `LoginPage` to render in `pp-err`, then call `history.replaceState({}, '', window.location.pathname)` to strip the params (contracts/auth-ui.contract.md §C2).
- [ ] T021 [US1] Render the captured OAuth error from T020 inside the existing `pp-err` row on `src/auth/LoginPage.tsx`. Map `access_denied` to the cancellation copy from research.md §R7 and any other error code to the generic provider-error copy.

**Checkpoint**: Story 1 fully functional and independently testable per the Independent Test above. **MVP is shippable here.**

---

## Phase 4: User Story 2 — Existing email/password user signs in with Google and accounts are linked (Priority: P2)

**Goal**: An existing email/password user clicks "Continue with Google" with the same email, is recognized as the same account, and lands in their existing workspace with no duplicate user row.

**Independent Test**: Create an account via email/password (e.g. `daniela@northwind.co`), sign out, then sign in with the Google account whose email is `Daniela@northwind.co` (note differing case). Assert: (a) lands in the same organization, (b) `SELECT count(*) FROM public.users WHERE email ilike 'daniela@northwind.co' = 1`, (c) `SELECT count(*) FROM auth.identities WHERE user_id = <id> = 2` (one `email`, one `google`).

### Tests for User Story 2 ⚠️

- [ ] T022 [P] [US2] Vitest test for the `SIGNED_IN` profile sync overwriting `fullName` and `avatarUrl` for a returning email/password user in `src/auth/__tests__/useAuth.test.tsx` — assert `PUT /api/me/profile` is called with the latest Google metadata even when a `users` row already exists.
- [ ] T023 [P] [US2] Vitest snapshot test in `src/components/__tests__/Avatar.test.tsx` covering the `onError → initials` fallback path so a stale Google avatar URL never renders broken when the same user signs in again (contracts/auth-ui.contract.md §C4 item 4).

### Implementation for User Story 2

- [ ] T024 [US2] Verify silent linking end-to-end against the Supabase staging project (research.md §R2 + quickstart.md §"User Story 2"): create 10 email/password test users with mixed-case emails, link each via Google, assert zero new `auth.users` rows. SC-002 acceptance.

> No new application code is required for US2 — silent linking is a Supabase project-setting + the idempotent profile sync from T019 cover the user-visible name/avatar refresh.

**Checkpoint**: Stories 1 and 2 both work; zero duplicate accounts.

---

## Phase 5: User Story 3 — Existing email/password sign-in continues to work unchanged (Priority: P2)

**Goal**: Regression protection — users who never click the Google button see no behavioral change to the email/password flow (FR-008, SC-003).

**Independent Test**: Snapshot the `LoginPage` form structure (excluding the new SSO row + OAuth-error rendering) against `main` and assert byte-equality. Sign in with email/password before and after the feature flag is enabled and confirm session, validation, and post-login route are identical.

### Tests for User Story 3 ⚠️

- [ ] T025 [P] [US3] Vitest snapshot test in `src/auth/__tests__/LoginPage.test.tsx` asserting the `<form>` element + email/password fields + "Forgot?" link + "Sign in" / "Create account" submit copy are identical pre/post feature (contracts/auth-ui.contract.md §C5 test plan).
- [ ] T026 [P] [US3] Vitest test in `src/auth/__tests__/useAuth.test.tsx` asserting `signIn(email, password)` and `signUp(email, password)` still return `{ error?: string }` with no behavioral change to the existing signatures.

> No new implementation tasks — US3 is verified by the regression tests above plus the manual checklist in T032.

**Checkpoint**: Stories 1, 2, and 3 all coexist; the email/password flow is provably unchanged.

---

## Phase 6: User Story 4 — Architecture is ready for additional SSO providers (Priority: P3)

**Goal**: Document and verify that adding Microsoft / SAML / Okta in the future requires zero schema changes to `users` or `auth.users` (FR-011).

**Independent Test**: Inspect the data model and confirm that `auth.identities` can hold a second-provider row against the same `user_id` without altering any application table.

- [ ] T027 [P] [US4] Author a one-paragraph "Multi-provider extension" note at the bottom of `specs/001-google-oauth-login/data-model.md` §9 (already drafted — confirm wording and that it cites `auth.identities` as the canonical store). No code change.
- [ ] T028 [US4] Manual verification on Supabase staging (per quickstart.md §"User Story 4"): in the Auth Dashboard, simulate enabling a second provider (e.g., GitHub) for an existing user, assert a new `auth.identities` row appears with the same `user_id`, and assert `public.users` is unchanged. Then disable the provider — this is verification only, not a feature delivery.

**Checkpoint**: All four user stories independently exercised.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Adoption telemetry, documentation, and the manual quickstart.

- [ ] T029 [P] Add a single structured `console.info({ event: 'auth.signin', provider, sub, ts })` log in `src/auth/useAuth.tsx` on `SIGNED_IN` (research.md §R8). One line, no analytics-tool dependency. Provides the SC-006 adoption signal.
- [ ] T030 [P] Update `README.md` "Authentication" section (or add one if missing) explaining the two sign-in paths and pointing at `specs/001-google-oauth-login/quickstart.md` for the staging checklist.
- [ ] T031 [P] Mark `specs/001-google-oauth-login/checklists/requirements.md` items as ✅ as they're verified during the staging run.
- [ ] T032 Run the full manual end-to-end checklist in `specs/001-google-oauth-login/quickstart.md` against Supabase staging across all three account types (new Google, existing email/password matched by Google, cancelled consent). Record results in the PR description.
- [ ] T033 Add an entry to `memory-bank/changelog.md` summarizing the feature: "Added Google OAuth sign-in alongside email/password; users.avatar_url column; Avatar component; PUT /api/me/profile endpoint."

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T002 → T003. T001 produces credentials that T002 consumes. T003 is independent of T002 but lives in the same dashboard.
- **Foundational (Phase 2)**: Depends on Setup. T004 → T005 (migration must apply). T006 / T007 / T008 are parallel scaffolds. T009 depends on T008.
- **User Stories (Phase 3+)**: All depend on Foundational completing.
  - US1 (P1) is the MVP — implement first.
  - US2, US3, US4 may proceed in parallel after US1 if staffing permits, since they don't share files with US1's implementation tasks.
- **Polish (Phase 7)**: Depends on Phase 3 completing. T029 specifically depends on T019 (touches the same `onAuthStateChange` handler).

### Within User Story 1

- Tests T010–T013 must be written and FAIL before implementation begins.
- T014 (`signInWithGoogle`) blocks T017 (button onClick).
- T015 (`Avatar`) blocks T016 (PpSidebar swap).
- T018 (edge route) blocks T019 (frontend profile sync — sync calls the route).
- T020 (URL error capture) blocks T021 (rendering the error).

### Parallel Opportunities

- All Setup (Phase 1) tasks are sequential (Google → Supabase → setting).
- T006, T007, T008 in Foundational run in parallel (different files, no shared state).
- All US1 tests T010–T013 run in parallel.
- T014 / T015 / T018 run in parallel within US1 implementation (different files); T016, T017, T019, T020, T021 join after their respective dependencies.
- US2, US3, US4 phases run in parallel with each other once US1 is complete.
- All Phase 7 polish items marked [P] run in parallel.

---

## Parallel Example: User Story 1 Tests

```bash
# Launch the four US1 tests together — different files, no dependencies:
Task: "Vitest test for signInWithGoogle wiring in src/auth/__tests__/useAuth.test.tsx"
Task: "Vitest test for Continue with Google button in src/auth/__tests__/LoginPage.test.tsx"
Task: "Vitest test for Avatar with image present in src/components/__tests__/Avatar.test.tsx"
Task: "Deno contract test for PUT /api/me/profile in supabase/functions/api/routes/__tests__/me.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup: configure Google + Supabase (T001–T003).
2. Phase 2 Foundational: migration + scaffolds (T004–T009).
3. Phase 3 User Story 1: tests first, then implementation (T010–T021).
4. **STOP and VALIDATE** against the US1 Independent Test above.
5. Ship the MVP — Google sign-up works end-to-end.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → ship MVP.
3. US2 → verify silent linking against 10 staging accounts → ship.
4. US3 → run regression snapshots against `main` → ship.
5. US4 → confirm extension story in data-model.md and on staging → ship.
6. Polish → telemetry, docs, quickstart, changelog.

### Parallel Team Strategy

Once Phase 2 is complete:

- Developer A: US1 (largest scope — new code in 4 files).
- Developer B: US3 regression tests (lowest blast radius, can sketch against `main` while A works).
- Developer C: US2 + US4 verification (manual + staging-heavy, low file overlap with A and B).

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- [Story] label maps each task to a spec.md user story for traceability.
- Each user story is independently completable and testable per its Independent Test.
- Tests T010–T013, T022–T023, T025–T026 all MUST be authored to FAIL first; only then is implementation allowed to land.
- Commit after each task or logical group (matches `.specify/extensions.yml` `before_*` hooks).
- US3 has zero implementation tasks by design — it is regression coverage, and the absence of new code is the point.
- The mockup ([Figma](https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=41:2&locale=en&type=design)) is the visual source of truth referenced from plan.md §"UI Mockup".
