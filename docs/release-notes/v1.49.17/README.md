# v1.49.17 — The Space Between

**Released:** 2026-03-04
**Scope:** cartridge packaging format + audio engineering pack + hardware infrastructure pack + muse vocabulary + Space Between cartridge
**Branch:** dev → main
**Tag:** v1.49.17 (2026-03-04)
**Commits:** v1.49.16..v1.49.17 (9 commits, head `cdce79517`)
**Files changed:** 55 (+5,129 / −15)
**Predecessor:** v1.49.16 — Muse Integration & MCP Pipeline
**Successor:** v1.49.18
**Classification:** feature — first cartridge-format milestone; composition-as-packaging for educational content
**Phases covered:** 585–588 (4 sequential phases)
**Verification:** 112 new tests · TypeScript compilation clean (3 pre-existing errors resolved) · integration test validating Space Between cartridge composition · package rename `dynamic-skill-creator` → `gsd-skill-creator`

## Summary

**The cartridge format ships as the first composition mechanism for educational packs.** Before v1.49.17 the project had knowledge packs (heritage-skills-pack, electronics pack, foundational knowledge packs) but no unified way to compose them at load time. The new `src/bundles/cartridge/` module defines types, a loader (unpacker), a validator, a registry, and a packer — the minimum viable surface for treating independently-authored knowledge domains as discrete, composable cartridges. The design specification is explicit in the release name: Mark Farina-style four-track crossfading, where four separate audio sources converge into one continuous field of sound, is the exact structural pattern the cartridge format encodes for knowledge packs. Four knowledge domains — audio engineering, hardware infrastructure, mathematics, and the muse vocabulary that bridges them — compose through the cartridge loader into one learning experience rather than three separate pack imports. `src/bundles/cartridge/index.ts` is the single entry point; 177 tests in `cartridge-packer.test.ts` and 155 in `types.test.ts` exercise the failure modes (invalid cartridges, schema mismatches, registry collisions). The cartridge format is small by design — four files in the core module plus types — because the point of v1.49.17 was to prove the mechanism, not to over-engineer a packaging framework before any consumers existed.

**Audio Engineering Pack delivers 36 concepts across 6 domains with 32 citations.** `src/audio-engineering/` ships as a full pack with domain separation: synthesis (`domains/synthesis.ts`), physics of sound (`domains/physics-of-sound.ts`), consoles and mixing (`domains/consoles-and-mixing.ts`), DJ culture (`domains/dj-culture.ts`), MIDI and protocols (`domains/midi-and-protocols.ts`), and production (`domains/production.ts`). Each domain file exports concept objects with title, summary, canonical references, and learning pathways — the same shape the knowledge packs use, adapted to audio engineering's cross-disciplinary nature. `citations/bibliography.ts` carries 32 canonical references drawn from foundational audio engineering literature, with enough provenance for the pack to stand on its own in a classroom context. College enrichment modules (`college/music-enrichment.ts` and `college/physics-enrichment.ts`) map the audio pack into the existing college department structure — music for the synthesis-and-DJ-culture throughlines, physics for the wave-and-signal-processing throughlines. 135 tests in `audio-engineering-pack.test.ts` cover concept lookup, domain traversal, citation resolution, and the cross-pack bridges that the Space Between cartridge relies on.

**Hardware Infrastructure Pack models five compute tiers as first-class pack content.** `src/hardware-infrastructure/` encodes edge, desktop, workstation, server, and cloud tiers as distinct TypeScript modules in `tiers/` — each tier describes its power envelope, thermal budget, IO fabric, and reference node profiles. `profiles/node-profiles.ts` provides concrete node shapes (Pi-class edge device, RTX 4060 Ti desktop, Threadripper workstation, dual-socket server, hyperscaler cloud node) with the same field names across tiers, which is what lets downstream tooling query "how much VRAM does this tier have" without branching. College enrichments (`college/electronics-enrichment.ts` and `college/engineering-enrichment.ts`) integrate the hardware pack into electronics and engineering department curricula. 94 tests in `hardware-infrastructure-pack.test.ts` exercise tier lookup, cross-tier comparison, and the type guards that prevent tier fields from silently diverging as the pack grows. The pack maps directly to the mesh architecture's heterogeneous compute model — same tiers, same node profiles — so any future mesh-aware consumer can read the hardware pack without a translation layer.

