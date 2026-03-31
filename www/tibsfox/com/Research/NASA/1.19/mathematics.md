# Mission 1.19 -- Mercury-Redstone 3: The Mathematics of Fifteen Minutes

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mercury-Redstone 3 / Freedom 7 (May 5, 1961) -- Alan Shepard Suborbital Flight
**Primary TSPB Layer:** 4 (Vector Calculus -- Suborbital Ballistics, Parabolic Arcs, Range Equations)
**Secondary Layers:** 7 (Information Theory -- Human-in-the-Loop Control, Manual Piloting Bandwidth), 4b (Applied Mechanics -- Peregrine Falcon Terminal Velocity, Atmospheric Drag)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Suborbital Ballistics (Layer 4, Section 4.19)

### Table

| Parameter | Symbol | Units | MR-3 Value |
|-----------|--------|-------|------------|
| Launch date | -- | -- | May 5, 1961, 14:34 UTC (09:34 EST) |
| Launch vehicle | -- | -- | Redstone MR-7 (MRLV-7) |
| Operating agency | -- | -- | NASA / Space Task Group, Langley |
| Spacecraft | -- | -- | Mercury capsule #7 (Freedom 7) |
| Pilot | -- | -- | Alan Bartlett Shepard Jr. (Commander, USN) |
| Engine | -- | -- | Rocketdyne A-7, single engine |
| Engine thrust | F | lbf / kN | 78,000 lbf / 347 kN |
| Specific impulse | I_sp | s | ~235 s (ethanol/LOX) |
| Vehicle mass at ignition | m_0 | kg | ~30,000 (66,000 lb) |
| Capsule mass | m_cap | kg | ~1,360 (3,000 lb) |
| Burnout velocity | v_bo | m/s | 2,294 |
| Burnout altitude | h_bo | km | ~60 |
| Flight path angle at burnout | gamma_bo | deg | ~45 (near-optimal for range) |
| Peak altitude (apogee) | h_max | km | 187.5 (116.5 statute miles) |
| Maximum velocity | v_max | m/s | 2,294 (at burnout) |
| Downrange distance | R | km | 486 (302 statute miles) |
| Flight duration | t_flight | s | 928 (15 min 28 sec) |
| Weightless time | t_0g | s | ~302 (~5 min) |
| Peak g-force (launch) | g_launch | g | 6.3 |
| Peak g-force (reentry) | g_reentry | g | 11.6 |
| Splashdown coordinates | -- | -- | 27.23 N, 75.88 W (Atlantic) |
| Recovery ship | -- | -- | USS Lake Champlain (CVS-39) |
| Recovery time | -- | min | ~11 (helicopter pickup) |
| Result | -- | -- | SUCCESS -- first American in space |
| Significance | -- | -- | Demonstrated human piloting capability in space. First manual spacecraft control. |

### Formulas

**The Complete Ballistic Trajectory of Freedom 7**

Mercury-Redstone 3 was a planned suborbital flight -- unlike Ham's MR-2 (mission 1.17), where an abort system malfunction produced an off-nominal trajectory. Shepard's flight profile was designed, rehearsed, and executed within parameters. The trajectory is a textbook ballistic arc: boost phase (powered flight to burnout), coast phase (unpowered parabolic arc to apogee and back down), and reentry phase (atmospheric deceleration to splashdown). Every number in the parameter table above was predicted before launch and confirmed during flight, within engineering tolerances.

The distinction from Ham's MR-2 is critical: Ham's trajectory was off-nominal. The Redstone burned longer than planned, the abort system fired, and the capsule reached 253 km and 679 km downrange -- overshooting the planned values significantly. Shepard's trajectory was nominal. The Redstone performed as designed. The capsule followed the planned arc. This was the first Mercury flight where the trajectory matched the prediction, because the vehicle worked correctly AND the pilot was monitoring the systems to confirm it.

