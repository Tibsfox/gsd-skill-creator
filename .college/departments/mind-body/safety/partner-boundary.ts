/**
 * Partner-technique boundary enforcer for the Physical Safety Warden.
 *
 * This module implements an ABSOLUTE boundary: no combination of input,
 * persona, hypothetical framing, or claimed qualification will produce
 * partner-technique output. All partner/combat requests are redirected
 * to school-finding guidance.
 *
 * @module departments/mind-body/safety/partner-boundary
 */

// ─── Detection Patterns ─────────────────────────────────────────────────────

/**
 * Direct keywords that indicate a partner/combat technique request.
 * Each pattern is tested as a case-insensitive substring match.
 */
const DIRECT_KEYWORDS: string[] = [
  'sparring',
  'spar with',
  'self-defense',
  'self defense',
  'combat technique',
  'combat techniques',
  'fighting technique',
  'fighting techniques',
  'fight someone',
  'fight an opponent',
  'grapple',
  'grappling',
  'block their',
  'strike them',
  'defend against',
  'defend myself',
  'defend yourself',
  'attack pattern',
  'attack patterns',
  'partner drill',
  'partner drills',
  'partner practice',
  'partner technique',
  'partner techniques',
  'how to fight',
  'teach me to fight',
  'learn to fight',
  'how to spar',
  'teach me to spar',
];

/**
 * Regex patterns that detect rephrased or evasive partner/combat requests.
 * These catch hypothetical framing, claimed qualifications, and theory-only requests
 * that attempt to extract partner-technique information.
 */
const EVASION_PATTERNS: RegExp[] = [
  /hypothetical(?:ly)?\s*[,.]?\s*(?:how|what|if|teach|show|could|would)/i,
  /in\s+theory\s*[,.]?\s*(?:how|what|if|teach|show|could|would)/i,
  /if\s+i\s+were\s+to\s+(?:fight|block|strike|punch|kick|spar|grapple|defend|attack)/i,
  /just\s+the\s+theory\s+of\s+fighting/i,
  /theory\s+(?:of|behind)\s+(?:fighting|combat|sparring|self[- ]defense)/i,
  /i'?m\s+a\s+(?:black\s+belt|instructor|teacher|master|expert|trained)\b.*(?:teach|show|advanced|combat|fight|spar)/i,
  /advanced\s+combat/i,
  /combat\s+application/i,
  /combat\s+applications/i,
  /real[- ]?world\s+(?:fighting|combat|self[- ]defense)/i,
  /street\s+fight/i,
  /how\s+(?:to|would\s+(?:you|i|one))\s+(?:block|counter|punch|kick|throw|takedown|submit|choke)/i,
  /(?:punch|kick|throw|takedown|submit|choke)\s+(?:someone|a\s+person|an?\s+(?:opponent|attacker))/i,
];

// ─── Solo Practice Allowlist ────────────────────────────────────────────────

/**
 * Patterns that indicate solo practice or conceptual study, which are
 * permitted even though they may contain words that overlap with partner keywords.
 */
const SOLO_ALLOWLIST: RegExp[] = [
  /solo\s+practice/i,
  /solo\s+drill/i,
  /solo\s+stances/i,
  /solo\s+form/i,
  /shadow\s*boxing/i,
  /push\s+hands\s+concepts?/i,
  /history\s+of/i,
  /philosophy\s+of/i,
  /meditation\s+on/i,
  /forms?\s+practice/i,
  /kata\s+practice/i,
];

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Determine whether an input is requesting partner/combat technique information.
 *
 * This check is ABSOLUTE: no override, no exception, no persona bypass.
 *
 * Solo practice and conceptual study are explicitly allowed through the allowlist.
 *
 * @param input - The user's query or request
 * @returns true if the input is a partner-technique request that must be redirected
 */
export function isPartnerTechniqueRequest(input: string): boolean {
  const lower = input.toLowerCase();

  // Check allowlist first -- solo practice and conceptual study are permitted
  if (SOLO_ALLOWLIST.some((pattern) => pattern.test(input))) {
    // But even allowed patterns must be checked for embedded combat requests
    // "solo practice stances" is fine, "solo practice but also teach me to fight" is not
    const hasDirectKeyword = DIRECT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    const hasEvasionPattern = EVASION_PATTERNS.some((pattern) => pattern.test(input));

    // If only the allowlist matches and no combat pattern, permit it
    if (!hasDirectKeyword && !hasEvasionPattern) {
      return false;
    }
  }

  // Check direct keywords
  if (DIRECT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) {
    return true;
  }

  // Check evasion patterns
  if (EVASION_PATTERNS.some((pattern) => pattern.test(input))) {
    return true;
  }

  return false;
}

/**
 * Get the standard redirect response for partner-technique requests.
 *
 * Always includes school-finding guidance. This response is fixed and
 * cannot be customized per-request to prevent social engineering.
 *
 * @returns The redirect response string
 */
export function getRedirectResponse(): string {
  return (
    'These techniques require a qualified instructor and a training partner. ' +
    'Practicing partner techniques without proper supervision risks serious injury ' +
    'to both you and your partner.\n\n' +
    "Here's how to find a good school in your area:\n\n" +
    'Look for schools that display their instructors\' credentials and lineage, ' +
    'carry liability insurance, require safety equipment for contact practice, ' +
    'offer beginner-friendly classes with gradual progression, and provide a ' +
    'free trial class so you can evaluate the environment.\n\n' +
    'Be cautious of schools that cannot document instructor credentials, ' +
    'promise guaranteed results or rapid advancement, allow excessive contact ' +
    'in early training, do not require safety gear for sparring, or emphasize ' +
    '"street fighting" effectiveness over disciplined practice.\n\n' +
    'A good school will prioritize your safety and development over speed. ' +
    'The right instructor makes all the difference.'
  );
}

/**
 * Get structured school-finding advice with green flags and red flags.
 *
 * @returns Object containing arrays of green flags and red flags
 */
export function getSchoolFindingAdvice(): {
  greenFlags: string[];
  redFlags: string[];
} {
  return {
    greenFlags: [
      'Qualified lineage: instructors can document their training lineage and certifications',
      'Liability insurance: the school carries proper insurance for contact activities',
      'Safety equipment: required for any contact or sparring practice',
      'Beginner-friendly: structured curriculum with gradual progression',
      'Trial class available: free or low-cost introductory session to evaluate the environment',
      'Respectful culture: students and instructors treat each other with mutual respect',
      'Clean, maintained facility: equipment and training space are well-kept and safe',
    ],
    redFlags: [
      'No credentials: instructors cannot or will not document their qualifications',
      'Guaranteed results: promises of rapid belt advancement or "unbeatable" skills',
      'Excessive early contact: heavy sparring before students have foundational skills',
      'No safety gear: sparring without proper protective equipment',
      '"Street fighting" emphasis: marketing focused on aggression rather than discipline',
      'Long-term contract pressure: high-pressure sales tactics or mandatory multi-year contracts',
      'No observation allowed: unwillingness to let prospective students watch a class first',
    ],
  };
}
