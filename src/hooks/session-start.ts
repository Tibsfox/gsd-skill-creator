#!/usr/bin/env node
/**
 * Claude Code session start hook.
 *
 * Receives session start data via stdin JSON and caches it
 * for later use when the session ends.
 *
 * Configure in .claude/settings.json:
 * {
 *   "hooks": {
 *     "session_start": "node /path/to/gsd-skill-creator/dist/hooks/session-start.js"
 *   }
 * }
 */

import { SessionObserver, SessionStartData } from '../observation/session-observer.js';

// Claude Code sends snake_case fields, map to our internal interface
interface ClaudeCodeSessionStartInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  source?: 'startup' | 'resume' | 'clear' | 'compact';
  model?: string;
  hook_event_name?: string;
  permission_mode?: string;
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

  let rawData: ClaudeCodeSessionStartInput;
  try {
    rawData = JSON.parse(input);
  } catch (err) {
    console.error('Failed to parse session start data:', err);
    process.exit(1);
  }

  // Validate required fields (using snake_case as sent by Claude Code)
  if (!rawData.session_id || !rawData.transcript_path || !rawData.cwd) {
    console.error('Missing required fields: session_id, transcript_path, or cwd');
    process.exit(1);
  }

  // Map snake_case input to our internal camelCase interface
  const startData: SessionStartData = {
    sessionId: rawData.session_id,
    transcriptPath: rawData.transcript_path,
    cwd: rawData.cwd,
    source: rawData.source || 'startup',
    model: rawData.model || 'unknown',
    startTime: Date.now(),
  };

  try {
    const observer = new SessionObserver();
    await observer.onSessionStart(startData);
  } catch (err) {
    console.error('Failed to process session start:', err);
    process.exit(1);
  }
}

main();
