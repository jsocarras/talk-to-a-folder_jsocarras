const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";

async function j(url, opts = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  me: () => j("/api/me"),
  ingest: (folderUrl) =>
    j("/api/ingest", {
      method: "POST",
      body: JSON.stringify({ folderUrl })
    }),
  chat: (question) =>
    j("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question })
    }),
  logout: () =>
    j("/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    }),
  authUrl: () => `${API_BASE}/auth/google`
};
