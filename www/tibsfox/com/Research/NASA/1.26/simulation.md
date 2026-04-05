# Mission 1.26 -- Ranger 1: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Ranger 1 (August 23, 1961) -- First Ranger Lunar Probe; Failed to Leave Earth Orbit
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Opuntia fragilis (brittle prickly pear cactus)
**Bird:** Turdus migratorius (American Robin, degree 25, Black Stax)
**Dedication:** Edgar Lee Masters (August 23, 1868)

---

## A. Simulations -- What to Build Locally

### A1. Python: Orbital Decay Simulator -- Ranger 1's Seven-Day Fall

**What it is:** A time-stepped orbital mechanics simulator that models Ranger 1's decay from 160 km parking orbit to atmospheric reentry over seven days. Two visualizations: (1) altitude vs. time showing the exponential collapse, and (2) a polar plot showing the spacecraft's orbit shrinking with each revolution until it intersects the atmosphere.

**Why it matters:** Orbital decay is the physics that made Ranger 1's parking orbit a death sentence. Every spacecraft in low Earth orbit faces this process. The ISS boosts periodically to counteract it. Ranger 1 had no boost capability. This simulation makes the exponential feedback visible: lower orbit → more drag → even lower orbit.

**Specification:**

```python
# ranger1_orbital_decay.py
# Time-stepped orbital decay simulation
#
# Phase 1: Parking Orbit
#   - Input: initial altitude (160 km), spacecraft mass (900 kg),
#     cross-section (5 m^2), drag coefficient (2.2)
#   - Atmospheric model: exponential with altitude-dependent scale height
#   - Integration: Euler or RK4, time step 60 seconds
#   - Track: altitude, velocity, period, atmospheric density, drag force
#   - Continue until altitude drops below 80 km (reentry)
#
# Phase 2: Visualization -- Altitude Timeline
#   - X axis: time (hours, 0 to ~168 = 7 days)
#   - Y axis: altitude (km, 80 to 200)
#   - Plot: altitude vs. time, showing slow initial decay then collapse
#   - Mark: each day boundary
#   - Mark: "SIGNAL RECEIVED" period (approximately all 7 days)
#   - Mark: "REENTRY" at terminal point
#   - Overlay: what-if scenarios at different initial altitudes
#     (180 km, 200 km, 300 km) showing dramatically longer lifetimes
#
# Phase 3: Visualization -- Polar Orbit Shrink
#   - Polar plot, Earth at center (blue circle at r = R_earth)
#   - Draw orbit as ellipse (initially circular at 160 km)
#   - Animate: orbit shrinking over 7 days (every 10th orbit)
#   - Color: green (stable) → yellow (decaying) → red (terminal)
#   - Mark: atmosphere boundary (~80 km) as orange ring
#   - The animation shows the orbit gradually approaching the atmosphere
#     ring, then rapidly collapsing into it
#
# Phase 4: Energy Budget
#   - Plot: total orbital energy vs. time
#   - Plot: energy loss per orbit vs. time (increases as orbit lowers)
#   - Show: the energy the Agena restart would have added (horizontal line)
#   - The gap between the actual energy and the injection energy is
#     the mission's unrealized potential
#
# Libraries: numpy, matplotlib, matplotlib.animation
# Difficulty: Intermediate
# Duration: 4-6 hours
```

**Key learning moments:**
1. The altitude-vs-time plot looks flat for 4-5 days and then plunges -- the exponential atmosphere creates a cliff, not a slope
2. The polar orbit animation shows the orbits getting visibly smaller in the last day
3. The what-if overlay is dramatic: at 200 km instead of 160 km, the lifetime is weeks; at 300 km, months

---

### A2. Minecraft: Ranger 1 Trapped in Parking Orbit

**What it is:** A Minecraft build representing Earth's atmosphere as concentric layers, with Ranger 1's orbit traced as a circular rail at 160 blocks altitude. The orbit gradually descends over time (redstone clock triggering piston tracks that lower the rail), until the rail intersects the atmosphere layer and the spacecraft (a minecart) is destroyed.

**Specification:**

