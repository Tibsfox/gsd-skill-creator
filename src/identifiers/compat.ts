// Backward compatibility for legacy skill names alongside domain-prefixed IDs

import type { DomainName, AgentId, SkillId } from './types.js';
import { DOMAIN_PREFIX_MAP, DOMAIN_KEYWORDS } from './types.js';
import { parseAgentId, parseSkillId, parseAdapterId, inferDomain, generateSkillId } from './generator.js';

/**
 * Resolution result for a domain-prefixed identifier.
 */
export type IdentifierResolution =
  | { resolved: true; type: 'agent' | 'skill' | 'adapter'; parsed: object }
  | { resolved: false; legacy: true; name: string };

/**
 * Migration suggestion for a legacy-named skill.
 */
export interface MigrationSuggestion {
  legacyName: string;
  suggestedId: SkillId | AgentId;
  domain: DomainName;
  confidence: number;
}

/**
 * Check if a name is a legacy (non-domain-prefixed) identifier.
 * Returns true if the name does NOT match any domain-prefixed format.
 */
export function isLegacyName(name: string): boolean {
  if (parseAgentId(name) !== null) return false;
  if (parseSkillId(name) !== null) return false;
  if (parseAdapterId(name) !== null) return false;
  return true;
}

/**
 * Attempt to resolve a string as a domain-prefixed identifier.
 * Tries agent, then skill, then adapter. Falls back to legacy resolution.
 */
export function resolveIdentifier(nameOrId: string): IdentifierResolution {
  const agentParsed = parseAgentId(nameOrId);
  if (agentParsed) {
    return { resolved: true, type: 'agent', parsed: agentParsed };
  }

  const skillParsed = parseSkillId(nameOrId);
  if (skillParsed) {
    return { resolved: true, type: 'skill', parsed: skillParsed };
  }

  const adapterParsed = parseAdapterId(nameOrId);
  if (adapterParsed) {
    return { resolved: true, type: 'adapter', parsed: adapterParsed };
  }

  return { resolved: false, legacy: true, name: nameOrId };
}

/**
 * Suggest a domain-prefixed identifier for a legacy-named skill.
 * Generates abbreviation from the legacy name and infers domain from description.
 * Confidence is based on keyword hit ratio (minimum 0.1).
 */
export function suggestMigration(legacyName: string, description: string): MigrationSuggestion {
  const domain = inferDomain(description);
  const abbreviation = generateAbbreviation(legacyName);
  const prefix = DOMAIN_PREFIX_MAP[domain];
  const agentId = `${prefix}-0` as AgentId;
  const suggestedId = generateSkillId(agentId, abbreviation);

  // Compute confidence from keyword hit ratio
  const confidence = computeConfidence(description, domain);

  return {
    legacyName,
    suggestedId,
    domain,
    confidence,
  };
}

/**
 * Generate an abbreviation from a legacy name.
 * Split by hyphens, take first word, extract first 3-4 characters
 * (skipping vowels if enough consonants remain). Fallback: 'skl'.
 */
function generateAbbreviation(legacyName: string): string {
  if (!legacyName || legacyName.trim().length === 0) return 'skl';

  const parts = legacyName.split('-').filter(p => p.length > 0);
  if (parts.length === 0) return 'skl';

  const firstWord = parts[0].toLowerCase();

  // Try to extract consonants first
  const consonants = firstWord.replace(/[aeiou]/g, '');
  if (consonants.length >= 3) {
    return consonants.substring(0, 4);
  }

  // Fall back to first 3 characters
  const chars = firstWord.substring(0, 3);
  return chars.length > 0 ? chars : 'skl';
}

/**
 * Compute confidence based on keyword hit ratio for the inferred domain.
 * Minimum confidence is 0.1 (always have some from default assignment).
 */
function computeConfidence(description: string, domain: DomainName): number {
  const words = description.toLowerCase().split(/\W+/).filter(w => w.length > 0);
  if (words.length === 0) return 0.1;

  const keywords = DOMAIN_KEYWORDS[domain];
  let hits = 0;
  for (const word of words) {
    if (keywords.includes(word)) {
      hits++;
    }
  }

  const ratio = hits / words.length;
  return Math.max(0.1, Math.min(1, ratio));
}
