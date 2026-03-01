/**
 * Concept Registry -- stores and retrieves canonical concept definitions.
 *
 * Provides concept lookup by ID, domain-based queries, dependency
 * resolution for concept relationships, panel expression queries,
 * and Complex Plane position lookups.
 *
 * @module rosetta-core/concept-registry
 */

import type {
  RosettaConcept,
  PanelId,
  PanelExpression,
  ConceptRelationship,
  ComplexPosition,
} from './types.js';

// ─── Supporting Types ─────────────────────────────────────────────────────────

/**
 * A resolved cross-reference between two concepts.
 */
export interface CrossReference {
  /** Source concept ID */
  fromId: string;
  /** Target concept ID */
  toId: string;
  /** Human-readable description of the cross-reference */
  description: string;
}

// ─── Error Classes ────────────────────────────────────────────────────────────

/**
 * Thrown when a concept cannot be found in the registry.
 */
export class ConceptNotFoundError extends Error {
  constructor(conceptId: string) {
    super(`Concept not found: '${conceptId}'`);
    this.name = 'ConceptNotFoundError';
  }
}

/**
 * Thrown when a circular dependency is detected during dependency resolution.
 */
export class ConceptCircularDependencyError extends Error {
  /** The cycle path that was detected (array of concept IDs forming the cycle) */
  public readonly cyclePath: string[];

  constructor(cyclePath: string[]) {
    super(`Circular dependency detected: ${cyclePath.join(' -> ')}`);
    this.name = 'ConceptCircularDependencyError';
    this.cyclePath = cyclePath;
  }
}

// ─── Concept Registry ─────────────────────────────────────────────────────────

/**
 * In-memory registry for RosettaConcepts.
 *
 * Stores concepts by ID and provides methods for lookup, search,
 * dependency resolution, panel queries, and Complex Plane navigation.
 * This is the data foundation for the Rosetta Core engine -- both
 * the Panel Router and Expression Renderer query it.
 */
export class ConceptRegistry {
  /** Internal storage of registered concepts keyed by ID */
  private concepts: Map<string, RosettaConcept> = new Map();

  /**
   * Register a concept in the registry.
   *
   * @param concept - The RosettaConcept to register
   * @throws Error if a concept with the same ID is already registered
   */
  register(concept: RosettaConcept): void {
    if (this.concepts.has(concept.id)) {
      throw new Error(`Concept '${concept.id}' is already registered`);
    }
    this.concepts.set(concept.id, concept);
  }

  /**
   * Retrieve a concept by its ID.
   *
   * @param id - The concept ID to look up
   * @returns The concept, or undefined if not found
   */
  get(id: string): RosettaConcept | undefined {
    return this.concepts.get(id);
  }

  /**
   * Search for concepts by text query with optional domain filter.
   *
   * Matches concepts whose name or description contains the query string
   * (case-insensitive). If domain is provided, only returns concepts
   * in that domain.
   *
   * @param query - Text to search for in concept names and descriptions
   * @param domain - Optional domain filter
   * @returns Array of matching concepts
   */
  search(query: string, domain?: string): RosettaConcept[] {
    const lowerQuery = query.toLowerCase();
    const results: RosettaConcept[] = [];

    for (const concept of this.concepts.values()) {
      if (domain && concept.domain !== domain) {
        continue;
      }
      if (
        concept.name.toLowerCase().includes(lowerQuery) ||
        concept.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push(concept);
      }
    }

    return results;
  }

