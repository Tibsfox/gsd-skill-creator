import { describe, it, expect } from 'vitest';
import {
  validate,
  createPackage,
  toJSON,
  toMarkdown,
} from './transmission-packager.js';
import { generateBuildSpec } from './build-generator.js';
import type { UnifiedUnderstanding, TransmissionPackage, ExtractedParameters } from './types.js';

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
    blendModes: ['multiply'],
  },
  feel: { energy: 0.3, intimacy: 0.75, order: 0.45, handmade: 0.9, ceremony: 0.7 },
  custom: {},
};

const fullAnalysis: UnifiedUnderstanding = {
  observations: [{
    imageId: 'mandala-daylight',
    layers: [
      { layer: 'literal', observations: ['River stones stacked in columns on white tarp'], confidence: 0.9 },
      { layer: 'spatial', observations: ['Organic spiral arrangement'], confidence: 0.75 },
      { layer: 'relational', observations: ['Central cairn prominent'], confidence: 0.6 },
      { layer: 'mood', observations: ['Intimate, handmade, contemplative'], confidence: 0.5 },
    ],
    rawDescription: 'Stone mandala in daylight.',
  }],
  context: {
    process: 'Stones placed along acoustic path',
    accidents: 'Pattern emerged from the acoustic geometry',
  },
  connections: [{
    type: 'visual-context',
    description: 'Spiral maps acoustic path',
    elements: ['spiral', 'acoustic'],
    significance: 'Key insight',
  }],
  processInsight: 'The mandala pattern emerged from the acoustic geometry — not designed',
};

const incompleteAnalysis: UnifiedUnderstanding = {
  observations: [{
    imageId: 'incomplete',
    layers: [
      { layer: 'literal', observations: ['Something'], confidence: 0.5 },
    ],
    rawDescription: 'Incomplete.',
  }],
  context: {},
  connections: [],
};

describe('validate', () => {
  it('passes all checks for complete package', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec, ['mandala-daylight.jpg']);
    const result = validate(pkg);
    expect(result.valid).toBe(true);
    expect(result.checks.every(c => c.passed)).toBe(true);
  });

  it('fails observation depth for incomplete analysis', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(incompleteAnalysis, buildSpec);
    const result = validate(pkg);
    const depthCheck = result.checks.find(c => c.name === 'observation-depth');
    expect(depthCheck?.passed).toBe(false);
  });

  it('fails process insight for empty context', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(incompleteAnalysis, buildSpec);
    const result = validate(pkg);
    const insightCheck = result.checks.find(c => c.name === 'process-insight');
    expect(insightCheck?.passed).toBe(false);
  });

  it('returns 5 checks', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    const result = validate(pkg);
    expect(result.checks).toHaveLength(5);
  });
});

describe('createPackage', () => {
  it('creates package with correct version', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    expect(pkg.version).toBe('1.0.0');
  });

  it('sets created date', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    expect(pkg.created).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('sets canExecuteWithoutImages true for complete package', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec, ['mandala.jpg']);
    expect(pkg.reproducibility.canExecuteWithoutImages).toBe(true);
  });

  it('sets canExecuteWithoutImages false for incomplete package', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(incompleteAnalysis, buildSpec);
    expect(pkg.reproducibility.canExecuteWithoutImages).toBe(false);
    expect(pkg.reproducibility.requiredContext.length).toBeGreaterThan(0);
  });

  it('includes source image descriptions', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec, ['mandala-daylight.jpg', 'mandala-night.jpg']);
    expect(pkg.sourceImages).toHaveLength(2);
  });
});

describe('toJSON', () => {
  it('produces valid parseable JSON', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    const json = toJSON(pkg);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0.0');
  });

  it('JSON roundtrip preserves structure', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    const json = toJSON(pkg);
    const parsed = JSON.parse(json);
    expect(parsed.analysis.processInsight).toBe(pkg.analysis.processInsight);
    expect(parsed.buildSpec.steps.length).toBe(pkg.buildSpec.steps.length);
  });
});

describe('toMarkdown', () => {
  it('produces readable markdown with all sections', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec, ['mandala-daylight.jpg']);
    const md = toMarkdown(pkg);
    expect(md).toContain('# Image to Mission');
    expect(md).toContain('## Source');
    expect(md).toContain('## What I Observed');
    expect(md).toContain('## What the Creator Told Me');
    expect(md).toContain('## What I Understood');
    expect(md).toContain('## Parameters I Extracted');
    expect(md).toContain('## How I Built It');
    expect(md).toContain('## For the Next Instance');
  });

  it('includes process insight', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    const md = toMarkdown(pkg);
    expect(md).toContain('acoustic geometry');
  });

  it('includes build steps', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec);
    const md = toMarkdown(pkg);
    expect(md).toContain('**Step 1:**');
  });

  it('flags incomplete packages in For the Next Instance', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(incompleteAnalysis, buildSpec);
    const md = toMarkdown(pkg);
    expect(md).toContain('gaps');
  });

  it('confirms self-containment for complete packages', () => {
    const buildSpec = generateBuildSpec(mandalaParams, 'canvas');
    const pkg = createPackage(fullAnalysis, buildSpec, ['mandala.jpg']);
    const md = toMarkdown(pkg);
    expect(md).toContain('self-contained');
  });
});
