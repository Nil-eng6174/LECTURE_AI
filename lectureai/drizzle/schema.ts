import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

export const lectures = mysqlTable("lectures", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 160 }),
  professor: varchar("professor", { length: 160 }),
  lectureDate: timestamp("lectureDate"),
  duration: int("duration"),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  status: mysqlEnum("status", ["uploading", "processing", "transcribing", "analyzing", "completed", "failed"]).default("processing").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transcriptChunks = mysqlTable("transcript_chunks", {
  id: int("id").autoincrement().primaryKey(),
  lectureId: int("lectureId").notNull().references(() => lectures.id),
  content: text("content").notNull(),
  startTime: int("startTime"),
  endTime: int("endTime"),
  embedding: json("embedding"),
});

export const lectureAnalysis = mysqlTable("lecture_analysis", {
  id: int("id").autoincrement().primaryKey(),
  lectureId: int("lectureId").notNull().unique().references(() => lectures.id),
  summary: text("summary"),
  topics: json("topics"),
  keyConcepts: json("keyConcepts"),
  importantPoints: json("importantPoints"),
  assignments: json("assignments"),
  announcements: json("announcements"),
  questions: json("questions"),
  importantDates: json("importantDates"),
});

export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  lectureId: int("lectureId").notNull().references(() => lectures.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => chatSessions.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
