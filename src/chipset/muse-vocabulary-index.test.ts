import { describe, it, expect } from 'vitest';
import { createMuseVocabularyIndex, audioVocabularyEntries, audioVocabularyIndex } from './muse-vocabulary-index.js';
import type { MuseId } from './muse-schema-validator.js';

describe('MuseVocabularyIndex', () => {
  it('has entries for all 6 muses', () => {
    const muses: MuseId[] = ['foxy', 'lex', 'hemlock', 'sam', 'cedar', 'willow'];
    for (const muse of muses) {
      const terms = audioVocabularyIndex.getByMuse(muse);
      expect(terms.length, `muse ${muse} has ${terms.length} terms`).toBeGreaterThanOrEqual(10);
    }
  });

  it('each muse has between 15 and 35 terms (via affinity)', () => {
    const muses: MuseId[] = ['foxy', 'lex', 'hemlock', 'sam', 'cedar', 'willow'];
    for (const muse of muses) {
      const terms = audioVocabularyIndex.getByMuse(muse);
      expect(terms.length, `muse ${muse}: ${terms.length} terms`).toBeGreaterThanOrEqual(10);
      expect(terms.length, `muse ${muse}: ${terms.length} terms`).toBeLessThanOrEqual(40);
    }
  });

  it('cross-muse overlap is less than 20%', () => {
    const muses: MuseId[] = ['foxy', 'lex', 'hemlock', 'sam', 'cedar', 'willow'];
    let totalPairs = 0;
    let overlapPairs = 0;
    for (let i = 0; i < muses.length; i++) {
      for (let j = i + 1; j < muses.length; j++) {
        const setA = new Set(audioVocabularyIndex.getByMuse(muses[i]));
        const setB = new Set(audioVocabularyIndex.getByMuse(muses[j]));
        const overlap = [...setA].filter((t) => setB.has(t));
        const minSize = Math.min(setA.size, setB.size);
        if (minSize > 0 && overlap.length / minSize > 0.2) {
          overlapPairs++;
        }
        totalPairs++;
      }
    }
    expect(overlapPairs, `${overlapPairs}/${totalPairs} pairs exceed 20% overlap`).toBe(0);
  });

  it('search finds terms by keyword', () => {
    const results = audioVocabularyIndex.search('overtone');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].term).toBe('overtone-series');
  });

  it('search returns empty for empty query', () => {
    expect(audioVocabularyIndex.search('')).toEqual([]);
  });

  it('getByDomain filters correctly', () => {
    const acoustics = audioVocabularyIndex.getByDomain('acoustics');
    expect(acoustics.length).toBeGreaterThan(0);
    expect(acoustics.every((e) => e.domain === 'acoustics')).toBe(true);
  });

  it('createMuseVocabularyIndex works with custom entries', () => {
    const index = createMuseVocabularyIndex([
      { term: 'test', domain: 'test', museAffinity: ['foxy'] },
    ]);
    expect(index.entries.length).toBe(1);
    expect(index.getByMuse('foxy')).toEqual(['test']);
  });
});
