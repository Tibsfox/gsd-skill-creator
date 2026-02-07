/**
 * Discovery module barrel export.
 *
 * Re-exports all public API from the discovery module:
 * - Zod schemas for JSONL entry types and sessions-index format (types.ts)
 * - TypeScript types inferred from Zod schemas
 * - Processed result types for downstream consumers
 * - Scan state persistence with atomic writes (scan-state-store.ts)
 * - Incremental corpus scanning with watermark-based change detection (corpus-scanner.ts)
 */

export * from './types.js';
export { parseSessionFile, parseJsonlLine } from './session-parser.js';
export { enumerateSessions } from './session-enumerator.js';
export { classifyUserEntry, isRealUserPrompt } from './user-prompt-classifier.js';
export {
  ScanStateStore,
  ScanStateSchema,
  SessionWatermarkSchema,
  ScanStatsSchema,
  SCAN_STATE_VERSION,
  type ScanState,
  type SessionWatermark,
  type ScanStats,
} from './scan-state-store.js';
export { CorpusScanner } from './corpus-scanner.js';
export type { CorpusScannerOptions, SessionProcessor, ScanResult } from './corpus-scanner.js';
