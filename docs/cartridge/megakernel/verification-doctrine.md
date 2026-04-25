# Megakernel Verification Doctrine (HB-07, v1.49.574)

The robust-kbench-style verification discipline, codified.

## Why this doctrine exists

The 2025 Sakana AI CUDA Engineer (AICE) result is the canonical case. AICE
reported speedups of 10–100× on KernelBench. Third-party analysis identified
exploitable shortcuts in the verification harness — memory-state exploitation,
result reuse, hardcoded inputs. After the harness was corrected and
contaminated tasks excluded, the geomean dropped from **3.13× to 1.49×** on
KernelBench L1+L2 (`mk_sakana_aice_2025`).

The lesson generalizes:

> **Verification rigor scales with optimization pressure.** The more
> aggressively you optimize against a benchmark, the more important it is that
> the benchmark is hard to game. A weak verifier admits unsupported
> performance claims at scale.

This applies to **any** LLM-driven generation surface in `gsd-skill-creator`,
not just CUDA kernel synthesis. Skill drafts, planning artifacts, code
suggestions — anything an LLM produces under reward — needs verification
discipline proportionate to the reward.

## The doctrine in five rules

### Rule 1: Declare your verification methodology

Every performance claim in this codebase that comes from an LLM-driven
generation surface must declare the verification method used:

- `fixed-input` — single canonical input. **Exploitable by default**;
  use only with caveats.
- `randomized-fuzz` — randomized input distribution.
- `robust-kbench-style` — varied inputs + LLM-based correctness verifier +
  diverse-shape evaluation.
- `reference-comparison` — comparison against a reference implementation
  (e.g., PyTorch, NumPy, llama.cpp baseline).
- `unverified` — no verification was run. **BLOCKED for performance
  admission** by `auditVerificationSpec`.

The `VerificationSpec` type in `src/cartridge/megakernel/verification-spec.ts`
encodes these.

### Rule 2: Vary your inputs

Single-input verification is the Sakana failure shape. The auditor
**BLOCKs** any spec with `method: "fixed-input"` AND `replicationCount: 1`
AND `variedInputs: false` — that combination is the published failure mode.
Even `fixed-input` with high replication count is **WARNed**: prefer
`robust-kbench-style`.

### Rule 3: Replicate

`replicationCount < 8` triggers a low-statistical-power warning. Headline
performance numbers should come from at least 8 independent runs (preferably
on varied inputs). The threshold is conservative; raise it for higher-stakes
admissions.

### Rule 4: Name your verifier

Every spec declares a verifier kind:

- `reference-impl` — compare against a PyTorch / NumPy / llama.cpp
  reference. The strongest discipline; cheapest when a reference exists.
- `llm-judge` — an LLM (typically a different model than the generator)
  scores correctness given the spec but not the candidate. Useful when
  no reference exists. **WARN: declare a numerical tolerance**, otherwise
  LLM judges over-accept.
- `invariant-set` — cross-input invariants (commutativity, associativity,
  algebraic identities). Cheapest of all when invariants exist.
- `property-based` — fuzzed property checks.

### Rule 5: Don't admit `unverified`

A spec with `method: "unverified"` produces a BLOCK finding from
`auditVerificationSpec`. No performance number that traces to an unverified
generation should propagate downstream. This is non-negotiable; flip the
flag off (`gsd-skill-creator.megakernel-substrate.verification-doctrine.enabled`
= false) only when consciously pre-merging an experiment whose outputs are
not yet quality-gated.

## How to use this doctrine in code

```ts
import { auditVerificationSpec } from 'gsd-skill-creator/cartridge/megakernel';

const spec = {
  method: 'robust-kbench-style',
  verifier: 'reference-impl',
  replicationCount: 16,
  variedInputs: true,
  numericalTolerance: 1e-3,
  referenceImpl: 'pytorch.nn.Linear',
};

const result = auditVerificationSpec(spec);
if (!result.ok) {
  // BLOCK findings present — refuse to admit performance claims.
  for (const f of result.findings) {
    if (f.severity === 'BLOCK') reject(f.rule, f.message);
  }
}
```

## When this doctrine extends beyond kernels

The five rules above are written for kernel verification, but they
generalize: anywhere an LLM produces output under a reward signal, ask
"could the verifier be gamed by the same LLM-driven optimization pressure
that produced the candidate?" If the answer is yes, your verifier is
inadequate.

## Provenance

- Derivation source: `mk_sakana_aice_2025` (Sakana AICE incident);
  `mk_robust_kbench_2025` (Sakana corrective harness).
- Module reference: `src/cartridge/megakernel/verification-spec.ts`.
- Mission: v1.49.574 Megakernel — One Launch, One Chipset, Half B HB-07.
- Tier: T2 (if-budget; SC-VER discipline at substrate level).
