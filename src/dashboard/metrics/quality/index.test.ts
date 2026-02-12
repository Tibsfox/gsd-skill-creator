import { describe, it, expect } from 'vitest';
import {
  assembleQualitySection,
  renderAccuracyScores,
  renderEmergentRatio,
  renderDeviationSummary,
  renderAccuracyTrend,
} from './index.js';
import type { PlanSummaryDiff } from '../../../integration/monitoring/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleDiffs: PlanSummaryDiff[] = [
  {
    phase: 1, plan: 1, planned_files: ['a.ts'], actual_files: ['a.ts', 'b.ts'],
    planned_artifacts: [], actual_accomplishments: [],
    emergent_work: ['b.ts'], dropped_items: [],
    deviations: ['Used different library'],
    scope_change: 'expanded',
  },
  {
    phase: 2, plan: 1, planned_files: ['c.ts'], actual_files: ['c.ts'],
    planned_artifacts: [], actual_accomplishments: [],
    emergent_work: [], dropped_items: [], deviations: [],
    scope_change: 'on_track',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assembleQualitySection', () => {
  // -------------------------------------------------------------------------
  // 1. Contains accuracy scores content
  // -------------------------------------------------------------------------
  it('returns HTML containing accuracy scores content', () => {
    const html = assembleQualitySection(sampleDiffs);

    expect(html).toContain('quality-card accuracy-scores');
  });

  // -------------------------------------------------------------------------
  // 2. Contains emergent ratio content
  // -------------------------------------------------------------------------
  it('returns HTML containing emergent ratio content', () => {
    const html = assembleQualitySection(sampleDiffs);

    expect(html).toContain('quality-card emergent-ratio');
  });

  // -------------------------------------------------------------------------
  // 3. Contains deviation summary content
  // -------------------------------------------------------------------------
  it('returns HTML containing deviation summary content', () => {
    const html = assembleQualitySection(sampleDiffs);

    expect(html).toContain('quality-card deviation-summary');
  });

  // -------------------------------------------------------------------------
  // 4. Contains accuracy trend content
  // -------------------------------------------------------------------------
  it('returns HTML containing accuracy trend content', () => {
    const html = assembleQualitySection(sampleDiffs);

    expect(html).toContain('quality-card accuracy-trend');
  });

  // -------------------------------------------------------------------------
  // 5. All four sections wrapped in quality-section container
  // -------------------------------------------------------------------------
  it('wraps all content in a quality-section container', () => {
    const html = assembleQualitySection(sampleDiffs);

    expect(html).toMatch(/^<section class="quality-section">/);
    expect(html).toMatch(/<\/section>$/);
  });

  // -------------------------------------------------------------------------
  // 6. Handles empty diffs array
  // -------------------------------------------------------------------------
  it('handles empty diffs array with four empty-state cards', () => {
    const html = assembleQualitySection([]);

    expect(html).toContain('quality-section');
    // Each renderer returns an empty-state card
    const emptyCount = (html.match(/No planning data available/g) || []).length;
    expect(emptyCount).toBe(4);
  });

  // -------------------------------------------------------------------------
  // 7. Barrel re-exports all four renderers
  // -------------------------------------------------------------------------
  it('re-exports renderAccuracyScores from barrel', () => {
    expect(typeof renderAccuracyScores).toBe('function');
  });

  it('re-exports renderEmergentRatio from barrel', () => {
    expect(typeof renderEmergentRatio).toBe('function');
  });

  it('re-exports renderDeviationSummary from barrel', () => {
    expect(typeof renderDeviationSummary).toBe('function');
  });

  it('re-exports renderAccuracyTrend from barrel', () => {
    expect(typeof renderAccuracyTrend).toBe('function');
  });
});
