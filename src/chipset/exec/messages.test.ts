/**
 * Tests for the typed exec message protocol.
 *
 * Validates Amiga-inspired message fields (ln_Type, ln_Pri, mn_ReplyPort,
 * mn_Length), Zod schema validation, MESSAGE_TYPES enum, createMessage
 * factory with defaults, and createReply factory with routing.
 */

import { describe, it, expect } from 'vitest';
import {
  ExecMessageSchema,
  ExecMessage,
  MessageType,
  MESSAGE_TYPES,
  createMessage,
  createReply,
} from './messages.js';

// ============================================================================
// ExecMessageSchema Validation
// ============================================================================

describe('ExecMessageSchema', () => {
  const validMessage: ExecMessage = {
    id: 'msg-001',
    ln_Type: 'budget-query',
    ln_Pri: 0,
    mn_ReplyPort: 'agnus-reply',
    mn_Length: 500,
    sender: 'agnus',
    receiver: 'denise',
    payload: { query: 'remaining' },
    timestamp: '2026-02-12T00:00:00.000Z',
  };

  it('parses valid message with all fields', () => {
    const result = ExecMessageSchema.parse(validMessage);
    expect(result.id).toBe('msg-001');
    expect(result.ln_Type).toBe('budget-query');
    expect(result.ln_Pri).toBe(0);
    expect(result.mn_ReplyPort).toBe('agnus-reply');
    expect(result.mn_Length).toBe(500);
    expect(result.sender).toBe('agnus');
    expect(result.receiver).toBe('denise');
    expect(result.payload).toEqual({ query: 'remaining' });
    expect(result.timestamp).toBe('2026-02-12T00:00:00.000Z');
  });

  it('parses valid message with minimal fields', () => {
    const minimal = {
      id: 'msg-002',
      ln_Type: 'heartbeat',
      ln_Pri: 0,
      mn_Length: 0,
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
      timestamp: '2026-02-12T00:00:00.000Z',
    };
    const result = ExecMessageSchema.parse(minimal);
    expect(result.id).toBe('msg-002');
    expect(result.mn_ReplyPort).toBeUndefined();
    expect(result.inReplyTo).toBeUndefined();
  });

  it('rejects missing ln_Type', () => {
    const { ln_Type, ...noType } = validMessage;
    expect(() => ExecMessageSchema.parse(noType)).toThrow();
  });

  it('rejects missing sender', () => {
    const { sender, ...noSender } = validMessage;
    expect(() => ExecMessageSchema.parse(noSender)).toThrow();
  });

  it('rejects missing receiver', () => {
    const { receiver, ...noReceiver } = validMessage;
    expect(() => ExecMessageSchema.parse(noReceiver)).toThrow();
  });

  describe('ln_Pri signed byte range', () => {
    it('accepts -128 (lowest priority)', () => {
      const msg = { ...validMessage, ln_Pri: -128 };
      const result = ExecMessageSchema.parse(msg);
      expect(result.ln_Pri).toBe(-128);
    });

    it('accepts 127 (highest priority)', () => {
      const msg = { ...validMessage, ln_Pri: 127 };
      const result = ExecMessageSchema.parse(msg);
      expect(result.ln_Pri).toBe(127);
    });

    it('accepts 0 (default neutral)', () => {
      const msg = { ...validMessage, ln_Pri: 0 };
      const result = ExecMessageSchema.parse(msg);
      expect(result.ln_Pri).toBe(0);
    });

    it('rejects -129 (below signed byte range)', () => {
      const msg = { ...validMessage, ln_Pri: -129 };
      expect(() => ExecMessageSchema.parse(msg)).toThrow();
    });

    it('rejects 128 (above signed byte range)', () => {
      const msg = { ...validMessage, ln_Pri: 128 };
      expect(() => ExecMessageSchema.parse(msg)).toThrow();
    });
  });

  describe('mn_Length non-negative', () => {
    it('accepts 0', () => {
      const msg = { ...validMessage, mn_Length: 0 };
      const result = ExecMessageSchema.parse(msg);
      expect(result.mn_Length).toBe(0);
    });

    it('accepts 10000', () => {
      const msg = { ...validMessage, mn_Length: 10000 };
      const result = ExecMessageSchema.parse(msg);
      expect(result.mn_Length).toBe(10000);
    });

    it('rejects -1', () => {
      const msg = { ...validMessage, mn_Length: -1 };
      expect(() => ExecMessageSchema.parse(msg)).toThrow();
    });
  });
});

// ============================================================================
// MESSAGE_TYPES
// ============================================================================

