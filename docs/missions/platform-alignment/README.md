# Platform Alignment — Mission Package

**Date:** 2026-04-15
**Status:** Mission Package Complete
**Source:** OOPS research series (9 docs, 2026-03-31), esp. doc 03 (12 concrete improvements) and doc 07 (skill system optimization)
**Branch:** dev

---

## Overview

This milestone implements the 12 platform-alignment improvements identified in the OOPS ecosystem analysis of Claude Code v2.1.88 (March 31, 2026 source-code exposure). OOPS found specific patterns where our architecture and the platform's architecture were converging independently; this milestone closes those gaps by wiring the hooks we were missing, reducing token cost on memory and skill loads, and adopting the versioning/lifecycle discipline that cartridge-forge just established for cartridges.

Time is a goal, not a requirement. No release deadline is binding this work. The release of v1.50 is a target, not a gate — if improvements extend past 2026-04-21, the mission continues past the release.

## The 12 Improvements

| # | Improvement | Priority | Category | OOPS Ref |
|---|-----------|----------|----------|----------|
| 1 | PreCompact/PostCompact hook pair | P0 | Hooks | doc 03 §1 |
| 2 | FileChanged external-change tracker | P0 | Hooks | doc 03 §2 |
| 3 | Memory relevance scoring (survey pattern) | P1 | Memory | doc 03 §5 |
| 4 | Split sling-dispatch into SKILL.md + references | P1 | Skills | doc 07 §7.4 |
| 5 | Split done-retirement into SKILL.md + references | P1 | Skills | doc 07 §7.5 |
| 6 | Split gupp-propulsion into SKILL.md + references | P1 | Skills | doc 07 §7.6 |
| 7 | Merge beautiful-commits + git-commit → commit-style | P2 | Skills | doc 07 §7.1 |
| 8 | Merge gsd-onboard + gsd-explain → gsd-guide | P2 | Skills | doc 07 §7.3 |
| 9 | Merge uc-lab + sc-dev-team → team-control | P2 | Skills | doc 07 §7.2 |
| 10 | Version + format frontmatter backfill (37 skills) | P2 | Skills | doc 07 §10.1 |
| 11 | Skill lifecycle system (status/deprecated/retired) | P3 | Skills | doc 07 §8 |
| 12 | PermissionDenied + Notification + Worktree hooks | P3 | Hooks | doc 03 §6-9 |

Total estimated effort per OOPS: ~56 hours across 12 items. Cross-checked 2026-04-15: item #3 (dead hook cleanup) already shipped, so those hours are subtracted.

## File Manifest

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | This file — package overview | **Complete** |
| `00-milestone-spec.md` | Master specification: scope, architecture, deliverables | **Complete** |
| `08-wave-execution-plan.md` | Wave decomposition with parallel track assignment | **Complete** |
| `09-test-plan.md` | Verification matrix and test specifications | **Complete** |
| `01-compaction-hooks-spec.md` | PreCompact/PostCompact snapshot+recovery pair | **Complete** |
| `02-filechanged-hook-spec.md` | FileChanged external-change tracker | **Complete** |
| `03-p3-hooks-spec.md` | PermissionDenied + Notification + Worktree hooks | **Complete** |
| `04-memory-relevance-spec.md` | Memory survey / relevance scoring | **Complete** |
| `05-gastown-splits-spec.md` | sling-dispatch + done-retirement + gupp-propulsion splits | **Complete** |
| `06-skill-merges-spec.md` | 3 skill-merge pairs | **Complete** |
| `07-skill-lifecycle-spec.md` | Version backfill + lifecycle states | **Complete** |

All 11 files are now on disk. The mission package is executable — a fresh session can read `00-milestone-spec.md` + `08-wave-execution-plan.md` and begin Wave 0 immediately, referring to component specs 01-07 as each track is picked up.

## Quick Stats

- **12 improvements** across 3 categories (hooks, memory, skills)
- **4 waves** (foundation → parallel hook cluster + parallel skill cluster → merge cluster → verification)
- **Model split target:** ~20% Opus (judgment: merge decisions, relevance heuristics) / ~60% Sonnet (structural: hook handlers, split refactors) / ~20% Haiku (scaffold: frontmatter backfill, settings.json edits)
- **Estimated:** 6-10 context windows across 3-5 sessions
- **Critical path:** Wave 0 (shared types) → Wave 2D (version frontmatter) → Wave 2C (merges) → Wave 3 (verification)

## Evidence Base

OOPS doc 03 cross-checked 2026-04-15 against live state:

| Item | Status | Commit if shipped |
|------|--------|-------------------|
| Dead hook cleanup (#3 in OOPS) | Shipped | `17a0c75cc`, `c42addd54` |
| Research Ops skills (6 new, versioned) | Shipped | pre-OOPS publish |
| PreCompact/PostCompact | **Open** | — |
| FileChanged | **Open** | — |
| Memory survey | **Open** (MEMORY.md is 277 lines, warned past 200-line limit) | — |
| Gastown splits | **Open** (sling-dispatch 494 lines, done-retirement 377 lines, gupp-propulsion 263 lines) | — |
| Skill merges | **Open** (all 6 source skills still exist) | — |
| Version backfill | **Open** (7/44 skills versioned as of 2026-04-15) | — |
| PermissionDenied | **Open** | — |
| Notification discovery | **Open** | — |
| Worktree lifecycle | **Open** | — |
| Lifecycle states | **Open** | — |

## Strategic Alignment

The cartridge-forge milestone (closed 2026-04-14) just established version + schema discipline for cartridges. This mission extends the same discipline to skills — version frontmatter, lifecycle states, format declarations. The two milestones are structurally the same problem applied to two different artifact types; shipping this mission makes cartridge-forge's discipline coherent across the whole .claude/ tree.

## Relationship to v1.50 Release

v1.50 ships 2026-04-21 as a target. This mission is NOT gated on that date. Some improvements (hooks, memory) would be good additions to the v1.50 release if they land in time; others (lifecycle system, skill merges) are better as post-v1.50 work to avoid churning the skill surface during the release window.

Suggested v1.50 inclusion: items 1, 2, 3, 10 (hooks + memory + version backfill). Items 4-9 and 11-12 ship when ready.

---

*This mission package is intended as input for GSD's `new-project` or `execute-phase` workflow. Frame (00 + 08 + 09) locks architecture, dependencies, and success criteria; component specs (01-07) carry per-track detail including code-skeleton references back to OOPS doc 03 and 07 at commit `254b50553`.*
