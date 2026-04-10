/**
 * Content-addressed store built on top of the Rust memory arena.
 *
 * A thin, hash-agnostic facade over `RustArena` that maps caller-supplied
 * content hashes to arena chunk ids. It gives us:
 *
 * - **Hash → bytes lookup** in O(1) via an in-memory Map (no arena scan
 *   after the startup index rebuild).
 * - **Automatic deduplication** — `put`-ing the same hash twice is a
 *   no-op on the arena side; only the first write allocates a chunk.
 * - **Warm-start index rebuild** via `loadIndex()`, which walks arena
 *   chunks and parses their hash prefix.
 * - **Hash agnosticism** — callers can store any hash up to 255 bytes
 *   (xxh3 8 B, SHA-256 32 B, Blake3 32 B, Unison base32 hashes ~52 B,
 *   and so on). The wire format is self-describing via a length byte.
 *
 * # Wire format
 *
 * Each chunk's payload is:
 *
 * ```text
 * offset  size    content
 * 0       1       hash_len (u8) — 1..=255
 * 1       N       hash bytes
 * 1+N     M       caller payload bytes
 * ```
 *
 * Keeping the hash inline with the payload makes `loadIndex()`
 * reconstructable from arena state alone — no sidecar files, no
 * recomputation (which would force the caller to choose a specific
 * hash function).
 *
 * # Uniqueness model
 *
 * The caller is responsible for ensuring that two distinct payloads
 * never map to the same hash. For cryptographic hashes (SHA-256,
 * Blake3) collisions are effectively impossible; for xxh3 collisions
 * are possible but unlikely below ~2^32 entries. If you `put` the same
 * hash twice with different bytes, the second call returns the first
 * chunk's id unchanged — we don't overwrite. Use `replaceByHash` if
 * you need mutation semantics.
 *
 * See `.planning/HANDOFF-ARTEMIS-II-SESSION-008.md` and the M7-M11
 * arena milestones for the substrate this builds on.
 *
 * @module memory/content-addressed-store
 */

import { createHash } from 'node:crypto';
import { RustArena, type TierKind } from './rust-arena.js';

// ─── Public types ───────────────────────────────────────────────────────────

export interface ContentAddressedStoreOptions {
  /**
   * The initialized RustArena instance. Caller owns `arena.init()` and
   * `arena.checkpoint()`.
   */
  arena: RustArena;
  /**
   * Which arena tier to use. Defaults to `'blob'` — the right choice
   * for arbitrary payloads. Use `'resident'` for long-lived content
   * you want to survive every checkpoint cycle cheaply.
   */
  tier?: TierKind;
}

export interface PutResult {
  /** The hex-encoded hash used as the lookup key. */
  hash: string;
  /** The arena chunk id backing this entry. Stable for the lifetime of the arena. */
  chunkId: number;
  /** True if this put allocated a new chunk; false if the hash already existed. */
  created: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize a hash into its canonical hex string form. Accepts either a
 * `Uint8Array` (raw bytes) or a string (already hex-encoded). The output
 * is always lowercase hex so it's safe to use as a Map key.
 */
export function canonicalizeHash(hash: Uint8Array | string): string {
  if (typeof hash === 'string') {
    const h = hash.toLowerCase();
    if (!/^[0-9a-f]*$/.test(h)) {
      throw new Error(`ContentAddressedStore: hash string must be hex; got ${hash.slice(0, 16)}...`);
    }
    if (h.length === 0 || h.length % 2 !== 0) {
      throw new Error(`ContentAddressedStore: hex hash must have even length; got length ${h.length}`);
    }
    return h;
  }
  // Uint8Array → lowercase hex.
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
    throw new Error(
      `ContentAddressedStore: hash length must be 1..=255 bytes; got ${hashBytes.length}`
    );
  }
  const out = new Uint8Array(1 + hashBytes.length + userBytes.length);
  out[0] = hashBytes.length;
  out.set(hashBytes, 1);
  out.set(userBytes, 1 + hashBytes.length);
  return out;
}

interface DecodedPayload {
  hash: Uint8Array;
  bytes: Uint8Array;
}

function decodePayload(payload: Uint8Array): DecodedPayload {
  if (payload.length < 1) {
    throw new Error('ContentAddressedStore: empty chunk payload');
  }
  const hashLen = payload[0];
  if (hashLen === 0 || payload.length < 1 + hashLen) {
    throw new Error(
      `ContentAddressedStore: corrupt chunk — hash_len=${hashLen}, total=${payload.length}`
    );
  }
  return {
    hash: payload.slice(1, 1 + hashLen),
    bytes: payload.slice(1 + hashLen),
  };
}