```
SUBORBITAL BALLISTIC TRAJECTORY:

  The trajectory divides into three phases:

  PHASE 1: POWERED FLIGHT (0 to ~142 s)
  ========================================

    The Redstone engine burns for approximately 142 seconds,
    accelerating the vehicle from rest to burnout velocity.

    The thrust equation:
      F = m * a + m * g * sin(gamma) + D

    where:
      F     = engine thrust (347 kN)
      m     = instantaneous vehicle mass (decreasing as fuel burns)
      a     = acceleration along the trajectory
      g     = gravitational acceleration (~9.8 m/s^2, decreasing with altitude)
      gamma = flight path angle (angle above horizontal)
      D     = aerodynamic drag (significant in lower atmosphere)

    The vehicle pitches over during powered flight, following
    a gravity turn trajectory. At liftoff, gamma = 90 degrees
    (straight up). At burnout, gamma ~ 45 degrees (for
    near-optimal range).

    At burnout:
      h_bo   = ~60 km (above most of the atmosphere)
      v_bo   = 2,294 m/s
      gamma_bo = ~45 degrees

    The burnout velocity has two components:
      v_horizontal = v_bo * cos(gamma_bo)
                   = 2,294 * cos(45)
                   = 2,294 * 0.7071
                   = 1,622 m/s

      v_vertical = v_bo * sin(gamma_bo)
                 = 2,294 * sin(45)
                 = 2,294 * 0.7071
                 = 1,622 m/s

  PHASE 2: COAST (BALLISTIC ARC) (~142 s to ~562 s)
  ===================================================

    After burnout, the capsule is in free flight -- no thrust,
    negligible drag (above most atmosphere). The trajectory
    is governed entirely by gravity.

    The equations of motion reduce to:
      x(t) = x_bo + v_horizontal * t
      y(t) = y_bo + v_vertical * t - (1/2) * g * t^2

    This is a parabola -- the same curve traced by a
    thrown ball, a launched cannonball, or any projectile
    in a uniform gravitational field. Freedom 7 was a
    ballistic projectile, distinguished from a baseball
    only by the altitude (187.5 km vs ~30 m) and the
    velocity (2,294 m/s vs ~30 m/s).

    TIME TO APOGEE:
      At apogee, the vertical velocity is zero:
      v_vertical(t_apogee) = v_vertical_bo - g * t_apogee = 0

      t_apogee = v_vertical_bo / g
               = 1,622 / 9.8
               = 165.5 seconds after burnout

      (Accounting for the variation of g with altitude,
      this is actually ~170 s. At 187.5 km altitude,
      g = 9.8 * (6371/6558.5)^2 = 9.24 m/s^2, which
      extends the coast time slightly.)

    ALTITUDE AT APOGEE:
      h_max = h_bo + v_vertical_bo * t_apogee - (1/2) * g_avg * t_apogee^2

      Using the average g between 60 km and 187.5 km:
      g_avg ~ 9.5 m/s^2

      h_max = 60,000 + 1,622 * 170 - 0.5 * 9.5 * 170^2
            = 60,000 + 275,740 - 137,275
            = 198,465 m ≈ 198 km

      (The actual peak was 187.5 km. The simplified
      calculation overshoots because it ignores the
      gravity turn during powered flight, which means
      gamma_bo was slightly less than 45 degrees and
      the vertical velocity component at burnout was
      slightly less than 1,622 m/s. The exact value
      depends on the detailed trajectory profile, which
      is why NASA used numerical integration rather
      than closed-form solutions.)

    TOTAL COAST TIME:
      The coast phase is symmetric around apogee (in the
      simplified model). Time from burnout to reentry
      interface (~60 km on the way down):

      t_coast = 2 * t_apogee ≈ 340 s

      This is approximately the 302 seconds of
      weightlessness that Shepard experienced, plus
      the portions of ascent and descent where drag
      was negligible.

  PHASE 3: REENTRY (~562 s to 928 s)
  ====================================

    When the capsule descends below ~80 km, atmospheric
    drag becomes significant. The capsule decelerates
    rapidly -- from approximately 2,294 m/s to terminal
    velocity, to parachute deployment speed, to splashdown.

    The reentry g-load profile:
      Peak g: 11.6g (higher than Ham's planned 11g,
      but Ham actually experienced 14.7g due to the
      off-nominal trajectory -- see MR-2, mission 1.17)

    Why reentry g is higher than launch g:
      During launch: 6.3g (engine thrust / capsule mass,
        partially offset by gravity and drag)
      During reentry: 11.6g (atmospheric deceleration
        alone, with no thrust to moderate the profile)

      The difference exists because the capsule enters
      the atmosphere at a steeper angle than it left.
      During ascent, the gravity turn gradually tilted
      the trajectory from vertical to ~45 degrees. During
      descent, the capsule falls back along a similarly
      steep path. But during ascent, the engine was
      providing a controlled acceleration over 142 seconds.
      During descent, the atmosphere provides an uncontrolled
      deceleration over approximately 60 seconds. Shorter
      deceleration time = higher peak g.

    DOWNRANGE DISTANCE:
      R = (v_bo^2 * sin(2 * gamma_bo)) / g

      For gamma_bo = 45 degrees (optimal for maximum range):
        R = v_bo^2 / g
          = (2,294)^2 / 9.8
          = 5,262,436 / 9.8
          = 537,004 m
          = 537 km

      (The actual range was 486 km. The difference arises
      because: (1) the real trajectory is not a simple
      parabola -- Earth's curvature matters over 486 km,
      (2) drag during ascent and descent reduces the range,
      (3) gamma_bo was not exactly 45 degrees, and
      (4) the variation of g with altitude is non-trivial.
      But the simplified range equation gives the right
      order of magnitude and shows why 45 degrees is
      the optimal launch angle for maximum range.)

    TOTAL FLIGHT TIME:
      t_total = t_powered + t_coast + t_reentry
              = 142 + 420 + 366
              = 928 seconds
              = 15 minutes 28 seconds
```

