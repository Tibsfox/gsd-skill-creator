# PNW Avian Taxonomy — Verification Matrix

**Mission Name:** Wings of the Pacific Northwest: A Complete Avian Taxonomy of the Pacific Northwest
**Date Created:** 2026-03-08
**Status:** PRE-EXECUTION — All tests PENDING. No wave has run. No criterion has been measured.
**Authority:** Hemlock (quality muse, theta=0, r=0.95)
**Source Document:** `www/PNW/AVI/mission-pack/pnw-avian-taxonomy-mission.tex`

---

## SC-12 Definition — Self-Containment Standard

A research module is **self-contained** if it satisfies all four of the following conditions:

1. **Term definition on first use.** Every technical term (taxonomic, ecological, phylogenetic, cultural) is defined the first time it appears within the module. A reader encountering the module in isolation, with no prior ornithological knowledge, can parse every sentence.
2. **Scientific name on every species reference.** Every species mentioned includes its scientific name (genus species) at first occurrence, and subspecies name where relevant. No common name stands alone without a binomial.
3. **Cross-series citation includes file path.** Every reference to another document in the PNW Research Series includes its canonical file path (e.g., `www/PNW/COL/research/...`, `04-salish-sea-expansion-vision.md`). A reader can locate the cited document from within this module alone.
4. **Abstract of 100–200 words.** The module opens with a prose abstract that states explicitly: (a) what species or topics the module covers, (b) what it does not cover, and (c) how it connects to adjacent modules. The abstract is 100–200 words, counted.

This definition operationalizes SC-12 ("Document is self-contained") into four auditable sub-criteria. WARDEN and INTEG agents apply this checklist to each module deliverable before Wave 4 sign-off.

---

## Success Criteria Table

| ID | Criterion | Target Value | Measurement Method | Wave Measured | Status |
|-----|-----------|-------------|-------------------|---------------|--------|
| SC-1 | Species inventories cover all taxonomic orders in WA, OR, ID, BC | 400+ full profiles; 100+ abbreviated profiles for accidentals | Count species entries in Module 1 + Module 2 outputs; verify all AOS orders represented | Wave 4 (Verification Pass) | PENDING |
| SC-2 | Every species profile contains required fields | 8 mandatory fields present in 100% of profiles: scientific name, taxonomic order/family, morphometrics, habitat, diet, reproduction, conservation status, evolutionary note | Automated field audit across all profile documents; zero-tolerance for missing fields | Wave 4 (Verification Pass) | PENDING |
| SC-3 | Migratory species include flyway data | 100% of migratory species profiles include: flyway route, spring arrival window, fall departure window, and at least one PNW staging area with citation | Cross-check Module 2 profiles against CF-06 and CF-07 criteria; count staging area entries | Wave 4 (Verification Pass) | PENDING |
| SC-4 | All seven ecoregion zones documented | 7 of 7 zones with assemblage lists, indicator species, and keystone species | Count zone documents in Module 3 output; verify indicator + keystone species present in each | Wave 2 (post-Track C) | PENDING |
| SC-5 | Evolutionary histories trace 15+ speciation/radiation events | Minimum 15 PNW-relevant events with phylogenetic citations | Count documented events in Module 4; verify each has a peer-reviewed citation | Wave 3 (post-Track D) | PENDING |
| SC-6 | Ecological network analysis documents 5+ quantified interactions | Minimum 5 bird-ecosystem interactions with quantitative data citations | Count documented interactions in Module 5; verify each has a data citation | Wave 3 (post-Track E) | PENDING |
| SC-7 | Every Indigenous knowledge reference names a specific nation | Zero instances of generic "Indigenous peoples"; 100% nation attribution | Text search for generic phrases; count nation-specific attributions; cross-check against SC-IND | Wave 4 (Safety Check) | PENDING |
| SC-8 | Cross-links to 3+ PNW Research Series documents, bidirectional | Minimum 3 documents named with file paths in cross-link index; bidirectionality confirmed | Audit Cross-link Index (D8); verify file paths are resolvable; check receiving documents for reciprocal links | Wave 4 (Verification Pass) | PENDING |
| SC-9 | All numerical claims attributed to specific agencies or studies | Zero unattributed numbers; 100% of population counts, percentages, distances, measurements carry citations | Random sample audit of 20+ numerical claims; WARDEN full-pass check | Wave 4 (Safety Check) | PENDING |
| SC-10 | Bibliography contains 80+ sources | Minimum 80 sources; government, peer-reviewed, and professional categories all represented | Count bibliography entries; verify categorical distribution (government agencies, peer-reviewed journals, professional organizations) | Wave 4 (post-Bibliography Assembly) | PENDING |
| SC-11 | Bird-as-skill metaphor framework maps 10+ avian adaptations | Minimum 10 mappings, each linking a named avian adaptation to a named GSD skill-creator pattern | Count entries in Module 6 skill metaphor table; verify each names a GSD pattern documented in project knowledge | Wave 4 (Integration Check) | PENDING |
| SC-12 | Document is self-contained | All four SC-12 sub-criteria pass for all six modules: (1) terms defined on first use, (2) scientific names on every species reference, (3) cross-series citations include file paths, (4) abstracts present and 100–200 words | INTEG agent applies SC-12 checklist to each module; WARDEN confirms no Level 2–3 cultural content | Wave 4 (Final Sign-Off) | PENDING |

