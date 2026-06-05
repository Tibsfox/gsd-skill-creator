# v1.49.977 — Summary

## The ship

Ship 3.1 of the 2026-06-03 audit plan added a reachability dimension to the
shelfware adoption scanner. The scanner previously measured import-surface only
(who-imports-whom), so the MA/MB/MD control-theory island read "partially living"
despite being unreachable from any shipped entry point. `tools/adoption-scan.mjs`
now also carries a per-module `reachableFromProduction` boolean, computed by a
file-level static-import walk from the project's declared production roots, and
reclassifies `lyapunov`/`projection` as unreachable.

## What shipped

- `tools/adoption-scan.mjs`: additive `reachableFromProduction` field + a file-level
  reachability BFS from declared shipped roots — the npm `bin`/`main` entries
  (`src/cli.ts`, `src/index.ts`), the registered Claude Code hooks, and the `src/`
  frontier imported by the shipped desktop/Tauri app. Dev/CI tooling (`tools/`,
  `scripts/`) is not a production root. Computed at file granularity then lifted to
  modules (module-level would over-report). Dynamic `import()` edges followed.
- Baseline `.md` gains a reachability summary + a "Living but unreachable from
  production" section. The dimension does not feed `--shelfware-threshold`.
- Verified verdict: 7/8 island modules `reachableFromProduction:false`
  (`lyapunov`/`projection` reclassified); `ace` (the sink) reports `true` — a static
  value-import from the production M5 selector (`orchestration/selector.ts`); the
  flag-off guarantee is runtime, not static.
- Drift-guards: `tools/__tests__/adoption-scan.test.mjs` T17–T22 (hermetic) +
  a live-scan block in `tests/integration/learning-substrate-parked.test.ts`. No new
  gate step.
- Docs: `docs/SHELFWARE-VERDICTS.md` + `docs/learning-substrate-parked.md` updated
  (reachability-v2 gap closed; 16 non-allowlisted living-but-unreachable modules
  surfaced as the Ship 3.2 triage input).

## Verification

Full suite 35975 passed; tools-suite 849 passed (incl. T17–T22); integration
drift-guard runs the scanner live and pins the island verdict; `tsc` clean.
pre-tag-gate all 20 PASS; CI green at `a3282ebf7`. step-P adversarial review: 0
genuine findings (1 MAJOR was a verified false positive — the reviewer missed the
`vitest.tools.config.mjs` tools-suite gate step).

## Engine state

NASA degree 1.178 (frozen) · counter-cadence 29 · manifest 152 — all unchanged.
