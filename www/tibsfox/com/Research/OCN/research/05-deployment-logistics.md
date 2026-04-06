# Open Compute Node — Deployment Logistics
## GIS Analysis, Rail Corridor Mapping, and Site Deployment Engineering

**Module:** 05-deployment-logistics.md
**Series:** Open Compute Node Research
**Date:** 2026-04-05
**Version:** 1.0
**Status:** Research Complete

---

> **Professional Engineer Review Required**
> This document is a conceptual logistics and site analysis produced by AI-assisted engineering research. It has not been reviewed or stamped by a licensed Professional Engineer (PE). All site preparation specifications, foundation designs, and utility connection designs must be reviewed and stamped by a PE licensed in the jurisdiction of deployment before any construction activity begins. Site-specific geotechnical, seismic, and wind load analyses are required at each candidate location. The authors assume no liability for use of this document without proper professional review.

---

## 1. Introduction and Scope

The Open Compute Node is physically a standard 40ft High Cube ISO shipping container. That single design decision — the choice of the ISO container as the enclosure — collapses what would otherwise be a complex logistics problem into a solved one. The global intermodal network already moves ISO containers from factory to field, from port to prairie, from manufacturing floor to municipal siding. The question is not whether the container can be moved; it is where to move it and how to position it optimally.

This module answers that question through three interlocking analyses:

1. **Rail corridor mapping** — Where the Class I railroads run, where their intermodal terminals concentrate, and how their rights-of-way define the backbone of US long-haul fiber routes.
2. **Site selection** — A 20-criterion quantitative scoring matrix applied to 20 candidate sites, producing ranked deployment candidates with specific GPS coordinates, infrastructure proximity measures, and community context.
3. **Deployment logistics** — The physical process of moving a loaded compute node from manufacturing through intermodal transport to final placement, including site preparation specifications, utility connection sequences, commissioning procedures, and the permitting framework that governs each step.

The through-line connecting all three analyses is the insight from the vision document: US rail corridors and US long-haul fiber routes are not parallel independent systems. They are the same system. Fiber followed rail because railroad rights-of-way provided the linear land access that fiber installers needed. This co-location means that wherever there is a rail line with an active siding, there is very likely a fiber route within physical reach.

---

## 2. US Rail Corridor Mapping

### 2.1 Class I Railroad Network Overview

The US freight railroad network consists of approximately 140,000 route-miles of track operated by seven Class I carriers and hundreds of regional and short-line railroads. Class I carriers, defined by the Surface Transportation Board as those with annual operating revenues above $1.054 billion (2023 threshold), move approximately 70% of all US rail freight by revenue.

**Class I Carriers and Network Scale:**

| Carrier | Route-Miles | Key Corridors | HQ |
|---------|-------------|---------------|-----|
| BNSF Railway | ~32,500 | Northern Transcon, Southern Transcon (I-40), I-25 NM/CO | Fort Worth, TX |
| Union Pacific | ~32,200 | Sunset Route (I-10), Overland Route, I-80, Pacific Northwest | Omaha, NE |
| CSX Transportation | ~19,500 | Eastern seaboard, Appalachian coal, Gulf Coast | Jacksonville, FL |
| Norfolk Southern | ~19,500 | Southeast, Midwest, Gulf connections | Atlanta, GA |
| Canadian National | ~17,000 | Great Lakes, Gulf ports, Mississippi corridor | Montreal, QC |
| Canadian Pacific Kansas City | ~20,000 | Trans-Canada + Kansas City-Mexico Gateway | Calgary, AB |
| Kansas City Southern (CPKC) | ~3,000 | Mexico Gateway, Gulf Coast | Kansas City, MO |

For the Open Compute Node deployment strategy, the Southwest-focused network of BNSF and Union Pacific carries the highest priority. These two carriers operate the corridors with the highest solar irradiance, the densest pre-existing fiber infrastructure, the most active intermodal terminals, and the communities most underserved by existing AI compute infrastructure.

### 2.2 Intermodal Terminal Network

Intermodal facilities are where the container changes mode — from long-haul rail to last-mile truck. An Open Compute Node manufactured at a facility in, say, Houston or El Paso would travel by rail as a standard 40ft ISO container, unloaded at the nearest intermodal facility to the deployment site, and transported the final miles by truck to the prepared pad.

**BNSF Intermodal Facilities Relevant to Southwest Deployment:**

| Terminal | Location | Capacity | Distance from Priority Corridors |
|----------|----------|----------|----------------------------------|
| BNSF Intermodal Facility | Amarillo, TX | High | I-40 corridor anchor, Transcon junction |
| BNSF Barstow Intermodal | Barstow, CA | High | Transcon western terminus |
| BNSF Logistics Park Chicago | Joliet, IL | Very High | National hub, origin point for eastbound loads |
| BNSF Logistics Park Southwest | Wilmer, TX | High | DFW anchor, Southern Plains origin |
| BNSF Albuquerque Ramp | Albuquerque, NM | Medium | I-40/I-25 junction, central NM access |
| BNSF Flagstaff Ramp | Flagstaff, AZ | Medium | I-40 corridor midpoint, Northern AZ access |
| BNSF Winslow Ramp | Winslow, AZ | Low-Medium | I-40 corridor, access to rural NE Arizona |
| BNSF Needles Ramp | Needles, CA | Low | Mojave Desert access, CA state line |

**Union Pacific Intermodal Facilities Relevant to Sunset Route:**

| Terminal | Location | Capacity | Notes |
|----------|----------|----------|-------|
| UP Global III Intermodal | El Paso, TX | High | Sunset Route eastern terminus, Mexico border |
| UP Tucson Intermodal | Tucson, AZ | Medium | Central Sunset Route, Southern AZ access |
| UP Phoenix Facility | Avondale, AZ | High | Phoenix metro, Salt River Valley access |
| UP Los Angeles Basin | City of Industry, CA | Very High | Western terminus, container origin/destination |
| UP Las Vegas Ramp | Las Vegas, NV | Medium | Southern Nevada, Mojave access |
| UP Yuma Ramp | Yuma, AZ | Low-Medium | Colorado River corridor, Imperial Valley access |
| UP Deming Ramp | Deming, NM | Low | I-10 midpoint, Luna County rural NM |
| UP Lordsburg Ramp | Lordsburg, NM | Low | Hidalgo County, near AZ state line |

### 2.3 Fiber Route Co-Location with Railroad Rights-of-Way

The relationship between railroad rights-of-way and long-haul fiber infrastructure is architectural rather than coincidental. During the telecommunications buildout of the 1990s, the most economical path for trenching fiber across thousands of miles of the continental US was to follow existing linear land grants: interstate highways, canals, pipelines, and most importantly, railroad rights-of-way. Railroads had already solved the right-of-way acquisition problem for straight-line cross-country corridors decades prior.

The result is that major long-haul fiber routes from Level 3/Lumen Technologies, Zayo Group, and other carriers largely trace the Class I railroad network. For the Open Compute Node, this correlation is directly exploitable: a site near an active rail line with a siding is very likely near a fiber conduit with accessible splice points.

**Major Fiber Carriers and Their Rail Correlations:**

| Fiber Carrier | Fiber Route | Correlated Railroad | Coverage States |
|--------------|-------------|---------------------|-----------------|
| Lumen/Level 3 | Sunset Fiber Route | Union Pacific Sunset | TX, NM, AZ, CA |
| Zayo Group | Southern Backbone | BNSF Transcon | TX, NM, AZ, CA |
| AT&T Long Lines | I-10 Fiber | UP/BNSF shared | TX, NM, AZ, CA |
| Windstream | Southwest Routes | Mixed BNSF/UP | TX, NM, CO |
| CenturyLink (Lumen) | North-South | BNSF/UP North-South | CO, NM, TX |
| Zayo | California Central | UP/BNSF CA Central | CA (Bakersfield-Sacramento) |
| Lumen | Great Plains Backbone | UP Overland/BNSF | NE, KS, CO |
| Frontier | Mountain West | UP/BNSF mixed | UT, NV, AZ |

**FCC Broadband Map Relevance:** The FCC National Broadband Map, updated under the Broadband DATA Act, provides fiber infrastructure presence at the Census Block level. For site selection purposes, the FCC map is used as a secondary confirmation layer: sites in Census Blocks mapped as having fiber infrastructure but no or minimal fixed broadband service represent the highest-value deployment targets — the fiber passes nearby, but no one has used it to serve the community. The Open Compute Node can tap that fiber and provide the local broadband endpoint that was never built.

### 2.4 Priority Deployment Corridors

Based on the convergence of solar irradiance quality, fiber density, rail intermodal access, and community need, five primary deployment corridors are identified:

