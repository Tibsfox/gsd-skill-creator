# PNW Mammalian Taxonomy — Verification Matrix

**Mission Name:** Fur, Fin & Fang of the Pacific Northwest: A Complete Mammalian Taxonomy of the Pacific Northwest
**Date Created:** 2026-03-08
**Status:** PRE-EXECUTION — All tests PENDING. No wave has run. No criterion has been measured.
**Authority:** Hemlock (quality muse, theta=0, r=0.95)
**Source Document:** `www/PNW/MAM/mission-pack/pnw-mammal-taxonomy-mission.tex`

---

## SC-12 Definition — Self-Containment Standard

A research module is **self-contained** if it satisfies all four of the following conditions:

1. **Term definition on first use.** Every technical term (taxonomic, ecological, phylogenetic, paleontological, cultural, legal) is defined the first time it appears within the module. A reader encountering the module in isolation, with no prior mammalogical knowledge, can parse every sentence. This includes acronyms: ESA, MMPA, NOAA, USFWS, WDFW, ODFW, USGS must be spelled out at first use.
2. **Scientific name on every species reference.** Every species mentioned includes its scientific name (genus species) at first occurrence within the module, and subspecies name where relevant (e.g., *Rangifer tarandus caribou*, *Orcinus orca ater*). No common name stands alone without a binomial.
3. **Cross-series citation includes file path.** Every reference to another document in the PNW Research Series includes its canonical file path (e.g., `www/PNW/AVI/research/...`, `04-salish-sea-expansion-vision.md`). A reader can locate the cited document from within this module alone.
4. **Abstract of 100–200 words.** The module opens with a prose abstract that states explicitly: (a) what species or topics the module covers, (b) what it does not cover, and (c) how it connects to adjacent modules and the companion Avian Taxonomy. The abstract is 100–200 words, counted.

This definition operationalizes SC-12 ("Document is self-contained") into four auditable sub-criteria. WARDEN and INTEG agents apply this checklist to each module deliverable before Wave 4 sign-off.

---

## Success Criteria Table

