/**
 * SessionBus -- 4-loop filesystem message bus for brainstorm agent coordination.
 *
 * The SessionBus is the communication substrate that connects all 8 brainstorm
 * agents through 4 dedicated communication loops:
 *
 * - session/ -- Facilitator <-> all technique agents (phase transitions, technique activation/deactivation)
 * - capture/ -- All agents -> Scribe (ideas, questions, clusters, evaluations)
 * - user/    -- CAPCOM <-> human user (problem statement, preferences, feedback)
 * - energy/  -- Energy signals -> Facilitator (fatigue signals, momentum indicators)
 *
 * Message routing is deterministic: each of the 14 MessageType values maps to
 * exactly one loop via routeMessage(). Messages are validated with Zod schemas
 * on both write (before persisting) and read (after parsing JSON).
 *
 * Filenames use brainstormMessageFilename() from ../shared/schemas.js for
 * collision-resistant naming (monotonic counter, not timestamp-only).
 *
 * Only imports: node:fs/promises, node:path, ../shared/types.js, ../shared/schemas.js
 */

import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrainstormMessage, MessageType } from '../shared/types.js';
import { BrainstormMessageSchema } from '../shared/types.js';
import { brainstormMessageFilename } from '../shared/schemas.js';

// ============================================================================
// Types
// ============================================================================

/**
 * The four communication loops in the brainstorm bus.
 */
export type BusLoop = 'session' | 'capture' | 'user' | 'energy';

/**
 * Configuration for the SessionBus.
 *
 * brainstormDir: root directory for brainstorm data (e.g., /tmp/brainstorm-test-xxx)
 * sessionId: UUID identifying the session
 */
export interface SessionBusConfig {
  brainstormDir: string;
  sessionId: string;
}

// ============================================================================
// Routing table
// ============================================================================

/**
 * Deterministic routing table: MessageType -> BusLoop.
 *
 * Every one of the 14 MessageType values maps to exactly one loop.
 * This is a compile-time exhaustive record -- adding a new MessageType
 * without updating this map produces a TypeScript error.
 */
const MESSAGE_ROUTE: Record<MessageType, BusLoop> = {
  // capture loop -- Scribe consumption
  idea: 'capture',
  question: 'capture',
  cluster: 'capture',
  evaluation: 'capture',
  artifact_ready: 'capture',

  // energy loop -- Facilitator energy monitoring
  energy_signal: 'energy',

  // user loop -- CAPCOM <-> human
  user_input: 'user',

  // session loop -- Facilitator <-> all technique agents
  phase_transition: 'session',
  technique_switch: 'session',
  timer_event: 'session',
  hat_color: 'session',
  rule_violation: 'session',
  agent_activated: 'session',
  agent_deactivated: 'session',
};

// ============================================================================
// SessionBus class
// ============================================================================

/**
 * SessionBus -- filesystem message bus wiring all 8 agents through 4 loops.
 *
 * All filesystem operations use the config-provided paths. No process.cwd()
 * calls in any method body.
 */
export class SessionBus {
  private readonly baseDir: string;

  constructor(private readonly config: SessionBusConfig) {
    this.baseDir = join(
      config.brainstormDir,
      'sessions',
      config.sessionId,
      'bus',
    );
  }

  // ==========================================================================
  // Core write method
  // ==========================================================================

  /**
   * Publish a message to a specific loop.
   *
   * 1. Validates the message with BrainstormMessageSchema.parse() (Zod)
   * 2. Generates a collision-resistant filename via brainstormMessageFilename()
   * 3. Writes JSON to {baseDir}/{loop}/{filename}
   * 4. Returns the full file path written
   */
  async publish(loop: BusLoop, message: BrainstormMessage): Promise<string> {
    // Validate on write -- never persist invalid data
    const validated = BrainstormMessageSchema.parse(message);

    const filename = brainstormMessageFilename(validated.from, validated.to);
    const filePath = join(this.baseDir, loop, filename);

    await writeFile(filePath, JSON.stringify(validated), 'utf-8');
    return filePath;
  }

  // ==========================================================================
  // Core read method
  // ==========================================================================

  /**
   * Poll a loop for pending messages.
   *
   * 1. readdir on the loop directory, sort by filename (monotonic counter order)
   * 2. Filter by `since` timestamp if provided (parse timestamp from filename prefix)
   * 3. Read each .msg file, parse JSON, validate with BrainstormMessageSchema
   * 4. Return array of valid messages; silently skip corrupted files
   */
  async poll(loop: BusLoop, since?: number): Promise<BrainstormMessage[]> {
    const loopDir = join(this.baseDir, loop);

    let entries: string[];
    try {
      entries = await readdir(loopDir);
    } catch {
      // Directory doesn't exist or is empty -- no messages
      return [];
    }

    // Sort by filename for monotonic counter ordering
    const msgFiles = entries.filter(f => f.endsWith('.msg')).sort();

    // Filter by since timestamp if provided
    const filtered = since !== undefined
      ? msgFiles.filter(f => {
          const ts = parseInt(f.split('_')[0], 10);
          return !isNaN(ts) && ts >= since;
        })
      : msgFiles;

    const messages: BrainstormMessage[] = [];

    for (const file of filtered) {
      try {
        const content = await readFile(join(loopDir, file), 'utf-8');
        const parsed = BrainstormMessageSchema.parse(JSON.parse(content));
        messages.push(parsed);
      } catch {
        // Corrupted file -- silently skip
        continue;
      }
    }

    return messages;
  }

  // ==========================================================================
  // Drain method (read + delete)
  // ==========================================================================

  /**
   * Drain all messages from a loop: read, then delete.
   *
   * Returns all valid messages from the loop and removes the files.
   * Subsequent poll() on the same loop returns empty until new messages arrive.
   */
  async drain(loop: BusLoop): Promise<BrainstormMessage[]> {
    const loopDir = join(this.baseDir, loop);

    let entries: string[];
    try {
      entries = await readdir(loopDir);
    } catch {
      return [];
    }

    const msgFiles = entries.filter(f => f.endsWith('.msg')).sort();
    const messages: BrainstormMessage[] = [];

    for (const file of msgFiles) {
      const filePath = join(loopDir, file);
      try {
        const content = await readFile(filePath, 'utf-8');
        const parsed = BrainstormMessageSchema.parse(JSON.parse(content));
        messages.push(parsed);
        // Delete after successful read
        await rm(filePath);
      } catch {
        // Corrupted file -- try to clean up, skip
        try { await rm(filePath); } catch { /* ignore */ }
        continue;
      }
    }

    return messages;
  }

  // ==========================================================================
  // Pure routing logic
  // ==========================================================================

  /**
   * Determine which loop a message should be routed to.
   *
   * Pure synchronous function using the MESSAGE_ROUTE lookup table.
   * All 14 MessageType values map to exactly one loop.
   */
  routeMessage(message: BrainstormMessage): BusLoop {
    return MESSAGE_ROUTE[message.type];
  }

  // ==========================================================================
  // Convenience wrapper
  // ==========================================================================

  /**
   * Auto-route and publish a message.
   *
   * Calls routeMessage() to determine the loop, then publish() to write.
   * Returns the full file path written.
   */
  async publishRouted(message: BrainstormMessage): Promise<string> {
    const loop = this.routeMessage(message);
    return this.publish(loop, message);
  }
}