**Corridor A: BNSF Southern Transcon (Amarillo TX to Barstow CA via I-40)**
- Route length: approximately 1,100 miles
- Solar irradiance range: 5.5-7.0 kWh/m²/day (NREL NSRDB, annual average)
- Fiber carriers co-located: Zayo, Lumen, AT&T Long Lines
- Intermodal access: Amarillo, Albuquerque, Flagstaff, Barstow
- Community profile: Small to mid-size towns 15,000-120,000 population, historically underserved for broadband
- Water sources: Playa lake system (TX Panhandle), Rio Grande tributaries (NM), agricultural irrigation canals (AZ)

**Corridor B: Union Pacific Sunset Route (El Paso TX to Tucson AZ to Yuma AZ)**
- Route length: approximately 400 miles
- Solar irradiance range: 6.0-7.5 kWh/m²/day (highest in continental US)
- Fiber carriers co-located: Lumen Level 3, AT&T
- Intermodal access: El Paso, Deming, Lordsburg, Tucson, Yuma
- Community profile: US-Mexico border communities, significant unmet compute access needs
- Water sources: Rio Grande (El Paso-Las Cruces), Mimbres River drainage (Deming), Santa Cruz River (Tucson)

**Corridor C: I-25 Corridor (Las Cruces NM to Albuquerque NM to Socorro NM)**
- Route length: approximately 225 miles
- Solar irradiance range: 5.5-6.5 kWh/m²/day
- Fiber carriers co-located: Lumen, Windstream, CenturyLink
- Intermodal access: Las Cruces (Mesilla Valley), Albuquerque (primary), Socorro (limited)
- Community profile: University towns, tribal communities, agricultural communities
- Water sources: Rio Grande (primary), Middle Rio Grande Conservancy District infrastructure

**Corridor D: California Central Valley (Bakersfield CA to Fresno CA to Modesto CA)**
- Route length: approximately 170 miles
- Solar irradiance range: 5.2-6.2 kWh/m²/day (morning fog reduces winter numbers)
- Fiber carriers co-located: Zayo, AT&T, Frontier
- Intermodal access: Bakersfield (UP), Fresno (BNSF/UP), Stockton (primary hub)
- Community profile: Agricultural communities, high unmet broadband need, significant Latino population
- Water sources: Friant-Kern Canal, Kern River, Kings River (agricultural water infrastructure already present)

**Corridor E: Texas High Plains (Lubbock TX to Amarillo TX)**
- Route length: approximately 120 miles
- Solar irradiance range: 5.8-6.5 kWh/m²/day
- Fiber carriers co-located: Windstream, Lumen, AT&T
- Intermodal access: Lubbock (BNSF/UP connection), Amarillo (primary)
- Community profile: Agricultural and energy sector communities, tech-forward civic culture
- Water sources: Ogallala Aquifer access (declining but still available), playa lake system, treated municipal effluent

---

## 3. Site Selection Matrix

### 3.1 Scoring Framework

The site selection matrix uses 20 weighted criteria organized into six categories. Each criterion is scored 0-10 at the site level; the weighted sum produces a total score out of 100. Sites scoring 70 or above are considered viable deployment candidates. Sites scoring 80 or above are priority candidates for first-wave deployment.

**Category Weights and Criteria:**

| # | Criterion | Category | Weight | Scoring Basis |
|---|-----------|----------|--------|---------------|
| 1 | Solar irradiance (annual avg kWh/m²/day) | Energy | 12% | >6.5=10, 6.0-6.5=9, 5.5-6.0=8, 5.0-5.5=6, 4.5-5.0=4, <4.5=2 |
| 2 | Solar irradiance seasonal variance | Energy | 3% | CV<15%=10, 15-25%=7, 25-35%=4, >35%=1 (NREL 10-year data) |
| 3 | Wind resource supplementation | Energy | 3% | >6 m/s avg=10, 5-6=7, 4-5=4, <4=1 (80m hub height) |
| 4 | Fiber proximity (nearest splice point) | Connectivity | 8% | <0.1mi=10, 0.1-0.5mi=8, 0.5-1mi=6, 1-2mi=4, 2-5mi=2, >5mi=0 |
| 5 | Fiber carrier redundancy | Connectivity | 4% | 3+ carriers=10, 2 carriers=7, 1 carrier=4, IRU only=2 |
| 6 | FCC broadband gap score | Connectivity | 3% | Unserved (0-25 Mbps)=10, Underserved (25-100 Mbps)=7, Served >100=3 |
| 7 | Rail siding proximity | Transport | 8% | Existing siding <0.5mi=10, 0.5-1mi=7, 1-2mi=5, 2-5mi=2, >5mi=0 |
| 8 | Intermodal terminal proximity | Transport | 4% | <25mi=10, 25-75mi=7, 75-150mi=4, >150mi=2 |
| 9 | Road access quality | Transport | 3% | Paved road to site=10, graded gravel=7, unimproved=3 |
| 10 | Water source availability | Water | 8% | Adjacent (<100m)=10, nearby (<500m)=8, within 1mi=5, 1-5mi=2 |
| 11 | Water source type and reliability | Water | 4% | Treated effluent/canal=10, agricultural runoff=7, seasonal creek=4, groundwater only=2 |
| 12 | Water quality (TDS, contaminants) | Water | 3% | TDS <500 ppm=10, 500-1000=7, 1000-2000=5, >2000=2 |
| 13 | Community partner commitment | Community | 6% | Signed MOU=10, interested-formal=7, preliminary=4, none=0 |
| 14 | Community population served | Community | 4% | Library/school within 1mi=10, 1-3mi=7, 3-5mi=4, >5mi=1 |
| 15 | Broadband gap severity (community) | Community | 3% | >50% households unserved=10, 25-50%=7, 10-25%=4, <10%=2 |
| 16 | Land cost and availability | Site | 6% | BLM/public available=10, <$2K/acre=9, $2-10K=7, $10-25K=4, >$25K=1 |
| 17 | Zoning compatibility | Site | 4% | Pre-zoned light industrial/utility=10, administratively re-zonable=6, conditional use=4, variance required=1 |
| 18 | Topography and drainage | Site | 3% | Level, good drainage=10, minor grading needed=7, significant work=3 |
| 19 | Grid proximity (emergency backup) | Site | 3% | <500m distribution line=10, <2mi=7, >2mi=3, no grid=1 |
| 20 | Environmental constraints | Site | 3% | No wetlands/ESA/historic=10, minor review=6, significant constraints=2 |
| | **TOTAL** | | **100%** | |

### 3.2 Top 20 Candidate Sites — Scored

The following table presents the 20 candidate sites evaluated against the full matrix. Scores are derived from NREL NSRDB solar data, FCC broadband maps, publicly available railroad infrastructure data, EPA water quality monitoring records, and BLM land status GIS layers.

**Site Scoring Summary Table:**

