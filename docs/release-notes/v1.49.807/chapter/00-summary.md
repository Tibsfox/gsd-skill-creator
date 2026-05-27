# v1.49.807 — S5 Normalizer Gate Idempotency + PROJECT.md Drift Cap

**Released:** 2026-05-27
**Type:** tooling ship (pre-tag-gate enforcement tightening; no new substrate)
**Predecessor:** v1.49.806 — S6 Chokepoint Extension (EgressContext + ProcessContext)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** convert two recurring ship-discipline classes — post-`--write` STATE.md drift and unbounded PROJECT.md "Latest shipped" staleness — into deterministic pre-tag-gate gates. Closes audit retrospective lever S5.

## Summary

Tooling ship adding two surgical gates to `tools/pre-tag-gate.sh`. The first is a post-`--write` `--check` round at step 0.5 that makes the STATE.md normalizer's idempotency property load-bearing: any future regression to the historical non-idempotency wedge (closed in v783, commit `e5d0cbc69`) would now FAIL the ship deterministically rather than surface days later in the next milestone's full vitest run. The second is a bounded patch-drift cap at step 17 on the `latest-shipped-version-drift` finding — when PROJECT.md trails package.json by more than `SC_PROJECT_MD_MAX_PATCH_DRIFT` (default 3) patch versions, the existing WARN escalates to FAIL, forcing hand-update at a bounded cadence. Other PROJECT.md drift findings remain WARN-only, preserving the "conservative; no auto-rewrite of hand-authored prose" stance.

Neither gate adds a new normalizer surface; both narrow the failure-detection window on existing surfaces. This is consistent with the v806 takeaway that "discipline-driven bug detection pays off when the disciplines are wired into pre-tag-gate rather than only vitest" — the v806 STATE.md drift catch happened at full-suite vitest run, but only because the operator ran the suite; the v807 step-0.5 enhancement makes the catch deterministic on every ship.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `tools/pre-tag-gate.sh` step 0.5 | MODIFIED | Adds post-`--write` `--check` round. Fail diagnostic explicitly cites the v1.49.783 closure of the historical non-idempotency wedge so a future regression alarm is unambiguous. |
| `tools/pre-tag-gate.sh` step 17 | MODIFIED | Adds bounded patch-drift cap on the `latest-shipped-version-drift` finding. Parses the WARN line's `lists vX.Y.Z but package.json is vX.Y.W` shape, computes `W - Z`, and escalates to FAIL when > `SC_PROJECT_MD_MAX_PATCH_DRIFT` (default 3). Other drift findings unaffected. |
| `.planning/PROJECT.md` | UPDATED | "Latest shipped release" reset from v801 (5-version stale) to v806. "Last updated" line refreshed. Closes the pre-existing step-17 WARN. |
| `memory/feedback_state-md-normalizer-non-idempotent.md` | UPDATED | Records the v783 closure of the non-idempotency wedge. Documents the v807 deterministic regression detector. Declares the "run --write twice" habit obsolete. |
| `docs/release-notes/v1.49.807/` | NEW | 5-file chapter set. |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `tools/pre-tag-gate.sh` step 0.5 + step 17 + `tools/state-md-normalizer.mjs` + `tools/project-md-normalizer.mjs` BEFORE writing the gate. Recon surfaced that: (a) STATE.md normalizer's non-idempotency wedge was already closed (commit `e5d0cbc69`, v783); (b) PROJECT.md normalizer is intentionally check-only (no `--write` mode); (c) the WARN-finding line format is mechanically parseable in bash. |
| #10416 (tolerant generators / lightest wire) | Resisted: adding a `--write` mode to project-md-normalizer (would create stale-desc/date "lying" lines); adding a new vitest test harness for bash gate behavior; rewriting the normalizer's idempotency logic. Chose: a 5-line bash check at step 0.5 and a regex-parsed bash escalator at step 17. |
| #10422 (verdict-pattern surface separation) | Observability (the `--check` round; the patch-drift regex) lives in `tools/pre-tag-gate.sh`. Decision (the threshold value; the escalation policy) lives in the same file but via env-var `SC_PROJECT_MD_MAX_PATCH_DRIFT` — operator override without code change. |
| #10427 (failure-mode contracts) | Both new gates are LOUD-FAIL. The step-0.5 `--check` after `--write` is a regression alarm — silent acceptance would defeat the purpose. The step-17 patch-drift escalator is loud because the existing WARN-only behavior was demonstrably not enough (5-version drift survived 5 ships). |
| #10415 (deferred-maintenance escalation) | The v805→v806 STATE.md drift catch was the alarm. v807 lands the closure within 1 milestone of the alarm — within the "close escalated wedges within 1-2 milestones" target. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not an addition of `--write` mode to project-md-normalizer. The "Latest shipped" line carries a description + date that would go stale when mechanically updated alone, creating a worse "lying line" state. Hand-authored prose stays hand-authored.
- Not a unification of the two normalizer surfaces. STATE.md normalizer is full-rewrite-capable; PROJECT.md normalizer is structural-validator-only. Different shape, different consumer, different policy.
- Not a closure of S2 from the audit retrospective. S2 (adoption telemetry weekly report) remains the last open lever.

## Verification

- `npm run build` → PASS.
- `npx vitest run` → 35,172 PASS (unchanged from v806 — bash-only changes).
- Manual: `node tools/state-md-normalizer.mjs --check` exits 0 against current STATE.md. `node tools/project-md-normalizer.mjs --check` exits 0 against current PROJECT.md (0 BLOCK, 0 WARN after the reset).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 25 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **20 → 20** (UNCHANGED — enforcement tightening on an existing discipline; no new entry).
Open lesson candidate backlog: 0 (UNCHANGED).
Tentative observations carried forward: 8 (UNCHANGED).

## Lever closure

Closes the last codify-class wedge from the 2026-05-26 audit retrospective. After this ship:

| Lever | Status |
|---|---|
| S1 (calibration ledger) | Promoted at v790 (#10417) |
| **S2 (adoption telemetry)** | **Tooling-class; OPEN** |
| S3 (meta-cadence) | Promoted at v805 (#10428) |
| S4 (substrate opt-in paths) | Promoted at v805 (#10429) |
| **S5 (PROJECT.md + STATE.md gates)** | **CLOSED v807** |
| S6 (chokepoint extension) | Closed v806 |
| S7 (finer-grained counter-cadence) | Promoted at v805 (#10430) |

**S2 is the only remaining open lever.**

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3 (25 consecutive ships at 1.178; most visible open item).
- **S2 (adoption telemetry weekly report)** — last open audit lever.
- **`KNOWN_UNWIRED` migration cadence** — 16 egress + 38 process callers since v806; natural 5-1-1 alternation partner per #10430.
- **T1.3 (College of Knowledge consumer engine)** — recon-only next slot.
