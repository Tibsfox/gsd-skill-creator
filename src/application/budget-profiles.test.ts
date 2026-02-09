import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILES, getBudgetProfile, getTierForSkill } from './budget-profiles.js';
import type { BudgetProfile } from '../types/application.js';

describe('DEFAULT_PROFILES', () => {
  it('contains gsd-executor profile', () => {
    expect(DEFAULT_PROFILES['gsd-executor']).toBeDefined();
    expect(DEFAULT_PROFILES['gsd-executor'].budgetPercent).toBeGreaterThanOrEqual(0.05);
  });

  it('contains gsd-planner profile', () => {
    expect(DEFAULT_PROFILES['gsd-planner']).toBeDefined();
  });

  it('contains gsd-verifier profile', () => {
    expect(DEFAULT_PROFILES['gsd-verifier']).toBeDefined();
  });

  it('all profiles have hardCeilingPercent > budgetPercent', () => {
    for (const [name, profile] of Object.entries(DEFAULT_PROFILES)) {
      expect(profile.hardCeilingPercent).toBeGreaterThan(profile.budgetPercent);
    }
  });

  it('all profiles have threshold warnings enabled', () => {
    for (const [name, profile] of Object.entries(DEFAULT_PROFILES)) {
      expect(profile.thresholds.warn50).toBe(true);
      expect(profile.thresholds.warn80).toBe(true);
      expect(profile.thresholds.warn100).toBe(true);
    }
  });
});

describe('getBudgetProfile', () => {
  it('returns profile for known agent', () => {
    const profile = getBudgetProfile('gsd-executor');
    expect(profile).toBeDefined();
    expect(profile!.name).toBe('gsd-executor');
  });

  it('returns undefined for unknown agent', () => {
    const profile = getBudgetProfile('nonexistent-agent');
    expect(profile).toBeUndefined();
  });
});

describe('getTierForSkill', () => {
  const testProfile: BudgetProfile = {
    name: 'test-agent',
    budgetPercent: 0.05,
    hardCeilingPercent: 0.08,
    tiers: {
      critical: ['auth-skill', 'security-skill'],
      standard: ['git-commit', 'code-review'],
      optional: ['fun-facts', 'emoji-helper'],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  };

  it('returns critical for critical skills', () => {
    expect(getTierForSkill(testProfile, 'auth-skill')).toBe('critical');
    expect(getTierForSkill(testProfile, 'security-skill')).toBe('critical');
  });

  it('returns standard for standard skills', () => {
    expect(getTierForSkill(testProfile, 'git-commit')).toBe('standard');
    expect(getTierForSkill(testProfile, 'code-review')).toBe('standard');
  });

  it('returns optional for optional skills', () => {
    expect(getTierForSkill(testProfile, 'fun-facts')).toBe('optional');
    expect(getTierForSkill(testProfile, 'emoji-helper')).toBe('optional');
  });

  it('returns standard for unlisted skills', () => {
    expect(getTierForSkill(testProfile, 'unknown-skill')).toBe('standard');
  });
});
