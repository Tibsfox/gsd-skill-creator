/**
 * Physical Safety Warden -- 10-domain content safety enforcement.
 *
 * Evaluates user-generated content against 10 physical safety domains:
 * food, plant, tool, medical, structural, fire, chemical, animal, arctic-survival, marine.
 *
 * Three operating modes:
 * 1. ANNOTATE  -- inline safety note, user can proceed
 * 2. GATE      -- explicit acknowledgment required before proceeding
 * 3. REDIRECT  -- content blocked, user redirected to professional resource
 *
 * CRITICAL rules (isCritical=true) always produce canProceed=false regardless
 * of mode. They cannot be overridden (canOverride=false).
 *
 * Usage:
 *   const warden = new SafetyWarden();
 *   const result = warden.evaluate("how to water bath can green beans", SafetyDomain.FOOD);
 *   // result.canProceed === false, result.annotations[0].isCritical === true
 *
 * @module heritage-skills-pack/safety/warden
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  SafetyDomain,
  SafetyLevel,
  Tradition,
  type SafetyRule,
  type SafetyAnnotation,
  RoomNumber,
} from '../shared/types.js';

import { ROOM_DIRECTORY } from '../shared/constants.js';

// ─── Re-export types needed by consumers ─────────────────────────────────────

export { SafetyDomain, SafetyLevel, Tradition, RoomNumber };
export type { SafetyRule, SafetyAnnotation };

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Result of evaluating content against safety rules for a single domain.
 */
export interface SafetyEvaluation {
  /** The domain this evaluation was run against. */
  domain: SafetyDomain;
  /** The worst safety level triggered by any matched rule. */
  level: SafetyLevel;
  /** All safety annotations from matched rules. */
  annotations: SafetyAnnotation[];
  /** Whether content can proceed (false for GATED, REDIRECTED, or any CRITICAL rule). */
  canProceed: boolean;
  /** Acknowledgment strings required before proceeding (populated for GATED). */
  requiredAcknowledgments: string[];
  /** Target resource for redirection (populated for REDIRECTED). */
  redirectTarget?: string;
}

/**
 * Context for determining the operating mode for a domain in a given room.
 */
export interface RoomContext {
  /** The room number being navigated. */
  room: RoomNumber;
  /** Optional tradition filter for the session. */
  tradition?: Tradition;
  /** Session difficulty level. */
  sessionDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Level severity order for "worst level wins" computation. */
const LEVEL_SEVERITY: Record<SafetyLevel, number> = {
  [SafetyLevel.STANDARD]: 0,
  [SafetyLevel.ANNOTATED]: 1,
  [SafetyLevel.GATED]: 2,
  [SafetyLevel.REDIRECTED]: 3,
};

/** Map SafetyDomain values to their rule file names. */
const DOMAIN_TO_FILE: Record<SafetyDomain, string> = {
  [SafetyDomain.FOOD]: 'food-safety.json',
  [SafetyDomain.PLANT]: 'plant-safety.json',
  [SafetyDomain.TOOL]: 'tool-safety.json',
  [SafetyDomain.MEDICAL]: 'medical-safety.json',
  [SafetyDomain.STRUCTURAL]: 'structural-safety.json',
  [SafetyDomain.FIRE]: 'fire-safety.json',
  [SafetyDomain.CHEMICAL]: 'chemical-safety.json',
  [SafetyDomain.ANIMAL]: 'animal-safety.json',
  [SafetyDomain.ARCTIC_SURVIVAL]: 'arctic-survival-safety.json',
  [SafetyDomain.MARINE]: 'marine-safety-rules.json',
};

/** Default redirect target for professional resources. */
const DEFAULT_REDIRECT_TARGET = 'https://www.cdc.gov/niosh/topics/emres/chemagent.html';

/** Domain-specific redirect targets for professional resources. */
const DOMAIN_REDIRECT_TARGETS: Partial<Record<SafetyDomain, string>> = {
  [SafetyDomain.FOOD]: 'https://nchfp.uga.edu/',
  [SafetyDomain.PLANT]:
    'https://www.poison.org/ (Poison Control: 1-800-222-1222)',
  [SafetyDomain.MEDICAL]:
    'Consult a qualified healthcare provider. In emergencies, call 911.',
  [SafetyDomain.CHEMICAL]:
    'https://www.osha.gov/hazardous-materials (Poison Control: 1-800-222-1222)',
  [SafetyDomain.ARCTIC_SURVIVAL]:
    'https://www.itk.ca/ (Inuit Tapiriit Kanatami) or local emergency services',
  [SafetyDomain.MARINE]:
    'Transport Canada Boating Safety: https://tc.canada.ca/boating (Emergency: Coast Guard 1-800-567-5111)',
};

// ─── SafetyWarden ─────────────────────────────────────────────────────────────

/**
 * Physical Safety Warden for the Heritage Skills Educational Pack.
 *
 * Evaluates content against 9 physical safety domains using a pattern-matching
 * engine. Each domain has a set of rules that trigger ANNOTATE, GATE, or
 * REDIRECT responses when a pattern matches the content being evaluated.
 */
export class SafetyWarden {
  private rules: Map<SafetyDomain, SafetyRule[]>;

