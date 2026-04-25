# FL Threat-Model Gate — UIP-16 T1d

> Phase 768, v1.49.573 Upstream Intelligence Pack v1.44.
> Gate-only — NO federated training implemented.

`src/fl-threat-model/` is a structural pre-rollout gate that **blocks
unauthorized federated-training paths** until the data-free MIA threat model
is explicitly addressed in calling code's design document.

The module is default-off and opt-in via the
`gsd-skill-creator.upstream-intelligence.fl-threat-model.enabled` flag in
`.claude/gsd-skill-creator.json`. With the flag off every call returns
`{ verdict: 'gate-disabled', blocks: [], messages: [] }` — a zero-side-effect
passthrough byte-identical with the pre-768 baseline (G14 CAPCOM composition
gate requirement).

## Threat-model antecedents

The gate is grounded in three arXiv papers, all submitted 21 April 2026 by Lee
et al. (the **Lee et al. trio**), and all from the 17–23 April 2026 arXiv eess
window:

### 1. Data-Free Membership Inference Attack — arXiv:2604.19891

Lee et al., *Data-Free Membership Inference Attack on Federated Learning in
Hardware Assurance*, arXiv:2604.19891, 21 Apr 2026.

Describes a SCLL-prior gradient-inversion MIA that reconstructs training
examples from intercepted per-client gradient updates **without any auxiliary
dataset**. The attack exploits a domain-specific structural prior
(Standard Cell Library Layouts in hardware assurance; analogously, skill YAML
schema, mission templates, or codebase style conventions in GSD) to constrain
the otherwise intractable gradient-inversion optimisation.

Key finding: all four preconditions for practical attack feasibility
(gradient interception, structured domain prior, known architecture, absence of
sufficient DP noise) are satisfied in an unprotected GSD federated-training
setting.

### 2. DECIFR — arXiv:2604.19915

Lee et al., *DECIFR: Domain-Aware Exfiltration of Circuit Information from
Federated Gradient Reconstruction*, arXiv:2604.19915, 21 Apr 2026.

Introduces a targeted exfiltration attack that extracts specific
high-IP-density content (circuit topology, routing metadata) from training
gradients using domain-aware routing. DECIFR is more dangerous than general
MIA because:

- It does **not** require full training-data reconstruction — partial
  exfiltration of a few hundred bytes of domain metadata is sufficient.
- It can succeed at **lower DP noise budgets** than full MIA defence (the
  domain-aware classifier focuses on low-frequency gradient structure, which
  is more resistant to high-frequency DP noise).
- It is **composable** across FL rounds — the attacker averages partial
  reconstructions to cancel noise.

Primary countermeasure: **secure aggregation** (per-client gradients never
revealed to the server). Differential privacy alone at budgets designed for
general MIA is insufficient against DECIFR.

### 3. FL Hardware Assurance Survey — arXiv:2604.20020

Lee et al., *Potentials and Pitfalls of Applying Federated Learning in
Hardware Assurance*, arXiv:2604.20020, 21 Apr 2026.

Canonical threat taxonomy across four categories:

| Category | GSD relevance |
|---|---|
| Data Reconstruction (gradient inversion, model inversion, property inference) | HIGH — skill-content data is structured and domain-rich |
| Model Poisoning (Byzantine, backdoor) | MEDIUM — malicious DoltHub contributor scenario |
| Inference Attacks (property / attribute / classical MIA) | MEDIUM — classical MIA subsumed by 2604.19891 |
| Communication Attacks (eavesdropping, MITM) | MEDIUM — TLS covers basic case; compromised-server case requires secure aggregation |

The survey also documents the positive case for FL (privacy-preserving
collaborative learning, heterogeneous generalisation) — the motivation for
eventually lifting the BLOCK once the gate passes.

Canonical spec: `.planning/missions/arxiv-eess-integration-apr17-23/work/templates/m4-mia-threat-model.tex`

---

## Mandatory mitigation matrix

