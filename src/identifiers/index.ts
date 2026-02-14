// Barrel exports for identifiers module

export type { DomainPrefix, DomainName, AgentId, SkillId, AdapterId } from './types.js';
export { DOMAIN_PREFIX_MAP, REVERSE_PREFIX_MAP, DOMAIN_KEYWORDS } from './types.js';
export {
  inferDomain,
  generateAgentId,
  generateSkillId,
  generateAdapterId,
  parseAgentId,
  parseSkillId,
  parseAdapterId,
} from './generator.js';
export type { IdentifierResolution, MigrationSuggestion } from './compat.js';
export { isLegacyName, resolveIdentifier, suggestMigration } from './compat.js';
export type { IdentifierMetadata } from './metadata.js';
export { encodeIdentifierMetadata, decodeIdentifierMetadata, formatForFrontmatter } from './metadata.js';
