import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskTracker } from './task-tracker.js';
import type { MeshEventLog } from './event-log.js';
import type { TaskState } from './task-tracker.js';

// ============================================================================
// Mock factory
// ============================================================================

function makeMockEventLog(): MeshEventLog {
  return {
    write: vi.fn(async () => ({
      id: 'evt-1',
      timestamp: new Date().toISOString(),
      nodeId: 'local',
      eventType: 'health-change' as const,
      payload: {},
    })),
    readAll: vi.fn(async () => []),
  } as unknown as MeshEventLog;
}

// ============================================================================
// TaskTracker
// ============================================================================

describe('TaskTracker', () => {
  let eventLog: MeshEventLog;
  let tracker: TaskTracker;

  beforeEach(() => {
    eventLog = makeMockEventLog();
    tracker = new TaskTracker(eventLog);
  });

  // ── init ──────────────────────────────────────────────────────────────────

  it('init sets state to queued and emits event', async () => {
    await tracker.init('task-1');

    expect(tracker.getState('task-1')).toBe('queued');
    expect(eventLog.write).toHaveBeenCalledOnce();

    const call = (eventLog.write as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.eventType).toBe('health-change');
    expect(call.payload.type).toBe('task-state-change');
    expect(call.payload.newState).toBe('queued');
  });

  it('init on already-initialized task is idempotent', async () => {
    await tracker.init('task-1');
    await tracker.init('task-1');

    expect(tracker.getState('task-1')).toBe('queued');
    // Only one event emitted
    expect(eventLog.write).toHaveBeenCalledOnce();
  });

  // ── transitions ───────────────────────────────────────────────────────────

  it('transition from queued to dispatching succeeds', async () => {
    await tracker.init('task-1');
    const result = await tracker.transition('task-1', 'dispatching');

    expect(result).toBe(true);
    expect(tracker.getState('task-1')).toBe('dispatching');
  });

  it('full lifecycle produces 5 transitions', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');
    await tracker.transition('task-1', 'executing');
    await tracker.transition('task-1', 'collecting');
    await tracker.transition('task-1', 'complete');

    const transitions = tracker.getTransitions('task-1');
    // init (->queued) + 4 forward transitions = 5 total
    expect(transitions).toHaveLength(5);
    expect(transitions[0].to).toBe('queued');
    expect(transitions[1]).toEqual(expect.objectContaining({ from: 'queued', to: 'dispatching' }));
    expect(transitions[2]).toEqual(expect.objectContaining({ from: 'dispatching', to: 'executing' }));
    expect(transitions[3]).toEqual(expect.objectContaining({ from: 'executing', to: 'collecting' }));
    expect(transitions[4]).toEqual(expect.objectContaining({ from: 'collecting', to: 'complete' }));

    expect(tracker.getState('task-1')).toBe('complete');
    // 5 events: init + 4 transitions
    expect(eventLog.write).toHaveBeenCalledTimes(5);
  });

  it('transition to failed from any state succeeds', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');

    const result = await tracker.transition('task-1', 'failed');
    expect(result).toBe(true);
    expect(tracker.getState('task-1')).toBe('failed');
  });

  it('transition to failed from queued succeeds', async () => {
    await tracker.init('task-1');
    const result = await tracker.transition('task-1', 'failed');
    expect(result).toBe(true);
    expect(tracker.getState('task-1')).toBe('failed');
  });

  it('transition to failed from executing succeeds', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');
    await tracker.transition('task-1', 'executing');

    const result = await tracker.transition('task-1', 'failed');
    expect(result).toBe(true);
    expect(tracker.getState('task-1')).toBe('failed');
  });

  // ── illegal transitions ───────────────────────────────────────────────────

  it('rejects illegal transition complete -> dispatching', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');
    await tracker.transition('task-1', 'executing');
    await tracker.transition('task-1', 'collecting');
    await tracker.transition('task-1', 'complete');

    const writeCountBefore = (eventLog.write as ReturnType<typeof vi.fn>).mock.calls.length;
    const result = await tracker.transition('task-1', 'dispatching');

    expect(result).toBe(false);
    expect(tracker.getState('task-1')).toBe('complete');
    // No new event emitted
    expect(eventLog.write).toHaveBeenCalledTimes(writeCountBefore);
  });

  it('rejects backward transition collecting -> queued', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');
    await tracker.transition('task-1', 'executing');
    await tracker.transition('task-1', 'collecting');

    const result = await tracker.transition('task-1', 'queued');
    expect(result).toBe(false);
    expect(tracker.getState('task-1')).toBe('collecting');
  });

  it('rejects skipping states (queued -> executing)', async () => {
    await tracker.init('task-1');
    const result = await tracker.transition('task-1', 'executing');
    expect(result).toBe(false);
    expect(tracker.getState('task-1')).toBe('queued');
  });

  // ── getState / getTransitions ─────────────────────────────────────────────

  it('getState returns undefined for unknown task', () => {
    expect(tracker.getState('unknown')).toBeUndefined();
  });

  it('getTransitions returns empty array for unknown task', () => {
    expect(tracker.getTransitions('unknown')).toEqual([]);
  });

  it('getTransitions returns all recorded transitions with timestamps', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');

    const transitions = tracker.getTransitions('task-1');
    expect(transitions).toHaveLength(2);
    for (const t of transitions) {
      expect(t.timestamp).toBeDefined();
      expect(typeof t.timestamp).toBe('string');
    }
  });

  // ── event payload ─────────────────────────────────────────────────────────

  it('emits event with correct payload structure', async () => {
    await tracker.init('task-1');
    await tracker.transition('task-1', 'dispatching');

    const calls = (eventLog.write as ReturnType<typeof vi.fn>).mock.calls;
    const transitionCall = calls[1][0];

    expect(transitionCall.nodeId).toBe('mesh-executor');
    expect(transitionCall.eventType).toBe('health-change');
    expect(transitionCall.payload).toEqual(expect.objectContaining({
      type: 'task-state-change',
      taskId: 'task-1',
      previousState: 'queued',
      newState: 'dispatching',
    }));
  });

  // ── transition on unknown task ────────────────────────────────────────────

  it('transition on unknown task returns false', async () => {
    const result = await tracker.transition('unknown', 'dispatching');
    expect(result).toBe(false);
  });
});
