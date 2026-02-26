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

---
