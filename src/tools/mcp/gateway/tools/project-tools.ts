/**
 * Gateway project:* tool implementations.
 *
 * Provides MCP tools for discovering, inspecting, creating, and executing
 * phases in GSD projects. Tools are registered on an McpServer instance
 * via the registration functions.
 *
 * Project discovery scans a root directory for subdirectories containing
 * .planning/ROADMAP.md -- the hallmark of a GSD-managed project.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseProject } from '../../../../orchestrator/state/project-parser.js';

// ── Types ───────────────────────────────────────────────────────────────

export interface ProjectToolsConfig {
  /** Root directory containing GSD projects. Each subdirectory with .planning/ is a project. */
  projectsRoot: string;
}

export interface ProjectSummary {
  /** Project directory name. */
  name: string;
  /** Absolute path to the project directory. */
  path: string;
  /** Project status extracted from ROADMAP.md. */
  status: string;
  /** Number of phases in the roadmap. */
  phaseCount: number;
  /** ISO timestamp of last activity (STATE.md mtime). */
  lastActivity: string;
}

export interface ProjectDetails {
  /** Project directory name. */
  name: string;
  /** Parsed PROJECT.md content, or null if file is missing. */
  config: {
    name: string | null;
    coreValue: string | null;
    currentMilestone: string | null;
    description: string | null;
  } | null;
  /** Raw ROADMAP.md content. */
  roadmap: string;
  /** Raw STATE.md content. */
  state: string;
  /** List of completed plan summary file paths (relative). */
  deliverables: string[];
}

export interface CreateProjectResult {
  created: boolean;
  name: string;
  path: string;
  error?: string;
}

export interface ExecutePhaseResult {
  triggered: boolean;
  project: string;
  phase: number;
  status: string;
  error?: string;
}

// ── Core Functions ──────────────────────────────────────────────────────

/**
 * Count phases in a ROADMAP.md by matching lines that look like phase entries.
 * Matches patterns like:
 *   - [ ] Phase N: ...
 *   - [x] Phase N: ...
 *   - **Phase N: ...**
 *   - [x] **Phase N:** ...
 */
function countPhases(roadmapContent: string): number {
  const lines = roadmapContent.split('\n');
  let count = 0;
  for (const line of lines) {
    // Match "Phase N:" patterns (with optional checkbox and bold markers)
    if (/Phase\s+\d+/i.test(line)) {
      count++;
    }
  }
  return count;
}

/**
 * Extract a status string from ROADMAP.md content.
 * Looks for the Progress section or status indicators.
 */
function extractStatus(roadmapContent: string): string {
  const lines = roadmapContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('in progress')) return 'in-progress';
    if (trimmed.toLowerCase().includes('complete')) return 'complete';
    if (trimmed.toLowerCase().includes('not started')) return 'not-started';
  }
  return 'unknown';
}

/**
 * Discover GSD projects in a root directory.
 *
 * A directory is considered a GSD project if it contains
 * .planning/ROADMAP.md. Returns summary information for each project.
 */
export async function discoverProjects(root: string): Promise<ProjectSummary[]> {
  const projects: ProjectSummary[] = [];

  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const projectDir = join(root, entry.name);
    const roadmapPath = join(projectDir, '.planning', 'ROADMAP.md');

    try {
      const roadmapContent = await readFile(roadmapPath, 'utf-8');
      const phaseCount = countPhases(roadmapContent);
      const status = extractStatus(roadmapContent);

      // Get last activity from STATE.md mtime
      let lastActivity: string;
      try {
        const statePath = join(projectDir, '.planning', 'STATE.md');
        const stateStat = await stat(statePath);
        lastActivity = stateStat.mtime.toISOString();
      } catch {
        // Fall back to ROADMAP.md mtime
        const roadmapStat = await stat(roadmapPath);
        lastActivity = roadmapStat.mtime.toISOString();
      }

      projects.push({
        name: entry.name,
        path: projectDir,
        status,
        phaseCount,
        lastActivity,
      });
    } catch {
      // Not a GSD project (no ROADMAP.md), skip
    }
  }

  return projects;
}

/**
 * Get full details for a GSD project at the given path.
 */
export async function getProjectDetails(projectPath: string): Promise<ProjectDetails> {
  const name = projectPath.split('/').pop() ?? projectPath;
  const planningDir = join(projectPath, '.planning');

  // Read PROJECT.md (optional)
  let config: ProjectDetails['config'] = null;
  try {
    const projectContent = await readFile(join(planningDir, 'PROJECT.md'), 'utf-8');
    config = parseProject(projectContent);
  } catch {
    // PROJECT.md is optional
  }

  // Read ROADMAP.md
  let roadmap = '';
  try {
    roadmap = await readFile(join(planningDir, 'ROADMAP.md'), 'utf-8');
  } catch {
    // Empty if missing
  }

  // Read STATE.md
  let state = '';
  try {
    state = await readFile(join(planningDir, 'STATE.md'), 'utf-8');
  } catch {
    // Empty if missing
  }

  // Find completed plan summaries
  const deliverables: string[] = [];
  try {
    const phasesDir = join(planningDir, 'phases');
    const phaseEntries = await readdir(phasesDir, { withFileTypes: true });
    for (const phaseEntry of phaseEntries) {
      if (!phaseEntry.isDirectory()) continue;
      const phaseDir = join(phasesDir, phaseEntry.name);
      const files = await readdir(phaseDir);
      for (const file of files) {
        if (file.endsWith('-SUMMARY.md')) {
          deliverables.push(join('phases', phaseEntry.name, file));
        }
      }
    }
  } catch {
    // No phases directory
  }

  return { name, config, roadmap, state, deliverables };
}

