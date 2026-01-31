import * as p from '@clack/prompts';
import pc from 'picocolors';
import matter from 'gray-matter';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { validateAgentFrontmatter, validateToolsField } from '../../validation/agent-validation.js';

// ============================================================================
// Migration Types
// ============================================================================

export interface AgentMigrationResult {
  name: string;
  path: string;
  status: 'migrated' | 'skipped' | 'error';
  changes?: string[];
  error?: string;
}

export interface AgentIssue {
  needsMigration: boolean;
  issues: string[];
}

export interface AgentInfo {
  name: string;
  path: string;
  needsMigration: boolean;
  issues: string[];
}

// ============================================================================
// Issue Detection
// ============================================================================

/**
 * Detect issues in an agent file that need migration.
 *
 * Currently focuses on:
 * - tools field as array (should be comma-separated string)
 * - tools field with wrong casing
 *
 * @param content - Raw file content
 * @returns Detection result with issues
 */
export function detectAgentIssues(content: string): AgentIssue {
  const issues: string[] = [];

  try {
    const parsed = matter(content);
    const data = parsed.data;

    // Check if tools is an array (incorrect format)
    if (Array.isArray(data.tools)) {
      issues.push('tools field is an array (should be comma-separated string)');
    }

    // Check if tools exists and is a string with wrong casing
    if (typeof data.tools === 'string') {
      const result = validateToolsField(data.tools);
      if (result.corrected) {
        issues.push('tools field has tool names with incorrect casing');
      }
    }

  } catch (error) {
    // If parsing fails, not a valid agent file
    issues.push(`Failed to parse frontmatter: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  return {
    needsMigration: issues.length > 0,
    issues,
  };
}

// ============================================================================
// Single Agent Migration
// ============================================================================

/**
 * Migrate a single agent file.
 *
 * Fixes:
 * - Converts tools array to comma-separated string
 * - Corrects tool name casing
 *
 * @param filePath - Path to agent file
 * @param dryRun - If true, only preview changes without writing
 * @returns Migration result
 */
export async function migrateAgentFile(
  filePath: string,
  dryRun: boolean = false
): Promise<AgentMigrationResult> {
  const name = basename(filePath, '.md');

  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const data = parsed.data;
    const changes: string[] = [];

    // Check if tools is an array and convert
    if (Array.isArray(data.tools)) {
      const toolsArray = data.tools as string[];
      const toolsString = toolsArray.join(', ');
      data.tools = toolsString;
      changes.push(`Converted tools array to string: "${toolsString}"`);
    }

    // Validate and correct tool names if string
    if (typeof data.tools === 'string') {
      const result = validateToolsField(data.tools);
      if (result.corrected) {
        const oldTools = data.tools;
        data.tools = result.corrected;
        changes.push(`Corrected tool casing: "${oldTools}" -> "${result.corrected}"`);
      }
    }

    // No changes needed
    if (changes.length === 0) {
      return {
        name,
        path: filePath,
        status: 'skipped',
        changes: ['No migration needed'],
      };
    }

    // Validate the corrected frontmatter
    const validation = validateAgentFrontmatter(data);
    if (!validation.valid) {
      return {
        name,
        path: filePath,
        status: 'error',
        error: `Validation failed after migration: ${validation.errors.join('; ')}`,
      };
    }

    // Write if not dry run
    if (!dryRun) {
      const newContent = matter.stringify(parsed.content, data);
      await writeFile(filePath, newContent, 'utf-8');
    }

    return {
      name,
      path: filePath,
      status: 'migrated',
      changes,
    };

  } catch (error) {
    return {
      name,
      path: filePath,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Agent Listing
// ============================================================================

/**
 * List all agents in a directory and detect which need migration.
 *
 * @param agentsDir - Directory to scan (default: .claude/agents)
 * @returns Array of agent info with migration status
 */
export async function listAgentsInDir(agentsDir: string): Promise<AgentInfo[]> {
  const agents: AgentInfo[] = [];

  try {
    const entries = await readdir(agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = join(agentsDir, entry.name);
        const name = entry.name.replace(/\.md$/, '');

        try {
          const content = await readFile(filePath, 'utf-8');
          const detection = detectAgentIssues(content);

          agents.push({
            name,
            path: filePath,
            needsMigration: detection.needsMigration,
            issues: detection.issues,
          });
        } catch {
          agents.push({
            name,
            path: filePath,
            needsMigration: false,
            issues: ['Could not read file'],
          });
        }
      }
    }
  } catch {
    // Directory doesn't exist or not readable
  }

  return agents;
}

// ============================================================================
// CLI Command
// ============================================================================

/**
 * CLI command for agent migration.
 *
 * Usage:
 * - skill-creator migrate-agent              - Scan and migrate all agents needing fixes
 * - skill-creator migrate-agent <agent-name> - Migrate a specific agent
 * - skill-creator migrate-agent --dry-run    - Preview changes without writing
 *
 * @param agentName - Optional specific agent name to migrate
 * @param options - Configuration options
 * @returns Exit code (0 = success, 1 = error)
 */
export async function migrateAgentCommand(
  agentName?: string,
  options?: { agentsDir?: string; dryRun?: boolean }
): Promise<number> {
  const agentsDir = options?.agentsDir ?? '.claude/agents';
  const dryRun = options?.dryRun ?? false;

  // Case 1: Specific agent provided
  if (agentName) {
    const filePath = join(agentsDir, `${agentName}.md`);

    // Check if the file exists
    try {
      await stat(filePath);
    } catch {
      p.log.error(`Agent "${agentName}" not found at ${filePath}`);
      return 1;
    }

    // Preview or migrate
    if (dryRun) {
      p.intro(pc.bgYellow(pc.black(' Agent Migration Preview ')));
    }

    const result = await migrateAgentFile(filePath, dryRun);
    reportMigrationResult(result, dryRun);

    if (result.status === 'error') {
      return 1;
    }

    return 0;
  }

  // Case 2: Batch mode - scan all agents
  p.intro(pc.bgCyan(pc.black(' Agent Migration ')));

  if (dryRun) {
    p.log.info(pc.yellow('Dry run mode - no files will be modified'));
  }

  const agents = await listAgentsInDir(agentsDir);

  if (agents.length === 0) {
    p.log.info(`No agents found in ${agentsDir}`);
    p.outro('Nothing to migrate.');
    return 0;
  }

  const needMigration = agents.filter(a => a.needsMigration);
  const upToDate = agents.filter(a => !a.needsMigration);

  // Report current state
  if (upToDate.length > 0) {
    p.log.info(
      `${upToDate.length} agent(s) already correct: ` +
      pc.dim(upToDate.slice(0, 5).map(a => a.name).join(', ') +
        (upToDate.length > 5 ? ', ...' : ''))
    );
  }

  if (needMigration.length === 0) {
    p.log.success('All agents have correct tools format.');
    p.outro('No migration needed.');
    return 0;
  }

  p.log.warn(`Found ${needMigration.length} agent(s) to migrate:`);
  for (const agent of needMigration) {
    p.log.message(`  - ${pc.yellow(agent.name)}`);
    for (const issue of agent.issues) {
      p.log.message(`    ${pc.dim(issue)}`);
    }
  }
  p.log.message('');

  // Confirm before proceeding (unless dry run)
  if (!dryRun) {
    const confirm = await p.confirm({
      message: `Migrate ${needMigration.length} agent(s)?`,
      initialValue: true,
    });

    if (p.isCancel(confirm) || !confirm) {
      p.cancel('Migration cancelled');
      return 0;
    }
  }

  // Migrate each agent
  const results: AgentMigrationResult[] = [];

  for (const agent of needMigration) {
    const result = await migrateAgentFile(agent.path, dryRun);
    results.push(result);
    reportMigrationResult(result, dryRun);
  }

  // Summary
  const migrated = results.filter(r => r.status === 'migrated').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors = results.filter(r => r.status === 'error').length;

  p.log.message('');
  p.log.message(pc.bold('Migration Summary:'));
  if (migrated > 0) p.log.message(`  ${pc.green(dryRun ? 'Would migrate:' : 'Migrated:')} ${migrated}`);
  if (skipped > 0) p.log.message(`  ${pc.dim('Skipped:')} ${skipped}`);
  if (errors > 0) p.log.message(`  ${pc.red('Errors:')} ${errors}`);

  p.outro(dryRun ? 'Dry run complete.' : 'Migration complete.');

  return errors > 0 ? 1 : 0;
}

/**
 * Report a single migration result.
 */
function reportMigrationResult(result: AgentMigrationResult, dryRun: boolean): void {
  const prefix = dryRun ? 'Would migrate' : 'Migrated';

  switch (result.status) {
    case 'migrated':
      p.log.success(`${prefix} "${result.name}"`);
      if (result.changes) {
        for (const change of result.changes) {
          p.log.message(`  ${pc.dim(change)}`);
        }
      }
      break;

    case 'skipped':
      p.log.info(`Skipped "${result.name}" - no changes needed`);
      break;

    case 'error':
      p.log.error(`Failed "${result.name}": ${result.error}`);
      break;
  }
}
