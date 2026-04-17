# v1.49.25 — Wings of the Pacific Northwest & Fur, Fin & Fang

*Liquid eTernity edition*

**Released:** 2026-03-09
**Scope:** dual wildlife research collections — AVI (250+ bird species) and MAM (169+ mammal species) — completing the vertebrate biological survey of the Pacific Northwest at species-level detail, plus the largest single-session parallel-agent content run in the PNW Research Series to date
**Branch:** dev → main
**Tag:** v1.49.25 (2026-03-09) — merge commit `f10ef8377` over dev tip `c90926f66`
**Commits (window):** v1.49.24..v1.49.25 — 2 commits for the release-ledger pass (`f10ef8377` merge + `c90926f66` FEATURES/RELEASE-HISTORY/README update); substantive content landed in the cross-branch window carrying `48bb1c62d feat(pnw): add AVI and MAM research compendiums with browser pages` and related PNW commits
**Files changed (window):** 3 at the tag boundary (README.md, docs/FEATURES.md, docs/RELEASE-HISTORY.md, +6/-2); ~49 at the AVI/MAM content boundary (~40,319 new lines of taxonomic/ecological/cultural research)
**Predecessor:** v1.49.24 — Building Construction & Smart Home Electronics (BCM + SHE)
**Successor:** v1.49.26 — next PNW Research Series landing
**Classification:** content release — fifth and sixth PNW research collections ship together; first dual-pack landing in the series and first to use 4 parallel Opus agents on a shared self-claiming task queue
**Verification:** AVI 38/38 verification tests (8/8 safety-critical) + MAM 36/36 verification tests (9/9 safety-critical); combined 17/17 safety-critical PASS across OCAP/CARE/UNDRIP, ESA, COSEWIC, MMPA, and MBTA compliance lanes; PNW master index refreshed from 6 → 8 projects with 99 research files and 7.0 MB total content

## Summary

**The Pacific Northwest vertebrate biological survey reached species-level completeness.** Before v1.49.25 the PNW Research Series carried four published collections (COL, CAS, ECO, GDN) and the v1.49.24 industrial/domestic pair (BCM + SHE). After v1.49.25 the series carries eight published collections with the two largest wildlife compendiums — AVI (Wings of the Pacific Northwest) documenting 250+ bird species across 7 ecoregions, and MAM (Fur, Fin & Fang) documenting 169+ mammal species across 8 ecoregion zones including a dedicated Marine zone for cetaceans, pinnipeds, and sea otters — landing together in a single atomic commit. With ECO providing the full living-systems taxonomy, AVI and MAM fill the specific-class vertebrate slots (birds and mammals) that the ECO top-down survey could only summarize. Remaining vertebrate classes (reptiles, amphibians, fish) are not required for the ecological-network models that downstream chipsets and research tools consume, so the series has reached functional survey completeness for the current PNW skill-metaphor and ecological-indicator work.

**Four parallel Opus agents on a self-claiming task queue produced the synthesis documents in a single session.** Agents `avi-d`, `avi-e`, `mam-d`, and `mam-e` ran concurrently on the shared SC-dev-team queue, each pulling the next unclaimed task whenever it finished its previous one. The pattern replaces the prior explicit-assignment model (coordinator dispatches tasks to named agents) with self-claiming pull semantics (agents grab the next task from a shared queue when idle). The practical effect is that variable task completion times stop bottlenecking the run — when MAM's `Rodentia Part A` compendium finished in half the time of AVI's `Passerines Part 1`, the agent that finished `Rodentia Part A` grabbed the next available synthesis task without waiting for a coordinator callback. Twelve synthesis documents landed in the same session that would have required serial dispatch under the prior pattern, and the coordination overhead that would have exceeded the parallelism benefit at higher agent counts stayed below the break-even point at four.

**Wave-based execution enforced content dependencies naturally.** Foundation (Wave 0) established the shared taxonomic schema, ecoregion definitions, and verification harness. Species compendiums (Wave 1) populated the 13 AVI and 5 MAM order-level surveys with species entries, conservation status, and ecoregion assignments. Synthesis and analysis (Wave 2) added the evolutionary-biology, ecological-networks, and cultural-knowledge modules that depend on having the species data already in hand. Cross-references (Wave 3) wired AVI to MAM, AVI to ECO, MAM to ECO, and both to CAS, COL, and GDN. Verification (Wave 4) ran the 74 tests across both collections. Browser pages landed post-wave, consuming the assembled content without modification to the rendering engine. The dependency DAG is read directly from the wave numbers — no wave begins until its predecessor completes, and circular dependencies cannot form because the schema precedes the content that uses it.

