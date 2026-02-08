/**
 * PostPhaseInvoker service.
 *
 * Resolves after-verb capability declarations into invocation instructions
 * that tell the verify-phase workflow what to run after phase completion.
 *
 * - after verb: resolved to invocation instructions
 * - use/create/adapt verbs: filtered out (not invocable)
 * - team refs: filtered out (teams not invocable)
 * - Instructions include capability name, type, resolved path, and description
 */

import type { SkillStore } from '../storage/skill-store.js';
import type { CapabilityRef, CapabilityType } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Request to resolve after-verb capabilities into invocation instructions.
 */
export interface InvocationRequest {
  capabilities: CapabilityRef[];
}

/**
 * A single resolved invocation instruction for post-phase execution.
 */
export interface InvocationInstruction {
  name: string;           // Capability name (e.g., "test-generator")
  type: CapabilityType;   // 'skill' or 'agent'
  verb: 'after';          // Always 'after' for post-phase hooks
  sourcePath: string;     // Resolved file path on disk
  description: string;    // Human-readable: "Invoke skill/test-generator after phase completion"
}

/**
 * Result of invocation resolution: resolved instructions and unresolved refs.
 */
export interface InvocationResult {
  instructions: InvocationInstruction[];
  unresolved: { ref: CapabilityRef; reason: string }[];
}

// ============================================================================
// PostPhaseInvoker (stub — tests must fail)
// ============================================================================

/**
 * Resolves after-verb capability references to invocation instructions.
 *
 * Constructor accepts explicit stores/directories matching the
 * SkillInjector pattern for consistency and testability.
 */
export class PostPhaseInvoker {
  constructor(
    private skillStores: { scope: 'user' | 'project'; store: SkillStore }[],
    private agentDirs: { scope: 'user' | 'project'; dir: string }[],
  ) {}

  /**
   * Resolve after-verb capability references to invocation instructions.
   */
  async resolveAfterHooks(_request: InvocationRequest): Promise<InvocationResult> {
    throw new Error('Not implemented');
  }
}
