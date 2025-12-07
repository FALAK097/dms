/*
  Warnings:

  - A unique constraint covering the columns `[contentHash,userId]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/
-- Delete older duplicate documents, keeping the most recent one for each (contentHash, userId) pair
DELETE FROM "document" d1
WHERE "contentHash" IS NOT NULL
  AND id NOT IN (
    SELECT id
    FROM "document" d2
    WHERE d2."contentHash" = d1."contentHash"
      AND d2."userId" = d1."userId"
    ORDER BY d2."createdAt" DESC
    LIMIT 1
  );

-- CreateIndex
CREATE UNIQUE INDEX "document_contentHash_userId_key" ON "document"("contentHash", "userId");
