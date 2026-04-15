#!/usr/bin/env node
'use strict';

/**
 * PostCompact hook — emits recovery context after Claude Code compacts.
 *
 * Reads /tmp/claude-precompact-${sessionId}.json, combines with LIVE git state
 * (branch may have changed since snapshot), and emits via additionalContext.
 *
 * Companion: pre-compact-snapshot.cjs writes the snapshot.
 *
 * Safety: never throws. All errors → exit 0 with empty stdout.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runHook, emit } = require('./lib/hook-output.cjs');

function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000,
    }).trim();
  } catch (_err) {
    return '';
  }
}

function readSnapshot(sessionId) {
  if (!sessionId) return null;
  try {
    const p = `/tmp/claude-precompact-${sessionId}.json`;
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_err) {
    return null;
  }
}

function readStateHead(cwd) {
  try {
    const p = path.join(cwd, '.planning/STATE.md');
    if (!fs.existsSync(p)) return '';
    return fs.readFileSync(p, 'utf8').split('\n').slice(0, 30).join('\n');
  } catch (_err) {
    return '';
  }
}

function readJournalTail(sessionId, n = 10) {
  if (!sessionId) return [];
  try {
    const p = `/tmp/claude-journal-${sessionId}.jsonl`;
    if (!fs.existsSync(p)) return [];
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    return lines.slice(-n).map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return { raw: l };
      }
    });
  } catch (_err) {
    return [];
  }
}

function formatJournalEntry(entry) {
  if (!entry) return '';
  if (entry.raw) return entry.raw;
  const tool = entry.tool || entry.tool_name || '?';
  const file = entry.file || entry.path || entry.target || '';
  return `${tool} ${file}`.trim();
}

function buildRecoveryContext(snapshot, cwd) {
  const parts = [];
  if (snapshot) {
    parts.push(`Compaction #${snapshot.compaction_count || 1} (snapshot at ${snapshot.timestamp || 'unknown'})`);
  } else {
    parts.push('Compaction occurred (no prior snapshot available)');
  }

  const liveGit = {
    branch: safeExec('git rev-parse --abbrev-ref HEAD', cwd),
    status: safeExec('git status --short', cwd),
    log: safeExec('git log --oneline -3', cwd),
  };

  parts.push('');
  parts.push('Live git state:');
  if (liveGit.branch) parts.push(`  branch: ${liveGit.branch}`);
  if (liveGit.status) parts.push(`  status:\n    ${liveGit.status.split('\n').join('\n    ')}`);
  if (liveGit.log) parts.push(`  log:\n    ${liveGit.log.split('\n').join('\n    ')}`);

  if (snapshot && snapshot.git && snapshot.git.branch && snapshot.git.branch !== liveGit.branch) {
    parts.push('');
    parts.push(`NOTE: branch changed since snapshot (${snapshot.git.branch} → ${liveGit.branch})`);
  }

  const stateHead = readStateHead(cwd);
  if (stateHead) {
    parts.push('');
    parts.push('GSD STATE.md (head):');
    parts.push(stateHead);
  }

  const journal = readJournalTail(snapshot ? snapshot.session_id : null, 10);
  if (journal.length > 0) {
    parts.push('');
    parts.push('Recent file operations:');
    for (const e of journal) {
      const line = formatJournalEntry(e);
      if (line) parts.push(`  ${line}`);
    }
  }

  if (snapshot && snapshot.compaction_count >= 3) {
    parts.push('');
    parts.push(`WARNING: ${snapshot.compaction_count} compactions in this session — consider reducing active context growth.`);
  }

  return parts.join('\n');
}

runHook((input) => {
  const sessionId = input.session_id || '';
  const cwd = input.cwd || process.cwd();
  const snapshot = readSnapshot(sessionId);
  const context = buildRecoveryContext(snapshot, cwd);
  const header = 'CONTEXT RECOVERY (post-compaction):\n\n';
  emit('PostCompact', header + context);
});
