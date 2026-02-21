/**
 * Topology profile activation validation tests.
 *
 * Proves that each of the 4 topology profiles (Scout/Patrol/Squadron/Fleet)
 * activates the correct role sets, responds to phase-count-based selection,
 * and maintains proper token budget allocations. Pure validation exercise
 * against existing configurator.ts and chipset.ts implementation.
 *
 * Requirements: PROF-01, PROF-02, PROF-03, PROF-04
 */

import { describe, it, expect } from 'vitest';

import {
  selectTopology,
  TOPOLOGY_PROFILES,
  checkChipsetReadiness,
  evaluateSkillRequirements,
} from './configurator.js';

import { DEN_STAFF_POSITIONS } from './chipset.js';

// ============================================================================
// Helpers
// ============================================================================

/** All 10 staff agent IDs from DEN_STAFF_POSITIONS */
const ALL_STAFF_IDS = new Set(DEN_STAFF_POSITIONS.map((p) => p.id));

// ============================================================================
// PROF-01: Scout profile
// ============================================================================

describe('PROF-01: Scout profile activation', () => {
  it('should activate exactly 3 roles: coordinator, executor, verifier', () => {
    const profile = selectTopology(1);
    expect(profile.name).toBe('Scout');
    expect(profile.roles).toHaveLength(3);
    expect(new Set(profile.roles)).toEqual(
      new Set(['coordinator', 'executor', 'verifier']),
    );
  });

  it('should have tokenBudget of 0.29', () => {
    const profile = selectTopology(2);
    expect(profile.tokenBudget).toBe(0.29);
  });

  it('should have maxPhases of 3', () => {
    const profile = selectTopology(3);
    expect(profile.maxPhases).toBe(3);
  });
});

// ============================================================================
// PROF-02: Patrol profile
// ============================================================================

describe('PROF-02: Patrol profile activation', () => {
  it('should activate exactly 7 roles including planner, relay, monitor, chronicler', () => {
    const profile = selectTopology(4);
    expect(profile.name).toBe('Patrol');
    expect(profile.roles).toHaveLength(7);
    const expected = new Set([
      'coordinator', 'executor', 'verifier',
      'planner', 'relay', 'monitor', 'chronicler',
    ]);
    expect(new Set(profile.roles)).toEqual(expected);
  });

  it('should have tokenBudget of 0.47', () => {
    const profile = selectTopology(7);
    expect(profile.tokenBudget).toBe(0.47);
  });

  it('should have maxPhases of 10', () => {
    const profile = selectTopology(10);
    expect(profile.maxPhases).toBe(10);
  });
});

// ============================================================================
// PROF-03: Squadron profile
// ============================================================================

describe('PROF-03: Squadron profile activation', () => {
  it('should activate all 10 v1.28 core roles', () => {
    const profile = selectTopology(11);
    expect(profile.name).toBe('Squadron');
    expect(profile.roles).toHaveLength(10);
    expect(new Set(profile.roles)).toEqual(ALL_STAFF_IDS);
  });

  it('should have tokenBudget of 0.59', () => {
    const profile = selectTopology(20);
    expect(profile.tokenBudget).toBe(0.59);
  });

  it('should have maxPhases of 25', () => {
    const profile = selectTopology(25);
    expect(profile.maxPhases).toBe(25);
  });
});

// ============================================================================
// PROF-04: Fleet profile
// ============================================================================

describe('PROF-04: Fleet profile activation', () => {
  it('should activate all 10 v1.28 core roles', () => {
    const profile = selectTopology(26);
    expect(profile.name).toBe('Fleet');
    expect(profile.roles).toHaveLength(10);
    expect(new Set(profile.roles)).toEqual(ALL_STAFF_IDS);
  });

  it('should have tokenBudget of 0.59', () => {
    const profile = selectTopology(50);
    expect(profile.tokenBudget).toBe(0.59);
  });

  it('should have maxPhases of Infinity (unlimited)', () => {
    const profile = selectTopology(100);
    expect(profile.maxPhases).toBe(Infinity);
  });
});

