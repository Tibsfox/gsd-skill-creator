import { describe, it, expect } from 'vitest';
import {
  ImageInputSchema,
  CreatorContextSchema,
  ObservationLayerSchema,
  ImageObservationSchema,
  ColorParameterSchema,
  GeometryParameterSchema,
  MaterialParameterSchema,
  FeelParameterSchema,
  ExtractedParametersSchema,
  ConnectionSchema,
  UnifiedUnderstandingSchema,
  BuildStepSchema,
  BuildSpecSchema,
  TransmissionPackageSchema,
  ITM_SCHEMAS,
  OBSERVATION_LAYERS,
  CONNECTION_TYPES,
  TARGET_MEDIA,
  IMAGE_SOURCES,
  ARRANGEMENT_PATTERNS,
} from './types.js';

// ============================================================================
// Test fixtures — stone mandala reference implementation
// ============================================================================

const stoneImage = {
  id: 'mandala-daylight',
  source: 'upload' as const,
  data: 'base64-encoded-image-data',
  metadata: { width: 4032, height: 3024, format: 'jpeg' },
};

const nightImage = {
  id: 'mandala-night',
  source: 'upload' as const,
  data: 'base64-encoded-night-data',
};

const creatorContext = {
  process: 'Stones placed along the walking path during speaker phase alignment',
  intent: 'Mark the acoustic sweet spot path through the forest campsite',
  constraints: 'Only river stones available, tarp as base surface',
  accidents: 'The mandala pattern emerged from the acoustic geometry — not designed',
  multipurpose: 'Cairns mark the path AND catch projector light AND cast colored shadows',
};

const literalLayer = {
  layer: 'literal' as const,
  observations: [
    'River stones stacked in columns on white tarp',
    'Central tall cairn approximately 35cm',
    'Stones gray, tan, and ochre',
    'Pine tree trunks in background',
    'Speakers under canopy partially visible',
    'Brown needle ground cover',
    'Approximately 80 cairns visible',
    'White fabric surface extends beyond cairns',
    'Varying column heights 2-7 stones',
    'Some darker stones suggesting moisture',
  ],
  confidence: 0.9,
};

const spatialLayer = {
  layer: 'spatial' as const,
  observations: [
    'Cairns radiate outward from central column',
    'Spiral arrangement with approximate radial balance',
    'Density highest near center',
    'Height decreases with distance from center',
  ],
  confidence: 0.75,
};

const relationalLayer = {
  layer: 'relational' as const,
  observations: [
    'Same cairns appear in daylight and night shots',
    'Daylight reveals structure, night reveals light interaction',
    'Central cairn prominent in both conditions',
  ],
  confidence: 0.6,
};

const moodLayer = {
  layer: 'mood' as const,
  observations: [
    'Intimate despite outdoor setting',
    'Handmade quality from natural materials',
    'Night: ceremonial transformation through colored light',
  ],
  confidence: 0.5,
};

const observation = {
  imageId: 'mandala-daylight',
  layers: [literalLayer, spatialLayer, relationalLayer, moodLayer],
  rawDescription: 'River stone cairns arranged in organic spiral on white tarp...',
};

const colorParams = {
  palette: [
    { name: 'warm stone', hex: '#C4956A', role: 'primary' },
    { name: 'ochre', hex: '#CC7722', role: 'accent' },
    { name: 'tarp white', hex: '#F5F0E8', role: 'background' },
    { name: 'magenta light', hex: '#FF1493', role: 'night-light' },
    { name: 'cyan light', hex: '#00CED1', role: 'night-light' },
  ],
  temperature: 'warm' as const,
  contrast: 0.6,
  saturation: 0.45,
  relationships: 'analogous warm stones with complementary cool night lights',
};

const geometryParams = {
  primaryShape: 'cairn-column',
  arrangement: 'organic' as const,
  symmetry: 'approximate' as const,
  proportions: { heightDecay: 0.85, densityGradient: 0.7 },
  constants: { goldenAngle: 2.399963 },
};

const materialParams = {
  surfaces: [
    { name: 'river stone', reflectivity: 0.15, roughness: 0.8 },
    { name: 'white tarp', reflectivity: 0.6, roughness: 0.3 },
  ],
  lightInteraction: 'scatter' as const,
  blendModes: ['multiply', 'screen'],
};

const feelParams = {
  energy: 0.6,
  intimacy: 0.8,
  order: 0.4,
  handmade: 0.9,
  ceremony: 0.7,
};

const extractedParams = {
  color: colorParams,
  geometry: geometryParams,
  material: materialParams,
  feel: feelParams,
  custom: {},
};

// ============================================================================
// Input Types
// ============================================================================

describe('ImageInput', () => {
  it('validates a complete image input', () => {
    expect(ImageInputSchema.parse(stoneImage)).toEqual(stoneImage);
  });

  it('validates without metadata', () => {
    expect(ImageInputSchema.parse(nightImage)).toEqual(nightImage);
  });

  it('rejects empty id', () => {
    expect(() => ImageInputSchema.parse({ ...stoneImage, id: '' })).toThrow();
  });

  it('rejects invalid source type', () => {
    expect(() => ImageInputSchema.parse({ ...stoneImage, source: 'file' })).toThrow();
  });
});

