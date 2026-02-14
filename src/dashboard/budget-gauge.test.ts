import { describe, it, expect } from 'vitest';
import {
  renderBudgetGauge,
  renderBudgetGaugeStyles,
  type BudgetSegment,
  type BudgetGaugeData,
} from './budget-gauge.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSegment(overrides: Partial<BudgetSegment> = {}): BudgetSegment {
  return {
    domain: overrides.domain ?? 'Frontend',
    percentage: overrides.percentage ?? 25,
    color: overrides.color ?? '#58a6ff',
  };
}

function makeData(overrides: Partial<BudgetGaugeData> = {}): BudgetGaugeData {
  return {
    segments: overrides.segments ?? [],
    totalUsed: overrides.totalUsed ?? 0,
    label: overrides.label,
  };
}

// ---------------------------------------------------------------------------
// renderBudgetGauge -- Empty state
// ---------------------------------------------------------------------------

describe('renderBudgetGauge', () => {
  describe('empty state', () => {
    it('renders gauge container with no segments', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).toContain('budget-gauge');
      expect(html).toContain('bg-bar');
    });

    it('renders 100% headroom when no segments and zero totalUsed', () => {
      const html = renderBudgetGauge(makeData({ totalUsed: 0 }));
      expect(html).toContain('bg-headroom');
      expect(html).toContain('width:100%');
    });

    it('does not render any bg-segment when no segments', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).not.toContain('bg-segment');
    });
  });

  // -------------------------------------------------------------------------
  // Stacked bar segments (REQ-BG-01)
  // -------------------------------------------------------------------------

  describe('stacked bar segments (REQ-BG-01)', () => {
    it('renders single segment at correct width percentage', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 40 })],
          totalUsed: 40,
        }),
      );
      expect(html).toContain('bg-segment');
      expect(html).toContain('width:40%');
    });

    it('renders two segments as adjacent colored sections', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [
            makeSegment({ domain: 'Frontend', percentage: 30, color: '#58a6ff' }),
            makeSegment({ domain: 'Backend', percentage: 20, color: '#3fb950' }),
          ],
          totalUsed: 50,
        }),
      );
      expect(html).toContain('width:30%');
      expect(html).toContain('width:20%');
    });

    it('renders three segments in provided order with correct widths', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [
            makeSegment({ domain: 'Frontend', percentage: 25, color: '#58a6ff' }),
            makeSegment({ domain: 'Backend', percentage: 30, color: '#3fb950' }),
            makeSegment({ domain: 'Testing', percentage: 15, color: '#d29922' }),
          ],
          totalUsed: 70,
        }),
      );
      const segmentMatches = html.match(/bg-segment/g);
      expect(segmentMatches).toHaveLength(3);
      // Widths should sum to 70%
      expect(html).toContain('width:25%');
      expect(html).toContain('width:30%');
      expect(html).toContain('width:15%');
    });

    it('sets data-domain attribute with domain name on each segment', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [
            makeSegment({ domain: 'Frontend' }),
            makeSegment({ domain: 'Backend' }),
          ],
          totalUsed: 50,
        }),
      );
      expect(html).toContain('data-domain="Frontend"');
      expect(html).toContain('data-domain="Backend"');
    });

    it('uses inline background style with provided color', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ color: '#ff5733' })],
          totalUsed: 25,
        }),
      );
      expect(html).toContain('background:#ff5733');
    });

    it('uses inline width style as percentage string', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 42 })],
          totalUsed: 42,
        }),
      );
      expect(html).toContain('width:42%');
    });
  });

  // -------------------------------------------------------------------------
  // Headroom segment (REQ-BG-04)
  // -------------------------------------------------------------------------

  describe('headroom segment (REQ-BG-04)', () => {
    it('fills remaining space with headroom segment', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 60 })],
          totalUsed: 60,
        }),
      );
      expect(html).toContain('bg-headroom');
      expect(html).toContain('width:40%');
    });

    it('has class .bg-headroom on headroom segment', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 30 })],
          totalUsed: 30,
        }),
      );
      expect(html).toContain('bg-headroom');
    });

    it('renders no headroom segment when totalUsed is 100', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 100 })],
          totalUsed: 100,
        }),
      );
      expect(html).not.toContain('bg-headroom');
    });

    it('renders 50% headroom when totalUsed is 50', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 50 })],
          totalUsed: 50,
        }),
      );
      expect(html).toContain('bg-headroom');
      expect(html).toContain('width:50%');
    });
  });

  // -------------------------------------------------------------------------
  // Threshold transitions (REQ-BG-02)
  // -------------------------------------------------------------------------

  describe('threshold transitions (REQ-BG-02)', () => {
    it('has no threshold class when totalUsed < 80', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 70 })],
          totalUsed: 70,
        }),
      );
      expect(html).not.toContain('bg-warning');
      expect(html).not.toContain('bg-critical');
    });

    it('has bg-warning class when totalUsed = 80', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 80 })],
          totalUsed: 80,
        }),
      );
      expect(html).toContain('bg-warning');
      expect(html).not.toContain('bg-critical');
    });

    it('has bg-warning class when totalUsed = 90', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 90 })],
          totalUsed: 90,
        }),
      );
      expect(html).toContain('bg-warning');
      expect(html).not.toContain('bg-critical');
    });

    it('has bg-critical class when totalUsed = 95', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 95 })],
          totalUsed: 95,
        }),
      );
      expect(html).toContain('bg-critical');
    });

    it('has bg-critical class when totalUsed = 100', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 100 })],
          totalUsed: 100,
        }),
      );
      expect(html).toContain('bg-critical');
    });
  });

  // -------------------------------------------------------------------------
  // Glance vs scan level (REQ-BG-03)
  // -------------------------------------------------------------------------

  describe('glance vs scan level (REQ-BG-03)', () => {
    it('does not show inline percentage text in default rendering', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 35 })],
          totalUsed: 35,
        }),
      );
      // The only place "35%" should appear is inside scan-label (hidden by CSS)
      // and as data-percent attribute -- NOT as visible inline text outside those
      const outsideScanLabel = html.replace(/<span class="bg-scan-label">.*?<\/span>/g, '');
      expect(outsideScanLabel).not.toMatch(/\b35%\b/);
    });

    it('sets data-percent attribute on each segment', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 45 })],
          totalUsed: 45,
        }),
      );
      expect(html).toContain('data-percent="45"');
    });

    it('applies bg-segment class to each segment', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment()],
          totalUsed: 25,
        }),
      );
      expect(html).toContain('bg-segment');
    });

    it('renders scan-label element inside each segment', () => {
      const html = renderBudgetGauge(
        makeData({
          segments: [makeSegment({ percentage: 55 })],
          totalUsed: 55,
        }),
      );
      expect(html).toContain('bg-scan-label');
      expect(html).toContain('55%');
    });
  });

  // -------------------------------------------------------------------------
  // Gauge label
  // -------------------------------------------------------------------------

  describe('gauge label', () => {
    it('renders bg-label element when label provided', () => {
      const html = renderBudgetGauge(
        makeData({ label: 'Token Budget' }),
      );
      expect(html).toContain('bg-label');
      expect(html).toContain('Token Budget');
    });

    it('does not render bg-label element when no label', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).not.toContain('bg-label');
    });
  });

  // -------------------------------------------------------------------------
  // Container structure
  // -------------------------------------------------------------------------

  describe('container structure', () => {
    it('wraps in div.budget-gauge', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).toMatch(/<div class="budget-gauge[^"]*"/);
    });

    it('contains bg-bar as the stacked bar track', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).toContain('bg-bar');
    });

    it('has role="meter" for accessibility', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).toContain('role="meter"');
    });

    it('has aria-valuenow set to totalUsed', () => {
      const html = renderBudgetGauge(
        makeData({ totalUsed: 63 }),
      );
      expect(html).toContain('aria-valuenow="63"');
    });

    it('has aria-valuemin="0" and aria-valuemax="100"', () => {
      const html = renderBudgetGauge(makeData());
      expect(html).toContain('aria-valuemin="0"');
      expect(html).toContain('aria-valuemax="100"');
    });
  });
});

// ---------------------------------------------------------------------------
// renderBudgetGaugeStyles
// ---------------------------------------------------------------------------

describe('renderBudgetGaugeStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderBudgetGaugeStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .budget-gauge class', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.budget-gauge');
  });

  it('contains .bg-bar with height and border-radius', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-bar');
    expect(css).toContain('height');
    expect(css).toContain('border-radius');
  });

  it('contains .bg-segment with layout styling', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-segment');
  });

  it('contains .bg-headroom with gray background', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-headroom');
  });

  it('contains .bg-warning with orange-tinted styles', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-warning');
  });

  it('contains .bg-critical with red-tinted styles', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-critical');
  });

  it('contains .bg-scan-label hidden by default, visible on hover', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-scan-label');
    expect(css).toContain('opacity');
    expect(css).toContain(':hover');
  });

  it('uses CSS custom properties from dashboard theme', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });

  it('contains .bg-label styling', () => {
    const css = renderBudgetGaugeStyles();
    expect(css).toContain('.bg-label');
  });
});
