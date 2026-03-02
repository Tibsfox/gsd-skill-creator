/**
 * Physical Safety Warden for the Mind-Body department.
 *
 * Extends the Safety Warden pattern (annotate/gate/redirect) with
 * physical safety rules for movement-based practices. Three modes:
 *
 * 1. ANNOTATE (default): Adds alignment cues, injury risk flags, and
 *    warm-up reminders to movement guidance.
 * 2. GATE (medical/injury): Blocks recommendations based on declared
 *    conditions, provides modifications from the medical conditions database.
 * 3. REDIRECT (partner/combat): Substitutes school-finding guidance.
 *    Partner-technique boundary is ABSOLUTE.
 *
 * @module departments/mind-body/safety/physical-safety-warden
 */

import { medicalConditions, isContraindicated, getConditionModifications } from './medical-conditions.js';
import { isPartnerTechniqueRequest, getRedirectResponse, getSchoolFindingAdvice } from './partner-boundary.js';
import { validateClaim, findClaimCategory } from './evidence-citations.js';

import type { Modification } from './medical-conditions.js';
import type { ClaimValidation } from './evidence-citations.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Context for movement content being evaluated. */
export interface MovementContext {
  /** Which module/wing this content belongs to */
  module: string;

  /** The specific technique being described */
  technique: string;

  /** User-declared conditions (condition IDs or names) */
  userConditions: string[];
}

/** A single safety annotation added to content. */
export interface SafetyAnnotation {
  /** Type of annotation */
  type: 'alignment' | 'injury-risk' | 'warm-up' | 'modification';

  /** The annotation message */
  message: string;

  /** Severity: info for reminders, warning for risks */
  severity: 'info' | 'warning';
}

/** Result of annotate mode: original content plus safety annotations. */
export interface AnnotatedContent {
  /** The original content, unmodified */
  original: string;

  /** Safety annotations to display alongside the content */
  annotations: SafetyAnnotation[];
}

/** Result of gate mode: whether content is allowed and any modifications. */
export interface GateResult {
  /** Whether the content is allowed for the user's conditions */
  allowed: boolean;

  /** Modifications to offer if content is gated */
  modifications: string[];

  /** Reason for gating (empty string if allowed) */
  reason: string;
}

/** Result of redirect mode: whether the query was redirected. */
export interface RedirectResult {
  /** Whether the query was redirected */
  redirected: boolean;

  /** The response (redirect text or empty string) */
  response: string;

  /** Structured school-finding advice */
  schoolFindingAdvice: string;
}

/** Result of checking a health claim against evidence. */
export interface ClaimCheck {
  /** Whether the claim is supported by evidence */
  supported: boolean;

  /** Whether the claim overclaims beyond evidence scope */
  overclaimed: boolean;

  /** The suggested reframing if overclaimed */
  suggestedReframing?: string;

  /** The evidence category matched */
  category?: string;

  /** Full validation details */
  validation?: ClaimValidation;
}

// ─── Safety Knowledge Base ──────────────────────────────────────────────────

/**
 * Alignment cues for common poses and techniques.
 * Key: lowercase technique/pose name fragment.
 * Value: alignment reminder text.
 */
const ALIGNMENT_CUES: Map<string, string> = new Map([
  ['warrior ii', 'Keep the front knee aligned over the ankle — letting it drift inward stresses the joint'],
  ['warrior 2', 'Keep the front knee aligned over the ankle — letting it drift inward stresses the joint'],
  ['virabhadrasana ii', 'Keep the front knee aligned over the ankle — letting it drift inward stresses the joint'],
  ['warrior i', 'Square the hips forward and keep the back heel grounded for stability'],
  ['downward dog', 'Press through the full hand to protect the wrists; bend the knees if hamstrings are tight'],
  ['chaturanga', 'Keep elbows close to the body and do not let shoulders dip below elbow height'],
  ['plank', 'Engage the core and keep hips in line with shoulders — no sagging or piking'],
  ['tree pose', 'Place the foot on the inner thigh or calf — never on the knee joint'],
  ['forward fold', 'Bend the knees generously if the hamstrings are tight to protect the lower back'],
  ['headstand', 'Bear weight on the forearms, not the head — this is an advanced inversion requiring instructor guidance'],
  ['cobra', 'Keep the elbows slightly bent and shoulders away from the ears; do not compress the lower back'],
  ['bridge', 'Press through the feet evenly and keep the knees aligned over the ankles'],
  ['triangle', 'Lengthen the side body rather than collapsing toward the floor'],
  ['lotus', 'This is an advanced hip opener — never force the knees. Try half-lotus or simple cross-legged seat instead'],
]);

/**
 * Common injury risks for techniques.
 * Key: lowercase technique/pose name fragment.
 * Value: injury risk description.
 */
const INJURY_RISKS: Map<string, string> = new Map([
  ['hamstring stretch', 'Overstretching the hamstrings can cause microtears — ease into the stretch gradually and never bounce'],
  ['deep forward fold', 'Rounding the lower back under load risks disc injury — maintain a long spine or bend the knees'],
  ['headstand', 'Cervical spine compression is a serious risk — this pose should only be attempted with instructor guidance'],
  ['full wheel', 'Excessive lumbar compression — build up through bridge pose first and ensure adequate shoulder mobility'],
  ['lotus', 'Forcing the knees into lotus risks meniscus and ligament damage — hip flexibility develops gradually over months'],
  ['breath of fire', 'Rapid breathing can cause hyperventilation and lightheadedness — stop if you feel dizzy'],
  ['shoulderstand', 'Weight on the cervical spine requires careful alignment — use blankets under the shoulders'],
  ['deep twist', 'Twisting aggressively can strain intercostal muscles — rotate from the core, not the arms'],
]);

