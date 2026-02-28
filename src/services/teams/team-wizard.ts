/**
 * Team creation wizard with interactive and non-interactive paths.
 *
 * The interactive wizard uses @clack/prompts to guide users through
 * pattern selection, naming, member count, and scope configuration.
 * The non-interactive path accepts CLI flags for scripted usage.
 *
 * Both paths share the same flow:
 * 1. Generate config from template
 * 2. Save config via TeamStore
 * 3. Generate agent .md files via writeTeamAgentFiles
 * 4. Display summary of created/skipped agents
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';

import {
  generateLeaderWorkerTemplate,
  generatePipelineTemplate,
  generateSwarmTemplate,
  generateRouterTemplate,
  generateMapReduceTemplate,
  LEADER_TOOLS,
  WORKER_TOOLS,
  PIPELINE_STAGE_TOOLS,
  SWARM_WORKER_TOOLS,
  ROUTER_TOOLS,
  REDUCER_TOOLS,
} from './templates.js';
import type { TemplateResult } from './templates.js';
import { TeamStore, getTeamsBasePath, getAgentsBasePath } from './team-store.js';
import type { TeamScope } from './team-store.js';
import { writeTeamAgentFiles } from './team-agent-generator.js';
import type { AgentMemberInput } from './team-agent-generator.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the team creation wizard.
 *
 * When both name and pattern are provided, the non-interactive path is used.
 * Otherwise, the interactive wizard prompts for missing values.
 */
export interface WizardOptions {
  /** Team name (lowercase, alphanumeric + hyphens). */
  name?: string;
  /** Team pattern: 'leader-worker' | 'pipeline' | 'swarm'. */
  pattern?: string;
  /** Comma-separated member names or numeric count (default: '3'). */
  members?: string;
  /** Storage scope: 'user' | 'project' (default: 'project'). */
  scope?: string;
  /** Optional team description. */
  description?: string;
}

/**
 * Injectable paths for testing. Allows tests to redirect
 * teams and agents directories to temp locations.
 */
export interface CreatePaths {
  /** Directory to store team config.json files. */
  teamsDir: string;
  /** Directory to write agent .md files into. */
  agentsDir: string;
}

// ============================================================================
// Template Dispatch
// ============================================================================

const VALID_PATTERNS = ['leader-worker', 'pipeline', 'swarm', 'router', 'map-reduce'] as const;
type ValidPattern = (typeof VALID_PATTERNS)[number];

/**
 * Generate a template result for the given pattern.
 */
function generateTemplate(
  pattern: ValidPattern,
  name: string,
  description: string | undefined,
  workerCount: number
): TemplateResult {
  const opts = { name, description, workerCount };

  switch (pattern) {
    case 'leader-worker':
      return generateLeaderWorkerTemplate(opts);
    case 'pipeline':
      return generatePipelineTemplate(opts);
    case 'swarm':
      return generateSwarmTemplate(opts);
    case 'router':
      return generateRouterTemplate(opts);
    case 'map-reduce':
      return generateMapReduceTemplate(opts);
  }
}

/**
 * Get the tools array for a member based on pattern and role.
 */
function getToolsForMember(
  member: { agentType?: string },
  pattern: ValidPattern
): string[] {
  if (member.agentType === 'router') return ROUTER_TOOLS;
  if (member.agentType === 'reducer') return REDUCER_TOOLS;

  const isLeader = member.agentType === 'coordinator' || member.agentType === 'orchestrator';
  if (isLeader) {
    return LEADER_TOOLS;
  }

  switch (pattern) {
    case 'leader-worker':
      return WORKER_TOOLS;
    case 'pipeline':
      return PIPELINE_STAGE_TOOLS;
    case 'swarm':
      return SWARM_WORKER_TOOLS;
    case 'router':
      return WORKER_TOOLS;
    case 'map-reduce':
      return WORKER_TOOLS;
  }
}

/**
 * Convert config members to AgentMemberInput array with tools.
 */
function toAgentMemberInputs(
  members: Array<{ agentId: string; name: string; agentType?: string; [key: string]: unknown }>,
  pattern: ValidPattern
): AgentMemberInput[] {
  return members.map((m) => ({
    agentId: m.agentId,
    name: m.name,
    agentType: m.agentType,
    tools: getToolsForMember(m, pattern),
  }));
}

// ============================================================================
// Summary Display
// ============================================================================

/**
 * Display summary of agent file generation results.
 */
