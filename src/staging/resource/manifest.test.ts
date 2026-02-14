/**
 * Tests for the resource manifest generator.
 *
 * Verifies that generateResourceManifest composes all sub-analyzers
 * into a complete ResourceManifest with HITL predictions and queue context.
 *
 * @module staging/resource/manifest.test
 */

import { describe, it, expect, vi } from 'vitest';
import { generateResourceManifest } from './manifest.js';
import type { ManifestDeps } from './manifest.js';
import type {
  VisionAnalysis,
  SkillMatch,
  TopologyRecommendation,
  TokenBudgetBreakdown,
  ParallelDecomposition,
} from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

const REALISTIC_CONTENT = `# Authentication

- Implement JWT-based authentication with refresh tokens
- Add role-based access control for admin and user roles
- Integrate with OAuth2 providers for social login

# Data Storage

- Use PostgreSQL for primary data storage
- Implement Redis caching layer for session management
- Design database schema with migration support

# API Layer

- Build RESTful API endpoints for CRUD operations
- Add rate limiting and request validation
- Implement webhook notifications for external integrations
`;

const MOCK_SKILLS = [
  {
    name: 'jwt-auth',
    description: 'JWT authentication implementation',
    scope: 'project' as const,
    contentHash: 'abc123',
    tools: [],
    triggers: [],
  },
  {
    name: 'database-setup',
    description: 'Database schema and migration management',
    scope: 'user' as const,
    contentHash: 'def456',
    tools: [],
    triggers: [],
  },
];

function makeMockAnalysis(): VisionAnalysis {
  return {
    requirements: [
      { id: 'req-001', description: 'Implement JWT-based authentication', category: 'authentication', confidence: 0.8 },
      { id: 'req-002', description: 'Use PostgreSQL for storage', category: 'data-storage', confidence: 0.7 },
      { id: 'req-003', description: 'Build RESTful API endpoints', category: 'api-layer', confidence: 0.9 },
    ],
    complexity: [
      { signal: 'external-integration', level: 'medium', evidence: 'Integrate with OAuth2 providers' },
      { signal: 'multi-phase', level: 'medium', evidence: 'Design database schema with migration support' },
    ],
    ambiguities: [
      { text: 'maybe add caching', reason: 'Uncertain language: "maybe"', location: 'Data Storage section' },
    ],
    dependencies: [
      { name: 'PostgreSQL', type: 'database', confidence: 0.8 },
    ],
    overallComplexity: 'medium',
    summary: 'Vision covering Authentication, Data Storage, API Layer with 3 requirements and 2 complexity signals.',
  };
}

function makeMockSkillMatches(): SkillMatch[] {
  return [
    { skillName: 'jwt-auth', status: 'ready', relevance: 0.6, reason: 'Close match', scope: 'project' },
    { skillName: 'data-storage', status: 'missing', relevance: 0.05, reason: 'No match' },
    { skillName: 'api-layer', status: 'missing', relevance: 0.02, reason: 'No match' },
  ];
}

function makeMockTopology(): TopologyRecommendation {
  return {
    topology: 'pipeline',
    rationale: 'Pipeline recommended: 3 sequential requirements, multi-phase complexity',
    confidence: 0.75,
    agentCount: 3,
    teamSuggestion: 'pipeline-team',
  };
}

function makeMockBudget(): TokenBudgetBreakdown {
  return {
    total: 110000,
    categories: {
      'skill-loading': 8000,
      'planning': 20000,
      'execution': 40000,
      'research': 5000,
      'verification': 15000,
      'hitl': 5000,
      'safety-margin': 17000,
    },
    contextWindowSize: 200000,
    utilizationPercent: 55,
  };
}

