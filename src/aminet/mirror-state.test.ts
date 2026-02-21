/**
 * Tests for mirror state schemas and atomic persistence.
 *
 * Validates PackageStatus enum, MirrorEntry/MirrorState/DownloadConfig
 * Zod schemas, and the load/save/update/get functions that manage
 * .mirror-state.json with atomic write-then-rename.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  PackageStatusSchema,
  MirrorEntrySchema,
  MirrorStateSchema,
  DownloadConfigSchema,
} from './types.js';
import type { MirrorState, MirrorEntry } from './types.js';
import {
  loadMirrorState,
  saveMirrorState,
  updateEntry,
  getEntry,
} from './mirror-state.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a unique temp directory for each test. */
function makeTmpDir(): string {
  const dir = join(tmpdir(), `mirror-state-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Clean up a temp directory after test. */
function cleanTmpDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Build a sample MirrorEntry for testing. */
function sampleEntry(overrides: Partial<MirrorEntry> = {}): MirrorEntry {
  return MirrorEntrySchema.parse({
    fullPath: 'mus/edit/ProTracker36.lha',
    status: 'not-mirrored',
    sizeKb: 142,
    sha256: null,
    localPath: null,
    downloadedAt: null,
    lastChecked: null,
    ...overrides,
  });
}

// ============================================================================
// PackageStatusSchema
// ============================================================================

describe('PackageStatusSchema', () => {
  const VALID_STATUSES = [
    'not-mirrored',
    'downloading',
    'mirrored',
    'scan-pending',
    'clean',
    'infected',
    'installed',
  ] as const;

  it('accepts all 7 valid status values', () => {
    for (const status of VALID_STATUSES) {
      expect(PackageStatusSchema.parse(status)).toBe(status);
    }
  });

  it('has exactly 7 values', () => {
    expect(PackageStatusSchema.options).toHaveLength(7);
  });

  it('rejects invalid status values', () => {
    expect(() => PackageStatusSchema.parse('unknown')).toThrow();
    expect(() => PackageStatusSchema.parse('')).toThrow();
    expect(() => PackageStatusSchema.parse(42)).toThrow();
  });
});

// ============================================================================
// MirrorEntrySchema
// ============================================================================

describe('MirrorEntrySchema', () => {
  it('validates a complete entry with all fields', () => {
    const entry = MirrorEntrySchema.parse({
      fullPath: 'mus/edit/ProTracker36.lha',
      status: 'mirrored',
      sizeKb: 142,
      sha256: 'abc123def456',
      localPath: '/mirrors/mus/edit/ProTracker36.lha',
      downloadedAt: '2026-02-19T12:00:00Z',
      lastChecked: '2026-02-19T12:05:00Z',
    });
    expect(entry.fullPath).toBe('mus/edit/ProTracker36.lha');
    expect(entry.status).toBe('mirrored');
    expect(entry.sizeKb).toBe(142);
    expect(entry.sha256).toBe('abc123def456');
    expect(entry.localPath).toBe('/mirrors/mus/edit/ProTracker36.lha');
    expect(entry.downloadedAt).toBe('2026-02-19T12:00:00Z');
    expect(entry.lastChecked).toBe('2026-02-19T12:05:00Z');
  });

  it('defaults nullable fields to null', () => {
    const entry = MirrorEntrySchema.parse({
      fullPath: 'dev/c/SAS_C.lha',
      status: 'not-mirrored',
      sizeKb: 500,
    });
    expect(entry.sha256).toBeNull();
    expect(entry.localPath).toBeNull();
    expect(entry.downloadedAt).toBeNull();
    expect(entry.lastChecked).toBeNull();
  });

  it('rejects entry with invalid status', () => {
    expect(() =>
      MirrorEntrySchema.parse({
        fullPath: 'mus/edit/foo.lha',
        status: 'bogus',
        sizeKb: 10,
      }),
    ).toThrow();
  });

  it('rejects entry missing required fields', () => {
    expect(() => MirrorEntrySchema.parse({ status: 'mirrored' })).toThrow();
  });
});

// ============================================================================
// MirrorStateSchema
// ============================================================================

describe('MirrorStateSchema', () => {
  it('validates a complete state with entries', () => {
    const state = MirrorStateSchema.parse({
      entries: {
        'mus/edit/ProTracker36.lha': {
          fullPath: 'mus/edit/ProTracker36.lha',
          status: 'mirrored',
          sizeKb: 142,
          sha256: null,
          localPath: null,
          downloadedAt: null,
          lastChecked: null,
        },
      },
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    });
    expect(Object.keys(state.entries)).toHaveLength(1);
    expect(state.version).toBe(1);
  });

  it('validates an empty state', () => {
    const state = MirrorStateSchema.parse({
      entries: {},
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    });
    expect(state.entries).toEqual({});
  });

  it('rejects wrong version number', () => {
    expect(() =>
      MirrorStateSchema.parse({
        entries: {},
        lastUpdated: '2026-02-19T12:00:00Z',
        version: 2,
      }),
    ).toThrow();
  });
});

// ============================================================================
// DownloadConfigSchema
// ============================================================================

describe('DownloadConfigSchema', () => {
  it('validates with defaults', () => {
    const cfg = DownloadConfigSchema.parse({
      cacheDir: '/tmp/aminet-cache',
      mirrorDir: '/tmp/aminet-mirror',
    });
    expect(cfg.delayMs).toBe(500);
    expect(cfg.concurrency).toBe(2);
    expect(cfg.mirrorDir).toBe('/tmp/aminet-mirror');
    // Inherited from AminetMirrorConfigSchema
    expect(cfg.mirrors).toEqual(['https://aminet.net']);
    expect(cfg.userAgent).toBe('GSD-Aminet-Pack/1.0');
    expect(cfg.timeoutMs).toBe(30000);
  });

  it('accepts explicit values', () => {
    const cfg = DownloadConfigSchema.parse({
      cacheDir: '/cache',
      mirrorDir: '/mirror',
      delayMs: 1000,
      concurrency: 4,
      mirrors: ['https://mirror1.example.com', 'https://mirror2.example.com'],
    });
    expect(cfg.delayMs).toBe(1000);
    expect(cfg.concurrency).toBe(4);
    expect(cfg.mirrors).toHaveLength(2);
  });

  it('rejects concurrency less than 1', () => {
    expect(() =>
      DownloadConfigSchema.parse({
        cacheDir: '/cache',
        mirrorDir: '/mirror',
        concurrency: 0,
      }),
    ).toThrow();
  });

  it('rejects negative delay', () => {
    expect(() =>
      DownloadConfigSchema.parse({
        cacheDir: '/cache',
        mirrorDir: '/mirror',
        delayMs: -1,
      }),
    ).toThrow();
  });
});

// ============================================================================
// loadMirrorState
// ============================================================================

describe('loadMirrorState', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(tmpDir);
  });

  it('returns empty state when file does not exist', () => {
    const state = loadMirrorState(tmpDir);
    expect(state.entries).toEqual({});
    expect(state.version).toBe(1);
    expect(state.lastUpdated).toBeTruthy();
  });

  it('reads and parses existing .mirror-state.json', () => {
    const existing: MirrorState = {
      entries: {
        'dev/c/SAS_C.lha': {
          fullPath: 'dev/c/SAS_C.lha',
          status: 'mirrored',
          sizeKb: 500,
          sha256: 'deadbeef',
          localPath: '/mirror/dev/c/SAS_C.lha',
          downloadedAt: '2026-02-19T12:00:00Z',
          lastChecked: '2026-02-19T12:05:00Z',
        },
      },
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    writeFileSync(join(tmpDir, '.mirror-state.json'), JSON.stringify(existing));

    const state = loadMirrorState(tmpDir);
    expect(state.entries['dev/c/SAS_C.lha'].status).toBe('mirrored');
    expect(state.entries['dev/c/SAS_C.lha'].sha256).toBe('deadbeef');
  });
});

// ============================================================================
// saveMirrorState
// ============================================================================

describe('saveMirrorState', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(tmpDir);
  });

  it('writes JSON via atomic rename (.tmp does not remain)', () => {
    const state: MirrorState = {
      entries: {},
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    saveMirrorState(state, tmpDir);

    // Real file must exist
    expect(existsSync(join(tmpDir, '.mirror-state.json'))).toBe(true);
    // Temp file must NOT remain
    expect(existsSync(join(tmpDir, '.mirror-state.json.tmp'))).toBe(false);
  });

  it('creates cacheDir recursively if it does not exist', () => {
    const nestedDir = join(tmpDir, 'deeply', 'nested', 'cache');
    const state: MirrorState = {
      entries: {},
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    saveMirrorState(state, nestedDir);
    expect(existsSync(join(nestedDir, '.mirror-state.json'))).toBe(true);
  });
});

// ============================================================================
// updateEntry
// ============================================================================

describe('updateEntry', () => {
  it('returns new state with entry merged', () => {
    const original: MirrorState = {
      entries: {},
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    const updated = updateEntry(original, 'mus/edit/ProTracker36.lha', {
      fullPath: 'mus/edit/ProTracker36.lha',
      status: 'downloading',
      sizeKb: 142,
    });

    expect(updated.entries['mus/edit/ProTracker36.lha']).toBeDefined();
    expect(updated.entries['mus/edit/ProTracker36.lha'].status).toBe('downloading');
  });

  it('does not mutate the original state', () => {
    const original: MirrorState = {
      entries: {
        'a/b.lha': sampleEntry({ fullPath: 'a/b.lha', status: 'not-mirrored' }),
      },
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    const updated = updateEntry(original, 'a/b.lha', { status: 'mirrored' });

    expect(original.entries['a/b.lha'].status).toBe('not-mirrored');
    expect(updated.entries['a/b.lha'].status).toBe('mirrored');
  });

  it('merges partial updates into existing entry', () => {
    const original: MirrorState = {
      entries: {
        'a/b.lha': sampleEntry({ fullPath: 'a/b.lha', status: 'downloading', sizeKb: 100 }),
      },
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    const updated = updateEntry(original, 'a/b.lha', {
      status: 'mirrored',
      sha256: 'abc123',
    });

    expect(updated.entries['a/b.lha'].status).toBe('mirrored');
    expect(updated.entries['a/b.lha'].sha256).toBe('abc123');
    expect(updated.entries['a/b.lha'].sizeKb).toBe(100); // preserved
  });
});

// ============================================================================
// getEntry
// ============================================================================

describe('getEntry', () => {
  it('returns entry when it exists', () => {
    const state: MirrorState = {
      entries: {
        'mus/edit/ProTracker36.lha': sampleEntry(),
      },
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    const entry = getEntry(state, 'mus/edit/ProTracker36.lha');
    expect(entry).toBeDefined();
    expect(entry!.sizeKb).toBe(142);
  });

  it('returns undefined when entry does not exist', () => {
    const state: MirrorState = {
      entries: {},
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };
    expect(getEntry(state, 'nonexistent/path.lha')).toBeUndefined();
  });
});

// ============================================================================
// Round-trip
// ============================================================================

describe('round-trip', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    cleanTmpDir(tmpDir);
  });

  it('save then load returns identical data', () => {
    const original: MirrorState = {
      entries: {
        'mus/edit/ProTracker36.lha': {
          fullPath: 'mus/edit/ProTracker36.lha',
          status: 'mirrored',
          sizeKb: 142,
          sha256: 'abc123def456',
          localPath: '/mirror/mus/edit/ProTracker36.lha',
          downloadedAt: '2026-02-19T12:00:00Z',
          lastChecked: '2026-02-19T12:05:00Z',
        },
        'dev/c/SAS_C.lha': {
          fullPath: 'dev/c/SAS_C.lha',
          status: 'not-mirrored',
          sizeKb: 500,
          sha256: null,
          localPath: null,
          downloadedAt: null,
          lastChecked: null,
        },
      },
      lastUpdated: '2026-02-19T12:00:00Z',
      version: 1,
    };

    saveMirrorState(original, tmpDir);
    const loaded = loadMirrorState(tmpDir);

    expect(loaded).toEqual(original);
  });
});
