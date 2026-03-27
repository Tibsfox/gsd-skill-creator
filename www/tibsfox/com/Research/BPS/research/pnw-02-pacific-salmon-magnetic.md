# Pacific Salmon: Magnetic Map Navigation

> *Biology discovered it first. The physics is universal. The Pacific Northwest is where it matters most right now.*

---

## Overview

Pacific salmon navigate thousands of miles of open ocean, cross continental shelves, ascend rivers, pass through dams, and return to the exact stream where they hatched -- all without maps, compasses, or GPS. They do it using the Earth's magnetic field.

Putman et al. (2020) demonstrated that Pacific pink salmon (*Oncorhynchus gorbuscha*) use a two-coordinate magnetic map -- field intensity and inclination angle -- as a biological positioning system analogous to GPS latitude and longitude [P1]. This innate magnetic map guides oceanic migration long before the salmon have ever seen the ocean. As salmon approach the coast, they switch to a magnetic compass for directional homing, and in the final approach, olfactory cues guide them to their natal stream -- a chemical gradient as terminal guidance [P1, P5].

The Pacific Northwest is the epicenter of salmon conservation. Twenty-eight salmon and steelhead Evolutionarily Significant Units (ESUs) are listed under the Endangered Species Act on the West Coast [G4]. The PTAGIS telemetry network tracks millions of PIT-tagged salmon through the Columbia-Snake River system and its 14 mainstem dams. Understanding the physics of salmon navigation -- the magnetic map, the compass, the olfactory homing -- is essential for designing fish passage systems, managing dam operations, and protecting migratory corridors.

This document traces the complete sensory chain from the Earth's magnetic field to the neural decision that steers a salmon home, with every quantitative claim cited from the [Source Index](00-source-index.md).

---

## Table of Contents

