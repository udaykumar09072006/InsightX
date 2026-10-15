/**
 * InsightX Database Query Executor
 * Connects to data/processed/insightx.db using read-only mode and executes validated SQL.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface QueryExecutionResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionMs: number;
}

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), 'data/processed/insightx.db');
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}. Ensure data pipeline has been executed.`);
    }
    // Read-only mode prevents any disk writes or database modifications
    dbInstance = new DatabaseSync(dbPath, { open: true, readOnly: true });
  }
  return dbInstance;
}

export function executeReadOnlyQuery(sql: string, timeoutMs: number = 10000): QueryExecutionResult {
  const db = getDb();
  const startTime = performance.now();

  try {
    const stmt = db.prepare(sql);
    const results = stmt.all();
    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    const rows = results as any[];
    let columns: string[] = [];

    if (rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
      columns = Object.keys(rows[0]);
    }

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionMs: duration
    };
  } catch (error: any) {
    throw new Error(`Database execution failed: ${error.message}`);
  }
}