describe('CreatorContext', () => {
  it('validates full context', () => {
    expect(CreatorContextSchema.parse(creatorContext)).toEqual(creatorContext);
  });

  it('validates empty context (visual-only mode)', () => {
    expect(CreatorContextSchema.parse({})).toEqual({});
  });

  it('validates partial context', () => {
    const partial = { process: 'Built over 3 hours' };
    expect(CreatorContextSchema.parse(partial)).toEqual(partial);
  });
});

// ============================================================================
// Observation Types
// ============================================================================

describe('ObservationLayer', () => {
  it('validates literal layer', () => {
    expect(ObservationLayerSchema.parse(literalLayer)).toEqual(literalLayer);
  });

  it('validates mood layer', () => {
    expect(ObservationLayerSchema.parse(moodLayer)).toEqual(moodLayer);
  });

  it('rejects confidence outside 0-1', () => {
    expect(() => ObservationLayerSchema.parse({ ...literalLayer, confidence: 1.5 })).toThrow();
    expect(() => ObservationLayerSchema.parse({ ...literalLayer, confidence: -0.1 })).toThrow();
  });

  it('rejects empty observations array', () => {
    expect(() => ObservationLayerSchema.parse({ ...literalLayer, observations: [] })).toThrow();
  });

  it('rejects invalid layer name', () => {
    expect(() => ObservationLayerSchema.parse({ ...literalLayer, layer: 'abstract' })).toThrow();
  });
});

describe('ImageObservation', () => {
  it('validates complete four-layer observation', () => {
    expect(ImageObservationSchema.parse(observation)).toEqual(observation);
  });

  it('validates single-layer observation', () => {
    const single = { imageId: 'img-001', layers: [literalLayer], rawDescription: 'Stones.' };
    expect(ImageObservationSchema.parse(single)).toEqual(single);
  });

  it('rejects more than 4 layers', () => {
    const tooMany = { ...observation, layers: [...observation.layers, literalLayer] };
    expect(() => ImageObservationSchema.parse(tooMany)).toThrow();
  });
});

// ============================================================================
// Parameter Types
// ============================================================================

describe('ColorParameter', () => {
  it('validates stone mandala color params', () => {
    expect(ColorParameterSchema.parse(colorParams)).toEqual(colorParams);
  });

  it('rejects invalid hex', () => {
    const bad = { ...colorParams, palette: [{ name: 'x', hex: 'red', role: 'y' }] };
    expect(() => ColorParameterSchema.parse(bad)).toThrow();
  });

  it('rejects empty palette', () => {
    expect(() => ColorParameterSchema.parse({ ...colorParams, palette: [] })).toThrow();
  });
});

describe('GeometryParameter', () => {
  it('validates organic arrangement', () => {
    expect(GeometryParameterSchema.parse(geometryParams)).toEqual(geometryParams);
  });

  it('accepts all arrangement patterns', () => {
    for (const arr of ARRANGEMENT_PATTERNS) {
      expect(GeometryParameterSchema.parse({ ...geometryParams, arrangement: arr })).toBeTruthy();
    }
  });
});

describe('MaterialParameter', () => {
  it('validates stone + tarp surfaces', () => {
    expect(MaterialParameterSchema.parse(materialParams)).toEqual(materialParams);
  });

  it('rejects reflectivity outside 0-1', () => {
    const bad = { ...materialParams, surfaces: [{ name: 'x', reflectivity: 2, roughness: 0.5 }] };
    expect(() => MaterialParameterSchema.parse(bad)).toThrow();
  });
});

describe('FeelParameter', () => {
  it('validates stone mandala feel', () => {
    expect(FeelParameterSchema.parse(feelParams)).toEqual(feelParams);
  });

  it('accepts boundary values', () => {
    const zeros = { energy: 0, intimacy: 0, order: 0, handmade: 0, ceremony: 0 };
    const ones = { energy: 1, intimacy: 1, order: 1, handmade: 1, ceremony: 1 };
    expect(FeelParameterSchema.parse(zeros)).toEqual(zeros);
    expect(FeelParameterSchema.parse(ones)).toEqual(ones);
  });

  it('rejects values outside 0-1', () => {
    expect(() => FeelParameterSchema.parse({ ...feelParams, energy: 1.1 })).toThrow();
    expect(() => FeelParameterSchema.parse({ ...feelParams, ceremony: -0.1 })).toThrow();
  });
});

describe('ExtractedParameters', () => {
  it('validates complete parameter set', () => {
    expect(ExtractedParametersSchema.parse(extractedParams)).toEqual(extractedParams);
  });

  it('defaults custom to empty object', () => {
    const { custom: _, ...noCustom } = extractedParams;
    const result = ExtractedParametersSchema.parse(noCustom);
    expect(result.custom).toEqual({});
  });
});

// ============================================================================
// Connection Types
// ============================================================================

