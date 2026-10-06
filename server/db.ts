import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  flashcards,
  materials,
  materialJobs,
  quizAnswers,
  quizAttempts,
  savedItems,
  studySessions,
  subjects,
  topics,
  users,
  userProfiles,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  chunkText,
  normalizeSearchText,
  selectRelevantChunks,
} from "./ai/materialProcessor";
import { generateSourceQuiz } from "./ai/quizGeneration";
import {
  nextUnansweredQuestionIndex,
  redactQuizAttempt,
  redactQuizQuestions,
  shouldRevealQuizFeedback,
  visibleQuizScore,
} from "./quizSecurity";
import {
  buildUnresolvedMistakeReviews,
  rankStudySignals,
  type MistakeReviewHistoryItem,
  type StudySignal,
} from "./studyManager";
import {
  decodeBase64Payload,
  hasExpectedSignature,
  MaterialKind,
  MAX_AUDIO_BYTES,
  MAX_MATERIAL_BYTES,
  sanitizeMaterialName,
} from "./materialValidation";
import { storageGetSignedUrl, storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserLocale(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ locale: userProfiles.locale })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return rows[0]?.locale ?? "en";
}

export async function setUserLocale(userId: number, locale: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(userProfiles)
      .set({ locale })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, locale });
  }
  return { locale };
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function listSubjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.userId, userId))
    .orderBy(asc(subjects.createdAt));
  return Promise.all(
    rows.map(async subject => {
      const [subjectMaterials, subjectTopics] = await Promise.all([
        db
          .select()
          .from(materials)
          .where(
            and(
              eq(materials.subjectId, subject.id),
              eq(materials.userId, userId)
            )
          )
          .orderBy(desc(materials.createdAt)),
        db
          .select()
          .from(topics)
          .where(
            and(eq(topics.subjectId, subject.id), eq(topics.userId, userId))
          )
          .orderBy(asc(topics.createdAt)),
      ]);
      return { ...subject, materials: subjectMaterials, topics: subjectTopics };
    })
  );
}

export async function createSubject(
  userId: number,
  input: { name: string; examDate?: string; color?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const slug =
    input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `subject-${Date.now()}`;
  const result = await db
    .insert(subjects)
    .values({
      userId,
      name: input.name.trim(),
      slug,
      examDate: input.examDate ? new Date(`${input.examDate}T00:00:00`) : null,
      color: input.color ?? "#0f766e",
    });
  const id = Number(result[0].insertId);
  return db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
    .limit(1)
    .then(rows => rows[0]);
}

export async function getSubject(userId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subject = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!subject[0]) return undefined;
  const [subjectMaterials, subjectTopics] = await Promise.all([
    db
      .select()
      .from(materials)
      .where(
        and(eq(materials.subjectId, subjectId), eq(materials.userId, userId))
      )
      .orderBy(desc(materials.createdAt)),
    db
      .select()
      .from(topics)
      .where(and(eq(topics.subjectId, subjectId), eq(topics.userId, userId)))
      .orderBy(asc(topics.createdAt)),
  ]);
  return { ...subject[0], materials: subjectMaterials, topics: subjectTopics };
}