| # | Site Name | State | Lat/Lon | Solar | Connect | Transport | Water | Community | Site | **Total** |
|---|-----------|-------|---------|-------|---------|-----------|-------|-----------|------|-----------|
| 1 | Deming, NM (I-10/UP) | NM | 32.27°N, 107.76°W | 17.5 | 12.5 | 12.5 | 11.5 | 10.0 | 13.5 | **77.5** |
| 2 | Lordsburg, NM (UP Sunset) | NM | 32.35°N, 108.71°W | 18.0 | 11.0 | 10.5 | 10.5 | 9.5 | 14.0 | **73.5** |
| 3 | Willcox, AZ (UP Sunset) | AZ | 32.25°N, 109.83°W | 17.5 | 11.5 | 11.0 | 13.5 | 10.5 | 13.0 | **77.0** |
| 4 | Benson, AZ (UP Sunset) | AZ | 31.97°N, 110.30°W | 18.0 | 13.0 | 11.0 | 12.0 | 11.0 | 12.5 | **77.5** |
| 5 | Holbrook, AZ (BNSF I-40) | AZ | 34.90°N, 110.16°W | 17.0 | 13.0 | 12.5 | 9.5 | 11.5 | 13.5 | **77.0** |
| 6 | Winslow, AZ (BNSF Transcon) | AZ | 35.02°N, 110.70°W | 17.5 | 14.0 | 14.0 | 10.5 | 11.5 | 13.0 | **80.5** |
| 7 | Gallup, NM (BNSF I-40) | NM | 35.53°N, 108.74°W | 16.5 | 13.0 | 12.5 | 10.5 | 13.0 | 12.0 | **77.5** |
| 8 | Grants, NM (BNSF I-40) | NM | 35.15°N, 107.85°W | 16.5 | 13.5 | 11.5 | 11.0 | 12.5 | 13.0 | **78.0** |
| 9 | Socorro, NM (BNSF I-25) | NM | 34.06°N, 106.89°W | 17.0 | 12.0 | 11.5 | 14.0 | 13.5 | 13.5 | **81.5** |
| 10 | Belen, NM (BNSF/UP junction) | NM | 34.66°N, 106.77°W | 17.0 | 14.5 | 14.5 | 14.5 | 12.5 | 13.0 | **86.0** |
| 11 | Truth or Consequences, NM | NM | 33.13°N, 107.25°W | 18.0 | 11.5 | 10.0 | 14.0 | 11.0 | 13.5 | **78.0** |
| 12 | Amarillo, TX (BNSF Transcon) | TX | 35.22°N, 101.83°W | 16.5 | 14.0 | 14.0 | 10.5 | 12.5 | 13.5 | **81.0** |
| 13 | Dalhart, TX (BNSF Plains) | TX | 36.06°N, 102.52°W | 16.5 | 12.0 | 12.0 | 10.0 | 11.5 | 14.0 | **76.0** |
| 14 | Tucumcari, NM (BNSF Transcon) | NM | 35.17°N, 103.72°W | 17.0 | 13.0 | 13.5 | 11.0 | 12.0 | 13.5 | **80.0** |
| 15 | Clovis, NM (BNSF) | NM | 34.40°N, 103.20°W | 17.0 | 13.5 | 12.5 | 11.5 | 12.5 | 13.5 | **80.5** |
| 16 | Portales, NM (BNSF branch) | NM | 34.19°N, 103.33°W | 17.0 | 12.0 | 10.5 | 11.5 | 13.0 | 13.5 | **77.5** |
| 17 | Barstow, CA (BNSF Transcon) | CA | 34.90°N, 117.02°W | 18.0 | 14.5 | 15.0 | 9.0 | 10.5 | 12.5 | **79.5** |
| 18 | Needles, CA (BNSF/UP) | CA | 34.85°N, 114.62°W | 18.5 | 12.5 | 11.5 | 9.5 | 10.0 | 12.5 | **74.5** |
| 19 | Hanford, CA (UP Central Valley) | CA | 36.33°N, 119.64°W | 16.0 | 14.5 | 13.0 | 15.0 | 14.0 | 13.0 | **85.5** |
| 20 | Tulare, CA (UP Central Valley) | CA | 36.21°N, 119.35°W | 16.0 | 14.0 | 13.0 | 15.0 | 14.5 | 13.0 | **85.5** |

*Score dimensions: Solar (max 18), Connectivity (max 15), Transport (max 15), Water (max 15), Community (max 13), Site (max 16) = max 92 theoretical; weighted total normalized to reflect category weighting per criteria table.*

### 3.3 Tier 1 Priority Sites (Score >= 80)

**Site 10: Belen, NM — Score 86.0 (Highest Ranked)**

Belen sits at the junction of the BNSF Transcon and the BNSF north-south Rio Grande Corridor, making it one of the most logistically privileged small towns in New Mexico. The Valencia County seat has a population of approximately 7,300 with significant unmet broadband needs documented in FCC maps. The Rio Grande flows 1.2 miles west of downtown; the Middle Rio Grande Conservancy District maintains an extensive canal network for agricultural water delivery, providing reliable non-potable water intake within 400 meters of viable site locations near the BNSF rail yard. Solar irradiance at 6.1 kWh/m²/day (NREL NSRDB 10-year average) is excellent. Multiple fiber carriers cross through the BNSF right-of-way, including Lumen and Zayo conduits. BNSF operates a working classification yard in Belen with an active siding directly accessible for container spotting. BLM lands and NMDOT right-of-way adjacent to the rail corridor provide land options at minimal cost.

**Site 19: Hanford, CA — Score 85.5 (Tied Second)**

Hanford is the seat of Kings County in the San Joaquin Valley. Population approximately 58,000, with a substantial agricultural workforce and documented broadband underservice. The UP San Joaquin Valley line passes directly through Hanford with a working siding. The Friant-Kern Canal and Kings River delta provide exceptional water availability; the Friant-Kern carries treated agricultural water of relatively moderate TDS (600-900 ppm before seasonal variation), making it excellent for the filtration system. Solar irradiance is constrained by the Central Valley's winter tule fog season (December-January drops to 2.5-3.5 kWh/m²/day) but annual average of 5.7 kWh/m²/day is viable, and the battery storage system bridges the fog gaps. Multiple fiber carriers cross through the Valley on I-5 and SR-99 rights-of-way. The Hanford Public Library has previously engaged in rural connectivity initiatives and represents a natural community partner.

**Site 20: Tulare, CA — Score 85.5 (Tied Second)**

Tulare County seat (population 68,000) shares the San Joaquin Valley profile of Hanford with slightly better highway access via SR-99 and proximity to the Friant-Kern Canal's southern delivery system. The UP main line passes through with trackage connections. The Tulare Union High School District and Tulare Public Library system provide natural community partner infrastructure. Fiber connectivity is stronger here than at Hanford due to proximity to both Visalia (Tulare County seat for fiber POPs) and the Bakersfield terminal concentration. The agricultural water infrastructure in Tulare is among the most developed in California, providing multiple source options for the non-potable water intake.

**Site 12: Amarillo, TX — Score 81.0**

The Texas Panhandle's largest city (population 206,000) represents the eastern anchor of the BNSF Transcon deployment corridor. The BNSF Amarillo intermodal facility handles significant container volume, making it one of the most accessible delivery points in the corridor. While Amarillo itself is not underserved for broadband, the surrounding Panhandle communities within 30-50 miles are significantly underserved, and a node near Amarillo can serve as both a hub and a proving ground for the design. Solar irradiance at 5.9 kWh/m²/day is excellent. Water from the Canadian River Watershed is available. Multiple fiber carriers including AT&T, Windstream, and Lumen cross the Panhandle through the BNSF right-of-way. Texas's relatively favorable permitting environment for utility infrastructure and industrial siting is an additional advantage.

**Site 9: Socorro, NM — Score 81.5**

Socorro (population 9,000) is the seat of Socorro County, New Mexico, and home to New Mexico Tech (New Mexico Institute of Mining and Technology). The BNSF Rio Grande Corridor passes through with an active siding. The Rio Grande Bosque ecosystem sits 1.5 miles west of the rail line, providing Middle Rio Grande Conservancy District water access. The New Mexico Tech campus represents an exceptional community partner: engineering faculty who could contribute to the open-source design, student infrastructure who could maintain and monitor the node, and an existing culture of technical engagement with deployed systems. Solar irradiance at 6.1 kWh/m²/day is excellent. The BNSF corridor south of Albuquerque carries Lumen and Zayo conduits in parallel. BLM and state trust lands surround the town, providing low-cost land options. Notably, the adjacent Sevilleta National Wildlife Refuge and the National Radio Astronomy Observatory's Very Large Array (26 miles east) create environmental review considerations that need to be navigated carefully.

**Site 6: Winslow, AZ — Score 80.5 (Tied)**

Winslow (population 9,600) sits at the BNSF Transcon's midpoint through northern Arizona on the Colorado Plateau. The BNSF operates a working ramp facility here; the Transcon through Winslow carries some of the highest rail traffic density in the US — approximately 50+ trains per day. Fiber carriers follow the right-of-way directly. Solar irradiance at 6.1 kWh/m²/day is excellent, and the high desert's low humidity eliminates fog constraints. Water presents moderate complexity: the Little Colorado River drainage is the primary source, but water rights in Arizona require careful navigation through the Arizona Department of Water Resources. The Winslow Public Library, the Winslow Unified School District, and the local chapter of the Navajo Nation (whose reservation boundary lies 15 miles northeast) all represent potential community partners. BLM lands east and west of town are available at minimal cost.

**Site 15: Clovis, NM — Score 80.5 (Tied)**

Clovis (population 40,000) is Curry County's seat and a BNSF division point on the Southern Plains corridor. The BNSF operates a major yard and locomotive servicing facility in Clovis, providing immediate rail siding access. Solar irradiance of 5.9 kWh/m²/day is consistent. Fiber connectivity is strong: Windstream's New Mexico backbone crosses through Clovis, and AT&T has presence. Water comes from the Ogallala Aquifer via municipal wells, a reliable if declining resource. The Clovis-Carver Public Library and Eastern New Mexico University (main campus 20 miles south in Portales) provide community partner potential. New Mexico's favorable industrial permitting environment and existing BNSF relationships streamline the zoning process.

**Site 14: Tucumcari, NM — Score 80.0**

Tucumcari (population 5,000) is one of the most historically significant stops on the old Route 66 and the BNSF Transcon. The BNSF operates a yard here, and the town's position at the I-40/US-54 junction makes it a natural logistics node. Fiber from Lumen follows the BNSF right-of-way. Solar irradiance of 6.0 kWh/m²/day is excellent. Water access from Ute Lake reservoir (25 miles north) is available via Quay County Rural Water Supply Corporation infrastructure. The Tucumcari Public Library serves a population that is 60%+ unserved for broadband per FCC data, making the community case compelling. Land availability from BLM and state trust lands adjacent to the rail corridor is strong.

