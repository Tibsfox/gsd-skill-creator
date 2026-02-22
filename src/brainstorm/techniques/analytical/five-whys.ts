/**
 * Five Whys analytical brainstorming technique.
 *
 * Root cause analysis through iterative "Why?" questioning.
 * Start with a problem statement. Ask "Why?" Get an answer.
 * Ask "Why?" again. Repeat 5 times to reach root cause.
 *
 * Output is Question[] (not Idea[]) with depth (0-5) and parent_id
 * forming causal chains. Multiple parallel chains explore different
 * branches of causation.
 *
 * Only imports: ../../shared/types.js, ../../shared/constants.js, node:crypto.
 */

import { randomUUID } from 'node:crypto';

import type {
  Question,
  SessionState,
  TechniqueConfig,
  TechniqueId,
} from '../../shared/types.js';

import { TECHNIQUE_DEFAULTS } from '../../shared/constants.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Output from a technique round.
 */
export interface TechniqueOutput {
  questions?: Question[];
  prompts?: string[];
  metadata: {
    round: number;
    technique: TechniqueId;
    duration_ms: number;
  };
}

/**
 * Instance contract for a running technique.
 */
export interface TechniqueInstance {
  id: TechniqueId;
  config: TechniqueConfig;
  initialize(problem: string, session: SessionState): void;
  generateRound(round_number: number): TechniqueOutput;
  getState(): Record<string, unknown>;
  isComplete(): boolean;
}

// ============================================================================
// Five Whys Technique
// ============================================================================

/**
 * Five Whys technique implementation.
 *
 * Maintains multiple parallel causal chains. Each chain starts with
 * a seed question (depth 0, the problem statement) and progresses
 * through depths 1-5. Each subsequent question causally references
 * its parent via parent_id.
 *
 * Depth 1-4 questions have category 'why'.
 * Depth 5 questions have category 'root-cause'.
 *
 * The technique is complete when all chains have reached depth 5.
 */
export class FiveWhysTechnique implements TechniqueInstance {
  readonly id: TechniqueId = 'five-whys';
  readonly config: TechniqueConfig;

  // Internal state
  private chains: Map<number, Question[]> = new Map();
  private current_chain = 0;
  private completed_chains = 0;
  private problem = '';
  private start_time = 0;
  private total_elapsed_ms = 0;
  private max_depth = 5;
  private chain_count = 3;

  constructor() {
    const defaults = TECHNIQUE_DEFAULTS['five-whys'];

    const generation_context =
      'You are at depth ${depth} of a Five Whys causal chain. ' +
      'The previous Why was: "${previous_why_content}". ' +
      'Ask WHY that is true. Each question must CAUSALLY reference the previous question — ' +
      'it should be answerable as "because..." of the previous why. ' +
      'This is root cause analysis, not brainstorming. ' +
      'Depth 1 = symptoms. Depth 5 = root causes.';

    this.config = {
      id: 'five-whys',
      name: 'Five Whys',
      category: 'analytical',
      description:
        'Root cause analysis through iterative "Why?" questioning. Each level peels back ' +
        'a layer of causation from surface symptoms (depth 1) to root causes (depth 5).',
      default_duration_ms: 600_000,
      min_duration_ms: 180_000,
      max_duration_ms: 1_200_000,
      required_agents: defaults.agents,
      optional_agents: ['analyst'],
      valid_phases: ['explore', 'diverge'],
      osborn_rules: ['quantity'],
      parameters: {
        max_depth: 5,
        chains: 3,
        generation_context,
      },
    };
  }

  /**
   * Initialize with problem context and session state.
   *
   * Creates initial "Why 0" seed question for each chain. The seed
   * question content is the problem statement itself.
   */
  initialize(problem: string, _session: SessionState): void {
    this.problem = problem;
    this.start_time = Date.now();
    this.current_chain = 0;
    this.completed_chains = 0;
    this.chains = new Map();
    this.total_elapsed_ms = 0;
    this.max_depth = (this.config.parameters.max_depth as number) ?? 5;
    this.chain_count = (this.config.parameters.chains as number) ?? 3;

    // Create seed questions (depth 0) for each chain
    for (let chain_idx = 0; chain_idx < this.chain_count; chain_idx++) {
      const seed: Question = {
        id: randomUUID(),
        content: problem,
        category: 'why',
        source_technique: 'five-whys',
        depth: 0,
        timestamp: Date.now(),
      };
      this.chains.set(chain_idx, [seed]);
    }
  }

