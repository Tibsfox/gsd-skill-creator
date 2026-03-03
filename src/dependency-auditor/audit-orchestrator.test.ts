import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { DependencyRecord, RegistryHealth, AuditorConfig } from './types.js';

function makeHealth(ecosystem: DependencyRecord['ecosystem'], name: string): RegistryHealth {
  return {
    ecosystem,
    name,
    latestVersion: '1.0.0',
    lastPublishDate: '2024-01-01T00:00:00.000Z',
    isArchived: false,
    isDeprecated: false,
    maintainerCount: 1,
  };
}

// Mock all registry adapters and supporting modules using proper class constructors
vi.mock('./registry-adapters/npm.js', () => {
  const fetchHealth = vi.fn().mockResolvedValue(makeHealth('npm', 'express'));
  return { NpmRegistryAdapter: class { fetchHealth = fetchHealth; } };
});
vi.mock('./registry-adapters/pypi.js', () => {
  const fetchHealth = vi.fn().mockResolvedValue(makeHealth('pypi', 'requests'));
  return { PypiRegistryAdapter: class { fetchHealth = fetchHealth; } };
});
vi.mock('./registry-adapters/conda.js', () => {
  const fetchHealth = vi.fn().mockResolvedValue(makeHealth('conda', 'numpy'));
  return { CondaRegistryAdapter: class { fetchHealth = fetchHealth; } };
});
vi.mock('./registry-adapters/cargo.js', () => {
  const fetchHealth = vi.fn().mockResolvedValue(makeHealth('cargo', 'serde'));
  return { CargoRegistryAdapter: class { fetchHealth = fetchHealth; } };
});
vi.mock('./registry-adapters/rubygems.js', () => {
  const fetchHealth = vi.fn().mockResolvedValue(makeHealth('rubygems', 'rails'));
  return { RubygemsRegistryAdapter: class { fetchHealth = fetchHealth; } };
});
vi.mock('./osv-client.js', () => {
  return { OsvClient: class { queryBatch = vi.fn().mockResolvedValue(new Map()); } };
});

const mockDryRunCheck = vi.fn().mockResolvedValue({
  ecosystem: 'npm',
  hasConflicts: false,
  conflictSummary: [],
  rawOutput: '',
});
vi.mock('./dry-run-gate.js', () => {
  return { DryRunGate: class { check = mockDryRunCheck; } };
});

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'audit-orch-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('AuditOrchestrator', () => {
  it('run() returns a complete AuditSnapshot', async () => {
    const { AuditOrchestrator } = await import('./audit-orchestrator.js');
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' } }),
    );

    const config: AuditorConfig = { projectRoot: tmpDir };
    const orchestrator = new AuditOrchestrator(config);
    const snapshot = await orchestrator.run();

    expect(snapshot.projectRoot).toBe(tmpDir);
    expect(typeof snapshot.scannedAt).toBe('string');
    expect(Array.isArray(snapshot.dependencies)).toBe(true);
    expect(Array.isArray(snapshot.signals)).toBe(true);
    expect(snapshot.dependencies.some((d) => d.name === 'express')).toBe(true);
    expect(snapshot.signals).toHaveLength(1);
  });

  it('run() does not call DryRunGate when dryRunEnabled is false', async () => {
    const { AuditOrchestrator } = await import('./audit-orchestrator.js');
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' } }),
    );

    const config: AuditorConfig = { projectRoot: tmpDir, dryRunEnabled: false };
    const orchestrator = new AuditOrchestrator(config);
    await orchestrator.run();

    expect(mockDryRunCheck).not.toHaveBeenCalled();
  });

  it('run() calls DryRunGate when dryRunEnabled is true', async () => {
    const { AuditOrchestrator } = await import('./audit-orchestrator.js');
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' } }),
    );

    const config: AuditorConfig = { projectRoot: tmpDir, dryRunEnabled: true };
    const orchestrator = new AuditOrchestrator(config);
    await orchestrator.run();

    expect(mockDryRunCheck).toHaveBeenCalledWith(tmpDir, 'npm');
  });

  it('run() returns empty signals for empty project', async () => {
    const { AuditOrchestrator } = await import('./audit-orchestrator.js');

    const config: AuditorConfig = { projectRoot: tmpDir };
    const orchestrator = new AuditOrchestrator(config);
    const snapshot = await orchestrator.run();

    expect(snapshot.dependencies).toHaveLength(0);
    expect(snapshot.signals).toHaveLength(0);
  });

  it('second run() uses cached signals without re-fetching registry', async () => {
    const { AuditOrchestrator } = await import('./audit-orchestrator.js');
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { express: '4.18.0' } }),
    );

    const stateFilePath = join(tmpDir, 'audit-state.json');
    const config: AuditorConfig = { projectRoot: tmpDir, stateFilePath };

    // First run — fetches registry
    const orch1 = new AuditOrchestrator(config);
    const snap1 = await orch1.run();
    expect(snap1.signals).toHaveLength(1);

    // Get the fetchHealth mock to count calls
    const { NpmRegistryAdapter } = await import('./registry-adapters/npm.js');
    // Reset mock call count
    const instance = new NpmRegistryAdapter();
    const fetchMock = instance.fetchHealth as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();

    // Second run — manifest unchanged, should use cache
    const orch2 = new AuditOrchestrator(config);
    const snap2 = await orch2.run();
    expect(snap2.signals).toHaveLength(1);

    // The fresh mock instance's fetchHealth should not have been called
    // (because incremental scanner returns empty stale list)
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
