import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TeamMember, TeamTask } from '../types/team.js';

// ============================================================================
// Mock fs for agent resolution tests
// ============================================================================

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

import { existsSync, readdirSync } from 'fs';
const mockExistsSync = vi.mocked(existsSync);
const mockReaddirSync = vi.mocked(readdirSync);

// ============================================================================
// Mock embeddings and conflict detector for async validator tests
// ============================================================================

vi.mock('../embeddings/index.js', () => ({
  getEmbeddingService: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

vi.mock('../conflicts/conflict-detector.js', () => ({
  ConflictDetector: vi.fn(),
}));

// ============================================================================
// Mock team-validation module for validateTeamFull integration tests
// ============================================================================

vi.mock('../validation/team-validation.js', () => ({
  validateTeamConfig: vi.fn(),
  validateTopologyRules: vi.fn(),
}));

import { validateTeamConfig, validateTopologyRules } from '../validation/team-validation.js';
const mockValidateTeamConfig = vi.mocked(validateTeamConfig);
const mockValidateTopologyRules = vi.mocked(validateTopologyRules);

import { getEmbeddingService, cosineSimilarity } from '../embeddings/index.js';
import { ConflictDetector } from '../conflicts/conflict-detector.js';

const mockGetEmbeddingService = vi.mocked(getEmbeddingService);
const mockCosineSimilarity = vi.mocked(cosineSimilarity);
const MockConflictDetector = vi.mocked(ConflictDetector);

import {
  validateMemberAgents,
  detectTaskCycles,
  detectToolOverlap,
  detectSkillConflicts,
  detectRoleCoherence,
  validateTeamFull,
} from './team-validator.js';
import type {
  SkillConflictResult,
  RoleCoherenceResult,
  TeamFullValidationResult,
} from './team-validator.js';

// ============================================================================
// VALID-02: validateMemberAgents()
// ============================================================================

describe('validateMemberAgents', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const makeMember = (agentId: string): TeamMember => ({
    agentId,
    name: agentId,
  });

  it('returns found when agent file exists in first search directory', () => {
    const dirs = ['/project/.claude/agents'];
    mockExistsSync.mockImplementation((p) =>
      String(p) === '/project/.claude/agents/coder.md'
    );
    mockReaddirSync.mockReturnValue([]);

    const results = validateMemberAgents([makeMember('coder')], dirs);

    expect(results).toHaveLength(1);
    expect(results[0].agentId).toBe('coder');
    expect(results[0].status).toBe('found');
    expect(results[0].path).toBe('/project/.claude/agents/coder.md');
  });

  it('returns found when agent file exists in second search directory', () => {
    const dirs = ['/project/.claude/agents', '/home/user/.claude/agents'];
    mockExistsSync.mockImplementation((p) =>
      String(p) === '/home/user/.claude/agents/reviewer.md'
    );
    mockReaddirSync.mockReturnValue([]);

    const results = validateMemberAgents([makeMember('reviewer')], dirs);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('found');
    expect(results[0].path).toBe('/home/user/.claude/agents/reviewer.md');
  });

  it('returns missing when agent file not found in any directory', () => {
    const dirs = ['/project/.claude/agents', '/home/user/.claude/agents'];
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);

    const results = validateMemberAgents([makeMember('ghost')], dirs);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('missing');
    expect(results[0].searchedPaths).toEqual([
      '/project/.claude/agents/ghost.md',
      '/home/user/.claude/agents/ghost.md',
    ]);
  });

  it('includes all searched paths even for found agents', () => {
    const dirs = ['/dir-a', '/dir-b'];
    // Found in second dir, so first dir was also searched
    mockExistsSync.mockImplementation((p) =>
      String(p) === '/dir-b/agent.md'
    );
    mockReaddirSync.mockReturnValue([]);

    const results = validateMemberAgents([makeMember('agent')], dirs);

    expect(results[0].status).toBe('found');
    expect(results[0].searchedPaths).toEqual([
      '/dir-a/agent.md',
      '/dir-b/agent.md',
    ]);
  });

  it('provides suggestions with fuzzy-matched agent names when missing', () => {
    const dirs = ['/project/.claude/agents'];
    mockExistsSync.mockReturnValue(false);
    // Directory contains similar agent names
    mockReaddirSync.mockReturnValue([
      'my-agen.md',
      'other-agent.md',
      'unrelated.md',
    ] as unknown as ReturnType<typeof readdirSync>);

    const results = validateMemberAgents([makeMember('my-agent')], dirs);

    expect(results[0].status).toBe('missing');
    expect(results[0].suggestions).toBeDefined();
    expect(results[0].suggestions).toContain('my-agen');
  });

  it('returns correct results for multiple members (mix of found and missing)', () => {
    const dirs = ['/project/.claude/agents'];
    mockExistsSync.mockImplementation((p) =>
      String(p) === '/project/.claude/agents/alpha.md'
    );
    mockReaddirSync.mockReturnValue([
      'alpha.md',
    ] as unknown as ReturnType<typeof readdirSync>);

    const members = [makeMember('alpha'), makeMember('beta')];
    const results = validateMemberAgents(members, dirs);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('found');
    expect(results[1].status).toBe('missing');
  });

  it('uses both project scope and user scope directories by default', () => {
    // When no dirs provided, should use default directories
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);

    const results = validateMemberAgents([makeMember('test')]);

    expect(results[0].searchedPaths).toHaveLength(2);
    expect(results[0].searchedPaths[0]).toContain('.claude/agents');
    expect(results[0].searchedPaths[1]).toContain('.claude/agents');
  });
});

