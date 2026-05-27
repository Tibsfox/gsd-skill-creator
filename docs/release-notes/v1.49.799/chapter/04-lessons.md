# 04 — Lessons Learned: v1.49.799 T1.1 Ship 5

## 0 candidates emitted; 0 promoted to ESTABLISHED

v799 is a clean new-module ship reusing the v798 registry. No new design choices surfaced; no new traps caught; no lesson candidate emitted.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 12th consecutive application since v784 codification. Read the `.planning/patterns/` directory contents BEFORE choosing the audit-log filename and naming convention. Confirmed JSONL is the established convention.
- **#10422 (Verdict-pattern surface separation)** — 9th forward application. The audit-log module is a new surface separate from the registry, calibration loop, threshold writer, and CLI command. Each surface has its own test file.
- **#10423 (Lightest wire that satisfies the verdict)** — 9th forward application. Resisted four temptations: retention/rotation, schema version field, query subcommand, indexed binary format. The audit log is intentionally the minimum that satisfies "every invocation leaves a forensic record."
- **#10424 (ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied. Sixth consecutive ship under the active gate.
- **#10426 candidate (v798) — APPLIED at first consumer.** v799 consumed the v798 registry verbatim via `observationSourceFor(rec.threshold)`. This is the first consumer downstream of the v798 extraction — validates the registry interface is sufficient without modification.

## #10425 promotion path discussion (NOT promoted this ship)

v799 has no e-process design surface; the audit log is a writer/reader pair that captures recommendation outputs. #10425 is not applicable this ship.

Status: **#10425 remains as MEDIUM-severity candidate at v799 close.**

## #10426 promotion path discussion (NOT promoted this ship)

v799 is the first CONSUMER of the v798 cross-class registry — validates the abstraction was extracted at the right shape — but the v798 extraction itself remains the first instance of the second-instance-extraction discipline. The promotion path is still:

- **(a) Second-instance forward-shadow** — another cross-class registry extraction surfaces in a future ship.
- **(b) Codification at next discipline-coverage codification ship.**

v799 doesn't independently re-derive the discipline. The consumer-side validation is supporting evidence, not the second instance.

Status: **#10426 remains as MEDIUM-severity candidate at v799 close.**

## Meta-observation: registry-extraction compounding

v798's per-class observation-source registry was the architectural-choice tax ship in the chained session. v799 demonstrates the compounding payoff: the audit log's per-entry observationSource field required only one line (`observationSourceFor(rec.threshold)`) in `buildAuditLogEntry`. Without the v798 extraction:

- Audit log would need to re-implement classification (~15-25 LoC + test surface).
- OR the recommendation object would need to thread source metadata through every primitive call (~5-8 file touches).
- OR every consumer would need to lookup classification separately (DRY violation).

The v798 extraction at the second class instance is now paying off at the third use (v799 consumer). This is the empirical case-study for #10426: extract at second instance, save effort at third+ instances.

## Cross-discipline observation: best-effort-silent contract for forensic surfaces

The audit-log write is best-effort silent: failures (disk full, permission denied) do NOT propagate to CLI output. The asymmetry is intentional:

- **Load-bearing operations** (calibration loop, threshold write) MUST fail loudly. Silent failure here would mean operator acts on stale/wrong data.
- **Forensic operations** (audit log, telemetry) SHOULD fail quietly. Silent failure here means the operator loses some history; loud failure here would gate the load-bearing operation on a non-load-bearing concern.

This is not yet a lesson candidate — single instance. If v800 (--watch mode error-handling) or v801 (/sc:status surfacing) repeats the pattern, it becomes worth codifying. Embedded note for the v800-v801 retros to watch for.

## Five-ship cadence baseline update

After five ships in the same vertical:

- New vertical (v795 ship 1): ~75 min.
- Same-class extension (v796 ship 2, cold-start): ~30 min.
- Same-class extension (v797 ship 3, chained): ~15-20 min.
- Cross-class extension + new module (v798 ship 4, chained): ~45-60 min.
- New module (v799 ship 5, chained): ~30-40 min.

The pattern is firming up:

- Same-class extensions: 15-30 min (very low overhead).
- Cross-class extensions + new module: 45-60 min (architectural-choice tax visible).
- Pure new-module ships consuming established abstractions: 30-40 min (architectural-payoff visible).

v800 (--watch mode, modifies existing command, no new module) should land in 30-45 min if the pattern holds.
v801 (/sc:status integration, modifies different existing command) should land in 30-45 min if the pattern holds.

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (unchanged)
Manifest lessons: 65 → 65 (no new formal ID)
Codified-vs-uncodified gap: 2 (unchanged — #10425 + #10426 both still candidates)

## Forward backlog (post-v799)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction; use Bonferroni-combined one-sided instead. | v795 design |
| #10426 candidate | MEDIUM | Extract per-class registries at the SECOND class instance, not the third. | v798 architectural-choice |
