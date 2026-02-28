import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { ScanStateStore } from './scan-state-store.js';

/** Valid state fixture covering all fields */
const validState = {
  version: 1,
  sessions: {
    'project-a:sess-001': {
      fileMtime: 1706000000000,
      scannedAt: '2026-01-15T10:00:00.000Z',
      projectSlug: 'project-a',
    },
    'project-b:sess-002': {
      fileMtime: 1706100000000,
      scannedAt: '2026-01-15T12:00:00.000Z',
      projectSlug: 'project-b',
    },
  },
  excludeProjects: ['excluded-project'],
  lastScanAt: '2026-01-15T12:00:00.000Z',
  lastScanStats: {
    totalProjects: 3,
    totalSessions: 10,
    newSessions: 2,
    modifiedSessions: 1,
    skippedSessions: 7,
  },
};

describe('ScanStateStore', () => {
  let tmpDir: string;

  function createTmpDir(): string {
    tmpDir = mkdtempSync(join(os.tmpdir(), 'scan-state-test-'));
    return tmpDir;
  }

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true });
    }
  });

  // Test 1: load() returns empty state when file does not exist
  it('load() returns empty state when file does not exist', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'nonexistent', 'scan-state.json');
    const store = new ScanStateStore(statePath);
    const state = await store.load();
    expect(state).toEqual({
      version: 1,
      sessions: {},
      excludeProjects: [],
    });
  });

  // Test 2: save() creates file and parent directories
  it('save() creates file and parent directories', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'sub1', 'sub2', 'scan-state.json');
    const store = new ScanStateStore(statePath);
    await store.save(validState);
    expect(existsSync(statePath)).toBe(true);
    const content = JSON.parse(readFileSync(statePath, 'utf-8'));
    expect(content.version).toBe(1);
  });

  // Test 3: save() then load() round-trips state correctly
  it('save() then load() round-trips state correctly', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);
    await store.save(validState);
    const loaded = await store.load();
    expect(loaded).toEqual(validState);
  });

  // Test 4: save() uses atomic write (no .tmp files remain)
  it('save() uses atomic write (no .tmp files remain)', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);
    await store.save(validState);

    // No .tmp files should remain in the directory
    const files = readdirSync(tmpDir);
    const tmpFiles = files.filter((f) => f.endsWith('.tmp'));
    expect(tmpFiles).toHaveLength(0);

    // The target file should exist and be valid JSON
    expect(existsSync(statePath)).toBe(true);
    const content = JSON.parse(readFileSync(statePath, 'utf-8'));
    expect(content.version).toBe(1);
  });

  // Test 5: load() returns empty state for corrupt JSON
  it('load() returns empty state for corrupt JSON', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    writeFileSync(statePath, '{{not valid json', 'utf-8');
    const store = new ScanStateStore(statePath);
    const state = await store.load();
    expect(state).toEqual({
      version: 1,
      sessions: {},
      excludeProjects: [],
    });
  });

  // Test 6: load() returns empty state for invalid schema
  it('load() returns empty state for invalid schema', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    writeFileSync(statePath, JSON.stringify({ foo: 'bar' }), 'utf-8');
    const store = new ScanStateStore(statePath);
    const state = await store.load();
    expect(state).toEqual({
      version: 1,
      sessions: {},
      excludeProjects: [],
    });
  });

  // Test 7: load() returns empty state for wrong version type
  it('load() returns empty state for wrong version type', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    writeFileSync(
      statePath,
      JSON.stringify({ version: 'not-a-number', sessions: {}, excludeProjects: [] }),
      'utf-8',
    );
    const store = new ScanStateStore(statePath);
    const state = await store.load();
    expect(state).toEqual({
      version: 1,
      sessions: {},
      excludeProjects: [],
    });
  });

  // Test 8: load() preserves extra fields via .passthrough()
  it('load() preserves extra fields via .passthrough()', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const stateWithExtra = {
      version: 1,
      sessions: {},
      excludeProjects: [],
      futureField: true,
    };
    writeFileSync(statePath, JSON.stringify(stateWithExtra), 'utf-8');
    const store = new ScanStateStore(statePath);
    const loaded = await store.load();
    expect((loaded as Record<string, unknown>).futureField).toBe(true);
  });

  // Test 9: addExclude() adds project to exclude list
  it('addExclude() adds project to exclude list', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);
    // Save empty state first
    await store.save({ version: 1, sessions: {}, excludeProjects: [] });
    await store.addExclude('project-a');
    const loaded = await store.load();
    expect(loaded.excludeProjects).toContain('project-a');
  });

  // Test 10: addExclude() does not duplicate existing project
  it('addExclude() does not duplicate existing project', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);
    await store.save({ version: 1, sessions: {}, excludeProjects: ['project-a'] });
    await store.addExclude('project-a');
    const loaded = await store.load();
    expect(loaded.excludeProjects).toEqual(['project-a']);
  });

  // Test 11: removeExclude() removes project from exclude list
  it('removeExclude() removes project from exclude list', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);
    await store.save({
      version: 1,
      sessions: {},
      excludeProjects: ['project-a', 'project-b'],
    });
    await store.removeExclude('project-a');
    const loaded = await store.load();
    expect(loaded.excludeProjects).toEqual(['project-b']);
  });

  // Test 12: removeExclude() is no-op for non-existent project
  it('removeExclude() is no-op for non-existent project', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);
    await store.save({ version: 1, sessions: {}, excludeProjects: ['project-a'] });
    await store.removeExclude('project-x');
    const loaded = await store.load();
    expect(loaded.excludeProjects).toEqual(['project-a']);
  });

  // Test 13: save() overwrites previous state completely
  it('save() overwrites previous state completely', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);

    // Save with 2 sessions
    await store.save(validState);

    // Save again with only 1 session
    const singleSession = {
      version: 1,
      sessions: {
        'project-c:sess-003': {
          fileMtime: 1706200000000,
          scannedAt: '2026-01-16T10:00:00.000Z',
          projectSlug: 'project-c',
        },
      },
      excludeProjects: [],
    };
    await store.save(singleSession);

    const loaded = await store.load();
    expect(Object.keys(loaded.sessions)).toHaveLength(1);
    expect(loaded.sessions['project-c:sess-003']).toBeDefined();
    expect(loaded.sessions['project-a:sess-001']).toBeUndefined();
  });

  // Test 14: concurrent saves don't corrupt file
  it('concurrent saves do not corrupt file', async () => {
    createTmpDir();
    const statePath = join(tmpDir, 'scan-state.json');
    const store = new ScanStateStore(statePath);

    const state1 = {
      version: 1,
      sessions: {
        'proj:sess-1': {
          fileMtime: 1000,
          scannedAt: '2026-01-01T00:00:00.000Z',
          projectSlug: 'proj',
        },
      },
      excludeProjects: [],
    };

    const state2 = {
      version: 1,
      sessions: {
        'proj:sess-2': {
          fileMtime: 2000,
          scannedAt: '2026-01-02T00:00:00.000Z',
          projectSlug: 'proj',
        },
      },
      excludeProjects: [],
    };

    // Fire two saves rapidly (back-to-back)
    await Promise.all([store.save(state1), store.save(state2)]);

    // File must be valid JSON (not corrupted)
    const loaded = await store.load();
    expect(loaded.version).toBe(1);
    // One of the two states should have won
    const keys = Object.keys(loaded.sessions);
    expect(keys.length).toBe(1);
    expect(['proj:sess-1', 'proj:sess-2']).toContain(keys[0]);
  });
});
