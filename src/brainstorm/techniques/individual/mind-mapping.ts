/**
 * Mind Mapping technique implementation.
 *
 * Mechanic: Radial expansion from central topic. Each idea is a branch
 * or sub-branch. Ideas at any depth. Connections between branches are
 * themselves ideas. Non-linear -- jump to wherever energy is highest.
 *
 * Completion: elapsed_ms >= default_duration_ms OR max_branch_depth fully populated.
 *
 * Output: Idea[] with parent_id chains forming a tree structure,
 * plus VisualizationData for the map.
 *
 * Only imports from ../../shared/types.js. No imports from den/, vtm/, knowledge/.
 */

import { randomUUID } from 'node:crypto';
import type {
  TechniqueId,
  TechniqueConfig,
  SessionState,
  Idea,
  Question,
} from '../../shared/types.js';
import type { TechniqueInstance, TechniqueOutput, VisualizationData } from '../engine.js';

// ============================================================================
// Configuration
// ============================================================================

const MIND_MAPPING_CONFIG: TechniqueConfig = {
  id: 'mind-mapping',
  name: 'Mind Mapping',
  category: 'individual',
  description: 'Radial expansion from central topic. Each idea is a branch or sub-branch, forming a tree structure that reveals connections and relationships.',
  default_duration_ms: 900_000,
  min_duration_ms: 300_000,
  max_duration_ms: 2_700_000,
  required_agents: ['mapper'],
  optional_agents: ['ideator', 'scribe'],
  valid_phases: ['diverge', 'organize'],
  osborn_rules: ['quantity', 'wild-ideas', 'build-combine'],
  parameters: {
    max_branch_depth: 3,
    branches_per_node: [3, 5],
    generation_context: 'Radial expansion from central topic. Each idea is a branch or sub-branch. Ideas at any depth. Connections between branches are themselves ideas. Non-linear -- jump to wherever energy is highest.',
  },
};

// ============================================================================
// Internal types
// ============================================================================

interface MindMapNode {
  id: string;
  content: string;
  parent_id: string | undefined;
  depth: number;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Mind Mapping technique instance.
 *
 * Tracks a tree of nodes starting from a root (the problem statement).
 * Each round generates branches or sub-branches at increasing depth levels.
 * Visualization data is produced with every round.
 */
class MindMappingTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'mind-mapping';
  readonly config: TechniqueConfig = MIND_MAPPING_CONFIG;

  private problem: string = '';
  private start_time: number = 0;
  private round_number: number = 0;
  private root_node_id: string = '';
  private nodes: Map<string, MindMapNode> = new Map();
  private current_depth: number = 0;

  /**
   * Initialize with problem context and session state.
   * Creates the root node from the problem statement.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.start_time = Date.now();
    this.round_number = 0;
    this.current_depth = 0;
    this.nodes = new Map();

    // Create root node from problem statement
    this.root_node_id = randomUUID();
    this.nodes.set(this.root_node_id, {
      id: this.root_node_id,
      content: problem,
      parent_id: undefined,
      depth: 0,
    });
  }

  /**
   * Generate a round of mind mapping branches.
   *
   * Round 1: Generates 3-5 top-level branches (parent_id = root).
   * Subsequent rounds: Generate sub-branches off existing nodes at next depth level.
   * Returns Idea[] with parent_id set correctly and VisualizationData for the tree.
   */
  generateRound(round_number: number, _previous_output?: Idea[] | Question[]): TechniqueOutput {
    const round_start = Date.now();
    this.round_number = round_number;

    const branches_range = this.config.parameters.branches_per_node as number[];
    const min_branches = branches_range[0];
    const max_branches = branches_range[1];
    const max_depth = this.config.parameters.max_branch_depth as number;

    const ideas: Idea[] = [];

    if (round_number === 1) {
      // First round: generate top-level branches from root
      const branch_count = min_branches + (round_number % (max_branches - min_branches + 1));
      for (let i = 0; i < branch_count; i++) {
        const node_id = randomUUID();
        const node: MindMapNode = {
          id: node_id,
          content: `[Branch ${i + 1}] Aspect of: ${this.problem}`,
          parent_id: this.root_node_id,
          depth: 1,
        };
        this.nodes.set(node_id, node);

        ideas.push({
          id: node_id,
          content: node.content,
          source_agent: 'mapper',
          source_technique: 'mind-mapping',
          phase: 'diverge',
          parent_id: this.root_node_id,
          tags: [],
          timestamp: Date.now(),
        });
      }
      this.current_depth = 1;
    } else {
      // Subsequent rounds: generate sub-branches at next depth
      const target_depth = Math.min(round_number, max_depth);
      const parent_nodes = Array.from(this.nodes.values()).filter(
        n => n.depth === target_depth - 1
      );

      for (const parent of parent_nodes) {
        // Generate 2-3 sub-branches per parent (slightly fewer at deeper levels)
        const sub_count = Math.max(2, min_branches - (target_depth - 1));
        for (let i = 0; i < sub_count; i++) {
          const node_id = randomUUID();
          const node: MindMapNode = {
            id: node_id,
            content: `[Depth ${target_depth}, Sub ${i + 1}] Elaboration of: ${parent.content}`,
            parent_id: parent.id,
            depth: target_depth,
          };
          this.nodes.set(node_id, node);

          ideas.push({
            id: node_id,
            content: node.content,
            source_agent: 'mapper',
            source_technique: 'mind-mapping',
            phase: 'diverge',
            parent_id: parent.id,
            tags: [],
            timestamp: Date.now(),
          });
        }
      }
      this.current_depth = target_depth;
    }

    // Build visualization data from all nodes
    const visualization: VisualizationData = {
      type: 'tree',
      nodes: Array.from(this.nodes.values()).map(n => ({
        id: n.id,
        label: n.content,
        parent_id: n.parent_id,
      })),
    };

    const round_duration = Date.now() - round_start;

    return {
      ideas,
      visualization,
      metadata: {
        round: round_number,
        technique: 'mind-mapping',
        duration_ms: round_duration,
      },
    };
  }

  /**
   * Return technique-specific internal state.
   */
  getState(): Record<string, unknown> {
    return {
      idea_count: this.nodes.size - 1, // Exclude root node
      elapsed_ms: this.start_time > 0 ? Date.now() - this.start_time : 0,
      round_number: this.round_number,
      root_node_id: this.root_node_id,
      current_depth: this.current_depth,
      total_nodes: this.nodes.size,
    };
  }

  /**
   * Check if mind mapping is complete.
   *
   * Complete when elapsed_ms >= default_duration_ms
   * OR max_branch_depth is fully populated.
   */
  isComplete(): boolean {
    if (this.start_time === 0) return false;

    const elapsed_ms = Date.now() - this.start_time;
    const max_depth = this.config.parameters.max_branch_depth as number;

    // Time-based completion
    if (elapsed_ms >= this.config.default_duration_ms) return true;

    // Depth-based completion: all depth levels up to max have nodes
    if (this.current_depth >= max_depth) {
      const has_nodes_at_max = Array.from(this.nodes.values()).some(n => n.depth === max_depth);
      if (has_nodes_at_max) return true;
    }

    return false;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new MindMappingTechnique instance.
 * Registered with the TechniqueEngine in its constructor.
 */
export function createMindMappingTechnique(): TechniqueInstance {
  return new MindMappingTechnique();
}

export { MindMappingTechnique };