// ============================================================================
// VALID-05: detectTaskCycles()
// ============================================================================

describe('detectTaskCycles', () => {
  const makeTask = (id: string, blockedBy?: string[]): TeamTask => ({
    id,
    subject: `Task ${id}`,
    status: 'pending',
    blockedBy,
  });

  it('returns hasCycle: false for empty task array', () => {
    const result = detectTaskCycles([]);
    expect(result.hasCycle).toBe(false);
  });

  it('returns hasCycle: false for single task with no dependencies', () => {
    const result = detectTaskCycles([makeTask('A')]);
    expect(result.hasCycle).toBe(false);
  });

  it('returns hasCycle: false for valid sequential chain (A -> B -> C)', () => {
    const tasks = [
      makeTask('A'),
      makeTask('B', ['A']),
      makeTask('C', ['B']),
    ];

    const result = detectTaskCycles(tasks);
    expect(result.hasCycle).toBe(false);
  });

  it('returns hasCycle: true for two tasks with mutual blockedBy', () => {
    const tasks = [
      makeTask('A', ['B']),
      makeTask('B', ['A']),
    ];

    const result = detectTaskCycles(tasks);
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle).toContain('A');
    expect(result.cycle).toContain('B');
  });

  it('returns hasCycle: true for three-node cycle (A -> B -> C -> A)', () => {
    const tasks = [
      makeTask('A', ['C']),
      makeTask('B', ['A']),
      makeTask('C', ['B']),
    ];

    const result = detectTaskCycles(tasks);
    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle).toHaveLength(3);
  });

  it('returns hasCycle: false for diamond dependency', () => {
    // A blocks B and C, both block D
    const tasks = [
      makeTask('A'),
      makeTask('B', ['A']),
      makeTask('C', ['A']),
      makeTask('D', ['B', 'C']),
    ];

    const result = detectTaskCycles(tasks);
    expect(result.hasCycle).toBe(false);
  });

  it('handles tasks with undefined blockedBy gracefully', () => {
    const tasks: TeamTask[] = [
      { id: 'A', subject: 'Task A', status: 'pending' },
      { id: 'B', subject: 'Task B', status: 'pending', blockedBy: undefined },
    ];

    const result = detectTaskCycles(tasks);
    expect(result.hasCycle).toBe(false);
  });
});

