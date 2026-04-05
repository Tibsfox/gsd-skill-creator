# Mission 1.25 -- Mercury-Atlas 9 / Faith 7: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Atlas 9 / Faith 7 (May 15--16, 1963) -- Final Mercury, 22 Orbits, 34 Hours, Manual Reentry
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Arbutus menziesii (Pacific Madrone)
**Bird:** Piranga ludoviciana (Western Tanager, degree 24, Ron Artis II)
**Dedication:** L. Frank Baum (May 15, 1856)

---

## A. Simulations -- What to Build Locally

### A1. Python: Mercury Program Endurance Progression + Consumable Dashboard

**What it is:** A two-part simulator: (1) a bar chart showing the Mercury program's duration progression from MR-3 (15 min) to MA-9 (34 hr), and (2) a real-time consumable depletion dashboard that simulates all five MA-9 consumable timelines over the 34-hour mission, with events marked at the points where systems failed.

**Specification:**

```python
# ma9_endurance_dashboard.py
#
# Part 1: Mercury Program Duration Progression
#   - Horizontal bar chart: MR-3, MR-4, MA-6, MA-7, MA-8, MA-9
#   - Durations: 15.5, 15.6, 295, 296, 553, 2060 minutes
#   - Log scale option to show the exponential growth
#   - Mark the 24-hour design limit as a dashed vertical line
#   - MA-9 bar extends past the design limit (red zone)
#
# Part 2: Consumable Depletion Dashboard
#   - Five curves: battery, O2, LiOH, H2O2, cooling water
#   - X axis: mission elapsed time (0-36 hours)
#   - Y axis: fraction remaining (0-100%)
#   - Events marked: orbit 19 (0.05g false alarm), orbit 21 (inverter),
#     orbit 22 (manual retrofire), splashdown
#   - Cooper's power management visible: battery curve has slope changes
#     during sleep period (lower draw) and final orbits (reduced systems)
#   - The LiOH curve approaches zero fastest -- the limiting consumable
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 3-4 hours
```

### A2. Blender: 22-Orbit Time-Lapse -- Earth Rotating Beneath Faith 7

**What it is:** A Blender animation showing Earth rotating beneath Faith 7 over 22 orbits. The camera is fixed at orbital altitude (250 km), looking down. Earth rotates beneath, showing the ground track shifting westward 22 degrees per orbit. Day/night terminator sweeps across. City lights appear on the night side. The 22 orbits are compressed into 90 seconds.

**Specification:**

```
BLENDER SCENE: 22 Orbits Over Earth
======================================

Scene Setup:
  - Timeline: 2700 frames at 30fps (90 seconds, compressing 34 hours)
  - Camera: fixed at 250 km altitude, nadir-pointing (looking straight down)
  - Earth rotates beneath the camera at accelerated rate
  - The orbital inclination (32.5°) means the ground track oscillates
    between 32.5°N and 32.5°S latitude

Models Required:
  Earth (high detail):
    - NASA Blue Marble 8K texture (day side)
    - NASA Black Marble 4K texture (night side, city lights)
    - Cloud layer (semi-transparent displaced sphere)
    - Atmosphere rim glow (thin emission shell)
    - Day/night terminator (sharp shadow from directional Sun light)

  Telemetry HUD (compositing overlay):
    - Orbit counter (top left): "ORBIT 1 of 22" ... "ORBIT 22 of 22"
    - Mission elapsed time
    - Consumable bars (5 colored bars, depleting)
    - Ground track indicator (latitude/longitude)
    - At orbit 19: WARNING indicator (0.05g false alarm)
    - At orbit 21: WARNING indicator (ASCS FAILURE)
    - At orbit 22: "MANUAL CONTROL" indicator

Animation:
  Frame 1-120: Orbits 1-3 (nominal, daylight over North Africa and Asia)
  Frame 120-480: Orbits 4-12 (nominal, ground track shifting)
  Frame 480-840: Orbits 13-18 (sleep period, dimmed HUD, slower pace)
  Frame 840-1000: Orbit 19 (first warning, HUD flashes)
  Frame 1000-1200: Orbits 20-21 (cascading failures, multiple warnings)
  Frame 1200-1400: Orbit 22 (manual control, retrofire, reentry glow)

  At retrofire: orange glow appears at frame edges (atmospheric heating)
  Final frames: clouds fill the view as capsule descends through atmosphere

Render: Cycles GPU, 1920x1080, 128 samples denoised
Build time: 12-16 hours
```

### A3. GLSL Shader: Madrone Bark Exfoliation -- Peeling to Reveal

**What it is:** A real-time GLSL fragment shader simulating Pacific Madrone bark exfoliation. The shader shows a bark surface that continuously peels in curling sheets, revealing green photosynthetic bark beneath. The peeling is procedural -- driven by Perlin noise warped over time -- and the color transitions from terracotta (old bark) through cream (peeling layer) to jade green (new bark).

