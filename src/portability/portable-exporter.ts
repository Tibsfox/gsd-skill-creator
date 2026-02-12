import type { SkillMetadata, Skill } from '../types/skill.js';
import { normalizePaths } from './path-normalizer.js';
import matter from 'gray-matter';

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
export function stripToPortable(metadata: SkillMetadata): PortableSkillMetadata {
  // Build result with only standard fields (allowlist approach)
  const result: PortableSkillMetadata = {
    name: metadata.name,
    description: metadata.description,
  };

  // Optional standard fields
  if (metadata.license !== undefined) {
    result.license = metadata.license;
  }

  if (metadata.compatibility !== undefined) {
    result.compatibility = metadata.compatibility;
  }

  // Convert allowed-tools: array -> space-delimited string, string -> trimmed, empty -> omit
  const tools = metadata['allowed-tools'];
  if (tools !== undefined) {
    if (Array.isArray(tools)) {
      if (tools.length > 0) {
        result['allowed-tools'] = tools.join(' ');
      }
      // Empty array -> omit entirely
    } else if (typeof tools === 'string') {
      const trimmed = tools.trim();
      if (trimmed.length > 0) {
        result['allowed-tools'] = trimmed;
      }
    }
  }

  // Handle metadata: deep-clone, strip gsd-skill-creator extension, preserve rest
  if (metadata.metadata) {
    const cleanedMetadata: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata.metadata)) {
      if (key === 'extensions') {
        // Strip gsd-skill-creator from extensions, preserve others
        const extensions = value as Record<string, unknown> | undefined;
        if (extensions) {
          const cleanedExtensions: Record<string, unknown> = {};
          for (const [extKey, extVal] of Object.entries(extensions)) {
            if (extKey !== 'gsd-skill-creator') {
              cleanedExtensions[extKey] = extVal;
            }
          }
          // Only include extensions if non-empty after stripping
          if (Object.keys(cleanedExtensions).length > 0) {
            cleanedMetadata.extensions = cleanedExtensions;
          }
        }
      } else {
        // Preserve non-extension metadata keys (author, version, etc.)
        cleanedMetadata[key] = value;
      }
    }

    // Only include metadata if non-empty after stripping
    if (Object.keys(cleanedMetadata).length > 0) {
      result.metadata = cleanedMetadata;
    }
  }

  return result;
}

/**
 * Export a complete skill in portable format.
 * Returns markdown string with portable-only frontmatter and path-normalized body.
 */
export function exportPortableContent(skill: Skill): string {
  const portable = stripToPortable(skill.metadata);
  const normalizedBody = normalizePaths(skill.body);

  return matter.stringify(normalizedBody, portable);
}
