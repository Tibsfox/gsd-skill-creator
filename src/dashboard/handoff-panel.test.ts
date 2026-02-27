import { describe, it, expect } from 'vitest';
import {
  renderDriftTrend,
  renderFidelityDistribution,
  renderHandoffPanelStyles,
  type HandoffPanelData,
  type DriftEntry,
  type FidelityDistribution,
} from './handoff-panel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDriftEntry(overrides: Partial<DriftEntry> = {}): DriftEntry {
  return {
    score: overrides.score ?? 0.12,
    timestamp: overrides.timestamp ?? '2026-02-26T10:00:00Z',
    pattern: overrides.pattern ?? 'planner->executor:task',
    recommendation: overrides.recommendation ?? 'maintain',
  };
}

function makeFidelityDistribution(
  overrides: Partial<FidelityDistribution> = {},
): FidelityDistribution {
  return {
    level0: overrides.level0 ?? 23,
    level1: overrides.level1 ?? 12,
    level2: overrides.level2 ?? 8,
    level3: overrides.level3 ?? 3,
  };
}

function makeHandoffPanelData(
  overrides: Partial<HandoffPanelData> = {},
): HandoffPanelData {
  return {
    driftEntries: overrides.driftEntries ?? [makeDriftEntry()],
    fidelity: overrides.fidelity ?? makeFidelityDistribution(),
    milestoneName: overrides.milestoneName ?? 'auth-refactor-v2',
    totalHandoffs: overrides.totalHandoffs ?? 47,
    avgDrift: overrides.avgDrift ?? 0.08,
  };
}

// ---------------------------------------------------------------------------
// renderDriftTrend (DASH-01)
// ---------------------------------------------------------------------------

describe('renderDriftTrend', () => {
  it('returns HTML string containing hp-drift-trend container class', () => {
    const html = renderDriftTrend(makeHandoffPanelData());
    expect(html).toContain('hp-drift-trend');
  });

  it('renders each drift entry with hp-drift-entry class', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry(), makeDriftEntry({ score: 0.25 })],
      }),
    );
    const matches = html.match(/hp-drift-entry/g);
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it('high drift entries (score > 0.3) get hp-drift-high class', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ score: 0.45 })],
      }),
    );
    expect(html).toContain('hp-drift-high');
  });

  it('low drift entries (score < 0.05) get hp-drift-low class', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ score: 0.02 })],
      }),
    );
    expect(html).toContain('hp-drift-low');
  });

  it('normal drift entries do not get high or low class', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ score: 0.15 })],
      }),
    );
    expect(html).not.toContain('hp-drift-high');
    expect(html).not.toContain('hp-drift-low');
  });

  it('renders drift score as 2-decimal string', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ score: 0.12 })],
      }),
    );
    expect(html).toContain('0.12');
  });

  it('renders pattern name for each entry', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ pattern: 'verifier->lead:report' })],
      }),
    );
    expect(html).toContain('verifier-&gt;lead:report');
  });

  it('empty driftEntries array renders hp-empty-msg', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({ driftEntries: [] }),
    );
    expect(html).toContain('hp-empty-msg');
    expect(html).toContain('No drift events recorded');
  });

  it('renders summary bar with total handoffs count', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({ totalHandoffs: 47 }),
    );
    expect(html).toContain('hp-summary-bar');
    expect(html).toContain('47');
  });

  it('renders summary bar with average drift', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({ avgDrift: 0.08 }),
    );
    expect(html).toContain('0.08');
  });

  it('renders promote recommendation as up-arrow', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ recommendation: 'promote' })],
      }),
    );
    // Up arrow Unicode character
    expect(html).toMatch(/[\u2191\u25B2\u2B06]/);
  });

  it('renders demote recommendation as down-arrow', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ recommendation: 'demote' })],
      }),
    );
    // Down arrow Unicode character
    expect(html).toMatch(/[\u2193\u25BC\u2B07]/);
  });

  it('renders maintain recommendation as dash', () => {
    const html = renderDriftTrend(
      makeHandoffPanelData({
        driftEntries: [makeDriftEntry({ recommendation: 'maintain' })],
      }),
    );
    // Dash character
    expect(html).toMatch(/[\u2014\u2013\u2212-]/);
  });
});

