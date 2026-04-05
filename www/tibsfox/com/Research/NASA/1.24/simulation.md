# Mission 1.24 -- Mercury-Atlas 8 / Sigma 7: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Atlas 8 / Sigma 7 (October 3, 1962) -- Six Orbits, Precision Engineering Flight
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Castor canadensis (North American Beaver)
**Bird:** Pheucticus melanocephalus (Black-headed Grosbeak, degree 24, Allen Stone)
**Dedication:** Philo T. Farnsworth (August 19, 1906)

---

## A. Simulations -- What to Build Locally

### A1. Python: Mercury Fuel Management Simulator

**What it is:** An interactive simulator that lets the student fly a Mercury-like spacecraft for six orbits, choosing between control modes (drift, auto, manual) at each decision point. The simulator tracks fuel consumption, attitude error, and landing accuracy. Three preset profiles (Glenn, Carpenter, Schirra) are available for comparison, plus a free-play mode.

**Why it matters:** Schirra's fuel management on Sigma 7 was the critical demonstration that enabled longer Mercury missions and informed Gemini planning. The simulator makes the resource tradeoff tangible: every moment of active control costs fuel, and every pound of fuel saved at the end translates to landing precision at retrofire.

**Specification:**

```python
# sigma7_fuel_simulator.py
#
# Interactive Mercury fuel management simulator
# Timeline: 6 orbits = 9.22 hours (real time compressed to ~3 minutes)
#
# Each orbit divided into segments:
#   - Ground station pass (attitude control required for comms)
#   - Dark side transit (drift possible, no ground contact)
#   - Experiment window (attitude control for photography/observation)
#   - Transition (mode change)
#
# Control modes:
#   'D' = Drift (0 lb/hr, attitude wanders)
#   'A' = Auto ASCS (0.8 lb/hr, holds attitude to ±5°)
#   'M' = Manual (variable, pilot corrects as needed)
#   'F' = Fly-by-wire (1.5 lb/hr, precise control)
#
# Fuel budget: 60 lb starting
# At retrofire: need at least 5 lb for attitude control
# Landing accuracy = f(fuel_remaining, attitude_error_at_retrofire)
#
# Display (matplotlib animation or terminal):
#   - Fuel gauge (bar graph, color-coded: green/yellow/red)
#   - Attitude indicator (drift angle from nominal)
#   - Orbit counter (1-6)
#   - Ground track map (world map with current position)
#   - Mode indicator (D/A/M/F)
#   - Landing prediction (updates in real time based on fuel remaining)
#
# At end of orbit 6: retrofire sequence
#   - Student must be within attitude tolerance (±2° pitch)
#   - Fuel must be ≥ 5 lb for retrofire attitude control
#   - Landing accuracy = base_accuracy * (fuel_remaining/60)^0.5
#     * (attitude_error/tolerance)^2
#
# Scoring:
#   - Fuel remaining: 0-40 points (higher = better)
#   - Landing accuracy: 0-40 points (closer = better)
#   - All systems nominal: 20 bonus points
#
# Presets:
#   "Glenn": moderate fuel use, good landing (61% remaining, 64 km)
#   "Carpenter": high fuel use, poor landing (17% remaining, 402 km)
#   "Schirra": minimal fuel use, precise landing (78% remaining, 8.3 km)
#
# Libraries: numpy, matplotlib, curses (for terminal UI)
# Difficulty: Intermediate
# Duration: 6-8 hours to build
```

### A2. Minecraft: Mercury Capsule and Recovery Fleet at Scale

**What it is:** A Minecraft build of the Mercury Sigma 7 capsule at approximately 4:1 scale (capsule is ~7 blocks diameter, ~13 blocks tall), floating in an ocean biome, with the USS Kearsarge (aircraft carrier) nearby. The build demonstrates the scale relationship: tiny capsule, enormous ocean, nearby carrier visible from the splashdown point.

**Specification:**