export async function addTextMaterial(
  userId: number,
  input: {
    subjectId: number;
    name: string;
    kind: string;
    textContent: string;
    sourceRef?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const result = await db
    .insert(materials)
    .values({
      userId,
      subjectId: input.subjectId,
      name: input.name,
      kind: input.kind,
      textContent: input.textContent,
      sourceRef: input.sourceRef ?? "Notes",
      status: "indexed",
      sizeBytes: Buffer.byteLength(input.textContent, "utf8"),
    });
  const rows = await db
    .select()
    .from(materials)
    .where(
      and(
        eq(materials.id, Number(result[0].insertId)),
        eq(materials.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function saveTopicInsights(
  userId: number,
  subjectId: number,
  insights: Array<{ name: string; note: string; sourceRef: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const existing = await db
    .select({ name: topics.name })
    .from(topics)
    .where(and(eq(topics.subjectId, subjectId), eq(topics.userId, userId)));
  const names = new Set(
    existing.map(topic => topic.name.trim().toLocaleLowerCase())
  );
  const fresh = insights
    .filter(
      item =>
        item.name.trim() && !names.has(item.name.trim().toLocaleLowerCase())
    )
    .slice(0, 80);
  if (fresh.length)
    await db
      .insert(topics)
      .values(
        fresh.map(item => ({
          userId,
          subjectId,
          name: item.name.trim().slice(0, 180),
          note: item.note.trim(),
          sourceRef: item.sourceRef.trim().slice(0, 255),
        }))
      );
  return fresh.length;
}

export async function createStudySession(
  userId: number,
  input: { subjectId: number; topicId?: number; durationMinutes: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  if (input.topicId) {
    const topicOwner = await db
      .select({ id: topics.id })
      .from(topics)
      .where(
        and(
          eq(topics.id, input.topicId),
          eq(topics.subjectId, input.subjectId),
          eq(topics.userId, userId)
        )
      )
      .limit(1);
    if (!topicOwner[0])
      throw new Error("Topic does not belong to this subject");
  }
  return db.transaction(async tx => {
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .for("update");
    await tx
      .update(studySessions)
      .set({ status: "paused" })
      .where(
        and(
          eq(studySessions.userId, userId),
          eq(studySessions.status, "active")
        )
      );
    const result = await tx.insert(studySessions).values({
      userId,
      subjectId: input.subjectId,
      topicId: input.topicId ?? null,
      durationMinutes: input.durationMinutes,
      status: "active",
    });
    const rows = await tx
      .select()
      .from(studySessions)
      .where(
        and(
          eq(studySessions.id, Number(result[0].insertId)),
          eq(studySessions.userId, userId)
        )
      )
      .limit(1);
    return rows[0];
  });
}

export async function getActiveStudySession(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select()
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        inArray(studySessions.status, ["active", "paused"])
      )
    )
    .orderBy(desc(studySessions.startedAt))
    .limit(1);
  return rows[0];
}

export async function updateStudySession(
  userId: number,
  sessionId: number,
  input: { elapsedSeconds: number; status: "active" | "paused" | "completed" }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .for("update");
    const rows = await tx
      .select()
      .from(studySessions)
      .where(
        and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))
      )
      .limit(1)
      .for("update");
    const session = rows[0];
    if (!session) throw new Error("Study session not found");
    if (session.status === "completed") {
      if (input.status !== "completed")
        throw new Error("Completed study sessions cannot be reopened");
      return session;
    }
    if (input.elapsedSeconds > session.durationMinutes * 60)
      throw new Error("Elapsed time exceeds the session duration");

    if (input.status === "active")
      await tx
        .update(studySessions)
        .set({ status: "paused" })
        .where(
          and(
            eq(studySessions.userId, userId),
            eq(studySessions.status, "active"),
            ne(studySessions.id, sessionId)
          )
        );

    const completedAt = input.status === "completed" ? new Date() : null;
    await tx
      .update(studySessions)
      .set({
        elapsedSeconds: input.elapsedSeconds,
        status: input.status,
        completedAt,
      })
      .where(
        and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))
      );
    if (input.status === "completed") {
      const completedMinutes = Math.floor(input.elapsedSeconds / 60);
      if (completedMinutes > 0)
        await tx
          .update(subjects)
          .set({
            minutesStudied: sql`${subjects.minutesStudied} + ${completedMinutes}`,
          })
          .where(
            and(
              eq(subjects.id, session.subjectId),
              eq(subjects.userId, userId)
            )
          );
    }
    const updated = await tx
      .select()
      .from(studySessions)
      .where(
        and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))
      )
      .limit(1);
    return updated[0];
  });
}

