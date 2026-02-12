/**
 * Tests for team estimate CLI command.
 *
 * Mocks TeamStore to isolate CLI logic from filesystem.
 * Verifies exit codes, output formatting, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions so they are available when vi.mock factories run
const { mockLog, mockExists, mockRead, mockList } = vi.hoisted(() => ({
  mockLog: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
  mockExists: vi.fn(),
  mockRead: vi.fn(),
  mockList: vi.fn(),
}));

// Mock @clack/prompts to capture output
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: mockLog,
}));

// Mock picocolors to pass-through strings
vi.mock('picocolors', () => ({
  default: {
    bold: (s: string) => s,
    dim: (s: string) => s,
    cyan: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    bgCyan: (s: string) => s,
    black: (s: string) => s,
  },
}));

// Mock TeamStore
vi.mock('../../teams/team-store.js', () => {
  return {
    TeamStore: class MockTeamStore {
      exists = mockExists;
      read = mockRead;
      list = mockList;
    },
    getTeamsBasePath: () => '/mock/teams',
  };
});

import { teamEstimateCommand } from './team-estimate.js';

describe('teamEstimateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 1 when no team name provided', async () => {
    const result = await teamEstimateCommand([]);
    expect(result).toBe(1);
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining('Usage:'),
    );
  });

  it('returns 1 when team not found', async () => {
    mockExists.mockResolvedValue(false);
    mockList.mockResolvedValue(['other-team']);

    const result = await teamEstimateCommand(['nonexistent']);
    expect(result).toBe(1);
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining('not found'),
    );
  });

  it('returns 0 and shows output for valid team', async () => {
    mockExists.mockResolvedValue(true);
    mockRead.mockResolvedValue({
      name: 'test-team',
      leadAgentId: 'leader',
      createdAt: '2025-01-01T00:00:00Z',
      topology: 'leader-worker',
      members: [
        { agentId: 'leader', name: 'Leader', agentType: 'leader', model: 'sonnet' },
        { agentId: 'worker-1', name: 'Worker 1', agentType: 'worker', model: 'sonnet' },
      ],
    });

    const result = await teamEstimateCommand(['test-team']);
    expect(result).toBe(0);
  });

  it('output includes per-member cost lines', async () => {
    mockExists.mockResolvedValue(true);
    mockRead.mockResolvedValue({
      name: 'test-team',
      leadAgentId: 'leader',
      createdAt: '2025-01-01T00:00:00Z',
      topology: 'leader-worker',
      members: [
        { agentId: 'leader', name: 'Leader', agentType: 'leader', model: 'sonnet' },
        { agentId: 'worker-1', name: 'Worker 1', agentType: 'worker', model: 'sonnet' },
      ],
    });

    await teamEstimateCommand(['test-team']);

    // Collect all message calls into a single string for searching
    const allMessages = mockLog.message.mock.calls.map((c: unknown[]) => c[0]).join('\n');

    // Should contain agent IDs
    expect(allMessages).toContain('leader');
    expect(allMessages).toContain('worker-1');

    // Should contain cost formatting ($ sign)
    expect(allMessages).toContain('$');

    // Should contain token formatting (~ prefix)
    expect(allMessages).toContain('~');
  });

  it('output includes total cost line', async () => {
    mockExists.mockResolvedValue(true);
    mockRead.mockResolvedValue({
      name: 'test-team',
      leadAgentId: 'leader',
      createdAt: '2025-01-01T00:00:00Z',
      topology: 'pipeline',
      members: [
        { agentId: 'stage-1', name: 'Stage 1', model: 'sonnet' },
      ],
    });

    await teamEstimateCommand(['test-team']);

    const allMessages = mockLog.message.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(allMessages).toContain('Total Estimated Cost:');
    expect(allMessages).toContain('Total Estimated Tokens:');
  });
});