**The Muse Vocabulary Index is the 122-entry glue between audio, hardware, and mathematics.** `src/chipset/muse-vocabulary-index.ts` ships a 122-entry vocabulary that maps conceptual bridges between the three domains — "signal", "channel", "gain", "band", "fidelity", "resolution", "latency", "harmonic", and similar terms are defined once and cross-referenced across the audio and hardware packs plus the mathematics corpus. Without this vocabulary the Space Between cartridge would be three pack imports sitting next to each other; with it, the cartridge can answer cross-domain questions ("what does gain mean in the hardware pack vs. the audio pack") that require a shared vocabulary to be meaningful. 65 tests in `muse-vocabulary-index.test.ts` plus 46 in `muse-vocabulary.test.ts` cover lookup, disambiguation, bridge resolution, and the Cedar creative-insight-engine hooks that future milestones will consume. The Muse Vocabulary is the structural foundation for Cedar — it's what Cedar reads when it needs to know which concepts are load-bearing across domains, and which terms collide across packs in ways that should surface as creative insight.

**The Space Between cartridge binds 31 bridged concepts into one integrated artifact.** `data/cartridges/space-between/cartridge.ts` (131 lines) is the first concrete cartridge — 31 concepts that explicitly bridge audio engineering, hardware architecture, and mathematics, drawn together by the muse vocabulary and validated through the cartridge pipeline. `data/cartridges/space-between/integration.test.ts` (84 lines) is the composition-integrity suite: it exercises cross-pack lookups, verifies that every bridged concept resolves in both source packs, and fails if the cartridge's bridges go stale relative to the underlying pack content. The cartridge is named after the essay that became its philosophical spine — *The Space Between: A Muse for the Mesh* — which traces the structural correspondence between audio engineering, hardware architecture, and the mesh's design principles. The cartridge is small (31 concepts) because the first cartridge should demonstrate the mechanism, not exhaust the domain; subsequent cartridges will extend the format as more domains land packs.

**Three Maple Foxy Bells essays ship as the educational throughline.** `src/site/content/essays/the-space-between-muse.md` (393 lines) is the philosophical spine — the four-track crossfade metaphor, the mesh-architecture correspondence, the composition-as-packaging argument. `src/site/content/essays/audio-synthesis-reference.md` (1,019 lines) is a 27-channel synthesis deep dive drawn from the original Maple Foxy Bells mission pack, now restructured as educational reference. `src/site/content/essays/hardware-expansion-pack.md` (874 lines) traces computing history from the Amiga's custom-chip architecture through modern mesh compute — the long arc that the hardware pack's tier model compresses into five type signatures. Together the three essays are 2,286 lines of source prose that became pack content without a separate research phase, continuing the "teaching reference IS the research" pattern established in v1.49.8 and v1.49.9. The essays remain on the site as long-form context for learners who want the full argument behind the structured pack content.

**Composition-as-packaging is the release's load-bearing architectural claim.** Before v1.49.17, combining knowledge packs meant importing each pack and calling into it directly — the caller had to know each pack's shape, its domain vocabulary, and how to bridge concepts across pack boundaries. The cartridge format inverts that relationship: a cartridge declares which packs it binds and which concepts it bridges, and the cartridge loader handles composition at load time. This matters because educational content scales by domain count, and the monolithic-import pattern costs N-squared integration work as N packs grow. Cartridges cost N work — each new domain adds one pack plus at most a handful of vocabulary bridges, not N separate pack-to-pack integrations. The Space Between cartridge is the existence proof for the composition semantics; subsequent milestones will exercise the format against more pack combinations and formalize the composition rules (ordering, conflict resolution, overlapping-concept merge) that v1.49.17 left informal.

