# v1.49.29 — Retrospective-Driven Process Hardening

**Released:** 2026-03-09
**Scope:** pure hardening release — 7 validated gaps closed, 3 contradictions resolved, 4 improvement axes delivered, 71 historical release notes backfilled with structured retrospectives
**Branch:** dev → main
**Tag:** v1.49.29 (commit `b06cf988b`, 2026-03-09T10:15:40-07:00)
**Commits:** v1.49.28..v1.49.29 (5 commits: `313702260`, `953c5ceff`, `5294b2c64`, `9b9b01f6f`, `b06cf988b`)
**Files changed:** 130 (+2,532 / −619)
**Predecessor:** v1.49.28 — Retro-Driven Improvements (the release that flagged the BCM/SHE extraction and seeded the gap-mining methodology)
**Successor:** v1.49.30 — first post-hardening release, returns to feature cadence on the hardened substrate
**Classification:** hardening — no new features, no new PNW research; every deliverable closes a tracked gap or contradiction
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Verification:** 13/13 success criteria PASS (SC-1..SC-13) · 2/2 safety-critical tests PASS (S1 existing test suite unaffected, S2 wave hook allows normal commits) · 140 shell scripts shellchecked · 11/11 PNW browsers now on the page.html component pattern · 0 typedoc errors against `src/` · 71 historical release notes retrofit with What Worked / What Could Be Better / Lessons Learned sections

## Summary

**Gap-mining 28 prior retrospectives produced a hardening backlog with zero speculation.** v1.49.29 was not scoped top-down from a feature wishlist. It was generated bottom-up by reading every What Could Be Better and Lessons Learned section shipped in the v1.49.0..v1.49.28 window and clustering the complaints into seven distinct gaps (GAP-1 test density, GAP-2 BCM/SHE architectural drift, GAP-3 wave commit marker validation, GAP-4 shellcheck coverage, GAP-5 LOC tracking, GAP-6 speculative infrastructure labeling, GAP-7 API documentation) plus three contradictions (C1 test category confusion, C2 LOC visibility gap, C3 hook-mode defaults). Each gap was traced back to the specific retrospective lines that produced it, so every deliverable in this release has a verifiable lineage. The methodology is the important artifact — retrospectives stopped being ceremony and became a scheduling input.

**Browser architecture unification closed the last two drifting cases.** Building Construction Mastery (BCM) and Smart Home & DIY Electronics (SHE) were the last two PNW browsers still shipping as monolithic `index.html` files with inline `<style>` blocks — every other browser in the series (COL, ECO, AVI, MAM, BPS, FFA, TIBS, and peers) had already migrated to the four-file component pattern of `index.html` shell loader + `page.html` markdown renderer + `mission.html` methodology page + `style.css` external stylesheet. Commit `5294b2c64` extracted both browsers into the component pattern, reducing BCM's `index.html` from 350 lines to a 40-line shell and pulling 187 lines into `style.css` with 200 lines of markdown rendering logic into `page.html`; SHE followed the same decomposition with 185 lines of style and 200 lines of page scaffolding. Both browsers were also registered into `www/PNW/series.js` so the series navigation bar now traverses all eleven projects without exception lists. The architectural invariant — one component pattern for every PNW browser — is now true at v1.49.29 and remains a first-class gate for any future browser work.