export async function addSavedItem(
  userId: number,
  input: {
    subjectId: number;
    title: string;
    excerpt?: string;
    sourceRef?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const result = await db
    .insert(savedItems)
    .values({
      userId,
      subjectId: input.subjectId,
      title: input.title,
      excerpt: input.excerpt ?? null,
      sourceRef: input.sourceRef ?? null,
    });
  const rows = await db
    .select()
    .from(savedItems)
    .where(
      and(
        eq(savedItems.id, Number(result[0].insertId)),
        eq(savedItems.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function listDueFlashcardsForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(flashcards)
    .where(
      and(
        eq(flashcards.userId, userId),
        lte(flashcards.nextReviewAt, new Date())
      )
    )
    .orderBy(asc(flashcards.nextReviewAt));
}

export async function listMistakeReviewsForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({
      subjectId: quizAttempts.subjectId,
      subjectName: subjects.name,
      questions: quizAttempts.questions,
      questionIndex: quizAnswers.questionIndex,
      selectedAnswer: quizAnswers.answer,
      confidence: quizAnswers.confidence,
      isCorrect: quizAnswers.isCorrect,
      createdAt: quizAnswers.createdAt,
    })
    .from(quizAnswers)
    .innerJoin(
      quizAttempts,
      and(
        eq(quizAttempts.id, quizAnswers.attemptId),
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.status, "completed")
      )
    )
    .innerJoin(
      subjects,
      and(
        eq(subjects.id, quizAttempts.subjectId),
        eq(subjects.userId, userId)
      )
    )
    .where(eq(quizAnswers.userId, userId))
    .orderBy(desc(quizAnswers.createdAt))
    .limit(500);
  const history: MistakeReviewHistoryItem[] = [];
  for (const row of rows) {
    const questions = row.questions as Array<{
      topicId?: number;
      topic?: string;
      prompt?: string;
      answer?: string;
      explanation?: string;
      sourceRef?: string;
    }>;
    const question = questions[row.questionIndex];
    if (!question?.prompt || !question.answer) continue;
    history.push({
      key: `${row.subjectId}:${question.topicId ?? question.prompt}`,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      topicId: question.topicId,
      topicName: question.topic,
      prompt: question.prompt,
      selectedAnswer: row.selectedAnswer ?? "",
      correctAnswer: question.answer,
      explanation: question.explanation,
      sourceRef: question.sourceRef || "Subject material",
      isCorrect: row.isCorrect,
      confidence: row.confidence,
      createdAt: row.createdAt,
    });
  }
  return buildUnresolvedMistakeReviews(history);
}

export async function getStudyRecommendationForUser(
  userId: number,
  availableMinutes = 30
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [userSubjects, cards, mistakeReviews, sessions] = await Promise.all([
    listSubjects(userId),
    db.select().from(flashcards).where(eq(flashcards.userId, userId)),
    listMistakeReviewsForUser(userId),
    db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.startedAt))
      .limit(300),
  ]);
  type Aggregate = {
    dueReviews: number;
    repeatedMistakes: number;
    confidenceTotal: number;
    confidenceCount: number;
    lastStudiedAt?: Date;
  };
  const aggregates = new Map<string, Aggregate>();
  const getAggregate = (subjectId: number, topicId?: number | null) => {
    const key = `${subjectId}:${topicId ?? "none"}`;
    const current = aggregates.get(key) ?? {
      dueReviews: 0,
      repeatedMistakes: 0,
      confidenceTotal: 0,
      confidenceCount: 0,
    };
    aggregates.set(key, current);
    return current;
  };
  const now = new Date();
  const confidenceScores = { low: 30, medium: 65, high: 95 } as const;
  for (const card of cards) {
    const aggregate = getAggregate(card.subjectId, card.topicId);
    if (card.nextReviewAt <= now) aggregate.dueReviews += 1;
    aggregate.repeatedMistakes += Math.max(0, card.mistakeCount);
    if (card.confidence) {
      aggregate.confidenceTotal += confidenceScores[card.confidence];
      aggregate.confidenceCount += 1;
    }
    if (
      card.lastReviewedAt &&
      (!aggregate.lastStudiedAt || card.lastReviewedAt > aggregate.lastStudiedAt)
    )
      aggregate.lastStudiedAt = card.lastReviewedAt;
  }
  for (const review of mistakeReviews) {
    const aggregate = getAggregate(review.subjectId, review.topicId);
    aggregate.dueReviews += 1;
    aggregate.repeatedMistakes += review.missedCount;
    if (review.confidence) {
      aggregate.confidenceTotal += confidenceScores[review.confidence];
      aggregate.confidenceCount += 1;
    }
    const reviewedAt = new Date(review.createdAt);
    if (!aggregate.lastStudiedAt || reviewedAt > aggregate.lastStudiedAt)
      aggregate.lastStudiedAt = reviewedAt;
  }
  const lastSessionByTopic = new Map<string, (typeof sessions)[number]>();
  for (const session of sessions) {
    if (session.topicId === null) continue;
    const key = `${session.subjectId}:${session.topicId}`;
    if (!lastSessionByTopic.has(key)) lastSessionByTopic.set(key, session);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const signals: StudySignal[] = userSubjects.flatMap(subject => {
    const examDate = subject.examDate ? new Date(subject.examDate) : undefined;
    const examDays = examDate
      ? Math.ceil(
          (new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate()).getTime() -
            today.getTime()) /
            86_400_000
        )
      : undefined;
    return subject.topics.map(topic => {
      const aggregate = aggregates.get(`${subject.id}:${topic.id}`);
      const session = lastSessionByTopic.get(`${subject.id}:${topic.id}`);
      const lastStudiedAt = [
        aggregate?.lastStudiedAt,
        session?.startedAt,
      ].filter((value): value is Date => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0];
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        topicId: topic.id,
        topicName: topic.name,
        mastery: topic.mastery,
        examDays,
        repeatedMistakes: aggregate?.repeatedMistakes ?? 0,
        dueReviews: aggregate?.dueReviews ?? 0,
        confidence:
          aggregate && aggregate.confidenceCount > 0
            ? aggregate.confidenceTotal / aggregate.confidenceCount
            : undefined,
        minutesRemaining:
          session && session.status !== "completed"
            ? Math.max(0, session.durationMinutes - Math.ceil(session.elapsedSeconds / 60))
            : undefined,
        lastStudiedAt: lastStudiedAt?.toISOString(),
      };
    });
  });
  return rankStudySignals(signals, availableMinutes);
}

