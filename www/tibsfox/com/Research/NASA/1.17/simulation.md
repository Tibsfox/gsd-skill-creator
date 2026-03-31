# Mission 1.17 -- Mercury-Redstone 2: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Redstone 2 (January 31, 1961) -- Ham's Suborbital Flight
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Taricha granulosa (rough-skinned newt)
**Bird:** Uria aalge (Common Murre, degree 17)
**Dedication:** Franz Schubert (January 31, 1797)

---

## A. Simulations -- What to Build Locally

### A1. Python: Suborbital Trajectory Calculator

**What it is:** A Python simulation that computes and visualizes the suborbital trajectory of Mercury-Redstone 2, comparing the planned trajectory (143-second burn, 185 km apogee) to the actual trajectory (144-second burn, 253 km apogee). The simulation models the Redstone engine's constant-thrust burn, the decreasing vehicle mass as propellant is consumed, the ballistic coast phase from burnout to apogee and back down, and the atmospheric reentry deceleration. The student can adjust burn time by fractions of a second and observe how small changes in burn duration produce large changes in peak altitude, downrange distance, and reentry conditions.

**Why it matters:** MR-2's most significant engineering fact is that 1 extra second of engine burn changed the peak altitude by 68 km (37%) and the peak reentry g-load from ~11g to ~14.7g. This simulation makes the sensitivity viscerally obvious: the student adjusts a slider by 1 second and watches the trajectory arc stretch upward, the reentry angle steepen, and the g-force counter climb. The thin margin between "within design limits" and "14.7g on a chimpanzee" is one second of thrust.

**Specification:**

```python
# mr2_trajectory.py
# Mercury-Redstone 2 suborbital trajectory simulator
#
# Process:
#   1. Model Redstone A-7 engine: constant thrust, decreasing mass
#   2. Integrate equations of motion in 2D (range, altitude)
#   3. Phase 1: Powered flight (launch to burnout)
#   4. Phase 2: Ballistic coast (burnout to apogee to entry interface)
#   5. Phase 3: Atmospheric reentry (entry interface to subsonic)
#   6. Compare planned (143s burn) vs actual (144s burn)
#   7. Sensitivity analysis: burn time from 140s to 148s
#
# Parameters (user-adjustable):
#   burn_time_s: 140-148 (nominal 143, actual 144)
#   thrust_N: 300000-400000 (nominal 346944)
#   initial_mass_kg: 25000-35000 (nominal 30000)
#   flight_path_angle_deg: 35-50 (nominal 40)
#   entry_interface_km: 80-130 (nominal 120)
#
# Visualization:
#   - Plot 1: Trajectory comparison (main display)
#     X-axis: downrange distance (0-800 km)
#     Y-axis: altitude (0-300 km)
#     Curve 1 (blue, solid): Planned trajectory (143s burn)
#     Curve 2 (red, solid): Actual trajectory (144s burn)
#     Markers: burnout point, apogee, entry interface, splashdown
#     Karman line (100 km) shown as horizontal dashed line
#     Earth's curvature shown at bottom (arc, not flat)
#     Annotations:
#       "Planned apogee: 185 km"
#       "Actual apogee: 253 km (+37%)"
#       "1 second of extra burn"
#
#   - Plot 2: Altitude vs time
#     Both trajectories on same time axis
#     Burnout, apogee, entry, and splashdown marked
#     Total flight time: planned ~15:30, actual ~16:39
#
#   - Plot 3: Velocity vs time
#     Shows velocity magnitude through all phases
#     Burnout velocity, entry velocity marked
#     Deceleration during reentry visible as steep drop
#
#   - Plot 4: Sensitivity -- apogee vs burn time
#     X-axis: burn time (140-148 s)
#     Y-axis: peak altitude (km)
#     Shows the steep sensitivity curve
#     Planned (143s) and actual (144s) marked
#     Design limit altitude marked
#     Annotation: "Each extra second adds ~68 km of altitude"
#
# Libraries: numpy, matplotlib, scipy.integrate
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. Plot 1 shows both trajectories side by side. The 1-second difference in burn time produces a visibly higher and longer arc. The student sees that the two trajectories diverge at burnout and the gap widens throughout the coast phase.
2. Plot 4 reveals the sensitivity: apogee increases approximately linearly with burn time near the MR-2 operating point, at a rate of about 68 km per second. A 5-second overburn would have put the capsule at ~525 km -- deep space conditions. A 10-second overburn approaches orbital velocity. The boundary between "suborbital test" and "orbital insertion" is approximately 30 seconds of additional burn.

---

### A2. Python: G-Force Profile Simulator (Nominal vs Abort)

**What it is:** A simulation that computes and visualizes the g-force experienced by the capsule occupant throughout the MR-2 flight profile, comparing the planned (nominal) profile to the actual (abort/overburn) profile. The simulation models the increasing g-load during powered flight (as mass decreases), the 0g coast phase, and the reentry deceleration peak. The student can see the exact moment where the actual profile diverges from the planned profile and watch the reentry g-peak climb from ~11g to ~14.7g.

**Why it matters:** Ham's survival at 14.7g was the biomedical data point that qualified the Mercury capsule for human flight. This simulation shows exactly how the overburn led to the excessive g-load: higher burnout velocity -> higher apogee -> steeper reentry angle -> faster deceleration -> higher peak g. The chain of causation is traceable from a 1-second timing error to a force that pressed a chimpanzee at nearly 15 times his own weight into a fiberglass couch.

**Specification:**

```python
# mr2_gforce.py
# Mercury-Redstone 2 g-force profile: nominal vs abort
#
# Process:
#   1. Compute thrust/weight ratio during powered flight
#   2. Model coast phase as 0g (freefall)
#   3. Model reentry using Allen-Eggers ballistic entry equations
#   4. Generate g-load vs time for both nominal and actual profiles
#   5. Overlay human/primate tolerance limits
#   6. Show Ham's reaction time at each g-level
#
# Parameters (user-adjustable):
#   burn_time_s: 140-148 (affects reentry conditions)
#   capsule_mass_kg: 1000-2000 (nominal 1360)
#   drag_area_m2: 2.0-4.0 (nominal 2.81, Mercury heat shield)
#   cd: 1.0-2.0 (nominal 1.60, blunt body)
#
# Visualization:
#   - Plot 1: G-force vs time (full flight)
#     X-axis: mission elapsed time (0-1000 s)
#     Y-axis: g-load (-1 to 16 g)
#     Curve 1 (blue): Nominal profile (143s burn)
#     Curve 2 (red): Actual profile (144s burn, abort)
#     Zones:
#       Green band: 0-6g (comfortable range)
#       Yellow band: 6-11g (design limit)
#       Red band: 11-15g (above design, Ham's experience)
#     Horizontal lines:
#       11g dashed: "Mercury design limit"
#       14.7g dotted: "MR-2 actual peak"
#       5g: "Fighter pilot sustained limit (+Gz)"
#     Phase labels: LAUNCH | COAST (0g) | REENTRY | CHUTE
#     Annotations at key points:
#       "Ignition: 1.18g"
#       "Max-Q: ~3g"
#       "Burnout: 6g"
#       "Coast: 0g (6 min 30 sec)"
#       "Planned peak: 11g"
#       "ACTUAL PEAK: 14.7g"
#
#   - Plot 2: Reentry zoom (t = 500-700 s)
#     Expanded view of the reentry phase only
#     Both profiles overlaid
#     Shows how the actual profile reaches higher peak and
#     slightly shorter duration (steeper entry = faster decel)
#     Ham's reaction time overlaid as bar chart at bottom:
#       bars showing estimated RT at each g-level
#
#   - Plot 3: G-load vs Ham's performance
#     X-axis: g-load (0-16 g)
#     Y-axis: reaction time (ms, left) and channel capacity
#       (bits/s, right)
#     Scatter points from Ham's actual data
#     Fitted curve: RT = RT_baseline * (1 + k * g^n)
#     Channel capacity curve: C = C_baseline / (1 + k * g^n)
#     Key marker: at 14.7g, C ≈ 0.53 bits/s (>0)
#     Annotation: "Performance degrades but NEVER reaches zero"
#
#   - Plot 4: What-if scenarios
#     Bar chart comparing peak g-load for different overburns:
#       0s extra: ~11.0g (nominal)
#       1s extra: ~14.7g (actual MR-2)
#       2s extra: ~18.5g (estimated)
#       3s extra: ~22.0g (estimated)
#       5s extra: ~28.0g (estimated, likely fatal)
#     Color-coded: green (survivable), yellow (dangerous), red (fatal)
#     Annotation: "1 second separated survivable from lethal"
#
# Libraries: numpy, matplotlib, scipy
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The full-flight g-profile (Plot 1) shows the dramatic contrast between the gentle coast phase (6.5 minutes of 0g) and the violent reentry (14.7g). Ham went from floating weightlessly to being crushed at nearly 15 times his weight in approximately 2 minutes. The transition is not gradual -- the g-load rises steeply as the capsule enters denser atmosphere.
2. Plot 3 shows that cognitive performance degrades smoothly with g-load -- there is no cliff, no threshold where function ceases. This smooth degradation curve is what made Ham's data so valuable: it showed that the human tolerance margin (11g design limit) had headroom, not a cliff edge.
3. Plot 4 shows the narrow margin between survival and death. One second of overburn: survivable (14.7g). Three seconds: probably fatal (22g). Five seconds: certainly fatal (28g). The Redstone's engine cutoff reliability was the difference between a live chimpanzee and a dead one.

