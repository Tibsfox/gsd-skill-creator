/**
 * Barrel exports for the team-as-chip framework module.
 *
 * Re-exports the full public API from:
 * - types: Chip domains, schemas, and signal bit constants
 * - chip-registry: Chip definitions (Agnus, Denise, Paula, Gary) and registry
 * - message-port: Inter-chip message port with FIFO and priority queuing
 * - signals: 32-bit signal system with wait/signal/clear operations
 */

// Types and schemas
export {
  CHIP_DOMAINS,
  DmaAllocationSchema,
  PortDeclarationSchema,
  SignalMaskSchema,
  ChipDefinitionSchema,
  SYSTEM_SIGNAL_BITS,
  USER_SIGNAL_BITS,
} from './types.js';
export type {
  ChipDomain,
  DmaAllocation,
  PortDeclaration,
  SignalMask,
  ChipDefinition,
} from './types.js';

// Chip registry
export {
  ChipRegistry,
  createDefaultRegistry,
  AGNUS,
  DENISE,
  PAULA,
  GARY,
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
