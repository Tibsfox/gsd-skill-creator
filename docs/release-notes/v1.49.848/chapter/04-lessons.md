# v1.49.848 — Lessons

## Tentative observations (below promotion threshold)

### Help-coverage drift as a tracked metric

**Instances: 1 (v848)**

**Observation:** The gap between `dispatch.ts` aliases (84) and `help.ts` Commands-block entries (62 → 82 this ship) is a measurable quality signal. A `tools/check-help-coverage.mjs` script could compute the ratio + warn when aliases lack lines. Could plug into pre-tag-gate as an advisory step.

**Why below threshold:** First instance. Help-text drift may not recur at sufficient cadence to justify a tracked metric; this audit caught a 14-ship accumulation but the next help-coverage gap could be much smaller.

**Promotion gate:** 2nd instance of help-coverage drift accumulated to ≥5 commands without between-ship surfacing.

**Likely classification:** Sub-pattern of #10421 (metric-emitting tools commit a baseline file so future runs diff via git). Help-coverage metric would fit Static-analysis tool authoring (#10417-#10421, #10424) cleanly.

### Command docstrings as one-liner source-of-truth

**Instances: 1 (v848)**

**Observation:** When writing help.ts one-liners for missing commands, the most accurate description comes from the implementation file's JSDoc header (e.g., `src/cli/commands/predict-next.ts`, `src/tractability/cli.ts`, `src/output-structure/cli.ts`), not the dispatch.ts registration line (which only shows the alias and handler-stub). The docstring already contains: subcommand list, feature-gate notes, acceptance gates, security notes.

**Why below threshold:** First instance. The pattern only matters when adding multiple help lines at once (this ship: 20 lines). Single-command help adds wouldn't benefit from the convention.

**Promotion gate:** 2nd instance of multi-command help expansion where docstring-pulled descriptions outperformed guessed-from-alias-name descriptions.

**Likely classification:** Doc-pipeline discipline — possibly belongs in a future documentation-authoring discipline doc, or as a refinement of Static-analysis tool discipline (#10417-#10424). Defer classification until 2nd instance clarifies the shape.

## No promotions this ship

Eligible backlog was cleared at v847. Post-v848 backlog remains 0 + 2 new 1-instance observations.

## No lessons emitted from prior ships

The full codify-eligible backlog was cleared at v847. The 9 carried-forward 1-instance observations from v840-v847 remain unchanged at v848 (this is a behavior-neutral ship; no new ship-shape evidence accrued).
