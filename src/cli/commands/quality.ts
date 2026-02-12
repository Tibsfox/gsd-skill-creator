/**
 * CLI command for displaying skill health scores.
 *
 * Shows per-skill quality dashboard with precision, success rate,
 * token efficiency, and staleness. Supports terminal table, JSON,
 * and single-skill detail views.
 *
 * Usage:
 *   skill-creator quality              Show all skills health
 *   skill-creator quality my-skill     Show single skill health
 *   skill-creator quality --json       Machine-readable output
 *   skill-creator quality --verbose    Show improvement suggestions
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { parseScope, getSkillsBasePath } from '../../types/scope.js';
import { SkillStore } from '../../storage/skill-store.js';
import { ResultStore } from '../../testing/result-store.js';
import { SuccessTracker } from '../../evaluator/success-tracker.js';
import { HealthScorer } from '../../evaluator/health-scorer.js';
import { HealthFormatter } from '../../evaluator/health-formatter.js';

const HELP_TEXT = `
Usage: skill-creator quality [skill-name] [options]

Display per-skill health scores showing precision, success rate,
token efficiency, and staleness.

Options:
  --verbose, -v    Show improvement suggestions for flagged skills
  --json           Output as JSON
  --project, -p    Use project scope
  --help, -h       Show this help message

Examples:
  skill-creator quality              Show all skills health
  skill-creator quality my-skill     Show single skill health
  skill-creator quality --json       Machine-readable output
`;

/**
 * Check if a boolean flag is present in args.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(
    flag => args.includes(`--${flag}`) || args.includes(`-${flag.charAt(0)}`),
  );
}

/**
 * Main entry point for the quality command.
 *
 * @param args - Command-line arguments after 'quality'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function qualityCommand(args: string[]): Promise<number> {
  // Handle help
  if (hasFlag(args, 'help', 'h') || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  try {
    const verbose = hasFlag(args, 'verbose', 'v');
    const json = args.includes('--json');
    const scope = parseScope(args);
    const skillsDir = getSkillsBasePath(scope);

    // Get skill name (first positional arg that isn't a flag)
    const skillName = args.find(a => !a.startsWith('-'));

    // Instantiate dependencies
    const skillStore = new SkillStore(skillsDir);
    const resultStore = new ResultStore(scope);
    const successTracker = new SuccessTracker();
    const scorer = new HealthScorer(resultStore, successTracker, skillStore);
    const formatter = new HealthFormatter();

    if (skillName) {
      // Single skill view
      const exists = await skillStore.exists(skillName);
      if (!exists) {
        p.log.error(`Skill "${skillName}" not found at ${scope} scope.`);
        return 1;
      }

      const score = await scorer.scoreSkill(skillName);

      if (json) {
        console.log(formatter.formatJSON([score]));
      } else {
        console.log(formatter.formatSingle(score));
      }
    } else {
      // All skills view
      const skills = await skillStore.list();
      if (skills.length === 0) {
        p.log.info('No skills found. Create skills first with `skill-creator create`.');
        return 0;
      }

      const scores = await scorer.scoreAll();

      if (json) {
        console.log(formatter.formatJSON(scores));
      } else {
        console.log(formatter.formatTerminal(scores, { verbose }));
      }
    }

    return 0;
  } catch (err) {
    p.log.error(`Quality check failed: ${(err as Error).message}`);
    return 1;
  }
}
