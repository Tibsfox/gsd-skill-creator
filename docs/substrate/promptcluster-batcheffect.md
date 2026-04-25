# PromptCluster BatchEffect Detector — UIP-19 T2c

> Phase 771, v1.49.573 Upstream Intelligence Pack v1.44.
> No CAPCOM gate modification. Default-off (opt-in via config).

`src/promptcluster-batcheffect/` is a read-only batch-effect detection module
for skill embeddings. It identifies systematic embedding-space shifts across
batches that the v1.49.571 Skill Space Isotropy Audit (SSIA) cannot catch,
and composes with SSIA to produce a unified diagnostic surface.

## Source paper

**Tao et al. (2026). "Batch Effects in Brain Foundation Model Embeddings."
arXiv:2604.14441.**

§2.2 of Tao et al. introduces a centroid-based batch-divergence measure:
compute the per-batch centroid, measure its L2 distance from the grand mean,
and test significance via a Welch t-test on per-direction projections. This
module applies that framework to skill embeddings in lieu of fMRI volumes.

## Why this module complements SSIA

The v1.49.571 SSIA module (`src/skill-isotropy/`, arXiv:2511.08544v3,
Balestriero & LeCun 2025, Phase 728) tests whether the marginal distribution
of skill embeddings along random directions is isotropic (Anderson-Darling vs
standard Gaussian). That detects isotropy collapse — dimensional bias,
non-uniform coverage of the hypersphere.

Batch effects are **orthogonal**: a set of embeddings can be perfectly
isotropic within each batch while the batch centroids are systematically
separated. ComBat-style contamination (Tao et al. §1) passes an isotropy
audit but would corrupt cross-batch comparisons. This module closes that gap.

## Three batch-effect types

| `BatchEffectType`           | Description |
| --------------------------- | ----------- |
| `'model-version'`           | Same prompt through different model checkpoints/versions produces embedding clusters that drift systematically in space. |
| `'training-distribution'`   | Different training corpora or fine-tune splits shift the embedding prior, analogous to scanner/site effects in fMRI (Tao et al. §2.1). |
| `'prompt-template'`         | Variation in prompt framing / instruction style induces systematic directional shifts independent of content. |

## Detection algorithm

1. Compute the grand-mean embedding across all inputs.
2. Group embeddings by batch value.
3. For each batch, compute the per-batch centroid and its L2 distance from
   the grand mean (centroid-shift magnitude, Tao et al. §2.2).
4. Sample M random unit directions (default M=8); project all embeddings.
5. Run a one-sample Welch t-test per direction per batch, testing whether the
   batch projected mean equals the grand projected mean.
6. Average |t| across directions; take the minimum p-value across directions
   as the per-batch evidence.
7. Flag batches whose minimum p-value is below `significanceLevel` (default
   0.05).

Complexity: O(M · N · K) where M = projection directions, N = embedding
count, K = dimension.

## SSIA cross-link and composition

`composeWithSSIA` in `ssia-composer.ts` accepts any SSIA `IsotropyAuditReport`
(typed as `unknown` to avoid a hard import dependency) alongside a
`BatchEffectReport` and returns a `CombinedReport`. The combined report
preserves both sub-reports verbatim — neither overwrites the other.

Joint status derivation:

| SSIA verdict       | Batch status              | Joint status |
| ------------------ | ------------------------- | ------------ |
| `healthy`          | `clean`                   | `healthy`    |
| `watch`            | `clean`                   | `watch`      |
| `collapse-suspected` | any                     | `degraded`   |
| any                | `batch-effect-detected`   | `degraded`   |
| any                | `disabled`                | `disabled`   |
| unavailable / null | `clean`                   | `healthy`    |

## Public API

```ts
import {
  detectBatchEffects,
  composeWithSSIA,
  disabledReport,
  isPromptClusterBatchEffectEnabled,
} from 'gsd-skill-creator/promptcluster-batcheffect';
import type {
  Embedding,
  BatchKey,
  BatchEffectReport,
  CombinedReport,
} from 'gsd-skill-creator/promptcluster-batcheffect';

// Guard: check flag before invoking
if (!isPromptClusterBatchEffectEnabled()) {
  return disabledReport({ type: 'model-version', value: 'none' });
}

// Build assignment map: embedding id → batch value string
const assignment = new Map([
  ['skill-alpha', 'checkpoint-v1'],
  ['skill-beta',  'checkpoint-v2'],
]);

const report: BatchEffectReport = detectBatchEffects(
  embeddings,
  { type: 'model-version', value: 'v1-vs-v2' },
  assignment,
);

// Compose with SSIA
const combined: CombinedReport = composeWithSSIA(ssiaReport, report);
console.log(combined.jointStatus); // 'healthy' | 'watch' | 'degraded' | 'disabled'
```

