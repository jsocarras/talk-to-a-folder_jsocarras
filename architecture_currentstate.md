flowchart LR

%% =========================
%% CURRENT STATE (DEPLOYED PROTOTYPE)
%% =========================
subgraph CURRENT["Current State (Deployed Prototype)"]
direction LR

%% -------- Client / Hosting --------
subgraph UI["Frontend (React + Vite) hosted on Vercel"]
  FE["Talk-to-a-Folder Web UI
  - Sign in with Google
  - Paste Drive folder link
  - Index and Chat
  - Sources panel"]
end

%% -------- Backend / Hosting --------
subgraph API["Backend (Node + Express) hosted on Render"]
  ROUTES["HTTP API
  GET /auth/google
  GET /auth/google/callback
  GET /api/me
  POST /api/ingest
  POST /api/chat
  POST /auth/logout"]
  SESSION["Session cookie
  express-session in-memory store
  holds google tokens"]
end

%% -------- External Services --------
subgraph GOOGLE["Google APIs"]
  OAUTH["OAuth 2.0
  Drive read-only scope"]
  DRIVE["Google Drive API
  list files and export text"]
end

subgraph LLM["LLM Services"]
  EMBED["Embedding Model
  text-embedding-3-small"]
  CHAT["Chat Model
  gpt-4.1-mini"]
end

%% -------- RAG (in-memory) --------
subgraph RAG["RAG In-Memory (per server instance)"]
  CHUNK["Text chunker
  ~1200 chars overlap 150"]
  VEC["Vector index
  embeddings plus metadata"]
  RET["Retriever
  similarity top K"]
  CITE["Citation builder
  numbered sources plus links"]
end

%% =========================
%% AUTH FLOW
%% =========================
FE -->|user clicks sign in| ROUTES
ROUTES -->|redirect to google| OAUTH
OAUTH -->|callback with code| ROUTES
ROUTES -->|store tokens in session| SESSION
ROUTES -->|redirect back to web origin| FE

%% =========================
%% INGEST FLOW
%% =========================
FE -->|POST ingest folder link| ROUTES
ROUTES -->|read tokens from session| SESSION
ROUTES -->|list files and export text| DRIVE
DRIVE -->|file list| ROUTES
DRIVE -->|exported text| ROUTES
ROUTES -->|send text| CHUNK
CHUNK -->|chunks| EMBED
EMBED -->|vectors| VEC

%% =========================
%% CHAT FLOW
%% =========================
FE -->|POST question| ROUTES
ROUTES -->|read tokens from session| SESSION
ROUTES -->|retrieve top chunks| RET
RET -->|top chunks| CITE
CITE -->|grounded context| CHAT
CHAT -->|answer text| ROUTES
ROUTES -->|answer and citations| FE

end
