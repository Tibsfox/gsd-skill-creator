/**
 * Tests for Den Relay agent.
 *
 * Validates priority classification, question consolidation, batch limiting,
 * status report generation, markdown report rendering, stateful Relay class,
 * and barrel export completeness.
 */

import { describe, it, expect } from 'vitest';

import {
  classifyPriority,
  consolidateQuestions,
  batchForUser,
  generateStatusReport,
  formatReportMarkdown,
  Relay,
  createRelay,
  RelayConfigSchema,
  QuestionEntrySchema,
  QuestionBatchSchema,
  PositionStatusSchema,
  StatusReportSchema,
} from './relay.js';

import type { QuestionEntry, PositionStatus, StatusReport } from './relay.js';
import type { BusConfig } from './types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeQuestion(overrides: Partial<QuestionEntry> = {}): QuestionEntry {
  return {
    id: overrides.id ?? 'q1',
    from: overrides.from ?? 'planner',
    topic: overrides.topic ?? 'scope',
    question: overrides.question ?? 'Should we expand scope?',
    priority: overrides.priority ?? 'BATCH',
    receivedAt: overrides.receivedAt ?? '20260220-120000',
  };
}

function makeConfig(): BusConfig {
  return {
    busDir: '/tmp/test-bus',
    maxQueueDepth: 100,
    deliveryTimeoutMs: 5000,
    deadLetterRetentionDays: 3,
    archiveMaxMessages: 100,
    archiveMaxAgeDays: 7,
  };
}

// ============================================================================
// classifyPriority
// ============================================================================

describe('classifyPriority', () => {
  it('returns IMMEDIATE for critical keywords', () => {
    expect(classifyPriority('critical error detected')).toBe('IMMEDIATE');
    expect(classifyPriority('budget_critical overage')).toBe('IMMEDIATE');
    expect(classifyPriority('system halt required')).toBe('IMMEDIATE');
    expect(classifyPriority('emergency shutdown')).toBe('IMMEDIATE');
    expect(classifyPriority('potential data_loss risk')).toBe('IMMEDIATE');
    expect(classifyPriority('verification_failed on task')).toBe('IMMEDIATE');
  });

  it('returns SOON for blocking keywords', () => {
    expect(classifyPriority('blocking dependency found')).toBe('SOON');
    expect(classifyPriority('task blocked by auth')).toBe('SOON');
    expect(classifyPriority('this is a no-go situation')).toBe('SOON');
    expect(classifyPriority('nogo for deployment')).toBe('SOON');
    expect(classifyPriority('decision_required from user')).toBe('SOON');
    expect(classifyPriority('scope_change detected')).toBe('SOON');
  });

  it('returns BATCH for unrecognized keywords', () => {
    expect(classifyPriority('preference question')).toBe('BATCH');
    expect(classifyPriority('status update ready')).toBe('BATCH');
    expect(classifyPriority('minor improvement suggested')).toBe('BATCH');
    expect(classifyPriority('')).toBe('BATCH');
  });

  it('is case insensitive', () => {
    expect(classifyPriority('CRITICAL error')).toBe('IMMEDIATE');
    expect(classifyPriority('Budget_Critical')).toBe('IMMEDIATE');
    expect(classifyPriority('BLOCKING issue')).toBe('SOON');
    expect(classifyPriority('Decision_Required')).toBe('SOON');
  });
});

// ============================================================================
// consolidateQuestions
// ============================================================================