**Multi-part write strategy handled the species compendiums that exceed the output limit.** Bird taxonomy at the PNW scale produces very large compendium files — the AVI species compendiums range from 150 KB to 230 KB each, which exceeds the 32 KB single-write budget. The strategy that landed at v1.49.25 is sequential multi-part writes with careful section boundaries: each compendium is authored as 2–4 contiguous writes, with section breaks chosen at natural taxonomic boundaries (order to order, family to family) so the concatenation produces a single well-formed document. The pattern is now proven and repeatable — the same approach could scale to larger individual compendiums, and the section-boundary discipline carries over to any future content where file sizes exceed single-write limits.

**Atomic commit preserved cross-reference integrity.** All 49 AVI/MAM content files and their associated index/browser updates committed as a single unit. The PNW master index references AVI and MAM cards. The series.js navigation file adds AVI and MAM entries. The browser index.html changes respond to the added projects. The AVI cross-module synthesis links to ECO, CAS, COL, and GDN. The MAM skill-metaphors module links back into the skill-creator chipset shape. A partial commit would have left at least one reference dangling — either a card pointing at content that had not yet landed, or content referencing an index that had not yet been updated. Atomicity is the structural property that keeps every cross-reference valid at every `git checkout` step, not just at the final tip.

**Safety-critical compliance hit 17/17 across both collections.** Indigenous knowledge sections in both AVI and MAM follow OCAP (Ownership, Control, Access, Possession), CARE (Collective benefit, Authority to control, Responsibility, Ethics), and UNDRIP (United Nations Declaration on the Rights of Indigenous Peoples) frameworks. Federally listed species carry ESA (Endangered Species Act) status; cross-border species add COSEWIC (Canadian) conservation status. MAM's marine compendium carries MMPA (Marine Mammal Protection Act) compliance flags on all 38 cetacean, pinniped, and sea otter entries. AVI's migratory sections reference MBTA (Migratory Bird Treaty Act) protections for all federally protected species. The 17/17 safety-critical PASS (8/8 AVI + 9/9 MAM) is the gate that allowed the atomic commit to ship — each compliance lane is a hard block, not an advisory note, because Indigenous knowledge attribution and endangered-species status are legal and ethical obligations, not stylistic preferences.

**AVI is nearly twice the size of MAM, and the asymmetry is a taxonomic artifact.** Bird taxonomy at the PNW scale documents 250+ species in 19 research files totaling 26,302 lines and 2.1 MB; mammal taxonomy at the same scale documents 169+ species in 14 research files totaling 10,467 lines and 1.1 MB. The ratio is not a discipline or effort asymmetry — it tracks the underlying species count. Birds have more orders (the compendium is organized by order), more families per order, and more species per family in the PNW ecoregion than mammals do, largely because migratory flyways bring transient species into the PNW window that never breed there. The asymmetry is documented so future missions can size their task queues accordingly: a birds-vs-mammals split at similar geographic scale will recapitulate roughly this ratio, and an ecoregion-parallel split may balance better than a taxonomic-class split when coordinating multi-class runs.

**The Marine zone is the MAM ecoregion schema's divergence point from AVI.** AVI uses the standard seven terrestrial PNW ecoregions (Coastal Rainforest, Interior Dry Forest, Subalpine/Alpine, Willamette Valley/Puget Lowlands, Columbia Plateau Steppe, Riparian Corridors, Marine/Pelagic). MAM uses eight zones — the seven terrestrial plus a dedicated Marine zone for cetaceans, pinnipeds, and sea otters. The difference is that AVI's "Marine/Pelagic" zone covers species that fly over or forage at the ocean surface, where MAM's "Marine" zone covers species that live in the water column and intertidal habitat full-time. The schema divergence is documented in both collections' ecoregion-community chapters so downstream consumers know the ecoregion field is collection-scoped, not globally canonical, and marine-inclusive future research (a FIS fish collection, an AMP amphibian collection with salamander-brook reaches) can choose whichever schema fits the clade.

