import { describe, it, expect } from 'vitest';
import { AudioDomainSchema, AudioConceptSchema } from './types.js';

describe('audio engineering types', () => {
  const validConcept = {
    id: 'overtone-series',
    name: 'Overtone Series',
    domain: 'acoustics' as const,
    chapter: 1,
    summary: 'Natural harmonic frequencies above a fundamental tone',
    meshMapping: 'thresholds.json = timbre map',
    relatedConcepts: ['standing-waves', 'resonance'],
    keywords: ['harmonics', 'partials', 'fundamental'],
  };

  it('validates all 6 audio domains', () => {
    for (const domain of ['acoustics', 'synthesis', 'protocols', 'mixing', 'production', 'culture']) {
      expect(AudioDomainSchema.safeParse(domain).success).toBe(true);
    }
  });

  it('rejects unknown domains', () => {
    expect(AudioDomainSchema.safeParse('unknown').success).toBe(false);
  });

  it('validates a correct AudioConcept', () => {
    expect(AudioConceptSchema.safeParse(validConcept).success).toBe(true);
  });

  it('rejects concept with empty summary', () => {
    expect(AudioConceptSchema.safeParse({ ...validConcept, summary: '' }).success).toBe(false);
  });

  it('rejects concept with less than 2 keywords', () => {
    expect(AudioConceptSchema.safeParse({ ...validConcept, keywords: ['one'] }).success).toBe(false);
  });

  it('rejects chapter out of range', () => {
    expect(AudioConceptSchema.safeParse({ ...validConcept, chapter: 0 }).success).toBe(false);
    expect(AudioConceptSchema.safeParse({ ...validConcept, chapter: 28 }).success).toBe(false);
  });

  it('accepts concept with optional complexPlanePosition', () => {
    const withPosition = {
      ...validConcept,
      complexPlanePosition: { angle: Math.PI / 4, magnitude: 0.5 },
    };
    expect(AudioConceptSchema.safeParse(withPosition).success).toBe(true);
  });

  it('accepts concept without meshMapping', () => {
    const { meshMapping: _, ...noMapping } = validConcept;
    expect(AudioConceptSchema.safeParse(noMapping).success).toBe(true);
  });
});