| ID | Criterion | Target Value | Measurement Method | Wave Measured | Status |
|-----|-----------|-------------|-------------------|---------------|--------|
| SC-1 | Species inventories cover all taxonomic orders in WA, OR, ID, BC | 140+ full terrestrial profiles; 35+ full marine profiles; abbreviated profiles for vagrant/extirpated species | Count species entries in Module 1, 2, and 3 outputs; verify all major mammalian orders represented (Carnivora, Artiodactyla, Rodentia, Lagomorpha, Chiroptera, Soricomorpha, Didelphimorphia, Cetacea, Pinnipedia) | Wave 4 (Verification Pass) | PENDING |
| SC-2 | Every species profile contains required fields | 8 mandatory fields present in 100% of profiles: scientific name, taxonomic order/family, morphometrics, habitat, diet, reproduction, conservation status, evolutionary note | Automated field audit across all profile documents; zero-tolerance for missing fields | Wave 4 (Verification Pass) | PENDING |
| SC-3 | Marine mammal profiles include migration, population, and legal status | 100% of marine mammal profiles include: migration route or year-round range, population trend, ESA listing status, MMPA citation where applicable | Cross-check Module 3 profiles against CF-06 and CF-07 criteria; verify MMPA jurisdictional boundary accuracy (NOAA vs. USFWS) | Wave 4 (Verification Pass) | PENDING |
| SC-4 | All eight ecoregion zones documented | 8 of 8 zones with assemblage lists, keystone engineers, and indicator species | Count zone documents in Module 4 output; verify keystone and indicator species present in each; confirm fossorial/subterranean cross-cutting community is included | Wave 2 (post-Track D) | PENDING |
| SC-5 | Evolutionary histories trace 10+ speciation/extinction/recovery events | Minimum 10 PNW-relevant events with citations; must include at least one Pleistocene megafauna item, one glacial refugia item, and one active recolonization item (wolf, grizzly, or caribou) | Count documented events in Module 5; verify categorical coverage across geological time and active recovery | Wave 3 (post-Track E) | PENDING |
| SC-6 | Ecological network analysis documents 5+ quantified interactions | Minimum 5 mammal-ecosystem engineering interactions with quantitative data citations | Count documented interactions in Module 6; verify each has a data citation; must include beaver watershed engineering, flying squirrel mycorrhizal dispersal, and orca trophic cascade as minimum three | Wave 3 | PENDING |
| SC-7 | Every Indigenous knowledge reference names a specific nation | Zero instances of generic "Indigenous peoples"; 100% nation attribution | Text search for generic phrases; count nation-specific attributions (Makah, Lummi, Nuu-chah-nulth, Coast Salish, etc.); cross-check against SC-IND | Wave 4 (Safety Check) | PENDING |
| SC-8 | Cross-links to 4+ PNW Research Series documents, explicit | Minimum 4 documents named with file paths: Avian Taxonomy, Salish Sea expansion, Heritage Skills, Ecosystem Field Guide | Audit Cross-link Index (D8); verify file paths are resolvable; verify Avian Taxonomy cross-reference is bidirectional | Wave 4 (Verification Pass) | PENDING |
| SC-9 | All numerical claims attributed to specific agencies or studies | Zero unattributed numbers; 100% of population counts, percentages, distances, measurements carry citations | Random sample audit of 20+ numerical claims; WARDEN full-pass check; special attention to Southern Resident orca census figures (73 individuals, July 2024) and grizzly timeline claims | Wave 4 (Safety Check) | PENDING |
| SC-10 | Bibliography contains 80+ sources | Minimum 80 sources; government, peer-reviewed, and professional categories all represented; NOAA Fisheries must be among government sources | Count bibliography entries; verify categorical distribution; verify MMPA-related sources include correct jurisdictional citations | Wave 4 (post-Bibliography Assembly) | PENDING |
| SC-11 | Mammal-as-skill metaphor framework maps 10+ adaptations | Minimum 10 mappings, each linking a named mammalian adaptation to a named GSD skill-creator architectural pattern | Count entries in Module 6 skill metaphor table; verify each names a GSD pattern documented in project knowledge | Wave 4 (Integration Check) | PENDING |
| SC-12 | Document is self-contained | All four SC-12 sub-criteria pass for all six modules: (1) terms defined on first use including all acronyms, (2) scientific names on every species reference including subspecies, (3) cross-series citations include file paths, (4) abstracts present and 100–200 words | INTEG agent applies SC-12 checklist to each module; WARDEN confirms no Level 2–3 cultural content | Wave 4 (Final Sign-Off) | PENDING |

---

## Test Plan Table

