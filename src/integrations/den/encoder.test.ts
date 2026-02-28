/**
 * Tests for the ISA compact message encoder and decoder.
 *
 * Validates timestamp formatting, header encoding/decoding,
 * full message round-trips for all 5 spec examples, filename
 * generation, and error handling for invalid inputs.
 */

import { describe, it, expect } from 'vitest';

import {
  formatTimestamp,
  parseTimestamp,
  encodeHeader,
  decodeHeader,
  encodeMessage,
  decodeMessage,
  messageFilename,
} from './encoder.js';
import type { MessageHeader, BusMessage } from './types.js';

// ============================================================================
// formatTimestamp / parseTimestamp
// ============================================================================

describe('formatTimestamp', () => {
  it('formats a UTC date to YYYYMMDD-HHMMSS', () => {
    const date = new Date('2026-02-19T21:05:00Z');
    expect(formatTimestamp(date)).toBe('20260219-210500');
  });

  it('zero-pads single-digit months and days', () => {
    const date = new Date('2026-01-05T03:07:09Z');
    expect(formatTimestamp(date)).toBe('20260105-030709');
  });

  it('handles midnight correctly', () => {
    const date = new Date('2026-12-31T00:00:00Z');
    expect(formatTimestamp(date)).toBe('20261231-000000');
  });

  it('handles end of day correctly', () => {
    const date = new Date('2026-06-15T23:59:59Z');
    expect(formatTimestamp(date)).toBe('20260615-235959');
  });
});

describe('parseTimestamp', () => {
  it('parses YYYYMMDD-HHMMSS back to a Date', () => {
    const date = parseTimestamp('20260219-210500');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(1); // 0-indexed
    expect(date.getUTCDate()).toBe(19);
    expect(date.getUTCHours()).toBe(21);
    expect(date.getUTCMinutes()).toBe(5);
    expect(date.getUTCSeconds()).toBe(0);
  });

  it('round-trips with formatTimestamp', () => {
    const original = new Date('2026-02-19T21:05:00Z');
    const ts = formatTimestamp(original);
    const parsed = parseTimestamp(ts);
    expect(parsed.getTime()).toBe(original.getTime());
  });

  it('throws on invalid format', () => {
    expect(() => parseTimestamp('2026-02-19T21:05:00Z')).toThrow();
    expect(() => parseTimestamp('not-a-timestamp')).toThrow();
    expect(() => parseTimestamp('')).toThrow();
  });
});

// ============================================================================
// encodeHeader / decodeHeader
// ============================================================================

describe('encodeHeader', () => {
  it('encodes a header to pipe-delimited string', () => {
    const header: MessageHeader = {
      timestamp: '20260219-210500',
      priority: 1,
      opcode: 'EXEC',
      src: 'coordinator',
      dst: 'executor',
      length: 2,
    };
    expect(encodeHeader(header)).toBe('20260219-210500|1|EXEC|coordinator|executor|2');
  });

  it('includes all 6 fields in correct order', () => {
    const header: MessageHeader = {
      timestamp: '20260101-000000',
      priority: 0,
      opcode: 'HALT',
      src: 'monitor',
      dst: 'coordinator',
      length: 0,
    };
    const parts = encodeHeader(header).split('|');
    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe('20260101-000000');
    expect(parts[1]).toBe('0');
    expect(parts[2]).toBe('HALT');
    expect(parts[3]).toBe('monitor');
    expect(parts[4]).toBe('coordinator');
    expect(parts[5]).toBe('0');
  });
});

describe('decodeHeader', () => {
  it('round-trips with encodeHeader', () => {
    const header: MessageHeader = {
      timestamp: '20260219-210500',
      priority: 1,
      opcode: 'EXEC',
      src: 'coordinator',
      dst: 'executor',
      length: 2,
    };
    const encoded = encodeHeader(header);
    const decoded = decodeHeader(encoded);
    expect(decoded).toEqual(header);
  });

  it('throws on wrong field count', () => {
    expect(() => decodeHeader('20260219-210500|1|EXEC|coordinator')).toThrow();
    expect(() => decodeHeader('a|b|c|d|e|f|g')).toThrow();
  });

  it('throws on invalid priority (Zod validation)', () => {
    expect(() => decodeHeader('20260219-210500|9|EXEC|coordinator|executor|2')).toThrow();
  });

  it('throws on invalid opcode', () => {
    expect(() => decodeHeader('20260219-210500|1|INVALID|coordinator|executor|2')).toThrow();
  });

  it('throws on invalid agent ID', () => {
    expect(() => decodeHeader('20260219-210500|1|EXEC|nobody|executor|2')).toThrow();
  });
});

// ============================================================================
// encodeMessage / decodeMessage
// ============================================================================