// ============================================================================
// Profile hierarchy and phase-count boundaries
// ============================================================================

describe('Profile hierarchy and boundaries', () => {
  it('should select Scout at boundary 3, Patrol at boundary 4', () => {
    expect(selectTopology(3).name).toBe('Scout');
    expect(selectTopology(4).name).toBe('Patrol');
  });

  it('should select Patrol at boundary 10, Squadron at boundary 11', () => {
    expect(selectTopology(10).name).toBe('Patrol');
    expect(selectTopology(11).name).toBe('Squadron');
  });

  it('should select Squadron at boundary 25, Fleet at boundary 26', () => {
    expect(selectTopology(25).name).toBe('Squadron');
    expect(selectTopology(26).name).toBe('Fleet');
  });

  it('should prove role set subset hierarchy: Scout < Patrol < Squadron = Fleet', () => {
    const scoutRoles = new Set(TOPOLOGY_PROFILES.scout.roles);
    const patrolRoles = new Set(TOPOLOGY_PROFILES.patrol.roles);
    const squadronRoles = new Set(TOPOLOGY_PROFILES.squadron.roles);
    const fleetRoles = new Set(TOPOLOGY_PROFILES.fleet.roles);

    // Scout is proper subset of Patrol
    for (const role of scoutRoles) {
      expect(patrolRoles.has(role)).toBe(true);
    }
    expect(scoutRoles.size).toBeLessThan(patrolRoles.size);

    // Patrol is proper subset of Squadron
    for (const role of patrolRoles) {
      expect(squadronRoles.has(role)).toBe(true);
    }
    expect(patrolRoles.size).toBeLessThan(squadronRoles.size);

    // Squadron equals Fleet (same role set)
    expect(squadronRoles.size).toBe(fleetRoles.size);
    for (const role of squadronRoles) {
      expect(fleetRoles.has(role)).toBe(true);
    }
  });
});

// ============================================================================
// Force override and readiness
// ============================================================================

describe('Force override and readiness', () => {
  it('should allow forceProfile override for each profile name', () => {
    const profileNames = ['scout', 'patrol', 'squadron', 'fleet'] as const;
    const expectedNames = ['Scout', 'Patrol', 'Squadron', 'Fleet'] as const;

    for (let i = 0; i < profileNames.length; i++) {
      // Force to this profile even with a mismatched phase count
      const profile = selectTopology(999, { forceProfile: profileNames[i] });
      expect(profile.name).toBe(expectedNames[i]);
    }
  });

  it('should have all profile roles be valid DEN_STAFF_POSITIONS agent IDs', () => {
    for (const key of Object.keys(TOPOLOGY_PROFILES) as Array<keyof typeof TOPOLOGY_PROFILES>) {
      const profile = TOPOLOGY_PROFILES[key];
      for (const role of profile.roles) {
        expect(ALL_STAFF_IDS.has(role)).toBe(true);
      }
    }
  });

  it('should return ready=true from checkChipsetReadiness when all skills available', () => {
    const profiles = [
      TOPOLOGY_PROFILES.scout,
      TOPOLOGY_PROFILES.patrol,
      TOPOLOGY_PROFILES.squadron,
      TOPOLOGY_PROFILES.fleet,
    ];

    for (const profile of profiles) {
      const requiredSkills = ['git-commit', 'testing'];
      const availableSkills = ['git-commit', 'testing', 'deploy'];
      const skillReqs = evaluateSkillRequirements(requiredSkills, [], availableSkills);
      const readiness = checkChipsetReadiness(profile, skillReqs);

      expect(readiness.ready).toBe(true);
      expect(readiness.topology).toBe(profile.name);
      expect(readiness.activeRoles).toHaveLength(profile.roles.length);
      expect(readiness.missingSkills).toHaveLength(0);
    }
  });
});
