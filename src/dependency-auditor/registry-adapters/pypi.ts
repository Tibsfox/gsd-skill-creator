/**
 * PyPI registry adapter — fetches RegistryHealth from pypi.org/pypi.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';

function nullHealth(name: string): RegistryHealth {
  return {
    ecosystem: 'pypi',
    name,
    latestVersion: null,
    lastPublishDate: null,
    isArchived: false,
    isDeprecated: false,
    maintainerCount: null,
  };
}

export class PypiRegistryAdapter implements RegistryAdapter {
  constructor(private readonly rateLimiter?: RateLimiter) {}

  async fetchHealth(dep: DependencyRecord): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const url = `https://pypi.org/pypi/${encodeURIComponent(dep.name)}/json`;
    let resp: Response;

    try {
      resp = await fetch(url);
    } catch (err) {
      throw new Error(
        `PyPI registry unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (resp.status === 404) return nullHealth(dep.name);
    if (!resp.ok) {
      throw new Error(`PyPI registry error ${resp.status} for ${dep.name}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await resp.json()) as any;
    const info = data.info ?? {};
    const latestVersion: string | null = info.version ?? null;
    const releases = data.releases ?? {};
    const releaseFiles: unknown[] = latestVersion ? (releases[latestVersion] ?? []) : [];
    const firstFile = Array.isArray(releaseFiles) && releaseFiles.length > 0
      ? (releaseFiles[0] as Record<string, unknown>)
      : null;
    const lastPublishDate: string | null = firstFile
      ? (firstFile['upload_time'] as string) ?? null
      : null;

    const classifiers: string[] = Array.isArray(info.classifiers) ? info.classifiers : [];
    const description: string = typeof info.description === 'string' ? info.description : '';
    const isDeprecated =
      classifiers.includes('Development Status :: 7 - Inactive') ||
      description.toLowerCase().includes('deprecated');

    return {
      ecosystem: 'pypi',
      name: dep.name,
      latestVersion,
      lastPublishDate,
      isArchived: false,
      isDeprecated,
      maintainerCount: null,
    };
  }
}

export default PypiRegistryAdapter;