describe('consolidateQuestions', () => {
  it('merges same-topic questions into single entry', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'auth', question: 'Use JWT?', receivedAt: '20260220-120000' }),
      makeQuestion({ id: 'q2', topic: 'auth', question: 'Add OAuth?', receivedAt: '20260220-120100' }),
    ];

    const result = consolidateQuestions(questions);
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe('Use JWT? | Add OAuth?');
  });

  it('keeps highest priority on merge (IMMEDIATE > SOON > BATCH)', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'deploy', priority: 'BATCH', receivedAt: '20260220-120000' }),
      makeQuestion({ id: 'q2', topic: 'deploy', priority: 'IMMEDIATE', receivedAt: '20260220-120100' }),
    ];

    const result = consolidateQuestions(questions);
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('IMMEDIATE');
  });

  it('keeps earliest receivedAt on merge', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'scope', receivedAt: '20260220-130000' }),
      makeQuestion({ id: 'q2', topic: 'scope', receivedAt: '20260220-120000' }),
    ];

    const result = consolidateQuestions(questions);
    expect(result).toHaveLength(1);
    expect(result[0].receivedAt).toBe('20260220-120000');
  });

  it('sorts by priority then receivedAt', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'a', priority: 'BATCH', receivedAt: '20260220-110000' }),
      makeQuestion({ id: 'q2', topic: 'b', priority: 'IMMEDIATE', receivedAt: '20260220-120000' }),
      makeQuestion({ id: 'q3', topic: 'c', priority: 'SOON', receivedAt: '20260220-100000' }),
      makeQuestion({ id: 'q4', topic: 'd', priority: 'SOON', receivedAt: '20260220-090000' }),
    ];

    const result = consolidateQuestions(questions);
    expect(result).toHaveLength(4);
    expect(result[0].priority).toBe('IMMEDIATE');
    expect(result[1].priority).toBe('SOON');
    expect(result[1].receivedAt).toBe('20260220-090000');
    expect(result[2].priority).toBe('SOON');
    expect(result[2].receivedAt).toBe('20260220-100000');
    expect(result[3].priority).toBe('BATCH');
  });

  it('passes through unique-topic questions unchanged', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'auth', question: 'Use JWT?' }),
      makeQuestion({ id: 'q2', topic: 'deploy', question: 'Use Docker?' }),
    ];

    const result = consolidateQuestions(questions);
    expect(result).toHaveLength(2);
    expect(result[0].question).toBe('Use JWT?');
    expect(result[1].question).toBe('Use Docker?');
  });
});

// ============================================================================
// batchForUser
// ============================================================================

describe('batchForUser', () => {
  it('limits to maxCount (default 3)', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'a' }),
      makeQuestion({ id: 'q2', topic: 'b' }),
      makeQuestion({ id: 'q3', topic: 'c' }),
      makeQuestion({ id: 'q4', topic: 'd' }),
      makeQuestion({ id: 'q5', topic: 'e' }),
    ];

    const batch = batchForUser(questions);
    expect(batch.questions).toHaveLength(3);
    expect(batch.held).toBe(2);
    expect(batch.totalPending).toBe(5);
  });

  it('reports correct held count', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'a' }),
      makeQuestion({ id: 'q2', topic: 'b' }),
    ];

    const batch = batchForUser(questions);
    expect(batch.questions).toHaveLength(2);
    expect(batch.held).toBe(0);
    expect(batch.totalPending).toBe(2);
  });

  it('handles empty input', () => {
    const batch = batchForUser([]);
    expect(batch.questions).toHaveLength(0);
    expect(batch.held).toBe(0);
    expect(batch.totalPending).toBe(0);
  });

  it('respects custom maxCount', () => {
    const questions: QuestionEntry[] = [
      makeQuestion({ id: 'q1', topic: 'a' }),
      makeQuestion({ id: 'q2', topic: 'b' }),
      makeQuestion({ id: 'q3', topic: 'c' }),
    ];

    const batch = batchForUser(questions, 1);
    expect(batch.questions).toHaveLength(1);
    expect(batch.held).toBe(2);
    expect(batch.totalPending).toBe(3);
  });
});

// ============================================================================
// generateStatusReport
// ============================================================================

describe('generateStatusReport', () => {
  it('fills timestamp automatically', () => {
    const positions: PositionStatus[] = [
      { position: 'planner', status: 'active', detail: 'Planning phase 3' },
    ];

    const report = generateStatusReport({
      milestone: 'v1.28',
      phase: 'Phase 256',
      totalPhases: 7,
      overallStatus: 'on_track',
      budgetUtilization: 45,
      quality: 'healthy',
      positionReports: positions,
    });

    // timestamp should be auto-filled in YYYYMMDD-HHMMSS format
    expect(report.timestamp).toMatch(/^\d{8}-\d{6}$/);
  });

  it('validates through StatusReportSchema', () => {
    const positions: PositionStatus[] = [
      { position: 'executor', status: 'idle' },
    ];

    const report = generateStatusReport({
      milestone: 'v1.28',
      phase: 'Phase 255',
      totalPhases: 7,
      overallStatus: 'ahead',
      budgetUtilization: 30,
      quality: 'healthy',
      positionReports: positions,
      attentionItems: ['Budget running low'],
      nextActions: ['Execute phase 256'],
    });

    const parsed = StatusReportSchema.parse(report);
    expect(parsed.milestone).toBe('v1.28');
    expect(parsed.overallStatus).toBe('ahead');
    expect(parsed.attentionItems).toEqual(['Budget running low']);
    expect(parsed.nextActions).toEqual(['Execute phase 256']);
  });
});

