# Mission 1.14 -- Echo 1: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Echo 1 (August 12, 1960)
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Physalia physalis (Portuguese man o' war)
**Bird:** Pandion haliaetus (Osprey, degree 14)
**Dedication:** Erwin Schrodinger (August 12, 1887)

---

## A. Simulations -- What to Build Locally

### A1. Python: Bistatic Radar Equation for Passive Relay

**What it is:** A Python simulation that computes the complete bistatic link budget for Echo 1 as a function of geometry -- the distances from transmitter to balloon and from balloon to receiver. The student adjusts transmitter power, antenna gains, balloon diameter, and frequency, and watches the received signal power respond. The simulation traces a typical Echo 1 pass from horizon to overhead to horizon, showing how the received signal strength rises and falls as the geometry changes.

**Why it matters:** Echo 1's link budget is the radar equation applied to satellite communications -- a framework that every radar engineer, satellite designer, and defense analyst still uses. The simulation makes the 1/(R_t^2 * R_r^2) factor tangible: the student sees that doubling the balloon's altitude quadruples both R_t and R_r, reducing the received power by a factor of 256 (24 dB). The student also sees the passive-versus-active comparison: adding a 2-watt transponder to the balloon (making it active, like Telstar) improves the received power by approximately 100 dB. The radar equation makes the case for active satellites irrefutable.

**Specification:**

```python
# echo1_bistatic_radar.py
# Bistatic radar equation: how Echo 1 relayed signals across the continent
#
# Process:
#   1. Define Echo 1's balloon parameters (diameter, RCS, altitude)
#   2. Define ground station parameters (Holmdel TX, Goldstone RX)
#   3. Compute slant ranges R_t and R_r for each elevation angle
#   4. Compute received power: P_rx = (P_t * G_t * sigma * G_r * lambda^2)
#                                      / ((4*pi)^3 * R_t^2 * R_r^2)
#   5. Compute noise floor: P_noise = k * T_sys * B
#   6. Compute SNR and determine link quality
#   7. Compare passive (Echo 1) to active (Telstar 1)
#
# Parameters (user-adjustable):
#   P_t_W: 100-50000 (nominal 10000, Bell Labs transmitter)
#   D_balloon_m: 5-100 (nominal 30.48, Echo 1 diameter)
#   f_MHz: 500-10000 (nominal 2390, S-band)
#   h_orbit_km: 500-5000 (nominal 1600, Echo 1 average)
#   D_tx_m: 5-50 (nominal 26, Holmdel horn-reflector)
#   D_rx_m: 5-100 (nominal 26, Goldstone dish)
#   T_sys_K: 5-500 (nominal 40, maser receiver)
#   B_Hz: 100-100000 (nominal 4000, voice bandwidth)
#
# Visualization:
#   - Plot 1: Received power vs elevation angle during a pass
#     X-axis: elevation angle from -10 to +90 degrees
#     Y-axis: P_rx in dBW
#     Shows the rise-peak-fall profile as the balloon crosses the sky
#     Horizontal line at noise floor (k*T_sys*B)
#     Shaded region where SNR > 10 dB = usable communication window
#
#   - Plot 2: Passive vs Active comparison (bar chart)
#     Left bars: Echo 1 passive link budget at overhead geometry
#       P_t (dBW) + G_t (dBi) - FSPL_up - FSPL_down + sigma(dBsm)
#       + G_r (dBi) + lambda^2 corrections
#     Right bars: Telstar 1 active link budget
#       Uplink received by satellite -> amplified -> downlink
#     Visual shows the ~100 dB advantage of active relay
#
#   - Plot 3: Received power vs balloon diameter
#     X-axis: balloon diameter (5-100 m)
#     Y-axis: P_rx in dBW
#     Shows that sigma ~ D^2, so P_rx ~ D^2
#     Doubling the balloon quadruples the received power (6 dB)
#     Mark Echo 1 (30.5 m) and a hypothetical 100-m balloon
#
#   - Plot 4: Signal strength timeline for a real pass
#     X-axis: time (0-20 minutes)
#     Y-axis: P_rx and SNR
#     Simulates a typical Echo 1 pass with realistic orbit parameters
#     Shows the 10-15 minute usable communication window
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The double inverse-square penalty. In Plot 1, the student sees that the received power varies dramatically during a single pass: strongest at overhead (minimum R_t and R_r), weakest near the horizon (maximum R_t and R_r). The variation is approximately 20-30 dB from horizon to zenith -- the signal is 100 to 1,000 times stronger at overhead than near the horizon. This is the bistatic geometry in action.
2. The active advantage. In Plot 2, the student sees that replacing the passive balloon with a 2-watt active transponder improves the link by approximately 100 dB. This is the single most important number in the history of satellite communications: 100 dB is a factor of 10 billion. This gap is why Echo 1 was never repeated -- active transponders were simply too much better.
3. The cross-section scaling. In Plot 3, the student discovers that making the balloon bigger helps, but not enough: doubling the diameter quadruples the cross-section (+6 dB), but the same 6 dB improvement could be achieved by increasing the transmitter power by a factor of 4. Building a 100-meter balloon to gain 10 dB is not practical when a 2-watt amplifier gains 100 dB.

---

### A2. Python: Echo 1 Orbit with Solar Radiation Pressure Perturbation

**What it is:** A simulation that propagates Echo 1's orbit around Earth, including the perturbation from solar radiation pressure. The student watches the orbit evolve over weeks and months as the persistent force from sunlight slowly changes the eccentricity and lowers the altitude. The simulation shows why Echo 1's extraordinary area-to-mass ratio made it uniquely sensitive to this effect.

**Why it matters:** Echo 1 was the first spacecraft where solar radiation pressure was a measurable orbital perturbation. The simulation lets the student see a force that is normally negligible -- the momentum of light -- accumulate over thousands of orbits into a significant trajectory change. The student discovers that the same Mylar skin that made Echo 1 a good reflector also made it a good solar sail, and that the balloon's wrinkling (modeled as a decrease in reflectivity) changed the radiation force over time.

**Specification:**

```python
# echo1_orbit_solar_pressure.py
# Orbital propagation with solar radiation pressure perturbation
#
# Process:
#   1. Define Echo 1's initial orbital elements:
#      a = 7,974 km (from center of Earth), e = 0.011,
#      i = 47.2 deg, perigee = 1,519 km, apogee = 1,687 km
#   2. Compute solar radiation pressure force:
#      F = (2 * S * R / c) * A_cross * cos(theta_sun)
#      where S = 1361 W/m^2, R = reflectivity, A_cross = 730 m^2,
#      theta_sun = angle between Sun direction and orbit normal
#   3. Integrate equations of motion with radiation pressure as
#      perturbation (Cowell's method, RK4 integration)
#   4. Track orbital elements over time (eccentricity, perigee,
#      apogee, mean altitude)
#   5. Compare to orbit without radiation pressure
#
# Parameters (user-adjustable):
#   reflectivity: 0.0-1.0 (nominal 0.92, degrades over time)
#   area_to_mass: 1-15 m^2/kg (nominal 9.6 for Echo 1)
#   simulation_days: 10-365
#   include_drag: boolean (add simple atmospheric drag model)
#
# Visualization:
#   - Plot 1: Orbit in Earth-centered frame
#     Earth (blue circle) at center
#     Current orbit (red ellipse)
#     Sun direction (yellow arrow)
#     Force vector on balloon (small arrow, exaggerated for visibility)
#
#   - Plot 2: Perigee and apogee altitude vs time
#     X-axis: days (0-365)
#     Y-axis: altitude (km)
#     Two curves: perigee (lower) and apogee (upper)
#     Shows the oscillation in eccentricity from radiation pressure
#     and the gradual decay from atmospheric drag
#
#   - Plot 3: A/m comparison
#     Multiple curves for different area-to-mass ratios:
#       Echo 1 (9.6 m^2/kg), conventional satellite (0.01),
#       solar sail (1.0), future drag sail (0.1)
#     Shows how sensitivity to radiation pressure scales with A/m
#
#   - Plot 4: Reflectivity degradation
#     Echo 1's reflectivity decreasing from 0.92 to ~0.5 over
#     6 months as the balloon wrinkles
#     Radiation pressure force decreasing accordingly
#     Balloon's lifetime extending (less radiation force = less
#     orbit perturbation) -- a self-limiting degradation
#
# Libraries: numpy, matplotlib, scipy
# Difficulty: Intermediate
# Duration: 3-4 hours
```

**Key learning moments:**
1. The accumulation of small forces. The student sees that the radiation pressure acceleration (8.7 × 10^-5 m/s^2) is fourteen parts per million of gravity -- but over 5,000 orbits in a year, the cumulative effect changes the perigee altitude by tens of kilometers.
2. The area-to-mass ratio dominance. In Plot 3, Echo 1's curve diverges wildly from the conventional satellite curve. The student sees that the same physics (photon momentum) produces negligible effects on a compact satellite and dramatic effects on a lightweight balloon. The physics does not change; the engineering determines whether it matters.
3. The self-limiting wrinkling. In Plot 4, as the balloon wrinkles and the reflectivity drops, the radiation force decreases. A perfectly maintained sphere would have deorbited faster than the actual wrinkled balloon. The balloon's degradation was, in a sense, self-preserving -- it reduced the force that was destroying it.

---

### A3. Web: Interactive Reflection Simulator (Transmitter - Balloon - Receiver)

**What it is:** An interactive web application that visualizes the Echo 1 communication geometry in real time. The student sees a 2D cross-section showing a ground transmitter on the left, the balloon overhead, and a ground receiver on the right. Radio waves emanate from the transmitter, travel upward to the balloon, and scatter in all directions. The receiver catches a tiny fraction. The student can drag the balloon to different altitudes and horizontal positions, watching the signal strength at the receiver change in real time.

**Specification:**

```
WEB APPLICATION: Echo 1 Reflection Simulator
=============================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  GROUND LEVEL: Horizontal line across the bottom
    LEFT: Transmitter station (labeled "Holmdel, NJ")
      Small dish antenna icon pointing upward
      Power level indicator: "10 kW"
    RIGHT: Receiver station (labeled "Goldstone, CA")
      Small dish antenna icon pointing upward
      Signal strength indicator: bar + dBW reading
    Between them: "3,944 km" distance label
    Curvature of Earth shown (subtle arc in ground line)

  SKY:
    BALLOON: Silvery circle (representing Echo 1), draggable
      Default position: 1,600 km directly above the midpoint
      Size proportional to actual 30.5m diameter (tiny at scale)
      Surrounded by a faint glow showing the scattering pattern

  SIGNAL PATHS:
    Uplink: animated wave pattern from transmitter to balloon
      Color: bright yellow-orange
      Width proportional to signal strength
      Fading with distance (1/R_t^2 visualization)
    Scattered: rings expanding outward from balloon in all
      directions (omnidirectional scattering)
      Color: dim yellow, fading rapidly with distance
      Most energy goes in directions that miss the receiver
    Downlink: thin beam from balloon to receiver
      Color: faint yellow
      Width proportional to received signal strength
      Only the tiny fraction aimed at the receiver

  LINK BUDGET PANEL (right side):
    Real-time calculation updating as balloon is dragged:
    - R_t: ____ km (transmitter to balloon distance)
    - R_r: ____ km (balloon to receiver distance)
    - FSPL_up: ____ dB
    - FSPL_down: ____ dB
    - sigma: ____ m^2 (729.7 for smooth sphere)
    - P_rx: ____ dBW
    - SNR: ____ dB
    - Link quality: GOOD / MARGINAL / LOST

Controls:
  - Drag balloon vertically (change altitude: 500-5000 km)
  - Drag balloon horizontally (change position along ground track)
  - "SMOOTH" / "WRINKLED" toggle:
    Smooth: sigma = 730 m^2 (clean balloon, first weeks)
    Wrinkled: sigma = 200 m^2 (degraded balloon, after months)
    Visual: balloon becomes lumpy when wrinkled
  - "SHOW COMPARISON" toggle:
    Overlays Telstar geometry: satellite with active transponder
    Shows the dramatically stronger received signal
  - Preset geometries:
    "First Call (Aug 13, 1960)" -- optimal pass geometry
    "Low Pass" -- balloon near horizon
    "Degraded" -- wrinkled balloon, marginal link

Deliverables:
  - Single HTML file, self-contained
  - < 900 lines total
  - 60 fps animation of signal waves
  - Smooth balloon dragging with real-time link budget update
```

**Key learning moment:** Dragging the balloon from 1,600 km altitude down to 500 km altitude, the student sees the received power increase by approximately 20 dB (the ranges decrease, both paths get shorter). But dragging it up to 5,000 km, the power drops by approximately 20 dB. The sweet spot is clear: low enough for short path lengths, high enough for simultaneous visibility from both stations. Echo 1's 1,519-1,687 km orbit was a compromise between these two requirements.

---

### A4. Web: "Can You See It?" Satellite Brightness Calculator

**What it is:** An interactive calculator that computes the apparent magnitude of Echo 1 (and other satellites) as seen from the ground. The student enters the satellite's size, albedo, altitude, and the Sun's position, and the calculator determines whether the satellite is visible to the naked eye, how bright it appears, and during what time window (twilight, when the satellite is in sunlight but the observer is in darkness). Echo 1 was one of the brightest objects in the night sky, reaching magnitude -1 (brighter than Sirius) at perigee -- and this visibility was as important for public engagement as the radio reflection was for engineering.

**Specification:**

```
WEB APPLICATION: Satellite Brightness Calculator
================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  SKY MAP (upper portion, 70% of screen):
    Dark sky background with major constellations (stars as dots)
    Horizon line with cardinal directions (N, E, S, W)
    Twilight gradient at horizon (dark blue above, orange-pink below)
    Satellite track: dotted line showing the predicted path
    Satellite position: bright dot on the track, with a
      magnitude indicator (bigger/brighter dot = brighter satellite)
    Sun position: orange glow below the horizon (during twilight)
    Moon position: if applicable

  INFO PANEL (lower portion, 30%):
    Satellite: Echo 1 (or selected satellite)
    Diameter: 30.48 m
    Albedo: 0.92 (aluminized Mylar)
    Altitude: ____ km
    Phase angle: ____ degrees (Sun-satellite-observer angle)
    Apparent magnitude: ____ (computed)
    Comparison: "Brighter than Venus (-4.6)" or "Similar to Sirius (-1.4)"
    Visibility window: "Visible from __:__ to __:__ local time"

Controls:
  - Date/time picker (sets Sun and satellite positions)
  - Location picker (latitude/longitude, major cities preloaded)
  - Satellite dropdown:
    - Echo 1 (30.5m, albedo 0.92, 1600 km)
    - ISS (73m x 109m, albedo 0.2, 420 km)
    - Starlink (3.4m x 2.8m, albedo 0.05, 550 km)
    - Iridium flare (0.6m mirror, specular, 780 km)
    - Custom (enter diameter, albedo, altitude)
  - "ANIMATE PASS" button: shows the satellite crossing the sky
    over 5-10 minutes, with brightness updating in real time

Brightness formula:
  m_sat = m_sun - 2.5 * log10(albedo * A_cross / (4 * pi * d^2))
  + phase angle correction

  where:
    m_sun = -26.74 (apparent magnitude of the Sun)
    A_cross = pi * r^2 (satellite cross-section in m^2)
    d = distance from observer to satellite (m)
    Phase angle correction: accounts for the fraction of
    the illuminated surface visible to the observer

Deliverables:
  - Single HTML file, self-contained
  - < 700 lines total
  - Smooth star rendering
  - Accurate magnitude computation
  - Preset satellite database
```

**Key learning moment:** Switching between Echo 1 and a Starlink satellite. Echo 1: diameter 30.5 m, albedo 0.92, magnitude approximately -1 (brilliant). Starlink: diameter 3.4 m, albedo 0.05 (after VisorSat dimming), magnitude approximately +5 to +7 (barely visible or invisible to the naked eye). SpaceX deliberately reduced Starlink's albedo to avoid light pollution. Echo 1 was designed to be seen -- NASA wanted the public to look up and see the space age with their own eyes. The contrast between "make it visible" (1960) and "make it invisible" (2020) tells the story of how satellite culture changed from inspiring novelty to polluting ubiquity.

---

## B. Machine Learning -- What to Train

### B1. Radar Cross-Section Prediction from Surface Shape

**What it is:** Train a model to predict the radar cross-section of a sphere as a function of surface roughness. The training data consists of simulated RCS values for spheres with various degrees of wrinkling (smooth = high RCS, wrinkled = lower, variable RCS). The student discovers that surface quality directly determines reflection efficiency, connecting Echo 1's degradation to a quantitative prediction problem.

```
Model: Regression (RCS prediction from surface parameters)

Input features:
  - Sphere diameter (m): 10-50
  - Wavelength (m): 0.01-1.0
  - Surface RMS roughness (fraction of wavelength): 0-2.0
  - Correlation length of roughness (fraction of diameter): 0.01-1.0

Output: Normalized RCS (sigma / sigma_smooth)
  sigma_smooth = pi * r^2 (geometric cross-section)
  Ratio ranges from 1.0 (perfectly smooth) to ~0.1 (heavily wrinkled)

Training data:
  - 100,000 samples from physical optics simulation
  - Roughness models: Gaussian random surface, sinusoidal wrinkle patterns
  - Validated against Mie scattering theory for smooth spheres

Architecture: Random forest (baseline), then small feedforward neural
  network (2 hidden layers, 64 units each), compare to Ruze equation
  (the analytical approximation for RCS reduction due to surface errors):
    sigma = sigma_smooth * exp(-(4*pi*roughness/lambda)^2)

The student learns:
  - The Ruze equation is an excellent approximation for small roughness
  - The neural network rediscovers the Ruze equation's exponential form
  - For large roughness (roughness > lambda/4), the Ruze equation
    underestimates the RCS because geometric scattering from large
    facets partially compensates for the loss of specular reflection
  - Echo 1's RCS degradation from ~730 to ~200-300 m^2 is consistent
    with surface roughness growing to approximately lambda/8 = 1.6 cm --
    wrinkles a few centimeters deep on a 30-meter sphere

Libraries: numpy, scikit-learn, torch (optional)
GPU: Optional
Difficulty: Intermediate
```

---

## C. Computer Science -- The Reflection Geometry Algorithm

### C1. Specular Point Finding on a Sphere

The fundamental geometric problem for Echo 1 tracking: given the positions of the transmitter, receiver, and balloon, find the specular reflection point on the balloon's surface. This is the point where the surface normal bisects the angle between the incident and reflected rays -- the mirror point.

```
ALGORITHM: Specular Point on a Sphere

The problem:
  Given:
    T = transmitter position (3D vector)
    R = receiver position (3D vector)
    C = sphere center (3D vector)
    r = sphere radius

  Find: the point P on the sphere surface where a ray from T,
  reflecting off the sphere, arrives at R.

  The condition: at P, the surface normal n = (P - C) / r
  bisects the angle between the vectors (T - P) and (R - P).
  Equivalently, the angle of incidence equals the angle of reflection.

Solution for a sphere:
  The specular point P lies in the plane defined by T, R, and C
  (the scattering plane). Within this plane, the problem reduces
  to finding the reflection point on a circle.

  1. Project T and R onto the scattering plane
  2. Parameterize the circle: P(theta) = C + r*(cos(theta), sin(theta))
  3. The specular condition:
     angle(T - P, n) = angle(R - P, n)
     where n is the outward normal at P
  4. This reduces to a trigonometric equation in theta:
     solve using Newton's method or bisection

Python implementation:

  import numpy as np

  def specular_point(T, R, C, r):
      """Find the specular reflection point on a sphere.

      T, R, C: 3D numpy arrays (transmitter, receiver, center)
      r: sphere radius

      Returns: P (3D point on sphere surface) or None if no
      reflection is geometrically possible.
      """
      # Vectors from center to transmitter and receiver
      u = (T - C) / np.linalg.norm(T - C)
      v = (R - C) / np.linalg.norm(R - C)

      # The specular point is in the plane of C, T, R
      # The bisector of the angles subtended by T and R from the
      # sphere surface gives the normal direction at the specular point
      # For a sphere, this is equivalent to finding the point where
      # the reflected ray satisfies Snell's law (angle in = angle out)

      # Iterative solution: bisect the arc between the sub-T and sub-R
      # points on the sphere
      def cost(theta):
          # Point on sphere in the T-C-R plane
          # theta = 0 at the T-facing pole, theta = alpha at R-facing pole
          n = np.cos(theta) * u + np.sin(theta) * v_perp
          P = C + r * n
          # Compute angles
          to_T = T - P
          to_R = R - P
          to_T = to_T / np.linalg.norm(to_T)
          to_R = to_R / np.linalg.norm(to_R)
          # Specular condition: n bisects the angle
          # Equivalent: cross products have same magnitude
          return np.dot(n, to_T) - np.dot(n, to_R)

      # Set up the in-plane coordinate system
      v_perp = v - np.dot(u, v) * u
      if np.linalg.norm(v_perp) < 1e-10:
          return C + r * u  # T and R on same line from center
      v_perp = v_perp / np.linalg.norm(v_perp)

      # Bisection search
      from scipy.optimize import brentq
      try:
          theta_sol = brentq(cost, 0.01, np.pi - 0.01)
          n_sol = np.cos(theta_sol) * u + np.sin(theta_sol) * v_perp
          return C + r * n_sol
      except ValueError:
          return None  # no specular point visible to both

EXTENSION: Multiple reflections
  For a wrinkled balloon, there are multiple specular points --
  each facet of the wrinkled surface has its own local normal,
  and several may satisfy the reflection condition simultaneously.
  The received signal is the coherent sum of contributions from
  all specular points, with interference effects (constructive
  and destructive) causing the signal to scintillate.

  Model the wrinkled surface as a collection of N flat facets,
  each tilted by a random angle from the original sphere normal.
  For each facet, check if the reflection condition is satisfied
  for the given T-R geometry. Sum the contributions coherently
  (including path length differences for phase). Plot the total
  received power vs time as the balloon rotates -- the signal
  scintillates, reproducing the fluctuations observed in Echo 1's
  actual received signal after the balloon wrinkled.
```

---

## D. Game Theory -- The Passive vs Active Decision

### D1. The AT&T Satellite Strategy Game

In the early 1960s, AT&T (Bell Labs' parent company) faced a strategic decision: invest in passive satellites (Echo, cheap to build, limited bandwidth) or active satellites (Telstar, expensive but wideband). The government had its own preference: NASA wanted communication satellites to be a public utility, not a private monopoly. AT&T wanted to own the satellites. The government created Comsat Corporation (Communications Satellite Corporation) in 1962 to manage satellite communications as a regulated entity.

```
GAME: SATELLITE COMMUNICATIONS STRATEGY (1960-1962)

Players: 3 stakeholders
  - AT&T (Bell Labs): has the technology (Telstar), wants
    private ownership of satellite infrastructure
  - NASA: has the launch vehicles, wants public access
  - US GOVERNMENT: regulates communications, wants national
    interest served (Cold War context: satellite comms for
    military and diplomatic use)

Strategies for each player:

AT&T:
  A1: Build and own private satellites (Telstar approach)
      Cost: high ($50M per satellite in 1962 dollars)
      Revenue: all international telephone revenue
      Risk: regulatory rejection, antitrust

  A2: License technology to government/Comsat
      Cost: lower (R&D cost only)
      Revenue: licensing fees + ground station contracts
      Risk: competitors develop alternatives

NASA:
  N1: Support private satellites (AT&T builds, NASA launches)
      Cost: launch costs only
      Benefit: rapid deployment, private investment
      Risk: public infrastructure controlled by monopoly

  N2: Build public satellite infrastructure
      Cost: high (full system cost)
      Benefit: public access, government control
      Risk: slow, bureaucratic, expensive

GOVERNMENT:
  G1: Allow private ownership (AT&T monopoly)
  G2: Create regulated entity (Comsat, hybrid)
  G3: Government ownership (public utility)

WHAT ACTUALLY HAPPENED:
  - AT&T developed Telstar privately ($50M investment)
  - NASA launched it (charged AT&T $3M for the launch)
  - The government created Comsat Corporation (1962)
  - Comsat joined Intelsat (international consortium, 1964)
  - AT&T was forced to license its technology to Comsat
  - AT&T never owned the satellites it invented
  - The technology AT&T developed became a public resource

GAME THEORY ANALYSIS:
  AT&T's dominant strategy was A1 (build and own), but the
  government's regulatory power made A1 unachievable. The
  Nash equilibrium was {A2, N1, G2}: AT&T licenses, NASA
  launches, government regulates through Comsat. This
  outcome was Pareto-efficient (no player could be made
  better off without making another worse off) but was
  NOT the outcome AT&T preferred.

  Echo 1's role: it provided the existence proof that
  satellite communications worked, BEFORE AT&T could
  establish a monopoly position with Telstar. By the time
  Telstar launched (July 10, 1962), the regulatory framework
  (Comsat Act, August 31, 1962) was already in motion.
  The passive satellite -- NASA's cheap, simple, publicly
  funded balloon -- set the regulatory precedent that
  satellite communications were a public interest, not a
  private property. If AT&T had launched Telstar first
  (without Echo 1 as precedent), the regulatory outcome
  might have been different.

EXERCISE:
  Divide into 3 teams (AT&T, NASA, Government).
  Each team privately selects a strategy.
  Reveal simultaneously. Compute payoffs.
  Discuss: did the actual outcome serve the public interest?
  What would have happened without Echo 1?
```

---

## E. Creative Arts -- What to Create

### E1. "Hundred-Foot Mirror" -- The Balloon in Orbit

**What it is:** A visual art piece depicting Echo 1 in orbit, seen from nearby (within a few hundred meters, as an astronaut might see it -- though no astronaut visited Echo 1, the perspective reveals the scale). The balloon dominates the frame: a shimmering sphere of wrinkled aluminum-coated Mylar reflecting the blue Earth on one side and the black void on the other, the Sun's reflection creating a dazzling specular point on the curved surface. The Mylar is translucent at the edges where the aluminum coating has thinned, allowing the faintest hint of sunlight to pass through. The sphere is enormous -- 100 feet across, dwarfing the viewer's sense of scale in the void.

```
ART PIECE: "Hundred-Foot Mirror"
=================================

Composition (16:9 aspect ratio):

  CENTER: Echo 1 balloon
    A sphere filling approximately 60% of the frame
    Surface: reflective Mylar with visible wrinkles
      (the balloon has been in orbit for weeks, the skin
      is not perfectly smooth)
    Specular highlight: blazing white where the Sun reflects
      directly toward the viewer (small area, very bright)
    Earth reflection: blue-white arc of the Earth visible
      as a distorted image on the curved surface (like looking
      at a room in a Christmas ornament)
    Space reflection: the dark side of the balloon shows
      distorted star reflections
    Edge: the balloon's silhouette is razor-sharp against
      the black sky, but at the very edge the Mylar appears
      translucent -- the thin aluminum coating barely masks
      the polymer substrate

  BACKGROUND:
    Upper half: deep black space, scattered with stars
    Lower half: the curve of the Earth, partially visible
      behind/below the balloon
    No atmosphere between viewer and balloon (hard vacuum,
      no atmospheric haze)

  SCALE REFERENCE:
    A small label floating near the edge:
    "Diameter: 30.48 m (100 ft) -- Weight: 76 kg"
    The incongruity is the point: this enormous object
    weighs less than a person

  Color palette:
    Balloon surface: chrome silver with warm gold specular highlight
    Earth: blue-white with cloud patterns
    Space: pure black with white star points
    Wrinkles: subtle shadow lines on the Mylar surface,
      revealing the creases from thermal cycling
```

### E2. "Man O' War and Mirror" -- Colonial Reflection

**What it is:** A split-panel art piece. The top panel shows Physalia physalis from underwater, looking up: the pneumatophore silhouetted against the surface, sun rays streaming through the water around it, tentacles trailing downward into blue-black depth. The bottom panel shows Echo 1 from the ground, looking up: the balloon as a bright point of light against the twilight sky, radio wave lines emanating downward toward receiving antennas on the horizon. Both panels share the same compositional structure: a floating object viewed from below, illuminated from above, with trailing elements extending downward.

```
ART PIECE: "Man O' War and Mirror"
===================================

Composition (diptych, each panel 16:9, stacked vertically):

  TOP PANEL: "The Colony" (underwater view looking up)
    Surface: the air-water interface at the top of the frame,
      sun rays filtering through in golden-blue shafts
    Pneumatophore: silhouetted against the surface, blue-violet
      iridescent, approximately 20 cm long, with the asymmetric
      sail crest visible as a dark ridge
    Tentacles: trailing downward from the pneumatophore into
      the frame, blue-purple, branching, fading into the
      deep blue below. Multiple tentacle types visible:
        - Thick feeding tentacles (gastrozooids) near the float
        - Long, thin capture tentacles (dactylozooids) extending
          10+ meters downward, narrowing to thread-like
        - Small reproductive clusters (gonozooids) near the base
    Background: deep blue water, darkening toward the bottom
    A small fish near the tentacles, unaware of the danger
    The light is entirely from above -- the Sun

  BOTTOM PANEL: "The Mirror" (ground view looking up)
    Sky: twilight gradient from dark blue (zenith) to
      orange-pink (horizon)
    Echo 1: a bright point of light in the upper portion
      of the sky, brighter than any star, leaving a faint
      trail as it moves across the sky
    Radio waves: thin golden lines emanating downward from
      the satellite toward the ground, spreading as they
      descend (visualizing the omnidirectional scattering)
    Ground: dark landscape with two receiving dishes visible
      on the horizon -- one at far left (Holmdel), one at
      far right (Goldstone)
    Between the dishes: the curvature of the Earth suggested
      by the arc of the ground line
    The light source is the Sun below the horizon (twilight),
      illuminating the satellite from below/behind

  CONNECTING ELEMENT:
    A thin horizontal strip between panels:
    "Both float. Both reflect. Both are colonies of one."
    (Physalia = colony of zooids; Echo 1 = colony of
    Mylar panels sewn from 82 gores)

  Color palette:
    Ocean panel: blue-violet, golden sun rays, purple tentacles
    Sky panel: dark blue-to-orange gradient, chrome satellite dot,
      golden radio wave lines
    Both panels share the golden-light motif (sunlight)
```

---

## F. Problem Solving -- Tracking a Fast-Moving Target

### F1. Antenna Pointing for Echo 1

Echo 1 orbited at approximately 7.5 km/s, crossing the sky in 10-15 minutes. The ground antennas had to track the balloon continuously, keeping the narrow beam aimed at the moving target. For Goldstone's 26-m dish at 2.39 GHz, the beamwidth was approximately 0.3 degrees. The balloon's angular velocity as seen from the ground could exceed 1 degree per second near overhead. The servo system had to slew the dish fast enough to follow, while maintaining pointing accuracy to within approximately 0.1 degrees.

```
THE TRACKING PROBLEM:

GIVEN:
  Echo 1 orbital parameters:
    Altitude: 1,600 km (average)
    Orbital velocity: ~7.5 km/s
    Orbital period: ~118 minutes
    Inclination: 47.2 degrees

  Ground station:
    Antenna beamwidth: 0.3 degrees (at 2.39 GHz, 26-m dish)
    Maximum slew rate: 3 degrees/second (azimuth and elevation)
    Pointing accuracy required: 0.1 degrees (1/3 of beamwidth)

ANGULAR VELOCITY:
  When the satellite passes directly overhead at altitude h:
    omega_max = v / h = 7500 / 1,600,000 = 0.0047 rad/s
             = 0.27 deg/s

  This is within the 3 deg/s slew capability, but with
  margin of only 10:1. Near the horizon (slant range ~4,000 km),
  the angular rate drops to ~0.1 deg/s -- easier to track.

  The challenge is the ACCELERATION near zenith: as the
  satellite crosses overhead, both azimuth and elevation
  change rapidly, and the azimuth can change by 180 degrees
  in seconds (the "keyhole" problem). The servo must
  anticipate this by switching to a "through-zenith" tracking
  mode that reverses the azimuth direction smoothly.

EXERCISE:
  1. Compute the angular position (azimuth, elevation) of
     Echo 1 as seen from Goldstone, CA during a pass.
  2. Compute the angular rates (deg/s) and accelerations.
  3. Determine the pointing error from a simple proportional
     servo (error = rate / servo_bandwidth).
  4. Design a predictive tracker that uses the known orbit
     to anticipate the satellite's position and pre-point
     the antenna.

Python implementation:

  import numpy as np

  # Simplified overhead pass model
  h = 1600e3  # altitude (m)
  v = 7500    # orbital velocity (m/s)
  t = np.linspace(-400, 400, 1000)  # time from closest approach (s)

  # Satellite position (assuming ground track passes over station)
  x = v * t   # along-track distance from sub-satellite point
  r = np.sqrt(h**2 + x**2)  # slant range
  elev = np.degrees(np.arctan2(h, np.abs(x)))  # elevation angle

  # Angular rate
  omega = np.gradient(np.radians(elev), t)  # rad/s
  omega_deg = np.degrees(omega)

  # Maximum angular rate (at zenith, t=0)
  omega_max = v / h  # rad/s
  print(f"Max angular rate: {np.degrees(omega_max):.2f} deg/s")
  print(f"Beamwidth: 0.3 deg")
  print(f"Time to cross one beamwidth: {0.3/np.degrees(omega_max):.1f} s")
  print(f"Tracking update rate needed: > {np.degrees(omega_max)/0.1:.0f} Hz")
```

---

## G. Interdisciplinary Connection -- Schrodinger's Wave Reflection

### G1. The Universal Physics of Reflection

Schrodinger's wave equation and Maxwell's wave equation both predict the same phenomenon: when a wave encounters a boundary between two media with different properties (different potentials in quantum mechanics, different impedances in electromagnetics), part of the wave reflects and part transmits. The reflection coefficient depends on the mismatch between the media.

```
THE UNIVERSAL REFLECTION:

ELECTROMAGNETIC (Echo 1):
  A radio wave at 2.39 GHz (lambda = 12.55 cm) traveling
  through vacuum (impedance Z_0 = 377 ohms) encounters
  Echo 1's aluminum surface (impedance Z_Al ~ 0.01 ohms).

  Reflection coefficient:
    R = |(Z_Al - Z_0) / (Z_Al + Z_0)|^2
      = |(0.01 - 377) / (0.01 + 377)|^2
      = |(-377) / (377)|^2
      = 0.99995

  Near-perfect reflection. Less than 0.005% of the energy
  is absorbed. The rest bounces back. This is why Echo 1
  worked: aluminum is nearly a perfect mirror at microwave
  frequencies.

QUANTUM MECHANICAL (Schrodinger):
  An electron with energy E traveling through free space
  encounters a potential step V.

  If E > V (partial transmission):
    Reflection coefficient:
      R = |(k1 - k2) / (k1 + k2)|^2
    where k1 = sqrt(2mE)/hbar, k2 = sqrt(2m(E-V))/hbar

  If E < V (total reflection, classically):
    R = 1.0 (perfect reflection)
    But the wavefunction does not stop at the boundary --
    it penetrates exponentially into the forbidden region
    (evanescent wave). This is quantum tunneling.

  Echo 1's aluminum surface is the electromagnetic analog
  of a quantum potential barrier. The electromagnetic field
  does not stop at the aluminum surface -- it penetrates a
  short distance into the metal (the skin depth, approximately
  2 microns at 2.39 GHz). This penetration is the classical
  analog of quantum tunneling. The energy that penetrates is
  absorbed (converted to currents in the metal, which dissipate
  as heat). The fraction absorbed is approximately
  1 - R = 0.005% -- the energy of the "tunneled" wave.

ACOUSTIC (Physalia):
  A sound wave in water (impedance Z_water = 1.5 × 10^6 Pa·s/m)
  encounters the air-filled pneumatophore (impedance Z_air =
  413 Pa·s/m).

  Reflection coefficient:
    R = |(Z_air - Z_water) / (Z_air + Z_water)|^2
      = |(413 - 1.5e6) / (413 + 1.5e6)|^2
      = 0.9989

  Near-perfect reflection of underwater sound by the air-filled
  bladder. This is why sonar can detect fish swim bladders
  (and man o' war pneumatophores): the air-water impedance
  mismatch creates a strong acoustic reflection, just as the
  vacuum-aluminum impedance mismatch creates a strong
  electromagnetic reflection.

CONNECTION:
  The mathematics is identical in all three cases:
    R = |(Z1 - Z2) / (Z1 + Z2)|^2

  The impedance ratio determines the reflection. Large
  mismatch = strong reflection. Perfect match = zero
  reflection (all energy transmitted). The formula does not
  care whether the wave is electromagnetic, quantum mechanical,
  or acoustic. Reflection is a universal property of waves
  encountering boundaries.

  Schrodinger (born August 12, 1887) unified the wave
  description of matter. Echo 1 (launched August 12, 1960)
  demonstrated the wave description of satellite communications.
  The physics connects through the universal mathematics
  of wave reflection at impedance boundaries.
```

---

*"The Portuguese man o' war has no brain. No centralized nervous system, no decision-making organ, no executive function. It is a colony of polyps, each following its own local rules -- extend, contract, sting, digest, reproduce -- and the emergent behavior of the colony is navigation, predation, and reproduction across thousands of kilometers of open ocean. Echo 1 had no brain either. No computer, no logic, no decision-making capability of any kind. It was a balloon. Its only instruction set was the laws of physics: reflect incoming electromagnetic energy according to the boundary conditions of Maxwell's equations, respond to gravity according to Newton's laws, drift under solar radiation pressure according to the conservation of momentum. Both the man o' war and the balloon accomplished remarkable things -- transcontinental communication, transoceanic predation -- without any intelligence whatsoever. They succeeded because their design was matched to their physics. The balloon was spherical because a sphere reflects uniformly. The man o' war's pneumatophore is asymmetric because an asymmetric sail tacks across the wind. Neither needed to decide anything. The medium made the decisions for them: the wind chose the man o' war's course, the radio waves chose the balloon's reflected signal pattern. Schrodinger, whose birthday they share, would have understood: the wave equation does not decide which way to reflect. It reflects according to the boundary conditions. The wavefunction is not intelligent. It is correct. Echo 1 and Physalia physalis are both wavefunctions obeying their boundary conditions -- one electromagnetic, one biological -- and both produce outcomes that look, from the outside, like engineering. The engineering is in the physics. The physics was there before the engineers arrived."*
