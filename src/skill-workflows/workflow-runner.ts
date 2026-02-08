/**
 * Step-by-step workflow executor with crash recovery via WorkState.
 *
 * The runner is a state tracker, not an executor. It:
 * - Validates skills and resolves extends chains on start
 * - Records step transitions (started/completed/failed) in JSONL
 * - Updates WorkState.workflow for crash recovery hints
 * - Computes remaining steps from JSONL (source of truth)
 *
 * JSONL is the authoritative source for step completion.
 * WorkState.workflow is the crash recovery hint -- it tells you
 * WHICH workflow to resume, while JSONL tells you WHERE to resume.
 */

import { randomUUID } from 'node:crypto';
import type { WorkflowDefinition, WorkflowRunEntry } from './types.js';
import type { WorkflowRunStore } from './workflow-run-store.js';
import type { WorkState } from '../orchestrator/work-state/types.js';
import type { WorkStateReader } from '../orchestrator/work-state/work-state-reader.js';
import type { WorkStateWriter } from '../orchestrator/work-state/work-state-writer.js';
import { resolveExtends } from './workflow-extends.js';
import { validateWorkflow } from './workflow-validator.js';
import { WorkflowDAG } from './workflow-dag.js';

export interface WorkflowRunnerDeps {
  runStore: WorkflowRunStore;
  workStateReader: WorkStateReader;
  workStateWriter: WorkStateWriter;
  skillExists: (name: string) => Promise<boolean>;
  loadWorkflow: (name: string) => Promise<WorkflowDefinition | null>;
}

export interface StepResult {
  step_id: string;
  status: 'completed' | 'failed' | 'skipped';
  error?: string;
}

export class WorkflowRunner {
  private activeWorkflowName: string = '';

  constructor(private deps: WorkflowRunnerDeps) {}