// ============================================================================
// VALID-06: detectToolOverlap()
// ============================================================================

describe('detectToolOverlap', () => {
  const makeMemberWithTools = (agentId: string, tools?: string[]): TeamMember => {
    const member: TeamMember = { agentId, name: agentId };
    if (tools) {
      (member as Record<string, unknown>).tools = tools;
    }
    return member;
  };

  it('returns empty array when no members share write-capable tools', () => {
    const members = [
      makeMemberWithTools('a', ['Write']),
      makeMemberWithTools('b', ['Edit']),
    ];

    const result = detectToolOverlap(members);
    expect(result).toEqual([]);
  });

  it('returns overlap entry when two members both have Write tool', () => {
    const members = [
      makeMemberWithTools('a', ['Write', 'Read']),
      makeMemberWithTools('b', ['Write', 'Glob']),
    ];

    const result = detectToolOverlap(members);
    expect(result).toHaveLength(1);
    expect(result[0].tool).toBe('Write');
    expect(result[0].members).toContain('a');
    expect(result[0].members).toContain('b');
  });

  it('returns overlap entry when two members both have Edit tool', () => {
    const members = [
      makeMemberWithTools('a', ['Edit', 'Read']),
      makeMemberWithTools('b', ['Edit', 'Grep']),
    ];

    const result = detectToolOverlap(members);
    expect(result).toHaveLength(1);
    expect(result[0].tool).toBe('Edit');
  });

  it('returns overlap entries for multiple overlapping write tools', () => {
    const members = [
      makeMemberWithTools('a', ['Write', 'Edit']),
      makeMemberWithTools('b', ['Write', 'Edit']),
    ];

    const result = detectToolOverlap(members);
    expect(result).toHaveLength(2);

    const tools = result.map((r) => r.tool).sort();
    expect(tools).toEqual(['Edit', 'Write']);
  });

  it('ignores read-only tools even if shared', () => {
    const members = [
      makeMemberWithTools('a', ['Read', 'Glob', 'Grep']),
      makeMemberWithTools('b', ['Read', 'Glob', 'Grep']),
    ];

    const result = detectToolOverlap(members);
    expect(result).toEqual([]);
  });

  it('handles members with no tools (undefined) gracefully', () => {
    const members = [
      makeMemberWithTools('a'),
      makeMemberWithTools('b', ['Write']),
    ];

    const result = detectToolOverlap(members);
    expect(result).toEqual([]);
  });

  it('handles empty members array', () => {
    const result = detectToolOverlap([]);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// VALID-03: detectSkillConflicts()
// ============================================================================

describe('detectSkillConflicts', () => {
  const mockDetect = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockDetect.mockReset();
    MockConflictDetector.mockImplementation(function() {
      this.detect = mockDetect;
    });
  });

  it('returns empty conflicts when all members have different skills', async () => {
    mockDetect.mockResolvedValue({
      conflicts: [],
      skillCount: 3,
      pairsAnalyzed: 3,
      threshold: 0.85,
      analysisMethod: 'model',
    });

    const result = await detectSkillConflicts([
      { agentId: 'coder', skills: [{ name: 'typescript', description: 'Write TypeScript code' }] },
      { agentId: 'tester', skills: [{ name: 'testing', description: 'Write unit tests' }] },
      { agentId: 'reviewer', skills: [{ name: 'review', description: 'Review pull requests' }] },
    ]);

    expect(result.conflicts).toEqual([]);
    expect(result.totalSkillsAnalyzed).toBe(3);
  });

  it('detects conflict when two members have semantically similar skills', async () => {
    mockDetect.mockResolvedValue({
      conflicts: [
        {
          skillA: 'typescript',
          skillB: 'js-coding',
          similarity: 0.92,
          severity: 'high',
          overlappingTerms: ['code'],
          descriptionA: 'Write TypeScript code',
          descriptionB: 'Write JavaScript code',
        },
      ],
      skillCount: 2,
      pairsAnalyzed: 1,
      threshold: 0.85,
      analysisMethod: 'model',
    });

    const result = await detectSkillConflicts([
      { agentId: 'coder-a', skills: [{ name: 'typescript', description: 'Write TypeScript code' }] },
      { agentId: 'coder-b', skills: [{ name: 'js-coding', description: 'Write JavaScript code' }] },
    ]);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].memberA).toBe('coder-a');
    expect(result.conflicts[0].memberB).toBe('coder-b');
    expect(result.conflicts[0].skillA).toBe('typescript');
    expect(result.conflicts[0].skillB).toBe('js-coding');
    expect(result.conflicts[0].similarity).toBe(0.92);
    expect(result.conflicts[0].severity).toBe('high');
  });

  it('excludes conflicts for skills in the sharedSkills exclusion list', async () => {
    mockDetect.mockResolvedValue({
      conflicts: [
        {
          skillA: 'git-ops',
          skillB: 'version-control',
          similarity: 0.90,
          severity: 'medium',
          overlappingTerms: ['git'],
          descriptionA: 'Manage git operations',
          descriptionB: 'Handle version control',
        },
      ],
      skillCount: 2,
      pairsAnalyzed: 1,
      threshold: 0.85,
      analysisMethod: 'model',
    });

    const result = await detectSkillConflicts(
      [
        { agentId: 'dev-a', skills: [{ name: 'git-ops', description: 'Manage git operations' }] },
        { agentId: 'dev-b', skills: [{ name: 'version-control', description: 'Handle version control' }] },
      ],
      { sharedSkills: ['git-ops'] }
    );

    expect(result.conflicts).toEqual([]);
  });

  it('does not flag conflicts between skills belonging to the same member', async () => {
    // When both conflicting skills belong to the same member, they should be filtered out
    mockDetect.mockResolvedValue({
      conflicts: [
        {
          skillA: 'lint-code',
          skillB: 'format-code',
          similarity: 0.88,
          severity: 'medium',
          overlappingTerms: ['code'],
          descriptionA: 'Lint source code',
          descriptionB: 'Format source code',
        },
      ],
      skillCount: 2,
      pairsAnalyzed: 1,
      threshold: 0.85,
      analysisMethod: 'model',
    });

    const result = await detectSkillConflicts([
      {
        agentId: 'coder',
        skills: [
          { name: 'lint-code', description: 'Lint source code' },
          { name: 'format-code', description: 'Format source code' },
        ],
      },
    ]);

    expect(result.conflicts).toEqual([]);
  });

  it('returns empty conflicts for empty memberSkills array', async () => {
    const result = await detectSkillConflicts([]);

    expect(result.conflicts).toEqual([]);
    expect(result.totalSkillsAnalyzed).toBe(0);
    // Should not even create ConflictDetector
    expect(MockConflictDetector).not.toHaveBeenCalled();
  });

  it('returns empty conflicts for single member', async () => {
    const result = await detectSkillConflicts([
      { agentId: 'solo', skills: [{ name: 'coding', description: 'Write code' }] },
    ]);

    expect(result.conflicts).toEqual([]);
    expect(MockConflictDetector).not.toHaveBeenCalled();
  });

  it('passes threshold to ConflictDetector constructor', async () => {
    mockDetect.mockResolvedValue({
      conflicts: [],
      skillCount: 2,
      pairsAnalyzed: 1,
      threshold: 0.75,
      analysisMethod: 'model',
    });

    await detectSkillConflicts(
      [
        { agentId: 'a', skills: [{ name: 's1', description: 'Skill one' }] },
        { agentId: 'b', skills: [{ name: 's2', description: 'Skill two' }] },
      ],
      { threshold: 0.75 }
    );

    expect(MockConflictDetector).toHaveBeenCalledWith({ threshold: 0.75 });
  });
});

