# Mission 1.21 -- Mercury-Atlas 6: The Mathematics of Three Orbits

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mercury-Atlas 6 / Friendship 7 (February 20, 1962) -- John Glenn, First American to Orbit Earth
**Primary TSPB Layer:** 4 (Vector Calculus -- Orbital Mechanics, Vis-Viva Equation, Keplerian Motion, Retrofire Targeting)
**Secondary Layers:** 3 (Trigonometry -- Reentry Corridor Geometry, Heat Shield Ablation), 7 (Probability -- Segment 51 Telemetry Ambiguity, Decision-Making Under Incomplete Data), 1 (Unit Circle -- True Anomaly, Orbital Elements)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Orbital Parameters and the Vis-Viva Equation (Layer 4, Section 4.21)

### Table

| Parameter | Symbol | Units | MA-6 Value |
|-----------|--------|-------|------------|
| Launch date | -- | -- | February 20, 1962, 14:47:39 UTC (09:47 EST) |
| Launch vehicle | -- | -- | Atlas D (No. 109-D) |
| Operating agency | -- | -- | NASA / Space Task Group, Langley |
| Spacecraft | -- | -- | Mercury capsule #13 (Friendship 7) |
| Pilot | -- | -- | John Herschel Glenn Jr. (Lt. Col., USMC) |
| Engine (sustainer) | -- | -- | Rocketdyne MA-3 sustainer + 2 boosters |
| Sustainer thrust | F_sus | kN | ~253 (56,000 lbf) |
| Booster thrust (each) | F_boost | kN | ~668 (150,000 lbf each) |
| Total liftoff thrust | F_total | kN | ~1,589 (357,000 lbf) |
| Specific impulse (sea level) | I_sp_sl | s | ~282 |
| Specific impulse (vacuum) | I_sp_vac | s | ~309 |
| Vehicle mass at ignition | m_0 | kg | ~117,000 (258,000 lb) |
| Capsule mass (orbital) | m_cap | kg | ~1,355 (2,987 lb) |
| Planned orbits | -- | -- | 3 |
| Actual orbits | -- | -- | 3 |
| Perigee altitude | h_p | km | 161 (100 statute miles) |
| Apogee altitude | h_a | km | 265 (165 statute miles) |
| Semi-major axis | a | km | 6,584 |
| Eccentricity | e | -- | 0.0079 |
| Orbital inclination | i | deg | 32.5 |
| Orbital period | T | min | 88.5 |
| Orbital velocity (perigee) | v_p | km/s | 7.84 |
| Orbital velocity (apogee) | v_a | km/s | 7.71 |
| Total delta-v to orbit | delta_v | km/s | ~9.3 (including gravity and drag losses) |
| Reentry peak g-load | g_max | g | ~7.7 |
| Maximum velocity | v_max | km/s | ~7.84 (at perigee) |
| Flight duration | t_flight | hr:min:s | 4:55:23 |
| Splashdown coordinates | -- | -- | 21.35 N, 68.70 W (Atlantic, near Grand Turk) |
| Recovery ship | -- | -- | USS Noa (DD-841) |
| Recovery time | -- | min | ~17 (destroyer pickup) |
| Segment 51 signal | -- | -- | Telemetry indicated possible heat shield/landing bag separation |
| Result | -- | -- | SUCCESS -- first American to orbit Earth |
| Significance | -- | -- | National triumph. Three orbits. Human observation validated. Proved Mercury-Atlas system for manned orbital flight. |

### Formulas

**The Vis-Viva Equation: Velocity at Every Point in Orbit**

Mercury-Atlas 6 was the flight that Enos qualified. MA-5 (mission 1.18) proved that a primate could orbit and return alive. MA-6 proved that a human could orbit, observe, report, and control. Glenn's orbit was the culmination of every Mercury mission that preceded it: the suborbital arcs of Shepard and Grissom, the orbital rehearsal of Enos, the unmanned Atlas tests that established the booster's reliability -- each one feeding forward into this moment. February 20, 1962, after ten delays and a nation holding its breath, Atlas 109-D lit its three engines and climbed.

The orbit Glenn achieved -- 161 km x 265 km -- was slightly more elliptical than Enos's 161 km x 237 km. The perigee was identical (161 km, the lowest stable altitude above measurable atmospheric drag), but the apogee was 28 km higher. This difference came from the Atlas injection: a marginally higher velocity at engine cutoff placed Glenn on a wider ellipse. The difference was within tolerance. What mattered was that the orbit was stable for three revolutions and the perigee was high enough to avoid reentry from atmospheric drag over the mission duration.

The vis-viva equation governs the velocity at every point in an elliptical orbit. It is the fundamental equation of orbital mechanics -- the energy balance between kinetic energy (velocity) and potential energy (altitude) for an object in gravitational orbit:

```
VIS-VIVA EQUATION:

  v^2 = GM * (2/r - 1/a)

  where:
    v   = orbital velocity at distance r from Earth's center (m/s)
    G   = gravitational constant (6.674 x 10^-11 m^3 kg^-1 s^-2)
    M   = mass of Earth (5.972 x 10^24 kg)
    GM  = standard gravitational parameter = 3.986 x 10^14 m^3/s^2
    r   = distance from Earth's center at the point of interest (m)
    a   = semi-major axis of the orbit (m)

  The semi-major axis is the average of the perigee and
  apogee distances from Earth's center:

    r_perigee = R_earth + h_p = 6,371 + 161 = 6,532 km
    r_apogee  = R_earth + h_a = 6,371 + 265 = 6,636 km

    a = (r_perigee + r_apogee) / 2
      = (6,532 + 6,636) / 2
      = 6,584 km = 6,584,000 m
```

**Worked Example 1: Glenn's Velocity at Perigee**

At perigee, r = r_perigee = 6,532,000 m. The vis-viva equation gives:

