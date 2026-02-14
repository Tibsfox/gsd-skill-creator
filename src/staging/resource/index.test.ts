/**
 * Tests for the resource analysis barrel index and integration.
 *
 * Verifies all exports are accessible from the barrel, const arrays
 * are complete, and the end-to-end flow through generateResourceManifest
 * produces consistent results across all sub-modules.
 *
 * @module staging/resource/index.test
 */

import { describe, it, expect } from 'vitest';
import {
  // Value exports
  COMPLEXITY_LEVELS,
  TOPOLOGY_TYPES,
  BUDGET_CATEGORIES,
  SKILL_MATCH_STATUSES,
  EXTERNAL_DEP_TYPES,
  analyzeVision,
  matchSkills,
  recommendTopology,
  estimateBudget,
  decomposeWork,
  generateResourceManifest,
} from './index.js';

import type {
  // Type-only exports
  DomainRequirement,
  ComplexitySignal,
  AmbiguityMarker,
  ExternalDependency,
  VisionAnalysis,
  SkillMatch,
  SkillMatchStatus,
  TopologyRecommendation,
  TopologyType,
  TokenBudgetBreakdown,
  BudgetCategory,
  Subtask,
  ParallelDecomposition,
  ResourceManifest,
  ComplexityLevel,
  ManifestDeps,
  SkillMatcherDeps,
  BudgetEstimateOptions,
} from './index.js';

// ============================================================================
// Re-export Verification
// ============================================================================

describe('barrel index re-exports', () => {
  it('exports all value functions', () => {
    expect(typeof analyzeVision).toBe('function');
    expect(typeof matchSkills).toBe('function');
    expect(typeof recommendTopology).toBe('function');
    expect(typeof estimateBudget).toBe('function');
    expect(typeof decomposeWork).toBe('function');
    expect(typeof generateResourceManifest).toBe('function');
  });

  it('exports all const arrays', () => {
    expect(Array.isArray(COMPLEXITY_LEVELS)).toBe(true);
    expect(Array.isArray(TOPOLOGY_TYPES)).toBe(true);
    expect(Array.isArray(BUDGET_CATEGORIES)).toBe(true);
    expect(Array.isArray(SKILL_MATCH_STATUSES)).toBe(true);
    expect(Array.isArray(EXTERNAL_DEP_TYPES)).toBe(true);
  });

  it('type-only exports compile correctly', () => {
    // These exist purely for TypeScript compilation. If they failed
    // to export, the import at top of file would cause a compile error.
    // Use type annotations to exercise each type.
    const req: DomainRequirement = {
      id: 'test', description: 'test', category: 'test', confidence: 0.5,
    };
    const signal: ComplexitySignal = {
      signal: 'test', level: 'low', evidence: 'test',
    };
    const marker: AmbiguityMarker = {
      text: 'test', reason: 'test', location: 'test',
    };
    const dep: ExternalDependency = {
      name: 'test', type: 'api', confidence: 0.5,
    };
    const match: SkillMatch = {
      skillName: 'test', status: 'ready', relevance: 0.5, reason: 'test',
    };
    const subtask: Subtask = {
      id: 'test', description: 'test', dependencies: [],
      sharedResources: [], estimatedComplexity: 'low',
    };

    // Type compatibility assertions (runtime: just check they're defined)
    expect(req.id).toBe('test');
    expect(signal.signal).toBe('test');
    expect(marker.text).toBe('test');
    expect(dep.name).toBe('test');
    expect(match.skillName).toBe('test');
    expect(subtask.id).toBe('test');
  });
});

// ============================================================================
// Const Array Completeness
// ============================================================================

describe('const array completeness', () => {
  it('COMPLEXITY_LEVELS has all 4 levels', () => {
    expect(COMPLEXITY_LEVELS).toEqual(['low', 'medium', 'high', 'critical']);
  });

  it('TOPOLOGY_TYPES has all 5 types', () => {
    expect(TOPOLOGY_TYPES).toEqual(['single', 'pipeline', 'map-reduce', 'router', 'hybrid']);
  });

  it('BUDGET_CATEGORIES has all 7 categories', () => {
    expect(BUDGET_CATEGORIES).toEqual([
      'skill-loading', 'planning', 'execution',
      'research', 'verification', 'hitl', 'safety-margin',
    ]);
  });

  it('SKILL_MATCH_STATUSES has all 4 statuses', () => {
    expect(SKILL_MATCH_STATUSES).toEqual(['ready', 'flagged', 'missing', 'recommended']);
  });

  it('EXTERNAL_DEP_TYPES has all 5 types', () => {
    expect(EXTERNAL_DEP_TYPES).toEqual(['api', 'library', 'service', 'database', 'tool']);
  });
});

// ============================================================================
// End-to-End Flow
// ============================================================================

