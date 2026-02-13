/**
 * TDD tests for the console message envelope Zod schema.
 *
 * Covers BRIDGE-02 (envelope schema):
 * - Valid envelope parsing
 * - All message types accepted
 * - All sources accepted
 * - Missing required fields rejected
 * - Invalid id format rejected
 * - Invalid source rejected
 * - Invalid type rejected
 * - Invalid timestamp rejected
 * - Payload must be an object
 * - Roundtrip preserves all fields
 *
 * @module console/schema.test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { MessageEnvelopeSchema } from './schema.js';

/** Helper: a fully valid envelope for reuse across tests. */
const validEnvelope = {
  id: 'msg-20260213-001',
  type: 'milestone-submit',
  timestamp: '2026-02-13T14:30:00Z',
  source: 'dashboard',
  payload: { name: 'v2.0' },
};

// ============================================================================
// Valid envelope
// ============================================================================

describe('MessageEnvelopeSchema valid envelope', () => {
  it('parses a fully specified envelope successfully', () => {
    const result = MessageEnvelopeSchema.parse(validEnvelope);
    expect(result).toBeDefined();
  });

  it('preserves all fields after parsing', () => {
    const result = MessageEnvelopeSchema.parse(validEnvelope);
    expect(result.id).toBe('msg-20260213-001');
    expect(result.type).toBe('milestone-submit');
    expect(result.timestamp).toBe('2026-02-13T14:30:00Z');
    expect(result.source).toBe('dashboard');
    expect(result.payload).toEqual({ name: 'v2.0' });
  });
});

// ============================================================================
// All message types accepted
// ============================================================================

describe('All message types accepted', () => {
  const types = ['milestone-submit', 'config-update', 'question-response', 'setting-change'] as const;

  for (const msgType of types) {
    it(`accepts type "${msgType}"`, () => {
      const result = MessageEnvelopeSchema.parse({ ...validEnvelope, type: msgType });
      expect(result.type).toBe(msgType);
    });
  }
});

// ============================================================================
// All sources accepted
// ============================================================================

describe('All sources accepted', () => {
  it('accepts source "dashboard"', () => {
    const result = MessageEnvelopeSchema.parse({ ...validEnvelope, source: 'dashboard' });
    expect(result.source).toBe('dashboard');
  });

  it('accepts source "session"', () => {
    const result = MessageEnvelopeSchema.parse({ ...validEnvelope, source: 'session' });
    expect(result.source).toBe('session');
  });
});

// ============================================================================
// Rejects missing required fields
// ============================================================================

describe('Rejects missing required fields', () => {
  it('rejects missing id', () => {
    const { id: _, ...noId } = validEnvelope;
    expect(() => MessageEnvelopeSchema.parse(noId)).toThrow(z.ZodError);
  });

  it('rejects missing type', () => {
    const { type: _, ...noType } = validEnvelope;
    expect(() => MessageEnvelopeSchema.parse(noType)).toThrow(z.ZodError);
  });

  it('rejects missing timestamp', () => {
    const { timestamp: _, ...noTimestamp } = validEnvelope;
    expect(() => MessageEnvelopeSchema.parse(noTimestamp)).toThrow(z.ZodError);
  });

  it('rejects missing source', () => {
    const { source: _, ...noSource } = validEnvelope;
    expect(() => MessageEnvelopeSchema.parse(noSource)).toThrow(z.ZodError);
  });

  it('rejects missing payload', () => {
    const { payload: _, ...noPayload } = validEnvelope;
    expect(() => MessageEnvelopeSchema.parse(noPayload)).toThrow(z.ZodError);
  });

  it('rejects empty object', () => {
    expect(() => MessageEnvelopeSchema.parse({})).toThrow(z.ZodError);
  });
});

// ============================================================================
// Rejects invalid id format
// ============================================================================

describe('Rejects invalid id format', () => {
  it('rejects empty string id', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, id: '' })).toThrow(z.ZodError);
  });

  it('rejects id without msg- prefix', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, id: 'invalid' })).toThrow(z.ZodError);
  });

  it('rejects numeric id (wrong type)', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, id: 123 })).toThrow(z.ZodError);
  });

  it('accepts msg-20260213-001 (standard format)', () => {
    const result = MessageEnvelopeSchema.parse({ ...validEnvelope, id: 'msg-20260213-001' });
    expect(result.id).toBe('msg-20260213-001');
  });

  it('accepts msg-20260213-999 (high sequence)', () => {
    const result = MessageEnvelopeSchema.parse({ ...validEnvelope, id: 'msg-20260213-999' });
    expect(result.id).toBe('msg-20260213-999');
  });
});

// ============================================================================
// Rejects invalid source
// ============================================================================

describe('Rejects invalid source', () => {
  it('rejects source "browser"', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, source: 'browser' })).toThrow(z.ZodError);
  });

  it('rejects source "server"', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, source: 'server' })).toThrow(z.ZodError);
  });

  it('rejects empty string source', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, source: '' })).toThrow(z.ZodError);
  });
});

// ============================================================================
// Rejects invalid type
// ============================================================================

describe('Rejects invalid type', () => {
  it('rejects type "unknown"', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, type: 'unknown' })).toThrow(z.ZodError);
  });

  it('rejects empty string type', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, type: '' })).toThrow(z.ZodError);
  });

  it('rejects numeric type (wrong type)', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, type: 123 })).toThrow(z.ZodError);
  });
});

// ============================================================================
// Rejects invalid timestamp
// ============================================================================

describe('Rejects invalid timestamp', () => {
  it('rejects empty string timestamp', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, timestamp: '' })).toThrow(z.ZodError);
  });

  it('rejects non-date string timestamp', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, timestamp: 'not-a-date' })).toThrow(z.ZodError);
  });

  it('rejects numeric timestamp (wrong type)', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, timestamp: 123 })).toThrow(z.ZodError);
  });

  it('accepts valid ISO 8601 timestamp', () => {
    const result = MessageEnvelopeSchema.parse(validEnvelope);
    expect(result.timestamp).toBe('2026-02-13T14:30:00Z');
  });
});

// ============================================================================
// Payload must be an object
// ============================================================================

describe('Payload must be an object', () => {
  it('rejects string payload', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, payload: 'string' })).toThrow(z.ZodError);
  });

  it('rejects numeric payload', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, payload: 123 })).toThrow(z.ZodError);
  });

  it('rejects null payload', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, payload: null })).toThrow(z.ZodError);
  });

  it('rejects array payload', () => {
    expect(() => MessageEnvelopeSchema.parse({ ...validEnvelope, payload: [] })).toThrow(z.ZodError);
  });

  it('accepts empty object payload', () => {
    const result = MessageEnvelopeSchema.parse({ ...validEnvelope, payload: {} });
    expect(result.payload).toEqual({});
  });
});

// ============================================================================
// Roundtrip preserves all fields
// ============================================================================

describe('Roundtrip preserves all fields', () => {
  it('parse output matches input exactly for all fields', () => {
    const input = {
      id: 'msg-20260213-042',
      type: 'config-update' as const,
      timestamp: '2026-02-13T18:00:00Z',
      source: 'session' as const,
      payload: { key: 'theme', value: 'dark', nested: { deep: true } },
    };

    const result = MessageEnvelopeSchema.parse(input);
    expect(result).toEqual(input);
  });
});