---

## 4. Site Preparation Specification

### 4.1 Foundation Requirements

The foundation is the single most critical site preparation element. The fully loaded compute node container weighs approximately 10,620 kg (23,400 lbs) and contains point loads at the rack feet that require structural distribution. The foundation must also position the container at a height and orientation that permits standard intermodal crane or truck delivery without requiring specialized heavy lift equipment at the site.

**Minimum Acceptable Foundation: Compacted Gravel Pad**

- Dimensions: 15m × 6m (container footprint 12.2m × 2.44m plus 1.4m clearance each end, 1.8m clearance each side)
- Subbase: 200mm compacted Class 2 aggregate base, proctor density >95%
- Surface: 150mm compacted 3/4" crushed aggregate, screened and leveled
- Leveling tolerance: ±25mm across full length and width (critical for rack plumb)
- Drainage: 2% cross-slope to perimeter swale; perimeter drain tile recommended in high water-table sites
- Corner bearing pads: 4× 600mm × 600mm × 150mm reinforced concrete pads at container corner casting locations, cast in-place, rated for 4,000 kg each
- Container tie-down: ISO corner casting anchor bolts, 4× minimum, grade 8 hardware
- Geotechnical requirement: Site-specific soils report required; expansive soils (common in Southwest) require over-excavation and engineered fill
- Reference standard: ASCE 7-22 for load calculations; ASTM D1557 for compaction testing

**Preferred Foundation: Reinforced Concrete Pad**

- Dimensions: 15m × 6m × 200mm thick (minimum)
- Reinforcement: #4 rebar at 18" on center each way, top and bottom mat for container loads
- Concrete: 3,500 psi (24 MPa) minimum, air-entrained in freeze-thaw climates, low w/c ratio in high-sulfate soils
- Corner embedments: 4× cast-in-place anchor bolt assemblies (ASTM F1554 Grade 55, 1" diameter minimum, 12" embedment) at ISO corner casting locations
- Surface finish: Broom finish for traction; sealed to prevent moisture intrusion
- Curing: Minimum 28-day cure before container placement; 7-day cure before any traffic
- Drainage: Positive slope to site perimeter (minimum 1.5% in each direction)
- Utility sleeves: Cast-in conduit sleeves for power (2×), water in (1×), water out (1×), fiber (1×), at container penetration locations
- PE stamp required in all US jurisdictions for slabs supporting structures >500 lbs per square foot

**Foundation Grade Check Protocol:**
Before container delivery, the foundation must pass a three-point level check:
1. Longitudinal centerline: differential <15mm over full 12.2m length
2. Transverse at front: differential <10mm across 2.44m width
3. Transverse at rear: differential <10mm across 2.44m width
Any out-of-tolerance condition must be corrected before delivery is scheduled.

### 4.2 Site Perimeter and Security

**Minimum Security Specification (Unmanned Remote Operation):**

- Fence: 6-foot chain-link, Type I galvanized, 9-gauge mesh, with 3-strand barbed wire top extension; posts at 10-foot centers
- Fence perimeter: 20m × 10m minimum (allows 3m maintenance clearance on all container sides)
- Access gate: 14-foot double swing gate (allows truck delivery), padlocked with contractor-grade lock, matching key system with community partner and maintenance team
- Lighting: 4× solar-powered LED area lights on 12-foot poles at fence corners; 4,000 lumen minimum each; motion-activated with 30-minute override
- IP cameras: 4× outdoor IP cameras covering all gate angles and container doors; local SD card storage, 30-day loop; optional cellular uplink for remote monitoring; no cloud storage dependency
- Container door: Replace stock ISO container door with security door: 14-gauge steel, commercial-grade multipoint lock, electronic keypad with audit log, keyed backup cylinder; rated for 30-minute forced-entry resistance
- Signage: All fence sides — property notice, utility warning, emergency contact number
- Fire extinguisher: 20-lb dry chemical ABC rated, mounted at gate entry on weatherproof bracket

**Advanced Security (High-Value Sites):**
- Vibration sensors on fence perimeter wiring, tied to local alarm relay
- Seismic sensor inside container (detects unauthorized movement or intrusion)
- Remote cellular uplink for status monitoring (temperature, door state, power state, water flow)

### 4.3 External Utility Connections

The compute node requires four external connection types. All penetrations into the container wall are made at the factory prior to shipment; the site work connects the external infrastructure to the container penetrations.

**Connection 1: DC Power Input**

The primary power connection from the solar/BESS system to the compute node. The solar array and battery storage system are separate from the container (see Section 5.1 on site layout); the power path runs from the DC bus to the container's power penetrations.

- Conductor: 4-AWG minimum THWN-2 conductors in 2" rigid conduit (or larger per NEC 310.15 ampacity calculations for site-specific load)
- Conduit: Schedule 40 PVC underground from BESS enclosure to container penetration; minimum 18" burial depth (NEC 300.5 for direct burial conduit)
- Penetrations: 2× conduit sleeves at container wall (one per power circuit for N+N redundancy)
- Disconnect: Lockable visible-blade disconnect switch at container wall, accessible from outside, rated for DC service (DC-rated switches differ from AC; verify rating per NEC 404.2)
- Grounding: Container chassis bonded to site ground electrode system (ground rod array, minimum 25 ohm resistance), per NEC Article 250
- GFPE: Ground Fault Protection of Equipment on DC input per NEC 230.95 requirements
- Conduit sealing: UL-approved conduit sealing compound at container wall penetration to prevent moisture and rodent ingress

**Connection 2: Water Intake**

Non-potable water from source (canal, agricultural ditch, treated effluent line) to the container's water intake penetration.

- Pipe: Schedule 80 PVC, 2" minimum diameter, sized for 20 GPM design flow with <2 psi pressure drop
- Source tap: Saddle tap or formal tee connection at source distribution line, with gate valve shutoff; connection requires source owner approval and in some cases state water rights compliance
- Coarse screen: Inline Y-strainer (minimum 40 mesh / 425 micron) immediately upstream of container penetration to protect filtration pre-filter from large debris
- Flow meter: Inline totalizing flow meter (nutating disc or paddlewheel) with local register and optional pulse output for remote monitoring
- Pressure regulation: Pressure reducing valve if source pressure exceeds 60 psi; container system is designed for 40-60 psi inlet
- Backflow prevention: Double check valve assembly immediately downstream of source tap, required by most state plumbing codes for non-potable connections (UPC 603.0, IPC 608.0)
- Pipe burial: 18" minimum burial depth in non-freeze climates; 36" or below frost line in freeze climates (ASCE 7-22 frost depth maps)
- Heat trace: Required for water lines at surface above grade in sites with winter temperatures below 28°F (-2°C); self-regulating heat trace cable with weather-resistant jacket

**Connection 3: Potable Water Output**

Clean filtered water from the container's output penetration to the community distribution point (piped to library, community garden, or municipal tap).

- Pipe: Schedule 40 CPVC (preferred for potable water) or Schedule 40 PVC (acceptable for below-grade runs), 1.5" minimum
- Flow meter: Required on output side; metered water delivery builds accountability and data for community reporting
- Sample tap: Required immediately at container output penetration for routine water quality testing; brass ball valve with hose bib fitting
- Disinfection notification: Some state drinking water programs require signage or monitoring for point-of-use filtration systems providing water to the public; verify with state program before commissioning
- Pipe identification: Blue pipe markers at 10-foot intervals on exposed runs: "POTABLE WATER — OCN FILTERED OUTPUT"
- Pressure gauge: At output penetration; normal operating pressure 35-50 psi after RO system

**Connection 4: Fiber**

Fiber optic cable from the nearest splice point on the carrier's long-haul conduit to the container's fiber penetration.

- Conduit: 1" PVC minimum, buried 24" below grade to frost line
- Cable type: OS2 single-mode fiber, armored underground rated (direct bury or in conduit), minimum 8 strands (provides two live pairs plus spare capacity for future upgrades)
- Splice chamber: Dome splice closure at the carrier's conduit tap point; requires carrier coordination, often a licensed OSP contractor is required by the carrier
- Patch panel: Inside container at fiber penetration, 1U fiber distribution unit, SC/APC or LC/UPC connectors per carrier standard
- Dark fiber option: If carrier conduit is accessible but carrier will not light the fiber, dark fiber IRU (Indefeasible Right of Use) agreements with Zayo or Lumen can provide multiple 10 Gbps or 100 Gbps wavelengths at fixed monthly cost
- Last-mile alternative: Where direct fiber connection to the carrier conduit is cost-prohibitive, fixed wireless (802.11ax/Wi-Fi 6E or licensed microwave) can provide backhaul in the range of 100 Mbps-1 Gbps for community use cases while direct fiber is arranged in parallel

