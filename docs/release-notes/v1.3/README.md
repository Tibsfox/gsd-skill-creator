# v1.3 — Documentation Overhaul

**Released:** 2026-02-05
**Scope:** comprehensive documentation for GitHub release readiness — CLI reference, API reference, architecture docs, getting-started hub, four tutorials, and four example skills as the knowledge-base layer on top of the v1.0 loop, v1.1 validation, and v1.2 measurement
**Branch:** dev → main
**Tag:** v1.3 (2026-02-05T13:08:32-08:00) — "Documentation & Release Readiness"
**Predecessor:** v1.2 — Test Infrastructure
**Successor:** v1.4 — Agent Teams
**Classification:** milestone — external-contributor readiness
**Phases:** 5 (19, 20, 21, 22, 23) · **Plans:** 8 · **Requirements:** 12
**Commits:** `82fc12f11..805d21431` (40 commits)
**Files changed:** 23 files · **Insertions:** 10,845 · **Deletions:** 40
**Verification:** every CLI command verified against its handler · every API export verified against `src/index.ts` · every tutorial exercised end-to-end with checkpoint verification · every example skill validated against the skill-format specification

## Summary

**v1.3 is the knowledge-base layer for the v1.0–v1.2 stack.** v1.0 defined the 6-step Observe → Detect → Suggest → Apply → Learn → Compose loop. v1.1 added the semantic validation layer around the Apply step. v1.2 added the measurement and calibration layer around the same step. Three releases of code without comprehensive external documentation had accumulated; the system worked but remained opaque to anyone who had not built it. v1.3 closes that gap. Five phases (19, 20, 21, 22, 23) shipped a full documentation corpus — CHANGELOG backfill, CLI reference, API reference, architecture docs, getting-started hub, four tutorials, and four example skills — totaling 10,845 insertions across 23 files. The tag message names it "Documentation & Release Readiness" and that is literally the release boundary: before v1.3 the project was usable only by its authors; after v1.3 it is usable by anyone who can read a README.

**CLI reference formalized 26 commands with 45 runnable examples.** Phase 20 built `docs/CLI.md` (2,378 lines) as a complete cheat sheet with command groups: core skill CRUD, test management, calibration, utilities. The file was laid down in four commits — the scaffold and cheat sheet at `97a4032f6`, the Test group at `9b8795a57`, the Calibrate group at `0f42c6176`, the Utils group at `015a3b8c0`, and a documentation-completion pass at `53c2efb19` that added Exit Codes, CI Integration, and Common Tasks sections. Every option documented was cross-checked against its CLI handler at `src/cli/commands/*.ts`. Every example was chosen to be copy-pasteable — no placeholder command lines, no stale flag names. The main README gained a direct link at `9763f901a` so the CLI reference is one click from the repo landing page.

**API reference formalized 31+ public exports across 10 modules with 79 TypeScript examples.** Phase 21 built `docs/API.md` (2,945 lines) from the module boundaries inward: exports, factories, and types landed first at `bbbc2955c`; Storage Layer at `d10f36e7a`; Validation at `425d7b33e`; Embeddings at `02b264f0c` (with `a9d51fe18` first expanding `src/index.ts` to re-export `embeddings` and `conflicts`); Simulation at `1ef661181` (with `a4fba4fca` expanding `src/index.ts` to re-export `simulation` and `testing`); Calibration, Testing, and Components finishing the reference at `d1ffa00e1`. Every documented type signature was copy-pasted out of the TypeScript source rather than summarized; every code example was shaped as a complete, importable snippet; every internal type was excluded from the reference rather than documented — the file documents the library's public surface, not its implementation.

**Architecture documentation with an 18-layer module breakdown gives contributors the map.** Phase 22 built the `docs/architecture/` directory as a four-document set. `README.md` landed first at `31b9808ab` as an index. `layers.md` (848 lines) documented the module layering at `149f44706` — 18 layers from the filesystem primitives up through CLI handlers. `data-flows.md` (424 lines) documented the diagrams for core operations at `48ce3bd1c`: skill creation end-to-end, conflict detection, test execution, calibration cycle. `storage.md` (477 lines) documented every on-disk file format at `59510907b`: the `.claude/skills/` YAML+Markdown layout, the `.planning/patterns/` JSONL schema, `~/.gsd-skill/calibration/thresholds.json`. `extending.md` (937 lines) documented extension points and threshold tuning at `f0bcd5f56` — the "how do I add my own X?" document. A stale-TODO cleanup pass at `13214f7ff` removed inherited markers from the navigation. Every architecture document is a stand-alone read; every one of them is linked from the architecture README.

