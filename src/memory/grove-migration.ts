/**
 * Migration: `.grove/arena.json` → ArenaSet mmap pools.
 *
 * Reads the legacy JSON snapshot (single-arena, base64 payloads), creates
 * an ArenaSet with tier-aware pools, allocates each record into the
 * appropriate tier, and optionally backs up the old file.
 *
 * # Tier classification
 *
 * Records are classified by inspecting the first bytes of the decoded
 * payload (the content-addressed wire format: `[hash_len][hash][payload]`):
 *
 * - Records < 256 bytes → `hot` (likely type records, namespace heads)
 * - Records < 4096 bytes → `warm` (bindings, small metadata)
 * - Records >= 4096 bytes → `blob` (skill code, research payloads)
 *
 * Callers can override with a custom classifier.
 *
 * # Reversibility
 *
 * `exportToJson()` writes the ArenaSet state back to the JSON format,
 * enabling rollback if needed.
 *
 * @module memory/grove-migration
 */

import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { type TierKind } from './rust-arena.js';
import {
  type RustArenaSet,
  type PoolSpec,
} from './rust-arena-set.js';
import { ContentAddressedSetStore } from './content-addressed-set-store.js';
import { bytesToBase64, base64ToBytes } from './rust-arena.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MigrationOptions {
  /** Path to the .grove directory (contains arena.json). */
  groveDir: string;
  /** The initialized RustArenaSet to migrate into. */
  arena: RustArenaSet;
  /** Custom tier classifier. Defaults to size-based classification. */
  classifyTier?: (chunkId: number, payloadSize: number) => TierKind;
  /** If true, rename arena.json to arena.json.bak after migration. */
  backupOld?: boolean;
}

export interface MigrationReport {
  /** Total chunks found in the JSON file. */
  totalChunks: number;
  /** Chunks successfully migrated to ArenaSet. */
  migratedChunks: number;
  /** Chunks that failed migration (decode error, alloc error). */
  failedChunks: number;
  /** Per-tier allocation counts. */
  tierCounts: Record<string, number>;
  /** Path to the backup file, if created. */
  backupPath?: string;
}

export interface ExportOptions {
  /** Path to write the JSON snapshot. */
  outputPath: string;
  /** The ArenaSet to export from. */
  arena: RustArenaSet;
  /** Which tiers to export. Defaults to all. */
  tiers?: TierKind[];
}

export interface ExportReport {
  totalChunks: number;
  outputPath: string;
}

// ─── Legacy JSON format ─────────────────────────────────────────────────────

interface LegacyArenaJson {
  nextChunkId: number;
  chunks: Record<string, { tier: string; payloadBase64: string }>;
}

// ─── Tier classifier ────────────────────────────────────────────────────────

/** Default size-based tier classification. */
function defaultClassifyTier(_chunkId: number, payloadSize: number): TierKind {
  if (payloadSize < 256) return 'hot';
  if (payloadSize < 4096) return 'warm';
  return 'blob';
}

// ─── Migration ──────────────────────────────────────────────────────────────

/**
 * Migrate `.grove/arena.json` into an ArenaSet with tier-aware pools.
 *
 * The ArenaSet must already be initialized (via `arena.init()`). This
 * function reads the JSON file, classifies each chunk by tier, allocates
 * it in the appropriate pool, and returns a migration report.
 */
export async function migrateJsonToArenaSet(
  options: MigrationOptions,
): Promise<MigrationReport> {
  const jsonPath = join(options.groveDir, 'arena.json');
  if (!existsSync(jsonPath)) {
    return {
      totalChunks: 0,
      migratedChunks: 0,
      failedChunks: 0,
      tierCounts: {},
    };
  }

  const raw = readFileSync(jsonPath, 'utf-8');
  const legacy: LegacyArenaJson = JSON.parse(raw);
  const classify = options.classifyTier ?? defaultClassifyTier;

  const report: MigrationReport = {
    totalChunks: 0,
    migratedChunks: 0,
    failedChunks: 0,
    tierCounts: {},
  };

  const entries = Object.entries(legacy.chunks);
  report.totalChunks = entries.length;

  for (const [idStr, chunk] of entries) {
    try {
      const payload = base64ToBytes(chunk.payloadBase64);
      const tier = classify(parseInt(idStr, 10), payload.length);

      await options.arena.alloc(tier, payload);

      report.migratedChunks++;
      report.tierCounts[tier] = (report.tierCounts[tier] ?? 0) + 1;
    } catch {
      report.failedChunks++;
    }
  }

  if (options.backupOld) {
    const backupPath = jsonPath + '.bak';
    renameSync(jsonPath, backupPath);
    report.backupPath = backupPath;
  }

  return report;
}

/**
 * Export ArenaSet state back to the legacy JSON format.
 *
 * Walks all specified tiers, reads each chunk via `getHot`, and writes
 * the result as `{nextChunkId, chunks: {...}}` JSON.
 */
export async function exportArenaSetToJson(
  options: ExportOptions,
): Promise<ExportReport> {
  const tiers: TierKind[] = options.tiers ?? ['hot', 'warm', 'blob', 'resident'];
  const chunks: Record<string, { tier: string; payloadBase64: string }> = {};
  let maxId = 0;

  for (const tier of tiers) {
    let ids: number[];
    try {
      ids = await options.arena.listIds(tier);
    } catch {
      continue;
    }

    for (const id of ids) {
      try {
        const chunk = await options.arena.getHot(tier, id);
        chunks[String(id)] = {
          tier,
          payloadBase64: bytesToBase64(chunk.payload),
        };
        if (id > maxId) maxId = id;
      } catch {
        // Skip unreadable chunks.
      }
    }
  }

  const json: LegacyArenaJson = {
    nextChunkId: maxId + 1,
    chunks,
  };

  writeFileSync(options.outputPath, JSON.stringify(json, null, 2), 'utf-8');

  return {
    totalChunks: Object.keys(chunks).length,
    outputPath: options.outputPath,
  };
}
