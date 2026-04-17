# v1.35 — Mathematical Foundations Engine

**Released:** 2026-02-26
**Scope:** feature milestone — 451 typed mathematical primitives from The Space Between encoded as a navigable dependency DAG, paired with eight reasoning engines, transparent pipeline integration, and the generalized `sc:learn` / `sc:unlearn` knowledge ingestion and rollback commands
**Branch:** dev → main
**Tag:** v1.35 (2026-02-25T21:12:21-08:00) — "Mathematical Foundations Engine"
**Predecessor:** v1.34 — Documentation Ecosystem Refinement
**Successor:** v1.36 — Citation Management
**Classification:** feature — self-modifying knowledge subsystem with reversibility as a first-class operation
**Phases:** 335–350 (16 phases) · **Plans:** 50 · **Requirements:** 43 · **Tests:** 631
**Commits:** `b4c147921..51cfd9692` (79 commits) · **Files changed (tip window):** 7 · **LOC:** ~9.7K source + ~13.1K test + ~21.4K data + ~1.2K skills
**Verification:** 43/43 requirements landed · 631 tests across the 16-phase window · SAFE-04 through SAFE-08 safety suite passing · 31 security attack vectors blocked across 6 categories at the sanitization layer · 96.2% duplicate-detection rate against the Space Between self-synthesis corpus

## Summary

**Mathematical knowledge became a typed dependency graph.** Before this release, the "mathematical foundations" of skill-creator lived as a set of reference documents under `The Space Between` — thirty-three chapters of prose covering perception, waves, change, structure, reality, foundations, mapping, unification, emergence, and synthesis. Phases 335 through 350 translated that prose into 451 typed primitives, wired them together through 106 dependency edges, and built eight engines on top — a dependency graph, a path finder, a complex-plane classifier, a complex-plane navigator, a composition engine, a proof composer, a verification engine, and a property checker. Every primitive carries a typed domain, a plane position, a chapter reference, and a set of dependencies that the DAG builder resolves into a directed acyclic graph. Dijkstra's shortest-path algorithm over the dependency edges answers "what do I need to understand before I can understand this?" as a mechanical query rather than a prose essay. The release ships sixteen phases (335–350), fifty plans, seventy-nine commits, forty-three requirements, and six hundred thirty-one tests, and it lands the Mathematical Foundations Engine (MFE) as a skill type that activates transparently inside skill-creator's six-stage pipeline without breaking the 2–5% token budget that the pipeline reserves for meta-reasoning overhead.

**Tiered loading held the foundation inside a 5% budget.** The integration challenge for a 451-primitive registry inside a context window is straightforward in the abstract and brutal in practice: the full primitive payload plus dependency edges plus chapter references plus proof scaffolding runs well over a hundred thousand tokens, which is larger than the entire context window skill-creator needs for actual work. Phase 343's progressive disclosure system solved this with a three-tier load model — a 4K summary tier that is always resident, a 15K active tier that loads when MFE participates in a pipeline stage, and a 40K reference tier that loads only when a proof or verification call actually needs it. The domain skill files under the progressive disclosure set (ten domain skills, one per top-level MFE domain) each publish their own summary/active/reference triples, so a pipeline stage that only needs Waves does not pay for Foundations or Synthesis. The budget cap itself is mechanical: `SAFE-04` enforces a hard 5% ceiling on the MFE contribution to any pipeline stage, and the test suite fails the build if a single load configuration crosses it. The result is a mathematical foundation that is present enough to answer questions and absent enough to leave room for the rest of skill-creator to breathe.

