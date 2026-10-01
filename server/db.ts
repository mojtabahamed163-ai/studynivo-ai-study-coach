import { and, asc, desc, eq, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, flashcards, materials, quizAnswers, quizAttempts, savedItems, studySessions, subjects, topics, users, userProfiles } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { chunkText, selectRelevantChunks } from "./ai/materialProcessor";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listSubjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.createdAt));
}

export async function createSubject(userId: number, input: { name: string; examDate?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `subject-${Date.now()}`;
  const result = await db.insert(subjects).values({ userId, name: input.name.trim(), slug, examDate: input.examDate ? new Date(`${input.examDate}T00:00:00`) : null, color: input.color ?? "#0f766e" });
  const id = Number(result[0].insertId);
  return db.select().from(subjects).where(and(eq(subjects.id, id), eq(subjects.userId, userId))).limit(1).then((rows) => rows[0]);
}

export async function getSubject(userId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subject = await db.select().from(subjects).where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId))).limit(1);
  if (!subject[0]) return undefined;
  const [subjectMaterials, subjectTopics] = await Promise.all([
    db.select().from(materials).where(and(eq(materials.subjectId, subjectId), eq(materials.userId, userId))).orderBy(desc(materials.createdAt)),
    db.select().from(topics).where(and(eq(topics.subjectId, subjectId), eq(topics.userId, userId))).orderBy(asc(topics.createdAt)),
  ]);
  return { ...subject[0], materials: subjectMaterials, topics: subjectTopics };
}

export async function addTextMaterial(userId: number, input: { subjectId: number; name: string; kind: string; textContent: string; sourceRef?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId))).limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const result = await db.insert(materials).values({ userId, subjectId: input.subjectId, name: input.name, kind: input.kind, textContent: input.textContent, sourceRef: input.sourceRef ?? "Notes", status: "indexed", sizeBytes: Buffer.byteLength(input.textContent, "utf8") });
  const rows = await db.select().from(materials).where(and(eq(materials.id, Number(result[0].insertId)), eq(materials.userId, userId))).limit(1);
  return rows[0];
}

export async function saveTopicInsights(userId: number, subjectId: number, insights: Array<{ name: string; note: string; sourceRef: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId))).limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const existing = await db.select({ name: topics.name }).from(topics).where(and(eq(topics.subjectId, subjectId), eq(topics.userId, userId)));
  const names = new Set(existing.map((topic) => topic.name.trim().toLocaleLowerCase()));
  const fresh = insights.filter((item) => item.name.trim() && !names.has(item.name.trim().toLocaleLowerCase())).slice(0, 80);
  if (fresh.length) await db.insert(topics).values(fresh.map((item) => ({ userId, subjectId, name: item.name.trim().slice(0, 180), note: item.note.trim(), sourceRef: item.sourceRef.trim().slice(0, 255) })));
  return fresh.length;
}

export async function createStudySession(userId: number, input: { subjectId: number; topicId?: number; durationMinutes: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId))).limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  if (input.topicId) {
    const topicOwner = await db.select({ id: topics.id }).from(topics).where(and(eq(topics.id, input.topicId), eq(topics.subjectId, input.subjectId), eq(topics.userId, userId))).limit(1);
    if (!topicOwner[0]) throw new Error("Topic does not belong to this subject");
  }
  const result = await db.insert(studySessions).values({ userId, subjectId: input.subjectId, topicId: input.topicId ?? null, durationMinutes: input.durationMinutes, status: "active" });
  const rows = await db.select().from(studySessions).where(and(eq(studySessions.id, Number(result[0].insertId)), eq(studySessions.userId, userId))).limit(1);
  return rows[0];
}

export async function updateStudySession(userId: number, sessionId: number, input: { elapsedSeconds: number; status: "active" | "paused" | "completed" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(studySessions).set({ elapsedSeconds: input.elapsedSeconds, status: input.status, completedAt: input.status === "completed" ? new Date() : null }).where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId)));
  const rows = await db.select().from(studySessions).where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))).limit(1);
  return rows[0];
}

