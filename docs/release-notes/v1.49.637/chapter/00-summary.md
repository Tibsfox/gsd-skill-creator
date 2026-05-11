# 00 — Summary: v1.49.637 Housekeeping Cluster #4

v1.49.637 is the **fifth counter-cadence cleanup milestone** in the
engine, the fourth in the explicit cluster chain.

| Milestone | Cluster | Date | Notes |
|---|---|---|---|
| v1.49.585 | #1 | 2026-04-28 | Concerns cleanup (initial cadence) |
| v1.49.634 | #2 | 2026-05-11 | Concerns cleanup #2 |
| v1.49.635 | #3 | 2026-05-11 | Housekeeping (8 components + Meta-Lesson) |
| v1.49.636 | #3-followup | 2026-05-11 | Housekeeping absorbing v1.49.635 handoff |
| **v1.49.637** | **#4** | **2026-05-11** | **Housekeeping (keystore finalization + audit-tool catalog + ship-pipeline-discipline #2)** |

The fundamental design choice was to close v1.49.636 carry-forwards
and named lessons by **substrate finalization** (C1 retires the
legacy-plaintext-keystore cargo feature; C3 implements R14 passphrase
quality via zxcvbn-ts) plus **ship-pipeline-discipline extension**
(C5 adds a STORY.md sustained-update gate; C6 extends the STATE.md
normalizer to flag prose-body milestone drift; C7 Sub-1 extends the
perf-assertion audit + apply-to-self KNOWN_PATTERNS).

## Component delivery

Seven atomic commits across three waves: W1A (C1 + C2 + C3 parallel),
W1B (C4 + C7 Sub-1 + C7 Sub-2 retirement), W1C (C5 + C6 parallel), W3
stage 1 (C8). G3 (ship) is operator-only via team-lead relay.

### C1 — Keystore: legacy-plaintext-keystore cargo feature retired (W1A.T1)

Closes v1.49.636 carry-forward #2 (legacy keystore retirement). The
`legacy-plaintext-keystore` cargo feature was a backward-compat
opt-in carrying the v1 plaintext-keystore module forward from
pre-v1.49.500 days. After the v1.49.636 hybrid Node-wrapper +
Rust-bin architecture shipped (Path 1 OS-keyring + Path 2
age-encrypted file w/ Argon2id passphrase), no caller exercised the
legacy path; the feature was kept gated only for migration-time
disaster recovery.

C1 removes the feature flag entirely from `src-tauri/Cargo.toml` +
the gated module + the gated tests. Net test delta: -6 (8 retired
legacy tests; 2 added boundary assertions verifying the feature is
unreachable). The negative-build assertion (`cargo build --features
legacy-plaintext-keystore` must FAIL) is the load-bearing C1
invariant; verified by C8 meta-test under CARGO_AVAILABLE=1.

W0a substrate-probe surfaced the actual feature gating shape: the
mission spec assumed a single `#[cfg(feature = "...")]` site but the
real shape was three gated modules + a re-export site. Spec
adjusted before W1A start — Lesson #10192 captures this pattern.

### C2 — Keystore: migrate --to-keyring stub + M3 design doc (W1A.T2)

Closes v1.49.636 forward-note #3 (M3 deferral surface). The
v1.49.636 hybrid architecture established Path 1 (OS keyring) +
Path 2 (age-encrypted file) but left the Path-2 → Path-1 migration
(M3) deferred to v1.49.7XX. The user-visible surface, however,
needed a stub: operators discovering Path-2 + keyring availability
should see a clear remediation message pointing at the future
migration path.

C2 polishes the `skill-creator-keystore migrate --to-keyring`
subcommand stub (exit code 3 with the M3-deferred message
referencing `.planning/path-2-to-path-1-migration.md`) and authors
the M3 design doc itself (operator-facing migration plan, backup
strategy, rollback recipe). The CLI surface in
`src/cli/commands/keystore.ts` documents the flag with the M3
deferral note. Net test delta: +4 (CLI surface validation; stub-
output shape; help-text inclusion; backward-compat preservation).

Option C (schema-aligned `MigrateCLIRecord`) folded from W0b NIT #5.

### C3 — Keystore: R14 passphrase quality enforcement via zxcvbn-ts (W1A.T3)

Closes v1.49.636 R14 (named carry-forward: passphrase quality
enforcement). The v1.49.636 substrate accepted any non-empty
passphrase; R14 required a minimum-strength gate so weak passphrases
(`password123`) get rejected at the keystore boundary.

