# v1.49.25 — Wings of the Pacific Northwest & Fur, Fin & Fang

*Liquid eTernity edition*

**Shipped:** 2026-03-09
**Commits:** 1
**Files:** 49 changed | **New Code:** ~40,319 LOC
**Tests:** 38 (AVI verification) + 36 (MAM verification)

## Summary

Adds two companion wildlife research collections to the PNW Research Series, completing the vertebrate biological survey of the Pacific Northwest. AVI (Wings of the Pacific Northwest) documents 250+ bird species across 7 ecoregions in 19 research files totaling 2.1 MB. MAM (Fur, Fin & Fang) documents 169+ mammal species across 8 ecoregion zones in 14 research files totaling 1.1 MB. Together they represent the largest single commit in the PNW series: 3.6 MB of taxonomic, ecological, evolutionary, and cultural research. Updates the PNW master index from 6 to 8 projects with 99 total files and 7.0 MB of research content.

## Key Features

### Wings of the Pacific Northwest (`www/PNW/AVI/`)
- **250+ bird species** documented with full taxonomic entries across 13 species compendiums
- **7 ecoregions:** Coastal Rainforest, Interior Dry Forest, Subalpine/Alpine, Willamette Valley/Puget Lowlands, Columbia Plateau Steppe, Riparian Corridors, Marine/Pelagic
- **88 sources cited:** eBird, USGS Breeding Bird Survey, Audubon Christmas Bird Count, NatureServe, regional field guides, peer-reviewed ornithological literature
- **6 taxonomic series:** Anseriformes (36 waterfowl), Galliformes through Strigiformes (78 species), Piciformes/Falconiformes/Corvids (~40 species), Passerines Part 1 (~35 species), Warblers/Sparrows (~38 species), Finches/Subspecies (~25 + 7 complexes)
- **3 specialized compendiums:** Charadriiformes (~65 shorebirds/gulls/alcids), Migratory species (~45 with flyway maps), Pelagic/Northern Winterers (~30 + phenology calendar)
- **Ecoregion community profiles** with 55 subsections mapping species to habitat
- **Evolutionary biology module** covering PNW speciation events and phylogenetics
- **Ecological networks module** documenting trophic webs, pollination, seed dispersal, and indicator species
- **Cultural ornithology module** with Indigenous bird knowledge and TEK (Traditional Ecological Knowledge)
- **Cross-module synthesis** linking to ECO, CAS, COL, and GDN research
- **19 research files**, 26,302 lines, 2.1 MB
- **38/38 verification tests** passing (8/8 safety-critical)

### Fur, Fin & Fang (`www/PNW/MAM/`)
- **169+ mammal species** documented with full taxonomic entries across 5 species compendiums
- **8 ecoregion zones:** extends standard 7 zones with Marine zone for cetaceans, pinnipeds, and sea otters
- **4 order-level compendiums:** Carnivores & Ungulates (38 species), Rodentia Part A — Sciurids/Geomyids/Arvicolids (39 species), Rodentia Part B — Mice/Castoridae/Lagomorpha (24 species), Soricomorpha & Chiroptera (~30 species)
- **Marine mammal compendium** covering 38 species (whales, dolphins, seals, sea lions, sea otters) with MMPA compliance
- **Ecoregion mammal communities** across 8 zones including marine habitat profiles
- **Evolutionary biology & paleontology module** covering Pleistocene megafauna, Beringia land bridge, and post-glacial recolonization
- **Ecological networks module** documenting predator-prey webs, keystone species, and trophic cascades
- **Cultural knowledge module** with Indigenous mammal knowledge, TEK, and conservation partnerships
- **Skill metaphors synthesis** mapping ecological concepts to skill-creator architectural patterns
- **14 research files**, 10,467 lines, 1.1 MB
- **36/36 verification tests** passing (9/9 safety-critical)

### PNW Master Index Update
- **6 → 8 projects** with AVI and MAM cards added
- **Stats refreshed:** 99 research files, 7.0 MB total
- **Tag colors:** AVI (sky/wing blue), MAM (earth/fur brown)
- **series.js updated** with AVI and MAM navigation entries

### Safety & Compliance
- **OCAP/CARE/UNDRIP** frameworks applied to all Indigenous knowledge sections
- **ESA** (Endangered Species Act) listings verified for all federally listed species
- **COSEWIC** cross-border species include Canadian conservation status
- **MMPA** (Marine Mammal Protection Act) compliance in MAM marine compendium
- **MBTA** (Migratory Bird Treaty Act) protections referenced in AVI migratory sections
- **Combined safety-critical:** 17/17 PASS across both collections

## Retrospective

### What Worked
- **sc-dev-team pattern at scale.** Four parallel Opus agents (avi-d, avi-e, mam-d, mam-e) produced 12 synthesis documents in a single session. Self-claiming task queues reduced coordination overhead — agents that finished early grabbed the next available task without waiting for assignment.
- **Wave-based execution enforces dependencies naturally.** Foundation (Wave 0) → Species compendiums (Wave 1) → Synthesis/analysis (Wave 2) → Cross-references (Wave 3) → Verification (Wave 4) → Browser pages (Post-wave). Each wave builds on the previous without circular dependencies.
- **Multi-part write strategy handles large files.** Species compendiums (150-230KB) exceeded the 32K output limit, requiring 2-4 sequential write calls with careful section boundaries. The strategy is now proven and repeatable.
- **Atomic commit preserves integrity.** All 49 files committed as a single unit. The PNW index, series.js, and browser pages all reference each other — partial commits would leave broken cross-references.
- **Research browser architecture scales to 8 projects.** Zero engineering changes needed. Same static HTML + client-side markdown pattern as COL through SHE. The series.js navigation and index.html card layout accommodate new projects without modification to the rendering engine.

### What Could Be Better
- **AVI is nearly 2x the size of MAM.** Bird taxonomy at the PNW scale (250+ species vs 169+ mammals) produces significantly more content. Future missions should account for this asymmetry in task sizing and agent allocation.
- **Marine mammals required special ecoregion handling.** The MAM ecoregion definitions extend beyond the standard 7 terrestrial zones to include a Marine zone. This divergence from the AVI ecoregion schema should be documented as a pattern for future marine-inclusive research.
- **Message queue lag caused duplicate agent responses.** When agents finished tasks quickly, stale messages in the queue triggered redundant acknowledgments. Solution: acknowledge completion exactly once and don't re-broadcast to idle agents.

## Lessons Learned

1. **4 parallel agents is the sweet spot for synthesis work.** Fewer agents leave capacity unused; more agents create coordination overhead that exceeds the parallelism benefit. This confirms the pattern established in the Muse Ecosystem mission and refines the earlier "3 agents optimal" guidance, which applies to simpler doc runs.
2. **Self-claiming task queues outperform explicit assignment.** Agents that pick their next task from a shared queue adapt naturally to variable task completion times. No coordinator bottleneck, no idle agents waiting for instructions.
3. **The PNW series has reached biological survey completeness.** With ECO (full taxonomy), AVI (birds), and MAM (mammals), the living systems of the Pacific Northwest are documented at species-level detail. The remaining vertebrate classes (reptiles, amphibians, fish) could extend the survey but are not required for the ecological network models to function.
4. **Cultural knowledge sections are the highest-risk content.** Indigenous knowledge attribution requires careful OCAP/CARE/UNDRIP compliance review. These sections took longer to verify than purely scientific content and should always be allocated extra review time in future missions.
5. **Cross-reference matrices grow combinatorially.** At 8 projects, the PNW index cross-reference matrix has significant density. As noted in v1.49.24, grouping or filtering may be needed at 10+ projects.
