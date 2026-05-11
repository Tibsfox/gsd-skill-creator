# 04 — Forward Lessons: v1.49.636 Housekeeping Cluster #3

This milestone CLOSED 7 of the 8 pre-pinned lessons carried from
v1.49.635 by converting each into a deterministic gate or discipline
doc. The pre-pinned lessons originated in v1.49.635
`chapter/04-lessons.md`; their v1.49.636 closure surfaces are
enumerated below. Three NEW lessons emerged from v1.49.636 execution.

## Pre-pinned lesson closures (8 from v1.49.635 → 7 closed + 1 carried)

### Lesson #10180 — gitignored-runtime-artifact skip-guard (carried + applied)

**Status:** carried forward + applied (not closed — this is an
ever-present authoring discipline, not a one-shot fix).

**Applied at:** C4 invariant test at `tests/__tests__/atlas-test-disposition.test.ts`
uses the `if (!existsSync(DISPOSITION_PATH)) return` skip-guard pattern.
C8 meta-test at `tests/integration/v1-49-636-meta-test.test.ts` uses
the same pattern + `it.runIf(TAURI_DEV_AVAILABLE)` for the Tauri-dev
smoke. The apply-to-self enforcement at C7 step 9.5 mechanically
checks new test files for this pattern.

### Lesson #10181 — audit regex coverage (closed at C3)

**Surfacing context.** v1.49.635 C3 audit's 7-regex set keyed on
identifier names only; missed generic-identifier and relative-ratio
shapes that surfaced at full-suite contention.

**Closure.** `tools/perf-assertion-audit.mjs` extended catalog with
three shape classes resolved in priority order (relative-ratio first
as most specific). POSIX ERE compatibility translation layer for
`\d` / `\s` shorthand. Discipline doc + extended audit at
`.planning/test-discipline/perf-assertion-warmup.md` +
`perf-assertion-audit-2026-05-11-extended.md`.

### Lesson #10182 — per-site tier-up classification (closed at C3)

**Surfacing context.** Canonical 5-iteration warmup pattern was
insufficient at the analyzer site (tree-sitter init cost not amortized
by V8 JIT warmup alone). Threshold widening 200ms → 300ms needed
alongside warmup.

**Closure.** Tier-up profile classification (`pure-js`,
`native-module-backed`, `io-bound`, `mixed`) via test-file content
inspection. Per-profile fix recommendations documented (warmup-only
for pure-js; warmup + threshold-widening for native-module-backed;
warmup + threshold-widening + absolute-time-floor for io-bound).
Retroactive classification of v1.49.635 audit rows — no
reclassification needed; the tier-up column adds explanatory power.

### Lesson #10183 — slot-pinning sanity check (closed at C5)

**Surfacing context.** v1.49.635 was operator-pinned as `v1.49.650`
under the assumption that .635-.649 were reserved slots; re-examination
identified sequential .635 as correct; ~45min post-ship correction.
Cost-of-correction scales with time-since-ship + downstream consumer
integration.

**Closure.** `scripts/check-version-sequence.mjs` outputs
`VersionSequenceCheckResult` schema. Soft-warn default;
`SC_REQUIRE_SEQUENTIAL_VERSION=1` hard-fail; `SC_SKIP_VERSION_SEQUENCE_CHECK=1`
silence. First-in-minor-line is pass-by-definition. Wired as
pre-tag-gate step 1.5.

### Lesson #10184 — branch-aware reset guards (closed at C7 Sub-2)

**Surfacing context.** v1.49.635 slot-correction used `git checkout main`
+ `git reset --hard <sha>` two-step. The checkout silently failed
("uncommitted changes" warning glossed over); the reset operated on
the wrong branch (dev) and nuked it locally. Clean recovery via
`fetch + reset --hard origin/dev` but the gap surfaced.

**Closure.** Documented in `.planning/ship-pipeline-discipline.md`
Lesson #10184 section. Preferred form: `git update-ref refs/heads/<branch> <SHA>`
— branch-name-explicit single-step. The two-step `checkout +
reset --hard` is enumerated as anti-pattern. Discipline applies at
the operator-shell level; apply-to-self does not enforce
mechanically (this is operator shell discipline, not source-code
discipline). Folded C5 Stage 3 into this section per lab-director-2
W1C verdict open-question.

