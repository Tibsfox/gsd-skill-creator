/**
 * Sandbox manager — trust-based containment for cartridge execution.
 *
 * Path-level validation (not OS chroot). Resolves symlinks.
 */

import type { TrustState } from './cartridge-types.js';
import type { IsolationPolicy, SandboxViolation } from './mission-isolation.js';

export class SandboxManager {
  policyForTrust(_trust: TrustState, _bundlePath: string): IsolationPolicy {
    throw new Error('Not implemented');
  }

  canRead(_policy: IsolationPolicy, _path: string): boolean {
    throw new Error('Not implemented');
  }

  canWrite(_policy: IsolationPolicy, _path: string, _size: number): boolean {
    throw new Error('Not implemented');
  }

  promoteTrust(_currentTrust: TrustState, _executionCount: number, _violations: SandboxViolation[]): TrustState {
    throw new Error('Not implemented');
  }
}