describe('end-to-end flow', () => {
  const VISION_CONTENT = `# User Management

- Implement user registration with email verification
- Add password reset flow with secure tokens
- Build admin dashboard for user management

# Notification System

- Send email notifications via SendGrid API
- Implement in-app notification feed
- Add push notification support for mobile

# Data Layer

- Design PostgreSQL schema for user profiles
- Implement Redis caching for session data
- Build data export pipeline for compliance
`;

  const MOCK_SKILLS = [
    {
      name: 'email-notifications',
      description: 'Email notification sending with template support',
      scope: 'project' as const,
      contentHash: 'abc123',
      tools: [],
      triggers: [],
    },
    {
      name: 'user-auth',
      description: 'User authentication and registration flows',
      scope: 'user' as const,
      contentHash: 'def456',
      tools: [],
      triggers: [],
    },
  ];

  it('produces a complete manifest from realistic input', () => {
    const manifest = generateResourceManifest({
      content: VISION_CONTENT,
      availableSkills: MOCK_SKILLS,
    });

    // All top-level fields present and correctly typed
    expect(manifest.visionAnalysis).toBeDefined();
    expect(manifest.visionAnalysis.requirements.length).toBeGreaterThan(0);
    expect(manifest.visionAnalysis.complexity.length).toBeGreaterThanOrEqual(0);
    expect(manifest.visionAnalysis.overallComplexity).toBeDefined();
    expect(COMPLEXITY_LEVELS).toContain(manifest.visionAnalysis.overallComplexity);

    expect(manifest.skillMatches).toBeDefined();
    expect(manifest.skillMatches.length).toBeGreaterThan(0);
    for (const match of manifest.skillMatches) {
      expect(SKILL_MATCH_STATUSES).toContain(match.status);
      expect(match.relevance).toBeGreaterThanOrEqual(0);
      expect(match.relevance).toBeLessThanOrEqual(1);
    }

    expect(manifest.topology).toBeDefined();
    expect(TOPOLOGY_TYPES).toContain(manifest.topology.topology);
    expect(manifest.topology.confidence).toBeGreaterThanOrEqual(0.3);
    expect(manifest.topology.confidence).toBeLessThanOrEqual(1);
    expect(manifest.topology.agentCount).toBeGreaterThanOrEqual(1);

    expect(manifest.tokenBudget).toBeDefined();
    expect(manifest.tokenBudget.total).toBeGreaterThan(0);
    const categorySum = Object.values(manifest.tokenBudget.categories).reduce(
      (sum, val) => sum + val, 0,
    );
    expect(categorySum).toBe(manifest.tokenBudget.total);
    for (const cat of BUDGET_CATEGORIES) {
      expect(manifest.tokenBudget.categories[cat]).toBeGreaterThanOrEqual(0);
    }

    expect(manifest.decomposition).toBeDefined();
    expect(manifest.decomposition.subtasks.length).toBeGreaterThan(0);
    expect(manifest.decomposition.criticalPath.length).toBeGreaterThan(0);
    expect(manifest.decomposition.maxParallelism).toBeGreaterThanOrEqual(1);

    expect(Array.isArray(manifest.hitlPredictions)).toBe(true);

    expect(manifest.queueContext.priority).toBeGreaterThanOrEqual(1);
    expect(manifest.queueContext.priority).toBeLessThanOrEqual(4);
    expect(manifest.queueContext.estimatedDuration).toMatch(/\d+/);
    expect(manifest.queueContext.tags.length).toBeGreaterThan(0);

    expect(manifest.generatedAt).toBeDefined();
    expect(() => new Date(manifest.generatedAt)).not.toThrow();
  });

  it('cross-module type consistency: VisionAnalysis flows through all sub-analyzers', () => {
    const manifest = generateResourceManifest({
      content: VISION_CONTENT,
      availableSkills: MOCK_SKILLS,
    });

    // Requirements extracted from content feed into skill matcher
    const reqCount = manifest.visionAnalysis.requirements.length;
    expect(manifest.skillMatches.length).toBe(reqCount);

    // Decomposition has one subtask per requirement
    expect(manifest.decomposition.subtasks.length).toBe(reqCount);

    // Budget uses the correct complexity level
    const complexityToUtilization: Record<string, number> = {
      low: 40, medium: 55, high: 70, critical: 80,
    };
    expect(manifest.tokenBudget.utilizationPercent).toBeCloseTo(
      complexityToUtilization[manifest.visionAnalysis.overallComplexity], 1,
    );

    // Tags match requirement categories
    const expectedCategories = [
      ...new Set(manifest.visionAnalysis.requirements.map((r) => r.category)),
    ];
    expect(manifest.queueContext.tags).toEqual(expectedCategories);
  });
});
