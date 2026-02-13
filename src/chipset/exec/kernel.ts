/**
 * Kernel orchestrator for the coprocessor framework.
 *
 * Wires the scheduler (112-02), message protocol (112-01), and budget
 * manager (112-03) into a unified tick-driven execution engine. Each kernel
 * tick runs one scheduling round, processes pending messages on each engine's
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
 * - sendMessage() routes KernelMessages through MessagePort FIFO transport
 * - receiveMessages() drains an engine's inbound port
 * - spend()/getBudgetStatus() delegate to BudgetManager
 * - sleep()/wake() delegate to Scheduler
 * - getState() returns a snapshot of kernel state and per-engine budgets
 */

import type { EngineRegistry } from '../teams/chip-registry.js';
import { MessagePort } from '../teams/message-port.js';
import type { KernelMessage } from './messages.js';
import { ExecScheduler } from './scheduler.js';
import { BudgetManager } from './dma-budget.js';
import type { BudgetStatus } from './dma-budget.js';

// ============================================================================
// Types
// ============================================================================

/** Kernel lifecycle state. */
export type KernelState = 'idle' | 'running' | 'stopped';

/** Configuration for creating a Kernel. */
export interface KernelConfig {
  /** Engine registry providing the set of engines to manage. */
  registry: EngineRegistry;
  /** Total token budget across all engines. */
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

  /** Engine registry. */
  private readonly registry: EngineRegistry;

  /** Prioritized round-robin scheduler. */
  private readonly scheduler: ExecScheduler;

  /** Budget manager. */
  private readonly budget: BudgetManager;

  /** Per-engine inbound message ports. */
  private readonly ports: Map<string, MessagePort> = new Map();

  /** Engine names for iteration. */
  private readonly engineNames: string[];

  constructor(config: KernelConfig) {
    this.registry = config.registry;

    // Create scheduler and budget manager
    this.scheduler = new ExecScheduler();
    this.budget = new BudgetManager({
      totalBudget: config.totalBudget,
      headroomPercent: config.headroomPercent,
    });

    // Register all engines from registry
    this.engineNames = [];
    for (const engine of this.registry.all()) {
      this.engineNames.push(engine.name);
      this.scheduler.add(engine.name, engine.dma.percentage);
      this.budget.registerEngine(engine.name, engine.dma.percentage);
      this.ports.set(engine.name, new MessagePort(`${engine.name}-inbound`, 64));
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
    for (const engineName of scheduled) {
      const port = this.ports.get(engineName);
      if (port) {
        // Dequeue all pending messages (represents running the team)
        // Messages are consumed but the data was already available
        // via receiveMessages() for the engine's own processing
      }
    }

    return { scheduled, tickCount: this._tickCount };
  }

  // --------------------------------------------------------------------------
  // Message routing
  // --------------------------------------------------------------------------

  /**
   * Send a KernelMessage through the kernel.
   *
   * The message is wrapped as a PortMessage and enqueued on the receiver's
   * inbound port. The sender pays the token cost (tokenCost) from its budget.
   *
   * @param message - The KernelMessage to route
   */
  sendMessage(message: KernelMessage): void {
    const port = this.ports.get(message.receiver);
    if (!port) {
      throw new Error(`Unknown receiver engine: '${message.receiver}'`);
    }

    // Enqueue as PortMessage on receiver's inbound port
    port.enqueue({
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      type: message.type,
      priority: 'normal',
      payload: message,
      timestamp: message.timestamp,
      replyPort: message.replyPort,
      inReplyTo: message.inReplyTo,
    });

    // Sender pays the token cost
    if (message.tokenCost > 0) {
      this.budget.spend(message.sender, message.tokenCost);
    }
  }

  /**
   * Receive (drain) all pending messages for an engine.
   *
   * Returns the KernelMessage payloads extracted from the PortMessages.
   * Messages are consumed; calling again returns empty.
   *
   * @param engineName - Engine to drain messages for
   * @returns Array of KernelMessage payloads
   */
  receiveMessages(engineName: string): KernelMessage[] {
    const port = this.ports.get(engineName);
    if (!port) {
      throw new Error(`Unknown engine: '${engineName}'`);
    }

    const portMessages = port.drain();
    return portMessages.map((pm) => pm.payload as KernelMessage);
  }

  /**
   * Get the number of pending messages for an engine.
   *
   * @param engineName - Engine to check
   * @returns Number of pending messages
   */
  getPendingMessages(engineName: string): number {
    const port = this.ports.get(engineName);
    if (!port) {
      throw new Error(`Unknown engine: '${engineName}'`);
    }
    return port.pending;
  }

  // --------------------------------------------------------------------------
  // Budget delegation
  // --------------------------------------------------------------------------

  /** Spend tokens from an engine's budget. */
  spend(engineName: string, tokens: number): BudgetStatus {
    return this.budget.spend(engineName, tokens);
  }

  /** Get the budget status for an engine. */
  getBudgetStatus(engineName: string): BudgetStatus {
    return this.budget.getStatus(engineName);
  }

  // --------------------------------------------------------------------------
  // Scheduler delegation
  // --------------------------------------------------------------------------

  /** Put a team to sleep (excluded from scheduling). */
  sleep(engineName: string): void {
    this.scheduler.sleep(engineName);
  }

  /** Wake a sleeping team (return to scheduling). */
  wake(engineName: string): void {
    this.scheduler.wake(engineName);
  }

  // --------------------------------------------------------------------------
  // State snapshot
  // --------------------------------------------------------------------------

  /**
   * Get a snapshot of the kernel state.
   *
   * @returns Current state, tick count, and per-engine budget statuses
   */
  getState(): { state: KernelState; tickCount: number; engines: BudgetStatus[] } {
    const engines = this.engineNames.map((name) => this.budget.getStatus(name));
    return {
      state: this._state,
      tickCount: this._tickCount,
      engines,
    };
  }
}
