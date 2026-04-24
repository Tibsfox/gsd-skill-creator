# Semantic Channel DACP Formalism — Addressing GAP-6

**Status:** canonical substrate documentation
**Implements:** MATH-15 (Phase 747)
**Module:** [`src/semantic-channel/`](../../src/semantic-channel/index.ts)
**Primary source of truth (read-only):** [`src/dacp/types.ts`](../../src/dacp/types.ts)
**Closes:** GAP-6 (DACP Not Publicly Documented) from the v1.49.571-era
substrate audit (see [ROADMAP Phase 727](../../.planning/ROADMAP.md))

---

## 1. Background — GAP-6 origin and DACP source of truth

The **Directed Agent Communication Protocol** (DACP) has been the wire
format for inter-agent handoff inside gsd-skill-creator since the v1.49.5xx
line. Its implementation — the Zod schemas defining the bundle manifest,
fidelity levels, bus opcodes, and provenance metadata — lives in
[`src/dacp/types.ts`](../../src/dacp/types.ts), and its on-disk bundle
layout (`manifest.json`, `intent.md`, `data/`, `code/`, `.complete`) is
specified in [`src/dacp/bundle.ts`](../../src/dacp/bundle.ts). Those files
are authoritative: they define the wire format, and nothing outside them
may alter it.

The v1.49.571-era substrate audits identified an issue tracked as
**GAP-6** — *DACP Not Publicly Documented*. The wire format was
well-specified in code but had no public, information-theoretic
specification that downstream integrators could read and reason about.
This document closes that gap: it gives a formal, citable,
information-theoretic account of what the DACP three-part bundle *is*,
backed by the April 17–23 2026 arXiv cohort on semantic-channel theory
and rate-distortion for deductive sources.

**Scope note.** This document specifies the semantic-channel *view* of
DACP. It does not and cannot change the wire format. The Phase 747
preservation gate (G7) is that byte-for-byte compatibility is retained —
any implementation of the semantic-channel module that alters the DACP
bundle manifest, Zod schemas, `DACP_VERSION` constant, or serialisation
format is out of spec.

## 2. The Three-Part Bundle — Formal Grammar (M5 §2)

Module M5 of the arXiv April 17–23 Math Foundations milestone
([`work/modules/module_5.tex`](../../.planning/missions/arxiv-april-17-23-math-foundations/work/modules/module_5.tex)
§`sec:m5-dacp-grammar`) states the DACP three-part-bundle as a BNF-style
formal grammar:

```
bundle    ::= ⟨ intent, data, code ⟩
intent    ::= NaturalLanguageStatement  with fidelity φ_intent
data      ::= TypedRecord               with fidelity φ_data
code      ::= ExecutablePayload         with fidelity φ_code
φ_·       ::= lossless | closure-preserving | rate-distorted
```

The three per-component fidelity tiers form a strict descending order:

> **lossless ≻ closure-preserving ≻ rate-distorted**

- **lossless** — bit-exact recovery of the original component from the
  channel output.
- **closure-preserving** — recovery up to deductive-closure equivalence
  under a fixed logical theory *T* (two statements are equivalent iff
  they have the same deductive closure, `Cn_T(s₁) = Cn_T(s₂)`).
- **rate-distorted** — recovery up to a bounded expected distortion
  under a chosen metric.

The DACP numeric `FidelityLevel` field (0..4 in
[`src/dacp/types.ts`](../../src/dacp/types.ts) `FidelityLevelSchema`)
maps onto the per-component tier triple. The mapping is implemented by
`fidelityLevelToTriad(level)` in
[`src/semantic-channel/types.ts`](../../src/semantic-channel/types.ts),
with the concrete rule:

| DACP `fidelity_level`         | intent                | data           | code                 |
| ----------------------------- | --------------------- | -------------- | -------------------- |
| 0 `PROSE`                     | closure-preserving    | rate-distorted | rate-distorted       |
| 1 `PROSE_DATA`                | closure-preserving    | lossless       | rate-distorted       |
| 2 `PROSE_DATA_SCHEMA`         | closure-preserving    | lossless       | rate-distorted       |
| 3 `PROSE_DATA_CODE`           | closure-preserving    | lossless       | closure-preserving   |
| 4 `PROSE_DATA_CODE_TESTS`     | closure-preserving    | lossless       | closure-preserving   |

