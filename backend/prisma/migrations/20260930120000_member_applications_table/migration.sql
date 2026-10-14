-- Separate applications from members
CREATE TABLE IF NOT EXISTS "MemberApplication" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "profession" TEXT NOT NULL DEFAULT '',
    "nationalId" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'beklemede',
    "rejectReason" TEXT NOT NULL DEFAULT '',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MemberApplication_nationalId_idx" ON "MemberApplication"("nationalId");
CREATE INDEX IF NOT EXISTS "MemberApplication_status_idx" ON "MemberApplication"("status");

-- Move pending/rejected rows out of Member
INSERT INTO "MemberApplication" (
  "id", "firstName", "lastName", "phone", "email", "address", "profession",
  "nationalId", "birthDate", "passwordHash", "status", "rejectReason",
  "appliedAt", "createdAt", "updatedAt"
)
SELECT
  "id", "firstName", "lastName", "phone", "email", "address", "profession",
  "nationalId", "birthDate", COALESCE(NULLIF("passwordHash", ''), 'x'), "status",
  COALESCE("rejectReason", ''),
  COALESCE("appliedAt", "createdAt"), "createdAt", "updatedAt"
FROM "Member"
WHERE "status" IN ('beklemede', 'reddedildi')
ON CONFLICT ("id") DO NOTHING;

DELETE FROM "Member" WHERE "status" IN ('beklemede', 'reddedildi');

ALTER TABLE "Member" ALTER COLUMN "status" SET DEFAULT 'aktif';

-- Drop application-only columns from Member (if present)
ALTER TABLE "Member" DROP COLUMN IF EXISTS "rejectReason";
ALTER TABLE "Member" DROP COLUMN IF EXISTS "appliedAt";