// ============================================================================
// formatReportMarkdown
// ============================================================================

describe('formatReportMarkdown', () => {
  it('produces correct markdown structure', () => {
    const report: StatusReport = {
      timestamp: '20260220-130000',
      milestone: 'v1.28',
      phase: 'Phase 256',
      totalPhases: 7,
      overallStatus: 'on_track',
      budgetUtilization: 45,
      quality: 'healthy',
      positionReports: [
        { position: 'planner', status: 'active', detail: 'Planning phase 3' },
        { position: 'executor', status: 'idle' },
      ],
      attentionItems: [],
      nextActions: ['Execute next plan'],
    };

    const md = formatReportMarkdown(report);

    expect(md).toContain('## Status Report -- 20260220-130000');
    expect(md).toContain('**Project:** v1.28');
    expect(md).toContain('**Phase:** Phase 256/7');
    expect(md).toContain('**Status:** on_track');
    expect(md).toContain('**Budget:** 45%');
    expect(md).toContain('**Quality:** healthy');
    expect(md).toContain('### Position Reports');
    expect(md).toContain('- **planner:** active Planning phase 3');
    expect(md).toContain('- **executor:** idle');
    expect(md).toContain('### Up Next');
    expect(md).toContain('- Execute next plan');
  });

  it('includes attention items only when non-empty', () => {
    const reportNoAttention: StatusReport = {
      timestamp: '20260220-130000',
      milestone: 'v1.28',
      phase: 'Phase 256',
      totalPhases: 7,
      overallStatus: 'on_track',
      budgetUtilization: 45,
      quality: 'healthy',
      positionReports: [],
      attentionItems: [],
      nextActions: [],
    };

    const mdNoAttention = formatReportMarkdown(reportNoAttention);
    expect(mdNoAttention).not.toContain('### Requires Your Attention');

    const reportWithAttention: StatusReport = {
      ...reportNoAttention,
      attentionItems: ['Budget is over 80%'],
    };

    const mdWithAttention = formatReportMarkdown(reportWithAttention);
    expect(mdWithAttention).toContain('### Requires Your Attention');
    expect(mdWithAttention).toContain('- Budget is over 80%');
  });
});

// ============================================================================
// Relay class
// ============================================================================

describe('Relay', () => {
  it('classifyAndQueue adds to internal queue', () => {
    const relay = createRelay({ busConfig: makeConfig() });

    const entry = relay.classifyAndQueue('planner', 'scope', 'Expand scope?', 'preference question');
    expect(entry.from).toBe('planner');
    expect(entry.topic).toBe('scope');
    expect(entry.question).toBe('Expand scope?');
    expect(entry.priority).toBe('BATCH');
    expect(entry.id).toBeTruthy();

    const queue = relay.getConsolidatedQueue();
    expect(queue).toHaveLength(1);
  });

  it('getBatch consolidates and batches correctly', () => {
    const relay = createRelay({ busConfig: makeConfig(), maxQuestionsPerBatch: 2 });

    relay.classifyAndQueue('planner', 'auth', 'Use JWT?', 'preference');
    relay.classifyAndQueue('executor', 'auth', 'Add OAuth?', 'preference');
    relay.classifyAndQueue('monitor', 'perf', 'Alert threshold?', 'decision_required');
    relay.classifyAndQueue('sentinel', 'backup', 'Frequency?', 'preference');

    const batch = relay.getBatch();
    // auth questions consolidated -> 1, perf -> 1, backup -> 1 = 3 total
    // maxQuestionsPerBatch = 2, so 2 in batch, 1 held
    expect(batch.questions.length).toBeLessThanOrEqual(2);
    expect(batch.totalPending).toBe(3); // 3 after consolidation
    expect(batch.held).toBe(1);
    // SOON priority (decision_required) should come first
    expect(batch.questions[0].priority).toBe('SOON');
  });

  it('clearQueue empties the queue', () => {
    const relay = createRelay({ busConfig: makeConfig() });

    relay.classifyAndQueue('planner', 'scope', 'Expand?');
    relay.classifyAndQueue('executor', 'deploy', 'Docker?');
    expect(relay.getConsolidatedQueue()).toHaveLength(2);

    relay.clearQueue();
    expect(relay.getConsolidatedQueue()).toHaveLength(0);
  });

  it('generateReport produces a valid StatusReport', () => {
    const relay = createRelay({ busConfig: makeConfig() });

    const report = relay.generateReport({
      milestone: 'v1.28',
      phase: 'Phase 256',
      totalPhases: 7,
      overallStatus: 'on_track',
      budgetUtilization: 50,
      quality: 'healthy',
      positionReports: [{ position: 'planner', status: 'active' }],
    });

    expect(report.timestamp).toMatch(/^\d{8}-\d{6}$/);
    expect(report.milestone).toBe('v1.28');
  });

  it('formatReport produces markdown string', () => {
    const relay = createRelay({ busConfig: makeConfig() });

    const report = relay.generateReport({
      milestone: 'v1.28',
      phase: 'Phase 256',
      totalPhases: 7,
      overallStatus: 'deviation',
      budgetUtilization: 85,
      quality: 'warning',
      positionReports: [{ position: 'monitor', status: 'alerting', detail: 'Budget high' }],
      attentionItems: ['Budget at 85%'],
    });

    const md = relay.formatReport(report);
    expect(md).toContain('## Status Report');
    expect(md).toContain('deviation');
    expect(md).toContain('85%');
  });
});