Rationale: intent is always natural language and never exceeds
closure-preserving (the Xu semantic-channel equivalence relation is
deductive-closure equality, not string equality); data becomes lossless
once structured; code becomes closure-preserving once executable, under
an execution-equivalence relation (two code fragments are equivalent iff
they produce the same observable tool-call effect).

## 3. Semantic Channel Theory — Xu 2026 (arXiv:2604.16471)

The formal foundation for the fidelity-per-component view of DACP comes
from Jianfeng Xu's *Semantic Channel Theory: Deductive Compression and
Structural Fidelity for Multi-Agent Communication* (arXiv:2604.16471,
bib key `xu2026semantic`). Xu extends Shannon's classical channel
framework to **logically structured (deductive) sources**.

A *semantic channel* `C` is a mapping from input statements to output
statements that preserves deductive closure. For a DACP bundle traversing
such a channel, the Xu **preservation property** is:

> For every component `c ∈ {intent, data, code}`, the channel output's
> fidelity tier for `c` must be **equal to or stronger than** the
> channel input's fidelity tier for `c`. A channel that weakens
> per-component fidelity violates the semantic-channel preservation
> property.

The CAPCOM hard-preservation gate at Phase 747 close (G7) is the
operational counterpart of this mathematical invariant: the runtime
must never emit a bundle whose per-component fidelity has been weakened
by an intermediate processor. The advisory drift checker in
[`src/semantic-channel/drift-checker.ts`](../../src/semantic-channel/drift-checker.ts)
surfaces this condition via `weakened: true` on its `DriftFinding`
output — surfaced, never acted on; CAPCOM retains final authority.

## 4. Rate-Distortion for Deductive Sources — Xu 2026 (arXiv:2604.15698)

The companion paper (*Rate-Distortion for Deductive Sources*,
arXiv:2604.15698, bib key `xu2026ratedistortion`) defines the
rate-distortion function for the channel Xu constructed in the first
paper. For a deductive source `X` with closure operator `Cn_T` and a
distortion measure `d`, the **closure-fidelity rate-distortion function**
is

```
R_D(φ) = min I(X; X̂)  subject to  E[d(X, X̂)] ≤ D  and  Cn_T(X̂) ⊇ Cn_T(X).
```

Xu proves the inequality

> **R_D(φ) ≥ R(D)**,

with equality if and only if the source has trivial deductive structure
(i.e., is purely stochastic). In the non-trivial case — which is exactly
the case for structured DACP bundles — the gap `R_D(φ) − R(D)` is
strictly positive and quantifiable.

**Silicon-Layer consequence.** The minimum channel bit-rate required to
transmit a DACP component at closure-preserving fidelity is bounded
below by `R_D(φ)`, not by the unconstrained Shannon rate-distortion
`R(D)`. Phase 747 ships a conservative size-based upper bound of this
quantity in
[`src/semantic-channel/channel-capacity.ts`](../../src/semantic-channel/channel-capacity.ts);
a tight rate computation on a Wasserstein-2 manifold of weight
distributions is deferred to Phase 751 (Wasserstein-Hebbian,
[`src/wasserstein-hebbian/`](../../src/wasserstein-hebbian/), MATH-19).

## 5. Read-Only Integration

The semantic-channel module operates as a **read-only adapter** over the
existing DACP subsystem. Concretely:

- [`src/semantic-channel/dacp-adapter.ts`](../../src/semantic-channel/dacp-adapter.ts)
  uses `node:fs/promises` `readFile` and `readdir` only — no `writeFile`,
  `mkdir`, or any mutation is permitted.
- DACP types (`BundleManifest`, `FidelityLevel`) are imported as types
  from [`src/dacp/types.ts`](../../src/dacp/types.ts); they are never
  redefined, never reassigned, and never re-exported by value from
  `src/semantic-channel/`.
- The DACP wire constants `BundleManifestSchema` and `DACP_VERSION` are
  not reassigned anywhere in the semantic-channel module; a CAPCOM
  regex test enforces this.
