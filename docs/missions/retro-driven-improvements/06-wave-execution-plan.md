# Retro-Driven Improvements — Wave Execution Plan

**Date:** 2026-03-09
**Milestone Spec:** `00-milestone-spec.md`
**Estimated Execution:** ~2-3 context windows, 1 session

---

## Wave 0: Foundation (Sequential)

Quick, independent fixes that unblock nothing but should land first.

**Tasks:**

- [ ] 0.1: Modify `.claude/hooks/build-check.sh` — add `git commit` to the pattern match, add staged-TS-file guard | Model: Sonnet | Est: 2K tokens | Spec: `02-tsc-precommit-spec.md`
- [ ] 0.2: Add wave commit marker convention to project documentation (CLAUDE.md or contributing section) | Model: Haiku | Est: 1K tokens | Spec: inline in `00-milestone-spec.md`

**Produces:** Modified hook, updated convention doc
**Cache contract:** Wave 0 artifacts are independent — Wave 1 can start immediately (no dependency).

---

## Wave 1: Browser Improvements (Parallel Tracks)

Two independent front-end improvements to the PNW research browser. No shared state between tracks.

### Track A: Cross-Reference Matrix Filtering

**Spec:** `01-matrix-filtering-spec.md`
**Target:** `www/PNW/index.html`

- [ ] 1A.1: Add category group data attributes to existing table rows (`data-category` on each `<tr>`) | Model: Sonnet | Est: 3K tokens
- [ ] 1A.2: Add category toggle header rows with chevron animation + JavaScript toggle logic | Model: Sonnet | Est: 5K tokens
- [ ] 1A.3: Add column filter chips (one per project, using existing `.tag-*` colors) + JavaScript visibility toggle | Model: Sonnet | Est: 5K tokens
- [ ] 1A.4: Add responsive card view fallback at viewport < 768px | Model: Sonnet | Est: 4K tokens
- [ ] 1A.5: Add localStorage persistence for toggle + filter state | Model: Sonnet | Est: 2K tokens

### Track B: Research Browser TOC/Navigation

**Spec:** `03-browser-navigation-spec.md`
**Target:** `www/PNW/COL/page.html` (develop on one, then apply to all 9)

- [ ] 1B.1: Convert existing inline TOC to sticky sidebar layout (CSS grid, `position: sticky`) | Model: Sonnet | Est: 4K tokens
- [ ] 1B.2: Add IntersectionObserver for active heading tracking in TOC | Model: Sonnet | Est: 3K tokens
- [ ] 1B.3: Add hover anchor links to h2/h3 headings | Model: Sonnet | Est: 2K tokens
- [ ] 1B.4: Add TOC search/filter input | Model: Sonnet | Est: 2K tokens
- [ ] 1B.5: Apply identical changes to remaining 8 project page.html files | Model: Sonnet | Est: 4K tokens

**Parallel boundary:** Track A modifies only `index.html`. Track B modifies only `*/page.html` files. No shared files.

**Commit strategy:**
- Track A: `feat(pnw-index): add filterable cross-reference matrix with category groups`
- Track B: `feat(pnw-browser): add sticky TOC, section anchors, and search to research pages`

---

## Wave 2: Backend & Process (Parallel Tracks)

Two independent improvements in different codebases.

### Track A: SYMBEX Kernel Cache LRU

**Spec:** `05-kernel-cache-spec.md`
**Targets:** `math-coprocessor/jit.py`, `math-coprocessor/tests/test_jit.py`, `data/chipset/math-coprocessor.yaml`

- [ ] 2A.1: Replace `_kernel_cache` dict with `OrderedDict`, add `_cache_get`/`_cache_put` functions with LRU logic | Model: Sonnet | Est: 4K tokens
- [ ] 2A.2: Update `compile_kernel()` to use new cache functions | Model: Sonnet | Est: 2K tokens
- [ ] 2A.3: Enhance `cache_stats()` with hits/misses/evictions/hit_rate | Model: Sonnet | Est: 2K tokens
- [ ] 2A.4: Add `kernel_cache.max_entries` to math-coprocessor.yaml config | Model: Sonnet | Est: 1K tokens
- [ ] 2A.5: Write 4 new tests: eviction, LRU refresh, module unload on evict, stats metrics | Model: Sonnet | Est: 4K tokens

