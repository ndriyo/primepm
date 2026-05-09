# Feature Specification: Google OAuth Login

**Feature Branch**: `001-google-oauth-login`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "Add Google OAuth login alongside existing Supabase email/password authentication, with account linking, profile data sync, and SSO architecture readiness."

## Clarifications

### Session 2026-05-09

- Q: How should account linking work when a Google sign-in email matches an existing email/password user? → A: Auto-link silently (trust Google's verified email; no extra password re-auth).
- Q: Is in-app account management (a "Link Google" button inside the authenticated app's settings) in scope for this release? → A: No — login-page entry only.
- Q: How should the system keep the Google avatar in sync over time? → A: Refresh on each successful Google sign-in only; no render-time refetch and no server-side image caching.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New user signs up with Google in one click (Priority: P1)

A first-time visitor lands on the primepm sign-in page, clicks "Continue with Google", picks their Google account, and lands on the authenticated dashboard. Their name and avatar from Google are visible in the app shell. A personal organization has been auto-provisioned for them, identical to what happens today for email/password sign-ups.

**Why this priority**: This is the core value of the feature. Reducing the friction of account creation from "fill out a form, verify email, pick a password" to "one click" is the single biggest improvement. Without this, the feature delivers nothing.

**Independent Test**: From a clean browser session with no existing primepm account, complete the Google sign-in flow and confirm the user lands on the authenticated dashboard with their Google name and avatar rendered, and that a personal organization exists for them.

**Acceptance Scenarios**:

1. **Given** a visitor with no existing primepm account, **When** they click "Continue with Google" and approve consent, **Then** they are redirected to the authenticated dashboard, see their Google display name and avatar in the app shell, and have a personal organization auto-provisioned.
2. **Given** a visitor on the marketing landing page, **When** they choose "Continue with Google" from the sign-in entry point, **Then** the Google consent screen is presented without requiring any prior form fields.
3. **Given** a user who completes Google sign-in successfully, **When** they reload the authenticated app, **Then** they remain signed in and their session persists across reloads in the same way email/password sessions do today.

---

### User Story 2 - Existing email/password user signs in with Google and accounts are linked (Priority: P2)

A user who originally created their account with email/password later returns and chooses "Continue with Google" using the same email address. The system recognizes them as the same person and signs them into their existing account — they do not end up with a duplicate account, they do not lose their existing organization, projects, or schedules.

**Why this priority**: Without account linking, every existing email/password user who tries Google would create a parallel ghost account, fragmenting their data. This is the linking guarantee the PRD calls out by name and is essential for trust during the transition.

**Independent Test**: Create an account with email/password, sign out, then sign in with Google using the same email address. Verify the user lands in the same organization with the same projects visible, and verify there is exactly one user record for that email.

**Acceptance Scenarios**:

1. **Given** a user with an existing email/password account, **When** they sign in with Google using the same email address, **Then** they are signed into their existing account and see their existing organization and projects.
2. **Given** a user with an existing email/password account who has never used Google before, **When** they sign in with Google for the first time, **Then** the system links the Google identity to the existing account without creating a new user record.
3. **Given** a user has linked Google to an existing account, **When** they later sign in again with email/password, **Then** the email/password sign-in still works and lands them in the same account.

---

### User Story 3 - Existing email/password sign-in continues to work unchanged (Priority: P2)

A user who has only ever used email/password and ignores the new Google option sees no change in their experience. The form, validation, and post-sign-in landing page all behave exactly as they did before this feature shipped.

**Why this priority**: Regression protection for the existing audience. The PRD explicitly requires that email/password sign-in continue to work. A regression here would block release regardless of how well the Google flow works.

**Independent Test**: Sign in with an existing email/password account before and after this feature ships and confirm the flow, validation messages, session duration, and landing page are identical.

**Acceptance Scenarios**:

1. **Given** an existing email/password user, **When** they sign in with their email and password, **Then** they reach the same authenticated dashboard with the same data they had before, with no additional steps.
2. **Given** the sign-in page, **When** rendered, **Then** the email/password form is still present and prominent alongside the new Google option.

---

### User Story 4 - Architecture is ready for additional SSO providers (Priority: P3)

A future product decision to add Microsoft, SAML, or Okta SSO can proceed without rewriting the user identity or account-linking model. A user account can carry multiple linked external identities.

**Why this priority**: Strategic, not user-visible. The PRD calls this out as an explicit non-architectural-precluding requirement. P3 because it does not block the Phase 1 ship; it is verified by review of the data model rather than by a user action.

**Independent Test**: Inspect the user / linked-identity data model and confirm that adding a second provider type would not require a schema change to the user record itself, only adding a new row in a linked-identities collection.

**Acceptance Scenarios**:

1. **Given** the user identity model, **When** a hypothetical second SSO provider is added, **Then** an existing user account can hold both linked identities without duplication or migration of the existing user row.

---

### Edge Cases

- A visitor clicks "Continue with Google" then cancels or denies consent. They return to the sign-in page with no partial user record, no orphan organization, and a non-alarming message indicating sign-in was not completed.
- A Google account has no avatar. The app shell falls back to an initials-based avatar derived from the display name.
- A user signs in with Google using an email whose casing differs from their existing email/password account (e.g., `Foo@bar.com` vs `foo@bar.com`). The match is case-insensitive — they are recognized as the same user.
- A user changes their display name or avatar in their Google profile and signs in again. The most recently authenticated session updates the displayed name and avatar.
- The Google OAuth callback fails partway through (network error, provider downtime). The user sees a recoverable error and lands back on the sign-in page; no half-created account exists.
- A user is signed in via email/password and clicks "Continue with Google" from inside the app. This is **out of scope** for this feature — the Google entry point exists only on the unauthenticated sign-in surface in this release.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-in surface MUST present a "Continue with Google" option alongside the existing email/password form, on both the marketing-landing sign-in entry and the dedicated sign-in page.
- **FR-002**: The system MUST initiate a Google OAuth authorization flow when the user activates the "Continue with Google" option.
- **FR-003**: On successful Google authorization, the system MUST capture the user's verified email address, display name, and avatar URL from the Google profile.
- **FR-004**: The system MUST treat a Google sign-in whose email matches an existing primepm user as the same account (case-insensitive match) and MUST NOT create a duplicate user record. Linking is automatic and silent — no additional confirmation, password re-authentication, or email-verification step is required, because Google's verified-email guarantee is trusted.
- **FR-005**: On a first-time Google sign-in for an email that does not match any existing user, the system MUST create a new user record AND auto-provision a personal organization, identical to the existing email/password first-sign-in flow.
- **FR-006**: The system MUST persist the linkage between a user account and one or more external identity providers, such that the same user account can later sign in with any linked provider.
- **FR-007**: The system MUST display the authenticated user's display name and avatar in the application shell within the same loading window as today's email/password sign-in.
- **FR-008**: The system MUST preserve the existing email/password sign-in flow (form layout, validation, session duration, post-sign-in landing) without behavioral regression.
- **FR-009**: The system MUST handle a cancelled or denied Google consent gracefully: no user record is created or modified, the user returns to the sign-in page, and a non-alarming message indicates that sign-in was not completed.
- **FR-010**: The system MUST handle a Google profile with no avatar by displaying a deterministic initials-based fallback derived from the display name.
- **FR-011**: The user identity model MUST be capable of holding multiple linked external identities per user, so that adding additional SSO providers (e.g., Microsoft, SAML, Okta) in the future does not require restructuring the user record.
- **FR-012**: The system MUST update the stored display name and avatar on each successful Google sign-in to reflect the latest values from the Google profile. Avatar updates happen at sign-in only — there is no render-time re-fetch of the Google avatar URL and no server-side caching of the avatar image bytes in this release.
- **FR-013**: All Google sign-in events (success, cancellation, error) MUST be observable in the same place that email/password sign-in events are observable today, so operators can monitor adoption and failure rates.

### Key Entities

- **User account**: The single record representing a person within primepm. Holds primary email, display name, avatar URL, and references to one or more linked external identities. Same record regardless of which provider was used to sign in.
- **Linked external identity**: A record connecting a user account to an external identity provider (e.g., Google) and the provider-specific subject identifier. A user account may have one or more.
- **Personal organization**: The default organization auto-provisioned for a user on first sign-in. Behavior is unchanged from today; the only change is that the trigger now includes Google first-sign-in in addition to email/password sign-up.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete Google sign-in and reach the authenticated dashboard in under 30 seconds end-to-end (from clicking "Continue with Google" to seeing the dashboard rendered).
- **SC-002**: Zero duplicate user accounts are created when an email/password user subsequently signs in with Google using the same email — verified across at least 10 distinct test accounts.
- **SC-003**: 100% of existing email/password users who do not use Google see no change in their sign-in experience, measured by absence of regression bug reports and by an unchanged email/password sign-in success rate after release.
- **SC-004**: The authenticated user's display name and avatar are rendered in the app shell within 2 seconds of the Google callback completing on a typical broadband connection.
- **SC-005**: A cancelled Google consent results in zero user records being created, verified by an automated test that aborts at the consent screen and inspects the user table.
- **SC-006**: At least 30% of new sign-ups in the first 60 days post-launch use Google rather than email/password, indicating the friction reduction is real to users.

## Assumptions

- The existing authentication service supports Google as an OAuth provider directly, so this feature does not require building or hosting an OAuth integration from scratch.
- Google returns a verified email address. Verification status from Google is trusted for the purpose of account matching.
- The current personal-organization auto-provisioning logic that runs on first authenticated email/password sign-in can be triggered by Google first sign-in without functional change.
- Avatar URLs returned by Google are publicly fetchable from the user's browser; no avatar proxying is in scope.
- Email matching for account linking is case-insensitive. Plus-addressing variants (e.g., `user+x@example.com`) are treated as distinct addresses unless they exactly match an existing record.
- Mobile-web sign-in shares the same flow as desktop-web; no native-app considerations apply.
- "Continue with Google" is the only new SSO entry point in this release. Microsoft, SAML, and Okta entry points are out of scope.
- In-app account management (a "Link Google" button in the authenticated app's settings) is **out of scope** for this release per Clarifications 2026-05-09.
- Cross-device session continuity is governed by the existing session model and is not changed by this feature.
- Sign-in events are already logged today; this feature inherits that logging surface without inventing a new one.