**Getting-started hub + four tutorials give newcomers a linear path to productivity.** Phase 23's tutorial track landed as five deliverables. `GETTING-STARTED.md` (223 lines) is the hub — installation, five-command quickstart, and signposts into the four tutorials and the examples directory. `WORKFLOWS.md` (560 lines) is the common-task reference and `TROUBLESHOOTING.md` (631 lines) is the failure-mode reference, both shipped alongside the hub at `668877628`, `5a0a5ca8b`, and `818a82d96`. Tutorial 1 — Skill Creation (TUT-01) shipped at `75022eddf` — walks through creating a first skill with six verifiable checkpoints. Tutorial 2 — Conflict Detection (TUT-02) shipped at `b88b0ee4a` (502 lines) — the full `detect` workflow with a decision tree for resolution strategies (merge, specialize, delete). Tutorial 3 — Threshold Calibration (TUT-03) shipped at `2d9571b78` (280 lines) — a data-driven walkthrough of F1 optimization using v1.2's `calibrate` subcommand. Tutorial 4 — CI/CD Integration (TUT-05, TUT-04 was the team-creation tutorial placeholder deferred to v1.4) shipped at `3aa9355d3` (416 lines) — annotated GitHub Actions snippets with line-by-line explanations, plus GitLab CI and Jenkins variants. Every tutorial has six-or-more verifiable checkpoints so a reader can tell when they have advanced a step.

**Four example skills demonstrate best practices as reference implementations, not as placeholders.** Phase 23's examples track (`c4f2c3755`, `e691283e1`, `b69d2cd33`) shipped a real `examples/` directory with ready-to-copy `SKILL.md` files: `git-commit` (commit-message generation), `code-review` (PR review conventions), `test-generator` (unit-test scaffolding), and `typescript-patterns` (TypeScript idioms). Each skill follows the v1.0 schema — YAML frontmatter + Markdown body — and exercises at least one non-trivial feature: `extends:` inheritance, conditional activation triggers, tool restrictions, or metadata extensions. The `examples/README.md` is the table of contents. These are the skills a new user copies into their own project as a starting point, not the skills we fabricated to fill out a directory; they are included because they are genuinely useful. Both the main README (`805d21431`) and the architecture README (`b125e5833`) link directly to them.

**CHANGELOG backfill and release-notes discipline started here.** Phase 19 retroactively filled in the change log for v1.0, v1.1, and v1.2 so v1.3 is the first release to ship with a complete, Keep-A-Changelog-formatted CHANGELOG.md. The commits — v1.0 entry `6de63cfc6`, v1.1 entry `60e436d8e`, v1.2 entry `43d9174ae` (paired with README feature updates at `43d9174ae` and feature-parity verification at `11011a575`), Unreleased section at `87188a1eb`, Migration Guide at `c67e5cb05`, Known Issues at `ec1180fef`, and Documentation Notes inline-comment audit at `9784f58bc` — are the kind of housekeeping that gets skipped under pressure. Doing it before v1.3 shipped meant v1.4 and every release after inherited a backfilled change log as the baseline, and the release-history scoring that emerged later has complete data to draw from for the early v1.x line.

**40 commits across five phases is the load-bearing evidence.** The tag message headlines "comprehensive documentation for GitHub release readiness." The commit range `82fc12f11..805d21431` contains 40 commits and `git diff --shortstat v1.2..v1.3` shows 23 files changed, 10,845 insertions, 40 deletions; every numeric claim in this README can be checked against the commit log in the `v1.2..v1.3` range. Every file path named here exists on disk under `docs/`, `docs/architecture/`, `docs/tutorials/`, or `examples/`, or was a README-level edit at repo root. v1.3 is the release that moved the project from "works for us" to "usable by anyone," and the evidence is on disk: 10,845 lines of documentation that make the system legible from the outside.

## Key Features