**Specification:**

```glsl
// madrone_bark.frag
// Procedural bark exfoliation shader
//
// Visual layers (bottom to top):
//   1. Green photosynthetic bark (base layer, jade #3D8B37)
//   2. Cream transition layer (intermediate, #F5E6C8)
//   3. Terracotta outer bark (surface layer, #B5573A)
//   4. Peeling curl effect (displaced terracotta lifting off)
//
// Animation:
//   - Perlin noise field drives the peel boundary
//   - Peel front advances slowly across the surface
//   - Behind the front: green bark visible
//   - At the front: curling edge effect (shadow + displacement)
//   - Ahead of the front: intact terracotta bark
//   - Multiple peel fronts active simultaneously
//   - New bark ages (green → cream → terracotta) over time
//   - Cycle repeats: continuous self-renewal
//
// Uniforms:
//   u_time:       elapsed seconds (drives peel animation)
//   u_resolution: viewport resolution
//   u_peel_rate:  speed of peeling (default: 0.05)
//   u_layers:     number of simultaneous peel fronts (default: 3)
//
// XScreenSaver / GSD-OS screensaver mode:
//   - Continuous peeling cycle, new layers forming as old ones peel
//   - Subtle breathing zoom
//   - Optional: mission facts appear on the green bark briefly
//     before being covered by new terracotta growth
//
// Performance: 60fps on RTX 4060 Ti at 1080p
```

### A4. Arduino: Consumable Countdown with LED Bar and Buzzer

**What it is:** An Arduino project with five LED strips (one per consumable) and an OLED display that counts down the MA-9 mission timeline in accelerated real time. As each consumable depletes, its LED strip dims. The CO2 scrubber strip (red) reaches critical first. A buzzer sounds warning tones when any consumable drops below 20%. At "splashdown," all LEDs flash green.

**Specification:**

```
ARDUINO PROJECT: MA-9 Consumable Countdown
============================================

Hardware:
  - Arduino Nano ($8) or Uno ($25)
  - SSD1306 OLED display 128x64 ($8)
  - 5x LED strips (3 LEDs each, different colors) ($5)
    Blue: Battery
    Green: Oxygen
    Red: CO2 Scrubber (LiOH)
    Orange: Attitude fuel (H2O2)
    White: Cooling water
  - Piezo buzzer ($1) -- warning alerts
  - Push button ($0.50) -- start mission
  - Potentiometer ($1) -- time acceleration (1x to 100x)
  Total: ~$25

OLED Display:
  ┌──────────────────────────┐
  │ FAITH 7 — ORBIT 15/22   │
  │ MET: 22h 07m             │
  │ BAT: ████████░░░ 68%     │
  │ O2:  █████████░░ 76%     │
  │ CO2: ██████░░░░░ 52%  ⚠  │
  │ H2O2: ███████░░░ 62%    │
  │ H2O: ██████░░░░░ 55%    │
  │ STATUS: NOMINAL          │
  └──────────────────────────┘

At orbit 19+:
  STATUS changes to "⚠ SYSTEMS DEGRADING"
  CO2 bar turns red and flashes

At orbit 22:
  STATUS: "MANUAL CONTROL"
  All bars frozen at current levels
  Buzzer plays descending tone (reentry)
  Then: "SPLASHDOWN — 6.4 km" -- all LEDs flash green

Build time: 3-4 hours
```

### A5. Godot 4: Manual Reentry Game

**What it is:** A Godot 4 game where the player must manually control the Mercury capsule through reentry. The ASCS has failed. The player uses the horizon line (visible through the capsule window) to maintain correct pitch attitude (-34°) while firing retrorockets at the correct time. The reentry corridor is 2 degrees wide. Fuel is limited. Score is based on landing accuracy.

**Specification:**