| ID | Test Name | Priority | Failure Mode | Pass Criteria | Wave | Status |
|-----|-----------|----------|-------------|---------------|------|--------|
| CF-01 | Terrestrial species count | Required | BLOCK | Module 1 (Carnivores + Ungulates) and Module 2 (Small Mammals + Bats) together document 140+ species with complete profiles | Wave 4 | PENDING |
| CF-02 | Marine species count | Required | BLOCK | Module 3 documents 35+ marine mammal species with population data and migration/range information | Wave 4 | PENDING |
| CF-03 | Profile completeness | Required | BLOCK | Every species profile includes all 8 mandatory fields: scientific name, taxonomic order/family, morphometrics, habitat, diet, reproduction, conservation status, evolutionary note | Wave 4 | PENDING |
| CF-04 | Ecoregion zone coverage | Required | BLOCK | All 8 ecoregion zones documented in Module 4 (alpine/subalpine, montane, foothill/oak, lowland/urban, riparian/wetland, coastal/marine, east-side steppe, fossorial/subterranean) | Wave 2 | PENDING |
| CF-05 | Keystone species | Required | BLOCK | Each ecoregion zone identifies keystone engineers and indicator species; fossorial zone identifies pocket gophers and moles in their soil-engineering role | Wave 2 | PENDING |
| CF-06 | Orca ecotype analysis | Required | BLOCK | Module 3 documents all three killer whale ecotypes: Southern Resident (*Orcinus orca ater*), Bigg's/transient (*O. o. rectipinnus*), and offshore populations; subspecies designation status from Society of Marine Mammalogy noted | Wave 2 | PENDING |
| CF-07 | Recovery species documentation | Required | BLOCK | Gray wolf, grizzly bear, woodland caribou, and Southern Resident orca all documented with: current population estimate (with year and source), ESA/recovery status, and most recent federal action | Wave 4 | PENDING |
| CF-08 | Evolutionary events | Required | BLOCK | At least 10 PNW-relevant speciation, extinction, or recolonization events documented in Module 5, with citations; must span: Pleistocene megafauna, glacial refugia effects, and active modern recovery | Wave 3 | PENDING |
| CF-09 | Ecological interactions | Required | BLOCK | At least 5 quantified mammal-ecosystem engineering interactions in Module 6, each with a data citation; minimum required: beaver watershed engineering, flying squirrel mycorrhizal dispersal, orca trophic cascade | Wave 3 | PENDING |
| CF-10 | Skill metaphor count | Required | BLOCK | At least 10 mammal-to-GSD-skill-creator mappings in Module 6 | Wave 4 | PENDING |
| CF-11 | Bibliography size | Required | BLOCK | 80+ sources with all three categories represented; government sources must include NOAA Fisheries, USFWS, USGS, WDFW, and ODFW | Wave 4 | PENDING |
| CF-12 | Cross-link count | Required | BLOCK | At least 4 explicit cross-links with file paths: Avian Taxonomy (`www/PNW/AVI/`), Salish Sea expansion (`04-salish-sea-expansion-vision.md`), Heritage Skills (`gsd-foxfire-heritage-skills-vision.md`), Ecosystem Field Guide (`gsd-ecosystem-field-guide.html`) | Wave 4 | PENDING |
| CF-13 | Endemic subspecies documentation | Required | BLOCK | PNW-endemic forms explicitly identified and documented: Olympic marmot, American shrew-mole, mountain beaver, Destruction Island shrew subspecies, Columbia Basin pygmy rabbit, Kincaid Meadow Vole, red tree vole (Oregon/Washington potential split) | Wave 4 | PENDING |
| CF-14 | Bat old-growth association | Required | BLOCK | Old-growth-dependent bat species documented with specific roost requirements (snag diameter, decay stage, height); white-nose syndrome threat noted for affected species; Washington State Bat Conservation Plan cited | Wave 4 | PENDING |
| IN-01 | Terrestrial to ecoregion mapping | Required | BLOCK | Every terrestrial species in Modules 1 and 2 mapped to at least one ecoregion zone in Module 4; no orphaned species | Wave 4 | PENDING |
| IN-02 | Marine to salmon nutrient linkage | Required | BLOCK | Orca-salmon-bear-forest nutrient pathway traceable across Modules 3, 4, and 6; population data for Southern Resident orca references salmon dependency specifically; data is identical across all module appearances | Wave 4 | PENDING |
| IN-03 | Profile to evolutionary narrative consistency | Required | BLOCK | Evolutionary notes in species profiles (Modules 1, 2, 3) are consistent with phylogenetic narratives in Module 5; no contradictory divergence timescales | Wave 4 | PENDING |
| IN-04 | Avian Taxonomy cross-reference | Required | BLOCK | Shared ecological interactions (salmon nutrient pathway, raptor-prey, orca-salmon-eagle chain) are consistent across the MAM and AVI taxonomies; species-level data (e.g., Bald Eagle salmon consumption) uses identical figures in both documents | Wave 4 | PENDING |
| IN-05 | Data consistency across modules | Required | BLOCK | Same species appearing in multiple modules uses identical population data, conservation status, and taxonomic name; Southern Resident orca count (73 as of July 2024) is uniform across all mentions | Wave 4 | PENDING |
| IN-06 | Cultural to profiles linkage | Required | BLOCK | Every mammal species referenced in Module 6 Indigenous knowledge section has a full biological profile in Module 1, 2, or 3 | Wave 4 | PENDING |
| IN-07 | Skill to architecture linkage | Required | BLOCK | Skill mappings reference actual GSD skill-creator patterns documented in project knowledge; no invented patterns | Wave 4 | PENDING |
| IN-08 | Document self-containment | Required | BLOCK | SC-12 four-part checklist passes for all six modules (see SC-12 Definition above) | Wave 4 | PENDING |
| EC-01 | Taxonomic disputes documented | Best-effort | LOG | All disputed classifications noted explicitly: killer whale ecotype species/subspecies status, red tree vole Oregon/Washington split, any proposed Sorex subspecies revisions | Wave 4 | PENDING |
| EC-02 | Extirpated species coverage | Best-effort | LOG | Historically extirpated species (woodland caribou, grizzly in OR) receive abbreviated profiles noting extirpation timeline and cause | Wave 4 | PENDING |
| EC-03 | Vagrant marine mammal coverage | Best-effort | LOG | Vagrant or unusual marine mammal records (North Pacific right whale Strait of Juan de Fuca 2013, northern elephant seal haul-outs) documented | Wave 4 | PENDING |
| EC-04 | Human-wildlife interface | Best-effort | LOG | Wolf-livestock conflict dynamics, bear-human encounters in developed interface zones, and sea lion-fishing vessel interactions documented factually without management prescription | Wave 4 | PENDING |
| EC-05 | White-nose syndrome | Best-effort | LOG | White-nose syndrome (*Pseudogymnoascus destructans*) status in PNW bat populations documented with current geographic extent and affected species | Wave 4 | PENDING |

