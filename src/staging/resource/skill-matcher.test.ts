/**
 * Tests for the skill cross-reference matcher.
 *
 * Verifies that domain requirements are matched against available skills
 * with correct status classification (ready/flagged/missing/recommended)
 * and relevance scoring.
 *
 * @module staging/resource/skill-matcher.test
 */

import { describe, it, expect } from 'vitest';
import { matchSkills } from './skill-matcher.js';
import type { SkillMatcherDeps } from './skill-matcher.js';
import type { DomainRequirement } from './types.js';
import type { SkillCapability } from '../../capabilities/types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeReq(overrides: Partial<DomainRequirement> & { id: string }): DomainRequirement {
  return {
    description: 'A requirement description',
    category: 'general',
    confidence: 0.8,
    ...overrides,
  };
}

function makeSkill(overrides: Partial<SkillCapability> & { name: string }): SkillCapability {
  return {
    description: '',
    scope: 'project',
    contentHash: 'abc123',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('matchSkills', () => {
  // --------------------------------------------------------------------------
  // Test 1: Ready match
  // --------------------------------------------------------------------------
  it('returns ready status when requirement closely matches a skill', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Run test suites coverage',
        category: 'testing',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'testing-runner',
        description: 'Run test suites coverage',
        scope: 'project',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('ready');
    expect(result[0].relevance).toBeGreaterThanOrEqual(0.5);
    expect(result[0].skillName).toBe('testing-runner');
  });

  // --------------------------------------------------------------------------
  // Test 2: Missing skill
  // --------------------------------------------------------------------------
  it('returns missing status when no skill matches the requirement', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Process credit card payments securely',
        category: 'payment-processing',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'git-commit',
        description: 'Creates conventional commits with proper formatting',
      }),
      makeSkill({
        name: 'code-review',
        description: 'Reviews code changes for quality and style',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('missing');
    expect(result[0].skillName).toBe('payment-processing');
  });

  // --------------------------------------------------------------------------
  // Test 3: Recommended match
  // --------------------------------------------------------------------------
  it('returns recommended status for partial overlap', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Deploy server production hosting',
        category: 'deploy',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'deploy-helper',
        description: 'Server pipeline automation cloud tools',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('recommended');
    expect(result[0].relevance).toBeGreaterThanOrEqual(0.3);
    expect(result[0].relevance).toBeLessThan(0.5);
    expect(result[0].skillName).toBe('deploy-helper');
  });

  // --------------------------------------------------------------------------
  // Test 4: Flagged match
  // --------------------------------------------------------------------------
  it('returns flagged status for very low relevance match', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Render data charts graphics',
        category: 'visualization',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'markdown-formatter',
        description: 'Format data output tables render text',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('flagged');
    expect(result[0].relevance).toBeGreaterThanOrEqual(0.1);
    expect(result[0].relevance).toBeLessThan(0.3);
  });

  // --------------------------------------------------------------------------
  // Test 5: Multiple requirements with mixed matches
  // --------------------------------------------------------------------------
  it('handles multiple requirements with mixed match statuses', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Run test suites coverage',
        category: 'testing',
      }),
      makeReq({
        id: 'req-002',
        description: 'Handle cryptocurrency wallet transactions',
        category: 'blockchain',
      }),
      makeReq({
        id: 'req-003',
        description: 'Deploy server production hosting',
        category: 'deploy',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'testing-runner',
        description: 'Run test suites coverage',
      }),
      makeSkill({
        name: 'deploy-helper',
        description: 'Server pipeline automation cloud tools',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(3);

    const testing = result.find((m) => m.skillName === 'testing-runner');
    const blockchain = result.find((m) => m.skillName === 'blockchain');
    const deploy = result.find((m) => m.skillName === 'deploy-helper');

    expect(testing?.status).toBe('ready');
    expect(blockchain?.status).toBe('missing');
    expect(deploy?.status).toBe('recommended');
  });

  // --------------------------------------------------------------------------
  // Test 6: No requirements
  // --------------------------------------------------------------------------
  it('returns empty array for empty requirements', () => {
    const skills: SkillCapability[] = [
      makeSkill({ name: 'anything', description: 'Some skill' }),
    ];

    const result = matchSkills([], skills);

    expect(result).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 7: No available skills
  // --------------------------------------------------------------------------
  it('returns all missing when no skills are available', () => {
    const requirements: DomainRequirement[] = [
      makeReq({ id: 'req-001', category: 'testing', description: 'Run tests' }),
      makeReq({ id: 'req-002', category: 'deployment', description: 'Deploy app' }),
    ];

    const result = matchSkills(requirements, []);

    expect(result).toHaveLength(2);
    expect(result.every((m) => m.status === 'missing')).toBe(true);
    expect(result[0].skillName).toBe('testing');
    expect(result[1].skillName).toBe('deployment');
  });

  // --------------------------------------------------------------------------
  // Test 8: Duplicate skill names -- project scope takes priority
  // --------------------------------------------------------------------------
  it('prefers project scope when duplicate skill names exist', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Format commit messages following conventions',
        category: 'git',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'beautiful-commits',
        description: 'Creates beautiful conventional commit messages for git',
        scope: 'user',
      }),
      makeSkill({
        name: 'beautiful-commits',
        description: 'Creates beautiful conventional commit messages for git',
        scope: 'project',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(1);
    expect(result[0].scope).toBe('project');
  });

  // --------------------------------------------------------------------------
  // Test 9: Scope annotation
  // --------------------------------------------------------------------------
  it('includes scope from the matched skill in the result', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Create and manage test suites',
        category: 'testing',
      }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({
        name: 'test-runner',
        description: 'Manages and runs test suites',
        scope: 'user',
      }),
    ];

    const result = matchSkills(requirements, skills);

    expect(result).toHaveLength(1);
    expect(result[0].scope).toBe('user');
  });

  // --------------------------------------------------------------------------
  // Test 10: Relevance scoring -- higher word overlap = higher score
  // --------------------------------------------------------------------------
  it('scores higher relevance for skills with more word overlap', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Run vitest test suites and check coverage reports',
        category: 'testing',
      }),
    ];

    const exactSkill = makeSkill({
      name: 'vitest-test-runner',
      description: 'Run vitest test suites and generate coverage reports',
    });

    const vagueSkill = makeSkill({
      name: 'general-runner',
      description: 'Runs various tasks in the project environment',
    });

    const exactResult = matchSkills(requirements, [exactSkill]);
    const vagueResult = matchSkills(requirements, [vagueSkill]);

    expect(exactResult[0].relevance).toBeGreaterThan(vagueResult[0].relevance);
  });

  // --------------------------------------------------------------------------
  // Test 11: Custom computeRelevance via dependency injection
  // --------------------------------------------------------------------------
  it('uses injected computeRelevance for scoring', () => {
    const requirements: DomainRequirement[] = [
      makeReq({ id: 'req-001', category: 'anything', description: 'Any requirement' }),
    ];

    const skills: SkillCapability[] = [
      makeSkill({ name: 'any-skill', description: 'Any skill description' }),
    ];

    const deps: SkillMatcherDeps = {
      computeRelevance: () => 0.75,
    };

    const result = matchSkills(requirements, skills, deps);

    expect(result).toHaveLength(1);
    expect(result[0].relevance).toBe(0.75);
    expect(result[0].status).toBe('ready');
  });

  // --------------------------------------------------------------------------
  // Test 12: Category keyword boost
  // --------------------------------------------------------------------------
  it('boosts relevance when skill name contains category keyword', () => {
    const requirements: DomainRequirement[] = [
      makeReq({
        id: 'req-001',
        description: 'Ensure code quality through automated checks',
        category: 'linting',
      }),
    ];

    // Skill with category keyword in name gets boosted
    const withKeyword = makeSkill({
      name: 'eslint-linting',
      description: 'Runs automated code checks',
    });

    // Skill without category keyword in name
    const withoutKeyword = makeSkill({
      name: 'code-checker',
      description: 'Runs automated code checks',
    });

    const boostedResult = matchSkills(requirements, [withKeyword]);
    const normalResult = matchSkills(requirements, [withoutKeyword]);

    expect(boostedResult[0].relevance).toBeGreaterThan(normalResult[0].relevance);
  });
});
