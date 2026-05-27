/**
 * conda registry adapter — tries conda-forge, then bioconda on the Anaconda API.
 *
 * Wired through the EgressContext chokepoint at v1.49.811 (second batch
 * KNOWN_UNWIRED migration following v1.49.809 npm). `ensureEgressAllowed`
 * is hoisted OUTSIDE each channel's network-failure try/catch per Lesson
 * #10427 — EgressContextDenied must propagate even when the channel-probe
 * swallows accessory network errors.
 */

import type { DependencyRecord, RegistryHealth } from '../types.js';
import type { RegistryAdapter } from '../registry-adapter.js';
import type { RateLimiter } from '../rate-limiter.js';
import { ensureEgressAllowed, type EgressContext } from '../../security/egress-context.js';

const EGRESS_SOURCE = 'dependency-auditor/conda-registry';

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
  ctx?: EgressContext,
): Promise<RegistryHealth | null> {
  const url = `https://api.anaconda.org/package/${channel}/${encodeURIComponent(name)}`;

  // Hoisted OUTSIDE the channel-probe try/catch per Lesson #10427:
  // EgressContextDenied is load-bearing and must propagate even when
  // accessory network errors are swallowed for channel-probe fallback.
  ensureEgressAllowed(ctx, EGRESS_SOURCE, 'fetch', url);

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

  async fetchHealth(dep: DependencyRecord, ctx?: EgressContext): Promise<RegistryHealth> {
    if (this.rateLimiter) await this.rateLimiter.acquire();

    const fromForge = await tryChannel('conda-forge', dep.name, ctx);
    if (fromForge) return fromForge;

    const fromBioconda = await tryChannel('bioconda', dep.name, ctx);
    if (fromBioconda) return fromBioconda;

    return nullHealth(dep.name);
  }
}

export default CondaRegistryAdapter;
