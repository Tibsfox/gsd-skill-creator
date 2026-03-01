/**
 * Token Budget Adapter -- enforces 2-5% context window ceilings on
 * CollegeLoader progressive disclosure tiers.
 *
 * The CollegeLoader already enforces absolute per-tier limits (3K/12K/50K),
 * but this adapter adds a relative ceiling: no single load operation should
 * consume more than 2% (summary), 3% (active), or 5% (deep) of the total
 * context window. Content that exceeds the budget is truncated gracefully.
 *
 * @module integration/token-budget-adapter
 */

import { countTokens, truncateToTokenBudget } from '../college/token-counter.js';
import type { DepartmentSummary, WingContent, DeepReference } from '../college/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Context window configuration for budget enforcement.
 */
export interface ContextWindowConfig {
  /** Total context window size in tokens (default: 200000) */
  totalTokens: number;
  /** Maximum percentage for summary tier (default: 2) */
  summaryCeilingPercent: number;
  /** Maximum percentage for active tier (default: 3) */
  activeCeilingPercent: number;
  /** Maximum percentage for deep tier (default: 5) */
  deepCeilingPercent: number;
}

/**
 * Result of a budget-enforced load operation.
 */
export interface BudgetEnforcementResult<T> {
  /** The original or truncated result */
  data: T;
  /** Actual token cost after enforcement */
  tokenCost: number;
  /** The ceiling that was enforced */
  budgetLimit: number;
  /** Whether content was truncated to fit */
  truncated: boolean;
  /** The percentage ceiling used */
  ceilingPercent: number;
}

/**
 * Minimal CollegeLoader interface -- only the methods the adapter wraps.
 * Keeps .college/integration/ decoupled from the full CollegeLoader.
 */
interface CollegeLoaderLike {
  loadSummary(departmentId: string): Promise<DepartmentSummary>;
  loadWing(departmentId: string, wingId: string): Promise<WingContent>;
  loadDeep(departmentId: string, topic: string): Promise<DeepReference>;
}

const DEFAULT_CONFIG: ContextWindowConfig = {
  totalTokens: 200_000,
  summaryCeilingPercent: 2,
  activeCeilingPercent: 3,
  deepCeilingPercent: 5,
};

// ─── TokenBudgetAdapter ──────────────────────────────────────────────────────

export class TokenBudgetAdapter {
  private readonly loader: CollegeLoaderLike;
  private readonly config: ContextWindowConfig;
  private cumulativeTokens = 0;

  constructor(loader: CollegeLoaderLike, config?: Partial<ContextWindowConfig>) {
    this.loader = loader;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the absolute token ceilings computed from percentages.
   */
  getCeilings(): { summary: number; active: number; deep: number } {
    return {
      summary: Math.floor(this.config.totalTokens * this.config.summaryCeilingPercent / 100),
      active: Math.floor(this.config.totalTokens * this.config.activeCeilingPercent / 100),
      deep: Math.floor(this.config.totalTokens * this.config.deepCeilingPercent / 100),
    };
  }

  /**
   * Load a department summary with budget enforcement (2% ceiling).
   */
  async loadSummary(departmentId: string): Promise<BudgetEnforcementResult<DepartmentSummary>> {
    const data = await this.loader.loadSummary(departmentId);
    const ceiling = this.getCeilings().summary;

    if (data.tokenCost <= ceiling) {
      this.cumulativeTokens += data.tokenCost;
      return {
        data,
        tokenCost: data.tokenCost,
        budgetLimit: ceiling,
        truncated: false,
        ceilingPercent: this.config.summaryCeilingPercent,
      };
    }

    // Truncate the description to fit within budget
    const truncResult = truncateToTokenBudget(data.description, ceiling);
    const truncatedData: DepartmentSummary = {
      ...data,
      description: truncResult.content,
      tokenCost: truncResult.tokenCost,
    };

    this.cumulativeTokens += truncResult.tokenCost;
    return {
      data: truncatedData,
      tokenCost: truncResult.tokenCost,
      budgetLimit: ceiling,
      truncated: true,
      ceilingPercent: this.config.summaryCeilingPercent,
    };
  }

  /**
   * Load a wing with budget enforcement (3% ceiling).
   * If over budget, removes concepts from the end until under budget.
   */
  async loadWing(departmentId: string, wingId: string): Promise<BudgetEnforcementResult<WingContent>> {
    const data = await this.loader.loadWing(departmentId, wingId);
    const ceiling = this.getCeilings().active;

    if (data.tokenCost <= ceiling) {
      this.cumulativeTokens += data.tokenCost;
      return {
        data,
        tokenCost: data.tokenCost,
        budgetLimit: ceiling,
        truncated: false,
        ceilingPercent: this.config.activeCeilingPercent,
      };
    }

    // Remove concepts from the end until under budget
    const concepts = [...data.concepts];
    let currentCost = data.tokenCost;

    while (concepts.length > 0 && currentCost > ceiling) {
      const removed = concepts.pop()!;
      const removedText = `${removed.name}: ${removed.description}`;
      const removedTokens = countTokens(removedText);
      currentCost -= removedTokens;
    }

    // Ensure we do not report a cost above the ceiling
    currentCost = Math.min(currentCost, ceiling);

    const truncatedData: WingContent = {
      ...data,
      concepts,
      wing: {
        ...data.wing,
        concepts: concepts.map((c) => c.id),
      },
      tokenCost: currentCost,
    };

    this.cumulativeTokens += currentCost;
    return {
      data: truncatedData,
      tokenCost: currentCost,
      budgetLimit: ceiling,
      truncated: true,
      ceilingPercent: this.config.activeCeilingPercent,
    };
  }

  /**
   * Load deep reference material with budget enforcement (5% ceiling).
   */
  async loadDeep(departmentId: string, topic: string): Promise<BudgetEnforcementResult<DeepReference>> {
    const data = await this.loader.loadDeep(departmentId, topic);
    const ceiling = this.getCeilings().deep;

    if (data.tokenCost <= ceiling) {
      this.cumulativeTokens += data.tokenCost;
      return {
        data,
        tokenCost: data.tokenCost,
        budgetLimit: ceiling,
        truncated: false,
        ceilingPercent: this.config.deepCeilingPercent,
      };
    }

    // Truncate the reference content
    const truncResult = truncateToTokenBudget(data.content, ceiling);
    const truncatedData: DeepReference = {
      ...data,
      content: truncResult.content,
      tokenCost: truncResult.tokenCost,
    };

    this.cumulativeTokens += truncResult.tokenCost;
    return {
      data: truncatedData,
      tokenCost: truncResult.tokenCost,
      budgetLimit: ceiling,
      truncated: true,
      ceilingPercent: this.config.deepCeilingPercent,
    };
  }

  /**
   * Get total tokens consumed across all load operations in this session.
   */
  getCumulativeTokens(): number {
    return this.cumulativeTokens;
  }

  /**
   * Reset the cumulative token counter.
   */
  resetCumulativeTokens(): void {
    this.cumulativeTokens = 0;
  }

  /**
   * Get the remaining budget for a tier (ceiling minus cumulative consumed).
   */
  getRemainingBudget(tier: 'summary' | 'active' | 'deep'): number {
    const ceilings = this.getCeilings();
    return ceilings[tier] - this.cumulativeTokens;
  }
}
