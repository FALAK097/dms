-- AlterTable
ALTER TABLE "document" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "processingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "qstashMessageId" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "document_status_userId_idx" ON "document"("status", "userId");
