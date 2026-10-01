import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import { chunkText } from "./ai/materialProcessor";
import { updateMaterialJob, updateMaterialProcessing } from "./db";

export type UploadedMaterial = {
  userId: number;
  materialId: number;
  jobId: number;
  kind: "pdf" | "docx";
  buffer: Buffer;
};

function detectLanguage(text: string) {
  if (/[^\u0000-\u007f]/.test(text)) return /[\u0600-\u06ff]/.test(text) ? "ar" : "multilingual";
  return "en";
}

async function extractPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();
    const result = await parser.getText();
    return { text: result.text.trim(), pageCount: info.total };
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim(), pageCount: undefined };
}

export async function processUploadedMaterial(input: UploadedMaterial) {
  await updateMaterialJob(input.userId, input.jobId, { status: "running", attempts: 1 });
  await updateMaterialProcessing(input.userId, input.materialId, { status: "extracting" });
  try {
    const extracted = input.kind === "pdf" ? await extractPdf(input.buffer) : await extractDocx(input.buffer);
    if (!extracted.text || extracted.text.length < 20) {
      await updateMaterialProcessing(input.userId, input.materialId, { status: "needs_review", pageCount: extracted.pageCount, detectedLanguage: "unknown", errorCode: "INSUFFICIENT_TEXT", errorMessage: "The file did not contain enough readable text. It may be scanned or empty." });
      await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
      return;
    }
    await updateMaterialProcessing(input.userId, input.materialId, { status: "indexing", textContent: extracted.text, pageCount: extracted.pageCount, detectedLanguage: detectLanguage(extracted.text) });
    const chunks = chunkText(extracted.text);
    if (!chunks.length) throw new Error("EMPTY_CHUNK_INDEX");
    await updateMaterialProcessing(input.userId, input.materialId, { status: "indexed", textContent: extracted.text, pageCount: extracted.pageCount, detectedLanguage: detectLanguage(extracted.text) });
    await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    await updateMaterialProcessing(input.userId, input.materialId, { status: "failed", errorCode: "EXTRACTION_FAILED", errorMessage: message });
    await updateMaterialJob(input.userId, input.jobId, { status: "failed", errorMessage: message });
  }
}

export function enqueueMaterialProcessing(input: UploadedMaterial) {
  setImmediate(() => { void processUploadedMaterial(input); });
}