```
MINECRAFT BUILD: Sigma 7 Recovery
====================================

SCALE: 1 block ≈ 0.5 meters

BUILD: Sigma 7 Capsule (floating in ocean)
  - 7×7×13 block truncated cone shape
  - Black blocks for heat shield (bottom)
  - Silver/light gray blocks for hull
  - Orange wool top (drogue parachute remnant)
  - Antenna mast: iron bars extending up 5 blocks
  - Parachute: white wool canopy above (25 block radius)
    connected by string to capsule
  - Sign: "SIGMA 7 — Schirra — 4.5 miles from carrier"

BUILD: USS Kearsarge (4.5 miles = ~9 blocks at 1km/block scale)
  OR build at reduced scale with carrier ~30 blocks away
  - Carrier flight deck: gray concrete, 60×15 blocks
  - Island superstructure: 5×3×10 block tower
  - Aircraft on deck: small models (2-3 block each)
  - Recovery helicopter: on deck, ready for launch
  - Sign: "USS KEARSARGE — CVS-33"

BUILD: Comparison Markers
  - Red wool marker at 402 blocks from carrier
    (Carpenter's landing error at same scale)
    Sign: "AURORA 7 LANDED HERE — 402 km off-target"
  - Yellow wool marker at 64 blocks from carrier
    (Glenn's landing error)
    Sign: "FRIENDSHIP 7 LANDED HERE — 64 km off-target"
  - Green wool marker at Sigma 7 position (4.5 blocks if 1 nm/block)
    Sign: "SIGMA 7 LANDED HERE — 4.5 nm from carrier"

Build time: 3-4 hours
```

### A3. Blender: Six-Orbit Ground Track Animation

**What it is:** A Blender animation showing Sigma 7's ground track across six orbits, with the Earth rotating beneath. The track shifts westward by ~22° per orbit, creating the sinusoidal pattern characteristic of inclined orbits. Ground stations light up as the spacecraft passes overhead. The animation ends with retrofire and a descent path to the Pacific recovery zone.

**Specification:**

```
BLENDER SCENE: Sigma 7 Ground Track
====================================

Scene Setup:
  Timeline: 900 frames at 30fps (30 seconds, compressing 9+ hours)
  Camera: stationary above the Earth, looking down (orthographic)
  OR: rotating with the spacecraft, Earth below

Models:
  Earth: NASA Blue Marble texture, rotating at sidereal rate
  Ground track: gold line (geometry nodes path, thickness 50 km equivalent)
  Ground stations: 16 glowing points at actual locations
    (Cape Canaveral, Bermuda, Canaries, Kano, Zanzibar, etc.)
  Sigma 7: small bright point following the ground track
  Recovery zone: green circle in the Pacific

Animation:
  Frames 1-150: Orbit 1 — track from Florida across Atlantic, Africa, Indian Ocean, Australia, Pacific, back to N. America
  Frames 150-300: Orbit 2 — shifted 22° west
  ...continue for all 6 orbits...
  Frame 750-850: Retrofire — small flash, track curves from orbital to descending
  Frame 850-900: Descent — track ends at Pacific recovery point
    Green flash: "4.5 MILES FROM KEARSARGE"

Ground stations: each station glows bright (white) when Sigma 7 is within comms range (~10° above horizon), dim otherwise. The pattern of bright-dim-bright shows the worldwide tracking network in action.

Render: Cycles, 1920×1080, ~2 hours on RTX 4060 Ti
```

### A4. GLSL Shader: Beaver Dam Water Flow Visualization

**What it is:** A real-time GLSL shader simulating water flow around a beaver dam. The view is from above (2D fluid simulation). Water flows from left to right. A dam structure (brown pixels) spans the channel. Water impounds upstream, creating a pond. Downstream flow is reduced. The visualization shows how a single structure transforms stream hydrology.

**Specification:**

