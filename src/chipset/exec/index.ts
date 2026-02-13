/**
 * Barrel exports for the exec kernel module.
 *
 * Re-exports the complete exec API: message protocol, scheduler,
 * DMA budget manager, and kernel orchestrator.
 */

// Message protocol
export {
  ExecMessageSchema,
  MESSAGE_TYPES,
  createMessage,
  createReply,
} from './messages.js';
export type { ExecMessage, MessageType } from './messages.js';

// Scheduler
export { ExecScheduler } from './scheduler.js';
export type { SchedulerEntry, TeamState } from './scheduler.js';

// DMA Budget
export { DmaBudgetManager } from './dma-budget.js';
export type { BudgetStatus, DmaBudgetConfig } from './dma-budget.js';

// Kernel
export { ExecKernel } from './kernel.js';
export type { KernelConfig, KernelState } from './kernel.js';
