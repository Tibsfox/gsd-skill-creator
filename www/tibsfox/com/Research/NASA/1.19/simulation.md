# Mission 1.19 -- Mercury-Redstone 3: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Redstone 3 / Freedom 7 (May 5, 1961) -- Alan Shepard Suborbital Flight
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Dicamptodon tenebrosus (Pacific giant salamander)
**Bird:** Falco peregrinus (Peregrine Falcon, degree 19)
**Dedication:** Soren Kierkegaard (May 5, 1813 -- November 11, 1855)

---

## A. Simulations -- What to Build Locally

### A1. Python: Suborbital Trajectory Comparator (Shepard vs Ham vs Gagarin)

**What it is:** A Python tool that computes and visualizes the complete suborbital trajectories of Freedom 7 (Shepard, MR-3), MR-2 (Ham), and for context, the orbital trajectory of Vostok 1 (Gagarin) -- plotted on the same diagram to show the scale difference between suborbital and orbital, and between the planned MR-3 trajectory and the off-nominal MR-2 trajectory. The student adjusts launch parameters (burnout velocity, flight path angle, burnout altitude) and watches how the trajectory changes.

**Why it matters:** Shepard's flight was 23 days after Gagarin's. Placing all three trajectories on the same plot reveals the scale: Gagarin circled the Earth at 327 km for 108 minutes. Shepard arced to 187.5 km and came down 486 km away in 15 minutes. Ham arced to 253 km and came down 679 km away in 16 minutes -- but his trajectory was unplanned (abort system fired). The comparison reveals both the ambition gap (suborbital vs orbital) and the precision gap (planned vs off-nominal).

**Specification:**

```python
# mr3_trajectory_comparator.py
# Freedom 7 suborbital trajectory comparator
#
# Process:
#   1. Compute ballistic trajectory for Freedom 7 (MR-3)
#   2. Compute ballistic trajectory for Ham (MR-2, off-nominal)
#   3. Compute Gagarin's orbital trajectory (Vostok 1)
#   4. Plot all three on the same Earth-centered diagram
#   5. Show altitude vs time, velocity vs time, g-force vs time
#   6. Allow user to adjust launch parameters
#
# Parameters (user-adjustable):
#   burnout_velocity_ms: 1000-8000 (default 2294, Freedom 7)
#   flight_path_angle_deg: 20-80 (default 45)
#   burnout_altitude_km: 30-100 (default 60)
#
# Preset trajectories:
#   "Freedom 7 (Shepard)": v=2294, gamma=45, h=60
#   "MR-2 (Ham)": v=2292+1300 (abort boost), gamma=50, h=60
#   "Vostok 1 (Gagarin)": v=7820, gamma=0, h=200 (orbital)
#   "Custom": user-set parameters
#
# Visualization:
#   - Plot 1: Earth-centered trajectory view (main display)
#     Earth: blue circle, radius 6371 km
#     Atmosphere: thin blue ring (100 km)
#     Freedom 7 trajectory: green arc (187.5 km apogee)
#     MR-2 trajectory: orange arc (253 km apogee)
#     Vostok 1 trajectory: red circle (327 km orbit)
#     Scale: trajectories are TINY compared to Earth
#     Annotations:
#       "Freedom 7: 187.5 km, 15 min"
#       "MR-2: 253 km, 16 min (off-nominal)"
#       "Vostok 1: 327 km, orbiting (108 min)"
#     Inset: zoomed view of the two suborbital trajectories
#       showing the difference between planned (MR-3) and
#       off-nominal (MR-2)
#
#   - Plot 2: Altitude vs time
#     X-axis: time (0-120 minutes for Gagarin, 0-16 min for subs)
#     Y-axis: altitude (0-400 km)
#     Freedom 7: green parabolic arc, peak 187.5 km at ~5 min
#     MR-2: orange parabolic arc, peak 253 km at ~5.5 min
#     Vostok 1: red horizontal line at ~327 km (constant altitude)
#     Karman line (100 km) shown as dashed horizontal
#     Annotation:
#       "Shepard: 5 min above Karman line"
#       "Gagarin: 108 min above Karman line"
#       "Both 'in space' but qualitatively different"
#
#   - Plot 3: Velocity vs time
#     X-axis: time (0-16 min for suborbital focus)
#     Y-axis: velocity (0-8000 m/s)
#     Freedom 7: green curve (2294 at burnout, decreasing to
#       near-zero at apogee, increasing during descent,
#       spike at reentry)
#     MR-2: orange curve (higher burnout v due to abort)
#     Vostok 1 reference line: 7820 m/s (off-scale for
#       suborbital plot, shown as label)
#     Annotation:
#       "Orbital velocity (7800 m/s) is 3.4x Freedom 7's max"
#       "But requires 11.6x more energy (v^2 scaling)"
#
#   - Plot 4: G-force vs time
#     X-axis: time (0-16 min)
#     Y-axis: g-force (0-16 g)
#     Freedom 7: green curve
#       Launch: ramp to 6.3g at burnout
#       Coast: ~0g (weightless, ~302 seconds)
#       Reentry: spike to 11.6g
#     MR-2: orange curve
#       Launch: similar profile
#       Reentry: spike to 14.7g (higher due to steeper entry)
#     Horizontal lines: 6g (fighter jet), 9g (human limit
#       sustained), 12g (Mercury design limit)
#     Annotation:
#       "Ham survived 14.7g (off-nominal)"
#       "Shepard experienced 11.6g (as planned)"
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. Plot 1 reveals the humbling scale: both suborbital trajectories are barely visible arcs against the Earth's curvature, while Gagarin's orbit wraps around the entire planet. The political rivalry between a 15-minute arc and a 108-minute orbit becomes viscerally clear.
2. Plot 4 shows the g-force signature of each flight. Shepard's is cleaner (planned trajectory, symmetric g-peaks) while Ham's is rougher (abort-induced asymmetry, higher reentry g). The student sees that a nominal trajectory is not just better for data -- it is physically easier on the occupant.

---

### A2. Python: Manual Control Bandwidth Calculator

**What it is:** A Python tool that models the human-in-the-loop control bandwidth for Mercury manual attitude control. The student inputs human reaction time, thruster characteristics, and capsule inertia, and the tool computes the control loop frequency, Shannon information rate, and fuel consumption rate for manual vs automatic control. Side-by-side comparison of Shepard's proportional control vs the ASCS bang-bang control reveals why the human pilot was more fuel-efficient despite being slower.

**Why it matters:** The "spam in a can" debate was ultimately a question about information theory: does the human pilot's 8-bit/second control channel add enough value to justify the complexity of life support? This simulation quantifies the answer: the human's proportional control uses less fuel per maneuver than the automatic system's bang-bang control, because the human can apply exactly the right impulse while the automatic system can only apply full-on or full-off.

**Specification:**

```python
# mr3_manual_control.py
# Freedom 7 manual control bandwidth and fuel efficiency calculator
#
# Process:
#   1. Model the Mercury capsule as a rigid body with three
#      principal moments of inertia
#   2. Model the H2O2 thruster system (torque, fuel flow rate)
#   3. Model the human pilot (reaction time, input resolution)
#   4. Model the ASCS (bang-bang controller, deadband, cycle rate)
#   5. Simulate both controllers maintaining a target attitude
#   6. Compare: control accuracy, fuel consumption, response time
#
# Parameters (user-adjustable):
#   human_reaction_ms: 100-500 (default 200)
#   human_input_resolution: 5-20 levels (default 10)
#   thruster_torque_Nm: 1-5 (default 2.2)
#   capsule_moi_pitch_kgm2: 50-200 (default 100)
#   capsule_moi_roll_kgm2: 20-100 (default 40)
#   ascs_deadband_deg: 0.5-5.0 (default 2.0)
#   ascs_cycle_time_ms: 50-500 (default 200)
#   target_attitude_deg: 0-360 (default 0, hold position)
#   disturbance_rate_deg_s: 0-2 (default 0.5, drift from
#     aerodynamic or gravitational torque)
#
# Visualization:
#   - Plot 1: Attitude vs time (main comparison)
#     X-axis: time (0-60 seconds)
#     Y-axis: pitch attitude (-10 to +10 degrees from target)
#     Green curve: human pilot (proportional control)
#       - Smooth corrections, gradual convergence
#       - Response lag of ~650 ms
#       - Overshoots are small (human anticipates)
#     Red curve: ASCS (bang-bang control)
#       - Sawtooth pattern within deadband
#       - No response lag (immediate activation)
#       - Overshoots to deadband boundary, reverses
#     Target: horizontal line at 0 degrees
#     Deadband boundaries: dashed lines at +/- 2 degrees
#
#   - Plot 2: Fuel consumption vs time
#     X-axis: time (0-60 seconds)
#     Y-axis: cumulative fuel consumed (grams of H2O2)
#     Green curve: human pilot -- lower slope, longer pulses
#       spaced further apart
#     Red curve: ASCS -- higher slope, frequent short pulses
#     Annotation:
#       "Human: X grams in 60 seconds (proportional)"
#       "ASCS: Y grams in 60 seconds (bang-bang)"
#       "Human uses Z% less fuel for same accuracy"
#
#   - Plot 3: Thruster firing pattern
#     X-axis: time (0-60 seconds)
#     Y-axis: thruster on/off (binary, stacked for + and -)
#     Green: human pilot firings (fewer, variable duration)
#     Red: ASCS firings (frequent, fixed duration)
#     The visual difference is striking: the human pattern
#     looks purposeful; the ASCS pattern looks like noise
#
#   - Plot 4: Information rate
#     Bar chart:
#       Human pilot: ~8 bits/second (3 axes, 10 levels, 0.77 Hz)
#       ASCS: ~15 bits/second (3 axes, 2 levels, 2.5 Hz)
#       Modern fly-by-wire: ~100 bits/second
#       Computer autopilot: ~10,000 bits/second
#     Annotation:
#       "Higher bandwidth does not always mean better control"
#       "Shepard's 8 bits/s were more fuel-efficient than
#        the ASCS's 15 bits/s because each bit carried more
#        meaning (proportional vs binary)"
#
# Libraries: numpy, matplotlib, scipy.integrate
# Difficulty: Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. Plot 2 quantifies the fuel efficiency advantage of proportional control. The student sees that the human pilot, despite being slower, uses 20-40% less fuel to maintain the same attitude accuracy. This is because each human input carries more information (proportional, with anticipation) than each ASCS input (binary, reactive).
2. Plot 4 reveals the paradox: the ASCS has higher bandwidth (more bits per second) but lower efficiency (more fuel per degree of correction). The human has lower bandwidth but higher semantic content per bit. This is a fundamental information theory lesson: channel capacity is not the same as information value.

