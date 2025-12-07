/*
  Warnings:

  - A unique constraint covering the columns `[contentHash,userId]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "document_contentHash_userId_key" ON "document"("contentHash", "userId");
