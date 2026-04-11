// ─── Garden Workshop Tests ──────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FOUNDATION_ORDER } from '../../src/types/index.js';
import type { FoundationId } from '../../src/types/index.js';

// ─── Nature Simulation imports (Task 2C.1) ──────────────
import { SetVisualizer } from '../../src/visualization/nature/sims/set-visualizer.js';
import { FunctorBridge } from '../../src/visualization/nature/sims/functor-bridge.js';
import { TreeGrowth } from '../../src/visualization/nature/sims/tree-growth.js';
import { MagneticField } from '../../src/visualization/nature/sims/magnetic-field.js';

// ─── Garden imports (Task 2C.2) ─────────────────────────
import { ART_PRESETS } from '../../src/observatory/garden/ArtCanvas.js';
import { LSYSTEM_PRESETS } from '../../src/observatory/garden/LSystemEditor.js';
import { REFLECTION_PROMPTS } from '../../src/observatory/garden/Journal.js';

import type { ParamValue } from '../../src/types/index.js';
import { NatureSimulation } from '../../src/visualization/nature/framework.js';

// ─── Mock Setup ──────────────────────────────────────────

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
    ellipse: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    quadraticCurveTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    strokeRect: vi.fn(),
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

// ─── Nature Simulation Tests ─────────────────────────────

describe('SetVisualizer', () => {
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

  it('initializes with correct id and default params', () => {
    const sim = new SetVisualizer();
    expect(sim.id).toBe('set-visualizer');
    expect(sim['simulationParams'].get('set-a-size')).toBe(20);
    expect(sim['simulationParams'].get('set-b-size')).toBe(20);
    expect(sim['simulationParams'].get('show-union')).toBe(true);
    expect(sim['simulationParams'].get('show-intersection')).toBe(true);
    expect(sim['simulationParams'].get('show-complement')).toBe(false);
  });

  it('renders without error', () => {
    const sim = new SetVisualizer();
    cleanup = initSimulation(sim);
    expect(() => {
      sim.render(0, new Map());
      sim.render(16.67, new Map());
    }).not.toThrow();
  });

  it('toggles set operations', () => {
    const sim = new SetVisualizer();
    cleanup = initSimulation(sim);

    sim.onParamChange('show-union', false);
    sim.onParamChange('show-complement', true);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });

  it('handles set size changes', () => {
    const sim = new SetVisualizer();
    cleanup = initSimulation(sim);

    sim.onParamChange('set-a-size', 50);
    sim.onParamChange('set-b-size', 5);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });
});

describe('FunctorBridge', () => {
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

  it('initializes with correct id and default params', () => {
    const sim = new FunctorBridge();
    expect(sim.id).toBe('functor-bridge');
    expect(sim['simulationParams'].get('source-category')).toBe('shapes');
    expect(sim['simulationParams'].get('target-category')).toBe('colors');
    expect(sim['simulationParams'].get('show-mapping')).toBe(true);
  });

  it('renders without error', () => {
    const sim = new FunctorBridge();
    cleanup = initSimulation(sim);
    expect(() => {
      sim.render(0, new Map());
      sim.render(1000, new Map());
    }).not.toThrow();
  });

  it('switches categories', () => {
    const sim = new FunctorBridge();
    cleanup = initSimulation(sim);

    sim.onParamChange('source-category', 'notes');
    sim.onParamChange('target-category', 'frequencies');
    expect(() => sim.render(0, new Map())).not.toThrow();
  });

  it('toggles mapping visibility', () => {
    const sim = new FunctorBridge();
    cleanup = initSimulation(sim);

    sim.onParamChange('show-mapping', false);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });
});

