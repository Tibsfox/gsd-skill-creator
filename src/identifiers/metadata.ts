// SKILL.md metadata encoding for domain-prefixed identifiers

import type { DomainName, DomainPrefix } from './types.js';
import { resolveIdentifier } from './compat.js';

/**
 * Structured metadata block for embedding identifier info in SKILL.md frontmatter.
 */
export interface IdentifierMetadata {
  id: string;
  domain: DomainName;
  prefix: DomainPrefix;
  legacyName?: string;
}

/**
 * Encode a domain-prefixed identifier into metadata for SKILL.md frontmatter.
 * Returns null if the ID is not a valid domain-prefixed identifier.
 */
export function encodeIdentifierMetadata(id: string, legacyName?: string): IdentifierMetadata | null {
  const resolution = resolveIdentifier(id);
  if (!resolution.resolved) return null;

  // Extract domain and prefix from parsed result
  const parsed = resolution.parsed as Record<string, unknown>;

  let domain: DomainName;
  let prefix: DomainPrefix;

  if (resolution.type === 'agent') {
    domain = parsed.domain as DomainName;
    prefix = parsed.prefix as DomainPrefix;
  } else {
    // For skill and adapter, we need to parse the agent part
    const agentId = parsed.agentId as string;
    const agentResolution = resolveIdentifier(agentId);
    if (!agentResolution.resolved) return null;
    const agentParsed = agentResolution.parsed as Record<string, unknown>;
    domain = agentParsed.domain as DomainName;
    prefix = agentParsed.prefix as DomainPrefix;
  }

  const metadata: IdentifierMetadata = { id, domain, prefix };
  if (legacyName) {
    metadata.legacyName = legacyName;
  }
  return metadata;
}

/**
 * Extract essential fields from identifier metadata for display or lookup.
 */
export function decodeIdentifierMetadata(metadata: IdentifierMetadata): { id: string; domain: DomainName; legacyName?: string } {
  const result: { id: string; domain: DomainName; legacyName?: string } = {
    id: metadata.id,
    domain: metadata.domain,
  };
  if (metadata.legacyName) {
    result.legacyName = metadata.legacyName;
  }
  return result;
}

/**
 * Produce YAML-compatible string for embedding in SKILL.md frontmatter.
 * Uses 2-space indentation for nested fields.
 */
export function formatForFrontmatter(metadata: IdentifierMetadata): string {
  const lines: string[] = [
    'identifier:',
    `  id: ${metadata.id}`,
    `  domain: ${metadata.domain}`,
    `  prefix: ${metadata.prefix}`,
  ];

  if (metadata.legacyName) {
    lines.push(`  legacy_name: ${metadata.legacyName}`);
  }

  return lines.join('\n');
}
