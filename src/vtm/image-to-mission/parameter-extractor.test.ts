import { describe, it, expect } from 'vitest';
import {
  extractColors,
  extractGeometry,
  extractMaterials,
  extractFeel,
  extractCustom,
  extract,
  COLOR_KEYWORDS,
  MATERIAL_PROPERTIES,
} from './parameter-extractor.js';
import { ExtractedParametersSchema } from './types.js';
import type { UnifiedUnderstanding } from './types.js';

// ============================================================================
// Test fixtures — stone mandala UnifiedUnderstanding
// ============================================================================

const mandalaUnderstanding: UnifiedUnderstanding = {
  observations: [
    {
      imageId: 'mandala-daylight',
      layers: [
        {
          layer: 'literal',
          observations: [
            'River stones stacked in columns on white tarp',
            'Central tall cairn approximately 35cm',
            'Stones gray, tan, and ochre',
            'Pine tree trunks in background',
            'Approximately 80 cairns visible',
          ],
          confidence: 0.9,
        },
        {
          layer: 'spatial',
          observations: [
            'Cairns radiate outward from central column',
            'Organic spiral arrangement with approximate radial balance',
            'Height decreases with distance from center',
            'Density highest near center',
          ],
          confidence: 0.75,
        },
        {
          layer: 'relational',
          observations: [
            'Same cairns in daylight and night conditions',
            'Daylight reveals structure, night reveals light interaction',
          ],
          confidence: 0.6,
        },
        {
          layer: 'mood',
          observations: [
            'Intimate despite outdoor setting',
            'Handmade quality from natural materials',
            'Contemplative stillness',
          ],
          confidence: 0.5,
        },
      ],
      rawDescription: 'Stone mandala in daylight...',
    },
    {
      imageId: 'mandala-night',
      layers: [
        {
          layer: 'literal',
          observations: [
            'River stones casting colored shadows',
            'Magenta and cyan light sources visible',
          ],
          confidence: 0.85,
        },
        {
          layer: 'mood',
          observations: [
            'Ceremonial transformation through colored light',
            'Sacred quality emerges at night',
          ],
          confidence: 0.5,
        },
      ],
      rawDescription: 'Stone mandala at night...',
    },
  ],
  context: {
    process: 'Stones placed along the walking path during speaker phase alignment',
    intent: 'Mark the acoustic sweet spot path',
    constraints: 'Only river stones available, tarp as base surface',
    accidents: 'The mandala pattern emerged from the acoustic geometry — not designed',
    multipurpose: 'Cairns mark the path AND catch projector light AND cast colored shadows',
  },
  connections: [
    {
      type: 'process-pattern',
      description: 'Process classified as emergent (confirmed by creator context)',
      elements: ['organic', 'approximate', 'natural', 'handmade'],
      significance: 'Work accumulated through process',
    },
    {
      type: 'visual-context',
      description: 'process context illuminates spatial observations',
      elements: ['walking path', 'Cairns radiate outward from central column'],
      significance: 'Creator process reinterprets spatial layer',
    },
  ],
  processInsight: 'The mandala pattern emerged from the acoustic geometry — not designed',
};

const minimalUnderstanding: UnifiedUnderstanding = {
  observations: [{
    imageId: 'simple',
    layers: [{
      layer: 'literal',
      observations: ['a photograph of an object'],
      confidence: 0.9,
    }],
    rawDescription: 'A photograph.',
  }],
  context: {},
  connections: [],
};

// ============================================================================
// Color Extraction
// ============================================================================