export async function listFlashcards(
  userId: number,
  subjectId: number,
  dueOnly = false
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const rows = await db
    .select()
    .from(flashcards)
    .where(
      and(eq(flashcards.subjectId, subjectId), eq(flashcards.userId, userId))
    )
    .orderBy(asc(flashcards.nextReviewAt));
  return dueOnly ? rows.filter(card => card.nextReviewAt <= new Date()) : rows;
}

export async function generateFlashcardsFromTopics(
  userId: number,
  subjectId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subject = await getSubject(userId, subjectId);
  if (!subject) throw new Error("Subject not found");
  const existing = await db
    .select({ topicId: flashcards.topicId })
    .from(flashcards)
    .where(
      and(eq(flashcards.subjectId, subjectId), eq(flashcards.userId, userId))
    );
  const existingTopics = new Set(
    existing.map(card => card.topicId).filter(Boolean)
  );
  const fresh = subject.topics
    .filter(topic => !existingTopics.has(topic.id))
    .slice(0, 50)
    .map(topic => ({
      userId,
      subjectId,
      topicId: topic.id,
      front: `What should you remember about ${topic.name}?`,
      back:
        topic.note ||
        `Review ${topic.name} using the source-linked material before testing yourself.`,
      sourceRef: topic.sourceRef || null,
      difficulty:
        topic.mastery < 50
          ? ("hard" as const)
          : topic.mastery < 75
            ? ("medium" as const)
            : ("easy" as const),
    }));
  if (fresh.length) await db.insert(flashcards).values(fresh);
  return listFlashcards(userId, subjectId);
}

