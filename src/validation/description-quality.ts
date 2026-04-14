import { hasActivationPattern } from './skill-validation.js';

// ============================================================================
// Description Quality Validator (QOL-01 + Phase B CSO discipline)
// ============================================================================

/**
 * Capability statement patterns - action verbs that describe what a skill does.
 * These verbs are *desired* in skill bodies but *anti-patterns* in descriptions
 * (descriptions route by trigger, bodies explain capability).
 */
export const CAPABILITY_PATTERNS: RegExp[] = [
  /\b(guides?|manages?|handles?|provides?|enforces?|validates?|generates?|creates?|configures?|orchestrates?|coordinates?|automates?|monitors?|analyzes?)\b/i,
];

/**
 * Anti-capability patterns — the same verbs as CAPABILITY_PATTERNS, but applied
 * to descriptions as *negative* signals. A capability verb in a description is
 * a CSO violation: the description should say WHEN to trigger, not WHAT the
 * skill does.
 *
 * Each pattern is non-case-sensitive and `g`-flagged so callers can enumerate
 * all matches within a single description pass.
 */
export const ANTI_CAPABILITY_PATTERNS: RegExp[] = [
  /\b(guides?|manages?|handles?|provides?|enforces?|validates?|generates?|creates?|configures?|orchestrates?|coordinates?|automates?|monitors?|analyzes?)\b/i,
];

/**
 * "Use when..." clause pattern - matches the activation context clause.
 */
export const USE_WHEN_PATTERN: RegExp = /\buse when\b/i;

/**
 * Canonical vocabulary list used to deduplicate anti-capability hits.
 */
const CANONICAL_CAPABILITY_VERBS: readonly string[] = [
  'guides',
  'manages',
  'handles',
  'provides',
  'enforces',
  'validates',
  'generates',
  'creates',
  'configures',
  'orchestrates',
  'coordinates',
  'automates',
  'monitors',
  'analyzes',
];

/** Word-count budget for frequently-loaded (always-on) skills. */
const ALWAYS_BUDGET = 200;

/** Word-count budget for on-demand skills. */
const ON_DEMAND_BUDGET = 500;

// ============================================================================
// Public types
// ============================================================================

export type DescriptionFrequency = 'always' | 'on-demand';

export interface DescriptionQualityOptions {
  /** Budget frequency tier; defaults to 'on-demand'. */
  frequency?: DescriptionFrequency;
}

/**
 * PLAN-contract options type (Phase B locked naming).
 * Uses `descriptionFrequency` (camelCase) instead of `frequency` to match
 * the frontmatter field `description-frequency`. Both option shapes are
 * accepted by validate() for backward compatibility.
 */
export interface ValidateDescriptionOptions {
  /** Corresponds to the 'description-frequency' frontmatter field. Defaults to 'on-demand'. */
  descriptionFrequency?: DescriptionFrequency;
}

/**
 * Result of quality assessment for a skill description.
 *
 * Legacy fields preserve backward compatibility. Phase B fields are all
 * optional and additive.
 */
export interface QualityAssessment {
  hasCapabilityStatement: boolean;
  hasUseWhenClause: boolean;
  qualityScore: number;
  suggestions: string[];
  warning?: string;

  // Phase B additions — CSO discipline (existing field names preserved)
  antiCapabilityHits?: string[];
  triggerPurity?: number;
  wordCount?: number;
  wordCountBudgetExceeded?: {
    budget: number;
    actual: number;
    frequency: DescriptionFrequency;
  };

  // Phase B PLAN-contract aliases (locked field names from PLAN.md must_haves)
  /** Alias for antiCapabilityHits; populated identically. */
  antiCapabilityMatches?: string[];
  /** Set when triggerPurity < 0.5; describes the routing-quality failure. */
  triggerPurityWarning?: string;
  /** Human-readable budget violation string; set when wordCountBudgetExceeded is set. */
  wordCountViolation?: string;
}

// ============================================================================
// Validator
// ============================================================================