```
VELOCITY AT PERIGEE:

  v_p^2 = GM * (2/r_p - 1/a)
        = 3.986 x 10^14 * (2/6,532,000 - 1/6,584,000)

  Compute each term:
    2/r_p = 2 / 6,532,000 = 3.0627 x 10^-7  m^-1
    1/a   = 1 / 6,584,000 = 1.5189 x 10^-7  m^-1

    (2/r_p - 1/a) = 3.0627 x 10^-7 - 1.5189 x 10^-7
                   = 1.5438 x 10^-7  m^-1

  v_p^2 = 3.986 x 10^14 * 1.5438 x 10^-7
        = 6.1516 x 10^7  m^2/s^2

  v_p = sqrt(6.1516 x 10^7)
      = 7,843 m/s
      = 7.84 km/s
      = 28,235 km/h

  This is Glenn's velocity at perigee: the fastest
  point in his orbit, the lowest point, where the
  capsule screams across the upper atmosphere at
  7.84 km/s -- twenty-three times the speed of sound
  at sea level.
```

**Worked Example 2: Glenn's Velocity at Apogee**

At apogee, r = r_apogee = 6,636,000 m:

```
VELOCITY AT APOGEE:

  v_a^2 = GM * (2/r_a - 1/a)
        = 3.986 x 10^14 * (2/6,636,000 - 1/6,584,000)

  Compute each term:
    2/r_a = 2 / 6,636,000 = 3.0140 x 10^-7  m^-1
    1/a   = 1 / 6,584,000 = 1.5189 x 10^-7  m^-1

    (2/r_a - 1/a) = 3.0140 x 10^-7 - 1.5189 x 10^-7
                   = 1.4951 x 10^-7  m^-1

  v_a^2 = 3.986 x 10^14 * 1.4951 x 10^-7
        = 5.9575 x 10^7  m^2/s^2

  v_a = sqrt(5.9575 x 10^7)
      = 7,719 m/s
      = 7.72 km/s
      = 27,788 km/h

  The velocity difference between perigee and apogee:
    delta_v_orbit = v_p - v_a
                  = 7,843 - 7,719
                  = 124 m/s
                  = 0.124 km/s

  Glenn was 124 m/s faster at perigee than at apogee.
  This velocity variation comes from the exchange of
  kinetic and potential energy as the capsule moves
  around its elliptical path. At perigee (closest to
  Earth, deeper in the gravity well), potential energy
  is lower and kinetic energy is higher. At apogee
  (farthest from Earth), the capsule has traded
  velocity for altitude.
```

### Debate Questions (Layer 4, Orbital Mechanics)

1. **Glenn's orbit was 161 km x 265 km -- an eccentricity of 0.0079.** A perfectly circular orbit at 213 km (the average altitude) would have had the same period but constant altitude and constant velocity. Why didn't NASA target a circular orbit? The answer involves Atlas injection accuracy: the guidance system could not reliably null out all velocity errors at insertion. The margin between "slightly too fast" (apogee too high) and "slightly too slow" (reentry on orbit 1) was about 40 m/s. What is the circular velocity at 213 km, and how much injection velocity error would it take to produce Glenn's eccentricity?

2. **The vis-viva equation treats the orbit as a two-body problem -- Earth and capsule, nothing else.** In reality, Glenn's orbit was perturbed by the Moon's gravity, the Sun's gravity, the oblateness of the Earth (J2 perturbation), solar radiation pressure, and atmospheric drag. For a 3-orbit, 5-hour mission, which of these perturbations actually mattered? J2 causes orbital plane precession of approximately 7 degrees per day for Glenn's inclination. Over 5 hours, that is about 1.5 degrees -- detectable by ground tracking but irrelevant to mission safety. At what mission duration do perturbations begin to matter more than the two-body solution?

3. **The eccentricity of Glenn's orbit (0.0079) is small but not zero.** Enos's orbit (MA-5, mission 1.18) had a perigee of 161 km and apogee of 237 km -- eccentricity approximately 0.0058. Glenn's apogee was higher (265 km), giving a larger eccentricity. Both orbits had the same perigee. This means Glenn's Atlas achieved a slightly higher injection velocity than Enos's. Was this intentional (targeting a higher apogee for better orbital lifetime) or incidental (the Atlas happened to perform slightly better)? What would the perigee altitude have needed to be for a circular orbit at Glenn's injection velocity?

---

## Deposit 2: Kepler's Third Law and the Orbital Period (Layer 4, Section 4.21b)

### Formulas

**Worked Example 3: Deriving Glenn's Orbital Period**

Glenn orbited the Earth three times in 4 hours 55 minutes 23 seconds. Each orbit took approximately 88.5 minutes. This period is not arbitrary -- it is determined exactly by the semi-major axis of the orbit through Kepler's Third Law.

```
KEPLER'S THIRD LAW:

  T^2 = (4 * pi^2 / GM) * a^3

  Solving for T:
    T = 2 * pi * sqrt(a^3 / GM)

  With Glenn's semi-major axis:
    a = 6,584 km = 6,584,000 m

  T = 2 * pi * sqrt((6,584,000)^3 / (3.986 x 10^14))

  Compute a^3:
    a^3 = (6,584,000)^3
        = (6.584 x 10^6)^3
        = 6.584^3 x 10^18
        = 285.38 x 10^18
        = 2.8538 x 10^20  m^3

  Compute a^3 / GM:
    a^3 / GM = 2.8538 x 10^20 / 3.986 x 10^14
             = 7.1604 x 10^5  s^2

  Compute sqrt:
    sqrt(7.1604 x 10^5) = 846.2  s

  Compute T:
    T = 2 * pi * 846.2
      = 5,316 s
      = 88.6 minutes

  Glenn's measured orbital period was approximately
  88.5 minutes. The calculation yields 88.6 minutes --
  a discrepancy of 0.1 minutes (6 seconds), well within
  the measurement uncertainty of the tracking network.

  WHAT THIS MEANS:

  Glenn saw three sunrises and three sunsets in under
  5 hours. Each orbit carried him from Cape Canaveral
  (28.5 N latitude) across the Atlantic, over West
  Africa, across the Indian Ocean, over the Pacific,
  and back across the continental United States. At
  perigee velocity (7.84 km/s), he crossed the width
  of the contiguous United States (approximately
  4,500 km) in about 9.5 minutes. He crossed the
  Atlantic (approximately 5,500 km on his ground
  track) in about 11.7 minutes. The world was
  compressible at orbital velocity: distances that
  took Lindbergh 33 hours to cross took Glenn
  12 minutes.
```

