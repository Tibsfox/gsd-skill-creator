import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpmRegistryAdapter } from './npm.js';

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

describe('NpmRegistryAdapter', () => {
  it('returns RegistryHealth from a successful response', async () => {
    stubFetch({
      'dist-tags': { latest: '4.18.2' },
      time: { '4.18.2': '2023-03-01T10:00:00.000Z' },
      maintainers: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      versions: {
        '4.18.2': {},
      },
    });

    const adapter = new NpmRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'express',
      version: '4.18.2',
      ecosystem: 'npm',
      sourceManifest: '/project/package.json',
    });

    expect(health.ecosystem).toBe('npm');
    expect(health.name).toBe('express');
    expect(health.latestVersion).toBe('4.18.2');
    expect(health.lastPublishDate).toBe('2023-03-01T10:00:00.000Z');
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBe(3);
  });

  it('returns all-nulls RegistryHealth on 404', async () => {
    stubFetch({ error: 'Not Found' }, 404);

    const adapter = new NpmRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'nonexistent-pkg-xyz-abc',
      version: '*',
      ecosystem: 'npm',
      sourceManifest: '/project/package.json',
    });

    expect(health.latestVersion).toBeNull();
    expect(health.lastPublishDate).toBeNull();
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('marks isDeprecated when latest version has deprecated field', async () => {
    stubFetch({
      'dist-tags': { latest: '1.0.0' },
      time: { '1.0.0': '2020-01-01T00:00:00.000Z' },
      maintainers: [],
      versions: {
        '1.0.0': { deprecated: 'Use new-pkg instead' },
      },
    });

    const adapter = new NpmRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'old-pkg',
      version: '1.0.0',
      ecosystem: 'npm',
      sourceManifest: '/project/package.json',
    });

    expect(health.isDeprecated).toBe(true);
  });

  it('throws with descriptive message on network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    const adapter = new NpmRegistryAdapter();
    await expect(
      adapter.fetchHealth({
        name: 'express',
        version: '4.0.0',
        ecosystem: 'npm',
        sourceManifest: '/project/package.json',
      }),
    ).rejects.toThrow('npm registry unreachable');
  });
});
