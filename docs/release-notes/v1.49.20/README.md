# v1.49.20 — Documentation Consolidation

**Released:** 2026-03-06
**Scope:** canonical-docs refresh + Gastown integration guide + release-history gap fill + build cleanup
**Branch:** dev → main
**Tag:** v1.49.20 (2026-03-06, "Documentation Consolidation")
**Commits:** v1.49.19..v1.49.20 (25 commits, head `069b75b01`)
**Files changed:** 21 (+2,115 / −30)
**Predecessor:** v1.49.19 — Gastown Chipset Integration
**Successor:** v1.49.20.1 — Documentation Reflections
**Classification:** feature — first major canonical-documentation consolidation since v1.34
**Phases covered:** 5 documentation phases (README / CORE-CONCEPTS / HOW-IT-WORKS / FEATURES / release-history)
**Verification:** documentation-only diff · Ajv import fix closes v1.49.19 TypeScript lint · release-history table repaired for v1.49.17–v1.49.19 · `gitignore` entry for sub-project `package-lock.json`

## Summary

**Documentation became a first-class deliverable after the v1.49.13–v1.49.19 feature surge.** The seven releases preceding v1.49.20 each added major architecture — mesh telemetry, dependency-health scoring, the MCP pipeline, the cartridge format, the Space Between Observatory, and the 12-skill Gastown chipset — but the canonical documents at the repository root (`README.md`, `docs/CORE-CONCEPTS.md`, `docs/HOW-IT-WORKS.md`, `docs/FEATURES.md`, `docs/RELEASE-HISTORY.md`) had not moved to match. v1.49.20 is the catch-up. Five sequential documentation phases shipped in dependency order, adding 631 lines to the four canonical docs plus 1,373 lines of new Gastown integration prose under `docs/gastown-integration/`. The release is named Documentation Consolidation because that is literally what it does: it consolidates six milestones of architectural drift into the documents a new reader opens first. The shape of the consolidation matters more than the line count — CORE-CONCEPTS gained seven new first-class concepts (Teams, Chipsets, DACP, College Structure, Muse Architecture, Cartridge Format, Mission Packs), HOW-IT-WORKS was restructured into a two-part narrative (skill lifecycle + execution engine) rather than a single monolithic document, and FEATURES.md picked up 31 capability entries (entries 183–213) plus seven version history blocks covering v1.49.13 through v1.49.19.

**Five-phase dependency order kept the documentation diff reviewable.** Phase 1 (`419012ac9`) dropped the 10-document Gastown integration guide and the v1.49.19 release notes — 1,373 insertions across 12 files, but all in new directories so the diff was read-only-plus-additions. Phase 2 (`a3899d857`) filled phase and plan counts in `docs/RELEASE-HISTORY.md` for v1.49.17–v1.49.19, a surgical 8-line change that closed a ledger drift caused by those releases landing without their metadata being back-filled into the summary totals. Phase 3 (`fed3e8547`) added the Gastown chipset section to `README.md` and updated the stats row (65 milestones, 541+ phases, 1,312+ plans, ~632K LOC, 24,500+ tests) to reflect the new reality. Phase 4 (`52a69b0fc`) restructured `docs/HOW-IT-WORKS.md` into the two-part form (skill lifecycle vs. execution engine) and added wave execution, DACP bundle flow, chipset validation, agent team patterns, the learning loop, and context management — 229 insertions on a file that previously had none of those concepts at the top level. Phase 5 (`912e2868f`) added the seven new first-class concepts to `docs/CORE-CONCEPTS.md`, 362 insertions on what had been a much thinner concept catalog. The merge commit (`069b75b01`) landed the whole stack on dev with a message that names the five phases explicitly.

