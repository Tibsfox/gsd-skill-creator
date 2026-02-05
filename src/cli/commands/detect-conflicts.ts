/**
 * CLI command for detecting semantic conflicts between skills.
 *
 * Identifies skill pairs with overlapping descriptions that may cause
 * activation confusion. Uses embedding-based similarity analysis with
 * configurable thresholds.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SkillStore } from '../../storage/skill-store.js';
import {
  ConflictDetector,
  ConflictFormatter,
  RewriteSuggester,
} from '../../conflicts/index.js';
import type { ConflictResult, ConflictPair } from '../../types/conflicts.js';
import type { RewriteSuggestion } from '../../conflicts/rewrite-suggester.js';

/**
 * Options for the detect-conflicts command.
 */
export interface DetectConflictsOptions {
  /** Similarity threshold for conflict detection (0.5-0.95) */
  threshold?: number;
  /** Minimal output mode (one line per conflict) */
  quiet?: boolean;
  /** JSON output for scripting */
  json?: boolean;
  /** Skills directory path */
  skillsDir?: string;
}

/**
 * CLI command for detecting semantic conflicts between skills.
 *
 * @param skillName - Optional specific skill to check against others
 * @param options - Command options
 * @returns Exit code (0 for success, 1 for HIGH severity conflicts)
 */
export async function detectConflictsCommand(
  skillName?: string,
  options?: DetectConflictsOptions
): Promise<number> {
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  const quiet = options?.quiet ?? false;
  const json = options?.json ?? false;
  const threshold = options?.threshold;

  // Show help if requested (no skills dir check needed)
  if (skillName === '--help' || skillName === '-h') {
    showDetectConflictsHelp();
    return 0;
  }

  const store = new SkillStore(skillsDir);
  const formatter = new ConflictFormatter();

  // Load all skills
  const skillList = await store.list();

  if (skillList.length === 0) {
    if (json) {
      console.log(JSON.stringify({
        conflicts: [],
        skillCount: 0,
        pairsAnalyzed: 0,
        threshold: threshold ?? 0.85,
        analysisMethod: 'heuristic',
      }));
    } else if (!quiet) {
      p.log.info(`No skills found in ${skillsDir}/`);
    }
    return 0;
  }

  if (skillList.length < 2) {
    if (json) {
      console.log(JSON.stringify({
        conflicts: [],
        skillCount: 1,
        pairsAnalyzed: 0,
        threshold: threshold ?? 0.85,
        analysisMethod: 'heuristic',
      }));
    } else if (!quiet) {
      p.log.info('Only one skill found - no conflicts possible.');
    }
    return 0;
  }

  // If specific skill provided, validate it exists
  if (skillName && !skillList.includes(skillName)) {
    if (json) {
      console.log(JSON.stringify({ error: `Skill "${skillName}" not found` }));
    } else {
      p.log.error(`Skill "${skillName}" not found in ${skillsDir}/`);
    }
    return 1;
  }

  // Load skill data for analysis
  const skills: Array<{ name: string; description: string }> = [];
  let loadSpinner: ReturnType<typeof p.spinner> | undefined;

  if (!quiet && !json) {
    loadSpinner = p.spinner();
    loadSpinner.start('Loading skills...');
  }

  for (const name of skillList) {
    try {
      const skill = await store.read(name);
      const description = skill.metadata.description;
      if (typeof description === 'string' && description.trim()) {
        skills.push({ name, description });
      }
    } catch {
      // Skip skills that can't be read
      if (!quiet && !json) {
        p.log.warn(`Skipping skill "${name}" - could not read`);
      }
    }
  }

  loadSpinner?.stop('Skills loaded');

  if (skills.length < 2) {
    if (json) {
      console.log(JSON.stringify({
        conflicts: [],
        skillCount: skills.length,
        pairsAnalyzed: 0,
        threshold: threshold ?? 0.85,
        analysisMethod: 'heuristic',
      }));
    } else if (!quiet) {
      p.log.info('Not enough skills with descriptions to compare.');
    }
    return 0;
  }

  // Create detector with threshold
  const detector = new ConflictDetector(
    threshold !== undefined ? { threshold } : undefined
  );

  // Run detection
  let analyzeSpinner: ReturnType<typeof p.spinner> | undefined;

  if (!quiet && !json) {
    analyzeSpinner = p.spinner();
    analyzeSpinner.start('Analyzing semantic similarity...');
  }

  let result: ConflictResult;

  if (skillName) {
    // Check specific skill against all others
    const targetSkill = skills.find(s => s.name === skillName);
    if (!targetSkill) {
      analyzeSpinner?.stop('Analysis stopped');
      if (json) {
        console.log(JSON.stringify({ error: `Skill "${skillName}" has no description` }));
      } else {
        p.log.error(`Skill "${skillName}" has no description to analyze`);
      }
      return 1;
    }

    // Create pairs of target skill vs all others
    const otherSkills = skills.filter(s => s.name !== skillName);
    const pairsToCheck = [targetSkill, ...otherSkills];

    result = await detector.detect(pairsToCheck);

    // Filter to only include conflicts involving the target skill
    result = {
      ...result,
      conflicts: result.conflicts.filter(
        c => c.skillA === skillName || c.skillB === skillName
      ),
    };
  } else {
    // Check all skills against each other
    result = await detector.detect(skills);
  }

  analyzeSpinner?.stop('Analysis complete');

  // Generate suggestions for non-quiet/non-json output
  let suggestions: Map<string, RewriteSuggestion[]> = new Map();

  if (!quiet && !json && result.conflicts.length > 0) {
    const suggester = new RewriteSuggester();

    let suggestSpinner: ReturnType<typeof p.spinner> | undefined;
    suggestSpinner = p.spinner();
    suggestSpinner.start('Generating suggestions...');

    for (const conflict of result.conflicts) {
      const conflictSuggestions = await suggester.suggest(conflict);
      const key = `${conflict.skillA}:${conflict.skillB}`;
      suggestions.set(key, conflictSuggestions);
    }

    suggestSpinner.stop('Suggestions ready');
  }

  // Format and output results
  if (json) {
    console.log(formatter.formatJson(result));
  } else if (quiet) {
    const output = formatter.formatQuiet(result);
    if (output) {
      console.log(output);
    }
  } else {
    // Text output with suggestions
    const showThreshold = threshold !== undefined && threshold !== 0.85;
    const textOutput = formatter.formatText(result, { showThreshold });

    console.log('');
    console.log(textOutput);

    // Add suggestions section
    if (suggestions.size > 0) {
      console.log('');
      console.log(pc.bold('Suggestions for Resolution:'));
      console.log('');

      for (const [key, conflictSuggestions] of suggestions) {
        for (const suggestion of conflictSuggestions) {
          console.log(`  ${pc.cyan(suggestion.skillName)}:`);
          console.log(`    ${pc.dim('Rationale:')} ${suggestion.rationale}`);
          console.log(`    ${pc.dim('Try:')} "${truncate(suggestion.suggestedDescription, 100)}"`);
          console.log('');
        }
      }

      const source = conflictSuggestions(suggestions);
      console.log(pc.dim(`Suggestion source: ${source}`));
    }
  }

  // Return exit code based on severity
  const hasHighSeverity = result.conflicts.some(c => c.severity === 'high');
  return hasHighSeverity ? 1 : 0;
}

