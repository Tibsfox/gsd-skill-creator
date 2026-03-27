import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DiffSummary, FileDiff, GateDecision } from '../types.js';

// ---------------------------------------------------------------------------
// Mock child_process and fs before importing module under test
// ---------------------------------------------------------------------------

const { mockExecSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: mockExecSync,
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn((p: string) => {
    if (typeof p === 'string' && p.includes('config.json')) return true;
    return false;
  }),
  mkdirSync: vi.fn(),
  appendFileSync: vi.fn(),
  readFileSync: vi.fn(() => JSON.stringify({
    repo: 'test-repo',
    upstream: 'https://github.com/upstream/repo.git',
    origin: 'https://github.com/user/repo.git',
    devBranch: 'dev',
    mainBranch: 'main',
    gates: { mergeToMain: true, prToUpstream: true },
    worktreeRoot: '/tmp/worktrees/test-repo',
    installedAt: '2026-02-26T10:00:00Z',
    lastSync: null,
  })),
}));

// Import after mocks
import { contribute } from './contribute.js';
import type { ContributeResult } from './contribute.js';
import type { GatePromptFn, PRPromptFn, PRGateDecision, GatePresentation } from '../gates/hitl-gate.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDiffSummary(overrides: Partial<DiffSummary> = {}): DiffSummary {
  return {
    filesChanged: 3,
    insertions: 42,
    deletions: 7,
    files: [{ path: 'src/foo.ts', status: 'added', insertions: 42, deletions: 0 }],
    ...overrides,
  };
}

function makeApproveGate1(): GateDecision {
  return {
    gate: 'merge-to-main',
    approved: true,
    timestamp: new Date().toISOString(),
    summary: makeDiffSummary(),
  };
}

function makeRejectGate1(): GateDecision {
  return {
    gate: 'merge-to-main',
    approved: false,
    timestamp: new Date().toISOString(),
    summary: makeDiffSummary(),
  };
}

function makeSyncGate1(): GateDecision {
  return {
    gate: 'merge-to-main',
    approved: false,
    timestamp: new Date().toISOString(),
    summary: makeDiffSummary(),
    humanNotes: 'sync',
  };
}

function makeApprovePR(): PRGateDecision {
  return {
    gate: 'pr-to-upstream',
    approved: true,
    timestamp: new Date().toISOString(),
    summary: makeDiffSummary(),
    prTitle: 'feat: add foo support',
    prDescription: '## Summary\nAdded foo support.',
  };
}

function makeRejectPR(): PRGateDecision {
  return {
    gate: 'pr-to-upstream',
    approved: false,
    timestamp: new Date().toISOString(),
    summary: makeDiffSummary(),
    prTitle: '',
    prDescription: '',
  };
}

function makeEditedPR(): PRGateDecision {
  return {
    gate: 'pr-to-upstream',
    approved: true,
    timestamp: new Date().toISOString(),
    summary: makeDiffSummary(),
    prTitle: 'edited: custom title',
    prDescription: 'Edited by human before submission.',
  };
}

function setupCleanRepoMocks(): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (cmd.includes('rev-parse --git-dir')) return '.git';
    if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'dev';
    if (cmd.includes('status --porcelain=v2')) return '';
    if (cmd.includes('remote -v')) {
      return 'origin\thttps://github.com/user/repo.git (fetch)\nupstream\thttps://github.com/upstream/repo.git (fetch)\n';
    }
    if (cmd.includes('config remote.')) return '+refs/heads/*:refs/remotes/origin/*';
    if (cmd.includes('rev-list --left-right')) return '0\t0';
    if (cmd.includes('rev-list --count main..dev')) return '3';
    if (cmd.includes('rev-list --count dev..upstream/main')) return '0';
    if (cmd.includes('rev-list --count upstream/main..main')) return '3';
    if (cmd.includes('diff --stat')) {
      return ' src/foo.ts | 10 +++++++---\n src/bar.ts | 5 +++++\n 2 files changed, 12 insertions(+), 3 deletions(-)';
    }
    if (cmd.includes('diff --name-status')) return 'A\tsrc/foo.ts\nM\tsrc/bar.ts';
    if (cmd.includes('diff --numstat')) return '10\t3\tsrc/foo.ts\n5\t0\tsrc/bar.ts';
    if (cmd.includes('log --format=')) {
      return 'abc1234|feat: add foo|Alice|2026-02-26T10:00:00Z\ndef5678|fix: fix bar|Bob|2026-02-26T11:00:00Z\nghi9012|test: add tests|Alice|2026-02-26T12:00:00Z';
    }
    if (cmd.includes('merge --no-commit --no-ff')) return '';
    if (cmd.includes('merge --no-ff')) return '';
    if (cmd.includes('merge --abort')) return '';
    if (cmd.includes('checkout')) return '';
    if (cmd.includes('cat-file -s')) return '500';
    if (cmd.includes('which gh')) return '/usr/bin/gh';
    if (cmd.includes('gh pr create')) return 'https://github.com/upstream/repo/pull/42';
    if (cmd.includes('push')) return '';
    return '';
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('contribute', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    setupCleanRepoMocks();
  });

  it('happy path: Gate 1 approve -> merge -> Gate 2 approve -> PR created', async () => {
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(makeApproveGate1());
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue(makeApprovePR());

    const result = await contribute('/repo', promptFn, prPromptFn);

    expect(result).toBeDefined();
    expect(result.merged).toBe(true);
    expect(result.prCreated).toBe(true);
    expect(promptFn).toHaveBeenCalledTimes(1);
    expect(prPromptFn).toHaveBeenCalledTimes(1);
  });

  it('Gate 1 reject: returns early, repo unchanged, no merge, prGate undefined', async () => {
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(makeRejectGate1());
    const prPromptFn: PRPromptFn = vi.fn();

    const result = await contribute('/repo', promptFn, prPromptFn);

    expect(result.merged).toBe(false);
    expect(result.prCreated).toBe(false);
    // prPromptFn was never called — no Gate 2 presentation
    expect(prPromptFn).not.toHaveBeenCalled();
  });

  it('Gate 1 approve, Gate 2 reject: merge happened, but no PR created, no upstream contact', async () => {
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(makeApproveGate1());
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue(makeRejectPR());

    const result = await contribute('/repo', promptFn, prPromptFn);

    expect(result.merged).toBe(true);
    expect(result.prCreated).toBe(false);

    // Verify no push or gh commands after Gate 2 rejection
    const calls = mockExecSync.mock.calls.map((c: unknown[]) => String(c[0]));
    const gate2RejectIdx = calls.length; // after all calls
    const pushCalls = calls.filter((c: string) => c.includes('push') || c.includes('gh pr create'));
    // No push or PR creation calls should occur after gate 2 presentation
    expect(pushCalls).toHaveLength(0);
  });

  it('Gate 2 with edits: human edits title/description before approval', async () => {
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(makeApproveGate1());
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue(makeEditedPR());

    const result = await contribute('/repo', promptFn, prPromptFn);

    expect(result.merged).toBe(true);
    expect(result.prCreated).toBe(true);
    expect(result.prTitle).toBe('edited: custom title');
    expect(result.prDescription).toBe('Edited by human before submission.');
  });

  it('state verification: repo state checked before and after each gate', async () => {
    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(makeApproveGate1());
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue(makeApprovePR());

    await contribute('/repo', promptFn, prPromptFn);

    // detectState called multiple times (before gate 1, after merge, before gate 2)
    const statusCalls = mockExecSync.mock.calls.filter(
      (c: unknown[]) => String(c[0]).includes('status --porcelain=v2'),
    );
    expect(statusCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('JSONL logging: gate operations logged', async () => {
    const fs = await import('node:fs');
    const appendSpy = vi.mocked(fs.appendFileSync);
    appendSpy.mockClear();

    const promptFn: GatePromptFn = vi.fn().mockResolvedValue(makeApproveGate1());
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue(makeApprovePR());

    await contribute('/repo', promptFn, prPromptFn);

    // appendFileSync should have been called for JSONL logging
    expect(appendSpy).toHaveBeenCalled();
    const logCalls = appendSpy.mock.calls.filter(
      (c: unknown[]) => String(c[0]).includes('operations.jsonl'),
    );
    expect(logCalls.length).toBeGreaterThan(0);
  });

  it('Gate 1 sync-first: sync runs, then gate re-presents', async () => {
    let callCount = 0;
    const promptFn: GatePromptFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: request sync
        return Promise.resolve(makeSyncGate1());
      }
      // Second call: approve after sync
      return Promise.resolve(makeApproveGate1());
    });
    const prPromptFn: PRPromptFn = vi.fn().mockResolvedValue(makeApprovePR());

    const result = await contribute('/repo', promptFn, prPromptFn);

    // Gate 1 promptFn called twice (first sync-first, then approve)
    expect(promptFn).toHaveBeenCalledTimes(2);
    expect(result.merged).toBe(true);
  });
});