**Shell script hardening caught 22 real bugs across 140 scripts with zero behavioral changes.** Commit `313702260` ran shellcheck against every non-fixture `.sh` file in the repository and fixed 22 issues: 3 in hook scripts (of 8 total, 5 were already clean), 7 in top-level `scripts/` utilities (of 18 total), and 12 across `infra/scripts/` and `infra/tests/` (of the 115+ scripts under those trees). The bugs were not theoretical lint nits — they included redirect ordering errors that silently truncated output files, unquoted glob expansions that would have broken on paths containing spaces, and `[ ]` vs `[[ ]]` conditional mismatches that produced wrong results when operands were empty. Every fix was syntactic-only and preserved pre-existing behavior where that behavior was intentional; where behavior was buggy the diff documents the correction. Shellcheck pragmas were added only where the warning is a known false positive, and each pragma carries a comment explaining why — lint output became living documentation rather than noise. The scripts that matter for production (provision-vm.sh, deploy-minecraft.sh, backup-world.sh, restore-world.sh, discover-hardware.sh, golden-image.sh, verify-pipeline.sh) are now POSIX-clean and Bash 3.2-compatible, which matters for macOS (Bash 3.2 is still the system shell Apple ships).

**Test density tooling turned a recurring retrospective complaint into a measurable gate.** GAP-1 had been flagged seven times in prior retrospectives — "test coverage feels uneven" without a way to quantify the feeling. Commit `9b9b01f6f` shipped `scripts/check-test-density.sh`, a POSIX script that walks the tree, counts test LOC separately from deliverable LOC, and reports PASS/FAIL against a 2.5% floor. It also shipped three companion documents: `docs/testing/test-categories.md` defining the four test categories (Unit for single-function verification, Integration for cross-module flows, Visual for browser-rendered content, Platform for OS-specific behaviors), `docs/testing/bash-compat-checklist.md` enumerating the Bash 3.2 features every script in the repository must tolerate for macOS support, and `docs/testing/macos-smoke-test.md` prescribing the manual verification checklist that runs during cross-platform validation. The 2.5% threshold is deliberately generous for a first milestone gate — the point is to have any threshold, not the perfect one, so large releases trigger a conscious review instead of sliding past unnoticed.

**Wave commit marker validation shipped in warning mode — the right default for new hooks.** v1.49.27 retrospectives surfaced the risk that the wave commit convention (`Wave N: description` lines in commit messages) was drifting because nothing enforced the format. Both `validate-commit.sh` hooks (pre-commit and PreToolUse variants) were extended to parse commit messages for `Wave <N>:` lines, verify the number is sequential across a given commit, and emit a warning when the format is malformed. Crucially, the hook runs in warning mode — it logs the issue but does not block the commit. Warning mode is the right default for new hooks: one release of clean operation in the field proves the hook does not have false positives that would make it a development blocker, and only then is it safe to upgrade to blocking mode. The same pattern applied to the original validate-commit.sh hook at its introduction, and it is now encoded in the project's hook lifecycle: ship warning, observe one release, then harden.

**LOC per Release landed as a STATE.md section so codebase growth became visible.** A 15K insertions-per-release threshold now flags any release for conscious review, and `.planning/STATE.md` was extended with a new "LOC per Release" section pre-populated with measurements for v1.49.22 through v1.49.29. The threshold is generous — a full-scope PNW research project regularly ships 15K–18K lines as a single atomic commit — but having any threshold means the project stops sliding past silent growth. Future releases that exceed the flag will surface in the weekly STATE.md review rather than only showing up after a readability complaint. The same principle — visibility beats arbitrary hardness — also drove the speculative infrastructure inventory and the test density tooling; v1.49.29's process-tightening wave is, in effect, three different implementations of the same retrospective lesson: "make the silent things loud."

**Speculative infrastructure inventory replaced 40-file header labeling with a single catalog document.** An earlier retrospective had proposed sprinkling `NOT VALIDATED` headers across roughly forty infrastructure files that were designed but not yet production-exercised (VM backends, platform abstractions, PXE/kickstart templates, Minecraft world specifications, runbooks, knowledge-pack pipelines, monitoring and alerting stacks). That approach would have touched forty files with a single-purpose edit, polluting diffs and making the headers the first line of every script. Instead, `infra/SPECULATIVE-INVENTORY.md` landed as a single inventory document that catalogs 28 infrastructure files across 7 categories, documents each category's validation status, and names the build phase that will exercise it. The inventory makes clear that speculative infrastructure is not technical debt — it's cartography for a territory the project has not yet built out. The approach saved thirty-eight file touches, preserved signal-to-noise in the affected scripts, and centralized the validation-status conversation in one place.