```glsl
// beaver_dam_flow.frag
// 2D fluid simulation with beaver dam obstruction
//
// Geometry:
//   - Stream channel: blue flow from left to right
//   - Dam: brown barrier across channel (semi-permeable)
//   - Upstream: pond forming (water accumulating, velocity decreasing)
//   - Downstream: reduced flow (seepage through dam)
//   - Overflow: when pond reaches dam crest, water goes over
//
// Physics:
//   - Navier-Stokes 2D (simplified: incompressible, low Reynolds number)
//   - Dam as boundary condition: partial obstruction (porosity parameter)
//   - Velocity field: arrows or streamlines colored by speed
//   - Depth: color intensity (deeper = darker blue)
//
// Interactive:
//   u_dam_height: adjust dam height (mouse Y)
//   u_flow_rate: adjust stream flow (mouse X)
//   u_porosity: adjust dam permeability (keyboard 1-9)
//
// The student sees:
//   - Low dam: water flows over, minimal ponding
//   - High dam: large pond, seepage only downstream
//   - High porosity: dam leaks, pond barely forms
//   - Low porosity: dam holds, pond grows, overflow begins
//
// Performance: 60fps on RTX 4060 Ti at 1080p
// The simulation is a simplified 2D fluid solver, not full NS
```

### A5. Arduino: Mission Clock with Fuel Gauge

**What it is:** An Arduino project with an OLED display showing a Mercury mission clock counting up from T+0 to T+9:13:11, with a visual fuel gauge that depletes based on the control mode. Three LEDs represent control modes (drift=green, auto=yellow, manual=red). A potentiometer selects the fuel consumption strategy. The display shows fuel percentage, elapsed time, and projected remaining fuel at splashdown.

**Specification:**

```
ARDUINO PROJECT: Sigma 7 Mission Clock
========================================

Hardware:
  - Arduino Nano ($8)
  - SSD1306 OLED display 128x64 ($8)
  - 3× LEDs (green, yellow, red) + resistors ($2)
  - 10K potentiometer ($1)
  - Momentary pushbutton ($0.50)
  Total: ~$20

Display:
  ┌──────────────────────────┐
  │ ◆ SIGMA 7 — ORBIT 4/6   │
  │ MET: 05:42:18            │
  │ FUEL: ▓▓▓▓▓▓▓▓░░ 72.3%  │
  │ MODE: DRIFT ●            │
  │ Rate: 0.05 lb/hr         │
  │ Landing est: 6.2 nm      │
  └──────────────────────────┘

Potentiometer: selects strategy
  - Left: "Carpenter" (aggressive fuel use)
  - Middle: "Glenn" (moderate)
  - Right: "Schirra" (conservative)

Button: advances to next orbit (time compression)

Build time: 3-4 hours
Difficulty: Beginner-Intermediate
```

### A6. Godot 4: Mercury Reentry Landing Game

**What it is:** A Godot 4 game where the player controls retrofire timing and attitude for a Mercury capsule, then watches the ballistic reentry unfold. The goal: land as close to the recovery carrier as possible.

**Specification:**

```
GODOT 4 PROJECT: Sigma 7 — Hit the Carrier
=============================================

Scene:
  - Side view: Earth's atmosphere layers visible
  - Spacecraft orbiting (schematic, not to scale)
  - Recovery carrier in the Pacific (target point)
  - Trajectory prediction line (updates as player adjusts)

Gameplay:

  Phase 1: Pre-retrofire Setup
    - Slider: retrofire timing (±5 seconds from planned)
    - Slider: retrofire attitude (±5 degrees from planned)
    - Readout: predicted landing point (distance from carrier)
    - "FIRE RETROS" button

  Phase 2: Reentry (automated, player watches)
    - Capsule decelerates, enters atmosphere
    - Heat glow effect (orange → red → white at peak heating)
    - G-force indicator (peaks at ~7.6g)
    - Blackout period (no comms)
    - Parachute deployment
    - Splashdown

  Phase 3: Scoring
    - Distance from carrier (lower = better)
    - "Schirra zone": within 5 nm = gold medal
    - "Glenn zone": within 35 nm = silver
    - "Carpenter zone": within 220 nm = bronze
    - "Lost at sea": > 220 nm = fail
    - Fuel remaining modifier: higher fuel = better attitude control

Scoring: each retry narrows the optimal timing/attitude window
The student learns: landing accuracy is a DETERMINISTIC function
of retrofire parameters. There is a right answer. Find it.

Nodes: standard Godot 2D, no custom shaders needed
Export: HTML5/WebAssembly + Linux binary
Build time: 8-12 hours
Difficulty: Intermediate
```

---

