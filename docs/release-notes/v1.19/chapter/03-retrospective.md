# Retrospective — v1.19

## What Worked

- **Separating installed inventory from loading projection.** The core insight -- that "what's installed" and "what fits in the budget" are two different questions -- fixed the budget display by giving each its own data model and rendering path. `installedTotal` vs `loadableTotal` is a clean decomposition.
- **Color-coded budget bar with 4 thresholds.** green (<60%), cyan (60-79%), yellow (80-99%), red (>=100%) gives immediate visual feedback without requiring the user to read numbers. The clamped-to-100% rendering for over-budget states avoids broken visuals.
- **JSON output mode for CLI status.** `--json` with structured installed array and projection object makes the budget data machine-readable. This enables scripted budget monitoring and CI integration.

## What Could Be Better

- **3 phases for a budget fix feels heavyweight.** The scope is correct (model, CLI, dashboard+config), but this is fundamentally a display bug that grew into a feature because the underlying data model was wrong. Earlier separation of installed vs loadable would have prevented the need for this release.

## Lessons Learned

1. **Display bugs often signal data model problems.** The budget percentages were wrong because the model conflated two distinct concepts. Fixing the display required fixing the model first -- `LoadingProjection` as a pure function is the right primitive.
2. **History format migration matters.** The dual-dimension budget history tracking with graceful handling of old single-value snapshots shows that schema evolution in append-only logs needs to be planned for, not patched after.

---