C3 integrates `@zxcvbn-ts/core` with a default minimum score of 3
(zxcvbn scale 0-4 — score 3 is "safely unguessable: moderate
protection from offline slow-hash scenario"). Operators can override
via `SC_PASSPHRASE_MIN_SCORE=0..4`. The singleton zxcvbn-options
initialization (W0b NIT #4 fold) prevents per-call dictionary reload
overhead.

Substrate-probe surfaced that `@zxcvbn-ts/language-en` does NOT
export `adjacencyGraphs` — the spec assumed a different package
shape. The actual API is `dictionary` + `translations` only; the
keyboard graph is provided by `@zxcvbn-ts/core` itself. Spec
adjusted; Lesson #10192 captures this audit-underestimate pattern.

Net test delta: +13 (parser shape + accept/reject boundary + env-var
override + singleton init + format + assert + error class). Across 8
test sites in `passphrase-flow.test.ts` the canonical strong-fixture
`hunter2` was replaced with `correct horse battery staple stadium`
(W1A G-gate carry-forward CF-Nit 2 fold).

### C4 — Atlas: per-project-clear contract fix + cluster-5 defer lru-promote (W1B.T1)

Closes v1.49.636 C4 carry-forward (2 `#[ignore]`'d atlas tests).
Dual disposition pattern: one test fixed-inline (test contract
mismatch); one test downgraded to Cluster #5 with deeper finding
(test-design mismatch with batch-load semantics, NOT an impl bug).

**Fixed inline**:
`per_project_clear_with_unknown_project_id_falls_back_to_full_clear`
— the test asserted `evicted == 0` under a "conservative count for
fallback path" mental model, but the impl at
`clear_connection_cache_for_project()` line 553 delegates to
`clear_connection_cache()` which returns the actual eviction count.
The `scope == "all"` flag is the disambiguator that signals
targeted-clear-didn't-apply; the count itself is honest. Test
expectation flipped to `evicted == 1`. `#[ignore]` removed.

**Cluster-5 deferred**:
`lru_access_promotes_keeps_entry_alive_under_eviction` — deeper
investigation revealed the test's mental model ("load p0+p1,
promote p0 manually, then load p2 → p1 evicts because it's now
LRU") doesn't match the impl's `get_all_project_conns()` which
enumerates EVERY project on every call. Architectural fix is 2-4h
(beyond cluster #4 budget). Test continues to carry `#[ignore]`
with full diagnostic; disposition invariant test asserts continued
`#[ignore]` state until cluster #5 closes it.

Net test delta: +1 (disposition invariant). Records at
`.planning/atlas-test-disposition.md` updated. Atlas test count:
**43 passed; 0 failed; 1 ignored** (down from 2 ignored at v1.49.636).

### C5 — Per-ship STORY.md sustained-update gate (W1C.T1)

Closes Lesson #10191 forward + v1.49.636 carry-forward #1 (STORY.md
update discipline). The v1.49.636 ship surfaced that STORY.md
updates were operator-discipline-only with no pipeline enforcement —
a future ship could quietly forget to update it.

C5 ships `scripts/append-story-entry.mjs` (~310 lines, exports
`readPackageVersion`, `findGroundTruthEntry`, `publicAlreadyHasEntry`,
`parseHeaderTag`, `parseChapterCount`, `applyAppend`,
`appendStoryEntry`). Wired as pre-tag-gate **step 10 of 10** (between
existing step 9.5 apply-to-self and final success). Exit code 11
reserved for STORY-gate failure. `SC_SKIP_STORY_GATE=1` bypass for
emergency operator override.

Idempotency invariant: re-running the orchestrator with the entry
already present returns `status: 'already-present'` with zero
filesystem mutation (byte-equivalence asserted). The ground-truth
parser uses an anchored-link form (`- **[${tag}](${tag}/00-summary.md)**`)
that prevents spurious matches against prose mentions. Missing
ground-truth raises a typed `GROUND_TRUTH_MISSING_ENTRY` error mapped
to exit 1 with remediation pointers.

Net test delta: +15 (5 pure-helper + 3 applyAppend + 7 orchestrator,
including byte-equivalence + idempotency + missing-ground-truth
blocks + env-var bypass + direct-invocation guard).

### C6 — STATE.md normalizer prose-body milestone-drift validator (W1C.T2)

Closes v1.49.636 post-ship Finding #2 (STATE.md normalizer surface
gap). The v1.49.636 normalizer checked frontmatter milestone
sequence but did not catch prose-body drift (e.g., frontmatter says
`v1.49.637` but `### Branch State` body still mentions `v1.49.636`).

C6 ships `tools/state-md-normalizer-prose.mjs` (exports
`parseFrontmatterAndBody`, `extractSectionContent`,
`validateProseSync`, `validateProseSyncAtPath`,
`formatFindingsForStderr`, plus `DEFAULT_SECTIONS` +
`DEFAULT_ALLOWLISTED_HEADERS`). Wired into
`tools/state-md-normalizer.mjs --check` flow. Warn-only by default;
`SC_REQUIRE_PROSE_SYNC=1` converts to hard-fail (exit 1).

Allowlist defaults: `### Carry-forward`, `### Notes`, `## Notes` —
sections that legitimately reference non-current milestones. The
`### Decisions` section is INTENTIONALLY scanned because
operator-decision headers like `### Decisions (v1.49.636 — close)`
are the exact drift signal C6 was built to catch. The convention
doc at `.planning/state-md-normalizer-conventions.md` documents the
ATX-only section-parser semantics.

Net test delta: +13 (4 pure-helper + 7 validator + 2 integration
via spawnSync, covering ATX section parser, allowlist semantics,
frontmatter-absent graceful-pass, hard-fail opt-in correctness,
multi-section drift detection).

### C7 Sub-1 — perf-assertion audit + apply-to-self KNOWN_PATTERNS extension (W1B.T2)

Closes Lesson #10181 forward + v1.49.636 perf-assertion audit gap.
The v1.49.636 audit's relative-ratio regex
(`expect\(...\)\.toBeLessThan\(.*\*\s*\d+\)`) caught simple
`* N)` shapes but missed two real shapes that surfaced at ship time:

- **Post-multiplier additive shape**: `* N + K)` (trailing
  constant) — surfaced at v1.49.636 ship-time stabilization of
  `src/plane/activation.integration.test.ts`:
  `expect(geoAvg).toBeLessThan(3 * baselineAvg + 5)`
- **Pre-multiplier shape**: `N * ident + K)` (digit precedes `*`)
  — same site, different read.

C7 Sub-1a extends the regex:
```
/expect\([^)]+\)\.toBeLessThan\(([^)]+\*\s*\d+(\.\d+)?|\d+(\.\d+)?\s*\*\s*[^)]+?)[\d.+ \-]*\)/
```
Alternation matches either order; both end with optional
additive/subtractive trailing constants.

C7 Sub-1b extends `scripts/apply-to-self.mjs` KNOWN_PATTERNS catalog
with the three new detectors (post-multiplier-additive,
pre-multiplier-additive, bare-relative-ratio). Apply-to-self check
against this milestone diff returns 0 findings (self-compliance).

Net test delta: +29 (additive detection × 3 shapes; pre-multiplier
detection; apply-to-self pattern parser; live-repo smoke; per-shape
classification; bare relative-ratio still classified).

### C7 Sub-2 — Upstream `gsd-review` → `gsd-quality` rename: Option (b) retirement

Closes v1.49.636 forward-note (Option (b) tracking-only retirement
of the upstream-rename absorb). Cumulative deferral chain across 4
clusters (v1.49.634 + v1.49.635 + v1.49.636 + v1.49.637 — all at
the same upstream `v1.41.2` tag with the same probe failure).

The W1B verdict honored the v1.49.636 close-time forward-note:
upstream remains at `v1.41.2` (no advance); GitHub contents probe
returns 404; both decision-tree conditions fail for the fourth
consecutive cluster. C7 Sub-2 is now a **tracking-only carry-
forward** in `.planning/UPSTREAM-ALIGNMENT.md` — re-evaluated only
when upstream tag advances. Net commits: 0 (no code change; doc-
state update only). Lesson #10196 captures this 4-cluster chain
close.

### C8 — Integration meta-test (W3 stage 1)

`tests/integration/v1-49-637-meta-test.test.ts` (11 tests, 1
skip-guarded on CARGO_AVAILABLE=1): C1 cargo build negative
assertion (skip-guarded); C2 Rust stub + TS CLI surface
references; C3 weak/strong/env-var override; C4 atlas disposition
invariant (skip-guarded to disposition file present); C5
applyAppend on synthetic STORY.md + publicAlreadyHasEntry
idempotency; C6 validateProseSync on synthetic drift + aligned
content; C7 Sub-1a detectShape on additive-trailing + pre-
multiplier + bare-ratio; C7 Sub-1b apply-to-self against
v1.49.636..HEAD has 0 findings (skip-guarded if tag missing);
counter-cadence engine-state invariants.

All 10 non-skipped tests pass at 316ms locally; the 1 skip-guarded
test (C1 cargo) opts in via CARGO_AVAILABLE=1.

The G3 ship (T14) is OPERATOR-ONLY per durable instruction —
flight-ops delivers W3 stage 1 readiness; the operator authorizes
the ship sequence via team-lead relay.

## Vital stats

| Metric | Value |
|---|---|
| Atomic commits | 7 (W1A: 3 + W1B: 2 + W1C: 2) + 1 W3 (meta-test) = 8 total |
| Net new tests | +69 (per-component breakdown above) |
| Named CF closed | 5 of 6 (R14, atlas-disposition × 2 tests, legacy-keystore retirement, M3 stub) |
| Audit-gap closed | 3 of 3 (perf-assertion regex, STORY-gate, STATE-prose validator) |
| Cluster #5 CF | 1 confirmed (atlas lru-promote architectural fix; 2-4h) |
| W0b nits folded | 8 of 8 |
| W1A CF-Nits folded | 2 of 3 (CF-Nit 3 `dashboard/index.html` → T14 disposition) |
| W1B + W1C new G-gate nits | 0 |
| Conventional-commit conformance | 7 of 7 |
| Forward lessons emitted | 5 (#10192-#10196) |

## Engine state

UNCHANGED. No NASA / MUS / ELC / SPS / TRS forward-cadence content
shipped in this milestone. Same engine tip as v1.49.636 modulo the
8 commits this milestone introduces. NASA degree remains 108;
counter-cadence flag remains true; no-engine-state-advance flag
remains true.