---

### A3. Web: Interactive "Can You Beat Ham?" Reaction Time Game

**What it is:** A browser-based reaction time game that challenges the player to match Ham's performance under simulated stress conditions. The game presents the same task Ham performed -- a stimulus light appears, the player must click the correct button within 5 seconds -- but with visual distortions that simulate the effects of g-loading on perception and motor control. The player's reaction time is measured at each simulated g-level and compared directly to Ham's actual flight data.

**Specification:**

```
WEB APPLICATION: "Can You Beat Ham?" Reaction Time Challenge
============================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  CAPSULE INTERIOR (center, 60% of screen):
    Simulated Mercury capsule instrument panel
    Dark background with instrument lighting
    Two response buttons (left and right), matching
    Ham's two-lever setup
    Stimulus light: blue circle that illuminates randomly

    G-FORCE SIMULATION (visual effects):
    The game simulates g-loading through visual distortion:

    0g (weightlessness):
      - Screen elements drift slightly (float effect)
      - Buttons wobble gently in position
      - Cursor drifts slowly when not actively moved
      - Subtle rotation of the instrument panel

    3g (moderate launch):
      - Slight blur around edges of screen
      - Buttons compress vertically (simulating visual
        narrowing under g-load)
      - Cursor movement requires more mouse travel
        (simulating increased arm weight)

    6g (max launch):
      - Significant peripheral blur (tunnel vision onset)
      - Buttons compressed and harder to see
      - Cursor movement requires 2x normal mouse travel
      - Random cursor offset (simulating hand tremor)

    11g (design limit):
      - Heavy tunnel vision (center 50% of screen visible)
      - Buttons barely visible through blur
      - Cursor requires 3x travel with random jitter
      - Screen shakes (vibration simulation)
      - Color desaturation (graying of peripheral vision)

    14.7g (Ham's actual peak):
      - Extreme tunnel vision (center 30% visible)
      - Buttons visible only as dim shapes
      - Cursor requires 4x travel with heavy jitter
      - Strong screen shake
      - Red tint at edges (simulating redout from
        blood pressure in retinal vessels)
      - Audio muffled (simulating pressure on eardrums)

  TELEMETRY PANEL (right, 20% of screen):
    G-FORCE GAUGE:
      Analog gauge showing current simulated g-level
      Needle sweeps through the flight profile in real time
      Color zones: green (0-6), yellow (6-11), red (11+)

    ALTITUDE GAUGE:
      Shows current altitude on the trajectory
      Synced with g-profile (0g during coast, high-g during
      reentry)

    REACTION TIME DISPLAY:
      Current trial RT (large, updating)
      Mean RT this session
      Best RT this session

    HAM'S DATA (for comparison):
      Shows Ham's actual RT at current g-level
      Bar graph: Your RT vs Ham's RT
      Running score: trials where you beat Ham's time

  SCOREBOARD (left, 20% of screen):
    YOUR PERFORMANCE:
      Trials completed: __
      Correct responses: __
      Timeouts (>5000ms): __
      Mean RT: ____ ms
      Channel capacity: ____ bits/s

    HAM'S PERFORMANCE:
      Same metrics from actual flight data

    COMPARISON:
      "You beat Ham in X of Y trials"
      or "Ham beat you in X of Y trials"

    PHASE SCORES:
      Each flight phase scored separately:
        Launch (0-6g): Your RT vs Ham's
        Coast (0g): Your RT vs Ham's
        Reentry (11-14.7g): Your RT vs Ham's

GAME MODES:

  QUICK PLAY (3 minutes):
    The game runs through a compressed version of
    MR-2's g-profile: 30 seconds of launch (0-6g),
    60 seconds of coast (0g), 30 seconds of reentry
    (6-14.7g), and 60 seconds of recovery (1g).
    Stimulus lights fire every 5-10 seconds.
    Total: approximately 20 trials.

  FULL FLIGHT (16 minutes 39 seconds):
    The game runs in real time, matching MR-2's
    actual flight duration. G-profile follows the
    actual flight data. Stimulus lights fire at
    intervals matching Ham's actual task schedule.
    This mode requires commitment -- 16 minutes in
    a simulated capsule with increasing visual
    distortion. Most players will quit during the
    reentry phase. Those who complete it will have
    a visceral understanding of what Ham experienced.

  STRESS TEST:
    The g-level increases continuously from 0 to 20g
    (visual effects only, obviously). The game
    measures at what simulated g-level the player
    can no longer respond within the 5-second window.
    This is the player's simulated "g-tolerance limit."
    Ham's was >14.7g (he never stopped responding).

Interactions:
  - Click left or right button to respond to stimulus
  - Stimulus position (left/right of center) indicates
    which button to press (matches Ham's task)
  - Wrong button = error (buzzer sound)
  - No response in 5 seconds = timeout (alarm sound)
  - SPACE bar pauses/resumes
  - ESC returns to menu

Sound effects (Web Audio API):
  - Stimulus presentation: soft chime
  - Correct response: satisfying click
  - Wrong response: buzzer
  - Timeout: alarm
  - Engine rumble: continuous during powered phases
  - Silence during 0g coast (emphasizes weightlessness)
  - Reentry roar: increasing during reentry
  - G-force effects: heartbeat sound that speeds up
    with g-load (simulating cardiac response)

Victory conditions:
  - "Ham-Level Performance": Complete all trials with
    mean RT within 20% of Ham's at each g-level
  - "Better Than Ham": Beat Ham's mean RT in all phases
  - "Right Stuff": Complete Full Flight mode with
    zero timeouts
  - "14.7g Survivor": Complete the reentry phase in
    Stress Test mode at 14.7g equivalent

End screen:
  Full comparison table: Your RT vs Ham's at each g-level
  Channel capacity comparison graph
  Historical context: "On January 31, 1961, Ham performed
  this task at ACTUAL 14.7g, not simulated. He was a
  37-pound chimpanzee strapped into a capsule 253 km
  above the Atlantic Ocean. He pulled the lever. He
  proved that primates could function in space. Every
  human spaceflight since rests on his performance."

Deliverables:
  - Single HTML file, self-contained
  - < 1500 lines total
  - 60 fps minimum for visual effects
  - All g-force visual effects smoothly animated
  - Sound via Web Audio API (no external files)
  - Mobile-responsive (touch targets for buttons)
  - Saves high scores in localStorage
```

