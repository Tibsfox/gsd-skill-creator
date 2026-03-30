# Mission 1.8 -- Vanguard 1: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Vanguard 1 (March 17, 1958)
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Polypodium glycyrrhiza (licorice fern)
**Bird:** Selasphorus rufus (Rufous Hummingbird, degree 8)
**Dedication:** Gottlieb Daimler (March 17, 1834)

---

## A. Simulations -- What to Build Locally

### A1. Python: Solar Cell Power Curve as a Function of Angle and Illumination

**What it is:** A Python simulation that computes and visualizes the power output of Vanguard 1's six solar cells as a function of the satellite's orientation relative to the sun. The student adjusts the sun angle, sees the cosine law in action, and understands why a spinning sphere averages the power output over all orientations.

**Why it matters:** Vanguard 1 was the first solar-powered spacecraft. Its six cells each produced roughly 0.38 mW at normal incidence -- a total of about 2.3 mW maximum, with an average of roughly 1 mW accounting for the cosine projection and the 50% of cells in shadow. This razor-thin power budget was enough to operate a transmitter for 6 years. The simulation shows why.

**Specification:**

```python
# vanguard1_solar_power.py
# Solar cell power output as a function of angle and illumination
# Demonstrates the cosine law and hemisphere averaging
#
# Process:
#   1. Define 6 cell positions on a sphere (octahedral arrangement)
#   2. Define sun direction vector
#   3. For each cell, compute angle to sun using dot product
#   4. Apply cosine law: P_cell = P_0 * max(cos(theta), 0)
#      (cells facing away from sun produce zero)
#   5. Sum power from all illuminated cells
#   6. Sweep sun direction over all angles and compute average
#   7. Overlay the I-V curve of a single cell at each angle
#
# Parameters (user-adjustable):
#   cell_efficiency: 5.5% (1958 silicon)
#   cell_area: 5 cm^2
#   solar_constant: 1361 W/m^2
#   num_cells: 6
#   cell_temperature: 300 K (adjustable for thermal effects)
#
# Visualization:
#   - Plot 1: Total power vs sun angle (single rotation axis)
#     Shows the periodic variation as cells rotate in and out of sun
#   - Plot 2: Average power vs cell efficiency (1958 vs modern)
#     Shows that modern cells would produce ~10x more from same area
#   - Plot 3: I-V curves at 0, 30, 60, 90 degrees
#     Shows how illumination angle shifts the entire I-V curve
#   - Plot 4: Power vs time for one orbit (134 min)
#     Including eclipse period (~35 min shadow at 654 km altitude)
#     Shows the intermittent power delivery
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner
# Duration: 2-3 hours
```

**Key learning moments:**
1. The cosine law is not just a formula -- it is the geometry of projection. When a flat cell tilts away from the sun, the effective area shrinks as cos(theta). At 60 degrees, half the light misses the cell. At 90 degrees, all of it misses. This is also why summer is warmer than winter (solar angle) and why the equator is warmer than the poles (same geometry, planetary scale).
2. The power budget is astonishingly small. Vanguard 1 operated its transmitter on approximately 1 mW average solar power. A modern smartphone charger delivers 10,000 times more power. The lesson: if you minimize the power requirement, a tiny solar panel suffices. Vanguard 1's solar cells were the most expensive component per gram. The engineers minimized cell area and maximized duty-cycle efficiency.
3. The eclipse calculation: at 654 km altitude, Vanguard 1 spends approximately 35 minutes per orbit in Earth's shadow (no power) and 99 minutes in sunlight. The capacitor must store enough energy during sunlight to sustain the transmitter through shadow, or the transmitter goes silent in eclipse. The student can compute the required capacitance.

**Extension:** Add a cell degradation model. Silicon solar cells degrade under proton irradiation at approximately 1-2% per year in the inner Van Allen belt. After 6 years (1964), Vanguard 1's cells had degraded to approximately 88-92% of initial efficiency. At what efficiency does the average power drop below the transmitter's minimum operating threshold? This sets the death date of the solar transmitter.

---

### A2. Python: Vanguard 1 Orbital Lifetime Prediction with Drag Model

**What it is:** An orbital mechanics simulation that propagates Vanguard 1's orbit forward in time, including atmospheric drag at perigee, solar radiation pressure, and J2 precession, to predict when the satellite will re-enter the atmosphere. The simulation shows why Vanguard 1 will orbit for 240+ years while Explorer 1 lasted only 12 years.

**Why it matters:** Orbital lifetime is dominated by perigee altitude. The exponential decrease of atmospheric density with altitude means that a 296 km difference in perigee (654 km vs 358 km) produces a 20-fold difference in lifetime. This simulation makes the exponential sensitivity concrete.

**Specification:**