/**
 * Create a new GSD project with basic .planning/ structure.
 */
export async function createProject(
  root: string,
  name: string,
  vision: string,
): Promise<CreateProjectResult> {
  const projectDir = join(root, name);
  const planningDir = join(projectDir, '.planning');

  // Check if project already exists
  try {
    await stat(projectDir);
    return {
      created: false,
      name,
      path: projectDir,
      error: `Project "${name}" already exists at ${projectDir}`,
    };
  } catch {
    // Good -- project doesn't exist yet
  }

  // Create directory structure
  await mkdir(join(planningDir, 'phases'), { recursive: true });

  // Write PROJECT.md
  const projectMd = `# ${name}\n\n## Core Value\n${vision}\n\n## What This Is\n${vision}\n`;
  await writeFile(join(planningDir, 'PROJECT.md'), projectMd);

  // Write ROADMAP.md
  const roadmapMd = `# Roadmap: ${name}\n\n## Phases\n\nNo phases defined yet.\n\n## Progress\n\nNot started.\n`;
  await writeFile(join(planningDir, 'ROADMAP.md'), roadmapMd);

  // Write STATE.md
  const stateMd = `# State: ${name}\n\n## Current Position\n\nPhase: none\nStatus: Not started\n`;
  await writeFile(join(planningDir, 'STATE.md'), stateMd);

  return { created: true, name, path: projectDir };
}

/**
 * Trigger execution of a specific phase in a project.
 *
 * Validates that the project exists and the phase number is reasonable.
 * Actual execution is async -- this returns an acknowledgment.
 */
export async function triggerPhaseExecution(
  root: string,
  projectName: string,
  phase: number,
): Promise<ExecutePhaseResult> {
  const projectDir = join(root, projectName);
  const roadmapPath = join(projectDir, '.planning', 'ROADMAP.md');

  // Check project exists
  try {
    await stat(roadmapPath);
  } catch {
    return {
      triggered: false,
      project: projectName,
      phase,
      status: 'error',
      error: `Project "${projectName}" not found at ${projectDir}`,
    };
  }

  // Check phase exists in roadmap
  const roadmapContent = await readFile(roadmapPath, 'utf-8');
  const phaseCount = countPhases(roadmapContent);

  if (phase < 1 || phase > phaseCount) {
    return {
      triggered: false,
      project: projectName,
      phase,
      status: 'error',
      error: `Invalid phase ${phase}: project has ${phaseCount} phases (1-${phaseCount})`,
    };
  }

  return {
    triggered: true,
    project: projectName,
    phase,
    status: 'queued',
  };
}

// ── Tool Registration ───────────────────────────────────────────────────

/**
 * Register project.list and project.get tools (read scope) on an McpServer.
 */
export function registerProjectReadTools(server: McpServer, config: ProjectToolsConfig): void {
  server.tool(
    'project.list',
    'List all GSD projects with name, status, phase count, and last activity',
    {},
    async () => {
      const projects = await discoverProjects(config.projectsRoot);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(projects, null, 2),
        }],
      };
    },
  );

  server.tool(
    'project.get',
    'Get full project details including config, phase state, and deliverables',
    {
      name: z.string().describe('Project directory name'),
    },
    async (args) => {
      const projectDir = join(config.projectsRoot, args.name);
      try {
        await stat(join(projectDir, '.planning', 'ROADMAP.md'));
      } catch {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ error: `Project "${args.name}" not found` }),
          }],
          isError: true,
        };
      }

      const details = await getProjectDetails(projectDir);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(details, null, 2),
        }],
      };
    },
  );
}

/**
 * Register project.create and project.execute-phase tools (write scope) on an McpServer.
 */
export function registerProjectWriteTools(server: McpServer, config: ProjectToolsConfig): void {
  server.tool(
    'project.create',
    'Create a new GSD project from a vision document',
    {
      name: z.string().describe('Project name (used as directory name)'),
      vision: z.string().describe('Vision document content'),
    },
    async (args) => {
      const result = await createProject(config.projectsRoot, args.name, args.vision);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
        isError: !result.created,
      };
    },
  );

  server.tool(
    'project.execute-phase',
    'Trigger execution of a specific phase for a named project',
    {
      name: z.string().describe('Project directory name'),
      phase: z.number().int().min(1).describe('Phase number to execute'),
    },
    async (args) => {
      const result = await triggerPhaseExecution(config.projectsRoot, args.name, args.phase);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
        isError: !result.triggered,
      };
    },
  );
}
