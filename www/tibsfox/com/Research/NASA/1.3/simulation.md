# Mission 1.3 -- Pioneer 2: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Pioneer 2 (Thor-Able III) -- Air Force's Last Pioneer, First with a TV Camera
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Gaultheria shallon (Salal)
**Bird:** Poecile atricapillus (Black-capped Chickadee)
**Dedication:** Robert Bunsen

---

## A. Simulations -- What to Build Locally

### A1. Python: 3-Stage Rocket Delta-V Calculator + Staging Visualization

**What it is:** A delta-v budget calculator for the Pioneer 2 Thor-Able stack that computes the ideal delta-v from each stage using the Tsiolkovsky rocket equation, then visualizes the staging sequence -- including the third stage failure that doomed the mission. The student sees exactly where the delta-v chain broke.

**Why it matters:** Pioneer 0 failed at T+77 seconds (first stage bearing). Pioneer 1 lost 234 m/s from early second stage cutoff. Pioneer 2's first two stages worked perfectly -- the failure moved up the stack to the third stage. This is the progression the student needs to see: each mission's failure point migrated upward through the staging chain as lower stages were fixed.

**Specification:**

```python
# pioneer2_deltav_staging.py
# 3-stage delta-v budget calculator for Pioneer 2 (Thor-Able III)
#
# Vehicle stack:
#   Stage 1: Thor DM-18 (LR-79 engine)
#     - Propellant: LOX/RP-1
#     - Isp (vacuum): 282 s
#     - Burn time: ~165 s
#     - Thrust: 667 kN
#     - Dry mass: ~3,200 kg
#     - Propellant mass: ~46,000 kg
#   Stage 2: Able (AJ10-40 engine)
#     - Propellant: UDMH/IRFNA (hypergolic)
#     - Isp (vacuum): 270 s
#     - Burn time: ~115 s
#     - Thrust: 35 kN
#     - Dry mass: ~200 kg
#     - Propellant mass: ~2,100 kg
#   Stage 3: X-248 Altair solid motor
#     - Propellant: polysulfide composite solid
#     - Isp (vacuum): 235 s
#     - Burn time: ~16 s (when it fires)
#     - Thrust: ~13 kN
#     - Dry mass: ~14 kg (casing)
#     - Propellant mass: ~86 kg
#     - Pioneer 2: DID NOT IGNITE
#
# Pioneer 2 payload: 39.2 kg (heavier than Pioneer 1's 34.2 kg,
#   due to TV camera and additional instruments)
#
# Calculations:
#   - Tsiolkovsky: delta_v = Isp * g0 * ln(m_initial / m_final)
#   - Compute delta-v per stage, cumulative delta-v
#   - Mark escape velocity requirement: ~10,950 m/s at burnout altitude
#   - Show Pioneer 2 achieved: Stage 1 + Stage 2 = ~7,800 m/s (suborbital)
#   - Missing Stage 3 contribution: ~2,800 m/s (never delivered)
#
# Visualization (matplotlib, 3 panels):
#   Panel 1: Stacked bar chart showing delta-v contribution per stage
#     - Green: Stage 1 delivered, Stage 2 delivered
#     - Red: Stage 3 NOT delivered
#     - Dashed line: escape velocity threshold
#     - Compare: Pioneer 1 (all 3 fired, 234 m/s short) vs
#                Pioneer 2 (Stage 3 never fired, ~2,800 m/s short)
#   Panel 2: Mass ratio waterfall
#     - Starting mass → post-Stage-1 → post-Stage-2 → payload
#     - Shows the dramatic mass shedding at each staging event
#   Panel 3: Altitude vs time
#     - Actual Pioneer 2 trajectory: ballistic arc to ~1,550 km
#     - If Stage 3 had fired: escape trajectory (dashed)
#     - Pioneer 1's actual trajectory for comparison (dotted)
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The Tsiolkovsky equation shows why staging exists -- you cannot reach escape velocity with a single stage at 1958 technology mass fractions
2. The stacked bar chart makes the third-stage failure visceral: a red block sitting on top of two green blocks, well below the threshold line
3. Comparing Pioneer 1 (97.8% of target) to Pioneer 2 (73% of target) shows that losing an entire stage is categorically worse than losing 10 seconds of burn time
4. The altitude plot shows Pioneer 2 barely reaching space -- 1,550 km is lower than the inner Van Allen belt. It saw almost nothing.

**Extension:** Add Pioneer 0 to the comparison (failed at T+77, first stage). Plot all three Pioneers on the same delta-v chart. The failure point migrates up the stack: Stage 1 failure (P-0), Stage 2 underperformance (P-1), Stage 3 no-ignition (P-2). The pattern is diagnostic.

---

### A2. Minecraft: Launch Pad with Redstone 3-Stage Ignition Sequence

**What it is:** A Minecraft redstone contraption that simulates a three-stage rocket ignition sequence. Two stages fire correctly (TNT + observer chains), but the third stage has a broken redstone connection -- the signal never reaches the final igniter. The student debugs the circuit to fix Pioneer 2's failure.

**Specification:**

```
MINECRAFT BUILD: Pioneer 2 3-Stage Launch Pad
===============================================

BUILD: Redstone Ignition Sequencer

  Launch tower (decorative):
    - Stone brick tower, 20 blocks tall
    - Rocket body: white concrete cylinder, 40 blocks tall
      next to the tower
    - Three visible stage sections:
      - Stage 1 (bottom): white concrete, 20 blocks, TNT inside
      - Stage 2 (middle): white concrete, 12 blocks, TNT inside
      - Stage 3 (top): white concrete, 8 blocks, TNT inside
        (with Pioneer 2 gold cone on top, 4 blocks)
    - Umbilical arms: fence gates at 3 heights

  Ignition circuit (underground, visible through glass floor):
    - Stage 1 igniter:
      - Button press → repeater chain (3 repeaters, 4-tick each)
        → TNT block behind Stage 1
      - Observer detects detonation → signals Stage 2 circuit
      - Smoke: campfire blocks ignite under Stage 1
    - Stage 2 igniter:
      - Signal from Stage 1 observer → repeater chain (4 repeaters,
        4-tick each = ~1.5 seconds delay for staging)
        → TNT block behind Stage 2
      - Observer detects detonation → signals Stage 3 circuit
    - Stage 3 igniter (THE BUG):
      - Signal from Stage 2 observer → repeater chain...
      - BUT: one repeater is facing the WRONG DIRECTION
      - Signal dies at the broken repeater
      - Stage 3 TNT never ignites
      - The gold Pioneer 2 cone sits on top, motionless

  Control room (glass-walled observation bunker):
    - 10 blocks from launch pad
    - Big red button (button on red concrete)
    - Redstone lamp panel showing ignition status:
      - Lamp 1: "STAGE 1" → lights when Stage 1 fires (green glass)
      - Lamp 2: "STAGE 2" → lights when Stage 2 fires (green glass)
      - Lamp 3: "STAGE 3" → STAYS DARK (red glass behind it, visible)
    - Sign: "PIONEER 2 -- Nov 8, 1958"
    - Sign: "Third stage ignition failure"
    - Sign: "FIX: Turn the repeater at [coordinates]"

  The fix:
    - Student finds the misaligned repeater in the Stage 3 circuit
    - Right-clicks to rotate it to the correct orientation
    - Presses the launch button again
    - This time all three stages fire in sequence
    - Sign appears: "THIS IS WHAT SHOULD HAVE HAPPENED"