export async function reviewFlashcard(
  userId: number,
  input: {
    cardId: number;
    confidence: "low" | "medium" | "high";
    correct: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, input.cardId), eq(flashcards.userId, userId)))
    .limit(1);
  const card = rows[0];
  if (!card) throw new Error("Flashcard not found");
  const intervalDays = input.correct
    ? Math.min(
        30,
        Math.max(
          1,
          card.intervalDays *
            (input.confidence === "high"
              ? 2
              : input.confidence === "medium"
                ? 1
                : 1)
        )
      )
    : 1;
  const nextReviewAt = new Date(Date.now() + intervalDays * 86400000);
  await db
    .update(flashcards)
    .set({
      confidence: input.confidence,
      intervalDays,
      nextReviewAt,
      lastReviewedAt: new Date(),
      mistakeCount: input.correct ? card.mistakeCount : card.mistakeCount + 1,
    })
    .where(and(eq(flashcards.id, input.cardId), eq(flashcards.userId, userId)));
  return db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, input.cardId), eq(flashcards.userId, userId)))
    .limit(1)
    .then(result => result[0]);
}

export async function createQuizAttempt(
  userId: number,
  subjectId: number,
  kind: "practice" | "mock",
  locale = "en"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const subject = await getSubject(userId, subjectId);
  if (!subject) throw new Error("Subject not found");
  if (!subject.materials.some(material => material.status === "indexed" && material.textContent))
    throw new Error("NO_INDEXED_MATERIAL");
  const practiceTopics = subject.topics.filter(
    topic => topic.isWeak || topic.mastery < 70
  );
  const topicsForQuiz = (
    kind === "practice" && practiceTopics.length
      ? practiceTopics
      : subject.topics
  );
  if (!topicsForQuiz.length) throw new Error("NO_INDEXED_TOPICS");
  const questions = await generateSourceQuiz(
    topicsForQuiz.map(topic => ({
      id: topic.id,
      name: topic.name,
      mastery: topic.mastery,
    })),
    subject.materials.map(material => ({
      name: material.name,
      textContent: material.textContent,
      status: material.status,
    })),
    locale,
    kind
  );
  const result = await db
    .insert(quizAttempts)
    .values({ userId, subjectId, kind, questions, total: questions.length });
  const rows = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.id, Number(result[0].insertId)),
        eq(quizAttempts.userId, userId)
      )
    )
    .limit(1);
  const attempt = rows[0];
  if (!attempt) throw new Error("Failed to create quiz attempt");
  return redactQuizAttempt(attempt);
}

export async function answerQuizQuestion(
  userId: number,
  input: {
    attemptId: number;
    questionIndex: number;
    answer: string;
    confidence: "low" | "medium" | "high";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.transaction(async tx => {
    const rows = await tx
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.id, input.attemptId),
          eq(quizAttempts.userId, userId)
        )
      )
      .limit(1)
      .for("update");
    const attempt = rows[0];
    if (!attempt || attempt.status !== "active")
      throw new Error("Quiz attempt not active");
    const questions = attempt.questions as Array<{
      answer: string;
      options?: string[];
      prompt?: string;
      topic?: string;
      sourceRef?: string;
      explanation?: string;
    }>;
    const question = questions[input.questionIndex];
    if (!question) throw new Error("Question not found");
    if (question.options && !question.options.includes(input.answer))
      throw new Error("ANSWER_NOT_IN_OPTIONS");
    const previousAnswers = await tx
      .select({ questionIndex: quizAnswers.questionIndex })
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.attemptId, input.attemptId),
          eq(quizAnswers.userId, userId)
        )
      );
    const answeredIndexes = previousAnswers.map(answer => answer.questionIndex);
    if (answeredIndexes.includes(input.questionIndex))
      throw new Error("QUESTION_ALREADY_ANSWERED");
    if (
      input.questionIndex !==
      nextUnansweredQuestionIndex(attempt.total, answeredIndexes)
    )
      throw new Error("QUESTIONS_MUST_BE_ANSWERED_IN_ORDER");
    const isCorrect = question.answer === input.answer;
    await tx.insert(quizAnswers).values({
      userId,
      attemptId: input.attemptId,
      questionIndex: input.questionIndex,
      answer: input.answer,
      confidence: input.confidence,
      isCorrect,
    });
    const answers = await tx
      .select()
      .from(quizAnswers)
      .where(
        and(
          eq(quizAnswers.attemptId, input.attemptId),
          eq(quizAnswers.userId, userId)
        )
      );
    const completed = answers.length >= attempt.total;
    const score = answers.filter(answer => answer.isCorrect).length;
    const revealFeedback = shouldRevealQuizFeedback(
      attempt.kind,
      completed ? "completed" : "active"
    );
    await tx
      .update(quizAttempts)
      .set({
        score,
        status: completed ? "completed" : "active",
        completedAt: completed ? new Date() : null,
      })
      .where(
        and(eq(quizAttempts.id, input.attemptId), eq(quizAttempts.userId, userId))
      );
    return {
      isCorrect: revealFeedback ? isCorrect : undefined,
      score: visibleQuizScore(
        attempt.kind,
        completed ? "completed" : "active",
        score
      ),
      total: attempt.total,
      completed,
      correctAnswer: revealFeedback ? question.answer : undefined,
      sourceRef: revealFeedback
        ? question.sourceRef || "Subject material"
        : undefined,
      explanation: revealFeedback
        ? question.explanation ||
          `Active recall is strongest when you explain ${question.topic || "the idea"} and answer a new question without looking back.`
        : undefined,
    };
  });
}

