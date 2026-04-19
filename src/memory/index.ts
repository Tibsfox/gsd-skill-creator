/**
 * Memory — LOD-tiered memory architecture.
 *
 * Unified memory system with six storage tiers mapped to BIM-derived LOD levels.
 * The MemoryService orchestrates queries, storage, promotion, and demotion
 * across all tiers.
 *
 * @example
 * ```ts
 * import { MemoryService } from './memory';
 *
 * const memory = new MemoryService({
 *   memoryDir: '.claude/memory',
 *   indexPath: '.claude/MEMORY.md',
 *   chromaPath: '.chroma',
 * });
 *
 * // Store a memory
 * await memory.remember('User prefers lowest verbosity', 'user', 'verbosity-pref');
 *
 * // Query across all tiers
 * const results = await memory.query('user preferences', { cascade: true });
 *
 * // Get session start context
 * const { context, tokenEstimate } = await memory.getWakeUpContext();
 * ```
 *
 * @module memory
 */

export * from './types.js';
export { MemoryService } from './service.js';
export type { MemoryServiceConfig, Lod300Config } from './service.js';
export { RamCache, ramCache } from './ram-cache.js';
export { IndexManager } from './index-manager.js';
export { FileStore } from './file-store.js';
export { ArenaFileStore } from './arena-file-store.js';
export type { ArenaFileStoreOptions } from './arena-file-store.js';
export {
  ContentAddressedStore, canonicalizeHash, sha256, sha256Hex,
} from './content-addressed-store.js';
export type {
  ContentAddressedStoreOptions, PutResult,
} from './content-addressed-store.js';
export {
  TAG, HASH_ALGO, GROVE_VERSION,
  encode, decode, v,
  encodeRecord, decodeRecord, buildRecord,
  hashBytes, hashRecord, hashRefToHex, hashRefFromHex, hashRefEquals,
  BOOTSTRAP_TYPE_HASH, BOOTSTRAP_PROVENANCE,
  TYPE_RECORD_HASH, NAMESPACE_TYPE_HASH, SIGNATURE_TYPE_HASH,
  buildTypeRecordBootstrap, buildNamespaceRecordBootstrap, buildSignatureRecordBootstrap,
  typeRecordPayload,
} from './grove-format.js';
export type {
  CanonicalValue, HashRef, GroveRecord, Provenance, FieldDef,
} from './grove-format.js';
export { RustArena, RustArenaError, bytesToBase64, base64ToBytes } from './rust-arena.js';
export type {
  TierKind, ArenaStats, ChunkInfo, ArenaInitOptions, ArenaInitResult,
  CheckpointResult, InvokeFn,
} from './rust-arena.js';
export { ChromaStore } from './chroma-store.js';
export type { ChromaPreloadResult } from './chroma-store.js';
export { PgStore } from './pg-store.js';
export type { PgStoreConfig } from './pg-store.js';
export { ConversationStore } from './conversation-store.js';
export type { ConversationStoreConfig, ConversationTurn, ConversationSession, ConversationSearchResult } from './conversation-store.js';
export { hybridRerank, extractKeywords, keywordOverlap, extractQuotedPhrases, quotedPhraseBoost, extractPersonNames, personNameBoost, parseTimeOffset, temporalBoost, extractPreferences, isAssistantReference, scoreToDistance, distanceToScore } from './hybrid-scorer.js';
export type { ScoredDocument, RerankedDocument, HybridScorerConfig, TimeOffset } from './hybrid-scorer.js';

// ─── M2 Hierarchical Hybrid Memory ──────────────────────────────────────────
export { MemoryScorer, defaultScorer, recencyScore, keywordRelevance, importanceScore, tokenize as scorerTokenize } from './scorer.js';
export type { ScorerConfig, ScoreComponents } from './scorer.js';
export { ShortTermMemory } from './short-term.js';
export type { ShortTermConfig, EvictCallback, ReflectCallback } from './short-term.js';
export { LongTermMemory } from './long-term.js';
export type { LongTermConfig } from './long-term.js';
export { Reflector } from './reflection.js';
export type { ReflectionConfig, ReflectionResult } from './reflection.js';
export { ReadWriteReflect, DEFAULT_CHROMA_URL } from './read-write-reflect.js';
export type { ReadWriteReflectConfig } from './read-write-reflect.js';
