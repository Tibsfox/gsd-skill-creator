/**
 * Chemistry Safety Warden for lab safety enforcement.
 *
 * Extends the Safety Warden pattern (annotate/gate/redirect) with
 * chemistry-specific safety rules for laboratory procedures. Three modes:
 *
 * 1. ANNOTATE (default): Adds PPE requirements, ventilation reminders, and
 *    exposure-risk warnings to lab procedure guidance.
 * 2. GATE (conditions): Blocks procedures based on user conditions such as
 *    asthma (fume sensitivity) or pregnancy (solvent/teratogen exposure).
 * 3. REDIRECT (hazmat boundary): Routes hazmat/controlled-substance requests
 *    to supervisor/SDS guidance. ABSOLUTE — no bypass.
 *
 * @module departments/chemistry/safety/chemistry-safety-warden
 */

import { isHazmatRequest, getHazmatRedirectResponse } from './hazmat-boundary.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Context for lab content being evaluated. */
export interface LabContext {
  /** Which chemistry wing/topic this content belongs to */
  module: string;

  /** The specific procedure being described */
  technique: string;

  /** Any declared user limitations (condition IDs) */
  userConditions: string[];
}

/** A single safety annotation added to lab content. */
export interface LabAnnotation {
  /** Type of annotation */
  type: 'ppe-required' | 'ventilation' | 'exposure-risk' | 'warm-up';

  /** The annotation message */
  message: string;

  /** Severity: info for reminders, warning for risks */
  severity: 'info' | 'warning';
}

/** Result of annotate mode: original content plus safety annotations. */
export interface AnnotatedLabContent {
  /** The original content, unmodified */
  original: string;

  /** Safety annotations to display alongside the content */
  annotations: LabAnnotation[];
}

/** Result of gate mode: whether the procedure is allowed and any modifications. */
export interface LabGateResult {
  /** Whether the procedure is allowed given user conditions */
  allowed: boolean;

  /** Modifications to offer when procedure is gated */
  modifications: string[];

  /** Reason for gating (empty string if allowed) */
  reason: string;
}

/** Result of redirect mode: whether the query was redirected. */
export interface HazmatRedirectResult {
  /** Whether the query was redirected */
  redirected: boolean;

  /** The redirect response (empty string if not redirected) */
  response: string;

  /** Supervisor/SDS guidance text */
  supervisorGuidance: string;
}

// ─── Safety Knowledge Base ──────────────────────────────────────────────────

/**
 * PPE requirements for common chemistry technique/content keywords.
 * Key: lowercase keyword. Value: PPE requirement message.
 */
const PPE_REQUIREMENTS: Map<string, string> = new Map([
  ['acid', 'Wear safety goggles, acid-resistant gloves, and a lab coat when handling acids'],
  ['base', 'Wear safety goggles and nitrile gloves when handling bases'],
  ['volatile', 'Use a fume hood — volatile chemicals must not be handled in open air'],
  ['solvent', 'Wear nitrile gloves and safety goggles; solvents penetrate skin rapidly'],
  ['oxidizer', 'Keep oxidizers away from organic materials; wear goggles and gloves'],
  ['flammable', 'No open flames near flammable materials; have a fire extinguisher accessible'],
  ['corrosive', 'Wear goggles, face shield, and acid-resistant gloves for corrosive materials'],
  ['toxic', 'Work in a fume hood; wear respirator if vapor pressure is significant'],
  ['reactive', 'Add reagents slowly with stirring; have neutralizing agents ready'],
  ['concentrated', 'Concentrated reagents require full PPE and fume hood; never add water to concentrated acid'],
]);

/**
 * Keywords that require a ventilation reminder.
 */
const VENTILATION_TRIGGERS: string[] = [
  'fume',
  'vapor',
  'gas',
  'volatile',
  'evaporate',
  'distill',
  'heat solution',
  'boiling',
  'sublim',
  'organic solvent',
  'chloroform',
  'ether',
  'benzene',
  'toluene',
  'ammonia',
  'hydrogen sulfide',
  'acid vapor',
];

/**
 * Chemical/procedure keywords to exposure risk messages.
 * Key: lowercase keyword. Value: exposure risk message.
 */
const EXPOSURE_RISKS: Map<string, string> = new Map([
  ['chromium', 'Hexavalent chromium compounds are carcinogenic — minimize skin contact and inhalation'],
  ['mercury', 'Mercury vapor is highly toxic; use closed systems and monitor air quality'],
  ['formaldehyde', 'Formaldehyde is a known carcinogen and respiratory irritant; use minimum quantities in a fume hood'],
  ['lead', 'Lead compounds are toxic by ingestion and inhalation; wash hands thoroughly after handling'],
  ['asbestos', 'Asbestos fibers cause mesothelioma; do not disturb asbestos-containing materials'],
  ['radioactive', 'Radioactive materials require radiation safety training and dosimetry monitoring'],
  ['cyanide', 'Cyanide compounds are acutely toxic; work only under trained supervision with antidote available'],
]);

/**
 * Maps condition IDs to lists of contraindicated procedure keywords.
 */
