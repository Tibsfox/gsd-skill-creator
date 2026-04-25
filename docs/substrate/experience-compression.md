# Experience Compression Layer

**Module:** `src/experience-compression/`
**Phase:** 769 (W6 T2a)
**UIP:** UIP-17
**Milestone:** v1.49.573 ArXiv eess Integration (Half B)

## Overview

The Experience Compression Layer implements cross-level adaptive compression
spanning the memory/skills/rules axis per the **Experience Compression
Spectrum** (Zhang et al., arXiv:2604.15877, §2, submitted 17 April 2026).

The paper's central finding is that memory, skills, and rules are not
qualitatively distinct artifact types but points on a single quantitative
compression axis relative to raw interaction trace:

| Level       | Compression target | GSD analogue            |
|-------------|-------------------|-------------------------|
| episodic    | 5–20×             | Mission logs / raw events |
| procedural  | 50–500×           | Skills / pattern records  |
| declarative | 1000×+            | Safety Warden rules / constitution gates |

The paper's key §4 ablation finding — the **missing diagonal** — is that
existing systems treat each level as a separate subsystem with separate storage
and retrieval APIs. This causes systematic over-accumulation in the episodic
tier until retrieval latency degrades. Cross-level adaptive compression
(migrating experience across the episodic/procedural/declarative boundary as
context density grows) is the correct abstraction. This module implements that
missing diagonal.

## Citation

> Zhang et al. (submitted 17 April 2026). *Experience Compression Spectrum:
> Memory, Skills, and Rules on a Single Compression Axis*. arXiv:2604.15877.
>
> The "missing diagonal" identified in §4 refers to the absence of cross-level
> adaptive compression in existing systems — agents that store memory, skills,
> and rules in separate silos cannot automatically promote high-frequency
> episodic fragments to skill entries, nor high-redundancy skill entries to
> declarative rules. This module fills that diagonal.

