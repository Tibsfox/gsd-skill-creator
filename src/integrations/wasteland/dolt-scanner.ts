/**
 * Dolt Commons Scanner — Layer 1, Wave 0
 *
 * Watches upstream Dolt commons for new tasks, tracks claims by agent ID
 * and type, records completion timestamps and quality signals, detects
 * failures, and monitors town-to-town transfers.
 *
 * Branch-per-agent observation pattern: each agent operates on a named
 * branch following `agent/{agent-id}/{task-id}`. Scanner extracts events
 * from commit messages via diff-based parsing.
 *
 * Safety: read-only access, pseudonymous agent IDs, 30-day rolling window.
 */

import type {
  ObservationEvent,
  ObservationEventType,
  DoltScannerConfig,
  ScanResult,
} from './types.js';

// ============================================================================
// Commit Message Parsers
// ============================================================================

/** Parse patterns for structured commit messages */
const COMMIT_PATTERNS: Array<{
  pattern: RegExp;
  eventType: ObservationEventType;
  extract: (match: RegExpMatchArray, branch: string) => Partial<ObservationEvent>;
}> = [
  {
    pattern: /^claim:\s+(\S+)\s+by\s+(\S+)\s+in\s+(\S+)/i,
    eventType: 'task-claimed',
    extract: (m) => ({
      taskId: m[1],
      agentId: m[2],
      townId: m[3],
    }),
  },
  {
    pattern: /^complete:\s+(\S+)\s+quality=([0-9.]+)\s+duration=(\d+)s/i,
    eventType: 'task-completed',
    extract: (m, branch) => ({
      taskId: m[1],
      agentId: extractAgentFromBranch(branch),
      metadata: { quality: parseFloat(m[2]), duration: parseInt(m[3], 10) },
    }),
  },
  {
    pattern: /^fail:\s+(\S+)\s+reason=(\S+)/i,
    eventType: 'task-failed',
    extract: (m, branch) => ({
      taskId: m[1],
      agentId: extractAgentFromBranch(branch),
      metadata: { reason: m[2] },
    }),
  },
  {
    pattern: /^transfer:\s+(\S+)\s+from\s+(\S+)\s+to\s+(\S+)\s+agent=(\S+)/i,
    eventType: 'task-transferred',
    extract: (m) => ({
      taskId: m[1],
      metadata: { fromTown: m[2], toTown: m[3] },
      agentId: m[4],
    }),
  },
  {
    pattern: /^post:\s+(\S+)\s+in\s+(\S+)/i,
    eventType: 'task-posted',
    extract: (m, branch) => ({
      taskId: m[1],
      townId: m[2],
      agentId: extractAgentFromBranch(branch),
    }),
  },
  {
    pattern: /^quality:\s+(\S+)\s+score=([0-9.]+)\s+evaluator=(\S+)/i,
    eventType: 'quality-signal',
    extract: (m, branch) => ({
      taskId: m[1],
      metadata: { score: parseFloat(m[2]), evaluator: m[3] },
      agentId: extractAgentFromBranch(branch),
    }),
  },
];

/** Extract agent ID from branch pattern agent/{agent-id}/{task-id} */
export function extractAgentFromBranch(branch: string): string {
  const parts = branch.split('/');
  if (parts.length >= 2 && parts[0] === 'agent') {
    return parts[1];
  }
  return 'unknown';
}

/** Generate a unique event ID */
function generateEventId(commit: string, index: number): string {
  return `evt-${commit.slice(0, 8)}-${index}`;
}

/**
 * Parse a commit message into an ObservationEvent.
 * Returns null for unparseable messages (logged as warning).
 */
export function parseCommitMessage(
  message: string,
  branch: string,
  commitHash: string,
  timestamp: string,
  index: number = 0,
): ObservationEvent | null {
  for (const { pattern, eventType, extract } of COMMIT_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const extracted = extract(match, branch);
      return {
        id: generateEventId(commitHash, index),
        timestamp,
        eventType,
        agentId: extracted.agentId ?? extractAgentFromBranch(branch),
        taskId: extracted.taskId ?? '',
        townId: extracted.townId ?? '',
        metadata: extracted.metadata ?? {},
        sourceCommit: commitHash,
        sourceBranch: branch,
      };
    }
  }
  return null;
}

// ============================================================================
// Checkpoint Management
// ============================================================================

