/**
 * TDD tests for the GSD Den chipset module.
 *
 * Tests chipset configuration parsing, staff roster extraction,
 * reproducibility validation, and the Chipset class wrapper.
 */

import { describe, it, expect } from 'vitest';
import {
  ChipsetConfigSchema,
  StaffPositionSchema,
  TopologyDefinitionSchema,
  parseChipsetConfig,
  extractStaffRoster,
  validateReproducibility,
  createDefaultChipsetConfig,
  createChipset,
  DEN_STAFF_POSITIONS,
  Chipset,
} from './chipset.js';

// ============================================================================
// Test fixtures
// ============================================================================

function validTopology() {
  return {
    type: 'squadron',
    agents: {
      coordinator: { role: 'orchestrator', context: 'main' },
      executor: { role: 'executor', context: 'fork' },
    },
    fallback: 'coordinator',
  };
}

function validPositions() {
  return [
    { id: 'coordinator', role: 'orchestrator', context: 'main', tokenBudget: 0.08, lifecycle: 'persistent', activationTrigger: 'session_start' },
    { id: 'executor', role: 'executor', context: 'fork', tokenBudget: 0.15, lifecycle: 'task', activationTrigger: 'on_execution' },
    { id: 'relay', role: 'interface', context: 'main', tokenBudget: 0.05, lifecycle: 'persistent', activationTrigger: 'session_start' },
  ];
}

function validChipsetInput() {
  return {
    name: 'test-chipset',
    version: '1.0.0',
    positions: validPositions(),
    topology: validTopology(),
    totalBudget: 0.28,
  };
}

// ============================================================================
// StaffPositionSchema
// ============================================================================

