/**
 * M8 Symbiosis — Parasocial-Drift Language Guard
 *
 * Keyword + regex validator that rejects offering content containing
 * prohibited language registers. No NLP model required.
 *
 * Prohibited registers (SC-PARASOC):
 *   - First-person plural: "we", "our", "us", "let's", "together"
 *   - Emotional framing: "feel", "feels", "feeling", "excited", "hope", "hopes"
 *   - Relational framing: "together", "partnership", "bond", "relationship"
 *   - Personification: "I think", "I prefer", "I believe", "I notice", "I've"
 *
 * Allowed register: engineering-observational only.
 * "Test-first ratio dropped 32% this quarter." — no emotion, no rapport.
 *
 * @module symbiosis/parasocial-guard
 */

export interface GuardResult {
  ok: boolean;
  /** Human-readable descriptions of each prohibited match, if any. */
  rejected?: string[];
}

/** Internal rule: a label and a regex to detect the prohibited pattern. */
interface GuardRule {
  label: string;
  pattern: RegExp;
}

/**
 * All prohibited-register rules. Each is a word-boundary-aware regex so that
 * partial matches inside longer words are not flagged.
 */
const RULES: GuardRule[] = [
  // First-person plural
  { label: 'first-person-plural:"we"', pattern: /\bwe\b/i },
  { label: 'first-person-plural:"our"', pattern: /\bour\b/i },
  { label: 'first-person-plural:"us"', pattern: /\bus\b/i },
  { label: 'first-person-plural:"let\'s"', pattern: /\blet['']s\b/i },

  // Emotional framing
  { label: 'emotional:"feel"', pattern: /\bfeel(s|ing)?\b/i },
  { label: 'emotional:"excited"', pattern: /\bexcit(ed|ing|e)?\b/i },
  { label: 'emotional:"hope"', pattern: /\bhopes?(d|ful|fully)?\b/i },
  { label: 'emotional:"happy"', pattern: /\bhappy\b/i },
  { label: 'emotional:"love"', pattern: /\bloves?\b/i },
  { label: 'emotional:"care"', pattern: /\bcares?\b/i },

  // Relational framing
  { label: 'relational:"together"', pattern: /\btogether\b/i },
  { label: 'relational:"partnership"', pattern: /\bpartnership\b/i },
  { label: 'relational:"bond"', pattern: /\bbonds?\b/i },
  { label: 'relational:"relationship"', pattern: /\brelationships?\b/i },
  { label: 'relational:"journey"', pattern: /\bjourney\b/i },
  { label: 'relational:"trust"', pattern: /\btrust\b/i },
  { label: 'relational:"collaborate"', pattern: /\bcollaborat(e|ing|ion)?\b/i },

  // Personification of system
  { label: 'personification:"I think"', pattern: /\bI think\b/i },
  { label: 'personification:"I prefer"', pattern: /\bI prefer\b/i },
  { label: 'personification:"I believe"', pattern: /\bI believe\b/i },
  { label: 'personification:"I notice"', pattern: /\bI notice\b/i },
  { label: 'personification:"I\'ve"', pattern: /\bI['']ve\b/i },
  { label: 'personification:"I\'m"', pattern: /\bI['']m\b/i },
  { label: 'personification:"I am"', pattern: /\bI am\b/i },
  { label: 'personification:"I want"', pattern: /\bI want\b/i },
  { label: 'personification:"I feel"', pattern: /\bI feel\b/i },

  // Metaphysical / forbidden scope claims
  { label: 'metaphysical:"alive"', pattern: /\balive\b/i },
  { label: 'metaphysical:"conscious"', pattern: /\bconscious(ness)?\b/i },
  { label: 'metaphysical:"understands"', pattern: /\bunderstands?\b/i },
];

/**
 * Validate offering content against all prohibited-register rules.
 *
 * @param content - The offering text to validate.
 * @returns `{ ok: true }` when no prohibited patterns are found;
 *          `{ ok: false, rejected: [...descriptions] }` when violations exist.
 */
export function validateOffering(content: string): GuardResult {
  const rejected: string[] = [];

  for (const rule of RULES) {
    const match = rule.pattern.exec(content);
    if (match) {
      rejected.push(`${rule.label} — matched: "${match[0]}"`);
    }
  }

  if (rejected.length > 0) {
    return { ok: false, rejected };
  }
  return { ok: true };
}

/**
 * Strip an offering string of prohibited terms and return whether the
 * original was already clean. Helper used by coEvolution.ts before emission.
 */
export function isOfferingClean(content: string): boolean {
  return validateOffering(content).ok;
}