**TypeScript API doc generation closed the last gap without committing generated output.** GAP-7 was that the project had accumulated enough typed TypeScript surface that downstream consumers needed reference documentation, but nothing generated it. Commit `9b9b01f6f` added `typedoc.json` configured for `src/` with test and fixture exclusions, a new `docs:api` npm script that runs `npx typedoc` on demand, and a `docs/api/` directory added to `.gitignore` so generated output does not pollute git. The generator was verified to produce output with zero errors against the current `src/` tree. The decision to gitignore the output is deliberate: generated artifacts belong in release pipelines and CDN upload steps, not in the repository, because they are a function of source and cannot drift from source without being wrong. Future work may wire the generation step into a docs-publish pipeline, but v1.49.29's contribution is the reproducible command and the verified zero-error run.

**Historical retrospective backfill converted 71 release notes from changelog to decision journal.** Commit `953c5ceff` retrofitted every README in `docs/release-notes/v1.0/..v1.49.19/` — a sweep of 71 files — with three structured sections: What Worked (specific engineering decisions that proved sound), What Could Be Better (honest assessment of scope, timing, and architectural trade-offs), and Lessons Learned (numbered insights distilled from each release). For releases whose original authors had not written retrospectives in the moment, the backfill was explicitly reconstructed from artifact analysis — the text acknowledges its retrospective nature and flags early-version entries as such. The payoff is immediate: the release-notes directory is now a queryable decision journal, and the gap-mining methodology that scoped v1.49.29 itself became feasible only because those 71 files now carry structured retrospective text. The investment pays forward every time a future release needs scoping input.

**Five commits landed as a 4-wave structure with parallel tracks and clean handoffs.** Wave 1A (commit `5294b2c64`, BCM/SHE component extraction) and Wave 1B (commit `313702260`, shell script hardening) ran in parallel because they touched disjoint directories (`www/PNW/BCM/` + `www/PNW/SHE/` vs `infra/scripts/` + `scripts/` + `tests/`). Wave 2 (commit `9b9b01f6f`, testing infrastructure) built on both. Wave 3 (commit `953c5ceff`, historical retrospective backfill) was independent and could have run first but was sequenced last because its output — the structured retrospective sections — is the substrate the gap-mining methodology reads from, so having it in place at release tip makes the methodology reproducible by future releases. Wave 4 (commit `b06cf988b`, this release note) capstoned the release. Wave 2 was completed in a new session after Wave 1 closed, using a `HANDOFF.md` document that preserved context across a session boundary; the handoff produced zero rework and immediate productivity on session resume, validating the session-handoff pattern for future multi-session work.

## Key Features

