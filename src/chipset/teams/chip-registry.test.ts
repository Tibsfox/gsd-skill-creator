/**
 * Tests for the chip registry and four-chip definitions.
 *
 * Validates:
 * - Default registry contains four chips: Agnus, Denise, Paula, Gary
 * - Each chip has correct domain, description, and DMA allocation
 * - DMA allocations sum to 100%
 * - ChipRegistry provides get/getByDomain/all/register operations
 * - Duplicate registration throws
 */

import { describe, it, expect } from 'vitest';
import {
  ChipRegistry,
  createDefaultRegistry,
  AGNUS,
  DENISE,
  PAULA,
  GARY,
} from './chip-registry.js';

// ============================================================================
// createDefaultRegistry
// ============================================================================

describe('createDefaultRegistry', () => {
  it('returns registry with exactly 4 chips', () => {
    const registry = createDefaultRegistry();
    expect(registry.all()).toHaveLength(4);
  });

  it('contains chips named agnus, denise, paula, gary', () => {
    const registry = createDefaultRegistry();
    const names = registry.all().map((c) => c.name);
    expect(names).toContain('agnus');
    expect(names).toContain('denise');
    expect(names).toContain('paula');
    expect(names).toContain('gary');
  });
});

// ============================================================================
// AGNUS chip definition
// ============================================================================

describe('AGNUS chip definition', () => {
  it('has name agnus', () => {
    expect(AGNUS.name).toBe('agnus');
  });

  it('has domain context', () => {
    expect(AGNUS.domain).toBe('context');
  });

  it('description contains context or scheduling', () => {
    expect(AGNUS.description).toMatch(/context|scheduling/i);
  });

  it('has dma percentage of 60', () => {
    expect(AGNUS.dma.percentage).toBe(60);
  });

  it('has port declarations (at least one)', () => {
    expect(AGNUS.ports.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// DENISE chip definition
// ============================================================================

describe('DENISE chip definition', () => {
  it('has name denise', () => {
    expect(DENISE.name).toBe('denise');
  });

  it('has domain output', () => {
    expect(DENISE.domain).toBe('output');
  });

  it('description contains output or rendering', () => {
    expect(DENISE.description).toMatch(/output|rendering/i);
  });

  it('has dma percentage of 15', () => {
    expect(DENISE.dma.percentage).toBe(15);
  });
});

// ============================================================================
// PAULA chip definition
// ============================================================================

describe('PAULA chip definition', () => {
  it('has name paula', () => {
    expect(PAULA.name).toBe('paula');
  });

  it('has domain io', () => {
    expect(PAULA.domain).toBe('io');
  });

  it('description contains I/O or event', () => {
    expect(PAULA.description).toMatch(/I\/O|event/i);
  });

  it('has dma percentage of 15', () => {
    expect(PAULA.dma.percentage).toBe(15);
  });
});

// ============================================================================
// GARY chip definition
// ============================================================================

describe('GARY chip definition', () => {
  it('has name gary', () => {
    expect(GARY.name).toBe('gary');
  });

  it('has domain glue', () => {
    expect(GARY.domain).toBe('glue');
  });

  it('description contains glue or integration', () => {
    expect(GARY.description).toMatch(/glue|integration/i);
  });

  it('has dma percentage of 10', () => {
    expect(GARY.dma.percentage).toBe(10);
  });
});

// ============================================================================
// DMA allocations
// ============================================================================

describe('DMA allocations', () => {
  it('sum to 100%', () => {
    const total =
      AGNUS.dma.percentage +
      DENISE.dma.percentage +
      PAULA.dma.percentage +
      GARY.dma.percentage;
    expect(total).toBe(100);
  });
});

// ============================================================================
// ChipRegistry.get
// ============================================================================

describe('ChipRegistry.get', () => {
  it('returns chip by name', () => {
    const registry = createDefaultRegistry();
    const agnus = registry.get('agnus');
    expect(agnus).toBeDefined();
    expect(agnus!.name).toBe('agnus');
  });

  it('returns undefined for nonexistent name', () => {
    const registry = createDefaultRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});

// ============================================================================
// ChipRegistry.getByDomain
// ============================================================================

describe('ChipRegistry.getByDomain', () => {
  it('returns AGNUS for domain context', () => {
    const registry = createDefaultRegistry();
    const chip = registry.getByDomain('context');
    expect(chip).toBeDefined();
    expect(chip!.name).toBe('agnus');
  });

  it('returns DENISE for domain output', () => {
    const registry = createDefaultRegistry();
    const chip = registry.getByDomain('output');
    expect(chip).toBeDefined();
    expect(chip!.name).toBe('denise');
  });
});

// ============================================================================
// ChipRegistry.all
// ============================================================================

describe('ChipRegistry.all', () => {
  it('returns array of length 4', () => {
    const registry = createDefaultRegistry();
    expect(registry.all()).toHaveLength(4);
  });

  it('contains all four chip names', () => {
    const registry = createDefaultRegistry();
    const names = registry.all().map((c) => c.name);
    expect(names).toContain('agnus');
    expect(names).toContain('denise');
    expect(names).toContain('paula');
    expect(names).toContain('gary');
  });
});

// ============================================================================
// ChipRegistry.register
// ============================================================================

describe('ChipRegistry.register', () => {
  it('adds a custom chip that can be retrieved', () => {
    const registry = createDefaultRegistry();
    registry.register({
      name: 'custom',
      domain: 'glue',
      description: 'A custom glue chip',
      dma: { percentage: 5 },
      ports: [],
      signalMask: { allocated: 0 },
    });
    const custom = registry.get('custom');
    expect(custom).toBeDefined();
    expect(custom!.name).toBe('custom');
  });

  it('throws on duplicate name registration', () => {
    const registry = createDefaultRegistry();
    expect(() =>
      registry.register({
        name: 'agnus',
        domain: 'context',
        description: 'Duplicate',
        dma: { percentage: 5 },
        ports: [],
        signalMask: { allocated: 0 },
      })
    ).toThrow();
  });
});