// ============================================================================
// VALID-04: detectRoleCoherence()
// ============================================================================

describe('detectRoleCoherence', () => {
  const mockEmbedBatch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockEmbedBatch.mockReset();
    mockGetEmbeddingService.mockResolvedValue({ embedBatch: mockEmbedBatch } as any);
  });

  it('returns empty warnings when all member descriptions are distinct', async () => {
    mockEmbedBatch.mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0, 1, 0], fromCache: false, method: 'model' },
    ]);
    mockCosineSimilarity.mockReturnValue(0.3);

    const result = await detectRoleCoherence([
      { agentId: 'coder', agentType: 'worker', description: 'Writes application code' },
      { agentId: 'reviewer', agentType: 'reviewer', description: 'Reviews pull requests' },
    ]);

    expect(result.warnings).toEqual([]);
  });

  it('warns when two members with DIFFERENT agentTypes have similar descriptions', async () => {
    mockEmbedBatch.mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0.99, 0.14, 0], fromCache: false, method: 'model' },
    ]);
    mockCosineSimilarity.mockReturnValue(0.92);

    const result = await detectRoleCoherence([
      { agentId: 'lead', agentType: 'coordinator', description: 'Manages code quality and reviews' },
      { agentId: 'reviewer', agentType: 'reviewer', description: 'Manages code quality and reviews' },
    ]);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].memberA).toBe('lead');
    expect(result.warnings[0].memberB).toBe('reviewer');
    expect(result.warnings[0].similarity).toBe(0.92);
    expect(result.warnings[0].suggestion).toContain('lead');
    expect(result.warnings[0].suggestion).toContain('reviewer');
    expect(result.warnings[0].suggestion).toContain('92%');
    expect(result.warnings[0].suggestion).toContain('differentiating');
  });

  it('does NOT warn when two members with the SAME agentType have similar descriptions', async () => {
    mockEmbedBatch.mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0.99, 0.14, 0], fromCache: false, method: 'model' },
    ]);
    mockCosineSimilarity.mockReturnValue(0.95);

    const result = await detectRoleCoherence([
      { agentId: 'worker-1', agentType: 'worker', description: 'Executes implementation tasks' },
      { agentId: 'worker-2', agentType: 'worker', description: 'Executes implementation tasks' },
    ]);

    expect(result.warnings).toEqual([]);
  });

  it('returns empty warnings when fewer than 2 members', async () => {
    const result = await detectRoleCoherence([
      { agentId: 'solo', agentType: 'worker', description: 'Does everything' },
    ]);

    expect(result.warnings).toEqual([]);
    // Should not call embedding service for < 2 members
    expect(mockGetEmbeddingService).not.toHaveBeenCalled();
  });

  it('returns empty warnings for empty members array', async () => {
    const result = await detectRoleCoherence([]);

    expect(result.warnings).toEqual([]);
    expect(mockGetEmbeddingService).not.toHaveBeenCalled();
  });

  it('uses configurable threshold (default 0.85)', async () => {
    mockEmbedBatch.mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0.9, 0.4, 0], fromCache: false, method: 'model' },
    ]);
    // Similarity above custom threshold (0.80) but below default (0.85)
    mockCosineSimilarity.mockReturnValue(0.82);

    // With default threshold (0.85), should NOT warn
    const resultDefault = await detectRoleCoherence([
      { agentId: 'a', agentType: 'coordinator', description: 'Coordinates tasks' },
      { agentId: 'b', agentType: 'worker', description: 'Coordinates tasks too' },
    ]);
    expect(resultDefault.warnings).toEqual([]);

    // With lower threshold (0.80), should warn
    const resultCustom = await detectRoleCoherence(
      [
        { agentId: 'a', agentType: 'coordinator', description: 'Coordinates tasks' },
        { agentId: 'b', agentType: 'worker', description: 'Coordinates tasks too' },
      ],
      { threshold: 0.80 }
    );
    expect(resultCustom.warnings).toHaveLength(1);
  });

  it('warning message includes both member agentIds and suggests role differentiation', async () => {
    mockEmbedBatch.mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0.99, 0.14, 0], fromCache: false, method: 'model' },
    ]);
    mockCosineSimilarity.mockReturnValue(0.88);

    const result = await detectRoleCoherence([
      { agentId: 'alpha', agentType: 'orchestrator', description: 'Manages workflow' },
      { agentId: 'beta', agentType: 'specialist', description: 'Manages workflow' },
    ]);

    expect(result.warnings).toHaveLength(1);
    const warning = result.warnings[0];
    expect(warning.suggestion).toContain('alpha');
    expect(warning.suggestion).toContain('beta');
    expect(warning.suggestion).toContain('orchestrator');
    expect(warning.suggestion).toContain('specialist');
    expect(warning.suggestion).toContain('88%');
    expect(warning.suggestion).toContain('differentiating');
  });
});