**Message-queue lag produced duplicate agent acknowledgments and taught us to acknowledge once.** When agents finished tasks quickly, stale messages in the queue triggered redundant "task complete" responses that other idle agents read and re-broadcast. The behavioral symptom was duplicate heartbeat entries in the coordination log; the operational symptom was wasted tokens on re-acknowledgments with no downstream work. The fix that landed with the AVI/MAM run is: acknowledge completion exactly once to the coordinator and do not re-broadcast to idle agents. The fix has since been documented as a sc-dev-team pattern rule so the next multi-agent run inherits it without rediscovery.

**The cross-reference matrix is approaching its current-form scaling limit at eight projects.** The PNW master index displays per-project cross-reference density — how strongly each project links to every other project — in a matrix form. At four projects (COL, CAS, ECO, GDN) the matrix fit cleanly on screen with room for annotation. At six (adding BCM, SHE in v1.49.24) it stayed readable. At eight (adding AVI, MAM here) the density is still visually tractable but approaching the edge: at ten or more, grouping (by cluster: living-systems, human-systems, infrastructure) or filtering (show only high-density links) will be needed. The scaling limit is documented here so the next PNW research landing can plan for the re-layout rather than ship into a saturated matrix.

**The release-ledger update at the tag boundary is a documentation pass, not a code pass.** The commits that actually show between `v1.49.24` and `v1.49.25` tags (`f10ef8377` merge + `c90926f66` FEATURES/RELEASE-HISTORY/README update) are three files and six insertions. The substantive AVI/MAM content (49 files, ~40K new lines) landed in the dev-branch window leading up to the tag, not as part of the tag commit itself. This is a deliberate release-cadence shape: content lands on dev as it completes, and the tag boundary is the documentation catch-up that synchronizes `docs/RELEASE-HISTORY.md`, `docs/FEATURES.md`, and the release-notes directory with what already shipped. Readers who want to see the full delta for a release should read the release-notes directory (this file and its chapters), not the tag's `git show --stat` output — the git delta is the ledger update; the release-notes directory is the narrative.

**Four parallel agents is the new sweet spot for synthesis work at this scale.** The earlier "three agents optimal" guidance from simpler doc runs (single-collection writes, shallow synthesis) underestimated the parallelism budget available for deep synthesis (multi-collection, cross-referenced, compliance-gated writes). Four agents at the AVI/MAM scale saturated the useful work without crossing the coordination-overhead break-even point. Fewer agents left capacity unused; attempting five or six would have crossed the break-even based on the queue-lag observations above. The updated guidance is: three agents for simpler doc runs, four agents for deep synthesis at the AVI/MAM content scale, and the break-even point should be rechecked against any future run that crosses a 2x scale increase over the AVI baseline.

**Research-browser architecture absorbed two new projects with zero engine changes.** The same static HTML + client-side markdown rendering pattern that shipped with COL, CAS, ECO, and GDN extended to AVI and MAM without modification to the rendering code. The series.js navigation added two entries; the index.html card layout added two cards; the ecoregion-community chapters used the existing chapter-rendering pipeline. The architecture is genuinely project-agnostic — "add a new project" is a data change, not a code change — and that property is what keeps the series' content-to-infrastructure cost ratio tilted toward content. It also means the ninth and tenth PNW projects can land with the same zero-engine-change profile, assuming their data shape stays within the existing schema.

**Cultural-knowledge sections are the highest-risk content and always need the extra review pass.** Indigenous bird knowledge in AVI and Indigenous mammal knowledge in MAM required careful OCAP/CARE/UNDRIP compliance review at every entry. Attribution paths had to be verified; knowledge-provenance claims had to trace back to named sources; permissions and consent assumptions had to be explicit. These sections took measurably longer to verify than purely scientific content. The review time is not discretionary — Indigenous knowledge attribution is a legal and ethical obligation, and "we ran out of time" is not an acceptable reason to ship a non-compliant attribution. Future missions with Indigenous-knowledge sections should budget the extra review time at the task-planning step, not at the verification step.

## Key Features

