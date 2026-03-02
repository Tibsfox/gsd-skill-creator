/**
 * CulturalSovereigntyWarden -- ethical enforcement layer for Indigenous content.
 *
 * Classifies heritage content into 4 cultural sovereignty levels and enforces
 * OCAP, IQ, CARE, and UNDRIP compliance. Every room containing Indigenous
 * content must pass cultural sovereignty checks before content is generated.
 *
 * Level 4 sacred/ceremonial content is a HARD BLOCK with no override path.
 * This is the non-negotiable ethical backbone of the Heritage Skills pack.
 *
 * Classification levels:
 * - Level 1 (PUBLICLY_SHARED):    Include with attribution
 * - Level 2 (CONTEXTUALLY_SHARED): Summarize and refer to community sources
 * - Level 3 (COMMUNITY_RESTRICTED): Acknowledge and redirect, do not include
 * - Level 4 (SACRED_CEREMONIAL):  HARD BLOCK — no referralTarget, no override
 *
 * @module heritage-skills-pack/safety/cultural-warden
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { CulturalSovereigntyLevel, Tradition } from '../shared/types.js';
import type { CulturalSovereigntyRule } from '../shared/types.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Exported Interfaces ──────────────────────────────────────────────────────

/**
 * Classification result for a piece of heritage content.
 *
 * For Level 4 (SACRED_CEREMONIAL): action is always 'block', referralTarget
 * is always undefined. There is no override path for Level 4.
 */
export interface CulturalClassification {
  level: CulturalSovereigntyLevel;
  tradition: Tradition;
  nation?: string;
  action: 'include' | 'summarize-and-refer' | 'acknowledge-and-redirect' | 'block';
  referralTarget?: string;
  explanation: string;
}

/**
 * Result of a nation attribution check on content.
 */
export interface AttributionCheck {
  passed: boolean;
  violations: AttributionViolation[];
}

/**
 * A specific attribution violation found in content.
 */
export interface AttributionViolation {
  /** The exact text fragment that triggered the violation. */
  text: string;
  /** The type of attribution issue detected. */
  issue: 'pan-indigenous-language' | 'missing-nation' | 'incorrect-attribution';
  /** A concrete suggestion for how to correct the attribution. */
  suggestion: string;
}

// ─── Internal Types ───────────────────────────────────────────────────────────

/** Raw shape of a rule as loaded from JSON (level is a number 1–4). */
interface RawRule {
  id: string;
  level: 1 | 2 | 3 | 4;
  tradition: string;
  domain: string;
  action: 'include' | 'summarize-and-refer' | 'acknowledge-and-redirect' | 'block';
  referralTarget?: string;
  explanation: string;
}

/** Internal normalized rule with typed level and tradition. */
interface NormalizedRule extends Omit<CulturalSovereigntyRule, 'tradition'> {
  tradition: Tradition;
}

// ─── Pan-Indigenous Language Patterns ─────────────────────────────────────────

/**
 * Patterns that indicate pan-Indigenous generalization rather than nation-specific attribution.
 * Each entry includes the regex pattern, the issue type, and a correction suggestion.
 */
const PAN_INDIGENOUS_PATTERNS: Array<{
  pattern: RegExp;
  extractMatch: (m: RegExpMatchArray) => string;
  suggestion: string;
}> = [
  {
    pattern: /\bNative American\b/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Specify the nation (e.g., "Lakota", "Cherokee", "Ojibwe"). "Native American" erases distinct nations and their sovereignty.',
  },
  {
    pattern: /\bIndigenous peoples? believed\b/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Attribute to the specific nation (e.g., "Cree knowledge holders have documented..."). Different nations hold different knowledge systems.',
  },
  {
    pattern: /\bIndigenous peoples? thought\b/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Attribute to the specific nation (e.g., "Haudenosaunee tradition holds..."). "Indigenous peoples thought" erases nation-specific knowledge.',
  },
  {
    pattern: /\bAboriginal tradition\b/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Specify the nation and tradition (e.g., "Anishinaabe tradition" or "Inuit tradition"). "Aboriginal tradition" is a pan-colonial generalization.',
  },
  {
    pattern: /\bAboriginal peoples?\b/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Use the nation-specific name (e.g., "Mi\'kmaq people", "Inuit", "Métis"). "Aboriginal peoples" is a colonial umbrella term.',
  },
  {
    pattern: /\bthe First Nations\b(?!\s+(?:Act|land|government|of\s+Canada|communities?\s+of))/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Specify the nation (e.g., "the Cree Nation", "the Algonquin people"). "The First Nations" without a specific nation is a pan-Indigenous generalization.',
  },
  {
    pattern: /\bFirst Nations people\b(?!\s+of\s+\w)/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Specify the nation (e.g., "Anishinaabe people" or "Dene people"). Provide nation-specific attribution.',
  },
  {
    pattern: /\bIndians?\b(?=\s+(?:believed|thought|practiced|used|made|built|ate|hunted))/gi,
    extractMatch: (m) => m[0],
    suggestion:
      'Use the specific nation name (e.g., "Haudenosaunee" or "Ojibwe"). The term "Indians" applied to cultural practices erases specific nations.',
  },
];

