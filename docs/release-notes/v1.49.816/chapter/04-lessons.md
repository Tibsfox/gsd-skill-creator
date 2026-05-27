# v1.49.816 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v815).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `tools/state-md-set-shipped.mjs` (222 lines) + `tools/__tests__/state-md-set-shipped.test.mjs` (195 lines) BEFORE any code change. Recon surfaced (a) the colon-quote bug at the precise template-interpolation line, (b) a pre-existing time-drift flake in the E2E test, (c) confirmation that the `--check` flag has no production callers (test-only). All three insights landed in ~5 min of reading. |
| #10416 | Lightest-wire / tolerant-generator | Resisted rewriting the entire frontmatter via `jsYaml.dump` (would change byte output for all callers + force existing test rewrites); resisted adding a `--last-updated` CLI flag (the on-disk parse is 1 regex line); resisted extracting `yamlScalar` to a shared module (1 instance — premature per the discipline). Chose: 3-line inline helper + 1-char template change + 6-line on-disk read in the `--check` branch. ~14 LOC tool delta. |
| #10417 | Static-analysis tool authoring | The `--check` flag is a comparable-output report tool. Per the discipline: comparable-output tools must be invariant to wall-clock state. The fix realigns the tool to that invariant by reading the time-dependent field from the on-disk anchor instead of fresh-generating it. |
| #10426 | Cross-class registry extraction at 2nd instance | N/A — `yamlScalar` is a 1-instance helper; per the discipline, extraction triggers at the 2nd. If a sibling tool in `tools/` needs the same hand-built-YAML-with-sometimes-quoted-field pattern, the helper extracts then. Flagged for future watch. |
| #10427 | Failure-mode contracts | The `--check` flag is forensic surface (test-only, not production). Its prior failure mode was false-positives ("STATE.md differs" when content was canonical but timestamp had drifted). New failure mode: only reports drift when canonical-shape differs from on-disk content, with on-disk lastUpdated as the comparison anchor. The contract is now: `--check` returns 0 iff the file is at canonical shape for its recorded shipped milestone. Documented in inline comment. |
| #10431 | Two-layer closure for procedure-rooted drift | Partial application. The v815 colon-name workaround was the operator-procedure layer (strip the colon from the name); v816 is the source-eliminator layer (auto-quote the value via js-yaml). The detector layer already existed: the post-write normalize-check in the tool would catch a broken YAML round-trip. The chain is: detector (already there) + source-eliminator (this ship) + unit-test (this ship's new tests). Closure: complete for this footgun. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v815)

| Source | Observation | Status |
|---|---|---|
| (v810-814) | watch-loop tear-down race | carry forward |
| (v810-814) | chained-session architectural-tax break-even | carry forward |
| (v810-814) | registry-abstraction cross-chain payoff | carry forward |
| (v804) | 6th-mode-flag refactor trigger | carry forward |
| (v805) | codification-ship pattern at 5 instances | **eligible for promotion in next codify ship** |
| (v806) | Chokepoint pattern at 4 instances | **eligible for promotion in next codify ship** |
| (v810) | Recon doc name-drift across ~1 day | carry forward (2 instances if v815 audit-list-staleness counted) |
| (v810) | Two-layer default-off contract | carry forward |
| (v811) | Post-infrastructure chip cadence ~2× faster | carry forward |
| (v811) | Block-comment consolidation when N-of-N siblings wired | carry forward |
| (v813) | `node_modules` symlink pattern for tmpdir-isolated CLI tests | carry forward |
| (v815) | Audit findings have a half-life; verify-then-act before sizing | carry forward |
| (v815) | Original-author forward-flagging is the highest-signal trigger for #10415 | carry forward |
| (v815) | Refcount belongs at the operation boundary, not the syscall boundary | carry forward |
| (v815) | Lazy-singleton + test-hook pattern for module-level state | carry forward (2-instance candidate if tools/ shape counted) |
| (v815) | **`state-md-set-shipped.mjs` colon-quote footgun** | **CLOSED v816** |

## New observations flagged this ship (not promoted; not in count)

**Side-bug discovery via test design.** Reading the existing test fixtures to design the new tests surfaced a separate pre-existing structural flake (the `--check` time-drift). The discovery channel is: write new tests → inevitably read existing tests → notice latent issues that the existing tests had been hiding. Compare to v815's audit-list-staleness discovery (reading the audit → noticing 4 of 6 wedges had self-closed). Pattern: when you have to read N surfaces of a subsystem to design 1 new surface, you have a high-information-density opportunity to flag adjacent issues. Tentative; potentially a 2-instance pattern.

**`--check` semantics: canonical-shape vs would-regenerate-now.** Tooling that re-computes "what would I write?" then byte-compares against the on-disk file MUST be invariant to wall-clock state. The two semantic frames are (a) "does the file match the canonical shape for its recorded state?" vs (b) "does it match what I'd regenerate at this exact moment?". Frame (a) is the correct one for `--check` flags; frame (b) is the test-time pitfall. Tentative; 1 clean instance here. If another comparable-output tool surfaces the same issue, this codifies.

## Cross-references

- #10412 + #10417 → recon-first naturally pairs with static-analysis-tool discipline because comparable-output tools' bugs often manifest as time-dependent flakes that recon (test-file reading) surfaces.
- #10416 + #10426 → resist 1-instance abstraction (#10416); extract at 2-instance (#10426). The `yamlScalar` helper sits between the two; promote on second use site.
- #10427 + #10431 → failure-mode contracts at the procedure boundary (#10427); two-layer closure for procedure-rooted drift (#10431). Both apply here: the `--check` contract was implicit and false-positive-prone; the colon-quote bug was procedure-rooted (operator-rephrase workaround) and now has both detector (existing) + source-eliminator (this ship) + unit-test (this ship) layers.

## What this ship illustrates about chip-shaped tool fixes

Chip-shaped tool fixes hit a specific cost-shape: ~14 LOC + ~33 LOC tests + ~25 min wall-clock + 0 production blast radius. They're the "free" portion of the discipline-application cost curve — cheap to ship, high signal-per-byte. The natural cadence is: ship the chip whenever you notice the footgun, not wait for a counter-cadence ship to batch them.

This is consistent with the v810-814 chain's chip cadence (3 ProcessContext chips in 3 ships) and the #10430 5-1-1 alternation pattern. The "1" portion of the alternation can be a chip-shaped tool fix; this ship is one example.
