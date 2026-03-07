import { describe, it, expect } from 'vitest';
import {
  linkCrossImage,
  bridgeVisualContext,
  findProcessPatterns,
  synthesize,
  EMERGENT_SIGNALS,
  DESIGNED_SIGNALS,
} from './connection-engine.js';
import type { ImageObservation, CreatorContext } from './types.js';

// ============================================================================
// Test fixtures — stone mandala day/night
// ============================================================================

const dayObservation: ImageObservation = {
  imageId: 'mandala-daylight',
  layers: [
    {
      layer: 'literal',
      observations: [
        'River stones stacked in columns on white tarp',
        'Central tall cairn approximately 35cm',
        'Approximately 80 cairns visible',
        'Pine tree trunks in background',
      ],
      confidence: 0.9,
    },
    {
      layer: 'spatial',
      observations: [
        'Cairns radiate outward from central column',
        'Organic spiral arrangement with approximate radial balance',
        'Height decreases with distance from center',
      ],
      confidence: 0.75,
    },
    {
      layer: 'relational',
      observations: [
        'Central cairn prominent in composition',
        'Tarp defines boundary of installation',
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
  rawDescription: 'River stone cairns on white tarp in forest clearing...',
};

const nightObservation: ImageObservation = {
  imageId: 'mandala-night',
  layers: [
    {
      layer: 'literal',
      observations: [
        'River stones stacked in columns on white tarp',
        'Central tall cairn casting colored shadows',
        'Approximately 80 cairns visible',
        'Magenta and cyan light sources',
      ],
      confidence: 0.85,
    },
    {
      layer: 'spatial',
      observations: [
        'Cairns radiate outward from central column',
        'Colored shadows extend radially from light sources',
        'Height decreases with distance from center',
      ],
      confidence: 0.7,
    },
    {
      layer: 'relational',
      observations: [
        'Same arrangement as daylight — lighting changes everything',
        'Central cairn prominent in composition',
      ],
      confidence: 0.6,
    },
    {
      layer: 'mood',
      observations: [
        'Ceremonial transformation through colored light',
        'Intimate despite outdoor setting',
        'Sacred quality emerges at night',
      ],
      confidence: 0.5,
    },
  ],
  rawDescription: 'Stone mandala under colored light at night...',
};

const creatorContext: CreatorContext = {
  process: 'Stones placed along the walking path during speaker phase alignment',
  intent: 'Mark the acoustic sweet spot path through the forest campsite',
  constraints: 'Only river stones available, tarp as base surface',
  accidents: 'The mandala pattern emerged from the acoustic geometry — not designed',
  multipurpose: 'Cairns mark the path AND catch projector light AND cast colored shadows',
};

const emptyContext: CreatorContext = {};

// ============================================================================
// Cross-Image Linker
// ============================================================================

describe('linkCrossImage', () => {
  it('returns empty for single image', () => {
    expect(linkCrossImage([dayObservation])).toEqual([]);
  });

  it('returns empty for empty input', () => {
    expect(linkCrossImage([])).toEqual([]);
  });

  it('finds persistent elements across day and night', () => {
    const connections = linkCrossImage([dayObservation, nightObservation]);
    const persistent = connections.filter(c => c.description.includes('Persistent'));
    expect(persistent.length).toBeGreaterThan(0);
    // "River stones stacked in columns on white tarp" appears in both
    expect(persistent.some(c => c.elements.length > 0)).toBe(true);
  });

  it('finds dynamic elements across day and night', () => {
    const connections = linkCrossImage([dayObservation, nightObservation]);
    const dynamic = connections.filter(c => c.description.includes('Dynamic'));
    expect(dynamic.length).toBeGreaterThan(0);
  });

  it('all connections are cross-image type', () => {
    const connections = linkCrossImage([dayObservation, nightObservation]);
    for (const c of connections) {
      expect(c.type).toBe('cross-image');
    }
  });

  it('persistent elements include structurally significant note', () => {
    const connections = linkCrossImage([dayObservation, nightObservation]);
    const persistent = connections.filter(c => c.description.includes('Persistent'));
    for (const c of persistent) {
      expect(c.significance).toContain('load-bearing');
    }
  });
});

// ============================================================================
// Visual-Context Bridge
// ============================================================================

describe('bridgeVisualContext', () => {
  it('produces connections when context matches observations', () => {
    const connections = bridgeVisualContext([dayObservation], creatorContext);
    expect(connections.length).toBeGreaterThan(0);
    expect(connections.some(c => c.type === 'visual-context')).toBe(true);
  });

  it('returns general bridge when context exists but no specific matches', () => {
    const minimalContext: CreatorContext = { intent: 'pure abstract expression' };
    const emptyObs: ImageObservation = {
      imageId: 'empty',
      layers: [{ layer: 'literal', observations: ['a red circle'], confidence: 0.9 }],
      rawDescription: 'A red circle.',
    };
    const connections = bridgeVisualContext([emptyObs], minimalContext);
    expect(connections.length).toBeGreaterThan(0);
    expect(connections[0].significance).toContain('invisible layers');
  });

  it('returns empty when no context provided', () => {
    const connections = bridgeVisualContext([dayObservation], emptyContext);
    expect(connections).toEqual([]);
  });

  it('links stone/tarp observations to constraints context', () => {
    // constraints maps to literal and spatial
    const connections = bridgeVisualContext([dayObservation], {
      constraints: 'Only river stones available, tarp as base surface',
    });
    const match = connections.find(c =>
      c.elements.some(e => typeof e === 'string' && e.toLowerCase().includes('stone')),
    );
    expect(match).toBeTruthy();
  });

  it('bridges process context to spatial observations', () => {
    const connections = bridgeVisualContext([dayObservation], {
      process: 'Cairns placed outward from central column along path',
    });
    expect(connections.some(c =>
      c.description.includes('process') && c.description.includes('spatial'),
    )).toBe(true);
  });
});

// ============================================================================
// Process Pattern Finder
// ============================================================================

describe('findProcessPatterns', () => {
  it('classifies organic observations as emergent', () => {
    const connections = findProcessPatterns([dayObservation], emptyContext);
    expect(connections.length).toBeGreaterThan(0);
    expect(connections[0].description).toContain('emergent');
  });

  it('classifies grid/symmetric observations as designed', () => {
    const designedObs: ImageObservation = {
      imageId: 'grid-art',
      layers: [{
        layer: 'spatial',
        observations: [
          'Elements in symmetric grid pattern',
          'Equal spacing between uniform columns',
          'Precise aligned rows',
        ],
        confidence: 0.8,
      }],
      rawDescription: 'Grid pattern.',
    };
    const connections = findProcessPatterns([designedObs], emptyContext);
    expect(connections[0].description).toContain('designed');
  });

  it('notes context confirmation when context agrees', () => {
    const connections = findProcessPatterns([dayObservation], creatorContext);
    expect(connections[0].description).toContain('confirmed');
  });

  it('returns empty when no signals present', () => {
    const blankObs: ImageObservation = {
      imageId: 'blank',
      layers: [{ layer: 'literal', observations: ['a photograph'], confidence: 0.9 }],
      rawDescription: 'A photograph.',
    };
    const connections = findProcessPatterns([blankObs], emptyContext);
    expect(connections).toEqual([]);
  });

  it('context-only classification works (no visual signals, context has emerged)', () => {
    const blankObs: ImageObservation = {
      imageId: 'blank',
      layers: [{ layer: 'literal', observations: ['a photograph'], confidence: 0.9 }],
      rawDescription: 'A photograph.',
    };
    const connections = findProcessPatterns([blankObs], {
      accidents: 'The pattern emerged from the process',
    });
    // Context says emergent, visual is mixed → should produce a connection
    expect(connections.length).toBeGreaterThan(0);
  });

  it('all connections are process-pattern type', () => {
    const connections = findProcessPatterns([dayObservation], creatorContext);
    for (const c of connections) {
      expect(c.type).toBe('process-pattern');
    }
  });
});

// ============================================================================
// Synthesize (orchestrator)
// ============================================================================

describe('synthesize', () => {
  it('returns UnifiedUnderstanding with all fields', () => {
    const result = synthesize([dayObservation, nightObservation], creatorContext);
    expect(result.observations).toHaveLength(2);
    expect(result.context).toEqual(creatorContext);
    expect(result.connections.length).toBeGreaterThan(0);
    expect(result.processInsight).toBeTruthy();
  });

  it('handles single image + context', () => {
    const result = synthesize([dayObservation], creatorContext);
    expect(result.observations).toHaveLength(1);
    // Should have visual-context bridges but no cross-image links
    expect(result.connections.some(c => c.type === 'visual-context')).toBe(true);
    expect(result.connections.every(c => c.type !== 'cross-image')).toBe(true);
  });

  it('handles observations without context (context-free mode)', () => {
    const result = synthesize([dayObservation, nightObservation], emptyContext);
    expect(result.connections.length).toBeGreaterThan(0);
    // Should have cross-image and process-pattern but no visual-context
    expect(result.connections.some(c => c.type === 'cross-image')).toBe(true);
    expect(result.connections.every(c => c.type !== 'visual-context')).toBe(true);
  });

  it('gracefully handles empty observations', () => {
    const result = synthesize([], creatorContext);
    expect(result.observations).toEqual([]);
    expect(result.connections).toEqual([]);
    expect(result.processInsight).toBeUndefined();
  });

  it('connections are ranked by element count (most evidence first)', () => {
    const result = synthesize([dayObservation, nightObservation], creatorContext);
    for (let i = 1; i < result.connections.length; i++) {
      expect(result.connections[i - 1].elements.length)
        .toBeGreaterThanOrEqual(result.connections[i].elements.length);
    }
  });

  it('parameters are undefined (filled by Wave 2B)', () => {
    const result = synthesize([dayObservation], creatorContext);
    expect(result.parameters).toBeUndefined();
  });
});

// ============================================================================
// Signal Constants
// ============================================================================

describe('signal constants', () => {
  it('emergent signals are non-empty', () => {
    expect(EMERGENT_SIGNALS.length).toBeGreaterThan(0);
  });

  it('designed signals are non-empty', () => {
    expect(DESIGNED_SIGNALS.length).toBeGreaterThan(0);
  });

  it('signal lists do not overlap', () => {
    const overlap = EMERGENT_SIGNALS.filter(s =>
      (DESIGNED_SIGNALS as readonly string[]).includes(s),
    );
    expect(overlap).toEqual([]);
  });
});
