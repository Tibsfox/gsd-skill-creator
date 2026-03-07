/**
 * pack-session-driver.ts — R5.4: Pack Session Driver
 *
 * Connects the learn pipeline to wasteland newcomer pack phases.
 * Tracks which phases a rig has completed, validates checkpoints,
 * and provides next-phase guidance.
 *
 * The driver is stateless per call — session state is stored in
 * PatternStore so it survives across sessions.
 *
 * @module pack-session-driver
 */

import { PatternStore } from '../../core/storage/pattern-store.js';

/**
 * A phase completion record stored in PatternStore.
 */
export interface PhaseCompletion {
  packId: string;
  phaseId: string;
  handle: string;
  completedAt: string;
  checkpointsPassed: string[];
}

/**
 * Session progress for a rig through a pack.
 */
export interface PackProgress {
  packId: string;
  handle: string;
  completedPhases: string[];
  currentPhase: string | null;
  totalPhases: number;
  percentComplete: number;
}

/**
 * PackSessionDriver — tracks rig progress through educational pack phases.
 *
 * Uses PatternStore 'sessions' category to persist completion records.
 * Provides progress queries and checkpoint validation.
 */
export class PackSessionDriver {
  private store: PatternStore;

  constructor(store: PatternStore) {
    this.store = store;
  }

  /**
   * Record completion of a pack phase.
   */
  async completePhase(
    packId: string,
    phaseId: string,
    handle: string,
    checkpointsPassed: string[] = [],
  ): Promise<void> {
    await this.store.append('sessions', {
      source: 'wasteland',
      kind: 'phase-completion',
      packId,
      phaseId,
      handle,
      completedAt: new Date().toISOString(),
      checkpointsPassed,
    });
  }

  /**
   * Get a rig's progress through a pack.
   *
   * @param packId - Pack identifier
   * @param handle - Rig handle
   * @param phaseIds - Ordered list of all phase IDs in the pack
   */
  async getProgress(
    packId: string,
    handle: string,
    phaseIds: string[],
  ): Promise<PackProgress> {
    const patterns = await this.store.read('sessions');
    const completions = patterns
      .filter(p =>
        p.data['source'] === 'wasteland' &&
        p.data['kind'] === 'phase-completion' &&
        p.data['packId'] === packId &&
        p.data['handle'] === handle
      )
      .map(p => String(p.data['phaseId'] ?? ''));

    const completedSet = new Set(completions);
    const completedPhases = phaseIds.filter(id => completedSet.has(id));

    // Find the first uncompleted phase
    const currentPhase = phaseIds.find(id => !completedSet.has(id)) ?? null;

    return {
      packId,
      handle,
      completedPhases,
      currentPhase,
      totalPhases: phaseIds.length,
      percentComplete: phaseIds.length > 0
        ? Math.round((completedPhases.length / phaseIds.length) * 100)
        : 0,
    };
  }

  /**
   * Check if a specific phase has been completed.
   */
  async isPhaseComplete(packId: string, phaseId: string, handle: string): Promise<boolean> {
    const patterns = await this.store.read('sessions');
    return patterns.some(p =>
      p.data['source'] === 'wasteland' &&
      p.data['kind'] === 'phase-completion' &&
      p.data['packId'] === packId &&
      p.data['phaseId'] === phaseId &&
      p.data['handle'] === handle
    );
  }

  /**
   * Get all checkpoint results for a phase.
   */
  async getCheckpoints(packId: string, phaseId: string, handle: string): Promise<string[]> {
    const patterns = await this.store.read('sessions');
    const match = patterns.find(p =>
      p.data['source'] === 'wasteland' &&
      p.data['kind'] === 'phase-completion' &&
      p.data['packId'] === packId &&
      p.data['phaseId'] === phaseId &&
      p.data['handle'] === handle
    );

    if (!match) return [];
    const checkpoints = match.data['checkpointsPassed'];
    return Array.isArray(checkpoints) ? checkpoints.map(String) : [];
  }
}
