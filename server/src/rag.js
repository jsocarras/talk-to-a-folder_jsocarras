import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`Missing env var: ${name}`);
  return process.env[name];
}

export function makeModels() {
  requireEnv("OPENAI_API_KEY");

  const llm = new ChatOpenAI({
    model: "gpt-4.1-mini",
    temperature: 0.2
  });

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small"
  });

  return { llm, embeddings };
}

function chunkText(text, chunkSize = 1200, overlap = 150) {
  const clean = (text || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const piece = clean.slice(start, end);
    chunks.push(piece);

    if (end === clean.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a));
}

function cosineSim(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

export async function buildVectorIndexFromFiles(filesWithText) {
  const { embeddings } = makeModels();

  const chunks = [];
  for (const f of filesWithText) {
    const parts = chunkText(f.text, 1200, 150);
    for (let i = 0; i < parts.length; i++) {
      chunks.push({
        text: parts[i],
        meta: {
          fileId: f.fileId,
          fileName: f.fileName,
          webViewLink: f.webViewLink,
          chunkIndex: i
        }
      });
    }
  }

  const texts = chunks.map((c) => c.text);
  const vectors = texts.length ? await embeddings.embedDocuments(texts) : [];

  return {
    chunks,
    vectors,
    docsCount: chunks.length
  };
}

function buildCitedContext(retrievedChunks) {
  const citations = retrievedChunks.map((c, idx) => {
    const n = idx + 1;
    return {
      n,
      fileId: c.meta.fileId,
      fileName: c.meta.fileName,
      url: c.meta.webViewLink,
      snippet: c.text.slice(0, 500)
    };
  });

  const context = retrievedChunks
    .map((c, idx) => {
      const n = idx + 1;
      return [
        `[${n}] File: ${c.meta.fileName || "Unknown"}`,
        "Content:",
        c.text
      ].join("\n");
    })
    .join("\n\n");

  return { context, citations };
}

export async function answerQuestionWithCitations({ rag, question }) {
  const { llm, embeddings } = makeModels();

  const qVec = await embeddings.embedQuery(question);

  // Score all chunks, pick top K
  const scored = rag.vectors.map((v, i) => ({
    i,
    score: cosineSim(qVec, v)
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 6).map((s) => rag.chunks[s.i]);

  const { context, citations } = buildCitedContext(top);

  const system = `
You are a precise assistant. Use ONLY the provided context.
If the answer is not in the context, say "I don't know."
When you state a fact, add citations using bracketed numbers like [1] or [2].
If multiple chunks support a claim, cite multiple like [1] [3].
Do not invent citations.
`.trim();

  const user = `
Context:
${context}

Question:
${question}
`.trim();

  const res = await llm.invoke([
    { role: "system", content: system },
    { role: "user", content: user }
  ]);

  return { answer: res.content, citations };
}
