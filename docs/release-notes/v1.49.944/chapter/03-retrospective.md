# v1.49.944 — Retrospective

## What went right

- **The meta-cadence overdue-check was run before scoping, and its triggers were read literally.** Two of the four axes were initially mis-verdicted by a parallel investigation: calibrate as OVERDUE (it dropped the trigger's `>=20 observations` conjunct — the most-populated threshold had only 12 committed observations) and consume as OVERDUE (it string-matched `wired:false` on defensive catch-all registry branches for non-existent future threshold classes). Both were corrected against the source before any work was scoped. The discipline's value is that the check is *prose*, so the conjunct and the catch-all intent have to be read, not pattern-matched — and that is exactly where two careful agents stumbled.

- **The genuine gap was found by reading the code, not the registry.** No axis fired its literal trigger, but `runObservationRetentionSweep` (v891) having zero production callers — only a unit test and an integration test — is the real #10428 consume shape. The substrate was built and proven but never consumed; the calibration loop had no data because the writer was never called in production. That is the gap the consume axis exists to surface.

- **The lightest honest wire was chosen.** Per the shelfware-verdict discipline (#10422/#10423), the lightest wire that flips the consume classification was preferred: route the *existing* session-end prune through the substrate, rather than inventing a new maintenance command. The session-end hook already pruned `sessions.jsonl`; swapping that one call for the substrate gives a real production caller, feeds the calibration loop, and fixes a latent config-ignoring bug in the same stroke.

- **The pre-ship adversarial review earned its keep — and so did verifying its findings.** Correctness came back CLEAN with zero confirmed bugs. The behavior-change and failure-semantics lenses raised CONCERNS, but on triage they were documentation items or acceptable-by-design (the v891 substrate's conservative `too_aggressive` default). The one finding that could have undermined the ship's *purpose* — "could the fire-and-forget emit be lost in the short-lived hook process?" — was not taken on faith: it was independently disproven (the pending `appendFile` is an active libuv handle that keeps the process alive until the write resolves, and the success path never calls `process.exit()`). Had that been true, every production emit would have been lost and the calibration loop would still see nothing.

- **Scope was held to one threshold.** The review correctly flagged that dropping the legacy `maxEntries=100` cap leaves `sessions.jsonl` age-bounded only. Rather than widen the v891 substrate's age-only signature or fold a second threshold in, `observation.max_entries` was explicitly deferred to a future consume ship. The operator was offered the choice (age-only vs thread max_entries) and chose age-only.

## What went well in process

- **Recon preceded code.** Per #10409, the substrate signature, the `RetentionManager` collaborators, the config loader, the events-writer default path, and the v894 integration test's caller shape were all confirmed before the first edit. The wire site (`session-observer.ts:135`) and its blast radius (no prune-behavior assertions in the observer's own tests; `SessionObserver` instantiated only by the two session hooks) were established before committing to a shape, avoiding a wrong-shape trap.

- **The behavior change was surfaced for an explicit operator decision before T14.** The 30 -> 90 day retention shift and the dropped count-cap are real production behavior changes (reversible via config). Rather than ship them silently under cover of a "consume wire," they were named and the operator confirmed age-only + ship-to-main.

## What to watch

- **The `too_aggressive`-per-sweep signal is now flowing — monitor the drift.** Every session-end now emits a -1 observation, even when nothing was pruned. This is the documented v891 conservative bias, and the bounded-learning guards bound it, but this is the first time the signal has real traffic. A future *calibrate*-axis refinement could teach the substrate to emit only when `prunedCount > 0` (so "nothing dropped" is not counted as "too aggressive"); that would be a substrate change, out of scope for a consume wire. Watch whether `observation.retention_days` calibration starts recommending monotonic raises.

- **`observation.max_entries` is unwired.** The session-end prune is now age-governed only. If `sessions.jsonl` growth becomes a concern, wiring `observation.max_entries` (default 1000) is the natural next consume ship for this surface.

- **`observation-retention-events.jsonl` is not self-pruned.** The calibration-input log appends indefinitely (~1.5 MB/year at heavy session cadence — negligible). Architecturally ironic for a retention-tracking log; a future ship could sweep it with the same substrate if it ever matters.

- **The meta-cadence overdue-check is prose-only and was misapplied twice this session.** That is fresh evidence for the doc's own forward-shadow: a deterministic `skill-creator cadence --axis <X> --check` CLI. A future counter-cadence could build it (a gate-not-vigilance / discipline-as-code move) so the conjunctive triggers and catch-all intent are not re-litigated by hand each time.