**Four sequential commits deliver the mission-pack stack in dependency order.** Phase 585 (`feat(585): add foundation types for cartridge, audio, hardware, muse`) landed the type system for all four targets — 725 insertions across 8 files, each type file paired with a tests file that exercises the schema before any implementation depends on it. Phase 586 (`feat(586): implement audio engineering pack with 36 concepts and 32 citations`) built on the type foundation, 796 insertions across 13 files. Phase 587 (`feat(587): implement hardware pack, cartridge format, and muse vocabulary`) delivered the three remaining pillars in one commit (973 insertions, 20 files) because the hardware pack, cartridge format, and muse vocabulary were deliberately co-designed and share too many type edges to split cleanly. Phase 588 (`feat(588): create Space Between cartridge with 31 concepts and integration tests`) closed the loop with the first concrete cartridge (215 insertions, 2 files). The commit sequence is reviewable by design: types first, then the consumers that depend on types in declaration order, and finally the integrated artifact that exercises all four layers together.

**Housekeeping closes three TypeScript compilation errors and finalizes the package rename.** `fix(build): resolve 3 TypeScript compilation errors` (`f808f35d7`) is a small but load-bearing commit — `lifecycle-resolver.ts` picked up a cast-through-unknown for `TestRunSnapshot → Record`, `corrective-rag.test.ts` gained a missing `sessionId` on the mock `PipelineContext`, and `cartridge/types.ts` tightened `z.record(z.string(), z.unknown())` to include the key type explicitly. These are the kind of errors that surface the moment a new pack tries to compile against an existing codebase, and fixing them in this release means the cartridge stack built clean on landing. `chore: rename package to gsd-skill-creator` (`cdce79517`) finalizes the identity shift from `dynamic-skill-creator` — the old name was a working title that never fit the project's actual scope, and correcting it in `package.json`, `package-lock.json`, and `INSTALL.md` before external visibility grew was the right time. `docs: add release notes for v1.49.15, v1.49.16, v1.49.17` (`474d78ad7`) caught the release-notes ledger up on three missing entries that had drifted.

**The release name — The Space Between — is specification, not decoration.** The phrase names the structural move every layer of v1.49.17 makes: the vocabulary sits between packs, the cartridge sits between domains, the essays sit between the structured pack content and the lived creative context that gave rise to it. The Mark Farina crossfade metaphor in the philosophical-spine essay isn't an analogy used to decorate a docs page; it's the design intent for the cartridge loader. Four tracks, four domains, one continuous field — the release's structural claim is that the right packaging format lets independently-authored knowledge compose without losing its source character, in the same way a four-track DJ mix lets four independently-produced recordings converge without losing what made any of them worth playing. v1.49.17 is the release where that claim became executable.

## Key Features