**Key learning moment:** The reentry phase. The screen narrows to a tunnel, the cursor fights the player's mouse movements, the buttons blur, the red tint creeps in from the edges, and the stimulus light fires. The player must click the correct button within 5 seconds. Most players will fail several times during the 14.7g phase -- not because the task is intellectually difficult (it is trivially simple), but because the visual distortion and cursor resistance make the motor execution nearly impossible. And then the game shows Ham's data: he did this, at ACTUAL 14.7g, not simulated visual effects. His arm weighed 55 pounds. He reached forward and pulled the lever. The gap between the player's simulated experience and Ham's real experience is the gap between a game and a test flight.

---

### A4. Web: Suborbital Trajectory Visualizer

**What it is:** An interactive web visualization that shows Mercury-Redstone 2's trajectory from launch at Cape Canaveral to splashdown in the Atlantic, plotted on a spherical Earth projection. The student can drag a slider to adjust the burn time (140-148 seconds) and watch the trajectory arc change in real time: the apogee rises and falls, the splashdown point moves downrange, and the reentry g-force indicator changes color. A second view shows the trajectory from the side (altitude vs. downrange), and a third view shows the g-force timeline.

**Specification:**

```
WEB APPLICATION: MR-2 Suborbital Trajectory Visualizer
=======================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  MAP VIEW (top, 50% of screen):
    Orthographic projection of Earth, centered on the
    western Atlantic (showing Florida to Bermuda)
    Land masses: green/brown (Florida, Bahamas, Caribbean)
    Ocean: deep blue gradient
    Latitude/longitude grid: subtle gray lines

    TRAJECTORY ARC:
      Drawn as a curve from Cape Canaveral (28.5 N, 80.6 W)
      to the splashdown point
      Color-coded by g-force at each point:
        Green: 0-6g
        Yellow: 6-11g
        Orange: 11-14g
        Red: 14-16g
      Line width: thicker during powered flight, thinner
        during coast

    MARKERS:
      Launch site: small rocket icon at Cape Canaveral
      Burnout point: yellow diamond
      Apogee: white star (with altitude label)
      Entry interface (120 km): orange triangle
      Splashdown: blue splash icon

      Planned splashdown zone: blue circle (target area)
      Actual splashdown: red X (if different from planned)

      Recovery ship USS Donner: small ship icon

    Planned trajectory shown as dashed blue line
    Actual trajectory shown as solid red line
    The two diverge at burnout and the gap widens

  PROFILE VIEW (bottom-left, 25% of screen):
    Side view: altitude (Y, 0-300 km) vs downrange (X, 0-800 km)
    Same color-coding as map view
    Karman line (100 km) shown as horizontal dashed line
    Earth's curvature visible at this scale
    Both planned and actual trajectories overlaid

  CONTROLS (bottom-right, 25% of screen):
    BURN TIME SLIDER:
      Range: 140.0 to 148.0 seconds (0.1s increments)
      Default: 143.0 (planned)
      MR-2 actual: 144.0 (marked on slider)
      As the slider moves, the trajectory updates in real time

    READOUT PANEL:
      Burn time: ___ s
      Burnout velocity: ____ m/s
      Apogee: ___ km
      Downrange: ___ km
      Peak reentry g: ___ g
      Flight time: __:__
      Splashdown distance from planned: ___ km

      Status indicator:
        Green: within design envelope
        Yellow: marginal (11-14g reentry)
        Red: above design limits (>14g reentry)
        Flashing red: likely non-survivable (>20g)

    PRESET BUTTONS:
      "Planned (143s)": sets slider to 143.0
      "Actual MR-2 (144s)": sets slider to 144.0
      "Critical (146s)": sets slider to estimated lethal threshold
      "Orbital (155s)": sets slider to approximate orbital insertion

    ANIMATION CONTROLS:
      Play/Pause: animates a capsule icon along the trajectory
      Speed: 1x (real time), 10x, 100x
      Timeline scrubber: jump to any point in the flight

Interactions:
  - Slider adjusts burn time, trajectory updates live
  - Click any point on the trajectory to see flight data
    at that moment (time, altitude, velocity, g-load)
  - Hover over markers for detailed information
  - Mouse wheel zooms the map view
  - Click and drag to pan the map
  - Toggle between planned/actual with a switch

Key data displays:
  When slider is at 143.0 (planned):
    "Apogee: 185 km | Range: 480 km | Peak g: 11.0"
  When slider is at 144.0 (actual):
    "Apogee: 253 km | Range: 679 km | Peak g: 14.7"
    "1 EXTRA SECOND OF BURN"
  When slider is at 146.0:
    "Apogee: ~389 km | Range: ~950 km | Peak g: ~19.2"
    "WARNING: ABOVE HUMAN TOLERANCE"
  When slider is at 155.0:
    "ORBITAL VELOCITY ACHIEVED"
    "This is no longer a suborbital trajectory"
    The trajectory arc closes into an ellipse

Deliverables:
  - Single HTML file, self-contained
  - < 1200 lines total
  - Smooth trajectory updates at 30+ fps
  - Accurate orbital mechanics (Keplerian conic sections)
  - Responsive layout (works on tablet and desktop)
```

