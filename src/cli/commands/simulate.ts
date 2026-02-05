/**
 * CLI command for activation simulation.
 *
 * Predicts which skill would activate for a given user prompt using
 * semantic similarity. Supports single prompt, verbose output, and batch mode.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'fs/promises';
import { SkillStore } from '../../storage/skill-store.js';
import {
  ActivationSimulator,
  BatchSimulator,
  formatConfidence,
} from '../../simulation/index.js';
import type { SimulationResult, BatchResult } from '../../simulation/index.js';
import type { SkillScope } from '../../types/scope.js';
import { getSkillsBasePath } from '../../types/scope.js';

/**
 * Options for the simulate command.
 */
interface SimulateOptions {
  scope: SkillScope;
  verbose: boolean;
  threshold?: number;
  json: boolean;
  batch?: string; // Path to file with prompts (one per line)
}

/**
 * Main simulate command entry point.
 */
export async function simulateCommand(args: string[], options: SimulateOptions): Promise<void> {
  // Batch mode: read prompts from file
  if (options.batch) {
    await runBatchMode(options.batch, options);
    return;
  }

  // Single prompt mode
  const prompt = args.join(' ').trim();
  if (!prompt) {
    p.log.error('Please provide a prompt to simulate. Usage: gsd-skill simulate "your prompt here"');
    process.exit(1);
  }

  await runSinglePrompt(prompt, options);
}

/**
 * Run simulation for a single prompt.
 */
async function runSinglePrompt(prompt: string, options: SimulateOptions): Promise<void> {
  const spin = p.spinner();
  spin.start('Loading skills...');

  // Load all skills from the specified scope
  const store = new SkillStore(getSkillsBasePath(options.scope));
  const skillNames = await store.list();

  if (skillNames.length === 0) {
    spin.stop('No skills found');
    p.log.warn(`No skills found in ${options.scope} scope. Create some skills first.`);
    return;
  }

  // Load skill metadata
  const skills: Array<{ name: string; description: string }> = [];
  for (const name of skillNames) {
    const skill = await store.read(name);
    if (skill) {
      skills.push({ name, description: skill.metadata.description });
    }
  }

  spin.message('Running simulation...');

  // Configure simulator
  const simulator = new ActivationSimulator({
    threshold: options.threshold ?? 0.75,
    includeTrace: options.verbose,
  });

  const result = await simulator.simulate(prompt, skills);

  spin.stop('Simulation complete');

  // Output results
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  displaySingleResult(result, options.verbose);
}

/**
 * Display single simulation result to terminal.
 */
function displaySingleResult(result: SimulationResult, verbose: boolean): void {
  console.log();
  console.log(pc.bold('Prompt:'), pc.dim(result.prompt.slice(0, 80) + (result.prompt.length > 80 ? '...' : '')));
  console.log();

  if (result.winner) {
    console.log(
      pc.green('\u2713'),
      pc.bold(result.winner.skillName),
      'would activate at',
      pc.cyan(formatConfidence(result.winner.similarity))
    );

    if (result.challengers.length > 0) {
      console.log();
      console.log(pc.yellow('Close competitors:'));
      for (const challenger of result.challengers) {
        console.log(
          '  -',
          challenger.skillName,
          pc.dim(`(${formatConfidence(challenger.similarity)})`)
        );
      }
    }
  } else {
    console.log(pc.yellow('\u2717'), 'No skill would activate');

    if (result.allPredictions.length > 0) {
      const top = result.allPredictions[0];
      console.log(
        '  Closest match:',
        top.skillName,
        pc.dim(`(${formatConfidence(top.similarity)})`)
      );
    }
  }

  // Natural language explanation
  console.log();
  console.log(pc.dim(result.explanation));

  // Verbose: show all predictions
  if (verbose && result.allPredictions.length > 0) {
    console.log();
    console.log(pc.bold('All predictions:'));
    for (const pred of result.allPredictions) {
      const icon = pred.wouldActivate ? pc.green('\u2713') : pc.dim('\u00b7');
      console.log(
        `  ${icon} ${pred.skillName}: ${formatConfidence(pred.similarity)} (${pred.confidenceLevel})`
      );
    }

    if (result.trace) {
      console.log();
      console.log(pc.bold('Trace:'));
      console.log(`  Embedding time: ${result.trace.embeddingTime}ms`);
      console.log(`  Skills compared: ${result.trace.comparisonCount}`);
      console.log(`  Threshold: ${result.trace.threshold}`);
      console.log(`  Method: ${result.method}`);
    }
  }

  console.log();
}

