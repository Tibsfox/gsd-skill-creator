/**
 * CLI subcommand handler for workflow management.
 *
 * Provides create/run/list/status subcommands for managing skill workflows.
 * Follows the same dispatch pattern as orchestrator.ts:
 * - JSON output by default for agent consumption
 * - --pretty for human-readable output
 * - Exit code 1 with { error } JSON on failure
 *
 * Subcommands:
 * - create: Interactive or flag-driven workflow scaffolding
 * - run: Load, validate, and execute/resume a workflow
 * - list: Show all .workflow.yaml files with metadata
 * - status: Show run state (completed/remaining steps)
 */

import { join } from 'node:path';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import {
  parseWorkflowFile,
  parseWorkflowYaml,
  validateWorkflow,
  WorkflowRunner,
  WorkflowRunStore,
  WorkflowDAG,
  resolveExtends,
} from '../../skill-workflows/index.js';
import type { WorkflowDefinition, WorkflowStep } from '../../skill-workflows/index.js';
import { WorkStateReader } from '../../orchestrator/work-state/work-state-reader.js';
import { WorkStateWriter } from '../../orchestrator/work-state/work-state-writer.js';
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

// ============================================================================
// Directory resolution helpers
// ============================================================================

/**
 * Resolve the workflow directory.
 * Workflows live at `.claude/workflows/` in the project root.
 */
function resolveWorkflowDir(): string {
  return join(process.cwd(), '.claude', 'workflows');
}

/**
 * Resolve the patterns directory for the run store.
 */
function resolvePatternsDir(): string {
  return join(process.cwd(), '.planning', 'patterns');
}

/**
 * Resolve the work state YAML file path.
 */
function resolveWorkStatePath(): string {
  return join(process.cwd(), '.planning', 'hooks', DEFAULT_WORK_STATE_FILENAME);
}

// ============================================================================
// Help text
// ============================================================================

function showWorkflowHelp(): void {
  console.log(`
skill-creator workflow - Manage skill workflows

Usage:
  skill-creator workflow <subcommand> [options]
  skill-creator wf <subcommand> [options]

Subcommands:
  create, c     Create a new workflow (interactive or flags)
  run, r        Run or resume a workflow
  list, l       List all workflow files
  status, s     Show run status for a workflow

Create Options:
  --name=<name>       Workflow name (non-interactive)
  --steps=<json>      Steps as JSON array (non-interactive)
  --description=<d>   Workflow description

Run Options:
  --resume            Resume an interrupted workflow

List Options:
  --json              Output as JSON (default)
  --pretty            Human-readable output

Status Options:
  --pretty            Human-readable output

Examples:
  skill-creator workflow create
  skill-creator wf c --name=deploy --steps='[{"id":"lint","skill":"linter"},{"id":"test","skill":"tester","needs":["lint"]}]'
  skill-creator workflow run deploy
  skill-creator wf r deploy --resume
  skill-creator workflow list
  skill-creator workflow status deploy
`);
}

// ============================================================================
// Create subcommand
// ============================================================================

/**
 * Create a new workflow interactively or from flags.
 *
 * Non-interactive mode: --name and --steps are required.
 * Interactive mode: prompts for name, description, and steps in a loop.
 */