---

### A3. Web: "Can You Fly Freedom 7?" -- Manual Attitude Control Game

**What it is:** A browser-based manual attitude control simulator. The player uses keyboard or mouse to fire hydrogen peroxide thrusters and maintain the Mercury capsule's attitude during Freedom 7's five-minute weightless phase. The capsule drifts due to simulated disturbances (gravity gradient, venting, asymmetric forces), and the player must keep all three axes (pitch, yaw, roll) within deadband limits while minimizing fuel consumption. Performance is compared to Shepard's actual performance.

**Specification:**

```
WEB APPLICATION: "Can You Fly Freedom 7?"
==========================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

GAME CONCEPT:
  The player is Shepard. The capsule is in free flight at
  187.5 km altitude. No engine, no atmosphere, just the
  hydrogen peroxide thrusters. The capsule drifts. The player
  must correct the drift using thruster inputs.

  CONTROLS:
    Keyboard:
      W/S: pitch up/down (fire pitch thrusters)
      A/D: yaw left/right (fire yaw thrusters)
      Q/E: roll left/right (fire roll thrusters)

    Or mouse:
      Click and drag in the center of the attitude ball
      to fire thrusters proportionally. Direction of drag
      = axis + direction. Drag distance = pulse duration.

  PHYSICS:
    Capsule model:
      I_pitch = 100 kg*m^2
      I_yaw   = 100 kg*m^2
      I_roll  = 40 kg*m^2
      Thruster torque: 2.2 N*m
      Angular acceleration: 0.022 rad/s^2 (pitch/yaw)
                            0.055 rad/s^2 (roll)

    No damping (space -- no air resistance).
    Once the capsule starts rotating, it continues
    until an opposing thruster firing stops it.

    Disturbances:
      Random drift torques applied every 2-5 seconds,
      magnitude 0.001-0.005 rad/s^2 (simulating
      gravity gradient, solar radiation pressure,
      and venting)

  MISSION PHASES:

  Phase 1: ORIENTATION (30 seconds)
    The capsule is presented with a target attitude
    (indicated on the attitude ball). The player must
    maneuver to the target. This tests basic thruster
    control: fire a thruster, wait, fire the opposing
    thruster to stop.

  Phase 2: HOLD (60 seconds)
    Maintain the target attitude within +/- 5 degrees
    on all three axes while disturbances try to push
    the capsule off target. This is the real test:
    can the player maintain attitude with small,
    efficient corrections?

  Phase 3: MANEUVER SEQUENCE (90 seconds)
    Perform Shepard's actual maneuver sequence:
    1. Pitch up 10 degrees (observe Earth below)
    2. Hold for 10 seconds
    3. Pitch down 10 degrees (return to nominal)
    4. Yaw left 10 degrees
    5. Hold for 10 seconds
    6. Yaw right 10 degrees (return to nominal)
    7. Roll left 20 degrees
    8. Hold for 10 seconds
    9. Roll right 20 degrees (return to nominal)
    Each maneuver must be within +/- 3 degrees of target.

  Phase 4: REENTRY ATTITUDE (60 seconds)
    Set the capsule to the reentry attitude: heat shield
    forward, 14 degrees pitch down from orbital (the
    retrofire attitude). The player must achieve and hold
    this specific attitude within +/- 2 degrees. This is
    the most critical maneuver: if the capsule is not in
    the correct attitude for retrofire / reentry, the
    heat shield will not protect the vehicle.

Main view:
  ATTITUDE BALL (center, 50% of screen):
    A 3D attitude indicator (artificial horizon) showing
    the capsule's current orientation:
    - Horizon line (Earth below, space above)
    - Pitch ladder (markings every 5 degrees)
    - Roll angle (rotation of the horizon line)
    - Yaw indicator (compass markings)
    - Target attitude ghost: translucent overlay showing
      where the capsule should be pointing
    - Error bars: colored indicators showing the
      deviation from target on each axis
      Green: within 2 degrees (excellent)
      Yellow: 2-5 degrees (acceptable)
      Red: >5 degrees (out of spec)

  PERISCOPE VIEW (upper right, 25% of screen):
    A simulated view through Freedom 7's periscope:
    - Earth's surface visible, rotating slowly as the
      capsule's attitude changes
    - Cloud patterns, ocean, coastline (stylized)
    - The horizon rotates with the capsule's roll
    - The view pitches with the capsule's pitch
    - This provides the intuitive visual feedback that
      Shepard used (in addition to the instruments)

  TELEMETRY PANEL (left, 25% of screen):
    - Pitch: ___ degrees (analog needle gauge)
    - Yaw: ___ degrees (analog needle gauge)
    - Roll: ___ degrees (analog needle gauge)
    - Angular rates: pitch/yaw/roll in deg/s
    - Fuel remaining: ___ % (starts at 100%)
    - Fuel consumption rate: ___ g/s
    - Mission elapsed time: ___

  THRUSTER INDICATOR (bottom, 10% of screen):
    - 6 thruster pairs shown as small rectangles
    - Light up orange when firing
    - Shows which thrusters the player is activating

  MISSION TIMER (top):
    - Current phase
    - Time remaining in phase
    - Score: based on accuracy and fuel efficiency

SCORING:
  - Accuracy: average deviation from target across all
    phases (lower is better)
  - Fuel: percentage of fuel remaining at end (higher
    is better)
  - Combined score: (1 / avg_deviation) * fuel_remaining
  - Ranks:
    "Shepard": <2 deg avg deviation, >60% fuel remaining
    "Test Pilot": <3 deg, >50% fuel
    "Astronaut Candidate": <5 deg, >40% fuel
    "Spam in a Can": >5 deg avg deviation (the ASCS
      would have done better)

POST-GAME:
  SHEPARD'S ACTUAL PERFORMANCE:
    "On May 5, 1961, Alan Shepard manually controlled
    Freedom 7 for approximately 5 minutes. He tested
    all three axes: pitch, yaw, and roll. His control
    inputs were precise -- he maintained attitude within
    approximately 2 degrees of target on each axis.
    He consumed approximately 30% of his attitude
    control fuel during the manual phase -- less than
    the ASCS would have consumed for the same maneuvers.
    His reaction time averaged approximately 400 ms from
    disturbance to correction. The flight surgeons
    reported normal physiological parameters throughout
    the manual control phase: heart rate 108 bpm,
    blood pressure normal, voice communications clear
    and coherent. Shepard proved that a human pilot
    could fly a spacecraft in the space environment."

  YOUR PERFORMANCE VS SHEPARD:
    Accuracy: Your ___ deg vs Shepard's ~2 deg
    Fuel: Your ___% vs Shepard's ~70% remaining
    Score: Your ___ vs Shepard reference

Interactions:
  - Keyboard: W/S/A/D/Q/E for thruster control
  - Mouse: click-drag on attitude ball
  - SPACE: pause/resume
  - ESC: return to menu
  - T: toggle between instrument view and periscope view
  - F: toggle fuel display between percentage and grams

Sound effects (Web Audio API):
  - Thruster firing: hiss/pop (H2O2 decomposition sound)
  - Attitude error alarm: gentle beep when >5 degrees off
  - Phase transition: chime
  - Ambient: quiet capsule hum (environmental system)

Deliverables:
  - Single HTML file, self-contained
  - < 1200 lines total
  - 60 fps animation
  - Accurate rotational mechanics (Euler equations)
  - Responsive layout (desktop)
```

**Key learning moment:** The first time the player fires a thruster and the capsule keeps rotating after they release the key. In an airplane, releasing the stick returns the control surface to neutral and aerodynamic forces damp the rotation. In space, there is NO damping. The capsule rotates until the player fires the opposing thruster. This single experience -- "I have to stop it myself, it won't stop on its own" -- teaches the fundamental difference between atmospheric and space flight more effectively than any textbook.

---

### A4. Web: Peregrine Falcon Stoop Physics Simulator

**What it is:** An interactive web simulation of a Peregrine Falcon's hunting stoop. The player controls the falcon's wing tuck angle (which determines drag coefficient) and dive angle during a stoop from 1000 meters altitude. The simulation computes real-time velocity, g-force during pullout, and the intercept geometry with a prey bird flying at altitude. The goal is to achieve maximum speed at intercept while keeping pullout g below the falcon's structural limit (~25g).

**Specification:**

