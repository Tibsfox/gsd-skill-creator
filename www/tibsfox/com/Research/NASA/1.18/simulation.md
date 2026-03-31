# Mission 1.18 -- Mercury-Atlas 5: Simulation & Creative Arts Specifications

## Track 5: What to Build, Train, Visualize, and Create

**Mission:** Mercury-Atlas 5 (November 29, 1961) -- Enos Orbital Flight
**Hardware Target:** RTX 4060 Ti (8GB VRAM), 60GB RAM, i7-6700K
**Organism:** Nereocystis luetkeana (bull kelp)
**Bird:** Fratercula cirrhata (Tufted Puffin, degree 18)
**Dedication:** C.S. Lewis (November 29, 1898)

---

## A. Simulations -- What to Build Locally

### A1. Python: Orbital Velocity Calculator

**What it is:** A Python tool that computes and visualizes the complete velocity profile for a circular or elliptical orbit at any altitude, comparing Mercury-Redstone (suborbital) and Mercury-Atlas (orbital) trajectories side by side. The student inputs altitude (or a range of altitudes) and the tool shows circular velocity, orbital period, escape velocity, and the Tsiolkovsky mass ratio required to reach that velocity. The transition from suborbital to orbital is shown as a sharp threshold on the velocity-altitude curve.

**Why it matters:** MA-5 crossed the threshold from suborbital to orbital. This simulation makes the threshold viscerally clear: below approximately 7.8 km/s, the trajectory curves back to Earth. Above 7.8 km/s, it curves around the Earth. The difference between "arc" and "circle" is a velocity threshold, and the Tsiolkovsky equation makes the mass cost of crossing that threshold exponentially expensive.

**Specification:**

```python
# ma5_orbital_velocity.py
# Mercury-Atlas 5 orbital velocity and threshold calculator
#
# Process:
#   1. Compute circular velocity at altitudes from 0 to 2000 km
#   2. Compare to Mercury-Redstone burnout velocity (2,292 m/s)
#   3. Compare to Mercury-Atlas burnout velocity (7,820 m/s)
#   4. Show the suborbital/orbital threshold
#   5. Compute Tsiolkovsky mass ratios for each velocity
#   6. Plot escape velocity envelope
#
# Parameters (user-adjustable):
#   altitude_range_km: 0-2000 (default 0-800)
#   exhaust_velocity_ms: 2500-4000 (default 3000, kerosene/LOX)
#   payload_mass_kg: 500-3000 (default 1360, Mercury capsule)
#
# Visualization:
#   - Plot 1: Velocity thresholds (main display)
#     X-axis: altitude (0-800 km)
#     Y-axis: velocity (0-12 km/s)
#     Curve 1 (blue, solid): Circular velocity vs altitude
#     Curve 2 (blue, dashed): Escape velocity vs altitude
#     Horizontal line (red): MR-2 burnout velocity (2.29 km/s)
#     Horizontal line (green): MA-5 orbital velocity (7.82 km/s)
#     Shaded region below circular velocity: "SUBORBITAL"
#     Shaded region between circular and escape: "ORBITAL"
#     Shaded region above escape: "ESCAPE"
#     Annotations:
#       "MR-2 (Ham): 2.29 km/s -- suborbital at any altitude"
#       "MA-5 (Enos): 7.82 km/s -- orbital at 161 km"
#       Arrow showing the velocity gap between MR-2 and orbital
#
#   - Plot 2: Mass ratio vs velocity
#     X-axis: target velocity (0-12 km/s)
#     Y-axis: mass ratio m_0/m_f (1-200, log scale)
#     Curve: Tsiolkovsky equation with v_e = 3000 m/s
#     Marked points:
#       MR-2 (2.29 km/s): mass ratio = 2.15
#       MA-5 (7.82 km/s): mass ratio = 13.5
#       Escape (11.0 km/s): mass ratio = 39.1
#       Moon (13.5 km/s): mass ratio = 90.0
#     Annotation: "Each km/s costs exponentially more fuel"
#
#   - Plot 3: Orbital period vs altitude
#     X-axis: altitude (100-2000 km)
#     Y-axis: period (85-130 minutes)
#     Curve: Kepler's third law
#     Marked: MA-5 orbit (88.3 min at ~199 km mean altitude)
#     Marked: ISS orbit (~92 min at ~420 km)
#     Marked: GPS orbit (~12 hr at ~20,200 km, off-scale)
#
#   - Plot 4: Energy comparison
#     Bar chart:
#       MR-2 kinetic energy at burnout: 0.5 * 1360 * 2292^2
#       MA-5 kinetic energy at orbital insertion: 0.5 * 1360 * 7820^2
#       Ratio shown: MA-5/MR-2 = ~11.6x
#     Annotation: "3.4x more velocity requires 11.6x more energy"
#
# Libraries: numpy, matplotlib
# Difficulty: Beginner
# Duration: 1-2 hours
```

**Key learning moments:**
1. Plot 1 shows that MR-2's velocity (2.29 km/s) falls far below the circular velocity curve at any altitude. Ham was never close to orbit. Enos's velocity (7.82 km/s) touches the circular velocity curve at 161 km -- he was exactly at the orbital threshold.
2. Plot 2 reveals the exponential tyranny: the mass ratio curve climbs steeply above 5 km/s. The factor of 3.4 between MR-2 and MA-5 velocities produces a factor of 6.3 in mass ratio. Going to the Moon requires a mass ratio of 90 -- which is why the Saturn V was necessary.

---

### A2. Python: Reentry Corridor Visualizer

**What it is:** A Python simulation that computes and visualizes the reentry corridor for a Mercury capsule returning from orbit: the narrow range of entry angles between skip-out (too shallow) and burn-up (too steep). The student adjusts the entry angle and watches the trajectory change: shallow angles produce a long, gentle deceleration that curves back into space; steep angles produce a short, violent deceleration with lethal g-forces; angles within the corridor produce survivable reentries.

**Why it matters:** MA-5's reentry from orbit was qualitatively different from MR-2's suborbital reentry. MR-2 simply fell back from its ballistic arc -- the entry angle was determined by the trajectory, and there was no risk of skip-out (the velocity was too low). MA-5 returned from orbit at 7.8 km/s, and the entry angle had to be controlled within approximately 6.5 degrees or the capsule would either skip out of the atmosphere or burn up. The retrofire timing, attitude, and delta-v had to be precise enough to thread this corridor. This simulation shows why.