export async function getQuizAttemptProgress(
  userId: number,
  attemptId: number,
  subjectId: number,
  kind: "practice" | "mock"
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.id, attemptId),
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.subjectId, subjectId),
        eq(quizAttempts.kind, kind)
      )
    )
    .limit(1);
  const attempt = attempts[0];
  if (!attempt) throw new Error("Quiz attempt not found");
  const answers = await db
    .select()
    .from(quizAnswers)
    .where(
      and(
        eq(quizAnswers.attemptId, attemptId),
        eq(quizAnswers.userId, userId)
      )
    )
    .orderBy(asc(quizAnswers.questionIndex));
  const questions = attempt.questions as Array<{
    prompt?: string;
    answer?: string;
    sourceRef?: string;
    explanation?: string;
    topic?: string;
  }>;
  const revealFeedback = shouldRevealQuizFeedback(attempt.kind, attempt.status);
  const reportAnswers = answers.flatMap(answer => {
    const question = questions[answer.questionIndex];
    if (!question) return [];
    return [{
      questionIndex: answer.questionIndex,
      prompt: question.prompt || "",
      selectedAnswer: answer.answer,
      ...(revealFeedback
        ? {
            correctAnswer: question.answer || "",
            explanation:
              question.explanation ||
              `Review ${question.topic || "this concept"} using the source material.`,
            sourceRef: question.sourceRef || "Subject material",
            isCorrect: answer.isCorrect,
          }
        : {}),
      confidence: answer.confidence,
    }];
  });
  return {
    id: attempt.id,
    subjectId: attempt.subjectId,
    kind: attempt.kind,
    status: attempt.status,
    score: visibleQuizScore(
      attempt.kind,
      attempt.status,
      attempt.score ?? 0
    ),
    total: attempt.total,
    questions: redactQuizQuestions(attempt.questions),
    answers: reportAnswers,
  };
}

export async function listSavedItems(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(savedItems)
    .where(eq(savedItems.userId, userId))
    .orderBy(desc(savedItems.createdAt));
}

export async function deleteSavedItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .delete(savedItems)
    .where(and(eq(savedItems.id, itemId), eq(savedItems.userId, userId)));
  return { success: true } as const;
}

export async function searchSubjectMaterials(
  userId: number,
  subjectId: number,
  query: string,
  limit = 8
) {
  const subject = await getSubject(userId, subjectId);
  if (!subject) throw new Error("Subject not found");
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const normalizedQueryText = normalizeSearchText(normalizedQuery);
  const queryTerms = normalizedQueryText
    .split(/[^\p{L}\p{N}]+/u)
    .filter(term => term.length > 1);
  const searchable = subject.materials.flatMap(material => {
    if (!material.textContent || material.status !== "indexed") return [];
    return selectRelevantChunks(
      chunkText(material.textContent),
      normalizedQuery,
      limit
    ).map(chunk => {
      const timestamp =
        material.kind === "audio"
          ? chunk.text.match(/\[(\d+:\d{2})\]/)?.[1]
          : undefined;
      const page = (material.sourceRef || material.name).match(
        /(?:page|p\.?|صفحة)\s*(\d+)/i
      )?.[1];
      const normalizedChunkText = normalizeSearchText(chunk.text);
      const termScore = queryTerms.reduce(
        (total, term) => total + (normalizedChunkText.includes(term) ? 1 : 0),
        0
      );
      const phraseScore = normalizedChunkText.includes(normalizedQueryText)
        ? queryTerms.length
        : 0;
      return {
        materialId: material.id,
        materialName: material.name,
        excerpt: chunk.text,
        sourceRef: material.sourceRef || material.name,
        section: chunk.sourceRef,
        page: page ? Number(page) : undefined,
        timestamp,
        score: termScore * 2 + phraseScore,
      };
    });
  });
  return searchable
    .sort((a, b) => b.score - a.score || a.materialId - b.materialId)
    .slice(0, limit);
}

