/**
 * Cache optimization analyzers for wave execution plans.
 *
 * Provides six pure analysis functions for cache optimization reporting:
 * - detectSharedLoads(): identifies skill loads shareable within each wave
 * - analyzeSchemaReuse(): identifies schema reuse across ALL wave boundaries
 * - calculateKnowledgeTiers(): computes current vs optimal tier with token savings
 * - validateTTL(): validates cache TTL at every wave boundary using cumulative timing
 * - estimateTokenSavings(): reports per-category token savings with aggregate total
 * - generateCacheReport(): composes all analyzers into a structured CacheReport
 *
 * Uses gpt-tokenizer for accurate token counting rather than char/4 heuristic.
 *
 * @module vtm/cache-optimizer
 */

import type { WaveExecutionPlan, ComponentSpec, WaveTask } from './types.js';
import { encode } from 'gpt-tokenizer';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Entry describing a shared skill load within a single wave. */
export interface SharedLoadEntry {
  /** Wave number where sharing occurs. */
  wave: number;
  /** Skill name or produces artifact shared. */
  skill: string;
  /** Task IDs that share this load. */
  tasks: string[];
  /** Tokens for this skill (via gpt-tokenizer encode). */
  estimatedTokens: number;
  /** True if 2+ tasks share it. */
  cacheable: boolean;
}

/** Entry describing schema reuse across wave boundaries. */
export interface SchemaReuseEntry {
  /** Artifact name (e.g., "shared-types.ts"). */
  schema: string;
  /** Task ID that produces it. */
  producerTask: string;
  /** Wave number of producer. */
  producerWave: number;
  /** Task IDs that consume it. */
  consumerTasks: string[];
  /** Wave numbers of consumers. */
  consumerWaves: number[];
  /** max(consumerWave) - producerWave. */
  waveBoundariesCrossed: number;
}

/** Entry describing a task's knowledge tier sizing. */
export interface KnowledgeTierEntry {
  /** Task ID. */
  task: string;
  /** Wave number. */
  wave: number;
  /** Tier currently loaded. */
  currentTier: 'summary' | 'active' | 'reference';
  /** Tier actually needed. */
  optimalTier: 'summary' | 'active' | 'reference';
  /** Tokens for current tier. */
  tokensCurrent: number;
  /** Tokens for optimal tier. */
  tokensOptimal: number;
  /** tokensCurrent - tokensOptimal (0 if optimal). */
  savings: number;
}

/** A single TTL violation at a wave boundary. */
export interface TTLViolation {
  /** Wave number where the violation is detected (consumer wave). */
  wave: number;
  /** Cumulative minutes from Wave 0 through the stale producer wave. */
  cumulativeMinutes: number;
  /** TTL threshold in minutes that was exceeded. */
  ttlMinutes: number;
  /** Severity: warning if <1min over, error if >=1min over. */
  severity: 'warning' | 'error';
  /** Task IDs in this wave depending on stale caches from earlier waves. */
  affectedConsumers: string[];
  /** Actionable suggestion for resolving the violation. */
  mitigation: string;
}

/** Result of TTL validation across all wave boundaries. */
export interface TTLValidationResult {
  /** True when no violations detected. */
  valid: boolean;
  /** Array of TTL violations found. */
  violations: TTLViolation[];
  /** Cumulative time at each wave boundary. */
  cumulativeTimes: Array<{ wave: number; cumulativeMinutes: number }>;
}

/** Per-category token savings report. */
export interface TokenSavingsReport {
  /** Savings from caching shared skill loads. */
  skillCaching: { entries: number; tokensSaved: number };
  /** Savings from reusing schema definitions across waves. */
  schemaReuse: { entries: number; tokensSaved: number };
  /** Savings from downgrading knowledge tiers. */
  knowledgeTierOptimization: { entries: number; tokensSaved: number };
  /** Sum of all three categories. */
  totalTokensSaved: number;
}