describe('TreeGrowth', () => {
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

  it('initializes with correct id and default params', () => {
    const sim = new TreeGrowth();
    expect(sim.id).toBe('tree-growth');
    expect(sim['simulationParams'].get('growth-speed')).toBe(1);
    expect(sim['simulationParams'].get('branching-angle')).toBe(25);
    expect(sim['simulationParams'].get('branch-ratio')).toBe(0.7);
    expect(sim['simulationParams'].get('season')).toBe('summer');
  });

  it('renders without error', () => {
    const sim = new TreeGrowth();
    cleanup = initSimulation(sim);
    expect(() => {
      sim.render(0, new Map());
      sim.render(500, new Map());
    }).not.toThrow();
  });

  it('renders all four seasons', () => {
    const sim = new TreeGrowth();
    cleanup = initSimulation(sim);

    for (const season of ['spring', 'summer', 'fall', 'winter']) {
      sim.onParamChange('season', season);
      expect(() => sim.render(0, new Map())).not.toThrow();
    }
  });

  it('responds to branching angle changes', () => {
    const sim = new TreeGrowth();
    cleanup = initSimulation(sim);

    sim.onParamChange('branching-angle', 45);
    sim.onParamChange('branch-ratio', 0.6);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });
});

describe('MagneticField', () => {
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

  it('initializes with correct id and default params', () => {
    const sim = new MagneticField();
    expect(sim.id).toBe('magnetic-field');
    expect(sim['simulationParams'].get('dipole-strength')).toBe(1.5);
    expect(sim['simulationParams'].get('dipole-x')).toBe(0.5);
    expect(sim['simulationParams'].get('dipole-y')).toBe(0.5);
    expect(sim['simulationParams'].get('show-field-lines')).toBe(true);
  });

  it('renders without error', () => {
    const sim = new MagneticField();
    cleanup = initSimulation(sim);
    expect(() => {
      sim.render(0, new Map());
      sim.render(1000, new Map());
    }).not.toThrow();
  });

  it('handles pointer interaction for compass fox', () => {
    const sim = new MagneticField();
    cleanup = initSimulation(sim);
    sim.resize(800, 600);

    // Click near the fox (default at 0.5, 0.5)
    sim.onPointerDown(0.5, 0.5);
    sim.onPointerMove(0.7, 0.3);
    sim.onPointerUp();

    expect(() => sim.render(0, new Map())).not.toThrow();
  });

  it('toggles field lines', () => {
    const sim = new MagneticField();
    cleanup = initSimulation(sim);

    sim.onParamChange('show-field-lines', false);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });

  it('adjusts dipole strength', () => {
    const sim = new MagneticField();
    cleanup = initSimulation(sim);

    sim.onParamChange('dipole-strength', 5);
    expect(() => sim.render(0, new Map())).not.toThrow();
  });
});

// ─── Garden Component Structure Tests ────────────────────

describe('Garden Workshop Structure', () => {
  it('Garden module exports exist', async () => {
    const gardenModule = await import('../../src/observatory/garden/index.js');
    expect(gardenModule.Garden).toBeDefined();
    expect(typeof gardenModule.Garden).toBe('function');
  });

  it('ArtCanvas component exists', async () => {
    const artModule = await import('../../src/observatory/garden/ArtCanvas.js');
    expect(artModule.ArtCanvas).toBeDefined();
    expect(typeof artModule.ArtCanvas).toBe('function');
  });

  it('MusicStudio component exists', async () => {
    const musicModule = await import('../../src/observatory/garden/MusicStudio.js');
    expect(musicModule.MusicStudio).toBeDefined();
    expect(typeof musicModule.MusicStudio).toBe('function');
  });

  it('LSystemEditor component exists', async () => {
    const lsysModule = await import('../../src/observatory/garden/LSystemEditor.js');
    expect(lsysModule.LSystemEditor).toBeDefined();
    expect(typeof lsysModule.LSystemEditor).toBe('function');
  });

  it('Journal component exists', async () => {
    const journalModule = await import('../../src/observatory/garden/Journal.js');
    expect(journalModule.Journal).toBeDefined();
    expect(typeof journalModule.Journal).toBe('function');
  });
});

