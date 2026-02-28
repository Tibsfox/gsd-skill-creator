/**
 * Token budget manager for the coprocessor kernel.
 *
 * Provides percentage-based per-engine token budget allocation with a
 * configurable headroom reserve and burst mode. Each engine receives a
 * guaranteed minimum allocation calculated from the effective budget
 * (total minus headroom). Burst mode allows an engine to temporarily
 * exceed its allocation by borrowing from the headroom pool.
 *
 * Budget enforcement is soft: exceeding the allocation triggers a callback
 * and sets the exceeded flag, but does not block further spending. The
 * coprocessor signals contention rather than hard-blocking.
 *
 * Key behaviors:
 * - registerEngine() allocates a percentage of the effective budget
 * - spend() deducts tokens with soft-limit exceeded detection
 * - enableBurst()/disableBurst() toggle burst mode per engine
 * - Burst spending beyond allocation draws from the headroom pool
 * - onExceeded() callback fires exactly once per exceedance (reset clears)
 * - reset()/resetAll() restore spending counters and headroom
 */

// ============================================================================
// Types
// ============================================================================

/** Configuration for the budget manager. */
export interface BudgetConfig {
  /** Total token budget across all engines. */
  totalBudget: number;
  /** Percentage of total budget reserved as headroom (default 5). */
  headroomPercent?: number;
}

/** Budget status snapshot for a single engine. */
export interface BudgetStatus {
  /** Engine name. */
  engineName: string;
  /** Allocated token budget for this engine. */
  allocation: number;
  /** Tokens spent so far. */
  spent: number;
  /** Remaining tokens (can be negative if exceeded). */
  remaining: number;
  /** Whether this engine has exceeded its allocation. */
  exceeded: boolean;
  /** Whether burst mode is active for this engine. */
  burstActive: boolean;
}

// ============================================================================
// Internal engine state
// ============================================================================

interface EngineBudgetState {
  allocation: number;
  spent: number;
  burstActive: boolean;
  /** Tokens this engine has consumed from the headroom pool during burst. */
  burstSpent: number;
}

// ============================================================================
// BudgetManager
// ============================================================================

/**
 * Per-engine token budget manager with guaranteed minimums and burst mode.
 */
export class BudgetManager {
  /** Total token budget. */
  private readonly totalBudget: number;

  /** Headroom percentage (0-100). */
  private readonly headroomPercent: number;

  /** Total headroom pool size (tokens). */
  private readonly headroomPool: number;

  /** Effective budget after headroom deduction. */
  private readonly effectiveBudget: number;

  /** Per-engine budget state. */
  private engines: Map<string, EngineBudgetState> = new Map();

  /** Tokens consumed from headroom across all burst-mode engines. */
  private headroomSpent: number = 0;

  /** Engines that have already triggered the exceeded callback. */
  private exceededSet: Set<string> = new Set();

  /** Registered exceeded callbacks. */
  private onExceededCallbacks: Array<(engineName: string) => void> = [];

  constructor(config: BudgetConfig) {
    this.totalBudget = config.totalBudget;
    this.headroomPercent = config.headroomPercent ?? 5;
    this.headroomPool = Math.floor(this.totalBudget * this.headroomPercent / 100);
    this.effectiveBudget = this.totalBudget - this.headroomPool;
  }

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  /**
   * Register an engine with the given budget percentage.
   *
   * The allocation is calculated as a percentage of the effective budget
   * (total minus headroom), floored to an integer.
   *
   * @param engineName - Unique engine identifier
   * @param percentage - Percentage of effective budget (0-100)
   */
  registerEngine(engineName: string, percentage: number): void {
    const allocation = Math.floor(this.effectiveBudget * percentage / 100);
    this.engines.set(engineName, {
      allocation,
      spent: 0,
      burstActive: false,
      burstSpent: 0,
    });
  }

  // --------------------------------------------------------------------------
  // Spending
  // --------------------------------------------------------------------------