| Area | What Shipped |
|------|--------------|
| Cartridge format | `src/bundles/cartridge/` — types (`types.ts`), loader (`cartridge-unpacker.ts`), validator (`cartridge-validator.ts`), registry (`cartridge-registry.ts`), packer (`cartridge-packer.ts`), barrel (`index.ts`); 177 packer tests + 155 type tests + structural failure-mode coverage |
| Audio Engineering Pack | `src/audio-engineering/` — 36 concepts across 6 domains (synthesis, physics of sound, consoles & mixing, DJ culture, MIDI & protocols, production); 135 tests in `audio-engineering-pack.test.ts` |
| Audio citations | `src/audio-engineering/citations/bibliography.ts` — 32 canonical references from foundational audio engineering literature with provenance chains |
| Audio college enrichments | `src/audio-engineering/college/music-enrichment.ts` + `college/physics-enrichment.ts` — cross-department bridges into music and physics curricula |
| Hardware Infrastructure Pack | `src/hardware-infrastructure/` — 5 compute tiers (edge, desktop, workstation, server, cloud) with power/thermal/IO envelopes; `profiles/node-profiles.ts` ships reference node shapes for each tier |
| Hardware college enrichments | `src/hardware-infrastructure/college/electronics-enrichment.ts` + `college/engineering-enrichment.ts` — bridges into electronics and engineering department curricula |
| Hardware pack tests | `src/hardware-infrastructure/hardware-infrastructure-pack.test.ts` — 94 tests covering tier lookup, cross-tier comparison, and type-guard stability |
| Muse Vocabulary | `src/chipset/muse-vocabulary.ts` + `muse-vocabulary-index.ts` — 122-entry cross-domain vocabulary bridging audio, hardware, and mathematics; Cedar creative-insight-engine foundation |
| Muse Vocabulary tests | `muse-vocabulary.test.ts` (46) + `muse-vocabulary-index.test.ts` (65) — lookup, disambiguation, and bridge-resolution coverage |
| Space Between cartridge | `data/cartridges/space-between/cartridge.ts` — 31 bridged concepts integrating audio + hardware + mathematics; 131 lines |
| Space Between integration | `data/cartridges/space-between/integration.test.ts` — 84-line composition-integrity suite that fails if cross-pack bridges go stale |
| Maple Foxy Bells essays | `src/site/content/essays/the-space-between-muse.md` (393 lines) + `audio-synthesis-reference.md` (1,019 lines) + `hardware-expansion-pack.md` (874 lines) — 2,286 lines of source prose as educational throughline |
| TypeScript compilation fix | `src/mesh/lifecycle-resolver.ts`, `src/retrieval/corrective-rag.test.ts`, `src/bundles/cartridge/types.ts` — three pre-existing errors closed so the cartridge stack compiles clean |
| Package rename | `package.json`, `package-lock.json`, `INSTALL.md` — `dynamic-skill-creator` → `gsd-skill-creator` before external visibility grew |
| Release-notes catch-up | `docs/RELEASE-HISTORY.md` + `docs/release-notes/v1.49.15/`, `v1.49.16/`, `v1.49.17/` READMEs — three missing entries added |
| Version bump | `package.json` bumped to 1.49.17 in a dedicated commit (`e46f89185`) |
| Phase sequence | Four sequential feature commits (585 types → 586 audio → 587 hardware+cartridge+muse → 588 Space Between cartridge) landing in dependency order |

## Retrospective

### What Worked

- **Cartridge format as the first composition mechanism.** Treating knowledge packs as composable cartridges (load, validate, bridge) is the packaging equivalent of the mesh architecture's model abstraction. The audio + hardware + mathematics cartridge demonstrates that independently-authored domains can compose into a unified educational surface without an N-squared integration layer.
- **Source documents became packs without a separate research phase.** Three creative/educational essays and a 31-chapter math textbook were absorbed directly into pack content. The "teaching reference IS the research" pattern from v1.49.8 and v1.49.9 scaled cleanly to cartridge packaging — the essays stayed as long-form context, the structured content extracted into pack-shape modules.
- **122-entry Muse Vocabulary with cross-domain concept bridging.** The vocabulary index isn't a glossary — it maps connections between audio engineering, hardware architecture, and mathematics. This is the structural foundation for Cedar's creative insight engine and the reason the Space Between cartridge can answer cross-domain questions rather than just collocate three packs.
- **Phase sequence 585 to 588 landed in dependency order.** Types first, consumers next, integrated artifact last. Every phase compiled clean against the phases before it, and the commit history is readable top-to-bottom as a build log for the cartridge stack.
- **Package rename done before external visibility grew.** `dynamic-skill-creator` to `gsd-skill-creator` in a single housekeeping commit closes the identity drift while the audience is still small enough for the rename cost to be absorbed cleanly.
- **TypeScript errors closed in a dedicated commit.** Resolving three pre-existing compilation errors in `f808f35d7` before the cartridge pack lands means the stack compiled clean on first landing, not after a scramble of post-merge fixes.

### What Could Be Better

- **The cartridge format is defined but composition semantics are informal.** The Space Between cartridge bridges audio, hardware, and mathematics, but the rules for how cartridges compose under pressure — ordering, conflict resolution, overlapping-concept merge, version skew between bundled packs — aren't formalized in types or enforced by the validator. The next cartridge iteration should pin these rules in code rather than leaving them to convention.
- **112 new tests for a new packaging format is thin.** The cartridge loader, validator, registry, and packer/unpacker each handle failure modes (invalid cartridges, missing dependencies, version conflicts, malformed bridges) that deserve explicit red-team coverage analogous to what heritage-skills-pack carries for cultural safety. The next release should close this gap with adversarial cartridge inputs.
- **Only one concrete cartridge shipped.** The Space Between is the existence proof, but one cartridge is not a format stress test. A second cartridge built against a different pack trio would validate that the composition semantics generalize beyond the audio/hardware/mathematics triple.
- **Muse Vocabulary is 122 entries with no community-review cadence.** Cross-domain vocabularies drift as packs grow; the vocabulary should carry an explicit update protocol (when to add, when to retire, when to split an entry) rather than growing by incremental commits.
- **Hardware tier profiles are representative, not canonical.** The five tiers in `tiers/` carry reference node profiles, but the mapping from "workstation" to a specific Threadripper SKU is an example, not an authoritative spec. Downstream consumers that treat the profiles as authoritative will eventually diverge from reality as hardware generations turn over.

