-- 001-google-oauth-login: add nullable avatar_url to users
-- Mirrors Google profile picture URL (or any other future provider).
-- Null is a valid value; the frontend renders an initials fallback.
ALTER TABLE "users"
  ADD COLUMN "avatar_url" VARCHAR(2048);
