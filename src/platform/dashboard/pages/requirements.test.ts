/**
 * Tests for the requirements page renderer.
 *
 * Covers:
 * - renderRequirementsPage returns an HTML string
 * - Requirement groups are rendered with headings
 * - REQ-IDs are displayed as badges
 * - Total requirement count appears in the header
 * - Graceful handling when requirements data is missing
 */

import { describe, it, expect } from 'vitest';
import { renderRequirementsPage } from './requirements.js';
import type { DashboardData } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FULL_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  requirements: {
    goal: 'Build a comprehensive skill management system',
    groups: [
      {
        name: 'Core Features',
        requirements: [
          { id: 'REQ-01', text: 'Skill creation from templates' },
          { id: 'REQ-02', text: 'Skill validation against schema' },
          { id: 'REQ-03', text: 'Skill activation simulation' },
        ],
      },
      {
        name: 'Integration',
        requirements: [
          { id: 'REQ-04', text: 'GSD orchestrator routing' },
          { id: 'REQ-05', text: 'Claude Code compatibility' },
        ],
      },
    ],
  },
};

const EMPTY_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
};

const EMPTY_GROUPS_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  requirements: {
    goal: 'Some goal',
    groups: [],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderRequirementsPage', () => {
  it('returns a non-empty HTML string', () => {
    const html = renderRequirementsPage(FULL_DATA);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('includes the page title', () => {
    const html = renderRequirementsPage(FULL_DATA);
    expect(html).toContain('Requirements');
    expect(html).toContain('page-title');
  });

  it('renders requirement group headings', () => {
    const html = renderRequirementsPage(FULL_DATA);
    expect(html).toContain('Core Features');
    expect(html).toContain('Integration');
  });

  it('includes REQ-IDs as badges', () => {
    const html = renderRequirementsPage(FULL_DATA);
    expect(html).toContain('REQ-01');
    expect(html).toContain('REQ-02');
    expect(html).toContain('REQ-03');
    expect(html).toContain('REQ-04');
    expect(html).toContain('REQ-05');
    // Each REQ-ID should be in a badge
    expect(html).toMatch(/badge[^>]*>REQ-01/);
  });

  it('includes requirement text', () => {
    const html = renderRequirementsPage(FULL_DATA);
    expect(html).toContain('Skill creation from templates');
    expect(html).toContain('GSD orchestrator routing');
  });

  it('displays the total requirement count', () => {
    const html = renderRequirementsPage(FULL_DATA);
    // 5 total requirements
    expect(html).toContain('5');
  });

  it('displays the goal section', () => {
    const html = renderRequirementsPage(FULL_DATA);
    expect(html).toContain('Build a comprehensive skill management system');
  });

  it('renders gracefully when requirements data is missing', () => {
    const html = renderRequirementsPage(EMPTY_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('Requirements');
    // Should show some empty-state message, not crash
    expect(html).toContain('No requirements');
  });

  it('renders gracefully when groups are empty', () => {
    const html = renderRequirementsPage(EMPTY_GROUPS_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('Requirements');
  });

  it('renders requirements without a goal', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      requirements: {
        goal: '',
        groups: [
          {
            name: 'Features',
            requirements: [
              { id: 'REQ-10', text: 'Some feature' },
            ],
          },
        ],
      },
    };
    const html = renderRequirementsPage(data);
    // Should render requirements but no goal card
    expect(html).toContain('REQ-10');
    expect(html).not.toContain('card-title">Goal');
  });

  it('renders empty groups without goal (no goal card)', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      requirements: {
        goal: '',
        groups: [],
      },
    };
    const html = renderRequirementsPage(data);
    expect(html).toContain('No requirements defined yet');
    // No goal card when goal is empty
    expect(html).not.toContain('card-body">Some goal');
  });
});