describe('Connection', () => {
  it('validates cross-image connection', () => {
    const conn = {
      type: 'cross-image' as const,
      description: 'Same cairns in day and night',
      elements: ['cairn-positions', 'central-column'],
      significance: 'Persistent structure reveals load-bearing elements',
    };
    expect(ConnectionSchema.parse(conn)).toEqual(conn);
  });

  it('validates visual-context connection', () => {
    const conn = {
      type: 'visual-context' as const,
      description: 'Spiral pattern maps acoustic sweet spot path',
      elements: ['organic-spiral', 'phase-alignment-walk'],
      significance: 'The visual randomness IS the pattern — acoustic geometry',
    };
    expect(ConnectionSchema.parse(conn)).toEqual(conn);
  });

  it('accepts all connection types', () => {
    for (const type of CONNECTION_TYPES) {
      const conn = { type, description: 'test', elements: ['a'], significance: 'test' };
      expect(ConnectionSchema.parse(conn)).toBeTruthy();
    }
  });
});

describe('UnifiedUnderstanding', () => {
  it('validates full understanding', () => {
    const understanding = {
      observations: [observation],
      context: creatorContext,
      connections: [{
        type: 'visual-context' as const,
        description: 'Spiral maps sound field',
        elements: ['spiral', 'acoustic-path'],
        significance: 'Key insight',
      }],
      parameters: extractedParams,
      processInsight: 'The mandala maps the acoustic sweet spot path',
    };
    expect(UnifiedUnderstandingSchema.parse(understanding)).toEqual(understanding);
  });

  it('validates without parameters (pre-extraction)', () => {
    const preExtract = {
      observations: [observation],
      context: creatorContext,
      connections: [],
    };
    expect(UnifiedUnderstandingSchema.parse(preExtract)).toBeTruthy();
  });
});

// ============================================================================
// Output Types
// ============================================================================

describe('BuildStep', () => {
  it('validates step with philosophy note', () => {
    const step = {
      step: 1,
      instruction: 'Generate cairn positions using golden angle spiral',
      doneState: '80 positions generated with height decay',
      philosophyNote: 'Golden angle produces non-repeating organic pattern — matches the accumulated placement from walking',
    };
    expect(BuildStepSchema.parse(step)).toEqual(step);
  });

  it('validates step without philosophy note', () => {
    const step = { step: 2, instruction: 'Set canvas size', doneState: 'Canvas rendered' };
    expect(BuildStepSchema.parse(step)).toEqual(step);
  });

  it('rejects zero or negative step', () => {
    expect(() => BuildStepSchema.parse({ step: 0, instruction: 'x', doneState: 'y' })).toThrow();
  });
});

describe('BuildSpec', () => {
  it('validates canvas build spec', () => {
    const spec = {
      target: 'canvas' as const,
      parameters: extractedParams,
      steps: [{
        step: 1,
        instruction: 'Create canvas element',
        doneState: 'Canvas visible',
      }],
      code: '<canvas id="mandala"></canvas>',
      philosophyDocument: 'The golden angle creates organic spiral...',
    };
    expect(BuildSpecSchema.parse(spec)).toEqual(spec);
  });

  it('accepts all target media', () => {
    for (const target of TARGET_MEDIA) {
      const spec = {
        target,
        parameters: extractedParams,
        steps: [{ step: 1, instruction: 'init', doneState: 'done' }],
        philosophyDocument: 'test',
      };
      expect(BuildSpecSchema.parse(spec)).toBeTruthy();
    }
  });
});

describe('TransmissionPackage', () => {
  it('validates self-contained package', () => {
    const pkg = {
      version: '1.0.0',
      created: '2026-03-07',
      sourceImages: ['mandala-daylight', 'mandala-night'],
      analysis: {
        observations: [observation],
        context: creatorContext,
        connections: [],
      },
      buildSpec: {
        target: 'canvas' as const,
        parameters: extractedParams,
        steps: [{ step: 1, instruction: 'init', doneState: 'done' }],
        philosophyDocument: 'test',
      },
      reproducibility: {
        canExecuteWithoutImages: true,
        requiredContext: ['observation analysis', 'extracted parameters'],
      },
    };
    expect(TransmissionPackageSchema.parse(pkg)).toEqual(pkg);
  });
});

// ============================================================================
// Constants & Schema Registry
// ============================================================================

describe('Constants', () => {
  it('has 4 observation layers', () => {
    expect(OBSERVATION_LAYERS).toHaveLength(4);
  });

  it('has 3 connection types', () => {
    expect(CONNECTION_TYPES).toHaveLength(3);
  });

  it('has 7 target media', () => {
    expect(TARGET_MEDIA).toHaveLength(7);
  });

  it('has 3 image sources', () => {
    expect(IMAGE_SOURCES).toHaveLength(3);
  });
});

describe('ITM_SCHEMAS', () => {
  it('exports all 14 schemas', () => {
    expect(Object.keys(ITM_SCHEMAS)).toHaveLength(14);
  });

  it('all schemas are Zod schemas with parse method', () => {
    for (const [name, schema] of Object.entries(ITM_SCHEMAS)) {
      expect(typeof schema.parse).toBe('function');
    }
  });
});
