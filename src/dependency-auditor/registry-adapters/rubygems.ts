/**
 * RubyGems registry adapter — fetches RegistryHealth from rubygems.org.
 *
 * Wired through the EgressContext chokepoint at v1.49.811 (second batch
 * KNOWN_UNWIRED migration following v1.49.809 npm). `ensureEgressAllowed`
 * is hoisted OUTSIDE the network-failure try/catch per Lesson #10427.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';
import { ensureEgressAllowed, type EgressContext } from '../../security/egress-context.js';

const EGRESS_SOURCE = 'dependency-auditor/rubygems-registry';

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

  async fetchHealth(dep: DependencyRecord, ctx?: EgressContext): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const url = `https://rubygems.org/api/v1/gems/${encodeURIComponent(dep.name)}.json`;

    // Hoisted OUTSIDE the network-failure try/catch per Lesson #10427:
    // EgressContextDenied is load-bearing and must propagate.
    ensureEgressAllowed(ctx, EGRESS_SOURCE, 'fetch', url);

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