- Byte-identical guarantee: importing `src/semantic-channel/index.ts`
  must not change the serialised output of any DACP bundle. This is
  enforced by a wire-format-unchanged test that hashes a fixture
  manifest using the exact serialisation formula used in
  [`src/dacp/bundle.ts:154`](../../src/dacp/bundle.ts) (namely
  `JSON.stringify(validatedManifest, null, 2)`) and asserts stability.

Default state is **off**: callers must opt in via
`.claude/gsd-skill-creator.json` under
`gsd-skill-creator.mathematical-foundations.semantic-channel.enabled`.
With the flag off, `isSemanticChannelEnabled()` returns `false`, and
importing the module performs zero I/O beyond resolving its own source
files.

## 6. Drift Checker — Advisory-Only Runtime

[`src/semantic-channel/drift-checker.ts`](../../src/semantic-channel/drift-checker.ts)
exposes `checkSemanticDrift(baseline, current)` and the settings-gated
wrapper `checkSemanticDriftIfEnabled(...)`. The checker computes:

1. **Per-component content drift** — a normalised character-length
   delta clamped to `[0, 1]` per component.
2. **Fidelity tier weakening** — `true` when any component's current
   fidelity tier has a strictly higher rank (weaker) than its baseline
   tier, per the Xu preservation property.

Severity elevates to `'warn'` when any component drift meets or exceeds
the configured threshold (default 0.25) or when any tier has weakened.
Otherwise severity is `'info'`.

**Advisory-only invariant.** The drift checker cannot:

- mutate state of any kind (no file I/O, no in-memory mutation);
- emit gate-bypass / gate-override / `dacpMigrate` actions;
- influence CAPCOM handoff — CAPCOM retains full authority over whether
  to act on the signal.

The returned `DriftFinding` is a plain data object. Consumers
(`tools/session-retro/observe.mjs` or any other observer) may log,
display, or record it; they may not use it to circumvent the normal gate
flow.

## 7. Non-Goals — Hard Preservation Fence

The semantic-channel module, by design, **does not**:

- modify any file under `src/dacp/` (the adapter is strictly read-only);
- alter the DACP wire format, Zod schemas, or `DACP_VERSION` constant;
- replace or bypass CAPCOM handoff; findings are advisory-only;
- implement an exact rate-distortion LP — the capacity bound is a
  correct-shape size-based upper bound compatible with the
  `R_D(φ) ≥ R(D)` inequality (refined in Phase 751);
- require any runtime I/O unless a caller explicitly invokes the
  adapter — all module-level code is pure.

The Phase 747 CAPCOM gate (G7) checks these invariants by means of
static source-regex tests (no forbidden tokens), write-path-regex tests
(no `writeFile`/`mkdir`/etc. in the module), and a byte-level
wire-format-unchanged test that would fail if importing the module
perturbed DACP state in any observable way.

## 8. GAP-6 Closure

This document, together with the
[`src/semantic-channel/`](../../src/semantic-channel/index.ts) module,
**closes GAP-6 (DACP Not Publicly Documented)** as follows:

1. The DACP wire format is unchanged and continues to be specified in
   [`src/dacp/types.ts`](../../src/dacp/types.ts) and
   [`src/dacp/bundle.ts`](../../src/dacp/bundle.ts); those files remain
   the authoritative implementation.
2. A public, citable, information-theoretic specification of the
   three-part bundle is given here, grounded in the M5 BNF grammar and
   the Xu semantic-channel / rate-distortion pair.
3. A read-only TypeScript adapter gives downstream integrators a stable
   way to consume DACP bundles as semantic-channel state without
   touching the wire format.
4. An advisory-only drift checker surfaces the Xu preservation property
   at runtime without modifying CAPCOM authority.

Cross-reference for provenance: the v1.49.571-era substrate audit
tracked this gap; ROADMAP Phase 727 contains the underlying DACP-era
work that surfaced the need for a public spec. See
[`.planning/MILESTONES.md`](../../.planning/MILESTONES.md) GAP-6 entry
and [`.planning/STATE.md`](../../.planning/STATE.md) GAP-6 row.

---

*Part of the arXiv April 17–23 Math Foundations milestone (v1.49.572).
See [ROADMAP](../../.planning/ROADMAP.md) Phase 747 for the build
history.*