```python
# vanguard1_orbital_lifetime.py
# Orbital propagation with atmospheric drag model
#
# Process:
#   1. Initialize orbit: a = 8,682 km, e = 0.191, i = 34.25 deg
#   2. Atmospheric density model: NRLMSISE-00 simplified
#      rho(h) = rho_0 * exp(-(h - h_0) / H)
#      with solar cycle modulation (F10.7 index)
#   3. Drag force at perigee: F_drag = 0.5 * rho * v^2 * Cd * A
#      Cd = 2.2 (sphere), A = pi*(0.0825)^2 = 0.0214 m^2
#   4. Compute semi-major axis change per orbit from drag
#   5. Apply J2 apsidal and nodal precession
#   6. Apply solar radiation pressure (small effect)
#   7. Propagate forward: year by year for 300 years
#   8. Track perigee altitude evolution
#   9. Compare with Explorer 1 (h_p = 358 km)
#
# Parameters:
#   spacecraft_mass: 1.47 kg
#   diameter: 0.165 m
#   Cd: 2.2 (sphere)
#   initial_perigee: 654 km
#   initial_apogee: 3969 km
#   solar_cycle_period: 11 years
#   F10.7_min: 70 sfu (solar minimum)
#   F10.7_max: 200 sfu (solar maximum)
#
# Visualization:
#   - Plot 1: Perigee altitude vs time (0 to 300 years)
#     Slow decay for 200+ years, then accelerating terminal spiral
#   - Plot 2: Atmospheric density at perigee vs time
#     11-year solar cycle oscillation superimposed on slow increase
#   - Plot 3: Explorer 1 vs Vanguard 1 perigee evolution (log scale)
#     Shows the dramatic difference between 358 km and 654 km
#   - Plot 4: Orbital period vs time
#     Shows the gradual decrease as the orbit shrinks
#
# Libraries: numpy, matplotlib, scipy
# Difficulty: Intermediate
# Duration: 4-6 hours
```

**Key learning moments:**
1. The exponential sensitivity of lifetime to perigee altitude. Plotting both satellites on the same graph makes the factor-of-20 difference visceral.
2. The solar cycle effect: every 11 years, the sun heats the upper atmosphere, expanding it upward. Vanguard 1's perigee dips into slightly denser air during solar maximum, losing slightly more energy. Over 22 solar cycles, these periodic losses accumulate.
3. The terminal spiral: for most of its life, Vanguard 1's perigee drops by fractions of a meter per year. But the exponential density increase means that once perigee drops below ~500 km, the decay accelerates dramatically. The last century of orbit will pass uneventfully. The last decade will be noticeable. The last year will be rapid. The last month will be a spiral. This is the same exponential that governs compound interest and bacterial growth -- slow, slow, slow, then suddenly fast.

---

### A3. Web: Interactive Geoid Viewer

**What it is:** A web application that visualizes Earth's geoid -- the equipotential surface of gravity -- showing the J2 (oblate) and J3 (pear-shaped) terms discovered and refined by Vanguard 1's tracking data. The user adjusts the harmonic coefficients with sliders and watches the geoid shape change in real time.

**Specification:**

```
WEB APPLICATION: Interactive Geoid Viewer
==========================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view (70% of viewport):
  - Earth rendered as a sphere with exaggerated geoid deformation
  - Color-coded: blue (geoid below reference ellipsoid) to
    red (geoid above reference ellipsoid)
  - Exaggeration factor: 10,000x to make 15-meter deviations
    visible on a 12,756 km sphere
  - Rotation: auto-rotate slowly, mouse drag to rotate manually
  - Meridional cross-section overlay: white outline showing
    the geoid profile from north to south

  The key visual: with J3 turned on, the sphere becomes
  visibly pear-shaped. The south pole extends slightly further
  from center than the north pole. The asymmetry is the discovery.

Side panel (30%):
  - J2 slider: 0 to 2x nominal (default = nominal)
    Shows transition from sphere to oblate spheroid
  - J3 slider: 0 to 100x nominal (default = nominal, exaggerated)
    Shows transition from oblate to pear-shaped
  - J4 slider: 0 to 100x nominal (default = off)
    Shows further refinement of polar/equatorial shape
  - "Vanguard 1 orbit" toggle: show the orbit as a gold ellipse
    tilted at 34.25 degrees, with the satellite position
    moving along it
  - "Pre-Vanguard" button: sets J3 = 0, showing what geodesists
    thought before 1959 (perfect oblate spheroid)
  - "O'Keefe discovery" button: fades J3 from 0 to nominal,
    revealing the pear shape as the tracking data accumulated
  - Geoid height profile: plot of geoid height vs latitude
    (N vs phi) on a small chart, updating in real time
  - Readouts: geoid height at North Pole, Equator, South Pole
  - Asymmetry: N(South) - N(North) in meters

Animation sequence for "O'Keefe discovery":
  - t=0s: oblate spheroid only (J2 = nominal, J3 = 0)
    Text: "Before Vanguard 1: Earth is an oblate spheroid"
  - t=5s: J3 begins increasing from 0 to nominal
    Text: "Tracking residuals accumulate over months..."
  - t=10s: J3 at nominal value (with 10,000x exaggeration)
    The pear shape is visible. South pole extends.
    Text: "O'Keefe, Eckels, Squires (1959): Earth is pear-shaped"
    "15 meters of asymmetry, measured by a 1.47 kg sphere"
  - t=15s: hold. Display the geoid height profile.
    "J3 = -2.54 x 10^-6. A grapefruit weighed the planet."

Performance:
  - 60 fps on modern browsers
  - Canvas 2D (no WebGL needed for exaggerated cross-section)
  - Total JS: < 500 lines
  - Single self-contained HTML file

Deliverables:
  - Single HTML file, no dependencies
  - Hostable at tibsfox.com/Research/NASA/1.8/
```