---

## Safety-Critical Tests

All safety-critical tests are **mandatory pass** with **BLOCK** failure mode. A single failure in any SC-* test halts publication until resolved. MAM has 9 safety-critical tests — one more than AVI, adding SC-MMP for marine mammal legal accuracy.

| ID | Test Name | Verifies | Pass Criteria | Failure Action | Wave | Status |
|-----|-----------|---------|---------------|----------------|------|--------|
| SC-END | Endangered species location protection | No precise locations for ESA-listed species (grizzly bear in NCE, gray wolf pack territories, orca haul-outs, woodland caribou historical sites, pygmy rabbit colonies) | Zero GPS coordinates, den site descriptions, haul-out coordinates, or calving locations for any ESA-listed species; all locations generalized to county, watershed, or general ecosystem level | BLOCK publication; WARDEN removes offending content and re-audits full document | Wave 4 | PENDING |
| SC-NUM | Numerical attribution | Every population count, decline percentage, range measurement, or population trend attributed | Zero unattributed numerical claims; each number carries explicit citation; Southern Resident orca count (73, July 2024) cites Center for Whale Research; grizzly last confirmed sighting (1996, NCE) cites USFWS | BLOCK publication; VERIFY flags all unsourced numbers for citation or removal | Wave 4 | PENDING |
| SC-ADV | No policy advocacy | Conservation sections present evidence and status only | Zero sentences advocating for specific management positions (e.g., no advocacy for or against wolf reintroduction, grizzly bear recovery pace, dam removal as salmon recovery measure) | BLOCK publication; WARDEN rewrites offending passages to factual status statements | Wave 4 | PENDING |
| SC-END (sub) | No endangered dens/haul-outs | Extension of SC-END specific to mammal dens, calving grounds, and marine mammal haul-out sites | No den locations for wolf packs, no orca haul-out coordinates, no pinniped pupping beach coordinates for sensitive populations; harbor seal haul-outs generalized to bay or estuary level | BLOCK publication | Wave 4 | PENDING |
| SC-IND | Indigenous attribution specificity | Every Indigenous knowledge reference names a specific nation | Zero instances of generic "Indigenous peoples" or "Native Americans" without a specific nation named; 100% attributed to named nations (Makah, Lummi, Nuu-chah-nulth, Coast Salish, etc.) | BLOCK publication; CRAFT-ECO adds nation attribution to every occurrence | Wave 4 | PENDING |
| SC-CLI | Climate data sourced | Every climate-related projection cites a specific agency | Zero unsourced climate projections; pika range contraction data cites specific study; any temperature anomaly data cites NOAA or published research | BLOCK publication; VERIFY adds citations or removes claims | Wave 4 | PENDING |
| SC-SRC | Source quality | All citations traceable to authoritative sources | Zero citations to entertainment media, blogs, or unreviewed content; 100% of bibliography entries traceable to government agencies (NOAA, USFWS, USGS, WDFW, ODFW), peer-reviewed journals, university publications, or established professional organizations (Center for Whale Research, Society of Marine Mammalogy) | BLOCK publication; SCOUT audits and replaces non-authoritative sources | Wave 4 | PENDING |
| SC-CUL | Cultural sovereignty | No Level 2–3 restricted cultural knowledge | Zero restricted ceremonial content; no sacred protocols for whale hunting ceremony; no restricted spiritual significance of orca; Makah whaling documented through Ozette archaeological record and published cultural materials only | BLOCK publication; WARDEN removes any restricted content | Wave 4 | PENDING |
| SC-MMP | MMPA legal accuracy | Marine Mammal Protection Act citations are jurisdictionally accurate | NOAA Fisheries manages cetaceans and pinnipeds under MMPA; USFWS manages sea otters, walruses, and polar bears; all citations use correct agency; vessel approach distance regulations cited accurately (1,600 yards for Southern Resident orca) | BLOCK publication; CRAFT-MARINE corrects jurisdictional attributions; WARDEN re-audits | Wave 4 | PENDING |
| SC-TAX | Taxonomic authority compliance | All species names follow current accepted taxonomy | All binomial names follow current WDFW/ODFW state checklists and the Society of Marine Mammalogy taxonomy list for marine species; disputed classifications (killer whale ecotype species/subspecies debate) explicitly noted as "taxonomy under review" | BLOCK publication; VERIFY corrects all names | Wave 4 | PENDING |

