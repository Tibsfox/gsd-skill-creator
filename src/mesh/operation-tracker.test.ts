import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { OperationTracker } from './operation-tracker.js';
import type { SkillLifecycleState } from './operation-tracker.js';

describe('OperationTracker', () => {
  let skillDir: string;

  beforeEach(async () => {
    skillDir = await mkdtemp(join(tmpdir(), 'op-tracker-'));
  });

  afterEach(async () => {
    await rm(skillDir, { recursive: true, force: true });
  });

  it('new tracker starts in draft state', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    expect(tracker.getState()).toBe('draft');
  });

  it('advance(tested) transitions draft → tested', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');
    expect(tracker.getState()).toBe('tested');
  });

  it('advance(graded) transitions tested → graded', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');
    tracker.advance('graded');
    expect(tracker.getState()).toBe('graded');
  });

  it('invalid transition (draft → packaged) throws', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    expect(() => tracker.advance('packaged')).toThrow('Invalid transition');
  });

  it('getState() returns current state', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    expect(tracker.getState()).toBe('draft');
    tracker.advance('tested');
    expect(tracker.getState()).toBe('tested');
  });

  it('getHistory() returns transition log with timestamps', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');
    tracker.advance('graded');

    const history = tracker.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe('draft');
    expect(history[0].to).toBe('tested');
    expect(history[0].timestamp).toBeTruthy();
    expect(history[1].from).toBe('tested');
    expect(history[1].to).toBe('graded');
  });

  it('persists to and loads from .skill-status.json', async () => {
    const tracker1 = new OperationTracker(skillDir);
    await tracker1.load();
    tracker1.advance('tested');
    tracker1.advance('graded');
    await tracker1.save();

    // Verify file exists
    const content = await readFile(join(skillDir, '.skill-status.json'), 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.state).toBe('graded');

    // Load in new tracker
    const tracker2 = new OperationTracker(skillDir);
    await tracker2.load();
    expect(tracker2.getState()).toBe('graded');
    expect(tracker2.getHistory()).toHaveLength(2);
  });

  it('handles missing status file gracefully', async () => {
    const tracker = new OperationTracker(join(skillDir, 'nonexistent'));
    await tracker.load();
    expect(tracker.getState()).toBe('draft');
    expect(tracker.getHistory()).toHaveLength(0);
  });

  it('handles corrupt status file gracefully', async () => {
    await writeFile(join(skillDir, '.skill-status.json'), 'not json', 'utf-8');
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    expect(tracker.getState()).toBe('draft');
  });

  it('tested → optimized (skip grade) is valid', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');
    tracker.advance('optimized');
    expect(tracker.getState()).toBe('optimized');
  });

  it('optimized → packaged is valid', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');
    tracker.advance('optimized');
    tracker.advance('packaged');
    expect(tracker.getState()).toBe('packaged');
  });

  it('toJSON() returns serializable snapshot', async () => {
    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');

    const json = tracker.toJSON();
    expect(json.state).toBe('tested');
    expect(json.history).toHaveLength(1);
  });
});
