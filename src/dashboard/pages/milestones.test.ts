/**
 * Tests for the milestones page renderer.
 *
 * Covers:
 * - renderMilestonesPage returns an HTML string with timeline items
 * - Milestone stats (phases, plans, requirements) are displayed
 * - Accomplishments are listed as bullets
 * - Totals summary at the bottom
 * - Graceful handling when milestones data is missing
 */

import { describe, it, expect } from 'vitest';
import { renderMilestonesPage } from './milestones.js';
import type { DashboardData } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FULL_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  milestones: {
    milestones: [
      {
        version: 'v1.0',
        name: 'Core Skills',
        goal: 'Build the foundational skill system',
        shipped: '2025-10-15',
        stats: { requirements: 12, phases: 4, plans: 10 },
        accomplishments: [
          'Skill creation pipeline',
          'Validation framework',
          'Activation simulator',
        ],
      },
      {
        version: 'v1.1',
        name: 'Agent Composition',
        goal: 'Enable multi-skill agent creation',
        shipped: '2025-11-20',
        stats: { requirements: 8, phases: 3, plans: 7 },
        accomplishments: ['Agent builder', 'Co-activation detection'],
      },
      {
        version: 'v1.2',
        name: 'Teams & Orchestration',
        goal: 'Team workflows and task routing',
        shipped: '2025-12-10',
        stats: { phases: 5, plans: 12 },
      },
    ],
    totals: {
      milestones: 3,
      phases: 12,
      plans: 29,
    },
  },
};

const EMPTY_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
};

const EMPTY_MILESTONES_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  milestones: {
    milestones: [],
    totals: { milestones: 0, phases: 0, plans: 0 },
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderMilestonesPage', () => {
  it('returns a non-empty HTML string', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('includes the page title', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(html).toContain('Milestones');
    expect(html).toContain('page-title');
  });

  it('renders timeline items for each milestone', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(html).toContain('timeline');
    expect(html).toContain('v1.0');
    expect(html).toContain('v1.1');
    expect(html).toContain('v1.2');
  });

  it('renders milestone names', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(html).toContain('Core Skills');
    expect(html).toContain('Agent Composition');
    expect(html).toContain('Teams &amp; Orchestration');
  });

  it('renders milestone goals', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(html).toContain('Build the foundational skill system');
    expect(html).toContain('Enable multi-skill agent creation');
  });

  it('renders shipped dates', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(html).toContain('2025-10-15');
    expect(html).toContain('2025-11-20');
    expect(html).toContain('2025-12-10');
  });

  it('renders milestone stats', () => {
    const html = renderMilestonesPage(FULL_DATA);
    // v1.0: 4 phases, 10 plans, 12 requirements
    expect(html).toContain('4 phases');
    expect(html).toContain('10 plans');
    expect(html).toContain('12 reqs');
  });

  it('renders accomplishments as list items', () => {
    const html = renderMilestonesPage(FULL_DATA);
    expect(html).toContain('Skill creation pipeline');
    expect(html).toContain('Validation framework');
    expect(html).toContain('Activation simulator');
    expect(html).toContain('Agent builder');
    expect(html).toContain('Co-activation detection');
  });

  it('renders totals summary', () => {
    const html = renderMilestonesPage(FULL_DATA);
    // 3 milestones, 12 phases, 29 plans
    expect(html).toContain('3');
    expect(html).toContain('12');
    expect(html).toContain('29');
  });

  it('renders gracefully when milestones data is missing', () => {
    const html = renderMilestonesPage(EMPTY_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('Milestones');
    expect(html).toContain('No milestones');
  });

  it('renders gracefully when milestones array is empty', () => {
    const html = renderMilestonesPage(EMPTY_MILESTONES_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('Milestones');
  });

  it('handles milestones without accomplishments', () => {
    const html = renderMilestonesPage(FULL_DATA);
    // v1.2 has no accomplishments — should not crash
    expect(html).toContain('Teams &amp; Orchestration');
  });
});
