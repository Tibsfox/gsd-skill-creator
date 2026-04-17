#!/usr/bin/env node
// Offline analyzer for the PostToolUse tool trace.
//
// Reads .planning/sessions/current.tool-trace.jsonl and detects patterns
// worth surfacing in the session retrospective. Writes detected events
// into current.jsonl so they flow through generate.mjs normally.
//
// Patterns detected:
//   friction:write-without-read — Edit/Write on a file that wasn't
//     Read earlier in this session
//   friction:long-bash          — Bash calls with duration_ms >= threshold
//   friction:read-edit-cascade  — ≥3 Read→Edit cycles on the same file
//   win:parallel-tools          — ≥3 tool calls within a 500 ms window
//     (proxy for `make independent calls in parallel`)
//
// Usage:
//   node tools/session-retro/analyze-trace.mjs             # analyze + emit
//   node tools/session-retro/analyze-trace.mjs --dry-run   # preview only

import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const SESSIONS_DIR = join(REPO_ROOT, '.planning', 'sessions');
const TRACE_FILE = join(SESSIONS_DIR, 'current.tool-trace.jsonl');
const CURRENT_FILE = join(SESSIONS_DIR, 'current.jsonl');

const LONG_BASH_MS = 60000;           // 60 s
const PARALLEL_WINDOW_MS = 500;
const READ_EDIT_CASCADE_MIN = 3;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function loadTrace() {
  if (!existsSync(TRACE_FILE)) return [];
  return readFileSync(TRACE_FILE, 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

function detectPatterns(entries) {
  const events = [];
  const readFiles = new Set();
  const readEditCount = new Map();

  // First pass: index Read targets + count Read→Edit per file
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.tool === 'Read' && e.file) readFiles.add(e.file);
    if ((e.tool === 'Edit' || e.tool === 'Write') && e.file) {
      // Check if Read preceded
      const prevReads = entries.slice(0, i).filter(p => p.tool === 'Read' && p.file === e.file).length;
      if (prevReads > 0) {
        readEditCount.set(e.file, (readEditCount.get(e.file) || 0) + 1);
      }
    }
  }

  // Pattern: write-without-read
  for (const e of entries) {
    if ((e.tool === 'Edit' || e.tool === 'Write') && e.file && !readFiles.has(e.file)) {
      events.push({
        t: e.t,
        kind: 'friction',
        label: `${e.tool} without prior Read`,
        payload: { file: e.file, tool: e.tool },
      });
    }
  }

  // Pattern: long-bash
  for (const e of entries) {
    if (e.tool === 'Bash' && e.duration_ms && e.duration_ms >= LONG_BASH_MS) {
      events.push({
        t: e.t,
        kind: 'friction',
        label: `Bash ran ${Math.round(e.duration_ms / 1000)}s`,
        payload: { cmd: e.cmd?.slice(0, 80), duration_ms: e.duration_ms },
      });
    }
  }

  // Pattern: read-edit-cascade (3+ Read→Edit cycles on same file)
  for (const [file, count] of readEditCount) {
    if (count >= READ_EDIT_CASCADE_MIN) {
      events.push({
        t: entries[entries.length - 1]?.t || new Date().toISOString(),
        kind: 'friction',
        label: `Read→Edit cascade ×${count} on same file`,
        payload: { file, count },
      });
    }
  }

  // Pattern: parallel-tools burst (≥3 tool calls within 500 ms)
  let bursts = 0;
  for (let i = 0; i + 2 < entries.length; i++) {
    const t0 = Date.parse(entries[i].t);
    const t2 = Date.parse(entries[i + 2].t);
    if (t2 - t0 <= PARALLEL_WINDOW_MS) {
      bursts++;
      i += 2; // skip ahead so we don't double-count
    }
  }
  if (bursts >= 1) {
    events.push({
      t: new Date().toISOString(),
      kind: 'win',
      label: `${bursts} parallel tool burst${bursts > 1 ? 's' : ''} detected`,
      payload: { burst_count: bursts, window_ms: PARALLEL_WINDOW_MS },
    });
  }

  return events;
}

function main() {
  const entries = loadTrace();
  if (entries.length === 0) {
    console.error('[analyze-trace] no trace entries');
    console.log(JSON.stringify({ entries: 0, emitted: 0 }));
    return;
  }

  const events = detectPatterns(entries);

  if (dryRun) {
    console.error(`[analyze-trace] dry-run: ${events.length} events from ${entries.length} trace entries`);
    for (const e of events) {
      console.error(`  ${e.kind}: ${e.label}`);
    }
    console.log(JSON.stringify({ entries: entries.length, detected: events.length, events }, null, 2));
    return;
  }

  for (const e of events) {
    appendFileSync(CURRENT_FILE, JSON.stringify(e) + '\n');
  }

  console.error(`[analyze-trace] emitted ${events.length} events from ${entries.length} trace entries`);
  console.log(JSON.stringify({ entries: entries.length, emitted: events.length }, null, 2));
}

main();
