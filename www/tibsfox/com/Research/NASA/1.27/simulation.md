# Mission 1.27 -- Ranger 2: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Ranger 2 (November 18, 1961) -- Stranded in Parking Orbit, Agena B Gyroscope Failure
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Polystichum munitum (Western sword fern)
**Bird:** Progne subis (Purple Martin, degree 26, Shaina Shepherd)
**Dedication:** Asa Gray (November 18, 1810)

---

## A. Simulations -- What to Build Locally

### A1. Python: Parking Orbit Decay Simulator

**What it is:** A Python simulation showing Ranger 2's orbital decay from the 150x242 km parking orbit through atmospheric reentry. The simulation integrates the equations of motion with atmospheric drag, plotting altitude vs. time and showing the exponential acceleration of decay as the orbit lowers into denser atmosphere.

**Specification:**

```python
# ranger2_orbital_decay.py
# Simulate Ranger 2's 2-day orbital decay from parking orbit to reentry
#
# Phase 1: Nominal parking orbit (150 x 242 km)
#   - Integrate orbit with atmospheric drag model
#   - Show perigee altitude dropping with each orbit
#   - Mark: "AGENA RESTART WINDOW" at the planned injection point
#   - Mark: "GYROSCOPE FAILURE -- RESTART ABORTED"
#
# Phase 2: Decay acceleration
#   - As perigee drops, density increases exponentially
#   - Drag increases, orbit decays faster
#   - Plot shows the characteristic exponential knee
#   - Mark: "NITROGEN EXHAUSTED -- TUMBLE BEGINS" at ~T+20 hrs
#   - Mark: "SIGNAL LOST" at ~T+23 hrs
#
# Phase 3: Reentry
#   - Perigee drops below 100 km -- rapid decay
#   - Final orbits take minutes, not hours
#   - Mark: "ATMOSPHERIC REENTRY -- NOVEMBER 20, 1961"
#
# Comparison overlay: planned trajectory
#   - If Agena had restarted: apogee rises to 1,100,000 km
#   - Show planned orbit as dashed line going off the chart
#   - The gap between actual (decaying) and planned (escaping)
#     is the visual measure of one failed gyroscope
#
# Libraries: numpy, scipy, matplotlib
# Difficulty: Intermediate
# Duration: 4-6 hours
```

### A2. GLSL Shader: Parking Orbit -- Trapped Between Earth and Sky

**What it is:** A real-time GLSL fragment shader showing Ranger 2 circling Earth in its parking orbit. Earth fills most of the frame. The spacecraft is a small bright dot tracing a circular path. With each orbit, the path gets slightly closer to Earth (the orbit is decaying). Shadow transits are visualized: the dot dims when it enters Earth's shadow, brightens when it emerges. A signal-strength bar on the side slowly depletes.

**Specification:**

```glsl
// ranger2_parking_orbit.frag
// Spacecraft trapped in low Earth orbit, slowly decaying
//
// Geometry:
//   - Earth: large sphere, fills bottom 2/3 of frame
//   - NASA Blue Marble texture (if available) or procedural
//   - Atmosphere glow at the limb
//   - Night side with city lights
//   - Ranger 2: bright gold dot circling Earth every 3 seconds
//     (time-compressed from 88 minutes)
//
// Animation:
//   - Spacecraft circles Earth on a nearly circular path
//   - Path radius decreases by ~0.1% per orbit (visible decay)
//   - Shadow zones: spacecraft dims entering Earth's shadow
//   - Signal bar (left side): starts full, depletes over time
//   - At signal loss (~T+23 hrs scaled): dot turns red, dims
//   - At reentry (~T+48 hrs scaled): dot streaks toward Earth,
//     brief bright flash, gone
//
// HUD overlay:
//   - "RANGER 2 -- PARKING ORBIT" (top)
//   - Altitude counter (km) -- decreasing
//   - Orbit number (#1, #2, ... #33)
//   - Status: "TRACKING" → "SIGNAL DEGRADED" → "SIGNAL LOST" → "REENTRY"
//
// Screensaver mode:
//   - Loops from orbit #1 to reentry, then restarts
//   - XScreenSaver-compatible wrapper
//
// Performance: 60fps on RTX 4060 Ti at 1080p
```

### A3. Godot 4: Parking Orbit Escape Game

**What it is:** A Godot 4 game where the player must restart the Agena B engine before the parking orbit decays. The gyroscope has a random chance of failure. The player must manage spacecraft resources (nitrogen, battery, thermal budget) while waiting for the restart window.

**Specification:**

