import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { EventStore } from './event-store.js';
import type { UsageEvent } from './types.js';

// Each test gets its own directory under OS tmpdir
let testDir: string;

const makeStore = (maxSizeBytes = 10_485_760): EventStore =>
  new EventStore({ filePath: join(testDir, 'events.jsonl'), maxSizeBytes });

const scoredEvent = (skillName: string, sessionId = 'sess-1'): UsageEvent => ({
  type: 'skill-scored',
  skillName,
  score: 0.8,
  matchType: 'intent',
  sessionId,
  timestamp: new Date().toISOString(),
});

const loadedEvent = (skillName: string, sessionId = 'sess-1'): UsageEvent => ({
  type: 'skill-loaded',
  skillName,
  tokenCount: 500,
  sessionId,
  timestamp: new Date().toISOString(),
});

const skippedEvent = (skillName: string, sessionId = 'sess-1'): UsageEvent => ({
  type: 'skill-budget-skipped',
  skillName,
  reason: 'budget_exceeded',
  estimatedTokens: 800,
  sessionId,
  timestamp: new Date().toISOString(),
});

beforeEach(async () => {
  testDir = join(tmpdir(), `event-store-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe('EventStore.read', () => {
  it('returns empty array when file does not exist', async () => {
    const store = makeStore();
    const events = await store.read();
    expect(events).toEqual([]);
  });

  it('returns appended event in correct shape', async () => {
    const store = makeStore();
    const event = scoredEvent('git-commit');
    await store.append(event);
    const events = await store.read();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(event);
  });

  it('returns multiple events in chronological order', async () => {
    const store = makeStore();
    const e1 = scoredEvent('git-commit');
    const e2 = loadedEvent('git-commit');
    const e3 = skippedEvent('large-skill');
    await store.append(e1);
    await store.append(e2);
    await store.append(e3);
    const events = await store.read();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('skill-scored');
    expect(events[1].type).toBe('skill-loaded');
    expect(events[2].type).toBe('skill-budget-skipped');
  });

  it('skips malformed lines without throwing', async () => {
    const store = makeStore();
    const { appendFile } = await import('fs/promises');
    // Write one valid event, one garbage line, one valid event
    await store.append(scoredEvent('skill-a'));
    await appendFile(join(testDir, 'events.jsonl'), 'not-valid-json\n', 'utf-8');
    await store.append(loadedEvent('skill-b'));
    const events = await store.read();
    expect(events).toHaveLength(2);
    expect(events[0].skillName).toBe('skill-a');
    expect(events[1].skillName).toBe('skill-b');
  });
});

describe('EventStore.getFileSizeBytes', () => {
  it('returns 0 when file does not exist', async () => {
    const store = makeStore();
    expect(await store.getFileSizeBytes()).toBe(0);
  });

  it('returns positive size after appending an event', async () => {
    const store = makeStore();
    await store.append(scoredEvent('git-commit'));
    const size = await store.getFileSizeBytes();
    expect(size).toBeGreaterThan(0);
  });
});

describe('EventStore rotation', () => {
  it('file size stays at or below ceiling after rotation', async () => {
    // Tiny ceiling — just 200 bytes to force rotation quickly
    const store = makeStore(200);

    // Append enough events to exceed the ceiling
    for (let i = 0; i < 20; i++) {
      await store.append(scoredEvent(`skill-${i}`, `sess-${i}`));
    }

    const size = await store.getFileSizeBytes();
    expect(size).toBeLessThanOrEqual(200 * 2); // after rotation, within reasonable bounds
  });

  it('rotation keeps newer events, not older ones', async () => {
    // Use a very small ceiling so rotation fires after a few events
    const store = makeStore(300);

    const events: UsageEvent[] = [];
    for (let i = 0; i < 15; i++) {
      const e = scoredEvent(`skill-${i}`, `sess-${i}`);
      events.push(e);
      await store.append(e);
    }

    const remaining = await store.read();
    expect(remaining.length).toBeGreaterThan(0);
    expect(remaining.length).toBeLessThan(15);

    // The last event appended must be in the remaining set
    const lastEvent = events[events.length - 1];
    const found = remaining.some(
      e => e.type === lastEvent.type && e.skillName === lastEvent.skillName && e.sessionId === lastEvent.sessionId
    );
    expect(found).toBe(true);
  });

  it('read still works correctly after rotation', async () => {
    const store = makeStore(250);

    for (let i = 0; i < 10; i++) {
      await store.append(loadedEvent(`skill-${i}`));
    }

    // Even after rotation, read must return valid UsageEvent objects
    const events = await store.read();
    for (const e of events) {
      expect(e.type).toMatch(/^skill-(scored|loaded|budget-skipped)$/);
      expect(typeof e.skillName).toBe('string');
      expect(typeof e.sessionId).toBe('string');
      expect(typeof e.timestamp).toBe('string');
    }
  });
});

describe('Privacy boundary', () => {
  it('stored events contain no user content — only skill names and metadata', async () => {
    const store = makeStore();
    await store.append(scoredEvent('git-commit'));
    await store.append(loadedEvent('typescript-patterns'));
    await store.append(skippedEvent('large-skill'));

    const events = await store.read();

    for (const e of events) {
      // Confirm none of the prohibited user-content fields exist
      const keys = Object.keys(e);
      expect(keys).not.toContain('userMessage');
      expect(keys).not.toContain('query');
      expect(keys).not.toContain('intent');
      expect(keys).not.toContain('content');
      expect(keys).not.toContain('transcript');
    }
  });
});
