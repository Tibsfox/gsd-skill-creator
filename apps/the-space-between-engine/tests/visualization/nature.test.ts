// ─── Nature Simulation Tests ─────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NatureSimulation } from '../../src/visualization/nature/framework.js';
import { UnitCircleExplorer } from '../../src/visualization/nature/sims/unit-circle-explorer.js';
import { TideSimulator } from '../../src/visualization/nature/sims/tide-simulator.js';
import { VectorFieldPainter } from '../../src/visualization/nature/sims/vector-field.js';
import {
  LSystemRenderer,
  parseRule,
  rewrite,
  executeTurtle,
} from '../../src/visualization/nature/sims/l-system-renderer.js';
import { FourierDecomposer } from '../../src/visualization/nature/sims/fourier-decomposer.js';
import type { ParamValue } from '../../src/types/index.js';

// ─── Mock Setup ──────────────────────────────────────────

// Save the real createElement before any mocking
const realCreateElement = document.createElement.bind(document);

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function createMockCtx() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    font: '',
  };
}

function createMockCanvas(): HTMLCanvasElement {
  const canvas = realCreateElement('canvas');
  vi.spyOn(canvas, 'getContext').mockReturnValue(createMockCtx() as unknown as CanvasRenderingContext2D);
  return canvas;
}

function createMockContainer(): HTMLElement {
  const container = realCreateElement('div');
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, width: 800, height: 600,
    top: 0, left: 0, right: 800, bottom: 600,
    toJSON: () => ({}),
  });
  return container;
}

function mockCanvasCreation(): () => void {
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return createMockCanvas();
    return realCreateElement(tag);
  });
  return () => spy.mockRestore();
}

function initSimulation(sim: NatureSimulation, params?: Map<string, ParamValue>): () => void {
  const cleanup = mockCanvasCreation();
  const container = createMockContainer();
  sim.init(container, params ?? new Map());
  return cleanup;
}

// ─── Tests ───────────────────────────────────────────────

describe('NatureSimulation base class', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  // Concrete subclass for testing base behavior
  class TestNatureSim extends NatureSimulation {
    renderCalled = false;
    render(_time: number, _params: Map<string, ParamValue>): void {
      this.renderCalled = true;
    }
  }

  it('initializes with default params', () => {
    const sim = new TestNatureSim('test', { speed: 1, visible: true });
    expect(sim['simulationParams'].get('speed')).toBe(1);
    expect(sim['simulationParams'].get('visible')).toBe(true);
  });

  it('merges incoming params on init', () => {
    const sim = new TestNatureSim('test', { speed: 1 });
    const cleanup = initSimulation(sim, new Map([['speed', 5], ['extra', 'hello']]));
    expect(sim['simulationParams'].get('speed')).toBe(5);
    expect(sim['simulationParams'].get('extra')).toBe('hello');
    cleanup();
  });

  it('updates params via onParamChange', () => {
    const sim = new TestNatureSim('test', { speed: 1 });
    sim.onParamChange('speed', 10);
    expect(sim['simulationParams'].get('speed')).toBe(10);
  });

  it('getNumParam returns number', () => {
    const sim = new TestNatureSim('test', { speed: 3.14 });
    expect(sim['getNumParam']('speed')).toBe(3.14);
    expect(sim['getNumParam']('missing')).toBe(0);
  });

  it('getBoolParam returns boolean', () => {
    const sim = new TestNatureSim('test', { visible: true, hidden: false, zero: 0 });
    expect(sim['getBoolParam']('visible')).toBe(true);
    expect(sim['getBoolParam']('hidden')).toBe(false);
    expect(sim['getBoolParam']('zero')).toBe(false);
  });

  it('getStringParam returns string', () => {
    const sim = new TestNatureSim('test', { mode: 'fast' });
    expect(sim['getStringParam']('mode')).toBe('fast');
    // Missing key returns empty string (via ?? '' fallback)
    expect(sim['getStringParam']('missing')).toBe('');
  });
});

