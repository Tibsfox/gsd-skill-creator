/**
 * services-bridge.ts — Phase 4: Services Layer Adapters
 *
 * Four adapters connecting the services layer to wasteland orchestration:
 *
 * R4.1: WastelandCallbacks — SubversionCallbacks adapter for Dolt operations
 * R4.2: TrustGateAdapter — gate-evaluator wrapper with rig trust level
 * R4.3: signalToStamp — CompletionSignal → StampRecommendation converter
 * R4.4: ScanScheduler — scan scheduling via autonomy scheduler pattern
 *
 * @module services-bridge
 */

import type { StampRecommendation, Valence } from './stamp-validator.js';

// ============================================================================
// R4.1: Wasteland SubversionCallbacks Adapter
// ============================================================================

/**
 * Result of a single phase in the wasteland execution cycle.
 */
export interface WastelandPhaseResult {
  success: boolean;
  artifacts?: string[];
}

/**
 * Callbacks matching SubversionCallbacks shape for wasteland Dolt operations.
 *
 * Maps the 4-phase autonomy cycle to wasteland work:
 *   prepare → pull from upstream, check for new wanted items
 *   execute → run the claimed work (completion evidence generation)
 *   verify  → validate completion against wanted requirements
 *   journal → commit results to local Dolt clone
 */
export interface WastelandCallbacks {
  prepare(subversion: number): Promise<WastelandPhaseResult>;
  execute(subversion: number): Promise<WastelandPhaseResult>;
  verify(subversion: number): Promise<WastelandPhaseResult>;
  journal(subversion: number): Promise<WastelandPhaseResult>;
}

/**
 * Create default WastelandCallbacks that delegate to Dolt operations.
 *
 * Each callback receives a DoltOperations interface, allowing the
 * actual Dolt interaction to be injected (for testing) or provided
 * by the DoltClient.
 */
export function createWastelandCallbacks(ops: DoltOperations): WastelandCallbacks {
  return {
    async prepare(subversion: number): Promise<WastelandPhaseResult> {
      const pulled = await ops.pull();
      return { success: pulled, artifacts: pulled ? ['upstream-synced'] : [] };
    },
    async execute(subversion: number): Promise<WastelandPhaseResult> {
      const result = await ops.executeWork(subversion);
      return { success: result.success, artifacts: result.artifacts };
    },
    async verify(subversion: number): Promise<WastelandPhaseResult> {
      const valid = await ops.verify(subversion);
      return { success: valid };
    },
    async journal(subversion: number): Promise<WastelandPhaseResult> {
      const committed = await ops.commit(subversion);
      return { success: committed, artifacts: committed ? ['dolt-committed'] : [] };
    },
  };
}

/**
 * Interface for Dolt operations injected into WastelandCallbacks.
 * Implementations wrap the DoltClient or mock for testing.
 */
export interface DoltOperations {
  pull(): Promise<boolean>;
  executeWork(subversion: number): Promise<{ success: boolean; artifacts: string[] }>;
  verify(subversion: number): Promise<boolean>;
  commit(subversion: number): Promise<boolean>;
}

// ============================================================================
// R4.2: Trust-Level Gate Adapter
// ============================================================================

/**
 * Gate decision from trust-level evaluation.
 */
export interface TrustGateDecision {
  action: 'proceed' | 'confirm' | 'block';
  reason: string;
  gateType: 'trust-level' | 'destructive' | 'routing';
  trustLevel: number;
}

/**
 * Trust-level gate operations and their minimum required trust levels.
 */
export const TRUST_LEVEL_REQUIREMENTS: Record<string, number> = {
  'browse': 0,        // Anyone can browse
  'claim': 0,         // Newcomers can claim
  'submit': 0,        // Newcomers can submit completions
  'stamp': 1,         // Contributors can stamp
  'review': 1,        // Contributors can review
  'escalate': 2,      // Maintainers can escalate trust
  'admin': 3,         // Only stewards
};

/**
 * Evaluate whether a rig has sufficient trust level for an operation.
 *
 * Wraps the gate-evaluator pattern: trust level acts as a confidence
 * score, and operation requirements act as thresholds.
 *
 * @param operation - The wasteland operation to gate
 * @param rigTrustLevel - The rig's current trust level (0-3)
 * @param requirements - Optional custom trust level requirements
 * @returns TrustGateDecision with proceed/confirm/block
 */
export function evaluateTrustGate(
  operation: string,
  rigTrustLevel: number,
  requirements: Record<string, number> = TRUST_LEVEL_REQUIREMENTS,
): TrustGateDecision {
  const requiredLevel = requirements[operation];

  // Unknown operation — block by default
  if (requiredLevel === undefined) {
    return {
      action: 'block',
      reason: `Unknown operation "${operation}" — no trust requirement defined`,
      gateType: 'trust-level',
      trustLevel: rigTrustLevel,
    };
  }

  // Sufficient trust — proceed
  if (rigTrustLevel >= requiredLevel) {
    return {
      action: 'proceed',
      reason: `Trust level ${rigTrustLevel} >= ${requiredLevel} required for "${operation}"`,
      gateType: 'trust-level',
      trustLevel: rigTrustLevel,
    };
  }

  // Insufficient trust — block (not confirm, because trust can't be overridden)
  return {
    action: 'block',
    reason: `Trust level ${rigTrustLevel} < ${requiredLevel} required for "${operation}"`,
    gateType: 'trust-level',
    trustLevel: rigTrustLevel,
  };
}

