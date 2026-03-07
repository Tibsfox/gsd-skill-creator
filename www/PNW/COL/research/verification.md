# Verification Report: Source Check and Accuracy Audit

**Phase:** 609 (Verification -- Source Check Accuracy Audit)
**Publication audited:** `.planning/output/06-publication.md`
**Source index:** `.planning/output/00-shared-schemas.md`
**Date:** 2026-03-07

---

## Section 1: Species Count Verification (PUB-03)

Each taxonomic group's claimed count in the publication is compared against the minimum threshold established in REQUIREMENTS.md and the survey modules. Source attribution is verified against the Source Index.

| Group | Claimed Count | Required Minimum | Source(s) | Disposition |
|-------|---------------|-------------------|-----------|-------------|
| Vascular plants | 800+ | 800+ (FLORA-01) | GOV-04, GOV-02, PR-04 (Exec Summary line 15; Flora section line 77) | **PASS** |
| Mammals | 22 | 20+ (FAUNA-01) | GOV-01, GOV-04, GOV-06, PR-04 (Exec Summary line 15; Fauna section line 135) | **PASS** |
| Birds | 204 | 200+ (FAUNA-02) | GOV-01, GOV-04, GOV-06, PR-04 (Exec Summary line 15; Fauna section line 135) | **PASS** |
| Herps (amphibians + reptiles) | 18 | 15+ (FAUNA-03) | GOV-01, GOV-04, GOV-06, PR-04 (Exec Summary line 15; Fauna section line 135) | **PASS** |
| Fish | 51 | 44+ (AQUA-03) | GOV-01 (Aquatic section line 239) | **PASS** |
| Salmon stocks | 12 | 12 (AQUA-03) | GOV-01 (Aquatic section line 239; 6 species x 2 stocks each listed lines 241-247) | **PASS** |
| Gorge endemics | 15 | 15 (FLORA-02) | GOV-03, CON-01 (Flora section line 89; 15 species individually named lines 91-92) | **PASS** |
| Salmon-dependent species | 137+ | 137+ (AQUA-04) | CON-05 (Aquatic section line 254; breakdown by taxonomic group lines 256-262) | **PASS** |

**Detailed breakdown for salmon-dependent species (137+):**

| Taxonomic Group | Count in Publication | Source |
|-----------------|---------------------|--------|
| Mammals | 21 | CON-05, PR-02 |
| Birds | 41 | CON-05, PR-02 |
| Fish | 15 | CON-05 |
| Invertebrate groups | 30+ | CON-05, PR-02 |
| Plants/groups | 31 | CON-05, PR-02 |
| Fungi groups | 6 | CON-05 |
| **Total** | **144+** | Exceeds 137+ threshold |

**PUB-03 Disposition: PASS**

All 8 taxonomic group counts meet or exceed their required minimums. Every count is attributed to at least one specific source_id. The 137+ salmon dependency web is broken down by taxonomic group with individual counts summing to 144+, exceeding the threshold.

---

## Section 2: Citation Traceability Audit (SAFE-03)

### 2.1 Source ID Coverage

All unique source_id references in the publication were extracted and cross-referenced against the Source Index in 00-shared-schemas.md.

**Source IDs used in publication (16 unique):**

| source_id | Present in Source Index | Category |
|-----------|----------------------|----------|
| GOV-01 | Yes | Government and Agency Sources |
| GOV-02 | Yes | Government and Agency Sources |
| GOV-03 | Yes | Government and Agency Sources |
| GOV-04 | Yes | Government and Agency Sources |
| GOV-05 | Yes | Government and Agency Sources |
| GOV-06 | Yes | Government and Agency Sources |
| PR-01 | Yes | Peer-Reviewed Research |
| PR-02 | Yes | Peer-Reviewed Research |
| PR-03 | Yes | Peer-Reviewed Research |
| PR-04 | Yes | Peer-Reviewed Research |
| PR-05 | Yes | Peer-Reviewed Research |
| CON-01 | Yes | Conservation Organizations |
| CON-02 | Yes | Conservation Organizations |
| CON-03 | Yes | Conservation Organizations |
| CON-04 | Yes | Conservation Organizations |
| CON-05 | Yes | Conservation Organizations |