## B. Machine Learning -- What to Train

### B1. Resource Consumption Predictor

**What it is:** Train a regression model to predict total fuel consumption from mission parameters (number of orbits, time in each control mode, attitude correction frequency). The model discovers that drift time is the dominant predictor of fuel remaining.

```
Model: Random Forest or Gradient Boosted Trees
Input features (8):
  - Number of orbits (1-22)
  - Fraction of time in drift mode (0-1)
  - Fraction of time in auto mode (0-1)
  - Fraction of time in manual mode (0-1)
  - Number of attitude corrections per hour
  - Average correction magnitude (degrees)
  - Mission duration (hours)
  - Initial fuel load (lb)

Output: Total fuel consumed (lb)

Training data: 10,000 simulated missions
  - Parameters sampled from realistic distributions
  - Fuel consumption computed from physics model
  - Labels: total H2O2 consumed

Feature importance analysis reveals:
  drift_fraction >> correction_frequency > duration > mode_fractions
  The most important thing is NOT USING FUEL.
  Schirra knew this. The model confirms it.

Libraries: scikit-learn, matplotlib
GPU: Not needed
Training time: ~30 seconds
Difficulty: Beginner
```

### B2. Landing Point Prediction from Retrofire Parameters

**What it is:** Train a neural network to predict landing coordinates from retrofire conditions (timing, attitude, impulse, orbital position). The model learns the sensitivity of landing point to each parameter.

```
Model: Multi-layer perceptron (3 layers, 128-64-32)
Input features (6):
  - Retrofire time (seconds from planned epoch)
  - Pitch angle at retrofire (degrees)
  - Yaw angle at retrofire (degrees)
  - Retrofire impulse magnitude (m/s)
  - Orbital altitude at retrofire (km)
  - Orbital velocity at retrofire (m/s)

Output: Landing error (km from target)

Training data: 50,000 simulated reentries
  - Retrofire parameters varied within ±10% of nominal
  - Landing point computed from 3-DOF ballistic reentry model
  - Labels: distance from planned recovery point

The model discovers:
  - Timing sensitivity: ~7.8 km per second of error
  - Pitch sensitivity: ~25 km per degree of error
  - These match the analytical estimates exactly
  - Cross-terms are small (errors are nearly independent)

Libraries: PyTorch, numpy
GPU: Optional (small model)
Training time: ~5 minutes
Difficulty: Intermediate
```

---

## C. Computer Science -- The Engineering Discipline Pattern

### C1. Systems Monitoring as Scanning

Farnsworth's television scans an image line by line: 525 lines × 30 frames/sec = 15,750 lines per second. Each line is sampled left-to-right, converting a 2D image into a 1D time signal. The receiver reconstructs the 2D image by scanning in sync.

Schirra scanned Sigma 7's systems parameter by parameter: cabin pressure, suit temp, O2 flow, fuel quantity, attitude, battery voltage... Each parameter checked in sequence, the pilot's mental model reconstructed from sequential samples.

```python
# Compare: TV scanning rate vs. pilot monitoring rate

# Farnsworth's TV (1927)
lines_per_frame = 60
frames_per_sec = 20
scan_rate_TV = lines_per_frame * frames_per_sec  # 1200 lines/sec

# NTSC TV (1962, the year of Sigma 7)
lines_per_frame = 525
frames_per_sec = 30
scan_rate_NTSC = lines_per_frame * frames_per_sec  # 15,750 lines/sec

# Schirra monitoring Sigma 7
parameters = 12  # major systems to check
check_cycle_minutes = 5  # complete scan every 5 minutes
scan_rate_pilot = parameters / (check_cycle_minutes * 60)  # 0.04 Hz

print(f"TV scan rate (1927):   {scan_rate_TV:>10,} samples/sec")
print(f"TV scan rate (1962):   {scan_rate_NTSC:>10,} samples/sec")
print(f"Pilot scan rate:       {scan_rate_pilot:>10.4f} parameters/sec")
print(f"\nThe TV is 400,000× faster than the pilot.")
print(f"But the pilot's parameters are multi-dimensional.")
print(f"Each 'sample' involves reading, interpreting, deciding.")
print(f"Farnsworth and Schirra solve the same problem:")
print(f"convert a complex state into a sequential measurement.")
```

