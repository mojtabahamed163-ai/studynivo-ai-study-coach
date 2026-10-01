import { relations } from "drizzle-orm";
import { materials, savedItems, studySessions, subjects, topics, users, userProfiles } from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({ subjects: many(subjects), profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }), materials: many(materials), sessions: many(studySessions), savedItems: many(savedItems) }));
export const subjectsRelations = relations(subjects, ({ many, one }) => ({ user: one(users, { fields: [subjects.userId], references: [users.id] }), materials: many(materials), topics: many(topics), sessions: many(studySessions), savedItems: many(savedItems) }));
export const materialsRelations = relations(materials, ({ one }) => ({ user: one(users, { fields: [materials.userId], references: [users.id] }), subject: one(subjects, { fields: [materials.subjectId], references: [subjects.id] }) }));
export const topicsRelations = relations(topics, ({ one }) => ({ user: one(users, { fields: [topics.userId], references: [users.id] }), subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }) }));
export const sessionsRelations = relations(studySessions, ({ one }) => ({ user: one(users, { fields: [studySessions.userId], references: [users.id] }), subject: one(subjects, { fields: [studySessions.subjectId], references: [subjects.id] }) }));
export const savedItemsRelations = relations(savedItems, ({ one }) => ({ user: one(users, { fields: [savedItems.userId], references: [users.id] }), subject: one(subjects, { fields: [savedItems.subjectId], references: [subjects.id] }) }));
