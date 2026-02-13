/**
 * Barrel exports for the chipset integration module.
 *
 * Re-exports all public classes and types from the integration layer
 * that bridges gsd-stack (bash) with the chipset (TypeScript) systems:
 * - StackBridge: recording event stream -> observation input pipeline
 * - SessionEventBridge: session lifecycle -> LifecycleSync emission bridge
 * - PopStackAwareness: session-aware pop operations with heartbeat/recording
 */

// Stack Bridge
export { StackBridge } from './stack-bridge.js';
export type { StreamEvent, StackBridgeConfig } from './stack-bridge.js';

// Session Events
export { SessionEventBridge } from './session-events.js';
export type {
  SessionState,
  SessionTransition,
} from './session-events.js';

// Pop Stack Awareness
export { PopStackAwareness } from './pop-stack-awareness.js';
export type {
  PopStackConfig,
  PopStackResult,
} from './pop-stack-awareness.js';
