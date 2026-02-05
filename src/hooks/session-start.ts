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

async function main(): Promise<void> {
  // Read JSON from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const input = Buffer.concat(chunks).toString('utf-8').trim();

  if (!input) {
    // No input provided - this is fine, hook might be called without data
    process.exit(0);
  }

  let data: SessionStartData;
  try {
    data = JSON.parse(input);
  } catch (err) {
    console.error('Failed to parse session start data:', err);
    process.exit(1);
  }

  // Validate required fields
  if (!data.sessionId || !data.transcriptPath || !data.cwd) {
    console.error('Missing required fields: sessionId, transcriptPath, or cwd');
    process.exit(1);
  }

  // Set defaults for optional fields
  const startData: SessionStartData = {
    sessionId: data.sessionId,
    transcriptPath: data.transcriptPath,
    cwd: data.cwd,
    source: data.source || 'startup',
    model: data.model || 'unknown',
    startTime: data.startTime || Date.now(),
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