## Lessons Learned

- **Composition-as-packaging solves the scaling problem for educational content.** Cartridges let domains be authored independently and composed at load time, avoiding the monolithic department structure that v1.49.10's flat-atoms architecture was designed to prevent. The cost flips from N-squared pack-to-pack integrations to N pack-plus-bridges additions.
- **The Mark Farina crossfade metaphor is specification, not decoration.** Four tracks into one continuous field of sound — four knowledge domains into one learning experience. The metaphor names the design intent for the cartridge loader, and the essay that carries it (`the-space-between-muse.md`) is canonical documentation for what the cartridge format is supposed to do.
- **Cross-domain vocabularies are the glue that makes composition meaningful.** Without the 122-entry Muse Vocabulary mapping connections between audio, hardware, and mathematics, the Space Between cartridge would be three unrelated packs in a zip file. The vocabulary is what turns collocation into integration.
- **Types before implementation pays back immediately when the stack is co-designed.** Phase 585 landed type files for all four targets (cartridge, audio, hardware, muse) before any implementation. Phase 586 compiled clean against those types on first try, and the subsequent phases inherited the same clean build. When the pack stack is co-designed, types-first is the cheap path.
- **Four commits in dependency order are easier to review than one big drop.** 585 to 588 with each commit adding one layer lets a reviewer read the stack top-to-bottom. The 973-insertion commit at 587 is the exception — hardware, cartridge, and muse were too tightly coupled to split — and the exception is tolerable precisely because the surrounding commits are small.
- **The teaching-reference-IS-the-research pattern keeps scaling.** Three essays (`the-space-between-muse.md`, `audio-synthesis-reference.md`, `hardware-expansion-pack.md`) that were originally written as long-form creative documents dropped in as pack source with no separate research phase. The pattern works when the original prose was already structured; it will not work for raw reference material that lacks a through-line.
- **A cartridge should be small enough to prove the mechanism, large enough to matter.** The Space Between cartridge binds 31 concepts — enough to exercise cross-pack bridging but small enough that the integration test runs fast and the cartridge stays readable. "Prove the mechanism" is the right goal for a format's first concrete instance; exhausting the domain comes later.
- **Close pre-existing TypeScript errors before landing a new pack.** The three fixes in `f808f35d7` were not caused by the cartridge work, but they would have shown up as phantom failures in the cartridge pack's CI. Closing them in a dedicated commit before the pack lands keeps the signal-to-noise ratio on the pack's own build high.
- **Rename packages early, not once the audience is large.** `dynamic-skill-creator` to `gsd-skill-creator` cost one small commit now; the same rename after hundreds of downstream references would cost coordinated upgrades and deprecation notices. Identity drift is cheapest to close while visibility is still small.
- **Catch up on missed release notes in a single commit rather than back-editing history.** Three READMEs (v1.49.15, v1.49.16, v1.49.17) landed in one commit (`474d78ad7`) as a ledger catch-up. This is more honest than back-dating edits and preserves the record that the notes were authored after the fact.
- **Five hardware tiers is the minimum that models the real compute spectrum.** Edge / desktop / workstation / server / cloud covers the envelope from a Raspberry Pi to a hyperscaler node without collapsing meaningful differences. Fewer tiers would merge envelopes that behave differently under load; more tiers would spread thin.
- **Small cartridge registries ship with the loader, not as a separate service.** `cartridge-registry.ts` is 33 lines — a lookup table, not a microservice. The registry grows into a service only when there are more cartridges than can fit in a literal list, and v1.49.17 is not that point yet.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.16](../v1.49.16/) | Predecessor — Muse Integration & MCP Pipeline; sets up the muse surface the vocabulary index extends |
| [v1.49.18](../v1.49.18/) | Successor — continues the v1.49.x line after the cartridge format ships |
| [v1.49.15](../v1.49.15/) | Three-release README catch-up landed in this window |
| [v1.49.12](../v1.49.12/) | Heritage Skills Educational Pack — the pack architecture the cartridge format wraps |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — the monolithic pattern composition-as-packaging was designed to prevent |
| [v1.49.9](../v1.49.9/) | Establishes the "teaching reference IS the research" pattern the essays inherit |
| [v1.49.8](../v1.49.8/) | Earlier instance of absorbing source documents directly into pack content |
| [v1.49.7](../v1.49.7/) | Optional-dependency contract — the discipline the cartridge validator follows |
| [v1.49.0](../v1.49.0/) | Parent mega-release where the v1.49.x line and GSD-OS desktop surface first shipped |
| [v1.49](../v1.49/) | Consolidated mega-release notes for the v1.49 line |
| [v1.36](../v1.36/) | Citation Management — the bibliography pattern `src/audio-engineering/citations/bibliography.ts` follows |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — the math corpus the Space Between cartridge bridges against |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — the pack-shape template the audio and hardware packs inherit |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG pattern the cartridge format composes over |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri shell that hosts the essays and pack surfaces |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop the cartridge format extends at the Compose step |
| `src/bundles/cartridge/index.ts` | Cartridge format barrel export |
| `src/bundles/cartridge/types.ts` | Cartridge type system (149 lines) |
| `src/bundles/cartridge/cartridge-validator.ts` | Cartridge validation surface (64 lines) |
| `src/bundles/cartridge/cartridge-packer.ts` | Cartridge packer (24 lines) plus 177 tests |
| `src/bundles/cartridge/cartridge-unpacker.ts` | Cartridge unpacker / loader (33 lines) |
| `src/bundles/cartridge/cartridge-registry.ts` | Cartridge registry (33 lines) |
| `src/audio-engineering/audio-engineering-pack.ts` | Audio pack entry point |
| `src/hardware-infrastructure/hardware-infrastructure-pack.ts` | Hardware pack entry point |
| `src/chipset/muse-vocabulary-index.ts` | 122-entry cross-domain vocabulary index |
| `data/cartridges/space-between/cartridge.ts` | First concrete cartridge — 31 bridged concepts |
| `data/cartridges/space-between/integration.test.ts` | Composition-integrity suite |
| `src/site/content/essays/the-space-between-muse.md` | Philosophical spine essay (393 lines) |
| `src/site/content/essays/audio-synthesis-reference.md` | 27-channel synthesis deep dive (1,019 lines) |
| `src/site/content/essays/hardware-expansion-pack.md` | Amiga-to-mesh hardware essay (874 lines) |

