# Mission 1.16 -- Mercury-Redstone 1: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Redstone 1 (November 21, 1960) -- LAUNCH FAILURE
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Dictyostelium discoideum (social amoeba)
**Bird:** Buteo jamaicensis (Red-tailed Hawk, degree 16)
**Dedication:** Voltaire (November 21, 1694)

---

## A. Simulations -- What to Build Locally

### A1. Python: Connector State Machine Simulator

**What it is:** A Python simulation that models the MR-1 tail plug connector as a finite state machine with three binary variables (A, B, C representing pin group connection status). The student can trigger disconnections in any order and observe which states are valid, which are invalid, and which contain the sneak circuit. The simulation visualizes the state machine as a directed graph, highlights the intended path versus all possible paths, and shows the Boolean expression for engine cutoff in each state.

**Why it matters:** This is the core lesson of MR-1: systems with sequenced operations have exponentially many possible orderings, and only a subset are safe. The state machine makes this tangible. The student can see all 8 states, click through different disconnection orders, and watch the sneak circuit activate only in state 4 (A connected, B disconnected, C connected). The intended path (0 -> 1 -> 2 -> 3) is one of six possible paths; the other five all pass through at least one invalid state.

**Specification:**

```python
# mr1_state_machine.py
# Mercury-Redstone 1 connector state machine simulator
#
# Process:
#   1. Define 8 states as (A, B, C) tuples where 0=connected, 1=disconnected
#   2. Define valid states (the intended path: 0->1->2->3)
#   3. Define the sneak circuit condition: (NOT A) AND B
#   4. Allow user to trigger disconnections in any order
#   5. Visualize the state graph with color-coded nodes
#   6. Show the Boolean cutoff expression at each state
#   7. Track which path the user takes and compare to intended
#
# Parameters (user-adjustable):
#   sequence: list of pin groups to disconnect [e.g., ['B','A','C'] for MR-1]
#   show_all_paths: True/False (show all 6 permutations simultaneously)
#   animate: True/False (step through states with delay)
#
# Visualization:
#   - Plot 1: State machine graph (main display)
#     8 nodes arranged in a 2x2x2 cube projection
#     Node color:
#       Green: valid state (intended path)
#       Red: invalid state with sneak circuit active
#       Yellow: invalid state without sneak circuit
#       Blue outline: current state
#     Edges: arrows showing possible transitions
#     Thick green arrows: intended path (A->B->C order)
#     Thin red arrows: transitions that enter invalid states
#     Current path highlighted with animated dots
#
#   - Plot 2: Boolean expression display
#     Shows the engine cutoff Boolean expression:
#       Intended: Engine_off = C AND flight_command
#       Actual:   Engine_off = (C AND flight_command) OR ((NOT A) AND B)
#     Current state values substituted, result highlighted
#     Sneak term ((NOT A) AND B) highlighted in red when TRUE
#
#   - Plot 3: All 6 permutations table
#     Each row: one permutation (e.g., A->B->C, B->A->C, ...)
#     Columns: states traversed, sneak circuit active (Y/N), result
#     Current permutation highlighted
#     Running tally: 1/6 succeed, 5/6 fail
#
#   - Plot 4: Probability analysis
#     Bar chart: P(success) for n=2,3,...,10 sequenced operations
#     Shows 1/n! scaling
#     MR-1's n=3 highlighted: P = 1/6 = 16.7%
#     Annotation: "For 10 operations: P = 1/3,628,800"
#
# Libraries: numpy, matplotlib, networkx
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. The student clicks B first (simulating MR-1) and watches the state machine transition from state 0 (0,0,0) to state 4 (0,1,0). The sneak circuit term (NOT A) AND B evaluates to TRUE. The red LED (in the visualization) lights up. Engine cutoff. The student has reproduced MR-1's failure in software.
2. The student tries all 6 permutations and confirms that only A->B->C produces a successful launch. The table fills up: 5 red rows, 1 green row.
3. The probability plot shows the factorial scaling: for 3 operations, 16.7% chance of random success. For 10 operations, the probability is effectively zero. The student understands why engineered systems cannot rely on "usually gets the right order."

---

### A2. Python: Thrust Curve and Rise Height Calculator

**What it is:** A simulation that computes the Mercury-Redstone vehicle's altitude, velocity, and acceleration as a function of time during the first 10 seconds of flight. The model accounts for varying mass (propellant burn), atmospheric drag (negligible at low speed but included for completeness), and the thrust buildup curve during engine start. The student can adjust vehicle mass, thrust, and drag coefficient and observe how these parameters affect the rise rate -- and specifically, the velocity at the 4-inch connector separation point.

**Why it matters:** MR-1 failed because the connector separated too slowly. This simulation shows why: the thrust-to-weight ratio determines the initial acceleration, the initial acceleration determines the velocity at any given height, and the velocity at 4 inches determines whether the connector pins separate in the correct order. The student can experiment: what if the capsule were lighter (T/W = 1.25 instead of 1.14)? The separation velocity doubles. What if the thrust were 10% lower? The vehicle might not lift off at all. The thin margin between "works" and "fails" is visible in the numbers.

**Specification:**

```python
# mr1_thrust_rise.py
# Mercury-Redstone 1 thrust curve and rise height simulation
#
# Process:
#   1. Define engine thrust curve: ramp from 0 to 75,000 lbf over ~1.0s
#   2. Define vehicle mass: 30,000 kg minus propellant burn rate
#   3. Integrate Newton's second law: F_net = F_thrust - m*g - F_drag
#   4. Compute velocity and height at each timestep (dt = 0.001s)
#   5. Mark the 4-inch connector separation point
#   6. Show velocity at separation for different T/W ratios
#
# Parameters (user-adjustable):
#   thrust_lbf: 50000-100000 (nominal 75000)
#   mass_kg: 20000-40000 (nominal 29860)
#   drag_coeff: 0-1.0 (nominal 0.35, though negligible at <1 m/s)
#   ramp_time_s: 0.5-2.0 (nominal 1.0, engine start ramp)
#   separation_height_m: 0.01-1.0 (nominal 0.1016, i.e., 4 inches)
#
# Visualization:
#   - Plot 1: Altitude vs time (first 10 seconds)
#     X-axis: time (0-10 s)
#     Y-axis: altitude (0-200 m)
#     Curve: h(t) from numerical integration
#     Horizontal dashed line at 4 inches (0.102 m)
#     Vertical dashed line at time of 4-inch crossing
#     Annotation: "MR-1 ENGINE CUTOFF HERE" at the intersection
#     Second curve (dashed): what would have happened without cutoff
#       (continued powered ascent to ~60 km)
#
#   - Plot 2: Velocity vs time
#     Velocity curve v(t) with same time axis
#     Marker at 4-inch crossing: "v = 0.53 m/s (walking speed)"
#     For comparison: "v at 1 second = 1.37 m/s (jogging speed)"
#     Arrow showing how quickly velocity increases after 4 inches
#
#   - Plot 3: Acceleration vs time
#     Shows the net acceleration (thrust - gravity) / mass
#     Includes thrust ramp effect during first second
#     Shows acceleration increasing as propellant burns off
#     Annotation: initial a = 1.37 m/s^2 = 0.14 g
#
#   - Plot 4: Parametric study -- separation velocity vs T/W ratio
#     X-axis: T/W ratio (1.0 to 2.0)
#     Y-axis: velocity at 4-inch separation (m/s)
#     MR-1 value marked: T/W=1.14, v=0.53 m/s
#     Military Redstone marked: T/W=1.25, v=0.70 m/s
#     Threshold line: "minimum for reliable connector sequence"
#     Shows sensitivity: small changes in T/W -> large changes in v
#
# Libraries: numpy, matplotlib, scipy (for ODE integration)
# Difficulty: Beginner-Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. Plot 1 makes the four-inch flight viscerally real. The altitude curve barely rises above zero before flatting -- the engine cut off, the vehicle coasted to perhaps 5-6 inches total, and settled back. The dashed "would-have-been" curve soars upward, showing the trajectory that should have been.
2. Plot 4 reveals the sensitivity: at T/W = 1.14 (MR-1), separation velocity is 0.53 m/s. At T/W = 1.25 (military Redstone), it is 0.70 m/s -- 32% faster. The connector designers had assumed the higher velocity. The small difference in T/W, caused by the added capsule mass, was enough to change the pin disconnection order.