**Key learning moment:** The "Pre-Vanguard" to "O'Keefe discovery" animation. The student watches the perfectly symmetric oblate spheroid develop a subtle north-south asymmetry as the J3 term appears. The asymmetry is tiny -- even at 10,000x exaggeration it is barely visible. But it IS visible, and it was measured to high precision from the orbit of a grapefruit. The student sees that precision measurement, applied patiently over months, can detect a 15-meter signal on a 12,756 km sphere.

---

### A4. Web: "Oldest Objects in Space" Interactive Timeline

**What it is:** An interactive timeline showing every human-made object still in orbit, with Vanguard 1 highlighted as the oldest. The timeline stretches from 1958 to present, with objects plotted by launch date and predicted remaining orbital lifetime. Vanguard 1 sits at the beginning of the timeline -- the first point on a chart that now contains thousands.

**Specification:**

```
WEB APPLICATION: Oldest Objects in Space
==========================================

Technology: HTML5 Canvas + JavaScript
Target: Modern browser, 1920x1080

Main view:
  - Horizontal timeline: 1958 to 2026 (left to right)
  - Vertical axis: perigee altitude (0 to 40,000 km, log scale)
  - Each object: a dot, sized by mass, colored by status
    - Green: still transmitting
    - Gold: silent but tracked (Vanguard 1)
    - Grey: debris, uncontrolled
    - Red: re-entered (shown at their re-entry year)
  - Hover: show object name, launch date, mass, perigee, status

  Key objects highlighted:
    - Vanguard 1 (1958, 1.47 kg, 654 km, OLDEST IN ORBIT)
    - Explorer 1 (1958, 13.97 kg, re-entered 1970)
    - Sputnik 1 (1957, 83 kg, re-entered Jan 1958)
    - Vanguard 2 (1959, 9.4 kg, still in orbit)
    - LAGEOS (1976, 411 kg, 5,860 km, ~8.4 million year lifetime)

  Annotation lines:
    - "Atmosphere ends here" at ~100 km
    - "ISS orbit" at ~400 km
    - "Vanguard 1 perigee" at 654 km
    - "GPS constellation" at 20,200 km
    - "Geostationary" at 35,786 km

  The visual story: most early satellites re-entered within years.
  Vanguard 1, at 654 km perigee, persists. Higher objects persist
  even longer. LAGEOS at 5,860 km will orbit for millions of years.
  Altitude is destiny.

Side panel:
  - Object count: total objects shown
  - "Still in orbit" count
  - "Re-entered" count
  - Oldest object: Vanguard 1 (68 years as of 2026)
  - Slider: filter by mass (show only objects > X kg)
  - Search: find specific satellite by name

Controls:
  - Zoom: scroll to zoom on timeline sections
  - "1958 only" button: show just the first year — Sputnik,
    Explorer, Vanguard, and their fates
  - "Uptime" button: redraw with vertical axis as years in orbit
    Vanguard 1 tops the chart at 68 years. ISS is at 26.

Deliverables:
  - Single HTML file, self-contained
  - Data embedded as JSON array (~50 notable objects)
```

**Key learning moment:** The "Uptime" view. When the vertical axis switches from altitude to years in orbit, Vanguard 1 jumps to the top of the chart. It has been orbiting longer than any other satellite. The ISS, with its continuous crew and regular reboosts, has been in orbit for 26 years. Vanguard 1, with no crew, no reboosts, no maintenance, has been in orbit for 68 years. The simplest satellite is the most persistent.

---

## B. Machine Learning -- What to Train

### B1. Orbital Decay Prediction

**What it is:** Train a machine learning model to predict orbital lifetime from initial orbital elements and spacecraft parameters (mass, area, drag coefficient). The model learns the non-linear relationship between perigee altitude, atmospheric density, solar activity, and orbital decay rate.

