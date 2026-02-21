/**
 * VTM (Vision-to-Mission) module.
 *
 * Provides Zod-validated types for the complete VTM document hierarchy:
 * vision documents, research references, chipset configs, component specs,
 * wave execution plans, test plans, milestone specs, and mission packages.
 *
 * Also provides the vision document parser and dependency extractor for
 * converting raw markdown into typed VisionDocument objects, plus the
 * validator, quality checker, and archetype classifier for post-parse
 * document analysis.
 *
 * @module vtm
 */
export * from './types.js';
export * from './vision-parser.js';
export * from './vision-validator.js';
