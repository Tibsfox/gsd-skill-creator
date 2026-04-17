#!/usr/bin/env node
// gsd-hook-version: 1.0.0
// PostToolUse flight recorder for session-retro.
//
// Appends a compact record of every tool call to
// .planning/sessions/current.tool-trace.jsonl so the offline analyzer
// (tools/session-retro/analyze-trace.mjs) can detect patterns like
// write-without-read, long-bash, and Read→Edit cycles at session close.
//
// Deliberately minimal: this runs on every tool call, so it must be
// cheap. No subprocess spawns, no DB calls, no network.
//
// Skips recording when no observation session is active
// (current.meta.json missing) — avoids littering state for one-shot
// interactive sessions that never called observe.mjs start.

const fs = require('node:fs');
const path = require('node:path');

function main() {
  // Input comes on stdin as JSON from Claude Code.
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch { return; }
  if (!raw.trim()) return;

  let payload;
  try { payload = JSON.parse(raw); } catch { return; }

  const repoRoot = process.cwd();
  const sessionsDir = path.join(repoRoot, '.planning', 'sessions');
  const metaFile = path.join(sessionsDir, 'current.meta.json');
  if (!fs.existsSync(metaFile)) return; // no active observation session

  const traceFile = path.join(sessionsDir, 'current.tool-trace.jsonl');

  // Keep only the fields that matter for pattern detection. Resist the
  // urge to log full file contents or full command strings — they
  // accumulate fast and the analyzer doesn't need them.
  const toolName = payload.tool_name || payload.toolName || null;
  const input = payload.tool_input || payload.toolInput || {};
  const response = payload.tool_response || payload.toolResponse || {};

  const entry = {
    t: new Date().toISOString(),
    tool: toolName,
  };

  // Tool-specific summaries.
  if (toolName === 'Read' || toolName === 'Edit' || toolName === 'Write' || toolName === 'NotebookEdit') {
    entry.file = input.file_path || input.notebook_path || null;
  }
  if (toolName === 'Bash') {
    const cmd = (input.command || '').slice(0, 200);
    entry.cmd = cmd;
    // Duration — Claude Code includes timing metadata when available
    if (response.duration_ms) entry.duration_ms = response.duration_ms;
  }
  if (toolName === 'Grep' || toolName === 'Glob') {
    entry.pattern = input.pattern || null;
  }
  if (toolName === 'Task' || toolName === 'Agent') {
    entry.agent = input.subagent_type || input.description || null;
  }

  try {
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.appendFileSync(traceFile, JSON.stringify(entry) + '\n');
  } catch {}
}

main();