### Lesson #10185 — CI-gate enumeration discipline (closed at C6)

**Surfacing context.** v1.49.635 W3 G3 used `SC_SKIP_CI_GATE=1` to
bypass an inherited v1.49.634 CI red (self-mod-guard meta-test on
gitignored hook artifact). The blanket override silently masked a
co-occurring v1.49.635 CI red of identical Lesson #10180 shape
(STATE.md normalizer meta-test on gitignored STATE.md). The same
override authorized one red; the other was outside operator
authorization scope.

**Closure.** `scripts/ci-gate-enum.mjs` requires CSV enumeration of
every authorized failing test. Three CSV entry shapes (test-name
default, file-glob, file-line refactor-fragile with warning).
Backward-compat `SC_SKIP_CI_GATE=1` preserved with DEPRECATION
WARNING. Rationale-log template per shared-types schema. Wired at
pre-tag-gate step 4 (inside the CI-on-dev failure branch).

### Lesson #10186 — bulk-rename IFS sharp-edge (closed at C7 Sub-2)

**Surfacing context.** v1.49.635 bulk-rename of a deprecated identifier
used `for f in $(grep -l 'OLD' src/); do sed -i ...` pattern. Worked
on most paths but silently failed on a file with a space in its
path — IFS tokenization split the path across two iterations.

**Closure.** Documented in `.planning/ship-pipeline-discipline.md`
Lesson #10186 section. Preferred form:
`grep -rlZ ... | while IFS= read -r -d '' f; do ... done` — null-delimited
+ IFS-reset + `read -r` disables backslash interpretation. The
unsafe `for f in $(...)` form is enumerated as anti-pattern.

### Meta-Lesson — Apply-to-self enforcement (closed at C7)

