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
 * - work-state: Persist and restore work state (save/restore/queue-*)
 */

import { join } from 'path';
import {
  createDiscoveryService,
  IntentClassifier,
  LifecycleCoordinator,
  evaluateGate,
  filterByVerbosity,
} from '../../orchestrator/index.js';
import type { OutputSection } from '../../orchestrator/index.js';
import { ProjectStateReader } from '../../orchestrator/state/state-reader.js';
import { WorkStateWriter } from '../../orchestrator/work-state/work-state-writer.js';
import { WorkStateReader } from '../../orchestrator/work-state/work-state-reader.js';
import { QueueManager } from '../../orchestrator/work-state/queue-manager.js';
import { DEFAULT_WORK_STATE_FILENAME } from '../../orchestrator/work-state/types.js';

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

/**
 * Resolve verbosity level from --verbosity=N flag, falling back to
 * a provided config value, or the default of 3.
 */
function resolveVerbosity(args: string[], configVerbosity?: number): number {
  const raw = extractFlag(args, 'verbosity');
  if (raw !== undefined) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) return parsed;
  }
  return configVerbosity ?? 3;
}

// ============================================================================
// Help text
// ============================================================================

/**
 * Display help text for the orchestrator command.
 * Lists all subcommands (discover, state, classify, lifecycle, work-state).
 */
