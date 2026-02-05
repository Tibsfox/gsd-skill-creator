import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { FeedbackStore } from './feedback-store.js';
import { FeedbackEvent } from '../types/learning.js';

describe('FeedbackStore', () => {
  const testDir = join(tmpdir(), `feedback-store-test-${Date.now()}`);

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('record', () => {
    it('should record a feedback event with auto-generated id and timestamp', async () => {
      const store = new FeedbackStore(testDir);

      const event = await store.record({
        type: 'correction',
        skillName: 'test-skill',
        sessionId: 'session-1',
        original: 'hello',
        corrected: 'Hello World',
      });

      expect(event.id).toBeDefined();
      expect(event.id.length).toBe(36); // UUID format
      expect(event.timestamp).toBeDefined();
      expect(new Date(event.timestamp).getTime()).toBeGreaterThan(0);
      expect(event.skillName).toBe('test-skill');
    });

    it('should persist event to JSONL file', async () => {
      const store = new FeedbackStore(testDir);

      await store.record({
        type: 'correction',
        skillName: 'test-skill',
        sessionId: 'session-1',
        original: 'test',
        corrected: 'TEST',
      });

      const content = await readFile(join(testDir, 'feedback.jsonl'), 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.skillName).toBe('test-skill');
      expect(parsed.type).toBe('correction');
    });

    it('should append multiple events', async () => {
      const store = new FeedbackStore(testDir);

      await store.record({ type: 'correction', skillName: 's1', sessionId: 'a', original: '', corrected: '' });
      await store.record({ type: 'override', skillName: 's2', sessionId: 'b', rejected: true });
      await store.record({ type: 'rating', skillName: 's1', sessionId: 'c', score: 5 });

      const all = await store.getAll();
      expect(all).toHaveLength(3);
    });
  });

  describe('getBySkill', () => {
    it('should filter events by skill name', async () => {
      const store = new FeedbackStore(testDir);

      await store.record({ type: 'correction', skillName: 'skill-a', sessionId: '1', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 'skill-b', sessionId: '2', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 'skill-a', sessionId: '3', original: '', corrected: '' });

      const skillA = await store.getBySkill('skill-a');
      expect(skillA).toHaveLength(2);
      expect(skillA.every(e => e.skillName === 'skill-a')).toBe(true);

      const skillB = await store.getBySkill('skill-b');
      expect(skillB).toHaveLength(1);
    });

    it('should return empty array for unknown skill', async () => {
      const store = new FeedbackStore(testDir);
      const events = await store.getBySkill('unknown');
      expect(events).toEqual([]);
    });
  });

  describe('getCorrections', () => {
    it('should filter to only correction events', async () => {
      const store = new FeedbackStore(testDir);

      await store.record({ type: 'correction', skillName: 'skill', sessionId: '1', original: 'a', corrected: 'b' });
      await store.record({ type: 'override', skillName: 'skill', sessionId: '2', rejected: true });
      await store.record({ type: 'rating', skillName: 'skill', sessionId: '3', score: 4 });
      await store.record({ type: 'correction', skillName: 'skill', sessionId: '4', original: 'c', corrected: 'd' });

      const corrections = await store.getCorrections('skill');
      expect(corrections).toHaveLength(2);
      expect(corrections.every(e => e.type === 'correction')).toBe(true);
    });
  });

  describe('getSince', () => {
    it('should filter events by timestamp', async () => {
      const store = new FeedbackStore(testDir);

      // Record events with slight delays
      await store.record({ type: 'correction', skillName: 'skill', sessionId: '1', original: '', corrected: '' });

      // Delay to ensure midPoint is strictly after first event's timestamp
      await new Promise(r => setTimeout(r, 10));
      const midPoint = new Date().toISOString();
      await new Promise(r => setTimeout(r, 10));

      await store.record({ type: 'correction', skillName: 'skill', sessionId: '2', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 'skill', sessionId: '3', original: '', corrected: '' });

      const recent = await store.getSince(midPoint);
      expect(recent).toHaveLength(2);
    });

    it('should optionally filter by skill', async () => {
      const store = new FeedbackStore(testDir);

      const start = new Date().toISOString();
      await store.record({ type: 'correction', skillName: 'skill-a', sessionId: '1', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 'skill-b', sessionId: '2', original: '', corrected: '' });

      const filtered = await store.getSince(start, 'skill-a');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].skillName).toBe('skill-a');
    });
  });

  describe('count', () => {
    it('should count all events', async () => {
      const store = new FeedbackStore(testDir);

      await store.record({ type: 'correction', skillName: 's1', sessionId: '1', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 's2', sessionId: '2', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 's1', sessionId: '3', original: '', corrected: '' });

      expect(await store.count()).toBe(3);
    });

    it('should count events for specific skill', async () => {
      const store = new FeedbackStore(testDir);

      await store.record({ type: 'correction', skillName: 's1', sessionId: '1', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 's2', sessionId: '2', original: '', corrected: '' });
      await store.record({ type: 'correction', skillName: 's1', sessionId: '3', original: '', corrected: '' });

      expect(await store.count('s1')).toBe(2);
      expect(await store.count('s2')).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should return empty array for non-existent file', async () => {
      const store = new FeedbackStore(join(testDir, 'nonexistent'));
      const events = await store.getAll();
      expect(events).toEqual([]);
    });

    it('should skip corrupted lines', async () => {
      const store = new FeedbackStore(testDir);

      // Write file with valid and invalid JSON
      const content = `{"id":"1","timestamp":"2024-01-01","type":"correction","skillName":"s","sessionId":"x"}
this is not valid json
{"id":"2","timestamp":"2024-01-02","type":"correction","skillName":"s","sessionId":"y"}`;

      await mkdir(testDir, { recursive: true });
      await writeFile(join(testDir, 'feedback.jsonl'), content);

      const events = await store.getAll();
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('1');
      expect(events[1].id).toBe('2');
    });
  });

  describe('concurrent writes', () => {
    it('should handle multiple concurrent writes', async () => {
      const store = new FeedbackStore(testDir);

      // Fire off multiple writes concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          store.record({
            type: 'correction',
            skillName: 'skill',
            sessionId: `session-${i}`,
            original: '',
            corrected: '',
          })
        );
      }

      await Promise.all(promises);

      const events = await store.getAll();
      expect(events).toHaveLength(10);
    });
  });
});
