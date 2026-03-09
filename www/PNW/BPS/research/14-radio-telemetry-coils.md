# Radio Transmission, Telemetry, Coils and Inductors

**Physics Domain:** Electromagnetic
**File:** `14-radio-telemetry-coils.md`
**Module:** 2 — Electromagnetic, Magnetic, and Electrostatic Physics

---

## Table of Contents

1. [Introduction](#introduction)
2. [PTAGIS — Pacific Northwest Salmon Telemetry](#ptagis--pacific-northwest-salmon-telemetry)
3. [PIT Tags — Passive Integrated Transponders](#pit-tags--passive-integrated-transponders)
4. [Governing Equations — Electromagnetic Induction](#governing-equations--electromagnetic-induction)
5. [The Resonant Coil — Heart of the PIT Tag](#the-resonant-coil--heart-of-the-pit-tag)
6. [Interrogation Antennas — The Detection Arrays](#interrogation-antennas--the-detection-arrays)
7. [Radio Transmission Physics](#radio-transmission-physics)
8. [The Columbia-Snake River System — Infrastructure at Scale](#the-columbia-snake-river-system--infrastructure-at-scale)
9. [Telemetry Data — Time-Series Science](#telemetry-data--time-series-science)
10. [Biological Coils and Inductors — Resonant Structures in Nature](#biological-coils-and-inductors--resonant-structures-in-nature)
11. [Bioelectric Field Generation — The Physics Sharks Detect](#bioelectric-field-generation--the-physics-sharks-detect)
12. [Engineering: RFID, Inductive Coupling, and Resonant Circuits](#engineering-rfid-inductive-coupling-and-resonant-circuits)
13. [Signal Processing Chain](#signal-processing-chain)
14. [Interrelationships](#interrelationships)
15. [PNW Cross-Reference](#pnw-cross-reference)
16. [Primary Sources](#primary-sources)

---

## Introduction

The Pacific Northwest Salmon Telemetry system (PTAGIS) represents one of the largest and longest-running wildlife radio telemetry programs in the world. Since the 1980s, millions of juvenile salmon have been implanted with Passive Integrated Transponder (PIT) tags — small RFID devices that use the physics of electromagnetic induction, resonant circuits, and radio transmission to identify individual fish as they pass detection arrays at dams, weirs, and stream monitoring stations throughout the Columbia-Snake River system [G4].

This page documents the electromagnetic physics that makes PTAGIS work: coil induction, resonant circuits, radio frequency transmission, and time-series telemetry data. These are the same physics principles that appear throughout this research atlas in biological form — the resonant structures of the mammalian ear, the bioelectric field generation that sharks detect, the electromagnetic fields that salmon navigate through. PTAGIS is the engineering implementation of electromagnetic sensing applied to the same organisms that use biological electromagnetic sensing.

The through-line is direct: an engineering system built on Faraday's law and Ampere's law tracks the movements of organisms that navigate using those same laws implemented in biological tissue.

---

## PTAGIS — Pacific Northwest Salmon Telemetry

### System Overview

PTAGIS (PIT Tag Information System) is managed by the Pacific States Marine Fisheries Commission and funded primarily by the Bonneville Power Administration. It provides the data infrastructure for tracking salmonid migration, survival, and dam passage throughout the Columbia Basin [G4].

```
PTAGIS system overview:

  Established:        1987 (operational)
  Managed by:         Pacific States Marine Fisheries Commission
  Funded by:          Bonneville Power Administration
  Coverage:           Columbia-Snake River basin (includes tributaries)
  Tags deployed:      ~3-5 million per year (cumulative: 60+ million)
  Detection sites:    ~500+ fixed antenna installations
  Dam sites:          14 mainstem Columbia-Snake River dams
  Data access:        Public — ptagis.org
  Species tracked:    Chinook, coho, sockeye, steelhead, bull trout, others
```

### Purpose

The system answers critical conservation and management questions:

```
PTAGIS data applications:

  1. SURVIVAL RATES
     What fraction of juvenile salmon survive passage through
     each dam? Through the entire hydrosystem?
     -> Tagged juveniles detected at successive dams
     -> Survival = fraction detected at dam N+1 / detected at dam N

  2. MIGRATION TIMING
     When do juvenile salmon leave tributaries?
     When do they arrive at each dam?
     What is the travel time between dams?
     -> Time-stamped detections at each array

  3. ADULT RETURNS
     What fraction of tagged juveniles return as adults?
     Which tributaries do they return to?
     Do they reach their natal streams?
     -> Same tag detected years later at adult detection sites

  4. DAM PASSAGE ROUTES
     Do salmon pass through turbines, spillways, or bypass systems?
     Which route has highest survival?
     -> Route-specific detection arrays at each dam

  5. STOCK COMPOSITION
     What populations are present in mixed-stock fisheries?
     -> PIT tag origin data identifies source population

  6. CLIMATE EFFECTS
     How does water temperature, flow, and timing affect migration?
     -> Multi-year time series correlated with environmental data
```

---

## PIT Tags — Passive Integrated Transponders

### What Is a PIT Tag?

A PIT tag is a miniature RFID (Radio Frequency Identification) device — a glass-encapsulated microchip connected to a tiny coil antenna, with no battery:

```
PIT tag specifications (standard salmonid tag):

  Dimensions:
    Length:           12.0 mm (12 mm tag) or 8.5 mm (8 mm tag)
    Diameter:         2.12 mm (12 mm) or 1.4 mm (8 mm)
    Weight:           ~0.1 g (12 mm) or ~0.04 g (8 mm)

  Components:
    1. Glass capsule (biocompatible borosilicate)
    2. Microchip (unique 15-digit hexadecimal ID)
    3. Copper wire coil (antenna, wound around ferrite core)
    4. Tuning capacitor (sets resonant frequency)

  Electrical specifications:
    Frequency:        134.2 kHz (ISO 11784/11785 standard)
    Modulation:       FSK (Frequency Shift Keying)
    Data format:      128-bit code (64-bit ID + header/CRC)
    Power source:     NONE — powered by interrogation field
    Lifetime:         Indefinite (no battery to deplete)
    Read range:       20-50 cm (typical with standard antenna)
```

### Tag Implantation

```
PIT tag implantation in juvenile salmon:

  Method:
    1. Fish anesthetized (MS-222 or AQUI-S)
    2. Small incision in body cavity (ventral, anterior to pelvic fins)
    3. Tag injected through incision with hypodermic needle
    4. Incision heals within days
    5. Tag remains in body cavity for life of fish

  Fish size requirements:
    12 mm tag: fish must be >= 60 mm fork length
    8 mm tag:  fish must be >= 45 mm fork length
    Tag weight must be < 5% of fish body weight (welfare standard)

  Tagging scale:
    A single hatchery may tag 50,000-200,000 juveniles per year
    Multiple hatcheries and wild fish traps operate simultaneously
    Columbia Basin total: ~3-5 million tags per year
```

### How the Tag Works — Step by Step

```
PIT tag operation sequence:

  1. INTERROGATION FIELD GENERATED
     Large antenna coil at detection site is energized
     AC current at 134.2 kHz flows through antenna
     This creates an oscillating magnetic field (near field)

     Field equation:
       B(r) = (mu_0 * N * I * A) / (2 * pi * r^3)   [on-axis, dipole approx.]

     where:
       N = number of turns in antenna coil
       I = current (A)
       A = antenna area (m^2)
       r = distance from antenna (m)

  2. PIT TAG ENTERS FIELD
     As tagged fish swims past antenna, the tag's coil
     intercepts the oscillating magnetic field

     Induced voltage (Faraday's law):
       V_induced = -N_tag * d(Phi_B)/dt = N_tag * A_tag * omega * B_peak * sin(omega*t)

     where:
       N_tag = number of turns in tag coil (~100-200)
       A_tag = cross-sectional area of tag coil (~3 mm^2)
       omega = 2 * pi * 134,200 Hz
       B_peak = peak magnetic field at tag location

  3. RESONANCE AMPLIFIES SIGNAL
     The tag coil + capacitor form a resonant LC circuit
     Tuned to 134.2 kHz (the interrogation frequency)

     At resonance, the voltage across the capacitor is amplified by Q:
       V_resonant = Q * V_induced

     Q factor of typical PIT tag: ~20-50
     Amplification: 20-50x the raw induced voltage

  4. CHIP POWERS UP
     The amplified voltage is rectified by an on-chip diode
     Charges an on-chip capacitor to ~2-3 V
     Chip logic circuits activate

  5. TAG TRANSMITS ID
     Chip modulates the impedance of the coil
     This changes the loading on the interrogation antenna
     (backscatter modulation)

     OR: chip generates its own response signal at a slightly
     different frequency (FSK modulation)

     The 128-bit code is transmitted in ~20-30 ms

  6. ANTENNA DETECTS RESPONSE
     The interrogation antenna (or a separate receive antenna)
     detects the tag's response signal
     Signal is demodulated to extract the 128-bit ID code

  7. DATA LOGGED
     Tag ID + timestamp + antenna location -> PTAGIS database
     Available to researchers within hours/days
```

---

## Governing Equations — Electromagnetic Induction

### Faraday's Law — The Foundation

The entire PIT tag system operates on Faraday's law of electromagnetic induction — the same law that governs the Faraday navigation signal in sharks (see [Electroreception and Ampullae of Lorenzini](13-electroreception-lorenzini.md)):

```
Faraday's Law:

  EMF = -d(Phi_B)/dt

  where:
    EMF = electromotive force (V)
    Phi_B = magnetic flux through a surface (Wb)
    t = time (s)

  Magnetic flux:
    Phi_B = integral(B . dA) = B * A * cos(theta)  [uniform field]

  where:
    B = magnetic field (T)
    A = area of coil (m^2)
    theta = angle between B and normal to coil surface

  For a coil with N turns:
    EMF = -N * d(Phi_B)/dt

  For sinusoidal excitation at frequency f:
    B(t) = B_0 * sin(2*pi*f*t)
    Phi_B(t) = N * A * B_0 * sin(2*pi*f*t) * cos(theta)
    EMF(t) = N * A * B_0 * 2*pi*f * cos(2*pi*f*t) * cos(theta)
    EMF_peak = N * A * B_0 * 2*pi*f * cos(theta)

  This is the voltage induced in the PIT tag coil by the
  interrogation antenna's oscillating magnetic field.
```

### Ampere's Law — The Interrogation Field

The interrogation antenna creates its magnetic field according to Ampere's law:

```
Ampere's Law (integral form):

  integral(B . dL) = mu_0 * I_enclosed

  For a circular loop antenna (the most common PTAGIS configuration):

  On the axis of the loop at distance z:
    B_z = (mu_0 * I * a^2) / (2 * (a^2 + z^2)^(3/2))

  where:
    B_z = field on axis (T)
    I = current in loop (A)
    a = radius of loop (m)
    z = distance along axis from center of loop (m)

  For a multi-turn coil (N turns):
    B_z = (mu_0 * N * I * a^2) / (2 * (a^2 + z^2)^(3/2))

  The field falls off approximately as 1/z^3 at distances z >> a.
  This limits the detection range to approximately 1-2 antenna diameters.
```

### Mutual Inductance

The coupling between the interrogation antenna and the PIT tag coil is described by mutual inductance:

```
Mutual inductance between antenna and tag:

  M = k * sqrt(L_antenna * L_tag)

  where:
    M = mutual inductance (H)
    k = coupling coefficient (0 <= k <= 1)
    L_antenna = self-inductance of interrogation antenna (H)
    L_tag = self-inductance of PIT tag coil (H)

  The coupling coefficient depends on:
    - Distance between antenna and tag
    - Relative orientation (alignment)
    - Size ratio (antenna area / tag area)
    - Medium between them (water, fish tissue)

  Typical values for PTAGIS:
    L_antenna ~ 100 uH (large loop antenna)
    L_tag ~ 1 uH (tiny coil inside tag)
    k ~ 0.001-0.01 (weak coupling at 20-50 cm range)
    M ~ 0.001 * sqrt(100e-6 * 1e-6) = 10 nH

  The induced voltage in the tag:
    V_tag = M * dI_antenna/dt = M * I_0 * omega * cos(omega*t)

  For I_0 = 1 A, f = 134.2 kHz, M = 10 nH:
    V_tag_peak = 10e-9 * 1 * 2*pi*134200 = 8.4 mV

  With Q amplification (Q = 30):
    V_resonant = 30 * 8.4 mV = 252 mV

  This is sufficient to power the chip (~200 mV threshold).
```

---

## The Resonant Coil — Heart of the PIT Tag

### LC Resonance

The PIT tag's coil and capacitor form an LC resonant circuit — the same physics that governs radio tuners, crystal oscillators, and the resonant structures of the cochlea:

```
LC resonant circuit in the PIT tag:

  Components:
    L = inductance of coil (~1 uH)
    C = tuning capacitor (~1.4 nF)

  Resonant frequency:
    f_0 = 1 / (2 * pi * sqrt(L * C))

  For L = 1 uH, C = 1.4 nF:
    f_0 = 1 / (2 * pi * sqrt(1e-6 * 1.4e-9))
    f_0 = 1 / (2 * pi * sqrt(1.4e-15))
    f_0 = 1 / (2 * pi * 3.74e-8)
    f_0 = 1 / (2.35e-7)
    f_0 = 4.26 x 10^6 Hz ???

  Let me recalculate with correct values:
  Target: f_0 = 134.2 kHz

    f_0 = 1 / (2 * pi * sqrt(L * C))
    sqrt(L * C) = 1 / (2 * pi * 134200) = 1.186 x 10^-6
    L * C = 1.407 x 10^-12

  For L = 1 mH (more realistic for a wound coil):
    C = 1.407e-12 / 1e-3 = 1.407 nF

  Resonant circuit parameters:
    L ~ 1 mH (tag coil, ~150 turns on ferrite core)
    C ~ 1.4 nF (on-chip or discrete capacitor)
    f_0 = 134.2 kHz (matched to interrogation frequency)
```

### Quality Factor (Q)

```
Quality factor of the PIT tag resonant circuit:

  Q = (1 / R) * sqrt(L / C)

  where:
    R = resistance of the coil wire (Ohm)
    L = inductance (H)
    C = capacitance (F)

  For L = 1 mH, C = 1.4 nF, R = 50 Ohm:
    Q = (1/50) * sqrt(1e-3 / 1.4e-9)
    Q = 0.02 * sqrt(714,286)
    Q = 0.02 * 845.5
    Q = 16.9

  The Q factor determines:
    1. Voltage amplification at resonance: V_out = Q * V_in
    2. Bandwidth: BW = f_0 / Q = 134200 / 17 ~ 7.9 kHz
    3. Energy storage: E = (1/2) * C * V^2 = (1/2) * Q^2 * C * V_in^2

  Practical PIT tag Q values: ~15-50
  Higher Q = more amplification but narrower bandwidth (more frequency-selective)
  Lower Q = less amplification but wider bandwidth (more tolerant of detuning)
```

### Biological Resonance Analogy

The PIT tag's LC resonant circuit has a direct biological analogy in the cochlea:

```
Resonant circuit analogies:

  PIT Tag (LC circuit):              Cochlea (mechanical resonator):
  -----------------------            -----------------------------
  Inductor L (coil)                  Mass m (basilar membrane mass)
  Capacitor C                        Spring k (basilar membrane stiffness)
  Resistance R (wire)                Damping b (viscous fluid)
  f_0 = 1/(2*pi*sqrt(LC))           f_0 = 1/(2*pi*sqrt(k/m))
  Q = (1/R)*sqrt(L/C)               Q = sqrt(k*m) / b
  Voltage amplification: Q*V_in      Displacement amplification: Q*x_in

  Both systems:
    - Are frequency-selective (tuned to specific frequency)
    - Amplify signals at the resonant frequency
    - Have a bandwidth determined by damping/resistance
    - Can be cascaded (cochlea: tonotopic array; RFID: multiple tags)
```

See also the bat auditory fovea — a region of the cochlea with very high Q, acting as a biological equivalent of a high-Q resonant circuit tuned to the bat's reference frequency [P6].

---

## Interrogation Antennas — The Detection Arrays

### Antenna Types

PTAGIS uses several antenna configurations depending on the installation:

```
PTAGIS antenna configurations:

  1. PASS-THROUGH ANTENNA (dam bypass/ladder)
     Configuration: Large rectangular coil around a channel
     Dimensions: 1-3 m wide x 0.3-1 m tall
     Turns: 5-20
     Frequency: 134.2 kHz
     Detection efficiency: ~95-99% (fish must pass through coil)
     Application: Juvenile bypass systems, fish ladders

  2. FLAT-PLATE ANTENNA (weirs, traps)
     Configuration: Flat coil embedded in channel floor/wall
     Dimensions: 0.5-2 m diameter
     Turns: 10-50
     Detection range: ~30-50 cm
     Detection efficiency: ~80-95%
     Application: Fish traps, small stream weirs

  3. INSTREAM ANTENNA (natural channels)
     Configuration: Cable loop laid on stream bottom
     Dimensions: 1-5 m span
     Detection range: ~20-40 cm above cable
     Detection efficiency: ~70-90%
     Application: Natural stream monitoring, tributary confluences

  4. TRAWL/MOBILE ANTENNA
     Configuration: Portable antenna frame towed through water
     Dimensions: 1-2 m
     Application: Estuary and marine sampling
```

### Dam Installation Layout

```
Typical dam PIT tag detection layout (e.g., Bonneville Dam):

  UPSTREAM APPROACH
    |
  JUVENILE BYPASS SYSTEM
    Entrance -> Dewatering -> PIT TAG ANTENNA 1 -> Outfall
                                 |
                              (detects bypassed juveniles)
    |
  TURBINE INTAKE
    No detection (fish passing through turbines are not PIT-detected)
    |
  SPILLWAY
    Some dams have PIT detection at spillway (limited)
    |
  FISH LADDER (adult passage)
    Entrance -> Weirs -> PIT TAG ANTENNA 2 -> Exit
                             |
                          (detects returning adults)

  Each dam typically has:
    - 1-4 juvenile detection antennas
    - 1-2 adult detection antennas
    - Continuous operation (24/7/365)
    - Data transmitted to PTAGIS central database
```

---

## Radio Transmission Physics

### Near-Field vs Far-Field

PIT tag systems operate in the near field of the interrogation antenna, which has different physics than far-field radio transmission:

```
Near-field vs far-field electromagnetic transmission:

  NEAR FIELD (PIT tag regime):
    Distance: r << lambda / (2*pi)
    For f = 134.2 kHz: lambda = c/f = 3e8/134200 = 2,236 m
    Near-field boundary: lambda/(2*pi) = 356 m
    PIT tag range: ~0.5 m << 356 m (DEFINITELY near field)

    Near-field characteristics:
      - Field is predominantly magnetic (B >> E in near field of loop)
      - Field decays as 1/r^3 (magnetic dipole)
      - Energy is not radiated — it oscillates back and forth
      - Coupling is inductive (transformer-like)
      - Antenna impedance is primarily reactive (inductive)

  FAR FIELD (traditional radio):
    Distance: r >> lambda / (2*pi)
    Far-field characteristics:
      - E and B are in fixed ratio: E/B = c
      - Field decays as 1/r
      - Energy is radiated and lost
      - Coupling is through radiated electromagnetic waves

  The PIT tag system is NOT radio transmission in the
  traditional sense — it is inductive coupling in the
  near field. The interrogation antenna is not broadcasting
  a radio wave; it is creating an oscillating magnetic field
  that inductively couples to the tag's coil.
```

### Frequency Choice — Why 134.2 kHz?

```
Rationale for 134.2 kHz:

  1. Water penetration:
     Low frequencies penetrate water better than high frequencies
     Skin depth in seawater at 134.2 kHz:
       delta = sqrt(2 / (omega * mu_0 * sigma))
       delta = sqrt(2 / (2*pi*134200 * 4*pi*1e-7 * 5))
       delta = sqrt(2 / (2.37))
       delta = 0.92 m

     In freshwater (sigma ~ 0.01 S/m):
       delta = sqrt(2 / (2*pi*134200 * 4*pi*1e-7 * 0.01))
       delta = sqrt(2 / (4.74e-3))
       delta = 20.5 m

     At 134.2 kHz, the field penetrates freshwater with
     negligible attenuation over PIT tag detection distances.

  2. Tag size:
     Higher frequency = smaller coil needed (fewer turns, less inductance)
     134.2 kHz allows a tag coil that fits in a 12 mm capsule
     while still providing adequate coupling.

  3. ISO standard:
     134.2 kHz is the international standard for animal identification
     (ISO 11784/11785), enabling interoperability across systems.

  4. Regulatory:
     134.2 kHz is in a frequency band allocated for RFID applications
     with minimal interference from/to other radio services.
```

### Backscatter Modulation

```
How the PIT tag communicates its ID:

  BACKSCATTER MODULATION:

  The tag does not have a transmitter. Instead, it modulates
  the load it presents to the interrogation field:

  Step 1: Interrogation antenna creates field at 134.2 kHz
  Step 2: Tag coil absorbs energy from field (loads the antenna)
  Step 3: Tag chip modulates its input impedance
          (switches a load resistor on/off according to data bits)
  Step 4: Load modulation changes the current in the interrogation
          antenna (antenna "feels" the changing load)
  Step 5: A sensitive receiver on the interrogation antenna
          detects the tiny modulation (~0.01-0.1% of drive signal)
  Step 6: Demodulation extracts the bit sequence -> tag ID

  This is analogous to a person on shore holding a mirror
  and flashing sunlight to a ship. The person doesn't generate
  the light — they modulate (reflect) an existing source.

  Data encoding:
    FSK (Frequency Shift Keying):
      Logic 0 = tag oscillates at f_0
      Logic 1 = tag oscillates at f_0 + delta_f
      delta_f ~ 2-5 kHz

    Bit rate: ~4 kbits/s
    128-bit code: transmitted in ~32 ms
    Multiple reads per passage: ~5-20 (fish in field for 0.5-2 s)
```

---

## The Columbia-Snake River System — Infrastructure at Scale

### The 14 Mainstem Dams

The Columbia-Snake River system contains 14 federal dams on the mainstem, each with PIT tag detection capability:

```
Columbia-Snake River mainstem dams with PIT detection:

  COLUMBIA RIVER (downstream to upstream):
  1.  Bonneville Dam        (RM 146)   Built: 1938   PIT: Yes
  2.  The Dalles Dam        (RM 192)   Built: 1957   PIT: Yes
  3.  John Day Dam          (RM 216)   Built: 1971   PIT: Yes
  4.  McNary Dam            (RM 292)   Built: 1954   PIT: Yes
  5.  Priest Rapids Dam     (RM 397)   Built: 1961   PIT: Yes
  6.  Wanapum Dam           (RM 415)   Built: 1963   PIT: Yes
  7.  Rock Island Dam       (RM 453)   Built: 1933   PIT: Yes
  8.  Rocky Reach Dam       (RM 474)   Built: 1961   PIT: Yes
  9.  Wells Dam             (RM 516)   Built: 1967   PIT: Yes
  10. Chief Joseph Dam      (RM 545)   Built: 1955   PIT: Limited
  11. Grand Coulee Dam      (RM 597)   Built: 1942   PIT: No (no fish passage)

  SNAKE RIVER (downstream to upstream):
  12. Ice Harbor Dam        (RM 10)    Built: 1962   PIT: Yes
  13. Lower Monumental Dam  (RM 42)    Built: 1969   PIT: Yes
  14. Little Goose Dam      (RM 70)    Built: 1970   PIT: Yes
  15. Lower Granite Dam     (RM 107)   Built: 1975   PIT: Yes

  RM = river mile from mouth of Columbia

  Note: Dams are numbered here for reference; the traditional
  "14 mainstem dams" count varies by source depending on
  which dams are included.
```

### Detection Scale

```
PTAGIS detection scale in the Columbia Basin:

  Annual tag deployments:    ~3-5 million tags
  Annual detections:         ~20-50 million detection events
  Active detection sites:    ~500+
  Historical data records:   Hundreds of millions of detections
  Data publicly available:   Yes (ptagis.org)
  Time coverage:             1987-present (~37+ years)

  A single Chinook salmon tagged as a juvenile at Lower Granite Dam
  might be detected:
    - Lower Granite Dam (tagging and release)
    - Little Goose Dam (juvenile passage)
    - Lower Monumental Dam (juvenile passage)
    - Ice Harbor Dam (juvenile passage)
    - McNary Dam (juvenile passage)
    - John Day Dam (juvenile passage)
    - Bonneville Dam (juvenile passage, entering ocean)
    - [Ocean phase: 1-5 years, no PIT detection]
    - Bonneville Dam (adult return, fish ladder)
    - The Dalles Dam (adult passage)
    - McNary Dam (adult passage)
    - Ice Harbor Dam (adult passage)
    - Lower Monumental Dam (adult passage)
    - Little Goose Dam (adult passage)
    - Lower Granite Dam (adult return to origin)

  Each detection: tag ID + timestamp + antenna ID
  Total individual trajectory: 10-15 detections over 2-5 years
```

---

## Telemetry Data — Time-Series Science

### What Telemetry Means

Telemetry is the automatic measurement and wireless transmission of data from remote sources. PTAGIS is a telemetry system: each PIT tag detection is a data point transmitted (via the electromagnetic coupling mechanism) from the fish to the detection antenna, then relayed to the central database [G4].

```
Telemetry data structure:

  Each PTAGIS detection record contains:

  Field               Example                    Data Type
  ----------------------------------------------------------------
  Tag ID              3D9.1BF1234567             Hexadecimal string
  Detection time      2025-05-15 14:23:07.332    Timestamp (ms resolution)
  Antenna ID          BON-JBS-A01                Location identifier
  Dam/site name       Bonneville Dam             Text
  Antenna type        Juvenile bypass, coil 1    Configuration info
  Detection count     1 of 12                    Integer

  From these raw records, derived quantities include:

  1. TRAVEL TIME between sites:
     T_travel = T_detect(site_B) - T_detect(site_A)

  2. MIGRATION RATE:
     v_migration = Distance(A->B) / T_travel   (km/day)

  3. SURVIVAL RATE:
     S(A->B) = N_detected(B) / N_detected(A)
     (corrected for detection efficiency)

  4. DAM PASSAGE TIME:
     T_passage = T_detect(downstream antenna) - T_detect(upstream antenna)
```

### Time-Series Analysis

The PTAGIS dataset is one of the largest ecological time-series datasets in existence:

```
Time-series analysis applications:

  1. ANNUAL SURVIVAL TRENDS
     S(year) = survival rate from tributary to ocean by year
     37+ years of data -> climate trend detection
     Correlation with: water temperature, flow, PDO, ENSO

  2. WITHIN-YEAR MIGRATION TIMING
     T_median(year) = median passage date at each dam
     Shift in timing: indicator of climate/phenology change
     PNW salmon: timing shifting 1-2 weeks earlier over 30 years

  3. DAM-SPECIFIC SURVIVAL
     S(dam, route, year) = route-specific survival at each dam
     Used to evaluate: spillway operations, bypass improvements,
     turbine design changes

  4. POPULATION VIABILITY ANALYSIS
     Life-cycle models use PIT tag survival estimates
     to project population trends
     Critical for ESA-listed stocks (many PNW salmon populations)

  5. FISH PASSAGE EFFICIENCY
     FPE = fraction of fish using non-turbine routes
     Target: FPE > 95% at each dam
     PIT data used to optimize spill timing and bypass operations
```

### Data Resolution and Scale

```
PTAGIS data characteristics:

  Temporal resolution: millisecond (detection timestamp)
  Spatial resolution:  antenna-specific (~1-5 m)
  Individual resolution: unique to each fish (PIT tag ID)
  Population coverage: ~5-30% of juvenile run (tagged fraction)
  Duration: 37+ years continuous operation
  Data volume: ~50+ TB total (estimated)

  This is INDIVIDUAL-LEVEL data for MILLIONS of organisms
  over DECADES. No other wildlife monitoring system matches
  this combination of individual resolution, population
  coverage, and temporal depth.
```

---

## Biological Coils and Inductors — Resonant Structures in Nature

### The Cochlea as a Resonant Array

The mammalian cochlea is a biological implementation of an array of resonant elements — conceptually similar to an array of LC circuits each tuned to a different frequency:

```
Cochlea as resonant circuit array:

  Engineering (RFID):              Biology (Cochlea):
  ------------------               -------------------
  LC circuit                       Basilar membrane segment
  L = inductance (coil)            m = mass (membrane mass per unit length)
  C = capacitance                  1/k = compliance (1/stiffness)
  R = resistance                   b = damping (viscous fluid)
  f_0 = 1/(2*pi*sqrt(LC))         f_0 = 1/(2*pi) * sqrt(k/m)
  Q = resonant amplification       Q = resonant amplification
  Array of circuits at              Tonotopic array: base to apex
  different frequencies             20 kHz -> 20 Hz

  The cochlea IS a bank of resonant filters —
  a biological spectrum analyzer.
```

### Ossicular Chain as Impedance Transformer

The middle ear ossicles (malleus, incus, stapes) function as a mechanical impedance-matching transformer — analogous to an electrical transformer with its coil windings:

```
Ossicular chain as transformer:

  Engineering transformer:          Biological transformer:
  -------------------------         -----------------------
  Primary coil (N_1 turns)          Tympanic membrane (large area A_1)
  Secondary coil (N_2 turns)        Stapes footplate (small area A_2)
  Turns ratio: N_1/N_2              Area ratio: A_1/A_2 ~ 17:1
  Voltage step-up: N_2/N_1          Pressure step-up: A_1/A_2 ~ 17:1
  Impedance matching:               Impedance matching:
    Z_source * (N_1/N_2)^2            Z_air matched to Z_cochlear fluid

  The ossicular chain matches the low impedance of air
  (Z_air ~ 412 Pa*s/m) to the high impedance of cochlear
  fluid (Z_fluid ~ 1.5 x 10^6 Pa*s/m).

  Without this matching, ~99.9% of sound energy would be
  reflected at the air-fluid boundary (30 dB loss).
  The ossicular transformer recovers ~25-28 dB of this loss.

  This is the same physics as an electrical impedance-matching
  transformer — implemented in bone and tissue.
```

### Hair Cells as Resonant Transducers

Individual hair cells in the cochlea exhibit resonant tuning — each cell is most sensitive to a specific frequency:

```
Hair cell resonance:

  Mechanism:
    Electrical resonance in the cell membrane
    Created by interaction between:
      - Voltage-gated Ca^2+ channels (inward current)
      - Ca^2+-activated K+ channels (outward current)
    These create a damped oscillation in membrane potential

  Resonant frequency:
    f_0 = 1 / (2*pi*tau) where tau = RC time constant of membrane

  Varies along cochlea:
    Base:  f_0 ~ 10-20 kHz (short tau, many channels)
    Apex:  f_0 ~ 50-200 Hz (long tau, fewer channels)

  Q factor:
    Typical: Q ~ 2-10 (moderate selectivity)
    Bat auditory fovea: Q ~ 100+ (extremely sharp tuning)

  Each hair cell is a biological resonant element:
    - An LC circuit in engineering terms
    - An oscillator tuned to extract one frequency from a broadband input
    - Part of a tonotopic array spanning the audible range
```

---

## Bioelectric Field Generation — The Physics Sharks Detect

### The Connection

Every PIT-tagged salmon generates two kinds of electromagnetic signatures:

1. **Biological:** The bioelectric field produced by its own metabolism (see [Electroreception and Ampullae of Lorenzini](13-electroreception-lorenzini.md))
2. **Artificial:** The electromagnetic signature of the PIT tag when interrogated

Both are detectable by electroreceptive predators:

```
Electromagnetic signatures of a PIT-tagged salmon:

  BIOLOGICAL (always present):
    Source:      Gill ion transport, muscle activity, heartbeat
    Frequency:   0.5-8 Hz
    Field:       ~100-500 uV at body surface
    Range:       ~10-50 cm (detectable by sharks)
    Duration:    Continuous (while alive)

  ARTIFICIAL (when near interrogation antenna):
    Source:      PIT tag + interrogation antenna interaction
    Frequency:   134.2 kHz
    Field:       ~1-10 mV at tag location
    Range:       ~20-50 cm (detection range of PIT system)
    Duration:    ~0.5-2 seconds per antenna passage

  Potential interaction:
    Could the 134.2 kHz PIT interrogation field be detected
    by electroreceptive sharks?

    Shark ampullary passband: 0.5-8 Hz
    PIT frequency: 134.2 kHz

    The PIT frequency is ~17,000x above the ampullary passband.
    Sharks are essentially blind to the PIT interrogation field.
    No known interaction between PIT systems and shark behavior.
```

### Muscle and Nerve Bioelectric Fields

The bioelectric fields that sharks detect are generated by the same electrochemical processes measured by medical instruments:

```
Bioelectric field generation — biological principles:

  SOURCE: Transmembrane ion transport

  Every cell maintains a resting membrane potential:
    V_membrane ~ -70 mV (interior negative)

  This is created by ion pumps and channels:
    Na+/K+ ATPase: pumps 3 Na+ out, 2 K+ in
    K+ leak channels: K+ diffuses out (negative interior)
    Na+ channels: Na+ diffuses in (when activated)

  When many cells are aligned and synchronous (as in muscle
  or nerve tissue), their individual dipole fields sum:

    E_total = N * E_single * alignment_factor

  This is directly measurable:
    ECG (electrocardiogram):  heart muscle activity, ~1 mV
    EMG (electromyogram):      skeletal muscle activity, ~0.1-1 mV
    EEG (electroencephalogram): brain activity, ~10-100 uV

  These are the SAME fields that sharks detect with their
  ampullae — generated by the same ion transport physics.

  In fish:
    Gill epithelium: largest area of ion transport
    Generates strongest bioelectric field (~100-500 uV at body)
    The "electric signature" of a fish species depends on
    gill area, metabolic rate, and body geometry.

  NOAA NWFSC research confirms that Southern Resident orcas
  identify Chinook salmon by acoustic signature (swim bladder echo).
  Sharks identify the same Chinook by bioelectric signature
  (gill ion transport field). Same prey, different physics.
```

---

## Engineering: RFID, Inductive Coupling, and Resonant Circuits

### RFID Technology Family

PIT tags are part of the broader RFID technology family:

```
RFID technology spectrum:

  Frequency Band    Range        Standard       Application
  ----------------------------------------------------------------
  LF (125-134 kHz)  < 50 cm     ISO 11784/85   Animal ID (PIT tags)
                                                Access control
  HF (13.56 MHz)    < 1 m       ISO 14443/15693 Contactless payment
                                                Library books
  UHF (860-960 MHz) 1-12 m      EPC Gen2        Supply chain, inventory
  Microwave (2.4+)  > 10 m      Various          Toll collection
                                                Vehicle tracking

  PIT tags use the LF band because:
    1. Best water penetration
    2. Robust coupling at short range
    3. Simple, reliable, no battery needed
    4. ISO standard for animal identification
    5. Longest operational life (no degradation)
```

### Inductive Coupling Engineering

```
Inductive coupling principles (engineering implementation):

  TRANSFORMER:
    Primary coil (N_1 turns) -> Mutual inductance M -> Secondary coil (N_2)
    V_2 / V_1 = N_2 / N_1 (ideal transformer)

  WIRELESS POWER TRANSFER (WPT):
    Same physics as transformer, but with air/water gap
    Efficiency: eta = k^2 * Q_1 * Q_2 / (1 + k^2 * Q_1 * Q_2)
    k = coupling coefficient, Q = quality factors

    For PIT tag: k ~ 0.01, Q ~ 20
    eta ~ (0.0001 * 400) / (1 + 0.0001 * 400) = 0.04 / 1.04 = 3.8%
    Only ~4% of the interrogation energy reaches the tag.
    But the tag needs only ~10 uW to operate -> works.

  RESONANT INDUCTIVE COUPLING:
    When both primary and secondary are tuned to the same
    frequency, the coupling is enhanced by the Q factors:

    V_tag = Q_tag * M * dI_antenna/dt

    This is why the resonant frequency must match precisely.
    Detuning by even a few percent dramatically reduces coupling.

  Applications using the same physics:
    - Wireless phone charging (Qi standard, 100-200 kHz)
    - Cochlear implants (inductive link across skull)
    - Pacemaker programming (inductive data link)
    - Electric vehicle charging (WPT, 85 kHz)
    - NFC (Near Field Communication, 13.56 MHz)
```

### Resonant Circuit Applications

```
Resonant circuits in engineering:

  Application              f_0          Q       Function
  ----------------------------------------------------------------
  PIT tag                  134.2 kHz    ~20     Energy harvesting + ID
  AM radio tuner           535-1700 kHz ~50     Station selection
  FM radio tuner           88-108 MHz   ~100    Station selection
  Crystal oscillator       1-100 MHz    ~10^5   Frequency reference
  Quartz watch             32,768 Hz    ~10^4   Timekeeping
  MRI resonance            42.58 MHz/T  varies  Medical imaging
  Wireless charging (Qi)   100-200 kHz  ~50     Power transfer
  Cochlear implant         5-10 MHz     ~30     Data + power transfer

  All based on the same LC resonance equation:
    f_0 = 1 / (2*pi*sqrt(LC))

  Biology uses the SAME equation, with mass and compliance
  replacing inductance and capacitance. The physics is identical;
  the implementation medium differs.
```

---

## Signal Processing Chain

```
Complete signal processing chain — PTAGIS PIT Tag System:

  === INTERROGATION (antenna -> tag) ===

  SIGNAL SOURCE
    Oscillator circuit at detection site (134.2 kHz)
    |
  TRANSMISSION
    AC current through interrogation antenna coil
    Creates oscillating magnetic field: B(t) = B_0 * sin(omega*t)
    Near-field propagation (inductive coupling)
    Field decays as 1/r^3
    |
  RECEPTION BY TAG
    Tag coil intercepts magnetic flux
    Faraday induction: V = -N * dPhi/dt
    |
  RESONANT AMPLIFICATION
    LC circuit in tag amplifies by factor Q
    V_chip = Q * V_induced
    |
  RECTIFICATION AND POWER-UP
    On-chip diode rectifies AC to DC
    Charges storage capacitor to ~2-3 V
    Chip logic activates

  === RESPONSE (tag -> antenna) ===

  DATA ENCODING
    Chip retrieves 128-bit ID from memory
    Encodes as FSK modulation sequence
    |
  BACKSCATTER MODULATION
    Chip switches load impedance according to data bits
    This modulates the tag coil's absorption of field energy
    |
  DETECTION AT ANTENNA
    Interrogation antenna "feels" the load modulation
    Small change in antenna current/voltage (~0.01-0.1%)
    |
  SIGNAL CONDITIONING
    Bandpass filtering around modulation frequency
    Amplification of modulated signal
    Synchronous demodulation (correlation with interrogation signal)
    |
  DATA EXTRACTION
    FSK demodulation -> bit sequence
    Error checking (CRC validation)
    Tag ID extracted
    |
  TELEMETRY
    Tag ID + timestamp + antenna ID
    -> Local data logger
    -> Network transmission to PTAGIS central database
    -> Public data access (ptagis.org)
```

---

## Interrelationships

| Related Page | Connection |
|-------------|------------|
| [Magnetic Fields and Magnetoreception](10-magnetic-fields-magnetoreception.md) | PTAGIS tracks the same salmon that use magnetic navigation; engineering electromagnetic system monitoring organisms with biological electromagnetic sensing |
| [Fox Magnetic Rangefinder](11-fox-magnetic-rangefinder.md) | Both use electromagnetic physics for sensing; fox uses Earth's static field, PTAGIS uses engineered oscillating field |
| [Cryptochrome Quantum Compass](12-cryptochrome-quantum-compass.md) | PIT tag RF could theoretically interact with radical-pair mechanism; 134 kHz is well below the ~1 MHz radical-pair resonance frequency — no expected interference |
| [Electroreception and Ampullae of Lorenzini](13-electroreception-lorenzini.md) | Sharks detect bioelectric fields of the same salmon that carry PIT tags; engineering (RFID) and biological (ampullae) electromagnetic detection in the same ecosystem |

---

## PNW Cross-Reference

### Columbia Basin Salmon Populations Tracked by PTAGIS

```
ESA-listed PNW salmon populations tracked by PIT tags:

  Species/ESU               ESA Status    PTAGIS Data    Key Habitat
  ----------------------------------------------------------------
  Snake R. spring/summer     Threatened   1987-present   Snake R. tribs
  Chinook

  Snake R. fall Chinook      Threatened   1990-present   Snake R. mainstem

  Upper Columbia spring      Endangered   1989-present   Methow, Entiat,
  Chinook                                                Wenatchee rivers

  Lower Columbia Chinook     Threatened   1990s-present  Cowlitz, Lewis,
                                                         Kalama rivers

  Snake R. sockeye           Endangered   1991-present   Redfish Lake, ID
  (most endangered salmon)

  Snake R. steelhead         Threatened   1987-present   Snake R. tribs

  Upper Columbia steelhead   Threatened   1990-present   Methow, Entiat,
                                                         Wenatchee rivers

  Mid-Columbia steelhead     Threatened   1990s-present  John Day, Yakima

  Snake R. coho              Not listed   Reintroduced   Clearwater R.
  (reintroduction program)                2000s-present

  Columbia R. bull trout     Threatened   1990s-present  Cold headwater streams
```

### The 14 Dams and Salmon Migration

```
A juvenile Chinook salmon's PIT tag journey (Snake River example):

  SPRING (April-June): Juvenile rears in tributary stream
    -> PIT tag implanted at rotary screw trap

  DAM PASSAGE SEQUENCE (downstream, 1-3 weeks):
    1. Lower Granite Dam    -> PIT detected (juvenile bypass)
    2. Little Goose Dam     -> PIT detected
    3. Lower Monumental Dam -> PIT detected
    4. Ice Harbor Dam       -> PIT detected
    5. McNary Dam           -> PIT detected
    6. John Day Dam         -> PIT detected
    7. The Dalles Dam       -> PIT detected
    8. Bonneville Dam       -> PIT detected (last freshwater detection)

  OCEAN (1-5 years): No PIT detection possible
    -> Fish navigates using magnetic map (see 10-magnetic-fields-magnetoreception.md)
    -> Olfactory homing for return approach

  RETURN (July-September):
    8. Bonneville Dam       -> PIT detected (adult ladder)
    7. The Dalles Dam       -> PIT detected
    6. John Day Dam         -> PIT detected
    5. McNary Dam           -> PIT detected
    4. Ice Harbor Dam       -> PIT detected
    3. Lower Monumental Dam -> PIT detected
    2. Little Goose Dam     -> PIT detected
    1. Lower Granite Dam    -> PIT detected (adult return confirmed)

    -> Fish enters natal tributary
    -> Spawns
    -> Dies

  The PIT tag data tells us:
    - Juvenile travel time (days): Spring through hydrosystem
    - Juvenile survival per dam: ~94-98% per dam with improvements
    - Ocean return rate: ~0.5-5% (varies by year and stock)
    - Adult travel time: typically 2-4 days per dam
    - Straying rate: fraction returning to non-natal stream

  This is the most complete individual-level migration dataset
  for any anadromous fish species in the world.
```

### Integration with Biological Sensing

The PTAGIS system operates in the same electromagnetic environment that PNW salmon, sharks, and other organisms use for biological sensing:

```
Electromagnetic environment of the Columbia Basin:

  Natural fields:
    Earth's magnetic field:  ~55 uT (used by salmon for navigation)
    Bioelectric fields:      ~1-500 uV/m (used by sharks for prey detection)
    Atmospheric sferics:     ~0.01-0.1 uV/m at 134 kHz (natural RF noise)

  Engineered fields:
    PIT interrogation:       ~1-100 uT near antenna (decays as 1/r^3)
    Dam generators:          ~0.1-10 uT (60 Hz) near powerhouse
    Transmission lines:      ~0.1-1 uT (60 Hz) under conductors
    Navigation beacons:      ~0.001 uT (various frequencies)

  The PIT tag interrogation field (134.2 kHz) is:
    - Above the ampullary passband (0.5-8 Hz) -> invisible to sharks
    - Above the cryptochrome resonance (~1 MHz) -> no radical-pair effect
    - Below the salmon magnetite response band (DC) -> no magnetite interaction

  The dam generator fields (60 Hz) are:
    - Within 1 order of magnitude of ampullary passband -> possible shark detection
    - Well below cryptochrome resonance -> no radical-pair effect
    - Quasi-DC for magnetite -> possible salmon navigation interference

  CONSERVATION QUESTION: Do the 60 Hz electromagnetic fields from
  dam generators interfere with salmon magnetic navigation during
  the critical dam-passage period? This is an active research question.
```

### Data Availability

```
PTAGIS data access for PNW research:

  Website:          ptagis.org
  Data format:      CSV, API access
  Cost:             Free (publicly funded)
  Query tools:      Online query interface, bulk data downloads
  Documentation:    Comprehensive metadata and user guides
  Update frequency: Near real-time (detections uploaded within hours)
  Citation:         PTAGIS, Pacific States Marine Fisheries Commission
                    https://www.ptagis.org

  Key datasets:
  1. Individual detection histories (tag ID -> all detection events)
  2. Site-specific detection summaries (detections per day/week/year)
  3. Release group summaries (tagged groups and their outcomes)
  4. Antenna configuration records (what hardware at each site)
  5. Environmental data (water temperature, flow at detection sites)
```

---

## Primary Sources

| ID | Citation | Relevance |
|----|----------|-----------|
| G4 | PTAGIS — Pacific States Marine Fisheries Commission | Primary source: PIT tag data, system documentation, detection records |
| G1 | NOAA Northwest Fisheries Science Center | Salmon population data, ESA status, dam passage research |
| G2 | USGS National Geomagnetism Program | Earth's magnetic field in PNW (context for electromagnetic environment) |
| P1 | Putman, N.F. et al. (2020). J. Comparative Physiology A. | Cross-reference: salmon magnetic navigation that PTAGIS monitors |
| P12 | Klimley, A.P. Hammerhead shark magnetic highways. | Cross-reference: electroreception in context with RFID-like sensing |
| P6 | Knauer, A. et al. (2025). Bats create a silent frequency band via DSC. bioRxiv. | Cross-reference: biological resonance (auditory fovea) |
