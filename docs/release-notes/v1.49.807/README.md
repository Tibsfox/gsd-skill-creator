> Following v1.49.806 — _S6 Chokepoint Extension_, v1.49.807 closes S5: tightens the STATE.md normalizer pre-tag-gate step into a deterministic regression detector and caps PROJECT.md "Latest shipped" drift at a bounded patch-version threshold. Audit-retrospective lever S5 closed; only S2 (tooling-class) remains open from the 2026-05-26 retrospective.

# v1.49.807 — S5 Normalizer Gate Idempotency + PROJECT.md Drift Cap

**Shipped:** 2026-05-27

Closes audit lever S5 — converts two recurring ship-discipline classes (post-`--write` STATE.md drift; unbounded PROJECT.md `Latest shipped` staleness) into deterministic pre-tag-gate enforcement.

## What shipped

- **MODIFIED** `tools/pre-tag-gate.sh` step 0.5 — adds a post-`--write` `--check` round on `tools/state-md-normalizer.mjs`. If `--check` exits non-zero after a successful `--write`, the gate FAILs with a regression-alarm diagnostic. The historical normalizer non-idempotency was closed in v1.49.783 (commit `e5d0cbc69`); this round is the deterministic detector against any future regression.
- **MODIFIED** `tools/pre-tag-gate.sh` step 17 — adds a bounded patch-drift cap on the `latest-shipped-version-drift` finding. When PROJECT.md's "Latest shipped release" trails package.json by more than `SC_PROJECT_MD_MAX_PATCH_DRIFT` (default 3) patch versions, the WARN escalates to FAIL — forces hand-update at a bounded cadence. Other PROJECT.md drift findings remain WARN-only (preserves the "conservative; no auto-rewrite of prose" stance).
- **UPDATED** `.planning/PROJECT.md` — "Latest shipped release" line reset from v1.49.801 (5-version-stale) to v1.49.806 (current shipped); "Last updated" line refreshed.
- **UPDATED** Operator memory note `feedback_state-md-normalizer-non-idempotent.md` — records the v1.49.783 closure of the non-idempotency wedge; documents the v807 deterministic regression detector; declares the "run --write twice" habit obsolete.
- **NEW** `docs/release-notes/v1.49.807/` — 5-file chapter set.

## Test impact

Bash-only changes — no new vitest tests. The new pre-tag-gate behaviors are detector-shaped (fail-loud on regression), and are verifiable by the existing `tools/pre-tag-gate.test.sh` harness if/when next extended; this ship adds the gate but not the harness coverage (cf. #10422 surface-separation: detector lives in `tools/`, harness extension is a different ship if needed).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 25 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED — this ship adds enforcement to an existing discipline; no new manifest entry).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Lever closure

| Lever | Status |
|---|---|
| S1 (calibration ledger) | Promoted at v790 (#10417) |
| **S2 (adoption telemetry)** | **Tooling-class; OPEN** |
| S3 (meta-cadence) | Promoted at v805 (#10428) |
| S4 (substrate opt-in paths) | Promoted at v805 (#10429) |
| **S5 (PROJECT.md + STATE.md gates)** | **CLOSED v807** |
| S6 (chokepoint extension) | Closed v806 |
| S7 (finer-grained counter-cadence) | Promoted at v805 (#10430) |

After v807: **1 open lever** remaining from the 2026-05-26 audit retrospective (S2, tooling-class).

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3 (25 consecutive ships at 1.178; most visible open item).
- **S2 (adoption telemetry weekly report)** — last open audit lever; tooling-class; needs recon.
- **`KNOWN_UNWIRED` migration cadence** — 16 egress + 38 process callers tracked since v806; natural 5-1-1 alternation partner per #10430.
- **T1.3 (College of Knowledge consumer engine)** — major remaining Tier 1; 3-5 ships; recon needed.