**Comparison: Shepard's MR-3 vs Ham's MR-2**

```
TRAJECTORY COMPARISON: PLANNED vs OFF-NOMINAL

  Freedom 7 (MR-3, Shepard):     MR-2 (Ham):
  ===========================    =========================
  PLANNED trajectory              OFF-NOMINAL trajectory
  Burnout v: 2,294 m/s           Burnout v: 2,292 m/s*
  Apogee: 187.5 km               Apogee: 253 km
  Range: 486 km                   Range: 679 km
  Duration: 15m 28s               Duration: 16m 39s
  Launch g: 6.3g                  Launch g: ~6.3g (nominal)
  Reentry g: 11.6g               Reentry g: 14.7g
  Status: NOMINAL                 Status: ABORT TRIGGERED

  *Ham's burnout velocity was similar to Shepard's, but
  the abort system fired and added ~1,300 m/s of additional
  velocity from the escape rocket, pushing the capsule
  to a higher, longer trajectory.

  The critical difference:
    Shepard's trajectory was DESIGNED. Every parameter
    was predicted, confirmed by telemetry during flight,
    and matched the post-flight analysis.

    Ham's trajectory was UNCONTROLLED. The abort system
    fired due to a relay malfunction, the Redstone
    burned longer than planned due to fuel depletion
    logic, and the resulting trajectory exceeded all
    planned parameters. Ham survived, but the trajectory
    was an accident, not a plan.

  This is why Shepard's flight qualified the Mercury
  system for human spaceflight: not because it was more
  demanding than Ham's (Ham's was actually harder), but
  because it was PREDICTABLE. A system is qualified when
  it performs as predicted, not when it survives an anomaly.
  Ham proved the capsule could survive extremes. Shepard
  proved the system could perform as designed.
```

### Debate Questions (Layer 4)

1. **The optimal launch angle for maximum range in a vacuum is 45 degrees -- a result that falls directly from the range equation R = v^2 sin(2*gamma) / g.** But Freedom 7 was not launched in a vacuum. Atmospheric drag during the first 60 seconds of flight removed energy from the vehicle, and the drag loss depended on the trajectory angle (steeper ascent = less time in thick atmosphere = less drag, but less horizontal velocity). If you account for drag, is the optimal angle still 45 degrees? The answer is no: for a vehicle with Freedom 7's thrust-to-weight ratio and drag profile, the optimal angle is slightly steeper (~50-55 degrees), trading range for reduced drag loss. How does atmospheric drag shift the optimal angle, and what does this tell us about the tradeoff between mathematical ideals and engineering reality?

2. **Shepard experienced 11.6g during reentry -- higher than the 6.3g during launch, even though reentry and launch cover similar velocity changes.** The asymmetry exists because launch stretches the acceleration over 142 seconds (engine burn time) while reentry compresses the deceleration into approximately 60 seconds (the time the capsule spends in the dense lower atmosphere). Is there a way to design a suborbital reentry with lower peak g? The answer involves trajectory shaping: a shallower reentry angle spreads the deceleration over a longer path through thinner atmosphere. But for a ballistic capsule with no lift (L/D ~ 0), the reentry angle is fixed by the trajectory -- the capsule cannot choose its entry angle. This is why Gemini and Apollo used lifting capsules (L/D ~ 0.3-0.5): the ability to generate lift during reentry allowed the crew to modulate the g-profile. Freedom 7 was a ballistic cannonball. Shepard rode the 11.6g because he had no alternative.

3. **The Peregrine Falcon (Falco peregrinus, degree 19) reaches 390+ km/h in its hunting stoop, and must pull out of the dive without exceeding its own structural limits.** The pullout g-force depends on speed and turn radius: g_pullout = v^2 / (r * g_0). At 390 km/h (108 m/s) with a pullout radius of 50 meters, the falcon experiences approximately 24g -- more than double what Shepard endured during reentry. How does the falcon survive this? The answer involves its small body mass (the structural loads scale with mass), its specialized cardiovascular system (evolved for rapid blood pressure management), and its flight posture during pullout (wings partially extended, distributing the load across the skeleton). Compare the falcon's 24g pullout to Shepard's 11.6g reentry: both are controlled decelerations at the boundary of what the organism can tolerate, and both require the organism to be positioned correctly (Shepard in his contour couch, the falcon in its pullout posture) to survive.

