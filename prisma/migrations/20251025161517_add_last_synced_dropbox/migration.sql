-- AlterTable
ALTER TABLE "user" ADD COLUMN     "dropboxCursorUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "dropboxWebhookCursor" TEXT;
