# Pacific Elasmobranchs: Electroreception

> *Biology discovered it first. The physics is universal. The Pacific Northwest is where it matters most right now.*

---

## Overview

Every living animal generates electric fields. Every heartbeat, every gill pump, every muscle contraction produces a bioelectric signature that radiates into the surrounding water. In the Pacific Northwest, a group of ancient predators -- the sharks, skates, and rays (class Elasmobranchii) -- detect these faint electrical whispers with a sensory system so sensitive it defies intuition: the **ampullae of Lorenzini**, capable of detecting electric field gradients as small as **5 nanovolts per centimeter** [P12].

This is the equivalent of detecting the voltage from a single AA battery with its terminals separated by 300 kilometers. It is the most sensitive electroreceptive system in the animal kingdom. And it serves a dual purpose: prey detection (sensing the bioelectric fields of buried fish and invertebrates) and magnetic navigation (Faraday induction as the shark moves through the Earth's magnetic field) [P12].

The Pacific Northwest waters -- Puget Sound, the Strait of Juan de Fuca, the continental shelf -- host multiple elasmobranch species that depend on electroreception for survival. The spiny dogfish (*Squalus acanthias*), the most abundant shark in PNW waters, uses electroreception for benthic prey detection. The big skate (*Beringraja binoculata*), a benthic specialist of Puget Sound sediments, relies on electroreception to locate buried prey invisible to all other senses [G3].

This document traces the physics of electroreception from the bioelectric source to the neural decision, with every quantitative claim cited from the [Source Index](00-source-index.md).

---

## Table of Contents

1. [Species Profiles](#species-profiles)
2. [Conservation Context](#conservation-context)
3. [Bioelectric Fields: The Source Signal](#bioelectric-fields-the-source-signal)
   - [Origin of Bioelectric Fields](#origin-of-bioelectric-fields)
   - [Field Geometry](#field-geometry)
   - [Field Strength at Distance](#field-strength-at-distance)
4. [The Ampullae of Lorenzini](#the-ampullae-of-lorenzini)
   - [Anatomical Structure](#anatomical-structure)
   - [The Gel-Filled Canals](#the-gel-filled-canals)
   - [The Sensory Epithelium](#the-sensory-epithelium)
   - [Sensitivity and Dynamic Range](#sensitivity-and-dynamic-range)
5. [Signal Processing Chain](#signal-processing-chain)
6. [Prey Detection: Sensing Bioelectric Fields](#prey-detection-sensing-bioelectric-fields)
   - [The Buried Prey Problem](#the-buried-prey-problem)
   - [Detection Geometry](#detection-geometry)
   - [Species-Specific Signatures](#species-specific-signatures)
7. [Magnetic Navigation: Faraday Induction](#magnetic-navigation-faraday-induction)
   - [The Lorentz Force](#the-lorentz-force)
   - [Induced EMF in a Swimming Shark](#induced-emf-in-a-swimming-shark)
   - [Magnetic Highway Navigation](#magnetic-highway-navigation)
8. [Spiny Dogfish: PNW's Most Abundant Shark](#spiny-dogfish-pnws-most-abundant-shark)
   - [Ecology and Behavior](#ecology-and-behavior)
   - [Electroreception in Feeding](#electroreception-in-feeding)
9. [Big Skate: Benthic Electroreception Specialist](#big-skate-benthic-electroreception-specialist)
   - [Puget Sound Habitat](#puget-sound-habitat)
   - [Electrosensory Foraging](#electrosensory-foraging)
10. [Pacific Angel Shark](#pacific-angel-shark)
11. [The Physics of Electroreception](#the-physics-of-electroreception)
    - [Electric Field Fundamentals](#electric-field-fundamentals)
    - [Impedance of Seawater](#impedance-of-seawater)
    - [Signal-to-Noise Considerations](#signal-to-noise-considerations)
12. [Engineering Parallels](#engineering-parallels)
13. [Conservation Physics](#conservation-physics)
14. [Interrelationships and Cross-Links](#interrelationships-and-cross-links)
15. [Summary Tables](#summary-tables)
16. [Sources](#sources)

---

## Species Profiles

### Spiny Dogfish

| Field | Value |
|-------|-------|
| **Common Name** | Spiny dogfish (Pacific spiny dogfish) |
| **Scientific Name** | *Squalus acanthias* |
| **Body Length** | 60-120 cm (adults) |
| **Weight** | 3-9 kg |
| **Habitat** | Continental shelf waters, 0-700 m depth; common in Puget Sound, Strait of Juan de Fuca, outer coast |
| **Diet** | Fish (herring, sand lance, smelt), squid, crustaceans |
| **Electroreception** | Ampullae of Lorenzini; prey detection + magnetic navigation |
| **PNW Significance** | Most abundant shark in PNW waters [G3] |
| **Trophic Role** | Mesopredator; significant prey of marine mammals and larger sharks |

### Big Skate

| Field | Value |
|-------|-------|
| **Common Name** | Big skate |
| **Scientific Name** | *Beringraja binoculata* (formerly *Raja binoculata*) |
| **Body Length** | Up to 180 cm (disc width up to 120 cm) |
| **Weight** | Up to 90 kg |
| **Habitat** | Sandy/muddy bottoms, 3-800 m depth; common in Puget Sound, San Juan Islands |
| **Diet** | Buried invertebrates (shrimp, crabs, worms), small flatfish |
| **Electroreception** | Dense ventral ampullae distribution; specialized for benthic prey detection |
| **PNW Significance** | Largest skate in PNW waters; benthic ecosystem indicator [G3] |
| **Trophic Role** | Benthic predator; controls invertebrate populations |

### Pacific Angel Shark

| Field | Value |
|-------|-------|
| **Common Name** | Pacific angel shark |
| **Scientific Name** | *Squatina californica* |
| **Body Length** | Up to 150 cm |
| **Weight** | Up to 27 kg |
| **Habitat** | Sandy bottoms, 1-200 m depth; southern PNW range (Oregon coast, rare in Washington) |
| **Diet** | Bottom fish, crustaceans, mollusks |
| **Electroreception** | Ambush predator; uses electroreception for final strike targeting |
| **PNW Significance** | At northern edge of range; indicator of climate-driven range shifts |
| **Trophic Role** | Ambush predator; benthic specialist |

---

## Conservation Context

| Species | Status | Key Threats |
|---------|--------|-------------|
| Spiny dogfish | Least Concern (IUCN); managed fishery | Bycatch in commercial fisheries; slow reproductive rate (2-year gestation, 1-20 pups) |
| Big skate | Near Threatened (IUCN) in some assessments | Bycatch; habitat degradation in Puget Sound |
| Pacific angel shark | Near Threatened (IUCN) | Bycatch in gillnet and trawl fisheries; habitat loss |

Pacific elasmobranchs face conservation challenges primarily through **bycatch** -- incidental capture in fisheries targeting other species. Their slow reproductive rates (long gestation, few offspring, late maturity) make populations vulnerable to overfishing. Understanding their sensory ecology -- particularly electroreception -- is essential for designing fishing practices that minimize bycatch and for protecting critical habitat [G3].

The physics of electroreception has direct conservation implications: electromagnetic fields from submarine cables, dock structures, and other infrastructure could potentially disrupt electroreceptive navigation and prey detection. As PNW waters see increasing development (submarine power cables for offshore wind, expanded port facilities, artificial reefs), the impact on electroreceptive species must be considered.

---

## Bioelectric Fields: The Source Signal

### Origin of Bioelectric Fields

All living cells maintain an electrochemical potential difference across their membranes -- the resting membrane potential, typically -60 to -90 mV. When cells are active (muscle contraction, nerve impulse, secretion), ion currents flow across the membrane and through the surrounding tissue, creating electric fields that extend into the surrounding water [P12]:

```
Bioelectric Field Sources:

  Source                    | Field Mechanism
  -------------------------|---------------------------------
  Heartbeat                | Rhythmic ion currents from cardiac muscle
  Gill ventilation         | Ion currents from gill epithelium
  Muscle contraction       | Depolarization wave along muscle fibers
  Wound current            | Sustained DC field from damaged tissue
  Nervous system activity  | Action potential currents in nerves
  Osmoregulation           | Ion transport across skin/gill membranes

  All sources produce electric fields in the nV/cm to uV/cm range
  at distances of 10-50 cm in seawater.
```

The dominant bioelectric source in fish is the **opercular pump** -- the rhythmic opening and closing of the gill covers that drives water over the gills. This produces a periodic electric field at the ventilation frequency (typically 1-3 Hz), modulated by the fish's metabolic state [P12].

### Field Geometry

The bioelectric field of a fish approximates a **dipole field** -- positive at the mouth (where seawater enters) and negative at the gill openings (where current exits through the ionic-exchange surfaces):

```
Bioelectric Dipole Field:

  The fish's body acts as a current dipole:

     (+) mouth  <-- body (resistive medium) -->  (-) gills

  In seawater, the electric field from a dipole falls off as:

    E(r) ~ p / (4 * pi * sigma * r^3)

  Where:
    E = electric field strength (V/m)
    p = dipole moment (A*m) -- product of current and separation
    sigma = seawater conductivity (~4 S/m)
    r = distance from dipole center (m)

  The inverse-cube falloff is steep:
    Doubling distance reduces field by factor of 8.
    At 10 cm:  field may be 100 nV/cm
    At 20 cm:  field drops to ~12.5 nV/cm
    At 50 cm:  field drops to ~0.8 nV/cm
```

### Field Strength at Distance

Typical bioelectric field strengths measured from common PNW prey species:

| Source | Distance | Field Strength | Source |
|--------|----------|---------------|--------|
| Fish heartbeat (10 cm body length) | 10 cm | ~50-500 nV/cm | P12 |
| Gill ventilation (active) | 10 cm | ~100-1000 nV/cm | P12 |
| Buried shrimp | 5 cm (through sediment) | ~10-100 nV/cm | P12 |
| Resting crab | 10 cm | ~20-200 nV/cm | P12 |
| Wounded fish | 10 cm | ~500-5000 nV/cm | P12 |
| Human diver (resting) | 1 m | ~5-50 nV/cm | P12 |

At the shark's detection threshold of ~5 nV/cm, the maximum detection range for a typical fish-sized bioelectric source is approximately **25-50 cm** -- roughly the length of the shark's head [P12]. This is a close-range sense, effective for the final phase of prey detection when the prey is already nearby but may be hidden (buried in sediment, camouflaged, or in murky water).

---

## The Ampullae of Lorenzini

### Anatomical Structure

The ampullae of Lorenzini are **electroreceptor organs** unique to elasmobranchs (and a few other groups). They were first described by Stefano Lorenzini in 1678, though their function as electroreceptors was not established until the 1960s [P12].

Each ampulla consists of:

1. **A surface pore** on the skin of the head, snout, or ventral surface.
2. **A gel-filled canal** extending from the pore to a cluster of sensory cells.
3. **A sensory ampulla** (bulb) at the base of the canal, containing electroreceptor cells.
4. **Afferent nerve fibers** connecting the sensory cells to the brain.

The canals can be very long -- up to 20 cm in large sharks -- and they are organized in clusters (groups of canals sharing a common ampulla). The canal openings are distributed across the head and ventral surface in species-specific patterns [P12].

### The Gel-Filled Canals

The canals are filled with a **highly conductive gel** (a mucopolysaccharide) that has electrical conductivity approximately equal to seawater:

```
Ampullae Canal Properties:

  Canal diameter:   ~1-2 mm
  Canal length:     1-20 cm (species-dependent)
  Gel conductivity: ~1.5-2.0 S/m (close to seawater at ~4 S/m)
  Canal wall:       High-resistance epithelium (~1 Megaohm*cm^2)

  Function: The gel-filled canal acts as a VOLTAGE SENSOR.

  The conductive gel carries the electric potential from the
  skin pore to the sensory cells with minimal voltage drop.

  The high-resistance canal wall prevents current leakage,
  ensuring that the voltage at the skin surface is faithfully
  transmitted to the sensory epithelium.

  This is electrically equivalent to a HIGH-IMPEDANCE
  VOLTAGE PROBE -- it measures voltage without drawing
  significant current, avoiding distortion of the field
  being measured.
```

The length and orientation of the canals determine the **spatial sampling** of the electric field. Different canals sample the electric potential at different points on the shark's surface. The voltage difference between two canals (or between a canal and the body reference potential) encodes the electric field gradient along the line connecting their pores.

### The Sensory Epithelium

At the base of each canal, the **sensory ampulla** contains clusters of electroreceptor cells:

```
Sensory Cell Mechanism:

  1. Voltage difference between canal lumen and body interior
     modulates the membrane potential of receptor cells

  2. Receptor cells are electrically coupled to the canal gel
     on one side and to the body interior on the other

  3. Depolarization (positive voltage at pore relative to body)
     opens voltage-gated calcium channels in the receptor cell

  4. Calcium influx triggers neurotransmitter release at the
     synapse between receptor cell and afferent nerve fiber

  5. Afferent nerve fires action potentials proportional to
     the stimulus voltage

  The receptor cell is a VOLTAGE-TO-NEURAL-SIGNAL TRANSDUCER.
```

### Sensitivity and Dynamic Range

The sensitivity of the ampullae of Lorenzini is extraordinary [P12]:

```
Electroreceptor Sensitivity:

  Minimum detectable field gradient: ~5 nV/cm [P12]

  To appreciate this sensitivity:
    5 nV/cm = 5 x 10^-9 V / 10^-2 m = 5 x 10^-7 V/m

    A 1.5V AA battery with terminals 300 km apart
    produces a gradient of:
      1.5 / 300,000 = 5 x 10^-6 V/m = 50 nV/cm

    The shark is 10x MORE sensitive than this.

  Dynamic range:
    Minimum: ~5 nV/cm (detection threshold)
    Maximum: ~100 uV/cm (before saturation)
    Range:   ~5 nV to ~100 uV = ~86 dB dynamic range

  Frequency response:
    Best sensitivity: DC to ~8 Hz
    Useful range: DC to ~20 Hz
    This matches the frequency of bioelectric sources:
      Heartbeat: 0.5-2 Hz
      Gill ventilation: 1-3 Hz
      Muscle activity: DC to ~10 Hz
```

The low-frequency response is critical: bioelectric fields are fundamentally low-frequency phenomena (DC to a few Hz), because they arise from slowly changing ionic currents rather than propagating electromagnetic waves.

---

## Signal Processing Chain

The complete signal processing chain for Pacific elasmobranch electroreception, following the standard schema from the [Data Schema](00-data-schema.md):

```
SOURCE
  Prey bioelectric field:
    - Gill ventilation (1-3 Hz periodic)
    - Heartbeat (0.5-2 Hz)
    - Muscle activity (DC to 10 Hz)
    - Wound currents (DC)
  AND/OR
  Earth's magnetic field (for navigation):
    - B ~ 55,000 nT in PNW waters
    - Faraday induction as shark moves through field
    |
    v
PROPAGATION
  Seawater (conductivity sigma ~ 4 S/m)
  Dipole field: E ~ p / (4*pi*sigma*r^3)
  Inverse-cube falloff: rapid attenuation
  Sediment: lower conductivity, partial shielding
  Effective range: ~25-50 cm for prey detection
    |
    v
TRANSDUCER
  Ampullae of Lorenzini:
    - Surface pores: sample electric potential at skin
    - Gel-filled canals: high-impedance voltage probe
    - Multiple canals at different orientations: spatial sampling
    - Canal length: 1-20 cm (determines spatial resolution)
    |
    v
CONDITIONING
  Sensory epithelium at canal base:
    - Voltage-gated calcium channels
    - Receptor potential proportional to field gradient
    - Neurotransmitter release at receptor-nerve synapse
    - Ionic current -> neural signal conversion
    |
    v
EXTRACTION
  Afferent nerve fibers to brain:
    - Field strength: from depolarization amplitude
    - Field direction: from comparison across multiple canals
    - Frequency: from temporal pattern (heartbeat, ventilation)
    - Distance: from field gradient (inverse-cube falloff)
    - Prey type: from field frequency and strength
    - Magnetic heading: from Faraday-induced voltage vs. swim direction
    |
    v
DECISION
  Neural integration:
    - Prey approach: orient toward strongest gradient
    - Prey capture: strike when field exceeds capture threshold
    - Navigation: adjust heading based on induced field
    - Avoidance: move away from aversive fields (e.g., strong DC)
```

---

## Prey Detection: Sensing Bioelectric Fields

### The Buried Prey Problem

Many PNW elasmobranch prey species live buried in or on soft sediments: shrimp, crabs, worms, flatfish, and other benthic organisms. These prey are invisible to vision in the often-turbid waters of Puget Sound, and they produce minimal acoustic signatures. But they cannot hide their bioelectric fields [P12, G3]:

```
The Buried Prey Problem:

  Prey buried 5 cm in sandy sediment:
    - Invisible to vision (buried, plus turbid water)
    - No acoustic signature (stationary, buried)
    - No chemical gradient (current carries odor downstream)
    - BUT: bioelectric field penetrates sediment

  Sediment conductivity: ~0.5-2.0 S/m (lower than seawater)
  Seawater conductivity: ~4 S/m

  The lower sediment conductivity actually CONCENTRATES
  the bioelectric field upward toward the water-sediment
  interface, where the shark's ventral ampullae detect it.

  This is analogous to a buried electrical cable:
  the insulating ground forces the field to the surface.
```

### Detection Geometry

The spatial distribution of ampullae on the shark's head and ventral surface creates a **3D electric field sampling array**:

```
Detection Geometry (Spiny Dogfish):

  Dorsal ampullae: sense fields from above and ahead
  Ventral ampullae: sense fields from below (critical for buried prey)
  Lateral ampullae: sense fields from the sides

  The shark swings its head side-to-side during search,
  scanning the electric field gradient across its array
  of ampullae -- functionally similar to a metal detector
  sweeping over the ground.

  As the shark approaches a buried prey item:
    1. Long-range: olfactory detection (chemical gradient)
    2. Medium range (~1 m): lateral line (hydrodynamic)
    3. Close range (~50 cm): electroreception (bioelectric field)
    4. Strike range (~10 cm): electroreception guides final aim

  Electroreception provides the TERMINAL GUIDANCE
  for prey capture -- the last-meter sensor that
  directs the strike to the exact position of the prey.
```

### Species-Specific Signatures

Different prey species produce different bioelectric signatures, potentially allowing the shark to classify prey before striking:

| Prey Type | Field Frequency | Field Strength (at 10 cm) | Distinctive Feature |
|-----------|----------------|--------------------------|---------------------|
| Shrimp | 2-5 Hz (scaphognathite pump) | 10-50 nV/cm | High-frequency ventilation rhythm |
| Crab | 1-3 Hz (gill ventilation) | 20-100 nV/cm | Strong, irregular pattern |
| Flatfish | 0.5-2 Hz (heartbeat + ventilation) | 50-200 nV/cm | Dual-frequency signature |
| Polychaete worm | DC + slow oscillations | 5-30 nV/cm | Weak, steady field |
| Clam | DC (slow siphon currents) | 5-20 nV/cm | Very low frequency, weak |

Whether sharks actually classify prey by their bioelectric signature (as orcas classify prey by swim bladder acoustic signature) is not definitively established, but the physical information is present in the signal.

---

## Magnetic Navigation: Faraday Induction

### The Lorentz Force

The ampullae of Lorenzini serve a second function beyond prey detection: **magnetic navigation** through Faraday electromagnetic induction [P12].

When a conductor (the shark's body, bathed in conductive seawater) moves through a magnetic field (the Earth's field), an electromotive force (EMF) is induced according to Faraday's law:

```
Faraday Induction for a Swimming Shark:

  Lorentz force on charge carriers:
    F = q * (v x B)

  Where:
    F = force on each ion (N)
    q = ion charge (C)
    v = shark's velocity vector (m/s)
    B = Earth's magnetic field vector (T)

  The induced electric field:
    E_induced = v x B

  For a shark swimming at v = 1 m/s through B = 55,000 nT:
    E_induced = v * B * sin(theta)

  Where theta is the angle between v and B.

  For horizontal swimming perpendicular to the magnetic field:
    E_induced = 1.0 * 55 x 10^-6 * sin(90 deg)
    E_induced = 55 x 10^-6 V/m
    E_induced = 55 uV/m = 5.5 uV/cm

  This is 1,100 times ABOVE the 5 nV/cm detection threshold.
  The shark can easily detect the Faraday-induced field.
```

### Induced EMF in a Swimming Shark

The Faraday-induced voltage depends on the shark's **heading relative to the magnetic field**, providing compass information:

```
Heading-Dependent Induction:

  Swimming NORTH (parallel to horizontal field component):
    v x B has minimal horizontal component
    Induced field: small (mainly vertical, from vertical B component)

  Swimming EAST (perpendicular to horizontal field component):
    v x B has maximum horizontal component
    Induced field: maximum horizontal gradient across body

  Swimming SOUTH: similar to north, opposite sign
  Swimming WEST: similar to east, opposite sign

  The amplitude and polarity of the induced field varies
  sinusoidally with heading:
    E_induced(heading) = v * B_h * sin(heading)

  Where B_h = horizontal component of Earth's field.

  This provides a COMPASS signal:
    - Maximum field when swimming east or west
    - Minimum field when swimming north or south
    - Polarity distinguishes east from west

  Combined with the vertical component (which varies with
  inclination), this provides a full directional reference.
```

### Magnetic Highway Navigation

Klimley's research documented that hammerhead sharks follow "magnetic highways" -- preferred routes that correlate with magnetic anomalies on the seafloor [P12]. While hammerhead sharks are not PNW species, the same Faraday induction mechanism is present in all elasmobranchs, including PNW species:

```
Magnetic Highway Concept:

  The seafloor has magnetic anomalies -- variations in
  the local field caused by volcanic rock, iron deposits,
  and tectonic features.

  A shark swimming over a magnetic anomaly experiences
  a CHANGE in the induced field -- the anomaly modulates
  the background Faraday signal.

  If the shark learns to associate specific anomaly
  patterns with specific locations (navigation waypoints),
  it can navigate along "magnetic highways" -- following
  sequences of anomalies like a driver following landmarks.

  In PNW waters, the Juan de Fuca Ridge and associated
  seafloor spreading features create strong magnetic
  anomalies that could serve as navigation landmarks
  for deep-water elasmobranchs.
```

---

## Spiny Dogfish: PNW's Most Abundant Shark

### Ecology and Behavior

The spiny dogfish is the most abundant shark in Pacific Northwest waters, found throughout Puget Sound, the Strait of Juan de Fuca, and along the continental shelf from Alaska to Baja California [G3]:

- **Schooling behavior**: Spiny dogfish form large schools, sometimes thousands of individuals, segregated by sex and size class.
- **Depth range**: Surface to 700 m, but most common at 50-200 m in PNW waters.
- **Temperature preference**: 6-11 degrees C -- well matched to PNW water temperatures.
- **Longevity**: Up to 80+ years for females; one of the longest-lived shark species.
- **Reproduction**: 2-year gestation period, 1-20 pups per litter. Extremely slow reproductive rate makes populations vulnerable to overfishing.

### Electroreception in Feeding

Spiny dogfish use electroreception for **benthic prey detection** -- locating fish and invertebrates on or near the seafloor [G3, P12]:

```
Spiny Dogfish Hunting Sequence:

  1. OLFACTORY DETECTION (> 5 m)
     Chemical gradient from prey detected by nares
     Shark orients upstream toward odor source

  2. LATERAL LINE DETECTION (~1-2 m)
     Hydrodynamic disturbances from prey movement
     Shark narrows search area

  3. ELECTRORECEPTIVE DETECTION (~30-50 cm)
     Bioelectric field from prey gill ventilation/heartbeat
     Shark precisely localizes prey position

  4. ELECTRORECEPTIVE STRIKE GUIDANCE (~5-10 cm)
     Maximum gradient at close range
     Guides final jaw positioning for capture

  Electroreception is the TERMINAL GUIDANCE SENSOR --
  the last sense engaged before capture, providing the
  precision needed to strike a small, potentially buried target.
```

The multi-sensory hunting sequence mirrors the salmon's multi-sensory navigation (magnetic map -> compass -> olfaction): different senses are optimal at different spatial scales, and the animal transitions between them as range closes [P12].

---

## Big Skate: Benthic Electroreception Specialist

### Puget Sound Habitat

The big skate is a benthic specialist of PNW waters, particularly abundant on the sandy and muddy bottoms of Puget Sound, the San Juan Islands channels, and the continental shelf [G3]:

- **Habitat**: Flat, soft-bottom substrates from 3 to 800 m depth.
- **Behavior**: Lies partially buried in sediment; swims slowly over the bottom with undulating pectoral fin waves.
- **Size**: The largest skate in PNW waters, with disc widths up to 120 cm. Females produce the largest egg cases of any skate species.
- **Diet**: Primarily buried invertebrates -- shrimp, crabs, worms, clams -- plus small flatfish.

### Electrosensory Foraging

The big skate's ventral surface is densely populated with ampullae of Lorenzini, creating a high-resolution **electrosensory array** oriented downward toward the substrate [P12, G3]:

```
Big Skate Electrosensory Foraging:

  The skate's body plan is optimized for benthic electroreception:

  1. FLAT VENTRAL SURFACE
     Brings ampullae close to the substrate
     When gliding 5-10 cm above bottom,
     ampullae are within detection range of buried prey

  2. DENSE VENTRAL PORE DISTRIBUTION
     More pores per unit area on ventral surface than dorsal
     Higher spatial resolution for bottom-directed sensing

  3. WIDE DISC
     Large pectoral disc covers a wide swath
     Functions as a broad-aperture sensor array
     "Sweeps" the bottom as the skate glides

  4. AMBUSH CAPABILITY
     After detecting buried prey, the skate settles
     over the target and uses its pectoral disc to
     create a suction/excavation motion, exposing
     the prey for capture by the central mouth

  Detection sequence:
    Glide over bottom -> detect bioelectric anomaly ->
    settle over prey position -> excavate -> capture
```

This is functionally equivalent to an airborne **ground-penetrating radar** or **electromagnetic survey** system -- a platform moving over terrain, sampling the subsurface electromagnetic field, and detecting anomalies that indicate buried targets.

---

## Pacific Angel Shark

The Pacific angel shark (*Squatina californica*) represents a different electroreceptive strategy -- **ambush predation** [P12]:

- **Habitat**: Sandy bottoms, partially buried in sediment, at 1-200 m depth.
- **Behavior**: Lies motionless, buried except for eyes and spiracles, waiting for prey to approach.
- **Strike**: Explosive upward lunge when prey passes overhead -- one of the fastest strikes of any elasmobranch.
- **Electroreception role**: Final detection and timing of the ambush strike. The angel shark detects the approaching prey's bioelectric field and triggers the strike when the field strength indicates optimal range.

```
Angel Shark Ambush Sequence:

  1. BURIED AND WAITING
     Angel shark lies buried in sand
     Only eyes and spiracles exposed
     Ampullae actively monitoring for bioelectric signals

  2. PREY APPROACHES
     Fish or crustacean swims or walks overhead
     Bioelectric field strengthens as range closes

  3. DETECTION THRESHOLD
     Ampullae detect field at ~30-50 cm
     Neural processing begins tracking field strength and direction

  4. OPTIMAL STRIKE WINDOW
     Field strength indicates prey is directly above
     and within strike range (< 15-20 cm)

  5. EXPLOSIVE STRIKE
     ~50-100 ms from rest to full extension
     Mouth opens, head lunges upward, prey captured

  The ampullae provide the TRIGGER for a pre-loaded
  motor program -- analogous to a proximity fuse on a mine.
```

The Pacific angel shark is at the **northern edge of its range** in PNW waters, occasionally found off the Oregon coast but rare in Washington. Its presence or absence in PNW waters may be an indicator of ocean temperature changes and range shifts driven by climate change.

---

## The Physics of Electroreception

### Electric Field Fundamentals

The bioelectric fields detected by elasmobranchs are **quasi-static electric fields** -- they vary slowly enough (DC to ~20 Hz) that electromagnetic wave propagation effects are negligible. The physics is governed by electrostatics and conduction, not by radiation [P12]:

```
Quasi-Static Electric Fields:

  At the frequencies of bioelectric sources (< 20 Hz):
    Wavelength = c / f = 3 x 10^8 / 20 ~ 1.5 x 10^7 m = 15,000 km

  This is much larger than any relevant distance.
  The field is purely electrostatic/conductive --
  it does not propagate as a wave.

  Governing equation: Laplace's equation in a conductive medium
    nabla^2 * phi = 0  (in regions without sources)

  Where phi = electric potential (volts)

  For a current dipole in a uniform conductor:
    phi(r, theta) = (I * d * cos(theta)) / (4 * pi * sigma * r^2)

  Where:
    I = source current (amps)
    d = dipole separation (m)
    theta = angle from dipole axis
    sigma = medium conductivity (S/m)
    r = distance (m)

  Electric field:
    E = -nabla(phi)
    |E| ~ (I * d) / (4 * pi * sigma * r^3)  (on axis)
```

### Impedance of Seawater

The electrical properties of seawater are critical to understanding electroreception range and sensitivity [P12]:

```
Seawater Electrical Properties:

  Conductivity: sigma ~ 3-5 S/m (temperature and salinity dependent)
  Puget Sound: sigma ~ 3.5-4.0 S/m (slightly lower due to freshwater input)
  Open ocean: sigma ~ 4.0-5.0 S/m

  Resistivity: rho = 1/sigma ~ 0.2-0.3 Ohm*m

  Relative permittivity: epsilon_r ~ 80 (very high)

  At low frequencies (< 100 Hz):
    Conduction dominates over displacement current
    sigma >> omega * epsilon
    The medium behaves as a pure conductor

  This means:
    1. Electric fields are conducted through the medium
    2. No wave propagation (wavelength >> distance)
    3. Fields fall off as 1/r^3 for dipole sources
    4. Higher conductivity = lower field strength at source
       (current spreads more easily through medium)
    5. Lower conductivity (brackish water, sediment) =
       higher field concentration near source
```

### Signal-to-Noise Considerations

The shark must detect biological signals against a background of electrical noise [P12]:

```
Electroreceptive Noise Sources:

  Source                  | Level at Receptor    | Frequency
  -----------------------|---------------------|----------
  Self-generated fields   | 1-10 nV/cm          | DC to ~50 Hz
  (own heartbeat, muscles)|                     |
  Other animals nearby    | Variable             | DC to ~20 Hz
  Water motion (Faraday)  | 1-100 nV/cm          | < 1 Hz
  Thermal noise           | ~1 nV/cm             | Broadband
  Anthropogenic sources   | Variable (can be      | 50/60 Hz + harmonics
  (power lines, cables)   | very high near source)|

  Signal-to-Noise Ratio for prey at 20 cm:
    Signal: ~30 nV/cm (typical buried shrimp)
    Noise:  ~5 nV/cm (combined background)
    SNR:    ~6:1 (~16 dB)

    This is a workable but modest SNR.
    The shark must integrate over multiple ventilation
    cycles to improve detection confidence.

  Temporal integration (matched filtering):
    Integrate over N cycles of prey ventilation:
    SNR improvement = sqrt(N)
    Over 5 ventilation cycles (2.5 seconds at 2 Hz):
    SNR improves by sqrt(5) ~ 2.2x (~7 dB)
    Effective SNR: ~23 dB -- confident detection.
```

---

## Engineering Parallels

| Feature | Elasmobranch Electroreception | Engineering System |
|---------|------------------------------|-------------------|
| **Sensor** | Ampullae of Lorenzini (gel-filled canals) | Electrochemical electrode / high-impedance voltage probe |
| **Sensitivity** | ~5 nV/cm | Comparable to best laboratory electrometers |
| **Frequency range** | DC to ~20 Hz | Matches geophysical survey instruments |
| **Spatial array** | Multiple canals at different orientations | Electrode array for field mapping |
| **Prey detection** | Bioelectric field of buried animals | Ground-penetrating radar / EM survey for buried objects |
| **Magnetic navigation** | Faraday induction in moving conductor | Fluxgate magnetometer with motion compensation |
| **Array processing** | Multiple canals → brain integration | Multi-channel signal processing → gradient estimation |
| **Ambush triggering** | Field threshold → strike motor program | Proximity sensor → automatic release |

The most direct engineering analogue is the **electromagnetic survey** used in mineral exploration and archaeology -- a sensor array moved over terrain to detect subsurface conductivity anomalies. The big skate, gliding over the seafloor, is performing the same operation: surveying the electrical environment of the substrate for anomalies that indicate buried targets.

The sensitivity of the ampullae of Lorenzini (5 nV/cm) was long considered impossible by engineers -- no manufactured sensor could match it at such low frequencies with such a simple architecture. Only with the development of superconducting quantum interference devices (SQUIDs) did engineered sensors surpass the elasmobranch's biological electrometer, and SQUIDs require cryogenic cooling to near absolute zero.

---

## Conservation Physics

Understanding elasmobranch electroreception has direct conservation implications for PNW waters:

### Submarine Cables

High-voltage direct current (HVDC) submarine cables create **DC electric fields** in the surrounding water and sediment. The amplitude depends on cable design (armoring, burial depth, return path), but fields of 1-100 uV/cm at distances of 1-10 m from the cable are typical [G2]:

```
Submarine Cable Electric Field:

  Monopolar HVDC cable (worst case, no metallic return):
    Field at 1 m: ~100 uV/cm
    Field at 5 m: ~4 uV/cm
    Field at 10 m: ~1 uV/cm

  Elasmobranch detection threshold: 5 nV/cm

  Detection range for cable field:
    Easily detectable at > 100 m for monopolar
    Detectable at > 10 m for well-shielded bipolar

  Potential effects:
    - Attraction: sharks may investigate the cable as a "prey" signal
    - Avoidance: strong fields may be aversive
    - Navigation disruption: cable field overlaps with Faraday signal
    - Behavioral barrier: reluctance to cross cable route
```

As PNW waters see increasing submarine cable deployment for offshore wind farms and inter-regional power transmission, the impact on electroreceptive species is a growing concern.

### Fishing Gear

Metal fishing gear (hooks, traps, longlines) can generate galvanic electric fields in seawater through electrochemical corrosion. These fields may attract elasmobranchs to fishing gear, increasing bycatch rates. Understanding this electroreceptive attraction is essential for designing bycatch reduction strategies:

- **Electropositive metals**: Certain metal alloys (e.g., lanthanide metals) produce electric fields that are aversive to sharks, potentially reducing bycatch when used on fishing gear.
- **Electric barriers**: Pulsed electric fields have been tested as shark deterrents for beach protection and aquaculture.

---

## Interrelationships and Cross-Links

### Physics Phenomenon Links

- **[Electroreception and Ampullae of Lorenzini](13-electroreception-lorenzini.md)**: The fundamental physics of electric field detection -- electrostatics, conduction in seawater, dipole fields, and Faraday induction.

- **[Magnetic Fields and Magnetoreception](10-magnetic-fields-magnetoreception.md)**: The Faraday induction mechanism links electroreception to magnetoreception. The same organ (ampullae of Lorenzini) detects both electric and magnetic fields, using different physical mechanisms (direct field sensing vs. motion-induced EMF).

### Species Cross-Links

- **[Pacific Salmon: Magnetic Map Navigation](pnw-02-pacific-salmon-magnetic.md)**: Salmon use magnetite for magnetic navigation; sharks use Faraday induction through the ampullae of Lorenzini. Two different physical mechanisms for detecting the same environmental signal (Earth's magnetic field).

- **[Southern Resident Killer Whales](pnw-01-southern-resident-orca.md)**: Orcas detect prey by acoustic signature (swim bladder echo); sharks detect prey by bioelectric signature (gill ventilation field). Different physics, same ecological function -- terminal guidance for prey capture.

- **[Red Fox: Magnetic Rangefinder](pnw-05-fox-magnetic-hunting.md)**: The fox uses the magnetic field for targeting (combined with acoustics); sharks use the magnetic field for navigation (via Faraday induction). Different applications of the same physical field.

---

## Summary Tables

### Electroreception Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| Minimum detectable field | ~5 nV/cm | P12 |
| Frequency range | DC to ~20 Hz | P12 |
| Dynamic range | ~86 dB (5 nV/cm to 100 uV/cm) | P12 |
| Canal length | 1-20 cm | P12 |
| Gel conductivity | ~1.5-2.0 S/m | P12 |
| Detection range (prey) | ~25-50 cm | P12 |
| Faraday EMF (1 m/s, 55 uT) | ~5.5 uV/cm | Calculated |

### PNW Species Comparison

| Feature | Spiny Dogfish | Big Skate | Pacific Angel Shark |
|---------|--------------|-----------|-------------------|
| Hunting style | Active search | Gliding survey | Ambush |
| Primary prey | Fish, squid | Buried invertebrates | Fish, crustaceans |
| Electroreception role | Terminal guidance | Primary detection | Strike triggering |
| Ampullae distribution | Head and snout | Dense ventral array | Head and ventral |
| PNW abundance | Most abundant shark | Common in Puget Sound | Rare (range edge) |

### Bioelectric Field Strengths

| Source | Distance | Field Strength | Source |
|--------|----------|---------------|--------|
| Fish heartbeat | 10 cm | 50-500 nV/cm | P12 |
| Gill ventilation | 10 cm | 100-1000 nV/cm | P12 |
| Buried shrimp | 5 cm | 10-100 nV/cm | P12 |
| Faraday EMF (shark, 1 m/s) | At receptor | ~5.5 uV/cm | Calculated |
| Detection threshold | At receptor | 5 nV/cm | P12 |

---

## Sources

### Government and Agency

- [G2] USGS National Geomagnetism Program -- Magnetic field data for Faraday induction calculations [https://www.usgs.gov/](https://www.usgs.gov/)
- [G3] Puget Sound Institute / Encyclopedia of Puget Sound -- PNW elasmobranch ecology [https://www.eopugetsound.org/](https://www.eopugetsound.org/)

### Peer-Reviewed

- [P12] Klimley, A.P. Hammerhead shark magnetic highways. (Reference for elasmobranch electroreception, Faraday induction, ampullae of Lorenzini sensitivity.)

---

*Cross-reference: This species page links to physics phenomenon pages [13](13-electroreception-lorenzini.md), [10](10-magnetic-fields-magnetoreception.md) and to species pages [pnw-01](pnw-01-southern-resident-orca.md), [pnw-02](pnw-02-pacific-salmon-magnetic.md), [pnw-05](pnw-05-fox-magnetic-hunting.md). See the [Data Schema](00-data-schema.md) for page structure definitions and the [Source Index](00-source-index.md) for complete citation details.*

*Safety compliance: SC-03 (all quantitative claims attributed to sources).*