**Gastown Chipset Integration Guide ships as the longest single-topic documentation set in the repo to date.** `docs/gastown-integration/` is 11 files and 1,373 lines covering architecture overview (97 lines), concept mapping (111 lines), trust boundary (124 lines), chipset setup (221 lines), agent topology (195 lines), communication channels (202 lines), dispatch and retirement (65 lines), upstream intelligence (114 lines), multi-instance (80 lines), and GSD milestone workflow (101 lines), plus a README index (35 lines) and the v1.49.19 release notes (28 lines). The guide is structured for a reader following a learning arc — architecture first, then concept-to-concept mappings with the host project, then the trust and security boundary, then setup, topology, channels, dispatch, upstream intelligence, multi-instance deployment, and finally how the chipset integrates with GSD milestones. Nothing in the guide duplicates source code; every document answers a question code cannot answer directly (what does "mayor" mean in the topology, why is the trust boundary where it is, how do communication channels choose between synchronous and asynchronous delivery, what happens when a dispatched work item retires). This is the v1.49.20 instance of the long-standing project principle that teaching reference IS the research — the 10-doc guide is how a new reader learns the chipset, and it ships with the chipset rather than after it.

**Canonical concepts now form a deliberate catalog rather than ad-hoc references.** Before v1.49.20, `docs/CORE-CONCEPTS.md` described the original adaptive-learning primitives (skills, agents, the 6-step loop) but said nothing about Teams (v1.4), Chipsets (v1.13 + v1.49.19), DACP (v1.49), College Structure (v1.49.8–v1.49.10), Muse Architecture (v1.49.16), Cartridge Format (v1.49.17), or Mission Packs (v1.49.19). Phase 5 closed that gap in one 362-insertion commit. Each concept got a canonical entry with the version it shipped in, a short description that points at the load-bearing file or directory, and cross-references to related concepts. Teams describe topologies (mesh, star, ring) and the APT lessons lineage that fed into `sc-dev-team`. Chipsets distinguish the Amiga coprocessor model (v1.13's 10-coprocessor architecture) from the Gastown orchestration model (v1.49.19's 12-skill topology) as two complementary designs. DACP explains the three-part bundle (assembler, transport, interpreter) and the adaptive-fidelity L0–L3 scale plus the retrospective-analyzer from v1.49. College Structure names the Rosetta Core, departments, and calibration engine as the full educational substrate from v1.49.8–v1.49.10. Muse Architecture lists the 9 named agents and the complex-plane positioning from v1.49.16. Cartridge Format describes the composable-knowledge-package pattern from v1.49.17 with the Space Between cartridge as the first concrete instance. Mission Packs document the Study→Map→Define→Build→Test→Document→Ship absorption pipeline from v1.49.19. The cross-reference section at the bottom of CORE-CONCEPTS links every new concept to every related concept — this is the concept graph the canonical document previously lacked.

**HOW-IT-WORKS two-part restructure is a pedagogical move, not a cosmetic one.** Part 1 covers the skill lifecycle (create, observe, pattern, refine, compose, retire) and Part 2 covers the execution engine (GSD phase lifecycle, wave-based parallel execution, chipset validation pipeline, mission-pack absorption, DACP bundle flow, agent team patterns, learning loop, context management). The split reflects how a reader actually learns the system: first understand what a skill is and how it changes over time, then understand how skills and agents execute work in parallel within the larger GSD framework. Part 2's new content is dense — wave-based parallel execution now describes real metrics from v1.49.19 (5 waves, 10 parallel tracks, ~40 minutes wall time for 25 commits), chipset validation lays out the 4-stage pipeline (schema → token budget → topology → channels), and context management defines the green/yellow/red pressure zones and handoff protocols that show up in every session report. The learning loop section formalizes the observe → record → pattern → predict → improve cycle as the invariant at the center of everything the adaptive layer does. This is the first time HOW-IT-WORKS has contained execution-engine content at that level of detail, and the restructure is what made room for it without crowding out the original skill-lifecycle material.

