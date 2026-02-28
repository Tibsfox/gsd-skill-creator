/**
 * Multi-factor pattern scoring for the ranking pipeline.
 *
 * Scores aggregated pattern occurrences using four factors: frequency
 * (log-scaled), cross-project breadth, recency (exponential decay with
 * 14-day half-life), and consistency (session fraction). Provides shared
 * types consumed by the ranker, drafter, and selector downstream.
 *
 * Also provides key parsing (aggregator key -> structured form) and
 * candidate name generation for the skill suggestion pipeline.
 */

import type { PatternOccurrence } from './pattern-aggregator.js';
import type { BashCategory } from './bash-pattern-extractor.js';

// ============================================================================
// Types (shared across Phase 33 pipeline)
// ============================================================================

/** Parsed structure of an aggregator pattern key */
export interface ParsedPatternKey {
  type: 'tool-bigram' | 'tool-trigram' | 'bash-pattern';
  tools?: string[];           // For tool patterns: individual tool names
  category?: BashCategory;    // For bash patterns: the category
  raw: string;                // The raw n-gram or category string
}

/** Configurable weights for the scoring formula */
export interface ScoringWeights {
  frequency: number;    // default 0.25
  crossProject: number; // default 0.30
  recency: number;      // default 0.25
  consistency: number;  // default 0.20
}

/** Individual factor scores for a single pattern */
export interface ScoreBreakdown {
  frequency: number;
  crossProject: number;
  recency: number;
  consistency: number;
}

/** Evidence from sessions/projects for a single pattern */
export interface PatternEvidence {
  projects: string[];
  sessions: string[];
  totalOccurrences: number;
  exampleInvocations: string[];
  lastSeen: string;
  firstSeen: string;
}

/** A scored and ranked skill candidate */
export interface RankedCandidate {
  patternKey: string;
  label: string;
  type: 'tool-bigram' | 'tool-trigram' | 'bash-pattern';
  score: number;
  scoreBreakdown: ScoreBreakdown;
  evidence: PatternEvidence;
  suggestedName: string;
  suggestedDescription: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default scoring weights (must sum to 1.0) */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  frequency: 0.25,
  crossProject: 0.30,
  recency: 0.25,
  consistency: 0.20,
};

/** Recency half-life in days for exponential decay */
const RECENCY_HALF_LIFE_DAYS = 14;

/** ln(2) used in exponential decay calculation */
const LN2 = 0.693;

/** Milliseconds per day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// parsePatternKey
// ============================================================================

/**
 * Parse an aggregator pattern key into its structured form.
 *
 * Key formats:
 * - `tool:bigram:Read->Edit`   -> { type: 'tool-bigram', tools: ['Read', 'Edit'] }
 * - `tool:trigram:A->B->C`     -> { type: 'tool-trigram', tools: ['A', 'B', 'C'] }
 * - `bash:git-workflow`        -> { type: 'bash-pattern', category: 'git-workflow' }
 *
 * @throws Error on unknown key format
 */
export function parsePatternKey(key: string): ParsedPatternKey {
  if (key.startsWith('tool:bigram:')) {
    const raw = key.slice('tool:bigram:'.length);
    return {
      type: 'tool-bigram',
      tools: raw.split('->'),
      raw,
    };
  }

  if (key.startsWith('tool:trigram:')) {
    const raw = key.slice('tool:trigram:'.length);
    return {
      type: 'tool-trigram',
      tools: raw.split('->'),
      raw,
    };
  }

  if (key.startsWith('bash:')) {
    const raw = key.slice('bash:'.length);
    return {
      type: 'bash-pattern',
      category: raw as BashCategory,
      raw,
    };
  }

  throw new Error(`Unknown pattern key format: ${key}`);
}

// ============================================================================
// generateCandidateName
// ============================================================================

/**
 * Generate a suggested skill name from a parsed pattern key.
 *
 * - Tool bigram/trigram: lowercase hyphenated tool names + "-workflow"
 * - Bash pattern: category + "-patterns"
 */
export function generateCandidateName(parsed: ParsedPatternKey): string {
  if (parsed.type === 'tool-bigram' || parsed.type === 'tool-trigram') {
    return parsed.tools!.map(t => t.toLowerCase()).join('-') + '-workflow';
  }

  // bash-pattern
  return `${parsed.category}-patterns`;
}

// ============================================================================
// scorePattern
// ============================================================================

/**
 * Score a pattern occurrence using four weighted factors.
 *
 * Factors:
 * 1. **Frequency** - log2-scaled count, capped at 1.0
 * 2. **Cross-project** - fraction of total projects this pattern appears in
 * 3. **Recency** - exponential decay from most recent session (14-day half-life)
 * 4. **Consistency** - fraction of total sessions this pattern appears in
 *
 * @param occurrence - Aggregated pattern data
 * @param totalProjects - Total unique projects in the corpus
 * @param totalSessions - Total unique sessions in the corpus
 * @param sessionTimestamps - Map of sessionId -> epoch ms for recency calculation
 * @param now - Current time in epoch ms
 * @param weights - Optional custom scoring weights (defaults to DEFAULT_SCORING_WEIGHTS)
 * @returns Combined score in [0, 1] and per-factor breakdown
 */
export function scorePattern(
  occurrence: PatternOccurrence,
  totalProjects: number,
  totalSessions: number,
  sessionTimestamps: Map<string, number>,
  now: number,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): { score: number; breakdown: ScoreBreakdown } {
  // 1. Frequency: log-scale so 1000 occurrences doesn't dominate 10
  const frequency = Math.min(1, Math.log2(occurrence.totalCount + 1) / 10);

  // 2. Cross-project: fraction of total projects
  const crossProject = totalProjects > 0
    ? occurrence.projectCount / totalProjects
    : 0;

  // 3. Recency: exponential decay from most recent session timestamp
  let recency = 0;
  let mostRecentTs = -1;

  for (const sessionId of occurrence.sessionIds) {
    const ts = sessionTimestamps.get(sessionId);
    if (ts !== undefined && ts > mostRecentTs) {
      mostRecentTs = ts;
    }
  }

  if (mostRecentTs >= 0) {
    const daysSince = (now - mostRecentTs) / MS_PER_DAY;
    recency = Math.exp(-LN2 * daysSince / RECENCY_HALF_LIFE_DAYS);
  }

  // 4. Consistency: fraction of total sessions
  const consistency = totalSessions > 0
    ? Math.min(1, occurrence.sessionCount / totalSessions)
    : 0;

  // Weighted sum
  const score =
    weights.frequency * frequency +
    weights.crossProject * crossProject +
    weights.recency * recency +
    weights.consistency * consistency;

  return {
    score,
    breakdown: { frequency, crossProject, recency, consistency },
  };
}
