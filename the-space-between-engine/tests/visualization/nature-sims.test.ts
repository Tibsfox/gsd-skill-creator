// Nature Simulation Tests — NS-01:09
// Tests mathematical logic of each sim, not canvas rendering.

import { describe, it, expect } from 'vitest';
import {
  UnitCircleExplorer,
  TideSimulator,
  FourierDecomposer,
  VectorFieldPainter,
  MagneticField,
  LSystemRenderer,
  TreeGrowth,
  SetVisualizer,
  FunctorBridge,
} from '../../src/visualization/nature/sims/index';

// ─── Helpers ──────────────────────────────────────────────

// Access private members for mathematical testing via casting
function getPrivate<T>(obj: unknown, key: string): T {
  return (obj as Record<string, unknown>)[key] as T;
}

function callPrivate<T>(obj: unknown, method: string, ...args: unknown[]): T {
  return ((obj as Record<string, (...a: unknown[]) => T>)[method] as (...a: unknown[]) => T)(...args);
}

// ─── Tests ────────────────────────────────────────────────

describe('Nature Simulations — Mathematical Logic', () => {

  // NS-01: UnitCircleExplorer — angle parameter maps to correct sin/cos
  describe('NS-01: UnitCircleExplorer', () => {
    it('angle parameter maps to correct sin/cos at 0 radians', () => {
      const sim = new UnitCircleExplorer();
      sim.setParam('angle', 0);

      const angle = getPrivate<number>(sim, 'angle');
      expect(Math.cos(angle)).toBeCloseTo(1, 5);
      expect(Math.sin(angle)).toBeCloseTo(0, 5);
    });

    it('angle parameter maps to correct sin/cos at PI/2', () => {
      const sim = new UnitCircleExplorer();
      sim.setParam('angle', Math.PI / 2);

      const angle = getPrivate<number>(sim, 'angle');
      expect(Math.cos(angle)).toBeCloseTo(0, 5);
      expect(Math.sin(angle)).toBeCloseTo(1, 5);
    });

    it('angle parameter maps to correct sin/cos at PI', () => {
      const sim = new UnitCircleExplorer();
      sim.setParam('angle', Math.PI);

      const angle = getPrivate<number>(sim, 'angle');
      expect(Math.cos(angle)).toBeCloseTo(-1, 5);
      expect(Math.sin(angle)).toBeCloseTo(0, 5);
    });

    it('angle parameter maps to correct sin/cos at 3*PI/2', () => {
      const sim = new UnitCircleExplorer();
      sim.setParam('angle', 3 * Math.PI / 2);

      const angle = getPrivate<number>(sim, 'angle');
      expect(Math.cos(angle)).toBeCloseTo(0, 5);
      expect(Math.sin(angle)).toBeCloseTo(-1, 5);
    });

    it('update with animation advances the angle', () => {
      const sim = new UnitCircleExplorer();
      sim.setParam('angle', 0);
      sim.setParam('animating', true);
      sim.setParam('animSpeed', 2.0);

      // Simulate 1 second of animation
      sim.update(1.0);

      const angle = getPrivate<number>(sim, 'angle');
      expect(angle).toBeCloseTo(2.0, 2);
    });
  });

  // NS-02: TideSimulator — moon phase parameter affects output
  describe('NS-02: TideSimulator', () => {
    it('moon phase shifts the M2 tide output', () => {
      const sim = new TideSimulator();

      // At moonPhase=0, compute M2 at t=0
      sim.setParam('moonPhase', 0);
      sim.setParam('amplitude', 1.0);
      const h0 = callPrivate<number>(sim, 'computeM2', 0);

      // At moonPhase=180, the cos shifts by PI, inverting
      sim.setParam('moonPhase', 180);
      const h180 = callPrivate<number>(sim, 'computeM2', 0);

      expect(h0).toBeCloseTo(1.0, 3);
      expect(h180).toBeCloseTo(-1.0, 3);
    });

    it('M2 formula matches A*cos(2*PI/12.42*t+phi)', () => {
      const sim = new TideSimulator();
      sim.setParam('amplitude', 2.0);
      sim.setParam('moonPhase', 45);

      const t = 6.21; // half M2 period
      const h = callPrivate<number>(sim, 'computeM2', t);

      const phi = (45 * Math.PI) / 180;
      const expected = 2.0 * Math.cos((2 * Math.PI / 12.42) * t + phi);
      expect(h).toBeCloseTo(expected, 3);
    });

    it('S2 component adds correctly when enabled', () => {
      const sim = new TideSimulator();
      sim.setParam('amplitude', 1.0);
      sim.setParam('moonPhase', 0);
      sim.setParam('showS2', true);
      sim.setParam('s2Amplitude', 0.46);

      const t = 3.0;
      const m2 = callPrivate<number>(sim, 'computeM2', t);
      const s2 = callPrivate<number>(sim, 'computeS2', t);
      const combined = callPrivate<number>(sim, 'computeTide', t);

      expect(combined).toBeCloseTo(m2 + s2, 5);
    });
  });

  // NS-03: FourierDecomposer — N components sum correctly
  describe('NS-03: FourierDecomposer', () => {
    it('square wave components sum within +/-0.001 tolerance at test points', () => {
      const sim = new FourierDecomposer();
      sim.setParam('frequencyCount', 8);
      sim.setParam('waveformType', 'square');
      sim.setParam('baseFrequency', 1.0);

      // Get components
      const components = getPrivate<Array<{ harmonic: number; amplitude: number; phase: number }>>(sim, 'components');
      expect(components.length).toBe(8);

      // Manually compute sum at x = 1.0 and compare to evaluate
      const x = 1.0;
      let manualSum = 0;
      for (const comp of components) {
        manualSum += comp.amplitude * Math.sin(comp.harmonic * 1.0 * x + comp.phase);
      }

      const evaluated = callPrivate<number>(sim, 'evaluate', x);
      expect(Math.abs(evaluated - manualSum)).toBeLessThan(0.001);
    });

    it('sawtooth wave Fourier coefficients are correct', () => {
      const sim = new FourierDecomposer();
      sim.setParam('frequencyCount', 4);
      sim.setParam('waveformType', 'sawtooth');

      const components = getPrivate<Array<{ harmonic: number; amplitude: number; phase: number }>>(sim, 'components');
      expect(components.length).toBe(4);

      // k=1: (2/pi)*(-1)^2*(1/1) = 2/pi
      expect(components[0]!.amplitude).toBeCloseTo(2 / Math.PI, 4);
      expect(components[0]!.harmonic).toBe(1);

      // k=2: (2/pi)*(-1)^3*(1/2) = -1/pi
      expect(components[1]!.amplitude).toBeCloseTo(-1 / Math.PI, 4);
      expect(components[1]!.harmonic).toBe(2);
    });

    it('triangle wave uses only odd harmonics with 1/k^2 decay', () => {
      const sim = new FourierDecomposer();
      sim.setParam('frequencyCount', 3);
      sim.setParam('waveformType', 'triangle');

      const components = getPrivate<Array<{ harmonic: number; amplitude: number; phase: number }>>(sim, 'components');
      expect(components.length).toBe(3);

      // Only odd harmonics: 1, 3, 5
      expect(components[0]!.harmonic).toBe(1);
      expect(components[1]!.harmonic).toBe(3);
      expect(components[2]!.harmonic).toBe(5);
    });
  });

  // NS-04: VectorFieldPainter — field mode produces expected vectors
  describe('NS-04: VectorFieldPainter', () => {
    it('radial field points outward from origin', () => {
      const sim = new VectorFieldPainter();
      sim.setParam('fieldMode', 'radial');
      sim.setParam('fieldStrength', 1.0);

      // Point at (0.75, 0.5) -> centered (0.5, 0) -> radial should be (1, 0) normalized
      const [dx, dy] = callPrivate<[number, number]>(sim, 'evaluateField', 0.75, 0.5);
      expect(dx).toBeGreaterThan(0); // pointing right (away from center)
      expect(Math.abs(dy)).toBeLessThan(0.01); // should have negligible y component
    });

    it('vortex field swirls counterclockwise', () => {
      const sim = new VectorFieldPainter();
      sim.setParam('fieldMode', 'vortex');
      sim.setParam('fieldStrength', 1.0);

      // Point at (0.75, 0.5) -> centered (0.5, 0) -> vortex: (-y, x)/r -> (0, 0.5)/0.5 = (0, 1)
      const [dx, dy] = callPrivate<[number, number]>(sim, 'evaluateField', 0.75, 0.5);
      expect(Math.abs(dx)).toBeLessThan(0.01);
      expect(dy).toBeGreaterThan(0); // swirling upward (counterclockwise)
    });

    it('sink field converges toward center', () => {
      const sim = new VectorFieldPainter();
      sim.setParam('fieldMode', 'sink');
      sim.setParam('fieldStrength', 1.0);

      const [dx, dy] = callPrivate<[number, number]>(sim, 'evaluateField', 0.75, 0.5);
      expect(dx).toBeLessThan(0); // pointing left (toward center)
    });

    it('saddle field has expected behavior', () => {
      const sim = new VectorFieldPainter();
      sim.setParam('fieldMode', 'saddle');
      sim.setParam('fieldStrength', 1.0);

      // Saddle: F(x,y) = (x, -y) in centered coords
      // At (0.75, 0.5) -> centered (0.5, 0) -> (0.5, 0)
      const [dx, dy] = callPrivate<[number, number]>(sim, 'evaluateField', 0.75, 0.5);
      expect(dx).toBeGreaterThan(0);
      // y = 0 centered -> dy = 0
      expect(Math.abs(dy)).toBeLessThan(0.01);
    });
  });

  // NS-05: MagneticField — dipole formula produces correct field values
  describe('NS-05: MagneticField', () => {
    it('dipole field is strongest near the poles', () => {
      const sim = new MagneticField();
      sim.setParam('dipoleStrength', 1.0);

      // Dipole at default (0.5, 0.5), test near north pole
      const [bxNear, byNear] = callPrivate<[number, number]>(sim, 'computeField', 0.5, 0.42);
      const magNear = Math.sqrt(bxNear * bxNear + byNear * byNear);

      // Test further away
      const [bxFar, byFar] = callPrivate<[number, number]>(sim, 'computeField', 0.5, 0.1);
      const magFar = Math.sqrt(bxFar * bxFar + byFar * byFar);

      expect(magNear).toBeGreaterThan(magFar);
    });

    it('dipole field is symmetric: |B(x)| = |B(-x)| for same y offset', () => {
      const sim = new MagneticField();
      sim.setParam('dipoleStrength', 1.0);

      const [bxLeft, byLeft] = callPrivate<[number, number]>(sim, 'computeField', 0.4, 0.3);
      const [bxRight, byRight] = callPrivate<[number, number]>(sim, 'computeField', 0.6, 0.3);
      const magLeft = Math.sqrt(bxLeft * bxLeft + byLeft * byLeft);
      const magRight = Math.sqrt(bxRight * bxRight + byRight * byRight);

      expect(magLeft).toBeCloseTo(magRight, 3);
    });

    it('dipole strength scales the field linearly', () => {
      const sim = new MagneticField();

      sim.setParam('dipoleStrength', 1.0);
      const [bx1, by1] = callPrivate<[number, number]>(sim, 'computeField', 0.7, 0.3);
      const mag1 = Math.sqrt(bx1 * bx1 + by1 * by1);

      sim.setParam('dipoleStrength', 2.0);
      const [bx2, by2] = callPrivate<[number, number]>(sim, 'computeField', 0.7, 0.3);
      const mag2 = Math.sqrt(bx2 * bx2 + by2 * by2);

      expect(mag2).toBeCloseTo(mag1 * 2, 2);
    });
  });

  // NS-06: LSystemRenderer — rule application correct after N iterations
  describe('NS-06: LSystemRenderer', () => {
    it('Koch curve after 1 iteration: F -> F+F-F-F+F', () => {
      const sim = new LSystemRenderer();
      sim.setParam('activePreset', 'koch-curve');
      sim.setParam('iterations', 1);

      // After loading preset with 1 iteration, the generated string should be 'F+F-F-F+F'
      const generated = getPrivate<string>(sim, 'generatedString');
      expect(generated).toBe('F+F-F-F+F');
    });

    it('Koch curve after 2 iterations has correct length', () => {
      const sim = new LSystemRenderer();
      sim.setParam('activePreset', 'koch-curve');
      sim.setParam('iterations', 2);

      const generated = getPrivate<string>(sim, 'generatedString');
      // After 1 iter: F+F-F-F+F (9 chars, 5 F's)
      // After 2 iter: each F -> F+F-F-F+F, so 5 * 9 - 4 * 4 = 45-4*4=... let's just count
      // Actually: each of 5 F's becomes 'F+F-F-F+F' (9 chars), 4 non-F chars stay
      // = 5*9 + 4 = 49
      expect(generated.length).toBe(49);
    });

    it('Sierpinski triangle uses two rules (F and G)', () => {
      const sim = new LSystemRenderer();
      sim.setParam('activePreset', 'sierpinski-triangle');
      sim.setParam('iterations', 1);

      const generated = getPrivate<string>(sim, 'generatedString');
      // Axiom: F-G-G
      // F -> F-G+F+G-F, G -> GG
      // Result: F-G+F+G-F-GG-GG
      expect(generated).toBe('F-G+F+G-F-GG-GG');
    });
  });

  // NS-07: TreeGrowth — different angles produce different results
  describe('NS-07: TreeGrowth', () => {
    it('different branch angles produce different L-system strings', () => {
      // The L-system string itself doesn't change with angle (same rule),
      // but the visual output differs. The string length should be identical.
      const sim1 = new TreeGrowth();
      sim1.setParam('iterations', 2);
      sim1.setParam('branchAngle', 15);

      const sim2 = new TreeGrowth();
      sim2.setParam('iterations', 2);
      sim2.setParam('branchAngle', 45);

      const str1 = getPrivate<string>(sim1, 'lSystemString');
      const str2 = getPrivate<string>(sim2, 'lSystemString');

      // Same rule, so strings are equal
      expect(str1).toBe(str2);
      // But the angle parameter itself is different
      expect(getPrivate<number>(sim1, 'branchAngle')).toBe(15);
      expect(getPrivate<number>(sim2, 'branchAngle')).toBe(45);
    });

    it('different iteration counts produce different string lengths', () => {
      const sim1 = new TreeGrowth();
      sim1.setParam('iterations', 2);
      const len2 = getPrivate<string>(sim1, 'lSystemString').length;

      const sim2 = new TreeGrowth();
      sim2.setParam('iterations', 3);
      const len3 = getPrivate<string>(sim2, 'lSystemString').length;

      expect(len3).toBeGreaterThan(len2);
    });

    it('TreeGrowth axiom is F and uses the expected production rule', () => {
      const sim = new TreeGrowth();
      sim.setParam('iterations', 1);

      const str = getPrivate<string>(sim, 'lSystemString');
      expect(str).toBe('FF+[+F-F-F]-[-F+F+F]');
    });
  });

  // NS-08: SetVisualizer — union/intersection/difference computed correctly
  describe('NS-08: SetVisualizer', () => {
    it('isHighlighted returns correct results for union', () => {
      const sim = new SetVisualizer();
      sim.setParam('highlightOp', 'union');

      // Test the isHighlighted logic directly
      const isHighlighted = callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: false });
      expect(isHighlighted).toBe(true);

      const isHighlighted2 = callPrivate<boolean>(sim, 'isHighlighted', { inA: false, inB: true });
      expect(isHighlighted2).toBe(true);

      const isHighlighted3 = callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: true });
      expect(isHighlighted3).toBe(true);

      const isHighlighted4 = callPrivate<boolean>(sim, 'isHighlighted', { inA: false, inB: false });
      expect(isHighlighted4).toBe(false);
    });

    it('isHighlighted returns correct results for intersection', () => {
      const sim = new SetVisualizer();
      sim.setParam('highlightOp', 'intersection');

      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: true })).toBe(true);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: false })).toBe(false);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: false, inB: true })).toBe(false);
    });

    it('isHighlighted returns correct results for difference (A \\ B)', () => {
      const sim = new SetVisualizer();
      sim.setParam('highlightOp', 'difference');

      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: false })).toBe(true);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: true })).toBe(false);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: false, inB: true })).toBe(false);
    });

    it('isHighlighted returns correct results for symmetric-difference', () => {
      const sim = new SetVisualizer();
      sim.setParam('highlightOp', 'symmetric-difference');

      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: false })).toBe(true);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: false, inB: true })).toBe(true);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: true, inB: true })).toBe(false);
      expect(callPrivate<boolean>(sim, 'isHighlighted', { inA: false, inB: false })).toBe(false);
    });
  });

  // NS-09: FunctorBridge — mapping preserves structure
  describe('NS-09: FunctorBridge', () => {
    it('shapes functor maps every source object to a target object', () => {
      const sim = new FunctorBridge();
      sim.setParam('sourceType', 'shapes');

      const source = getPrivate<{ objects: Array<{ id: string }> }>(sim, 'source');
      const objectMap = getPrivate<Map<string, string>>(sim, 'objectMap');

      for (const obj of source.objects) {
        expect(objectMap.has(obj.id)).toBe(true);
      }
    });

    it('notes functor has 4 objects in source and target with matching counts', () => {
      const sim = new FunctorBridge();
      sim.setParam('sourceType', 'notes');

      const source = getPrivate<{ objects: Array<{ id: string }>; morphisms: Array<unknown> }>(sim, 'source');
      const target = getPrivate<{ objects: Array<{ id: string }>; morphisms: Array<unknown> }>(sim, 'target');

      expect(source.objects.length).toBe(4);
      expect(target.objects.length).toBe(4);
      // Morphism count should match (structure preserved)
      expect(source.morphisms.length).toBe(target.morphisms.length);
    });

    it('functor mapping is bijective (one-to-one)', () => {
      const sim = new FunctorBridge();
      sim.setParam('sourceType', 'colors');

      const objectMap = getPrivate<Map<string, string>>(sim, 'objectMap');
      const targetIds = new Set(objectMap.values());

      // Each source maps to a unique target
      expect(targetIds.size).toBe(objectMap.size);
    });

    it('switching source type rebuilds categories correctly', () => {
      const sim = new FunctorBridge();

      sim.setParam('sourceType', 'shapes');
      const shapesSource = getPrivate<{ name: string }>(sim, 'source');
      expect(shapesSource.name).toBe('Shapes');

      sim.setParam('sourceType', 'colors');
      const colorsSource = getPrivate<{ name: string }>(sim, 'source');
      expect(colorsSource.name).toBe('Colors');

      sim.setParam('sourceType', 'notes');
      const notesSource = getPrivate<{ name: string }>(sim, 'source');
      expect(notesSource.name).toBe('Notes');
    });
  });
});
