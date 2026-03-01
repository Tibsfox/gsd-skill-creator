/**
 * Chipset configuration tests -- TDD RED phase.
 *
 * Tests for chipset config with 10 skills, 3 agents, and token budget.
 */
import { describe, it, expect } from 'vitest';

import { chipsetConfig } from './chipset-config.js';
import { senseiAgent, instructorAgent, builderAgent } from './agent-definitions.js';

describe('Chipset Configuration', () => {
  it('has name "mind-body"', () => {
    expect(chipsetConfig.name).toBe('mind-body');
  });

  it('has version string', () => {
    expect(chipsetConfig.version).toBeDefined();
    expect(typeof chipsetConfig.version).toBe('string');
  });

  it('has a description', () => {
    expect(chipsetConfig.description.length).toBeGreaterThan(0);
  });

  it('has exactly 10 skills', () => {
    expect(chipsetConfig.skills).toHaveLength(10);
  });

  it('skills include all expected IDs', () => {
    const ids = chipsetConfig.skills.map((s) => s.id);
    expect(ids).toContain('breath-guide');
    expect(ids).toContain('meditation-guide');
    expect(ids).toContain('yoga-guide');
    expect(ids).toContain('pilates-guide');
    expect(ids).toContain('martial-arts-guide');
    expect(ids).toContain('tai-chi-guide');
    expect(ids).toContain('recovery-guide');
    expect(ids).toContain('philosophy-guide');
    expect(ids).toContain('practice-builder');
    expect(ids).toContain('safety-warden');
  });

  it('each skill has id, domain, and description', () => {
    for (const skill of chipsetConfig.skills) {
      expect(skill.id.length).toBeGreaterThan(0);
      expect(skill.domain.length).toBeGreaterThan(0);
      expect(skill.description.length).toBeGreaterThan(0);
    }
  });

  it('has exactly 3 agents', () => {
    expect(chipsetConfig.agents).toHaveLength(3);
  });

  it('agents include sensei, instructor, builder', () => {
    const roles = chipsetConfig.agents.map((a) => a.role);
    expect(roles).toContain('sensei');
    expect(roles).toContain('instructor');
    expect(roles).toContain('builder');
  });

  it('tokenBudget.sessionCeiling is 8000', () => {
    expect(chipsetConfig.tokenBudget.sessionCeiling).toBe(8000);
  });

  it('tokenBudget.safetyWardenReserve is 500', () => {
    expect(chipsetConfig.tokenBudget.safetyWardenReserve).toBe(500);
  });

  it('tokenBudget.journalOverhead is 200', () => {
    expect(chipsetConfig.tokenBudget.journalOverhead).toBe(200);
  });
});

describe('Agent Definitions', () => {
  describe('senseiAgent', () => {
    it('has role "sensei"', () => {
      expect(senseiAgent.role).toBe('sensei');
    });

    it('has 5 skills: breath, meditation, martial-arts, tai-chi, philosophy', () => {
      expect(senseiAgent.skills).toHaveLength(5);
      expect(senseiAgent.skills).toContain('breath-guide');
      expect(senseiAgent.skills).toContain('meditation-guide');
      expect(senseiAgent.skills).toContain('martial-arts-guide');
      expect(senseiAgent.skills).toContain('tai-chi-guide');
      expect(senseiAgent.skills).toContain('philosophy-guide');
    });

    it('has a personality description', () => {
      expect(senseiAgent.personality.length).toBeGreaterThan(0);
    });
  });

  describe('instructorAgent', () => {
    it('has role "instructor"', () => {
      expect(instructorAgent.role).toBe('instructor');
    });

    it('has 4 skills: yoga, pilates, recovery, safety-warden', () => {
      expect(instructorAgent.skills).toHaveLength(4);
      expect(instructorAgent.skills).toContain('yoga-guide');
      expect(instructorAgent.skills).toContain('pilates-guide');
      expect(instructorAgent.skills).toContain('recovery-guide');
      expect(instructorAgent.skills).toContain('safety-warden');
    });

    it('has a personality description', () => {
      expect(instructorAgent.personality.length).toBeGreaterThan(0);
    });
  });

  describe('builderAgent', () => {
    it('has role "builder"', () => {
      expect(builderAgent.role).toBe('builder');
    });

    it('has 1 skill: practice-builder', () => {
      expect(builderAgent.skills).toHaveLength(1);
      expect(builderAgent.skills).toContain('practice-builder');
    });

    it('has a personality description', () => {
      expect(builderAgent.personality.length).toBeGreaterThan(0);
    });
  });
});
