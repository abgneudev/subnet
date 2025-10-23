-- Apply this SQL to your database to add rating fields
-- You can run this in your Vercel Postgres dashboard or via command line

ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "rating" real;
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "reviewCount" integer DEFAULT 0;

-- Optional: Update existing agents with sample ratings
UPDATE "agents" SET "rating" = 4.7, "reviewCount" = 342 WHERE "name" = 'MIT News Assistant';
UPDATE "agents" SET "rating" = 4.9, "reviewCount" = 1247 WHERE "name" = 'Positive News Haiku Writer';
UPDATE "agents" SET "rating" = 4.8, "reviewCount" = 856 WHERE "name" = 'Hot AI News Analyzer';
