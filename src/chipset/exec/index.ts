/**
 * Barrel exports for the kernel module.
 *
 * Re-exports the complete kernel API: message protocol, scheduler,
 * budget manager, and kernel orchestrator.
 */

// Message protocol
export {
  KernelMessageSchema,
  MESSAGE_TYPES,
  createMessage,
  createReply,
} from './messages.js';
export type { KernelMessage, MessageType } from './messages.js';

// Scheduler
export { ExecScheduler } from './scheduler.js';
export type { SchedulerEntry, TeamState } from './scheduler.js';

// Budget
export { BudgetManager } from './dma-budget.js';
export type { BudgetStatus, BudgetConfig } from './dma-budget.js';

// Kernel
export { ExecKernel } from './kernel.js';
export type { KernelConfig, KernelState } from './kernel.js';
