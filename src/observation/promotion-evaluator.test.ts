import { describe, it, expect } from 'vitest';
import { PromotionEvaluator, DEFAULT_PROMOTION_CRITERIA } from './promotion-evaluator.js';
import type { SessionObservation } from '../types/observation.js';

function makeObservation(overrides: Partial<SessionObservation> = {}): SessionObservation {
  return {
    sessionId: 'test-session',
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    durationMinutes: 0,
    source: 'startup',
    reason: 'logout',
    metrics: {
      userMessages: 0,
      assistantMessages: 0,
      toolCalls: 0,
      uniqueFilesRead: 0,
      uniqueFilesWritten: 0,
      uniqueCommandsRun: 0,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills: [],
    ...overrides,
  };
}

describe('PromotionEvaluator', () => {
  const evaluator = new PromotionEvaluator();

  it('rejects trivial session with score 0', () => {
    const obs = makeObservation({
      metrics: {
        userMessages: 1,
        assistantMessages: 0,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      durationMinutes: 0,
    });

    const result = evaluator.evaluate(obs);
    expect(result.promote).toBe(false);
    expect(result.score).toBe(0);
  });

  it('tool calls are strongest signal (+0.3)', () => {
    const obs = makeObservation({
      metrics: {
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: 3,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.3);
    expect(result.promote).toBe(true);
  });

  it('long duration contributes (+0.2)', () => {
    const obs = makeObservation({
      durationMinutes: 10,
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.2);
  });

  it('short but non-trivial duration contributes partial (+0.1)', () => {
    const obs = makeObservation({
      durationMinutes: 3,
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.1);
  });

  it('file activity contributes (+0.2)', () => {
    const obs = makeObservation({
      metrics: {
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: 0,
        uniqueFilesRead: 5,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.2);
  });

  it('user engagement contributes (+0.15)', () => {
    const obs = makeObservation({
      metrics: {
        userMessages: 8,
        assistantMessages: 0,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.15);
  });

  it('moderate engagement contributes partial (+0.05)', () => {
    const obs = makeObservation({
      metrics: {
        userMessages: 4,
        assistantMessages: 0,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.05);
  });

  it('rich metadata contributes (+0.15)', () => {
    const obs = makeObservation({
      topCommands: ['npm test', 'git status'],
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.15);
  });

  it('full high-signal session scores near 1.0', () => {
    const obs = makeObservation({
      durationMinutes: 15,
      metrics: {
        userMessages: 10,
        assistantMessages: 8,
        toolCalls: 5,
        uniqueFilesRead: 8,
        uniqueFilesWritten: 3,
        uniqueCommandsRun: 4,
      },
      topCommands: ['npm test', 'git commit'],
      topFiles: ['src/main.ts'],
      topTools: ['Read', 'Bash'],
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBeGreaterThanOrEqual(0.9);
    expect(result.score).toBeLessThanOrEqual(1.0);
    expect(result.promote).toBe(true);
  });

  it('promotion reasons include human-readable descriptions', () => {
    const obs = makeObservation({
      durationMinutes: 10,
      metrics: {
        userMessages: 6,
        assistantMessages: 5,
        toolCalls: 3,
        uniqueFilesRead: 4,
        uniqueFilesWritten: 2,
        uniqueCommandsRun: 1,
      },
      topCommands: ['npm test'],
    });

    const result = evaluator.evaluate(obs);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('tool calls'))).toBe(true);
    expect(result.reasons.some(r => r.includes('duration'))).toBe(true);
    expect(result.reasons.some(r => r.includes('files accessed'))).toBe(true);
    expect(result.reasons.some(r => r.includes('user messages'))).toBe(true);
    expect(result.reasons.some(r => r.includes('rich metadata'))).toBe(true);
  });

  it('custom threshold changes promotion decision', () => {
    const strictEvaluator = new PromotionEvaluator(0.5);
    const obs = makeObservation({
      metrics: {
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: 3,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
    });

    // Score is 0.3 (tool calls only), below custom threshold of 0.5
    const result = strictEvaluator.evaluate(obs);
    expect(result.score).toBe(0.3);
    expect(result.promote).toBe(false);
  });

  it('borderline at threshold promotes (>= not >)', () => {
    // Score needs to be exactly 0.3
    // Tool calls alone give exactly 0.3
    const obs = makeObservation({
      metrics: {
        userMessages: 0,
        assistantMessages: 0,
        toolCalls: 1,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
    });

    const result = evaluator.evaluate(obs);
    expect(result.score).toBe(0.3);
    expect(result.promote).toBe(true);
  });

  it('production-realistic empty session is rejected', () => {
    // Mirrors actual production data: 0 tool calls, empty arrays, 1 user message, < 2 min
    const obs = makeObservation({
      durationMinutes: 1,
      metrics: {
        userMessages: 1,
        assistantMessages: 1,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      topCommands: [],
      topFiles: [],
      topTools: [],
    });

    const result = evaluator.evaluate(obs);
    expect(result.promote).toBe(false);
    expect(result.score).toBe(0);
  });

  it('exports DEFAULT_PROMOTION_CRITERIA with minScore 0.3', () => {
    expect(DEFAULT_PROMOTION_CRITERIA.minScore).toBe(0.3);
  });
});