---

### A3. Web: Interactive Launch Sequence Game

**What it is:** A browser-based game where the player must press three virtual buttons (A, B, C) in the correct order to successfully launch a Mercury-Redstone rocket. The game visually simulates the launch pad: a rocket sitting on a pedestal, with three color-coded connector cables attached at the base. The player clicks each cable to disconnect it. If disconnected in the correct order (A->B->C), the rocket launches with animation and sound. If disconnected in any other order, the rocket rises 4 inches, the engine stops, the escape tower fires, and the parachutes deploy on the pad -- replicating MR-1's actual failure with cartoon-clear visual feedback.

**Specification:**

```
WEB APPLICATION: MR-1 Launch Sequence Game
==========================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  LAUNCH PAD SCENE (center, 70% of screen):
    Sky gradient (blue to light blue, day scene)
    Launch pad: concrete platform with flame trench
    Mercury-Redstone vehicle: ~30-pixel-wide rocket, 200 pixels tall
      Silver body, black rollpattern, small Mercury capsule on top
      Escape tower on top of capsule (small lattice structure)
      Three cables at base, color-coded:
        Cable A (red): Ground power
        Cable B (yellow): Control signals
        Cable C (green): Engine cutoff inhibit

    Each cable is clickable. When hovered, it highlights and
    shows a tooltip: "Cable A: Ground Power (click to disconnect)"

    Cable states:
      Connected: drawn as a colored line from pad to rocket base
      Disconnected: cable retracts to pad side, spark animation

    Rocket states:
      IDLE: sitting on pad, cables connected
      IGNITION: flame starts at base (after first cable click)
      RISING: rocket rises slowly (4 inches in game scale = 20 pixels)
      CUTOFF: engine flame disappears (if wrong sequence)
      ESCAPE TOWER: tower fires upward and away (animated trajectory)
      PARACHUTES: drogue then main parachute deploy from capsule
      SUCCESS: rocket rises smoothly, gaining speed, exits screen upward

    Animations:
      - Engine flame: procedural fire effect (flickering orange/yellow)
      - Smoke: particles drifting from base
      - Escape tower: arc trajectory away from vehicle
      - Parachutes: fabric unfurling animation
      - Success launch: accelerating rise with trail

  CONTROL PANEL (right, 30% of screen):
    STATE MACHINE DISPLAY:
      Shows the current state as (A, B, C) values
      State number and label (Valid/Invalid/SNEAK CIRCUIT)
      Boolean expression: (NOT A) AND B evaluated in real time
      History: list of disconnection events in order

    SCOREBOARD:
      Attempts: __
      Successful launches: __
      MR-1 recreations (B before A): __
      All 6 sequences tried: [ ] [ ] [ ] [ ] [ ] [ ]

    INSTRUCTIONS:
      "Disconnect all three cables to launch the rocket."
      "The correct order matters!"
      "Can you find the one sequence that works?"

    RESET button: returns to initial state

    DIFFICULTY MODES:
      - Easy (3 cables): The MR-1 scenario. 6 permutations.
      - Medium (4 cables): 24 permutations, 1 correct.
      - Hard (5 cables): 120 permutations, 1 correct.
      - Nightmare (6 cables): 720 permutations, 1 correct.
        In higher difficulties, the "correct" sequence is
        randomized each round. The player must deduce it
        from clues (cable labels, color coding, tooltips).

Interactions:
  - Click a cable to disconnect it (with confirmation animation)
  - After all 3 are disconnected, the result plays automatically
  - Hovering over a disconnected cable shows "already disconnected"
  - Right-click a cable to see its function description
  - Pressing SPACE resets the game for another attempt

Sound effects (Web Audio API):
  - Cable disconnect: electrical snap/spark sound
  - Engine ignition: rumbling thrust sound
  - Engine cutoff: abrupt silence
  - Escape tower: rocket whoosh
  - Parachute: fabric rustling
  - Success: ascending roar + cheering
  - Failure: sad trombone or descending tone

Victory screen (after correct sequence):
  "LAUNCH SUCCESSFUL!"
  "Mercury-Redstone rises to 209 km"
  "MR-1A succeeded on December 19, 1960"
  "The fix: simultaneous connector release"

Failure screen (after wrong sequence):
  "LAUNCH FAILURE -- 4-INCH FLIGHT"
  "Sequence error: You disconnected [X] before [Y]"
  "The sneak circuit activated in state (A, B, C)"
  "This is exactly what happened on November 21, 1960"
  [Shows newspaper headline: "Rocket Sits Back Down"]

Deliverables:
  - Single HTML file, self-contained
  - < 1200 lines total
  - 30 fps minimum for animations
  - All 6 permutations produce correct results
  - Sound effects via Web Audio API (no external files)
  - Mobile-responsive (cables are tap targets on touch screens)
```