*Note: SC-END appears as a combined test covering both terrestrial dens and marine haul-out sites. The sub-entry clarifies marine-specific application. Total unique safety-critical test criteria: 9.*

---

## Wave Exit Criteria

Each wave requires all listed criteria to be met before the next wave may launch. Hemlock reviews and signs off at Wave 0 exit and Wave 4 final sign-off.

### Wave 0 — Foundation

**Deliverables:** Taxonomy schema, source index, ecoregion zone definitions

**Exit criteria (all required):**
- [ ] File `www/PNW/MAM/research/taxonomy-schema.md` exists and is non-empty; schema covers all three mammal domains (terrestrial, marine, volant) with appropriate field variations
- [ ] File `www/PNW/MAM/research/source-index.md` exists and quantifies the bibliography gap: sources in-hand, sources requiring research, categorical gaps (NOAA, MMPA materials, paleontology sources, Canadian provincial sources)
- [ ] File `www/PNW/MAM/research/ecoregion-definitions.md` exists and defines all 8 ecoregion zones (including the fossorial/subterranean cross-cutting zone) using canonical EPA Level III or One Earth ecoregion IDs
- [ ] Taxonomy schema includes MMPA jurisdiction field (NOAA vs. USFWS) for marine mammals — this is unique to MAM and not in the AVI schema
- [ ] Taxonomy schema includes subspecies status field to accommodate ecotype complexity (orca) and endemic forms (Olympic marmot, mountain beaver, etc.)
- [ ] No .planning/ files touched; no secrets in any committed file
- [ ] **Hemlock signs off:** Wave 0 foundation files are internally consistent, schema covers all three mammal domains, source index is honest about the NOAA/marine mammal coverage gap, ecoregion definitions include the fossorial zone

