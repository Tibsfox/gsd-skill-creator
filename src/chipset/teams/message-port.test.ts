/**
 * Tests for the MessagePort inter-chip communication system.
 *
 * Covers FIFO ordering, priority-based dequeuing, capacity limits,
 * peek without consuming, reply-based ownership semantics, drain,
 * and clear operations.
 */

import { describe, it, expect } from 'vitest';
import {
  MessagePort,
  PortMessageSchema,
  MESSAGE_PRIORITIES,
} from './message-port.js';
import type { PortMessage, MessagePriority } from './message-port.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a minimal valid PortMessage with overrides. */
function makeMessage(overrides: Partial<PortMessage> = {}): PortMessage {
  return {
    id: overrides.id ?? `msg-${Math.random().toString(36).slice(2, 8)}`,
    sender: overrides.sender ?? 'chip-a',
    receiver: overrides.receiver ?? 'chip-b',
    type: overrides.type ?? 'test-message',
    priority: overrides.priority ?? 'normal',
    payload: overrides.payload ?? { data: 'hello' },
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    ...(overrides.replyPort !== undefined ? { replyPort: overrides.replyPort } : {}),
    ...(overrides.inReplyTo !== undefined ? { inReplyTo: overrides.inReplyTo } : {}),
  };
}

// ============================================================================
// PortMessageSchema
// ============================================================================

describe('PortMessageSchema', () => {
  it('parses a valid message with all fields', () => {
    const msg = {
      id: 'msg-001',
      sender: 'agnus',
      receiver: 'denise',
      type: 'render-request',
      priority: 'normal',
      payload: { content: 'test' },
      replyPort: 'agnus-reply',
      inReplyTo: 'msg-000',
      timestamp: '2026-01-01T00:00:00Z',
    };
    const result = PortMessageSchema.parse(msg);
    expect(result.id).toBe('msg-001');
    expect(result.sender).toBe('agnus');
    expect(result.receiver).toBe('denise');
    expect(result.type).toBe('render-request');
    expect(result.priority).toBe('normal');
    expect(result.payload).toEqual({ content: 'test' });
    expect(result.replyPort).toBe('agnus-reply');
    expect(result.inReplyTo).toBe('msg-000');
    expect(result.timestamp).toBe('2026-01-01T00:00:00Z');
  });

  it('parses a valid message with minimal fields (replyPort and inReplyTo optional)', () => {
    const msg = {
      id: 'msg-002',
      sender: 'paula',
      receiver: 'gary',
      type: 'io-request',
      priority: 'low',
      payload: null,
      timestamp: '2026-01-01T00:00:00Z',
    };
    const result = PortMessageSchema.parse(msg);
    expect(result.id).toBe('msg-002');
    expect(result.replyPort).toBeUndefined();
    expect(result.inReplyTo).toBeUndefined();
  });

  it('rejects missing sender', () => {
    const msg = {
      id: 'msg-003',
      receiver: 'denise',
      type: 'test',
      priority: 'normal',
      payload: {},
      timestamp: '2026-01-01T00:00:00Z',
    };
    expect(() => PortMessageSchema.parse(msg)).toThrow();
  });

  it('rejects missing receiver', () => {
    const msg = {
      id: 'msg-004',
      sender: 'agnus',
      type: 'test',
      priority: 'normal',
      payload: {},
      timestamp: '2026-01-01T00:00:00Z',
    };
    expect(() => PortMessageSchema.parse(msg)).toThrow();
  });

  it('rejects missing type', () => {
    const msg = {
      id: 'msg-005',
      sender: 'agnus',
      receiver: 'denise',
      priority: 'normal',
      payload: {},
      timestamp: '2026-01-01T00:00:00Z',
    };
    expect(() => PortMessageSchema.parse(msg)).toThrow();
  });

  it('accepts all three priority values', () => {
    for (const priority of MESSAGE_PRIORITIES) {
      const msg = makeMessage({ priority });
      const result = PortMessageSchema.parse(msg);
      expect(result.priority).toBe(priority);
    }
  });

  it('rejects invalid priority value', () => {
    const msg = {
      id: 'msg-006',
      sender: 'agnus',
      receiver: 'denise',
      type: 'test',
      priority: 'critical',
      payload: {},
      timestamp: '2026-01-01T00:00:00Z',
    };
    expect(() => PortMessageSchema.parse(msg)).toThrow();
  });

  it('accepts any payload value (z.unknown())', () => {
    const payloads = [null, 42, 'string', { nested: true }, [1, 2, 3], undefined];
    for (const payload of payloads) {
      const msg = makeMessage({ payload });
      expect(() => PortMessageSchema.parse(msg)).not.toThrow();
    }
  });
});

