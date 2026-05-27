# v1.49.823 — T1.3 Ship 2: ObservationBridge Wire (Cross-Rootdir Interface Pattern)

**Released:** 2026-05-27
**Type:** T1.3 substrate-to-consumer wire (interface + implementation across rootdir boundary)
**Predecessor:** v1.49.822 — T2.2 Part 2: Discipline-coverage Gate Default-BLOCK Flip
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** v784 audit's T1.3 GAP-2 (substrate built; consumer engine not wired). The recon at `.planning/T1.3-RECON-2026-05-27.md` flagged 3 options; v823 implements Option B (ObservationBridge wire) via interface-in-src + implementation-in-college, respecting the rootdir boundary.

## Summary

Final ship of the v816-822 chain (item #7 of 7). Establishes the first structural wire between src/dashboard and .college/integration. The wire is split across the rootdir boundary:

- **Interface declared in src/**: `SkillActivationObserver` in `src/dashboard/activity-tab-toggle.ts`. Shape: `{ onSkillActivate(skillName, sessionId): void }`.
- **Implementation in .college/**: `ObservationBridge.onSkillActivate(name, sessionId)` method that emits a `CollegeObservationEvent` with type `'skill-activation'`.
- **`translateSessionEvent`** accepts an optional observer; calls it on skill-activate events.

The structural-duck-type pattern means src/ doesn't need to import from .college/ (tsconfig rootdir respect), and .college/ doesn't need to import from src/ (the interface is the contract; the implementation is verified against it via the structural-satisfaction test).

The actual runtime wire is set up at the application boundary (src-tauri/, integration tests, or wherever both rootdirs are visible). v823 establishes the SHAPE and verifies it via tests; future ships can wire at the application boundary as needed.

## What changed

`src/dashboard/activity-tab-toggle.ts`:
- Add `SkillActivationObserver` interface declaration (8-line doc + 3-line interface).
- Modify `translateSessionEvent(event)` signature → `translateSessionEvent(event, observer?: SkillActivationObserver)`.
- Inside the function: if `observer && event.type === 'skill-activate'`, call `observer.onSkillActivate(event.entityName, event.entityId)` BEFORE constructing the FeedEntry.
- FeedEntry construction unchanged; same shape returned.

`.college/integration/observation-bridge.ts`:
- Extend `CollegeObservationEvent.type` union: add `'skill-activation'`.
- Add `sessionId?: string` optional field to `CollegeObservationEvent`.
- Add `onSkillActivate(skillName, sessionId): CollegeObservationEvent` method on `ObservationBridge` (15 lines including doc).
- Update `toSessionObservation`'s tool-set: when event.type === 'skill-activation', add `'skill-activate'` to topTools.

`src/dashboard/activity-tab-toggle.test.ts`:
- Add 3 tests under the `translateSessionEvent` describe:
  - observer called with (skillName, sessionId) when present + event is skill-activate.
  - observer NOT called for non-skill-activate events (3 sub-cases).
  - FeedEntry shape stable whether observer provided or not.
- Fix pre-existing `events.map(translateSessionEvent)` → `events.map((e) => translateSessionEvent(e))` (was passing index as observer after the signature change; TypeScript caught it on first compile).

`.college/integration/observation-bridge.test.ts`:
- Add 4 tests:
  - onSkillActivate emits correct event shape + listener notified.
  - Buffer accumulation + flush returns all events.
  - toSessionObservation includes 'skill-activate' tool when skill-activation events present.
  - Structural-satisfaction test (no src/ import; verifies bridge fits the interface shape).

`.planning/PROJECT.md`:
- Pre-bump refresh v821 → v822.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/dashboard/activity-tab-toggle.ts` | MODIFIED | +24 LOC (interface + doc + signature + dispatch line). 228 → 252 lines. |
| `.college/integration/observation-bridge.ts` | MODIFIED | +26 LOC (type extension + sessionId field + onSkillActivate method + tool-set entry). 268 → 296 lines. |
| `src/dashboard/activity-tab-toggle.test.ts` | MODIFIED | +56 LOC: 3 new tests + 1 fix to pre-existing map call. |
| `.college/integration/observation-bridge.test.ts` | MODIFIED | +55 LOC: 4 new tests. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump refresh. |
| `docs/release-notes/v1.49.823/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read T1.3-RECON-2026-05-27.md + observation-bridge.ts (268 lines) + activity-tab-toggle.ts (228 lines) + their tests + the tsconfig.json. Surfaced the rootdir boundary as a constraint BEFORE writing code; led to the interface-in-src + impl-in-college pattern. ~10 min recon. |
| #10414 | Optional `ctx?`-style parameter | THE central application. translateSessionEvent gets `observer?: SkillActivationObserver` as the optional 2nd param. Zero call-site churn (all existing callers continue to work). |
| #10416 | Tolerant-generator / lightest wire | Resisted: changing tsconfig to remove rootDir (cross-cutting change); creating a new `src/integration/` shim module that re-exports from .college/ (would need build-step injection); writing a synchronous full-runtime wire (out of scope per recon). Chose: interface in src + impl in college + structural satisfaction via test. |
| #10422 | Verdict-pattern surface separation | The interface (decision-surface, "what can call onSkillActivate") is separated from the implementation (observability-surface, "what onSkillActivate does"). Clean separation; future implementations can satisfy the interface without touching the impl. |
| #10426 | Cross-class registry extraction at 2nd instance | N/A this ship — single-interface single-implementer. But the pattern (interface in one rootdir + impl in another + structural satisfaction) is a 1-instance pattern; if a 2nd cross-rootdir wire emerges in a future ship, the pattern could be extracted (e.g., a `src/integration/observers/` directory for cross-rootdir interface declarations). |
| #10427 | Failure-mode contracts | observer.onSkillActivate is called synchronously BEFORE FeedEntry construction. If observer throws, the FeedEntry isn't returned (caller gets the throw). This is load-bearing-propagation per #10427 — observer failures are caller-relevant. Documented in the inline doc on the method. |
| #10431 | Two-layer closure | The cross-rootdir wire-pattern has two layers: the interface declaration (decision layer; v823 establishes it) + the application-boundary wiring (source-eliminator layer; a future src-tauri/ or integration-test ship establishes it). v823 lands layer 1; layer 2 is operator-discretion future work. |
| #10432 | KNOWN_UNWIRED-style ledger | The wire-pattern is a debt-ledger entry of its own: until a runtime wire at the application boundary exists, the "wire" is shape-only. Operators wanting runtime-wired behavior should: (a) wire at src-tauri/ or (b) commission integration tests that exercise the wire. Both are future ship targets. |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a runtime wire at the application boundary (deferred to future ship).
- Not a closure of T1.3 entirely — Options A (gnn-predictor) and C (RosettaEngine confidence-bound) remain.
- Not a tsconfig rootDir change.

## Verification

- `npx tsc --noEmit` → clean (passed after the test-file map-arrow fix; original signature change caught the bare bare-function map at compile time).
- `npx vitest run src/dashboard/activity-tab-toggle.test.ts .college/integration/observation-bridge.test.ts` → 61 PASS / 0 fail (was 54; +7 new).
- Pre-tag-gate (full): expected 17/17 PASS.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 41 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

T1.3 substrate-to-consumer wire pattern established; T1.3 GAP-2 narrowed (not yet fully closed — runtime wire deferred to application boundary).

## Forward path post-v823

Chain CLOSED at v823. Total wall-clock: ~3.5 hours (8 ships).

Next-operator handoff document (separate ship) will summarize:
- v816-822 chain summary
- Remaining audit-T2 wedges (T2.1 v1.50 decision; T2.3 fully exhausted)
- Codify-ship candidates accumulated across the chain
- Forward-cadence options (NASA 1.179; git/core 3-file batch; T1.3 Options A/C; ProcessContext continued chips)
