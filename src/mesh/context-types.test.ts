import { describe, it, expect } from 'vitest';
import {
  DecisionRecordSchema,
  ContextSummarySchema,
  MeshExecutionResultSchema,
  GsdStateEntrySchema,
} from './context-types.js';
import type {
  DecisionRecord,
  ContextSummary,
  MeshExecutionResult,
  GsdStateEntry,
} from './context-types.js';

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

// ============================================================================
// DecisionRecordSchema
// ============================================================================

describe('DecisionRecordSchema', () => {
  it('parses a valid decision record', () => {
    const input: DecisionRecord = {
      id: 'dec-1',
      description: 'Use local node for latency',
      rationale: 'Latency under 10ms',
      outcome: 'accepted',
      timestamp: '2026-03-03T12:00:00Z',
    };
    const result = DecisionRecordSchema.parse(input);
    expect(result.id).toBe('dec-1');
    expect(result.description).toBe('Use local node for latency');
    expect(result.rationale).toBe('Latency under 10ms');
    expect(result.outcome).toBe('accepted');
    expect(result.timestamp).toBe('2026-03-03T12:00:00Z');
  });

  it('accepts all outcome values', () => {
    for (const outcome of ['accepted', 'rejected', 'deferred'] as const) {
      const input = {
        id: `dec-${outcome}`,
        description: 'test',
        rationale: 'test',
        outcome,
        timestamp: '2026-03-03T12:00:00Z',
      };
      expect(DecisionRecordSchema.parse(input).outcome).toBe(outcome);
    }
  });

  it('rejects invalid outcome value', () => {
    const input = {
      id: 'dec-1',
      description: 'test',
      rationale: 'test',
      outcome: 'maybe',
      timestamp: '2026-03-03T12:00:00Z',
    };
    expect(() => DecisionRecordSchema.parse(input)).toThrow();
  });

  it('rejects missing id', () => {
    const input = {
      description: 'test',
      rationale: 'test',
      outcome: 'accepted',
      timestamp: '2026-03-03T12:00:00Z',
    };
    expect(() => DecisionRecordSchema.parse(input)).toThrow();
  });

  it('rejects missing description', () => {
    const input = {
      id: 'dec-1',
      rationale: 'test',
      outcome: 'accepted',
      timestamp: '2026-03-03T12:00:00Z',
    };
    expect(() => DecisionRecordSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// ContextSummarySchema
// ============================================================================

describe('ContextSummarySchema', () => {
  it('parses a valid context summary', () => {
    const input: ContextSummary = {
      taskId: 'task-1',
      nodeId: 'node-1',
      decisions: [
        {
          id: 'dec-1',
          description: 'Use gpt-4',
          rationale: 'Best accuracy',
          outcome: 'accepted',
          timestamp: '2026-03-03T12:00:00Z',
        },
      ],
      artifacts: ['file-a.ts', 'file-b.ts'],
      routingJustification: 'Selected best node',
      transcriptDigest: 'Summary of execution steps...',
    };
    const result = ContextSummarySchema.parse(input);
    expect(result.taskId).toBe('task-1');
    expect(result.nodeId).toBe('node-1');
    expect(result.decisions).toHaveLength(1);
    expect(result.artifacts).toEqual(['file-a.ts', 'file-b.ts']);
    expect(result.routingJustification).toBe('Selected best node');
    expect(result.transcriptDigest).toBe('Summary of execution steps...');
  });

  it('accepts empty decisions and artifacts arrays', () => {
    const input = {
      taskId: 'task-2',
      nodeId: 'node-2',
      decisions: [],
      artifacts: [],
      routingJustification: 'Only node available',
      transcriptDigest: '',
    };
    const result = ContextSummarySchema.parse(input);
    expect(result.decisions).toHaveLength(0);
    expect(result.artifacts).toHaveLength(0);
  });

  it('rejects missing taskId', () => {
    const input = {
      nodeId: 'node-1',
      decisions: [],
      artifacts: [],
      routingJustification: 'test',
      transcriptDigest: 'test',
    };
    expect(() => ContextSummarySchema.parse(input)).toThrow();
  });

  it('rejects missing nodeId', () => {
    const input = {
      taskId: 'task-1',
      decisions: [],
      artifacts: [],
      routingJustification: 'test',
      transcriptDigest: 'test',
    };
    expect(() => ContextSummarySchema.parse(input)).toThrow();
  });
});

// ============================================================================
// MeshExecutionResultSchema
// ============================================================================

describe('MeshExecutionResultSchema', () => {
  it('parses a valid mesh execution result', () => {
    const input: MeshExecutionResult = {
      taskId: 'task-1',
      nodeId: 'node-1',
      nodeName: 'primary-worker',
      success: true,
      routingDecision: validRoutingDecision,
      output: 'Task completed successfully',
      transcript: 'Step 1: init\nResult: ok\nStep 2: execute\nResult: done',
      artifacts: ['output.json'],
      completedAt: '2026-03-03T12:05:00Z',
    };
    const result = MeshExecutionResultSchema.parse(input);
    expect(result.taskId).toBe('task-1');
    expect(result.nodeId).toBe('node-1');
    expect(result.nodeName).toBe('primary-worker');
    expect(result.success).toBe(true);
    expect(result.routingDecision.taskId).toBe('task-1');
    expect(result.output).toBe('Task completed successfully');
    expect(result.artifacts).toEqual(['output.json']);
    expect(result.completedAt).toBe('2026-03-03T12:05:00Z');
  });

  it('parses a failed execution result', () => {
    const input = {
      taskId: 'task-2',
      nodeId: 'node-1',
      nodeName: 'primary-worker',
      success: false,
      routingDecision: validRoutingDecision,
      output: '',
      transcript: 'Error: timeout',
      artifacts: [],
      completedAt: '2026-03-03T12:05:00Z',
    };
    const result = MeshExecutionResultSchema.parse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing success field', () => {
    const input = {
      taskId: 'task-1',
      nodeId: 'node-1',
      nodeName: 'primary-worker',
      routingDecision: validRoutingDecision,
      output: 'done',
      transcript: '',
      artifacts: [],
      completedAt: '2026-03-03T12:05:00Z',
    };
    expect(() => MeshExecutionResultSchema.parse(input)).toThrow();
  });

  it('rejects missing routingDecision', () => {
    const input = {
      taskId: 'task-1',
      nodeId: 'node-1',
      nodeName: 'primary-worker',
      success: true,
      output: 'done',
      transcript: '',
      artifacts: [],
      completedAt: '2026-03-03T12:05:00Z',
    };
    expect(() => MeshExecutionResultSchema.parse(input)).toThrow();
  });

  it('rejects non-boolean success', () => {
    const input = {
      taskId: 'task-1',
      nodeId: 'node-1',
      nodeName: 'worker',
      success: 'yes',
      routingDecision: validRoutingDecision,
      output: '',
      transcript: '',
      artifacts: [],
      completedAt: '2026-03-03T12:05:00Z',
    };
    expect(() => MeshExecutionResultSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// GsdStateEntrySchema
// ============================================================================

describe('GsdStateEntrySchema', () => {
  const validSummary: ContextSummary = {
    taskId: 'task-1',
    nodeId: 'node-1',
    decisions: [],
    artifacts: ['out.json'],
    routingJustification: 'best node',
    transcriptDigest: 'digest...',
  };

  const validResult: MeshExecutionResult = {
    taskId: 'task-1',
    nodeId: 'node-1',
    nodeName: 'worker',
    success: true,
    routingDecision: validRoutingDecision,
    output: 'done',
    transcript: 'transcript...',
    artifacts: ['out.json'],
    completedAt: '2026-03-03T12:05:00Z',
  };

  it('parses a valid GSD state entry', () => {
    const input: GsdStateEntry = {
      phaseId: 'phase-54',
      taskId: 'task-1',
      summary: validSummary,
      rawResult: validResult,
      ingestedAt: '2026-03-03T12:06:00Z',
    };
    const result = GsdStateEntrySchema.parse(input);
    expect(result.phaseId).toBe('phase-54');
    expect(result.taskId).toBe('task-1');
    expect(result.summary.taskId).toBe('task-1');
    expect(result.rawResult.success).toBe(true);
    expect(result.ingestedAt).toBe('2026-03-03T12:06:00Z');
  });

  it('rejects missing phaseId', () => {
    const input = {
      taskId: 'task-1',
      summary: validSummary,
      rawResult: validResult,
      ingestedAt: '2026-03-03T12:06:00Z',
    };
    expect(() => GsdStateEntrySchema.parse(input)).toThrow();
  });

  it('rejects missing summary', () => {
    const input = {
      phaseId: 'phase-54',
      taskId: 'task-1',
      rawResult: validResult,
      ingestedAt: '2026-03-03T12:06:00Z',
    };
    expect(() => GsdStateEntrySchema.parse(input)).toThrow();
  });

  it('rejects invalid nested summary', () => {
    const input = {
      phaseId: 'phase-54',
      taskId: 'task-1',
      summary: { taskId: 'task-1' }, // missing required fields
      rawResult: validResult,
      ingestedAt: '2026-03-03T12:06:00Z',
    };
    expect(() => GsdStateEntrySchema.parse(input)).toThrow();
  });
});

// ============================================================================
// Type inference check (compile-time only)
// ============================================================================

describe('type inference', () => {
  it('DecisionRecord type is correctly inferred', () => {
    const dec: DecisionRecord = {
      id: 'test',
      description: 'test',
      rationale: 'test',
      outcome: 'accepted',
      timestamp: '2026-01-01T00:00:00Z',
    };
    expect(dec.id).toBe('test');
  });

  it('ContextSummary type is correctly inferred', () => {
    const cs: ContextSummary = {
      taskId: 'test',
      nodeId: 'test',
      decisions: [],
      artifacts: [],
      routingJustification: 'test',
      transcriptDigest: 'test',
    };
    expect(cs.taskId).toBe('test');
  });

  it('MeshExecutionResult type is correctly inferred', () => {
    const mer: MeshExecutionResult = {
      taskId: 'test',
      nodeId: 'test',
      nodeName: 'test',
      success: true,
      routingDecision: validRoutingDecision,
      output: '',
      transcript: '',
      artifacts: [],
      completedAt: '2026-01-01T00:00:00Z',
    };
    expect(mer.taskId).toBe('test');
  });

  it('GsdStateEntry type is correctly inferred', () => {
    const entry: GsdStateEntry = {
      phaseId: 'test',
      taskId: 'test',
      summary: {
        taskId: 'test',
        nodeId: 'test',
        decisions: [],
        artifacts: [],
        routingJustification: 'test',
        transcriptDigest: 'test',
      },
      rawResult: {
        taskId: 'test',
        nodeId: 'test',
        nodeName: 'test',
        success: true,
        routingDecision: validRoutingDecision,
        output: '',
        transcript: '',
        artifacts: [],
        completedAt: '2026-01-01T00:00:00Z',
      },
      ingestedAt: '2026-01-01T00:00:00Z',
    };
    expect(entry.phaseId).toBe('test');
  });
});
