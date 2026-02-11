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

/**
 * Shape of the generatedFrom block stored in the gsd-skill-creator extension.
 * Defined locally since the extension type will be formally updated in Plan 03.
 */
interface GeneratedFrom {
  sourceFile: string;
  contentHash: string;
  generatedAt: string;
}

// ============================================================================
// StalenessChecker
// ============================================================================

export class StalenessChecker {
  /**
   * Check whether an auto-generated skill is stale relative to its source.
   *
   * Determines staleness by comparing the content hash stored at generation time
   * with the hash of the current source file content. Only auto-generated skills
   * (those with `source: 'auto-generated'` on the metadata) are checked.
   *
   * @param skillMetadata - Parsed skill metadata (may have source field)
   * @param sourceContent - Current content of the source research file, or null if missing
   * @returns StalenessResult indicating freshness state
   */
  checkStaleness(skillMetadata: SkillMetadata, sourceContent: string | null): StalenessResult {
    const skillName = skillMetadata.name;

    // Check if this is an auto-generated skill via the source field
    // (custom field added by ResearchCompressor, accessed via type assertion)
    const source = (skillMetadata as unknown as Record<string, unknown>).source;
    if (source !== 'auto-generated') {
      return {
        skillName,
        isStale: false,
        reason: 'not_auto_generated',
      };
    }

    // Extract generatedFrom from gsd-skill-creator extension
    const ext = getExtension(skillMetadata);
    const generatedFrom = (ext as Record<string, unknown>).generatedFrom as
      | GeneratedFrom
      | undefined;

    // No generatedFrom means we can't determine staleness -- treat as not auto-generated
    if (!generatedFrom) {
      return {
        skillName,
        isStale: false,
        reason: 'not_auto_generated',
      };
    }

    const expectedHash = generatedFrom.contentHash;
    const sourceFile = generatedFrom.sourceFile;

    // Source file is missing (deleted or moved)
    if (sourceContent === null) {
      return {
        skillName,
        isStale: true,
        reason: 'source_missing',
        sourceFile,
        expectedHash,
      };
    }

    // Compare hashes
    const actualHash = computeContentHash(sourceContent);
    if (actualHash !== expectedHash) {
      return {
        skillName,
        isStale: true,
        reason: 'hash_mismatch',
        sourceFile,
        expectedHash,
        actualHash,
      };
    }

    // Hashes match -- skill is fresh
    return {
      skillName,
      isStale: false,
      reason: 'fresh',
      sourceFile,
      expectedHash,
      actualHash,
    };
  }

  /**
   * Resolve a conflict between a manual skill and an auto-generated skill
   * with the same name. Manual always wins.
   *
   * @param manualSkill - The manually-created skill, or null
   * @param autoSkill - The auto-generated skill, or null
   * @returns ConflictResolution indicating which skill wins
   * @throws Error if neither skill is provided
   */
  resolveConflict(
    manualSkill: { name: string; source?: string } | null,
    autoSkill: { name: string; source: 'auto-generated' } | null
  ): ConflictResolution {
    if (!manualSkill && !autoSkill) {
      throw new Error('At least one skill must be provided');
    }

    // Both exist: manual always wins
    if (manualSkill && autoSkill) {
      return {
        skillName: manualSkill.name,
        winner: 'manual',
        reason: 'Manual skill takes precedence over auto-generated',
      };
    }

    // Only manual
    if (manualSkill) {
      return {
        skillName: manualSkill.name,
        winner: 'manual',
        reason: 'Only manual skill exists',
      };
    }

    // Only auto-generated
    return {
      skillName: autoSkill!.name,
      winner: 'auto-generated',
      reason: 'Only auto-generated skill exists',
    };
  }
}
