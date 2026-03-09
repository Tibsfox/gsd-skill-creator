# Retro-Driven Improvements — Test Plan

**Date:** 2026-03-09
**Milestone Spec:** `00-milestone-spec.md`
**Wave Plan:** `06-wave-execution-plan.md`

---

## Test Categories

| Category | Count | Priority |
|----------|-------|----------|
| Safety-critical | 3 | Mandatory pass |
| Core functionality | 14 | Required |
| Integration | 4 | Required |
| Edge cases | 5 | Best-effort |
| **Total** | **26** | |

---

## Safety-Critical Tests (Mandatory Pass)

These block the milestone. Failure means code must not be tagged or pushed.

| ID | Component | What It Verifies | Expected Behavior | Failure Action |
|----|-----------|-----------------|-------------------|----------------|
| S-001 | Kernel cache | GPU module unload on eviction | `gpu.cu_module_unload()` called for every evicted kernel | BLOCK |
| S-002 | tsc hook | Non-TS commits are not blocked | Commit with only `.md`/`.yaml`/`.py` files succeeds without tsc check | BLOCK |
| S-003 | Browser nav | Existing links not broken | All `href` attributes in modified files resolve to valid targets | BLOCK |

---

## Core Functionality Tests

### Matrix Filtering (01-spec)

| ID | What It Verifies | Expected Behavior |
|----|-----------------|-------------------|
| C-001 | Category toggle hides/shows rows | Click "Living Systems" header → Flora/Fauna/Fungi/Aquatic/Climate/Networks rows toggle visibility |
| C-002 | Column filter chips toggle columns | Click "COL" chip → COL column hidden; click again → visible |
| C-003 | Filter state persists | Toggle some filters → reload page → same filters active |
| C-004 | Mobile card view activates | Viewport < 768px → table hidden, card view shown |
| C-005 | No horizontal scroll at 12 columns | Add 3 mock columns → matrix remains within viewport on 1920px screen |

### tsc Pre-Commit Hook (02-spec)

| ID | What It Verifies | Expected Behavior |
|----|-----------------|-------------------|
| C-006 | TS commit triggers type check | Stage a `.ts` file with error → `git commit` blocked with "TypeScript errors found" |
| C-007 | Clean TS commit succeeds | Stage a valid `.ts` file → `git commit` succeeds |
| C-008 | Push still checks unconditionally | `git push` runs `tsc --noEmit` regardless of staged files |

### Browser TOC/Navigation (03-spec)

| ID | What It Verifies | Expected Behavior |
|----|-----------------|-------------------|
| C-009 | Sticky TOC on wide viewport | Viewport >= 1024px → TOC fixed in left column while content scrolls |
| C-010 | Active heading highlighted | Scroll past h2 "Flora" → TOC entry for "Flora" gets `.active` class |
| C-011 | TOC search filters entries | Type "fauna" in search → only TOC entries containing "fauna" visible |
| C-012 | Anchor links on headings | Hover h2 → `#` anchor link appears; click → URL hash updates |

### Kernel Cache LRU (05-spec)

| ID | What It Verifies | Expected Behavior |
|----|-----------------|-------------------|
| C-013 | LRU eviction at capacity | Insert `max + 1` kernels → oldest (least recently used) evicted, cache size = max |
| C-014 | LRU refresh on access | Access older kernel → it moves to most-recent, survives next eviction |

---

## Integration Tests

| ID | Components | What It Verifies | Expected Behavior |
|----|-----------|-----------------|-------------------|
| I-001 | Hook + tsc | Full commit workflow | Stage `.ts` → commit → hook runs tsc → passes or blocks correctly |
| I-002 | Index check + matrix | Index validation | Run `index-check.sh` after matrix filtering changes → all 9 projects found |
| I-003 | All page.html files | Consistency | Diff `page.html` navigation code across all 9 projects → identical |
| I-004 | Cache stats + MCP | Stats exposure | `symbex.capabilities()` returns updated cache stats with new fields |

---

## Edge Cases (Best-Effort)

| ID | Component | What It Verifies | Expected Behavior |
|----|-----------|-----------------|-------------------|
| E-001 | Matrix | All columns hidden | Click all filter chips off → "No projects selected" message shown |
| E-002 | Browser TOC | Document with < 3 headings | No TOC generated (existing behavior preserved) |
| E-003 | Browser TOC | Document with 0 headings | No TOC, no sidebar, content fills full width |
| E-004 | Kernel cache | Max reduced at runtime | Set max from 64 to 16 while 32 cached → 16 evicted on next insert |
| E-005 | Index check | New project directory with no index.html | Script detects directory, reports missing from matrix |

---

## Verification Matrix

Maps vision success criteria to test IDs:

| Requirement | Test ID(s) | Component |
|------------|-----------|-----------|
| Matrix usable at 12+ columns without horizontal scroll | C-005 | Matrix filtering |
| Category toggles expand/collapse row groups | C-001 | Matrix filtering |
| Column filter chips show/hide columns | C-002, C-003 | Matrix filtering |
| Mobile card view at viewport < 768px | C-004 | Matrix filtering |
| All existing links remain functional | S-003 | Matrix filtering + Browser TOC |
| `git commit` with staged TS triggers tsc | C-006, C-007 | tsc hook |
| Non-TS commits skip type check | S-002 | tsc hook |
| `git push` still checks unconditionally | C-008 | tsc hook |
| Sticky sidebar TOC on wide viewport | C-009 | Browser TOC |
| Active heading highlighted on scroll | C-010 | Browser TOC |
| TOC search filters entries | C-011 | Browser TOC |
| Anchor links on headings | C-012 | Browser TOC |
| Cache enforces max_entries limit | C-013 | Kernel cache |
| LRU eviction order correct | C-014 | Kernel cache |
| GPU modules unloaded on eviction | S-001 | Kernel cache |
| Cache stats include eviction metrics | I-004 | Kernel cache |
| Index check detects all projects | I-002 | Atomic index |
| All 9 page.html files identical navigation | I-003 | Browser TOC |

---

## Test Execution Order

1. **Wave 0 verification:** C-006, C-007, S-002, C-008 (hook tests — manual git operations)
2. **Wave 1A verification:** C-001 through C-005, S-003 (browser tests — visual inspection)
3. **Wave 1B verification:** C-009 through C-012, E-002, E-003, I-003 (browser tests — visual inspection)
4. **Wave 2A verification:** C-013, C-014, S-001, E-004, I-004 (Python unit tests — `pytest`)
5. **Wave 2B verification:** I-002, E-005 (script execution — `bash index-check.sh`)
6. **Full integration:** I-001 (end-to-end commit workflow)
7. **Regression:** `npm test` (20600+ existing tests must pass), `npx tsc --noEmit` (zero errors)

---

*Test plan for Retro-Driven Improvements milestone.*
