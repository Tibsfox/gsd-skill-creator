
# v1.49.845 — Context

## Provenance

5th and final ship of the new operational-debt cluster. Closes the v837 forward-flag "Production callers of ActivationSelector and copper Activation are currently absent" by adding a CLI-level production caller of the predict path. Also closes the v840 next-session candidate "Production caller of the predict path".

## What this ship adds

```
src/cli/commands/predict-next.ts                   [NEW: 155 LOC — CLI command implementation]
src/cli/commands/predict-next.test.ts              [NEW: 90 LOC, 7 vitest assertions]
src/cli/dispatch.ts                                [MODIFIED: +4 LOC for registration]
docs/release-notes/v1.49.845/                      [NEW: README + 4 chapters]
.planning/PROJECT.md                               [MODIFIED: pre-bump refresh]
```

## Recon trail

1. **Read predecessor handoff** (v840 next-session candidates list). "Production caller of predict path" listed with ~1-2 hour estimate.
2. **Inspect predictive-skill-loader API** — `predictNextSkillsWithMeta` returns predictions + lowConfidenceThreshold; `appendPredictiveLowConfidenceEvent` writes to JSONL.
3. **Search for production callers** of ActivationSelector and copper PipelineActivationDispatch — confirmed ZERO matches in src/ outside tests.
4. **Read v837 retrospective** to understand the structural blocker. Confirmed: substrate is ahead of demand; the v837 wire is read-side only; auto-emit-from-substrate was deferred.
5. **AskUser for scope direction** — operator picked "new CLI command".
6. **Implement `src/cli/commands/predict-next.ts`** — 155 LOC; calls predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent directly; flag handling for --useful/--not-useful/--no-record/--json.
7. **Register in dispatch.ts** — 4 LOC; aliases `['predict-next', 'pn']`.
8. **Write tests** — 7 vitest assertions for argument parsing + JSON schema + flag handling.
9. **First-try build failure**: assumed `SkillPrediction.name` field; actual field is `skillId`. Fixed.
10. **First-try test failure**: assumed default config has `enabled: false`; actual project config has `enabled: true` in `.claude/gsd-skill-creator.json`. Rewrote tests to verify schema + flag handling instead of disabled assumption. 7/7 pass.
11. **End-to-end smoke** — `node dist/cli.js predict-next some-skill --no-record --json` returns clean JSON; `isLowConfidence: true` when maxScore (0) < threshold (0.3).
12. **Author release notes** — 5 files (README + 4 chapters).

## Wire decisions in detail

### Why CLI not substrate wrapper

The v837 forward-flag specified "production callers of ActivationSelector and copper Activation". But those wrappers have ZERO production callers — they're substrate ahead of demand. Constructing a synthetic production caller of the substrate would be architectural over-reach.

The CLI calls the predict-event PATH directly:
- `predictNextSkillsWithMeta(currentSkill)` — the predict half
- `appendPredictiveLowConfidenceEvent(...)` — the event-record half

These are the same primitives that ActivationSelector and copper Activation would call IF they had production callers. The CLI is a production caller; it just doesn't route through the substrate wrappers.

### Why --useful / --not-useful flags

The bounded-learning calibration polarity for `predictive.low_confidence_threshold` is INVERTED from v803's token-budget convention (see `src/bounded-learning/predictive-low-confidence-events.ts` docstring):

- `useful` event (operator found fallback useful) → value -1 → favor RAISING the threshold (fire MORE often).
- `not_useful` event (fallback fired but operator didn't act) → value +1 → favor LOWERING the threshold (fire LESS often).

Default kind is `not_useful` because the CLI fires on low-confidence detection; the operator can flip with `--useful` if they decide the predictions would have been valuable.

### Why --no-record

Lets operators inspect the predict path without polluting the JSONL. Useful for: debugging the prediction logic, exploring the College graph, sanity-checking thresholds. The JSONL grows with real operator events only.

### Why JSON output

Machine-readable for piping to other tools. The human-readable default output is for interactive use. Same flag convention as other CLI commands (audit, bounded-learning, etc.).

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/cli/commands/predict-next.test.ts` | PASS (7 tests) |
| `npx vitest run src/cli/commands/` | PASS (613 tests, 48 files) |
| `node dist/cli.js predict-next some-skill --no-record --json` | Returns clean JSON; isLowConfidence: true |
| `node dist/cli.js predict-next --help` | Shows usage line |
| `bash tools/pre-tag-gate.sh` | (pending T14 step 1) |

## What was deferred

- **Auto-emit from substrate.** copper/activation.ts `emitPredictions` and orchestration/selector.ts `_emitPredictions` should call `appendPredictiveLowConfidenceEvent` when fallback fires. The v837 retro implied this was wired but the code shows it isn't. v845 ships the CLI half (manual recorder); the substrate auto-emit is a separate ship.
- **Production caller of ActivationSelector/copper Activation proper.** The wrapper classes still have no production callers. The v845 CLI is a production caller of the PATH; the wrappers remain substrate ahead of demand. A future ship that introduces a Pipeline runtime in production would naturally construct these.
- **Help text in `src/cli/help.ts`.** Not added this ship to keep scope tight. Future help-text expansion can include predict-next.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- New CLI command ship — 1 new source file + 1 new test file + 1 dispatch.ts edit.
- No new lessons promoted; no manifest changes; no CLAUDE.md regen needed.
- v836 preservation gate continues to fire (9th time at v845's T14 publish step expected).

## Forward path post-v845 — operational-debt cluster CLOSED

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (63 consecutive ships at 1.178 — record-widest pressure margin).
2. **Continued ProcessContext singleton chips** — ~14 remaining singletons after v842 + v843 closed 5 entries.
3. **Auto-emit-from-substrate** — copper/activation + selector emitPredictions methods need to call appendPredictiveLowConfidenceEvent. Would complete the predict-event auto-flow.
4. **Next codify ship (~v847-850)** — pickup candidates:
   - Verify axis numbered-lesson promotion (canonical-doc set v844; threshold met).
   - DI-executor wire shape (3 instances).
   - Re-throw ProcessContextDenied from CLI swallow-catch (2 instances).
5. **Help text expansion in src/cli/help.ts** — add predict-next + other recent commands.

## References

- Predecessor: v1.49.844 (`docs/release-notes/v1.49.844/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md`
- v837 forward-flag source: `docs/release-notes/v1.49.837/README.md` (Production callers absent paragraph)
- Predict path: `src/predictive-skill-loader/index.ts` (`predictNextSkillsWithMeta`)
- Event-record path: `src/bounded-learning/predictive-low-confidence-events.ts` (`appendPredictiveLowConfidenceEvent`)
- New CLI command: `src/cli/commands/predict-next.ts` (this ship)
- CLI dispatch: `src/cli/dispatch.ts`
- v803 precedent (CLI + auto-recorder duality): `src/cli/commands/bounded-learning.ts` token-budget event recording
- Failure-mode contracts: `docs/failure-mode-contracts.md` (#10427)
