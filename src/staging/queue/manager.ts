/**
 * Queue manager facade for the staging queue.
 *
 * Provides a unified API for all queue operations: adding entries,
 * transitioning states, querying, and analyzing. Every operation
 * automatically records an audit entry via the injected logger.
 *
 * State is maintained in-memory and persisted to queue-state.json.
 * The audit log (queue.jsonl) is written via the audit logger.
 *
 * @module staging/queue/manager
 */

import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import type { QueueEntry, QueueState, QueueAuditEntry } from './types.js';
import { transitionQueueItem } from './state-machine.js';
import {
  appendAuditEntry as defaultAppendAuditEntry,
  readAuditLog as defaultReadAuditLog,
} from './audit-logger.js';
import { detectDependencies } from './dependency-detector.js';
import type { DependencyGraph } from './dependency-detector.js';
import { analyzeOptimizations } from './optimization-analyzer.js';
import type { OptimizationSuggestion } from './optimization-analyzer.js';
import type { ResourceManifest } from '../resource/types.js';

// ============================================================================
// DI Interface
// ============================================================================

/** Dependency injection interface for the queue manager. */
export interface QueueManagerDeps {
  /** Write a single audit entry. */
  appendAuditEntry: (entry: QueueAuditEntry) => Promise<void>;
  /** Read all audit entries. */
  readAuditLog: () => Promise<QueueAuditEntry[]>;
  /** Read a file as UTF-8. */
  readFile: (path: string) => Promise<string>;
  /** Write a file as UTF-8. */
  writeFile: (path: string, data: string) => Promise<void>;
  /** Create directories recursively. */
  mkdir: (path: string, options?: { recursive: boolean }) => Promise<unknown>;
}

// ============================================================================
// Options
// ============================================================================

/** Options for creating a queue manager. */
export interface QueueManagerOptions {
  /** Project root (parent of .planning/). */
  basePath: string;
}

// ============================================================================
// QueueManager interface
// ============================================================================

/** Options for adding a new entry to the queue. */
export interface AddEntryOptions {
  filename: string;
  milestoneName: string;
  domain: string;
  tags: string[];
  resourceManifestPath: string;
}

/** The public queue manager interface. */
export interface QueueManager {
  /** Add a new entry to the queue. */
  addEntry(options: AddEntryOptions): Promise<QueueEntry>;
  /** Transition an entry to a new state. */
  transition(
    entryId: string,
    toState: QueueState,
    actor: string,
    rationale: string,
  ): Promise<QueueEntry>;
  /** Get a single entry by ID. */
  getEntry(entryId: string): QueueEntry | undefined;
  /** List all entries, optionally filtered by state. */
  listEntries(filter?: { state?: QueueState }): QueueEntry[];
  /** Analyze the queue for dependencies and optimizations. */
  analyzeQueue(): Promise<{
    dependencies: DependencyGraph;
    optimizations: OptimizationSuggestion[];
  }>;
  /** Get the full audit log. */
  getAuditLog(): Promise<QueueAuditEntry[]>;
}

// ============================================================================
// State file path
// ============================================================================

const STATE_FILE = 'queue-state.json';

function statePath(basePath: string): string {
  return join(basePath, '.planning', 'staging', STATE_FILE);
}

// ============================================================================
// Default deps
// ============================================================================

function makeDefaultDeps(basePath: string): QueueManagerDeps {
  return {
    appendAuditEntry: (entry) =>
      defaultAppendAuditEntry(entry, { basePath }),
    readAuditLog: () => defaultReadAuditLog({ basePath }),
    readFile: (path) => readFile(path, 'utf-8'),
    writeFile: (path, data) => writeFile(path, data, 'utf-8'),
    mkdir: (path, options) => mkdir(path, options),
  };
}

// ============================================================================
// ID generation
// ============================================================================

function generateId(counter: number): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `q-${date}-${String(counter).padStart(3, '0')}`;
}

// ============================================================================
// Audit entry creation
// ============================================================================

