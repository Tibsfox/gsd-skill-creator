
# v1.49.845 — Retrospective

**Wall-clock:** ~30 min from v844 ship-close to release-notes draft. Most of the time was on the AskUser scope question + reading v837/v840 context; the actual CLI implementation was ~10 min.

## What went as expected

- **AskUser disambiguated the architectural decision cleanly.** Three options offered (CLI command / thin helper / defer); operator picked the CLI command. Without that decision I would have either over-built (wiring ActivationSelector + RosettaConceptFallback in production) or under-shipped (deferred with forward-flag).
- **Path-narrowing collapsed scope.** The v837 forward-flag named ActivationSelector + copper Activation as the wire sites, but the underlying PATH (predict + record) can be called without either wrapper. The CLI skips the substrate wrappers and calls `predictNextSkillsWithMeta + appendPredictiveLowConfidenceEvent` directly. ~150 LOC instead of ~400.
- **Tests caught the disabled-vs-enabled assumption immediately.** Initial test assumed `predictNextSkillsWithMeta` returns disabled in a fresh test environment, but the project's local `.claude/gsd-skill-creator.json` opts the loader in. Rewrote the tests to verify schema shape + flag handling instead of disabled-state assertions. Tests pass 7/7.
- **End-to-end smoke worked first try.** `node dist/cli.js predict-next some-skill --no-record --json` returned a clean JSON structure with low-confidence detection.

## What I noticed

- **The CLI-as-production-caller pattern has a v803 precedent.** v803 wired the token-budget observation source; the CLI was the manual recorder; /sc:status integration was bolted on later as the auto-recorder. v845 is the same shape for the predict path. Forward-flag for #10428 sibling pattern: "calibration thresholds typically need TWO production callers — CLI manual + automatic auto-emit from substrate".
- **The substrate auto-emit gap is still real.** copper/activation.ts's `emitPredictions` calls `fallback.onLowConfidence(...)` when fallbackProvider is set, but does NOT call `appendPredictiveLowConfidenceEvent`. Same for `selector._emitPredictions`. The v837 retro CLAIMED auto-emit was wired but the code doesn't actually call append. This is the next-ship work.
- **The CLI's failure-mode contract follows #10427.** Prediction errors and event-recording errors are caught and surfaced in the JSON output (operator-debuggable) but don't throw or exit non-zero. The catch handlers preserve the load-bearing surface (argument parsing) while making forensic surfaces (predict + record) best-effort silent.
- **`SkillPrediction.skillId` not `name`.** First test attempt assumed `.name` field; corrected to `.skillId` after build failure. Minor; documented in the test file.

## What surprised me

- **The full architectural picture is "substrate ahead of demand".** PipelineActivationDispatch (copper), ActivationSelector, PipelineExecutor — all have ZERO production callers anywhere in `src/`. The entire copper chipset is scaffolding for a Pipeline runtime that doesn't exist in production. The v845 CLI doesn't change this — it adds a single CLI-level caller of the predict-event path, not a substrate consumer.
- **The cluster shipped 5 distinct ship-shapes in ~2 hours.** v841 tooling / v842 batch chip / v843 batch chip / v844 doc-structure / v845 production wire. Heterogeneity isn't a bug — the operator's "work through the list" instruction produced a coherent cluster across multiple operational types.
- **The operational-debt cluster is closing 5/5 tasks.** Beyond the v840 next-session candidates list. The cluster shape (operational-debt session + heterogeneous tasks) becomes a recognizable pattern alongside chip-cluster, codify-cluster, scaffold-cluster, etc.

## Risk that didn't materialize

- **No build regression.** TypeScript caught the `.name` → `.skillId` mistake immediately.
- **No test regression.** Full CLI suite (48 files, 613 tests) passes including the new 7 predict-next tests.
- **No interference with existing CLI commands.** Dispatch.ts addition is isolated.
- **No JSONL pollution from tests.** All tests use `--no-record` so no events written to the real JSONL.
- **No ProcessContextDenied propagation issue.** The CLI doesn't spawn processes; ProcessContext doesn't apply.

## Carried forward (post-v845)

NEW this ship (2; below threshold):

- **CLI-as-production-caller pattern** — 1 instance (v845; with v803 precedent making this an arguable 2-instance pattern depending on whether the precedent counts). Forward-test: any future substrate-source-without-production-caller scenario that gets a CLI wrapper as the first production caller.
- **Production-caller scope-reduction via path-narrowing** — 1 instance (v845; could-have-built-full-wrapper vs shipped-direct-call). Forward-test: any future "production caller" task where the substrate's wrapper is incidental to the path.

Inherited from earlier cluster ships (unchanged):
- DI-executor + tokenized-argv wire shape (3 instances; eligible at next codify ship).
- Re-throw ProcessContextDenied from CLI swallow-catch (2 instances; eligible).
- Canonical-doc-decision ship pattern (v844; 1 instance).
- Verify-axis self-applicability (v844 forward-flag).
- Recent-vs-baseline-recent comparison pattern (v841; 1 instance).
- Drift-check noise as scoring-system feedback loop (v841; 1 instance).
- All other single-instance observations.

Still DEFERRED:
- Bidirectional enforcement completeness (1-2 instances; classification ambiguous).
- Verify axis numbered-lesson promotion (canonical-doc set v844).
- **Auto-emit-from-substrate** — copper/activation.ts + orchestration/selector.ts emitPredictions methods need to call `appendPredictiveLowConfidenceEvent` when fallback fires. v845 CLI is the manual recorder; auto-emit is the substrate recorder. Future ship.

## Process retrospective

- **The cluster shape was operator-bounded but produced rich output.** 5 ships in ~2 hours, each closing a deferred candidate or forward-flag. The operator's "work through the list" instruction is the operative direction; the per-ship decisions (AskUser for v841 + v845, autonomous for v842/v843/v844) calibrated the human-in-the-loop ratio per-ship.
- **AskUser at the right moments was load-bearing.** v841 (per-type baselines vs new chip type) and v845 (CLI vs substrate-wrapper vs defer) both produced architectural decisions that I wouldn't have made unilaterally. v842/v843/v844 didn't need AskUser because they followed established patterns.
- **5/5 tasks complete.** The user's "work through the list" instruction is fully delivered. Forward path now points at NASA 1.179 (63 consecutive ships at 1.178 — record-widest pressure margin), or next codify ship (~v847-850), or continued ProcessContext chips, or the auto-emit-from-substrate follow-on.
- **Total cluster wall-clock ~2 hours** for: 1 new release_type, 1 new operational axis, 1 new CLI command, 5 wires, 16 new vitest assertions, 0 source regressions. Operational-debt session productivity exceeded expectations.
