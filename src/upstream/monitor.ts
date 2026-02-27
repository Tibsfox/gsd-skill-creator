import type { ChannelConfig, ChannelState, RawChangeEvent } from './types.js';

/* ------------------------------------------------------------------ */
/*  Injectable dependency types                                        */
/* ------------------------------------------------------------------ */

/** Fetches raw content from a URL */
export type FetchFn = (url: string) => Promise<string>;

/** Computes a hash of content (SHA-256 hex, etc.) */
export type HashFn = (content: string) => string;

/** Reads persisted channel state, or null if first check */
export type ReadStateFn = (channel: string) => Promise<ChannelState | null>;

/** Writes updated channel state after a check */
export type WriteStateFn = (state: ChannelState) => Promise<void>;

/** Caches latest + previous content for a channel */
export type WriteCacheFn = (channel: string, latest: string, previous: string | null) => Promise<void>;

/** All injectable dependencies for the monitor */
export interface MonitorDeps {
  fetchFn: FetchFn;
  hashFn: HashFn;
  readStateFn: ReadStateFn;
  writeStateFn: WriteStateFn;
  writeCacheFn: WriteCacheFn;
}

/* ------------------------------------------------------------------ */
/*  Rate limiter                                                       */
/* ------------------------------------------------------------------ */

export interface RateLimiter {
  tryAcquire(): boolean;
}

/**
 * Creates a sliding-window rate limiter.
 * Allows up to `maxRequests` within `windowMs` milliseconds.
 */
export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  const timestamps: number[] = [];

  return {
    tryAcquire(): boolean {
      const now = Date.now();
      // Evict timestamps outside the window
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxRequests) {
        return false;
      }
      timestamps.push(now);
      return true;
    },
  };
}

/* ------------------------------------------------------------------ */
/*  ID generation                                                      */
/* ------------------------------------------------------------------ */

let counter = 0;

function generateEventId(channel: string): string {
  counter += 1;
  const ts = Date.now().toString(36);
  return `evt-${channel}-${ts}-${counter}`;
}

/* ------------------------------------------------------------------ */
/*  Core monitor functions                                             */
/* ------------------------------------------------------------------ */

/**
 * Check a single channel for changes.
 *
 * 1. Fetch content via FetchFn
 * 2. Hash with HashFn
 * 3. Compare against stored state
 * 4. Emit RawChangeEvent if hash differs
 * 5. Update state and cache
 *
 * Returns null when there is no change, on first check (seed), or on error.
 */
export async function checkChannel(
  channel: ChannelConfig,
  deps: MonitorDeps,
): Promise<RawChangeEvent | null> {
  let content: string;

  try {
    content = await deps.fetchFn(channel.url);
  } catch {
    // Network failure — graceful degradation
    return null;
  }

  const newHash = deps.hashFn(content);
  const storedState = await deps.readStateFn(channel.name);
  const now = new Date().toISOString();

  // First check — seed state, no event
  if (storedState === null) {
    await deps.writeStateFn({
      channel: channel.name,
      last_hash: newHash,
      last_checked: now,
    });
    await deps.writeCacheFn(channel.name, content, null);
    return null;
  }

  const previousHash = storedState.last_hash;
  const changed = newHash !== previousHash;

  // Always update last_checked; update last_changed + hash only on change
  const updatedState: ChannelState = {
    channel: channel.name,
    last_hash: changed ? newHash : previousHash,
    last_checked: now,
    ...(changed ? { last_changed: now } : {}),
    ...(storedState.etag ? { etag: storedState.etag } : {}),
  };

  await deps.writeStateFn(updatedState);

  if (changed) {
    await deps.writeCacheFn(channel.name, content, null);

    const event: RawChangeEvent = {
      id: generateEventId(channel.name),
      channel: channel.name,
      timestamp: now,
      content_hash_before: previousHash,
      content_hash_after: newHash,
      diff_summary: `Content changed on ${channel.name} (${channel.type})`,
      raw_content: content,
    };

    return event;
  }

  return null;
}

/**
 * Check multiple channels concurrently.
 * Returns only channels that produced a RawChangeEvent.
 */
export async function checkAllChannels(
  channels: ChannelConfig[],
  deps: MonitorDeps,
): Promise<RawChangeEvent[]> {
  const results = await Promise.all(
    channels.map((ch) => checkChannel(ch, deps)),
  );

  return results.filter((r): r is RawChangeEvent => r !== null);
}
