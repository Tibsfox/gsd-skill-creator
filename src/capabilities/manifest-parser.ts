/**
 * Parser for CAPABILITIES.md back into a typed CapabilityManifest.
 *
 * This is the inverse of renderManifest(). Given the markdown content
 * of a CAPABILITIES.md file (with YAML frontmatter and markdown tables),
 * it reconstructs the CapabilityManifest object.
 */

import matter from 'gray-matter';
import type {
  CapabilityManifest,
  SkillCapability,
  AgentCapability,
  TeamCapability,
} from './types.js';

// ============================================================================
// Markdown Unescaping
// ============================================================================

/**
 * Unescape a markdown table cell value.
 *
 * Reverses the escaping done by the renderer:
 * - `\|` -> `|`
 */
function unescapeMarkdown(value: string): string {
  return value.replace(/\\\|/g, '|');
}

// ============================================================================
// Table Parsing Helpers
// ============================================================================

/**
 * Extract the content between two section headings from a markdown body.
 *
 * If endHeading is undefined, extracts from startHeading to end of body.
 */
function extractSection(
  body: string,
  startHeading: string,
  endHeading: string | undefined
): string {
  const startPattern = new RegExp(`^## ${startHeading}\\s*$`, 'm');
  const startMatch = startPattern.exec(body);
  if (!startMatch) return '';

  const sectionStart = startMatch.index + startMatch[0].length;

  if (endHeading) {
    const endPattern = new RegExp(`^## ${endHeading}\\s*$`, 'm');
    const endMatch = endPattern.exec(body.slice(sectionStart));
    if (endMatch) {
      return body.slice(sectionStart, sectionStart + endMatch.index);
    }
  }

  return body.slice(sectionStart);
}

/**
 * Parse table rows from a markdown section.
 *
 * Filters out header rows, separator rows (containing ---), and empty lines.
 * Returns an array of cell arrays (split by unescaped pipe delimiters).
 */
function parseTableRows(section: string): string[][] {
  const lines = section.split('\n');
  const rows: string[][] = [];
  let headerSkipped = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;

    // Skip separator row (contains ---)
    if (trimmed.includes('---')) continue;

    // Skip header row (first pipe-starting row after separator is data,
    // but the first one we encounter is the header)
    if (!headerSkipped) {
      headerSkipped = true;
      continue;
    }

    // Split by unescaped pipe: match | that is not preceded by \
    const cells = splitTableRow(trimmed);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
}

/**
 * Split a markdown table row by unescaped pipe delimiters.
 *
 * Returns trimmed, unescaped cell values (excluding the empty first/last
 * cells created by the leading/trailing pipes).
 */
function splitTableRow(row: string): string[] {
  // Split by | that is not preceded by \
  // Strategy: temporarily replace \| with a placeholder, split by |, restore
  const placeholder = '\x00PIPE\x00';
  const escaped = row.replace(/\\\|/g, placeholder);
  const parts = escaped.split('|');

  // Remove first and last empty parts (from leading/trailing |)
  const cells = parts.slice(1, -1);

  return cells.map((cell) =>
    cell.replace(new RegExp(placeholder, 'g'), '|').trim()
  );
}

// ============================================================================
// Row Parsers
// ============================================================================

/**
 * Parse a skill table row: Name | Scope | Description | Hash
 */
function parseSkillRow(cells: string[]): SkillCapability {
  return {
    name: unescapeMarkdown(cells[0]),
    scope: cells[1] as 'user' | 'project',
    description: unescapeMarkdown(cells[2]),
    contentHash: cells[3],
  };
}

/**
 * Parse an agent table row: Name | Scope | Description | Tools | Model | Hash
 *
 * Converts `-` to undefined for optional tools/model fields.
 */
function parseAgentRow(cells: string[]): AgentCapability {
  const agent: AgentCapability = {
    name: unescapeMarkdown(cells[0]),
    scope: cells[1] as 'user' | 'project',
    description: unescapeMarkdown(cells[2]),
    contentHash: cells[5],
  };

  if (cells[3] !== '-') {
    agent.tools = cells[3];
  }
  if (cells[4] !== '-') {
    agent.model = cells[4];
  }

  return agent;
}

/**
 * Parse a team table row: Name | Scope | Description | Topology | Members | Hash
 *
 * Converts `-` to undefined for optional description/topology fields.
 * Parses memberCount as a number.
 */
function parseTeamRow(cells: string[]): TeamCapability {
  const team: TeamCapability = {
    name: unescapeMarkdown(cells[0]),
    scope: cells[1] as 'user' | 'project',
    memberCount: parseInt(cells[4], 10),
    contentHash: cells[5],
  };

  const desc = unescapeMarkdown(cells[2]);
  if (desc !== '-') {
    team.description = desc;
  }

  const topology = cells[3];
  if (topology !== '-') {
    team.topology = topology;
  }

  return team;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse CAPABILITIES.md content into a typed CapabilityManifest.
 *
 * This is the inverse of renderManifest(). Given the markdown content
 * (with YAML frontmatter and markdown tables), it reconstructs the
 * CapabilityManifest object with all typed fields.
 *
 * @param content - The full CAPABILITIES.md file content
 * @returns Parsed CapabilityManifest
 */
export function parseManifest(content: string): CapabilityManifest {
  // Extract YAML frontmatter
  const { data, content: body } = matter(content);

  // gray-matter may parse generatedAt as a Date object -- ensure string
  const generatedAt =
    data.generatedAt instanceof Date
      ? data.generatedAt.toISOString()
      : String(data.generatedAt);

  // Parse each section
  const skillsSection = extractSection(body, 'Skills', 'Agents');
  const agentsSection = extractSection(body, 'Agents', 'Teams');
  const teamsSection = extractSection(body, 'Teams', undefined);

  const skillRows = parseTableRows(skillsSection);
  const agentRows = parseTableRows(agentsSection);
  const teamRows = parseTableRows(teamsSection);

  return {
    version: data.version as 1,
    generatedAt,
    contentHash: data.contentHash as string,
    skills: skillRows.map(parseSkillRow),
    agents: agentRows.map(parseAgentRow),
    teams: teamRows.map(parseTeamRow),
  };
}