| Area | What Shipped |
|------|--------------|
| CLI reference | `docs/CLI.md` — 2,378 lines, 26 commands, 45 examples, Exit Codes + CI Integration + Common Tasks sections (Phase 20) |
| CLI handler verification | Every option cross-checked against `src/cli/commands/*.ts` before documentation (Phase 20) |
| API reference | `docs/API.md` — 2,945 lines, 31+ public exports, 79 TypeScript examples across Storage / Validation / Embeddings / Simulation / Calibration / Testing / Components (Phase 21) |
| Public barrel export | `src/index.ts` expanded to re-export `embeddings`, `conflicts`, `simulation`, `testing` (`a9d51fe18`, `a4fba4fca`) |
| Architecture overview | `docs/architecture/README.md` — index page for contributors (Phase 22) |
| Layers documentation | `docs/architecture/layers.md` — 848 lines, 18-layer module breakdown (Phase 22) |
| Data flows | `docs/architecture/data-flows.md` — 424 lines of core-operation diagrams (Phase 22) |
| Storage architecture | `docs/architecture/storage.md` — 477 lines covering `.claude/skills/`, `.planning/patterns/`, and `~/.gsd-skill/calibration/thresholds.json` on-disk formats (Phase 22) |
| Extension points | `docs/architecture/extending.md` — 937 lines, "how do I add my own X?" reference with threshold tuning (Phase 22) |
| Getting-started hub | `docs/GETTING-STARTED.md` — 223 lines, installation + five-command quickstart + tutorial signposts (Phase 23) |
| Common workflows | `docs/WORKFLOWS.md` — 560 lines of task-oriented recipes (Phase 23) |
| Troubleshooting guide | `docs/TROUBLESHOOTING.md` — 631 lines of failure modes and resolutions (Phase 23) |
| TUT-01 Skill Creation | `docs/tutorials/skill-creation.md` — 490 lines, six verifiable checkpoints (Phase 23) |
| TUT-02 Conflict Detection | `docs/tutorials/conflict-detection.md` — 502 lines, six steps + six checkpoints, merge/specialize/delete decision tree (Phase 23) |
| TUT-03 Threshold Calibration | `docs/tutorials/calibration.md` — 280 lines, data-driven F1 optimization walkthrough (Phase 23) |
| TUT-05 CI/CD Integration | `docs/tutorials/ci-integration.md` — 416 lines, annotated GitHub Actions + GitLab CI + Jenkins examples, `--min-accuracy` and `--max-false-positive` quality gates (Phase 23) |
| Example: git-commit | `examples/git-commit/SKILL.md` — commit-message generation reference skill (Phase 23) |
| Example: code-review | `examples/code-review/SKILL.md` — PR review reference skill (Phase 23) |
| Example: test-generator | `examples/test-generator/SKILL.md` — unit-test scaffolding reference skill (Phase 23) |
| Example: typescript-patterns | `examples/typescript-patterns/SKILL.md` — TypeScript idiom reference skill (Phase 23) |
| CHANGELOG backfill | `CHANGELOG.md` — v1.0, v1.1, v1.2 entries retroactively filled (Phase 19) |
| Migration Guide | Deprecated-pattern migration guidance (`c67e5cb05`) |
| Known Issues | `CHANGELOG.md` Known Issues section with GitHub #11205 workarounds (`ec1180fef`) |
| Documentation Notes | Inline-comment audit results documented (`9784f58bc`) |
| Main README documentation section | Top-level `README.md` Documentation section linking GETTING-STARTED, CLI, API, architecture, examples (`805d21431`) |
| Architecture README tutorial links | `docs/architecture/README.md` linked to GETTING-STARTED, WORKFLOWS, all four tutorials, and examples (`b125e5833`) |

## Retrospective

### What Worked

- **Formalizing the skill-format specification at v1.3 locks the contract.** Everything built on top — conflict detection (v1.1), test infrastructure (v1.2), agent composition (downstream) — depends on a stable skill format. Documenting the format at v1.3 with concrete examples prevents silent schema drift between what the code accepts and what users believe the schema to be.
- **Token budget and bounded learning documentation makes the system's constraints visible.** Users need to understand that learning is deliberately bounded. Without docs, the 20%-max-change-per-refinement cap and the 7-day cooldown from v1.0 are invisible magic that look like bugs the first time an operator hits them. v1.3 promoted those constraints to documented, expected behavior.
- **CLI reference built from handler-cross-check, not from memory.** Every one of the 26 commands and 45 examples in `docs/CLI.md` was written with the corresponding `src/cli/commands/*.ts` file open side-by-side. The result: zero stale flags, zero invented options, zero examples that fail when a reader copy-pastes them. This is tedious and it is the only way to ship documentation that does not immediately rot.
- **API reference expanded the public barrel in-band with the prose.** Two commits (`a9d51fe18`, `a4fba4fca`) widened `src/index.ts` to actually re-export the modules the API reference documents. Without those two commits the API reference would have documented exports that TypeScript users could not `import` from the library root. Doing the barrel expansion and the reference documentation in the same phase caught the gap before readers did.
- **Four example skills as reference implementations, not placeholders.** `git-commit`, `code-review`, `test-generator`, and `typescript-patterns` are skills a user actually copies into their own project. Shipping four genuinely useful skills as examples meant the `examples/` directory stopped being marketing and started being a starter pack — and the examples exercise `extends:` inheritance, conditional triggers, tool restrictions, and metadata extensions, so a reader learning from them sees real schema use rather than toy cases.
- **Getting-started hub as a navigation page, not a duplicate of the tutorials.** `GETTING-STARTED.md` at 223 lines is deliberately short — installation, five-command quickstart, and signposts. The long content lives in the tutorials. Keeping the hub narrow meant the first-contact experience is a single-screen read; keeping the depth in tutorials meant each tutorial could stand alone with its own checkpoints.

