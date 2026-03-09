# v1.19 — Budget Display Overhaul

**Shipped:** 2026-02-14
**Phases:** 149-151 (3 phases) | **Plans:** 7 | **Requirements:** 27

Fix the budget display across CLI and dashboard by separating the installed skill inventory from loading projection, fixing percentages, and making the budget configurable.

### Key Features

**Budget Inventory Model (Phase 149):**
- `LoadingProjection` type with `projectLoading()` pure function simulating BudgetStage tier-based selection
- Tier priority ordering: critical > standard > optional, with profile awareness
- `CumulativeBudgetResult` extended with `installedTotal` and `loadableTotal` separation
- Skills exceeding single-skill limit flagged in projection
- Dual-view `formatBudgetDisplay` showing both dimensions

**CLI Status Redesign (Phase 150):**
- Two-section layout: "Installed Skills" with proportional percentages and "Loading Projection" with loaded/deferred breakdown
- Per-skill percentage uses total installed as denominator (not budget limit)
- Over-budget scenarios show count-based summary ("3 of 14 skills fit") with no negative headroom
- Color-coded budget bar: green (<60%), cyan (60-79%), yellow (80-99%), red (>=100%)
- Mini progress bars per skill, relative to largest skill
- JSON output mode (`--json`) with structured installed array and projection object

**Dashboard Gauge & Budget Configuration (Phase 151):**
- Dashboard gauge shows loading projection with deferred skills hover tooltip
- Over-budget state renders filled bar with red outline (clamped to 100%, no overflow)
- Threshold transitions at 80% warning and 95% critical preserved
- Configurable per-profile cumulative budgets in integration config
- Environment variable `SLASH_COMMAND_TOOL_CHAR_BUDGET` backward compatible as fallback
- Dual-dimension budget history tracking installed total and loaded total separately
- History format migration handles old single-value snapshots gracefully

### Test Coverage

- 284 tests across 7 test files

## Retrospective

### What Worked
- **Separating installed inventory from loading projection.** The core insight -- that "what's installed" and "what fits in the budget" are two different questions -- fixed the budget display by giving each its own data model and rendering path. `installedTotal` vs `loadableTotal` is a clean decomposition.
- **Color-coded budget bar with 4 thresholds.** green (<60%), cyan (60-79%), yellow (80-99%), red (>=100%) gives immediate visual feedback without requiring the user to read numbers. The clamped-to-100% rendering for over-budget states avoids broken visuals.
- **JSON output mode for CLI status.** `--json` with structured installed array and projection object makes the budget data machine-readable. This enables scripted budget monitoring and CI integration.

### What Could Be Better
- **3 phases for a budget fix feels heavyweight.** The scope is correct (model, CLI, dashboard+config), but this is fundamentally a display bug that grew into a feature because the underlying data model was wrong. Earlier separation of installed vs loadable would have prevented the need for this release.

## Lessons Learned

1. **Display bugs often signal data model problems.** The budget percentages were wrong because the model conflated two distinct concepts. Fixing the display required fixing the model first -- `LoadingProjection` as a pure function is the right primitive.
2. **History format migration matters.** The dual-dimension budget history tracking with graceful handling of old single-value snapshots shows that schema evolution in append-only logs needs to be planned for, not patched after.

---
