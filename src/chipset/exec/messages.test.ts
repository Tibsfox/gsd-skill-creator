/**
 * Tests for the typed kernel message protocol.
 *
 * Validates message fields (type, priority, replyPort, tokenCost),
 * Zod schema validation, MESSAGE_TYPES enum, createMessage factory
 * with defaults, and createReply factory with routing.
 */

import { describe, it, expect } from 'vitest';
import {
  KernelMessageSchema,
  KernelMessage,
  MessageType,
  MESSAGE_TYPES,
  createMessage,
  createReply,
} from './messages.js';

// ============================================================================
// KernelMessageSchema Validation
// ============================================================================

describe('KernelMessageSchema', () => {
  const validMessage: KernelMessage = {
    id: 'msg-001',
    type: 'budget-query',
    priority: 0,
    replyPort: 'context-engine-reply',
    tokenCost: 500,
    sender: 'context-engine',
    receiver: 'render-engine',
    payload: { query: 'remaining' },
    timestamp: '2026-02-12T00:00:00.000Z',
  };

  it('parses valid message with all fields', () => {
    const result = KernelMessageSchema.parse(validMessage);
    expect(result.id).toBe('msg-001');
    expect(result.type).toBe('budget-query');
    expect(result.priority).toBe(0);
    expect(result.replyPort).toBe('context-engine-reply');
    expect(result.tokenCost).toBe(500);
    expect(result.sender).toBe('context-engine');
    expect(result.receiver).toBe('render-engine');
    expect(result.payload).toEqual({ query: 'remaining' });
    expect(result.timestamp).toBe('2026-02-12T00:00:00.000Z');
  });

  it('parses valid message with minimal fields', () => {
    const minimal = {
      id: 'msg-002',
      type: 'heartbeat',
      priority: 0,
      tokenCost: 0,
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      timestamp: '2026-02-12T00:00:00.000Z',
    };
    const result = KernelMessageSchema.parse(minimal);
    expect(result.id).toBe('msg-002');
    expect(result.replyPort).toBeUndefined();
    expect(result.inReplyTo).toBeUndefined();
  });

  it('rejects missing type', () => {
    const { type, ...noType } = validMessage;
    expect(() => KernelMessageSchema.parse(noType)).toThrow();
  });

  it('rejects missing sender', () => {
    const { sender, ...noSender } = validMessage;
    expect(() => KernelMessageSchema.parse(noSender)).toThrow();
  });

  it('rejects missing receiver', () => {
    const { receiver, ...noReceiver } = validMessage;
    expect(() => KernelMessageSchema.parse(noReceiver)).toThrow();
  });

  describe('priority signed byte range', () => {
    it('accepts -128 (lowest priority)', () => {
      const msg = { ...validMessage, priority: -128 };
      const result = KernelMessageSchema.parse(msg);
      expect(result.priority).toBe(-128);
    });

    it('accepts 127 (highest priority)', () => {
      const msg = { ...validMessage, priority: 127 };
      const result = KernelMessageSchema.parse(msg);
      expect(result.priority).toBe(127);
    });

    it('accepts 0 (default neutral)', () => {
      const msg = { ...validMessage, priority: 0 };
      const result = KernelMessageSchema.parse(msg);
      expect(result.priority).toBe(0);
    });

    it('rejects -129 (below signed byte range)', () => {
      const msg = { ...validMessage, priority: -129 };
      expect(() => KernelMessageSchema.parse(msg)).toThrow();
    });

    it('rejects 128 (above signed byte range)', () => {
      const msg = { ...validMessage, priority: 128 };
      expect(() => KernelMessageSchema.parse(msg)).toThrow();
    });
  });

  describe('tokenCost non-negative', () => {
    it('accepts 0', () => {
      const msg = { ...validMessage, tokenCost: 0 };
      const result = KernelMessageSchema.parse(msg);
      expect(result.tokenCost).toBe(0);
    });

    it('accepts 10000', () => {
      const msg = { ...validMessage, tokenCost: 10000 };
      const result = KernelMessageSchema.parse(msg);
      expect(result.tokenCost).toBe(10000);
    });

    it('rejects -1', () => {
      const msg = { ...validMessage, tokenCost: -1 };
      expect(() => KernelMessageSchema.parse(msg)).toThrow();
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

  it('accepts any MESSAGE_TYPES value as type', () => {
    for (const type of MESSAGE_TYPES) {
      const msg = {
        id: 'msg-test',
        type: type,
        priority: 0,
        tokenCost: 0,
        sender: 'context-engine',
        receiver: 'render-engine',
        payload: {},
        timestamp: '2026-02-12T00:00:00.000Z',
      };
      const result = KernelMessageSchema.parse(msg);
      expect(result.type).toBe(type);
    }
  });

  it('rejects unknown message type', () => {
    const msg = {
      id: 'msg-bad',
      type: 'not-a-real-type',
      priority: 0,
      tokenCost: 0,
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      timestamp: '2026-02-12T00:00:00.000Z',
    };
    expect(() => KernelMessageSchema.parse(msg)).toThrow();
  });
});

// ============================================================================
// createMessage factory
// ============================================================================

describe('createMessage', () => {
  it('creates message with defaults', () => {
    const msg = createMessage({
      type: 'budget-query',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
    });

    expect(msg.id).toBeTruthy();
    expect(typeof msg.id).toBe('string');
    expect(msg.id.length).toBeGreaterThan(0);
    expect(msg.priority).toBe(0);
    expect(msg.tokenCost).toBe(0);
    expect(msg.timestamp).toBeTruthy();
    expect(msg.replyPort).toBeUndefined();
    expect(msg.inReplyTo).toBeUndefined();
  });

  it('creates message with explicit fields', () => {
    const msg = createMessage({
      type: 'render-request',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: { format: 'markdown' },
      priority: 50,
      replyPort: 'context-engine-reply',
      tokenCost: 1500,
    });

    expect(msg.type).toBe('render-request');
    expect(msg.sender).toBe('context-engine');
    expect(msg.receiver).toBe('render-engine');
    expect(msg.payload).toEqual({ format: 'markdown' });
    expect(msg.priority).toBe(50);
    expect(msg.replyPort).toBe('context-engine-reply');
    expect(msg.tokenCost).toBe(1500);
  });

  it('creates message with custom priority', () => {
    const msg = createMessage({
      type: 'budget-query',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      priority: 50,
    });
    expect(msg.priority).toBe(50);
  });

  it('creates message with reply port', () => {
    const msg = createMessage({
      type: 'budget-query',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      replyPort: 'context-engine-reply',
    });
    expect(msg.replyPort).toBe('context-engine-reply');
  });

  it('creates message with token cost estimate', () => {
    const msg = createMessage({
      type: 'budget-query',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      tokenCost: 1500,
    });
    expect(msg.tokenCost).toBe(1500);
  });
});

// ============================================================================
// createReply factory
// ============================================================================

describe('createReply', () => {
  it('creates reply referencing original message', () => {
    const original = createMessage({
      type: 'budget-query',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: { query: 'remaining' },
      replyPort: 'context-engine-reply',
    });
    // Override id for deterministic test
    const origWithId = { ...original, id: 'msg-001' };

    const reply = createReply(origWithId, {
      type: 'budget-response',
      payload: { remaining: 5000 },
      sender: 'render-engine',
    });

    expect(reply.inReplyTo).toBe('msg-001');
    expect(reply.receiver).toBe('context-engine'); // original sender
    expect(reply.sender).toBe('render-engine'); // the replier
  });

  it('routes reply to original sender', () => {
    const original = createMessage({
      type: 'render-request',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
      replyPort: 'context-engine-reply',
    });

    const reply = createReply(original, {
      type: 'render-result',
      payload: { output: 'done' },
      sender: 'render-engine',
    });

    // Reply receiver is the original sender (correct routing)
    expect(reply.receiver).toBe(original.sender);
  });

  it('throws when original has no reply port', () => {
    const original = createMessage({
      type: 'heartbeat',
      sender: 'context-engine',
      receiver: 'render-engine',
      payload: {},
    });

    expect(() =>
      createReply(original, {
        type: 'heartbeat',
        payload: {},
        sender: 'render-engine',
      }),
    ).toThrow('Original message has no reply port');
  });
});