```
MINECRAFT BUILD: Ranger 1 Parking Orbit Trap
===============================================

SCALE: 1 block = 5 km (altitude); horizontal scale compressed

BUILD: Earth (center of build)
  - Core: 12-block-radius sphere of green/blue concrete (60 km radius)
  - Atmosphere layers (concentric rings at different altitudes):
    - 80 km (16 blocks): orange wool = reentry boundary
    - 100 km (20 blocks): yellow glass = Karman line
    - 160 km (32 blocks): gold rail = RANGER 1 ORBIT
    - 200 km (40 blocks): blue glass = ISS minimum
    - 400 km (80 blocks): cyan glass = ISS typical
  - Signs at each layer marking altitude and significance

BUILD: Ranger 1 Orbit Track
  - Circular powered rail at 32 blocks altitude
  - Minecart with chest (= Ranger 1, 306 kg spacecraft)
  - Cart circulates continuously (orbit)
  - Redstone clock mechanism lowers the track 1 block per cycle
  - Day markers: signs showing "DAY 1", "DAY 2", ... "DAY 7"
  - When track reaches 16 blocks (80 km), cart hits lava = reentry

BUILD: The Agena
  - Attached to the Ranger cart (iron block structure)
  - Sign: "AGENA A — ENGINE DID NOT RESTART"
  - Dispenser with fire charge = "intended restart"
  - Button labeled "RESTART ENGINE" — press it: nothing happens
    (dispenser is empty — the engine has no fuel path)
  - A second dispenser (labeled "AGENA B — REDESIGNED") DOES fire
    — demonstrating the fix that came too late for Ranger 1

BUILD: What-If Tower
  - At 200 km equivalent: sign "If parked here: weeks"
  - At 300 km equivalent: sign "If parked here: months"
  - At 400 km equivalent: sign "If parked here: years"
  - Each with a minecart on rail that stays circulating (no decay)

Build time: 3-4 hours
Difficulty: Beginner-Intermediate
```

---

### A3. Blender: The Parking Orbit -- Seven Days Looking Down

**What it is:** A Blender animation from Ranger 1's perspective, looking down at Earth as the spacecraft orbits. The animation compresses seven days into 60 seconds. The ground passes below in 91-minute cycles (day/night terminator visible). As the orbit decays, the atmosphere becomes more visible, the spacecraft encounters increasing drag (visualized as a faint orange glow), and on the final orbits the reentry heating begins.

**Specification:**

```
BLENDER SCENE: Ranger 1 — Looking Down While Falling
=======================================================

Timeline: 1800 frames at 30fps (60 seconds = 7 days)
Camera: Mounted on Ranger 1, looking nadir (straight down)

Models:
  Earth (high detail):
    - NASA Blue Marble 8K texture
    - Day/night terminator moving with each orbit
    - Atmosphere haze layer (thin blue rim)
    - Cloud layer (semi-transparent)

  Ranger 1 spacecraft (brief glimpses):
    - Hexagonal bus with deployed solar panels
    - High-gain antenna pointed at Earth
    - Visible in reflections, never filling frame

  Atmosphere visualization:
    - Volumetric fog increasing in density as altitude drops
    - Color: transparent → pale blue → orange (heating) → white (reentry)

  HUD overlay (compositing):
    - Mission elapsed time
    - Altitude (km) — dropping slowly at first, then fast
    - Orbital period (minutes) — decreasing as orbit lowers
    - Atmospheric density — increasing exponentially
    - "AGENA STATUS: NO RESTART" (constant, red)
    - Day counter

Animation keyframes:

  Frames 1-1200 (Days 1-5): Stable-looking orbit
    - Earth passing below at ~7.8 km/s
    - Day/night cycles visible (45 min each)
    - Altitude: 160 km → ~155 km (barely perceptible)
    - Atmosphere: invisible
    - HUD: steady readings, altitude dropping in single digits

  Frames 1200-1600 (Days 5-6): Visible decay
    - Altitude: 155 km → 140 km
    - Atmosphere: faint blue haze appearing at frame edges
    - Spacecraft vibration beginning (atmospheric buffeting)
    - HUD: altitude dropping faster, density rising visibly

  Frames 1600-1750 (Day 7 early): Rapid decay
    - Altitude: 140 km → 110 km
    - Atmosphere: dense haze, orange glow at leading edges
    - Vibration increasing
    - HUD: numbers changing rapidly

  Frames 1750-1800 (Day 7 final): Reentry
    - Altitude: 110 km → 80 km
    - Orange plasma building around frame edges
    - Earth detail obscured by heating glow
    - HUD: "ALTITUDE CRITICAL" then "SIGNAL LOST"
    - Final frames: white-out (heating), then fade to black
    - Text: "Ranger 1 reentered the atmosphere on August 30, 1961."
    - Text: "The spacecraft operated for 7 days in an orbit"
    - Text: "it was never meant to occupy."

Render: Cycles GPU, 1920x1080, 128 samples (denoised)
Estimated render: 3-5 hours
```

