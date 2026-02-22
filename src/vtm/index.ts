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
 * the wave analysis functions for dependency graphs, savings
 * calculation, and risk factor identification, and the model assignment
 * classifier with data-driven signal registry and weighted scoring, and
 * the budget validator with auto-rebalance for 60/40 principle enforcement,
 * and the cache optimization analyzers for shared load detection, schema
 * reuse analysis, knowledge tier sizing, TTL validation at every wave
 * boundary, token savings estimation with per-category breakdowns, and
 * the CacheReport aggregate composing all analyzers into a single report,
 * and the test plan generator for converting vision success criteria into
 * categorized test plans with safety-critical classification, keyword
 * heuristics, bidirectional overrides, and S/C/I/E-NNN test ID generation,
 * and the template system for loading, rendering, registering, and
 * validating mustache-style markdown templates with Zod schema validation
 * and structured diagnostics.
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
export * from './model-assignment.js';
export * from './model-budget.js';
export * from './cache-optimizer.js';
export * from './test-plan-generator.js';
export * from './template-system.js';
