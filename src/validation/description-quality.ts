import { hasActivationPattern } from './skill-validation.js';

// ============================================================================
// Description Quality Validator (QOL-01)
// ============================================================================

/**
 * Capability statement patterns - action verbs that describe what a skill does.
 * A capability statement is a sentence starting with a capital letter that
 * contains an action verb describing what the skill provides.
 */
export const CAPABILITY_PATTERNS: RegExp[] = [
  /\b(guides?|manages?|handles?|provides?|enforces?|validates?|generates?|creates?|configures?|orchestrates?|coordinates?|automates?|monitors?|analyzes?)\b/i,
];

/**
 * "Use when..." clause pattern - matches the activation context clause.
 */
export const USE_WHEN_PATTERN: RegExp = /\buse when\b/i;

/**
 * Result of quality assessment for a skill description.
 */
export interface QualityAssessment {
  /** Whether the description contains a capability statement (action verb describing what skill does) */
  hasCapabilityStatement: boolean;
  /** Whether the description contains a "Use when..." clause */
  hasUseWhenClause: boolean;
  /** Composite quality score 0-1: 0.4 capability + 0.4 use-when + 0.2 activation triggers */
  qualityScore: number;
  /** Actionable improvement suggestions */
  suggestions: string[];
  /** Warning message when qualityScore < 0.6 */
  warning?: string;
}

/**
 * Validates description quality by detecting capability statements,
 * "Use when..." clauses, and activation triggers.
 *
 * Scoring: 0.4 for capability statement + 0.4 for Use when clause + 0.2 for activation triggers.
 */
export class DescriptionQualityValidator {
  /**
   * Validate a skill description and return a quality assessment.
   *
   * @param description - The skill description to validate
   * @returns Quality assessment with score, flags, and suggestions
   */
  validate(description: string): QualityAssessment {
    const hasCapabilityStatement = this.detectCapabilityStatement(description);
    const hasUseWhenClause = USE_WHEN_PATTERN.test(description);
    const hasActivation = hasActivationPattern(description);

    // Composite score: 0.4 capability + 0.4 use-when + 0.2 activation
    let qualityScore = 0;
    if (hasCapabilityStatement) qualityScore += 0.4;
    if (hasUseWhenClause) qualityScore += 0.4;
    if (hasActivation) qualityScore += 0.2;

    // Generate suggestions for missing components
    const suggestions: string[] = [];
    if (!hasCapabilityStatement) {
      suggestions.push('Start with what this skill does: "Guides TypeScript project setup..."');
    }
    if (!hasUseWhenClause) {
      suggestions.push('Add "Use when..." clause: "Use when creating new TypeScript projects"');
    }

    // Warning for low quality
    const warning = qualityScore < 0.6
      ? 'Description lacks the recommended "capability + Use when..." pattern'
      : undefined;

    return {
      hasCapabilityStatement,
      hasUseWhenClause,
      qualityScore,
      suggestions,
      warning,
    };
  }

  /**
   * Detect whether description contains a capability statement.
   * A capability statement uses an action verb to describe what the skill does.
   */
  private detectCapabilityStatement(description: string): boolean {
    // Must be a proper sentence (starts with capital letter and has substance)
    const hasSentenceStructure = /^[A-Z][a-zA-Z]/.test(description.trim());
    if (!hasSentenceStructure) return false;

    return CAPABILITY_PATTERNS.some(pattern => pattern.test(description));
  }
}
