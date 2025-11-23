import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول المصادر الطبية (Knowledge Base Sources)
 */
export const knowledgeSources = mysqlTable("knowledge_sources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  chunks: text("chunks"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type InsertKnowledgeSource = typeof knowledgeSources.$inferInsert;

/**
 * جدول الأسئلة والإجابات (Q&A History)
 */
export const qaHistory = mysqlTable("qa_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: text("sources"),
  isHelpful: mysqlEnum("isHelpful", ["yes", "no", "neutral"]),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QAHistory = typeof qaHistory.$inferSelect;
export type InsertQAHistory = typeof qaHistory.$inferInsert;
