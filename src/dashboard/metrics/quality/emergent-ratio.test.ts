import { describe, it, expect } from 'vitest';
import { renderEmergentRatio } from './emergent-ratio.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const noEmergent: PlanSummaryDiff = {
  phase: 1, plan: 1, planned_files: ['a.ts', 'b.ts'], actual_files: ['a.ts', 'b.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [], deviations: [],
  scope_change: 'on_track',
};

const someEmergent: PlanSummaryDiff = {
  phase: 2, plan: 1, planned_files: ['c.ts'], actual_files: ['c.ts', 'd.ts', 'e.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['d.ts', 'e.ts'], dropped_items: [], deviations: [],
  scope_change: 'expanded',
};

// Two plans in phase 3 for grouping test
const phase3Plan1: PlanSummaryDiff = {
  phase: 3, plan: 1, planned_files: ['f.ts'], actual_files: ['f.ts', 'g.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['g.ts'], dropped_items: [], deviations: [],
  scope_change: 'expanded',
};

const phase3Plan2: PlanSummaryDiff = {
  phase: 3, plan: 2, planned_files: ['h.ts'], actual_files: ['h.ts', 'i.ts', 'j.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['i.ts', 'j.ts'], dropped_items: [], deviations: [],
  scope_change: 'expanded',
};

// Edge case: no actual files
const emptyActual: PlanSummaryDiff = {
  phase: 4, plan: 1, planned_files: ['k.ts'], actual_files: [],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: ['k.ts'], deviations: [],
  scope_change: 'contracted',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderEmergentRatio', () => {
  // -------------------------------------------------------------------------
  // 1. Shows 0% for phase with no emergent work
  // -------------------------------------------------------------------------
  it('returns HTML showing 0% for phase with no emergent work', () => {
    const html = renderEmergentRatio([noEmergent]);

    expect(html).toContain('0%');
    expect(html).toContain('Phase 1');
    expect(html).toContain('0/2 files');
  });

  // -------------------------------------------------------------------------
  // 2. Shows correct percentage for phase with emergent work
  // -------------------------------------------------------------------------
  it('returns HTML showing correct percentage for phase with emergent work', () => {
    const html = renderEmergentRatio([someEmergent]);

    // 2 emergent out of 3 actual = 66.7%
    expect(html).toContain('66.7%');
    expect(html).toContain('2/3 files');
  });

  // -------------------------------------------------------------------------
  // 3. Groups diffs by phase and sums across plans
  // -------------------------------------------------------------------------
  it('groups diffs by phase and sums emergent/actual across plans', () => {
    const html = renderEmergentRatio([phase3Plan1, phase3Plan2]);

    // Phase 3: total actual = 2 + 3 = 5, total emergent = 1 + 2 = 3
    // Ratio = 3/5 * 100 = 60%
    expect(html).toContain('60%');
    expect(html).toContain('3/5 files');
  });

  // -------------------------------------------------------------------------
  // 4. Shows rolling average across all phases
  // -------------------------------------------------------------------------
  it('shows rolling average across all phases', () => {
    const html = renderEmergentRatio([noEmergent, someEmergent]);

    // Phase 1: 0%, Phase 2: 66.7%
    // Rolling average: (0 + 66.7) / 2 = 33.35 => rounded to 33.4%
    expect(html).toContain('Rolling Average');
    expect(html).toContain('33.4%');
  });

  // -------------------------------------------------------------------------
  // 5. Displays CSS bar with width proportional to percentage
  // -------------------------------------------------------------------------
  it('displays CSS bar with width proportional to percentage', () => {
    const html = renderEmergentRatio([someEmergent]);

    expect(html).toContain('emergent-bar');
    expect(html).toContain('emergent-fill');
    // 66.7% width
    expect(html).toMatch(/width:\s*66\.7%/);
  });

  // -------------------------------------------------------------------------
  // 6. Empty state
  // -------------------------------------------------------------------------
  it('returns empty state when given empty array', () => {
    const html = renderEmergentRatio([]);

    expect(html).toContain('No planning data available');
    expect(html).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // 7. Handles edge case where actual_files is empty (no division by zero)
  // -------------------------------------------------------------------------
  it('handles empty actual_files without division by zero', () => {
    const html = renderEmergentRatio([emptyActual]);

    expect(html).toContain('0%');
    expect(html).toContain('0/0 files');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });

  // -------------------------------------------------------------------------
  // 8. Wrapper div with correct class
  // -------------------------------------------------------------------------
  it('renders a quality-card emergent-ratio wrapper', () => {
    const html = renderEmergentRatio([someEmergent]);

    expect(html).toContain('quality-card emergent-ratio');
  });

  // -------------------------------------------------------------------------
  // 9. Rolling average rounds to one decimal place
  // -------------------------------------------------------------------------
  it('rolling average rounds to one decimal place', () => {
    const html = renderEmergentRatio([noEmergent, someEmergent]);

    // (0 + 66.666...) / 2 = 33.333... => 33.3%
    const averageMatch = html.match(/Rolling Average:\s*([\d.]+)%/);
    expect(averageMatch).not.toBeNull();
    const avgStr = averageMatch![1];
    // Should have at most one decimal place
    expect(avgStr).toMatch(/^\d+(\.\d)?$/);
  });

  // -------------------------------------------------------------------------
  // 10. Multiple phases render in ascending phase number order
  // -------------------------------------------------------------------------
  it('renders multiple phases in ascending phase number order', () => {
    // Pass in reverse order to verify sorting
    const html = renderEmergentRatio([someEmergent, noEmergent]);

    const phase1Pos = html.indexOf('Phase 1');
    const phase2Pos = html.indexOf('Phase 2');

    expect(phase1Pos).toBeLessThan(phase2Pos);
  });
});
