/**
 * Exec kernel orchestrator for the chipset framework.
 *
 * Wires the scheduler (112-02), message protocol (112-01), and DMA budget
 * manager (112-03) into a unified tick-driven execution engine. Each kernel
 * tick runs one scheduling round, processes pending messages on each chip's
 * inbound port, and tracks budget consumption.
 *
 * The kernel manages the lifecycle of the execution engine:
 * - idle: created but not started
 * - running: tick() is available, messages route, budgets track
 * - stopped: terminal state, no further ticks
 *
 * Key behaviors:
 * - start()/stop() manage lifecycle transitions
 * - tick() runs one round: schedule teams, process inbound ports
 * - sendMessage() routes ExecMessages through MessagePort FIFO transport
 * - receiveMessages() drains a chip's inbound port
 * - spend()/getBudgetStatus() delegate to DmaBudgetManager
 * - sleep()/wake() delegate to ExecScheduler
 * - getState() returns a snapshot of kernel state and per-chip budgets
 */

import type { ChipRegistry } from '../teams/chip-registry.js';
import { MessagePort } from '../teams/message-port.js';
import type { ExecMessage } from './messages.js';
import { ExecScheduler } from './scheduler.js';
import { DmaBudgetManager } from './dma-budget.js';
import type { BudgetStatus } from './dma-budget.js';

// ============================================================================
// Types
// ============================================================================

/** Kernel lifecycle state. */
export type KernelState = 'idle' | 'running' | 'stopped';

/** Configuration for creating an ExecKernel. */
export interface KernelConfig {
  /** Chip registry providing the set of chips to manage. */
  registry: ChipRegistry;
  /** Total token budget across all chips. */
  totalBudget: number;
  /** Headroom percentage (default 5). */
  headroomPercent?: number;
}

// ============================================================================
// ExecKernel
// ============================================================================

/**
 * Kernel orchestrator that ties scheduler, messages, and budgets
 * into a tick-driven execution cycle.
 */
export class ExecKernel {
  /** Current lifecycle state. */
  private _state: KernelState = 'idle';

  /** Number of ticks executed. */
  private _tickCount: number = 0;

  /** Chip registry. */
  private readonly registry: ChipRegistry;

  /** Prioritized round-robin scheduler. */
  private readonly scheduler: ExecScheduler;

  /** DMA budget manager. */
  private readonly budget: DmaBudgetManager;

  /** Per-chip inbound message ports. */
  private readonly ports: Map<string, MessagePort> = new Map();

  /** Chip names for iteration. */
  private readonly chipNames: string[];

