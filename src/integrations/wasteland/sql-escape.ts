/**
 * sql-escape — hardened SQL escaping utilities for wasteland DoltHub operations.
 *
 * All SQL value interpolation in the wasteland integration routes through
 * sqlEscape(). No raw string interpolation is permitted elsewhere (SEC-02).
 *
 * @module sql-escape
 */

/**
 * Escape a string value for safe interpolation inside a SQL single-quote context.
 *
 * Applies three transformations in order:
 * 1. Strip null bytes — Dolt and MySQL treat \x00 as a string terminator.
 * 2. Double backslashes — prevent escape sequence injection.
 * 3. Double single quotes — standard SQL single-quote escaping.
 *
 * @param value - The raw string value to escape.
 * @returns The escaped string, safe to wrap in single quotes in a SQL statement.
 *
 * @example
 * sqlEscape("O'Brien")     // => "O''Brien"
 * sqlEscape("back\\slash") // => "back\\\\slash"
 * sqlEscape("null\x00byte") // => "nullbyte"
 * sqlEscape("normal text") // => "normal text"
 */
export function sqlEscape(value: string): string {
  return value
    .replace(/\x00/g, '')       // 1. strip null bytes
    .replace(/\\/g, '\\\\')     // 2. double backslashes
    .replace(/'/g, "''");       // 3. double single quotes
}

/**
 * Screen a complete SQL string for patterns that suggest injection attempts.
 *
 * This function screens the generated SQL statement (not a raw value) for
 * injection-indicative patterns. It is intended as a second line of defence
 * after sqlEscape() has already been applied to all values.
 *
 * Detected patterns:
 * - `--`       → "SQL comment (--)"
 * - `/*`       → "block comment (/*)"
 * - DROP       → "DROP statement"
 * - DELETE     → "DELETE statement"
 * - UPDATE     → "UPDATE statement"
 * - `';`       → "semicolon after closing quote"
 *
 * @param sql - The full SQL string to screen.
 * @returns An object with `safe` (true when no threats found) and `threats`
 *          (array of human-readable threat labels).
 *
 * @example
 * screenForInjection("SELECT * FROM rigs WHERE handle = 'fox'")
 * // => { safe: true, threats: [] }
 *
 * screenForInjection("'; DROP TABLE rigs; --")
 * // => { safe: false, threats: ["SQL comment (--)", "DROP statement", "semicolon after closing quote"] }
 */
export function screenForInjection(sql: string): { safe: boolean; threats: string[] } {
  const threats: string[] = [];

  if (sql.includes('--')) {
    threats.push('SQL comment (--)');
  }
  if (sql.includes('/*')) {
    threats.push('block comment (/*)');
  }
  if (/\bDROP\b/i.test(sql)) {
    threats.push('DROP statement');
  }
  if (/\bDELETE\b/i.test(sql)) {
    threats.push('DELETE statement');
  }
  if (/\bUPDATE\b/i.test(sql)) {
    threats.push('UPDATE statement');
  }
  if (sql.includes("';")) {
    threats.push('semicolon after closing quote');
  }

  return { safe: threats.length === 0, threats };
}
