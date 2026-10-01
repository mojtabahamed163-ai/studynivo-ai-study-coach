import { boolean, date, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  locale: varchar("locale", { length: 12 }).default("en").notNull(),
  contentLanguage: varchar("contentLanguage", { length: 12 }).default("en").notNull(),
  dailyGoalMinutes: int("dailyGoalMinutes").default(60).notNull(),
  level: varchar("level", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userIndex: index("user_profiles_user_idx").on(table.userId) }));

export const subjects = mysqlTable("subjects", {
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
}, (table) => ({ userIndex: index("subjects_user_idx").on(table.userId), userSlugIndex: index("subjects_user_slug_idx").on(table.userId, table.slug) }));

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subjectId: int("subjectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["queued", "extracting", "indexing", "indexed", "needs_review", "failed"]).default("queued").notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  mimeType: varchar("mimeType", { length: 120 }),
  sizeBytes: int("sizeBytes"),
  contentHash: varchar("contentHash", { length: 64 }),
  pageCount: int("pageCount"),
  detectedLanguage: varchar("detectedLanguage", { length: 12 }),
  textContent: text("textContent"),
  sourceRef: varchar("sourceRef", { length: 255 }),
  errorCode: varchar("errorCode", { length: 64 }),
  errorMessage: text("errorMessage"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ subjectIndex: index("materials_subject_idx").on(table.userId, table.subjectId) }));


export const materialJobs = mysqlTable("material_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  materialId: int("materialId").notNull(),
  type: mysqlEnum("type", ["extract", "index"]).default("extract").notNull(),
  status: mysqlEnum("job_status", ["queued", "running", "completed", "failed"]).default("queued").notNull(),
  attempts: int("attempts").default(0).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userIndex: index("material_jobs_user_idx").on(table.userId), materialIndex: index("material_jobs_material_idx").on(table.materialId) }));

export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subjectId: int("subjectId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  note: text("note"),
  sourceRef: varchar("sourceRef", { length: 255 }),
  mastery: int("mastery").default(0).notNull(),
  isWeak: boolean("isWeak").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ subjectIndex: index("topics_subject_idx").on(table.userId, table.subjectId) }));

export const studySessions = mysqlTable("study_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subjectId: int("subjectId").notNull(),
  topicId: int("topicId"),
  durationMinutes: int("durationMinutes").notNull(),
  elapsedSeconds: int("elapsedSeconds").default(0).notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({ userIndex: index("sessions_user_idx").on(table.userId), subjectIndex: index("sessions_subject_idx").on(table.userId, table.subjectId) }));

export const savedItems = mysqlTable("saved_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subjectId: int("subjectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  sourceRef: varchar("sourceRef", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ userIndex: index("saved_items_user_idx").on(table.userId) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type MaterialJob = typeof materialJobs.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type SavedItem = typeof savedItems.$inferSelect;