```
WEB APPLICATION: Peregrine Falcon Stoop Simulator
===================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

GAME CONCEPT:
  The player is a Peregrine Falcon at 1000 meters altitude.
  A pigeon is flying at 200 meters altitude, moving
  horizontally at 60 km/h. The player must stoop on the
  pigeon: fold wings, dive, adjust trajectory, and pull
  out at the last moment to strike.

  CONTROLS:
    Mouse Y-axis: wing tuck angle
      Top of screen: wings fully extended (high drag, slow)
      Bottom of screen: wings fully tucked (low drag, fast)
      Middle: intermediate tuck

    Mouse X-axis: bank angle
      Center: straight dive
      Left/right: curved dive path (for intercepting
        moving prey)

    SPACE: deploy wings (emergency brake / pullout)

  PHYSICS:
    Falcon model:
      Mass: 1.0 kg
      Wing area (extended): 0.06 m^2, C_d = 0.40
      Wing area (tucked): 0.008 m^2, C_d = 0.07
      Wing area (intermediate): interpolated
      Max structural load: 25g
      Max speed: 110 m/s (limited by structural flutter)

    Atmosphere:
      rho = 1.225 * exp(-h / 8500)  (standard atmosphere)

    Forces:
      Gravity: m * g (always down)
      Drag: 0.5 * rho * v^2 * C_d * A (opposing velocity)
      Lift: 0.5 * rho * v^2 * C_L * A (perpendicular to
        velocity, only significant during pullout when
        wings are partially extended)

    Prey:
      Pigeon at 200 m altitude, flying at 60 km/h horizontal
      The pigeon does not evade (in reality, pigeons do
      evade, but this simulation focuses on the stoop
      physics, not pursuit dynamics)

  MAIN VIEW:
    SIDE VIEW (center, 60% of screen):
      Altitude on Y-axis (0-1200 m)
      Horizontal distance on X-axis (0-2000 m)
      Falcon: bird silhouette, orientation shows dive angle
        and wing position
      Prey: pigeon silhouette at 200 m, moving right
      Trajectory: dotted line showing predicted impact point
        based on current speed and angle
      Ground: green landscape at bottom
      Altitude markers every 100 m
      Speed indicator: color of falcon trail
        Green: <200 km/h (safe pullout)
        Yellow: 200-300 km/h (moderate pullout g)
        Orange: 300-350 km/h (high pullout g)
        Red: >350 km/h (extreme pullout g, risk of
          structural failure)

    FALCON HUD (upper right, 20% of screen):
      Speed: ___ km/h (large, prominent)
      Altitude: ___ m
      Dive angle: ___ degrees
      Wing tuck: ___% (0 = extended, 100 = fully tucked)
      Predicted pullout g: ___ g (computed from current
        speed and minimum pullout radius)
      Time to intercept: ___ seconds
      Distance to prey: ___ meters

    PHYSICS PANEL (left, 20% of screen):
      Real-time display:
        Gravity force: ___ N (always 9.8 N)
        Drag force: ___ N (varies with speed and tuck)
        Net force: ___ N
        Acceleration: ___ m/s^2
        Terminal velocity at current tuck: ___ km/h
        Current speed / terminal velocity: ___% (shows
          how close to terminal velocity the falcon is)

    G-FORCE METER (bottom center):
      Analog gauge, 0-30g scale
      Green zone: 0-10g
      Yellow zone: 10-20g
      Red zone: 20-25g
      Black zone: >25g (structural failure)
      Current g shown as a needle
      During the stoop, g is approximately 1 (freefall + drag)
      During pullout, g spikes based on speed and turn radius

GAME MODES:

  1. FREE STOOP:
     No prey. Just dive and experience the speed.
     Find the maximum speed achievable from 1000 m.
     (Answer: approximately 350-390 km/h depending
     on tuck angle profile)

  2. HUNT:
     Strike the pigeon. Score based on:
     - Speed at impact (faster = better)
     - Pullout g (lower = safer)
     - Fuel efficiency (wing tuck percentage over time)
     Ranks:
       "Apex Predator": >350 km/h, pullout <20g
       "Experienced Hunter": >300 km/h, pullout <22g
       "Juvenile": >200 km/h, pullout <25g
       "Missed": did not intercept prey

  3. COMPARE TO FREEDOM 7:
     Side-by-side display:
     Left: falcon stoop (1000 m, 390 km/h max)
     Right: Freedom 7 trajectory (187,500 m, 2294 m/s max)
     Both shown at the same time scale, with annotations:
       "Falcon: 10 seconds of dive, 24g pullout"
       "Shepard: 928 seconds of flight, 11.6g reentry"
       "Both are controlled descents through atmosphere"
       "Both manage deceleration at the boundary of
        physiological tolerance"

POST-STOOP ANALYSIS:
  Altitude-velocity curve:
    Shows how the falcon accelerated during the dive
    and decelerated during pullout.
  Comparison to terminal velocity curve:
    "The falcon reaches ~90% of terminal velocity
    within the first 300 meters of dive. The remaining
    700 meters add very little speed because drag
    increases with v^2 -- the faster you go, the harder
    the air pushes back."
  G-force timeline:
    Shows the g spike during pullout.
    "A 390 km/h pullout at 50 m radius = 24g.
    Shepard's reentry: 2294 m/s deceleration over ~60 s = 11.6g.
    The falcon endures twice Shepard's g-force because
    the pullout is much shorter (0.5 s vs 60 s)."

Deliverables:
  - Single HTML file, self-contained
  - < 900 lines total
  - 60 fps animation
  - Accurate atmospheric drag model
  - Sound: wind noise increasing with speed (Web Audio API)
  - Mobile-friendly (touch controls for tuck angle)
```

**Key learning moment:** When the player achieves maximum stoop speed (~390 km/h) and then sees the pullout g reading: 24g. The falcon experiences this EVERY TIME it hunts. Shepard experienced 11.6g once and was celebrated as a hero. The falcon does twice that force several times per day and has been doing it for 40 million years of evolutionary refinement. The student realizes that human spaceflight exists at the edge of human tolerance but well within the tolerance of organisms that evolved for extreme environments.

---

### A5. SPICE: AGC Circuit for Mercury Capsule Attitude Control

**What it is:** A SPICE netlist for an Automatic Gain Control (AGC) circuit as used in the Mercury capsule's rate gyroscope signal conditioning chain. The rate gyros produced analog voltages proportional to the capsule's angular rate in pitch, yaw, and roll. These signals drove the Automatic Stabilization and Control System (ASCS). The AGC kept the signal level consistent regardless of the angular rate magnitude -- ensuring the ASCS responded the same way to a 0.1 deg/s drift as to a 5 deg/s tumble (just with different gain settings).

```
* MR-3 Automatic Gain Control — Rate Gyro Signal Conditioning
* ============================================================
*
* Mercury capsule attitude control used rate gyroscopes
* to sense angular velocity. The gyro output voltage was
* proportional to angular rate: ~10 mV per deg/s at low
* rates, but the dynamic range spanned 0.01 to 50 deg/s
* (a 5000:1 ratio, or ~74 dB).
*
* The ASCS needed a conditioned signal with limited dynamic
* range for reliable relay-logic bang-bang switching. This
* AGC circuit compresses the gyro output to a manageable
* range using feedback-controlled gain.
*
* This is the v1.19 progressive radio concept applied to
* spacecraft instrumentation: the same AGC principle used
* in AM/shortwave receivers (v1.9, v1.16) applied to
* gyroscope signal conditioning.
*
* Circuit: op-amp AGC with FET-controlled gain
*
*                           Vcc (+12V)
*                             |
*                        R_load (10k)
*                             |
*        Gyro In >----R1 (10k)----+-----> To ASCS relay logic
*                                 |
*                             |\ |
*                             | \|
*                        R2 --| +  Op-amp (741)
*                     (100k)  | /|
*                             |/ |
*                                |
*                          R_feedback
*                         (variable via
*                          JFET drain-source)
*                                |
*                          Q1 (2N5457 JFET)
*                           D --+-- S
*                                |
*                              Gate
*                                |
*                          R_detect (47k)
*                                |
*                          C_detect (10uF)
*                                |
*                         Peak detector
*                         (from op-amp output)
*
* Theory of operation:
*   1. The op-amp amplifies the gyro signal with gain
*      = R_feedback / R1
*   2. R_feedback is the drain-source resistance of Q1 (JFET)
*   3. The JFET's resistance is controlled by its gate voltage
*   4. The gate voltage comes from a peak detector on the output
*   5. When the output is large (high angular rate), the peak
*      detector charges C_detect, which increases the gate
*      voltage (more negative for N-channel JFET), which
*      increases R_ds, which reduces the feedback resistance,
*      which reduces the gain
*   6. When the output is small (low angular rate), C_detect
*      discharges through R_detect, gate voltage decreases
*      (less negative), R_ds decreases, feedback resistance
*      increases, gain increases
*   7. The result: output is compressed to approximately
*      20 dB of dynamic range regardless of the input's
*      74 dB range
*
* SPICE netlist:
*
.title MR3_AGC_Gyro_Signal_Conditioning
*
* Power supply
Vcc VCC 0 DC 12
Vee VEE 0 DC -12
*
* Gyro input signal (simulating varying angular rates)
* Sweep from 1mV (0.1 deg/s) to 5V (50 deg/s) at 10 Hz
Vgyro GYRO_IN 0 SIN(0 0.5 10 0 0 0)
*
* Input resistor
R1 GYRO_IN INV 10k
*
* Op-amp (simplified 741 model)
.subckt OPAMP741 INP INM OUT VCC VEE
  Rin INP INM 2MEG
  Egain MID 0 INP INM 200000
  Rout MID OUT 75
  Clim OUT 0 30p
.ends
*
X1 NON_INV INV AGC_OUT VCC VEE OPAMP741
*
* Non-inverting input to ground (inverting amplifier config)
R_gnd NON_INV 0 10k
*
* JFET-controlled feedback resistance
* Q1: 2N5457 N-channel JFET
* Using simplified JFET model
J1 AGC_OUT GATE INV NJF2N5457
.model NJF2N5457 NJF(VTO=-2.5 BETA=1.5m LAMBDA=0.01 IS=1e-14 CGS=5p CGD=2p)
*
* Peak detector for AGC control voltage
D1 AGC_OUT PEAK_POS DMOD
.model DMOD D(IS=1e-14 N=1)
R_detect PEAK_POS GATE 47k
C_detect GATE 0 10u IC=0
R_gate_bias GATE VEE 1MEG
*
* Output load (to ASCS relay logic)
R_load AGC_OUT 0 10k
*
* Analysis
.tran 0.1m 2s UIC
.control
  run
  plot V(GYRO_IN) V(AGC_OUT)
  plot V(GATE)
  * Show gain compression: output should be ~20 dB range
  * even though input varies over 74 dB
  wrdata mr3_agc_output.dat V(GYRO_IN) V(AGC_OUT) V(GATE)
.endc
*
.end
```

