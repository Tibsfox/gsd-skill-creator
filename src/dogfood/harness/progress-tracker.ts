import * as fs from 'fs';
import type { ProgressState, TrackProgress } from './types.js';

/**
 * Tracks the overall progress state of the v1.40 dogfood ingestion
 * pipeline across all four stages: extraction, learning, verification,
 * and refinement. Provides weighted percentage calculation and
 * atomic persistence.
 */
export class ProgressTracker {
  private state: ProgressState;

  private constructor(state: ProgressState) {
    this.state = state;
  }

  /**
   * Create a fresh tracker with all stages pending and zero counts.
   */
  static create(): ProgressTracker {
    const now = new Date().toISOString();
    const initialTrack: TrackProgress = {
      status: 'pending',
      currentPart: 0,
      currentChapter: 0,
      chunksProcessed: 0,
      chunksTotal: 0,
      conceptsLearned: 0,
      tokensUsed: 0,
      errors: [],
    };

    return new ProgressTracker({
      missionId: 'v1.40',
      startedAt: now,
      lastUpdatedAt: now,
      extraction: {
        status: 'pending',
        chaptersExtracted: 0,
        chunksGenerated: 0,
        totalPages: 0,
        errors: [],
      },
      learning: {
        trackA: { ...initialTrack },
        trackB: { ...initialTrack },
      },
      verification: {
        status: 'pending',
        conceptsVerified: 0,
        gapsFound: 0,
        gapsByType: {},
      },
      refinement: {
        status: 'pending',
        patchesGenerated: 0,
        ticketsGenerated: 0,
        skillsUpdated: 0,
        reportComplete: false,
      },
    });
  }

  /**
   * Update extraction stage fields.
   */
  updateExtraction(update: Partial<ProgressState['extraction']>): void {
    this.state.extraction = { ...this.state.extraction, ...update };
    this.state.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Update a specific learning track (trackA or trackB).
   */
  updateLearningTrack(
    track: 'trackA' | 'trackB',
    update: Partial<TrackProgress>,
  ): void {
    this.state.learning[track] = {
      ...this.state.learning[track],
      ...update,
    };
    this.state.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Update verification stage fields.
   */
  updateVerification(update: Partial<ProgressState['verification']>): void {
    this.state.verification = { ...this.state.verification, ...update };
    this.state.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Update refinement stage fields.
   */
  updateRefinement(update: Partial<ProgressState['refinement']>): void {
    this.state.refinement = { ...this.state.refinement, ...update };
    this.state.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Calculate overall pipeline progress as a weighted percentage (0-100).
   *
   * Weights:
   * - Extraction: 20% (chaptersExtracted / 33)
   * - Learning Track A: 25% (chunksProcessed / chunksTotal)
   * - Learning Track B: 25% (chunksProcessed / chunksTotal)
   * - Verification: 15% (complete = 1, else 0)
   * - Refinement: 15% (complete = 1, else 0)
   */
  getOverallPercentage(): number {
    const extractionPct = this.state.extraction.chaptersExtracted / 33;

    const trackAPct =
      this.state.learning.trackA.chunksTotal > 0
        ? this.state.learning.trackA.chunksProcessed /
          this.state.learning.trackA.chunksTotal
        : 0;

    const trackBPct =
      this.state.learning.trackB.chunksTotal > 0
        ? this.state.learning.trackB.chunksProcessed /
          this.state.learning.trackB.chunksTotal
        : 0;

    const verificationPct =
      this.state.verification.status === 'complete' ? 1 : 0;
    const refinementPct =
      this.state.refinement.status === 'complete' ? 1 : 0;

    const total =
      extractionPct * 20 +
      trackAPct * 25 +
      trackBPct * 25 +
      verificationPct * 15 +
      refinementPct * 15;

    return Math.round(total * 10) / 10;
  }

  /**
   * Return a deep copy of the current state.
   */
  getState(): ProgressState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Serialize state to a JSON string.
   */
  toJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Restore a tracker from a JSON string.
   */
  static fromJSON(json: string): ProgressTracker {
    const state: ProgressState = JSON.parse(json);
    return new ProgressTracker(state);
  }

  /**
   * Save state to disk using atomic write (temp + rename).
   */
  save(filePath: string): void {
    const json = this.toJSON();
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  }

  /**
   * Load a tracker from a file on disk.
   */
  static load(filePath: string): ProgressTracker {
    const json = fs.readFileSync(filePath, 'utf-8');
    return ProgressTracker.fromJSON(json);
  }
}
