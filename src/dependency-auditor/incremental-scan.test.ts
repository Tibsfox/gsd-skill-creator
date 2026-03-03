import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { IncrementalScanner } from './incremental-scan.js';
import type { DependencyRecord, HealthSignal } from './types.js';

let tmpDir: string;
let stateFile: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'inc-scan-test-'));
  stateFile = join(tmpDir, 'state.json');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const dep1: DependencyRecord = {
  name: 'express',
  version: '4.18.0',
  ecosystem: 'npm',
  sourceManifest: '',  // will be set per test
};

function makeDep(overrides: Partial<DependencyRecord> = {}): DependencyRecord {
  return { ...dep1, ...overrides };
}

function makeSignal(dep: DependencyRecord): HealthSignal {
  return {
    dependency: dep,
    registryHealth: {
      ecosystem: dep.ecosystem,
      name: dep.name,
      latestVersion: '4.18.2',
      lastPublishDate: '2023-01-01T00:00:00.000Z',
      isArchived: false,
      isDeprecated: false,
      maintainerCount: 5,
    },
    vulnerabilities: [],
  };
}

describe('IncrementalScanner', () => {
  it('returns all deps as stale on first run (no state file)', async () => {
    const manifestPath = join(tmpDir, 'package.json');
    await writeFile(manifestPath, JSON.stringify({ dependencies: { express: '^4.18.0' } }));

    const dep = makeDep({ sourceManifest: manifestPath });
    const scanner = new IncrementalScanner(stateFile);
    await scanner.load();

    const stale = await scanner.getStaleOrNew([dep], [manifestPath]);
    expect(stale).toHaveLength(1);
    expect(stale[0].name).toBe('express');
  });

  it('returns empty array when all deps are cached and manifest unchanged', async () => {
    const manifestPath = join(tmpDir, 'package.json');
    const manifestContent = JSON.stringify({ dependencies: { express: '^4.18.0' } });
    await writeFile(manifestPath, manifestContent);

    const dep = makeDep({ sourceManifest: manifestPath });
    const signal = makeSignal(dep);

    // Hash the manifest content
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(manifestContent).digest('hex');

    const scanner = new IncrementalScanner(stateFile);
    await scanner.saveState({
      manifestHashes: { [manifestPath]: hash },
      lastScanAt: new Date().toISOString(),
      cachedSignals: { 'npm:express': signal },
    });

    await scanner.load();
    const stale = await scanner.getStaleOrNew([dep], [manifestPath]);
    expect(stale).toHaveLength(0);
  });

  it('returns all deps from changed manifest as stale', async () => {
    const manifestPath = join(tmpDir, 'package.json');
    await writeFile(manifestPath, JSON.stringify({ dependencies: { express: '^4.18.0' } }));

    const dep = makeDep({ sourceManifest: manifestPath });
    const signal = makeSignal(dep);

    // Save state with OLD hash
    const scanner = new IncrementalScanner(stateFile);
    await scanner.saveState({
      manifestHashes: { [manifestPath]: 'old-hash-value' },
      lastScanAt: new Date().toISOString(),
      cachedSignals: { 'npm:express': signal },
    });

    await scanner.load();
    const stale = await scanner.getStaleOrNew([dep], [manifestPath]);
    // manifest hash changed → dep is stale
    expect(stale).toHaveLength(1);
  });

  it('returns only new dep as stale when dep is not in cache', async () => {
    const manifestPath = join(tmpDir, 'package.json');
    const manifestContent = JSON.stringify({ dependencies: { express: '^4.18.0', lodash: '4.17.21' } });
    await writeFile(manifestPath, manifestContent);

    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(manifestContent).digest('hex');

    const expressSignal = makeSignal(makeDep({ sourceManifest: manifestPath }));

    const scanner = new IncrementalScanner(stateFile);
    await scanner.saveState({
      manifestHashes: { [manifestPath]: hash },
      lastScanAt: new Date().toISOString(),
      // Only express is cached; lodash is new
      cachedSignals: { 'npm:express': expressSignal },
    });

    await scanner.load();
    const lodash = makeDep({ name: 'lodash', version: '4.17.21', sourceManifest: manifestPath });
    const stale = await scanner.getStaleOrNew(
      [makeDep({ sourceManifest: manifestPath }), lodash],
      [manifestPath],
    );

    expect(stale).toHaveLength(1);
    expect(stale[0].name).toBe('lodash');
  });

  it('getCachedSignal returns the stored signal', async () => {
    const manifestPath = join(tmpDir, 'package.json');
    const dep = makeDep({ sourceManifest: manifestPath });
    const signal = makeSignal(dep);

    const scanner = new IncrementalScanner(stateFile);
    await scanner.saveState({
      manifestHashes: {},
      lastScanAt: new Date().toISOString(),
      cachedSignals: { 'npm:express': signal },
    });
    await scanner.load();

    expect(scanner.getCachedSignal('npm:express')).toEqual(signal);
    expect(scanner.getCachedSignal('npm:nonexistent')).toBeUndefined();
  });

  it('saveState writes atomically (file exists after save)', async () => {
    const scanner = new IncrementalScanner(stateFile);
    await scanner.saveState({
      manifestHashes: {},
      lastScanAt: new Date().toISOString(),
      cachedSignals: {},
    });

    const { readFile } = await import('node:fs/promises');
    const content = await readFile(stateFile, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.manifestHashes).toBeDefined();
  });
});