---

### A6. SPICE: Audio CW Filter -- Progressive Radio Circuit #19

**What it is:** A SPICE netlist for an active audio CW (Morse code) filter using a twin-T notch topology configured as a bandpass. This is the nineteenth circuit in the progressive radio series. After the product detector (v1.18) converts the IF signal to audio, the CW filter narrows the audio bandwidth to approximately 200-400 Hz centered on the CW tone frequency (~700 Hz). This dramatically improves the signal-to-noise ratio for CW reception by rejecting all audio frequencies except the narrow band containing the Morse code tone.

```
* Audio CW Filter — Active Bandpass for Morse Code Reception
* ===========================================================
*
* Progressive Radio Series Circuit #19
*
* After the product detector (v1.18) converts the IF signal
* to audio, a CW operator hears a tone at the beat frequency
* (typically 700 Hz for CW). But the audio bandwidth from the
* product detector is wide: 300-3000 Hz (standard voice bandwidth).
* This means noise, adjacent signals, and interference from
* 300-3000 Hz all compete with the 700 Hz CW tone.
*
* The audio CW filter narrows the passband to approximately
* 200-400 Hz centered on 700 Hz. This rejects:
*   - Adjacent CW signals more than 200 Hz away
*   - SSB voice signals that bleed through
*   - Broadband noise outside the passband
*   - Power line hum (60/120 Hz — well below passband)
*
* The improvement in readability is dramatic: a CW signal
* that is barely audible in a 2700 Hz bandwidth becomes
* clearly readable in a 300 Hz bandwidth because the noise
* power is reduced by a factor of 9 (9.5 dB improvement).
*
* Radio Series Progress:
*   v1.2  — Transmitter (oscillator to antenna)
*   v1.3  — Receiver (antenna to detector to audio)
*   v1.4  — Mixer (RF + LO to IF)
*   v1.5  — IF Amplifier (IF to amplified, filtered IF)
*   v1.6  — AM Detector/Demodulator
*   v1.7  — Audio Amplifier + Speaker Driver
*   v1.8  — Noise Blanker / Impulse Filter
*   v1.9  — AGC (Automatic Gain Control)
*   v1.10 — S-Meter (signal strength indicator)
*   v1.11 — BFO (Beat Frequency Oscillator for CW/SSB)
*   v1.12 — Antenna Tuner (L-network impedance matching)
*   v1.13 — RF Preamplifier (low-noise front end)
*   v1.14 — Bandpass Filter (LC tuned selectivity)
*   v1.15 — Crystal Filter (quartz extreme selectivity)
*   v1.16 — AGC Time Constant (attack/release control)
*   v1.17 — Noise Blanker (pulse noise suppression)
*   v1.18 — Product Detector (SSB/CW synchronous demod)
*   v1.19 — Audio CW Filter (active bandpass for Morse) ← THIS CIRCUIT
*
* The audio CW filter sits between the product detector
* and the audio amplifier, in the audio chain:
*
*   Product Detector → AUDIO CW FILTER → Audio Amplifier → Speaker
*          (v1.18)       (this circuit)      (v1.7)
*
* Circuit: Twin-T active bandpass filter
*
* The twin-T is normally a notch (band-reject) filter.
* By placing it in the negative feedback path of an op-amp,
* the notch becomes a peak: the frequencies rejected by the
* twin-T are NOT fed back, so they receive full open-loop
* gain. The result is a narrow bandpass filter centered at
* the twin-T notch frequency.
*
*         Audio In                          Audio Out
*         (from product detector)           (to audio amp)
*             |                                 |
*             +---R1---+---R2---+               |
*             |        |        |               |
*             |       C3        |               |
*             |        |        |               |
*             +---C1---+---C2---+               |
*             |        |        |               |
*             |       R3        |               |
*             |        |        |               |
*             +--------+--> Twin-T output       |
*                       |                       |
*                       +--- feedback to        |
*                       |    op-amp inverting    |
*                       |    input              |
*                       |                       |
*                   |\ |                        |
*         In >------| \|                        |
*                   |  +------------------------+
*         Twin-T -->| /|
*         feedback  |/ |
*                   Op-amp
*
* Design equations:
*   Center frequency: f_0 = 1 / (2 * pi * R * C)
*   For f_0 = 700 Hz:
*     Choose C = 10 nF (standard value)
*     R = 1 / (2 * pi * 700 * 10e-9)
*       = 1 / (43,982e-9)
*       = 22,736 ohms
*       ≈ 22k (standard value, gives f_0 ≈ 723 Hz)
*
*   Twin-T values:
*     R1 = R2 = R = 22k
*     C1 = C2 = C = 10 nF
*     R3 = R/2 = 11k (use 10k + 1k in series)
*     C3 = 2C = 22 nF (use 2 x 10 nF in parallel + 2.2 nF)
*
*   Bandwidth (Q-dependent):
*     Q ≈ 1 / (4 * (1 - R_feedback/R_gain))
*     For Q = 5 (BW = 700/5 = 140 Hz): adjust feedback ratio
*     For Q = 2 (BW = 700/2 = 350 Hz): wider, easier to tune
*
* SPICE netlist:
*
.title Audio_CW_Filter_Progressive_Radio_19
*
* Power supply
Vcc VCC 0 DC 9
Vee VEE 0 DC -9
*
* Audio input (simulating product detector output)
* 700 Hz CW tone at 100 mVpp + broadband noise + adjacent signal at 1200 Hz
Vsig CW_TONE 0 SIN(0 0.05 700 0 0 0)
Vadj ADJACENT 0 SIN(0 0.05 1200 0 0 0)
Vnoise NOISE_SRC 0 SIN(0 0.03 60 0 0 0)
*
* Sum the signals (simulating a crowded band)
R_sum1 CW_TONE SUM_NODE 10k
R_sum2 ADJACENT SUM_NODE 10k
R_sum3 NOISE_SRC SUM_NODE 10k
R_sum_gnd SUM_NODE 0 3.3k
*
* Twin-T network
* R branch: R1 -- node -- R2
R1 SUM_NODE TT_MID_R 22k
R2 TT_MID_R TT_OUT 22k
* C shunt from R-midpoint
C3 TT_MID_R 0 22n
*
* C branch: C1 -- node -- C2
C1 SUM_NODE TT_MID_C 10n
C2 TT_MID_C TT_OUT 10n
* R shunt from C-midpoint
R3a TT_MID_C 0 10k
R3b TT_MID_C 0 1.1k
* (R3a + R3b parallel ≈ R/2, or use series: replace with
*  single R3 = 11k from TT_MID_C to ground)
*
* Op-amp configured as bandpass using twin-T in feedback
* Non-inverting amplifier topology:
* Input to non-inverting input
* Twin-T output to inverting input (feedback)
*
.subckt OPAMP_IDEAL INP INM OUT VCC VEE
  Rin INP INM 10MEG
  Egain MID 0 INP INM 100000
  Rout MID OUT 10
.ends
*
* Input goes to non-inverting input
R_input SUM_NODE NON_INV 1k
*
* Twin-T feedback to inverting input
R_fb TT_OUT INV 1k
*
* Gain-setting resistors
R_gain INV 0 10k
R_adj INV FILTER_OUT 100k
*
X1 NON_INV INV FILTER_OUT VCC VEE OPAMP_IDEAL
*
* Output load
R_out FILTER_OUT 0 10k
*
* Analysis
.tran 0.01m 50m UIC
.control
  run
  plot V(SUM_NODE) V(FILTER_OUT)
  * The output should show the 700 Hz tone prominently
  * with the 1200 Hz adjacent signal and 60 Hz hum
  * greatly attenuated
  *
  * AC analysis to show the bandpass response
  ac dec 100 10 10k
  plot db(V(FILTER_OUT)/V(SUM_NODE))
  * Should show a peak at ~700 Hz with 3 dB bandwidth
  * of approximately 200-400 Hz
  wrdata cw_filter_response.dat V(SUM_NODE) V(FILTER_OUT)
.endc
*
* For Mercury telemetry context:
* The Mercury ground stations used similar audio filtering
* to separate biomedical subcarrier tones. Each subcarrier
* (heart rate, respiration, temperature, GSR) was transmitted
* at a different audio frequency, and narrowband filters at
* the ground station separated them. Shepard's heart rate
* during Freedom 7 was telemetered on a 1.3 kHz subcarrier;
* a ground station filter centered at 1.3 kHz with ~100 Hz
* bandwidth extracted that one vital sign from the composite
* telemetry signal.
*
* The audio CW filter applies the same principle at the
* operator's ear: narrow the bandwidth, reject the noise,
* hear the signal.
*
.end
```