**Key learning moment:** The game makes the MR-1 failure interactive. The player is likely to click B first (it is in the middle, the natural first choice), and will immediately reproduce MR-1's failure: the rocket rises 4 inches, the engine cuts, the escape tower fires, the parachutes drape over the rocket. The visual absurdity -- a rocket with parachutes deployed on the launch pad -- makes the lesson unforgettable. The player then has to find the correct sequence, discovering through trial and error that only 1 of 6 orderings works. The harder difficulty modes (4-6 cables) show how quickly the problem becomes intractable.

---

### A4. Web: MR-1 Event Timeline

**What it is:** An interactive second-by-second timeline of the MR-1 flight, from T-5 seconds through the parachute deployment on the pad. Each event is plotted on a horizontal timeline with precise timestamps, descriptions, and annotations showing the state of the connector, the engine, the escape tower, and the recovery systems. The student can zoom in on the critical 50-millisecond window where the sneak circuit formed and expand each event for detailed technical explanation.

**Specification:**

```
WEB APPLICATION: MR-1 Second-by-Second Timeline
=================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  TIMELINE (center, 80% of screen):
    Horizontal timeline from T-5.0 seconds to T+120 seconds
    Logarithmic time scale near T+0 (expanded millisecond detail)
    Linear time scale after T+5 seconds

    Events as vertical markers on the timeline:
    Each marker has:
      - Timestamp (precision: milliseconds for 0-2s, seconds after)
      - Event name (short label)
      - Status indicator (green=nominal, red=anomaly, yellow=response)
      - Expandable detail panel (click to show full description)

    KEY EVENTS:

    T-5.000s: Final countdown -- all systems nominal
    T-3.000s: Guidance system to internal
    T-1.000s: Fuel valve open command
    T-0.500s: Ignition sequence start
    T+0.000s: Engine ignition -- thrust buildup begins
              [green] Thrust rises from 0 to 75,000 lbf over ~1.0s
    T+0.200s: Thrust passes 10,000 lbf
              [green] Vehicle still held by launcher clamps
    T+0.390s: Clamp release / First motion
              [green] Vehicle begins to rise
              Detail: Rise rate = 0 at release, accelerating at 1.37 m/s^2
    T+0.400s: Vehicle height: 0.5 inches
              [green] Tail plug connector beginning to stretch
    T+0.420s: Vehicle height: 1.5 inches
              [yellow] Pin Group B (control signals) begins to separate
              Detail: Pin geometry and tolerances at slow separation speed
    T+0.430s: Pin Group B DISCONNECTS
              [RED] Control signals lost -- flight sequencer activates
              Detail: This should NOT have happened yet.
              A should disconnect first.
              SYSTEM NOW IN STATE 4: (A=0, B=1, C=0)
    T+0.432s: SNEAK CIRCUIT ACTIVE
              [RED] Ground power (still connected via A) creates false
              cutoff signal through shared bus
              Detail: Boolean expression (NOT A) AND B = TRUE
              Duration of sneak circuit: ~20-30 ms
    T+0.450s: Pin Group A begins to separate
              [RED] Too late -- cutoff signal already propagating
    T+0.460s: Pin Group A DISCONNECTS
              [RED] Ground power removed, but engine controller has
              already received cutoff command
    T+0.480s: Pin Group C DISCONNECTS
              [RED] Cutoff inhibit removed -- but cutoff already commanded
    T+1.530s: ENGINE CUTOFF
              [RED] A-7 engine shuts down
              Detail: 1.53 seconds of total engine operation
              Vehicle height: ~4 inches (10.2 cm)
              Vehicle velocity: ~0.5 m/s upward (decelerating under gravity)
    T+2.000s: Vehicle reaches maximum altitude: ~5-6 inches
              [RED] Vehicle begins to settle back onto launch pad
    T+3.000s: Escape tower senses loss of thrust
              [yellow] Tower's abort sensor detects zero thrust
              (designed to fire if booster fails during ascent)
    T+3.500s: ESCAPE TOWER JETTISON
              [yellow] Tower rocket motor fires
              Tower separates from capsule and arcs away
              Lands ~400 yards from pad
    T+5.000s: Capsule barometric sensor reads altitude = 0
              [yellow] Correctly determines capsule is at sea level
              Initiates landing sequence
    T+10.00s: Drogue parachute deploys
              [yellow] Fired from capsule nose
              Deploys normally in still air on the launch pad
    T+15.00s: Main parachute deploys
              [yellow] 63-foot diameter nylon parachute
              Drapes over the side of the rocket
    T+20.00s: Landing bag deploys
              [yellow] Impact-absorbing bag inflates beneath capsule
              (Capsule is sitting on top of the rocket on the pad)
    T+25.00s: Dye marker activates
              [yellow] Green dye released (for ocean recovery spotting)
              Stains rainwater pooling on the launch pad
    T+30.00s: SOFAR bomb activates
              [yellow] Underwater acoustic locator charge fires
              (There is no water. The charge detonates harmlessly
              on the concrete pad)
    T+60.00s: HF recovery beacon activates
              [yellow] Radio beacon transmitting
              "Come find me -- I'm on the launch pad"
    T+120.0s: Situation stable -- all pyrotechnics expended
              [yellow] Vehicle safed by range safety officer
              Parachute recovery team approaches cautiously
              (The rocket is still fully fueled with RP-1 and LOX)

  STATE MACHINE PANEL (right sidebar, 20%):
    Synchronized with timeline position
    Shows connector state (A, B, C) at current time
    Highlights valid/invalid state
    Shows sneak circuit Boolean expression
    Current vehicle state: altitude, velocity, engine status

  ZOOM CONTROLS:
    - Mouse wheel zooms timeline
    - Click and drag to pan
    - "Critical Window" button: zooms to T+0.420s to T+0.500s
      (the 80-ms window where the sequence error occurred)
    - "Full Event" button: zooms to show T-5 to T+120

Interactions:
  - Click any event marker to expand its detail panel
  - Hover shows timestamp and short description
  - Playback controls: play/pause the timeline with a moving cursor
  - Speed control: 1x (real-time), 0.1x (slow-motion for critical window),
    10x (fast-forward for post-failure events)
  - "Compare MR-1A" toggle: shows MR-1A's timeline alongside MR-1's,
    highlighting the point where they diverge (connector separation)

Deliverables:
  - Single HTML file, self-contained
  - < 1000 lines total
  - Smooth zoom and pan at 60 fps
  - All timestamps based on NASA TN D-1210 data
  - Responsive layout (works on tablet and desktop)
```

