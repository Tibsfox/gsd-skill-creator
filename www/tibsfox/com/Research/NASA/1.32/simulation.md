# Mission 1.32 -- Mariner 2: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mariner 2 (August 27, 1962) — First Successful Interplanetary Mission, Venus Flyby
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Thuja plicata (Western Red Cedar)
**Bird:** Bombycilla cedrorum (Cedar Waxwing, degree 31, Brenda Lee Eager)
**Dedication:** Amelia Earhart (July 24, 1897)

---

## A. Simulations

### A1. Python: Earth-Venus Transfer Orbit + Flyby Geometry

**What it is:** A trajectory simulator showing Mariner 2's 109-day journey from Earth to Venus. Two views: (1) heliocentric showing the transfer ellipse with Earth and Venus positions, and (2) Venus-centered showing the flyby geometry at 34,773 km.

**Specification:**
```python
# mariner2_transfer.py
# Phase 1: Heliocentric view — Sun at center, Earth/Venus orbits, transfer ellipse
# Phase 2: Venus flyby — approach geometry, instrument scan lines, 42-minute encounter
# Phase 3: Mariner 1 vs Mariner 2 — same trajectory, different outcomes
#   Mariner 1: red X at T+293s, Atlas destruct
#   Mariner 2: gold arc completing the full transfer
# Libraries: numpy, matplotlib
# Duration: 4-6 hours
```

### A2. Minecraft: Venus Flyby at Scale

**Specification:**
```
SCALE: 1 block = 1,000 km
Venus diameter: 12 blocks (12,104 km)
Flyby distance: ~35 blocks from Venus center
Build: Venus in yellow/orange concrete (hidden beneath white cloud layer),
  Mariner 2 trajectory as gold blocks sweeping past,
  Three scan lines marked with redstone showing radiometer coverage,
  Temperature signs at surface: "460°C — CONFIRMED BY MARINER 2"
Build time: 3-4 hours
```

### A3. Blender: 109-Day Cruise Timelapse

**What it is:** A 60-second animation compressing Mariner 2's 109-day cruise into one minute. Camera follows the spacecraft as it slowly crosses the interplanetary void. System failures are visualized as flickering lights on the spacecraft model: solar panel goes dark, temperature indicators redden, gyroscope indicator blinks off. The spacecraft degrades visibly but continues. Venus grows from a point of light to a brilliant crescent. At flyby: the microwave radiometer scan lines sweep across Venus's disk. Numbers appear: "460°C." "No magnetic field." Then the spacecraft continues past, growing smaller, and finally: "SIGNAL LOST — January 3, 1963."

```
Render: Cycles, 1920x1080, ~4-6 hours
Build time: 14-20 hours
```

### A4. GLSL Shader: Venus Greenhouse — Heat Trapped Beneath Clouds

**What it is:** A real-time shader visualizing Venus's greenhouse effect. The top half of the screen shows Venus's cloud deck — swirling yellowish-white patterns. Below the clouds, the surface glows red-orange at 460°C. Infrared radiation arrows rise from the surface but are absorbed by CO₂ layers and re-emitted downward. Visible light arrows from the Sun pass through the atmosphere freely. The trapped energy builds. Temperature counter rises.

```glsl
// venus_greenhouse.frag
// Animated atmospheric cross-section showing:
//   - Solar visible light passing through atmosphere (yellow arrows down)
//   - Surface emission (red arrows up)
//   - CO2 absorption and re-emission (arrows turn back down)
//   - Temperature rising until equilibrium at 460°C
// Screensaver mode: continuous cycle of warming visualization
// 60fps on RTX 4060 Ti at 1080p
```

### A5. Arduino: Venus Temperature Display ($20)

An Arduino with a thermistor, OLED display, and RGB LED that maps real room temperature to Venus-equivalent readings. The display shows: current room temp, Venus surface temp (460°C), and the ratio. The LED glows from cool blue (room temp) through yellow to deep red (Venus). A potentiometer simulates "greenhouse intensity" — turning it up scales the displayed temperature toward Venus levels.

### A6. Godot 4: Interplanetary Navigation Game