  /**
   * Resolve all transitive dependencies for a concept.
   *
   * Follows 'dependency' relationships recursively and returns a
   * deduplicated flat array of all dependency concepts (not including
   * the original concept itself).
   *
   * @param id - The concept ID to resolve dependencies for
   * @returns Array of dependency concepts in resolution order
   * @throws ConceptNotFoundError if the concept does not exist
   * @throws ConceptCircularDependencyError if a circular dependency is detected
   */
  getDependencies(id: string): RosettaConcept[] {
    const concept = this.concepts.get(id);
    if (!concept) {
      throw new ConceptNotFoundError(id);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const result: RosettaConcept[] = [];

    this.resolveDependencies(id, visited, recursionStack, result);

    return result;
  }

  /**
   * Get concepts related via 'analogy' relationships that belong to the target domain.
   *
   * @param id - The source concept ID
   * @param targetDomain - The domain to filter analogy targets by
   * @returns Array of concepts in the target domain that are analogies of the source
   * @throws ConceptNotFoundError if the concept does not exist
   */
  getAnalogies(id: string, targetDomain: string): RosettaConcept[] {
    const concept = this.concepts.get(id);
    if (!concept) {
      throw new ConceptNotFoundError(id);
    }

    const analogies: RosettaConcept[] = [];
    for (const rel of concept.relationships) {
      if (rel.type === 'analogy') {
        const target = this.concepts.get(rel.targetId);
        if (target && target.domain === targetDomain) {
          analogies.push(target);
        }
      }
    }

    return analogies;
  }

  /**
   * Get all cross-reference relationships for a concept.
   *
   * @param id - The concept ID to get cross-references for
   * @returns Array of CrossReference objects
   * @throws ConceptNotFoundError if the concept does not exist
   */
  getCrossReferences(id: string): CrossReference[] {
    const concept = this.concepts.get(id);
    if (!concept) {
      throw new ConceptNotFoundError(id);
    }

    return concept.relationships
      .filter((rel) => rel.type === 'cross-reference')
      .map((rel) => ({
        fromId: id,
        toId: rel.targetId,
        description: rel.description,
      }));
  }

  /**
   * Get the PanelExpression for a specific panel on a concept.
   *
   * @param conceptId - The concept ID
   * @param panelId - The panel ID to get the expression for
   * @returns The PanelExpression, or undefined if not available
   */
  getPanelExpression(
    conceptId: string,
    panelId: PanelId,
  ): PanelExpression | undefined {
    const concept = this.concepts.get(conceptId);
    if (!concept) {
      return undefined;
    }
    return concept.panels.get(panelId);
  }

  /**
   * Get the list of panel IDs that have expressions for a concept.
   *
   * @param conceptId - The concept ID
   * @returns Array of PanelIds with available expressions
   */
  getAvailablePanels(conceptId: string): PanelId[] {
    const concept = this.concepts.get(conceptId);
    if (!concept) {
      return [];
    }
    return Array.from(concept.panels.keys());
  }

  /**
   * Find concepts by Complex Plane position within a given tolerance.
   *
   * Returns concepts whose complexPlanePosition has angle within tolerance
   * of theta AND magnitude within tolerance of radius.
   *
   * @param theta - Target angle in radians
   * @param radius - Target magnitude
   * @param tolerance - Allowed deviation for both angle and magnitude
   * @returns Array of concepts matching the position criteria
   */
  getByPosition(
    theta: number,
    radius: number,
    tolerance: number,
  ): RosettaConcept[] {
    const results: RosettaConcept[] = [];

    for (const concept of this.concepts.values()) {
      if (!concept.complexPlanePosition) {
        continue;
      }

      const pos = concept.complexPlanePosition;
      const angleDiff = Math.abs(pos.angle - theta);
      const magnitudeDiff = Math.abs(pos.magnitude - radius);

      if (angleDiff <= tolerance && magnitudeDiff <= tolerance) {
        results.push(concept);
      }
    }

    return results;
  }

  /**
   * Find the N nearest concepts to a position on the Complex Plane.
   *
   * Uses Euclidean distance on the Complex Plane (real + imaginary axes).
   * Skips concepts without a complexPlanePosition.
   *
   * @param position - The reference position
   * @param count - Maximum number of results to return
   * @returns Array of concepts sorted by distance (nearest first)
   */
  getNearestConcepts(position: ComplexPosition, count: number): RosettaConcept[] {
    const conceptsWithDistance: Array<{ concept: RosettaConcept; distance: number }> = [];

    for (const concept of this.concepts.values()) {
      if (!concept.complexPlanePosition) {
        continue;
      }

      const dx = concept.complexPlanePosition.real - position.real;
      const dy = concept.complexPlanePosition.imaginary - position.imaginary;
      const distance = Math.sqrt(dx * dx + dy * dy);

      conceptsWithDistance.push({ concept, distance });
    }

    conceptsWithDistance.sort((a, b) => a.distance - b.distance);

    return conceptsWithDistance.slice(0, count).map((item) => item.concept);
  }

  /**
   * Get all registered concepts.
   *
   * @returns Array of all concepts in the registry
   */
  getAll(): RosettaConcept[] {
    return Array.from(this.concepts.values());
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Recursively resolve dependencies, detecting cycles.
   */
  private resolveDependencies(
    id: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    result: RosettaConcept[],
  ): void {
    if (recursionStack.has(id)) {
      // Build cycle path from the recursion stack
      const cyclePath = [...recursionStack, id];
      throw new ConceptCircularDependencyError(cyclePath);
    }

    if (visited.has(id)) {
      return;
    }

    recursionStack.add(id);

    const concept = this.concepts.get(id);
    if (concept) {
      const dependencies = concept.relationships.filter(
        (rel) => rel.type === 'dependency',
      );

      for (const dep of dependencies) {
        this.resolveDependencies(dep.targetId, visited, recursionStack, result);

        // Add the dependency concept if not already in result
        const depConcept = this.concepts.get(dep.targetId);
        if (depConcept && !result.some((c) => c.id === depConcept.id)) {
          result.push(depConcept);
        }
      }
    }

    recursionStack.delete(id);
    visited.add(id);
  }
}