```
GODOT 4 PROJECT: Faith 7 — Manual Reentry
============================================

Gameplay:
  - First-person view through Mercury capsule window
  - Earth's horizon visible (curved blue line against black space)
  - Attitude indicator showing current pitch (dead -- flickering)
  - Manual thruster controls: pitch up (W), pitch down (S)
  - Each thruster firing consumes fuel and creates visible thrust plume
  - Retrofire button (SPACE) fires retrorockets when ready

Phase 1: Attitude Alignment (30 seconds)
  - Capsule is drifting (random initial attitude)
  - Player must use thrusters to align to -34° pitch
  - Horizon line is the only reference (no working instruments)
  - Wind-up clock shows countdown to retrofire window
  - Fuel gauge depleting with each correction

Phase 2: Retrofire (10 seconds)
  - Three retrorockets fire in sequence (automatic once triggered)
  - Player must HOLD attitude during the 10-second burn
  - Each rocket firing creates a yaw perturbation the player must correct
  - Thrust termination: capsule is now on reentry trajectory

Phase 3: Reentry (30 seconds)
  - Atmospheric glow increases at window edges
  - G-meter rising (displayed: 1g → 4g → 7.6g → decreasing)
  - Player must maintain attitude for correct deceleration
  - Too steep: g-meter spikes to 12+ (screen reddens, danger)
  - Too shallow: capsule bounces (horizon drops away, failed)
  - Communications blackout: radio static for 4 seconds

Phase 4: Landing
  - Drogue chute deploys (automatic)
  - Main chute deploys
  - Splashdown: distance from carrier displayed
  - Score based on landing accuracy:
    < 5 km: "PERFECT — Better than Cooper!" (he got 6.4 km)
    5-20 km: "EXCELLENT — Mercury-class accuracy"
    20-100 km: "ACCEPTABLE — Recovery forces en route"
    > 100 km: "MISS — Search and rescue activated"

Build time: 10-14 hours
Difficulty: Intermediate
```

---

## B. Machine Learning -- What to Train

### B1. Consumable Prediction from Mission Parameters

**What it is:** Train a neural network to predict consumable remaining levels at any mission time given initial supply, consumption rate, and pilot behavior mode (active/sleep/emergency). The training data spans the full Mercury fleet's consumable profiles.

```
Model: Multi-layer perceptron (3 layers, 32-64-32)
Input features (8):
  - Mission elapsed time (hours)
  - Initial consumable supply (normalized)
  - Nominal consumption rate (normalized)
  - Pilot mode (active=1.0, sleep=0.5, emergency=0.8)
  - Cabin temperature (°C)
  - Number of active systems (0-12)
  - Attitude control mode (auto=1.0, manual=0.7, drift=0.3)
  - Current orbit number (0-22)

Output (regression):
  - Remaining level for each of 5 consumables (0-100%)

Training data: 10,000 simulated mission profiles
  - Varying mission durations (4-48 hours)
  - Varying pilot behavior patterns
  - Random system failure events

Libraries: scikit-learn or PyTorch
Training time: ~2 minutes (tabular data, small model)
```

---

## C. Creative Arts -- What to Create

### C1. Story: "Thirty-Four Hours"

**What it is:** A literary short story told from Faith 7's perspective -- the capsule narrating its own final flight, watching its systems fail one by one while the pilot inside remains calm.

```
STORY: "Thirty-Four Hours"
===========================

Narrator: Mercury Spacecraft #20 (Faith 7)
Perspective: Second person, present tense, the capsule addressing Cooper
Structure: 22 chapters (one per orbit), each ~200 words

Chapter 1: "I lift you off the pad."
Chapter 7: "You close your eyes. I watch you sleep."
Chapter 19: "The 0.05g light lies. I did not feel reentry."
Chapter 21: "The inverter flickers. I am losing myself."
Chapter 22: "You take the controls. I let go."
Epilogue: "You land us 6.4 kilometers from the ship.
  I will never fly again. You will never forget."

Tone: Quiet, precise, intimate. The capsule is aware
  of its own degradation and accepts it. The pilot is
  the thing the capsule was built to protect, and the
  capsule fulfills its purpose even as it fails.

Output: HTML (styled literary format) + LaTeX (printable)
Word count: ~5,000 words
Build time: 6-8 hours
```

### C2. Madrone Bark Sound Design

**What it is:** A sound design piece mapping Madrone bark exfoliation to Cooper's systems failures. Each peeling layer produces a distinct sound (dry crackling, tearing fiber, revealing green with a tonal shift). The sounds accelerate as the mission progresses and more systems fail.

```
SOUND DESIGN: "Peeling"
========================

Structure: 90 seconds
  0-30s: Slow bark peeling sounds (one layer every 5 seconds)
    - Crackling paper texture
    - Forest wind background (Puget Sound bluff ambience)
    - Western Tanager call in background (3-4 kHz warble)

  30-60s: Peeling accelerates (one layer every 2 seconds)
    - More layers peeling simultaneously
    - Each peel reveals a different tone (like uncovering a bell)
    - Background shifts: forest → wind → silence → radio static
    - Cooper's actual voice clips (public domain NASA audio)
      mixed low, barely audible

  60-80s: Rapid peeling (continuous sound)
    - All layers peeling at once
    - The green bark sound emerges: a clear, sustained tone
    - Radio static fading
    - Single heartbeat rhythm (116 BPM -- Cooper's retrofire heart rate)

  80-90s: Silence, then return
    - Splashdown: water impact sound
    - Forest ambience returns
    - Final Western Tanager call, clear and close

Tools: SuperCollider or Faust
Output: WAV + MP3
Build time: 4-6 hours
```

### C3. Five-Panel Visual: The Mercury Six

