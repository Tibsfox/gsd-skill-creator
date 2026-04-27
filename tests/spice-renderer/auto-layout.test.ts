/**
 * tests/spice-renderer/auto-layout.test.ts
 *
 * Tests for www/.../spice-renderer/auto-layout.ts.
 *
 * Lives under `tests/` so vitest's root project (which globs
 * `tests/**\/*.test.ts`) picks it up — the implementation lives outside
 * `src/` (in the renderer harness under `www/`).
 */

import { describe, expect, it } from 'vitest';
import {
  autoLayout,
  manhattanAStar,
  seededRng,
  _internal,
} from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/auto-layout.js';
import type {
  Component,
  ComponentGround,
  ComponentTwoTerminal,
  SchematicIR,
} from '../../www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-renderer/types.js';

// ============================================================================
// Fixture builders
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

function emptyIR(components: Component[], seed = 'test-seed'): SchematicIR {
  return {
    title: 'Test Circuit',
    components,
    wires: [],
    netLabels: [],
    directives: [],
    models: {},
    bbox: { x: 0, y: 0, w: 0, h: 0 },
    parseWarnings: [],
    layoutSeed: seed,
  };
}

/**
 * Approximation of the alpha-scattering-detector.cir topology. Used as a
 * stand-in until cir-parser.ts is online; covers the same component count
 * and net structure for layout-stress purposes.
 */
function makeAlphaScatteringFixture(): SchematicIR {
  const cs: Component[] = [];
  // Three pulse sources + their drive nets
  cs.push(makeV('V_PULSE_MG', 'mg_drive', '0', 'PULSE(0 1 10u 10n 10n 50n 200u)'));
  cs.push(makeV('V_PULSE_SI', 'si_drive', '0', 'PULSE(0 1 40u 10n 10n 50n 200u)'));
  cs.push(makeV('V_PULSE_FE', 'fe_drive', '0', 'PULSE(0 1 70u 10n 10n 50n 200u)'));
  // VCCS — model as two-terminal for the fixture
  cs.push(makeR('G_MG', 'det_node', 'mg_drive', '2u'));
  cs.push(makeR('G_SI', 'det_node', 'si_drive', '6u'));
  cs.push(makeR('G_FE', 'det_node', 'fe_drive', '10u'));
  // Bias chain
  cs.push(makeV('V_BIAS', 'bias', '0', 'DC 80'));
  cs.push(makeR('R_BIAS', 'bias', 'det_node', '10Meg'));
  cs.push(makeC('C_DET', 'det_node', '0', '3p'));
  cs.push(makeR('D_DET', '0', 'det_node', 'D1N4148')); // diode → two-terminal stand-in
  // Coupling + preamp
  cs.push(makeC('C_AC', 'det_node', 'preamp_in', '100n'));
  cs.push(makeR('R_BIAS_RESET', 'preamp_in', '0', '1Meg'));
  cs.push(makeR('E_PRE', 'preamp_out', '0', '1e5'));
  cs.push(makeC('C_F', 'preamp_in', 'preamp_out', '1p'));
  cs.push(makeR('R_F', 'preamp_in', 'preamp_out', '100Meg'));
  // CR shaper
  cs.push(makeC('C_CR', 'preamp_out', 'cr_out', '100n'));
  cs.push(makeR('R_CR', 'cr_out', '0', '10'));
  // RC integrator
  cs.push(makeR('R_RC', 'cr_out', 'rc_in', '1k'));
  cs.push(makeC('C_RC', 'rc_in', '0', '1n'));
  cs.push(makeR('R_DIS', 'rc_in', '0', '1Meg'));
  // Shaping gain stage
  cs.push(makeR('E_SHAPE', 'shape_raw', '0', '50'));
  cs.push(makeR('B_SHAPE', 'shape_out', '0', 'clamp'));
  // Comparator
  cs.push(makeV('V_TH', 'v_th', '0', 'DC 0.200'));
  cs.push(makeR('E_CMP', 'mca_trigger', '0', '1e6'));
  cs.push(makeR('B_CLAMP', 'mca_out', '0', 'clamp01'));
  // Ground symbols (drawn at every "0" net occurrence; we add a few)
  cs.push(makeGND());
  cs.push(makeGND());
  cs.push(makeGND());

  return emptyIR(cs, 'alpha-scattering-detector');
}