// ─── OCAP Compliance Patterns ──────────────────────────────────────────────────

/** Phrases that indicate a claim of ownership over Indigenous knowledge (OCAP violation). */
const OCAP_VIOLATION_PATTERNS = [
  /\bour Indigenous knowledge\b/i,
  /\bwe discovered\b.*\bIndigenous\b/i,
  /\bwe have developed\b.*\btraditional\b/i,
  /\bproprietary\b.*\bIndigenous\b/i,
  /\bown\b.*\bIndigenous knowledge\b/i,
];

/** Phrases that indicate content has proper community framing (OCAP positive signals). */
const OCAP_POSITIVE_PATTERNS = [
  /\bwith permission\b/i,
  /\bcommunity-authorized\b/i,
  /\battribut(?:ed?|ion) to\b/i,
  /\baccording to\b.*\b(nation|community|elder|people|tradition)\b/i,
  /\bshared by\b/i,
  /\bdocumented (?:by|with)\b.*\b(community|nation|people)\b/i,
];

// ─── IQ Alignment Patterns ─────────────────────────────────────────────────────

/** Specific IQ principle names that indicate proper IQ framing. */
const IQ_PRINCIPLE_NAMES = [
  'Inuuqatigiitsiarniq',
  'Tunnganarniq',
  'Pijitsirniq',
  'Aajiiqatigiinniq',
  'Pilimmaksarniq',
  'Piliriqatigiinniq',
  'Qanuqtuurniq',
  'Avatittinnik Kamatsiarniq',
  'Inuit Qaujimajatuqangit',
  'IQ principles',
];

/** Generic framing that reduces IQ to vague beliefs (IQ alignment violation). */
const IQ_GENERIC_PATTERNS = [
  /\bInuit beliefs?\b/i,
  /\bInuit traditions?\b/i,
  /\bInuit thought\b/i,
  /\bInuit believed\b/i,
  /\btraditional Inuit ways?\b/i,
];

// ─── Action Map ───────────────────────────────────────────────────────────────

/** Maps CulturalSovereigntyLevel to the canonical action string. */
const LEVEL_TO_ACTION: Record<
  CulturalSovereigntyLevel,
  'include' | 'summarize-and-refer' | 'acknowledge-and-redirect' | 'block'
> = {
  [CulturalSovereigntyLevel.PUBLICLY_SHARED]: 'include',
  [CulturalSovereigntyLevel.CONTEXTUALLY_SHARED]: 'summarize-and-refer',
  [CulturalSovereigntyLevel.COMMUNITY_RESTRICTED]: 'acknowledge-and-redirect',
  [CulturalSovereigntyLevel.SACRED_CEREMONIAL]: 'block',
};

// ─── Default Classifications ───────────────────────────────────────────────────

/** Default action explanations when no specific rule matches. */
const DEFAULT_EXPLANATIONS: Record<CulturalSovereigntyLevel, string> = {
  [CulturalSovereigntyLevel.PUBLICLY_SHARED]:
    'Content classified as publicly shared. Include with specific nation attribution.',
  [CulturalSovereigntyLevel.CONTEXTUALLY_SHARED]:
    'Content classified as contextually shared. Summarize and refer to community educational resources.',
  [CulturalSovereigntyLevel.COMMUNITY_RESTRICTED]:
    'Content classified as community restricted. Acknowledge existence only; redirect to community contacts.',
  [CulturalSovereigntyLevel.SACRED_CEREMONIAL]:
    'HARD BLOCK: Sacred or ceremonial content. No description, referral, or reproduction permitted.',
};

// ─── CulturalSovereigntyWarden ─────────────────────────────────────────────────

/**
 * Enforces cultural sovereignty classification for all heritage content.
 *
 * Loads classification and protocol rules from JSON files and provides
 * five enforcement methods:
 *
 * 1. `classify` — classify content into one of 4 sovereignty levels
 * 2. `enforceNationAttribution` — detect pan-Indigenous language and missing attribution
 * 3. `checkOCAPCompliance` — verify OCAP principles are respected
 * 4. `checkIQAlignment` — verify Inuit content uses IQ framing, not generic "Inuit beliefs"
 * 5. `getRedirectionTarget` — return community resource for a tradition + domain
 *
 * Level 4 (SACRED_CEREMONIAL) is a HARD BLOCK. The classify method NEVER returns
 * a referralTarget for Level 4 content, and there is no override path.
 */