**Surfacing context.** v1.49.635 shipped `fragile-test-pattern.md`
documenting the `existsSync(gitignored-artifact) → silent-pass`
anti-pattern (Lesson #10180). The same milestone's C8 meta-test was
authored without a skip-guard for the gitignored `.planning/STATE.md` —
exactly the anti-pattern the discipline doc warned against. The CI
red surfaced in the same ship-prep window. Discipline docs only
prove their value when their authors follow them in the same commit
window.

**Closure.** `scripts/apply-to-self.mjs` (~210 lines) mechanically
greps newly-authored test files in the milestone diff against
discipline-doc patterns. WARN-by-default (operator decides
per-finding at G-gate). `SC_REQUIRE_APPLY_TO_SELF=1` converts to
BLOCK. Allowlist at
`.planning/ship-pipeline-discipline/apply-to-self-allowlist.md`
silences legitimate exceptions. Wired as pre-tag-gate step 9.5.
Two pattern detectors at ship: `existsSync-no-skip-guard` and
`perf-assertion-no-warmup`. The discipline doc has an
`## Apply-to-self check` sub-section per lesson so the
patterns are browsable and extensible.

## New lessons from v1.49.636 execution

### Lesson #10187 — Mission-pipeline T1 "commit mission package" is wrong-shape

**Context.** v1.49.636 T1 was specified as "Commit v1.49.636 mission
package atomically" with a `mission(v1.49.636): ...` commit message.
The `git-add-blocker` hook (shipped at v1.49.585 C02) BLOCKS any
`git add` of `.planning/*` paths by design; the standing memory rule
says "HARD RULE: NEVER git add/commit/push .planning files";
`git log --all -- '.planning/missions/'` returns nothing — no prior
mission package has been committed across v1.49.585 + v1.49.634 +
v1.49.635 + v1.49.636.

**Lesson.** Mission-pipeline scaffolding that contradicts the
`.planning/` gitignore convention is a design error. Future cluster
task lists should omit T1 entirely; mission packages live in the
working tree (gitignored) and reach audit trail at ship-time via
the `docs/release-notes/<version>/` files.

**Surfaced in.** v1.49.636 T1 — Option A (skip-as-no-op) authorized
by team-lead.

**Forward-applied at.** Future cluster mission-pipeline scaffolding
should NOT include T1; the audit trail is captured at ship-time in
`docs/release-notes/`. If a future cluster's mission pipeline needs
this lesson re-asserted, the closure surface is the
mission-pipeline-tool that generates task lists (probably at
`tools/mission-pipeline/` or equivalent — TBD if/when authored).

### Lesson #10188 — POSIX ERE translation at git-grep boundary

**Context.** C3 `tools/perf-assertion-audit.mjs` passed JS regex
`.source` strings directly to `git grep -E`. JS regex uses `\d`,
`\s`, `\w` shorthand classes; POSIX ERE does not — these silently
fail to match (`git grep -E` returns no matches without error). The
0-findings result was caught by a smoke test asserting the
carry-forward atlas-indexer site (which has `expect(t4).toBeLessThan(t1 * 10)`)
was found.

**Lesson.** Any tool that hands off a regex source string to a
POSIX-ERE consumer (`git grep -E`, `grep -E`, `awk`, `sed -E`)
must translate JS regex shorthand at the boundary: `\d` → `[0-9]`,
`\s` → `[ \t]`, `\w` → `[A-Za-z0-9_]`. Non-capturing groups (`(?:...)`)
also do not exist in POSIX ERE and must be flattened to plain
capturing groups (the latter work for matching even if the captures
are not used).

**Surfaced in.** v1.49.636 C3 during test authoring.

**Forward-applied at.** v1.49.636 C3 `gitGrep()` helper has the
translation layer inline (`ereCompat = pattern.replace(/\\d/g, '[0-9]')`
etc.). Future tools that follow this pattern should reuse the
same translation; consider extracting to a shared
`scripts/_posix-ere-from-js.mjs` helper if a second tool needs it.

### Lesson #10189 — apply-to-self regex must distinguish code from comments

**Context.** During C7 apply-to-self.mjs test authoring, the
skip-guard detection regex initially included `skip[- ]guard` as one
of the patterns. The test fixture for "violator without skip-guard"
included a comment `// No skip-guard — apply-to-self should flag this.`
The regex matched the literal phrase "skip-guard" in the comment and
disabled the WARN, so the apply-to-self check silently passed on a
file it should have flagged.

**Lesson.** Apply-to-self pattern detectors must distinguish ACTUAL
CODE PATTERNS from MENTIONS OF THE PATTERN in comments / strings /
docs. The skip-guard detection was fixed to match only real code
constructs: `\bit\.runIf\s*\(`, `\bdescribe\.runIf\s*\(`,
`if\s*\(\s*!\s*existsSync\s*\(`. The literal phrase "skip-guard"
no longer counts as evidence.

**Surfaced in.** v1.49.636 C7 during fixture authoring.

**Forward-applied at.** v1.49.636 C7 `KNOWN_PATTERNS` array has the
restricted regex. Future apply-to-self pattern additions must
follow the same discipline — match code, not commentary.

### Lesson #10190 — Sweep tools need pattern-level allowlists for files where substrate citations and cosmetic references coexist

**Context.** v1.49.636 first sweep attempt (`scripts/sweep-old-slot-label.sh`
v1, commit `8f11cf40a`) used a FILE-LEVEL allowlist. The operator
G3-conditional required an inline cosmetic v1.49.650 → v1.49.636
sweep across non-allowlisted paths. lab-director-2's verification
FAILED the commit because the file-level allowlist couldn't
discriminate substrate-citation lines (must preserve to maintain
architectural lineage — provenance comments, lineage refs, empirical-
data citations, era-boundary markers) from cosmetic lines (must
sweep — current-state ownership claims) within the same file. The
sweep rewrote BOTH categories.

Concrete examples of the over-sweep corruption:
- `desktop/src/keystore/invoke.ts:116` — "flipped this from the
  v1.49.636 phase-(g) stub" — semantic gibberish (v1.49.636 had
  no phase-(g) stub; that was v1.49.650).
- `src-tauri/src/security/keystore.rs:3` — "Extended at v1.49.636
  with the unified..." — false architectural lineage (the unified
  extension shipped at v1.49.650).
- `src/intelligence/analyzer/__tests__/performance.test.ts:39` —
  "observed 211.52ms mean at v1.49.636 pre-tag-gate" — fabricated
  data (v1.49.636 has not yet run pre-tag-gate at sweep time).