export class DescriptionQualityValidator {
  validate(
    description: string,
    options: DescriptionQualityOptions | ValidateDescriptionOptions = {},
  ): QualityAssessment {
    // Resolve frequency from either option shape (backward compat + PLAN contract)
    const legacyOpts = options as DescriptionQualityOptions;
    const planOpts = options as ValidateDescriptionOptions;
    const frequency: DescriptionFrequency =
      legacyOpts.frequency ?? planOpts.descriptionFrequency ?? 'on-demand';

    const hasCapabilityStatement = this.detectCapabilityStatement(description);
    const hasUseWhenClause = USE_WHEN_PATTERN.test(description);
    const hasActivation = hasActivationPattern(description);

    let qualityScore = 0;
    if (hasCapabilityStatement) qualityScore += 0.4;
    if (hasUseWhenClause) qualityScore += 0.4;
    if (hasActivation) qualityScore += 0.2;

    const suggestions: string[] = [];
    if (!hasCapabilityStatement) {
      suggestions.push('Start with what this skill does: "Guides TypeScript project setup..."');
    }
    if (!hasUseWhenClause) {
      suggestions.push('Add "Use when..." clause: "Use when creating new TypeScript projects"');
    }

    const warning =
      qualityScore < 0.6
        ? 'Description lacks the recommended "capability + Use when..." pattern'
        : undefined;

    const antiCapabilityHits = extractAntiCapabilityHits(description);
    const triggerPurity = computeTriggerPurity(antiCapabilityHits.length, hasUseWhenClause);
    const wordCount = countWords(description);
    const budget = frequency === 'always' ? ALWAYS_BUDGET : ON_DEMAND_BUDGET;

    let wordCountBudgetExceeded: QualityAssessment['wordCountBudgetExceeded'];
    if (wordCount > budget) {
      wordCountBudgetExceeded = { budget, actual: wordCount, frequency };
    }

    // CSO rewrite suggestions fire only when the legacy scorer is NOT already
    // rewarding the description for a capability statement. This preserves
    // backward compatibility: pre-Phase-B callers that produced zero suggestions
    // for "Guides X. Use when Y." keep producing zero suggestions. CSO findings
    // still surface via antiCapabilityHits + triggerPurity for the new critique
    // stage to consume directly.
    if (!hasCapabilityStatement) {
      for (const verb of antiCapabilityHits) {
        suggestions.push(
          `Move "${verb}" out of description into skill body. Rewrite description as "Use when..." phrasing. Example: "Use when [trigger]"`,
        );
      }
    }
    if (wordCountBudgetExceeded) {
      suggestions.push(
        `Description is ${wordCountBudgetExceeded.actual} words; budget is ${wordCountBudgetExceeded.budget} for ${wordCountBudgetExceeded.frequency} skills. Trim to under ${wordCountBudgetExceeded.budget}.`,
      );
    }

    // PLAN-contract aliases (locked field names from PLAN.md must_haves)
    const antiCapabilityMatches = antiCapabilityHits;
    const triggerPurityWarning =
      triggerPurity < 0.5
        ? `triggerPurity ${triggerPurity.toFixed(2)} below 0.5 — description reads as a capability dump, not a routing trigger`
        : undefined;
    const wordCountViolation = wordCountBudgetExceeded
      ? `${wordCountBudgetExceeded.actual} words exceeds ${wordCountBudgetExceeded.budget}-word budget for ${wordCountBudgetExceeded.frequency === 'always' ? 'always-on' : 'on-demand'} skill descriptions`
      : undefined;

    return {
      hasCapabilityStatement,
      hasUseWhenClause,
      qualityScore,
      suggestions,
      warning,
      antiCapabilityHits,
      triggerPurity,
      wordCount,
      wordCountBudgetExceeded,
      // PLAN-contract aliases
      antiCapabilityMatches,
      triggerPurityWarning,
      wordCountViolation,
    };
  }

  private detectCapabilityStatement(description: string): boolean {
    const hasSentenceStructure = /^[A-Z][a-zA-Z]/.test(description.trim());
    if (!hasSentenceStructure) return false;

    return CAPABILITY_PATTERNS.some(pattern => pattern.test(description));
  }
}

// ============================================================================
// Helpers (module-private, pure)
// ============================================================================

function extractAntiCapabilityHits(description: string): string[] {
  const hits = new Set<string>();
  for (const pattern of ANTI_CAPABILITY_PATTERNS) {
    // Create a global copy for exec-loop iteration (exported pattern has no g flag
    // to avoid stateful .test() issues for external callers).
    const globalPattern = new RegExp(pattern.source, 'gi');
    let match: RegExpExecArray | null;
    while ((match = globalPattern.exec(description)) !== null) {
      const raw = match[0].toLowerCase();
      hits.add(canonicalizeVerb(raw));
    }
  }
  return Array.from(hits);
}

function canonicalizeVerb(raw: string): string {
  if (CANONICAL_CAPABILITY_VERBS.includes(raw)) return raw;
  const plural = raw.endsWith('s') ? raw : `${raw}s`;
  if (CANONICAL_CAPABILITY_VERBS.includes(plural)) return plural;
  return raw;
}

function computeTriggerPurity(hitCount: number, hasUseWhen: boolean): number {
  if (hitCount > 0) {
    return hasUseWhen ? 0.3 : 0.1;
  }
  return hasUseWhen ? 1.0 : 0.6;
}

function countWords(description: string): number {
  const trimmed = description.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}
