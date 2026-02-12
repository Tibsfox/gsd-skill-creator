import { describe, it, expect } from 'vitest';
import { renderAccuracyTrend } from './accuracy-trend.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDiff(
  phase: number,
  plan: number,
  scope: PlanSummaryDiff['scope_change'],
): PlanSummaryDiff {
  return {
    phase, plan, planned_files: ['a.ts'], actual_files: ['a.ts'],
    planned_artifacts: [], actual_accomplishments: [],
    emergent_work: [], dropped_items: [], deviations: [],
    scope_change: scope,
  };
}

// All on_track => score 100%
const allOnTrack = [makeDiff(1, 1, 'on_track'), makeDiff(1, 2, 'on_track')];

// All shifted => score 25%
const allShifted = [makeDiff(2, 1, 'shifted'), makeDiff(2, 2, 'shifted')];

// Mixed: 2 on_track (100 each) + 1 expanded (50) => avg = (100+100+50)/3 = 83.3%
const mixedPhase = [
  makeDiff(3, 1, 'on_track'),
  makeDiff(3, 2, 'on_track'),
  makeDiff(3, 3, 'expanded'),
];

// Multiple phases for trend chart
const multiPhase = [
  makeDiff(1, 1, 'on_track'),    // phase 1: 100%
  makeDiff(2, 1, 'expanded'),    // phase 2: 50%
  makeDiff(3, 1, 'contracted'),  // phase 3: 75%
  makeDiff(4, 1, 'shifted'),     // phase 4: 25%
];

// 15 phases to test windowing
const fifteenPhases = Array.from({ length: 15 }, (_, i) =>
  makeDiff(i + 1, 1, 'on_track'),
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderAccuracyTrend', () => {
  // -------------------------------------------------------------------------
  // 1. Single phase with all on_track plans renders bar at 100% height
  // -------------------------------------------------------------------------
  it('renders a single bar at 100% height for all on_track plans', () => {
    const html = renderAccuracyTrend(allOnTrack);

    expect(html).toContain('height:100%');
    expect(html).toContain('data-score="100"');
  });

  // -------------------------------------------------------------------------
  // 2. Single phase with all shifted plans renders bar at 25% height
  // -------------------------------------------------------------------------
  it('renders a single bar at 25% height for all shifted plans', () => {
    const html = renderAccuracyTrend(allShifted);

    expect(html).toContain('height:25%');
    expect(html).toContain('data-score="25"');
  });

  // -------------------------------------------------------------------------
  // 3. Mixed phase renders bar at correct average height
  // -------------------------------------------------------------------------
  it('renders bar at averaged height for mixed scope changes', () => {
    const html = renderAccuracyTrend(mixedPhase);

    // (100 + 100 + 50) / 3 = 83.3
    expect(html).toContain('data-score="83.3"');
    expect(html).toContain('height:83.3%');
  });

  // -------------------------------------------------------------------------
  // 4. Multiple phases render multiple bars in ascending phase order
  // -------------------------------------------------------------------------
  it('renders multiple bars in ascending phase order', () => {
    const html = renderAccuracyTrend(multiPhase);

    const phase1Pos = html.indexOf('data-phase="1"');
    const phase2Pos = html.indexOf('data-phase="2"');
    const phase3Pos = html.indexOf('data-phase="3"');
    const phase4Pos = html.indexOf('data-phase="4"');

    expect(phase1Pos).toBeLessThan(phase2Pos);
    expect(phase2Pos).toBeLessThan(phase3Pos);
    expect(phase3Pos).toBeLessThan(phase4Pos);
  });

  // -------------------------------------------------------------------------
  // 5. Default windowSize=10 shows at most 10 most recent phases
  // -------------------------------------------------------------------------
  it('shows at most 10 most recent phases with default windowSize', () => {
    const html = renderAccuracyTrend(fifteenPhases);

    // Phases 6-15 should be present, phases 1-5 should not
    expect(html).toContain('data-phase="6"');
    expect(html).toContain('data-phase="15"');
    expect(html).not.toContain('data-phase="5"');
  });

  // -------------------------------------------------------------------------
  // 6. Custom windowSize=5 shows only last 5 phases
  // -------------------------------------------------------------------------
  it('shows only last 5 phases with custom windowSize=5', () => {
    const html = renderAccuracyTrend(fifteenPhases, 5);

    // Phases 11-15 should be present, phase 10 should not
    expect(html).toContain('data-phase="11"');
    expect(html).toContain('data-phase="15"');
    expect(html).not.toContain('data-phase="10"');
  });

  // -------------------------------------------------------------------------
  // 7. Each bar has data-phase and data-score attributes
  // -------------------------------------------------------------------------
  it('each bar has data-phase and data-score attributes', () => {
    const html = renderAccuracyTrend([makeDiff(7, 1, 'on_track')]);

    expect(html).toContain('data-phase="7"');
    expect(html).toContain('data-score="100"');
  });

  // -------------------------------------------------------------------------
  // 8. Bars use style="height:{score}%" for sparkline effect
  // -------------------------------------------------------------------------
  it('bars use inline height style for sparkline effect', () => {
    const html = renderAccuracyTrend([makeDiff(1, 1, 'contracted')]);

    // contracted = 75%
    expect(html).toContain('style="height:75%"');
  });

  // -------------------------------------------------------------------------
  // 9. Returns empty state when given empty array
  // -------------------------------------------------------------------------
  it('returns empty state "No planning data available" for empty array', () => {
    const html = renderAccuracyTrend([]);

    expect(html).toContain('No planning data available');
    expect(html).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // 10. Shows overall average accuracy label above the chart
  // -------------------------------------------------------------------------
  it('shows overall average accuracy label', () => {
    const html = renderAccuracyTrend(multiPhase);

    // (100 + 50 + 75 + 25) / 4 = 62.5%
    expect(html).toContain('Avg: 62.5%');
  });

  // -------------------------------------------------------------------------
  // 11. Renders a quality-card accuracy-trend wrapper
  // -------------------------------------------------------------------------
  it('renders a quality-card accuracy-trend wrapper', () => {
    const html = renderAccuracyTrend([makeDiff(1, 1, 'on_track')]);

    expect(html).toContain('quality-card accuracy-trend');
  });

  // -------------------------------------------------------------------------
  // 12. Bar color varies by score: trend-good, trend-warn, trend-poor
  // -------------------------------------------------------------------------
  it('applies trend-good class for scores >= 80%', () => {
    const html = renderAccuracyTrend([makeDiff(1, 1, 'on_track')]); // 100%

    expect(html).toContain('trend-good');
  });

  it('applies trend-warn class for scores >= 50% and < 80%', () => {
    const html = renderAccuracyTrend([makeDiff(1, 1, 'expanded')]); // 50%

    expect(html).toContain('trend-warn');
  });

  it('applies trend-poor class for scores < 50%', () => {
    const html = renderAccuracyTrend([makeDiff(1, 1, 'shifted')]); // 25%

    expect(html).toContain('trend-poor');
  });
});
