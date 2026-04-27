/**
 * @vitest-environment jsdom
 *
 * tests/spice-renderer/schematic-renderer.test.ts
 *
 * Tests for www/.../spice-renderer/schematic-renderer.ts.
 *
 * jsdom is required because the renderer manipulates the DOM (creates
 * <svg> trees, dispatches click events). The root vitest project doesn't
 * default to jsdom, so we opt-in via the docblock above.
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SchematicRenderer } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/schematic-renderer.js';
import type {
  Component,
  ComponentGround,
  ComponentTwoTerminal,
  ComponentOpamp,
  SchematicIR,
  Wire,
} from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/types.js';
import { parseCir } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/cir-parser.js';
import { autoLayout } from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/auto-layout.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SYMBOL_DIR = resolve(
  REPO_ROOT,
  'www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/spice-symbols',
);

// ============================================================================
// Symbol cache — preload on-disk SVGs so the renderer doesn't try to fetch
// over the network during tests. Maps the relative URLs declared in the
// symbol manifest to the raw on-disk SVG XML strings.
// ============================================================================

function loadSymbolCache(): Map<string, string> {
  const cache = new Map<string, string>();
  const files = readdirSync(SYMBOL_DIR).filter((f) => f.endsWith('.svg'));
  for (const f of files) {
    const xml = readFileSync(resolve(SYMBOL_DIR, f), 'utf8');
    cache.set(`./${f}`, xml);
  }
  return cache;
}

const SYMBOL_CACHE = loadSymbolCache();

// ============================================================================
// Fixture helpers
// ============================================================================

function makeR(ref: string, a: string, b: string, value = '1k'): ComponentTwoTerminal {
  return {
    kind: 'R',
    ref,
    nets: [a, b],
    value,
    geom: { pos: { x: 0, y: 0 }, rot: 0, flipH: false, flipV: false },
  };
}
function makeC(ref: string, a: string, b: string, value = '1u'): ComponentTwoTerminal {
  return {
    kind: 'C',
    ref,
    nets: [a, b],
    value,
    geom: { pos: { x: 0, y: 0 }, rot: 0, flipH: false, flipV: false },
  };
}
function makeV(ref: string, a: string, b: string, value = 'DC 5'): ComponentTwoTerminal {
  return {
    kind: 'V',
    ref,
    nets: [a, b],
    value,
    geom: { pos: { x: 0, y: 0 }, rot: 0, flipH: false, flipV: false },
  };
}
function makeGND(): ComponentGround {
  return {
    kind: 'GND',
    nets: ['0'],
    geom: { pos: { x: 0, y: 0 }, rot: 0, flipH: false, flipV: false },
  };
}

function buildFixtureIR(): SchematicIR {
  const components: Component[] = [
    makeV('V1', 'in', '0'),
    makeR('R1', 'in', 'mid'),
    makeC('C1', 'mid', '0'),
    makeGND(),
  ];
  // Position components manually so layout is deterministic + simple.
  components[0]!.geom.pos = { x: 0, y: 64 };
  components[1]!.geom.pos = { x: 64, y: 32 };
  components[2]!.geom.pos = { x: 128, y: 64 };
  components[3]!.geom.pos = { x: 64, y: 96 };

  const wires: Wire[] = [
    {
      net: 'in',
      segments: [{ from: { x: 0, y: 32 }, to: { x: 64, y: 32 } }],
    },
    {
      net: 'mid',
      segments: [{ from: { x: 64, y: 32 }, to: { x: 128, y: 32 } }],
    },
    {
      net: '0',
      segments: [{ from: { x: 64, y: 96 }, to: { x: 128, y: 96 } }],
    },
  ];

  return {
    title: 'fixture',
    components,
    wires,
    netLabels: [{ net: 'mid', pos: { x: 96, y: 16 }, orientation: 'h' }],
    directives: [
      { kind: '.tran', raw: '.tran 1u 100u', renderAsComment: true, pos: { x: 8, y: 160 } },
    ],
    models: {},
    bbox: { x: -32, y: 0, w: 192, h: 192 },
    parseWarnings: [],
    layoutSeed: 'fixture',
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('SchematicRenderer — fixture IR', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('renders one <g class="component"> per component', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    const components = host.querySelectorAll('g.component');
    expect(components.length).toBe(ir.components.length);
  });

  it('renders one <g class="wire"> per wire', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    const wires = host.querySelectorAll('g.wire');
    expect(wires.length).toBe(ir.wires.length);
  });

  it('emits a single root <svg class="spice-schematic"> with viewBox', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    const svgs = host.querySelectorAll('svg.spice-schematic');
    expect(svgs.length).toBe(1);
    const root = svgs[0]!;
    expect(root.getAttribute('viewBox')).toBe('-32 0 192 192');
    expect(root.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  });

  it('sets data-theme on the host container', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'modern-dark', symbolCache: SYMBOL_CACHE });
    r.render();
    expect(host.getAttribute('data-theme')).toBe('modern-dark');
  });

  it('writes data-ref attributes on component groups for click delegation', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'pro-qspice', symbolCache: SYMBOL_CACHE });
    r.render();
    const refs = Array.from(host.querySelectorAll('g.component[data-ref]'))
      .map((el) => el.getAttribute('data-ref'))
      .sort();
    // V1, R1, C1 (GND has no ref).
    expect(refs).toEqual(['C1', 'R1', 'V1']);
  });

  it('renders inline directive text when renderAsComment + pos set', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    const dirs = host.querySelectorAll('text.directive');
    expect(dirs.length).toBe(1);
    expect(dirs[0]!.textContent).toBe('.tran 1u 100u');
  });

  it('omits inline directives when showDirectives is false', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, {
      theme: 'classic-ltspice',
      showDirectives: false,
      symbolCache: SYMBOL_CACHE,
    });
    r.render();
    const dirs = host.querySelectorAll('text.directive');
    expect(dirs.length).toBe(0);
  });

  it('renders net-label flags when showNetLabels is true', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    expect(host.querySelectorAll('g.net-label').length).toBe(1);
  });

  it('omits net-label flags when showNetLabels is false', () => {
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, {
      theme: 'classic-ltspice',
      showNetLabels: false,
      symbolCache: SYMBOL_CACHE,
    });
    r.render();
    expect(host.querySelectorAll('g.net-label').length).toBe(0);
  });
});

describe('SchematicRenderer — theme switching', () => {
  it('setTheme updates data-theme without re-rendering', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    expect(host.getAttribute('data-theme')).toBe('classic-ltspice');

    r.setTheme('modern-dark');
    expect(host.getAttribute('data-theme')).toBe('modern-dark');

    r.setTheme('pro-qspice');
    expect(host.getAttribute('data-theme')).toBe('pro-qspice');
  });
});

describe('SchematicRenderer — click delegation', () => {
  it('invokes onComponentClick with the component ref', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = buildFixtureIR();
    const onComponentClick = vi.fn();
    const r = new SchematicRenderer(host, ir, {
      theme: 'classic-ltspice',
      onComponentClick,
      symbolCache: SYMBOL_CACHE,
    });
    r.render();

    const r1 = host.querySelector('g.component[data-ref="R1"]')!;
    r1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onComponentClick).toHaveBeenCalledWith('R1');
  });

  it('invokes onNetClick with the wire net name', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = buildFixtureIR();
    const onNetClick = vi.fn();
    const r = new SchematicRenderer(host, ir, {
      theme: 'classic-ltspice',
      onNetClick,
      symbolCache: SYMBOL_CACHE,
    });
    r.render();

    const wire = host.querySelector('g.wire[data-net="mid"]')!;
    wire.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onNetClick).toHaveBeenCalledWith('mid');
  });
});

describe('SchematicRenderer — destroy', () => {
  it('removes the SVG and clears data-theme', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'modern-dark', symbolCache: SYMBOL_CACHE });
    r.render();
    expect(host.querySelector('svg.spice-schematic')).not.toBeNull();
    expect(host.getAttribute('data-theme')).toBe('modern-dark');

    r.destroy();
    expect(host.querySelector('svg.spice-schematic')).toBeNull();
    expect(host.getAttribute('data-theme')).toBeNull();
  });
});

describe('SchematicRenderer — setIR re-renders', () => {
  it('replaces the SVG with a new IR', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const ir = buildFixtureIR();
    const r = new SchematicRenderer(host, ir, { theme: 'classic-ltspice', symbolCache: SYMBOL_CACHE });
    r.render();
    expect(host.querySelectorAll('g.component').length).toBe(ir.components.length);

    // New IR with only one component.
    const newIr: SchematicIR = {
      ...ir,
      components: [makeR('R99', 'a', 'b')],
      wires: [],
      directives: [],
      netLabels: [],
    };
    r.setIR(newIr);
    expect(host.querySelectorAll('g.component').length).toBe(1);
    expect(host.querySelector('g.component[data-ref="R99"]')).not.toBeNull();
    // Only one root SVG should exist.
    expect(host.querySelectorAll('svg.spice-schematic').length).toBe(1);
  });
});

describe('SchematicRenderer — alpha-scattering-detector.cir', () => {
  it('renders the Surveyor-5 alpha detector schematic', () => {
    const cirPath = resolve(
      REPO_ROOT,
      'www/tibsfox/com/Research/NASA/1.62/artifacts/circuits/alpha-scattering-detector.cir',
    );
    const source = readFileSync(cirPath, 'utf8');
    const { ir } = parseCir(source);
    const { ir: laidOut } = autoLayout(ir);

    const host = document.createElement('div');
    document.body.appendChild(host);
    const r = new SchematicRenderer(host, laidOut, {
      theme: 'modern-dark',
      symbolCache: SYMBOL_CACHE,
    });
    r.render();

    const componentGroups = host.querySelectorAll('g.component');
    // Sanity: we should have rendered the same number of components the
    // parser/layout pipeline produced, and that number must be > 0.
    expect(componentGroups.length).toBe(laidOut.components.length);
    expect(componentGroups.length).toBeGreaterThan(0);

    // Wires: one <g.wire> per IR wire.
    const wireGroups = host.querySelectorAll('g.wire');
    expect(wireGroups.length).toBe(laidOut.wires.length);
  });
});

describe('SchematicRenderer — opamp + subckt rendering', () => {
  it('renders opamp + ground without throwing', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const opamp: ComponentOpamp = {
      kind: 'OPAMP',
      ref: 'U1',
      nets: { vplus: 'in+', vminus: 'in-', out: 'out' },
      model: 'AD8618',
      geom: { pos: { x: 64, y: 64 }, rot: 0, flipH: false, flipV: false },
    };
    const ir: SchematicIR = {
      title: 'opamp-fixture',
      components: [opamp, makeGND()],
      wires: [],
      netLabels: [],
      directives: [],
      models: {},
      bbox: { x: 0, y: 0, w: 128, h: 128 },
      parseWarnings: [],
      layoutSeed: 'opamp',
    };
    const r = new SchematicRenderer(host, ir, {
      theme: 'pro-qspice',
      symbolCache: SYMBOL_CACHE,
    });
    r.render();

    expect(host.querySelector('g.component[data-kind="OPAMP"]')).not.toBeNull();
    expect(host.querySelector('g.component[data-kind="GND"]')).not.toBeNull();
  });
});
