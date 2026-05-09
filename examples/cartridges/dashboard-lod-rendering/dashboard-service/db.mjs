#!/usr/bin/env node
// =============================================================================
// dashboard-service / db.mjs
// =============================================================================
// PG pool + env loader for the SCRIBE dashboard service.
//
// Mirrors the canonical env-loading discipline from:
//   tools/release-history/run-with-pg.mjs
//
// Env var precedence (first match wins):
//   1. RH_ENV_FILE=<path>       → read .env from that path (preferred override)
//   2. ARTEMIS_REPO_ENV=<path>  → deprecated alias (emits warning; backward-compat)
//   3. <repo-root>/.env         → default (canonical per v1.49.585)
//
// Within the resolved .env file:
//   - RH_POSTGRES_URL           → used verbatim when present
//   - PGHOST + PGPORT + PGUSER + PGDATABASE + PGPASSWORD → composed when URL absent
//
// Mode switching:
//   - SCRIBE_DB_MODE=live (or PG env present + parseable) → live mode
//   - SCRIBE_DB_MODE=static (or PG env absent)           → static mode
//     Static mode: /api/graph/sample serves JSON; upstream/downstream/search → 501
//
// Usage:
//   import { loadPgConfig, createPool, query } from './db.mjs';
//   const cfg = loadPgConfig();
//   if (cfg.ok) { const pool = createPool(cfg.url); ... }
// =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Walk up from dashboard-service/ → dashboard-lod-rendering/ → cartridges/
// → examples/ → <repo-root>
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');

// ---------------------------------------------------------------------------
// Env resolution (mirrors run-with-pg.mjs exactly)
// ---------------------------------------------------------------------------

/**
 * Resolve the .env file path, honoring override env vars.
 *
 * @returns {{ envPath: string, source: string }}
 */
function resolveEnvPath() {
  const envPath =
    process.env.RH_ENV_FILE ??
    process.env.ARTEMIS_REPO_ENV ??
    join(REPO_ROOT, '.env');

  const source = process.env.RH_ENV_FILE
    ? 'RH_ENV_FILE env var'
    : process.env.ARTEMIS_REPO_ENV
      ? 'ARTEMIS_REPO_ENV env var (deprecated)'
      : 'default <repo-root>/.env';

  return { envPath, source };
}

/**
 * Parse a .env file — KEY=VALUE format. Ignores comments (#) and blank lines.
 * Strips MATCHED outer quote pairs only (preserves lone leading apostrophe).
 *
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseEnvFile(content) {
  const kv = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2];
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    kv[m[1]] = value;
  }
  return kv;
}

/**
 * Compose a postgresql:// URL from PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD.
 * Returns null if any key is absent.
 *
 * @param {Record<string, string|undefined>} kv
 * @returns {string|null}
 */
function composeUrl(kv) {
  const required = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'];
  const missing = required.filter(k => !kv[k]);
  if (missing.length > 0) return null;
  const encUser = encodeURIComponent(kv.PGUSER);
  const encPass = encodeURIComponent(kv.PGPASSWORD);
  return `postgresql://${encUser}:${encPass}@${kv.PGHOST}:${kv.PGPORT}/${kv.PGDATABASE}`;
}

/**
 * Load PG credentials.
 *
 * Returns:
 *   { ok: true, url: string, source: string }
 *   { ok: false, reason: string, hint: string }
 */