function makeMockDecomposition(): ParallelDecomposition {
  return {
    subtasks: [
      { id: 'task-0', description: 'JWT auth', dependencies: [], sharedResources: [], estimatedComplexity: 'medium' },
      { id: 'task-1', description: 'PostgreSQL setup', dependencies: [], sharedResources: [], estimatedComplexity: 'low' },
      { id: 'task-2', description: 'REST API', dependencies: ['task-0', 'task-1'], sharedResources: [], estimatedComplexity: 'medium' },
    ],
    criticalPath: ['task-0', 'task-2'],
    maxParallelism: 2,
    sharedResources: [],
  };
}

function createMockDeps(): ManifestDeps {
  return {
    analyzeVision: vi.fn().mockReturnValue(makeMockAnalysis()),
    matchSkills: vi.fn().mockReturnValue(makeMockSkillMatches()),
    recommendTopology: vi.fn().mockReturnValue(makeMockTopology()),
    estimateBudget: vi.fn().mockReturnValue(makeMockBudget()),
    decomposeWork: vi.fn().mockReturnValue(makeMockDecomposition()),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('generateResourceManifest', () => {
  it('produces a complete manifest with all fields populated', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    expect(manifest.visionAnalysis).toBeDefined();
    expect(manifest.skillMatches).toBeDefined();
    expect(manifest.topology).toBeDefined();
    expect(manifest.tokenBudget).toBeDefined();
    expect(manifest.decomposition).toBeDefined();
    expect(manifest.hitlPredictions).toBeDefined();
    expect(manifest.queueContext).toBeDefined();
    expect(manifest.generatedAt).toBeDefined();
    expect(Array.isArray(manifest.hitlPredictions)).toBe(true);
    expect(typeof manifest.queueContext.priority).toBe('number');
    expect(typeof manifest.queueContext.estimatedDuration).toBe('string');
    expect(Array.isArray(manifest.queueContext.tags)).toBe(true);
  });

  it('uses analyzeVision output for visionAnalysis field', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    expect(manifest.visionAnalysis).toEqual(makeMockAnalysis());
    expect(deps.analyzeVision).toHaveBeenCalledWith(REALISTIC_CONTENT);
  });

  it('uses matchSkills output for skillMatches field', () => {
    const deps = createMockDeps();
    const mockAnalysis = makeMockAnalysis();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    expect(manifest.skillMatches).toEqual(makeMockSkillMatches());
    expect(deps.matchSkills).toHaveBeenCalledWith(
      mockAnalysis.requirements,
      MOCK_SKILLS,
    );
  });

  it('uses recommendTopology output for topology field', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    expect(manifest.topology).toEqual(makeMockTopology());
    expect(deps.recommendTopology).toHaveBeenCalledWith(makeMockAnalysis());
  });

  it('uses estimateBudget output with correct parameters', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS, contextWindowSize: 150000 },
      deps,
    );

    expect(manifest.tokenBudget).toEqual(makeMockBudget());
    expect(deps.estimateBudget).toHaveBeenCalledWith({
      complexity: 'medium',
      topology: 'pipeline',
      requirementCount: 3,
      skillCount: 2,
      contextWindowSize: 150000,
    });
  });

  it('uses decomposeWork output for decomposition field', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    expect(manifest.decomposition).toEqual(makeMockDecomposition());
    expect(deps.decomposeWork).toHaveBeenCalledWith(makeMockAnalysis());
  });

  it('generates HITL predictions from ambiguity markers', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    // The mock analysis has 1 ambiguity marker
    expect(manifest.hitlPredictions.length).toBeGreaterThanOrEqual(1);
    expect(manifest.hitlPredictions.some(
      (p) => p.includes('Decision checkpoint likely for:'),
    )).toBe(true);
  });

  it('generates more HITL predictions with high ambiguity', () => {
    const deps = createMockDeps();
    const highAmbiguityAnalysis = makeMockAnalysis();
    highAmbiguityAnalysis.ambiguities = [
      { text: 'maybe do this', reason: 'Uncertain', location: 'section 1' },
      { text: 'TBD later', reason: 'Placeholder', location: 'section 2' },
      { text: 'somehow integrate', reason: 'Vague', location: 'section 3' },
    ];
    (deps.analyzeVision as ReturnType<typeof vi.fn>).mockReturnValue(highAmbiguityAnalysis);

    const manifest = generateResourceManifest(
      { content: 'some content', availableSkills: [] },
      deps,
    );

    expect(manifest.hitlPredictions.length).toBeGreaterThanOrEqual(3);
  });

  it('generates queue context with priority, duration, and tags', () => {
    const deps = createMockDeps();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );

    const { queueContext } = manifest;
    // Medium complexity -> priority 3
    expect(queueContext.priority).toBe(3);
    expect(queueContext.estimatedDuration).toMatch(/\d+/);
    expect(queueContext.tags.length).toBeGreaterThan(0);
    // Tags extracted from unique requirement categories
    expect(queueContext.tags).toContain('authentication');
    expect(queueContext.tags).toContain('data-storage');
    expect(queueContext.tags).toContain('api-layer');
  });

  it('sets generatedAt as ISO 8601 timestamp', () => {
    const deps = createMockDeps();
    const before = new Date().toISOString();
    const manifest = generateResourceManifest(
      { content: REALISTIC_CONTENT, availableSkills: MOCK_SKILLS },
      deps,
    );
    const after = new Date().toISOString();

    // Validate ISO 8601 format
    expect(() => new Date(manifest.generatedAt)).not.toThrow();
    expect(manifest.generatedAt >= before).toBe(true);
    expect(manifest.generatedAt <= after).toBe(true);
  });

  it('produces manifest with minimal defaults for empty content', () => {
    const deps = createMockDeps();
    const emptyAnalysis: VisionAnalysis = {
      requirements: [],
      complexity: [],
      ambiguities: [],
      dependencies: [],
      overallComplexity: 'low',
      summary: 'Empty vision document.',
    };
    (deps.analyzeVision as ReturnType<typeof vi.fn>).mockReturnValue(emptyAnalysis);
    (deps.matchSkills as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (deps.recommendTopology as ReturnType<typeof vi.fn>).mockReturnValue({
      topology: 'single', rationale: 'Default', confidence: 1.0, agentCount: 1,
    });
    (deps.estimateBudget as ReturnType<typeof vi.fn>).mockReturnValue({
      total: 80000, categories: {
        'skill-loading': 4000, 'planning': 12000, 'execution': 32000,
        'research': 4000, 'verification': 8000, 'hitl': 4000, 'safety-margin': 16000,
      },
      contextWindowSize: 200000, utilizationPercent: 40,
    });
    (deps.decomposeWork as ReturnType<typeof vi.fn>).mockReturnValue({
      subtasks: [], criticalPath: [], maxParallelism: 0, sharedResources: [],
    });

    const manifest = generateResourceManifest(
      { content: '', availableSkills: [] },
      deps,
    );

    expect(manifest.visionAnalysis).toEqual(emptyAnalysis);
    expect(manifest.skillMatches).toEqual([]);
    expect(manifest.hitlPredictions).toEqual([]);
    expect(manifest.queueContext.priority).toBe(4); // low complexity -> priority 4
    expect(manifest.queueContext.tags).toEqual([]);
    expect(manifest.generatedAt).toBeDefined();
  });

  it('uses injected deps instead of real implementations', () => {
    const deps = createMockDeps();
    generateResourceManifest(
      { content: 'test content', availableSkills: MOCK_SKILLS },
      deps,
    );

    expect(deps.analyzeVision).toHaveBeenCalledTimes(1);
    expect(deps.matchSkills).toHaveBeenCalledTimes(1);
    expect(deps.recommendTopology).toHaveBeenCalledTimes(1);
    expect(deps.estimateBudget).toHaveBeenCalledTimes(1);
    expect(deps.decomposeWork).toHaveBeenCalledTimes(1);
  });
});