Build time: 3-4 hours
Materials: ~800 blocks + redstone components
Redstone difficulty: Intermediate (repeater chains, observers)
```

**Key learning moment:** The student sees two stages fire perfectly, watches the signal propagate through the underground redstone, and then watches it die at a single misaligned component. The physical act of rotating one repeater to fix the mission is memorable. Hardware failures are often this simple -- one component, one wrong orientation, one missed connection.

---

### A3. Blender: 45-Minute Arc + TV Camera Scan Animation

**What it is:** A Blender animation showing Pioneer 2's brief ~45-minute flight -- from launch to 1,550 km altitude and back. Synchronized with this is a visualization of the TV camera attempting to scan Earth: the scan lines building up a crude image that never completes because the flight is too short and the camera's planned operating altitude is never reached.

**Specification:**

```
BLENDER SCENE: Pioneer 2 -- 45-Minute Arc + TV Camera View
=============================================================

Scene Setup:
  - Timeline: 810 frames at 30fps (27 seconds, compressing ~45 minutes)
  - Time compression: 1 frame = ~3.3 seconds of real time
  - Split screen: left = trajectory view, right = TV camera view

Models Required:
  Pioneer 2 Spacecraft:
    - Truncated cone body: 0.74m base, 0.76m tall (same bus as P-0/P-1)
    - Gold metallic material (thermal coating)
    - TV camera: small cylinder on mounting bracket, visible on spacecraft
      - Lens: dark glass circle at end
      - Scan mechanism: subtle oscillation animation
    - X-248 motor casing attached below (white, inert -- never fires)
    - Instrument booms: magnetometer, antenna
    - Spin rate: 1.8 rev/sec

  Earth:
    - Sphere with NASA Blue Marble texture
    - Atmosphere rim shader (thin blue glow)
    - Cloud layer: semi-transparent second sphere

  TV Camera View Panel (right side of frame):
    - Simulated raster scan display
    - Resolution: 32 x 32 pixels (approximate early TV camera resolution)
    - Scan line animation: bright line sweeps left-to-right, top-to-bottom
    - As each line completes, it persists as a dim row of pixels
    - Image being constructed: Earth limb from 1,550 km
      - Bright curve of atmosphere at edge
      - Dark space above
      - Indistinct surface features below
    - Scan is INCOMPLETE -- only ~15% of image is built before reentry begins
    - Noise: random pixel variation increases as spacecraft descends
      (signal degrades during tumble after third stage failure)
    - Final frame: partial image, scan lines visible, most of frame blank
      - Text overlay: "IMAGE INCOMPLETE -- FLIGHT TERMINATED"

Animation Keyframes:
  Frame 1-60: Launch sequence
    - Side view: rocket lifts off from Cape Canaveral
    - Stage 1 separation at frame 50 (exhaust particles)
    - Stage 2 ignition at frame 52
  Frame 60-120: Second stage burn + staging
    - Camera pulls back
    - Stage 2 separation at frame 110
    - Stage 3... nothing. No exhaust. No acceleration.
    - Text overlay: "THIRD STAGE FAILURE -- NO IGNITION"
    - Spacecraft + inert Stage 3 continue on ballistic arc
  Frame 120-200: Coasting to peak altitude
    - Spacecraft rises on momentum alone
    - TV camera begins scanning (right panel activates)
    - Altitude HUD: climbing toward 1,550 km
    - Scan lines slowly building image
  Frame 200-400: Peak altitude
    - Text overlay: "ALTITUDE: 1,550 km"
    - Text overlay: "Pioneer 1 reached 113,854 km"
    - TV camera continues scanning -- still building image
    - Spacecraft begins to slow, arc flattens
  Frame 400-700: Descent
    - Trajectory curves back toward Earth
    - TV camera image deteriorating (spacecraft tumbling)
    - Scan lines becoming noisy, losing coherence
    - Altitude dropping rapidly
  Frame 700-810: Reentry
    - Orange glow, compression heating
    - TV camera panel: static, then black
    - Final text overlays:
      - "Flight time: ~45 minutes"
      - "First Pioneer with a TV camera"
      - "Last Air Force Pioneer"
      - "Image never completed"

Render Settings:
  - Engine: Cycles (GPU, RTX 4060 Ti)
  - Resolution: 1920x1080
  - Samples: 64 (denoised)
  - Estimated render: 2-3 hours for full sequence

Deliverables:
  - .blend file with all models, materials, animations, compositing
  - Rendered MP4 (H.264)
  - Still frames: third-stage failure moment, peak altitude with
    partial TV image, reentry
  - The partial TV image as standalone PNG (the image that never was)

