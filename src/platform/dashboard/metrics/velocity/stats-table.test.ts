import { describe, it, expect } from 'vitest';
import { renderStatsTable } from './stats-table.js';
import type { PhaseStats } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const phase94: PhaseStats = {
  phase: 94,
  wallTimeMs: 300_000, // 5 minutes
  commitCount: 5,
  insertions: 150,
  deletions: 42,
  filesChanged: 8,
  plansExecuted: 2,
  commitTypes: { feat: 3, test: 2 },
  firstCommit: '2026-02-10T10:00:00Z',
  lastCommit: '2026-02-10T10:05:00Z',
};

const phase95: PhaseStats = {
  phase: 95,
  wallTimeMs: 3_723_000, // 1h 2m 3s
  commitCount: 10,
  insertions: 400,
  deletions: 100,
  filesChanged: 15,
  plansExecuted: 3,
  commitTypes: { feat: 5, test: 3, fix: 2 },
  firstCommit: '2026-02-11T14:00:00Z',
  lastCommit: '2026-02-11T15:02:03Z',
};

const phase97: PhaseStats = {
  phase: 97,
  wallTimeMs: 120_000, // 2 minutes
  commitCount: 3,
  insertions: 80,
  deletions: 10,
  filesChanged: 4,
  plansExecuted: 1,
  commitTypes: { feat: 2, test: 1 },
  firstCommit: '2026-02-12T09:00:00Z',
  lastCommit: '2026-02-12T09:02:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderStatsTable', () => {
  // -------------------------------------------------------------------------
  // 1. Renders table with correct columns
  // -------------------------------------------------------------------------
  it('renders table with correct header columns', () => {
    const html = renderStatsTable([phase94]);

    expect(html).toContain('<table');
    expect(html).toContain('Phase');
    expect(html).toContain('Wall Time');
    expect(html).toContain('Commits');
    expect(html).toContain('LOC');
    expect(html).toContain('Files');
    expect(html).toContain('Plans');
  });

  // -------------------------------------------------------------------------
  // 2. Formats wall time in human-readable form
  // -------------------------------------------------------------------------
  it('formats wall time in human-readable form', () => {
    const html = renderStatsTable([phase94, phase95]);

    // phase94: 300_000ms = 5 minutes -> "5m"
    expect(html).toContain('5m');

    // phase95: 3_723_000ms = 1h 2m 3s -> "1h 2m"
    expect(html).toContain('1h 2m');
  });

  // -------------------------------------------------------------------------
  // 3. Shows LOC delta as +insertions / -deletions
  // -------------------------------------------------------------------------
  it('shows LOC delta as +insertions / -deletions', () => {
    const html = renderStatsTable([phase94]);

    // phase94: insertions=150, deletions=42
    expect(html).toContain('+150');
    expect(html).toContain('-42');
  });

  // -------------------------------------------------------------------------
  // 4. Handles empty input
  // -------------------------------------------------------------------------
  it('handles empty input with informative message', () => {
    const html = renderStatsTable([]);

    expect(html).toContain('No phase data available');
    expect(html).not.toContain('<table');
  });

  // -------------------------------------------------------------------------
  // 5. Sorts phases by phase number ascending
  // -------------------------------------------------------------------------
  it('sorts phases by phase number ascending', () => {
    // Provide out of order: 97, 94, 95
    const html = renderStatsTable([phase97, phase94, phase95]);

    // Find positions of phase numbers in the output
    const pos94 = html.indexOf('>94<');
    const pos95 = html.indexOf('>95<');
    const pos97 = html.indexOf('>97<');

    expect(pos94).toBeLessThan(pos95);
    expect(pos95).toBeLessThan(pos97);
  });
});
