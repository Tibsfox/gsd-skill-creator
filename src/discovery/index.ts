/**
 * Discovery module barrel export.
 *
 * Re-exports all public API from the discovery module:
 * - Zod schemas for JSONL entry types and sessions-index format (types.ts)
 * - TypeScript types inferred from Zod schemas
 * - Processed result types for downstream consumers
 *
 * This file will grow as session-parser.ts, session-enumerator.ts,
 * and user-prompt-classifier.ts are added in Plans 02-04.
 */

export * from './types.js';