All four mitigations must be addressed in a design document's YAML frontmatter
before the gate opens. Failure to address any one mitigation BLOCKS the
proposal.

| # | Mitigation | Source | What it prevents |
|---|---|---|---|
| 1 | **Differential privacy** (calibrated noise budget ε) | arXiv:2604.19891, 2604.20020 | SCLL-prior gradient-inversion MIA |
| 2 | **Gradient clipping** (ℓ₂ norm bound C) | arXiv:2604.20020 | DP precondition: bounds gradient sensitivity, enables formally calibrated ε |
| 3 | **Secure aggregation** (named protocol: SecAgg / SecAgg+ / LightSecAgg) | arXiv:2604.19915, 2604.20020 | Per-client gradient interception by DECIFR |
| 4 | **Per-client training-data cap** (max examples per round) | arXiv:2604.20020 | Limits gradient information density for both MIA and DECIFR |

---

## Design-doc YAML frontmatter schema

Any federated training design document must include the following
`fl_threat_model` block. The gate validator checks every field and BLOCKs
on any missing, null, false, empty, or placeholder value.

```yaml
# REQUIRED in any federated training design document
# Gate: Phase 768 T1d FL Pre-Rollout Threat-Model Gate
# Validator: src/fl-threat-model/

fl_threat_model:
  version: "1.0.0"
  mandatory_sources:             # All three Lee et al. IDs MUST be present
    - "eess26_2604.19891"        # Data-Free MIA
    - "eess26_2604.19915"        # DECIFR
    - "eess26_2604.20020"        # FL HW Assurance Survey
  mitigations:
    differential_privacy:
      enabled: true              # Must be true
      noise_mechanism: "gaussian"  # or "laplacian" — must be non-empty
      epsilon: 1.0               # Must be a positive finite number
      delta: 0.00001             # Required for Gaussian
      accuracy_tradeoff_documented: true   # Must be true
    gradient_clipping:
      enabled: true              # Must be true
      clipping_norm: 1.0         # Must be a positive finite number
      bias_characterised: true   # Must be true
    secure_aggregation:
      enabled: true              # Must be true
      protocol: "SecAgg+"        # Must be named — empty/TODO/TBD blocks
      communication_overhead_estimated: true  # Must be true
    per_client_data_cap:
      enabled: true              # Must be true
      cap_value: 500             # Must be a positive finite number
      cap_rationale: "..."       # Must be non-empty — TODO/TBD blocks
  decifr_assessment:
    attack_class_enumerated: true                        # Must be true
    secure_aggregation_as_primary_countermeasure: true   # Must be true
  dolthub_delineation:
    static_skill_sharing_permitted: true
    federated_training_status: "BLOCKED"
    unblock_conditions_documented: true                  # Must be true
```

---

## 15 block-on conditions

The gate BLOCKS if **any** of the following are true:

| # | Condition |
|---|---|
| 1 | `fl_threat_model` block is absent from the frontmatter |
| 2 | Any of the three mandatory source IDs (2604.19891, 2604.19915, 2604.20020) is absent from `mandatory_sources` |
| 3 | `differential_privacy.enabled` is false |
| 4 | `differential_privacy.epsilon` is null or not a positive finite number |
| 5 | `differential_privacy.accuracy_tradeoff_documented` is false |
| 6 | `gradient_clipping.enabled` is false |
| 7 | `gradient_clipping.clipping_norm` is null or not a positive finite number |
| 8 | `secure_aggregation.enabled` is false |
| 9 | `secure_aggregation.protocol` is empty or a placeholder (TODO/TBD/etc.) |
| 10 | `per_client_data_cap.enabled` is false |
| 11 | `per_client_data_cap.cap_value` is null or not a positive finite number |
| 12 | `per_client_data_cap.cap_rationale` is empty or a placeholder |
| 13 | `decifr_assessment.attack_class_enumerated` is false |
| 14 | `decifr_assessment.secure_aggregation_as_primary_countermeasure` is false |
| 15 | `dolthub_delineation.unblock_conditions_documented` is false |

