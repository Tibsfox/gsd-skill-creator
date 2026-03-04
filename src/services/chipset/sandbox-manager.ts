/**
 * Sandbox manager — trust-based containment for cartridge execution.
 *
 * Path-level validation (not OS chroot).
 * Resolves path traversal (../) before checking permissions.
 *
 * Trust flow: quarantine → provisional → trusted → suspended (on violation)
 */

import { resolve } from 'path';
import type { TrustState } from './cartridge-types.js';
import type { IsolationPolicy, SandboxViolation } from './mission-isolation.js';

const BLOCKED_PATTERNS = [
  '.ssh', '.gnupg', '.aws', '.config/claude',
  '.env', '.key', '.pem', 'credentials',
];

const MB = 1024 * 1024;

export class SandboxManager {
  policyForTrust(trust: TrustState, bundlePath: string): IsolationPolicy {
    const blockedPaths = [...BLOCKED_PATTERNS];

    switch (trust) {
      case 'quarantine':
        return {
          trustState: 'quarantine',
          readPaths: [bundlePath],
          writePaths: [`${bundlePath}/.output`],
          blockedPaths,
          maxFileSize: 1 * MB,
          maxTotalSize: 10 * MB,
        };

      case 'provisional':
        return {
          trustState: 'provisional',
          readPaths: [bundlePath, 'data/'],
          writePaths: [`${bundlePath}/.output`],
          blockedPaths,
          maxFileSize: 10 * MB,
          maxTotalSize: 100 * MB,
        };

      case 'trusted':
        return {
          trustState: 'trusted',
          readPaths: ['/'],
          writePaths: ['/'],
          blockedPaths,
          maxFileSize: Infinity,
          maxTotalSize: Infinity,
        };

      case 'suspended':
        return {
          trustState: 'suspended',
          readPaths: [],
          writePaths: [],
          blockedPaths,
          maxFileSize: 0,
          maxTotalSize: 0,
        };
    }
  }

  canRead(policy: IsolationPolicy, path: string): boolean {
    const resolved = resolve(path);
    if (this.isBlocked(policy, resolved)) return false;
    return policy.readPaths.some(allowed => resolved.startsWith(resolve(allowed)));
  }

  canWrite(policy: IsolationPolicy, path: string, size: number): boolean {
    const resolved = resolve(path);
    if (this.isBlocked(policy, resolved)) return false;
    if (size > policy.maxFileSize) return false;
    return policy.writePaths.some(allowed => resolved.startsWith(resolve(allowed)));
  }

  promoteTrust(currentTrust: TrustState, executionCount: number, violations: SandboxViolation[]): TrustState {
    // Any violation → suspended
    if (violations.length > 0) return 'suspended';

    // Suspended stays suspended (manual reset only)
    if (currentTrust === 'suspended') return 'suspended';

    // Promotion rules
    if (currentTrust === 'quarantine' && executionCount >= 1) return 'provisional';
    if (currentTrust === 'provisional' && executionCount >= 3) return 'trusted';

    return currentTrust;
  }

  private isBlocked(policy: IsolationPolicy, resolvedPath: string): boolean {
    return policy.blockedPaths.some(pattern => resolvedPath.includes(pattern));
  }
}
