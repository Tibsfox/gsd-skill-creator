/**
 * InheritanceValidator enforces safety constraints on skill inheritance chains.
 *
 * Validates:
 * - No circular dependencies (ACL-03)
 * - Maximum inheritance depth of 3 levels (ACL-06)
 * - Impact warnings for widely-depended-on skills
 */

import { SkillMetadata, getExtension } from '../types/skill.js';
import { DependencyGraph } from './dependency-graph.js';

/** Maximum allowed inheritance depth (number of extends hops) */
export const MAX_INHERITANCE_DEPTH = 3;

/** Result of an inheritance validation check */
export interface InheritanceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class InheritanceValidator {
  /**
   * Validate all extends relationships for circular dependencies.
   * Returns errors with the cycle path for actionable diagnostics.
   */
  validateChain(skills: Map<string, SkillMetadata>): InheritanceValidationResult {
    const graph = DependencyGraph.fromSkills(skills);
    const result = graph.detectCycles();

    if (result.hasCycle && result.cycle) {
      // Build a readable cycle path by walking the cycle
      const cyclePath = this.buildCyclePath(graph, result.cycle);
      return {
        valid: false,
        errors: [
          `Circular dependency detected: ${cyclePath}. ` +
          `Remove the cycle by editing the 'extends:' field in one of these skills.`,
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Validate that no inheritance chain exceeds MAX_INHERITANCE_DEPTH.
   * Depth = number of extends hops (chain.length - 1).
   * Depth 3 (4 skills in chain) is accepted. Depth 4+ is rejected.
   */
  validateDepth(skills: Map<string, SkillMetadata>): InheritanceValidationResult {
    const graph = DependencyGraph.fromSkills(skills);
    const errors: string[] = [];

    for (const [name, metadata] of skills) {
      const ext = getExtension(metadata);
      if (!ext.extends) continue;

      const depth = graph.getDepth(name);
      if (depth > MAX_INHERITANCE_DEPTH) {
        const chain = graph.getInheritanceChain(name);
        errors.push(
          `Inheritance chain too deep (${depth} levels): ${chain.join(' -> ')}. ` +
          `Maximum is ${MAX_INHERITANCE_DEPTH} levels.`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Check if extending targetSkill would affect many dependents.
   * Warns when a skill has 2+ direct dependents.
   */
  checkImpactWarnings(
    skills: Map<string, SkillMetadata>,
    targetSkill: string,
  ): InheritanceValidationResult {
    const graph = DependencyGraph.fromSkills(skills);
    const dependents = graph.getDependents(targetSkill);
    const warnings: string[] = [];

    if (dependents.length >= 2) {
      warnings.push(
        `Caution: '${targetSkill}' is extended by ${dependents.length} other skills. ` +
        `Changes may have wide impact.`,
      );
    }

    return { valid: true, errors: [], warnings };
  }

  /**
   * Run both validateChain and validateDepth together.
   * Returns early with cycle errors (depth check is meaningless if cycles exist).
   */
  validate(skills: Map<string, SkillMetadata>): InheritanceValidationResult {
    const chainResult = this.validateChain(skills);
    if (!chainResult.valid) {
      return chainResult;
    }

    const depthResult = this.validateDepth(skills);
    return {
      valid: depthResult.valid,
      errors: [...chainResult.errors, ...depthResult.errors],
      warnings: [...chainResult.warnings, ...depthResult.warnings],
    };
  }

  /**
   * Build a readable cycle path from cycle nodes.
   * Walks the extends relationships to show the actual cycle.
   */
  private buildCyclePath(graph: DependencyGraph, cycleNodes: string[]): string {
    if (cycleNodes.length === 0) return '';

    // Start from the first cycle node and follow the chain
    const path: string[] = [];
    const start = cycleNodes[0];
    let current: string | undefined = start;
    const visited = new Set<string>();

    do {
      path.push(current);
      visited.add(current);
      current = graph.getParent(current);
    } while (current && !visited.has(current));

    // Close the cycle by adding the start node again
    if (current) {
      path.push(current);
    }

    return path.join(' -> ');
  }
}
