/**
 * Candidate ranking with evidence assembly and deduplication.
 *
 * Transforms raw PatternOccurrence data from the aggregator into scored,
 * evidence-rich RankedCandidate objects. Filters out patterns that match
 * existing skills via exact name match or keyword overlap (Jaccard similarity).
 *
 * Pipeline: score -> evidence -> name/label/description -> dedup -> cap -> return
 */

import {
  scorePattern,
  parsePatternKey,
  generateCandidateName,
  DEFAULT_SCORING_WEIGHTS,
} from './pattern-scorer.js';
import { extractKeywords, jaccardSimilarity } from './text-utils.js';
import type {
  PatternOccurrence,
} from './pattern-aggregator.js';
import type {
  RankedCandidate,
  PatternEvidence,
  ScoringWeights,
  ParsedPatternKey,
} from './pattern-scorer.js';

// ============================================================================
// Types
// ============================================================================

/** An existing skill to deduplicate against */
export interface ExistingSkill {
  name: string;
  description: string;
}

/** Options for the ranking pipeline */
export interface RankingOptions {
  maxCandidates?: number;          // default 20
  weights?: ScoringWeights;        // default DEFAULT_SCORING_WEIGHTS
  existingSkills?: ExistingSkill[];// for dedup
  dedupThreshold?: number;         // Jaccard threshold, default 0.5
  now?: number;                    // current time in epoch ms, default Date.now()
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum sessions to include in evidence */
const MAX_EVIDENCE_SESSIONS = 10;

/** Default maximum candidates to return */
const DEFAULT_MAX_CANDIDATES = 20;

/** Default Jaccard similarity threshold for deduplication */
const DEFAULT_DEDUP_THRESHOLD = 0.5;

// ============================================================================
// assembleEvidence
// ============================================================================

/**
 * Assemble evidence for a pattern from its occurrence data and session timestamps.
 *
 * - Projects: sorted alphabetically
 * - Sessions: sorted by timestamp descending (most recent first), capped at 10
 * - exampleInvocations: tool patterns joined with " -> ", bash patterns as category
 * - lastSeen/firstSeen: ISO strings from session timestamps, or '' if unavailable
 */
export function assembleEvidence(
  patternKey: string,
  occurrence: PatternOccurrence,
  sessionTimestamps: Map<string, number>,
): PatternEvidence {
  // Projects: sorted alphabetically
  const projects = Array.from(occurrence.projectSlugs).sort();

  // Sessions: sorted by timestamp descending (most recent first), capped at 10
  const sessionsWithTs = Array.from(occurrence.sessionIds).map(id => ({
    id,
    ts: sessionTimestamps.get(id) ?? -Infinity,
  }));
  sessionsWithTs.sort((a, b) => b.ts - a.ts);
  const sessions = sessionsWithTs.slice(0, MAX_EVIDENCE_SESSIONS).map(s => s.id);

  // Total occurrences
  const totalOccurrences = occurrence.totalCount;

  // Example invocations from pattern key
  const parsed = parsePatternKey(patternKey);
  let exampleInvocations: string[];

  if (parsed.type === 'tool-bigram' || parsed.type === 'tool-trigram') {
    exampleInvocations = [parsed.tools!.join(' -> ')];
  } else {
    // bash-pattern: use the category string
    exampleInvocations = [parsed.raw];
  }

  // lastSeen / firstSeen from session timestamps
  let lastSeen = '';
  let firstSeen = '';

  const validTimestamps: number[] = [];
  for (const sessionId of occurrence.sessionIds) {
    const ts = sessionTimestamps.get(sessionId);
    if (ts !== undefined) {
      validTimestamps.push(ts);
    }
  }

  if (validTimestamps.length > 0) {
    lastSeen = new Date(Math.max(...validTimestamps)).toISOString();
    firstSeen = new Date(Math.min(...validTimestamps)).toISOString();
  }

  return {
    projects,
    sessions,
    totalOccurrences,
    exampleInvocations,
    lastSeen,
    firstSeen,
  };
}

// ============================================================================
// deduplicateAgainstExisting
// ============================================================================

/**
 * Deduplicate candidates against existing skills.
 *
 * Matching criteria (either triggers removal):
 * 1. Exact name match (case-insensitive)
 * 2. Keyword overlap above threshold (Jaccard similarity)
 *
 * Minimum-results guarantee: if ALL candidates would be removed, returns
 * all as `filtered` with empty `removed` instead of empty output.
 */
export function deduplicateAgainstExisting(
  candidates: RankedCandidate[],
  existingSkills: ExistingSkill[],
  threshold: number,
): { filtered: RankedCandidate[]; removed: Array<RankedCandidate & { matchedExistingSkill: string }> } {
  if (existingSkills.length === 0) {
    return { filtered: [...candidates], removed: [] };
  }

  const filtered: RankedCandidate[] = [];
  const removed: Array<RankedCandidate & { matchedExistingSkill: string }> = [];

  for (const candidate of candidates) {
    let matchedSkill: string | null = null;

    for (const existing of existingSkills) {
      // 1. Exact name match (case-insensitive)
      if (candidate.suggestedName.toLowerCase() === existing.name.toLowerCase()) {
        matchedSkill = existing.name;
        break;
      }

      // 2. Keyword overlap (Jaccard similarity)
      const candidateKeywords = extractKeywords(candidate.suggestedDescription);
      const existingKeywords = extractKeywords(existing.description);
      const jaccard = jaccardSimilarity(candidateKeywords, existingKeywords);

      if (jaccard >= threshold) {
        matchedSkill = existing.name;
        break;
      }
    }

    if (matchedSkill) {
      removed.push({ ...candidate, matchedExistingSkill: matchedSkill });
    } else {
      filtered.push(candidate);
    }
  }

  // Minimum-results guarantee: if all removed, return all as filtered
  if (filtered.length === 0 && removed.length > 0) {
    return { filtered: candidates.map(c => ({ ...c })), removed: [] };
  }

  return { filtered, removed };
}

// ============================================================================
// rankCandidates
// ============================================================================

/**
 * Rank pattern occurrences into scored, evidence-rich candidates.
 *
 * Pipeline:
 * 1. Score each pattern via scorePattern()
 * 2. Parse key, generate name/label/description, assemble evidence
 * 3. Sort by score descending
 * 4. Apply deduplication if existingSkills provided
 * 5. Cap at maxCandidates (default 20)
 */
export function rankCandidates(
  patterns: Map<string, PatternOccurrence>,
  totalProjects: number,
  totalSessions: number,
  sessionTimestamps: Map<string, number>,
  options?: RankingOptions,
): RankedCandidate[] {
  const weights = options?.weights ?? DEFAULT_SCORING_WEIGHTS;
  const maxCandidates = options?.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
  const existingSkills = options?.existingSkills;
  const dedupThreshold = options?.dedupThreshold ?? DEFAULT_DEDUP_THRESHOLD;
  const now = options?.now ?? Date.now();

  const candidates: RankedCandidate[] = [];

  for (const [patternKey, occurrence] of patterns) {
    // Score the pattern
    const { score, breakdown } = scorePattern(
      occurrence,
      totalProjects,
      totalSessions,
      sessionTimestamps,
      now,
      weights,
    );

    // Parse key and generate identifiers
    const parsed = parsePatternKey(patternKey);
    const suggestedName = generateCandidateName(parsed);
    const label = generateLabel(parsed);
    const suggestedDescription = generateDescription(parsed);
    const evidence = assembleEvidence(patternKey, occurrence, sessionTimestamps);

    candidates.push({
      patternKey,
      label,
      type: parsed.type,
      score,
      scoreBreakdown: breakdown,
      evidence,
      suggestedName,
      suggestedDescription,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Apply deduplication if existing skills provided
  let result = candidates;
  if (existingSkills && existingSkills.length > 0) {
    const { filtered } = deduplicateAgainstExisting(candidates, existingSkills, dedupThreshold);
    result = filtered;
  }

  // Cap at maxCandidates
  return result.slice(0, maxCandidates);
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Generate a human-readable label from a parsed pattern key.
 *
 * - Tool patterns: tools joined with " -> " + " workflow"
 * - Bash patterns: capitalize category + " commands"
 */
function generateLabel(parsed: ParsedPatternKey): string {
  if (parsed.type === 'tool-bigram' || parsed.type === 'tool-trigram') {
    return parsed.tools!.join(' -> ') + ' workflow';
  }

  // bash-pattern: capitalize first letter of category + " commands"
  const cat = parsed.category ?? parsed.raw;
  return cat.charAt(0).toUpperCase() + cat.slice(1) + ' commands';
}

/**
 * Generate a suggested description for a pattern.
 *
 * Uses tool names to infer action verbs for activation-triggering descriptions.
 */
function generateDescription(parsed: ParsedPatternKey): string {
  if (parsed.type === 'tool-bigram' || parsed.type === 'tool-trigram') {
    const tools = parsed.tools!;
    const verbs = collectVerbs(tools);
    const verbPhrase = verbs.join(' and ');
    return `Guides ${tools.join(' -> ')} workflow. Use when ${verbPhrase} files.`;
  }

  // bash-pattern
  const cat = parsed.category ?? parsed.raw;
  return `Guides ${cat} operations. Use when running ${cat} commands.`;
}

/**
 * Collect action verbs based on tool names in the pattern.
 */
function collectVerbs(tools: string[]): string[] {
  const verbs: string[] = [];
  const seen = new Set<string>();

  for (const tool of tools) {
    const name = tool.toLowerCase();
    let verb: string | null = null;

    if (name === 'read') {
      verb = 'reading and analyzing';
    } else if (name === 'edit' || name === 'write') {
      verb = 'editing and modifying';
    } else if (name === 'bash') {
      verb = 'executing commands on';
    } else if (name === 'glob' || name === 'grep') {
      verb = 'searching';
    }

    if (verb && !seen.has(verb)) {
      seen.add(verb);
      verbs.push(verb);
    }
  }

  // Fallback if no recognized tools
  if (verbs.length === 0) {
    verbs.push('performing development operations on');
  }

  return verbs;
}

// extractKeywords and jaccardSimilarity are now imported from text-utils.js
