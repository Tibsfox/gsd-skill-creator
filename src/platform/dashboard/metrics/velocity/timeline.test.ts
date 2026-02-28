import { describe, it, expect } from 'vitest';
import { renderPhaseTimeline } from './timeline.js';
import type { PhaseStats } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const phase94: PhaseStats = {
  phase: 94,
  wallTimeMs: 600_000, // 10 minutes
  commitCount: 5,
  insertions: 200,
  deletions: 50,
  filesChanged: 8,
  plansExecuted: 2,
  commitTypes: { feat: 3, test: 2 },
  firstCommit: '2026-02-10T10:00:00Z',
  lastCommit: '2026-02-10T10:10:00Z',
};

const phase95: PhaseStats = {
  phase: 95,
  wallTimeMs: 1_200_000, // 20 minutes (longest)
  commitCount: 10,
  insertions: 400,
  deletions: 100,
  filesChanged: 15,
  plansExecuted: 3,
  commitTypes: { feat: 5, test: 3, fix: 2 },
  firstCommit: '2026-02-11T14:00:00Z',
  lastCommit: '2026-02-11T14:20:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderPhaseTimeline', () => {
  // -------------------------------------------------------------------------
  // 1. Renders horizontal bars for each phase
  // -------------------------------------------------------------------------
  it('renders horizontal bars for each phase with proportional widths', () => {
    const html = renderPhaseTimeline([phase94, phase95]);

    // Two bar rows
    expect(html).toContain('velocity-timeline-row');
    const rowMatches = html.match(/velocity-timeline-row/g);
    expect(rowMatches).toHaveLength(2);

    // Longest phase (95, 20min) gets 100%
    expect(html).toContain('width: 100%');

    // Shorter phase (94, 10min) gets 50%
    expect(html).toContain('width: 50%');
  });

  // -------------------------------------------------------------------------
  // 2. Color-codes bars by commit type distribution
  // -------------------------------------------------------------------------
  it('color-codes bars by commit type distribution', () => {
    const html = renderPhaseTimeline([phase95]);

    // Phase 95 has feat: 5, test: 3, fix: 2 (total 10)
    // Should have colored segments with background-color
    expect(html).toContain('background-color');

    // Should have segments for each commit type
    // feat (5/10 = 50%), test (3/10 = 30%), fix (2/10 = 20%)
    const bgMatches = html.match(/background-color/g);
    expect(bgMatches!.length).toBeGreaterThanOrEqual(3);
  });

  // -------------------------------------------------------------------------
  // 3. Shows phase number label on each bar
  // -------------------------------------------------------------------------
  it('shows phase number label on each bar', () => {
    const html = renderPhaseTimeline([phase94, phase95]);

    expect(html).toContain('Phase 94');
    expect(html).toContain('Phase 95');
  });

  // -------------------------------------------------------------------------
  // 4. Handles empty input
  // -------------------------------------------------------------------------
  it('handles empty input with informative message', () => {
    const html = renderPhaseTimeline([]);

    expect(html).toContain('No phase data available');
    expect(html).not.toContain('velocity-timeline-row');
  });

  // -------------------------------------------------------------------------
  // 5. Single phase renders at full width
  // -------------------------------------------------------------------------
  it('renders single phase at full width', () => {
    const html = renderPhaseTimeline([phase94]);

    expect(html).toContain('width: 100%');
    expect(html).toContain('Phase 94');
  });

  // -------------------------------------------------------------------------
  // 6. Returns HTML string, not DOM
  // -------------------------------------------------------------------------
  it('returns an HTML string starting with <', () => {
    const html = renderPhaseTimeline([phase94]);

    expect(typeof html).toBe('string');
    expect(html.trimStart().startsWith('<')).toBe(true);
  });
});
