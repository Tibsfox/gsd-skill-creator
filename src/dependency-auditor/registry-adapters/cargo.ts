/**
 * Cargo (crates.io) registry adapter.
 *
 * Note: crates.io requires a User-Agent header — requests without it receive 403.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';

const USER_AGENT = 'gsd-skill-creator/1.0 (https://github.com/Tibsfox/gsd-skill-creator)';

function nullHealth(name: string): RegistryHealth {
  return {
    ecosystem: 'cargo',
    name,
    latestVersion: null,
    lastPublishDate: null,
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
  };
}

export class CargoRegistryAdapter implements RegistryAdapter {
  constructor(private readonly rateLimiter?: RateLimiter) {}

  async fetchHealth(dep: DependencyRecord): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const url = `https://crates.io/api/v1/crates/${encodeURIComponent(dep.name)}`;
    let resp: Response;

    try {
      resp = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
    } catch (err) {
      throw new Error(
        `crates.io registry unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (resp.status === 404) return nullHealth(dep.name);
    if (!resp.ok) {
      throw new Error(`crates.io registry error ${resp.status} for ${dep.name}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await resp.json()) as any;
    const crateInfo = data.crate ?? {};

    return {
      ecosystem: 'cargo',
      name: dep.name,
      latestVersion: (crateInfo.newest_version as string) ?? null,
      lastPublishDate: (crateInfo.updated_at as string) ?? null,
      isArchived: false,
      isDeprecated: false,
      maintainerCount: null,
    };
  }
}

export default CargoRegistryAdapter;