**Key learning moment:** Zooming into the critical 80-millisecond window (T+0.420s to T+0.500s) shows the sneak circuit forming and dissipating in real time. The student sees that the entire failure occurs in less than one-tenth of a second: B disconnects at T+0.430, the sneak circuit activates at T+0.432, A disconnects at T+0.460, the sneak circuit deactivates -- but the damage is done. The cutoff command has already propagated. The engine shuts down at T+1.530, a full second later. The cause (20 ms of sneak circuit) and the effect (engine shutdown) are separated by a factor of 50 in time. The student discovers that transient events -- lasting milliseconds -- can have permanent consequences.

---

## B. Machine Learning -- What to Train

### B1. Sequence Anomaly Detector

**What it is:** Train a simple neural network to classify connector disconnection sequences as nominal (correct order) or anomalous (wrong order). The training data is synthetic: sequences of pin disconnection events with timestamps, generated with varying amounts of timing noise. The model learns to detect when a disconnection occurs out of order, even when the timing is noisy.

```
Model: LSTM sequence classifier (nominal vs anomalous disconnection)

Input:
  - Sequence of 3-10 timestamped events
  - Each event: (pin_id, timestamp_ms, voltage_before, voltage_after)
  - Correct sequence: pin_ids in ascending order
  - Anomalous: any other ordering

Output: Binary classification (nominal / anomalous)
  - Plus: identification of which event is out of order

Training data:
  - 10,000 synthetic sequences per class
  - Timing noise: Gaussian, sigma = 5-50 ms
  - Voltage noise: Gaussian, sigma = 0.1-1.0 V
  - Augmented with varying sequence lengths (3-10 events)

Architecture:
  - LSTM (32 hidden units) -> FC(16) -> FC(2)
  - Or: 1D-CNN with 3 conv layers for fixed-length sequences
  - Attention mechanism to highlight the out-of-order event

Expected results:
  - Accuracy: >95% for sequences with well-separated events
  - Degrades to ~80% when timing noise is large enough that
    events overlap temporally (ambiguous ordering)
  - Attention maps should highlight the first out-of-order event

The student learns:
  - Sequence ordering is a learnable pattern
  - Timing noise makes ordering ambiguous -- the same physical
    event (connector separation) can produce different logical
    orderings depending on noise
  - The model's confidence drops as noise increases, showing
    the boundary between "clearly ordered" and "ambiguous"
  - This is the ML version of MR-1's problem: the physical
    system (connector) operated in a regime (slow separation)
    where the logical ordering was not reliably determined
    by the physical process

Libraries: numpy, torch, matplotlib
GPU: Not needed (tiny model)
Difficulty: Intermediate
```

