/**
 * PROJECT.md parser.
 *
 * Extracts project name, core value, current milestone, and description
 * from PROJECT.md content.
 * Returns null for empty or whitespace-only input.
 * Returns object with null fields for missing sections.
 */

import type { ParsedProject } from './types.js';

/**
 * Parse PROJECT.md content into a structured ParsedProject.
 *
 * Extracts:
 * - name: from the first `# ` heading
 * - coreValue: first non-empty line under `## Core Value`
 * - currentMilestone: text after colon in `## Current Milestone:` heading
 * - description: first paragraph under `## What This Is`
 *
 * @param content - Raw PROJECT.md file content
 * @returns Parsed project data, or null if content is empty
 */
export function parseProject(content: string): ParsedProject | null {
  if (!content || !content.trim()) {
    return null;
  }

  const lines = content.split('\n');

  const name = extractProjectName(lines);
  const coreValue = extractSectionFirstParagraph(lines, 'Core Value');
  const currentMilestone = extractMilestone(lines);
  const description = extractSectionFirstParagraph(lines, 'What This Is');

  return {
    name,
    coreValue,
    currentMilestone,
    description,
  };
}

/**
 * Extract the project name from the first H1 heading.
 *
 * Matches: `# GSD Skill Creator`
 */
function extractProjectName(lines: string[]): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^#\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract the current milestone from the ## Current Milestone: heading.
 *
 * Matches: `## Current Milestone: v1.7 GSD Master Orchestration Agent`
 */
function extractMilestone(lines: string[]): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^##\s+Current Milestone:\s*(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract the first paragraph of content under a ## section heading.
 *
 * Finds the `## {sectionName}` heading, then collects the first
 * non-empty paragraph (contiguous non-empty lines) as a single string.
 * Stops at the next ## heading or end of file.
 *
 * @param lines - All lines of the file
 * @param sectionName - Name of the section (e.g., "Core Value", "What This Is")
 * @returns The first paragraph content, or null if section not found
 */
function extractSectionFirstParagraph(lines: string[], sectionName: string): string | null {
  let inSection = false;
  const paragraphLines: string[] = [];
  let foundContent = false;

  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionRegex = new RegExp(`^##\\s+${escapedName}\\b`);

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect start of target section
    if (sectionRegex.test(trimmed)) {
      inSection = true;
      continue;
    }

    // Detect end of section (next ## heading)
    if (inSection && /^##\s+/.test(trimmed) && !sectionRegex.test(trimmed)) {
      break;
    }

    if (!inSection) {
      continue;
    }

    // Skip empty lines before the first content
    if (!foundContent && !trimmed) {
      continue;
    }

    // If we find content, start collecting
    if (trimmed) {
      foundContent = true;
      paragraphLines.push(trimmed);
    } else if (foundContent) {
      // Empty line after content = end of first paragraph
      break;
    }
  }

  return paragraphLines.length > 0 ? paragraphLines.join(' ') : null;
}
