/**
 * Tests for engine definition types and Zod schemas.
 *
 * Validates the type foundation for the team-as-engine framework:
 * - ENGINE_DOMAINS constant and EngineDomain type
 * - BudgetAllocationSchema (percentage 0-100 with description)
 * - PortDeclarationSchema (name, direction, optional messageTypes)
 * - SignalMaskSchema (32-bit allocated mask with optional labels)
 * - EngineDefinitionSchema (complete engine definition with defaults)
 * - SYSTEM_SIGNAL_BITS and USER_SIGNAL_BITS constants
 */

import { describe, it, expect } from 'vitest';
import {
  ENGINE_DOMAINS,
  BudgetAllocationSchema,
  PortDeclarationSchema,
  SignalMaskSchema,
  EngineDefinitionSchema,
  SYSTEM_SIGNAL_BITS,
  USER_SIGNAL_BITS,
} from './types.js';

// ============================================================================
// ENGINE_DOMAINS
// ============================================================================

describe('ENGINE_DOMAINS', () => {
  it('contains exactly 4 entries', () => {
    expect(ENGINE_DOMAINS).toHaveLength(4);
  });

  it('contains context, output, io, and glue', () => {
    expect(ENGINE_DOMAINS).toContain('context');
    expect(ENGINE_DOMAINS).toContain('output');
    expect(ENGINE_DOMAINS).toContain('io');
    expect(ENGINE_DOMAINS).toContain('glue');
  });
});

// ============================================================================
// BudgetAllocationSchema
// ============================================================================

describe('BudgetAllocationSchema', () => {
  it('parses valid allocation with percentage and description', () => {
    const result = BudgetAllocationSchema.parse({
      percentage: 60,
      description: 'Phase-critical context budget',
    });
    expect(result.percentage).toBe(60);
    expect(result.description).toBe('Phase-critical context budget');
  });

  it('parses percentage of 60 (context-engine level)', () => {
    const result = BudgetAllocationSchema.parse({ percentage: 60 });
    expect(result.percentage).toBe(60);
  });

  it('parses percentage of 0 (edge case)', () => {
    const result = BudgetAllocationSchema.parse({ percentage: 0 });
    expect(result.percentage).toBe(0);
  });

  it('parses percentage of 100 (edge case)', () => {
    const result = BudgetAllocationSchema.parse({ percentage: 100 });
    expect(result.percentage).toBe(100);
  });

  it('rejects negative percentage', () => {
    expect(() => BudgetAllocationSchema.parse({ percentage: -1 })).toThrow();
  });

  it('rejects percentage over 100', () => {
    expect(() => BudgetAllocationSchema.parse({ percentage: 101 })).toThrow();
  });

  it('rejects missing percentage', () => {
    expect(() => BudgetAllocationSchema.parse({})).toThrow();
  });
});

// ============================================================================
// PortDeclarationSchema
// ============================================================================

describe('PortDeclarationSchema', () => {
  it('parses valid port with name and direction', () => {
    const result = PortDeclarationSchema.parse({
      name: 'context-request',
      direction: 'in',
    });
    expect(result.name).toBe('context-request');
    expect(result.direction).toBe('in');
  });

  it('parses valid port with optional messageTypes', () => {
    const result = PortDeclarationSchema.parse({
      name: 'render-output',
      direction: 'out',
      messageTypes: ['render-result', 'format-result'],
    });
    expect(result.messageTypes).toEqual(['render-result', 'format-result']);
  });

  it('rejects missing name', () => {
    expect(() => PortDeclarationSchema.parse({ direction: 'in' })).toThrow();
  });

  it('rejects invalid direction value', () => {
    expect(() =>
      PortDeclarationSchema.parse({ name: 'test', direction: 'invalid' })
    ).toThrow();
  });

  it('accepts direction in', () => {
    const result = PortDeclarationSchema.parse({ name: 'p', direction: 'in' });
    expect(result.direction).toBe('in');
  });

  it('accepts direction out', () => {
    const result = PortDeclarationSchema.parse({ name: 'p', direction: 'out' });
    expect(result.direction).toBe('out');
  });

  it('accepts direction bidirectional', () => {
    const result = PortDeclarationSchema.parse({
      name: 'p',
      direction: 'bidirectional',
    });
    expect(result.direction).toBe('bidirectional');
  });
});

// ============================================================================
// SignalMaskSchema
// ============================================================================