function createAuditEntry(
  entryId: string,
  action: string,
  fromState: QueueState | null,
  toState: QueueState,
  actor: string,
  rationale: string,
): QueueAuditEntry {
  const now = new Date();
  const ts = now.toISOString();
  const timePart = ts.slice(11, 19).replace(/:/g, '');
  return {
    id: `audit-${ts.slice(0, 10).replace(/-/g, '')}-${timePart}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    entryId,
    action,
    fromState,
    toState,
    actor,
    rationale,
    timestamp: ts,
  };
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a queue manager instance.
 *
 * Loads existing state from queue-state.json on first access.
 * All operations are automatically audited and persisted.
 *
 * @param options - Manager options including basePath.
 * @param deps - Optional DI overrides for all dependencies.
 * @returns A QueueManager object.
 */
export function createQueueManager(
  options: QueueManagerOptions,
  deps?: Partial<QueueManagerDeps>,
): QueueManager {
  const resolvedDeps: QueueManagerDeps = {
    ...makeDefaultDeps(options.basePath),
    ...deps,
  };

  // In-memory entry store
  const entries = new Map<string, QueueEntry>();
  let counter = 0;
  let dirEnsured = false;

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  async function ensureDir(): Promise<void> {
    if (dirEnsured) return;
    const dir = join(options.basePath, '.planning', 'staging');
    await resolvedDeps.mkdir(dir, { recursive: true });
    dirEnsured = true;
  }

  // Eager load: kicked off at creation time, stored as a shared promise.
  // All async methods await this before proceeding.
  const loadPromise: Promise<void> = (async () => {
    try {
      const raw = await resolvedDeps.readFile(statePath(options.basePath));
      const parsed = JSON.parse(raw) as QueueEntry[];
      for (const entry of parsed) {
        entries.set(entry.id, entry);
        counter++;
      }
    } catch (error: unknown) {
      // If file doesn't exist, start empty
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        // No state file yet -- start fresh
      } else {
        throw error;
      }
    }
  })();

  async function persistState(): Promise<void> {
    await ensureDir();
    const data = JSON.stringify(
      Array.from(entries.values()),
      null,
      2,
    );
    await resolvedDeps.writeFile(statePath(options.basePath), data);
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  async function addEntry(addOpts: AddEntryOptions): Promise<QueueEntry> {
    await loadPromise;

    counter++;
    const id = generateId(counter);
    const now = new Date().toISOString();

    const entry: QueueEntry = {
      id,
      filename: addOpts.filename,
      state: 'uploaded',
      milestoneName: addOpts.milestoneName,
      domain: addOpts.domain,
      tags: addOpts.tags,
      resourceManifestPath: addOpts.resourceManifestPath,
      createdAt: now,
      updatedAt: now,
    };

    entries.set(id, entry);

    // Audit
    const auditEntry = createAuditEntry(
      id,
      'create',
      null,
      'uploaded',
      'system',
      `Created queue entry for ${addOpts.filename}`,
    );
    await resolvedDeps.appendAuditEntry(auditEntry);

    // Persist
    await persistState();

    return entry;
  }

  async function transition(
    entryId: string,
    toState: QueueState,
    actor: string,
    rationale: string,
  ): Promise<QueueEntry> {
    await loadPromise;

    const existing = entries.get(entryId);
    if (!existing) {
      throw new Error(`Queue entry not found: ${entryId}`);
    }

    // Delegate validation to the state machine
    const updated = transitionQueueItem(existing, toState);

    entries.set(entryId, updated);

    // Audit
    const auditEntry = createAuditEntry(
      entryId,
      'transition',
      existing.state,
      toState,
      actor,
      rationale,
    );
    await resolvedDeps.appendAuditEntry(auditEntry);

    // Persist
    await persistState();

    return updated;
  }

  function getEntry(entryId: string): QueueEntry | undefined {
    return entries.get(entryId);
  }

  function listEntries(filter?: { state?: QueueState }): QueueEntry[] {
    let result = Array.from(entries.values());

    if (filter?.state) {
      result = result.filter((e) => e.state === filter.state);
    }

    // Sort by createdAt ascending
    result.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return result;
  }

  async function analyzeQueue(): Promise<{
    dependencies: DependencyGraph;
    optimizations: OptimizationSuggestion[];
  }> {
    await loadPromise;

    const allEntries = Array.from(entries.values());
    const manifests = new Map<string, ResourceManifest>();

    // Load manifests from disk for each entry
    for (const entry of allEntries) {
      try {
        const raw = await resolvedDeps.readFile(
          join(options.basePath, entry.resourceManifestPath),
        );
        manifests.set(entry.id, JSON.parse(raw) as ResourceManifest);
      } catch {
        // Skip entries without readable manifests
      }
    }

    const dependencies = detectDependencies(allEntries, manifests);
    const optimizations = analyzeOptimizations(
      allEntries,
      manifests,
      dependencies.edges,
    );

    return { dependencies, optimizations };
  }

  async function getAuditLog(): Promise<QueueAuditEntry[]> {
    await loadPromise;
    return resolvedDeps.readAuditLog();
  }

  // --------------------------------------------------------------------------
  // Return manager object
  // --------------------------------------------------------------------------

  return {
    addEntry,
    transition,
    getEntry,
    listEntries,
    analyzeQueue,
    getAuditLog,
  };
}
