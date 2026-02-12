import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { SkillIndex, SkillIndexEntry } from '../storage/skill-index.js';
import { listAllScopes, type ScopedSkillEntry } from '../storage/skill-index.js';
import type { SkillScope } from '../types/scope.js';
import { BudgetValidator, formatProgressBar } from '../validation/budget-validation.js';
import { SkillStore } from '../storage/skill-store.js';
import { DependencyGraph } from '../composition/dependency-graph.js';
import { getSkillsBasePath } from '../types/scope.js';
import type { SkillMetadata } from '../types/skill.js';

/**
 * Scope filter for listing skills.
 * - 'user': Show only user-level skills
 * - 'project': Show only project-level skills
 * - 'all': Show skills from all scopes (default)
 */
export type ScopeFilter = 'user' | 'project' | 'all';

/**
 * Parse CLI arguments to determine scope filter.
 *
 * @param args - Array of CLI arguments
 * @returns Parsed scope filter value
 */
export function parseScopeFilter(args: string[]): ScopeFilter {
  const scopeArg = args.find(a => a.startsWith('--scope='));
  if (scopeArg) {
    const value = scopeArg.split('=')[1];
    if (value === 'user' || value === 'project') return value;
  }
  return 'all';
}

/**
 * Format a scope header with count and path information.
 */
function formatScopeHeader(scope: SkillScope, count: number): string {
  const label = scope === 'user' ? 'User-level skills' : 'Project-level skills';
  const path = scope === 'user' ? '~/.claude/skills/' : '.claude/skills/';
  return pc.bold(`\n${label} (${count}):`) + pc.dim(` ${path}`);
}

/**
 * Format a scoped skill entry with scope indicator, conflict marker,
 * and optional inheritance chain.
 */
function formatScopedSkillEntry(entry: ScopedSkillEntry, extendsChain?: string[]): string {
  const badge = entry.enabled
    ? pc.green('\u25cf')  // filled circle
    : pc.dim('\u25cb');   // empty circle

  const scopeTag = pc.dim(`[${entry.scope}]`);
  const conflict = entry.hasConflict ? pc.yellow(' [!]') : '';

  // Truncate long descriptions
  const maxDescLen = 50;
  const desc = entry.description.length > maxDescLen
    ? entry.description.slice(0, maxDescLen) + '...'
    : entry.description;

  let result = `${badge} ${pc.bold(entry.name)} ${scopeTag}${conflict}\n  ${pc.dim(desc)}`;

  // Show inheritance chain if the skill extends another
  if (extendsChain && extendsChain.length > 1) {
    result += `\n  ${pc.dim(`extends: ${extendsChain.join(' -> ')}`)}`;
  }

  return result;
}

/**
 * List skills workflow with multi-scope support.
 *
 * Shows skills grouped by scope (project first, then user) with:
 * - Scope indicators [user] or [project] next to each skill
 * - Conflict indicators [!] when same name exists at both scopes
 * - Budget summary for cumulative skill size
 *
 * @param _skillIndex - Unused, kept for API compatibility
 * @param options - Optional configuration including scope filter
 */
