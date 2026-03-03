import { describe, it, expect, vi, afterEach } from 'vitest';
import { CondaRegistryAdapter } from './conda.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const condaForgeResponse = {
  name: 'numpy',
  latest_version: '1.26.4',
  modified: '2024-02-01T10:00:00.000Z',
  package_types: ['conda'],
};

const biocondaResponse = {
  name: 'biopython',
  latest_version: '1.83',
  modified: '2024-01-15T08:00:00.000Z',
  package_types: ['conda'],
};

describe('CondaRegistryAdapter', () => {
  it('returns RegistryHealth when conda-forge has the package', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(condaForgeResponse),
      }),
    );

    const adapter = new CondaRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'numpy',
      version: '1.24.0',
      ecosystem: 'conda',
      sourceManifest: '/project/environment.yml',
    });

    expect(health.ecosystem).toBe('conda');
    expect(health.name).toBe('numpy');
    expect(health.latestVersion).toBe('1.26.4');
    expect(health.lastPublishDate).toBe('2024-02-01T10:00:00.000Z');
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('falls back to bioconda when conda-forge returns 404', async () => {
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // conda-forge 404
          return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
        }
        // bioconda hit
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(biocondaResponse),
        });
      }),
    );

    const adapter = new CondaRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'biopython',
      version: '1.79',
      ecosystem: 'conda',
      sourceManifest: '/project/environment.yml',
    });

    expect(health.latestVersion).toBe('1.83');
    expect(callCount).toBe(2);
  });

  it('returns all-nulls when both channels 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }),
    );

    const adapter = new CondaRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'xyz-not-real',
      version: '*',
      ecosystem: 'conda',
      sourceManifest: '/project/environment.yml',
    });

    expect(health.latestVersion).toBeNull();
    expect(health.lastPublishDate).toBeNull();
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });
});
