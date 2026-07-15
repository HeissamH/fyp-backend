-- Grandfather existing users: they can keep logging in without re-verifying.
-- New self-registrations get email_verified_at = NULL until OTP is confirmed.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;

UPDATE "users"
SET "email_verified_at" = COALESCE("email_verified_at", "created_at")
WHERE "email_verified_at" IS NULL;