// ============================================================================
// createRelay factory
// ============================================================================

describe('createRelay', () => {
  it('returns configured Relay instance', () => {
    const relay = createRelay({ busConfig: makeConfig(), maxQuestionsPerBatch: 5 });
    expect(relay).toBeInstanceOf(Relay);
  });

  it('applies default maxQuestionsPerBatch of 3', () => {
    const relay = createRelay({ busConfig: makeConfig() });

    // Queue 5 questions with unique topics
    for (let i = 0; i < 5; i++) {
      relay.classifyAndQueue('planner', `topic-${i}`, `Question ${i}?`);
    }

    const batch = relay.getBatch();
    expect(batch.questions).toHaveLength(3);
    expect(batch.held).toBe(2);
  });
});

// ============================================================================
// Schema validation
// ============================================================================

describe('Zod schemas', () => {
  it('RelayConfigSchema validates with defaults', () => {
    const result = RelayConfigSchema.parse({ busConfig: makeConfig() });
    expect(result.maxQuestionsPerBatch).toBe(3);
  });

  it('QuestionEntrySchema validates a question entry', () => {
    const entry = QuestionEntrySchema.parse({
      id: 'q1',
      from: 'planner',
      topic: 'auth',
      question: 'Use JWT?',
      priority: 'BATCH',
      receivedAt: '20260220-120000',
    });
    expect(entry.from).toBe('planner');
  });

  it('QuestionBatchSchema validates a batch', () => {
    const batch = QuestionBatchSchema.parse({
      questions: [],
      held: 0,
      totalPending: 0,
    });
    expect(batch.held).toBe(0);
  });

  it('PositionStatusSchema validates with optional detail', () => {
    const ps = PositionStatusSchema.parse({ position: 'executor', status: 'idle' });
    expect(ps.detail).toBeUndefined();

    const psDetail = PositionStatusSchema.parse({
      position: 'planner',
      status: 'active',
      detail: 'Planning phase 3',
    });
    expect(psDetail.detail).toBe('Planning phase 3');
  });
});

// ============================================================================
// Barrel export
// ============================================================================

describe('barrel export', () => {
  it('includes coordinator and relay modules', async () => {
    const den = await import('./index.js');

    // Relay exports
    expect(den.classifyPriority).toBeDefined();
    expect(den.consolidateQuestions).toBeDefined();
    expect(den.batchForUser).toBeDefined();
    expect(den.generateStatusReport).toBeDefined();
    expect(den.formatReportMarkdown).toBeDefined();
    expect(den.Relay).toBeDefined();
    expect(den.createRelay).toBeDefined();
    expect(den.RelayConfigSchema).toBeDefined();
    expect(den.QuestionEntrySchema).toBeDefined();
    expect(den.QuestionBatchSchema).toBeDefined();
    expect(den.PositionStatusSchema).toBeDefined();
    expect(den.StatusReportSchema).toBeDefined();

    // Coordinator exports (from parallel plan 256-01)
    expect(den.CoordinatorConfigSchema).toBeDefined();
    expect(den.PhaseAssignmentSchema).toBeDefined();
    expect(den.Coordinator).toBeDefined();
    expect(den.createCoordinator).toBeDefined();
  });
});
