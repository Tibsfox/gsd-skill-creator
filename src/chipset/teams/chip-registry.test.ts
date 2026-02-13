/**
 * Tests for the engine registry and four engine definitions.
 *
 * Validates:
 * - Default registry contains four engines: context, render, io, router
 * - Each engine has correct domain, description, and budget allocation
 * - Budget allocations sum to 100%
 * - EngineRegistry provides get/getByDomain/all/register operations
 * - Duplicate registration throws
 */

import { describe, it, expect } from 'vitest';
import {
  EngineRegistry,
  createDefaultRegistry,
  CONTEXT_ENGINE,
  RENDER_ENGINE,
  IO_ENGINE,
  ROUTER_ENGINE,
} from './chip-registry.js';

// ============================================================================
// createDefaultRegistry
// ============================================================================

describe('createDefaultRegistry', () => {
  it('returns registry with exactly 4 engines', () => {
    const registry = createDefaultRegistry();
    expect(registry.all()).toHaveLength(4);
  });

  it('contains engines named context-engine, render-engine, io-engine, router-engine', () => {
    const registry = createDefaultRegistry();
    const names = registry.all().map((c) => c.name);
    expect(names).toContain('context-engine');
    expect(names).toContain('render-engine');
    expect(names).toContain('io-engine');
    expect(names).toContain('router-engine');
  });
});

// ============================================================================
// CONTEXT_ENGINE definition
// ============================================================================

describe('CONTEXT_ENGINE definition', () => {
  it('has name context-engine', () => {
    expect(CONTEXT_ENGINE.name).toBe('context-engine');
  });

  it('has domain context', () => {
    expect(CONTEXT_ENGINE.domain).toBe('context');
  });

  it('description contains context or scheduling', () => {
    expect(CONTEXT_ENGINE.description).toMatch(/context|scheduling/i);
  });

  it('has dma percentage of 60', () => {
    expect(CONTEXT_ENGINE.dma.percentage).toBe(60);
  });

  it('has port declarations (at least one)', () => {
    expect(CONTEXT_ENGINE.ports.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// RENDER_ENGINE definition
// ============================================================================

describe('RENDER_ENGINE definition', () => {
  it('has name render-engine', () => {
    expect(RENDER_ENGINE.name).toBe('render-engine');
  });

  it('has domain output', () => {
    expect(RENDER_ENGINE.domain).toBe('output');
  });

  it('description contains output or rendering', () => {
    expect(RENDER_ENGINE.description).toMatch(/output|rendering/i);
  });

  it('has dma percentage of 15', () => {
    expect(RENDER_ENGINE.dma.percentage).toBe(15);
  });
});

// ============================================================================
// IO_ENGINE definition
// ============================================================================

describe('IO_ENGINE definition', () => {
  it('has name io-engine', () => {
    expect(IO_ENGINE.name).toBe('io-engine');
  });

  it('has domain io', () => {
    expect(IO_ENGINE.domain).toBe('io');
  });

  it('description contains I/O or event', () => {
    expect(IO_ENGINE.description).toMatch(/I\/O|event/i);
  });

  it('has dma percentage of 15', () => {
    expect(IO_ENGINE.dma.percentage).toBe(15);
  });
});

// ============================================================================
// ROUTER_ENGINE definition
// ============================================================================

describe('ROUTER_ENGINE definition', () => {
  it('has name router-engine', () => {
    expect(ROUTER_ENGINE.name).toBe('router-engine');
  });

  it('has domain glue', () => {
    expect(ROUTER_ENGINE.domain).toBe('glue');
  });

  it('description contains glue or integration', () => {
    expect(ROUTER_ENGINE.description).toMatch(/glue|integration/i);
  });

  it('has dma percentage of 10', () => {
    expect(ROUTER_ENGINE.dma.percentage).toBe(10);
  });
});

// ============================================================================
// Budget allocations
// ============================================================================

describe('Budget allocations', () => {
  it('sum to 100%', () => {
    const total =
      CONTEXT_ENGINE.dma.percentage +
      RENDER_ENGINE.dma.percentage +
      IO_ENGINE.dma.percentage +
      ROUTER_ENGINE.dma.percentage;
    expect(total).toBe(100);
  });
});

// ============================================================================
// EngineRegistry.get
// ============================================================================

describe('EngineRegistry.get', () => {
  it('returns engine by name', () => {
    const registry = createDefaultRegistry();
    const engine = registry.get('context-engine');
    expect(engine).toBeDefined();
    expect(engine!.name).toBe('context-engine');
  });

  it('returns undefined for nonexistent name', () => {
    const registry = createDefaultRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});

// ============================================================================
// EngineRegistry.getByDomain
// ============================================================================

describe('EngineRegistry.getByDomain', () => {
  it('returns CONTEXT_ENGINE for domain context', () => {
    const registry = createDefaultRegistry();
    const engine = registry.getByDomain('context');
    expect(engine).toBeDefined();
    expect(engine!.name).toBe('context-engine');
  });

  it('returns RENDER_ENGINE for domain output', () => {
    const registry = createDefaultRegistry();
    const engine = registry.getByDomain('output');
    expect(engine).toBeDefined();
    expect(engine!.name).toBe('render-engine');
  });
});

// ============================================================================
// EngineRegistry.all
// ============================================================================

describe('EngineRegistry.all', () => {
  it('returns array of length 4', () => {
    const registry = createDefaultRegistry();
    expect(registry.all()).toHaveLength(4);
  });

  it('contains all four engine names', () => {
    const registry = createDefaultRegistry();
    const names = registry.all().map((c) => c.name);
    expect(names).toContain('context-engine');
    expect(names).toContain('render-engine');
    expect(names).toContain('io-engine');
    expect(names).toContain('router-engine');
  });
});

// ============================================================================
// EngineRegistry.register
// ============================================================================

describe('EngineRegistry.register', () => {
  it('adds a custom engine that can be retrieved', () => {
    const registry = createDefaultRegistry();
    registry.register({
      name: 'custom',
      domain: 'glue',
      description: 'A custom glue engine',
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
        name: 'context-engine',
        domain: 'context',
        description: 'Duplicate',
        dma: { percentage: 5 },
        ports: [],
        signalMask: { allocated: 0 },
      })
    ).toThrow();
  });
});
