/**
 * DMA-channel token budget manager for the exec kernel.
 *
 * Provides percentage-based per-chip token budget allocation with a
 * configurable headroom reserve and burst mode (BLITHOG). Each chip
 * receives a guaranteed minimum allocation calculated from the effective
 * budget (total minus headroom). Burst mode allows a chip to temporarily
 * exceed its allocation by borrowing from the headroom pool.
 *
 * Budget enforcement is soft: exceeding the allocation triggers a callback
 * and sets the exceeded flag, but does not block further spending. This
 * matches the Amiga DMA philosophy where the coprocessor signals contention
 * rather than hard-blocking.
 *
 * Key behaviors:
 * - registerChip() allocates a percentage of the effective budget
 * - spend() deducts tokens with soft-limit exceeded detection
 * - enableBurst()/disableBurst() toggle BLITHOG burst mode per chip
 * - Burst spending beyond allocation draws from the headroom pool
 * - onExceeded() callback fires exactly once per exceedance (reset clears)
 * - reset()/resetAll() restore spending counters and headroom
 */

// ============================================================================
// Types
// ============================================================================

/** Configuration for the DMA budget manager. */
export interface DmaBudgetConfig {
  /** Total token budget across all chips. */
  totalBudget: number;
  /** Percentage of total budget reserved as headroom (default 5). */
  headroomPercent?: number;
}

/** Budget status snapshot for a single chip. */
export interface BudgetStatus {
  /** Chip name. */
  chipName: string;
  /** Allocated token budget for this chip. */
  allocation: number;
  /** Tokens spent so far. */
  spent: number;
  /** Remaining tokens (can be negative if exceeded). */
  remaining: number;
  /** Whether this chip has exceeded its allocation. */
  exceeded: boolean;
  /** Whether burst mode (BLITHOG) is active for this chip. */
  burstActive: boolean;
}

// ============================================================================
// Internal chip state
// ============================================================================

interface ChipBudgetState {
  allocation: number;
  spent: number;
  burstActive: boolean;
  /** Tokens this chip has consumed from the headroom pool during burst. */
  burstSpent: number;
}

// ============================================================================
// DmaBudgetManager
// ============================================================================

/**
 * Per-chip DMA channel token budget manager with guaranteed minimums
 * and burst mode (BLITHOG).
 */
export class DmaBudgetManager {
  /** Total token budget. */
  private readonly totalBudget: number;

  /** Headroom percentage (0-100). */
  private readonly headroomPercent: number;

  /** Total headroom pool size (tokens). */
  private readonly headroomPool: number;

  /** Effective budget after headroom deduction. */
  private readonly effectiveBudget: number;

  /** Per-chip budget state. */
  private chips: Map<string, ChipBudgetState> = new Map();

  /** Tokens consumed from headroom across all burst-mode chips. */
  private headroomSpent: number = 0;

  /** Chips that have already triggered the exceeded callback. */
  private exceededSet: Set<string> = new Set();

  /** Registered exceeded callbacks. */
  private onExceededCallbacks: Array<(chipName: string) => void> = [];

  constructor(config: DmaBudgetConfig) {
    this.totalBudget = config.totalBudget;
    this.headroomPercent = config.headroomPercent ?? 5;
    this.headroomPool = Math.floor(this.totalBudget * this.headroomPercent / 100);
    this.effectiveBudget = this.totalBudget - this.headroomPool;
  }

  // --------------------------------------------------------------------------
  // Registration
  // --------------------------------------------------------------------------