export async function addSavedItem(userId: number, input: { subjectId: number; title: string; excerpt?: string; sourceRef?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId))).limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const result = await db.insert(savedItems).values({ userId, subjectId: input.subjectId, title: input.title, excerpt: input.excerpt ?? null, sourceRef: input.sourceRef ?? null });
  const rows = await db.select().from(savedItems).where(and(eq(savedItems.id, Number(result[0].insertId)), eq(savedItems.userId, userId))).limit(1);
  return rows[0];
}

export async function listDueFlashcardsForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(flashcards).where(and(eq(flashcards.userId, userId), lte(flashcards.nextReviewAt, new Date()))).orderBy(asc(flashcards.nextReviewAt));
}

export async function listFlashcards(userId: number, subjectId: number, dueOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId))).limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const rows = await db.select().from(flashcards).where(and(eq(flashcards.subjectId, subjectId), eq(flashcards.userId, userId))).orderBy(asc(flashcards.nextReviewAt));
  return dueOnly ? rows.filter((card) => card.nextReviewAt <= new Date()) : rows;
}

export async function generateFlashcardsFromTopics(userId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subject = await getSubject(userId, subjectId);
  if (!subject) throw new Error("Subject not found");
  const existing = await db.select({ topicId: flashcards.topicId }).from(flashcards).where(and(eq(flashcards.subjectId, subjectId), eq(flashcards.userId, userId)));
  const existingTopics = new Set(existing.map((card) => card.topicId).filter(Boolean));
  const fresh = subject.topics.filter((topic) => !existingTopics.has(topic.id)).slice(0, 50).map((topic) => ({ userId, subjectId, topicId: topic.id, front: `What should you remember about ${topic.name}?`, back: topic.note || `Review ${topic.name} using the source-linked material before testing yourself.`, sourceRef: topic.sourceRef || null, difficulty: topic.mastery < 50 ? "hard" as const : topic.mastery < 75 ? "medium" as const : "easy" as const }));
  if (fresh.length) await db.insert(flashcards).values(fresh);
  return listFlashcards(userId, subjectId);
}

export async function reviewFlashcard(userId: number, input: { cardId: number; confidence: "low" | "medium" | "high"; correct: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(flashcards).where(and(eq(flashcards.id, input.cardId), eq(flashcards.userId, userId))).limit(1);
  const card = rows[0];
  if (!card) throw new Error("Flashcard not found");
  const intervalDays = input.correct ? Math.min(30, Math.max(1, card.intervalDays * (input.confidence === "high" ? 2 : input.confidence === "medium" ? 1 : 1))) : 1;
  const nextReviewAt = new Date(Date.now() + intervalDays * 86400000);
  await db.update(flashcards).set({ confidence: input.confidence, intervalDays, nextReviewAt, lastReviewedAt: new Date(), mistakeCount: input.correct ? card.mistakeCount : card.mistakeCount + 1 }).where(and(eq(flashcards.id, input.cardId), eq(flashcards.userId, userId)));
  return db.select().from(flashcards).where(and(eq(flashcards.id, input.cardId), eq(flashcards.userId, userId))).limit(1).then((result) => result[0]);
}

export async function createQuizAttempt(userId: number, subjectId: number, kind: "practice" | "mock") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subject = await getSubject(userId, subjectId);
  if (!subject) throw new Error("Subject not found");
  const topicsForQuiz = (kind === "practice" ? subject.topics.filter((topic) => topic.isWeak || topic.mastery < 70) : subject.topics).slice(0, 10);
  const questions = (topicsForQuiz.length ? topicsForQuiz : subject.topics).map((topic) => ({ topicId: topic.id, topic: topic.name, prompt: `Which action best checks reliable recall of ${topic.name}?`, options: ["Read it once", "Explain it and answer a new question", "Skip it until the exam"], answer: "Explain it and answer a new question", sourceRef: topic.sourceRef || "Subject material" }));
  if (!questions.length) throw new Error("NO_INDEXED_TOPICS");
  const result = await db.insert(quizAttempts).values({ userId, subjectId, kind, questions, total: questions.length });
  return db.select().from(quizAttempts).where(and(eq(quizAttempts.id, Number(result[0].insertId)), eq(quizAttempts.userId, userId))).limit(1).then((rows) => rows[0]);
}