### C2. The Beaver Algorithm: Dam Site Selection

Model the beaver's dam site selection as an optimization algorithm:

```python
# Beaver Dam Site Selection Algorithm
#
# Objective: maximize pond_area per unit dam_length
# Constraints:
#   - Stream gradient < 3% (too steep = dam washes out)
#   - Channel width < 15m (too wide = dam too long)
#   - Substrate supports foundation (bedrock or packed gravel)
#   - Alder/willow within 100m (food and construction material)
#   - No existing dam within 200m upstream
#
# The beaver "solves" this by:
#   1. Swimming upstream, testing flow velocity
#   2. Inspecting bank height and substrate
#   3. Checking vegetation availability
#   4. Beginning test construction at candidate site
#   5. Abandoning if conditions prove unsuitable
#   6. Continuing until a viable site is found
#
# This is a greedy local search with evaluation-by-construction:
#   - No global optimization
#   - No mathematical model
#   - Empirical testing at each candidate
#   - Accept the first site that meets all constraints
#
# Compare to Schirra's mode selection:
#   - At each decision point, evaluate: do I need active control?
#   - If not: drift (cost = 0)
#   - If yes: choose minimum-cost mode that meets the constraint
#   - This is also a greedy local optimization
#   - Both the beaver and the pilot optimize locally and achieve
#     globally near-optimal results through disciplined constraint
```

---

## D. Creative Arts -- What to Create

### D1. Generative Art: "Every Parameter Within Spec"

**What it is:** A generative art piece visualizing Sigma 7's nine-hour flight as a grid of parameters, each cell colored by how close the value was to specification. Green = within spec. The entire grid is green. That IS the art -- the visual uniformity of a flight where everything worked. Compare to grids for Glenn (mostly green, one yellow cell for the heat shield indicator) and Carpenter (scattered yellow and red cells for fuel, attitude, landing).

```
FORMAT: Three panels, side by side
  Panel 1: "Friendship 7" — mostly green, one yellow (heat shield alarm)
  Panel 2: "Aurora 7" — green with red cluster (fuel), yellow (attitude), red (landing)
  Panel 3: "Sigma 7" — solid green, every cell, every row

Grid structure:
  Rows: parameters (fuel, temp, O2, attitude, power, comms, etc.)
  Columns: time (each column = 15 minutes, 37 columns)
  Cell color: green (nominal), yellow (marginal), red (off-spec)

Tools: p5.js or matplotlib
Size: 4K (3840×2160) per panel
```

### D2. Sound Design: "The Grosbeak Sings, the Pilot Reports"

**What it is:** A 90-second sound piece contrasting the Black-headed Grosbeak's rich warbling song with Schirra's clipped, precise radio communications. The grosbeak sings for beauty; the pilot speaks for function. Both communicate across distance. Allen Stone's soulful vocal style (degree 24 S36 artist) bridges the two.

```
STRUCTURE:

  0-15s: Dawn forest ambience (mixed forest, PNW riparian)
    Black-headed Grosbeak song: rich robin-like warble, 2-4 second phrases
    Full frequency range: 1.5-7.5 kHz, complex syllable structure
    The song fills the forest with layered sound

  15-30s: Crossfade to radio static
    Grosbeak song fading, replaced by spacecraft comms
    Schirra's voice (archival audio style): "Sigma 7, all systems nominal.
    Fuel 76 percent. Attitude holding. Over."
    Clipped, efficient, information-dense. No ornament.

  30-50s: Allen Stone bridge
    Soul/jazz vocal line — rich, warm, Chewelah WA authenticity
    Musically between the grosbeak's complexity and Schirra's precision
    Stone's voice as the bridge between nature and engineering

  50-70s: Interleave
    Grosbeak phrase → Schirra report → Stone vocal line
    Three communication strategies in one acoustic space
    Increasing overlap: all three voices blending

  70-90s: Resolution
    All three fade to forest ambience
    Stream sound (beaver territory)
    One final grosbeak phrase
    Silence

Tools: Audacity + field recordings (CC0 grosbeak, synthesized radio)
Duration: 90 seconds
```

