flowchart LR

%% =========================
%% CURRENT STATE (PROTOTYPE)
%% =========================
subgraph CURRENT["Current State (Prototype)"]
direction LR

%% -------- Client --------
subgraph UI["Frontend (React + Vite)"]
  FE["Talk-to-a-Folder Web UI
  - Google OAuth
  - Paste folder link
  - Index and Chat
  - Sources panel"]
end

%% -------- Backend --------
subgraph API["Backend (Node + Express)"]
  ROUTES["HTTP API
  /auth/google
  /auth/google/callback
  /api/me
  /api/ingest
  /api/chat"]
  SESSION["Session Store
  In-memory express-session"]
end

%% -------- External Services --------
subgraph GOOGLE["Google APIs"]
  OAUTH["OAuth 2.0
  Drive read-only scope"]
  DRIVE["Google Drive API
  list files and export content"]
end

subgraph LLM["LLM Services"]
  EMBED["Embedding Model
  text-embedding-3-small"]
  CHAT["Chat Model
  gpt-4.1-mini"]
end

%% -------- In-memory Retrieval --------
subgraph RAG["RAG In-Memory"]
  CHUNK["Text Chunker
  ~1200 chars overlap"]
  VEC["Vectors and metadata
  stored in memory"]
  SIM["Cosine similarity
  top K chunks"]
  CITE["Citation builder
  numbered sources"]
end

%% -------- Wires --------
FE -->|HTTPS with cookies| ROUTES
ROUTES --> SESSION

ROUTES -->|OAuth redirect| OAUTH
OAUTH -->|access tokens| ROUTES

ROUTES -->|authorized client| DRIVE
DRIVE -->|file list| ROUTES
DRIVE -->|exported text| ROUTES

ROUTES -->|ingest request| CHUNK
CHUNK -->|text chunks| EMBED
EMBED -->|vectors| VEC

ROUTES -->|chat request| SIM
SIM -->|top chunks| CITE
CITE -->|grounded context| CHAT
CHAT -->|answer text| ROUTES
ROUTES -->|answer and citations| FE

end