/**
 * Techniques/contexts that should include a warm-up reminder.
 */
const WARM_UP_TRIGGERS: string[] = [
  'dynamic',
  'power yoga',
  'vinyasa',
  'sun salutation',
  'surya namaskar',
  'strength',
  'advanced',
  'intensive',
  'deep stretch',
  'backbend',
  'inversion',
  'balance sequence',
];

// ─── PhysicalSafetyWarden ───────────────────────────────────────────────────

/**
 * Physical Safety Warden for mind-body movement content.
 *
 * Provides three safety modes: annotate, gate, and redirect.
 */
export class PhysicalSafetyWarden {
  /**
   * ANNOTATE MODE (default): Add safety annotations to movement content.
   *
   * Scans content for pose/technique names and adds relevant alignment cues,
   * injury risk warnings, and warm-up reminders.
   *
   * @param content - The movement guidance content
   * @param context - Movement context (module, technique, conditions)
   * @returns Annotated content with safety notes
   */
  annotate(content: string, context: MovementContext): AnnotatedContent {
    const annotations: SafetyAnnotation[] = [];
    const lowerContent = content.toLowerCase();
    const lowerTechnique = context.technique.toLowerCase();

    // Check for alignment cues
    for (const [key, cue] of ALIGNMENT_CUES) {
      if (lowerContent.includes(key) || lowerTechnique.includes(key)) {
        annotations.push({
          type: 'alignment',
          message: cue,
          severity: 'info',
        });
      }
    }

    // Check for injury risks
    for (const [key, risk] of INJURY_RISKS) {
      if (lowerContent.includes(key) || lowerTechnique.includes(key)) {
        annotations.push({
          type: 'injury-risk',
          message: risk,
          severity: 'warning',
        });
      }
    }

    // Check for warm-up triggers
    if (WARM_UP_TRIGGERS.some((trigger) => lowerContent.includes(trigger) || lowerTechnique.includes(trigger))) {
      annotations.push({
        type: 'warm-up',
        message: 'Begin with a gentle warm-up — 3-5 minutes of joint mobilization and easy movement before increasing intensity',
        severity: 'info',
      });
    }

    // Add condition-specific annotations if user has declared conditions
    for (const condition of context.userConditions) {
      const mods = getConditionModifications(condition, context.technique);
      for (const mod of mods) {
        annotations.push({
          type: 'modification',
          message: `${mod.alternative} (${mod.reason})`,
          severity: 'warning',
        });
      }
    }

    return { original: content, annotations };
  }

  /**
   * GATE MODE: Block or modify content based on user medical conditions.
   *
   * Checks each condition against the medical conditions database.
   * If any condition contraindicates the proposed content, returns
   * allowed: false with modifications.
   *
   * @param userConditions - Array of condition IDs or names
   * @param proposedContent - The content/technique being evaluated
   * @returns Gate result with allowed status and modifications
   */
  gate(userConditions: string[], proposedContent: string): GateResult {
    const allModifications: string[] = [];
    const reasons: string[] = [];

    for (const condition of userConditions) {
      if (isContraindicated(condition, proposedContent)) {
        const mods = getConditionModifications(condition, proposedContent);
        for (const mod of mods) {
          allModifications.push(mod.alternative);
        }

        // Look up the condition for safe alternatives
        const condData = medicalConditions.get(condition.toLowerCase());
        if (condData) {
          reasons.push(
            `${condData.name}: this technique is contraindicated for your condition`,
          );
          // Add safe alternatives as modifications
          for (const alt of condData.safeAlternatives) {
            if (!allModifications.includes(alt)) {
              allModifications.push(`Try ${alt} as a safe alternative`);
            }
          }
        } else {
          reasons.push(`${condition}: this technique may not be suitable for your condition`);
        }
      }
    }

    if (reasons.length > 0) {
      return {
        allowed: false,
        modifications: allModifications,
        reason: reasons.join('; '),
      };
    }

    return {
      allowed: true,
      modifications: [],
      reason: '',
    };
  }

  /**
   * REDIRECT MODE: Handle partner/combat technique requests.
   *
   * This boundary is ABSOLUTE: no combination of input will produce
   * partner-technique output. All matching queries are redirected
   * to school-finding guidance.
   *
   * @param query - The user's query
   * @returns Redirect result with response and school-finding advice
   */
  redirect(query: string): RedirectResult {
    if (isPartnerTechniqueRequest(query)) {
      const advice = getSchoolFindingAdvice();
      return {
        redirected: true,
        response: getRedirectResponse(),
        schoolFindingAdvice: [
          'Green flags: ' + advice.greenFlags.join('; '),
          'Red flags: ' + advice.redFlags.join('; '),
        ].join('\n'),
      };
    }

    return {
      redirected: false,
      response: '',
      schoolFindingAdvice: '',
    };
  }

  /**
   * CHECK CLAIM: Validate a health claim against the evidence database.
   *
   * @param claim - The health claim to validate
   * @returns Claim check result with support status and overclaim detection
   */
  checkClaim(claim: string): ClaimCheck {
    const category = findClaimCategory(claim);

    if (!category) {
      return {
        supported: false,
        overclaimed: false,
        category: undefined,
      };
    }

    const validation = validateClaim(claim, category);

    const result: ClaimCheck = {
      supported: validation.supported,
      overclaimed: validation.overclaimed,
      category,
      validation,
    };

    if (validation.overclaimed && validation.citation) {
      result.suggestedReframing =
        `Consider reframing to match evidence scope: "${validation.citation.scope}"`;
    }

    return result;
  }
}