**FEATURES.md catches up seven versions in one commit.** Phase 1 of the five-phase sequence added 31 capability entries numbered 183–213 covering the telemetry, dependency-health, mesh-architecture, MCP-pipeline, cartridge-format, observatory, and Gastown-chipset work. It also added seven version history blocks (v1.49.13 through v1.49.19), each with the shipped summary, the commit range, and a cross-reference to the relevant release notes directory. The v1.49.19 entry cross-references `docs/gastown-integration/` explicitly so a reader who lands on FEATURES.md can jump straight to the integration guide without hunting. This is the pattern FEATURES.md is now expected to follow going forward — every release appends its capabilities inline, so the document stays current rather than drifting behind by months. The 38-line diff is small in absolute terms but represents a substantial load on the document's purpose: FEATURES.md is the document a new user opens to understand what the project can do, and before v1.49.20 it was missing everything after v1.49.12.

**Release-history gap fill closed the scoreboard's longest-standing drift.** `docs/RELEASE-HISTORY.md` carries a table with phase counts and plan counts per release, and three releases (v1.49.17 The Space Between, v1.49.18 Space Between Observatory, v1.49.19 Gastown Chipset Integration) had shipped without their counts being back-filled into the table. Phase 2 filled them: v1.49.17 = 4 phases / 4 plans, v1.49.18 = 5 phases / 11 plans, v1.49.19 = 5 phases / 10 plans. The summary totals at the top of the file updated to 541+ phases and 1,312+ plans to reflect the corrected counts. This is the kind of drift that looks small in a diff but breaks the release history's role as a source of truth — any tooling that reads the table (including the scorer itself) was pulling incomplete data for those three releases until this commit landed.

**Housekeeping commits close real debt rather than padding the release.** `16ec8c176` (fix(gastown): resolve Ajv import and implicit any type errors) closed three lint failures left over from the v1.49.19 chipset validator — Ajv's default export changed import shape, and two `any`-typed parameters needed explicit types. The fix is five lines, but it was the thing blocking the v1.49.19 TypeScript build from going clean. `0b98d49ff` (chore: gitignore sub-project package-lock.json) added the `the-space-between-engine/package-lock.json` file (4,094 lines generated from its own npm install) to `.gitignore`, and the same commit removed the file from the tree. This stops the sub-project's lock file from churning the main repo's diffs on every install. `1e0ef5a70` and `714d2bd15` restored the full detailed release notes for v1.49.17 and v1.49.18 that had been truncated during an earlier catch-up. These are small commits that would be easy to dismiss as noise but they are the work that made the rest of the release's documentation consistent with the code it describes.

**v1.49.20.1 followed 1 hour 29 minutes later as a direct extension.** The patch release (tagged at 06:49 PST the same day) added four more documentation commits — a Gastown/Amiga chipset boundary table in CORE-CONCEPTS, a payload-agnostic execution pattern in HOW-IT-WORKS, a stale-metrics fix across five docs, and an audit-tracker update. v1.49.20.1 ships as Documentation Reflections because it is the retrospective pass that emerged from reviewing v1.49.20's output: placeholders that still referenced stale phases, supersession notices that needed to point at `meta/`, educational context headers on runbook/sysadmin documents, and cross-references that needed to resolve to the Mayor-coordinator pattern. Cross-reference v1.49.20.1 if you need the full picture of the documentation state on 2026-03-06; v1.49.20 is the primary release that set the structure, and v1.49.20.1 is the polish pass. Together they are the pair of commits that brought the canonical documentation back into alignment with the code after seven feature-heavy releases.

**The release's architectural claim is that documentation has to ship on the same cadence as code.** Before v1.49.20 the project was running a hidden documentation debt: seven feature releases (v1.49.13 through v1.49.19) had accumulated roughly four months of conceptual drift against the canonical documents. The explicit claim v1.49.20 makes is that catching up costs more than keeping up, and keeping up means dedicating a release (or a clearly-scoped phase inside a feature release) to documentation work. The five-phase dependency order inside v1.49.20 is reusable as a pattern — catch the release history first (ledger integrity), then the README (entry point), then HOW-IT-WORKS (engine), then CORE-CONCEPTS (catalog), then FEATURES.md (surface). Future docs-consolidation releases that adopt this ordering will inherit a reviewable diff shape and a small blast radius per commit. The release is deliberately documentation-only (apart from one 5-line Ajv fix) because mixing doc consolidation with feature work would have made the 2,115-line diff unreadable.