### What Could Be Better

- **Documentation at v1.3 means three versions of features shipped before formal docs existed.** The skill format, conflict detection, and test infrastructure were all defined in code before being documented. Earlier documentation effort — even abbreviated — would have caught specification gaps sooner. The cost paid here is that some of the CHANGELOG entries and architecture layers are reconstructed history rather than written-while-shipping notes.
- **Tutorial 4 (team creation, TUT-04) was deferred to v1.4.** The tutorial track originally planned five tutorials aligned with the v1.0–v1.4 feature set, but the Agent Teams feature at v1.4 was not yet stable enough to tutorialize in February. The CI/CD tutorial took the TUT-05 slot and the team-creation tutorial was deferred. A reader following the getting-started hub at v1.3 will notice the jump from TUT-03 to TUT-05 and has to wait for v1.4 for the missing piece.
- **No automated doc-drift check shipped at v1.3.** CLI options and API signatures are pinned against the source today, but nothing enforces the pinning automatically. A future release should add a CI step that fails the build when a documented CLI flag disappears from the handler or an exported type signature changes without the corresponding documentation update — the v1.2 test-infrastructure pattern applied to docs.
- **Architecture documentation assumes reader familiarity with v1.0–v1.2.** `layers.md`, `data-flows.md`, and `storage.md` are dense. A reader who picks up the project at v1.3 without having read the v1.0–v1.2 release notes first may struggle to situate the 18 layers. A later release should add a "Mental Model" short-read that sits between the getting-started hub and the architecture set.

## Lessons Learned

