/**
 * Rust Arena Client — TypeScript bindings to the Rust memory_arena subsystem.
 *
 * The Rust side (`src-tauri/src/memory_arena/`) implements an Amiga-style
 * persistent RAM chunk store with checkpoint + journal recovery. This
 * module provides a clean, type-safe TypeScript API on top of the Tauri
 * IPC commands defined in `src-tauri/src/commands/memory_arena.rs`.
 *
 * # Design
 *
 * - **Dependency injection** for the invoke function — the client doesn't
 *   import `@tauri-apps/api` directly (respecting the src/ ↔ desktop/
 *   boundary). Desktop callers pass in Tauri's `invoke`; tests pass in
 *   a mock.
 * - `Uint8Array` in, `Uint8Array` out — base64 is an IPC implementation
 *   detail hidden from callers.
 * - Plain `number` for IDs, sizes, counts — safe up to 2^53 (way more
 *   than any realistic arena needs). Timestamps are nanoseconds; JS
 *   loses some precision but callers can convert to ms via `/ 1_000_000`.
 *
 * See memory/amiga-ram-storage-design.md and
 * memory/crossfade-lod-tuning.md for the architectural rationale.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Memory tier — maps to Amiga-style typed memory regions. Each chunk
 * declares which tier it belongs to so the allocator can apply tier-
 * specific policies (crossfade, eviction, VRAM staging, etc.).
 */
export type TierKind = 'hot' | 'warm' | 'vector' | 'blob' | 'resident';

/**
 * Snapshot of arena statistics. All sizes are in bytes at slot granularity
 * (not payload granularity — a slot with a small payload still counts as
 * its full slot size in `allocatedBytes`).
 */
export interface ArenaStats {
  totalSlots: number;
  freeSlots: number;
  allocatedSlots: number;
  totalBytes: number;
  freeBytes: number;
  allocatedBytes: number;
  /** The next chunk id that would be assigned by `alloc`. */
  nextChunkId: number;
}

/**
 * A chunk as returned by `get()`. Payload is decoded from base64 to
 * `Uint8Array` for you.
 */
export interface ChunkInfo {
  chunkId: number;
  tier: TierKind;
  payload: Uint8Array;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

/**
 * Options for `init()`.
 */
export interface ArenaInitOptions {
  /** Directory to hold checkpoint + journal files. Created if missing. */
  dir: string;
  /**
   * Number of slots in a freshly-created arena. Ignored on recovery
   * (the slot count comes from the checkpoint file).
   */
  numSlots: number;
  /** Slot size in bytes. If omitted, the Rust default (4 GiB) is used. */
  chunkSize?: number;
  /** Validation bound: minimum allowed chunk size. */
  minChunkSize?: number;
  /** Validation bound: maximum allowed chunk size. */
  maxChunkSize?: number;
}

export interface ArenaInitResult {
  initialized: boolean;
  /** True if the arena was recovered from an existing checkpoint. */
  recovered: boolean;
  checkpointPath: string;
  journalPath: string;
  stats: ArenaStats;
}

export interface CheckpointResult {
  checkpointed: boolean;
  stats: ArenaStats;
}

/**
 * The invoke function shape. Compatible with `@tauri-apps/api/core`'s
 * `invoke`, but kept as a standalone signature so this file doesn't
 * import Tauri directly (src/ ↔ desktop/ boundary rule).
 */
export type InvokeFn = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;

// ─── Wire-format DTOs (internal) ────────────────────────────────────────────
// These match the Rust DTOs in src-tauri/src/commands/memory_arena.rs.
// Kept separate from the public types so we can adapt the internal encoding
// without breaking callers.

interface WireArenaStats {
  totalSlots: number;
  freeSlots: number;
  allocatedSlots: number;
  totalBytes: number;
  freeBytes: number;
  allocatedBytes: number;
  nextChunkId: number;
}

interface WireInitRequest {
  dir: string;
  numSlots: number;
  chunkSize?: number;
  minChunkSize?: number;
  maxChunkSize?: number;
}

interface WireInitResponse {
  initialized: boolean;
  recovered: boolean;
  checkpointPath: string;
  journalPath: string;
  stats: WireArenaStats;
}

interface WireAllocRequest {
  tier: string;
  payloadBase64: string;
}

interface WireAllocResponse {
  chunkId: number;
}

interface WireGetResponse {
  chunkId: number;
  tier: string;
  payloadBase64: string;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

interface WireCheckpointResponse {
  checkpointed: boolean;
  stats: WireArenaStats;
}

interface WireListIdsResponse {
  chunkIds: number[];
}

// ─── Base64 helpers (portable: Node + browser) ──────────────────────────────

export function bytesToBase64(bytes: Uint8Array): string {
  // Node.js fast path
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  // Browser fallback using btoa + String.fromCharCode.
  let binary = '';
  const chunkSize = 0x8000; // avoid call stack overflow on large arrays
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)),
    );
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