```
Model: Random Forest or Gradient-Boosted Trees (XGBoost)

Input features (8):
  - Perigee altitude (km)
  - Apogee altitude (km)
  - Inclination (degrees)
  - Ballistic coefficient BC = m / (Cd * A) (kg/m^2)
  - Solar F10.7 flux at launch (sfu)
  - Solar cycle phase (0-1, fraction of 11-year cycle)
  - Eccentricity
  - Semi-major axis (km)

Output: log10(orbital lifetime in years)

Training data: 5,000 simulated satellites
  - Random perigee: 200-1000 km
  - Random apogee: perigee+100 to 40,000 km
  - Random BC: 5-500 kg/m^2
  - Random F10.7: 70-200 sfu
  - Labels: lifetime computed by physics-based orbit propagator

The student learns:
  - Perigee altitude is the dominant feature (>70% importance)
  - BC is second (~15%)
  - Solar activity matters for LEO but not for high orbits
  - The model rediscovers the exponential relationship between
    altitude and lifetime from data alone
  - Feature importance matches physical intuition:
    perigee >> BC >> F10.7 >> inclination >> others

Test case: predict Vanguard 1's lifetime
  Input: h_p=654, h_a=3969, i=34.25, BC=31.2
  Expected: ~240 years
  The model should predict within 20% if well trained.

Libraries: scikit-learn or XGBoost, matplotlib
GPU: Not needed (tabular data)
Training time: ~30 seconds
Difficulty: Beginner-Intermediate
```

### B2. Solar Cell Degradation Prediction

**What it is:** Train a regression model to predict solar cell efficiency degradation as a function of cumulative radiation fluence, cell temperature, and operating time. The model learns the degradation kinetics from accelerated test data.

```
Model: Neural network (2 hidden layers, 64 neurons each) or XGBoost

Input features (5):
  - Cumulative proton fluence (protons/cm^2, log scale)
  - Proton energy (MeV)
  - Cell temperature (K)
  - Initial cell efficiency (%)
  - Time in orbit (years)

Output: remaining efficiency as fraction of initial (0 to 1)

Training data: 2,000 samples from published degradation curves
  - JPL Solar Cell Radiation Handbook data
  - Various cell types: Si, GaAs, InGaP/GaAs/Ge
  - Fluences from 10^10 to 10^15 protons/cm^2
  - Labels: measured efficiency ratio after irradiation

The student learns:
  - Degradation follows a logarithmic curve: efficiency drops
    rapidly at first, then more slowly (defect saturation)
  - GaAs and multi-junction cells degrade less than Si
  - Temperature accelerates degradation (annealing competes)
  - Vanguard 1's Si cells at ~5.5% initial, 6 years in orbit
    at L ~ 1.1-1.6, would have degraded to approximately
    88-92% of initial efficiency by 1964

  Predict: when did Vanguard 1's solar transmitter die?
  The model estimates the fluence at which power drops below
  the transmitter threshold (~0.5 mW). Compare with the
  actual date: May 1964 (last confirmed detection).

Libraries: PyTorch or scikit-learn, matplotlib
GPU: Optional
Training time: ~2 minutes
Difficulty: Intermediate
```

---

## C. Computer Science -- 68 Years of Continuous Orbit as Uptime

### C1. Uptime: The Longest-Running Process

Vanguard 1 has been in continuous operation (orbiting) since March 17, 1958. As of March 30, 2026, that is:

```
UPTIME CALCULATION:

Days since launch: 24,850 days (68 years, 13 days)
Hours: 596,400 hours
Orbits completed: ~267,000 (at 134.2 min/orbit)
Distance traveled: ~10 billion km (267,000 orbits * ~37,500 km/orbit)

For comparison:
  - Linux server uptime record: ~6 years (various claims)
  - ISS continuous habitation: 26 years (since Nov 2, 2000)
  - Voyager 1 operating: 48 years (launched Sep 5, 1977)
  - Vanguard 1 orbiting: 68 years (the process has no PID
    but it is still running)

COMPUTER SCIENCE ANALOGY:

Vanguard 1 is a process with:
  - No input (transmitters dead since 1964)
  - No output (no telemetry since 1964)
  - No state changes (same orbit, slowly decaying)
  - No error handling (no attitude control, no recovery)
  - Infinite loop: orbit() { return; } // repeat forever

It is the longest-running process in human history that
has no watchdog, no restart mechanism, no error recovery,
and no termination condition. It will terminate when
atmospheric drag reduces perigee below ~200 km, causing
re-entry. Estimated time to termination: ~170 more years.

EXERCISE:
  Compute Vanguard 1's "nine nines" availability:
  Total time: 68 years = 596,400 hours
  Downtime: 0 hours (it has never stopped orbiting)
  Availability: 100.000000000%

  (Yes, the "downtime" of the transmitter is different from
  the "downtime" of the orbit. The transmitter died in 1964.
  The orbit has never been interrupted. Vanguard 1 is a system
  where the essential service (orbiting) has 100% uptime,
  while the non-essential service (transmitting) failed after
  6 years. This is the microservices lesson: decouple the
  services so that one can fail without killing the other.)

  Modern equivalent: a Kubernetes pod that lost its networking
  (transmitter dead) but the container keeps running its
  main loop (orbiting). The readiness probe fails but the
  liveness probe passes. The pod is not restarted because
  it is still alive — it just cannot talk to anyone.
```

