# v1.49.105 — "Storage Is Cheap; Understanding Is Not"

**Released:** 2026-03-28
**Scope:** Single-project research release — SCR (Source Code Review), an 8-module deep read of the gsd-skill-creator codebase that binds every subsystem to its design lineage, safety policy, and cross-reference neighbors
**Branch:** dev
**Tag:** v1.49.105 (2026-03-28T02:24:20-07:00)
**Commits:** `9c79fbdd5` (1 commit)
**Files changed:** 16 · **Lines:** +2,916 / -0
**Classification:** research release — self-audit of the codebase whose documentation web had fallen 25+ milestones behind the running implementation
**Code:** SCR — Source Code Review
**Series:** PNW Research Series (#105 of 167)
**Dedication:** The contributors, AI agents, and future maintainers who inherit a codebase and spend their first week learning what neighborhood they are in. The street signs should have been there all along.
**Engine Position:** 93rd research release of the v1.49 publication arc, the 5th release of the v1.49.101-131 post-drain self-audit batch, the first release in the batch to turn the audit lens inward on the skill-creator codebase itself rather than on an adjacent architectural or pedagogical subject

> "The Amiga did not win by having more. It won by knowing exactly what each part was for, and by making every bus between them a first-class design decision. The source code already knows what it is for. This mission makes that knowledge legible to everyone who enters it. Storage is cheap. Understanding is not."

## Summary

**The documentation delta had grown into an architectural hazard.** By late March 2026 the public docs for gsd-skill-creator were frozen at v1.33 while the codebase was running v1.49.21 — a 25+ milestone gap wide enough that any new contributor, external auditor, or fresh-context AI agent entering the repository could live inside it for weeks without ever understanding which neighborhood they were actually in. SCR is the release that closed the first slice of that gap, not by writing a monolithic reference manual, but by shipping eight research modules that each take one subsystem, name its files, defend its design decisions, and cross-link it to its neighbors. The approach treats the documentation web as a graph problem: nodes are files, edges are cross-references, and legibility emerges from edge density, not from node volume.

**The eight modules are a map of the whole engine, not a sampling.** Module 1 walks the Core Observer-Detective Loop — TranscriptParser, SessionObserver, PatternSummarizer, PromotionEvaluator, DriftMonitor, LineageTracker — and names the six-step lifecycle (Observe, Detect, Suggest, Manage, Auto-Load, Learn/Compose) that is the heartbeat of the skill-creator. Module 2 formalizes DACP (Deterministic Agent Communication Protocol) with its FidelityLevel 0-4 ladder, nine bus opcodes, three-part bundles (intent + data + code), FilesystemBus routing, and bundle-size limits. Module 3 takes the Chipset Architecture seriously as a first-class pattern — Copper list DMA scheduler, Blitter bulk operations, Gastown multi-agent orchestration, AMIGA 5-team governance (CE-1, GL-1, MC-1, ME-1, ICD), Northbridge coordination. Module 4 is the Application Pipeline & Complex Plane: skill scoring on the unit circle `z = r·e^(i·θ)`, tangent activation engine, token budgets, geometric scoring, chord detection. Module 5 is the College of Knowledge — 42 academic departments, RosettaConcept cross-reference files, priority tiers, progressive disclosure, calibration models, department-to-code module mapping. Module 6 is Holomorphic Mathematics — DMD variants, Koopman operators, Julia set computation, Mandelbrot iteration, skill dynamics modeled as complex dynamical systems, math-coprocessor GPU integration. Module 7 is Safety & Cultural Sovereignty — Heritage Skills warden, OCAP/CARE/UNDRIP four-level classification, physical safety domains, 18 red-team scenarios, the ABSOLUTE/GATE/ANNOTATE/BLOCK system. Module 8 is CLI & Infrastructure — command structure, GitHub Actions CI/CD, documentation web layer, www/tibsfox research-site architecture, deployment patterns. No subsystem of the production codebase is left outside the map.

**Safety and cultural sovereignty are named as first-class research subjects, not buried as policy attachments.** The SCR research project elevates Heritage Skills governance to Module 7, alongside the observer loop and the chipset architecture, which is the correct relative weight for a self-modifying agent system under the standing Fox Companies IP rule and the OCAP/CARE/UNDRIP framework. The module names the four-level classification (ABSOLUTE boundaries, GATE requirements, ANNOTATE obligations, BLOCK conditions) and walks the 18 red-team scenarios the skill-author-discipline layer defends against. Treating safety as research rather than as a compliance appendix ensures that OCAP/CARE/UNDRIP boundaries are visible to every contributor, AI agent, or future maintainer from the first day — not buried in a policy document that nobody reads until they trip over it.

**The mission pack is a 1,260-line LaTeX artifact, not a decorative afterthought.** SCR's `mission-pack/mission.tex` runs 1,260 lines and compiles to a 220 KB PDF; it is the largest mission-pack in the v1.49.101+ self-audit arc to date and sits 29% above the SST (States, Symbols, and Tape) mission-pack's 977-line baseline. The pack is designed as a teaching artifact for the College of Knowledge — a single document a new contributor can read front-to-back and come out with a grounded mental model of the observer loop, the DACP protocol, the chipset pattern, the unit-circle scoring model, the 42-department College structure, the holomorphic engine, the safety framework, and the CLI surface. The HTML viewer stack (`index.html`, `page.html`, `mission.html`, `mission-pack/index.html`) renders the same content as a browsable per-module reader with a sticky table of contents for long-form study.

**The through-line is graph density, not node count.** The SCR project's own characterization of its work — "meaning lives in the connections between nodes, not the nodes themselves" — is the load-bearing editorial claim of the release. Every module's final section is a cross-reference block that names the neighboring modules and the adjacent research projects (SST, MDS, GSD2, MPC, DAA) that ground or extend its claims. The Rosetta Stone layer of the College of Knowledge is the infrastructure that will eventually host those cross-references as first-class files; SCR is the release where the cross-references become dense enough inside one subject to prove the approach works at subsystem scale. The next step — which SCR flags explicitly — is installing the code-level cross-reference files at file level so `@module`, `@see`, `@milestone`, and `@safety` tags on TypeScript functions resolve to College department pages without a manual hop through the series index.

The release ships in a single clean commit, `9c79fbdd5`, with 16 files and 2,916 insertions distributed across the `www/tibsfox/com/Research/SCR/` project directory plus a one-line registration entry in `www/tibsfox/com/Research/series.js`. No source-tree changes outside the research directory. No configuration changes. No dependency updates. The release is pure documentation-web growth, which is what the mission called for and what the release delivered.

## Key Features

**Location:** `www/tibsfox/com/Research/SCR/` · **Files:** 16 · **Lines:** +2,916 / -0
**Rosetta Stone cluster touched:** Architecture / Self-Audit (continues the v1.49.101-131 self-audit batch that SST inaugurated)
**Publication pipeline:** research-mission-generator → tex-to-project → HTML viewer + compiled PDF

| Code | Module / Artifact | Lines | Track | Key Topics |
|------|-------------------|-------|-------|------------|
| SCR | Source Code Review (umbrella) | ~2,916 | Self-Audit | 8-module deep read of the gsd-skill-creator codebase, documentation-web first pass |
| SCR.M1 | Core Observer-Detective Loop | 99 | Track A · Lifecycle | Six-step lifecycle Observe/Detect/Suggest/Manage/Auto-Load/Learn-Compose, TranscriptParser streaming JSONL, SessionObserver, PatternSummarizer, PromotionEvaluator, DriftMonitor, LineageTracker (16 key source files) |
| SCR.M2 | DACP Protocol | 99 | Track A · Communication | Deterministic Agent Communication Protocol, FidelityLevel 0-4, 9 bus opcodes, three-part bundles (intent + data + code), FilesystemBus routing, bundle size limits |
| SCR.M3 | Chipset Architecture | 99 | Track B · Northbridge | Copper list DMA scheduler, Blitter bulk ops, Gastown multi-agent orchestration, AMIGA 5-team governance (CE-1/GL-1/MC-1/ME-1/ICD), Northbridge coordination pattern |
| SCR.M4 | Application Pipeline & Complex Plane | 99 | Track B · Math | Skill scoring on unit circle `z = r·e^(i·θ)`, tangent activation engine, token budgets, geometric scoring, chord detection, application pipeline stages |
| SCR.M5 | College of Knowledge | 99 | Track C · Pedagogy | 42 academic departments, RosettaConcept cross-reference files, priority tiers, progressive disclosure, calibration models, department-to-code module mapping |
| SCR.M6 | Holomorphic Mathematics | 99 | Track C · Engine | DMD variants, Koopman operators, Julia set, Mandelbrot iteration, skill dynamics as complex dynamical systems, math-coprocessor GPU integration |
| SCR.M7 | Safety & Cultural Sovereignty | 99 | Track C · Policy | Heritage Skills warden, OCAP/CARE/UNDRIP four-level classification, physical safety domains, 18 red-team scenarios, ABSOLUTE/GATE/ANNOTATE/BLOCK system |
| SCR.M8 | CLI & Infrastructure | 99 | Track A · Surface | CLI command structure, GitHub Actions CI/CD, documentation web layer, www/tibsfox research-site architecture, deployment patterns |
| MP | Mission-Pack LaTeX Source | 1,260 | Publication | `mission.tex` full citation chain, compiled to a 220 KB PDF, index.html wrapper for the PDF viewer |
| Site | HTML Viewer Stack | 371 | UX | `index.html` (109), `page.html` with sticky TOC (215), `mission.html` (47) — browsable per-module reader |
| Theme | Palette + Stylesheet | 85 | Branding | Code teal + doc amber + architecture charcoal — signals Architecture/Self-Audit cluster on the index |
| Registry | series.js Entry | 1 | Site | +1 entry in the canonical series registry, mapped to the SCR directory with cross-refs to SST, MDS, GSD2, MPC, DAA |

## Retrospective

### What Worked

- **The 8-module structure maps cleanly to the actual code organization.** Module 1 → `src/observation/`, Module 2 → `src/dacp/`, Module 3 → `src/chipset/`, Module 4 → `src/plane/`, Module 5 → `.college/`, Module 6 → `src/holomorphic/`, Module 7 → safety policy tree, Module 8 → `src/cli/` and `.github/workflows/`. The mapping is one-to-one, which is the right shape for a documentation web: every research page has exactly one canonical subject, every code subsystem has exactly one canonical research page, and the bijection makes the cross-reference graph tractable.
- **Treating the documentation web as a graph problem produced a navigable structure that works from any entry point.** Nodes are files; edges are cross-references. A reader dropping into any one of the eight modules can follow the cross-reference block at the end to its neighbors and reach any other module in two hops. That is the key property of a navigable web — you do not have to start at the root — and it is exactly what the documentation delta between v1.33 and v1.49 was missing.
- **Safety and cultural sovereignty got first-class module status, not footnote status.** Elevating Heritage Skills governance to Module 7 alongside the observer loop and the chipset architecture is the correct relative weight for a self-modifying agent system. OCAP/CARE/UNDRIP boundaries are now visible to every reader from the index page, not buried in a policy document.
- **The mission-pack LaTeX ran to 1,260 lines — the deepest mission-pack of the self-audit arc to date.** SST's mission.tex was 977 lines; SCR's is 29% larger. The extra depth reflects the breadth of the underlying subject — eight subsystems vs. five conceptual modules — and proves the mission-pack format scales with the complexity of the subject rather than imposing a uniform length cap.
- **One-commit-per-project continues to hold even when the project ships 2,916 lines across 16 files.** The release is a single `feat(www)` commit (`9c79fbdd5`). The commit is bisect-clean, reviewable as one unit, and revertable as one unit. The convention that held at 49-project breadth (v1.49.89) and at 1-project depth (v1.49.101) holds at 8-module width with no modification.

### What Could Be Better

- **The documentation delta is 25+ milestones wide and one research project cannot close it.** Public docs frozen at v1.33; codebase at v1.49.21. SCR closes the first slice by covering the 8 major subsystems, but the delta at file granularity — individual function signatures, inline type contracts, edge cases — is still wide open. Closing that gap requires sustained effort across several more research releases, plus the code-level `@module`/`@see`/`@milestone`/`@safety` tag installation pass that Module 1's Section 6 flags as the natural follow-up work.
- **The College of Knowledge's 42 departments are architecturally present but the code-level cross-reference links are not yet installed at file level.** Module 5 names the 42 departments and describes the RosettaConcept layer, but the TypeScript source tree does not yet carry the `@see College/<dept>` tags that would let a reader jump from a function to its pedagogical home. SCR documents the target state; a follow-up release has to install the tags.
- **Each research module is 99 lines — deliberately uniform, potentially undersized.** The uniform 99-line body was a scaffolding choice that kept the eight modules comparable and the release shippable in one session, but several modules (notably M3 Chipset Architecture and M4 Complex Plane) have more material in the actual codebase than 99 lines of prose can absorb. A second-pass expansion to 200-400 lines per module would not inflate the release past the series norm and would bring the prose density closer to SST's module average.
- **The cross-reference block (SST, MDS, GSD2, MPC, DAA) is inbound-declared but not outbound-verified.** SCR names its neighbors, but there is no symmetry checker confirming that those neighbors name SCR back in their own `series.js` entries. The v1.49.101 retrospective flagged the same gap; v1.49.105 inherits it. A symmetry-audit tool remains on the follow-up list.

## Lessons Learned

- **A codebase without documentation trails is like a city with no street signs.** You can live there for years and still not know what neighborhood you are actually in. The cost of building trails is small and front-loaded; the cost of not building them compounds every time a new contributor, AI agent, or auditor enters the repo and has to rediscover the map from scratch.
- **The documentation web is a graph problem, not a tree problem.** Hierarchical docs fail because readers enter at arbitrary files, not at the root. A graph with high edge density lets any entry point become a starting point. The SCR cross-reference blocks are the edges; the 8 modules are the nodes; the legibility of the whole comes from density of the edges, not depth of the nodes.
- **Meaning lives in connections, not in nodes.** The individual nodes of the gsd-skill-creator codebase already exist and are already correct. What was missing was the cross-link fabric between them. This is the through-line of the SCR project and the reason the release matters: the nodes shipped months ago; the connections shipped today.
- **Safety belongs at module granularity, not at appendix granularity.** Heritage Skills, OCAP/CARE/UNDRIP, ABSOLUTE/GATE/ANNOTATE/BLOCK, and the 18 red-team scenarios are not compliance overhead — they are architectural constraints with the same status as the observer loop or the DACP protocol. Making that explicit at Module 7 is the correct editorial decision for a self-modifying agent system that the Fox Companies IP rule depends on.
- **The DACP fidelity model is the central architectural thesis of v1.49+.** The ladder from non-deterministic markdown narration (FidelityLevel 0) to deterministic three-part bundles (FidelityLevel 4) is not a refinement of a prior protocol; it is the protocol. Understanding why FidelityLevel 0-4 exists requires reading Module 2, because before Module 2 the rationale lived only in conversation context. Making that legible is the highest-leverage documentation work in the whole self-audit arc.
- **The Amiga Principle lives in the code, not just in the slogans.** The system does not win by having more. It wins by knowing exactly what each part is for and by making every bus between them — observer-to-detector, detector-to-suggester, suggester-to-manager, manager-to-loader, loader-to-learner — a first-class design decision. Module 3 (Chipset Architecture) is where the Amiga lineage becomes most explicit, but the principle is present in every subsystem.
- **Graph density beats node volume for navigability.** Eight modules with rich cross-references outperform eighty modules with sparse cross-references for reader orientation. The SCR release bets on density; the empirical test is whether a reader who enters at Module 7 (Safety) can reach Module 2 (DACP) via the in-module cross-reference blocks without returning to the index. The SCR release is structured so that test passes.
- **Post-drain releases reveal the project's real priorities.** With an empty intake queue and full agency, the v1.49.101-131 batch chose self-audit over surface expansion. SCR is the batch's first release to turn the audit lens on the gsd-skill-creator codebase itself. When a system with full agency elects to audit its own claims rather than extend its surface area, the resulting work tends to be more durable than reactive production — and the SCR release is an instance of that rule in action.
- **Uniform module length is a scaffolding choice, not an editorial norm.** The 99-line body on every SCR module made the release shippable in one session and kept the eight modules comparable, but it is explicitly a first-pass scaffold, not a permanent ceiling. Future expansion passes should add depth where the subject demands it — Chipset Architecture and Complex Plane are the two clearest candidates — without treating 99 lines as a budget.

## Cross-References

| Related | Why |
|---------|-----|
| `www/tibsfox/com/Research/SCR/` | Source Code Review — the release artifact itself, 8 modules + mission-pack + HTML viewer, ~2,916 lines |
| `www/tibsfox/com/Research/SCR/research/01-observer-loop.md` | Core Observer-Detective Loop, six-step lifecycle, TranscriptParser streaming JSONL (99 lines) |
| `www/tibsfox/com/Research/SCR/research/02-dacp-protocol.md` | DACP protocol, FidelityLevel 0-4, 9 bus opcodes, three-part bundles (99 lines) |
| `www/tibsfox/com/Research/SCR/research/03-chipset-arch.md` | Chipset architecture, Copper/Blitter/Gastown, AMIGA 5-team governance, Northbridge (99 lines) |
| `www/tibsfox/com/Research/SCR/research/04-complex-plane.md` | Application pipeline and complex plane, `z = r·e^(i·θ)` scoring, tangent activation (99 lines) |
| `www/tibsfox/com/Research/SCR/research/05-college.md` | College of Knowledge, 42 departments, RosettaConcept layer, priority tiers (99 lines) |
| `www/tibsfox/com/Research/SCR/research/06-holomorphic.md` | Holomorphic mathematics, DMD, Koopman, Julia, Mandelbrot, math-coprocessor GPU (99 lines) |
| `www/tibsfox/com/Research/SCR/research/07-safety.md` | Safety and cultural sovereignty, OCAP/CARE/UNDRIP, 18 red-team scenarios (99 lines) |
| `www/tibsfox/com/Research/SCR/research/08-cli-infra.md` | CLI and infrastructure, commands, CI/CD, documentation web layer (99 lines) |
| `www/tibsfox/com/Research/SCR/mission-pack/mission.tex` | 1,260-line LaTeX mission-pack with full citation chain |
| `www/tibsfox/com/Research/SCR/mission-pack/mission.pdf` | Compiled 220 KB PDF, teaching artifact for the College of Knowledge |
| `www/tibsfox/com/Research/series.js` | Canonical series registry — SCR added as the 148+nth entry |
| [v1.49.101](../v1.49.101/) | SST (States, Symbols, and Tape) — the self-audit batch's inaugural release, formal grounding for GSD context management that SCR's Module 2 cites |
| [v1.49.102](../v1.49.102/) | Immediate predecessor in the self-audit arc |
| [v1.49.103](../v1.49.103/) | Immediate predecessor — research batch continues |
| [v1.49.104](../v1.49.104/) | Immediate predecessor — last release before SCR |
| [v1.49.106](../v1.49.106/) | Immediate successor — continues the post-drain self-audit batch |
| [v1.49.90](../v1.49.90/) | Drain-to-zero release — the 10-project batch that emptied the intake queue and set up the self-audit arc SCR participates in |
| [v1.49.89](../v1.49.89/) | 49-project mega-batch — established the research-mission pipeline that SCR uses |
| [v1.33](../v1.33/) | The public-docs freeze point — the 25+ milestone delta SCR begins to close |

**Neighbor research projects (cross-ref targets from SCR's series.js entry):**

- **SST** (v1.49.101) — Computability theory foundations, GSD context window as bounded tape. SCR's Module 2 (DACP) cites SST's Module 05 tape-reset framing.
- **MDS** — Markup and data systems, documentation web rendering layer. SCR's HTML viewer stack shares the `page.html` sticky-TOC pattern MDS formalizes.
- **GSD2** — GSD workflow architecture, the system this code implements. SCR's Module 8 (CLI & Infrastructure) documents the interface GSD2 drives.
- **MPC** — Math coprocessor, GPU integration for the holomorphic engine. SCR's Module 6 describes the client side of the MPC contract.
- **DAA** — Deep audio analysis, holomorphic dynamics. SCR's Module 6 shares the DMD / Koopman mathematical framework with DAA's audio processing pipeline.

## Engine Position

v1.49.105 is the **93rd research release** of the v1.49 publication arc and the **fifth release of the v1.49.101-131 post-drain self-audit batch** inaugurated by v1.49.101 (SST). Series state at tag: **~148-152 `series.js` entries** (exact count depends on intervening v1.49.102/103/104 additions), multiple Rosetta Stone clusters active including the Foundations/Theory cluster SST opened and the Architecture/Self-Audit cluster SCR continues, approximately **260,000+ cumulative lines shipped** across the v1.49 arc. SCR is the first release in the v1.49.101-131 batch to turn the audit lens inward on the gsd-skill-creator codebase itself rather than on an adjacent architectural or pedagogical subject; its eight modules become load-bearing cross-reference targets for every subsequent release that touches observer-loop lifecycle, DACP fidelity, chipset coordination, complex-plane scoring, College pedagogy, holomorphic math, safety governance, or CLI surface. The v1.49.105 release is the moment the documentation web started catching up to the codebase at subsystem granularity; the follow-up pass at file granularity (installing `@module`, `@see`, `@milestone`, `@safety` tags on the TypeScript tree) is the next natural slice of the delta.

## Files

**16 files changed across one project directory plus shared registry. +2,916 insertions, -0 deletions across 1 commit (`9c79fbdd5`).**

- `www/tibsfox/com/Research/SCR/index.html` — project landing page, Architecture/Self-Audit palette, card-grid navigation to all eight modules, 109 lines
- `www/tibsfox/com/Research/SCR/page.html` — sticky-TOC Markdown viewer for the research modules, 215 lines
- `www/tibsfox/com/Research/SCR/mission.html` — mission-pack wrapper with PDF embed and LaTeX source link, 47 lines
- `www/tibsfox/com/Research/SCR/style.css` — code-teal + doc-amber + architecture-charcoal palette for the Architecture/Self-Audit cluster, 85 lines
- `www/tibsfox/com/Research/SCR/research/01-observer-loop.md` — Core Observer-Detective Loop, 99 lines
- `www/tibsfox/com/Research/SCR/research/02-dacp-protocol.md` — DACP Protocol, 99 lines
- `www/tibsfox/com/Research/SCR/research/03-chipset-arch.md` — Chipset Architecture, 99 lines
- `www/tibsfox/com/Research/SCR/research/04-complex-plane.md` — Application Pipeline & Complex Plane, 99 lines
- `www/tibsfox/com/Research/SCR/research/05-college.md` — College of Knowledge, 99 lines
- `www/tibsfox/com/Research/SCR/research/06-holomorphic.md` — Holomorphic Mathematics, 99 lines
- `www/tibsfox/com/Research/SCR/research/07-safety.md` — Safety & Cultural Sovereignty, 99 lines
- `www/tibsfox/com/Research/SCR/research/08-cli-infra.md` — CLI & Infrastructure, 99 lines
- `www/tibsfox/com/Research/SCR/mission-pack/index.html` — mission-pack HTML wrapper with navigation, 407 lines
- `www/tibsfox/com/Research/SCR/mission-pack/mission.tex` — full LaTeX source with citation chain, 1,260 lines
- `www/tibsfox/com/Research/SCR/mission-pack/mission.pdf` — compiled 220 KB PDF, teaching artifact
- `www/tibsfox/com/Research/series.js` — canonical series registry, +1 line (SCR entry added with cross-refs to SST, MDS, GSD2, MPC, DAA)

Cumulative series state at tag: research-publication pipeline continuing at steady one-commit-per-project cadence, self-audit batch (v1.49.101-131) in its first third, documentation-web delta beginning to close at subsystem granularity with file-level cross-reference installation flagged as the next natural follow-up.

---

*Part of the v1.49.101-131 self-audit research batch. One commit. Sixteen files. Eight subsystems made legible. The nodes already existed; this release added the edges.*