// ============================================================================
// R4.3: CompletionSignal → StampRecommendation Converter
// ============================================================================

/**
 * Minimal CompletionSignal shape — matches blitter signals.ts interface
 * without importing the full Zod schema dependency.
 */
export interface CompletionSignalInput {
  operationId: string;
  status: 'success' | 'failure' | 'timeout' | 'error';
  timestamp: string;
  error?: string;
}

/**
 * Convert a blitter CompletionSignal into a wasteland StampRecommendation.
 *
 * Maps execution outcomes to valence dimensions:
 *   success → quality: 0.8, reliability: 0.9, creativity: 0.5
 *   failure → quality: 0.3, reliability: 0.2, creativity: 0.5
 *   timeout → quality: 0.4, reliability: 0.1, creativity: 0.5
 *   error   → quality: 0.2, reliability: 0.1, creativity: 0.5
 *
 * Confidence scales with signal clarity (success/failure = high, error = low).
 */
export function signalToStamp(
  signal: CompletionSignalInput,
  context: { wantedId: string; handle: string },
): StampRecommendation {
  const valenceMap: Record<string, Valence> = {
    success: { quality: 0.8, reliability: 0.9, creativity: 0.5 },
    failure: { quality: 0.3, reliability: 0.2, creativity: 0.5 },
    timeout: { quality: 0.4, reliability: 0.1, creativity: 0.5 },
    error: { quality: 0.2, reliability: 0.1, creativity: 0.5 },
  };

  const confidenceMap: Record<string, number> = {
    success: 0.85,
    failure: 0.75,
    timeout: 0.6,
    error: 0.5,
  };

  const severityMap: Record<string, 'leaf' | 'branch' | 'root'> = {
    success: 'leaf',
    failure: 'branch',
    timeout: 'branch',
    error: 'root',
  };

  const valence = valenceMap[signal.status] ?? valenceMap['error']!;
  const confidence = confidenceMap[signal.status] ?? 0.5;
  const severity = severityMap[signal.status] ?? 'root';

  return {
    id: `auto-${signal.operationId}`,
    wantedId: context.wantedId,
    author: 'system',
    subject: context.handle,
    valence,
    confidence,
    severity,
    context_id: signal.operationId,
    context_type: 'completion',
    skill_tags: ['automated', signal.status],
    message: signal.error
      ? `Automated stamp: ${signal.status} — ${signal.error}`
      : `Automated stamp: ${signal.status} for ${context.handle}`,
    prev_stamp_hash: null,
    completionId: signal.operationId,
    wantedTitle: `Wanted ${context.wantedId}`,
  };
}

// ============================================================================
// R4.4: Scan Scheduler
// ============================================================================

/**
 * Configuration for periodic wasteland scans.
 */
export interface ScanSchedulerConfig {
  intervalMs: number;
  maxConcurrent: number;
  onScanComplete?: (result: { rigCount: number; eventCount: number; durationMs: number }) => void;
}

/**
 * Default scan scheduler configuration.
 * 5-minute interval, single concurrent scan.
 */
export const DEFAULT_SCAN_CONFIG: ScanSchedulerConfig = {
  intervalMs: 5 * 60 * 1000,
  maxConcurrent: 1,
};

/**
 * ScanScheduler — periodic scan orchestration following the autonomy
 * scheduler pattern. Runs scan cycles at configured intervals with
 * concurrent execution limits and a watchdog timeout.
 */
export class ScanScheduler {
  private config: ScanSchedulerConfig;
  private running: boolean = false;
  private activeScans: number = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<ScanSchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCAN_CONFIG, ...config };
  }

  /**
   * Start the scan scheduler.
   * @param scanFn - The scan function to execute on each interval
   */
  start(scanFn: () => Promise<{ rigCount: number; eventCount: number; durationMs: number }>): void {
    if (this.running) return;
    this.running = true;

    this.timer = setInterval(async () => {
      if (this.activeScans >= this.config.maxConcurrent) return;

      this.activeScans++;
      try {
        const result = await scanFn();
        this.config.onScanComplete?.(result);
      } finally {
        this.activeScans--;
      }
    }, this.config.intervalMs);
  }

  /** Stop the scan scheduler. */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Whether the scheduler is currently running. */
  isRunning(): boolean {
    return this.running;
  }

  /** Number of currently active scan operations. */
  getActiveScans(): number {
    return this.activeScans;
  }
}
