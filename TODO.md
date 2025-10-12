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

- [ ] Split extracted text into chunks (~500–1000 tokens)
- [ ] Generate embeddings using OpenAI embeddings (or chosen embedding model)
- [ ] Store chunks and embeddings in Upstash Vector DB
- [ ] Mark `Document.embeddingsDone = true` after embeddings are stored

## Chat Functionality

- [ ] Load all chats for the current user in sidebar (`Chat` table)
- [ ] Create new chat linked to a document when clicking “Chat” on a document row
- [ ] Implement sending messages to Vercel AI SDK (GPT-4o-mini)
- [ ] Pass top relevant chunks as context to AI for document-specific questions
- [ ] Show attached doc for reference in chat
- [ ] Save all messages in `Message` table (`USER` / `ASSISTANT`)
- [ ] Implement streaming response and typing animation
- [ ] Scroll to bottom on new messages
