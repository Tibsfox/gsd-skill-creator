# v1.49.787 — Adoption Telemetry: Dashboard + Automation + Allowlist

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven Tier 1 ship 3/N (NOT a NASA degree advance)
**Predecessor:** v1.49.786 — Adoption Telemetry: Module-Usage Scanner
**Engine state:** UNCHANGED (NASA degree sustains at 1.177 — **11 consecutive ships at this level**, v777-v787)
**Wedge:** AUDIT-2026-05-26 Tier 1 T1.2 ship 2/2-3 (~2-3h)

## Summary

Completes the adoption telemetry surface started in v1.49.786:

1. **Allowlist** (`tools/adoption-scan.allowlist.json`) — operator-curated exemption list for modules that are intentionally isolated/test-only. 10 modules allowlisted from the v786 baseline: `dogfood`, `holomorphic`, `initialization`, `interpreter`, `mathematical-foundations`, `retro`, `settings`, `styles`, `upstream`, `upstream-intelligence`. Each entry includes a reason. Allowlisted modules still appear in reports (with `allowlisted: true`) but don't trigger `--shelfware-threshold`.
2. **Dashboard widget** (`dashboard/adoption.html`, gitignored) — self-contained static HTML with summary cards, sortable module table, status badges. Rendered by `tools/render-adoption-dashboard.mjs`. ~1,300 lines including inline CSS. No external deps.
3. **Refresh orchestrator** (`tools/adoption-refresh.mjs`) — single-command scan + diff + baseline-write + dashboard-render. Detects status-change diffs vs prior `.json` snapshot (new modules, removed modules, status flips, ±2 caller-count changes). Suppresses ±1 caller-count noise.
4. **Pipe-flush fix** in `tools/adoption-scan.mjs` — `process.exit()` was truncating stdout at the 64KB pipe-buffer boundary. New `exitWhenDrained()` helper waits for stdout/stderr to flush before exit. Surfaced by 168KB JSON output piped to next command.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `tools/adoption-scan.allowlist.json` | NEW | 10 allowlisted modules |
| `tools/adoption-scan.mjs` | MODIFIED | +50 lines: allowlist loading, allowlist fields on records, exitWhenDrained helper |
| `tools/render-adoption-dashboard.mjs` | NEW | 233 lines |
| `tools/adoption-refresh.mjs` | NEW | 215 lines |
| `tools/__tests__/adoption-scan.test.mjs` | MODIFIED | 11 → 16 tests (+5 allowlist + drain) |
| `tools/__tests__/adoption-refresh.test.mjs` | NEW | 8 tests |
| `vitest.tools.config.mjs` | MODIFIED | +1 test entry |
| `package.json` | MODIFIED | +2 npm scripts (`adoption-report:refresh`, `adoption-report:dashboard`) |
| `docs/ADOPTION-BASELINE-v1.49.787.md` | NEW | 180-line refreshed baseline (includes allowlist sections) |
| `docs/ADOPTION-BASELINE-v1.49.787.json` | NEW | JSON snapshot for v788+ diff comparison |

## Key behavior change vs v786

**Allowlist activates.** The 10 isolated modules previously reported as "shelfware candidates" are now correctly classified as "intentionally isolated." This is the same data — the operator's interpretation just became machine-readable. The shelfware-threshold gate now only triggers on non-allowlisted modules; the dashboard separates allowlisted entries with reduced opacity.

**Diff capability becomes available v788 onward.** This is the first refresh that writes the `.json` snapshot; v786 baseline was markdown-only. Starting v788, every `npm run adoption-report:refresh` produces a diff against the v787 baseline showing status changes, new/removed modules, and ≥2-caller fluctuations.

## NPM scripts

```bash
# View current adoption state (markdown)
npm run adoption-report

# Same, but JSON for tooling
npm run adoption-report:json

# Refresh baseline + render dashboard + show diff vs prior snapshot
npm run adoption-report:refresh

# Quick dashboard re-render only
npm run adoption-report:dashboard
```

## Tier 1 audit progress

| Item | Ships | Status |
|---|---|---|
| T1.4 + S5 — PROJECT.md normalizer + GAP refresh | 1 | ✅ v1.49.785 |
| T1.2 ship 1/2-3 — Module-usage scanner | 1 | ✅ v1.49.786 |
| **T1.2 ship 2/2-3 — Dashboard + automation + allowlist** | 1 | **✅ this ship** |
| T1.2 ship 3/2-3 — First shelfware verdict (pick + remediate one) | 1 | Queued |
| T1.1 — Bounded-learning calibration loop | 4-6 | Queued |
| T1.3 — College of Knowledge consumer engine | 3-5 | Queued |

## Counter-cadence accounting

**11 consecutive non-engine-state ships** (v777-v787). The audit's recommendation to lift NASA forward-cadence before continuing Tier 1 has been deferred at each of v785, v786, v787. Each ship had defensible scope but the aggregate plateau is increasingly anomalous.

## Engine state

NASA degree sustains at **1.177**. No advance this ship.
