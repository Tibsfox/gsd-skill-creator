/**
 * Tests for candidate-selector: formatting and interactive selection.
 *
 * formatCandidateTable is tested as a pure function.
 * selectCandidates requires mocking @clack/prompts for interactive behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RankedCandidate } from './pattern-scorer.js';

// Mock @clack/prompts before importing the module under test
vi.mock('@clack/prompts', () => ({
  log: {
    message: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
  multiselect: vi.fn(),
  isCancel: vi.fn(() => false),
}));

import * as p from '@clack/prompts';
import { formatCandidateTable, selectCandidates } from './candidate-selector.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeCandidate(overrides: Partial<RankedCandidate> = {}): RankedCandidate {
  return {
    patternKey: 'tool:bigram:Read->Edit',
    label: 'read-edit-workflow',
    type: 'tool-bigram',
    score: 0.72,
    scoreBreakdown: { frequency: 0.8, crossProject: 0.6, recency: 0.9, consistency: 0.5 },
    evidence: {
      projects: ['proj-a', 'proj-b'],
      sessions: ['s1', 's2', 's3'],
      totalOccurrences: 15,
      exampleInvocations: ['Read->Edit'],
      lastSeen: '2026-02-01T00:00:00Z',
      firstSeen: '2026-01-01T00:00:00Z',
    },
    suggestedName: 'read-edit-workflow',
    suggestedDescription: 'Read then Edit workflow',
    ...overrides,
  };
}

const trigramCandidate = makeCandidate({
  patternKey: 'tool:trigram:Read->Edit->Bash',
  label: 'read-edit-bash-workflow',
  type: 'tool-trigram',
  score: 0.65,
  evidence: {
    projects: ['proj-a', 'proj-b', 'proj-c'],
    sessions: ['s1', 's2'],
    totalOccurrences: 10,
    exampleInvocations: ['Read->Edit->Bash'],
    lastSeen: '2026-02-01T00:00:00Z',
    firstSeen: '2026-01-10T00:00:00Z',
  },
});

const bashCandidate = makeCandidate({
  patternKey: 'bash:git-workflow',
  label: 'git-workflow-patterns',
  type: 'bash-pattern',
  score: 0.58,
  evidence: {
    projects: ['proj-a'],
    sessions: ['s1', 's2', 's3', 's4'],
    totalOccurrences: 22,
    exampleInvocations: ['git add && git commit'],
    lastSeen: '2026-02-05T00:00:00Z',
    firstSeen: '2026-01-15T00:00:00Z',
  },
});

// ============================================================================
// formatCandidateTable
// ============================================================================

describe('formatCandidateTable', () => {
  it('returns empty string for empty array', () => {
    expect(formatCandidateTable([])).toBe('');
  });

  it('produces one line per candidate', () => {
    const candidates = [makeCandidate(), trigramCandidate, bashCandidate];
    const result = formatCandidateTable(candidates);
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('contains score values for each candidate', () => {
    const candidates = [makeCandidate(), trigramCandidate, bashCandidate];
    const result = formatCandidateTable(candidates);
    expect(result).toContain('0.720');
    expect(result).toContain('0.650');
    expect(result).toContain('0.580');
  });

  it('contains type abbreviations', () => {
    const candidates = [makeCandidate(), trigramCandidate, bashCandidate];
    const result = formatCandidateTable(candidates);
    expect(result).toContain('tool-bi');
    expect(result).toContain('tool-tri');
    expect(result).toContain('bash');
  });

  it('contains candidate labels', () => {
    const candidates = [makeCandidate(), trigramCandidate];
    const result = formatCandidateTable(candidates);
    expect(result).toContain('read-edit-workflow');
    expect(result).toContain('read-edit-bash-workflow');
  });

  it('contains project and session counts', () => {
    const candidates = [makeCandidate()]; // 2 projects, 3 sessions
    const result = formatCandidateTable(candidates);
    expect(result).toContain('2p');
    expect(result).toContain('3s');
  });

  it('handles single candidate', () => {
    const result = formatCandidateTable([bashCandidate]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(1);
    expect(result).toContain('git-workflow-patterns');
  });
});

// ============================================================================
// selectCandidates
// ============================================================================

describe('selectCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.isCancel).mockReturnValue(false);
  });

  it('returns empty array for empty candidates', async () => {
    const result = await selectCandidates([]);
    expect(result).toEqual([]);
    expect(p.multiselect).not.toHaveBeenCalled();
  });

  it('returns selected candidates by index', async () => {
    const candidates = [makeCandidate(), trigramCandidate, bashCandidate];
    vi.mocked(p.multiselect).mockResolvedValue([0, 2]);

    const result = await selectCandidates(candidates);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(candidates[0]);
    expect(result[1]).toBe(candidates[2]);
  });

  it('displays header and table before prompting', async () => {
    const candidates = [makeCandidate()];
    vi.mocked(p.multiselect).mockResolvedValue([0]);

    await selectCandidates(candidates);

    // Header, table, blank line = 3 calls to log.message
    expect(p.log.message).toHaveBeenCalledTimes(3);
  });

  it('passes correct options to multiselect', async () => {
    const candidates = [makeCandidate()];
    vi.mocked(p.multiselect).mockResolvedValue([]);

    await selectCandidates(candidates);

    expect(p.multiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select patterns to generate skills from (space to toggle):',
        required: false,
        options: [
          expect.objectContaining({
            value: 0,
            label: 'read-edit-workflow',
            hint: expect.stringContaining('0.720'),
          }),
        ],
      }),
    );
  });

  it('returns empty array when user cancels', async () => {
    const candidates = [makeCandidate(), trigramCandidate];
    const cancelSymbol = Symbol('cancel');
    vi.mocked(p.multiselect).mockResolvedValue(cancelSymbol as any);
    vi.mocked(p.isCancel).mockReturnValue(true);

    const result = await selectCandidates(candidates);

    expect(result).toEqual([]);
  });

  it('returns all candidates when all selected', async () => {
    const candidates = [makeCandidate(), trigramCandidate, bashCandidate];
    vi.mocked(p.multiselect).mockResolvedValue([0, 1, 2]);

    const result = await selectCandidates(candidates);

    expect(result).toHaveLength(3);
    expect(result).toEqual(candidates);
  });
});