function showOrchestratorHelp(): void {
  console.log(`
skill-creator orchestrator - GSD orchestrator capabilities

Usage:
  skill-creator orchestrator <subcommand> [options]
  skill-creator orch <subcommand> [options]

Subcommands:
  discover, d        Discover installed GSD commands, agents, and teams
  state, s           Read project lifecycle position from .planning/
  classify, c        Classify user intent to a GSD command
  lifecycle, l       Suggest next actions from project state
  work-state, ws     Persist and restore work state

Common Options:
  --pretty        Human-readable formatted output (default: JSON)
  --verbosity=N   Output verbosity level 1-5 (default: config or 3)
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

Work-State Sub-subcommands:
  save                  Save current work state to YAML
    --session-id=<id>   Session identifier
    --active-task=<task> Active task name
    --skills=<a,b,c>    Comma-separated loaded skills
    --planning-dir=<path> Override .planning/ directory path

  restore               Restore saved work state
    --pretty            Human-readable output
    --planning-dir=<path> Override .planning/ directory path

  queue-add             Add a task to the queue
    --description=<text> Task description (required)
    --skills=<a,b>      Comma-separated skills needed
    --priority=<level>  high, medium, or low (default: medium)
    --planning-dir=<path> Override .planning/ directory path

  queue-list            List queued tasks
    --planning-dir=<path> Override .planning/ directory path

  queue-remove          Remove a queued task
    --id=<task-id>      Task ID to remove (required)
    --planning-dir=<path> Override .planning/ directory path

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
  skill-creator orchestrator work-state save --session-id=abc123
  skill-creator orch ws restore --pretty
  skill-creator orch ws queue-add --description="Fix auth bug"
  skill-creator orch ws queue-list
  skill-creator orch ws queue-remove --id=<task-id>
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
      const verbosity = resolveVerbosity(args);
      const sections: OutputSection[] = [
        { tag: 'location', content: `Location: ${result.location} (${result.basePath})`, minLevel: 2 },
        { tag: 'version', content: `Version: ${result.version ?? 'unknown'}`, minLevel: 3 },
        { tag: 'commands', content: `Commands (${result.commands.length}):\n${result.commands.map((c: { name: string; description: string }) => `  - ${c.name}: ${c.description}`).join('\n')}`, minLevel: 1 },
        { tag: 'agents', content: `Agents (${result.agents.length}):\n${result.agents.map((a: { name: string; description: string }) => `  - ${a.name}: ${a.description}`).join('\n')}`, minLevel: 3 },
        { tag: 'teams', content: `Teams (${result.teams.length}):\n${result.teams.map((t: { name: string; description?: string; memberCount: number }) => `  - ${t.name}: ${t.description ?? 'no description'} (${t.memberCount} members)`).join('\n')}`, minLevel: 4 },
      ];
      const visible = filterByVerbosity(sections, verbosity);
      console.log('GSD Discovery Results');
      console.log('=====================');
      for (const s of visible) {
        console.log(s.content);
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
    await classifier.initialize(discovery);
    const result = await classifier.classify(input, state);

    // Evaluate HITL gate
    const gate = evaluateGate(
      result.command?.name ?? '',
      state.config.mode,
      result.confidence,
    );

    if (pretty) {
      const verbosity = resolveVerbosity(args, state.config.verbosity);
      const sections: OutputSection[] = [
        { tag: 'command', content: result.command ? `Command: ${result.command.name}` : 'Command: (none)', minLevel: 1 },
        { tag: 'confidence', content: `Confidence: ${(result.confidence * 100).toFixed(1)}%`, minLevel: 2 },
        { tag: 'type', content: `Type: ${result.type}`, minLevel: 3 },
        ...(result.command ? [{ tag: 'description', content: `Description: ${result.command.description}`, minLevel: 3 }] : []),
        ...(result.arguments.phaseNumber ? [{ tag: 'phase', content: `Phase: ${result.arguments.phaseNumber}`, minLevel: 2 }] : []),
        ...(result.lifecycleStage ? [{ tag: 'lifecycle', content: `Lifecycle Stage: ${result.lifecycleStage}`, minLevel: 4 }] : []),
        ...(result.alternatives.length > 0 ? [{ tag: 'alternatives', content: `Alternatives:\n${result.alternatives.map((a: { command: { name: string }; confidence: number }) => `  - ${a.command.name} (${(a.confidence * 100).toFixed(1)}%)`).join('\n')}`, minLevel: 5 }] : []),
        ...(gate.action !== 'proceed' ? [{ tag: 'gate', content: `Gate: ${gate.action} - ${gate.reason}`, minLevel: 2 }] : []),
      ];
      const visible = filterByVerbosity(sections, verbosity);
      console.log('Classification Result');
      console.log('=====================');
      for (const s of visible) {
        console.log(s.content);
      }
    } else {
      console.log(JSON.stringify({ ...result, gate }, null, 2));
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
      const verbosity = resolveVerbosity(args);
      const primaryContent = suggestion.primary.args
        ? `Primary Action:\n  Command: ${suggestion.primary.command}\n  Args: ${suggestion.primary.args}\n  Reason: ${suggestion.primary.reason}`
        : `Primary Action:\n  Command: ${suggestion.primary.command}\n  Reason: ${suggestion.primary.reason}`;
      const sections: OutputSection[] = [
        { tag: 'primary', content: primaryContent, minLevel: 1 },
        { tag: 'stage', content: `Stage: ${suggestion.stage}`, minLevel: 2 },
        { tag: 'context', content: `Context: ${suggestion.context}`, minLevel: 3 },
        ...(suggestion.alternatives.length > 0 ? [{ tag: 'alternatives', content: `Alternatives:\n${suggestion.alternatives.map((a: { command: string; reason: string }) => `  - ${a.command}: ${a.reason}`).join('\n')}`, minLevel: 4 }] : []),
      ];
      const visible = filterByVerbosity(sections, verbosity);
      console.log('Lifecycle Suggestion');
      console.log('====================');
      for (const s of visible) {
        console.log(s.content);
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
// Work-state subcommand
// ============================================================================

/**
 * Resolve the work state file path from --planning-dir flag.
 * Defaults to `.planning/hooks/current-work.yaml` in cwd.
 */
function resolveWorkStatePath(args: string[]): string {
  const planningDir = extractFlag(args, 'planning-dir')
    ?? join(process.cwd(), '.planning');
  return join(planningDir, 'hooks', DEFAULT_WORK_STATE_FILENAME);
}

/**
 * Execute the work-state subcommand.
 *
 * Dispatches to sub-subcommands: save, restore, queue-add, queue-list, queue-remove.
 */
async function handleWorkState(args: string[]): Promise<number> {
  const subSub = args[0];

  if (!subSub || subSub === '--help' || subSub === '-h') {
    // Show the full help which now includes work-state details
    showOrchestratorHelp();
    return 0;
  }

  const handlerArgs = args.slice(1);

  switch (subSub) {
    case 'save':
      return handleWorkStateSave(handlerArgs);
    case 'restore':
      return handleWorkStateRestore(handlerArgs);
    case 'queue-add':
      return handleWorkStateQueueAdd(handlerArgs);
    case 'queue-list':
      return handleWorkStateQueueList(handlerArgs);
    case 'queue-remove':
      return handleWorkStateQueueRemove(handlerArgs);
    default:
      console.log(JSON.stringify({
        error: `Unknown work-state subcommand: ${subSub}`,
        help: 'Available: save, restore, queue-add, queue-list, queue-remove',
      }, null, 2));
      return 1;
  }
}

/**
 * Save work state to YAML file.
 *
 * Builds a WorkState from CLI flags and writes via WorkStateWriter.
 * Flags: --session-id, --active-task, --skills (comma-separated)
 */
async function handleWorkStateSave(args: string[]): Promise<number> {
  const filePath = resolveWorkStatePath(args);
  const sessionId = extractFlag(args, 'session-id') ?? null;
  const activeTask = extractFlag(args, 'active-task') ?? null;
  const skillsRaw = extractFlag(args, 'skills');
  const loadedSkills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const writer = new WorkStateWriter(filePath);
    const state = {
      version: 1,
      session_id: sessionId,
      saved_at: new Date().toISOString(),
      active_task: activeTask,
      checkpoint: null,
      loaded_skills: loadedSkills,
      queued_tasks: [] as any[],
      workflow: null,
    };

    // Preserve existing queued_tasks if file already exists
    const reader = new WorkStateReader(filePath);
    const existing = await reader.read();
    if (existing) {
      state.queued_tasks = existing.queued_tasks;
    }

    await writer.save(state);
    console.log(JSON.stringify({ saved: filePath }, null, 2));
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

/**
 * Restore (read) work state from YAML file.
 *
 * Outputs as JSON or pretty-printed text.
 */
async function handleWorkStateRestore(args: string[]): Promise<number> {
  const filePath = resolveWorkStatePath(args);
  const pretty = hasFlag(args, 'pretty');

  try {
    const reader = new WorkStateReader(filePath);
    const state = await reader.read();

    if (!state) {
      console.log(JSON.stringify({ error: 'No work state found' }, null, 2));
      return 1;
    }

    if (pretty) {
      console.log('Work State');
      console.log('==========');
      console.log(`Version: ${state.version}`);
      console.log(`Session: ${state.session_id ?? '(none)'}`);
      console.log(`Saved at: ${state.saved_at}`);
      console.log(`Active task: ${state.active_task ?? '(none)'}`);
      console.log(`Loaded skills: ${state.loaded_skills.length > 0 ? state.loaded_skills.join(', ') : '(none)'}`);
      console.log(`Queued tasks: ${state.queued_tasks.length}`);
      if (state.checkpoint) {
        console.log(`Checkpoint: phase ${state.checkpoint.phase}, plan ${state.checkpoint.plan}, status ${state.checkpoint.status}`);
      }
      if (state.workflow) {
        console.log(`Workflow: ${state.workflow.name} (step: ${state.workflow.current_step})`);
      }
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

/**
 * Add a task to the work state queue.
 *
 * Required: --description. Optional: --skills, --priority, --source.
 */
async function handleWorkStateQueueAdd(args: string[]): Promise<number> {
  const filePath = resolveWorkStatePath(args);
  const description = extractFlag(args, 'description');
  const skillsRaw = extractFlag(args, 'skills');
  const priority = extractFlag(args, 'priority') as 'high' | 'medium' | 'low' | undefined;
  const source = extractFlag(args, 'source');

  if (!description) {
    console.log(JSON.stringify({
      error: 'Missing required --description flag',
      help: 'Usage: skill-creator orch ws queue-add --description="task description"',
    }, null, 2));
    return 1;
  }

  try {
    const manager = new QueueManager(filePath);
    const task = await manager.add({
      description,
      skills_needed: skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      priority,
      source,
    });
    console.log(JSON.stringify(task, null, 2));
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

/**
 * List all queued tasks from the work state.
 */
async function handleWorkStateQueueList(args: string[]): Promise<number> {
  const filePath = resolveWorkStatePath(args);

  try {
    const manager = new QueueManager(filePath);
    const tasks = await manager.list();
    console.log(JSON.stringify(tasks, null, 2));
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ error: message }, null, 2));
    return 1;
  }
}

/**
 * Remove a task from the work state queue by id.
 *
 * Required: --id.
 */
async function handleWorkStateQueueRemove(args: string[]): Promise<number> {
  const filePath = resolveWorkStatePath(args);
  const id = extractFlag(args, 'id');

  if (!id) {
    console.log(JSON.stringify({
      error: 'Missing required --id flag',
      help: 'Usage: skill-creator orch ws queue-remove --id=<task-id>',
    }, null, 2));
    return 1;
  }

  try {
    const manager = new QueueManager(filePath);
    const removed = await manager.remove(id);
    console.log(JSON.stringify({ removed }, null, 2));
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

    case 'work-state':
    case 'ws':
      return handleWorkState(handlerArgs);

    default:
      console.log(JSON.stringify({
        error: `Unknown subcommand: ${subcommand}`,
        help: 'Run "skill-creator orchestrator --help" for available subcommands',
      }, null, 2));
      return 1;
  }
}