describe('StaffPositionSchema', () => {
  it('accepts valid staff position', () => {
    const input = {
      id: 'coordinator',
      role: 'orchestrator',
      context: 'main',
      tokenBudget: 0.08,
      lifecycle: 'persistent',
      activationTrigger: 'session_start',
    };
    const result = StaffPositionSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('rejects "all" as position id', () => {
    const input = {
      id: 'all',
      role: 'orchestrator',
      context: 'main',
      tokenBudget: 0.08,
      lifecycle: 'persistent',
      activationTrigger: 'session_start',
    };
    expect(() => StaffPositionSchema.parse(input)).toThrow();
  });

  it('rejects "user" as position id', () => {
    const input = {
      id: 'user',
      role: 'interface',
      context: 'main',
      tokenBudget: 0.05,
      lifecycle: 'persistent',
      activationTrigger: 'session_start',
    };
    expect(() => StaffPositionSchema.parse(input)).toThrow();
  });

  it('rejects invalid context enum', () => {
    const input = {
      id: 'coordinator',
      role: 'orchestrator',
      context: 'background',
      tokenBudget: 0.08,
      lifecycle: 'persistent',
      activationTrigger: 'session_start',
    };
    expect(() => StaffPositionSchema.parse(input)).toThrow();
  });

  it('rejects token budget above 1', () => {
    const input = {
      id: 'coordinator',
      role: 'orchestrator',
      context: 'main',
      tokenBudget: 1.5,
      lifecycle: 'persistent',
      activationTrigger: 'session_start',
    };
    expect(() => StaffPositionSchema.parse(input)).toThrow();
  });

  it('rejects negative token budget', () => {
    const input = {
      id: 'coordinator',
      role: 'orchestrator',
      context: 'main',
      tokenBudget: -0.1,
      lifecycle: 'persistent',
      activationTrigger: 'session_start',
    };
    expect(() => StaffPositionSchema.parse(input)).toThrow();
  });

  it('rejects invalid lifecycle enum', () => {
    const input = {
      id: 'coordinator',
      role: 'orchestrator',
      context: 'main',
      tokenBudget: 0.08,
      lifecycle: 'ephemeral',
      activationTrigger: 'session_start',
    };
    expect(() => StaffPositionSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// TopologyDefinitionSchema
// ============================================================================

describe('TopologyDefinitionSchema', () => {
  it('accepts valid topology definition', () => {
    const input = validTopology();
    const result = TopologyDefinitionSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('rejects missing fallback field', () => {
    const input = { type: 'squadron', agents: {} };
    expect(() => TopologyDefinitionSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// ChipsetConfigSchema
// ============================================================================

describe('ChipsetConfigSchema', () => {
  it('accepts valid chipset config', () => {
    const input = validChipsetInput();
    const result = ChipsetConfigSchema.parse(input);
    expect(result.name).toBe('test-chipset');
    expect(result.version).toBe('1.0.0');
    expect(result.positions).toHaveLength(3);
    expect(result.totalBudget).toBe(0.28);
  });

  it('rejects totalBudget > 1', () => {
    const input = { ...validChipsetInput(), totalBudget: 2.0 };
    expect(() => ChipsetConfigSchema.parse(input)).toThrow();
  });

  it('rejects empty object', () => {
    expect(() => ChipsetConfigSchema.parse({})).toThrow();
  });
});

// ============================================================================
// parseChipsetConfig
// ============================================================================

describe('parseChipsetConfig', () => {
  it('parses valid input and returns ChipsetConfig', () => {
    const input = validChipsetInput();
    const result = parseChipsetConfig(input);
    expect(result.name).toBe('test-chipset');
    expect(result.positions).toHaveLength(3);
  });

  it('is deterministic -- identical input produces identical output', () => {
    const input = validChipsetInput();
    const a = parseChipsetConfig(input);
    const b = parseChipsetConfig(input);
    expect(a).toEqual(b);
  });

  it('throws ZodError on empty object', () => {
    expect(() => parseChipsetConfig({})).toThrow();
  });

  it('throws ZodError on invalid totalBudget', () => {
    expect(() => parseChipsetConfig({ ...validChipsetInput(), totalBudget: 2.0 })).toThrow();
  });

  it('throws on null input', () => {
    expect(() => parseChipsetConfig(null)).toThrow();
  });

  it('throws on undefined input', () => {
    expect(() => parseChipsetConfig(undefined)).toThrow();
  });
});

// ============================================================================
// extractStaffRoster
// ============================================================================

describe('extractStaffRoster', () => {
  it('returns positions sorted alphabetically by id', () => {
    const config = parseChipsetConfig(validChipsetInput());
    const roster = extractStaffRoster(config);
    const ids = roster.map((p) => p.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  it('returns {id, role, context, tokenBudget} per position', () => {
    const config = parseChipsetConfig(validChipsetInput());
    const roster = extractStaffRoster(config);
    for (const entry of roster) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('role');
      expect(entry).toHaveProperty('context');
      expect(entry).toHaveProperty('tokenBudget');
    }
  });

  it('reordered positions produce same sorted roster', () => {
    const input = validChipsetInput();
    const reversed = { ...input, positions: [...input.positions].reverse() };
    const a = parseChipsetConfig(input);
    const b = parseChipsetConfig(reversed);
    expect(extractStaffRoster(a)).toEqual(extractStaffRoster(b));
  });

  it('returns correct count of positions', () => {
    const config = parseChipsetConfig(validChipsetInput());
    const roster = extractStaffRoster(config);
    expect(roster).toHaveLength(3);
  });
});

// ============================================================================
// validateReproducibility
// ============================================================================

describe('validateReproducibility', () => {
  it('identical configs produce {identical: true, differences: []}', () => {
    const input = validChipsetInput();
    const a = parseChipsetConfig(input);
    const b = parseChipsetConfig(input);
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it('detects totalBudget difference', () => {
    const a = parseChipsetConfig(validChipsetInput());
    const b = parseChipsetConfig({ ...validChipsetInput(), totalBudget: 0.50 });
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('totalBudget');
  });

  it('detects name difference', () => {
    const a = parseChipsetConfig(validChipsetInput());
    const b = parseChipsetConfig({ ...validChipsetInput(), name: 'different' });
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('name');
  });

  it('detects version difference', () => {
    const a = parseChipsetConfig(validChipsetInput());
    const b = parseChipsetConfig({ ...validChipsetInput(), version: '2.0.0' });
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('version');
  });

  it('detects topology difference', () => {
    const a = parseChipsetConfig(validChipsetInput());
    const modifiedTopology = { ...validTopology(), type: 'fleet' };
    const b = parseChipsetConfig({ ...validChipsetInput(), topology: modifiedTopology });
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('topology');
  });

  it('detects staff roster difference', () => {
    const input = validChipsetInput();
    const modifiedPositions = input.positions.map((p) =>
      p.id === 'coordinator' ? { ...p, tokenBudget: 0.20 } : p,
    );
    const a = parseChipsetConfig(input);
    const b = parseChipsetConfig({ ...input, positions: modifiedPositions });
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(false);
    expect(result.differences).toContain('staffRoster');
  });

  it('reordered positions do NOT produce differences (sorted comparison)', () => {
    const input = validChipsetInput();
    const reversed = { ...input, positions: [...input.positions].reverse() };
    const a = parseChipsetConfig(input);
    const b = parseChipsetConfig(reversed);
    const result = validateReproducibility(a, b);
    expect(result.identical).toBe(true);
    expect(result.differences).toEqual([]);
  });
});

// ============================================================================
// DEN_STAFF_POSITIONS
// ============================================================================

describe('DEN_STAFF_POSITIONS', () => {
  it('contains exactly 10 positions', () => {
    expect(DEN_STAFF_POSITIONS).toHaveLength(10);
  });

  it('includes all 10 canonical agent IDs', () => {
    const ids = DEN_STAFF_POSITIONS.map((p) => p.id);
    expect(ids).toContain('coordinator');
    expect(ids).toContain('relay');
    expect(ids).toContain('planner');
    expect(ids).toContain('configurator');
    expect(ids).toContain('monitor');
    expect(ids).toContain('dispatcher');
    expect(ids).toContain('verifier');
    expect(ids).toContain('chronicler');
    expect(ids).toContain('sentinel');
    expect(ids).toContain('executor');
  });

  it('does not include "all" or "user"', () => {
    const ids = DEN_STAFF_POSITIONS.map((p) => p.id);
    expect(ids).not.toContain('all');
    expect(ids).not.toContain('user');
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(DEN_STAFF_POSITIONS)).toBe(true);
  });

  it('coordinator has expected properties', () => {
    const coord = DEN_STAFF_POSITIONS.find((p) => p.id === 'coordinator');
    expect(coord).toBeDefined();
    expect(coord!.role).toBe('orchestrator');
    expect(coord!.context).toBe('main');
    expect(coord!.tokenBudget).toBe(0.08);
    expect(coord!.lifecycle).toBe('persistent');
    expect(coord!.activationTrigger).toBe('session_start');
  });

  it('executor has expected properties', () => {
    const exec = DEN_STAFF_POSITIONS.find((p) => p.id === 'executor');
    expect(exec).toBeDefined();
    expect(exec!.role).toBe('executor');
    expect(exec!.context).toBe('fork');
    expect(exec!.tokenBudget).toBe(0.15);
    expect(exec!.lifecycle).toBe('task');
    expect(exec!.activationTrigger).toBe('on_execution');
  });

  it('sentinel has expected properties', () => {
    const sentinel = DEN_STAFF_POSITIONS.find((p) => p.id === 'sentinel');
    expect(sentinel).toBeDefined();
    expect(sentinel!.role).toBe('recovery');
    expect(sentinel!.context).toBe('fork');
    expect(sentinel!.tokenBudget).toBe(0.04);
    expect(sentinel!.lifecycle).toBe('task');
    expect(sentinel!.activationTrigger).toBe('on_error');
  });
});

// ============================================================================
// createDefaultChipsetConfig
// ============================================================================

describe('createDefaultChipsetConfig', () => {
  it('returns a valid ChipsetConfig', () => {
    const config = createDefaultChipsetConfig();
    expect(() => ChipsetConfigSchema.parse(config)).not.toThrow();
  });

  it('has totalBudget of 0.59', () => {
    const config = createDefaultChipsetConfig();
    expect(config.totalBudget).toBe(0.59);
  });

  it('has 10 positions', () => {
    const config = createDefaultChipsetConfig();
    expect(config.positions).toHaveLength(10);
  });

  it('is deterministic -- two calls produce equal configs', () => {
    const a = createDefaultChipsetConfig();
    const b = createDefaultChipsetConfig();
    expect(a).toEqual(b);
  });
});

// ============================================================================
// Chipset class
// ============================================================================

describe('Chipset', () => {
  it('can be constructed from valid config', () => {
    const chipset = new Chipset(validChipsetInput());
    expect(chipset).toBeInstanceOf(Chipset);
  });

  it('throws on invalid config', () => {
    expect(() => new Chipset({})).toThrow();
  });

  it('getRoster returns sorted staff roster', () => {
    const chipset = new Chipset(validChipsetInput());
    const roster = chipset.getRoster();
    const ids = roster.map((p) => p.id);
    expect(ids).toEqual([...ids].sort());
  });

  it('validate returns identical:true for same config', () => {
    const chipset = new Chipset(validChipsetInput());
    const other = parseChipsetConfig(validChipsetInput());
    const result = chipset.validate(other);
    expect(result.identical).toBe(true);
  });

  it('getPosition returns matching position', () => {
    const chipset = new Chipset(validChipsetInput());
    const pos = chipset.getPosition('coordinator');
    expect(pos).toBeDefined();
    expect(pos!.id).toBe('coordinator');
    expect(pos!.role).toBe('orchestrator');
  });

  it('getPosition returns undefined for unknown id', () => {
    const chipset = new Chipset(validChipsetInput());
    const pos = chipset.getPosition('unknown' as any);
    expect(pos).toBeUndefined();
  });

  it('getTotalBudget returns the totalBudget', () => {
    const chipset = new Chipset(validChipsetInput());
    expect(chipset.getTotalBudget()).toBe(0.28);
  });
});

// ============================================================================
// createChipset factory
// ============================================================================

describe('createChipset', () => {
  it('creates Chipset from provided config', () => {
    const chipset = createChipset(validChipsetInput());
    expect(chipset).toBeInstanceOf(Chipset);
    expect(chipset.getTotalBudget()).toBe(0.28);
  });

  it('creates Chipset with default config when no argument', () => {
    const chipset = createChipset();
    expect(chipset).toBeInstanceOf(Chipset);
    expect(chipset.getTotalBudget()).toBe(0.59);
  });

  it('default chipset has 10 positions in roster', () => {
    const chipset = createChipset();
    expect(chipset.getRoster()).toHaveLength(10);
  });
});
