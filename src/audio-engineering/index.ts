/**
 * Barrel exports for the audio engineering educational pack.
 */

// Types
export { AudioDomainSchema, AudioConceptSchema } from './types.js';
export type { AudioConcept, AudioDomain, AudioEngineeringPack } from './types.js';

// Pack registry
export { audioEngineeringPack } from './audio-engineering-pack.js';

// Domain concepts
export {
  physicsOfSoundConcepts,
  synthesisConcepts,
  midiAndProtocolsConcepts,
  consolesAndMixingConcepts,
  productionConcepts,
  djCultureConcepts,
} from './domains/index.js';

// Citations
export { audioBibliography } from './citations/bibliography.js';
export type { AudioCitation } from './citations/bibliography.js';

// College enrichment
export { musicEnrichment } from './college/music-enrichment.js';
export { physicsEnrichment } from './college/physics-enrichment.js';
export type { DepartmentEnrichment } from './college/music-enrichment.js';
