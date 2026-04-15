#!/usr/bin/env node
'use strict';

/**
 * Notification hook — discovery logger (Pass 1).
 *
 * Appends one JSONL line per notification to /tmp/claude-notifications-${sid}.jsonl.
 * No analysis, no output, no handler logic — purely for future-mission discovery
 * of what notification types actually arrive in real sessions.
 *
 * Pass 2 (targeted handlers per observed type) is deferred.
 */

const fs = require('fs');
const { runHook } = require('./lib/hook-output.cjs');

runHook((input) => {
  const sessionId = input.session_id || 'unknown';
  const entry = {
    ts: Date.now(),
    type: input.notification_type || input.type || 'unknown',
    data: input,
  };
  try {
    fs.appendFileSync(
      `/tmp/claude-notifications-${sessionId}.jsonl`,
      JSON.stringify(entry) + '\n'
    );
  } catch (_err) {
    // swallow — never crash
  }
});
