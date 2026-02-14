/**
 * Frame time performance measurer.
 *
 * Tracks a rolling window of render frame times and reports whether the
 * shader pipeline stays within its 2 ms per-frame budget (WEBGL-03).
 * Pure TypeScript -- no WebGL dependencies.
 */

export class FrameTimeMeasurer {
  private samples: number[] = [];
  private readonly maxSamples = 60;

  /**
   * Measure the execution time of a render function.
   * Records the elapsed time as a sample and returns it in milliseconds.
   */
  measure(renderFn: () => void): number {
    const start = performance.now();
    renderFn();
    const elapsed = performance.now() - start;
    this.samples.push(elapsed);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    return elapsed;
  }

  /** Mean frame time across recorded samples (0 if no samples). */
  get averageMs(): number {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return sum / this.samples.length;
  }

  /** Maximum frame time across recorded samples (0 if no samples). */
  get maxMs(): number {
    if (this.samples.length === 0) return 0;
    return Math.max(...this.samples);
  }

  /** True when average frame time is under the 2 ms budget. */
  get withinBudget(): boolean {
    return this.averageMs < 2.0;
  }

  /** Clear all recorded samples. */
  reset(): void {
    this.samples = [];
  }
}
