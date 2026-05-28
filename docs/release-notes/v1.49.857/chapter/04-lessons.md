
# v1.49.857 — Lessons

## Promoted to ESTABLISHED in this ship (1)

The v848-v856 nine-ship campaign accumulated one eligible codify-ready candidate (stale-entry inverse-audit pattern; 2 instances at v834 + v852). v857 promotes the candidate to ESTABLISHED + ships the cross-audit tool that operationalizes the discipline.

### #10443 — Inverse-audit: stale-entry detection

**Evidence:** 2 instances of distinct stale-shapes against the v806 unidirectional-enforcement asymmetry.

| Stale-shape | Surface ship | First-instance file | Detection rule |
|---|---|---|---|
| Shape A — wired-but-still-in-allowlist | v1.49.834 | `src/intelligence/analyzer/git.ts` | file calls `ensure*Allowed` AND is still in `KNOWN_UNWIRED` |
| Shape B — import-without-use | v1.49.852 | `src/scan-arxiv/bridge.ts` | file imports the chokepoint module via named imports AND none of the imported names is referenced in the body |

**Source ships:** v1.49.834 + v1.49.852. The 2-instance promotion threshold (#10426) applies at the META level: two distinct stale-shapes prove the inverse-audit isn't shape-A-specific. Shape A was closed inline at v838 (~4 ships after first surface); Shape B remained without a deterministic detector until this ship.

**Landing site:** `docs/known-unwired-ledger-discipline.md` — new top-level section `## Inverse-audit: stale-entry detection (Lesson #10443)` replacing the v812-era "Forward observations / Unidirectional enforcement asymmetry" placeholder. The section catalogs both stale-shapes, references the v838 inline closure for Shape A + the v857 cross-audit tool for Shape B, and documents the "one inverse-check per stale-shape" scaling rule.

**Implementation:** `tools/security/check-stale-known-unwired.mjs` — regex-extracts `KNOWN_UNWIRED` from both audit-test files, runs Shape A check against both audits, runs Shape B check against ProcessContext only (EgressContext is signature-driven, so its existing "contains `fetch(`" check IS the shape-B equivalent). Human-readable output by default; `--json` for machine consumption. Exit 0 if clean, 1 if any stale entries.

**Test surface:** `tests/security/check-stale-known-unwired.test.ts` — 2 sanity tests against real audit-test files (exit-clean + JSON output) + 4 fixture tests (detects Shape A; detects Shape B; passes clean when import+used; reports missing files separately).

**Manifest update:** appends `#10443` to the `KNOWN_UNWIRED allowlists as migration-debt ledger` entry's `key_lessons`; extends the summary with the inverse-audit paragraph; appends the tool path to `canonical_docs`; extends the `trigger` with "adding inverse-audit coverage for a newly-surfaced stale-entry shape".

## New lesson candidates (1; below threshold)

### Codify + tool same-ship pattern

**Observation:** When a codify candidate names a "tool that would close the gap" in its forward-observation (per the v856 handoff's "candidate 5: `tools/security/check-stale-known-unwired.mjs` — the codification-ready stale-entry inverse-audit tool"), shipping the codification + the tool in the SAME milestone is faster than splitting across two ships. The codification is the doc + manifest update; the tool is the runtime enforcement. Both surfaces are independently small (~20 + ~30 min) but share recon overhead (~15 min) when shipped together.

**Why it matters:** Default codify ships at v847 were doc-only by convention. The same-ship coupling worked here because the tool was 1 file ~150 LOC + a 6-case test file — small enough not to expand the ship scope materially. For larger tools the split makes more sense.

**Instances:** 1 (v857 THIS SHIP).

**Forward-test trigger:** any future codify ship where the candidate's forward-observation names a tool that closes the gap AND the tool is single-file with a clear test surface.

**Promotion path:** Wait for 2nd instance. Likely classification — sub-pattern of #10428 (codify cadence) rather than a new discipline.

## Forward-test of existing lessons

### #10412 — Recon-first as default

**Status:** APPLIED. Read both source-ship retrospectives (v834 + v852) + read the v806 forward-observation + read all 3 audit-test files before authoring promotion text. ~10 min recon.

### #10421 — Static-analysis tool authoring

**Status:** APPLIED. The new tool follows #10421 conventions: spawnSync-not-execSync for tests (`spawnSync('node', [TOOL], ...)`); JSON output via explicit `--json` flag; structured exit code (0=clean, 1=stale); no auto-baseline (the audit-test files ARE the source of truth, no baseline file needed).

### #10422 + #10423 — Verdict-pattern surface separation + lightest wire

**Status:** APPLIED. The codification landed in the EXISTING `docs/known-unwired-ledger-discipline.md` (no new doc); the tool is the lightest implementation (regex-extract + grep, no AST parse); the test surface is fixture-based (no need to spin up the full chokepoint stack).

### #10426 — Cross-class registry extraction at the SECOND class instance

**Status:** REINFORCED. #10443 promoted at the 2-instance threshold (Shape A v834 + Shape B v852). The two distinct shapes provided the contrast that the codification needed — neither shape alone would have justified the meta-pattern.

### #10428 — Meta-cadence

**Status:** APPLIED. v857 lands at codify-cadence ship #10 past v847 (the 7-ship floor is v854, the 10-ship upper bound is v857; landing exactly at the upper bound matches the operator's "campaign batch close + codify before next chip cluster" preference).

### #10427 — Failure-mode contracts

**Status:** APPLIED via cross-reference. Stale entries are a silent-vs-loud asymmetry: under the v806 unidirectional check, both stale-shapes existed silently. The inverse-audit (inline checks at v838 for Shape A; the cross-audit tool at v857 for Shape B) converts the silence to loudness at audit time. Cross-referenced in the new section.

### #10432 — KNOWN_UNWIRED ledger (parent)

**Status:** EXTENDED. The new section is a top-level extension of the parent discipline rather than a new domain. The parent rule (KNOWN_UNWIRED is debt, not exemption) is unchanged; #10443 adds the rule for keeping the ledger ACCURATE — both shapes are accuracy-drift, not policy-drift.

### #10434 — KNOWN_UNWIRED generalization beyond chokepoints

**Status:** FORWARD-OBSERVATION REINFORCED. The inverse-audit shape generalizes to any ratcheted-allowlist gate. The discipline-coverage ceiling (v821) + chokepoint KNOWN_UNWIRED both share the inverse-audit potential. If the discipline-coverage ceiling ever surfaces its own stale-shape, the discipline #10443 codified here will apply.
