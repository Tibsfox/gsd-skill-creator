/**
 * Tests for the state page renderer.
 *
 * Covers:
 * - renderStatePage returns an HTML string with current position
 * - Metrics table is rendered
 * - Blockers are highlighted when present
 * - No-blockers state shows green indicator
 * - Session continuity info is displayed
 * - Graceful handling when state data is missing
 */

import { describe, it, expect } from 'vitest';
import { renderStatePage } from './state.js';
import type { DashboardData } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FULL_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  state: {
    milestone: 'v1.12 GSD Planning Docs Dashboard',
    phase: '90 (Artifact Pages) — active',
    status: 'Executing phase 90, plan 01',
    progress: '2/6 phases complete | 10/30 requirements delivered',
    focus: 'Building individual artifact pages with cross-navigation',
    blockers: [],
    metrics: {
      'Plans completed': '8',
      'Plans total': '30',
      'Commits this milestone': '16',
      'LOC added': '4500',
    },
    nextAction: 'Execute 90-02 plan for structured data',
  },
};

const DATA_WITH_BLOCKERS: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
  state: {
    milestone: 'v1.12',
    phase: '90',
    status: 'Blocked',
    progress: '2/6 phases complete',
    focus: 'Artifact pages',
    blockers: [
      'Missing parser for MILESTONES.md format',
      'CI pipeline broken on main branch',
    ],
    metrics: {},
    nextAction: 'Fix blockers before continuing',
  },
};

const EMPTY_DATA: DashboardData = {
  generatedAt: '2026-02-12T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderStatePage', () => {
  it('returns a non-empty HTML string', () => {
    const html = renderStatePage(FULL_DATA);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('includes the page title', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('State');
    expect(html).toContain('page-title');
  });

  it('renders current position card with milestone', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('v1.12 GSD Planning Docs Dashboard');
  });

  it('renders current phase', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('90 (Artifact Pages)');
  });

  it('renders current status', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('Executing phase 90, plan 01');
  });

  it('renders progress info', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('2/6 phases complete');
    expect(html).toContain('10/30 requirements delivered');
  });

  it('renders focus section', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('Building individual artifact pages with cross-navigation');
  });

  it('renders metrics table', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('Plans completed');
    expect(html).toContain('8');
    expect(html).toContain('Commits this milestone');
    expect(html).toContain('16');
    expect(html).toContain('LOC added');
    expect(html).toContain('4500');
  });

  it('shows green no-blockers indicator when blockers are empty', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('No blockers');
    // Should use green styling
    expect(html).toMatch(/green|badge-active/i);
  });

  it('highlights blockers when present', () => {
    const html = renderStatePage(DATA_WITH_BLOCKERS);
    expect(html).toContain('Missing parser for MILESTONES.md format');
    expect(html).toContain('CI pipeline broken on main branch');
    // Should use red/warning styling
    expect(html).toMatch(/red|badge-blocked|blocker/i);
  });

  it('renders session continuity with next action', () => {
    const html = renderStatePage(FULL_DATA);
    expect(html).toContain('Execute 90-02 plan for structured data');
  });

  it('renders gracefully when state data is missing', () => {
    const html = renderStatePage(EMPTY_DATA);
    expect(typeof html).toBe('string');
    expect(html).toContain('State');
    expect(html).toContain('No state');
  });

  it('renders position card with partial fields (no milestone, no progress)', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      state: {
        milestone: '',
        phase: '90',
        status: 'Active',
        progress: '',
        focus: '',
        blockers: [],
        metrics: {},
        nextAction: '',
      },
    };
    const html = renderStatePage(data);
    // Should render phase and status but not milestone or progress
    expect(html).toContain('Phase');
    expect(html).toContain('Status');
    expect(html).not.toContain('Milestone');
    expect(html).not.toContain('Progress');
    // No focus section when focus is empty
    expect(html).not.toContain('Focus');
    // No next action section when empty
    expect(html).not.toContain('Next action');
    // No metrics table when empty
    expect(html).not.toContain('<table>');
  });

  it('renders position card with only milestone (no phase, no status)', () => {
    const data: DashboardData = {
      generatedAt: '2026-02-12T10:00:00Z',
      state: {
        milestone: 'v2.0',
        phase: '',
        status: '',
        progress: '',
        focus: '',
        blockers: [],
        metrics: {},
        nextAction: '',
      },
    };
    const html = renderStatePage(data);
    expect(html).toContain('Milestone');
    expect(html).toContain('v2.0');
    // Should NOT contain Phase or Status labels
    const phaseMatches = html.match(/<strong>Phase:<\/strong>/g);
    expect(phaseMatches).toBeNull();
    const statusMatches = html.match(/<strong>Status:<\/strong>/g);
    expect(statusMatches).toBeNull();
  });
});