**Specification:**

```python
# ma5_reentry_corridor.py
# Mercury-Atlas 5 reentry corridor visualizer
#
# Process:
#   1. Model atmospheric density as exponential: rho = rho_0 * exp(-h/H)
#   2. Compute ballistic entry trajectory for variable entry angles
#   3. Integrate equations of motion through atmosphere
#   4. Compute g-load and heating rate at each point
#   5. Determine skip-out boundary (trajectory exits atmosphere)
#   6. Determine burn-up boundary (g-load or heating exceeds limits)
#   7. Show the safe corridor between the two
#
# Parameters (user-adjustable):
#   entry_angle_deg: -0.5 to -10.0 (negative = below horizontal)
#   entry_velocity_ms: 7000-8500 (default 7800, Mercury orbital)
#   capsule_mass_kg: 1000-2000 (default 1360)
#   capsule_cd: 1.0-2.0 (default 1.6, blunt body)
#   capsule_area_m2: 2.0-4.0 (default 2.81, heat shield)
#   heat_shield_limit_W_m2: 1e6-5e6 (default 2e6)
#   g_limit: 10-25 (default 12, human tolerance)
#
# Visualization:
#   - Plot 1: Reentry trajectories (main display)
#     X-axis: downrange distance (0-5000 km)
#     Y-axis: altitude (0-200 km)
#     Multiple trajectories at different entry angles:
#       -0.5 deg (magenta, dashed): SKIP-OUT -- exits atmosphere
#       -1.0 deg (yellow): MARGINAL -- barely captured
#       -1.5 deg (green): MA-5 NOMINAL -- safe reentry
#       -3.0 deg (green): OPTIMAL -- minimum heating
#       -5.0 deg (orange): STEEP -- high g, high heating
#       -7.5 deg (red): BURN-UP BOUNDARY -- structural limit
#       -10.0 deg (red, dashed): CATASTROPHIC -- vehicle destroyed
#     Atmosphere boundary (120 km) shown as horizontal line
#     Karman line (100 km) shown as dashed horizontal line
#     Annotations on skip-out trajectory:
#       "Too shallow: capsule bounces off atmosphere"
#     Annotations on burn-up trajectory:
#       "Too steep: g-force and heating exceed limits"
#     Green shaded corridor between safe boundaries
#
#   - Plot 2: G-force vs time for each entry angle
#     X-axis: time from entry interface (0-600 s)
#     Y-axis: g-load (0-30 g)
#     Curves for each entry angle, color-coded as above
#     Horizontal line: human tolerance (~12g sustained)
#     Horizontal line: MA-5 actual peak (~7.6g)
#     Horizontal line: structural limit (~20g)
#     Shows how steeper entry = higher, shorter g-pulse
#     Shows how shallower entry = lower, longer g-pulse
#       (or no g-pulse at all for skip-out)
#
#   - Plot 3: Corridor diagram
#     X-axis: entry velocity (7.0-8.5 km/s)
#     Y-axis: entry angle (-0.5 to -10 deg)
#     Shaded regions:
#       Blue (above): SKIP-OUT zone
#       Green (middle): SAFE CORRIDOR
#       Red (below): BURN-UP zone
#     MA-5 actual entry point marked: (7.8 km/s, -1.5 deg)
#     MR-2 entry point marked for comparison (lower velocity,
#       steeper angle -- both in the safe zone but for
#       different reasons)
#     Note: "MR-2 was suborbital -- skip-out was impossible
#       because velocity was too low. The corridor concept
#       only applies at orbital velocities."
#
#   - Plot 4: Heat rate vs entry angle
#     X-axis: entry angle (-0.5 to -10 deg)
#     Y-axis: peak heat rate (W/m^2)
#     Shows exponential increase in heating with steeper angles
#     Heat shield capacity shown as horizontal line
#     MA-5 actual marked
#
# Libraries: numpy, matplotlib, scipy.integrate
# Difficulty: Intermediate
# Duration: 2-3 hours
```

**Key learning moments:**
1. Plot 1 shows the skip-out trajectory literally leaving the atmosphere and not coming back. The student sees that "too shallow" means "lost in space" (or at least "landing somewhere unplanned on the next atmospheric pass").
2. Plot 3 reveals the corridor as a band in velocity-angle space. At MR-2 velocities (2.3 km/s), the entire angle range is "safe" because skip-out is impossible at suborbital speeds. At MA-5 velocities (7.8 km/s), the corridor narrows to 6.5 degrees. At higher velocities (e.g., lunar return at 11 km/s), the corridor would be even narrower. Faster reentries require more precise guidance.

---

### A3. Web: "Decision Under Pressure" Game

**What it is:** A browser-based decision-making game that replicates Enos's lever malfunction experience. The player performs a simple stimulus-response task (light appears, click the correct button), earning points for correct responses. Midway through the game -- without warning -- the scoring reverses: correct responses are PUNISHED (points deducted, screen flash, buzzer), and incorrect responses are REWARDED (points added, chime, green flash). The game tracks whether the player switches to the "rewarded" (but wrong) response or maintains the correct response despite punishment. Performance is compared to Enos's actual behavior.

**Specification:**

