> Following v1.49.822 — _T2.2 Part 2: Discipline-coverage Gate Default-BLOCK Flip_, v1.49.823 closes the v816-822 chain with T1.3 Ship 2 (ObservationBridge wire). Establishes the structural wire between `src/dashboard/activity-tab-toggle.ts` (where SessionEvent flows) and `.college/integration/observation-bridge.ts` (where College observation events accumulate) using an interface-on-the-src-side + implementation-on-the-college-side pattern that respects the rootdir boundary.

# v1.49.823 — T1.3 Ship 2: ObservationBridge Wire (Cross-Rootdir Interface Pattern)

**Shipped:** 2026-05-27

Eighth (and final) ship of the v816-822 chain. Closes the chain by establishing the first structural wire from src/dashboard to .college/integration. The `SkillActivationObserver` interface is declared in src/; the ObservationBridge in .college/ structurally satisfies it; the wire is set up at the application boundary (where both rootdirs are visible — e.g., src-tauri/).

Per the v815 handoff's T1.3 Ship 2 = Option B framing and the recon at `.planning/T1.3-RECON-2026-05-27.md`. The recon flagged the rootdir boundary as a constraint; v823 picks the interface-as-contract pattern that respects it without requiring a tsconfig change.

## What shipped

- **MODIFIED** `src/dashboard/activity-tab-toggle.ts`:
  - Add `SkillActivationObserver` interface: `{ onSkillActivate(skillName: string, sessionId: string): void }`. Inline doc explains the rootdir-boundary rationale and the v823 T1.3 Ship 2 context.
  - Modify `translateSessionEvent(event, observer?)` — adds optional second parameter; when present and `event.type === 'skill-activate'`, calls `observer.onSkillActivate(event.entityName, event.entityId)`. Returns the same FeedEntry as before; behavior for non-skill-activate events unchanged.
- **MODIFIED** `.college/integration/observation-bridge.ts`:
  - Extend `CollegeObservationEvent.type` union: `'exploration' | 'translation'` → `'exploration' | 'translation' | 'skill-activation'`.
  - Add `sessionId?: string` optional field to `CollegeObservationEvent`.
  - Add `onSkillActivate(skillName, sessionId): CollegeObservationEvent` method to `ObservationBridge` class. Emits event with `type: 'skill-activation'`, `conceptId: skillName`, `sessionId`, `timestamp`. Notifies listeners. Inline doc explains the structural satisfaction of `SkillActivationObserver` across the rootdir boundary.
  - Update `toSessionObservation`'s tool-set collection to recognize `'skill-activation'` events (adds `'skill-activate'` to topTools).
- **MODIFIED** `src/dashboard/activity-tab-toggle.test.ts` — add 3 tests:
  - observer.onSkillActivate is called when observer provided + event is skill-activate
  - observer.onSkillActivate NOT called for non-skill-activate events
  - FeedEntry shape unchanged whether observer provided or not
  - Bonus: fixed pre-existing test `events.map(translateSessionEvent)` → `events.map((e) => translateSessionEvent(e))` (was passing index as observer after the signature change; type-check caught it).
- **MODIFIED** `.college/integration/observation-bridge.test.ts` — add 4 tests:
  - onSkillActivate emits event with correct shape + listener notified
  - Buffer accumulation + flush returns all events
  - toSessionObservation includes 'skill-activate' tool when skill-activation events present
  - Structural-satisfaction test demonstrating ObservationBridge fits the SkillActivationObserver shape (no src/ import)
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v821 → v822.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/dashboard/activity-tab-toggle.test.ts` | +3 | observer wire + non-wire + shape-stability |
| `.college/integration/observation-bridge.test.ts` | +4 | onSkillActivate behavior + structural-satisfaction |
| **Total added** | **+7** | All pass; no regressions |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 41 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — wire-pattern application, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## The cross-rootdir wire pattern

The repo has a strict tsconfig boundary: `rootDir: "src"` + `include: ["src/**/*"]`. This means src/ cannot import from `.college/` at compile time. The wire respects this:

| Side | What it provides |
|---|---|
| src/dashboard/activity-tab-toggle.ts | `SkillActivationObserver` interface (the contract); `translateSessionEvent(event, observer?)` accepting the contract |
| .college/integration/observation-bridge.ts | `ObservationBridge.onSkillActivate(name, sessionId)` method that structurally satisfies the contract |
| Application boundary (e.g., src-tauri/, integration test) | Wires the two — instantiate ObservationBridge, pass to translateSessionEvent calls |

This pattern is reusable for any future src/ → .college/ wire: define the interface in src/, implement on the .college/ side, wire at the application boundary. The test artifacts demonstrate the wire works.

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a runtime wire in production code (the wire HAPPENS at the application boundary, not in src/ code).
- Not a new GAP-2 ledger entry (T1.3's GAP-2 is closed-enough for the recon's "minimum credible closure" framing).
- Not a closure of all T1.3 Options — Option A (gnn-predictor wire) and Option C (RosettaEngine confidence-bound fallback) remain available for future ships.

## Verification

- `npx tsc --noEmit` → clean.
- `npx vitest run src/dashboard/activity-tab-toggle.test.ts .college/integration/observation-bridge.test.ts` → 61 PASS / 0 fail (was 54; +7 new).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## v816-822 chain summary

| Ship | Subject | LOC | Tests | Wall-clock |
|---|---|---|---|---|
| v816 | state-md-set-shipped colon-safe + check determinism | +14 src + +33 test | +2 + 1 deflaked | ~25 min |
| v817 | c12-load-kb-context flake retry-bump | +6 (config + comment) | +0 | ~30 min |
| v818 | FlagLookup discriminated union extract | +14 new module + 4× -9 callsites + 41 test | +7 | ~25 min |
| v819 | aminet family ProcessContext batch chip | +40 src across 5 files + audit-test edit | +0 | ~35 min |
| v820 | git/core/branch-manager first-chip | +14 src + audit-test edit | +0 | ~25 min |
| v821 | discipline-coverage ceiling infrastructure | +45 (tool + gate) | +0 (smoke verified) | ~25 min |
| v822 | discipline-coverage default-BLOCK flip | ~10 (config + comment) | +0 (smoke verified) | ~20 min |
| v823 | ObservationBridge wire (this ship) | +70 across 2 files + 7 tests | +7 | ~30 min |
| **Total** | **8 ships** | **~250+ LOC** | **+16 tests** | **~215 min (~3.5 hours)** |

KNOWN_UNWIRED Process: **37 → 31** (-6 net across the chain).
Audit-recon-surfaced T2.3 backlog: **CLOSED** (3 of 3 wedges closed: HIGH-01 v815, c12 v817, FlagLookup v818).
Audit T2.2 wedge: **CLOSED** (v821 + v822).
Audit T1.3 GAP-2: **NARROWED** (substrate-to-consumer wire pattern established).

## Forward path post-v823

Chain CLOSED. Next operator decisions are sized in a new handoff doc:

1. NASA 1.179 forward-cadence (41 consecutive at 1.178; most visible open item).
2. git/core 3-file batch (repo-manager + state-machine + sync-manager; brings Process 31 → 28).
3. T1.3 Ship 3 = Option A (gnn-predictor wire) or Option C (RosettaEngine confidence-bound).
4. Codify ship to promote v810-823's eligible-for-promotion observations (codification-ship pattern at 5+ instances; chokepoint pattern at 4+; ledger-as-debt pattern at 2).
5. T2.1 v1.50 unblock-or-archive decision.
6. Continued ProcessContext chip work (28-30 entries remain after git/core batch).
