# Adapter Lifecycle Governance

> **Domain:** GPU Adapter Management
> **Module:** 6 -- silicon.yaml v2 Schema, Staleness Detection, and Community Quarantine
> **Through-line:** *Jay Miner understood that hardware without governance is a liability. The Amiga's chip registers were not just addresses -- they were a contract. Write to DMACON and the system behaves predictably. Write garbage and the system tells you, immediately, because the register map enforces its own rules.* Adapter lifecycle governance is that contract for the GPU orchestration layer. Every adapter has a version, a checksum, a confidence floor, and a staleness timer. Every community adapter passes quarantine before it touches inference. The register map is self-enforcing. The silicon.yaml schema is the contract.

---

## Table of Contents

1. [Lifecycle Architecture Overview](#1-lifecycle-architecture-overview)
2. [silicon.yaml v2 Schema](#2-siliconyaml-v2-schema)
3. [Adapter Versioning Model](#3-adapter-versioning-model)
4. [Staleness Detection Algorithm](#4-staleness-detection-algorithm)
5. [Community Adapter Quarantine](#5-community-adapter-quarantine)
6. [Integrity Verification Chain](#6-integrity-verification-chain)
7. [Adapter States and Transitions](#7-adapter-states-and-transitions)
8. [VRAM Eviction Policy](#8-vram-eviction-policy)
9. [Archive and Purge Operations](#9-archive-and-purge-operations)
10. [Power Management Integration](#10-power-management-integration)
11. [GSD Integration Patterns](#11-gsd-integration-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Lifecycle Architecture Overview

Every LoRA adapter in the GSD ecosystem moves through a governed lifecycle: from creation (training pair distillation) through evaluation, promotion, active service, staleness detection, and eventual archival or purge. The lifecycle is encoded in `silicon.yaml` and enforced by the orchestration layer -- no adapter can bypass a stage [1].

```
ADAPTER LIFECYCLE STATE MACHINE
================================================================

  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ TRAINING │────>│ CANDIDATE│────>│ PROMOTED │
  │          │     │          │     │ (active) │
  └──────────┘     └──────────┘     └──────┬───┘
                        ^                  |
                        |            ┌─────┴──────┐
                   [retrain]         |            |
                        |            v            v
                   ┌──────────┐  ┌──────────┐
                   │  STALE   │  │ INACTIVE │
                   │ (flagged)│  │ (evicted)│
                   └────┬─────┘  └────┬─────┘
                        |             |
                        v             v
                   ┌──────────┐  ┌──────────┐
                   │ ARCHIVED │  │  PURGED  │
                   │ (on disk)│  │ (deleted)│
                   └──────────┘  └──────────┘

  Community adapters enter at QUARANTINE, which gates
  to CANDIDATE only after all verification passes.
```

---

## 2. silicon.yaml v2 Schema

### Schema Extensions

The v2 schema adds lifecycle management fields to the existing v1 adapter configuration:

```yaml
# silicon.yaml v2 -- Adapter Lifecycle Extensions
chipset: gsd-gpu-orchestration-v2
base_model: qwen3-8b-instruct-Q4_K_M
mode: hybrid

gpu:
  device: 0
  vram_budget_gb: 6.0
  resident_adapters_max: 4
  overflow: degrade

streams:
  observe:   { id: 0, priority: low,    sm_fraction: 0.05 }
  detect:    { id: 1, priority: high,   sm_fraction: 0.20 }
  suggest:   { id: 2, priority: normal, sm_fraction: 0.10 }
  apply:     { id: 3, priority: high,   sm_fraction: 0.30 }
  learn:     { id: 4, priority: low,    sm_fraction: 0.25 }
  compose:   { id: 5, priority: normal, sm_fraction: 0.10 }

routing:
  confidence_threshold: 0.82
  partial_match_threshold: 0.65
  fallback: cloud
  discrepancy_log: logs/routing-discrepancy.jsonl

adapters:
  - id: frontend-patterns
    file: adapters/frontend-patterns.safetensors
    checksum_sha256: "a1b2c3d4e5f6..."      # v2: integrity hash
    version: "2.1.0"                         # v2: semver versioning
    vram_mb: 420
    confidence_floor: 0.80
    staleness_threshold_days: 30             # v2: auto-flag timer
    training_pairs_count: 127                # v2: training provenance
    eval_perplexity_improvement: 0.18        # v2: quality metric
    eval_brier_score: 0.11                   # v2: calibration quality
    sharing: private
    quarantine: false                        # v2: community gate
    state: promoted                          # v2: lifecycle state
    promoted_at: "2026-03-15T14:22:00Z"      # v2: promotion timestamp
    last_trained_at: "2026-03-14T10:00:00Z"  # v2: training timestamp
    last_routed_at: "2026-03-26T14:22:00Z"   # v2: usage timestamp

dashboard:
  nvml_poll_interval_ms: 250
  stream_telemetry: true
  heat_map: vram_pressure
  event_bus_path: .chipset/logs/silicon-usage.jsonl
```

### JSON Schema for Validation

The v2 schema is published as a JSON Schema document, enabling validation of silicon.yaml files before they are loaded by the orchestration layer. The schema enforces:

- `checksum_sha256` is a 64-character hex string
- `version` follows semver format (major.minor.patch)
- `state` is one of: training, candidate, promoted, stale, inactive, archived, quarantine
- `vram_mb` is a positive integer
- `confidence_floor` is between 0.0 and 1.0
- SM fractions sum to exactly 1.00 (with 0.01 tolerance for rounding)

### Backward Compatibility

The v2 schema is a strict superset of v1: all v1 configurations validate against the v2 schema. New fields have defaults: `state: promoted`, `quarantine: false`, `checksum_sha256: null` (computed on first access). The orchestration layer migrates v1 files to v2 on first load by adding default values for new fields [1].

---

## 3. Adapter Versioning Model

### Semantic Versioning

Adapters follow semver (major.minor.patch):

| Component | Increments When |
|---|---|
| Major | Base model changes; adapter incompatible with previous base |
| Minor | Significant retraining (50+ new pairs); performance characteristics change |
| Patch | Incremental update (< 50 new pairs); bug fix in training data |

### Version History

Each adapter maintains a version history in `.chipset/adapters/<adapter_id>/versions.jsonl`:

```json
{
  "version": "2.1.0",
  "timestamp": "2026-03-15T14:22:00Z",
  "training_pairs_added": 45,
  "total_training_pairs": 127,
  "perplexity_improvement": 0.18,
  "brier_score": 0.11,
  "previous_version": "2.0.0",
  "checksum": "a1b2c3d4e5f6..."
}
```

### Rollback Capability

Previous adapter versions are retained on disk (compressed, not VRAM-resident) for rollback. If a newly promoted adapter performs worse than its predecessor, the orchestration layer can revert to the previous version via:

```bash
gsd chipset rollback frontend-patterns --to 2.0.0
```

This restores the previous safetensors file, updates silicon.yaml, and logs the rollback event [1].

---

## 4. Staleness Detection Algorithm

### Three-Signal Staleness Model

An adapter becomes stale when any of the following conditions is met [2]:

**Signal 1: Confidence Decay**
The rolling 7-day average confidence score for routing decisions targeting this adapter drops below the declared `confidence_floor`. Formula:

```
stale_confidence = rolling_avg_7d(confidence) < confidence_floor
```

**Signal 2: Discrepancy Accumulation**
The discrepancy log accumulates more than 15 high-divergence samples (similarity < 0.75) targeting this adapter in any 7-day window. Formula:

```
stale_discrepancy = count_7d(discrepancy where similarity < 0.75) > 15
```

**Signal 3: Time Decay**
More than `staleness_threshold_days` have elapsed since the last training pair was added to this adapter's training set. Formula:

```
stale_time = (now - last_trained_at) > staleness_threshold_days
```

### Response Actions

| Condition | New State | Action |
|---|---|---|
| Any 1 signal fires | Promoted (watched) | Dashboard amber warning; monitoring rate doubled |
| Any 2 signals fire | Stale | Downgraded to candidate; retraining recommended |
| All 3 signals fire | Stale (critical) | Evicted from VRAM; retraining mandatory before re-promotion |

---

## 5. Community Adapter Quarantine

### Quarantine Pipeline

Community adapters (installed via `gsd chipset install <source>`) are untrusted by default. They enter the quarantine state and cannot execute inference until all verification stages pass [3]:

```
COMMUNITY ADAPTER QUARANTINE PIPELINE
================================================================

  gsd chipset install <adapter-url>
      |
      v
  Stage 1: CHECKSUM VERIFICATION
  SHA-256 hash matches published manifest?
      |── FAIL: reject, log error
      v── PASS:
  Stage 2: BEHAVIORAL TESTING
  Run 20 known-good prompt/response pairs
  All responses within similarity threshold?
      |── FAIL: reject, log divergences
      v── PASS:
  Stage 3: VRAM FOOTPRINT MEASUREMENT
  Actual VRAM <= declared vram_mb * 1.10?
      |── FAIL: reject, report size mismatch
      v── PASS:
  Stage 4: INFERENCE LATENCY MEASUREMENT
  p99 latency <= declared * 2.0?
      |── FAIL: warn (soft fail, proceed with warning)
      v── PASS:
  All stages complete?
      |
      v── YES: State -> candidate (ready for promotion evaluation)
      v── NO:  State -> rejected (quarantine failed)

  Total pipeline time: < 60 seconds on reference hardware
```

### Security Considerations

| Threat | Mitigation |
|---|---|
| Tampered weights | SHA-256 checksum verification against signed manifest |
| Backdoor behavior | Behavioral testing against canonical eval set |
| VRAM bomb (oversized) | Pre-load size check; actual measurement in quarantine |
| Supply chain (MITM) | HTTPS-only download; manifest signed with publisher key |
| Gradual drift | Post-quarantine monitoring via standard discrepancy pipeline |

> **SAFETY WARNING:** Community adapters execute neural network inference -- they can produce any text the model generates. Quarantine testing covers behavioral correctness on known inputs but cannot guarantee safety on arbitrary inputs. The discrepancy monitoring pipeline provides ongoing verification after quarantine release. Users should never install community adapters from untrusted sources.

---

## 6. Integrity Verification Chain

### Checksum Architecture

The integrity chain links adapter file hashes through `chipset.lock`:

```
INTEGRITY VERIFICATION CHAIN
================================================================

  silicon.yaml
  ├── adapter.checksum_sha256: "abc123..."
  │
  chipset.lock
  ├── frontend-patterns:
  │   ├── file_hash: "abc123..."        (SHA-256 of .safetensors)
  │   ├── config_hash: "def456..."      (SHA-256 of silicon.yaml entry)
  │   ├── training_hash: "ghi789..."    (SHA-256 of training pairs)
  │   └── lock_version: 3
  │
  Runtime Verification:
  1. Load silicon.yaml -> read declared hash
  2. Load chipset.lock -> read locked hash
  3. Compute file hash  -> SHA-256 of adapter file on disk
  4. Compare all three  -> must match
  5. FAIL on mismatch   -> adapter blocked from loading
```

### chipset.lock Format

```json
{
  "version": 3,
  "generated_at": "2026-03-26T14:00:00Z",
  "adapters": {
    "frontend-patterns": {
      "file_hash": "a1b2c3d4e5f6...",
      "config_hash": "b2c3d4e5f6a1...",
      "training_hash": "c3d4e5f6a1b2...",
      "version": "2.1.0",
      "quarantine_passed": true,
      "quarantine_date": "2026-03-14T10:00:00Z"
    }
  }
}
```

---

## 7. Adapter States and Transitions

### State Definitions

| State | VRAM Resident | Routing Eligible | Description |
|---|---|---|---|
| Training | No | No | QLoRA distillation in progress |
| Quarantine | No | No | Community adapter; verification pending |
| Candidate | No | No | Trained; awaiting promotion evaluation |
| Promoted | Yes (if slot available) | Yes | Active; routing and inference enabled |
| Stale | Demoted (evicted if needed) | Degraded | Performance declined; retraining recommended |
| Inactive | No | No | Low utilization; archived to disk |
| Archived | No | No | Preserved on disk; not loaded or routed |
| Purged | No | No | Permanently deleted |

### Transition Rules

```
VALID STATE TRANSITIONS
================================================================

  training     -> candidate       (training complete)
  quarantine   -> candidate       (all 4 verification stages pass)
  quarantine   -> rejected        (any verification stage fails)
  candidate    -> promoted        (all 3 promotion criteria met)
  candidate    -> training        (retrain requested)
  promoted     -> stale           (2+ staleness signals fire)
  promoted     -> inactive        (activity-stale for 3 weeks)
  stale        -> candidate       (retrained; re-evaluate)
  stale        -> archived        (user or timer; preserved on disk)
  inactive     -> candidate       (user requests reactivation)
  inactive     -> archived        (30 days inactive; auto-archive)
  archived     -> candidate       (user requests unarchive)
  archived     -> purged          (user explicitly deletes)

  INVALID transitions are rejected by the state machine.
  Every transition is logged in the adapter event log.
```

---

## 8. VRAM Eviction Policy

### LRU with Priority Override

When VRAM is full and a new adapter needs to be loaded, the eviction policy selects the victim:

1. **Priority check**: Never evict an adapter currently serving an active inference request
2. **State check**: Stale and inactive adapters are evicted before promoted adapters
3. **LRU tie-break**: Among adapters with the same state, evict the least-recently-used
4. **Confidence tie-break**: Among equal-LRU adapters, evict the one with the lowest recent confidence

### Eviction Logging

```json
{
  "ts": "2026-03-26T14:22:00.100Z",
  "type": "eviction",
  "adapter_id": "old-patterns",
  "reason": "vram_pressure",
  "vram_freed_mb": 420,
  "replacing_with": "new-patterns",
  "last_used_at": "2026-03-25T09:00:00Z"
}
```

---

## 9. Archive and Purge Operations

### Archive

Archive preserves the adapter on disk but removes it from active consideration:

```bash
gsd chipset archive frontend-patterns
```

Effects: state -> archived, VRAM evicted, removed from routing, safetensors compressed (gzip), training pairs preserved, version history preserved. Reversible via `gsd chipset unarchive`.

### Purge

Purge permanently deletes the adapter:

```bash
gsd chipset purge frontend-patterns --confirm
```

Effects: safetensors deleted, training pairs deleted, version history deleted, silicon.yaml entry removed, chipset.lock entry removed. Irreversible. Requires `--confirm` flag.

> **SAFETY WARNING:** Purge is destructive and irreversible. The `--confirm` flag is mandatory. The CLI prompts for confirmation even with the flag present. Training pairs are deleted -- they cannot be recovered. If there is any chance the adapter will be needed again, use `archive` instead.

---

## 10. Power Management Integration

### GPU Power States and Adapter Lifecycle

NVIDIA GPUs support multiple power states (P-states) that affect clock speed and power consumption. The orchestration layer integrates power management with adapter lifecycle decisions [4]:

| Power State | Clock Speed | Adapter Impact |
|---|---|---|
| P0 (Maximum) | Boost clock | All streams active; full inference throughput |
| P2 (Balanced) | Base clock | Training paused; inference at base throughput |
| P5 (Idle) | Reduced | Only observe stream active; adapters VRAM-resident but idle |
| P8 (Minimum) | Minimum | Adapters may be evicted to reduce VRAM power draw |

### Thermal-Aware Training Scheduling

Training jobs (Stream 4) are scheduled with thermal awareness:

```
IF temperature > 78C:
  PAUSE training stream
  LOG thermal_pause event
  WAIT until temperature < 72C
  RESUME training stream
```

This prevents thermal throttling from extending training time unpredictably and protects the GPU from sustained high-temperature operation [4].

### Power Budget for PNW Workstation

| Component | Idle (W) | Inference (W) | Training (W) | Peak (W) |
|---|---|---|---|---|
| RTX 4060 Ti | 15 | 85 | 140 | 160 (TDP) |
| i7-6700K | 45 | 65 | 65 | 91 (TDP) |
| System (total) | 120 | 210 | 265 | 320 |

At PNW electricity rates (~$0.12/kWh), sustained training costs approximately $0.032/hour. A 30-minute training session costs $0.016 [5].

---

## 11. GSD Integration Patterns

### CLI Commands

```bash
# Adapter lifecycle management
gsd chipset list                    # List all adapters with state
gsd chipset info frontend-patterns  # Detailed adapter information
gsd chipset promote <adapter>       # Manually promote candidate
gsd chipset demote <adapter>        # Demote to candidate
gsd chipset archive <adapter>       # Archive adapter
gsd chipset unarchive <adapter>     # Restore from archive
gsd chipset purge <adapter> --confirm  # Permanently delete
gsd chipset rollback <adapter> --to <version>  # Restore version
gsd chipset calibrate               # Recalibrate confidence thresholds
gsd chipset install <source>        # Install community adapter (quarantine)
gsd chipset status                  # Overall chipset health summary
```

### Dashboard Integration

The adapter lifecycle module surfaces on the Denise panel as:
1. **Adapter roster**: List of all adapters with state icons (color-coded)
2. **Health timeline**: Per-adapter confidence trend over 30 days
3. **VRAM residency map**: Which adapters are VRAM-resident, which are on disk
4. **Staleness alerts**: Amber/red warnings for adapters approaching staleness thresholds

---

## 12. Cross-References

> **Related:** [LoRA Adapter Pipeline](02-lora-adapter-pipeline.md) -- Training pipeline that creates adapters entering this module's lifecycle. [Hybrid Execution Protocol](05-hybrid-execution-protocol.md) -- Staleness detection and degradation model that triggers lifecycle state transitions. [CUDA/GL Dashboard](03-cuda-gl-dashboard.md) -- Dashboard components that visualize adapter lifecycle state.

**Cross-project references:**
- **GSD2** (GSD-2 Architecture) -- Skill lifecycle model that parallels adapter lifecycle
- **ACE** (Compute Engine) -- Container image lifecycle (build, push, deploy, deprecate) as governance parallel
- **K8S** (Kubernetes) -- Pod lifecycle and garbage collection as architectural reference
- **MCF** (Multi-Cluster Federation) -- Federated adapter distribution and version synchronization
- **SYS** (Systems Admin) -- Configuration management (Ansible/Puppet) as governance parallel
- **CMH** (Computational Mesh) -- Distributed adapter cache coherence across mesh nodes
- **OCN** (Open Compute) -- Hardware lifecycle management standards

---

## 13. Sources

1. GSD Silicon Layer specification, *gsd-silicon-layer-spec.md*. silicon.yaml schema and adapter lifecycle model.
2. GSD Chipset Architecture specification, *gsd-chipset-architecture-vision.md*. Staleness detection and adapter governance.
3. Supply chain security best practices. SLSA framework (Supply-chain Levels for Software Artifacts), slsa.dev.
4. NVIDIA, *NVML API Reference Guide* (2026). Power management and thermal monitoring APIs.
5. PNW electricity rate: Puget Sound Energy residential rate schedule, March 2026. ~$0.12/kWh average.
6. Semver specification, *semver.org*. Semantic versioning 2.0.0.
7. GSD-OS Desktop specification, *gsd-os-desktop-vision.md*. Dashboard integration and CLI command design.
8. NVIDIA, *CUDA Programming Guide v12.x* (2026). P-state management and power capping.
9. O'Reilly, *AI Systems Performance Engineering*, Ch. 6 (GPU Architecture), November 2025.
10. Dettmers, T. et al., "QLoRA: Efficient Finetuning of Quantized LLMs," *NeurIPS 2023*. Adapter file format.
11. HuggingFace, *Safetensors Format Specification* (2026). Available: huggingface.co/docs/safetensors
12. NVIDIA, *Data Center GPU Manager (DCGM)* (2026). Enterprise adapter lifecycle patterns.
13. Kubernetes Documentation, *Pod Lifecycle* (2026). Available: kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
14. SLSA Framework, *Supply-chain Levels for Software Artifacts* (2026). Available: slsa.dev
15. GSD Skill-Creator specification, *gsd-skill-creator-analysis.md*. Six-stage pipeline and pattern detection.
16. NVIDIA, *GeForce RTX 4060 Ti Power Specifications* (2023). TDP and power state documentation.