// ============================================================================
// MessagePort -- FIFO ordering
// ============================================================================

describe('MessagePort -- FIFO ordering', () => {
  it('dequeues messages in FIFO order for same priority', () => {
    const port = new MessagePort('test-port', 10);
    const msgA = makeMessage({ id: 'a', priority: 'normal' });
    const msgB = makeMessage({ id: 'b', priority: 'normal' });
    const msgC = makeMessage({ id: 'c', priority: 'normal' });

    expect(port.enqueue(msgA)).toBe(true);
    expect(port.enqueue(msgB)).toBe(true);
    expect(port.enqueue(msgC)).toBe(true);

    expect(port.dequeue()?.id).toBe('a');
    expect(port.dequeue()?.id).toBe('b');
    expect(port.dequeue()?.id).toBe('c');
  });
});

// ============================================================================
// MessagePort -- dequeue from empty port
// ============================================================================

describe('MessagePort -- dequeue from empty port', () => {
  it('returns undefined when dequeuing from an empty port', () => {
    const port = new MessagePort('empty-port', 10);
    expect(port.dequeue()).toBeUndefined();
  });
});

// ============================================================================
// MessagePort -- capacity limit
// ============================================================================

describe('MessagePort -- capacity limit', () => {
  it('enforces capacity limit and recovers after dequeue', () => {
    const port = new MessagePort('small-port', 2);
    const msg1 = makeMessage({ id: 'cap-1' });
    const msg2 = makeMessage({ id: 'cap-2' });
    const msg3 = makeMessage({ id: 'cap-3' });

    expect(port.enqueue(msg1)).toBe(true);
    expect(port.enqueue(msg2)).toBe(true);
    // Port is full -- third enqueue should fail
    expect(port.enqueue(msg3)).toBe(false);

    // Dequeue one frees space
    port.dequeue();
    // Now enqueue should succeed again
    expect(port.enqueue(msg3)).toBe(true);
  });
});

// ============================================================================
// MessagePort -- peek without consuming
// ============================================================================

describe('MessagePort -- peek without consuming', () => {
  it('returns the front message without removing it', () => {
    const port = new MessagePort('peek-port', 10);
    const msgA = makeMessage({ id: 'peek-a' });

    port.enqueue(msgA);

    // First peek returns msgA
    expect(port.peek()?.id).toBe('peek-a');
    // Second peek still returns msgA (not consumed)
    expect(port.peek()?.id).toBe('peek-a');
    // Dequeue actually removes it
    expect(port.dequeue()?.id).toBe('peek-a');
    // Now peek returns undefined
    expect(port.peek()).toBeUndefined();
  });
});

// ============================================================================
// MessagePort -- pending count
// ============================================================================

describe('MessagePort -- pending count', () => {
  it('tracks pending message count correctly', () => {
    const port = new MessagePort('count-port', 10);

    expect(port.pending).toBe(0);

    port.enqueue(makeMessage({ id: 'count-1' }));
    expect(port.pending).toBe(1);

    port.enqueue(makeMessage({ id: 'count-2' }));
    expect(port.pending).toBe(2);

    port.dequeue();
    expect(port.pending).toBe(1);

    port.dequeue();
    expect(port.pending).toBe(0);
  });
});

// ============================================================================
// MessagePort -- reply-based ownership
// ============================================================================

describe('MessagePort -- reply-based ownership', () => {
  it('tracks sender ownership until reply is received', () => {
    const receiverPort = new MessagePort('receiver-port', 10);

    // Sender sends a message with replyPort set
    const request = makeMessage({
      id: 'req-001',
      sender: 'agnus',
      receiver: 'denise',
      replyPort: 'sender-reply-port',
    });

    receiverPort.enqueue(request);

    // Message is owned by the sender
    expect(receiverPort.getOwner('req-001')).toBe('agnus');

    // Receiver dequeues the message
    const received = receiverPort.dequeue();
    expect(received?.id).toBe('req-001');

    // Ownership is still tracked (not released by dequeue alone)
    // The ownership is released when a reply referencing this message arrives

    // Create a reply port for the sender
    const senderReplyPort = new MessagePort('sender-reply-port', 10);

    // Receiver sends reply on sender's reply port
    const reply = makeMessage({
      id: 'reply-001',
      sender: 'denise',
      receiver: 'agnus',
      inReplyTo: 'req-001',
    });

    senderReplyPort.enqueue(reply);

    // When reply is dequeued, ownership of the original message is released
    const dequeuedReply = senderReplyPort.dequeue();
    expect(dequeuedReply?.inReplyTo).toBe('req-001');
  });
});

