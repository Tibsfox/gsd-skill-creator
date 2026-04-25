# ArtifactNet Provenance — UIP-20 T2d

> Phase 772, v1.49.573 Upstream Intelligence Pack v1.44.
> CAPCOM hard-preservation Gate G13.

`src/artifactnet-provenance/` is a forensic-residual-physics provenance
layer for skill and asset authenticity. It detects AI-generated content
versus real-musician/author/contributor work and wires into the existing
Grove record audit pipeline (and the `src/skilldex-auditor` pipeline) as
a **pre-audit step** — strictly additive, never mutating.

## Architectural antecedents

This module is a downscaled implementation of one upstream paper:

1. **ArtifactNet** — Heewon Oh et al., *ArtifactNet: Forensic-Residual
   Physics for AI-Generated Content Detection*, **arXiv:2604.16254**.
   ArtifactNet introduces SONICS, a 3-way real / partial / synthetic
   classifier benchmarked at **n = 23,288** samples and reporting >92%
   precision at production scale. The fine-grained statistical residuals
   the generator leaves at sample-level (audio) or token-level (text) are
   the "physical" fingerprint the classifier reads. We borrow the
   methodology — extract residuals, run a 3-way classifier — at a
   downscaled corpus size and target ≥80% precision per the Phase 772
   acceptance brief; full SONICS scale (n ≥ 23,288) is a future extension
   and explicitly out of scope for the synthetic-corpus tests in this
   module.

## Hard preservation invariants — Gate G13

The provenance gate is a **pre-audit augmentation**. With the flag off:

- The existing audit pipeline (`src/memory/grove-format.ts`,
  `src/skilldex-auditor/`) is byte-identical to the phase-771 tip.
- `composeWithAudit()` returns its input by reference (===); no clone,
  no `preAudit` slot is introduced.
- `verifyProvenance()` returns
  `{ disabled: true, verdict: 'unknown', confidence: 0 }` and runs no
  detector.
- `preAuditHook()` delegates to the existing-audit function unchanged.

With the flag on, the gate produces findings BEFORE the existing audit
runs, and stores them on a **separate** `preAudit` array on the returned
report. The existing `findings` array is never mutated; the returned
audit is a shallow clone with a fresh `preAudit` slot.

The Gate G13 hash-tree test
(`__tests__/audit-pipeline-byte-identical.test.ts`) hashes every file
under the existing audit pipeline before vs after running the entire
provenance public API and asserts byte-identical equality.

## Opt-in mechanism

Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "artifactnet-provenance": { "enabled": true }
    }
  }
}
```

Settings reader is fail-closed: missing file, malformed JSON, missing
block, or missing flag all return `enabled: false`.

## Public API

```ts
import {
  verifyProvenance,
  composeWithAudit,
  preAuditHook,
} from 'gsd-skill-creator/artifactnet-provenance';

// Single-asset verification.
const finding = verifyProvenance({
  id: 'grove://text/example',
  kind: 'text',
  content: 'Some text content here.',
});
// → { assetId, verdict: 'real' | 'synthetic' | 'partial' | 'unknown',
//     confidence, signature, disabled, message }

// Compose with an existing AuditReport.
const augmented = composeWithAudit(existingAudit, assets);
// → { ...existingAudit, preAudit: [...findings] }

// Wrap an existing audit-producing function.
const wrapped = preAuditHook(
  async () => skilldexAuditor.auditAll(skillsDir),
  () => assetsForSkillsDir,
);
const augmentedReport = await wrapped();
```

## Module layout

```
src/artifactnet-provenance/
├── index.ts                          public API
├── types.ts                          Asset, ProvenanceVerdict, ResidualSignature, ExistingAudit
├── settings.ts                       opt-in flag reader (fail-closed)
├── forensic-residual-detector.ts     residual signature extraction
├── sonics-detector.ts                3-way SONICS-style classifier
├── grove-audit-prehook.ts            verifyProvenance + composeWithAudit + preAuditHook
└── __tests__/
    ├── forensic-residual-detector.test.ts
    ├── sonics-detector.test.ts
    ├── grove-audit-prehook.test.ts
    ├── audit-pipeline-byte-identical.test.ts
    └── integration.test.ts
