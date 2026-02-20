/**
 * Dispatcher agent for the GSD Den message bus.
 *
 * Orchestrates the full message lifecycle: scans priority directories
 * in strict order (0-7), routes messages to registered handlers by
 * DST field, acknowledges successful deliveries, dead-letters failures,
 * collects health metrics, and runs periodic pruning.
 *
 * Provides both a stateless `dispatchCycle` function and a stateful
 * `Dispatcher` class wrapper for longer-lived usage.
 */

import { join, basename } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

import { BusConfigSchema } from './types.js';
import type { BusConfig, BusMessage, HealthMetrics } from './types.js';
import {
  initBus,
  acknowledgeMessage,
  deadLetterMessage,
} from './bus.js';
import { decodeMessage } from './encoder.js';
import { collectHealthMetrics } from './health.js';
import { pruneAcknowledged, pruneDeadLetters } from './pruner.js';
import type { PruneResult } from './pruner.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Callback for handling a delivered message.
 *
 * Handlers receive a decoded BusMessage and may perform arbitrary
 * processing. If the handler throws, the message is dead-lettered
 * with the error detail.
 */
export type RouteHandler = (message: BusMessage) => Promise<void> | void;

/**
 * Result of a single dispatch cycle.
 *
 * Provides clear accounting of what happened during the cycle:
 * how many messages were processed, acknowledged, dead-lettered,
 * and the current health state of the bus after processing.
 */
export interface DispatchResult {
  /** Total messages processed (routed or dead-lettered) */
  processed: number;
  /** Messages successfully delivered and acknowledged */
  acknowledged: number;
  /** Messages that could not be delivered (no handler or handler error) */
  deadLettered: number;
  /** Health metrics snapshot taken after dispatch */
  metrics: HealthMetrics;
}

/**
 * Combined result from running both acknowledged and dead-letter pruning.
 */
export interface CombinedPruneResult {
  /** Number of messages pruned total */
  pruned: number;
  /** Number of messages remaining total */
  remaining: number;
  /** Reasons from both prune operations */
  reasons: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Number of priority levels (0-7 inclusive) */
const PRIORITY_COUNT = 8;

// ============================================================================
// Core dispatch logic
// ============================================================================

/**
 * Scan a single priority directory and return message file paths.
 *
 * @param busDir - Bus root directory
 * @param priority - Priority level (0-7)
 * @returns Sorted array of absolute paths to .msg files
 */
async function scanPriorityDir(busDir: string, priority: number): Promise<string[]> {
  const dir = join(busDir, `priority-${priority}`);
  try {
    const entries = await readdir(dir);
    const msgFiles = entries.filter((f) => f.endsWith('.msg')).sort();
    return msgFiles.map((f) => join(dir, f));
  } catch {
    return [];
  }
}

/**
 * Route a single message to the appropriate handler(s).
 *
 * If DST is 'all', the message is delivered to every registered handler.
 * If DST matches a registered handler, it is delivered to that handler.
 * If no handler is found, the message is dead-lettered.
 *
 * @param config - Bus configuration
 * @param message - Decoded bus message
 * @param messagePath - Absolute path to the message file
 * @param handlers - Map of agent ID to handler function
 * @returns Object with acknowledged and deadLettered counts
 */
async function routeMessage(
  config: BusConfig,
  message: BusMessage,
  messagePath: string,
  handlers: Map<string, RouteHandler>,
): Promise<{ acknowledged: number; deadLettered: number }> {
  const dst = message.header.dst;

  // Broadcast: deliver to all registered handlers
  if (dst === 'all') {
    try {
      for (const handler of handlers.values()) {
        await handler(message);
      }
      await acknowledgeMessage(config, messagePath);
      return { acknowledged: 1, deadLettered: 0 };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await deadLetterMessage(config, messagePath, `handler error: ${reason}`);
      return { acknowledged: 0, deadLettered: 1 };
    }
  }

  // Targeted delivery: look up handler by DST
  const handler = handlers.get(dst);
  if (!handler) {
    await deadLetterMessage(config, messagePath, `no handler registered for destination: ${dst}`);
    return { acknowledged: 0, deadLettered: 1 };
  }

  try {
    await handler(message);
    await acknowledgeMessage(config, messagePath);
    return { acknowledged: 1, deadLettered: 0 };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await deadLetterMessage(config, messagePath, `handler error: ${reason}`);
    return { acknowledged: 0, deadLettered: 1 };
  }
}

// ============================================================================
// dispatchCycle (stateless)
// ============================================================================

/**
 * Run a single dispatch cycle: scan all priority directories in order,
 * route each message to its handler, acknowledge successes, dead-letter
 * failures, and collect health metrics.
 *
 * This is the stateless version -- takes config and handlers, returns
 * results. No side effects beyond filesystem operations.
 *
 * @param config - Bus configuration
 * @param handlers - Record of agent ID to handler function
 * @returns Dispatch result with counts and health metrics
 */
export async function dispatchCycle(
  config: BusConfig,
  handlers: Record<string, RouteHandler>,
): Promise<DispatchResult> {
  const handlerMap = new Map(Object.entries(handlers));

  let processed = 0;
  let acknowledged = 0;
  let deadLettered = 0;

  // Scan priority-0 through priority-7 in strict order
  for (let p = 0; p < PRIORITY_COUNT; p++) {
    const messagePaths = await scanPriorityDir(config.busDir, p);

    for (const messagePath of messagePaths) {
      // Read and decode the message
      const content = await readFile(messagePath, 'utf-8');
      const message = decodeMessage(content);

      // Route to handler(s)
      const result = await routeMessage(config, message, messagePath, handlerMap);

      processed++;
      acknowledged += result.acknowledged;
      deadLettered += result.deadLettered;
    }
  }

  // Collect health metrics after processing
  const metrics = await collectHealthMetrics(config);

  return { processed, acknowledged, deadLettered, metrics };
}

// ============================================================================
// Dispatcher class (stateful)
// ============================================================================

/**
 * Stateful dispatcher wrapping the dispatch cycle with init, metrics,
 * and pruning lifecycle methods.
 *
 * Use `createDispatcher` factory function for ergonomic creation
 * (handles init automatically).
 */
export class Dispatcher {
  private readonly config: BusConfig;
  private readonly handlers: Map<string, RouteHandler>;