| Area | What Shipped |
|------|--------------|
| AVI — Wings of the Pacific Northwest (`www/PNW/AVI/`) | 250+ bird species across 7 ecoregions; 19 research files totaling 26,302 lines and 2.1 MB |
| AVI — taxonomic series | 6 compendiums: Anseriformes (36 waterfowl), Galliformes through Strigiformes (78 species), Piciformes/Falconiformes/Corvids (~40 species), Passerines Part 1 (~35 species), Warblers/Sparrows (~38 species), Finches/Subspecies (~25 + 7 complexes) |
| AVI — specialized compendiums | Charadriiformes (~65 shorebirds/gulls/alcids), Migratory species (~45 with flyway maps), Pelagic/Northern Winterers (~30 + phenology calendar) |
| AVI — synthesis modules | Ecoregion community profiles (55 subsections), evolutionary biology (PNW speciation + phylogenetics), ecological networks (trophic webs, pollination, seed dispersal, indicator species), cultural ornithology (Indigenous bird knowledge + TEK), cross-module synthesis linking ECO/CAS/COL/GDN |
| AVI — sources & verification | 88 sources cited (eBird, USGS Breeding Bird Survey, Audubon CBC, NatureServe, regional field guides, peer-reviewed ornithology); 38/38 verification tests passing (8/8 safety-critical) |
| MAM — Fur, Fin & Fang (`www/PNW/MAM/`) | 169+ mammal species across 8 ecoregion zones (7 terrestrial + 1 Marine); 14 research files totaling 10,467 lines and 1.1 MB |
| MAM — order-level compendiums | 4 compendiums: Carnivores & Ungulates (38 species), Rodentia Part A — Sciurids/Geomyids/Arvicolids (39 species), Rodentia Part B — Mice/Castoridae/Lagomorpha (24 species), Soricomorpha & Chiroptera (~30 species) |
| MAM — marine mammal compendium | 38 species (whales, dolphins, seals, sea lions, sea otters) with MMPA compliance flags on every entry |
| MAM — synthesis modules | Ecoregion mammal communities across 8 zones (marine habitat profiles), evolutionary biology & paleontology (Pleistocene megafauna, Beringia land bridge, post-glacial recolonization), ecological networks (predator-prey webs, keystone species, trophic cascades), cultural knowledge (Indigenous mammal knowledge + TEK + conservation partnerships), skill-metaphors synthesis mapping ecology to skill-creator architecture |
| MAM — verification | 36/36 verification tests passing (9/9 safety-critical) |
| PNW master index update | 6 → 8 projects with AVI and MAM cards added; stats refreshed to 99 research files, 7.0 MB; tag colors (AVI sky/wing blue, MAM earth/fur brown); series.js updated |
| Safety & compliance | OCAP/CARE/UNDRIP applied to all Indigenous knowledge sections; ESA verified for all federally listed species; COSEWIC status on cross-border species; MMPA compliance on MAM marine compendium; MBTA referenced in AVI migratory sections; combined 17/17 safety-critical PASS |
| Parallel-agent execution | 4 Opus agents (avi-d, avi-e, mam-d, mam-e) on self-claiming task queue produced 12 synthesis documents in a single session |
| Atomic commit & browser wiring | 49 files committed as one unit; browser pages consume assembled content with zero engine changes |
| Release-ledger pass at tag | `f10ef8377` merge + `c90926f66` update to `README.md`, `docs/FEATURES.md`, `docs/RELEASE-HISTORY.md` synchronized the published ledger with the dev-branch content landing |

## Retrospective

### What Worked

- **sc-dev-team pattern at scale.** Four parallel Opus agents (avi-d, avi-e, mam-d, mam-e) produced 12 synthesis documents in a single session. Self-claiming task queues reduced coordination overhead — agents that finished early grabbed the next available task without waiting for assignment from a coordinator.
- **Wave-based execution enforced dependencies naturally.** Foundation (Wave 0) → Species compendiums (Wave 1) → Synthesis/analysis (Wave 2) → Cross-references (Wave 3) → Verification (Wave 4) → Browser pages (post-wave). Each wave built on the previous without circular dependencies, and the wave numbering was directly readable as the dependency DAG.
- **Multi-part write strategy handled large files.** Species compendiums (150–230 KB) exceeded the 32 KB output limit, requiring 2–4 sequential writes with careful section boundaries chosen at natural taxonomic seams. The strategy is now proven and repeatable.
- **Atomic commit preserved cross-reference integrity.** All 49 files committed as a single unit. PNW index, series.js, browser pages, and inter-collection cross-references all reference each other; a partial commit would have left broken references at at least one `git checkout` step.
- **Research browser architecture scaled to 8 projects with zero engine changes.** Same static HTML + client-side markdown pattern as COL through SHE. Adding AVI and MAM was a data change (series.js + index.html cards + ecoregion chapters), not a code change.
- **Safety-critical compliance gate held the commit.** 17/17 safety-critical PASS (8/8 AVI + 9/9 MAM) across OCAP/CARE/UNDRIP, ESA, COSEWIC, MMPA, and MBTA was required for the atomic commit to ship. Compliance-as-gate (not advisory) kept Indigenous-knowledge attribution and endangered-species status honest.