describe('extractColors', () => {
  it('extracts warm palette from stone mandala', () => {
    const result = extractColors(mandalaUnderstanding);
    expect(result.temperature).toBe('warm');
  });

  it('finds multiple colors from observations', () => {
    const result = extractColors(mandalaUnderstanding);
    expect(result.palette.length).toBeGreaterThanOrEqual(3);
  });

  it('each palette entry has name, hex, and role', () => {
    const result = extractColors(mandalaUnderstanding);
    for (const color of result.palette) {
      expect(color.name).toBeTruthy();
      expect(color.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color.role).toBeTruthy();
    }
  });

  it('first color has primary role', () => {
    const result = extractColors(mandalaUnderstanding);
    expect(result.palette[0].role).toBe('primary');
  });

  it('contrast and saturation are in 0-1 range', () => {
    const result = extractColors(mandalaUnderstanding);
    expect(result.contrast).toBeGreaterThanOrEqual(0);
    expect(result.contrast).toBeLessThanOrEqual(1);
    expect(result.saturation).toBeGreaterThanOrEqual(0);
    expect(result.saturation).toBeLessThanOrEqual(1);
  });

  it('detects complementary relationships when warm and cool present', () => {
    const result = extractColors(mandalaUnderstanding);
    // mandala has warm stones + cool cyan/gray → complementary
    expect(result.relationships).toBe('complementary');
  });

  it('returns default neutral palette when no colors found', () => {
    const result = extractColors(minimalUnderstanding);
    expect(result.palette).toHaveLength(1);
    expect(result.palette[0].name).toBe('neutral');
  });
});

// ============================================================================
// Geometry Extraction
// ============================================================================

describe('extractGeometry', () => {
  it('detects organic arrangement from mandala', () => {
    const result = extractGeometry(mandalaUnderstanding);
    // "organic spiral" — first keyword match wins
    expect(['organic', 'spiral']).toContain(result.arrangement);
  });

  it('detects cairn as primary shape', () => {
    const result = extractGeometry(mandalaUnderstanding);
    expect(result.primaryShape).toBe('cairn');
  });

  it('classifies symmetry as approximate', () => {
    const result = extractGeometry(mandalaUnderstanding);
    expect(result.symmetry).toBe('approximate');
  });

  it('includes golden angle for emergent organic patterns', () => {
    const result = extractGeometry(mandalaUnderstanding);
    expect(result.constants.goldenAngle).toBeCloseTo(2.399963, 4);
  });

  it('extracts element count from observations', () => {
    const result = extractGeometry(mandalaUnderstanding);
    expect(result.proportions.elementCount).toBe(80);
  });

  it('extracts height decay proportion', () => {
    const result = extractGeometry(mandalaUnderstanding);
    expect(result.proportions.heightDecay).toBeDefined();
  });

  it('returns defaults for minimal input', () => {
    const result = extractGeometry(minimalUnderstanding);
    expect(result.primaryShape).toBe('form');
    expect(result.arrangement).toBe('organic');
  });
});

// ============================================================================
// Material Extraction
// ============================================================================

describe('extractMaterials', () => {
  it('identifies stone surface with high roughness', () => {
    const result = extractMaterials(mandalaUnderstanding);
    const stone = result.surfaces.find(s => s.name === 'stone');
    expect(stone).toBeTruthy();
    expect(stone!.roughness).toBeGreaterThanOrEqual(0.7);
    expect(stone!.reflectivity).toBeLessThanOrEqual(0.3);
  });

  it('all reflectivity/roughness values in 0-1 range', () => {
    const result = extractMaterials(mandalaUnderstanding);
    for (const surface of result.surfaces) {
      expect(surface.reflectivity).toBeGreaterThanOrEqual(0);
      expect(surface.reflectivity).toBeLessThanOrEqual(1);
      expect(surface.roughness).toBeGreaterThanOrEqual(0);
      expect(surface.roughness).toBeLessThanOrEqual(1);
    }
  });

  it('detects blend modes from lighting context', () => {
    const result = extractMaterials(mandalaUnderstanding);
    // "colored shadows" + "light" in observations
    expect(result.blendModes.length).toBeGreaterThan(0);
  });

  it('returns default surface for minimal input', () => {
    const result = extractMaterials(minimalUnderstanding);
    expect(result.surfaces).toHaveLength(1);
    expect(result.surfaces[0].name).toBe('surface');
  });

  it('light interaction is a valid enum value', () => {
    const result = extractMaterials(mandalaUnderstanding);
    expect(['absorb', 'reflect', 'transmit', 'scatter']).toContain(result.lightInteraction);
  });
});

