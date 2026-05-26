# 04 — Lessons Learned: v1.49.786 Adoption Telemetry Scanner

## 2 candidates emitted (#10418, #10419)

**Lesson #10418 candidate — Static analyzers must scan multiple importer roots.**
Severity: MEDIUM. When building a cross-module-adoption analyzer (or any static-analysis tool that classifies code by call-site presence), enumerate importer-root directories explicitly. A scanner that only walks the target tree (`src/`) will misclassify modules whose only callers live in tooling (`tools/`, `scripts/`), the desktop frontend (`desktop/`), or the Rust side (`src-tauri/`). Surfaced at v1.49.786 first scan: `scribe` showed as test-only despite heavy use from `tools/ftp-sync.mjs scribe` because the latter invokes scribe via shell CLI, not TS import — but extending the scan to `tools/` was nonetheless a 2-module net-positive on real-caller detection.
Apply: every cross-module-import analyzer must accept (or default to) a list of importer-root directories beyond the target tree.
Promotion track: candidate at v1.49.786; promotes to ESTABLISHED on second instance.

**Lesson #10419 candidate — Static-analysis tools commit a baseline so future runs can diff.**
Severity: MEDIUM. A static analyzer that emits only to stdout produces one-shot reports. A static analyzer that commits its output to `docs/<TOOL>-BASELINE-vN.md` produces a comparison surface — future runs compute "what changed" cheaply by git diff. Surfaced at v1.49.786 design: the adoption-scan was initially designed for stdout-only; reframed to commit `docs/ADOPTION-BASELINE-v1.49.786.md` mid-implementation. The commit-history view shows adoption drift over time: a substrate module moving from test-only to living, an isolated module gaining its first importer, a previously-living module losing its last real caller (regression candidate).
Apply: every metric-emitting static analyzer should ship with a baseline-commit discipline — overwrite the same file on re-run; the commit history IS the diff.
Promotion track: candidate at v1.49.786; promotes to ESTABLISHED on second instance.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — applied to the audit-to-ship transition for this milestone: ~10min reading `src/intrinsic-telemetry/` source before writing the scanner surfaced that the existing module is a pure-math Spearman library (correlation between signals + quality), NOT a runtime tracking facility. Recon-first prevented scope-creep into the wrong place.
- **#10414 (Optional `ctx?` chokepoint retrofit)** — analogous design pattern applied: the scanner accepts an optional `--root` argument that defaults to `process.cwd()`. Three states emerge: undefined → cwd-rooted (default); explicit `--root /path` → arbitrary location (test fixtures); future use → policy-restricted root. The first-ship cwd-default is the cheapest entry point.
- **#10416 (Tolerant generators)** — applied to the JSON output: when a module has zero importers of a particular class, the relevant array is `[]` not omitted or null. The output schema is uniform regardless of state.
- **#10417 candidate (test-harness stderr-capture)** — applied from v785: `spawnSync` used from the start of the test file, no `execSync` stderr-loss bug. Second instance of the pattern; on track for promotion to ESTABLISHED at next codification ship.

## What's now codified that wasn't before

Nothing in the manifest — this ship validates existing disciplines (gate-not-vigilance, recon-first, tolerant generators). The new #10418 + #10419 candidates await second instance for promotion. Total candidate backlog at v786 close: 3 (#10417 from v785, #10418 + #10419 from v786).

## Forward backlog

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10417 candidate | MEDIUM | Future test-harness authoring (CLI tools with WARN-on-exit-0) | v785 normalizer test fix |
| #10418 candidate | MEDIUM | Future cross-module static analyzers | v786 importer-root expansion |
| #10419 candidate | MEDIUM | Future metric-emitting static analyzers | v786 baseline commit decision |

If a fourth candidate emits before the next codification ship, the backlog will be ripe for a v1.49.654-style codification milestone (precedent: v1.49.654 codified ~5 candidates; v1.49.784 codified 8). Next codification ship is likely v1.49.790-795 range.

## Discipline-coverage status post-ship

Manifest entries: 13 → 13 (no new discipline domain — #10418/#10419 are candidates, not promoted)
Manifest lessons: 57 → 57 (no formal ID emitted; candidates await second instance)
Codified-vs-uncodified gap: unchanged