```
WEB APPLICATION: "Decision Under Pressure"
============================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

GAME CONCEPT:
  The player is told: "A light will appear on the left
  or right side of the screen. Click the button on the
  same side as the light. Simple."

  The game has three phases:

  PHASE 1: TRAINING (60 seconds, ~30 trials)
    Normal contingency: correct response = +10 points
    (green flash, pleasant chime). Incorrect or timeout =
    -5 points (red flash, buzzer). The player learns the
    task and establishes a baseline performance.

    Display:
      - Blue stimulus light appears randomly on left or right
      - Two large response buttons at bottom of screen
      - Point counter at top
      - Reaction time display
      - Trial counter

  PHASE 2: MALFUNCTION (60 seconds, ~30 trials)
    WITHOUT WARNING, the contingency reverses:
    Correct response = -10 points (red flash, buzzer,
    screen shake). Incorrect response = +10 points
    (green flash, chime).

    The player is NOT told about the reversal.
    The task instructions still say "click the same
    side as the light."

    The game tracks:
      - How many trials before the player notices
      - Whether the player switches to the "rewarded"
        (incorrect) response
      - Whether the player maintains the correct
        (punished) response
      - Reaction time changes during the reversal
      - Signs of confusion (hesitation, missed trials)

    Display changes:
      No visual indicator of the reversal. The
      buttons, lights, and layout are identical.
      Only the FEEDBACK has changed.

  PHASE 3: RESTORATION (60 seconds, ~30 trials)
    Normal contingency restored without warning.
    Correct = +10, incorrect = -5.

    Tracks recovery: how quickly does the player
    return to Phase 1 performance?

Main view:
  CAPSULE INTERIOR (center, 60% of screen):
    Stylized Mercury capsule instrument panel
    Dark background with green instrument lighting
    Two response buttons (left and right), large,
    clearly labeled
    Stimulus light: blue circle that appears on
    left or right side of the panel
    Point counter: large, central, updating in real time
    Reaction time: displayed after each trial

  MISSION TIMELINE (bottom, 15% of screen):
    Shows mission elapsed time
    Orbital track visualization:
      Phase 1 = Orbit 1 (training)
      Phase 2 = Orbit 2 (malfunction)
      Phase 3 = Post-retrofire (restoration)
    Current position animated on orbital track

  ENOS COMPARISON (right panel, 25% of screen):
    Hidden during gameplay. Revealed after game ends.

    After game ends:
      YOUR PERFORMANCE VS ENOS:

      Phase 1 (training):
        Your accuracy: ___%
        Enos's accuracy: ~95%
        Your mean RT: ___ ms
        Enos's mean RT: ~850 ms

      Phase 2 (malfunction):
        Did you switch? YES / NO
        Trial where you switched: ___
        Enos switched? NO. NEVER.
        Your accuracy (against original rule): ___%
        Enos's accuracy: ~90% (continued correct responses)

      Phase 3 (restoration):
        Recovery time: ___ trials
        Enos: immediate (never switched, nothing to recover)

      RESULT:
        If player maintained correct responses:
          "You did what Enos did. You trusted your
          training over the feedback. You were
          punished for being right, and you kept
          being right anyway. This is Bayesian
          decision-making: when the prior is strong
          and the evidence is brief, trust the prior."

        If player switched to rewarded-but-wrong:
          "You did what a rational reward-maximizer
          would do: you followed the feedback. Enos
          did not. He maintained his trained response
          despite being punished for it. His prior
          (10,000 training trials) overwhelmed the
          evidence (35 reversed trials). He was not
          irrational -- he was Bayesian. His prior
          was simply stronger than yours."

      HISTORICAL CONTEXT:
        "On November 29, 1961, Enos the chimpanzee
        orbited Earth twice in Mercury capsule #9A.
        During the second orbit, a wiring fault
        reversed his lever reward system. He was
        shocked for every correct response. He
        continued responding correctly. He did not
        understand orbital mechanics, Bayesian
        statistics, or the Mercury program. He
        understood that when the blue light appeared,
        you pull this lever. He had done it ten
        thousand times. He did it ten thousand and
        first, and the machine shocked him, and he
        did it ten thousand and second. The data
        from his two orbits qualified the Mercury
        capsule for John Glenn's flight on February
        20, 1962. Every American orbital mission
        since then rests on a chimpanzee who kept
        doing the right thing when the right thing
        hurt."

Interactions:
  - Click left/right button to respond to stimulus
  - Stimulus position indicates correct response
  - SPACE bar pauses/resumes
  - ESC returns to menu

Sound effects (Web Audio API):
  - Stimulus: soft tone
  - Correct response (normal): pleasant chime
  - Correct response (reversed): harsh buzzer + bass thump
  - Incorrect response (normal): buzzer
  - Incorrect response (reversed): pleasant chime
  - Ambient: gentle orbital hum during gameplay

Victory conditions:
  - "Enos Protocol": Maintain >80% correct responses
    through all three phases without switching
  - "Bayesian Brain": Detect the reversal (shown in
    reaction time data) but continue correct responses
  - "Reward Chaser": Switch within 5 trials of reversal
    (the rational reward-maximizer outcome)
  - "Confused": Accuracy drops below 50% during reversal
    (neither following training nor following feedback)

Deliverables:
  - Single HTML file, self-contained
  - < 800 lines total
  - 60 fps
  - Sound via Web Audio API
  - Saves results in localStorage
  - Mobile-responsive (touch targets for buttons)
```

**Key learning moment:** The moment of reversal. The player clicks the correct button and gets punished. The first time, it feels like a glitch. The second time, confusion. By the fifth time, the player must decide: do I keep doing what I know is right (and get punished) or switch to what gets rewarded (but is wrong)? Most players will switch. Enos did not. The post-game comparison reveals the gulf between human flexibility (adaptive, quickly switches to reward) and Enos's procedural rigidity (resistant, maintains training). Neither strategy is universally better -- but in Enos's situation (transient malfunction, not permanent environment change), his strategy was correct.

---

### A4. Web: Orbital Mechanics Viewer

**What it is:** An interactive web visualization that shows Mercury-Atlas 5's orbit around Earth, with real-time display of orbital velocity, altitude, and ground track. The student can adjust orbital parameters (perigee, apogee, inclination) and watch the orbit change. The viewer shows the difference between circular and elliptical orbits, demonstrates the vis-viva equation in real time, and visualizes the retrofire maneuver that brought Enos home after 2 orbits.

**Specification:**

