import { google } from "googleapis";
import pdfParse from "pdf-parse";

export function parseDriveFolderId(folderUrlOrId) {
  const s = (folderUrlOrId || "").trim();

  // If user pastes just an ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s) && !s.includes("http")) return s;

  // Typical folder URL: https://drive.google.com/drive/folders/{FOLDER_ID}
  const m1 = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];

  // Sometimes: open?id={FOLDER_ID} or ...?id={FOLDER_ID}
  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];

  return null;
}

export function driveClientFromTokens(tokens) {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials(tokens);
  return google.drive({ version: "v3", auth: oauth2 });
}

export async function listFolderFiles(drive, folderId) {
  const files = [];
  let pageToken = undefined;

  // Note: For large folders, you will want pagination + progress updates.
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime, size)",
      pageSize: 100,
      pageToken
    });

    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

async function exportGoogleDocAsText(drive, fileId) {
  const res = await drive.files.export(
    { fileId, mimeType: "text/plain" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data).toString("utf-8");
}

async function exportGoogleSheetAsCsv(drive, fileId) {
  const res = await drive.files.export(
    { fileId, mimeType: "text/csv" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data).toString("utf-8");
}

async function downloadDriveFileBytes(drive, fileId) {
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data);
}

async function extractPdfText(pdfBytes) {
  const data = await pdfParse(pdfBytes);
  return data.text || "";
}

export function isSupportedMime(mimeType) {
  return (
    mimeType === "application/vnd.google-apps.document" ||
    mimeType === "application/vnd.google-apps.spreadsheet" ||
    mimeType === "application/pdf" ||
    mimeType === "text/plain"
  );
}

export async function fetchFileText(drive, file) {
  const { id, mimeType } = file;

  if (mimeType === "application/vnd.google-apps.document") {
    return await exportGoogleDocAsText(drive, id);
  }

  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return await exportGoogleSheetAsCsv(drive, id);
  }

  if (mimeType === "text/plain") {
    const bytes = await downloadDriveFileBytes(drive, id);
    return bytes.toString("utf-8");
  }

  if (mimeType === "application/pdf") {
    const bytes = await downloadDriveFileBytes(drive, id);
    return await extractPdfText(bytes);
  }

  return "";
}