async function handleCreate(args: string[]): Promise<number> {
  const nameFlag = extractFlag(args, 'name');
  const stepsFlag = extractFlag(args, 'steps');
  const descFlag = extractFlag(args, 'description');

  let name: string;
  let description: string | undefined;
  let steps: WorkflowStep[];

  if (nameFlag && stepsFlag) {
    // Non-interactive mode
    name = nameFlag;
    description = descFlag;

    try {
      const parsed = JSON.parse(stepsFlag);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.log(JSON.stringify({ error: 'Steps must be a non-empty JSON array' }, null, 2));
        return 1;
      }
      steps = parsed.map((s: Record<string, unknown>) => ({
        id: String(s.id ?? ''),
        skill: String(s.skill ?? ''),
        description: s.description ? String(s.description) : undefined,
        needs: Array.isArray(s.needs) ? s.needs.map(String) : [],
      }));
    } catch {
      console.log(JSON.stringify({ error: 'Invalid JSON in --steps flag' }, null, 2));
      return 1;
    }
  } else if (nameFlag || stepsFlag) {
    console.log(JSON.stringify({
      error: 'Both --name and --steps are required for non-interactive mode',
    }, null, 2));
    return 1;
  } else {
    // Interactive mode
    try {
      const p = await import('@clack/prompts');

      p.intro('Create a new workflow');

      const nameResult = await p.text({
        message: 'Workflow name:',
        placeholder: 'deploy-pipeline',
        validate: (val: string | undefined) => {
          if (!val || !val.trim()) return 'Name is required';
          if (!/^[a-z0-9-]+$/.test(val)) return 'Name must be lowercase letters, numbers, and hyphens';
          return undefined;
        },
      });
      if (p.isCancel(nameResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      name = nameResult as string;

      const descResult = await p.text({
        message: 'Description (optional):',
        placeholder: 'A pipeline for deploying the application',
      });
      if (p.isCancel(descResult)) {
        p.cancel('Cancelled');
        return 1;
      }
      description = (descResult as string) || undefined;

      steps = [];
      let addMore = true;
      while (addMore) {
        const stepId = await p.text({
          message: `Step ${steps.length + 1} ID:`,
          placeholder: 'lint',
          validate: (val: string | undefined) => {
            if (!val || !val.trim()) return 'Step ID is required';
            return undefined;
          },
        });
        if (p.isCancel(stepId)) { p.cancel('Cancelled'); return 1; }

        const stepSkill = await p.text({
          message: `Step ${steps.length + 1} skill:`,
          placeholder: 'linter',
          validate: (val: string | undefined) => {
            if (!val || !val.trim()) return 'Skill name is required';
            return undefined;
          },
        });
        if (p.isCancel(stepSkill)) { p.cancel('Cancelled'); return 1; }

        const stepNeeds = await p.text({
          message: `Step ${steps.length + 1} needs (comma-separated IDs, or empty):`,
          placeholder: '',
        });
        if (p.isCancel(stepNeeds)) { p.cancel('Cancelled'); return 1; }

        const needsArr = (stepNeeds as string)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

        steps.push({
          id: stepId as string,
          skill: stepSkill as string,
          needs: needsArr,
        });

        const cont = await p.confirm({ message: 'Add another step?' });
        if (p.isCancel(cont)) { p.cancel('Cancelled'); return 1; }
        addMore = cont as boolean;
      }

      if (steps.length === 0) {
        p.cancel('At least one step is required');
        return 1;
      }
    } catch (err) {
      console.log(JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }, null, 2));
      return 1;
    }
  }

  // Build workflow definition
  const definition: WorkflowDefinition = {
    name,
    version: 1,
    extends: null,
    steps,
    ...(description ? { description } : {}),
  };

  // Validate DAG is acyclic
  const dag = WorkflowDAG.fromSteps(steps);
  const cycleResult = dag.detectCycles();
  if (cycleResult.hasCycle) {
    console.log(JSON.stringify({
      error: `Circular dependency detected: ${cycleResult.cycle!.join(' -> ')}`,
    }, null, 2));
    return 1;
  }

  // Write YAML file
  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const workflowDir = resolveWorkflowDir();
    await mkdir(workflowDir, { recursive: true });

    const filePath = join(workflowDir, `${name}.workflow.yaml`);

    // Build a clean YAML-friendly object (no null extends, no empty arrays)
    const yamlObj: Record<string, unknown> = {
      name: definition.name,
      version: definition.version,
      ...(definition.description ? { description: definition.description } : {}),
      steps: definition.steps.map((s) => ({
        id: s.id,
        skill: s.skill,
        ...(s.description ? { description: s.description } : {}),
        ...(s.needs.length > 0 ? { needs: s.needs } : {}),
      })),
    };

    const content = (yaml as any).dump(yamlObj, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
    await writeFile(filePath, content, 'utf-8');

    console.log(JSON.stringify({
      created: filePath,
      name,
      steps: steps.length,
      executionOrder: cycleResult.topologicalOrder,
    }, null, 2));
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Run subcommand
// ============================================================================

/**
 * Run or resume a workflow.
 *
 * Usage: workflow run <name> [--resume]
 */
async function handleRun(args: string[]): Promise<number> {
  const workflowName = args.filter((a) => !a.startsWith('--'))[0];
  const resume = hasFlag(args, 'resume');

  if (!workflowName) {
    console.log(JSON.stringify({
      error: 'Workflow name is required',
      help: 'Usage: skill-creator workflow run <name>',
    }, null, 2));
    return 1;
  }

  try {
    const workflowDir = resolveWorkflowDir();
    const patternsDir = resolvePatternsDir();
    const workStatePath = resolveWorkStatePath();

    const runStore = new WorkflowRunStore(patternsDir);
    const workStateReader = new WorkStateReader(workStatePath);
    const workStateWriter = new WorkStateWriter(workStatePath);

    const runner = new WorkflowRunner({
      runStore,
      workStateReader,
      workStateWriter,
      skillExists: async () => true, // CLI does not enforce skill existence
      loadWorkflow: async (name: string) => {
        const filePath = join(workflowDir, `${name}.workflow.yaml`);
        return parseWorkflowFile(filePath);
      },
    });

    if (resume) {
      const resumeResult = await runner.resume();
      if (!resumeResult) {
        console.log(JSON.stringify({
          error: 'No interrupted workflow found to resume',
        }, null, 2));
        return 1;
      }

      const { runId, remainingSteps } = resumeResult;
      const stepResults: Array<{ step_id: string; status: string }> = [];

      for (const stepId of remainingSteps) {
        await runner.advanceStep(runId, stepId);
        await runner.completeStep(runId, stepId);
        stepResults.push({ step_id: stepId, status: 'completed' });
      }

      console.log(JSON.stringify({
        resumed: true,
        runId,
        stepsCompleted: stepResults,
      }, null, 2));
      return 0;
    }

    // New run
    const { runId, steps } = await runner.start(workflowName);
    const stepResults: Array<{ step_id: string; status: string }> = [];

    for (const stepId of steps) {
      await runner.advanceStep(runId, stepId);
      await runner.completeStep(runId, stepId);
      stepResults.push({ step_id: stepId, status: 'completed' });
    }

    console.log(JSON.stringify({
      completed: true,
      workflow: workflowName,
      runId,
      stepsCompleted: stepResults,
    }, null, 2));
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// List subcommand
// ============================================================================

/**
 * List all workflow YAML files.
 *
 * Scans .claude/workflows/ for *.workflow.yaml files and displays metadata.
 */
async function handleList(args: string[]): Promise<number> {
  const pretty = hasFlag(args, 'pretty');

  try {
    const workflowDir = resolveWorkflowDir();

    let files: string[];
    try {
      const entries = await readdir(workflowDir);
      files = entries.filter((f) => f.endsWith('.workflow.yaml'));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        if (pretty) {
          console.log('No workflows found.');
          console.log(`Create one with: skill-creator workflow create`);
        } else {
          console.log(JSON.stringify({ workflows: [] }, null, 2));
        }
        return 0;
      }
      throw err;
    }

    if (files.length === 0) {
      if (pretty) {
        console.log('No workflows found.');
        console.log(`Create one with: skill-creator workflow create`);
      } else {
        console.log(JSON.stringify({ workflows: [] }, null, 2));
      }
      return 0;
    }

    const workflows: Array<{
      name: string;
      description?: string;
      steps: number;
      file: string;
    }> = [];

    for (const file of files) {
      const filePath = join(workflowDir, file);
      const def = await parseWorkflowFile(filePath);
      if (def) {
        workflows.push({
          name: def.name,
          description: def.description,
          steps: def.steps.length,
          file,
        });
      }
    }

    if (pretty) {
      console.log('Workflows:');
      for (const wf of workflows) {
        const desc = wf.description ? ` - ${wf.description}` : '';
        console.log(`  ${wf.name}${desc} (${wf.steps} steps)`);
      }
    } else {
      console.log(JSON.stringify({ workflows }, null, 2));
    }
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Status subcommand
// ============================================================================

/**
 * Show the status of a workflow's latest run.
 *
 * Usage: workflow status <name>
 */
async function handleStatus(args: string[]): Promise<number> {
  const workflowName = args.filter((a) => !a.startsWith('--'))[0];
  const pretty = hasFlag(args, 'pretty');

  if (!workflowName) {
    console.log(JSON.stringify({
      error: 'Workflow name is required',
      help: 'Usage: skill-creator workflow status <name>',
    }, null, 2));
    return 1;
  }

  try {
    const patternsDir = resolvePatternsDir();
    const runStore = new WorkflowRunStore(patternsDir);

    const latestRun = await runStore.getLatestRun(workflowName);
    if (!latestRun) {
      if (pretty) {
        console.log(`No runs found for workflow "${workflowName}".`);
      } else {
        console.log(JSON.stringify({
          workflow: workflowName,
          status: 'no-runs',
        }, null, 2));
      }
      return 0;
    }

    // Load workflow to get step list
    const workflowDir = resolveWorkflowDir();
    const def = await parseWorkflowFile(join(workflowDir, `${workflowName}.workflow.yaml`));

    const completedSteps = await runStore.getCompletedSteps(latestRun.runId);
    const completedSet = new Set(completedSteps);

    let allStepIds: string[] = [];
    let remainingSteps: string[] = [];

    if (def) {
      const dag = WorkflowDAG.fromSteps(def.steps);
      const cycleResult = dag.detectCycles();
      if (!cycleResult.hasCycle && cycleResult.topologicalOrder) {
        allStepIds = cycleResult.topologicalOrder;
        remainingSteps = allStepIds.filter((id) => !completedSet.has(id));
      }
    }

    const status = {
      workflow: workflowName,
      runId: latestRun.runId,
      completed: completedSteps,
      remaining: remainingSteps,
      current: remainingSteps.length > 0 ? remainingSteps[0] : null,
      allDone: remainingSteps.length === 0,
    };

    if (pretty) {
      console.log(`Workflow: ${workflowName}`);
      console.log(`Run ID: ${latestRun.runId}`);
      console.log(`Completed: ${completedSteps.join(', ') || '(none)'}`);
      console.log(`Remaining: ${remainingSteps.join(', ') || '(none)'}`);
      if (status.current) {
        console.log(`Current: ${status.current}`);
      }
      console.log(`Status: ${status.allDone ? 'completed' : 'in-progress'}`);
    } else {
      console.log(JSON.stringify(status, null, 2));
    }
    return 0;
  } catch (err) {
    console.log(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }, null, 2));
    return 1;
  }
}

// ============================================================================
// Main dispatcher
// ============================================================================

/**
 * Workflow CLI command entry point.
 *
 * Dispatches to the appropriate subcommand handler based on the first argument.
 *
 * @param args - Command-line arguments after 'workflow'
 * @returns Exit code (0 for success, 1 for error)
 */
export async function workflowCommand(args: string[]): Promise<number> {
  const subcommand = args[0];

  // Help flags or no subcommand -> show help
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    showWorkflowHelp();
    return 0;
  }

  // Strip the subcommand from args for handler consumption
  const handlerArgs = args.slice(1);

  switch (subcommand) {
    case 'create':
    case 'c':
      return handleCreate(handlerArgs);

    case 'run':
    case 'r':
      return handleRun(handlerArgs);

    case 'list':
    case 'l':
      return handleList(handlerArgs);

    case 'status':
    case 's':
      return handleStatus(handlerArgs);

    default:
      console.log(JSON.stringify({
        error: `Unknown subcommand: ${subcommand}`,
        help: 'Run "skill-creator workflow --help" for available subcommands',
      }, null, 2));
      return 1;
  }
}
