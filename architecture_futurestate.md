flowchart LR

%% =========================
%% FUTURE STATE (PRODUCTION)
%% =========================
subgraph FUTURE["Future State (Production-Grade)"]
direction LR

%% -------- Clients --------
subgraph UI["Frontend (React)"]
  FE2["Web UI
  - Google sign-in
  - Workspaces
  - Drive picker or paste link
  - Ingest progress
  - Chat with filters
  - Source preview"]
end

%% -------- API Layer --------
subgraph API["API Layer (Node + Express or Fastify)"]
  APIR["REST API
  /auth
  /workspaces
  /workspaces/id/ingest
  /chat"]
  AUTH2["Auth and Workspace Context
  Session or JWT"]
end

%% -------- Persistence --------
subgraph DATA["Persistence Layer"]
  DB["Relational DB
  users
  workspaces
  files
  chunks
  chats"]
  VSTORE["Vector Store
  pgvector or Qdrant"]
  OBJ["Object Storage
  optional PDFs
  or Drive links only"]
end

%% -------- Async --------
subgraph ASYNC["Async Processing"]
  Q["Job Queue
  BullMQ or lightweight queue"]
  W["Ingestion Worker
  export text
  chunk
  embed
  upsert"]
end

%% -------- External Services --------
subgraph GOOGLE["Google APIs"]
  OAUTH2["OAuth 2.0"]
  DRIVE2["Drive API
  list folders
  export text
  download files"]
end

subgraph LLM["LLM Services"]
  EMBED2["Embedding Model
  text-embedding-3-small"]
  CHAT2["Chat Model
  gpt-4.1-mini or gpt-4.1"]
end

%% -------- Chat Orchestration --------
subgraph ORCH["Chat Orchestrator"]
  RET["Retriever
  vector search
  metadata filters"]
  GROUND["Grounded Answer Builder
  strict citations
  refusal when unsupported"]
  CACHE["Cache
  optional summaries
  frequent queries"]
end

%% =========================
%% FLOWS
%% =========================

%% Client to API
FE2 -->|HTTPS| APIR
APIR --> AUTH2

%% Auth flow
APIR --> OAUTH2
OAUTH2 -->|tokens| APIR
APIR --> DRIVE2

%% Workspace metadata
APIR -->|read and write| DB

%% Ingest pipeline
APIR -->|enqueue job| Q
Q --> W

W -->|list and export| DRIVE2
W -->|store chunk metadata| DB
W --> EMBED2
EMBED2 -->|vectors| VSTORE
W -->|optional raw files| OBJ

%% Chat pipeline
APIR -->|chat request| RET
RET -->|vector query| VSTORE
RET -->|file metadata| DB
RET --> GROUND
GROUND --> CHAT2
CHAT2 --> GROUND
GROUND -->|answer and citations| APIR
APIR --> FE2

%% Optional caching
RET <--> CACHE
GROUND <--> CACHE

%% Workspace isolation
DB -->|workspace scoped| RET

end
