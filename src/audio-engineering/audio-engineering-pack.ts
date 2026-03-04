/**
 * Audio Engineering Educational Pack — content registry.
 *
 * Aggregates concepts from all 6 domains and provides
 * search, filtering, and lookup capabilities.
 */

import type { AudioConcept, AudioDomain, AudioEngineeringPack } from './types.js';
import {
  physicsOfSoundConcepts,
  synthesisConcepts,
  midiAndProtocolsConcepts,
  consolesAndMixingConcepts,
  productionConcepts,
  djCultureConcepts,
} from './domains/index.js';

const ALL_DOMAINS: AudioDomain[] = [
  'acoustics',
  'synthesis',
  'protocols',
  'mixing',
  'production',
  'culture',
];

const allConcepts: AudioConcept[] = [
  ...physicsOfSoundConcepts,
  ...synthesisConcepts,
  ...midiAndProtocolsConcepts,
  ...consolesAndMixingConcepts,
  ...productionConcepts,
  ...djCultureConcepts,
];

function getConcept(id: string): AudioConcept | undefined {
  return allConcepts.find((c) => c.id === id);
}

function getByDomain(domain: AudioDomain): AudioConcept[] {
  return allConcepts.filter((c) => c.domain === domain);
}

function getByChapter(chapter: number): AudioConcept[] {
  return allConcepts.filter((c) => c.chapter === chapter);
}

function search(query: string): AudioConcept[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return allConcepts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)) ||
      (c.meshMapping && c.meshMapping.toLowerCase().includes(q))
  );
}

export const audioEngineeringPack: AudioEngineeringPack = {
  name: 'audio-engineering',
  version: '1.0.0',
  domains: ALL_DOMAINS,
  concepts: allConcepts,
  getConcept,
  getByDomain,
  getByChapter,
  search,
};
