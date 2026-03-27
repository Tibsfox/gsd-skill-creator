/**
 * Tests for the roadmap page renderer.
 *
 * Covers:
 * - renderRoadmapPage returns an HTML string with phase cards
 * - Status badges are color-coded via CSS classes
 * - Progress summary shows X of Y complete
 * - Phase details (goal, requirements, deliverables) are rendered
 * - Graceful handling when roadmap data is missing
 */

import { describe, it, expect } from 'vitest';
import { renderRoadmapPage } from './roadmap.js';
import type { DashboardData } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FULL_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  roadmap: {
    totalPhases: 4,
    phases: [
      {
        number: 88,
        name: 'Generator Core',
        status: 'complete',
        goal: 'Build the dashboard generator pipeline',
        requirements: ['REQ-01', 'REQ-02', 'REQ-03'],
        deliverables: ['parser.ts', 'renderer.ts', 'generator.ts'],
      },
      {
        number: 89,
        name: 'Styles & Theme',
        status: 'complete',
        goal: 'Implement dark theme CSS',
        requirements: ['REQ-04'],
        deliverables: ['styles.ts'],
      },
      {
        number: 90,
        name: 'Artifact Pages',
        status: 'active',
        goal: 'Add individual pages for each artifact',
        requirements: ['REQ-05', 'REQ-06'],
        deliverables: ['requirements.ts', 'roadmap.ts', 'milestones.ts', 'state.ts'],
      },
      {
        number: 91,
        name: 'Structured Data',
        status: 'pending',
        goal: 'Add JSON-LD to all pages',
        requirements: ['REQ-07'],
        deliverables: ['jsonld.ts'],
      },
    ],
  },
};

const EMPTY_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
};

const EMPTY_PHASES_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  roadmap: {
    totalPhases: 0,
    phases: [],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderRoadmapPage', () => {
  it('returns a non-empty HTML string', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('includes the page title', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(html).toContain('Roadmap');
    expect(html).toContain('page-title');
  });

  it('renders phase cards with names', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(html).toContain('Generator Core');
    expect(html).toContain('Styles &amp; Theme');
    expect(html).toContain('Artifact Pages');
    expect(html).toContain('Structured Data');
  });

  it('renders phase numbers', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(html).toContain('88');
    expect(html).toContain('89');
    expect(html).toContain('90');
    expect(html).toContain('91');
  });

  it('renders status badges with appropriate CSS classes', () => {
    const html = renderRoadmapPage(FULL_DATA);
    // Complete phases should use badge-complete
    expect(html).toContain('badge-complete');
    // Active phase should use badge-active
    expect(html).toContain('badge-active');
    // Pending phase should use badge-pending
    expect(html).toContain('badge-pending');
  });

  it('shows progress summary (X of Y complete)', () => {
    const html = renderRoadmapPage(FULL_DATA);
    // 2 of 4 phases are complete
    expect(html).toContain('2');
    expect(html).toContain('4');
    // Should have a progress bar
    expect(html).toContain('progress-bar');
    expect(html).toContain('progress-fill');
  });

  it('renders phase goals', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(html).toContain('Build the dashboard generator pipeline');
    expect(html).toContain('Implement dark theme CSS');
  });

  it('renders phase requirements', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(html).toContain('REQ-01');
    expect(html).toContain('REQ-05');
  });

  it('renders phase deliverables', () => {
    const html = renderRoadmapPage(FULL_DATA);
    expect(html).toContain('parser.ts');
    expect(html).toContain('renderer.ts');
    expect(html).toContain('styles.ts');
  });

  it('renders gracefully when roadmap data is missing', () => {
    const html = renderRoadmapPage(EMPTY_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('Roadmap');
    expect(html).toContain('No phases');
  });

  it('renders gracefully when phases array is empty', () => {
    const html = renderRoadmapPage(EMPTY_PHASES_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('Roadmap');
  });

  it('renders blocked status badge', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Blocked Phase',
            status: 'blocked',
            goal: 'Blocked goal',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('badge-blocked');
  });

  it('renders phase without goal, requirements, or deliverables', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Minimal Phase',
            status: 'pending',
            goal: '',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('Minimal Phase');
    expect(html).not.toContain('<strong>Goal:</strong>');
    expect(html).not.toContain('<strong>Requirements:</strong>');
    expect(html).not.toContain('<strong>Deliverables:</strong>');
  });

  it('renders shipped status as badge-complete', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Shipped Phase',
            status: 'shipped',
            goal: 'Already shipped',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('badge-complete');
  });

  it('renders done status as badge-complete', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Done Phase',
            status: 'done',
            goal: 'Completed',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('badge-complete');
  });

  it('renders executing status as badge-active', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Executing Phase',
            status: 'executing',
            goal: 'In progress',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('badge-active');
  });

  it('renders empty status string as pending badge', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Unknown Phase',
            status: '',
            goal: '',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('badge-pending');
    expect(html).toContain('pending');
  });

  it('renders 100% progress bar with success class', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      roadmap: {
        totalPhases: 1,
        phases: [
          {
            number: 1,
            name: 'Done Phase',
            status: 'complete',
            goal: 'All done',
            requirements: [],
            deliverables: [],
          },
        ],
      },
    };
    const html = renderRoadmapPage(data);
    expect(html).toContain('progress-fill success');
    expect(html).toContain('width: 100%');
  });
});
