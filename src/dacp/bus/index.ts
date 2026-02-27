/**
 * Barrel export for the DACP bus integration module.
 *
 * Re-exports all public types and functions for the DACP bus transport,
 * scanner, and cleanup utilities.
 */

// Types
export type {
  DACPBusEntry,
  DACPSendOptions,
  CleanupResult,
  OrphanEntry,
} from './types.js';

// Transport
export { DACPTransport, createDACPTransport } from './transport.js';

// Scanner
export { scanForBundles, scanPriorityDirWithBundles } from './scanner.js';

// Cleanup
export { cleanupBundles, detectOrphans } from './cleanup.js';