---

## C. Computer Science -- The Race Condition

### C1. Race Conditions in Concurrent Programming

MR-1's sneak circuit is a hardware race condition: two signals (pin group A and pin group B) racing to change state, with the system behavior depending on which arrives first. Race conditions are the most common class of concurrency bugs in software.

```
CONCEPT: Race Conditions

A race condition occurs when:
  1. Two or more processes/threads/signals change shared state
  2. The final state depends on the ORDER in which changes occur
  3. The order is not deterministic (varies with timing)

MR-1 race condition:
  Signal 1: Pin Group A disconnect (ground power off)
  Signal 2: Pin Group B disconnect (control transfer)
  Shared state: engine controller bus
  Intended order: A before B (bus de-energized before control transfer)
  Actual order: B before A (control transfer while bus still energized)
  Result: Sneak circuit -> engine cutoff

Software analog (Python pseudocode):

  # Global shared state (the "bus")
  ground_power_connected = True
  flight_control_active = False

  # Thread 1: Disconnect ground power (Pin A)
  def disconnect_A():
      global ground_power_connected
      time.sleep(random.uniform(0.01, 0.05))  # physical delay
      ground_power_connected = False

  # Thread 2: Activate flight control (Pin B)
  def disconnect_B():
      global flight_control_active
      time.sleep(random.uniform(0.01, 0.05))  # physical delay
      flight_control_active = True

  # Sneak circuit check (runs continuously)
  def check_sneak_circuit():
      if (not ground_power_connected == False) and flight_control_active:
          # SNEAK CIRCUIT! MR-1 state 4!
          engine_cutoff()

  # The race: if disconnect_B completes before disconnect_A,
  # the sneak circuit fires. The random delays make the
  # ordering non-deterministic -- exactly MR-1's problem.

  # Fix 1 (MR-1A approach): Simultaneous release
  def disconnect_all():
      global ground_power_connected, flight_control_active
      # Atomic operation -- both change at once
      ground_power_connected = False
      flight_control_active = True
      # No intermediate state where sneak circuit can fire

  # Fix 2 (Software approach): Mutex lock
  def disconnect_A_safe():
      with connector_lock:
          ground_power_connected = False
          # B cannot change while A is changing

  # Fix 3 (Redundancy approach -- Dictyostelium method):
  # Use multiple independent checks, accept majority result
  # Even if one check sees the wrong order, the majority
  # will see the correct state

The key insight: the race condition exists because the
intermediate state (A connected, B disconnected) is reachable.
Eliminating the race means either:
  a. Making the intermediate state unreachable (MR-1A: simultaneous)
  b. Making the intermediate state safe (add guards/checks)
  c. Making the ordering deterministic (mutexes/locks)
  d. Tolerating the wrong ordering (redundancy/voting)
```

