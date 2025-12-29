flowchart LR

%% =========================
%% FUTURE STATE (PRODUCTION)
%% =========================
subgraph FUTURE["Future State (Production-Grade)"]
direction LR

%% -------- Clients --------
subgraph UI["Frontend (React)"]
  FE2["Web UI<br/>- Drive Picker (optional)<br/>- Workspaces list<br/>- Index progress<br/>- Chat + filters<br/>- Source preview"]
end

%% -------- API Layer --------
subgraph API["API (Node + Express)"]
  APIR["REST API<br/>/auth/*<br/>/workspaces<br/>/workspaces/:id/ingest<br/>/chat"]
  AUTH2["Auth + Tenant/Workspace Context<br/>Session or JWT"]
end

%% -------- Persistence --------
subgraph DATA["Persistence"]
  DB["Postgres (or SQLite for small deploy)<br/>users, workspaces, files, chunks, chats"]
  VSTORE["Vector Store<br/>(pgvector OR Qdrant)"]
  OBJ["Object Storage (optional)<br/>S3/GCS for PDFs)<br/>or Drive links only"]
end

%% -------- Async --------
subgraph ASYNC["Async Processing"]
  Q["Queue<br/>(BullMQ/Redis or simple worker)"]
  W["Ingestion Worker<br/>Parse/Export -> Chunk -> Embed -> Upsert"]
end

%% -------- External Services --------
subgraph GOOGLE["Google APIs"]
  OAUTH2["OAuth 2.0"]
  DRIVE2["Drive API<br/>List folder, export docs, download files"]
end

subgraph LLM["LLM Services"]
  EMBED2["Embeddings<br/>text-embedding-3-small"]
  CHAT2["Chat Model<br/>gpt-4.1-mini or gpt-4.1"]
end

%% -------- Chat Orchestrator --------
subgraph ORCH["Chat Orchestrator"]
  RET["Retriever<br/>vector search + metadata filters"]
  GROUND["Grounded Answer Builder<br/>strict citations + refusal"]
  CACHE["Cache Layer (optional)<br/>workspace summary, frequent queries"]
end

%% -------- Flows --------
FE2 -->|HTTPS| APIR
APIR --> AUTH2

APIR --> OAUTH2
OAUTH2 -->|tokens| APIR
APIR --> DRIVE2

%% Workspace creation + metadata
APIR -->|create/read| DB

%% Ingest as background job
APIR -->|enqueue ingest job| Q
Q --> W

%% Worker pipeline
W -->|list + fetch/export text| DRIVE2
W -->|chunk metadata| DB
W --> EMBED2
EMBED2 -->|vectors| VSTORE

%% Optional object storage for raw artifacts
W -->|store raw/pdf| OBJ

%% Chat flow
APIR -->|chat request| RET
RET -->|vector query| VSTORE
RET -->|metadata, file info| DB
RET --> GROUND
GROUND --> CHAT2
CHAT2 --> GROUND
GROUND -->|answer + citations| APIR
APIR --> FE2

%% Optional caching
RET <--> CACHE
GROUND <--> CACHE

%% Multi-workspace support
DB -->|workspace scoped| RET

end
