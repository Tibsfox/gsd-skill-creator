import { VersionManager } from './version-manager.js';
import { SkillStore } from '../storage/skill-store.js';
import { DriftResult, DEFAULT_DRIFT_THRESHOLD } from '../types/learning.js';

/**
 * DriftThresholdError is thrown when cumulative drift exceeds the allowed threshold.
 */
export class DriftThresholdError extends Error {
  public readonly driftResult: DriftResult;

  constructor(driftResult: DriftResult) {
    super(
      `Cumulative drift (${driftResult.cumulativeDriftPercent}%) exceeds threshold (${driftResult.threshold}%). Automatic refinement halted.`
    );
    this.name = 'DriftThresholdError';
    this.driftResult = driftResult;
  }
}

/**
 * DriftTracker computes cumulative content drift from the original skill version.
 * Used to enforce LRN-01 (track cumulative change) and LRN-02 (halt at 60% drift).
 */
export class DriftTracker {
  private versionManager: VersionManager;
  private skillStore: SkillStore;

  constructor(versionManager: VersionManager, skillStore: SkillStore) {
    this.versionManager = versionManager;
    this.skillStore = skillStore;
  }

  /**
   * Compute cumulative drift from original skill content to current content.
   */
  async computeDrift(skillName: string): Promise<DriftResult> {
    throw new Error('Not implemented');
  }

  /**
   * Check if cumulative drift exceeds the given threshold.
   */
  async checkThreshold(skillName: string, threshold?: number): Promise<DriftResult> {
    throw new Error('Not implemented');
  }

  /**
   * Compute projected drift with hypothetical new content (without reading current from disk).
   */
  async computeDriftWithContent(skillName: string, projectedContent: string): Promise<DriftResult> {
    throw new Error('Not implemented');
  }
}
