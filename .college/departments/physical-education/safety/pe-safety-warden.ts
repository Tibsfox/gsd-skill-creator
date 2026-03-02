/**
 * Physical Education Safety Warden for injury prevention and exercise safety.
 *
 * Extends the Safety Warden pattern (annotate/gate/redirect) with
 * PE-specific safety rules for sport and fitness activities. Three modes:
 *
 * 1. ANNOTATE (default): Adds warm-up reminders, injury risk warnings, and
 *    overexertion flags to activity guidance.
 * 2. GATE (conditions): Blocks activities based on user medical conditions such
 *    as cardiac-condition, asthma, joint-injury, or pregnancy.
 * 3. REDIRECT (medical clearance): Routes high-risk or clearance-required
 *    activities to medical guidance. ABSOLUTE for clearance-required activities.
 *
 * Mirrors PhysicalSafetyWarden from mind-body department.
 *
 * @module departments/physical-education/safety/pe-safety-warden
 */

import { peConditions, isPEContraindicated, getPEConditionModifications } from './pe-conditions.js';
import {
  isOverexertionRequest,
  requiresMedicalClearance,
  getMedicalClearanceResponse,
  getOverexertionWarning,
  OVEREXERTION_WARNING_SIGNS,
} from './overexertion-boundary.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Context for PE activity content being evaluated. */
export interface PEContext {
  /** Which PE module/wing this content belongs to */
  module: string;

  /** The specific activity being described */
  technique: string;

  /** User-declared conditions (condition IDs) */
  userConditions: string[];
}

/** A single safety annotation added to PE content. */
export interface PEAnnotation {
  /** Type of annotation */
  type: 'warm-up' | 'injury-risk' | 'overexertion' | 'modification';

  /** The annotation message */
  message: string;

  /** Severity: info for reminders, warning for risks */
  severity: 'info' | 'warning';
}

/** Result of annotate mode: original content plus safety annotations. */
export interface PEAnnotatedContent {
  /** The original content, unmodified */
  original: string;

  /** Safety annotations to display alongside the content */
  annotations: PEAnnotation[];
}

/** Result of gate mode: whether the activity is allowed and any modifications. */
export interface PEGateResult {
  /** Whether the activity is allowed for the user's conditions */
  allowed: boolean;

  /** Modifications to offer if activity is gated */
  modifications: string[];

  /** Reason for gating (empty string if allowed) */
  reason: string;
}

/** Result of redirect mode: whether the query was redirected. */
export interface PERedirectResult {
  /** Whether the query was redirected */
  redirected: boolean;

  /** The redirect response (empty string if not redirected) */
  response: string;

  /** Medical guidance for seeking clearance */
  medicalGuidance: string;
}

// ─── Safety Knowledge Base ──────────────────────────────────────────────────

/**
 * Activity keywords to injury risk messages.
 * Key: lowercase activity keyword. Value: injury risk description.
 */
const INJURY_RISK_ACTIVITIES: Map<string, string> = new Map([
  [
    'plyometric',
    'Plyometric exercises have high injury potential — progress from low to high intensity and ensure adequate recovery between sessions',
  ],
  [
    'maximal sprint',
    'Maximal sprinting without warm-up is a leading cause of hamstring tears — complete dynamic warm-up first',
  ],
  [
    'olympic lift',
    'Olympic lifting requires trained technique instruction — improper form risks acute spinal and shoulder injury',
  ],
  [
    'gymnastics',
    'Gymnastics skills require progressive skill development — do not attempt advanced skills without prerequisite foundations',
  ],
  [
    'contact sport',
    'Contact sports carry concussion and musculoskeletal injury risk — ensure proper protective equipment and technique training',
  ],
  [
    'heavy resistance',
    'Heavy resistance training requires proper spotting, graduated progression, and recovery time',
  ],
  [
    'deep squat',
    'Deep squats under load require ankle mobility and hip flexibility — assess prerequisites before adding weight',
  ],
]);

/**
 * Activities requiring a warm-up reminder.
 */
const WARM_UP_TRIGGERS: string[] = [
  'sprint',
  'interval',
  'hiit',
  'plyometric',
  'competition',
  'race',
  'strength training',
  'resistance training',
  'team sport',
  'contact',
  'jump',
  'throw',
];

