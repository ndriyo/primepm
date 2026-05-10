# Implementation Plan: Google OAuth Login

**Branch**: `001-google-oauth-login` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-google-oauth-login/spec.md`
**UI Mockup**: [Figma — `001 • Google OAuth Login`](https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=41:2&locale=en&type=design)

## Summary

Add a "Continue with Google" entry point alongside the existing Supabase email/password sign-in surface. New Google sign-ins land in the same authenticated dashboard with their Google display name and avatar visible, and a personal organization auto-provisioned identically to today's email/password flow. Existing email/password users who later sign in with Google using the same email are silently linked into a single account (no duplicates), and the existing email/password flow remains regression-free. The user-identity model is shaped so adding additional SSO providers in future requires no schema migration.

**Technical approach** (from [`research.md`](./research.md)): use Supabase Auth's first-party Google provider (`signInWithOAuth({ provider: 'google' })`) so that token issuance, JWT verification, session refresh, and the existing `requireAuth` auto-provisioning logic in the edge function are reused unchanged. Enable Supabase's "Automatic linking on email match for verified emails" project setting to satisfy silent linking. Add a single nullable `avatar_url` column to `public.users` and a new idempotent `PUT /api/me/profile` endpoint that the frontend calls on every successful sign-in to mirror the latest provider profile (display name + avatar) into the application table. Multi-provider readiness is provided by Supabase's `auth.identities` table and requires zero application-side schema work.

## Technical Context

**Language/Version**: TypeScript 5.7 (frontend, React 19 + Vite 6); TypeScript on Deno (Supabase Edge Functions)
**Primary Dependencies**: `@supabase/supabase-js` ^2.105 (frontend auth client), Supabase Auth (GoTrue) for OAuth/JWT/identity linking, Hono on Deno for the edge function, Prisma 7 for migrations against Supabase Postgres, Tailwind 4 for styling, Zod 4 for request validation in the new edge route
**Storage**: Supabase PostgreSQL — the `auth` schema (managed by Supabase) holds `auth.users` and the multi-provider `auth.identities` table; the `public` schema holds the application tables (Prisma model `User`, etc.). One additive migration in this feature: nullable `avatar_url VARCHAR(2048)` on `users`.
**Testing**: Vitest 3 + @testing-library/react for frontend unit/component tests (already configured); Deno test for the new edge-function contract test; manual end-to-end checklist in [`quickstart.md`](./quickstart.md) executed against a Supabase staging project (because a real OAuth round-trip cannot be exercised inside vitest).
**Target Platform**: Web — desktop and mobile browsers (evergreen). Frontend deployed to Cloudflare Pages (`primepmdev.pages.dev`); edge functions deployed to Supabase Edge Runtime.
**Project Type**: Web application — React SPA frontend (`src/`) + Deno edge-function backend (`supabase/functions/api/`) + Postgres database managed by Prisma migrations (`prisma/`).
**Performance Goals** (from spec Success Criteria): SC-001 — Google sign-in completes end-to-end in under 30 s; SC-004 — display name and avatar render in the app shell within 2 s of the OAuth callback completing on a typical broadband connection.
**Constraints**: SC-003/FR-008 — zero behavioral regression to the existing email/password flow (form, validation, session duration, post-sign-in landing); SC-005/FR-009 — zero rows created in `auth.users` or `public.users` on cancelled consent; SC-002/FR-004 — case-insensitive email match for linking with **zero** duplicate accounts across at least 10 test cases; FR-013 — Google sign-in events MUST be observable in the same surface as email/password events today (Supabase Auth audit log).
**Scale/Scope**: Existing user base (single-digit-thousands order of magnitude); SC-006 expects ≥30% Google adoption among new sign-ups in the first 60 days. Two routes added to the edge function (`GET /api/me`, `PUT /api/me/profile`); one new React component (`Avatar`); one Prisma migration; one frontend context method (`signInWithGoogle`); one Supabase project configuration change per environment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository's `.specify/memory/constitution.md` is currently the unfilled template (placeholders such as `[PRINCIPLE_1_NAME]` only — no project-specific principles have been ratified yet). There are therefore no enumerated gates to evaluate against this feature.

Pragmatic gate evaluation against principles a typical PMIS-style constitution would adopt — applied here as a self-check, **not** as a substitute for ratification:

| Pragmatic gate | Status | Notes |
|---|---|---|
| **No regression to existing core flows** | PASS | FR-008 + US3 + C5 contract pin email/password behavior unchanged; vitest snapshot test enforces it. |
| **Test-first / coverage** | PASS | Vitest tests for C1–C5 + Deno contract test for the new edge route are required before merge per [`quickstart.md`](./quickstart.md) §4. |
| **Schema simplicity / additive migrations** | PASS | Single additive nullable column (`users.avatar_url`); no existing data touched; trivially rolled back. |
| **Security / no secrets in repo** | PASS | Google Client ID/Secret live in Supabase Dashboard; Supabase JWT verification (RS256/JWKS, HS256 fallback) already implemented in `requireAuth` and is reused. |
| **Observability** | PASS | Inherits Supabase Auth audit log; one structured `console.info` line on the frontend for adoption signal — no new analytics infrastructure introduced. |
| **Architecture extensibility** | PASS | FR-011 + US4 satisfied by Supabase's `auth.identities` model; no application schema needs restructuring to add Microsoft/SAML/Okta later. |

**Recommended follow-up (out of scope of this feature)**: ratify `.specify/memory/constitution.md` so future features have explicit, machine-checkable gates rather than a pragmatic checklist. No violations to record in the Complexity Tracking table for this feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-google-oauth-login/
├── spec.md              # Feature specification (input, already complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — R1–R10 design decisions
├── data-model.md        # Phase 1 output — auth.users / auth.identities / public.users
├── quickstart.md        # Phase 1 output — provider config, impl map, manual QA checklist
├── contracts/           # Phase 1 output
│   ├── me-profile.openapi.yaml   # GET /api/me + PUT /api/me/profile contract
│   └── auth-ui.contract.md       # Frontend behavioral contract (C1–C5)
├── checklists/
│   └── requirements.md           # Spec quality checklist (already complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created by /speckit.plan)
```