---

### A4. GLSL Shader: Orbital Decay Visualization

**What it is:** A real-time GLSL fragment shader showing Ranger 1's orbit decaying around Earth. Earth is centered, the atmosphere is a thin glowing ring, and the spacecraft traces a spiral that slowly tightens until it intersects the atmosphere.

**Specification:**

```glsl
// ranger1_decay.frag
// Orbital decay visualization with exponential atmosphere
//
// Geometry:
//   - Earth: blue/green circle at center
//   - Atmosphere: thin orange ring at ~80 km equivalent
//   - Orbit: gold circle, initially at 160 km, decaying over time
//   - Trail: fading gold spiral showing recent orbit history
//   - Spacecraft: bright gold dot on the current orbit
//
// Animation:
//   - u_time drives the decay simulation
//   - Spacecraft orbits Earth (angular motion)
//   - Orbit radius decreases: fast at first slow, then rapid
//   - Trail shows the spiral path
//   - When orbit intersects atmosphere: flash, then dark
//   - Text overlay: "DAY 1", "DAY 2", ... "DAY 7", "REENTRY"
//
// Physics:
//   - Orbit radius: r(t) = r0 * exp(-t/tau) where tau depends on density
//   - Orbital velocity: v = sqrt(mu/r) (increases as orbit lowers)
//   - Period: T = 2*pi*sqrt(r^3/mu) (decreases as orbit lowers)
//   - The spacecraft speeds up as it falls — counterintuitive but correct
//
// Color palette:
//   - Earth: blues and greens
//   - Atmosphere: orange gradient
//   - Orbit (safe): gold (#FFD700)
//   - Orbit (decaying): amber (#FF8C00)
//   - Orbit (terminal): red (#FF2200)
//   - Background: dark space with procedural stars
//
// Performance: 60fps on RTX 4060 Ti at 1080p
// Screensaver mode: loops from Day 1 through reentry, repeats
```

---

### A5. Arduino: Atmospheric Density Gauge

**What it is:** An Arduino project with a potentiometer (altitude), LED bar graph (density), and OLED display (orbital parameters). Turn the pot from 600 km down to 100 km and watch the density readings climb exponentially, the orbital lifetime shrink, and the LEDs light up one by one as the atmosphere gets thicker.

**Specification:**

```
ARDUINO PROJECT: Ranger 1 Atmospheric Density Gauge
=====================================================

Hardware:
  - Arduino Nano ($8)
  - SSD1306 OLED 128x64 ($8)
  - 10K potentiometer ($1) — altitude control
  - 8x LEDs (green→yellow→orange→red gradient) ($2)
  - 8x 220-ohm resistors ($1)
  - Piezo buzzer ($1) — atmospheric buffeting sound
  Total: ~$21

Functionality:

  Potentiometer → altitude mapping:
    Full CCW: 600 km (space: quiet, no LEDs)
    Mid: 300 km (low orbit: 1-2 LEDs, faint hiss)
    3/4: 200 km (ISS zone: 3-4 LEDs, audible hiss)
    Near max: 160 km (RANGER 1: 5-6 LEDs, loud hiss)
    Full CW: 100 km (reentry: all LEDs, alarm tone)

  OLED display:
    ┌──────────────────────────┐
    │ RANGER 1 — ALTITUDE SCAN │
    │ Alt: 160 km              │
    │ Density: 1.2e-9 kg/m³   │
    │ Period: 87.6 min         │
    │ Lifetime: ~7 days        │
    │ ▓▓▓▓▓░░░ DECAYING        │
    └──────────────────────────┘

  Key insight: the density meter shows EXPONENTIAL behavior.
  Moving from 400→300 km barely changes the LEDs.
  Moving from 200→160 km lights up several more.
  Moving from 160→120 km triggers the alarm.
  The exponential cliff is felt in the potentiometer: most of
  the rotation seems safe, then suddenly everything lights up.

Build time: 2-3 hours
Difficulty: Beginner-Intermediate
```

---

### A6. Godot 4: Parking Orbit Escape Game

**What it is:** A Godot 4 game where the player must restart the Agena engine by solving a propellant management puzzle in zero gravity. The player controls ullage thrusters to settle propellant before attempting restart. If the propellant is settled (liquid at the bottom, gas at the top), the restart succeeds and Ranger 1 escapes to deep space. If not, the restart fails and the orbit decays.

