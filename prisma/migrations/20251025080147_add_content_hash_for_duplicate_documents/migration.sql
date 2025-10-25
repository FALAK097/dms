-- AlterTable
ALTER TABLE "document" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "document_contentHash_userId_idx" ON "document"("contentHash", "userId");
