// === MFE Skill Type ===
//
// Defines the mathematical-foundation skill type for integration with
// skill-creator's 6-stage pipeline. Detects mathematical structure in
// problem descriptions and provides tiered knowledge loading metadata.
//
// This module is the skill type definition only. Pipeline hook wiring
// (insertAfter/insertBefore) is handled by pipeline-hooks.ts.

import { classifyProblem } from '../packs/engines/plane-classifier.js';
import type { DomainId } from '../core/types/mfe-types.js';
import type { ScoredSkill } from '../core/types/application.js';

// === Knowledge Tiers ===

export type KnowledgeTier = 'summary' | 'active' | 'reference';

export interface TierMetadata {
  name: KnowledgeTier;
  maxTokens: number;
  alwaysLoad: boolean;
  productionLoad?: boolean;
}

// === Configuration ===

export interface MfeSkillConfig {
  skillName: string;
  confidenceThreshold: number;
}

const DEFAULT_CONFIG: MfeSkillConfig = {
  skillName: 'mathematical-foundation',
  confidenceThreshold: 0.2,
};

// === Tier metadata definitions ===

const TIER_METADATA: Record<KnowledgeTier, TierMetadata> = {
  summary: {
    name: 'summary',
    maxTokens: 4000,
    alwaysLoad: true,
  },
  active: {
    name: 'active',
    maxTokens: 15000,
    alwaysLoad: false,
  },
  reference: {
    name: 'reference',
    maxTokens: 40000,
    alwaysLoad: false,
    productionLoad: false,
  },
};

// === MFE Skill Type ===

export class MfeSkillType {
  private readonly config: MfeSkillConfig;

  constructor(config?: Partial<MfeSkillConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Score a problem description for mathematical content.
   *
   * Delegates to the plane classifier and converts the PlaneClassification
   * to a ScoredSkill. Score formula:
   *   classification.confidence * (1 + 0.1 * activatedDomains.length)
   * clamped to [0, 1]. Returns score 0 if below confidence threshold.
   */
  score(input: string): ScoredSkill {
    const classification = classifyProblem(input);

    // Below threshold: no activation
    if (classification.confidence < this.config.confidenceThreshold) {
      return {
        name: this.config.skillName,
        score: 0,
        matchType: 'intent',
      };
    }

    // Score: confidence * (1 + 0.1 * domainCount), clamped to [0, 1]
    const domainBoost = 1 + 0.1 * classification.activatedDomains.length;
    const rawScore = classification.confidence * domainBoost;
    const score = Math.min(1.0, Math.max(0.0, rawScore));

    return {
      name: this.config.skillName,
      score,
      matchType: 'intent',
    };
  }

  /**
   * Get metadata for a specific knowledge tier.
   */
  getTierMetadata(tier: KnowledgeTier): TierMetadata {
    return { ...TIER_METADATA[tier] };
  }

  /**
   * Get a description of active-tier content for the given domains.
   * Returns a human-readable string describing what would be loaded.
   */
  getActiveTierForDomains(domains: DomainId[]): string {
    if (domains.length === 0) {
      return 'No domains specified for active tier loading.';
    }

    const domainList = domains
      .map(d => `  - ${d}: primitives, composition rules, dependency edges`)
      .join('\n');

    return [
      `Active tier content for ${domains.length} domain(s):`,
      domainList,
      `Includes: key primitives, formal statements, composition rules, cross-domain links.`,
      `Estimated tokens: ~${domains.length * 1500} per domain.`,
    ].join('\n');
  }

  /**
   * Get the configured skill name.
   */
  getSkillName(): string {
    return this.config.skillName;
  }
}

// === Detection ===

/**
 * Lightweight detection check for mathematical structure in input.
 *
 * Delegates to classifyProblem and returns true if confidence > 0
 * AND at least one domain was activated. Returns false for empty/whitespace input.
 */
export function detectMathematicalStructure(input: string): boolean {
  if (!input || !input.trim()) {
    return false;
  }

  const classification = classifyProblem(input);
  return classification.confidence > 0 && classification.activatedDomains.length > 0;
}

// === Factory ===

/**
 * Create a new MfeSkillType instance with optional config overrides.
 */
export function createMfeSkillType(config?: Partial<MfeSkillConfig>): MfeSkillType {
  return new MfeSkillType(config);
}
