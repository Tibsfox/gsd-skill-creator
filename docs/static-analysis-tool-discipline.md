# Static-Analysis Tool Authoring Discipline

**Surface:** Authoring or extending a CLI tool in `tools/` that scans the codebase, emits metrics, or produces a comparable report; designing its test harness; piping its output to another command.

**Codified at:** v1.49.790 (lesson cluster from v1.49.785-v1.49.789 — the adoption-telemetry build chain plus the PROJECT.md normalizer surfaced five distinct authoring pitfalls in close sequence). **Extended at v1.49.794** with #10424 (refuse-to-overwrite guard for version-stamped baseline files), after v791 trip + 2 sequential clean applications at v792 + v793.

## Why this discipline exists

Tools in `tools/` that walk the repo and report on it (analyzers, baseline generators, dashboards, normalizers, drift checkers) share a small set of authoring foot-guns. Five consecutive ships (v785 normalizer + v786 adoption-scan + v787 adoption-refresh + v789 dacp drift-check) each surfaced at least one. The patterns below are the result of paying each bill once.

## Discipline patterns

### Test harnesses use `spawnSync`, not `execSync` (Lesson #10417)

When writing a vitest harness around a Node CLI under test, prefer `spawnSync('node', [scriptPath, ...args], { encoding: 'utf8' })` over `execSync(cmd)`. `execSync` only surfaces `stderr` via its catch path (when the child exits non-zero); on exit 0 the buffer is dropped and the helper has to hard-code `stderr: ''`. This compounds for WARN-only gates — story-drift, discipline-coverage, sps-cohort-uniqueness, project-md — where the whole point is "exit 0 but emit a warning to stderr." With `execSync` the warning vanishes; the test cannot assert on it.

**Anti-pattern.** A test helper that returns `{stdout: execSync(...).toString(), stderr: ''}`. The empty `stderr` is a structural lie about what the CLI emitted.

**Reference implementation.** `src/cli/commands/dacp-drift-check.test.ts` and the adoption-refresh test harness — both use `spawnSync` from line 1.

**Validation.** Applied at v785 (normalizer test), v786 (adoption-scan test), v787 (adoption-refresh test); cleanly prophylactic by the third instance.

### Scan all importer roots, not just the target tree (Lesson #10418)

A cross-module-adoption analyzer that walks only `src/` will misclassify any module whose callers live in tooling (`tools/`, `scripts/`), the desktop frontend (`desktop/`), or the Rust side (`src-tauri/`). The classification "test-only" should mean "no real callers anywhere in the repo," not "no real callers under `src/`."

**Anti-pattern.** Hard-coding the scan root to `src/`. Convenient at first; produces a steady stream of false positives that erode the report's trust.

**Reference implementation.** `tools/adoption-scan.mjs` accepts a list of importer-root directories and defaults to `['src', 'tools', 'scripts', 'desktop']`. The default list lives in one place; new roots are added there, not inline.

**Validation.** v786 first scan flipped 2 modules from test-only to living after extending the scan to `tools/`.

### Commit a baseline file so future runs can diff (Lesson #10419)

A static analyzer that emits only to stdout produces one-shot reports — there is no second-order surface. A static analyzer that overwrites a committed baseline (`docs/<TOOL>-BASELINE-vN.{md,json}`) produces a comparison surface: future runs compute "what changed" cheaply via `git diff`. The commit history IS the diff.

Emit both shapes:

- **`.md`** — human-readable snapshot operators read in PR review.
- **`.json`** — machine-readable snapshot the refresh tool reads to compute the next diff.

**Anti-pattern.** Emitting only stdout. Operators have to re-run the tool to see "what changed since last week" instead of opening `git log -p` on the baseline.

**Reference implementation.** `tools/adoption-refresh.mjs` writes `docs/ADOPTION-BASELINE-v<version>.{md,json}` and prints a diff vs the prior baseline.

**Validation.** First useful diff (`↑ semantic-channel: test-only → living`) emitted at v789, exactly as the warm-up-period lesson predicted.

### Flush stdout before `process.exit()` (Lesson #10420)

When a Node CLI calls `process.stdout.write(largeString)` and immediately `process.exit(code)`, the kernel may discard the unwritten portion if the pipe reader hasn't drained. Linux default pipe buffer is 64 KB; outputs above that size truncate when piped (`a | b`) even though they survive a redirect to file (`a > file`).

Use an `exitWhenDrained(code)` helper that subscribes to the `'drain'` event before exit:

```js
function exitWhenDrained(code) {
  const exit = () => process.exit(code);
  if (process.stdout.writableNeedDrain || process.stderr.writableNeedDrain) {
    let pending = 0;
    if (process.stdout.writableNeedDrain) { pending++; process.stdout.once('drain', () => { if (--pending === 0) exit(); }); }
    if (process.stderr.writableNeedDrain) { pending++; process.stderr.once('drain', () => { if (--pending === 0) exit(); }); }
  } else exit();
}
```

**Anti-pattern.** `process.stdout.write(json); process.exit(0)` for any CLI that may emit >64 KB. The truncation is silent in the happy path and only surfaces when a downstream consumer parses the result.

