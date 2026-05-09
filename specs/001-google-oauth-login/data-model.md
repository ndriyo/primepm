# Data Model: Google OAuth Login

**Feature**: 001-google-oauth-login
**Date**: 2026-05-09
**Status**: Phase 1 — Design

This document captures every entity, field, relationship, and state transition involved in adding Google OAuth login to primepm. It distinguishes data **owned by Supabase Auth** (the `auth` schema, managed by GoTrue, never modified by application code) from data **owned by the application** (the `public` schema, managed via Prisma).

---

## 1. Entity overview

| Entity | Schema | Owner | Purpose for this feature |
|---|---|---|---|
| `auth.users` | `auth` | Supabase | Canonical user record. JWT `sub` = `auth.users.id`. We never write to it. |
| `auth.identities` | `auth` | Supabase | One row per (user, provider). Holds the Google identity, the email/password identity, and any future SSO identities for the same user. **This is the linked-identity store.** |
| `users` | `public` | Application (Prisma model `User`) | App-level user profile: full name, avatar, organization membership, roles. Keyed by `auth.users.id`. **Modified by this feature: add `avatar_url` column.** |
| `organizations` | `public` | Application (Prisma model `Organization`) | Auto-provisioned personal workspace on first sign-in. **No schema change in this feature** — only the trigger (now also Google) is broadened. |
| `auth.audit_log_entries` | `auth` | Supabase | Sign-in / sign-up / OAuth event log. Used to satisfy FR-013 (observability) without a new application table. |

---

## 2. `auth.users` (Supabase-managed, no change)

Authoritative user record managed by GoTrue. We do **not** modify its schema or write to it from application code.

| Column | Type | Notes for this feature |
|---|---|---|
| `id` | `uuid` (PK) | The JWT `sub`. Foreign key target for `public.users.id`. |
| `email` | `text` | Normalized to lowercase by GoTrue on insert. Used for case-insensitive linking match (FR-004). |
| `email_confirmed_at` | `timestamptz` | For Google sign-in, populated immediately by GoTrue because Google asserts a verified email. |
| `last_sign_in_at` | `timestamptz` | Touched on every successful sign-in regardless of provider. |
| `raw_user_meta_data` | `jsonb` | Provider-supplied profile data (Google: `full_name`, `name`, `avatar_url`, `picture`, `email_verified`). Read by the frontend after sign-in. |
| `raw_app_meta_data` | `jsonb` | Holds `provider` ("google" / "email") and `providers` (array). Read for diagnostics only. |

---

## 3. `auth.identities` (Supabase-managed, no change — but central to FR-006/FR-011)

