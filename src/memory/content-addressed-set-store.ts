/**
 * Content-addressed store backed by a multi-pool ArenaSet.
 *
 * Extends the ContentAddressedStore model with tier-aware allocation:
 * callers specify a tier hint per `put()`, and the store routes records
 * to the appropriate mmap-backed pool (Hot, Warm, Blob, Resident).
 *
 * # Grove integration
 *
 * Grove records map to arena tiers:
 * - **hot**: Bootstrap type records, frequently accessed schemas
 * - **warm**: Active namespace bindings, recently resolved names
 * - **blob**: Large payloads (skill code, research documents)
 * - **resident**: Structural records that survive every warm-start
 *
 * The policy sweep (via `arena.sweep()`) automatically promotes/demotes
 * chunks between tiers based on access patterns. The GC (via `arena.gc()`)
 * reclaims leaked crossfade targets after crashes.
 *
 * # Wire format
 *
 * Same as ContentAddressedStore: `[hash_len: u8][hash bytes][payload]`.
 * The tier is stored at the arena pool level, not in the wire format.
 *
 * @module memory/content-addressed-set-store
 */

import { createHash } from 'node:crypto';
import {
  type RustArenaSet,
  type SweepReport,
  type GcReport,
} from './rust-arena-set.js';
import { type TierKind } from './rust-arena.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SetStoreOptions {
  /** The initialized RustArenaSet instance. */
  arena: RustArenaSet;
  /** Default tier for `put()` when no tier hint is given. Defaults to 'blob'. */
  defaultTier?: TierKind;
  /** Which tiers to scan during index rebuild. Defaults to all configured tiers. */
  indexTiers?: TierKind[];
}

