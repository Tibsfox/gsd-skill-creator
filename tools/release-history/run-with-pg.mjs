#!/usr/bin/env node
// Wrapper: read PG credentials from <repo-root>/.env (canonical), set
// RH_POSTGRES_URL in the environment, then invoke refresh.mjs / publish.mjs.
//
// The .env shape (project root):
//   RH_POSTGRES_URL=postgresql://<user>:<pass>@<host>:<port>/<db>   ← preferred
//   PGHOST=...
//   PGPORT=...
//   PGUSER=...
//   PGDATABASE=...
//   PGPASSWORD=...
//
// If RH_POSTGRES_URL is present, it is used verbatim. Otherwise the wrapper
// constructs it from PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD.
//
// Override the .env path via:
//   RH_ENV_FILE=/path/to/alt/.env node tools/release-history/run-with-pg.mjs <args>
//
// The legacy `ARTEMIS_REPO_ENV` env var is accepted for backward-compatibility
// with operators who may have it set, but its use is deprecated. The wrapper
// previously parsed `PG_HOST`/`PG_PORT`/`PG_USER`/`PG_DB` plus an anonymous-
// password-list section from the artemis-ii worktree's .env; both that path
// default AND the password-list parsing were removed in v1.49.585 (full
// deprecation per user direction; see .planning/missions/v1-49-585-
// concerns-cleanup/components/08-artemis-env-var.md and CONCERNS §8).
//
// Usage: node tools/release-history/run-with-pg.mjs <subcommand> [args...]
//   e.g. node tools/release-history/run-with-pg.mjs refresh --fast --quiet
//        node tools/release-history/run-with-pg.mjs publish --execute --version v1.49.582

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

/**
 * Path to the .env file containing PG credentials.
 *
 * Default: <repo-root>/.env (canonical location per v1.49.585 user direction).
 *
 * Override precedence (first match wins):
 *   1. RH_ENV_FILE=<path>        (preferred new env-var)
 *   2. ARTEMIS_REPO_ENV=<path>   (deprecated alias; kept for backward-compat)
 *   3. <repo-root>/.env          (default)
 */
const ENV_PATH =
  process.env.RH_ENV_FILE ??
  process.env.ARTEMIS_REPO_ENV ??
  join(REPO_ROOT, '.env');

const ENV_SOURCE = process.env.RH_ENV_FILE
  ? 'RH_ENV_FILE env var'
  : process.env.ARTEMIS_REPO_ENV
    ? 'ARTEMIS_REPO_ENV env var (deprecated)'
    : 'default <repo-root>/.env';

// --check flag: exit 0 after env-file existence + RH_POSTGRES_URL presence
// verification, before the subcommand spawn. Used by C08 test fixtures.
const CHECK_ONLY = process.argv.includes('--check');

if (process.env.ARTEMIS_REPO_ENV && !process.env.RH_ENV_FILE) {
  console.error(
    `[run-with-pg] DEPRECATION NOTICE: ARTEMIS_REPO_ENV is deprecated as of v1.49.585. ` +
    `Use RH_ENV_FILE instead. The wrapper continues to honor ARTEMIS_REPO_ENV for now ` +
    `for backward-compat with existing operator setups.`
  );
}

if (!existsSync(ENV_PATH)) {
  console.error(`
[run-with-pg] PG credentials .env file not found.

  Resolved path: ${ENV_PATH}
  Source:        ${ENV_SOURCE}

  This script needs an .env file containing either RH_POSTGRES_URL (preferred)
  or PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD that can be assembled into one.

  Resolution options:
    1. Create <repo-root>/.env with at minimum RH_POSTGRES_URL=postgresql://...
    2. If your .env is at a different path:
         RH_ENV_FILE=/your/path/to/.env node tools/release-history/run-with-pg.mjs <args>
    3. If you don't have PG access, you cannot run release-history refresh.
       The check-completeness.mjs gate runs without it — only refresh requires PG.

  See: CLAUDE.md "RELEASE-HISTORY.md refresh (post-tag)" section.
`);
  process.exit(2);
}

// Parse the .env file — KEY=VALUE lines only; comments and blanks ignored.
const envLines = readFileSync(ENV_PATH, 'utf8').split('\n');
const kv = {};
for (const raw of envLines) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
  if (!m) continue;
  let value = m[2];
  // Strip MATCHED outer quotes only (single or double); preserve a lone leading
  // apostrophe that is part of a value (per FTP_PASS gotcha — first char of
  // some passwords is a literal `'`). The matched-pair test guards against
  // stripping a substantive leading quote.
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      value = value.slice(1, -1);
    }
  }
  kv[m[1]] = value;
}

// Derive RH_POSTGRES_URL: prefer the .env's pre-built value; fall back to
// constructing from PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD.
let RH_POSTGRES_URL = kv.RH_POSTGRES_URL ?? '';
let derivedFrom = 'RH_POSTGRES_URL';

if (!RH_POSTGRES_URL) {
  const required = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'];
  const missing = required.filter(k => !kv[k]);
  if (missing.length) {
    console.error(
      `[run-with-pg] fatal: ${ENV_PATH} has neither RH_POSTGRES_URL nor ` +
      `the full PG{HOST,PORT,USER,DATABASE,PASSWORD} set.\n` +
      `  Missing keys: ${missing.join(', ')}\n` +
      `  Resolution: add RH_POSTGRES_URL=postgresql://... to ${ENV_PATH}, ` +
      `OR add the missing PG* keys.`
    );
    process.exit(1);
  }
  const encUser = encodeURIComponent(kv.PGUSER);
  const encPass = encodeURIComponent(kv.PGPASSWORD);
  RH_POSTGRES_URL = `postgresql://${encUser}:${encPass}@${kv.PGHOST}:${kv.PGPORT}/${kv.PGDATABASE}`;
  derivedFrom = 'PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD';
}

if (CHECK_ONLY) {
  console.log(
    `[run-with-pg] --check OK: ${ENV_PATH} exists; ` +
    `RH_POSTGRES_URL ${derivedFrom === 'RH_POSTGRES_URL' ? 'present (pre-built)' : 'derived from PG* keys'}`
  );
  process.exit(0);
}

const subcommand = process.argv[2];
const subArgs = process.argv.slice(3).filter(a => a !== '--check');
if (!subcommand) {
  console.error('usage: node run-with-pg.mjs <subcommand> [args...]');
  console.error('  subcommand: refresh | publish | scan | ingest | <other-tool>.mjs');
  process.exit(1);
}

const subcommandPath = subcommand.endsWith('.mjs')
  ? join(HERE, subcommand)
  : join(HERE, `${subcommand}.mjs`);

if (!existsSync(subcommandPath)) {
  console.error(`fatal: subcommand script not found: ${subcommandPath}`);
  process.exit(1);
}

// Run the subcommand with RH_POSTGRES_URL set in env. Also forward PG* keys
// for any tooling that prefers them as separate variables.
const result = spawnSync('node', [subcommandPath, ...subArgs], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    RH_POSTGRES_URL,
    ...(kv.PGHOST ? { PGHOST: kv.PGHOST } : {}),
    ...(kv.PGPORT ? { PGPORT: kv.PGPORT } : {}),
    ...(kv.PGUSER ? { PGUSER: kv.PGUSER } : {}),
    ...(kv.PGDATABASE ? { PGDATABASE: kv.PGDATABASE } : {}),
    ...(kv.PGPASSWORD ? { PGPASSWORD: kv.PGPASSWORD } : {}),
  },
});

process.exit(result.status ?? 1);
