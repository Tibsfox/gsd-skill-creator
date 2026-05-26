> Following v1.49.786 — _Adoption Telemetry: Module-Usage Scanner_, v1.49.787 ships as Dashboard + Automation + Allowlist (T1.2 ship 2 of 2-3).

# v1.49.787 — Adoption Telemetry ship 2/N

**Shipped:** 2026-05-26

A ~2-3h ship completing the Tier 1 T1.2 surface started in v786. Adds the dashboard widget, the refresh orchestrator that automates the scan + diff + render workflow, the operator-curated allowlist for intentionally isolated modules, and a pipe-flush bugfix surfaced by the 168KB JSON output.

## What shipped

- **`tools/adoption-scan.allowlist.json`** — 10 modules allowlisted with explicit reasons (test fixtures, content clusters, CLI-only-consumed, legacy under triage). Schema includes `module`, `reason`, `addedAt`, `addedBy` per entry.
- **`tools/adoption-scan.mjs`** extended — loads allowlist (override path via `--allowlist`, disable via `--no-allowlist`); every record now reports `allowlisted: bool` + `allowlistReason: string|null`; `--shelfware-threshold` excludes allowlisted modules; markdown report separates "Shelfware candidates" from "Allowlisted" within the isolated section; new `exitWhenDrained()` helper waits for stdout/stderr flush before `process.exit()` (fixes 64KB pipe-buffer truncation).
- **`tools/render-adoption-dashboard.mjs`** (233 lines) — generates `dashboard/adoption.html` from JSON. Inline CSS matching GSD design tokens (--bg, --panel, --border, --link). Summary cards (total / living / test-only / isolated / allowlisted / shelfware-non-allowlisted), sortable module table sorted by shelfware-risk-first. Reads stdin OR `--in` path; writes to `--out` path (default `dashboard/adoption.html`).
- **`tools/adoption-refresh.mjs`** (215 lines) — orchestrator: runs scan in JSON + markdown modes, looks up most recent prior `.json` snapshot in `docs/`, computes diff (new/removed/status-change/caller-count-change), formats diff to stderr, writes baseline markdown + JSON + renders dashboard. `--dry-run`, `--no-dashboard`, `--version`, `--in`, `--out` flags.
- **Tests** — `tools/__tests__/adoption-scan.test.mjs` extended 11 → 16 (T12-T15 allowlist, T16 large-output regression). New `tools/__tests__/adoption-refresh.test.mjs` (8 tests covering first-run, dry-run, no-dashboard, diff-detection, fluctuation-suppression, no-changes, new-modules, removed-modules).
- **`docs/ADOPTION-BASELINE-v1.49.787.md` + `.json`** — refreshed baseline with allowlist sections cleanly separated. The `.json` becomes the source for v788+ diff comparison.

## Through-line

This ship completes the audit's T1.2 ask of "make adoption observable in `dashboard/`" by closing the gap between the scanner (v786) and the operator surfaces (here). Two layers added: machine-readable allowlist that captures operator judgment, and an automation surface that turns the scan from a manual two-step into a one-command flow.

The shelfware-threshold gate now has a meaningful default. With the allowlist active, `npm run adoption-report --shelfware-threshold 1` will exit-1 only on **non-allowlisted modules with zero real callers** — currently 0 (all 10 isolated are allowlisted). This is the working definition of "shelfware that should be looked at" — anything that becomes isolated AND wasn't pre-declared as intentionally so.

## Verification

- `npm run adoption-report` → produces markdown, exit 0
- `npm run adoption-report:refresh` → produces .md + .json + dashboard, exit 0
- `npm run adoption-report:dashboard` → produces dashboard only
- `npm run adoption-report --shelfware-threshold 1` → exit 0 (no non-allowlisted shelfware)
- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/adoption-scan.test.mjs tools/__tests__/adoption-refresh.test.mjs` → 24/24 PASS
- `bash tools/pre-tag-gate.sh` → 17/17 PASS

## Engine state

NASA degree sustains at **1.177** — **11 consecutive ships at this level** (v777-v787). The plateau widens by one each Tier 1 ship; operator has consistently chosen to continue Tier 1 over relieving NASA forward-cadence.

## Audit roadmap status

This is **Tier 1 ship 3/N** (cumulative: v785 PROJECT.md normalizer + v786 module-scanner + v787 dashboard/automation/allowlist). T1.2 ship 2 of 2-3 delivered. Next queued: T1.2 ship 3/3 (first shelfware verdict — pick a striking test-only module from the Era D substrate and either wire it into a real call site OR formally retire it). Then T1.1 (bounded-learning calibration loop) and T1.3 (College of Knowledge consumer engine).
