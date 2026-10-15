"""InsightX Python Query Executor
Executes validated read-only SQL queries against insightx.db.
"""
import sqlite3
import time
from typing import Dict, Any, List
from backend.app.core.config import settings

def execute_read_only_query(sql: str) -> Dict[str, Any]:
    """Connects to SQLite database in URI read-only mode and executes query."""
    uri_path = f"file:{settings.DATABASE_PATH}?mode=ro"
    start_time = time.time()

    conn = sqlite3.connect(uri_path, uri=True)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        cur.execute(sql)
        raw_rows = cur.fetchall()
        duration_ms = round((time.time() - start_time) * 1000, 2)

        columns = [desc[0] for desc in cur.description] if cur.description else []
        rows = [dict(r) for r in raw_rows]

        return {
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "execution_ms": duration_ms
        }
    finally:
        conn.close()
