# v1.49.836 — Lessons

## New lesson candidates (2, both at 2 instances at v836 close)

### Two-layer closure generalizes from procedure-rooted drift to file-overwrite drift (#10431 sub-pattern)

**Status:** 2 instances (v813 STATE.md drift + v836 publish chapter-overwrite drift). ELIGIBLE FOR CODIFICATION in the next codify ship.

**Provisional scope:** The two-layer-closure pattern (source-eliminator + detector) generalizes cleanly from operator-procedure-rooted drift to tool-procedure-rooted file-overwrite drift. The shape is the same:

- **Layer 1 (source-eliminator):** Deterministic logic that prevents the drift from occurring at the source location. For v813, this was `tools/state-md-set-shipped.mjs` (atomic writer replacing operator-discretion edit). For v836, this was `chapter.mjs`'s `writeChapterIdempotent` with `openerMatches` (already existed since v1.49.585 C04; preserves hand-authored content in `.planning/roadmap/<v>/`).
- **Layer 2 (detector / destination-preservation):** Structural check at the next-most-likely escape point. For v813, this was `tools/pre-tag-gate.sh` step 0.5 (post-write canonical-form check). For v836, this was `publish.mjs`'s `shouldPublishToDestination` (preserves hand-authored content at the GitHub mirror + tibsfox.com staging destinations).

Either layer alone is incomplete. Source-without-detector lets future operators (or future code paths) bypass the discipline; detector-without-source leaves the human-error / tool-default window open.

**v836's specific contribution to the existing #10431 codification:** the discipline doc at `docs/two-layer-closure-discipline.md` documents the v813 STATE.md case. v836 demonstrates the same pattern applies to file-overwrite classes where the operator-side workaround (here: `git checkout HEAD -- <chapters>`) was masking the missing destination-side layer. Worth an extension paragraph at next codify ship.

**Evidence anchors:**
- v1.49.813 STATE.md drift: `tools/state-md-set-shipped.mjs` (source-eliminator) + `tools/pre-tag-gate.sh` step 0.5 (detector).
- v1.49.836 publish overwrite drift: `chapter.mjs` C04 (source-side preservation, from v1.49.585) + `publish.mjs` `shouldPublishToDestination` (destination-side preservation, this ship).

**Candidate-for-3rd-instance triggers:** any future bidirectional file-state class where both a source and a destination location need preservation, OR any operator-procedure-rooted drift where the existing "manual recovery" workaround is the alarm bell for the missing detector layer.

### Auto-run-on-import is a hidden bootstrap-time tax on script modules (1 instance, multi-module observation)

**Status:** 1 instance (this ship; observed across `chapter.mjs` + `publish.mjs`). NOT YET codified. Wait for 2nd instance.

**Provisional scope:** Node.js script modules that end with `main().catch(...)` execute `main()` on EVERY import, not just when invoked as the entry point. Symptoms:
- Importing the module triggers any side effects of `main()` (here: PostgreSQL connect attempts → SASL failures under naked Node).
- vitest reports a worker-pool termination timeout because the unfinished async PG connect prevents clean worker shutdown.
- Tests still pass (the helper-under-test completes before main() resolves) but emit warning noise.

**Provisional fix:** Guard `main()` with an `isEntryPoint` check:

```js
import { fileURLToPath } from 'node:url';
const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) {
  main().catch(e => { ... });
}
```

This is a Node.js convention but is NOT currently in any of the `tools/release-history/` scripts. v836 fixed `publish.mjs` directly + worked around `chapter.mjs` via the `opener-match.mjs` extraction.

**Evidence anchor:** v1.49.836 (this ship) — `tools/release-history/publish.mjs` `isEntryPoint` guard + `tools/release-history/opener-match.mjs` extraction sidestepping `chapter.mjs`'s lack of guard.

