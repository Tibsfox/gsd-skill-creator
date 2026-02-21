/**
 * VTM (Vision-to-Mission) module.
 *
 * Provides Zod-validated types for the complete VTM document hierarchy:
 * vision documents, research references, chipset configs, component specs,
 * wave execution plans, test plans, milestone specs, and mission packages.
 *
 * Also provides the vision document parser and dependency extractor for
 * converting raw markdown into typed VisionDocument objects, the
 * validator, quality checker, and archetype classifier for post-parse
 * document analysis, the research compiler for transforming vision
 * documents into structured research references, research utilities
 * for knowledge chunking, safety extraction, and necessity detection,
 * the mission assembly generators for milestone specs and component specs,
 * the mission package assembler for top-level orchestration, the wave
 * planner for dependency-ordered wave decomposition with parallel tracks,
 * and the wave analysis functions for dependency graphs, savings
 * calculation, and risk factor identification.
 *
 * @module vtm
 */
export * from './types.js';
export * from './vision-parser.js';
export * from './vision-validator.js';
export * from './research-compiler.js';
export * from './research-utils.js';
export * from './mission-assembly.js';
export * from './mission-assembler.js';
export * from './wave-planner.js';
export * from './wave-analysis.js';
