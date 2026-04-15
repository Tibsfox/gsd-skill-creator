'use strict';

/**
 * Shared helper for Claude Code hook handlers.
 *
 * Guarantees:
 *   - Never crashes the session: emits empty stdout on any unexpected error.
 *   - Uniform JSON envelope: { hookSpecificOutput: { hookEventName, additionalContext } }
 *   - Reads hook stdin JSON safely (tolerates empty, malformed, or missing stdin).
 *
 * Consumers: pre-compact-snapshot, post-compact-recovery, external-change-tracker,
 * permission-recovery, notification-logger, worktree-init.
 */

const fs = require('fs');

function readStdinSync() {
  try {
    const buf = fs.readFileSync(0, 'utf8');
    if (!buf || !buf.trim()) return {};
    return JSON.parse(buf);
  } catch (_err) {
    return {};
  }
}

function emit(eventName, additionalContext) {
  try {
    if (additionalContext == null || additionalContext === '') return;
    const payload = {
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: String(additionalContext),
      },
    };
    process.stdout.write(JSON.stringify(payload));
  } catch (_err) {
    // Never crash.
  }
}

function emitStructured(eventName, extras) {
  try {
    const payload = {
      hookSpecificOutput: {
        hookEventName: eventName,
        ...extras,
      },
    };
    process.stdout.write(JSON.stringify(payload));
  } catch (_err) {
    // Never crash.
  }
}

function runHook(handler) {
  try {
    const input = readStdinSync();
    const result = handler(input);
    if (result && typeof result.then === 'function') {
      result.catch(() => {});
    }
  } catch (_err) {
    // Silent: hook never crashes the session.
  }
}

module.exports = {
  readStdinSync,
  emit,
  emitStructured,
  runHook,
};