## Key Features

| Area | What Shipped |
|------|--------------|
| Gastown Integration Guide | `docs/gastown-integration/` — 10 documents + README + v1.49.19 notes; 1,373 lines covering architecture, concept mapping, trust boundary, chipset setup, agent topology, communication channels, dispatch & retirement, upstream intelligence, multi-instance, and GSD milestone workflow |
| CORE-CONCEPTS refresh | `docs/CORE-CONCEPTS.md` — +362 lines; 7 new first-class concepts (Teams, Chipsets, DACP, College Structure, Muse Architecture, Cartridge Format, Mission Packs) plus Wave Execution, GSD-OS Desktop, and cross-references section |
| HOW-IT-WORKS restructure | `docs/HOW-IT-WORKS.md` — +222 / −7 lines; two-part narrative (skill lifecycle + execution engine) with wave execution, DACP bundle flow, chipset validation, agent team patterns, learning loop, and context management |
| FEATURES capabilities catch-up | `docs/FEATURES.md` — +38 lines; 31 capability entries (183–213) and 7 version history blocks (v1.49.13–v1.49.19); Gastown cross-reference under v1.49.19 |
| README chipset section | `README.md` — +38 / −5 lines; Gastown chipset subsection, Amiga↔Gastown framing as complementary chipset models, project stats updated (65 milestones, 541+ phases, 1,312+ plans, ~632K LOC, 24,500+ tests) |
| GETTING-STARTED URL fix | `docs/GETTING-STARTED.md` — GitHub URL corrected to `Tibsfox/gsd-skill-creator` (identity-drift closure post-rename from `dynamic-skill-creator`) |
| Release-history gap fill | `docs/RELEASE-HISTORY.md` — v1.49.17 (4/4), v1.49.18 (5/11), v1.49.19 (5/10) phase/plan counts; summary totals to 541+ phases / 1,312+ plans |
| Ajv import fix | `src/chipset/gastown/validate-chipset.ts` — 5-line fix closing v1.49.19 TypeScript lint (Ajv default-export shape + two implicit-any parameter types) |
| Sub-project gitignore | `.gitignore` + removal of `the-space-between-engine/package-lock.json` (4,094 lines) — stops sub-project lock-file churn in main repo diffs |
| v1.49.17 notes restore | `docs/release-notes/v1.49.17/README.md` — +21 / −13 lines; restored detailed retrospective that had been truncated during earlier catch-up |
| v1.49.18 notes ship | `docs/release-notes/v1.49.18/README.md` — 53 new lines; full retrospective notes plus RELEASE-HISTORY update |
| Merge to dev | `069b75b01` — merge commit landing the five documentation phases plus the Gastown integration guide on the dev branch |

## Retrospective

### What Worked

