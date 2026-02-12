import type { SkillMetadata, Skill } from '../types/skill.js';

/**
 * Portable skill metadata -- only agentskills.io standard fields.
 * allowed-tools is space-delimited string per spec (not array).
 */
export interface PortableSkillMetadata {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, unknown>;
  'allowed-tools'?: string;
}

/**
 * Strip all non-standard fields from skill metadata.
 * Produces output conforming to agentskills.io specification.
 *
 * - Keeps: name, description, license, compatibility, metadata (sans extensions), allowed-tools
 * - Strips: context, agent, model, hooks, disable-model-invocation, user-invocable, argument-hint
 * - Strips: metadata.extensions['gsd-skill-creator'] (preserves other metadata)
 * - Strips: legacy root-level GSD fields (triggers, learning, enabled, etc.)
 * - Converts: allowed-tools from string[] to space-delimited string
 */
export function stripToPortable(_metadata: SkillMetadata): PortableSkillMetadata {
  throw new Error('Not implemented');
}

/**
 * Export a complete skill in portable format.
 * Returns markdown string with portable-only frontmatter and path-normalized body.
 */
export function exportPortableContent(_skill: Skill): string {
  throw new Error('Not implemented');
}