**Specification:**

```
GODOT 4 PROJECT: Ranger 1 — Settle the Fuel
==============================================

Scene: 2D cross-section of the Agena A propellant tank

Gameplay:

  Phase 1: Coast (zero gravity)
    - Tank shown in cross-section: cylindrical, with baffles
    - UDMH (green liquid) and IRFNA (orange liquid) floating freely
    - Nitrogen pressurant (gray bubbles) distributed randomly
    - Liquids form spheres, stick to walls, oscillate slowly
    - Player can see the engine feed line at the bottom of the tank

  Phase 2: Settle (player action)
    - Player has 4 directional ullage thrusters (arrow keys)
    - Each thruster provides a small acceleration in one direction
    - The liquids respond to acceleration: they flow "downward"
      relative to the thrust direction
    - The pressurant gas moves "upward"
    - Goal: get the liquids to cover the feed line (bottom of tank)
      and the gas to collect at the top
    - Timer: 30 seconds (ullage propellant is limited)
    - The liquids slosh realistically (simplified Navier-Stokes)
    - Baffles affect flow: liquids can get trapped behind baffles

  Phase 3: Restart Attempt
    - After 30 seconds (or player presses ENTER to attempt restart)
    - The engine feed line samples what's at the bottom of the tank
    - If mostly liquid (>80% liquid fraction at feed line): SUCCESS
      - Engine ignites (flame animation)
      - View zooms out: Ranger 1 departing Earth orbit
      - Text: "AGENA RESTART SUCCESSFUL — DEEP SPACE TRAJECTORY"
      - Score based on liquid fraction at restart

    - If mixed (50-80% liquid): PARTIAL
      - Engine sputters, produces some thrust
      - Orbit raised but not enough for deep space
      - Text: "PARTIAL RESTART — ORBIT RAISED BUT STILL BOUND"

    - If mostly gas (<50% liquid at feed line): FAILURE
      - No combustion. No thrust.
      - View shows orbit decaying over 7 days (time-lapse)
      - Text: "RESTART FAILED — RANGER 1 TRAPPED IN PARKING ORBIT"
      - This is what actually happened.

  Challenge modes:
    - "Historical": Agena A baffles (inadequate) — very hard to settle
    - "Agena B": Improved baffles — easier
    - "Centaur": Capillary screen LADs — almost automatic
    - "Starship": Header tank design — different puzzle mechanics

Physics (simplified):
  - 2D SPH (Smoothed Particle Hydrodynamics) for liquid simulation
  - ~200 particles per fluid type
  - Acceleration from ullage thrusters moves particles
  - Surface tension: particles attract at close range
  - Baffles: rigid boundaries in the tank
  - Feed line: sampling region at tank bottom

Build time: 12-16 hours
Difficulty: Intermediate-Advanced
```

---

## B. Machine Learning -- What to Train

### B1. Orbital Decay Prediction from Initial Conditions

**What it is:** Train a regression model to predict orbital lifetime from initial conditions (altitude, mass, area, drag coefficient, solar activity level). The training data spans the full parameter space of low-Earth orbit objects. The student discovers that altitude is the dominant predictor and that the relationship is exponential.

```
Model: Gradient-boosted regression tree (XGBoost or LightGBM)
Input features (5):
  - Initial altitude (100-800 km)
  - Ballistic coefficient (10-500 kg/m^2)
  - Solar F10.7 flux (70-300 sfu, measures solar activity)
  - Orbit inclination (0-100 degrees)
  - Eccentricity (0-0.05 for near-circular)

Output: log10(orbital lifetime in days)

Training data: 50,000 synthetic orbits
  - Generated from simplified King-Hele decay equations
  - Altitude sampled uniformly 100-800 km
  - Solar activity sampled from historical F10.7 distribution
  - Labels: analytically computed decay time

The student learns:
  - Altitude is overwhelmingly the dominant feature (~80% importance)
  - Solar activity matters significantly below 400 km
  - The model learns the exponential relationship automatically
  - Feature importance confirms: altitude >> solar >> B.C. >> inclination
  - Ranger 1 at 160 km: predicted ~5-10 days (actual: 7 days)
  - ISS at 400 km: predicted ~1-3 years without boost

Libraries: scikit-learn or XGBoost, matplotlib
GPU: Not needed
Training time: ~2 minutes
Difficulty: Beginner-Intermediate
```

