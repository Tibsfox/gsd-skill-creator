# Mission 1.12 -- Explorer 7: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Explorer 7 (October 13, 1959)
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Usnea longissima (Methuselah's beard lichen)
**Bird:** Cinclus mexicanus (American Dipper, degree 12)
**Dedication:** Rudolf Virchow (October 13, 1821)

---

## A. Simulations -- What to Build Locally

### A1. Python: Radiation Budget Calculator

**What it is:** A Python simulation that computes Earth's energy balance from first principles. The student adjusts solar irradiance, albedo, and greenhouse gas concentration and watches the equilibrium temperature respond. The calculator implements the one-layer atmosphere model (clear sky) and then extends to a two-layer model (with clouds), demonstrating how each component shifts the balance.

**Why it matters:** Explorer 7's scientific contribution was measuring both sides of the balance equation: energy in and energy out. This simulation lets the student explore the equation computationally, sweeping parameters and watching the temperature respond. The transition from balanced (T_eff = 255 K) to imbalanced (adding greenhouse gas absorption shifts T_surface upward) is continuous and quantitative -- the student sees exactly how many watts per square meter of retained heat produces how many degrees of warming.

**Specification:**

```python
# explorer7_radiation_budget.py
# Earth's radiation budget: the balance equation Explorer 7 measured
#
# Process:
#   1. Compute incoming solar radiation: S * pi * R^2 * (1-alpha)
#   2. Compute outgoing thermal radiation: sigma * T^4 * 4 * pi * R^2
#   3. Find equilibrium: iterate T until P_in = P_out
#   4. Add greenhouse effect: atmosphere absorbs fraction of outgoing IR,
#      re-emits upward and downward (one-layer model)
#   5. Compute new surface temperature with greenhouse trapping
#   6. Sweep albedo, CO2, and solar irradiance to show sensitivity
#
# Parameters (user-adjustable):
#   solar_irradiance: 1200-1500 W/m^2 (nominal 1361)
#   albedo: 0.0-0.8 (nominal 0.30)
#   greenhouse_opacity: 0.0-1.0 (fraction of surface IR absorbed
#     by atmosphere; nominal ~0.77 for Earth)
#   n_atmosphere_layers: 1-5 (radiative-convective column)
#
# Visualization:
#   - Plot 1: Temperature vs albedo (curves for different greenhouse)
#     Shows how ice-albedo feedback works: lower albedo -> warmer,
#     which melts ice, lowering albedo further (positive feedback)
#
#   - Plot 2: Temperature vs greenhouse opacity
#     Shows the greenhouse effect: opacity 0 = no atmosphere (255 K),
#     opacity 0.77 = Earth (288 K), opacity 1.0 = runaway (~330 K)
#
#   - Plot 3: Energy budget diagram (bar chart)
#     Incoming solar | Reflected | Absorbed | Surface emission |
#     Atmospheric absorption | Back-radiation | Outgoing longwave
#     All in W/m^2, stacked to show the flow
#
#   - Plot 4: Imbalance time series
#     Start at equilibrium, then increase greenhouse by 1% per step.
#     Plot the imbalance (P_in - P_out) and the temperature response.
#     The student sees that the imbalance appears FIRST, then the
#     temperature adjusts over time to restore balance. The planet
#     warms BECAUSE it is out of balance, and it stops warming WHEN
#     balance is restored at a higher temperature.
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The factor of 4. The student sees that dividing by 4 (disk area vs sphere area) reduces 1361 W/m^2 to 340 W/m^2. This geometric fact -- Earth intercepts as a circle but radiates as a sphere -- is the most important factor in the balance equation. The student discovers it by watching the code, not by memorizing it.
2. The greenhouse sweep. Moving the opacity slider from 0 to 0.77 warms the surface from 255 K to 288 K -- a 33 K greenhouse effect. The student sees that without the atmosphere, Earth would be frozen. The greenhouse effect is not a pollution problem. It is a survival condition. The problem is the CHANGE in greenhouse effect, not its existence.
3. The imbalance lag. In Plot 4, the student sees that increasing greenhouse gas creates an immediate imbalance (P_in > P_out) that takes many steps to resolve through warming. The planet is always chasing equilibrium. Explorer 7 measured the balance at a moment when it was nearly in equilibrium. Today, the balance is detectably shifted.

---

### A2. Python: Explorer 7 Orbit with Bolometer Readings

**What it is:** A simulation that propagates Explorer 7's orbit (573 x 1,073 km, 50.3-degree inclination) and computes the bolometer temperatures at each point along the orbit. When the satellite is in sunlight, the black bolometer is warmer than the white (solar + thermal). When the satellite enters eclipse, both bolometers cool toward the thermal-only equilibrium. The student watches the bolometer readings change as the satellite passes over ocean, desert, cloud, and polar ice -- each surface type producing a different radiation signature.

**Specification:**

```python
# explorer7_orbit_bolometers.py
# Orbital mechanics + bolometer physics: what Explorer 7 actually measured
#
# Process:
#   1. Propagate a Keplerian orbit: 573 x 1073 km, i=50.3 deg
#   2. At each timestep (10 seconds), compute:
#      a. Sub-satellite point (lat, lon)
#      b. Solar illumination (sunlit or eclipse)
#      c. Surface type below (ocean, land, cloud, ice) from a
#         simplified map (latitudinal bands)
#      d. Albedo of the surface type
#      e. Thermal emission from the surface type (T_surface -> sigma*T^4)
#      f. Black bolometer temperature (from total absorbed flux)
#      g. White bolometer temperature (from spectral-weighted flux)
#   3. Compute F_solar and F_thermal from the two temperatures
#      using the 2x2 linear system (Suomi's method)
#   4. Accumulate orbit-average values for one day (14.2 orbits)
#
# Parameters:
#   orbit: semi-major axis, eccentricity, inclination
#   surface_model: latitude-band albedo and temperature
#     (-90 to -60: ice, albedo 0.80, T=230 K)
#     (-60 to -30: ocean, albedo 0.06, T=280 K)
#     (-30 to 30: tropical, albedo 0.10, T=300 K)
#     (30 to 60: land/ocean mix, albedo 0.15, T=275 K)
#     (60 to 90: ice, albedo 0.80, T=240 K)
#   cloud_fraction: 0-1 (adds cloud albedo ~0.65 to fraction of surface)
#
# Visualization:
#   - Plot 1: Ground track (Mercator) showing orbit path for 1 day
#     Color-coded by T_black - T_white (warm colors = high solar,
#     cool colors = low solar / eclipse)
#
#   - Plot 2: Bolometer temperatures vs time (2 orbital periods)
#     T_black (red line) and T_white (blue line) vs time
#     Eclipse regions shaded grey (both temperatures drop)
#     Cloud passages marked (albedo changes visible)
#
#   - Plot 3: Derived fluxes vs time
#     F_solar (yellow) and F_thermal (red) from the 2x2 solution
#     Clear sky vs cloudy regions visible as F_solar variations
#
#   - Plot 4: Orbit-averaged energy budget
#     Bar chart: mean F_solar and F_thermal over one day
#     Compare to modern CERES values
#
# Libraries: numpy, matplotlib, scipy
# Difficulty: Intermediate
# Duration: 4-6 hours
```

**Key learning moments:**
1. The eclipse transition. The student watches both bolometer temperatures drop sharply when the satellite enters Earth's shadow. The black bolometer drops more than the white (it was absorbing more solar radiation). In eclipse, both temperatures converge -- confirming that the thermal emission from below is the only remaining source. This is Suomi's in-flight calibration check.
2. Surface type signatures. Over ice (high albedo), the solar flux is high (lots of reflected sunlight reaching the bolometer from below) but the thermal flux is low (cold surface). Over tropical ocean (low albedo), the solar flux is lower (less reflected sunlight) but the thermal flux is high (warm surface). The student sees that the bolometer pair can distinguish surface types by their radiation signatures.
3. The sampling problem. After one orbit, the satellite has seen a thin strip of the planet. After one day (14 orbits), it has seen more but with gaps. The student discovers that weeks of data are needed to build a global picture -- the same constraint Suomi faced.

---

### A3. Web: Interactive Earth Energy Balance Diagram

**What it is:** An interactive Sankey-style flow diagram showing Earth's global energy balance. The user adjusts parameters (albedo, greenhouse opacity, cloud fraction) with sliders and watches the energy flows rearrange in real time. Flows are represented as streams whose width is proportional to energy (W/m^2). The diagram makes the invisible energy flows visible and tangible.

**Specification:**

```
WEB APPLICATION: Earth Energy Balance (Sankey Diagram)
=====================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Layout (landscape):
  LEFT: Sun icon with outgoing arrow
    Width proportional to 341 W/m^2 (global mean)

  CENTER: Three-layer vertical structure
    TOP: "Top of Atmosphere" line
    MIDDLE: "Atmosphere" band (semi-transparent blue)
    BOTTOM: "Surface" band (green/brown)

  Flows (animated streams, width proportional to W/m^2):
    Incoming solar: wide yellow stream from left
      -> Reflected by clouds: upward blue-white stream
      -> Reflected by surface: upward light stream
      -> Absorbed by atmosphere: absorbed into atmosphere band
      -> Absorbed by surface: reaches bottom band

    Surface emission: wide red stream upward from surface
      -> Through window: thin red stream escaping to space
      -> Absorbed by atmosphere: wide stream into atmos band

    Atmospheric emission:
      -> Back-radiation: orange stream downward to surface
      -> Outgoing longwave: dark red stream upward to space

  RIGHT: Space (black), receiving reflected + outgoing streams
    Total outgoing annotated

  IMBALANCE indicator: if P_in != P_out, a glowing bar at top
    shows the imbalance in W/m^2 (green = balanced, red = excess)

Controls (bottom panel):
  - "ALBEDO" slider: 0.10-0.60 (default 0.30)
  - "GREENHOUSE OPACITY" slider: 0.00-1.00 (default 0.77)
  - "CLOUD FRACTION" slider: 0.00-1.00 (default 0.67)
  - "SOLAR IRRADIANCE" slider: 1200-1500 (default 1361)
  - "RESET TO EARTH" button: restores default values
  - "MARS" button: sets Mars values (albedo 0.25, opacity 0.02)
  - "VENUS" button: sets Venus values (albedo 0.77, opacity 0.99)
  - "EXPLORER 7 ERA" button: sets 1959 values (pre-warming)

Info panel:
  - All flow values in W/m^2 (updated in real time)
  - Surface temperature (computed from balance)
  - Effective radiating temperature
  - Energy imbalance (P_in - P_out)

Deliverables:
  - Single HTML file, self-contained
  - < 800 lines total
  - 60 fps rendering
  - Smooth flow animations (streams flow visually)
```

**Key learning moment:** The Mars and Venus presets. Clicking "MARS" collapses the greenhouse streams to nearly zero -- Mars has almost no atmosphere, its surface temperature is close to the bare-rock equilibrium temperature (210 K). Clicking "VENUS" fills the screen with greenhouse streams -- Venus's atmosphere is nearly opaque to thermal radiation, trapping energy and producing a surface temperature of 735 K despite being farther from the Sun than Mercury. Earth sits between these extremes, and the student can slide the greenhouse opacity between them to see the transition. The lesson: a few percentage points of atmospheric opacity change the surface temperature by hundreds of degrees. Earth's current greenhouse perturbation (a fraction of a percent change in opacity) is small but consequential.

---

### A4. Web: Bolometer Simulator

**What it is:** An interactive simulation of a single bolometer plate. The user controls the radiation environment (lamp intensity, thermal source temperature, plate color) and watches the plate temperature respond in real time. The simulation shows the energy balance of the plate itself: absorbed radiation in, emitted radiation out, and the equilibrium temperature where they balance. This is the Stefan-Boltzmann law made tangible.

**Specification:**

```
WEB APPLICATION: Bolometer Thermal Response Simulator
=====================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1280x720

Main view:
  CENTER: A flat plate (rectangular, rendered in 3D perspective)
    Color: changes with temperature (blue-cold -> red-hot)
    Surface coating: visual indication (matte black or white)

  LEFT: Incoming radiation arrows
    Yellow arrows from above: solar/lamp radiation
    Red arrows from below: thermal radiation from "Earth"
    Arrow density proportional to flux intensity

  RIGHT: Outgoing radiation arrows
    Dark red arrows from plate surface: thermal emission (T^4)
    Arrow density increases as plate warms

  BELOW: Real-time energy budget bar
    Blue bar: absorbed power (P_in)
    Red bar: emitted power (P_out)
    When bars are equal: "EQUILIBRIUM" label (green)
    When unequal: "WARMING" or "COOLING" label (red/blue)

Controls:
  - "SOLAR FLUX" slider: 0-1500 W/m^2
  - "THERMAL FLUX" slider: 0-400 W/m^2
  - "PLATE COLOR" toggle: BLACK / WHITE
  - "PLATE MASS" slider: 1-100 g (affects response time)
  - "TIME SPEED" slider: 1x-100x

Temperature display:
  - Large digital readout: current plate temperature (K and C)
  - Graph: temperature vs time (shows approach to equilibrium)
  - Analytical equilibrium temperature (from Stefan-Boltzmann)

Deliverables:
  - Single HTML file, self-contained
  - < 500 lines
  - Smooth temperature transitions (exponential approach)
```

**Key learning moment:** Switching between BLACK and WHITE plates at the same radiation environment. The black plate reaches a higher equilibrium temperature (it absorbs more) but the difference depends on the mix of solar and thermal radiation. In a thermal-only environment (solar flux = 0), both plates reach nearly the same temperature. The student discovers the spectral selectivity that makes Suomi's two-bolometer technique work: the difference between the plates is the solar component. No difference means no sunlight. Large difference means strong sunlight.

---

## B. Machine Learning -- What to Train

### B1. Radiation Budget Prediction from Cloud Cover

**What it is:** Train a regression model to predict Earth's outgoing radiation (both shortwave reflected and longwave emitted) from cloud cover observations. The training data uses simplified satellite-derived cloud fraction maps paired with CERES radiation budget measurements. The student learns that clouds are the dominant variable in the radiation budget -- they simultaneously reflect sunlight (cooling) and trap thermal radiation (warming), and the net effect depends on cloud altitude, thickness, and type.

```
Model: Multivariate regression (two outputs: shortwave reflected, longwave emitted)

Input features:
  - Cloud fraction (0-1) at each grid point
  - Cloud top temperature (K) — proxy for altitude
  - Surface temperature (K)
  - Solar zenith angle (determines available sunlight)
  - Surface type (ocean/land/ice, one-hot encoded)
  - Total: 6 features per grid point

Output: [reflected_shortwave (W/m^2), outgoing_longwave (W/m^2)]

Training data: Simplified CERES-like dataset (synthetic, based on published
  parameterizations). 50,000 samples, each representing a 100 km grid cell.

Architecture: Start with linear regression (baseline, interpretable),
  then gradient-boosted trees (nonlinear, feature importance),
  then small neural network (comparison).

The student learns:
  - Cloud fraction is the strongest predictor of reflected shortwave
    (more clouds = more reflection). The relationship is nearly linear.
  - Cloud top temperature predicts outgoing longwave: high clouds
    (cold tops) trap more thermal radiation than low clouds (warm tops).
  - The NET cloud radiative effect (reflected minus trapped) depends
    on cloud altitude: low clouds cool (reflect > trap), high clouds
    warm (trap > reflect). This is the fundamental cloud-climate
    feedback that drives uncertainty in climate sensitivity.
  - The model achieves approximately 85% variance explained with
    linear regression and 93% with gradient-boosted trees. The
    improvement comes from cloud-surface interactions that linear
    models cannot capture.

Libraries: scikit-learn, numpy, matplotlib
GPU: Not required
Difficulty: Intermediate
```

---

## C. Computer Science -- Two-Equation System Solving

### C1. Matrix Inversion and Condition Number

The Suomi bolometer pair creates a 2x2 linear system Ax = b. Solving this system is the computational core of Explorer 7's data processing. The computer science extends to condition number analysis, error propagation, and the design of well-conditioned measurement systems.

```
ALGORITHM: Solving the Bolometer System

The system:
  | alpha_b   alpha_b   | | F_solar   |   | P_black |
  | alpha_w_s alpha_w_t | | F_thermal | = | P_white |

Direct solution (Cramer's rule for 2x2):
  det(A) = alpha_b * alpha_w_t - alpha_b * alpha_w_s
  F_solar = (P_black * alpha_w_t - P_white * alpha_b) / det(A)
  F_thermal = (P_white * alpha_b - P_black * alpha_w_s) / det(A)

Condition number:
  kappa(A) = ||A|| * ||A^(-1)||
  For the Suomi bolometer:
    A = [[0.95, 0.95], [0.15, 0.90]]
    kappa_2(A) ~ 2.5

  This means a 1% error in the measurement vector b produces
  at most a 2.5% error in the solution vector x.

  EXERCISE: Compute the condition number for different paint
  choices:
    White paint alpha_w_s = 0.15 (Suomi's choice): kappa ~ 2.5
    Grey paint alpha_w_s = 0.50 (poor choice): kappa ~ 5.8
    Near-black alpha_w_s = 0.85 (terrible choice): kappa ~ 42
      (10% measurement error -> 420% solution error — useless)

  Suomi's paint selection minimized the condition number.
  The mathematics of the condition number guided the
  engineering of the paint. This is the deep connection
  between linear algebra and instrument design.

IMPLEMENTATION (Python):

  import numpy as np

  def solve_bolometer(P_black, P_white,
                      alpha_b=0.95,
                      alpha_w_solar=0.15,
                      alpha_w_thermal=0.90):
      """Solve the Suomi bolometer 2x2 system."""
      A = np.array([[alpha_b, alpha_b],
                     [alpha_w_solar, alpha_w_thermal]])
      b = np.array([P_black, P_white])

      # Condition number check
      kappa = np.linalg.cond(A)
      print(f"Condition number: {kappa:.2f}")

      # Solve
      x = np.linalg.solve(A, b)
      F_solar, F_thermal = x

      return F_solar, F_thermal, kappa

  # Example: typical Explorer 7 reading (sunlit, over ocean)
  F_s, F_t, k = solve_bolometer(280, 220)
  print(f"F_solar = {F_s:.1f} W/m^2")
  print(f"F_thermal = {F_t:.1f} W/m^2")

EXTENSION: Error propagation
  Add Gaussian noise to P_black and P_white (simulating
  thermistor noise). Run 10,000 trials. Plot the distribution
  of F_solar and F_thermal. The spread of the distributions
  is proportional to the condition number times the input noise.
  The student sees the condition number in action: it converts
  measurement noise into solution uncertainty.
```

---

## D. Game Theory -- Climate Negotiation

### D1. The Energy Imbalance Negotiation Game

The energy imbalance that Explorer 7 first measured is now approximately 1.0-1.4 W/m^2. Correcting it requires reducing greenhouse gas emissions globally. But emission reduction is costly, and the benefits are shared while the costs are local. This is a classic collective action problem -- the tragedy of the commons applied to the atmosphere.

```
GAME: WHO PAYS FOR THE IMBALANCE?

Players: 4 nations (simplified)
  - INDUSTRIAL: high emissions, high GDP, historical responsibility
  - EMERGING: rapidly growing emissions, medium GDP
  - DEVELOPING: low emissions, low GDP, most vulnerable to warming
  - ISLAND: negligible emissions, low GDP, existential threat from
    sea level rise

Each player chooses an emission reduction level: 0%, 25%, 50%, 75%

Costs: Reduction costs are proportional to GDP and reduction level
  INDUSTRIAL reducing 50%: cost = 2% of GDP (high cost, affordable)
  EMERGING reducing 50%: cost = 4% of GDP (high cost, painful)
  DEVELOPING reducing 50%: cost = 6% of GDP (devastating)
  ISLAND reducing 50%: cost = 1% of GDP (low absolute cost, but also
    low total emissions — their reduction barely affects the global sum)

Benefits: Total warming reduction depends on TOTAL global emission
  reduction (sum of all players' reductions, weighted by their
  current emissions). Benefits are shared equally as reduced
  warming, reduced sea level rise, reduced extreme weather.

              | All reduce 50% | Only INDUSTRIAL | No one reduces
-----------  |----------------|-----------------|----------------
INDUSTRIAL   | -2% GDP, +3%   | -2% GDP, +1%    | 0%, -2% future
EMERGING     | -4% GDP, +3%   | 0%, +1%         | 0%, -4% future
DEVELOPING   | -6% GDP, +3%   | 0%, +1%         | 0%, -8% future
ISLAND       | -1% GDP, +10%  | 0%, +1%         | 0%, EXISTENTIAL

The Nash equilibrium: each player minimizes their own cost by
  NOT reducing (free-riding on others' reductions). But if
  everyone free-rides, no one reduces, and everyone loses.

The Pareto optimal outcome: coordinated global reduction where
  each player's cost is offset by the collective benefit of
  avoided warming. This requires enforcement or trust.

EXERCISE:
  1. Play the game with 4 people. Each secretly chooses a
     reduction level. Reveal simultaneously. Compute outcomes.
  2. Play again with communication allowed (negotiation round).
     Does the outcome change?
  3. Play again with binding commitments (a "climate treaty").
     Does the outcome change further?
  4. What role does MEASUREMENT play? Without Explorer 7 and
     its descendants (CERES), the imbalance would be unquantified.
     Without quantification, the game has no defined payoffs.
     The measurement makes the game playable — and solvable.

VIRCHOW CONNECTION:
  Virchow's insight was that disease is social before it is
  biological. The climate imbalance is social before it is
  physical: the imbalance exists because of collective human
  choices about energy use. The negotiation game shows that
  the solution is also social — it requires collective action,
  trust, and enforcement. Suomi provided the diagnosis.
  The negotiation provides the treatment plan.
```

---

## E. Creative Arts -- What to Create

### E1. "Earth's Fever" -- Thermal Visualization

**What it is:** A visual art piece depicting Earth as a thermal object. Half the image shows Earth in visible light (blue ocean, white clouds, green land). The other half shows the same scene in thermal infrared (warm surfaces glow orange-red, cold clouds appear blue-black, the outgoing radiation visible as luminous streams leaving the atmosphere into space). The boundary between the two halves runs along the terminator line (the day-night boundary). The visible half is the Earth we see. The thermal half is the Earth Suomi measured.

```
ART PIECE: "Earth's Fever"
=========================

Composition (16:9 widescreen or 24x36 print):

  Split image: Earth viewed from orbit

  LEFT HALF (dayside, visible light):
    Blue Pacific Ocean, white cloud bands, green-brown continents
    Bright, colorful, familiar — the "Blue Marble" view
    Sunlight illuminating from upper left

  RIGHT HALF (nightside, thermal infrared):
    The same geographic features rendered in thermal palette:
    - Warm tropical ocean: deep orange glow
    - Cool polar regions: dark blue, almost black
    - Clouds: cold tops visible as dark blue-purple shapes
      BELOW which warmer surface glows through gaps
    - Outgoing radiation: luminous streams rising from the
      atmosphere into space, like heat shimmer made visible
    - The greenhouse effect visible: the atmosphere glows
      between the surface and space, trapping and re-emitting

  THE TERMINATOR (center boundary):
    The day-night line where visible transitions to thermal
    Not a sharp edge but a gradient: twilight zone where
    both views merge. The bolometers see both simultaneously.
    The terminator is where the measurement is hardest —
    mixed solar and thermal, changing rapidly.

  OVERLAY (subtle, transparent):
    Explorer 7's orbit track as a thin white dashed line
    crossing the image diagonally (50.3 deg inclination)
    Small dot marking the satellite position
    Two small circles at the dot: black and white bolometers

  TEXT (lower margin):
    "What we see (left) is not what we measure (right).
     Explorer 7 measured the right side."

  Color palette:
    Visible half: NASA Blue Marble palette (photographic)
    Thermal half: Scientific thermal palette (magma or inferno)
    Background: black (space)
```

### E2. Pendant Lichen Art -- "Methuselah's Thread"

**What it is:** A mixed-media art piece showing Usnea longissima draped from an old-growth branch, with the lichen strands rendered as data streams. Each strand is a time series: lichen growth rate on one axis, nitrogen deposition on the other. The healthy strands (pre-industrial) are long and luminous. The declining strands (modern, near urban areas) are shorter, fragmenting, fading. The piece visualizes the lichen as a biological recording medium -- a living chart whose length encodes decades of atmospheric data.

```
ART PIECE: "Methuselah's Thread"
================================

Composition (vertical, 18x24 or 24x36):

  TOP: A single Douglas-fir branch, rendered realistically
  (bark texture, needle clusters, thick and gnarled)

  HANGING FROM THE BRANCH: Usnea longissima strands
  But the strands are dual-coded:
    - Physical form: pale green-grey lichen, photorealistic
    - Data overlay: each strand has a thin colored line
      running through it, like a vein:
        Green = healthy growth rate (>3 cm/yr)
        Yellow = stressed (1-3 cm/yr)
        Orange = declining (<1 cm/yr)
        Red = absent (strand ends, fragmented)

  LEFT STRANDS (labeled "1960"): Long (3-4 meters), green veins
    throughout. Full, healthy, luminous. The forest before
    nitrogen deposition increased.

  CENTER STRANDS (labeled "1990"): Medium length (1-2 meters),
    yellow-green veins. Some thinning visible. The transition.

  RIGHT STRANDS (labeled "2025"): Short (30-50 cm), orange-red
    veins. Fragmenting. Some strands end in mid-air — broken
    off, no longer growing. The modern decline.

  BACKGROUND: Gradient from deep forest green (left, 1960)
    to grey-brown (right, 2025), suggesting the forest itself
    is changing. Not deforestation — the trees are still there —
    but atmospheric change visible in the lichen's decline.

  BOTTOM TEXT:
    "Usnea longissima: 2-5 cm per year. A 4-meter strand is
     a century of clean air, measured in lichen."

  VIRCHOW ANNOTATION (small, in margin):
    "The lichen is the patient. The atmosphere is the diagnosis.
     The remedy is the same one Virchow prescribed: change the
     conditions that cause the disease."
```

---

## F. Problem Solving -- Detecting 1 W/m^2 Imbalance from Space

### F1. The Signal-in-Noise Problem

Earth's energy imbalance is approximately 1 W/m^2. The incoming solar flux is approximately 341 W/m^2. The imbalance is 0.3% of the total flux. Detecting a 0.3% signal requires instrument stability better than 0.3% over the measurement period. This is one of the most challenging measurement problems in Earth science.

```
THE DETECTION PROBLEM:

GIVEN:
  Signal: energy imbalance ~ 1.0 W/m^2
  Background: incoming solar ~ 341 W/m^2
  Signal-to-background ratio: 0.003 (0.3%)

  This is like measuring a 1 gram change on a 300 gram
  kitchen scale — you need a scale accurate to better
  than 1 gram, and STABLE to better than 1 gram over
  the measurement period (years).

THE CHALLENGE:
  1. Absolute accuracy: The instrument must know that
     "240 W/m^2" really means 240, not 241 or 239.
     Absolute calibration to 1 W/m^2 requires knowing
     the calibration target to 0.4%.

  2. Stability: The instrument must not drift by more
     than 0.3 W/m^2 per decade. If the calibration
     changes by 1 W/m^2 over 10 years, the drift is
     indistinguishable from the signal.

  3. Sampling: The imbalance varies geographically and
     temporally. The global mean must be computed from
     spatially and temporally sparse satellite observations.
     Sampling errors must be smaller than the signal.

SUOMI'S INSTRUMENTS (Explorer 7, 1959):
  Accuracy: ~5-10 W/m^2
  Stability: unknown (paint degradation over 2 years)
  Sampling: one satellite, 50-degree inclination, ~14 orbits/day
  RESULT: Could measure the total budget (~240 W/m^2)
          but NOT the imbalance (~1 W/m^2)

MODERN INSTRUMENTS (CERES, 2000-present):
  Accuracy: ~1 W/m^2 absolute
  Stability: ~0.3 W/m^2/decade
  Sampling: multiple satellites, near-global coverage
  RESULT: Can detect the imbalance and its trend

THE IMPROVEMENT: 60 years, factor of 10-30 in every metric.

EXERCISE:
  1. If you want to detect a 1 W/m^2 imbalance with 95%
     confidence, and your instrument has noise of sigma W/m^2
     per measurement, how many independent measurements do
     you need?
     N = (2 * sigma / 1.0)^2 (simplified, for Gaussian noise)
     At sigma = 5 (Explorer 7): N = 100 measurements
     At sigma = 1 (CERES): N = 4 measurements
     But each "measurement" must be a global average — computed
     from many individual readings. The sampling problem
     dominates the noise problem.

  2. Design an improved bolometer. What properties would
     you change? (Hint: spectral selectivity, field of view,
     calibration source, thermal isolation from spacecraft,
     redundancy for drift detection.)

  3. Why did Suomi fly an instrument he knew could not
     detect the imbalance? Because proving the CONCEPT was
     more valuable than achieving the PRECISION. The
     concept — measure both sides from orbit — was new.
     The precision would come from better instruments on
     later missions. You cannot improve what you have
     not attempted.
```

---

## G. GSD Integration -- The Balance Pattern, Long-Term Monitoring Discipline

### G1. The GSD Monitoring Protocol

Explorer 7 established a new pattern in space science: long-term monitoring of a planetary process, rather than one-time discovery. The radiation balance does not need to be discovered -- it needs to be measured, continuously, for decades. This is the monitoring pattern, and it maps directly to GSD's concept of ongoing state tracking.

```
GSD MONITORING PROTOCOL (Explorer 7 as case study):

1. ESTABLISH BASELINE: Measure the system in its current state.
   Explorer 7 established the first orbital baseline for Earth's
   radiation budget (~240 W/m^2 in, ~240 W/m^2 out).
   GSD equivalent: STATE.md captures the project's current state.
   Before you can detect change, you must know where you started.

2. DEFINE THE SIGNAL: What change are you watching for?
   Explorer 7 / CERES: energy imbalance (P_in - P_out > 0).
   GSD equivalent: phase completion, test pass rate, technical
   debt accumulation. The signal must be defined before you
   can detect it.

3. MEASURE CONTINUOUSLY: The signal is small relative to the
   background. A single measurement is noisy. Many measurements
   over time reveal the trend.
   Explorer 7: two years of data, noisy but continuous.
   GSD equivalent: git log, commit frequency, test results over
   time. The history is the data.

4. DETECT TRENDS: The imbalance is not a step change. It is
   a gradual drift. Detecting a drift requires sufficient
   measurement duration and stability.
   Explorer 7: could not detect the trend (too noisy).
   CERES: detected the trend after 20 years.
   GSD equivalent: code complexity creep, technical debt growth,
   performance degradation. These are drifts, not crashes.
   They require long-term monitoring to detect.

5. ACT ON THE TREND: Once the imbalance is measured and the
   trend confirmed, action is required.
   Climate: reduce emissions, adapt to warming.
   GSD: refactor, pay down technical debt, re-architect.

THE BALANCE PATTERN:
  Every healthy system is in balance.
  Energy in = energy out (planetary climate).
  Features added = features maintained (software project).
  Complexity added = complexity managed (architecture).
  Work assigned = work completed (project management).

  When the balance shifts — when inputs exceed outputs —
  the system accumulates the excess. For the planet, the
  excess is heat (stored in the ocean). For a software
  project, the excess is technical debt (stored in the
  codebase). For a team, the excess is burnout (stored
  in the people).

  Explorer 7 taught the discipline of measuring the balance
  continuously, precisely, and honestly. GSD applies the
  same discipline to projects: measure state, detect drift,
  act before the imbalance becomes a crisis.

EXPLORER 7 IN GSD TERMS:
  Phase: "Establish first orbital measurement of Earth's
         radiation budget"
  Execution: SUCCEEDED — bolometers operated for 2 years
  Deliverable: first space-based evidence that the budget
    could be measured, calibrated, and decomposed from orbit
  Follow-on: Nimbus, ERBE, CERES — each phase improving
    precision, extending coverage, extending the time series
  State update: "Baseline established. Precision insufficient
    for imbalance detection. Next phase: improve instruments."
  The mission was a successful Phase 1 in a 60-year program.
```

---

*"Rudolf Virchow autopsied more than 3,000 bodies during his career. Each autopsy was a measurement -- a systematic accounting of what had gone wrong in a system that had been in balance and was now irreversibly out of it. The cause of death was always an imbalance: too many bacteria, too few white cells; too much blood lost, too little oxygen reaching the brain; a tumor growing faster than the immune system could contain it. Virchow's genius was to trace each imbalance backward to its origin -- not just the proximate cause (the infection, the hemorrhage, the tumor) but the distal cause (the poverty, the malnutrition, the industrial pollution that created the conditions for disease). Suomi's genius was the same, applied to a different patient. Earth's temperature is the fever. The energy imbalance is the infection. The greenhouse gas excess is the bacterium. The fossil fuel economy is the poverty that breeds the bacterium. Suomi built the thermometer (the bolometer). Virchow built the diagnostic framework (cellular pathology). Both understood that you measure first, then you diagnose, then you treat -- and that treatment without measurement is superstition, and measurement without treatment is negligence. Explorer 7 measured Earth's fever for the first time. The American Dipper, Cinclus mexicanus, plunges into a mountain stream and resurfaces with an insect larva in its beak -- a small thermal machine balancing its energy budget against the cold water, dive by dive, insect by insect, day by day. The lichen hangs from the branch above the stream, growing two centimeters per year, recording in its length the atmospheric composition of the decades through which it grew. The bolometer orbits above them both, a painted plate measuring the planet's balance at the speed of light. Three sensors. Three scales. One equation. The balance is what matters. Suomi knew it. Virchow knew it. The dipper lives it. The lichen records it. Explorer 7 measured it. The question now is the same one Virchow asked in Upper Silesia in 1848: you have the measurement, you have the diagnosis, what are you going to do about it?"*
