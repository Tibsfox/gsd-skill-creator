#!/usr/bin/env node
// session-retro observe — append-only event logger for meta-tracking.
//
// Usage:
//   # Start a session (clears any prior current.jsonl — keep it explicit)
//   node tools/session-retro/observe.mjs start "release-history-feature"
//
//   # Record events during the session
//   node tools/session-retro/observe.mjs event friction "read-before-edit" '{"file":"audit.mjs","count":1}'
//   node tools/session-retro/observe.mjs event win "publisher-dry-run-clean" '{"blocked":0}'
//   node tools/session-retro/observe.mjs event correction "user reminded: no Co-Authored-By" '{"impact":"workflow"}'
//   node tools/session-retro/observe.mjs event tool-use "better-sqlite3 installed" '{"reason":"SQLite driver"}'
//
//   # End + archive to a session-specific file
//   node tools/session-retro/observe.mjs end
//
// Events land at .planning/sessions/current.jsonl (JSONL, one event per line).
// `end` rotates to .planning/sessions/<started_at>-<mission>.jsonl.
//
// Event kinds (free-form, but prefer these for aggregation):
//   friction   — something took more effort than it should have
//   win        — something worked notably well
//   correction — user (or hook) corrected direction
//   tool-use   — notable tool invocation (dep install, external cli, etc)
//   decision   — judgment call that deserves retroactive review
//   gap        — missing skill/agent/chipset that would have helped
//   checkpoint — progress marker for long-running work

import { readFileSync, writeFileSync, appendFileSync, existsSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const SESSIONS_DIR = join(REPO_ROOT, '.planning', 'sessions');
const CURRENT_FILE = join(SESSIONS_DIR, 'current.jsonl');
const META_FILE = join(SESSIONS_DIR, 'current.meta.json');

function ensureDir() { mkdirSync(SESSIONS_DIR, { recursive: true }); }

function cmdStart(mission) {
  ensureDir();
  if (existsSync(CURRENT_FILE)) {
    console.error(`[observe] warning: current.jsonl already exists; archiving to previous.jsonl`);
    renameSync(CURRENT_FILE, join(SESSIONS_DIR, 'previous.jsonl'));
  }
  const meta = {
    mission: mission || 'unnamed',
    started_at: new Date().toISOString(),
    started_commit: tryGetCommit(),
  };
  writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
  writeFileSync(CURRENT_FILE, '');
  console.log(JSON.stringify({ action: 'start', ...meta }));
}

function cmdEvent(kind, label, payloadJson) {
  ensureDir();
  let payload = null;
  if (payloadJson) {
    try { payload = JSON.parse(payloadJson); }
    catch { payload = { raw: payloadJson }; }
  }
  const event = {
    t: new Date().toISOString(),
    kind: kind || 'event',
    label: label || '',
    ...(payload ? { payload } : {}),
  };
  appendFileSync(CURRENT_FILE, JSON.stringify(event) + '\n');
  console.log(JSON.stringify({ action: 'event', ...event }));
}

function cmdEnd() {
  if (!existsSync(CURRENT_FILE) || !existsSync(META_FILE)) {
    console.error('[observe] no session in progress');
    process.exit(1);
  }
  const meta = JSON.parse(readFileSync(META_FILE, 'utf8'));
  const endedAt = new Date().toISOString();
  const startedStamp = meta.started_at.slice(0, 19).replace(/[:T]/g, '-');
  const missionSlug = (meta.mission || 'unnamed').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 60);
  const archiveName = `${startedStamp}-${missionSlug}.jsonl`;
  const archivePath = join(SESSIONS_DIR, archiveName);

  const finalMeta = { ...meta, ended_at: endedAt, ended_commit: tryGetCommit(), archive: archiveName };
  writeFileSync(archivePath.replace(/\.jsonl$/, '.meta.json'), JSON.stringify(finalMeta, null, 2));
  renameSync(CURRENT_FILE, archivePath);
  try { renameSync(META_FILE, archivePath.replace(/\.jsonl$/, '.meta.json.bak')); } catch {}
  console.log(JSON.stringify({ action: 'end', ...finalMeta }));
}

function cmdStatus() {
  if (!existsSync(CURRENT_FILE)) {
    console.log(JSON.stringify({ active: false }));
    return;
  }
  const lines = readFileSync(CURRENT_FILE, 'utf8').split('\n').filter(Boolean);
  const meta = existsSync(META_FILE) ? JSON.parse(readFileSync(META_FILE, 'utf8')) : {};
  const byKind = {};
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      byKind[e.kind] = (byKind[e.kind] || 0) + 1;
    } catch {}
  }
  console.log(JSON.stringify({
    active: true,
    mission: meta.mission,
    started_at: meta.started_at,
    events: lines.length,
    by_kind: byKind,
  }, null, 2));
}

function tryGetCommit() {
  try {
    const { execSync } = require('node:child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

// --- dispatch ---

const [cmd, ...args] = process.argv.slice(2);
try {
  switch (cmd) {
    case 'start':  cmdStart(args.join(' ')); break;
    case 'event':  cmdEvent(args[0], args[1], args[2]); break;
    case 'end':    cmdEnd(); break;
    case 'status': cmdStatus(); break;
    default:
      console.error('Usage: observe.mjs <start|event|end|status> [args...]');
      console.error('  start <mission>');
      console.error('  event <kind> <label> [json-payload]');
      console.error('  end');
      console.error('  status');
      process.exit(1);
  }
} catch (e) {
  console.error('[observe] fatal:', e.message);
  process.exit(2);
}
