import { describe, it, expect } from 'vitest';
import { renderDeviationSummary } from './deviation-summary.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const withDeviations: PlanSummaryDiff = {
  phase: 3, plan: 1, planned_files: ['a.ts'], actual_files: ['a.ts', 'b.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['b.ts'], dropped_items: [],
  deviations: ['Used library X instead of Y per user decision', 'Added extra validation layer'],
  scope_change: 'expanded',
};

const noDeviations: PlanSummaryDiff = {
  phase: 1, plan: 1, planned_files: ['c.ts'], actual_files: ['c.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [], deviations: [],
  scope_change: 'on_track',
};

const singleDeviation: PlanSummaryDiff = {
  phase: 2, plan: 1, planned_files: ['d.ts'], actual_files: ['d.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [],
  deviations: ['Switched to async API'],
  scope_change: 'on_track',
};

// Phase 3 plan 2 has 1 deviation (same phase as withDeviations)
const phase3Plan2: PlanSummaryDiff = {
  phase: 3, plan: 2, planned_files: ['e.ts'], actual_files: ['e.ts', 'f.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['f.ts'], dropped_items: [],
  deviations: ['Added caching layer for performance'],
  scope_change: 'expanded',
};

const xssDeviation: PlanSummaryDiff = {
  phase: 5, plan: 1, planned_files: ['g.ts'], actual_files: ['g.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [],
  deviations: ['<script>alert(\'xss\')</script>'],
  scope_change: 'on_track',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderDeviationSummary', () => {
  // -------------------------------------------------------------------------
  // 1. Returns HTML with a <details> element for a phase that has deviations
  // -------------------------------------------------------------------------
  it('returns HTML with a details element for a phase with deviations', () => {
    const html = renderDeviationSummary([withDeviations]);

    expect(html).toContain('<details');
    expect(html).toContain('</details>');
  });

  // -------------------------------------------------------------------------
  // 2. Summary shows phase number and deviation count
  // -------------------------------------------------------------------------
  it('shows phase number and deviation count in summary', () => {
    const html = renderDeviationSummary([withDeviations]);

    expect(html).toContain('<summary>');
    expect(html).toContain('Phase 3');
    expect(html).toContain('2 deviations');
  });

  // -------------------------------------------------------------------------
  // 3. Inside details, each deviation is rendered as a list item
  // -------------------------------------------------------------------------
  it('renders each deviation as a list item inside details', () => {
    const html = renderDeviationSummary([withDeviations]);

    expect(html).toContain('<li>');
    expect(html).toContain('Used library X instead of Y per user decision');
    expect(html).toContain('Added extra validation layer');
  });

  // -------------------------------------------------------------------------
  // 4. Phase with zero deviations shows count and no expandable content
  // -------------------------------------------------------------------------
  it('shows 0 deviations row without expandable details for phase with no deviations', () => {
    const html = renderDeviationSummary([noDeviations]);

    expect(html).toContain('Phase 1');
    expect(html).toContain('0 deviations');
    expect(html).not.toContain('<details');
    expect(html).toContain('deviation-none');
  });

  // -------------------------------------------------------------------------
  // 5. Groups deviations across multiple plans in the same phase
  // -------------------------------------------------------------------------
  it('groups deviations across multiple plans in the same phase', () => {
    const html = renderDeviationSummary([withDeviations, phase3Plan2]);

    // Phase 3: plan 1 has 2, plan 2 has 1 = 3 total
    expect(html).toContain('Phase 3');
    expect(html).toContain('3 deviations');
  });

  // -------------------------------------------------------------------------
  // 6. Returns empty state when given empty array
  // -------------------------------------------------------------------------
  it('returns empty state "No planning data available" when given empty array', () => {
    const html = renderDeviationSummary([]);

    expect(html).toContain('No planning data available');
    expect(html).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // 7. Escapes HTML in deviation text
  // -------------------------------------------------------------------------
  it('escapes HTML in deviation text', () => {
    const html = renderDeviationSummary([xssDeviation]);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  // -------------------------------------------------------------------------
  // 8. Renders a quality-card deviation-summary wrapper
  // -------------------------------------------------------------------------
  it('renders a quality-card deviation-summary wrapper', () => {
    const html = renderDeviationSummary([withDeviations]);

    expect(html).toContain('quality-card deviation-summary');
  });

  // -------------------------------------------------------------------------
  // 9. Phases render in ascending phase number order
  // -------------------------------------------------------------------------
  it('renders phases in ascending phase number order', () => {
    // Pass in reverse order to verify sorting
    const html = renderDeviationSummary([withDeviations, noDeviations]);

    const phase1Pos = html.indexOf('Phase 1');
    const phase3Pos = html.indexOf('Phase 3');

    expect(phase1Pos).toBeLessThan(phase3Pos);
  });

  // -------------------------------------------------------------------------
  // 10. Uses singular "deviation" when count is exactly 1
  // -------------------------------------------------------------------------
  it('uses singular "1 deviation" when count is exactly 1', () => {
    const html = renderDeviationSummary([singleDeviation]);

    expect(html).toContain('1 deviation');
    expect(html).not.toMatch(/1 deviations/);
  });
});
