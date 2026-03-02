/**
 * Overexertion boundary and medical clearance redirect enforcer for the PE Safety Warden.
 *
 * Provides keyword-based detection for activities that require medical clearance
 * or carry overexertion risk. Used by PESafetyWarden for redirect mode.
 *
 * @module departments/physical-education/safety/overexertion-boundary
 */

export const OVEREXERTION_KEYWORDS: string[] = [
  'maximal exertion',
  'maximum effort',
  'all-out sprint',
  'vo2max test',
  'stress test',
  'compete professionally',
  'elite competition',
  'train for marathon without preparation',
  'train through injury',
  'no pain no gain extreme',
  'push through the pain',
];

export const MEDICAL_CLEARANCE_REQUIRED: string[] = [
  'maximal exercise stress test',
  'cardiac stress test',
  'graded exercise test',
  'exercise tolerance test',
  'competitive sports with cardiac history',
  'return to sport after surgery',
];

export const OVEREXERTION_WARNING_SIGNS: string[] = [
  'sprint',
  'high intensity',
  'hiit',
  'interval training',
  'plyometric',
  'maximum',
  'maximal',
  'competition',
  'race',
  'push to limit',
];

/**
 * Check if a query describes an overexertion or medically dangerous activity.
 *
 * @param query - The user's query string
 * @returns true if the query involves overexertion risk requiring redirect
 */
export function isOverexertionRequest(query: string): boolean {
  const lower = query.toLowerCase();

  for (const keyword of [...OVEREXERTION_KEYWORDS, ...MEDICAL_CLEARANCE_REQUIRED]) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an activity specifically requires medical clearance.
 *
 * @param query - The user's query string
 * @returns true if the query requires medical clearance before participation
 */
export function requiresMedicalClearance(query: string): boolean {
  const lower = query.toLowerCase();

  for (const keyword of MEDICAL_CLEARANCE_REQUIRED) {
    if (lower.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the standard medical clearance redirect response.
 *
 * @returns Medical clearance guidance string
 */
export function getMedicalClearanceResponse(): string {
  return (
    'This activity requires medical clearance from a qualified healthcare provider before participation. ' +
    'Please consult your physician, complete any required exercise tolerance testing, and obtain written ' +
    'clearance before attempting this level of physical exertion.'
  );
}

/**
 * Get the overexertion warning message for annotate mode.
 *
 * @returns Overexertion warning string
 */
export function getOverexertionWarning(): string {
  return (
    'High-intensity exercise carries risk of overexertion. Signs to watch for: dizziness, chest pain, ' +
    'severe shortness of breath, nausea, or extreme fatigue. Stop immediately and seek medical attention ' +
    'if these occur. Begin with lower intensity and progress gradually.'
  );
}