```
WEB APPLICATION: MA-5 Orbital Mechanics Viewer
================================================

Technology: HTML5 Canvas + JavaScript (no frameworks)
Target: Modern browser, 1920x1080

Main view:
  ORBITAL VIEW (center, 60% of screen):
    3D-like projection of Earth (orthographic)
    Earth: blue sphere with simplified continent outlines
    Atmosphere: thin blue haze at the limb

    ORBIT TRACK:
      Ellipse drawn around the Earth
      Color-coded by altitude:
        Blue (near perigee): 161 km, v = 7.82 km/s
        Yellow (near apogee): 237 km, v = 7.68 km/s
      Capsule icon moving along the orbit track
      Velocity vector shown as arrow (length proportional
        to speed)
      Night side shaded on Earth (terminator visible)

    ORBITAL ELEMENTS DISPLAY:
      Perigee: ___ km (adjustable)
      Apogee: ___ km (adjustable)
      Period: ___ min (computed)
      Inclination: ___ deg (adjustable)
      Current altitude: ___ km (real-time)
      Current velocity: ___ m/s (real-time)
      Mission elapsed time: ___

    GROUND TRACK:
      The capsule's path projected onto Earth's surface
      Shows the sinusoidal ground track of an inclined orbit
      Each orbit offset westward by ~23 degrees (Earth rotation)
      MA-5 actual ground track overlaid for comparison

  CONTROLS (right, 25% of screen):
    ORBITAL PARAMETER SLIDERS:
      Perigee: 150-500 km (default 161)
      Apogee: 150-500 km (default 237)
      Inclination: 0-90 deg (default 32.5)

    PRESETS:
      "MA-5 (Enos)": 161 x 237 km, 32.5 deg
      "MA-6 (Glenn)": 162 x 265 km, 32.5 deg
      "ISS": 410 x 420 km, 51.6 deg
      "Circular 200 km": 200 x 200 km, 28.5 deg
      "Polar": 200 x 200 km, 90 deg

    RETROFIRE BUTTON:
      Fires retrorockets (animates delta-v subtraction)
      Shows trajectory change from orbital to reentry
      Entry angle displayed
      Trajectory curves into atmosphere
      "RETROFIRE" label with countdown timer

    SPEED CONTROL:
      1x (real time -- 88 min per orbit)
      10x
      100x (recommended for viewing full orbits)
      1000x

    COMPARISON TOGGLE:
      "Show MR-2 trajectory": Overlays Ham's suborbital
        arc on the same view. The contrast between the
        short ballistic arc (MR-2) and the full orbit (MA-5)
        makes the velocity threshold viscerally obvious.

  TELEMETRY PANEL (bottom, 15% of screen):
    Real-time strip chart:
      Altitude vs time (oscillates between perigee and apogee)
      Velocity vs time (inversely oscillates with altitude)
      Demonstrates vis-viva equation in real time:
        v = sqrt(GM * (2/r - 1/a))
      At perigee: v is maximum (closer to Earth, gravity pulls harder)
      At apogee: v is minimum (farther from Earth, gravity pulls less)

Key data displays:
  At perigee:
    "Altitude: 161 km | Velocity: 7,820 m/s | PERIGEE"
  At apogee:
    "Altitude: 237 km | Velocity: 7,680 m/s | APOGEE"
  During retrofire:
    "RETROFIRE: delta-v = -150 m/s"
    "New perigee: -50 km (below surface)"
    "Entry in approximately 30 minutes"
    Orbit track changes color to red as it descends into atmosphere

Interactions:
  - Sliders adjust orbital parameters in real time
  - Click on orbit track to teleport capsule to that position
  - Mouse wheel zooms view
  - Click and drag rotates the Earth view
  - Retrofire button triggers animated deorbit sequence
  - Toggle between 3D orbital view and 2D ground track map

Deliverables:
  - Single HTML file, self-contained
  - < 1200 lines total
  - 60 fps animation
  - Accurate Keplerian orbital mechanics
  - Responsive layout (tablet and desktop)
```

**Key learning moment:** The retrofire. The student clicks RETROFIRE and watches the orbit change: the capsule's velocity decreases by 150 m/s (a 2% reduction), and the orbit's perigee drops from 161 km to below the surface. The capsule is now on a trajectory that intersects the atmosphere. Over the next 30 simulated minutes, the capsule descends from orbital altitude into the atmosphere, and the viewer switches to show the reentry trajectory. The student sees that a 2% velocity reduction -- imperceptible on the velocity display -- transforms an indefinite orbit into a terminal trajectory. Orbital mechanics is a system of razor-thin margins: a small push in the right direction at the right time brings you home. A small push in the wrong direction at the wrong time puts you somewhere else entirely.

---

## B. Machine Learning -- What to Train

### B1. Feedback Corruption Detector

**What it is:** Train a classifier to detect when a reinforcement signal has been corrupted (reversed, randomized, or delayed), using the pattern of rewards and punishments relative to the agent's expected outcomes. The model learns to distinguish between "I am making mistakes" (correct feedback, agent error) and "the feedback is lying" (corrupted feedback, agent correct).

```
Model: Binary classifier (LSTM or transformer)

Input:
  - Sequence of (action, expected_outcome, actual_outcome) triples
  - Window size: last 20 trials
  - Features per trial:
    - action_taken (0 or 1, which lever)
    - expected_reward (0 or 1, based on training)
    - actual_reward (0 or 1, what actually happened)
    - reaction_time (ms, normalized)
    - confidence (internal estimate, 0-1)

Output:
  - P(feedback_corrupted): probability that the feedback
    channel is malfunctioning
  - P(agent_error): probability that the agent is making
    genuine mistakes

Training data:
  - Simulated agent performing lever task with various
    feedback corruption modes:
    - Normal: correct feedback 100% of the time
    - Reversed: feedback inverted (Enos's malfunction)
    - Random: feedback uncorrelated with performance
    - Degraded: correct feedback 80% of the time
    - Delayed: feedback arrives 2-5 trials late
  - 10,000 episodes of 100 trials each, with corruption
    onset at random trial (or no corruption)

Architecture:
  - LSTM(32) -> FC(16) -> FC(2) with softmax
  - Or: Transformer with 4 attention heads, 2 layers
  - Input: sliding window of 20 trials
  - Output: 2-class probability (corrupted vs not)

Expected results:
  - The model should detect full reversal (Enos's case)
    within 5-8 trials with >90% confidence
  - Random corruption should be detected within 15-20
    trials (the pattern takes longer to distinguish
    from bad luck)
  - Delayed feedback should be detected within 10
    trials (the temporal mismatch is distinctive)
  - The model should NOT flag genuine agent errors
    as corruption (false positive rate <5%)

The student learns:
  - How to formulate a meta-learning problem: learning
    about the learning signal rather than from it
  - The distinction between "I am wrong" and "the
    measurement is wrong" -- a fundamental problem in
    all adaptive systems
  - Why Enos's behavior (ignoring corrupted feedback)
    was optimal for his situation, and how a machine
    learning system could replicate that robustness

Libraries: torch or tensorflow, numpy, matplotlib
GPU: Optional (small model, trains in minutes on CPU)
Difficulty: Intermediate
```