function displayAgentSummary(
  created: string[],
  skipped: string[],
  agentsDir: string
): void {
  if (created.length > 0) {
    p.log.success(`Created ${created.length} agent file(s):`);
    for (const id of created) {
      p.log.message(`  ${pc.green('+')} ${agentsDir}/${id}.md`);
    }
  }

  if (skipped.length > 0) {
    p.log.info(`Skipped ${skipped.length} existing agent file(s):`);
    for (const id of skipped) {
      p.log.message(`  ${pc.dim('-')} ${agentsDir}/${id}.md (exists)`);
    }
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a team name: non-empty, lowercase, alphanumeric + hyphens, max 64 chars.
 */
function validateTeamName(value: string): string | undefined {
  if (!value) return 'Name is required';
  if (value.length > 64) return 'Max 64 characters';
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 1) {
    return 'Must be lowercase alphanumeric with hyphens, cannot start/end with hyphen';
  }
  if (value.length === 1 && !/^[a-z0-9]$/.test(value)) {
    return 'Must be lowercase alphanumeric';
  }
  if (/[^a-z0-9-]/.test(value)) {
    return 'Only lowercase letters, numbers, and hyphens allowed';
  }
  return undefined;
}

// ============================================================================
// Interactive Wizard
// ============================================================================

/**
 * Run the interactive team creation wizard.
 *
 * Guides the user through: Pattern -> Name -> Description -> Worker count -> Scope.
 * After collecting inputs, generates config, saves it, and creates agent files.
 *
 * @param opts - Pre-filled options (any provided value skips that prompt)
 */
async function interactiveWizard(opts?: WizardOptions): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' Create a New Team ')));

  // Step 1: Pattern selection
  const pattern = await p.select({
    message: 'Select a team pattern:',
    options: [
      { value: 'leader-worker', label: 'Leader/Worker', hint: '1 lead + N workers for parallel tasks' },
      { value: 'pipeline', label: 'Pipeline', hint: 'Sequential stages with task dependencies' },
      { value: 'swarm', label: 'Swarm', hint: 'Lead + self-claiming workers' },
      { value: 'router', label: 'Router', hint: '1 router classifies, N specialists handle' },
      { value: 'map-reduce', label: 'Map-Reduce', hint: 'Fan-out to workers, consolidate results' },
    ],
  });

  if (p.isCancel(pattern)) {
    p.cancel('Team creation cancelled');
    return;
  }

  // Step 2: Team name
  const name = await p.text({
    message: 'Team name:',
    placeholder: 'my-research-team',
    validate: (value) => {
      if (!value) return 'Name is required';
      return validateTeamName(value);
    },
  });

  if (p.isCancel(name)) {
    p.cancel('Team creation cancelled');
    return;
  }

  // Step 3: Description
  const defaultDesc: Record<string, string> = {
    'leader-worker': 'A leader delegates tasks to parallel workers',
    'pipeline': 'Sequential stages process data in order',
    'swarm': 'Workers self-claim tasks from a shared queue',
    'router': 'A router classifies and routes work to specialist members',
    'map-reduce': 'Work is split, processed in parallel, and consolidated',
  };

  const description = await p.text({
    message: 'Description (optional):',
    placeholder: defaultDesc[pattern as string] ?? 'Describe your team',
  });

  if (p.isCancel(description)) {
    p.cancel('Team creation cancelled');
    return;
  }

  // Step 4: Worker/stage count
  const countLabel = pattern === 'pipeline' ? 'Number of stages'
    : pattern === 'router' ? 'Number of specialists'
    : 'Number of workers';
  const workerCountStr = await p.text({
    message: `${countLabel} (1-10):`,
    defaultValue: '3',
    validate: (value) => {
      if (!value) return 'Number is required';
      const num = parseInt(value, 10);
      if (isNaN(num)) return 'Must be a number';
      if (num < 1 || num > 10) return 'Must be between 1 and 10';
      return undefined;
    },
  });

  if (p.isCancel(workerCountStr)) {
    p.cancel('Team creation cancelled');
    return;
  }

  const workerCount = parseInt(workerCountStr as string, 10);

  // Step 5: Scope
  const scope = await p.select({
    message: 'Where should this team be stored?',
    options: [
      { value: 'project', label: '.claude/teams/ (this project)', hint: 'recommended' },
      { value: 'user', label: '~/.claude/teams/ (all projects)' },
    ],
  });

  if (p.isCancel(scope)) {
    p.cancel('Team creation cancelled');
    return;
  }

  // Generate config
  const validPattern = pattern as ValidPattern;
  const desc = (description as string) || undefined;
  const templateResult = generateTemplate(validPattern, name as string, desc, workerCount);

  // Resolve paths
  const teamsDir = getTeamsBasePath(scope as TeamScope);
  const agentsDir = getAgentsBasePath();
  const store = new TeamStore(teamsDir);

  // Check name conflicts
  const exists = await store.exists(templateResult.config.name);
  if (exists) {
    const overwrite = await p.confirm({
      message: `Team "${templateResult.config.name}" already exists. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel('Team creation cancelled -- choose a different name');
      return;
    }
  }

  // Save config
  const s = p.spinner();
  s.start('Creating team...');

  const configPath = await store.save(templateResult.config);

  // Generate agent files
  const agentInputs = toAgentMemberInputs(templateResult.config.members, validPattern);
  const agentResult = writeTeamAgentFiles(agentInputs, templateResult.config.name, agentsDir);

  s.stop('Team created!');

  // Show summary
  p.log.message('');
  p.log.message(pc.bold('Team Configuration'));
  p.log.message(`  Pattern:  ${pc.cyan(templateResult.patternInfo.topology)}`);
  p.log.message(`  Name:     ${pc.cyan(templateResult.config.name)}`);
  p.log.message(`  Members:  ${templateResult.patternInfo.memberSummary}`);
  p.log.message(`  Config:   ${pc.dim(configPath)}`);
  p.log.message('');

  displayAgentSummary(agentResult.created, agentResult.skipped, agentsDir);

  p.outro(pc.green(`Team "${templateResult.config.name}" is ready!`));
}

// ============================================================================
// Non-Interactive Creation
// ============================================================================

/**
 * Create a team non-interactively from CLI flags.
 *
 * Requires name and pattern. All other options have sensible defaults.
 * Throws on validation errors or name conflicts (no interactive prompts).
 *
 * @param opts - Required: name and pattern. Optional: members, scope, description.
 * @param paths - Injectable paths for testing (defaults to scope-derived paths).
 * @throws Error if name or pattern missing, pattern invalid, or team already exists.
 */
export async function nonInteractiveCreate(
  opts: WizardOptions,
  paths?: CreatePaths
): Promise<void> {
  // Validate required fields
  if (!opts.name) {
    throw new Error('Team name is required (--name)');
  }
  if (!opts.pattern) {
    throw new Error('Team pattern is required (--pattern)');
  }

  // Validate name format
  const nameError = validateTeamName(opts.name);
  if (nameError) {
    throw new Error(`Invalid team name: ${nameError}`);
  }

  // Validate pattern
  if (!VALID_PATTERNS.includes(opts.pattern as ValidPattern)) {
    throw new Error(
      `Invalid pattern "${opts.pattern}". Must be one of: ${VALID_PATTERNS.join(', ')}`
    );
  }

  // Parse worker count
  const workerCount = opts.members ? parseInt(opts.members, 10) : 3;
  if (isNaN(workerCount) || workerCount < 1 || workerCount > 10) {
    throw new Error('Members must be a number between 1 and 10');
  }

  // Resolve scope and paths
  const scope: TeamScope = (opts.scope === 'user' ? 'user' : 'project');
  const teamsDir = paths?.teamsDir ?? getTeamsBasePath(scope);
  const agentsDir = paths?.agentsDir ?? getAgentsBasePath();

  // Generate config
  const validPattern = opts.pattern as ValidPattern;
  const templateResult = generateTemplate(
    validPattern,
    opts.name,
    opts.description,
    workerCount
  );

  // Check name conflicts (throw in non-interactive mode)
  const store = new TeamStore(teamsDir);
  const exists = await store.exists(opts.name);
  if (exists) {
    throw new Error(`Team "${opts.name}" already exists. Use a different name or delete the existing team.`);
  }

  // Save config
  const configPath = await store.save(templateResult.config);

  // Generate agent files
  const agentInputs = toAgentMemberInputs(templateResult.config.members, validPattern);
  const agentResult = writeTeamAgentFiles(agentInputs, templateResult.config.name, agentsDir);

  // Display summary (non-interactive still outputs for CLI feedback)
  p.log.success(`Team "${opts.name}" created at ${configPath}`);
  p.log.message(`  Pattern: ${templateResult.patternInfo.topology}`);
  p.log.message(`  Members: ${templateResult.patternInfo.memberSummary}`);

  if (agentResult.created.length > 0) {
    p.log.message(`  Agents created: ${agentResult.created.join(', ')}`);
  }
  if (agentResult.skipped.length > 0) {
    p.log.message(`  Agents skipped: ${agentResult.skipped.join(', ')}`);
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Team creation wizard entry point.
 *
 * Routes to interactive or non-interactive path based on provided options.
 * If both name and pattern are provided, uses non-interactive path.
 * Otherwise, launches the interactive @clack/prompts wizard.
 *
 * @param opts - Optional wizard options. If name + pattern present, skips interactive mode.
 */
export async function teamCreationWizard(opts?: WizardOptions): Promise<void> {
  if (opts?.name && opts?.pattern) {
    return nonInteractiveCreate(opts);
  }
  return interactiveWizard(opts);
}
