-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING';