## Opt-in configuration

The module is **default-OFF** in source. Opt in via `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "promptcluster-batcheffect": {
        "enabled": true,
        "significanceLevel": 0.05,
        "numProjectionDirections": 8
      }
    }
  }
}
```

Config path: `gsd-skill-creator.upstream-intelligence.promptcluster-batcheffect`.

When the flag is absent, false, or the file is malformed, every public entry
point returns a `disabledReport` with `status: 'disabled'` and all-zero
metrics — byte-identical to the phase-770 tip.

## Synthetic injection precision

Per UIP-19, the module is validated against synthetic injection trials:

- **15 true-positive trials** (5 per batch-effect type, shift magnitude 2.5,
  n=30 per batch, dim=16): **≥80% precision required (≥12/15 must fire)**.
- **5 null trials** (no shift, same distribution): **≤20% false-positive rate
  required (≤1/5 false alarms)**.

Results are verified deterministically in
`__tests__/synthetic-injection.test.ts` using seeded mulberry32 PRNGs.

## Read-only invariant

The detector performs ZERO writes into:

- `.claude/skills/`
- `.agents/skills/`
- `examples/`

No imports from CAPCOM-adjacent modules:
`src/orchestration/`, `src/dacp/`, or any path matching `src/capcom`.
Enforced by the CAPCOM-preservation integration test in
`__tests__/integration.test.ts`.

## Non-goals

- Does not implement ComBat or Harmony correction — detection only.
- Does not modify the skill library or any DAG topology.
- Does not replace the SSIA module — the two are additive.
- Does not touch the CAPCOM gate-state surface.
- No new dependencies — all statistics (Welch t-test, erfc approximation,
  mulberry32 PRNG) are implemented in plain TypeScript using `Math`.

## Module files

| File | Purpose |
| ---- | ------- |
| `types.ts` | `Embedding`, `BatchKey`, `BatchEffectType`, `BatchEffectReport`, `CombinedReport` |
| `batch-effect-detector.ts` | Core detection engine (`detectBatchEffects`, `disabledReport`) |
| `ssia-composer.ts` | SSIA + batch-effect composition (`composeWithSSIA`) |
| `settings.ts` | Opt-in flag reader (`isPromptClusterBatchEffectEnabled`) |
| `index.ts` | Public re-exports + paper reference constants |
| `__tests__/batch-effect-detector.test.ts` | Core detection tests (12 tests) |
| `__tests__/ssia-composer.test.ts` | Composer tests (15 tests) |
| `__tests__/synthetic-injection.test.ts` | Injection precision / FPR tests (5 tests) |
| `__tests__/integration.test.ts` | Public API, CAPCOM-preservation, default-off (10 tests) |

## Integration target

The integration target is the **v1.49.571 Skill Space Isotropy Audit** (SSIA,
`src/skill-isotropy/`, arXiv:2511.08544v3). `composeWithSSIA` accepts any SSIA
`IsotropyAuditReport` alongside a `BatchEffectReport` and returns a
`CombinedReport` with a joint status. The two modules are strictly additive:
neither overwrites the other's findings.

```typescript
import { detectBatchEffects, composeWithSSIA } from 'gsd-skill-creator/promptcluster-batcheffect';
import { auditIsotropy } from 'gsd-skill-creator/skill-isotropy';

const ssiaReport  = await auditIsotropy(embeddings);
const batchReport = detectBatchEffects(embeddings, batchKey, assignment);
const combined    = composeWithSSIA(ssiaReport, batchReport);
// combined.jointStatus => 'healthy' | 'watch' | 'degraded' | 'disabled'
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-key

- **eess26_2604.14441** — Tao et al., *Batch Effects in Brain Foundation Model
  Embeddings*, 2026