**Eccentricity and Its Physical Meaning**

The eccentricity of Glenn's orbit describes its departure from circularity:

```
ECCENTRICITY:

  e = (r_apogee - r_perigee) / (r_apogee + r_perigee)
    = (6,636 - 6,532) / (6,636 + 6,532)
    = 104 / 13,168
    = 0.00790

  Alternatively, from the altitude difference:
    e = (h_a - h_p) / (2 * R_earth + h_a + h_p)
      = (265 - 161) / (2 * 6,371 + 265 + 161)
      = 104 / 13,168
      = 0.00790

  For comparison:
    e = 0      -> perfect circle
    e = 0.0079 -> Glenn's orbit (nearly circular)
    e = 0.0167 -> Earth's orbit around the Sun
    e = 0.0549 -> Moon's orbit around Earth
    e = 0.2056 -> Mercury's orbit around the Sun
    e = 1.0    -> parabolic escape trajectory

  Glenn's orbit was more circular than the Earth's
  orbit around the Sun. The difference between perigee
  and apogee altitude (104 km) spread over a
  circumference of approximately 41,375 km means the
  orbit deviated from a perfect circle by less than
  0.8% of its radius. From Glenn's perspective, he
  could not see the difference. The altitude varied
  from 161 km to 265 km -- a spread of 104 km, or
  roughly 1.6% of the orbital radius. This is the
  width of a pencil line drawn on a circle two meters
  in diameter.
```

---

## Deposit 3: Atlas Trajectory and the Rocket Equation (Layer 4, Section 4.21c)

### Formulas

**Getting Glenn to Orbit: The Tsiolkovsky Rocket Equation**

The Atlas D that launched Glenn was a stage-and-a-half vehicle -- three engines at liftoff, two booster engines jettisoned at approximately 130 seconds (BECO, Booster Engine Cutoff), one sustainer engine continuing to orbital insertion at approximately 300 seconds (SECO, Sustainer Engine Cutoff). This staging architecture is critical to understanding why the Atlas could reach orbit while the Redstone could not.

The Tsiolkovsky rocket equation describes the relationship between propellant mass, exhaust velocity, and the velocity change a rocket can achieve:

```
TSIOLKOVSKY ROCKET EQUATION:

  delta_v = I_sp * g_0 * ln(m_0 / m_f)

  where:
    delta_v = velocity change (m/s)
    I_sp    = specific impulse (seconds)
    g_0     = standard gravity (9.80665 m/s^2)
    m_0     = initial mass (fueled)
    m_f     = final mass (empty structure + payload)
    ln      = natural logarithm

  The product I_sp * g_0 gives the effective exhaust
  velocity v_e in m/s:
    v_e = I_sp * g_0

  ATLAS D ENGINE PERFORMANCE:

  BOOSTER ENGINES (2x Rocketdyne LR-89):
    Thrust (each):     ~668 kN (150,000 lbf)
    I_sp (sea level):  ~248 s
    I_sp (vacuum):     ~282 s
    Burn time:         ~130 s (to BECO)

  SUSTAINER ENGINE (1x Rocketdyne LR-105):
    Thrust:            ~253 kN (56,000 lbf)
    I_sp (vacuum):     ~309 s
    Burn time:         ~300 s (to SECO)

  VERNIER ENGINES (2x):
    Thrust (each):     ~4.5 kN (1,000 lbf)
    Used for roll control and fine guidance

  THE DELTA-V BUDGET:

  To reach a 161 km x 265 km orbit from Cape Canaveral,
  the total delta-v required is approximately 9.3 km/s,
  broken down as:

    Orbital velocity at insertion:  ~7.84 km/s
    Gravity losses:                 ~1.0  km/s
    Atmospheric drag losses:        ~0.1  km/s
    Steering losses:                ~0.35 km/s
    ----------------------------------------
    Total delta-v requirement:      ~9.3  km/s

  The Atlas achieved this by staging: the booster
  engines provided the bulk of the thrust during the
  first 130 seconds when the vehicle was heaviest and
  fighting through the densest atmosphere, then were
  jettisoned -- dropping approximately 3,000 kg of
  dead engine mass -- while the sustainer continued
  burning the remaining propellant at higher I_sp
  (no atmosphere, so v_e is higher in vacuum).

  WHY STAGING MATTERS:

  Without staging, the Atlas would carry the booster
  engine mass all the way to orbit. That dead mass
  reduces the mass ratio m_0/m_f and therefore reduces
  delta_v. Consider the difference:

  STAGED (actual Atlas):
    Booster phase: m_0 = 117,000 kg, jettisoned mass = ~3,000 kg
    Sustainer phase: effectively starts with m_0 ~ 50,000 kg
    (after booster propellant consumed and engines dropped)

  UNSTAGED (hypothetical):
    Same total propellant but carrying 3,000 kg of dead
    booster engines to orbit
    m_f increases by 3,000 kg
    ln(m_0/m_f) decreases

  For a rough estimate of the staging benefit:
    Effective exhaust velocity (average): ~2,900 m/s
    If m_f decreases by 3,000 kg (from ~12,000 to ~9,000):
      ln(117,000/12,000) = ln(9.75) = 2.277
      ln(117,000/9,000)  = ln(13.0) = 2.565
      delta_v gain = 2,900 * (2.565 - 2.277)
                   = 2,900 * 0.288
                   = 835 m/s

  Staging bought approximately 835 m/s of additional
  delta-v -- nearly 9% of the total budget. Without
  staging, the Atlas would have fallen short of orbital
  velocity. Glenn would have achieved a very high
  suborbital arc -- perhaps reaching 800 km altitude
  before falling back -- but would not have orbited.
  Staging is not an optimization; it is a requirement.
```

