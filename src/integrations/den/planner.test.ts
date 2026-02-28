/**
 * TDD tests for the Planner agent.
 *
 * Tests trajectory management, phase decomposition, resource estimation,
 * trajectory reporting, and JSONL logging round-trips.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  PlannerConfigSchema,
  TrajectorySchema,
  PhaseEstimateSchema,
  TrajectoryReportSchema,
  TrajectoryEntrySchema,
  decomposeVision,
  estimatePhaseResources,
  generateTrajectoryReport,
  appendTrajectoryEntry,
  readTrajectoryLog,
  Planner,
  createPlanner,
} from './planner.js';
import type { Trajectory, PhaseEstimate, TrajectoryEntry } from './planner.js';

// ============================================================================
// Schema validation tests
// ============================================================================

describe('Planner schemas', () => {
  describe('PhaseEstimateSchema', () => {
    it('validates a valid phase estimate', () => {
      const result = PhaseEstimateSchema.parse({
        phase: 'Phase 1',
        estimatedTokens: 15000,
        skillsRequired: ['test', 'API'],
        complexity: 'simple',
        estimatedPlans: 2,
      });
      expect(result.phase).toBe('Phase 1');
      expect(result.estimatedTokens).toBe(15000);
      expect(result.complexity).toBe('simple');
    });

    it('rejects non-positive estimatedTokens', () => {
      expect(() =>
        PhaseEstimateSchema.parse({
          phase: 'Phase 1',
          estimatedTokens: 0,
          skillsRequired: [],
          complexity: 'simple',
          estimatedPlans: 1,
        }),
      ).toThrow();
    });

    it('rejects invalid complexity', () => {
      expect(() =>
        PhaseEstimateSchema.parse({
          phase: 'Phase 1',
          estimatedTokens: 15000,
          skillsRequired: [],
          complexity: 'extreme',
          estimatedPlans: 1,
        }),
      ).toThrow();
    });
  });

  describe('TrajectorySchema', () => {
    it('validates a valid trajectory', () => {
      const result = TrajectorySchema.parse({
        milestoneId: 'milestone-1',
        totalPhases: 2,
        currentPhase: 0,
        phases: [
          {
            phase: 'Phase 1',
            estimatedTokens: 15000,
            skillsRequired: ['test'],
            complexity: 'simple',
            estimatedPlans: 1,
          },
          {
            phase: 'Phase 2',
            estimatedTokens: 30000,
            skillsRequired: ['API'],
            complexity: 'standard',
            estimatedPlans: 4,
          },
        ],
        totalEstimatedTokens: 45000,
        status: 'planned',
      });
      expect(result.totalPhases).toBe(2);
      expect(result.phases).toHaveLength(2);
      expect(result.status).toBe('planned');
    });

    it('rejects invalid status', () => {
      expect(() =>
        TrajectorySchema.parse({
          milestoneId: 'milestone-1',
          totalPhases: 1,
          currentPhase: 0,
          phases: [],
          totalEstimatedTokens: 0,
          status: 'unknown',
        }),
      ).toThrow();
    });
  });

  describe('TrajectoryReportSchema', () => {
    it('validates a valid report', () => {
      const result = TrajectoryReportSchema.parse({
        timestamp: '20260220-130000',
        milestoneId: 'milestone-1',
        phasesCompleted: 3,
        totalPhases: 5,
        tokensConsumed: 60000,
        tokensEstimated: 100000,
        status: 'on_track',
      });
      expect(result.status).toBe('on_track');
    });

    it('accepts optional deviationReason', () => {
      const result = TrajectoryReportSchema.parse({
        timestamp: '20260220-130000',
        milestoneId: 'milestone-1',
        phasesCompleted: 1,
        totalPhases: 5,
        tokensConsumed: 80000,
        tokensEstimated: 100000,
        status: 'behind',
        deviationReason: 'Complex integration work',
      });
      expect(result.deviationReason).toBe('Complex integration work');
    });
  });

  describe('TrajectoryEntrySchema', () => {
    it('validates a valid entry', () => {
      const result = TrajectoryEntrySchema.parse({
        timestamp: '20260220-130000',
        type: 'decomposition',
        milestoneId: 'milestone-1',
        detail: { phases: 3, source: 'vision-doc' },
      });
      expect(result.type).toBe('decomposition');
    });

    it('rejects invalid type', () => {
      expect(() =>
        TrajectoryEntrySchema.parse({
          timestamp: '20260220-130000',
          type: 'unknown',
          milestoneId: 'milestone-1',
          detail: {},
        }),
      ).toThrow();
    });
  });

  describe('PlannerConfigSchema', () => {
    it('applies default logPath', () => {
      const result = PlannerConfigSchema.parse({
        busConfig: { busDir: '/tmp/test-bus' },
      });
      expect(result.logPath).toBe('.planning/den/logs/planner.jsonl');
    });

    it('accepts custom logPath', () => {
      const result = PlannerConfigSchema.parse({
        busConfig: {},
        logPath: '/custom/path.jsonl',
      });
      expect(result.logPath).toBe('/custom/path.jsonl');
    });
  });
});

// ============================================================================
// decomposeVision tests
// ============================================================================

describe('decomposeVision', () => {
  it('decomposes multi-heading vision into trajectory', () => {
    const vision = `## Phase 1
- task a
- task b

## Phase 2
- task c`;

    const trajectory = decomposeVision(vision);
    expect(trajectory.milestoneId).toBe('milestone-1');
    expect(trajectory.totalPhases).toBe(2);
    expect(trajectory.status).toBe('planned');
    expect(trajectory.phases).toHaveLength(2);

    // Phase 1: 2 bullets = simple
    expect(trajectory.phases[0].phase).toBe('Phase 1');
    expect(trajectory.phases[0].estimatedPlans).toBe(2);
    expect(trajectory.phases[0].complexity).toBe('simple');
    expect(trajectory.phases[0].estimatedTokens).toBe(15000);

    // Phase 2: 1 bullet = simple
    expect(trajectory.phases[1].phase).toBe('Phase 2');
    expect(trajectory.phases[1].estimatedPlans).toBe(1);
    expect(trajectory.phases[1].complexity).toBe('simple');
    expect(trajectory.phases[1].estimatedTokens).toBe(15000);

    // Total tokens
    expect(trajectory.totalEstimatedTokens).toBe(30000);
  });

  it('handles single paragraph with no headings', () => {
    const vision = 'single paragraph no headings';
    const trajectory = decomposeVision(vision);
    expect(trajectory.totalPhases).toBe(1);
    expect(trajectory.phases).toHaveLength(1);
    expect(trajectory.phases[0].complexity).toBe('simple');
    expect(trajectory.phases[0].estimatedPlans).toBe(1);
  });

  it('assigns standard complexity for 4-6 bullets', () => {
    const vision = `## Phase 1
- task a
- task b
- task c
- task d
- task e`;

    const trajectory = decomposeVision(vision);
    expect(trajectory.phases[0].complexity).toBe('standard');
    expect(trajectory.phases[0].estimatedTokens).toBe(30000);
    expect(trajectory.phases[0].estimatedPlans).toBe(5);
  });

  it('assigns complex complexity for >6 bullets', () => {
    const vision = `## Phase 1
- a
- b
- c
- d
- e
- f
- g`;

    const trajectory = decomposeVision(vision);
    expect(trajectory.phases[0].complexity).toBe('complex');
    expect(trajectory.phases[0].estimatedTokens).toBe(50000);
    expect(trajectory.phases[0].estimatedPlans).toBe(7);
  });

  it('extracts skill keywords from content', () => {
    const vision = `## Phase 1
- write tests for API
- setup database connections
- build UI components
- add auth middleware
- deploy to production`;

    const trajectory = decomposeVision(vision);
    const skills = trajectory.phases[0].skillsRequired;
    expect(skills).toContain('test');
    expect(skills).toContain('API');
    expect(skills).toContain('database');
    expect(skills).toContain('UI');
    expect(skills).toContain('auth');
    expect(skills).toContain('deploy');
  });

  it('handles "Phase" headings (without ##)', () => {
    const vision = `Phase 1: Foundation
- setup
- config

Phase 2: Build
- implement
- test
- verify`;

    const trajectory = decomposeVision(vision);
    expect(trajectory.totalPhases).toBe(2);
  });

  it('allows milestoneId override', () => {
    const vision = 'simple task';
    const trajectory = decomposeVision(vision, 'v2.0');
    expect(trajectory.milestoneId).toBe('v2.0');
  });
});

// ============================================================================
// estimatePhaseResources tests
// ============================================================================

describe('estimatePhaseResources', () => {
  it('calculates remaining, avgPerPhase, projectedTotal', () => {
    const phases: PhaseEstimate[] = [
      { phase: 'P1', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P2', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P3', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P4', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P5', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
    ];

    const result = estimatePhaseResources(phases, 3, 60000);
    const totalEstimated = 100000;

    expect(result.remaining).toBe(totalEstimated - 60000);
    expect(result.avgPerPhase).toBe(20000);
    expect(result.projectedTotal).toBe(100000);
  });

  it('handles zero completed phases', () => {
    const phases: PhaseEstimate[] = [
      { phase: 'P1', estimatedTokens: 30000, skillsRequired: [], complexity: 'standard', estimatedPlans: 3 },
    ];

    const result = estimatePhaseResources(phases, 0, 0);
    expect(result.remaining).toBe(30000);
    expect(result.avgPerPhase).toBe(0);
    expect(result.projectedTotal).toBe(30000);
  });

  it('projects accurately based on consumption rate', () => {
    const phases: PhaseEstimate[] = [
      { phase: 'P1', estimatedTokens: 10000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P2', estimatedTokens: 10000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P3', estimatedTokens: 10000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P4', estimatedTokens: 10000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
    ];

    // Completed 2 of 4, used 30000 (15000 per phase on average)
    const result = estimatePhaseResources(phases, 2, 30000);
    expect(result.avgPerPhase).toBe(15000);
    // projected = avg * total phases = 15000 * 4 = 60000
    expect(result.projectedTotal).toBe(60000);
  });
});

// ============================================================================
// generateTrajectoryReport tests
// ============================================================================

describe('generateTrajectoryReport', () => {
  const baseTrajectory: Trajectory = {
    milestoneId: 'milestone-1',
    totalPhases: 5,
    currentPhase: 3,
    phases: [
      { phase: 'P1', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P2', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P3', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P4', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
      { phase: 'P5', estimatedTokens: 20000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
    ],
    totalEstimatedTokens: 100000,
    status: 'in_progress',
  };

  it('reports ahead when phases progress exceeds token consumption', () => {
    // 3/5 phases (60%) complete, 40000/100000 tokens (40%) consumed
    // 0.6 > 0.4 + 0.1 => ahead
    const report = generateTrajectoryReport(baseTrajectory, 40000);
    expect(report.status).toBe('ahead');
    expect(report.phasesCompleted).toBe(3);
    expect(report.totalPhases).toBe(5);
    expect(report.tokensConsumed).toBe(40000);
    expect(report.tokensEstimated).toBe(100000);
  });

  it('reports behind when token consumption exceeds phase progress', () => {
    // 3/5 phases (60%) complete, 80000/100000 tokens (80%) consumed
    // 0.8 > 0.6 + 0.1 => behind
    const report = generateTrajectoryReport(baseTrajectory, 80000);
    expect(report.status).toBe('behind');
  });

  it('reports on_track when balanced', () => {
    // 3/5 phases (60%) complete, 55000/100000 tokens (55%) consumed
    // Neither ahead nor behind (difference < 0.1)
    const report = generateTrajectoryReport(baseTrajectory, 55000);
    expect(report.status).toBe('on_track');
  });

  it('reports deviation when trajectory is replanned', () => {
    const replanned = { ...baseTrajectory, status: 'replanned' as const };
    const report = generateTrajectoryReport(replanned, 50000);
    expect(report.status).toBe('deviation');
    expect(report.deviationReason).toBeDefined();
  });

  it('includes milestoneId and timestamp', () => {
    const report = generateTrajectoryReport(baseTrajectory, 50000);
    expect(report.milestoneId).toBe('milestone-1');
    expect(report.timestamp).toBeDefined();
    expect(report.timestamp.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// JSONL logging tests
// ============================================================================

describe('JSONL logging', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'planner-test-'));
    logPath = join(tmpDir, 'logs', 'planner.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('appends and reads back entries', async () => {
    const entry1: TrajectoryEntry = {
      timestamp: '20260220-130000',
      type: 'decomposition',
      milestoneId: 'milestone-1',
      detail: { phases: 3 },
    };

    const entry2: TrajectoryEntry = {
      timestamp: '20260220-130100',
      type: 'estimate',
      milestoneId: 'milestone-1',
      detail: { tokens: 50000 },
    };

    await appendTrajectoryEntry(logPath, entry1);
    await appendTrajectoryEntry(logPath, entry2);

    const entries = await readTrajectoryLog(logPath);
    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('decomposition');
    expect(entries[1].type).toBe('estimate');
  });

  it('returns empty array for non-existent log', async () => {
    const entries = await readTrajectoryLog(join(tmpDir, 'nonexistent.jsonl'));
    expect(entries).toEqual([]);
  });

  it('validates entries on read', async () => {
    const entry: TrajectoryEntry = {
      timestamp: '20260220-130000',
      type: 'report',
      milestoneId: 'milestone-1',
      detail: { status: 'on_track' },
    };

    await appendTrajectoryEntry(logPath, entry);
    const raw = await readFile(logPath, 'utf-8');
    const parsed = JSON.parse(raw.trim());
    expect(parsed.timestamp).toBe('20260220-130000');
    expect(parsed.type).toBe('report');
  });
});

// ============================================================================
// Planner class tests
// ============================================================================

describe('Planner class', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'planner-class-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('decomposes vision and stores trajectory', () => {
    const planner = new Planner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'planner.jsonl'),
    });

    const trajectory = planner.decompose('## Phase 1\n- task a\n- task b');
    expect(trajectory.totalPhases).toBe(1);
    expect(planner.getTrajectory()).not.toBeNull();
    expect(planner.getTrajectory()!.totalPhases).toBe(1);
  });

  it('estimates resources using stored trajectory', () => {
    const planner = new Planner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'planner.jsonl'),
    });

    planner.decompose('## Phase 1\n- a\n- b\n## Phase 2\n- c\n- d\n- e');
    const est = planner.estimate(1, 15000);
    expect(est.remaining).toBeGreaterThan(0);
    expect(est.avgPerPhase).toBe(15000);
    expect(est.projectedTotal).toBeGreaterThan(0);
  });

  it('generates trajectory report and logs it', async () => {
    const logPath = join(tmpDir, 'logs', 'planner.jsonl');
    const planner = new Planner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath,
    });

    planner.decompose('## Phase 1\n- a\n## Phase 2\n- b');

    // Set currentPhase to simulate progress
    const traj = planner.getTrajectory()!;
    traj.currentPhase = 1;
    traj.status = 'in_progress';
    planner.setTrajectory(traj);

    const report = await planner.report(10000);
    expect(report.status).toBeDefined();
    expect(report.milestoneId).toBe('milestone-1');

    // Verify log entry was written
    const entries = await planner.getLog();
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries.some((e) => e.type === 'report')).toBe(true);
  });

  it('returns null trajectory before decompose', () => {
    const planner = new Planner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'planner.jsonl'),
    });
    expect(planner.getTrajectory()).toBeNull();
  });

  it('setTrajectory updates stored trajectory', () => {
    const planner = new Planner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'planner.jsonl'),
    });

    const trajectory: Trajectory = {
      milestoneId: 'v2.0',
      totalPhases: 3,
      currentPhase: 1,
      phases: [
        { phase: 'P1', estimatedTokens: 10000, skillsRequired: [], complexity: 'simple', estimatedPlans: 1 },
        { phase: 'P2', estimatedTokens: 20000, skillsRequired: [], complexity: 'standard', estimatedPlans: 3 },
        { phase: 'P3', estimatedTokens: 30000, skillsRequired: [], complexity: 'complex', estimatedPlans: 7 },
      ],
      totalEstimatedTokens: 60000,
      status: 'in_progress',
    };

    planner.setTrajectory(trajectory);
    expect(planner.getTrajectory()!.milestoneId).toBe('v2.0');
    expect(planner.getTrajectory()!.totalPhases).toBe(3);
  });
});

// ============================================================================
// createPlanner factory tests
// ============================================================================

describe('createPlanner', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'planner-factory-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates planner with directory setup', async () => {
    const planner = await createPlanner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'planner.jsonl'),
    });

    expect(planner).toBeInstanceOf(Planner);
    expect(planner.getTrajectory()).toBeNull();
  });

  it('factory planner can decompose and report', async () => {
    const planner = await createPlanner({
      busConfig: { busDir: join(tmpDir, 'bus') },
      logPath: join(tmpDir, 'logs', 'planner.jsonl'),
    });

    planner.decompose('## Phase 1\n- task a\n- task b');
    const report = await planner.report(5000);
    expect(report.milestoneId).toBe('milestone-1');
  });
});