One row per (user, provider). This is what makes the user model **inherently multi-provider** and satisfies FR-011 + US4 with no application-level schema work.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Identity row PK. |
| `user_id` | `uuid` (FK → `auth.users.id`) | The same `user_id` appears across all of a user's identity rows. |
| `provider` | `text` | `"google"`, `"email"`, and (in the future) `"azure"`, `"saml"`, `"okta"`, etc. |
| `provider_id` | `text` | Provider-specific subject ID (Google's `sub`). Unique per `(provider, provider_id)`. |
| `identity_data` | `jsonb` | Provider profile snapshot at last sign-in. |
| `email` | `text` | Email asserted by this provider for this user. Used by Supabase's automatic linking. |
| `created_at`, `updated_at`, `last_sign_in_at` | `timestamptz` | |

**Linking invariant (FR-004, FR-006)**: When a Google sign-in arrives with `email_verified=true` and an email matching an existing `auth.users.email`, GoTrue inserts a new `auth.identities` row with the **existing** `user_id` rather than creating a new `auth.users` row — provided the project setting "Automatic linking on email match for verified emails" is enabled.

**Multi-provider invariant (FR-011, US4)**: Adding Microsoft / SAML / Okta in the future inserts new `(provider, provider_id)` rows against the **same** `user_id` with no schema change to either `auth.users` or `public.users`.

---

## 4. `public.users` (Prisma model `User`) — **modified**

App-level user profile. Keyed by `auth.users.id`.

### Existing fields (unchanged)

| Field | Prisma | DB | Notes |
|---|---|---|---|
| `id` | `String` (PK) | `uuid` | Same value as `auth.users.id` (JWT `sub`). |
| `email` | `String` (unique) | `varchar(255)` | App-side mirror of the user's primary email. Already case-insensitive in practice because GoTrue normalizes on insert. |
| `fullName` | `String` | `varchar(255)` mapped to `full_name` | Display name shown in the app shell. |
| `organizationId` | `String` | `uuid` mapped to `organization_id` | The personal organization. |
| `departmentId` | `String?` | `uuid` mapped to `department_id` | Unchanged. |
| `roles` | `String[]` | `text[]` | Unchanged. |
| `createdAt`, `updatedAt`, `createdById`, `updatedById` | timestamps + audit FKs | | Unchanged. |

### **New field (this feature)**

| Field | Prisma | DB | Validation | Notes |
|---|---|---|---|---|
| `avatarUrl` | `String?` (nullable) | `varchar(2048)` mapped to `avatar_url` | None at the DB level. Frontend treats null/empty as "use initials fallback". | Updated on every successful sign-in via `PUT /api/me/profile`. URL points directly at Google's CDN; no proxying or caching. (FR-003, FR-007, FR-010, FR-012, R4, R5) |

### Migration

A new Prisma migration `add_avatar_url_to_users` adds the column:

```sql
ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(2048);
```

No backfill required — null is a valid value and the frontend renders the existing initials fallback when null.

### Validation rules

- `avatarUrl`, when present, MUST be an absolute HTTPS URL. Validated in the `PUT /api/me/profile` request body (Zod schema in the edge function).
- `fullName` MUST remain non-empty after a profile sync. If Google returns an empty display name (extremely rare), the sync request is rejected with 400 and the existing `fullName` is preserved.

---

## 5. `public.organizations` (Prisma model `Organization`) — **no schema change**

The personal organization auto-provisioning behavior is unchanged from today (`supabase/functions/api/lib/auth.ts:69-90`). The only change is that the **trigger** for creating one now includes Google first sign-in, because the `requireAuth` middleware runs on the first authenticated API request regardless of provider.

The auto-provisioned organization name remains `"<email-prefix>'s workspace"` at insert time. The user's display name on the user record (`users.full_name`) is overwritten to the Google display name on the immediately-following `PUT /api/me/profile` call (R4).

---

## 6. Relationships

```
auth.users (1) ─────┬───────── (N) auth.identities       [Supabase-managed]
                    │              one row per provider
                    │
                    └─ (1:1 by id) ─── public.users      [Application]
                                            │
                                            └── (N:1) public.organizations
```

**Key relationship invariants for this feature:**

1. `public.users.id` always equals exactly one `auth.users.id`. This was true before this feature and remains true.
2. `auth.users.id` may be referenced by 1..N rows in `auth.identities`. **This is the SSO-readiness contract** (FR-011).
3. `public.users` is **never duplicated by provider**. There is one and only one `public.users` row per person, regardless of how many identities they have linked.

---

## 7. State transitions

### S1. New user signs up with Google (US1, P1)

```
[no auth.users row, no public.users row]
   │
   │  Google OAuth callback succeeds, GoTrue creates auth.users + auth.identities (provider=google)
   ▼
[auth.users exists]   [auth.identities(google) exists]   [no public.users row yet]
   │
   │  Frontend gets session, calls first authenticated API request (e.g. /api/me/profile)
   │  requireAuth middleware finds no public.users row → atomically creates organizations + users
   ▼
[public.users exists, organizationId set, fullName=email-prefix, avatarUrl=null]
   │
   │  Frontend immediately POSTs PUT /api/me/profile with name+avatar from session.user.user_metadata
   ▼
[public.users.fullName=Google display name, public.users.avatarUrl=Google avatar URL]
```

### S2. Existing email/password user signs in with Google for the first time (US2, P2)

```
[auth.users exists (created via email/password)]
[auth.identities(email) exists]
[public.users exists]
   │
   │  Google OAuth callback succeeds with email_verified=true and matching email
   │  GoTrue's automatic linking adds auth.identities(google) against the SAME auth.users.id
   ▼
[auth.identities(email) AND auth.identities(google) both reference the same auth.users.id]
[public.users unchanged — same row, same id, same organizationId]
   │
   │  Frontend POSTs PUT /api/me/profile (idempotent — refreshes name+avatar)
   ▼
[public.users.fullName and public.users.avatarUrl reflect latest Google profile]
```

### S3. Linked user signs in again (any provider, US2 acceptance scenario 3)

```
[auth.identities(email) AND auth.identities(google) exist for same auth.users.id]
   │
   │  User signs in via either provider
   ▼
[same JWT sub → same public.users row → same organization → same data]
```

### S4. Google consent denied / cancelled (Edge case, FR-009, SC-005)

```
[no auth.users row, no public.users row]   ← if first time
or
[existing auth.users + public.users]       ← if returning user
   │
   │  User clicks "Continue with Google" → consent screen → cancels/denies
   │  Provider redirects back with ?error=access_denied
   │  GoTrue does NOT exchange a token; no auth.users / auth.identities row is created or modified
   ▼
[state is identical to before the click — zero side effects]
[Frontend shows a non-alarming inline message; URL error params are stripped]
```

### S5. Avatar/name change in Google profile (Edge case, FR-012)

```
[public.users.fullName="Old Name", public.users.avatarUrl="https://.../old.jpg"]
   │
   │  User updates name/photo in Google account, signs in again
   │  Frontend reads session.user.user_metadata.full_name and avatar_url
   │  Frontend POSTs PUT /api/me/profile
   ▼
[public.users.fullName="New Name", public.users.avatarUrl="https://.../new.jpg"]
```

There is no render-time refetch — the cached `users.avatarUrl` value is the source of truth between sign-ins (R4 + Clarifications 2026-05-09 Q3).

---

## 8. Indexing & performance

No new indexes are required. The new `users.avatar_url` column is read alongside the rest of the `users` row via the existing `id` PK; it is never queried on its own.

The case-insensitive email match for linking happens inside Supabase Auth on the `auth.users.email` column, which already has a unique index (`auth.users_email_partial_key`). No application-side index is needed.

---

## 9. Future-extension points (not implemented in this feature, documented for clarity)

These are out of scope for this release but the data model is shaped to absorb them without migration of `users` or `auth.users`:

- **In-app linking surface** (e.g., Settings → "Linked accounts"): would read from `auth.identities` and call Supabase's `linkIdentity()` admin API. No schema change.
- **Per-link audit metadata** (who linked, when, from which IP): would add a new `public.identity_link_audit` table referencing `auth.users.id`. No change to existing tables.
- **Microsoft / SAML / Okta**: enable the provider in Supabase + add a button on `LoginPage.tsx`. New `auth.identities` rows appear automatically with `provider="azure"` etc. **No application schema change**, satisfying US4's independent test.
