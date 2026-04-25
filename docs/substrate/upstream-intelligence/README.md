# Upstream Intelligence Pack v1.44 — v1.49.573 Substrate Cluster Hub

**Milestone:** v1.49.573 ArXiv eess Integration (17–23 April 2026 window)
**Phases:** 765–775 (Half B)
**Branch:** dev only (NO push to main without human authorization)
**Hard gate:** CAPCOM preservation G10 / G11 / G12 / G13 / G14

This document is the hub for the ten substrate modules shipped in
v1.49.573. All ten are **default-off** and opt in independently via
`.claude/gsd-skill-creator.json`. With every flag off the system is
byte-identical to the v1.49.572 (Phase 764) tip.

---

## Overview: what v1.49.573 added

v1.49.573 shipped ten research-informed substrate modules across three
tiers, all grounded in papers from the 17–23 April 2026 arXiv eess/cs
window (150 curated papers, six half-A modules M1–M7).

**Tier 1 — must-ship (T1a–T1d, 4 modules, Phases 765–768):**

| Module | arXiv source | Purpose |
|---|---|---|
| T1a Skilldex Conformance Auditor | eess26_2604.16911 + eess26_2604.18834 | ZFC-style static conformance scoring for SKILL.md specs |
| T1b Bounded-Learning Empirical Harness | eess26_2604.20087 | Executable evidence for the 20%/3/7 constitutional caps |
| T1c Activation Steering Runtime | eess26_2604.19018 | No-fine-tune CRAFT role modulation via local-linearity controller |
| T1d FL Pre-Rollout Threat-Model Gate | eess26_2604.19891 + eess26_2604.19915 + eess26_2604.20020 | Blocks federated training until MIA/DECIFR mitigations are addressed |

**Tier 2 — if-budget (T2a–T2d, 4 modules, Phases 769–772):**

| Module | arXiv source | Purpose |
|---|---|---|
| T2a Experience Compression Layer | eess26_2604.15877 | Cross-level adaptive compression (episodic/procedural/declarative) |
| T2b Predictive Skill Auto-Loader | eess26_2604.18888 | GNN link-formation prediction for cache pre-warming |
| T2c PromptCluster BatchEffect Detector | eess26_2604.14441 | Systematic embedding-space shift detection (complements SSIA) |
| T2d ArtifactNet Provenance Verifier | eess26_2604.16254 | Forensic-residual provenance gate for skill/asset authenticity |

**Tier 3 — strictly optional (T3a–T3b, 2 modules, Phases 773–774):**

| Module | arXiv source | Purpose |
|---|---|---|
| T3a Stackelberg Drainability Pricing Reference | eess26_2604.16802 | Multi-tenant pricing reference (Stackelberg bilevel game + drainability guardrail) |
| T3b Rumor Delay Model | eess26_2604.17368 | SDDE-based signal-vs-hype separation for SENTINEL/ANALYST pipeline |

---

## Module roster table

| Name | arXiv source | Tier | Hard-preservation gate | Opt-in config path | Doc link |
|---|---|---|---|---|---|
| Skilldex Auditor | eess26_2604.16911 + eess26_2604.18834 | T1a | G10 | `upstream-intelligence.skilldex-auditor.enabled` | [skilldex-auditor.md](../skilldex-auditor.md) |
| Bounded-Learning Empirical | eess26_2604.20087 | T1b | — (read-only) | `upstream-intelligence.bounded-learning-empirical.enabled` | [bounded-learning-empirical.md](../bounded-learning-empirical.md) |
| Activation Steering | eess26_2604.19018 | T1c | G11 | `upstream-intelligence.activation-steering.enabled` | [activation-steering.md](../activation-steering.md) |
| FL Threat-Model Gate | eess26_2604.19891/19915/20020 | T1d | — (gate only) | `upstream-intelligence.fl-threat-model.enabled` | [fl-threat-model.md](../fl-threat-model.md) |
| Experience Compression | eess26_2604.15877 | T2a | — (advisory) | `upstream-intelligence.experience-compression.enabled` | [experience-compression.md](../experience-compression.md) |
| Predictive Skill Loader | eess26_2604.18888 | T2b | G12 | `upstream-intelligence.predictive-skill-loader.enabled` | [predictive-skill-loader.md](../predictive-skill-loader.md) |
| PromptCluster BatchEffect | eess26_2604.14441 | T2c | — (read-only) | `upstream-intelligence.promptcluster-batcheffect.enabled` | [promptcluster-batcheffect.md](../promptcluster-batcheffect.md) |
| ArtifactNet Provenance | eess26_2604.16254 | T2d | G13 | `upstream-intelligence.artifactnet-provenance.enabled` | [artifactnet-provenance.md](../artifactnet-provenance.md) |
| Stackelberg Pricing | eess26_2604.16802 | T3a | — (reference only) | `upstream-intelligence.stackelberg-pricing.enabled` | [stackelberg-pricing.md](../stackelberg-pricing.md) |
| Rumor Delay Model | eess26_2604.17368 | T3b | — (reference only) | `upstream-intelligence.rumor-delay-model.enabled` | [rumor-delay-model.md](../rumor-delay-model.md) |

