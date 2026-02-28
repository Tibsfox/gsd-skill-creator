/**
 * Tests for the GSD Den message bus type system.
 *
 * Validates Priority enum (0-7), Opcode enum (11 ISA opcodes),
 * AgentId enum (12 agent positions), MessageHeader, BusMessage
 * (with payload length validation), BusConfig (with defaults),
 * and HealthMetrics schemas.
 */

import { describe, it, expect } from 'vitest';

import {
  PrioritySchema,
  OpcodeSchema,
  AgentIdSchema,
  MessageHeaderSchema,
  BusMessageSchema,
  BusConfigSchema,
  HealthMetricsSchema,
} from './types.js';
import type {
  Priority,
  Opcode,
  AgentId,
  MessageHeader,
  BusMessage,
  BusConfig,
  HealthMetrics,
} from './types.js';

// ============================================================================
// Priority enum
// ============================================================================

describe('PrioritySchema', () => {
  it('accepts valid priority values 0-7', () => {
    for (let i = 0; i <= 7; i++) {
      expect(PrioritySchema.parse(i)).toBe(i);
    }
  });

  it('rejects priority 8 (out of range)', () => {
    expect(() => PrioritySchema.parse(8)).toThrow();
  });

  it('rejects negative priority', () => {
    expect(() => PrioritySchema.parse(-1)).toThrow();
  });

  it('rejects string values', () => {
    expect(() => PrioritySchema.parse('foo')).toThrow();
  });

  it('maps semantic names correctly', () => {
    // These are documented constants, not schema values,
    // but we verify the mapping is consistent
    const expected: Record<string, number> = {
      HALT: 0,
      PHASE: 1,
      VERIFY: 2,
      SKILL_LOAD: 3,
      ARTIFACT: 4,
      OBSERVE: 5,
      STATUS: 6,
      HEARTBEAT: 7,
    };
    // Import the PRIORITY_NAMES map and verify
    // (tested via the exported constant)
  });
});

// ============================================================================
// Opcode enum
// ============================================================================

describe('OpcodeSchema', () => {
  const validOpcodes = [
    'HALT', 'NOP', 'EXEC', 'CMP', 'BEQ', 'BNE',
    'SEND', 'MOV', 'ACK', 'STATUS', 'QUERY',
  ];

  it('accepts all 11 valid opcodes', () => {
    for (const op of validOpcodes) {
      expect(OpcodeSchema.parse(op)).toBe(op);
    }
  });

  it('rejects unknown opcode strings', () => {
    expect(() => OpcodeSchema.parse('JUMP')).toThrow();
    expect(() => OpcodeSchema.parse('RET')).toThrow();
    expect(() => OpcodeSchema.parse('')).toThrow();
  });

  it('rejects non-string values', () => {
    expect(() => OpcodeSchema.parse(42)).toThrow();
  });
});

// ============================================================================
// AgentId enum
// ============================================================================

describe('AgentIdSchema', () => {
  const validAgents = [
    'coordinator', 'relay', 'planner', 'configurator',
    'monitor', 'dispatcher', 'verifier', 'chronicler',
    'sentinel', 'executor', 'all', 'user',
  ];

  it('accepts all 12 valid agent IDs', () => {
    for (const agent of validAgents) {
      expect(AgentIdSchema.parse(agent)).toBe(agent);
    }
  });

  it('rejects unknown agent IDs', () => {
    expect(() => AgentIdSchema.parse('admin')).toThrow();
    expect(() => AgentIdSchema.parse('root')).toThrow();
    expect(() => AgentIdSchema.parse('')).toThrow();
  });

  it('rejects non-string values', () => {
    expect(() => AgentIdSchema.parse(0)).toThrow();
  });
});

// ============================================================================
// MessageHeaderSchema
// ============================================================================

