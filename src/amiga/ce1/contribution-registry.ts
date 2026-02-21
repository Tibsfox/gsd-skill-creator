/**
 * CE-1 contribution registry.
 *
 * The directory of all contributors (humans, agents, skills) participating
 * in AMIGA missions. Provides registration with ContributorID validation,
 * version-tracked updates, and dependency declarations with circular
 * dependency detection.
 *
 * The registry is the "who's who" of the commons: before attribution can
 * be calculated, the system needs to know who the contributors are, what
 * they depend on, and how their registrations have evolved over time.
 *
 * Features:
 * - Registration with ContributorIDSchema validation
 * - Version history tracking (every update creates a new version snapshot)
 * - Dependency declarations with relationship types (extends, uses, derives_from)
 * - Circular dependency detection via BFS graph walk
 * - Lookup by ID, list with optional type filter
 */

import { ContributorIDSchema } from '../types.js';

// ============================================================================
// Types
// ============================================================================

/** Contributor types in the commons. */
export type ContributorType = 'human' | 'agent' | 'skill';

/** A version snapshot of a contributor's state. */
export interface ContributorVersion {
  /** Version number (starts at 1, increments on each update). */
  version: number;
  /** ISO 8601 timestamp when this version was created. */
  changed_at: string;
  /** Description of what changed in this version. */
  description: string;
  /** Snapshot of contributor name at this version. */
  name: string;
  /** Snapshot of contributor type at this version. */
  type: ContributorType;
}

/** A dependency declaration between contributors. */
export interface DependencyDeclaration {
  /** The contributor ID being depended upon. */
  depends_on: string;
  /** Relationship type. */
  relationship: 'extends' | 'uses' | 'derives_from';
  /** ISO 8601 timestamp when the dependency was declared. */
  declared_at: string;
}

/** A registered contributor in the commons. */
export interface Contributor {
  /** Contributor identifier (validates against ContributorIDSchema). */
  id: string;
  /** Display name. */
  name: string;
  /** Contributor type. */
  type: ContributorType;
  /** ISO 8601 registration timestamp. */
  registered_at: string;
  /** Dependency declarations. */
  dependencies: DependencyDeclaration[];
  /** Version history (chronological, version 1 = initial). */
  versions: ContributorVersion[];
}

/** Input for registering a new contributor. */
export interface RegisterInput {
  id: string;
  name: string;
  type: ContributorType;
}

/** Input for updating an existing contributor. */
export interface UpdateInput {
  name?: string;
  type?: ContributorType;
  description: string;
}

// ============================================================================
// ContributionRegistry
// ============================================================================

/**
 * In-memory registry of contributors with version tracking and
 * dependency management.
 */
export class ContributionRegistry {
  private readonly contributors: Map<string, Contributor>;

  constructor() {
    this.contributors = new Map();
  }

  /** Number of registered contributors. */
  count(): number {
    return this.contributors.size;
  }

  /**
   * Register a new contributor.
   *
   * Validates the contributor ID against ContributorIDSchema.
   *
   * @param input - Registration data
   * @returns The registered Contributor (deep copy)
   * @throws If ID fails validation or already registered
   */
  register(input: RegisterInput): Contributor {
    // Validate contributor ID
    ContributorIDSchema.parse(input.id);

    // Check for duplicates
    if (this.contributors.has(input.id)) {
      throw new Error(`Contributor already registered: ${input.id}`);
    }

    const now = new Date().toISOString();

    const initialVersion: ContributorVersion = {
      version: 1,
      changed_at: now,
      description: 'initial registration',
      name: input.name,
      type: input.type,
    };

    const contributor: Contributor = {
      id: input.id,
      name: input.name,
      type: input.type,
      registered_at: now,
      dependencies: [],
      versions: [initialVersion],
    };

    this.contributors.set(input.id, contributor);
    return this.deepCopy(contributor);
  }

  /**
   * Get a contributor by ID.
   *
   * @param id - Contributor ID
   * @returns The contributor record (deep copy) or undefined
   */
  get(id: string): Contributor | undefined {
    const contributor = this.contributors.get(id);
    if (!contributor) return undefined;
    return this.deepCopy(contributor);
  }

