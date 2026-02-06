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

import {
  validateMemberAgents,
  detectTaskCycles,
  detectToolOverlap,
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
