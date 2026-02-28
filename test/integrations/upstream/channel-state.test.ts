import { describe, it, expect } from 'vitest';
import type { ChannelState } from '../../../src/upstream/types';
import {
  saveChannelState,
  loadChannelState,
  loadAllChannelStates,
  updateHash,
  markChanged,
} from '../../../src/upstream/channel-state';
import type { ChannelStateDeps } from '../../../src/upstream/channel-state';

/** Helper: build a minimal ChannelState */
function makeState(overrides: Partial<ChannelState> = {}): ChannelState {
  return {
    channel: 'anthropic-docs',
    last_hash: 'abc123',
    last_checked: '2026-02-26T00:00:00Z',
    ...overrides,
  };
}

/** Helper: build deps with in-memory JSON file storage */
function makeDeps(overrides: Partial<ChannelStateDeps> = {}): ChannelStateDeps {
  const files = new Map<string, string>();

  return {
    readFile: async (path: string): Promise<string> => {
      const content = files.get(path);
      if (content === undefined) throw new Error(`ENOENT: ${path}`);
      return content;
    },
    writeFile: async (path: string, content: string): Promise<void> => {
      files.set(path, content);
    },
    exists: async (path: string): Promise<boolean> => files.has(path),
    ...overrides,
  };
}

describe('Channel State Persistence', () => {
  describe('saveChannelState', () => {
    it('persists state for a channel', async () => {
      const written = new Map<string, string>();
      const deps = makeDeps({
        readFile: async (): Promise<string> => JSON.stringify([]),
        writeFile: async (path: string, content: string): Promise<void> => {
          written.set(path, content);
        },
        exists: async (): Promise<boolean> => true,
      });

      const state = makeState();
      await saveChannelState('/data/states.json', state, deps);

      const key = Array.from(written.keys())[0];
      expect(key).toBe('/data/states.json');
      const parsed = JSON.parse(written.get(key!)!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].channel).toBe('anthropic-docs');
    });
  });

  describe('loadChannelState', () => {
    it('retrieves state by channel name', async () => {
      const states: ChannelState[] = [
        makeState({ channel: 'docs' }),
        makeState({ channel: 'releases' }),
      ];
      const deps = makeDeps({
        readFile: async (): Promise<string> => JSON.stringify(states),
        exists: async (): Promise<boolean> => true,
      });

      const result = await loadChannelState('/data/states.json', 'releases', deps);

      expect(result).not.toBeNull();
      expect(result!.channel).toBe('releases');
    });

    it('returns null for missing state file (no crash)', async () => {
      const deps = makeDeps({
        exists: async (): Promise<boolean> => false,
      });

      const result = await loadChannelState('/data/states.json', 'missing', deps);

      expect(result).toBeNull();
    });
  });

  describe('loadAllChannelStates', () => {
    it('returns all tracked channels', async () => {
      const states: ChannelState[] = [
        makeState({ channel: 'docs' }),
        makeState({ channel: 'releases' }),
        makeState({ channel: 'security' }),
      ];
      const deps = makeDeps({
        readFile: async (): Promise<string> => JSON.stringify(states),
        exists: async (): Promise<boolean> => true,
      });

      const result = await loadAllChannelStates('/data/states.json', deps);

      expect(result).toHaveLength(3);
      expect(result.map((s) => s.channel)).toEqual(['docs', 'releases', 'security']);
    });

    it('corrupted state file handled gracefully (returns empty array)', async () => {
      const deps = makeDeps({
        readFile: async (): Promise<string> => 'NOT_VALID_JSON{{{',
        exists: async (): Promise<boolean> => true,
      });

      const result = await loadAllChannelStates('/data/states.json', deps);

      expect(result).toEqual([]);
    });
  });

  describe('safety-critical invariants', () => {
    it('SC-12: state persists across sessions (write + read cycle)', async () => {
      const fileStore = new Map<string, string>();

      const deps = makeDeps({
        readFile: async (path: string): Promise<string> => {
          const content = fileStore.get(path);
          if (content === undefined) throw new Error(`ENOENT: ${path}`);
          return content;
        },
        writeFile: async (path: string, content: string): Promise<void> => {
          fileStore.set(path, content);
        },
        exists: async (path: string): Promise<boolean> => fileStore.has(path),
      });

      // Session 1: save state
      const state = makeState({ channel: 'docs', last_hash: 'session1-hash' });
      await saveChannelState('/data/states.json', state, deps);

      // Session 2: load state (fresh deps, same file store simulating persistence)
      const loaded = await loadChannelState('/data/states.json', 'docs', deps);

      expect(loaded).not.toBeNull();
      expect(loaded!.channel).toBe('docs');
      expect(loaded!.last_hash).toBe('session1-hash');
    });
  });

  describe('pure state transformers', () => {
    it('updateHash returns new state with updated hash and last_checked', () => {
      const state = makeState({ last_hash: 'old-hash', last_checked: '2026-01-01T00:00:00Z' });

      const updated = updateHash(state, 'new-hash');

      // Must return new object (immutability)
      expect(updated).not.toBe(state);
      expect(updated.last_hash).toBe('new-hash');
      expect(updated.last_checked).not.toBe('2026-01-01T00:00:00Z');
      // Original unchanged
      expect(state.last_hash).toBe('old-hash');
    });

    it('markChanged returns new state with updated last_changed', () => {
      const state = makeState({ last_changed: undefined });

      const updated = markChanged(state);

      // Must return new object (immutability)
      expect(updated).not.toBe(state);
      expect(updated.last_changed).toBeDefined();
      expect(typeof updated.last_changed).toBe('string');
      // Original unchanged
      expect(state.last_changed).toBeUndefined();
    });
  });
});