  /**
   * Start a new workflow run.
   *
   * 1. Load workflow by name
   * 2. Resolve extends chain
   * 3. Validate (skill existence + DAG)
   * 4. Generate run_id
   * 5. Get topological execution order
   * 6. Write initial WorkState.workflow
   */
  async start(workflowName: string): Promise<{ runId: string; steps: string[] }> {
    const definition = await this.deps.loadWorkflow(workflowName);
    if (!definition) {
      throw new Error(`Workflow "${workflowName}" not found`);
    }

    const resolved = await this.resolveWorkflow(definition);

    const validation = await validateWorkflow(resolved, this.deps.skillExists);
    if (!validation.valid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    const executionOrder = validation.executionOrder!;
    const runId = randomUUID();
    this.activeWorkflowName = workflowName;

    // Write initial WorkState
    const currentState = await this.deps.workStateReader.read();
    const newState: WorkState = {
      version: 1,
      session_id: currentState?.session_id ?? null,
      saved_at: new Date().toISOString(),
      active_task: currentState?.active_task ?? null,
      checkpoint: currentState?.checkpoint ?? null,
      loaded_skills: currentState?.loaded_skills ?? [],
      queued_tasks: currentState?.queued_tasks ?? [],
      workflow: {
        name: workflowName,
        current_step: executionOrder[0],
        completed_steps: [],
      },
    };
    await this.deps.workStateWriter.save(newState);

    return { runId, steps: executionOrder };
  }

  /**
   * Resume an interrupted workflow.
   *
   * 1. Read WorkState.workflow -- return null if no workflow
   * 2. Load and resolve workflow
   * 3. Get execution order from DAG
   * 4. Read JSONL for completed steps (source of truth)
   * 5. Compute remaining steps
   * 6. Find latest run_id
   */
  async resume(): Promise<{ runId: string; remainingSteps: string[] } | null> {
    const state = await this.deps.workStateReader.read();
    if (!state?.workflow) return null;

    this.activeWorkflowName = state.workflow.name;

    const definition = await this.deps.loadWorkflow(state.workflow.name);
    if (!definition) return null;

    const resolved = await this.resolveWorkflow(definition);
    const dag = WorkflowDAG.fromSteps(resolved.steps);
    const cycleResult = dag.detectCycles();
    if (cycleResult.hasCycle) return null;

    const executionOrder = cycleResult.topologicalOrder!;

    // Find latest run_id for this workflow
    const latestRun = await this.deps.runStore.getLatestRun(state.workflow.name);
    if (!latestRun) return null;

    // JSONL is source of truth for completed steps
    const completedSteps = await this.deps.runStore.getCompletedSteps(latestRun.runId);
    const completedSet = new Set(completedSteps);

    const remainingSteps = executionOrder.filter(id => !completedSet.has(id));

    return { runId: latestRun.runId, remainingSteps };
  }

  /**
   * Record a step as started.
   * The step itself is executed externally -- runner just tracks state.
   */
  async advanceStep(runId: string, stepId: string): Promise<StepResult> {
    const entry: WorkflowRunEntry = {
      run_id: runId,
      workflow_name: this.activeWorkflowName,
      step_id: stepId,
      status: 'started',
      started_at: new Date().toISOString(),
      completed_at: null,
      error: null,
    };
    await this.deps.runStore.append(entry);

    return { step_id: stepId, status: 'completed' };
  }

  /**
   * Mark a step as completed. Updates both JSONL and WorkState.
   *
   * If all steps are complete, WorkState.workflow is set to null.
   */
  async completeStep(runId: string, stepId: string): Promise<void> {
    // Append completed entry to JSONL
    const entry: WorkflowRunEntry = {
      run_id: runId,
      workflow_name: this.activeWorkflowName,
      step_id: stepId,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error: null,
    };
    await this.deps.runStore.append(entry);

    // Update WorkState
    const state = await this.deps.workStateReader.read();
    if (!state?.workflow) return;

    const definition = await this.deps.loadWorkflow(state.workflow.name);
    const newCompleted = [...state.workflow.completed_steps, stepId];

    // Determine if all steps are done
    let allDone = false;
    if (definition) {
      const resolved = await this.resolveWorkflow(definition);
      const allStepIds = resolved.steps.map(s => s.id);
      allDone = allStepIds.every(id => newCompleted.includes(id));
    }

    if (allDone) {
      // Workflow complete
      const newState: WorkState = {
        ...state,
        saved_at: new Date().toISOString(),
        workflow: null,
      };
      await this.deps.workStateWriter.save(newState);
    } else {
      // Find next step in execution order
      let nextStep = stepId;
      if (definition) {
        const resolved = await this.resolveWorkflow(definition);
        const dag = WorkflowDAG.fromSteps(resolved.steps);
        const cycleResult = dag.detectCycles();
        if (!cycleResult.hasCycle) {
          const order = cycleResult.topologicalOrder!;
          const completedSet = new Set(newCompleted);
          const next = order.find(id => !completedSet.has(id));
          if (next) nextStep = next;
        }
      }

      const newState: WorkState = {
        ...state,
        saved_at: new Date().toISOString(),
        workflow: {
          name: state.workflow.name,
          current_step: nextStep,
          completed_steps: newCompleted,
        },
      };
      await this.deps.workStateWriter.save(newState);
    }
  }

  /**
   * Mark a step as failed. Appends to JSONL but keeps WorkState.workflow
   * intact so the workflow can be retried.
   */
  async failStep(runId: string, stepId: string, error: string): Promise<void> {
    const entry: WorkflowRunEntry = {
      run_id: runId,
      workflow_name: this.activeWorkflowName,
      step_id: stepId,
      status: 'failed',
      started_at: new Date().toISOString(),
      completed_at: null,
      error,
    };
    await this.deps.runStore.append(entry);
    // WorkState.workflow NOT cleared -- workflow is paused, not done
  }

  /**
   * Get current status for a run: completed, remaining, and current step.
   */
  async getStatus(
    runId: string,
  ): Promise<{ completed: string[]; remaining: string[]; current: string | null }> {
    // Read workflow name from WorkState
    const state = await this.deps.workStateReader.read();
    if (!state?.workflow) {
      const completedSteps = await this.deps.runStore.getCompletedSteps(runId);
      return { completed: completedSteps, remaining: [], current: null };
    }

    const definition = await this.deps.loadWorkflow(state.workflow.name);
    if (!definition) {
      return { completed: [], remaining: [], current: null };
    }

    const resolved = await this.resolveWorkflow(definition);
    const dag = WorkflowDAG.fromSteps(resolved.steps);
    const cycleResult = dag.detectCycles();
    if (cycleResult.hasCycle) {
      return { completed: [], remaining: [], current: null };
    }

    const executionOrder = cycleResult.topologicalOrder!;
    const completedSteps = await this.deps.runStore.getCompletedSteps(runId);
    const completedSet = new Set(completedSteps);
    const remaining = executionOrder.filter(id => !completedSet.has(id));
    const current = remaining.length > 0 ? remaining[0] : null;

    return { completed: completedSteps, remaining, current };
  }

  /**
   * Resolve a workflow's extends chain, returning the merged definition.
   * Throws on resolution errors (circular, missing parent).
   */
  private async resolveWorkflow(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    const result = await resolveExtends(definition, this.deps.loadWorkflow);
    if ('error' in result) {
      throw new Error(`Extends resolution failed: ${result.error}`);
    }
    return result.resolved;
  }
}