| Area | What Shipped |
|------|--------------|
| Historical retrospective backfill (71 files) | `docs/release-notes/v1.0/..v1.49.19/README.md` — every historical release note now carries What Worked / What Could Be Better / Lessons Learned sections; commit `953c5ceff` added 1,237 lines across 71 files |
| BCM component extraction (GAP-2) | `www/PNW/BCM/index.html` reduced 350→40 lines + `www/PNW/BCM/style.css` (187 lines) + `www/PNW/BCM/page.html` (200 lines) + `www/PNW/BCM/mission.html` (38 lines); commit `5294b2c64` |
| SHE component extraction (GAP-2) | `www/PNW/SHE/index.html` reduced from monolithic to shell + `www/PNW/SHE/style.css` (185 lines) + `www/PNW/SHE/page.html` (200 lines) + `www/PNW/SHE/mission.html` (39 lines); commit `5294b2c64` |
| Series navigation registration | `www/PNW/series.js` — BCM and SHE added to the PNW series navigation bar so all 11 browsers traverse without exception lists |
| Shell script shellcheck pass (GAP-4) | 140 non-fixture `.sh` files scanned; 22 bugs fixed (redirects, globs, quoting); pragmas added with explanatory comments where suppressions are warranted; commit `313702260` |
| Test density checker (GAP-1, C1) | `scripts/check-test-density.sh` (68 lines) — POSIX script that measures test-LOC vs deliverable-LOC ratio, reports PASS/FAIL against a 2.5% floor |
| Test categories documentation | `docs/testing/test-categories.md` (42 lines) — formal definitions for Unit, Integration, Visual, Platform test categories |
| Bash 3.2 compatibility checklist | `docs/testing/bash-compat-checklist.md` (32 lines) — feature reference for macOS-compatible shell scripts |
| macOS smoke test checklist | `docs/testing/macos-smoke-test.md` (34 lines) — manual verification procedure for cross-platform validation runs |
| Wave commit marker hook (GAP-3) | Both `validate-commit.sh` hooks (pre-commit + PreToolUse) extended to parse and validate `Wave <N>:` commit marker format in warning mode |
| LOC per Release tracking (GAP-5, C2) | `.planning/STATE.md` — new "LOC per Release" section pre-populated with v1.49.22..v1.49.29 measurements; 15K-LOC flag threshold |
| Speculative infrastructure inventory (GAP-6) | `infra/SPECULATIVE-INVENTORY.md` — single catalog document replacing 40-file NOT-VALIDATED header sprinkle; 28 files across 7 categories |
| TypeScript API doc generation (GAP-7) | `typedoc.json` + `npm run docs:api` script + gitignored `docs/api/` output directory; verified 0 typedoc errors against `src/` |
| Complete-milestone workflow additions | `.claude/get-shit-done/workflows/complete-milestone.md` — extended with test density + LOC gate checkpoints |

## Retrospective

### What Worked

- **Retrospective-driven sequencing is now a proven methodology.** The entire release was scoped by mining 28 prior retrospectives for complaints, clustering them into 7 gaps and 3 contradictions, and treating every gap as a first-class work item. No gap was invented, no gap was speculative — every one had a verifiable quote from a prior retrospective behind it. The methodology is reusable: any future hardening release can run the same playbook against whatever retrospective window is open.
- **4-wave structure with parallel disjoint tracks was the right shape.** Waves 1A (`www/PNW/BCM/` + `www/PNW/SHE/`) and 1B (`infra/scripts/` + `scripts/` + `tests/`) touched disjoint directories, so they ran in parallel without merge conflicts and without wasted coordination overhead. Wave 2 (testing infrastructure) built on both but didn't depend on their content. Wave 3 (historical backfill) was independent. The dependency graph was clean and the waves stayed decoupled.
- **Shellcheck pragmas as documentation changed the signal-to-noise ratio.** Every shellcheck suppression carries an inline comment explaining why the warning is a false positive for that line. The result is lint output that reads as living documentation — a reader coming to a script six months later sees both the warning and the reason it was suppressed in the same place, and the warning is real information rather than noise.
- **Lightweight speculative inventory beat heavy per-file labeling.** The earlier proposal was to touch 40 files with `NOT VALIDATED` headers; the shipped solution was one `infra/SPECULATIVE-INVENTORY.md` file. Same information, 38 fewer file touches, centralized conversation, and the inventory became searchable as a single artifact. Centralization wins when the metadata is orthogonal to the files' primary purpose.
- **Session handoff via HANDOFF.md produced zero rework across context boundaries.** Wave 2 started in a new session after Wave 1 closed. The handoff document captured enough state that the new session picked up and produced working output immediately — no context re-discovery, no duplicated work, no misaligned assumptions. The pattern validates session-handoff as a load-bearing operation for multi-session releases.
- **Warning mode for the new wave-marker hook was the right default.** Shipping the hook as warning-only instead of blocking means one release of observation in the field can prove out false-positive behavior before the hook becomes a development blocker. The same pattern applies to any new enforcement hook and is now the project's standing convention.

