# Philosophy Dissolved — Wave Execution Plan

**Total Tasks:** 11 | **Parallel Tracks:** 3 | **Sequential Depth:** 4 waves  
**Estimated Wall Time:** ~2.5 hours (down from ~5.5 sequential)  
**Critical Path:** 4 sequential sessions (Wave 0 → Wave 1 flagship → Wave 2 remaining → Wave 3 integration)

## Wave Summary

| Wave | Tasks | Parallel Tracks | Est. Time | Cache Dependencies |
|------|-------|----------------|-----------|-------------------|
| 0 | 1 | 1 | ~5 min | None — produces four-beat template + shared types |
| 1 | 3 | 3 | ~30 min | Wave 0 template; vision doc |
| 2 | 5 | 3 | ~45 min | Wave 0 template; Wave 1 flagships for pattern reference |
| 3 | 2 | 1 | ~20 min | All Wave 1 + Wave 2 rooms completed |

## Wave 0: Foundation (Sequential)

Produce the shared four-beat template and document format that all 14 paradox docs will follow. Must complete within 5-minute TTL.

| Task | Description | Produces | Model | Est. Tokens |
|------|------------|----------|-------|-------------|
| T0.1 | Four-beat template: document structure, section headers, notation conventions, Architecture Connection format | `_templates/four-beat.md` | Haiku | ~1.5K |

## Wave 1: Flagships (Parallel)

Three flagship paradoxes — one per judgment-heavy room. These establish the pattern that Wave 2 follows. Each requires Opus for synthesis with source texts.

### Track A: Evidence & Confirmation

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T1.1 | Hempel's Raven Paradox — full four-beat; Bayesian weight-of-evidence calculation; formal Amiga Principle theorem statement | `rooms/01-evidence-confirmation/hempel-raven.md` | Opus | ~6K | T0.1 |

### Track B: Identity & Persistence

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T1.2 | Ship of Theseus — full four-beat; standing wave identity framework; explicit Space Between connection (boundary condition, eigenvalue metaphor) | `rooms/02-identity-persistence/ship-of-theseus.md` | Opus | ~5K | T0.1 |

### Track C: Self-Reference & Emergence

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T1.3 | Chinese Room — full four-beat; functorial understanding argument; explicit Hundred Voices Proof connection | `rooms/05-self-reference-emergence/chinese-room.md` | Opus | ~5K | T0.1 |

## Wave 2: Remaining Rooms (Parallel)

Pattern established by flagships. Sonnet executes structural implementation.

### Track A: Rooms 1 & 2 Remaining

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T2.1 | Goodman's Grue + Duhem-Quine — four-beat each, following hempel-raven pattern | `rooms/01-evidence-confirmation/{goodman-grue,duhem-quine}.md` | Sonnet | ~4K | T0.1, T1.1 |
| T2.2 | Sorites + Teletransportation — four-beat each, following ship-of-theseus pattern | `rooms/02-identity-persistence/{sorites,teletransportation}.md` | Sonnet | ~4K | T0.1, T1.2 |

### Track B: Rooms 3 & 4

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T2.3 | Zeno's Dichotomy + Achilles + Thomson's Lamp — four-beat each; convergent series calculations | `rooms/03-infinity-motion/*.md` | Sonnet | ~6K | T0.1 |
| T2.4 | Newcomb + Surprise Examination + Sleeping Beauty — four-beat each; Bayesian calculations | `rooms/04-decision-prediction/*.md` | Sonnet | ~6K | T0.1, T1.1 |

### Track C: Room 5 Remaining

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T2.5 | Liar's Paradox + Mary's Room — four-beat each, following chinese-room pattern | `rooms/05-self-reference-emergence/{liar,mary-room}.md` | Sonnet | ~4K | T0.1, T1.3 |

## Wave 3: Integration & Cross-References (Sequential)

| Task | Description | Produces | Model | Est. Tokens | Depends On |
|------|------------|----------|-------|-------------|------------|
| T3.1 | Foundations map + architecture connections — cross-reference all 14 paradoxes to foundations and GSD components | `foundations-map.md`, `architecture-connections.md` | Sonnet | ~3K | All Wave 1 + Wave 2 |
| T3.2 | README — file manifest, execution summary, usage instructions | `README.md` | Haiku | ~1K | All above |

## Cache Optimization Strategy

### Skill Loads Saved

- Four-beat template (T0.1) loaded once, cached for all Wave 1 + Wave 2 tasks
- Vision doc summary tier (~3K) loaded for all tasks requiring GSD architecture connections
- Mathematical foundations summary loaded for all tasks requiring foundation mapping

### Schema Reuse

- Four-beat document structure is identical across all 14 paradoxes — template cached from Wave 0
- Bayesian calculation format established in T1.1 (Raven), reused in T2.4 (Room 4)
- Identity framework format established in T1.2 (Theseus), reused in T2.2 (Room 2)
- Self-reference format established in T1.3 (Chinese Room), reused in T2.5 (Room 5)

### Pre-Computed Knowledge Tiers

| Tier | Size | Contents |
|------|------|----------|
| Summary (~3K) | Always loaded | Paradox names, room assignments, foundation mappings, GSD component canonical names |
| Active (~12K) | On demand | Three flagship four-beat treatments (Raven, Theseus, Chinese Room) |
| Reference (~30K) | Deep dives only | Full mathematical foundations conversation; Space Between identity passages; Hundred Voices emergence passages |

### Token Budget Estimate

| Wave | Est. Tokens | Context Windows | Sessions |
|------|-------------|-----------------|----------|
| 0 | ~1.5K | 1 | 1 |
| 1 | ~16K | 3 (parallel) | 1 |
| 2 | ~24K | 5 (3 parallel tracks) | 1-2 |
| 3 | ~4K | 2 | 1 |
| **Total** | **~45.5K** | **11** | **~4** |

## Dependency Graph

```
T0.1 [Haiku, template]
 ├──→ T1.1 [Opus, Raven] ──→ T2.1 [Sonnet, Room 1 remaining]
 │                          ──→ T2.4 [Sonnet, Room 4]
 ├──→ T1.2 [Opus, Theseus] ──→ T2.2 [Sonnet, Room 2 remaining]
 ├──→ T1.3 [Opus, Chinese Room] ──→ T2.5 [Sonnet, Room 5 remaining]
 └──→ T2.3 [Sonnet, Room 3] ─┐
                               ├──→ T3.1 [Sonnet, cross-refs]
     All Wave 1 + Wave 2 ─────┘     └──→ T3.2 [Haiku, README]

Critical path: T0.1 → T1.1 → T2.4 → T3.1 → T3.2
                              (longest Wave 2 task)
```
