ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "announcements" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "stories" boolean DEFAULT true NOT NULL;
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "lost_found" boolean DEFAULT true NOT NULL;

UPDATE "notifications" SET "type" = 'STORY' WHERE "type" = 'story';
UPDATE "notifications" SET "type" = 'ANNOUNCEMENT' WHERE "type" = 'announcement';
UPDATE "notifications" SET "type" = 'LOST_FOUND' WHERE "type" = 'lost_found';