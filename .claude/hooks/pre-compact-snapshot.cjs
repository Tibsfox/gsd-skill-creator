#!/usr/bin/env node
'use strict';

/**
 * PreCompact hook — captures working state before Claude Code compacts context.
 *
 * Writes /tmp/claude-precompact-${sessionId}.json with:
 *   - session_id, cwd, timestamp
 *   - compaction_count (incremented from prior snapshot if any)
 *   - git: branch, status, log
 *   - gsd_state: head of .planning/STATE.md
 *   - recent_files: tail of /tmp/claude-journal-${sessionId}.jsonl
 *
 * Companion: post-compact-recovery.cjs reads this file after compaction.
 *
 * Safety: never throws. All errors → exit 0 with empty stdout.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runHook } = require('./lib/hook-output.cjs');

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

function captureGit(cwd) {
  return {
    branch: safeExec('git rev-parse --abbrev-ref HEAD', cwd),
    status: safeExec('git status --short', cwd),
    log: safeExec('git log --oneline -3', cwd),
  };
}

function readStateHead(cwd) {
  try {
    const p = path.join(cwd, '.planning/STATE.md');
    if (!fs.existsSync(p)) return '';
    const lines = fs.readFileSync(p, 'utf8').split('\n').slice(0, 30);
    return lines.join('\n');
  } catch (_err) {
    return '';
  }
}

function readJournalTail(sessionId, n = 20) {
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

function readPriorSnapshot(sessionId) {
  if (!sessionId) return null;
  try {
    const p = `/tmp/claude-precompact-${sessionId}.json`;
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_err) {
    return null;
  }
}

runHook((input) => {
  const sessionId = input.session_id || '';
  const cwd = input.cwd || process.cwd();
  const prior = readPriorSnapshot(sessionId);
  const compactionCount = (prior && typeof prior.compaction_count === 'number')
    ? prior.compaction_count + 1
    : 1;

  const snapshot = {
    session_id: sessionId,
    cwd,
    timestamp: new Date().toISOString(),
    compaction_count: compactionCount,
    git: captureGit(cwd),
    gsd_state: readStateHead(cwd),
    recent_files: readJournalTail(sessionId, 20),
  };

  if (sessionId) {
    try {
      fs.writeFileSync(
        `/tmp/claude-precompact-${sessionId}.json`,
        JSON.stringify(snapshot, null, 2)
      );
    } catch (_err) {
      // swallow
    }
  }
});
