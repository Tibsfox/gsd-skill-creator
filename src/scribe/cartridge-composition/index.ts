/**
 * Cartridge composition + citation merger entrypoint.
 *
 * Component 01 (Wave 1) of the SCRIBE Build-Out mission v1.49.621.
 * Composes the 5 SCRIBE track cartridges into one foundational chipset
 * (CAP-044) and merges per-track citation indexes into a deduplicated
 * unified `CITATIONS.json` (CAP-043).
 *
 * @module scribe/cartridge-composition
 */

export { composeFoundationalChipset } from './compose-chipset.js';
export type { ComposeChipsetInput, ComposeChipsetResult } from './compose-chipset.js';

export {
  mergeCitations,
  primaryKeyFor,
  TRACK_CITATIONS,
} from './merge-citations.js';
export type {
  RawCitation,
  MergeCitationsInput,
} from './merge-citations.js';

export {
  canonicalIdForUnifiedCitation,
  recordScribeSources,
} from './record-scribe-sources.js';
