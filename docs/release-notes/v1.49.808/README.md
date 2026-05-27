> Following v1.49.807 — _S5 Normalizer Gate Idempotency + PROJECT.md Drift Cap_, v1.49.808 closes S2: the last open lever from the 2026-05-26 audit retrospective. Adds `tools/adoption-trends.mjs`, an operator-facing trend report consuming the 14+ existing per-version `ADOPTION-BASELINE-v*.json` snapshots — surfaces status transitions, persistent shelfware, and the new-module first-real-caller watch.

# v1.49.808 — S2 Adoption Telemetry Trend Report

**Shipped:** 2026-05-27

Closes the last open lever from the 2026-05-26 core-functions audit retrospective. After this ship, **0 levers remain open** from the audit retrospective.

## What shipped

- **NEW** `tools/adoption-trends.mjs` (~250 LOC) — multi-snapshot trend report. Reads every `docs/ADOPTION-BASELINE-v*.json` file, sorts by version, builds per-module timelines, emits four sections: population summary, status changes, persistent shelfware watch, new-module watch. CLI flags: `--write` (default), `--check` (drift detector), `--since=vX.Y.Z` (snapshot filter).
- **NEW** `tools/__tests__/adoption-trends.test.mjs` — 8 vitest tests (spawnSync against tmpdir fixtures per #10417). Covers: status-change detection, shelfware threshold, allowlist exclusion, new-module watch window, --check exits, --since filter, idempotency, empty-baseline error path.
- **NEW** `docs/ADOPTION-TRENDS.md` — initial commit of the trends report against the existing 14 baselines (v787 → v801). Surfaces 5 adoption wins (semantic-channel, koopman-memory, coherent-functors, hourglass-persistence, bounded-learning) and 45 persistent-shelfware modules (≥6 consecutive non-living snapshots).
- **MODIFIED** `vitest.tools.config.mjs` — registers the new test file.
- **MODIFIED** `package.json` — adds two npm scripts: `adoption-report:trends` (regenerate) and `adoption-report:trends:check` (drift check).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| adoption-trends unit tests | +8 | tmpdir-fixture-based; spawnSync invocation; deterministic |
| **Total added** | **+8** | 35,172 → 35,180 in the full suite |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 26 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED — adoption telemetry is an existing discipline that this ship extends with a new derived artifact; no new manifest entry).

Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Lever closure

After v808, every lever from the 2026-05-26 audit retrospective is closed:

| Lever | Status |
|---|---|
| S1 (calibration ledger) | Promoted at v790 (#10417) |
| **S2 (adoption telemetry weekly report)** | **CLOSED v808** |
| S3 (meta-cadence) | Promoted at v805 (#10428) |
| S4 (substrate opt-in paths) | Promoted at v805 (#10429) |
| S5 (PROJECT.md + STATE.md gates) | Closed v807 |
| S6 (chokepoint extension) | Closed v806 |
| S7 (finer-grained counter-cadence) | Promoted at v805 (#10430) |

**Audit retrospective FULLY CLOSED at v808.** The chain v790 → v805 → v806 → v807 → v808 represents systematic closure of every lever from the 2026-05-26 retrospective.

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3 (26 consecutive ships at 1.178; most visible open item).
- **`KNOWN_UNWIRED` migration cadence** — 16 egress + 38 process callers tracked since v806; natural 5-1-1 alternation partner per #10430.
- **T1.3 (College of Knowledge consumer engine)** — major remaining Tier 1; recon-only next slot.
- **45 persistent-shelfware modules** now surfaced by `docs/ADOPTION-TRENDS.md` — operator can chip these down via wire/allowlist/retire decisions over future ships.
