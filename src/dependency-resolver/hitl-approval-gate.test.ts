import { describe, it, expect } from 'vitest';
import { presentForApproval, formatProposal, HITLApprovalGate } from './hitl-approval-gate.js';
import type { ResolutionProposal } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProposal(overrides: Partial<ResolutionProposal> = {}): ResolutionProposal {
  return {
    packageName: 'old-logger',
    ecosystem: 'npm',
    currentVersion: '1.0.0',
    proposedVersion: '2.0.0',
    changeType: 'update',
    dryRunResult: {
      ecosystem: 'npm',
      hasConflicts: false,
      conflictSummary: [],
      rawOutput: '',
    },
    backupPath: '/tmp/backup-20260303-120000-abcd',
    ...overrides,
  };
}

// ─── presentForApproval tests ─────────────────────────────────────────────────

describe('presentForApproval', () => {
  it('"yes" → approved=true, approvedAt non-null', () => {
    const result = presentForApproval(makeProposal(), 'yes');
    expect(result.approved).toBe(true);
    expect(result.approvedAt).not.toBeNull();
    expect(result.rejectionReason).toBeNull();
  });

  it('"approve" → approved=true', () => {
    expect(presentForApproval(makeProposal(), 'approve').approved).toBe(true);
  });

  it('"approved" → approved=true', () => {
    expect(presentForApproval(makeProposal(), 'approved').approved).toBe(true);
  });

  it('"confirm" → approved=true', () => {
    expect(presentForApproval(makeProposal(), 'confirm').approved).toBe(true);
  });

  it('"ok" → approved=true', () => {
    expect(presentForApproval(makeProposal(), 'ok').approved).toBe(true);
  });

  it('"okay" → approved=true', () => {
    expect(presentForApproval(makeProposal(), 'okay').approved).toBe(true);
  });

  it('"y" → approved=true', () => {
    expect(presentForApproval(makeProposal(), 'y').approved).toBe(true);
  });

  it('"no" → approved=false, approvedAt=null', () => {
    const result = presentForApproval(makeProposal(), 'no');
    expect(result.approved).toBe(false);
    expect(result.approvedAt).toBeNull();
    expect(result.rejectionReason).toBe('no');
  });

  it('empty string → approved=false', () => {
    const result = presentForApproval(makeProposal(), '');
    expect(result.approved).toBe(false);
    expect(result.rejectionReason).toBe('');
  });

  it('"maybe" → approved=false, rejectionReason="maybe"', () => {
    const result = presentForApproval(makeProposal(), 'maybe');
    expect(result.approved).toBe(false);
    expect(result.rejectionReason).toBe('maybe');
  });

  it('"YES" (uppercase) → approved=true (case-insensitive)', () => {
    expect(presentForApproval(makeProposal(), 'YES').approved).toBe(true);
  });

  it('"  yes  " (with spaces) → approved=true (trimmed)', () => {
    expect(presentForApproval(makeProposal(), '  yes  ').approved).toBe(true);
  });

  it('"n" → approved=false', () => {
    expect(presentForApproval(makeProposal(), 'n').approved).toBe(false);
  });

  it('proposal is included in ApprovalResult', () => {
    const proposal = makeProposal();
    const result = presentForApproval(proposal, 'yes');
    expect(result.proposal).toBe(proposal);
  });
});

// ─── formatProposal tests ─────────────────────────────────────────────────────

describe('formatProposal', () => {
  it('includes packageName in output', () => {
    const output = formatProposal(makeProposal());
    expect(output).toContain('old-logger');
  });

  it('includes changeType in output', () => {
    const output = formatProposal(makeProposal());
    expect(output).toContain('update');
  });

  it('includes currentVersion and proposedVersion', () => {
    const output = formatProposal(makeProposal());
    expect(output).toContain('1.0.0');
    expect(output).toContain('2.0.0');
  });

  it('shows conflict summary when hasConflicts=true', () => {
    const proposal = makeProposal({
      dryRunResult: {
        ecosystem: 'npm',
        hasConflicts: true,
        conflictSummary: ['ERESOLVE conflict'],
        rawOutput: '',
      },
    });
    const output = formatProposal(proposal);
    expect(output).toContain('ERESOLVE conflict');
  });

  it('shows clean status when hasConflicts=false', () => {
    const output = formatProposal(makeProposal());
    expect(output).toContain('Clean');
  });

  it('includes backup path', () => {
    const output = formatProposal(makeProposal());
    expect(output).toContain('/tmp/backup-20260303-120000-abcd');
  });
});

// ─── HITLApprovalGate class tests ─────────────────────────────────────────────

describe('HITLApprovalGate', () => {
  it('class wraps presentForApproval', () => {
    const gate = new HITLApprovalGate();
    const result = gate.present(makeProposal(), 'yes');
    expect(result.approved).toBe(true);
  });

  it('class exposes format method', () => {
    const gate = new HITLApprovalGate();
    const output = gate.format(makeProposal());
    expect(output).toContain('old-logger');
  });
});
