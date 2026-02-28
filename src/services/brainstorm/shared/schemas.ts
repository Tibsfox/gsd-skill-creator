/**
 * Brainstorm filesystem bus schemas module.
 *
 * Runtime behavior layer for the brainstorm session system:
 * - Collision-resistant message filename generation (monotonic counter)
 * - JSONL parse helpers with Zod schema validation
 * - Session directory initialization (4 bus channels)
 *
 * Only imports from ./types.ts and node builtins. No imports from
 * den/, vtm/, knowledge/, or any other project module.
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentRole, SessionConfig, Idea, Question } from './types.js';
import { IdeaSchema, QuestionSchema } from './types.js';

// ============================================================================
// Monotonic counter for collision-resistant filenames
// ============================================================================

/**
 * Module-level monotonic counter.
 *
 * Critical: Do NOT use timestamp-only filenames. The Den bus confirmed
 * millisecond-collision problems under concurrent write load. This counter
 * guarantees uniqueness even when multiple calls happen in the same ms.
 */
let _brainstormCounter = 0;

/**
 * Generate a collision-resistant filename for a brainstorm bus message.
 *
 * Format: {timestamp_ms}_{padded_counter}_{src}_{dst}.msg
 *
 * The monotonic counter prevents millisecond timestamp ties under
 * 8-agent concurrent write load (12 writes in 200ms during Brainwriting 6-3-5).
 * Do NOT use timestamp-only filenames -- confirmed collision-prone in Den bus.
 */
export function brainstormMessageFilename(
  src: AgentRole | 'system',
  dst: AgentRole | 'broadcast',
): string {
  const ts = Date.now();
  const counter = String(++_brainstormCounter).padStart(6, '0');
  return `${ts}_${counter}_${src}_${dst}.msg`;
}

/**
 * Reset the monotonic counter. For use in test beforeEach() only.
 * Do NOT call in production code.
 */
export function resetBrainstormCounter(): void {
  _brainstormCounter = 0;
}

// ============================================================================
// JSONL parse helpers
// ============================================================================

/**
 * Parse and validate an ideas.jsonl file content.
 * Skips blank lines. Throws on invalid JSON but silently
 * skips lines that fail Zod validation (logs warning).
 */
export function parseIdeasJsonl(content: string): Idea[] {
  return content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .flatMap(line => {
      const parsed = IdeaSchema.safeParse(JSON.parse(line));
      if (!parsed.success) {
        // Invalid line -- schema violation; skip without crashing
        return [];
      }
      return [parsed.data];
    });
}

/**
 * Parse and validate a questions.jsonl file content.
 * Skips blank lines. Throws on invalid JSON but silently
 * skips lines that fail Zod validation.
 */
export function parseQuestionsJsonl(content: string): Question[] {
  return content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .flatMap(line => {
      const parsed = QuestionSchema.safeParse(JSON.parse(line));
      if (!parsed.success) {
        return [];
      }
      return [parsed.data];
    });
}

// ============================================================================
// Session directory initialization
// ============================================================================

/**
 * Initialize the filesystem directory structure for a brainstorm session.
 *
 * Creates:
 *   {brainstormDir}/sessions/{sessionId}/bus/session/
 *   {brainstormDir}/sessions/{sessionId}/bus/capture/
 *   {brainstormDir}/sessions/{sessionId}/bus/user/
 *   {brainstormDir}/sessions/{sessionId}/bus/energy/
 *
 * Note: .brainstorm/ is excluded from the dashboard file watcher
 * (DashboardService watches planningDir which defaults to .planning/,
 * a separate directory). Add .brainstorm/ to .gitignore to prevent
 * session data from being committed.
 *
 * All paths resolved from SessionConfig.brainstormDir -- no global
 * path constants, no process.cwd() in function body.
 */
export async function initBrainstormSession(config: SessionConfig): Promise<void> {
  const sessionDir = join(config.brainstormDir, 'sessions', config.sessionId);
  const dirs = [
    join(sessionDir, 'bus', 'session'),
    join(sessionDir, 'bus', 'capture'),
    join(sessionDir, 'bus', 'user'),
    join(sessionDir, 'bus', 'energy'),
  ];
  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}