- **Five-phase dependency order produced a reviewable diff.** Release-history → README → HOW-IT-WORKS → CORE-CONCEPTS → FEATURES. Each phase compiled clean against the phase before it, and the commit history reads top-to-bottom as a documentation build log. Ledger integrity first, entry-point refresh next, engine deep dive after, concept catalog on top, surface capabilities last.
- **Gastown integration guide landed with the chipset rather than after it.** 1,373 lines of new prose under `docs/gastown-integration/` arrived in the same release window as the v1.49.19 chipset code itself. This is the shortest lead time between chipset ship and integration documentation the project has produced to date, and the cadence is the one to preserve.
- **Documentation-only scope (apart from one 5-line Ajv fix) kept the blast radius small.** Mixing doc consolidation with feature work would have made the 2,115-line diff unreadable. Isolating docs to its own release meant every commit in the range was classifiable at a glance as a documentation change, and any regression in the functional code base could not be attributed to this release.
- **Seven-release catch-up in one FEATURES.md commit is the right granularity.** 31 capability entries plus 7 version history blocks landed together (`5128e192b`) rather than as seven separate commits. This is honest — the work was one unit of catching up — and it preserves the record that FEATURES.md was back-filled rather than drifting forward release by release.
- **HOW-IT-WORKS two-part restructure matched how readers learn the system.** Part 1 (skill lifecycle) and Part 2 (execution engine) is the pedagogical split, not a cosmetic one. The restructure made room for 222 new lines of execution-engine material without displacing the original skill-lifecycle content.
- **Ajv fix closed a real build issue rather than being cosmetic.** `16ec8c176` resolved three lint failures left over from v1.49.19 (Ajv default-export import shape + two implicit-any types). Five lines, but the thing that took the v1.49.19 TypeScript build fully clean.

### What Could Be Better

- **Seven releases of documentation drift accumulated before the catch-up shipped.** v1.49.13 through v1.49.19 each added major architecture that should have updated the canonical docs inline. The four-month backlog is the negative space around v1.49.20 — catching up was the right move, but catching up is more expensive than keeping up, and this release is the bill for that choice.
- **No documentation-update acceptance criterion on feature releases yet.** There is no automated check that forces CORE-CONCEPTS or HOW-IT-WORKS to move when a new concept ships. A future release should add such a check (or a pre-release checklist item) so a v1.49.13–v1.49.19-sized backlog cannot form again.
- **Gastown guide is thorough but lacks worked examples.** The 10 documents describe the chipset's architecture, trust model, and communication channels authoritatively, but a reader who wants to run the chipset still needs to piece together the setup flow from setup.md, topology.md, and channels.md. A worked example (one mission, end to end) would make the guide usable for a first-time reader without cross-referencing.
- **FEATURES.md is now 213 entries long with no cross-index.** The surface-capability catalog has grown large enough that sorting by version is no longer sufficient — a concept-index or category-index would let a reader find "all telemetry-related capabilities" without scrolling through the timeline. v1.49.20 adds the entries but does not add the index.

## Lessons Learned

