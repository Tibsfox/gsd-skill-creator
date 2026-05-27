> Following v1.49.812 — _First ProcessContext Chip: intelligence/analyzer/git.ts_, v1.49.813 closes the v805→v806 STATE.md drift class that v807 only partially addressed (informationally via a post-write check). v813 ships the deterministic closure: `tools/state-md-set-shipped.mjs` — an atomic writer that emits a fully-normalized STATE.md from milestone metadata, replacing the hand-edit-then-normalize sequence that was the original drift source.

# v1.49.813 — Post-T14-reset STATE.md Drift Closure: Atomic Writer Tool

**Shipped:** 2026-05-27
**Counter-cadence:** true

Counter-cadence ship converting the hand-edit-and-normalize post-T14 procedure into a deterministic single-command tool invocation. Closes the v805→v806 drift class structurally: replaces the operator-discretion procedure ("hand-write STATE.md, remember to run normalizer, remember to run --check") with one atomic tool that does all three with one CLI call.

Per the v810-814 chain handoff: "Complete closure would require running the normalizer at the END of T14's reset step, not just at the START of the next pre-tag-gate." This ship is the END-of-T14 normalizer integration.

## What shipped

- **NEW** `tools/state-md-set-shipped.mjs` — atomic STATE.md writer for post-T14 shipped-state reset. CLI: `--version v<X> --name "<subtitle>" --degree <NASA-degree> --predecessor v<PRED> --predecessor-sha <SHA> [--counter-cadence] [--predecessor-counter-cadence] [--check]`. Writes a fully-normalized STATE.md from milestone metadata; runs `state-md-normalizer --write` + `--check` post-write to confirm canonical form. Exit 0 = STATE.md written + normalize-check PASS. Idempotent.
- **NEW** `tools/__tests__/state-md-set-shipped.test.mjs` — 7 tests covering the content-builder (canonical schema fields + idempotency + version-strip), CLI arg validation (missing --version, bad semver, non-hex SHA), and end-to-end write + check in a tmpdir-isolated mini-repo.
- **MODIFIED** `vitest.tools.config.mjs` — adds the new test file to the tools test suite.
- **MODIFIED** `docs/T14-SHIP-SEQUENCE.md` — adds step 11.5 documenting the new atomic-writer tool as the replacement for the prior hand-edit + manual normalize flow. References the v807 step-0.5 post-write check as the regression detector and this ship as the deterministic source closure.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| state-md-set-shipped | +7 | content-builder + CLI arg validation + e2e write-check |
| **Total added** | **+7** | 35,194 → 35,201 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 31 consecutive ships at 1.178). Counter-cadence count **5 → 6** (this is a counter-cadence ship).

Manifest entries: **20 → 20** (UNCHANGED — this ship deterministically closes a discipline already in the manifest via Failure-mode contracts #10427 + ship-pipeline discipline; no new discipline introduced).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Drift-class closure: v805 → v806 → v807 → v813

| Ship | Coverage |
|---|---|
| v805 → v806 | Drift introduced (hand-edit STATE.md after T14 without normalize). Caught at v806 pre-tag-gate. |
| v807 (S5 partial) | Added pre-tag-gate step 0.5 post-write check (regression detector after the fact). |
| **v813 (this ship)** | **Replaced hand-edit flow with atomic-writer tool. Deterministic closure at source.** |

The wedge is now closed in two layers: the source (this ship's tool) eliminates the drift origin; the detector (v807's check) catches if a future operator bypasses the tool.

## Forward path

- **Codification audit** (overdue per #10428) — promote 8 tentative observations to lesson-candidate status as warranted.
- **Batch chip aminet family** — 5 ProcessContext callers; same shape as v812.
- **NASA 1.179** — 31 consecutive at 1.178; still the most visible open item.
