import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, knowledgeSources, qaHistory, InsertKnowledgeSource, InsertQAHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Knowledge Base queries
export async function getKnowledgeSources() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeSources);
}

export async function insertKnowledgeSource(source: InsertKnowledgeSource) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(knowledgeSources).values(source);
  return result;
}

// Q&A History queries
export async function getUserQAHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(qaHistory)
    .where(eq(qaHistory.userId, userId))
    .orderBy(desc(qaHistory.createdAt));
}

export async function insertQARecord(record: InsertQAHistory) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(qaHistory).values(record);
  return result;
}

export async function updateQAFeedback(
  qaId: number,
  isHelpful: "yes" | "no" | "neutral",
  feedback?: string
) {
  const db = await getDb();
  if (!db) return null;
  
  return await db
    .update(qaHistory)
    .set({ isHelpful, feedback })
    .where(eq(qaHistory.id, qaId));
}