/**
 * Get the suggestion source from the suggestions map.
 */
function conflictSuggestions(suggestions: Map<string, RewriteSuggestion[]>): string {
  for (const [, arr] of suggestions) {
    if (arr.length > 0) {
      return arr[0].source === 'llm' ? 'LLM (Claude)' : 'heuristic';
    }
  }
  return 'heuristic';
}

/**
 * Truncate text to a maximum length.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Show help for the detect-conflicts command.
 */
function showDetectConflictsHelp(): void {
  console.log(`
skill-creator detect-conflicts - Detect semantic conflicts between skills

Usage:
  skill-creator detect-conflicts              Scan all skills for conflicts
  skill-creator detect-conflicts <skill>      Check one skill against others
  skill-creator detect-conflicts --threshold=0.90  Use stricter threshold

Options:
  --threshold=N   Similarity threshold (default: 0.85, range: 0.5-0.95)
  --quiet, -q     Minimal output (one line per conflict)
  --json          JSON output for scripting
  --project, -p   Use project-level skills (.claude/skills/)

Exit codes:
  0   No conflicts or only MEDIUM severity
  1   HIGH severity conflicts detected

Examples:
  skill-creator detect-conflicts              # Check all skills
  skill-creator dc my-skill                   # Check specific skill
  skill-creator conflicts --threshold=0.90   # Stricter matching
  skill-creator dc --json                     # JSON output for CI
  skill-creator dc --quiet | wc -l           # Count conflicts

Severity Levels:
  HIGH    > 90% similarity - Very likely conflict, review required
  MEDIUM  85-90% similarity - Possible conflict, worth reviewing

The command uses embedding-based semantic analysis to identify skills with
overlapping descriptions. When Anthropic API key is available, suggestions
are generated using Claude. Otherwise, heuristic suggestions are provided.
`);
}
