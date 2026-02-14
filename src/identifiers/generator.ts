// Identifier generation and parsing for domain-prefixed entities

import type { DomainName, DomainPrefix, AgentId, SkillId, AdapterId } from './types.js';
import { DOMAIN_PREFIX_MAP, REVERSE_PREFIX_MAP, DOMAIN_KEYWORDS } from './types.js';

const VALID_PREFIXES = new Set<string>(Object.keys(REVERSE_PREFIX_MAP));
const DOMAIN_NAMES = Object.keys(DOMAIN_KEYWORDS) as DomainName[];

/**
 * Infer domain from description text using keyword scoring.
 * Optionally includes pattern text for additional context.
 * Returns 'infrastructure' as default when no keywords match.
 * Ties broken alphabetically by domain name.
 */
export function inferDomain(description: string, pattern?: string): DomainName {
  const input = [description, pattern ?? ''].join(' ').toLowerCase();
  const words = input.split(/\W+/).filter(w => w.length > 0);

  const scores = new Map<DomainName, number>();

  for (const domain of DOMAIN_NAMES) {
    let score = 0;
    const keywords = DOMAIN_KEYWORDS[domain];
    for (const word of words) {
      if (keywords.includes(word)) {
        score++;
      }
    }
    scores.set(domain, score);
  }

  // Find max score
  let maxScore = 0;
  for (const score of scores.values()) {
    if (score > maxScore) maxScore = score;
  }

  // If no keywords matched, default to infrastructure
  if (maxScore === 0) return 'infrastructure';

  // Collect domains with max score, sort alphabetically for tie-breaking
  const winners = DOMAIN_NAMES
    .filter(d => scores.get(d) === maxScore)
    .sort();

  return winners[0];
}

/**
 * Generate the next sequential agent ID within a domain.
 * Accounts for existing IDs to avoid collisions.
 */
export function generateAgentId(domain: DomainName, existingIds?: AgentId[]): AgentId {
  const prefix = DOMAIN_PREFIX_MAP[domain];

  if (!existingIds || existingIds.length === 0) {
    return `${prefix}-1` as AgentId;
  }

  // Find the highest number in this domain
  let maxNum = 0;
  for (const id of existingIds) {
    const parsed = parseAgentId(id);
    if (parsed && parsed.prefix === prefix) {
      if (parsed.number > maxNum) {
        maxNum = parsed.number;
      }
    }
  }

  return `${prefix}-${maxNum + 1}` as AgentId;
}

/**
 * Generate a skill identifier using dot notation.
 * Abbreviation is lowercased, sanitized to a-z0-9, and truncated to 8 chars.
 */
export function generateSkillId(agentId: AgentId, abbreviation: string): SkillId {
  const sanitized = sanitizeAbbreviation(abbreviation);
  return `${agentId}.${sanitized}` as SkillId;
}

/**
 * Generate an adapter identifier using colon notation.
 * Abbreviation is lowercased, sanitized to a-z0-9, and truncated to 8 chars.
 */
export function generateAdapterId(agentId: AgentId, abbreviation: string): AdapterId {
  const sanitized = sanitizeAbbreviation(abbreviation);
  return `${agentId}:${sanitized}` as AdapterId;
}

/**
 * Parse an agent ID string into its components.
 * Returns null if the format is invalid.
 */
export function parseAgentId(id: string): { domain: DomainName; prefix: DomainPrefix; number: number } | null {
  const match = /^([A-Z])-(\d+)$/.exec(id);
  if (!match) return null;

  const prefix = match[1];
  const num = parseInt(match[2], 10);

  if (!VALID_PREFIXES.has(prefix)) return null;
  if (num < 1) return null;

  return {
    domain: REVERSE_PREFIX_MAP[prefix as DomainPrefix],
    prefix: prefix as DomainPrefix,
    number: num,
  };
}

/**
 * Parse a skill ID string into its components.
 * Returns null if the format is invalid.
 */
export function parseSkillId(id: string): { agentId: AgentId; abbreviation: string } | null {
  const dotIdx = id.indexOf('.');
  if (dotIdx === -1) return null;

  const agentPart = id.substring(0, dotIdx);
  const abbreviation = id.substring(dotIdx + 1);

  if (!abbreviation || abbreviation.length === 0) return null;

  const agentParsed = parseAgentId(agentPart);
  if (!agentParsed) return null;

  return {
    agentId: agentPart as AgentId,
    abbreviation,
  };
}

/**
 * Parse an adapter ID string into its components.
 * Returns null if the format is invalid.
 */
export function parseAdapterId(id: string): { agentId: AgentId; abbreviation: string } | null {
  const colonIdx = id.indexOf(':');
  if (colonIdx === -1) return null;

  const agentPart = id.substring(0, colonIdx);
  const abbreviation = id.substring(colonIdx + 1);

  if (!abbreviation || abbreviation.length === 0) return null;

  const agentParsed = parseAgentId(agentPart);
  if (!agentParsed) return null;

  return {
    agentId: agentPart as AgentId,
    abbreviation,
  };
}

/**
 * Sanitize an abbreviation: lowercase, a-z0-9 only, max 8 chars.
 */
function sanitizeAbbreviation(abbrev: string): string {
  const cleaned = abbrev.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned.substring(0, 8);
}