---

## Activation guide

All ten modules share a single config block in `.claude/gsd-skill-creator.json`.
Every key is independent — enabling one module does not affect any other.

### Minimal T1 activation (recommended starting point)

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "skilldex-auditor":             { "enabled": true },
      "bounded-learning-empirical":   { "enabled": true },
      "activation-steering":          { "enabled": true },
      "fl-threat-model":              { "enabled": true }
    }
  }
}
```

### Full T1 + T2 activation

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "skilldex-auditor":             { "enabled": true },
      "bounded-learning-empirical":   { "enabled": true },
      "activation-steering":          { "enabled": true, "gain": 0.5, "linearityThreshold": 0.1 },
      "fl-threat-model":              { "enabled": true },
      "experience-compression":       { "enabled": true },
      "predictive-skill-loader":      { "enabled": true, "topK": 5, "hops": 2, "decay": 0.5 },
      "promptcluster-batcheffect":    { "enabled": true, "significanceLevel": 0.05, "numProjectionDirections": 8 },
      "artifactnet-provenance":       { "enabled": true }
    }
  }
}
```

### T3 (strictly optional) addition

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "stackelberg-pricing":  { "enabled": true },
      "rumor-delay-model":    { "enabled": true }
    }
  }
}
```

### Flag-off guarantee

With every flag absent or `false`, the system is **byte-identical** to the
v1.49.572 tip (Phase 764). This is verified by
`src/upstream-intelligence/__tests__/composition-flag-off-byte-identical.test.ts`
(Gate G14 closure fixture).

---

## Composition guide

This section summarises which v1.49.573 modules compose with which, based on
the W9 integration test results in
`src/upstream-intelligence/__tests__/integration.test.ts`.

### Pairwise compositions (W9 Gate G14 category 1)

| Pair | Composition mechanism | Test |
|---|---|---|
| T1a Skilldex Auditor × T2c PromptCluster BatchEffect | Audit findings + embedding-space drift co-report; shapes are independent, neither overwrites the other | `Pair: T1a × T2c` |
| T1c Activation Steering × T1b Bounded-Learning Empirical | Steering delta stays within 20% content-change cap; evidence records validate the constitutional constraint | `Pair: T1c × T1b` |
| T2b Predictive Skill Loader × T1a Skilldex Auditor | Predictions filtered through the auditor envelope; both operate on `.claude/skills/` without conflict | `Pair: T2b × T1a` |
| T2d ArtifactNet Provenance × T1a Skilldex Auditor | Provenance pre-audit slot composes with audit report via duck-compatible `ExistingAudit` interface | `Pair: T2d × T1a` |
| T1d FL Threat-Model × T2a Experience Compression | Compression preserves `DesignDoc` structure required by the gate evaluator | `Pair: T1d × T2a` |
| T3a Stackelberg Pricing × T2a Experience Compression | Pricing utility consumes compressed records without side-effects | `Pair: T3a × T2a` |
| T3b Rumor Delay × T2b Predictive Skill Loader | Rumor signal-vs-hype classification informs prediction priors | `Pair: T3b × T2b` |
| T1b Bounded-Learning × T2c PromptCluster BatchEffect | Drift-detector evidence composes with batch-effect joint status | `Pair: T1b × T2c` |

All ten modules also pass a **public API surface smoke test**: every module
exports a settings reader and at least one headline entry point.

---

## Cross-milestone integration

v1.49.573 modules compose with v1.49.572 modules via value-passing only — no
v1.49.573 module modifies any v1.49.572 source file. Cross-milestone
composition is verified in
`src/upstream-intelligence/__tests__/cross-milestone.test.ts` (Gate G14
category 2).

### T1a Skilldex Auditor × v1.49.572 T1a Coherent Functors

The Skilldex Auditor accepts skills that have been wrapped in a coherent-functor
categorical presentation (`src/coherent-functors/`). The auditor reads the
underlying SKILL.md spec regardless of how it was surfaced; coherent-functor
metadata passes through the audit without friction. The coherent-functors module
(arXiv:2604.18588 / Jaiswal et al., math-arxiv convention) is not modified.

### T1c Activation Steering × v1.49.572 T1c Semantic Channel

Activation steering layers **on top of** the v1.49.572 T1c semantic-channel
formalism (Xu 2026a/b, `eess26_2604.16471` + `eess26_2604.15698`) without
modifying it. The activation vector is an additional metadata channel alongside
the DACP `(intent, data, code)` triad — it never enters the wire-format payloads.
The semantic-channel fidelity tier never weakens. Gate G11 enforces `src/dacp/`
byte-identical with the steering flag off.

### T2b Predictive Skill Loader × v1.49.572 T1b Ricci-Curvature Audit

The Predictive Skill Loader can optionally weight predictions against
curvature-bottleneck signals from the v1.49.572 Ricci-Curvature Audit
(`src/ricci-curvature-audit/`, arXiv:2604.15532 / Chowdhury et al.,
math-arxiv convention). Skills identified as curvature bottlenecks by the
audit are de-prioritised in the prediction ranking — pre-warming a bottleneck
skill may deepen the bottleneck rather than smooth it. This is an advisory
composition; neither module requires the other to be enabled.

### T2d ArtifactNet Provenance × v1.49.572 T2a Koopman-Memory

ArtifactNet Provenance can wrap a Koopman-memory state-space record as an
asset for provenance checking. The Koopman-Memory module (`src/koopman-memory/`,
arXiv:2604.13983 / Mezic et al., math-arxiv convention) exposes a serialisable
state snapshot; `verifyProvenance` classifies that snapshot as real/partial/
synthetic using the forensic-residual detector. Gate G13 ensures the existing
Koopman-memory pipeline is byte-identical with the provenance flag off.

---

## Hard-preservation reference

The following four CAPCOM gates enforce byte-identical behaviour when the
relevant flag is off. Each gate is verified by a dedicated test file that
hashes the protected source tree before and after exercising the new module's
public API surface.

### G10 — T1a Skilldex Auditor (Phase 765 close)

Gate G10 protects the **skill-space organisation** surface. With the
`skilldex-auditor` flag off, the auditor performs zero reads into `.claude/skills/`,
zero imports from `src/orchestration/`, `src/dacp/`, or any CAPCOM-adjacent
path, and zero writes anywhere in the skill library. The CAPCOM source-regex
sweep enforces that no CAPCOM codepath is touched. The gate also verifies that
`auditAll` returns an immediately-disabled record
(`{ disabled: true, inspected: 0 }`) with zero side effects.

### G11 — T1c Activation Steering (Phase 767 close)

Gate G11 protects the **DACP wire format**. With the `activation-steering` flag
off, every file under `src/dacp/` is SHA-256 identical to its pre-767 state.
The activation vector is an additional metadata channel that travels alongside
the `(intent, data, code)` triad without entering the DACP bundle. The semantic-
channel preservation property — fidelity tier never weakens across the channel
— is unaffected because the steering layer never touches the bundle. The
`steer()` passthrough returns `{ disabled: true, vector: input, delta: zeros }`.

### G12 — T2b Predictive Skill Loader (Phase 770 close)

Gate G12 protects the **orchestration layer**. With the `predictive-skill-loader`
flag off, every file under `src/orchestration/` is SHA-256 identical to its
pre-770 state. The predictive layer composes exclusively via the existing
`PreWarmHook` API in `src/cache/preload.ts` — a hook surface defined before
this milestone. The College-of-Knowledge tree (`.college/`) is accessed read-only
via text-based regex parsing; no concept files are executed at runtime.
`predictNextSkills` returns `[]` with `{ disabled: true }` when the flag is off.

### G13 — T2d ArtifactNet Provenance (Phase 772 close)

Gate G13 protects the **skill/asset audit pipeline**. With the
`artifactnet-provenance` flag off, `composeWithAudit` returns its input by
reference (`===`) — no clone, no `preAudit` slot introduced. The existing audit
pipeline (`src/memory/grove-format.ts`, `src/skilldex-auditor/`) is byte-
identical to the phase-771 tip. Provenance findings are stored on a separate
`preAudit` array; the existing `findings` array is never mutated. The Gate G13
hash-tree test hashes every file under the existing audit pipeline before vs
after running the provenance public API surface.

---

## Module documentation pointers

| Module | Path |
|---|---|
| T1a Skilldex Conformance Auditor | [`../skilldex-auditor.md`](../skilldex-auditor.md) |
| T1b Bounded-Learning Empirical Harness | [`../bounded-learning-empirical.md`](../bounded-learning-empirical.md) |
| T1c Activation Steering Runtime | [`../activation-steering.md`](../activation-steering.md) |
| T1d FL Pre-Rollout Threat-Model Gate | [`../fl-threat-model.md`](../fl-threat-model.md) |
| T2a Experience Compression Layer | [`../experience-compression.md`](../experience-compression.md) |
| T2b Predictive Skill Auto-Loader | [`../predictive-skill-loader.md`](../predictive-skill-loader.md) |
| T2c PromptCluster BatchEffect Detector | [`../promptcluster-batcheffect.md`](../promptcluster-batcheffect.md) |
| T2d ArtifactNet Provenance Verifier | [`../artifactnet-provenance.md`](../artifactnet-provenance.md) |
| T3a Stackelberg Drainability Pricing Reference | [`../stackelberg-pricing.md`](../stackelberg-pricing.md) |
| T3b Rumor Delay Model | [`../rumor-delay-model.md`](../rumor-delay-model.md) |

Related substrate docs (v1.49.572):

| Module | Path |
|---|---|
| T1c Semantic Channel (v572) | [`../semantic-channel.md`](../semantic-channel.md) |
| Bounded-Learning Theorem Reference (v572 T1d) | [`../../docs/substrate-theorems/bounded-learning.md`](../../substrate-theorems/bounded-learning.md) |

---

## REQUIREMENTS traceability

| UIP | Module | Phase | Status |
|---|---|---|---|
| UIP-13 | T1a Skilldex Auditor | 765 | SHIPPED |
| UIP-14 | T1b Bounded-Learning Empirical | 766 | SHIPPED |
| UIP-15 | T1c Activation Steering | 767 | SHIPPED |
| UIP-16 | T1d FL Threat-Model Gate | 768 | SHIPPED |
| UIP-17 | T2a Experience Compression | 769 | SHIPPED |
| UIP-18 | T2b Predictive Skill Loader | 770 | SHIPPED |
| UIP-19 | T2c PromptCluster BatchEffect | 771 | SHIPPED |
| UIP-20 | T2d ArtifactNet Provenance | 772 | SHIPPED |
| UIP-21 | T3a Stackelberg Pricing | 773 | SHIPPED |
| UIP-22 | T3b Rumor Delay Model | 774 | SHIPPED |
| UIP-21-COMP | G14 composition gate | 775 | SHIPPED |

Full requirement text is in `.planning/REQUIREMENTS.md` UIP-13 through UIP-22.

---

*v1.49.573 Upstream Intelligence Pack v1.44. Phase 777 documentation addendum.*
*All ten modules default-off. Flag-off byte-identical verified by Gate G14.*
