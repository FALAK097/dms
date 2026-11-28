-- Drop redundant index that duplicates the unique index on ("contentHash", "userId")
DROP INDEX IF EXISTS "document_contentHash_userId_idx";
