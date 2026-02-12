import { diffWords } from 'diff';
import matter from 'gray-matter';
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
 * Extract body content from raw skill file content (strips frontmatter).
 */
function extractBody(rawContent: string): string {
  try {
    const parsed = matter(rawContent);
    return parsed.content.trim();
  } catch {
    // If frontmatter parsing fails, treat entire content as body
    return rawContent.trim();
  }
}

/**
 * Compute drift percentage between two content strings using word-level diff.
 * Returns percentage of characters that changed relative to original length.
 */
function computeDriftPercent(original: string, current: string): number {
  if (!original && !current) return 0;
  if (!original) return current.length > 0 ? 100 : 0;

  const changes = diffWords(original, current);

  let addedChars = 0;
  let removedChars = 0;

  for (const change of changes) {
    if (change.added) {
      addedChars += change.value.length;
    } else if (change.removed) {
      removedChars += change.value.length;
    }
  }

  const changedChars = addedChars + removedChars;
  const driftPercent = (changedChars / original.length) * 100;

  // Round to 1 decimal place
  return Math.round(driftPercent * 10) / 10;
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
    const history = await this.versionManager.getHistory(skillName);

    // No history or single version: no drift possible
    if (history.length <= 1) {
      return {
        originalContent: '',
        currentContent: '',
        cumulativeDriftPercent: 0,
        thresholdExceeded: false,
        threshold: DEFAULT_DRIFT_THRESHOLD,
      };
    }

    // Get original content from oldest commit (last in the array, since history is newest-first)
    const oldestHash = history[history.length - 1].hash;
    const rawOriginal = await this.versionManager.getVersionContent(skillName, oldestHash);
    const originalBody = extractBody(rawOriginal);

    // Get current content from disk
    const skill = await this.skillStore.read(skillName);
    const currentBody = skill.body;

    const driftPercent = computeDriftPercent(originalBody, currentBody);

    return {
      originalContent: originalBody,
      currentContent: currentBody,
      cumulativeDriftPercent: driftPercent,
      thresholdExceeded: false,
      threshold: DEFAULT_DRIFT_THRESHOLD,
    };
  }

  /**
   * Check if cumulative drift exceeds the given threshold.
   */
  async checkThreshold(skillName: string, threshold?: number): Promise<DriftResult> {
    const result = await this.computeDrift(skillName);
    const effectiveThreshold = threshold ?? DEFAULT_DRIFT_THRESHOLD;

    return {
      ...result,
      threshold: effectiveThreshold,
      thresholdExceeded: result.cumulativeDriftPercent >= effectiveThreshold,
    };
  }

  /**
   * Compute projected drift with hypothetical new content (without reading current from disk).
   */
  async computeDriftWithContent(skillName: string, projectedContent: string): Promise<DriftResult> {
    const history = await this.versionManager.getHistory(skillName);

    // No history or single version: no drift possible
    if (history.length <= 1) {
      return {
        originalContent: '',
        currentContent: projectedContent,
        cumulativeDriftPercent: 0,
        thresholdExceeded: false,
        threshold: DEFAULT_DRIFT_THRESHOLD,
      };
    }

    // Get original content from oldest commit
    const oldestHash = history[history.length - 1].hash;
    const rawOriginal = await this.versionManager.getVersionContent(skillName, oldestHash);
    const originalBody = extractBody(rawOriginal);

    const driftPercent = computeDriftPercent(originalBody, projectedContent);

    return {
      originalContent: originalBody,
      currentContent: projectedContent,
      cumulativeDriftPercent: driftPercent,
      thresholdExceeded: driftPercent >= DEFAULT_DRIFT_THRESHOLD,
      threshold: DEFAULT_DRIFT_THRESHOLD,
    };
  }
}
