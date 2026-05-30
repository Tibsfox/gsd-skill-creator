#!/usr/bin/env node
/**
 * tools/ftp-delete.mjs — targeted remote-path deletion for tibsfox.com Research/
 *
 * Sibling to tools/ftp-sync.mjs. Where ftp-sync pushes files up, ftp-delete
 * removes mistakenly-published paths. Built for the v1.49.621 SCRIBE deploy
 * cleanup (SCRIBE/dashboard/ + SCRIBE/dashboard-lod-rendering/ leaked
 * .planning/-referencing demo content to public www); generalized for any
 * future FTP-removal need.
 *
 * Connection facts (shared with ftp-sync):
 *   - host/user/pass read from .env (FTP_HOST, FTP_USER, FTP_PASS)
 *   - FTP_PASS leading single-quote IS the password (NOT stripped)
 *   - remote root `/` maps to /Research/ on the visible URL — paths passed in
 *     therefore start at /SCRIBE, /NASA, /MUS, /ELC (NOT /Research/SCRIBE)
 *
 * Usage:
 *   node tools/ftp-delete.mjs <remote-path> [<remote-path>...] [flags]
 *
 *   --dry-run         list what would be deleted, no FTP connection
 *   --recursive       allow deletion of directories (recursive removal)
 *   --json            machine-readable summary
 *   --no-verify       skip post-delete HTTPS HEAD probe
 *   --allow-protected override the refusal for top-level paths (DANGER)
 *
 * Examples:
 *   node tools/ftp-delete.mjs /SCRIBE/dashboard /SCRIBE/dashboard-lod-rendering --recursive --dry-run
 *   node tools/ftp-delete.mjs /SCRIBE/dashboard /SCRIBE/dashboard-lod-rendering --recursive
 *   node tools/ftp-delete.mjs /SCRIBE/some-stale-file.html
 *
 * Safety:
 *   - Paths must start with `/` (absolute remote)
 *   - `..` segments are rejected
 *   - Top-level dirs (/, /NASA, /MUS, /ELC, /SCRIBE) refuse deletion unless
 *     --allow-protected is passed (you almost never want this; only escape
 *     hatch for total wipe)
 *   - Directory removal requires --recursive (a single misdirected dir-rm
 *     could nuke a whole track)
 *
 * Exit codes:
 *   0  all targets deleted + verified gone (or dry-run completed)
 *   1  one or more delete operations failed
 *   2  invalid arguments OR .env missing required keys
 *   3  one or more targets refused for safety (protected path or invalid path)
 *   4  post-delete probe found URLs still serving content (drift detection)
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// `basic-ftp` is lazy-imported inside main() (the live-delete path) — it is an
// optional, undeclared runtime dependency needed ONLY for real (non-dry-run)
// FTP operations. A top-level import makes the module unloadable when basic-ftp
// is absent, breaking the pure-helper test suite (v1.49.913). See ftp-sync.mjs.

import {
  parseEnv,
  validateEnv,
  remotePathToUrl,
  probeUrl,
} from './ftp-sync.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

const REPO_ROOT = resolveRoot(process.argv);

/**
 * Top-level paths that refuse direct deletion. Their subpaths are fine; the
 * dir itself is not. Override via --allow-protected.
 */
export const PROTECTED_PATHS = new Set([
  '/',
  '/NASA',
  '/MUS',
  '/ELC',
  '/SCRIBE',
  '/Research',
]);

/**
 * Validate and normalize a single remote path.
 * Returns { ok: true, path } or { ok: false, reason }.
 */
export function parseRemotePath(raw) {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { ok: false, reason: 'empty path' };
  }
  if (!raw.startsWith('/')) {
    return { ok: false, reason: `path must start with /: ${raw}` };
  }
  // Reject any .. segment (normalized or unnormalized)
  const parts = raw.split('/').filter(Boolean);
  for (const p of parts) {
    if (p === '..' || p === '.') {
      return { ok: false, reason: `path may not contain . or .. segments: ${raw}` };
    }
    if (p.includes('\0')) {
      return { ok: false, reason: `path contains null byte: ${raw}` };
    }
  }
  // Strip a single trailing slash for consistency (but preserve "/" itself)
  let path = raw;
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return { ok: true, path };
}

/**
 * Classify a normalized path as protected or allowed.
 */
