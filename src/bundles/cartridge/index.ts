/**
 * Barrel exports for the legacy content-cartridge packaging format.
 *
 * @deprecated Import the unified Cartridge/Chipset schema from `src/cartridge/`
 * instead. This legacy location remains operational for existing consumers and
 * is bridged by `src/cartridge/legacy-adapter.ts`. New code should not import
 * from `src/bundles/cartridge/`.
 */

// Types and schemas
export {
  /** @deprecated Use `CartridgeSchema` from `src/cartridge/`. */
  CartridgeSchema,
  /** @deprecated Use the unified schema in `src/cartridge/` with a `content` chipset. */
  CartridgeBundleSchema,
  /** @deprecated Import from `src/cartridge/` (re-exports remain). */
  DeepMapSchema,
  /** @deprecated Import from `src/cartridge/` (re-exports remain). */
  StoryArcSchema,
  /** @deprecated Use `VoiceChipsetSchema` from `src/cartridge/`. */
  CartridgeChipsetSchema,
  /** @deprecated Import from `src/cartridge/`. */
  ConceptNodeSchema,
  /** @deprecated Import from `src/cartridge/`. */
  ConceptConnectionSchema,
  /** @deprecated Import from `src/cartridge/`. */
  ProgressionPathSchema,
  /** @deprecated Import from `src/cartridge/`. */
  StoryChapterSchema,
  /** @deprecated Import `CartridgeTrustSchema` from `src/cartridge/`. */
  CartridgeTrustSchema,
} from './types.js';
export type {
  /** @deprecated Use `Cartridge` from `src/cartridge/`. */
  Cartridge,
  /** @deprecated Use the unified cartridge format from `src/cartridge/`. */
  CartridgeBundle,
  DeepMap,
  StoryArc,
  /** @deprecated Use `VoiceChipset` from `src/cartridge/`. */
  CartridgeChipset,
  ConceptNode,
  ConceptConnection,
  ProgressionPath,
  StoryChapter,
  CartridgeTrust,
  CartridgeValidation,
} from './types.js';

// Validator
export { validateCartridge } from './cartridge-validator.js';

// Packer / Unpacker
export { CartridgePacker } from './cartridge-packer.js';
export { CartridgeUnpacker } from './cartridge-unpacker.js';

// Registry
export { CartridgeRegistry } from './cartridge-registry.js';