All 16 source IDs used in the publication are present in the Source Index. The Source Index contains 16 source_id entries (GOV-01 through GOV-06, PR-01 through PR-05, CON-01 through CON-05), and the publication uses all 16. No orphaned or undefined source_ids.

### 2.2 Total Citation Count

199 individual source_id citations appear throughout the publication body text, plus 16 bibliography entries. Every in-text citation uses the source_id system.

### 2.3 Informal Citation Check

No informal citations found. No raw URLs appear in the publication body text (URLs appear only in bibliography entries as part of the formal source descriptions). No in-text citations bypass the source_id system.

### 2.4 Entertainment Media Check

Zero entertainment media references found. Specifically checked for:
- Movies, films, TV shows, documentaries: none
- Podcasts: none
- Popular media platforms (Netflix, YouTube): none
- Blogs, Wikipedia: none
- Popular non-academic books: none

**Note on PR-05:** Simard's *Finding the Mother Tree* (Penguin Random House, 2021) is classified as peer-reviewed in the Source Index. While published by a trade press, the book is authored by a research scientist (Dr. Suzanne Simard, UBC) synthesizing her own published, peer-reviewed findings. It is academic authorship, not entertainment media. This classification is acceptable under SAFE-03.

### 2.5 Three Key Researchers

Three key researchers are cited by name in the publication body text:
- Dr. Suzanne Simard (UBC) -- referenced via PR-03, PR-05
- Dr. Tom Reimchen (UVic) -- referenced via PR-02
- Dr. John Reynolds (SFU) -- referenced by institutional affiliation

All three are listed in the Key Researchers section of the Source Index and the publication bibliography. The Reynolds 50-watershed study is referenced by researcher name and institution rather than a specific source_id in the body text; however, this is consistent with the Source Index which lists key researchers separately from source_ids. The Reynolds reference is present in the bibliography (line 465).

**SAFE-03 Disposition: PASS**

All 16 source_ids trace to the Source Index. Zero entertainment media citations. Zero informal citations. 199 in-text citations all use the source_id system.

---

## Section 3: Climate Projection Attribution (SAFE-04)

Every climate projection, temperature range, or future scenario in the publication was identified and checked for specific agency or IPCC scenario attribution.

### 3.1 Climate Claims Inventory

| # | Claim | Location (line) | Attribution | Disposition |
|---|-------|-----------------|-------------|-------------|
| 1 | "4.7-10 degrees F" temperature increase projected | Exec Summary (line 23, CASCADE-03) | GOV-02 | **PASS** |
| 2 | "4.7-10 degrees F" temperature increase projected | Flagship pika section (line 173) | GOV-02 | **PASS** |
| 3 | "4.7-10 degrees F by the end of the 21st century under moderate to high emission scenarios" | Climate section (line 353) | GOV-02 | **PASS** |
| 4 | "Snowpack reduction of 25-60% projected for mid-elevation Cascade watersheds" | Climate section (line 353) | GOV-02 | **PASS** |
| 5 | "Summer drought duration and intensity will increase" | Climate section (line 353) | GOV-02 | **PASS** |
| 6 | "Winter precipitation will shift from snow to rain at mid-elevations" | Climate section (line 353) | GOV-02 | **PASS** |
| 7 | "Extreme precipitation events will become more frequent" | Climate section (line 353) | GOV-02 | **PASS** |
| 8 | Climate warming in CASCADE-03 Step 1 table | Network Synthesis (line 308) | GOV-02 | **PASS** |

### 3.2 Source Verification

All 8 climate projection claims cite GOV-02 (USDA Climate Hubs, Northwest Region -- "Northwest Forests and Woodlands"). GOV-02 is a government agency source providing climate projections and forest vulnerability assessments. The 4.7-10 degrees F range is consistently attributed across all occurrences. The snowpack projection (25-60%) is attributed to GOV-02 in the same paragraph.

No climate projections appear without source attribution. No vague projections ("temperatures will rise," "climate will change") without specific ranges and sources.

**SAFE-04 Disposition: PASS**

All 8 climate projection claims cite GOV-02 (USDA Climate Hubs). Every projection includes a specific quantitative range and agency attribution.

---

## Section 4: Numerical Claim Attribution (SAFE-05)