export function classifyTarget(normalizedPath, opts = {}) {
  const allowProtected = opts.allowProtected === true;
  if (PROTECTED_PATHS.has(normalizedPath)) {
    if (allowProtected) return { protected: true, blocked: false, reason: 'protected-overridden' };
    return { protected: true, blocked: true, reason: `refusing to delete protected path: ${normalizedPath}` };
  }
  return { protected: false, blocked: false };
}

/**
 * Validate a list of raw paths, returning allowed + blocked groups.
 */
export function validateDeleteTargets(rawPaths, opts = {}) {
  const allowed = [];
  const blocked = [];
  for (const raw of rawPaths) {
    const parsed = parseRemotePath(raw);
    if (!parsed.ok) {
      blocked.push({ raw, reason: parsed.reason });
      continue;
    }
    const cls = classifyTarget(parsed.path, opts);
    if (cls.blocked) {
      blocked.push({ raw, reason: cls.reason });
    } else {
      allowed.push({ raw, path: parsed.path, protected: cls.protected });
    }
  }
  return { allowed, blocked };
}

function loadEnv(repoRoot) {
  const envPath = process.env.RH_ENV_FILE || join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    return { __missing: envPath };
  }
  const txt = readFileSync(envPath, 'utf8');
  return parseEnv(txt);
}

/**
 * Probe whether a remote path is a directory or a file by attempting size().
 * basic-ftp's size() succeeds on files, throws on dirs (550 series error).
 */
async function probeRemoteType(client, path) {
  try {
    await client.size(path);
    return 'file';
  } catch {
    // Could be a directory or a non-existent path; try list of parent.
    try {
      const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) || '/' : '/';
      const name = path.slice(path.lastIndexOf('/') + 1);
      const listing = await client.list(parent);
      const entry = listing.find((e) => e.name === name);
      if (!entry) return 'missing';
      return entry.isDirectory ? 'directory' : 'file';
    } catch {
      return 'unknown';
    }
  }
}

