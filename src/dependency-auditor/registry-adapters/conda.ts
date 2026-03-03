/**
 * conda registry adapter — tries conda-forge, then bioconda on the Anaconda API.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';

function nullHealth(name: string): RegistryHealth {
  return {
    ecosystem: 'conda',
    name,
    latestVersion: null,
    lastPublishDate: null,
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
  };
}

async function tryChannel(
  channel: string,
  name: string,
): Promise<RegistryHealth | null> {
  const url = `https://api.anaconda.org/package/${channel}/${encodeURIComponent(name)}`;
  let resp: Response;

  try {
    resp = await fetch(url);
  } catch {
    return null;
  }

  if (!resp.ok) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await resp.json()) as any;

  return {
    ecosystem: 'conda',
    name,
    latestVersion: (data.latest_version as string) ?? null,
    lastPublishDate: (data.modified as string) ?? null,
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
  };
}

export class CondaRegistryAdapter implements RegistryAdapter {
  constructor(private readonly rateLimiter?: RateLimiter) {}

  async fetchHealth(dep: DependencyRecord): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const fromForge = await tryChannel('conda-forge', dep.name);
    if (fromForge) return fromForge;

    const fromBioconda = await tryChannel('bioconda', dep.name);
    if (fromBioconda) return fromBioconda;

    return nullHealth(dep.name);
  }
}

export default CondaRegistryAdapter;