### Wave 1 — Parallel Surveys

**Deliverables:** Module 1 (Carnivores + Ungulates), Module 2 (Small Mammals + Bats), Module 3 (Marine Mammals)

**Exit criteria (all required):**
- [ ] Track A: Module 1 documents 35+ species (carnivores and ungulates) with all 8 mandatory fields; grizzly bear, gray wolf, cougar, wolverine, and all ungulate species present; recovery status current as of 2024–2025 federal actions (CF-07)
- [ ] Track B: Module 2 documents 100+ species (rodents, lagomorphs, shrews, moles, bats); endemic PNW forms explicitly flagged (mountain beaver, American shrew-mole, Olympic marmot, Destruction Island shrew subspecies); bat old-growth associations documented (CF-13, CF-14)
- [ ] Track C: Module 3 documents 35+ marine mammal species; all three killer whale ecotypes documented; Southern Resident orca population figure cites Center for Whale Research July 2024 census; MMPA jurisdiction accurate (SC-MMP pre-check)
- [ ] All species in all three modules include scientific names with subspecies where relevant (SC-12 sub-criterion 2)
- [ ] **Hawk signs off:** Coverage review confirms terrestrial and marine species inventories are complete; no major mammalian orders missing; Columbia Basin pygmy rabbit (critically endangered) and woodland caribou (functionally extirpated) are both present

### Wave 2 — Deep Analysis

**Deliverables:** Module 4 (Ecoregion Communities), Module 5 (Evolutionary Biology + Paleontology)

**Exit criteria (all required):**
- [ ] Track D: Module 4 documents all 8 ecoregion zones; fossorial/subterranean zone included with pocket gopher soil engineering role; each zone identifies keystone engineers and indicator species (CF-04, CF-05)
- [ ] Track E: Module 5 documents minimum 10 PNW-relevant events spanning Pleistocene megafauna (mammoth, mastodon, dire wolf, short-faced bear), glacial refugia effects (Olympic marmot isolation, red tree vole divergence), and active modern recovery (wolf, grizzly, orca) (CF-08)
- [ ] No contradictory divergence timescales exist between Module 5 and species-level evolutionary notes in Modules 1, 2, and 3 (IN-03 pre-check)
- [ ] **Raven signs off:** Evolutionary biology and paleontology are internally consistent; no contradictory timescales across MAM and AVI missions; Pleistocene megafauna narrative does not overstate certainty about human causation of extinction

### Wave 3 — Ecological Networks and Culture

**Deliverables:** Module 6 (Ecological Networks + Cultural Knowledge + Skill Metaphors), Cross-Module Synthesis, Bibliography

