# 02 — Walkthrough: v1.49.637 Housekeeping Cluster #4

Per-component technical walkthrough. Each section names the commit
SHA at HEAD-of-W3-pre-ship, the files touched, the load-bearing
invariants, and the test surface.

---

## C1 — Keystore: retire legacy-plaintext-keystore cargo feature

**Commit:** `ee012ffef` `refactor(keystore): retire legacy-plaintext-keystore cargo feature`
**Wave:** W1A.T1
**Net test delta:** -6 (8 retired + 2 added boundary assertions)

### What

Removed the `legacy-plaintext-keystore` cargo feature from
`src-tauri/Cargo.toml`. Deleted the three gated modules + the
gated test file + the gated re-export site. Added a boundary
assertion that `cargo build --features legacy-plaintext-keystore`
FAILS at the compiler layer with `unknown feature` error.

### Why

The feature was a backward-compat opt-in carrying the v1 plaintext-
keystore module forward from pre-v1.49.500 days. After the v1.49.636
hybrid Node-wrapper + Rust-bin architecture shipped (Path 1
OS-keyring + Path 2 age-encrypted file w/ Argon2id passphrase), no
caller exercised the legacy path. The feature was kept gated only
for migration-time disaster recovery, which v1.49.636 made
unnecessary via the M3-deferred Path-2 → Path-1 migration plan
(documented as future work).

### W0a substrate-probe finding

The mission spec assumed a single `#[cfg(feature = "...")]` gate
site. Actual shape was three gated modules + a re-export. C1 W0a
substrate-probe surfaced this before W1A start; spec adjusted to
include all three sites. **Lesson #10192 forward:** substrate-probe
should be part of mission-package authoring loop, not a W0 stage
discovery.

### Test surface

- Removed: 8 tests in the gated test file (no longer compileable).
- Added: 2 boundary assertions verifying the feature is unreachable.
- C8 meta-test: cargo negative-build (skip-guarded to
  `CARGO_AVAILABLE=1`).

### Files

| File | Change |
|---|---|
| `src-tauri/Cargo.toml` | Remove `[features] legacy-plaintext-keystore = []` |
| `src-tauri/src/keystore/legacy_v1.rs` | DELETE (gated module) |
| `src-tauri/src/keystore/legacy_migration.rs` | DELETE (gated migration helper) |
| `src-tauri/src/keystore/tests/legacy_v1_tests.rs` | DELETE (gated test) |
| `src-tauri/src/keystore/mod.rs` | Remove gated re-export |

---

## C2 — Keystore: polish migrate --to-keyring stub + add M3 design doc

**Commit:** `b817d39a2` `docs(keystore): polish migrate --to-keyring stub + add M3 design doc`
**Wave:** W1A.T2
**Net test delta:** +4

### What

Polished the existing `skill-creator-keystore migrate --to-keyring`
Rust-bin stub: clarified the M3-deferred error message, added the
`.planning/path-2-to-path-1-migration.md` cross-reference, mapped to
exit code 3 (M3 stub deferral). Authored the M3 design doc itself
covering operator-facing migration plan, backup strategy, rollback
recipe.

