ALTER TABLE "message" ADD COLUMN "parts" JSONB, ADD COLUMN "feedback" INTEGER;
ALTER TABLE "message" ADD CONSTRAINT "Message_feedback_check" CHECK ("feedback" IS NULL OR "feedback" IN (-1, 1));
