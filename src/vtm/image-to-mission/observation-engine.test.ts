import { describe, it, expect } from 'vitest';
import { observe, observeLiteral, analyzeSpatial, mapRelational, extractMood, OBSERVATION_PROTOCOL } from './observation-engine.js';
import type { ImageInput } from './types.js';

const dayImage: ImageInput = {
  id: 'mandala-daylight',
  source: 'upload',
  data: 'test-data',
  metadata: { width: 4032, height: 3024, format: 'jpeg' },
};

const nightImage: ImageInput = {
  id: 'mandala-night',
  source: 'upload',
  data: 'test-data-night',
};

describe('OBSERVATION_PROTOCOL', () => {
  it('defines all four layers', () => {
    expect(Object.keys(OBSERVATION_PROTOCOL)).toEqual(['literal', 'spatial', 'relational', 'mood']);
  });

  it('each layer has description, focus, and confidence', () => {
    for (const layer of Object.values(OBSERVATION_PROTOCOL)) {
      expect(layer.description).toBeTruthy();
      expect(layer.focus.length).toBeGreaterThan(0);
      expect(layer.confidence.typical).toHaveLength(2);
    }
  });
});

describe('observeLiteral', () => {
  it('returns literal layer type', () => {
    const result = observeLiteral(dayImage);
    expect(result.layer).toBe('literal');
  });
});

describe('analyzeSpatial', () => {
  it('returns spatial layer type', () => {
    const literal = observeLiteral(dayImage);
    const result = analyzeSpatial(dayImage, literal);
    expect(result.layer).toBe('spatial');
  });
});

describe('mapRelational', () => {
  it('returns relational layer type', () => {
    const result = mapRelational([dayImage], [observeLiteral(dayImage)], []);
    expect(result.layer).toBe('relational');
  });
});

describe('extractMood', () => {
  it('returns mood layer type', () => {
    const result = extractMood([dayImage], []);
    expect(result.layer).toBe('mood');
  });
});

describe('observe', () => {
  it('returns empty array for empty input', () => {
    expect(observe([])).toEqual([]);
  });

  it('returns one observation per image', () => {
    const result = observe([dayImage, nightImage]);
    expect(result).toHaveLength(2);
    expect(result[0].imageId).toBe('mandala-daylight');
    expect(result[1].imageId).toBe('mandala-night');
  });

  it('each observation has four layers', () => {
    const result = observe([dayImage]);
    expect(result[0].layers).toHaveLength(4);
    expect(result[0].layers.map(l => l.layer)).toEqual(['literal', 'spatial', 'relational', 'mood']);
  });

  it('produces rawDescription string', () => {
    const result = observe([dayImage]);
    expect(typeof result[0].rawDescription).toBe('string');
  });
});