```

## Detector design

### Forensic residual signature

Given an `Asset`, the detector extracts a `ResidualSignature` with four
normalised fields, each in `[0, 1]`:

| Field             | Text interpretation                           | Audio interpretation                 |
| ----------------- | --------------------------------------------- | ------------------------------------ |
| `entropy`         | Normalised Shannon entropy of token frequency | Amplitude-histogram entropy          |
| `burstiness`      | Coefficient of variation of sentence lengths  | CV of envelope-segment energy        |
| `spectralFlatness`| Zipf-rank deviation (heavy-tail signal)       | Wiener entropy of per-block lag energy |
| `repetition`      | Bigram repetition coefficient                 | Adjacent-sample identity ratio       |

Image inputs are routed through the audio detector at byte resolution
(structural support; full 2-D forensic analysis is a future extension).

### SONICS 3-way classifier

The signature is fed to `classifySignature()`, which scores three lanes
(`real`, `partial`, `synthetic`) via simple linear scorers + a midpoint
bell, sum-normalises to a probability simplex, and returns the argmax
plus the top-two-gap confidence. Empty signatures (all zeros) return
`unknown`.

For audio inputs the `spectralFlatness` lane is **inverted** before
scoring: high Wiener entropy = flat = synthetic; low Wiener entropy =
peaky resonances = real.

## Synthetic-corpus precision

The Gate G13 acceptance test
(`__tests__/forensic-residual-detector.test.ts`) builds 10 real and 10
synthetic text fixtures and asserts:

- ≥8 of 10 synthetic samples are flagged as `synthetic` or `partial` (i.e.
  not `real`),
- ≥8 of 10 real samples are flagged as `real` or `partial` (i.e. not
  `synthetic`).

This is the downscaled-precision target (≥80%) appropriate for a 20-
sample synthetic corpus. SONICS production precision (>92% at n=23,288)
is the methodological reference; matching it would require a far larger
corpus and a trainable classifier head, both deferred.

## Integration target

The integration target is the **Grove record audit pipeline**
(`src/memory/grove-format.ts`) and the **Skilldex Auditor** T1a pipeline
(`src/skilldex-auditor/`). The module wires in as a pre-audit step via
`preAuditHook` — it runs before the existing audit function and stores
provenance findings on a separate `preAudit` array on the returned report.
The existing `findings` array is never mutated (Gate G13 byte-identical
guarantee).

```typescript
import { preAuditHook, composeWithAudit } from 'gsd-skill-creator/artifactnet-provenance';
import { auditAll } from 'gsd-skill-creator/skilldex-auditor';

// Wrap the existing audit pipeline as a pre-audit step.
const augmentedAudit = preAuditHook(
  async () => auditAll('.claude/skills/'),
  () => assetsForSkillsDir,
);
const report = await augmentedAudit();
// report.findings  — unchanged Skilldex conformance findings
// report.preAudit  — ArtifactNet provenance findings (only when T2d flag on)
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-key

- **eess26_2604.16254** — Heewon Oh et al., *ArtifactNet: Forensic-Residual
  Physics for AI-Generated Content Detection*, SONICS 2026

## CAPCOM source-regex contract

The module is a leaf observer:

- No imports from `src/orchestration`, `src/dacp`, or `src/capcom`.
- No runtime imports from `src/memory/` or `src/skilldex-auditor/` —
  type-only references via `import type` are permitted but currently
  unused (the `ExistingAudit` interface is structurally compatible).
- No filesystem writes anywhere in the module sources (settings reader
  reads only).
- No skill-DAG construction or mutation.

The CAPCOM source-regex sweep
(`__tests__/audit-pipeline-byte-identical.test.ts`) enforces these
invariants automatically.
