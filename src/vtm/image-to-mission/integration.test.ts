/**
 * Integration + Safety-Critical test suite for image-to-mission.
 *
 * Tests cross-component data flow and mandatory safety boundaries.
 */
import { describe, it, expect } from 'vitest';
import { integrate } from './context-integrator.js';
import { observe } from './observation-engine.js';
import { synthesize } from './connection-engine.js';
import { extract, extractFeel } from './parameter-extractor.js';
import { translateToCanvas, translateCode } from './translation-code.js';
import { toSVG, toPalette } from './translation-design.js';
import { generateBuildSpec } from './build-generator.js';
import { createPackage, toJSON, toMarkdown, validate } from './transmission-packager.js';
import { scoreComplexity, route, bridge } from './pipeline-bridge.js';
import type { ImageInput, ImageObservation, CreatorContext, UnifiedUnderstanding, ExtractedParameters } from './types.js';

// Fixtures — reusable across integration tests
const dayImage: ImageInput = { id: 'mandala-daylight', source: 'upload', data: 'test-data' };
const nightImage: ImageInput = { id: 'mandala-night', source: 'upload', data: 'test-night' };

const dayObs: ImageObservation = {
  imageId: 'mandala-daylight',
  layers: [
    { layer: 'literal', observations: ['River stones on white tarp', 'Approximately 80 cairns'], confidence: 0.9 },
    { layer: 'spatial', observations: ['Organic spiral arrangement', 'Height decreases from center'], confidence: 0.75 },
    { layer: 'relational', observations: ['Central cairn prominent'], confidence: 0.6 },
    { layer: 'mood', observations: ['Intimate, handmade, contemplative'], confidence: 0.5 },
  ],
  rawDescription: 'Stone mandala daylight.',
};

const nightObs: ImageObservation = {
  imageId: 'mandala-night',
  layers: [
    { layer: 'literal', observations: ['River stones casting colored shadows', 'Magenta and cyan light'], confidence: 0.85 },
    { layer: 'spatial', observations: ['Same arrangement, colored shadows extend radially'], confidence: 0.7 },
    { layer: 'relational', observations: ['Same cairns, lighting transforms mood'], confidence: 0.6 },
    { layer: 'mood', observations: ['Ceremonial transformation, sacred quality at night'], confidence: 0.5 },
  ],
  rawDescription: 'Stone mandala at night.',
};

const creatorContext: CreatorContext = {
  process: 'Stones placed along the walking path during speaker phase alignment',
  accidents: 'The mandala pattern emerged from the acoustic geometry — not designed',
  multipurpose: 'Cairns mark the path AND catch projector light',
};

// ============================================================================
// Safety-Critical Tests (S-01 through S-08)
// ============================================================================

describe('safety-critical', () => {
  it('S-02: no hallucinated context from empty input', () => {
    const result = integrate({});
    expect(result.context).toEqual({});
    expect(result.processInsight).toBeNull();
  });

  it('S-03: empty observations return gracefully', () => {
    const result = observe([]);
    expect(result).toEqual([]);
  });

  it('S-04: philosophy notes credit creator context', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    const spec = generateBuildSpec(params, 'canvas');
    const notes = spec.steps.filter(s => s.philosophyNote).map(s => s.philosophyNote!);
    // Notes should reference organic/handmade patterns, not claim authorship
    for (const note of notes) {
      expect(note).not.toContain('I designed');
      expect(note).not.toContain('I created');
    }
  });

  it('S-06: feel parameters labeled as 0-1 interpretation', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    for (const [, value] of Object.entries(params.feel)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('S-07: transmission package contains no image data', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    const spec = generateBuildSpec(params, 'canvas');
    const pkg = createPackage(understanding, spec, ['mandala-daylight.jpg']);
    const json = toJSON(pkg);
    // Should contain description references, not base64 data
    expect(json).not.toContain('base64-encoded');
    expect(json).toContain('mandala-daylight.jpg');
  });
});

// ============================================================================
// Integration Tests (INT-01 through INT-14)
// ============================================================================

describe('integration: observation → connection', () => {
  it('INT-01: ImageObservation[] feeds into synthesize', () => {
    const result = synthesize([dayObs, nightObs], creatorContext);
    expect(result.observations).toHaveLength(2);
    expect(result.connections.length).toBeGreaterThan(0);
  });

  it('INT-02: CreatorContext feeds into synthesize', () => {
    const result = synthesize([dayObs], creatorContext);
    expect(result.context).toEqual(creatorContext);
    expect(result.processInsight).toBeTruthy();
  });
});

