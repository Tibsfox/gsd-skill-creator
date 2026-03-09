# PNW Research Series -- Source Budget Template

> **Purpose:** Category-level source targets for Wave 0 source index agents. Ensures every research domain meets minimum source counts per category before Wave 1 begins.
>
> **Design principle:** An agent reading this template for the first time should know exactly how many sources to find, in which categories, and what to do when a category falls short. Simple instruments solve real problems.

---

## 1. Source Budget Table

Every source index must hit both the aggregate target (80+ sources) and the per-category minimums. The category codes (GOV, PRI, PRO, CUL) are used in gap protocol reporting.

### Default Budget (adapt per domain -- see Section 6)

| Code | Category | Minimum | Target | Priority Source Types |
|------|----------|---------|--------|----------------------|
| GOV  | Government & Agency | 20 | 25+ | Federal agencies (USFWS, NOAA, USGS, USFS), state wildlife agencies (WDFW, ODFW, IDFG), National Park Service, provincial agencies (BC MOE, ECCC). Recovery plans, stock assessments, technical reports, species inventories, management plans. |
| PRI  | Peer-Reviewed Research | 18 | 22+ | Journal articles, university press monographs, edited volumes, dissertations (published). Must carry peer review or editorial board review. Conference proceedings acceptable if published in indexed venue. |
| PRO  | Professional Organizations | 18 | 26+ | Ornithological/mammalogical societies, conservation organizations with field programs, museums with reference collections, citizen science platforms (eBird, iNaturalist), professional field guides, NatureServe, working groups. |
| CUL  | Ethnographic & Cultural | 8 | 12+ | Published ethnographies (university press), Nation-authorized cultural resources, tribal cultural center public materials, museum collections (Burke, Makah Cultural Center), archaeological reports. Only Level 1 (publicly available) knowledge. |
| **TOTAL** | **All categories** | **64** | **85+** | |

### Rules

1. **Minimums are hard floors.** If any category is below its minimum at Wave 0 exit, the source agent is re-queued (see Section 4).
2. **Targets are soft ceilings.** Exceeding a target is acceptable and often desirable. Surplus in one category does not compensate for a deficit in another.
3. **De-duplication:** A source appears once in the index. If it spans categories (e.g., a USFS peer-reviewed tech report), assign it to the category that best describes its authority type. Government tech reports with peer review go under GOV. University press ethnographies go under CUL.
4. **Cross-module coverage:** Each source must list the modules it supports. No module should depend on fewer than 8 unique sources.

---

## 2. Source Quality Tiers

Four tiers of source quality. Higher tiers carry more evidentiary weight. Safety-critical claims have mandatory tier requirements.

| Tier | Name | Description | Examples | Usage Rules |
|------|------|-------------|----------|-------------|
| T1 | **Primary Authority** | Government agencies with regulatory or monitoring authority. Peer-reviewed research in indexed journals. | USFWS recovery plans, NOAA stock assessments, USGS monitoring data, ESA Federal Register notices, journal articles in *Conservation Biology*, *Journal of Mammalogy*, *The Auk* | **Required** for all quantitative claims (population counts, decline percentages, range measurements). **Required** for all safety-critical claims (ESA status, MMPA designations, conservation status). Only acceptable source for official regulatory designations. |
| T2 | **Professional Synthesis** | Professional organizations with systematic data collection, long-term monitoring programs, or taxonomic authority. | Cornell Lab eBird, NatureServe G/S ranks, Center for Whale Research census, AOS Check-list, Partners in Flight population estimates, museum reference collections | Acceptable for distribution data, occurrence records, taxonomic nomenclature, and conservation assessments. Some T2 sources function as T1 for specific domains (e.g., Center for Whale Research 47-year census has no government equivalent). Note such exceptions explicitly in the source index. |
| T3 | **Professional Reference** | Field guides, conservation organization reports, zoo/aquarium breeding program data, citizen science summaries, regional assessments. | Timber Press field guides, Conservation Northwest reports, wildlife park breeding records, Nature Conservancy ecoregional assessments | Supporting context only. Never sole source for quantitative claims. Useful for habitat descriptions, conservation program summaries, and educational context. Multiple T3 sources can corroborate a claim but cannot substitute for a T1 source on safety-critical data. |
| T4 | **Cultural & Ethnographic** | Published ethnographies, Nation-authorized cultural materials, archaeological reports. | University press ethnographies (Suttles, Hunn), tribal cultural center public materials, museum ethnographic collections | **Required** for all cultural and Indigenous knowledge claims. Must name specific nation -- never generalize across nations. Only Level 1 (publicly available, published) knowledge is included. Sacred or restricted knowledge (Level 2-3) is never included. A T4 source is primary authority within its domain (cultural knowledge) even though it is not interchangeable with T1 for quantitative ecology claims. |

