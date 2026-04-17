#!/usr/bin/env node
// Publisher — Wave 4a / Component 06.
//
// Copies allowlisted chapter files from .planning/roadmap/ to:
//   1. docs/release-notes/<version>/chapter/<file>  (GitHub-tracked mirror)
//   2. www/tibsfox/com/Research/release-story/<version>/<file>  (tibsfox.com staging)
//
// SAFETY:
//   * Default is --dry-run; real writes require --execute.
//   * Hard leak-scan gate: any forbidden pattern blocks that file (not the whole run).
//   * Allowlist is basename-strict. Anything not on it is skipped with a log line.
//   * tibsfox.com FTP upload is NOT triggered — user runs sync-research-to-live.sh.
//   * Never overwrites existing README.md in docs/release-notes/<v>/. Chapter files
//     live in a new chapter/ subdirectory.
//
// Idempotency: source_checksum stored in release_history.publish_target. Unchanged
// source = no-op.
//
// Usage:
//   node tools/release-history/publish.mjs                    # dry-run (default)
//   node tools/release-history/publish.mjs --execute          # write
//   node tools/release-history/publish.mjs --target github    # only GitHub
//   node tools/release-history/publish.mjs --target tibsfox   # only tibsfox.com staging
//   node tools/release-history/publish.mjs --version v1.49.39 # one release
//   node tools/release-history/publish.mjs --since v1.49.500  # recent only

import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const ctx_cfg = loadConfig();
const ROADMAP_DIR = ctx_cfg.roadmap_dir_abs;
const REPORT_FILE = join(ctx_cfg.cache_dir_abs, '_publish-report.json');
mkdirSync(ctx_cfg.cache_dir_abs, { recursive: true });

const VERSION_RE = ctx_cfg.version_regex_compiled;
const ALLOWLIST = new Set(ctx_cfg.publish.allowlist);
const ALLOWLIST_PREFIXES = new RegExp(ctx_cfg.publish.allowlist_prefix_regex);
const TOPLEVEL_ALLOWLIST = new Set(ctx_cfg.publish.toplevel_allowlist);
// Patterns are matched case-sensitively. Authors opt into case-insensitive
// per pattern with the inline `(?i:...)` flag if they need it.
const FORBIDDEN = (ctx_cfg.leak_scan_patterns || []).map(p => new RegExp(p));

// Resolve target destinations with {version}/{file} substitution
function renderDest(template, { version, file }) {
  return template
    .replace(/\{version\}/g, version || '')
    .replace(/\{file\}/g, file || '')
    .replace(/\{file_lowercased\}/g, (file || '').toLowerCase());
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function isAllowlisted(basename) {
  if (ALLOWLIST.has(basename)) return true;
  if (ALLOWLIST_PREFIXES.test(basename) && basename.endsWith('.md')) return true;
  return false;
}

function leakScan(content, path) {
  const violations = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const re of FORBIDDEN) {
      if (re.test(lines[i])) {
        violations.push({ line: i + 1, pattern: re.source, sample: lines[i].slice(0, 120) });
      }
    }
  }
  return violations;
}

