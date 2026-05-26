# 04 — Lessons Learned: v1.49.790 Codification Ship

## 7 lessons promoted from candidate to ESTABLISHED (#10417–#10423)

These lessons formalize the candidate IDs from v785-v789's `04-lessons.md` files. Each lesson is now ESTABLISHED in the cumulative lessons-learned database and codified into a CLAUDE.md operative-discipline entry with a backing canonical doc.

### Static-analysis tool authoring discipline (5 lessons)

**Lesson #10417 — Test harnesses use `spawnSync`, not `execSync`.**
Severity: MEDIUM. When writing a vitest test harness around a Node CLI under test, prefer `spawnSync('node', [scriptPath, ...args], { encoding: 'utf8' })` over `execSync(cmd)`. `execSync` only surfaces `stderr` via its catch path (when the child exits non-zero); on exit 0 the buffer is dropped and the test cannot assert on warnings the CLI emitted. Promoted from v785 candidate after applications at v786 + v787 + v789. Apply: every new test harness for a CLI that may emit warnings on exit 0.

**Lesson #10418 — Cross-module analyzers scan multiple importer roots.**
Severity: MEDIUM. A cross-module-adoption analyzer that walks only `src/` will misclassify modules whose callers live in tooling (`tools/`, `scripts/`), the desktop frontend (`desktop/`), or the Rust side (`src-tauri/`). The classification "test-only" must mean "no real callers anywhere in the repo," not "no real callers under `src/`." Promoted from v786 candidate. Apply: every cross-module-import analyzer must accept (or default to) a list of importer-root directories beyond the target tree.

**Lesson #10419 — Metric-emitting tools commit a baseline file so future runs diff.**
Severity: MEDIUM. A static analyzer that emits only to stdout produces one-shot reports. A static analyzer that overwrites a committed baseline (`docs/<TOOL>-BASELINE-vN.{md,json}`) produces a comparison surface: future runs compute "what changed" via `git diff`. Emit both `.md` (human-readable) and `.json` (machine-readable) shapes. Promoted from v786 candidate. Apply: every metric-emitting static analyzer.

**Lesson #10420 — `process.exit()` during pending stdout write truncates output at pipe-buffer boundaries.**
Severity: MEDIUM. When a Node CLI calls `process.stdout.write(largeString)` and immediately `process.exit(code)`, the kernel may discard the unwritten portion if the pipe reader hasn't drained. Linux default pipe buffer is 64 KB; outputs above that size truncate when piped (`a | b`) even though they survive a redirect to file (`a > file`). Use an `exitWhenDrained(code)` helper that subscribes to the `'drain'` event before exit. Promoted from v787 candidate. Apply: every CLI in `tools/` that may produce >64 KB stdout output.

**Lesson #10421 — Diff-emitting observability tools document the warm-up period. (FIELD-VALIDATED v789.)**
Severity: LOW-MEDIUM. Observability tools whose primary value is "diff vs prior state" have a warm-up period: the first run has no prior state to compare against. Document the warm-up explicitly in release notes + the tool's own `--help` output + the operator-facing surface that operators read before invoking the tool. Promoted from v787 candidate; field-validated at v789 by the adoption-baseline diff emitting exactly the predicted line `↑ semantic-channel: test-only → living`. Apply: every observability tool whose primary value is diff/trend/comparison over time.

### Shelfware verdict patterns discipline (2 lessons)

**Lesson #10422 — Verdict-pattern surface separation is load-bearing.**
Severity: MEDIUM. The observability surface (scanner + dashboard + allowlist) and the decision surface (per-module wire-or-retire verdicts) MUST live in separate files and evolve independently. Operators can change verdict policy without touching the scanner; scanner changes don't invalidate prior verdicts. Promoted from v789 candidate. Apply: every observability surface that produces operator-decision input.

**Lesson #10423 — The lightest wire that satisfies the verdict is preferable to the most natural wire.**
Severity: MEDIUM. A WIRED verdict requires that the module move from `test-only` to `living` in the next adoption-scan. Default to the cheapest wire that matches the verdict's intent — a CLI subcommand usually suffices and preserves HARD-preservation invariants by not touching the surfaces those invariants protect. Defer richer in-loop wires to follow-on ships only if the verdict explicitly requires production use. Promoted from v789 candidate. Apply: every WIRED-verdict wire-site selection.

## Lessons-learned database state

- **Total lessons emitted to date:** 10423 (cumulative since corpus inception)
- **Lessons promoted this milestone:** 7 (#10417, #10418, #10419, #10420, #10421, #10422, #10423)
- **Lesson candidates closed:** 7 (#10417 from v785, #10418 + #10419 from v786, #10420 + #10421 from v787, #10422 + #10423 from v789)
- **Open lesson candidate backlog:** 0 (drained)
- **Manifest entries in `tools/render-claude-md/disciplines.json`:** 13 → 15 domains; 57 → 64 lessons
- **New canonical docs:** 2 (`docs/static-analysis-tool-discipline.md`, `docs/shelfware-verdict-patterns.md`)

## Lessons applied at v1.49.790 (from v1.49.789 and earlier)

- **#10412** (recon-first default) — applied: ~5 minutes of pre-ship recon on the 7 candidate descriptions + existing disciplines.json entries surfaced the natural 2-cluster grouping of the 7 lessons (vs the alternative 7-single-entry approach).
- **#10415** (deferred-maintenance escalation) — applied: the 7-lesson backlog crossed the historical codification threshold (5-8 candidates) at v787 + acquired field-validation at v789. Closing it at v790 honors the discipline being codified.
- **#10419** (commit a baseline) — re-validated: the v787 baseline.json was the mechanism that produced #10421's field-validation evidence at v789. Self-referential validation.
- **#10421 candidate** (warm-up period) — promoted to ESTABLISHED with v789 diff cited as field-validation evidence.

## Open lessons watchlist (apply at next opportunity)

- **#10417–#10421** (Static-analysis tool authoring) — apply at the next CLI authoring task in `tools/` (any analyzer, normalizer, refresh orchestrator, or drift checker).
- **#10422–#10423** (Shelfware verdict patterns) — apply at the second shelfware verdict ship (T1.2 ship 4).
