import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DashboardBridge } from '../../../../src/dogfood/harness/dashboard-bridge.js';
import { ProgressTracker } from '../../../../src/dogfood/harness/progress-tracker.js';
import { MetricsCollector } from '../../../../src/dogfood/harness/metrics-collector.js';
import type { ChapterMetrics } from '../../../../src/dogfood/harness/types.js';

function createChapterMetrics(
  overrides: Partial<ChapterMetrics> = {},
): ChapterMetrics {
  return {
    chapter: 1,
    part: 1,
    chunksGenerated: 5,
    conceptsDetected: 3,
    mathDensity: 0.4,
    tokensUsed: 1500,
    processingTimeMs: 2000,
    errorsEncountered: 0,
    gapsFound: 1,
    ...overrides,
  };
}

describe('DashboardBridge', () => {
  let tempDir: string;
  let outboxDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dashboard-test-'));
    outboxDir = path.join(tempDir, 'outbox', 'status');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes valid JSON to outbox path', () => {
    const bridge = new DashboardBridge(outboxDir);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    bridge.update(tracker, collector);

    const filePath = path.join(outboxDir, 'v1.40-ingestion.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const raw = fs.readFileSync(filePath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('JSON contains expected dashboard fields', () => {
    const bridge = new DashboardBridge(outboxDir);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    bridge.update(tracker, collector);

    const filePath = path.join(outboxDir, 'v1.40-ingestion.json');
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(payload.currentWave).toBeTypeOf('string');
    expect(payload.chapterProgress).toBeDefined();
    expect(payload.chapterProgress.completed).toBeTypeOf('number');
    expect(payload.chapterProgress.total).toBeTypeOf('number');
    expect(payload.tokenBudget).toBeDefined();
    expect(payload.tokenBudget.used).toBeTypeOf('number');
    expect(payload.tokenBudget.total).toBeTypeOf('number');
    expect(payload.conceptCount).toBeTypeOf('number');
    expect(payload.gapCount).toBeTypeOf('number');
    expect(payload.lastActivity).toBeTypeOf('string');
    expect(payload.errorCount).toBeTypeOf('number');
    expect(
      payload.lastError === null || typeof payload.lastError === 'string',
    ).toBe(true);
  });

  it('uses atomic write (no partial files)', () => {
    const bridge = new DashboardBridge(outboxDir);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    bridge.update(tracker, collector);

    const files = fs.readdirSync(outboxDir);
    const tmpFiles = files.filter((f) => f.endsWith('.tmp'));
    expect(tmpFiles).toHaveLength(0);

    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    expect(jsonFiles).toHaveLength(1);
    expect(jsonFiles[0]).toBe('v1.40-ingestion.json');
  });

  it('reflects progress tracker state in output', () => {
    const bridge = new DashboardBridge(outboxDir);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    tracker.updateExtraction({
      chaptersExtracted: 17,
      status: 'running',
    });

    bridge.update(tracker, collector);

    const filePath = path.join(outboxDir, 'v1.40-ingestion.json');
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(payload.chapterProgress.completed).toBe(17);
    expect(payload.chapterProgress.total).toBe(33);
  });

  it('reflects metrics in output', () => {
    const bridge = new DashboardBridge(outboxDir);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    collector.recordChapter(createChapterMetrics({ tokensUsed: 3000 }));
    collector.recordChapter(createChapterMetrics({ tokensUsed: 7000 }));

    bridge.update(tracker, collector);

    const filePath = path.join(outboxDir, 'v1.40-ingestion.json');
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(payload.tokenBudget.used).toBe(10000);
  });

  it('handles first update with no data', () => {
    const bridge = new DashboardBridge(outboxDir);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    bridge.update(tracker, collector);

    const filePath = path.join(outboxDir, 'v1.40-ingestion.json');
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    expect(payload.chapterProgress.completed).toBe(0);
    expect(payload.tokenBudget.used).toBe(0);
    expect(payload.conceptCount).toBe(0);
    expect(payload.gapCount).toBe(0);
    expect(payload.errorCount).toBe(0);
    expect(payload.lastError).toBeNull();
  });

  it('creates outbox directory if it does not exist', () => {
    const deepOutbox = path.join(
      tempDir,
      'deep',
      'nested',
      'outbox',
      'status',
    );
    const bridge = new DashboardBridge(deepOutbox);
    const tracker = ProgressTracker.create();
    const collector = new MetricsCollector();

    bridge.update(tracker, collector);

    const filePath = path.join(deepOutbox, 'v1.40-ingestion.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(payload.currentWave).toBeTypeOf('string');
  });
});