### Track B: Atomic Index Check

**Spec:** `04-atomic-index-spec.md`
**Targets:** New `www/PNW/index-check.sh`, modified `.claude/hooks/build-check.sh`

- [ ] 2B.1: Write `index-check.sh` verification script | Model: Sonnet | Est: 3K tokens
- [ ] 2B.2: Add PNW index warning to `build-check.sh` (warning only, not blocking) | Model: Sonnet | Est: 2K tokens
- [ ] 2B.3: Test script against current 9 projects (should pass) | Model: Sonnet | Est: 1K tokens

**Parallel boundary:** Track A modifies only `math-coprocessor/` files. Track B modifies only `www/PNW/` and `.claude/hooks/`. No shared files.

**Commit strategy:**
- Track A: `feat(symbex): add LRU eviction to JIT kernel cache`
- Track B: `feat(pnw-index): add atomic index verification script and hook warning`

---

## Wave 3: Verification (Sequential)

Final pass: verify all changes work together, run full test suite, confirm no regressions.

- [ ] 3.1: Run `npm test` — full Vitest suite (20600+ tests) must pass | Model: Sonnet | Est: 1K tokens
- [ ] 3.2: Run `npx tsc --noEmit` — confirm type-check passes | Model: Sonnet | Est: 1K tokens
- [ ] 3.3: Run `bash www/PNW/index-check.sh` — confirm all 9 projects present | Model: Sonnet | Est: 1K tokens
- [ ] 3.4: Run `python -m pytest math-coprocessor/tests/test_jit.py` — confirm kernel cache tests pass | Model: Sonnet | Est: 1K tokens
- [ ] 3.5: Visual spot-check: open `www/PNW/index.html` — confirm matrix filtering, card view | Model: Sonnet | Est: 1K tokens
- [ ] 3.6: Visual spot-check: open `www/PNW/COL/page.html?doc=flora` — confirm sticky TOC, search, anchors | Model: Sonnet | Est: 1K tokens

---

## Dependency Graph

```
Wave 0 (foundation)
  ├── 0.1: tsc hook ─────────────────────────────── (independent)
  └── 0.2: wave markers doc ─────────────────────── (independent)

Wave 1 (browser)                          ← can start immediately after Wave 0
  ├── Track A: matrix filtering ──────────────────── (index.html only)
  └── Track B: browser TOC ──────────────────────── (*/page.html only)

Wave 2 (backend + process)                ← can start immediately after Wave 0
  ├── Track A: kernel cache LRU ─────────────────── (math-coprocessor/ only)
  └── Track B: index check script ───────────────── (soft dep on 1A for table structure)

Wave 3 (verification)                     ← requires Waves 1 + 2 complete
  └── Full test suite + visual checks
```

**Note:** Wave 1 and Wave 2 can run in parallel — they share no files. The only soft dependency is 2B (index check) wanting to validate against the final matrix structure from 1A, but this is a verification concern, not a build dependency. If needed, 2B can validate against the pre-modification table and be re-run in Wave 3.

## Cache Optimization Strategy

### Shared Context
- Wave 0 is tiny (~3K tokens) — artifacts cached for Wave 1/2 consumers
- Wave 1 tracks share the PNW CSS variable palette knowledge — loaded once
- Wave 2 Track A loads the math-coprocessor codebase context — not needed by any other track

### Token Budget Estimate

| Wave | Estimated Tokens | Context Windows | Notes |
|------|-----------------|-----------------|-------|
| 0 | ~3K | Inline (current window) | Quick edits |
| 1A | ~19K | 1 | Matrix filtering in index.html |
| 1B | ~15K | 1 | TOC/nav across 9 page.html files |
| 2A | ~13K | 1 | Kernel cache in jit.py + tests |
| 2B | ~6K | Inline or 1 | Index check script + hook |
| 3 | ~6K | Inline | Verification pass |
| **Total** | **~62K** | **2-3** | Single session feasible |

---

*Wave execution plan for Retro-Driven Improvements milestone.*
