#!/usr/bin/env node
// Wrapper: parse the artemis-ii .env file safely (its anonymous-password-list
// section at the bottom breaks shell `source`), build RH_POSTGRES_URL, then
// invoke refresh.mjs / publish.mjs with that env set.
//
// The .env shape is:
//   PG_HOST=...
//   PG_PORT=...
//   PG_USER=...
//   PG_DB=...
//   FTP_HOST=...
//   FTP_USER=...
//   FTP_PASS=...
//   <anonymous password 1>     ← lines 8-11; not key=value
//   <anonymous password 2>
//   <anonymous password 3>
//   <anonymous password 4>     ← last line; per project memory, "ends with role name"
//
// We try each anonymous-password line as PG_PASSWORD until pg connects, in
// reverse order (last-line first per the memory hint).
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
const ENV_PATH = '/media/foxy/ai/GSD/dev-tools/artemis-ii/.env';

if (!existsSync(ENV_PATH)) {
  console.error(`fatal: ${ENV_PATH} not found`);
  process.exit(1);
}

const lines = readFileSync(ENV_PATH, 'utf8').split('\n').filter(l => l.trim());
const kv = {};
const anonPasswords = [];

for (const line of lines) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
  if (m && /^(PG_|FTP_)/.test(m[1])) {
    kv[m[1]] = m[2];
  } else if (!/^#/.test(line) && !/^[A-Z_]+=/.test(line)) {
    // Doesn't look like KEY=VALUE; treat as anonymous password line
    anonPasswords.push(line);
  }
}

const required = ['PG_HOST', 'PG_PORT', 'PG_USER', 'PG_DB'];
for (const k of required) {
  if (!kv[k]) {
    console.error(`fatal: missing ${k} in ${ENV_PATH}`);
    process.exit(1);
  }
}
if (anonPasswords.length === 0) {
  console.error('fatal: no anonymous-password lines found in .env');
  process.exit(1);
}

// Try each anonymous password (last-first per memory hint)
const passwordOrder = [...anonPasswords].reverse();

const subcommand = process.argv[2];
const subArgs = process.argv.slice(3);
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

// Test each password by running a tiny pg-connect probe via psql (if available)
// or via node's pg client. Simpler: just try each in order; the first one that
// allows the wrapped subcommand to exit non-fatally wins.

function buildPgUrl(password) {
  // URL-encode the password (special chars are present)
  const encUser = encodeURIComponent(kv.PG_USER);
  const encPass = encodeURIComponent(password);
  return `postgresql://${encUser}:${encPass}@${kv.PG_HOST}:${kv.PG_PORT}/${kv.PG_DB}`;
}

// First, probe with `psql` if available — much faster than running the full
// subcommand. Falls back to spawning the actual subcommand if psql is absent.
const psqlAvail = spawnSync('which', ['psql'], { encoding: 'utf8' }).status === 0;

let workingPassword = null;
if (psqlAvail) {
  for (const pw of passwordOrder) {
    const url = buildPgUrl(pw);
    const probe = spawnSync('psql', [url, '-c', 'SELECT 1'], {
      encoding: 'utf8',
      env: { ...process.env, PGCONNECT_TIMEOUT: '3' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (probe.status === 0) {
      workingPassword = pw;
      break;
    }
  }
  if (!workingPassword) {
    console.error('fatal: none of the anonymous-password lines accepted by Postgres');
    console.error(`tried ${passwordOrder.length} passwords against ${kv.PG_HOST}:${kv.PG_PORT}/${kv.PG_DB} as user ${kv.PG_USER}`);
    process.exit(1);
  }
} else {
  // No psql — just use the last-line password (per memory hint)
  workingPassword = passwordOrder[0];
  console.error('[run-with-pg] psql not found; using last-line password (unverified)');
}

const RH_POSTGRES_URL = buildPgUrl(workingPassword);

// Now run the subcommand with the env populated
const result = spawnSync('node', [subcommandPath, ...subArgs], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: {
    ...process.env,
    RH_POSTGRES_URL,
    PGPASSWORD: workingPassword,
    PG_HOST: kv.PG_HOST,
    PG_PORT: kv.PG_PORT,
    PG_USER: kv.PG_USER,
    PG_DB: kv.PG_DB,
  },
});

process.exit(result.status ?? 1);
