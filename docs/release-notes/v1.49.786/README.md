# v1.49.786 — Adoption Telemetry: Module-Usage Scanner

**Released:** 2026-05-26
**Type:** forward-cadence audit-driven Tier 1 ship 2/N (NOT a NASA degree advance)
**Predecessor:** v1.49.785 — PROJECT.md Normalizer + GAP Table Refresh
**Engine state:** UNCHANGED (NASA degree sustains at 1.177 — 10 consecutive ships at this level, v777-v786)
**Wedge:** AUDIT-2026-05-26 Tier 1 T1.2 ship 1/2-3 (~2-3h)

## Summary

Builds a static-analysis scanner that classifies every `src/<module>/` by its import-surface adoption. Surfaces shelfware risk concretely — which substrate modules are imported only by tests, which are isolated entirely, which have real callers.

The audit's prediction (Era D: "first non-test caller is seeded ~6 ships after substrate ships") is now measurable. The first run confirms the prediction at industrial scale:

| Status | Count | % of 153 modules |
|---|---|---|
| **living** (≥1 real caller) | 91 | 59% |
| **test-only** (only test imports) | 52 | 34% |
| **isolated** (zero importers) | 10 | 7% |

**41% of `src/` modules have zero real callers.** The committed baseline at [`docs/ADOPTION-BASELINE-v1.49.786.md`](../../ADOPTION-BASELINE-v1.49.786.md) lists every module by status. Future scans diff against this.

## Era D substrate slice

Most striking finding — Era D substrate maturation (v549-v580) is heavily test-only. Of 33 tracked Era D modules:

- **Living (13):** ace, anytime-valid, bayes-ab, lyapunov, model-affinity, orchestration, projection, ricci-curvature-audit, sensoria, skill-isotropy, skill-promotion, symbiosis, umwelt
- **Test-only (20):** bounded-learning, bounded-learning-empirical, coherent-functors, compression-spectrum, convergent, dead-zone, hourglass-persistence, **intrinsic-telemetry**, koopman-memory, langevin, learnable-k_h, mcp-defense, mission-world-model, reasoning-graphs, semantic-channel, sigreg, stochastic, temperature, tonnetz, wasserstein-hebbian

Notably:
- **`intrinsic-telemetry` itself is test-only.** The module the audit cited as the natural place to "wire adoption surface" has no real callers — making this ship's wedge the literal first non-test exercise of the substrate it's tracking.
- **Math Foundations Refresh (v1.49.572) — 6/6 test-only:** coherent-functors, semantic-channel, koopman-memory, hourglass-persistence, wasserstein-hebbian, tonnetz. All 7 modules shipped; only `ricci-curvature-audit` has a real caller.
- **Convergent Substrate (v1.49.570) — 4/5 test-only.**
- **LeJEPA (v1.49.571) — 1/2 substrate modules test-only** (sigreg test-only; skill-isotropy living).

This is the data the audit said we needed. It does not condemn the substrate — many of these modules ship default-off behind feature flags and are correctly dormant in production. But it makes the dormant-vs-active question observable for the first time.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `tools/adoption-scan.mjs` | NEW | 297 lines |
| `tools/__tests__/adoption-scan.test.mjs` | NEW | 11 tests, all PASS |
| `vitest.tools.config.mjs` | MODIFIED | +1 test entry |
| `package.json` | MODIFIED | +2 npm scripts (`adoption-report`, `adoption-report:json`) |
| `docs/ADOPTION-BASELINE-v1.49.786.md` | NEW | 180 lines; full per-module table for v786 |

## What the scan measures

**TypeScript-import-surface adoption.** A module is "living" if ≥1 non-test TS file (in `src/`, `tools/`, `scripts/`, `src-tauri/`, or `desktop/`) imports it. Modules invoked only via npm-scripts or shell-spawn (e.g., `node tools/foo.mjs <module-arg>`) will show as test-only — their CLI binary may still be in use even when their TS API surface is dormant. The baseline explicitly notes this in its header.

Five importer classifications:
- **self** — file under the same `src/<module>/` (excluded from adoption count)
- **test** — `*.test.ts` or under `__tests__/`
- **cli** — `src/cli.ts` or under `src/cli/`
- **internal** — under some other `src/<other-module>/`
- **external** — under `tools/`, `scripts/`, `src-tauri/`, or `desktop/`

Status verdicts:
- **living** — ≥1 real caller (internal OR cli OR external)
- **test-only** — importers exist but all are test files
- **isolated** — zero importers anywhere

## Tier 1 audit progress

| Item | Ships | Status |
|---|---|---|
| T1.4 + S5 — PROJECT.md normalizer + GAP refresh | 1 | ✅ v1.49.785 |
| **T1.2 — Adoption telemetry: module-usage scanner** | 1/2-3 | **✅ this ship** |
| T1.2 — Adoption telemetry: dashboard widget + automation | 2/2-3 | Queued v1.49.787 |
| T1.2 — Adoption telemetry: first shelfware verdict + remediation | 3/2-3 | Queued v1.49.788 |
| T1.1 — Bounded-learning calibration loop | 4-6 | Queued |
| T1.3 — College of Knowledge consumer engine | 3-5 | Queued |

## Engine state

NASA degree sustains at **1.177** — **10 consecutive ships at this level** (v777-v786). The plateau widens by one each Tier 1 ship; operator chose this path despite the audit recommending NASA 1.178 first.

## Counter-cadence accounting

10th consecutive non-engine-state ship. Cadence overdue marker per Lesson #10168: counter-cadence pattern productive every ~30 forward milestones. This is audit-driven work, not classical counter-cadence (which is operational-debt cleanup); engine-state advance remains the natural relief valve.
