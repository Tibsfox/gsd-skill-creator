# v1.49.972 — Lessons

No new manifest lesson is promoted — manifest count stays **151**. This ship applies existing disciplines and the settled D3 resolutions; one forward-candidate (below) is recorded for a future codify ship.

## Applied (existing lessons)

- **#10461 (gate-enforce + drift-guard pairing):** `tests/integration/learning-substrate-parked.test.ts` is an independent oracle that re-reads the allowlist, the source, and the park doc, pinning the 8-module park (allowlisted + `addedBy` provenance + dated gate + doc lists all 8) and the retirement (dir gone, un-registered). Layer-1 vitest — runs every ship via the gate's vitest step, no new shell step.
- **#10422 / #10423 (shelfware-verdict patterns):** the observability surface (allowlist + scanner) and the decision surface (`SHELFWARE-VERDICTS.md` rows) are kept separate; ALLOWLISTED for the parked island (substrate preserved), RETIRED for `intrinsic-telemetry` (deleted).
- **#10427 / doc-accuracy:** a dangling reference to a deleted module is a load-bearing doc defect — all 3 prose refs to the retired module were cleaned proactively, so the adversarial review found nothing.
- **Ship-pipeline (CI-shaped failures):** deleting a `src/` subsystem drifts `INVENTORY-MANIFEST.json`; the pre-tag-gate's own hint named the fix (`scripts/generate-inventory-manifest.sh`). Regenerated + folded into the commit before any main FF.

## Forward candidate (not promoted)

- **An import-graph adoption scanner under-counts string-keyed registrations.** `intrinsic-telemetry` showed 0 internal importers because `heuristics-free-skill-space` registers it by *string key* (config union + a `{id, path}` registry entry), not by importing its code. The audit's "single dormant importer" framing inherited that blind spot. A retirement's true blast radius must be read from the registry/config wiring, not only the import graph. Candidate for the static-analysis-tool discipline (sibling of the reachability-v2 work); recorded here, deferred to a codify ship.

## Process notes

- Derive a disposition roster from a live `adoption-scan` + import-graph trace, not from a plan's prose count — the verified 8 matched the settled count, and the trace also explained *why* `lyapunov`/`projection` mis-read as `living`.
- When a ship deletes a `src/` subsystem, run the full pre-tag-gate (or at least the manifest-drift test) locally before pushing; the targeted suite is blind to inventory drift.
