import { describe, it, expect, vi, afterEach } from 'vitest';
import { NpmRegistryAdapter } from './npm.js';
import { EgressContextDenied, type EgressContext } from '../../security/egress-context.js';

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

  // v1.49.809: EgressContext chokepoint wire.
  describe('EgressContext integration', () => {
    it('throws EgressContextDenied when ctx restricts the registry URL', async () => {
      // Restricted ctx with NO allowed patterns — every URL is denied.
      const ctx: EgressContext = {
        allowList: [],
        audit: { record() {} },
      };
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const adapter = new NpmRegistryAdapter();
      await expect(
        adapter.fetchHealth(
          {
            name: 'express',
            version: '4.0.0',
            ecosystem: 'npm',
            sourceManifest: '/project/package.json',
          },
          ctx,
        ),
      ).rejects.toThrow(EgressContextDenied);

      // ensureEgressAllowed must be called BEFORE fetch (#10427) — so fetch
      // never executes when the policy denies.
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('records an audit entry when ctx allows the URL', async () => {
      const records: { source: string; target: string }[] = [];
      const ctx: EgressContext = {
        allowList: [/^https:\/\/registry\.npmjs\.org\//],
        audit: {
          record(r) {
            records.push({ source: r.source, target: r.target });
          },
        },
      };
      stubFetch({
        'dist-tags': { latest: '1.0.0' },
        time: { '1.0.0': '2024-01-01T00:00:00.000Z' },
        maintainers: [],
        versions: { '1.0.0': {} },
      });
      const adapter = new NpmRegistryAdapter();
      await adapter.fetchHealth(
        {
          name: 'express',
          version: '1.0.0',
          ecosystem: 'npm',
          sourceManifest: '/project/package.json',
        },
        ctx,
      );
      expect(records).toHaveLength(1);
      expect(records[0].source).toBe('dependency-auditor/npm-registry');
      expect(records[0].target).toBe('https://registry.npmjs.org/express');
    });
  });
});
