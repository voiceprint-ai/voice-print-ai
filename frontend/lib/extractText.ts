"use client";

/**
 * Client-side text extraction for reference-sample uploads.
 *
 * Runs entirely in the browser — no file is ever sent to the backend as
 * binary data; only the extracted plain text is (via addSample in api.ts).
 * This is exactly the plan discussed with the team: mammoth.js for .docx,
 * pdf.js for text-based .pdf, plain read for .txt. Scanned/image-only PDFs
 * are explicitly out of scope (would need OCR) and produce a clear error
 * instead of silently returning nothing.
 *
 * @author Saamarth Attray
 */
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Configure the PDF.js worker once, client-side only. Version must match the
// installed pdfjs-dist version (see package.json) — the CDN path fails closed
// (throws) rather than silently using a mismatched worker if it doesn't.
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export class UnsupportedFileError extends Error {}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — generous for text documents

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

async function extractFromTxt(file: File): Promise<string> {
  return file.text();
}

async function extractFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  const text = pageTexts.join("\n\n").trim();
  if (!text) {
    throw new UnsupportedFileError(
      "This PDF doesn't contain extractable text — it may be a scanned image. Try pasting the text directly instead.",
    );
  }
  return text;
}

/**
 * Extract plain text from a File based on its extension.
 * Throws UnsupportedFileError with a user-safe message on any failure.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new UnsupportedFileError("That file is too large. Try something under 15MB.");
  }

  const ext = extensionOf(file.name);
  try {
    switch (ext) {
      case "txt":
        return await extractFromTxt(file);
      case "docx":
        return await extractFromDocx(file);
      case "pdf":
        return await extractFromPdf(file);
      default:
        throw new UnsupportedFileError(
          `".${ext || "unknown"}" isn't supported yet — try .txt, .docx, or .pdf.`,
        );
    }
  } catch (err) {
    if (err instanceof UnsupportedFileError) throw err;
    throw new UnsupportedFileError(
      "Couldn't read that file. It may be corrupted or password-protected.",
    );
  }
}