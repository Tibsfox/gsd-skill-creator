# v1.49.850 — Lessons

## Tentative observations (below promotion threshold)

### Chip-release-notes scaffolding script

**Instances: 1 (v850)**

**Observation:** The ~12 min chip-ship wall-clock floor is dominated by release-notes-prose. A `tools/scaffold-chip-release-notes.mjs` script could template the 5-file structure (README + 4 chapters) with parameterized fields (file path being chipped, LOC, hoist-placement variant — top-of-function vs inside-branch — test-pattern type — sync `expect(() => ...).toThrow` vs async `await expect(...).rejects.toThrow`).

**Why below threshold:** First instance. Three more chip ships planned (v851-v853); if the per-ship wall-clock continues to compress (v849 → 20 min; v850 → 12 min; v851 ≤ 10 min?), the diminishing returns may render scaffolding unnecessary.

**Promotion gate:** 2nd instance of "the prose is the bottleneck" recognition after v851 or v852.

**Likely classification:** Sub-pattern of Static-analysis tool authoring (#10417-#10424) — release-notes scaffolding is a structural tool that codifies a per-ship convention.

## No promotions this ship

Eligible backlog remains 0 (cleared at v847). The single new observation is below threshold.