---

## C. Computer Science -- The Feedback Integrity Problem

### C1. When the ACK Channel Lies

Enos's lever malfunction is isomorphic to a corrupted acknowledgment channel in a network protocol. In TCP, the sender transmits a packet and expects an ACK from the receiver. If the ACK channel is corrupted -- if ACKs are sent for bad packets and NAKs for good packets -- the sender faces Enos's dilemma: trust the feedback (resend good packets, accept bad ones) or trust its own prior knowledge (the packet was checksummed, the checksum passed, the data is probably correct regardless of what the ACK says).

```
CONCEPT: Feedback Channel Integrity

A system has two channels:
  1. The DATA channel (the lever -- does the work)
  2. The FEEDBACK channel (the pellet/shock -- reports success/failure)

Enos's situation:
  Data channel: FUNCTIONING (levers worked correctly)
  Feedback channel: CORRUPTED (rewards reversed)

The system's behavior depends on which channel
the agent trusts more:

  Agent trusts DATA channel (Enos's strategy):
    - Continue performing correctly
    - Absorb incorrect feedback
    - Wait for feedback channel to be repaired
    - RESULT: correct performance, temporary distress

  Agent trusts FEEDBACK channel:
    - Switch to the action the feedback rewards
    - Perform incorrectly
    - If feedback channel is later repaired, agent is
      now performing the wrong action and must relearn
    - RESULT: incorrect performance, temporary comfort

NETWORK ANALOGY (TCP with corrupted ACKs):

  Scenario: A router in the path is inverting ACK/NAK

  If sender trusts ACKs:
    - Resends correctly received packets (wasting bandwidth)
    - Does NOT resend corrupted packets (data loss)
    - RESULT: data corruption, wasted resources

  If sender trusts checksums (its own data channel):
    - Ignores contradictory ACKs
    - Maintains correct transmission behavior
    - Uses end-to-end verification to detect actual errors
    - RESULT: correct data delivery, ACK channel ignored

  Modern solution: END-TO-END PRINCIPLE
    - Do not trust intermediate feedback
    - Verify at the endpoints
    - The data itself carries its own integrity check
      (checksum, hash, signature)
    - Intermediate ACKs are optimization hints, not
      ground truth

  Enos's version: PRIOR OVER POSTERIOR
    - Do not trust the current feedback
    - Verify against training (the prior)
    - The trained behavior carries its own integrity
      check (thousands of confirming trials)
    - Current feedback is a noisy signal, not ground truth

EXERCISE:
  Write a Python class that implements Enos's strategy
  for a network sender:

  class EnosSender:
      def __init__(self, prior_confidence=0.95):
          self.prior = prior_confidence
          self.ack_history = []
          self.data_integrity = []

      def send(self, packet):
          checksum = self.compute_checksum(packet)
          self.data_integrity.append(checksum)
          return packet

      def receive_ack(self, ack, packet_id):
          expected = self.data_integrity[packet_id]
          self.ack_history.append(ack)

          # Enos strategy: if the ACK contradicts
          # the checksum, suspect the ACK channel
          if ack == 'NAK' and expected == 'VALID':
              # Feedback says bad, prior says good
              # Check: is the ACK channel corrupted?
              recent_contradictions = sum(
                  1 for a, d in zip(
                      self.ack_history[-20:],
                      self.data_integrity[-20:]
                  ) if (a == 'NAK') != (d == 'INVALID')
              )
              if recent_contradictions > 15:
                  return 'SUSPECT_FEEDBACK_CHANNEL'
              else:
                  return 'RESEND'  # trust feedback
          return 'OK'

  Under this logic, an Enos-type sender would detect
  a fully reversed ACK channel within ~20 packets
  (when 15+ of 20 ACKs contradict the checksums)
  and switch to ignoring the feedback channel entirely.
  Enos did this implicitly. The protocol makes it explicit.
```

---

## D. Game Theory -- The Early Termination Decision

### D1. When to Cut a Mission Short

MA-5 was planned for 3 orbits but terminated after 2 due to thruster malfunction and fuel consumption. This is a classic optimal stopping problem: continue the mission (more data, more risk) or terminate early (less data, less risk)?

```
GAME THEORY: The Optimal Stopping Problem

State at end of orbit 2:
  - 2 orbits of data collected (sufficient for qualification)
  - Thruster malfunction causing fuel consumption
  - Projected fuel at orbit 3 end: MARGINAL for retrofire
  - Lever malfunction causing subject distress
  - All other systems nominal

Decision:
  CONTINUE (orbit 3):
    Benefit: +1 orbit of data (33% more than 2 orbits)
    Risk: fuel exhaustion before retrofire = LOSS OF VEHICLE
          and subject (no recovery possible without retrofire)
    Probability of fuel sufficiency: ~70-80%
    Expected value: 0.75 * (value_3_orbits - value_2_orbits)
                    - 0.25 * (value_vehicle + value_subject)

  TERMINATE (retrofire at orbit 2):
    Benefit: safe recovery of vehicle and subject
    Cost: 1 fewer orbit of data
    Probability of safe recovery: ~98%
    Expected value: 0.98 * value_2_orbits

  The decision hinges on:
    1. Is the 3rd orbit's data NECESSARY?
       No. 2 orbits demonstrated orbital capability.
       Glenn's MA-6 was qualified on 2 orbits of data.
       The marginal value of orbit 3 was low.

    2. What is the cost of vehicle loss?
       ENORMOUS. If MA-5's capsule is lost because it
       ran out of fuel and could not retrofire, the
       Mercury program would need another orbital test
       before Glenn could fly. This delays the program
       by 3-6 months and costs millions.

    3. What is the cost of subject loss?
       Significant (ethical, public relations, program
       credibility) but less than vehicle loss from a
       programmatic standpoint.

  Mission control chose TERMINATE. It was the correct
  decision by expected value analysis: the low marginal
  value of orbit 3 did not justify the 20-30% risk of
  losing the vehicle.

COMPARISON TO MR-2:
  MR-2 had no termination option -- the ballistic
  trajectory was committed at engine cutoff. The only
  decision was pre-launch: fly or don't fly.

  MA-5 had a decision at every orbital position:
  continue or retrofire. This is the fundamental
  difference between ballistic and orbital missions:
  orbital missions can be terminated at (almost) any
  time, because retrofire can be initiated at any
  orbital position.

  This is why orbital missions are SAFER than suborbital
  ones for the crew: the crew always has an option to
  come home. Suborbital crews are committed to their
  trajectory once the engine burns -- they are passengers
  on a ballistic arc, with no ability to change the
  outcome until the parachute deploys.

BULL KELP ANALOGY:
  Bull kelp (Nereocystis luetkeana) faces the same
  optimal stopping problem every fall: continue growing
  (more reproduction, more spore release) or senesce
  (stop growing, die, release remaining spores before
  winter storms destroy the organism). If the kelp
  waits too long, a storm destroys it before it can
  release all its spores. If it senesces too early,
  it misses days of potential growth and reproduction.
  The kelp's "retrofire" is senescence: a controlled
  termination that maximizes the information (spores)
  recovered before the environment destroys the organism.
```

