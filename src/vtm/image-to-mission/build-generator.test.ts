import { describe, it, expect } from 'vitest';
import {
  generateSteps,
  annotatePhilosophy,
  composeBuildSpec,
  generateBuildSpec,
} from './build-generator.js';
import type { ExtractedParameters } from './types.js';

const mandalaParams: ExtractedParameters = {
  color: {
    palette: [
      { name: 'warm stone', hex: '#C4A882', role: 'primary' },
      { name: 'ochre', hex: '#CC7722', role: 'accent' },
      { name: 'tarp white', hex: '#F2EDE4', role: 'background' },
    ],
    temperature: 'warm',
    contrast: 0.5,
    saturation: 0.4,
    relationships: 'analogous',
  },
  geometry: {
    primaryShape: 'cairn',
    arrangement: 'spiral',
    symmetry: 'approximate',
    proportions: { elementCount: 80, heightDecay: 0.85 },
    constants: { goldenAngle: 2.399963 },
  },
  material: {
    surfaces: [{ name: 'river stone', reflectivity: 0.15, roughness: 0.85 }],
    lightInteraction: 'absorb',
    blendModes: ['multiply', 'screen'],
  },
  feel: { energy: 0.3, intimacy: 0.75, order: 0.45, handmade: 0.9, ceremony: 0.7 },
  custom: {},
};

describe('generateSteps', () => {
  it('produces ordered steps starting at 1', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps[0].step).toBe(1);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].step).toBe(steps[i - 1].step + 1);
    }
  });

  it('generates at least 10 steps for mandala', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps.length).toBeGreaterThanOrEqual(10);
  });

  it('every step has instruction and doneState', () => {
    const steps = generateSteps(mandalaParams);
    for (const step of steps) {
      expect(step.instruction).toBeTruthy();
      expect(step.doneState).toBeTruthy();
    }
  });

  it('includes golden angle positioning step', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps.some(s => s.instruction.includes('2.399963'))).toBe(true);
  });

  it('includes height decay step', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps.some(s => s.instruction.toLowerCase().includes('decay'))).toBe(true);
  });

  it('includes blend mode steps', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps.some(s => s.instruction.includes('multiply'))).toBe(true);
    expect(steps.some(s => s.instruction.includes('screen'))).toBe(true);
  });

  it('includes handmade jitter step for high handmade', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps.some(s => s.instruction.includes('jitter'))).toBe(true);
  });

  it('includes animation step for energy > 0.2', () => {
    const steps = generateSteps(mandalaParams);
    expect(steps.some(s => s.instruction.toLowerCase().includes('animation'))).toBe(true);
  });

  it('ends with verification step', () => {
    const steps = generateSteps(mandalaParams);
    const last = steps[steps.length - 1];
    expect(last.instruction.toLowerCase()).toContain('verify');
  });
});

describe('annotatePhilosophy', () => {
  it('adds golden angle philosophy note', () => {
    const steps = generateSteps(mandalaParams);
    const annotated = annotatePhilosophy(steps, mandalaParams);
    const goldenStep = annotated.find(s => s.instruction.includes('2.399963'));
    expect(goldenStep?.philosophyNote).toBeTruthy();
    expect(goldenStep!.philosophyNote).toContain('golden angle');
  });

  it('adds blend mode philosophy notes', () => {
    const steps = generateSteps(mandalaParams);
    const annotated = annotatePhilosophy(steps, mandalaParams);
    const multiplyStep = annotated.find(s => s.instruction.includes('multiply'));
    expect(multiplyStep?.philosophyNote).toBeTruthy();
  });

  it('adds handmade jitter philosophy note', () => {
    const steps = generateSteps(mandalaParams);
    const annotated = annotatePhilosophy(steps, mandalaParams);
    const jitterStep = annotated.find(s => s.instruction.includes('jitter'));
    expect(jitterStep?.philosophyNote).toBeTruthy();
  });

  it('does not annotate boilerplate steps', () => {
    const steps = generateSteps(mandalaParams);
    const annotated = annotatePhilosophy(steps, mandalaParams);
    const setupStep = annotated.find(s => s.instruction.includes('Set up'));
    expect(setupStep?.philosophyNote).toBeUndefined();
  });

  it('philosophy notes explain WHY, not WHAT', () => {
    const steps = generateSteps(mandalaParams);
    const annotated = annotatePhilosophy(steps, mandalaParams);
    const notes = annotated.filter(s => s.philosophyNote).map(s => s.philosophyNote!);
    for (const note of notes) {
      // Philosophy notes should be explanatory, not just restating the instruction
      expect(note.length).toBeGreaterThan(50);
    }
  });
});

describe('composeBuildSpec', () => {
  it('produces valid BuildSpec', () => {
    const steps = generateSteps(mandalaParams);
    const spec = composeBuildSpec(steps, mandalaParams, 'canvas');
    expect(spec.target).toBe('canvas');
    expect(spec.parameters).toEqual(mandalaParams);
    expect(spec.steps.length).toBeGreaterThan(0);
    expect(spec.philosophyDocument).toBeTruthy();
  });

  it('philosophy document contains annotated decisions', () => {
    const steps = generateSteps(mandalaParams);
    const spec = composeBuildSpec(steps, mandalaParams, 'canvas');
    expect(spec.philosophyDocument).toContain('Build Philosophy');
    expect(spec.philosophyDocument).toContain('Key Decisions');
  });

  it('includes code when provided', () => {
    const steps = generateSteps(mandalaParams, 'canvas', '<canvas>test</canvas>');
    const spec = composeBuildSpec(steps, mandalaParams, 'canvas', '<canvas>test</canvas>');
    expect(spec.code).toBe('<canvas>test</canvas>');
  });
});

describe('generateBuildSpec', () => {
  it('full pipeline produces complete BuildSpec', () => {
    const spec = generateBuildSpec(mandalaParams, 'canvas');
    expect(spec.target).toBe('canvas');
    expect(spec.steps.length).toBeGreaterThanOrEqual(10);
    expect(spec.philosophyDocument.length).toBeGreaterThan(100);
    // Should have at least some philosophy notes
    expect(spec.steps.some(s => s.philosophyNote)).toBe(true);
  });

  it('medium-independent when no code provided', () => {
    const spec = generateBuildSpec(mandalaParams);
    expect(spec.code).toBeUndefined();
    expect(spec.steps.every(s => s.instruction.length > 0)).toBe(true);
  });
});