**What it is:** A six-panel visual narrative (one per crewed Mercury flight) showing the progression from suborbital hop to full-day endurance. Each panel uses the same visual language but increases in complexity and duration.

```
VISUAL NARRATIVE: "The Mercury Six"
=====================================

Panel 1 (MR-3, Shepard): Single upward arc, brief, bright.
  15 minutes. A parabola that barely touches space.
  Color: clean white on deep blue.

Panel 2 (MR-4, Grissom): Same arc, but at the bottom,
  the capsule is sinking. Water fills the lower frame.
  Color: blue gradient, water darkening below.

Panel 3 (MA-6, Glenn): Three overlapping circles (3 orbits).
  A heat shield alarm icon flashing at the bottom.
  Color: warm orange glow (reentry concern).

Panel 4 (MA-7, Carpenter): Three circles with an overshoot arrow.
  The landing dot is 400 km from the target X.
  Color: scientific blue with experiment icons.

Panel 5 (MA-8, Schirra): Six perfect circles. Sigma symbol.
  Everything aligned, everything precise.
  Color: engineering silver and gray.

Panel 6 (MA-9, Cooper): Twenty-two circles, filling the frame.
  The final circles are drawn with increasingly rough lines
  (systems degrading). The last circle has a hand-drawn quality
  (manual control). A star at the splashdown point (accuracy).
  Madrone bark texture in the background -- peeling to green.
  Color: warm terracotta and jade green (Madrone palette).

Output: SVG + PNG at 4K per panel
Build time: 8-12 hours
```

---

## D. Game Theory -- When the Backup Becomes Primary

### D1. The Manual Control Paradox

Cooper's manual reentry was more accurate than any automatic Mercury reentry. This creates a paradox: if manual control is more accurate, why invest in automatic systems at all?

**Resolution:** Automatic systems are not designed to be more accurate than a skilled pilot. They are designed to be more reliable than an average pilot over many flights. Cooper was exceptional. The automatic system was designed for the average case. The backup (manual) was better than the primary (automatic) on THIS flight, but the primary was the better default choice across ALL flights.

### D2. The Endurance Gamble

The decision to continue to orbit 22 rather than cutting the mission short on orbit 21 was a calculated risk:

| | Systems survive to orbit 22 | Systems fail before orbit 22 |
|---|---|---|
| **Continue** | Full 22-orbit data (maximum value) | Cooper must fly manual reentry (higher risk, but he's trained for it) |
| **Cut short** | Lose 3 orbits of data (moderate value) | N/A (safe but incomplete) |

The decision matrix shows that "continue" dominates if Cooper's manual reentry probability is high. The controllers assessed it as high. They continued. Cooper proved them right.

---

## E. GSD -- The Final Exam Pattern

### E1. Mercury as a Six-Sprint Program

```
GSD PATTERN: Graduated Acceptance Testing

Sprint 1 (MR-3): Can we get a human to space and back? → YES
Sprint 2 (MR-4): Can we confirm it? → YES (but capsule sank)
Sprint 3 (MA-6): Can we orbit? → YES (but heat shield alarm)
Sprint 4 (MA-7): Can we do science in orbit? → YES (but 400km overshoot)
Sprint 5 (MA-8): Can we fly precisely? → YES (textbook flight)
Sprint 6 (MA-9): Can we endure a full day? → YES (systems failed, pilot held)

Each sprint extends the previous:
  Sprint 1: 15 minutes
  Sprint 2: 16 minutes (confirmation)
  Sprint 3: 295 minutes (3x extension)
  Sprint 4: 296 minutes (confirmation at new level)
  Sprint 5: 553 minutes (2x extension)
  Sprint 6: 2060 minutes (3.7x extension to design limits)

Sprint 6 is the final exam. It tests everything:
  Can the pilot sleep? (new capability)
  Can the spacecraft last 34 hours? (pushed to limit)
  Can the pilot recover from systems failure? (backup validation)

GSD equivalent: the final sprint in a milestone is the one
that tests the full system under stress. The earlier sprints
proved individual capabilities. The final sprint proves
that all capabilities hold simultaneously under load.
```

---

*"Faith 7 was the final exam of the Mercury program. Six flights in two years, from fifteen minutes suborbital to thirty-four hours orbital. Each flight proved a new capability. The final flight proved them all simultaneously, then went further: it proved that when everything else failed, the pilot was enough. Cooper named the capsule Faith, and the faith was rewarded not by luck but by preparation -- years of training, hundreds of simulator hours, a temperament built for the long wait and the steady hand. The Madrone stands at the edge of the bluff, peeling its bark to reveal green wood, resprouting after fire, feeding the tanagers that migrate on faith. The math of endurance is the math of managed depletion. The art of endurance is knowing what to shed and what to keep."*