// ---------------------------------------------------------------------------
// renderFidelityDistribution (DASH-02)
// ---------------------------------------------------------------------------

describe('renderFidelityDistribution', () => {
  it('returns HTML containing hp-fidelity-dist container class', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    expect(html).toContain('hp-fidelity-dist');
  });

  it('renders 4 horizontal bars with hp-fidelity-bar class', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    const matches = html.match(/hp-fidelity-bar/g);
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });

  it('each bar width is proportional to its count / max count', () => {
    const html = renderFidelityDistribution(
      makeHandoffPanelData({
        fidelity: makeFidelityDistribution({
          level0: 20,
          level1: 10,
          level2: 5,
          level3: 20,
        }),
      }),
    );
    // level0 and level3 are max (20), so 100%
    expect(html).toContain('width:100%');
    // level1 is 10/20 = 50%
    expect(html).toContain('width:50%');
    // level2 is 5/20 = 25%
    expect(html).toContain('width:25%');
  });

  it('each bar shows level label (L0, L1, L2, L3)', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    expect(html).toContain('L0');
    expect(html).toContain('L1');
    expect(html).toContain('L2');
    expect(html).toContain('L3');
  });

  it('each bar shows count number', () => {
    const html = renderFidelityDistribution(
      makeHandoffPanelData({
        fidelity: makeFidelityDistribution({
          level0: 23,
          level1: 12,
          level2: 8,
          level3: 3,
        }),
      }),
    );
    expect(html).toContain('23');
    expect(html).toContain('12');
    expect(html).toContain('8');
    expect(html).toContain('3');
  });

  it('L0 bar uses text-muted color', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    // L0 should reference --text-muted
    expect(html).toContain('--text-muted');
  });

  it('L1 bar uses blue color', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    expect(html).toContain('--blue');
  });

  it('L2 bar uses yellow color', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    expect(html).toContain('--yellow');
  });

  it('L3 bar uses red color', () => {
    const html = renderFidelityDistribution(makeHandoffPanelData());
    expect(html).toContain('--red');
  });

  it('zero-count levels still render bars', () => {
    const html = renderFidelityDistribution(
      makeHandoffPanelData({
        fidelity: makeFidelityDistribution({
          level0: 10,
          level1: 0,
          level2: 5,
          level3: 0,
        }),
      }),
    );
    // All 4 bars should exist
    const matches = html.match(/hp-fidelity-bar/g);
    expect(matches!.length).toBeGreaterThanOrEqual(4);
  });

  it('empty state (all zeros) renders bars with zero width', () => {
    const html = renderFidelityDistribution(
      makeHandoffPanelData({
        fidelity: makeFidelityDistribution({
          level0: 0,
          level1: 0,
          level2: 0,
          level3: 0,
        }),
      }),
    );
    // All bars should have 0% width
    const widthMatches = html.match(/width:0%/g);
    expect(widthMatches!.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// renderHandoffPanelStyles
// ---------------------------------------------------------------------------

describe('renderHandoffPanelStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderHandoffPanelStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .hp-drift-trend class', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('.hp-drift-trend');
  });

  it('contains .hp-drift-entry class', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('.hp-drift-entry');
  });

  it('contains .hp-fidelity-dist class', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('.hp-fidelity-dist');
  });

  it('contains .hp-fidelity-bar class', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('.hp-fidelity-bar');
  });

  it('contains .hp-drift-high state class', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('.hp-drift-high');
  });

  it('contains .hp-drift-low state class', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('.hp-drift-low');
  });

  it('uses CSS custom properties from dashboard theme', () => {
    const css = renderHandoffPanelStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });
});