---

## Deposit 2: Manual Control -- Human in the Loop (Layer 7, Section 7.19)

### Formulas

**The First Manual Spacecraft Control**

Alan Shepard was not merely a passenger on Freedom 7. During the five minutes of weightlessness near apogee, he manually controlled the capsule's attitude in all three axes: pitch (nose up/down), yaw (nose left/right), and roll (rotation around the long axis). He was the first Mercury astronaut to manually fly a spacecraft. This was not a trivial test -- it was the resolution of a fundamental debate about whether a human could usefully control a vehicle in the space environment.

The "spam in a can" debate was real and serious. Many engineers at NASA and in the military believed that human piloting in space was unnecessary or dangerous -- that automatic systems would perform more reliably than a human disoriented by weightlessness, stressed by isolation, and overwhelmed by sensory novelty. The Mercury 7 astronauts -- all test pilots -- fought for manual control authority. Shepard's manual control test during MR-3 was their opportunity to prove that a human pilot added value.

```
MANUAL CONTROL DYNAMICS:

  THE CAPSULE'S ATTITUDE CONTROL SYSTEM:
    Mercury used hydrogen peroxide (H2O2) monopropellant
    thrusters for attitude control. The H2O2 decomposed
    over a silver catalyst, producing steam and oxygen
    at approximately 600 degrees C, which was expelled
    through small nozzles to produce torque.

    Thruster specifications:
      Number of thrusters: 18 (6 per axis, arranged
        in opposing pairs for positive and negative
        rotation in pitch, yaw, and roll)
      Thrust per nozzle: ~1 lbf (~4.4 N)
      Moment arm: ~0.5 m (distance from nozzle to
        capsule center of mass)
      Torque per nozzle: ~2.2 N*m
      Capsule moment of inertia (approx):
        I_pitch ~ 100 kg*m^2
        I_yaw   ~ 100 kg*m^2
        I_roll  ~ 40 kg*m^2

    Angular acceleration per thruster firing:
      alpha_pitch = torque / I_pitch
                  = 2.2 / 100
                  = 0.022 rad/s^2
                  = 1.26 deg/s^2

      alpha_roll = torque / I_roll
                 = 2.2 / 40
                 = 0.055 rad/s^2
                 = 3.15 deg/s^2

    Angular rate per second of thruster firing:
      omega_pitch = alpha * t
                  = 1.26 deg/s^2 * 1 s
                  = 1.26 deg/s

    To rotate the capsule 10 degrees in pitch:
      Phase 1 (accelerate): fire thruster for t_1 seconds
      Phase 2 (coast): no thruster, capsule rotates at
        constant angular rate
      Phase 3 (decelerate): fire opposing thruster for
        t_1 seconds to stop the rotation

      For a 10-degree rotation at 1.26 deg/s^2:
        Using theta = (1/2) * alpha * t_1^2 for the
        acceleration phase, and the same for deceleration:
          Total angle = alpha * t_1^2
          10 = 1.26 * t_1^2
          t_1 = sqrt(10 / 1.26) = 2.82 s

        Total time for 10-degree maneuver:
          t_total = 2 * t_1 = 5.64 seconds

    This is SLOW by aircraft standards. A fighter jet
    can roll 360 degrees per second. Mercury could
    manage approximately 1 degree per second in pitch.
    The capsule was not an airplane. Manual control
    required patience, precision, and a light touch --
    the opposite of the rapid, aggressive inputs that
    test pilots were trained for in high-performance
    aircraft.

  HUMAN-IN-THE-LOOP CONTROL BANDWIDTH:

    The control loop for manual spacecraft attitude:

    1. SENSE: Pilot reads attitude indicator (artificial
       horizon instrument, or looks through periscope)
       Delay: ~200 ms (visual processing)

    2. DECIDE: Pilot determines which thruster to fire
       and for how long
       Delay: ~100 ms (cognitive processing)

    3. ACT: Pilot moves the hand controller to fire
       the thruster
       Delay: ~100 ms (motor response)

    4. VEHICLE RESPONSE: Thruster fires, capsule begins
       to rotate at ~1 deg/s
       Delay: ~50 ms (valve opening, propellant flow)

    5. FEEDBACK: Pilot observes the attitude change on
       instruments or through periscope
       Delay: ~200 ms (visual update cycle)

    Total loop time: ~650 ms per control cycle

    This gives a control bandwidth of approximately:
      f_control = 1 / (2 * t_loop)
                = 1 / (2 * 0.65)
                = 0.77 Hz

    The pilot can make approximately one meaningful
    control input every 1.3 seconds. This is the human-
    in-the-loop control bandwidth for manual spacecraft
    attitude control.

    By comparison:
      The automatic stabilization system (ASCS) had
      a control bandwidth of approximately 2-5 Hz --
      several times faster than the human pilot.

    But bandwidth is not the only metric. The ASCS
    was a bang-bang controller (full thruster on or off),
    which consumed fuel rapidly and produced oscillations.
    Shepard, once adapted to the control dynamics, used
    proportional-style inputs: short pulses for small
    corrections, longer pulses for larger maneuvers.
    He consumed less fuel per maneuver than the ASCS
    because he could anticipate the vehicle's response
    and apply precisely the right impulse. The human
    pilot had lower bandwidth but higher efficiency.

  SHANNON INFORMATION RATE OF MANUAL CONTROL:

    How much information does a human pilot transmit
    to the spacecraft per second?

    The hand controller has three axes (pitch, yaw, roll),
    each with approximately 10 distinguishable positions
    (off, and ~9 levels of deflection in each direction).

    Bits per axis: log2(10) = 3.32 bits
    Three axes: 3 * 3.32 = 9.97 bits per sample
    Sample rate: ~0.77 Hz (from control bandwidth)

    Information rate: 9.97 * 0.77 = 7.68 bits/second

    This is Shepard's control channel capacity:
    approximately 8 bits per second of attitude
    control information flowing from pilot to spacecraft.

    For comparison:
      Enos's lever task (mission 1.18): ~1 bit per trial
        (correct/incorrect), ~1 trial per 2 seconds
        = ~0.5 bits/second of task performance data

      A modern fly-by-wire fighter pilot: ~50-100 bits/s
        (faster control bandwidth, more axes)

      A computer autopilot: ~10,000+ bits/s
        (no human bandwidth limitation)

    Shepard's 8 bits/second was enough. In five minutes
    of manual control, he transmitted approximately
    2,400 bits of control information to the spacecraft --
    enough to demonstrate that a human pilot could
    maintain attitude, perform deliberate maneuvers
    in all three axes, and return to the correct
    attitude for reentry. The "spam in a can" argument
    was refuted in 2,400 bits.
```

