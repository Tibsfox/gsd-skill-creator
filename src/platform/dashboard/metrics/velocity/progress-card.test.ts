import { describe, it, expect } from 'vitest';
import { renderProgressCard } from './progress-card.js';
import type { PhaseStats } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const statsPhase97: PhaseStats = {
  phase: 97,
  wallTimeMs: 600_000, // 10 minutes
  commitCount: 7,
  insertions: 250,
  deletions: 80,
  filesChanged: 12,
  plansExecuted: 2,
  commitTypes: { feat: 4, test: 3 },
  firstCommit: '2026-02-12T09:00:00Z',
  lastCommit: '2026-02-12T09:10:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderProgressCard', () => {
  // 1. Renders current phase number
  it('renders current phase number', () => {
    const html = renderProgressCard(97, statsPhase97, 3, 1);

    expect(html).toContain('Phase 97');
  });

  // 2. Shows plans complete/total
  it('shows plans complete/total', () => {
    const html = renderProgressCard(97, statsPhase97, 3, 1);

    expect(html).toContain('1');
    expect(html).toContain('3');
    // Should show them as a fraction
    expect(html).toMatch(/1\s*\/\s*3/);
  });

  // 3. Shows commits so far
  it('shows commits so far', () => {
    const html = renderProgressCard(97, statsPhase97, 3, 1);

    expect(html).toContain('7');
    expect(html).toContain('commit');
  });

  // 4. Shows LOC delta
  it('shows LOC delta', () => {
    const html = renderProgressCard(97, statsPhase97, 3, 1);

    expect(html).toContain('+250');
    expect(html).toContain('-80');
  });

  // 5. Handles null stats (phase not started)
  it('handles null stats (phase not started)', () => {
    const html = renderProgressCard(97, null, 3, 0);

    expect(html).toContain('Phase 97');
    expect(html).toContain('0');
    // Should still render the card structure
    expect(html).toContain('velocity-progress-card');
  });

  // 6. Shows progress bar
  it('shows progress bar with correct percentage', () => {
    const html = renderProgressCard(97, statsPhase97, 3, 2);

    // 2/3 = 66.67% -> Math.round = 67%
    expect(html).toContain('progress-bar');
    expect(html).toContain('progress-fill');
    expect(html).toContain('67%');
  });
});
