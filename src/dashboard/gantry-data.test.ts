import { describe, it, expect } from 'vitest';
import { buildGantryData } from './gantry-data.js';
import type { DashboardData, StateData, RoadmapData, Phase } from './types.js';
import type { GantryData } from './gantry-panel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    generatedAt: '2026-02-13T00:00:00Z',
    ...overrides,
  };
}

function makeState(overrides: Partial<StateData> = {}): StateData {
  return {
    milestone: overrides.milestone ?? 'v1.0 Test',
    phase: overrides.phase ?? '1 (Foundation)',
    status: overrides.status ?? 'Executing phase 1',
    progress: overrides.progress ?? '1/3 phases complete',
    focus: overrides.focus ?? 'Building core',
    blockers: overrides.blockers ?? [],
    metrics: overrides.metrics ?? {},
    nextAction: overrides.nextAction ?? 'Execute next plan',
  };
}

function makePhase(overrides: Partial<Phase> = {}): Phase {
  return {
    number: overrides.number ?? 1,
    name: overrides.name ?? 'Foundation',
    status: overrides.status ?? 'active',
    goal: overrides.goal ?? 'Build core',
    requirements: overrides.requirements ?? [],
    deliverables: overrides.deliverables ?? [],
  };
}

function makeRoadmap(phases: Phase[]): RoadmapData {
  return { phases, totalPhases: phases.length };
}

// ---------------------------------------------------------------------------
// buildGantryData -- Empty / Missing data
// ---------------------------------------------------------------------------