**Validation.** v787 adoption-scan emitting 168 KB JSON truncated at byte 65536 when piped to the dashboard renderer; fixed via drain-then-exit.

### Document the warm-up period (Lesson #10421 — ESTABLISHED, field-validated v789)

Observability tools whose primary value is "diff vs prior state" have a warm-up period: the first run has no prior state to compare against. The diff feature does not activate until the second run. Document this explicitly in:

1. The release notes for the ship that introduces the tool.
2. The tool's own `--help` output or first-run banner.
3. The handoff or operator-facing surface that operators read before invoking the tool.

**Field validation.** v787 introduced `tools/adoption-refresh.mjs` and predicted in its own retrospective that the first useful diff would emit at v788+. v789 (the next ship using refresh) produced exactly the predicted diff — `↑ semantic-channel: test-only → living`. Promotion from candidate to ESTABLISHED is anchored on this single self-verifying prediction.

**Anti-pattern.** Shipping a diff-emitting tool whose first-run message is silent or generic ("no changes"). Operators read "no changes" as "tool works, nothing happened" rather than "first run, no prior baseline." The next ship's operator sees the same silence and concludes the tool is broken.

### Refuse to overwrite version-stamped baseline files (Lesson #10424 — ESTABLISHED, v794)

A tool that writes `docs/<TOOL>-BASELINE-v${PACKAGE_VERSION}.{md,json}` embeds the current `package.json.version` in the filename. If the operator runs the tool BEFORE running `bump-version`, the filename resolves to the PREDECESSOR'S version and the predecessor's committed baseline gets overwritten in-place with the successor's content. The trip is silent: no error, no warning, the working tree just diverges from `HEAD` for a file the operator did not intend to touch.

Prose-in-handoff warnings about the required sequencing don't survive multi-ship intervals — the v791 trip happened despite the v789 handoff + v790 codification retro both flagging the ordering. The fix is a deterministic guard at the tool level: refuse to overwrite when the target file exists on disk AND its content differs from what we'd write, unless `--force`.

The guard does NOT depend on git. It compares disk content to proposed content:

- **First-run** (file absent) → write.
- **Idempotent re-run** (content matches) → no-op write.
- **Overwrite-with-different-content** → refuse with helpful message; suggest `bump-version`; offer `--force` for retroactive baseline rewrites.

**Anti-pattern.** Trusting prose-in-handoff sequencing warnings to prevent overwrite of version-stamped artifacts. Handoff warnings decay; deterministic guards don't.

**Reference implementation.** `tools/adoption-refresh.mjs` `checkOverwriteGuard()` (added v794). Skips on `--dry-run` (read-only mode); overrides on `--force`.

**Validation.** Tripped at v791 (Lesson #10424 candidate); held clean across v792, v793 by operator vigilance alone; promoted to ESTABLISHED at v794 simultaneously with the gate implementation. Guard fires once correctly in the integration trip case; idempotent re-runs and first-runs pass unaffected.

**General principle (meta).** When a prose warning about non-obvious tool sequencing trips once and holds two-three ships under vigilance alone, migrate to a deterministic gate the next ship. The vigilance ledger is finite — convert the rule to code while the trip is still fresh.

## When this discipline kicks in

- About to scaffold a new `tools/*.mjs` or `tools/*.ts` CLI that scans the repo.
- About to add `process.exit()` after a `write()` of unknown size.
- About to write a test harness for a CLI that uses WARN-on-exit-0 (story-drift, discipline-coverage, project-md, adoption-refresh, dacp drift-check, sps-cohort-uniqueness, others).
- About to add a new metric-emitting analyzer that operators will want to track over time.
- About to ship the FIRST run of a diff-emitting observability tool.

## Anti-pattern summary

- ❌ `execSync` in a test harness for a CLI that may exit 0 with stderr.
- ❌ Hard-coded single importer root for a cross-module analyzer.
- ❌ Stdout-only report from a metric-emitting analyzer (no baseline file).
- ❌ `process.exit()` immediately after a large `process.stdout.write()`.
- ❌ Silent first-run message from a diff-emitting tool.
- ❌ Version-stamped baseline writer with no overwrite guard — trusts handoff prose to enforce a sequencing invariant that the tool itself can enforce.

## Lesson references

- **#10417** — Test-harness stderr-capture: prefer `spawnSync` over `execSync`. Promoted from v785 candidate.
- **#10418** — Static analyzers must scan multiple importer roots. Promoted from v786 candidate.
- **#10419** — Static-analysis tools commit a baseline so future runs can diff. Promoted from v786 candidate.
- **#10420** — `process.exit()` during pending stdout write truncates output at pipe-buffer boundaries. Promoted from v787 candidate.
- **#10421** — Observability tools have a warm-up period before their primary value works. Promoted from v787 candidate; **field-validated at v789** by adoption-baseline diff emitting exactly the predicted line.
- **#10424** — Version-stamped baseline writers refuse to overwrite existing files whose content would differ, unless `--force`. Promoted from v791 candidate at v794 simultaneously with the gate implementation; meta-principle: migrate prose-in-handoff sequencing warnings to deterministic gates after one trip + 2-3 sequential clean applications under vigilance.