  /**
   * Register a chip with the given DMA percentage.
   *
   * The allocation is calculated as a percentage of the effective budget
   * (total minus headroom), floored to an integer.
   *
   * @param chipName - Unique chip identifier
   * @param dmaPercentage - Percentage of effective budget (0-100)
   */
  registerChip(chipName: string, dmaPercentage: number): void {
    const allocation = Math.floor(this.effectiveBudget * dmaPercentage / 100);
    this.chips.set(chipName, {
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
   * Spend tokens from a chip's budget.
   *
   * If burst mode is active and the chip is at or over its allocation,
   * overflow spending is drawn from the headroom pool. Budget enforcement
   * is soft: exceeding triggers a callback but does not block.
   *
   * @param chipName - Chip to deduct from
   * @param tokens - Number of tokens to spend
   * @returns Current BudgetStatus after spending
   */
  spend(chipName: string, tokens: number): BudgetStatus {
    const chip = this.requireChip(chipName);

    const previousSpent = chip.spent;
    chip.spent += tokens;

    // If burst is active and spending goes beyond allocation, deduct overflow from headroom
    if (chip.burstActive) {
      const overflowBefore = Math.max(0, previousSpent - chip.allocation);
      const overflowAfter = Math.max(0, chip.spent - chip.allocation);
      const newBurstSpending = overflowAfter - overflowBefore;
      if (newBurstSpending > 0) {
        this.headroomSpent += newBurstSpending;
        chip.burstSpent += newBurstSpending;
      }
    }

    // Check exceeded: remaining < 0 and not already flagged
    const remaining = chip.allocation - chip.spent;
    if (remaining < 0 && !this.exceededSet.has(chipName)) {
      this.exceededSet.add(chipName);
      for (const cb of this.onExceededCallbacks) {
        cb(chipName);
      }
    }

    return this.buildStatus(chipName, chip);
  }

  // --------------------------------------------------------------------------
  // Queries
  // --------------------------------------------------------------------------

  /** Get the allocated token budget for a chip. */
  getAllocation(chipName: string): number {
    return this.requireChip(chipName).allocation;
  }

  /** Get remaining tokens for a chip (can be negative if exceeded). */
  getRemaining(chipName: string): number {
    const chip = this.requireChip(chipName);
    return chip.allocation - chip.spent;
  }

  /** Get the full budget status for a chip. */
  getStatus(chipName: string): BudgetStatus {
    const chip = this.requireChip(chipName);
    return this.buildStatus(chipName, chip);
  }

  /** Get remaining headroom pool tokens. */
  getHeadroom(): number {
    return this.headroomPool - this.headroomSpent;
  }

  // --------------------------------------------------------------------------
  // Burst mode (BLITHOG)
  // --------------------------------------------------------------------------

  /** Enable burst mode for a chip, allowing headroom borrowing. */
  enableBurst(chipName: string): void {
    this.requireChip(chipName).burstActive = true;
  }

  /** Disable burst mode for a chip. */
  disableBurst(chipName: string): void {
    this.requireChip(chipName).burstActive = false;
  }

  // --------------------------------------------------------------------------
  // Exceeded callbacks
  // --------------------------------------------------------------------------

  /**
   * Register a callback invoked when a chip exceeds its allocation.
   * The callback fires exactly once per exceedance; resetting the chip
   * allows it to fire again on a subsequent exceedance.
   */
  onExceeded(callback: (chipName: string) => void): void {
    this.onExceededCallbacks.push(callback);
  }

  // --------------------------------------------------------------------------
  // Reset
  // --------------------------------------------------------------------------

  /**
   * Reset spending for a single chip.
   *
   * Returns any burst spending to the headroom pool, clears the spent
   * counter, disables burst mode, and removes the exceeded flag.
   */
  reset(chipName: string): void {
    const chip = this.requireChip(chipName);

    // Return burst spending to headroom
    if (chip.burstSpent > 0) {
      this.headroomSpent -= chip.burstSpent;
    }

    chip.spent = 0;
    chip.burstActive = false;
    chip.burstSpent = 0;
    this.exceededSet.delete(chipName);
  }

  /** Reset all chips and restore headroom. */
  resetAll(): void {
    for (const [name] of this.chips) {
      const chip = this.chips.get(name)!;
      chip.spent = 0;
      chip.burstActive = false;
      chip.burstSpent = 0;
    }
    this.headroomSpent = 0;
    this.exceededSet.clear();
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  /** Look up a chip or throw if not registered. */
  private requireChip(chipName: string): ChipBudgetState {
    const chip = this.chips.get(chipName);
    if (!chip) {
      throw new Error(`Unknown chip: '${chipName}'`);
    }
    return chip;
  }

  /** Build a BudgetStatus from internal state. */
  private buildStatus(chipName: string, chip: ChipBudgetState): BudgetStatus {
    const remaining = chip.allocation - chip.spent;
    return {
      chipName,
      allocation: chip.allocation,
      spent: chip.spent,
      remaining,
      exceeded: remaining < 0,
      burstActive: chip.burstActive,
    };
  }
}
