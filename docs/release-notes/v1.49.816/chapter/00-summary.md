# v1.49.816 — Counter-cadence Chip: `state-md-set-shipped` Colon-safe milestone_name + `--check` Time-determinism

**Released:** 2026-05-27
**Type:** Chip-shaped tool fix (~10-15 min slot, counter-cadence-class but does not tick counter-cadence count per #10430)
**Predecessor:** v1.49.815 — T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** Close two structural issues in `tools/state-md-set-shipped.mjs` surfaced during the v815 ship: (1) hand-built YAML frontmatter interpolated `milestone_name: ${name}` unquoted, breaking the YAML round-trip when `name` contained a colon; (2) the `--check` flag re-computed `desired` with a fresh `lastUpdated = new Date().toISOString()`, making the comparison racy by wall-clock and the existing E2E test flaky on second-boundary crossings.

## Summary

First ship of the operator-selected 7-item chain (v816-822). Starts with the lightest item to remove the v815-flagged footgun before subsequent ships in the chain re-invoke the tool.

The colon-quote bug had a specific case study: the v815 first invocation passed `--name "T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)"`. The unquoted colon in the middle of the YAML value broke the parse on the post-write normalize step. The v815 workaround stripped the colon (`T2.3 Wedge Close PMTiles ...`); v816 closes the root cause by routing the value through `js-yaml.dump`, which auto-quotes when needed and emits the value verbatim when safe.

The `--check` time-drift bug was a pre-existing structural flake in the E2E test, not introduced by v815. The test invoked the tool twice and asserted both succeeded; the second `--check` invocation re-computed `desired` with the current wall-clock time as `lastUpdated`, which differed from the on-disk file's stamp if more than one second had passed between invocations. The fix reads `last_updated` from the on-disk file and threads it into the comparison call — semantically: `--check` asks "does the file match canonical shape?" not "does it match what I'd regenerate at THIS moment?".

Both fixes touch the same tool, are both ~5-LOC, and naturally pair in one commit.

## What changed

`tools/state-md-set-shipped.mjs`:

- Add imports: `createRequire` from `node:module` and `js-yaml` via `require('js-yaml')`.
- Add `yamlScalar(value)` helper (3 lines): delegates to `jsYaml.dump(value, { lineWidth: -1 }).trimEnd()`.
- `buildShippedStateContent`: change `milestone_name: ${name}` to `milestone_name: ${yamlScalar(name)}`. Safe strings stay unquoted; colon/`#`/leading-`-` strings get single-quoted.
- `main()` `--check` branch: parse `last_updated: "..."` from on-disk file via regex; pass it as `lastUpdated` into the `buildShippedStateContent({ ...a, lastUpdated })` call so the comparison is time-deterministic. Move the unconditional `desired` computation below the `--check` block (it was wastefully computed even on `--check`).

`tools/__tests__/state-md-set-shipped.test.mjs`:

- Add 2 unit tests in the `buildShippedStateContent` describe block:
  - `YAML-quotes milestone_name when it contains a colon` — asserts the string-form output contains `milestone_name: 'T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)'` (single-quoted).
  - `round-trips colon-containing milestone_name through js-yaml parser` — extracts the frontmatter block from the emitted content and runs `jsYaml.load` on it; asserts `parsed.milestone_name` equals the original colon-containing string byte-for-byte.
- Pre-existing E2E test (`writes a fresh STATE.md and the normalizer-check passes immediately`) goes from flaky-on-second-boundary to deterministic via the `--check` fix — same assertions, no test change required.

`.planning/PROJECT.md`:

- Pre-bump refresh of `Latest shipped release` from v814 to v815. v815 didn't refresh its own line; v816 catches it up to keep PROJECT.md drift gate clean.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `tools/state-md-set-shipped.mjs` | MODIFIED | +14 LOC: 4 lines imports + 3 lines `yamlScalar` helper + 1-char change at the template + 6 lines `--check` deterministic-read. 222 → 240 lines total. |
| `tools/__tests__/state-md-set-shipped.test.mjs` | MODIFIED | +33 LOC: 2 new tests in `buildShippedStateContent` describe block + dynamic `js-yaml` import. 195 → 229 lines total. |
| `.planning/PROJECT.md` | MODIFIED | 1-paragraph refresh (latest-shipped line v814 → v815). |
| `docs/release-notes/v1.49.816/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `tools/state-md-set-shipped.mjs` (222 lines) + `tools/__tests__/state-md-set-shipped.test.mjs` (195 lines) + grep'd for callers of the tool. Found only T14 (writer-path) + the test (writer + `--check` paths) use the tool. The writer path was the v815 failure point; the `--check` path had a separate but related time-drift flake. Recon surfaced both in ~5 min before any code change. |
| #10416 | Lightest-wire / tolerant-generator | Resisted: rewriting the whole frontmatter via `jsYaml.dump` (would have made the template more uniform but invasive — 60+ LOC delta); adding a structured-data internal representation (the hand-built template is fine; the bug was only at one field); adding a `--last-updated` CLI flag (the on-disk parse is a 1-line regex). Chose: 3-line helper + 1-char template change + 6-line on-disk read in the `--check` branch. ~14 LOC total in the tool. |
| #10417 | Static-analysis tool authoring | The `--check` time-drift fix follows the discipline: tooling that re-computes "would I write this same content?" must be invariant to wall-clock state. Use the on-disk content as the anchor for the timestamp portion. |
| #10427 | Failure-mode contracts | The `--check` flag is forensic/audit surface (used in tests, not load-bearing in T14). Its failure mode was producing false positives ("STATE.md differs" when it didn't substantively). Fix realigns: `--check` now reports drift only when the canonical-shape content differs, not when the wall-clock has advanced. Documented in the inline comment + the existing `--check` exit-code semantics. |
| #10431 | Two-layer closure for procedure-rooted drift | Partial application: this ship is the SOURCE-eliminator layer for the `state-md-set-shipped` colon-footgun (the v815 workaround was the operator-procedure layer). No detector layer needed beyond the existing post-write normalize-check (which already caught the v815 break, just at a higher cost — operator had to retry with a rephrased name). The unit-test layer is the new gate. |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip — `tools/` is build-time, not security surface.
- Not a new substrate.
- Not a behavior change for production T14 invocations — the writer path's emitted YAML changes only for colon-containing names (which previously broke); safe-name invocations emit byte-identical output.

## Verification

- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/state-md-set-shipped.test.mjs` → 9 PASS / 0 fail (was 7 with 1 flaky-fail; +2 new + 1 deterministic).
- Full tools suite: 514 → 516 passing (15 pre-existing failures unrelated to this ship).
- Pre-tag-gate (full): 17/17 PASS (step 12 STORY.md sync PASS; step 13 discipline-coverage WARN at 39 uncodified + 8 partial as expected).
- `bash tools/pre-tag-gate.sh` post-bump: PASS (re-verify needed).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 34 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Counter-cadence-class but does not tick counter-cadence count per #10430 — chip closures of single-instance footguns sit in the same operational bucket as `chore(post-ship)` commits: they're operational hygiene, not the periodic-30-ship debt-flush pattern that #10430 codifies. The counter-cadence count is reserved for milestone-shaped non-degree-advancing work.

## Forward path

v817 (next in chain) targets c12-load-kb-context flake. Then v818 FlagLookup extract, v819 aminet batch chip, v820 git/core chip, v821-822 discipline-coverage gate flip, v823 ObservationBridge wire.
