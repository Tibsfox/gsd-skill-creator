import { describe, it, expect } from 'vitest';
import { renderAccuracyScores } from './accuracy-score.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const onTrackDiff: PlanSummaryDiff = {
  phase: 1, plan: 1, planned_files: ['a.ts'], actual_files: ['a.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [], deviations: [],
  scope_change: 'on_track',
};

const expandedDiff: PlanSummaryDiff = {
  phase: 2, plan: 1, planned_files: ['b.ts'], actual_files: ['b.ts', 'c.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['c.ts'], dropped_items: [], deviations: [],
  scope_change: 'expanded',
};

const contractedDiff: PlanSummaryDiff = {
  phase: 3, plan: 1, planned_files: ['d.ts', 'e.ts'], actual_files: ['d.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: ['e.ts'], deviations: [],
  scope_change: 'contracted',
};

const shiftedDiff: PlanSummaryDiff = {
  phase: 4, plan: 1, planned_files: ['f.ts'], actual_files: ['g.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['g.ts'], dropped_items: ['f.ts'], deviations: [],
  scope_change: 'shifted',
};

// Phase 5 has three plans: 2 on_track, 1 expanded => dominant = on_track
const phase5Plan1: PlanSummaryDiff = {
  phase: 5, plan: 1, planned_files: ['h.ts'], actual_files: ['h.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [], deviations: [],
  scope_change: 'on_track',
};

const phase5Plan2: PlanSummaryDiff = {
  phase: 5, plan: 2, planned_files: ['i.ts'], actual_files: ['i.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: [], dropped_items: [], deviations: [],
  scope_change: 'on_track',
};

const phase5Plan3: PlanSummaryDiff = {
  phase: 5, plan: 3, planned_files: ['j.ts'], actual_files: ['j.ts', 'k.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['k.ts'], dropped_items: [], deviations: [],
  scope_change: 'expanded',
};

// Phase 6: tie between expanded and shifted => shifted wins (higher priority)
const phase6Plan1: PlanSummaryDiff = {
  phase: 6, plan: 1, planned_files: ['l.ts'], actual_files: ['l.ts', 'm.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['m.ts'], dropped_items: [], deviations: [],
  scope_change: 'expanded',
};

const phase6Plan2: PlanSummaryDiff = {
  phase: 6, plan: 2, planned_files: ['n.ts'], actual_files: ['o.ts'],
  planned_artifacts: [], actual_accomplishments: [],
  emergent_work: ['o.ts'], dropped_items: ['n.ts'], deviations: [],
  scope_change: 'shifted',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderAccuracyScores', () => {
  // -------------------------------------------------------------------------
  // 1. on_track classification with green indicator
  // -------------------------------------------------------------------------
  it('returns HTML with on_track classification and scope-on-track class', () => {
    const html = renderAccuracyScores([onTrackDiff]);

    expect(html).toContain('scope-on-track');
    expect(html).toContain('on_track');
    expect(html).toContain('&#x2714;'); // checkmark indicator
  });

  // -------------------------------------------------------------------------
  // 2. expanded classification with orange indicator
  // -------------------------------------------------------------------------
  it('returns HTML with expanded classification and scope-expanded class', () => {
    const html = renderAccuracyScores([expandedDiff]);

    expect(html).toContain('scope-expanded');
    expect(html).toContain('expanded');
    expect(html).toContain('&#x25B2;'); // up triangle indicator
  });

  // -------------------------------------------------------------------------
  // 3. contracted classification with blue indicator
  // -------------------------------------------------------------------------
  it('returns HTML with contracted classification and scope-contracted class', () => {
    const html = renderAccuracyScores([contractedDiff]);

    expect(html).toContain('scope-contracted');
    expect(html).toContain('contracted');
    expect(html).toContain('&#x25BC;'); // down triangle indicator
  });

  // -------------------------------------------------------------------------
  // 4. shifted classification with yellow indicator
  // -------------------------------------------------------------------------
  it('returns HTML with shifted classification and scope-shifted class', () => {
    const html = renderAccuracyScores([shiftedDiff]);

    expect(html).toContain('scope-shifted');
    expect(html).toContain('shifted');
    expect(html).toContain('&#x21C4;'); // bidirectional arrow indicator
  });

  // -------------------------------------------------------------------------
  // 5. Groups multiple diffs and determines dominant scope (majority wins; on tie, worst wins)
  // -------------------------------------------------------------------------
  it('determines dominant scope as majority for multi-plan phase', () => {
    const html = renderAccuracyScores([phase5Plan1, phase5Plan2, phase5Plan3]);

    // 2 on_track vs 1 expanded => on_track wins
    expect(html).toContain('scope-on-track');
    expect(html).toContain('on_track');
  });

  it('on tie, prefers worst classification (shifted > expanded)', () => {
    const html = renderAccuracyScores([phase6Plan1, phase6Plan2]);

    // 1 expanded + 1 shifted => tie => shifted wins (higher priority)
    expect(html).toContain('scope-shifted');
    expect(html).toContain('shifted');
  });

  // -------------------------------------------------------------------------
  // 6. Shows phase number in each row
  // -------------------------------------------------------------------------
  it('shows phase number in each row', () => {
    const html = renderAccuracyScores([onTrackDiff]);

    expect(html).toContain('Phase 1');
  });

  // -------------------------------------------------------------------------
  // 7. Shows plan count per phase
  // -------------------------------------------------------------------------
  it('shows plan count per phase', () => {
    const html = renderAccuracyScores([phase5Plan1, phase5Plan2, phase5Plan3]);

    expect(html).toContain('3 plans');
  });

  it('uses singular "plan" when count is 1', () => {
    const html = renderAccuracyScores([onTrackDiff]);

    expect(html).toContain('1 plan');
    expect(html).not.toContain('1 plans');
  });

  // -------------------------------------------------------------------------
  // 8. Empty state
  // -------------------------------------------------------------------------
  it('returns empty state when given empty array', () => {
    const html = renderAccuracyScores([]);

    expect(html).toContain('No planning data available');
    expect(html).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // 9. Wrapper div with correct class
  // -------------------------------------------------------------------------
  it('renders a quality-card accuracy-scores wrapper', () => {
    const html = renderAccuracyScores([onTrackDiff]);

    expect(html).toContain('quality-card accuracy-scores');
  });

  // -------------------------------------------------------------------------
  // 10. Multiple phases render in ascending order
  // -------------------------------------------------------------------------
  it('renders multiple phases in ascending phase number order', () => {
    // Pass in reverse order to verify sorting
    const html = renderAccuracyScores([shiftedDiff, expandedDiff, onTrackDiff]);

    const phase1Pos = html.indexOf('Phase 1');
    const phase2Pos = html.indexOf('Phase 2');
    const phase4Pos = html.indexOf('Phase 4');

    expect(phase1Pos).toBeLessThan(phase2Pos);
    expect(phase2Pos).toBeLessThan(phase4Pos);
  });
});