Build time: 10-16 hours
```

**Key learning moment:** The split screen is devastating. On the left, the trajectory barely reaches altitude. On the right, the TV camera is patiently building an image line by line -- an image that will never be completed. The technology worked. The camera worked. The scan mechanism worked. But the flight was too short because the third stage never fired. Pioneer 2 carried the future (television from space) on a mission that lasted 45 minutes instead of the planned lunar transit.

---

### A4. GLSL Shader: Solid Rocket Grain Combustion

**What it is:** A real-time GLSL fragment shader visualizing the internal combustion of a solid rocket motor grain -- specifically the X-248 Altair motor that was supposed to be Pioneer 2's third stage. The shader shows the propellant grain geometry, the flame front propagating inward, and the combustion products flowing out the nozzle. Then it shows what happens when ignition fails: no flame front, cold grain, zero thrust.

**Specification:**

```glsl
// pioneer2_solid_grain.frag
// Real-time solid rocket motor combustion visualization
//
// Geometry:
//   - Cross-section view of X-248 solid motor
//   - Cylindrical grain with star-pattern core (internal burning)
//   - Nozzle at bottom (convergent-divergent)
//   - Igniter at top (squib + pyrotechnic charge)
//
// Physics (simplified for real-time):
//   - Burn rate: r = a * Pc^n (Saint-Venant's/Vielle's law)
//     a = burn rate coefficient (~0.04 cm/s at 1 atm for polysulfide)
//     n = pressure exponent (~0.4 for polysulfide composite)
//     Pc = chamber pressure
//   - Flame front: propagates perpendicular to grain surface
//   - Star pattern: increases initial burn area for higher initial thrust
//   - As grain burns inward, cross-section evolves from star to circle
//   - Chamber pressure rises with burn area (more surface = more gas)
//   - Nozzle flow: choked at throat, supersonic expansion
//
// Visual modes (toggle with spacebar):
//
//   Mode 1: NOMINAL IGNITION (what should happen)
//     - Igniter fires: bright flash at top of grain
//     - Flame front appears at grain surface (star pattern edges)
//     - Orange-yellow combustion zone propagates inward
//     - Hot gas flow (particle advection) toward nozzle
//     - Exhaust plume: supersonic diamond pattern out the nozzle
//     - Grain surface regresses: star points merge, becomes circular
//     - 16-second burn, then burnout (all propellant consumed)
//     - Color: deep red (propellant) → orange (burning) →
//       bright yellow (flame) → dark (consumed)
//
//   Mode 2: PIONEER 2 FAILURE (what actually happened)
//     - Igniter fires: flash at top... but dimmer
//     - Flame front does NOT propagate to main grain
//     - Igniter charge burns out in ~0.5 seconds
//     - Grain surface: cold, unlit, dark red
//     - No gas flow, no exhaust, no thrust
//     - Chamber sits inert. Motor casing intact.
//     - Temperature visualization: a brief hot spot at igniter
//       that fades to ambient, never reaching grain surface
//     - Text overlay: "IGNITION FAILURE"
//
// Rendering:
//   - 2D cross-section (longitudinal slice through motor)
//   - Grain: SDF shapes (star pattern via polar modulation)
//   - Flame front: noise-perturbed boundary between burned/unburned
//   - Combustion gas: particle simulation (50-200 particles)
//   - Nozzle flow: streamlines colored by velocity (Mach number)
//   - Exhaust: expansion fan + Mach diamonds (simplified)
//
// Uniforms:
//   u_time: elapsed time (0-16 seconds for full burn)
//   u_resolution: viewport size
//   u_mode: 0 = nominal, 1 = failure
//   u_burn_rate_coeff: adjustable a parameter
//   u_pressure_exponent: adjustable n parameter
//   u_camera_zoom: zoom into grain detail
//
// Performance:
//   - Target: 60fps on RTX 4060 Ti at 1080p
//   - Particle count: 100 default
//   - Grain SDF: analytical, no texture needed
//
// Screensaver mode:
//   - Alternates between nominal and failure every 20 seconds
//   - Slow zoom into grain structure between cycles
//   - XScreenSaver-compatible wrapper
```

**Key learning moment:** The student sees the same motor, the same geometry, the same propellant. In one mode, a cascade of combustion sweeps through the grain in 16 seconds, producing thrust. In the other mode, the igniter flashes and... nothing. The grain sits cold. The visual contrast between a working solid motor and a failed ignition is stark. Solid rockets are binary: they light or they don't. There is no throttle, no restart, no second chance.

---

### A5. Arduino: Scanning Camera Image Builder + Stage Separation LEDs

**What it is:** An Arduino project with two functions: (1) a phototransistor that scans across a scene and builds up an image line by line on an OLED display, mimicking Pioneer 2's TV camera, and (2) three LEDs representing the three stages -- green, green, red -- showing the ignition sequence and failure.

**Specification:**

```
ARDUINO PROJECT: Pioneer 2 TV Camera + Stage Monitor
======================================================

Hardware:
  - Arduino Nano ($8) or Uno ($25)
  - SSD1306 OLED display 128x64 ($8)
  - Phototransistor or LDR (light-dependent resistor) ($2)
  - Servo motor SG90 ($4) -- sweeps phototransistor across scene
  - 3x LEDs: green, green, red ($1)
  - 3x 220-ohm resistors ($1)
  - Pushbutton for launch ($1)
  Total: ~$25 (with Nano) to ~$40 (with Uno)

Software:
  - Adafruit SSD1306 library
  - Adafruit GFX library
  - Servo library (built-in)

BUILD 1: Line-by-Line Image Scanner (Pioneer 2 TV Camera)

  How it works:
    - Servo sweeps phototransistor through 180 degrees (one scan line)
    - Phototransistor reads light intensity at each position
    - 64 readings per sweep = one row of 64 pixels
    - After each sweep, advance to next row on OLED
    - Display builds up from top to bottom, one line at a time
    - Full image: 64 x 64 pixels (takes ~2 minutes to build)

  Display:
    ┌──────────────────────────┐
    │ PIONEER 2 TV   SCAN: 23 │
    │ ░▒▓█▓▒░░▒▓██▓▒░░▒▓█▓▒░ │ ← completed scan lines
    │ ░▒▓█▓▒░░▒▓██▓▒░░▒▓█▓▒░ │
    │ ▓▓▓▒▒░░░░░░░░░░░░░░░░░ │ ← current scan line (building)
    │ ........................ │ ← future lines (not yet scanned)
    │ ........................ │
    │ RES: 64x64   LINE: 23   │
    └──────────────────────────┘

  The Pioneer 2 connection:
    - Pioneer 2's TV camera would have built images the same way
    - Slow raster scanning: one line at a time
    - Image takes minutes to complete
    - Pioneer 2's 45-minute flight would have allowed only a
      handful of complete scans (if the camera had reached altitude)
    - The student's scanner IS the camera, in miniature

BUILD 2: Stage Separation Indicator

  Hardware layout:
    - 3 LEDs in a vertical row (bottom to top: Stage 1, 2, 3)
    - Labels: "THOR", "ABLE", "X-248"

  Sequence (triggered by button press):
    1. T+0: Stage 1 LED (green) lights solid, OLED shows "STAGE 1 BURN"
    2. T+3: Stage 1 LED blinks rapidly, then off (separation)
       OLED: "STAGE 1 SEP"
    3. T+4: Stage 2 LED (green) lights solid
       OLED: "STAGE 2 BURN"
    4. T+6: Stage 2 LED blinks rapidly, then off (separation)
       OLED: "STAGE 2 SEP"
    5. T+7: Stage 3 LED (red)...
       - Blinks once dimly, then OFF
       - OLED: "STAGE 3 -- NO IGNITION"
       - Piezo buzzer: three short beeps (alert tone)
    6. All LEDs off.
       OLED: "MISSION: BALLISTIC ARC"
       OLED: "ALTITUDE: 1,550 km"
       OLED: "FLIGHT TIME: ~45 min"

  "Fix" mode:
    - Hold button during Stage 3 → LED lights green
    - OLED: "STAGE 3 BURN -- NOMINAL"
    - After burn: OLED shows escape trajectory parameters
    - Demonstrates what should have happened

Build time: 3-4 hours assembly + code
Difficulty: Beginner-Intermediate
```

**Key learning moment:** BUILD 1 is experiential -- the student watches an image form painfully slowly, one scan line at a time, and understands what early TV cameras actually did. They also understand what Pioneer 2 lost: the chance to be the first spacecraft to send back television images. BUILD 2 makes the staging sequence physical: two green lights and then a red light that never commits.

---

### A6. Godot 4: 3-Stage Rocket Game -- Manage Ignition Timing

**What it is:** A Godot 4 game where the player manually triggers each stage ignition at the right moment. The game simulates the Pioneer 2 launch with real timing constraints. The player must: (1) ignite Stage 1 at T-0, (2) separate and ignite Stage 2 when Stage 1 burns out, (3) spin up the payload, and (4) ignite Stage 3 at the correct moment. Get the timing right and you reach escape velocity. Miss Stage 3 ignition (as Pioneer 2 did) and you get a 45-minute ballistic arc.

**Specification:**

```
GODOT 4 PROJECT: Pioneer 2 -- Stage Manager
=============================================

