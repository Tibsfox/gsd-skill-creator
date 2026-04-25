/**
 * HB-02 AgentDoG — `What` axis.
 *
 * Records the impacted asset + blast-radius classification for a Safety
 * Warden BLOCK decision. The `What` axis answers: "what would have been
 * affected if this BLOCK hadn't fired, and how far?"
 *
 * Source: arXiv:2601.18491 (AgentDoG).
 *
 * Privacy invariant: `impactedAsset` records a *category label*
 * (e.g. "secret", "signing-key", ".git"), never the asset's content.
 * Captured strings are clipped at a small character bound so a BLOCK on
 * a leaked secret cannot accidentally leak the secret itself into the
 * AgentDoG record.
 *
 * @module safety/agentdog/what
 */

/**
 * Blast radius — how far the impact would have reached.
 *
 * Closed enum from the spec.
 */
export type BlastRadius = 'session' | 'project' | 'cross-session' | 'cross-project';

/**
 * `What` axis.
 */
export interface WhatAxis {
  readonly impactedAsset: string;
  readonly blastRadius: BlastRadius;
}

const RADIUS_VALUES: ReadonlySet<BlastRadius> = new Set<BlastRadius>([
  'session',
  'project',
  'cross-session',
  'cross-project',
]);

/** Privacy clip bound — keeps asset labels short, prevents content leakage. */
export const IMPACTED_ASSET_MAX_LEN = 64;

/**
 * Clip an asset label to {@link IMPACTED_ASSET_MAX_LEN} characters.
 * Privacy guard: the AgentDoG record stores asset *categories*, never
 * asset content. Long incoming strings are aggressive evidence the
 * caller is leaking content into the label; clip + return.
 */
export function clipAssetLabel(label: string): string {
  if (label.length <= IMPACTED_ASSET_MAX_LEN) return label;
  return label.slice(0, IMPACTED_ASSET_MAX_LEN);
}

/**
 * Capture the `What` axis. Unknown blast radius falls back to `'session'`
 * (the safest narrowest classification — under-report rather than over-claim).
 */
export function captureWhatAxis(input: {
  impactedAsset?: string;
  blastRadius?: string;
}): WhatAxis {
  const asset = typeof input.impactedAsset === 'string' ? clipAssetLabel(input.impactedAsset) : '';
  const radius =
    typeof input.blastRadius === 'string' &&
    RADIUS_VALUES.has(input.blastRadius as BlastRadius)
      ? (input.blastRadius as BlastRadius)
      : 'session';
  return Object.freeze({ impactedAsset: asset, blastRadius: radius });
}

export const BLAST_RADII: ReadonlyArray<BlastRadius> = Array.from(RADIUS_VALUES);
