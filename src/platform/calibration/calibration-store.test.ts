import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { CalibrationStore } from './calibration-store.js';
import type { CalibrationEventInput } from './calibration-types.js';

describe('CalibrationStore', () => {
  const testDir = join(tmpdir(), `calibration-store-test-${Date.now()}`);

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // Helper to create a valid event input
  const createEventInput = (
    overrides: Partial<CalibrationEventInput> = {}
  ): CalibrationEventInput => ({
    prompt: 'test prompt',
    skillScores: [
      { skillName: 'skill-a', similarity: 0.85, wouldActivate: true },
      { skillName: 'skill-b', similarity: 0.6, wouldActivate: false },
    ],
    activatedSkill: 'skill-a',
    outcome: 'continued',
    threshold: 0.75,
    ...overrides,
  });

  describe('record', () => {
    it('should record an event with auto-generated id and timestamp', async () => {
      const store = new CalibrationStore(testDir);

      const event = await store.record(createEventInput());

      expect(event.id).toBeDefined();
      expect(event.id.length).toBe(36); // UUID format
      expect(event.timestamp).toBeDefined();
      expect(new Date(event.timestamp).getTime()).toBeGreaterThan(0);
      expect(event.prompt).toBe('test prompt');
      expect(event.activatedSkill).toBe('skill-a');
    });

    it('should persist event to JSONL file', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ prompt: 'my test prompt' }));

      const content = await readFile(join(testDir, 'events.jsonl'), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.prompt).toBe('my test prompt');
      expect(parsed.skillScores).toHaveLength(2);
    });

    it('should append multiple events', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ prompt: 'prompt 1' }));
      await store.record(createEventInput({ prompt: 'prompt 2' }));
      await store.record(createEventInput({ prompt: 'prompt 3' }));

      const all = await store.getAll();
      expect(all).toHaveLength(3);
      expect(all[0].prompt).toBe('prompt 1');
      expect(all[1].prompt).toBe('prompt 2');
      expect(all[2].prompt).toBe('prompt 3');
    });

    it('should record event with null activatedSkill', async () => {
      const store = new CalibrationStore(testDir);

      const event = await store.record(
        createEventInput({
          activatedSkill: null,
          skillScores: [
            { skillName: 'skill-a', similarity: 0.5, wouldActivate: false },
          ],
        })
      );

      expect(event.activatedSkill).toBeNull();
    });

    it('should record event with optional sessionId', async () => {
      const store = new CalibrationStore(testDir);

      const event = await store.record(
        createEventInput({ sessionId: 'session-123' })
      );

      expect(event.sessionId).toBe('session-123');
    });
  });

  describe('updateOutcome', () => {
    it('should update outcome of existing event', async () => {
      const store = new CalibrationStore(testDir);

      const event = await store.record(
        createEventInput({ outcome: 'unknown' })
      );
      expect(event.outcome).toBe('unknown');

      const updated = await store.updateOutcome(event.id, 'corrected');
      expect(updated).toBe(true);

      const events = await store.getAll();
      expect(events[0].outcome).toBe('corrected');
    });

    it('should return false for non-existent event', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput());

      const updated = await store.updateOutcome(
        '00000000-0000-0000-0000-000000000000',
        'corrected'
      );
      expect(updated).toBe(false);
    });

    it('should preserve other events when updating', async () => {
      const store = new CalibrationStore(testDir);

      const event1 = await store.record(
        createEventInput({ prompt: 'first', outcome: 'unknown' })
      );
      await store.record(
        createEventInput({ prompt: 'second', outcome: 'continued' })
      );
      await store.record(
        createEventInput({ prompt: 'third', outcome: 'unknown' })
      );

      await store.updateOutcome(event1.id, 'corrected');

      const events = await store.getAll();
      expect(events).toHaveLength(3);
      expect(events[0].outcome).toBe('corrected');
      expect(events[1].outcome).toBe('continued');
      expect(events[2].outcome).toBe('unknown');
    });
  });

  describe('getAll', () => {
    it('should return all events', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ outcome: 'continued' }));
      await store.record(createEventInput({ outcome: 'corrected' }));
      await store.record(createEventInput({ outcome: 'unknown' }));

      const events = await store.getAll();
      expect(events).toHaveLength(3);
    });

    it('should return empty array for empty store', async () => {
      const store = new CalibrationStore(testDir);
      const events = await store.getAll();
      expect(events).toEqual([]);
    });
  });

  describe('getKnownOutcomes', () => {
    it('should filter out unknown outcomes', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ outcome: 'continued' }));
      await store.record(createEventInput({ outcome: 'unknown' }));
      await store.record(createEventInput({ outcome: 'corrected' }));
      await store.record(createEventInput({ outcome: 'unknown' }));

      const known = await store.getKnownOutcomes();
      expect(known).toHaveLength(2);
      expect(known.every(e => e.outcome !== 'unknown')).toBe(true);
    });

    it('should return empty array if all unknown', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ outcome: 'unknown' }));
      await store.record(createEventInput({ outcome: 'unknown' }));

      const known = await store.getKnownOutcomes();
      expect(known).toEqual([]);
    });
  });

  describe('count', () => {
    it('should count all events', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ outcome: 'continued' }));
      await store.record(createEventInput({ outcome: 'corrected' }));
      await store.record(createEventInput({ outcome: 'unknown' }));

      expect(await store.count()).toBe(3);
    });

    it('should count only known outcomes when filter enabled', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput({ outcome: 'continued' }));
      await store.record(createEventInput({ outcome: 'unknown' }));
      await store.record(createEventInput({ outcome: 'corrected' }));
      await store.record(createEventInput({ outcome: 'unknown' }));

      expect(await store.count(true)).toBe(2);
      expect(await store.count(false)).toBe(4);
    });

    it('should return 0 for empty store', async () => {
      const store = new CalibrationStore(testDir);
      expect(await store.count()).toBe(0);
      expect(await store.count(true)).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all events', async () => {
      const store = new CalibrationStore(testDir);

      await store.record(createEventInput());
      await store.record(createEventInput());
      await store.record(createEventInput());

      expect(await store.count()).toBe(3);

      await store.clear();

      expect(await store.count()).toBe(0);
      const events = await store.getAll();
      expect(events).toEqual([]);
    });

    it('should handle clearing empty store', async () => {
      const store = new CalibrationStore(testDir);

      await store.clear();

      expect(await store.count()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should return empty array for non-existent file', async () => {
      const store = new CalibrationStore(join(testDir, 'nonexistent'));
      const events = await store.getAll();
      expect(events).toEqual([]);
    });

    it('should skip corrupted lines', async () => {
      const store = new CalibrationStore(testDir);

      // Write file with valid and invalid JSON
      const validEvent = JSON.stringify({
        id: '11111111-1111-1111-1111-111111111111',
        timestamp: '2024-01-01T00:00:00.000Z',
        prompt: 'valid prompt',
        skillScores: [],
        activatedSkill: null,
        outcome: 'continued',
        threshold: 0.75,
      });
      const validEvent2 = JSON.stringify({
        id: '22222222-2222-2222-2222-222222222222',
        timestamp: '2024-01-02T00:00:00.000Z',
        prompt: 'valid prompt 2',
        skillScores: [],
        activatedSkill: null,
        outcome: 'corrected',
        threshold: 0.75,
      });

      const content = `${validEvent}
this is not valid json
${validEvent2}`;

      await mkdir(testDir, { recursive: true });
      await writeFile(join(testDir, 'events.jsonl'), content);

      const events = await store.getAll();
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('11111111-1111-1111-1111-111111111111');
      expect(events[1].id).toBe('22222222-2222-2222-2222-222222222222');
    });
  });

  describe('concurrent writes', () => {
    it('should handle multiple concurrent writes', async () => {
      const store = new CalibrationStore(testDir);

      // Fire off multiple writes concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          store.record(
            createEventInput({ prompt: `concurrent prompt ${i}` })
          )
        );
      }

      await Promise.all(promises);

      const events = await store.getAll();
      expect(events).toHaveLength(10);
    });
  });
});