  /**
   * List all contributors with optional type filter.
   *
   * @param filter - Optional filter by contributor type
   * @returns Array of contributors (deep copies)
   */
  list(filter?: { type?: ContributorType }): readonly Contributor[] {
    let results = Array.from(this.contributors.values());
    if (filter?.type !== undefined) {
      results = results.filter((c) => c.type === filter.type);
    }
    return results.map((c) => this.deepCopy(c));
  }

  /**
   * Update an existing contributor.
   *
   * Creates a new version entry preserving the previous state.
   *
   * @param id - Contributor ID
   * @param input - Update data with change description
   * @returns The updated Contributor (deep copy)
   * @throws If contributor not found
   */
  update(id: string, input: UpdateInput): Contributor {
    const contributor = this.contributors.get(id);
    if (!contributor) {
      throw new Error(`Contributor not found: ${id}`);
    }

    const now = new Date().toISOString();
    const nextVersion = contributor.versions.length + 1;

    // Apply changes
    if (input.name !== undefined) {
      contributor.name = input.name;
    }
    if (input.type !== undefined) {
      contributor.type = input.type;
    }

    // Create version snapshot with the new state
    const version: ContributorVersion = {
      version: nextVersion,
      changed_at: now,
      description: input.description,
      name: contributor.name,
      type: contributor.type,
    };

    contributor.versions.push(version);
    return this.deepCopy(contributor);
  }

  /**
   * Declare a dependency between two contributors.
   *
   * Validates that both contributors exist, checks for self-dependency
   * and transitive circular dependencies.
   *
   * @param contributorId - Source contributor ID
   * @param dep - Dependency declaration
   * @throws If source or target not found, or if circular dependency detected
   */
  declareDependency(
    contributorId: string,
    dep: { depends_on: string; relationship: 'extends' | 'uses' | 'derives_from' },
  ): void {
    const contributor = this.contributors.get(contributorId);
    if (!contributor) {
      throw new Error(`Contributor not found: ${contributorId}`);
    }

    if (!this.contributors.has(dep.depends_on)) {
      throw new Error(`Dependency target not found: ${dep.depends_on}`);
    }

    // Self-dependency check
    if (dep.depends_on === contributorId) {
      throw new Error('Circular dependency: contributor cannot depend on itself');
    }

    // Transitive cycle detection
    const cyclePath = this.detectCycle(contributorId, dep.depends_on);
    if (cyclePath !== null) {
      throw new Error(`Circular dependency detected: ${cyclePath.join(' -> ')}`);
    }

    const declaration: DependencyDeclaration = {
      depends_on: dep.depends_on,
      relationship: dep.relationship,
      declared_at: new Date().toISOString(),
    };

    contributor.dependencies.push(declaration);
  }

  /**
   * Get the version history for a contributor.
   *
   * @param id - Contributor ID
   * @returns Version history in chronological order
   */
  getVersionHistory(id: string): readonly ContributorVersion[] {
    const contributor = this.contributors.get(id);
    if (!contributor) return [];
    return [...contributor.versions];
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Detect transitive cycles in the dependency graph.
   *
   * Walks the graph starting from `to`. At each node, follows its declared
   * dependencies. If we reach `from`, we have a cycle.
   *
   * @param from - Source contributor (the one declaring the new dependency)
   * @param to - Target contributor (the one being depended upon)
   * @returns The cycle path (for error message) or null if no cycle
   */
  private detectCycle(from: string, to: string): string[] | null {
    // BFS from `to`, looking for a path back to `from`
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [
      { id: to, path: [from, to] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const node = this.contributors.get(current.id);
      if (!node) continue;

      for (const dep of node.dependencies) {
        const newPath = [...current.path, dep.depends_on];
        if (dep.depends_on === from) {
          return newPath;
        }
        if (!visited.has(dep.depends_on)) {
          queue.push({ id: dep.depends_on, path: newPath });
        }
      }
    }

    return null;
  }

  /** Deep copy a contributor to prevent external mutation. */
  private deepCopy(contributor: Contributor): Contributor {
    return JSON.parse(JSON.stringify(contributor)) as Contributor;
  }
}