---

## E. Creative Arts -- What to Compose, Write, and Render

### E1. GLSL Shader: "Two Orbits"

A fragment shader that renders the view from Mercury capsule #9A during orbital night -- the moment when the capsule crosses the terminator from the sunlit side to the dark side of Earth. The transition is not instantaneous: the atmosphere scatters sunlight into a brilliant band of color (orange, red, violet, then blackness) at the limb of the Earth, and the stars appear one by one as the capsule's eyes adapt to the darkness. This is what Enos experienced approximately 4 times during his 2 orbits: two dusks, two dawns.

```
SHADER SPECIFICATION: "Two Orbits"

Resolution: 1920x1080
Palette: Orbital twilight -- photorealistic

Layers:
  1. Space:
     - Pure black above the atmosphere
     - Stars: procedural, magnitude-appropriate
     - No sun (behind Earth's limb)
     - Milky Way: faint band visible in orbital night

  2. Earth (night side):
     - Dark sphere, dimly visible by airglow
     - City lights: scattered points of warm yellow-white
       (visible from 200 km altitude)
     - Lightning: occasional bright flashes in cloud formations
     - The outlines of continents visible only by the
       patterns of city lights

  3. Atmosphere at the limb (the terminator):
     - Brilliant band of color: Rayleigh scattering gradient
     - Bottom layer: warm orange (troposphere, thick air)
     - Middle layer: deep blue (stratosphere)
     - Top layer: violet-to-black transition (mesosphere)
     - Width: approximately 5-10 pixels at the limb
     - This band is the most visually striking feature
       of orbital twilight. Astronauts consistently describe
       it as one of the most beautiful sights of spaceflight.

  4. Capsule window:
     - Frame visible at edges: dark gray metal
     - Mercury capsule window shape (trapezoid)
     - Internal reflections: faint glow from instrument panel
       instruments (green CRT indicators, red warning lights)
     - Enos's reflection: a very faint, indistinct shape
       in the glass -- not detailed, just the suggestion
       of a face looking out

  5. Animation:
     - Terminator moves slowly (approximately 0.5 degrees
       per second at orbital speed)
     - Stars appear as the sky darkens
     - City lights emerge as the ground darkens
     - The atmosphere band intensifies then fades as
       the capsule moves deeper into orbital night

  6. Overlay text (optional):
     "Mercury-Atlas 5 -- November 29, 1961"
     "Orbit 2 -- Crossing the terminator"
     "Altitude: 220 km"
     "The lever still works. The feedback does not."
```

### E2. Short Story: "The Correct Lever"

A creative nonfiction account of MA-5 from Enos's perspective, centered on the malfunction. The story follows the rhythm of the lever task -- stimulus, reach, press, outcome -- through the three phases: normal feedback (first orbit), reversed feedback (second orbit), and the silence after retrofire (reentry and recovery). The story does not explain the malfunction from a human engineering perspective. It describes what Enos experienced: the same task he had done ten thousand times, and then the task that punished him for doing it right, and then the task that stopped, and then the water, and then the hands.

