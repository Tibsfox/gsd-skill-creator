/**
 * StalenessChecker service for detecting when auto-generated skills
 * are stale (source research file changed) and resolving conflicts
 * where manual skills always win over auto-generated ones.
 */

import { computeContentHash } from './types.js';
import { getExtension } from '../types/extensions.js';
import type { SkillMetadata } from '../types/skill.js';

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of checking whether an auto-generated skill is stale.
 */
export interface StalenessResult {
  skillName: string;
  isStale: boolean;
  reason: 'hash_mismatch' | 'source_missing' | 'not_auto_generated' | 'fresh';
  sourceFile?: string;
  expectedHash?: string;
  actualHash?: string;
}

/**
 * Result of resolving a conflict between manual and auto-generated skills.
 */
export interface ConflictResolution {
  skillName: string;
  winner: 'manual' | 'auto-generated';
  reason: string;
}

// ============================================================================
// StalenessChecker
// ============================================================================

export class StalenessChecker {
  /**
   * Check whether an auto-generated skill is stale relative to its source.
   *
   * @param skillMetadata - Parsed skill metadata (may have source field)
   * @param sourceContent - Current content of the source research file, or null if missing
   * @returns StalenessResult indicating freshness state
   */
  checkStaleness(skillMetadata: SkillMetadata, sourceContent: string | null): StalenessResult {
    // Stub - will be implemented in GREEN phase
    throw new Error('Not implemented');
  }

  /**
   * Resolve a conflict between a manual skill and an auto-generated skill
   * with the same name. Manual always wins.
   *
   * @param manualSkill - The manually-created skill, or null
   * @param autoSkill - The auto-generated skill, or null
   * @returns ConflictResolution indicating which skill wins
   */
  resolveConflict(
    manualSkill: { name: string; source?: string } | null,
    autoSkill: { name: string; source: 'auto-generated' } | null
  ): ConflictResolution {
    // Stub - will be implemented in GREEN phase
    throw new Error('Not implemented');
  }
}