### C2. Hash of a Trajectory

```
EXERCISE: Compute a hash of Vanguard 1's orbital state.

At any instant, Vanguard 1's state is defined by 6 numbers:
  (x, y, z, vx, vy, vz) — position and velocity in ECI frame

These 6 numbers (48 bytes as doubles) uniquely determine the
satellite's past and future trajectory (ignoring perturbations).

Task: Write a program that:
  1. Computes Vanguard 1's ECI state vector at the current epoch
  2. Hashes the state vector (SHA-256)
  3. Stores the hash with a timestamp
  4. Repeats every hour for 24 hours
  5. Shows that each hash is unique (the state never repeats
     exactly because perturbations prevent exact periodicity)

The hash of a trajectory is a unique fingerprint of where
Vanguard 1 was at a specific instant. No two instants
produce the same hash because no two instants have the
same state vector. The satellite's orbit is not periodic
— J2 precession, atmospheric drag, and solar pressure
ensure that it never returns to exactly the same state.

This is the CS lesson: deterministic chaos in orbital mechanics.
The trajectory is deterministic (given initial conditions and
force model, the orbit is computable to arbitrary precision)
but not periodic (it never exactly repeats). Like a PRNG
with a very long period, the orbit visits every possible
state in a dense subset of phase space without repeating.
```

---

## D. Game Theory -- Navy vs Army: The Satellite Competition

### D1. Vanguard vs Explorer: Institutional Risk

The American satellite program was split between two competing teams: the Navy's NRL (Project Vanguard) and the Army's ABMA (Explorer/Juno). Vanguard was the official program. Explorer was the backup that was not supposed to exist.

**The Game:**

| | Vanguard succeeds first | Vanguard fails |
|---|---|---|
| **Army prepares Explorer** | Army wasted resources (but has backup) | Army saves national prestige |
| **Army does not prepare** | Correct decision, Navy gets glory | National disaster, no backup |

**The Strategic Analysis:**

```
GAME: PORTFOLIO MANAGEMENT UNDER UNCERTAINTY

The Eisenhower administration chose Vanguard because it was
civilian (Navy's NRL, not Army missiles) — better optics
for the International Geophysical Year. The decision was
political, not technical.

Von Braun's Army team could have launched a satellite in
1956 using their Jupiter-C rocket (which they "accidentally"
demonstrated by launching a nosecone to 682 miles altitude).
They were ordered not to.

After Sputnik (Oct 4, 1957), the political calculation changed:
  - Before Sputnik: scientific prestige > military optics
  - After Sputnik: national prestige > everything

Vanguard TV-3 exploded on Dec 6, 1957.
Explorer 1 launched on Jan 31, 1958.
Vanguard 1 launched on Mar 17, 1958.

THE PORTFOLIO LESSON:
  The government ran both programs after Sputnik — Vanguard
  was not cancelled when Explorer succeeded. Both continued.
  Three of 11 Vanguard launches succeeded. All Explorer
  launches in 1958 succeeded.

  Optimal strategy: run parallel approaches when the cost
  of total failure exceeds the cost of redundancy.
  $2M for Explorer backup << cost of no US satellite.

  Modern equivalent: A/B testing. Run both approaches.
  Measure. Keep the one that works. Vanguard's hardware
  eventually worked and produced the most scientifically
  valuable satellite (geodesy). Explorer's hardware worked
  first and produced the most dramatic discovery (radiation belts).
  Both were worth funding.

EXERCISE:
  Model the decision to fund one vs two satellite programs
  as a portfolio optimization problem. Given:
  - P(Vanguard success per attempt) = 0.27 (3/11 actual)
  - P(Explorer success per attempt) = 0.67 (2/3 actual)
  - Cost per Vanguard attempt: ~$10M
  - Cost per Explorer attempt: ~$3M
  - Value of being first: V_first >> cost

  What is the optimal number of attempts for each program
  to maximize probability of at least one success within 12 months?
```

### D2. The Khrushchev Taunt: Information vs Mass