```
GODOT 4 PROJECT: Ranger 2 -- Escape the Parking Orbit
======================================================

Scene: Top-down view of Earth with spacecraft in circular orbit

Gameplay:
  - Spacecraft orbits Earth every 5 seconds (real-time)
  - Restart window appears at a specific point in the orbit
  - Player presses SPACE at the restart window to attempt restart

  Resources (depleting):
    - Nitrogen: starts at 100%, loses 5% per shadow transit
    - Battery: starts at 100%, charges in sunlight, discharges in shadow
    - Gyroscope: has random chance of failure each orbit
      (starts at 95% chance of working, decreases 2% per orbit)

  Outcomes:
    - Press SPACE at restart window with gyro working:
      ENGINE FIRES. Spacecraft spirals outward. YOU ESCAPED.
      Score based on remaining resources and orbit number.
    - Press SPACE at restart window with gyro failed:
      "GYROSCOPE INOPERATIVE -- RESTART ABORTED"
      Must wait for next orbit (gyro may recover or may not)
    - Nitrogen reaches 0%: spacecraft tumbles. Game shows
      "ATTITUDE CONTROL LOST" -- no more restart attempts possible
    - Battery reaches 0%: "POWER LOSS -- SIGNAL LOST"
    - Orbit decays to 100 km: "ATMOSPHERIC REENTRY -- MISSION LOST"

  The Ranger 2 scenario:
    - On the historical mission, the gyro failed on orbit 1
    - The nitrogen ran out by orbit 13
    - The signal was lost at orbit 15
    - Reentry at orbit 33
    - The game starts with these historical probabilities

Build time: 8-12 hours
Difficulty: Intermediate GDScript
```

### A4. Arduino: Gyroscope Failure Demonstration

**What it is:** An Arduino project with an MPU-6050 gyroscope module that demonstrates the relationship between spin rate and attitude stability. An OLED display shows the gyroscope's angular rate in real-time. When the module is spun (by hand), the display shows "ATTITUDE REFERENCE: ACTIVE." When it stops, the display shows "ATTITUDE REFERENCE: LOST -- RESTART ABORTED."

**Specification:**

```
ARDUINO PROJECT: Ranger 2 Gyroscope Demonstration
===================================================

Hardware:
  - Arduino Nano ($8)
  - MPU-6050 gyroscope/accelerometer ($3)
  - SSD1306 OLED 128x64 ($8)
  - LED (green) + LED (red) ($0.50)
  Total: ~$20

Software:
  - Wire library (I2C communication)
  - MPU6050 library
  - Adafruit SSD1306 + GFX libraries

Functionality:
  - Read gyroscope angular rate on Z axis (roll)
  - If |omega_z| > threshold (e.g., 50 deg/s):
    OLED: "GYRO: ACTIVE" + green LED
    Below: angular rate readout
    Status: "RESTART AUTHORIZED"
  - If |omega_z| < threshold:
    OLED: "GYRO: STOPPED" + red LED
    Below: "ROLL REFERENCE LOST"
    Status: "RESTART ABORTED"

  The student physically spins the MPU-6050 module (on a lazy susan,
  attached to a spinning top, or just rotating by hand on the bench).
  The transition from ACTIVE to STOPPED demonstrates the binary
  nature of gyroscope reference: it works or it doesn't.

Build time: 2-3 hours
Difficulty: Beginner-Intermediate
```

### A5. Blender: The Two-Day Arc -- From Orbit to Plasma

**What it is:** A Blender animation showing Ranger 2's two-day journey from parking orbit to atmospheric reentry. The camera follows the spacecraft as it circles Earth, passes through shadow zones, depletes its nitrogen, loses attitude, tumbles, and finally reenters the atmosphere as a streak of light.

**Specification:**