---

## B. Machine Learning -- What to Train

### B1. Manual Control Style Classifier

**What it is:** Train a classifier to distinguish between "proportional" (Shepard-like) and "bang-bang" (ASCS-like) control strategies from thruster firing patterns. The model learns to identify the characteristic signatures of human vs automatic control: the human produces variable-length pulses with anticipatory timing, while the automatic system produces fixed-length pulses at regular intervals bounded by a deadband.

```
Model: Binary classifier (CNN on time-series or LSTM)

Input:
  - Time series of thruster firings (3 axes)
  - Window size: 30 seconds of data at 10 Hz = 300 samples
  - Features per sample:
    - pitch_thruster: -1, 0, or +1 (firing direction)
    - yaw_thruster: -1, 0, or +1
    - roll_thruster: -1, 0, or +1
    - pitch_rate: continuous (deg/s)
    - yaw_rate: continuous (deg/s)
    - roll_rate: continuous (deg/s)
    - attitude_error: continuous (deg from target)

Output:
  - P(human_pilot): probability the control is human
  - P(automatic): probability the control is ASCS
  - Control_efficiency: estimated fuel consumed per degree
    of attitude correction (derived metric)

Training data:
  - Simulated 30-second control windows from:
    - Human model: reaction time 200-400 ms, proportional
      pulse duration (1-5x base pulse for 1-5 degree
      correction), anticipatory inputs
    - ASCS model: bang-bang, 2-degree deadband, 200 ms
      minimum pulse, no anticipation
    - Mixed model: human with occasional automatic assists
    - Noisy human: human with degraded reaction time
      (simulating fatigue, disorientation)
  - 10,000 windows per class

Architecture:
  - 1D CNN: Conv1D(16, k=5) -> Conv1D(32, k=5) -> 
    GlobalAvgPool -> FC(16) -> FC(2) with softmax
  - Or: LSTM(32) -> FC(16) -> FC(2) with softmax
  - Input: (300, 7) tensor (30 seconds at 10 Hz, 7 features)

Expected results:
  - Classification accuracy >95% for clean human vs clean ASCS
  - Accuracy ~85% for noisy human vs ASCS (the patterns
    converge when the human is fatigued)
  - The most discriminative feature should be pulse duration
    variability: humans vary pulse length proportionally;
    ASCS uses fixed pulse length
  - False positive rate (calling ASCS "human") <3%

The student learns:
  - How to formulate a time-series classification problem
  - The quantitative signature of human vs automatic control
  - Why Shepard's manual control was distinguishable from
    automatic: not because it was better on any single metric
    but because the PATTERN of inputs was fundamentally different

Libraries: torch or tensorflow, numpy, matplotlib
GPU: Optional (small model, trains in minutes on CPU)
Difficulty: Intermediate
```

---

## C. Computer Science -- The Human-in-the-Loop Problem

### C1. Supervisory Control Architecture

Shepard's manual control of Freedom 7 is a canonical example of supervisory control: a human operator directing a semi-autonomous system through a limited-bandwidth interface. The spacecraft could fly itself (ASCS), but the human could intervene when the automatic system was insufficient. Modern software systems face the same architectural question: how much automation, how much human oversight, and where does the boundary sit?

```
CONCEPT: Supervisory Control Architecture

THE MERCURY CONTROL HIERARCHY:

  Level 0: PHYSICS
    The capsule obeys Newton's laws. Thrusters produce
    torque. The capsule rotates. This level is not
    controlled -- it is the environment.

  Level 1: ACTUATORS
    The H2O2 thrusters. They are commanded by either
    the ASCS or the pilot. They do not decide when to
    fire -- they execute commands.

  Level 2: AUTOMATIC STABILIZATION (ASCS)
    A relay-logic controller that reads the rate gyros
    and fires thrusters to maintain attitude within a
    deadband. This is closed-loop automatic control:
    sense → compare → actuate → sense → ...
    Bandwidth: ~2-5 Hz
    Logic: bang-bang (on or off, no proportional)

  Level 3: MANUAL CONTROL (Shepard)
    The pilot reads instruments (attitude indicator,
    rate indicator, periscope) and commands thrusters
    through the hand controller. This is closed-loop
    human control: perceive → decide → act → perceive → ...
    Bandwidth: ~0.77 Hz
    Logic: proportional (variable pulse length and timing)

  Level 4: MISSION CONTROL (ground)
    Flight controllers monitoring telemetry, advising
    the pilot, and (in emergencies) capable of commanding
    the spacecraft directly via ground uplink.
    Bandwidth: ~0.01 Hz (one decision per minute, limited
    by communication delay and consensus process)
    Logic: strategic (considering factors the pilot cannot
    see: weather at recovery site, fleet positions, etc.)

  Each level operates at a different bandwidth and with
  different information. The pilot sees the attitude
  indicator; Mission Control sees fuel remaining across
  all systems, fleet positions, weather, and political
  considerations. The ASCS sees only the rate gyro
  output.

  THE DESIGN QUESTION:
  Which level should have authority at any given moment?

  Mercury's answer (post-Shepard):
    ASCS has default authority (it is always on).
    Pilot can override ASCS by selecting manual mode.
    Mission Control can command the spacecraft if the
    pilot is incapacitated.
    Each lower level can be overridden by the level above.

  MODERN EQUIVALENT:
  In a software system with AI agents:
    Level 0: Infrastructure (servers, networks)
    Level 1: Service mesh (routing, load balancing)
    Level 2: Automated agents (task execution)
    Level 3: Human operator (manual intervention)
    Level 4: Management / policy (strategic direction)

  The Shepard lesson: Level 3 (human) should always have
  the ability to override Level 2 (automatic), even if
  Level 2 is usually sufficient. The override capability
  is not an admission of automation failure -- it is an
  insurance policy that costs little (the hand controller
  weighs almost nothing) and provides enormous value when
  the automatic system encounters a situation it was not
  designed for.

EXERCISE:
  Design a supervisory control architecture for a
  multi-agent system where:
  - Level 2 agents handle routine tasks automatically
  - Level 3 human operator can intervene in any agent
  - Level 4 policy system sets strategic goals
  - Each level can override the level below
  - No level can override the level above without
    explicit authorization

  Implement the override mechanism as a state machine:
    AUTOMATIC → (human intervention) → MANUAL → (release)
    → AUTOMATIC
  
  Handle the edge case: what happens when the human
  operator's intervention makes things worse? (This is
  the anti-Shepard case: the automation was correct, the
  human was wrong.) How does the system detect this and
  offer to return to automatic mode?
```

---

## D. Creative Arts -- What to Compose, Write, and Render

### D1. GLSL Shader: "Freedom"

A fragment shader that renders the view from Freedom 7's periscope at apogee -- 187.5 km above the Atlantic Ocean. The periscope was Shepard's primary visual reference: a ground-looking optical system that showed him the Earth below, distorted slightly by the periscope's optics into a circular field with a crosshair overlay. The shader recreates this view: the blue Atlantic, the white cloud patterns, the green-brown coastline of the Bahamas visible in the distance, the curve of the Earth at the edges of the field, and the black of space just visible at the horizon -- all framed in the circular periscope viewport with its instrument markings.

```
SHADER SPECIFICATION: "Freedom"

Resolution: 1920x1080
Palette: Periscope view -- filtered through optics

Layers:
  1. Periscope frame:
     - Circular viewport in the center of the screen
       (diameter approximately 70% of screen height)
     - Dark gray metal frame around the viewport
     - Crosshair overlay: thin white lines, center-marked
     - Degree markings around the perimeter (every 10 degrees)
     - The frame is fixed; the Earth view inside rotates
       with the capsule's attitude
     - Outside the viewport: dark capsule interior,
       faintly visible instrument panel lights

  2. Earth (through periscope):
     - The Atlantic Ocean: deep blue, with subtle
       texture from cloud shadows and wave patterns
     - Cloud formations: white cumulus clusters,
       thin cirrus streaks
     - The Bahamas: visible as a light turquoise/sand
       patch against the darker ocean (Shepard reported
       seeing the island chain)
     - Cape Canaveral: visible at the edge of the field
       (the launch site was within visual range at apogee)
     - The curve of the Earth: visible at the edges of
       the periscope field as the horizon bends away

  3. Atmosphere at the limb:
     - Thin blue line at the Earth's horizon
     - Transition from blue atmosphere to black space
     - Visible at the edges of the periscope field
     - Much thinner than it appears from the ground
       (Shepard described it as a surprisingly thin band)

  4. Animation:
     - Slow drift: the Earth view drifts slightly as
       the capsule rotates (simulating the attitude
       drift that Shepard corrected with manual control)
     - Periodic correction: the drift stops and reverses
       slightly (simulating a thruster firing)
     - Cloud motion: very slow cloud drift (negligible
       over 15 minutes, but adds visual life)
     - The overall effect: a living view of Earth through
       a spacecraft window, gently rocking with the
       capsule's attitude, periodically stabilized by
       the pilot's inputs

  5. Overlay text (optional):
     "Freedom 7 -- May 5, 1961"
     "Altitude: 187.5 km"
     "Apogee -- 5 minutes of freedom"
```

---

