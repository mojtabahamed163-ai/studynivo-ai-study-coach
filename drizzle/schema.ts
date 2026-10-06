import {
  boolean,
  date,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    phoneNumber: varchar("phoneNumber", { length: 20 }),
    passwordHash: varchar("passwordHash", { length: 180 }),
    sessionVersion: int("sessionVersion").default(0).notNull(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    phoneUnique: uniqueIndex("users_phone_unique").on(table.phoneNumber),
  })
);

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userIndex: index("password_reset_tokens_user_idx").on(table.userId),
    expiryIndex: index("password_reset_tokens_expiry_idx").on(table.expiresAt),
  })
);

export const userProfiles = mysqlTable(
  "user_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    locale: varchar("locale", { length: 12 }).default("en").notNull(),
    contentLanguage: varchar("contentLanguage", { length: 12 })
      .default("en")
      .notNull(),
    dailyGoalMinutes: int("dailyGoalMinutes").default(60).notNull(),
    level: varchar("level", { length: 32 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userIndex: index("user_profiles_user_idx").on(table.userId) })
);

export const subjects = mysqlTable(
  "subjects",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    color: varchar("color", { length: 16 }).default("#0f766e").notNull(),
    examDate: date("examDate"),
    mastery: int("mastery").default(0).notNull(),
    minutesStudied: int("minutesStudied").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIndex: index("subjects_user_idx").on(table.userId),
    userSlugIndex: index("subjects_user_slug_idx").on(table.userId, table.slug),
  })
);

export const materials = mysqlTable(
  "materials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subjectId: int("subjectId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 32 }).notNull(),
    status: mysqlEnum("status", [
      "queued",
      "extracting",
      "indexing",
      "indexed",
      "needs_review",
      "failed",
    ])
      .default("queued")
      .notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    mimeType: varchar("mimeType", { length: 120 }),
    sizeBytes: int("sizeBytes"),
    contentHash: varchar("contentHash", { length: 64 }),
    pageCount: int("pageCount"),
    audioDurationSeconds: int("audioDurationSeconds"),
    transcriptSegments: json("transcriptSegments"),
    detectedLanguage: varchar("detectedLanguage", { length: 12 }),
    ocrConfidence: int("ocrConfidence"),
    textContent: mediumtext("textContent"),
    sourceRef: varchar("sourceRef", { length: 255 }),
    errorCode: varchar("errorCode", { length: 64 }),
    errorMessage: text("errorMessage"),
    processedAt: timestamp("processedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    subjectIndex: index("materials_subject_idx").on(
      table.userId,
      table.subjectId
    ),
  })
);

export const materialJobs = mysqlTable(
  "material_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    materialId: int("materialId").notNull(),
    type: mysqlEnum("type", ["extract", "transcribe", "index"])
      .default("extract")
      .notNull(),
    status: mysqlEnum("job_status", [
      "queued",
      "running",
      "completed",
      "failed",
    ])
      .default("queued")
      .notNull(),
    attempts: int("attempts").default(0).notNull(),
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userIndex: index("material_jobs_user_idx").on(table.userId),
    materialIndex: index("material_jobs_material_idx").on(table.materialId),
  })
);

export const topics = mysqlTable(
  "topics",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subjectId: int("subjectId").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    note: text("note"),
    sourceRef: varchar("sourceRef", { length: 255 }),
    mastery: int("mastery").default(0).notNull(),
    isWeak: boolean("isWeak").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    subjectIndex: index("topics_subject_idx").on(table.userId, table.subjectId),
  })
);

export const studySessions = mysqlTable(
  "study_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subjectId: int("subjectId").notNull(),
    topicId: int("topicId"),
    durationMinutes: int("durationMinutes").notNull(),
    elapsedSeconds: int("elapsedSeconds").default(0).notNull(),
    status: mysqlEnum("status", ["active", "paused", "completed"])
      .default("active")
      .notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    reflection: text("reflection"),
    confidence: mysqlEnum("confidence", ["low", "medium", "high"]),
  },
  table => ({
    userIndex: index("sessions_user_idx").on(table.userId),
    subjectIndex: index("sessions_subject_idx").on(
      table.userId,
      table.subjectId
    ),
  })
);

export const savedItems = mysqlTable(
  "saved_items",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subjectId: int("subjectId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    sourceRef: varchar("sourceRef", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ userIndex: index("saved_items_user_idx").on(table.userId) })
);

export const flashcards = mysqlTable(
  "flashcards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subjectId: int("subjectId").notNull(),
    topicId: int("topicId"),
    front: text("front").notNull(),
    back: text("back").notNull(),
    sourceRef: varchar("sourceRef", { length: 255 }),
    difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"])
      .default("medium")
      .notNull(),
    intervalDays: int("intervalDays").default(1).notNull(),
    mistakeCount: int("mistakeCount").default(0).notNull(),
    confidence: mysqlEnum("confidence", ["low", "medium", "high"]),
    lastReviewedAt: timestamp("lastReviewedAt"),
    nextReviewAt: timestamp("nextReviewAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userSubjectIndex: index("flashcards_user_subject_idx").on(
      table.userId,
      table.subjectId
    ),
    reviewIndex: index("flashcards_review_idx").on(
      table.userId,
      table.nextReviewAt
    ),
  })
);

export const quizAttempts = mysqlTable(
  "quiz_attempts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    subjectId: int("subjectId").notNull(),
    kind: mysqlEnum("kind", ["practice", "mock"]).default("practice").notNull(),
    status: mysqlEnum("status", ["active", "completed"])
      .default("active")
      .notNull(),
    questions: json("questions").notNull(),
    score: int("score").default(0).notNull(),
    total: int("total").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => ({
    userSubjectIndex: index("quiz_attempts_user_subject_idx").on(
      table.userId,
      table.subjectId
    ),
  })
);

export const quizAnswers = mysqlTable(
  "quiz_answers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    attemptId: int("attemptId").notNull(),
    questionIndex: int("questionIndex").notNull(),
    answer: text("answer"),
    confidence: mysqlEnum("confidence", ["low", "medium", "high"]),
    isCorrect: boolean("isCorrect").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    attemptIndex: index("quiz_answers_attempt_idx").on(
      table.userId,
      table.attemptId
    ),
    questionUnique: uniqueIndex("quiz_answers_question_unique").on(
      table.userId,
      table.attemptId,
      table.questionIndex
    ),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type MaterialJob = typeof materialJobs.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type SavedItem = typeof savedItems.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
