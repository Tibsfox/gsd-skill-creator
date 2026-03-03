/**
 * npm registry adapter — fetches RegistryHealth from registry.npmjs.org.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';

function nullHealth(name: string): RegistryHealth {
  return {
    ecosystem: 'npm',
    name,
    latestVersion: null,
    lastPublishDate: null,
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
  };
}

export class NpmRegistryAdapter implements RegistryAdapter {
  constructor(private readonly rateLimiter?: RateLimiter) {}

  async fetchHealth(dep: DependencyRecord): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const url = `https://registry.npmjs.org/${encodeURIComponent(dep.name)}`;
    let resp: Response;

    try {
      resp = await fetch(url);
    } catch (err) {
      throw new Error(
        `npm registry unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (resp.status === 404) return nullHealth(dep.name);
    if (!resp.ok) {
      throw new Error(`npm registry error ${resp.status} for ${dep.name}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await resp.json()) as any;
    const latest: string = data['dist-tags']?.latest ?? null;
    const timeMap = data.time ?? {};
    const lastPublishDate: string | null = latest ? (timeMap[latest] ?? null) : null;
    const latestVersionObj = latest ? (data.versions?.[latest] ?? {}) : {};
    const isDeprecated = Boolean(latestVersionObj['deprecated']);
    const maintainers = data.maintainers;
    const maintainerCount =
      Array.isArray(maintainers) ? maintainers.length : null;

    return {
      ecosystem: 'npm',
      name: dep.name,
      latestVersion: latest ?? null,
      lastPublishDate,
      isArchived: false,
      isDeprecated,
      maintainerCount,
    };
  }
}

export default NpmRegistryAdapter;
