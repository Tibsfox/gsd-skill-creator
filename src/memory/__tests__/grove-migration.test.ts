/**
 * Tests for grove-migration: JSON → ArenaSet and ArenaSet → JSON.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  migrateJsonToArenaSet,
  exportArenaSetToJson,
} from '../grove-migration.js';
import { RustArenaSet } from '../rust-arena-set.js';
import { bytesToBase64, base64ToBytes, type InvokeFn } from '../rust-arena.js';

// ─── Mock ArenaSet ──────────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
}

function makeMockArenaSet(): RustArenaSet {
  const chunks = new Map<string, MockChunk>();
  let nextId = 1;

  const invoke: InvokeFn = async (cmd, args) => {
    switch (cmd) {
      case 'arena_set_init':
        return { initialized: true, poolCount: 3, tiers: ['hot', 'warm', 'blob'] };

      case 'arena_set_alloc': {
        const a = args as { tier: string; payloadBase64: string };
        const id = nextId++;
        chunks.set(`${a.tier}:${id}`, { tier: a.tier, payloadBase64: a.payloadBase64 });
        return { chunkId: id };
      }

      case 'arena_set_get_hot': {
        const g = args as { tier: string; chunkId: number };
        const chunk = chunks.get(`${g.tier}:${g.chunkId}`);
        if (!chunk) throw new Error('not found');
        return {
          chunkId: g.chunkId,
          payloadBase64: chunk.payloadBase64,
          payloadSize: base64ToBytes(chunk.payloadBase64).length,
        };
      }

      case 'arena_set_list_ids': {
        const l = args as { tier: string };
        const ids: number[] = [];
        for (const key of chunks.keys()) {
          const [t, id] = key.split(':');
          if (t === l.tier) ids.push(parseInt(id, 10));
        }
        return { chunkIds: ids };
      }

      case 'arena_set_free': {
        const f = args as { tier: string; chunkId: number };
        chunks.delete(`${f.tier}:${f.chunkId}`);
        return null;
      }

      case 'arena_set_flush':
        return null;

      default:
        throw new Error(`unknown: ${cmd}`);
    }
  };

  return new RustArenaSet(invoke);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'grove-migrate-'));
}

function writeLegacyJson(dir: string, chunks: Record<string, { tier: string; payloadBase64: string }>): void {
  const json = {
    nextChunkId: Object.keys(chunks).length + 1,
    chunks,
  };
  writeFileSync(join(dir, 'arena.json'), JSON.stringify(json));
}

// ─── migrateJsonToArenaSet ──────────────────────────────────────────────────

describe('migrateJsonToArenaSet', () => {
  it('migrates chunks from JSON into ArenaSet', async () => {
    const dir = makeTempDir();
    const small = bytesToBase64(new Uint8Array([1, 2, 3])); // 3 bytes → hot
    const medium = bytesToBase64(new Uint8Array(500).fill(0xAA)); // 500 → warm
    const large = bytesToBase64(new Uint8Array(5000).fill(0xBB)); // 5000 → blob

    writeLegacyJson(dir, {
      '1': { tier: 'blob', payloadBase64: small },
      '2': { tier: 'blob', payloadBase64: medium },
      '3': { tier: 'blob', payloadBase64: large },
    });

    const arena = makeMockArenaSet();
    const report = await migrateJsonToArenaSet({
      groveDir: dir,
      arena,
    });

    expect(report.totalChunks).toBe(3);
    expect(report.migratedChunks).toBe(3);
    expect(report.failedChunks).toBe(0);
    expect(report.tierCounts['hot']).toBe(1);
    expect(report.tierCounts['warm']).toBe(1);
    expect(report.tierCounts['blob']).toBe(1);
  });

  it('returns empty report when arena.json does not exist', async () => {
    const dir = makeTempDir();
    const arena = makeMockArenaSet();
    const report = await migrateJsonToArenaSet({ groveDir: dir, arena });
    expect(report.totalChunks).toBe(0);
  });

  it('backs up arena.json when requested', async () => {
    const dir = makeTempDir();
    writeLegacyJson(dir, {
      '1': { tier: 'blob', payloadBase64: bytesToBase64(new Uint8Array([42])) },
    });

    const arena = makeMockArenaSet();
    const report = await migrateJsonToArenaSet({
      groveDir: dir,
      arena,
      backupOld: true,
    });

    expect(report.backupPath).toBe(join(dir, 'arena.json.bak'));
    expect(existsSync(join(dir, 'arena.json.bak'))).toBe(true);
    expect(existsSync(join(dir, 'arena.json'))).toBe(false);
  });

  it('accepts custom tier classifier', async () => {
    const dir = makeTempDir();
    writeLegacyJson(dir, {
      '1': { tier: 'blob', payloadBase64: bytesToBase64(new Uint8Array([1])) },
      '2': { tier: 'blob', payloadBase64: bytesToBase64(new Uint8Array([2])) },
    });

    const arena = makeMockArenaSet();
    const report = await migrateJsonToArenaSet({
      groveDir: dir,
      arena,
      classifyTier: () => 'resident', // force all to resident
    });

    expect(report.tierCounts['resident']).toBe(2);
  });
});

// ─── exportArenaSetToJson ───────────────────────────────────────────────────

describe('exportArenaSetToJson', () => {
  it('exports ArenaSet state to JSON', async () => {
    const arena = makeMockArenaSet();

    // Alloc some chunks.
    await arena.alloc('hot', new Uint8Array([10, 20]));
    await arena.alloc('blob', new Uint8Array([30, 40, 50]));

    const dir = makeTempDir();
    const outputPath = join(dir, 'exported.json');

    const report = await exportArenaSetToJson({ arena, outputPath });
    expect(report.totalChunks).toBe(2);
    expect(existsSync(outputPath)).toBe(true);

    // Parse and verify structure.
    const json = JSON.parse(readFileSync(outputPath, 'utf-8'));
    expect(json.nextChunkId).toBeGreaterThan(0);
    expect(Object.keys(json.chunks)).toHaveLength(2);
  });

  it('round-trips through migrate → export', async () => {
    const dir = makeTempDir();
    const payload = new Uint8Array(100).fill(0xCC);
    writeLegacyJson(dir, {
      '1': { tier: 'blob', payloadBase64: bytesToBase64(payload) },
    });

    // Migrate in.
    const arena = makeMockArenaSet();
    await migrateJsonToArenaSet({ groveDir: dir, arena });

    // Export out.
    const outputPath = join(dir, 'roundtrip.json');
    const report = await exportArenaSetToJson({ arena, outputPath });
    expect(report.totalChunks).toBe(1);

    // Verify payload survived.
    const json = JSON.parse(readFileSync(outputPath, 'utf-8'));
    const chunks = Object.values(json.chunks) as { payloadBase64: string }[];
    const decoded = base64ToBytes(chunks[0].payloadBase64);
    expect(Array.from(decoded)).toEqual(Array.from(payload));
  });
});
