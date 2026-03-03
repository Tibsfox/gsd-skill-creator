import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbsorberOrchestrator } from './absorber-orchestrator.js';
import type { AbsorptionRequest } from './absorber-orchestrator.js';
import type { AbsorptionCandidate } from './types.js';

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('./absorption-criteria-gate.js', () => ({
  checkCriteria: vi.fn(),
}));

vi.mock('./oracle-verifier.js', () => ({
  runOracleVerification: vi.fn(),
}));

vi.mock('./call-site-replacer.js', () => ({
  executeReplacementCycles: vi.fn(),
}));

vi.mock('./internalization-registry.js', () => ({
  appendRecord: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('test-uuid-1234'),
}));

import { checkCriteria } from './absorption-criteria-gate.js';
import { runOracleVerification } from './oracle-verifier.js';
import { executeReplacementCycles } from './call-site-replacer.js';
import { appendRecord } from './internalization-registry.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCandidate(): AbsorptionCandidate {
  return {
    packageName: 'tiny-math',
    ecosystem: 'npm',
    implementationLines: 100,
    isAlgorithmStable: true,
    isPureAlgorithmic: true,
    apiUsageRatio: 0.10,
    categoryTags: ['math'],
  };
}

function makeApprovedVerdict() {
  return {
    candidatePackage: 'tiny-math',
    status: 'approved' as const,
    rejectionReasons: [],
    isHardBlocked: false,
    checkedAt: '2026-03-03T00:00:00.000Z',
  };
}

function makeRejectedVerdict(hardBlocked = false) {
  return {
    candidatePackage: 'tiny-math',
    status: (hardBlocked ? 'hard-blocked' : 'rejected') as 'hard-blocked' | 'rejected',
    rejectionReasons: ['too big'],
    isHardBlocked: hardBlocked,
    checkedAt: '2026-03-03T00:00:00.000Z',
  };
}

function makeOracleResult(passed: boolean) {
  return {
    packageName: 'tiny-math',
    totalCases: 10_000,
    failures: passed ? 0 : 100,
    isDeterministic: true,
    passedAt: passed ? '2026-03-03T00:00:00.000Z' : null,
  };
}

function makeCycles(failedInCycle = 0) {
  return [
    {
      cycleNumber: 1,
      totalCallSites: 5,
      replacedInCycle: 1,
      verifiedInCycle: failedInCycle === 0 ? 1 : 0,
      failedInCycle,
    },
  ];
}

function makeRequest(overrides: Partial<AbsorptionRequest> = {}): AbsorptionRequest {
  return {
    candidate: makeCandidate(),
    algorithmName: 'clamp',
    nativeImpl: (x: unknown) => x,
    oracleTestCases: [],
    oracleConfig: { packageName: 'tiny-math', isDeterministic: true },
    callSiteInput: {
      callSites: [],
      verify: vi.fn().mockResolvedValue(true),
    },
    registryPath: '/tmp/test-registry.jsonl',
    observationPeriodDays: 30,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AbsorberOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns criteria-blocked and null record when criteria gate rejects', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeRejectedVerdict(false));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(outcome.status).toBe('criteria-blocked');
    expect(outcome.record).toBeNull();
  });

  it('returns criteria-blocked and null record when criteria gate hard-blocks', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeRejectedVerdict(true));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(outcome.status).toBe('criteria-blocked');
    expect(outcome.record).toBeNull();
  });

  it('appendRecord is NOT called when criteria gate blocks', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeRejectedVerdict(false));
    const orchestrator = new AbsorberOrchestrator();
    await orchestrator.absorb(makeRequest());
    expect(appendRecord).not.toHaveBeenCalled();
  });

  it('oracle verification runs when criteria gate approves', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles());
    const orchestrator = new AbsorberOrchestrator();
    await orchestrator.absorb(makeRequest());
    expect(runOracleVerification).toHaveBeenCalledTimes(1);
  });

  it('returns oracle-failed when oracleResult.passedAt is null', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(false));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(outcome.status).toBe('oracle-failed');
  });

  it('appendRecord is called with status=failed when oracle fails', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(false));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(appendRecord).toHaveBeenCalledTimes(1);
    expect(outcome.record?.status).toBe('failed');
  });

  it('call-site replacement runs when oracle passes', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles());
    const orchestrator = new AbsorberOrchestrator();
    await orchestrator.absorb(makeRequest());
    expect(executeReplacementCycles).toHaveBeenCalledTimes(1);
  });

  it('returns complete when all cycles succeed', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles(0));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(outcome.status).toBe('complete');
  });

  it('returns call-site-failed when any cycle has failedInCycle > 0', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles(1));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(outcome.status).toBe('call-site-failed');
  });

  it('appendRecord called with status=complete when pipeline succeeds', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles(0));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(appendRecord).toHaveBeenCalledTimes(1);
    expect(outcome.record?.status).toBe('complete');
  });

  it('record.id is a UUID (non-empty string)', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles(0));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(typeof outcome.record?.id).toBe('string');
    expect(outcome.record?.id.length).toBeGreaterThan(0);
  });

  it('record.algorithmName matches request.algorithmName', async () => {
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(makeCycles(0));
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest({ algorithmName: 'my-algo' }));
    expect(outcome.record?.algorithmName).toBe('my-algo');
  });

  it('record.callSiteCycles matches cycles from executeReplacementCycles', async () => {
    const cycles = makeCycles(0);
    vi.mocked(checkCriteria).mockReturnValueOnce(makeApprovedVerdict());
    vi.mocked(runOracleVerification).mockReturnValueOnce(makeOracleResult(true));
    vi.mocked(executeReplacementCycles).mockResolvedValueOnce(cycles);
    const orchestrator = new AbsorberOrchestrator();
    const outcome = await orchestrator.absorb(makeRequest());
    expect(outcome.record?.callSiteCycles).toEqual(cycles);
  });
});