// ============================================================================
// Seeded PRNG
// ============================================================================

describe('seededRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = seededRng('seed-a');
    const b = seededRng('seed-a');
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = seededRng('seed-a');
    const b = seededRng('seed-b');
    let differences = 0;
    for (let i = 0; i < 100; i++) {
      if (a() !== b()) differences++;
    }
    expect(differences).toBeGreaterThan(80);
  });

  it('returns numbers in [0, 1)', () => {
    const r = seededRng('range-check');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

// ============================================================================
// Determinism
// ============================================================================

describe('autoLayout determinism', () => {
  it('produces identical output for the same input + seed (byte-equal positions)', () => {
    const ir1 = emptyIR([
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeR('R3', 'c', '0'),
      makeGND(),
    ], 'fixed-seed');
    const ir2 = emptyIR([
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeR('R3', 'c', '0'),
      makeGND(),
    ], 'fixed-seed');

    const r1 = autoLayout(ir1);
    const r2 = autoLayout(ir2);

    expect(r1.ir.components.length).toBe(r2.ir.components.length);
    for (let i = 0; i < r1.ir.components.length; i++) {
      const a = r1.ir.components[i]!;
      const b = r2.ir.components[i]!;
      expect(a.geom.pos.x).toBe(b.geom.pos.x);
      expect(a.geom.pos.y).toBe(b.geom.pos.y);
      expect(a.geom.rot).toBe(b.geom.rot);
    }
    // Wires byte-identical too.
    expect(r1.ir.wires.length).toBe(r2.ir.wires.length);
    for (let i = 0; i < r1.ir.wires.length; i++) {
      expect(r1.ir.wires[i]).toEqual(r2.ir.wires[i]);
    }
  });

  it('produces different output for different seeds', () => {
    const make = (seed: string): SchematicIR =>
      emptyIR([
        makeR('R1', 'a', 'b'),
        makeR('R2', 'b', 'c'),
        makeR('R3', 'c', 'd'),
        makeR('R4', 'd', '0'),
        makeGND(),
      ], seed);

    const r1 = autoLayout(make('seed-A'));
    const r2 = autoLayout(make('seed-B'));

    let allEqual = true;
    for (let i = 0; i < r1.ir.components.length; i++) {
      const a = r1.ir.components[i]!;
      const b = r2.ir.components[i]!;
      if (a.geom.pos.x !== b.geom.pos.x || a.geom.pos.y !== b.geom.pos.y) {
        allEqual = false;
        break;
      }
    }
    expect(allEqual).toBe(false);
  });

  it('is idempotent on a second pass with preservePlacedPositions', () => {
    const ir = emptyIR([
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeC('C1', 'c', '0'),
      makeGND(),
    ], 'idem-seed');

    const first = autoLayout(ir).ir;
    const second = autoLayout(first, { preservePlacedPositions: true }).ir;

    for (let i = 0; i < first.components.length; i++) {
      expect(second.components[i]!.geom.pos.x).toBe(first.components[i]!.geom.pos.x);
      expect(second.components[i]!.geom.pos.y).toBe(first.components[i]!.geom.pos.y);
    }
  });
});

// ============================================================================
// Grid + collision
// ============================================================================

describe('autoLayout grid alignment and non-overlap', () => {
  it('places every component on the 16-unit grid', () => {
    const { ir } = autoLayout(emptyIR([
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeR('R3', 'c', '0'),
      makeC('C1', 'a', '0'),
      makeGND(),
    ], 'grid-test'));

    for (const c of ir.components) {
      // Use Math.abs to absorb the JS -0 vs +0 distinction (e.g. -32 % 16 = -0).
      expect(Math.abs(c.geom.pos.x % 16)).toBe(0);
      expect(Math.abs(c.geom.pos.y % 16)).toBe(0);
    }
  });

  it('produces no two components in the same grid cell', () => {
    const { ir } = autoLayout(emptyIR([
      makeR('R1', 'a', 'b'),
      makeR('R2', 'a', 'b'),
      makeR('R3', 'a', 'b'),
      makeR('R4', 'a', 'b'),
      makeR('R5', 'a', 'b'),
      makeGND(),
    ], 'collision-test'));

    const cells = new Set<string>();
    for (const c of ir.components) {
      const key = `${c.geom.pos.x},${c.geom.pos.y}`;
      expect(cells.has(key)).toBe(false);
      cells.add(key);
    }
  });
});

// ============================================================================
// Ground placement
// ============================================================================

describe('autoLayout ground placement', () => {
  it('places ground components below (avg y >) non-ground components', () => {
    const cs: Component[] = [
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeC('C1', 'c', '0'),
      makeGND(),
      makeGND(),
    ];
    const { ir } = autoLayout(emptyIR(cs, 'ground-test'));

    const grounds = ir.components.filter(
      (c) => c.kind === 'GND' || c.kind === 'GND_CHASSIS',
    );
    const others = ir.components.filter(
      (c) => c.kind !== 'GND' && c.kind !== 'GND_CHASSIS',
    );

    expect(grounds.length).toBeGreaterThan(0);
    expect(others.length).toBeGreaterThan(0);

    const avgGroundY =
      grounds.reduce((a, c) => a + c.geom.pos.y, 0) / grounds.length;
    const avgOtherY =
      others.reduce((a, c) => a + c.geom.pos.y, 0) / others.length;

    // In screen-y semantics (y increases downward), ground should be BELOW
    // others, i.e. avgGroundY > avgOtherY.
    expect(avgGroundY).toBeGreaterThan(avgOtherY);
  });

  it('keeps ground rotation at 0', () => {
    const { ir } = autoLayout(emptyIR([
      makeR('R1', 'a', '0'),
      makeGND(),
    ], 'gnd-rot'));
    const grounds = ir.components.filter(
      (c) => c.kind === 'GND' || c.kind === 'GND_CHASSIS',
    );
    for (const g of grounds) {
      expect(g.geom.rot).toBe(0);
    }
  });
});

// ============================================================================
// Wire connectivity
// ============================================================================

describe('autoLayout wire routing', () => {
  it('creates wires for every multi-pin net', () => {
    const cs: Component[] = [
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeR('R3', 'c', 'a'),
      makeGND(),
    ];
    const { ir } = autoLayout(emptyIR(cs, 'wire-net-test'));

    const netSet = new Set<string>();
    for (const c of cs) {
      for (const n of _internal.componentNets(c)) {
        netSet.add(n);
      }
    }

    // Count multi-pin nets in the input.
    const multiPinNets = new Set<string>();
    for (const net of netSet) {
      let count = 0;
      for (const c of ir.components) {
        for (const n of _internal.componentNets(c)) {
          if (n === net) count++;
        }
      }
      if (count >= 2) multiPinNets.add(net);
    }

    const wireNets = new Set(ir.wires.map((w) => w.net));
    for (const net of multiPinNets) {
      expect(wireNets.has(net)).toBe(true);
    }
  });

  it('emits orthogonal wire segments only', () => {
    const cs: Component[] = [
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', 'c'),
      makeR('R3', 'c', '0'),
      makeC('C1', 'a', '0'),
      makeGND(),
    ];
    const { ir } = autoLayout(emptyIR(cs, 'orthogonal-test'));

    for (const w of ir.wires) {
      for (const s of w.segments) {
        const horizontal = s.from.y === s.to.y;
        const vertical = s.from.x === s.to.x;
        expect(horizontal || vertical).toBe(true);
      }
    }
  });
});

// ============================================================================
// BBox + non-degenerate
// ============================================================================

describe('autoLayout bbox', () => {
  it('produces a non-zero canvas bbox for a non-empty schematic', () => {
    const { ir } = autoLayout(emptyIR([
      makeR('R1', 'a', 'b'),
      makeR('R2', 'b', '0'),
      makeGND(),
    ], 'bbox-test'));

    expect(ir.bbox.w).toBeGreaterThan(0);
    expect(ir.bbox.h).toBeGreaterThan(0);
  });

  it('returns a degenerate bbox for an empty schematic', () => {
    const { ir } = autoLayout(emptyIR([], 'empty'));
    expect(ir.bbox.w).toBe(0);
    expect(ir.bbox.h).toBe(0);
    expect(ir.components.length).toBe(0);
  });
});

// ============================================================================
// Manhattan A*
// ============================================================================

describe('manhattanAStar', () => {
  it('finds a direct path with no obstacles', () => {
    const path = manhattanAStar(
      { x: 0, y: 0 },
      { x: 64, y: 32 },
      { cells: new Set(), gridSize: 16 },
      16,
    );
    expect(path.length).toBeGreaterThanOrEqual(2);
    // First and last should match start and end (snapped).
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 64, y: 32 });
    // Manhattan length = |dx| + |dy| = 4 + 2 = 6 grid steps minimum.
    expect(path.length).toBeGreaterThanOrEqual(2);
  });

  it('routes around an obstacle', () => {
    // Block the cell directly between start and end.
    const obstacles = new Set<string>(['2,0']);
    const path = manhattanAStar(
      { x: 0, y: 0 },
      { x: 64, y: 0 },
      { cells: obstacles, gridSize: 16 },
      16,
    );
    expect(path.length).toBeGreaterThanOrEqual(2);
    // Path must avoid the blocked cell.
    for (const p of path) {
      const gx = p.x / 16;
      const gy = p.y / 16;
      expect(`${gx},${gy}`).not.toBe('2,0');
    }
  });
});