**Key learning moment:** The slider. The student drags from 143.0 to 144.0 -- one second -- and watches the apogee jump from 185 km to 253 km, the splashdown move 200 km farther downrange, and the reentry g-force indicator turn from green to red. One second of burn. That is the lesson. Then the student keeps dragging: at 146 seconds the g-force is lethal, at 155 seconds the trajectory is orbital. The entire range from "safe suborbital test" to "orbit" is 12 seconds of burn time. The Redstone's engine cutoff system had to be accurate to within that 12-second window or the mission outcome changed from "test flight" to "orbiting chimpanzee with no deorbit capability." The engineering margin was thin, and MR-2 brushed against its edge.

---

## B. Machine Learning -- What to Train

### B1. Reaction Time Degradation Predictor

**What it is:** Train a regression model to predict reaction time as a function of g-load, using Ham's flight data as training input and centrifuge data for validation. The model learns the relationship between physical stress and cognitive performance.

```
Model: Polynomial regression / neural network regressor

Input:
  - Current g-load (0-20 g)
  - Direction (+Gx, -Gx, +Gz, -Gz)
  - Duration at current g-level (seconds)
  - Subject type (human/chimpanzee)

Output: Predicted reaction time (ms)

Training data:
  - Ham's MR-2 flight data: ~40 data points across
    0g, 3g, 6g, 11g, 14.7g (interpolated from flight
    telemetry and post-flight analysis)
  - Centrifuge data from USAF School of Aerospace
    Medicine: ~500 data points from human subjects
    at various g-levels and directions
  - Augmented with synthetic data: Gaussian noise
    on existing data points to increase training set

Architecture options:
  - Polynomial regression: RT = a + b*g + c*g^2
    (simplest, often sufficient)
  - Neural network: FC(8) -> ReLU -> FC(4) -> ReLU -> FC(1)
    (captures nonlinear relationship)
  - Gaussian process regression (best for small datasets
    with uncertainty quantification)

Expected results:
  - The model should learn the monotonically increasing
    relationship between g-load and RT
  - It should predict that RT approximately triples
    between 0g and 14.7g
  - Uncertainty should increase at high g-loads where
    data is sparse
  - The model should NOT predict RT = infinity at any
    g-load (Ham's data shows capacity never reaches zero)

The student learns:
  - How to fit a model to sparse, noisy biological data
  - The importance of physical constraints (RT > 0,
    RT increases with g) as model priors
  - How a trained model can interpolate between Ham's
    sparse measurements to predict performance at
    g-loads not directly tested (e.g., 8g, 12g)
  - This is exactly how NASA used Ham's data: interpolate
    to predict human performance at the planned 11g
    reentry, using data from centrifuge tests and Ham's
    flight

Libraries: numpy, scikit-learn or torch, matplotlib
GPU: Not needed (tiny model)
Difficulty: Beginner-Intermediate
```

