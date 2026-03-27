import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildContextSummary, ingestMeshResult } from './result-ingestion.js';
import type { MeshExecutionResult, ContextSummary, GsdStateEntry } from './context-types.js';

// ============================================================================
// Test fixtures
// ============================================================================

const validNodeScore = {
  nodeId: 'node-1',
  chipName: 'gpt-4',
  capabilityScore: 1.0,
  loadScore: 0.8,
  performanceScore: 0.9,
  totalScore: 0.88,
  justification: 'target node selected',
};

const validRoutingDecision = {
  taskId: 'task-1',
  target: validNodeScore,
  routingJustification: 'Best node by score',
};

function makeResult(overrides: Partial<MeshExecutionResult> = {}): MeshExecutionResult {
  return {
    taskId: 'task-1',
    nodeId: 'node-1',
    nodeName: 'primary-worker',
    success: true,
    routingDecision: validRoutingDecision,
    output: 'Task completed',
    transcript: [
      'DECISION: Use local | RATIONALE: Low latency | OUTCOME: accepted',
      'Result: initialized',
      'Output: file.json created',
      'Step 3: finalize',
    ].join('\n'),
    artifacts: ['file.json'],
    completedAt: '2026-03-03T12:05:00Z',
    ...overrides,
  };
}

// ============================================================================
// buildContextSummary
// ============================================================================

describe('buildContextSummary', () => {
  it('builds a context summary from execution result', () => {
    const result = makeResult();
    const summary = buildContextSummary(result);

    expect(summary.taskId).toBe('task-1');
    expect(summary.nodeId).toBe('node-1');
    expect(summary.routingJustification).toBe('Best node by score');
    expect(summary.artifacts).toEqual(['file.json']);
  });

  it('extracts decisions from transcript', () => {
    const result = makeResult();
    const summary = buildContextSummary(result);

    expect(summary.decisions).toHaveLength(1);
    expect(summary.decisions[0].description).toBe('Use local');
    expect(summary.decisions[0].outcome).toBe('accepted');
  });

  it('builds transcript digest', () => {
    const result = makeResult();
    const summary = buildContextSummary(result);

    expect(summary.transcriptDigest).toContain('Result: initialized');
    expect(summary.transcriptDigest).toContain('Output: file.json created');
    expect(summary.transcriptDigest).not.toContain('Step 3: finalize');
  });

  it('handles empty transcript', () => {
    const result = makeResult({ transcript: '' });
    const summary = buildContextSummary(result);

    expect(summary.decisions).toHaveLength(0);
    expect(summary.transcriptDigest).toBe('');
  });

  it('handles result with no decisions in transcript', () => {
    const result = makeResult({ transcript: 'Result: ok\nOutput: done' });
    const summary = buildContextSummary(result);

    expect(summary.decisions).toHaveLength(0);
    expect(summary.transcriptDigest).toContain('Result: ok');
  });
});

// ============================================================================
// ingestMeshResult
// ============================================================================

describe('ingestMeshResult', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03T12:10:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('wraps result into a GsdStateEntry', () => {
    const result = makeResult();
    const entry = ingestMeshResult(result, 'phase-54');

    expect(entry.phaseId).toBe('phase-54');
    expect(entry.taskId).toBe('task-1');
    expect(entry.ingestedAt).toBe('2026-03-03T12:10:00.000Z');
  });

  it('contains the context summary', () => {
    const result = makeResult();
    const entry = ingestMeshResult(result, 'phase-54');

    expect(entry.summary.taskId).toBe('task-1');
    expect(entry.summary.nodeId).toBe('node-1');
    expect(entry.summary.decisions).toHaveLength(1);
  });

  it('contains the raw result', () => {
    const result = makeResult();
    const entry = ingestMeshResult(result, 'phase-54');

    expect(entry.rawResult).toEqual(result);
  });

  it('uses current time for ingestedAt', () => {
    vi.setSystemTime(new Date('2026-06-15T08:30:00Z'));
    const result = makeResult();
    const entry = ingestMeshResult(result, 'phase-54');

    expect(entry.ingestedAt).toBe('2026-06-15T08:30:00.000Z');
  });

  it('preserves phaseId in entry', () => {
    const result = makeResult();
    const entry = ingestMeshResult(result, 'phase-99');

    expect(entry.phaseId).toBe('phase-99');
  });
});
