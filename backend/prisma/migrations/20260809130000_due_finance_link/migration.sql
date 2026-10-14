-- AlterTable
ALTER TABLE "FinanceEntry" ADD COLUMN "dueId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FinanceEntry_dueId_key" ON "FinanceEntry"("dueId");

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_dueId_fkey" FOREIGN KEY ("dueId") REFERENCES "Due"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mevcut ödenmiş aidatları gelir olarak ekle
INSERT INTO "FinanceEntry" (id, date, description, category, type, amount, "dueId", "createdAt", "updatedAt")
SELECT
  'duefin_' || d.id,
  CASE WHEN d."dueDate" <> '' THEN d."dueDate" ELSE to_char(d."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') END,
  'Aidat: ' || m."firstName" || ' ' || m."lastName",
  'Aidat',
  'gelir',
  d.amount,
  d.id,
  NOW(),
  NOW()
FROM "Due" d
JOIN "Member" m ON m.id = d."memberId"
WHERE d.status = 'odendi'
  AND NOT EXISTS (
    SELECT 1 FROM "FinanceEntry" f WHERE f."dueId" = d.id
  );