const MATERIAL_TYPES = new Map<string, MaterialKind>([
  ["application/pdf", "pdf"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
  ],
  ["image/png", "image"],
  ["image/jpeg", "image"],
  ["image/webp", "image"],
  ["audio/mpeg", "audio"],
  ["audio/wav", "audio"],
  ["audio/ogg", "audio"],
  ["audio/mp4", "audio"],
  ["audio/webm", "audio"],
]);

export async function createUploadedMaterial(
  userId: number,
  input: { subjectId: number; name: string; mimeType: string; base64: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const owner = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!owner[0]) throw new Error("Subject not found");
  const kind = MATERIAL_TYPES.get(input.mimeType);
  if (!kind) throw new Error("UNSUPPORTED_FILE_TYPE");
  const data = decodeBase64Payload(input.base64, kind, input.mimeType);
  if (!hasExpectedSignature(data, kind, input.mimeType))
    throw new Error("FILE_SIGNATURE_MISMATCH");
  const safeName = sanitizeMaterialName(input.name);
  const contentHash = createHash("sha256").update(data).digest("hex");
  const duplicate = await db
    .select({ id: materials.id })
    .from(materials)
    .where(
      and(
        eq(materials.userId, userId),
        eq(materials.subjectId, input.subjectId),
        eq(materials.contentHash, contentHash)
      )
    )
    .limit(1);
  if (duplicate[0])
    return {
      duplicate: true as const,
      materialId: duplicate[0].id,
      buffer: data,
    };
  const stored = await storagePut(
    `subjects/${input.subjectId}/${contentHash}`,
    data,
    input.mimeType,
    { uniqueSuffix: false }
  );
  return db.transaction(async tx => {
    const lockedOwner = await tx
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, userId)))
      .limit(1)
      .for("update");
    if (!lockedOwner[0]) throw new Error("Subject not found");
    const duplicateAfterUpload = await tx
      .select({ id: materials.id })
      .from(materials)
      .where(
        and(
          eq(materials.userId, userId),
          eq(materials.subjectId, input.subjectId),
          eq(materials.contentHash, contentHash)
        )
      )
      .limit(1);
    if (duplicateAfterUpload[0])
      return {
        duplicate: true as const,
        materialId: duplicateAfterUpload[0].id,
        buffer: data,
      };
    const inserted = await tx.insert(materials).values({
      userId,
      subjectId: input.subjectId,
      name: safeName,
      kind,
      mimeType: input.mimeType,
      storageKey: stored.key,
      sizeBytes: data.length,
      contentHash,
      status: "queued",
    });
    const materialId = Number(inserted[0].insertId);
    const job = await tx.insert(materialJobs).values({
      userId,
      materialId,
      type: kind === "audio" ? "transcribe" : "extract",
      status: "queued",
    });
    return {
      duplicate: false as const,
      materialId,
      jobId: Number(job[0].insertId),
      buffer: data,
    };
  });
}