// ─── Store ──────────────────────────────────────────────────────────────────

export class ContentAddressedStore {
  private readonly arena: RustArena;
  private readonly tier: TierKind;

  /** hex(hash) → arena chunk id */
  private hashIndex: Map<string, number> = new Map();

  private indexLoaded = false;

  constructor(options: ContentAddressedStoreOptions) {
    this.arena = options.arena;
    this.tier = options.tier ?? 'blob';
  }

  // ─── Index management ────────────────────────────────────────────────────

  /**
   * Rebuild the hash→chunk_id index by walking every allocated chunk in
   * the arena and parsing its payload prefix. Idempotent. O(N). Call
   * once at startup after `arena.init()`.
   *
   * Chunks whose payloads can't be decoded as content-addressed entries
   * are silently skipped — this lets a single arena host both
   * ContentAddressedStore chunks and ArenaFileStore chunks without
   * conflicts, as long as their tiers don't overlap or the decoders
   * are strict enough to distinguish them.
   */
  async loadIndex(): Promise<void> {
    this.hashIndex.clear();
    const ids = await this.arena.listIds();
    for (const chunkId of ids) {
      try {
        const chunk = await this.arena.get(chunkId);
        // Respect tier filter if set — other stores may share the arena.
        if (chunk.tier !== this.tier) continue;
        const decoded = decodePayload(chunk.payload);
        const hex = canonicalizeHash(decoded.hash);
        // First-write-wins: if two chunks somehow share a hash, keep the
        // earlier (lower) chunk id. The arena's monotonic id stability
        // makes this deterministic.
        if (!this.hashIndex.has(hex)) {
          this.hashIndex.set(hex, chunkId);
        }
      } catch {
        // Skip chunks we can't decode — they belong to another store.
      }
    }
    this.indexLoaded = true;
  }

  /** True after `loadIndex()` has been called. */
  isIndexLoaded(): boolean {
    return this.indexLoaded;
  }

  /** Number of content-addressed entries currently indexed. */
  size(): number {
    return this.hashIndex.size;
  }

  // ─── Put ─────────────────────────────────────────────────────────────────

  /**
   * Store `bytes` under `hash`. If the hash already exists, returns the
   * existing chunk id without writing (dedup). Returns the chunk id and
   * a `created` flag so callers can distinguish inserts from hits.
   *
   * `hash` may be a `Uint8Array` (raw bytes, 1..=255 long) or a hex
   * string. Hex strings must be even-length and contain only `[0-9a-f]`.
   */
  async put(hash: Uint8Array | string, bytes: Uint8Array): Promise<PutResult> {
    await this.ensureIndexLoaded();
    const hex = canonicalizeHash(hash);

    const existing = this.hashIndex.get(hex);
    if (existing !== undefined) {
      return { hash: hex, chunkId: existing, created: false };
    }

    const hashBytes = typeof hash === 'string' ? hexToBytes(hex) : hash;
    const payload = encodePayload(hashBytes, bytes);
    const chunkId = await this.arena.alloc(this.tier, payload);
    this.hashIndex.set(hex, chunkId);

    return { hash: hex, chunkId, created: true };
  }

  /**
   * Convenience: hash `bytes` with SHA-256 and store. Returns the hex
   * SHA-256 and the chunk id. Use this when you don't care which hash
   * is used and just want auto-deduplicated storage.
   *
   * SHA-256 is available from `node:crypto` with zero extra deps and
   * is collision-resistant enough for any realistic workload.
   */
  async putAuto(bytes: Uint8Array): Promise<PutResult> {
    const hash = sha256(bytes);
    return this.put(hash, bytes);
  }

  /**
   * Overwrite an existing entry by hash. If the hash isn't present,
   * behaves like `put`. Frees the old chunk and allocates a new one —
   * the chunk id *will change*, since freed ids are never reused.
   *
   * Use sparingly. The content-addressed model assumes immutability;
   * replacing bytes under the same hash means your hash is not
   * deterministic from the bytes, which is usually a bug.
   */
  async replaceByHash(hash: Uint8Array | string, bytes: Uint8Array): Promise<PutResult> {
    await this.ensureIndexLoaded();
    const hex = canonicalizeHash(hash);

    const existing = this.hashIndex.get(hex);
    if (existing !== undefined) {
      await this.arena.free(existing);
      this.hashIndex.delete(hex);
    }

    const hashBytes = typeof hash === 'string' ? hexToBytes(hex) : hash;
    const payload = encodePayload(hashBytes, bytes);
    const chunkId = await this.arena.alloc(this.tier, payload);
    this.hashIndex.set(hex, chunkId);

    return { hash: hex, chunkId, created: existing === undefined };
  }

