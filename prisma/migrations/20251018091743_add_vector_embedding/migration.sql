-- AlterTable
ALTER TABLE "document" ADD COLUMN     "chunkCount" INTEGER,
ADD COLUMN     "embeddingsDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "embeddingsError" TEXT;
