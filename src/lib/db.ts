import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "elms.db");

declare global {
  var __elmsDb: DatabaseSync | undefined;
  var __elmsSeeded: boolean | undefined;
}

function createConnection(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const conn = new DatabaseSync(DB_PATH);
  conn.exec("PRAGMA journal_mode = WAL;");
  conn.exec("PRAGMA foreign_keys = ON;");
  conn.exec(SCHEMA_SQL);

  try {
    conn.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'Password123!';");
  } catch {
    // Column already exists
  }

  return conn;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__elmsDb) {
    globalThis.__elmsDb = createConnection();
  }
  return globalThis.__elmsDb;
}

export function markSeeded() {
  globalThis.__elmsSeeded = true;
}

export function isSeeded() {
  return globalThis.__elmsSeeded === true;
}

/** node:sqlite rows are not plain-object literals. Passing them straight
 * through as a Client Component prop throws at the RSC serialization
 * boundary ("Classes or null prototypes are not supported") — call this on
 * any row/array handed to a "use client" component. */
export function toPlain<T>(row: T): T {
  return { ...row } as T;
}

export function toPlainRows<T>(rows: T[]): T[] {
  return rows.map(toPlain);
}