```
SIGNALING GAME: Satellite Mass as Signal

Sputnik 1: 83 kg
Sputnik 2: 508 kg (with Laika)
Vanguard 1: 1.47 kg

Khrushchev called Vanguard 1 "the grapefruit satellite."
The taunt was strategic: the mass ratio (508 / 1.47 = 346x)
signaled that Soviet rockets could lift much heavier payloads
— i.e., much heavier nuclear warheads.

But the information content was asymmetric:
  - Sputnik 1 beeped and measured nothing
  - Sputnik 2 carried a dog and measured nothing useful
  - Vanguard 1 measured the shape of the Earth

The grapefruit produced more science per kilogram than
any Soviet satellite of the era. Mass is not information.
A 1.47 kg satellite carrying solar cells and a transmitter
generated more knowledge than a 508 kg satellite carrying
a dog.

EXERCISE:
  Define "scientific information density" as bits of
  published scientific knowledge per kilogram of satellite.
  Compute this metric for:
  - Sputnik 1 (83 kg, measured atmospheric density from
    orbital decay, ~1 paper)
  - Vanguard 1 (1.47 kg, measured J2, J3, proved solar
    power, ~5 papers)
  - Explorer 1 (13.97 kg, discovered radiation belts,
    ~10 papers)

  Which satellite was most information-dense?
  Does information density correlate with mass? (No.)
  Does it correlate with instrument sophistication? (Somewhat.)
  Does it correlate with orbital altitude and lifetime? (Yes —
    Vanguard 1's long lifetime enabled the geodesy work.)
```

---

## E. Creative Arts -- What to Create

### E1. "Grapefruit in Space" -- Scale Model Art Installation

**What it is:** A photographic or digital art series showing a real grapefruit suspended against various backgrounds (night sky, Earth from space, desert landscape, PNW forest) to convey the absurd scale contrast between Vanguard 1 (16.5 cm, 1.47 kg) and the planet it measured (12,756 km, 5.972 x 10^24 kg).

```
ART SERIES: "Grapefruit in Space"
===================================

Concept: A grapefruit is exactly the size of Vanguard 1.
This is not a metaphor — the satellite IS grapefruit-sized.
The art series juxtaposes the physical fruit with the
cosmic context.

Composition 1: "The Grapefruit and the Planet"
  - A real grapefruit on a dark surface
  - Behind it: Earth from space (public domain NASA image)
  - Scale annotation: "1.47 kg measured 5,972,000,000,000,
    000,000,000,000 kg"
  - The size contrast is the art

Composition 2: "Khrushchev Was Right"
  - A grapefruit sitting on a kitchen scale reading 1.47 kg
  - Title text: "Khrushchev called it the grapefruit satellite.
    The grapefruit weighed the world."
  - Period-appropriate kitchen aesthetic (1950s Americana)

Composition 3: "The Oldest Thing Up There"
  - A grapefruit with 6 small mirrors glued to it (solar cells)
  - Thin wire antennas (4 wire stubs)
  - Suspended from fishing line against night sky
  - Long exposure: star trails behind the grapefruit
  - Caption: "Still orbiting. 68 years. No maintenance."

Composition 4: "Epiphyte"
  - A grapefruit-sized sphere nestled in the moss and ferns
    on a bigleaf maple branch (PNW forest setting)
  - Licorice ferns growing around it
  - Visual parallel: satellite on orbit = fern on branch
  - Both are small things clinging to larger things

Tools: Camera (phone is fine), grapefruit, dark cloth, mirrors
Build time: 2-4 hours
Difficulty: Beginner
```

### E2. Polypodium glycyrrhiza Botanical Illustration

**What it is:** A detailed botanical illustration of Polypodium glycyrrhiza (licorice fern) in the style of traditional scientific illustration, showing the frond structure, sorus detail, rhizome anatomy, and the seasonal cycle from winter growth to summer dormancy.

```
SCIENTIFIC ILLUSTRATION: Polypodium glycyrrhiza
=================================================

Composition (11x14 inch plate):
  - Main figure (60% of plate):
    Several fronds growing from a rhizome on a mossy branch
    Winter condition (fresh, bright green, fully expanded)
    Show 2-3 fronds at different stages of maturity
    Include section of bigleaf maple bark with moss substrate

  - Detail A (upper right, 10%):
    Single pinna (leaflet), underside view at 5x magnification
    Show round sori in two rows — "naked" (no indusium)
    Label: sorus, sporangium ring, spores

  - Detail B (middle right, 10%):
    Rhizome cross-section at 10x magnification
    Show vascular bundle, cortex, brown scales
    Label: xylem, phloem, sclerenchyma, scale

  - Detail C (lower right, 10%):
    Seasonal cycle — four small panels:
    Oct: new fronds unfurling from rhizome
    Jan: full-size fronds, sori developing
    Apr: fronds beginning to yellow at tips
    Jul: fronds desiccated, curled, brown — dormant

  - Title block (bottom, 10%):
    "Polypodium glycyrrhiza Maxon"
    "Licorice fern — Epiphytic on Acer macrophyllum"
    "Vanguard 1 paired organism — Mission 1.8"
    Scale bars for each figure

Color palette:
  - Frond green (fresh): #4A7C3F, #5C9A4E, #6DB35A
  - Frond yellow (aging): #8B9A3F, #A4B55A, #B8C46E
  - Frond brown (dormant): #6B5B3A, #7B6B4A, #8B7B5A
  - Rhizome: #5C3A1E, #6B4A2E, #7B5A3E
  - Rhizome scales: #8B6B3E, #9B7B4E
  - Bark: #3A2818, #4A3828, #5A4838
  - Moss: #3A5A2A, #4A6A3A, #5A7A4A
  - Sori (ripe): #C8841E, #D8942E, #E8A43E

Medium: Digital (Procreate or Clip Studio) imitating ink + watercolor
Build time: 6-10 hours
Difficulty: Intermediate (botanical illustration experience helpful)
```