/**
 * Thrown when the Tauri command fails. Wraps the Rust-side error string.
 */
export class RustArenaError extends Error {
  constructor(
    message: string,
    public readonly command: string,
  ) {
    super(message);
    this.name = 'RustArenaError';
  }
}

// ─── Client ─────────────────────────────────────────────────────────────────

/**
 * TypeScript client for the Rust memory arena.
 *
 * Construct via:
 *
 * ```ts
 * import { invoke } from '@tauri-apps/api/core';
 * const arena = new RustArena(invoke);
 * await arena.init({ dir: '/var/lib/gsd/arena', numSlots: 12 });
 * const id = await arena.alloc('warm', new TextEncoder().encode('hello'));
 * const chunk = await arena.get(id);
 * await arena.checkpoint();
 * ```
 *
 * For tests, pass a mock invoke function:
 *
 * ```ts
 * const mockInvoke: InvokeFn = async (cmd, args) => { ... };
 * const arena = new RustArena(mockInvoke);
 * ```
 */
export class RustArena {
  constructor(private readonly invoke: InvokeFn) {}

  /**
   * Initialize (or recover) a persistent arena at the given directory.
   * If a checkpoint exists, it's loaded and the journal is replayed.
   * Otherwise a fresh arena with `numSlots` slots is created.
   *
   * Idempotent: calling twice returns the current state without resetting.
   */
  async init(options: ArenaInitOptions): Promise<ArenaInitResult> {
    const req: WireInitRequest = {
      dir: options.dir,
      numSlots: options.numSlots,
      chunkSize: options.chunkSize,
      minChunkSize: options.minChunkSize,
      maxChunkSize: options.maxChunkSize,
    };
    const res = (await this.callCommand('arena_init', { req })) as WireInitResponse;
    return {
      initialized: res.initialized,
      recovered: res.recovered,
      checkpointPath: res.checkpointPath,
      journalPath: res.journalPath,
      stats: unwrapStats(res.stats),
    };
  }

  /** Get current arena statistics. */
  async stats(): Promise<ArenaStats> {
    const res = (await this.callCommand('arena_stats')) as WireArenaStats;
    return unwrapStats(res);
  }

  /**
   * Allocate a chunk with the given tier and payload. Returns the new
   * chunk id. Journaled immediately (durable before return).
   */
  async alloc(tier: TierKind, payload: Uint8Array): Promise<number> {
    const req: WireAllocRequest = {
      tier,
      payloadBase64: bytesToBase64(payload),
    };
    const res = (await this.callCommand('arena_alloc', { req })) as WireAllocResponse;
    return res.chunkId;
  }

  /** Read a chunk by id. Returns full chunk info with decoded payload. */
  async get(chunkId: number): Promise<ChunkInfo> {
    const res = (await this.callCommand('arena_get', { chunkId })) as WireGetResponse;
    return {
      chunkId: res.chunkId,
      tier: res.tier as TierKind,
      payload: base64ToBytes(res.payloadBase64),
      payloadSize: res.payloadSize,
      accessCount: res.accessCount,
      createdAtNs: res.createdAtNs,
      lastAccessNs: res.lastAccessNs,
    };
  }

  /** Free a chunk. Journaled immediately. The id is never reused. */
  async free(chunkId: number): Promise<void> {
    await this.callCommand('arena_free', { chunkId });
  }

  /**
   * Bump the access count of a chunk. In-memory only — not journaled.
   * Access counts survive checkpoints but are lossy on mid-checkpoint
   * crashes (acceptable: best-effort observability).
   */
  async touch(chunkId: number): Promise<void> {
    await this.callCommand('arena_touch', { chunkId });
  }

  /**
   * Write a checkpoint to disk and truncate the journal. Call at idle
   * points and on clean shutdown. This is the "durable commit" point —
   * anything not in the checkpoint is in the journal (and thus replayable).
   */
  async checkpoint(): Promise<CheckpointResult> {
    const res = (await this.callCommand('arena_checkpoint')) as WireCheckpointResponse;
    return {
      checkpointed: res.checkpointed,
      stats: unwrapStats(res.stats),
    };
  }

  /** List all allocated chunk ids. Not ordered. */
  async listIds(): Promise<number[]> {
    const res = (await this.callCommand('arena_list_ids')) as WireListIdsResponse;
    return res.chunkIds;
  }

  // ─── internal ──────────────────────────────────────────────────────────────

  private async callCommand(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      return await this.invoke(command, args);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new RustArenaError(message, command);
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function unwrapStats(wire: WireArenaStats): ArenaStats {
  return {
    totalSlots: wire.totalSlots,
    freeSlots: wire.freeSlots,
    allocatedSlots: wire.allocatedSlots,
    totalBytes: wire.totalBytes,
    freeBytes: wire.freeBytes,
    allocatedBytes: wire.allocatedBytes,
    nextChunkId: wire.nextChunkId,
  };
}