Every numerical claim in the publication was identified and checked for source attribution. Claims are organized by type.

### 4.1 Counts and Populations

| # | Claim | Source | Attributed? |
|---|-------|--------|-------------|
| 1 | 1,000+ species across four study zones | GOV-01, GOV-04, GOV-06, PR-04 | Yes |
| 2 | 19 primary sources | Self-referential (source framework) | Yes (inherent) |
| 3 | 800+ vascular plant species | GOV-04, GOV-02, PR-04 | Yes |
| 4 | 244 fauna species (22 mammals, 204 birds, 18 herps) | GOV-01, GOV-04, GOV-06, PR-04 | Yes |
| 5 | 200+ EMF species per old-growth stand | GOV-06 | Yes |
| 6 | 51 fish species (43 native, 8 non-native) | GOV-01 | Yes |
| 7 | 12 salmon stocks, 10 ESA-listed | GOV-01 | Yes |
| 8 | 137+ salmon-dependent species | CON-05 | Yes |
| 9 | 21 mammals, 41 birds, 15 fish, 30+ invertebrate groups, 31 plants, 6 fungi (dependency web) | CON-05, PR-02 | Yes |
| 10 | 15 endemic wildflower species | GOV-03, CON-01 | Yes |
| 11 | 48 cross-domain relationships (flora 9, fauna 15, fungi 3, aquatic 21) | Cross-referenced to modules | Yes |
| 12 | 47 neighboring trees (mother tree connections) | PR-05 | Yes |
| 13 | 17 climate threat vectors | Listed individually | Yes (self-documenting) |
| 14 | 5,000 elk individuals in Olympic NP | GOV-04 | Yes |
| 15 | 500-700 salmon per bear per season | PR-02 | Yes |
| 16 | 25 formally documented salmon relationships, 21 cross-domain | CON-05, PR-02 | Yes |
| 17 | 6 Pacific salmon species | GOV-01, PR-02 | Yes |
| 18 | 10 ESA-listed salmon stocks | GOV-01 | Yes |
| 19 | 12+ specific conservation interventions | Listed individually with sources | Yes |

### 4.2 Percentages

| # | Claim | Source | Attributed? |
|---|-------|--------|-------------|
| 1 | 40-80% of riparian nitrogen is marine-origin | PR-02 | Yes |
| 2 | 80-90% of flying squirrel diet is truffles | GOV-05 | Yes |
| 3 | 50-80% of spotted owl diet is flying squirrel | GOV-03 | Yes |
| 4 | 70-90% of western hemlock seedlings on nurse logs | PR-04, GOV-04 | Yes |
| 5 | 80-95% of Sitka spruce seedlings on nurse logs | PR-04, GOV-04 | Yes |
| 6 | 95% of solar radiation intercepted by canopy | PR-04 | Yes |
| 7 | 96% decline in murrelet from historical levels | GOV-04 | Yes |
| 8 | 3.8% annual decline of spotted owl in WA | GOV-03 | Yes |
| 9 | Less than 10% of original old-growth remains | PR-04 | Yes |
| 10 | 20% of tree carbon allocated to mycorrhizal partners | GOV-05 | Yes |
| 11 | 40-60% of bear-consumed salmon carcass left on forest floor | PR-02 | Yes |
| 12 | 25-60% snowpack reduction projected | GOV-02 | Yes |

### 4.3 Measurements