export function loadPgConfig() {
  // Deprecation warning for ARTEMIS_REPO_ENV.
  if (process.env.ARTEMIS_REPO_ENV && !process.env.RH_ENV_FILE) {
    console.warn(
      '[db.mjs] DEPRECATION: ARTEMIS_REPO_ENV is deprecated as of v1.49.585. ' +
      'Use RH_ENV_FILE instead.'
    );
  }

  // Fast path: RH_POSTGRES_URL already in process env.
  if (process.env.RH_POSTGRES_URL) {
    return {
      ok: true,
      url: process.env.RH_POSTGRES_URL,
      source: 'RH_POSTGRES_URL process env var',
    };
  }

  const { envPath, source } = resolveEnvPath();

  if (!existsSync(envPath)) {
    // No .env file — check if PG* keys are in process env directly.
    const urlFromEnv = composeUrl(process.env);
    if (urlFromEnv) {
      return {
        ok: true,
        url: urlFromEnv,
        source: 'PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD process env vars',
      };
    }
    return {
      ok: false,
      reason: 'pg-not-configured',
      hint:
        `No .env file at ${envPath} and no PG env vars in process environment. ` +
        `Set RH_POSTGRES_URL or PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD.`,
    };
  }

  let content;
  try {
    content = readFileSync(envPath, 'utf8');
  } catch (err) {
    return {
      ok: false,
      reason: 'env-file-missing',
      hint: `Failed to read .env file at ${envPath}: ${err.message}`,
    };
  }

  const kv = parseEnvFile(content);

  // Prefer the pre-built URL from .env.
  if (kv.RH_POSTGRES_URL) {
    return { ok: true, url: kv.RH_POSTGRES_URL, source };
  }

  // Fall back to composing from PG* keys.
  const composed = composeUrl(kv);
  if (composed) {
    return { ok: true, url: composed, source };
  }

  const required = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'];
  const missing = required.filter(k => !kv[k]);
  return {
    ok: false,
    reason: 'missing-pg-keys',
    hint:
      `${envPath} has neither RH_POSTGRES_URL nor the full PG{HOST,PORT,USER,DATABASE,PASSWORD} set. ` +
      `Missing keys: ${missing.join(', ')}.`,
  };
}

// ---------------------------------------------------------------------------
// Pool factory + query helper
// ---------------------------------------------------------------------------

/** Lazily imported `pg` module (optional dependency). */
let pgModule = null;

/**
 * Lazy-load the `pg` module. Returns null + logs error if not installed.
 */
async function getPg() {
  if (pgModule) return pgModule;
  try {
    pgModule = await import('pg');
    return pgModule;
  } catch {
    console.error(
      '[db.mjs] `pg` package not found. ' +
      'Run: cd examples/cartridges/dashboard-lod-rendering/dashboard-service && npm install'
    );
    return null;
  }
}

/**
 * Create a pg.Pool configured from the resolved PG URL.
 *
 * @param {string} url - postgresql:// connection string
 * @param {{ max?: number, idleTimeoutMillis?: number }} [opts]
 * @returns {pg.Pool}
 */
export async function createPool(url, opts = {}) {
  const pg = await getPg();
  if (!pg) throw new Error('pg package is required for live mode');
  const { Pool } = pg.default ?? pg;
  return new Pool({
    connectionString: url,
    max: opts.max ?? 5,
    idleTimeoutMillis: opts.idleTimeoutMillis ?? 10_000,
  });
}

/**
 * Run a parameterized query on the pool. Returns { rows }.
 *
 * @param {pg.Pool} pool
 * @param {string} sql
 * @param {unknown[]} [params]
 * @returns {Promise<{ rows: unknown[] }>}
 */
export async function query(pool, sql, params = []) {
  const result = await pool.query(sql, params);
  return { rows: result.rows };
}

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

/**
 * Determine whether the service should start in live or static mode.
 *
 * Live mode requires:
 *   - SCRIBE_DB_MODE=live  OR  PG env vars present/parseable
 *   - AND `pg` package installed
 *
 * @returns {{ live: boolean, pgConfig: object|null }}
 */
export function detectMode() {
  const forceLive = process.env.SCRIBE_DB_MODE === 'live';
  const forceStatic = process.env.SCRIBE_DB_MODE === 'static';

  if (forceStatic) {
    return { live: false, pgConfig: null };
  }

  const pgConfig = loadPgConfig();
  if (pgConfig.ok && (forceLive || !forceStatic)) {
    return { live: true, pgConfig };
  }

  return { live: false, pgConfig: null };
}