---

## Deposit 4: Heat Shield Thermal Analysis (Layer 3, Section 3.21)

### Formulas

**Reentry Heating: The Physics of Coming Home**

Friendship 7's reentry was the most dramatic of any Mercury mission -- not because of the physics, which were nominal, but because of a telemetry signal that suggested the heat shield might be loose. The "Segment 51" signal, a switch reading in the telemetry stream, indicated that the landing bag deploy switch had been triggered, which could mean the heat shield had separated from the capsule while still in orbit. If the heat shield were loose, reentry would be fatal: the shield would detach during deceleration, exposing the capsule's pressure vessel to the full reentry temperature.

The decision was made to have Glenn retain his retropackage (the three solid-fuel retrorockets strapped across the heat shield) during reentry, rather than jettisoning it after the retrofire burn as planned. The theory was that the retro straps would hold the heat shield in place even if the landing bag had deployed. The retro pack would burn off during reentry, but by then the deceleration forces would be pressing the heat shield against the capsule, holding it in place aerodynamically.

Glenn reentered with the retro pack on. Burning chunks of debris streamed past his window -- the straps and retro rocket housings incinerating in the reentry plasma. He did not know whether the chunks were from the retro pack or from his heat shield. Mission Control did not tell him about the Segment 51 concern until after the mission. The heat shield was fine. The Segment 51 signal was a sensor error -- the switch had malfunctioned, not the heat shield.

But the thermal analysis of what Glenn's heat shield actually experienced is real:

```
STAGNATION POINT TEMPERATURE:

  When a vehicle reenters the atmosphere at hypersonic
  speed, the air ahead of it cannot move out of the
  way fast enough. The air is compressed and heated
  to extreme temperatures. The hottest point is the
  stagnation point -- the point on the heat shield
  directly facing the flow, where the air velocity
  relative to the surface is zero and all the kinetic
  energy of the flow has been converted to thermal
  energy.

  The stagnation temperature for a perfect gas:

    T_stag = T_inf * (1 + (gamma - 1)/2 * M^2)

  where:
    T_stag  = stagnation temperature (K)
    T_inf   = freestream temperature (K)
    gamma   = ratio of specific heats (1.4 for air at
              moderate temperatures, decreasing toward
              1.2 at very high temperatures due to
              molecular dissociation)
    M       = Mach number (v / v_sound)

  GLENN'S REENTRY CONDITIONS:

  At the entry interface (120 km altitude):
    v_entry  = ~7,800 m/s (orbital velocity minus retrofire delta-v)
    T_inf    = ~240 K (-33 C) -- ambient temperature at 120 km
    v_sound  = ~300 m/s (approximate, varies with altitude)
    M        = 7,800 / 300 = 26

  At peak heating (approximately 60-70 km altitude):
    v        = ~7,200 m/s (slightly decelerated)
    T_inf    = ~250 K
    v_sound  = ~310 m/s
    M        = 7,200 / 310 = 23.2
```

**Worked Example 4: Stagnation Temperature at Mach 23**

```
STAGNATION TEMPERATURE CALCULATION:

  Using gamma = 1.4 (ideal diatomic gas assumption):

  T_stag = T_inf * (1 + (gamma - 1)/2 * M^2)
         = 250 * (1 + (1.4 - 1)/2 * 23.2^2)
         = 250 * (1 + 0.2 * 538.24)
         = 250 * (1 + 107.65)
         = 250 * 108.65
         = 27,162 K

  THIS NUMBER IS MISLEADINGLY HIGH. The perfect gas
  assumption breaks down catastrophically at these
  temperatures. At temperatures above approximately
  2,000 K, molecular nitrogen and oxygen begin to
  dissociate (break apart into atoms). At temperatures
  above 4,000 K, the atoms begin to ionize. These
  processes absorb enormous energy, limiting the
  actual gas temperature.

  REAL GAS CORRECTION:

  The actual stagnation temperature accounting for
  dissociation and ionization is approximately:

    T_stag_real ≈ 5,000 - 8,000 K

  depending on the altitude (density determines the
  rate of dissociation). At the peak heating altitude
  of approximately 60 km:

    T_stag_real ≈ 6,000 - 7,000 K (~6,000 - 7,000 C)

  However, the heat shield surface temperature is NOT
  the stagnation temperature. The boundary layer --
  the thin layer of air immediately adjacent to the
  heat shield surface -- provides thermal resistance.
  Radiation from the hot gas also carries energy away.
  The actual heat shield surface temperature for
  Mercury at peak heating was approximately:

    T_surface ≈ 1,650 C (1,923 K) at the stagnation point
    T_surface ≈ 1,100 C (1,373 K) at the shield periphery

  This is why the perfect gas stagnation formula is
  educational but not operational: real reentry
  analysis requires computational fluid dynamics with
  real gas effects, surface catalysis models, ablation
  chemistry, and radiative heat transfer.
```

**Mercury Heat Shield: Ablative Protection**

