import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createWastelandCallbacks,
  evaluateTrustGate,
  TRUST_LEVEL_REQUIREMENTS,
  signalToStamp,
  ScanScheduler,
} from '../services-bridge.js';
import type { DoltOperations, CompletionSignalInput } from '../services-bridge.js';

// ============================================================================
// R4.1: WastelandCallbacks
// ============================================================================

describe('WastelandCallbacks', () => {
  it('delegates 4-phase cycle to DoltOperations', async () => {
    const ops: DoltOperations = {
      pull: vi.fn().mockResolvedValue(true),
      executeWork: vi.fn().mockResolvedValue({ success: true, artifacts: ['result.sql'] }),
      verify: vi.fn().mockResolvedValue(true),
      commit: vi.fn().mockResolvedValue(true),
    };

    const callbacks = createWastelandCallbacks(ops);

    const prepare = await callbacks.prepare(0);
    expect(prepare.success).toBe(true);
    expect(ops.pull).toHaveBeenCalled();

    const execute = await callbacks.execute(0);
    expect(execute.success).toBe(true);
    expect(execute.artifacts).toContain('result.sql');

    const verify = await callbacks.verify(0);
    expect(verify.success).toBe(true);

    const journal = await callbacks.journal(0);
    expect(journal.success).toBe(true);
    expect(journal.artifacts).toContain('dolt-committed');
  });

  it('handles pull failure gracefully', async () => {
    const ops: DoltOperations = {
      pull: vi.fn().mockResolvedValue(false),
      executeWork: vi.fn().mockResolvedValue({ success: true, artifacts: [] }),
      verify: vi.fn().mockResolvedValue(true),
      commit: vi.fn().mockResolvedValue(true),
    };

    const callbacks = createWastelandCallbacks(ops);
    const result = await callbacks.prepare(0);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// R4.2: Trust Gate Adapter
// ============================================================================

describe('evaluateTrustGate', () => {
  it('allows newcomer (level 0) to browse', () => {
    const decision = evaluateTrustGate('browse', 0);
    expect(decision.action).toBe('proceed');
    expect(decision.gateType).toBe('trust-level');
  });

  it('blocks newcomer from stamping', () => {
    const decision = evaluateTrustGate('stamp', 0);
    expect(decision.action).toBe('block');
    expect(decision.reason).toContain('< 1');
  });

  it('allows contributor (level 1) to stamp', () => {
    const decision = evaluateTrustGate('stamp', 1);
    expect(decision.action).toBe('proceed');
  });

  it('blocks contributor from admin operations', () => {
    const decision = evaluateTrustGate('admin', 1);
    expect(decision.action).toBe('block');
  });

  it('allows steward (level 3) to do everything', () => {
    for (const op of Object.keys(TRUST_LEVEL_REQUIREMENTS)) {
      const decision = evaluateTrustGate(op, 3);
      expect(decision.action).toBe('proceed');
    }
  });

  it('blocks unknown operations by default', () => {
    const decision = evaluateTrustGate('destroy-everything', 3);
    expect(decision.action).toBe('block');
    expect(decision.reason).toContain('Unknown operation');
  });

  it('accepts custom requirements', () => {
    const custom = { 'special-op': 2 };
    expect(evaluateTrustGate('special-op', 1, custom).action).toBe('block');
    expect(evaluateTrustGate('special-op', 2, custom).action).toBe('proceed');
  });
});

// ============================================================================
// R4.3: CompletionSignal → StampRecommendation
// ============================================================================

describe('signalToStamp', () => {
  const context = { wantedId: 'w-001', handle: 'fox' };

  it('converts success signal to positive stamp', () => {
    const signal: CompletionSignalInput = {
      operationId: 'op-001',
      status: 'success',
      timestamp: '2026-03-07T00:00:00Z',
    };

    const stamp = signalToStamp(signal, context);
    expect(stamp.stampId).toBe('auto-op-001');
    expect(stamp.wantedId).toBe('w-001');
    expect(stamp.valence.quality).toBe(0.8);
    expect(stamp.valence.reliability).toBe(0.9);
    expect(stamp.confidence).toBe(0.85);
    expect(stamp.severity).toBe('info');
    expect(stamp.tags).toContain('automated');
    expect(stamp.tags).toContain('success');
  });

  it('converts failure signal to negative stamp', () => {
    const signal: CompletionSignalInput = {
      operationId: 'op-002',
      status: 'failure',
      timestamp: '2026-03-07T00:00:00Z',
    };

    const stamp = signalToStamp(signal, context);
    expect(stamp.valence.quality).toBe(0.3);
    expect(stamp.valence.reliability).toBe(0.2);
    expect(stamp.confidence).toBe(0.75);
    expect(stamp.severity).toBe('warning');
  });

  it('converts error signal with message', () => {
    const signal: CompletionSignalInput = {
      operationId: 'op-003',
      status: 'error',
      timestamp: '2026-03-07T00:00:00Z',
      error: 'Dolt connection refused',
    };

    const stamp = signalToStamp(signal, context);
    expect(stamp.severity).toBe('critical');
    expect(stamp.confidence).toBe(0.5);
    expect(stamp.message).toContain('Dolt connection refused');
  });

  it('converts timeout signal', () => {
    const signal: CompletionSignalInput = {
      operationId: 'op-004',
      status: 'timeout',
      timestamp: '2026-03-07T00:00:00Z',
    };

    const stamp = signalToStamp(signal, context);
    expect(stamp.valence.reliability).toBe(0.1);
    expect(stamp.severity).toBe('warning');
  });
});

// ============================================================================
// R4.4: Scan Scheduler
// ============================================================================

describe('ScanScheduler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts and stops', () => {
    const scheduler = new ScanScheduler({ intervalMs: 1000 });
    expect(scheduler.isRunning()).toBe(false);

    scheduler.start(async () => ({ rigCount: 0, eventCount: 0, durationMs: 0 }));
    expect(scheduler.isRunning()).toBe(true);

    scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);
  });

  it('does not double-start', () => {
    const scheduler = new ScanScheduler({ intervalMs: 1000 });
    const scanFn = vi.fn().mockResolvedValue({ rigCount: 0, eventCount: 0, durationMs: 0 });

    scheduler.start(scanFn);
    scheduler.start(scanFn); // Should be no-op

    expect(scheduler.isRunning()).toBe(true);
    scheduler.stop();
  });

  it('executes scan function on interval', async () => {
    const scanFn = vi.fn().mockResolvedValue({ rigCount: 10, eventCount: 5, durationMs: 100 });
    const onComplete = vi.fn();

    const scheduler = new ScanScheduler({ intervalMs: 50, onScanComplete: onComplete });
    scheduler.start(scanFn);

    // Wait for at least one interval tick
    await new Promise(r => setTimeout(r, 120));

    expect(scanFn).toHaveBeenCalled();
    scheduler.stop();
  });

  it('reports active scan count', () => {
    const scheduler = new ScanScheduler();
    expect(scheduler.getActiveScans()).toBe(0);
  });
});
