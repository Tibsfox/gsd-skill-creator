#!/usr/bin/env node
/**
 * Claude Code session end hook.
 *
 * Receives session end data via stdin JSON and processes
 * the transcript to extract patterns and suggestions.
 *
 * Configure in .claude/settings.json:
 * {
 *   "hooks": {
 *     "session_end": "node /path/to/gsd-skill-creator/dist/hooks/session-end.js"
 *   }
 * }
 */

import { SessionObserver, SessionEndData } from '../observation/session-observer.js';

// Claude Code sends snake_case fields, map to our internal interface
interface ClaudeCodeSessionEndInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  reason?: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
  permission_mode?: string;
  hook_event_name?: string;
}

function readStdin(timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      process.stdin.removeAllListeners();
      process.stdin.pause();
      resolve(Buffer.concat(chunks).toString('utf-8').trim());
    }, timeoutMs);

    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString('utf-8').trim());
    });
    process.stdin.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    process.stdin.resume();
  });
}

async function main(): Promise<void> {
  // Read JSON from stdin with timeout to prevent hanging
  const input = await readStdin(3000);

  if (!input) {
    // No input provided - this is fine, hook might be called without data
    process.exit(0);
  }

  let rawData: ClaudeCodeSessionEndInput;
  try {
    rawData = JSON.parse(input);
  } catch (err) {
    console.error('Failed to parse session end data:', err);
    process.exit(1);
  }

  // Validate required fields (using snake_case as sent by Claude Code)
  if (!rawData.session_id || !rawData.transcript_path || !rawData.cwd) {
    console.error('Missing required fields: session_id, transcript_path, or cwd');
    process.exit(1);
  }

  // Map snake_case input to our internal camelCase interface
  const endData: SessionEndData = {
    sessionId: rawData.session_id,
    transcriptPath: rawData.transcript_path,
    cwd: rawData.cwd,
    reason: rawData.reason || 'other',
    activeSkills: [],  // Not provided by Claude Code
  };

  try {
    const observer = new SessionObserver();
    const result = await observer.onSessionEnd(endData);

    if (result) {
      // Output summary to stdout for debugging/logging
      console.log(JSON.stringify({
        status: 'success',
        sessionId: endData.sessionId,
        durationMinutes: result.durationMinutes,
        toolCalls: result.metrics.toolCalls,
        filesAccessed: result.topFiles.length,
      }));
    } else {
      console.log(JSON.stringify({
        status: 'skipped',
        sessionId: endData.sessionId,
        reason: 'empty session',
      }));
    }
  } catch (err) {
    console.error('Failed to process session end:', err);
    process.exit(1);
  }
}

main();