```
ABLATIVE HEAT SHIELD MECHANISM:

  The Friendship 7 heat shield was a blunt-body
  ablative design: a dish-shaped fiberglass structure
  filled with a phenolic resin compound. The shield
  worked by controlled destruction:

  1. CHARRING: The resin absorbs heat and pyrolyzes
     (decomposes) at approximately 300-500 C, forming
     a char layer on the surface.

  2. OUTGASSING: The decomposition produces gases
     (H2O, CO2, light hydrocarbons) that flow outward
     through the char layer, carrying thermal energy
     with them.

  3. BOUNDARY LAYER BLOWING: The outgassing products
     inject mass into the boundary layer, thickening
     it and reducing convective heat transfer to the
     surface -- a phenomenon called "blowing reduction."

  4. RADIATION: The char surface radiates energy back
     into the flow. At 1,650 C, radiation is significant:

       q_rad = epsilon * sigma * T^4
             = 0.9 * 5.67 x 10^-8 * (1923)^4
             = 0.9 * 5.67 x 10^-8 * 1.368 x 10^13
             = 698 kW/m^2

     The shield radiates approximately 700 kW/m^2
     at peak temperature -- a substantial fraction
     of the incoming heat flux.

  5. ABLATION: The char layer itself is eroded by the
     flow, carrying thermal energy away with the
     departing material. The total mass loss of the
     Mercury heat shield during reentry was approximately
     2-3 kg -- a small fraction of the shield's total
     mass of approximately 60 kg.

  ENERGY BUDGET:

  The total kinetic energy that must be dissipated
  during Glenn's reentry:

    KE = (1/2) * m * v^2
       = (1/2) * 1,355 * (7,800)^2
       = (1/2) * 1,355 * 6.084 x 10^7
       = 4.122 x 10^10 J
       = 41.2 GJ

  41.2 gigajoules is the energy of approximately
  10 tonnes of TNT. This energy must go somewhere:
  into heating the air (the majority), into the heat
  shield (charring, ablation, conduction), and into
  radiation. The heat shield's job is not to absorb
  all this energy -- that would be impossible. Its job
  is to ensure that only a survivable fraction reaches
  the spacecraft structure and its occupant. The blunt
  body shape deflects most of the heated air away from
  the vehicle, creating a strong bow shock that pushes
  the hottest gas outboard. The ablative shield handles
  the remainder.

  Glenn experienced approximately 7.7g during peak
  deceleration -- pressing him into his contour couch
  with a force of 7.7 times his body weight. The
  deceleration lasted approximately 2 minutes. During
  this time, burning fragments of the retro pack
  streamed past his window, and he reported: "That's
  a real fireball outside." He did not know if his
  heat shield was intact.

  It was.
```

### Debate Questions (Layer 3, Thermal Analysis)

1. **The perfect gas stagnation temperature formula gives ~27,000 K for Glenn's reentry, while the actual gas temperature was ~6,000-7,000 K.** The discrepancy is a factor of 4, caused by molecular dissociation and ionization absorbing energy that would otherwise go into gas temperature. This "real gas effect" is not a correction -- it is the dominant physics. At what Mach number does the perfect gas model become useless for temperature prediction? For Mercury's subsonic wind tunnel tests (M < 0.3), the perfect gas model is excellent. For its supersonic wind tunnel tests (M ~ 2-5), it introduces errors of a few percent. Somewhere between Mach 5 and Mach 25, the model transitions from "useful approximation" to "wrong by a factor of 4." Where is the transition, and what determines it?

2. **The heat shield surface reached approximately 1,650 C at the stagnation point.** Structural steel melts at approximately 1,370-1,530 C. The heat shield surface was hotter than the melting point of steel. Yet the heat shield survived because it was designed to ablate, not to remain intact. Is there a conceptual analogy between ablative thermal protection and biological wound healing? The skin burns, chars, and sloughs off, but the organism underneath survives. Ablation is controlled sacrifice: destroying the surface to save the structure. Where else in engineering or biology does this principle appear?

---

## Deposit 5: Retrofire and Orbital Decay (Layer 4, Section 4.21d)

### Formulas

**Worked Example 5: The Retrofire Delta-V**

To return from orbit, Glenn fired three solid-fuel retrorockets, one at a time, spaced 5 seconds apart. Each retrorocket produced approximately 4.5 kN of thrust for approximately 10 seconds. The retrofire burn reduced Glenn's orbital velocity enough to lower the perigee below the effective atmosphere (below approximately 80 km), ensuring reentry.

```
RETROFIRE ANALYSIS:

  Mercury retropackage: 3 x Thiokol TE-316 solid rockets
  Thrust per motor:     ~4.5 kN (1,000 lbf)
  Burn time per motor:  ~10 s
  Firing sequence:      sequential, 5 s apart
  Total retrofire time: ~20 s (first ignition to last burnout)

  Impulse per motor:
    J = F * t = 4,500 * 10 = 45,000 N*s

  Total impulse:
    J_total = 3 * 45,000 = 135,000 N*s

  Delta-v from retrofire:
    delta_v_retro = J_total / m_capsule
                  = 135,000 / 1,355
                  = 99.6 m/s
                  ≈ 100 m/s

  Glenn's orbital velocity before retrofire: ~7,800 m/s
  Glenn's velocity after retrofire: ~7,700 m/s

  This 100 m/s reduction is only 1.3% of the orbital
  velocity. But it is enough: the reduced velocity
  lowers the perigee of the new orbit below the
  atmosphere. On the next pass through perigee, instead
  of skimming through the thin upper atmosphere at
  161 km, the capsule descends into the denser
  atmosphere below 80 km, where drag decelerates it
  from 7,700 m/s to zero over approximately 5 minutes.

  WHERE TO FIRE THE RETROS:

  Retrofire must occur at the correct point in the orbit.
  Fire too early, and the capsule lands short of the
  recovery fleet. Fire too late, and it lands long.
  At orbital velocity, a 1-minute error in retrofire
  timing translates to approximately:

    Position error = v * t_error
                   = 7,800 * 60
                   = 468,000 m
                   = 468 km

  The recovery fleet could cover a footprint of
  approximately 200 km x 50 km. A timing error of
  more than about 25 seconds would place the capsule
  outside the primary recovery zone. Glenn's retrofire
  was initiated automatically by the capsule's
  sequencer, with the pilot confirming the timing
  against his ground-elapsed-time clock. The retros
  fired on schedule at 4 hours, 33 minutes, and 9
  seconds into the mission, over the Pacific Ocean
  near California, targeting a splashdown in the
  Atlantic near Grand Turk Island.

  The capsule traveled halfway around the world after
  retrofire, decelerating the entire way. The reentry
  trajectory was a depressed ellipse: after retrofire
  over the Pacific, the capsule descended through the
  atmosphere over the continental United States and
  splashed down in the Atlantic approximately 22 minutes
  after retrofire initiation. During those 22 minutes,
  Glenn crossed 13,000 km of ground track -- and
  decelerated from 7,700 m/s to approximately 9 m/s
  (his parachute descent rate).
```