### Source Code (repository root)

The repository is a single web-application monorepo with three top-level concerns: a React + Vite frontend (`src/`), a Deno + Hono edge-function backend (`supabase/functions/api/`), and database migrations (`prisma/`). Test files live colocated with their subjects under `__tests__/` directories.

This feature touches the following paths only:

```text
src/
├── auth/
│   ├── LoginPage.tsx              # MODIFY — wire Google button, render OAuth-error message
│   ├── useAuth.tsx                # MODIFY — add signInWithGoogle(), URL-error capture, post-signin profile sync
│   ├── supabaseClient.ts          # UNCHANGED — existing Supabase client config is sufficient
│   └── __tests__/                 # ADD — useAuth.test.tsx, LoginPage.test.tsx
├── components/
│   ├── Avatar.tsx                 # ADD — new component per contracts/auth-ui.contract.md C4
│   ├── layout/
│   │   └── PpSidebar.tsx          # MODIFY — replace inline initials logic with <Avatar />
│   └── __tests__/
│       └── Avatar.test.tsx        # ADD
└── lib/
    └── api.ts                     # (existing) — used by useAuth to call PUT /api/me/profile

supabase/functions/api/
├── index.ts                       # MODIFY — register new meRoutes router
├── routes/
│   ├── me.ts                      # ADD — GET /api/me, PUT /api/me/profile
│   └── __tests__/
│       └── me.test.ts             # ADD — Deno contract test
└── lib/
    └── auth.ts                    # UNCHANGED — existing requireAuth + auto-provisioning is reused as-is

prisma/
├── schema.prisma                  # MODIFY — add avatarUrl field to User model
└── migrations/
    └── <ts>_add_avatar_url_to_users/
        └── migration.sql          # ADD — single ALTER TABLE
```

**Structure Decision**: Keep the existing single-monorepo layout (frontend in `src/`, backend in `supabase/functions/api/`, schema in `prisma/`). This feature is small enough — one new component, one new edge route, one additive column, two minor frontend modifications — that it does not warrant any restructuring or new top-level packages. Tests live next to their subjects in `__tests__/` directories, matching the convention introduced in PR #55.

## UI Mockup

**Figma**: [`001 • Google OAuth Login`](https://www.figma.com/file/N9DB0nKpW1qZiOj1AIHAlk?node-id=41:2&locale=en&type=design) — page added to the existing `PrimePM • Design System` file. Tokens, type, and components reuse `src/styles/pp-tokens.css` + `src/auth/login.css`.

The page covers the full visual scope of this plan in four sections:

1. **Login screens (1440 × 900, six variants)** — two-column layout matching `LoginPage.tsx`. Renders the new "Continue with Google" button next to the existing email/password form so the C5 non-regression contract is visible at a glance:
   - **A** Sign in (default) · **B** Sign up (default)
   - **C** OAuth in flight (Google button shows spinner; both SSO buttons disabled; transient info banner; email form inert)
   - **D** Cancelled / denied consent (FR-009 — non-alarming amber banner, URL params already stripped)
   - **E** OAuth provider error (`access_denied` / network) — error variant of `pp-err`
   - **F** Returning user · Google linked (post-FR-004 silent linking confirmation copy)
2. **Avatar component** — five states (image, no avatar, single-token name, email fallback, `onError` fallback) at 56 / 36 / 28 px, plus three `PpSidebar` foot examples showing the avatar in real layout context. Maps 1:1 to contract C4 in [`contracts/auth-ui.contract.md`](./contracts/auth-ui.contract.md).
3. **Flow diagram** — six-step happy path (click → OAuth round-trip → callback → profile sync → auto-link → app shell) with the C1–C5 contract chips attached at the steps where each contract applies.
4. **Contracts table** — full C1–C5 row breakdown (surface · contract · test must-pass) lifted from `contracts/auth-ui.contract.md`, plus three callout cards covering items that are non-visual but in scope (settings link is **out of scope**, additive `users.avatar_url` migration, idempotent `PUT /api/me/profile`).

The mockup is the visual source of truth for the implementation. If a reviewer disagrees with copy, banner choice, or layout, change it in Figma first; the implementation should follow the file rather than diverge.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The feature is intentionally implemented as the smallest delta on top of existing primitives:

- Reuses Supabase Auth instead of building custom OAuth.
- Reuses Supabase's `auth.identities` for multi-provider readiness instead of inventing an application-level linking table.
- Reuses the existing `requireAuth` middleware and its auto-provisioning code path unchanged.
- Adds exactly one column, one component, and one edge route.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | — | — |
