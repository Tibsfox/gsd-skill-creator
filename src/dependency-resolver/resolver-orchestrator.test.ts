import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ResolverOrchestrator,
  ResolverError,
} from './resolver-orchestrator.js';
import type { ResolutionRequest } from './resolver-orchestrator.js';

// ─── Mock dependencies ─────────────────────────────────────────────────────────

vi.mock('./proposal-dry-runner.js', () => ({
  runProposalDryRun: vi.fn(),
}));

vi.mock('./hitl-approval-gate.js', () => ({
  presentForApproval: vi.fn(),
}));

// Mock node:fs so applyChange doesn't touch the real filesystem
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn().mockResolvedValue('{"dependencies":{"old-pkg":"1.0.0"}}'),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

import { runProposalDryRun } from './proposal-dry-runner.js';
import { presentForApproval } from './hitl-approval-gate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<ResolutionRequest> = {}): ResolutionRequest {
  return {
    packages: [{ packageName: 'old-pkg', proposedVersion: '2.0.0', changeType: 'update' }],
    ecosystem: 'npm',
    manifestPath: '/tmp/test/package.json',
    lockfilePath: '/tmp/test/package-lock.json',
    projectRoot: '/tmp/test',
    userResponse: 'yes',
    explicitMultiConsent: false,
    ...overrides,
  };
}

function makeProposal(pkgName: string, hasConflicts = false) {
  return {
    packageName: pkgName,
    ecosystem: 'npm' as const,
    currentVersion: '1.0.0',
    proposedVersion: '2.0.0',
    changeType: 'update' as const,
    dryRunResult: {
      ecosystem: 'npm' as const,
      hasConflicts,
      conflictSummary: hasConflicts ? ['ERESOLVE'] : [],
      rawOutput: '',
    },
    backupPath: '/tmp/backup',
  };
}

function makeApproval(approved: boolean, proposal: ReturnType<typeof makeProposal>) {
  return {
    approved,
    proposal,
    approvedAt: approved ? '2026-03-03T12:00:00Z' : null,
    rejectionReason: approved ? null : 'no',
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResolverOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ResolverError BATCH_NOT_CONSENTED for 2+ packages without consent', async () => {
    const orchestrator = new ResolverOrchestrator();
    const request = makeRequest({
      packages: [
        { packageName: 'pkg-a', proposedVersion: '2.0.0', changeType: 'update' },
        { packageName: 'pkg-b', proposedVersion: '3.0.0', changeType: 'update' },
      ],
      explicitMultiConsent: false,
    });
    await expect(orchestrator.resolve(request)).rejects.toThrow(ResolverError);
    try {
      await orchestrator.resolve(request);
    } catch (err) {
      expect(err instanceof ResolverError).toBe(true);
      expect((err as ResolverError).code).toBe('BATCH_NOT_CONSENTED');
    }
  });

  it('allows 2+ packages when explicitMultiConsent=true', async () => {
    const proposal1 = makeProposal('pkg-a');
    const proposal2 = makeProposal('pkg-b');
    vi.mocked(runProposalDryRun)
      .mockResolvedValueOnce(proposal1)
      .mockResolvedValueOnce(proposal2);
    vi.mocked(presentForApproval)
      .mockReturnValue(makeApproval(true, proposal1))
      .mockReturnValue(makeApproval(true, proposal2));
    const orchestrator = new ResolverOrchestrator();
    const request = makeRequest({
      packages: [
        { packageName: 'pkg-a', proposedVersion: '2.0.0', changeType: 'update' },
        { packageName: 'pkg-b', proposedVersion: '3.0.0', changeType: 'update' },
      ],
      explicitMultiConsent: true,
    });
    const outcome = await orchestrator.resolve(request);
    expect(outcome).toBeDefined();
  });

  it('runs full pipeline: dry-run then HITL for single package', async () => {
    const proposal = makeProposal('old-pkg');
    vi.mocked(runProposalDryRun).mockResolvedValueOnce(proposal);
    vi.mocked(presentForApproval).mockReturnValueOnce(makeApproval(true, proposal));
    const orchestrator = new ResolverOrchestrator();
    await orchestrator.resolve(makeRequest());
    expect(runProposalDryRun).toHaveBeenCalledTimes(1);
    expect(presentForApproval).toHaveBeenCalledTimes(1);
  });

  it('adds package to appliedPackages when user approves', async () => {
    const proposal = makeProposal('old-pkg');
    vi.mocked(runProposalDryRun).mockResolvedValueOnce(proposal);
    vi.mocked(presentForApproval).mockReturnValueOnce(makeApproval(true, proposal));
    const orchestrator = new ResolverOrchestrator();
    const outcome = await orchestrator.resolve(makeRequest());
    expect(outcome.appliedPackages).toContain('old-pkg');
    expect(outcome.rejectedPackages).not.toContain('old-pkg');
  });

  it('adds package to rejectedPackages when user rejects — no filesystem write', async () => {
    const proposal = makeProposal('old-pkg');
    vi.mocked(runProposalDryRun).mockResolvedValueOnce(proposal);
    vi.mocked(presentForApproval).mockReturnValueOnce(makeApproval(false, proposal));
    const orchestrator = new ResolverOrchestrator();
    const outcome = await orchestrator.resolve(makeRequest({ userResponse: 'no' }));
    expect(outcome.rejectedPackages).toContain('old-pkg');
    expect(outcome.appliedPackages).not.toContain('old-pkg');
  });

  it('dry-run conflict → package in errors, HITL not called', async () => {
    const proposal = makeProposal('old-pkg', true); // hasConflicts=true
    vi.mocked(runProposalDryRun).mockResolvedValueOnce(proposal);
    const orchestrator = new ResolverOrchestrator();
    const outcome = await orchestrator.resolve(makeRequest());
    expect(outcome.errors.some(e => e.packageName === 'old-pkg')).toBe(true);
    expect(presentForApproval).not.toHaveBeenCalled();
    expect(outcome.appliedPackages).not.toContain('old-pkg');
  });

  it('runProposalDryRun error → package in errors', async () => {
    vi.mocked(runProposalDryRun).mockRejectedValueOnce(new Error('DryRun failed'));
    const orchestrator = new ResolverOrchestrator();
    const outcome = await orchestrator.resolve(makeRequest());
    expect(outcome.errors.some(e => e.packageName === 'old-pkg')).toBe(true);
  });

  it('outcome.proposals contains all produced proposals', async () => {
    const proposal = makeProposal('old-pkg');
    vi.mocked(runProposalDryRun).mockResolvedValueOnce(proposal);
    vi.mocked(presentForApproval).mockReturnValueOnce(makeApproval(true, proposal));
    const orchestrator = new ResolverOrchestrator();
    const outcome = await orchestrator.resolve(makeRequest());
    expect(outcome.proposals).toHaveLength(1);
    expect(outcome.proposals[0].packageName).toBe('old-pkg');
  });

  it('outcome.request matches the input request', async () => {
    const proposal = makeProposal('old-pkg');
    vi.mocked(runProposalDryRun).mockResolvedValueOnce(proposal);
    vi.mocked(presentForApproval).mockReturnValueOnce(makeApproval(false, proposal));
    const orchestrator = new ResolverOrchestrator();
    const request = makeRequest();
    const outcome = await orchestrator.resolve(request);
    expect(outcome.request).toBe(request);
  });
});
