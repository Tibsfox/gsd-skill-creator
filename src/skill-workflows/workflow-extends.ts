/**
 * Workflow composition via extends: field with step merging.
 *
 * Resolves an inheritance chain by walking the extends field depth-first,
 * merging steps from root ancestor up to the child. Child steps with the
 * same id as a parent step replace it entirely; new child steps are added.
 *
 * Detects circular extends chains and missing parents, returning an error
 * string instead of throwing.
 */

import type { WorkflowDefinition, WorkflowStep } from './types.js';

/**
 * Resolve a workflow's extends chain into a single merged definition.
 *
 * @param definition - The workflow to resolve
 * @param loadWorkflow - Callback to load a parent workflow by name (DI)
 * @param maxDepth - Maximum chain depth before aborting (default 10)
 * @returns Resolved definition with merged steps and chain of names, or error string
 */
export async function resolveExtends(
  definition: WorkflowDefinition,
  loadWorkflow: (name: string) => Promise<WorkflowDefinition | null>,
  maxDepth: number = 10,
): Promise<{ resolved: WorkflowDefinition; chain: string[] } | { error: string }> {
  // No extends -- return as-is
  if (!definition.extends) {
    return { resolved: definition, chain: [definition.name] };
  }

  // Walk the extends chain, collecting definitions from child to root
  const visited = new Set<string>();
  visited.add(definition.name);

  const chainDefs: WorkflowDefinition[] = [definition];
  let current = definition;
  let depth = 0;

  while (current.extends) {
    depth++;
    if (depth > maxDepth) {
      return { error: `Extends chain exceeds maximum depth of ${maxDepth}` };
    }

    const parentName = current.extends;

    if (visited.has(parentName)) {
      return { error: `Circular extends chain detected: "${parentName}" already in chain` };
    }

    const parent = await loadWorkflow(parentName);
    if (!parent) {
      return { error: `Parent workflow "${parentName}" not found` };
    }

    visited.add(parentName);
    chainDefs.push(parent);
    current = parent;
  }

  // Reverse: root ancestor first, child last
  chainDefs.reverse();
  const chain = chainDefs.map(d => d.name);

  // Merge steps: start from root, overlay each descendant
  const mergedStepsMap = new Map<string, WorkflowStep>();

  for (const def of chainDefs) {
    for (const step of def.steps) {
      // Same id replaces entirely; new id adds
      mergedStepsMap.set(step.id, step);
    }
  }

  const mergedSteps = [...mergedStepsMap.values()];

  const resolved: WorkflowDefinition = {
    ...definition,
    extends: null, // resolved -- no longer extends anything
    steps: mergedSteps,
  };

  return { resolved, chain };
}
