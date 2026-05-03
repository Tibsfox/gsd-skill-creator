/**
 * Test harness: gsd-skill-creator simulator.
 *
 * Watches staging/inbox + console/inbox/pending; simulates expansion + status
 * events. Used by I-tests that need a "downstream skill" without invoking the
 * real skill-creator.
 *
 * Phase 826 / C13 / D-26-39.
 */

import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface SimulatorOptions {
  /** Base staging root (contains staging/inbox/ and console/). */
  stagingRoot: string;
  /**
   * Auto-response mode. 'complete' = respond with completed status immediately.
   * 'blocked' = respond with blocked status. Default: 'complete'.
   */
  mode?: 'complete' | 'blocked';
}

export interface SimulatorHandle {
  /** Stop watching. */
  stop(): void;
  /**
   * Manually emit a 'complete' status event for the given decision ID.
   * Used by tests that need fine-grained control.
   */
  simulateComplete(decisionId: string, resultPath?: string): void;
  /**
   * Manually emit a 'blocked' status event for the given decision ID.
   */
  simulateBlocked(decisionId: string, reason: string): void;
}

/**
 * Start the simulator. Returns a handle to stop it.
 */
export function startSimulator(opts: SimulatorOptions): SimulatorHandle {
  const inboxPath = join(opts.stagingRoot, 'staging', 'inbox');
  const consoleInboxPath = join(opts.stagingRoot, 'console', 'inbox', 'pending');
  const consoleOutboxPath = join(opts.stagingRoot, 'console', 'outbox', 'status');

  mkdirSync(inboxPath, { recursive: true });
  mkdirSync(consoleInboxPath, { recursive: true });
  mkdirSync(consoleOutboxPath, { recursive: true });

  let running = true;
  const seen = new Set<string>();

  const pollLoop = async () => {
    while (running) {
      // Check staging inbox for new .meta.json files
      if (existsSync(inboxPath)) {
        const files = readdirSync(inboxPath).filter((f) => f.endsWith('.meta.json'));
        for (const f of files) {
          const key = `staging:${f}`;
          if (!seen.has(key)) {
            seen.add(key);
            const reqId = f.replace('.meta.json', '');
            if (opts.mode !== 'blocked') {
              writeStatusEvent(consoleOutboxPath, reqId, 'complete', null, `${inboxPath}/${reqId}.md`);
            } else {
              writeStatusEvent(consoleOutboxPath, reqId, 'blocked', 'Simulated block', null);
            }
          }
        }
      }
      // Check console inbox
      if (existsSync(consoleInboxPath)) {
        const requests = readdirSync(consoleInboxPath).filter((f) => f.endsWith('.json'));
        for (const f of requests) {
          const key = `console:${f}`;
          if (!seen.has(key)) {
            seen.add(key);
            const reqId = f.replace('.json', '');
            if (opts.mode !== 'blocked') {
              writeStatusEvent(consoleOutboxPath, reqId, 'complete', null, null);
            }
          }
        }
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  };

  void pollLoop();

  function writeStatusEvent(
    outboxDir: string,
    requestId: string,
    state: string,
    blockReason: string | null,
    resultPath: string | null,
  ) {
    const event = {
      request_id: requestId,
      project_id: 'test-proj',
      state,
      block_reason: blockReason,
      result_path: resultPath,
      updated_at: new Date().toISOString(),
    };
    const filename = `${requestId}.json`;
    const tmp = join(outboxDir, `${filename}.tmp`);
    const final = join(outboxDir, filename);
    writeFileSync(tmp, JSON.stringify(event, null, 2));
    // Atomic rename
    const { renameSync } = require('node:fs');
    renameSync(tmp, final);
  }

  return {
    stop() {
      running = false;
    },
    simulateComplete(decisionId: string, resultPath?: string) {
      writeStatusEvent(consoleOutboxPath, decisionId, 'complete', null, resultPath ?? null);
    },
    simulateBlocked(decisionId: string, reason: string) {
      writeStatusEvent(consoleOutboxPath, decisionId, 'blocked', reason, null);
    },
  };
}
