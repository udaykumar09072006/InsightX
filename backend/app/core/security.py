"""InsightX SQL Security & AST-like Safety Validator (Python)
Prevents SQL injection, mutations, administrative commands, and unbounded queries.
"""
import re
from typing import Tuple, List, Optional

APPROVED_TABLES = {
    'fact_sales',
    'dim_date',
    'dim_customer',
    'dim_product',
    'dim_country',
    'customer_rfm'
}

DISALLOWED_KEYWORDS = {
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
    'REPLACE', 'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'EXEC', 'EXECUTE',
    'GRANT', 'REVOKE', 'COPY', 'INTO', 'MERGE', 'CALL', 'UPSERT', 'REINDEX'
}

def validate_and_sanitize_sql(raw_sql: str, max_rows: int = 500) -> Tuple[bool, str, Optional[str], List[str]]:
    """Validates that query is strictly a read-only SELECT or CTE, enforces limits and table whitelist.
    
    Returns:
        (is_valid, sanitized_sql, error_message, warnings)
    """
    if not raw_sql or not isinstance(raw_sql, str):
        return False, "", "SQL query must be a non-empty string.", []

    clean = raw_sql.strip().rstrip(';').strip()

    # Reject multi-statement queries
    # Remove string literals before checking for semicolons
    no_strings = re.sub(r"'(?:''|[^'])*'", "''", clean)
    if ';' in no_strings:
        return False, "", "Security Error: Multiple SQL statements are strictly forbidden.", []

    # Strip SQL comments
    clean = re.sub(r'/\*[\s\S]*?\*/', ' ', clean)
    clean = re.sub(r'--.*$', ' ', clean, flags=re.MULTILINE).strip()

    normalized = clean.upper()
    if not (normalized.startswith('SELECT') or normalized.startswith('WITH')):
        return False, "", "Security Error: Only read-only SELECT or WITH (CTE) queries are permitted.", []

    tokens = re.findall(r'\b[A-Z_]+\b', normalized)
    for tok in tokens:
        if tok in DISALLOWED_KEYWORDS:
            return False, "", f"Security Error: Disallowed keyword '{tok}'. Only read-only queries are permitted.", []

    # Check referenced tables after FROM or JOIN
    from_joins = re.findall(r'(?:FROM|JOIN)\s+([a-zA-Z0-9_]+)', clean, re.IGNORECASE)
    for tbl in from_joins:
        t_lower = tbl.lower()
        is_approved = t_lower in APPROVED_TABLES
        is_cte = re.search(rf'\b{t_lower}\s+AS\s*\(', clean, re.IGNORECASE) is not None
        if not is_approved and not is_cte:
            return False, "", f"Security Error: Table '{tbl}' is not in approved analytics whitelist.", []

    # Enforce LIMIT
    warnings = []
    limit_match = re.search(r'\bLIMIT\s+(\d+)', clean, re.IGNORECASE)
    final_sql = clean
    if not limit_match:
        final_sql = f"{clean} LIMIT {max_rows}"
    else:
        existing_limit = int(limit_match.group(1))
        if existing_limit > max_rows:
            final_sql = re.sub(r'\bLIMIT\s+\d+', f'LIMIT {max_rows}', clean, flags=re.IGNORECASE)
            warnings.append(f"Row limit capped at {max_rows}.")

    return True, final_sql, None, warnings
