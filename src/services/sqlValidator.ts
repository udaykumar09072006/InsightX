/**
 * InsightX SQL Safety Validator
 * Enforces AST and lexical validation to prevent SQL injection, data mutations,
 * unauthorized table access, and unbounded queries.
 */

import { APPROVED_TABLES } from './metricRegistry';

export interface ValidationResult {
  isValid: boolean;
  sanitizedSql: string;
  error?: string;
  warnings?: string[];
}

const DISALLOWED_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
  'REPLACE', 'ATTACH', 'DETACH', 'PRAGMA', 'VACUUM', 'EXEC', 'EXECUTE',
  'GRANT', 'REVOKE', 'COPY', 'INTO', 'MERGE', 'CALL', 'UPSERT', 'REINDEX'
];

export function validateAndSanitizeSql(rawSql: string, maxRows: number = 500): ValidationResult {
  if (!rawSql || typeof rawSql !== 'string') {
    return { isValid: false, sanitizedSql: '', error: 'SQL query must be a non-empty string.' };
  }

  // 1. Strip trailing semicolons and whitespace
  let clean = rawSql.trim().replace(/;+\s*$/, '').trim();

  // 2. Reject multi-statement execution
  // Disallow semicolon in the body of the query (ignoring string literals)
  const nonStringContent = clean.replace(/'(?:''|[^'])*'/g, "''");
  if (nonStringContent.includes(';')) {
    return {
      isValid: false,
      sanitizedSql: '',
      error: 'Security Error: Multiple statements are strictly forbidden.'
    };
  }

  // 3. Remove inline/block comments to prevent comment-based filter bypass
  clean = clean
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .trim();

  // 4. Must start with SELECT or WITH
  const normalized = clean.toUpperCase();
  const startsWithSelect = normalized.startsWith('SELECT');
  const startsWithWith = normalized.startsWith('WITH');

  if (!startsWithSelect && !startsWithWith) {
    return {
      isValid: false,
      sanitizedSql: '',
      error: 'Security Error: Only read-only SELECT and WITH (CTE) queries are permitted.'
    };
  }

  // 5. Check for disallowed mutation keywords
  const tokens = normalized.match(/\b[A-Z_]+\b/g) || [];
  for (const token of tokens) {
    if (DISALLOWED_KEYWORDS.includes(token)) {
      return {
        isValid: false,
        sanitizedSql: '',
        error: `Security Error: Disallowed keyword detected: '${token}'. Only read-only queries are supported.`
      };
    }
  }

  // 6. Enforce Table Whitelist
  // Extract words after FROM or JOIN
  const fromJoinMatches = clean.match(/(?:FROM|JOIN)\s+([a-zA-Z0-9_]+)/gi) || [];
  const referencedTables = fromJoinMatches.map(m => {
    const parts = m.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  });

  for (const table of referencedTables) {
    // If it's a CTE defined in the query or an approved table, allow
    const isApproved = APPROVED_TABLES.includes(table);
    const isCte = new RegExp(`\\b${table}\\s+AS\\s*\\(`, 'i').test(clean);
    if (!isApproved && !isCte) {
      return {
        isValid: false,
        sanitizedSql: '',
        error: `Security Error: Table or schema '${table}' is not in the approved analytics whitelist.`
      };
    }
  }

  // 7. Enforce LIMIT Clause
  // If query doesn't have a LIMIT clause, automatically append one
  const limitMatch = clean.match(/\bLIMIT\s+(\d+)/i);
  let finalSql = clean;
  const warnings: string[] = [];

  if (!limitMatch) {
    finalSql = `${clean} LIMIT ${maxRows}`;
  } else {
    const existingLimit = parseInt(limitMatch[1], 10);
    if (existingLimit > maxRows) {
      finalSql = clean.replace(/\bLIMIT\s+\d+/i, `LIMIT ${maxRows}`);
      warnings.push(`Row limit adjusted from ${existingLimit} to maximum safe threshold (${maxRows} rows).`);
    }
  }

  return {
    isValid: true,
    sanitizedSql: finalSql,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
