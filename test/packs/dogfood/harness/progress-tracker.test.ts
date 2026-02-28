import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProgressTracker } from '../../../../src/packs/dogfood/harness/progress-tracker.js';

describe('ProgressTracker', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates initial progress state', () => {
    const tracker = ProgressTracker.create();
    const state = tracker.getState();

    expect(state.missionId).toBe('v1.40');
    expect(state.extraction.status).toBe('pending');
    expect(state.extraction.chaptersExtracted).toBe(0);
    expect(state.extraction.chunksGenerated).toBe(0);
    expect(state.extraction.totalPages).toBe(0);
    expect(state.extraction.errors).toEqual([]);
    expect(state.learning.trackA.status).toBe('pending');
    expect(state.learning.trackB.status).toBe('pending');
    expect(state.verification.status).toBe('pending');
    expect(state.refinement.status).toBe('pending');
    expect(state.startedAt).toBeTruthy();
    expect(state.lastUpdatedAt).toBeTruthy();
  });

  it('updates extraction progress', () => {
    const tracker = ProgressTracker.create();
    const beforeUpdate = tracker.getState().lastUpdatedAt;

    // Small delay to ensure timestamp changes
    tracker.updateExtraction({
      chaptersExtracted: 5,
      chunksGenerated: 42,
      totalPages: 150,
      status: 'running',
    });

    const state = tracker.getState();
    expect(state.extraction.chaptersExtracted).toBe(5);
    expect(state.extraction.chunksGenerated).toBe(42);
    expect(state.extraction.totalPages).toBe(150);
    expect(state.extraction.status).toBe('running');
  });

  it('updates learning track A progress', () => {
    const tracker = ProgressTracker.create();

    tracker.updateLearningTrack('trackA', {
      currentChapter: 3,
      chunksProcessed: 10,
      conceptsLearned: 5,
      tokensUsed: 5000,
      status: 'running',
    });

    const state = tracker.getState();
    expect(state.learning.trackA.currentChapter).toBe(3);
    expect(state.learning.trackA.chunksProcessed).toBe(10);
    expect(state.learning.trackA.conceptsLearned).toBe(5);
    expect(state.learning.trackA.tokensUsed).toBe(5000);
    expect(state.learning.trackA.status).toBe('running');
  });

  it('calculates overall percentage', () => {
    const tracker = ProgressTracker.create();

    // Set extraction complete (33/33 chapters) — weight: 20%
    tracker.updateExtraction({
      chaptersExtracted: 33,
      status: 'complete',
    });

    // Set trackA complete (17/17 chapters done, all chunks) — weight: 25%
    tracker.updateLearningTrack('trackA', {
      chunksProcessed: 100,
      chunksTotal: 100,
      status: 'complete',
    });

    // Set trackB not started — weight: 25% (0%)
    // Verification and refinement pending — weight: 15% + 15% (0%)

    const pct = tracker.getOverallPercentage();
    // Extraction: 20% * (33/33) = 20
    // TrackA: 25% * (100/100) = 25
    // TrackB: 25% * 0 = 0
    // Verification: 15% * 0 = 0
    // Refinement: 15% * 0 = 0
    // Total: 45
    expect(pct).toBeCloseTo(45.0, 1);
  });

  it('serializes and deserializes state', () => {
    const tracker = ProgressTracker.create();
    tracker.updateExtraction({ chaptersExtracted: 10, status: 'running' });

    const json = tracker.toJSON();
    expect(() => JSON.parse(json)).not.toThrow();

    const restored = ProgressTracker.fromJSON(json);
    const original = tracker.getState();
    const restoredState = restored.getState();

    expect(restoredState.missionId).toBe(original.missionId);
    expect(restoredState.extraction.chaptersExtracted).toBe(original.extraction.chaptersExtracted);
    expect(restoredState.extraction.status).toBe(original.extraction.status);
  });

  it('saves and loads from disk', () => {
    const tracker = ProgressTracker.create();
    tracker.updateExtraction({ chaptersExtracted: 15, status: 'running' });
    tracker.updateLearningTrack('trackB', { conceptsLearned: 7, status: 'running' });

    const filePath = path.join(tempDir, 'progress.json');
    tracker.save(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    // No temp file should remain
    expect(fs.existsSync(filePath + '.tmp')).toBe(false);

    const loaded = ProgressTracker.load(filePath);
    const state = loaded.getState();

    expect(state.extraction.chaptersExtracted).toBe(15);
    expect(state.extraction.status).toBe('running');
    expect(state.learning.trackB.conceptsLearned).toBe(7);
    expect(state.learning.trackB.status).toBe('running');
  });
});