### D3. "The Dam and the Flight" — Visual Narrative

**What it is:** A two-panel diptych. Left panel: a beaver dam cross-section, annotated with engineering labels (foundation, structure, waterproofing, overflow, maintenance zone). Right panel: Sigma 7 mission timeline, annotated with the same labels applied to the flight (launch foundation, orbital structure, fuel waterproofing, reentry overflow, continuous maintenance).

The visual parallel makes the organism-mission resonance explicit: the dam IS the flight. The flight IS the dam.

```
FORMAT: Two panels, 1920×1080 each, side by side

LEFT PANEL: Beaver Dam Cross-Section
  - Ground level, stream flowing left to right
  - Dam profile: thick base, narrowing upward, upstream face smooth (mud)
  - Downstream face: visible stick structure
  - Pond upstream: blue, deep, still
  - Stream downstream: narrow, flowing, shallow
  - Annotations (engineering font):
    "FOUNDATION: Rocks and waterlogged wood anchored to bedrock"
    "STRUCTURE: Interlocked branches, each supporting neighbors"
    "WATERPROOFING: Mud plastered on upstream face"
    "OVERFLOW: Controlled crest height, water goes over not through"
    "MAINTENANCE: Continuous. Leaks detected by sound, patched nightly."

RIGHT PANEL: Sigma 7 Mission Timeline
  - Horizontal timeline, 0 to 9:13:11
  - Fuel gauge below (green bar, barely depleting)
  - Orbit markers above (1-6)
  - Annotations (same engineering font, same positions):
    "FOUNDATION: Atlas launch vehicle, all stages nominal"
    "STRUCTURE: Six orbits, systems management, mode selection"
    "WATERPROOFING: Fuel conservation — drift when possible"
    "OVERFLOW: Retrofire — controlled deorbit, 4.5 nm accuracy"
    "MAINTENANCE: Continuous. Systems monitored every cycle."

Color palette:
  Dam: browns (#5C3A1E, #8B4513), blues (#3A7CA5, #2E6180)
  Flight: silvers (#C0C0C0), golds (#D4A830), NASA blue (#0B3D91)
  Annotations: white on dark background

Tools: SVG or Illustrator
```

---

## E. Problem Solving -- The Discipline of Conservation

### E1. Resource Budget Across All Mercury Orbital Flights

```
EXERCISE: Mercury Fuel Efficiency Analysis

Data:
  Flight    | Orbits | Hours | Fuel Used | Rate (lb/hr) | Landing (nm)
  MA-6      | 3      | 4.92  | 23.0 lb   | 4.67          | 35
  MA-7      | 3      | 4.93  | 50.0 lb   | 10.14         | 217
  MA-8      | 6      | 9.22  | 13.3 lb   | 1.44          | 4.5
  MA-9      | 22     | 34.32 | 42.0 lb   | 1.22          | 3.5

Questions:
  1. Plot fuel rate vs. landing accuracy. What is the relationship?
  2. Schirra and Cooper have similar rates (1.44 vs 1.22). 
     Did Cooper learn from Schirra's data?
  3. If Carpenter had flown at Schirra's rate, how much fuel
     would he have had at landing? (Answer: ~55 lb, 91.7%)
  4. If Carpenter had Schirra's fuel at retrofire, what would
     his landing accuracy have been? (Discuss: it's not just fuel.
     Carpenter's retrofire attitude was incorrect. But fuel margin
     ALLOWS attitude correction.)
  5. Model the relationship: landing_accuracy = f(fuel_remaining).
     Is it linear, exponential, or something else?
```

---

*"Sigma 7 was built like a beaver dam: every element functional, every resource conserved, every specification met. The simulations in this track let the student experience what Schirra experienced: the constraint of finite resources, the discipline of mode selection, the mathematics of precision. Build the fuel simulator and you learn why drift matters. Build the reentry game and you learn why retrofire timing matters. Build the beaver dam visualization and you learn why maintenance matters. All three are the same lesson: engineering is the discipline of making complex systems work by attending to every detail, continuously, for the duration of the mission."*