---

## D. Game Theory -- The Test Program Dilemma

### D1. How Much to Test Before You Fly

MR-1's failure could have been caught by testing the connector at the actual separation speed. But the test program tested the connector at the design-nominal separation speed, not the actual (slower) speed of the heavier Mercury-Redstone. This is a resource allocation problem: how much of the test envelope should you explore?

```
GAME THEORY: Test Coverage vs Cost

The test space:
  - Connector separation speed: 0 to 5 m/s (continuous)
  - Temperature: -20 to +50 C (continuous)
  - Vibration level: 0 to 20 g (continuous)
  - Humidity: 0 to 100% (continuous)

  Full coverage of a 4-dimensional continuous test space
  requires infinite tests. Real test programs sample
  discrete points.

The tradeoff:
  - More test points -> higher probability of finding a failure
  - Each test point costs time and money
  - Budget constraint: N_max tests available

The MR-1 mistake:
  - Test points clustered around the design-nominal conditions
    (high separation speed, room temperature, moderate vibration)
  - No tests at the actual flight conditions (low separation
    speed due to heavier vehicle)
  - The failure was in the UNTESTED region of the test space

The game-theoretic optimum:
  - Distribute test points to maximize the probability of
    detecting any failure, given a budget of N tests
  - This is equivalent to the sensor placement problem:
    where to put N sensors to maximally cover a space
  - The optimal strategy is NOT to cluster around the
    expected operating point, but to spread tests across
    the envelope, with extra coverage near boundaries
    (edges of the operating range where behavior changes)

Bayesian sequential testing:
  - After each test, update the probability distribution
    of failure across the test space
  - Focus subsequent tests where the probability of
    undiscovered failure is highest
  - MR-1's test program was not Bayesian -- it tested
    where failure was expected (harsh conditions) rather
    than where failure was unknown (off-nominal conditions)

Modern approach (Design of Experiments):
  - Latin hypercube sampling: spread N test points
    uniformly across all dimensions
  - Response surface methodology: fit a model to test
    results, predict behavior in untested regions
  - Certification by analysis: use validated models to
    certify regions that cannot be physically tested

The MR-1 lesson: the failure was not in the tested region.
It was in the gap between what was tested and what actually
flew. Testing what you expect to happen is necessary but
not sufficient. You must also test what you don't expect.
```

---

## E. Creative Arts -- What to Compose, Write, and Render

### E1. GLSL Shader: "Four Inches"

A fragment shader that renders the MR-1 scene: a Mercury-Redstone rocket on the launch pad, engine firing, rising exactly 4 inches, then settling back. The parachutes deploy and drape over the side. The escape tower arcs away. The shader captures the absurd beauty of the most embarrassing launch failure in Mercury history -- a fully functional rocket sitting on the pad with its parachutes hanging limply in the Florida sun.