// ============================================================================
// Alpha-scattering-detector fixture
// ============================================================================

describe('autoLayout on alpha-scattering-detector approximation', () => {
  it('places components within a reasonable bbox without overlap', () => {
    const ir = makeAlphaScatteringFixture();
    const { ir: laid, warnings } = autoLayout(ir);

    expect(laid.components.length).toBe(ir.components.length);

    // Non-overlap.
    const cells = new Set<string>();
    for (const c of laid.components) {
      const key = `${c.geom.pos.x},${c.geom.pos.y}`;
      expect(cells.has(key)).toBe(false);
      cells.add(key);
    }

    // Reasonable bbox: not collapsed, not absurdly large.
    expect(laid.bbox.w).toBeGreaterThan(0);
    expect(laid.bbox.h).toBeGreaterThan(0);
    expect(laid.bbox.w).toBeLessThan(10000);
    expect(laid.bbox.h).toBeLessThan(10000);

    // Warnings array exists; some grid collisions are acceptable.
    expect(Array.isArray(warnings)).toBe(true);
  });

  it('connects every multi-pin net with at least one wire', () => {
    const ir = makeAlphaScatteringFixture();
    const { ir: laid } = autoLayout(ir);

    const netCounts = new Map<string, number>();
    for (const c of laid.components) {
      for (const n of _internal.componentNets(c)) {
        netCounts.set(n, (netCounts.get(n) ?? 0) + 1);
      }
    }

    const wireNets = new Set(laid.wires.map((w) => w.net));
    for (const [net, count] of netCounts) {
      if (count >= 2) {
        expect(wireNets.has(net)).toBe(true);
      }
    }
  });
});

// ============================================================================
// Performance
// ============================================================================

describe('autoLayout performance', () => {
  it('lays out a 30-component schematic in under 500ms', () => {
    const cs: Component[] = [];
    for (let i = 0; i < 28; i++) {
      const a = `n${i}`;
      const b = i % 2 === 0 ? `n${i + 1}` : '0';
      cs.push(makeR(`R${i}`, a, b));
    }
    cs.push(makeGND());
    cs.push(makeGND());

    const ir = emptyIR(cs, 'perf-test');
    const start = performance.now();
    autoLayout(ir);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
  });
});