**Comparison: Shepard's Manual Control vs Enos's Lever Task**

```
HUMAN PILOT vs TRAINED PRIMATE:

  Enos (MR-2, mission 1.18):
    Task: Binary lever selection (left or right)
    Control: stimulus-response (reactive)
    Information rate: ~0.5 bits/second
    Demonstrated: a primate can perform TRAINED TASKS in orbit
    Failure mode: equipment malfunction (reversed feedback)
    Enos's response: maintained correct trained behavior

  Shepard (MR-3, mission 1.19):
    Task: Three-axis attitude control (pitch/yaw/roll)
    Control: continuous, anticipatory (proactive)
    Information rate: ~8 bits/second
    Demonstrated: a human can PILOT a spacecraft in space
    Failure mode: none (manual control test was successful)
    Shepard's response: exceeded expectations

  The difference is not just quantitative (8 bits/s vs
  0.5 bits/s). It is qualitative:

    Enos performed a STIMULUS-RESPONSE task. He waited
    for a light, then pulled a lever. The task required
    no model of the spacecraft, no understanding of
    the trajectory, no anticipation of future states.
    It required only the mapping: blue light left -> pull
    left lever. Blue light right -> pull right lever.

    Shepard performed a MODEL-BASED task. He looked at
    the attitude indicator, compared the current attitude
    to the desired attitude, predicted how the capsule
    would respond to a thruster input, applied the input,
    and monitored the result. He had an internal model
    of the vehicle dynamics. His control inputs were
    based on prediction, not just reaction.

  Enos proved that an organism could WORK in space.
  Shepard proved that a human could THINK in space.
  The distinction matters because piloting requires
  not just correct responses to stimuli but correct
  predictions about future states -- a fundamentally
  different cognitive operation.
```

### Debate Questions (Layer 7)

