#!/usr/bin/env node
'use strict';

/**
 * WorktreeCreate hook — registers new worktree for lifecycle tracking.
 *
 * Event name inferred from OOPS doc 04; if the platform uses a different
 * name the handler still runs harmlessly (it only writes when given valid
 * session_id + path).
 */

const fs = require('fs');
const { runHook } = require('./lib/hook-output.cjs');

runHook((input) => {
  const sessionId = input.session_id || '';
  const worktreePath = input.worktree_path || input.cwd || '';
  if (!sessionId || !worktreePath) return;

  const registryPath = `/tmp/claude-worktrees-${sessionId}.json`;
  let registry = [];
  try {
    if (fs.existsSync(registryPath)) {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      if (!Array.isArray(registry)) registry = [];
    }
  } catch (_err) {
    registry = [];
  }

  registry.push({
    path: worktreePath,
    created: Date.now(),
    session_id: sessionId,
    status: 'active',
  });

  try {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  } catch (_err) {
    // swallow
  }
});