### What Could Be Better

- **Retrospective backfill is necessarily speculative for early releases.** v1.0 through ~v1.20 retrospectives were reconstructed from artifact analysis (git log, commit messages, code diffs) rather than lived session context, because the original authors had not written them in the moment. The backfill text acknowledges this, but a reader studying those early lessons should treat them as interpretive reconstructions rather than primary-source observations.
- **Wave commit marker validation is limited by message-extraction fidelity.** The hook parses the `-m` flag content, which does not preserve newlines from heredoc-style commit messages. That means multi-line wave markers split across heredoc lines are invisible to the current parser. Warning mode is appropriate until message-extraction improves to support the heredoc case, at which point the hook can be upgraded to blocking.
- **Test density checker only covers TypeScript deliverables.** The checker counts `.ts` and `.tsx` test LOC against `.ts`/`.tsx` deliverable LOC, but does not yet count shell script tests (`infra/tests/`), Python assertions, or PNW browser verification checklists. Polyglot test counting is a clear next-step; until it lands, the density measurement understates total test coverage for mixed-language deliverables.
- **TypeScript API doc generation ships the command but no pipeline wiring.** `npm run docs:api` produces zero-error output on demand, but there is no CI step that runs it on every release, no CDN upload path for the generated artifacts, and no discoverability from the project homepage. The command is the floor; the pipeline is still to build.

## Lessons Learned

