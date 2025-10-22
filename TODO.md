# DMS Project TODOs

## Dashboard / Document Management

- [X] Implement file uploads from dashboard
- [X] Store uploaded files in DigitalOcean Spaces (S3 compatible)
- [X] Save document metadata in Postgres (`Document` table)
- [X] Show upload progress and skeleton loading UI
- [X] Display the uploaded documents
- [X] Provide option to Delete a document
- [X] Implement search, filter, and pagination for dashboard table

## Document Parsing / OCR

- [X] Gemini OCR
- [X] Store extracted text in `Document.extractedText`
- [X] Update document status to `READY` after successful parsing
- [X] Update the status in UI, provide a refresh icon
- [X] Show a toast with doc name once OCR of particular document is done

## Vector Embeddings / Semantic Search

- [X] Split extracted text into chunks (~500–1000 tokens)
- [X] Generate embeddings using custom Openai embedding models
- [X] Store chunks and embeddings in Upstash Vector DB
- [X] Add vector deletion when user deletes a document
- [X] Mark `Document.embeddingsDone = true` after embeddings are stored

## Chat Functionality

- [X] Implement sending messages to Vercel AI SDK (GPT-4o-mini)
- [X] Initial Vercel AI SDK, Upstash Vector chat setup
- [X] Load all chats for the current user in sidebar (`Chat` table)
- [X] Save all messages in `Message` table (`USER` / `ASSISTANT`)
- [X] Store all conversations and add `zustand` for state management
- [X] Show attached doc for reference in chat
- [X] Add tool to get all the documents & find documents if their is no proper context
- [X] Fix to avoid tool calling when asking of docs of year 2022 (filtering)
- [ ] Add conversation history for better context & responses
- [ ] Add Upstash Redis for caching recent searches
- [ ] Avoid vector search for generic questions
- [ ] Improve Prompt for better response

## Chore TODO's

- [X] Add `nuqs` for state url management for documents table
- [X] Add support of @ tag in chat to know about particular document
- [ ] Prevent duplicate document uploads
- [ ] Implement streaming response and typing, thinking animation
- [ ] Scroll to bottom on new messages

## Integrations

- [ ] Add Dropbox Integration
- [ ] Add Drive Integration

## Additional Changes

- [ ] Integrate QStash to queue background OCR/embedding jobs
- [ ] Encrypt file URLs or restrict via signed URLs from DO Spaces
- [ ] Create a separate usage page that shows all stats (openai models, gemini ocr, upstash costs)
- [ ] Add Uploadthing & DO Spaces both options for document storing
- [ ] Create a DB in Neon or Supabase or PlanetScale
- [ ] Deploy to vercel under subdomain
- [ ] Add OTP Verification
- [ ] Add google login option
- [ ] Create a landing page
- [ ] Add Upstash Search for dashboard search
- [ ] Add pagination & chunking optimizations
