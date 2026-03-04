/**
 * Mission isolation types — containment for community cartridges.
 *
 * Trust-based sandbox: quarantine, provisional, trusted, suspended.
 * Path validation prevents access to credentials and sensitive files.
 */

import type { TrustState } from './cartridge-types.js';

export interface IsolationPolicy {
  trustState: TrustState;
  readPaths: string[];
  writePaths: string[];
  blockedPaths: string[];
  maxFileSize: number;
  maxTotalSize: number;
}

export interface SandboxResult {
  success: boolean;
  output: string | null;
  violations: SandboxViolation[];
}

export interface SandboxViolation {
  type: 'read-denied' | 'write-denied' | 'size-exceeded' | 'blocked-path';
  path: string;
  timestamp: string;
}