Scene:
  - Side-scrolling view of rocket ascending through atmosphere
  - Background: gradient from blue sky to black space
  - Altitude markers: 50 km, 100 km, 200 km, Karman line (100 km)
  - Stars appear as altitude increases
  - Earth curvature visible at high altitude

Gameplay:

  Phase 1: Pre-launch (5 seconds)
    - Rocket on pad, countdown display
    - Player sees three stage buttons: [STAGE 1] [STAGE 2] [STAGE 3]
    - All buttons grey (inactive)
    - HUD: Altitude, Velocity, Delta-V remaining, Stage status

  Phase 2: Stage 1 (press STAGE 1 button at T-0)
    - [STAGE 1] button turns green → player clicks to ignite
    - Thor engine ignites: flame particle effect, vibration shake
    - Rocket accelerates (physics: F=ma with drag and gravity)
    - Thrust gauge shows LR-79 burning at 667 kN
    - Fuel gauge depleting over ~165 seconds (compressed to ~20 seconds)
    - When fuel depletes: [STAGE 1] button flashes "SEPARATE"
    - Player must click to separate (1-second window)
    - Miss the window: staging delay penalty (less velocity)

  Phase 3: Stage 2 (press STAGE 2 button after separation)
    - [STAGE 2] button turns green after Stage 1 separation
    - AJ10-40 ignites: smaller flame, less vibration
    - Acceleration increases (much lighter vehicle now)
    - Thrust gauge: 35 kN
    - Fuel gauge: ~115 seconds (compressed to ~15 seconds)
    - Same separation timing challenge

  Phase 4: Spin-Up (automatic)
    - After Stage 2 separation, payload spins up to 1.8 rev/sec
    - Visual: spacecraft model begins rotating
    - HUD: "SPIN RATE: 1.8 REV/SEC -- STABLE"
    - 3-second window before Stage 3 ignition opportunity

  Phase 5: Stage 3 (press STAGE 3 button -- the critical moment)
    - [STAGE 3] button turns green... but only for 2 SECONDS
    - Player must click within the 2-second window
    - The window is intentionally tight -- this is the moment
      Pioneer 2 failed

    If player clicks in time:
      - X-248 solid motor ignites: bright flame
      - Acceleration spike (solid motor, high thrust-to-weight)
      - 16 seconds of burn (compressed to ~5 seconds)
      - Velocity crosses escape threshold
      - HUD: "ESCAPE VELOCITY ACHIEVED"
      - Trajectory curves outward -- Moon appears in distance
      - TV camera activates: crude scan-line image of Earth appears
      - Victory screen: "MISSION SUCCESS -- LUNAR TRANSIT"

    If player MISSES the window (Pioneer 2 scenario):
      - [STAGE 3] button turns RED
      - No ignition. No flame. Silence.
      - HUD: "STAGE 3 -- IGNITION FAILURE"
      - Spacecraft continues on ballistic arc (momentum only)
      - Camera zooms out to show the pathetic arc: up to 1,550 km, back down
      - TV camera activates anyway: partial scan, noisy, then static
      - 45-minute compressed flight in ~15 seconds
      - Impact screen: "FLIGHT TIME: 45 MINUTES"
      - "Pioneer 2 reached 1,550 km. The Moon is 384,400 km away."
      - "TRY AGAIN" button

  Scoring:
    - Perfect timing all stages: 100 points
    - Stage separation timing accuracy: +/- points
    - Stage 3 ignition: binary (0 or 50 points)
    - Bonus: maintain spin stability during Stage 3 burn
    - Achievement: "The Lost Camera" -- complete a successful flight
      and see the full TV camera image

Nodes:
  - Rocket (Node2D): multi-part sprite with separation animation
  - FlameEffect (GPUParticles2D): exhaust per stage
  - StageButtons (Control): three color-coded buttons
  - TelemetryHUD (Control): altitude, velocity, delta-v, fuel
  - TVCameraPanel (Control): scan-line image builder (top-right)
  - Background (ParallaxBackground): sky gradient + stars
  - AudioManager: engine roar per stage, silence on failure, alert beeps

Physics:
  - 1D vertical trajectory with gravity (9.81 - centrifugal at altitude)
  - Drag model: exponential atmosphere below 100 km
  - Stage-specific thrust curves and mass flow rates
  - Ballistic coast after last burn (Keplerian)

Deliverables:
  - Godot 4 project folder
  - Export: Linux x86_64 binary
  - Export: HTML5/WebAssembly (browser playable)

Build time: 10-16 hours
Difficulty: Intermediate
GDScript, no C# needed
```

**Key learning moment:** The 2-second window for Stage 3 ignition is the game. The student experiences the time pressure of a real ignition command -- you have a narrow window, and if you miss it, the motor will never fire. The game makes the Pioneer 2 failure personal: the first time the student misses the window and watches the rocket arc to 1,550 km instead of the Moon, they understand what happened on November 8, 1958. The TV camera image that slowly builds during a successful mission -- and never completes during a failure -- drives the loss home.

---

### A7. GMAT: Pioneer 2 Actual Trajectory vs Pioneer 1

**What it is:** A GMAT script comparing Pioneer 2's brief ballistic arc (1,550 km apogee, ~45 minutes) with Pioneer 1's 113,854 km, 43-hour flight. Both missions used the same Thor-Able vehicle, nearly identical hardware. The difference: Pioneer 1's third stage fired; Pioneer 2's did not.

**Specification:**

```
GMAT SCRIPT: Pioneer 2 vs Pioneer 1 Trajectory Comparison
============================================================

Scenario 1: Pioneer 2 -- Actual Flight (what happened)
  - Launch: Nov 8, 1958, 02:30 UTC, Cape Canaveral
  - Launch site: Cape Canaveral (28.4 N, 80.6 W)
  - Burn sequence:
    - Thor (LR-79): T+0, 165s, nominal
    - Able (AJ10-40): T+180s, 115s, nominal (FULL BURN -- not like P-1)
    - X248 solid: IGNITION FAILURE -- no burn
  - Initial conditions after Stage 2 burnout:
    - Altitude: ~200 km
    - Velocity: ~7,800 m/s (suborbital -- well below escape)
    - Flight path angle: ~35 deg above local horizontal
  - Result: ballistic arc, apogee ~1,550 km, flight ~45 minutes
  - Reentry: ~Nov 8, 03:15 UTC, western Africa