describe('buildGantryData', () => {
  describe('empty and missing data', () => {
    it('returns empty cells when no state or roadmap data', () => {
      const result = buildGantryData(makeDashboardData());
      expect(result.cells).toEqual([]);
    });

    it('returns empty cells with only generatedAt', () => {
      const result = buildGantryData({ generatedAt: '2026-01-01T00:00:00Z' });
      expect(result.cells).toEqual([]);
    });

    it('returns cells without phase cell when no roadmap data', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState() }),
      );
      const phaseCells = result.cells.filter((c) => c.type === 'phase');
      expect(phaseCells).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Phase progress cell (REQ-GA-03)
  // -------------------------------------------------------------------------

  describe('phase progress cell (REQ-GA-03)', () => {
    it('generates cell with value "1/3" for 3 phases, 1 complete', () => {
      const phases = [
        makePhase({ number: 1, status: 'complete' }),
        makePhase({ number: 2, status: 'active' }),
        makePhase({ number: 3, status: 'pending' }),
      ];
      const result = buildGantryData(
        makeDashboardData({ roadmap: makeRoadmap(phases) }),
      );
      const phaseCell = result.cells.find((c) => c.type === 'phase');
      expect(phaseCell).toBeDefined();
      expect(phaseCell!.value).toBe('1/3');
    });

    it('generates cell with value "5/7" for 7 phases, 5 complete', () => {
      const phases = [
        makePhase({ number: 1, status: 'complete' }),
        makePhase({ number: 2, status: 'done' }),
        makePhase({ number: 3, status: 'shipped' }),
        makePhase({ number: 4, status: 'complete' }),
        makePhase({ number: 5, status: 'complete' }),
        makePhase({ number: 6, status: 'active' }),
        makePhase({ number: 7, status: 'pending' }),
      ];
      const result = buildGantryData(
        makeDashboardData({ roadmap: makeRoadmap(phases) }),
      );
      const phaseCell = result.cells.find((c) => c.type === 'phase');
      expect(phaseCell).toBeDefined();
      expect(phaseCell!.value).toBe('5/7');
    });

    it('phase cell uses type "phase"', () => {
      const phases = [makePhase({ status: 'active' })];
      const result = buildGantryData(
        makeDashboardData({ roadmap: makeRoadmap(phases) }),
      );
      const phaseCell = result.cells.find((c) => c.type === 'phase');
      expect(phaseCell).toBeDefined();
      expect(phaseCell!.type).toBe('phase');
    });

    it('phase cell has a symbol', () => {
      const phases = [makePhase({ status: 'active' })];
      const result = buildGantryData(
        makeDashboardData({ roadmap: makeRoadmap(phases) }),
      );
      const phaseCell = result.cells.find((c) => c.type === 'phase');
      expect(phaseCell).toBeDefined();
      expect(phaseCell!.symbol).toBeTruthy();
    });

    it('phase cell label is "Phase"', () => {
      const phases = [makePhase({ status: 'active' })];
      const result = buildGantryData(
        makeDashboardData({ roadmap: makeRoadmap(phases) }),
      );
      const phaseCell = result.cells.find((c) => c.type === 'phase');
      expect(phaseCell).toBeDefined();
      expect(phaseCell!.label).toBe('Phase');
    });
  });

  // -------------------------------------------------------------------------
  // Status cell from STATE.md (REQ-GA-08)
  // -------------------------------------------------------------------------

  describe('status cell (REQ-GA-08)', () => {
    it('generates status cell when state data exists', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState() }),
      );
      const statusCell = result.cells.find((c) => c.type === 'status');
      expect(statusCell).toBeDefined();
    });

    it('status cell type is "status"', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState() }),
      );
      const statusCell = result.cells.find((c) => c.type === 'status');
      expect(statusCell!.type).toBe('status');
    });

    it('status cell label includes abbreviated status', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState({ status: 'Executing phase 1' }) }),
      );
      const statusCell = result.cells.find((c) => c.type === 'status');
      expect(statusCell).toBeDefined();
      expect(statusCell!.label.length).toBeGreaterThan(0);
    });

    it('status cell has a symbol', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState() }),
      );
      const statusCell = result.cells.find((c) => c.type === 'status');
      expect(statusCell).toBeDefined();
      expect(statusCell!.symbol).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Budget cell placeholder (REQ-GA-04)
  // -------------------------------------------------------------------------

  describe('budget cell (REQ-GA-04)', () => {
    it('generates budget cell when state metrics has token data', () => {
      const result = buildGantryData(
        makeDashboardData({
          state: makeState({ metrics: { 'token-usage': '65%' } }),
        }),
      );
      const budgetCell = result.cells.find((c) => c.type === 'budget');
      expect(budgetCell).toBeDefined();
    });

    it('budget cell type is "budget"', () => {
      const result = buildGantryData(
        makeDashboardData({
          state: makeState({ metrics: { 'token-budget': '50' } }),
        }),
      );
      const budgetCell = result.cells.find((c) => c.type === 'budget');
      expect(budgetCell!.type).toBe('budget');
    });

    it('budget cell has bar symbol', () => {
      const result = buildGantryData(
        makeDashboardData({
          state: makeState({ metrics: { tokens: '40' } }),
        }),
      );
      const budgetCell = result.cells.find((c) => c.type === 'budget');
      expect(budgetCell).toBeDefined();
      expect(budgetCell!.symbol).toBeTruthy();
    });

    it('no budget cell when no token metrics', () => {
      const result = buildGantryData(
        makeDashboardData({
          state: makeState({ metrics: { phases: '3', plans: '10' } }),
        }),
      );
      const budgetCell = result.cells.find((c) => c.type === 'budget');
      expect(budgetCell).toBeUndefined();
    });

    it('no budget cell when metrics is empty', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState({ metrics: {} }) }),
      );
      const budgetCell = result.cells.find((c) => c.type === 'budget');
      expect(budgetCell).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Cell ordering and limit (REQ-GA-05)
  // -------------------------------------------------------------------------

  describe('cell ordering and limit (REQ-GA-05)', () => {
    it('status cell appears before agent cell', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState({ status: 'Executing phase 1' }) }),
      );
      const statusIdx = result.cells.findIndex((c) => c.type === 'status');
      const agentIdx = result.cells.findIndex((c) => c.type === 'agent');
      if (statusIdx >= 0 && agentIdx >= 0) {
        expect(statusIdx).toBeLessThan(agentIdx);
      }
    });

    it('phase cell appears after agent cells', () => {
      const phases = [makePhase({ status: 'active' })];
      const result = buildGantryData(
        makeDashboardData({
          state: makeState({ status: 'Executing' }),
          roadmap: makeRoadmap(phases),
        }),
      );
      const agentIdx = result.cells.findIndex((c) => c.type === 'agent');
      const phaseIdx = result.cells.findIndex((c) => c.type === 'phase');
      if (agentIdx >= 0 && phaseIdx >= 0) {
        expect(phaseIdx).toBeGreaterThan(agentIdx);
      }
    });

    it('total cells never exceed 8', () => {
      const result = buildGantryData(
        makeDashboardData({
          state: makeState({
            status: 'Executing',
            metrics: { 'token-usage': '80%' },
          }),
          roadmap: makeRoadmap(
            Array.from({ length: 10 }, (_, i) =>
              makePhase({ number: i + 1, status: i < 5 ? 'complete' : 'pending' }),
            ),
          ),
        }),
      );
      expect(result.cells.length).toBeLessThanOrEqual(8);
    });

    it('no padding cells added when fewer than 8 data points', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState() }),
      );
      // Should have only the cells derived from actual data
      expect(result.cells.length).toBeLessThan(8);
      expect(result.cells.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Agent cells (REQ-GA-02, REQ-GA-08)
  // -------------------------------------------------------------------------

  describe('agent cells (REQ-GA-02, REQ-GA-08)', () => {
    it('generates active agent cell with filled circle when status contains executing', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState({ status: 'Executing phase 1' }) }),
      );
      const agentCell = result.cells.find((c) => c.type === 'agent');
      expect(agentCell).toBeDefined();
      expect(agentCell!.symbol).toBe('\u25CF');
    });

    it('generates inactive agent cell with empty circle for non-executing status', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState({ status: 'Planned' }) }),
      );
      const agentCell = result.cells.find((c) => c.type === 'agent');
      expect(agentCell).toBeDefined();
      expect(agentCell!.symbol).toBe('\u25CB');
    });

    it('agent cells have type "agent"', () => {
      const result = buildGantryData(
        makeDashboardData({ state: makeState() }),
      );
      const agentCell = result.cells.find((c) => c.type === 'agent');
      expect(agentCell).toBeDefined();
      expect(agentCell!.type).toBe('agent');
    });
  });

  // -------------------------------------------------------------------------
  // Return type
  // -------------------------------------------------------------------------

  describe('return type', () => {
    it('returns GantryData with cells array', () => {
      const result = buildGantryData(makeDashboardData());
      expect(result).toHaveProperty('cells');
      expect(Array.isArray(result.cells)).toBe(true);
    });
  });
});
