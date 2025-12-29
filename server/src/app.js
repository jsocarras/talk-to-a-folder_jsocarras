import express from "express";
import session from "express-session";
import cors from "cors";

import { buildOAuthClient, getGoogleAuthUrl } from "./auth.js";
import { getSessionContainer } from "./sessionStore.js";
import {
  parseDriveFolderId,
  driveClientFromTokens,
  listFolderFiles,
  isSupportedMime,
  fetchFileText
} from "./drive.js";
import { buildVectorIndexFromFiles, answerQuestionWithCitations } from "./rag.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5173";

  app.use(
    cors({
      origin: WEB_ORIGIN,
      credentials: true
    })
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax"
      }
    })
  );

  function requireAuth(req, res, next) {
    if (!req.session?.googleTokens) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  }

  app.get("/auth/google", (req, res) => {
    const oauth2 = buildOAuthClient();
    const url = getGoogleAuthUrl(oauth2);
    res.redirect(url);
  });

  app.get("/auth/google/callback", async (req, res) => {
    try {
      const oauth2 = buildOAuthClient();
      const code = req.query.code;
      if (!code) return res.status(400).send("Missing code");

      const { tokens } = await oauth2.getToken(code);
      req.session.googleTokens = tokens;

      res.redirect(`${WEB_ORIGIN}/`);
    } catch (e) {
      console.error(e);
      res.status(500).send("OAuth callback failed");
    }
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/me", (req, res) => {
    const authed = Boolean(req.session?.googleTokens);
    res.json({ authenticated: authed });
  });

  app.post("/api/ingest", requireAuth, async (req, res) => {
    try {
      const { folderUrl } = req.body || {};
      const folderId = parseDriveFolderId(folderUrl);

      if (!folderId) {
        return res.status(400).json({ error: "Could not parse folder ID from the provided link" });
      }

      const drive = driveClientFromTokens(req.session.googleTokens);

      const files = await listFolderFiles(drive, folderId);
      const supported = files.filter((f) => isSupportedMime(f.mimeType));

      const filesWithText = [];
      for (const f of supported) {
        const text = await fetchFileText(drive, f);
        filesWithText.push({
          fileId: f.id,
          fileName: f.name,
          webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
          text
        });
      }

      const rag = await buildVectorIndexFromFiles(filesWithText);

      const sid = req.sessionID;
      const container = getSessionContainer(sid);

      container.folderId = folderId;
      container.files = supported.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`
      }));
      container.rag = rag;

      res.json({
        ok: true,
        folderId,
        indexedFiles: container.files.length,
        indexedChunks: rag.docsCount
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ingest failed", detail: String(e?.message || e) });
    }
  });

  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { question } = req.body || {};
      if (!question?.trim()) return res.status(400).json({ error: "Missing question" });

      const container = getSessionContainer(req.sessionID);

      if (!container?.rag) {
        return res.status(400).json({ error: "No folder indexed yet. Ingest a folder first." });
      }

      const out = await answerQuestionWithCitations({
        rag: container.rag,
        question: question.trim()
      });

      res.json(out);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Chat failed", detail: String(e?.message || e) });
    }
  });

  return app;
}