Scenario 2: Pioneer 1 -- Actual Flight (for comparison)
  - Launch: Oct 11, 1958, 08:42 UTC
  - Same vehicle, same pad
  - Burn sequence:
    - Thor: T+0, 165s, nominal
    - Able: T+180s, 105s (10 SECONDS SHORT)
    - X248: T+295s, 16s, nominal
  - Result: elliptical orbit, apogee 113,854 km, ~43 hours

Scenario 3: Pioneer 2 -- If Stage 3 Had Fired
  - Same as Scenario 1, but add:
    - X248: T+300s, 16s, nominal
    - Additional delta-v: ~2,800 m/s
  - Result: escape trajectory (hyperbolic), lunar transit

Spacecraft (Pioneer 2):
  - Dry mass: 39.2 kg (includes TV camera, heavier than Pioneer 1)
  - Cr (reflectivity): 1.2
  - Cd (drag): 2.2
  - Spin rate: 1.8 rev/s

Propagator:
  - Central body: Earth
  - Force model: JGM-2 gravity (8x8), lunar gravity, solar gravity
  - Drag: exponential atmosphere (relevant for Pioneer 2 only,
    never gets high enough to ignore it entirely)

Plots:
  - Triple trajectory overlay: P-2 actual (red) + P-1 actual
    (yellow) + P-2 intended (green dashed)
  - Altitude vs time: all three on same axes
    - P-2 actual: barely visible bump near x-axis (1,550 km)
    - P-1 actual: arc reaching 113,854 km (43 hours)
    - P-2 intended: escape trajectory
  - Velocity vs time: all three
    - P-2 actual: rises, then falls (never clears gravity)
    - P-1 actual: oscillates over 43 hours
    - P-2 intended: rises above escape velocity
  - Delta-v budget breakdown: stacked bar for each scenario
    - Shows exactly where Pioneer 2's budget stopped
  - Ground track: P-2's brief arc barely traces a line

The educational moment: The altitude plot is the killer. Pioneer 2's
arc is a small bump near the x-axis while Pioneer 1's arc sweeps
up to 113,854 km. Same rocket, same design, one missing ignition.
The 1,550 km apogee is below GPS orbit altitude (20,200 km),
below the inner Van Allen belt peak (3,000 km). Pioneer 2 never
reached the space environment that Pioneer 1 mapped.

File: pioneer2_vs_pioneer1.script
Duration: 4-6 hours to set up and run all three scenarios
Difficulty: Advanced
```

---

## B. Machine Learning -- What to Train

### B1. Image Reconstruction from Sparse TV Scan Data

**What it is:** Train a convolutional neural network to reconstruct complete images from partial TV camera scan data -- the kind of data Pioneer 2's camera would have produced if the mission had lasted long enough. The student works with deliberately degraded images, mimicking the resolution and scan artifacts of 1958 television technology.

```
Model: U-Net (encoder-decoder with skip connections)
Input: Sparse scan-line images
  - Full image: 256x256 grayscale (Earth from space)
  - Degradation: keep only N scan lines (N = 8, 16, 32, 64)
  - Add noise: Gaussian (SNR 10-30 dB, matching 1958 signal quality)
  - Scan artifacts: line-to-line brightness variation (AGC settling)
Output: Reconstructed full image (256x256)

