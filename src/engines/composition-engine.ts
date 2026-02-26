// === Composition Engine ===
//
// Discovers valid composition chains (sequential, parallel, nested) from a set
// of available mathematical primitives, respecting type compatibility and
// dependency ordering via an injected DependencyGraphPort interface.

import type {
  MathematicalPrimitive,
  CompositionRule,
  CompositionPath,
  CompositionStep,
  CompositionType,
  DomainId,
} from '../types/mfe-types.js';

// === Dependency Graph Port ===
// Interface for dependency graph queries. Phase 339 provides the real
// implementation; tests use a mock.

export interface DependencyGraphPort {
  /** Check if there is a path from `from` to `to` in the dependency graph. */
  hasPath(from: string, to: string): boolean;

  /** Return primitive IDs sorted in topological (dependency) order. */
  getTopologicalOrder(primitiveIds: string[]): string[];

  /** Return the cost of traversing from `from` to `to`. */
  getPathCost(from: string, to: string): number;
}

// === Result Types ===

export interface CompositionError {
  code:
    | 'NO_RULES'
    | 'TYPE_MISMATCH'
    | 'MISSING_DEPENDENCY'
    | 'INSUFFICIENT_PRIMITIVES'
    | 'CYCLE_DETECTED';
  message: string;
  primitiveIds?: string[];
}

export type CompositionResult =
  | { success: true; path: CompositionPath }
  | { success: false; errors: CompositionError[] };

// === Internal Types ===

interface ResolvedRule {
  sourcePrimitiveId: string;
  targetPrimitiveId: string;
  rule: CompositionRule;
}

// === Composition Engine ===

export class CompositionEngine {
  private readonly primitives: Map<string, MathematicalPrimitive>;
  private readonly graphPort: DependencyGraphPort;

  constructor(
    primitives: Map<string, MathematicalPrimitive>,
    graphPort: DependencyGraphPort,
  ) {
    this.primitives = primitives;
    this.graphPort = graphPort;
  }

  /**
   * Find valid composition chains from available primitives toward a target.
   *
   * @param availablePrimitiveIds - IDs of primitives available for composition
   * @param targetDescription - Natural language description of desired result
   * @returns CompositionResult with either a successful path or errors
   */
  compose(
    availablePrimitiveIds: string[],
    targetDescription: string,
  ): CompositionResult {
    // Validate minimum primitives
    if (availablePrimitiveIds.length < 2) {
      return {
        success: false,
        errors: [
          {
            code: 'INSUFFICIENT_PRIMITIVES',
            message:
              'At least 2 primitives required for composition',
            primitiveIds: availablePrimitiveIds,
          },
        ],
      };
    }

    const availableSet = new Set(availablePrimitiveIds);

    // Check dependency satisfaction
    const depErrors = this.checkDependencies(availablePrimitiveIds, availableSet);
    if (depErrors.length > 0) {
      return { success: false, errors: depErrors };
    }

    // Collect all valid composition rules
    const resolvedRules = this.collectRules(availablePrimitiveIds, availableSet);

    if (resolvedRules.length === 0) {
      return {
        success: false,
        errors: [
          {
            code: 'NO_RULES',
            message:
              'No valid composition rules found among available primitives',
            primitiveIds: availablePrimitiveIds,
          },
        ],
      };
    }

    // Get topological order for dependency-respecting chain building
    const topoOrder = this.graphPort.getTopologicalOrder(availablePrimitiveIds);

    // Build the best composition chain
    const path = this.buildChain(resolvedRules, topoOrder, availableSet);

    return { success: true, path };
  }

  /**
   * Verify that all required dependencies are present in the available set.
   */
  private checkDependencies(
    primitiveIds: string[],
    availableSet: Set<string>,
  ): CompositionError[] {
    const errors: CompositionError[] = [];

    for (const id of primitiveIds) {
      const prim = this.primitives.get(id);
      if (!prim) continue;

      for (const dep of prim.dependencies) {
        if (
          dep.type === 'requires' &&
          dep.strength >= 0.9 &&
          !availableSet.has(dep.target)
        ) {
          errors.push({
            code: 'MISSING_DEPENDENCY',
            message: `Primitive "${id}" requires "${dep.target}" but it is not in the available set: ${dep.description}`,
            primitiveIds: [id, dep.target],
          });
        }
      }
    }

    return errors;
  }

  /**
   * Collect all composition rules where both source and target are available.
   */
  private collectRules(
    primitiveIds: string[],
    availableSet: Set<string>,
  ): ResolvedRule[] {
    const rules: ResolvedRule[] = [];

    for (const id of primitiveIds) {
      const prim = this.primitives.get(id);
      if (!prim) continue;

      for (const rule of prim.compositionRules) {
        if (availableSet.has(rule.with)) {
          rules.push({
            sourcePrimitiveId: id,
            targetPrimitiveId: rule.with,
            rule,
          });
        }
      }
    }

    return rules;
  }

  /**
   * Build the best composition chain from resolved rules respecting
   * topological order.
   */
  private buildChain(
    resolvedRules: ResolvedRule[],
    topoOrder: string[],
    availableSet: Set<string>,
  ): CompositionPath {
    // Determine which primitives participate in any rule
    const participatingIds = new Set<string>();
    for (const rr of resolvedRules) {
      participatingIds.add(rr.sourcePrimitiveId);
      participatingIds.add(rr.targetPrimitiveId);
    }

    // Filter topo order to only participating primitives
    const orderedParticipants = topoOrder.filter((id) =>
      participatingIds.has(id),
    );

    // Build chains by following rules in topological order
    const chains = this.discoverChains(resolvedRules, orderedParticipants);

    // Pick the best chain (longest valid chain, lowest cost)
    const bestChain =
      chains.length > 0 ? this.selectBestChain(chains) : chains[0];

    // Convert chain to CompositionPath
    return this.chainToPath(bestChain || resolvedRules, orderedParticipants);
  }

