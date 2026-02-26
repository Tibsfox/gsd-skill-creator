import * as fs from 'fs';
import * as path from 'path';
import type { ProgressTracker } from './progress-tracker.js';
import type { MetricsCollector } from './metrics-collector.js';

/**
 * Dashboard payload written to the planning console outbox.
 */
interface DashboardPayload {
  currentWave: string;
  chapterProgress: {
    completed: number;
    total: number;
  };
  tokenBudget: {
    used: number;
    total: number;
  };
  conceptCount: number;
  gapCount: number;
  lastActivity: string;
  errorCount: number;
  lastError: string | null;
}

/**
 * Writes structured JSON status payloads to the planning console
 * outbox, making the v1.40 dogfood process observable in the dashboard.
 * Uses atomic write (temp + rename) to prevent corruption.
 *
 * Satisfies: HARNESS-04 (dashboard bridge writes valid JSON to outbox).
 */
export class DashboardBridge {
  private readonly outboxDir: string;
  private readonly outboxPath: string;

  constructor(outboxDir: string) {
    this.outboxDir = outboxDir;
    this.outboxPath = path.join(outboxDir, 'v1.40-ingestion.json');
  }

  /**
   * Build and write the dashboard payload from current tracker
   * and collector state using atomic write.
   */
  update(tracker: ProgressTracker, collector: MetricsCollector): void {
    const state = tracker.getState();
    const metrics = collector.getMetrics();

    // Collect all errors from all stages
    const allErrors: string[] = [
      ...state.extraction.errors,
      ...state.learning.trackA.errors,
      ...state.learning.trackB.errors,
    ];

    const payload: DashboardPayload = {
      currentWave: this.deriveCurrentWave(state),
      chapterProgress: {
        completed: state.extraction.chaptersExtracted,
        total: 33,
      },
      tokenBudget: {
        used: metrics.totals.tokensUsed,
        total: 500000, // from milestone spec
      },
      conceptCount:
        state.learning.trackA.conceptsLearned +
        state.learning.trackB.conceptsLearned,
      gapCount: state.verification.gapsFound,
      lastActivity: state.lastUpdatedAt,
      errorCount: allErrors.length,
      lastError: allErrors.length > 0 ? allErrors[allErrors.length - 1] : null,
    };

    // Ensure outbox directory exists
    fs.mkdirSync(this.outboxDir, { recursive: true });

    // Atomic write: temp file then rename
    const json = JSON.stringify(payload, null, 2);
    const tmpPath = this.outboxPath + '.tmp';
    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, this.outboxPath);
  }

  /**
   * Derive the current wave label from progress state.
   */
  private deriveCurrentWave(
    state: ReturnType<ProgressTracker['getState']>,
  ): string {
    if (
      state.refinement.status === 'running' ||
      state.refinement.status === 'complete'
    ) {
      return 'wave-3';
    }
    if (
      state.verification.status === 'running' ||
      state.verification.status === 'complete'
    ) {
      return 'wave-2';
    }
    if (
      state.learning.trackA.status === 'running' ||
      state.learning.trackA.status === 'complete' ||
      state.learning.trackB.status === 'running' ||
      state.learning.trackB.status === 'complete'
    ) {
      return 'wave-1';
    }
    // Extraction running/complete or not started
    return 'wave-0';
  }
}
