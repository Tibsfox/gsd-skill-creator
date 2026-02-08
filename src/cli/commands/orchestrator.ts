/**
 * Orchestrator CLI command.
 *
 * Bridges the orchestrator TypeScript library (Phases 36-39) to the CLI
 * so the Phase 41 agent .md can invoke discovery and state reading via Bash.
 *
 * This is glue code -- all intelligence lives in the library; the CLI layer
 * instantiates services, calls methods, and serializes results as JSON to stdout.
 *
 * Subcommands:
 * - discover: Scan filesystem for installed GSD commands, agents, and teams
 * - state: Read .planning/ artifacts into typed ProjectState
 * - classify: Map natural language or /gsd:command to GSD commands
 * - lifecycle: Suggest next actions from project state
 */

import { join } from 'path';
import {
  createDiscoveryService,
  IntentClassifier,
  LifecycleCoordinator,
} from '../../orchestrator/index.js';
import { ProjectStateReader } from '../../orchestrator/state/state-reader.js';

// ============================================================================
// Argument parsing helpers
// ============================================================================

/**
 * Extract a flag value from args in --key=value format.
 */
function extractFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

/**
 * Check if a boolean flag is present in args.
 */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

/**
 * Extract positional args (everything that is not a --flag).
 * Joins them with spaces to reconstruct the original input text.
 */
function extractPositionalArgs(args: string[]): string {
  return args
    .filter((a) => !a.startsWith('--'))
    .join(' ')
    .trim();
}

// ============================================================================
// Help text
// ============================================================================

/**
 * Display help text for the orchestrator command.
 * Lists all four subcommands (discover, state, classify, lifecycle).
 */
function showOrchestratorHelp(): void {
  console.log(`
skill-creator orchestrator - GSD orchestrator capabilities

Usage:
  skill-creator orchestrator <subcommand> [options]
  skill-creator orch <subcommand> [options]

Subcommands:
  discover, d     Discover installed GSD commands, agents, and teams
  state, s        Read project lifecycle position from .planning/
  classify, c     Classify user intent to a GSD command
  lifecycle, l    Suggest next actions from project state

Common Options:
  --pretty        Human-readable formatted output (default: JSON)
  --help, -h      Show this help message

Discover Options:
  --gsd-base=<path>     Override GSD installation base path

State Options:
  --planning-dir=<path> Override .planning/ directory path

Classify Options:
  --gsd-base=<path>     Override GSD installation base path
  --planning-dir=<path> Override .planning/ directory path

Lifecycle Options:
  --planning-dir=<path> Override .planning/ directory path
  --after=<command>     Completed command hint (e.g., --after=plan-phase)

Output:
  By default, all subcommands output structured JSON to stdout.
  Use --pretty for human-readable output. Errors are JSON objects
  with an "error" field and a non-zero exit code.

Examples:
  skill-creator orchestrator discover
  skill-creator orch d --pretty
  skill-creator orchestrator state --planning-dir=/path/to/.planning
  skill-creator orch s --pretty
  skill-creator orchestrator classify "/gsd:plan-phase 3"
  skill-creator orch c "plan the next phase"
  skill-creator orchestrator lifecycle
  skill-creator orch l --after=plan-phase
`);
}

// ============================================================================
// Discover subcommand
// ============================================================================

/**
 * Execute the discover subcommand.
 *
 * Creates a discovery service, runs discovery, and outputs results as JSON.
 * When --pretty is set, outputs a human-readable summary instead.
 */