### What Could Be Better

- **AVI is nearly 2x the size of MAM.** Bird taxonomy at the PNW scale (250+ species vs 169+ mammals) produces significantly more content. Future missions should size task queues for the asymmetry — either taxonomic-class splits that account for the ratio, or ecoregion-parallel splits that balance better across classes.
- **Marine mammals required special ecoregion handling.** MAM's ecoregion schema extends beyond the standard 7 terrestrial zones with a dedicated Marine zone for cetaceans, pinnipeds, and sea otters. The divergence from AVI's "Marine/Pelagic" treatment is documented but creates a schema asymmetry across collections that downstream consumers have to be aware of.
- **Message-queue lag caused duplicate agent responses.** When agents finished tasks quickly, stale queue messages triggered redundant acknowledgments. Fix: acknowledge completion exactly once and do not re-broadcast to idle agents. Now documented as a sc-dev-team pattern rule.
- **Cross-reference matrix density is approaching its readability ceiling.** At 8 projects the matrix is still tractable but close to saturation. At 10+ projects, grouping (by cluster) or filtering (high-density links only) will be needed before the next re-layout.
- **The release-ledger pass at the tag is small and can be mistaken for the whole release.** `git show --stat v1.49.25` shows 3 files and 6 insertions, which is misleading — the substantive 49-file / ~40K-line AVI/MAM content landed in the dev window leading up to the tag. Readers need to be pointed at the release-notes directory, not the tag diff.

## Lessons Learned