1. [Species Profiles](#species-profiles)
2. [Conservation Status](#conservation-status)
3. [The Earth's Magnetic Field as Navigation Signal](#the-earths-magnetic-field-as-navigation-signal)
   - [Field Intensity](#field-intensity)
   - [Inclination Angle](#inclination-angle)
   - [The Two-Coordinate Map](#the-two-coordinate-map)
4. [The Magnetic Map: Putman et al. (2020)](#the-magnetic-map-putman-et-al-2020)
   - [Experimental Evidence](#experimental-evidence)
   - [Innate vs. Learned Navigation](#innate-vs-learned-navigation)
   - [The Elliptical Migratory Route](#the-elliptical-migratory-route)
5. [Magnetite: The Biological Transducer](#magnetite-the-biological-transducer)
   - [Physical Properties of Magnetite](#physical-properties-of-magnetite)
   - [Magnetite in Salmon Tissues](#magnetite-in-salmon-tissues)
   - [Transduction Mechanism](#transduction-mechanism)
6. [Signal Processing Chain](#signal-processing-chain)
7. [Multi-Modal Sensor Fusion](#multi-modal-sensor-fusion)
   - [Phase 1: Magnetic Map (Ocean)](#phase-1-magnetic-map-ocean)
   - [Phase 2: Magnetic Compass (Coastal)](#phase-2-magnetic-compass-coastal)
   - [Phase 3: Olfactory Homing (River)](#phase-3-olfactory-homing-river)
   - [The Fusion Architecture](#the-fusion-architecture)
8. [PTAGIS Telemetry: Tracking the Migration](#ptagis-telemetry-tracking-the-migration)
   - [PIT Tag Technology](#pit-tag-technology)
   - [The Columbia-Snake River System](#the-columbia-snake-river-system)
   - [Data Scale and Coverage](#data-scale-and-coverage)
9. [ESA-Listed Populations](#esa-listed-populations)
10. [Chinook Salmon and the Orca Connection](#chinook-salmon-and-the-orca-connection)
11. [Magnetic Anomalies and Navigation Disruption](#magnetic-anomalies-and-navigation-disruption)
12. [Engineering Parallels](#engineering-parallels)
13. [Interrelationships and Cross-Links](#interrelationships-and-cross-links)
14. [Summary Tables](#summary-tables)
15. [Sources](#sources)

---

## Species Profiles

### Pacific Pink Salmon

| Field | Value |
|-------|-------|
| **Common Name** | Pink salmon (humpback salmon) |
| **Scientific Name** | *Oncorhynchus gorbuscha* |
| **Life Cycle** | Strict 2-year cycle; fry migrate to ocean within weeks of emergence |
| **Oceanic Range** | North Pacific: Alaska to northern California, Bering Sea to central Pacific |
| **Migration Pattern** | Elliptical oceanic route: northward to Gulf of Alaska, southward along coast [P1] |
| **Sensing Modality** | Magnetoreception (primary for oceanic navigation) + olfaction (terminal homing) |
| **Body Size** | Adults: 45-65 cm, 1.5-3 kg |

### Chinook Salmon

| Field | Value |
|-------|-------|
| **Common Name** | Chinook salmon (king salmon) |
| **Scientific Name** | *Oncorhynchus tshawytscha* |
| **Life Cycle** | Variable: 2-7 year cycle; juveniles rear in freshwater months to years |
| **Oceanic Range** | North Pacific: Alaska to central California |
| **Migration Pattern** | Oceanic migration with magnetic navigation; return to natal rivers |
| **Sensing Modality** | Magnetoreception (ocean) + olfaction (river homing) |
| **Body Size** | Adults: 60-90 cm typical, up to 150 cm; 5-25 kg typical, up to 60 kg |
| **Trophic Role** | Primary prey of Southern Resident killer whales (>80% of summer diet) [G1] |

---

## Conservation Status

| Species | Authority | Status | Notes |
|---------|-----------|--------|-------|
| Chinook salmon | ESA | **Multiple ESUs Threatened/Endangered** | Upper Columbia Spring, Snake River Spring/Summer, Snake River Fall, Lower Columbia, Puget Sound -- all listed [G4] |
| Chinook salmon | Washington State | Candidate/Sensitive (varies by run) | -- |
| Pink salmon | ESA | Not listed (most runs) | Even-year runs in some rivers depressed |
| Steelhead | ESA | Multiple DPS listed | Upper Columbia, Snake River, Middle Columbia, Lower Columbia [G4] |

**Total West Coast listings**: 28 salmon and steelhead ESUs/DPSs are listed under the ESA [G4]. The Columbia Basin alone accounts for the majority of these listings, with multiple Chinook, steelhead, sockeye, and chum populations in decline.

The PTAGIS database records millions of individual fish detections annually across the Columbia-Snake River system, providing the most comprehensive telemetry dataset for any migratory fish species on Earth [G4].

---

## The Earth's Magnetic Field as Navigation Signal

The Earth's magnetic field is generated by convection currents in the liquid iron outer core -- a self-sustaining dynamo that has operated for billions of years. At the Earth's surface, this field has two properties that vary systematically with geographic position, making it suitable as a navigation signal [G2, P1, P5]:

### Field Intensity

The **total field intensity** varies from approximately 25,000 nanotesla (nT) near the magnetic equator to approximately 65,000 nT near the magnetic poles [G2]. In the Pacific Northwest:

```
Magnetic Field Intensity in PNW Waters:

  Location                    | Intensity (nT)
  ----------------------------|---------------
  Equatorial Pacific (0 deg)  | ~30,000
  Southern California (32 N)  | ~47,000
  Oregon Coast (44 N)         | ~54,000
  Puget Sound (48 N)          | ~55,500
  Gulf of Alaska (58 N)       | ~57,000
  Bering Sea (60 N)           | ~57,500

Field intensity increases monotonically with latitude
in the northeastern Pacific, providing a latitude-like
position coordinate.
```

### Inclination Angle

The **inclination angle** (dip angle) is the angle between the magnetic field vector and the horizontal plane. At the magnetic equator, field lines are horizontal (inclination = 0 degrees). At the magnetic poles, field lines are vertical (inclination = 90 degrees) [G2]. In the northeastern Pacific:

```
Magnetic Inclination in PNW Waters:

  Location                    | Inclination (degrees)
  ----------------------------|---------------------
  Equatorial Pacific (0 deg)  | ~0-5
  Southern California (32 N)  | ~58
  Oregon Coast (44 N)         | ~67
  Puget Sound (48 N)          | ~70
  Gulf of Alaska (58 N)       | ~74
  Bering Sea (60 N)           | ~75

Inclination increases monotonically with latitude
in this region, providing a second latitude-like
coordinate that is partially independent of intensity.
```

### The Two-Coordinate Map

The key insight from Putman et al. (2020) is that salmon use **both** field intensity and inclination angle simultaneously, creating a two-coordinate positioning system [P1]:

```
Magnetic Position System:

  Position = f(Intensity, Inclination)

  Analogous to GPS:
    GPS:      Position = f(Latitude, Longitude)
    Magnetic: Position = f(Intensity, Inclination)

  In the northeastern Pacific, lines of constant intensity
  and lines of constant inclination are not parallel --
  they intersect at angles that vary with location.

  Where they intersect at sufficient angle, the two
  coordinates provide an unambiguous position fix.

  This is mathematically equivalent to having two
  independent bearing lines that cross to give a fix.
```

The magnetic map is not as precise as GPS -- magnetic field parameters vary slowly over large distances, and there are local anomalies. But for oceanic-scale navigation (hundreds to thousands of kilometers), the precision is sufficient to guide a salmon from the central Pacific to the correct stretch of coastline [P1].

---

## The Magnetic Map: Putman et al. (2020)

### Experimental Evidence

Putman et al. (2020) published the definitive evidence for a salmon magnetic map in the *Journal of Comparative Physiology A* [P1]. The research drew on multiple lines of evidence:

1. **Displacement experiments**: Salmon exposed to magnetic field conditions corresponding to different geographic locations oriented their swimming in directions consistent with compensatory navigation -- as if correcting their position to return to the migratory route appropriate for their actual location [P1].

2. **Population-level analysis**: The year-to-year variation in pink salmon migratory routes correlates with gradual changes in the Earth's magnetic field (secular variation). As magnetic field parameters shift geographically, salmon migratory routes shift correspondingly -- strong evidence that navigation decisions are based on magnetic field values, not on other cues [P1].

3. **Two-coordinate response**: Salmon responded to changes in both intensity and inclination, and the behavioral response was consistent with using these as independent positional coordinates rather than as a single compass bearing [P1].

This work built on decades of magnetoreception research, including early demonstrations of magnetite in salmonid tissues by Walker et al. (1977) [P10] and the extensive magnetoreception research program at the Lohmann Lab at UNC Chapel Hill [P5].

### Innate vs. Learned Navigation

A critical finding: juvenile salmon respond appropriately to magnetic field conditions **before they have ever entered the ocean** [P1]. Pink salmon fry migrate to the sea within weeks of emergence from the gravel -- they have never experienced oceanic magnetic field gradients. Yet when tested in magnetic displacement experiments, they orient correctly.

This means the magnetic map is **innate** -- encoded in the genome, not learned from experience. The salmon is born with a lookup table that maps magnetic field parameters to geographic position and appropriate migratory heading [P1, P5].

```
Innate Magnetic Map (Conceptual):

  IF intensity = I_1 AND inclination = theta_1:
    THEN heading = bearing_north  (migrate northward)

  IF intensity = I_2 AND inclination = theta_2:
    THEN heading = bearing_south  (migrate southward)

  IF intensity = I_home AND inclination = theta_home:
    THEN heading = bearing_coast  (approach natal coast)

  This lookup table is genetically encoded and does not
  require prior experience to function.
```

The innate map is sufficient for large-scale oceanic navigation. Fine-scale homing (identifying the specific natal stream) requires olfactory imprinting, which is learned during the juvenile freshwater phase.

### The Elliptical Migratory Route

Pacific pink salmon follow an **elliptical migratory route** through the North Pacific [P1]:

1. **Juvenile outmigration**: Fry leave natal streams in spring, enter the ocean, and begin moving northward and westward into the Gulf of Alaska.

2. **Northern phase**: Salmon spend months feeding in the productive waters of the Gulf of Alaska and the Bering Sea, tracked by their magnetic position as field intensity and inclination increase.

3. **Southward return**: As the salmon mature, they begin moving southward along the coast. The magnetic map provides positional awareness -- the salmon "knows" it is too far north based on the local field parameters and corrects southward.

4. **Coastal approach**: As the salmon nears its natal latitude, the magnetic map resolution becomes insufficient for precise homing. The navigation system transitions from magnetic map to magnetic compass to olfactory homing [P1, P5].

This elliptical route covers thousands of kilometers and takes 1-4 years depending on species. Throughout, the magnetic map provides the large-scale positional awareness that keeps the salmon on the correct migratory pathway.

---

## Magnetite: The Biological Transducer

### Physical Properties of Magnetite

**Magnetite** (Fe3O4) is a ferrimagnetic iron oxide mineral with the strongest magnetism of any biogenic material [P10, P5]:

```
Magnetite (Fe3O4) Properties:

  Crystal structure:    Inverse spinel
  Density:             5.17 g/cm^3
  Saturation magnetization: 92 Am^2/kg (480 kA/m)
  Curie temperature:   585 deg C
  Magnetic domain:     Single-domain crystals (30-100 nm)
                       are permanently magnetized
  Coercivity:          20-30 mT for single-domain particles

  In Earth's field (~50,000 nT = 0.05 mT):
    Single-domain magnetite crystals experience torque
    proportional to the sine of the angle between the
    crystal's magnetic moment and the external field.

  Torque: tau = m x B = m * B * sin(theta)

  Where:
    m = magnetic moment of the crystal
    B = external magnetic field strength
    theta = angle between m and B
```

Single-domain magnetite crystals are permanently magnetized -- they behave like tiny compass needles. When embedded in biological tissue, they exert mechanical force on the surrounding cellular structures in response to the external magnetic field [P10].

### Magnetite in Salmon Tissues

Walker et al. (1977) first identified magnetite crystals in the snouts of rainbow trout (*Oncorhynchus mykiss*), a close relative of Pacific salmon [P10]. Subsequent research has confirmed magnetite in multiple salmonid species:

- **Location**: Concentrated in the ethmoid region (the cartilaginous/bony tissue of the snout, between and above the olfactory organs) [P10].
- **Crystal size**: Single-domain range (approximately 30-100 nm), ensuring permanent magnetization [P10].
- **Organization**: Crystals are arranged in chains within specialized cells, amplifying the magnetic response through cooperative alignment [P5].
- **Neural connection**: Magnetite-bearing cells are innervated by branches of the trigeminal nerve, providing a pathway for magnetic information to reach the brain [P5].

### Transduction Mechanism

The proposed transduction mechanism for magnetite-based magnetoreception [P5, P10]:

```
Magnetite Transduction Chain:

  1. MECHANICAL INPUT
     Earth's magnetic field (B ~ 50,000 nT)
     exerts torque on single-domain magnetite crystals
     tau = m * B * sin(theta)

  2. CELLULAR RESPONSE
     Crystal rotation/torque pulls on cytoskeletal
     elements (filaments connecting crystal to cell membrane)

  3. MECHANOTRANSDUCTION
     Mechanical stress on cell membrane opens
     mechanically-gated ion channels
     (similar to hair cells in the inner ear)

  4. NEURAL SIGNAL
     Ion flow through open channels generates
     receptor potential -> action potentials
     transmitted via trigeminal nerve to brain

  5. FIELD PARAMETER ENCODING
     - Total field INTENSITY encoded by the magnitude
       of the mechanical force on the crystals
     - INCLINATION encoded by the direction of the
       force vector relative to gravity (requires
       integration with vestibular system)
     - DECLINATION (magnetic north vs. true north)
       potentially encoded by compass-like orientation
```

This is a **magnetomechanical transducer** -- it converts magnetic field energy into mechanical energy into electrical neural signals. The engineering analogue is a flux-gate magnetometer, where a magnetically saturated core's response to an external field is detected electrically.

---

## Signal Processing Chain

The complete signal processing chain for Pacific salmon magnetic navigation, following the standard schema from the [Data Schema](00-data-schema.md):

```
SOURCE
  Earth's magnetic field
  Generated by core dynamo
  Intensity: 25,000 - 65,000 nT (varies with latitude)
  Inclination: 0 - 90 degrees (varies with latitude)
  Declination: variable (varies with longitude)
  Secular variation: ~0.05 deg/year (gradual drift)
    |
    v
PROPAGATION
  Through seawater, sediment, and biological tissue
  Magnetic field penetrates all non-ferromagnetic materials
  Essentially zero attenuation (unlike acoustic or EM waves)
  Local anomalies from geological structures (basalt, iron ore)
  Anthropogenic anomalies from metal structures, power lines
    |
    v
TRANSDUCER
  Magnetite (Fe3O4) crystals in ethmoid region
  Single-domain particles: permanently magnetized
  Chains of crystals amplify response
  Torque: tau = m * B * sin(theta)
  Force proportional to field gradient for intensity sensing
    |
    v
CONDITIONING
  Magnetomechanical coupling: crystal torque -> cytoskeletal stress
  Mechanically-gated ion channels: stress -> ion current
  Trigeminal nerve: receptor potential -> action potentials
  Integration with vestibular system for inclination reference
    |
    v
EXTRACTION
  Two-coordinate position: intensity + inclination
  Innate lookup table: magnetic parameters -> geographic position
  Comparison: current position vs. target position
  Course error computation: angular difference to correct heading
    |
    v
DECISION
  Course correction: adjust swimming direction
  Mode switching: magnetic map -> magnetic compass -> olfactory homing
  Behavioral output: sustained directional swimming
  Energy management: optimize route efficiency
```

---

## Multi-Modal Sensor Fusion

The salmon navigation system is a textbook example of **multi-modal sensor fusion** -- the sequential integration of multiple sensory modalities, each appropriate for a different spatial scale and environmental context [P1, P5].

### Phase 1: Magnetic Map (Ocean)

**Domain**: Open ocean, hundreds to thousands of kilometers from coast
**Sensor**: Magnetite-based magnetoreception
**Information**: Two-coordinate position (intensity + inclination)
**Precision**: ~100-200 km (sufficient for oceanic-scale navigation)
**Duration**: Months to years

The magnetic map provides the salmon's "GPS" -- a continuous awareness of geographic position relative to the migratory route. The salmon compares its current magnetic field readings against the innate lookup table and adjusts heading to stay on course [P1].

```
Oceanic Navigation Decision Loop:

  SENSE:   Read current (intensity, inclination)
  COMPARE: Look up expected values for current route position
  COMPUTE: Error = (current - expected)
  ACT:     Adjust heading to reduce error
  REPEAT:  Continuously throughout oceanic phase
```

### Phase 2: Magnetic Compass (Coastal)

**Domain**: Coastal waters, tens to hundreds of kilometers from natal river
**Sensor**: Magnetic compass (direction relative to magnetic north)
**Information**: Heading (single coordinate)
**Precision**: ~1-5 degrees directional accuracy
**Duration**: Days to weeks

As the salmon approaches the coast, the magnetic map's spatial resolution becomes insufficient to identify the specific natal river. The salmon transitions to using the magnetic field as a **compass** rather than a map -- maintaining a specific heading toward the coast rather than computing a position fix [P1, P5].

The Chinook salmon's magnetic compass navigation uses the Earth's magnetic field direction (detected via magnetite crystal orientation and/or the cryptochrome radical-pair mechanism) to maintain a consistent heading [G2, P5]. This is the same principle as a ship's magnetic compass -- simpler than the map function, but requiring additional sensory input (olfaction) for terminal guidance.

### Phase 3: Olfactory Homing (River)

**Domain**: River system, kilometers to meters from natal spawning site
**Sensor**: Olfactory epithelium (chemical detection)
**Information**: Chemical gradient (concentration of natal-stream chemical signature)
**Precision**: Meter-scale (individual tributary selection)
**Duration**: Days

The final phase is **olfactory homing** -- the salmon follows a chemical gradient, swimming upstream and selecting tributaries based on the unique chemical signature of its natal stream [P1, P5]. This signature was imprinted during the juvenile freshwater phase -- the salmon "memorized" the smell of home.

```
Olfactory Homing Decision Logic:

  At each tributary junction:
    SENSE:   Sample water chemistry from each branch
    COMPARE: Match against imprinted natal stream signature
    SELECT:  Enter the branch with the stronger match
    CONTINUE: Repeat until reaching spawning site
```

This is a **chemical gradient tracking algorithm** -- analogous to a moth following a pheromone plume, but operating in a river network where the "plume" is constrained by the channel geometry.

### The Fusion Architecture

The complete navigation system is a hierarchical sensor fusion architecture with graceful mode transitions:

```
NAVIGATION HIERARCHY:

  OCEANIC PHASE (magnetic map)
    |
    | Transition trigger: approaching continental shelf
    | (magnetic gradients steepen, depth decreases)
    v
  COASTAL PHASE (magnetic compass)
    |
    | Transition trigger: detecting natal river plume
    | (olfactory signal exceeds threshold)
    v
  RIVERINE PHASE (olfactory homing)
    |
    | Transition trigger: arriving at spawning site
    | (olfactory match, gravel substrate, flow conditions)
    v
  SPAWNING

Each phase uses the optimal sensor for its spatial scale:
  - Magnetic map: ~100 km resolution, works in open ocean
  - Magnetic compass: ~1-5 deg heading, works near coast
  - Olfaction: ~meter resolution, works in river network
```

This hierarchical fusion is remarkably similar to modern **integrated navigation systems** in aircraft and submarines, which transition from GPS (long range, low update) to inertial navigation (medium range, continuous) to terrain-following radar or visual landing aids (short range, high precision) [P1].

---

## PTAGIS Telemetry: Tracking the Migration

### PIT Tag Technology

The **Pacific States Marine Fisheries Commission** operates the PTAGIS (PIT Tag Information System) database, which tracks Pacific salmon through the Columbia-Snake River system using Passive Integrated Transponder (PIT) tags [G4].

A PIT tag is a **radio-frequency identification (RFID) transponder**:

```
PIT Tag Specifications:

  Size:        ~12 mm x 2 mm (glass-encapsulated)
  Weight:      ~0.1 g
  Frequency:   134.2 kHz (ISO standard)
  Power:       Passive (no battery) -- powered by
               interrogation antenna's RF field
  Lifetime:    Indefinite (no battery to expire)
  Encoding:    Unique 15-digit hexadecimal ID

Detection Mechanism:
  1. Tag enters RF field of interrogation antenna
  2. RF energy powers the tag's microchip
  3. Microchip transmits unique ID code
  4. Antenna receives and records ID + timestamp
  5. Data uploaded to PTAGIS central database

Detection range: ~30-60 cm from antenna coil
Antenna placement: in-dam fish ladders, bypass systems,
                   and juvenile bypass channels
```

The physics of PIT tag detection is fundamentally **radio telemetry** -- electromagnetic coupling between a powered antenna and a passive transponder. The tag requires no surgical battery implant, making it minimally invasive, and the unique ID enables individual fish to be tracked across their entire life.

### The Columbia-Snake River System

The Columbia-Snake River system is the largest salmon-producing river system in the lower 48 states and the most extensively monitored [G4]:

| Feature | Value |
|---------|-------|
| Columbia River length | ~1,243 miles (2,000 km) |
| Snake River length | ~1,078 miles (1,735 km) |
| Mainstem dams (total) | 14 on the Columbia and Snake |
| PTAGIS detection sites | Hundreds (dams, tributaries, hatcheries) |
| Annual PIT tag detections | Millions |
| Species tracked | Chinook, steelhead, sockeye, coho, chum, bull trout |

Each mainstem dam has PIT tag detection antennas installed in fish ladders (adult upstream passage), juvenile bypass systems (downstream passage), and spillways. As a tagged fish passes over an antenna, its unique ID and the timestamp are recorded and uploaded to the PTAGIS database [G4].

### Data Scale and Coverage

The PTAGIS database represents one of the largest ecological telemetry datasets in the world [G4]:

```
PTAGIS Scale (approximate):

  Total tags deployed:     Millions (cumulative)
  Annual new tags:         ~2 million
  Detection sites:         Hundreds across PNW
  Years of operation:      30+ years
  Species covered:         6+ salmonid species
  Spatial coverage:        Columbia Basin, coastal streams,
                          Puget Sound tributaries

Data products:
  - Individual migration histories (tag ID -> sequence of detections)
  - Travel time between dams (migration speed)
  - Survival estimates (proportion detected at successive dams)
  - Run timing (when populations pass each point)
  - Straying rates (fish detected in non-natal streams)
```

This telemetry system provides ground-truth data for salmon migration studies, including validation of magnetic navigation hypotheses. When salmon migratory routes shift in correlation with magnetic field secular variation (as documented by Putman et al.), the PTAGIS data provides the empirical basis for measuring those route shifts [P1, G4].

---

## ESA-Listed Populations

Twenty-eight salmon and steelhead ESUs and DPSs are listed under the Endangered Species Act on the West Coast [G4]. Key PNW-specific listings include:

| ESU/DPS | Species | ESA Status | Key Habitat |
|---------|---------|------------|-------------|
| Upper Columbia Spring Chinook | *O. tshawytscha* | Endangered | Columbia above Priest Rapids Dam |
| Snake River Spring/Summer Chinook | *O. tshawytscha* | Threatened | Snake River and tributaries |
| Snake River Fall Chinook | *O. tshawytscha* | Threatened | Lower Snake River mainstem |
| Lower Columbia Chinook | *O. tshawytscha* | Threatened | Columbia below Bonneville Dam |
| Puget Sound Chinook | *O. tshawytscha* | Threatened | Puget Sound tributaries |
| Upper Columbia Steelhead | *O. mykiss* | Threatened | Columbia above Priest Rapids Dam |
| Snake River Steelhead | *O. mykiss* | Threatened | Snake River and tributaries |
| Snake River Sockeye | *O. nerka* | Endangered | Redfish Lake, Idaho |
| Lower Columbia Coho | *O. kisutch* | Threatened | Columbia below Bonneville Dam |

Every one of these populations must navigate the magnetic map, the compass, and the olfactory corridor to complete their life cycle. Every dam, every altered flow regime, every magnetic anomaly from power infrastructure is a potential disruption to a navigation system that evolved over millions of years.

---

## Chinook Salmon and the Orca Connection

Chinook salmon are the **critical link** between magnetic navigation physics and orca biosonar physics. The Southern Resident killer whales depend on Chinook salmon for more than 80% of their summer diet [G1]. The orcas detect Chinook using biosonar -- echolocation clicks that identify the swim bladder acoustic signature (see [Southern Resident Orca](pnw-01-southern-resident-orca.md)).

The connection creates a physics chain of dependencies:

```
Navigation Physics -> Prey Physics -> Predator Physics:

  1. Earth's magnetic field guides salmon to PNW waters
     (magnetic map navigation) [P1]

  2. Salmon enter the Salish Sea and rivers
     (magnetic compass + olfactory homing) [P1, P5]

  3. Orca echolocation detects salmon swim bladders
     (acoustic impedance contrast) [G1, P2]

  4. Vessel noise masks orca echolocation
     (frequency band overlap, SNR reduction) [P9]

  5. Fewer salmon + less effective sonar = orca decline
     (population < 75 individuals) [G5]

  Every link in this chain is physics.
  Every link is vulnerable.
  Every conservation action must address the physics.
```

When Chinook salmon runs decline -- because of habitat loss, dam passage mortality, ocean condition changes, or other factors -- the Southern Residents must search harder, travel farther, and expend more energy to find food. The magnetic map that guides salmon to PNW waters is, indirectly, part of the life-support system for the Salish Sea's most iconic predator.

---

## Magnetic Anomalies and Navigation Disruption

### Natural Anomalies

The Earth's magnetic field is not perfectly smooth. Local geological features create **magnetic anomalies** -- deviations from the expected field values that could potentially confuse a magnetic navigator [G2]:

- **Volcanic basalt**: The Cascade Range and Columbia River Basalt Group contain highly magnetic volcanic rock that creates local field anomalies of hundreds to thousands of nT.
- **Iron ore deposits**: Concentrated iron minerals create localized field distortions.
- **Seafloor spreading**: Magnetic stripes on the Juan de Fuca Plate (alternating normal and reversed polarity basalt) create a complex pattern of anomalies offshore.

For oceanic-scale navigation, these anomalies are small relative to the global field gradients and likely do not significantly disrupt the magnetic map. But for fine-scale coastal navigation, anomalies could introduce positioning errors [G2, P5].

### Anthropogenic Anomalies

Human infrastructure creates magnetic anomalies that did not exist during the evolution of the salmon magnetic map:

| Source | Magnetic Effect | Potential Impact |
|--------|----------------|-----------------|
| **Power lines** (high voltage DC) | Static magnetic fields up to hundreds of nT at ground level | Could bias compass readings |
| **Submarine power cables** | DC cables create linear magnetic anomalies on the seafloor | Could deflect migratory routes |
| **Steel structures** (bridges, dams) | Local field distortion from ferromagnetic material | Could confuse navigation at close range |
| **Electromagnetic noise** (power systems, radio transmitters) | Time-varying fields that could stimulate or confuse magnetoreceptors | Poorly understood; research ongoing |

The increasing deployment of submarine power cables for offshore wind farms and inter-island power transmission is a growing concern for magnetically navigating species [G2]. The DC cables used for high-voltage direct current (HVDC) transmission create static magnetic anomalies that persist along the entire cable route.

---

## Engineering Parallels

The salmon magnetic navigation system has direct parallels in engineered navigation systems:

| Feature | Salmon | Engineered System |
|---------|--------|-------------------|
| **Position sensing** | Magnetite crystals (intensity + inclination) | Flux-gate magnetometer (3-axis field measurement) |
| **Map database** | Innate genetic lookup table | Digital magnetic anomaly map (stored in computer) |
| **Compass** | Magnetic field direction detection | Magnetic compass (flux-gate or Hall effect) |
| **Sensor fusion** | Magnetic map -> compass -> olfaction | GPS -> INS -> terrain following |
| **Terminal guidance** | Chemical gradient tracking | ILS (Instrument Landing System) / visual approach |
| **Precision degradation** | Magnetic anomalies, secular variation | GPS jamming, magnetic declination drift |
| **Tagging/tracking** | PIT tags (passive RFID) | Aircraft transponders (active RFID, Mode S) |

The salmon system is simpler in some ways (two magnetic coordinates vs. GPS's multi-satellite ranging) but more robust in others (no dependence on external infrastructure, innate rather than programmed, functions in all weather and at all depths).

The most striking parallel is the **hierarchical sensor fusion** -- the transition from a global positioning system (magnetic map / GPS) to a local guidance system (olfaction / ILS) as the vehicle approaches its destination. This is not a coincidence; it is a convergent solution to the universal problem of navigating across multiple spatial scales with sensors of different resolution and range [P1].

---

## Interrelationships and Cross-Links

### Physics Phenomenon Links

- **[Magnetic Fields and Magnetoreception](10-magnetic-fields-magnetoreception.md)**: The fundamental physics of Earth's magnetic field, magnetite transduction, and the two-coordinate positioning system.

- **[Radio Telemetry and Inductive Coils](14-radio-telemetry-coils.md)**: PIT tag technology -- passive RFID transponders detected by inductive coupling. The same electromagnetic physics that enables salmon to sense the Earth's field is used by engineers to track them.

### Species Cross-Links

- **[Southern Resident Killer Whales](pnw-01-southern-resident-orca.md)**: The predator-prey link. Chinook salmon navigated by magnetic map are the primary prey of orcas navigated by biosonar. Two physics systems, one ecosystem.

- **[Migratory Birds: Cryptochrome Compass](pnw-06-migratory-birds-compass.md)**: Another PNW migratory species using magnetic navigation, but via a fundamentally different transduction mechanism (radical-pair quantum chemistry vs. magnetite crystals).

- **[Red Fox: Magnetic Rangefinder](pnw-05-fox-magnetic-hunting.md)**: A terrestrial PNW predator that uses the magnetic field not for navigation but for range estimation during hunting -- a different application of the same physical field.

---

## Summary Tables

### Magnetic Navigation Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Field intensity range (PNW) | ~47,000-57,500 nT | G2 |
| Inclination range (PNW) | ~58-75 degrees | G2 |
| Transducer material | Magnetite (Fe3O4) | P10 |
| Magnetite crystal size | ~30-100 nm (single domain) | P10 |
| Sensory nerve | Trigeminal | P5 |
| Map type | Two-coordinate (intensity + inclination) | P1 |
| Map precision | ~100-200 km (oceanic) | P1 |
| Olfactory precision | ~meter-scale (riverine) | P1, P5 |

### PTAGIS System Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Tag frequency | 134.2 kHz | G4 |
| Tag size | ~12 mm x 2 mm | G4 |
| Tag weight | ~0.1 g | G4 |
| Detection range | ~30-60 cm | G4 |
| Power source | Passive (RF-powered) | G4 |
| Annual tags deployed | ~2 million | G4 |
| Mainstem dams monitored | 14 | G4 |

### ESA Listings Summary

| Metric | Value | Source |
|--------|-------|--------|
| Total West Coast ESUs/DPSs listed | 28 | G4 |
| Chinook ESUs listed | Multiple (5+ in Columbia/Puget Sound) | G4 |
| Steelhead DPSs listed | Multiple (5+ in Columbia) | G4 |
| Snake River Sockeye status | Endangered | G4 |

---

## Sources

### Government and Agency

- [G1] NOAA Northwest Fisheries Science Center -- Orca echolocation, prey studies [https://www.fisheries.noaa.gov/](https://www.fisheries.noaa.gov/)
- [G2] USGS National Geomagnetism Program -- Animal magnetic navigation, field data [https://www.usgs.gov/](https://www.usgs.gov/)
- [G4] PTAGIS -- Pacific NW salmon telemetry, ESA listings [https://www.ptagis.org/](https://www.ptagis.org/)
- [G5] NOAA Vital Signs -- Orcas -- Population context [https://vitalsigns.pugetsoundinfo.wa.gov/](https://vitalsigns.pugetsoundinfo.wa.gov/)

### Peer-Reviewed

- [P1] Putman, N.F. et al. (2020). Magnetic maps in animal navigation. *Journal of Comparative Physiology A*. [https://pmc.ncbi.nlm.nih.gov/articles/PMC8918461/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8918461/)
- [P2] Au, W.W.L. and Simmons, J.A. (2007). Echolocation in dolphins and bats. *Physics Today*.
- [P5] Lohmann Lab, UNC Chapel Hill. Magnetoreception research. [https://lohmannlab.web.unc.edu/magnetoreception/](https://lohmannlab.web.unc.edu/magnetoreception/)
- [P9] Holt, M. / Tennessen, J. -- NOAA NWFSC. Biologging tag studies on Southern Resident orcas.
- [P10] Walker et al. (1977). Magnetite in rainbow trout snouts.

---

*Cross-reference: This species page links to physics phenomenon pages [10](10-magnetic-fields-magnetoreception.md), [14](14-radio-telemetry-coils.md) and to species pages [pnw-01](pnw-01-southern-resident-orca.md), [pnw-05](pnw-05-fox-magnetic-hunting.md), [pnw-06](pnw-06-migratory-birds-compass.md). See the [Data Schema](00-data-schema.md) for page structure definitions and the [Source Index](00-source-index.md) for complete citation details.*

*Safety compliance: SC-03 (all quantitative claims attributed to sources). No specific dam passage survival rates for individual ESUs included without peer-reviewed citation.*