---

## C. Computer Science -- The Abort Decision

### C1. Abort Logic: When the Safety System Makes Things Worse

MR-2's abort system activated because the engine burned 1 second too long -- an off-nominal condition. The abort pulled the capsule to a higher trajectory, which caused a steeper reentry and 14.7g instead of 11g. The abort system, designed to save the occupant, increased the danger. This is a common pattern in safety-critical systems.

```
CONCEPT: The Abort Paradox

An abort system is designed to handle failures.
But the abort itself changes the system state,
potentially creating new failure modes.

MR-2 abort sequence:
  1. Engine overburn detected (velocity exceeded threshold)
  2. Abort system activates
  3. Capsule separates from booster early
  4. Escape tower fires (or posigrade rockets)
  5. Capsule pushed to higher trajectory
  6. Higher trajectory = higher apogee = steeper reentry
  7. Steeper reentry = higher g-force = greater risk

The paradox:
  - WITHOUT abort: ~12g reentry (1s overburn effect only)
  - WITH abort: ~14.7g reentry (abort pushed capsule higher)
  - The abort INCREASED the peak g-force by ~23%

Should the abort have fired?
  The abort system could not know that the overburn
  was only 1 second. It detected an off-nominal velocity
  and responded according to its design. The design
  was binary: nominal or abort. There was no "minor
  anomaly" mode.

Modern approach: graduated response
  1. Minor anomaly: adjust trajectory, compensate
  2. Moderate anomaly: early engine cutoff, accept
     non-optimal trajectory
  3. Major anomaly: full abort (capsule separation)
  4. Critical anomaly: escape tower fire

  MR-2's 1-second overburn was a MINOR anomaly that
  triggered a MAJOR response. A graduated system would
  have simply cut the engine 1 second late, accepted
  the ~12g reentry, and called it nominal.

  Modern launch vehicles (Falcon 9, SLS) use graduated
  abort criteria: the severity of the response matches
  the severity of the anomaly. This is the lesson of
  MR-2's abort paradox.

EXERCISE:
  Write a Python function that implements graduated
  abort logic:

  def abort_decision(overburn_seconds, velocity_excess_mps):
      if overburn_seconds < 0.5 and velocity_excess_mps < 15:
          return "NOMINAL -- accept minor deviation"
      elif overburn_seconds < 2.0 and velocity_excess_mps < 60:
          return "ADVISORY -- engine cutoff, accept trajectory"
      elif overburn_seconds < 5.0:
          return "ABORT -- capsule separation"
      else:
          return "ESCAPE -- tower fire, emergency separation"

  Under this logic, MR-2's 1-second overburn (27.8 m/s
  excess) would have received an ADVISORY, not an ABORT.
  The capsule would have stayed attached to the booster,
  the engine would have been cut, and the reentry would
  have been approximately 12g -- within design limits.

  Compare:
    MR-2 actual (binary abort): 14.7g reentry
    MR-2 graduated (advisory):  ~12g reentry
    MR-2 nominal (no overburn): ~11g reentry

  The graduated system reduces the penalty of the 1-second
  overburn from +3.7g to +1g. The abort system, by trying
  to help, made things 3.7x worse than doing nothing.
```

---

## D. Game Theory -- The Qualification Dilemma

### D1. How Many Animal Tests Before You Fly a Human?

MR-2 was successful: Ham survived, performed his tasks, and was recovered alive. But NASA did not fly a human on the next Redstone. Instead, they flew MR-BD (booster development) -- another unmanned test -- before committing Alan Shepard to MR-3 on May 5, 1961. This decision cost NASA three weeks, during which the Soviet Union flew Yuri Gagarin (April 12, 1961). Was the extra test worth it?

