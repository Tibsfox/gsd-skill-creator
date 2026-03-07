import { describe, it, expect } from 'vitest';
import {
  scoreComplexity,
  route,
  detectOverride,
  handoffToVisionMission,
  bridge,
} from './pipeline-bridge.js';
import type { UnifiedUnderstanding, ExtractedParameters } from './types.js';

const minimalUnderstanding: UnifiedUnderstanding = {
  observations: [{ imageId: 'test', layers: [{ layer: 'literal', observations: ['a stone'], confidence: 0.9 }], rawDescription: 'A stone.' }],
  context: { process: 'Built by hand' },
  connections: [{ type: 'visual-context', description: 'test', elements: ['a'], significance: 'test' }],
  processInsight: 'Pattern emerged from walking path',
};

const minimalParams: ExtractedParameters = {
  color: { palette: [{ name: 'gray', hex: '#808080', role: 'primary' }], temperature: 'cool', contrast: 0.5, saturation: 0.3, relationships: 'analogous' },
  geometry: { primaryShape: 'cairn', arrangement: 'spiral', symmetry: 'approximate', proportions: {}, constants: { goldenAngle: 2.399963 } },
  material: { surfaces: [{ name: 'stone', reflectivity: 0.15, roughness: 0.85 }], lightInteraction: 'absorb', blendModes: [] },
  feel: { energy: 0.3, intimacy: 0.7, order: 0.4, handmade: 0.9, ceremony: 0.5 },
  custom: {},
};

describe('scoreComplexity', () => {
  it('scores simple request as 0', () => {
    expect(scoreComplexity(1, 1, 1, 0).total).toBe(0);
  });

  it('scores complex request as 10+', () => {
    const score = scoreComplexity(10, 4, 8, 2);
    expect(score.total).toBeGreaterThanOrEqual(10);
  });

  it('clamps dimensions to 0-3', () => {
    const score = scoreComplexity(100, 100, 100, 100);
    expect(score.imageCount).toBeLessThanOrEqual(3);
    expect(score.targetCount).toBeLessThanOrEqual(3);
    expect(score.total).toBe(12);
  });

  it('medium request scores 4-6', () => {
    const score = scoreComplexity(3, 2, 3, 0);
    expect(score.total).toBeGreaterThanOrEqual(2);
    expect(score.total).toBeLessThanOrEqual(6);
  });
});

describe('route', () => {
  it('routes 0-3 to direct build', () => {
    expect(route(0)).toBe('direct-build');
    expect(route(3)).toBe('direct-build');
  });

  it('routes 4-6 to build spec', () => {
    expect(route(4)).toBe('build-spec');
    expect(route(6)).toBe('build-spec');
  });

  it('routes 7-9 to lightweight mission', () => {
    expect(route(7)).toBe('lightweight-mission');
    expect(route(9)).toBe('lightweight-mission');
  });

  it('routes 10+ to full mission', () => {
    expect(route(10)).toBe('full-mission');
    expect(route(12)).toBe('full-mission');
  });

  it('override direct forces direct build', () => {
    expect(route(12, 'direct')).toBe('direct-build');
  });

  it('override mission forces full mission', () => {
    expect(route(0, 'mission')).toBe('full-mission');
  });

  it('override build-spec forces build spec', () => {
    expect(route(0, 'build-spec')).toBe('build-spec');
  });
});

describe('detectOverride', () => {
  it('detects direct override', () => {
    expect(detectOverride('Just build it from these photos')).toBe('direct');
  });

  it('detects mission override', () => {
    expect(detectOverride('Make this a mission package')).toBe('mission');
  });

  it('detects build-spec override', () => {
    expect(detectOverride('Give me a build spec for this')).toBe('build-spec');
  });

  it('returns null for no override', () => {
    expect(detectOverride('Build something from this image')).toBeNull();
  });
});

describe('handoffToVisionMission', () => {
  it('produces markdown vision document', () => {
    const doc = handoffToVisionMission(minimalUnderstanding, minimalParams);
    expect(doc).toContain('# Vision');
    expect(doc).toContain('## Context');
    expect(doc).toContain('## Architecture');
    expect(doc).toContain('## Through-Line');
  });

  it('includes process insight', () => {
    const doc = handoffToVisionMission(minimalUnderstanding, minimalParams);
    expect(doc).toContain('walking path');
  });

  it('includes geometry and feel parameters', () => {
    const doc = handoffToVisionMission(minimalUnderstanding, minimalParams);
    expect(doc).toContain('spiral');
    expect(doc).toContain('handmade');
  });
});

describe('bridge', () => {
  it('simple request produces direct build', () => {
    const result = bridge(1, 1, 1, 0, 'Build a canvas piece');
    expect(result.route).toBe('direct-build');
    expect(result.score.total).toBeLessThanOrEqual(3);
  });

  it('complex request produces full mission with vision draft', () => {
    const result = bridge(10, 4, 8, 1, 'Design a whole system', minimalUnderstanding, minimalParams);
    expect(result.route).toBe('full-mission');
    expect(result.visionDraft).toBeTruthy();
    expect(result.visionDraft).toContain('# Vision');
  });

  it('override overrides score', () => {
    const result = bridge(10, 4, 8, 1, 'Just build it from these');
    expect(result.route).toBe('direct-build');
    expect(result.override).toBe('direct');
  });

  it('no vision draft for direct build', () => {
    const result = bridge(1, 1, 1, 0, 'Build it', minimalUnderstanding, minimalParams);
    expect(result.visionDraft).toBeUndefined();
  });
});