**Connection 5: Waste Drum Access**

The 55-gallon waste drum (DOT 17H standard steel drum) sits in the cooling zone at the east end of the container. Access for drum swap (monthly) requires:

- Graded gravel path minimum 4 feet wide from gate to container east door
- Drum dolly rated for 500 lbs on gravel surface
- Concrete pad section at container door threshold (3m × 2m) for dolly maneuvering
- Container east door configured for full swing (not partial access) during drum swaps
- Drum inventory: Site stores 1 empty drum at all times for swap readiness; 2-drum storage is recommended
- Drum transport: Licensed waste hauler coordinates scheduled pickup; drum manifest tracking per EPA RCRA requirements if waste is classified as hazardous (typically non-hazardous for municipal water TDS waste, but confirm with local RCRA coordinator)

### 4.4 Solar Array and BESS Site Layout

The compute container is a load point. The solar array and battery storage system are co-located but physically separate elements. The site layout must accommodate all three within the secured perimeter or adjacent fenced areas.

**Typical Site Layout (2.5-4 acre total):**

```
N
^
|
[   Solar Array (600 kW nameplate, ~2.5 acres)   ]
[   Fixed-tilt single-axis tracking, facing south  ]
[                                                   ]
|                    DC Cables (buried)
v
[ BESS Container(s) ]──── DC Bus ────[ Compute Node ]
[ 2,000-4,000 kWh  ]                 [ 40ft HC ISO  ]
[ LFP, 1 or 2 containers ]           [ Container    ]
                                      |
                                [ Wind Turbine ]
                                [ 50-100 kW    ]
                                [ (if viable)  ]
```

**Separation Requirements:**
- BESS container(s) minimum 6m from compute container (NFPA 855 energy storage system separation)
- Wind turbine setback: 1.1× hub height from any structure (30m-60m depending on turbine size)
- Solar array row spacing: 1.5× panel height (for fixed-tilt) or single-axis tracker spacing per manufacturer
- Access roads within perimeter: 12-foot minimum width for maintenance vehicles

---

## 5. Transport Logistics

### 5.1 Intermodal Transport Sequence

The fully assembled and loaded Open Compute Node travels as a standard 40ft ISO container on standard intermodal equipment. No special permits are required for the container itself in rail transport; the weight at approximately 10,620 kg (23,400 lbs) is well within standard intermodal axle weight limits (rail loads are not constrained by the highway weight limits that govern trucking).

**Stage 1: Manufacturing Completion**

At the manufacturing facility (assumed to be in a major metro with rail access — Houston, Los Angeles, Chicago, or Albuquerque are candidates given industrial rail access), the container is assembled, tested on internal power (the battery system can power the container during transit if needed), all penetrations are sealed with transit plugs, and the mural artwork is applied. The container is then placed on a chassis for staging.

- Estimated manufacturing → ready-for-rail timeline: depends on manufacturing ramp; first unit likely 12-16 weeks from component delivery; steady-state 6-8 weeks per unit
- Transit sealing: All wall penetrations capped with threaded NPT plugs (power conduits), blind flanges (water ports), rubber gland seals (fiber), and foam fill for any gaps
- Shipping block: Internal racks secured with transit blocking per NVIDIA shipping requirements (rack foot bolts, CDU fluid drain-down, NVLink cable supports)
- Weight certification: Final weigh-in on certified scale; documentation for rail carrier load planning

**Stage 2: Rail Origination**

Container is loaded at the manufacturing facility's rail siding or trucked to the nearest intermodal terminal for train loading. Standard container train loading uses either reach stackers or overhead gantry cranes at intermodal facilities.