**`sc:learn` shipped as the first self-modifying ingestion pipeline.** Phases 345 through 348 built a seven-stage ingestion pipeline — acquire, sanitize, HITL gate, analyze, extract + wire, deduplicate + merge, and generate + report — and exposed it behind a single CLI command at `src/commands/sc-learn.ts`. The acquire stage handles eight input formats: PDF, Markdown, docx, txt, epub, zip, tgz, and GitHub repositories. The sanitize stage runs STRANGER-tier security (named after the project's highest-tier untrusted-input classification) against six attack categories: prompt injection, hidden Unicode, path traversal, embedded code, binary content, and multi-vector combinations. The HITL gate — Human In The Loop — blocks progression on any content the sanitizer flags as suspect, so the pipeline cannot silently learn from a poisoned document. The analyze stage classifies content by structure, type, domain, and complex-plane position. The extract stage pulls primitives, wires their dependencies into the DAG, deduplicates against the existing registry with a 96.2%-accurate semantic comparator, and generates the downstream skills/agents/teams artifacts with full provenance attached. Every primitive that enters the system carries its source, its extraction timestamp, and its deduplication decision on record. Phase 349's `sc:learn` CLI wiring at `src/commands/sc-learn.ts` ties the seven stages together with a progress callback that fires at each stage and a dry-run flag that runs the full analysis but skips the changeset recording step — which is important because learning is now reversible.

**`sc:unlearn` turned ingestion into a two-way door.** Phase 349's `sc:unlearn` command at `src/commands/sc-unlearn.ts` closes the loop that makes `sc:learn` safe to use. Every ingestion run records a changeset — a typed list of operations covering primitive additions, dependency edge additions, and skill generations — keyed by a session identifier. `sc:unlearn <session-id>` loads the changeset, validates graph integrity before reverting (blocks the revert if a later operation depends on a primitive this session introduced, unless `--force` is passed with a logged warning), processes the five-stage revert flow (load → validate → extract ops → revert → regenerate), and regenerates any domain skills affected by the removal so the progressive disclosure set stays coherent. The one-way door that every self-modifying system eventually hits — the moment a bad ingestion poisons the knowledge base and there is no going back — is the door that v1.35 replaces with a reversible two-way door. The seventeen tests on the `sc:unlearn` command cover session lookup (not-found handling), the full revert flow, integrity checks (dangling-reference blocking), skill regeneration, and the `--force` bypass path.

**The SAFE-04 through SAFE-08 suite codified the risk surface.** Phase 350 landed five named safety tests, each targeting a specific failure mode of a system that modifies its own reasoning substrate. SAFE-04 caps MFE token consumption at 5% of any pipeline stage — the structural token budget that the whole tiered loading system exists to respect. SAFE-05 is the Magic Test: zero MFE-internal primitives, dependency-graph IDs, or plane coordinates may leak into user-facing output. Mathematical scaffolding stays inside the engine; the user sees answers, not machinery. SAFE-06 is Euclid's Test: a decompose-compose round trip on any primitive must return an equivalent primitive — if the composition engine cannot reconstruct what the decomposition produced, the engine is lying about its own algebra. SAFE-07 is self-validation: synthesize textbook markdown from the 451-primitive registry across all ten domains, run it back through the extraction pipeline, and measure how many of the regenerated primitives are correctly detected as duplicates of their originals. The 96.2% rate (454/472 candidates) is the honest floor, and the 3.8% gap is logged as known engineering debt rather than rounded to "high accuracy." SAFE-08 is the security stress test: 31 attack vectors across 9 test groups (prompt injection, hidden Unicode, path traversal, embedded code, binary content, multi-vector combined, HITL gate blocking, false-positive safety, pipeline fence) exercise the sanitization layer and prove poisoned documents never reach the analyzer or extractor.

The release closes the long-open question of how mathematical reasoning integrates with skill-creator's pipeline. The answer — typed primitives, DAG dependencies, tiered loading, transparent integration, reversible ingestion, and a safety suite that knows what it is defending — is the answer the rest of the project builds on. Every subsequent release that touches knowledge ingestion, that talks about complex-plane classification, that refers to progressive disclosure, is downstream of v1.35's design choices. The retrospective section honestly flags what the release did not close: per-phase test distribution is not tracked, eight input formats ship but only one (The Space Between itself) has been dogfooded, and the proof composer's formal reasoning chains are present but not yet exercised against external proof corpora. Those are the follow-ups for v1.36 through v1.40's hardening arc.

## Key Features

| Area | What Shipped |
|------|--------------|
| Primitive registry (Phase 335) | 451 typed mathematical primitives covering all 33 chapters of The Space Between; each primitive carries domain, plane position, chapter reference, dependency list, and extraction provenance |
| Domain taxonomy (Phase 335) | 10 top-level domains — Perception, Waves, Change, Structure, Reality, Foundations, Mapping, Unification, Emergence, Synthesis — with per-domain primitive counts balanced against chapter breadth |
| Dependency graph (Phase 336) | 106 dependency edges wired into a directed acyclic graph via a DAG builder; cycle detection at build time; typed edge metadata (prerequisite vs. refinement vs. instantiation) |
| Path finder (Phase 337) | Dijkstra shortest-path engine over the dependency edges answering "what prerequisites must be understood before primitive X?" as a mechanical query |
| Complex-plane classifier (Phase 338) | Automated classification of primitives onto a 2D plane (Re × Im) for visual navigation and semantic neighborhood lookup |
| Complex-plane navigator (Phase 339) | Neighborhood traversal queries — "which primitives sit within distance d of plane position (a, b)?" — powering the deduplication semantic comparator |
| Composition engine (Phase 340) | Sequential, parallel, and nested composition operators over primitives, returning a composed primitive with a derived dependency set |
| Proof composer (Phase 341) | Formal reasoning chains linking primitives into proofs; step validation; proof integrity checks; structured output for downstream consumers |
| Verification engine (Phase 342) | Dimensional checks, type checks, and domain checks over primitive compositions; typed verification failures with named invariant identifiers |
| Property checker library (Phase 342) | 5 mathematical property checkers (associativity, commutativity, distributivity, identity, inverse) applied to composition operators |
| Pipeline integration (Phase 343) | MFE registered as a skill type in the 6-stage skill-creator pipeline; transparent activation when a stage references MFE-resident primitives |
| Tiered knowledge loading (Phase 343) | 3-tier progressive disclosure — 4K summary (always resident) / 15K active (stage-scoped) / 40K reference (on-demand) — respecting the 2–5% token budget reservation |
| Progressive disclosure skills (Phase 344) | 10 domain skill files generated, one per MFE domain, each publishing its own summary/active/reference tier for per-domain loading |
| Acquire stage (Phase 345) | 8-format ingestion surface: PDF, Markdown, docx, txt, epub, zip, tgz, GitHub — unified under a single `acquire()` entry point |
| Sanitize + HITL gate (Phase 346) | STRANGER-tier sanitizer covering 6 attack categories (prompt injection, hidden Unicode, path traversal, embedded code, binary content, multi-vector); HITL gate blocks progression on user rejection |
| Analyze + extract + wire (Phase 347) | Structure / type / domain / plane analysis; primitive extraction with typed outputs; dependency edge wiring against the existing DAG |
| Dedup + merge (Phase 348) | 96.2%-accurate semantic comparator; pre-filter thresholds (max plane-distance 1.5, min shared keywords 1); merge records provenance of the deduplication decision |
| `sc:learn` CLI (Phase 349, commit `dc06f7d07`) | 7-stage orchestrator at `src/commands/sc-learn.ts` with `ScLearnOptions` (domain, depth, dryRun, scope, onProgress); dry-run mode runs analysis without changeset recording; progress callbacks at each stage |
| `sc:unlearn` CLI (Phase 349, commit `b4c147921`) | 5-stage revert flow at `src/commands/sc-unlearn.ts` — load → validate integrity → extract ops → revert → regenerate affected skills; `--force` bypass with warning |
| SAFE-04 budget cap (Phase 350) | Hard 5% MFE contribution ceiling enforced on any pipeline stage, failing the build on breach |
| SAFE-05 Magic Test (Phase 350) | Zero MFE-internal identifier leakage in user-facing output; scaffolding stays behind the pipeline boundary |
| SAFE-06 Euclid's Test (Phase 350) | Decompose-compose round-trip on every primitive returns an equivalent primitive; composition-engine algebraic consistency proof |
| SAFE-07 self-validation (Phase 350, commit `6bffa967e`) | 262-line integration test at `tests/integration/self-validation.test.ts` synthesizing textbook markdown from the registry and measuring duplicate detection; 96.2% rate (454/472) |
| SAFE-08 security stress (Phase 350, commit `efb18fa3f`) | 472-line integration test at `tests/integration/security-stress.test.ts` with 31 attacks across 9 groups proving poisoned documents never reach the analyzer |
| Test footprint | 631 tests across 16 phases; 24 tests on `sc:learn` (orchestration, options, progress, errors, dry-run); 17 tests on `sc:unlearn` (session lookup, revert, integrity, regeneration); 8 assertion groups in self-validation; 31 cases in security-stress |

## Retrospective

### What Worked

- **451 primitives across 10 domains with a DAG dependency graph.** Encoding all 33 chapters of The Space Between as typed primitives with 106 dependency edges made the knowledge navigable, not just stored. Dijkstra path-finding through mathematical concepts is the right abstraction, and the DAG rejects cycles at build time rather than letting them become runtime mysteries.
- **Tiered progressive disclosure respected the token budget as a structural constraint.** The 4K / 15K / 40K tier split, combined with per-domain skill files, meant MFE activation inside a pipeline stage stayed inside the 2–5% budget reservation. The structural enforcement via SAFE-04 made the budget a hard ceiling rather than a design aspiration.
- **`sc:learn` plus `sc:unlearn` as symmetric operations closed the one-way-door problem.** Reversible sessions with changeset management and graph integrity validation alongside the ingestion pipeline meant learning is never a one-way door. A bad ingestion is a rollback, not a panic.
- **STRANGER-tier security at the sanitization layer treated ingestion as an attack surface.** Six attack categories with 31 blocked vectors on the `sc:learn` pipeline recognized that untrusted input entering the system and modifying its behavior is the classic privilege-escalation pattern. The HITL gate added a human-in-the-loop checkpoint for anything the sanitizer flagged ambiguous.
- **Safety-critical tests cover the actual risk surface.** SAFE-04 (5% budget cap), SAFE-05 (zero MFE leakage), SAFE-06 (decompose-compose round trip), SAFE-07 (96.2% duplicate detection), SAFE-08 (31 attack vectors blocked) — each targets a specific named failure mode of a self-modifying learning system. Naming the tests after the invariants they defend made them auditable after the fact.
- **Provenance tracking on every primitive.** Each primitive entering the registry carries its source document, extraction timestamp, and deduplication decision. When a question arises about where a primitive came from, the answer is in the record rather than in the author's memory.
- **Integration tests under `tests/integration/` exercise the full pipeline end-to-end.** `self-validation.test.ts` synthesizes textbook markdown from the live registry and runs it back through the extraction pipeline, which is the only way to measure dedup accuracy honestly. `security-stress.test.ts` exercises the sanitization layer with real attack payloads rather than shape-only mocks.

### What Could Be Better

- **631 tests for ~9.7K LOC is a high ratio, but test distribution across 16 phases is not visible.** The release notes list total tests but not per-phase counts (unlike v1.33's test-by-phase breakdown), making it harder to assess coverage balance. A future release should land a per-phase test census and flag phases that ship under the density benchmark.
- **`sc:learn` supports 8 input formats but only one has been dogfooded.** The Space Between is the only ingestion target exercised end-to-end. Format breadth without format depth creates untested paths; a GitHub ingestion or an epub ingestion might trip on a format edge case the PDF path never hits.
- **The proof composer is present but not exercised against external proof corpora.** Phase 341 shipped the composer and the integrity checks, but no real external proof (Euclid's Elements, say, or a small number-theory corpus) has been composed through it. The composer will stay partially-tested until a dogfooding mission closes that gap.
- **Per-domain complexity is uneven.** Perception and Foundations carry a high primitive count; Synthesis and Emergence are thinner. The uneven coverage reflects The Space Between's own chapter lengths, but a rebalancing pass against the complex-plane classifier's output would expose under-populated neighborhoods that future ingestion should prioritize.
- **HITL gate requires an interactive human session.** Phase 346's HITL stage blocks on a human decision, which is correct for interactive ingestion but awkward for batch ingestion. A policy-based auto-accept mode (whitelist of trusted sources bypasses HITL) would enable batch backfill without breaking the security model.
- **The 96.2% duplicate detection rate is honest reporting, but the 3.8% miss inventory is not fully characterized.** SAFE-07 documents the rate; the test does not yet cluster the misses to reveal whether they share structural features (same domain, same plane neighborhood) that could motivate a targeted comparator improvement.

## Lessons Learned

- **A mathematical knowledge graph needs a dependency DAG, not a flat registry.** 451 primitives without 106 dependency edges would be a glossary. The DAG makes it possible to answer "what do I need to understand before I can understand this?" as a mechanical query rather than a prose essay, and it rejects cycles at build time rather than letting them become runtime surprises.
- **Token budget enforcement must be structural, not advisory.** The 2–5% budget reservation for MFE activation inside a pipeline stage is respected because SAFE-04 fails the build on breach. A budget that is merely documented drifts; a budget that fails tests stays honest.
- **Self-modifying systems need reversibility as a first-class feature.** `sc:unlearn` with session-scoped rollback and skill regeneration after removal is not a nice-to-have — it is the safety net that makes `sc:learn` safe to use. Land the unlearn alongside the learn, not in a follow-up release, because "we will add unlearn later" is how knowledge-base poisoning incidents happen.
- **Duplicate detection at 96.2% is honest reporting.** Calling out the gap rather than rounding to "high accuracy" sets the right expectation. The 3.8% miss rate is known engineering debt, not a hidden defect, and reporting it as a number rather than a slogan keeps future reviewers calibrated.
- **Untrusted input is an attack surface even when it looks like a textbook.** The `sc:learn` pipeline ingests PDFs, markdown, and GitHub repositories — all of which can carry prompt injection, hidden Unicode, embedded code, or path traversal in the author's name. Treating ingestion as the classic untrusted-input problem (sanitize, classify, HITL-gate, only then analyze) is the correct shape even for "benign" academic content.
- **Tiered progressive disclosure beats monolithic loading.** A 451-primitive registry cannot live fully resident in a context window without starving the rest of the pipeline. The 4K / 15K / 40K tier split, combined with per-domain decomposition, lets the system keep the summary always resident and only pay for the active or reference tiers when the current task actually needs them.
- **Name the safety tests after the invariants they defend.** SAFE-04 (budget cap), SAFE-05 (Magic Test: zero leakage), SAFE-06 (Euclid's Test: composition consistency), SAFE-07 (self-validation), SAFE-08 (security stress) — each name is a pointer back to the named failure mode, which makes retrospective auditing mechanical. "Test #273" does not survive a refactor; "SAFE-05 Magic Test" does.
- **Provenance on every primitive is non-optional for a self-modifying system.** When a primitive looks wrong six months after ingestion, the question "where did this come from?" is the first question asked. Source, extraction timestamp, and deduplication decision on record make the answer a lookup rather than an archaeology project.
- **Dry-run mode belongs in every mutating CLI.** `sc:learn --dry-run` runs the full seven-stage analysis but skips the changeset recording step, which means a reviewer can audit what an ingestion would do before committing to the mutation. A CLI without a dry-run is a CLI that cannot be reviewed safely.
- **HITL gates pay for themselves the first time the sanitizer is ambiguous.** A fully automated sanitizer either false-positives on ambiguous input (blocks legitimate content) or false-negatives (lets poisoned content through). The HITL gate turns that binary into a human decision at the ambiguous boundary, which is the correct cost allocation — cheap decisions stay automated, expensive ones get human review.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Core Skill Management — the adaptive Apply loop that MFE now plugs into as a skill type |
| [v1.24](../v1.24/) | GSD Conformance Audit — the audit that framed "mathematical reasoning as skill type" as an unspecified boundary |
| [v1.28](../v1.28/) | GSD Den Operations — filesystem message bus that the `sc:learn` pipeline writes provenance records into |
| [v1.29](../v1.29/) | Electronics Educational Pack — exemplar educational pack that the pre-MFE pipeline handled via prose reference |
| [v1.30](../v1.30/) | Vision-to-Mission Pipeline — the Zod-first, stage-based design pattern v1.35 inherits for its 7-stage ingestion |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — the MCP surface through which future MFE queries can be exposed to external consumers |
| [v1.32](../v1.32/) | Brainstorm Session Support — downstream consumer of the complex-plane classifier for idea clustering |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — the release whose per-phase test breakdown v1.35's retrospective flags as the missing inventory pattern |
| [v1.34](../v1.34/) | Documentation Ecosystem Refinement — immediate predecessor; the doc refresh v1.35 publishes the MFE pipeline into |
| [v1.36](../v1.36/) | Citation Management — immediate successor; first release that can attach citations to primitives MFE ingests |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — builds on v1.35's complex-plane classifier for a user-facing learning surface |
| [v1.40](../v1.40/) | sc:learn Dogfood Mission — the release that exercises the `sc:learn` pipeline against non-Space-Between corpora, closing the format-breadth gap flagged here |
| [v1.42](../v1.42/) | Test infrastructure release — the release where per-phase test census lands, closing the coverage-distribution gap |
| [v1.44](../v1.44/) | Release that applied lesson #1 (DAG beats flat registry) to the skills registry itself |
| [v1.45](../v1.45/) | Release that closed the HITL batch-ingestion gap with policy-based auto-accept |
| [v1.49](../v1.49/) | Mega-release that consolidated post-v1.35 implementation work; MFE primitives re-exposed through the unified cartridge pipeline |
| `src/commands/sc-learn.ts` | `sc:learn` CLI command — 7-stage orchestrator (commit `dc06f7d07`) |
| `src/commands/sc-unlearn.ts` | `sc:unlearn` CLI command — 5-stage revert flow (commit `b4c147921`) |
| `tests/integration/self-validation.test.ts` | SAFE-07 self-validation integration test proving 96.2% duplicate detection (commit `6bffa967e`) |
| `tests/integration/security-stress.test.ts` | SAFE-08 security stress test proving 31 attack vectors blocked (commit `efb18fa3f`) |
| `docs/release-notes/v1.35/chapter/03-retrospective.md` | Chapter retrospective with the full What Worked / What Could Be Better inventory |
| `docs/release-notes/v1.35/chapter/04-lessons.md` | Lessons chapter with six extracted lessons and their applied-or-investigate status |
| The Space Between (33 chapters) | Source corpus for the 451 primitives — Perception, Waves, Change, Structure, Reality, Foundations, Mapping, Unification, Emergence, Synthesis |

## Cumulative Statistics

- **Phases landed at tip:** 350 (v1.35 covers 335–350, 16 phases)
- **Plans completed in window:** 50
- **Commits in window:** 79
- **Requirements closed:** 43/43
- **Tests added to suite:** 631 across the 16-phase window
- **Source LOC:** ~9.7K
- **Test LOC:** ~13.1K
- **Data LOC:** ~21.4K (primitives + dependency edges + chapter references)
- **Skill files generated:** ~1.2K lines across 10 progressive-disclosure domain skills
- **Mathematical primitives in registry:** 451 (up from 0 pre-v1.35)
- **Dependency edges in DAG:** 106
- **Reasoning engines online:** 8 (dependency graph, path finder, plane classifier, plane navigator, composition, proof composer, verification, property checker)
- **Input formats accepted by `sc:learn`:** 8 (PDF, Markdown, docx, txt, epub, zip, tgz, GitHub)
- **Attack categories blocked at sanitization:** 6
- **Attack vectors exercised in SAFE-08:** 31 across 9 test groups
- **Duplicate detection rate (SAFE-07):** 96.2% (454/472 candidates)

## Taxonomic State

- **Perception:** domain 1 of 10, chapters 1–4 of The Space Between, primitives covering sensory and observational foundations
- **Waves:** domain 2 of 10, chapters 5–8, primitives covering oscillation, frequency, and harmonic analysis
- **Change:** domain 3 of 10, chapters 9–12, primitives covering differentiation, flow, and rate-of-change structures
- **Structure:** domain 4 of 10, chapters 13–16, primitives covering algebraic and topological scaffolding
- **Reality:** domain 5 of 10, chapters 17–19, primitives covering ontological and model-theoretic foundations
- **Foundations:** domain 6 of 10, chapters 20–22, primitives covering logic, set theory, and formal-systems groundwork
- **Mapping:** domain 7 of 10, chapters 23–25, primitives covering morphisms, transforms, and correspondences
- **Unification:** domain 8 of 10, chapters 26–28, primitives covering cross-domain integration patterns
- **Emergence:** domain 9 of 10, chapters 29–31, primitives covering complex-systems and self-organization
- **Synthesis:** domain 10 of 10, chapters 32–33, primitives covering the capstone integration of the prior nine domains
- **DAG depth:** longest prerequisite chain spans multiple domains via the 106 dependency edges; Dijkstra path queries return the minimal-prerequisite set for any target primitive
- **Complex-plane coverage:** every primitive carries a (Re, Im) position enabling neighborhood queries via the Phase 339 navigator

## Engine Position

v1.35 sits in the middle of the post-v1.29 knowledge-subsystem arc. v1.29 landed the first educational pack (Electronics); v1.30 landed the typed pipeline; v1.31 exposed the pipeline through MCP; v1.32 added brainstorm session support; v1.33 landed the multi-agent cloud platform; v1.34 refined the documentation ecosystem. v1.35 is the release that turns "mathematical foundations" from a prose appendix into a first-class typed subsystem and adds the first reversible self-modifying knowledge ingestion pipeline the project has ever shipped. Every subsequent release that touches primitives, complex-plane classification, progressive disclosure, or safe ingestion — v1.36 citations, v1.37 complex-plane learning framework, v1.40 sc:learn dogfooding, v1.42 test-infrastructure census, v1.44 DAG-everywhere, v1.45 HITL batch mode — is downstream of v1.35's design choices. In the longer 360-degree Seattle engine arc that the project is running against in parallel, v1.35 is the release that made the engine's mathematical substrate audit-ready: primitives have provenance, compositions have verification, ingestion has rollback, and the safety suite knows the names of its own invariants.

## Files

- `src/commands/sc-learn.ts` — `sc:learn` CLI command orchestrating the 7-stage acquire → sanitize → HITL → analyze → extract → dedup → generate pipeline; 358 lines of implementation plus 711 lines of unit tests (commit `dc06f7d07`)
- `src/commands/sc-unlearn.ts` — `sc:unlearn` CLI command implementing the 5-stage load → validate → extract → revert → regenerate flow; 195 lines of implementation plus 388 lines of unit tests (commit `b4c147921`)
- `tests/integration/self-validation.test.ts` — SAFE-07 self-validation integration test; 262 lines synthesizing textbook markdown from the 451-primitive registry and measuring 96.2% (454/472) duplicate detection (commit `6bffa967e`)
- `tests/integration/security-stress.test.ts` — SAFE-08 security stress integration test; 472 lines exercising 31 attack vectors across 9 groups (prompt injection, hidden Unicode, path traversal, embedded code, binary content, multi-vector combined, HITL gate, false-positive safety, pipeline fence) (commit `efb18fa3f`)
- `.gitignore` — milestone-completion gitignore update (commit `51cfd9692`)
- `docs/release-notes/v1.35/chapter/00-summary.md` — summary chapter pointing to this README
- `docs/release-notes/v1.35/chapter/03-retrospective.md` — full What Worked / What Could Be Better inventory
- `docs/release-notes/v1.35/chapter/04-lessons.md` — six extracted lessons with applied-or-investigate status
- `docs/release-notes/v1.35/chapter/99-context.md` — prev/next navigation and parse-confidence metadata

---

_Parse confidence: 1.00 — authored from git log `v1.35~5..v1.35` plus tag metadata plus chapter files._