- **Keep up is cheaper than catch up.** Seven releases of documentation drift cost a full release to close. A 30-line doc update during each of v1.49.13 through v1.49.19 would have cost roughly the same lines but spread across seven smaller commits that stayed close to the code that motivated them. This is the general principle behind every pre-release-checklist item the project has ever adopted.
- **Ledger integrity goes first in a documentation-consolidation release.** Phase 2 filled phase and plan counts in `docs/RELEASE-HISTORY.md` before any other phase landed. Starting with ledger repair means every subsequent phase can reference accurate totals, and the release history itself is the audit trail the rest of the consolidation edits against.
- **Two-part narrative structure scales when a document covers two distinct audiences.** HOW-IT-WORKS has two audiences — skill authors who need the lifecycle and orchestration operators who need the engine. The Part 1 / Part 2 split serves both without forcing either to read material that does not apply. This pattern is reusable for any canonical document whose surface has grown beyond a single pedagogical thread.
- **Concept catalogs should cross-reference, not just enumerate.** The new CORE-CONCEPTS section ends with a cross-references block that links every new concept to related concepts. This is what turns a list into a graph, and the graph is what a reader navigates when they are trying to understand how pieces fit. Cross-references are the load-bearing part of the refresh.
- **Documentation-only releases warrant a separate release vector.** Mixing documentation consolidation with feature work destroys the readability of the diff. v1.49.20's deliberate documentation-only scope (plus one surgical Ajv fix) is the right shape for this class of release, and subsequent consolidations should adopt the same constraint.
- **Back-fill in one commit rather than back-dating edits.** Three release READMEs (v1.49.17, v1.49.18, v1.49.19) and thirty-one FEATURES entries landed as three single-purpose commits (`1e0ef5a70`, `714d2bd15`, `5128e192b`) rather than as edits to earlier releases' history. This is the honest record — the notes were authored after the fact, and the commit history preserves that.
- **Sub-project lock files belong in gitignore from day one.** The 4,094-line `the-space-between-engine/package-lock.json` had been committing noise into the main repo's diffs since v1.49.18. Ignoring sub-project lock files is the right default for any nested npm project, and `.gitignore` should pick them up before the first install runs.
- **Five-phase ordering is a reusable pattern for documentation consolidation.** Ledger → entry-point → engine → catalog → surface is an ordering that holds for any canonical-document refresh. Future documentation releases can adopt the same sequence and inherit the reviewable-diff shape.
- **Renaming work compounds with documentation work.** The `dynamic-skill-creator` → `gsd-skill-creator` rename (v1.49.17) left a stale GitHub URL in `docs/GETTING-STARTED.md` that was only caught during this release's README refresh. Identity changes generate downstream documentation edits that surface in later releases; a rename checklist should include a sweep of linked URLs.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.19](../v1.49.19/) | Predecessor — Gastown Chipset Integration; the chipset whose integration guide v1.49.20 ships |
| [v1.49.20.1](../v1.49.20.1/) | Successor — Documentation Reflections; retrospective pass on v1.49.20's output, adds chipset-boundary table and payload-agnostic execution pattern |
| [v1.49.18](../v1.49.18/) | Space Between Observatory — sub-project whose `package-lock.json` got gitignored in this release |
| [v1.49.17](../v1.49.17/) | The Space Between — release whose detailed notes were restored here (`1e0ef5a70`) and whose package rename generated the GETTING-STARTED URL fix |
| [v1.49.16](../v1.49.16/) | Muse Architecture — CORE-CONCEPTS now lists the 9 named agents and complex-plane positioning from this release |
| [v1.49.13](../v1.49.13/) | First of the seven feature releases whose capabilities were back-filled into FEATURES.md |
| [v1.49.8](../v1.49.8/) | College Structure — CORE-CONCEPTS now names the Rosetta Core and departments from this line |
| [v1.49.9](../v1.49.9/) | College Structure continuation — referenced in the new CORE-CONCEPTS entry for the calibration engine |
| [v1.49.10](../v1.49.10/) | College Structure completion — full educational substrate referenced in the concept refresh |
| [v1.49](../v1.49/) | DACP — three-part bundle and retrospective analyzer named in the new CORE-CONCEPTS entry |
| [v1.34](../v1.34/) | Documentation Ecosystem — the canonical-docs refresh v1.49.20 is the successor to |
| [v1.33](../v1.33/) | Runbooks/operations/sysadmin — v1.49.20.1's educational-context-header fix follows this release's pattern |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri + Workbench + CRT surface now named as a first-class concept in CORE-CONCEPTS |
| [v1.13](../v1.13/) | Amiga coprocessor model — the complementary chipset model named alongside Gastown in README and CORE-CONCEPTS |
| [v1.4](../v1.4/) | Agent Teams — APT lessons and sc-dev-team lineage named in the new CORE-CONCEPTS Teams entry |
| [v1.0](../v1.0/) | Foundation — the 6-step adaptive loop that every concept in the refreshed CORE-CONCEPTS extends |
| `docs/gastown-integration/README.md` | Index for the 10-document integration guide |
| `docs/CORE-CONCEPTS.md` | Concept catalog (+362 lines this release) |
| `docs/HOW-IT-WORKS.md` | Two-part narrative (+222 lines this release) |
| `docs/FEATURES.md` | Capability surface (+38 lines; entries 183–213) |
| `docs/RELEASE-HISTORY.md` | Ledger (phase/plan counts for v1.49.17–v1.49.19 filled) |

## Engine Position

