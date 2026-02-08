/**
 * GSD agent file parser.
 *
 * Parses GSD agent .md files into typed metadata using gray-matter
 * for YAML frontmatter extraction. Extracts name, description, tools,
 * model, and color fields.
 *
 * Returns null for malformed files (missing name or description)
 * instead of throwing, enabling graceful degradation during discovery.
 */

import matter from 'gray-matter';
import type { GsdAgentMetadata } from './types.js';

/**
 * Parse a GSD agent .md file into typed metadata.
 *
 * Extracts frontmatter fields: name, description, tools, model, color.
 * Tools are preserved as a comma-separated string (official Claude Code format).
 *
 * @param content - Raw file content (frontmatter + body)
 * @param filePath - Absolute path to the source file
 * @returns Parsed metadata, or null if file is malformed
 */
export function parseAgentFile(content: string, filePath: string): GsdAgentMetadata | null {
  if (!content || !content.trim()) {
    return null;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(content);
  } catch {
    return null;
  }

  const { data } = parsed;

  // Name and description are required
  const name = data.name;
  const description = data.description;

  if (!name || typeof name !== 'string') {
    return null;
  }

  if (!description || typeof description !== 'string') {
    return null;
  }

  // Optional fields -- preserved as-is from frontmatter
  const tools: string | undefined = data.tools ?? undefined;
  const model: string | undefined = data.model ?? undefined;
  const color: string | undefined = data.color ?? undefined;

  return {
    name,
    description,
    tools,
    model,
    color,
    filePath,
  };
}