/**
 * Run batch simulation from file.
 */
async function runBatchMode(filePath: string, options: SimulateOptions): Promise<void> {
  // Read prompts from file
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    p.log.error(`Failed to read file: ${filePath}`);
    process.exit(1);
  }

  const prompts = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  if (prompts.length === 0) {
    p.log.error('No prompts found in file');
    process.exit(1);
  }

  p.log.info(`Found ${prompts.length} prompts in ${filePath}`);

  // Load skills
  const store = new SkillStore(getSkillsBasePath(options.scope));
  const skillNames = await store.list();

  if (skillNames.length === 0) {
    p.log.warn(`No skills found in ${options.scope} scope`);
    return;
  }

  const skills: Array<{ name: string; description: string }> = [];
  for (const name of skillNames) {
    const skill = await store.read(name);
    if (skill) {
      skills.push({ name, description: skill.metadata.description });
    }
  }

  // Run batch simulation
  const simulator = new BatchSimulator({
    threshold: options.threshold ?? 0.75,
    verbosity: options.verbose ? 'all' : 'summary',
  });

  const result = await simulator.runTestSuiteWithProgress(prompts, skills);

  // Output results
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  displayBatchResult(result, options.verbose);
}

/**
 * Display batch simulation results.
 */
function displayBatchResult(result: BatchResult, verbose: boolean): void {
  console.log();
  console.log(pc.bold('Batch Simulation Results'));
  console.log('\u2500'.repeat(40));

  // Summary stats
  console.log();
  console.log('Statistics:');
  console.log(`  Total prompts:     ${result.stats.total}`);
  console.log(`  Activations:       ${pc.green(String(result.stats.activations))}`);
  console.log(`  No activation:     ${pc.yellow(String(result.stats.noActivations))}`);
  console.log(`  Close competition: ${pc.cyan(String(result.stats.closeCompetitions))}`);
  console.log(`  Duration:          ${result.duration}ms`);

  // Activation rate
  const activationRate = result.stats.total > 0
    ? Math.round((result.stats.activations / result.stats.total) * 100)
    : 0;
  console.log(`  Activation rate:   ${activationRate}%`);

  // Verbose: show individual results
  if (verbose && result.results.length > 0) {
    console.log();
    console.log(pc.bold('Individual Results:'));
    console.log();

    for (const res of result.results) {
      const promptPreview = res.prompt.slice(0, 50) + (res.prompt.length > 50 ? '...' : '');
      const winner = res.winner?.skillName ?? pc.dim('none');
      const score = res.winner ? formatConfidence(res.winner.similarity) : '-';

      console.log(`  "${promptPreview}"`);
      console.log(`    \u2192 ${winner} (${score})`);

      if (res.challengers.length > 0) {
        const challengerNames = res.challengers.map(c => c.skillName).join(', ');
        console.log(`    ${pc.yellow('Challengers:')} ${challengerNames}`);
      }
      console.log();
    }
  }

  console.log();
}

/**
 * Generate help text for simulate command.
 */
export function simulateHelp(): string {
  return `
${pc.bold('gsd-skill simulate')} - Predict which skill would activate for a prompt

${pc.bold('Usage:')}
  gsd-skill simulate <prompt>           Simulate single prompt
  gsd-skill simulate --batch <file>     Simulate prompts from file

${pc.bold('Options:')}
  --scope <scope>     Skill scope: user (default) or project
  --verbose, -v       Show all predictions and trace details
  --threshold <n>     Activation threshold (default: 0.75)
  --json              Output results as JSON
  --batch <file>      Read prompts from file (one per line)

${pc.bold('Examples:')}
  gsd-skill simulate "commit my changes"
  gsd-skill simulate "run database migrations" --verbose
  gsd-skill simulate --batch prompts.txt --json
  gsd-skill simulate "test prompt" --scope project --threshold 0.8

${pc.bold('File format for batch mode:')}
  One prompt per line. Lines starting with # are ignored.
`;
}