1. **Shepard's manual control test was conducted during the ~5 minutes of weightlessness near apogee.** During this time, the capsule was in free fall -- no aerodynamic forces, no engine thrust, only the hydrogen peroxide thrusters providing any force on the vehicle. In this environment, the capsule obeys Newton's first law precisely: it will continue in whatever rotational state it is in until a torque is applied. There is no natural damping (no air resistance on the capsule's surfaces). If Shepard over-corrected in pitch, the capsule would continue rotating until he applied an opposing correction. How does the absence of natural damping change the piloting task compared to atmospheric flight, where aerodynamic damping naturally resists rotation? Is manual spacecraft control harder or easier than manual aircraft control, and what does this tell us about the relative importance of the pilot's internal model?

2. **The "spam in a can" debate was between two philosophies: the engineer's view (automate everything, the human is unreliable) and the pilot's view (the human is the ultimate backup, give the pilot control authority).** Mercury's ASCS could maintain attitude automatically, but it consumed fuel rapidly because it used bang-bang control logic (full thruster on or full off). Shepard's proportional control was more fuel-efficient. Modern spacecraft (Crew Dragon, Starliner) can dock autonomously with the ISS, but they also have manual override capability. Has the "spam in a can" debate been resolved? Or does every new spacecraft reopen the same argument -- how much control should the human have?

---

## Deposit 3: The Stoop -- Peregrine Falcon Terminal Velocity (Layer 4, Section 4.19b)

### Formulas

**The Fastest Animal on Earth**

The Peregrine Falcon (Falco peregrinus, degree 19) is the fastest animal on Earth, reaching speeds in excess of 390 km/h (240 mph, 108 m/s) during its hunting stoop -- a near-vertical dive from altitude onto prey. The stoop is a controlled ballistic descent: the falcon transforms itself from a high-drag flying shape into a low-drag projectile by tucking its wings tight against its body, creating a teardrop profile that slices through the atmosphere with minimal resistance.

The physics of the stoop are identical in principle to the physics of Freedom 7's reentry: both are objects descending through the atmosphere under the combined forces of gravity and aerodynamic drag, and both must manage the deceleration at the end of the descent to survive. The difference is scale -- the falcon operates at Mach 0.3, Freedom 7 at Mach 6.7 -- but the mathematical framework is the same.

```
TERMINAL VELOCITY IN A STOOP:

  An object falling through air reaches terminal velocity
  when the drag force equals the gravitational force:

    F_drag = F_gravity
    (1/2) * rho * v_t^2 * C_d * A = m * g

  Solving for terminal velocity:

    v_t = sqrt(2 * m * g / (rho * C_d * A))

  where:
    m   = mass of the falcon
    g   = gravitational acceleration (9.8 m/s^2)
    rho = air density (varies with altitude)
    C_d = drag coefficient (shape-dependent)
    A   = reference area (cross-sectional area
          presented to the airflow)

  THE FALCON'S TWO CONFIGURATIONS:

  1. SOARING (wings extended, hunting for prey):
     m     = 1.0 kg (typical adult female peregrine)
     C_d   = 0.4 (broad cross-section, extended wings)
     A     = 0.06 m^2 (wingspan ~1 m, body width ~15 cm,
             projected area with wings extended)
     rho   = 1.225 kg/m^3 (sea level)

     v_t_soaring = sqrt(2 * 1.0 * 9.8 / (1.225 * 0.4 * 0.06))
                 = sqrt(19.6 / 0.0294)
                 = sqrt(666.7)
                 = 25.8 m/s
                 = 93 km/h

     With wings extended, the falcon's terminal velocity
     is about 93 km/h -- fast for a bird, but nowhere
     near the stoop speed.

  2. STOOP (wings tucked, diving):
     m     = 1.0 kg (same bird)
     C_d   = 0.07 (teardrop shape, minimized drag)
     A     = 0.008 m^2 (body only, wings fully retracted,
             cross-section approximately 10 cm x 8 cm)
     rho   = 1.225 kg/m^3 (sea level)

     v_t_stoop = sqrt(2 * 1.0 * 9.8 / (1.225 * 0.07 * 0.008))
               = sqrt(19.6 / 0.000686)
               = sqrt(28,571)
               = 169 m/s
               = 608 km/h

     Wait -- 608 km/h? That exceeds the observed maximum
     of ~390 km/h. What limits the falcon to 390 km/h?

  THE REAL LIMIT: STRUCTURAL AND PHYSIOLOGICAL

    The 608 km/h theoretical terminal velocity assumes
    perfect streamlining at sea-level air density. In
    practice, the falcon is limited by:

    1. ALTITUDE: Stoops typically begin at 300-1500 m AGL.
       At altitude, air is thinner (rho is lower), so the
       falcon falls faster in the upper portion of the stoop.
       But the stoop distance is limited by the altitude --
       the falcon must pull out before hitting the ground.

    2. STRUCTURAL LIMITS: The pullout at the bottom of
       the stoop produces extreme g-forces:

       g_pullout = v^2 / (r * g_0)

       At v = 108 m/s (390 km/h) with a pullout radius
       of 50 m:
         g_pullout = (108)^2 / (50 * 9.8)
                   = 11,664 / 490
                   = 23.8 g

       This is comparable to military fighter jet
       structural limits (9-12g for the airframe, with
       pilots blacking out above ~9g). The falcon
       survives 24g because:
       - Small body mass (1 kg vs 80 kg human) means
         lower absolute forces on organs
       - Specialized cardiovascular system: rapid heart
         rate (600+ bpm), muscular arteries that prevent
         blood pooling, and a relatively large heart
       - Skeletal structure optimized for load distribution
       - The stoop posture distributes g-forces along the
         long axis of the body (head-to-tail), similar to
         how astronauts are positioned (chest-to-back)
         during launch and reentry to tolerate higher g

    3. CONTROL: The falcon must see its prey and adjust
       its trajectory during the stoop. At 390 km/h, it
       closes 108 meters per second. If the prey is at
       500 m distance when the stoop begins, the falcon
       has approximately 4.6 seconds to track, adjust,
       and strike. Faster stoops reduce this time below
       the falcon's control bandwidth.

  COMPARISON: FALCON STOOP vs FREEDOM 7 REENTRY

    | Parameter | Peregrine Falcon | Freedom 7 |
    |-----------|-----------------|-----------|
    | Mass | 1 kg | 1,360 kg |
    | Entry speed | 108 m/s | 2,294 m/s |
    | Mach number | 0.32 | 6.7 |
    | Peak drag force | ~10 N | ~180,000 N |
    | Peak g (deceleration) | ~24g (pullout) | 11.6g (reentry) |
    | Drag coefficient | 0.07 (stoop) | 1.6 (blunt body) |
    | Control method | wing/tail adjust | none (ballistic) |
    | Duration of peak g | ~0.5 s | ~30 s |
    | Survival strategy | small mass, posture | contour couch, posture |
    | Can abort? | yes (extend wings) | no (committed to trajectory) |

    Both organisms survive their descent by managing
    deceleration within physiological limits. The falcon
    has an advantage Shepard did not: it can abort the
    stoop at any time by extending its wings, instantly
    increasing drag and reducing speed. Shepard was
    committed to his trajectory once the engine cut off --
    a ballistic cannonball with no ability to modulate
    the reentry profile. The falcon is more like a
    lifting-body vehicle: it can control its descent.
    Freedom 7 was a blunt body: it could not.

    Yet both organisms arrive safely at their destination.
    The falcon strikes its prey at the bottom of the stoop.
    Shepard splashed down in the Atlantic. Both controlled
    descents required the organism to trust the physics:
    that the drag force would increase fast enough to
    decelerate them before impact, that the structural
    loads would remain within tolerance, and that the
    deceleration profile they could not fully control
    would be survivable. Shepard had a calculator and
    a mission profile that said 11.6g was within limits.
    The falcon has 40 million years of evolutionary
    optimization that says 24g is within limits. Both
    are trusting computations they did not personally
    perform: one computed by engineers, the other by
    natural selection.
```

### Debate Questions (Layer 4b)

1. **The Peregrine Falcon achieves a drag coefficient of approximately 0.07 during its stoop -- comparable to a well-designed bullet or a sports car.** By contrast, Mercury's capsule had a drag coefficient of approximately 1.6 -- the aerodynamic equivalent of a brick. Mercury was DESIGNED to have high drag: the blunt heat shield deliberately creates a massive shock wave that absorbs reentry heating away from the vehicle. The falcon is designed for LOW drag: minimal frontal area, smooth feather contours, no protrusions. One organism maximizes drag to survive descent; the other minimizes drag to maximize descent speed. Under what conditions is high drag a survival strategy, and under what conditions is low drag a survival strategy? The answer depends on what the organism is optimizing: the capsule is optimizing for heat management (spread the energy over a large shock layer), while the falcon is optimizing for kinetic energy at impact (arrive at the prey as fast as possible).

2. **The Pacific giant salamander (Dicamptodon tenebrosus, this mission's organism) is an ambush predator that lunges at prey from concealment in PNW stream cobble.** The salamander's strike is a controlled acceleration: it pushes off the stream bottom with its hind limbs and opens its mouth in approximately 15-20 milliseconds. The strike velocity is modest (~1-2 m/s), but the acceleration is extreme for the body mass (~50g for a millisecond). Compare the three predatory accelerations: the falcon's stoop (gravitational, ~10 seconds, 24g pullout), the salamander's strike (muscular, ~20 ms, ~5g), and Freedom 7's launch (rocket-powered, 142 seconds, 6.3g). All three are organisms accelerating to perform a task -- catching prey, reaching space -- and all three are constrained by the physics of their medium and the physiology of their body. Which medium (air, water, vacuum) imposes the tightest constraint on predatory acceleration?

---

### Rosetta Table: Suborbital Ballistics and Manual Control

| Concept | MR-3 Application | Prior Mission Reference |
|---------|-------------------|------------------------|
| Ballistic trajectory | Parabolic arc, 187.5 km apogee, 486 km range | MR-2 (1.17): 253 km apogee, 679 km range (off-nominal) |
| Burnout velocity | 2,294 m/s (planned, confirmed) | MR-2 (1.17): 2,292 m/s + escape rocket boost |
| Reentry g-force | 11.6g (nominal profile) | MR-2 (1.17): 14.7g (off-nominal, higher trajectory) |
| Manual control | First human manual spacecraft control, ~8 bits/s | MR-2 (1.17): no manual control (chimpanzee, trained tasks) |
| Range equation | R = v^2 sin(2*gamma) / g | MR-2 (1.17): same equation, different (unplanned) parameters |
| Control bandwidth | Human: ~0.77 Hz, ASCS: ~2-5 Hz | MA-5 (1.18): Enos lever task: ~0.5 Hz |
| Atmospheric drag | Falcon C_d = 0.07 (stoop), capsule C_d = 1.6 | MR-2 (1.17): same capsule C_d, no falcon comparison |
| Terminal velocity | Falcon: 108 m/s (stoop); capsule: N/A (ballistic) | -- (first falcon comparison in series) |
| Planned vs off-nominal | MR-3 nominal; this qualifies the system | MR-2 (1.17): off-nominal; proved survivability, not design |

---

*"Fifteen minutes. Nine hundred and twenty-eight seconds from launch to splashdown, and inside those seconds Alan Shepard proved that a human brain is a flight computer. He rode 78,000 pounds of thrust through the atmosphere on a column of burning ethanol, felt 6.3 times his own weight press him into a couch that had been molded to the shape of his body, watched the sky change from blue to black as the engine consumed thirty thousand kilograms of propellant, felt the engine cut off and the weight vanish, and then -- in the silence after burnout, floating above the Atlantic at 187.5 kilometers, with the curve of the Earth filling the periscope and the blue line of the atmosphere impossibly thin against the blackness -- he reached for the hand controller and flew the spacecraft. Pitch up. Pitch down. Yaw left. Yaw right. Roll left. Roll right. Each maneuver deliberate, measured, confirmed by the attitude indicator and the periscope view. One degree per second of rotation in pitch, three degrees per second in roll, the hydrogen peroxide thrusters hissing in one-second pulses as Shepard tested each axis of control. Five minutes of weightlessness, five minutes of piloting, 2,400 bits of control information flowing from his hands to the thrusters to prove that a human being could work in this environment -- not just survive it, not just endure it, but OPERATE in it, make decisions, correct errors, fly the vehicle. Below him, somewhere above the Caribbean, a Peregrine Falcon was diving on a shorebird, tucking its wings at the top of the stoop and accelerating to 390 kilometers per hour, 24g at the pullout, vision locked on the prey, adjusting its trajectory with micro-movements of its tail feathers, trusting 40 million years of aerodynamic refinement to bring it to the target alive. Both pilots -- the one in the capsule at 187 kilometers and the one in the stoop at 1 kilometer -- were controlling their descent through the atmosphere, managing speed and angle and drag, trusting their instruments (Shepard's attitude indicator, the falcon's binocular vision) to tell them where they were and where they needed to be. Both were proving that the organism was not a passenger but a pilot. And somewhere in the cold streams of the Olympic Peninsula, a Pacific giant salamander sat motionless under a cobble, waiting for a sculpin to swim within range, its lunging strike a 20-millisecond explosion of muscular force -- a predatory launch sequence as precisely timed as any rocket engine. Three animals, three mediums, three trajectories: the rocket through vacuum on a parabolic arc, the falcon through air on a hyperbolic dive, the salamander through water on a ballistic lunge. Each one converting stored energy into kinetic energy into contact with a target. Shepard's target was the splashdown zone. The falcon's target was the shorebird. The salamander's target was the sculpin. All three arrived. Kierkegaard, born on this day in 1813, wrote that anxiety is the dizziness of freedom -- the vertigo that seizes a person at the moment of genuine choice. Shepard stood on the gantry at 09:34 and chose to ride the rocket. The falcon stands on the wind at the top of the stoop and chooses to fold its wings. The salamander coils its muscles and chooses to strike. In each case, the choice is irreversible for the duration of the event -- Shepard could not get off the rocket, the falcon cannot un-fold mid-stoop, the salamander cannot un-lunge -- and in each case, the organism accepts the physics that follow the choice. Kierkegaard called this the leap of faith: not a leap into the dark but a leap into the known-but-uncontrolled, where the outcome depends on forces the leaper understands but cannot fully govern. Shepard understood the trajectory. He could not govern the weather, the sea state, the parachute deployment sequence, the helicopter response time. He chose to go anyway. Fifteen minutes of faith in physics, in engineering, in the people who built the rocket, in the body that would absorb 11.6g, in the hands that would fly the spacecraft. He went up. He flew. He came down. The falcon folds and dives and pulls out and eats. The salamander lunges and catches and swallows. Fifteen minutes, nine hundred and twenty-eight seconds, and America was in space."*