// ============================================================================
// validateTeamFull() Integration Tests
// ============================================================================

describe('validateTeamFull', () => {
  const validConfig = {
    name: 'test-team',
    description: 'A test team',
    leadAgentId: 'lead',
    createdAt: '2026-01-01T00:00:00Z',
    members: [
      { agentId: 'lead', name: 'Lead Agent', agentType: 'coordinator' },
      { agentId: 'worker-1', name: 'Worker One', agentType: 'worker' },
    ],
  };

  const mockDetect = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockDetect.mockReset();

    // Default: schema validation passes
    mockValidateTeamConfig.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      data: validConfig as any,
    });

    // Default: topology rules pass
    mockValidateTopologyRules.mockReturnValue({
      errors: [],
      warnings: [],
    });

    // Default: fs mocks for member resolution (all found)
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);

    // Default: conflict detector returns no conflicts
    MockConflictDetector.mockImplementation(function() {
      this.detect = mockDetect;
    });
    mockDetect.mockResolvedValue({
      conflicts: [],
      skillCount: 0,
      pairsAnalyzed: 0,
      threshold: 0.85,
      analysisMethod: 'model',
    });

    // Default: embeddings for role coherence
    const mockEmbedBatch = vi.fn().mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0, 1, 0], fromCache: false, method: 'model' },
    ]);
    mockGetEmbeddingService.mockResolvedValue({ embedBatch: mockEmbedBatch } as any);
    mockCosineSimilarity.mockReturnValue(0.3);
  });

  it('returns valid: true with empty errors/warnings for a well-formed config', async () => {
    const result = await validateTeamFull(validConfig);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('test-team');
  });

  it('returns valid: false with schema errors for invalid config', async () => {
    mockValidateTeamConfig.mockReturnValue({
      valid: false,
      errors: ['name: Team name is required'],
      warnings: [],
    });

    const result = await validateTeamFull({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name: Team name is required');
    // Should return early -- no other validators called
    expect(mockValidateTopologyRules).not.toHaveBeenCalled();
  });

  it('returns valid: false when leadAgentId does not match any member', async () => {
    mockValidateTeamConfig.mockReturnValue({
      valid: false,
      errors: ['leadAgentId "ghost" does not match any member\'s agentId'],
      warnings: [],
    });

    const result = await validateTeamFull({
      ...validConfig,
      leadAgentId: 'ghost',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('leadAgentId'))).toBe(true);
  });

  it('returns valid: false when topology rules are violated', async () => {
    mockValidateTopologyRules.mockReturnValue({
      errors: ['Leader-worker topology requires exactly 1 leader, found 0'],
      warnings: [],
    });

    const configWithTopology = { ...validConfig, topology: 'leader-worker' };
    mockValidateTeamConfig.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      data: configWithTopology as any,
    });

    const result = await validateTeamFull(configWithTopology);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('topology'))).toBe(true);
  });

  it('returns valid: true with warnings when tool overlap detected', async () => {
    // Two members sharing Write tool
    const configWithTools = {
      ...validConfig,
      members: [
        { agentId: 'lead', name: 'Lead', agentType: 'coordinator', tools: ['Write', 'Read'] },
        { agentId: 'worker-1', name: 'Worker', agentType: 'worker', tools: ['Write', 'Grep'] },
      ],
    };
    mockValidateTeamConfig.mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      data: configWithTools as any,
    });

    const result = await validateTeamFull(configWithTools);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('Write'))).toBe(true);
  });

  it('returns valid: false when task cycle detected', async () => {
    const tasks: TeamTask[] = [
      { id: 'A', subject: 'Task A', status: 'pending', blockedBy: ['B'] },
      { id: 'B', subject: 'Task B', status: 'pending', blockedBy: ['A'] },
    ];

    const result = await validateTeamFull(validConfig, { tasks });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('cycle') || e.includes('Cycle'))).toBe(true);
  });

  it('skips VALID-03 when memberSkills not provided', async () => {
    const result = await validateTeamFull(validConfig);

    expect(result.valid).toBe(true);
    // ConflictDetector should not be called when memberSkills is not provided
    expect(MockConflictDetector).not.toHaveBeenCalled();
  });

  it('skips VALID-04 when memberDescriptions not provided', async () => {
    const result = await validateTeamFull(validConfig);

    expect(result.valid).toBe(true);
    // Embedding service should not be called when memberDescriptions is not provided
    expect(mockGetEmbeddingService).not.toHaveBeenCalled();
  });

  it('skips VALID-05 when tasks not provided', async () => {
    const result = await validateTeamFull(validConfig);

    expect(result.valid).toBe(true);
    // No task cycle errors should exist
    expect(result.errors.filter((e) => e.includes('cycle') || e.includes('Cycle'))).toEqual([]);
  });

  it('populates memberResolution array for each member', async () => {
    const result = await validateTeamFull(validConfig);

    expect(result.memberResolution).toBeDefined();
    expect(result.memberResolution).toHaveLength(2);
    expect(result.memberResolution[0].agentId).toBe('lead');
    expect(result.memberResolution[1].agentId).toBe('worker-1');
  });

  it('aggregates warnings from skill conflicts when memberSkills provided', async () => {
    mockDetect.mockResolvedValue({
      conflicts: [
        {
          skillA: 'typescript',
          skillB: 'js-coding',
          similarity: 0.92,
          severity: 'high',
          overlappingTerms: ['code'],
          descriptionA: 'Write TypeScript code',
          descriptionB: 'Write JavaScript code',
        },
      ],
      skillCount: 2,
      pairsAnalyzed: 1,
      threshold: 0.85,
      analysisMethod: 'model',
    });

    const result = await validateTeamFull(validConfig, {
      memberSkills: [
        { agentId: 'lead', skills: [{ name: 'typescript', description: 'Write TypeScript code' }] },
        { agentId: 'worker-1', skills: [{ name: 'js-coding', description: 'Write JavaScript code' }] },
      ],
    });

    expect(result.valid).toBe(true); // Skill conflicts are warnings, not errors
    expect(result.warnings.some((w) => w.includes('typescript') || w.includes('skill'))).toBe(true);
  });

  it('aggregates warnings from role coherence when memberDescriptions provided', async () => {
    const mockEmbedBatch = vi.fn().mockResolvedValue([
      { embedding: [1, 0, 0], fromCache: false, method: 'model' },
      { embedding: [0.99, 0.14, 0], fromCache: false, method: 'model' },
    ]);
    mockGetEmbeddingService.mockResolvedValue({ embedBatch: mockEmbedBatch } as any);
    mockCosineSimilarity.mockReturnValue(0.92);

    const result = await validateTeamFull(validConfig, {
      memberDescriptions: [
        { agentId: 'lead', agentType: 'coordinator', description: 'Manages all code' },
        { agentId: 'worker-1', agentType: 'worker', description: 'Manages all code' },
      ],
    });

    expect(result.valid).toBe(true); // Role coherence issues are warnings, not errors
    expect(result.warnings.some((w) => w.includes('lead') || w.includes('differentiating'))).toBe(true);
  });
});