## Engine Position

v1.49.17 is the first cartridge-format milestone in the v1.49.x line and the first release to ship composition-as-packaging as an executable mechanism rather than a design note. It stands on v1.49.12's heritage-skills-pack pattern (pack-shape content with wardens, tests, and canonical works), the v1.49.10 flat-atoms architecture (which the cartridge format replaces as the scaling path for multi-domain content), the v1.36 citation-management pipeline (which the audio-engineering bibliography follows), and the v1.27 foundational-knowledge-packs template (which the audio and hardware packs inherit). Looking forward, the cartridge format becomes the composition substrate for any future pack combination — subsequent cartridges will exercise the format against different pack trios and formalize the composition rules (ordering, conflict resolution, overlapping-concept merge) that v1.49.17 left informal. The Muse Vocabulary Index is the structural foundation for Cedar's creative-insight-engine hooks, which future milestones will consume as the vocabulary grows and the cross-domain bridges mature. The release's 9 commits, 55 files, and 5,129 insertions are small compared to v1.49.12's 284-file heritage-pack milestone, but the architectural footprint is disproportionately large — v1.49.17 is where composable educational content became real in the project's surface.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.16..v1.49.17) | 9 |
| Files changed | 55 |
| Lines inserted / deleted | 5,129 / 15 |
| Phases shipped | 4 (585–588) |
| New tests | 112 |
| New packs | 2 (Audio Engineering, Hardware Infrastructure) |
| New cartridge format | 1 (`src/bundles/cartridge/`) — types, loader, validator, registry, packer |
| New cartridges | 1 (Space Between — 31 bridged concepts) |
| Muse Vocabulary entries | 122 |
| Audio concepts | 36 across 6 domains |
| Audio citations | 32 |
| Hardware tiers | 5 (edge, desktop, workstation, server, cloud) |
| Essays shipped | 3 (2,286 total lines) |
| TypeScript errors closed | 3 |
| Package renames | 1 (`dynamic-skill-creator` → `gsd-skill-creator`) |