### Tier Requirements for Safety-Critical Claims

| Claim Type | Minimum Tier | Examples |
|------------|-------------|----------|
| ESA/MMPA listing status | T1 only | "Listed as Threatened under ESA" requires USFWS Federal Register or recovery plan |
| Population count or trend | T1 only | "Population declined 25% since 2010" requires government survey or peer-reviewed study |
| Species range boundary | T1 or T2 | "Breeds west of the Cascades" requires government inventory or eBird/AOS data |
| Conservation status rank | T1 or T2 | "G1/S1" requires NatureServe or equivalent state heritage program |
| Indigenous knowledge claim | T4 only | "Coast Salish weavers used mountain goat wool" requires Nation-specific published source |
| Ecological relationship | T1 or T2 | "Mycorrhizal dispersal by voles" requires peer-reviewed study |
| Taxonomic nomenclature | T1 or T2 | Species name and classification requires AOS, ASM, or equivalent authority |
| Habitat description | T1, T2, or T3 | General habitat characterization can use professional references |
| Historical anecdote | T1, T2, T3, or T4 | Context-setting material, but quantitative claims within it still need T1 |

### Excluded Source Types

The following are never acceptable in a PNW research source index:

- Entertainment media, popular blogs, social media posts
- Unsourced web pages without identifiable authorship
- Unpublished data or personal communications (unless from recognized authority with documented permission)
- AI-generated content presented as primary research
- Secondary interpretations of Indigenous knowledge that bypass Nation authorization
- Advocacy position papers without underlying data citations

---

## 3. Gap Protocol

When a source index agent completes its pass and any category falls below its minimum, the agent must execute the following gap protocol before submitting the source index.

### Step 1: Document the Gap

Add a "Gap Analysis" section to the source index with this table:

```markdown
## Gap Analysis

| Code | Category | Minimum | Achieved | Gap | Status |
|------|----------|---------|----------|-----|--------|
| GOV  | Government & Agency | 20 | ?? | ?? | MET / GAP |
| PRI  | Peer-Reviewed | 18 | ?? | ?? | MET / GAP |
| PRO  | Professional Orgs | 18 | ?? | ?? | MET / GAP |
| CUL  | Cultural | 8 | ?? | ?? | MET / GAP |
| ALL  | Total | 64 | ?? | ?? | MET / GAP |
```

### Step 2: Name Specific Topics Needed

For each category marked GAP, list specific topics or source types that would close the gap. Be concrete. Do not write "need more government sources" -- write "need WDFW bat monitoring reports, ODFW cougar management plan, NPS Olympic mammal inventory."

Example gap entry:

```markdown
### GOV Gap: 3 sources needed

- [ ] WDFW bat population monitoring reports (2023-2025) -- fills M2 bat coverage
- [ ] NPS Mount Rainier mammal inventory -- fills M4 subalpine zone
- [ ] USGS white-nose syndrome 2024-2025 surveillance bulletin -- fills M2 disease ecology
```

### Step 3: Mark for Wave 2 Enrichment

If the agent cannot close the gap within its current execution window (Wave 0), it must:

1. Mark the gap as `DEFERRED-W2` in the gap analysis table.
2. Add a `### Sources Still Needed` section listing the deferred items.
3. Include enough detail that a Wave 2 agent can pick up the search without re-reading the entire domain.

### Step 4: Notify Orchestrator

The source index agent's output must include a structured gap report at the end:

```
SOURCE_BUDGET_REPORT:
  GOV: 22/20 MET
  PRI: 15/18 GAP (-3)
  PRO: 19/18 MET
  CUL: 6/8 GAP (-2)
  TOTAL: 62/64 GAP (-2)
  ACTION: RE-QUEUE for PRI (paleontological, climate modeling) and CUL (Yakama, Nez Perce)
```

---

## 4. Wave 0 Exit Check

The orchestrator runs this check after the source index agent completes and before launching any Wave 1 agents. This is a gate -- Wave 1 does not start until the source budget is satisfied or explicitly waived.

