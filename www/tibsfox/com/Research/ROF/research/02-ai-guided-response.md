# After the Wave

> **Domain:** Emergency Response & AI Systems
> **Module:** 2 -- AI-Guided Search & Rescue and Structural Retrofitting
> **Through-line:** *Human operators guide. AI optimizes.* The machine processes faster than humans can. The human decides faster than any machine should. The division of labor is not a compromise -- it is the system design.

---

## Table of Contents

1. [Post-Event Coordination Under Degraded Infrastructure](#1-post-event-coordination-under-degraded-infrastructure)
2. [Drone Swarms in Disaster Response](#2-drone-swarms-in-disaster-response)
3. [Satellite Imagery for Damage Assessment](#3-satellite-imagery-for-damage-assessment)
4. [Probabilistic Survivor Location Modeling](#4-probabilistic-survivor-location-modeling)
5. [Debris Field Routing](#5-debris-field-routing)
6. [Structural Retrofitting and Climate Adaptation](#6-structural-retrofitting-and-climate-adaptation)
7. [AI Prioritization for Retrofit Programs](#7-ai-prioritization-for-retrofit-programs)
8. [Community Override Mechanism](#8-community-override-mechanism)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. Post-Event Coordination Under Degraded Infrastructure

**The coordination problem:**
A major CSZ rupture would disable the normal infrastructure for emergency coordination:
- Cell networks: towers structurally damaged, backup power limited to hours
- Internet: backbone infrastructure damaged, fiber breaks at hundreds of locations
- Roads: bridges down, landslides blocking routes, liquefaction rendering roads impassable
- Power: grid down for days to weeks in heavily affected areas
- Command centers: buildings may be damaged, personnel may be casualties or managing their own households

**What remains:**
- Battery-powered radio networks with pre-positioned repeaters
- Satellite communication (Starlink and similar)
- Deployed drone swarms operating on pre-loaded mission parameters
- Mesh radio networks (LoRa/Meshtastic) pre-deployed by the cooperative
- Paper maps and established protocols (no digital dependency for base operations)

**The AI coordination role:**
AI systems pre-loaded on edge hardware (computers not dependent on network connectivity) can:
- Track known survivor locations based on last pre-event communication
- Model probable inundation zones using pre-computed tsunami models
- Generate optimal search priority lists based on population density, building vulnerability, and time elapsed since event
- Route search teams through debris fields using UAV aerial imagery

AI systems cannot direct field operations. Human incident commanders at each response sector make tactical decisions. The AI provides processed information and suggestions; the human decides.

---

## 2. Drone Swarms in Disaster Response

**The aerial survey problem:**
After a major earthquake and tsunami, the geography changes. Roads that existed before are buried, blocked, or destroyed. Buildings that were standing are rubble. The pre-event map is no longer accurate. Rescue teams need current situational awareness to operate.

**Drone capabilities for disaster response:**
- Fixed-wing UAVs: long endurance (2-4 hours), covers large areas, ideal for coastal survey
- Multirotor drones: hover capability, close-inspection, can operate in urban debris fields
- Thermal imaging: detects body heat signatures through debris, smoke, and low visibility
- Optical/photogrammetry: high-resolution imagery for damage mapping and route identification

**Swarm architecture:**
Individual drones have limited range, battery life, and sensor capacity. A coordinated swarm of 10-50 small drones can:
- Divide the search area into sectors with automatic overlap
- Relay imagery to a central processing point in real time
- Return to charging stations (pre-positioned) and redeploy autonomously
- Provide continuous coverage of a large area with redundant sensor coverage

**Tribal workforce deployment:**
The drone operators trained through the Module 04 workforce pipeline are the human supervisors for drone swarm operations. Tribal community members who are trained drone operators understand their local geography, know which areas have the highest population concentration, and can redirect swarm operations based on local knowledge that no model captures.

---

## 3. Satellite Imagery for Damage Assessment

**The rapid imagery problem:**
Commercial satellite imagery can provide high-resolution coverage of affected areas within hours of a major event. Multiple commercial providers (Maxar, Planet, Airbus, BlackSky) maintain agreements with emergency management agencies for rapid image delivery after declared disasters.

**What satellite imagery provides:**
- Extent of inundation (post-tsunami water coverage)
- Building collapse patterns (before/after comparison)
- Road passability (debris, bridge integrity, surface damage)
- Fire spread (from post-earthquake fires in urban areas)
- Port and harbor damage (for maritime response coordination)

**AI-assisted analysis:**
Human analysts cannot review high-resolution imagery of thousands of square miles in hours. AI-assisted damage detection tools:
- Automatically flag potential building collapses for human review
- Classify road segments by estimated passability
- Identify potential large-scale fire hazards
- Generate damage probability maps for response prioritization

**Data sovereignty:**
Satellite imagery of tribal territory is sovereign data. The Ring of Fire cooperative's data governance protocols (Module 05) specify that imagery of tribal lands collected for disaster response is controlled by the tribal nation and cannot be shared with non-emergency parties without tribal consent.

---

## 4. Probabilistic Survivor Location Modeling

**The search priority problem:**
Search and rescue resources are finite. In the aftermath of a major disaster, there are more locations to search than resources to search them simultaneously. The question of where to search first is a triage decision with life-and-death stakes.

**The probabilistic model inputs:**
- Population density maps (pre-event census and tribal enrollment records)
- Building type and structural vulnerability (from retrofit programs, see Section 6)
- Inundation model results (which areas were flooded, to what depth, at what velocity)
- Time since event (survival probability decreases over time; search priorities shift)
- Pre-event known locations (last cell tower ping, known workplace or home locations)
- Hospital and medical facility locations (to route survivors with injuries)

**Model output:**
A probability map of survivor location, updated continuously as search results are reported. Each completed search sector reduces uncertainty in adjacent sectors. The model guides the prioritization of remaining searches, concentrating resources on highest-probability areas.

**The certainty limit:**
No model knows where every person is. Population density maps are not individual location records. The probabilistic model guides search priorities; it does not replace systematic search. The human incident commander decides when a sector has been sufficiently searched and resources should be redirected.

---

## 5. Debris Field Routing

**The route problem:**
After a major earthquake and tsunami, roads are obstructed at dozens to hundreds of locations. The pre-event road network cannot be used without modification. Emergency responders need routes that are passable given current debris field conditions.

**Drone-assisted route finding:**
UAVs survey road segments and report passability in near-real-time. The AI routing system:
- Integrates UAV imagery and passability classification
- Calculates optimal routes for emergency vehicles (including clearance requirements for different vehicle types)
- Updates route recommendations as new information arrives
- Identifies chokepoints where debris clearance would unlock multiple route alternatives

**The local knowledge advantage:**
Tribal emergency managers and community members know informal routes -- logging roads, ATV paths, beach access points -- that do not appear in standard road network databases. The cooperative's workforce pipeline trains tribal members as route scouts who combine AI route optimization with local knowledge to find paths that no model predicted.

**Coordination with neighboring jurisdictions:**
The Ring of Fire cooperative's federated AI architecture allows real-time route information sharing between tribal nation emergency management, county emergency management, Washington Emergency Management Division, and Oregon Office of Emergency Management. Each jurisdiction controls its own data; shared situational awareness is the output.

---

## 6. Structural Retrofitting and Climate Adaptation

**The unified resilience challenge:**
Seismic resilience and climate resilience are traditionally addressed as separate programs. The Ring of Fire cooperative unifies them because many Pacific Rim communities face compound risk:

- **Seismic vulnerability:** Buildings constructed before modern seismic codes (pre-1994 in most jurisdictions) may not survive a M9.0 shaking event
- **Coastal inundation:** Sea level rise increases the baseline flood risk before any earthquake
- **Storm surge:** Climate change intensifies coastal storms, increasing surge height
- **Wildfire destabilization:** Slope destabilization from wildfire increases mudslide risk, which interacts with seismic shaking
- **Permafrost degradation:** In Alaska and Northern Canada, permafrost degradation undermines building foundations built on frozen ground

**Vertical evacuation structures:**
A vertical evacuation tower is a structure designed to:
- Survive the shaking of a M9.0 earthquake
- Elevate occupants above tsunami inundation depth (typically 30-50 feet above current sea level for Pacific Northwest coastal sites)
- Be reachable within 10-15 minutes of walking from homes and workplaces
- Serve as a community shelter post-event (food, water, communication equipment stored inside)

The Quinault Indian Nation's Taholah village has received planning support for vertical evacuation towers -- the Taholah Community Relocation project is the highest-profile example of near-source evacuation planning for a Pacific Northwest tribal community.

**Base isolation:**
For existing buildings that cannot be relocated or replaced, base isolation inserts a flexible bearing layer between the foundation and the structure. The bearing absorbs seismic energy before it reaches the building above. Base isolation is expensive but highly effective for critical facilities (hospitals, emergency command centers, schools used as shelters).

**Permafrost-adaptive foundations:**
In Alaska and Yukon tribal communities, buildings must be designed for foundations that may thaw and subside. Thermopile foundations, adjustable pier systems, and structures designed for differential settlement are the technical responses.

---

## 7. AI Prioritization for Retrofit Programs

**The resource allocation problem:**
A community cannot retrofit every building simultaneously. Resources (funding, workforce, materials) must be prioritized. The question is how to decide which buildings to retrofit first.

**The AI prioritization model variables:**
- **Occupancy:** How many people are in the building, and when? A school with 400 children during the day has higher daytime priority than a warehouse.
- **Vulnerability:** Structural type and construction date determine seismic vulnerability. Unreinforced masonry built before 1960 has higher priority than a modern steel-frame building.
- **Inundation proximity:** How close is the building to the projected tsunami inundation zone? A vulnerable building 30 feet from the inundation edge has higher priority than the same building 2 miles inland.
- **Shelter role:** Buildings designated as post-event shelters have higher priority than comparable buildings without that designation.
- **Cultural significance:** Community anchor institutions -- a tribal longhouse, a community center, a language preservation facility -- have priority that reflects their irreplaceable value.
- **Community priority:** The community's own prioritization, surfaced through participatory planning processes, informs the model.

**Model output:**
A ranked retrofit priority list with a justification for each ranking. The justification is transparent and auditable -- the community can see exactly why building A was ranked above building B.

**The transparency requirement:**
The cooperative's founding principles require that all AI decision-making affecting communities be explainable. No black-box prioritization. Every ranking has a stated reason. Every community member affected by a retrofit decision can understand the basis for it.

---

## 8. Community Override Mechanism

**The sovereignty principle:**
No AI model has more authority than the community it serves. The retrofit prioritization model is a tool; the community decides.

**Override mechanisms at each decision level:**

1. **Household level:** A homeowner can request adjustment to their building's priority ranking. The request is reviewed by the cooperative's workforce coordinators. The AI model's recommendation is a starting point, not a mandate.

2. **Community level:** The tribal nation's elected leadership or cooperative board can override the model's prioritization for an entire community. If a community decides that the language preservation center is the first priority regardless of the model's output, that decision is recorded and implemented.

3. **Program level:** The cooperative's board reviews the overall retrofit prioritization quarterly and can adjust model parameters. If the model's outputs consistently do not match community values, the parameters change.

**Documentation:**
Every override is documented with the stated reason. The documentation serves two purposes:
- Accountability (the decision record is auditable)
- Model improvement (overrides reveal where the model's values diverge from community values, allowing parameter adjustment)

The model learns from the communities it serves. The override mechanism is the feedback loop that makes the AI more accurate over time -- not to the original training data, but to actual community priorities.

---

## 9. Cross-References

| Project | Connection |
|---------|------------|
| [ROF-01](page.html?doc=01-early-warning-detection) | Early warning feeds into post-event response |
| [OCN](../OCN/index.html) | Container compute for edge AI deployment in disaster response |
| [CMH](../CMH/index.html) | Mesh networking for degraded-infrastructure communication |
| [NND](../NND/index.html) | Infrastructure resilience; corridor as post-event evacuation route |
| [SYS](../SYS/index.html) | Systems administration for AI response infrastructure |
| [HGE](../HGE/index.html) | Tribal governance models; sovereignty frameworks |

---

## 10. Sources

1. [FEMA: Post-Disaster Response Guidelines](https://www.fema.gov/) -- SAR protocols
2. [USGS: ShakeAlert and SAR coordination](https://www.usgs.gov/) -- Detection-to-response integration
3. [Quinault Indian Nation: Taholah Village Relocation](https://quinaultindiannat.gov/) -- Vertical evacuation planning
4. [WA Emergency Management Division](https://mil.wa.gov/emergency-management-division) -- State response protocols
5. [OR Office of Emergency Management](https://www.oregon.gov/oem/) -- Oregon response framework
6. [NOAA DART: Post-event coordination](https://www.pmel.noaa.gov/dart/) -- Maritime response data
7. [FHWA: Bridge seismic vulnerability](https://www.fhwa.dot.gov/) -- Infrastructure damage assessment
8. [ARC Solutions: Wildlife and emergency crossing design](https://arc-solutions.org/) -- Structure resilience reference
