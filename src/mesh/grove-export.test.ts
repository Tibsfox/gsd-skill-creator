/**
 * Tests for grove-export — directory-based codebase export/import.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  exportCodebase,
  importCodebase,
  EXPORT_MANIFEST_TYPE_HASH,
  buildExportManifestTypeRecord,
} from './grove-export.js';
import { ContentAddressedStore } from '../memory/content-addressed-store.js';
import { SkillCodebase } from './skill-codebase.js';
import { RustArena, type InvokeFn, base64ToBytes } from '../memory/rust-arena.js';
import { hashRefEquals, HASH_ALGO, hashRecord } from '../memory/grove-format.js';
import type { SkillSpec } from './skill-view.js';

// ─── Mock arena ─────────────────────────────────────────────────────────────

interface MockChunk {
  tier: string;
  payloadBase64: string;
  payloadSize: number;
  accessCount: number;
  createdAtNs: number;
  lastAccessNs: number;
}

function createMockArena() {
  const chunks = new Map<number, MockChunk>();
  let nextId = 1;
  const invoke: InvokeFn = async (cmd, args) => {
    switch (cmd) {
      case 'arena_init':
        return {
          initialized: true, recovered: false,
          checkpointPath: '/mock', journalPath: '/mock',
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_alloc': {
        const { tier, payloadBase64 } = (args as {
          req: { tier: string; payloadBase64: string };
        }).req;
        const id = nextId++;
        chunks.set(id, {
          tier, payloadBase64,
          payloadSize: base64ToBytes(payloadBase64).length,
          accessCount: 0, createdAtNs: id * 1000, lastAccessNs: id * 1000,
        });
        return { chunkId: id };
      }
      case 'arena_get': {
        const { chunkId } = args as { chunkId: number };
        const chunk = chunks.get(chunkId);
        if (!chunk) throw new Error(`not found: ${chunkId}`);
        return { chunkId, ...chunk };
      }
      case 'arena_free': {
        const { chunkId } = args as { chunkId: number };
        if (!chunks.delete(chunkId)) throw new Error(`not found: ${chunkId}`);
        return null;
      }
      case 'arena_touch': return null;
      case 'arena_list_ids':
        return { chunkIds: Array.from(chunks.keys()) };
      case 'arena_checkpoint':
        return {
          checkpointed: true,
          stats: {
            totalSlots: 1024, freeSlots: 1024 - chunks.size,
            allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
            allocatedBytes: 0, nextChunkId: nextId,
          },
        };
      case 'arena_stats':
        return {
          totalSlots: 1024, freeSlots: 1024 - chunks.size,
          allocatedSlots: chunks.size, totalBytes: 0, freeBytes: 0,
          allocatedBytes: 0, nextChunkId: nextId,
        };
      default:
        throw new Error(`unknown command: ${cmd}`);
    }
  };
  return { invoke, size: () => chunks.size };
}

async function buildFixture() {
  const mock = createMockArena();
  const arena = new RustArena(mock.invoke);
  await arena.init({ dir: '/mock', numSlots: 1024 });
  const cas = new ContentAddressedStore({ arena });
  await cas.loadIndex();
  const codebase = new SkillCodebase({ cas });
  return { mock, arena, cas, codebase };
}

// ─── Temp dir management ────────────────────────────────────────────────────

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'grove-export-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const sampleSpec: SkillSpec = {
  name: 'vision-to-mission',
  description: 'Turn a vision into a mission',
  body: '# Vision\n\nBody',
  activationPatterns: ['vision to mission'],
  dependencies: [],
};

// ─── ExportManifest type record ─────────────────────────────────────────────

describe('ExportManifest type record', () => {
  it('has a deterministic 32-byte SHA-256 type hash', () => {
    expect(EXPORT_MANIFEST_TYPE_HASH.algoId).toBe(HASH_ALGO.SHA_256);
    expect(EXPORT_MANIFEST_TYPE_HASH.hash.length).toBe(32);
    const again = hashRecord(buildExportManifestTypeRecord());
    expect(hashRefEquals(again, EXPORT_MANIFEST_TYPE_HASH)).toBe(true);
  });
});

// ─── exportCodebase ─────────────────────────────────────────────────────────

describe('exportCodebase', () => {
  it('writes an empty export for an empty store', async () => {
    const { cas } = await buildFixture();
    const result = await exportCodebase(cas, { outputDir: tempDir });

    expect(result.recordCount).toBe(0);
    expect(result.records).toEqual([]);
    expect(result.headNamespace).toBeNull();

    // Manifest file exists.
    const manifestBytes = await readFile(result.manifestPath);
    expect(manifestBytes.length).toBeGreaterThan(0);

    // Records directory exists but is empty.
    const recordFiles = await readdir(join(tempDir, 'records'));
    expect(recordFiles).toEqual([]);

    // README is present by default.
    const readme = await readFile(join(tempDir, 'README.txt'), 'utf-8');
    expect(readme).toContain('Grove codebase export');
  });

  it('writes a record file per skill and captures the head namespace', async () => {
    const { codebase, cas } = await buildFixture();
    await codebase.define(sampleSpec, { linkParent: false });
    await codebase.define({ ...sampleSpec, name: 'other' }, { linkParent: false });

    const result = await exportCodebase(cas, { outputDir: tempDir, exportedBy: 'foxy' });

    // Two skill records + two namespace records = 4 records total.
    expect(result.recordCount).toBeGreaterThanOrEqual(4);
    expect(result.headNamespace).not.toBeNull();

    const recordFiles = await readdir(join(tempDir, 'records'));
    expect(recordFiles.length).toBe(result.recordCount);
    for (const file of recordFiles) {
      expect(file.endsWith('.grove')).toBe(true);
      // 64 hex chars + ".grove" = 70 chars.
      expect(file.length).toBe(70);
    }
  });

  it('can skip the README', async () => {
    const { cas } = await buildFixture();
    await exportCodebase(cas, { outputDir: tempDir, includeReadme: false });
    const entries = await readdir(tempDir);
    expect(entries).not.toContain('README.txt');
  });
});

// ─── importCodebase ─────────────────────────────────────────────────────────

describe('importCodebase', () => {
  it('imports from an empty export without error', async () => {
    const { cas: srcCas } = await buildFixture();
    await exportCodebase(srcCas, { outputDir: tempDir });

    const { cas: dstCas } = await buildFixture();
    const result = await importCodebase(dstCas, { inputDir: tempDir });

    expect(result.recordCount).toBe(0);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.corruptRecords).toEqual([]);
  });

  it('roundtrips a codebase through export → import', async () => {
    // Source codebase with a couple of skills.
    const { codebase: src, cas: srcCas } = await buildFixture();
    await src.define(sampleSpec);
    await src.define({ ...sampleSpec, name: 'other', body: 'other body' });

    const srcActives = await src.listActive();
    const srcNames = srcActives.map((s) => s.name).sort();
    expect(srcNames).toEqual(['other', 'vision-to-mission']);

    // Export.
    await exportCodebase(srcCas, { outputDir: tempDir });

    // Fresh destination store.
    const { codebase: dst, cas: dstCas } = await buildFixture();
    await importCodebase(dstCas, { inputDir: tempDir });

    // Destination should resolve both skills by name.
    const dstNames = (await dst.listNames()).sort();
    expect(dstNames).toEqual(srcNames);

    const resolved = await dst.resolve('vision-to-mission');
    expect(resolved).not.toBeNull();
    expect(resolved!.spec.body).toBe(sampleSpec.body);
  });

  it('re-importing into the source store is fully idempotent (all skipped)', async () => {
    // A true dedup test: export then re-import into the SAME store. Every
    // record already exists, so every put returns created=false and
    // everything is reported as skipped.
    const { codebase: src, cas: srcCas } = await buildFixture();
    await src.define(sampleSpec);
    await src.define({ ...sampleSpec, name: 'other' });
    await exportCodebase(srcCas, { outputDir: tempDir });

    const result = await importCodebase(srcCas, { inputDir: tempDir });
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(result.recordCount);
    expect(result.corruptRecords).toEqual([]);
  });

  it('detects corrupted record files when verify=true', async () => {
    const { codebase: src, cas: srcCas } = await buildFixture();
    await src.define(sampleSpec);
    await exportCodebase(srcCas, { outputDir: tempDir });

    // Corrupt one record file.
    const recordFiles = await readdir(join(tempDir, 'records'));
    const target = join(tempDir, 'records', recordFiles[0]);
    const bytes = await readFile(target);
    bytes[10] = (bytes[10] + 1) & 0xff;
    await writeFile(target, bytes);

    const { cas: dstCas } = await buildFixture();
    const result = await importCodebase(dstCas, { inputDir: tempDir, verify: true });
    expect(result.corruptRecords.length).toBe(1);
    expect(result.corruptRecords[0]).toBe(recordFiles[0]);
  });

  it('accepts corrupt files when verify=false', async () => {
    const { codebase: src, cas: srcCas } = await buildFixture();
    await src.define(sampleSpec);
    await exportCodebase(srcCas, { outputDir: tempDir });

    const recordFiles = await readdir(join(tempDir, 'records'));
    const target = join(tempDir, 'records', recordFiles[0]);
    const bytes = await readFile(target);
    bytes[10] = (bytes[10] + 1) & 0xff;
    await writeFile(target, bytes);

    const { cas: dstCas } = await buildFixture();
    const result = await importCodebase(dstCas, { inputDir: tempDir, verify: false });
    expect(result.corruptRecords).toEqual([]);
  });
});

// ─── End-to-end: hand-off a codebase between two independent arenas ─────────

describe('codebase handoff end-to-end', () => {
  it('full skill codebase can be moved between two independent arenas', async () => {
    // Build a skill graph in the source.
    const { codebase: src, cas: srcCas } = await buildFixture();
    const leaf = await src.define({
      name: 'leaf',
      description: 'base',
      body: 'x',
      activationPatterns: [],
      dependencies: [],
    });
    await src.define({
      name: 'root',
      description: 'uses leaf',
      body: 'y',
      activationPatterns: [],
      dependencies: [leaf.hash],
    });

    // Export.
    await exportCodebase(srcCas, { outputDir: tempDir, exportedBy: 'alice' });

    // Fresh destination (completely different in-memory arena).
    const { codebase: dst, cas: dstCas } = await buildFixture();
    const beforeImport = await dst.listNames();
    expect(beforeImport).toEqual([]);

    // Import.
    await importCodebase(dstCas, { inputDir: tempDir });

    // Destination codebase should be functionally equivalent.
    expect((await dst.listNames()).sort()).toEqual(['leaf', 'root']);

    const rootResolved = await dst.resolve('root');
    expect(rootResolved).not.toBeNull();

    const graph = await dst.dependencyGraph(rootResolved!.hash);
    expect(graph.nodes.length).toBe(2);
    expect(graph.missing).toEqual([]);

    const typecheck = await dst.typecheck(rootResolved!.hash);
    expect(typecheck.ok).toBe(true);
  });
});
