import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationOrchestrator } from './integration-orchestrator.js';
import type { IntegrationConfig } from './types.js';

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('./health-event-writer.js', () => ({
  writeEvent: vi.fn(),
  readEvents: vi.fn(),
}));

vi.mock('./staging-health-gate.js', () => ({
  checkHealthGate: vi.fn(),
}));

vi.mock('./pattern-learner.js', () => ({
  detectPatterns: vi.fn(),
  getPackageWarning: vi.fn(),
}));

import { writeEvent, readEvents } from './health-event-writer.js';
import { checkHealthGate } from './staging-health-gate.js';
import { detectPatterns, getPackageWarning } from './pattern-learner.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<IntegrationConfig> = {}): IntegrationConfig {
  return {
    healthLogPath: '/tmp/test-health.jsonl',
    ...overrides,
  };
}

function makeWriteInput() {
  return {
    eventType: 'audit' as const,
    packageName: 'lodash',
    ecosystem: 'npm',
    packageVersion: '4.17.21',
    decisionRationale: 'Package is healthy',
    payload: {},
    projectId: 'proj-1',
  };
}

function makeGateInput() {
  return {
    dryRunPassed: true,
    criticalPathPackages: [] as string[],
    packageClassifications: {} as Record<string, string>,
  };
}

function makeHealthEvent() {
  return {
    id: 'test-uuid',
    timestamp: '2026-03-03T00:00:00.000Z',
    eventType: 'audit' as const,
    packageName: 'lodash',
    ecosystem: 'npm',
    packageVersion: '4.17.21',
    decisionRationale: 'Package is healthy',
    payload: {},
    projectId: 'proj-1',
  };
}

function makeGateResult(decision: 'allow' | 'block' = 'allow') {
  return {
    decision,
    blockingFindings: decision === 'block' ? ['Dry-run failed'] : [],
    checkedAt: '2026-03-03T00:00:00.000Z',
  };
}

function makePatternMatch(packageName = 'bad-pkg') {
  return {
    packageName,
    projectCount: 5,
    patternSummary: `Package '${packageName}' has been classified as 'abandoned' in 5 projects`,
    evidenceProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('IntegrationOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── logEvent ──────────────────────────────────────────────────────────────

  it('logEvent() delegates to writeEvent with configured healthLogPath', async () => {
    const event = makeHealthEvent();
    vi.mocked(writeEvent).mockResolvedValueOnce(event);
    const orchestrator = new IntegrationOrchestrator(makeConfig({ healthLogPath: '/custom/path.jsonl' }));
    await orchestrator.logEvent(makeWriteInput());
    expect(writeEvent).toHaveBeenCalledWith('/custom/path.jsonl', expect.objectContaining({ packageName: 'lodash' }));
  });

  it('logEvent() returns the HealthEvent from writeEvent', async () => {
    const event = makeHealthEvent();
    vi.mocked(writeEvent).mockResolvedValueOnce(event);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    const result = await orchestrator.logEvent(makeWriteInput());
    expect(result).toEqual(event);
  });

  // ─── checkGate ─────────────────────────────────────────────────────────────

  it('checkGate() delegates to checkHealthGate', () => {
    const gateResult = makeGateResult('allow');
    vi.mocked(checkHealthGate).mockReturnValueOnce(gateResult);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    orchestrator.checkGate(makeGateInput());
    expect(checkHealthGate).toHaveBeenCalledTimes(1);
  });

  it('checkGate() returns the HealthGateResult', () => {
    const gateResult = makeGateResult('block');
    vi.mocked(checkHealthGate).mockReturnValueOnce(gateResult);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    const result = orchestrator.checkGate(makeGateInput());
    expect(result.decision).toBe('block');
  });

  // ─── getAllPatterns ─────────────────────────────────────────────────────────

  it('getAllPatterns() reads events then delegates to detectPatterns', async () => {
    const events = [makeHealthEvent()];
    vi.mocked(readEvents).mockResolvedValueOnce(events);
    vi.mocked(detectPatterns).mockReturnValueOnce([]);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    await orchestrator.getAllPatterns();
    expect(readEvents).toHaveBeenCalledTimes(1);
    expect(detectPatterns).toHaveBeenCalledWith(events, 5);
  });

  it('getAllPatterns() uses patternThreshold from config', async () => {
    vi.mocked(readEvents).mockResolvedValueOnce([]);
    vi.mocked(detectPatterns).mockReturnValueOnce([]);
    const orchestrator = new IntegrationOrchestrator(makeConfig({ patternThreshold: 3 }));
    await orchestrator.getAllPatterns();
    expect(detectPatterns).toHaveBeenCalledWith([], 3);
  });

  // ─── getWarning ─────────────────────────────────────────────────────────────

  it('getWarning() reads events then delegates to getPackageWarning', async () => {
    const events = [makeHealthEvent()];
    vi.mocked(readEvents).mockResolvedValueOnce(events);
    vi.mocked(getPackageWarning).mockReturnValueOnce(null);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    await orchestrator.getWarning('lodash');
    expect(readEvents).toHaveBeenCalledTimes(1);
    expect(getPackageWarning).toHaveBeenCalledWith(events, 'lodash', 5);
  });

  it('getWarning() returns null when no pattern found', async () => {
    vi.mocked(readEvents).mockResolvedValueOnce([]);
    vi.mocked(getPackageWarning).mockReturnValueOnce(null);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    const result = await orchestrator.getWarning('safe-pkg');
    expect(result).toBeNull();
  });

  it('getWarning() returns PatternMatch when pattern found', async () => {
    const match = makePatternMatch('bad-pkg');
    vi.mocked(readEvents).mockResolvedValueOnce([]);
    vi.mocked(getPackageWarning).mockReturnValueOnce(match);
    const orchestrator = new IntegrationOrchestrator(makeConfig());
    const result = await orchestrator.getWarning('bad-pkg');
    expect(result).toEqual(match);
  });

  // ─── Configuration defaults ─────────────────────────────────────────────────

  it('default patternThreshold is 5 when not configured', async () => {
    vi.mocked(readEvents).mockResolvedValueOnce([]);
    vi.mocked(detectPatterns).mockReturnValueOnce([]);
    const orchestrator = new IntegrationOrchestrator({ healthLogPath: '/tmp/health.jsonl' });
    await orchestrator.getAllPatterns();
    expect(detectPatterns).toHaveBeenCalledWith([], 5);
  });

  it('custom patternThreshold passed to getPackageWarning', async () => {
    vi.mocked(readEvents).mockResolvedValueOnce([]);
    vi.mocked(getPackageWarning).mockReturnValueOnce(null);
    const orchestrator = new IntegrationOrchestrator(makeConfig({ patternThreshold: 10 }));
    await orchestrator.getWarning('pkg');
    expect(getPackageWarning).toHaveBeenCalledWith([], 'pkg', 10);
  });
});
