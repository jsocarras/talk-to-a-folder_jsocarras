// In-memory per-session store.
// For production: replace with Redis, a DB, or durable object storage.
export const sessionRagStores = new Map();

/**
 * Get or create a session container.
 * @param {string} sid
 */
export function getSessionContainer(sid) {
  if (!sessionRagStores.has(sid)) {
    sessionRagStores.set(sid, {
      folderId: null,
      files: [],
      // { vectorStore, chunksMeta[] }
      rag: null
    });
  }
  return sessionRagStores.get(sid);
}
