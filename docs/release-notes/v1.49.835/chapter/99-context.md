# v1.49.835 — Context

## Provenance

Second ship in the v834-v835 paired sequence. Operator authorization: post-v833 next-direction prompt selected "ProcessContext singleton chips and lowConfidenceThreshold calibration" as a 2-ship sequence; within calibration scope, selected "Full scaffold (recommended)" — register threshold class + observation source + lesson candidate notes; defer production wire to a future ship.

## What this ship adds

```
src/bounded-learning/types.ts                                   [MODIFIED: +1 union member + JSDoc]
src/bounded-learning/observation-sources.ts                     [MODIFIED: +case + +JSDoc + +fallthrough comment]
src/bounded-learning/__tests__/observation-sources.test.ts      [MODIFIED: +2 tests]
.planning/PROJECT.md                                            [MODIFIED: pre-bump refresh]
```

No new files. No production-wire changes (deferred to future ship). No CLI surface changes (`SUPPORTED_THRESHOLDS` stays at 4 entries — won't expose a threshold whose observation source isn't wired).

## Recon trail (per #10422 ledger-driven work discipline)

1. **Confirm the v830 wire endpoints:** `grep -rn "lowConfidenceThreshold" src/` returns: `src/predictive-skill-loader/{settings.ts,index.ts,fallback.ts}` (substrate); `src/chipset/copper/activation.ts` (1st caller); `src/orchestration/selector.ts` (2nd caller); test fixtures. NO references in `src/bounded-learning/`. Confirms the calibration-framework registration gap.
2. **Verify the type union doesn't include the new threshold:** Read `src/bounded-learning/types.ts:33-39`. Type has 6 members: `suggestions.*` × 3 + `token_budget.*` × 2 + `observation.retention_days` × 1. `predictive.low_confidence_threshold` is not present. Confirms the gap exists at the type-registration level.
3. **Identify the v798 precedent for the registration pattern:** Read `src/bounded-learning/observation-sources.ts:75-110`. Each threshold class has a `observationSourceFor` case returning `{ sourceId, description, wired }` metadata. `token_budget.max_percent` is registered with `wired: false` since v798; v835 mirrors this exact shape for the new class.
4. **Plan the minimum changes:** (a) Add new member to type union. (b) Add `observationSourceFor` case. (c) Add inline fallthrough comment to `loadObservationsForThreshold` so future readers see the explicit list of unwired classes. (d) Add 2 mirror tests. (e) Update JSDoc on both the type and the dispatch function.
5. **Check for switch statements that might need new cases:** `grep -rn "switch.*threshold\|case '" src/bounded-learning/` returns 0 switch statements over CalibratableThreshold values. `threshold-writer.ts` uses dotted-path splitting. No exhaustive-switch updates needed.
6. **Check CLI's SUPPORTED_THRESHOLDS:** `src/cli/commands/bounded-learning.ts:88` — operator-facing allowlist has 4 entries (all observation-source-wired thresholds). Do NOT add the new threshold here — the principle "don't surface what you can't act on" applies. Observers can still discover the threshold via `observationSourceFor`; the CLI just won't accept it as a target until production wire lands.
7. **Verify tests pass:** `npx vitest run src/bounded-learning/__tests__/observation-sources.test.ts` → 16 PASS (was 14; +2 new tests).
8. **Verify the bounded-learning test suite as a whole passes:** `npx vitest run src/bounded-learning/__tests__/` → 97 PASS.
9. **Verify build:** `npm run build` → clean.
10. **Pre-tag-gate:** 17/17 PASS; full suite 35,237.

## Discipline-extension vs new-domain choice

NOT A DOMAIN-ADDITION. This is a scaffold ship within the existing bounded-learning calibration framework (Lesson #10425 codified at v802). The new threshold class is registered using the existing v798-era pattern; no new discipline domain warranted.

The scaffold ship pattern itself (and the paired-arc shape) are deferred carry-forward observations; not codified this ship.

## What was deferred

- **Production `fallbackProvider` wire** — wire `RosettaConceptFallback` (or equivalent) into the production constructor path for copper/selector. Currently the substrate exists but no production code constructs a `fallbackProvider`. Future ship; ~45-60 min scope.
- **`predictive-low-confidence-events.jsonl` log path** — analogous to `token-budget-events.jsonl` (v803), would record operator responses to low-confidence fallback events. Future ship, paired with production fallbackProvider wire.
- **Flipping `wired: false → true`** — happens when both prior items land; THEN the calibration framework can compute recommendations against real production data.
- **Adding to CLI `SUPPORTED_THRESHOLDS`** — happens when observation source is wired (so operators see a meaningful calibration tick rather than always-hold).
- **Update v833 README's "6 of 6 wired" framing** — the v833 claim was correct at runtime-wire-count level. Update declined for this ship; framing nuance is a future codification topic if the three-surface distinction (type-registered / observation-source-wired / runtime-wired) accumulates more instances.
- **Audit-inverse-check enhancement** (v834 carry-forward) — operator-bounded ~30-min ship.

## Verification trail

| Step | Result |
|---|---|
| `grep "CalibratableThreshold\b" src/ -rn` | 7 type-references (audit-log, calibration-loop, threshold-writer, observation-sources, index, types, bounded-learning CLI) — none use exhaustive switch, all accept new members generically |
| `npx vitest run src/bounded-learning/__tests__/observation-sources.test.ts` | 16 PASS (14 → 16, +2) |
| `npx vitest run src/bounded-learning/__tests__/` | 97 PASS (full bounded-learning suite) |
| `npm run build` | PASS |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (step 13 within-ceiling at 39 ≤ 41) |
| Full suite | 35,237 PASS / 45 skipped / 7 todo / 0 fail |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Scaffold ship; type-system addition only.
- Second of v834-v835 paired sequence; both ships close silent framework gaps predicted in prior docs.

## Forward path

- **NASA 1.179 forward-cadence** — STRONG-DEFAULT post-v835 (53 consecutive ships at 1.178 expected at v835 close).
- **Production fallbackProvider wire** — paired ship flips `predictive.low_confidence_threshold` from registered-only to functionally-wired.
- **Audit-inverse-check enhancement** — v834 forward-flag; ~30-min ship.
- **Continued ProcessContext singleton chips** — terminal/mesh/intel batch chips remain.
- **Future codify ship** (v840+) — picks up the 3 v833-deferred + 1 v834-deferred + 3 v835-deferred carry-forward observations (subject to 2nd-instance accumulation per #10426).

## References

- Predecessor: v1.49.834 (`docs/release-notes/v1.49.834/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.830-833-chain-closed.md`
- Source-of-truth type: `src/bounded-learning/types.ts:33-46`
- Source-of-truth observation source: `src/bounded-learning/observation-sources.ts:75-117`
- Test coverage: `src/bounded-learning/__tests__/observation-sources.test.ts`
- The v830 wire that left this gap: `chore(release): v1.49.830 t1.3 option c framework`
- v798 precedent: `chore(release): v1.49.798 — token_budget thresholds registered, max_percent unwired`
- Bounded-learning calibration discipline: `docs/bounded-learning-calibration-discipline.md` (Lesson #10425)
- Architecture-retrofit patterns: `docs/architecture-retrofit-patterns.md` (#10426 second-instance threshold)
