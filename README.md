# Talk-to-a-Folder

Talk-to-a-Folder is a lightweight web application that lets you authenticate with Google, index a Google Drive folder, and ask questions across all files in that folder with grounded citations.

The system:
- Authenticates via Google OAuth
- Reads files from a Drive folder you have access to
- Extracts text from Docs, Sheets, PDFs, and text files
- Builds an in-memory semantic index
- Answers questions with citations linking back to source files

This is a prototype designed for clarity, speed, and extensibility.

---

## Architecture

### Current State (Deployed Prototype)

- Frontend: React + Vite (hosted on Vercel)
- Backend: Node.js + Express (hosted on Render)
- Auth: Google OAuth 2.0 (Drive read-only scope)
- Embeddings + Chat: OpenAI
- Session storage: In-memory express-session (server-side)
- Vector index: In-memory (resets on server restart)

High-level flow:
1. User signs in with Google via the backend OAuth endpoint
2. Google redirects back to the backend callback
3. Backend stores tokens in an in-memory session and redirects to the frontend
4. User submits a Drive folder link
5. Backend lists files, exports text, chunks, embeds, and stores vectors in memory
6. User asks questions; backend retrieves relevant chunks and generates grounded answers with citations

---

## Prerequisites

- Node.js 20 or newer
- npm
- A Google Cloud project with OAuth credentials
- An OpenAI API key

---

## Environment Variables

### Backend (`server/.env`)

Create a `.env` file in the `server/` directory:

OPENAI_API_KEY=your_openai_api_key

GOOGLE_CLIENT_ID=your_google_client_id  
GOOGLE_CLIENT_SECRET=your_google_client_secret  
GOOGLE_REDIRECT_URI=http://localhost:8787/auth/google/callback  

SESSION_SECRET=replace_me_with_any_random_string  
WEB_ORIGIN=http://localhost:5173  
PORT=8787  

When deployed:
- GOOGLE_REDIRECT_URI should point to the Render backend callback URL
- WEB_ORIGIN should point to the Vercel frontend URL

---

### Frontend (`web/.env`)

Create a `.env` file in the `web/` directory:

VITE_API_BASE=http://localhost:8787

When deployed:
- VITE_API_BASE should point to the Render backend base URL

---

## Installing Dependencies

Backend:

cd server  
npm install  

Frontend:

cd web  
npm install  

---

## Running the App Locally

Terminal 1 (backend):

cd server  
npm run dev  

Terminal 2 (frontend):

cd web  
npm run dev  

Open the printed localhost URL in your browser.

---

## How to Use

1. Open the frontend
2. Authenticate with Google
3. Paste a Google Drive folder link
4. Click Index folder
5. Ask questions about the folder contents
6. Expand Sources under answers to view citations and open the original files in Drive

---

## Supported File Types

- Google Docs
- Google Sheets
- PDF files
- Plain text files

Unsupported file types are ignored during ingestion.

---

## Tests

This repo includes a lightweight backend test suite that covers:
- Unit tests for Drive folder ID parsing
- API smoke tests for auth-gated endpoints

### Run tests

From the project root:

cd server  
npm test  

### Watch mode

cd server  
npm run test:watch  

Notes:
- To start, tests are intentionally simple so they are fast and deterministic
- Test coverage could be expanded.. for example, tests do not yet call Google APIs or OpenAI
- For end-to-end testing of Drive ingestion, run the app locally and index a folder you have access to

---

## Notes and Limitations

- Index and embeddings are stored in memory
- Restarting the backend clears all indexes and sessions
- Users may need to re-authenticate after a backend restart
- Drive access is read-only; no files are modified

---

## Future Improvements

- Persistent vector storage
- Background ingestion jobs with progress reporting
- Incremental re-indexing on file changes
- Multi-workspace support
- More granular citations (page numbers, sheet tabs)