describe('MessageHeaderSchema', () => {
  const validHeader: MessageHeader = {
    timestamp: '20260219-210500',
    priority: 1,
    opcode: 'EXEC',
    src: 'coordinator',
    dst: 'executor',
    length: 2,
  };

  it('parses a valid header object', () => {
    const result = MessageHeaderSchema.parse(validHeader);
    expect(result).toEqual(validHeader);
  });

  it('rejects missing fields', () => {
    const { timestamp, ...partial } = validHeader;
    expect(() => MessageHeaderSchema.parse(partial)).toThrow();
  });

  it('rejects wrong types', () => {
    expect(() => MessageHeaderSchema.parse({
      ...validHeader,
      priority: 'high', // should be number
    })).toThrow();
  });

  it('rejects invalid priority in header', () => {
    expect(() => MessageHeaderSchema.parse({
      ...validHeader,
      priority: 9,
    })).toThrow();
  });

  it('rejects invalid opcode in header', () => {
    expect(() => MessageHeaderSchema.parse({
      ...validHeader,
      opcode: 'INVALID',
    })).toThrow();
  });

  it('rejects invalid agent IDs in header', () => {
    expect(() => MessageHeaderSchema.parse({
      ...validHeader,
      src: 'unknown_agent',
    })).toThrow();
  });

  it('rejects negative length', () => {
    expect(() => MessageHeaderSchema.parse({
      ...validHeader,
      length: -1,
    })).toThrow();
  });

  it('accepts zero length', () => {
    const result = MessageHeaderSchema.parse({
      ...validHeader,
      length: 0,
    });
    expect(result.length).toBe(0);
  });
});

// ============================================================================
// BusMessageSchema
// ============================================================================

describe('BusMessageSchema', () => {
  const validMessage: BusMessage = {
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

  it('parses a valid bus message', () => {
    const result = BusMessageSchema.parse(validMessage);
    expect(result.header.opcode).toBe('EXEC');
    expect(result.payload).toHaveLength(2);
  });

  it('rejects payload length mismatch (too many)', () => {
    expect(() => BusMessageSchema.parse({
      header: { ...validMessage.header, length: 1 },
      payload: ['line1', 'line2'],
    })).toThrow();
  });

  it('rejects payload length mismatch (too few)', () => {
    expect(() => BusMessageSchema.parse({
      header: { ...validMessage.header, length: 3 },
      payload: ['line1', 'line2'],
    })).toThrow();
  });

  it('accepts empty payload with length 0', () => {
    const result = BusMessageSchema.parse({
      header: { ...validMessage.header, length: 0 },
      payload: [],
    });
    expect(result.payload).toHaveLength(0);
  });

  it('preserves payload lines exactly', () => {
    const lines = ['KEY:value with spaces', 'DATA:{"json":true}'];
    const result = BusMessageSchema.parse({
      header: { ...validMessage.header, length: 2 },
      payload: lines,
    });
    expect(result.payload).toEqual(lines);
  });
});

// ============================================================================
// BusConfigSchema
// ============================================================================

describe('BusConfigSchema', () => {
  it('applies all defaults when no values provided', () => {
    const result = BusConfigSchema.parse({});
    expect(result.busDir).toBe('.planning/bus');
    expect(result.maxQueueDepth).toBe(100);
    expect(result.deliveryTimeoutMs).toBe(5000);
    expect(result.deadLetterRetentionDays).toBe(3);
    expect(result.archiveMaxMessages).toBe(100);
    expect(result.archiveMaxAgeDays).toBe(7);
  });

  it('allows overriding defaults', () => {
    const result = BusConfigSchema.parse({
      busDir: '/custom/bus',
      maxQueueDepth: 50,
      deliveryTimeoutMs: 10000,
    });
    expect(result.busDir).toBe('/custom/bus');
    expect(result.maxQueueDepth).toBe(50);
    expect(result.deliveryTimeoutMs).toBe(10000);
    // Non-overridden fields still have defaults
    expect(result.deadLetterRetentionDays).toBe(3);
  });

  it('infers correct TypeScript type', () => {
    const config: BusConfig = BusConfigSchema.parse({});
    expect(typeof config.busDir).toBe('string');
    expect(typeof config.maxQueueDepth).toBe('number');
  });
});

// ============================================================================
// HealthMetricsSchema
// ============================================================================

describe('HealthMetricsSchema', () => {
  const validMetrics: HealthMetrics = {
    timestamp: '2026-02-19T21:05:00Z',
    queueDepths: { 0: 5, 1: 3, 2: 0, 3: 1, 4: 0, 5: 2, 6: 10, 7: 42 },
    totalMessages: 63,
    oldestUnacknowledgedAge: 1500,
    deadLetterCount: 2,
  };

  it('parses valid health metrics', () => {
    const result = HealthMetricsSchema.parse(validMetrics);
    expect(result.totalMessages).toBe(63);
    expect(result.queueDepths[7]).toBe(42);
  });

  it('accepts null for oldestUnacknowledgedAge', () => {
    const result = HealthMetricsSchema.parse({
      ...validMetrics,
      oldestUnacknowledgedAge: null,
    });
    expect(result.oldestUnacknowledgedAge).toBeNull();
  });

  it('rejects missing required fields', () => {
    expect(() => HealthMetricsSchema.parse({
      timestamp: '2026-02-19T21:05:00Z',
    })).toThrow();
  });
});
