/**
 * SCRIBE PG Runtime — env-loader.ts
 *
 * Reads PG credentials using the canonical `<repo-root>/.env` discipline,
 * mirroring `tools/release-history/run-with-pg.mjs` exactly.
 *
 * Override precedence (first match wins):
 *   1. RH_ENV_FILE=<path>       — preferred override
 *   2. ARTEMIS_REPO_ENV=<path>  — deprecated alias (backward-compat; emits warning)
 *   3. <repo-root>/.env         — default
 *
 * Within the resolved .env file:
 *   - `RH_POSTGRES_URL` — used verbatim when present
 *   - `PGHOST` + `PGPORT` + `PGUSER` + `PGDATABASE` + `PGPASSWORD` — composed when URL absent
 *
 * Returns `{ ok: true, url: string }` on success,
 *         `{ ok: false, reason: PgNotConfiguredReason }` otherwise.
 *
 * @module scribe/pg-runtime/env-loader
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Public result type
// ---------------------------------------------------------------------------

export type PgNotConfiguredReason =
  | 'pg-not-configured'
  | 'env-file-missing'
  | 'missing-pg-keys';

export type EnvLoadResult =
  | { ok: true; url: string; source: string }
  | { ok: false; reason: PgNotConfiguredReason; hint: string };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the path to the .env file, honoring override env vars.
 *
 * `repoRoot` is provided as a parameter so callers (and tests) can supply an
 * explicit root without relying on `import.meta.url` resolution. When omitted,
 * resolves relative to this file's location inside `src/scribe/pg-runtime/`.
 */
export function resolveEnvPath(repoRoot?: string): {
  envPath: string;
  source: string;
} {
  // Determine the repo root:
  //   - Caller-supplied (test override)
  //   - Or walk up: src/scribe/pg-runtime/ → src/scribe/ → src/ → <repo-root>
  const root =
    repoRoot ??
    resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

  const envPath =
    process.env.RH_ENV_FILE ??
    process.env.ARTEMIS_REPO_ENV ??
    join(root, '.env');

  const source = process.env.RH_ENV_FILE
    ? 'RH_ENV_FILE env var'
    : process.env.ARTEMIS_REPO_ENV
      ? 'ARTEMIS_REPO_ENV env var (deprecated)'
      : 'default <repo-root>/.env';

  return { envPath, source };
}

/**
 * Parse a `.env` file (KEY=VALUE format, comments and blanks ignored).
 * Strips MATCHED outer double- or single-quote pairs only.
 * Preserves a lone leading apostrophe (FTP_PASS gotcha: first char may be `'`).
 *
 * Mirrors the parsing logic in `tools/release-history/run-with-pg.mjs`.
 */
export function parseEnvFile(content: string): Record<string, string> {
  const kv: Record<string, string> = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2]!;
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if (
        (first === '"' && last === '"') ||
        (first === "'" && last === "'")
      ) {
        value = value.slice(1, -1);
      }
    }
    kv[m[1]!] = value;
  }
  return kv;
}

/**
 * Compose a PostgreSQL URL from the PG{HOST,PORT,USER,DATABASE,PASSWORD} keys.
 * Returns null if any required key is absent.
 */
export function composeUrlFromPgKeys(
  kv: Record<string, string>,
): string | null {
  const required = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'] as const;
  const missing = required.filter((k) => !kv[k]);
  if (missing.length > 0) return null;
  const encUser = encodeURIComponent(kv['PGUSER']!);
  const encPass = encodeURIComponent(kv['PGPASSWORD']!);
  return `postgresql://${encUser}:${encPass}@${kv['PGHOST']}:${kv['PGPORT']}/${kv['PGDATABASE']}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Load PG credentials using the canonical env-loading discipline.
 *
 * @param repoRoot - optional explicit repo root (for testing with temp .env files)
 * @param silent   - when true, suppresses deprecation warnings (for testing)
 */
export function loadPgEnv(
  repoRoot?: string,
  silent = false,
): EnvLoadResult {
  // Emit deprecation warning when ARTEMIS_REPO_ENV is used without RH_ENV_FILE.
  if (process.env.ARTEMIS_REPO_ENV && !process.env.RH_ENV_FILE && !silent) {
    console.error(
      '[scribe/pg-runtime] DEPRECATION: ARTEMIS_REPO_ENV is deprecated as of v1.49.585. ' +
        'Use RH_ENV_FILE instead.',
    );
  }

  const { envPath, source } = resolveEnvPath(repoRoot);

  // Fast path: if no PG env vars and no .env file, return pg-not-configured.
  // Check if process env already has RH_POSTGRES_URL set directly.
  if (process.env.RH_POSTGRES_URL) {
    return {
      ok: true,
      url: process.env.RH_POSTGRES_URL,
      source: 'RH_POSTGRES_URL process env var',
    };
  }

  if (!existsSync(envPath)) {
    // No .env file — check if PG* keys are in the process environment directly.
    const urlFromEnv = composeUrlFromPgKeys(process.env as Record<string, string>);
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
      hint: `No .env file at ${envPath} and no PG env vars in process environment. ` +
        `Set RH_POSTGRES_URL or PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD, ` +
        `or create ${envPath} with RH_POSTGRES_URL=postgresql://...`,
    };
  }

  // Parse the .env file.
  let content: string;
  try {
    content = readFileSync(envPath, 'utf8');
  } catch {
    return {
      ok: false,
      reason: 'env-file-missing',
      hint: `Failed to read .env file at ${envPath}`,
    };
  }

  const kv = parseEnvFile(content);

  // Prefer the pre-built URL.
  if (kv['RH_POSTGRES_URL']) {
    return { ok: true, url: kv['RH_POSTGRES_URL']!, source };
  }

  // Fall back to composing from PG* keys.
  const composed = composeUrlFromPgKeys(kv);
  if (composed) {
    return { ok: true, url: composed, source };
  }

  // Neither RH_POSTGRES_URL nor the full PG* key set is present.
  const required = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'] as const;
  const missing = required.filter((k) => !kv[k]);
  return {
    ok: false,
    reason: 'missing-pg-keys',
    hint:
      `${envPath} has neither RH_POSTGRES_URL nor the full PG{HOST,PORT,USER,DATABASE,PASSWORD} set. ` +
      `Missing keys: ${missing.join(', ')}. ` +
      `Add RH_POSTGRES_URL=postgresql://... to ${envPath}, or add the missing PG* keys.`,
  };
}