- **Retrospectives are infrastructure, not ceremony.** Writing retrospectives in a consistent structure (What Worked / What Could Be Better / Lessons Learned) turns them into queryable scheduling input. The 71-file backfill in this release is the proof: mining those files produced 7 actionable gaps, which scoped an entire hardening release without any top-down wishlist. If the backfill had never happened, this release would not have been schedulable in the form it took.
- **Architecture unification compounds across future work.** Making all eleven PNW browsers share the same component pattern means every future browser enhancement applies to all of them instead of most. The cost of extracting BCM and SHE was paid once in v1.49.29; the benefit accrues on every subsequent feature that touches the browser stack. Unification investments pay forward at a rate proportional to future work on the unified surface.
- **Warning mode is the right default for every new enforcement hook.** A new hook running in blocking mode on day one risks becoming a development blocker the first time it produces a false positive. Warning mode gives the hook a release of field observation before the team commits to blocking behavior. This pattern is now a standing convention for hook introductions in the project.
- **Speculative infrastructure is cartography, not debt.** Designing infrastructure files ahead of the build phase that will exercise them is a deliberate mapping exercise, not accumulated debt. The inventory document is the right vehicle for making that distinction visible — the files are not abandoned or unmaintained; they are waiting for their activating phase, and the inventory says which phase that is.
- **LOC visibility prevents silent growth.** Any threshold is better than no threshold. The 15K flag in STATE.md is generous enough that normal work never trips it, but strict enough that a 40K-LOC accidental-mega-commit would surface in review instead of sliding past. Visibility is the mechanism; the exact threshold is a tuning knob.
- **Lightweight inventory documents beat per-file metadata sprinkles.** When metadata is orthogonal to a file's primary content (validation status, speculative flag, owner assignment), centralizing the metadata in an inventory document preserves signal-to-noise in the affected files and makes the metadata searchable as a single artifact. Per-file headers are appropriate only when the metadata is intrinsic to reading the file in isolation.
- **Session handoff is a load-bearing operation and deserves a first-class artifact.** A `HANDOFF.md` file that captures enough state to resume a mid-release work stream in a new session is not overhead — it is the primary mechanism that enables multi-session releases to complete without context loss. Treat it as a deliverable, not a note.
- **Measure the ratio, not the absolute.** Test density as "test LOC / deliverable LOC ratio against a 2.5% floor" scales naturally as the codebase grows, whereas an absolute test-LOC floor would either over-constrain small features or under-constrain large ones. The same ratio pattern applies to LOC tracking (flag on insertions per release), documentation coverage (comment ratio), and any measurement where the meaningful number is relative to surrounding volume.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.28](../v1.49.28/) | Predecessor — Retro-Driven Improvements, the release that flagged BCM/SHE extraction and seeded the gap-mining methodology v1.49.29 operationalized |
| [v1.49.30](../v1.49.30/) | Successor — first post-hardening release, resumes feature cadence on the hardened substrate produced here |
| [v1.49.27](../v1.49.27/) | Source of GAP-3 — wave commit marker validation was flagged in v1.49.27 retrospectives before landing in v1.49.29 |
| [v1.49.26](../v1.49.26/) | Source of the "master index atomic update" pattern — BPS retrospective introduced the discipline that v1.49.29 formalizes at release scope |
| [v1.49.25](../v1.49.25/) | Source of GAP-2 — AVI/MAM release surfaced BCM/SHE architectural drift in its cross-reference review |
| [v1.49.19](../v1.49.19/) | Last pre-backfill historical release — the retrospective backfill in v1.49.29 extends from v1.0 to v1.49.19 inclusive |
| [v1.49.12](../v1.49.12/) | Heritage-skills-pack pattern — pack-shape component layout analogous to the BCM/SHE four-file extraction |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — upstream pattern for one-component-per-file layout the BCM/SHE extraction inherits |
| [v1.49.0](../v1.49.0/) | Parent mega-release — v1.49.x line baseline that v1.49.29 hardens |
| [v1.49](../v1.49/) | Consolidated v1.49 release notes — top-level entry for the v1.49.x series |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack template pattern the PNW browser stack inherits |
| [v1.10](../v1.10/) | Security Hardening — precedent for hardening-only releases that pay down debt without shipping features |
| [v1.8.1](../v1.8.1/) | Audit Remediation patch — earliest precedent for the "close all flagged gaps in one atomic release" pattern |
| [v1.0](../v1.0/) | Foundation — Observe → Detect → Suggest → Apply → Learn → Compose loop; v1.49.29 hardens the Observe and Learn steps by making retrospectives queryable |
| `infra/SPECULATIVE-INVENTORY.md` | Speculative infrastructure catalog — 28 files across 7 categories, GAP-6 resolution |
| `scripts/check-test-density.sh` | Test density checker — GAP-1/C1 resolution, 2.5% floor |
| `docs/testing/test-categories.md` | Four test category definitions — GAP-1 companion document |
| `docs/testing/bash-compat-checklist.md` | Bash 3.2 compatibility reference for macOS support |
| `docs/testing/macos-smoke-test.md` | Manual cross-platform verification checklist |
| `typedoc.json` | TypeScript API doc generator configuration — GAP-7 resolution |
| `.planning/STATE.md` | LOC per Release tracking section — GAP-5/C2 resolution |

## Engine Position

