> Following v1.49.828 — _Batch Chip: scribe/netlist-renderer Family ProcessContext_, v1.49.829 closes the T1.3 GAP-2 application-boundary wire branch by adding an integration test at `tests/integration/college-observation-bridge-wire.integration.test.ts` that demonstrates the cross-rootdir flow: `src/dashboard` SessionEvent → translateSessionEvent (with `SkillActivationObserver`) → `.college/integration` ObservationBridge → buffered events → SessionObservation. Third ship of the v827-833 chain.

# v1.49.829 — T1.3 Application-Boundary Wire (ObservationBridge ↔ translateSessionEvent Cross-Rootdir Integration Test)

**Shipped:** 2026-05-27

Closes the v823 + v826 application-boundary wire by adding the missing piece: a `tests/integration/` test that lives OUTSIDE both rootdirs (src/ + .college/) and instantiates BOTH sides together, proving the duck-typed `SkillActivationObserver` interface contract carries the runtime payload end-to-end across the rootdir boundary.

## Why this ship

The v823 ship declared `SkillActivationObserver` in `src/dashboard/activity-tab-toggle.ts` and made `ObservationBridge` in `.college/integration/observation-bridge.ts` structurally satisfy it. But the two were never instantiated together — each lives in its own rootdir, and neither tsconfig can see the other. The v823 + v826 tests used mock observers; no test ever pumped events through a real `ObservationBridge` via `translateSessionEvent`.

v829 fills that gap with an integration test at `tests/integration/` (which has visibility into both rootdirs per vitest's `integration` project config). The test proves:

1. `ObservationBridge` is assignable to `SkillActivationObserver` at compile time (TS structural type check).
2. Routing a `skill-activate` `SessionEvent` through `translateSessionEvent(event, bridge)` causes the bridge to record a `CollegeObservationEvent` with `type: 'skill-activation'`, `conceptId: <skillName>`, `sessionId: <entityId>`.
3. Non-skill-activate events do NOT route into the bridge.
4. A batch of skill-activation events can be converted to a `SessionObservationCompat` via `bridge.toSessionObservation()`, complete with `topTools: ['skill-activate']`.
5. Bridge listeners receive routed events in order.

This is the "production caller" piece T1.3 needed — there are still zero src/ production callers of `translateSessionEvent`, but the integration test now proves the wire WORKS at runtime when a caller exists.

## What shipped

- **NEW** `tests/integration/college-observation-bridge-wire.integration.test.ts` (~110 LOC, 5 tests):
  - `ObservationBridge structurally satisfies SkillActivationObserver` — compile-time + runtime duck-type check.
  - `routes a skill-activate SessionEvent through translateSessionEvent into ObservationBridge` — happy path.
  - `does NOT route non-skill-activate events into the bridge` — negative coverage (agent-start, plan-complete, skill-deactivate).
  - `produces a SessionObservation from buffered skill-activation events` — end-to-end batch conversion.
  - `routes events through a listener registered on the bridge` — listener observability.

No src/ or .college/ source files modified — the wire scaffolding already existed at v823. v829 is the application-boundary integration test that completes the wire's verification.

- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v828 → v829.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/integration/college-observation-bridge-wire.integration.test.ts` | 5 | NEW |
| Full suite | 35,213+ | +5 net |
| **LOC delta** | ~110 | 1 new test file |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **47 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: 1 NEW at 2-instance threshold: **cross-rootdir wire pattern** (v823 declared the interface + v829 proved the wire — meets #10426 codification threshold).
Wired calibratable thresholds: **5 of 6** (UNCHANGED).
KNOWN_UNWIRED Process: **22** (UNCHANGED — this ship is not a chokepoint chip).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## What this ship is not

- Not a NASA degree advance.
- Not a codification (no new lessons promoted).
- Not a ProcessContext chokepoint chip.
- Not a new audit-test introduction.
- Not a src/ production caller of `translateSessionEvent` (still zero — the test demonstrates the wire works WHEN one exists).

## Verification

- `npm run build` → clean.
- `npx vitest run --project integration tests/integration/college-observation-bridge-wire.integration.test.ts` → 5 PASS / 0 fail.
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling).

## T1.3 GAP-2 status after v829

| Branch | Status |
|---|---|
| Option A (gnn-predictor wire into skill activation) | CLOSED v810 (copper) + v826 (selector) |
| Option B Ship 2 (ObservationBridge interface declaration) | CLOSED v823 |
| Option B Ship 3 (onPredictions hook at 2nd production caller) | CLOSED v826 |
| **Option B application-boundary wire (cross-rootdir integration test)** | **CLOSED v829 (this ship)** |
| Option C (RosettaEngine confidence-bound fallback) | OPEN — next 2-3 ships in chain (v830-832) |

After v829, T1.3 GAP-2 has 4 of 5 branches CLOSED. Option C remains.

## Forward path post-v829 (chain continues)

1. **v830-832** — T1.3 Option C (RosettaEngine confidence-bound fallback; 2-3 ships). Wire `RosettaEngine.translate()` into a confidence-bounded fallback at a skill-activation call site.
2. **v833** — Codify ship for onPredictions wire pattern + cross-rootdir wire pattern (both now at 2-instance threshold).

After chain closes, NASA 1.179 remains the strong-default per v826 handoff (now **47 consecutive ships at 1.178**).
