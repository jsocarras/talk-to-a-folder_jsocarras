import { describe, it, expect } from "vitest";
import { parseDriveFolderId } from "../src/drive.js";

describe("parseDriveFolderId", () => {
  it("parses /drive/folders/{id}", () => {
    const id = parseDriveFolderId("https://drive.google.com/drive/folders/abcDEF123_-");
    expect(id).toBe("abcDEF123_-");
  });

  it("parses ?id={id}", () => {
    const id = parseDriveFolderId("https://drive.google.com/open?id=xyz987_-AAA");
    expect(id).toBe("xyz987_-AAA");
  });

  it("accepts raw folder id", () => {
    const id = parseDriveFolderId("1a2b3c4d5e6f7g8h9i");
    expect(id).toBe("1a2b3c4d5e6f7g8h9i");
  });

  it("returns null for invalid input", () => {
    const id = parseDriveFolderId("not a drive link");
    expect(id).toBe(null);
  });
});
