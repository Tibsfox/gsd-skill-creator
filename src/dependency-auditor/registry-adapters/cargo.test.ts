import { describe, it, expect, vi, afterEach } from 'vitest';
import { CargoRegistryAdapter } from './cargo.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const crateResponse = {
  crate: {
    name: 'serde',
    newest_version: '1.0.195',
    updated_at: '2024-01-15T12:00:00.000Z',
  },
};

describe('CargoRegistryAdapter', () => {
  it('returns RegistryHealth from a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(crateResponse),
      }),
    );

    const adapter = new CargoRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'serde',
      version: '1.0.195',
      ecosystem: 'cargo',
      sourceManifest: '/project/Cargo.toml',
    });

    expect(health.ecosystem).toBe('cargo');
    expect(health.name).toBe('serde');
    expect(health.latestVersion).toBe('1.0.195');
    expect(health.lastPublishDate).toBe('2024-01-15T12:00:00.000Z');
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('returns all-nulls RegistryHealth on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }),
    );

    const adapter = new CargoRegistryAdapter();
    const health = await adapter.fetchHealth({
      name: 'nonexistent-crate-xyz',
      version: '*',
      ecosystem: 'cargo',
      sourceManifest: '/project/Cargo.toml',
    });

    expect(health.latestVersion).toBeNull();
    expect(health.lastPublishDate).toBeNull();
    expect(health.isArchived).toBe(false);
    expect(health.isDeprecated).toBe(false);
    expect(health.maintainerCount).toBeNull();
  });

  it('includes User-Agent header in request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(crateResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const adapter = new CargoRegistryAdapter();
    await adapter.fetchHealth({
      name: 'serde',
      version: '1.0',
      ecosystem: 'cargo',
      sourceManifest: '/project/Cargo.toml',
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options?.headers as Record<string, string>;
    expect(headers?.['User-Agent']).toContain('gsd-skill-creator');
  });
});