```
SHADER SPECIFICATION: "Four Inches" -- MR-1 on the Pad

Resolution: 1920x1080
Palette: Photorealistic (Cape Canaveral, November afternoon)

Layers:
  1. Sky:
     - Florida sky: blue-white gradient, cumulus clouds
     - Sun position: late morning, November, Cape Canaveral
     - Cirrus wisps at high altitude

  2. Launch pad:
     - Concrete pad with flame trench (gray, weathered)
     - Service structure (steel lattice, partially retracted)
     - LOX venting: white vapor wisps from vehicle connection

  3. Mercury-Redstone vehicle:
     - Silver Redstone booster body (cylindrical, 21m tall)
     - Black rollpattern stripes
     - Mercury capsule on top (black, conical, with window)
     - Escape tower: red lattice with solid rocket motor
     - Three tail fins at base

  4. Animation sequence (time-based):
     t=0.0-0.5: Engine ignites -- flame builds at base
       Orange-yellow exhaust plume, procedural fire noise
       Smoke billows outward from flame trench
     t=0.5-1.5: Vehicle rises 4 inches (barely perceptible)
       Camera must be zoomed to base to see motion
     t=1.5-2.0: Engine cuts off -- flame disappears instantly
       Silence. Smoke drifts.
     t=2.0-3.0: Escape tower fires -- bright flash, arc trajectory
       Tower rocket motor: white exhaust trail
       Tower tumbles away, lands off-screen
     t=3.0-5.0: Parachutes deploy
       Drogue first (small, orange-white)
       Main parachute (large, orange-white striped)
       Fabric unfurling animation, draped over rocket side
     t=5.0+: Static scene -- rocket on pad with parachutes
       Dye marker: green puddle forming at base
       Wind gently rippling the parachute fabric
       Recovery helicopter appearing on the horizon

  5. Camera effects:
     - 16mm film grain (1960s footage aesthetic)
     - Slight color desaturation (Kodachrome look)
     - Camera shake during engine ignition
     - Telephoto compression (long focal length, distant view)

  6. Overlay text (optional, toggled):
     "Mercury-Redstone 1 -- November 21, 1960"
     "Maximum altitude: 4 inches"
     "Flight duration: ~2 seconds"
```

### E2. Short Story: "The Longest Four Inches"

A creative nonfiction account of MR-1 from the perspective of the blockhouse crew -- the engineers watching through the periscope and on telemetry as the rocket ignites, rises imperceptibly, sits back down, and then systematically deploys every recovery system it has, on the launch pad, in full view of the press corps and the television cameras. The story captures the mixture of confusion, horror, and absurd comedy of the moment: the engineering team watching a perfectly good rocket deploy its parachutes at sea level in Florida.

```
STORY SPECIFICATION: "The Longest Four Inches"

Perspective: Third-person limited, following the capsule
  systems engineer in the blockhouse (based on NASA
  accounts from multiple sources)

Tone: Technical precision mixed with dark comedy. The
  humor is in the absurdity, not in mockery -- these
  engineers solved the problem in 28 days. The laughter
  is the laughter of people who know they will fix it.

Structure:
  1. The countdown (T-10 minutes to T-0)
     The engineer's checklist. The telemetry screens.
     The press corps outside. This is the first Mercury
     launch attempt. Everyone is watching.

  2. Ignition to engine cutoff (T+0 to T+1.53s)
     The flame appears. The vehicle rises. The vehicle
     stops. The flame disappears. Two seconds of total
     flight time. The telemetry shows nominal thrust,
     then zero. The engineer looks at the data and
     says something unprintable.

  3. The aftermath (T+1.53s to T+120s)
     The escape tower fires (why is it firing?). The
     parachutes deploy (why are the parachutes deploying?).
     The dye marker activates (there is no ocean). The
     SOFAR bomb detonates (there is no ocean). The
     recovery beacon starts transmitting (the rocket
     is right there on the pad). Each recovery system
     activating in sequence, exactly as designed for
     ocean recovery, on a concrete launch pad in Florida.

  4. The decision (T+2 hours)
     The range safety officer: do we approach? The rocket
     is still fully fueled. The escape tower is gone (it
     landed 400 yards away), but the capsule is armed
     with retrorockets, posigrade rockets, and additional
     pyrotechnics. The main parachute is draped over the
     side -- if the wind catches it, it could pull the
     rocket off the pad. The engineers decide to wait
     for the LOX to boil off overnight. They approach
     the next morning.

  5. The investigation (28 days)
     Finding the sneak circuit. The moment of understanding.
     The fix. MR-1A. Success.

Length: 2,000-3,000 words
```

