> Following v1.49.825 — _Batch Chip: `git/core` Family ProcessContext_, v1.49.826 closes the v824-826 chain with T1.3 Ship 3: a second production caller of the `onPredictions` substrate-consumer wire pattern. Wires `predictNextSkills` into `src/orchestration/selector.ts` (`ActivationSelector`). First instance was `src/chipset/copper/activation.ts` at v1.49.810; v826 is the 2nd. #10426 cross-class-registry-extraction-at-2nd-instance threshold met for codifying the onPredictions pattern in a future codify ship.

# v1.49.826 — T1.3 Ship 3: ActivationSelector onPredictions Wire (Second Production Caller)

**Shipped:** 2026-05-27

Third (and final) ship of the v824-826 chain. Closes the chain by establishing the 2nd production caller of the `onPredictions` hook pattern. The hook surfaces complementary-skill predictions to an observability subscriber after each activated decision in the M5 ActivationSelector.

## Recon finding: v823 handoff inaccuracy

The v823 handoff listed "T1.3 Ship 3 = Option A (gnn-predictor wire into a skill-activation call site; recon's recommended Option A; not yet shipped)." This framing was INACCURATE — Option A wire was shipped at **v1.49.810** ("T1.3 Option A: gnn-predictor Wired Into Copper Activation"). Same-day, 16 ships earlier.

Forensic finding: the v823 handoff conflated "wire pattern not yet shipped" with "wire pattern not yet applied to all production call sites." The wire pattern IS in place (copper/activation.ts since v810); v826 applies it to a SECOND production call site (orchestration/selector.ts) per the handoff's "Closes a different branch of the T1.3 GAP-2 substrate-to-consumer gap" framing. This is structurally identical to what the operator's selection of item #4 intended: a substrate-consumer wire in a NEW production caller.

## What shipped

- **MODIFIED** `src/orchestration/selector.ts`:
  - Add imports: `predictNextSkills`, `SkillPrediction` from `../predictive-skill-loader/index.js`.
  - Add `onPredictions?: (currentSkill, predictions) => void | Promise<void>` to `SelectorOptions`. Subscriber-gated; default unset; inline doc cites the v810 first-instance + v826 second-instance + #10426 threshold.
  - Add `private readonly onPredictions: ... | undefined` field on `ActivationSelector`; assigned in constructor from `opts.onPredictions`.
  - Add step 6 to `select()`: for each activated decision, fire-and-forget `_emitPredictions(decision.id)` after step 5 trace writes.
  - Add `private _emitPredictions(currentSkill)` method mirroring `src/chipset/copper/activation.ts:emitPredictions` (v1.49.810). Fire-and-forget Promise that calls `predictNextSkills(currentSkill, {})` then invokes the hook. Errors swallowed.
  - LOC delta: ~30 (imports + SelectorOptions field + constructor assignment + step 6 loop + private method).

- **MODIFIED** `src/orchestration/__tests__/selector.test.ts` — adds 1 new describe block with 3 tests covering the wire:
  - `invokes onPredictions for each activated decision` — verifies hook fires once per activated decision; not for non-activated; default-off flag returns empty predictions array (correct shape).
  - `does not fire onPredictions when no hook is set (subscriber-gated)` — absence-test that selection succeeds without a hook.
  - `selection succeeds even when the hook throws (fire-and-forget contract)` — verifies the swallow contract; the hook's throw does NOT propagate to the selector.

- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v824 → v825.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/orchestration/__tests__/selector.test.ts` | +3 | hook invocation + subscriber-gate + fire-and-forget error swallow |
| **Total added** | **+3** | All pass; no regressions. 36 test files / 383 tests pass in src/orchestration + src/predictive-skill-loader + src/chipset/copper |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **44 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — wire-pattern application, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~11-14 → ~11-15 (1 new: onPredictions pattern at 2 instances — eligible for codify ship since #10426 threshold met).
Wired calibratable thresholds: **5 of 6** (UNCHANGED).
KNOWN_UNWIRED Process: **28** (UNCHANGED — chip work continues in future ships).

## The `onPredictions` wire pattern — 2 instances

| Instance | Caller | Surface | Hook surface | Trigger |
|---|---|---|---|---|
| v1.49.810 | `src/chipset/copper/activation.ts` PipelineActivationDispatch | `ActivationContext.onPredictions` | After successful skill activation (lite/full modes) | per-MOVE-instruction skill activation |
| v1.49.826 | `src/orchestration/selector.ts` ActivationSelector | `SelectorOptions.onPredictions` | After each activated decision in `select()` | per-`select()`-call (multiple decisions) |

Both follow the same structural shape:
- Subscriber-gated `onPredictions?: (currentSkill, predictions) => void | Promise<void>` field
- Fire-and-forget invocation via Promise + `.catch(() => {})` to swallow errors
- Calls `predictNextSkills(currentSkill, {})` (default-off-flag path returns empty)
- Hook receives `currentSkill` + `predictions[]` (possibly empty)

Per #10426 (cross-class registry extraction at SECOND class instance), the pattern is now at the codification threshold. Future codify ship can promote this to ESTABLISHED with a discipline doc + manifest entry. Candidate name: "Subscriber-gated observation hook pattern" or "onPredictions wire pattern".

## v824-826 chain summary

| Ship | Subject | LOC | Tests | Wall-clock |
|---|---|---|---|---|
| v824 | Codification ship — promote #10433 + #10434 | ~80 docs | +0 | ~25 min |
| v825 | git/core 3-file batch ProcessContext | ~62 src | +0 | ~30 min |
| v826 | ActivationSelector onPredictions wire (this ship) | ~30 src + ~50 tests | +3 | ~30 min |
| **Total** | **3 ships** | **~170 LOC** | **+3 tests** | **~85 min (~1.5 hours)** |

Chain closes at **44 consecutive ships at NASA degree 1.178** (was 41 entering this chain).

## Audit wedge ledger status

| Wedge | Status at chain start (v823) | Status at chain end (v826) |
|---|---|---|
| T1.3 GAP-2 substrate-to-consumer wire | NARROWED v823 | NARROWED FURTHER (2nd production caller wired) |
| Process KNOWN_UNWIRED | 31 | 28 (-3 via v825 git/core batch) |
| Codify cadence | overdue 9 ships | RESET (v824 promoted #10433 + #10434) |
| onPredictions pattern | 1 instance (v810) | **2 instances** (v810 + v826) — eligible for codify ship |

T1.3 GAP-2 has now had **3 ships** closing different branches: v810 (copper/activation, Option A original); v823 (ObservationBridge cross-rootdir wire, Option B); v826 (selector second-caller, Option A pattern extension). The audit's "substrate consumer engine wired" framing is now satisfied at HIGH confidence — multiple production callers, multiple closure branches.

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip (KNOWN_UNWIRED Process unchanged at 28).
- Not a new discipline (manifest stays at 22 — codification of onPredictions pattern deferred to a future codify ship).
- Not a closure of T1.3 GAP-2 (the wedge framing remains; more callers + more concept coverage would tighten it further; the minimum-credible-closure bar is met).

## Verification

- `npm run build` → clean.
- `npx vitest run src/orchestration/__tests__/selector.test.ts` → 11 PASS (was 8; +3 new).
- `npx vitest run src/orchestration/ src/predictive-skill-loader/ src/chipset/copper/` → 36 test files / 383 tests PASS.
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## Forward path post-chain

Chain CLOSED. Next operator decisions return to the v823 handoff candidates (minus items 2/3/4 which are now done):

1. **NASA 1.179 forward-cadence** — **44 consecutive ships at 1.178**; most visible open item by an even wider margin.
2. **Further ProcessContext chips** (28 entries remain): dogfood family (3 entries) → 25; scribe/netlist-renderer (3) → 22; terminal (2) → 20; mesh (2) → 18; remaining singletons (~18).
3. **T1.3 application-boundary wire** — instantiate ObservationBridge at the application boundary; complements v823's interface pattern.
4. **T1.3 Option C** — RosettaEngine.translate() confidence-bound fallback (largest closure, ~2-3 ships).
5. **Future codify ship** — promote onPredictions pattern at 2 instances (v810 + v826) per #10426. Combine with other tentative observations as they reach 2-instance threshold.
6. **T2.1 v1.50 unblock-or-archive decision** (operator-bounded; 0-N ships).
