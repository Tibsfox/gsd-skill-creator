/**
 * Skill cross-reference matcher for the resource analysis pipeline.
 *
 * Matches extracted domain requirements against available skills from
 * the capability manifest, producing ready/flagged/missing/recommended
 * statuses with relevance scores. Pure function with no I/O.
 *
 * @module staging/resource/skill-matcher
 */

import type { DomainRequirement, SkillMatch } from './types.js';
import type { SkillCapability } from '../../capabilities/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Dependency injection interface for testability.
 *
 * Allows callers to override relevance computation for testing
 * or alternative scoring strategies.
 */
export interface SkillMatcherDeps {
  computeRelevance: (requirement: DomainRequirement, skill: SkillCapability) => number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Common stop words excluded from word overlap computation.
 * Kept minimal to avoid filtering meaningful domain terms.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'that',
  'this', 'these', 'those', 'it', 'its', 'not', 'no', 'so', 'if',
  'then', 'than', 'when', 'what', 'which', 'who', 'how', 'as', 'up',
  'out', 'about', 'into', 'over', 'after', 'before',
]);

/** Relevance thresholds for status classification. */
const READY_THRESHOLD = 0.5;
const RECOMMENDED_THRESHOLD = 0.3;
const FLAGGED_THRESHOLD = 0.1;

// ============================================================================
// Tokenization
// ============================================================================

/**
 * Tokenize a string into lowercase words, filtering stop words.
 * Splits on whitespace and hyphens to handle skill names like "vitest-runner".
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return new Set(words);
}

// ============================================================================
// Default Relevance
// ============================================================================

/**
 * Default relevance computation using word-level overlap.
 *
 * Tokenizes requirement description + category and skill name + description,
 * computes Jaccard-like overlap, and applies a category keyword boost.
 *
 * @param requirement - The domain requirement to match
 * @param skill - The skill capability to score against
 * @returns Relevance score between 0 and 1
 */
function defaultComputeRelevance(
  requirement: DomainRequirement,
  skill: SkillCapability,
): number {
  // Tokenize requirement: description + category
  const reqText = `${requirement.description} ${requirement.category}`;
  const reqWords = tokenize(reqText);

  // Tokenize skill: name (split on hyphens) + description
  const skillText = `${skill.name} ${skill.description}`;
  const skillWords = tokenize(skillText);

  if (reqWords.size === 0 || skillWords.size === 0) return 0;

  // Compute intersection
  let intersection = 0;
  for (const word of reqWords) {
    if (skillWords.has(word)) {
      intersection++;
    }
  }

  const union = reqWords.size + skillWords.size - intersection;
  if (union === 0) return 0;

  let score = intersection / union;

  // Boost: +0.2 if skill name contains a requirement category keyword
  const categoryWords = tokenize(requirement.category);
  const nameWords = tokenize(skill.name);
  for (const catWord of categoryWords) {
    if (nameWords.has(catWord)) {
      score += 0.2;
      break;
    }
  }

  // Cap at 1.0
  return Math.min(1.0, score);
}

// ============================================================================
// Skill Deduplication
// ============================================================================

/**
 * Deduplicate skills by name, preferring project scope over user scope.
 */
function deduplicateSkills(skills: SkillCapability[]): SkillCapability[] {
  const byName = new Map<string, SkillCapability>();

  for (const skill of skills) {
    const existing = byName.get(skill.name);
    if (!existing) {
      byName.set(skill.name, skill);
    } else if (skill.scope === 'project' && existing.scope === 'user') {
      // Project scope takes priority
      byName.set(skill.name, skill);
    }
  }

  return Array.from(byName.values());
}

// ============================================================================
// Status Classification
// ============================================================================

/**
 * Classify match status from relevance score.
 */
function classifyStatus(relevance: number): 'ready' | 'recommended' | 'flagged' | 'missing' {
  if (relevance >= READY_THRESHOLD) return 'ready';
  if (relevance >= RECOMMENDED_THRESHOLD) return 'recommended';
  if (relevance >= FLAGGED_THRESHOLD) return 'flagged';
  return 'missing';
}

/**
 * Generate a reason string for the match status.
 */
function generateReason(
  status: string,
  requirement: DomainRequirement,
  skillName: string,
  relevance: number,
): string {
  switch (status) {
    case 'ready':
      return `Skill "${skillName}" closely matches requirement "${requirement.category}" (relevance: ${relevance.toFixed(2)})`;
    case 'recommended':
      return `Skill "${skillName}" partially matches requirement "${requirement.category}" (relevance: ${relevance.toFixed(2)})`;
    case 'flagged':
      return `Skill "${skillName}" has low relevance to requirement "${requirement.category}" (relevance: ${relevance.toFixed(2)})`;
    case 'missing':
      return `No available skill matches requirement "${requirement.category}"`;
    default:
      return `Unknown status for requirement "${requirement.category}"`;
  }
}

// ============================================================================
// Main Matcher
// ============================================================================

/**
 * Match domain requirements against available skills.
 *
 * For each requirement, scores all available skills using word-level
 * overlap (or injected computeRelevance), finds the best match, and
 * classifies the status based on relevance thresholds:
 * - >= 0.5: ready
 * - >= 0.3: recommended
 * - >= 0.1: flagged
 * - < 0.1: missing
 *
 * When no skill scores above 0.1, creates a 'missing' entry using
 * the requirement category as the skill name. When multiple skills
 * share the same name, project scope is preferred over user scope.
 *
 * @param requirements - Domain requirements to match
 * @param skills - Available skill capabilities
 * @param deps - Optional dependency injection for custom relevance computation
 * @returns Array of SkillMatch objects, one per requirement
 */
export function matchSkills(
  requirements: DomainRequirement[],
  skills: SkillCapability[],
  deps?: SkillMatcherDeps,
): SkillMatch[] {
  if (requirements.length === 0) return [];

  const computeRelevance = deps?.computeRelevance ?? defaultComputeRelevance;
  const dedupedSkills = deduplicateSkills(skills);
  const matches: SkillMatch[] = [];

  for (const requirement of requirements) {
    let bestSkill: SkillCapability | null = null;
    let bestRelevance = 0;

    for (const skill of dedupedSkills) {
      const relevance = computeRelevance(requirement, skill);
      if (relevance > bestRelevance) {
        bestRelevance = relevance;
        bestSkill = skill;
      }
    }

    const status = classifyStatus(bestRelevance);

    if (status === 'missing' || !bestSkill) {
      // No adequate match found
      matches.push({
        skillName: requirement.category,
        status: 'missing',
        relevance: bestRelevance,
        reason: generateReason('missing', requirement, requirement.category, bestRelevance),
      });
    } else {
      matches.push({
        skillName: bestSkill.name,
        status,
        relevance: bestRelevance,
        reason: generateReason(status, requirement, bestSkill.name, bestRelevance),
        scope: bestSkill.scope,
      });
    }
  }

  return matches;
}