**Atmospheric Drag and Orbital Decay**

Glenn's orbit at 161 km perigee was subject to atmospheric drag at the lowest point of each orbit. Even without retrofire, the orbit would have eventually decayed as drag removed energy at each perigee pass. For a 3-orbit mission, this effect was negligible, but the physics is worth understanding:

```
ATMOSPHERIC DRAG:

  F_drag = (1/2) * rho * v^2 * C_D * A

  where:
    rho   = atmospheric density at altitude (kg/m^3)
    v     = orbital velocity (m/s)
    C_D   = drag coefficient (~1.0-1.5 for Mercury capsule
            in free molecular flow at orbital altitude)
    A     = cross-sectional area (~2.8 m^2 for Mercury
            capsule, diameter ~1.89 m)

  At 161 km altitude:
    rho ≈ 1 x 10^-10 kg/m^3
    (extremely thin -- sea level density is 1.225 kg/m^3,
     so this is ~10^10 times less dense)

    v   = 7,843 m/s
    C_D = 1.2 (approximate for blunt body in free molecular flow)
    A   = 2.8 m^2

  F_drag = (1/2) * 1 x 10^-10 * (7,843)^2 * 1.2 * 2.8
         = (1/2) * 1 x 10^-10 * 6.15 x 10^7 * 3.36
         = 1.03 x 10^-2 N
         = 0.0103 N

  This is approximately 10 millinewtons -- about the
  weight of a paper clip. But it acts continuously at
  each perigee pass. Over one orbit, the capsule spends
  approximately 3-5 minutes near perigee (within the
  altitude band where drag is non-negligible). The
  velocity change per orbit from drag:

    delta_v_drag = (F_drag / m) * t_drag
                 ≈ (0.01 / 1,355) * 240
                 ≈ 0.0018 m/s per orbit

  Over 3 orbits: ~0.005 m/s of velocity loss to drag.

  This is utterly insignificant compared to the 100 m/s
  retrofire delta-v. Glenn's orbit would have remained
  stable for hundreds of orbits at this drag rate.
  Natural orbital decay from 161 km perigee would take
  weeks to months, depending on solar activity (which
  affects upper atmosphere density through heating and
  expansion).

  For comparison, the International Space Station at
  ~400 km altitude experiences approximately 2 km of
  altitude loss per month and requires periodic reboosts.
  Glenn's lower perigee would have caused faster decay,
  but the 3-orbit mission duration was far too short
  for drag to matter.
```

---

## Deposit 6: TSPB Layer Synthesis (Layers 1-7)

### TSPB Layer Deposits

**Observation (Layer 1)**

Glenn was the first American to observe the Earth from orbit. His observations were not incidental -- they were a mission objective. Mercury-Atlas 6 was designed to answer the question: can a human pilot observe, report, and control from orbit in ways that instruments cannot? Glenn's observations proved the answer was yes.

He observed the African continent crossing beneath him at sunset on his first orbit and reported distinct color bands in the Earth's atmosphere at the terminator -- the line between day and night. He observed thunderstorms over the Indian Ocean, describing the lightning flashes as "like looking down at a field of fireflies." He observed the city lights of Perth, Australia, whose citizens had turned on their lights en masse as a greeting. He observed and reported the famous "fireflies" -- luminescent particles streaming past his window at each sunrise, later identified by Scott Carpenter on MA-7 as frozen sublimated coolant droplets from the capsule's exterior surface, illuminated by sunlight against the black background of space.

The tracking network measured his position, velocity, and orbital elements. The ground controllers computed his trajectory. But Glenn provided something the instruments could not: pattern recognition, anomaly detection, and contextual judgment. When the Segment 51 telemetry suggested a heat shield problem, the ground controllers debated for two orbits before deciding on the retro-pack-on procedure. Glenn, unaware of the specific concern, had already noticed unusual banging and oscillation from his capsule's automatic attitude control system (the 1-pound hydrogen peroxide thrusters were consuming excessive fuel). He switched to manual fly-by-wire control and managed the attitude himself -- a decision that instruments could detect but not initiate.

**Theory (Layer 4)**

The mathematical framework underlying Glenn's mission spans four centuries of celestial mechanics. The vis-viva equation derives from conservation of energy in a gravitational field -- a principle established by Newton in 1687 and refined by Euler and Lagrange in the 18th century. Kepler's Third Law dates to 1619 -- a purely empirical observation that Newton later proved from first principles. The rocket equation was derived by Tsiolkovsky in 1903 -- 59 years before Glenn's flight. The reentry corridor geometry was computed by researchers at NACA Langley and the Ballistic Missile Division at Patrick Air Force Base in the late 1950s, building on warhead reentry research from the ICBM programs.

Every equation used to plan Glenn's mission was established before the Space Age began. The mathematical infrastructure was complete. What was missing was the engineering to execute it: the Atlas booster reliable enough to trust with a human payload, the capsule survivable enough to withstand reentry heating, the heat shield ablative enough to protect the pilot, the tracking network global enough to monitor three orbits, and the human brave enough to sit atop an Atlas D -- a vehicle that had a 30% failure rate through 1961 -- and trust the mathematics.

**Application (Layer 4b)**

The practical application of orbital mechanics to MA-6 required translating textbook equations into operational procedures:

