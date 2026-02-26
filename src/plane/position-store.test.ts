/**
 * PositionStore tests -- RED phase.
 *
 * Tests for JSON persistence of skill positions at .claude/plane/positions.json.
 * Uses tmpdir() for filesystem isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { PositionStore } from './position-store.js';
import type { SkillPosition } from './types.js';

describe('PositionStore', () => {
  let tempDir: string;
  let filePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'position-store-'));
    filePath = join(tempDir, '.claude', 'plane', 'positions.json');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  function makePosition(overrides: Partial<SkillPosition> = {}): SkillPosition {
    return {
      theta: 0.5,
      radius: 0.3,
      angularVelocity: 0.1,
      lastUpdated: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  describe('load', () => {
    it('loading from non-existent file succeeds with empty map', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      expect(store.all().size).toBe(0);
    });

    it('loading from valid JSON file populates internal map', async () => {
      // Pre-write a valid file
      const data = {
        'skill-a': makePosition({ theta: 1.0 }),
        'skill-b': makePosition({ theta: 2.0 }),
      };
      await mkdir(join(tempDir, '.claude', 'plane'), { recursive: true });
      await writeFile(filePath, JSON.stringify(data), 'utf-8');

      const store = new PositionStore(filePath);
      await store.load();

      expect(store.all().size).toBe(2);
      const a = store.get('skill-a');
      expect(a).not.toBeNull();
      expect(a!.theta).toBeCloseTo(1.0);
    });

    it('loading from malformed JSON handles gracefully', async () => {
      await mkdir(join(tempDir, '.claude', 'plane'), { recursive: true });
      await writeFile(filePath, '{{not valid json', 'utf-8');

      const store = new PositionStore(filePath);
      // Should not throw
      await expect(store.load()).resolves.not.toThrow();
    });
  });

  describe('save', () => {
    it('creates directory tree if it does not exist', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      store.set('skill-x', makePosition());
      await store.save();

      const raw = await readFile(filePath, 'utf-8');
      expect(raw).toBeTruthy();
    });

    it('writes valid JSON to positions.json', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      store.set('skill-y', makePosition({ theta: 1.5 }));
      await store.save();

      const raw = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed['skill-y'].theta).toBeCloseTo(1.5);
    });

    it('round-trip: set, save, load new store, get returns identical position', async () => {
      const pos = makePosition({ theta: 0.789, radius: 0.456 });

      const store1 = new PositionStore(filePath);
      await store1.load();
      store1.set('round-trip', pos);
      await store1.save();

      const store2 = new PositionStore(filePath);
      await store2.load();
      const loaded = store2.get('round-trip');
      expect(loaded).not.toBeNull();
      expect(loaded!.theta).toBeCloseTo(pos.theta);
      expect(loaded!.radius).toBeCloseTo(pos.radius);
      expect(loaded!.angularVelocity).toBeCloseTo(pos.angularVelocity);
      expect(loaded!.lastUpdated).toBe(pos.lastUpdated);
    });
  });

  describe('get/set/remove', () => {
    it('get on unknown skillId returns null', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      expect(store.get('nonexistent')).toBeNull();
    });

    it('set then get returns the position', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      const pos = makePosition();
      store.set('my-skill', pos);
      expect(store.get('my-skill')).toEqual(pos);
    });

    it('set overwrites existing position', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      store.set('skill', makePosition({ theta: 1.0 }));
      store.set('skill', makePosition({ theta: 2.0 }));
      expect(store.get('skill')!.theta).toBeCloseTo(2.0);
    });

    it('remove deletes the position', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      store.set('removable', makePosition());
      expect(store.remove('removable')).toBe(true);
      expect(store.get('removable')).toBeNull();
    });

    it('remove returns false for non-existent key', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      expect(store.remove('no-such-key')).toBe(false);
    });
  });

  describe('all', () => {
    it('returns empty Map when no positions set', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      expect(store.all().size).toBe(0);
    });

    it('returns Map with all set positions', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      store.set('a', makePosition({ theta: 0.1 }));
      store.set('b', makePosition({ theta: 0.2 }));
      store.set('c', makePosition({ theta: 0.3 }));

      const all = store.all();
      expect(all.size).toBe(3);
      expect(all.get('b')!.theta).toBeCloseTo(0.2);
    });

    it('returned Map is a copy (mutations do not affect store)', async () => {
      const store = new PositionStore(filePath);
      await store.load();
      store.set('x', makePosition());

      const copy = store.all();
      copy.delete('x');
      expect(store.get('x')).not.toBeNull();
    });
  });

  describe('concurrent safety', () => {
    it('two rapid set+save cycles do not corrupt the file', async () => {
      const store = new PositionStore(filePath);
      await store.load();

      store.set('alpha', makePosition({ theta: 0.1 }));
      await store.save();

      store.set('beta', makePosition({ theta: 0.2 }));
      await store.save();

      const verifier = new PositionStore(filePath);
      await verifier.load();
      expect(verifier.get('alpha')).not.toBeNull();
      expect(verifier.get('beta')).not.toBeNull();
      expect(verifier.all().size).toBe(2);
    });
  });
});