### D2. Short Story: "Fifteen Minutes"

A creative nonfiction account of Freedom 7 from Shepard's perspective, following the flight second by second -- from the moment of engine ignition to the moment the helicopter lifts him from the capsule. The story emphasizes the sensory experience: what Shepard felt, heard, and saw during the most compressed 15 minutes of human achievement in 1961.

```
STORY SPECIFICATION: "Fifteen Minutes"

Perspective: Third-person limited, centered on Shepard's
  sensory experience. No omniscient narration about
  Mission Control or the recovery fleet. Only what
  Shepard experiences inside the capsule.

Tone: Precise, immediate, present-tense during the flight.
  The prose matches the flight's pace: rapid during launch,
  contemplative during weightlessness, violent during reentry.

Structure:
  Each section is keyed to a flight event and mission
  elapsed time (MET):

  1. T-0:00 — IGNITION (MET 00:00)
     The vibration starts below him. Not like a car
     engine, not like a jet engine. A new kind of
     shaking — the entire vehicle comes alive, every
     rivet and panel and instrument buzzing at a
     frequency he has not felt before. The hold-down
     clamps release. The gantry slides away in the
     periscope view. The g-meter begins to climb.

  2. T+0:15 — TOWER CLEAR (MET 00:15)
     The escape tower is visible in the periscope as
     the vehicle clears the pad. Cape Canaveral shrinks.
     The Atlantic appears. Shepard reports: "Roger,
     liftoff and the clock is started."

  3. T+1:00 — MAX-Q (MET 01:00)
     The vehicle shakes hardest now. Maximum dynamic
     pressure — the point where the product of air
     density and velocity squared reaches its peak.
     The rocket is pushing through the thickest part
     of the atmosphere at increasing speed. The
     vibration is deep, structural, felt in the bones
     of his back through the couch. Then it subsides
     as the air thins.

  4. T+2:22 — ENGINE CUTOFF (MET 02:22)
     Silence. Instant, complete. One moment the engine
     is pushing 78,000 pounds of thrust through his
     spine. The next moment — nothing. The g-meter
     drops from 6.3 to zero. His body lifts against
     the straps. His arms float. A pencil drifts past
     his face. He is in space.

  5. T+2:30 — TOWER JETTISON (MET 02:30)
     The escape tower fires its jettison motor and
     separates from the capsule. Through the periscope,
     Shepard sees it fly away — a bright flash and a
     receding cluster of metal that is no longer needed.
     He will not need to abort. The rocket has done its job.

  6. T+3:00 — MANUAL CONTROL (MET 03:00)
     He switches to fly-by-wire manual. The attitude
     indicator shows his orientation. He pushes the
     hand controller left — a hiss from the thrusters
     outside, and the periscope view rotates slowly.
     Yaw. He pushes forward — the Earth tilts in the
     periscope. Pitch. He twists — roll. Each input
     produces a measured, predictable response. The
     capsule responds to his hands. He is flying.

     Five minutes. He has five minutes of weightlessness
     to test every axis, confirm every response, prove
     that a human being can control a machine in this
     environment. He works through the test matrix:
     pitch up, pitch down, hold. Yaw left, yaw right,
     hold. Roll left, roll right, hold. Each maneuver
     deliberate. Each correction measured. The thrusters
     hiss in one-second pulses.

  7. T+5:00 — THE VIEW (MET 05:00)
     He looks through the periscope. Below him: the
     Atlantic Ocean, impossibly blue, extending to a
     horizon that curves. The curve of the Earth.
     He can see it. The atmosphere is a thin blue line
     at the edge — thinner than he expected, a ribbon
     of blue between the dark ocean and the black sky.
     Cloud formations, white against the blue. The
     Bahamas, a scatter of light green shapes in the
     darker water. Lake Okeechobee, visible as a gray
     smudge against the Florida green. He reports what
     he sees. His voice is calm. He has been trained
     for this moment for three years, but no training
     simulated the view. The view is real in a way that
     the simulator was not.

  8. T+5:14 — RETRO-SEQUENCE (MET 05:14)
     The retrorockets fire — three solid-fuel motors in
     sequence, each burning for 10 seconds, each pushing
     against his forward motion. One-g. The weight returns
     gently, pressing him forward into the straps. The
     capsule's velocity decreases by approximately 150 m/s.
     Not enough to orbit; too much to stay up. He is
     coming down.

  9. T+6:15 — RETRO JETTISON (MET 06:15)
     The retropack separates. The heat shield is exposed.
     From this moment, the blunt end of the capsule faces
     forward into the airstream, and the heat shield will
     absorb the reentry energy.

  10. T+7:30 — REENTRY (MET 07:30)
      Weight returns. Not the gentle push of retro but
      an accelerating force that builds and builds. The
      g-meter climbs: 3, 5, 7, 9, 10, 11. Eleven-point-six g.
      He weighs 1,900 pounds. His arms are pinned. His
      vision narrows — gray at the edges, but the center
      holds. He can still read the instruments. He can
      still breathe, barely, pressing his diaphragm
      against the weight of his own chest. The window
      glows orange. The heat shield ablates — designed
      to burn away, carrying the reentry heat with it,
      sacrificing itself so the capsule survives.

      Thirty seconds at peak g. Then it eases. 8, 6, 4, 2.
      The capsule is through the worst of it. The atmosphere
      has done its work — slowing him from 2,294 m/s to
      subsonic speed. He is falling now, not flying, not
      arcing — falling straight down through the lower
      atmosphere.

  11. T+9:38 — DROGUE CHUTE (MET 09:38)
      A jolt. The drogue parachute deploys at 21,000 feet,
      stabilizing the capsule's descent. The oscillations
      damp. Through the periscope, the ocean is close now
      — blue-gray, textured with whitecaps.

  12. T+10:15 — MAIN CHUTE (MET 10:15)
      The main parachute. Another jolt, harder. The descent
      rate drops to 30 feet per second. The capsule swings
      gently under the canopy. Shepard looks up through
      the window and sees the orange-and-white parachute
      against the blue sky. It is beautiful. It is working.

  13. T+15:28 — SPLASHDOWN (MET 15:28)
      Impact. Water. The capsule rocks, stabilizes,
      bobs on the Atlantic swells. Water does not enter.
      (Ham's capsule leaked. This one does not.) Through
      the window: gray-green water, sky, the sound of
      helicopter rotors approaching. He waits. The
      helicopter hooks the capsule. The hatch opens —
      not the explosive hatch (that would come later,
      disastrously, on Grissom's flight) but the
      mechanical hatch at the side. Hands reach in.
      Sunlight. Salt air. He smells the ocean.

      He climbs out. He is on the helicopter. He is the
      first American in space. Fifteen minutes ago he was
      sitting on a rocket. Now he is sitting on a helicopter
      seat, soaking wet, heart rate 138 bpm and dropping,
      looking at the recovery carrier USS Lake Champlain
      on the horizon, and he is thinking about what he
      saw through the periscope — the thin blue line, the
      curve, the islands — and he is thinking that fifteen
      minutes is not enough. He wants to go back. He wants
      to orbit. He wants the Moon. Fifteen minutes was the
      beginning, not the destination.

Length: 3,000-4,000 words

Provide as: HTML + LaTeX

HTML version:
  Self-contained HTML file with styled prose.
  Font: serif (Georgia or system serif)
  Max width: 700px, centered
  Title page with mission patch (CSS-drawn circle with
    "Freedom 7" and date)
  Each section as a chapter with MET timestamp
  Print-friendly CSS

LaTeX version:
  article class, 12pt
  Title: "Fifteen Minutes"
  Subtitle: "Mercury-Redstone 3 / Freedom 7 — May 5, 1961"
  Author: "NASA Mission Series v1.19"
  Sections numbered by MET
  Typeset for A4 or letter paper
```

---

### D3. FAUST Synth: MR-3 Launch Sequence

A FAUST DSP program that synthesizes the sound of Mercury-Redstone 3's launch: from the pre-ignition silence through engine start, liftoff, max-Q, engine cutoff, and the silence of space. The synthesis is physically motivated: the engine produces broadband noise shaped by the exhaust column's resonant frequencies, and the vehicle's acceleration modulates the perceived pitch (Doppler shift as the rocket recedes from the launch pad).

```
FAUST SPECIFICATION: "Freedom 7 Launch"

Output: Stereo audio, 48 kHz, 150 seconds duration
Tempo: Real-time (1 second of audio = 1 second of mission)

Synthesis chain:
  1. Engine noise (broadband):
     - White noise filtered through a resonant bandpass
       at approximately 80-150 Hz (the A-7 engine's
       primary acoustic frequency)
     - Bandwidth narrows and center frequency shifts
       upward as thrust builds (fuel pump acceleration
       changes the combustion frequency)
     - Amplitude envelope: zero → full thrust over
       approximately 2 seconds (engine startup transient)

  2. Structural vibration:
     - Low-frequency rumble (20-40 Hz) representing
       the vehicle's structural modes
     - Modulated by the engine noise (nonlinear coupling)
     - Peak amplitude at max-Q (~60 seconds)
     - Decreases as the vehicle exits the atmosphere

  3. Atmospheric effects:
     - Wind noise: broadband, amplitude proportional to
       dynamic pressure (peaks at max-Q)
     - Decreases to zero as the vehicle exits the
       atmosphere (~80 km)

  4. Doppler shift (observer at launch pad):
     - Engine frequency shifts downward as the rocket
       accelerates away
     - f_observed = f_engine * c / (c + v_rocket)
     - The shift is subtle (v_max = 2294 m/s, c_sound = 340 m/s)
       but audible: the engine note drops approximately
       1 octave by engine cutoff

  5. Engine cutoff:
     - At T+142 seconds: engine noise envelope drops
       to zero over 100 ms
     - The silence is the most dramatic moment: from
       78,000 pounds of thrust to zero in a tenth
       of a second

  6. Space silence:
     - After cutoff: only the faintest residual sounds
       (capsule environmental system hum, ~40 Hz, very quiet)
     - The contrast between the launch roar and the
       space silence is the emotional core of the piece

Parameters:
  - engine_freq: 80-150 Hz (adjustable)
  - thrust_level: 0-1 (envelope controlled)
  - altitude_km: 0-190 (drives atmospheric effects)
  - velocity_ms: 0-2294 (drives Doppler shift)
  - dynamic_pressure: 0-max (drives structural vibration)
```

