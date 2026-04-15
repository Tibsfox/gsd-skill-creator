#!/usr/bin/env node
'use strict';

/**
 * PermissionDenied hook — retry-loop guard.
 *
 * Tracks denial count per (tool, command-prefix) key. First denial is
 * silent. Second denial emits a retry-loop warning with tool-specific
 * guidance.
 *
 * State: /tmp/claude-denied-${sessionId}.json
 */

const fs = require('fs');
const { runHook, emit } = require('./lib/hook-output.cjs');

const TOOL_GUIDANCE = {
  Bash: 'Shell command denied. Try: (1) use Read/Write/Grep instead, (2) check if the command needs sudo, (3) verify the path is within the sandbox.',
  Write: 'File write denied. Check: (1) path within project directory? (2) restricted location (.env, credentials)? (3) sandbox allows this path?',
  Edit: 'File edit denied. Same checks as Write — path restrictions and sandbox rules.',
  Agent: 'Agent spawn denied. Check: (1) agent spawning allowed in current mode? (2) agent limit reached? (3) agent name matches allowed pattern?',
};

function buildKey(toolName, toolInput) {
  const parts = [toolName || '?'];
  if (toolInput && typeof toolInput === 'object') {
    if (typeof toolInput.command === 'string') parts.push(toolInput.command);
    else if (typeof toolInput.file_path === 'string') parts.push(toolInput.file_path);
    else if (typeof toolInput.path === 'string') parts.push(toolInput.path);
  }
  return parts.join('::').slice(0, 80);
}

function readRegistry(sessionId) {
  if (!sessionId) return {};
  try {
    const p = `/tmp/claude-denied-${sessionId}.json`;
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_err) {
    return {};
  }
}

function writeRegistry(sessionId, data) {
  if (!sessionId) return;
  try {
    fs.writeFileSync(
      `/tmp/claude-denied-${sessionId}.json`,
      JSON.stringify(data, null, 2)
    );
  } catch (_err) {
    // swallow
  }
}

runHook((input) => {
  const sessionId = input.session_id || '';
  const toolName = input.tool_name || (input.tool && input.tool.name) || '';
  const toolInput = input.tool_input || {};
  const key = buildKey(toolName, toolInput);

  const registry = readRegistry(sessionId);
  const prior = registry[key] || 0;
  const count = prior + 1;
  registry[key] = count;
  writeRegistry(sessionId, registry);

  if (count < 2) return;

  const guidance = TOOL_GUIDANCE[toolName] || '';
  const msg = `RETRY LOOP DETECTED: "${key}" has been denied ${count} times. Do NOT retry. Find an alternative approach or ask the user for permission.${
    guidance ? '\n\n' + guidance : ''
  }`;
  emit('PermissionDenied', msg);
});