### B2. Propellant Settling Classification from Tank Images

```
Model: 2D CNN classifier
Input: 64x64 grayscale images of simulated propellant tank cross-sections
  - Liquid (white) and gas (black) distributions in a cylindrical tank
  - Generated from simplified 2D SPH simulation

Labels (3 classes):
  - "Settled" (liquid at bottom, gas at top): restart will succeed
  - "Partially settled" (mixed but some liquid at feed): restart marginal
  - "Unsettled" (random distribution): restart will fail

Training data: 30,000 synthetic tank images
The student sees that the CNN learns to detect the liquid-gas interface
and its proximity to the feed line — the same assessment Agena engineers
had to make without computational tools.

Difficulty: Intermediate
Training time: ~5 minutes on GPU
```

---

## C. Creative Arts -- What to Create

### C1. "Spoon River Orbit" -- Monologues from Dead Spacecraft

**What it is:** A series of free-verse monologues in the style of Edgar Lee Masters' *Spoon River Anthology*, each spoken by a failed spacecraft from the grave (orbit). Each spacecraft tells its story: what it was designed to do, how it failed, and what it learned.

```
FORMAT: 6 monologues, each 12-20 lines
  - Ranger 1: "I had the fuel. The engine would not light."
  - Pioneer 0: "I lasted seventy-seven seconds."
  - Pioneer 2: "The third stage slept."
  - Vanguard TV-3: "They called me Flopnik."
  - Mars Climate Orbiter: "The units were wrong."
  - Challenger SRB O-ring: "I told them I was cold."

Each monologue is first-person, colloquial, unsparing.
The spacecraft speaks from its final orbit (or debris field).
It tells the truth about its failure.
The style directly emulates Masters' compressed, revelatory form.

Output: Typeset PDF + web HTML
Difficulty: Intermediate creative writing
Build time: 4-6 hours
```

### C2. Opuntia fragilis Generative Art -- "The Desert in the Rainforest"

```
GENERATIVE ART: Desert Microhabitat
======================================

A procedural artwork depicting an Opuntia fragilis colony on a
south-facing rock outcrop in western Washington, surrounded by
the wet forest it doesn't belong in.

Structure:
  - Background: dense PNW forest (dark green, misty, wet)
  - Center: bare rock outcrop (gray, sun-heated, dry)
  - On the rock: cluster of Opuntia fragilis pads
    - Generated procedurally: each pad a flattened oval
    - Spines rendered as fine lines radiating from areoles
    - Some pads detached, lying on the rock surface
    - One pad has roots emerging (= new plant establishing)
  - Contrast: wet forest vs. dry rock, green vs. gray-green
  - A single American Robin perched on a nearby branch
    (the degree 25 bird, looking at the cactus)

Color palette:
  - Forest: #0A2E0A, #1A4A1A (deep wet greens)
  - Rock: #8B8682, #A09994 (warm gray)
  - Cactus pads: #6B8E23, #556B2F (olive green)
  - Spines: #FFD700 (gold, catching sunlight)
  - Robin: #CC4400 (rust breast), #4A4A4A (gray back)

Output: SVG + PNG at 4K
Tools: p5.js or Processing
Build time: 6-8 hours
```

### C3. American Robin Dawn Song Sonification

```
SOUND DESIGN: Robin Dawn at the Parking Orbit
===============================================

A 90-second sound piece mapping Ranger 1's seven-day orbital life
to the American Robin's dawn chorus.

Structure:
  - Dawn phase (0-15s): Robin dawn song begins, strong and clear
    "cheerily cheer-up cheerio" — the most recognized birdsong
    in North America. The song represents Ranger 1's systems
    coming alive in orbit.

  - Day phase (15-60s): Song continues but environment changes
    - Underlying tone: spacecraft telemetry (modulated sine wave)
    - Every 10 seconds: a brief silence (= one orbit, 91 minutes
      compressed to 10 seconds)
    - Barely perceptible pitch drop over this section (orbit decaying)
    - Background noise gradually increasing (atmospheric drag)

  - Dusk phase (60-80s): Song deteriorating
    - Robin phrases becoming shorter, less complete
    - Telemetry tone wavering (attitude control degrading)
    - Background noise dominant (atmosphere thickening)
    - Last clear "cheerily" at ~75 seconds

  - Silence (80-85s): Signal lost. Atmosphere.

  - Coda (85-90s): A single real American Robin call
    (field recording, CC0), clear and present.
    The bird is still here. The spacecraft is not.

Output: WAV + MP3
Tools: SuperCollider or Audacity
Build time: 3-4 hours
```