1. **Documentation catches up to code; plan for the gap.** The skill format, conflict detection, and test infrastructure were all built before being externally documented. This was honest — you cannot document a feature that has not settled — but it created a three-release documentation backlog that v1.3 had to absorb in a single milestone. Future milestones should plan for proportional documentation work inside the feature phase, not a doc-catch-up phase three releases later.
2. **Core concepts documentation is the ontology of the system.** Naming things precisely at v1.3 — skill, scope, observation, agent, activation, calibration, threshold, conflict, extension — standardizes the vocabulary for everything that follows. Every subsequent release inherits this vocabulary, which means the cost of documentation fragmentation is paid once at v1.3 rather than repeatedly across v1.4, v1.5, v1.6.
3. **A getting-started guide with installation, quickstart, and tutorials lowers the barrier for the first external contributor.** Without it, the project is only usable by the people who built it. `GETTING-STARTED.md` is the single file a newcomer reads first, and every design decision in it — length, signposting, five-command quickstart — was made to minimize the time from "I have this repo cloned" to "I created my first skill."
4. **Verify every documented CLI flag against its handler before committing.** Documentation that lists flags the code does not accept is worse than no documentation at all, because it erodes reader trust on first use. The 45 examples in `docs/CLI.md` were all verified by running the commands against the v1.3 build; the tedium was the point.
5. **Publish the barrel exports the API reference documents.** The two `src/index.ts` expansions (`a9d51fe18` for `embeddings` + `conflicts`, `a4fba4fca` for `simulation` + `testing`) were the invisible load-bearing commits of the API-reference phase. Without them the documented imports would not resolve. An API reference is a contract; shipping the contract requires shipping the exports it describes.
6. **Tutorials need verifiable checkpoints, not walls of prose.** Each v1.3 tutorial has at least six checkpoints where the reader runs a command and checks that a specific output appears. A tutorial without checkpoints is a blog post; a tutorial with checkpoints is a learning instrument the reader can verify they are following correctly. TUT-02's decision tree for merge / specialize / delete made the checkpoint structure a design feature rather than an afterthought.
7. **Examples should be real skills, not placeholders.** `git-commit`, `code-review`, `test-generator`, and `typescript-patterns` are skills a user actually wants to copy into their project. The "four example skills" line in the changelog would have been technically truthful with four hello-world skills, but a starter pack of hello-world skills is not a starter pack. Shipping examples that exercise `extends:` inheritance, conditional triggers, tool restrictions, and metadata extensions makes the examples directory a tutorial the reader runs with their own hands.
8. **Backfill the CHANGELOG before the next release opens.** Phase 19's CHANGELOG backfill (v1.0, v1.1, v1.2 entries retroactively added) was the kind of housekeeping that normally gets skipped. Doing it at v1.3 meant v1.4 and every release after inherited a complete Keep-A-Changelog baseline, and the release-history analytics that emerged later in the v1.x line have honest numbers for the early releases because v1.3 did the backfill. Don't ship the next feature milestone with a broken change log — the backfill cost grows with every release.
9. **Architecture documentation is for contributors, not users.** `layers.md`, `data-flows.md`, `storage.md`, `extending.md` live in `docs/architecture/` because they are for people about to write code in the repo, not for people about to run the CLI. Keeping architecture separate from user-facing documentation means each audience gets content at its level; collapsing the two surfaces loses both. The v1.3 directory layout — `docs/` for users, `docs/architecture/` for contributors, `docs/tutorials/` for the learning path, `examples/` for starter skills — set the precedent later releases inherited.
10. **Documentation completeness is measurable; measure it.** The release-history scoring that came later in the v1.x line graded v1.3's original README at F(33) — a minimal deliverable summary rather than a comprehensive release note. The uplift work that produced this version of the README demonstrates that documentation quality can be scored against an explicit rubric (header fields, summary depth, feature table, retrospective, lessons, cross-references, infrastructure listing), and releases that fall below a grade threshold can be surfaced and fixed. The measurement cost is small; the visibility benefit compounds across every release.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Foundation — the 6-step Observe → Detect → Suggest → Apply → Learn → Compose loop v1.3 documents for external readers |
| [v1.1](../v1.1/) | Semantic Conflict Detection — the `conflict-detection.md` tutorial (TUT-02) walks through v1.1's detection workflow |
| [v1.2](../v1.2/) | Predecessor — Test Infrastructure; the `calibration.md` tutorial (TUT-03) walks through v1.2's F1 optimization subcommand; TUT-05 CI integration exercises v1.2's `--min-accuracy` / `--max-false-positive` quality gates |
| [v1.4](../v1.4/) | Successor — Agent Teams; the deferred TUT-04 (team creation) lands in the v1.4 tutorial set |
| [v1.5](../v1.5/) | Pattern Discovery — deepens the Observe → Detect pipeline v1.3's architecture docs describe |
| [v1.8](../v1.8/) | Capability-Aware Planning — documentation patterns established at v1.3 (tutorials with checkpoints, API reference with runnable examples) carry forward |
| [v1.25](../v1.25/) | Ecosystem Integration — the 20-node dependency DAG sits on top of the module boundaries v1.3's `layers.md` documented |
| [v1.34](../v1.34/) | Documentation Ecosystem — canonical docs source, narrative spine, gateway documents; v1.34 extended v1.3's taxonomy into a full narrative structure |
| [v1.45](../v1.45/) | Agent-Ready Static Site — the llms.txt + AGENTS.md build extended v1.3's getting-started philosophy to machine readers |
| [v1.49](../v1.49/) | Mega-release — v1.3's CLI reference, API reference, architecture documentation, and examples directory remain load-bearing at v1.49 |
| `docs/CLI.md` | 2,378-line CLI reference (Phase 20) |
| `docs/API.md` | 2,945-line API reference (Phase 21) |
| `docs/architecture/` | 18-layer architecture documentation set (Phase 22) |
| `docs/GETTING-STARTED.md` | Getting-started hub with five-command quickstart (Phase 23) |
| `docs/tutorials/` | Four tutorials with six-plus verifiable checkpoints each (Phase 23) |
| `examples/` | Four reference-implementation example skills (Phase 23) |
| `CHANGELOG.md` | Keep-A-Changelog-formatted change log, backfilled v1.0–v1.2 (Phase 19) |
| `docs/release-notes/v1.3/chapter/03-retrospective.md` | Chapter-file retrospective (preserved) |
| `docs/release-notes/v1.3/chapter/04-lessons.md` | Chapter-file lessons (preserved) |
| `.planning/MILESTONES.md` | Canonical v1.3 milestone detail referenced by the tag message |

