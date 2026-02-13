/**
 * Barrel exports for the team-as-engine framework module.
 *
 * Re-exports the full public API from:
 * - types: Engine domains, schemas, and signal bit constants
 * - engine-registry: Engine definitions and registry
 * - message-port: Inter-engine message port with FIFO and priority queuing
 * - signals: 32-bit signal system with wait/signal/clear operations
 */

// Types and schemas
export {
  ENGINE_DOMAINS,
  BudgetAllocationSchema,
  PortDeclarationSchema,
  SignalMaskSchema,
  EngineDefinitionSchema,
  SYSTEM_SIGNAL_BITS,
  USER_SIGNAL_BITS,
} from './types.js';
export type {
  EngineDomain,
  BudgetAllocation,
  PortDeclaration,
  SignalMask,
  EngineDefinition,
} from './types.js';

// Engine registry
export {
  EngineRegistry,
  createDefaultRegistry,
  CONTEXT_ENGINE,
  RENDER_ENGINE,
  IO_ENGINE,
  ROUTER_ENGINE,
} from './chip-registry.js';

// Message port
export {
  MessagePort,
  PortMessageSchema,
  MESSAGE_PRIORITIES,
} from './message-port.js';
export type {
  PortMessage,
  MessagePriority,
} from './message-port.js';

// Signals
export {
  TeamSignals,
  signalBit,
  testBit,
  maskOR,
  maskAND,
  clearBit,
} from './signals.js';
