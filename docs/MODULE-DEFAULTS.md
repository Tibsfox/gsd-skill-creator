# Module Defaults — gsd-skill-creator

**Updated:** 2026-04-23 (per operator directive to flip defaults)

This document is the single source of truth for which gsd-skill-creator modules are **on by default** and which are **opt-in**. It also names the feature flags, their locations, and the per-module defaults.

## Modules ON by default

These modules run without any flag-setting. On a fresh clone with no `.claude/gsd-skill-creator.json`, they are active.

### JSON-reader defaults (override via `.claude/gsd-skill-creator.json`)

| Module | Flag | Default | Opt-out by setting |
|---|---|---|---|
| **Math GPU coprocessor** (algebrus / fourier / statos / symbex / vectora chips + MCP server + CPU oracle fallback) | `coprocessor.enabled` | **TRUE** | `"coprocessor": { "enabled": false }` |

### In-memory `CoEvolutionSettings` default

| Module | Setting | Default | Opt-out by passing |
|---|---|---|---|
| **M8 Symbiosis** co-evolution pass (`src/symbiosis/coEvolution.ts`) | `CoEvolutionSettings.enabled` | **TRUE** | `{ enabled: false }` |

### Always-on when imported (no flag exists, pure compute or library module)

These modules are enabled the moment a caller imports them. There is nothing to "enable" — calling them IS enabling them. They ship zero-cost if nobody imports them.

| Module | Location | Type |
|---|---|---|
| **M1 Semantic Memory Graph** | `src/graph/` | Library (entity/edge schema, Leiden community detection, GraphRAG query patterns) |
| **M2 Hierarchical Memory** | `src/memory/` | Library (short-term / long-term / αβγ scorer / reflection pass) |
| **M3 Decision-Trace Ledger** | `src/traces/` | Library (AMTP append-only JSONL) |
| **M4 Branch-Context** | `src/branches/` | Library (fork / explore / commit / abort lifecycle) |
| **M7 Umwelt / Markov-blanket** | `src/umwelt/` | Library (Markov-blanket boundary + variational free-energy minimiser). **Exception:** its Langevin noise-injection extension (MD-3) is flag-gated via `umwelt.langevin.enabled`. |
| **DRIFT-18 Semantic-drift detector** | `src/drift/semantic-drift.ts` | Pure compute (SD-score over claim-window embeddings). Callers opt in by invoking. |
| **DRIFT-22 TraceAlign BCI** | `src/drift/bci.ts` + `scripts/drift/bci-validate.mjs` | Pure compute (Belief Conflict Index). Callers opt in by invoking the script or importing. |

## Modules OPT-IN (flagged, default OFF)

These default to OFF. Operators opt in by creating `.claude/gsd-skill-creator.json` with the relevant flag set to `true`. See the example in `.claude/gsd-skill-creator.json` at repo root.

### v1.49.561 Living Sensoria — JSON-driven

| Flag | Phase | Description |
|---|---|---|
| `sensoria.enabled` | 639 | M6 Sensoria net-shift receptor substrate (Lanzara 2023) |
| `orchestration.enabled` | 646 | M5 Orchestration multi-turn retrieval + selector + prefix cache |
| `orchestration.ace.enabled` | 655 | MA-2 ACE actor-critic wire (M7 ΔF → M5 selector) |
| `orchestration.stochastic.enabled` | 664 | MA-3 + MD-2 softmax / ε-greedy stochastic selection |
| `sensoria.lyapunov.enabled` | 661 | MB-1 Lyapunov K_H adaptation (Sastry & Bodson 1989) |
| `lyapunov.projection.enabled` | 662 | MB-2 smooth projection operators |
| `lyapunov.dead_zone.enabled` | 663 | MB-5 dead-zone bounded learning |
| `umwelt.langevin.enabled` | 665 | MD-3 SGLD-style noise injection on M7 online update (Welling & Teh 2011) |
| `temperature.schedule.enabled` | 666 | MD-4 temperature schedule tied to M8 Quintessence axes |
| `sensoria.learnable_k_h.enabled` | 668 | MD-5 per-(skill, task-type) learnable K_H/K_L heads |
| `embeddings.audit.enabled` | 669 | MD-6 periodic representation audit |
| `model_affinity.enabled` | 670 | ME-2 per-skill model affinity + Haiku→Sonnet→Opus escalation |

### v1.49.561 Living Sensoria — env-driven

| Env var | Phase | Description |
|---|---|---|
| `GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED=1` | 667 | MD-1 shallow learned embeddings (word2vec) |
| `SC_AB_HARNESS_ENABLED=1` | 671 | ME-3 significance-gated A/B harness on M4 fork/explore/commit |

### v1.49.569 Drift in LLM Systems — JSON-driven

| Flag | Phase | Description |
|---|---|---|
| `drift.knowledge.earlyStop` | 692 | DRIFT-19 early-stop hook driven by SD-score threshold |
| `drift.knowledge.rerank` | 692 | DRIFT-19 rerank hook driven by SD-score threshold |
| `drift.alignment.taskDriftMonitor` | 693 | DRIFT-20 activation-delta monitor at CAPCOM-gate boundaries (Abdelnabi et al. 2024) |
| `drift.retrieval.temporalCheck` | 695 | DRIFT-23 Chronos-style temporal retrieval check |
| `drift.retrieval.groundingFaithfulness` | 695 | DRIFT-24 SGI-style grounding-faithfulness assertion |
| `drift.retrieval.contextEntropyGuard` | 696 | DRIFT-25 BEE-RAG context-entropy guard |

## Numeric tuning thresholds (not opt-in flags)

These are tuning knobs, not boolean opt-ins. They live alongside the opt-in flags in `.claude/gsd-skill-creator.json` at their canonical defaults. Override by editing the value.

| Setting | Default | Unit | Used by |
|---|---|---|---|
| `drift.retrieval.maxLagMs` | `86400000` (24h) | milliseconds | DRIFT-23 temporal retrieval — Δt-gap threshold |
| `drift.alignment.taskDriftThreshold` | `0.5` | activation-delta magnitude | DRIFT-20 task-drift monitor |
| `drift.retrieval.entropyThreshold` | `0.5` | normalized Shannon entropy | DRIFT-25 context-entropy guard |
| `drift.alignment.bciThreshold` | `0.7` | BCI score [0, 1] | DRIFT-22 BCI CLI — BLOCK above this |

## Settings file resolution order

Each reader tries these files in order, picking the first that exists and contains a `"gsd-skill-creator"` scope:

1. `.claude/gsd-skill-creator.json` — library-native (harness-untouched, gitignored)
2. `.claude/settings.json` — shared harness file (schema-validated; library fields may be rejected by the harness)

When a caller provides an explicit `settingsPath`, only that path is read (preserves test isolation).

## Why the split into two files

Claude Code's `.claude/settings.json` is JSON-schema-validated by the harness and rejects unknown top-level keys. The gsd-skill-creator library originally stored opt-in flags there, but as the harness tightened its schema, the `gsd-skill-creator` top-level key became invalid. The library-native `.claude/gsd-skill-creator.json` avoids the collision — it's project-local, gitignored, and harness-untouched. Every reader falls back to `.claude/settings.json` for backward compatibility with older deployments.

## How to override a default-ON module

Create `.claude/gsd-skill-creator.json` (if absent):

```json
{
  "gsd-skill-creator": {
    "coprocessor": { "enabled": false }
  }
}
```

The co-evolution (M8 Symbiosis) default is an in-memory default constant — pass `{ enabled: false }` at call site to disable per-call (there is no JSON flag for this particular module).
