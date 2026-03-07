import { describe, it, expect } from 'vitest';
import {
  parseFreeform,
  mapToLayers,
  extractProcessInsight,
  integrate,
  LAYER_MAPPINGS,
  CONTEXT_PROMPTS,
} from './context-integrator.js';
import type { CreatorContext } from './types.js';

const fullContext: CreatorContext = {
  process: 'Stones placed along the walking path during speaker phase alignment',
  intent: 'Mark the acoustic sweet spot path through the forest campsite',
  constraints: 'Only river stones available, tarp as base surface',
  accidents: 'The mandala pattern emerged from the acoustic geometry — not designed',
  multipurpose: 'Cairns mark the path AND catch projector light AND cast colored shadows',
};

describe('LAYER_MAPPINGS', () => {
  it('maps process to spatial and relational', () => {
    expect(LAYER_MAPPINGS.process).toEqual(['spatial', 'relational']);
  });

  it('maps multipurpose to all layers', () => {
    expect(LAYER_MAPPINGS.multipurpose).toHaveLength(4);
  });
});

describe('CONTEXT_PROMPTS', () => {
  it('has 5 prompt templates', () => {
    expect(Object.keys(CONTEXT_PROMPTS)).toHaveLength(5);
  });

  it('all prompts are non-empty strings', () => {
    for (const prompt of Object.values(CONTEXT_PROMPTS)) {
      expect(prompt.length).toBeGreaterThan(0);
    }
  });
});

describe('parseFreeform', () => {
  it('classifies process verbs', () => {
    const result = parseFreeform('I built the cairns over three hours. I placed stones along the path.');
    expect(result.process).toBeTruthy();
  });

  it('classifies accidents', () => {
    const result = parseFreeform('I discovered the mandala pattern had emerged from the walking path.');
    expect(result.accidents).toBeTruthy();
  });

  it('classifies multipurpose', () => {
    const result = parseFreeform('The cairns serve both as path markers AND as projection surfaces.');
    expect(result.multipurpose).toBeTruthy();
  });

  it('returns empty context for empty input', () => {
    expect(parseFreeform('')).toEqual({});
    expect(parseFreeform('   ')).toEqual({});
  });

  it('puts unclassified sentences in freeform', () => {
    const result = parseFreeform('The forest was quiet. Birds sang overhead.');
    expect(result.freeform).toBeTruthy();
  });
});

describe('mapToLayers', () => {
  it('maps full context to all layers', () => {
    const mapping = mapToLayers(fullContext);
    expect(mapping.literal.length).toBeGreaterThan(0);
    expect(mapping.spatial.length).toBeGreaterThan(0);
    expect(mapping.relational.length).toBeGreaterThan(0);
    expect(mapping.mood.length).toBeGreaterThan(0);
  });

  it('returns empty arrays for empty context', () => {
    const mapping = mapToLayers({});
    expect(mapping.literal).toEqual([]);
    expect(mapping.spatial).toEqual([]);
  });

  it('process maps to spatial and relational', () => {
    const mapping = mapToLayers({ process: 'Built by hand' });
    expect(mapping.spatial).toContain('process');
    expect(mapping.relational).toContain('process');
  });
});

describe('extractProcessInsight', () => {
  it('extracts insight from full context', () => {
    const insight = extractProcessInsight(fullContext);
    expect(insight).toBeTruthy();
    expect(typeof insight).toBe('string');
  });

  it('returns null for empty context', () => {
    expect(extractProcessInsight({})).toBeNull();
  });

  it('returns null when no process fields present', () => {
    expect(extractProcessInsight({ intent: 'Just the goal', freeform: 'stuff' })).toBeNull();
  });

  it('prioritizes richest source', () => {
    const insight = extractProcessInsight({
      process: 'Short.',
      accidents: 'The mandala pattern emerged from the acoustic geometry — a much longer and richer insight.',
    });
    expect(insight!.length).toBeGreaterThan(10);
  });
});

describe('integrate', () => {
  it('integrates structured context', () => {
    const result = integrate(fullContext);
    expect(result.context).toEqual(fullContext);
    expect(result.processInsight).toBeTruthy();
    expect(Object.keys(result.layerMappings)).toHaveLength(4);
  });

  it('integrates freeform text', () => {
    const result = integrate('I built the cairns along the path. The pattern emerged unexpectedly.');
    expect(result.context.process).toBeTruthy();
    expect(result.context.accidents).toBeTruthy();
  });

  it('handles empty input gracefully', () => {
    const result = integrate({});
    expect(result.context).toEqual({});
    expect(result.processInsight).toBeNull();
  });
});