export async function answerQuizQuestion(userId: number, input: { attemptId: number; questionIndex: number; answer: string; confidence: "low" | "medium" | "high" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(quizAttempts).where(and(eq(quizAttempts.id, input.attemptId), eq(quizAttempts.userId, userId))).limit(1);
  const attempt = rows[0];
  if (!attempt || attempt.status !== "active") throw new Error("Quiz attempt not active");
  const questions = attempt.questions as Array<{ answer: string }>;
  const question = questions[input.questionIndex];
  if (!question) throw new Error("Question not found");
  const isCorrect = question.answer === input.answer;
  await db.insert(quizAnswers).values({ userId, attemptId: input.attemptId, questionIndex: input.questionIndex, answer: input.answer, confidence: input.confidence, isCorrect });
  const answers = await db.select().from(quizAnswers).where(and(eq(quizAnswers.attemptId, input.attemptId), eq(quizAnswers.userId, userId)));
  const completed = answers.length >= attempt.total;
  const score = answers.filter((answer) => answer.isCorrect).length;
  await db.update(quizAttempts).set({ score, status: completed ? "completed" : "active", completedAt: completed ? new Date() : null }).where(and(eq(quizAttempts.id, input.attemptId), eq(quizAttempts.userId, userId)));
  return { isCorrect, score, total: attempt.total, completed };
}

export async function searchSubjectMaterials(userId: number, subjectId: number, query: string, limit = 8) {
  const subject = await getSubject(userId, subjectId);
  if (!subject) throw new Error("Subject not found");
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const searchable = subject.materials.flatMap((material) => {
    if (!material.textContent || material.status !== "indexed") return [];
    return selectRelevantChunks(chunkText(material.textContent), normalizedQuery, limit).map((chunk) => {
      const timestamp = material.kind === "audio" ? chunk.text.match(/\[(\d+:\d{2})\]/)?.[1] : undefined;
      const page = (material.sourceRef || material.name).match(/(?:page|p\.?|صفحة)\s*(\d+)/i)?.[1];
      return { materialId: material.id, materialName: material.name, excerpt: chunk.text, sourceRef: material.sourceRef || material.name, section: chunk.sourceRef, page: page ? Number(page) : undefined, timestamp, score: chunk.text.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).filter((term) => normalizedQuery.toLocaleLowerCase().includes(term)).length };
    });
  });
  return searchable.sort((a, b) => b.score - a.score || a.materialId - b.materialId).slice(0, limit);
}

import { createHash } from "node:crypto";
import { materialJobs } from "../drizzle/schema";
import { storageGetSignedUrl, storagePut } from "./storage";

const MAX_MATERIAL_BYTES = 20 * 1024 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MATERIAL_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["image/png", "image"],
  ["image/jpeg", "image"],
  ["image/webp", "image"],
  ["audio/mpeg", "audio"],
  ["audio/wav", "audio"],
  ["audio/ogg", "audio"],
  ["audio/mp4", "audio"],
  ["audio/webm", "audio"],
]);

function decodeBase64Payload(payload: string, kind: string) {
  const clean = payload.replace(/^data:[^;]+;base64,/, "");
  const data = Buffer.from(clean, "base64");
  if (!data.length || data.length > (kind === "audio" ? MAX_AUDIO_BYTES : MAX_MATERIAL_BYTES)) throw new Error("FILE_TOO_LARGE_OR_EMPTY");
  return data;
}

