/**
 * Type definitions for the DACP bus transport layer.
 *
 * These types define the integration between DACP bundles and the
 * existing GSD Den filesystem message bus. DACPBusEntry extends the
 * bus scanning concept to include bundle companions alongside .msg files.
 */

// ============================================================================
// DACPBusEntry
// ============================================================================

/**
 * Result of scanning a priority directory for DACP-aware entries.
 *
 * Extends the basic message concept with an optional bundle companion.
 * When bundlePath is null, the entry is a plain .msg with no DACP enhancement.
 */
export interface DACPBusEntry {
  /** Absolute path to the .msg file */
  msgPath: string;
  /** Absolute path to .bundle/ directory, null if plain message */
  bundlePath: string | null;
  /** Priority level 0-7 (0 = highest) */
  priority: number;
  /** ISA opcode from the message filename */
  opcode: string;
  /** Source agent ID */
  source: string;
  /** Target agent ID */
  target: string;
  /** Compact timestamp from the message filename (YYYYMMDD-HHMMSS) */
  timestamp: string;
}

// ============================================================================
// DACPSendOptions
// ============================================================================

/**
 * Parameters for DACPTransport.send().
 *
 * Wraps the standard bus send with optional bundle directory attachment.
 */
export interface DACPSendOptions {
  /** Priority level 0-7 */
  priority: number;
  /** ISA opcode (must be valid Opcode) */
  opcode: string;
  /** Source agent ID (must be valid AgentId) */
  source: string;
  /** Target agent ID (must be valid AgentId) */
  target: string;
  /** Payload lines for the .msg file */
  payload: string[];
  /** Path to pre-built bundle directory to copy alongside .msg */
  bundleDir?: string;
}

// ============================================================================
// CleanupResult
// ============================================================================

/**
 * Summary of a bundle cleanup operation.
 */
export interface CleanupResult {
  /** Number of bundle directories pruned */
  bundlesPruned: number;
  /** Number of orphaned bundle directories detected */
  orphansDetected: number;
  /** Absolute paths to orphaned .bundle/ directories */
  orphanPaths: string[];
  /** Approximate bytes freed */
  spaceRecovered: number;
}

// ============================================================================
// OrphanEntry
// ============================================================================

/**
 * An orphaned .bundle/ directory without a companion .msg file.
 */
export interface OrphanEntry {
  /** Absolute path to the orphaned bundle directory */
  bundlePath: string;
  /** Reason for orphan status */
  reason: 'no_companion_msg' | 'companion_acknowledged';
}