---

## DoltHub delineation

The current GSD skill economy (v1.49.x) operates on **static skill sharing**:
versioned YAML assets published and installed via the `skill-creator` CLI. No
model gradients are transmitted. No federated training occurs. **This mode is
fully permitted and carries no FL threat model concerns.**

| Activity | Status in v1.49.573 | Gate to unblock |
|---|---|---|
| Publish skill YAML to DoltHub | PERMITTED | — |
| Install skill via skill-creator CLI | PERMITTED | — |
| Version and diff skill assets | PERMITTED | — |
| Federated inference (no gradients) | PERMITTED | — |
| Distributed loss aggregation (scalar only) | PERMITTED | — |
| Federated training (any gradient exchange) | **BLOCKED** | Phase 768 T1d |
| Gradient sharing for debugging | **BLOCKED** | Phase 768 T1d |
| Prototype federated fine-tuning | **BLOCKED** | Phase 768 T1d |

---

## API reference

```typescript
import {
  gatePreRollout,
  validateDesignDoc,
  validateDesignDocContent,
} from './src/fl-threat-model/index.js';
import type { DesignDoc, GateVerdict } from './src/fl-threat-model/index.js';
```

### `gatePreRollout(designDoc, settingsPath?): GateVerdict`

Evaluate the gate against a pre-parsed `DesignDoc`. Returns
`{ verdict: 'gate-disabled' }` when the opt-in flag is off.

### `validateDesignDoc(yamlPath, settingsPath?): GateVerdict`

Load a design-doc file from disk and evaluate the gate. Handles YAML or
Markdown-with-frontmatter.

### `validateDesignDocContent(yamlContent, settingsPath?, sourcePath?): GateVerdict`

Parse a YAML string in memory and evaluate the gate. Useful for programmatic
callers.

### `GateVerdict` shape

```typescript
{
  verdict:    'pass' | 'block' | 'gate-disabled';
  blocks:     string[];   // block-on condition keys that fired
  messages:   string[];   // human-readable descriptions (parallel to blocks)
  timestamp:  string;     // ISO-8601
  sourcePath?: string;
}
```

---

## Opt-in flag

Set `gsd-skill-creator.upstream-intelligence.fl-threat-model.enabled: true`
in `.claude/gsd-skill-creator.json` to enable the gate. The project-level
config already sets this to `true` as of v1.49.573.

When disabled (default), every gate call is a zero-cost passthrough:
`{ verdict: 'gate-disabled', blocks: [], messages: [] }`.

---

## Test coverage

`src/fl-threat-model/__tests__/` — 115 tests across 4 suites:

| Suite | Tests | What it covers |
|---|---|---|
| `yaml-validator.test.ts` | 19 | Frontmatter extraction, cite checks, YAML coercion, Markdown frontmatter |
| `mitigation-matrix.test.ts` | 24 | All 4 mitigations — pass and each failure mode |
| `block-on-conditions.test.ts` | 40 | All 15 block-on conditions — positive + negative |
| `integration.test.ts` | 32 | End-to-end gate, YAML string API, JSON round-trip, CAPCOM boundary |

---

## eess26 cite-keys

- **eess26_2604.19891** — Lee et al., *Data-Free Membership Inference Attack on
  Federated Learning in Hardware Assurance*, 21 Apr 2026
- **eess26_2604.19915** — Lee et al., *DECIFR: Domain-Aware Exfiltration of
  Circuit Information from Federated Gradient Reconstruction*, 21 Apr 2026
- **eess26_2604.20020** — Lee et al., *Potentials and Pitfalls of Applying
  Federated Learning in Hardware Assurance*, 21 Apr 2026

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

---

*Phase 768, v1.49.573 Upstream Intelligence Pack v1.44. Gate-only deliverable.
Federated training remains BLOCKED until this gate is passed with a complete
design document. See also: m4-mia-threat-model.tex (canonical spec), UIP-16.*
