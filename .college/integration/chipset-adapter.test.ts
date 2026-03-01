/**
 * Tests for ChipsetAdapter -- declarative panel-to-engine routing
 * that maps Rosetta panels to chipset specialist engine domains.
 *
 * @module integration/chipset-adapter.test
 */

import { describe, it, expect } from 'vitest';
import {
  ChipsetAdapter,
  DEFAULT_PANEL_MAPPING,
  type EngineResolver,
  type PanelChipsetMapping,
} from './chipset-adapter.js';
import type { PanelId } from '../rosetta-core/types.js';

// ─── Mock EngineResolver ─────────────────────────────────────────────────────

function makeMockResolver(): EngineResolver {
  const engines: Record<string, { name: string; domain: string; dma: { percentage: number } }> = {
    context: { name: 'context-engine', domain: 'context', dma: { percentage: 60 } },
    output: { name: 'render-engine', domain: 'output', dma: { percentage: 15 } },
    io: { name: 'io-engine', domain: 'io', dma: { percentage: 15 } },
    glue: { name: 'router-engine', domain: 'glue', dma: { percentage: 10 } },
  };

  return {
    getByDomain(domain: string) {
      return engines[domain];
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ChipsetAdapter', () => {
  it('default config maps systems panels (python, cpp, java) to context domain', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    expect(adapter.getDomainForPanel('python')).toBe('context');
    expect(adapter.getDomainForPanel('cpp')).toBe('context');
    expect(adapter.getDomainForPanel('java')).toBe('context');
  });

  it('default config maps heritage panels to output domain', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    expect(adapter.getDomainForPanel('lisp')).toBe('output');
    expect(adapter.getDomainForPanel('pascal')).toBe('output');
    expect(adapter.getDomainForPanel('fortran')).toBe('output');
    expect(adapter.getDomainForPanel('perl')).toBe('output');
    expect(adapter.getDomainForPanel('algol')).toBe('output');
  });

  it('default config maps frontier panel (unison) to io domain', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    expect(adapter.getDomainForPanel('unison')).toBe('io');
  });

  it('default config maps natural panel to glue domain', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    expect(adapter.getDomainForPanel('natural')).toBe('glue');
  });

  it('unknown panel falls back to glue domain', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    // vhdl is in the default mapping as glue, but test a truly unknown panel
    expect(adapter.getDomainForPanel('vhdl')).toBe('glue');

    // Cast to test truly unknown panel
    expect(adapter.getDomainForPanel('haskell' as PanelId)).toBe('glue');
  });

  it('resolveEngine() returns the EngineDefinition matching the mapped domain', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    const engine = adapter.resolveEngine('python');
    expect(engine).toBeDefined();
    expect(engine!.name).toBe('context-engine');
    expect(engine!.domain).toBe('context');
    expect(engine!.dma.percentage).toBe(60);
  });

  it('custom config overrides default mapping', () => {
    const adapter = new ChipsetAdapter({
      resolver: makeMockResolver(),
      mapping: { python: 'io' },
    });

    expect(adapter.getDomainForPanel('python')).toBe('io');
    // Other panels remain at defaults
    expect(adapter.getDomainForPanel('cpp')).toBe('context');
  });

  it('getMapping() returns the full resolved mapping', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });
    const mapping = adapter.getMapping();

    expect(mapping.python).toBe('context');
    expect(mapping.lisp).toBe('output');
    expect(mapping.unison).toBe('io');
    expect(mapping.natural).toBe('glue');
    expect(mapping.vhdl).toBe('glue');
  });

  it('routePanelRequest() returns a PanelRouteResult with engine details', () => {
    const adapter = new ChipsetAdapter({ resolver: makeMockResolver() });

    const result = adapter.routePanelRequest('python');

    expect(result.panelId).toBe('python');
    expect(result.engineName).toBe('context-engine');
    expect(result.engineDomain).toBe('context');
    expect(result.budgetPercentage).toBe(60);
  });

  it('config loads without errors from a plain object', () => {
    // Verify that creating with various config shapes does not throw
    expect(() => new ChipsetAdapter({ resolver: makeMockResolver() })).not.toThrow();
    expect(() => new ChipsetAdapter({
      resolver: makeMockResolver(),
      mapping: {},
      fallbackDomain: 'io',
    })).not.toThrow();
  });

  it('routePanelRequest() with unknown engine returns unknown defaults', () => {
    // Resolver that returns undefined for all domains
    const emptyResolver: EngineResolver = {
      getByDomain: () => undefined,
    };
    const adapter = new ChipsetAdapter({ resolver: emptyResolver });

    const result = adapter.routePanelRequest('python');

    expect(result.engineName).toBe('unknown');
    expect(result.budgetPercentage).toBe(0);
  });

  it('DEFAULT_PANEL_MAPPING covers all 11 PanelId values', () => {
    const allPanels: PanelId[] = [
      'python', 'cpp', 'java', 'lisp', 'pascal', 'fortran',
      'perl', 'algol', 'unison', 'vhdl', 'natural',
    ];
    for (const panel of allPanels) {
      expect(DEFAULT_PANEL_MAPPING[panel]).toBeDefined();
    }
  });
});