function hasExpectedSignature(data: Buffer, kind: string, mimeType: string) {
  if (kind === "pdf") return data.subarray(0, 5).toString("ascii") === "%PDF-";
  if (kind === "docx") return data.subarray(0, 2).toString("ascii") === "PK";
  if (kind === "image") return data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" || data.subarray(0, 3).toString("hex") === "ffd8ff" || data.subarray(0, 4).toString("ascii") === "RIFF";
  if (kind === "audio") {
    if (mimeType === "audio/mpeg") return data.subarray(0, 3).toString("ascii") === "ID3" || (data[0] === 0xff && (data[1] & 0xe0) === 0xe0);
    if (mimeType === "audio/wav") return data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WAVE";
    if (mimeType === "audio/ogg") return data.subarray(0, 4).toString("ascii") === "OggS";
    if (mimeType === "audio/webm") return data.subarray(0, 4).toString("hex") === "1a45dfa3";
    if (mimeType === "audio/mp4") return data.subarray(4, 8).toString("ascii") === "ftyp";
  }
  return false;
}

export async function createUploadedMaterial(userId: number, input: { subjectId: number; name: string; mimeType: string; base64: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId))).limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const kind = MATERIAL_TYPES.get(input.mimeType);
  if (!kind) throw new Error("UNSUPPORTED_FILE_TYPE");
  const data = decodeBase64Payload(input.base64, kind);
  if (!hasExpectedSignature(data, kind, input.mimeType)) throw new Error("FILE_SIGNATURE_MISMATCH");
  const contentHash = createHash("sha256").update(data).digest("hex");
  const duplicate = await db.select({ id: materials.id }).from(materials).where(and(eq(materials.userId, userId), eq(materials.subjectId, input.subjectId), eq(materials.contentHash, contentHash))).limit(1);
  if (duplicate[0]) return { duplicate: true, materialId: duplicate[0].id, buffer: data };
  const stored = await storagePut(`subjects/${input.subjectId}/${input.name}`, data, input.mimeType);
  const inserted = await db.insert(materials).values({ userId, subjectId: input.subjectId, name: input.name, kind, mimeType: input.mimeType, storageKey: stored.key, sizeBytes: data.length, contentHash, status: "queued" });
  const materialId = Number(inserted[0].insertId);
  const job = await db.insert(materialJobs).values({ userId, materialId, type: kind === "audio" ? "transcribe" : "extract", status: "queued" });
  return { duplicate: false, materialId, jobId: Number(job[0].insertId), buffer: data };
}

export async function updateMaterialProcessing(userId: number, materialId: number, input: { status: "extracting" | "indexing" | "indexed" | "needs_review" | "failed"; textContent?: string; pageCount?: number; audioDurationSeconds?: number; transcriptSegments?: unknown; errorCode?: string; errorMessage?: string; detectedLanguage?: string; ocrConfidence?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(materials).set({ ...input, processedAt: ["indexed", "needs_review", "failed"].includes(input.status) ? new Date() : null }).where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
}

export async function updateMaterialJob(userId: number, jobId: number, input: { status: "running" | "completed" | "failed"; attempts?: number; errorMessage?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(materialJobs).set({ ...input, startedAt: input.status === "running" ? new Date() : undefined, completedAt: ["completed", "failed"].includes(input.status) ? new Date() : undefined }).where(and(eq(materialJobs.id, jobId), eq(materialJobs.userId, userId)));
}

export async function retryUploadedMaterial(userId: number, materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(materials).where(and(eq(materials.id, materialId), eq(materials.userId, userId))).limit(1);
  const material = rows[0];
  if (!material?.storageKey || !material.mimeType) throw new Error("MATERIAL_NOT_RETRYABLE");
  const signedUrl = await storageGetSignedUrl(material.storageKey);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error("MATERIAL_DOWNLOAD_FAILED");
  const buffer = Buffer.from(await response.arrayBuffer());
  const job = await db.insert(materialJobs).values({ userId, materialId, type: material.kind === "audio" ? "transcribe" : "extract", status: "queued" });
  await db.update(materials).set({ status: "queued", errorCode: null, errorMessage: null, processedAt: null }).where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
  return { jobId: Number(job[0].insertId), buffer, kind: material.kind as "pdf" | "docx" | "image" | "audio", mimeType: material.mimeType };
}
