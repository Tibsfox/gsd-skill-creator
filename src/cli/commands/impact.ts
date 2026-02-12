/**
 * CLI command for analyzing the impact of modifying a skill.
 *
 * Shows which downstream skills would be affected by changes to a given skill,
 * including both direct dependents and transitive (indirect) dependents.
 *
 * Usage:
 *   skill-creator impact <skill-name>          Human-readable impact report
 *   skill-creator impact <skill-name> --json   Machine-readable JSON output
 *   skill-creator impact --help                Show help
 */

import pc from 'picocolors';
import { SkillStore } from '../../storage/skill-store.js';
import { SkillMetadata } from '../../types/skill.js';
import { DependencyGraph } from '../../composition/dependency-graph.js';
import { InheritanceValidator } from '../../composition/inheritance-validator.js';
import { parseScope, getSkillsBasePath } from '../../types/scope.js';

const HELP_TEXT = `
Usage: skill-creator impact <skill-name> [options]

Analyze the impact of modifying a skill. Shows which downstream
skills depend on it directly or transitively.

Options:
  --json           Output as JSON
  --project, -p    Use project scope
  --help, -h       Show this help message

Aliases: imp

Examples:
  skill-creator impact base-skill         Show impact analysis
  skill-creator impact base-skill --json  Machine-readable output
  skill-creator imp my-skill --project    Analyze project-level skill
`;

/**
 * Main entry point for the impact command.
 *
 * @param args - Command-line arguments after 'impact'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function impactCommand(args: string[]): Promise<number> {
  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  // Parse skill name (first non-flag argument)
  const skillName = args.find(a => !a.startsWith('-'));

  if (!skillName) {
    console.log(HELP_TEXT);
    return 0;
  }

  const jsonMode = args.includes('--json');
  const scope = parseScope(args);
  const skillsDir = getSkillsBasePath(scope);

  try {
    // Load all skills
    const store = new SkillStore(skillsDir);
    const skillNames = await store.list();
    const skills = new Map<string, SkillMetadata>();

    for (const name of skillNames) {
      const skill = await store.read(name);
      if (skill) {
        skills.set(name, skill.metadata);
      }
    }

    // Check if target skill exists
    if (!skills.has(skillName)) {
      console.error(`Error: Skill "${skillName}" not found.`);
      return 1;
    }

    // Build dependency graph
    const graph = DependencyGraph.fromSkills(skills);

    // Get inheritance chain for the queried skill
    const inheritanceChain = graph.getInheritanceChain(skillName);

    // Get direct dependents
    const directDependents = graph.getDependents(skillName);

    // Get all transitive dependents
    const transitiveDependents = graph.getAllDependents(skillName);

    // Get impact warnings
    const validator = new InheritanceValidator();
    const warnings = validator.checkImpactWarnings(skills, skillName);

    if (jsonMode) {
      const output = {
        skill: skillName,
        inheritanceChain,
        directDependents,
        transitiveDependents,
        totalAffected: transitiveDependents.length,
        warnings: warnings.warnings,
      };
      console.log(JSON.stringify(output, null, 2));
      return 0;
    }

    // Human-readable output
    console.log('');
    console.log(pc.bold(`Impact Analysis: ${skillName}`));
    console.log('');

    // Inheritance chain
    if (inheritanceChain.length <= 1) {
      console.log(`Inheritance chain: ${pc.dim('(root)')}`);
    } else {
      console.log(`Inheritance chain: ${inheritanceChain.join(' -> ')}`);
    }

    // Direct dependents
    console.log(`Direct dependents: ${directDependents.length}`);
    for (const dep of directDependents) {
      console.log(`  - ${dep} ${pc.dim(`(extends ${skillName})`)}`);
    }

    if (transitiveDependents.length > 0) {
      console.log('');
      console.log(`Transitive impact: ${transitiveDependents.length} skill(s) affected`);
      for (const dep of transitiveDependents) {
        const parent = graph.getParent(dep);
        const parentInfo = parent && parent !== skillName
          ? pc.dim(` (extends ${parent})`)
          : '';
        console.log(`  - ${dep}${parentInfo}`);
      }
    } else {
      console.log('');
      console.log('No downstream skills affected.');
    }

    // Warnings
    if (warnings.warnings.length > 0) {
      console.log('');
      for (const warning of warnings.warnings) {
        console.log(pc.yellow(warning));
      }
    }

    return 0;
  } catch (err) {
    console.error(`Impact command failed: ${(err as Error).message}`);
    return 1;
  }
}
