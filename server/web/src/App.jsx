import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

function CitationList({ citations }) {
  if (!citations?.length) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Citations</div>
      <ol style={{ paddingLeft: 18, margin: 0 }}>
        {citations.map((c) => (
          <li key={c.n} style={{ marginBottom: 10 }}>
            <div>
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.fileName}
              </a>
            </div>
            <div style={{ fontSize: 12, color: "#444", whiteSpace: "pre-wrap" }}>
              {c.snippet}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState({ authenticated: false });
  const [folderUrl, setFolderUrl] = useState("");
  const [ingestStatus, setIngestStatus] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe({ authenticated: false }));
  }, []);

  async function handleIngest() {
    setIngestStatus(null);
    setIngesting(true);
    try {
      const out = await api.ingest(folderUrl);
      setIngestStatus(out);
      setMessages([]);
    } catch (e) {
      setIngestStatus({ error: e.message });
    } finally {
      setIngesting(false);
    }
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q) return;

    setThinking(true);
    setQuestion("");

    const next = [...messages, { role: "user", content: q }];
    setMessages(next);

    try {
      const out = await api.chat(q);
      setMessages([
        ...next,
        {
          role: "assistant",
          content: out.answer,
          citations: out.citations
        }
      ]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `Error: ${e.message}`,
          citations: []
        }
      ]);
    } finally {
      setThinking(false);
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    setMe({ authenticated: false });
    setMessages([]);
    setIngestStatus(null);
  }

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16, fontFamily: "system-ui, Arial" }}>
      <h2 style={{ marginTop: 0 }}>Talk-to-a-Folder</h2>

      {!me.authenticated ? (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ marginBottom: 10 }}>
            Sign in with your Google account to grant Drive read access.
          </div>
          <a href={api.authUrl()}>
            <button type="button">Sign in with Google</button>
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "#333" }}>Authenticated</div>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>1) Paste a Google Drive folder link</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            disabled={!me.authenticated || ingesting}
          />
          <button type="button" onClick={handleIngest} disabled={!me.authenticated || ingesting}>
            {ingesting ? "Indexing..." : "Index folder"}
          </button>
        </div>

        {ingestStatus && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            {ingestStatus.error ? (
              <div style={{ color: "crimson" }}>{ingestStatus.error}</div>
            ) : (
              <div>
                Indexed {ingestStatus.indexedFiles} file(s), {ingestStatus.indexedChunks} chunk(s)
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>2) Ask questions</div>

        <div style={{ height: 340, overflow: "auto", border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
          {messages.length === 0 ? (
            <div style={{ color: "#666" }}>
              Paste a folder link, index it, then ask questions about the files in that folder.
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {m.role === "user" ? "You" : "Agent"}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            disabled={!me.authenticated || thinking}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAsk();
            }}
          />
          <button type="button" onClick={handleAsk} disabled={!me.authenticated || thinking}>
            {thinking ? "Thinking..." : "Send"}
          </button>
        </div>

        <CitationList citations={lastAssistant?.citations} />
      </div>
    </div>
  );
}
