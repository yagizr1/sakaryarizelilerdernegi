-- AlterTable User role default
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
UPDATE "User" SET "role" = 'ADMIN' WHERE lower("role") = 'admin';

-- AlterTable Member: auth + approval fields
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "memberNo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "notifyEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "notifySms" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Expand status: keep aktif/pasif, pending applications use beklemede
ALTER TABLE "Member" ALTER COLUMN "status" SET DEFAULT 'beklemede';

CREATE INDEX IF NOT EXISTS "Member_nationalId_idx" ON "Member"("nationalId");
CREATE INDEX IF NOT EXISTS "Member_status_idx" ON "Member"("status");

-- EventAttendance
CREATE TABLE IF NOT EXISTS "EventAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventAttendance_eventId_memberId_key" ON "EventAttendance"("eventId", "memberId");

ALTER TABLE "EventAttendance" DROP CONSTRAINT IF EXISTS "EventAttendance_eventId_fkey";
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventAttendance" DROP CONSTRAINT IF EXISTS "EventAttendance_memberId_fkey";
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Polls
CREATE TABLE IF NOT EXISTS "Poll" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PollOption" DROP CONSTRAINT IF EXISTS "PollOption_pollId_fkey";
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PollVote_pollId_memberId_key" ON "PollVote"("pollId", "memberId");

ALTER TABLE "PollVote" DROP CONSTRAINT IF EXISTS "PollVote_pollId_fkey";
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PollVote" DROP CONSTRAINT IF EXISTS "PollVote_optionId_fkey";
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PollVote" DROP CONSTRAINT IF EXISTS "PollVote_memberId_fkey";
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