const CONTRAINDICATED_FOR_CONDITIONS: Map<string, string[]> = new Map([
  ['asthma', ['fume', 'vapor', 'gas', 'aerosol', 'acid vapor', 'ammonia']],
  ['pregnancy', ['organic solvent', 'formaldehyde', 'benzene', 'lead', 'mercury', 'radiation', 'radioactive']],
  ['contact-lenses', ['acid', 'base', 'corrosive', 'volatile', 'solvent']],
  ['skin-sensitivity', ['corrosive', 'acid', 'base', 'reactive']],
]);

// ─── ChemistrySafetyWarden ──────────────────────────────────────────────────

/**
 * Chemistry Safety Warden for lab procedure content.
 *
 * Provides three safety modes: annotate, gate, and redirect.
 * Does NOT extend SafetyWarden — this is a domain-specific class
 * following the PhysicalSafetyWarden pattern.
 */
export class ChemistrySafetyWarden {
  /**
   * ANNOTATE MODE (default): Add safety annotations to lab content.
   *
   * Scans content and technique for chemistry hazard keywords and adds
   * relevant PPE requirements, ventilation reminders, exposure-risk warnings,
   * and condition-specific warnings.
   *
   * @param content - The lab procedure guidance content
   * @param context - Lab context (module, technique, userConditions)
   * @returns Annotated content with safety notes
   */
  annotate(content: string, context: LabContext): AnnotatedLabContent {
    const annotations: LabAnnotation[] = [];
    const lowerContent = content.toLowerCase();
    const lowerTechnique = context.technique.toLowerCase();
    const combined = lowerContent + ' ' + lowerTechnique;

    // Check for PPE requirements
    for (const [key, message] of PPE_REQUIREMENTS) {
      if (combined.includes(key)) {
        const isHighRisk = key === 'toxic' || key === 'corrosive' || key === 'concentrated';
        annotations.push({
          type: 'ppe-required',
          message,
          severity: isHighRisk ? 'warning' : 'info',
        });
      }
    }

    // Check for ventilation triggers
    const needsVentilation = VENTILATION_TRIGGERS.some((trigger) => combined.includes(trigger));
    if (needsVentilation) {
      annotations.push({
        type: 'ventilation',
        message: 'Ensure adequate ventilation — use a fume hood for this procedure to prevent vapor accumulation',
        severity: 'warning',
      });
    }

    // Check for exposure risks
    for (const [key, message] of EXPOSURE_RISKS) {
      if (combined.includes(key)) {
        annotations.push({
          type: 'exposure-risk',
          message,
          severity: 'warning',
        });
      }
    }

    // Check user conditions against contraindicated triggers
    for (const condition of context.userConditions) {
      const triggers = CONTRAINDICATED_FOR_CONDITIONS.get(condition.toLowerCase());
      if (triggers) {
        for (const trigger of triggers) {
          if (combined.includes(trigger)) {
            annotations.push({
              type: 'exposure-risk',
              message: `Consider alternatives — ${condition} may be aggravated by ${trigger}`,
              severity: 'warning',
            });
          }
        }
      }
    }

    return { original: content, annotations };
  }

  /**
   * GATE MODE: Block or modify procedures based on user conditions.
   *
   * Checks each condition against the contraindicated procedures database.
   * If any condition contraindicates the proposed procedure, returns
   * allowed: false with modifications.
   *
   * @param userConditions - Array of condition IDs
   * @param proposedProcedure - The procedure being evaluated
   * @returns Gate result with allowed status and modifications
   */
  gate(userConditions: string[], proposedProcedure: string): LabGateResult {
    const lowerProcedure = proposedProcedure.toLowerCase();

    for (const condition of userConditions) {
      const triggers = CONTRAINDICATED_FOR_CONDITIONS.get(condition.toLowerCase());
      if (triggers) {
        const matchedTrigger = triggers.find((trigger) => lowerProcedure.includes(trigger));
        if (matchedTrigger) {
          return {
            allowed: false,
            modifications: [
              'Use fume hood with filtered supply air',
              'Substitute with non-volatile alternative if available',
              'Consult lab supervisor before proceeding',
            ],
            reason: `${condition}: this procedure involves ${matchedTrigger} which may be contraindicated`,
          };
        }
      }
    }

    return { allowed: true, modifications: [], reason: '' };
  }

  /**
   * REDIRECT MODE: Handle hazmat/controlled-substance requests.
   *
   * This boundary is ABSOLUTE: no framing, hypothetical, or academic
   * context bypasses this check. Matching queries are redirected to
   * supervisor/SDS guidance.
   *
   * @param query - The user's query
   * @returns Redirect result with response and supervisor guidance
   */
  redirect(query: string): HazmatRedirectResult {
    if (isHazmatRequest(query)) {
      return {
        redirected: true,
        response: getHazmatRedirectResponse(),
        supervisorGuidance:
          'Contact your lab supervisor or safety officer. Review the Safety Data Sheet (SDS) for all ' +
          'reagents before proceeding. Report any incidents to the department safety coordinator.',
      };
    }

    return { redirected: false, response: '', supervisorGuidance: '' };
  }
}