describe('UnitCircleExplorer', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanup) { cleanup(); cleanup = null; }
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('initializes with default params', () => {
    const sim = new UnitCircleExplorer();
    expect(sim.id).toBe('unit-circle-explorer');
    expect(sim['simulationParams'].get('angle-theta')).toBeCloseTo(0.7854, 3);
    expect(sim['simulationParams'].get('show-sin')).toBe(true);
    expect(sim['simulationParams'].get('show-cos')).toBe(true);
    expect(sim['simulationParams'].get('show-tan')).toBe(true);
  });

  it('renders without error', () => {
    const sim = new UnitCircleExplorer();
    cleanup = initSimulation(sim);

    expect(() => {
      sim.render(0, new Map());
      sim.render(16.67, new Map());
      sim.render(33.33, new Map());
    }).not.toThrow();
  });

  it('updates angle on pointer interaction', () => {
    const sim = new UnitCircleExplorer();
    cleanup = initSimulation(sim);
    sim.resize(800, 600);

    sim.onPointerDown(1.0, 0.5);
    const theta = sim['simulationParams'].get('angle-theta') as number;
    expect(theta).toBeGreaterThanOrEqual(0);
    expect(theta).toBeLessThan(2 * Math.PI);

    sim.onPointerUp();
  });

  it('param change updates toggle state', () => {
    const sim = new UnitCircleExplorer();
    sim.onParamChange('show-sin', false);
    expect(sim['simulationParams'].get('show-sin')).toBe(false);
  });
});

describe('TideSimulator', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanup) { cleanup(); cleanup = null; }
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('initializes with default params', () => {
    const sim = new TideSimulator();
    expect(sim.id).toBe('tide-simulator');
    expect(sim['simulationParams'].get('moon-phase')).toBe(0);
    expect(sim['simulationParams'].get('time-speed')).toBe(1);
    expect(sim['simulationParams'].get('amplitude')).toBe(1);
  });

  it('renders without error across time', () => {
    const sim = new TideSimulator();
    cleanup = initSimulation(sim);

    expect(() => {
      for (let t = 0; t < 1000; t += 16.67) {
        sim.render(t, new Map());
      }
    }).not.toThrow();
  });

  it('responds to moon phase changes', () => {
    const sim = new TideSimulator();
    cleanup = initSimulation(sim);

    sim.onParamChange('moon-phase', 180);
    expect(sim['simulationParams'].get('moon-phase')).toBe(180);

    expect(() => sim.render(100, new Map())).not.toThrow();
  });
});

describe('VectorFieldPainter', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanup) { cleanup(); cleanup = null; }
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('initializes with default params', () => {
    const sim = new VectorFieldPainter();
    expect(sim.id).toBe('vector-field');
    expect(sim['simulationParams'].get('field-type')).toBe('radial');
    expect(sim['simulationParams'].get('particle-count')).toBe(100);
    expect(sim['simulationParams'].get('show-gradient')).toBe(true);
  });

  it('renders all three field types without error', () => {
    const sim = new VectorFieldPainter();
    cleanup = initSimulation(sim);

    for (const fieldType of ['radial', 'vortex', 'dipole']) {
      sim.onParamChange('field-type', fieldType);
      expect(() => sim.render(0, new Map())).not.toThrow();
    }
  });

  it('handles particle count changes', () => {
    const sim = new VectorFieldPainter();
    cleanup = initSimulation(sim);

    sim.onParamChange('particle-count', 10);
    sim.render(0, new Map());
    expect(sim['particles'].length).toBe(10);

    sim.onParamChange('particle-count', 50);
    sim.render(16.67, new Map());
    expect(sim['particles'].length).toBe(50);
  });
});

