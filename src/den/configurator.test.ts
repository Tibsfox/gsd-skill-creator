/**
 * TDD tests for the Configurator agent.
 *
 * Covers topology selection, skill evaluation, chipset readiness,
 * JSONL config logging, and the Configurator class full pipeline.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  TOPOLOGY_PROFILES,
  selectTopology,
  evaluateSkillRequirements,
  checkChipsetReadiness,
  appendConfigEntry,
  readConfigLog,
  Configurator,
  createConfigurator,
  TopologyProfileSchema,
  SkillRequirementSchema,
  ChipsetReadinessSchema,
  ConfigEntrySchema,
  ConfiguratorConfigSchema,
} from './configurator.js';

describe('Configurator', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'den-configurator-'));
    logPath = join(tmpDir, 'logs', 'configurator.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // TOPOLOGY_PROFILES constant
  // ==========================================================================

  describe('TOPOLOGY_PROFILES', () => {
    it('should export 4 profiles', () => {
      expect(Object.keys(TOPOLOGY_PROFILES)).toHaveLength(4);
      expect(Object.keys(TOPOLOGY_PROFILES)).toEqual(
        expect.arrayContaining(['scout', 'patrol', 'squadron', 'fleet']),
      );
    });

    it('should have scout with 3 roles', () => {
      expect(TOPOLOGY_PROFILES.scout.name).toBe('Scout');
      expect(TOPOLOGY_PROFILES.scout.roles).toHaveLength(3);
      expect(TOPOLOGY_PROFILES.scout.roles).toContain('coordinator');
      expect(TOPOLOGY_PROFILES.scout.roles).toContain('executor');
      expect(TOPOLOGY_PROFILES.scout.roles).toContain('verifier');
    });

    it('should have patrol with 7 roles', () => {
      expect(TOPOLOGY_PROFILES.patrol.name).toBe('Patrol');
      expect(TOPOLOGY_PROFILES.patrol.roles).toHaveLength(7);
    });

    it('should have squadron with 10 roles', () => {
      expect(TOPOLOGY_PROFILES.squadron.name).toBe('Squadron');
      expect(TOPOLOGY_PROFILES.squadron.roles).toHaveLength(10);
    });

    it('should have fleet with 10 roles and Infinity maxPhases', () => {
      expect(TOPOLOGY_PROFILES.fleet.name).toBe('Fleet');
      expect(TOPOLOGY_PROFILES.fleet.roles).toHaveLength(10);
      expect(TOPOLOGY_PROFILES.fleet.maxPhases).toBe(Infinity);
    });

    it('should validate each profile through TopologyProfileSchema', () => {
      for (const key of Object.keys(TOPOLOGY_PROFILES) as Array<keyof typeof TOPOLOGY_PROFILES>) {
        const profile = TOPOLOGY_PROFILES[key];
        const result = TopologyProfileSchema.safeParse(profile);
        expect(result.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // selectTopology
  // ==========================================================================

  describe('selectTopology', () => {
    it('should select scout for phaseCount <= 3', () => {
      const profile = selectTopology(2);
      expect(profile.name).toBe('Scout');
      expect(profile.roles).toContain('coordinator');
    });

    it('should select scout for phaseCount = 3', () => {
      const profile = selectTopology(3);
      expect(profile.name).toBe('Scout');
    });

    it('should select patrol for phaseCount <= 10', () => {
      const profile = selectTopology(7);
      expect(profile.name).toBe('Patrol');
    });

    it('should select patrol for phaseCount = 10', () => {
      const profile = selectTopology(10);
      expect(profile.name).toBe('Patrol');
    });

    it('should select squadron for phaseCount <= 25', () => {
      const profile = selectTopology(15);
      expect(profile.name).toBe('Squadron');
    });

    it('should select fleet for phaseCount > 25', () => {
      const profile = selectTopology(30);
      expect(profile.name).toBe('Fleet');
    });

    it('should override with forceProfile', () => {
      const profile = selectTopology(99, { forceProfile: 'scout' });
      expect(profile.name).toBe('Scout');
    });

    it('should ignore invalid forceProfile and use phase count', () => {
      const profile = selectTopology(5, { forceProfile: 'nonexistent' });
      expect(profile.name).toBe('Patrol');
    });
  });

  // ==========================================================================
  // evaluateSkillRequirements
  // ==========================================================================

  describe('evaluateSkillRequirements', () => {
    it('should mark available skills correctly', () => {
      const reqs = evaluateSkillRequirements(
        ['skill-a', 'skill-b'],
        ['skill-c'],
        ['skill-a'],
      );

      expect(reqs).toHaveLength(3);

      const skillA = reqs.find((r) => r.skillName === 'skill-a');
      expect(skillA?.required).toBe(true);
      expect(skillA?.available).toBe(true);

      const skillB = reqs.find((r) => r.skillName === 'skill-b');
      expect(skillB?.required).toBe(true);
      expect(skillB?.available).toBe(false);

      const skillC = reqs.find((r) => r.skillName === 'skill-c');
      expect(skillC?.required).toBe(false);
      expect(skillC?.available).toBe(false);
    });

    it('should handle empty inputs', () => {
      const reqs = evaluateSkillRequirements([], [], []);
      expect(reqs).toHaveLength(0);
    });

    it('should validate each requirement through SkillRequirementSchema', () => {
      const reqs = evaluateSkillRequirements(['a'], ['b'], ['a', 'b']);
      for (const req of reqs) {
        const result = SkillRequirementSchema.safeParse(req);
        expect(result.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // checkChipsetReadiness
  // ==========================================================================

  describe('checkChipsetReadiness', () => {
    it('should return ready when all required skills available', () => {
      const allAvailable = [
        { skillName: 'a', required: true, available: true },
        { skillName: 'b', required: true, available: true },
        { skillName: 'c', required: false, available: false },
      ];
      const readiness = checkChipsetReadiness(TOPOLOGY_PROFILES.scout, allAvailable);

      expect(readiness.ready).toBe(true);
      expect(readiness.topology).toBe('Scout');
      expect(readiness.activeRoles).toEqual(TOPOLOGY_PROFILES.scout.roles);
      expect(readiness.missingSkills).toHaveLength(0);
      expect(readiness.reason).toContain('All required skills available');
    });

    it('should return not ready when required skills missing', () => {
      const missingRequired = [
        { skillName: 'a', required: true, available: true },
        { skillName: 'b', required: true, available: false },
        { skillName: 'c', required: true, available: false },
      ];
      const readiness = checkChipsetReadiness(TOPOLOGY_PROFILES.scout, missingRequired);

      expect(readiness.ready).toBe(false);
      expect(readiness.missingSkills).toContain('b');
      expect(readiness.missingSkills).toContain('c');
      expect(readiness.reason).toContain('Missing required skills');
    });

    it('should validate through ChipsetReadinessSchema', () => {
      const allAvailable = [
        { skillName: 'a', required: true, available: true },
      ];
      const readiness = checkChipsetReadiness(TOPOLOGY_PROFILES.patrol, allAvailable);
      const result = ChipsetReadinessSchema.safeParse(readiness);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // JSONL round-trip
  // ==========================================================================

  describe('JSONL config log', () => {
    it('should round-trip config entries', async () => {
      const entry1 = {
        timestamp: '20260220-130000',
        type: 'topology-select' as const,
        detail: { profile: 'scout', phaseCount: 2 },
      };
      const entry2 = {
        timestamp: '20260220-130001',
        type: 'readiness-check' as const,
        detail: { ready: true },
      };

      await appendConfigEntry(logPath, entry1);
      await appendConfigEntry(logPath, entry2);

      const entries = await readConfigLog(logPath);
      expect(entries).toHaveLength(2);
      expect(entries[0].type).toBe('topology-select');
      expect(entries[1].type).toBe('readiness-check');
    });

    it('should return empty array for missing log file', async () => {
      const entries = await readConfigLog(join(tmpDir, 'nonexistent.jsonl'));
      expect(entries).toHaveLength(0);
    });

    it('should validate entries through ConfigEntrySchema', async () => {
      const entry = {
        timestamp: '20260220-130000',
        type: 'config-change' as const,
        detail: { key: 'value' },
      };
      const result = ConfigEntrySchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Configurator class
  // ==========================================================================

  describe('Configurator class', () => {
    it('should validate config through ConfiguratorConfigSchema', () => {
      const result = ConfiguratorConfigSchema.safeParse({
        busConfig: {},
        logPath: '/tmp/test.jsonl',
        availableSkills: ['skill-a'],
      });
      expect(result.success).toBe(true);
    });

    it('should select topology for phase', () => {
      const configurator = new Configurator({
        busConfig: {},
        logPath,
        availableSkills: [],
      });
      const profile = configurator.selectTopologyForPhase(5);
      expect(profile.name).toBe('Patrol');
    });

    it('should evaluate skills against available', () => {
      const configurator = new Configurator({
        busConfig: {},
        logPath,
        availableSkills: ['skill-a', 'skill-c'],
      });
      const reqs = configurator.evaluateSkills(['skill-a', 'skill-b'], ['skill-c']);
      expect(reqs).toHaveLength(3);
      expect(reqs.find((r) => r.skillName === 'skill-a')?.available).toBe(true);
      expect(reqs.find((r) => r.skillName === 'skill-b')?.available).toBe(false);
      expect(reqs.find((r) => r.skillName === 'skill-c')?.available).toBe(true);
    });

    it('should run full pipeline: checkReadiness with all skills -> ready', async () => {
      const configurator = new Configurator({
        busConfig: {},
        logPath,
        availableSkills: ['skill-a', 'skill-b'],
      });
      const readiness = await configurator.checkReadiness(2, ['skill-a', 'skill-b']);
      expect(readiness.ready).toBe(true);
      expect(readiness.topology).toBe('Scout');
    });

    it('should run full pipeline: checkReadiness with missing required -> not ready', async () => {
      const configurator = new Configurator({
        busConfig: {},
        logPath,
        availableSkills: ['skill-a'],
      });
      const readiness = await configurator.checkReadiness(7, ['skill-a', 'skill-b']);
      expect(readiness.ready).toBe(false);
      expect(readiness.topology).toBe('Patrol');
      expect(readiness.missingSkills).toContain('skill-b');
    });

    it('should log decisions to JSONL', async () => {
      const configurator = new Configurator({
        busConfig: {},
        logPath,
        availableSkills: ['skill-a'],
      });
      await configurator.checkReadiness(2, ['skill-a']);
      const entries = await configurator.getLog();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // createConfigurator factory
  // ==========================================================================

  describe('createConfigurator', () => {
    it('should create and initialize a configurator', async () => {
      const configurator = await createConfigurator({
        busConfig: {},
        logPath,
        availableSkills: ['x'],
      });
      expect(configurator).toBeInstanceOf(Configurator);

      // Verify log directory was created
      const readiness = await configurator.checkReadiness(1, []);
      expect(readiness.ready).toBe(true);
    });
  });
});
