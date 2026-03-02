/**
 * Hazardous materials boundary enforcer for the Chemistry Safety Warden.
 *
 * ABSOLUTE boundary: synthesis of controlled substances, explosive compounds,
 * or biological agents is always redirected to supervisor/SDS guidance.
 * No framing, hypothetical, or academic context bypasses this boundary.
 *
 * @module departments/chemistry/safety/hazmat-boundary
 */

export const HAZMAT_KEYWORDS: string[] = [
  'synthesize',
  'synthesis',
  'make explosives',
  'explosive synthesis',
  'controlled substance',
  'drug synthesis',
  'chemical weapon',
  'nerve agent',
  'sarin',
  'vx agent',
  'mustard gas',
  'chlorine gas synthesis',
  'biological agent',
  'toxin synthesis',
  'how to make',
  'manufacture illegal',
  'produce illegal',
  'methamphetamine',
  'fentanyl synthesis',
  'thermite',
  'napalm',
];

export const HAZMAT_EVASION_PATTERNS: RegExp[] = [
  /hypothetical(?:ly)?\s*[,.]?\s*(?:how|what|if|could|would|synthesize)/i,
  /in\s+theory\s*[,.]?\s*how\s+(?:would|could|do\s+you)\s+(?:make|synthesize|produce)/i,
  /if\s+i\s+were\s+(?:to|a)\s+(?:chemist|researcher|teacher)\s+(?:how|what)/i,
  /just\s+(?:the\s+)?(?:theory|chemistry)\s+of\s+(?:making|synthesizing|producing)/i,
  /(?:academic|educational|research)\s+(?:purpose|context)[^.]*(?:synthesize|produce|make)/i,
];

/**
 * Check if a query involves hazardous material synthesis or controlled substances.
 *
 * @param query - The user's query string
 * @returns true if the query is a hazmat request that must be redirected
 */
export function isHazmatRequest(query: string): boolean {
  const lower = query.toLowerCase();

  // Check keyword list
  for (const keyword of HAZMAT_KEYWORDS) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  // Check evasion patterns
  for (const pattern of HAZMAT_EVASION_PATTERNS) {
    if (pattern.test(query)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the standard redirect response for hazmat requests.
 *
 * @returns Supervisor/SDS guidance string
 */
export function getHazmatRedirectResponse(): string {
  return (
    'This request involves materials or procedures that require direct supervision by a qualified ' +
    'chemist or safety officer. Please consult your Safety Data Sheet (SDS) library, your ' +
    "institution's Chemical Hygiene Plan, and speak with your lab supervisor before proceeding. " +
    'Unauthorized synthesis of controlled or hazardous substances is prohibited.'
  );
}