v1.49.20 is the first major documentation-consolidation release since v1.34 (Documentation Ecosystem) and the canonical-docs catch-up for the v1.49.13 through v1.49.19 feature surge. It stands on v1.34's documentation-ecosystem substrate (the narrative spine, gateway documents, and extractable templates established there), on v1.49.19's chipset integration (whose 1,373-line integration guide this release ships), and on v1.49.17's package rename (whose downstream URL edits this release closes). Looking forward, the five-phase ordering (ledger → entry-point → engine → catalog → surface) becomes the reference pattern for future documentation-consolidation releases; v1.49.20.1 applies the pattern immediately to its retrospective pass. The canonical-documents-as-first-class-deliverable claim the release makes will be tested by whether v1.49.21 and beyond keep their documentation inline rather than deferring to a future consolidation. The release's 25 commits and 2,115-line diff are small compared to v1.49.19's chipset milestone, but they are the commits that made v1.49.13 through v1.49.19 legible to a new reader — without v1.49.20, the canonical documents would still describe the project as it was in February.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.19..v1.49.20) | 25 |
| Files changed | 21 |
| Lines inserted / deleted | 2,115 / 30 |
| Documentation phases | 5 (release-history, README, HOW-IT-WORKS, CORE-CONCEPTS, FEATURES) |
| New integration-guide files | 11 (`docs/gastown-integration/`) |
| CORE-CONCEPTS new concepts | 7 (Teams, Chipsets, DACP, College, Muses, Cartridges, Mission Packs) |
| HOW-IT-WORKS new sections | 8+ (wave execution, DACP flow, chipset validation, mission-pack lifecycle, agent team patterns, learning loop, context management, GSD phase lifecycle) |
| FEATURES entries added | 31 (#183–#213) |
| Version history blocks added | 7 (v1.49.13 through v1.49.19) |
| Release-history rows repaired | 3 (v1.49.17, v1.49.18, v1.49.19) |
| TypeScript lint fixes | 3 (Ajv import + 2 implicit-any types) |
| `.gitignore` additions | 1 (`the-space-between-engine/package-lock.json`) |
| Lock-file bytes removed | 4,094 lines |

## Files

- `README.md` (+38 / −5) — Gastown chipset subsection, Amiga↔Gastown framing, project stats (65 milestones, 541+ phases, 1,312+ plans, ~632K LOC, 24,500+ tests)
- `docs/CORE-CONCEPTS.md` (+362) — 7 new first-class concepts plus Wave Execution, GSD-OS Desktop, cross-references
- `docs/HOW-IT-WORKS.md` (+222 / −7) — two-part restructure, wave execution, DACP flow, chipset validation, agent team patterns, learning loop, context management
- `docs/FEATURES.md` (+38) — 31 capability entries (#183–#213) + 7 version history blocks (v1.49.13–v1.49.19)
- `docs/RELEASE-HISTORY.md` (+4 / −4) — phase/plan counts for v1.49.17–v1.49.19; summary totals updated to 541+ / 1,312+
- `docs/GETTING-STARTED.md` (+1 / −1) — GitHub URL fix post-rename
- `docs/gastown-integration/` — 11 files, 1,373 lines (architecture, concept mapping, trust boundary, setup, topology, channels, dispatch, upstream intelligence, multi-instance, GSD milestone workflow, index README)
- `docs/release-notes/v1.49.17/README.md` (+21 / −13) — restored detailed notes with retrospective (`1e0ef5a70`)
- `docs/release-notes/v1.49.18/README.md` (+53) — full notes with retrospective landed (`714d2bd15`)
- `docs/release-notes/v1.49.19/README.md` (+28) — Gastown chipset release notes landed alongside integration guide (`419012ac9`)
- `src/chipset/gastown/validate-chipset.ts` (+3 / −2) — Ajv import + implicit-any fixes (`16ec8c176`)
- `.gitignore` (+1) + `the-space-between-engine/package-lock.json` (−4,094) — sub-project lock file removed and gitignored (`0b98d49ff`)

Aggregate: 21 files changed, 2,115 insertions, 30 deletions, 25 commits spanning v1.49.19..v1.49.20.