```
GAME THEORY: The Qualification Decision

Players:
  1. NASA (wants safe human flight, wants to be first)
  2. Soviet Union (wants to be first, risk tolerance unknown)

NASA's decision after MR-2:
  Option A: Fly Shepard on MR-3 immediately
    Pro: Beat the Soviets (Gagarin flew April 12)
    Con: 1-second overburn not fully understood
         14.7g was above design limits
         What if the overburn was a systematic issue?

  Option B: Fly MR-BD first, then Shepard
    Pro: Verify the overburn was a one-time event
         Demonstrate nominal trajectory before human flight
    Con: 3-week delay -- risk Soviets flying first

NASA chose Option B. Gagarin flew first.

Was this the right decision?
  From a safety perspective: yes. MR-BD confirmed that
  the overburn was not a systematic issue. Shepard's
  MR-3 flight was nominal.

  From a strategic perspective: debatable. The US
  was second to orbit a human. This had enormous
  political consequences (Kennedy's "we choose to go
  to the Moon" speech was partly a response to the
  perceived Soviet lead).

  From a game-theory perspective: the decision depends
  on the value function:
    V = P(success) * reward_success
      - P(failure) * cost_failure
      - P(delay) * cost_delay

  For Option A:
    P(success) ≈ 0.95 (Ham survived worse conditions)
    reward_success = HUGE (first human in space)
    P(failure) ≈ 0.05 (overburn might recur, might be worse)
    cost_failure = ENORMOUS (dead astronaut, program cancellation)
    Expected value: high reward * 0.95 - enormous cost * 0.05

  For Option B:
    P(success after delay) ≈ 0.99 (verified by extra test)
    reward_success = LARGE (human in space, but second)
    cost_delay = SIGNIFICANT (Soviets might fly first)
    Expected value: large reward * 0.99 - significant cost * 1.0

  The decision hinges on whether the cost of a dead
  astronaut exceeds the cost of being second. NASA
  decided it did. History judged this harshly at the
  time (Gagarin!) but favorably in retrospect (Shepard
  flew safely, the Mercury program succeeded, Apollo
  reached the Moon).
```

---

## E. Creative Arts -- What to Compose, Write, and Render

### E1. GLSL Shader: "253 Kilometers"

A fragment shader that renders the view from Mercury capsule #5 at apogee -- 253 km above the Atlantic Ocean. The shader shows the curvature of the Earth, the thin blue line of the atmosphere, the blackness of space above, and the sunlit ocean below. The capsule window frame is visible at the edges. This is what Ham could have seen if he had looked out the window -- but he was pulling levers, not sightseeing.

```
SHADER SPECIFICATION: "253 Kilometers"

Resolution: 1920x1080
Palette: Photorealistic orbital view

Layers:
  1. Space:
     - Pure black above the atmosphere
     - Stars: procedural, magnitude-appropriate density
     - Sun: off-screen right, illuminating the Earth below
     - No nebulae or galaxies (too faint from LEO)

  2. Earth:
     - Spherical, viewed from 253 km altitude
     - Visible arc of curvature (~15 degrees from this altitude)
     - Atlantic Ocean: deep blue-black with sunglint
     - Cloud formations: procedural cumulus over ocean
     - Florida coastline visible at upper left
     - Bahamas islands visible below
     - No city lights (daytime view)

  3. Atmosphere:
     - Thin blue band at the limb of the Earth
     - Rayleigh scattering gradient: blue at bottom,
       transitioning to black at top
     - Thickness: ~1-2 pixels at this scale (the atmosphere
       is 100 km thin, viewed from 253 km above it)
     - This thinness is the message: all of Earth's air,
       all of its weather, all of its breathable atmosphere,
       is that thin line

  4. Capsule window:
     - Frame visible at edges: dark gray metal
     - Trapezoid-shaped window (Mercury capsule window shape)
     - Internal reflections: faint ghost of instrument panel
     - Condensation at edges (temperature differential)

  5. Animation:
     - Earth rotates slowly (1 degree per minute at this scale)
     - Clouds drift
     - Sunglint shifts
     - Stars do not move (sidereal rate is imperceptible)
     - At t=0: this is apogee. The capsule is weightless.
       Objects in frame drift slightly (camera float)

  6. Overlay text (optional):
     "Mercury-Redstone 2 -- January 31, 1961"
     "Altitude: 253 km (157 statute miles)"
     "Passenger: Ham (Holloman Aero Med #65)"
     "He was pulling levers, not watching this view."
```

### E2. Short Story: "Five Seconds"

A creative nonfiction account of MR-2 from Ham's perspective -- or as close to it as honest writing can approximate. The story follows the 5-second cycle of Ham's conditioned task: blue light appears, Ham reaches for the lever, presses it, receives a banana pellet or a shock. The story repeats this cycle through each phase of the flight, with the physical sensations changing as the g-forces change. During launch, the lever is heavy but reachable. During weightlessness, the lever is strange -- Ham's arm floats, the pellet floats, everything is wrong but manageable. During reentry, the lever is impossibly heavy, Ham's vision narrows, the light is dim through the tunnel, but he reaches, he presses, he completes the task. The story does not anthropomorphize Ham beyond what the behavioral data support: he was stressed, he performed his task, he was recovered alive.