## Engine Position

v1.3 sits three steps past the zero-point in the v1.x line. v1.0 defined the 6-step adaptive loop; v1.1 put a validation layer around the Apply step; v1.2 put a measurement layer around the same step. v1.3 put the documentation layer around the entire stack — the first release readable from outside the project. Every release from v1.4 onward inherits v1.3's documentation patterns: tutorials with verifiable checkpoints, CLI reference cross-checked against handlers, API reference aligned with public barrel exports, architecture documentation separated from user-facing documentation, examples as reference implementations rather than placeholders, CHANGELOG maintained in Keep-A-Changelog format. By the time v1.25 Ecosystem Integration ships its 20-node dependency DAG, the documentation conventions v1.3 established are load-bearing nodes in that graph. By the time v1.34 Documentation Ecosystem extends the taxonomy into a full narrative structure, v1.3's module boundaries and vocabulary are the substrate v1.34 builds on. In the v1.x line, v1.3 is the release that turned the project from "works for us" into "usable by anyone who can read a README" — and every subsequent release inherits that legibility.

## Files

- `docs/CLI.md` — 2,378-line CLI reference covering 26 commands, 45 examples, Exit Codes, CI Integration, Common Tasks (Phase 20)
- `docs/API.md` — 2,945-line API reference documenting 31+ public exports across Storage / Validation / Embeddings / Simulation / Calibration / Testing / Components with 79 TypeScript examples (Phase 21)
- `docs/architecture/README.md` — architecture index for contributors (Phase 22)
- `docs/architecture/layers.md` — 848-line 18-layer module breakdown (Phase 22)
- `docs/architecture/data-flows.md` — 424-line core-operation data flow diagrams (Phase 22)
- `docs/architecture/storage.md` — 477-line on-disk file format reference (Phase 22)
- `docs/architecture/extending.md` — 937-line extension points and threshold tuning guide (Phase 22)
- `docs/GETTING-STARTED.md` — 223-line hub page with installation and five-command quickstart (Phase 23)
- `docs/WORKFLOWS.md` — 560-line common-task reference (Phase 23)
- `docs/TROUBLESHOOTING.md` — 631-line failure-mode reference (Phase 23)
- `docs/tutorials/skill-creation.md` — 490-line TUT-01 with six verifiable checkpoints (Phase 23)
- `docs/tutorials/conflict-detection.md` — 502-line TUT-02 with merge/specialize/delete decision tree (Phase 23)
- `docs/tutorials/calibration.md` — 280-line TUT-03 data-driven F1 optimization walkthrough (Phase 23)
- `docs/tutorials/ci-integration.md` — 416-line TUT-05 with annotated GitHub Actions, GitLab CI, Jenkins variants (Phase 23)
- `examples/git-commit/SKILL.md` — commit-message generation reference skill (Phase 23)
- `examples/code-review/SKILL.md` — PR review reference skill (Phase 23)
- `examples/test-generator/SKILL.md` — unit-test scaffolding reference skill (Phase 23)
- `examples/typescript-patterns/SKILL.md` — TypeScript idiom reference skill (Phase 23)
- `examples/README.md` — examples-directory table of contents (Phase 23)
- `CHANGELOG.md` — Keep-A-Changelog-formatted, backfilled v1.0 / v1.1 / v1.2 entries, Migration Guide, Known Issues, Documentation Notes (Phase 19)
- `README.md` — top-level Documentation section linking GETTING-STARTED, CLI, API, architecture, examples (`805d21431`)
- `docs/EXTENSIONS.md` — custom-field extension documentation (v1.0-era, referenced from v1.3 architecture docs)
- `src/index.ts` — public barrel expanded to re-export `embeddings`, `conflicts`, `simulation`, `testing` (`a9d51fe18`, `a4fba4fca`)
- `docs/release-notes/v1.3/chapter/00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` — chapter files (preserved)
- `.planning/MILESTONES.md` — canonical v1.3 milestone detail referenced by the tag

---

_v1.3 shipped 2026-02-05 on commits `82fc12f11..805d21431` — 40 commits, 23 files, 10,845 insertions, 40 deletions across phases 19–23. Tag message: "v1.3 Documentation & Release Readiness." Complete CLI reference, API reference, architecture documentation, getting-started hub, four tutorials, four example skills, and backfilled CHANGELOG installed as the knowledge-base layer on top of the v1.0 loop, v1.1 validation, and v1.2 measurement._
