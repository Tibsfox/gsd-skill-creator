# v1.49.946 — Retrospective

## What went right

- **Recon corrected a published claim before building on it.** The v1.49.944 chapters stated the substrate was "age-only" with "no `maxEntries` count cap at this path." Reading the actual code (`new RetentionManager({ maxAgeDays: retentionDays })` -> `RetentionManager` defaults `maxEntries` to 100; `prune` applies both caps) showed the substrate always applied a count cap of 100, just dormantly (it only fires above 100 entries). Had this ship trusted the v944 narrative and "added" a count cap as if none existed, it would have mis-described its own change. Instead the ship is framed accurately: it raises a dormant hardcoded cap to the configured value. This is the same recon-over-handoff discipline that ship #1 (v1.49.945) applied when it found the env-var race spanned two test files rather than the one the handoff named.

- **The wire reused v944's exact shape.** `observation.retention_days` flowed hook -> ctor arg -> substrate config -> RetentionManager; `observation.max_entries` now flows the identical path (a 5th ctor arg, an optional config field, a manager option). No new substrate, no new event, no new branch — the smallest possible extension of the proven v944 wire. Per the shelfware/lightest-wire discipline (#10422/#10423), honoring a config field that the prune already half-applied is lighter than inventing a parallel mechanism.

- **The latent bug was real, not cosmetic.** The 100-entry cap is dormant at typical scale but bites exactly the operators who generate the most observations (more than 100 high-signal sessions inside the retention window) — silently discarding data they configured to keep (default 1000). Fixing it makes the prune obey the operator across the full config range.

- **Mutation-proof at the load-bearing layer.** Both new behavior tests were proven by breaking the substrate's `max_entries` threading and confirming both red (substrate count-cap test and the session-observer wire test), while the backward-compat default-100 test stayed green. The single mutation exercises the whole chain because the wire test drives the real `onSessionEnd` -> substrate path.

## What went well in process

- **Backward-compat was held by making the new config field optional at every hop.** The substrate config's `max_entries?`, the ctor's 5th arg, and the hook's load all degrade to the prior default (100) when absent, so the v894 integration test and every existing caller pass unchanged. The added `RetentionSweepResult.maxEntries` field is non-breaking because the sole production caller discards the return value.

- **Scope held to one config field.** `observation.capture_corrections` and other `observation.*` fields were left alone; this ship honors exactly the count cap that the session-end prune was already half-applying.

## What to watch

- **`sessions.jsonl` can now grow to the configured cap.** At default config the cap rises from 100 to 1000. This is intended (it obeys the operator), and the file stays small, but it is a real increase in retained data for heavy users. If retained-observation volume ever becomes a concern, the lever is now the operator's `observation.max_entries`, not a hidden constant.

- **The count-drop signal feeds calibration as `too_aggressive`.** When the count cap fires (above `max_entries`), those drops are attributed to `retention_days` calibration. This is within the v891 acceptable-by-design contract (the substrate already emits `too_aggressive` every sweep), but if `observation.max_entries` ever becomes its own calibratable threshold, the count-drop signal should be split out from the age-drop signal so the two thresholds calibrate independently.

- **Two `observation.*` config fields are now wired; `capture_corrections` remains config-only.** It governs a different surface (correction capture, not pruning) and was correctly out of scope, but it is the next candidate if a config-honoring audit sweeps the `observation` block.

- **On config-load FAILURE, the prune falls back to the legacy 30-day / 100-entry caps, not the configured 90 / 1000.** The pre-ship review surfaced this: when `readIntegrationConfig()` throws, `session-end.ts` sets both threaded values to `undefined`, so `onSessionEnd` takes the legacy `RetentionManager.prune` branch (default `maxAgeDays=30`, `maxEntries=100`). This is pre-existing — inherited from v944's #10427 accessory-surface fallback (config-load must never break session observation), not introduced here — and conservative-by-design (a tighter cap on failure keeps less, never more). The only cost is debuggability: an operator seeing a 100-entry cap during a silent config-load failure might not realize the config was not read. If that ever bites, the fix is to surface a one-line warning when config-load fails rather than to change the fallback semantics. Out of scope for this wire.
