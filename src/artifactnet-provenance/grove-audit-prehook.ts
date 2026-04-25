/**
 * Grove audit pre-hook.
 *
 * Composes the ArtifactNet provenance verifier with the existing skill/asset
 * audit pipeline (e.g. `src/skilldex-auditor` and Grove record audit) as a
 * **pre-audit step**. Provenance findings are PREPENDED to the existing
 * audit report's `preAudit` slot — the existing `findings` array is never
 * mutated.
 *
 * ## Hard preservation invariants (Gate G13)
 *
 * 1. With the flag off, `composeWithAudit()` returns its input unchanged
 *    (referential equality preserved).
 * 2. With the flag on, the existing `AuditReport` is shallow-cloned with a
 *    fresh `preAudit` array; original arrays/fields are not touched.
 * 3. We never write to disk, never mutate Grove storage, never construct
 *    skill-DAG edges.
 * 4. Type-only references to `src/memory/` and `src/skilldex-auditor/` are
 *    permitted via `import type` ONLY; no runtime imports cross those
 *    module boundaries.
 *
 * @module artifactnet-provenance/grove-audit-prehook
 */

import { extractResidualSignature } from './forensic-residual-detector.js';
import { classifySignature } from './sonics-detector.js';
import { isArtifactNetProvenanceEnabled } from './settings.js';
import type {
  Asset,
  ExistingAudit,
  ProvenanceFinding,
} from './types.js';

/**
 * Run the provenance verifier on a single asset.
 *
 * - When the flag is OFF: returns a `disabled: true` finding with verdict
 *   `unknown` and confidence 0. No detector runs.
 * - When the flag is ON: extracts the forensic residual signature, runs the
 *   SONICS 3-way classifier, and returns a fully-populated finding.
 */
export function verifyProvenance(
  asset: Asset,
  settingsPath?: string,
): ProvenanceFinding {
  if (!isArtifactNetProvenanceEnabled(settingsPath)) {
    return {
      assetId: asset.id,
      verdict: 'unknown',
      confidence: 0,
      signature: {
        entropy: 0,
        burstiness: 0,
        spectralFlatness: 0,
        repetition: 0,
        kind: asset.kind,
      },
      disabled: true,
      message: 'artifactnet-provenance disabled (default-off passthrough)',
    };
  }
  const signature = extractResidualSignature(asset);
  const out = classifySignature(signature);
  return {
    assetId: asset.id,
    verdict: out.verdict,
    confidence: out.confidence,
    signature,
    disabled: false,
    message: messageFor(out.verdict, out.confidence),
  };
}

/**
 * Compose the provenance verifier with an existing audit report.
 *
 * - With the flag OFF: returns the input report unchanged (===).
 * - With the flag ON over `assets`: returns a NEW report whose `preAudit`
 *   array carries one finding per asset; everything else (timestamp,
 *   inspected, findings, summary, disabled) is copied verbatim.
 *
 * The existing audit pipeline is therefore observably untouched: same
 * findings, same summary, same disabled flag. Provenance is purely
 * additive.
 */
export function composeWithAudit<A extends ExistingAudit>(
  audit: A,
  assets: ReadonlyArray<Asset>,
  settingsPath?: string,
): A {
  if (!isArtifactNetProvenanceEnabled(settingsPath)) {
    return audit;
  }
  const preAudit: ProvenanceFinding[] = [];
  for (const a of assets) {
    preAudit.push(verifyProvenance(a, settingsPath));
  }
  return { ...audit, preAudit };
}

/**
 * Convenience wrapper used by callers that want to "wrap" an existing
 * audit-producing function. Returns a function whose return shape is the
 * same audit report, optionally augmented with `preAudit`.
 */
export function preAuditHook<Args extends unknown[], R extends ExistingAudit>(
  existingAudit: (...args: Args) => Promise<R> | R,
  resolveAssets: (...args: Args) => ReadonlyArray<Asset> | Promise<ReadonlyArray<Asset>>,
  settingsPath?: string,
): (...args: Args) => Promise<R> {
  return async (...args: Args): Promise<R> => {
    if (!isArtifactNetProvenanceEnabled(settingsPath)) {
      return await existingAudit(...args);
    }
    const [assets, audit] = await Promise.all([
      Promise.resolve(resolveAssets(...args)),
      Promise.resolve(existingAudit(...args)),
    ]);
    return composeWithAudit(audit, assets, settingsPath);
  };
}

// ---------------- helpers ----------------

function messageFor(verdict: string, confidence: number): string {
  const conf = (confidence * 100).toFixed(0);
  switch (verdict) {
    case 'real':
      return `forensic residuals consistent with non-AI authorship (${conf}% confidence)`;
    case 'synthetic':
      return `forensic residuals consistent with AI-generated content (${conf}% confidence)`;
    case 'partial':
      return `mixed residuals — likely AI-touched (${conf}% confidence)`;
    default:
      return `provenance unknown (${conf}% confidence)`;
  }
}
