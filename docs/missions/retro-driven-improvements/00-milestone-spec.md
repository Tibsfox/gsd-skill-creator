# Retro-Driven Improvements — Milestone Specification

**Date:** 2026-03-09
**Vision Document:** (derived from retrospective analysis of v1.49.18–v1.49.27)
**Research Reference:** Release notes retrospective sections across 10 releases
**Estimated Execution:** ~2-3 context windows across 1 session

---

## Mission Objective

Resolve the 6 most persistent unresolved issues identified through retrospective pattern analysis of the last 10 releases. Every item has been flagged at least once in a "What Could Be Better" or "Lessons Learned" section and never addressed. Done means: the PNW index handles 10+ projects without horizontal scrolling, research documents have navigable TOC, type errors are caught at commit time not push time, the SYMBEX kernel cache self-manages its memory, and PNW releases can't skip index updates.

## Architecture Overview

Three independent domains, six independent improvements:

```
PNW Research Browser (www/PNW/)
├── Cross-reference matrix filtering  (index.html)
├── Research browser TOC/navigation   (*/page.html template)
└── Atomic index update verification  (new: index-check.sh)

Math Co-Processor (math-coprocessor/)
└── SYMBEX kernel cache LRU eviction  (jit.py)

Build Hooks (.claude/hooks/)
└── tsc --noEmit to pre-commit        (build-check.sh)

Process (convention only)
└── Wave commit markers                (documentation)
```

No cross-domain dependencies. All six items can be developed and tested independently.

## Deliverables

1. **Modified `www/PNW/index.html`** — Cross-reference matrix with category group toggles and responsive card view fallback. Matrix usable at 12+ projects without horizontal scroll.
2. **Modified `www/PNW/*/page.html`** (9 files) — Auto-generated sticky TOC from h2/h3 headings, anchor links, optional text search. Applied consistently across all 9 project browsers.
3. **Modified `.claude/hooks/build-check.sh`** — `tsc --noEmit` runs on `git commit` in addition to `git push`. Same error display, same exit-2 blocking behavior.
4. **New `www/PNW/index-check.sh`** — Verification script that checks all projects are represented in cross-reference matrix, geographic coverage, and reading order tables. Returns non-zero if any project is missing.
5. **Modified `math-coprocessor/jit.py`** — LRU eviction on kernel cache with configurable max size (default 64). Evicted kernels have their GPU modules properly unloaded. Cache stats include eviction metrics.
6. **Modified `data/chipset/math-coprocessor.yaml`** — New `kernel_cache_max_entries` config field.
7. **Updated `math-coprocessor/tests/test_jit.py`** — Tests for LRU eviction, max size enforcement, module cleanup on eviction.
8. **Convention document** — Wave commit message format documented in CLAUDE.md or contributing guide.

## Component Breakdown

| Component | Spec Document | Dependencies | Model Assignment |
|-----------|--------------|-------------|-----------------|
| Matrix filtering | `01-matrix-filtering-spec.md` | None | Sonnet |
| tsc pre-commit | `02-tsc-precommit-spec.md` | None | Sonnet |
| Browser TOC/nav | `03-browser-navigation-spec.md` | None | Sonnet |
| Atomic index check | `04-atomic-index-spec.md` | Matrix filtering (same file) | Sonnet |
| Kernel cache LRU | `05-kernel-cache-spec.md` | None | Sonnet |
| Wave commit markers | (inline in this spec) | None | Haiku |

## Model Assignment Rationale

All six items are structural/implementation work — well-defined problems with clear solutions. No judgment-heavy design decisions or creative work. Sonnet handles all implementation. Haiku handles the convention doc (pure text, no logic).

Opus involvement: only if the matrix filtering UX requires design iteration during execution (e.g., the category grouping doesn't work visually and needs rethinking). This is a contingency, not planned.

## Cross-Component Interfaces

None. All six improvements are fully independent. The only soft dependency is that the atomic index check script (deliverable 4) should be written after the matrix filtering work (deliverable 1) is complete, so it validates the final table structure.

## Safety & Boundary Conditions

- **No changes to research content.** Only browser chrome, navigation, and tooling.
- **No changes to markdown files.** Research `.md` files are untouched.
- **Hook changes must not break existing workflow.** The `tsc --noEmit` addition must still allow commits to code that doesn't touch TypeScript (e.g., docs-only commits, markdown, YAML). Check: if no `.ts` files are staged, skip the type check.
- **Kernel cache eviction must unload GPU modules.** Evicted kernels call `gpu.cu_module_unload()` before removal. Failure to do so leaks VRAM.
- **Browser changes must work offline.** No CDN dependencies, no external JS libraries. All changes use the existing inline JS architecture.

## Wave Commit Markers Convention

When session boundaries force combining waves into a single commit, use this format:

```
feat(scope): summary of combined work

Wave N: [what wave N delivered]
Wave M: [what wave M delivered]

[optional body with details]
```

Example from v1.49.27 that motivated this:
```
feat(spatial-awareness): add wave 2+3 integration, verification, and packaging

Wave 2: Frog Protocol implementation (chorus state machine, phase transitions)
Wave 3: Verification suite (285 tests), packaging, barrel exports
```

This preserves bisect intent in the commit message even when the commit boundary doesn't align with wave boundaries.

---

*Master specification for Retro-Driven Improvements milestone. All component specs reference this document.*
