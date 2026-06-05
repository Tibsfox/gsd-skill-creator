---
title: "v1.49.977 — reachability-aware adoption scanner"
version: v1.49.977
date: 2026-06-05
summary: >
  Ship 3.1 of the 2026-06-03 audit plan. The adoption scanner read import-surface
  only — who-imports-whom — so the MA/MB/MD control-theory island read "partially
  living" despite being unreachable from any shipped entry point. This adds a
  stricter, additive reachability dimension that distinguishes "imported-by-non-test"
  from "reachable-from-a-production-entry-point", and reclassifies lyapunov/projection.
tags: [feat, adoption, shelfware, reachability, ship-3.1]
---

# v1.49.977 — reachability-aware adoption scanner

**Shipped:** 2026-06-05

`tools/adoption-scan.mjs` gains a second, stricter dimension — a per-module
`reachableFromProduction` boolean computed by a file-level static-import walk from
the project's declared shipped entry points — so a module can be flagged `living` by
import-surface yet `unreachable-from-production`.

## Why this ship

Ship 3.1 of the 2026-06-03 core-functions audit plan (Phase 3, substrate
disposition). The audit found the scanner measured import-surface only and so the
control-theory island (`ace`, `lyapunov`, `projection`, + 5 test-only members) read
"partially living" even though no shipped entry point reaches it — `lyapunov` and
`projection` are `living` purely because *other island members* import them. The
accept criterion: distinguish "imported-by-non-test" from
"reachable-from-a-production-entry-point", and have the island report unreachable.
A 4-agent read-only recon confirmed all three plan premises; the implementation's
file-level BFS then surfaced one genuine refinement the recon's manual trace missed
(see the retrospective): `ace`, the island sink, *is* statically reachable via the
production M5 selector.

## What shipped

- **New `reachableFromProduction` field** on every `ModuleAdoptionRecord` — additive;
  all existing baseline fields and consumers (`adoption-trends`, `adoption-refresh`,
  `adoption-baseline-freshness`) are preserved.
- **File-level reachability BFS** from declared production roots: the npm `bin`/`main`
  entries (`src/cli.ts`, `src/index.ts`), the two registered Claude Code hooks
  (`src/hooks/session-{start,end}.ts`), and the `src/` frontier imported by the
  shipped desktop/Tauri app (`desktop/`, `src-tauri/`). Dev/CI tooling (`tools/`,
  `scripts/`) is intentionally **not** a production root.
- **Computed at FILE granularity, lifted to modules** — a module is reachable iff ≥1
  of its non-test files is reachable. Module-level reachability would over-report
  (`orchestration` is reachable AND imports `ace`, but its reachable files do not).
  `resolveToFile()` does `.js`→source + index resolution; dynamic `import()`
  string-literal edges are followed (the CLI dispatcher uses them).
- **Generated baseline `.md`** gains a reachability summary line and a "Living but
  unreachable from production" section. The dimension does **not** feed
  `--shelfware-threshold` (which stays import-surface), so it cannot trip the gate.
- **Verdict (verified against live code):** 7/8 island modules report
  `reachableFromProduction:false` (`lyapunov`/`projection` are the headline
  reclassify); `ace` (the sink) reports `true` — its sole non-island edge is a static
  value-import from the production M5 selector `orchestration/selector.ts` (the
  flag-off byte-identical guarantee is *runtime*, via the `aceSignal !== null` guard,
  not static). Pinning the truth keeps the static scanner honest.
- **Surfaced for Ship 3.2:** 16 non-allowlisted `living`-but-unreachable modules are
  the genuine reachability-only shelfware candidates the import-surface dimension
  missed — the triage input for Ship 3.2 (not verdicted here).

## Verification

- Full suite **35975 passed** (pre-tag-gate step 2); tools-suite **849 passed** incl.
  6 new hermetic reachability units (T17–T22). Integration drift-guard runs the
  scanner live and pins the island verdict (ordering-independent of the baseline
  refresh). `tsc --noEmit` clean.
- **pre-tag-gate all 20 PASS**; CI green on origin/dev at `a3282ebf7`.
- **step P** adversarial ship review (5 lenses, 8 agents): 0 genuine findings — the
  one MAJOR was a verified false positive (the reviewer checked only the root
  `vitest.config.ts` and missed that `adoption-scan.test.mjs` runs in the
  `vitest.tools.config.mjs` tools-suite gate step; confirmed empirically + by the
  review's own contradicting rejected finding).
- No new gate step — the drift-guards live in existing suites, so the gate
  denominator stays 20.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** · manifest **152** — all
unchanged (forward audit-plan ship; reachability nuances recorded in
`docs/SHELFWARE-VERDICTS.md` + `docs/learning-substrate-parked.md`, not promoted to a
manifest lesson). `cadence_advances`: none.