---

## Test Plan Table

| ID | Test Name | Priority | Failure Mode | Pass Criteria | Wave | Status |
|-----|-----------|----------|-------------|---------------|------|--------|
| CF-01 | Resident species count | Required | BLOCK | Module 1 contains 180+ species with complete profiles organized by taxonomic order | Wave 4 | PENDING |
| CF-02 | Migratory species count | Required | BLOCK | Module 2 contains 200+ species with seasonal profiles and flyway data | Wave 4 | PENDING |
| CF-03 | Profile completeness | Required | BLOCK | Every species profile includes all 8 mandatory fields: scientific name, taxonomic order/family, morphometrics, habitat, diet, reproduction, conservation status, evolutionary note | Wave 4 | PENDING |
| CF-04 | Ecoregion zone coverage | Required | BLOCK | All 7 ecoregion zones have documented bird community assemblages | Wave 2 | PENDING |
| CF-05 | Indicator species | Required | BLOCK | Each ecoregion zone identifies at least one indicator species and at least one keystone species | Wave 2 | PENDING |
| CF-06 | Flyway staging areas | Required | BLOCK | At least 6 PNW staging areas documented with species lists and citations (Grays Harbor, Malheur, Klamath Basin, Boundary Bay, Skagit Delta, Willapa Bay minimum) | Wave 4 | PENDING |
| CF-07 | Migration timing | Required | BLOCK | Migratory species include spring/fall arrival and departure windows expressed as calendar periods | Wave 4 | PENDING |
| CF-08 | Evolutionary events | Required | BLOCK | At least 15 PNW-relevant speciation or adaptive radiation events documented in Module 4 | Wave 3 | PENDING |
| CF-09 | Phylogenetic citations | Required | BLOCK | Each evolutionary narrative cites at least one peer-reviewed systematic research paper | Wave 3 | PENDING |
| CF-10 | Ecological interactions | Required | BLOCK | At least 5 quantified bird-ecosystem interactions documented in Module 5, each with a data citation | Wave 3 | PENDING |
| CF-11 | Nutrient cycling | Required | BLOCK | Salmon-bird nutrient pathway traced with isotopic data citations; minimum species documented: Bald Eagle, Osprey, Great Blue Heron, Belted Kingfisher, American Dipper, plus corvids | Wave 3 | PENDING |
| CF-12 | Skill metaphor count | Required | BLOCK | At least 10 bird-to-GSD-skill-creator mappings in Module 6 | Wave 4 | PENDING |
| CF-13 | Bibliography size | Required | BLOCK | 80+ sources with all three categories represented: government agencies, peer-reviewed journals, professional organizations | Wave 4 | PENDING |
| CF-14 | Cross-link count | Required | BLOCK | At least 3 explicit cross-links to PNW Research Series documents, with file paths | Wave 4 | PENDING |
| CF-15 | Subspecies coverage | Required | BLOCK | Major subspecies complexes documented: Song Sparrow (PNW forms), Northern Flicker (Red-shafted/Yellow-shafted intergrade), Fox Sparrow, Townsend's x Hermit Warbler hybrid zone | Wave 4 | PENDING |
| CF-16 | Vagrant/accidental abbreviated profiles | Required | BLOCK | Abbreviated profiles for 100+ accidental/vagrant species | Wave 4 | PENDING |
| IN-01 | Resident to ecoregion mapping | Required | BLOCK | Every resident species in Module 1 mapped to at least one ecoregion zone in Module 3; no orphaned species | Wave 4 | PENDING |
| IN-02 | Migrant to staging area linkage | Required | BLOCK | Every shorebird and waterfowl species in Module 2 linked to at least one documented staging area | Wave 4 | PENDING |
| IN-03 | Profile evolution consistency | Required | BLOCK | Evolutionary notes in species profiles (Module 1/2) are consistent with the phylogenetic narratives in Module 4; no contradictory divergence timescales | Wave 4 | PENDING |
| IN-04 | Ecology to salmon linkage | Required | BLOCK | Salmon-bird species (Bald Eagle, Osprey, Great Blue Heron, American Dipper, Belted Kingfisher) appear consistently across Module 2/5 and Salish Sea cross-links; data is identical across all appearances | Wave 4 | PENDING |
| IN-05 | Species data consistency | Required | BLOCK | Same species appearing in multiple modules uses identical population data, conservation status, and taxonomic name | Wave 4 | PENDING |
| IN-06 | Cultural to profiles linkage | Required | BLOCK | Every bird species referenced in Module 6 Indigenous knowledge section has a full biological profile in Module 1 or Module 2 | Wave 4 | PENDING |
| IN-07 | Skill to architecture linkage | Required | BLOCK | Bird-as-skill mappings reference actual GSD skill-creator patterns documented in project knowledge; no invented patterns | Wave 4 | PENDING |
| IN-08 | Document self-containment | Required | BLOCK | SC-12 four-part checklist passes for all six modules (see SC-12 Definition above) | Wave 4 | PENDING |
| EC-01 | Vagrant species taxonomic currency | Best-effort | LOG | Vagrant/accidental species use current AOS-approved names; any deprecated synonyms noted | Wave 4 | PENDING |
| EC-02 | Subspecies taxonomic disputes | Best-effort | LOG | All disputed species/subspecies designations (e.g., Canada Jay vs. Gray Jay, Flicker complex) explicitly note the dispute rather than silently adopting one position | Wave 4 | PENDING |
| EC-03 | Climate migration timing mismatch | Best-effort | LOG | Phenological shift data (timing mismatches between migrant arrival and food availability) documented where peer-reviewed evidence exists | Wave 4 | PENDING |
| EC-04 | Hybrid zone documentation | Best-effort | LOG | Known PNW hybrid zones (Townsend's x Hermit Warbler, Flicker intergrade, Glaucous-winged x Western Gull) documented with geographic extent | Wave 4 | PENDING |
| EC-05 | eBird data citation | Best-effort | LOG | Where eBird citizen science data is cited, the platform version and access date are included | Wave 4 | PENDING |
| EC-06 | Pelagic species coverage | Best-effort | LOG | Pelagic species not visible from shore (storm-petrels, shearwaters, albatrosses) receive at minimum abbreviated profiles | Wave 4 | PENDING |

---

## Safety-Critical Tests

All safety-critical tests are **mandatory pass** with **BLOCK** failure mode. A single failure in any SC-* test halts publication until resolved.

| ID | Test Name | Verifies | Pass Criteria | Failure Action | Wave | Status |
|-----|-----------|---------|---------------|----------------|------|--------|
| SC-END | Endangered species location protection | No precise locations for ESA-listed species (Northern Spotted Owl, Marbled Murrelet, Greater Sage-Grouse lek sites, etc.) | Zero GPS coordinates, specific nest site descriptions, or lek locations for any ESA-listed species; all locations generalized to county or watershed level | BLOCK publication; WARDEN removes offending content and re-audits | Wave 4 | PENDING |
| SC-NUM | Numerical attribution | Every population count, decline percentage, range measurement, or migration distance is attributed | Zero unattributed numerical claims; each number carries an explicit citation to a specific agency, study, or professional organization | BLOCK publication; VERIFY flags all unsourced numbers for citation or removal | Wave 4 | PENDING |
| SC-ADV | No policy advocacy | Conservation sections present evidence and status only | Zero sentences advocating for specific legislative positions, regulatory frameworks, or management prescriptions | BLOCK publication; WARDEN rewrites offending passages to factual statement of status | Wave 4 | PENDING |
| SC-TAX | Taxonomic authority compliance | All species names and classifications follow AOS Check-list of North and Middle American Birds, 7th ed. through 62nd Supplement | Zero non-AOS-compliant primary species names; disputed classifications noted with explicit "taxonomy disputed" flag | BLOCK publication; VERIFY corrects all names to AOS standard | Wave 4 | PENDING |
| SC-IND | Indigenous attribution specificity | Every Indigenous knowledge reference names a specific nation | Zero instances of the phrase "Indigenous peoples" or equivalent generics without a specific nation named; 100% of Indigenous knowledge attributed to named nations (Coast Salish, Makah, Kwakwaka'wakw, Nuu-chah-nulth, etc.) | BLOCK publication; CRAFT-CULTURE adds nation attribution to every occurrence | Wave 4 | PENDING |
| SC-CLI | Climate data sourced | Every climate-related projection cites a specific agency or IPCC scenario | Zero unsourced climate projections; every temperature trend, phenological shift, or sea-level figure cites NOAA, EPA, or IPCC scenario by name | BLOCK publication; VERIFY adds citations or removes claims | Wave 4 | PENDING |
| SC-SRC | Source quality | All citations traceable to authoritative sources | Zero citations to entertainment media, blogs, unreviewed websites, or unsourced claims; 100% of bibliography entries traceable to government agencies, peer-reviewed journals, university publications, or established professional organizations | BLOCK publication; SCOUT audits and replaces non-authoritative sources | Wave 4 | PENDING |
| SC-CUL | Cultural sovereignty | No Level 2–3 restricted cultural knowledge | Zero restricted or sacred cultural content; all cultural references from published, publicly available (Level 1) sources only; no ceremonial protocols, restricted songs, or sacred geographical knowledge | BLOCK publication; WARDEN removes any restricted content | Wave 4 | PENDING |

---

## Wave Exit Criteria

Each wave requires all listed criteria to be met before the next wave may launch. Hemlock reviews and signs off at Wave 0 exit and Wave 4 final sign-off.

### Wave 0 — Foundation

**Deliverables:** Taxonomy schema, source index, ecoregion zone definitions

**Exit criteria (all required):**
- [ ] File `www/PNW/AVI/research/taxonomy-schema.md` exists and is non-empty
- [ ] File `www/PNW/AVI/research/source-index.md` exists and quantifies the bibliography gap: how many sources from the mission pack are already in-hand, how many require additional research, and which categories (government, peer-reviewed, professional) are under-represented
- [ ] File `www/PNW/AVI/research/ecoregion-definitions.md` exists and defines all 7 ecoregion zones using canonical EPA Level III or One Earth ecoregion IDs (not invented names)
- [ ] Taxonomy schema follows AOS Check-list order format and includes field definitions for all 8 required profile fields (SC-2)
- [ ] No .planning/ files touched; no secrets in any committed file
- [ ] **Hemlock signs off:** Wave 0 foundation files are internally consistent, schema is complete, source index is honest about gaps

### Wave 1 — Parallel Surveys

**Deliverables:** Module 1 (Resident Profiles), Module 2 (Migratory Profiles), Module 3 (Ecoregion Communities)

**Exit criteria (all required):**
- [ ] Track A: Module 1 resident profiles document minimum 180 species with all 8 mandatory fields present (CF-01, CF-03)
- [ ] Track B: Module 2 migratory profiles document minimum 200 species with flyway data, timing windows, and staging area citations (CF-02, CF-06, CF-07)
- [ ] Track C: Module 3 documents all 7 ecoregion zones with assemblage lists; each zone identifies indicator and keystone species (CF-04, CF-05)
- [ ] All species in Module 1 and Module 2 include scientific names at first occurrence (SC-12 sub-criterion 2)
- [ ] **Hawk signs off:** Coverage review confirms species inventories are complete for resident and migratory guilds, no major taxonomic orders missing

### Wave 2 — Deep Analysis

**Deliverables:** Module 4 (Evolutionary Biology), Module 5 (Ecological Networks)

**Exit criteria (all required):**
- [ ] Track D: Module 4 documents minimum 15 PNW-relevant speciation or adaptive radiation events, each with a peer-reviewed citation (CF-08, CF-09)
- [ ] Track E: Module 5 documents minimum 5 quantified bird-ecosystem interactions, each with a data citation; salmon-bird nutrient pathway documented with isotopic data citations (CF-10, CF-11)
- [ ] No contradictory divergence timescales exist between Module 4 and species-level evolutionary notes in Module 1/2 (IN-03 pre-check)
- [ ] **Raven signs off:** Evolutionary biology documents contain no contradictory timescales; phylogenetic narratives are internally consistent across all PNW missions (AVI + MAM + ECO)

### Wave 3 — Cultural and Synthesis

**Deliverables:** Module 6 (Cultural Ornithology + Skill Metaphors), Cross-Module Synthesis, Bibliography

**Exit criteria (all required):**
- [ ] Module 6 cultural ornithology section: every Indigenous knowledge reference names a specific nation; zero generic attributions (SC-IND pre-check)
- [ ] Module 6 cultural sovereignty: all cultural content verifiably from Level 1 (published, publicly available) sources (SC-CUL pre-check)
- [ ] Module 6 skill metaphor framework contains minimum 10 mappings, each linking a named avian adaptation to a named GSD skill-creator architectural pattern (CF-12)
- [ ] River's Witness citation ring: Salish Sea cross-links (salmon, reef net fishing, Coast Salish bird knowledge) are present in Module 5 and Module 6 and reference the `04-salish-sea-expansion-vision.md` document with its file path (IN-04, SC-12 sub-criterion 3)
- [ ] GDN cross-links: Heritage Skills curriculum cross-references present in Module 6 with file paths to `gsd-foxfire-heritage-skills-vision.md`
- [ ] Bibliography scaffold contains 80+ entries covering all three source categories (CF-13 pre-check)
- [ ] **Willow signs off:** Cultural content is appropriately grounded in the landscape and does not overreach beyond published sources
- [ ] **Foxy signs off:** Ecological network connections are accurate and the broader PNW Research Series cross-links are coherent

### Wave 4 — Publication and Verification

**Deliverables:** Final assembled document, verification pass results, safety check results

**Exit criteria (all required):**
- [ ] All 8 SC-* safety-critical tests pass (SC-END, SC-NUM, SC-ADV, SC-TAX, SC-IND, SC-CLI, SC-SRC, SC-CUL) — BLOCK if any fail
- [ ] All 16 CF-* core functionality tests pass (CF-01 through CF-16) — BLOCK if any fail
- [ ] All 8 IN-* integration tests pass (IN-01 through IN-08) — BLOCK if any fail
- [ ] SC-12 self-containment checklist passes for all six modules: (1) terms defined on first use, (2) scientific names present, (3) cross-series file paths present, (4) abstracts 100–200 words
- [ ] Cross-link index (D8) lists minimum 3 PNW Research Series documents with resolvable file paths
- [ ] Web shell renders without errors in browser; all internal links resolve
- [ ] EC-* edge case tests logged (non-blocking); findings documented for next version
- [ ] **Hemlock signs off with PASS:** All mandatory tests pass, all safety gates clear, the standard holds

---

## Quick Reference: Test ID Map

| Test Group | IDs | Count | Failure Mode |
|-----------|-----|-------|-------------|
| Safety-Critical | SC-END, SC-NUM, SC-ADV, SC-TAX, SC-IND, SC-CLI, SC-SRC, SC-CUL | 8 | BLOCK |
| Core Functionality | CF-01 through CF-16 | 16 | BLOCK |
| Integration | IN-01 through IN-08 | 8 | BLOCK |
| Edge Cases | EC-01 through EC-06 | 6 | LOG |
| **Total** | | **38** | |

---

*The standard holds. Pre-execution baseline established. Status advances to IN-PROGRESS upon Wave 0 launch.*