describe('L-System Core Logic', () => {
  describe('parseRule', () => {
    it('parses arrow delimiter', () => {
      const rule = parseRule('F\u2192F[+F]F[-F]F');
      expect(rule).toEqual({ from: 'F', to: 'F[+F]F[-F]F' });
    });

    it('parses dash-arrow delimiter', () => {
      const rule = parseRule('F->F+F');
      expect(rule).toEqual({ from: 'F', to: 'F+F' });
    });

    it('parses equals delimiter', () => {
      const rule = parseRule('F=F[+F]F[-F]F');
      expect(rule).toEqual({ from: 'F', to: 'F[+F]F[-F]F' });
    });

    it('parses colon delimiter', () => {
      const rule = parseRule('X:F[+X][-X]');
      expect(rule).toEqual({ from: 'X', to: 'F[+X][-X]' });
    });

    it('returns null for invalid rule', () => {
      expect(parseRule('no delimiter here')).toBeNull();
      expect(parseRule('')).toBeNull();
    });
  });

  describe('rewrite', () => {
    it('applies simple rule for 1 iteration', () => {
      const result = rewrite('F', [{ from: 'F', to: 'F[+F]F[-F]F' }], 1);
      expect(result).toBe('F[+F]F[-F]F');
    });

    it('applies simple rule for 2 iterations', () => {
      const result = rewrite('F', [{ from: 'F', to: 'FF' }], 2);
      expect(result).toBe('FFFF');
    });

    it('preserves characters without matching rules', () => {
      const result = rewrite('F+F', [{ from: 'F', to: 'FF' }], 1);
      expect(result).toBe('FF+FF');
    });

    it('handles multiple rules', () => {
      const result = rewrite('AB', [
        { from: 'A', to: 'AB' },
        { from: 'B', to: 'A' },
      ], 1);
      expect(result).toBe('ABA');
    });

    it('handles Fibonacci-like L-system (algae)', () => {
      const rules = [
        { from: 'A', to: 'AB' },
        { from: 'B', to: 'A' },
      ];
      expect(rewrite('A', rules, 0)).toBe('A');
      expect(rewrite('A', rules, 1)).toBe('AB');
      expect(rewrite('A', rules, 2)).toBe('ABA');
      expect(rewrite('A', rules, 3)).toBe('ABAAB');
      expect(rewrite('A', rules, 4)).toBe('ABAABABA');
    });

    it('Koch curve rule produces correct output', () => {
      const result = rewrite('F', [{ from: 'F', to: 'F+F-F-F+F' }], 1);
      expect(result).toBe('F+F-F-F+F');
    });

    it('handles 0 iterations (returns axiom)', () => {
      expect(rewrite('F', [{ from: 'F', to: 'XY' }], 0)).toBe('F');
    });

    it('caps string length to prevent explosion', () => {
      // Rule that doubles length each iteration
      const result = rewrite('F', [{ from: 'F', to: 'FF' }], 100);
      expect(result.length).toBeLessThanOrEqual(200_000);
    });
  });

  describe('executeTurtle', () => {
    it('draws a single line for "F"', () => {
      const { segments } = executeTurtle('F', 90, 10);
      expect(segments).toHaveLength(1);
      expect(segments[0].x1).toBeCloseTo(0);
      expect(segments[0].y1).toBeCloseTo(0);
      expect(segments[0].x2).toBeCloseTo(0, 5);
      expect(segments[0].y2).toBeCloseTo(-10, 5);
    });

    it('turns left with +', () => {
      const { segments } = executeTurtle('F+F', 90, 10);
      expect(segments).toHaveLength(2);
      expect(segments[1].x2).toBeCloseTo(-10, 5);
      expect(segments[1].y2).toBeCloseTo(-10, 5);
    });

    it('turns right with -', () => {
      const { segments } = executeTurtle('F-F', 90, 10);
      expect(segments).toHaveLength(2);
      expect(segments[1].x2).toBeCloseTo(10, 5);
      expect(segments[1].y2).toBeCloseTo(-10, 5);
    });

    it('handles push/pop with [ and ]', () => {
      const { segments } = executeTurtle('F[+F]F', 90, 10);
      expect(segments).toHaveLength(3);
      expect(segments[2].x1).toBeCloseTo(0, 5);
      expect(segments[2].y1).toBeCloseTo(-10, 5);
      expect(segments[2].x2).toBeCloseTo(0, 5);
      expect(segments[2].y2).toBeCloseTo(-20, 5);
    });

    it('computes correct bounds', () => {
      const { bounds } = executeTurtle('F+F+F+F', 90, 10);
      expect(bounds.minX).toBeLessThanOrEqual(0);
      expect(bounds.maxX).toBeGreaterThanOrEqual(0);
      expect(bounds.minY).toBeLessThanOrEqual(-10);
    });

    it('handles empty string', () => {
      const { segments } = executeTurtle('', 90, 10);
      expect(segments).toHaveLength(0);
    });

    it('handles G (alternative forward symbol)', () => {
      const { segments } = executeTurtle('G', 90, 10);
      expect(segments).toHaveLength(1);
    });
  });
});

