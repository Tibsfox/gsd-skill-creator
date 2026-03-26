# The 326th Year

> **Domain:** Seismic & Tsunami Early Warning
> **Module:** 1 -- Early Warning & Detection: Cascadia Subduction Zone
> **Through-line:** *The Cascadia Subduction Zone last ruptured on January 26, 1700. The recurrence interval is 200-600 years. We are at 326.* The geology is already a network. The question is whether the humans living on these plates can build one that mirrors it.

---

## Table of Contents

1. [The Cascadia Subduction Zone](#1-the-cascadia-subduction-zone)
2. [ShakeAlert: The Seismic Sensor Network](#2-shakealert-the-seismic-sensor-network)
3. [DART Buoys: Deep Ocean Tsunami Detection](#3-dart-buoys-deep-ocean-tsunami-detection)
4. [The Near-Source Warning Gap](#4-the-near-source-warning-gap)
5. [COSZO: The Offshore Observatory](#5-coszo-the-offshore-observatory)
6. [AI Signal Processing in Early Warning](#6-ai-signal-processing-in-early-warning)
7. [Last-Mile Delivery to Tribal Communities](#7-last-mile-delivery-to-tribal-communities)
8. [The Human-in-the-Loop Decision Gate](#8-the-human-in-the-loop-decision-gate)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. The Cascadia Subduction Zone

**Physical description:**
The Cascadia Subduction Zone (CSZ) is a 620-mile convergent plate boundary running from Northern California through Oregon and Washington to British Columbia. At the CSZ, the Juan de Fuca Plate dives beneath the North American Plate at approximately 3-4 cm/year. As the plates lock, stress accumulates. When the lock breaks, it releases as a magnitude 9.0+ earthquake.

**The 1700 rupture:**
The CSZ last fully ruptured on January 26, 1700 -- precisely dated because the trans-Pacific tsunami reached Japan, where historical records documented the arrival time. The earthquake was so large it produced orphan tsunamis (waves without felt shaking) as far as the coast of Japan. The rupture likely lasted 3-5 minutes and generated a tsunami that inundated the Pacific Northwest coast within 15-20 minutes.

**Recurrence and current position:**
Research on the Cascadia fault's history through analysis of buried coastal marshes, turbidite deposits, and offshore sediment cores has identified approximately 43 full or partial rupture events in the past 10,000 years. Recurrence interval: 200-600 years, with a mean of approximately 243 years. Current elapsed time since last rupture: 326 years (as of 2026).

**The probability:**
USGS estimates a 37% probability of a Cascadia magnitude 8.0+ earthquake in the next 50 years, and a 10-15% probability of a full M9.0+ rupture in the same period. The fault is not "overdue" in a mechanical sense -- subduction zones do not operate on clocks -- but the elapsed time is within the historically observed recurrence range.

**Scope of impact:**
A full CSZ rupture would affect:
- The Oregon and Washington coasts from Astoria to Neah Bay with tsunami inundation in 15-20 minutes
- Portland, Seattle, and dozens of smaller cities with severe ground shaking
- Critical infrastructure: I-5, I-90, I-84, the Columbia River bridges, Seattle-Tacoma International Airport, Oregon's petroleum pipeline infrastructure
- Dozens of tribal communities with traditional coastal territory

---

## 2. ShakeAlert: The Seismic Sensor Network

**What ShakeAlert is:**
ShakeAlert is the West Coast earthquake early warning system operated jointly by USGS, Caltech, University of Washington, and state emergency management agencies. It is operational for public alerts in California, Oregon, and Washington as of 2024.

**How it works:**
Seismic sensors detect the P-wave (primary, compressional wave) that travels faster than the S-wave (secondary, shear wave) and the surface waves that cause the most damage. The P-wave travels faster but carries less destructive energy. ShakeAlert detects the P-wave from seismic sensors and issues a warning before the more destructive S-wave arrives.

**Network scale:**
- 1,500+ seismic sensors across the West Coast
- GPS/GNSS stations that measure ground displacement in real time
- Processing infrastructure at USGS and partner universities
- Distribution via Wireless Emergency Alert, MyShake app, local siren systems

**Warning time:**
For a CSZ M9.0 rupture, ShakeAlert would provide:
- Seattle: approximately 5-7 minutes of warning (ground shaking less severe at distance, but still significant)
- Portland: approximately 3-5 minutes
- Coastal communities: near-zero warning before shaking begins (on top of fault zone)

**The coastal community limitation:**
ShakeAlert's warning time decreases to seconds or zero for communities directly above the fault zone. The coastal tribal communities of the Olympic Peninsula, the Oregon Coast, and Northern California sit closest to the rupture zone and have the least warning time. This is the near-source gap.

---

## 3. DART Buoys: Deep Ocean Tsunami Detection

**What DART buoys are:**
Deep-ocean Assessment and Reporting of Tsunamis (DART) buoys are moored ocean instruments that detect the small sea floor pressure changes caused by a passing tsunami wave. The DART network is operated by NOAA's National Data Buoy Center and Pacific Tsunami Warning Center.

**How the network works:**
- Bottom Pressure Recorder (BPR) on the ocean floor detects changes in water column pressure
- Moored surface buoy transmits data via satellite in real time
- NOAA algorithms process pressure data to determine tsunami amplitude and estimated arrival time

**Fourth-generation DART performance:**
DART 4th-generation buoys detect tsunamis 10-15 minutes earlier than previous-generation systems. For far-field tsunamis (from Japan, Chile, Alaska) this improvement provides meaningful additional warning time. For near-source Cascadia tsunamis, the improvement matters less -- the earthquake and tsunami occur in the same region as the communities at risk.

**DART network gaps:**
The current DART network is optimized for far-field tsunami warning. Near-source Cascadia detection relies on DART buoys positioned offshore of the Pacific Northwest, but the geometry reduces effective warning time for coastal communities. Enhancing the near-source network with additional offshore instrumentation is the COSZO mission (see Section 5).

---

## 4. The Near-Source Warning Gap

**The critical vulnerability:**
The University of Washington's 2019 feasibility study identified the near-source warning gap as the most significant unaddressed vulnerability in Pacific Northwest tsunami preparedness.

**The gap:**
- Far-field tsunami warning (from Japan, Alaska, Chile): 4-24 hours -- sufficient for evacuation
- Near-source Cascadia warning: 15-30 minutes after shaking begins at inland areas; less for coastal communities
- For coastal tribal communities: tsunami arrives 15-20 minutes after rupture; warning must reach all residents and initiate evacuation in that window

**What 15-20 minutes requires:**
A successful near-source tsunami evacuation in 15-20 minutes requires:
1. Warning received within 2-3 minutes of rupture
2. Warning understood and acted on (not confused with non-dangerous earthquakes)
3. Population within walking/running distance of high ground or vertical evacuation structures
4. No infrastructure failure preventing evacuation routes

Each of these requirements is a system design problem, not just a sensor problem. Warning delivery, community education, evacuation infrastructure, and route resilience all matter.

**The tribal community specific challenge:**
Many Pacific Northwest coastal tribal communities have traditional territory on low-lying coastal land. The Quinault Indian Nation's Taholah village sits at the mouth of the Quinault River at near-sea-level elevation. The entire village is in the inundation zone. Evacuation requires movement to high ground along a specific route. If the bridge connecting the village to high ground fails in the earthquake (likely for bridges on soft soil near the coast), the evacuation route is severed.

---

## 5. COSZO: The Offshore Observatory

**What COSZO is:**
The Cascadia Offshore Seismic and Tsunami Observatory (COSZO) is an NSF-funded initiative to add instrumentation to the Ocean Observatories Initiative (OOI) Regional Cabled Array -- a fiber optic cable network already running along the Juan de Fuca plate offshore of Washington and Oregon.

**What it adds:**
- Seismic sensors directly on the Juan de Fuca plate -- detecting rupture at its source
- Ocean bottom pressure sensors for near-source tsunami detection
- Integration with existing ShakeAlert and DART networks

**Why it matters for near-source warning:**
COSZO instruments on the Juan de Fuca plate will detect the P-wave from a CSZ rupture before it reaches onshore sensors. This adds critical seconds to the onshore warning time -- and for coastal communities, seconds translate directly to meters of evacuation distance.

**Status (2026):**
COSZO instrumentation is in phased deployment. The OOI Regional Cabled Array provides the backbone infrastructure. Additional sensors are being added through NSF grants and partnerships with USGS and NOAA.

---

## 6. AI Signal Processing in Early Warning

**The signal processing problem:**
Earthquake early warning requires distinguishing a tsunamigenic earthquake from the continuous background of smaller, non-threatening seismic events. False warnings cause evacuation fatigue -- if communities evacuate for non-threats repeatedly, they become less likely to evacuate for actual threats. False non-warnings (missing a real event) are catastrophic.

**Where AI adds value:**
- Pattern recognition across multi-sensor arrays that exceeds human processing speed
- Integration of ShakeAlert seismic data + DART pressure data + GPS ground motion data into a single probabilistic tsunami assessment
- Reduction in processing time from detection to alert issuance
- Rapid assessment of tsunami amplitude and inundation extent modeling

**The HITL principle (see Section 8):**
AI processes the signals and issues a preliminary threat assessment. The human emergency manager makes the evacuation decision. The AI does not command evacuations. The AI presents information and a probability estimate; the human decides.

**Federated AI for inter-network integration:**
The Ring of Fire Trade Network's federated AI architecture (Module 05) applies specifically to early warning: sensor networks in different jurisdictions (USGS in the US, Geological Survey of Canada, Japan Meteorological Agency) share processed data without sharing raw data or surrendering network control. Each jurisdiction's AI system processes locally; results are shared for integration.

---

## 7. Last-Mile Delivery to Tribal Communities

**The communication failure mode:**
In a major earthquake, cell towers fail (structural damage, power loss), internet infrastructure fails, and landlines fail. The communication channels that work in normal conditions are the channels that fail first in the disaster.

**Last-mile requirements:**
Warning delivery to tribal communities must work when:
- Cell towers are down
- Power grid is down
- Internet is down
- Roads are damaged (no vehicle-delivered warning)

**The solution stack:**
- **LoRa/Meshtastic mesh networks:** Low-power, long-range radio mesh networking that operates without central infrastructure. Devices relay messages peer-to-peer. A network of LoRa devices throughout a community can deliver warning messages even when all centralized infrastructure has failed.
- **NOAA Weather Radio:** Operates on dedicated frequency, hardened against disaster conditions. Reaches communities with dedicated receiver devices.
- **Sirens:** Physical acoustic warning that requires no receiver device. The legacy system that still works when everything else fails.
- **Satellite communication:** Starlink and similar LEO satellite networks provide backup connectivity in degraded terrestrial infrastructure conditions.

**The Ring of Fire mesh network:**
Module 04 (Workforce Development) describes the workforce pipeline for deploying mesh network infrastructure in tribal communities. The same workers who install seismic sensors and retrofit buildings deploy the LoRa mesh that carries last-mile warning. The workforce development program and the early warning infrastructure are the same project.

---

## 8. The Human-in-the-Loop Decision Gate

**Why HITL is non-negotiable:**

Automated evacuation orders create liability, political, and practical problems:
- Mandatory evacuations have legal authority implications that vary by jurisdiction
- False automated orders erode trust (evacuation fatigue)
- Community-specific context (a small earthquake felt by residents may or may not require evacuation; residents' local knowledge matters)
- Tribal sovereignty: tribal emergency managers have authority over evacuation decisions on tribal land

**The HITL design:**
1. ShakeAlert + DART + COSZO + AI processing generates a threat level: LOW / MODERATE / HIGH / CRITICAL
2. At MODERATE or above, the system alerts tribal emergency managers and county/state emergency management
3. Human emergency manager reviews the AI assessment, including confidence level and supporting data
4. Human emergency manager issues or withholds evacuation order
5. If the human cannot be reached within 60 seconds and threat level is CRITICAL, the system may issue a preliminary public alert (community-determined threshold)

**The cooperative governance of the HITL threshold:**
Each community in the Ring of Fire cooperative determines its own HITL threshold. A community with high evacuation fatigue history (many past false alarms) may set a higher automated alert threshold. A community with documented infrastructure vulnerability (like Taholah) may set a lower threshold. The system serves community-specific risk tolerance, not a standardized national policy.

---

## 9. Cross-References

| Project | Connection |
|---------|------------|
| [NND](../NND/index.html) | Corridor infrastructure resilience; seismic design requirements |
| [OCN](../OCN/index.html) | Container compute for AI signal processing; edge deployment |
| [SAL](../SAL/index.html) | Salmon and coastal ecosystem monitoring tied to early warning network |
| [HGE](../HGE/index.html) | Tribal sovereignty frameworks; Colville model for cooperative governance |
| [THE](../THE/index.html) | Thermal energy systems for off-grid warning station power |
| [ECO](../ECO/index.html) | Coastal ecology monitoring integrated with sensor network |

---

## 10. Sources

1. [USGS ShakeAlert](https://www.usgs.gov/programs/earthquake-hazards/shakealert) -- Sensor network and warning system
2. [NOAA PMEL: DART Program](https://www.pmel.noaa.gov/dart/) -- Tsunami buoy network
3. [COSZO / NSF Ocean Observatories Initiative](https://oceanobservatories.org/) -- Offshore observatory
4. [PNSN: Pacific Northwest Seismic Network](https://pnsn.org/) -- Regional seismic monitoring
5. [USGS: Cascadia Subduction Zone](https://www.usgs.gov/programs/earthquake-hazards/cascadia-subduction-zone) -- CSZ science
6. [UW School of Oceanography: Near-Source Feasibility Study, 2019](https://ocean.washington.edu/) -- Near-source gap analysis
7. [Pacific Tsunami Warning Center](https://www.tsunami.gov/) -- Warning dissemination
8. [NOAA Center for Tsunami Research](https://nctr.pmel.noaa.gov/) -- Modeling and detection
