# v1.49.561 — Living Sensoria

**Released:** 2026-04-18
**Scope:** Eight composable modules (M1–M8) — memory stack, net-shift receptor substrate, Markov-blanket boundary, teaching/co-evolution relationship layer
**Branch:** dev → main
**Type:** milestone — Living Sensoria (base mission M1–M5 + extension mission M6–M8)
**Predecessor:** v1.49.560 — Release Documentation Uplift
**Phases:** 636–650 (15 phases across Wave 0 → Wave 3)
**New tests:** +684 net (546 new module tests + 138 existing-suite coverage additions from integration wiring)
**New deps:** 0
**Verification:** All 24 acceptance criteria met; 2 deferred (LS-22 manual annotation, IT-08 doc-regen tooling); all 13 safety-critical tests PASS; zero new test failures

## Summary

v1.49.561 lands eight composable modules that extend gsd-skill-creator from a pattern log into a structured sensorium. The five mechanism modules (M1–M5) provide a semantic memory graph with Leiden community detection, a three-tier hybrid memory system with αβγ scoring and reflection, an append-only decision-trace ledger, copy-on-write branch-context experimentation, and a multi-turn retrieval loop with KVFlow-style anticipatory preloading. The three substrate/boundary/relationship modules (M6–M8) add a Lanzara net-shift receptor layer for graded skill activation, a Markov-blanket boundary enforced at the TypeScript type level with a variational free-energy minimiser, and a bidirectional teaching and co-evolution accounting system with a five-axis Quintessence vital-signs report. All eight modules default off; v1.49.560 installs load byte-identically with all flags unset. Zero new runtime dependencies were introduced.

## Per-Phase Commit Table