describe('encodeMessage', () => {
  it('produces header line + payload lines joined with newlines', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-210500',
        priority: 1,
        opcode: 'EXEC',
        src: 'coordinator',
        dst: 'executor',
        length: 2,
      },
      payload: ['PHASE:execute-phase', 'PLAN:phase-7-plan-001.md'],
    };
    const encoded = encodeMessage(msg);
    const lines = encoded.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('20260219-210500|1|EXEC|coordinator|executor|2');
    expect(lines[1]).toBe('PHASE:execute-phase');
    expect(lines[2]).toBe('PLAN:phase-7-plan-001.md');
  });

  it('produces single header line for empty payload', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-210500',
        priority: 6,
        opcode: 'NOP',
        src: 'monitor',
        dst: 'coordinator',
        length: 0,
      },
      payload: [],
    };
    const encoded = encodeMessage(msg);
    expect(encoded).toBe('20260219-210500|6|NOP|monitor|coordinator|0');
    expect(encoded.split('\n')).toHaveLength(1);
  });
});

describe('decodeMessage', () => {
  // Spec example 1: Phase transition
  it('round-trips phase transition message', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-210500',
        priority: 1,
        opcode: 'EXEC',
        src: 'coordinator',
        dst: 'executor',
        length: 2,
      },
      payload: ['PHASE:execute-phase', 'PLAN:phase-7-plan-001.md'],
    };
    const encoded = encodeMessage(msg);
    const decoded = decodeMessage(encoded);
    expect(decoded).toEqual(msg);
  });

  // Spec example 2: Verification result
  it('round-trips verification result message', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-211000',
        priority: 2,
        opcode: 'CMP',
        src: 'verifier',
        dst: 'coordinator',
        length: 3,
      },
      payload: [
        'RESULT:pass',
        'TESTS:42/42',
        'COVERAGE:95%',
      ],
    };
    const encoded = encodeMessage(msg);
    const decoded = decodeMessage(encoded);
    expect(decoded).toEqual(msg);
  });

  // Spec example 3: Budget alert
  it('round-trips budget alert message', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-211500',
        priority: 0,
        opcode: 'HALT',
        src: 'monitor',
        dst: 'coordinator',
        length: 2,
      },
      payload: [
        'ALERT:budget-exceeded',
        'TOKENS:95000/100000',
      ],
    };
    const encoded = encodeMessage(msg);
    const decoded = decodeMessage(encoded);
    expect(decoded).toEqual(msg);
  });

  // Spec example 4: Readiness response
  it('round-trips readiness response message', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-212000',
        priority: 1,
        opcode: 'BEQ',
        src: 'planner',
        dst: 'coordinator',
        length: 2,
      },
      payload: [
        'READY:true',
        'PLANS:3',
      ],
    };
    const encoded = encodeMessage(msg);
    const decoded = decodeMessage(encoded);
    expect(decoded).toEqual(msg);
  });

  // Spec example 5: Artifact handoff
  it('round-trips artifact handoff message', () => {
    const msg: BusMessage = {
      header: {
        timestamp: '20260219-213000',
        priority: 4,
        opcode: 'MOV',
        src: 'executor',
        dst: 'verifier',
        length: 3,
      },
      payload: [
        'ARTIFACT:src/auth/jwt.ts',
        'COMMIT:abc1234',
        'TESTS:src/auth/jwt.test.ts',
      ],
    };
    const encoded = encodeMessage(msg);
    const decoded = decodeMessage(encoded);
    expect(decoded).toEqual(msg);
  });

  it('throws on corrupt/incomplete input', () => {
    expect(() => decodeMessage('')).toThrow();
    expect(() => decodeMessage('not|enough|fields')).toThrow();
  });

  it('throws when payload count does not match header length', () => {
    // Header says length=2 but only 1 payload line
    const raw = '20260219-210500|1|EXEC|coordinator|executor|2\nONLY_ONE_LINE';
    expect(() => decodeMessage(raw)).toThrow();
  });
});

// ============================================================================
// messageFilename
// ============================================================================

describe('messageFilename', () => {
  it('generates deterministic filename from header', () => {
    const header: MessageHeader = {
      timestamp: '20260219-210500',
      priority: 1,
      opcode: 'EXEC',
      src: 'coordinator',
      dst: 'executor',
      length: 2,
    };
    expect(messageFilename(header)).toBe('20260219-210500-EXEC-coordinator-executor.msg');
  });

  it('includes all identifying fields', () => {
    const header: MessageHeader = {
      timestamp: '20260101-000000',
      priority: 0,
      opcode: 'HALT',
      src: 'monitor',
      dst: 'all',
      length: 0,
    };
    const filename = messageFilename(header);
    expect(filename).toContain('HALT');
    expect(filename).toContain('monitor');
    expect(filename).toContain('all');
    expect(filename.endsWith('.msg')).toBe(true);
  });
});
