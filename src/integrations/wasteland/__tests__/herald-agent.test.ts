/**
 * Tests for Herald Agent Prototype.
 *
 * Covers:
 * - routeToTiers: severity → tier routing
 * - filterBySeverity: threshold filtering
 * - filterByAge: time-based filtering
 * - groupByType: event grouping
 * - countBySeverity: severity counts
 * - renderGlance/renderScan/renderRead: disclosure tiers
 * - runHerald: full agent run
 */

import { describe, it, expect } from 'vitest';
import type { ClassifiedEvent, PatchManifest, ImpactManifest } from '../../upstream/types.js';
import {
  routeToTiers,
  filterBySeverity,
  filterByAge,
  groupByType,
  countBySeverity,
  renderGlance,
  renderScan,
  renderRead,
  runHerald,
  DEFAULT_HERALD_CONFIG,
} from '../herald-agent.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeEvent(overrides: Partial<ClassifiedEvent> = {}): ClassifiedEvent {
  return {
    id: 'evt-001',
    channel: 'api-changelog',
    timestamp: new Date().toISOString(),
    content_hash_before: 'abc',
    content_hash_after: 'def',
    diff_summary: 'Updated endpoint response format',
    raw_content: '',
    change_type: 'enhancement',
    severity: 'P2',
    domains: ['api'],
    auto_patchable: false,
    summary: 'Response format update',
    confidence: 0.85,
    ...overrides,
  };
}

function makePatch(overrides: Partial<PatchManifest> = {}): PatchManifest {
  return {
    patch_id: 'patch-001',
    change_id: 'evt-001',
    target_skill: 'api-client',
    patch_type: 'version_bump',
    severity: 'P2',
    auto_approved: true,
    diff: [{ path: 'src/api.ts', before: 'v1', after: 'v2' }],
    backup_path: '/tmp/backup',
    validation: { tests_passed: true, lint_passed: true, size_within_bounds: true },
    upstream_reference: { channel: 'api-changelog', change_id: 'evt-001' },
    ...overrides,
  };
}

function makeImpact(overrides: Partial<ImpactManifest> = {}): ImpactManifest {
  return {
    change_id: 'evt-001',
    classification: makeEvent(),
    affected_components: [
      {
        component: 'src/services/api.ts',
        impact: 'direct',
        status: 'active',
        blast_radius: 'high',
        action: 'manual review required',
        patchable: false,
      },
    ],
    total_blast_radius: 1,
    ...overrides,
  };
}

// ============================================================================
// routeToTiers
// ============================================================================

describe('routeToTiers', () => {
  it('routes P0 to all tiers', () => {
    expect(routeToTiers('P0')).toEqual(['flash', 'session', 'weekly', 'monthly']);
  });

  it('routes P1 to all tiers', () => {
    expect(routeToTiers('P1')).toEqual(['flash', 'session', 'weekly', 'monthly']);
  });

  it('routes P2 to session, weekly, monthly', () => {
    expect(routeToTiers('P2')).toEqual(['session', 'weekly', 'monthly']);
  });

  it('routes P3 to weekly, monthly only', () => {
    expect(routeToTiers('P3')).toEqual(['weekly', 'monthly']);
  });
});

// ============================================================================
// filterBySeverity
// ============================================================================

describe('filterBySeverity', () => {
  const events = [
    makeEvent({ id: '1', severity: 'P0' }),
    makeEvent({ id: '2', severity: 'P1' }),
    makeEvent({ id: '3', severity: 'P2' }),
    makeEvent({ id: '4', severity: 'P3' }),
  ];

  it('P0 threshold returns only P0', () => {
    expect(filterBySeverity(events, 'P0')).toHaveLength(1);
  });

  it('P1 threshold returns P0 and P1', () => {
    expect(filterBySeverity(events, 'P1')).toHaveLength(2);
  });

  it('P2 threshold returns P0, P1, P2', () => {
    expect(filterBySeverity(events, 'P2')).toHaveLength(3);
  });

  it('P3 threshold returns all', () => {
    expect(filterBySeverity(events, 'P3')).toHaveLength(4);
  });
});