async function ensurePublishTargetTable(client) {
  // Sanity — table must exist (created by 001-init.sql)
  const { rows } = await client.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'release_history' AND table_name = 'publish_target'
  `);
  if (rows.length === 0) {
    throw new Error('release_history.publish_target missing — run migrations first');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const onlyTarget = (() => {
    const i = args.indexOf('--target');
    return i >= 0 ? args[i + 1] : null;
  })();
  const onlyVersion = (() => {
    const i = args.indexOf('--version');
    return i >= 0 ? args[i + 1] : null;
  })();
  const sinceVersion = (() => {
    const i = args.indexOf('--since');
    return i >= 0 ? args[i + 1] : null;
  })();

  const client = await openDb(ctx_cfg);
  await ensurePublishTargetTable(client);

  // Enumerate chapter directories
  let chapterDirs = readdirSync(ROADMAP_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && VERSION_RE.test(e.name))
    .map(e => e.name)
    .sort((a, b) => {
      const pa = a.match(VERSION_RE), pb = b.match(VERSION_RE);
      if (+pa[1] !== +pb[1]) return +pa[1] - +pb[1];
      if (+pa[2] !== +pb[2]) return +pa[2] - +pb[2];
      return (+pa[3] || 0) - (+pb[3] || 0);
    });

  if (onlyVersion) chapterDirs = chapterDirs.filter(v => v === onlyVersion);
  if (sinceVersion) {
    const idx = chapterDirs.indexOf(sinceVersion);
    if (idx >= 0) chapterDirs = chapterDirs.slice(idx);
  }

  // Load targets from config; --target filters to one
  const allTargets = ctx_cfg.publish.targets || [];
  const targets = onlyTarget
    ? allTargets.filter(t => t.name === onlyTarget)
    : allTargets;
  const toplevelTargets = ctx_cfg.publish.toplevel_targets || allTargets.map(t => ({
    ...t,
    dest: t.dest.replace('/{version}/chapter/{file}', '/{file}').replace('/{version}/{file}', '/{file}'),
  }));
  const stats = {
    mode: execute ? 'execute' : 'dry-run',
    targets,
    chapters_considered: chapterDirs.length,
    files_considered: 0,
    files_published: 0,
    files_unchanged: 0,
    files_blocked: 0,
    files_skipped: 0,
    violations: [],
  };

  for (const version of chapterDirs) {
    const chapterDir = join(ROADMAP_DIR, version);
    const files = readdirSync(chapterDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      stats.files_considered++;

      if (!isAllowlisted(file)) {
        stats.files_skipped++;
        continue;
      }

      const srcPath = join(chapterDir, file);
      const content = readFileSync(srcPath, 'utf8');
      const checksum = sha256(content);

      // Leak scan (hard gate)
      const violations = leakScan(content);
      if (violations.length > 0) {
        stats.files_blocked++;
        stats.violations.push({
          version, file, count: violations.length,
          sample: violations.slice(0, 2),
        });
        continue;
      }

      for (const target of targets) {
        const targetPath = resolve(REPO_ROOT, renderDest(target.dest, { version, file }));
        const targetKey = target.name === 'tibsfox_com' ? 'tibsfox_com' : (target.name === 'github' ? 'github' : 'mirror');

        // Check publish_target for last checksum
        const { rows } = await client.query(
          `SELECT source_checksum FROM release_history.publish_target
           WHERE version = $1 AND chapter_file = $2 AND target = $3`,
          [version, file, targetKey]
        );
        const lastChecksum = rows[0]?.source_checksum;

        if (lastChecksum === checksum && existsSync(targetPath)) {
          stats.files_unchanged++;
          continue;
        }

        if (execute) {
          mkdirSync(dirname(targetPath), { recursive: true });
          writeFileSync(targetPath, content);
          await client.query(
            `INSERT INTO release_history.publish_target
               (version, chapter_file, target, target_path, source_checksum, last_synced_at)
             VALUES ($1, $2, $3, $4, $5, now())
             ON CONFLICT (version, chapter_file, target) DO UPDATE SET
               target_path = EXCLUDED.target_path,
               source_checksum = EXCLUDED.source_checksum,
               last_synced_at = now()`,
            [version, file, targetKey, targetPath, checksum]
          );
        }
        stats.files_published++;
      }
    }
  }

  // Top-level files
  for (const file of TOPLEVEL_ALLOWLIST) {
    const srcPath = join(ROADMAP_DIR, file);
    if (!existsSync(srcPath)) continue;
    stats.files_considered++;
    const content = readFileSync(srcPath, 'utf8');
    const violations = leakScan(content);
    if (violations.length > 0) {
      stats.files_blocked++;
      stats.violations.push({ version: '_top_', file, count: violations.length, sample: violations.slice(0, 2) });
      continue;
    }
    for (const target of toplevelTargets) {
      const targetPath = resolve(REPO_ROOT, renderDest(target.dest, { version: '', file }));
      if (execute) {
        mkdirSync(dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, content);
      }
      stats.files_published++;
    }
  }

  await client.close();
  writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));

  console.error(`[publish] ${stats.mode} — ${stats.files_published} published, ${stats.files_unchanged} unchanged, ${stats.files_blocked} BLOCKED, ${stats.files_skipped} skipped`);
  console.log(JSON.stringify({
    mode: stats.mode,
    considered: stats.files_considered,
    published: stats.files_published,
    unchanged: stats.files_unchanged,
    blocked: stats.files_blocked,
    skipped: stats.files_skipped,
    violation_count: stats.violations.length,
  }, null, 2));

  // Exit non-zero if anything was blocked
  process.exit(stats.files_blocked > 0 ? 1 : 0);
}

main().catch(e => { console.error('[publish] fatal:', e.message); console.error(e.stack); process.exit(2); });