describe('MESSAGE_TYPES', () => {
  const expectedTypes: string[] = [
    'budget-query',
    'budget-response',
    'allocate',
    'allocation-result',
    'schedule-request',
    'schedule-update',
    'render-request',
    'render-result',
    'format-request',
    'format-result',
    'io-request',
    'io-result',
    'observation',
    'route-request',
    'route-result',
    'pattern-data',
    'signal-forward',
    'heartbeat',
  ];

  it('contains all expected message types', () => {
    for (const type of expectedTypes) {
      expect(MESSAGE_TYPES).toContain(type);
    }
  });

  it('accepts any MESSAGE_TYPES value as ln_Type', () => {
    for (const type of MESSAGE_TYPES) {
      const msg = {
        id: 'msg-test',
        ln_Type: type,
        ln_Pri: 0,
        mn_Length: 0,
        sender: 'agnus',
        receiver: 'denise',
        payload: {},
        timestamp: '2026-02-12T00:00:00.000Z',
      };
      const result = ExecMessageSchema.parse(msg);
      expect(result.ln_Type).toBe(type);
    }
  });

  it('rejects unknown message type', () => {
    const msg = {
      id: 'msg-bad',
      ln_Type: 'not-a-real-type',
      ln_Pri: 0,
      mn_Length: 0,
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
      timestamp: '2026-02-12T00:00:00.000Z',
    };
    expect(() => ExecMessageSchema.parse(msg)).toThrow();
  });
});

// ============================================================================
// createMessage factory
// ============================================================================

describe('createMessage', () => {
  it('creates message with defaults', () => {
    const msg = createMessage({
      ln_Type: 'budget-query',
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
    });

    expect(msg.id).toBeTruthy();
    expect(typeof msg.id).toBe('string');
    expect(msg.id.length).toBeGreaterThan(0);
    expect(msg.ln_Pri).toBe(0);
    expect(msg.mn_Length).toBe(0);
    expect(msg.timestamp).toBeTruthy();
    expect(msg.mn_ReplyPort).toBeUndefined();
    expect(msg.inReplyTo).toBeUndefined();
  });

  it('creates message with explicit fields', () => {
    const msg = createMessage({
      ln_Type: 'render-request',
      sender: 'agnus',
      receiver: 'denise',
      payload: { format: 'markdown' },
      ln_Pri: 50,
      mn_ReplyPort: 'agnus-reply',
      mn_Length: 1500,
    });

    expect(msg.ln_Type).toBe('render-request');
    expect(msg.sender).toBe('agnus');
    expect(msg.receiver).toBe('denise');
    expect(msg.payload).toEqual({ format: 'markdown' });
    expect(msg.ln_Pri).toBe(50);
    expect(msg.mn_ReplyPort).toBe('agnus-reply');
    expect(msg.mn_Length).toBe(1500);
  });

  it('creates message with custom priority', () => {
    const msg = createMessage({
      ln_Type: 'budget-query',
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
      ln_Pri: 50,
    });
    expect(msg.ln_Pri).toBe(50);
  });

  it('creates message with reply port', () => {
    const msg = createMessage({
      ln_Type: 'budget-query',
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
      mn_ReplyPort: 'agnus-reply',
    });
    expect(msg.mn_ReplyPort).toBe('agnus-reply');
  });

  it('creates message with token cost estimate', () => {
    const msg = createMessage({
      ln_Type: 'budget-query',
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
      mn_Length: 1500,
    });
    expect(msg.mn_Length).toBe(1500);
  });
});

// ============================================================================
// createReply factory
// ============================================================================

describe('createReply', () => {
  it('creates reply referencing original message', () => {
    const original = createMessage({
      ln_Type: 'budget-query',
      sender: 'agnus',
      receiver: 'denise',
      payload: { query: 'remaining' },
      mn_ReplyPort: 'agnus-reply',
    });
    // Override id for deterministic test
    const origWithId = { ...original, id: 'msg-001' };

    const reply = createReply(origWithId, {
      ln_Type: 'budget-response',
      payload: { remaining: 5000 },
      sender: 'denise',
    });

    expect(reply.inReplyTo).toBe('msg-001');
    expect(reply.receiver).toBe('agnus'); // original sender
    expect(reply.sender).toBe('denise'); // the replier
  });

  it('routes reply to original sender', () => {
    const original = createMessage({
      ln_Type: 'render-request',
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
      mn_ReplyPort: 'agnus-reply',
    });

    const reply = createReply(original, {
      ln_Type: 'render-result',
      payload: { output: 'done' },
      sender: 'denise',
    });

    // Reply receiver is the original sender (correct routing)
    expect(reply.receiver).toBe(original.sender);
  });

  it('throws when original has no reply port', () => {
    const original = createMessage({
      ln_Type: 'heartbeat',
      sender: 'agnus',
      receiver: 'denise',
      payload: {},
    });

    expect(() =>
      createReply(original, {
        ln_Type: 'heartbeat',
        payload: {},
        sender: 'denise',
      }),
    ).toThrow('Original message has no reply port');
  });
});