export class CulturalSovereigntyWarden {
  private classificationRules: NormalizedRule[];
  private fnProtocols: NormalizedRule[];
  private inuitProtocols: NormalizedRule[];

  constructor() {
    const rulesDir = join(__dirname, '..', 'shared', 'cultural-sovereignty-rules');

    this.classificationRules = this.loadRules(
      join(rulesDir, 'knowledge-classification.json'),
    );
    this.fnProtocols = this.loadRules(join(rulesDir, 'first-nations-protocols.json'));
    this.inuitProtocols = this.loadRules(join(rulesDir, 'inuit-protocols.json'));
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private loadRules(filePath: string): NormalizedRule[] {
    const raw: RawRule[] = require(filePath) as RawRule[];
    return raw.map((r) => ({
      id: r.id,
      level: r.level as unknown as CulturalSovereigntyLevel,
      tradition: this.parseTradition(r.tradition),
      domain: r.domain,
      action: r.action,
      referralTarget: r.referralTarget,
      explanation: r.explanation,
    }));
  }

  private parseTradition(value: string): Tradition {
    switch (value) {
      case 'appalachian':
        return Tradition.APPALACHIAN;
      case 'first-nations':
        return Tradition.FIRST_NATIONS;
      case 'inuit':
        return Tradition.INUIT;
      default:
        return Tradition.CROSS_TRADITION;
    }
  }

  /**
   * Return the rule set(s) relevant to a given tradition.
   * CROSS_TRADITION rules always apply; tradition-specific rules layer on top.
   */
  private rulesForTradition(tradition: Tradition): NormalizedRule[] {
    const base = this.classificationRules.filter(
      (r) => r.tradition === Tradition.CROSS_TRADITION || r.tradition === tradition,
    );

    switch (tradition) {
      case Tradition.FIRST_NATIONS:
        return [...base, ...this.fnProtocols];
      case Tradition.INUIT:
        return [...base, ...this.inuitProtocols];
      default:
        return base;
    }
  }

  /**
   * Find matching rules for a tradition + domain combination.
   * Matching is hierarchical: exact domain match > "general" fallback.
   */
  private findMatchingRules(tradition: Tradition, domain: string): NormalizedRule[] {
    const pool = this.rulesForTradition(tradition);
    const exact = pool.filter((r) => r.domain === domain);
    if (exact.length > 0) return exact;
    return pool.filter((r) => r.domain === 'general');
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Classify content according to cultural sovereignty levels.
   *
   * Returns the most restrictive (highest-numbered) level found for the
   * given tradition and domain combination. Level 4 ALWAYS returns
   * action='block' with no referralTarget and no override path.
   *
   * @param content - The content string to classify (used for context; domain drives classification)
   * @param tradition - The cultural tradition of the content
   * @param domain - The knowledge domain of the content
   * @returns CulturalClassification with the most restrictive level applicable
   */
  classify(content: string, tradition: Tradition, domain: string): CulturalClassification {
    const matchingRules = this.findMatchingRules(tradition, domain);

    if (matchingRules.length === 0) {
      // No matching rule — apply most conservative interpretation for non-Appalachian traditions
      const conservativeLevel =
        tradition !== Tradition.APPALACHIAN
          ? CulturalSovereigntyLevel.CONTEXTUALLY_SHARED
          : CulturalSovereigntyLevel.PUBLICLY_SHARED;
      return {
        level: conservativeLevel,
        tradition,
        action: LEVEL_TO_ACTION[conservativeLevel],
        explanation: DEFAULT_EXPLANATIONS[conservativeLevel],
      };
    }

    // Apply the most restrictive (highest) level found
    const mostRestrictive = matchingRules.reduce((highest, rule) =>
      (rule.level as unknown as number) > (highest.level as unknown as number) ? rule : highest,
    );

    const level = mostRestrictive.level as unknown as CulturalSovereigntyLevel;

    // Level 4: HARD BLOCK — no referralTarget, no override
    if (level === CulturalSovereigntyLevel.SACRED_CEREMONIAL) {
      return {
        level: CulturalSovereigntyLevel.SACRED_CEREMONIAL,
        tradition,
        action: 'block',
        // referralTarget intentionally omitted — no override path for Level 4
        explanation: mostRestrictive.explanation,
      };
    }

    return {
      level,
      tradition,
      action: LEVEL_TO_ACTION[level],
      referralTarget: mostRestrictive.referralTarget,
      explanation: mostRestrictive.explanation,
    };
  }

  /**
   * Scan content for pan-Indigenous language patterns and missing nation attribution.
   *
   * Detects:
   * - "Native American" (pan-Indigenous generalization)
   * - "Indigenous peoples believed/thought" (pan-Indigenous attribution)
   * - "Aboriginal tradition/peoples" (colonial umbrella terms)
   * - "the First Nations" / "First Nations people" (without specific nation)
   * - "Indians" in cultural context (pan-Indigenous term)
   *
   * @param content - The content string to scan
   * @returns AttributionCheck with passed flag and list of violations
   */
  enforceNationAttribution(content: string): AttributionCheck {
    const violations: AttributionViolation[] = [];

    for (const { pattern, extractMatch, suggestion } of PAN_INDIGENOUS_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        violations.push({
          text: extractMatch(match),
          issue: 'pan-indigenous-language',
          suggestion,
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Check that content respects OCAP principles:
   * - Ownership: credit to originating community
   * - Control: community-approved usage framing
   * - Access: appropriate level restrictions respected
   * - Possession: no unauthorized reproduction of restricted content
   *
   * Returns true if the content appears OCAP-compliant.
   * Returns false if the content contains ownership or control violations.
   *
   * @param content - The content string to check
   * @returns true if OCAP principles appear to be respected
   */
  checkOCAPCompliance(content: string): boolean {
    // Check for explicit OCAP violations (claiming ownership of Indigenous knowledge)
    for (const pattern of OCAP_VIOLATION_PATTERNS) {
      if (pattern.test(content)) {
        return false;
      }
    }

    // If content references Indigenous/First Nations/Inuit material,
    // check for positive OCAP signals (attribution, community authorization)
    const referencesIndigenousContent =
      /\b(Indigenous|First Nations|Inuit|Métis|Aboriginal|traditional knowledge|cultural knowledge)\b/i.test(
        content,
      );

    if (referencesIndigenousContent) {
      return OCAP_POSITIVE_PATTERNS.some((p) => p.test(content));
    }

    // Content does not reference Indigenous material — no OCAP concern
    return true;
  }

  /**
   * Check that Inuit content aligns with Inuit Qaujimajatuqangit (IQ) principles.
   *
   * Returns true if content:
   * - References a specific IQ principle by name, OR
   * - Uses the IQ framework explicitly (e.g., "Inuit Qaujimajatuqangit")
   *
   * Returns false if content:
   * - Uses generic "Inuit beliefs" / "Inuit traditions" framing without IQ specificity
   *
   * @param content - The content string to check
   * @returns true if content aligns with IQ principles or does not reference Inuit knowledge
   */
  checkIQAlignment(content: string): boolean {
    const referencesInuitKnowledge =
      /\b(Inuit|Inuktitut|Inuinnaqtun|IQ\b|Qaujimajatuqangit)\b/i.test(content);

    if (!referencesInuitKnowledge) {
      // Content does not reference Inuit knowledge — no IQ concern
      return true;
    }

    // Check for generic IQ-violating framing
    for (const pattern of IQ_GENERIC_PATTERNS) {
      if (pattern.test(content)) {
        return false;
      }
    }

    // Check for specific IQ principle references (positive signal)
    const hasIQPrinciple = IQ_PRINCIPLE_NAMES.some((name) =>
      content.toLowerCase().includes(name.toLowerCase()),
    );

    return hasIQPrinciple;
  }

  /**
   * Return the community resource redirection target for a given tradition and domain.
   *
   * Looks up the referralTarget from loaded protocol rules. Returns undefined
   * for traditions without specific protocols (e.g., Appalachian), for Level 4
   * sacred domains, or when no matching rule has a referralTarget.
   *
   * @param tradition - The cultural tradition
   * @param domain - The knowledge domain
   * @returns The referral target string, or undefined if not applicable
   */
  getRedirectionTarget(tradition: Tradition, domain: string): string | undefined {
    const pool = this.rulesForTradition(tradition);
    const domainRules = pool.filter((r) => r.domain === domain && r.tradition === tradition);
    const fallbackRules = pool.filter((r) => r.domain === domain);

    const candidates = domainRules.length > 0 ? domainRules : fallbackRules;

    // Level 4 rules intentionally have no referralTarget
    const nonSacred = candidates.filter(
      (r) => (r.level as unknown as number) < 4 && r.referralTarget !== undefined,
    );

    if (nonSacred.length === 0) return undefined;

    // Return the referral target from the most restrictive non-sacred rule
    const best = nonSacred.reduce((highest, rule) =>
      (rule.level as unknown as number) > (highest.level as unknown as number) ? rule : highest,
    );

    return best.referralTarget;
  }
}
