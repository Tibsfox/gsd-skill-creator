import { describe, it, expect, vi } from 'vitest';
import {
  checkChannel,
  checkAllChannels,
  createRateLimiter,
} from '../../src/upstream/monitor';
import type {
  ChannelConfig,
  ChannelState,
  RawChangeEvent,
} from '../../src/upstream/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeChannel(overrides: Partial<ChannelConfig> = {}): ChannelConfig {
  return {
    name: 'anthropic-docs',
    url: 'https://docs.anthropic.com',
    type: 'documentation',
    priority: 'P0',
    check_interval_hours: 6,
    domains: ['skills', 'agents'],
    ...overrides,
  };
}

function makeState(overrides: Partial<ChannelState> = {}): ChannelState {
  return {
    channel: 'anthropic-docs',
    last_hash: 'aaa111',
    last_checked: '2026-02-25T00:00:00Z',
    ...overrides,
  };
}

const CONTENT_A = '<html>version 1</html>';
const CONTENT_B = '<html>version 2</html>';
const HASH_A = 'sha256-aaa';
const HASH_B = 'sha256-bbb';

function makeDeps(overrides: Record<string, unknown> = {}) {
  const fetchFn = vi.fn<(url: string) => Promise<string>>().mockResolvedValue(CONTENT_A);
  const hashFn = vi.fn<(content: string) => string>().mockReturnValue(HASH_A);
  const readStateFn = vi.fn<(channel: string) => Promise<ChannelState | null>>().mockResolvedValue(null);
  const writeStateFn = vi.fn<(state: ChannelState) => Promise<void>>().mockResolvedValue(undefined);
  const writeCacheFn = vi.fn<(channel: string, latest: string, previous: string | null) => Promise<void>>().mockResolvedValue(undefined);

  return {
    fetchFn,
    hashFn,
    readStateFn,
    writeStateFn,
    writeCacheFn,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Channel Monitor', () => {
  describe('checkChannel', () => {
    it('fetches channel content via injectable FetchFn', async () => {
      const channel = makeChannel();
      const deps = makeDeps();

      await checkChannel(channel, deps);

      expect(deps.fetchFn).toHaveBeenCalledWith(channel.url);
    });

    it('computes SHA-256 hash of fetched content', async () => {
      const channel = makeChannel();
      const deps = makeDeps();

      await checkChannel(channel, deps);

      expect(deps.hashFn).toHaveBeenCalledWith(CONTENT_A);
    });

    it('detects change when hash differs from stored state', async () => {
      const channel = makeChannel();
      const state = makeState({ last_hash: HASH_A });
      const deps = makeDeps({
        hashFn: vi.fn().mockReturnValue(HASH_B),
        readStateFn: vi.fn().mockResolvedValue(state),
      });

      const event = await checkChannel(channel, deps);

      expect(event).not.toBeNull();
      expect(event!.content_hash_before).toBe(HASH_A);
      expect(event!.content_hash_after).toBe(HASH_B);
    });

    it('emits RawChangeEvent with correct fields on change', async () => {
      const channel = makeChannel();
      const state = makeState({ last_hash: HASH_A });
      const deps = makeDeps({
        hashFn: vi.fn().mockReturnValue(HASH_B),
        readStateFn: vi.fn().mockResolvedValue(state),
        fetchFn: vi.fn().mockResolvedValue(CONTENT_B),
      });

      const event = await checkChannel(channel, deps);

      expect(event).toBeDefined();
      expect(event!.id).toBeTruthy();
      expect(event!.channel).toBe('anthropic-docs');
      expect(event!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(event!.content_hash_before).toBe(HASH_A);
      expect(event!.content_hash_after).toBe(HASH_B);
      expect(event!.raw_content).toBe(CONTENT_B);
      expect(event!.diff_summary).toBeTruthy();
    });

    it('returns null when hash matches (no change)', async () => {
      const channel = makeChannel();
      const state = makeState({ last_hash: HASH_A });
      const deps = makeDeps({
        hashFn: vi.fn().mockReturnValue(HASH_A),
        readStateFn: vi.fn().mockResolvedValue(state),
      });

      const event = await checkChannel(channel, deps);

      expect(event).toBeNull();
    });

    it('writes updated state after checking', async () => {
      const channel = makeChannel();
      const deps = makeDeps();

      await checkChannel(channel, deps);

      expect(deps.writeStateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'anthropic-docs',
          last_hash: HASH_A,
          last_checked: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
      );
    });

    it('caches latest + previous content per channel', async () => {
      const channel = makeChannel();
      const state = makeState({ last_hash: HASH_A });
      const deps = makeDeps({
        hashFn: vi.fn().mockReturnValue(HASH_B),
        readStateFn: vi.fn().mockResolvedValue(state),
        fetchFn: vi.fn().mockResolvedValue(CONTENT_B),
      });

      await checkChannel(channel, deps);

      expect(deps.writeCacheFn).toHaveBeenCalledWith(
        'anthropic-docs',
        CONTENT_B,
        null,
      );
    });

    it('handles network failure gracefully', async () => {
      const channel = makeChannel();
      const deps = makeDeps({
        fetchFn: vi.fn().mockRejectedValue(new Error('Network timeout')),
      });

      const event = await checkChannel(channel, deps);

      expect(event).toBeNull();
    });

    it('treats first check (no stored state) as no change', async () => {
      const channel = makeChannel();
      const deps = makeDeps({
        readStateFn: vi.fn().mockResolvedValue(null),
      });

      const event = await checkChannel(channel, deps);

      // First check seeds state, does not emit event
      expect(event).toBeNull();
      expect(deps.writeStateFn).toHaveBeenCalled();
    });
  });

  describe('checkAllChannels', () => {
    it('checks multiple channels concurrently', async () => {
      const ch1 = makeChannel({ name: 'ch1', url: 'https://example.com/1' });
      const ch2 = makeChannel({ name: 'ch2', url: 'https://example.com/2' });
      const state1 = makeState({ channel: 'ch1', last_hash: HASH_A });
      const state2 = makeState({ channel: 'ch2', last_hash: HASH_A });

      const deps = makeDeps({
        hashFn: vi.fn().mockReturnValue(HASH_B),
        readStateFn: vi.fn()
          .mockResolvedValueOnce(state1)
          .mockResolvedValueOnce(state2),
        fetchFn: vi.fn().mockResolvedValue(CONTENT_B),
      });

      const events = await checkAllChannels([ch1, ch2], deps);

      expect(events).toHaveLength(2);
      expect(events[0].channel).toBe('ch1');
      expect(events[1].channel).toBe('ch2');
    });

    it('filters out channels with no changes', async () => {
      const ch1 = makeChannel({ name: 'ch1', url: 'https://example.com/1' });
      const ch2 = makeChannel({ name: 'ch2', url: 'https://example.com/2' });
      const state1 = makeState({ channel: 'ch1', last_hash: HASH_A });
      const state2 = makeState({ channel: 'ch2', last_hash: HASH_A });

      const deps = makeDeps({
        hashFn: vi.fn()
          .mockReturnValueOnce(HASH_B)    // ch1 changed
          .mockReturnValueOnce(HASH_A),   // ch2 same
        readStateFn: vi.fn()
          .mockResolvedValueOnce(state1)
          .mockResolvedValueOnce(state2),
        fetchFn: vi.fn().mockResolvedValue(CONTENT_B),
      });

      const events = await checkAllChannels([ch1, ch2], deps);

      expect(events).toHaveLength(1);
      expect(events[0].channel).toBe('ch1');
    });
  });

  describe('createRateLimiter', () => {
    it('allows requests under limit', () => {
      const limiter = createRateLimiter(10, 60_000);

      for (let i = 0; i < 10; i++) {
        expect(limiter.tryAcquire()).toBe(true);
      }
    });

    it('rejects requests over limit', () => {
      const limiter = createRateLimiter(3, 60_000);

      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);
    });

    it('resets after window expires', () => {
      const limiter = createRateLimiter(2, 100);

      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);

      // Simulate time passing by manipulating internal state
      vi.useFakeTimers();
      vi.advanceTimersByTime(150);

      expect(limiter.tryAcquire()).toBe(true);

      vi.useRealTimers();
    });
  });
});