| Phase | Wave | Description | Commit |
|-------|------|-------------|--------|
| 636 | W0.1 | Shared TypeScript types (M1–M8) | `84659688f` |
| 637 | W0.2 | Theoretical foundation audit | `39855779f` |
| 638 | W0.3 | Grove re-architecture inventory | `b8faec206` |
| 639 | W1.A | M6 Sensoria net-shift layer | `3de03d60e` |
| 640 | W1.B | M7 Umwelt Markov-blanket + free-energy minimiser | `7964c9d51` |
| 641 | W1.C | M8 Symbiosis teaching + co-evolution + Quintessence | `0271ac43a` |
| 642 | W1.D | M1 Semantic Memory Graph on Grove substrate | `484e08d44` |
| 643 | W1.D | M2 Hierarchical Hybrid Memory on existing tiers | `d41351a5a` |
| 644 | W1.D | M3 Decision-Trace Ledger on event-log | `960d07b95` |
| 645 | W1.D | M4 Branch-Context experimentation | `2a3eed0e9` |
| 646 | W1.D | M5 retrieval loop + prefix cache | `eefa1e598` |
| 647 | W2.1 | Eight-module Living Sensoria integration chain | `a60120685` |
| 648 | W3.1 | Regression report (this document's baseline) | `4bd42dafc` |
| 649 | W3.2 | Documentation (four module guides + README/CLAUDE/FORMAT/EXTENSIONS updates) | — |
| 650 | W3.3 | Release notes (CHANGELOG entry + this index) | — |

Phases 649 and 650 are the two documentation publication phases; their commits will be created by the main orchestrator agent after SCRIBE output review.

## Key Results

| Metric | Value |
|--------|-------|
| New test files | 45 |
| New tests (net) | +684 |
| Pre-existing failures | 2 (unchanged — `harness-integrity.test.ts` version-consistency, known baseline) |
| New failures | 0 |
| `tsc --noEmit` | clean |
| Grove REWRITEs executed | 0 |
| New runtime dependencies | 0 |
| Safety-critical tests (BLOCK) | 13 / 13 PASS |
| Acceptance criteria met | 22 / 24 (2 deferred, neither blocks release) |

## Module Quick Reference

| Module | Path | Opt-in flag | Guide |
|--------|------|-------------|-------|
| M1 Semantic Memory Graph | `src/graph/` | `gsd-skill-creator.graph.enabled` | [memory-stack.md](../../memory-stack.md) |
| M2 Hierarchical Hybrid Memory | `src/memory/` (extended) | `gsd-skill-creator.memory.enabled` | [memory-stack.md](../../memory-stack.md) |
| M3 Decision-Trace Ledger | `src/traces/` | `gsd-skill-creator.traces.enabled` | [memory-stack.md](../../memory-stack.md) |
| M4 Branch-Context | `src/branches/` | `gsd-skill-creator.branches.enabled` | [memory-stack.md](../../memory-stack.md) |
| M5 Agentic Orchestration | `src/orchestration/`, `src/cache/` | `gsd-skill-creator.orchestration.enabled` | [memory-stack.md](../../memory-stack.md) |
| M6 Sensoria | `src/sensoria/` | `gsd-skill-creator.sensoria.enabled` | [sensoria.md](../../sensoria.md) |
| M7 Umwelt | `src/umwelt/` | `gsd-skill-creator.umwelt.enabled` | [umwelt.md](../../umwelt.md) |
| M8 Symbiosis | `src/symbiosis/` | `gsd-skill-creator.symbiosis.enabled` | [symbiosis.md](../../symbiosis.md) |

## Links

- [Regression report](./regression-report.md) — Phase 648 full test results, per-module breakdown, safety-critical test table, Grove re-architecture summary
- [Theoretical audit](../../foundations/theoretical-audit.md) — Primary-source derivations: net-shift equation, Markov-blanket partition, Quintessence five features, GraphRAG adaptation, Amiga Principle mapping
- [Grove re-architecture inventory](../../grove-rearch/inventory.md) — EXTEND/NEW-LAYER/UNTOUCHED classification for all 104 files in `src/memory/` and `src/mesh/`
- [Milestone spec](../../../.planning/staging/living-sensoria-mission/03-milestone-spec.md) — 24 acceptance criteria, scope boundaries, wave assignments, safety constraints
- [Mission README](../../../.planning/staging/living-sensoria-mission/README.md) — Module roster, execution summary, source packages

---

## Dedication

Richard G. Lanzara's net-shift model, developed across *Origins of Life's Sensoria* (2023) and foundational work with Kuperstein (1991), provides the two-state receptor binding equilibrium that grounds M6's graded activation formula. The model converts an ad-hoc threshold into a closed-form equation with four testable behavioural consequences: Weber's law log-linearity, high-dose saturation, tachyphylaxis under sustained exposure, and the silent-binder edge case.

Karl J. Friston's free-energy principle, introduced in "The free-energy principle: a unified brain theory" (*Nature Reviews Neuroscience*, 2010) and extended in "The anatomy of choice: active inference and agency" (*Frontiers in Human Neuroscience*, 2013), furnishes the variational objective that M7 minimises. The formulation F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)] provides a single quantity whose minimisation simultaneously improves model accuracy and predictive coverage without requiring separate learning and control loops.

Michael Kirchhoff, Thomas Parr, Erik Palacios, Karl Friston, and Julian Kiverstein, in "The Markov blankets of life: autonomy, active inference and the free energy principle" (*J. R. Soc. Interface*, 2018), prove that any system that persists against thermodynamic dissipation necessarily exhibits a Markov-blanket structure — that the four-way partition into internal, sensory, active, and external states is a mathematical consequence of persistence, not a design choice. This result is what allows M7 to enforce the partition as a structural claim rather than a modelling convention.

Miles Tiberius Foxglove's *The Space Between: The Autodidact's Guide to the Galaxy* (2026) opens with a preface (pp. xxv–xxxii, pending source-print verification) establishing the boundary-condition frame: a human and an AI agent are two different kinds of pattern on two different substrates, and the exchange surface between them is the productive site precisely because of that incommensurability. This frame gives M8's symbiosis register its structural interpretation — the teaching and co-evolution ledgers are a formal accounting of what crosses the {Sensory, Active} boundary in each direction, not a claim that the exchange produces shared experience.
