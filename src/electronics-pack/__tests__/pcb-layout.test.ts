/**
 * PCB Layout Tool Test Suite
 *
 * Tests for trace impedance calculations, IPC-2221 trace width,
 * skin depth, crosstalk, design rule checking, EMI assessment,
 * board routing, and Gerber layer stack.
 *
 * Phase 277 Plan 01.
 */

import { describe, it, expect } from 'vitest';
import {
  calcMicrostripImpedance,
  calcTraceWidth,
  calcSkinDepth,
  calcCrosstalk,
  checkDesignRules,
  assessEMI,
  createBoard,
  routeTrace,
  placeComponent,
  describeGerberLayers,
  type Board,
  type Trace,
  type Via,
  type PCBComponent,
  type DesignRule,
  type DRCViolation,
  type GerberLayer,
  type EMIResult,
} from '../../simulator/pcb-layout';

// ============================================================================
// Group 1: Microstrip impedance calculator
// ============================================================================

describe('calcMicrostripImpedance', () => {
  it('calculates ~50 ohm for standard FR4 stackup', () => {
    // w=10 mil, h=62 mil (standard 4-layer), t=1.4 mil (1 oz Cu), er=4.4 (FR4)
    const z0 = calcMicrostripImpedance(10, 62, 1.4, 4.4);
    expect(z0).toBeGreaterThan(40);
    expect(z0).toBeLessThan(65);
  });

  it('wider trace lowers impedance', () => {
    const z10 = calcMicrostripImpedance(10, 62, 1.4, 4.4);
    const z20 = calcMicrostripImpedance(20, 62, 1.4, 4.4);
    expect(z20).toBeLessThan(z10);
  });

  it('higher dielectric lowers impedance', () => {
    const zFR4 = calcMicrostripImpedance(10, 62, 1.4, 4.4);
    const zCeramic = calcMicrostripImpedance(10, 62, 1.4, 10);
    expect(zCeramic).toBeLessThan(zFR4);
  });
});

// ============================================================================
// Group 2: Trace width calculator (IPC-2221)
// ============================================================================

describe('calcTraceWidth', () => {
  it('1A external 10C rise 1oz copper gives ~10-15 mils', () => {
    const w = calcTraceWidth(1, 10, 1.4, true);
    expect(w).toBeGreaterThan(5);
    expect(w).toBeLessThan(25);
  });

  it('internal trace wider than external for same current', () => {
    const wExt = calcTraceWidth(1, 10, 1.4, true);
    const wInt = calcTraceWidth(1, 10, 1.4, false);
    expect(wInt).toBeGreaterThan(wExt);
  });

  it('higher current needs wider trace', () => {
    const w1A = calcTraceWidth(1, 10, 1.4, true);
    const w3A = calcTraceWidth(3, 10, 1.4, true);
    expect(w3A).toBeGreaterThan(w1A);
  });
});

// ============================================================================
// Group 3: Skin depth and crosstalk
// ============================================================================

describe('calcSkinDepth', () => {
  it('copper at 1 MHz ~66 micrometers', () => {
    const delta = calcSkinDepth(1e6, 1.68e-8, 4 * Math.PI * 1e-7);
    // ~66 micrometers = 6.6e-5 m, within 20%
    expect(delta).toBeGreaterThan(50e-6);
    expect(delta).toBeLessThan(85e-6);
  });

  it('decreases with frequency', () => {
    const mu = 4 * Math.PI * 1e-7;
    const d1M = calcSkinDepth(1e6, 1.68e-8, mu);
    const d100M = calcSkinDepth(100e6, 1.68e-8, mu);
    // sqrt(100) ~ 10x smaller
    expect(d100M).toBeLessThan(d1M / 5);
    expect(d100M).toBeGreaterThan(d1M / 15);
  });
});