describe('integration: connection → parameter', () => {
  it('INT-03: UnifiedUnderstanding produces valid ExtractedParameters', () => {
    const understanding = synthesize([dayObs, nightObs], creatorContext);
    const params = extract(understanding);
    expect(params.color.palette.length).toBeGreaterThan(0);
    expect(params.geometry.primaryShape).toBeTruthy();
    expect(params.material.surfaces.length).toBeGreaterThan(0);
    expect(params.feel.energy).toBeDefined();
  });
});

describe('integration: parameter → translation', () => {
  it('INT-04: ExtractedParameters produce runnable Canvas code', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    const html = translateToCanvas(params);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<canvas');
  });

  it('INT-05: ExtractedParameters produce valid SVG', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    const svg = toSVG(params);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('INT-06: ExtractedParameters produce ordered BuildStep[]', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    const spec = generateBuildSpec(params, 'canvas');
    expect(spec.steps.length).toBeGreaterThanOrEqual(5);
    expect(spec.steps[0].step).toBe(1);
  });
});

describe('integration: build → transmission', () => {
  it('INT-07: BuildSpec + Understanding packages into valid TransmissionPackage', () => {
    const understanding = synthesize([dayObs, nightObs], creatorContext);
    const params = extract(understanding);
    const spec = generateBuildSpec(params, 'canvas');
    const pkg = createPackage(understanding, spec, ['day.jpg', 'night.jpg']);
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.buildSpec.steps.length).toBeGreaterThan(0);
  });

  it('INT-14: end-to-end — images + context → complete transmission package', () => {
    // Full pipeline: observe → integrate → synthesize → extract → build → package
    const observations = observe([dayImage, nightImage]);
    const { context, processInsight } = integrate(creatorContext);

    // Use pre-built observations for richer test (observation engine returns skeletons)
    const understanding = synthesize([dayObs, nightObs], context);
    const params = extract(understanding);
    const spec = generateBuildSpec(params, 'canvas');
    const pkg = createPackage(understanding, spec, ['day.jpg', 'night.jpg']);

    const json = toJSON(pkg);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0.0');

    const md = toMarkdown(pkg);
    expect(md).toContain('# Image to Mission');
    expect(md).toContain('## How I Built It');
  });
});

describe('integration: pipeline bridge', () => {
  it('INT-11: 1 image + simple request → direct build', () => {
    const result = bridge(1, 1, 1, 0, 'Make a canvas piece');
    expect(result.route).toBe('direct-build');
  });

  it('INT-12: 10 images + multi-target → full mission', () => {
    const result = bridge(10, 5, 10, 1, 'Design a complete system');
    expect(result.route).toBe('full-mission');
  });

  it('INT-13: full mission route produces vision document draft', () => {
    const understanding = synthesize([dayObs], creatorContext);
    const params = extract(understanding);
    const result = bridge(10, 5, 10, 0, 'Design everything', understanding, params);
    expect(result.visionDraft).toBeTruthy();
    expect(result.visionDraft).toContain('# Vision');
    expect(result.visionDraft).toContain('Architecture');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('EC-06: override "just build it" on complex request', () => {
    const result = bridge(10, 4, 8, 1, 'Just build it from these');
    expect(result.route).toBe('direct-build');
  });

  it('EC-07: override "make mission" on simple request', () => {
    const result = bridge(1, 1, 1, 0, 'Make this a mission please');
    expect(result.route).toBe('full-mission');
  });

  it('EC-09: context with no images', () => {
    const result = synthesize([], creatorContext);
    expect(result.observations).toEqual([]);
    expect(result.connections).toEqual([]);
  });

  it('EC-12: all feel dimensions at 0 still produces valid output', () => {
    const understanding = synthesize([dayObs], {});
    const params = extract(understanding);
    // Override feel to all zeros
    const zeroFeel = { ...params, feel: { energy: 0, intimacy: 0, order: 0, handmade: 0, ceremony: 0 } };
    const html = translateToCanvas(zeroFeel);
    expect(html).toContain('<canvas');
    const spec = generateBuildSpec(zeroFeel, 'canvas');
    expect(spec.steps.length).toBeGreaterThan(0);
  });
});
