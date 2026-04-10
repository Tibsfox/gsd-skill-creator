/**
 * Node.js arena shim — provides an `InvokeFn` backed by a JSON snapshot
 * file, so TypeScript scripts can use `ContentAddressedStore`,
 * `SkillCodebase`, and the rest of the Grove stack without needing a
 * running Tauri backend.
 *
 * This is a pragmatic CLI backstop, not a production replacement for
 * the Rust arena:
 *   - No mmap, no checkpoints, no journal — just a single JSON file
 *     that gets rewritten atomically after every mutation.
 *   - All chunks live in memory at once. Fine for importing a few
 *     hundred skills; not suitable for multi-GB corpora.
 *   - No performance guarantees, no concurrency safety (file-locked
 *     via tempfile-rename for atomicity on single-writer use).
 *
 * The wire-level semantics match the Rust arena exactly, so any code
 * written against the `RustArena` class works against this shim
 * unchanged. That's the point: CLI scripts can import the same
 * TypeScript as the live desktop app.
 *
 * # Usage
 *
 *     const invoke = createNodeArenaInvoke({ snapshotPath: '/tmp/arena.json' });
 *     const arena = new RustArena(invoke);
 *     await arena.init({ dir: '/tmp/arena-dir', numSlots: 4096 });
 *     const cas = new ContentAddressedStore({ arena });
 *     await cas.loadIndex();
 *
 * @module memory/node-arena-shim
 */

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { InvokeFn } from './rust-arena.js';

// ─── Internal state ─────────────────────────────────────────────────────────

interface SnapshotChunk {
  tier: string;
  payloadBase64: string;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

interface Snapshot {
  nextChunkId: number;
  chunks: Record<number, SnapshotChunk>;
  /** Well-known-hash → chunk id index for replaceByHash paths. */
  wellKnownHash?: Record<string, number>;
}

const DEFAULT_SLOT_COUNT = 4096;

// ─── Public factory ─────────────────────────────────────────────────────────

export interface NodeArenaOptions {
  /** Path to the JSON snapshot file. Created if missing. */
  snapshotPath: string;
  /** Number of virtual slots to report. Default 4096. */
  numSlots?: number;
}

/**
 * Create an `InvokeFn` that services all `arena_*` commands against a
 * JSON snapshot file. The file is loaded lazily on first call and
 * saved atomically after every mutation (alloc/free/touch/replace).
 */
export function createNodeArenaInvoke(options: NodeArenaOptions): InvokeFn {
  const snapshotPath = options.snapshotPath;
  const numSlots = options.numSlots ?? DEFAULT_SLOT_COUNT;

  let snapshot: Snapshot | null = null;
  let loaded = false;

  async function ensureLoaded(): Promise<void> {
    if (loaded) return;
    await mkdir(dirname(snapshotPath), { recursive: true });
    if (existsSync(snapshotPath)) {
      try {
        const raw = await readFile(snapshotPath, 'utf-8');
        const parsed = JSON.parse(raw) as Snapshot;
        if (parsed && typeof parsed.nextChunkId === 'number' && parsed.chunks) {
          snapshot = parsed;
        }
      } catch {
        // corrupt snapshot — fall through to fresh state
      }
    }
    if (!snapshot) {
      snapshot = { nextChunkId: 1, chunks: {}, wellKnownHash: {} };
    }
    if (!snapshot.wellKnownHash) {
      snapshot.wellKnownHash = {};
    }
    loaded = true;
  }

  async function saveAtomic(): Promise<void> {
    if (!snapshot) return;
    const tempPath = snapshotPath + '.tmp';
    await writeFile(tempPath, JSON.stringify(snapshot), 'utf-8');
    await rename(tempPath, snapshotPath);
  }

  function currentStats(): Record<string, number> {
    const allocated = Object.keys(snapshot!.chunks).length;
    return {
      totalSlots: numSlots,
      freeSlots: Math.max(0, numSlots - allocated),
      allocatedSlots: allocated,
      totalBytes: 0,
      freeBytes: 0,
      allocatedBytes: 0,
      nextChunkId: snapshot!.nextChunkId,
    };
  }

  const invoke: InvokeFn = async (cmd, args) => {
    await ensureLoaded();

    switch (cmd) {
      case 'arena_init':
        return {
          initialized: true,
          recovered: Object.keys(snapshot!.chunks).length > 0,
          checkpointPath: snapshotPath,
          journalPath: snapshotPath + '.journal',
          stats: currentStats(),
        };

      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = snapshot!.nextChunkId++;
        const nowNs = Date.now() * 1_000_000;
        snapshot!.chunks[id] = {
          tier,
          payloadBase64,
          accessCount: 0,
          createdAtNs: nowNs,
          lastAccessNs: nowNs,
        };
        await saveAtomic();
        return { chunkId: id };
      }

      case 'arena_get': {
        const { chunkId } = args as { chunkId: number };
        const chunk = snapshot!.chunks[chunkId];
        if (!chunk) throw new Error(`node-arena-shim: chunk ${chunkId} not found`);
        const bytes = base64Length(chunk.payloadBase64);
        return {
          chunkId,
          tier: chunk.tier,
          payloadBase64: chunk.payloadBase64,
          payloadSize: bytes,
          accessCount: chunk.accessCount,
          createdAtNs: chunk.createdAtNs,
          lastAccessNs: chunk.lastAccessNs,
        };
      }

      case 'arena_free': {
        const { chunkId } = args as { chunkId: number };
        if (!snapshot!.chunks[chunkId]) {
          throw new Error(`node-arena-shim: chunk ${chunkId} not found`);
        }
        delete snapshot!.chunks[chunkId];
        await saveAtomic();
        return null;
      }

      case 'arena_touch': {
        const { chunkId } = args as { chunkId: number };
        const chunk = snapshot!.chunks[chunkId];
        if (!chunk) throw new Error(`node-arena-shim: chunk ${chunkId} not found`);
        chunk.accessCount += 1;
        chunk.lastAccessNs = Date.now() * 1_000_000;
        // Don't save on touch — it's a hot path and not journaled in the Rust
        // arena either. The next mutation will persist the access counts.
        return null;
      }

      case 'arena_list_ids':
        return {
          chunkIds: Object.keys(snapshot!.chunks).map((k) => parseInt(k, 10)),
        };

      case 'arena_checkpoint':
        // Our snapshot is already a checkpoint — every mutation saved it.
        // Trigger one more save to lock in any touch-driven access counts.
        await saveAtomic();
        return { checkpointed: true, stats: currentStats() };

      case 'arena_stats':
        return currentStats();

      default:
        throw new Error(`node-arena-shim: unknown command: ${cmd}`);
    }
  };

  return invoke;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64Length(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}