- **4 parallel agents is the sweet spot for synthesis work at AVI/MAM scale.** Fewer agents leave capacity unused; more agents create coordination overhead that exceeds the parallelism benefit. This confirms and refines the earlier "3 agents optimal" guidance, which applies to simpler doc runs — at deep-synthesis scale, the break-even point moves to 4 and the next rechecking boundary is a 2x scale increase.
- **Self-claiming task queues outperform explicit assignment for variable-duration work.** Agents that pull their next task from a shared queue adapt naturally to variable completion times. No coordinator bottleneck, no idle agents waiting for instructions, no named-agent assignment to invalidate when task shape shifts mid-run.
- **The PNW series has reached biological survey completeness.** With ECO (full taxonomy), AVI (birds), and MAM (mammals), the living systems of the Pacific Northwest are documented at species-level detail. The remaining vertebrate classes (reptiles, amphibians, fish) could extend the survey but are not required for the ecological-network models downstream chipsets consume.
- **Cultural knowledge sections are the highest-risk content and need explicit extra review budget.** Indigenous knowledge attribution requires careful OCAP/CARE/UNDRIP compliance review at every entry. These sections took measurably longer to verify than purely scientific content and should always be allocated extra review time at the task-planning step, not discovered at verification time.
- **Cross-reference matrices grow combinatorially and need re-layout before saturation.** At 8 projects the PNW index matrix is dense but readable. As noted in v1.49.24, grouping or filtering may be needed at 10+ projects — the re-layout needs to happen before a saturation landing, not after.
- **Multi-part writes at natural section boundaries are the correct pattern for oversize files.** 150–230 KB compendiums exceed the 32 KB single-write budget. The pattern that works is 2–4 sequential writes with boundaries chosen at taxonomic seams (order to order, family to family) so the concatenation produces a single well-formed document. This pattern generalizes beyond taxonomy to any large structured content.
- **Atomic multi-file commits are the structural guarantee that every cross-reference validates at every checkout.** Partial commits leave dangling references at intermediate `git checkout` steps. Shipping all 49 AVI/MAM files as one commit kept the PNW index, series.js, browser pages, and inter-collection cross-references consistent at every point in the history, not just at the tip.
- **Ecoregion schema is collection-scoped, not globally canonical.** AVI's "Marine/Pelagic" zone and MAM's dedicated "Marine" zone document genuinely different habitat extents (surface/aerial vs full-water-column). Future marine-inclusive collections should choose whichever schema fits the clade, and the collection should document its ecoregion scope explicitly rather than assume a series-wide convention.
- **Safety-critical compliance belongs on the commit gate, not the post-commit checklist.** 17/17 safety-critical PASS was a hard prerequisite for the atomic commit. Indigenous knowledge attribution, ESA listing verification, MMPA compliance, and MBTA references are legal and ethical obligations, not stylistic preferences — the gate position makes that status explicit in the tooling.
- **Research browser architecture is project-agnostic because content and rendering are separate concerns.** Adding AVI and MAM was purely a data change (series.js entries, index.html cards, ecoregion chapters). No change to the HTML/markdown rendering engine, no change to the navigation engine, no change to the chapter pipeline. "Add a new project" stays a data operation as long as the data fits the existing schema, and that property is what keeps the content-to-infrastructure cost ratio tilted toward content.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.24](../v1.49.24/) | Predecessor — Building Construction & Smart Home Electronics (BCM + SHE); established the dual-pack landing pattern that v1.49.25 scales from 2 collections to 2 larger collections |
| [v1.49.26](../v1.49.26/) | Successor — next PNW Research Series landing; inherits the 8-project cross-reference matrix and 4-agent self-claiming queue pattern |
| [v1.49.23](../v1.49.23/) | PNW complete collection landing (`91de95db8 feat(pnw): add complete PNW research collection and aspen muse`); precedes the dual-pack cadence |
| [v1.49.22](../v1.49.22/) | PNW Research Series master index landing; master index template AVI/MAM cards extend |
| [v1.49.21](../v1.49.21/) | Image-to-Mission pipeline; pack-shape discipline (self-contained transmission packages) parallels the AVI/MAM atomic-commit discipline |
| [v1.49.17](../v1.49.17/) | Types-first discipline — the schema-first pattern AVI/MAM apply to ecoregion and taxonomic schemas |
| [v1.49.12](../v1.49.12/) | Heritage-skills-pack pattern — pack-shape content that AVI/MAM's compendium structure mirrors |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — the scaling pattern AVI/MAM species entries inherit |
| [v1.49.9](../v1.49.9/) | "Teaching reference IS the research" pattern applied to pack content; analogous to AVI/MAM's skill-metaphors synthesis |
| [v1.49.0](../v1.49.0/) | Parent mega-release for the v1.49.x line |
| [v1.49](../v1.49/) | Consolidated mega-release notes for the v1.49 line |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — the pack-shape template AVI/MAM compendiums inherit |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop the PNW Research Series content feeds through at the Observe step |
| `www/PNW/AVI/` | Wings of the Pacific Northwest — 250+ bird species, 19 research files, 2.1 MB |
| `www/PNW/MAM/` | Fur, Fin & Fang — 169+ mammal species, 14 research files, 1.1 MB |
| `www/PNW/index.html` + `www/PNW/series.js` | PNW master index updated to 8 projects, 99 files, 7.0 MB |
| `docs/release-notes/v1.49.25/chapter/03-retrospective.md` | Retrospective chapter — What Worked / What Could Be Better captured at landing |
| `docs/release-notes/v1.49.25/chapter/04-lessons.md` | 8 lessons extracted at landing (rule-based + one LLM-tiebreaker needing review) |
| `docs/release-notes/v1.49.24/` | Immediate predecessor release notes — BCM + SHE dual-pack |
| Commit `48bb1c62d` | `feat(pnw): add AVI and MAM research compendiums with browser pages` — substantive AVI/MAM content commit in the dev-branch window |

## Engine Position