  constructor() {
    this.rules = new Map();
    this.loadRules();
  }

  // ─── Rule Loading ───────────────────────────────────────────────────────────

  private loadRules(): void {
    const require = createRequire(import.meta.url);
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const rulesDir = join(__dirname, '..', 'shared', 'safety-rules');

    for (const [domain, filename] of Object.entries(DOMAIN_TO_FILE) as [
      SafetyDomain,
      string,
    ][]) {
      const filePath = join(rulesDir, filename);
      const rules = require(filePath) as SafetyRule[];
      this.rules.set(domain, rules);
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Evaluate content against all rules in a single safety domain.
   *
   * @param content    - The text content to evaluate.
   * @param domain     - Which safety domain to evaluate against.
   * @param tradition  - Optional tradition filter; only rules matching this
   *                     tradition (or with no tradition restriction) are applied.
   * @returns          SafetyEvaluation for the domain.
   */
  evaluate(
    content: string,
    domain: SafetyDomain,
    tradition?: Tradition,
  ): SafetyEvaluation {
    const domainRules = this.rules.get(domain) ?? [];

    // Filter rules by tradition if specified.
    // A rule with no traditions array applies to all traditions.
    const applicableRules = tradition
      ? domainRules.filter(
          (rule) => !rule.traditions || rule.traditions.includes(tradition),
        )
      : domainRules;

    // Test each rule's pattern against the content.
    const matchedRules: SafetyRule[] = [];
    for (const rule of applicableRules) {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(content)) {
        matchedRules.push(rule);
      }
    }

    // No matches -- return STANDARD evaluation.
    if (matchedRules.length === 0) {
      return {
        domain,
        level: SafetyLevel.STANDARD,
        annotations: [],
        canProceed: true,
        requiredAcknowledgments: [],
      };
    }

    // Determine the worst level among all matched rules.
    let worstLevel = SafetyLevel.STANDARD;
    let hasCritical = false;

    for (const rule of matchedRules) {
      if (LEVEL_SEVERITY[rule.level] > LEVEL_SEVERITY[worstLevel]) {
        worstLevel = rule.level;
      }
      if (rule.annotation.isCritical) {
        hasCritical = true;
      }
    }

    // Collect annotations from all matched rules.
    const annotations: SafetyAnnotation[] = matchedRules.map(
      (rule) => rule.annotation,
    );

    // Build the evaluation based on worst level.
    return this.buildEvaluation(domain, worstLevel, hasCritical, annotations);
  }

  /**
   * Evaluate content against multiple safety domains simultaneously.
   *
   * Returns one SafetyEvaluation per requested domain. Each evaluation is
   * independent -- the "worst mode wins" rule applies within each domain.
   *
   * @param content    - The text content to evaluate.
   * @param domains    - Array of safety domains to evaluate against.
   * @param tradition  - Optional tradition filter.
   * @returns          Array of SafetyEvaluation, one per domain.
   */
  evaluateMultiDomain(
    content: string,
    domains: SafetyDomain[],
    tradition?: Tradition,
  ): SafetyEvaluation[] {
    return domains.map((domain) => this.evaluate(content, domain, tradition));
  }

  /**
   * Return all CRITICAL rules for a given domain.
   *
   * CRITICAL rules are those where annotation.isCritical === true. These rules
   * always set canProceed=false and cannot be overridden.
   *
   * @param domain - The safety domain to query.
   * @returns      Array of SafetyRule objects with isCritical=true.
   */
  getCriticalRules(domain: SafetyDomain): SafetyRule[] {
    const domainRules = this.rules.get(domain) ?? [];
    return domainRules.filter((rule) => rule.annotation.isCritical);
  }

  /**
   * Determine the operating mode for a domain given room context.
   *
   * Critical rooms (FOOD=05, PLANTS=09, ARCTIC_LIVING=14) always receive
   * at minimum GATED treatment. Beginner difficulty elevates ANNOTATED to
   * GATED for heightened caution.
   *
   * @param domain  - The safety domain.
   * @param context - Room context including room number, tradition, and difficulty.
   * @returns       The SafetyLevel operating mode for this domain in this context.
   */
  getDomainMode(domain: SafetyDomain, context: RoomContext): SafetyLevel {
    // Check if the room is critical.
    const roomEntry = ROOM_DIRECTORY.find((entry) => entry.room === context.room);
    const isRoomCritical = roomEntry?.isCritical ?? false;

    // Critical rooms: domains present in that room get GATED as minimum.
    if (isRoomCritical && roomEntry?.safetyDomains.includes(domain)) {
      // For REDIRECTED-capable domains (FOOD botulism, PLANT ID) in critical rooms,
      // keep REDIRECTED as the max. Otherwise GATED is minimum.
      return SafetyLevel.GATED;
    }

    // Beginner difficulty: elevate ANNOTATED to GATED for extra caution.
    if (context.sessionDifficulty === 'beginner') {
      // Beginner users in non-critical contexts get GATED instead of ANNOTATED.
      // STANDARD remains STANDARD (non-safety content).
      return SafetyLevel.GATED;
    }

    // Default: ANNOTATED for most contexts.
    return SafetyLevel.ANNOTATED;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Build a SafetyEvaluation from computed level, critical flag, and annotations.
   */
  private buildEvaluation(
    domain: SafetyDomain,
    level: SafetyLevel,
    hasCritical: boolean,
    annotations: SafetyAnnotation[],
  ): SafetyEvaluation {
    // CRITICAL rules always block regardless of level.
    const canProceed = hasCritical ? false : level === SafetyLevel.ANNOTATED;

    switch (level) {
      case SafetyLevel.ANNOTATED:
        return {
          domain,
          level,
          annotations,
          canProceed,
          requiredAcknowledgments: [],
        };

      case SafetyLevel.GATED: {
        const requiredAcknowledgments = annotations
          .filter((a) => a.level === SafetyLevel.GATED || a.isCritical)
          .map((a) => a.message);
        return {
          domain,
          level,
          annotations,
          canProceed: false,
          requiredAcknowledgments,
        };
      }

      case SafetyLevel.REDIRECTED: {
        // Use domain-specific redirect target, fall back to default.
        const redirectTarget =
          DOMAIN_REDIRECT_TARGETS[domain] ?? DEFAULT_REDIRECT_TARGET;
        const requiredAcknowledgments = annotations
          .filter((a) => a.level === SafetyLevel.GATED)
          .map((a) => a.message);
        return {
          domain,
          level,
          annotations,
          canProceed: false,
          requiredAcknowledgments,
          redirectTarget,
        };
      }

      default:
        // STANDARD: no matches (handled earlier, but satisfy TS exhaustiveness)
        return {
          domain,
          level: SafetyLevel.STANDARD,
          annotations: [],
          canProceed: true,
          requiredAcknowledgments: [],
        };
    }
  }
}