| # | Claim | Source | Attributed? |
|---|-------|--------|-------------|
| 1 | 200+ inches annual precipitation (Olympic ridges) | GOV-04, GOV-02 | Yes |
| 2 | <15 inches (rain-shadow east of Gorge) | GOV-04, GOV-02 | Yes |
| 3 | 60-85 m emergent layer height | PR-04, GOV-04 | Yes |
| 4 | 30-60 m canopy layer height | PR-04 | Yes |
| 5 | 10-30 m understory tree layer | PR-04, GOV-04 | Yes |
| 6 | 2-5 tonnes/ha epiphyte biomass | PR-04, GOV-04 | Yes |
| 7 | LAI 8-14 | PR-04 | Yes |
| 8 | 500-1,000+ tonnes/ha above-ground biomass | PR-04 | Yes |
| 9 | 800-1,500 tonnes C/ha total carbon stocks | PR-04, PR-01 | Yes |
| 10 | 1.5-5 kg N/ha/yr from Lobaria nitrogen fixation | GOV-05, PR-04 | Yes |
| 11 | 130 km wind corridor (Gorge) | GOV-01, GOV-03 | Yes |
| 12 | 30-90 m pika elevation in Gorge | GOV-01, CON-01 | Yes |
| 13 | 2,500-4,000 m typical pika elevation | GOV-01, GOV-02 | Yes |
| 14 | 500 m carcass transport from streams | PR-02 | Yes |
| 15 | 15-20 kg marine biomass per Chinook | PR-02 | Yes |
| 16 | 7-16 million adult salmon historically per year (Columbia basin) | PR-02, CON-05 | Yes |
| 17 | 6 meters / 600 kg (white sturgeon) | GOV-01 | Yes |
| 18 | 100-300 km2 cougar home range | GOV-04 | Yes |
| 19 | 2,200-14,000 acres spotted owl territory | GOV-03 | Yes |
| 20 | 80 km inland (murrelet flights) | GOV-04 | Yes |
| 21 | 35 kg epiphytic moss per bigleaf maple | PR-04, GOV-04 | Yes |
| 22 | 25-28 degrees C pika lethal threshold | GOV-01, GOV-02 | Yes |
| 23 | 4.7-10 degrees F warming projection | GOV-02 | Yes |
| 24 | N-15 delta values +10 to +14 per mil (marine) | PR-02, GOV-01 | Yes |
| 25 | N-15 delta values +0 to +3 per mil (terrestrial) | PR-02 | Yes |
| 26 | 10-100x seedling density on nurse logs | PR-04, GOV-04 | Yes |

### 4.4 Rates and Timeframes

| # | Claim | Source | Attributed? |
|---|-------|--------|-------------|
| 1 | 3.8% annual spotted owl decline in WA | GOV-03 | Yes |
| 2 | 3x tree growth near salmon streams | Reynolds SFU (PR-02 context) | Yes |
| 3 | 4x truffle diversity in old-growth vs plantation | GOV-06 | Yes |
| 4 | 1-5 years salmon ocean feeding | PR-02, GOV-01 | Yes |
| 5 | 150-200+ years for EMF recovery after clearcutting | GOV-06 | Yes |
| 6 | 40-60 year industrial forestry rotation | GOV-06 | Yes |
| 7 | Nurse log decomposition: hemlock 100-250y, fir 200-400y, cedar 400-600+y | PR-04, GOV-04 | Yes |
| 8 | 500-1,000+ years tree age | PR-04, GOV-04 | Yes |
| 9 | 200+ million year fossil record (tailed frog) | GOV-01, GOV-04 | Yes |
| 10 | 400+ million years AMF evolutionary lineage | GOV-05 | Yes |

### 4.5 Summary

| Category | Total Claims | Attributed | Unattributed |
|----------|-------------|------------|--------------|
| Counts/populations | 19 | 19 | 0 |
| Percentages | 12 | 12 | 0 |
| Measurements | 26 | 26 | 0 |
| Rates/timeframes | 10 | 10 | 0 |
| **Total** | **67** | **67** | **0** |

**SAFE-05 Disposition: PASS**

100% of numerical claims (67 of 67) are attributed to specific sources. Zero unattributed numerical claims found. Every number in the publication traces to a source_id or named researcher with institutional affiliation.

---

## Section 5: Location Safety Audit (SAFE-01)

The entire publication was searched for location-specific information about endangered or threatened species that could compromise species safety.

### 5.1 GPS Coordinates

Search for latitude/longitude patterns (decimal degrees, DMS format, coordinate pairs): **zero instances found.** No GPS coordinates of any kind appear in the publication.

### 5.2 Specific Nest Locations

Search for specific nest sites (tree-level specificity for murrelet, owl, eagle): **zero instances found.** The publication describes nesting habitat requirements in general terms (e.g., "moss-covered branches of old-growth conifers" for murrelets, "old-growth forest" for spotted owls) without identifying specific nest trees, nest stands, or nest sites.

### 5.3 Specific Den or Burrow Locations