  /**
   * Generate the next question in the current active chain.
   *
   * For the current chain, finds the deepest question and generates
   * a new question that causally follows from it. The new question's
   * parent_id is set to the previous question's id.
   *
   * Depth 1-4: category 'why'
   * Depth 5: category 'root-cause'
   *
   * After a chain reaches max_depth, advances to the next chain.
   */
  generateRound(round_number: number): TechniqueOutput {
    const round_start = Date.now();
    const questions: Question[] = [];

    // Find the active chain (skip completed chains)
    while (this.current_chain < this.chain_count) {
      const chain = this.chains.get(this.current_chain);
      if (!chain) break;

      const deepest = chain[chain.length - 1];
      if (!deepest) break;

      const current_depth = deepest.depth ?? 0;

      // If this chain has reached max_depth, mark complete and advance
      if (current_depth >= this.max_depth) {
        this.completed_chains++;
        this.current_chain++;
        continue;
      }

      // Generate next why question in this chain
      const new_depth = current_depth + 1;
      const is_root_cause = new_depth >= this.max_depth;

      // Build resolved generation context
      const resolved_context = (this.config.parameters.generation_context as string)
        .replace(/\$\{depth\}/g, String(new_depth))
        .replace(/\$\{previous_why_content\}/g, deepest.content);

      const question: Question = {
        id: randomUUID(),
        content: `[Chain ${this.current_chain + 1}, Depth ${new_depth}] Why: ${deepest.content}?`,
        category: is_root_cause ? 'root-cause' : 'why',
        source_technique: 'five-whys',
        depth: new_depth,
        parent_id: deepest.id,
        timestamp: Date.now(),
      };

      chain.push(question);
      questions.push(question);

      // Check if chain is now complete after adding this question
      if (new_depth >= this.max_depth) {
        this.completed_chains++;
        this.current_chain++;
      }

      // Generate one question per round (one chain step)
      break;
    }

    this.total_elapsed_ms = Date.now() - this.start_time;

    // Build prompt for the current state
    const prompts: string[] = [];
    if (questions.length > 0) {
      const q = questions[0];
      prompts.push(
        (this.config.parameters.generation_context as string)
          .replace(/\$\{depth\}/g, String(q.depth ?? 0))
          .replace(/\$\{previous_why_content\}/g, q.content),
      );
    }

    return {
      questions,
      prompts,
      metadata: {
        round: round_number,
        technique: 'five-whys',
        duration_ms: Date.now() - round_start,
      },
    };
  }

  /**
   * Return current technique state.
   */
  getState(): Record<string, unknown> {
    const chain_depths: Record<string, number> = {};
    let total_questions = 0;

    for (const [chain_idx, chain] of this.chains.entries()) {
      const deepest = chain[chain.length - 1];
      chain_depths[`chain_${chain_idx}`] = deepest?.depth ?? 0;
      // Count questions excluding seeds (depth 0)
      total_questions += chain.filter(q => (q.depth ?? 0) > 0).length;
    }

    return {
      current_chain: this.current_chain,
      completed_chains: this.completed_chains,
      total_chains: this.chain_count,
      max_depth: this.max_depth,
      chain_depths,
      total_questions,
    };
  }

  /**
   * Check if the technique has naturally completed.
   *
   * Complete when all chains have reached depth 5 (max_depth).
   */
  isComplete(): boolean {
    return this.completed_chains >= this.chain_count;
  }
}

/**
 * Factory function for creating a Five Whys technique instance.
 */
export function createFiveWhysTechnique(): TechniqueInstance {
  return new FiveWhysTechnique();
}