```
BLENDER SCENE: Ranger 2 -- Two Days
=====================================

Timeline: 600 frames at 30fps (20 seconds, compressing 48 hours)

Models:
  - Earth (Blue Marble texture, atmosphere glow)
  - Ranger 2 spacecraft (hexagonal bus, solar panel wings,
    dish antenna, tower structure -- simplified low-poly)
  - Orbital path (thin line, fading with orbit number)

Animation:
  Frame 1-100: Parking orbit (nominal)
    - Spacecraft circles Earth, solar panels Sun-pointing
    - HUD: "ORBIT 1 -- AGENA RESTART WINDOW APPROACHING"
    - Shadow transit: panels go dark, spacecraft cools
    - "GYROSCOPE STATUS: INOPERATIVE"
    - "RESTART: ABORTED"
    - Spacecraft continues circling

  Frame 100-300: Nitrogen depletion
    - Each shadow transit: nitrogen bar decreases
    - Attitude corrections visible (small jet puffs)
    - By orbit 13: "NITROGEN DEPLETED"
    - Spacecraft begins slow tumble
    - Solar panels sweep through Sun/shadow randomly
    - Power bar declining

  Frame 300-400: Signal loss
    - "SIGNAL DEGRADED"
    - Telemetry HUD values becoming garbled
    - Static noise overlay increasing
    - "SIGNAL LOST -- T+23 HOURS"
    - HUD goes dark

  Frame 400-550: Silent decay
    - Spacecraft continues tumbling in silence
    - No HUD, no telemetry
    - Orbit visibly lower -- closer to Earth with each pass
    - Atmosphere glow getting brighter at perigee

  Frame 550-600: Reentry
    - Spacecraft enters visible atmosphere
    - Heating glow on leading surfaces
    - Solar panels peel away
    - Tower structure breaks up
    - Bright streak -- spacecraft becomes plasma
    - Fade to: Earth's limb, atmosphere glowing
    - Text: "November 20, 1961. Ranger 2 reentered Earth's
      atmosphere after two days in a parking orbit it was
      never designed to survive."

Render: Cycles GPU, 1920x1080, ~4 hours
```

---

## B. Machine Learning -- What to Train

### B1. Predicting Gyroscope Failure from Telemetry

**What it is:** Train a classifier on simulated gyroscope telemetry to predict impending bearing failure. The model learns the subtle signatures (increased noise, drift rate changes, thermal sensitivity shifts) that precede bearing seizure in mechanical gyroscopes.

```
Model: 1D CNN or LSTM
Input: 1024-sample windows of gyroscope telemetry (angular rate, temperature, vibration)
Output: Binary classification (healthy / pre-failure) + time-to-failure regression

Training data: 50,000 synthetic telemetry windows
  - Healthy: stable spin rate + normal noise
  - Pre-failure: increasing spin rate noise, drift, thermal sensitivity
  - Failure: spin rate dropping to zero

The student discovers:
  - Pre-failure signatures are subtle (noise increases by 10-20%)
  - Temperature is a key predictor (bearing friction generates heat)
  - The time from first signature to failure is 30-60 minutes
  - With this model, Ranger 2's gyroscope failure could have been
    predicted during the parking orbit coast phase -- potentially
    triggering an early restart attempt before the gyro stopped

Libraries: PyTorch, numpy
Training time: ~5 minutes on CPU
Difficulty: Intermediate
```

---

## C. Computer Science -- The Serial Chain Problem

### C1. Modeling Serial and Parallel Reliability

```python
# Compare serial (Ranger) and parallel (sword fern) reliability strategies
#
# Serial: R_system = product(R_i)
#   8 components at 90% each: R = 0.43
#   8 components at 95% each: R = 0.66
#   8 components at 99% each: R = 0.92
#
# Parallel: P(at least 1 success) = 1 - (1-p)^n
#   10,000,000 spores at p=10^-6: P = 1 - (1-10^-6)^10^7 ≈ 1.0
#   9 missions at p=0.5: P = 1 - 0.5^9 = 0.998
#
# The biological strategy (parallel) achieves near-certain
# success through massive redundancy.
# The engineering strategy (serial) requires very high
# component reliability to achieve moderate system reliability.
#
# Exercise: At what component reliability does a serial chain
# of N components match a parallel array of M attempts at
# probability p per attempt?
```

---

## D. Creative Arts -- What to Create

### D1. Sword Fern Forest Floor Visualization

**What it is:** A generative art piece depicting the sword fern understory as seen from ground level, looking upward through the frond canopy toward the sky. The sky above is dark with a single bright dot -- Ranger 2 -- circling. The dot grows dimmer with each pass. The fern fronds remain constant.

```
GENERATIVE ART: "The Understory Watches"
==========================================

Structure:
  - View: looking straight up from the forest floor
  - Foreground: sword fern fronds in silhouette, radiating outward
  - Midground: Douglas-fir trunk silhouettes
  - Background: sky visible through canopy gaps
  - In the sky: a small bright dot circling (Ranger 2)

Animation:
  - The dot circles every 3 seconds
  - Each circuit, it dims slightly (signal degradation)
  - After 15 circuits, the dot turns red (tumbling)
  - After 20 circuits, the dot streaks and vanishes (reentry)
  - The fern fronds remain. They were here before and after.

Color palette:
  - Fronds: deep green silhouette (#0A2E0A to #1A4A1A)
  - Sky: pre-dawn dark blue (#0A0A2A)
  - Ranger 2 dot: gold (#FFD700) fading to red (#FF4444) fading to nothing
  - Douglas-fir trunks: near-black (#1A1A0A)

Output: SVG + animated PNG/GIF + p5.js interactive version
Build time: 4-6 hours
```

