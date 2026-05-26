> Following v1.49.785 — _PROJECT.md Normalizer + GAP Table Refresh_, v1.49.786 ships as Adoption Telemetry: Module-Usage Scanner.

# v1.49.786 — Adoption Telemetry ship 1/N

**Shipped:** 2026-05-26

A ~2-3h Tier 1 ship (T1.2 audit strengthening lever, 1 of 2-3 planned). Builds a static-analysis scanner that classifies every `src/<module>/` by its TypeScript-import-surface adoption. The audit's "substrate ships default-off, telemetry can't tell living from shelfware" thesis becomes measurable in this ship.

## What shipped

- **`tools/adoption-scan.mjs`** (297 lines) — scans `src/<module>/` directories + all importer files (under `src/`, `tools/`, `scripts/`, `src-tauri/`, `desktop/`), parses imports + dynamic-imports + re-exports, classifies importers into 5 buckets (self / test / cli / internal / external), emits per-module status (living / test-only / isolated). Output: markdown (default) or JSON (`--json`). Optional `--shelfware-threshold N` for CI gating.
- **`tools/__tests__/adoption-scan.test.mjs`** (11 tests, all pass) — covers living + test-only + isolated classification; CLI importer detection; external importer (tools/) detection; self-import exclusion; JSON output parses; shelfware threshold exit-1; type-only import counting; same-module-multiple-files dedup.
- **`vitest.tools.config.mjs`** — adds the new test file.
- **`package.json`** — adds `adoption-report` + `adoption-report:json` npm scripts.
- **`docs/ADOPTION-BASELINE-v1.49.786.md`** (180 lines) — committed baseline snapshot of every module's adoption state as of v1.49.786. Future ships diff against this; long-tail decay or sudden adoption shows up in the diff.

## Headline finding

**41% of `src/` modules have zero real (non-test) callers.** Of 153 top-level modules:

- 91 (59%) are living — ≥1 non-test importer
- 52 (34%) are test-only — importers exist but all are test files
- 10 (7%) are isolated — zero importers anywhere

The 10 isolated modules: `dogfood` (66 self-files), `holomorphic` (25), `initialization` (1), `interpreter` (6), `mathematical-foundations` (6), `retro` (7), `settings` (1), `styles` (0), `upstream` (14), `upstream-intelligence` (7). Some are content clusters (`holomorphic` is the v1.47 educational pack); others are pure scaffolds awaiting wiring.

## Era D substrate slice

The audit predicted Era D substrate maturation (v1.49.549-v580) would be heavily test-only. **Confirmed: 20 of 33 tracked Era D modules (61%) are test-only.** Includes the irony of `intrinsic-telemetry` itself (the module the audit cited as the natural place for the adoption surface — its own TS API has no real callers, making this ship's wedge the first non-test exercise of its sibling substrate).

Most striking by sub-arc:
- **Math Foundations Refresh (v1.49.572) — 6/6 substrate modules test-only.** Only `ricci-curvature-audit` made it to living.
- **Convergent Substrate (v1.49.570) — 4/5 test-only.**
- **LeJEPA (v1.49.571) — 1/2 substrate modules test-only.**
- **Living Sensoria sub-modules — dead-zone, learnable-k_h, langevin, temperature, stochastic all test-only.**

## Through-line

The audit said the project doesn't yet know which substrate modules are dead-code vs living-code. This ship makes that question answerable in 200ms with `npm run adoption-report`. The scanner doesn't tell us which modules SHOULD be wired up — only which AREN'T. The next two Tier 1 ships (T1.2 ship 2/3 dashboard widget + ship 3/3 first remediation verdict) bridge from data to action.

This is the same shape as the v1.49.785 PROJECT.md normalizer: detect-not-prescribe. The gate exposes the truth; operator decides remediation.

## Verification

- `npm run adoption-report` → produces markdown table, exit 0
- `npm run adoption-report:json` → produces parseable JSON
- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/adoption-scan.test.mjs` → 11/11 PASS
- `bash tools/pre-tag-gate.sh` → 17/17 PASS

## Audit roadmap status

This is **Tier 1 ship 2/N** (ship 1 was v1.49.785 PROJECT.md normalizer). T1.2 ship 1 of 2-3 delivered. Next queued: T1.2 ship 2/3 (dashboard widget + weekly automation), then T1.2 ship 3/3 (first shelfware verdict — pick the most striking Era D test-only module and either wire it into a real call site or formally retire it), then T1.1 (bounded-learning calibration loop, ~4-6 ships).

## Engine state

NASA degree sustains at **1.177** — **10 consecutive ships at this level** (v777-v786). NASA 1.178 forward-cadence is now overdue by ~2 ships beyond the typical handoff threshold; recommend lifting before continuing Tier 1.