export async function updateMaterialProcessing(
  userId: number,
  materialId: number,
  input: {
    status: "extracting" | "indexing" | "indexed" | "needs_review" | "failed";
    textContent?: string;
    pageCount?: number;
    audioDurationSeconds?: number;
    transcriptSegments?: unknown;
    errorCode?: string | null;
    errorMessage?: string | null;
    detectedLanguage?: string;
    ocrConfidence?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(materials)
    .set({
      ...input,
      processedAt: ["indexed", "needs_review", "failed"].includes(input.status)
        ? new Date()
        : null,
    })
    .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
}

export async function updateMaterialJob(
  userId: number,
  jobId: number,
  input: {
    status: "running" | "completed" | "failed";
    attempts?: number;
    errorMessage?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(materialJobs)
    .set({
      ...input,
      attempts:
        input.attempts ??
        (input.status === "running"
          ? sql`${materialJobs.attempts} + 1`
          : undefined),
      errorMessage: input.status === "running" ? null : input.errorMessage,
      startedAt: input.status === "running" ? new Date() : undefined,
      completedAt: ["completed", "failed"].includes(input.status)
        ? new Date()
        : input.status === "running"
          ? null
          : undefined,
    })
    .where(and(eq(materialJobs.id, jobId), eq(materialJobs.userId, userId)));
}

export async function claimMaterialJob(userId: number, jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
  const result = await db
    .update(materialJobs)
    .set({ status: "running", startedAt: new Date(), completedAt: null })
    .where(
      and(
        eq(materialJobs.id, jobId),
        eq(materialJobs.userId, userId),
        or(
          eq(materialJobs.status, "queued"),
          and(
            eq(materialJobs.status, "running"),
            or(
              isNull(materialJobs.startedAt),
              lt(materialJobs.startedAt, staleBefore)
            )
          )
        )
      )
    );
  return Number(result[0].affectedRows ?? 0) > 0;
}

export async function listRecoverableMaterialJobs() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
  return db
    .select({
      userId: materialJobs.userId,
      jobId: materialJobs.id,
      materialId: materials.id,
      kind: materials.kind,
      mimeType: materials.mimeType,
      storageKey: materials.storageKey,
    })
    .from(materialJobs)
    .innerJoin(materials, eq(materialJobs.materialId, materials.id))
    .where(
      and(
        inArray(materials.status, ["queued", "extracting", "indexing"]),
        or(
          eq(materialJobs.status, "queued"),
          and(
            eq(materialJobs.status, "running"),
            or(
              isNull(materialJobs.startedAt),
              lt(materialJobs.startedAt, staleBefore)
            )
          )
        )
      )
    )
    .orderBy(asc(materialJobs.createdAt))
    .limit(100);
}

export async function retryUploadedMaterial(
  userId: number,
  materialId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select()
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, userId)))
    .limit(1);
  const material = rows[0];
  if (!material?.storageKey || !material.mimeType)
    throw new Error("MATERIAL_NOT_RETRYABLE");
  if (material.status !== "failed" && material.status !== "needs_review")
    throw new Error("MATERIAL_NOT_RETRYABLE");
  const signedUrl = await storageGetSignedUrl(material.storageKey);
  const response = await fetch(signedUrl, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error("MATERIAL_DOWNLOAD_FAILED");
  const kind = material.kind as MaterialKind;
  const maxBytes = kind === "audio" ? MAX_AUDIO_BYTES : MAX_MATERIAL_BYTES;
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes)
    throw new Error("FILE_TOO_LARGE_OR_EMPTY");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (
    !buffer.length ||
    buffer.length > maxBytes ||
    !hasExpectedSignature(buffer, kind, material.mimeType)
  )
    throw new Error("FILE_SIGNATURE_MISMATCH");
  const jobId = await db.transaction(async tx => {
    const locked = await tx
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)))
      .limit(1)
      .for("update");
    const current = locked[0];
    if (!current || (current.status !== "failed" && current.status !== "needs_review"))
      throw new Error("MATERIAL_NOT_RETRYABLE");
    const job = await tx.insert(materialJobs).values({
      userId,
      materialId,
      type: kind === "audio" ? "transcribe" : "extract",
      status: "queued",
    });
    await tx
      .update(materials)
      .set({
        status: "queued",
        errorCode: null,
        errorMessage: null,
        processedAt: null,
      })
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    return Number(job[0].insertId);
  });
  return {
    jobId,
    buffer,
    kind,
    mimeType: material.mimeType,
  };
}