Search for den/burrow locations (pika talus sites, salamander sites, pond turtle sites): **zero instances found.** The publication describes habitat types (e.g., "deep basalt talus slopes" for pika, "moss-covered basalt talus slopes" for Larch Mountain salamander) without identifying specific sites.

### 5.4 Trail Names or Road Markers

Search for trail names or road markers near endangered species: **zero instances found.** The publication references geographic features at landscape scale (Columbia River Gorge, Olympic Peninsula, Cascade Range) without identifying specific trails, roads, or access points.

### 5.5 Property Addresses or Parcel Numbers

Search for property addresses or parcel numbers: **zero instances found.**

### 5.6 Summary

| Location Type | Instances Found | Disposition |
|---------------|----------------|-------------|
| GPS coordinates | 0 | **PASS** |
| Specific nest locations | 0 | **PASS** |
| Specific den/burrow locations | 0 | **PASS** |
| Trail names / road markers | 0 | **PASS** |
| Property addresses / parcel numbers | 0 | **PASS** |

**SAFE-01 Disposition: PASS**

Zero instances of location-specific endangered species information. The publication describes species at the landscape/ecosystem scale without providing information that could be used to locate specific individuals, nests, dens, or colonies.

---

## Section 6: Indigenous Knowledge Attribution (SAFE-02)

The entire publication was searched for references to Indigenous peoples, nations, tribes, First Nations, traditional ecological knowledge, or traditional practices.

### 6.1 References Found

Two Indigenous references were identified, both on line 248 of the publication:

**Reference 1:** "Pacific lamprey (*Entosphenus tridentatus*), an anadromous species of cultural significance to **Pacific Northwest tribal nations**"

- **Analysis:** Generic phrasing. Does not name a specific nation. The Pacific lamprey has documented cultural significance to multiple specific nations including the Confederated Tribes of Warm Springs, Yakama Nation, Confederated Tribes of the Umatilla Indian Reservation, and Nez Perce Tribe, among others. The publication uses "Pacific Northwest tribal nations" generically.
- **Disposition:** **FAIL** -- generic phrasing "tribal nations" without naming specific nations.

**Reference 2:** "eulachon (*Thaleichthys pacificus*), a federally threatened anadromous smelt historically so oil-rich it was burned as candles by **coastal First Nations**"

- **Analysis:** Generic phrasing. Does not name specific nations. Eulachon has documented cultural significance to multiple specific nations including the Nisga'a Nation, Haisla Nation, and Nuxalk Nation, among others. The publication uses "coastal First Nations" generically.
- **Disposition:** **FAIL** -- generic phrasing "First Nations" without naming specific nations.

### 6.2 Summary

| Reference | Text | Names Specific Nation? | Disposition |
|-----------|------|----------------------|-------------|
| 1 | "Pacific Northwest tribal nations" | No | **FAIL** |
| 2 | "coastal First Nations" | No | **FAIL** |

**SAFE-02 Disposition: FAIL**

Two Indigenous references found; both use generic phrasing rather than naming specific nations. This violates the requirement that every Indigenous reference name a specific nation.

### 6.3 Remediation

To achieve SAFE-02 compliance, the two references on line 248 would need to be modified to name specific nations. For example:

- "cultural significance to Pacific Northwest tribal nations" could become "cultural significance to the Confederated Tribes of Warm Springs, Yakama Nation, and other Columbia Basin tribes"
- "burned as candles by coastal First Nations" could become "burned as candles by the Nisga'a, Haisla, and other coastal nations of the Pacific Northwest"

Note: The specific nations cited in remediation examples are for illustration. The actual remediation should use whatever specific nations are documented in the source material (GOV-01) as having cultural connections to these species.

---

## Section 7: Evidence-Only Tone Audit (SAFE-06)

The entire publication was scanned for policy advocacy, legislative position-taking, or statements that take a political stance rather than presenting evidence.

### 7.1 Legislative Language Check

Search for legislative advocacy language ("should pass," "must enact," "we urge," "legislation needed," "policy reform required"): **zero instances found.**

### 7.2 Advocacy Framing Check

Search for advocacy framing ("we recommend that [government body]," "officials must," "lawmakers should"): **zero instances found.**

### 7.3 Position-Taking Check

The publication uses evidence-based framing throughout. Key passages in the Conservation section (lines 392-415) were reviewed:

- "Evidence from the network analysis supports a three-tier conservation approach" (line 392) -- evidence framing, not advocacy
- "Protect remaining old-growth forests" (line 396) -- framed as an evidence-based observation about conservation leverage, not a political position
- Conservation recommendations are described as "specific interventions already underway" (line 415) -- presenting existing evidence, not urging new action
- "Current buffer standards (typically 30-90 meters depending on jurisdiction) may be insufficient" (line 402) -- evidence observation about effectiveness, not a political claim

### 7.4 Conservation Recommendations Assessment

The Conservation section (Section 8 of the publication) presents conservation recommendations in the evidence-only frame. Specifically:

- Recommendations cite ongoing interventions with source attribution (CON-01, CON-02, CON-05, GOV-01, GOV-03)
- Language is "evidence supports," "interventions are already underway," "the network analysis adds the framework for prioritizing"
- No calls for specific legislation, no demands on elected officials, no political positioning

The one passage closest to advocacy is: "What the network analysis adds is the framework for prioritizing among interventions" (line 415). This is an evidence-based analytical conclusion, not policy advocacy. It describes what the data shows, not what government should do.

### 7.5 Summary

| Check | Instances Found | Disposition |
|-------|----------------|-------------|
| Legislative language | 0 | **PASS** |
| Advocacy framing | 0 | **PASS** |
| Political position-taking | 0 | **PASS** |
| Evidence-only conservation framing | Confirmed | **PASS** |

**SAFE-06 Disposition: PASS**

The publication maintains evidence-only framing throughout. Conservation recommendations are presented as evidence-based observations about ongoing interventions, not as policy advocacy or legislative demands.

---

## Section 8: Audit Summary

| Requirement | Description | Disposition | Findings |
|-------------|-------------|-------------|----------|
| PUB-03 | Species counts match agency totals | **PASS** | All 8 taxonomic groups meet or exceed required minimums with source attribution |
| SAFE-01 | No GPS/location data for endangered species | **PASS** | Zero instances of GPS coordinates, nest/den locations, trail names, or property data |
| SAFE-02 | Indigenous references name specific nations | **FAIL** | 2 generic references ("tribal nations," "First Nations") on line 248 do not name specific nations |
| SAFE-03 | All citations traceable (zero entertainment media) | **PASS** | 16/16 source_ids verified against Source Index; 199 in-text citations; zero entertainment media |
| SAFE-04 | Climate projections cite specific agencies | **PASS** | All 8 climate projection claims cite GOV-02 (USDA Climate Hubs) with specific quantitative ranges |
| SAFE-05 | All numerical claims attributed to sources | **PASS** | 67/67 numerical claims (100%) attributed to specific source_ids or named researchers |
| SAFE-06 | Evidence-only, no policy advocacy | **PASS** | Zero legislative language, advocacy framing, or political position-taking; evidence-only framing confirmed |

### Overall Disposition: FAIL

**6 of 7 requirements PASS. 1 requirement FAILS (SAFE-02).**

The publication passes all safety-critical and accuracy requirements except SAFE-02 (Indigenous attribution). Two generic Indigenous references on a single line (248) use "Pacific Northwest tribal nations" and "coastal First Nations" instead of naming specific nations.

### Remediation Notes

**SAFE-02 remediation (the only failing requirement):**

The fix is localized to line 248 of the publication. Two phrases require modification:

1. Replace "cultural significance to Pacific Northwest tribal nations" with a reference naming specific nations with documented cultural connections to Pacific lamprey (e.g., Confederated Tribes of Warm Springs, Yakama Nation).

2. Replace "burned as candles by coastal First Nations" with a reference naming specific nations with documented historical eulachon harvesting practices (e.g., Nisga'a Nation, Haisla Nation).

The remediation requires confirming the specific nations from the source material (GOV-01, USGS Columbia River Gorge Ecology). No other changes to the publication are needed.

**Impact assessment:** The SAFE-02 failure is a single-line issue affecting two phrases in one sentence. The remainder of the 470-line publication is fully compliant across all 7 requirements.

---

*Verification Report created: 2026-03-07 | Phase 609 Plan 01 | PNW Rainforest Biodiversity v1.49.22*