---

### D4. FAUST Synth: Peregrine Falcon Stoop

A FAUST DSP program that synthesizes the sound of a Peregrine Falcon's hunting stoop as heard by the falcon itself: the rush of air over folded feathers, increasing in pitch and intensity as the falcon accelerates, then the sudden deceleration as wings deploy for the pullout, followed by the sharp impact of the strike.

```
FAUST SPECIFICATION: "Peregrine Stoop"

Output: Stereo audio, 48 kHz, 12 seconds duration
Tempo: Real-time

Synthesis chain:
  1. Wind noise (falcon's perspective):
     - Pink noise filtered through a resonant peak at
       the frequency determined by the falcon's speed
       and body cavity resonance
     - Center frequency rises with speed:
       f_wind ≈ 0.2 * v (Hz), where v is speed in m/s
       At 50 m/s: f_wind ≈ 10 Hz (infrasonic rumble)
       At 100 m/s: f_wind ≈ 20 Hz (deep bass)
       At 108 m/s (max): f_wind ≈ 22 Hz
     - The wind noise is primarily felt, not heard, at
       these frequencies. The audible component is the
       turbulent broadband above 100 Hz, which increases
       in amplitude with v^2

  2. Feather flutter:
     - At high speed, feather edges flutter at frequencies
       determined by feather stiffness and airspeed
     - Modeled as narrow-band noise at 200-800 Hz
     - Amplitude increases sharply above 300 km/h
     - This is the sound the falcon "hears" through
       bone conduction from its own body vibrating

  3. Acceleration feel:
     - During the stoop: low-frequency pulsing at the
       falcon's wingbeat frequency (0 Hz during stoop,
       since wings are tucked)
     - During pullout: sudden onset of wing loading
       produces a deep thump (sub-bass impulse) as the
       wing muscles engage against 24g of deceleration

  4. Strike:
     - Impact sound: sharp transient (broadband click,
       10 ms duration, high amplitude)
     - Followed by the rapid deceleration of the falcon's
       body at contact
     - Feather sounds: rustling, fluttering as wings
       fully deploy for the post-strike maneuver

  5. Silence:
     - After the strike: wind noise drops rapidly
       (speed decreases from 390 km/h to ~60 km/h
       in approximately 1 second of pullout)
     - The sudden quiet after the stoop mirrors the
       silence after Freedom 7's engine cutoff

Timeline:
  0.0-1.0s:  Soaring (gentle wind, ~80 km/h)
  1.0-1.5s:  Wing tuck (wind drops briefly as posture changes)
  1.5-9.0s:  Stoop (wind builds from 80 to 390 km/h)
  9.0-9.5s:  Strike (impact transient)
  9.5-11.0s: Pullout (wind drops, wing sounds return)
  11.0-12.0s: Level flight (gentle wind, prey in talons)
```

---

### D5. Circuit: LED G-Force Indicator

