/**
 * Tests for handleMessage -- type-dispatched message handler.
 *
 * Pure function tests: no filesystem, no side effects.
 * Each test creates a MessageEnvelope and asserts the returned MessageAction.
 *
 * @module console/message-handler.test
 */

import { describe, it, expect } from 'vitest';
import { handleMessage } from './message-handler.js';
import type { MessageAction } from './message-handler.js';
import type { MessageEnvelope } from './types.js';
import { CONSOLE_DIRS } from './types.js';

/** Helper to create a valid envelope with overrides. */
function makeEnvelope(overrides: Partial<MessageEnvelope> = {}): MessageEnvelope {
  return {
    id: 'msg-20260213-001',
    type: 'milestone-submit',
    timestamp: '2026-02-13T15:00:00Z',
    source: 'dashboard',
    payload: {},
    ...overrides,
  };
}

describe('handleMessage', () => {
  // ---------------------------------------------------------------------------
  // milestone-submit (4 tests)
  // ---------------------------------------------------------------------------
  describe('milestone-submit', () => {
    it('returns init-milestone action for valid milestone-submit message', () => {
      const envelope = makeEnvelope({
        type: 'milestone-submit',
        payload: { config_ref: 'milestone-config.json' },
      });

      const result = handleMessage(envelope);

      expect(result.action).toBe('init-milestone');
    });

    it('configPath points to console config directory', () => {
      const envelope = makeEnvelope({
        type: 'milestone-submit',
        payload: { config_ref: 'milestone-config.json' },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'init-milestone' }>;

      expect(result.configPath).toBe(CONSOLE_DIRS.config + '/milestone-config.json');
    });

    it('uploadsDir points to console uploads directory', () => {
      const envelope = makeEnvelope({
        type: 'milestone-submit',
        payload: { config_ref: 'milestone-config.json' },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'init-milestone' }>;

      expect(result.uploadsDir).toBe(CONSOLE_DIRS.uploads);
    });

    it('returns error action when payload is missing config_ref field', () => {
      const envelope = makeEnvelope({
        type: 'milestone-submit',
        payload: {},
      });

      const result = handleMessage(envelope);

      expect(result.action).toBe('error');
      expect((result as Extract<MessageAction, { action: 'error' }>).reason).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // config-update (4 tests)
  // ---------------------------------------------------------------------------
  describe('config-update', () => {
    it('returns apply-settings with hot: true for hot-configurable settings', () => {
      const envelope = makeEnvelope({
        type: 'config-update',
        payload: { settings: { mode: 'yolo' }, hot: true },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'apply-settings' }>;

      expect(result.action).toBe('apply-settings');
      expect(result.hot).toBe(true);
    });

    it('returns apply-settings with hot: false for cold settings', () => {
      const envelope = makeEnvelope({
        type: 'config-update',
        payload: { settings: { model_preference: 'speed' }, hot: false },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'apply-settings' }>;

      expect(result.action).toBe('apply-settings');
      expect(result.hot).toBe(false);
    });

    it('changes field contains the settings from the payload', () => {
      const envelope = makeEnvelope({
        type: 'config-update',
        payload: { settings: { mode: 'yolo', depth: 'fast' }, hot: true },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'apply-settings' }>;

      expect(result.changes).toEqual({ mode: 'yolo', depth: 'fast' });
    });

    it('returns error action when payload is missing settings field', () => {
      const envelope = makeEnvelope({
        type: 'config-update',
        payload: { hot: true },
      });

      const result = handleMessage(envelope);

      expect(result.action).toBe('error');
      expect((result as Extract<MessageAction, { action: 'error' }>).reason).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // question-response (3 tests)
  // ---------------------------------------------------------------------------
  describe('question-response', () => {
    it('returns apply-answer action for valid question-response', () => {
      const envelope = makeEnvelope({
        type: 'question-response',
        payload: { question_id: 'q-001', answer: 'yes' },
      });

      const result = handleMessage(envelope);

      expect(result.action).toBe('apply-answer');
    });

    it('extracts questionId from payload.question_id', () => {
      const envelope = makeEnvelope({
        type: 'question-response',
        payload: { question_id: 'q-042', answer: { choice: 'B' } },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'apply-answer' }>;

      expect(result.questionId).toBe('q-042');
      expect(result.answer).toEqual({ choice: 'B' });
    });

    it('returns error action when payload is missing question_id', () => {
      const envelope = makeEnvelope({
        type: 'question-response',
        payload: { answer: 'yes' },
      });

      const result = handleMessage(envelope);

      expect(result.action).toBe('error');
      expect((result as Extract<MessageAction, { action: 'error' }>).reason).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases (3 tests)
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns unknown action for unrecognized message type', () => {
      const envelope = makeEnvelope({
        type: 'some-future-type' as any,
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'unknown' }>;

      expect(result.action).toBe('unknown');
      expect(result.type).toBe('some-future-type');
    });

    it('handles setting-change type same as config-update', () => {
      const envelope = makeEnvelope({
        type: 'setting-change',
        payload: { settings: { mode: 'hitl' }, hot: false },
      });

      const result = handleMessage(envelope) as Extract<MessageAction, { action: 'apply-settings' }>;

      expect(result.action).toBe('apply-settings');
      expect(result.changes).toEqual({ mode: 'hitl' });
      expect(result.hot).toBe(false);
    });

    it('handleMessage is a pure function (no side effects)', () => {
      const envelope = makeEnvelope({
        type: 'milestone-submit',
        payload: { config_ref: 'test.json' },
      });

      // Call twice with same input -- should return same result
      const result1 = handleMessage(envelope);
      const result2 = handleMessage(envelope);

      expect(result1).toEqual(result2);
    });
  });
});