```
STORY SPECIFICATION: "Five Seconds"

Perspective: Third-person limited, centered on Ham's
  sensory experience. No inner monologue (we cannot
  know what a chimpanzee thinks). Only sensory data:
  what he sees, feels, hears, smells. And his actions:
  what he does with his hands.

Tone: Precise, compassionate, unsentimental. The story
  respects Ham by describing what he actually
  experienced, not what we want to imagine he
  experienced. No Disney. No talking animal. A
  chimpanzee in a capsule, doing what he was trained
  to do, under conditions that would have broken
  a less resilient organism.

Structure:
  Each section is one 5-second task cycle:

  1. THE LIGHT (ground test, morning of January 31)
     Ham in the capsule on the pad. Quiet. Vibration
     from the gantry. The blue light appears. His hand
     moves without thought. Press. Pellet drops into
     the tray. He eats it. The world is small: couch,
     lights, levers, pellets. He has done this ten
     thousand times.

  2. THE LIGHT (launch, t+30s, 2g)
     Everything shakes. The noise is enormous. His
     chest is heavy. The light appears. His arm is
     heavy. He reaches -- the motion takes longer
     than usual. Press. Pellet. His fingers close
     on it but the pellet is hard to pick up when
     his hand weighs twice normal.

  3. THE LIGHT (max-Q, t+70s, 3g)
     The shaking intensifies. The noise peaks. He
     can feel his face pulled backward into the
     couch. The light. Reach. Press. His reaction
     time is 1,200 ms. The pellet drops.

  4. THE LIGHT (burnout, t+143s, 6g)
     Sudden silence. The vibration stops. But the
     weight -- his arm weighs six times normal. The
     light appears. He sees it clearly. His arm moves
     slowly, as if through water. Press. The lever
     requires force he can barely produce. 1,750 ms.
     Pellet. He cannot pick it up. It sits in the tray.

  5. THE LIGHT (0g, t+200s)
     Nothing weighs anything. His arms float. The
     pellets float. He is confused -- his vestibular
     system reports freefall, but he is not falling
     (there is no wind, no acceleration, no impact).
     The light. He reaches -- his arm overshoots,
     floating past the lever. He pulls it back.
     Press. 1,000 ms. A pellet drifts out of the
     tray. He watches it float.

  6. THE LIGHT (reentry onset, t+540s, 8g)
     Weight returns. Suddenly. Not gradually -- the
     atmosphere grabs the capsule and pulls. His
     chest compresses. The light. Reach. His arm is
     impossibly heavy. Press. 2,000 ms.

  7. THE LIGHT (peak reentry, t+600s, 14.7g)
     His vision narrows to a tunnel. The edges of
     the world are red. He weighs 250 kilograms.
     His arm weighs 25 kilograms. His fingers weigh
     more than his whole hand should. The light appears
     at the end of the tunnel -- dim, blue, distant.
     He reaches. His arm does not want to move. He
     forces it. The motion takes 2.5 seconds. He
     cannot feel the lever through the pressure on
     his fingers. He pushes. Something gives. 3,000 ms.
     He is not sure if the pellet dropped. He cannot
     move his head to look. He breathes. Each breath
     requires pushing his chest against 250 kilograms.
     He breathes. He waits.

  8. THE LIGHT (post-reentry, t+680s, 1g)
     Normal weight. The tunnel opens. Colors return.
     His arm moves easily. The light. Press. 900 ms.
     Almost baseline. The capsule shakes -- drogue
     parachute. Then the main chute. He is descending.
     The pellets are in the tray. He eats one.

  9. THE WATER (splashdown, t+999s)
     Impact. Water. The capsule rocks. Ham hears water.
     He knows water. Water is coming in -- a valve
     has failed. His feet are wet. The world tilts.
     He pulls against his restraints. He is not calm.
     He is a 3-year-old chimpanzee from Cameroon in
     a metal capsule filling with seawater. He makes
     sounds -- distress calls, vocalizations his
     handlers would recognize.

  10. THE HANDS (recovery, t + several hours)
      The hatch opens. Light. Air. Faces he knows.
      Hands he knows. Handlers from Holloman. He
      reaches for them. They reach for him. They
      give him an apple. He eats it. His nose is
      bruised. His feet are wet. He is alive. He
      does not know what he proved. He does not know
      that in 94 days, a human named Shepard will
      sit where he sat, reach for the same controls,
      and fly because Ham pulled the lever at 14.7g.
      He knows the apple. He knows the hands. He
      knows he is out of the capsule. That is enough.

Length: 2,000-3,000 words
```

---

## F. Problem-Solving Methodology -- The Biomedical Qualification Ladder

### F1. Test Hierarchy for Human-Rated Systems

MR-2 was the penultimate step in the Mercury biomedical qualification ladder: bench tests -> animal tests -> human flight. The methodology for qualifying a system for human use follows a strict hierarchy, with each level providing data that the next level requires.

```
METHODOLOGY: Biomedical Qualification Ladder

Level 1: ANALYSIS AND SIMULATION
  - Compute expected g-loads, temperatures, pressures
  - Model physiological responses using known data
  - Identify the unknowns: what can't be predicted?
  For MR-2: trajectory analysis predicted 11g reentry.
  The unknown: primate cognitive function in 0g.

Level 2: COMPONENT TESTING
  - Test individual components (seat, harness, controls)
  - Verify structural margins (can the seat handle 20g?)
  - Verify life support (does the O2 system work?)
  For MR-2: the contour couch was tested on centrifuge.
  The environmental control system was tested in vacuum
  chambers. Each component passed individually.

Level 3: UNMANNED SYSTEM TEST
  - Fly the complete system without a biological payload
  - Verify integrated performance
  For MR-2: MR-1 (failed, sneak circuit), MR-1A (success)
  provided data on the integrated system without risking
  a biological subject.

Level 4: ANIMAL SUBJECT TEST
  - Fly with a biological payload that can perform
    measurable tasks
  - Collect physiological and behavioral data
  - Compare to predictions from Levels 1-3
  For MR-2: THIS IS HAM'S FLIGHT. The purpose was to
  fill the gap between "the hardware works" (Level 3)
  and "a human can operate it" (Level 5).

Level 5: HUMAN FLIGHT
  - Fly with a human crew
  - The human provides higher-fidelity data than the
    animal model (subjective reports, complex tasks,
    extended mission capability)
  For MR-2: Alan Shepard, MR-3, May 5, 1961.

This ladder is still used in 2026:
  - Commercial Crew (SpaceX, Boeing): unmanned demo
    flight before crewed demo flight
  - Artemis: unmanned Artemis I before crewed Artemis II
  - Starliner: unmanned OFT-1 and OFT-2 before CFT

The animal testing step (Level 4) has been largely
eliminated in modern spaceflight because the Level 4
data from the 1960s is still valid: primates can
function in space. Ham's data is still cited in
crew qualification documents 65 years later. His
flight was sufficient. It did not need to be repeated.
```