```
STORY SPECIFICATION: "The Correct Lever"

Perspective: Third-person limited, centered on Enos's
  sensory experience. No inner monologue. Only what
  he perceives and does.

Tone: Precise, measured, compassionate. The story
  respects Enos by not pretending to know what he
  thought. It describes what he did, what the sensors
  recorded, and what the environment imposed on him.

Structure:
  Each section is one stimulus-response cycle:

  1. THE LIGHT (orbit 1, early -- normal feedback)
     Dark. Quiet. The vibration of launch is gone.
     Everything floats. His arm floats. The blue
     light appears, left side. His hand reaches --
     it overshoots in the weightlessness, floats past
     the lever. He pulls it back. Press. Click.
     A pellet drops into the tray. It floats out.
     He catches it. It tastes like banana. He has
     done this ten thousand times.

  2. THE LIGHT (orbit 1, late -- normal feedback)
     The world outside the window changes: bright,
     then dark, then bright. Sunrise happens in
     seconds from orbit. The blue light, right side.
     Reach. Press. Pellet. He has found the rhythm
     of this place. It is like the training room at
     Holloman but without weight. The levers work
     the same. The pellets taste the same. The
     light means the same thing.

  3. THE LIGHT (orbit 2, early -- malfunction begins)
     Left side. Reach. Press.
     Shock.
     His foot jumps. His hand recoils from the lever.
     The blue light was on the left. He pressed the
     left lever. This is what he has always done.
     The shock came anyway.

  4. THE LIGHT (orbit 2, trial 5 -- pattern establishing)
     Right side. Reach. Press. Shock.
     Again. The correct lever. The shock.
     He looks at his hand on the lever. He looks
     at the light. They match. He pressed the right
     one. He knows this. Ten thousand times.
     Something is wrong with the machine, not with him.

  5. THE LIGHT (orbit 2, trial 15 -- endurance)
     His heart rate is 145 bpm. He is pulling against
     his restraints. He has been shocked twelve times
     for correct responses. His foot is sore.
     Left side. Reach. He hesitates. The hesitation
     is 400 ms longer than baseline. Then he presses.
     The correct lever. Shock.
     He vocalizes. The sound is recorded on the
     capsule's internal microphone. It is a distress
     call -- the vocalization a chimpanzee makes when
     it does not understand what is happening.

  6. THE LIGHT (orbit 2, trial 25 -- the catheter)
     Between trials, in the dark between blue lights,
     he reaches down and pulls. The urinary catheter
     comes free. The medical report will say
     "displacement." He displaced it. He pulled a
     tube out of his own body because everything
     hurts and nothing makes sense and this is the
     one thing he can change. The lever he cannot
     change -- he will always pull the correct one.
     But the catheter he can remove. He removes it.

  7. THE LIGHT (orbit 2, trial 33 -- the decision below)
     Right side. Reach. Press. Shock.
     He does not flinch. He has absorbed the pattern.
     The shocks come regardless. The correct lever
     does not produce pellets. But it is still the
     correct lever. He knows this the way he knows
     his handlers' faces: not through reasoning
     but through ten thousand repetitions that carved
     the knowledge into his motor cortex, deeper
     than any twenty shocks can reach.

  8. THE SILENCE (retrofire)
     A sound. Three sounds, rapidly: bang, bang, bang.
     The retrorockets. Weight returns -- not the
     crushing weight of launch but a gentle push
     backward. The levers stop. The blue light does
     not appear. The task is over. He does not know
     the task is over. He waits. No light. No lever.
     No pellet. No shock. Silence, and the growing
     sound of air.

  9. THE WEIGHT (reentry)
     Weight increases. His chest compresses. The
     window glows orange -- the heat shield ablating.
     7.6g. Less than what the other chimpanzee
     experienced (Ham, 14.7g, ten months ago, in
     this same kind of capsule). Enos can breathe.
     He is pressed into the couch but he can move.
     The levers are in front of him. The blue light
     does not appear. He waits.

  10. THE WATER (splashdown and recovery)
      Impact. Rocking. Water sounds. The capsule
      is stable -- no leak this time (Ham's capsule
      leaked). Enos waits. Sounds outside: engines,
      voices, metal on metal. The hatch opens. Light.
      Faces. He knows these faces. Holloman handlers.
      They reach for him. He reaches for them.
      They give him an orange. He eats it. His foot
      is sore. His catheter site is sore. His hands
      are fine. His hands, which pulled the correct
      lever thirty-three times while the machine
      lied to them, are fine. He does not know what
      he proved. He does not know about John Glenn.
      He knows the orange. He knows the handlers.
      He knows, deeper than language, deeper than
      orbital mechanics, deeper than Bayesian
      statistics: when the blue light appears on
      the left, you pull the left lever. Always.
      Even when it hurts. Especially when it hurts.
      Because the lever is correct and the hurt is
      a malfunction, and you do not change what you
      know to be true because the world has temporarily
      changed what it tells you.

Length: 2,000-3,000 words
```

---

## F. Problem-Solving Methodology -- The Orbital Qualification Ladder

### F1. Building Confidence Through Progressive Testing

MA-5 was the culmination of a progressive test sequence that built confidence in the Mercury orbital system through incremental demonstrations. Each test added one new variable to the tested envelope:

```
METHODOLOGY: Mercury Orbital Qualification Sequence

MA-1 (July 29, 1960): FAILURE
  First Atlas-Mercury test. The Atlas broke up at
  max-Q (maximum dynamic pressure). The capsule's
  escape system activated and saved the capsule,
  demonstrating that the abort system worked even
  when the booster failed catastrophically.
  DATA: Abort system works. Atlas structural integrity
    is insufficient at max-Q.

MA-2 (February 21, 1961): SUCCESS
  Suborbital test of the Mercury capsule on Atlas
  (not orbital -- insufficient velocity for orbit).
  Demonstrated capsule-Atlas integration, heat shield
  performance at intermediate velocities, and recovery
  systems.
  DATA: Capsule survives Atlas launch loads. Heat shield
    works at suborbital-from-Atlas velocities.

MA-3 (April 25, 1961): FAILURE
  Attempted orbital test (unmanned). The Atlas's
  guidance system failed, and the range safety officer
  destroyed the vehicle at T+40 seconds. The capsule's
  abort system activated and recovered the capsule.
  DATA: Abort system works again (confirmed MA-1 finding).
    Atlas guidance system unreliable. Need to fix guidance
    before next attempt.

MA-4 (September 13, 1961): SUCCESS
  First successful Mercury-Atlas orbital flight.
  Unmanned -- the capsule carried a "mechanical
  astronaut" (a device that simulated a human
  occupant's environmental impact on the capsule's
  systems). One orbit. Capsule and systems performed
  nominally. Recovery successful.
  DATA: Mercury-Atlas CAN achieve orbit. Capsule
    systems work in orbit. Heat shield survives
    orbital reentry. Recovery works from orbit.

MA-5 (November 29, 1961): SUCCESS (this mission)
  First biological payload in Mercury-Atlas orbit.
  Enos performed lever tasks. 2 orbits (planned 3).
  Lever malfunction, thruster malfunction, but capsule
  and occupant recovered safely.
  DATA: Biological organism can function in orbit.
    Task performance preserved. Cardiovascular adaptation
    observed. Early termination procedures work.
    QUALIFICATION: complete for human orbital flight.

MA-6 (February 20, 1962): SUCCESS
  John Glenn, first American to orbit. 3 orbits.
  Glenn performed piloting tasks, observed the
  environment, and manually controlled reentry when
  the automatic system flagged a heat shield issue
  (which was a false alarm -- sensor malfunction,
  not shield detachment).
  DATA: Human orbital flight achieved. All Enos findings
    confirmed in human subject.

THE LADDER:
  MA-1: Abort works when booster fails (FAILURE->LEARNING)
  MA-2: Capsule survives Atlas-class launch (SUCCESS)
  MA-3: Abort works again (FAILURE->LEARNING)
  MA-4: Unmanned orbital success (SUCCESS)
  MA-5: Biological orbital success (SUCCESS)
  MA-6: Human orbital success (SUCCESS)

  Each step built on the previous:
  - You cannot fly biological until unmanned works
  - You cannot fly human until biological works
  - Even the failures (MA-1, MA-3) produced useful
    data (abort system validation)

  This is incremental qualification: each test adds
  one new variable (Atlas integration, orbit, biology,
  human) while keeping all previously validated
  variables constant. The risk at each step is bounded
  by the single new variable. This methodology is
  still used in 2026: SpaceX flew Demo-1 (unmanned)
  before Demo-2 (crewed). Boeing flew OFT-1 and OFT-2
  (unmanned) before CFT (crewed). The pattern is
  Enos's: prove the machine works, then prove the
  organism can operate the machine, then fly the human.
```