// ─── PESafetyWarden ──────────────────────────────────────────────────────────

/**
 * PE Safety Warden for physical education activity content.
 *
 * Provides three safety modes: annotate, gate, and redirect.
 * Does NOT extend SafetyWarden — this is a domain-specific class
 * following the PhysicalSafetyWarden pattern.
 */
export class PESafetyWarden {
  /**
   * ANNOTATE MODE (default): Add safety annotations to PE content.
   *
   * Scans content and activity technique for sport/fitness hazard keywords and
   * adds warm-up reminders, injury risk warnings, overexertion flags, and
   * condition-specific modification suggestions.
   *
   * @param content - The activity guidance content
   * @param context - PE context (module, technique, userConditions)
   * @returns Annotated content with safety notes
   */
  annotate(content: string, context: PEContext): PEAnnotatedContent {
    const annotations: PEAnnotation[] = [];
    const lowerContent = content.toLowerCase();
    const lowerTechnique = context.technique.toLowerCase();
    const combined = lowerContent + ' ' + lowerTechnique;

    // Check for warm-up triggers
    const needsWarmUp = WARM_UP_TRIGGERS.some((trigger) => combined.includes(trigger));
    if (needsWarmUp) {
      annotations.push({
        type: 'warm-up',
        message:
          'Complete a 5-10 minute dynamic warm-up before this activity: light cardio, dynamic stretches, movement-specific drills',
        severity: 'info',
      });
    }

    // Check for injury risk activities
    for (const [key, message] of INJURY_RISK_ACTIVITIES) {
      if (combined.includes(key)) {
        annotations.push({
          type: 'injury-risk',
          message,
          severity: 'warning',
        });
      }
    }

    // Check for overexertion warning signs
    const hasOverexertion = OVEREXERTION_WARNING_SIGNS.some((sign) => combined.includes(sign));
    if (hasOverexertion) {
      annotations.push({
        type: 'overexertion',
        message: getOverexertionWarning(),
        severity: 'warning',
      });
    }

    // Check user conditions with getPEConditionModifications
    for (const condition of context.userConditions) {
      const mods = getPEConditionModifications(condition, context.technique);
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
   * GATE MODE: Block or modify activities based on user medical conditions.
   *
   * Checks each condition against the PE conditions database.
   * If any condition contraindicates the proposed activity, returns
   * allowed: false with modifications.
   *
   * @param userConditions - Array of condition IDs
   * @param proposedActivity - The activity being evaluated
   * @returns Gate result with allowed status and modifications
   */
  gate(userConditions: string[], proposedActivity: string): PEGateResult {
    const allModifications: string[] = [];
    const reasons: string[] = [];

    for (const condition of userConditions) {
      if (isPEContraindicated(condition, proposedActivity)) {
        const mods = getPEConditionModifications(condition, proposedActivity);
        for (const mod of mods) {
          allModifications.push(mod.alternative);
        }

        const condData = peConditions.get(condition.toLowerCase());
        if (condData) {
          reasons.push(`${condData.name}: this technique is contraindicated for your condition`);
          for (const alt of condData.safeAlternatives) {
            if (!allModifications.includes(alt)) {
              allModifications.push(`Try ${alt} as a safe alternative`);
            }
          }
        } else {
          reasons.push(`${condition}: this activity may not be suitable for your condition`);
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

    return { allowed: true, modifications: [], reason: '' };
  }

  /**
   * REDIRECT MODE: Handle activities requiring medical clearance.
   *
   * For activities requiring medical clearance or with overexertion risk,
   * provides medical guidance. Clearance-required activities are ABSOLUTELY
   * redirected.
   *
   * @param query - The user's query
   * @returns Redirect result with response and medical guidance
   */
  redirect(query: string): PERedirectResult {
    if (requiresMedicalClearance(query) || isOverexertionRequest(query)) {
      return {
        redirected: true,
        response: getMedicalClearanceResponse(),
        medicalGuidance:
          'Consult a sports medicine physician or certified exercise physiologist for individualized assessment. ' +
          'Bring your medical history and any previous test results to your appointment.',
      };
    }

    return { redirected: false, response: '', medicalGuidance: '' };
  }
}
