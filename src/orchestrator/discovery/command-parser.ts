/**
 * GSD command file parser.
 *
 * Parses GSD command .md files into typed metadata using:
 * - gray-matter for YAML frontmatter extraction
 * - Regex for <objective> tag extraction from body
 *
 * Returns null for malformed files (missing name or description)
 * instead of throwing, enabling graceful degradation during discovery.
 */

import matter from 'gray-matter';
import type { GsdCommandMetadata } from './types.js';

/**
 * Extract the content of the first occurrence of a named tag.
 *
 * Uses non-greedy regex to match the first tag only, ignoring any
 * subsequent tags with the same name (e.g., <objective> tags nested
 * inside <process> sections of GSD command files).
 *
 * @param body - The text to search
 * @param tagName - The tag name to find (e.g., 'objective')
 * @returns The trimmed tag content, or undefined if not found
 */
export function extractFirstTag(body: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>\\s*([\\s\\S]*?)\\s*<\\/${tagName}>`);
  const match = body.match(regex);
  const content = match?.[1]?.trim();
  return content || undefined;
}

/**
 * Parse a GSD command .md file into typed metadata.
 *
 * Extracts frontmatter fields and maps kebab-case keys to camelCase:
 * - argument-hint -> argumentHint
 * - allowed-tools -> allowedTools
 *
 * @param content - Raw file content (frontmatter + body)
 * @param filePath - Absolute path to the source file
 * @returns Parsed metadata, or null if file is malformed
 */
export function parseCommandFile(content: string, filePath: string): GsdCommandMetadata | null {
  if (!content || !content.trim()) {
    return null;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(content);
  } catch {
    return null;
  }

  const { data, content: body } = parsed;

  // Name and description are required
  const name = data.name;
  const description = data.description;

  if (!name || typeof name !== 'string') {
    return null;
  }

  if (!description || typeof description !== 'string') {
    return null;
  }

  // Map kebab-case frontmatter keys to camelCase
  const argumentHint: string | undefined = data['argument-hint'] ?? undefined;
  const allowedTools: string[] | undefined = data['allowed-tools'] ?? undefined;
  const agent: string | undefined = data.agent ?? undefined;

  // Extract objective from first <objective> tag in body
  const objective = extractFirstTag(body, 'objective') ?? '';

  return {
    name,
    description,
    argumentHint,
    allowedTools,
    agent,
    objective,
    filePath,
  };
}
