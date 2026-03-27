/**
 * ConvergenceDetector — pure sliding-window convergence detection for
 * cross-model optimization loops.
 *
 * Tracks per-chip pass rates over a configurable window of iterations.
 * Convergence is reached when ALL chips exceed their thresholds for
 * `windowSize` consecutive iterations.
 *
 * IMP-06: Pure — no IO, no Date, no Math.random, no side effects.
 */

// ============================================================================
// Types
// ============================================================================

export interface DivergenceResult {
  diverged: boolean;
  improvedChip?: string;
  harmedChip?: string;
}

// ============================================================================
// detectDivergence (pure function)
// ============================================================================

/**
 * Detect if optimizing for one chip harmed another.
 *
 * Compares current pass rates to previous iteration. If any chip improved
 * while another dropped by more than `threshold`, divergence is detected.
 */
export function detectDivergence(
  current: Record<string, number>,
  previous: Record<string, number>,
  threshold: number,
): DivergenceResult {
  const prevEntries = Object.entries(previous);
  if (prevEntries.length === 0) {
    return { diverged: false };
  }

  for (const [chipA, rateA] of Object.entries(current)) {
    const prevA = previous[chipA] ?? 0;
    if (rateA > prevA) {
      for (const [chipB, rateB] of Object.entries(current)) {
        if (chipB === chipA) continue;
        const prevB = previous[chipB] ?? 0;
        if (prevB - rateB > threshold) {
          return { diverged: true, improvedChip: chipA, harmedChip: chipB };
        }
      }
    }
  }

  return { diverged: false };
}

// ============================================================================
// ConvergenceDetector
// ============================================================================

/**
 * Sliding-window convergence detector.
 *
 * Records per-iteration pass/fail per chip. Convergence is true when
 * the window is full and every chip passed in every entry.
 */
export class ConvergenceDetector {
  private window: Array<Record<string, boolean>> = [];
  private readonly windowSize: number;

  constructor(windowSize: number) {
    this.windowSize = windowSize;
  }

  /**
   * Record a single iteration's pass rates against thresholds.
   * Pushes a per-chip boolean map and trims to windowSize.
   */
  recordIteration(
    perChipPassRates: Record<string, number>,
    thresholds: Record<string, number>,
  ): void {
    const entry: Record<string, boolean> = {};
    for (const [chip, rate] of Object.entries(perChipPassRates)) {
      const threshold = thresholds[chip] ?? 0;
      entry[chip] = rate >= threshold;
    }
    this.window.push(entry);
    if (this.window.length > this.windowSize) {
      this.window.splice(0, this.window.length - this.windowSize);
    }
  }

  /**
   * Check if convergence has been reached.
   * True when window is full and every chip is above threshold in ALL entries.
   */
  isConverged(): boolean {
    if (this.window.length < this.windowSize) {
      return false;
    }
    return this.window.every((entry) =>
      Object.values(entry).every((passed) => passed),
    );
  }

  /** Clear accumulated state. */
  reset(): void {
    this.window = [];
  }
}