describe('calcCrosstalk', () => {
  it('decreases with wider spacing', () => {
    const kClose = calcCrosstalk(5, 62);
    const kFar = calcCrosstalk(100, 62);
    expect(kClose).toBeGreaterThan(kFar);
  });

  it('returns value between 0 and 1', () => {
    const k1 = calcCrosstalk(5, 62);
    const k2 = calcCrosstalk(100, 62);
    const k3 = calcCrosstalk(1000, 10);
    expect(k1).toBeGreaterThanOrEqual(0);
    expect(k1).toBeLessThanOrEqual(1);
    expect(k2).toBeGreaterThanOrEqual(0);
    expect(k2).toBeLessThanOrEqual(1);
    expect(k3).toBeGreaterThanOrEqual(0);
    expect(k3).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Group 4: Design rule checker
// ============================================================================

describe('checkDesignRules', () => {
  const makeBoard = (): Board => createBoard(1000, 1000, 4);

  it('passes clean board', () => {
    const board: Board = {
      ...makeBoard(),
      traces: [
        {
          id: 'trace-1',
          layer: 'top',
          points: [{ x: 100, y: 100 }, { x: 500, y: 100 }],
          widthMil: 10,
        },
      ],
    };
    const rules: DesignRule[] = [
      { name: 'min-trace-width', type: 'trace_width', minValue: 6 },
    ];
    const violations = checkDesignRules(board, rules);
    expect(violations).toHaveLength(0);
  });

  it('catches trace width violation', () => {
    const board: Board = {
      ...makeBoard(),
      traces: [
        {
          id: 'trace-1',
          layer: 'top',
          points: [{ x: 100, y: 100 }, { x: 500, y: 100 }],
          widthMil: 4,
        },
      ],
    };
    const rules: DesignRule[] = [
      { name: 'min-trace-width', type: 'trace_width', minValue: 6 },
    ];
    const violations = checkDesignRules(board, rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('trace_width');
  });

  it('catches via annular ring violation', () => {
    const board: Board = {
      ...makeBoard(),
      vias: [
        { id: 'via-1', x: 200, y: 200, drillMil: 10, annularRingMil: 3 },
      ],
    };
    const rules: DesignRule[] = [
      { name: 'min-annular-ring', type: 'annular_ring', minValue: 5 },
    ];
    const violations = checkDesignRules(board, rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('annular_ring');
  });

  it('catches clearance violation', () => {
    const board: Board = {
      ...makeBoard(),
      traces: [
        {
          id: 'trace-1',
          layer: 'top',
          points: [{ x: 100, y: 100 }, { x: 500, y: 100 }],
          widthMil: 10,
        },
        {
          id: 'trace-2',
          layer: 'top',
          points: [{ x: 100, y: 103 }, { x: 500, y: 103 }],
          widthMil: 10,
        },
      ],
    };
    const rules: DesignRule[] = [
      { name: 'min-clearance', type: 'clearance', minValue: 5 },
    ];
    const violations = checkDesignRules(board, rules);
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].type).toBe('clearance');
  });

  it('returns multiple violations', () => {
    const board: Board = {
      ...makeBoard(),
      traces: [
        {
          id: 'trace-1',
          layer: 'top',
          points: [{ x: 100, y: 100 }, { x: 500, y: 100 }],
          widthMil: 4,
        },
      ],
      vias: [
        { id: 'via-1', x: 200, y: 200, drillMil: 10, annularRingMil: 3 },
      ],
    };
    const rules: DesignRule[] = [
      { name: 'min-trace-width', type: 'trace_width', minValue: 6 },
      { name: 'min-annular-ring', type: 'annular_ring', minValue: 5 },
    ];
    const violations = checkDesignRules(board, rules);
    expect(violations).toHaveLength(2);
  });
});

// ============================================================================
// Group 5: EMI assessment
// ============================================================================

describe('assessEMI', () => {
  it('low risk at low frequency', () => {
    // 50mm trace at 1 MHz: wavelength = 300,000 mm, ratio = 0.000167
    const result = assessEMI(50, 1e6, 0.1);
    expect(result.riskLevel).toBe('low');
    expect(result.wavelengthMm).toBeCloseTo(300_000, -2);
    expect(result.ratio).toBeLessThan(0.01);
  });

  it('high risk when trace approaches lambda/10', () => {
    // 100mm trace at 300 MHz: wavelength = 1000 mm, ratio = 0.1
    const result = assessEMI(100, 300e6, 0.5);
    expect(result.riskLevel).toBe('high');
    expect(result.wavelengthMm).toBeCloseTo(1000, -1);
    expect(result.ratio).toBeCloseTo(0.1, 2);
  });

  it('moderate risk in between', () => {
    // 50mm trace at 100 MHz: wavelength = 3000 mm, ratio ~ 0.017
    const result = assessEMI(50, 100e6, 0.1);
    expect(result.riskLevel).toBe('moderate');
    expect(result.ratio).toBeGreaterThan(0.01);
    expect(result.ratio).toBeLessThan(0.05);
  });
});

// ============================================================================
// Group 6: Board routing and Gerber layers
// ============================================================================

describe('createBoard', () => {
  it('initializes empty board', () => {
    const board = createBoard(1000, 1000, 4);
    expect(board.width).toBe(1000);
    expect(board.height).toBe(1000);
    expect(board.layers).toBe(4);
    expect(board.traces).toHaveLength(0);
    expect(board.components).toHaveLength(0);
    expect(board.vias).toHaveLength(0);
  });
});

describe('routeTrace', () => {
  it('adds trace to board', () => {
    const board = createBoard(1000, 1000, 4);
    const result = routeTrace(
      board,
      { x: 100, y: 100 },
      { x: 500, y: 100 },
      10,
      'top',
    );
    expect('board' in result).toBe(true);
    if ('board' in result) {
      expect(result.board.traces).toHaveLength(1);
      expect(result.trace.layer).toBe('top');
      expect(result.trace.widthMil).toBe(10);
    }
  });

  it('detects collision with existing trace', () => {
    let board = createBoard(1000, 1000, 4);
    const r1 = routeTrace(
      board,
      { x: 100, y: 100 },
      { x: 500, y: 100 },
      10,
      'top',
    );
    expect('board' in r1).toBe(true);
    if ('board' in r1) {
      board = r1.board;
    }
    // Overlapping trace on same layer
    const r2 = routeTrace(
      board,
      { x: 200, y: 100 },
      { x: 400, y: 100 },
      10,
      'top',
    );
    expect('error' in r2).toBe(true);
  });
});

describe('placeComponent', () => {
  it('adds component to board', () => {
    const board = createBoard(1000, 1000, 4);
    const comp: PCBComponent = {
      id: 'comp-1',
      refDes: 'R1',
      x: 300,
      y: 300,
      footprint: '0805',
      pads: [
        { x: 290, y: 300, widthMil: 30, heightMil: 40 },
        { x: 310, y: 300, widthMil: 30, heightMil: 40 },
      ],
    };
    const updated = placeComponent(board, comp);
    expect(updated.components).toHaveLength(1);
    expect(updated.components[0].refDes).toBe('R1');
  });
});

describe('describeGerberLayers', () => {
  it('2-layer board has at least 5 layers', () => {
    const layers = describeGerberLayers(2);
    // top copper, bottom copper, top soldermask, bottom soldermask, drill
    expect(layers.length).toBeGreaterThanOrEqual(5);
    const names = layers.map((l) => l.name);
    expect(names).toContain('top_copper');
    expect(names).toContain('bottom_copper');

    const copperLayers = layers.filter((l) => l.type === 'copper');
    expect(copperLayers.length).toBe(2);
  });

  it('4-layer board includes inner copper layers', () => {
    const layers = describeGerberLayers(4);
    const innerCopper = layers.filter(
      (l) => l.type === 'copper' && l.side === 'inner',
    );
    expect(innerCopper.length).toBe(2);
    const names = layers.map((l) => l.name);
    expect(names).toContain('inner1_copper');
    expect(names).toContain('inner2_copper');
  });
});