// ============================================================================
// filterByAge
// ============================================================================

describe('filterByAge', () => {
  it('includes recent events', () => {
    const now = new Date('2026-03-27T00:00:00Z');
    const events = [
      makeEvent({ timestamp: '2026-03-26T00:00:00Z' }),
    ];
    expect(filterByAge(events, 7, now)).toHaveLength(1);
  });

  it('excludes old events', () => {
    const now = new Date('2026-03-27T00:00:00Z');
    const events = [
      makeEvent({ timestamp: '2026-02-01T00:00:00Z' }),
    ];
    expect(filterByAge(events, 7, now)).toHaveLength(0);
  });

  it('handles boundary exactly at cutoff', () => {
    const now = new Date('2026-03-27T00:00:00Z');
    const events = [
      makeEvent({ timestamp: '2026-03-20T00:00:00Z' }),
    ];
    expect(filterByAge(events, 7, now)).toHaveLength(1);
  });
});

// ============================================================================
// groupByType
// ============================================================================

describe('groupByType', () => {
  it('groups events by change_type', () => {
    const events = [
      makeEvent({ id: '1', change_type: 'breaking' }),
      makeEvent({ id: '2', change_type: 'enhancement' }),
      makeEvent({ id: '3', change_type: 'breaking' }),
    ];
    const groups = groupByType(events);
    expect(groups.get('breaking')).toHaveLength(2);
    expect(groups.get('enhancement')).toHaveLength(1);
  });

  it('returns empty map for no events', () => {
    expect(groupByType([])).toEqual(new Map());
  });
});

// ============================================================================
// countBySeverity
// ============================================================================

describe('countBySeverity', () => {
  it('counts events by severity level', () => {
    const events = [
      makeEvent({ severity: 'P0' }),
      makeEvent({ severity: 'P2' }),
      makeEvent({ severity: 'P2' }),
    ];
    const counts = countBySeverity(events);
    expect(counts).toEqual({ P0: 1, P1: 0, P2: 2, P3: 0 });
  });

  it('returns zeros for empty array', () => {
    expect(countBySeverity([])).toEqual({ P0: 0, P1: 0, P2: 0, P3: 0 });
  });
});

// ============================================================================
// renderGlance
// ============================================================================

describe('renderGlance', () => {
  it('renders one-line summary', () => {
    const events = [
      makeEvent({ severity: 'P0' }),
      makeEvent({ severity: 'P2' }),
    ];
    const result = renderGlance('session', events, [], []);
    expect(result).toContain('[session]');
    expect(result).toContain('2 change(s)');
    expect(result).toContain('1 P0');
    expect(result).toContain('1 P2');
  });

  it('includes patch and pending counts', () => {
    const events = [makeEvent()];
    const result = renderGlance('session', events, [makePatch()], [makeImpact()]);
    expect(result).toContain('1 patched');
    expect(result).toContain('1 pending');
  });

  it('handles no changes', () => {
    expect(renderGlance('weekly', [], [], [])).toContain('No upstream changes');
  });
});

// ============================================================================
// renderScan
// ============================================================================

describe('renderScan', () => {
  it('renders grouped overview', () => {
    const events = [
      makeEvent({ id: '1', change_type: 'breaking', severity: 'P0', summary: 'API removed' }),
      makeEvent({ id: '2', change_type: 'enhancement', severity: 'P2', summary: 'New endpoint' }),
    ];
    const result = renderScan('session', events, [makePatch()], []);
    expect(result).toContain('Session Briefing');
    expect(result).toContain('2 change(s)');
    expect(result).toContain('breaking (1)');
    expect(result).toContain('enhancement (1)');
    expect(result).toContain('[P0] API removed');
    expect(result).toContain('[P2] New endpoint');
  });

  it('handles empty events', () => {
    expect(renderScan('weekly', [], [], [])).toContain('No upstream changes');
  });
});

// ============================================================================
// renderRead
// ============================================================================