**Lesson.** Sweep tools that target version-label residue MUST use
LINE-PATTERN allowlists, not file-level allowlists. Substrate-
citation shapes form a known category with consistent verbal
patterns (`[Rr]enamed (from )?.*at v1\.49\.650`, `Extended at
v1\.49\.650`, `observed .* at v1\.49\.650`, `legacy format from
before v1\.49\.650`, `phase-\(g\) [Oo]ption[ -]?[12]`, etc.);
cosmetic refs are explicit current-state mentions. Pre-commit
`--diff` mode + negative-test fixtures form the auditability
surface.

**Pattern template (Option B sweep tool architecture):**

```bash
# scripts/sweep-old-slot-label.sh (rebuild)
SUBSTRATE_PATTERNS=(
  '[Rr]enamed (from )?.*at v1\.49\.650'   # rename lineage
  'Extended at v1\.49\.650'                # architectural intro
  'observed .* at v1\.49\.650'             # empirical-data citation
  'legacy format from before v1\.49\.650'  # substrate era
  'phase-\([a-h]\) [Oo]ption[ -]?[12]'     # phase-decomposition
  '[Cc]loses (the )?v1\.49\.650'           # deferral-closure verb
  'flipped (this )?from .*v1\.49\.650'     # provenance source
  'v1\.49\.6XX'                            # generic placeholder
  # ... ~25 patterns total
)

# Per-line filter inside each candidate file:
while IFS= read -r line; do
  if echo "$line" | grep -qE "$OLD_PATTERN"; then
    if is_substrate_line "$line"; then
      printf '%s\n' "$line" >> "$tmpfile"     # preserve
    else
      echo "$line" | sed "s|$OLD|$NEW|g" >> "$tmpfile"  # sweep
    fi
  else
    printf '%s\n' "$line" >> "$tmpfile"
  fi
done < "$f"
```

**Apply-to-self check:** the sweep tool ships with a
`scripts/__tests__/sweep-old-slot-label.test.mjs` negative-test
fixture that injects 40+ substrate-citation-shape lines and asserts
none are rewritten. v1.49.636 C8 negative-test discipline (mirrors
v1.49.635 C3 Lesson #10182 audit-regex pattern).

**Surfaced in.** v1.49.636 C8 / T13b — operator-rejected file-level
sweep, lab-director-2 FAIL verdict on `8f11cf40a`, rebuild as
Option B.

**Forward-applied at.** v1.49.636 C8 `scripts/sweep-old-slot-label.sh`
+ `scripts/__tests__/sweep-old-slot-label.test.mjs` (negative-test).
Extension of Lesson #10186 (safe pattern); adjacent to Lesson
#10182 (audit regex coverage); adjacent to Lesson #10189 (code-vs-
comment distinction).

## Carry-forward index for Cluster #4 (v1.49.6XX or later)

Items not closed at v1.49.636 that future clusters should pick up:

- **C2 Phase-2 shape families.** 7 unfit chipsets across 4 shape
  families (A: chipset:-wrapped; B: gastown sectioned orchestration; C:
  positional staff; D: math-coprocessor stub). Per-family migration
  paths and estimated cost in
  `.planning/cartridge-migration-phase2.md`.

- **C4 atlas LRU semantics investigation.** Two `#[ignore = "..."]`
  annotated tests need root-cause investigation (~2-4h for the LRU
  touch/promote semantics + ~30min-1h for the evicted-count fallback).
  Disposition records at `.planning/atlas-test-disposition.md`.

- **C7 Sub-1 upstream rename absorb.** Third deferral at this
  milestone. If Cluster #4 finds upstream tag still v1.41.2, consider
  treating as tracking-only artifact OR making a one-time downstream
  absorb decision regardless of upstream state.

- **Apply-to-self pattern catalog extension.** Two patterns ship at
  v1.49.636 (existsSync-no-skip-guard + perf-assertion-no-warmup).
  Future patterns: Lesson #10188 POSIX-ERE-translation? Lesson #10189
  comment-vs-code distinction? Each future cluster that surfaces a
  new mechanically-detectable anti-pattern should add it to
  KNOWN_PATTERNS.

- **Abstract Cluster #4 candidates** (operator-pinned for future
  scheduling): legacy plaintext keystore feature removal (still
  feature-gated at `legacy-plaintext-keystore`); path-2 → path-1
  upgrade stub (`migrate --to-keyring` M3); v1.49.634 self-mod-guard
  CI install gap; the Family A `chipset:`-wrapped adapter fallback
  for C2.
