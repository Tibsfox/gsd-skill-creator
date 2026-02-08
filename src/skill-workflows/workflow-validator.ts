/**
 * Validates a workflow definition for correctness.
 *
 * Checks:
 * 1. All `needs` references point to step IDs that exist in the workflow
 * 2. All `skill` references exist via an injected skillExists callback
 * 3. No circular dependencies between steps (via WorkflowDAG)
 *
 * Returns a WorkflowValidationResult with all collected errors and
 * the topological execution order when the workflow is valid.
 */

import type { WorkflowDefinition, WorkflowValidationResult } from './types.js';
import { WorkflowDAG } from './workflow-dag.js';

/**
 * Validate a workflow definition for structural and referential correctness.
 *
 * @param definition - Parsed workflow definition to validate
 * @param skillExists - Callback to check whether a skill name exists.
 *   Injected for DI -- callers provide their own skill lookup.
 * @returns Validation result with errors and execution order
 */
export async function validateWorkflow(
  definition: WorkflowDefinition,
  skillExists: (name: string) => Promise<boolean>,
): Promise<WorkflowValidationResult> {
  const errors: string[] = [];
  const stepIds = new Set(definition.steps.map(s => s.id));

  // 1. Check all needs references point to existing step IDs
  for (const step of definition.steps) {
    for (const needed of step.needs) {
      if (!stepIds.has(needed)) {
        errors.push(`Step "${step.id}" needs unknown step "${needed}"`);
      }
    }
  }

  // 2. Check all skill references exist
  for (const step of definition.steps) {
    const exists = await skillExists(step.skill);
    if (!exists) {
      errors.push(`Step "${step.id}" references unknown skill "${step.skill}"`);
    }
  }

  // 3. Build DAG and check for cycles
  const dag = WorkflowDAG.fromSteps(definition.steps);
  const cycleResult = dag.detectCycles();

  if (cycleResult.hasCycle) {
    const cycleNodes = cycleResult.cycle!.join(' -> ');
    errors.push(`Circular dependency detected in steps: ${cycleNodes}`);
  }

  const executionOrder = cycleResult.hasCycle ? null : (cycleResult.topologicalOrder ?? null);

  return {
    valid: errors.length === 0,
    errors,
    executionOrder,
  };
}