/** Checkpoint state for incremental scanning */
export interface CheckpointState {
  lastCommitHash: string;
  lastScanTimestamp: string;
  eventsProcessed: number;
}

/**
 * Create an initial checkpoint state.
 */
export function createInitialCheckpoint(): CheckpointState {
  return {
    lastCommitHash: '',
    lastScanTimestamp: new Date().toISOString(),
    eventsProcessed: 0,
  };
}

// ============================================================================
// Scanner Core
// ============================================================================

/** Raw commit data from Dolt (abstraction for testability) */
export interface DoltCommit {
  hash: string;
  branch: string;
  message: string;
  author: string;
  timestamp: string;
}

/** Abstract interface for Dolt database queries (dependency injection) */
export interface DoltQueryInterface {
  listBranches(pattern: RegExp): Promise<string[]>;
  getCommitsSince(branch: string, since: string, limit: number): Promise<DoltCommit[]>;
}

/**
 * Scan Dolt commits and extract observation events.
 *
 * Uses checkpoint-based incremental scanning: only processes commits
 * after the last checkpoint. Falls back to rolling window start if
 * checkpoint is corrupted.
 */
export async function scan(
  db: DoltQueryInterface,
  config: DoltScannerConfig,
  checkpoint: CheckpointState,
): Promise<ScanResult> {
  const startTime = Date.now();
  const events: ObservationEvent[] = [];
  const errors: Array<{ branch: string; error: string }> = [];
  let scannedCommits = 0;
  let latestCommit = checkpoint.lastCommitHash;

  // Calculate rolling window boundary
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - config.rollingWindowDays);
  const sinceDate = checkpoint.lastCommitHash
    ? checkpoint.lastScanTimestamp
    : windowStart.toISOString();

  try {
    const branches = await db.listBranches(config.branchPattern);

    for (const branch of branches) {
      try {
        const commits = await db.getCommitsSince(
          branch,
          sinceDate,
          config.maxEventsPerScan,
        );

        for (const commit of commits) {
          scannedCommits++;
          const event = parseCommitMessage(
            commit.message,
            commit.branch,
            commit.hash,
            commit.timestamp,
            events.length,
          );
          if (event) {
            events.push(event);
          }
          // Track latest commit for checkpoint
          if (!latestCommit || commit.timestamp > (checkpoint.lastScanTimestamp || '')) {
            latestCommit = commit.hash;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ branch, error: msg });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push({ branch: '*', error: `Branch listing failed: ${msg}` });
  }

  return {
    events,
    scannedCommits,
    newCheckpoint: latestCommit,
    scanDurationMs: Date.now() - startTime,
    errors,
  };
}

// ============================================================================
// Polling Loop
// ============================================================================

/** Scanner lifecycle with start/stop and overlap prevention */
export interface DoltScanner {
  start(
    db: DoltQueryInterface,
    config: DoltScannerConfig,
    onEvents: (events: ObservationEvent[]) => void,
  ): void;
  stop(): void;
  isRunning(): boolean;
  getCheckpoint(): CheckpointState;
}

/**
 * Create a scanner instance with polling loop and overlap prevention.
 */
export function createScanner(): DoltScanner {
  let running = false;
  let scanning = false;
  let abortController: AbortController | null = null;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;
  let checkpoint = createInitialCheckpoint();

  return {
    start(db, config, onEvents) {
      if (running) return;
      running = true;
      abortController = new AbortController();

      const runScan = async () => {
        if (scanning || abortController?.signal.aborted) return;
        scanning = true;
        try {
          const result = await scan(db, config, checkpoint);
          if (result.events.length > 0) {
            onEvents(result.events);
          }
          if (result.newCheckpoint) {
            checkpoint = {
              lastCommitHash: result.newCheckpoint,
              lastScanTimestamp: new Date().toISOString(),
              eventsProcessed: checkpoint.eventsProcessed + result.events.length,
            };
          }
        } finally {
          scanning = false;
        }
      };

      // Run immediately, then on interval
      void runScan();
      intervalHandle = setInterval(() => void runScan(), config.pollingIntervalMs);
    },

    stop() {
      running = false;
      abortController?.abort();
      if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
      }
    },

    isRunning() {
      return running;
    },

    getCheckpoint() {
      return { ...checkpoint };
    },
  };
}
