import { describe, it, expect } from 'vitest';
import { MuseVocabularyEntrySchema } from './muse-vocabulary.js';

describe('muse vocabulary types', () => {
  it('validates a correct vocabulary entry', () => {
    const entry = {
      term: 'overtone-series',
      domain: 'acoustics',
      museAffinity: ['foxy', 'sam'],
    };
    expect(MuseVocabularyEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('rejects entry with empty term', () => {
    const entry = { term: '', domain: 'acoustics', museAffinity: ['foxy'] };
    expect(MuseVocabularyEntrySchema.safeParse(entry).success).toBe(false);
  });

  it('rejects entry with no muse affinity', () => {
    const entry = { term: 'test', domain: 'acoustics', museAffinity: [] };
    expect(MuseVocabularyEntrySchema.safeParse(entry).success).toBe(false);
  });

  it('rejects entry with more than 3 muse affinities', () => {
    const entry = {
      term: 'test',
      domain: 'acoustics',
      museAffinity: ['foxy', 'lex', 'sam', 'hemlock'],
    };
    expect(MuseVocabularyEntrySchema.safeParse(entry).success).toBe(false);
  });

  it('passes through unknown fields', () => {
    const entry = {
      term: 'test',
      domain: 'acoustics',
      museAffinity: ['foxy'],
      futureField: true,
    };
    const result = MuseVocabularyEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.futureField).toBe(true);
    }
  });
});