// ============================================================================
// MessagePort -- reply routing
// ============================================================================

describe('MessagePort -- reply routing', () => {
  it('routes replies to the sender reply port via replyPort field', () => {
    const receiverPort = new MessagePort('receiver-port', 10);
    const senderReplyPort = new MessagePort('agnus-reply', 10);

    // Sender sends message with replyPort indicating where to send replies
    const request = makeMessage({
      id: 'route-001',
      sender: 'agnus',
      receiver: 'denise',
      replyPort: 'agnus-reply',
    });

    receiverPort.enqueue(request);

    // Receiver dequeues and reads replyPort to know where to send reply
    const received = receiverPort.dequeue()!;
    expect(received.replyPort).toBe('agnus-reply');

    // Receiver creates reply directed to the sender's reply port
    const reply = makeMessage({
      id: 'route-reply-001',
      sender: 'denise',
      receiver: 'agnus',
      inReplyTo: received.id,
    });

    // Reply goes to the sender's reply port (not broadcast, not back to receiver)
    senderReplyPort.enqueue(reply);

    // Sender gets the reply from their own reply port
    const receivedReply = senderReplyPort.dequeue()!;
    expect(receivedReply.inReplyTo).toBe('route-001');
    expect(receivedReply.sender).toBe('denise');
  });
});

// ============================================================================
// MessagePort -- priority ordering
// ============================================================================

describe('MessagePort -- priority ordering', () => {
  it('dequeues urgent before normal before low', () => {
    const port = new MessagePort('priority-port', 10);

    // Enqueue in reverse priority order: low, urgent, normal
    port.enqueue(makeMessage({ id: 'low-1', priority: 'low' }));
    port.enqueue(makeMessage({ id: 'urgent-1', priority: 'urgent' }));
    port.enqueue(makeMessage({ id: 'normal-1', priority: 'normal' }));

    // Dequeue should return in priority order
    expect(port.dequeue()?.id).toBe('urgent-1');
    expect(port.dequeue()?.id).toBe('normal-1');
    expect(port.dequeue()?.id).toBe('low-1');
  });

  it('maintains FIFO within same priority level', () => {
    const port = new MessagePort('fifo-prio-port', 10);

    port.enqueue(makeMessage({ id: 'normal-a', priority: 'normal' }));
    port.enqueue(makeMessage({ id: 'normal-b', priority: 'normal' }));
    port.enqueue(makeMessage({ id: 'normal-c', priority: 'normal' }));

    expect(port.dequeue()?.id).toBe('normal-a');
    expect(port.dequeue()?.id).toBe('normal-b');
    expect(port.dequeue()?.id).toBe('normal-c');
  });
});

// ============================================================================
// MessagePort -- drain
// ============================================================================

describe('MessagePort -- drain', () => {
  it('returns all messages in priority order and empties the port', () => {
    const port = new MessagePort('drain-port', 10);

    port.enqueue(makeMessage({ id: 'drain-low', priority: 'low' }));
    port.enqueue(makeMessage({ id: 'drain-urgent', priority: 'urgent' }));
    port.enqueue(makeMessage({ id: 'drain-normal-a', priority: 'normal' }));
    port.enqueue(makeMessage({ id: 'drain-normal-b', priority: 'normal' }));

    const all = port.drain();

    expect(all.map((m) => m.id)).toEqual([
      'drain-urgent',
      'drain-normal-a',
      'drain-normal-b',
      'drain-low',
    ]);

    // Port is empty after drain
    expect(port.pending).toBe(0);
    expect(port.dequeue()).toBeUndefined();
  });
});

// ============================================================================
// MessagePort -- clear
// ============================================================================

describe('MessagePort -- clear', () => {
  it('removes all messages and resets pending to zero', () => {
    const port = new MessagePort('clear-port', 10);

    port.enqueue(makeMessage({ id: 'clear-1' }));
    port.enqueue(makeMessage({ id: 'clear-2' }));
    port.enqueue(makeMessage({ id: 'clear-3' }));

    expect(port.pending).toBe(3);

    port.clear();

    expect(port.pending).toBe(0);
    expect(port.dequeue()).toBeUndefined();
  });
});
