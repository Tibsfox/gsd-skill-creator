/**
 * Tests for the pipeline stage orchestrator.
 *
 * The pipeline coordinates 5 stages: discover -> fetch -> scan -> install -> launch.
 * Each stage delegates to existing barrel exports. The scan gate is enforced
 * between scan and install stages per AGT-03.
 *
 * @module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineStage, PipelineStageResult, StageContext } from './pipeline.js';

// Mock all barrel imports that the pipeline delegates to
vi.mock('./search.js', () => ({
  searchPackages: vi.fn(),
}));

vi.mock('./package-fetcher.js', () => ({
  fetchPackage: vi.fn(),
}));

vi.mock('./scan-orchestrator.js', () => ({
  scanPackage: vi.fn(),
}));

vi.mock('./scan-gate.js', () => ({
  checkScanGate: vi.fn(),
  installPackage: vi.fn(),
}));

import { searchPackages } from './search.js';
import { fetchPackage } from './package-fetcher.js';
import { scanPackage } from './scan-orchestrator.js';
import { checkScanGate, installPackage } from './scan-gate.js';
import { executePipelineStage } from './pipeline.js';

describe('PipelineStage type', () => {
  it('accepts the 5 valid stage names', () => {
    const stages: PipelineStage[] = ['discover', 'fetch', 'scan', 'install', 'launch'];
    expect(stages).toHaveLength(5);
  });
});

describe('executePipelineStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // discover stage
  // =========================================================================

  it('discover stage: calls searchPackages and returns results', async () => {
    const mockResults = [
      { package: { filename: 'ProTracker.lha' }, score: 3, matchField: 'name' },
    ];
    vi.mocked(searchPackages).mockReturnValue(mockResults as any);

    const ctx: StageContext = {
      stage: 'discover',
      query: 'protracker',
      searchOptions: { query: 'protracker' },
      indexPackages: [{ filename: 'ProTracker.lha' }] as any,
      readmeIndex: new Map(),
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('discover');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResults);
    expect(searchPackages).toHaveBeenCalledOnce();
  });

  // =========================================================================
  // fetch stage
  // =========================================================================

  it('fetch stage: calls fetchPackage and returns result', async () => {
    const mockFetch = { lhaPath: '/mirror/mus/edit/PT.lha', lhaData: Buffer.alloc(0) };
    vi.mocked(fetchPackage).mockResolvedValue(mockFetch as any);

    const ctx: StageContext = {
      stage: 'fetch',
      fetchPackage: { filename: 'PT.lha', fullPath: 'mus/edit/PT.lha' } as any,
      downloadConfig: { mirrors: ['https://aminet.net'], mirrorDir: '/tmp/mirror', cacheDir: '/tmp/cache' } as any,
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('fetch');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockFetch);
    expect(fetchPackage).toHaveBeenCalledOnce();
  });

  // =========================================================================
  // scan stage
  // =========================================================================

  it('scan stage: calls scanPackage and returns scan report', async () => {
    const mockReport = {
      fullPath: 'mus/edit/PT.lha',
      verdict: 'clean',
      scannedAt: '2026-01-01T00:00:00Z',
      scanDepth: 'standard',
      signatureMatches: [],
      heuristicFlags: [],
    };
    vi.mocked(scanPackage).mockReturnValue(mockReport as any);

    const ctx: StageContext = {
      stage: 'scan',
      scanFullPath: 'mus/edit/PT.lha',
      scanData: new Uint8Array([0x00]),
      scanSignatures: [],
      scanPolicy: { version: 1, defaultDepth: 'standard', depths: {} } as any,
      scanDepth: 'standard',
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('scan');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockReport);
    expect(scanPackage).toHaveBeenCalledOnce();
  });

  // =========================================================================
  // install stage with clean scan (scan gate passes)
  // =========================================================================

  it('install stage with clean scan: calls checkScanGate then installPackage', async () => {
    vi.mocked(checkScanGate).mockReturnValue({
      allowed: true,
      reason: 'Package is clean',
      requiresOverride: false,
    });
    const mockInstallResult = {
      manifest: { fullPath: 'mus/edit/PT.lha', installedAt: '2026-01-01' },
      updatedState: { entries: {}, lastUpdated: '', version: 1 },
    };
    vi.mocked(installPackage).mockResolvedValue(mockInstallResult as any);

    const ctx: StageContext = {
      stage: 'install',
      installOptions: {
        fullPath: 'mus/edit/PT.lha',
        archivePath: '/mirror/mus/edit/PT.lha',
        state: { entries: {}, lastUpdated: '', version: 1 } as any,
        config: { sysRoot: '/amiga' },
        manifestDir: '/tmp/manifests',
        statePath: '/tmp/state.json',
      },
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('install');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockInstallResult);
    expect(checkScanGate).toHaveBeenCalledOnce();
    expect(installPackage).toHaveBeenCalledOnce();
  });

  // =========================================================================
  // install stage with infected scan (AGT-03: scan gate blocks)
  // =========================================================================

  it('install stage with infected scan: checkScanGate blocks pipeline (AGT-03)', async () => {
    vi.mocked(checkScanGate).mockReturnValue({
      allowed: false,
      reason: 'Package is infected and cannot be installed',
      requiresOverride: false,
    });

    const ctx: StageContext = {
      stage: 'install',
      installOptions: {
        fullPath: 'mus/edit/Virus.lha',
        archivePath: '/mirror/mus/edit/Virus.lha',
        state: {
          entries: {
            'mus/edit/Virus.lha': {
              fullPath: 'mus/edit/Virus.lha',
              status: 'infected',
              sizeKb: 10,
              sha256: null,
              localPath: null,
              downloadedAt: null,
              lastChecked: null,
            },
          },
          lastUpdated: '2026-01-01T00:00:00Z',
          version: 1,
        },
        config: { sysRoot: '/amiga' },
        manifestDir: '/tmp/manifests',
        statePath: '/tmp/state.json',
      },
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('install');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('SCAN_GATE_BLOCKED');
    expect(result.error!.message).toContain('infected');
    expect(installPackage).not.toHaveBeenCalled();
  });

  // =========================================================================
  // launch stage
  // =========================================================================

  it('launch stage: returns success with launch config passed through', async () => {
    const ctx: StageContext = {
      stage: 'launch',
      launchConfig: { profileId: 'a500', kickstartFile: '/roms/kick13.rom' },
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('launch');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ profileId: 'a500', kickstartFile: '/roms/kick13.rom' });
  });

  // =========================================================================
  // unknown stage
  // =========================================================================

  it('unknown stage: returns success false with UNKNOWN_STAGE', async () => {
    const ctx: StageContext = {
      stage: 'invalid-stage' as PipelineStage,
    };

    const result = await executePipelineStage(ctx);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('UNKNOWN_STAGE');
  });

  // =========================================================================
  // stage failure propagation
  // =========================================================================

  it('stage failure propagation: catches thrown errors and returns structured failure', async () => {
    vi.mocked(fetchPackage).mockRejectedValue(new Error('Network timeout'));

    const ctx: StageContext = {
      stage: 'fetch',
      fetchPackage: { filename: 'PT.lha', fullPath: 'mus/edit/PT.lha' } as any,
      downloadConfig: { mirrors: ['https://aminet.net'], mirrorDir: '/tmp/mirror', cacheDir: '/tmp/cache' } as any,
    };

    const result = await executePipelineStage(ctx);

    expect(result.stage).toBe('fetch');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe('STAGE_ERROR');
    expect(result.error!.message).toContain('Network timeout');
  });
});
