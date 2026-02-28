/**
 * Markdown parser for .planning/ artifacts.
 *
 * Pure regex/string-based parsing — no external markdown library.
 * Extracts structured data from PROJECT.md, REQUIREMENTS.md,
 * ROADMAP.md, STATE.md, and MILESTONES.md.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Section,
  TableRow,
  ProjectData,
  RequirementsData,
  RequirementGroup,
  RoadmapData,
  Phase,
  StateData,
  MilestoneData,
  MilestonesData,
  DashboardData,
} from './types.js';

// ---------------------------------------------------------------------------
// Generic markdown utilities
// ---------------------------------------------------------------------------

/**
 * Split markdown content into sections by heading level.
 * Default level is 2 (## headings).
 */
export function parseMarkdownSections(
  content: string,
  level: number = 2,
): Section[] {
  if (!content.trim()) return [];

  const prefix = '#'.repeat(level);
  // Match lines that start with exactly `level` hashes followed by a space
  const headingRegex = new RegExp(
    `^${prefix} (.+)$`,
    'gm',
  );

  const sections: Section[] = [];
  let match: RegExpExecArray | null;
  const matches: { title: string; index: number }[] = [];

  while ((match = headingRegex.exec(content)) !== null) {
    // Verify this is exactly the right level (not ## matching ###)
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const line = content.slice(lineStart, content.indexOf('\n', match.index) === -1 ? content.length : content.indexOf('\n', match.index));
    // Count leading hashes
    const hashMatch = line.match(/^(#+) /);
    if (hashMatch && hashMatch[1].length === level) {
      matches.push({ title: match[1].trim(), index: match.index });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const { title, index } = matches[i];
    const headingLineEnd = content.indexOf('\n', index);
    const contentStart = headingLineEnd === -1 ? content.length : headingLineEnd + 1;
    const contentEnd =
      i + 1 < matches.length ? matches[i + 1].index : content.length;
    const sectionContent = content.slice(contentStart, contentEnd).trim();

    sections.push({
      title,
      level,
      content: sectionContent,
    });
  }

  return sections;
}

/**
 * Parse a markdown table into an array of objects keyed by column headers.
 * Skips the separator row (|---|---|).
 */
export function parseMarkdownTable(content: string): TableRow[] {
  if (!content.trim()) return [];

  const lines = content.split('\n');
  const tableLines: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(trimmed);
    } else if (inTable) {
      // Table ended
      break;
    }
  }

  if (tableLines.length < 3) return []; // Need header + separator + at least one row

  const parseRow = (row: string): string[] =>
    row
      .split('|')
      .slice(1, -1) // Remove empty first/last from leading/trailing |
      .map((cell) => cell.trim());

  const headers = parseRow(tableLines[0]);

  // Skip separator row (index 1), parse data rows
  const rows: TableRow[] = [];
  for (let i = 2; i < tableLines.length; i++) {
    const cells = parseRow(tableLines[i]);
    const row: TableRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? '';
    }
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Extract the first line matching a pattern from a block of text.
 */
function extractField(content: string, pattern: RegExp): string {
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Extract list items (lines starting with - ) from content.
 */
function extractListItems(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^[-*]\s+(.+)/);
    if (match) {
      items.push(match[1].trim());
    }
  }
  return items;
}

/**
 * Get section content by title from parsed sections.
 */
function getSectionContent(
  sections: Section[],
  title: string,
): string | undefined {
  const section = sections.find(
    (s) => s.title.toLowerCase() === title.toLowerCase(),
  );
  return section?.content;
}

/**
 * Get section content by partial title match.
 */
function getSectionByPrefix(
  sections: Section[],
  prefix: string,
): Section | undefined {
  return sections.find((s) =>
    s.title.toLowerCase().startsWith(prefix.toLowerCase()),
  );
}

// ---------------------------------------------------------------------------
// Artifact-specific parsers
// ---------------------------------------------------------------------------

/**
 * Parse PROJECT.md into structured ProjectData.
 */
export function parseProjectMd(content: string): ProjectData {
  const nameMatch = content.match(/^# (.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : '';

  const sections = parseMarkdownSections(content, 2);

  // Description from "What This Is"
  const whatThisIs = getSectionContent(sections, 'What This Is');
  const description = whatThisIs
    ? whatThisIs.split('\n').filter((l) => l.trim()).join(' ').trim()
    : '';

  // Current milestone
  const milestoneSection = getSectionByPrefix(sections, 'Current Milestone');
  let milestoneVersion = '';
  let milestoneName = '';
  if (milestoneSection) {
    const msMatch = milestoneSection.title.match(
      /Current Milestone:\s+v([\d.]+)\s+(.+)/,
    );
    if (msMatch) {
      milestoneVersion = `v${msMatch[1]}`;
      milestoneName = msMatch[2].trim();
    }
  }

  // Context items
  const contextContent = getSectionContent(sections, 'Context');
  const context = contextContent ? extractListItems(contextContent) : [];

  // Constraints
  const constraintsContent = getSectionContent(sections, 'Constraints');
  const constraints = constraintsContent
    ? extractListItems(constraintsContent)
    : [];
  // Clean bold markers from constraints
  const cleanConstraints = constraints.map((c) =>
    c.replace(/\*\*([^*]+)\*\*:\s*/, '$1: '),
  );

  // Key Decisions table
  const decisionsContent = getSectionContent(sections, 'Key Decisions');
  let decisions: ProjectData['decisions'] = [];
  if (decisionsContent) {
    const tableRows = parseMarkdownTable(decisionsContent);
    decisions = tableRows.map((row) => ({
      decision: row['Decision'] ?? '',
      rationale: row['Rationale'] ?? '',
      outcome: row['Outcome'] ?? '',
    }));
  }

  return {
    name,
    description,
    currentMilestone: {
      version: milestoneVersion,
      name: milestoneName,
    },
    context,
    constraints: cleanConstraints,
    decisions,
  };
}

/**
 * Parse REQUIREMENTS.md into structured RequirementsData.
 */
export function parseRequirementsMd(content: string): RequirementsData {
  if (!content.trim()) {
    return { goal: '', groups: [] };
  }

  const sections = parseMarkdownSections(content, 2);

  // Goal
  const goalContent = getSectionContent(sections, 'Goal');
  const goal = goalContent
    ? goalContent.split('\n').filter((l) => l.trim()).join(' ').trim()
    : '';

  // Requirements section contains ### groups
  const reqSection = getSectionContent(sections, 'Requirements');
  const groups: RequirementGroup[] = [];

  if (reqSection) {
    const subSections = parseMarkdownSections(
      `## Requirements\n\n${reqSection}`,
      3,
    );
    for (const sub of subSections) {
      const requirements = extractListItems(sub.content)
        .filter((item) => item.match(/\*\*REQ-\d+\*\*/))
        .map((item) => {
          const idMatch = item.match(/\*\*(REQ-\d+)\*\*:\s*(.*)/);
          return idMatch
            ? { id: idMatch[1], text: idMatch[2].trim() }
            : { id: '', text: item };
        })
        .filter((r) => r.id);

      if (requirements.length > 0) {
        groups.push({
          name: sub.title,
          requirements,
        });
      }
    }
  }

  return { goal, groups };
}

/**
 * Parse ROADMAP.md into structured RoadmapData.
 */
export function parseRoadmapMd(content: string): RoadmapData {
  if (!content.trim()) {
    return { phases: [], totalPhases: 0 };
  }

  const sections = parseMarkdownSections(content, 2);
  const phases: Phase[] = [];

  for (const section of sections) {
    // Match "Phase NN: Name"
    const phaseMatch = section.title.match(/Phase (\d+):\s+(.+)/);
    if (!phaseMatch) continue;

    const number = parseInt(phaseMatch[1], 10);
    const name = phaseMatch[2].trim();

    const status = extractField(section.content, /\*\*Status:\*\*\s*(.+)/);
    const goal = extractField(section.content, /\*\*Goal:\*\*\s*(.+)/);

    // Requirements: comma-separated REQ-IDs
    const reqStr = extractField(
      section.content,
      /\*\*Requirements:\*\*\s*(.+)/,
    );
    const requirements = reqStr
      ? reqStr.split(',').map((r) => r.trim()).filter(Boolean)
      : [];

    // Deliverables: list items after **Deliverables:**
    const deliverablesMatch = section.content.match(
      /\*\*Deliverables:\*\*\s*\n([\s\S]*?)(?=\n\*\*|\n##|$)/,
    );
    const deliverables = deliverablesMatch
      ? extractListItems(deliverablesMatch[1])
      : [];
    // Clean backtick markers from deliverables
    const cleanDeliverables = deliverables.map((d) =>
      d.replace(/`([^`]+)`/g, '$1'),
    );

    phases.push({
      number,
      name,
      status,
      goal,
      requirements,
      deliverables: cleanDeliverables,
    });
  }

  return {
    phases,
    totalPhases: phases.length,
  };
}

/**
 * Parse STATE.md into structured StateData.
 */
export function parseStateMd(content: string): StateData {
  if (!content.trim()) {
    return {
      milestone: '',
      phase: '',
      status: '',
      progress: '',
      focus: '',
      blockers: [],
      metrics: {},
      nextAction: '',
    };
  }

  const sections = parseMarkdownSections(content, 2);

  // Current Position section
  const positionContent = getSectionContent(sections, 'Current Position');
  const milestone = positionContent
    ? extractField(positionContent, /Milestone:\s*(.+)/)
    : '';
  const phase = positionContent
    ? extractField(positionContent, /Phase:\s*(.+)/)
    : '';
  const status = positionContent
    ? extractField(positionContent, /Status:\s*(.+)/)
    : '';
  const progress = positionContent
    ? extractField(positionContent, /Progress:\s*(.+)/)
    : '';

  // Focus from Project Reference section
  const projRefContent = getSectionContent(sections, 'Project Reference');
  const focus = projRefContent
    ? extractField(projRefContent, /\*\*Current focus:\*\*\s*(.+)/)
    : '';

  // Blockers from Accumulated Context
  const accContext = getSectionContent(sections, 'Accumulated Context');
  let blockers: string[] = [];
  if (accContext) {
    const blockerMatch = accContext.match(
      /### Blockers\s*\n([\s\S]*?)(?=\n###|\n##|$)/,
    );
    if (blockerMatch) {
      const blockerItems = extractListItems(blockerMatch[1]);
      blockers = blockerItems.filter(
        (b) => b !== '(none)' && b.trim().length > 0,
      );
    }
  }

  // Metrics from Performance Metrics table
  const metricsContent = getSectionContent(sections, 'Performance Metrics');
  let metrics: { [key: string]: string } = {};
  if (metricsContent) {
    const rows = parseMarkdownTable(metricsContent);
    for (const row of rows) {
      const key = row['Metric'] ?? row['Name'] ?? '';
      const value = row['Value'] ?? '';
      if (key) {
        metrics[key] = value;
      }
    }
  }

  // Session Continuity
  const sessionContent = getSectionContent(sections, 'Session Continuity');
  const nextAction = sessionContent
    ? extractField(sessionContent, /Next action:\s*(.+)/)
    : '';

  return {
    milestone,
    phase,
    status,
    progress,
    focus,
    blockers,
    metrics,
    nextAction,
  };
}

/**
 * Parse MILESTONES.md into structured MilestonesData.
 */
export function parseMilestonesMd(content: string): MilestonesData {
  if (!content.trim()) {
    return {
      milestones: [],
      totals: { milestones: 0, phases: 0, plans: 0 },
    };
  }

  const milestones: MilestoneData[] = [];

  // Parse ### headings for individual milestones
  const sections = parseMarkdownSections(content, 3);

  for (const section of sections) {
    // Match "vX.Y — Name (Phases N-M)" or "vX.Y — Name"
    const versionMatch = section.title.match(
      /v([\d.]+)\s*(?:--|\u2014)\s*(.+)/,
    );
    if (!versionMatch) continue;

    const version = `v${versionMatch[1]}`;
    const name = versionMatch[2].trim();

    const goal = extractField(section.content, /\*\*Goal:\*\*\s*(.+)/);
    const shipped = extractField(section.content, /\*\*Shipped:\*\*\s*(.+)/);

    // Stats: **Requirements:** N | **Phases:** N | **Plans:** N
    const statsLine = section.content.match(
      /\*\*Requirements:\*\*\s*(\d+|—)\s*\|\s*\*\*Phases:\*\*\s*(\d+)\s*\|\s*\*\*Plans:\*\*\s*(\d+|—)/,
    );
    const stats: MilestoneData['stats'] = {};
    if (statsLine) {
      if (statsLine[1] !== '\u2014' && statsLine[1] !== '—') {
        stats.requirements = parseInt(statsLine[1], 10);
      }
      stats.phases = parseInt(statsLine[2], 10);
      if (statsLine[3] !== '\u2014' && statsLine[3] !== '—') {
        stats.plans = parseInt(statsLine[3], 10);
      }
    }

    // Key accomplishments
    const accompMatch = section.content.match(
      /\*\*Key accomplishments:\*\*\s*\n([\s\S]*?)(?=\n###|\n##|$)/,
    );
    let accomplishments: string[] | undefined;
    if (accompMatch) {
      accomplishments = extractListItems(accompMatch[1]);
      if (accomplishments.length === 0) {
        accomplishments = undefined;
      }
    }

    milestones.push({
      version,
      name,
      goal,
      shipped,
      stats,
      accomplishments,
    });
  }

  // Totals from footer line: **Totals:** N milestones | N phases | N plans
  const totalsMatch = content.match(
    /\*\*Totals?:\*\*\s*(\d+)\s*milestones?\s*(?:\([^)]*\)\s*)?\|\s*(\d+)\s*phases?\s*\|\s*(\d+)\s*plans?/,
  );
  const totals = totalsMatch
    ? {
        milestones: parseInt(totalsMatch[1], 10),
        phases: parseInt(totalsMatch[2], 10),
        plans: parseInt(totalsMatch[3], 10),
      }
    : {
        milestones: milestones.length,
        phases: milestones.reduce((sum, m) => sum + (m.stats.phases ?? 0), 0),
        plans: milestones.reduce((sum, m) => sum + (m.stats.plans ?? 0), 0),
      };

  return { milestones, totals };
}

/**
 * Read all .planning/ artifacts from a directory and return combined DashboardData.
 * Gracefully handles missing files — returns partial data.
 */
export async function parsePlanningDir(dir: string): Promise<DashboardData> {
  const data: DashboardData = {
    generatedAt: new Date().toISOString(),
  };

  // Read each file, silently skip missing ones
  const tryRead = async (filename: string): Promise<string | null> => {
    try {
      return await readFile(join(dir, filename), 'utf-8');
    } catch {
      return null;
    }
  };

  const [projectMd, requirementsMd, roadmapMd, stateMd, milestonesMd] =
    await Promise.all([
      tryRead('PROJECT.md'),
      tryRead('REQUIREMENTS.md'),
      tryRead('ROADMAP.md'),
      tryRead('STATE.md'),
      tryRead('MILESTONES.md'),
    ]);

  if (projectMd) {
    data.project = parseProjectMd(projectMd);
  }
  if (requirementsMd) {
    data.requirements = parseRequirementsMd(requirementsMd);
  }
  if (roadmapMd) {
    data.roadmap = parseRoadmapMd(roadmapMd);
  }
  if (stateMd) {
    data.state = parseStateMd(stateMd);
  }
  if (milestonesMd) {
    data.milestones = parseMilestonesMd(milestonesMd);
  }

  return data;
}
