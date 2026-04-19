/**
 * M3 Decision-Trace Ledger — barrel export.
 *
 * Phase 644, Wave 1 Track D (M3).
 *
 * @module traces
 */

// Schema
export {
  DecisionTraceSchema,
  toCanonical,
  fromCanonical,
  validateDecisionTrace,
} from './schema.js';

export type { ValidatedDecisionTrace, CanonicalDecisionTrace } from './schema.js';

// Writer
export {
  DEFAULT_TRACE_PATH,
  SECRET_PATTERN,
  redactString,
  redactTrace,
  writeTrace,
  writeTraces,
  TraceWriter,
} from './writer.js';

// Reader
export {
  DEFAULT_MAX_ENTRIES,
  readTraces,
  shouldRollover,
  annualRolloverPath,
  TraceReader,
} from './reader.js';

export type { TraceFilterOptions } from './reader.js';

// Precedent
export {
  DEFAULT_TOP_K,
  DEFAULT_SIMILARITY_THRESHOLD,
  tokenise,
  jaccardSimilarity,
  queryPrecedent,
  PrecedentEngine,
} from './precedent.js';

export type { PrecedentResult } from './precedent.js';

// Activation writer
export {
  writeActivationTrace,
  writeCompositionTrace,
  ActivationWriter,
} from './activation-writer.js';

export type {
  ActivationTraceOptions,
  CompositionTraceOptions,
} from './activation-writer.js';
