/**
 * Gastown orchestration chipset barrel export.
 *
 * Re-exports all public types, the StateManager class, and the
 * validateChipset function as a single entry point for consumers.
 *
 * Usage:
 *   import { gastown } from './chipset/index.js';
 *   const state = new gastown.StateManager({ stateDir: '.chipset/state' });
 *   const result = gastown.validateChipset(yaml, schemaPath);
 */

export * from './types.js';
export { StateManager } from './state-manager.js';
export type { StateManagerOptions } from './state-manager.js';
export { validateChipset } from './validate-chipset.js';
export type { ValidationResult, SectionResult } from './validate-chipset.js';
export {
  createBudget,
  checkBudget,
  recordUsage,
  getBudgetReport,
  saveBudget,
  loadBudget,
  deleteBudget,
  listBudgets,
} from './token-budget.js';
export type {
  TokenUsage,
  AgentUsageRecord,
  BudgetUsage,
  TokenBudgetConfig,
  TokenBudget,
  BudgetCheckResult,
  BudgetReport,
} from './token-budget.js';
export {
  classifyLine,
  estimateTokens,
  parseTranscript,
  markRepeated,
  compactSegments,
  shouldCompact,
  getCompactionLevel,
  getDiscardCategories,
  compactTranscript,
  saveCheckpoint,
  loadCheckpoints,
  DEFAULT_COMPACTION_CONFIG,
} from './transcript-compactor.js';
export type {
  ContentCategory,
  CompactionLevel,
  CompactionThreshold,
  TranscriptSegment,
  CompactionConfig,
  CompactionDigest,
  CompactionResult,
} from './transcript-compactor.js';
export {
  buildEvent,
  serializeEvent,
  parseEventLine,
  matchesFilter,
  computeStats,
  writeEvent,
  readEvents,
  queryEvents,
  getEventStats,
  listEventLogs,
  EVENT_LOG_VERSION,
} from './event-log.js';
export type {
  EventCategory,
  EventSeverity,
  SystemEvent,
  CreateEventInput,
  EventFilter,
  EventLogStats,
} from './event-log.js';
