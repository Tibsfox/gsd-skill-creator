/**
 * Tests for Human-Readable Dashboard — Layer 3 operator oversight.
 *
 * Covers:
 * - assembleDashboard: filtering, sorting, assembly
 * - teamToDashboardEntry: score → entry conversion
 * - renderDashboard: full text rendering
 * - approveRecommendation / vetoRecommendation: action results
 */

import { describe, it, expect } from 'vitest';
import {
  assembleDashboard,
  teamToDashboardEntry,
  renderDashboard,
  approveRecommendation,
  vetoRecommendation,
} from '../human-readable-dashboard.js';
import type {
  TeamDashboardEntry,
  Recommendation,
  FailureSignature,
  MetaLearningInsights,
  TownGraph,
  TeamScore,
} from '../types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeTeamEntry(overrides: Partial<TeamDashboardEntry> = {}): TeamDashboardEntry {
  return {
    teamId: 'team-alpha',
    members: ['agent-1', 'agent-2'],
    score: 0.85,
    tasksCompleted: 10,
    avgSuccessRate: 0.9,
    status: 'active',
    ...overrides,
  };
}

function makeRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'rec-1',
    type: 'team-reassignment',
    confidence: 0.8,
    reasoning: 'Agent-1 underperforming on build tasks',
    evidenceChain: ['metric-1', 'metric-2'],
    timestamp: '2026-03-27T00:00:00Z',
    ...overrides,
  };
}

function makeFailureSig(overrides: Partial<FailureSignature> = {}): FailureSignature {
  return {
    id: 'sig-1',
    failureClass: 'timeout',
    taskType: 'build',
    conditions: {},
    preventativeAction: 'Add timeout prediction gate',
    occurrences: 5,
    lastSeen: '2026-03-27T00:00:00Z',
    ...overrides,
  };
}

function makeMetaLearning(): MetaLearningInsights {
  return {
    mostImpactfulType: 'team-reassignment',
    leastReliableType: 'gate-suggestion',
    pendingEvaluationCount: 3,
    expiredCount: 1,
    typeSuccessRates: { 'team-reassignment': 0.8, 'gate-suggestion': 0.4 },
    recommendations: ['Focus on build pipeline reliability'],
  };
}

function makeTopology(): TownGraph {
  return {
    nodes: [
      { townId: 'hub', agentCount: 5, throughput: 100, betweennessCentrality: 0.9 },
      { townId: 'leaf', agentCount: 2, throughput: 20, betweennessCentrality: 0.1 },
    ],
    edges: [
      { source: 'hub', target: 'leaf', handoffCount: 15, avgLatencyMs: 200 },
    ],
  };
}

// ============================================================================
// assembleDashboard
// ============================================================================

describe('assembleDashboard', () => {
  it('filters recommendations below 0.7 confidence', () => {
    const recs = [
      makeRecommendation({ confidence: 0.8 }),
      makeRecommendation({ id: 'rec-low', confidence: 0.5 }),
    ];
    const view = assembleDashboard([makeTeamEntry()], recs, [], makeMetaLearning(), makeTopology());
    expect(view.pendingRecommendations).toHaveLength(1);
  });

  it('sorts failure patterns by occurrences descending', () => {
    const sigs = [
      makeFailureSig({ id: 'a', occurrences: 2 }),
      makeFailureSig({ id: 'b', occurrences: 10 }),
      makeFailureSig({ id: 'c', occurrences: 5 }),
    ];
    const view = assembleDashboard([], [], sigs, makeMetaLearning(), makeTopology());
    expect(view.failurePatterns[0].occurrences).toBe(10);
    expect(view.failurePatterns[2].occurrences).toBe(2);
  });

  it('includes lastUpdated timestamp', () => {
    const view = assembleDashboard([], [], [], makeMetaLearning(), makeTopology());
    expect(view.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

// ============================================================================
// teamToDashboardEntry
// ============================================================================

describe('teamToDashboardEntry', () => {
  it('converts TeamScore to dashboard entry', () => {
    const score: TeamScore = {
      teamId: 'team-beta',
      members: ['a', 'b', 'c'],
      overallScore: 0.75,
      confidence: 0.9,
    };
    const entry = teamToDashboardEntry(score, 20, 0.85);
    expect(entry.teamId).toBe('team-beta');
    expect(entry.members).toHaveLength(3);
    expect(entry.score).toBe(0.75);
    expect(entry.tasksCompleted).toBe(20);
    expect(entry.avgSuccessRate).toBe(0.85);
    expect(entry.status).toBe('active');
  });

  it('sets status to pending when confidence is low', () => {
    const score: TeamScore = {
      teamId: 'team-new',
      members: ['x'],
      overallScore: 0.5,
      confidence: 0.3,
    };
    const entry = teamToDashboardEntry(score);
    expect(entry.status).toBe('pending');
  });
});

// ============================================================================
// renderDashboard
// ============================================================================

describe('renderDashboard', () => {
  it('renders all sections', () => {
    const view = assembleDashboard(
      [makeTeamEntry()],
      [makeRecommendation()],
      [makeFailureSig()],
      makeMetaLearning(),
      makeTopology(),
    );
    const output = renderDashboard(view);

    expect(output).toContain('WASTELAND FEDERATION DASHBOARD');
    expect(output).toContain('ACTIVE TEAMS');
    expect(output).toContain('team-alpha');
    expect(output).toContain('PENDING RECOMMENDATIONS');
    expect(output).toContain('team-reassignment');
    expect(output).toContain('FAILURE PATTERNS');
    expect(output).toContain('timeout');
    expect(output).toContain('META-LEARNING INSIGHTS');
    expect(output).toContain('TOWN TOPOLOGY');
    expect(output).toContain('hub');
  });

  it('handles empty dashboard gracefully', () => {
    const view = assembleDashboard([], [], [], makeMetaLearning(), { nodes: [], edges: [] });
    const output = renderDashboard(view);

    expect(output).toContain('No active teams');
    expect(output).toContain('No pending recommendations');
    expect(output).toContain('No failure patterns');
  });
});

// ============================================================================
// approveRecommendation / vetoRecommendation
// ============================================================================

describe('approveRecommendation', () => {
  it('creates approved action result', () => {
    const result = approveRecommendation('rec-1', 'Looks good');
    expect(result.action).toBe('approved');
    expect(result.recommendationId).toBe('rec-1');
    expect(result.reason).toBe('Looks good');
    expect(result.timestamp).toMatch(/^\d{4}/);
  });
});

describe('vetoRecommendation', () => {
  it('creates vetoed action result', () => {
    const result = vetoRecommendation('rec-2', 'Too risky');
    expect(result.action).toBe('vetoed');
    expect(result.recommendationId).toBe('rec-2');
    expect(result.reason).toBe('Too risky');
  });
});
