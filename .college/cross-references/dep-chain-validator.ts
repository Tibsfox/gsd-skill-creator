/**
 * DepChainValidator -- validates dependency chains in the Rosetta concept graph.
 *
 * Enforces:
 * 1. Max chain depth of 4 (A->B->C->D is valid; A->B->C->D->E is a violation)
 * 2. No circular dependencies (A->B->A is a violation)
 *
 * Operates on 'dependency' type relationships from ConceptRelationship arrays.
 * 'cross-reference' and 'analogy' relationships are NOT validated for depth/cycles
 * (they are navigational hints, not dependency chains).
 *
 * @module cross-references/dep-chain-validator
 */

import type { ConceptRegistry } from '../rosetta-core/concept-registry.js';

export interface DepChainError {
  type: 'cycle' | 'max-depth';
  conceptId: string;
  detail: string;
  cyclePath?: string[];
  depth?: number;
}

export interface DepChainValidationResult {
  valid: boolean;
  errors: DepChainError[];
}

export class DepChainValidationError extends Error {
  readonly errors: DepChainError[];

  constructor(errors: DepChainError[]) {
    super(`Dependency chain validation failed with ${errors.length} error(s)`);
    this.name = 'DepChainValidationError';
    this.errors = errors;
  }
}

const MAX_DEPTH = 4;

export class DepChainValidator {
  /**
   * Validate all concepts in the registry for dependency chain rules.
   *
   * Checks every concept as a potential chain root. Returns all violations found.
   * Does NOT throw -- returns structured result for programmatic use.
   * Use validateOrThrow() for build-time assertions.
   *
   * @param registry - The ConceptRegistry containing all concepts to validate
   */
  validate(registry: ConceptRegistry): DepChainValidationResult {
    const errors: DepChainError[] = [];
    const allConcepts = registry.getAll();

    for (const concept of allConcepts) {
      const depRels = concept.relationships.filter((r) => r.type === 'dependency');
      if (depRels.length === 0) continue;

      // BFS/DFS from this concept to check depth and cycles
      // Start at depth 1 (concept itself is the first node in the chain)
      const conceptErrors = this.validateChain(concept.id, registry, new Set(), 1);
      errors.push(...conceptErrors);
    }

    // Deduplicate errors by conceptId + type + detail
    const seen = new Set<string>();
    const deduped = errors.filter((e) => {
      const key = `${e.type}:${e.conceptId}:${e.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { valid: deduped.length === 0, errors: deduped };
  }

  /**
   * Validate and throw if any violations found.
   * Intended for build-time use (CI/test setup, etc.).
   */
  validateOrThrow(registry: ConceptRegistry): void {
    const result = this.validate(registry);
    if (!result.valid) {
      throw new DepChainValidationError(result.errors);
    }
  }

  private validateChain(
    conceptId: string,
    registry: ConceptRegistry,
    visited: Set<string>,
    depth: number,
  ): DepChainError[] {
    const errors: DepChainError[] = [];

    if (depth > MAX_DEPTH) {
      errors.push({
        type: 'max-depth',
        conceptId,
        detail: `Dependency chain depth ${depth} exceeds maximum allowed depth of ${MAX_DEPTH}`,
        depth,
      });
      return errors;
    }

    if (visited.has(conceptId)) {
      errors.push({
        type: 'cycle',
        conceptId,
        detail: `Circular dependency detected involving concept '${conceptId}'`,
        cyclePath: [...visited, conceptId],
      });
      return errors;
    }

    const concept = registry.get(conceptId);
    if (!concept) return errors;

    const newVisited = new Set(visited);
    newVisited.add(conceptId);

    for (const rel of concept.relationships) {
      if (rel.type !== 'dependency') continue;
      const childErrors = this.validateChain(rel.targetId, registry, newVisited, depth + 1);
      errors.push(...childErrors);
    }

    return errors;
  }
}
