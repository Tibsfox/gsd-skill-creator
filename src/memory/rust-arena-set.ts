/**
 * Rust ArenaSet Client — TypeScript bindings to the multi-pool ArenaSet.
 *
 * Wraps the `arena_set_*` Tauri IPC commands from
 * `src-tauri/src/commands/memory_arena.rs`. Provides tier-aware allocation,
 * zero-copy hot reads, policy sweeps, and GC — the full M9-M13 surface.
 *
 * # Tier-based allocation for Grove
 *
 * Grove records map to arena tiers:
 * - **hot**: Bootstrap type records (TypeRecord, NamespaceRecord, SignatureRecord)
 * - **warm**: Recently accessed namespace bindings
 * - **blob**: Large payloads (skill code bodies, research documents)
 * - **resident**: Long-lived structural records
 *
 * The ContentAddressedStore passes a tier hint to `alloc()` so each record
 * lands in the right pool. The policy sweep promotes/demotes automatically
 * based on access patterns.
 *
 * @module memory/rust-arena-set
 */

import { bytesToBase64, base64ToBytes, type InvokeFn, type TierKind } from './rust-arena.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ArenaSetInitOptions {
  /** Directory to hold manifest.json + per-tier .arena files. */
  dir: string;
  /** Slot size per chunk. Defaults to 4096 for test/dev. */
  chunkSize?: number;
  /** Pool specs: which tiers to create and how many slots each. */
  pools: PoolSpec[];
}

export interface PoolSpec {
  tier: TierKind;
  numSlots: number;
}

export interface ArenaSetInitResult {
  initialized: boolean;
  poolCount: number;
  tiers: TierKind[];
}

export interface SweepReport {
  promotesInitiated: number;
  promotesCompleted: number;
  demotesInitiated: number;
  demotesCompleted: number;
  evictions: number;
  skippedCooldown: number;
  errorCount: number;
}

export interface GcReport {
  targetsFreed: number;
  sourcesReverted: number;
}

export interface HotChunkInfo {
  chunkId: number;
  payload: Uint8Array;
  payloadSize: number;
}

// ─── Wire DTOs (internal) ──────────────────────────────────────────────────

interface WireSetInitResponse {
  initialized: boolean;
  poolCount: number;
  tiers: string[];
}

interface WireAllocResponse {
  chunkId: number;
}

interface WireGetHotResponse {
  chunkId: number;
  payloadBase64: string;
  payloadSize: number;
}

interface WireSweepReport {
  promotesInitiated: number;
  promotesCompleted: number;
  demotesInitiated: number;
  demotesCompleted: number;
  evictions: number;
  skippedCooldown: number;
  errorCount: number;
}

interface WireGcReport {
  targetsFreed: number;
  sourcesReverted: number;
}

// ─── Errors ────────────────────────────────────────────────────────────────

export class ArenaSetError extends Error {
  constructor(
    message: string,
    public readonly command: string,
  ) {
    super(message);
    this.name = 'ArenaSetError';
  }
}

// ─── Client ────────────────────────────────────────────────────────────────

export class RustArenaSet {
  constructor(private readonly invoke: InvokeFn) {}

  /**
   * Initialize (or reopen) a multi-pool ArenaSet. Creates one mmap-backed
   * pool per requested tier. If `manifest.json` exists, reopens via
   * `open_lazy`; otherwise creates fresh.
   */
  async init(options: ArenaSetInitOptions): Promise<ArenaSetInitResult> {
    const res = (await this.callCommand('arena_set_init', {
      req: {
        dir: options.dir,
        chunkSize: options.chunkSize,
        pools: options.pools.map((p) => ({
          tier: p.tier,
          numSlots: p.numSlots,
        })),
      },
    })) as WireSetInitResponse;
    return {
      initialized: res.initialized,
      poolCount: res.poolCount,
      tiers: res.tiers as TierKind[],
    };
  }

  /**
   * Allocate a chunk in the specified tier. Returns the chunk id.
   * The chunk is written to the mmap-backed pool immediately.
   */
  async alloc(tier: TierKind, payload: Uint8Array): Promise<number> {
    const res = (await this.callCommand('arena_set_alloc', {
      tier,
      payloadBase64: bytesToBase64(payload),
    })) as WireAllocResponse;
    return res.chunkId;
  }

  /**
   * Read a chunk via the zero-copy hot path (M9 get_chunk_hot).
   * Single header parse, inline checksum validation, no payload copy
   * on the Rust side. Returns decoded payload bytes.
   */
  async getHot(tier: TierKind, chunkId: number): Promise<HotChunkInfo> {
    const res = (await this.callCommand('arena_set_get_hot', {
      tier,
      chunkId,
    })) as WireGetHotResponse;
    return {
      chunkId: res.chunkId,
      payload: base64ToBytes(res.payloadBase64),
      payloadSize: res.payloadSize,
    };
  }

  /** Free a chunk from a specific tier. */
  async free(tier: TierKind, chunkId: number): Promise<void> {
    await this.callCommand('arena_set_free', { tier, chunkId });
  }

  /**
   * Run a policy sweep across all pools. Promotes hot chunks, demotes
   * idle chunks, evicts when pools are full. Returns action counts.
   */
  async sweep(): Promise<SweepReport> {
    return (await this.callCommand('arena_set_sweep')) as WireSweepReport;
  }

  /**
   * Garbage-collect orphaned crossfade targets. Reverts interrupted
   * sources to Resident, frees unreachable targets.
   */
  async gc(): Promise<GcReport> {
    return (await this.callCommand('arena_set_gc')) as WireGcReport;
  }

  /**
   * Flush all pool mmaps, manifest, and crossfade registry to disk.
   * Call at idle points and on clean shutdown.
   */
  async flush(): Promise<void> {
    await this.callCommand('arena_set_flush');
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
      throw new ArenaSetError(message, command);
    }
  }
}