- The vis-viva equation became the go/no-go velocity check at SECO. If the sustainer engine cut off with velocity below 7,750 m/s, the orbit would be too low (perigee below 140 km, unacceptable drag). If the velocity exceeded 7,900 m/s, the apogee would be too high (above 300 km, outside tracking network coverage for some passes). The acceptable velocity window at insertion was approximately 150 m/s wide.
- Kepler's Third Law became the ground track prediction. Each tracking station needed to know when the capsule would appear above its horizon, within a window of approximately 30 seconds. The orbital period determined the timing, and the inclination determined the ground track.
- The rocket equation became the propellant loading calculation. The Atlas carried approximately 109,000 kg of propellant (RP-1 kerosene and liquid oxygen). Too little, and it would not reach orbital velocity. Too much, and the vehicle was overweight at liftoff, increasing the structural loads during max-q (maximum dynamic pressure). The propellant load was calculated to provide the required delta-v with a margin of approximately 2%.
- The reentry corridor became the retrofire timing window. The retrorockets had to fire within a 30-second window to land within the primary recovery zone.

**Synthesis (Layer 6)**

Glenn's three orbits connected the theoretical and the empirical. The vis-viva equation predicted velocities of 7.84 km/s at perigee and 7.72 km/s at apogee; the tracking network confirmed these to within the measurement uncertainty. Kepler's Third Law predicted an 88.5-minute period; the mission timer measured 88.5 minutes. The rocket equation predicted a total delta-v requirement of 9.3 km/s; the Atlas delivered it. The thermal analysis predicted heat shield surface temperatures of approximately 1,650 C; postflight inspection confirmed charring consistent with that temperature.

But the Segment 51 anomaly broke the clean narrative. The telemetry said the heat shield was loose. The mathematics said it should not be -- there was no mechanism for separation in orbital flight. The engineers had to choose: trust the telemetry (a single switch reading, known to be susceptible to sensor errors) or trust the physics (no plausible failure mode). They chose a compromise: trust the physics enough to proceed with the mission, but hedge by retaining the retro pack. This is the engineer's synthesis: not pure theory, not pure measurement, but judgment applied at the intersection.

**Debate (Layer 7)**

The Segment 51 decision reveals the fundamental tension between data and model. The telemetry was data: a sensor reading, a bit, a 1 where a 0 was expected. The physics was model: the equations that described what was possible and what was not. When data contradicts model, which do you believe? The answer depends on the relative reliability of each. A sensor can fail. A physical law cannot. But the model includes more than physical laws -- it includes the engineering assumptions about the heat shield attachment, the manufacturing quality, the loads environment. Any of those assumptions could be wrong. The data is unreliable. The model is uncertain. The decision must be made anyway.

---

## Mercury Orbital Parameters -- Rosetta Reference Table

| Parameter | Symbol | Value | Unit | Derivation |
|-----------|--------|-------|------|------------|
| Semi-major axis | a | 6,584 | km | (r_p + r_a) / 2 |
| Eccentricity | e | 0.0079 | -- | (r_a - r_p) / (r_a + r_p) |
| Perigee altitude | h_p | 161 | km | measured at insertion |
| Apogee altitude | h_a | 265 | km | measured at insertion |
| Perigee radius | r_p | 6,532 | km | R_earth + h_p |
| Apogee radius | r_a | 6,636 | km | R_earth + h_a |
| Inclination | i | 32.5 | degrees | launch azimuth from Cape Canaveral |
| Period | T | 88.5 | minutes | 2*pi*sqrt(a^3/GM) |
| Orbital velocity (perigee) | v_p | 7.84 | km/s | sqrt(GM*(2/r_p - 1/a)) |
| Orbital velocity (apogee) | v_a | 7.72 | km/s | sqrt(GM*(2/r_a - 1/a)) |
| Total delta-v to orbit | delta_v | 9.3 | km/s | orbital v + losses |
| Retrofire delta-v | delta_v_retro | 0.10 | km/s | J_total / m_capsule |
| Reentry velocity | v_entry | 7.70 | km/s | v_orbit - delta_v_retro |
| Reentry Mach number | M | ~23 | -- | v_entry / v_sound |
| Heat shield peak temperature | T_shield | 1,650 | C | ablative thermal analysis |
| Peak deceleration | g_max | 7.7 | g | reentry phase |
| Flight duration | t_total | 4:55:23 | hr:min:s | 3 complete orbits |
| Capsule mass | m_cap | 1,355 | kg | at orbital insertion |

### Cross-Mission Rosetta Table

| Concept | MA-6 Application | Prior Mission Reference |
|---------|-------------------|------------------------|
| Vis-viva equation | v^2 = GM*(2/r - 1/a); v_p = 7.84 km/s | MA-5 (1.18): v_p = 7.82 km/s, same equation |
| Kepler's Third Law | T = 88.5 min from a = 6,584 km | MA-5 (1.18): T = 88.3 min from a = 6,570 km |
| Rocket equation | delta_v = 9.3 km/s, Atlas stage-and-a-half | MA-5 (1.18): same Atlas, same equation |
| Reentry corridor | -1 to -7.5 deg entry angle, retro pack retained | MA-5 (1.18): -1 to -7.5 deg, nominal retro jettison |
| Stagnation heating | T_stag_real ~ 6,000-7,000 K; T_shield ~ 1,650 C | MR-3 (1.19): no orbital reentry heating (suborbital) |
| Retrofire targeting | 468 km per minute of timing error | MA-5 (1.18): same targeting math |
| Telemetry ambiguity | Segment 51 false positive; retro pack compromise | MA-5 (1.18): thruster malfunction, mission curtailed to 2 orbits |
| Manual piloting | Glenn switched to fly-by-wire for attitude control | MR-3 (1.19): Shepard demonstrated manual attitude control suborbital |

---

## Final Debate Questions

1. **Why couldn't Mercury use a circular orbit?** A circular orbit at 213 km (the average of Glenn's perigee and apogee) would have required an injection velocity of exactly 7,783 m/s at exactly 213 km altitude, with zero radial velocity component. The Atlas guidance system could control velocity to approximately +/- 20 m/s and altitude to approximately +/- 5 km. Any error in either parameter produces an ellipse. What injection accuracy (in m/s and km) would be needed to achieve an orbit with eccentricity below 0.001? Below 0.0001? Is a perfectly circular orbit even theoretically achievable with chemical rockets, or is it a mathematical abstraction that real hardware can only approximate?

