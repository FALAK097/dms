# DMS Project TODOs

## Configuration / Constants

- Vector similarity threshold: `0.6`
- Conversation context window: `20` previous messages
- Chat model: Google `gemini-3-flash-preview` (fallback: OpenAI `gpt-4o-mini`)
- OCR model: Google `gemini-3-flash-preview`
- Embedding model: Google `gemini-embedding-2` (fallback: OpenAI `text-embedding-3-small`)
- AI SDK: Vercel AI SDK v7 (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/react`)
- Markdown rendering: Streamdown
- Tokenizer: OpenAI tiktoken `cl100k_base`
- Max chunk tokens: `800`
- Available tools: `total_documents`, `find_document_by_name`
- Max file size: `500 MB`, max files per request: `50`
- Upload rate limit: `10` docs per `5` mins
- Download rate limit: `50` docs per `5` mins

## Learnings

### Vercel Cloudflare R2 Pre-Signed URLs for larger file uploads

1. Vercel on free tier allows a max of 4.5 MB file upload in a request body, so even though Cloudflare R2 can handle large file uploads it was failing.

    - 1.1. Client → Vercel API with file in body
    - 1.2. Vercel API → Cloudflare R2 upload
    - 1.3. Vercel API → Database save
    - 1.4. Vercel API → Client response

2. Then I added `presigned-urls`.

3. Current flow:

    - 3.1. Client → GET presigned URL from Vercel API
      └─ Request: { fileName, fileType, fileSize }
      └─ Response: { presignedUrl, key, publicUrl }

    - 3.2. Client → PUT file directly to Cloudflare R2 using presignedUrl
      └─ File NEVER touches Vercel servers

    - 3.3. Client → Confirm upload to Vercel API
      └─ Request: { files: [{ key, publicUrl, ... }] }
      └─ Vercel saves metadata to database

    - 3.4. Client → Trigger document processing (existing flow)

## Infrastructure Migration

- [X] Migrate from Upstash (QStash, Redis) to Cloudflare (Queues, KV)
- [X] Migrate from DigitalOcean Spaces to Cloudflare R2 for document storage
- [X] Migrate from Upstash Vector to Cloudflare Vectorize for embeddings
- [X] Remove all Upstash and DigitalOcean dependencies, env vars, and references
- [X] Add Cloudflare Worker (dms-jobs) with Queue, KV, Vectorize, and R2 bindings
- [X] Add signed URL support for secure R2 access without Cloudflare API token in Vercel

## Dashboard / Document Management

- [X] Implement file uploads from dashboard
- [X] Store uploaded files in Cloudflare R2
- [X] Save document metadata in Postgres (`Document` table)
- [X] Show upload progress and skeleton loading UI
- [X] Display the uploaded documents
- [X] Provide option to delete a document
- [X] Implement search, filter, and pagination for dashboard table
- [X] Add IndexedDB to queue document uploads (survives page refresh)

## Document Parsing / OCR

- [X] Gemini OCR
- [X] Store extracted text in `Document.extractedText`
- [X] Update document status to `READY` after successful parsing
- [X] Update status in UI, provide a refresh icon
- [X] Show a toast with doc name once OCR completes

## Vector Embeddings / Semantic Search

- [X] Split extracted text into chunks (~500–1000 tokens)
- [X] Generate embeddings using OpenAI embedding models
- [X] Store chunks and embeddings in Cloudflare Vectorize
- [X] Add vector deletion when user deletes a document
- [X] Mark `Document.embeddingsDone = true` after embeddings are stored

## Chat Functionality

- [X] Implement sending messages to Vercel AI SDK (GPT-4o-mini)
- [X] Initial Vercel AI SDK + Cloudflare Vectorize chat setup
- [X] Load all chats for the current user in sidebar (`Chat` table)
- [X] Save all messages in `Message` table (`USER` / `ASSISTANT`)
- [X] Store conversations in zustand for state management
- [X] Show attached doc for reference in chat
- [X] Add tool to get all documents & find documents by name
- [X] Fix tool calling when asking about documents from specific years (filtering)
- [X] Add conversation history for better context & responses
- [X] Make documents, chat, and vector search user-specific
- [ ] Improve source linking in chat responses
- [ ] Add Cloudflare KV for caching recent searches
- [ ] Avoid vector search for generic questions
- [ ] Improve prompt for better responses

## Dropbox Integration

- [X] Add Dropbox integration
- [X] Add "Sync Now" button in settings
- [X] Process new Dropbox files via webhook (batch/single)
- [X] Create separate General & Integrations tabs in settings
- [X] Allow users to choose which Dropbox folders to sync
- [X] Fix user identity switching when connecting a different Dropbox account
- [X] Test Dropbox access token refresh flow
- [ ] Deduplicate: document added via Dropbox not detected as duplicate when re-uploaded through platform
- [ ] Add Google Drive Integration

## UI Improvements

- [X] Fix sidebar hover (highlight only the hovered conversation)
- [X] Remove scrollbar in conversation list
- [X] Double-tap conversation to edit title
- [X] @-mention document search in chat
- [X] Fix folder upload blocking document table rendering
- [X] Make UI responsive on mobile devices
- [ ] Scroll to bottom on new messages
- [ ] Thinking animation for AI responses
- [ ] Auto-scroll to bottom when opening a chat
- [ ] Scroll-to-bottom button with smooth scroll
- [ ] Persist sidebar collapsed/expanded state
- [ ] Re-process failed documents (max 3 retries)
- [ ] Hide error details on document viewer
- [ ] Fix continuous GET /documents polling (use `use cache`)
- [ ] Preserve nuqs URL params when navigating back from detail view

## Additional Changes

- [X] Create Neon Postgres DB
- [X] Deploy to Vercel under subdomain
- [X] Create logo, favicon, SEO metadata, Open Graph image, robots.txt
- [X] Integrate Cloudflare Queues for background OCR/embeddings (Vercel has 5 min timeout)
- [X] Encrypt/restrict file access via signed URLs from Cloudflare R2
- [ ] ClamAV virus/malware scanning on upload
- [ ] Usage/stats page (OpenAI, Gemini OCR, Cloudflare costs)
- [ ] Add Uploadthing / Vercel Blob as alternative storage option alongside R2
- [ ] OTP verification
- [ ] Google OAuth login
- [ ] Landing page
- [ ] Cloudflare-backed dashboard search
- [ ] Pagination & chunking optimizations
- [ ] Comments & collaboration
- [ ] Search across all conversations
- [ ] Extract & display Document Type, Parties Involved, Date, Location
- [ ] Add tool to extract summary, determine document type, generate tags