---

## F. Problem Solving -- How to Determine Earth's Shape from Orbit Tracking

### F1. The Residuals Challenge

You are John O'Keefe at the Army Map Service. It is early 1959. Vanguard 1 has been in orbit for a year. You have 12 months of precision tracking data -- hundreds of orbital position measurements from Minitrack stations. You have computed the best-fit Keplerian orbit with J2 perturbations. But there are residuals -- systematic differences between predicted and observed positions that do not average to zero.

```
DATA: TRACKING RESIDUALS (ALONG-TRACK, IN METERS)

After removing J2 effects, the remaining residuals show a
pattern correlated with latitude:

  Latitude (deg) | Residual (m) | Direction
  ---------------|--------------|----------
      +80        |    -28       | satellite arrives EARLY
      +60        |    -22       | satellite arrives EARLY
      +40        |    -12       | satellite arrives EARLY
      +20        |     -4       | slight early
        0        |      0       | on time (by symmetry)
      -20        |     +5       | satellite arrives LATE
      -40        |    +14       | satellite arrives LATE
      -60        |    +24       | satellite arrives LATE
      -80        |    +31       | satellite arrives LATE

The pattern is antisymmetric: negative in the north (early),
positive in the south (late). The magnitude increases toward
the poles.

HYPOTHESIS A: Timing errors in ground stations
  - If northern stations have fast clocks, satellite appears early
  - If southern stations have slow clocks, satellite appears late
  - Evidence against: the pattern appears in data from ALL stations,
    not just individual station errors

HYPOTHESIS B: Atmospheric drag asymmetry
  - Perhaps atmospheric density differs between hemispheres
  - Evidence against: drag affects perigee altitude, not latitude.
    The residuals correlate with latitude, not altitude.

HYPOTHESIS C: Higher-order gravitational harmonic (J3)
  - A J3 term would produce exactly this antisymmetric pattern
  - P3(cos theta) changes sign at the equator
  - The satellite speeds up (arrives early) in the hemisphere
    where the geoid is depressed (north) and slows down
    (arrives late) where the geoid is elevated (south)
  - The magnitude of the residuals is consistent with
    J3 ~ -2.5 x 10^-6

YOUR TASK:
  1. Fit the residuals to a model: R(phi) = C * P3(sin phi)
     where P3(x) = (5x^3 - 3x) / 2
  2. Determine C from least-squares fit
  3. Convert C to J3 using the relationship between
     along-track residual and geoid height perturbation
  4. Is J3 positive or negative? What does the sign mean
     for the shape of the Earth?

HINT: The residuals show the south is "late" = satellite
slows down in the south = gravitational field is slightly
stronger in the south = geoid is higher in the south =
J3 is negative (southern geoid extends further from center).
```

**The Answer:** O'Keefe fitted the residuals and determined J3 = -2.54 x 10^-6. The negative sign means the geoid in the southern hemisphere is farther from Earth's center than in the northern hemisphere -- Earth is pear-shaped with the wider end at the south pole. The residuals were not noise, not timing errors, not drag. They were the gravitational signature of a planet that is not quite symmetric about its equator. A 1.47 kg sphere, tracked for a year, told us the shape of the world.

---

## G. GSD -- The Long-Running Process Pattern

### G1. Skills: Persistence Over Spectacle

Vanguard 1 teaches a GSD skill pattern: **persistence over spectacle**.