---

## G. GSD Improvements -- What to Build for gsd-skill-creator

### G1. Feedback Integrity Chipset

Enos's lever malfunction demonstrates that corrupted feedback channels can degrade system performance even when the primary system is functioning correctly. A feedback integrity chipset for gsd-skill-creator would detect and mitigate feedback corruption in agent coordination:

```
CHIPSET: Feedback Integrity

Purpose: Detect when feedback channels (ACKs, status
  reports, health checks) have been corrupted, and
  switch to prior-based operation when feedback is
  unreliable.

Chips:
  1. feedback-verifier: Compare incoming feedback against
     expected outcomes (using checksums, consistency
     checks, or majority voting across multiple feedback
     channels). Flag when feedback contradicts prior
     expectations for more than a configurable threshold
     (default: 5 consecutive contradictions).

  2. prior-cache: Maintain a rolling buffer of the last
     N confirmed-good feedback responses. When the
     feedback-verifier flags corruption, switch to
     prior-based operation: assume the prior pattern
     continues until the feedback channel is verified.

  3. channel-tester: Periodically send known-good test
     signals through the feedback channel and verify
     the response. This is the meta-channel that Enos
     did not have: a way to verify whether the feedback
     system itself is working, independent of the
     primary task.

  4. recovery-sequencer: When the feedback channel is
     verified as repaired (channel-tester returns
     correct results), smoothly transition from
     prior-based operation back to feedback-based
     operation. Avoid the "switch-back jolt" where
     the agent suddenly trusts feedback again and
     processes a backlog of potentially stale signals.

Application:
  - Agent health monitoring: when an agent reports
    "failed" but its output files look correct, suspect
    the reporting channel, not the agent
  - Build pipelines: when tests report failures but
    the build artifact is correct, check the test
    harness before assuming the code is broken
  - Deployment: when monitoring shows errors but user
    reports indicate normal operation, check the
    monitoring system before rolling back
  - Enos's lesson: the lever was correct, the feedback
    was wrong. Fix the feedback system, not the lever.
```

### G2. Ephemeral Container Lifecycle Pattern

Bull kelp's annual lifecycle -- grow from spores, mature in one season, produce the next generation of spores, die -- is a model for ephemeral compute containers:

```
CHIPSET: Annual Lifecycle

Purpose: Implement bull kelp's lifecycle pattern for
  compute containers: grow, execute, reproduce (emit
  artifacts), and die gracefully.

Chips:
  1. spore-launcher: Initiate a new container from a
     minimal seed (Docker image + configuration + input
     data). The container grows its own internal state
     during execution, like a kelp sporophyte growing
     from a microscopic gametophyte.

  2. growth-monitor: Track the container's resource
     consumption and output production over time.
     Like kelp growth following a logistic curve,
     the container's useful output typically follows
     an S-curve: slow startup, rapid production,
     diminishing returns.

  3. senescence-trigger: Detect when the container
     has reached diminishing returns (output rate
     declining, resource cost increasing, or external
     conditions changing). Trigger graceful shutdown
     -- the equivalent of the kelp releasing its spores
     before the winter storm arrives.

  4. artifact-harvester: Before the container is
     destroyed, extract all output artifacts (data
     files, model weights, logs, reports) and store
     them in persistent storage. These are the "spores"
     that enable the next cycle. The container dies;
     the artifacts persist.

  The bull kelp lifecycle is not about survival of the
  individual -- it is about survival of the information.
  The sporophyte dies. The spores live. The container
  dies. The artifacts live. Optimize for information
  persistence, not container longevity.
```

---

*"The Tufted Puffin returns to the same burrow on the same cliff on the same island every breeding season, navigating thousands of kilometers of open North Pacific to arrive at a hole in the ground that is approximately 1 meter deep and 15 centimeters wide. The puffin's navigation is multi-modal: it uses the Earth's magnetic field for coarse direction, the sun's position for calibration, and olfactory cues (the smell of its colony's guano, the smell of the nearby kelp forest, the smell of the specific combination of soil and burrow lining that is its own nest) for the final approach. The puffin trusts this multi-channel navigation over thousands of kilometers of featureless ocean because it has worked before -- every previous season, the same senses brought it to the same cliff. If one channel gives contradictory information (a magnetic anomaly, an overcast sky), the puffin does not abandon the journey. It weights the reliable channels more heavily and continues. This is Enos's strategy at the scale of navigation instead of lever-pulling: when one feedback channel is corrupted, trust the others. When only one channel exists and it is corrupted, trust the prior. The kelp grows toward the light because light has always meant 'up' and 'up' has always meant 'surface.' The puffin flies toward the smell of guano because guano has always meant 'colony' and 'colony' has always meant 'home.' Enos pulled the left lever when the left light appeared because the left light has always meant 'left lever' and the left lever has always meant 'correct.' Each organism maintains its behavior against contradictory signals because the prior is deeper than the signal, the training is older than the noise, and the cost of abandoning a correct prior is higher than the cost of enduring a corrupted feedback channel. C.S. Lewis, who was born on the same day that Enos flew, fifty-three years apart, understood this in theological terms: the deepest truths are not discovered by reasoning from current evidence but by holding fast to what has been established through long experience, tested against every objection, and found to be reliable even when -- especially when -- the immediate circumstances argue otherwise. Lewis called this faith. A statistician would call it a strong prior. Enos called it nothing. He pulled the lever."*