v1.49.29 sits in the v1.49.x hardening arc between v1.49.28 (the release that flagged BCM/SHE and seeded the gap-mining methodology) and v1.49.30 (the first post-hardening release to return to feature cadence). In the broader project timeline it is a mid-line hardening release — pure debt paydown, no new features, no new PNW research — analogous to v1.8.1 (Audit Remediation) and v1.10 (Security Hardening) in earlier eras. The architectural footprint is disproportionately large relative to the 5-commit count: 130 files changed span release notes (71), PNW browsers (10), shell scripts (44), testing infrastructure (5), and the milestone workflow. Looking forward, v1.49.29 becomes the reference implementation for retrospective-driven hardening: any future hardening release that mines a retrospective window, clusters complaints into gaps, and ships fixes in parallel waves inherits the methodology, the test-density tooling, the LOC visibility gate, the warning-mode hook discipline, and the speculative inventory pattern. The v1.49.x line from v1.49.29 onward runs on a hardened substrate where all eleven PNW browsers share architecture, all 140 shell scripts are shellcheck-clean, every historical release carries structured retrospectives, and codebase growth is continuously visible in STATE.md.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.28..v1.49.29) | 5 |
| Files changed | 130 |
| Lines inserted / deleted | 2,532 / 619 |
| Historical release notes backfilled | 71 (v1.0 through v1.49.19) |
| Retrospective section lines added | 1,237 across the 71 files |
| PNW browsers on component pattern (before → after) | 9/11 → 11/11 |
| BCM `index.html` reduction | 350 → ~40 lines (shell loader) |
| SHE `index.html` reduction | monolithic → shell loader (same pattern) |
| Shell scripts shellchecked | 140 (non-fixture) |
| Shell script fixes applied | 22 (3 hooks + 7 core + 12 infra) |
| Shellcheck pragmas added | per-site with inline explanations |
| Testing documents added | 3 (`test-categories.md`, `bash-compat-checklist.md`, `macos-smoke-test.md`) |
| Test density floor | 2.5% (test-LOC / deliverable-LOC) |
| LOC-per-release flag threshold | 15,000 |
| Speculative infrastructure files cataloged | 28 across 7 categories |
| Success criteria | 13/13 PASS (SC-1..SC-13) |
| Safety-critical tests | 2/2 PASS (S1 suite unaffected, S2 hook allows normal commits) |
| Hooks added | 1 (wave commit marker, warning mode) |
| npm scripts added | 1 (`docs:api`) |
| typedoc errors | 0 |

## Files

- `docs/release-notes/v1.0/..v1.49.19/README.md` — 71 historical release notes, each extended with What Worked / What Could Be Better / Lessons Learned; commit `953c5ceff`, +1,237 lines
- `www/PNW/BCM/index.html` + `page.html` + `mission.html` + `style.css` — BCM browser extracted into the four-file component pattern
- `www/PNW/SHE/index.html` + `page.html` + `mission.html` + `style.css` — SHE browser extracted into the four-file component pattern
- `www/PNW/series.js` — BCM and SHE added to the PNW series navigation registry
- `infra/scripts/` + `infra/tests/` + `scripts/` + `tests/` — 44 shell scripts updated with shellcheck pragmas and behavioral fixes; commit `313702260`
- `scripts/check-test-density.sh` — 68-line POSIX test density checker enforcing 2.5% floor
- `docs/testing/test-categories.md` — 42-line definition of Unit, Integration, Visual, Platform categories
- `docs/testing/bash-compat-checklist.md` — 32-line Bash 3.2 compatibility feature reference
- `docs/testing/macos-smoke-test.md` — 34-line manual verification checklist for macOS runs
- `.claude/get-shit-done/workflows/complete-milestone.md` — 78-line milestone workflow extended with density and LOC gates
- `infra/SPECULATIVE-INVENTORY.md` — single-document catalog of 28 speculative infrastructure files
- `typedoc.json` — TypeScript API doc generator configuration scoped to `src/`
- `package.json` — `docs:api` npm script added; `docs/api/` added to `.gitignore`
- `.planning/STATE.md` — new "LOC per Release" section pre-populated with v1.49.22..v1.49.29 measurements
- `.claude/hooks/validate-commit.sh` + PreToolUse equivalent — wave commit marker validation (warning mode)
- `docs/release-notes/v1.49.29/chapter/00-summary.md` — auto-generated parse of this README with Prev/Next navigation
- `docs/release-notes/v1.49.29/chapter/03-retrospective.md` — retrospective chapter with What Worked / What Could Be Better
- `docs/release-notes/v1.49.29/chapter/04-lessons.md` — 8 lessons extracted with tracker status
- `docs/release-notes/v1.49.29/chapter/99-context.md` — release context chapter

Aggregate: 130 files changed, 2,532 insertions, 619 deletions, 5 commits (`313702260` → `b06cf988b`), v1.49.28..v1.49.29 window.
