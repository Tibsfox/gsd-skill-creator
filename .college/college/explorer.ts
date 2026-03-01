/**
 * DepartmentExplorer -- path-based navigation of the College hierarchy.
 *
 * Provides an explorable-code experience where developers navigate paths
 * like `mathematics/algebra/ratios` to get concepts with full pedagogical
 * context and links to related concepts.
 *
 * @module college/explorer
 */

import type { CollegeLoader } from './college-loader.js';
import type { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { RosettaConcept, DepartmentWing } from '../rosetta-core/types.js';
import type { ExplorationResult } from './types.js';

// ─── Error Classes ───────────────────────────────────────────────────────────

export class ExplorationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExplorationError';
  }
}

// ─── DepartmentExplorer ──────────────────────────────────────────────────────

export class DepartmentExplorer {
  private loader: CollegeLoader;
  private registry: ConceptRegistry;

  constructor(loader: CollegeLoader, registry: ConceptRegistry) {
    this.loader = loader;
    this.registry = registry;
  }

  /**
   * Explore a path in the department/wing/concept hierarchy.
   *
   * Path format: `{departmentId}/{wingId}/{conceptId}`
   * - `mathematics` -> loads summary, returns entry point concept
   * - `mathematics/algebra` -> loads algebra wing, returns first concept
   * - `mathematics/algebra/ratios` -> returns specific concept from algebra wing
   *
   * @param path - The exploration path
   * @returns ExplorationResult with concept, wing, pedagogical context, and related paths
   * @throws ExplorationError for invalid or unresolvable paths
   */
  async explore(path: string): Promise<ExplorationResult> {
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0 || segments.length > 3) {
      throw new ExplorationError(
        `Invalid path '${path}'. Use format: departmentId/wingId/conceptId`,
      );
    }

    const [departmentId, wingId, conceptId] = segments;

    // Verify department exists
    const departments = this.loader.listDepartments();
    if (!departments.includes(departmentId)) {
      throw new ExplorationError(
        `Department '${departmentId}' not found. Available departments: ${departments.join(', ')}`,
      );
    }

    // Get pedagogical context from DEPARTMENT.md
    let pedagogicalContext = '';
    try {
      const deptContent = this.loader.getDepartmentContent(departmentId);
      pedagogicalContext = this.extractPedagogicalContext(deptContent);
    } catch {
      pedagogicalContext = '';
    }

    // Department-only path: return entry point concept
    if (!wingId) {
      const summary = await this.loader.loadSummary(departmentId);
      const concept = this.registry.get(summary.entryPoint);
      if (!concept) {
        throw new ExplorationError(
          `Entry point concept '${summary.entryPoint}' not found in registry for department '${departmentId}'`,
        );
      }

      // Find which wing contains the entry point
      const wing = await this.findWingForConcept(departmentId, concept.id);

      return {
        path,
        concept,
        wing,
        departmentId,
        pedagogicalContext,
        relatedPaths: this.buildRelatedPaths(concept),
      };
    }

    // Load the wing
    let wingContent;
    try {
      wingContent = await this.loader.loadWing(departmentId, wingId);
    } catch {
      throw new ExplorationError(
        `Wing '${wingId}' not found in department '${departmentId}'`,
      );
    }

    // Wing-only path: return first concept in the wing
    if (!conceptId) {
      const firstConcept = wingContent.concepts[0];
      if (!firstConcept) {
        throw new ExplorationError(
          `Wing '${wingId}' in department '${departmentId}' has no concepts`,
        );
      }

      // Prefer registry version if available (has full data)
      const registryConcept = this.registry.get(firstConcept.id) || firstConcept;

      return {
        path,
        concept: registryConcept,
        wing: wingContent.wing,
        departmentId,
        pedagogicalContext,
        relatedPaths: this.buildRelatedPaths(registryConcept),
      };
    }

    // Full path: find specific concept
    const fileConcept = wingContent.concepts.find((c) => c.id === conceptId);
    if (!fileConcept) {
      // Also check registry
      const regConcept = this.registry.get(conceptId);
      if (!regConcept) {
        throw new ExplorationError(
          `Concept '${conceptId}' not found in wing '${wingId}' of department '${departmentId}'`,
        );
      }
      return {
        path,
        concept: regConcept,
        wing: wingContent.wing,
        departmentId,
        pedagogicalContext,
        relatedPaths: this.buildRelatedPaths(regConcept),
      };
    }

    // Prefer registry version for full relationship data
    const concept = this.registry.get(fileConcept.id) || fileConcept;

    return {
      path,
      concept,
      wing: wingContent.wing,
      departmentId,
      pedagogicalContext,
      relatedPaths: this.buildRelatedPaths(concept),
    };
  }

  /**
   * List all explorable paths for a department.
   *
   * Returns paths in hierarchy order: dept/wing/concept for each
   * wing and concept in the department.
   *
   * @param departmentId - The department to list paths for
   * @returns Array of explorable path strings
   */
  async listExplorablePaths(departmentId: string): Promise<string[]> {
    const summary = await this.loader.loadSummary(departmentId);
    const paths: string[] = [];

    for (const wing of summary.wings) {
      try {
        const wingContent = await this.loader.loadWing(departmentId, wing.id);
        for (const concept of wingContent.concepts) {
          paths.push(`${departmentId}/${wing.id}/${concept.id}`);
        }
      } catch {
        // Skip wings that fail to load
      }
    }

    return paths;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Extract pedagogical context from DEPARTMENT.md content.
   * Returns the descriptive text between the title and the first ## section.
   */
  private extractPedagogicalContext(content: string): string {
    const lines = content.split('\n');
    const contextLines: string[] = [];
    let pastTitle = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ') && !pastTitle) {
        pastTitle = true;
        continue;
      }
      if (pastTitle) {
        if (trimmed.startsWith('## ')) break;
        if (trimmed.startsWith('**Domain:**') || trimmed.startsWith('**Source:**') || trimmed.startsWith('**Status:**') || trimmed.startsWith('**Purpose:**')) {
          // Include Purpose in pedagogical context
          if (trimmed.startsWith('**Purpose:**')) {
            contextLines.push(trimmed.replace('**Purpose:**', '').trim());
          }
          continue;
        }
        if (trimmed) contextLines.push(trimmed);
      }
    }

    return contextLines.join(' ');
  }

  /**
   * Build navigable related paths from a concept's relationships.
   */
  private buildRelatedPaths(concept: RosettaConcept): string[] {
    const paths: string[] = [];

    for (const rel of concept.relationships) {
      const target = this.registry.get(rel.targetId);
      if (target) {
        // Build path from target's domain and ID
        paths.push(`${target.domain}/${rel.targetId}`);
      } else {
        // Even if not in registry, suggest the path
        paths.push(rel.targetId);
      }
    }

    return paths;
  }

  /**
   * Find which wing contains a specific concept.
   */
  private async findWingForConcept(
    departmentId: string,
    conceptId: string,
  ): Promise<DepartmentWing> {
    const summary = await this.loader.loadSummary(departmentId);

    for (const wing of summary.wings) {
      try {
        const wingContent = await this.loader.loadWing(departmentId, wing.id);
        if (wingContent.concepts.some((c) => c.id === conceptId)) {
          return wingContent.wing;
        }
      } catch {
        continue;
      }
    }

    // If not found in any wing, return a placeholder
    return {
      id: 'unknown',
      name: 'Unknown Wing',
      description: '',
      concepts: [conceptId],
    };
  }
}