```
GSD PATTERN: Persistence Over Spectacle

Explorer 1 was spectacular: first US satellite, discovered the
radiation belts, press conference with three men holding a model
above their heads. It re-entered in 12 years.

Vanguard 1 was humiliated: "grapefruit satellite," preceded by
two public explosions, mass compared unfavorably to Sputnik.
It will orbit for 240 years.

The persistent system outlasts the spectacular one.

INDICATORS OF PERSISTENCE:
  1. Small resource footprint (1.47 kg, 1 mW solar power)
  2. High tolerance for resource interruption (shadow/dormancy)
  3. No single point of failure that terminates the mission
     (battery dies → solar keeps going; solar dies → orbit continues)
  4. Minimal maintenance requirements (zero, in this case)
  5. Operating environment is benign at baseline
     (654 km altitude, minimal drag)

EXAMPLES IN SOFTWARE SYSTEMS:
  - SQLite: no server, no configuration, no admin. It just works.
    Used in every smartphone, every browser, every embedded system.
    Not spectacular. Persistent. More deployments than any other
    database engine in history.
  - Unix cron: runs tasks on schedule. No UI, no dashboard, no
    monitoring (by default). It has been running since 1975.
    50+ years of continuous operation on millions of systems.
  - /etc/hosts: a flat text file that resolves hostnames.
    Predates DNS. Still works. Still checked first. Still present
    on every networked computer. The simplest solution persists.

GSD APPLICATION:
  When designing a system for longevity:
  1. Minimize resource requirements (power, memory, bandwidth)
  2. Tolerate resource interruption gracefully (retry, backoff, dormancy)
  3. Separate essential function from auxiliary services
     (orbit ≠ transmit; the core loop must survive service loss)
  4. Place the system in a benign operating environment
     (high perigee = low drag = long life)
  5. Prefer simplicity over capability
     (a sphere with 6 solar cells outlasts a complex observatory)

  Vanguard 1 has been running for 68 years with zero maintenance,
  zero updates, zero human intervention. Its "code" is Newtonian
  mechanics. Its "infrastructure" is Earth's gravitational field.
  Its "SLA" is 100% uptime for the orbit service, 9% uptime for
  the transmit service (6 years out of 68). The essential service
  is the one with 100% uptime.
```

### G2. The Epiphyte Pattern

Polypodium glycyrrhiza teaches a complementary GSD pattern: **the epiphyte pattern** -- living on the surface of something larger without becoming dependent on its internal systems.

```
GSD PATTERN: Epiphyte Architecture

A licorice fern grows on a bigleaf maple. It does not:
  - Tap into the tree's water supply (not a parasite)
  - Require the tree to change its structure (not a symbiont)
  - Depend on any specific tree (it grows on many hosts)
  - Die when the tree's internal state changes (seasons, drought)

It does:
  - Use the tree's surface as a substrate
  - Capture resources that arrive at the surface (rain, fog, light)
  - Tolerate resource intermittency (dormancy in dry periods)
  - Persist through the host's lifecycle changes

SOFTWARE VERSION:
  - A browser extension lives on the browser without modifying it
  - A sidecar container runs alongside a main container without
    coupling to its internal APIs
  - A log aggregator reads stdout without touching the application
  - A CDN caches content without modifying the origin server

EPIPHYTE ARCHITECTURE RULES:
  1. Use the host's surface, not its internals
  2. Accept whatever resources arrive, store nothing permanently
  3. Tolerate the host going offline (graceful degradation)
  4. Be portable across hosts (the fern grows on any mossy tree)
  5. Your persistence should not depend on the host's persistence
     (the fern's rhizome outlives individual branches)

VANGUARD 1 AS EPIPHYTE:
  Vanguard 1 orbits Earth without connecting to any ground
  infrastructure (since 1964). It uses Earth's gravitational
  field (the "host") without modifying it. It captures sunlight
  (surface resource) without requiring Earth to provide it.
  It persists regardless of what happens on the surface below.
  It is the space equivalent of a fern on a tree — a small
  thing on a large thing, drawing from the environment,
  depending on nothing.

  The lesson: build systems that live ON your infrastructure,
  not IN it. Epiphytes survive infrastructure changes.
  Parasites die with their hosts.
```

---

*"Vanguard 1 is 16.5 centimeters in diameter — the size of a grapefruit. It weighs 1.47 kilograms — less than a bag of sugar. It has no cameras, no scientific instruments, no attitude control, no propulsion. It has six small solar cells, two tiny transmitters (both dead since 1964), and six temperature sensors. It was the fourth satellite launched by any nation, preceded by two Sputniks and Explorer 1. Its launch vehicle exploded twice before succeeding. Nikita Khrushchev mocked it. American newspapers mocked it. It was the runt of the Space Age litter. And it measured the shape of the Earth. By doing nothing except orbiting — drifting through the gravitational field like a marble on a tilted surface — Vanguard 1 revealed that Earth is pear-shaped, not quite symmetric about its equator, 15 meters wider in the southern hemisphere than the northern. This was discovered not by the satellite but by three people at the Army Map Service — John O'Keefe, Ann Eckels, and R.K. Squires — who watched the orbit for a year and noticed that the tracking residuals were not random. The satellite was arriving early in the north and late in the south. The pattern was the planet's shape, written in the trajectory of a grapefruit. Sixty-eight years later, the grapefruit is still up there. It will orbit for another 170 years, silent, unattended, circling a planet whose shape it was the first to correctly describe. On the branch of a bigleaf maple in Mukilteo, a licorice fern clings to the moss, drawing water from the fog, growing in winter, dormant in summer, persisting. The fern and the satellite share a strategy: be small, need little, last long. The grapefruit and the fern are both still here. The things that mocked them are not."*
