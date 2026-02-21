/**
 * Integration tests for Sentinel recovery flow (end-to-end), crash damage
 * assessment scenarios, chipset reproducibility (INT-07), and barrel export
 * validation for both Sentinel and Chipset modules.
 *
 * Four test groups:
 *   1. Sentinel recovery flow -- assess -> HALT -> CLEAR end-to-end
 *   2. Crash damage assessment scenarios -- all 3 severity paths
 *   3. Chipset reproducibility -- deterministic parse, roster, budget
 *   4. Barrel export validation -- all public API accessible from index
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  assessFailure,
  issueHalt,
  clearHalt,
  planRollback,
  assessCrashDamage,
  Sentinel,
  createSentinel,
  SentinelConfigSchema,
} from './sentinel.js';
import type { BusConfig } from './types.js';
import { BusConfigSchema } from './types.js';
import { initBus } from './bus.js';

import {
  parseChipsetConfig,
  extractStaffRoster,
  validateReproducibility,
  createDefaultChipsetConfig,
  DEN_STAFF_POSITIONS,
  Chipset,
  createChipset,
} from './chipset.js';

// ============================================================================
// Fixtures
// ============================================================================

let tmpDir: string;
let busConfig: BusConfig;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'sentinel-chipset-int-'));
  busConfig = BusConfigSchema.parse({ busDir: join(tmpDir, 'bus') });
  await initBus(busConfig);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// Group 1: Sentinel Recovery Flow (end-to-end)
// ============================================================================

describe('Sentinel Recovery Flow (end-to-end)', () => {
  it('assess bus-failure -> issues HALT -> HALT in priority-0 -> clear HALT -> NOP in priority-0', async () => {
    const sentinelConfig = SentinelConfigSchema.parse({
      busConfig,
      logPath: join(tmpDir, 'logs', 'sentinel.jsonl'),
    });

    // Step 1: Assess bus-failure
    const action = assessFailure('bus-failure');
    expect(action.severity).toBe('critical');
    expect(action.action).toBe('halt');
    expect(action.requiresHalt).toBe(true);

    // Step 2: Issue HALT since requiresHalt is true
    const haltMsg = await issueHalt(sentinelConfig, 'Critical bus failure', action.severity);
    expect(haltMsg.header.opcode).toBe('HALT');
    expect(haltMsg.header.priority).toBe(0);

    // Step 3: Verify HALT message appears on disk in priority-0
    const priority0Dir = join(busConfig.busDir, 'priority-0');
    const filesAfterHalt = await readdir(priority0Dir);
    const haltFiles = filesAfterHalt.filter((f) => f.includes('HALT'));
    expect(haltFiles.length).toBe(1);

    // Step 4: Clear HALT
    const clearMsg = await clearHalt(sentinelConfig);
    expect(clearMsg.header.opcode).toBe('NOP');
    expect(clearMsg.header.priority).toBe(0);

    // Step 5: Verify NOP (CLEAR) message appears on disk in priority-0
    const filesAfterClear = await readdir(priority0Dir);
    const nopFiles = filesAfterClear.filter((f) => f.includes('NOP'));
    expect(nopFiles.length).toBe(1);
  });

  it('assess test-failure-cascade -> plan rollback -> plan has 6 steps and correct targetSha', () => {
    // Step 1: Assess test-failure-cascade
    const action = assessFailure('test-failure-cascade');
    expect(action.severity).toBe('medium');
    expect(action.action).toBe('rollback');
    expect(action.requiresHalt).toBe(false);

    // Step 2: Plan rollback since action is 'rollback'
    const plan = planRollback('abc1234def', '259', 'Cascade failure in test suite');
    expect(plan.steps).toHaveLength(6);
    expect(plan.targetSha).toBe('abc1234def');
    expect(plan.phase).toBe('259');
    expect(plan.reason).toBe('Cascade failure in test suite');
  });

  it('assess verification-rejection -> action is assess, not halt (medium severity)', () => {
    const action = assessFailure('verification-rejection');
    expect(action.severity).toBe('medium');
    expect(action.action).toBe('assess');
    expect(action.requiresHalt).toBe(false);
    // Verify this is NOT a halt action
    expect(action.action).not.toBe('halt');
  });
});

// ============================================================================
// Group 2: Crash Damage Assessment Scenarios
// ============================================================================

describe('Crash Damage Assessment Scenarios', () => {
  it('all-clear scenario (state exists, bus clean, no uncommitted) -> none / resume', () => {
    const result = assessCrashDamage(true, true, false);
    expect(result.level).toBe('none');
    expect(result.recommendedAction).toBe('resume');
    expect(result.description).toBeTruthy();
  });

  it('uncommitted work scenario -> minor / recover', () => {
    const result = assessCrashDamage(true, true, true);
    expect(result.level).toBe('minor');
    expect(result.recommendedAction).toBe('recover');
    expect(result.description).toContain('Uncommitted');
  });

  it('state missing scenario -> significant / investigate', () => {
    const result = assessCrashDamage(false, true, false);
    expect(result.level).toBe('significant');
    expect(result.recommendedAction).toBe('investigate');
    expect(result.description).toContain('STATE.md');
  });
});

// ============================================================================
// Group 3: Chipset Reproducibility (INT-07)
// ============================================================================

describe('Chipset Reproducibility (INT-07)', () => {
  it('parse same config twice -> validateReproducibility returns identical: true', () => {
    const defaultConfig = createDefaultChipsetConfig();
    const configA = parseChipsetConfig(defaultConfig);
    const configB = parseChipsetConfig(defaultConfig);
    const result = validateReproducibility(configA, configB);
    expect(result.identical).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it('parse with reordered positions -> extractStaffRoster produces identical sorted output', () => {
    const defaultConfig = createDefaultChipsetConfig();
    const reorderedConfig = {
      ...defaultConfig,
      positions: [...defaultConfig.positions].reverse(),
    };
    const configA = parseChipsetConfig(defaultConfig);
    const configB = parseChipsetConfig(reorderedConfig);
    const rosterA = extractStaffRoster(configA);
    const rosterB = extractStaffRoster(configB);
    expect(rosterA).toEqual(rosterB);
  });

  it('default chipset has exactly 10 positions with total budget 0.59', () => {
    const config = createDefaultChipsetConfig();
    expect(config.positions).toHaveLength(10);
    expect(config.totalBudget).toBe(0.59);
    expect(DEN_STAFF_POSITIONS).toHaveLength(10);
  });

  it('modify one field -> validateReproducibility detects the difference', () => {
    const configA = parseChipsetConfig(createDefaultChipsetConfig());
    const modified = createDefaultChipsetConfig();
    modified.totalBudget = 0.75;
    const configB = parseChipsetConfig(modified);
    const result = validateReproducibility(configA, configB);
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('totalBudget');
  });
});

// ============================================================================
// Group 4: Barrel Export Validation
// ============================================================================

describe('Barrel Export Validation', () => {
  it('all Sentinel exports resolve from index.ts', async () => {
    const barrel = await import('./index.js');

    // Schemas
    expect(barrel.SentinelConfigSchema).toBeDefined();
    expect(barrel.FailureTypeSchema).toBeDefined();
    expect(barrel.RecoveryActionSchema).toBeDefined();
    expect(barrel.RollbackPlanSchema).toBeDefined();
    expect(barrel.DamageAssessmentSchema).toBeDefined();
    expect(barrel.SentinelEntrySchema).toBeDefined();

    // Functions
    expect(typeof barrel.assessFailure).toBe('function');
    expect(typeof barrel.issueHalt).toBe('function');
    expect(typeof barrel.clearHalt).toBe('function');
    expect(typeof barrel.planRollback).toBe('function');
    expect(typeof barrel.assessCrashDamage).toBe('function');
    expect(typeof barrel.appendSentinelEntry).toBe('function');
    expect(typeof barrel.readSentinelLog).toBe('function');

    // Class and factory
    expect(barrel.Sentinel).toBeDefined();
    expect(typeof barrel.createSentinel).toBe('function');
  });

  it('all Chipset exports resolve from index.ts', async () => {
    const barrel = await import('./index.js');

    // Schemas
    expect(barrel.ChipsetConfigSchema).toBeDefined();
    expect(barrel.StaffPositionSchema).toBeDefined();
    expect(barrel.TopologyDefinitionSchema).toBeDefined();

    // Constants
    expect(barrel.DEN_STAFF_POSITIONS).toBeDefined();
    expect(Array.isArray(barrel.DEN_STAFF_POSITIONS)).toBe(true);

    // Functions
    expect(typeof barrel.parseChipsetConfig).toBe('function');
    expect(typeof barrel.extractStaffRoster).toBe('function');
    expect(typeof barrel.validateReproducibility).toBe('function');
    expect(typeof barrel.createDefaultChipsetConfig).toBe('function');

    // Class and factory
    expect(barrel.Chipset).toBeDefined();
    expect(typeof barrel.createChipset).toBe('function');
  });

  it('createSentinel factory produces working instance', () => {
    const sentinel = createSentinel({ busConfig });
    expect(sentinel).toBeInstanceOf(Sentinel);

    // Verify it actually works
    const action = sentinel.assessFailure('bus-failure');
    expect(action.action).toBe('halt');
    expect(action.requiresHalt).toBe(true);
  });

  it('createChipset factory produces working instance', () => {
    const chipset = createChipset();
    expect(chipset).toBeInstanceOf(Chipset);

    // Verify it actually works
    const roster = chipset.getRoster();
    expect(roster).toHaveLength(10);
    expect(chipset.getTotalBudget()).toBe(0.59);
  });
});