### D2. Purple Martin Sound Design

**What it is:** A sound design piece mapping Ranger 2's orbital decay to the Purple Martin's calls. The martin's "tchew-wew" and gurgling song are used to sonify the mission timeline.

```
SOUND DESIGN: "Circling Home"
================================

Mapping:
  - Each orbit: one martin call cycle
  - Healthy orbit: clear, strong "tchew-wew" call
  - Degrading orbit: call becomes fragmented, noisy
  - Tumble: calls overlap chaotically (multiple tracks)
  - Signal loss: calls fade into static
  - Reentry: brief burst of noise, then silence
  - Post-silence: one clear martin call from far away
    (the bird is still here, even if the spacecraft is not)

Duration: ~60 seconds
Tools: SuperCollider + Audacity
```

### D3. The Fiddlehead Spiral -- Mathematical Art

**What it is:** A mathematical art piece based on the logarithmic spiral of the sword fern fiddlehead unfurling. The spiral is drawn with parameters that map to Ranger 2's orbital elements: the spiral's tightness maps to orbital eccentricity, the spiral's extent maps to mission duration, and the spiral's termination (abrupt cutoff) maps to the gyroscope failure.

```
MATHEMATICAL ART: "Unfurling / Not Unfurling"
===============================================

Two panels side by side:

Left panel: "The Fern"
  - Logarithmic spiral unfurling smoothly from center to edge
  - Green line on black background
  - Spiral completes fully -- the fiddlehead opens
  - Each coil labeled with a developmental stage:
    spore, gametophyte, embryo, frond
  - The spiral reaches the edge of the frame and continues
    as a straight line (the mature frond)

Right panel: "The Spacecraft"
  - Same logarithmic spiral starting to unfurl
  - Gold line on black background
  - Spiral gets 1/4 of the way and STOPS
  - The line becomes circular (the parking orbit)
  - The circle shrinks slowly (orbital decay)
  - The circle terminates in a small burst (reentry)
  - The spiral never completed

Together: two spirals, one completed, one truncated.
The fern unfurls. The spacecraft does not.
Same mathematics. Different outcomes.

Output: SVG vector + poster-quality PNG
Tools: Python matplotlib or p5.js
Build time: 3-4 hours
```

---

## E. Artifacts

### E1. Story: "The Door"

A short narrative told from the perspective of Ranger 2's attitude control computer, sensing the gyroscope failure, watching the nitrogen deplete, and understanding -- in whatever way a simple sequencer can "understand" -- that the door to deep space will not open.

### E2. Audio: Parking Orbit Sonification

FAUST DSP synthesis of the parking orbit: a repeating tone (once per orbit) that gradually shifts downward in pitch (orbital decay) and accumulates noise (signal degradation). The tone repeats 33 times and then ends abruptly (reentry).

### E3. Circuit: Gyroscope Indicator LED Array

A 555-timer-based LED circuit where LEDs spin around a ring (simulating gyroscope spin). When a switch is toggled (gyroscope failure), the LEDs stop and a red warning LED lights. Simple, physical, tangible.

### E4. Screensaver: Sword Fern Spore Fall

GLSL shader showing sword fern spores drifting downward through a dark forest, each spore a tiny point of light. Most drift to the ground and fade (failed establishment). Occasionally, one lands and a small fern silhouette grows from the landing point (successful establishment). The screensaver runs continuously, accumulating ferns over time.

---

*"Ranger 2 was a fiddlehead that never unfurled. The spiral started correctly -- the Atlas burned, the Agena ignited, the parking orbit was achieved. Then the gyroscope stopped, and the spiral froze in place. For two days the spacecraft circled, each orbit a tighter coil, until the coil collapsed into the atmosphere. The sword fern's fiddlehead does not need a gyroscope. It unfurls by turgor pressure and cell elongation -- parallel processes distributed across millions of cells, no single one of which is mission-critical. The fern's spiral always completes. It has been completing for three hundred million years, since before the dinosaurs, since before the continents assumed their current shapes. Ranger 2's spiral lasted forty-eight hours. The math of spirals does not care about the mechanism. The mechanism cares about everything."*
