# Static-Analysis Tool Authoring Discipline

**Surface:** Authoring or extending a CLI tool in `tools/` that scans the codebase, emits metrics, or produces a comparable report; designing its test harness; piping its output to another command.

**Codified at:** v1.49.790 (lesson cluster from v1.49.785-v1.49.789 — the adoption-telemetry build chain plus the PROJECT.md normalizer surfaced five distinct authoring pitfalls in close sequence). **Extended at v1.49.794** with #10424 (refuse-to-overwrite guard for version-stamped baseline files), after v791 trip + 2 sequential clean applications at v792 + v793. **Extended at v1.49.886** with #10450 (parsers must handle code-shape variants or fail loudly). **Extended at v1.49.924** with #10463 (staged CI-lane promotion via a non-blocking matrix leg + its structural drift-guard).

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

### Static-analysis tool parsers must handle common code-shape variants OR fail loudly (Lesson #10450)

Static-analysis tools that parse source code to emit findings are themselves parsers — and their parsers can be wrong. When a tool greps for an import shape (`/import\s+\{([^}]+)\}\s+from/`) or names a token (`/]\s*\)/` as the terminator of a `Set` literal), the regex encodes assumptions about what source code looks like. When the assumption fails, the tool produces incorrect findings *silently* — it doesn't crash, it just emits the wrong answer.

