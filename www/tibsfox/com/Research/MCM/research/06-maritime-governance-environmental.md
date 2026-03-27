# Maritime Governance & Environmental Impact

> **Domain:** International Law, Environmental Science & Indigenous Sovereignty
> **Module:** 6 -- Maritime Compute & Maglev Bridge: Regulatory Framework, Ecological Responsibility, and Indigenous Maritime Rights
> **Through-line:** *The ocean belongs to no single nation and to all peoples. Infrastructure that floats upon it must answer to international law, ecological stewardship, and the sovereign rights of communities whose relationship with the sea predates all modern institutions.*

---

## Table of Contents

1. [The Governance Challenge](#1-the-governance-challenge)
2. [UNCLOS Framework](#2-unclos-framework)
3. [Maritime Zones and Jurisdictional Boundaries](#3-maritime-zones-and-jurisdictional-boundaries)
4. [UNCLOS Articles for Cable and Infrastructure](#4-unclos-articles-for-cable-and-infrastructure)
5. [Regulatory Gap: Floating Compute Infrastructure](#5-regulatory-gap-floating-compute-infrastructure)
6. [Flag State Jurisdiction](#6-flag-state-jurisdiction)
7. [International Seabed Authority](#7-international-seabed-authority)
8. [Environmental Impact Assessment](#8-environmental-impact-assessment)
9. [Thermal Discharge Modeling](#9-thermal-discharge-modeling)
10. [Marine Ecosystem Interaction](#10-marine-ecosystem-interaction)
11. [Electromagnetic Field Effects](#11-electromagnetic-field-effects)
12. [Acoustic Impact Assessment](#12-acoustic-impact-assessment)
13. [Indigenous Maritime Sovereignty](#13-indigenous-maritime-sovereignty)
14. [Pacific Islander Navigation Rights](#14-pacific-islander-navigation-rights)
15. [Coast Salish Marine Territories](#15-coast-salish-marine-territories)
16. [CARE Principles and OCAP for Ocean Infrastructure](#16-care-principles-and-ocap-for-ocean-infrastructure)
17. [Environmental Monitoring Protocols](#17-environmental-monitoring-protocols)
18. [Cross-References](#18-cross-references)
19. [Sources](#19-sources)

---

## 1. The Governance Challenge

Maritime compute infrastructure occupies a regulatory space that did not exist when the governing international frameworks were written. The United Nations Convention on the Law of the Sea (UNCLOS), adopted in 1982, governs activities in the world's oceans. It addresses ships, cables, pipelines, artificial islands, and installations for resource extraction. It does not address permanent floating computational infrastructure.

This regulatory gap is not merely a legal technicality. It determines:
- Which nation's laws apply to data processed on a floating compute node
- Who regulates environmental impact of thermal discharge from floating data centers
- Whether compute infrastructure in international waters can be used to circumvent national data sovereignty laws
- How Indigenous maritime rights interact with floating infrastructure deployment

This module documents the UNCLOS framework, identifies the regulatory gaps, assesses environmental impact, and establishes the Indigenous sovereignty principles that any ocean-based knowledge infrastructure must respect.

---

## 2. UNCLOS Framework

### Convention Overview

UNCLOS is the comprehensive legal framework governing all uses of the oceans and their resources. Often called the "constitution of the oceans," UNCLOS has been ratified by 168 parties (nations and the European Union). The United States has signed but not ratified UNCLOS; however, the U.S. recognizes most of its provisions as customary international law.

### Key UNCLOS Principles

| Principle | Article | Relevance to Maritime Compute |
|-----------|---------|------------------------------|
| Freedom of the high seas | Art. 87 | Includes freedom to lay cables and construct installations |
| Right to lay cables | Art. 112 | All states have the right to lay submarine cables on the high seas |
| Protection of cables | Art. 113-115 | Cable damage by ships must be compensated; nations must adopt laws protecting cables |
| Artificial islands | Art. 60 | Coastal states may construct artificial islands in their EEZ |
| Marine scientific research | Art. 238-262 | All states have the right to conduct marine research |
| Environmental protection | Art. 192-237 | States have the obligation to protect and preserve the marine environment |
| Common heritage | Art. 136 | Deep seabed minerals are the common heritage of mankind |

---

## 3. Maritime Zones and Jurisdictional Boundaries

UNCLOS defines concentric zones of decreasing sovereignty extending from the coastline:

```
  MARITIME ZONES (UNCLOS)
  ========================

  Shore ←—— 12 nm ——→ ←—— 12 nm ——→ ←———— 176 nm ————→ ←— Beyond 200 nm —→
  |                    |                |                    |
  | Territorial Sea    | Contiguous     | Exclusive          | High Seas
  | Full sovereignty   | Zone           | Economic Zone      | (International
  |                    | Customs/health | (EEZ)              |  Waters)
  |                    | enforcement    | Resource rights     | Freedom of
  |                    |                | Environmental       |  navigation,
  |                    |                |  jurisdiction       |  cable laying,
  |                    |                |                    |  scientific
  |                    |                |                    |  research
  |____________________|________________|____________________|_______________

  0 nm               12 nm            24 nm               200 nm
```

### Zone Implications for Maritime Compute

| Zone | Nautical Miles | Maritime Compute Status |
|------|---------------|------------------------|
| Internal waters | 0-baseline | Full national sovereignty; same rules as land-based DC |
| Territorial sea | 0-12 nm | National sovereignty; innocent passage for ships; state controls infrastructure |
| Contiguous zone | 12-24 nm | State can enforce customs, fiscal, immigration, sanitary laws |
| EEZ | 12-200 nm | State has resource rights; other states have navigation and cable rights |
| High seas | Beyond 200 nm | Freedom of navigation and cable laying; no single state sovereignty |
| Continental shelf | Variable (to 350 nm) | State has seabed resource rights; water column is EEZ/high seas |

### Strategic Deployment Considerations

Maritime compute in the **territorial sea** (0-12 nm) is fully subject to national jurisdiction -- identical legal status to a land-based data center. This is the simplest deployment model from a regulatory perspective.

Maritime compute in the **EEZ** (12-200 nm) occupies a hybrid space. The coastal state has jurisdiction over resources and environmental protection but cannot restrict freedom of navigation or cable laying. Whether floating compute infrastructure counts as an "installation" under Article 60 (which gives the coastal state exclusive jurisdiction over construction) depends on interpretation.

Maritime compute on the **high seas** (beyond 200 nm) operates under the freedom of the seas. No state has sovereignty. The compute node's flag state (the nation of registry) provides the primary jurisdictional framework.

---

## 4. UNCLOS Articles for Cable and Infrastructure

### Article 87: Freedom of the High Seas

Article 87 establishes that the high seas are open to all states. Freedoms include navigation, overflight, the laying of submarine cables and pipelines, the construction of artificial islands and installations, fishing, and scientific research.

This article provides the foundational legal basis for deploying maritime compute infrastructure on the high seas. The freedom to construct "installations" is explicitly listed.

### Article 112: Right to Lay Submarine Cables

All states are entitled to lay submarine cables and pipelines on the bed of the high seas beyond the continental shelf. This right extends to the cables connecting maritime compute nodes to the existing submarine cable network.

### Article 115: Protection of Cables

Every state must adopt laws and regulations to ensure that vessels flying its flag are liable for damage to submarine cables. This protection extends to the fiber connections between maritime compute nodes and cable landing stations.

### Article 60: Artificial Islands and Installations in the EEZ

Coastal states have the exclusive right to construct, authorize, and regulate artificial islands and installations in their EEZ. If a maritime compute barge is classified as an "installation," the coastal state controls its deployment in the EEZ. If classified as a "vessel," it enjoys freedom of navigation.

The classification of floating compute infrastructure -- vessel, installation, or something new -- is the central unresolved legal question.

---

## 5. Regulatory Gap: Floating Compute Infrastructure

### The Classification Problem

UNCLOS and the International Maritime Organization (IMO) classify maritime objects into well-defined categories:

| Category | Characteristics | Regulatory Framework |
|----------|----------------|---------------------|
| Ship/vessel | Self-propelled, navigates | Flag state, SOLAS, MARPOL |
| Artificial island | Fixed to seabed, permanent | Coastal state (EEZ), Art. 60 |
| Installation | Fixed or floating, resource extraction | Coastal state (EEZ), Art. 60 |
| Cable/pipeline | Linear, on/under seabed | Art. 112-115, universal rights |
| Marine scientific research | Temporary, knowledge-gathering | Art. 238-262, consent required |

A floating compute barge does not fit cleanly into any category:
- It **floats** like a ship but does not navigate between ports
- It is **not fixed** to the seabed like an artificial island
- It does not **extract resources** like an offshore installation
- It is **not temporary** like a research vessel
- It **processes data** -- an activity UNCLOS does not address

### Emerging Regulatory Discussion

The ITU International Submarine Cable Resilience Summit (2025) identified floating compute infrastructure as an emerging governance challenge. No international body has yet proposed specific regulatory provisions, but the discussion is active in:
- IMO Maritime Safety Committee
- ITU Telecommunication Standardization Sector
- UNCLOS Commission on the Limits of the Continental Shelf (procedural only)
- International Law Commission (general principles)

### Data Sovereignty Implications

Data processed on a floating compute node in international waters raises novel questions:
- Which nation's data protection laws apply? (Flag state? Nearest coastal state? Data subject's nationality?)
- Can compute in international waters be used to process data that is subject to GDPR, CCPA, or other territorial data protection laws?
- How are lawful intercept obligations (CALEA in the U.S., IPA in the UK) enforced for data processed at sea?

The maritime compute vision explicitly rejects the use of international waters to evade data sovereignty laws. The operational model subjects maritime compute to the flag state's data protection framework and voluntarily complies with the data protection laws of all nations whose citizens' data is processed.

---

## 6. Flag State Jurisdiction

### Flag State as Primary Regulator

Under UNCLOS, every vessel must be registered in a state (its "flag state"). The flag state has jurisdiction over the vessel's operations, safety, labor conditions, and environmental compliance. For maritime compute classified as a vessel:

- **Safety:** Flag state maritime safety authority (e.g., U.S. Coast Guard, MCA, ClassNK)
- **Environmental:** Flag state environmental regulations apply
- **Labor:** Flag state labor laws govern crew (or, for unmanned nodes, remote operator) conditions
- **Tax:** Flag state tax regime applies to operations
- **Data protection:** Flag state data protection law applies

### Flag State Selection Criteria

| Factor | Desirable Flag State Characteristics |
|--------|-------------------------------------|
| Legal stability | Established maritime law, independent judiciary |
| Environmental rigor | Strong environmental protection regime |
| Data protection | GDPR-equivalent data protection framework |
| Maritime expertise | Experienced maritime safety authority |
| Tax clarity | Clear, predictable tax treatment for maritime operations |
| International standing | UNCLOS ratification, IMO convention compliance |

---

## 7. International Seabed Authority

The International Seabed Authority (ISA) governs mineral exploitation on the deep seabed beyond national jurisdiction (the "Area"). While ISA jurisdiction applies to mining activities, not compute infrastructure, the ISA's regulatory model -- environmental impact assessment, benefit sharing, common heritage principle -- provides a governance template.

The common heritage principle (UNCLOS Article 136) holds that deep seabed minerals belong to all of humanity. An analogous principle could apply to knowledge infrastructure in international waters: the compute capacity positioned on the high seas serves the common interest of global knowledge distribution, not the exclusive benefit of a single nation or corporation.

---

## 8. Environmental Impact Assessment

### Assessment Framework

Environmental impact assessment for maritime compute must evaluate:

1. **Construction impacts:** Platform fabrication, anchoring, cable installation
2. **Operational impacts:** Thermal discharge, electromagnetic fields, noise, lighting
3. **Decommissioning impacts:** Platform removal, site remediation
4. **Cumulative impacts:** Multiple nodes across a region

### Regulatory Requirements

| Jurisdiction | EIA Requirement | Authority |
|-------------|----------------|-----------|
| U.S. EEZ | NEPA (National Environmental Policy Act) | BOEM, NOAA |
| EU EEZ | EIA Directive (2014/52/EU) | Member state authority |
| International waters | No mandatory EIA | Voluntary, flag state |
| Pacific Island EEZ | Variable by nation | National environment ministry |

The absence of mandatory EIA in international waters is a governance gap. The maritime compute vision adopts a voluntary EIA standard equivalent to the most rigorous national requirement (NEPA or EU EIA Directive), regardless of deployment location.

---

## 9. Thermal Discharge Modeling

### Heat Rejection

A 2 MW IT load at PUE 1.15 rejects approximately 2.3 MW of heat to the surrounding seawater. For seawater cooling systems, this heat is transferred through heat exchangers that warm the cooling water before returning it to the ocean.

### Temperature Rise Calculation

For a closed-loop seawater cooling system processing 4,500 gallons per minute (Nautilus Data Technologies reference):

```
Flow rate: 4,500 GPM = 284 liters/second
Heat rejected: 2.3 MW = 2,300 kW
Temperature rise: Q / (m * Cp) = 2,300 / (284 * 4.18) = 1.94 degrees C
```

The return water temperature is approximately 2 degrees C above ambient -- well within the typical regulatory threshold of 1-3 degrees C above ambient for thermal discharge.

### Thermal Plume Modeling

The discharged warm water forms a plume that mixes with ambient seawater. In open ocean conditions with current speeds of 0.1-0.5 m/s, modeling indicates:

| Distance from Discharge | Temperature Above Ambient |
|------------------------|--------------------------|
| 0 m (discharge point) | 2.0 degrees C |
| 10 m | 1.2 degrees C |
| 50 m | 0.3 degrees C |
| 100 m | <0.1 degrees C |
| 200 m | Indistinguishable from ambient |

The thermal plume dissipates within 100-200 meters of the discharge point. For a floating compute barge in open ocean conditions, the ecological footprint of thermal discharge is localized to a small area around the platform.

### Cumulative Thermal Impact

Multiple compute nodes in the same region must be spaced to prevent overlapping thermal plumes. A minimum spacing of 500 meters between nodes ensures independent thermal dissipation. For Phase 2 mesh networks with 5-10 nodes, total regional thermal impact remains negligible relative to natural ocean temperature variability.

---

## 10. Marine Ecosystem Interaction

### Artificial Reef Effect

Microsoft Project Natick found that submerged server containers attracted marine life, functioning as artificial reefs. The containers' smooth surfaces were colonized by sessile organisms (barnacles, mussels, algae) within weeks, which in turn attracted mobile fauna (fish, crabs, sea urchins).

This reef effect is generally ecologically positive:
- Provides hard substrate in soft-bottom environments
- Creates shelter for juvenile fish
- Increases local biodiversity
- Does not displace existing habitat (platform is deployed in open water)

### Potential Negative Interactions

| Interaction | Risk Level | Mitigation |
|------------|-----------|-----------|
| Thermal plume | Low | Discharge modeling, regulatory compliance, monitoring |
| Entrainment (intake) | Moderate | Velocity caps, screening, intake depth management |
| Light pollution | Low-Moderate | Shielded lighting, red spectrum for navigation, dark-sky protocols |
| Collision risk (marine mammals) | Low | Slow-speed approach zones, acoustic deterrents, AIS transponders |
| Habitat displacement | Negligible | Open-water deployment, no seabed disturbance (floating platform) |
| Invasive species transport | Low-Moderate | Ballast water management (BWM Convention), hull coatings |

### Monitoring Requirements

Continuous environmental monitoring around each maritime compute node:
- Water temperature sensors (intake, discharge, ambient at 50m, 100m, 200m)
- Dissolved oxygen sensors
- Underwater cameras for marine life observation
- Hydrophones for acoustic monitoring
- Current meters for plume modeling validation
- Turbidity sensors

---

## 11. Electromagnetic Field Effects

### EMF Sources

Maritime compute infrastructure generates electromagnetic fields from:
- Power cables (AC and DC)
- Computing equipment (high-frequency switching)
- Communication equipment (radio, satellite uplink)
- Navigation systems (radar, AIS)

### Marine Species Sensitivity

Certain marine species use electromagnetic fields for navigation, prey detection, or communication:

| Species Group | EMF Sensitivity | Potential Impact | Mitigation |
|--------------|-----------------|-----------------|-----------|
| Elasmobranchs (sharks, rays) | High (ampullae of Lorenzini) | Behavioral disruption near cables | Cable burial, shielding |
| Sea turtles | Moderate (geomagnetic navigation) | Altered migration near strong fields | Cable burial, field containment |
| Cetaceans (whales, dolphins) | Low-Moderate | Minimal direct EMF sensitivity | Acoustic monitoring primary concern |
| Fish (general) | Low | Minimal documented impact | Standard cable practices sufficient |
| Crustaceans | Low-Moderate | Some behavioral response to DC fields | Shielding in high-density areas |

### Shielding Standards

Power cables and equipment enclosures on maritime compute platforms should meet EMF shielding standards equivalent to those applied to submarine cable systems. IEEE and CIGRE guidelines for submarine cable EMF specify field levels that are compatible with marine ecosystem health.

---

## 12. Acoustic Impact Assessment

### Noise Sources

| Source | Sound Level (dB re 1 uPa at 1m) | Frequency Range | Duration |
|--------|----------------------------------|-----------------|----------|
| Cooling pumps | 130-150 dB | 50-500 Hz | Continuous |
| Generators (diesel backup) | 160-170 dB | 100-2000 Hz | Intermittent |
| Power electronics | 120-140 dB | 1-50 kHz | Continuous |
| HVAC fans | 110-130 dB | 200-2000 Hz | Continuous |
| Construction/mooring | 170-190 dB | Broadband | Temporary |

### Marine Mammal Acoustic Thresholds

NOAA provides acoustic threshold criteria for marine mammals:
- **Level A harassment (injury):** 180 dB (cetaceans), 190 dB (pinnipeds) for impulsive sources
- **Level B harassment (behavioral disruption):** 160 dB for impulsive, 120 dB for continuous

Maritime compute operational noise (continuous, 120-150 dB at 1m) attenuates rapidly in water. At 100 meters distance, sound levels are approximately 80-110 dB -- generally below behavioral disturbance thresholds for most marine mammals.

### Mitigation

- Vibration isolation mounts for pumps and generators
- Acoustic enclosures for diesel backup generators
- Operational scheduling: diesel generators run only during periods of low marine mammal presence (seasonal management)
- Passive acoustic monitoring (PAM) to detect marine mammal presence and adjust operations

---

## 13. Indigenous Maritime Sovereignty

### Foundational Principle

Any ocean-based infrastructure must engage specific Indigenous nations -- not generic "Indigenous peoples" -- through established rights frameworks. Maritime compute deployed in waters claimed by or traditionally used by Indigenous peoples requires prior, informed consent and ongoing governance partnership.

### Applicable Frameworks

| Framework | Full Name | Key Provisions |
|-----------|----------|---------------|
| UNDRIP | UN Declaration on the Rights of Indigenous Peoples | Art. 31: right to maintain, control, protect cultural heritage and traditional knowledge |
| CARE | Collective Benefit, Authority to Control, Responsibility, Ethics | Data governance principles for Indigenous data sovereignty |
| OCAP | Ownership, Control, Access, Possession | First Nations data governance standard (Canada) |
| Nagoya Protocol | Access and benefit-sharing for genetic resources | Model for benefit-sharing from ocean infrastructure |

---

## 14. Pacific Islander Navigation Rights

### Millennia-Old Ocean Governance

Pacific Islander peoples -- Polynesian, Melanesian, Micronesian -- maintain navigation traditions spanning thousands of years. Polynesian wayfinding navigated the world's largest ocean using star compasses, wave patterns, bird flight, and ocean swells. These traditions represent sophisticated ocean governance systems that predate UNCLOS by millennia.

### Specific Nations and Maritime Claims

| People / Nation | Maritime Territory | Traditional Use |
|----------------|-------------------|----------------|
| Tongan Kingdom | Tonga EEZ (700,000 km2) | Maritime kingdom, inter-island navigation |
| Fijian peoples | Fiji EEZ (1.29 million km2) | Customary marine tenure (qoliqoli) |
| Samoan peoples | Samoa EEZ + American Samoa | Traditional fishing grounds, navigation routes |
| Maori (Aotearoa) | New Zealand EEZ (4.08 million km2) | Customary marine rights, Treaty of Waitangi |
| Marshallese | Marshall Islands EEZ (1.99 million km2) | Stick chart navigation, nuclear legacy waters |
| Hawaiian peoples | Hawaii EEZ (U.S.) | Traditional and customary access rights |

### Maritime Compute Obligations

Maritime compute deployed in Pacific Island waters must:
1. Engage the specific Pacific Island nation whose EEZ is involved
2. Provide demonstrated benefit to the local community (knowledge hub services, not just cable transit)
3. Respect customary marine tenure systems (e.g., Fiji's qoliqoli system)
4. Include Indigenous representatives in governance structures
5. Share environmental monitoring data with local communities
6. Ensure compute services are accessible and relevant to local needs

---

## 15. Coast Salish Marine Territories

### Geographic Context

Coast Salish nations hold marine territory rights throughout the Pacific Northwest, including the Salish Sea (Puget Sound, Strait of Georgia, Strait of Juan de Fuca), the San Juan Islands, and coastal waters from British Columbia through Washington State.

### Specific Nations

| Nation | Marine Territory | Relevant Infrastructure |
|--------|-----------------|----------------------|
| Tulalip Tribes | Northern Puget Sound, Saratoga Passage | Submarine cable routes to Canada |
| Muckleshoot Indian Tribe | Green-Duwamish watershed, Elliott Bay | Seattle metro cable landings |
| Suquamish Tribe | Central Puget Sound, Port Madison | Cross-Sound cable routes |
| Swinomish Indian Tribal Community | Skagit Bay, Padilla Bay | Northern cable approaches |
| Squaxin Island Tribe | South Puget Sound | Regional connectivity |
| Makah Tribe | Cape Flattery, Pacific coast | Transpacific cable landing area |

### Relevance to Maritime Compute

The Fox Infrastructure Pacific Spine connects to maritime compute infrastructure through Pacific Northwest waters -- waters where Coast Salish nations hold established treaty rights and customary marine territory. Maritime compute infrastructure transiting or deploying in these waters must:

1. Consult with specific Coast Salish nations whose marine territory is involved
2. Comply with treaty-guaranteed fishing rights and traditional use areas
3. Avoid disruption to marine resources protected under treaties (salmon, shellfish, marine mammals)
4. Provide community benefit consistent with the Pacific Spine's community-oriented infrastructure model
5. Include Coast Salish representatives in environmental monitoring programs

---

## 16. CARE Principles and OCAP for Ocean Infrastructure

### CARE Principles Applied

| Principle | Application to Maritime Compute |
|-----------|-------------------------------|
| **Collective Benefit** | Maritime compute in Indigenous waters must provide measurable benefit to the Indigenous community, not just transit their waters |
| **Authority to Control** | Indigenous nations have the right to govern data about their communities, waters, and resources processed on maritime compute nodes |
| **Responsibility** | Maritime compute operators are responsible for demonstrating that their operations do not harm Indigenous interests |
| **Ethics** | Deployment decisions must consider Indigenous values, not just regulatory compliance |

### OCAP Applied

| Principle | Application to Maritime Compute |
|-----------|-------------------------------|
| **Ownership** | Indigenous communities own the environmental monitoring data collected in their waters |
| **Control** | Indigenous communities control how their data is collected, used, and shared |
| **Access** | Indigenous communities have full access to all environmental and operational data from nodes in their waters |
| **Possession** | Data about Indigenous marine territories must be stored where Indigenous communities can physically access and manage it |

### Implementation Model

Maritime compute nodes deployed in or near Indigenous marine territories should:

1. **Establish a data governance agreement** with the specific Indigenous nation before deployment
2. **Provide a dedicated compute partition** for Indigenous community use (parallel to the OCN 10% community allocation)
3. **Host environmental monitoring data locally** on the maritime compute node, accessible to the Indigenous community
4. **Include Indigenous knowledge holders** on the environmental monitoring advisory board
5. **Share operational benefits** (employment, training, revenue sharing) with the local Indigenous community
6. **Conduct regular reviews** of the data governance agreement with Indigenous governance structures

---

## 17. Environmental Monitoring Protocols

### Continuous Monitoring Suite

| Parameter | Sensor | Frequency | Threshold |
|-----------|--------|-----------|-----------|
| Water temperature (intake) | RTD probe | 1-second | Baseline +/- 5 degrees C |
| Water temperature (discharge) | RTD probe | 1-second | Ambient + 3 degrees C max |
| Water temperature (ambient, 50m) | RTD probe | 1-minute | Natural variability |
| Dissolved oxygen | Optical DO sensor | 5-minute | >5 mg/L |
| Turbidity | Nephelometric | 5-minute | <10 NTU |
| pH | Glass electrode | 15-minute | 7.5-8.5 |
| Salinity | CTD | 15-minute | Baseline +/- 2 PSU |
| Underwater noise | Hydrophone | Continuous | NOAA Level B threshold |
| Marine mammal presence | PAM + camera | Continuous | Detection triggers operational review |
| EMF (cable vicinity) | Fluxgate magnetometer | Hourly | <100 uT at 1m from cable |

### Reporting

- **Real-time alerts:** Threshold exceedances trigger automated alerts to remote operations center
- **Daily summary:** Environmental data summary transmitted to flag state authority and coastal state (if EEZ deployment)
- **Monthly report:** Comprehensive environmental monitoring report, publicly accessible
- **Annual review:** Third-party environmental audit, results shared with all stakeholders including Indigenous communities
- **Incident reporting:** Any environmental incident (spill, thermal exceedance, marine mammal interaction) reported within 24 hours

### Data Sharing

Environmental monitoring data from maritime compute nodes is treated as public-good information:
- Published to open-access ocean data repositories (NOAA, Copernicus Marine Service)
- Shared with SMART cable science programs
- Made available to Indigenous communities in whose waters the node operates
- Contributed to global ocean monitoring networks (GOOS, Argo)

---

## 18. Cross-References

- **[PSG] Pacific Spine Gateway:** Coast Salish marine territories along the Pacific Spine corridor; treaty rights and traditional use areas
- **[OCN] Open Compute Node:** Community compute allocation model (10% to local partners) as template for Indigenous benefit sharing
- **[ROF] Ring of Fire:** Seismic zones and environmental monitoring in tectonically active ocean regions; volcanic activity and marine ecosystem impact
- **[SYS] Systems Administration:** Remote monitoring systems for environmental sensor networks; data management and reporting automation
- **[HGE] Hydro-Geothermal Energy:** Environmental assessment methodology for geothermal sites; thermal discharge modeling parallels
- **[K8S] Kubernetes:** Data sovereignty and multi-jurisdiction workload placement; compute governance across maritime nodes in different EEZs
- **[CMH] Computational Mesh:** Environmental data routing and aggregation across distributed maritime monitoring networks

---

## 19. Sources

### International Law
- United Nations Convention on the Law of the Sea (UNCLOS) -- Articles 60, 87, 112, 113-115, 136, 192-237, 238-262
- United Nations Declaration on the Rights of Indigenous Peoples (UNDRIP) -- Article 31
- International Maritime Organization (IMO) -- SOLAS, MARPOL, BWM Convention

### Government and Agency Sources
- NOAA -- Marine mammal acoustic threshold criteria, ocean monitoring standards
- Bureau of Ocean Energy Management (BOEM) -- Environmental assessment requirements for ocean energy projects
- International Seabed Authority (ISA) -- Regulatory framework for seabed activities

### Indigenous Governance Frameworks
- CARE Principles for Indigenous Data Governance (Global Indigenous Data Alliance)
- OCAP Principles (First Nations Information Governance Centre, Canada)
- Treaty of Waitangi / Te Tiriti o Waitangi -- Maori marine rights framework (New Zealand)
- Fiji Qoliqoli Bill -- Customary marine tenure legislation

### Environmental Research
- Microsoft Research -- Project Natick: artificial reef effect, marine life colonization of submerged data centers
- IEEE -- EMF guidelines for submarine cable systems
- CIGRE -- Electromagnetic field assessment for subsea power cables
- Nautilus Data Technologies -- Thermal discharge monitoring data, PUE validation

### Peer-Reviewed Research
- Taormina, B. et al. "A review of potential impacts of submarine power cables on the marine environment." *Renewable and Sustainable Energy Reviews* 96 (2018)
- Gill, A.B. et al. "Marine renewable energy, electromagnetic (EM) fields and EM-sensitive animals." *Marine Ecology* (2014)

---

*The ocean is governed by law, ecology, and the people who have navigated it for millennia. Maritime compute infrastructure must answer to all three.*
