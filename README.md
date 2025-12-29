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

- Frontend: React + Vite
- Backend: Node.js + Express
- Auth: Google OAuth 2.0
- Embeddings + Chat: OpenAI
- Storage: In-memory (resets on server restart)

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

### Frontend (`web/.env`)

Create a `.env` file in the `web/` directory:

VITE_API_BASE=http://localhost:8787

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
5. Ask questions
6. Expand Sources under answers to view citations

---

## Supported File Types

- Google Docs
- Google Sheets
- PDF files
- Plain text files

---

## Tests

This repo includes a lightweight backend test suite that covers:
- Unit tests for Drive folder ID parsing
- API smoke tests for auth-gated endpoints (for example, ingest returns 401 when not authenticated)

### Run tests

From the project root:

cd server  
npm test  

### Watch mode

cd server  
npm run test:watch  

Notes:
- These tests do not call Google or OpenAI.
- They are fast and deterministic.
- For end-to-end testing of Drive ingestion, run the app locally and index a folder you have access to.

---

## Notes and Limitations

- Index is stored in memory
- Restarting backend clears indexes
- Read-only Drive access

---