async function handleDiscover(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');
  const gsdBase = extractFlag(args, 'gsd-base');

  try {
    // Create discovery service with optional base path override
    const overrides = gsdBase
      ? { globalBase: gsdBase, localBase: gsdBase }
      : undefined;

    const service = await createDiscoveryService(overrides);

    if (!service) {
      const error = {
        error: 'GSD installation not detected',
        help: 'Install GSD at ~/.claude/get-shit-done/ or ./.claude/get-shit-done/',
      };
      console.log(JSON.stringify(error, null, 2));
      return 1;
    }

    const result = await service.discover();

    if (pretty) {
      console.log('GSD Discovery Results');
      console.log('=====================');
      console.log(`Location: ${result.location} (${result.basePath})`);
      console.log(`Version: ${result.version ?? 'unknown'}`);
      console.log('');
      console.log(`Commands (${result.commands.length}):`);
      for (const cmd of result.commands) {
        console.log(`  - ${cmd.name}: ${cmd.description}`);
      }
      console.log('');
      console.log(`Agents (${result.agents.length}):`);
      for (const agent of result.agents) {
        console.log(`  - ${agent.name}: ${agent.description}`);
      }
      console.log('');
      console.log(`Teams (${result.teams.length}):`);
      for (const team of result.teams) {
        console.log(`  - ${team.name}: ${team.description ?? 'no description'} (${team.memberCount} members)`);
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// State subcommand
// ============================================================================

/**
 * Execute the state subcommand.
 *
 * Creates a ProjectStateReader, reads state, and outputs as JSON.
 * When --pretty is set, outputs a human-readable summary instead.
 */
async function handleState(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');

  try {
    const reader = new ProjectStateReader(planningDir);
    const state = await reader.read();

    if (pretty) {
      console.log('Project State');
      console.log('=============');
      console.log(`initialized: ${state.initialized}`);
      if (state.position) {
        console.log(`Phase: ${state.position.phase} of ${state.position.totalPhases} (${state.position.phaseName ?? 'unnamed'})`);
        console.log(`Plan: ${state.position.plan} of ${state.position.totalPlans}`);
        console.log(`Status: ${state.position.status ?? 'unknown'}`);
      }
      console.log(`Phases: ${state.phases.length}`);
      console.log(`Has roadmap: ${state.hasRoadmap}`);
      console.log(`Has state: ${state.hasState}`);
      console.log(`Has project: ${state.hasProject}`);
      console.log(`Has config: ${state.hasConfig}`);
      console.log(`Mode: ${state.config.mode}`);
    } else {
      console.log(JSON.stringify(state, null, 2));
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// Classify subcommand
// ============================================================================

/**
 * Execute the classify subcommand.
 *
 * Wires discovery + state + IntentClassifier into a single invocation.
 * Input text is everything after flags (positional args joined by space).
 *
 * Pipeline: discover commands -> read project state -> classify input
 *
 * Errors:
 * - No input text provided -> JSON error, exit 1
 * - GSD not installed -> JSON error, exit 1
 */
async function handleClassify(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');
  const gsdBase = extractFlag(args, 'gsd-base');
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');

  // Extract input text (everything not a flag)
  const input = extractPositionalArgs(args);

  if (!input) {
    console.log(JSON.stringify({
      error: 'No input text provided',
      help: 'Usage: skill-creator orchestrator classify "your intent or /gsd:command"',
    }, null, 2));
    return 1;
  }

  try {
    // Create discovery service
    const overrides = gsdBase
      ? { globalBase: gsdBase, localBase: gsdBase }
      : undefined;

    const service = await createDiscoveryService(overrides);

    if (!service) {
      console.log(JSON.stringify({
        error: 'GSD installation not detected',
        help: 'Install GSD at ~/.claude/get-shit-done/ or ./.claude/get-shit-done/',
      }, null, 2));
      return 1;
    }

    // Discover commands
    const discovery = await service.discover();

    // Read project state
    const reader = new ProjectStateReader(planningDir);
    const state = await reader.read();

    // Initialize classifier and classify
    const classifier = new IntentClassifier();
    classifier.initialize(discovery);
    const result = classifier.classify(input, state);

    if (pretty) {
      console.log('Classification Result');
      console.log('=====================');
      console.log(`Type: ${result.type}`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      if (result.command) {
        console.log(`Command: ${result.command.name}`);
        console.log(`Description: ${result.command.description}`);
      }
      if (result.arguments.phaseNumber) {
        console.log(`Phase: ${result.arguments.phaseNumber}`);
      }
      if (result.lifecycleStage) {
        console.log(`Lifecycle Stage: ${result.lifecycleStage}`);
      }
      if (result.alternatives.length > 0) {
        console.log('');
        console.log('Alternatives:');
        for (const alt of result.alternatives) {
          console.log(`  - ${alt.command.name} (${(alt.confidence * 100).toFixed(1)}%)`);
        }
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// Lifecycle subcommand
// ============================================================================

/**
 * Execute the lifecycle subcommand.
 *
 * Wires state reading + LifecycleCoordinator to suggest next actions.
 * Accepts optional --after=<command> flag for completed command context.
 *
 * Pipeline: read project state -> derive lifecycle stage -> suggest next step
 *
 * Works even without GSD installed (state reading is independent).
 */
async function handleLifecycle(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');
  const afterCommand = extractFlag(args, 'after');

  try {
    // Read project state
    const reader = new ProjectStateReader(planningDir);
    const state = await reader.read();

    // Create lifecycle coordinator and suggest next step
    const coordinator = new LifecycleCoordinator(planningDir);
    const suggestion = await coordinator.suggestNextStep(state, afterCommand);

    if (pretty) {
      console.log('Lifecycle Suggestion');
      console.log('====================');
      console.log(`Stage: ${suggestion.stage}`);
      console.log(`Context: ${suggestion.context}`);
      console.log('');
      console.log('Primary Action:');
      console.log(`  Command: ${suggestion.primary.command}`);
      if (suggestion.primary.args) {
        console.log(`  Args: ${suggestion.primary.args}`);
      }
      console.log(`  Reason: ${suggestion.primary.reason}`);
      if (suggestion.alternatives.length > 0) {
        console.log('');
        console.log('Alternatives:');
        for (const alt of suggestion.alternatives) {
          console.log(`  - ${alt.command}: ${alt.reason}`);
        }
      }
    } else {
      console.log(JSON.stringify(suggestion, null, 2));
    }

    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

// ============================================================================
// Main dispatcher
// ============================================================================

/**
 * Orchestrator CLI command entry point.
 *
 * Dispatches to the appropriate subcommand handler based on the first argument.
 *
 * @param args - Command-line arguments after 'orchestrator'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function orchestratorCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  // Help flags or no subcommand -> show help
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    showOrchestratorHelp();
    return 0;
  }

  // Strip the subcommand from args for handler consumption
  const handlerArgs = args.slice(1);

  switch (subcommand) {
    case 'discover':
    case 'd':
      return handleDiscover(handlerArgs);

    case 'state':
    case 's':
      return handleState(handlerArgs);

    case 'classify':
    case 'c':
      return handleClassify(handlerArgs);

    case 'lifecycle':
    case 'l':
      return handleLifecycle(handlerArgs);

    default:
      console.log(JSON.stringify({
        error: `Unknown subcommand: ${subcommand}`,
        help: 'Run "skill-creator orchestrator --help" for available subcommands',
      }, null, 2));
      return 1;
  }
}
