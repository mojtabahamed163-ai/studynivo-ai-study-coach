import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, materials, savedItems, studySessions, subjects, topics, users, userProfiles } from "../drizzle/schema";
import { ENV } from "./_core/env";

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
