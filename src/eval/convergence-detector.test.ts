import { describe, it, expect } from 'vitest';
import { ConvergenceDetector, detectDivergence } from './convergence-detector.js';

describe('ConvergenceDetector', () => {
  it('returns false when window is empty', () => {
    const cd = new ConvergenceDetector(3);
    expect(cd.isConverged()).toBe(false);
  });

  it('returns false after 1 all-passing iteration (window=3)', () => {
    const cd = new ConvergenceDetector(3);
    cd.recordIteration({ chipA: 0.8, chipB: 0.9 }, { chipA: 0.75, chipB: 0.75 });
    expect(cd.isConverged()).toBe(false);
  });

  it('returns false after 2 all-passing iterations (window=3)', () => {
    const cd = new ConvergenceDetector(3);
    cd.recordIteration({ chipA: 0.8, chipB: 0.9 }, { chipA: 0.75, chipB: 0.75 });
    cd.recordIteration({ chipA: 0.85, chipB: 0.88 }, { chipA: 0.75, chipB: 0.75 });
    expect(cd.isConverged()).toBe(false);
  });

  it('returns true after 3 consecutive all-passing iterations (window=3)', () => {
    const cd = new ConvergenceDetector(3);
    const thresholds = { chipA: 0.75, chipB: 0.75 };
    cd.recordIteration({ chipA: 0.8, chipB: 0.9 }, thresholds);
    cd.recordIteration({ chipA: 0.85, chipB: 0.88 }, thresholds);
    cd.recordIteration({ chipA: 0.82, chipB: 0.91 }, thresholds);
    expect(cd.isConverged()).toBe(true);
  });

  it('returns false if one chip fails in the window', () => {
    const cd = new ConvergenceDetector(3);
    const thresholds = { chipA: 0.75, chipB: 0.75 };
    cd.recordIteration({ chipA: 0.8, chipB: 0.9 }, thresholds);
    cd.recordIteration({ chipA: 0.85, chipB: 0.6 }, thresholds); // chipB fails
    cd.recordIteration({ chipA: 0.82, chipB: 0.91 }, thresholds);
    expect(cd.isConverged()).toBe(false);
  });

  it('slides window: old entries trimmed when window fills', () => {
    const cd = new ConvergenceDetector(2);
    const thresholds = { chipA: 0.75 };
    cd.recordIteration({ chipA: 0.5 }, thresholds); // fails
    cd.recordIteration({ chipA: 0.8 }, thresholds); // passes
    cd.recordIteration({ chipA: 0.9 }, thresholds); // passes -- old fail pushed out
    expect(cd.isConverged()).toBe(true);
  });

  it('reset() clears accumulated state', () => {
    const cd = new ConvergenceDetector(1);
    cd.recordIteration({ chipA: 0.8 }, { chipA: 0.75 });
    expect(cd.isConverged()).toBe(true);
    cd.reset();
    expect(cd.isConverged()).toBe(false);
  });

  it('single chip convergence with window=1', () => {
    const cd = new ConvergenceDetector(1);
    cd.recordIteration({ chipA: 0.8 }, { chipA: 0.75 });
    expect(cd.isConverged()).toBe(true);
  });
});

describe('detectDivergence', () => {
  it('detects divergence: chip A improves, chip B drops > threshold', () => {
    const result = detectDivergence(
      { chipA: 0.85, chipB: 0.55 },
      { chipA: 0.70, chipB: 0.70 },
      0.10,
    );
    expect(result.diverged).toBe(true);
    expect(result.improvedChip).toBe('chipA');
    expect(result.harmedChip).toBe('chipB');
  });

  it('no divergence: chip A improves, chip B drops < threshold', () => {
    const result = detectDivergence(
      { chipA: 0.85, chipB: 0.65 },
      { chipA: 0.70, chipB: 0.70 },
      0.10,
    );
    expect(result.diverged).toBe(false);
  });

  it('no divergence: all chips improve', () => {
    const result = detectDivergence(
      { chipA: 0.85, chipB: 0.80 },
      { chipA: 0.70, chipB: 0.70 },
      0.10,
    );
    expect(result.diverged).toBe(false);
  });

  it('no divergence: no previous iteration', () => {
    const result = detectDivergence(
      { chipA: 0.85, chipB: 0.80 },
      {},
      0.10,
    );
    expect(result.diverged).toBe(false);
  });
});