  /**
   * Spend tokens from an engine's budget.
   *
   * If burst mode is active and the engine is at or over its allocation,
   * overflow spending is drawn from the headroom pool. Budget enforcement
   * is soft: exceeding triggers a callback but does not block.
   *
   * @param engineName - Engine to deduct from
   * @param tokens - Number of tokens to spend
   * @returns Current BudgetStatus after spending
   */
  spend(engineName: string, tokens: number): BudgetStatus {
    const engine = this.requireEngine(engineName);

    const previousSpent = engine.spent;
    engine.spent += tokens;

    // If burst is active and spending goes beyond allocation, deduct overflow from headroom
    if (engine.burstActive) {
      const overflowBefore = Math.max(0, previousSpent - engine.allocation);
      const overflowAfter = Math.max(0, engine.spent - engine.allocation);
      const newBurstSpending = overflowAfter - overflowBefore;
      if (newBurstSpending > 0) {
        this.headroomSpent += newBurstSpending;
        engine.burstSpent += newBurstSpending;
      }
    }

    // Check exceeded: remaining < 0 and not already flagged
    const remaining = engine.allocation - engine.spent;
    if (remaining < 0 && !this.exceededSet.has(engineName)) {
      this.exceededSet.add(engineName);
      for (const cb of this.onExceededCallbacks) {
        cb(engineName);
      }
    }

    return this.buildStatus(engineName, engine);
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  /** Get the allocated token budget for an engine. */
  getAllocation(engineName: string): number {
    return this.requireEngine(engineName).allocation;
  }

  /** Get remaining tokens for an engine (can be negative if exceeded). */
  getRemaining(engineName: string): number {
    const engine = this.requireEngine(engineName);
    return engine.allocation - engine.spent;
  }

  /** Get the full budget status for an engine. */
  getStatus(engineName: string): BudgetStatus {
    const engine = this.requireEngine(engineName);
    return this.buildStatus(engineName, engine);
  }

  /** Get remaining headroom pool tokens. */
  getHeadroom(): number {
    return this.headroomPool - this.headroomSpent;
  }

  // --------------------------------------------------------------------------
  // Burst mode
  // --------------------------------------------------------------------------

  /** Enable burst mode for an engine, allowing headroom borrowing. */
  enableBurst(engineName: string): void {
    this.requireEngine(engineName).burstActive = true;
  }

  /** Disable burst mode for an engine. */
  disableBurst(engineName: string): void {
    this.requireEngine(engineName).burstActive = false;
  }

  // --------------------------------------------------------------------------
  // Exceeded callbacks
  // --------------------------------------------------------------------------

  /**
   * Register a callback invoked when an engine exceeds its allocation.
   * The callback fires exactly once per exceedance; resetting the engine
   * allows it to fire again on a subsequent exceedance.
   */
  onExceeded(callback: (engineName: string) => void): void {
    this.onExceededCallbacks.push(callback);
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  /**
   * Reset spending for a single engine.
   *
   * Returns any burst spending to the headroom pool, clears the spent
   * counter, disables burst mode, and removes the exceeded flag.
   */
  reset(engineName: string): void {
    const engine = this.requireEngine(engineName);

    // Return burst spending to headroom
    if (engine.burstSpent > 0) {
      this.headroomSpent -= engine.burstSpent;
    }

    engine.spent = 0;
    engine.burstActive = false;
    engine.burstSpent = 0;
    this.exceededSet.delete(engineName);
  }

  /** Reset all engines and restore headroom. */
  resetAll(): void {
    for (const [name] of this.engines) {
      const engine = this.engines.get(name)!;
      engine.spent = 0;
      engine.burstActive = false;
      engine.burstSpent = 0;
    }
    this.headroomSpent = 0;
    this.exceededSet.clear();
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /** Look up an engine or throw if not registered. */
  private requireEngine(engineName: string): EngineBudgetState {
    const engine = this.engines.get(engineName);
    if (!engine) {
      throw new Error(`Unknown engine: '${engineName}'`);
    }
    return engine;
  }

  /** Build a BudgetStatus from internal state. */
  private buildStatus(engineName: string, engine: EngineBudgetState): BudgetStatus {
    const remaining = engine.allocation - engine.spent;
    return {
      engineName,
      allocation: engine.allocation,
      spent: engine.spent,
      remaining,
      exceeded: remaining < 0,
      burstActive: engine.burstActive,
    };
  }
}
