import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { PatternStore } from '../../../core/storage/pattern-store.js';
import { WantedRegistry } from '../wanted-registry.js';
import type { WantedDataProvider, WantedEntry } from '../wanted-registry.js';
import { PackSessionDriver } from '../pack-session-driver.js';

// ============================================================================
// Mock data provider
// ============================================================================

function createMockProvider(entries: WantedEntry[]): WantedDataProvider {
  return {
    async queryWanted() {
      return entries;
    },
  };
}

const MOCK_ENTRIES: WantedEntry[] = [
  { id: 'w-001', title: 'Write getting started guide', status: 'open', effortLevel: 'small', tags: ['docs', 'newcomer'], postedBy: 'cedar' },
  { id: 'w-002', title: 'Build CLI tool for scan', status: 'open', effortLevel: 'medium', tags: ['code', 'rust'], postedBy: 'hemlock' },
  { id: 'w-003', title: 'Design logo concepts', status: 'claimed', effortLevel: 'small', tags: ['design'], postedBy: 'foxy', claimedBy: 'willow' },
  { id: 'w-004', title: 'Review trust escalation docs', status: 'open', effortLevel: 'trivial', tags: ['docs', 'review'], postedBy: 'lex' },
];

// ============================================================================
// R5.2: WantedRegistry
// ============================================================================

describe('WantedRegistry', () => {
  it('searches all entries with no criteria', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const results = await registry.search();
    expect(results).toHaveLength(4);
  });

  it('filters by status', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const results = await registry.search({ status: 'open' });
    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'open')).toBe(true);
  });

  it('filters by effort level', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const results = await registry.search({ effortLevel: 'small' });
    expect(results).toHaveLength(2);
  });

  it('filters by tag', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const results = await registry.search({ tag: 'docs' });
    expect(results).toHaveLength(2);
    expect(results.map(r => r.id)).toContain('w-001');
    expect(results.map(r => r.id)).toContain('w-004');
  });

  it('filters by text search', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const results = await registry.search({ text: 'cli' });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe('w-002');
  });

  it('combines multiple filters', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const results = await registry.search({ status: 'open', tag: 'docs' });
    expect(results).toHaveLength(2);
  });

  it('gets entry by ID', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const entry = await registry.getById('w-003');
    expect(entry?.title).toBe('Design logo concepts');
    expect(entry?.claimedBy).toBe('willow');
  });

  it('returns undefined for missing ID', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const entry = await registry.getById('w-999');
    expect(entry).toBeUndefined();
  });

  it('returns available categories', async () => {
    const registry = new WantedRegistry(createMockProvider(MOCK_ENTRIES));
    const { effortLevels, tags } = await registry.getCategories();
    expect(effortLevels).toContain('small');
    expect(effortLevels).toContain('medium');
    expect(tags).toContain('docs');
    expect(tags).toContain('rust');
  });

  it('caches results within TTL', async () => {
    let queryCount = 0;
    const provider: WantedDataProvider = {
      async queryWanted() {
        queryCount++;
        return MOCK_ENTRIES;
      },
    };

    const registry = new WantedRegistry(provider, 10_000);
    await registry.search();
    await registry.search();
    await registry.search();

    expect(queryCount).toBe(1); // Only one actual query
  });

  it('invalidates cache on demand', async () => {
    let queryCount = 0;
    const provider: WantedDataProvider = {
      async queryWanted() {
        queryCount++;
        return MOCK_ENTRIES;
      },
    };

    const registry = new WantedRegistry(provider, 60_000);
    await registry.search();
    registry.invalidateCache();
    await registry.search();

    expect(queryCount).toBe(2);
  });
});

// ============================================================================
// R5.4: PackSessionDriver
// ============================================================================

describe('PackSessionDriver', () => {
  let tempDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'pack-session-'));
    store = new PatternStore(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const PACK_ID = 'wasteland-newcomer';
  const PHASES = ['phase-1-setup', 'phase-2-browse', 'phase-3-claim', 'phase-4-work', 'phase-5-submit', 'phase-6-celebrate'];

  it('tracks phase completion', async () => {
    const driver = new PackSessionDriver(store);

    await driver.completePhase(PACK_ID, 'phase-1-setup', 'fox', ['dolt-installed', 'rig-registered']);

    const complete = await driver.isPhaseComplete(PACK_ID, 'phase-1-setup', 'fox');
    expect(complete).toBe(true);

    const notComplete = await driver.isPhaseComplete(PACK_ID, 'phase-2-browse', 'fox');
    expect(notComplete).toBe(false);
  });

  it('reports progress through pack', async () => {
    const driver = new PackSessionDriver(store);

    await driver.completePhase(PACK_ID, 'phase-1-setup', 'fox');
    await driver.completePhase(PACK_ID, 'phase-2-browse', 'fox');

    const progress = await driver.getProgress(PACK_ID, 'fox', PHASES);
    expect(progress.completedPhases).toEqual(['phase-1-setup', 'phase-2-browse']);
    expect(progress.currentPhase).toBe('phase-3-claim');
    expect(progress.percentComplete).toBe(33); // 2/6
    expect(progress.totalPhases).toBe(6);
  });

  it('reports 100% when all phases complete', async () => {
    const driver = new PackSessionDriver(store);

    for (const phase of PHASES) {
      await driver.completePhase(PACK_ID, phase, 'fox');
    }

    const progress = await driver.getProgress(PACK_ID, 'fox', PHASES);
    expect(progress.percentComplete).toBe(100);
    expect(progress.currentPhase).toBeNull();
  });

  it('retrieves checkpoint results', async () => {
    const driver = new PackSessionDriver(store);
    const checkpoints = ['dolt-installed', 'authenticated', 'fork-created', 'rig-registered'];

    await driver.completePhase(PACK_ID, 'phase-1-setup', 'fox', checkpoints);

    const result = await driver.getCheckpoints(PACK_ID, 'phase-1-setup', 'fox');
    expect(result).toEqual(checkpoints);
  });

  it('returns empty checkpoints for uncompleted phase', async () => {
    const driver = new PackSessionDriver(store);
    const result = await driver.getCheckpoints(PACK_ID, 'phase-1-setup', 'fox');
    expect(result).toEqual([]);
  });

  it('isolates progress between rigs', async () => {
    const driver = new PackSessionDriver(store);

    await driver.completePhase(PACK_ID, 'phase-1-setup', 'fox');
    await driver.completePhase(PACK_ID, 'phase-1-setup', 'sam');
    await driver.completePhase(PACK_ID, 'phase-2-browse', 'sam');

    const foxProgress = await driver.getProgress(PACK_ID, 'fox', PHASES);
    const samProgress = await driver.getProgress(PACK_ID, 'sam', PHASES);

    expect(foxProgress.completedPhases).toHaveLength(1);
    expect(samProgress.completedPhases).toHaveLength(2);
  });
});

// ============================================================================
// R5.1: RESOURCES files exist
// ============================================================================

describe('Pack RESOURCES', () => {
  const RESOURCES_DIR = join(__dirname, '../../../packs/pack-wasteland-newcomer/RESOURCES');

  it('mvr-protocol.md exists and has content', async () => {
    const content = await readFile(join(RESOURCES_DIR, 'mvr-protocol.md'), 'utf8');
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('MVR Protocol');
    expect(content).toContain('Trust Levels');
  });

  it('passbook-guide.md exists and has content', async () => {
    const content = await readFile(join(RESOURCES_DIR, 'passbook-guide.md'), 'utf8');
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('Passbook');
    expect(content).toContain('Valence');
  });
});