---

## D. Problem Solving -- The First Failure in a Long Series

### D1. Failure Mode Analysis: Rangers 1-6

```
DATA:
  Mission | Date        | Failure Mode                    | Caused By
  R-1     | Aug 23 1961 | Agena A restart failure          | Launch vehicle
  R-2     | Nov 18 1961 | Agena B restart failure           | Launch vehicle
  R-3     | Jan 26 1962 | Missed Moon by 36,793 km          | Guidance error
  R-4     | Apr 23 1962 | Spacecraft computer failed        | Spacecraft
  R-5     | Oct 18 1962 | Spacecraft power failure           | Spacecraft
  R-6     | Jan 30 1964 | TV cameras failed (reached Moon!)  | Spacecraft/instruments

EXERCISES:

1. Classify failures by system: launch vehicle (R-1, R-2) vs.
   spacecraft (R-4, R-5, R-6) vs. guidance (R-3). The failure mode
   MIGRATED from launch vehicle to spacecraft after the Agena was
   fixed. Compare to Pioneer series.

2. Time to fix each failure mode:
   - Agena restart: fixed by Agena B (Ranger 3, ~5 months later)
   - Guidance: fixed by improved targeting (Ranger 4, ~3 months)
   - Spacecraft electronics: required complete Block III redesign
     (~18 months from Ranger 5 to Ranger 7)
   The hardest failures were in the spacecraft, not the launch vehicle.

3. When did "success" become possible?
   - Ranger 6 reached the Moon and impacted on target but cameras
     failed. The trajectory was right, the bus was right, the
     instrument was wrong.
   - Ranger 7 worked completely. 4,316 photographs.
   - Success required ALL subsystems working simultaneously.
   - The probability of all-systems-go was the product of
     individual reliabilities: P = P_lv * P_guidance * P_bus * P_instrument
```

---

## E. GSD -- The Long Failure Pattern

### E1. Six Consecutive Failures: When to Persevere vs. When to Pivot

```
GSD PATTERN: Extended Failure Series

Rangers 1-6 represent the longest unbroken failure streak in
American planetary exploration. The program survived because:

1. Each failure was DIFFERENT (different root cause)
   → The system was not repeating the same mistake
   → Each failure eliminated one failure mode

2. The failures showed PROGRESS toward a goal
   → R-1/R-2: Can't leave orbit → Fixed (Agena B)
   → R-3: Left orbit, missed Moon → Partially fixed
   → R-4: Reached Moon, spacecraft died → Identified subsystem
   → R-5: Spacecraft power failed → Identified subsystem
   → R-6: Reached Moon, cameras failed → Almost there

3. The institutional response was RESTRUCTURING, not cancellation
   → Congressional investigation (Karth Committee, 1964)
   → JPL management changes
   → Block III redesign (complete rework of instrument package)
   → Result: Rangers 7, 8, 9 all succeeded

GSD APPLICATION:
  When facing repeated failures, ask:
  - Are the failures DIFFERENT each time? → Continue (converging)
  - Are the failures the SAME each time? → Pivot (not converging)
  - Is the series showing PROGRESS? → Continue
  - Is the series showing STAGNATION? → Restructure

  Ranger showed progress (different failures, improving trajectory)
  The response was restructuring (new management, new design)
  The result was success (3 consecutive wins after 6 losses)
```

---

*"Ranger 1 was the first failure in a series of six. The Agena would not restart. The spacecraft circled Earth for seven days in a parking orbit that was supposed to last one revolution, transmitting data from a place it was never meant to be, falling back to Earth because the engine that was supposed to push it to the Moon could not convince its propellants to flow downhill in a place where there was no downhill. Seven days. 115 orbits. Then the atmosphere that Ranger 1 had almost escaped reached up and took it back. Edgar Lee Masters would have written its monologue: 'I was built for the Moon. I achieved a circle 160 kilometers above the town. I had the fuel. The valves opened. The propellant floated. The engine coughed nothing. I circled and circled. The air got thicker. On the seventh day, I went home the hard way.' Opuntia fragilis survives in the wrong climate by exploiting the exceptions. Ranger 1 survived in the wrong orbit by exploiting its margins. Both are fragile at the joints and indestructible everywhere else."*
