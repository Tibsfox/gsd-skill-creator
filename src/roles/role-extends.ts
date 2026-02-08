/**
 * Role composition via extends: field with additive constraint merging.
 *
 * Resolves an inheritance chain by walking the extends field depth-first,
 * merging from root ancestor to child:
 * - Constraints: additive (parent first, child appended), deduplicated by exact string match
 * - Skills: union, deduplicated, parent order preserved
 * - Tools: child-wins (child overrides parent when present)
 * - Model: child-wins (child overrides parent when present)
 *
 * Detects circular extends chains and missing parents, returning an error
 * string instead of throwing.
 */

import type { RoleDefinition } from './types.js';

/**
 * Resolve a role's extends chain into a single merged definition.
 *
 * @param definition - The role to resolve
 * @param loadRole - Callback to load a parent role by name (DI)
 * @param maxDepth - Maximum chain depth before aborting (default 10)
 * @returns Resolved definition with merged fields and chain of names, or error string
 */
export async function resolveRoleExtends(
  definition: RoleDefinition,
  loadRole: (name: string) => Promise<RoleDefinition | null>,
  maxDepth: number = 10,
): Promise<{ resolved: RoleDefinition; chain: string[] } | { error: string }> {
  // No extends -- return as-is
  if (!definition.extends) {
    return { resolved: definition, chain: [definition.name] };
  }

  // Walk the extends chain, collecting definitions from child to root
  const visited = new Set<string>();
  visited.add(definition.name);

  const chainDefs: RoleDefinition[] = [definition];
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

    const parent = await loadRole(parentName);
    if (!parent) {
      return { error: `Parent role "${parentName}" not found` };
    }

    visited.add(parentName);
    chainDefs.push(parent);
    current = parent;
  }

  // Reverse: root ancestor first, child last
  chainDefs.reverse();
  const chain = chainDefs.map(d => d.name);

  // Merge from root to child
  let merged = chainDefs[0];
  for (let i = 1; i < chainDefs.length; i++) {
    merged = mergeRoles(merged, chainDefs[i]);
  }

  return { resolved: merged, chain };
}

/**
 * Merge a parent role with a child role.
 *
 * - Skills: union, deduplicated, parent order preserved
 * - Constraints: concatenation parent-first, then deduplicate preserving order
 * - Tools: child-wins (child value overrides parent when present)
 * - Model: child-wins (child value overrides parent when present)
 */
function mergeRoles(parent: RoleDefinition, child: RoleDefinition): RoleDefinition {
  // Skills: union, deduplicated, parent order preserved
  const skills = [...new Set([...parent.skills, ...child.skills])];

  // Constraints: concatenation parent-first, then deduplicate preserving order
  const allConstraints = [...parent.constraints, ...child.constraints];
  const seen = new Set<string>();
  const constraints: string[] = [];
  for (const c of allConstraints) {
    if (!seen.has(c)) {
      seen.add(c);
      constraints.push(c);
    }
  }

  return {
    ...child,
    extends: null,
    skills,
    constraints,
    tools: child.tools ?? parent.tools,
    model: child.model ?? parent.model,
  };
}
