import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { SkillIndex } from '../storage/skill-index.js';
import { formatSkillEntry } from './list-skills-workflow.js';
import { CrossProjectIndex } from '../retrieval/cross-project-index.js';
import type { ScopedSearchResult } from '../retrieval/types.js';

export interface SearchWorkflowOptions {
  /** When true, search across user, project, and plugin directories */
  allScopes?: boolean;
  /** Additional plugin directories to search (used with allScopes) */
  pluginDirs?: string[];
}

/**
 * Format a cross-project search result with scope label.
 */
function formatScopedResult(result: ScopedSearchResult): string {
  const badge = result.enabled
    ? pc.green('\u25cf')
    : pc.dim('\u25cb');

  const scopeTag = pc.dim(`[${result.scope}]`);

  const maxDescLen = 50;
  const desc = result.description.length > maxDescLen
    ? result.description.slice(0, maxDescLen) + '...'
    : result.description;

  const scoreStr = pc.dim(`(${result.score.toFixed(2)})`);

  return `${badge} ${pc.bold(result.name)} ${scopeTag} ${scoreStr}\n  ${pc.dim(desc)}`;
}

export async function searchSkillsWorkflow(
  skillIndex: SkillIndex,
  options?: SearchWorkflowOptions,
): Promise<void> {
  const allScopes = options?.allScopes ?? false;

  p.intro(pc.bgCyan(pc.black(allScopes ? ' Cross-Directory Search ' : ' Search Skills ')));

  const query = await p.text({
    message: 'Search query (name or description):',
    placeholder: 'e.g., typescript, testing, api',
    validate: (value) => {
      if (!value || value.length < 2) {
        return 'Enter at least 2 characters';
      }
    }
  });

  if (p.isCancel(query)) {
    p.cancel('Search cancelled');
    return;
  }

  const searchTerm = query as string;

  if (allScopes) {
    // Cross-directory search via CrossProjectIndex
    const crossIndex = new CrossProjectIndex();
    const dirs = crossIndex.getSearchDirectories({
      pluginDirs: options?.pluginDirs,
    });

    const output = await crossIndex.search(searchTerm, dirs);

    if (output.results.length === 0) {
      p.log.warn(`No skills found matching "${searchTerm}" across ${dirs.length} directories`);
      p.outro('0 results');
      return;
    }

    // Show version drift warning if detected
    if (output.versionDriftWarning) {
      p.log.warn(output.versionDriftWarning);
    }

    p.log.info(pc.bold(`\nMatching Skills (${dirs.length} directories):`));
    for (const result of output.results) {
      p.log.message(formatScopedResult(result));
    }

    p.outro(`${output.results.length} result(s) for "${searchTerm}" across all scopes`);
  } else {
    // Standard single-scope search
    const results = await skillIndex.search(searchTerm);

    if (results.length === 0) {
      p.log.warn(`No skills found matching "${searchTerm}"`);
      p.outro('0 results');
      return;
    }

    p.log.info(pc.bold(`\nMatching Skills:`));
    for (const skill of results) {
      p.log.message(formatSkillEntry(skill));
    }

    p.outro(`${results.length} result(s) for "${searchTerm}"`);
  }
}