export async function listSkillsWorkflow(
  _skillIndex: SkillIndex,
  options?: { scopeFilter?: ScopeFilter }
): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' Your Skills ')));

  // Get all skills from both scopes
  const allSkills = await listAllScopes();

  // Apply scope filter
  const filter = options?.scopeFilter ?? 'all';
  const skills = filter === 'all'
    ? allSkills
    : allSkills.filter(s => s.scope === filter);

  if (skills.length === 0) {
    p.log.warn('No skills found. Create one with: skill-creator create');
    p.outro('0 skills');
    return;
  }

  // Group by scope (project first - it takes precedence)
  const projectSkills = skills.filter(s => s.scope === 'project');
  const userSkills = skills.filter(s => s.scope === 'user');

  // Build dependency graphs for inheritance chain display (per scope)
  const chainsByScope = new Map<string, Map<string, string[]>>();
  for (const scope of ['project', 'user'] as const) {
    try {
      const store = new SkillStore(getSkillsBasePath(scope));
      const names = await store.list();
      const metadataMap = new Map<string, SkillMetadata>();
      for (const name of names) {
        try {
          const skill = await store.read(name);
          if (skill) metadataMap.set(name, skill.metadata);
        } catch { /* skip unreadable */ }
      }
      if (metadataMap.size > 0) {
        const graph = DependencyGraph.fromSkills(metadataMap);
        const chains = new Map<string, string[]>();
        for (const name of metadataMap.keys()) {
          try {
            const parent = graph.getParent(name);
            if (parent) {
              chains.set(name, graph.getInheritanceChain(name));
            }
          } catch { /* skip cycles */ }
        }
        chainsByScope.set(scope, chains);
      }
    } catch { /* skip scope on error */ }
  }

  // Display project-level first (takes precedence)
  if (projectSkills.length > 0) {
    const chains = chainsByScope.get('project');
    p.log.message(formatScopeHeader('project', projectSkills.length));
    for (const skill of projectSkills) {
      const chain = chains?.get(skill.name);
      p.log.message(formatScopedSkillEntry(skill, chain));
    }
  }

  // Then user-level
  if (userSkills.length > 0) {
    const chains = chainsByScope.get('user');
    p.log.message(formatScopeHeader('user', userSkills.length));
    for (const skill of userSkills) {
      const chain = chains?.get(skill.name);
      p.log.message(formatScopedSkillEntry(skill, chain));
    }
  }

  // Show conflict legend if any conflicts
  const hasConflicts = skills.some(s => s.hasConflict);
  if (hasConflicts) {
    p.log.message('');
    p.log.message(pc.dim('[!] = Same name exists at other scope (project takes precedence)'));
  }

  // Budget summary - check project scope (primary scope)
  try {
    const budgetValidator = BudgetValidator.load();
    const budgetResult = await budgetValidator.checkCumulative('.claude/skills');

    if (budgetResult.skills.length > 0) {
      p.log.message('');
      p.log.message(pc.dim('-'.repeat(40)));

      const bar = formatProgressBar(budgetResult.totalChars, budgetResult.budget, 15);
      const pct = budgetResult.usagePercent.toFixed(0);

      let statusStr: string;
      switch (budgetResult.severity) {
        case 'error':
          statusStr = pc.red(`${bar} ${pct}% budget used`);
          break;
        case 'warning':
          statusStr = pc.yellow(`${bar} ${pct}% budget used`);
          break;
        default:
          statusStr = pc.dim(`${bar} ${pct}% budget used`);
      }

      p.log.message(statusStr);

      if (budgetResult.severity === 'error') {
        p.log.message(pc.red(`Warning: ${budgetResult.hiddenCount} skill(s) may be hidden. Run 'skill-creator budget' for details.`));
      } else if (budgetResult.severity === 'warning') {
        p.log.message(pc.yellow(`Approaching limit. Run 'skill-creator budget' for details.`));
      }
    }
  } catch {
    // Budget check failed silently - don't disrupt list output
  }

  p.outro(`${skills.length} skill(s) found`);
}

/**
 * Format a basic skill entry for display (without scope info).
 * Used by search workflow for SkillIndexEntry results.
 */
export function formatSkillEntry(entry: SkillIndexEntry): string {
  const badge = entry.enabled
    ? pc.green('\u25cf')  // filled circle
    : pc.dim('\u25cb');   // empty circle

  // Truncate long descriptions
  const maxDescLen = 60;
  const desc = entry.description.length > maxDescLen
    ? entry.description.slice(0, maxDescLen) + '...'
    : entry.description;

  // Count triggers
  const triggers: string[] = [];
  if (entry.triggers?.intents?.length) {
    triggers.push(`intents(${entry.triggers.intents.length})`);
  }
  if (entry.triggers?.files?.length) {
    triggers.push(`files(${entry.triggers.files.length})`);
  }
  if (entry.triggers?.contexts?.length) {
    triggers.push(`contexts(${entry.triggers.contexts.length})`);
  }
  const triggerInfo = triggers.length > 0
    ? pc.dim(`  Triggers: ${triggers.join(', ')}`)
    : '';

  return `${badge} ${pc.bold(entry.name)}\n  ${pc.dim(desc)}${triggerInfo ? '\n' + triggerInfo : ''}`;
}
