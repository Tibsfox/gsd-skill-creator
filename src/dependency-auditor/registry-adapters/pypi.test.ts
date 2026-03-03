import { describe, it, expect, vi, afterEach } from 'vitest';
import { PypiRegistryAdapter } from './pypi.js';

const stubFetch = (body: unknown, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PypiRegistryAdapter', () => {
  it('returns RegistryHealth from a successful response', async () => {
    stubFetch({
      info: {
        name: 'requests',
        version: '2.31.0',
        classifiers: [],
        description: 'Python HTTP library',
      },
      releases: {
        '2.31.0': [{ upload_time: '2023-05-22T14:00:00' }],
      },
    });

    const adapter = new PypiRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'requests',
      version: '2.31.0',
      ecosystem: 'pypi',
      sourceManifest: '/project/requirements.txt',
    });

    expect(health.ecosystem).toBe('pypi');
    expect(health.name).toBe('requests');
    expect(health.latestVersion).toBe('2.31.0');
    expect(health.lastPublishDate).toBe('2023-05-22T14:00:00');
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('returns all-nulls RegistryHealth on 404', async () => {
    stubFetch({}, 404);

    const adapter = new PypiRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'nonexistent-xyz-abc',
      version: '*',
      ecosystem: 'pypi',
      sourceManifest: '/project/requirements.txt',
    });

    expect(health.latestVersion).toBeNull();
    expect(health.lastPublishDate).toBeNull();
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('marks isDeprecated when classifiers includes inactive status', async () => {
    stubFetch({
      info: {
        name: 'old-lib',
        version: '1.0.0',
        classifiers: ['Development Status :: 7 - Inactive'],
        description: '',
      },
      releases: { '1.0.0': [{ upload_time: '2015-01-01T00:00:00' }] },
    });

    const adapter = new PypiRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'old-lib',
      version: '1.0.0',
      ecosystem: 'pypi',
      sourceManifest: '/project/requirements.txt',
    });

    expect(health.isDeprecated).toBe(true);
  });

  it('marks isDeprecated when description contains "deprecated"', async () => {
    stubFetch({
      info: {
        name: 'old-lib2',
        version: '2.0.0',
        classifiers: [],
        description: 'This package is DEPRECATED. Use new-lib instead.',
      },
      releases: { '2.0.0': [{ upload_time: '2020-01-01T00:00:00' }] },
    });

    const adapter = new PypiRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'old-lib2',
      version: '2.0.0',
      ecosystem: 'pypi',
      sourceManifest: '/project/requirements.txt',
    });

    expect(health.isDeprecated).toBe(true);
  });
});