/** Complete cache optimization report aggregating all analyzers. */
export interface CacheReport {
  /** Shared skill loads detected within waves. */
  sharedLoads: SharedLoadEntry[];
  /** Schema reuse entries across wave boundaries. */
  schemaReuse: SchemaReuseEntry[];
  /** Knowledge tier sizing entries for each task. */
  knowledgeTiers: KnowledgeTierEntry[];
  /** TTL validation result with cumulative timing. */
  ttlValidation: TTLValidationResult;
  /** Token savings breakdown by category. */
  tokenSavings: TokenSavingsReport;
  /** Actionable recommendations for cache optimization. */
  recommendations: string[];
  /** Per-wave summary of optimization opportunities. */
  waveSummaries: Array<{
    wave: number;
    sharedLoadCount: number;
    schemaReuseCount: number;
    tierOptimizations: number;
    waveSavings: number;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Words to exclude from content overlap analysis (common English stopwords). */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'this', 'that', 'have', 'has', 'had', 'not', 'can', 'will', 'do',
  'if', 'so', 'no', 'all', 'its', 'also', 'into', 'than', 'then',
]);

/** Minimum word length to consider "significant" for overlap detection. */
const MIN_WORD_LENGTH = 4;

/**
 * Jaccard similarity threshold for flagging content overlap.
 *
 * @justification Type: Accepted heuristic. 0.5 Jaccard similarity is the
 * standard threshold for "substantial overlap" in information retrieval literature.
 * Below 0.5, items are more different than similar; above 0.5, the shared content
 * dominates and deduplication is warranted.
 */
const OVERLAP_THRESHOLD = 0.5;

/** Keywords identifying schema/type producers. */
const SCHEMA_KEYWORDS = ['types', 'schema', 'interface', 'config'];

/**
 * Summary tier token target (~2K).
 *
 * @justification Type: Accepted heuristic. 2000 tokens is the upper bound
 * for a concise summary that fits within a single model completion window
 * alongside a full prompt. Tasks needing <= 2K tokens of context can use
 * the summary tier, which omits implementation details.
 */
const SUMMARY_TOKEN_THRESHOLD = 2000;

/**
 * Active tier token target (~10K).
 *
 * @justification Type: Accepted heuristic. 10000 tokens represents the
 * practical context budget for a single active working task. Tasks needing
 * 2K-10K tokens of context use the active tier, which includes implementation
 * details but omits full reference documentation. Above 10K, the reference
 * tier provides unabridged content.
 */
const ACTIVE_TOKEN_THRESHOLD = 10000;

/** Tokens per minute estimation rate, consistent with wave-analysis.ts. */
const TOKENS_PER_MINUTE = 1000;

/**
 * Default TTL threshold in minutes (per CONTEXT.md decision).
 *
 * @justification Type: Accepted heuristic. 5-minute TTL for cache staleness
 * matches the expected execution window for a single wave in the VTM pipeline.
 * At ~1000 tokens/minute, a 5K-token wave completes in ~5 minutes. Caches
 * produced by Wave N become stale for Wave N+2 consumers if cumulative
 * execution exceeds this window. Configurable via options.ttlMinutes.
 */
const DEFAULT_TTL_MINUTES = 5;

// ---------------------------------------------------------------------------
// detectSharedLoads
// ---------------------------------------------------------------------------

/**
 * Detect skill loads that can be shared within each wave.
 *
 * For each wave, identifies tasks that:
 * 1. Produce the same artifact (exact produces match)
 * 2. Have >50% content overlap in descriptions (Jaccard similarity on significant words)
 *
 * Tasks in different waves are never grouped (cross-wave is schema reuse, not shared loads).
 *
 * @param plan - Wave execution plan to analyze
 * @returns Array of SharedLoadEntry objects (empty if no sharing detected)
 */
