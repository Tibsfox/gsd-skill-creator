/**
 * CLI command for scoring skill activation likelihood.
 *
 * Analyzes skill descriptions to predict how reliably they will
 * trigger auto-activation. Uses local heuristics, no API required.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { SkillStore } from '../../storage/skill-store.js';
import {
  ActivationScorer,
  ActivationFormatter,
  ActivationSuggester,
  LLMActivationAnalyzer,
} from '../../activation/index.js';
import type { CombinedActivationResult } from '../../types/activation.js';

/**
 * Options for the score-activation command.
 */
export interface ScoreActivationOptions {
  /** Score all skills in batch mode */
  all?: boolean;
  /** Show full factor breakdown */
  verbose?: boolean;
  /** Minimal output (one line per skill) */
  quiet?: boolean;
  /** JSON output for scripting */
  json?: boolean;
  /** Skills directory path */
  skillsDir?: string;
  /** Use LLM for deep analysis (requires ANTHROPIC_API_KEY) */
  llm?: boolean;
}

/**
 * CLI command for scoring skill activation likelihood.
 *
 * @param skillName - Optional specific skill to score (required if not --all)
 * @param options - Command options
 * @returns Exit code (0 for success)
 */
export async function scoreActivationCommand(
  skillName?: string,
  options?: ScoreActivationOptions
): Promise<number> {
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  const all = options?.all ?? false;
  const verbose = options?.verbose ?? false;
  const quiet = options?.quiet ?? false;
  const json = options?.json ?? false;

  // Show help if requested
  if (skillName === '--help' || skillName === '-h') {
    showScoreActivationHelp();
    return 0;
  }

  // Validate: need either skillName or --all
  if (!skillName && !all) {
    if (json) {
      console.log(JSON.stringify({ error: 'Specify a skill name or use --all' }));
    } else {
      p.log.error('Usage: skill-creator score-activation <skill-name> or --all');
    }
    return 1;
  }

  const store = new SkillStore(skillsDir);
  const scorer = new ActivationScorer();
  const formatter = new ActivationFormatter();
  const suggester = new ActivationSuggester();

  // Load skill(s)
  const skillList = await store.list();

  if (skillList.length === 0) {
    if (json) {
      console.log(JSON.stringify({ error: 'No skills found', skillsDir }));
    } else if (!quiet) {
      p.log.info(`No skills found in ${skillsDir}/`);
    }
    return 0;
  }

  // Single skill mode
  if (skillName && !all) {
    if (!skillList.includes(skillName)) {
      if (json) {
        console.log(JSON.stringify({ error: `Skill "${skillName}" not found` }));
      } else {
        p.log.error(`Skill "${skillName}" not found in ${skillsDir}/`);
      }
      return 1;
    }

    try {
      const skill = await store.read(skillName);
      const description = skill.metadata.description;

      if (typeof description !== 'string' || !description.trim()) {
        if (json) {
          console.log(JSON.stringify({ error: `Skill "${skillName}" has no description` }));
        } else {
          p.log.error(`Skill "${skillName}" has no description to analyze`);
        }
        return 1;
      }

      const result = scorer.score({ name: skillName, description });

      // LLM analysis (single skill only)
      let llmResult = null;
      if (options?.llm) {
        const llmAnalyzer = new LLMActivationAnalyzer();

        if (!llmAnalyzer.isAvailable()) {
          if (!json && !quiet) {
            p.log.warn('LLM analysis unavailable (no ANTHROPIC_API_KEY). Using heuristic only.');
          }
        } else {
          let llmSpinner: ReturnType<typeof p.spinner> | undefined;
          if (!json && !quiet) {
            llmSpinner = p.spinner();
            llmSpinner.start('Analyzing with Claude...');
          }

          llmResult = await llmAnalyzer.analyze({ name: skillName, description });
          llmSpinner?.stop(llmResult ? 'LLM analysis complete' : 'LLM analysis failed');
        }
      }

      // Output based on format
      if (json) {
        if (options?.llm) {
          const combined: CombinedActivationResult = { heuristic: result, llm: llmResult };
          console.log(formatter.formatCombinedJson(combined));
        } else {
          console.log(formatter.formatJson(result));
        }
      } else if (quiet) {
        console.log(formatter.formatQuiet(result));
      } else {
        console.log('');
        console.log(formatter.formatText(result, { verbose }));

        // Show LLM result if available
        if (llmResult) {
          console.log('');
          console.log(pc.dim('─'.repeat(40)));
          console.log('');
          console.log(formatter.formatLLMResult(llmResult, { verbose }));
        }

        // Show suggestions for non-Reliable scores (only when no LLM result)
        if (!llmResult) {
          const suggestions = suggester.suggest(result);
          if (suggestions.length > 0) {
            console.log('');
            console.log(pc.bold('Suggestions:'));
            for (const suggestion of suggestions) {
              console.log(`  - ${suggestion.text}`);
              if (suggestion.example && verbose) {
                console.log(pc.dim(`    Before: "${truncate(suggestion.example.before, 60)}"`));
                console.log(pc.dim(`    After:  "${truncate(suggestion.example.after, 60)}"`));
              }
            }
          }
        }
      }

      return 0;
    } catch (err) {
      if (json) {
        console.log(JSON.stringify({ error: `Could not read skill "${skillName}"` }));
      } else {
        p.log.error(`Could not read skill "${skillName}"`);
      }
      return 1;
    }
  }

  // Batch mode (--all)
  // Warn if --llm flag is passed with --all
  if (options?.llm && !json && !quiet) {
    p.log.warn('--llm flag ignored in batch mode (single skill analysis only).');
  }

  let loadSpinner: ReturnType<typeof p.spinner> | undefined;

  if (!quiet && !json) {
    loadSpinner = p.spinner();
    loadSpinner.start('Loading skills...');
  }

  const skills: Array<{ name: string; description: string }> = [];

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

  if (skills.length === 0) {
    if (json) {
      console.log(JSON.stringify({ results: [], error: 'No skills with descriptions found' }));
    } else if (!quiet) {
      p.log.info('No skills with descriptions to analyze.');
    }
    return 0;
  }

  // Score all skills
  let analyzeSpinner: ReturnType<typeof p.spinner> | undefined;

  if (!quiet && !json) {
    analyzeSpinner = p.spinner();
    analyzeSpinner.start('Analyzing skills...');
  }

  const results = scorer.scoreBatch(skills);

  analyzeSpinner?.stop('Analysis complete');

  // Output based on format
  if (json) {
    console.log(formatter.formatBatchJson(results));
  } else if (quiet) {
    console.log(formatter.formatBatchQuiet(results));
  } else {
    console.log('');
    console.log(formatter.formatBatchText(results, { sortAscending: true, verbose }));

    // Show suggestions for worst-scoring skill
    const worstSkill = results.reduce((worst, r) =>
      r.score < worst.score ? r : worst
    );
    if (worstSkill.score < 90) {
      const suggestions = suggester.suggest(worstSkill);
      if (suggestions.length > 0) {
        console.log('');
        console.log(pc.bold(`Tips for "${worstSkill.skillName}" (${worstSkill.score}/100):`));
        for (const suggestion of suggestions.slice(0, 2)) {
          console.log(`  - ${suggestion.text}`);
        }
        console.log('');
        console.log(pc.dim('Run with skill name for detailed suggestions.'));
      }
    }
  }

  return 0;
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
 * Show help for the score-activation command.
 */
function showScoreActivationHelp(): void {
  console.log(`
skill-creator score-activation - Score skill activation likelihood

Usage:
  skill-creator score-activation <skill>      Score a single skill
  skill-creator score-activation --all        Score all skills

Options:
  --all, -a       Score all skills in batch mode
  --verbose, -v   Show factor breakdown
  --quiet, -q     Minimal output (skillName,score,label)
  --json          JSON output for scripting
  --project, -p   Use project-level skills (.claude/skills/)
  --llm           Use Claude API for deep analysis (requires ANTHROPIC_API_KEY)

Score Labels:
  Reliable (90+)    Very likely to auto-activate correctly
  Likely (70-89)    Good chance of correct activation
  Uncertain (50-69) May need improvement
  Unlikely (<50)    Needs significant improvement

Examples:
  skill-creator score-activation my-skill         # Score single skill
  skill-creator sa my-skill --verbose             # With factor breakdown
  skill-creator score-activation --all            # Score all skills
  skill-creator sa --all --json                   # JSON output for CI
  skill-creator sa --all --quiet | sort -t, -k2n # Sort by score
  skill-creator sa my-skill --llm                 # LLM-powered analysis
  skill-creator sa my-skill --llm --verbose       # Full LLM breakdown

Scoring Factors:
  Specificity       Unique terms vs generic terms
  Activation        Explicit trigger phrases ("use when...")
  Length            Description length (50-150 chars optimal)
  Imperative verbs  Action verbs at start (Generate, Run, etc.)
  Generic penalty   Reduction for overused terms

The command uses local heuristics - no API calls, instant results.

LLM Analysis:
  The --llm flag enables deep analysis using Claude API.
  Requires ANTHROPIC_API_KEY environment variable.
  Only available for single skill analysis (not batch mode).
`);
}