## Opt-in mechanism

Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "experience-compression": { "enabled": true }
    }
  }
}
```

When the flag is absent or false, every public API call returns a
byte-identical passthrough record (`{ disabled: true }`, `ratio: 1.0`). No
subsystem behavior changes.

## Public API

```typescript
import {
  compress,           // top-level: flag-aware wrapper
  compressAtLevel,    // raw: compress(content, level, isEnabled)
  decompress,         // reconstruct ExperienceContent from CompressedRecord
  classifyLevel,      // always-on classifier (no flag check)
  bridgeLevels,       // cross-level bridge — the "missing diagonal"
  forceLevel,         // force a specific level regardless of classification
  isExperienceCompressionEnabled,
  readExperienceCompressionConfig,
} from 'src/experience-compression/index.js';
```

### `compress(content, level, settingsPath?)`

Compresses `content` at `level`. Reads the feature flag from `settingsPath`
(defaults to `.claude/gsd-skill-creator.json`). Returns `{ disabled: true }`
passthrough when flag is off.

### `classifyLevel(content)`

Classifies `content` into `'episodic' | 'procedural' | 'declarative'` using
three heuristic signals:

- **variabilityScore** — high variability → episodic; low → declarative
- **structuralRegularity** — derived from payload shape and tags
- **abstractionDepth** — 0 = raw event; 1–2 = procedure; 3+ = rule form

Returns a `ClassificationResult` with `{ level, confidence, signals }`.
Classification is always performed regardless of the feature flag (purely
advisory, no side effects).

### `bridgeLevels(content, isEnabled)`

Implements the **missing diagonal**. Classifies the content canonically, then
also compresses it at adjacent levels where the content admits the alternative
framing:

- episodic → procedural when structural regularity ≥ 0.35 or variability < 0.85
- procedural → declarative when abstraction depth ≥ 2 or regularity ≥ 0.5
- declarative → procedural always (instantiate the rule)
- procedural → episodic always (concrete instance)

Returns a `CrossLevelResult` with:
- `canonicalLevel`: the classified level
- `records`: compressed records at each admitted level (keyed by level)
- `diagonalLevels`: the non-canonical admitted levels (the missing diagonal)

## Compression strategies

### Episodic (5–20× target)

Light structural deduplication + string truncation. Arrays are replaced with a
`{ cardinality, groups: [{ structureKey, count, sample }] }` summary that
groups elements by structural signature (numeric/date leaves replaced with type
placeholders). Achieves **12.4×** on the 20-entry session-tick fixture.

### Procedural (50–500× target)

Schema extraction + parameter abstraction. Reduces the payload to a
`{ schema, params }` envelope where schema captures the structural type tree
and params holds only first/last representative leaf values. Achieves **86.6×**
on the 200-entry skill-invocation fixture.

### Declarative (1000×+ target)

Rule-form distillation to a single compact type-schema string. Collapses any
large array to `DECL:schema=array[N]<item-type>;checksum=<fnv32>` regardless
of element count or string lengths. Achieves **1428×** on the 500-entry
bounded-learning fixture.

## Test coverage

49 tests across 5 files:

| File | Tests | Coverage |
|------|-------|---------|
| `level-classifier.test.ts` | 12 | 3 fixtures per level (episodic/procedural/declarative), signal values |
| `compressor.test.ts` | 10 | Ratio tests per level, disabled path, invariants, decompress |
| `cross-level-bridge.test.ts` | 9 | Missing-diagonal ep→proc, proc→dec, disabled path, forceLevel, invariants |
| `round-trip.test.ts` | 7 | Round-trip per level + ratio + disabled |
| `integration.test.ts` | 11 | Settings reader, default-off passthrough, enabled real compression |

**Measured compression ratios on synthetic fixtures:**

| Level | Fixture | Ratio |
|-------|---------|-------|
| episodic | 20 session-tick entries × 80-char detail | **12.42×** |
| procedural | 200 skill-invocation entries × nested config | **86.61×** |
| declarative | 500 bounded-learning entries × long rationale | **1428.15×** |

## Explicit non-goals

This module does NOT:
- touch `src/orchestration/`, `src/capcom/`, `src/dacp/`, or any existing module
- modify the skill-graph DAG topology
- alter CAPCOM-gate authority surfaces or gate-state records
- implement automatic storage promotion (it is an advisory compression utility)
- require any new npm dependencies

## Composability

The module is default-off and composes with v1.49.573's other T1/T2 substrate
modules (skilldex-auditor, bounded-learning-empirical, activation-steering,
fl-threat-model) via independent feature flags in the
`upstream-intelligence` block of `.claude/gsd-skill-creator.json`. No
cross-module dependencies are introduced.

## CAPCOM preservation note

This module is advisory only. It computes compressed representations of
provided content but does not trigger any CAPCOM gate actions, modify
skill-library records, or interact with the orchestration layer. CAPCOM
gate G14 (W9 composition) verifies flag-off byte-identical behaviour across
all T1+T2 modules.

## Integration target

The primary integration target is the **DACP layer** (`src/dacp/`) as an
advisory compression companion: experience records produced by the DACP
three-part-bundle pipeline can be classified by `classifyLevel` and
compressed by `bridgeLevels` before persistent storage, without any
modification to the DACP wire format. The module is purely advisory —
it does not insert itself into any DACP codepath; callers opt in
explicitly.

```typescript
import { compress, classifyLevel } from 'src/experience-compression/index.js';

// Classify an experience record before deciding how to store it.
const cls = classifyLevel(rawInteractionTrace);
// cls.level => 'episodic' | 'procedural' | 'declarative'
// cls.confidence => 0..1

// Compress it at the classified level (flag-gated).
const record = await compress(rawInteractionTrace, cls.level);
if (record.disabled) {
  // Flag is off — no-op passthrough; store the raw trace as-is.
} else {
  // record.compressed — compressed form ready for storage
  // record.ratio       — compression achieved (e.g. 12.4×)
}
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-key

- **eess26_2604.15877** — Zhang et al., *Experience Compression Spectrum:
  Memory, Skills, and Rules on a Single Compression Axis*, 17 Apr 2026