**Candidate-for-2nd-instance triggers:** any future cross-script reuse where a `tools/`-resident `.mjs` script's helper is imported into a test or another tool. Likely candidates: `refresh.mjs`, `scan.mjs`, `ingest.mjs`, `regen-history-md.mjs` — all auto-run their `main()` on import.

## Forward-test of existing lessons

### #10431 — Two-layer closure for procedure-rooted drift

**Status:** RESPECTED + GENERALIZED. v836 is the 2nd instance of the closure pattern, applied to a sub-class (file-overwrite drift) different from v813's case (operator-procedure-rooted drift). Both layers needed; either alone would be structurally incomplete.

### #10422 — Ledger-driven work

**Status:** RESPECTED. Per-file recon (`chapter.mjs` opener-matches usage, publish.mjs's existing write loop, the publish_target table semantics) preceded any code change. Recon caught both the auto-run-on-import side effect and the choice between extracting `opener-match.mjs` vs guarding `chapter.mjs`'s main().

### #10427 — Failure-mode contracts

**Status:** RESPECTED. The new gate is documented as "load-bearing" in the in-file comment block and in the JSDoc on `shouldPublishToDestination`. The conservative-bias-toward-preserve direction matches the discipline (when in doubt, preserve hand-authored content; the false-positive cost is ~1 warning line per future ship, the false-negative cost is destroyed hand-authored content).

### #10416 — Lightest wire

**Status:** RESPECTED. The fix adds the minimum surface needed: one new exported helper, one wire site in the per-target publish loop, one wire site in the toplevel loop, one new flag, one new module file extracting existing helpers. No refactor of unrelated code; no abstraction beyond what the immediate use case requires.

### #10434 — Cross-cutting observability+enforcement surface (KNOWN_UNWIRED ledger discipline)

**Status:** NOT APPLICABLE this ship (no allowlist/ledger surface introduced; the preservation gate is a per-call decision, not a per-file enumerated allowlist).

## Status of v835 lesson candidates

- **Scaffold ship pattern** (v835 emitted at 1 instance): UNCHANGED at 1 instance. v836 is not a scaffold ship; it's a recurring-friction closure ship. Different shape.
- **Paired "framework-predicted, recon-caught" ship arc** (v835 emitted as 1 arc): UNCHANGED at 1 arc. v836 continues the recon-then-close cadence individually, but it's not paired with v835 in the same session-arc sense.
- **Type-registered vs observation-source-wired vs runtime-wired** (v835 forward-flag): UNCHANGED. No calibration-framework work this ship.

## Status of v834 lesson candidates

- **Stale-entry cleanup chip pattern** (1 instance): UNCHANGED at 1 instance.
- **Per-ship release-notes count claims inherit predecessor** (1 instance): UNCHANGED at 1 instance. The v836 release notes derived all counts from source-of-truth (test count via vitest run, KNOWN_UNWIRED counts inherited unchanged from v835 close + cross-verified by grep).
- **Audit-inverse-check enhancement as defensive measure** (1 forward-flag): UNCHANGED. Still on the next-session-candidates list.

## Codify ship eligibility at v836 close

Counts of multi-instance carry-forwards:

| Observation | Instances | Codify-eligible? |
|---|---|---|
| Two-layer closure generalization | 2 (v813 + v836) | YES (NEW eligibility this ship) |
| Substrate-consumer hook PAIR pattern | 2 (v830 + v832) | YES (carryover from v833) |
| `onPredictions` substrate-consumer wire | 2 (v810 + v826) | YES (carryover) |
| #10433 LOC-band-by-callsite-count refinement | 3 (v825 + v827 + v828) | YES (carryover) |
| Verification/integration-only ships | 2 (v829 + v832) | YES (carryover) |

**5 eligible patterns** for the next codify ship (likely v840+). The pickup list grew by 1 this ship (the #10431 file-overwrite-sub-class). Codify cadence is now 3 ships past last codify (v833) — within the 7-10 ship floor, no urgency.
