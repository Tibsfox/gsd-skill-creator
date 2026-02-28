/**
 * Phase 456 verification tests for DACP dashboard panel.
 * Tests: drift chart rendering, fidelity distribution,
 * recommendations display, and full panel integration.
 *
 * @module test/dacp/dashboard
 */

import { describe, it, expect } from 'vitest';

import {
  renderDriftTrend,
  renderFidelityDistribution,
  renderRecommendations,
  renderHandoffPanel,
  type HandoffPanelData,
  type DriftEntry,
  type FidelityDistribution,
  type Recommendation,
} from '../../../src/dashboard/handoff-panel.js';

// ============================================================================
// Factories
// ============================================================================

function makePanelData(overrides: Partial<HandoffPanelData> = {}): HandoffPanelData {
  return {
    driftEntries: [
      { score: 0.45, timestamp: '2026-02-27T12:00:00Z', pattern: 'planner->executor:task', recommendation: 'promote' },
      { score: 0.12, timestamp: '2026-02-27T12:01:00Z', pattern: 'executor->verifier:verify', recommendation: 'maintain' },
      { score: 0.02, timestamp: '2026-02-27T12:02:00Z', pattern: 'agent->orchestrator:error', recommendation: 'demote' },
    ],
    fidelity: { level0: 5, level1: 10, level2: 8, level3: 2 },
    recommendations: [
      {
        pattern: 'planner->executor:task',
        direction: 'promote',
        fromLevel: 1,
        toLevel: 2,
        reason: 'drift 0.45 x 3 consecutive',
        evidence: 3,
      },
    ],
    milestoneName: 'v1.49',
    totalHandoffs: 25,
    avgDrift: 0.19,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Dashboard Panel', () => {
  it('drift chart renders with score values', () => {
    const data = makePanelData();
    const html = renderDriftTrend(data);

    expect(html).toContain('0.45');
    expect(html).toContain('0.12');
    expect(html).toContain('0.02');
    expect(html).toContain('planner-&gt;executor:task');
    expect(html).toContain('hp-drift-trend');
    expect(html).toContain('Handoffs: 25');
  });

  it('fidelity distribution renders all levels', () => {
    const data = makePanelData();
    const html = renderFidelityDistribution(data);

    expect(html).toContain('L0');
    expect(html).toContain('L1');
    expect(html).toContain('L2');
    expect(html).toContain('L3');
    expect(html).toContain('5');  // level0 count
    expect(html).toContain('10'); // level1 count
    expect(html).toContain('8');  // level2 count
    expect(html).toContain('2');  // level3 count
    expect(html).toContain('hp-fidelity-dist');
  });

  it('recommendations display with from/to levels', () => {
    const data = makePanelData();
    const html = renderRecommendations(data);

    expect(html).toContain('planner-&gt;executor:task');
    expect(html).toContain('Level 1');
    expect(html).toContain('hp-recommendations');
    expect(html).toContain('hp-rec-promote');
  });

  it('full panel integrates all sections', () => {
    const data = makePanelData();
    const html = renderHandoffPanel(data);

    // Contains all three sections
    expect(html).toContain('hp-drift-trend');
    expect(html).toContain('hp-fidelity-dist');
    expect(html).toContain('hp-recommendations');
    // Contains panel wrapper and title
    expect(html).toContain('handoff-panel');
    expect(html).toContain('HANDOFF QUALITY');
    expect(html).toContain('v1.49');
  });
});