2. **If the heat shield HAD been loose, what thermal failure mode would have killed Glenn?** The most likely scenario: the heat shield separates during peak deceleration (approximately 7.7g). Without the shield, the capsule's titanium pressure vessel is exposed to the full stagnation environment. Titanium 6Al-4V has a melting point of approximately 1,660 C -- coincidentally close to the heat shield surface temperature. The pressure vessel would begin to soften and deform within seconds, then breach. Cabin depressurization at 7.7g and 1,600 C would be instantly fatal. But would the heat shield actually separate during deceleration? The deceleration pushes the shield against the capsule -- aerodynamic pressure holds it in place. The dangerous phase would be before reentry, when the capsule is in zero-g and the shield is held only by its mechanical attachments. What force would be required to separate a loose shield during zero-g maneuvering?

3. **Why did NASA choose a 32.5-degree orbital inclination?** The inclination is determined by the launch azimuth from Cape Canaveral (latitude 28.5 N). A due-east launch (azimuth 90 degrees) produces the minimum inclination of 28.5 degrees -- equal to the launch site latitude -- and provides the maximum benefit from Earth's rotational velocity (~410 m/s at Cape Canaveral). Glenn's 32.5-degree inclination corresponds to a launch azimuth of approximately 72 degrees (slightly north of due east). Why not launch due east for maximum performance? The answer involves range safety: the Atlas trajectory had to avoid overflying populated areas during ascent. A due-east launch from Cape Canaveral would have sent the booster directly over the Bahamas. The 72-degree azimuth angled the ground track slightly southward, keeping the ascent path over open water. What was the delta-v cost of this range safety constraint? At launch, Earth's rotational velocity contributes v_rot * cos(azimuth - 90) to the eastward velocity; the 18-degree offset from due east reduced this contribution by approximately 1 - cos(18) = 0.049, or about 20 m/s. This is trivial -- less than 0.3% of the total delta-v budget -- but it illustrates that engineering constraints shape orbits as much as physics does.

4. **Glenn reported "fireflies" -- luminescent particles streaming past his window at orbital sunrise on each of his three orbits.** Scott Carpenter on MA-7 later identified these as frozen particles of condensate or sublimated coolant from the capsule's exterior surfaces, illuminated by direct sunlight against the black background of space. The sublimation process is governed by the Clausius-Clapeyron equation: dP/dT = L/(T * delta_v), where L is the latent heat of sublimation and delta_v is the specific volume change. In the vacuum of space, any volatile material on the capsule's exterior (water condensate, residual coolant, even outgassed sealant) sublimes directly from solid/liquid to vapor and immediately freezes into microscopic ice crystals. These crystals drift away from the capsule at very low relative velocity (the sublimation impulse is tiny), forming a cloud that orbits along with the capsule. At each sunrise, sunlight illuminates the cloud. What determined the particle size distribution? What determined the cloud's persistence? And why did Glenn see them only at sunrise -- was it purely illumination geometry, or did the thermal cycling between orbital day and night drive the sublimation rate?

5. **Glenn's mission was originally scheduled for December 20, 1961, but was delayed ten times over two months.** Each delay had a technical reason: weather, hardware issues, scheduling. But the delays had a mathematical consequence: Earth's axial tilt and orbital position changed. In December, the Sun is at approximately -23.4 degrees declination (southern hemisphere summer solstice). By February 20, the Sun had moved to approximately -11.5 degrees declination. This changed the orbital lighting conditions -- the fraction of each orbit spent in sunlight vs. shadow, the thermal environment, and the ground track illumination at the tracking stations. If Glenn had launched in December as originally planned, how would the different solar geometry have affected the mission? Would the fireflies have been visible with different sun angles? Would the thermal environment have been measurably different? The orbit does not care about the calendar, but the environment the orbit passes through changes with the seasons.

---

*"Katherine Johnson computed the orbital trajectory by hand. This is the part of the story that everyone knows now, and it is true, and it matters. Before Glenn would agree to fly, he asked the engineers at the Space Task Group to 'get the girl to check the numbers' -- meaning Johnson, the mathematician at Langley who had been computing trajectories since the NACA days, who understood the vis-viva equation not as a formula to be plugged into but as a relationship to be interrogated. The IBM 7090 at Goddard had computed the trajectory. Johnson verified it on her desktop mechanical calculator -- the same equations, the same constants, the same orbital elements, ground through by hand to confirm that the machine had not made an error. The machine had not. The numbers matched. Glenn trusted the mathematician more than the machine, and he was right to: not because the machine was unreliable, but because the mathematician understood what the numbers meant. The machine computed the orbit. Johnson understood the orbit. The distinction matters, and it mattered on February 20, 1962, when the Segment 51 signal lit up and the engineers had to decide whether a switch reading or a physical model was telling the truth. A machine would have flagged the anomaly and recommended abort. The humans -- the engineers who understood the heat shield, the managers who understood the risk, the mathematician who understood the trajectory -- chose to fly through it, hedging with the retro pack, trusting the physics over a single bit of telemetry. Glenn reentered with chunks of burning retro pack streaming past his window, not knowing whether his heat shield was intact, and the mathematics held. The vis-viva equation does not care about telemetry glitches. Kepler's Third Law does not care about sensor failures. The equations describe what is, not what a faulty switch reports. Glenn orbited three times, saw three sunrises, crossed every ocean, and came home to a nation that needed a hero and got one -- a Marine test pilot who trusted a mathematician's hand calculations over a mainframe computer, who flew a capsule that weighed less than a pickup truck at a velocity that would cross the continental United States in nine minutes, and who, when asked what he thought about while sitting on top of the Atlas waiting for launch, replied: 'I felt exactly how you would feel if you were getting ready to launch and knew you were sitting on top of two million parts -- all built by the lowest bidder on a government contract.' The mathematics was perfect. The hardware was built by the lowest bidder. Glenn flew anyway. Three orbits. Four hours, fifty-five minutes, and twenty-three seconds. The equations that Katherine Johnson checked by hand brought him home."*