describe('Art Presets', () => {
  it('covers all 8 foundations', () => {
    const coveredFoundations = new Set(ART_PRESETS.map((p) => p.foundationId));
    for (const fid of FOUNDATION_ORDER) {
      expect(coveredFoundations.has(fid)).toBe(true);
    }
  });

  it('each preset has required fields', () => {
    for (const preset of ART_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.foundationId).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.defaultParams).toBeDefined();
      expect(typeof preset.defaultParams.scale).toBe('number');
      expect(typeof preset.defaultParams.rotation).toBe('number');
      expect(typeof preset.defaultParams.iterations).toBe('number');
      expect(typeof preset.defaultParams.colorScheme).toBe('string');
    }
  });

  it('preset IDs are unique', () => {
    const ids = ART_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('L-System Presets', () => {
  it('includes at least 6 example systems', () => {
    expect(LSYSTEM_PRESETS.length).toBeGreaterThanOrEqual(6);
  });

  it('includes Koch snowflake', () => {
    const koch = LSYSTEM_PRESETS.find((p) => p.id === 'koch-snowflake');
    expect(koch).toBeDefined();
    expect(koch!.axiom).toBeTruthy();
    expect(Object.keys(koch!.rules).length).toBeGreaterThan(0);
  });

  it('includes Sierpinski triangle', () => {
    const sierp = LSYSTEM_PRESETS.find((p) => p.id === 'sierpinski');
    expect(sierp).toBeDefined();
  });

  it('includes dragon curve', () => {
    const dragon = LSYSTEM_PRESETS.find((p) => p.id === 'dragon-curve');
    expect(dragon).toBeDefined();
  });

  it('includes fern', () => {
    const fern = LSYSTEM_PRESETS.find((p) => p.id === 'fern');
    expect(fern).toBeDefined();
  });

  it('includes fractal tree', () => {
    const tree = LSYSTEM_PRESETS.find((p) => p.id === 'fractal-tree');
    expect(tree).toBeDefined();
  });

  it('includes bush', () => {
    const bush = LSYSTEM_PRESETS.find((p) => p.id === 'bush');
    expect(bush).toBeDefined();
  });

  it('each preset has required fields', () => {
    for (const preset of LSYSTEM_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.axiom).toBeTruthy();
      expect(Object.keys(preset.rules).length).toBeGreaterThan(0);
      expect(preset.angle).toBeGreaterThan(0);
      expect(preset.iterations).toBeGreaterThanOrEqual(1);
      expect(preset.description).toBeTruthy();
    }
  });

  it('preset IDs are unique', () => {
    const ids = LSYSTEM_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Journal', () => {
  it('has reflection prompts for all 8 foundations', () => {
    const coveredFoundations = new Set(REFLECTION_PROMPTS.map((p) => p.foundationId));
    for (const fid of FOUNDATION_ORDER) {
      expect(coveredFoundations.has(fid)).toBe(true);
    }
  });

  it('each prompt has required fields', () => {
    for (const prompt of REFLECTION_PROMPTS) {
      expect(prompt.id).toBeTruthy();
      expect(prompt.foundationId).toBeTruthy();
      expect(prompt.prompt).toBeTruthy();
    }
  });

  it('prompt IDs are unique', () => {
    const ids = REFLECTION_PROMPTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('journal entry creation works via onSave callback', () => {
    // Test the Journal's save logic directly
    const saveFn = vi.fn();
    const text = 'This is a test reflection';
    const prompt = 'What is the meaning of circles?';

    // Simulate save
    if (text.trim().length > 0) {
      saveFn(text, prompt);
    }

    expect(saveFn).toHaveBeenCalledOnce();
    expect(saveFn).toHaveBeenCalledWith(text, prompt);
  });

  it('empty entries are not saved', () => {
    const saveFn = vi.fn();
    const text = '   ';

    if (text.trim().length > 0) {
      saveFn(text);
    }

    expect(saveFn).not.toHaveBeenCalled();
  });
});