describe('renderRead', () => {
  it('renders full detail', () => {
    const events = [
      makeEvent({ severity: 'P0', change_type: 'breaking', summary: 'Auth flow changed' }),
    ];
    const result = renderRead('flash', events, [makePatch()], [makeImpact()], false);
    expect(result).toContain('Flash Briefing');
    expect(result).toContain('## Changes');
    expect(result).toContain('[P0] breaking: Auth flow changed');
    expect(result).toContain('## Patches Applied');
    expect(result).toContain('## Pending Decisions');
  });

  it('includes diffs when configured', () => {
    const patches = [makePatch()];
    const result = renderRead('session', [makeEvent()], patches, [], true);
    expect(result).toContain('File: src/api.ts');
  });

  it('omits diffs when not configured', () => {
    const patches = [makePatch()];
    const result = renderRead('session', [makeEvent()], patches, [], false);
    expect(result).not.toContain('File: src/api.ts');
  });

  it('shows pending decision components', () => {
    const impact = makeImpact();
    const result = renderRead('session', [makeEvent()], [], [impact], false);
    expect(result).toContain('src/services/api.ts');
    expect(result).toContain('manual review required');
  });
});

// ============================================================================
// runHerald
// ============================================================================

describe('runHerald', () => {
  it('generates briefings at all tiers and disclosure levels', () => {
    const input = {
      events: [makeEvent({ severity: 'P0' })],
      patches: [makePatch()],
      impacts: [makeImpact()],
    };
    const result = runHerald(input);

    // P0 routes to flash, session, weekly, monthly
    // Each tier gets 3 disclosure levels (glance, scan, read)
    expect(result.briefings.length).toBe(12); // 4 tiers × 3 levels
    expect(result.flashAlerts).toHaveLength(1);
    expect(result.totalEvents).toBe(1);
    expect(result.totalPatches).toBe(1);
    expect(result.totalPending).toBe(1);
  });

  it('generates flash alerts for events at or above threshold', () => {
    const input = {
      events: [
        makeEvent({ id: '1', severity: 'P0' }),
        makeEvent({ id: '2', severity: 'P1' }),
        makeEvent({ id: '3', severity: 'P3' }),
      ],
      patches: [],
      impacts: [],
    };
    const result = runHerald(input, { ...DEFAULT_HERALD_CONFIG, flashThreshold: 'P1' });
    expect(result.flashAlerts).toHaveLength(2); // P0 + P1
  });

  it('filters out old events', () => {
    const input = {
      events: [
        makeEvent({ timestamp: '2020-01-01T00:00:00Z' }), // very old
      ],
      patches: [],
      impacts: [],
    };
    const result = runHerald(input, { ...DEFAULT_HERALD_CONFIG, maxEventAgeDays: 7 });
    expect(result.totalEvents).toBe(0);
    expect(result.briefings).toHaveLength(0);
  });

  it('handles empty input', () => {
    const result = runHerald({ events: [], patches: [], impacts: [] });
    expect(result.briefings).toHaveLength(0);
    expect(result.flashAlerts).toHaveLength(0);
    expect(result.totalEvents).toBe(0);
  });

  it('includes correct counts in rendered briefings', () => {
    const input = {
      events: [makeEvent({ severity: 'P2' })],
      patches: [makePatch()],
      impacts: [makeImpact()],
    };
    const result = runHerald(input);

    // P2 routes to session, weekly, monthly — 3 tiers × 3 levels = 9
    expect(result.briefings).toHaveLength(9);

    const sessionGlance = result.briefings.find(
      b => b.tier === 'session' && b.level === 'glance',
    );
    expect(sessionGlance).toBeDefined();
    expect(sessionGlance!.alertCount).toBe(1);
    expect(sessionGlance!.patchCount).toBe(1);
    expect(sessionGlance!.pendingCount).toBe(1);
  });

  it('flash alerts have correct structure', () => {
    const input = {
      events: [makeEvent({ id: 'test-evt', severity: 'P0', summary: 'Critical' })],
      patches: [],
      impacts: [],
    };
    const result = runHerald(input);
    expect(result.flashAlerts[0].id).toBe('flash-test-evt');
    expect(result.flashAlerts[0].severity).toBe('P0');
    expect(result.flashAlerts[0].title).toContain('Critical');
  });
});
