# Retro-Driven Improvements — Mission Package

**Date:** 2026-03-09
**Status:** Ready for Execution
**Source:** Retrospective pattern analysis of v1.49.18 through v1.49.27 (10 releases, 7 with retrospective data)
**Branch:** dev

---

## Overview

This milestone addresses the top 6 unresolved issues and process gaps identified across 10 consecutive releases of pattern analysis. Every item was flagged in retrospective sections but never resolved — the cross-reference matrix scaling issue alone appeared in 3 consecutive releases (v1.49.24, .25, .26).

The work spans three domains: the PNW research browser (HTML/CSS/JS), the math co-processor (Python), and the build hook pipeline (shell scripts). All six items are independent, enabling high parallelism.

## File Manifest

| File | Purpose |
|------|---------|
| `README.md` | This file — package overview |
| `00-milestone-spec.md` | Master specification: scope, architecture, deliverables, dependencies |
| `01-matrix-filtering-spec.md` | Cross-reference matrix: filterable/grouped view for PNW index |
| `02-tsc-precommit-spec.md` | Move `tsc --noEmit` from pre-push to pre-commit hook |
| `03-browser-navigation-spec.md` | Add TOC, section anchors, and search to research browser template |
| `04-atomic-index-spec.md` | PNW master index atomic update verification tooling |
| `05-kernel-cache-spec.md` | SYMBEX JIT kernel cache LRU eviction policy |
| `06-wave-execution-plan.md` | Wave decomposition with parallelization strategy |
| `07-test-plan.md` | Verification matrix and test specifications |

## Quick Stats

- **6 improvements** across 3 domains
- **3 waves** + foundation (Wave 0 → Wave 1A/1B → Wave 2A/2B → Wave 3)
- **Model split:** ~15% Opus (design decisions), ~80% Sonnet (implementation), ~5% Haiku (scaffold)
- **Estimated:** 2-3 context windows, single session
- **Critical path:** Wave 0 (hook fix) → Wave 1 (browser work) → Wave 3 (verification)

## Evidence Base

| Issue | Releases Flagged | Category |
|-------|-----------------|----------|
| Cross-reference matrix scaling | v1.49.24, .25, .26 (3x) | Architecture |
| `tsc --noEmit` hook positioning | v1.49.27 | Tooling |
| Research browser navigation | v1.49.22, .24 (2x) | Architecture |
| Atomic master index updates | v1.49.25, .26 (2x) | Process |
| SYMBEX kernel cache eviction | v1.49.23 | Architecture |
| Wave commit markers | v1.49.27 | Process |

---

*This mission package is intended as input for GSD's `new-project` or `execute-phase` workflow.*