A hardware circuit that drives a bar of 10 LEDs to indicate simulated g-force, driven by an analog input (potentiometer simulating the capsule's accelerometer). Each LED represents 1g (from 1g to 10g+), with color coding: green (1-3g), yellow (4-6g), orange (7-9g), red (10g+). The circuit uses an LM3914 dot/bar display driver -- a single IC designed exactly for this purpose.

```
CIRCUIT: LED G-Force Indicator

Components:
  1x LM3914 dot/bar display driver IC (~$3)
  10x LEDs: 3 green, 3 yellow, 2 orange, 2 red (~$2)
  1x 10k potentiometer (g-force input simulation, ~$0.50)
  1x 1k resistor (LED current set)
  1x 10k resistor (reference divider)
  9V battery or USB power supply

The LM3914 is a monolithic IC that senses an analog
voltage and drives 10 LEDs in a dot or bar display.
Internally, it contains a precision voltage divider
(10 comparators) that divides the reference voltage
into 10 equal steps. As the input voltage increases,
LEDs light sequentially.

Wiring:
  Pin 5 (signal input): from potentiometer wiper
  Pin 3 (V+): to 9V
  Pin 2 (V-): to ground
  Pin 6 (reference low): to ground
  Pin 7 (reference high): to 5V (set by resistor divider)
  Pin 9 (mode): to V+ for bar mode, float for dot mode
  Pins 1, 10-18: to LED anodes (through current-limiting
    resistors or using the internal current source)

The potentiometer simulates Freedom 7's accelerometer
output:
  Full CCW (0V): 0g (weightlessness)
  Mid position: 6g (launch peak)
  Full CW (5V): 12g (reentry peak)

Rotate the potentiometer to simulate the g-force profile
of Freedom 7:
  1. Start at 1g (static, on the pad)
  2. Slowly increase to 6.3g (launch, 142 seconds)
  3. Drop to 0g (engine cutoff, weightlessness)
  4. Hold at 0g (5 minutes of space)
  5. Increase to 11.6g (reentry peak)
  6. Drop back to 1g (parachute descent)
  7. 1g (splashdown, static)

The LED bar shows the g-profile visually:
  At 6.3g: 6 LEDs lit (3 green + 3 yellow)
  At 0g: all LEDs off (weightlessness -- nothing lit)
  At 11.6g: all 10 LEDs lit + red LEDs blinking

Mercury connection:
  The actual Mercury capsule had an accelerometer that
  displayed g-force to the pilot on an analog instrument.
  Shepard monitored this during launch and reentry.
  This circuit replicates that display in LED form.

Total cost: ~$8
Difficulty: Beginner
Build time: 1-2 hours
```

---

### D6. Circuit: Analog Attitude Controller

A hardware circuit that simulates a single-axis attitude controller for the Mercury capsule: a potentiometer represents the hand controller deflection, an op-amp integrator represents the capsule's rotational dynamics (angular acceleration integrates to angular rate), and a servo motor rotates to show the resulting attitude angle. Push the potentiometer (fire the thruster), and the servo rotates -- slowly, at about 1 degree per second, just like the real Mercury capsule. Release the potentiometer, and the servo holds its position (no damping in space). Push the other direction to rotate back.

```
CIRCUIT: Analog Attitude Controller (Single-Axis)

Components:
  1x LM358 dual op-amp (~$0.50)
  1x 10k linear potentiometer (hand controller, ~$0.50)
  1x SG90 micro servo motor (~$3)
  1x Arduino Nano (~$8) or 555 timer for PWM generation
  2x 100k resistors (integrator)
  1x 1uF capacitor (integrator time constant)
  1x 10k resistor (input scaling)
  1x LED + 470 ohm resistor (thruster indicator)
  9V battery + 5V regulator (or USB power)

Theory:
  The hand controller (potentiometer) produces a voltage
  proportional to deflection:
    Center (neutral): 2.5V (no thruster firing)
    Full forward: 5V (positive thruster, pitch up)
    Full backward: 0V (negative thruster, pitch down)

  The op-amp integrator converts this voltage to a
  ramp:
    V_out = -(1/RC) * integral(V_in - 2.5V) dt

  This mimics the capsule dynamics:
    Thruster torque → angular acceleration → angular rate → angle
    The integrator performs the acceleration-to-rate conversion.
    The servo displays the resulting angle.

  Time constant: RC = 100k * 1uF = 0.1 seconds
  Scaled to produce approximately 1 degree per second
  of servo rotation per unit of potentiometer deflection.

Operation:
  1. Potentiometer at center: no rotation (no thruster firing)
  2. Push forward: servo rotates clockwise (pitch up)
     at ~1 deg/s while held
  3. Release to center: servo HOLDS position (no damping!)
  4. Push backward: servo rotates counterclockwise (pitch down)
  5. The student must manually fire the opposing direction
     to stop the rotation -- exactly as Shepard did

  The key experience: unlike a car steering wheel or a
  video game joystick, releasing the controller does NOT
  return the system to neutral. The servo holds whatever
  angle the integration has reached. The student must
  learn to:
    1. Fire in one direction to start rotation
    2. Fire in the opposite direction to stop rotation
    3. Apply exactly the right impulse to reach the
       desired angle without overshooting

  This is the physical experience of manual spacecraft
  control -- the absence of damping, the need for
  anticipation, the proportional pulse technique that
  Shepard used.

Mercury connection:
  Shepard's hand controller was a three-axis device
  (pitch, yaw, roll). This circuit models one axis.
  The real thrusters produced ~1 deg/s^2 angular
  acceleration; this circuit is scaled similarly.
  The real capsule had no aerodynamic damping in space;
  this circuit has no feedback to center the servo.

  The student who builds this circuit and spends five
  minutes trying to rotate the servo to a specific
  angle and hold it there -- without damping, without
  automatic centering, with only their own timing and
  judgment -- will understand exactly why Shepard's
  manual control test was not trivial, and why the
  "spam in a can" advocates had a point about the
  difficulty of human-in-the-loop control in the
  absence of natural damping.

Total cost: ~$15
Difficulty: Beginner-Intermediate
Build time: 2-3 hours
```

---

## E. Problem-Solving Methodology -- The Qualification Test

### E1. Proving Capability Through Planned Performance

MR-2 (Ham) survived an off-nominal trajectory. MR-3 (Shepard) executed a nominal trajectory. Both missions were successful. But they proved different things: MR-2 proved the capsule could survive extremes. MR-3 proved the system could perform as designed. Only the second type of proof qualifies a system for operational use.

```
METHODOLOGY: Qualification vs Survival

THE DIFFERENCE:
  SURVIVAL: the system encounters conditions beyond
  its design envelope and does not fail. Ham's MR-2
  survived 14.7g (design limit was 12g), survived
  a higher and longer trajectory than planned, and
  survived a capsule leak at splashdown. The system
  was stressed beyond its design and did not break.
  This demonstrates ROBUSTNESS.

  QUALIFICATION: the system encounters conditions
  within its design envelope and performs as predicted.
  Shepard's MR-3 experienced 6.3g launch (predicted:
  ~6g), reached 187.5 km apogee (predicted: ~185 km),
  experienced 11.6g reentry (predicted: ~11g), and
  splashed down 486 km downrange (predicted: ~480 km).
  Every parameter matched the prediction within
  engineering tolerance. This demonstrates CONTROL.

  NASA's decision to fly Glenn on MA-6 required
  QUALIFICATION, not survival. The question was not
  "will the astronaut survive?" (Ham had answered
  that). The question was "will the system perform
  as designed with a human pilot?" (Only Shepard
  could answer that.)

  In software engineering, the same distinction applies:
  a stress test (throwing extreme loads at a system
  and seeing what breaks) demonstrates robustness.
  A qualification test (running the system under
  planned loads and verifying that every output
  matches the specification) demonstrates control.
  Both are valuable. Neither substitutes for the other.
  Ship after qualification, not after survival.

THE LADDER (updated from v1.18):
  MR-1:  4-inch launch, abort system test (FAILURE→LEARNING)
  MR-1A: Successful unmanned suborbital (SUCCESS)
  MR-2:  Ham, off-nominal suborbital (SURVIVAL)
  MR-BD: Booster development, fix MR-2 anomalies (SUCCESS)
  MR-3:  Shepard, nominal suborbital (QUALIFICATION) ← HERE
  MR-4:  Grissom, repeat qualification (QUALIFICATION)
  MA-4:  Unmanned orbital (SUCCESS)
  MA-5:  Enos, biological orbital (QUALIFICATION)
  MA-6:  Glenn, human orbital (OPERATIONAL)

  Each step builds on the previous:
  - MR-2 proved the capsule survived extreme conditions
  - MR-BD fixed the anomalies that caused the extremes
  - MR-3 proved the system works as designed
  - The step from survival to qualification required
    fixing the anomaly and re-testing under nominal conditions
```

---

## F. GSD Improvements -- What to Build for gsd-skill-creator

### F1. Human-in-the-Loop Override Chipset

Shepard's manual control demonstrated that a human operator adds value to a semi-autonomous system, not by being faster or more accurate but by being more efficient and more adaptive. A human-in-the-loop override chipset for gsd-skill-creator would provide the same capability for agent operations.

```
CHIPSET: Human Override

Purpose: Allow a human operator to take manual control
  of any agent's task with proportional, nuanced inputs,
  without disrupting the automatic system's ability to
  resume once the human releases control.

Chips:
  1. override-switch: A state machine that manages the
     transition between automatic and manual mode.
     States: AUTOMATIC → HANDOFF → MANUAL → RELEASE → AUTOMATIC
     The HANDOFF state ensures the automatic system's
     state is captured before manual control begins.
     The RELEASE state ensures the human's changes are
     integrated before automatic control resumes.

  2. proportional-input: Unlike the automatic system's
     binary decisions (do/don't-do), the human override
     accepts proportional inputs: "do this much," "adjust
     this parameter by this amount," "slow down by this
     factor." This mirrors Shepard's proportional thruster
     control vs the ASCS's bang-bang logic.

  3. efficiency-monitor: Track the fuel consumption
     (resource usage) of both automatic and manual modes.
     If the human's intervention is consuming MORE resources
     than the automatic system (the anti-Shepard case),
     flag this to the human and suggest returning to
     automatic mode.

  4. context-capture: When the human takes over, capture
     the full context: agent state, task progress, pending
     decisions, resource levels. When the human releases,
     pass this updated context back to the automatic system.
     The agent should resume seamlessly, as if it had been
     running with human-quality decisions during the override.

Application:
  - Agent is stuck in a loop: human overrides, makes the
    decision the agent cannot, releases
  - Agent is consuming resources wastefully: human overrides,
    applies a more efficient strategy, releases
  - Agent is making correct decisions but the user wants
    different tradeoffs: human overrides, adjusts the
    priority weighting, releases
  - Shepard's lesson: the human does not replace the
    automatic system. The human complements it. The best
    outcome is automatic for routine, manual for exceptions.
```

### F2. Qualification Test Pattern

The distinction between survival testing and qualification testing applies to any software system. A qualification test pattern for gsd-skill-creator would verify that agents perform as specified under nominal conditions -- not just that they do not crash under extreme conditions.

```
CHIPSET: Qualification Test

Purpose: Implement a testing pattern that verifies
  PREDICTED PERFORMANCE (qualification) rather than
  just NON-FAILURE (survival).

Chips:
  1. spec-oracle: Given a task specification (input,
     expected output, expected resource consumption,
     expected duration), verify that the agent's actual
     performance matches the specification within
     tolerance. Not "did it produce output?" but "did
     it produce the RIGHT output in the RIGHT time
     with the RIGHT resources?"

  2. tolerance-band: Define acceptable ranges for each
     performance metric. An agent that completes a task
     but uses 5x the expected resources has SURVIVED
     but not QUALIFIED. An agent that completes a task
     within 10% of the resource budget has QUALIFIED.

  3. regression-guard: Compare each run's performance
     to the historical baseline. If performance degrades
     (even if it still passes the tolerance band), flag
     the regression. The system is drifting toward
     survival mode (barely passing) rather than maintaining
     qualification mode (comfortably passing).

  4. qualification-ladder: Track the progression of
     testing from simple to complex, ensuring that each
     level builds on validated lower levels:
     Level 1: Unit tests (individual functions)
     Level 2: Integration tests (function interactions)
     Level 3: System tests (full workflows)
     Level 4: Qualification tests (full workflows with
       performance verification)
     Level 5: Operational tests (qualification tests
       under production conditions)
     Only advance to the next level when the current
     level qualifies.

Application:
  - Shepard's lesson: the system that QUALIFIES (performs
    as designed) is ready for operation. The system that
    SURVIVES (does not crash) is ready for more testing.
  - MR-2 survived. MR-3 qualified. Only after MR-3 did
    NASA proceed to operational missions. Only after
    qualification should gsd-skill-creator agents be
    trusted with production work.
```

---

*"The Peregrine Falcon does not hesitate at the top of the stoop. It has spotted the prey, calculated the intercept geometry with 40 million years of neural evolution, and it folds its wings and commits. The decision takes less than a second. The dive takes ten. The falcon goes from 80 km/h to 390 km/h in the space between two breaths, and in those ten seconds it cannot change its mind -- it can abort (extend wings, accept the structural load, climb back up) but it cannot un-commit. The stoop, once begun, plays out on physics, not will. Shepard on the pad: four hours of waiting, four hours of checking instruments and listening to holds and thinking about the thin blue line of atmosphere that he was about to leave behind, and then the countdown reached zero and the engine ignited and he was committed. The physics took over. For 142 seconds the A-7 engine burned, and for 786 seconds after that the capsule followed the parabola that the engine had inscribed, and Shepard rode the arc like the falcon rides the dive -- present, alert, making small corrections, but fundamentally a passenger on a trajectory that was determined at burnout the way the falcon's trajectory is determined at wing-tuck. The Pacific giant salamander waits under its cobble, gills pulsing in the cold stream current, and when the sculpin drifts within range the salamander lunges -- 15 milliseconds of ballistic commitment, no course correction, no abort, just the physics of muscle and water and the distance between predator and prey. Three organisms, three time scales: 15 milliseconds, 10 seconds, 928 seconds. Three leaps: the lunge, the stoop, the launch. Three commitments that cannot be unmade once they begin. Kierkegaard, born this day 148 years before the launch, knew that the hardest thing about a leap is not the landing but the leaving -- the instant when both feet are off the ground and the only thing holding you up is the trajectory you chose and the physics you trusted. Shepard trusted the physics. The falcon trusts the physics. The salamander trusts the physics. None of them understands all of the physics -- Shepard did not solve the trajectory equations himself, the falcon does not know about drag coefficients, the salamander does not calculate its lunge angle -- but all of them trust the computation that was done for them: by engineers, by evolution, by 400 million years of predatory optimization in cold water. The leap of faith is not faith in the unknown. It is faith in the known-but-not-personally-computed. It is faith in the work of others: the engineers who built the rocket, the ancestors who shaped the wing, the selection pressures that calibrated the lunge. Freedom is the name Shepard gave his capsule. It is also the name Kierkegaard gave to the vertiginous moment before the leap -- the dizziness of realizing that you are free to jump or free to stay, and that no one will make the choice for you. Shepard jumped. Fifteen minutes later, America was in space, and the question was no longer 'can we?' but 'how far?'"*