  /**
   * Discover composition chains by following rules in topological order.
   */
  private discoverChains(
    rules: ResolvedRule[],
    orderedIds: string[],
  ): ResolvedRule[][] {
    // Build adjacency: source -> rules starting from source
    const adjacency = new Map<string, ResolvedRule[]>();
    for (const rule of rules) {
      const existing = adjacency.get(rule.sourcePrimitiveId) || [];
      existing.push(rule);
      adjacency.set(rule.sourcePrimitiveId, existing);
    }

    const chains: ResolvedRule[][] = [];

    // Try building chains starting from each primitive in topo order
    for (const startId of orderedIds) {
      const startRules = adjacency.get(startId);
      if (!startRules) continue;

      for (const startRule of startRules) {
        const chain: ResolvedRule[] = [startRule];
        const visited = new Set<string>([
          startRule.sourcePrimitiveId,
          startRule.targetPrimitiveId,
        ]);

        // Try extending the chain
        let current = startRule.targetPrimitiveId;
        let extended = true;
        while (extended) {
          extended = false;
          const nextRules = adjacency.get(current);
          if (nextRules) {
            for (const next of nextRules) {
              if (!visited.has(next.targetPrimitiveId)) {
                chain.push(next);
                visited.add(next.targetPrimitiveId);
                current = next.targetPrimitiveId;
                extended = true;
                break;
              }
            }
          }
        }

        chains.push(chain);
      }
    }

    return chains;
  }

  /**
   * Select the best chain based on length and cost.
   */
  private selectBestChain(chains: ResolvedRule[][]): ResolvedRule[] {
    return chains.reduce((best, current) => {
      if (current.length > best.length) return current;
      if (current.length === best.length) {
        const currentCost = this.calculateChainCost(current);
        const bestCost = this.calculateChainCost(best);
        return currentCost < bestCost ? current : best;
      }
      return best;
    });
  }

  /**
   * Calculate the total cost of a chain.
   */
  private calculateChainCost(chain: ResolvedRule[]): number {
    let cost = 0;
    for (const rr of chain) {
      cost += this.graphPort.getPathCost(
        rr.sourcePrimitiveId,
        rr.targetPrimitiveId,
      );
    }
    return cost;
  }

  /**
   * Convert a chain of resolved rules to a CompositionPath.
   */
  private chainToPath(
    chain: ResolvedRule[],
    orderedIds: string[],
  ): CompositionPath {
    const steps: CompositionStep[] = [];
    const domains = new Set<DomainId>();
    let totalCost = 0;
    let stepNumber = 1;

    // Track all primitives involved
    const involvedPrimitives = new Set<string>();
    for (const rr of chain) {
      involvedPrimitives.add(rr.sourcePrimitiveId);
      involvedPrimitives.add(rr.targetPrimitiveId);
    }

    // Build steps in topological order
    const processedPrimitives = new Set<string>();

    for (const rr of chain) {
      const sourcePrim = this.primitives.get(rr.sourcePrimitiveId);
      const targetPrim = this.primitives.get(rr.targetPrimitiveId);

      if (!sourcePrim || !targetPrim) continue;

      // Add source step if not yet processed (establishment step)
      if (!processedPrimitives.has(rr.sourcePrimitiveId)) {
        domains.add(sourcePrim.domain);
        steps.push({
          stepNumber: stepNumber++,
          primitive: rr.sourcePrimitiveId,
          action: `Establish ${sourcePrim.name}`,
          justification: `By ${sourcePrim.name} (${sourcePrim.id}): ${sourcePrim.formalStatement}`,
          inputType: sourcePrim.prerequisites.join(', ') || 'none',
          outputType: sourcePrim.computationalForm,
          verificationStatus: 'skipped',
        });
        processedPrimitives.add(rr.sourcePrimitiveId);
      }

      // Add composition step for target
      domains.add(targetPrim.domain);
      const actionVerb = this.getActionVerb(rr.rule.type);
      steps.push({
        stepNumber: stepNumber++,
        primitive: rr.targetPrimitiveId,
        action: `${actionVerb} ${targetPrim.name}`,
        justification: `By ${targetPrim.name} (${targetPrim.id}): ${targetPrim.formalStatement}`,
        inputType: sourcePrim.computationalForm,
        outputType: rr.rule.yields,
        verificationStatus: 'skipped',
      });
      processedPrimitives.add(rr.targetPrimitiveId);

      // Accumulate cost
      totalCost += this.graphPort.getPathCost(
        rr.sourcePrimitiveId,
        rr.targetPrimitiveId,
      );
    }

    return {
      steps,
      totalCost,
      domainsSpanned: Array.from(domains),
      verified: false,
    };
  }

  /**
   * Get the action verb for a composition type.
   */
  private getActionVerb(type: CompositionType): string {
    switch (type) {
      case 'sequential':
        return 'Compose with';
      case 'parallel':
        return 'Combine in parallel with';
      case 'nested':
        return 'Nest into';
    }
  }
}