This is a sibling discipline to [failure-mode contracts](failure-mode-contracts.md) (#10427): a tool whose entire purpose is to surface silent failures must not itself fail silently. A false positive trains operators to dismiss findings; a false negative hides real problems. Both are worse than a tool that crashes loudly on input it doesn't know how to parse.

**Two real-world instances in the same tool:**

- **v1.49.867** — `tools/security/check-stale-known-unwired.mjs` regex for KNOWN_UNWIRED set terminator was `/]\s*\)/`. The pattern matched `])` inside a code comment that said `"all errors return [])"` and treated the comment as the set's terminator, dropping every entry after the comment. **False negative** — entries silently dropped from scanning. Fixed by hardening the regex to require multi-line flag + line-anchored closing brace.

- **v1.49.885** — Same tool's Shape B detector stripped `as <alias>` from named imports and searched the file body for the ORIGINAL name. For `import { promises as fs } from 'node:fs'` (active idiom in production code) followed by `fs.readFile(...)`, the file uses the alias actively but the detector reported it as stale (import-without-use). **False positive** — a real-world entry surfaced as fake. Fixed by extracting the local binding (`Y` from `X as Y`) instead of the original name.

Two parser bugs in the same tool, two different shapes (false negative vs false positive), both surfaced through real-world use rather than test fixtures. The discipline-level lesson: tool sanity-fixtures should exercise common code-shape variants the parser may encounter:

1. **Aliased named imports** (`import { X as Y } from ...`).
2. **Brackets inside comments** (`/* matches [] */`, `// here is [])`).
3. **Namespace imports** (`import * as ns from ...`).
4. **Dynamic imports** (`await import(...)`).
5. **Re-exports** (`export { X } from ...`).

A new chokepoint added to a cross-cutting tool's AUDITS array should include sanity-test fixtures for the shape combinations the chokepoint surface may use. If the surface uses `import { X as Y }` heavily and the tool's tests only cover `import { X }`, add the aliased fixture before shipping.

**Mitigating discipline:** add inline assertions inside the tool that compare structural-view counts against ground-truth counts (`assert(extractedEntries.length === knownUnwiredFileLineCount)`). When the counts diverge, the parser is wrong about the shape it just scanned.

**Validation.** Two instances; both in `check-stale-known-unwired.mjs`. The first (v867) was caught by continuous-verification mode (operator re-running tool after each chip ship); the second (v885) was caught by the LoaderContext addition surfacing the false positive on the first run. Both bugs would have been caught at tool authoring time if sanity-fixtures had covered the relevant code shape — neither was caught at authoring time because the fixture set was incomplete.

**Anti-pattern.** Shipping a parser-driven static-analysis tool whose test fixtures cover only the simplest input shapes. The tool's correctness becomes operator-vigilance-bound — every new chokepoint added is a risk surface for surfacing a latent bug.

### Staged CI-lane promotion via a non-blocking matrix leg (Lesson #10463)

Promoting an unproven CI lane (a new OS, runtime, or toolchain) straight into the ship-blocking workflow couples ship cadence to a lane with no track record: a flaky or genuinely-broken leg can red-block a release at T14. Decoupling the lane entirely (a separate no-push nightly workflow) is the safe-but-blind opposite extreme — it never blocks a ship, but produces no per-push signal, so regressions surface late. The **staged** middle rung is a matrix leg that runs on every push yet cannot block a ship:

```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, macos-latest]
runs-on: ${{ matrix.os }}
continue-on-error: ${{ matrix.os == 'macos-latest' }}
```

`continue-on-error` on the new leg (gated on the new matrix dimension value) plus `fail-fast: false` (so a red new-leg never cancels the proven leg) buys immediate per-push signal — the lane runs on every push and a failure shows a visible red X on that leg — while keeping the **run-level conclusion**, which the ship gate reads, unaffected by the new leg's outcome.

**Empirically-established supporting fact — verify against ground truth, not docs/reasoning (#10427 sibling).** A job-level `continue-on-error` matrix leg that FAILS still yields a run-level conclusion of `success` — **UNLESS** a `needs: [<job>]` downstream job consumes the deceptive per-leg success, in which case that downstream job can fail the run and re-couple the lane to the ship gate. When the workflow's jobs are independent (no `needs:` edge into the matrixed job), the masking is clean. This was settled with an isolated throwaway-branch probe (a passing blocking leg + a failing `continue-on-error` leg → failing leg `failure`, run-level conclusion `success`) after an adversarial review put a *sourced* blocker on the assumption — the cited "the workflow fails" cases all involved a `needs:` downstream, which this repo's `ci.yml` does not have. Secondary sources set the hypothesis; the probe was the test.

**The drift-guard is the enforcement layer (sibling of #10461 — gate-enforce-every-runnable-surface + drift-guard pairing).** A structural parity test (`tests/integration/ci-matrix-parity.test.ts`) pins the matrix shape, the staged `continue-on-error` property, and the retired lane's absence. Because the guard asserted the `continue-on-error` line *exists*, the **load-bearing flip** — deleting `continue-on-error` once a green track record accumulates — was forced to be a deliberate act that also updated the test; a silent flip fails CI. That is the #10461 discipline (pin the property AND make every edit to it update the guard) applied to a CI-config invariant rather than to a code allowlist. **The flip executed at v1.49.928**: the same commit deleted the line and *inverted* the guard, which now pins the line's **absence** (re-staging the macOS leg as non-blocking is the deliberate reverse act that must update the guard).

**Promote on a track record, not a single green (#10428 meta-cadence — staged rungs over a one-shot promotion).** The three rungs are: decoupled nightly lane → non-blocking matrix leg → load-bearing leg. The flip from the second rung to the third is deferred until N consecutive green pushes of the new leg accumulate — and "green pushes from the promotion ship itself" do not count as a diversity track record; the data must come from organic development churn across diverse changes.

**Checking the lane's health.** Because the run-level conclusion is green even when the staged leg reds, the leg's true health is read from the **job** conclusion, not the run conclusion:

```bash
gh run view <id> --json jobs \
  -q '.jobs[] | select(.name|contains("<new-dim>")) | .conclusion' -R <owner/repo>
```

**Operationalizing the flip gate — the readiness checker (gate-not-vigilance, #10428 sibling).** "N consecutive green pushes across organic churn" left as prose is operator-vigilance-bound, and it is *easy to misjudge*: at v1.49.924 the macOS leg was 9-for-9 green, yet every one of those greens was a docs / release / CI-config ship that re-ran an unchanged test surface — zero organic development churn. `tools/ci/macos-flip-readiness.mjs` makes the gate deterministic: it reads the **job** conclusion of each recent `ci.yml` run (never the masked run conclusion), classifies each commit's churn, and reports the consecutive organic-green streak against N.

- **Organic-churn predicate (a tight allow-list — when in doubt, inert).** A commit is *organic* iff it touched a test-bearing root (`src/`, `tests/`, `.college/`, `www/`, `tools/`, `scripts/`) or one of the test-config files the macOS leg actually runs — an EXACT list (`tsconfig.json`, `vitest.config.ts`, `vitest.tools.config.mjs`), not a glob, so `vitest.bench.config.mjs`/`vitest.dashboard.config.mjs` are correctly inert (the leg never runs them). Everything else is *inert* and transparent to the streak (neither counts nor breaks it). **`package.json` / `package-lock.json` are deliberately INERT** — the version bump in every `chore(release)` commit touches both, so counting them marked every release "organic" and produced a spurious READY 3/3 (caught only by running the tool against ground truth — #10427). The cost is a conservative miss (a rare pure dep-upgrade, or a new test-config file not yet added to the exact list, is undercounted), which only *defers* the flip — the safe direction.
- **Streak semantics.** Walk newest→oldest: organic green increments the streak; an organic non-green (`failure`/`timed_out`/`cancelled`/`action_required`) breaks it; an organic commit with no leg verdict (`skipped`/`null`/`stale`/`startup_failure`, e.g. before the leg existed) is transparent. Only a real `success` advances the streak, so unknown conclusion states can never advance the flip. Misclassification bias is toward DEFERRING the flip, never advancing it on weak evidence. Limitation (no-silent-caps, #10421): the streak proxies diversity by *consecutive distinct organic commits* and is bounded by the `--limit` scan window (the checker flags `windowExhausted` + hints a larger `--limit` when the streak ran out of window rather than hitting a red); it does not measure how varied those commits are — eyeball the detail table before flipping.
- **Advisory, not a gate (failure-mode-contracts).** Exit `0`=READY, `1`=NOT READY, `2`=indeterminate (gh/git unavailable). Nothing auto-runs it as a ship blocker; the flip stays a deliberate operator act that ALSO updates the drift-guard. Usage: `node tools/ci/macos-flip-readiness.mjs` (`--json`, `--n=`, `--limit=`, `--runs-file=` for tests).

**Reference implementation.** `.github/workflows/ci.yml` (`test` job, `strategy.matrix.os` — both legs load-bearing after the v1.49.928 flip; the macOS leg no longer carries `continue-on-error`) + `tests/integration/ci-matrix-parity.test.ts` (the drift-guard, inverted at v928 to pin the line's absence) + `tools/ci/macos-flip-readiness.mjs` (the readiness checker) with `tools/ci/__tests__/macos-flip-readiness.test.mjs`. Introduced v1.49.923 (the macOS lane's second rung); the v920 decoupled `ci-macos.yml` lane was the first rung and was retired in the same ship; v1.49.928 was the third rung (load-bearing flip).

**Anti-pattern.** Full-promoting an unproven lane straight into the ship-blocking matrix with no `continue-on-error` staging — a flaky or broken leg can red-block a ship at T14, which is exactly what a decoupled lane was avoiding. Second anti-pattern: deleting `continue-on-error` to make a lane load-bearing without updating the drift-guard — a guard that pins the staged line fails CI (correct), but a guard that does *not* pin the property lets the flip happen silently with no record.

**Validation.** Single-instance promotion at v1.49.923 (operator-authorized codification at v1.49.924); the empirical GitHub-Actions masking fact — verified on a real throwaway-branch run — is the load-bearing evidence rather than a three-instance pattern count. The drift-guard `ci-matrix-parity.test.ts` (9 tests) is green. **The load-bearing flip EXECUTED at v1.49.928** — the third and final rung. The gate (`macos-flip-readiness.mjs`) reached **READY — streak 3/3** once organic-churn greens accumulated (v926 banked organic green #2, v927 #3), and the flip deleted `continue-on-error` and *inverted* the drift-guard in one commit; the gate's deterministic READY verdict drove the flip with no operator vigilance (gate-not-vigilance validated end-to-end). The checker authoring itself had earlier surfaced a predicate bug against ground truth (package*.json inflating release commits to "organic" → spurious READY 3/3), a fresh instance of #10427 (verify against ground truth, not reasoning). The same v928 ship made the checker **lifecycle-aware** (closing a self-referential #10427: a flip-gate tool that keeps printing "Safe to flip: delete `continue-on-error`" *after* the line is gone is itself stale guidance). It now reads ci.yml via `detectFlipState()` and, once the leg is load-bearing, switches its READY guidance to "already flipped (v1.49.928) — here is how to REVERT"; the streak math is unchanged and becomes informational post-flip.

## When this discipline kicks in

- About to scaffold a new `tools/*.mjs` or `tools/*.ts` CLI that scans the repo.
- About to add `process.exit()` after a `write()` of unknown size.
- About to write a test harness for a CLI that uses WARN-on-exit-0 (story-drift, discipline-coverage, project-md, adoption-refresh, dacp drift-check, sps-cohort-uniqueness, others).
- About to add a new metric-emitting analyzer that operators will want to track over time.
- About to ship the FIRST run of a diff-emitting observability tool.
- About to promote an unproven CI lane (new OS / runtime / toolchain) into the ship-blocking workflow, or to author a structural drift-guard that pins a CI-config invariant (matrix shape, staged-leg property, retired-lane absence).
- About to flip a staged (`continue-on-error`) CI lane to load-bearing — run the readiness checker (`tools/ci/macos-flip-readiness.mjs`) first to confirm a green track record across organic churn, not just greens from release/CI ships.

## Anti-pattern summary

- ❌ `execSync` in a test harness for a CLI that may exit 0 with stderr.
- ❌ Hard-coded single importer root for a cross-module analyzer.
- ❌ Stdout-only report from a metric-emitting analyzer (no baseline file).
- ❌ `process.exit()` immediately after a large `process.stdout.write()`.
- ❌ Silent first-run message from a diff-emitting tool.
- ❌ Version-stamped baseline writer with no overwrite guard — trusts handoff prose to enforce a sequencing invariant that the tool itself can enforce.
- ❌ Full-promoting an unproven CI lane straight into the ship-blocking matrix (no `continue-on-error` staging) — a flaky leg can red-block a ship at T14; or flipping a staged leg to load-bearing without updating its drift-guard.

## Lesson references

- **#10417** — Test-harness stderr-capture: prefer `spawnSync` over `execSync`. Promoted from v785 candidate.
- **#10418** — Static analyzers must scan multiple importer roots. Promoted from v786 candidate.
- **#10419** — Static-analysis tools commit a baseline so future runs can diff. Promoted from v786 candidate.
- **#10420** — `process.exit()` during pending stdout write truncates output at pipe-buffer boundaries. Promoted from v787 candidate.
- **#10421** — Observability tools have a warm-up period before their primary value works. Promoted from v787 candidate; **field-validated at v789** by adoption-baseline diff emitting exactly the predicted line.
- **#10424** — Version-stamped baseline writers refuse to overwrite existing files whose content would differ, unless `--force`. Promoted from v791 candidate at v794 simultaneously with the gate implementation; meta-principle: migrate prose-in-handoff sequencing warnings to deterministic gates after one trip + 2-3 sequential clean applications under vigilance.
- **#10450** — Static-analysis tool parsers must handle common code-shape variants OR fail loudly. Two-instance promotion: v867 (regex terminator inside comments — false negative) + v885 (alias-stripping in named-import extractor — false positive). Sibling discipline to #10427 failure-mode contracts: tools surfacing silent failures must not themselves fail silently. Mitigating discipline: tool sanity-fixtures should exercise aliased imports / brackets-in-comments / namespace imports / dynamic imports / re-exports.
- **#10463** — Staged CI-lane promotion via a non-blocking matrix leg: `continue-on-error: ${{ matrix.<dim> == '<new>' }}` + `fail-fast: false` is the intermediate rung between a decoupled-nightly lane and a load-bearing one — per-push signal without ship-blocking power. Empirical GitHub-Actions fact (verified on a throwaway-branch probe): a job-level `continue-on-error` leg that fails still yields run-level conclusion `success` unless a `needs:[<job>]` downstream consumes the per-leg success. The drift-guard `tests/integration/ci-matrix-parity.test.ts` is the #10461 enforcement layer; the load-bearing flip (deleting `continue-on-error`) is a deliberate test-updating act. Sibling of #10428 (meta-cadence — staged rungs over one-shot promotion). Promoted from v1.49.923 candidate; codified v1.49.924 (single-instance, operator-authorized — the empirical masking fact is the load-bearing evidence). **The load-bearing flip executed at v1.49.928** (the gate hit READY 3/3 across organic churn), completing the three-rung sequence; the drift-guard inverted to pin `continue-on-error` absence.