**What it is:** A game where the player must plan and execute a Venus flyby mission. Set launch date (determines Earth-Venus geometry), choose trajectory type (Hohmann vs. faster), manage spacecraft systems during cruise (power, thermal, attitude), and perform the flyby scan. Random malfunctions occur during cruise — the player must decide which systems to sacrifice. The goal: arrive at Venus with enough functioning instruments to collect data.

```
Challenge modes:
  - "Mariner 2 Historic": replicate actual malfunctions, manage through them
  - "Perfect Mission": no malfunctions, optimize flyby distance
  - "Mariner 1 Mode": software error at T+293s, try to recover (impossible)
Build time: 12-18 hours, GDScript
```

### A7. GMAT: Mariner 2 Trajectory Reconstruction

Full GMAT script reconstructing Mariner 2's trajectory from Atlas-Agena B parking orbit through trans-Venus injection, 109-day cruise, and Venus flyby at 34,773 km. Includes solar radiation pressure modeling (important for accurate cruise trajectory) and Venus flyby geometry validation.

---

## B. Creative Arts

### B1. Story: "The Understudy" (HTML + LaTeX)

A narrative told from the perspective of Mariner 2 — the backup spacecraft that watched its twin destroyed and then completed the mission. The story covers the five-week wait on the launch pad, the 109-day cruise, the growing list of malfunctions, and the 42 minutes at Venus when everything worked just well enough.

### B2. Audio: Venus Approach Synthesizer (FAUST DSP)

A 120-second generative piece mapping Mariner 2's cruise to sound. The 109-day journey compresses into two minutes: solar panel failure as a frequency dropout, overheating as rising distortion, Venus approach as increasing harmonic density (the planet's presence growing in the data), flyby as a sweeping filter revealing the 460°C signal beneath the cloud-noise, and post-flyby fade to interplanetary silence.

### B3. Audio: Cedar Waxwing Call (FAUST DSP)

Generative synthesis of the Cedar Waxwing's thin, high-pitched "sree" call — a narrow-band vocalization near 7 kHz. Multiple voices in a flock, with slight frequency variations and stochastic timing creating the coordinated-but-not-synchronized character of waxwing flocks.

### B4. Screensaver: 4-Mode GLSL

Mode 0: Western red cedar trunk cross-section — growth rings accumulating, thujaplicin gradient visualized as amber glow in heartwood. Mode 1: Mariner 2 cruise — Earth shrinking, Venus growing, malfunction indicators flickering. Mode 2: Venus greenhouse cross-section — trapped radiation, 460°C surface glow. Mode 3: Cedar Waxwing flock — coordinated movement through berry-laden branches.

---

## C. Problem Solving: The Backup Principle

### C1. When Does the Backup Fly?

Mariner 1 was destroyed. Mariner 2 — identical — succeeded. Model the decision to launch the backup:

```
Cost of backup spacecraft: ~$10M (1962 dollars)
Cost of waiting for next launch window: 19 months + $20M
Probability of backup success given Mariner 1 failure analysis: ~60%
Expected value of launching backup: 0.6 × (first interplanetary data)
Expected value of waiting: probability that next attempt succeeds × data
  but 19 months later

Decision: launch the backup. The window is 5 weeks.
JPL launched in 5 weeks. Mariner 2 succeeded.
```

### C2. Malfunction Management as Optimization

Model Mariner 2's cruise as a constrained optimization: maximize science data returned subject to power budget, thermal limits, attitude control propellant, and instrument health. Each malfunction reduces a constraint. The operator must reallocate resources in real time.

---

*"109 days. Five system failures. 42 minutes of scanning another planet. 460 degrees Celsius beneath the clouds. No magnetic field in the silence. The backup spacecraft that became the first interplanetary mission — because JPL had five weeks, an identical twin, and the engineering discipline to fix the guidance code and launch again. Western red cedar endures for a millennium. Mariner 2 endures in its heliocentric orbit. The Cedar Waxwing endures by traveling in flocks. Brenda Lee Eager endures through a voice that outlasts the label. The math of reaching Venus is the math of endurance: survive the cruise, deliver the data, and let the orbit continue."*