## Taxonomic State

| Dimension | Before v1.49.17 | After v1.49.17 |
|-----------|-----------------|----------------|
| Pack architecture | Monolithic pack imports, N-squared integration cost | Cartridge composition, N-plus-bridges cost |
| Audio domain coverage | None | 36 concepts across 6 domains, 32 citations |
| Hardware domain coverage | Mesh types only | 5 tiers with reference node profiles |
| Cross-domain vocabulary | Ad-hoc per pack | 122-entry Muse Vocabulary Index |
| Concrete cartridges | 0 | 1 (Space Between, 31 concepts) |
| Package identity | `dynamic-skill-creator` (working title) | `gsd-skill-creator` (canonical) |
| Essays in site content | 0 in this scope | 3 (2,286 lines) |
| College enrichment departments touched | — | Music, Physics, Electronics, Engineering |

## Files

- `src/bundles/cartridge/types.ts` (149 lines) + `types.test.ts` (155 lines) — cartridge type system and schema validation
- `src/bundles/cartridge/cartridge-packer.ts` (24 lines) + `cartridge-packer.test.ts` (177 lines) — cartridge packer with failure-mode coverage
- `src/bundles/cartridge/cartridge-unpacker.ts` (33 lines) + `cartridge-validator.ts` (64 lines) + `cartridge-registry.ts` (33 lines) + `index.ts` (40 lines) — loader, validator, registry, and barrel export
- `src/audio-engineering/` — audio-engineering-pack.ts (69 lines), audio-engineering-pack.test.ts (135 lines), types.ts (62), types.test.ts (55), index.ts (29), citations/bibliography.ts (50), domains/ (6 files, 450 lines), college/ (2 files, 63 lines)
- `src/hardware-infrastructure/` — hardware-infrastructure-pack.ts (49), hardware-infrastructure-pack.test.ts (94 tests), types.ts (105), types.test.ts (122), index.ts (35), profiles/node-profiles.ts (42), tiers/ (6 files, ~151 lines), college/ (2 files, 44 lines)
- `src/chipset/muse-vocabulary.ts` (31) + `muse-vocabulary.test.ts` (46) + `muse-vocabulary-index.ts` (122) + `muse-vocabulary-index.test.ts` (65) — 122-entry vocabulary index with tests
- `data/cartridges/space-between/cartridge.ts` (131 lines) + `integration.test.ts` (84 lines) — first concrete cartridge and composition-integrity suite
- `src/site/content/essays/the-space-between-muse.md` (393 lines) + `audio-synthesis-reference.md` (1,019 lines) + `hardware-expansion-pack.md` (874 lines) — 2,286-line essay throughline
- `src/mesh/lifecycle-resolver.ts` + `src/retrieval/corrective-rag.test.ts` + `src/bundles/cartridge/types.ts` — TypeScript compilation fixes (`f808f35d7`)
- `package.json` + `package-lock.json` + `INSTALL.md` — package rename (`cdce79517`) and version bump to 1.49.17 (`e46f89185`)
- `docs/RELEASE-HISTORY.md` + `docs/release-notes/v1.49.15/README.md` + `docs/release-notes/v1.49.16/README.md` + `docs/release-notes/v1.49.17/README.md` — release-notes ledger catch-up (`474d78ad7`)

Aggregate: 55 files changed, 5,129 insertions, 15 deletions, 9 commits spanning v1.49.16..v1.49.17.
