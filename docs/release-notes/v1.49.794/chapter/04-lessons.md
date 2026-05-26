# 04 — Lessons Learned: v1.49.794 Deterministic Gate for #10424

## 0 candidates emitted; 1 promoted to ESTABLISHED

v794 closes the lone open lesson candidate (#10424) carried forward from v791 by simultaneously installing the deterministic gate AND promoting the candidate to ESTABLISHED in the static-analysis-tool-discipline domain. No new candidates surface.

## Formal ID promoted at this ship

| ID | Domain | Source | Path closed |
|---|---|---|---|
| **#10424** | Static-analysis tool authoring | v791 (adoption-refresh ran before bump-version, overwrote v790 committed baseline; recovered via `git checkout HEAD -- docs/ADOPTION-BASELINE-v1.49.790.*`) | Refuse-to-overwrite guard in `tools/adoption-refresh.mjs` + `--force` escape hatch + meta-principle paragraph in `docs/static-analysis-tool-discipline.md` |

## The lesson, formal statement

**#10424 — Version-stamped baseline writers refuse to overwrite existing files whose content would differ, unless `--force`.**

A tool that writes `docs/<TOOL>-BASELINE-v${PACKAGE_VERSION}.{md,json}` embeds the current `package.json.version` in the filename. If the tool runs BEFORE `bump-version`, the filename resolves to the PREDECESSOR'S version and the predecessor's committed baseline gets overwritten in-place. The trip is silent: no error, no warning, the working tree diverges from `HEAD` for a file the operator did not intend to touch.

The gate checks: if `BASELINE_JSON` exists on disk AND its content differs from what we'd write, refuse with `exit 3` + corrective message ("Did you forget to run `bump-version` first?"). `--force` overrides; `--dry-run` skips. First-run writes and idempotent re-runs are unaffected.

## Meta-principle codified alongside

**Migrate prose-in-handoff sequencing warnings to deterministic gates after 1 trip + 2-3 sequential clean applications under vigilance.**

The vigilance ledger is finite. A prose warning that has tripped once and held 2-3 ships is exactly the point where:

1. The cost of installing the gate (~30 min) is on par with one vigilance lapse + recovery.
2. The trip is still fresh in operator memory (signal is strong).
3. The pattern of "this rule MUST run AFTER that step" has been validated as a hard constraint by both the trip AND the clean applications.

Beyond ship 3-4, prose warnings decay faster than vigilance can compensate. v794 closes #10424 at the right point in the decay curve. The general principle is now documented in `docs/static-analysis-tool-discipline.md` § "Refuse to overwrite version-stamped baseline files".

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 7th consecutive application since v784. Read tool source + test file + T14 sequence doc + v790 codification template + discipline doc BEFORE writing any gate code. Caught the `vitest.tools.config.mjs` test-config detail (the root config does NOT include `tools/__tests__/*.mjs`) before the first test run.
- **#10415 (Deferred-maintenance escalation)** — applied: #10424 closed at milestone-3 from emit (v791 emit → v794 close). Within the "1-2 milestones" target window; the v793 handoff explicitly nominated Path E for closure, so the lesson aged at the upper bound of acceptable but inside it.
- **#10417 (Test harnesses use `spawnSync`)** — applied prophylactically. The existing adoption-refresh test harness already uses `spawnSync`; new T9-T11 tests inherit it.
- **#10423-analog (Lightest wire)** — applied to gate authoring (not verdict authoring): single-function single-file gate, no cross-module plumbing, no new dependencies.

## Cross-discipline observation: gate-and-promote in one ship

The v790 codification ship promoted 7 candidates simultaneously after the backlog crossed threshold. v794 demonstrates the smaller form: 1 candidate, ripe via the "1 trip + 2-3 sequential clean applications" heuristic, becomes both a formal ID AND a deterministic gate in the same ship. The gate-and-promote shape is likely to repeat as future single-trip candidates accumulate vigilance evidence. Pattern: instead of waiting for batch-codification at 5-8 candidates, single candidates with clean vigilance-hold get closed faster — gate becomes the closure mechanism, not codification waits.

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain — #10424 belongs to existing static-analysis-tool-authoring)
Manifest lessons: 64 → 65 (one new formal ID)
Codified-vs-uncodified gap: 1 → 0 (lesson candidate backlog drained)

## Forward backlog (post-v794)

| ID | Severity | Apply | Source |
|---|---|---|---|
| _(none)_ | — | — | All open candidates closed. |

The lesson candidate backlog is empty for the first time since v789's accumulation phase began. Next codification ship is likely many milestones out.
