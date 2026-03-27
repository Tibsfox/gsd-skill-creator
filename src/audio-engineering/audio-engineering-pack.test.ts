import { describe, it, expect } from 'vitest';
import { audioEngineeringPack } from './audio-engineering-pack.js';
import { audioBibliography } from './citations/bibliography.js';
import { musicEnrichment } from './college/music-enrichment.js';
import { physicsEnrichment } from './college/physics-enrichment.js';
import type { AudioDomain } from './types.js';

describe('AudioEngineeringPack', () => {
  it('exports at least 30 concepts', () => {
    expect(audioEngineeringPack.concepts.length).toBeGreaterThanOrEqual(30);
  });

  it('covers all 6 domains', () => {
    const domains = new Set(audioEngineeringPack.concepts.map((c) => c.domain));
    expect(domains.size).toBe(6);
    for (const d of ['acoustics', 'synthesis', 'protocols', 'mixing', 'production', 'culture'] as AudioDomain[]) {
      expect(domains.has(d)).toBe(true);
    }
  });

  it('each domain has at least 3 concepts', () => {
    for (const d of audioEngineeringPack.domains) {
      const count = audioEngineeringPack.getByDomain(d).length;
      expect(count, `domain ${d} has ${count} concepts`).toBeGreaterThanOrEqual(3);
    }
  });

  it('getConcept returns correct concept by ID', () => {
    const concept = audioEngineeringPack.getConcept('overtone-series');
    expect(concept).toBeDefined();
    expect(concept!.name).toBe('Overtone Series');
    expect(concept!.domain).toBe('acoustics');
  });

  it('getConcept returns undefined for unknown ID', () => {
    expect(audioEngineeringPack.getConcept('nonexistent')).toBeUndefined();
  });

  it('getByDomain filters correctly', () => {
    const synth = audioEngineeringPack.getByDomain('synthesis');
    expect(synth.length).toBeGreaterThan(0);
    expect(synth.every((c) => c.domain === 'synthesis')).toBe(true);
  });

  it('getByChapter maps chapters to concepts', () => {
    const ch1 = audioEngineeringPack.getByChapter(1);
    expect(ch1.length).toBeGreaterThan(0);
    expect(ch1.every((c) => c.chapter === 1)).toBe(true);
  });

  it('search finds concepts by keyword', () => {
    const results = audioEngineeringPack.search('harmonics');
    expect(results.length).toBeGreaterThan(0);
  });

  it('search returns empty for empty query', () => {
    expect(audioEngineeringPack.search('')).toEqual([]);
  });

  it('search finds by mesh mapping terms', () => {
    const results = audioEngineeringPack.search('chipset');
    expect(results.length).toBeGreaterThan(0);
  });

  it('every concept has non-empty summary', () => {
    for (const c of audioEngineeringPack.concepts) {
      expect(c.summary.length, `concept ${c.id} has empty summary`).toBeGreaterThan(0);
    }
  });

  it('every concept has at least 2 keywords', () => {
    for (const c of audioEngineeringPack.concepts) {
      expect(c.keywords.length, `concept ${c.id} has ${c.keywords.length} keywords`).toBeGreaterThanOrEqual(2);
    }
  });

  it('at least 20 concepts have meshMapping', () => {
    const withMapping = audioEngineeringPack.concepts.filter((c) => c.meshMapping);
    expect(withMapping.length).toBeGreaterThanOrEqual(20);
  });

  it('all concept IDs are unique', () => {
    const ids = audioEngineeringPack.concepts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('AudioBibliography', () => {
  it('has at least 30 citations', () => {
    expect(audioBibliography.length).toBeGreaterThanOrEqual(30);
  });

  it('every citation has author, title, year, source', () => {
    for (const c of audioBibliography) {
      expect(c.author.length, `citation ${c.id} missing author`).toBeGreaterThan(0);
      expect(c.title.length, `citation ${c.id} missing title`).toBeGreaterThan(0);
      expect(c.year, `citation ${c.id} missing year`).toBeGreaterThan(0);
      expect(c.source.length, `citation ${c.id} missing source`).toBeGreaterThan(0);
    }
  });

  it('all citation IDs are unique', () => {
    const ids = audioBibliography.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('College Enrichment', () => {
  it('music enrichment adds Audio Production wing', () => {
    expect(musicEnrichment.department).toBe('music');
    expect(musicEnrichment.wing).toBe('Audio Production & Engineering');
    expect(musicEnrichment.concepts.length).toBeGreaterThan(0);
  });

  it('music enrichment has try sessions', () => {
    expect(musicEnrichment.trySessions.length).toBeGreaterThanOrEqual(1);
    expect(musicEnrichment.trySessions[0].name).toBe('Your First Oscillator');
  });

  it('music enrichment cross-references physics', () => {
    const physRef = musicEnrichment.crossReferences.find((r) => r.department === 'physics');
    expect(physRef).toBeDefined();
  });

  it('physics enrichment adds Acoustics wing', () => {
    expect(physicsEnrichment.department).toBe('physics');
    expect(physicsEnrichment.wing).toBe('Acoustics & Wave Physics');
    expect(physicsEnrichment.concepts.length).toBeGreaterThan(0);
  });

  it('physics enrichment cross-references music', () => {
    const musicRef = physicsEnrichment.crossReferences.find((r) => r.department === 'music');
    expect(musicRef).toBeDefined();
  });
});