Training data:
  - 5,000 synthetic Earth-from-space images
    - Source: NASA Blue Marble tiles, downsampled
    - Varying cloud cover, ocean/land ratio, limb angle
    - Altitude variation: 500 km to 5,000 km (Pioneer 2's range)
  - Degradation applied randomly: 8-64 scan lines, variable noise

Test data: 500 images, including 50 matching Pioneer 2's parameters
  - Altitude: 1,550 km
  - Camera angle: spinning (1.8 rev/sec smear)
  - Scan lines: 12-15 (estimated for 45-minute flight)

The student learns:
  - How much information is in a few scan lines (more than you think)
  - Skip connections preserve spatial structure from sparse input
  - Noise level vs. reconstruction quality (SNR matters enormously)
  - Why Pioneer 2's lost data was a real loss -- the camera
    was the most advanced instrument on the spacecraft

Libraries: PyTorch, torchvision, matplotlib
GPU: RTX 4060 Ti (8GB sufficient for U-Net at 256x256)
Training time: ~30 minutes
Difficulty: Intermediate
```

### B2. Failure Prediction from Telemetry

**What it is:** Train a gradient-boosted classifier to predict ignition failure from pre-ignition telemetry features. The model learns which telemetry signatures predict successful vs. failed solid motor ignition, using features derived from the Pioneer program's experience.

```
Model: XGBoost binary classifier
Input: Pre-ignition telemetry features (15 features)
  - Motor temperature (ambient, grain, igniter)
  - Spin rate at ignition command
  - Time since spin-up (thermal soak time)
  - Stage 2 separation dynamics (shock magnitude, timing)
  - Battery voltage at ignition command
  - Squib circuit continuity check (resistance)
  - Grain age since manufacture (propellant condition)
  - Ambient vibration level (post-staging transient)
  - Igniter pyrotechnic charge temperature
  - Command signal timing accuracy

Training data: 10,000 synthetic ignition attempts
  - 92% nominal ignitions (solid motors are generally reliable)
  - 8% failures with various cause distributions:
    - 3%: squib failure (electrical)
    - 2%: propellant conditioning (too cold, grain cracks)
    - 1.5%: igniter-to-grain gap too large
    - 1%: separation shock damage
    - 0.5%: command timing outside window

Output: probability of successful ignition (0-1)
  - Classification threshold: 0.85 (conservative -- flag anything
    below 85% as a potential failure)

Feature importance analysis:
  - Which telemetry features best predict ignition failure?
  - The student discovers that squib circuit resistance and grain
    temperature dominate -- simple checks that could prevent failures

The student learns:
  - Binary classification with class imbalance (most ignitions succeed)
  - Feature importance in decision trees (which sensors matter most?)
  - The difference between prediction and prevention (Pioneer 2 had
    no real-time failure prediction capability)
  - Why pre-flight checkout procedures exist (they ARE the classifier,
    implemented as human-executed decision trees)

Libraries: xgboost, scikit-learn, matplotlib, shap (for explainability)
GPU: Not needed (XGBoost on CPU is fast for tabular data)
Training time: ~2 minutes
Difficulty: Beginner-Intermediate
```

---

## C. Computer Science -- What Pioneer 2 Teaches

### C1. State Machines for Ignition Sequences

Pioneer 2's launch sequence is a textbook finite state machine. Each stage transition depends on the previous state completing successfully.

**The state machine:**
```
IDLE → COUNTDOWN → STAGE1_BURN → STAGE1_SEP → STAGE2_BURN → STAGE2_SEP
  → SPIN_UP → STAGE3_ARM → STAGE3_IGNITE_CMD → (STAGE3_BURN | STAGE3_FAIL)
  → COAST → (ESCAPE | BALLISTIC_ARC) → (LUNAR_TRANSIT | REENTRY)
```

Pioneer 2's path through this state machine:
```
IDLE → COUNTDOWN → STAGE1_BURN → STAGE1_SEP → STAGE2_BURN → STAGE2_SEP
  → SPIN_UP → STAGE3_ARM → STAGE3_IGNITE_CMD → STAGE3_FAIL
  → COAST → BALLISTIC_ARC → REENTRY
```

**Exercise 1:** Implement the complete launch state machine in Python (or TypeScript or Rust). Each state has:
- Entry actions (what happens when you enter the state)
- Exit conditions (what must be true to leave)
- Failure transitions (what happens if the exit condition fails)
- Telemetry outputs (what data is transmitted in each state)

Make the state machine deterministic: given the same inputs, it always produces the same outputs. Then run it with Pioneer 0 inputs (Stage 1 failure), Pioneer 1 inputs (Stage 2 underperformance), and Pioneer 2 inputs (Stage 3 no-ignition). The same state machine traces three different paths through the graph.

**Exercise 2:** Add a watchdog timer to each state. If a state does not transition within its expected duration, the watchdog triggers an anomaly flag. Pioneer 2's Stage 3 failure would have triggered a watchdog ~2 seconds after the ignition command, when chamber pressure did not rise. This is the basis of all modern launch vehicle health monitoring.

### C2. Protocol Design: Command Verification

Pioneer 2's third stage ignition was commanded by an onboard timer, not by ground control. The command was: "at time T, fire squib to ignite X-248 motor." There was no verification that the command was received, no confirmation that the squib fired, no feedback loop.

**The problem:** In 1958, the command path was open-loop. Fire and hope.

**Exercise:** Design a command verification protocol for a 1958-era spacecraft with these constraints:
- Uplink bandwidth: 5 bits/second (simple tone commands)
- Downlink bandwidth: 64.8 bits/second (telemetry)
- Round-trip light time: negligible (near Earth)
- Latency: ~2 seconds (ground processing + radio propagation)

The protocol must:
1. Send ignition command
2. Receive acknowledgment (squib circuit closed)
3. Verify ignition (chamber pressure rising)
4. Abort if verification fails within 3 seconds (but what does "abort" mean for a solid motor? -- this is the design tension)

The student discovers the fundamental problem: a solid motor cannot be stopped once ignited, and cannot be restarted if ignition fails. The verification protocol can only confirm or deny -- it cannot correct. This is why Pioneer 2's failure was unrecoverable. There was no second chance.

**Extension:** Compare this to modern launch vehicle command protocols (Falcon 9 uses engine-out detection and correction in real time). Show how the protocol design evolved from Pioneer's open-loop to modern closed-loop with redundancy.

---

## D. Game Theory -- What Trade-Offs

### D1. Risk of Adding Complexity (TV Camera) vs Mission Success Probability

Pioneer 2 was the first Pioneer with a TV camera -- an addition that increased spacecraft mass from 34.2 kg (Pioneer 1) to 39.2 kg and added significant electrical and mechanical complexity. The camera required power, thermal management, a scan mechanism, and a data downlink channel.

**Payoff matrix:**

| | Mission Succeeds (Stage 3 fires) | Mission Fails (Stage 3 doesn't fire) |
|---|---|---|
| **With TV camera** | Images from lunar distance + radiation data + PRESTIGE (VERY HIGH) | 45-minute flight, camera data is near-Earth only (LOW) |
| **Without TV camera** | Radiation data + magnetometer + lighter spacecraft (HIGH) | 45-minute flight, same instruments as Pioneer 1 (LOW) |

**The twist:** The TV camera added 5 kg of mass. In the delta-v equation (Tsiolkovsky), this reduces the payload mass ratio and therefore reduces the delta-v from each stage. For a system already operating near the escape threshold, every kilogram matters.

**Exercise 1:** Calculate the delta-v impact of the 5 kg TV camera addition. Use the Tsiolkovsky equation with Pioneer 2's stage parameters. How many m/s did the camera cost? Was it within the system's margin?

**Exercise 2:** Model this as a multi-attribute decision problem. The TV camera adds:
- 10% probability of additional failure mode (camera mechanism jam affecting spin, power drain)
- 200% increase in scientific return if mission succeeds (images vs. no images)
- 0% benefit if mission fails early (camera data from 1,550 km is nearly worthless)
- Political value: demonstrating TV from space capability, even briefly

Calculate the expected utility with and without the camera. Show that the camera was the right decision IF the stages were reliable -- the expected value of images was very high. But the camera did not cause the failure. The third stage would have failed with or without the camera. The 5 kg mass penalty was within margin. Pioneer 2's failure was orthogonal to the camera decision.

**The deeper lesson:** Adding capability (complexity) is often blamed for failures it did not cause. Post-hoc analysis must separate "what caused the failure" from "what was different about this mission." The camera was different. The ignition failure was the cause. These are independent.

---

## E. Creative Arts -- What to Create

### E1. Pioneer 2 TV Camera Images as Generative Art

**What it is:** A generative art series imagining what Pioneer 2's TV camera would have captured at various points in its brief flight and what it would have seen on a successful lunar transit. The images use authentic 1958 TV camera constraints: 32x32 resolution, analog scan artifacts, limited dynamic range.

```
GENERATIVE ART: "The Images That Never Were"
===============================================

Series: 6 images, each rendered at multiple resolutions
  (32x32 authentic, 256x256 enhanced, 1024x1024 artistic interpretation)

Image 1: T+10 minutes, altitude 200 km
  - View: Earth limb, curvature just visible
  - Content: Florida coastline (Cape Canaveral below)
  - At 32x32: barely distinguishable land/sea boundary
  - Scan artifacts: line-to-line brightness variation
  - This image: Pioneer 2 COULD have captured this

Image 2: T+25 minutes, altitude 1,000 km
  - View: wider Earth view, cloud patterns visible
  - Content: southeastern United States
  - At 32x32: recognizable coastline, cloud blobs
  - This image: Pioneer 2 probably DID get partial scans here

Image 3: T+40 minutes, altitude 1,550 km (apogee)
  - View: Earth fills most of frame, horizon clearly curved
  - Content: Atlantic Ocean, North Africa approaching terminator
  - At 32x32: distinctive Earth features, terminator shadow
  - This image: Pioneer 2's best possible view, briefly

Image 4: IMAGINED -- altitude 10,000 km (if Stage 3 had fired)
  - View: whole Earth disk fits in frame
  - Content: Africa, Europe, Middle East from deep space
  - At 32x32: recognizable continental outlines
  - Color: false-color from single-channel scanning

Image 5: IMAGINED -- altitude 50,000 km
  - View: Earth as small disk, surrounded by blackness
  - At 32x32: Earth is ~10 pixels across -- precious detail

Image 6: IMAGINED -- lunar distance, 384,400 km
  - View: Earth as pale dot, Moon surface filling frame
  - At 32x32: Earth is 1-2 pixels, Moon terrain dominates
  - This image: what Pioneer 2's camera was designed for

Output per image:
  - SVG grid (32x32, each pixel as a colored square with scan-line gap)
  - PNG at native 32x32 (pixel art)
  - PNG upscaled to 1024x1024 with CRT shader effects (scan lines,
    bloom, phosphor glow)
  - Side-by-side: what the camera would see vs. what was there

Tools: Python (numpy + PIL) or p5.js
Build time: 4-6 hours for all 6 images
Difficulty: Intermediate generative art
```

### E2. Black-capped Chickadee Call Patterns as Data Sonification

**What it is:** A sound design piece mapping Pioneer 2's telemetry to the vocal repertoire of the black-capped chickadee (Poecile atricapillus). The chickadee's "chick-a-dee-dee-dee" call varies in complexity based on threat level -- more "dee" notes signal greater danger. Pioneer 2's escalating systems status maps directly onto this alarm encoding.

```
SOUND DESIGN: "Dee-Dee-Dee"
==============================

The chickadee's call system:
  - "Fee-bee": two-note song, calm, territorial, all is well
  - "Chick-a-dee": base contact call, normal status
  - "Chick-a-dee-dee": mild alert (predator detected, distant)
  - "Chick-a-dee-dee-dee-dee": high alert (predator close, dangerous)
  - More "dee" notes = higher threat level

Mapping to Pioneer 2 mission timeline:

  Pre-launch (10 sec):
    - "Fee-bee" pattern: calm, two-note melody
    - Soft forest ambience background

  Stage 1 burn (20 sec):
    - "Chick-a-dee" base call: everything nominal
    - Engine rumble as low-frequency bed
    - One "dee" note per telemetry frame (heartbeat)

  Stage 1 separation (3 sec):
    - Brief silence (staging event)
    - "Chick-a-dee-dee": mild alert during staging transient

  Stage 2 burn (15 sec):
    - Return to "Chick-a-dee" base call
    - Lighter engine sound (smaller motor)
    - Systems nominal -- calm calls

  Stage 2 separation + spin-up (5 sec):
    - "Chick-a-dee-dee": alert during separation
    - Spin-up: buzzy undertone (1.8 Hz modulation)

  Stage 3 ignition command (3 sec):
    - "Chick-a-dee-dee-dee": increasing "dee" count
    - Tension rising -- waiting for ignition confirmation

  Stage 3 FAILURE (5 sec):
    - "Chick-a-dee-dee-dee-dee-dee-dee": maximum alarm
    - Each "dee" note at increasing pitch
    - The call stretches out -- sustained alarm, no resolution
    - Background: silence. No engine. No thrust.

  Ballistic coast (30 sec):
    - Calls slow, become quieter
    - "Dee" count gradually decreases (threat fading --
      not because it is resolved, but because there is nothing
      left to alert about)
    - Forest ambience returns slowly
    - Occasional single "fee-bee" (acceptance, endurance)

  Reentry (10 sec):
    - Final "chick-a-dee" -- single, soft, like a last transmission
    - Fade to forest silence
    - One real chickadee field recording (CC0) as coda

Total duration: ~2 minutes
Background: PNW forest ambience (rain, wind in branches)
  recorded at low level throughout

Tools: SuperCollider (synthesis) + Audacity (arrangement)
  - Chickadee "dee" notes: band-passed noise burst + formant filter
  - "Fee-bee": pure tone with slight vibrato
  - Modulation: telemetry data drives "dee" count and pitch

Output: WAV (lossless) + MP3 (web)
Difficulty: Intermediate audio synthesis
Build time: 4-6 hours
```

### E3. Salal Berry Cluster Visualizations

**What it is:** A generative art piece mapping Pioneer 2's staging sequence and flight data onto the structure of a salal (Gaultheria shallon) berry cluster. Salal produces clusters of dark purple-black berries arranged along a raceme (elongated flower stem). Each berry in the cluster represents a mission phase; its size and color encode the phase outcome.

```
GENERATIVE ART: "Salal Mission Cluster"
==========================================

Botanical reference:
  - Salal produces racemes of 5-15 berries
  - Berries ripen from green through red to dark purple-black
  - Unripe berries are smaller and lighter
  - Each berry sits on a short pedicel (stem) off the main raceme
  - Leaves: thick, leathery, oval, glossy dark green

Structure mapping:
  - Main raceme stem = mission timeline (vertical, bottom to top)
  - Berry 1 (bottom): Stage 1 burn -- large, dark purple (nominal)
  - Berry 2: Stage 1 separation -- small green (transitional)
  - Berry 3: Stage 2 burn -- large, dark purple (nominal)
  - Berry 4: Stage 2 separation -- small green (transitional)
  - Berry 5: Spin-up -- medium, reddish (intermediate)
  - Berry 6: Stage 3 ignition command -- medium, turning red
  - Berry 7: Stage 3 FAILURE -- small, pale green, WITHERED
    - This berry did not ripen. It sits shriveled on the raceme.
    - The remaining berries above it (coast, data, reentry) are
      smaller and paler than they should be -- stunted by the
      failure below.
  - Berry 8: Ballistic coast -- small, pale, hanging low
  - Berry 9: TV camera activation -- small, barely colored,
    with a tiny lens-like highlight
  - Berry 10: Reentry -- dark, but small, fallen from the raceme
    (lying at the base of the stem)

  Comparison raceme (drawn alongside):
    - Pioneer 1: 10 berries, most ripe, Berry 3 slightly smaller
      (Stage 2 underperformance), but Berry 7+ fully ripe
    - The visual comparison: two salal racemes side by side,
      one full and heavy with ripe berries, the other stunted
      with a withered berry at position 7

Color palette:
  - Ripe berry: #1A0A2E (deep purple-black)
  - Nominal phase: #3B1261 (dark purple)
  - Intermediate: #8B2252 (red-purple)
  - Transitional: #4A7C59 (green)
  - Failed/withered: #8B8B6A (olive-grey, desiccated)
  - Leaves: #2D5A27 (glossy dark green)
  - Raceme stem: #5C3A1E (woody brown)

Output:
  - SVG (vector, print-quality)
  - PNG at 4K resolution
  - Animated version: berries ripen in sequence along the timeline;
    Berry 7 starts ripening, then withers and shrinks

Tools: p5.js (web) or Processing or Python (matplotlib custom)
Build time: 4-6 hours
Difficulty: Intermediate generative art

The PNW connection: salal blankets the understory of every
Pacific Northwest forest. It is the most common shrub in western
Washington and Oregon. Indigenous peoples have harvested the
berries for thousands of years -- the Chinook word "shallon"
gives the plant its species name. Foxy walks through salal
every day. The berry clusters are everywhere, at knee height,
along every trail.
```

---

## F. Problem Solving -- Engineering Methodology

### F1. Progressive Failure Analysis: Pioneer 0-1-2

**What it is:** A systematic analysis of how failure migrated upward through the Pioneer program's staging chain. Each mission fixed the previous failure and revealed the next one. The exercise teaches iterative debugging methodology -- the same approach used in software development.

```
FAILURE ANALYSIS: The Pioneer Progression
============================================

Method: Comparative failure analysis + fix verification matrix

Mission | Primary Failure | Stage | Root Cause | Fix Applied to Next Mission
--------|----------------|-------|------------|---------------------------
P-0     | Turbopump      | 1     | Bearing    | Improved bearing
 (Aug)  | explosion T+77 |       | lubrication| specification + testing
        |                |       |            |
P-1     | 2nd stage cut  | 2     | Accelero-  | Full-duration burn
 (Oct)  | off 10s early  |       | meter bias | timer as backup to
        |                |       | + guidance | accelerometer
        |                |       |            |
P-2     | 3rd stage no   | 3     | Igniter    | Improved ignition
 (Nov)  | ignition       |       | failure or | train + redundant
        |                |       | signal path| squib circuits

Observation: Each failure occurred ONE STAGE HIGHER than the previous.
  P-0: Stage 1 failed → Stage 2 and 3 never tested in flight
  P-1: Stage 1 nominal, Stage 2 failed → Stage 3 worked
  P-2: Stage 1 nominal, Stage 2 nominal, Stage 3 failed

This is progressive debugging:
  1. Fix the lowest-level failure first
  2. Run the system again
  3. The NEXT failure reveals itself (it was always there,
     masked by the earlier failure)
  4. Fix that failure
  5. Repeat until the system works end-to-end

The pattern is identical to software debugging:
  - Fix the first crash, get a new crash further along
  - Fix the second crash, get a logic error in the output
  - Fix the logic error, discover a performance problem
  - Each fix reveals the next layer

Exercise 1: Fault tree analysis
  Draw a fault tree for "Pioneer program fails to reach the Moon"
  with top event at the root. Show that P-0, P-1, and P-2 each
  cut one branch of the tree. P-3 (Dec 1958) will need all
  remaining branches to hold.

Exercise 2: Fix verification matrix
  Create a matrix: rows = known failure modes, columns = missions.
  Mark each cell: UNTESTED (masked by earlier failure), TESTED-PASS,
  TESTED-FAIL, FIXED. Show that by Pioneer 2, Stage 1 is
  TESTED-PASS (twice), Stage 2 is TESTED-PASS (once, after fix),
  and Stage 3 is TESTED-FAIL. Pioneer 3 must be the first to
  test the Stage 3 fix.

Exercise 3: Coverage analysis
  How many end-to-end test paths exist in a 3-stage rocket?
  How many have been tested by Pioneer 2? What is the test
  coverage percentage? (Answer: very low -- each mission tests
  ONE path through the state space, and there are failure modes
  that haven't been encountered yet.)

Duration: 3 hours
Difficulty: Intermediate
```

**The meta-lesson:** Pioneer 2 did not repeat Pioneer 1's failure. The second stage burned for the full duration. The fix worked. But fixing one stage revealed the next stage's weakness. This is the nature of complex systems: you cannot test all failure modes simultaneously. You discover them in series, one per flight. The program learned one lesson per mission, at the cost of one spacecraft per lesson.

---

## G. GSD Self-Improvement -- What This Mission Teaches the System

### G1. New Pattern: Progressive Debugging (Fix One, Find the Next)

```
Pattern derived from Pioneer 0-1-2:
  Each Pioneer mission fixed the previous failure and uncovered a new
  one at the next level. P-0 fixed the bearing → P-1 revealed the
  accelerometer → P-2 revealed the igniter. The failure migrated
  upward through the stack.

  GSD application:
    When a multi-phase plan fails at Phase N:
    1. Fix Phase N's root cause
    2. Re-execute from Phase N (not from the beginning)
    3. EXPECT a failure at Phase N+1 (it was masked before)
    4. Track the "failure waterline" -- the highest phase that
       has been tested end-to-end

    The waterline tells you where you are:
    - Below the waterline: tested, known-good
    - At the waterline: current point of failure
    - Above the waterline: UNTESTED (not "working" -- untested)

    Never assume phases above the waterline are working just
    because they haven't failed yet. They haven't been reached
    yet. That is not the same thing.

  This is the Pioneer 2 lesson: "The third stage always worked
  in ground testing. It just never worked in flight." Untested
  in context is untested.
```

### G2. New Pattern: Failure-as-Learning Metrics

```
Pattern derived from Pioneer 0-1-2:
  Three Pioneer failures in four months. By conventional metrics,
  the program was failing at 100%. By learning metrics, each
  failure advanced the system:
  - P-0: learned that Stage 1 bearing needs better spec (cost: 77 seconds)
  - P-1: learned that accelerometer calibration needs margin (cost: 43 hours)
  - P-2: learned that solid motor ignition needs redundancy (cost: 45 minutes)

  Note the asymmetry: the "cost" of each failure was the flight time,
  but the LEARNING was about a specific subsystem. Short flights are
  cheap failures (less fuel, less time, less ground station cost).
  Long flights that fail are expensive but teach more about the
  upper stack.

  GSD application:
    When tracking failure metrics, add learning metrics alongside:
    - failure_count: 3
    - learning_events: 3 (1:1 -- every failure taught something new)
    - repeated_failures: 0 (no failure mode repeated -- each was novel)
    - fix_verification: 2 of 3 fixes verified in subsequent flights
    - coverage_advancement: failure waterline moved from Stage 1 to Stage 3

    A program where failure_count increases but learning_events
    stagnates is in trouble. A program where every failure produces
    a unique learning event and the waterline advances is making
    progress, even if the success count is zero.

  Pioneer 2's contribution: verified that the Stage 2 fix worked
  (full-duration burn), advanced the waterline to Stage 3,
  and identified the next subsystem to fix. That IS progress.
  Sometimes progress looks like failure.
```

### G3. New Rule Candidate: The Untested-is-Unknown Rule

```
Proposed hard rule:
  "Any component or phase that has not been tested in the actual
  execution context is in an UNKNOWN state, regardless of how many
  times it has been tested in isolation."

Derived from: Pioneer 2's X-248 solid motor passed all ground tests.
It was tested in vacuum chambers, in vibration fixtures, in thermal
cycling. It had fired successfully in Pioneer 1 (a different unit,
same design). The specific flight unit on Pioneer 2 never ignited.
Ground testing and flight testing are different contexts.

GSD application:
  When reviewing a multi-phase plan:
  - If Phase 4 depends on Phase 3's output, and Phase 3 has only
    been tested with mock data, Phase 4 is UNTESTED regardless
    of how many unit tests it passes in isolation.
  - Integration testing is not optional. It is the only test that
    matters for system-level success.
  - Mark phases as: UNIT-TESTED, INTEGRATION-TESTED, or
    FLIGHT-TESTED (end-to-end with real data, real dependencies).
  - Only FLIGHT-TESTED phases can be counted as reliable in
    schedule estimates.

Pioneer 2's Stage 3 was UNIT-TESTED. It needed to be
FLIGHT-TESTED. Those are different things, and the difference
is a 45-minute arc instead of a lunar transit.
```