The TS-side `src/cli/commands/keystore.ts` help text documents the
flag with the M3 deferral note. The `MigrateCLIRecord` schema (Option
C from W0b NIT #5) aligns with the Rust bin's exit-code conventions
(0 = success, 1 = runtime error, 2 = usage error, 3 = M3 stub).

### Why

The v1.49.636 hybrid architecture established Path 1 (OS keyring) +
Path 2 (age-encrypted file) but left M3 (Path-2 → Path-1 migration)
deferred to v1.49.7XX. Operators discovering Path-2 + keyring
availability previously saw a generic error; C2 gives them a concrete
remediation message + doc pointer.

### Test surface

- CLI-help text inclusion of `--to-keyring` flag + M3 note
- Stub-output shape: exit code 3 + stderr message
- `MigrateCLIRecord` schema alignment (Option C)
- Help-text backward-compat preservation

### Files

| File | Change |
|---|---|
| `src-tauri/bin/skill-creator-keystore.rs` | Polish --to-keyring stub messaging |
| `src/cli/commands/keystore.ts` | Document --to-keyring flag in help text |
| `.planning/path-2-to-path-1-migration.md` | NEW (M3 design doc) |
| `src/keystore/migrate-cli-record.ts` | Schema alignment (Option C) |

---

## C3 — Keystore: zxcvbn-ts integration for R14 passphrase quality

**Commit:** `4baf23089` `feat(keystore): integrate @zxcvbn-ts/core for R14 passphrase quality enforcement`
**Wave:** W1A.T3
**Net test delta:** +13

### What

Integrated `@zxcvbn-ts/core` + `@zxcvbn-ts/language-en` (dictionary +
translations only — note that `@zxcvbn-ts/language-en` does NOT
export `adjacencyGraphs`; the keyboard graph is provided by
`@zxcvbn-ts/core` itself). Added `src/keystore/passphrase-quality.ts`
exporting:

- `validatePassphraseQuality(passphrase)` — returns
  `{ score, accepted, feedback }`
- `formatRejectionMessage(result)` — operator-facing rejection text
- `assertPassphraseQuality(passphrase)` — throws
  `PassphraseQualityError` if rejected
- `DEFAULT_MIN_SCORE = 3` (zxcvbn scale 0-4)
- `ENV_VAR_OVERRIDE = 'SC_PASSPHRASE_MIN_SCORE'`

Singleton zxcvbn-options pattern (W0b NIT #4 fold): dictionary loaded
once at module init, not per-call. Saves 50-200ms per validation
beyond the first.

Across 8 test sites in `passphrase-flow.test.ts`, the canonical
strong-fixture `hunter2` was replaced with
`correct horse battery staple stadium` (W1A CF-Nit 2 fold). The
prior fixture would now fail the score-3 boundary (zxcvbn rates
`hunter2` at 1, far below 3).

### Why

The v1.49.636 substrate accepted any non-empty passphrase. R14 was a
named carry-forward: passphrase quality must be enforced at the
keystore boundary, not as a separate operator-discipline check.

### W0a substrate-probe finding

Spec assumed `@zxcvbn-ts/language-en` exported `adjacencyGraphs`.
Actual API: `dictionary` + `translations` only. Spec adjusted before
W1A start; the keyboard-graph dependency is satisfied by
`@zxcvbn-ts/core` itself. **Lesson #10192 second instance.**

### Test surface

- `parseZxcvbnScore` boundary (0-4 valid; anything else rejected)
- Accept/reject boundary on each score (0 = reject; 4 = accept)
- Env-var override (`SC_PASSPHRASE_MIN_SCORE=0` accepts everything)
- Singleton init (no per-call dictionary reload)
- `formatRejectionMessage` shape
- `assertPassphraseQuality` throws on reject
- `PassphraseQualityError` class
- Cross-component fold: forward perf-advisory (50-200ms cost note in
  the W0b NIT #6 fold)

### Files

| File | Change |
|---|---|
| `package.json` | Add `@zxcvbn-ts/core` + `@zxcvbn-ts/language-en` deps |
| `src/keystore/passphrase-quality.ts` | NEW (~120 LOC) |
| `src/keystore/__tests__/passphrase-quality.test.ts` | NEW (~250 LOC, 13 tests) |
| `desktop/__tests__/passphrase-flow.test.ts` | 8 sites: hunter2 → correct horse battery staple stadium |

---

## C4 — Atlas: per-project-clear contract fix + cluster-5 defer lru-promote

**Commit:** `c94de08e5` `fix(atlas): C4 fix per-project-clear contract + cluster-5 defer lru-promote`
**Wave:** W1B.T1
**Net test delta:** +1 (disposition invariant)

### What

Dual-disposition outcome on the 2 atlas tests that v1.49.636 left
`#[ignore]`'d:

**Fixed inline**:
`per_project_clear_with_unknown_project_id_falls_back_to_full_clear`
— previously asserted `evicted == 0` under a "conservative count for
fallback path" mental model. The impl at
`clear_connection_cache_for_project()` line 553 delegates to
`clear_connection_cache()` which returns the **actual** eviction
count (read under the same lock as `cache.clear()` — line 442-455).
The `scope == "all"` flag is the disambiguator that signals
targeted-clear-didn't-apply; the count is honest. Test expectation
flipped to `evicted == 1` with rationale comment. `#[ignore]`
annotation REMOVED. Test now PASSES. Investigation cost: ~5min
(test-contract change; no impl modification).

**Cluster-5 deferred**:
`lru_access_promotes_keeps_entry_alive_under_eviction` — deeper
investigation revealed the test's mental model ("load p0+p1,
promote p0 manually, then load p2 → p1 evicts because it's now
LRU") doesn't match the impl's `get_all_project_conns()` at line
569-641 which enumerates EVERY project on every call (SELECTs all
paths, then for each path either promotes on cache hit or inserts-
with-eviction on cache miss). The architectural fix requires
batch-load semantics rework (2-4h beyond cluster #4 budget). Test
continues to carry `#[ignore]` with full diagnostic.

Disposition invariant test in
`tests/__tests__/atlas-test-disposition.test.ts` asserts continued
`#[ignore]` state on the lru-promote test + absent `#[ignore]` on
the fixed-inline test, by parsing `.planning/atlas-test-disposition.md`
and grepping `#[ignore]` annotations in `atlas.rs`. Skip-guarded per
Lesson #10180 when the disposition file is absent (fresh-clone CI).

### Why

v1.49.636 C4 disposed both as `temporary-skip` with a Cluster #4
followup. The deeper investigation at v1.49.637 surfaced different
root causes per test, justifying the dual disposition pattern.

### Test surface

- Atlas test count: 43 passed; 0 failed; 1 ignored (down from 2)
- Disposition invariant: per-test `#[ignore]` state matches record

### Files

| File | Change |
|---|---|
| `src-tauri/src/intelligence/atlas.rs` | Fix per_project_clear test contract; keep lru_access #[ignore] |
| `.planning/atlas-test-disposition.md` | Update with v1.49.637 dispositions |
| `tests/__tests__/atlas-test-disposition.test.ts` | Extend invariant assertions |

---

## C5 — Per-ship STORY.md sustained-update gate

**Commit:** `7c0075ddd` `feat(release-notes): per-ship STORY.md sustained-update gate (auto-append on tag)`
**Wave:** W1C.T1
**Net test delta:** +15

### What

Authored `scripts/append-story-entry.mjs` (~310 lines) with 7 named
exports:

- `readPackageVersion(pkgPath?)` — version string from package.json
- `findGroundTruthEntry(groundTruthContent, tag)` — locate the
  ground-truth entry for tag, returning the entry text or null
- `publicAlreadyHasEntry(publicContent, tag)` — boolean idempotency
  check
- `parseHeaderTag(publicContent)` — extract current tag from line 4
- `parseChapterCount(publicContent)` — extract `{ chapters,
  retrospectives }` from line 6
- `applyAppend(publicContent, groundTruthEntry, tag)` — return new
  content + metadata
- `appendStoryEntry(options?)` — orchestrator entrypoint

Wired as pre-tag-gate **step 10 of 10** in `tools/pre-tag-gate.sh`
(after step 9.5 apply-to-self; before final success log). Exit code
11 reserved for STORY-gate failure. `SC_SKIP_STORY_GATE=1` bypass
honored at top of main() before any I/O (emergency override cannot
fail on malformed inputs).

### Idempotency invariant

`publicAlreadyHasEntry` uses the SAME anchor pattern as
`findGroundTruthEntry` (`- **[${tag}](${tag}/00-summary.md)**`). The
orchestrator's already-present short-circuit returns BEFORE reading
ground-truth, so a re-run with no new tag does ZERO filesystem
mutation. Byte-equivalence asserted by test.

### Missing-ground-truth blocks

If the ground-truth file at `.planning/roadmap/STORY.md` does not
contain an entry for the current tag, the orchestrator throws
`GROUND_TRUTH_MISSING_ENTRY` (typed error code). CLI handler maps
to exit 1 with remediation message: "author the entry there BEFORE
running the gate". Gate genuinely blocks; no silent downgrade.

### Why

The v1.49.636 ship surfaced that STORY.md updates were operator-
discipline-only with no pipeline enforcement. A future ship could
quietly forget to update it; the gate prevents that.

### Test surface

15 tests in `scripts/__tests__/append-story-entry.test.mjs`:
5 pure-helper + 3 applyAppend + 7 orchestrator (including byte-
equivalence + idempotency + missing-ground-truth blocks + env-var
bypass + direct-invocation guard).

### Files

| File | Change |
|---|---|
| `scripts/append-story-entry.mjs` | NEW (~310 LOC) |
| `scripts/__tests__/append-story-entry.test.mjs` | NEW (~400 LOC, 15 tests) |
| `tools/pre-tag-gate.sh` | Add step 10/10 STORY-gate wiring + exit code 11 |

---

## C6 — STATE.md normalizer prose-body milestone-drift validator

**Commit:** `83b7f879f` `feat(state-md): extend normalizer to flag prose-body milestone drift`
**Wave:** W1C.T2
**Net test delta:** +13

### What

Authored `tools/state-md-normalizer-prose.mjs` with 6 named exports +
2 constants:

- `parseFrontmatterAndBody(content)` — split YAML frontmatter from
  markdown body
- `extractSectionContent(body, sectionHeader)` — ATX-only section
  extraction including the header line
- `validateProseSync(stateContent, options?)` — validator returning
  `{ pass, hardFail, warnings, allowlistedSkipped }`
- `validateProseSyncAtPath(statePath, options?)` — file-path wrapper
- `formatFindingsForStderr(result)` — operator-facing stderr text
- `DEFAULT_SECTIONS = ['### Branch State', '### Decisions']`
- `DEFAULT_ALLOWLISTED_HEADERS = ['### Carry-forward', '### Notes',
  '## Notes']`

Wired into `tools/state-md-normalizer.mjs --check` flow after the
existing frontmatter check. Exit 1 only on frontmatter drift OR
(`SC_REQUIRE_PROSE_SYNC=1` AND prose findings). Default behavior:
warn-only; backward-compat preserved.

### Section parser semantics

ATX-only (documented in the module header). Section content INCLUDES
the header line itself, so parenthetical references like
`### Decisions (v1.49.636 — close)` are correctly caught. This is
intentional — operator-decision headers carry milestone tags that
SHOULD be subject to the drift check.

### Allowlist defaults

`### Carry-forward`, `### Notes`, `## Notes` — sections that
legitimately reference NON-current milestones (carry-forwards target
future clusters; free-text Notes is the escape-hatch prose). The
allowlist is exported for caller customization.

The `### Decisions` section is INTENTIONALLY NOT allowlisted because
operator-decision headers like `### Decisions (v1.49.636 — close)`
are the exact drift signal C6 was built to catch. Live-repo `--check`
emits WARN on the historical cross-references (v1.49.650, v1.49.635,
v1.41.2, v1.49.584) — this is documented expected behavior, not a
nit.

### Hard-fail opt-in

`SC_REQUIRE_PROSE_SYNC=1` is checked INSIDE the validator (not at CLI
layer alone), so library callers and CLI invocations behave
identically.

### Why

The v1.49.636 normalizer checked frontmatter milestone sequence but
did not catch prose-body drift. A milestone could ship with
frontmatter advanced and prose body still mentioning the prior tag;
the drift would be invisible until next-cluster audit.

### Test surface

13 tests in `tools/__tests__/state-md-normalizer-prose.test.mjs`:
4 pure-helper + 7 validator + 2 integration via spawnSync.

### Files

| File | Change |
|---|---|
| `tools/state-md-normalizer-prose.mjs` | NEW (~210 LOC) |
| `tools/__tests__/state-md-normalizer-prose.test.mjs` | NEW (~280 LOC, 13 tests) |
| `tools/state-md-normalizer.mjs` | Wire prose validator into --check flow |
| `.planning/state-md-normalizer-conventions.md` | NEW (convention doc, gitignored) |

---

## C7 Sub-1 — perf-assertion-audit regex broadening + apply-to-self KNOWN_PATTERNS extension

**Commit:** `aba7618e0` `feat(audit): broaden perf-assertion regex + extend apply-to-self KNOWN_PATTERNS`
**Wave:** W1B.T2 (Sub-1)
**Net test delta:** +29

### What (Sub-1a — perf-assertion-audit)

Extended the relative-ratio regex in `tools/perf-assertion-audit.mjs`
to catch two shape classes that surfaced at v1.49.636 ship time:

- **Post-multiplier additive**: `* N + K)` (trailing constant)
- **Pre-multiplier**: `N * ident + K)` (digit precedes `*`)

The actual extension:
```
/expect\([^)]+\)\.toBeLessThan\(([^)]+\*\s*\d+(\.\d+)?|\d+(\.\d+)?\s*\*\s*[^)]+?)[\d.+ \-]*\)/
```

Alternation matches either order; both end with optional
additive/subtractive trailing constants `[\d.+ \-]*`.

The motivating site was
`src/plane/activation.integration.test.ts`:
`expect(geoAvg).toBeLessThan(3 * baselineAvg + 5)` — caught by the
post-multiplier-additive branch.

### What (Sub-1b — apply-to-self KNOWN_PATTERNS)

Extended `scripts/apply-to-self.mjs` KNOWN_PATTERNS catalog with the
three new detectors so the discipline doc is mechanically enforced
against the milestone diff:

- `perf-additive-trailing` (post-multiplier `* N + K`)
- `perf-pre-multiplier-additive` (pre-multiplier `N * ident + K`)
- `perf-bare-relative-ratio` (bare `* N` still classified)

Apply-to-self check against this milestone diff (`v1.49.636..HEAD`)
returns 0 findings (self-compliance).

### Why

The v1.49.636 audit's regex missed two real shape classes that
surfaced at ship-time stabilization. Without the regex extension,
future ships would have the same blind spot.

### Test surface

29 tests across `tools/__tests__/perf-assertion-audit.test.mjs` +
`scripts/__tests__/apply-to-self.test.mjs` (split per audit shape +
per detector + per regex compilation correctness + live-repo smoke +
diff filtering).

### Files

| File | Change |
|---|---|
| `tools/perf-assertion-audit.mjs` | Broaden relative-ratio regex |
| `tools/__tests__/perf-assertion-audit.test.mjs` | Add additive + pre-multiplier coverage |
| `scripts/apply-to-self.mjs` | Add 3 KNOWN_PATTERNS detectors |
| `scripts/__tests__/apply-to-self.test.mjs` | Per-detector + diff-filtering tests |

---

## C7 Sub-2 — Upstream rename absorb: Option (b) tracking-only retirement

**Commit:** none (folded into `aba7618e0` Sub-1; no code change)
**Wave:** W1B (Sub-2)
**Net test delta:** 0

### What

Honored the v1.49.636 close-time forward-note: cumulative deferral
across 4 clusters (v1.49.634 + v1.49.635 + v1.49.636 + v1.49.637)
with upstream `gsd-review` repo still at `v1.41.2` (no advance) and
GitHub contents probe still 404. Both decision-tree conditions fail
for the fourth consecutive cluster.

C7 Sub-2 retired to **tracking-only carry-forward** state. The note
in `.planning/UPSTREAM-ALIGNMENT.md` documents the chain close and
the re-evaluation criterion: re-open only when upstream tag advances
past `v1.41.2`.

### Why

Per Lesson #10196 (forward), cluster close forward-notes are
load-bearing decisions. v1.49.636 close pre-recommended Option (b)
retirement; the operator honored it at v1.49.637 W1B. The decision
is now recorded as a closed forward-note rather than an open
follow-up.

### Files

| File | Change |
|---|---|
| `.planning/UPSTREAM-ALIGNMENT.md` | Tracking-only retirement note |

---

## C8 — Integration meta-test

**Commit:** `2ce35f954` `test(integration): v1.49.637 meta-test exercises each new gate (C1-C7)`
**Wave:** W3 stage 1
**Net test delta:** +11 (1 skip-guarded by default)

### What

`tests/integration/v1-49-637-meta-test.test.ts` (~346 LOC, 11 tests):

| # | Gate | Skip-guard |
|---|---|---|
| 1 | C1 cargo build w/o legacy-plaintext-keystore feature | `CARGO_AVAILABLE=1` |
| 2 | C2 Rust stub + TS CLI surface references | none |
| 3 | C3 weak/strong/env-var override | none |
| 4 | C4 atlas disposition invariant | disposition-file-present |
| 5 | C5 applyAppend on synthetic STORY.md | none |
| 6 | C5 publicAlreadyHasEntry idempotency | none |
| 7 | C6 validateProseSync drift | none |
| 8 | C6 validateProseSync aligned-pass | none |
| 9 | C7 Sub-1a detectShape additive + pre-multiplier + bare | none |
| 10 | C7 Sub-1b apply-to-self self-check | tag-present |
| 11 | counter-cadence engine-state invariants | state-file-present |

Skip-guards follow Lesson #10180 pattern. C1 is the only test
skipped by default (operator opts in via `CARGO_AVAILABLE=1`); the
other 10 tests pass at 316ms locally.

### Why

Per the v1.49.636 meta-test pattern, each new gate must fire on
synthetic inputs. The meta-test is the milestone's self-check;
apply-to-self against this very milestone's diff must return 0
findings (test 10).

### Files

| File | Change |
|---|---|
| `tests/integration/v1-49-637-meta-test.test.ts` | NEW (~346 LOC, 11 tests) |