---

## G. GSD Improvements -- What to Build for gsd-skill-creator

### G1. Graduated Response Chipset

MR-2's abort paradox -- the safety system making things worse -- is a pattern in software systems: the error handler causes more damage than the error. A graduated response chipset would:

```
CHIPSET: Graduated Response

Purpose: Replace binary error handling (ok/abort) with
  graduated responses matched to anomaly severity.

Chips:
  1. anomaly-classifier: Assess severity of detected anomaly
     (minor / moderate / major / critical) using threshold
     rules or ML classification.

  2. response-scaler: Map severity to response level:
     - Minor: log, continue, adjust parameters
     - Moderate: warn, reduce scope, add monitoring
     - Major: pause, checkpoint, request guidance
     - Critical: abort, rollback, alert

  3. outcome-tracker: Record the response taken and its
     outcome. Feed back into anomaly-classifier to improve
     future classification (was the response proportionate?).

  4. paradox-detector: Identify cases where the response
     made things worse (the MR-2 pattern). Flag these for
     review and threshold adjustment.

Application:
  - Build pipelines: a lint warning shouldn't abort the build
  - Agent coordination: a slow agent shouldn't trigger full
    convoy restart
  - Deployment: a canary failure shouldn't roll back the
    entire fleet if it's a single-node issue

The MR-2 lesson: match the response to the anomaly.
A 1-second overburn is not an explosion. A lint warning
is not a compilation failure. A slow agent is not a
crashed agent. Treating minor anomalies as critical ones
wastes the system's resources and may create new problems
(14.7g reentry) that are worse than the original issue
(1 second of extra velocity).
```

### G2. Performance Under Load Monitoring

Ham's reaction time data created a performance-vs-load curve that NASA used to predict astronaut capability. A similar system for gsd-skill-creator agents:

```
CHIPSET: Load-Performance Monitor

Purpose: Track agent performance metrics (response time,
  error rate, throughput) as a function of system load,
  and predict when degradation will cross unacceptable
  thresholds.

Chips:
  1. load-sensor: Measure current system load (context
     window usage, concurrent tasks, file count, etc.)

  2. performance-sensor: Measure agent performance
     (response latency, output quality score, error
     frequency)

  3. degradation-model: Fit a curve to (load, performance)
     data, predicting performance at loads not yet
     observed. Uses Ham's model: performance = baseline /
     (1 + k * load^n). Key insight: the model should
     never predict zero performance -- degradation is
     asymptotic, not cliff-edged.

  4. threshold-alerter: When predicted performance at
     current load trajectory will cross a threshold
     (e.g., response time > 30s), alert before it
     happens. Enable proactive load shedding.

The MR-2 insight: cognitive performance under load
follows a smooth degradation curve with no cliff.
Systems designed with hard capacity walls ("above X
load, the system fails") are brittle. Systems designed
with smooth degradation ("above X load, the system
slows but continues") are robust. Ham's brain was
robust. Build agents the same way.
```

---

*"The rough-skinned newt does not hurry. It has never hurried. It crosses the forest floor at 2 centimeters per second, a pace that covers 72 meters per hour, less than a kilometer in a full day of continuous walking -- and it does not walk continuously. It stops. It sits under a leaf. It investigates a beetle. It pauses on a log and lets the rain fall on its back, which is the color of dark coffee and beaded with granular glands full of tetrodotoxin. It has nowhere to be urgently. Its breeding pond will still be there tomorrow, next week, next month. The pond has been there since the last glaciation scraped the valley 12,000 years ago. The newt's ancestors were crossing to that pond before the cedar trees that shade the trail today had germinated. The trail itself was worn by the newts, not by hikers -- though hikers use it now, and the newts die under their boots without either party noticing. Franz Schubert hurried. He had 31 years and 1,500 compositions to write, and the syphilis was already in his blood by 25. He composed with a velocity that his contemporaries found unsettling: a lied in an afternoon, a symphony movement in a week, a string quartet in days. He did not have the rough-skinned newt's luxury of geological time. He had biological time -- the time between infection and organ failure, the time between the first lesion and the last sonata. He used every minute. The B-flat sonata, composed months before his death, is 40 minutes of music that would take most composers a year. Schubert wrote it in weeks, during a period when he could not always hold a pen steadily. Performance under load. Ham pulled his lever at 14.7g with an arm that weighed 55 pounds. Schubert wrote the B-flat sonata with hands that were beginning to fail. The rough-skinned newt crosses the forest floor with enough tetrodotoxin in its skin to kill everything within a 10-meter radius, moving at a pace that suggests it has all the time in the world -- and it does, because nothing dares eat it. Three strategies for surviving extreme conditions: force your way through (Ham), outrun the decline (Schubert), or make the conditions irrelevant (the newt). The Mercury capsule gave Ham the first strategy. Genius gave Schubert the second. Chemistry gave the newt the third. All three work. All three cost the organism something. Ham's cost was 14.7g and a bruised nose. Schubert's cost was everything -- 31 years, no more. The newt's cost is invisibility: it is so slow, so quiet, so ground-level that it dies under boots and tires without anyone noticing it has died, and without anyone noticing that it was carrying enough poison to kill them twenty times over. Three forms of survival. Three costs. Three legacies that outlast the organism."*