describe('LSystemRenderer', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanup) { cleanup(); cleanup = null; }
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('initializes with default params', () => {
    const sim = new LSystemRenderer();
    expect(sim.id).toBe('l-system-renderer');
    expect(sim['simulationParams'].get('axiom')).toBe('F');
    expect(sim['simulationParams'].get('rule')).toBe('F=F[+F]F[-F]F');
    expect(sim['simulationParams'].get('iterations')).toBe(3);
    expect(sim['simulationParams'].get('angle')).toBe(25);
  });

  it('renders without error', () => {
    const sim = new LSystemRenderer();
    cleanup = initSimulation(sim);

    expect(() => {
      sim.render(0, new Map());
    }).not.toThrow();
  });

  it('re-renders when params change', () => {
    const sim = new LSystemRenderer();
    cleanup = initSimulation(sim);

    sim.onParamChange('iterations', 2);
    expect(() => sim.render(0, new Map())).not.toThrow();

    sim.onParamChange('axiom', 'X');
    sim.onParamChange('rule', 'X=F[+X][-X]');
    expect(() => sim.render(16, new Map())).not.toThrow();
  });

  it('caches and reuses when params unchanged', () => {
    const sim = new LSystemRenderer();
    cleanup = initSimulation(sim);

    sim.render(0, new Map());
    const segments1 = [...sim['cachedSegments']];

    sim.render(16, new Map());
    const segments2 = sim['cachedSegments'];

    expect(segments1.length).toBe(segments2.length);
  });
});

describe('FourierDecomposer', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    if (cleanup) { cleanup(); cleanup = null; }
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('initializes with default params', () => {
    const sim = new FourierDecomposer();
    expect(sim.id).toBe('fourier-decomposer');
    expect(sim['simulationParams'].get('frequency-count')).toBe(5);
    expect(sim['simulationParams'].get('base-frequency')).toBe(1);
    expect(sim['simulationParams'].get('show-components')).toBe(true);
  });

  it('renders without error', () => {
    const sim = new FourierDecomposer();
    cleanup = initSimulation(sim);

    expect(() => {
      sim.render(0, new Map());
      sim.render(1000, new Map());
    }).not.toThrow();
  });

  it('renders in both component and composite-only modes', () => {
    const sim = new FourierDecomposer();
    cleanup = initSimulation(sim);

    sim.onParamChange('show-components', true);
    expect(() => sim.render(0, new Map())).not.toThrow();

    sim.onParamChange('show-components', false);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });

  it('handles edge case frequency counts', () => {
    const sim = new FourierDecomposer();
    cleanup = initSimulation(sim);

    sim.onParamChange('frequency-count', 1);
    expect(() => sim.render(0, new Map())).not.toThrow();

    sim.onParamChange('frequency-count', 20);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });
});