async function deleteOne(client, target, opts) {
  const { recursive, dryRun, json } = opts;
  if (dryRun) {
    if (!json) console.log(`[dry-run] would delete ${target.path}`);
    return { ...target, status: 'dry-run-listed' };
  }
  let kind = 'unknown';
  try {
    kind = await probeRemoteType(client, target.path);
  } catch (err) {
    return { ...target, status: 'failed', error: `probe failed: ${err.message || err}` };
  }
  if (kind === 'missing') {
    if (!json) console.log(`[skip] ${target.path} (already absent)`);
    return { ...target, status: 'absent', kind };
  }
  if (kind === 'directory' && !recursive) {
    if (!json) console.error(`[FAIL] ${target.path}: is a directory; pass --recursive to delete`);
    return { ...target, status: 'failed', kind, error: 'directory-without-recursive' };
  }
  try {
    if (kind === 'directory') {
      await client.removeDir(target.path);
    } else {
      await client.remove(target.path);
    }
    if (!json) console.log(`[ok] deleted ${target.path} (${kind})`);
    return { ...target, status: 'deleted', kind };
  } catch (err) {
    if (!json) console.error(`[FAIL] ${target.path}: ${err.message || err}`);
    return { ...target, status: 'failed', kind, error: String(err.message || err) };
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const json = argv.includes('--json');
  const recursive = argv.includes('--recursive');
  const noVerify = argv.includes('--no-verify');
  const allowProtected = argv.includes('--allow-protected');

  // Positional paths = anything that doesn't start with `--` and isn't a flag-value
  const rawPaths = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      i += 1; // skip its value
      continue;
    }
    if (a.startsWith('--')) continue;
    rawPaths.push(a);
  }

  if (rawPaths.length === 0) {
    console.error('Usage: node tools/ftp-delete.mjs <remote-path> [<remote-path>...] [flags]');
    console.error('Flags: --dry-run --recursive --json --no-verify --allow-protected');
    console.error('Example:');
    console.error('  node tools/ftp-delete.mjs /SCRIBE/dashboard /SCRIBE/dashboard-lod-rendering --recursive --dry-run');
    process.exit(2);
  }

  const env = loadEnv(REPO_ROOT);
  if (env.__missing) {
    console.error(`.env not found at: ${env.__missing}`);
    process.exit(2);
  }
  const v = validateEnv(env);
  if (!v.ok) {
    console.error(`.env missing required keys: ${v.missing.join(', ')}`);
    process.exit(2);
  }

  const { allowed, blocked } = validateDeleteTargets(rawPaths, { allowProtected });

  if (!json) {
    console.log(`FTP delete → ${env.FTP_HOST}`);
    console.log(`  Targets: ${allowed.length} allowed / ${blocked.length} blocked`);
    console.log(`  Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}${recursive ? ' (recursive)' : ''}`);
    if (allowed.length > 0) {
      console.log('  Allowed:');
      for (const t of allowed) console.log(`    ${t.path}${t.protected ? ' [protected, overridden]' : ''}`);
    }
    if (blocked.length > 0) {
      console.log('  Blocked:');
      for (const b of blocked) console.log(`    ${b.raw}: ${b.reason}`);
    }
    console.log('');
  }

  if (allowed.length === 0) {
    if (json) {
      console.log(JSON.stringify({ blocked, allowed: [], deleted: [], failures: blocked.length }, null, 2));
    }
    // Exit 3 = some target was refused; nothing to do.
    process.exit(3);
  }

  let client;
  if (!dryRun) {
    const { Client } = await import('basic-ftp'); // lazy — see top-of-file note
    client = new Client();
    client.ftp.verbose = false;
    try {
      await client.access({
        host: env.FTP_HOST,
        user: env.FTP_USER,
        password: env.FTP_PASS,
        secure: false,
      });
    } catch (err) {
      console.error(`FTP connect failed: ${err.message || err}`);
      try { client.close(); } catch {}
      process.exit(1);
    }
  }

  const results = [];
  for (const t of allowed) {
    const r = await deleteOne(client, t, { recursive, dryRun, json });
    results.push(r);
  }

  if (client) client.close();

  const failures = results.filter((r) => r.status === 'failed');
  const deleted = results.filter((r) => r.status === 'deleted');
  const absent = results.filter((r) => r.status === 'absent');

  // Post-delete verification probe (mirrors ftp-sync's verification model):
  // HEAD-probe each deleted target's URL; expect non-200 (404 ideally).
  let verification = { skipped: true, probes: [], stillServing: 0 };
  if (!dryRun && !noVerify && deleted.length > 0) {
    const baseUrl = env.FTP_PUBLIC_BASE_URL || 'https://tibsfox.com/Research';
    if (!json) {
      console.log('');
      console.log(`=== verification probe (${deleted.length} HEAD requests to ${baseUrl}) ===`);
    }
    const probes = [];
    for (const r of deleted) {
      // For directories, probe the .../ URL (most servers redirect to index.html)
      const url = remotePathToUrl(r.path, baseUrl);
      const result = await probeUrl(url);
      probes.push(result);
      if (!json) {
        const tag = result.ok ? '[STILL SERVING]' : '[gone]';
        console.log(`${tag} ${result.status}  ${url}`);
      }
    }
    const stillServing = probes.filter((p) => p.ok).length;
    verification = { skipped: false, sample_size: probes.length, probes, stillServing };
  }

  if (json) {
    console.log(JSON.stringify({
      mode: dryRun ? 'dry-run' : 'execute',
      recursive,
      requested: rawPaths.length,
      allowed: allowed.length,
      blocked: blocked.length,
      deleted: deleted.length,
      absent: absent.length,
      failures: failures.length,
      blocked_details: blocked,
      results,
      verification,
    }, null, 2));
  } else {
    console.log('');
    console.log('=== summary ===');
    console.log(`  Deleted: ${deleted.length} / ${allowed.length}`);
    console.log(`  Absent:  ${absent.length}`);
    console.log(`  Failed:  ${failures.length}`);
    console.log(`  Blocked: ${blocked.length}`);
    if (!verification.skipped) {
      console.log(`  Still-serving probe failures: ${verification.stillServing} / ${verification.sample_size}`);
    }
    if (failures.length > 0) {
      console.log('  Failures:');
      for (const f of failures) console.log(`    ${f.path}: ${f.error}`);
    }
  }

  if (failures.length > 0) process.exit(1);
  if (blocked.length > 0) process.exit(3);
  if (verification.stillServing > 0) process.exit(4);
  process.exit(0);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('ftp-delete.mjs');
if (invokedDirectly) {
  main().catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