### Exit Check Procedure

```
FOR each category IN [GOV, PRI, PRO, CUL]:
  IF category.achieved < category.minimum:
    RE-QUEUE source agent with specific instructions:
      - "Add {gap_count} more {category_name} sources"
      - "Focus on: {specific_topics_from_gap_protocol}"
      - "Do not duplicate existing sources"
    WAIT for re-queued agent to complete
    RE-RUN exit check

IF total.achieved < 64:
  EVEN IF all categories meet minimums individually:
    RE-QUEUE source agent with instruction to expand strongest category

IF all categories MET AND total >= 64:
  PASS -- proceed to Wave 1
```

### Waiver Conditions

The orchestrator may waive a category minimum only if:

1. The domain genuinely has fewer than the minimum number of authoritative sources in that category (e.g., a marine invertebrate taxonomy may have very few cultural sources).
2. The waiver is documented in the source index with an explanation.
3. The waiver does not apply to GOV or PRI minimums for any domain that includes ESA-listed species.

### Re-Queue Instructions Template

When re-queuing the source agent, the orchestrator sends:

```
SOURCE INDEX RE-QUEUE:
  Domain: {domain_name}
  Category gaps:
    {CODE}: need {N} more. Topics: {specific_topics}
  Existing source count: {current_total}
  Target: {target_total}
  Constraint: Do not duplicate IDs already in the index.
  Priority: {HIGH | MEDIUM} based on gap size
```

---

## 5. AVI vs MAM Comparison

This table shows actual achieved source counts from the AVI (avian) and MAM (mammalian) missions, demonstrating why category-level targets produce better results than aggregate-only targets.

### AVI Mission (category-level targets in prompt)

The AVI source index agent received specific category targets: 25 government, 22 peer-reviewed, 26 professional, 12 cultural. It met or exceeded all four.

| Code | Category | Target | Achieved | Status |
|------|----------|--------|----------|--------|
| GOV  | Government & Agency | 25 | 25 | MET (G-01 to G-25) |
| PRI  | Peer-Reviewed | 22 | 22 | MET (P-01 to P-22) |
| PRO  | Professional Organizations | 26 | 26 | MET (O-01 to O-26) |
| CUL  | Cultural & Ethnographic | 12 | 12 | MET (C-01 to C-12) |
| **ALL** | **Total** | **85** | **85** | **MET** |

### MAM Mission (aggregate-only target: "80+ sources")

The MAM source index agent received only an aggregate target of "80+ sources" without category breakdown. It produced 72 unique sources -- below target -- with an unbalanced distribution.

| Code | Category | Budget Min | Achieved | Status |
|------|----------|-----------|----------|--------|
| GOV  | Government & Agency | 20 | 39 | OVER (+19) |
| PRI  | Peer-Reviewed | 18 | 37 | OVER (+19) |
| PRO  | Professional & Cultural (combined) | 26 | 33 | -- |
| CUL  | Cultural (not separated) | 8 | (embedded in PRO) | NOT TRACKED |
| **ALL** | **Total** | **80** | **72** | **GAP (-8)** |

### Root Cause Analysis

1. **No category minimums:** The MAM agent had no per-category floor. It over-invested in government and peer-reviewed sources (39 and 37 respectively) because those are the easiest to find systematically.

2. **Merged professional and cultural categories:** MAM combined professional organizations and cultural sources into a single "Professional Organizations & Cultural Sources" table (O01 to O33). This obscured the cultural source count. Of the 33 entries, approximately 10 are cultural (O06-O08, O19-O23, O27-O28) and 23 are professional organizations. Neither sub-count was tracked against a target.

3. **Surplus did not compensate for deficit:** MAM's government count (39) was nearly double the template minimum (20), but that surplus could not close the aggregate gap because the agent stopped searching other categories once it had "enough" sources in total -- except it miscounted and landed at 72, not 80.

4. **No gap protocol:** Without category-level tracking, the MAM agent's own gap analysis (lines 157-178 in its source index) identified the shortfall but could only describe it as "8+ sources needed" without knowing which categories were structurally thin.

### The Fix

Category-level targets give the source index agent a checklist to work against. When the agent finishes the government section at 25 and the peer-reviewed section at 22, it knows it still needs to find 26 professional and 12 cultural sources. Without those targets, the agent's search behavior front-loads the easiest category and tapers off.

---

