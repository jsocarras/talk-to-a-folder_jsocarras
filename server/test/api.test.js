import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("API smoke tests", () => {
  it("GET /api/me returns authenticated=false when not signed in", async () => {
    const app = createApp();
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  it("POST /api/ingest returns 401 when not authenticated", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/ingest")
      .send({ folderUrl: "https://drive.google.com/drive/folders/abcDEF123_-" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not authenticated");
  });

  it("POST /api/chat returns 401 when not authenticated", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/chat")
      .send({ question: "hello" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not authenticated");
  });
});