**Exit criteria (all required):**
- [ ] Ecological networks section documents minimum 5 quantified interactions with data citations; must include beaver watershed engineering, flying squirrel truffle dispersal (with Maser 1998 citation), and orca trophic cascade with salmon dependency data (CF-09)
- [ ] Cultural knowledge section: every Indigenous knowledge reference names a specific nation; Makah whale hunting cites Ozette archaeological record; Lummi Nation orca relationship cites published cultural program materials; mountain goat wool harvesting documented without specifying restricted ceremonial details (SC-IND pre-check, SC-CUL pre-check)
- [ ] Mammal-as-skill metaphor framework contains minimum 10 mappings (CF-10)
- [ ] River's Witness citation ring: orca-salmon linkage cross-references the Salish Sea expansion document (`04-salish-sea-expansion-vision.md`) with its file path; bear-forest nutrient cycling cross-references the AVI Taxonomy ecological networks module (IN-02, SC-12 sub-criterion 3)
- [ ] GDN cross-links: Heritage Skills cross-references present with file path to `gsd-foxfire-heritage-skills-vision.md`; mountain goat wool harvesting links to Heritage Skills weaving documentation
- [ ] AVI Taxonomy cross-links: shared salmon nutrient pathway data is consistent with AVI Module 5 figures (IN-04 pre-check)
- [ ] Bibliography scaffold contains 80+ entries; NOAA Fisheries present; Center for Whale Research present; Society of Marine Mammalogy present (CF-11 pre-check)
- [ ] **Willow signs off:** Cultural content is appropriately grounded; no overreach beyond published sources; Makah whaling documentation respects cultural sovereignty
- [ ] **Foxy signs off:** Ecological network connections are accurate and the orca-salmon-bear-forest nutrient chain is coherent and traceable across both AVI and MAM taxonomies

### Wave 4 — Publication and Verification

**Deliverables:** Final assembled document, verification pass results, safety check results

**Exit criteria (all required):**
- [ ] All 9 SC-* safety-critical tests pass (SC-END, SC-NUM, SC-ADV, SC-IND, SC-CLI, SC-SRC, SC-CUL, SC-MMP, SC-TAX) — BLOCK if any fail
- [ ] All 14 CF-* core functionality tests pass (CF-01 through CF-14) — BLOCK if any fail
- [ ] All 8 IN-* integration tests pass (IN-01 through IN-08) — BLOCK if any fail
- [ ] SC-12 self-containment checklist passes for all six modules: (1) terms and acronyms defined on first use, (2) scientific names with subspecies present, (3) cross-series file paths present, (4) abstracts 100–200 words
- [ ] Cross-link index (D8) lists minimum 4 PNW Research Series documents with resolvable file paths: AVI Taxonomy, Salish Sea expansion, Heritage Skills, Ecosystem Field Guide
- [ ] AVI-MAM consistency confirmed: shared data points (salmon nutrient pathway figures, orca-salmon dependency data, Bald Eagle salmon consumption) are identical in both documents (IN-04)
- [ ] Web shell renders without errors in browser; all internal links resolve
- [ ] EC-* edge case tests logged (non-blocking); findings documented for next version
- [ ] **Hemlock signs off with PASS:** All mandatory tests pass, all safety gates clear — including the MAM-unique SC-MMP marine mammal legal accuracy gate. The standard holds.

---

## Quick Reference: Test ID Map

| Test Group | IDs | Count | Failure Mode |
|-----------|-----|-------|-------------|
| Safety-Critical | SC-END, SC-NUM, SC-ADV, SC-IND, SC-CLI, SC-SRC, SC-CUL, SC-MMP, SC-TAX | 9 | BLOCK |
| Core Functionality | CF-01 through CF-14 | 14 | BLOCK |
| Integration | IN-01 through IN-08 | 8 | BLOCK |
| Edge Cases | EC-01 through EC-05 | 5 | LOG |
| **Total** | | **36** | |

---

## AVI-MAM Calibration Note

Both missions share a common test framework (identical SC-* IDs, mirrored IN-* structure, parallel CF-* numbering). The MAM matrix adds SC-MMP and replaces AVI-specific tests (CF-06 flyway staging areas, CF-16 vagrant birds) with MAM-specific tests (CF-06 orca ecotype, CF-13 endemic subspecies, CF-14 bat old-growth). This parallel structure allows Hemlock to audit both missions against the same calibration baseline and identify drift between the two companion volumes.

Shared data consistency (IN-04 in MAM, IN-04 in AVI) is the primary calibration point. Any divergence in shared figures signals a data integrity failure requiring VERIFY intervention before either document can receive final sign-off.

---

*The standard holds. Pre-execution baseline established. Status advances to IN-PROGRESS upon Wave 0 launch.*