export function detectSharedLoads(plan: WaveExecutionPlan): SharedLoadEntry[] {
  const entries: SharedLoadEntry[] = [];

  for (const wave of plan.waves) {
    const allTasks = wave.tracks.flatMap(t => t.tasks);

    // Skip waves with only one task -- nothing to share
    if (allTasks.length < 2) continue;

    // Track which task pairs have already been grouped
    const groupedPairs = new Set<string>();

    // --- 1. Group by exact produces match ---
    const produceGroups = new Map<string, WaveTask[]>();
    for (const task of allTasks) {
      const key = task.produces;
      if (!produceGroups.has(key)) {
        produceGroups.set(key, []);
      }
      produceGroups.get(key)!.push(task);
    }

    for (const [artifact, tasks] of produceGroups) {
      if (tasks.length >= 2) {
        const taskIds = tasks.map(t => t.id);
        // Mark these pairs as grouped
        for (let i = 0; i < taskIds.length; i++) {
          for (let j = i + 1; j < taskIds.length; j++) {
            groupedPairs.add(pairKey(taskIds[i], taskIds[j]));
          }
        }

        entries.push({
          wave: wave.number,
          skill: artifact,
          tasks: taskIds,
          estimatedTokens: countTokens(artifact),
          cacheable: true,
        });
      }
    }

    // --- 2. Content overlap detection via Jaccard similarity ---
    const taskWords = new Map<string, Set<string>>();
    for (const task of allTasks) {
      taskWords.set(task.id, extractSignificantWords(task.description));
    }

    // Check all pairs within this wave
    for (let i = 0; i < allTasks.length; i++) {
      for (let j = i + 1; j < allTasks.length; j++) {
        const taskA = allTasks[i];
        const taskB = allTasks[j];
        const key = pairKey(taskA.id, taskB.id);

        // Skip if already grouped by produces match
        if (groupedPairs.has(key)) continue;

        const wordsA = taskWords.get(taskA.id)!;
        const wordsB = taskWords.get(taskB.id)!;
        const similarity = jaccardSimilarity(wordsA, wordsB);

        if (similarity > OVERLAP_THRESHOLD) {
          // Use the combined description as skill identifier
          const overlapWords = intersection(wordsA, wordsB);
          const skillName = [...overlapWords].slice(0, 3).join('-') + '-overlap';

          entries.push({
            wave: wave.number,
            skill: skillName,
            tasks: [taskA.id, taskB.id],
            estimatedTokens: countTokens(skillName),
            cacheable: true,
          });

          groupedPairs.add(key);
        }
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// analyzeSchemaReuse
// ---------------------------------------------------------------------------

/**
 * Analyze schema reuse across ALL wave boundaries.
 *
 * Uses plan.cacheOptimization.schemaReuse as primary source when present.
 * Falls back to produces/dependsOn pattern inference when absent.
 *
 * @param plan - Wave execution plan to analyze
 * @param specs - Component specs for dependency resolution
 * @returns Array of SchemaReuseEntry objects (empty if no cross-wave reuse)
 */
export function analyzeSchemaReuse(
  plan: WaveExecutionPlan,
  specs: ComponentSpec[],
): SchemaReuseEntry[] {
  // --- Primary source: plan.cacheOptimization.schemaReuse ---
  if (plan.cacheOptimization?.schemaReuse && plan.cacheOptimization.schemaReuse.length > 0) {
    return parseCacheOptimizationReuse(plan.cacheOptimization.schemaReuse);
  }

  // --- Fallback: produces/dependsOn pattern inference ---
  return inferSchemaReuse(plan, specs);
}

// ---------------------------------------------------------------------------
// calculateKnowledgeTiers
// ---------------------------------------------------------------------------

/**
 * Calculate current vs optimal knowledge tiers for each task.
 *
 * All tasks default to 'reference' tier as currentTier. Optimal tier
 * is determined by estimatedTokens thresholds:
 * - <= 2000: summary
 * - <= 10000: active
 * - > 10000: reference (no downgrade)
 *
 * Token sizes use gpt-tokenizer encode for tier content estimation.
 *
 * @param plan - Wave execution plan to analyze
 * @param specs - Component specs (unused currently but reserved for future tier metadata)
 * @returns Array of KnowledgeTierEntry objects
 */
export function calculateKnowledgeTiers(
  plan: WaveExecutionPlan,
  specs: ComponentSpec[],
): KnowledgeTierEntry[] {
  const entries: KnowledgeTierEntry[] = [];

  for (const wave of plan.waves) {
    const allTasks = wave.tracks.flatMap(t => t.tasks);

    for (const task of allTasks) {
      const currentTier: KnowledgeTierEntry['currentTier'] = 'reference';
      const optimalTier = determineOptimalTier(task.estimatedTokens);

      // Token sizes based on tier content representation
      const tokensCurrent = estimateTokensForTier(task, currentTier);
      const tokensOptimal = estimateTokensForTier(task, optimalTier);

      const savings = Math.max(0, tokensCurrent - tokensOptimal);

      entries.push({
        task: task.id,
        wave: wave.number,
        currentTier,
        optimalTier,
        tokensCurrent,
        tokensOptimal,
        savings,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// validateTTL
// ---------------------------------------------------------------------------

/**
 * Validate cache TTL at every wave boundary using cumulative timing.
 *
 * For each wave, computes cumulative time from Wave 0 forward. At each
 * wave boundary (N+1), checks whether caches produced by any prior wave
 * have expired based on the TTL threshold.
 *
 * Per CONTEXT.md: TTL validation covers ALL wave boundaries using
 * cumulative timing, not just Wave 0 -> Wave 1.
 *
 * @param plan - Wave execution plan to analyze
 * @param specs - Component specs for dependency resolution
 * @param options - Optional TTL configuration (default 5 minutes)
 * @returns TTLValidationResult with validity, violations, and cumulative times
 */
export function validateTTL(
  plan: WaveExecutionPlan,
  specs: ComponentSpec[],
  options?: { ttlMinutes?: number },
): TTLValidationResult {
  const ttlMinutes = options?.ttlMinutes ?? DEFAULT_TTL_MINUTES;
  const violations: TTLViolation[] = [];
  const cumulativeTimes: Array<{ wave: number; cumulativeMinutes: number }> = [];

  // Compute per-wave time and cumulative time
  const waveTimes: Array<{ wave: number; minutes: number; cumulativeMinutes: number }> = [];
  let cumulative = 0;

  for (const wave of plan.waves) {
    const waveTokens = wave.tracks.reduce(
      (sum, track) => sum + track.tasks.reduce((s, t) => s + t.estimatedTokens, 0),
      0,
    );
    const waveMinutes = waveTokens / TOKENS_PER_MINUTE;
    cumulative += waveMinutes;

    waveTimes.push({
      wave: wave.number,
      minutes: waveMinutes,
      cumulativeMinutes: cumulative,
    });

    cumulativeTimes.push({
      wave: wave.number,
      cumulativeMinutes: cumulative,
    });
  }

  // Build task -> wave map for dependency resolution
  const taskWaveMap = new Map<string, number>();
  for (const wave of plan.waves) {
    for (const track of wave.tracks) {
      for (const task of track.tasks) {
        taskWaveMap.set(task.id, wave.number);
      }
    }
  }

  // Check each wave boundary for TTL violations
  for (let consumerIdx = 1; consumerIdx < plan.waves.length; consumerIdx++) {
    const consumerWave = plan.waves[consumerIdx];
    const consumerTasks = consumerWave.tracks.flatMap(t => t.tasks);

    // Check each prior wave as potential stale producer
    for (let producerIdx = 0; producerIdx < consumerIdx; producerIdx++) {
      const producerWave = plan.waves[producerIdx];
      const producerWaveTime = waveTimes[producerIdx];

      // Cumulative time at the consumer wave boundary = sum of waves 0..consumerIdx-1
      // (time elapsed before this consumer wave starts executing)
      const cumulativeAtBoundary = waveTimes[consumerIdx - 1].cumulativeMinutes;

      // Time since producer wave completed = cumulative at consumer boundary - cumulative at producer end + producer time
      // But more simply: how long ago did producer wave finish?
      // Producer finished at waveTimes[producerIdx].cumulativeMinutes
      // Consumer starts at waveTimes[consumerIdx-1].cumulativeMinutes
      const timeSinceProducerFinished = cumulativeAtBoundary - waveTimes[producerIdx].cumulativeMinutes;
      // The cache was produced at the end of producerWave, so staleness = timeSinceProducerFinished
      // But for Wave 0's cache used at Wave 1: the cumulative time through Wave 0 is what matters
      // because the cache was produced at the START of Wave 0 execution.
      // Actually: cache is loaded at Wave 0 start. By the time we reach Wave 1,
      // the elapsed time is cumulative through Wave 0 = waveTimes[0].cumulativeMinutes.
      // For Wave 2, the elapsed time since Wave 0's cache = waveTimes[1].cumulativeMinutes (through Wave 0 + Wave 1).
      // So the staleness = cumulativeAtBoundary for Wave 0's cache at consumer wave.
      // More generally: staleness of producerWave's cache at consumerWave start
      // = cumulative time from producerWave start to consumerWave start
      // = sum of wave times from producerIdx to consumerIdx-1

      // Recalculate: The cache from producerWave was loaded at the beginning of producerWave.
      // By the time consumerWave starts, time elapsed = sum(waveTimes[producerIdx..consumerIdx-1])
      const staleness = waveTimes.slice(producerIdx, consumerIdx).reduce(
        (sum, wt) => sum + wt.minutes, 0,
      );

      if (staleness > ttlMinutes) {
        // Find tasks in consumer wave that depend on tasks in producer wave
        const producerTaskIds = new Set(
          producerWave.tracks.flatMap(t => t.tasks.map(task => task.id)),
        );

        const affectedConsumers: string[] = [];
        for (const task of consumerTasks) {
          const dependsOnProducer = task.dependsOn.some(dep => producerTaskIds.has(dep));
          if (dependsOnProducer) {
            affectedConsumers.push(task.id);
          }
        }

        // Only create a violation if there are actual consumers depending on stale cache
        if (affectedConsumers.length > 0) {
          const overage = staleness - ttlMinutes;
          const severity: TTLViolation['severity'] = overage >= 1 ? 'error' : 'warning';

          violations.push({
            wave: consumerWave.number,
            cumulativeMinutes: staleness,
            ttlMinutes,
            severity,
            affectedConsumers,
            mitigation: `Split wave ${producerWave.number} to reduce cumulative completion time below ${ttlMinutes}min TTL, or move non-critical tasks to a later wave`,
          });
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    cumulativeTimes,
  };
}

// ---------------------------------------------------------------------------
// estimateTokenSavings
// ---------------------------------------------------------------------------

/**
 * Estimate token savings across three optimization categories.
 *
 * Computes absolute token counts saved by:
 * 1. Skill caching: reusing shared loads (cache once, reuse N-1 times)
 * 2. Schema reuse: avoiding re-parsing schemas across wave boundaries
 * 3. Knowledge tier optimization: downgrading to actual tier needed
 *
 * @param sharedLoads - Shared load entries from detectSharedLoads
 * @param schemaReuse - Schema reuse entries from analyzeSchemaReuse
 * @param knowledgeTiers - Knowledge tier entries from calculateKnowledgeTiers
 * @returns TokenSavingsReport with per-category breakdowns and aggregate total
 */
export function estimateTokenSavings(
  sharedLoads: SharedLoadEntry[],
  schemaReuse: SchemaReuseEntry[],
  knowledgeTiers: KnowledgeTierEntry[],
): TokenSavingsReport {
  // Skill caching: for each cacheable entry, savings = estimatedTokens * (tasks.length - 1)
  let skillCachingTokens = 0;
  let skillCachingEntries = 0;
  for (const entry of sharedLoads) {
    if (entry.cacheable && entry.tasks.length >= 2) {
      skillCachingTokens += entry.estimatedTokens * (entry.tasks.length - 1);
      skillCachingEntries++;
    }
  }

  // Schema reuse: for each entry, savings = encode(schema name).length * consumerTasks.length
  let schemaReuseTokens = 0;
  let schemaReuseEntries = 0;
  for (const entry of schemaReuse) {
    const schemaTokens = encode(entry.schema).length;
    schemaReuseTokens += schemaTokens * entry.consumerTasks.length;
    schemaReuseEntries++;
  }

  // Knowledge tier: sum of all entry savings
  let tierTokens = 0;
  let tierEntries = 0;
  for (const entry of knowledgeTiers) {
    tierTokens += entry.savings;
    tierEntries++;
  }

  return {
    skillCaching: { entries: skillCachingEntries, tokensSaved: skillCachingTokens },
    schemaReuse: { entries: schemaReuseEntries, tokensSaved: schemaReuseTokens },
    knowledgeTierOptimization: { entries: tierEntries, tokensSaved: tierTokens },
    totalTokensSaved: skillCachingTokens + schemaReuseTokens + tierTokens,
  };
}

// ---------------------------------------------------------------------------
// generateCacheReport
// ---------------------------------------------------------------------------

/**
 * Generate a complete cache optimization report by composing all analyzers.
 *
 * Orchestrates detectSharedLoads, analyzeSchemaReuse, calculateKnowledgeTiers,
 * validateTTL, and estimateTokenSavings into a single structured CacheReport
 * with per-wave summaries and actionable recommendations.
 *
 * @param plan - Wave execution plan to analyze
 * @param specs - Component specs for dependency resolution
 * @param options - Optional TTL configuration
 * @returns CacheReport with all analysis results, summaries, and recommendations
 */
export function generateCacheReport(
  plan: WaveExecutionPlan,
  specs: ComponentSpec[],
  options?: { ttlMinutes?: number },
): CacheReport {
  // Run all analyzers
  const sharedLoads = detectSharedLoads(plan);
  const schemaReuseEntries = analyzeSchemaReuse(plan, specs);
  const knowledgeTierEntries = calculateKnowledgeTiers(plan, specs);
  const ttlValidation = validateTTL(plan, specs, options);
  const tokenSavings = estimateTokenSavings(sharedLoads, schemaReuseEntries, knowledgeTierEntries);

  // Build per-wave summaries
  const waveNumbers = plan.waves.map(w => w.number);
  const waveSummaries = waveNumbers.map(waveNum => {
    const waveSharedLoads = sharedLoads.filter(e => e.wave === waveNum);
    const waveSchemaReuse = schemaReuseEntries.filter(e => e.producerWave === waveNum);
    const waveTiers = knowledgeTierEntries.filter(e => e.wave === waveNum && e.savings > 0);

    // Calculate wave-level savings
    let waveSavings = 0;
    for (const entry of waveSharedLoads) {
      if (entry.cacheable && entry.tasks.length >= 2) {
        waveSavings += entry.estimatedTokens * (entry.tasks.length - 1);
      }
    }
    for (const entry of waveSchemaReuse) {
      waveSavings += encode(entry.schema).length * entry.consumerTasks.length;
    }
    for (const entry of waveTiers) {
      waveSavings += entry.savings;
    }

    return {
      wave: waveNum,
      sharedLoadCount: waveSharedLoads.length,
      schemaReuseCount: waveSchemaReuse.length,
      tierOptimizations: waveTiers.length,
      waveSavings,
    };
  });

  // Generate recommendations
  const recommendations: string[] = [];

  // Recommendation for schema reuse across adjacent waves
  for (const entry of schemaReuseEntries) {
    for (const consumerTask of entry.consumerTasks) {
      recommendations.push(
        `Move task ${consumerTask} to wave ${entry.producerWave} to share cache with ${entry.producerTask}`,
      );
    }
  }

  // Recommendations for TTL violations
  for (const violation of ttlValidation.violations) {
    recommendations.push(
      `Split wave ${violation.wave - 1} to reduce cumulative completion time below ${violation.ttlMinutes}min TTL`,
    );
  }

  // Recommendations for knowledge tier downgrades
  for (const entry of knowledgeTierEntries) {
    if (entry.optimalTier !== entry.currentTier) {
      recommendations.push(
        `Downgrade knowledge tier for task ${entry.task} from ${entry.currentTier} to ${entry.optimalTier}`,
      );
    }
  }

  return {
    sharedLoads,
    schemaReuse: schemaReuseEntries,
    knowledgeTiers: knowledgeTierEntries,
    ttlValidation,
    tokenSavings,
    recommendations,
    waveSummaries,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers -- shared
// ---------------------------------------------------------------------------

/**
 * Count tokens using gpt-tokenizer encode.
 *
 * @param text - Text to tokenize
 * @returns Token count
 */
function countTokens(text: string): number {
  return encode(text).length;
}

/**
 * Create a canonical pair key for two task IDs.
 */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// ---------------------------------------------------------------------------
// Internal helpers -- detectSharedLoads
// ---------------------------------------------------------------------------

/**
 * Extract significant words from text for overlap detection.
 *
 * Filters out stopwords and words shorter than MIN_WORD_LENGTH.
 *
 * @param text - Text to extract words from
 * @returns Set of significant lowercase words
 */
function extractSignificantWords(text: string): Set<string> {
  const words = text.toLowerCase().split(/\s+/);
  const significant = new Set<string>();

  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length >= MIN_WORD_LENGTH && !STOPWORDS.has(cleaned)) {
      significant.add(cleaned);
    }
  }

  return significant;
}

/**
 * Compute Jaccard similarity between two sets.
 *
 * Jaccard index = |A intersect B| / |A union B|
 *
 * @param a - First set
 * @param b - Second set
 * @returns Similarity coefficient between 0 and 1
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  const inter = intersection(a, b);
  const unionSize = new Set([...a, ...b]).size;

  return inter.size / unionSize;
}

/**
 * Compute intersection of two sets.
 */
function intersection(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const item of a) {
    if (b.has(item)) {
      result.add(item);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers -- analyzeSchemaReuse
// ---------------------------------------------------------------------------

/**
 * Parse schema reuse entries from plan.cacheOptimization.schemaReuse records.
 *
 * @param records - Raw schema reuse records from cacheOptimization
 * @returns Typed SchemaReuseEntry array
 */
function parseCacheOptimizationReuse(
  records: Array<Record<string, unknown>>,
): SchemaReuseEntry[] {
  const entries: SchemaReuseEntry[] = [];

  for (const record of records) {
    const schema = record.schema as string;
    const producerTask = record.producerTask as string;
    const producerWave = record.producerWave as number;
    const consumerTasks = (record.consumerTasks as string[]) ?? [];
    const consumerWaves = (record.consumerWaves as number[]) ?? [];

    const maxConsumerWave = consumerWaves.length > 0
      ? Math.max(...consumerWaves)
      : producerWave;

    entries.push({
      schema,
      producerTask,
      producerWave,
      consumerTasks,
      consumerWaves,
      waveBoundariesCrossed: maxConsumerWave - producerWave,
    });
  }

  return entries;
}

/**
 * Infer schema reuse from produces/dependsOn patterns in plan and specs.
 *
 * Identifies producers: tasks whose produces string contains type/schema/interface/config keywords.
 * Identifies consumers: tasks in later waves whose ComponentSpec dependsOn includes the producer's spec name.
 *
 * Spec-to-task matching uses multiple strategies:
 * 1. Sanitized spec name matches task ID suffix (task-{sanitized-name})
 * 2. Spec produces matches task produces (artifact match)
 * 3. Spec name sanitized words overlap with task ID
 *
 * @param plan - Wave execution plan
 * @param specs - Component specs for dependency resolution
 * @returns SchemaReuseEntry array
 */
function inferSchemaReuse(
  plan: WaveExecutionPlan,
  specs: ComponentSpec[],
): SchemaReuseEntry[] {
  const entries: SchemaReuseEntry[] = [];

  // Build task -> wave number map and collect all tasks
  const taskWaveMap = new Map<string, number>();
  const allTasks: WaveTask[] = [];

  for (const wave of plan.waves) {
    for (const track of wave.tracks) {
      for (const task of track.tasks) {
        taskWaveMap.set(task.id, wave.number);
        allTasks.push(task);
      }
    }
  }

  // Build spec name -> task ID map using multiple matching strategies
  const specToTaskId = new Map<string, string>();

  for (const spec of specs) {
    const sanitizedSpec = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

    for (const task of allTasks) {
      const taskSuffix = task.id.replace(/^task-/, '');

      // Strategy 1: exact sanitized name match or prefix match
      if (taskSuffix === sanitizedSpec || taskSuffix.startsWith(`${sanitizedSpec}-`)) {
        specToTaskId.set(spec.name, task.id);
        break;
      }

      // Strategy 2: produces artifact match
      if (spec.produces.length > 0 && spec.produces[0] === task.produces) {
        specToTaskId.set(spec.name, task.id);
        break;
      }

      // Strategy 3: sanitized spec name words overlap with task suffix
      const specWords = sanitizedSpec.split('-').filter(w => w.length > 0);
      const taskWords = taskSuffix.split('-').filter(w => w.length > 0);
      const matchingWords = specWords.filter(w => taskWords.includes(w));
      if (matchingWords.length > 0 && matchingWords.length >= taskWords.length) {
        specToTaskId.set(spec.name, task.id);
        break;
      }
    }
  }

  // Identify producers: specs whose produces contain schema keywords
  const producers: Array<{ spec: ComponentSpec; taskId: string; wave: number }> = [];

  for (const spec of specs) {
    const producesText = spec.produces.join(' ').toLowerCase();
    const isSchemaProducer = SCHEMA_KEYWORDS.some(kw => producesText.includes(kw));

    if (isSchemaProducer) {
      const taskId = specToTaskId.get(spec.name);
      if (taskId !== undefined) {
        const wave = taskWaveMap.get(taskId);
        if (wave !== undefined) {
          producers.push({ spec, taskId, wave });
        }
      }
    }
  }

  // For each producer, find consumer specs in later waves
  for (const producer of producers) {
    const consumerTasks: string[] = [];
    const consumerWaves: number[] = [];

    for (const spec of specs) {
      // Check if this spec depends on the producer
      if (spec.dependencies.includes(producer.spec.name)) {
        const consumerTaskId = specToTaskId.get(spec.name);
        if (consumerTaskId !== undefined) {
          const consumerWave = taskWaveMap.get(consumerTaskId);
          if (consumerWave !== undefined && consumerWave > producer.wave) {
            consumerTasks.push(consumerTaskId);
            consumerWaves.push(consumerWave);
          }
        }
      }
    }

    if (consumerTasks.length > 0) {
      const maxConsumerWave = Math.max(...consumerWaves);

      entries.push({
        schema: producer.spec.produces[0] ?? producer.spec.name,
        producerTask: producer.taskId,
        producerWave: producer.wave,
        consumerTasks,
        consumerWaves,
        waveBoundariesCrossed: maxConsumerWave - producer.wave,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Internal helpers -- calculateKnowledgeTiers
// ---------------------------------------------------------------------------

/**
 * Determine optimal knowledge tier based on token count thresholds.
 *
 * - <= 2000: summary (minimal content needed)
 * - <= 10000: active (moderate content needed)
 * - > 10000: reference (full content needed)
 *
 * @param estimatedTokens - Task's estimated token count
 * @returns Optimal tier name
 */
function determineOptimalTier(estimatedTokens: number): KnowledgeTierEntry['optimalTier'] {
  if (estimatedTokens <= SUMMARY_TOKEN_THRESHOLD) return 'summary';
  if (estimatedTokens <= ACTIVE_TOKEN_THRESHOLD) return 'active';
  return 'reference';
}

/**
 * Estimate token count for a task at a given tier.
 *
 * Uses gpt-tokenizer encode on representative content for each tier:
 * - summary: task description only (~brief representation)
 * - active: task description + produces + dependsOn details
 * - reference: full task content at estimatedTokens
 *
 * @param task - Wave task
 * @param tier - Knowledge tier
 * @returns Token count for this tier
 */
function estimateTokensForTier(
  task: WaveTask,
  tier: KnowledgeTierEntry['currentTier'],
): number {
  switch (tier) {
    case 'summary': {
      // Summary: just the task description
      const summaryContent = task.description;
      return countTokens(summaryContent);
    }
    case 'active': {
      // Active: description + produces + dependsOn
      const activeContent = [
        task.description,
        `Produces: ${task.produces}`,
        `Dependencies: ${task.dependsOn.join(', ') || 'none'}`,
        `Model: ${task.model}`,
      ].join('\n');
      return countTokens(activeContent);
    }
    case 'reference': {
      // Reference: use the task's estimatedTokens directly
      return task.estimatedTokens;
    }
  }
}