- BNSF Intermodal: Containers loaded on BNSF intermodal flatcars (articulated double-stack, 40ft well cars)
- UP Intermodal: Same standard equipment; 40ft HC ISO containers are standard on all US Class I intermodal equipment
- Bill of Lading: Standard hazmat declarations required for battery system (LFP batteries shipped installed in equipment are DOT Class 9 UN3536 or UN3537 depending on state of charge; coordinate with carrier's hazmat desk)
- Transit time: 3-7 days depending on route; BNSF Transcon Los Angeles to Amarillo approximately 3-4 days; UP Sunset Los Angeles to El Paso approximately 3-4 days

**Stage 3: Intermodal Terminal Unloading**

At the destination intermodal terminal (the nearest facility to the deployment site), the container is lifted off the flatcar by terminal equipment and transferred to a truck chassis.

- Equipment: Reach stacker or gantry crane at terminal; 40ft ISO HC is standard
- Dray booking: Terminal coordinates with local trucking company (dray carrier) for last-mile delivery; booking is typically made 48-72 hours in advance
- Notification: Terminal notifies receiver (OCN operations team) when container is available for pickup; normal free time at terminal is 2-5 days before per-diem storage charges begin

**Stage 4: Last-Mile Truck Delivery**

The container travels from the intermodal terminal to the deployment site by over-the-road truck on a chassis. Most intermodal chassis are designed for the container to remain on the chassis at the delivery point if required, but for permanent placement, the container is lifted off the chassis by crane or roll-off equipment.

- Truck type: Standard 40ft intermodal chassis pulled by Class 8 tractor
- Route survey required: Driver must confirm route to site can accommodate truck turning radius, bridge weight ratings, and overhead clearances (most US rural highways are adequate; county road bridge ratings should be confirmed)
- Crane lift at site: A hydraulic mobile crane (25-ton minimum capacity) is required to lift the container off the chassis and place it on the prepared pad
- Crane cost: $800-1,500 for typical rural Southwest setup; crane positioning requires flat stable ground adjacent to the pad
- Leveling: After placement, use hydraulic bottle jacks at corner castings to achieve final level tolerance; shim plates under corner pads as needed
- Alternative delivery for remote sites: Roll-off truck with container-mounted twist locks can deliver without a crane where the container's own corner castings can be used for a grade-level ground set, but this limits placement precision

**Stage 5: On-Site Connection**

After the container is placed and leveled on the foundation, the external utility connections are made in sequence:

1. Fiber: Fiber splice and patch panel termination (requires OSP technician; 1-2 day coordination with carrier)
2. Water intake: Connect source pipe to container intake penetration; open shutoff valve; verify flow and pressure at container inlet
3. Container power-up (battery): The BESS container, previously energized from a temporary grid source or local generator, provides initial power to the compute container through the DC bus connection
4. System self-test: Container performs automated power-on self-test, verifying all subsystems
5. Cooling system startup: CDU filled and circulated with coolant mix; check for leaks at all fittings
6. Water filtration startup: Filtration system initialized; first-flush discarded; water quality check at output
7. Compute system power-up: GPU racks powered on in sequence; DCIM monitoring brought online
8. Network connectivity: Fiber link tested; network stack brought up; community allocation configured
9. Water output connection: After water quality testing passes EPA NPDWR thresholds, output pipe connected to community distribution point
10. Operational handoff: Site walk with community partner; monitoring dashboard access transferred; emergency contact list established

**Typical Connection Timeline:**
- Day 1: Crane delivery, container placement, physical inspection
- Day 2-3: Fiber splice and termination
- Day 3: Water intake connection, initial flow test
- Day 4: BESS-to-container power connection, first power-up, system self-test
- Day 5-6: Cooling and filtration system startup, initial water quality sampling
- Day 7-10: Laboratory water quality results (24-48 hour turnaround typical for basic panels); compute power-up
- Day 10-14: Network configuration, community compute allocation setup
- Day 14: Operational commissioning, community partner handoff

---

## 6. Permitting Requirements by Jurisdiction

### 6.1 Federal Permits and Coordination

**BLM Land Use Authorization**

For sites on Bureau of Land Management land (common in New Mexico, Arizona, California, and Texas), a Right-of-Way Grant under 43 CFR Part 2880 is required. The BLM Field Office with jurisdiction over the site accepts applications; processing times vary from 60 days (simple ministerial actions) to 18+ months (if NEPA review is triggered).

- NEPA: A Computing infrastructure site under 5 acres with minimal ground disturbance typically qualifies for a Categorical Exclusion (CX) under 43 CFR 46.210, avoiding full Environmental Impact Statement (EIS). The water discharge from the filtration system and the solar array construction may require Environmental Assessment (EA) if the CX criteria are not met.
- NHPA Section 106: Required if BLM site; State Historic Preservation Office (SHPO) review for archaeological resources. The Southwest has high density of archaeological sensitivity; early coordination is strongly advised.
- Endangered Species Act Section 7: BLM must consult with U.S. Fish and Wildlife Service if the project may affect listed species. Many Southwest sites are in range of the Lesser Prairie Chicken, desert tortoise, or various listed cacti.

**FCC Regulatory Considerations**

The compute node as an earth-based internet access facility does not require FCC licensing unless the node includes radio transmission equipment. If fixed wireless backhaul is used (licensed microwave or unlicensed spectrum), Part 101 (microwave) licensing or Part 15 compliance for unlicensed bands applies.

**DOT / STB Railroad Coordination**

Any connection to the railroad right-of-way — including crossing the right-of-way for utility conduits to reach the site — requires a license or crossing agreement with the railroad. BNSF and UP have standard form crossing agreements available through their real estate departments; fees are nominal ($500-2,000 one-time), but the railroad typically requires insurance naming the railroad as additional insured and may take 90-180 days to process.

### 6.2 State Permits

**New Mexico**

- Construction permit: Municipal or county building permit required; in unincorporated areas, county planning and zoning department
- Electrical: New Mexico Construction Industries Division (CID) electrical permit required; solar and DC distribution systems require licensed electrician inspection
- Water: The New Mexico Office of the State Engineer (OSE) regulates all water use. Agricultural water applied to a new use (the filtration intake) may require a change of use application; coordinate with OSE early (processing time 6-24 months for contested applications). Discharge of filtered water to municipal infrastructure may require NMED surface water quality certification.
- Drinking water: New Mexico Environment Department (NMED) Drinking Water Bureau may require the filtration system to be permitted as a public water system if water is provided to >25 people. Early coordination essential.
- Air quality: No significant emissions; air quality permit likely not required for this use.

**Arizona**

- Building permit: Arizona Department of Real Estate and county building department (in unincorporated areas, county)
- Electrical: Arizona Department of Fire, Building and Life Safety (DFBLS) for commercial electrical; local utility territory may have additional requirements
- Water: Arizona Department of Water Resources (ADWR) requires registration of all water uses > 10 acre-feet per year. The filtration system may use 2-5 acre-feet per year, which may require formal registration. Arizona's water rights system is administered separately from federal water law; active management areas (Phoenix and Tucson AMAs) have additional restrictions.
- Drinking water: Arizona Department of Environmental Quality (ADEQ) Drinking Water division; same public water system threshold analysis as New Mexico
- Solar: Arizona has favorable net metering and distributed energy rules; grid interconnection (if any excess power is exported) governed by Arizona Corporation Commission

**California**

- Building permit: County or city building department; California Building Code (CBC) based on IBC with California amendments
- Electrical: California Code of Regulations Title 24, Part 3 (California Electrical Code based on NEC with amendments); local building department inspection
- Water: California State Water Resources Control Board (SWRCB) regulates water rights. Water from canals (Friant-Kern, Kings River) requires coordination with the irrigation district; treated effluent use for non-potable purposes governed by Title 22 recycled water regulations
- Drinking water: California Department of Public Health (CDPH) Division of Drinking Water; California has more stringent drinking water regulations than federal minimum; the filtration output must meet MCLs under California Code of Regulations Title 22. Public water system notification/permitting required if water serves >25 people
- CEQA: California Environmental Quality Act applies to discretionary approvals in California. Site preparation and utility connection may trigger CEQA review if the lead agency (city or county) determines the project may have significant environmental effects. CEQA review adds 3-12 months to project timeline in California.

**Texas**

- Building permit: Municipal for incorporated areas; county for unincorporated (most target sites in Texas Panhandle are in unincorporated areas with minimal permitting requirements)
- Electrical: Texas Department of Licensing and Regulation (TDLR) electrical inspection; relatively streamlined process
- Water: Texas Commission on Environmental Quality (TCEQ) regulates water rights. Groundwater is governed by groundwater conservation districts (Panhandle counties have GCDs); surface water requires TCEQ water right. Texas has a prior appropriation system; new water rights are increasingly difficult to obtain in water-stressed regions
- Drinking water: TCEQ Public Drinking Water program; same public water system analysis as other states
- Solar/electrical interconnection: Electric Reliability Council of Texas (ERCOT) for grid interconnection if excess power is exported; ERCOT has relatively streamlined small generator interconnection procedures

### 6.3 Local Permits

Regardless of state, the following local permits are typically required:

- **Zoning/land use**: Conditional use permit or variance if site is not pre-zoned for utility or light industrial use. Hearing process typically 60-120 days from application to approval.
- **Building permit**: For the foundation and any permanent structures (fencing, conduit, concrete work). Building permit processing 2-8 weeks in rural jurisdictions.
- **Electrical permit**: Separate from building permit in most jurisdictions; inspection by local authority having jurisdiction (AHJ).
- **Plumbing permit**: For water connections; inspection required before covering trenches.
- **Grading/drainage**: Some counties require a grading permit for earth disturbance >1 acre (relevant only if solar array ground preparation is included in the same permit).

---

## 7. Timeline: Order to Operational

### 7.1 Master Timeline Summary

The following timeline assumes a greenfield deployment at a Tier 1 candidate site (score 80+) on BLM land in New Mexico or Arizona, with all pre-application community partner coordination completed before the official start.

| Phase | Duration | Key Activities | Dependencies |
|-------|----------|----------------|--------------|
| Pre-Application | Weeks 1-4 | Community partner MOU, site survey, geotechnical report, water source coordination | None |
| Federal Permitting | Weeks 4-20 | BLM ROW application, NEPA CX, Section 106, railroad crossing agreement | Site survey complete |
| State/Local Permitting | Weeks 8-24 | Building permit, electrical permit, water use registration, drinking water coordination | Site survey, BLM approval in progress |
| Manufacturing | Weeks 8-28 | Container fabrication, rack procurement, systems integration, testing | Contract executed |
| Site Preparation | Weeks 20-28 | Foundation, fencing, perimeter conduit sleeves, access road | Building permit issued |
| Solar/BESS Installation | Weeks 22-30 | Solar array erection, BESS container installation, DC bus cabling | Site prep complete, electrical permit |
| Container Delivery | Week 28-32 | Rail transit, intermodal transfer, last-mile trucking, crane placement | Manufacturing complete, site prep complete |
| External Connections | Weeks 32-34 | Fiber splice, water connections, power connections | Container placed |
| Commissioning | Weeks 34-36 | System power-up sequence, water quality testing, compute bringup | All connections complete |
| Community Handoff | Week 36-38 | Partner training, monitoring setup, operational documentation | Commissioning complete |
| **Total** | **~38 weeks** | **~9.5 months order to operational** | |

### 7.2 Critical Path Analysis

The critical path for a first deployment is not manufacturing or construction — it is permitting. The two longest-duration permit processes are:

1. **BLM ROW Grant (12-20 weeks)**: NEPA review, Section 106, SHPO coordination. This is the governing constraint. Application should be submitted as early as possible, with the community partner MOU and site survey in hand.

2. **State Water Use Registration (8-24 weeks, state-dependent)**: New Mexico's OSE and Arizona's ADWR can take significantly longer if the water use triggers a contested case. Coordinate with state water authority before site selection is finalized — confirm that a suitable water right exists and is transferable.

The manufacturing timeline (16-20 weeks for the first unit) fits within the permitting window, so manufacturing can begin concurrent with permitting without risk of early completion.

**Acceleration Options:**

- **Private land deployment**: Avoids BLM process entirely; replaces with simpler county land use review (4-8 weeks). If the site can be on private land (agricultural land adjacent to the rail ROW), timeline drops by 8-12 weeks.
- **Pre-permitted industrial parks**: Some Southwest counties have established industrial parks adjacent to rail sidings with pre-issued utility easements and zoning. These sites can reduce permitting to 4-8 weeks for building/electrical/plumbing only.
- **State-owned land**: New Mexico State Land Office and Arizona State Land Department lease public trust land for utility purposes; state land leases are often faster than BLM ROW grants and can be processed in 8-12 weeks.

### 7.3 Steady-State Deployment Cadence

For a multi-site deployment program (10+ nodes), the permitting and manufacturing processes can be parallelized across sites. With four nodes in the permitting pipeline at any time and a manufacturing rate of one node every 6-8 weeks, the program can achieve operational nodes at a cadence of approximately one new operational site every 6-8 weeks after the initial 9-month ramp period.

---

## 8. NREL Solar Data Integration

### 8.1 NREL NSRDB Reference Data for Candidate Sites

The National Renewable Energy Laboratory's National Solar Radiation Database (NSRDB) provides irradiance data at 4km spatial resolution and 30-minute temporal resolution, with records extending back to 1998. The following data is extracted from NSRDB for the top candidate sites using the Physical Solar Model (PSM) v3 dataset.

**Annual Average GHI (Global Horizontal Irradiance) at Candidate Sites:**

| Site | NSRDB Grid Point | Annual Avg GHI (kWh/m²/day) | P90 GHI | Jan Avg | Jul Avg |
|------|-----------------|---------------------------|---------|---------|---------|
| Belen, NM | 34.66°N, 106.77°W | 6.08 | 5.61 | 4.12 | 8.24 |
| Hanford, CA | 36.33°N, 119.64°W | 5.72 | 5.20 | 2.89 | 8.63 |
| Tulare, CA | 36.21°N, 119.35°W | 5.68 | 5.17 | 2.84 | 8.58 |
| Socorro, NM | 34.06°N, 106.89°W | 6.14 | 5.68 | 4.18 | 8.29 |
| Amarillo, TX | 35.22°N, 101.83°W | 5.89 | 5.40 | 3.86 | 8.02 |
| Winslow, AZ | 35.02°N, 110.70°W | 6.13 | 5.67 | 4.20 | 8.31 |
| Clovis, NM | 34.40°N, 103.20°W | 5.88 | 5.38 | 3.83 | 7.99 |
| Tucumcari, NM | 35.17°N, 103.72°W | 5.96 | 5.47 | 3.91 | 8.09 |
| Benson, AZ | 31.97°N, 110.30°W | 6.40 | 5.94 | 4.52 | 8.48 |
| Willcox, AZ | 32.25°N, 109.83°W | 6.38 | 5.91 | 4.50 | 8.45 |
| Needles, CA | 34.85°N, 114.62°W | 6.65 | 6.20 | 5.08 | 8.62 |
| Barstow, CA | 34.90°N, 117.02°W | 6.44 | 5.98 | 4.87 | 8.41 |
| Truth/Cons, NM | 33.13°N, 107.25°W | 6.48 | 6.02 | 4.55 | 8.54 |

The P90 value (90th percentile of daily production, meaning the system will meet or exceed this on 9 out of 10 days) is the design value for battery storage sizing. The BESS must bridge the gap between P90 production and the 150 kW continuous load.

### 8.2 Battery Sizing from NSRDB Data

Using Socorro, NM (Score 81.5) as the reference design case:

- Annual average GHI: 6.14 kWh/m²/day
- P90 GHI: 5.68 kWh/m²/day
- Solar panel nameplate: 607 kW
- P90 daily production: 607 kW × 5.68 kWh/m²/day × panel efficiency factor (0.86, accounting for temperature, soiling, wiring losses) = 2,963 kWh/day
- Daily consumption: 150 kW × 24 hours = 3,600 kWh/day
- P90 deficit: 3,600 - 2,963 = 637 kWh/day
- Worst-case consecutive days: 3 days at P90 below average (documented in NSRDB data for November)
- Required BESS storage: 3 × 637 = 1,911 kWh, rounded up to 2,000 kWh minimum
- Recommended BESS: 3,000 kWh (provides safety margin and handles 20-day degraded winter period)

This confirms the research reference document's recommendation of 2,000-4,000 kWh BESS capacity.

---

## 9. BNSF and UP Intermodal Network Reference

### 9.1 BNSF Intermodal: Transcon Deployment Applications

The BNSF Transcon (Kansas City to Los Angeles via Amarillo and Albuquerque) is the highest-volume intermodal corridor in North America, carrying approximately 150-200 trains per day over its busiest sections. For OCN deployment logistics, the Transcon is significant not primarily because of its volume but because of its geography: it passes through exactly the communities most likely to become early OCN deployment sites.

BNSF's intermodal website and shipping portal (bnsf.com/ship-with-bnsf) provides rate quotes for container movements. Typical intermodal rates for a single 40ft container from Los Angeles or Chicago to a Transcon ramp in the Southwest are:

- Los Angeles (BNSF Hobart) → Amarillo: $1,800-2,400 (approximate, market-dependent)
- Los Angeles → Albuquerque: $1,600-2,200
- Los Angeles → Flagstaff: $1,400-1,900
- Chicago (BNSF Logistics Park) → Amarillo: $1,200-1,800

These rates are for a single move; project logistics costs are dominated by crane rental, site preparation, and utility connection rather than the rail move itself.

### 9.2 UP Sunset Route: Deployment Applications

Union Pacific's Sunset Route (New Orleans to Los Angeles via El Paso and Tucson) provides access to the highest-solar-irradiance corridor available in the continental US. UP's intermodal portal (upsinc.com or UP's own shipping tools) provides similar rate-quoting capabilities.

Key Sunset Route intermodal movements for OCN logistics:
- Los Angeles (UP City of Industry) → El Paso: $1,900-2,600
- Los Angeles → Tucson: $1,700-2,300
- Houston (UP) → El Paso: $1,100-1,600

UP also operates the Golden State Route through Tucumcari, NM and Tucson, providing an alternative to the Transcon for accessing the I-10 corridor from Texas.

### 9.3 Container Size Compatibility

Both BNSF and UP intermodal networks are fully compatible with 40ft HC ISO containers:

- BNSF well cars: 40ft low-profile wells on articulated cars accommodate 40ft HC containers without height restriction (clearances verified on Transcon and Sunset routes)
- UP well cars: Same; UP's network is cleared for HC containers on all major intermodal routes
- Double-stack: 40ft HC containers can be double-stacked on BNSF and UP equipment on routes with sufficient vertical clearance (most of the Southwest routes are cleared; some tunnels in California Central Valley may limit double-stack, but single-stack always clears)
- Weight: The loaded OCN container at 10,620 kg is well within the 29,000 kg per container limit for standard intermodal flatcars

---

## 10. Commissioning and Operational Readiness

### 10.1 Site Acceptance Protocol

Before the container is declared operational, a formal site acceptance inspection is conducted. The acceptance checklist is derived from the system success criteria in the vision document:

**Physical Inspection:**
- Foundation level check: confirm tolerance ±25mm longitudinal, ±10mm transverse (re-measure after container placement)
- Container exterior: no transit damage, mural intact, all penetrations sealed or connected
- Perimeter fence complete, gate operable, lock keys distributed
- Security lighting functional, cameras recording to local storage
- All external utility connections complete and labeled

**Electrical Acceptance:**
- DC bus voltage at container inlet: within 2% of design voltage
- BESS state of charge: >80% before compute power-up
- Container internal power distribution energized; PDU monitoring online
- Ground continuity tested: container chassis to ground electrode, <25 ohms

**Water System Acceptance:**
- Intake flow: measured at minimum 5 GPM; target 15-20 GPM
- Inlet pressure: 40-60 psi
- Filtration system initialized, all stage pressure differentials within manufacturer specification
- Water quality sample collected from output sample tap and sent to certified laboratory
- All water lines pressure-tested, no leaks at fittings
- Waste drum installed, empty, in position

**Compute System Acceptance:**
- Coolant loop: filled, circulated, checked for leaks; inlet temperature within 15-25°C
- GPU racks powered on; DCIM monitoring showing all GPU/CPU temperatures nominal
- Network connectivity: fiber link up, latency to nearest backbone POP measured and recorded
- Community compute allocation configured and tested from community partner location

**Water Quality Release:**

The site is not declared fully operational for the community water service until the laboratory water quality report confirms all NPDWR primary standards are met. Until that report is received, the filtration output is diverted and not provided to the community. This typically adds 5-10 days to the commissioning timeline but is non-negotiable for public health compliance.

### 10.2 Ongoing Operational Maintenance Schedule

**Monthly (on-site visit required):**
- Waste drum swap: remove full drum, insert empty drum; arrange pickup with waste hauler
- Sediment pre-filter replacement (Stage 1 filtration)
- Water quality quick-test (TDS meter, pH, turbidity) at output sample tap
- Solar panel visual inspection for soiling; clean if soiling exceeds 5% production impact (automated irradiance comparison from monitoring system)
- Physical security inspection: fence integrity, camera operation, access control

**Semi-Annual:**
- Activated carbon replacement (Stage 2 filtration)
- Mineral rebalancing media check and top-off (Stage 5 filtration)
- Full laboratory water quality test (comprehensive panel against 40 CFR 141 standards)
- BESS cell voltage balance check
- Solar array electrical inspection: connection resistance, string voltage uniformity
- Cooling system fluid quality check: pH, inhibitor concentration, particulate level

**Annual:**
- UV lamp replacement (Stage 4 filtration)
- Coolant full drain-and-replace or chemical analysis for extended service
- Compute hardware inspection: dust, connector integrity, firmware updates
- BESS capacity test: discharge cycle to measure actual vs. nameplate capacity
- Fiber link optical power measurement: verify no degradation since commissioning
- Security system review: camera footage quality, access log audit

**2-3 Year:**
- Reverse osmosis membrane replacement (Stage 3 filtration) — dependent on input water quality
- Complete water system pressure test
- Container exterior inspection: corrosion, mural condition, penetration seal integrity

---

## Appendix: Corridor Data Tables

### Rail Corridor Summary

| Corridor | Railroad | Length (mi) | Key Sites | Avg Solar (kWh/m²/day) | Fiber Carriers |
|----------|----------|-------------|-----------|------------------------|----------------|
| BNSF Transcon (SW segment) | BNSF | 1,100 | Amarillo, Albuquerque, Gallup, Winslow, Barstow | 5.9-6.5 | Zayo, Lumen, AT&T |
| UP Sunset Route | UP | 780 | El Paso, Deming, Lordsburg, Tucson, Yuma | 6.0-7.5 | Lumen L3, AT&T |
| BNSF Rio Grande Corridor | BNSF | 225 | Socorro, Belen, Los Lunas | 6.0-6.2 | Lumen, CenturyLink |
| UP Central Valley | UP | 200 | Bakersfield, Hanford, Tulare, Fresno | 5.4-6.0 | Zayo, AT&T, Frontier |
| BNSF Texas High Plains | BNSF | 120 | Lubbock, Canyon, Amarillo | 5.8-6.5 | Windstream, Lumen, AT&T |
| UP/BNSF I-10 Corridor | UP/BNSF | 280 | Las Cruces, Deming, Lordsburg | 6.0-6.8 | Lumen, AT&T |
| BNSF Southern Plains | BNSF | 180 | Clovis, Tucumcari, Fort Sumner | 5.8-6.0 | Windstream, Lumen |

### Full 20-Site Detail Table

| # | Site | GPS | Rail Carrier | Nearest Siding (mi) | Nearest IM Terminal (mi) | Solar (kWh/m²/day) | Fiber (<1mi) | Water Source | Community Partner | Land Type | Score |
|---|------|-----|--------------|--------------------|--------------------------|--------------------|-------------|--------------|-------------------|-----------|-------|
| 1 | Deming, NM | 32.27°N, 107.76°W | UP Sunset | 0.3 | 12 (UP Deming) | 6.40 | Lumen, AT&T | Mimbres River basin | Luna County Library | BLM/private | 77.5 |
| 2 | Lordsburg, NM | 32.35°N, 108.71°W | UP Sunset | 0.5 | 18 (UP Lordsburg) | 6.48 | Lumen | Lordsburg Playa | Hidalgo Co. Library | BLM | 73.5 |
| 3 | Willcox, AZ | 32.25°N, 109.83°W | UP Sunset | 0.4 | 35 (UP Tucson) | 6.38 | Lumen, AT&T | Willcox Playa/Sulphur Spgs | Willcox Public Library | BLM/private | 77.0 |
| 4 | Benson, AZ | 31.97°N, 110.30°W | UP Sunset | 0.3 | 32 (UP Tucson) | 6.40 | Lumen, AT&T | San Pedro River | Benson Public Library | Private/BLM | 77.5 |
| 5 | Holbrook, AZ | 34.90°N, 110.16°W | BNSF Transcon | 0.3 | 40 (BNSF Winslow) | 6.08 | Zayo | Puerco River drainage | Holbrook-Navajo Co. Library | BLM | 77.0 |
| 6 | Winslow, AZ | 35.02°N, 110.70°W | BNSF Transcon | 0.1 | 0 (BNSF Winslow ramp) | 6.13 | Zayo, Lumen | Little Colorado River | Winslow Public Library | BLM/private | 80.5 |
| 7 | Gallup, NM | 35.53°N, 108.74°W | BNSF Transcon | 0.2 | 22 (BNSF Gallup) | 5.94 | Zayo, Windstream | Puerco River | Gallup Public Library | BLM/private | 77.5 |
| 8 | Grants, NM | 35.15°N, 107.85°W | BNSF Transcon | 0.4 | 60 (BNSF Albuquerque) | 5.95 | Zayo, Lumen | San Jose River/MRGCD | Cibola Co. Library | BLM/state | 78.0 |
| 9 | Socorro, NM | 34.06°N, 106.89°W | BNSF Rio Grande | 0.5 | 75 (BNSF Albuquerque) | 6.14 | Lumen, Windstream | Rio Grande/MRGCD | NM Tech Library | BLM/state | 81.5 |
| 10 | Belen, NM | 34.66°N, 106.77°W | BNSF Transcon/RG | 0.1 | 18 (BNSF Belen yard) | 6.08 | Zayo, Lumen, AT&T | Rio Grande/MRGCD | Valencia Co. Library | BLM/private | 86.0 |
| 11 | Truth/Cons, NM | 33.13°N, 107.25°W | BNSF (limited) | 1.2 | 95 (BNSF Albuquerque) | 6.48 | Lumen | Elephant Butte Lake/Rio Grande | Sierra Co. Library | BLM/state | 78.0 |
| 12 | Amarillo, TX | 35.22°N, 101.83°W | BNSF Transcon | 0.1 | 0 (BNSF Amarillo IM) | 5.89 | Zayo, Lumen, AT&T, Windstream | Canadian River watershed | Potter Co. Library | Private | 81.0 |
| 13 | Dalhart, TX | 36.06°N, 102.52°W | BNSF | 0.4 | 55 (BNSF Amarillo) | 5.92 | Windstream, Lumen | Cimarron River drainage | Dalhart Public Library | Private/BLM | 76.0 |
| 14 | Tucumcari, NM | 35.17°N, 103.72°W | BNSF Transcon | 0.2 | 8 (BNSF Tucumcari yard) | 5.96 | Zayo, Lumen | Ute Lake/Conchas Lake | Quay Co. Library | BLM/private | 80.0 |
| 15 | Clovis, NM | 34.40°N, 103.20°W | BNSF | 0.1 | 0 (BNSF Clovis yard) | 5.88 | Windstream, Lumen, AT&T | Ogallala Aquifer | Clovis-Carver Library | Private | 80.5 |
| 16 | Portales, NM | 34.19°N, 103.33°W | BNSF branch | 0.6 | 18 (BNSF Clovis) | 5.88 | Windstream | Ogallala Aquifer | ENMU Library | Private | 77.5 |
| 17 | Barstow, CA | 34.90°N, 117.02°W | BNSF Transcon | 0.1 | 0 (BNSF Barstow IM) | 6.44 | Zayo, Lumen, AT&T | Mojave River (seasonal) | San Bernardino Co. Library | BLM | 79.5 |
| 18 | Needles, CA | 34.85°N, 114.62°W | BNSF/UP | 0.3 | 22 (BNSF Needles) | 6.65 | Lumen | Colorado River | San Bernardino Co. Library | BLM/tribal | 74.5 |
| 19 | Hanford, CA | 36.33°N, 119.64°W | UP Central Valley | 0.3 | 15 (UP Hanford) | 5.72 | Zayo, AT&T, Frontier | Friant-Kern Canal | Kings Co. Library | Private | 85.5 |
| 20 | Tulare, CA | 36.21°N, 119.35°W | UP Central Valley | 0.2 | 22 (UP Tulare) | 5.68 | Zayo, AT&T | Friant-Kern Canal | Tulare Co. Library | Private | 85.5 |

---

*MRGCD = Middle Rio Grande Conservancy District. IM = Intermodal. BLM = Bureau of Land Management.*

---

## Sources and Reference Standards

**Infrastructure Data:**
- BNSF Railway intermodal network map and terminal directory (bnsf.com)
- Union Pacific intermodal facilities directory (up.com)
- Surface Transportation Board Class I railroad definitions and network data
- FCC National Broadband Map (broadbandmap.fcc.gov) — Census Block fiber coverage data
- BLM GeoBOB land status GIS layers (blm.gov/gis)

**Solar and Energy:**
- NREL National Solar Radiation Database (NSRDB) PSM v3 — 4km grid, 1998-2023 historical data (nsrdb.nrel.gov)
- NREL PVWatts Calculator — system performance modeling methodology
- NREL Annual Technology Baseline — solar and wind capacity factor reference values

**Engineering Standards:**
- ASCE 7-22: Minimum Design Loads and Associated Criteria for Buildings and Other Structures
- ACI 318-19: Building Code Requirements for Structural Concrete
- ASTM D1557: Standard Test Methods for Laboratory Compaction Characteristics of Soil
- NFPA 70 (NEC 2023): National Electrical Code
- NFPA 855: Standard for the Installation of Stationary Energy Storage Systems
- DOT 49 CFR Part 173: Hazardous Materials — shipping classification for batteries (UN3536, UN3537)
- EPA 40 CFR Part 141: National Primary Drinking Water Regulations
- UPC (Uniform Plumbing Code) and IPC (International Plumbing Code)

**Permitting:**
- 43 CFR Part 2880: Rights-of-Way Under the Federal Land Policy and Management Act
- 43 CFR Part 46: NEPA compliance procedures for BLM
- NHPA Section 106: Historic preservation review process
- ESA Section 7: Interagency consultation procedures
- California CEQA Guidelines (14 CCR Section 15000 et seq.)

---

> This document is part of the Open Compute Node research series. Cross-reference with 02-power-systems.md for solar/BESS system engineering, 03-cooling-water-systems.md for filtration system specifications, and 04-compute-systems.md for rack-level hardware details.
