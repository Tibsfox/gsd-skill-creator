/**
 * RubyGems registry adapter — fetches RegistryHealth from rubygems.org.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';

function nullHealth(name: string): RegistryHealth {
  return {
    ecosystem: 'rubygems',
    name,
    latestVersion: null,
    lastPublishDate: null,
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
  };
}

export class RubygemsRegistryAdapter implements RegistryAdapter {
  constructor(private readonly rateLimiter?: RateLimiter) {}

  async fetchHealth(dep: DependencyRecord): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const url = `https://rubygems.org/api/v1/gems/${encodeURIComponent(dep.name)}.json`;
    let resp: Response;

    try {
      resp = await fetch(url);
    } catch (err) {
      throw new Error(
        `RubyGems registry unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (resp.status === 404) return nullHealth(dep.name);
    if (!resp.ok) {
      throw new Error(`RubyGems registry error ${resp.status} for ${dep.name}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await resp.json()) as any;

    return {
      ecosystem: 'rubygems',
      name: dep.name,
      latestVersion: (data.version as string) ?? null,
      lastPublishDate: (data.built_at as string) ?? null,
      isArchived: false,
      isDeprecated: false,
      maintainerCount: null,
    };
  }
}

export default RubygemsRegistryAdapter;
