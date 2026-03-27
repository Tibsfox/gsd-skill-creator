import { describe, it, expect, vi, afterEach } from 'vitest';
import { RubygemsRegistryAdapter } from './rubygems.js';

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
});
