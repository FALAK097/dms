# DMS Project TODOs

- Threshold of `0.6` for vector filter
- Context of `20` previous messages in an conversation
- Openai `gpt-4o-mini` model for `Chat`
- Google `gemini-2.0-flash-001` model for `OCR`
- Openai `text-embedding-3-small` model for `Vector Embeddings`
- Openai tiktoken `cl100k_base`
- Max chunks token `800`
- Tools `total_documents`, `find_document_by_name`
- Max file size `500 mb` and `50` max files per request

## Learnings

### Vercel DO Spaces Pre-Signed Urls for allowing larger file uploads

1. Vercel on free tier allows a max of 4.5mb file upload in a request body, so even though DO Spaces can handle large file uploads it was failing.

    - 1.1. Client → Vercel API with file in body

    - 1.2. Vercel API → DO Spaces upload

    - 1.3. Vercel API → Database save

    - 1.4. Vercel API → Client response

2. Their I added `presigned-urls`.
3. New flow

    - 3.1. Client → GET presigned URL from Vercel API
      └─ Request: { fileName, fileType, fileSize }
      └─ Response: { presignedUrl, key, publicUrl }

    - 3.2. Client → PUT file directly to DO Spaces using presignedUrl
      └─ File NEVER touches Vercel servers
      └─ Uses AWS signed authentication

    - 3.3. Client → Confirm upload to Vercel API
      └─ Request: { files: [{ key, publicUrl, ... }] }
      └─ Vercel saves metadata to database

    - 3.4. Client → Trigger document processing (existing flow)

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
- [X] Add conversation history for better context & responses
- [X] Make sure documents & chat, vector search are user specific
- [ ] Improve the source linking
- [ ] Add Upstash Redis for caching recent searches
- [ ] Avoid vector search for generic questions
- [ ] Improve Prompt for better response

## Chore TODO's

- [X] Add `nuqs` for state url management for documents table
- [X] Add support of @ tag in chat to know about particular document
- [X] Implement streaming response
- [X] Detail document page, where document can be viewed & change the sources link in chat
- [X] Add presigned urls for direct DO Spaces upload for large document uploads
- [X] Prevent duplicate document uploads (through content hashing SHA256)
- [X] Add "Sync Now" button in settings
- [X] Once new document are added to Dropbox get them through a webhook and process it (Maybe batch or single)
- [X] Create a separate General & Integrations tab in settings
- [X] I am logged in with 1 email & try to connect Dropbox which is of different account then their is a separate User created for that and I get logged in with that account
- [X] Test the accessToken expires refresh works or not
- [X] Allow users to choose which Dropbox folders to sync - (Selected folder id is stored, the chooser script works but, Folder selected is not displayed, files from outside those folder are also processed)
- [X] Fix ui on mobile devices & make it responsive for all pages
- [ ] Search across all conversations
- [ ] Extract & display Document Type, Parties Involved, Date, Location
- [ ] Add tool to extract summary, determine type of document, & generate tags & display all this
- [ ] Document is added through dropbox & if I upload same document through platform it doesn't detect duplication

## UI Improvements

- [X] When hover over sidebar all conversations lists get's highlighted instead only specific conversation should be highlighted
- [X] Remove scrollbar in conversation list
- [X] Double Tap conversation to edit it
- [X] When I do @ and type that document should come up
- [ ] Scroll to bottom on new messages
- [ ] Thinking animation
- [ ] When a chat is opened it should always scroll to bottom for allowing Input
- [ ] A scroll to bottom icon with smooth scroll
- [ ] Store the state of sidebar collapsed or not
- [ ] For failed processed document provide an option to re-process with max 3 retries
- [ ] Fix the issue where entire folder is uploaded it blocks the docs rendering on table and if User refreshes it fails the document processing and docs remain in PENDING state
- [ ] Do not display the error on document viewer
- [ ] Fix issue where the GET /documents route is being called continuously (make use of `use cache` directives)
- [ ] When back button is clicked from detailed document viewer it redirects to /dashboard and does not maintain the nuqs url params

## Integrations

- [X] Add Dropbox Integration
- [ ] Add Drive Integration

## Additional Changes

- [X] Create a DB in Neon
- [X] Deploy to vercel under subdomain
- [ ] Make use of <https://docs.clamav.net/manual/Usage/Scanning.html> for scanning documents for viruses, malware
- [ ] Create a logo, favicon, seo metadate, opengrapgh image, robots.txt
- [ ] Integrate QStash to queue background OCR/embedding jobs
- [ ] Encrypt file URLs or restrict via signed URLs from DO Spaces
- [ ] Create a separate usage page that shows all stats (openai models, gemini ocr, upstash costs)
- [ ] Add Uploadthing Vercel Blob storage & DO Spaces both options for document storing
- [ ] Add OTP Verification
- [ ] Add google login option with Last Used
- [ ] Create a landing page
- [ ] Add Upstash Search for dashboard search
- [ ] Add pagination & chunking optimizations
- [ ] Ability to add comments & collaborate with team members