## 6. Domain Adaptation Examples

The default budget table (Section 1) is designed for vertebrate taxonomy domains with significant Indigenous cultural connections. Different domains require adjustments. Below are two examples showing how to adapt the template.

### Example A: Fungi Taxonomy

A PNW fungi/microbiome domain emphasizes mycological society publications and reduces cultural source expectations (fewer published ethnomycological works exist for PNW nations compared to ethnobotany or ethnoornithology).

| Code | Category | Minimum | Target | Adaptation Notes |
|------|----------|---------|--------|-----------------|
| GOV  | Government & Agency | 15 | 20+ | USFS fungal surveys, BLM old-growth monitoring, USGS soil microbiome projects, state forest health programs. Fewer federal recovery plans (most fungi are not ESA-listed). |
| PRI  | Peer-Reviewed Research | 22 | 28+ | **Increased.** Mycology is publication-heavy. Journals: *Mycologia*, *Fungal Ecology*, *Mycorrhiza*, *Forest Ecology and Management*. University press monographs (Arora, Stamets, Castellano). |
| PRO  | Professional Organizations | 20 | 25+ | Mycological societies (PSMS, OMS, NAMA), iNaturalist fungal records, Pacific Northwest Key Council, regional forays and checklists, herbarium collections (OSU, UW, UBC). |
| CUL  | Cultural & Ethnographic | 4 | 6+ | **Reduced.** Published ethnomycology for PNW nations is sparse. Focus on fire-management knowledge affecting fungal habitat, published traditional food/medicine use of fungi. Must still name specific nations. |
| **TOTAL** | | **61** | **79+** | Aggregate target slightly lower reflects the reduced cultural corpus. If the domain includes mycorrhizal networks tied to forest management, cultural targets may increase. |

**Waiver note:** CUL minimum reduced to 4 with documented justification: fewer than 8 published, Nation-authorized ethnomycological sources exist for the PNW region. This waiver would be recorded in the source index.

### Example B: Insect Taxonomy

A PNW entomology domain emphasizes citizen science platforms and agricultural agency data. Cultural source expectations are low (limited published ethnoentomology for PNW nations), but pollinator ecology ties to ethnobotany may add a few.

| Code | Category | Minimum | Target | Adaptation Notes |
|------|----------|---------|--------|-----------------|
| GOV  | Government & Agency | 18 | 22+ | USDA APHIS (invasive species), USFS forest health protection (bark beetles, defoliators), state agriculture departments (WA, OR, ID), EPA pollinator risk assessments, USGS National Water-Quality Assessment (aquatic insects). |
| PRI  | Peer-Reviewed Research | 22 | 28+ | **Increased.** Entomology is the largest branch of zoology by species count. Journals: *Annals of the Entomological Society of America*, *Environmental Entomology*, *Journal of Insect Conservation*, *Ecological Entomology*. Focus on PNW-specific studies. |
| PRO  | Professional Organizations | 22 | 28+ | **Increased.** Citizen science is central to insect monitoring. Platforms: iNaturalist, Bumble Bee Watch, eButterfly, Xerces Society. Professional societies: ESA Pacific Branch, Oregon Entomological Society. University extension programs. Pollinator partnership data. |
| CUL  | Cultural & Ethnographic | 3 | 4+ | **Reduced.** Very limited published PNW ethnoentomology. Possible sources: grasshopper/cricket harvest in Plateau cultures (published ethnobotany crossover), bee/pollinator knowledge tied to camas and berry management. |
| **TOTAL** | | **65** | **82+** | Higher PRO target reflects citizen science dependence. Higher PRI target reflects publication volume. Lower CUL reflects genuine scarcity of published sources. |

**Waiver note:** CUL minimum reduced to 3 with documented justification. If the domain expands to include pollinator-plant-people interactions (camas meadow management), the CUL target should increase to 6+.

### Adaptation Procedure

When creating a new domain's source budget:

1. Start with the default budget table from Section 1.
2. Review the domain's literature landscape: Which categories have deep or shallow published corpora?
3. Adjust minimums and targets. Document the rationale for any reduction below the default minimum.
4. If a category minimum is reduced below the default, add a waiver note explaining why.
5. The aggregate minimum should not drop below 60 for any domain.
6. Include the adapted budget table in the mission pack so the source index agent sees it before execution.

---

*Phase 1b -- Source Budget Template*
*PNW Research Series -- Shared Infrastructure*
