-- MannaDaily: add server-side daily-session idempotency and the midday session.
-- Existing rows are assigned their UTC activity date from createdAt.

ALTER TABLE "DailySession" ADD COLUMN "activityDate" TEXT;
UPDATE "DailySession"
SET "activityDate" = to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE "activityDate" IS NULL;
ALTER TABLE "DailySession" ALTER COLUMN "activityDate" SET NOT NULL;
DELETE FROM "DailySession" a
USING "DailySession" b
WHERE a.ctid < b.ctid
  AND a."userId" = b."userId"
  AND a."activityDate" = b."activityDate"
  AND a."period" = b."period";
CREATE INDEX "DailySession_userId_activityDate_idx" ON "DailySession"("userId", "activityDate");
CREATE UNIQUE INDEX "DailySession_userId_activityDate_period_key"
  ON "DailySession"("userId", "activityDate", "period");

ALTER TABLE "UserProgress" ADD COLUMN "middaySessionToday" BOOLEAN NOT NULL DEFAULT false;