// ============================================================================
// Feel Extraction
// ============================================================================

describe('extractFeel', () => {
  it('all dimensions are in 0-1 range', () => {
    const result = extractFeel(mandalaUnderstanding);
    for (const [, value] of Object.entries(result)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('detects high intimacy from mandala mood', () => {
    const result = extractFeel(mandalaUnderstanding);
    expect(result.intimacy).toBeGreaterThan(0.5);
  });

  it('detects high handmade quality', () => {
    const result = extractFeel(mandalaUnderstanding);
    expect(result.handmade).toBeGreaterThan(0.5);
  });

  it('detects ceremony from night observations', () => {
    const result = extractFeel(mandalaUnderstanding);
    expect(result.ceremony).toBeGreaterThan(0.5);
  });

  it('returns neutral 0.5 for minimal input', () => {
    const result = extractFeel(minimalUnderstanding);
    expect(result.energy).toBe(0.5);
    expect(result.intimacy).toBe(0.5);
  });
});

// ============================================================================
// Custom Extraction
// ============================================================================

describe('extractCustom', () => {
  it('detects acoustic geometry from context', () => {
    const result = extractCustom(mandalaUnderstanding);
    expect(result.acousticGeometry).toBe(true);
  });

  it('detects multiple condition modes', () => {
    const result = extractCustom(mandalaUnderstanding);
    const modes = result.conditionModes as string[];
    expect(modes).toBeDefined();
    expect(modes.length).toBeGreaterThanOrEqual(2);
  });

  it('detects colored light sources', () => {
    const result = extractCustom(mandalaUnderstanding);
    const sources = result.lightSources as string[];
    expect(sources).toBeDefined();
    expect(sources.length).toBeGreaterThan(0);
  });

  it('returns empty object for minimal input', () => {
    const result = extractCustom(minimalUnderstanding);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ============================================================================
// Full Extract (orchestrator)
// ============================================================================

describe('extract', () => {
  it('returns all four parameter categories', () => {
    const result = extract(mandalaUnderstanding);
    expect(result.color).toBeDefined();
    expect(result.geometry).toBeDefined();
    expect(result.material).toBeDefined();
    expect(result.feel).toBeDefined();
    expect(result.custom).toBeDefined();
  });

  it('output validates against ExtractedParameters schema', () => {
    const result = extract(mandalaUnderstanding);
    expect(() => ExtractedParametersSchema.parse(result)).not.toThrow();
  });

  it('color palette has at least 3 entries for mandala', () => {
    const result = extract(mandalaUnderstanding);
    expect(result.color.palette.length).toBeGreaterThanOrEqual(3);
  });

  it('geometry includes golden angle for organic mandala', () => {
    const result = extract(mandalaUnderstanding);
    expect(result.geometry.constants.goldenAngle).toBeDefined();
  });

  it('all feel values in valid range', () => {
    const result = extract(mandalaUnderstanding);
    for (const [, value] of Object.entries(result.feel)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('handles minimal understanding gracefully', () => {
    const result = extract(minimalUnderstanding);
    expect(result.color.palette.length).toBeGreaterThanOrEqual(1);
    expect(result.material.surfaces.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Reference Tables
// ============================================================================

describe('reference tables', () => {
  it('COLOR_KEYWORDS has valid hex codes', () => {
    for (const [, info] of Object.entries(COLOR_KEYWORDS)) {
      expect(info.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('MATERIAL_PROPERTIES has valid ranges', () => {
    for (const [, props] of Object.entries(MATERIAL_PROPERTIES)) {
      expect(props.reflectivity).toBeGreaterThanOrEqual(0);
      expect(props.reflectivity).toBeLessThanOrEqual(1);
      expect(props.roughness).toBeGreaterThanOrEqual(0);
      expect(props.roughness).toBeLessThanOrEqual(1);
    }
  });
});
