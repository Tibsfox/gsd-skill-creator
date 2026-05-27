import { describe, it, expect, vi, afterEach } from 'vitest';
import { RubygemsRegistryAdapter } from './rubygems.js';
import { EgressContextDenied, type EgressContext } from '../../security/egress-context.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const gemResponse = {
  name: 'rails',
  version: '7.1.3',
  built_at: '2024-01-16T00:00:00.000Z',
};

describe('RubygemsRegistryAdapter', () => {
  it('returns RegistryHealth from a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(gemResponse),
      }),
    );

    const adapter = new RubygemsRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'rails',
      version: '~> 7.0',
      ecosystem: 'rubygems',
      sourceManifest: '/project/Gemfile',
    });

    expect(health.ecosystem).toBe('rubygems');
    expect(health.name).toBe('rails');
    expect(health.latestVersion).toBe('7.1.3');
    expect(health.lastPublishDate).toBe('2024-01-16T00:00:00.000Z');
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('returns all-nulls RegistryHealth on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }),
    );

    const adapter = new RubygemsRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'nonexistent-gem-xyz',
      version: '*',
      ecosystem: 'rubygems',
      sourceManifest: '/project/Gemfile',
    });

    expect(health.latestVersion).toBeNull();
    expect(health.lastPublishDate).toBeNull();
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  describe('EgressContext integration', () => {
    it('throws EgressContextDenied when ctx restricts the registry URL', async () => {
      const ctx: EgressContext = {
        allowList: [],
        audit: { record() {} },
      };
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const adapter = new RubygemsRegistryAdapter();
      await expect(
        adapter.fetchHealth(
          {
            name: 'rails',
            version: '7.0.0',
            ecosystem: 'rubygems',
            sourceManifest: '/project/Gemfile',
          },
          ctx,
        ),
      ).rejects.toThrow(EgressContextDenied);

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('records an audit entry when ctx allows the URL', async () => {
      const records: { source: string; target: string }[] = [];
      const ctx: EgressContext = {
        allowList: [/^https:\/\/rubygems\.org\//],
        audit: {
          record(r) {
            records.push({ source: r.source, target: r.target });
          },
        },
      };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ version: '7.0.0', built_at: '2024-01-01' }),
        }),
      );
      const adapter = new RubygemsRegistryAdapter();
      await adapter.fetchHealth(
        {
          name: 'rails',
          version: '7.0.0',
          ecosystem: 'rubygems',
          sourceManifest: '/project/Gemfile',
        },
        ctx,
      );
      expect(records).toHaveLength(1);
      expect(records[0].source).toBe('dependency-auditor/rubygems-registry');
      expect(records[0].target).toBe('https://rubygems.org/api/v1/gems/rails.json');
    });
  });
});