describe('SignalMaskSchema', () => {
  it('parses valid mask with allocated and labels', () => {
    const result = SignalMaskSchema.parse({
      allocated: 0x00030000,
      labels: { ready: 16, done: 17 },
    });
    expect(result.allocated).toBe(0x00030000);
    expect(result.labels).toEqual({ ready: 16, done: 17 });
  });

  it('parses system bits only (0x0000FFFF)', () => {
    const result = SignalMaskSchema.parse({ allocated: 0x0000ffff });
    expect(result.allocated).toBe(0x0000ffff);
  });

  it('parses user bits only (0xFFFF0000)', () => {
    const result = SignalMaskSchema.parse({ allocated: 0xffff0000 });
    expect(result.allocated).toBe(0xffff0000);
  });

  it('parses all bits (0xFFFFFFFF)', () => {
    const result = SignalMaskSchema.parse({ allocated: 0xffffffff });
    expect(result.allocated).toBe(0xffffffff);
  });

  it('parses no bits (0)', () => {
    const result = SignalMaskSchema.parse({ allocated: 0 });
    expect(result.allocated).toBe(0);
  });

  it('parses optional labels mapping signal names to bit positions', () => {
    const result = SignalMaskSchema.parse({
      allocated: 3,
      labels: { ready: 0, done: 1 },
    });
    expect(result.labels).toEqual({ ready: 0, done: 1 });
  });
});

// ============================================================================
// EngineDefinitionSchema
// ============================================================================

describe('EngineDefinitionSchema', () => {
  it('parses valid engine with all fields', () => {
    const result = EngineDefinitionSchema.parse({
      name: 'context-engine',
      domain: 'context',
      description: 'Context management and scheduling',
      dma: { percentage: 60, description: 'Phase-critical budget' },
      ports: [{ name: 'context-request', direction: 'in' }],
      signalMask: { allocated: 0x00010000, labels: { ready: 16 } },
    });
    expect(result.name).toBe('context-engine');
    expect(result.domain).toBe('context');
    expect(result.ports).toHaveLength(1);
    expect(result.signalMask.allocated).toBe(0x00010000);
  });

  it('parses valid engine with minimal fields (ports and signalMask optional)', () => {
    const result = EngineDefinitionSchema.parse({
      name: 'test',
      domain: 'glue',
      description: 'A test engine',
      dma: { percentage: 10 },
    });
    expect(result.name).toBe('test');
    expect(result.ports).toEqual([]);
    expect(result.signalMask).toEqual({ allocated: 0 });
  });

  it('rejects missing name', () => {
    expect(() =>
      EngineDefinitionSchema.parse({
        domain: 'context',
        description: 'No name',
        dma: { percentage: 10 },
      })
    ).toThrow();
  });

  it('rejects missing domain', () => {
    expect(() =>
      EngineDefinitionSchema.parse({
        name: 'test',
        description: 'No domain',
        dma: { percentage: 10 },
      })
    ).toThrow();
  });

  it('rejects invalid domain value', () => {
    expect(() =>
      EngineDefinitionSchema.parse({
        name: 'test',
        domain: 'invalid',
        description: 'Bad domain',
        dma: { percentage: 10 },
      })
    ).toThrow();
  });

  it('rejects missing dma', () => {
    expect(() =>
      EngineDefinitionSchema.parse({
        name: 'test',
        domain: 'context',
        description: 'No budget',
      })
    ).toThrow();
  });

  it('defaults ports to empty array when not provided', () => {
    const result = EngineDefinitionSchema.parse({
      name: 'test',
      domain: 'io',
      description: 'Test',
      dma: { percentage: 5 },
    });
    expect(result.ports).toEqual([]);
  });

  it('defaults signalMask to { allocated: 0 } when not provided', () => {
    const result = EngineDefinitionSchema.parse({
      name: 'test',
      domain: 'output',
      description: 'Test',
      dma: { percentage: 5 },
    });
    expect(result.signalMask).toEqual({ allocated: 0 });
  });
});

// ============================================================================
// Signal bit constants
// ============================================================================

describe('Signal bit constants', () => {
  it('SYSTEM_SIGNAL_BITS equals 0x0000FFFF (bits 0-15)', () => {
    expect(SYSTEM_SIGNAL_BITS).toBe(0x0000ffff);
  });

  it('USER_SIGNAL_BITS equals 0xFFFF0000 (bits 16-31)', () => {
    expect(USER_SIGNAL_BITS).toBe(0xffff0000);
  });

  it('SYSTEM | USER equals 0xFFFFFFFF (full 32-bit mask)', () => {
    expect((SYSTEM_SIGNAL_BITS | USER_SIGNAL_BITS) >>> 0).toBe(0xffffffff);
  });

  it('SYSTEM & USER equals 0 (no overlap)', () => {
    expect(SYSTEM_SIGNAL_BITS & USER_SIGNAL_BITS).toBe(0);
  });
});
