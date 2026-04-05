/**
 * Transcript Compactor for Gastown Convoy Execution.
 *
 * Implements convoy-level summarization checkpoints that compress completed
 * work items into bounded digests while preserving instructions, decisions,
 * and current state. Designed for long-running convoys where intermediate
 * verbose output is no longer needed.
 *
 * Identified by the 12 Primitives analysis (Primitive 10) as a gap in our
 * context management strategy. Maps to beads-state, session handoff pattern,
 * and context-packet patterns.
 *
 * State directory layout:
 *   {stateDir}/compactions/{convoyId}/{checkpoint}-{timestamp}.json
 *
 * Key design decisions:
 * - Pure summarization functions (no IO) for testability
 * - Atomic checkpoint persistence via state-manager pattern
 * - Preserves: instructions, decisions, errors, current state
 * - Discards: verbose tool output, intermediate reasoning, repeated content
 * - Token-budget-aware: compaction triggers when usage exceeds threshold
 */

import { mkdir, readFile, readdir, open, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';

// ============================================================================
// Types
// ============================================================================

/** Category of transcript content for compaction decisions. */
export type ContentCategory =
  | 'instruction'   // System prompts, task descriptions, user directives
  | 'decision'      // Choices made during execution with rationale
  | 'result'        // Final outcomes of completed work items
  | 'error'         // Errors, failures, and recovery attempts
  | 'intermediate'  // Verbose tool output, reasoning chains, exploration
  | 'repeated'      // Content that appears multiple times
  | 'state';        // Current state snapshots, progress markers

/** A classified segment of transcript text. */
export interface TranscriptSegment {
  /** Content category for compaction decisions. */
  category: ContentCategory;
  /** The text content. */
  text: string;
  /** Source identifier (agent ID, tool name, etc.). */
  source: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Approximate token count (words * 1.3). */
  tokenEstimate: number;
}

/**
 * Compaction level determines aggressiveness.
 * Research (Chroma, token-optimizer) shows context rot starts at ~25% fill.
 * Progressive ladder: snapshot → light → moderate → full.
 */
export type CompactionLevel = 'snapshot' | 'light' | 'moderate' | 'full';

/** Progressive compaction threshold. */
export interface CompactionThreshold {
  /** Budget usage percentage that triggers this level. */
  percent: number;
  /** Compaction level at this threshold. */
  level: CompactionLevel;
}

/** Configuration for the compaction algorithm. */
export interface CompactionConfig {
  /** Maximum tokens in a compacted digest. Default: 4000. */
  maxDigestTokens: number;
  /**
   * Progressive compaction thresholds. Default: 20/35/50/60.
   * Research shows context quality degrades starting at 25% fill,
   * not at 100%. Earlier lightweight checkpoints preserve quality.
   */
  progressiveThresholds: CompactionThreshold[];
  /** Legacy single threshold (used if progressiveThresholds is empty). */
  triggerThresholdPercent: number;
  /** Categories to always preserve in full. */
  preserveCategories: ContentCategory[];
  /** Categories to always discard. */
  discardCategories: ContentCategory[];
  /** Maximum preserved segments per work item summary. Default: 5. */
  maxSegmentsPerItem: number;
}

/** A compacted summary of completed work items. */
export interface CompactionDigest {
  /** Unique checkpoint identifier. */
  checkpointId: string;
  /** Convoy this compaction belongs to. */
  convoyId: string;
  /** Number of work items summarized. */
  itemsCompacted: number;
  /** Original token count before compaction. */
  originalTokens: number;
  /** Token count after compaction. */
  compactedTokens: number;
  /** Compression ratio (0-1, lower = more compression). */
  compressionRatio: number;
  /** The compacted text digest. */
  digest: string;
  /** Preserved decision records. */
  decisions: string[];
  /** Preserved error records. */
  errors: string[];
  /** Current state snapshot at compaction time. */
  currentState: string;
  /** ISO 8601 timestamp of compaction. */
  createdAt: string;
}

/** Result of a compaction operation. */
export interface CompactionResult {
  /** Whether compaction was performed. */
  compacted: boolean;
  /** Reason if not compacted. */
  reason?: string;
  /** The digest if compaction was performed. */
  digest?: CompactionDigest;
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  maxDigestTokens: 4000,
  progressiveThresholds: [
    { percent: 20, level: 'snapshot' },   // State-only checkpoint, minimal cost
    { percent: 35, level: 'light' },      // Discard repeated, keep everything else
    { percent: 50, level: 'moderate' },   // Discard intermediate + repeated
    { percent: 60, level: 'full' },       // Full compaction (original behavior)
  ],
  triggerThresholdPercent: 60, // Legacy fallback
  preserveCategories: ['instruction', 'decision', 'error', 'state'],
  discardCategories: ['intermediate', 'repeated'],
  maxSegmentsPerItem: 5,
};

// ============================================================================
// Pure Functions — Segment Classification
// ============================================================================

/** Patterns that identify instruction content. */
const INSTRUCTION_PATTERNS = [
  /^(?:TASK|INSTRUCTION|OBJECTIVE|GOAL|REQUIREMENT):/i,
  /^You (?:must|should|need to|will)/i,
  /^(?:Phase|Wave|Step) \d+/i,
];

/** Patterns that identify decision content. */
const DECISION_PATTERNS = [
  /^DECISION:/i,
  /chose|decided|selected|picked|went with/i,
  /rationale|because|since|given that/i,
];

/** Patterns that identify error content. */
const ERROR_PATTERNS = [
  /^(?:ERROR|FAIL|FAILURE|BLOCKED|CRITICAL):/i,
  /(?:error|exception|failed|crash|timeout)/i,
  /stack trace|traceback/i,
];

/** Patterns that identify result/outcome content. */
const RESULT_PATTERNS = [
  /^(?:RESULT|OUTPUT|COMPLETE|DONE|PASS|CREATED|MERGED):/i,
  /tests? pass/i,
  /successfully|completed|finished/i,
];

/** Patterns that identify state content. */
const STATE_PATTERNS = [
  /^(?:STATE|STATUS|PROGRESS|CHECKPOINT):/i,
  /current(?:ly)?|now at|as of/i,
];

/**
 * Classify a line of transcript text into a content category.
 * Pure function — no IO.
 */
export function classifyLine(line: string): ContentCategory {
  const trimmed = line.trim();
  if (!trimmed) return 'intermediate';

  for (const p of INSTRUCTION_PATTERNS) {
    if (p.test(trimmed)) return 'instruction';
  }
  for (const p of DECISION_PATTERNS) {
    if (p.test(trimmed)) return 'decision';
  }
  for (const p of ERROR_PATTERNS) {
    if (p.test(trimmed)) return 'error';
  }
  for (const p of RESULT_PATTERNS) {
    if (p.test(trimmed)) return 'result';
  }
  for (const p of STATE_PATTERNS) {
    if (p.test(trimmed)) return 'state';
  }
  return 'intermediate';
}

/**
 * Estimate token count from text.
 * Uses word count * 1.3 as a reasonable approximation.
 * Pure function — no IO.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

/**
 * Parse raw transcript text into classified segments.
 * Groups consecutive lines of the same category.
 * Pure function — no IO.
 */
export function parseTranscript(
  text: string,
  source: string,
  timestamp: string,
): TranscriptSegment[] {
  if (!text) return [];

  const lines = text.split('\n');
  const segments: TranscriptSegment[] = [];
  let currentCategory: ContentCategory | null = null;
  let currentLines: string[] = [];

  function flush(): void {
    if (currentCategory && currentLines.length > 0) {
      const segText = currentLines.join('\n');
      segments.push({
        category: currentCategory,
        text: segText,
        source,
        timestamp,
        tokenEstimate: estimateTokens(segText),
      });
    }
    currentLines = [];
  }

  for (const line of lines) {
    const cat = classifyLine(line);
    if (cat !== currentCategory) {
      flush();
      currentCategory = cat;
    }
    currentLines.push(line);
  }
  flush();

  return segments;
}

/**
 * Detect repeated content across segments.
 * Marks segments as 'repeated' if their normalized text appears more than once.
 * Pure function — no IO.
 */
export function markRepeated(segments: TranscriptSegment[]): TranscriptSegment[] {
  const seen = new Map<string, number>();

  // Count normalized occurrences
  for (const seg of segments) {
    const key = seg.text.trim().toLowerCase().slice(0, 200);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  // Mark duplicates (keep the first occurrence)
  const firstSeen = new Set<string>();
  return segments.map((seg) => {
    const key = seg.text.trim().toLowerCase().slice(0, 200);
    const count = seen.get(key) ?? 0;
    if (count > 1 && firstSeen.has(key)) {
      return { ...seg, category: 'repeated' };
    }
    firstSeen.add(key);
    return seg;
  });
}

// ============================================================================
// Pure Functions — Compaction
// ============================================================================

/**
 * Compact transcript segments into a bounded digest.
 *
 * Algorithm:
 * 1. Preserve all segments in preserveCategories
 * 2. Discard all segments in discardCategories
 * 3. For remaining categories (result), include up to maxSegmentsPerItem
 * 4. Truncate if total exceeds maxDigestTokens
 *
 * Pure function — no IO.
 */
export function compactSegments(
  segments: TranscriptSegment[],
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): { digest: string; decisions: string[]; errors: string[]; originalTokens: number; compactedTokens: number } {
  const originalTokens = segments.reduce((sum, s) => sum + s.tokenEstimate, 0);

  // Partition segments
  const preserved: TranscriptSegment[] = [];
  const results: TranscriptSegment[] = [];
  const decisions: string[] = [];
  const errors: string[] = [];

  for (const seg of segments) {
    if (config.discardCategories.includes(seg.category)) continue;
    if (config.preserveCategories.includes(seg.category)) {
      preserved.push(seg);
      if (seg.category === 'decision') decisions.push(seg.text);
      if (seg.category === 'error') errors.push(seg.text);
    } else {
      results.push(seg);
    }
  }

  // Take up to maxSegmentsPerItem from results
  const keptResults = results.slice(0, config.maxSegmentsPerItem);

  // Build digest
  const allKept = [...preserved, ...keptResults];
  let digestParts: string[] = [];
  let tokenCount = 0;

  for (const seg of allKept) {
    if (tokenCount + seg.tokenEstimate > config.maxDigestTokens) {
      // Truncate this segment to fit
      const remaining = config.maxDigestTokens - tokenCount;
      if (remaining > 50) {
        const words = seg.text.split(/\s+/);
        const truncWords = Math.floor(remaining / 1.3);
        digestParts.push(words.slice(0, truncWords).join(' ') + ' [truncated]');
      }
      break;
    }
    digestParts.push(seg.text);
    tokenCount += seg.tokenEstimate;
  }

  const digest = digestParts.join('\n\n');
  const compactedTokens = estimateTokens(digest);

  return { digest, decisions, errors, originalTokens, compactedTokens };
}

/**
 * Determine the compaction level that should be applied.
 *
 * Progressive ladder based on research showing context rot starts at ~25%:
 * - 20%: snapshot (state-only checkpoint, near-zero cost)
 * - 35%: light (discard repeated content only)
 * - 50%: moderate (discard intermediate + repeated)
 * - 60%: full (original behavior — aggressive compaction)
 *
 * Returns null if no compaction needed.
 * Pure function — no IO.
 */
export function getCompactionLevel(
  transcriptTokens: number,
  budgetUsedPercent: number,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): CompactionLevel | null {
  // Hard transcript size trigger always gets full compaction
  if (transcriptTokens > 10_000) return 'full';

  // Check progressive thresholds (sorted descending to find highest matching)
  const thresholds = [...config.progressiveThresholds].sort((a, b) => b.percent - a.percent);
  for (const threshold of thresholds) {
    if (budgetUsedPercent >= threshold.percent) {
      return threshold.level;
    }
  }

  // Legacy fallback
  if (budgetUsedPercent >= config.triggerThresholdPercent) return 'full';

  return null;
}

/**
 * Determine whether compaction should be triggered.
 * Wrapper around getCompactionLevel for backward compatibility.
 * Pure function — no IO.
 */
export function shouldCompact(
  transcriptTokens: number,
  budgetUsedPercent: number,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): boolean {
  return getCompactionLevel(transcriptTokens, budgetUsedPercent, config) !== null;
}

/**
 * Get the discard categories for a given compaction level.
 * Lower levels discard less aggressively.
 * Pure function — no IO.
 */
export function getDiscardCategories(level: CompactionLevel): ContentCategory[] {
  switch (level) {
    case 'snapshot': return [];                           // Keep everything, just checkpoint state
    case 'light': return ['repeated'];                    // Only remove duplicates
    case 'moderate': return ['intermediate', 'repeated']; // Remove verbose + duplicates
    case 'full': return ['intermediate', 'repeated'];     // Same as moderate (config can override)
  }
}

// ============================================================================
// Persistence — Checkpoint I/O
// ============================================================================

/**
 * Serialize data to JSON with sorted keys for git-friendly output.
 */
function serializeSorted(data: unknown): string {
  return JSON.stringify(data, (_key: string, value: unknown) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  }, 2) + '\n';
}

/**
 * Atomic write: write to temp file, fsync, then rename.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmpPath = filePath + '.tmp';
  const fd = await open(tmpPath, 'w');
  try {
    await fd.writeFile(content);
    await fd.datasync();
  } finally {
    await fd.close();
  }
  await rename(tmpPath, filePath);
}

/**
 * Save a compaction checkpoint to disk.
 *
 * Persists to: {stateDir}/compactions/{convoyId}/{checkpointId}.json
 */
export async function saveCheckpoint(
  stateDir: string,
  digest: CompactionDigest,
): Promise<void> {
  const filePath = join(stateDir, 'compactions', digest.convoyId, `${digest.checkpointId}.json`);
  await atomicWrite(filePath, serializeSorted(digest));
}

/**
 * Load all checkpoints for a convoy, ordered by creation time.
 */
export async function loadCheckpoints(
  stateDir: string,
  convoyId: string,
): Promise<CompactionDigest[]> {
  const dir = join(stateDir, 'compactions', convoyId);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  const checkpoints: CompactionDigest[] = [];
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    const content = await readFile(join(dir, file), 'utf-8');
    checkpoints.push(JSON.parse(content));
  }

  return checkpoints.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

// ============================================================================
// High-Level API
// ============================================================================

let checkpointCounter = 0;

/**
 * Run a compaction checkpoint on a convoy's transcript.
 *
 * Full pipeline: parse → classify → deduplicate → compact → persist.
 *
 * @param stateDir - Root state directory
 * @param convoyId - Convoy identifier
 * @param transcript - Raw transcript text to compact
 * @param source - Source identifier (agent ID, etc.)
 * @param currentState - Current state snapshot to preserve
 * @param budgetUsedPercent - Current token budget usage (0-100)
 * @param config - Compaction configuration
 */
export async function compactTranscript(
  stateDir: string,
  convoyId: string,
  transcript: string,
  source: string,
  currentState: string,
  budgetUsedPercent: number,
  config: CompactionConfig = DEFAULT_COMPACTION_CONFIG,
): Promise<CompactionResult> {
  // Parse and classify
  const now = new Date().toISOString();
  let segments = parseTranscript(transcript, source, now);
  const transcriptTokens = segments.reduce((sum, s) => sum + s.tokenEstimate, 0);

  // Nothing to compact if transcript is empty
  if (transcriptTokens === 0) {
    return { compacted: false, reason: 'Empty transcript' };
  }

  // Determine compaction level (progressive ladder)
  const level = getCompactionLevel(transcriptTokens, budgetUsedPercent, config);
  if (!level) {
    return { compacted: false, reason: 'Below compaction threshold' };
  }

  // Mark repeated content
  segments = markRepeated(segments);

  // Apply level-specific discard categories
  const levelDiscards = getDiscardCategories(level);
  const levelConfig = {
    ...config,
    discardCategories: levelDiscards.length > 0 ? levelDiscards : config.discardCategories,
    // Snapshot level: keep more segments per item
    maxSegmentsPerItem: level === 'snapshot' ? 20 : level === 'light' ? 10 : config.maxSegmentsPerItem,
    // Snapshot level: larger digest budget (it's a checkpoint, not a compression)
    maxDigestTokens: level === 'snapshot' ? 8000 : level === 'light' ? 6000 : config.maxDigestTokens,
  };

  // Compact with level-appropriate config
  const { digest, decisions, errors, originalTokens, compactedTokens } =
    compactSegments(segments, levelConfig);

  const checkpointId = `cp-${++checkpointCounter}-${Date.now().toString(36)}`;

  const compactionDigest: CompactionDigest = {
    checkpointId,
    convoyId,
    itemsCompacted: segments.filter((s) =>
      config.discardCategories.includes(s.category) || s.category === 'repeated',
    ).length,
    originalTokens,
    compactedTokens,
    compressionRatio: originalTokens > 0 ? compactedTokens / originalTokens : 1,
    digest,
    decisions,
    errors,
    currentState,
    createdAt: now,
  };

  // Persist checkpoint
  await saveCheckpoint(stateDir, compactionDigest);

  return { compacted: true, digest: compactionDigest };
}
