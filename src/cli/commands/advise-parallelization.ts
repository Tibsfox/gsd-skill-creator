/**
 * CLI command for analyzing plan dependencies and recommending
 * wave-based parallel execution assignments.
 *
 * Reads plan frontmatter from a phase directory, builds a dependency
 * graph with file conflict detection, and outputs advisory wave
 * assignments with colored output.
 *
 * Usage:
 *   skill-creator advise-parallelization <phase-dir>
 *   skill-creator ap <phase-dir>
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { ParallelizationAdvisor } from '../../capabilities/index.js';
import type { AdvisoryReport } from '../../capabilities/index.js';

export async function adviseParallelizationCommand(args: string[]): Promise<number> {
  const phaseDir = args[0];

  if (!phaseDir || phaseDir === '--help' || phaseDir === '-h') {
    showHelp();
    return phaseDir ? 0 : 1;
  }

  p.intro(pc.bgCyan(pc.black(' Parallelization Advisor ')));

  try {
    const advisor = new ParallelizationAdvisor();
    const report = await advisor.adviseFromDirectory(phaseDir);

    if (report.assignments.length === 0) {
      p.log.warn('No plans found in directory.');
      return 1;
    }

    // Display wave assignments
    p.log.message(pc.bold(`Phase: ${report.phaseId}`));
    p.log.message(pc.bold(`Total waves: ${report.totalWaves}`));
    p.log.message('');

    // Group assignments by wave for display
    const byWave = new Map<number, typeof report.assignments>();
    for (const a of report.assignments) {
      const list = byWave.get(a.recommendedWave) ?? [];
      list.push(a);
      byWave.set(a.recommendedWave, list);
    }

    for (const [wave, assignments] of [...byWave.entries()].sort((a, b) => a[0] - b[0])) {
      p.log.message(pc.bold(pc.cyan(`Wave ${wave}:`)));
      for (const a of assignments) {
        const changed = a.currentWave !== null && a.currentWave !== a.recommendedWave;
        const changeIndicator = changed ? pc.yellow(` (was wave ${a.currentWave})`) : '';
        p.log.message(`  ${a.planId}${changeIndicator}`);
        p.log.message(pc.dim(`    ${a.rationale}`));
      }
    }

    // Display file conflicts
    if (report.fileConflicts.length > 0) {
      p.log.message('');
      p.log.message(pc.bold('File conflicts (force sequential):'));
      for (const conflict of report.fileConflicts) {
        p.log.message(`  ${pc.yellow(conflict.file)}`);
        p.log.message(pc.dim(`    Shared by: ${conflict.plans.join(', ')}`));
      }
    }

    // Display warnings
    if (report.warnings.length > 0) {
      p.log.message('');
      p.log.message(pc.bold(pc.yellow('Warnings:')));
      for (const warning of report.warnings) {
        p.log.message(`  ${pc.yellow('!')} ${warning}`);
      }
    }

    p.outro(pc.green('Advisory complete'));
    return 0;
  } catch (err) {
    p.log.error(`Failed: ${(err as Error).message}`);
    return 1;
  }
}

function showHelp(): void {
  console.log(`
skill-creator advise-parallelization - Analyze plan dependencies for parallel execution

Usage:
  skill-creator advise-parallelization <phase-dir>
  skill-creator ap <phase-dir>

Arguments:
  phase-dir    Path to phase directory containing *-PLAN.md files

Examples:
  skill-creator advise-parallelization .planning/phases/61-parallelization-advisor
  skill-creator ap .planning/phases/56-skill-injection-dynamic-creation

Output:
  Advisory report showing recommended wave assignments based on:
  - File dependency analysis (plans modifying same files must be sequential)
  - Explicit depends_on declarations
  - Conservative defaults (plans without data are assumed sequential)

Note: This is advisory only. No files are modified.
`);
}