export interface SetPutResult {
  hash: string;
  chunkId: number;
  tier: TierKind;
  created: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function canonicalizeHash(hash: Uint8Array | string): string {
  if (typeof hash === 'string') {
    const h = hash.toLowerCase();
    if (!/^[0-9a-f]*$/.test(h) || h.length === 0 || h.length % 2 !== 0) {
      throw new Error(`ContentAddressedSetStore: invalid hex hash`);
    }
    return h;
  }
  let out = '';
  for (let i = 0; i < hash.length; i++) {
    out += hash[i].toString(16).padStart(2, '0');
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const n = hex.length / 2;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function encodePayload(hashBytes: Uint8Array, userBytes: Uint8Array): Uint8Array {
  if (hashBytes.length === 0 || hashBytes.length > 255) {
    throw new Error(`hash length must be 1..=255 bytes; got ${hashBytes.length}`);
  }
  const out = new Uint8Array(1 + hashBytes.length + userBytes.length);
  out[0] = hashBytes.length;
  out.set(hashBytes, 1);
  out.set(userBytes, 1 + hashBytes.length);
  return out;
}

function decodePayload(payload: Uint8Array): { hash: Uint8Array; bytes: Uint8Array } {
  if (payload.length < 1) throw new Error('empty chunk payload');
  const hashLen = payload[0];
  if (hashLen === 0 || payload.length < 1 + hashLen) {
    throw new Error(`corrupt chunk — hash_len=${hashLen}, total=${payload.length}`);
  }
  return {
    hash: payload.slice(1, 1 + hashLen),
    bytes: payload.slice(1 + hashLen),
  };
}

export function sha256(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha256').update(bytes).digest());
}

// ─── Store ──────────────────────────────────────────────────────────────────

/**
 * Index entry: maps a hex hash to (tier, chunk_id) so reads can go
 * directly to the right pool.
 */
interface IndexEntry {
  tier: TierKind;
  chunkId: number;
}

export class ContentAddressedSetStore {
  private readonly arena: RustArenaSet;
  private readonly defaultTier: TierKind;
  private readonly indexTiers: TierKind[];

  private hashIndex: Map<string, IndexEntry> = new Map();
  private indexLoaded = false;

  constructor(options: SetStoreOptions) {
    this.arena = options.arena;
    this.defaultTier = options.defaultTier ?? 'blob';
    this.indexTiers = options.indexTiers ?? ['hot', 'warm', 'blob', 'resident'];
  }

  // ─── Index ──────────────────────────────────────────────────────────────

  /**
   * Rebuild the hash index by scanning all configured tier pools.
   * For each tier, lists chunk IDs via `arena.listIds(tier)`, then
   * reads each chunk via `getHot` (zero-copy M9 path), parses the
   * hash prefix, and registers the entry.
   *
   * Chunks that can't be decoded as content-addressed entries are
   * silently skipped — other consumers may share the arena.
   */
  async loadIndex(): Promise<void> {
    this.hashIndex.clear();
    for (const tier of this.indexTiers) {
      let ids: number[];
      try {
        ids = await this.arena.listIds(tier);
      } catch {
        // Tier not configured in this ArenaSet — skip.
        continue;
      }
      for (const chunkId of ids) {
        try {
          const chunk = await this.arena.getHot(tier, chunkId);
          const decoded = decodePayload(chunk.payload);
          const hex = canonicalizeHash(decoded.hash);
          if (!this.hashIndex.has(hex)) {
            this.hashIndex.set(hex, { tier, chunkId });
          }
        } catch {
          // Skip chunks we can't decode.
        }
      }
    }
    this.indexLoaded = true;
  }

  isIndexLoaded(): boolean {
    return this.indexLoaded;
  }

  size(): number {
    return this.hashIndex.size;
  }

  // ─── Put ────────────────────────────────────────────────────────────────

  /**
   * Store `bytes` under `hash` in the specified tier. Deduplicates:
   * if the hash already exists, returns the existing entry.
   */
  async put(
    hash: Uint8Array | string,
    bytes: Uint8Array,
    tier?: TierKind,
  ): Promise<SetPutResult> {
    const hex = canonicalizeHash(hash);
    const existing = this.hashIndex.get(hex);
    if (existing) {
      return { hash: hex, chunkId: existing.chunkId, tier: existing.tier, created: false };
    }

    const targetTier = tier ?? this.defaultTier;
    const hashBytes = typeof hash === 'string' ? hexToBytes(hex) : hash;
    const payload = encodePayload(hashBytes, bytes);
    const chunkId = await this.arena.alloc(targetTier, payload);
    this.hashIndex.set(hex, { tier: targetTier, chunkId });

    return { hash: hex, chunkId, tier: targetTier, created: true };
  }

  /** Hash with SHA-256 and store. Convenience for callers that don't pre-hash. */
  async putAuto(bytes: Uint8Array, tier?: TierKind): Promise<SetPutResult> {
    const hash = sha256(bytes);
    return this.put(hash, bytes, tier);
  }

  // ─── Read ───────────────────────────────────────────────────────────────

  /** Fetch bytes by hash, or null if not present. Uses zero-copy hot path. */
  async getByHash(hash: Uint8Array | string): Promise<Uint8Array | null> {
    const hex = canonicalizeHash(hash);
    const entry = this.hashIndex.get(hex);
    if (!entry) return null;

    try {
      const chunk = await this.arena.getHot(entry.tier, entry.chunkId);
      const decoded = decodePayload(chunk.payload);
      if (canonicalizeHash(decoded.hash) !== hex) {
        this.hashIndex.delete(hex);
        return null;
      }
      return decoded.bytes;
    } catch {
      this.hashIndex.delete(hex);
      return null;
    }
  }

  async hasHash(hash: Uint8Array | string): Promise<boolean> {
    return this.hashIndex.has(canonicalizeHash(hash));
  }

  /**
   * Overwrite an existing entry by hash. Frees the old chunk, allocates
   * a new one in the same tier. If the hash isn't present, behaves like put.
   */
  async replaceByHash(
    hash: Uint8Array | string,
    bytes: Uint8Array,
    tier?: TierKind,
  ): Promise<SetPutResult> {
    const hex = canonicalizeHash(hash);
    const existing = this.hashIndex.get(hex);
    const targetTier = tier ?? existing?.tier ?? this.defaultTier;

    if (existing) {
      await this.arena.free(existing.tier, existing.chunkId);
      this.hashIndex.delete(hex);
    }

    const hashBytes = typeof hash === 'string' ? hexToBytes(hex) : hash;
    const payload = encodePayload(hashBytes, bytes);
    const chunkId = await this.arena.alloc(targetTier, payload);
    this.hashIndex.set(hex, { tier: targetTier, chunkId });

    return { hash: hex, chunkId, tier: targetTier, created: existing === undefined };
  }

  /**
   * Look up the arena chunk id for a hash without fetching the payload.
   */
  async chunkIdForHash(hash: Uint8Array | string): Promise<number | null> {
    return this.hashIndex.get(canonicalizeHash(hash))?.chunkId ?? null;
  }

  /**
   * Advisory prefetch — touch chunks to warm the arena cache.
   */
  async preload(hashes: Array<Uint8Array | string>): Promise<number> {
    let hits = 0;
    for (const h of hashes) {
      const entry = this.hashIndex.get(canonicalizeHash(h));
      if (entry) hits++;
    }
    return hits;
  }

  // ─── Delete ─────────────────────────────────────────────────────────────

  async removeByHash(hash: Uint8Array | string): Promise<boolean> {
    const hex = canonicalizeHash(hash);
    const entry = this.hashIndex.get(hex);
    if (!entry) return false;

    await this.arena.free(entry.tier, entry.chunkId);
    this.hashIndex.delete(hex);
    return true;
  }

  // ─── Enumerate ──────────────────────────────────────────────────────────

  async listHashes(): Promise<string[]> {
    return Array.from(this.hashIndex.keys());
  }

  async count(): Promise<number> {
    return this.hashIndex.size;
  }

  // ─── Arena operations (exposed for Grove lifecycle) ─────────────────────

  /** Run a policy sweep. Returns promote/demote/eviction counts. */
  async sweep(): Promise<SweepReport> {
    return this.arena.sweep();
  }

  /** Garbage-collect orphaned crossfade targets. */
  async gc(): Promise<GcReport> {
    return this.arena.gc();
  }

  /** Flush all pools, manifest, and crossfade registry to disk. */
  async flush(): Promise<void> {
    return this.arena.flush();
  }

  // ─── Direct index manipulation (for migration/import) ──────────────────

  /**
   * Register a known (hash, tier, chunkId) entry in the index without
   * allocating. Used during migration from the old single-arena store
   * or during import from a Grove export archive.
   */
  registerEntry(hash: string, tier: TierKind, chunkId: number): void {
    this.hashIndex.set(hash, { tier, chunkId });
  }
}
