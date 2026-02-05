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

  let data: SessionEndData;
  try {
    data = JSON.parse(input);
  } catch (err) {
    console.error('Failed to parse session end data:', err);
    process.exit(1);
  }

  // Validate required fields
  if (!data.sessionId || !data.transcriptPath || !data.cwd) {
    console.error('Missing required fields: sessionId, transcriptPath, or cwd');
    process.exit(1);
  }

  // Set defaults for optional fields
  const endData: SessionEndData = {
    sessionId: data.sessionId,
    transcriptPath: data.transcriptPath,
    cwd: data.cwd,
    reason: data.reason || 'other',
    activeSkills: data.activeSkills || [],
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