---

## F. Problem-Solving Methodology -- The Interface Audit

### F1. Interface Hazard Analysis

MR-1's failure was at an interface -- the boundary between the pad and the vehicle. The methodology for preventing interface failures is the Interface Hazard Analysis (IHA): systematic identification and evaluation of all signals, forces, and energy transfers that cross system boundaries.

```
METHODOLOGY: Interface Hazard Analysis (from MR-1)

Step 1: Identify all interfaces
  - List every physical connection between systems
  - For MR-1: electrical connector (tail plug), mechanical
    holddown clamps, propellant fill/drain umbilicals,
    pneumatic pressure lines, communication links

Step 2: For each interface, enumerate signals/energy
  - What crosses the boundary? Power, control, data, force,
    fluid, thermal energy?
  - What direction does it flow? Pad-to-vehicle, vehicle-to-pad,
    bidirectional?
  - When does it change? Before launch, during launch, after
    separation?

Step 3: For each signal, identify sequencing requirements
  - Must this signal change before/after another signal?
  - What happens if the order is reversed?
  - What happens if the change is partial (intermediate state)?

Step 4: For each sequencing requirement, verify enforcement
  - How is the correct sequence enforced? Physical geometry?
    Timer? Sensor feedback? Interlock?
  - What happens if the enforcement mechanism fails?
  - Has the enforcement been tested at actual operating conditions
    (not just nominal)?

Step 5: Document and review
  - Create an interface control document (ICD)
  - Review with both sides of the interface present
  - MR-1's failure: the connector was ABMA's responsibility,
    the capsule mass was NASA's specification, and nobody
    reviewed the interface between the two

This methodology is now standard in aerospace (NASA NPR 7120.5)
and has been adopted by the automotive (ISO 26262),
nuclear (10 CFR 50), and medical device (IEC 62304) industries.
```

---

## G. GSD Improvements -- What to Build for gsd-skill-creator

### G1. Sequence Validation Chipset

MR-1's lesson: sequence matters. In gsd-skill-creator, many operations have implicit ordering constraints (install before configure, plan before execute, verify before commit). A sequence validation chipset would:

```
CHIPSET: Sequence Validator

Purpose: Detect and prevent sequence-dependent errors in
  multi-step operations (deployment pipelines, build chains,
  agent task sequences)

Chips:
  1. sequence-model: Define expected ordering as a DAG
     (directed acyclic graph). Each node is an operation,
     each edge is a "must happen before" constraint.

  2. sequence-monitor: Track actual execution order. Compare
     each operation to the DAG. Flag any operation that
     executes before its predecessors are complete.

  3. sneak-path-detector: Enumerate all paths through the
     operation graph. Identify paths that bypass required
     checkpoints (the software analog of MR-1's sneak circuit).

  4. sequence-enforcer: Optionally block out-of-order
     operations (hard enforcement) or warn and log
     (soft enforcement).

Integration:
  - Hook into gsd-skill-creator's phase execution pipeline
  - Validate that phases execute in dependency order
  - Detect when an agent starts work before its dependencies
    are committed
  - Log all sequence violations for post-execution analysis

Connection to MR-1:
  MR-1's connector had an implicit sequence (A before B before C)
  that was not explicitly validated. This chipset makes all
  sequence dependencies explicit and validated in real time.
```

---

*"Voltaire died on May 30, 1778, in Paris, reportedly saying 'Now is not the time for making new enemies' when asked to renounce Satan on his deathbed. He had spent 84 years making enemies of every institution that valued certainty over evidence, authority over inquiry, dogma over observation. He would have understood MR-1 instantly. Not the engineering -- he was a writer, not an engineer. But the epistemology. The tail plug connector was designed with certainty: the pins WILL disconnect in this order, because the pin lengths guarantee it. Voltaire's entire career was spent dismantling exactly this kind of certainty. Pins have tolerances. Separation speeds vary. The world is not a mechanism that executes the designer's intent. It is a mechanism that executes physics, and physics does not read schematics. Pangloss would have explained MR-1 as necessary in the best of all possible space programs: without the four-inch flight, NASA would not have developed sneak circuit analysis, and subsequent missions would have been less safe. This is retrospectively true. But it is not a reason to celebrate the failure. It is a reason to analyze it, document it, fix it, and fly again. Il faut cultiver notre jardin. The garden, in November 1960, was Cape Canaveral. The weeds were sneak circuits. The gardeners were engineers with 28 days and a redesigned connector. They cultivated. They flew. They succeeded. Voltaire would have approved of the methodology if not the metaphysics."*
