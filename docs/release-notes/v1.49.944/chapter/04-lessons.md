# v1.49.944 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). A consume ship is an **application** of existing lessons, not a codification. This ship applies #10428 (meta-cadence consume axis) and #10439 (CLI manual + substrate auto-recorder duality), and carries forward observations for future codify/calibrate ships.

## Applied (existing lessons)

- **#10428 — meta-cadence consume axis.** The trigger is "a substrate module with no non-test caller within ~6 ships of its ship date." `runObservationRetentionSweep` (v1.49.891) had a unit test and an integration test (v894) but zero production callers ~53 ships later. This ship is the consume closure: the session-end hook is its first production caller.
- **#10439 — CLI manual + substrate auto-recorder duality (calibrate-axis completeness rule).** A calibratable threshold's loop is structurally incomplete until BOTH write callers ship: the CLI manual recorder AND the substrate auto-recorder. For `observation.retention_days`, the CLI manual recorder existed; the substrate auto-recorder existed as a function but was never *called* in production. Wiring it at the session-end hook ships the auto-recorder half — the loop now sees traffic-attributed events with the default `too_aggressive` polarity, mirroring the CLI default.
- **#10422 / #10423 — lightest wire that flips the classification.** Rather than build a new maintenance command, the existing session-end prune was routed through the substrate. One call site changed; the consume classification flips; the latent config-ignoring bug is fixed in the same stroke.
- **#10427 — failure-mode contracts.** The hook's config-load is an accessory surface: wrapped in a swallow-on-throw try/catch so a malformed `.planning/skill-creator.json` falls back to the legacy prune rather than breaking session observation. The substrate's auto-emit is fire-and-forget with `.catch()` (observability-only). The prune itself is load-bearing and awaited (throws propagate). Each failure mode is classified by whether the operator's next decision depends on the surface's output.
- **#10437 — subscriber-gated observability hook (fire-and-forget).** The per-sweep emit follows the established shape; the test-side wait uses `setTimeout(50ms)` per #10454.

## Carried-forward candidates (observed, not promoted)

- **Substrate auto-emit should record only on a non-zero outcome.** `runObservationRetentionSweep` emits `too_aggressive` per sweep even when `prunedCount === 0`, so "nothing was dropped" is counted as "too aggressive." This is the v891 documented conservative-bias default and the bounded-learning guards bound it, but it is a candidate refinement: a substrate that IS-the-outcome (cf. the v898 outcome-driven kind subtlety) arguably should emit only when the sweep actually acted. **One instance** (this surface). Promote on a second substrate exhibiting emit-on-no-op. A substrate change, out of scope for this consume wire.
- **Calibration-input logs are not self-pruned.** `observation-retention-events.jsonl` (and its sibling event logs) append indefinitely. Negligible at current scale. A future ship could apply the retention substrate to the event logs themselves. Descriptive note, not yet a candidate.
- **The prose meta-cadence overdue-check is misapplication-prone.** Two careful agents this session both mis-verdicted an axis (calibrate's dropped conjunct, consume's catch-all false-positive). This is fresh evidence for the doc's forward-shadow `skill-creator cadence --axis <X> --check` CLI. A gate-not-vigilance candidate for a future counter-cadence; still one concrete misapplication cluster.

## Process note

- **A consume ship still runs the full ship discipline.** Recon-first per #10409, lightest-wire per #10422, a code commit (`feat`) then a separate `chore(release)`, five chapters, STORY, bump, full 18-step pre-tag-gate, tag, dual-push with `ls-remote` verification, RH refresh/publish, STATE with `--counter-cadence`, CI verified on both commits.
