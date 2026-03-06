/**
 * dolthub-client — unified DoltHub REST + local Dolt CLI client.
 *
 * All Phase 2+ CLI commands import this module for data access. No command
 * should duplicate DoltHub REST or local Dolt CLI logic.
 *
 * Design:
 * - REST-first: query() tries the DoltHub REST API, then falls back to local.
 * - SEC-01: All Dolt CLI calls use execFile() with array arguments. exec() is
 *   never used. No shell interpolation occurs at the OS level.
 * - SEC-02: generateSQL() routes all values through sqlEscape(). No raw string
 *   interpolation is permitted in SQL output.
 *
 * @module dolthub-client
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sqlEscape } from './sql-escape.js';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Configuration for a DoltHub client instance. */
export interface DoltHubClientConfig {
  /** DoltHub upstream repo in "owner/repo" format (e.g. "hop/wl-commons"). */
  upstream: string;
  /** User's fork in "owner/repo" format. */
  fork: string;
  /** Absolute path to the local Dolt clone. */
  localDir: string;
  /** Branch to query. Defaults to "main". */
  branch?: string;
}

/** Result of a query operation, with the data source indicated. */
export interface QueryResult {
  rows: Record<string, string>[];
  source: 'rest' | 'local';
}

/** Result of an execute operation. */
export interface ExecuteResult {
  stdout: string;
  stderr: string;
}

/** The DoltHub client interface. All Phase 2+ CLI commands work against this. */
export interface DoltClient {
  /**
   * Run a read-only SQL query. Tries DoltHub REST API first; falls back to
   * local Dolt CLI when the API is unreachable or returns a non-ok status.
   *
   * @param sql - The SQL query string.
   * @throws When the REST API returns query_execution_status 'RowLimit'.
   */
  query(sql: string): Promise<QueryResult>;

  /**
   * Run a SQL query using the local Dolt CLI only (bypasses REST API).
   * Used by the query() fallback and directly when local execution is required.
   *
   * @param sql - The SQL query string.
   */
  localQuery(sql: string): Promise<QueryResult>;

  /**
   * Generate a parameterised SQL statement by substituting ? placeholders
   * with sqlEscape()-escaped values wrapped in single quotes.
   *
   * Every value is routed through sqlEscape() — no raw string interpolation
   * is performed (SEC-02).
   *
   * @param template - SQL template with ? as positional placeholders.
   * @param values   - Values to substitute in order.
   * @returns The interpolated SQL string with all values escaped.
   *
   * @example
   * generateSQL('INSERT INTO rigs (handle) VALUES (?)', ["O'Brien"])
   * // => "INSERT INTO rigs (handle) VALUES ('O''Brien')"
   */
  generateSQL(template: string, values: string[]): string;

  /**
   * Execute a mutating SQL statement against the local Dolt clone.
   * Uses execFile() with array arguments (SEC-01 — no shell interpolation).
   *
   * @param sql - The SQL statement to execute.
   */
  execute(sql: string): Promise<ExecuteResult>;
}

// ---------------------------------------------------------------------------
// DoltHub REST API response type
// ---------------------------------------------------------------------------

interface DoltHubResponse {
  query_execution_status: string;
  rows?: Record<string, string>[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a DoltHub client backed by both REST and local Dolt CLI.
 *
 * @param config - Client configuration (upstream, fork, localDir, branch).
 * @returns A DoltClient instance ready to query and execute.
 */
export function createClient(config: DoltHubClientConfig): DoltClient {
  const branch = config.branch ?? 'main';

  async function localQuery(sql: string): Promise<QueryResult> {
    // SEC-01: execFile with array args — no shell string interpolation
    const { stdout } = await execFileAsync(
      'dolt',
      ['sql', '-q', sql, '-r', 'json'],
      { cwd: config.localDir, timeout: 30000 },
    );
    const parsed = JSON.parse(stdout) as { rows?: Record<string, string>[] };
    return { rows: parsed.rows ?? [], source: 'local' };
  }

  async function query(sql: string): Promise<QueryResult> {
    const url = `https://www.dolthub.com/api/v1alpha1/${config.upstream}/${branch}?q=${encodeURIComponent(sql)}`;

    let data: DoltHubResponse;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Non-ok HTTP response — fall back to local
        return localQuery(sql);
      }
      data = (await response.json()) as DoltHubResponse;
    } catch {
      // Network error (fetch rejected) — fall back to local
      return localQuery(sql);
    }

    if (data.query_execution_status === 'RowLimit') {
      throw new Error(
        'DoltHub query truncated (RowLimit) — results may be incomplete',
      );
    }

    if (data.query_execution_status !== 'Success') {
      throw new Error(`DoltHub query failed: ${data.query_execution_status}`);
    }

    return { rows: data.rows ?? [], source: 'rest' };
  }

  function generateSQL(template: string, values: string[]): string {
    let i = 0;
    return template.replace(/\?/g, () => {
      const raw = values[i++] ?? '';
      return `'${sqlEscape(raw)}'`;
    });
  }

  async function execute(sql: string): Promise<ExecuteResult> {
    // SEC-01: execFile with array args — no shell string interpolation
    const { stdout, stderr } = await execFileAsync(
      'dolt',
      ['sql', '-q', sql],
      { cwd: config.localDir, timeout: 30000 },
    );
    return { stdout, stderr };
  }

  return { query, localQuery, generateSQL, execute };
}