  /**
   * Create a new Dispatcher instance.
   *
   * Note: Call `init()` after construction to ensure bus directories
   * exist. The `createDispatcher` factory does this automatically.
   *
   * @param config - Bus configuration (validated through Zod)
   * @param handlers - Record of agent ID to handler function
   */
  constructor(config: BusConfig, handlers: Record<string, RouteHandler>) {
    // Validate config through Zod schema (throws on invalid)
    this.config = BusConfigSchema.parse(config);
    this.handlers = new Map(Object.entries(handlers));
  }

  /**
   * Initialize bus directory structure.
   *
   * Idempotent -- safe to call multiple times.
   */
  async init(): Promise<void> {
    await initBus(this.config);
  }

  /**
   * Run one dispatch cycle.
   *
   * Scans all priority directories, routes messages, acknowledges
   * successes, dead-letters failures, collects health metrics.
   *
   * @returns Dispatch result with counts and health metrics
   */
  async dispatch(): Promise<DispatchResult> {
    return dispatchCycle(this.config, Object.fromEntries(this.handlers));
  }

  /**
   * Collect health metrics without dispatching.
   *
   * Returns a snapshot of the current bus state: queue depths,
   * total messages, oldest unacknowledged age, dead-letter count.
   *
   * @returns Health metrics snapshot
   */
  async getMetrics(): Promise<HealthMetrics> {
    return collectHealthMetrics(this.config);
  }

  /**
   * Run pruning on both acknowledged and dead-letter directories.
   *
   * Combines results from `pruneAcknowledged` and `pruneDeadLetters`
   * into a single result.
   *
   * @returns Combined pruning result
   */
  async prune(): Promise<CombinedPruneResult> {
    const ackResult = await pruneAcknowledged(this.config);
    const dlResult = await pruneDeadLetters(this.config);

    return {
      pruned: ackResult.pruned + dlResult.pruned,
      remaining: ackResult.remaining + dlResult.remaining,
      reasons: [...new Set([...ackResult.reasons, ...dlResult.reasons])],
    };
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create and initialize a Dispatcher.
 *
 * Convenience factory that constructs a Dispatcher, calls `init()`
 * to ensure bus directories exist, and returns the ready-to-use instance.
 *
 * @param config - Bus configuration
 * @param handlers - Record of agent ID to handler function
 * @returns Initialized Dispatcher instance
 */
export async function createDispatcher(
  config: BusConfig,
  handlers: Record<string, RouteHandler>,
): Promise<Dispatcher> {
  const dispatcher = new Dispatcher(config, handlers);
  await dispatcher.init();
  return dispatcher;
}
