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

import { readFile } from 'fs/promises';
import { join } from 'path';
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
// Constants
// ============================================================================

/** Type sort order: skills first, then agents. */
const TYPE_ORDER: Record<CapabilityType, number> = {
  skill: 0,
  agent: 1,
  team: 2,
};

// ============================================================================
// PostPhaseInvoker
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
   *
   * 1. Filter to after-verb only and non-team types
   * 2. For each filtered ref, attempt resolution
   * 3. Sort instructions by type (skills first, then agents)
   * 4. Return instructions and unresolved arrays
   */
  async resolveAfterHooks(request: InvocationRequest): Promise<InvocationResult> {
    const instructions: InvocationInstruction[] = [];
    const unresolved: { ref: CapabilityRef; reason: string }[] = [];

    // Filter to after-verb only and non-team types
    const afterRefs = request.capabilities.filter(
      (ref) => ref.verb === 'after' && ref.type !== 'team'
    );

    for (const ref of afterRefs) {
      const resolved = await this.resolve(ref);
      if (resolved) {
        instructions.push(resolved);
      } else {
        unresolved.push({
          ref,
          reason: `Capability ${ref.type}/${ref.name} not found`,
        });
      }
    }

    // Sort by type (skills first, then agents) for deterministic ordering
    instructions.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);

    return { instructions, unresolved };
  }

  // --------------------------------------------------------------------------
  // Resolution
  // --------------------------------------------------------------------------

  /**
   * Attempt to resolve a single capability reference to an invocation instruction.
   * Returns null if the capability cannot be found.
   */
  private async resolve(ref: CapabilityRef): Promise<InvocationInstruction | null> {
    switch (ref.type) {
      case 'skill':
        return this.resolveSkill(ref);
      case 'agent':
        return this.resolveAgent(ref);
      default:
        return null;
    }
  }

  /**
   * Resolve a skill ref by iterating stores and reading skill metadata.
   * Only needs the sourcePath to confirm existence, not the full content.
   */
  private async resolveSkill(ref: CapabilityRef): Promise<InvocationInstruction | null> {
    for (const { store } of this.skillStores) {
      try {
        const skill = await store.read(ref.name);
        return {
          name: ref.name,
          type: 'skill',
          verb: 'after',
          sourcePath: skill.path,
          description: `Invoke skill/${ref.name} after phase completion`,
        };
      } catch {
        // Skill not found in this store, try next
      }
    }
    return null;
  }

  /**
   * Resolve an agent ref by iterating directories and checking file existence.
   */
  private async resolveAgent(ref: CapabilityRef): Promise<InvocationInstruction | null> {
    for (const { dir } of this.agentDirs) {
      try {
        const filePath = join(dir, ref.name + '.md');
        await readFile(filePath, 'utf-8');
        return {
          name: ref.name,
          type: 'agent',
          verb: 'after',
          sourcePath: filePath,
          description: `Invoke agent/${ref.name} after phase completion`,
        };
      } catch {
        // Agent not found in this directory, try next
      }
    }
    return null;
  }
}