  // ─── Read ────────────────────────────────────────────────────────────────

  /**
   * Fetch the bytes stored under `hash`, or `null` if not present.
   * The returned `Uint8Array` is a fresh copy — mutating it won't
   * affect arena storage.
   */
  async getByHash(hash: Uint8Array | string): Promise<Uint8Array | null> {
    await this.ensureIndexLoaded();
    const hex = canonicalizeHash(hash);
    const chunkId = this.hashIndex.get(hex);
    if (chunkId === undefined) return null;

    const chunk = await this.arena.get(chunkId);
    try {
      const decoded = decodePayload(chunk.payload);
      // Defensive: verify the stored hash matches what we looked up.
      if (canonicalizeHash(decoded.hash) !== hex) {
        // Index drift — drop the stale entry and report a miss.
        this.hashIndex.delete(hex);
        return null;
      }
      return decoded.bytes;
    } catch {
      this.hashIndex.delete(hex);
      return null;
    }
  }

  /** True iff a chunk is stored for this hash. */
  async hasHash(hash: Uint8Array | string): Promise<boolean> {
    await this.ensureIndexLoaded();
    return this.hashIndex.has(canonicalizeHash(hash));
  }

  /**
   * Look up the arena chunk id for a hash without fetching the payload.
   * Useful for cross-store references (e.g. a Unison term referencing
   * another term by chunk id for fast retrieval).
   */
  async chunkIdForHash(hash: Uint8Array | string): Promise<number | null> {
    await this.ensureIndexLoaded();
    return this.hashIndex.get(canonicalizeHash(hash)) ?? null;
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  /**
   * Free the chunk backing `hash`. Returns true if something was
   * removed, false if the hash wasn't present. The arena chunk id is
   * freed but *not* reused.
   */
  async removeByHash(hash: Uint8Array | string): Promise<boolean> {
    await this.ensureIndexLoaded();
    const hex = canonicalizeHash(hash);
    const chunkId = this.hashIndex.get(hex);
    if (chunkId === undefined) return false;

    await this.arena.free(chunkId);
    this.hashIndex.delete(hex);
    return true;
  }

  // ─── Enumerate ───────────────────────────────────────────────────────────

  /** Return every indexed hash as a hex string. Not ordered. */
  async listHashes(): Promise<string[]> {
    await this.ensureIndexLoaded();
    return Array.from(this.hashIndex.keys());
  }

  /** Count of indexed entries. Alias for `size()` but async for symmetry. */
  async count(): Promise<number> {
    await this.ensureIndexLoaded();
    return this.hashIndex.size;
  }

  // ─── Preload ─────────────────────────────────────────────────────────────

  /**
   * Prefetch a batch of chunks by hash so the next `getByHash` call
   * hits the arena's warm cache. The arena itself is already in RAM,
   * so this mostly serves as a "verify these hashes exist and warm
   * any cold Tauri IPC paths" primitive. Returns the number of hashes
   * found and successfully touched.
   *
   * Hashes that don't resolve are silently skipped (no error thrown).
   * This matches the `MemoryService.preload` convention from M10 —
   * preload is advisory, never fatal.
   */
  async preload(hashes: Array<Uint8Array | string>): Promise<number> {
    await this.ensureIndexLoaded();
    let hits = 0;
    for (const h of hashes) {
      const chunkId = this.hashIndex.get(canonicalizeHash(h));
      if (chunkId === undefined) continue;
      try {
        await this.arena.touch(chunkId);
        hits++;
      } catch {
        // Touch failure just means the chunk is gone underneath us; drop
        // the stale index entry.
        this.hashIndex.delete(canonicalizeHash(h));
      }
    }
    return hits;
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async ensureIndexLoaded(): Promise<void> {
    if (!this.indexLoaded) {
      await this.loadIndex();
    }
  }
}

// ─── Hash helpers (exported for tests & callers) ────────────────────────────

/** SHA-256 of a byte buffer, returned as a raw `Uint8Array`. */
export function sha256(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha256').update(bytes).digest());
}

/** SHA-256 as a lowercase hex string. */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
