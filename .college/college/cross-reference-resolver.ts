/**
 * CrossReferenceResolver -- links concepts across departments via
 * analogy and cross-reference relationships.
 *
 * Uses the ConceptRegistry to find relationships that cross department
 * boundaries, enabling navigation like "exponential decay in math
 * relates to cooling curves in culinary arts."
 *
 * @module college/cross-reference-resolver
 */

import type { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { CrossReferenceResult } from './types.js';

// ─── Error Classes ───────────────────────────────────────────────────────────

export class ConceptNotFoundError extends Error {
  constructor(conceptId: string) {
    super(`Concept not found: '${conceptId}'`);
    this.name = 'ConceptNotFoundError';
  }
}

// ─── CrossReferenceResolver ──────────────────────────────────────────────────

export class CrossReferenceResolver {
  private registry: ConceptRegistry;

  constructor(registry: ConceptRegistry) {
    this.registry = registry;
  }

  /**
   * Resolve cross-references from a specific concept to a target department.
   *
   * Looks up the source concept, finds all analogy and cross-reference
   * relationships, and filters for those pointing to concepts in the
   * target department.
   *
   * @param fromDept - Source department ID
   * @param fromConcept - Source concept ID
   * @param toDept - Target department ID to find matches in
   * @returns CrossReferenceResult with matching concepts
   * @throws ConceptNotFoundError if source concept doesn't exist
   */
  resolve(
    fromDept: string,
    fromConcept: string,
    toDept: string,
  ): CrossReferenceResult {
    const concept = this.registry.get(fromConcept);
    if (!concept) {
      throw new ConceptNotFoundError(fromConcept);
    }

    const matches: CrossReferenceResult['matches'] = [];

    for (const rel of concept.relationships) {
      if (rel.type === 'analogy' || rel.type === 'cross-reference') {
        const target = this.registry.get(rel.targetId);
        if (target && target.domain === toDept) {
          matches.push({
            conceptId: target.id,
            conceptName: target.name,
            relationshipType: rel.type,
            description: rel.description,
          });
        }
      }
    }

    return {
      fromDepartment: fromDept,
      fromConcept,
      toDepartment: toDept,
      matches,
    };
  }

  /**
   * Resolve all outgoing cross-references from a department.
   *
   * Collects all concepts in the source department, finds their
   * analogy and cross-reference relationships, and groups by
   * target department.
   *
   * @param fromDept - Source department ID
   * @returns Array of CrossReferenceResult grouped by target department
   */
  resolveAll(fromDept: string): CrossReferenceResult[] {
    const concepts = this.registry.search('', fromDept);
    const resultsByDept = new Map<string, CrossReferenceResult>();

    for (const concept of concepts) {
      for (const rel of concept.relationships) {
        if (rel.type === 'analogy' || rel.type === 'cross-reference') {
          const target = this.registry.get(rel.targetId);
          if (target && target.domain !== fromDept) {
            const toDept = target.domain;
            if (!resultsByDept.has(`${concept.id}:${toDept}`)) {
              resultsByDept.set(`${concept.id}:${toDept}`, {
                fromDepartment: fromDept,
                fromConcept: concept.id,
                toDepartment: toDept,
                matches: [],
              });
            }
            resultsByDept.get(`${concept.id}:${toDept}`)!.matches.push({
              conceptId: target.id,
              conceptName: target.name,
              relationshipType: rel.type,
              description: rel.description,
            });
          }
        }
      }
    }

    return Array.from(resultsByDept.values());
  }

  /**
   * Find bidirectional concept bridges between two departments.
   *
   * A bridge exists when a concept in department A has a relationship
   * to a concept in department B (or vice versa). Returns pairs of
   * connected concepts.
   *
   * @param deptA - First department ID
   * @param deptB - Second department ID
   * @returns Array of bridge objects with connected concept pairs
   */
  findBridges(
    deptA: string,
    deptB: string,
  ): Array<{ conceptA: string; conceptB: string; relationships: string[] }> {
    const conceptsA = this.registry.search('', deptA);
    const conceptsB = this.registry.search('', deptB);
    const bridges = new Map<string, { conceptA: string; conceptB: string; relationships: string[] }>();

    // Check A -> B relationships
    for (const concept of conceptsA) {
      for (const rel of concept.relationships) {
        if (rel.type === 'analogy' || rel.type === 'cross-reference') {
          const target = this.registry.get(rel.targetId);
          if (target && target.domain === deptB) {
            const key = [concept.id, target.id].sort().join(':');
            if (!bridges.has(key)) {
              bridges.set(key, {
                conceptA: concept.id,
                conceptB: target.id,
                relationships: [],
              });
            }
            bridges.get(key)!.relationships.push(
              `${concept.id} -[${rel.type}]-> ${target.id}: ${rel.description}`,
            );
          }
        }
      }
    }

    // Check B -> A relationships
    for (const concept of conceptsB) {
      for (const rel of concept.relationships) {
        if (rel.type === 'analogy' || rel.type === 'cross-reference') {
          const target = this.registry.get(rel.targetId);
          if (target && target.domain === deptA) {
            const key = [concept.id, target.id].sort().join(':');
            if (!bridges.has(key)) {
              bridges.set(key, {
                conceptA: target.id,
                conceptB: concept.id,
                relationships: [],
              });
            }
            bridges.get(key)!.relationships.push(
              `${concept.id} -[${rel.type}]-> ${target.id}: ${rel.description}`,
            );
          }
        }
      }
    }

    return Array.from(bridges.values());
  }
}