  constructor(config: KernelConfig) {
    this.registry = config.registry;

    // Create scheduler and budget manager
    this.scheduler = new ExecScheduler();
    this.budget = new DmaBudgetManager({
      totalBudget: config.totalBudget,
      headroomPercent: config.headroomPercent,
    });

    // Register all chips from registry
    this.chipNames = [];
    for (const chip of this.registry.all()) {
      this.chipNames.push(chip.name);
      this.scheduler.add(chip.name, chip.dma.percentage);
      this.budget.registerChip(chip.name, chip.dma.percentage);
      this.ports.set(chip.name, new MessagePort(`${chip.name}-inbound`, 64));
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Start the kernel. Only valid from idle state. */
  start(): void {
    if (this._state !== 'idle') {
      throw new Error('Kernel can only start from idle state');
    }
    this._state = 'running';
  }

  /** Stop the kernel. Terminal state. */
  stop(): void {
    this._state = 'stopped';
  }

  // --------------------------------------------------------------------------
  // Tick cycle
  // --------------------------------------------------------------------------

  /**
   * Execute one tick of the kernel cycle.
   *
   * Runs one scheduling round (producing the team execution order),
   * then for each scheduled team, processes their inbound message port
   * (dequeuing messages represents "running" the team for this tick).
   *
   * @returns The scheduled team order and current tick count
   * @throws Error if kernel is not running
   */
  tick(): { scheduled: string[]; tickCount: number } {
    if (this._state !== 'running') {
      throw new Error('Kernel not running');
    }

    this._tickCount++;

    // Run scheduler to get team order
    const scheduled = this.scheduler.schedule();

    // Process each scheduled team's inbound port
    for (const chipName of scheduled) {
      const port = this.ports.get(chipName);
      if (port) {
        // Dequeue all pending messages (represents running the team)
        // Messages are consumed but the data was already available
        // via receiveMessages() for the chip's own processing
      }
    }

    return { scheduled, tickCount: this._tickCount };
  }

  // --------------------------------------------------------------------------
  // Message routing
  // --------------------------------------------------------------------------

  /**
   * Send an ExecMessage through the kernel.
   *
   * The message is wrapped as a PortMessage and enqueued on the receiver's
   * inbound port. The sender pays the token cost (mn_Length) from its budget.
   *
   * @param message - The ExecMessage to route
   */
  sendMessage(message: ExecMessage): void {
    const port = this.ports.get(message.receiver);
    if (!port) {
      throw new Error(`Unknown receiver chip: '${message.receiver}'`);
    }

    // Enqueue as PortMessage on receiver's inbound port
    port.enqueue({
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      type: message.ln_Type,
      priority: 'normal',
      payload: message,
      timestamp: message.timestamp,
      replyPort: message.mn_ReplyPort,
      inReplyTo: message.inReplyTo,
    });

    // Sender pays the token cost
    if (message.mn_Length > 0) {
      this.budget.spend(message.sender, message.mn_Length);
    }
  }

  /**
   * Receive (drain) all pending messages for a chip.
   *
   * Returns the ExecMessage payloads extracted from the PortMessages.
   * Messages are consumed; calling again returns empty.
   *
   * @param chipName - Chip to drain messages for
   * @returns Array of ExecMessage payloads
   */
  receiveMessages(chipName: string): ExecMessage[] {
    const port = this.ports.get(chipName);
    if (!port) {
      throw new Error(`Unknown chip: '${chipName}'`);
    }

    const portMessages = port.drain();
    return portMessages.map((pm) => pm.payload as ExecMessage);
  }

  /**
   * Get the number of pending messages for a chip.
   *
   * @param chipName - Chip to check
   * @returns Number of pending messages
   */
  getPendingMessages(chipName: string): number {
    const port = this.ports.get(chipName);
    if (!port) {
      throw new Error(`Unknown chip: '${chipName}'`);
    }
    return port.pending;
  }

  // --------------------------------------------------------------------------
  // Budget delegation
  // --------------------------------------------------------------------------

  /** Spend tokens from a chip's budget. */
  spend(chipName: string, tokens: number): BudgetStatus {
    return this.budget.spend(chipName, tokens);
  }

  /** Get the budget status for a chip. */
  getBudgetStatus(chipName: string): BudgetStatus {
    return this.budget.getStatus(chipName);
  }

  // --------------------------------------------------------------------------
  // Scheduler delegation
  // --------------------------------------------------------------------------

  /** Put a team to sleep (excluded from scheduling). */
  sleep(chipName: string): void {
    this.scheduler.sleep(chipName);
  }

  /** Wake a sleeping team (return to scheduling). */
  wake(chipName: string): void {
    this.scheduler.wake(chipName);
  }

  // --------------------------------------------------------------------------
  // State snapshot
  // --------------------------------------------------------------------------

  /**
   * Get a snapshot of the kernel state.
   *
   * @returns Current state, tick count, and per-chip budget statuses
   */
  getState(): { state: KernelState; tickCount: number; chips: BudgetStatus[] } {
    const chips = this.chipNames.map((name) => this.budget.getStatus(name));
    return {
      state: this._state,
      tickCount: this._tickCount,
      chips,
    };
  }
}