v1.49.25 is the fifth and sixth PNW Research Series landing (counting AVI and MAM as the fifth and sixth published collections after COL, CAS, ECO, GDN, BCM, SHE — eight total post-release) and the first dual-pack landing large enough to exercise the 4-agent self-claiming queue pattern. It closes the vertebrate biological survey of the Pacific Northwest at species-level detail and locks the ecological-network model inputs needed by downstream chipsets (the ECO living-systems taxonomy + AVI birds + MAM mammals together give every ecoregion both its top-down taxonomy and its specific-class species lists). In the v1.49.x line it sits between the v1.49.24 industrial/domestic pair (BCM + SHE) and the v1.49.26 next-PNW landing; in the PNW series it sits at the survey-completeness boundary where further vertebrate classes (reptiles, amphibians, fish) are optional rather than required. The release-ledger pass at the tag (3 files, 6 insertions) is small relative to the substantive AVI/MAM content commit (49 files, ~40,319 new lines) in the dev-branch window — the tag documents the release, but the content landed ahead of the tag as part of the release-cadence shape where dev accumulates content and tag commits synchronize the ledger.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| PNW Research Series projects (post-release) | 8 (COL, CAS, ECO, GDN, BCM, SHE, AVI, MAM) |
| PNW Research Series research files (post-release) | 99 |
| PNW Research Series total content (post-release) | 7.0 MB |
| AVI bird species documented | 250+ |
| AVI ecoregions | 7 |
| AVI research files | 19 |
| AVI content size | 26,302 lines / 2.1 MB |
| AVI sources cited | 88 |
| AVI verification tests | 38/38 passing (8/8 safety-critical) |
| MAM mammal species documented | 169+ |
| MAM ecoregion zones | 8 (7 terrestrial + 1 Marine) |
| MAM research files | 14 |
| MAM content size | 10,467 lines / 1.1 MB |
| MAM marine mammal species | 38 |
| MAM verification tests | 36/36 passing (9/9 safety-critical) |
| Combined safety-critical PASS | 17/17 |
| Parallel Opus agents | 4 (avi-d, avi-e, mam-d, mam-e) |
| Synthesis documents produced in session | 12 |
| Compliance frameworks applied | OCAP, CARE, UNDRIP, ESA, COSEWIC, MMPA, MBTA |
| Atomic commit file count | 49 |
| Tag-boundary ledger files | 3 (README.md, docs/FEATURES.md, docs/RELEASE-HISTORY.md) |
| Tag-boundary commits | 2 (`f10ef8377` merge, `c90926f66` update) |

## Files

- `www/PNW/AVI/` — Wings of the Pacific Northwest, 19 research files, 26,302 lines, 2.1 MB, 250+ bird species across 7 ecoregions with 88 sources cited and 38/38 verification tests passing
- `www/PNW/MAM/` — Fur, Fin & Fang, 14 research files, 10,467 lines, 1.1 MB, 169+ mammal species across 8 ecoregion zones including dedicated Marine zone with 36/36 verification tests passing
- `www/PNW/index.html` — master index updated to 8 projects, 99 files, 7.0 MB with AVI and MAM cards (sky/wing blue and earth/fur brown tag colors)
- `www/PNW/series.js` — navigation data updated with AVI and MAM entries
- `docs/release-notes/v1.49.25/README.md` — this file; narrative release notes synchronized with dev-branch content landing
- `docs/release-notes/v1.49.25/chapter/00-summary.md` — short-form summary
- `docs/release-notes/v1.49.25/chapter/03-retrospective.md` — What Worked / What Could Be Better captured at landing
- `docs/release-notes/v1.49.25/chapter/04-lessons.md` — 8 lessons extracted at landing (7 rule-based, 1 LLM-tiebreaker needing review)
- `docs/release-notes/v1.49.25/chapter/99-context.md` — parse context and neighbor links
- `docs/FEATURES.md` — updated with v1.49.24 and v1.49.25 entries
- `docs/RELEASE-HISTORY.md` — updated with v1.49.24 and v1.49.25 entries
- `README.md` — project-level README updated with current PNW series stats

Aggregate at tag boundary (v1.49.24..v1.49.25): 3 files changed, 6 insertions, 2 deletions, 2 commits. Aggregate at content boundary (AVI/MAM commit `48bb1c62d` plus associated browser and index updates): 49 files changed, ~40,319 new lines — the substantive delta landed in the dev-branch window leading up to the tag, synchronized into the published ledger by the tag-boundary commits.
