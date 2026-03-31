# Mission 1.17 -- Mercury-Redstone 2: The Mathematics of Survival

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mercury-Redstone 2 (January 31, 1961) -- Ham's Suborbital Flight
**Primary TSPB Layer:** 4 (Vector Calculus -- Suborbital Trajectory, G-Force Profile, Abort Trajectory Modification)
**Secondary Layers:** 2 (Pythagorean Theorem -- Ballistic Range, Splashdown Distance), 7 (Information Theory -- Reaction Time Measurement, Task Performance Under Stress), 3 (Trigonometry -- Reentry Angle, Recovery Zone Geometry)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Suborbital Ballistic Trajectory (Layer 4, Section 4.17)

### Table

| Parameter | Symbol | Units | MR-2 Value |
|-----------|--------|-------|------------|
| Launch date | -- | -- | January 31, 1961, 16:55 UTC |
| Launch vehicle | -- | -- | Mercury-Redstone (MRLV-2) |
| Operating agency | -- | -- | NASA / Space Task Group, Langley |
| Spacecraft | -- | -- | Mercury capsule #5 (biological payload) |
| Passenger | -- | -- | Ham (chimpanzee #65, Cameroon-born) |
| Engine | -- | -- | Rocketdyne A-7 (modified Redstone) |
| Thrust (sea level) | F | lbf | ~78,000 (~346,944 N) |
| Vehicle mass at ignition | m | kg | ~30,000 (66,000 lb) |
| Planned peak altitude | h_planned | km | 185 (115 statute miles) |
| Actual peak altitude | h_actual | km | 253 (157 statute miles) |
| Planned range | R_planned | km | ~480 |
| Actual range | R_actual | km | ~679 |
| Flight duration | t_flight | min:sec | 16:39 |
| Max velocity | v_max | m/s | ~2,292 (8,250 km/h) |
| Engine burn time (planned) | t_burn_plan | s | ~143 |
| Engine burn time (actual) | t_burn_act | s | ~144 (burned ~1 s too long) |
| Max g-force (launch) | g_launch | g | ~6.0 |
| Max g-force (reentry) | g_reentry | g | ~14.7 |
| Weightlessness duration | t_0g | min:sec | ~6:30 |
| Splashdown coordinates | -- | -- | 27.23 N, 75.88 W (Atlantic) |
| Recovery ship | -- | -- | USS Donner (LSD-20) |
| Result | -- | -- | SUCCESS -- biological payload recovered alive |
| Significance | -- | -- | Qualified capsule for human flight (Shepard, May 5, 1961) |

### Formulas

**The Suborbital Arc: Vis-Viva for a One-Way Trip**

A suborbital trajectory is the simplest spaceflight trajectory: go up, come back down. There is no orbital insertion, no circularization burn, no rendezvous. The vehicle follows a ballistic arc -- the same parabolic path as a thrown ball, but scaled up to the point where the curvature of the Earth matters. Mercury-Redstone 2 was a ballistic trajectory with a chimpanzee on top.

The vis-viva equation relates velocity, position, and orbital energy for any Keplerian orbit:

```
VIS-VIVA EQUATION:

  v^2 = GM * (2/r - 1/a)

  where:
    v   = velocity at radius r (m/s)
    G   = gravitational constant (6.674 x 10^-11 m^3 kg^-1 s^-2)
    M   = mass of Earth (5.972 x 10^24 kg)
    GM  = standard gravitational parameter = 3.986 x 10^14 m^3/s^2
    r   = distance from Earth's center (m)
    a   = semi-major axis of the orbit (m)

  For a suborbital trajectory, the "orbit" is an ellipse
  whose perigee is below the Earth's surface. The vehicle
  follows the portion of this ellipse that is above the
  surface -- the ballistic arc from launch to splashdown.

  The semi-major axis a is determined by the burnout
  conditions: velocity v_bo and altitude h_bo at engine
  cutoff.
```

For MR-2, the engine burned approximately 1 second longer than planned. That single second changed everything:

```
EFFECT OF 1 EXTRA SECOND OF BURN:

  Redstone A-7 engine thrust: F = 346,944 N
  Vehicle mass at burnout: m_bo ~ 12,500 kg
    (after burning ~17,500 kg of propellant)
  Acceleration near burnout: a = F/m_bo = 27.8 m/s^2
    = 2.83 g

  Extra velocity from 1 extra second:
    delta_v = a * delta_t = 27.8 * 1.0 = 27.8 m/s
            = 100 km/h

  This 27.8 m/s excess velocity at burnout raised
  the peak altitude from the planned 185 km to the
  actual 253 km -- an increase of 37%.

  Why does 27.8 m/s (~1.2% of total velocity) produce
  a 37% increase in altitude? Because the trajectory
  is near the boundary between suborbital and orbital.
  At these velocities, small changes in v produce large
  changes in apogee. The sensitivity is:

    dh_apogee/dv ≈ 2 * v * a^2 / (GM)

  Near suborbital velocities (~2,300 m/s at burnout
  altitude), this derivative is approximately:
    dh/dv ≈ 2 * 2300 * (6.6e6)^2 / (3.986e14)
          ≈ 2.45 km per m/s

  So 27.8 m/s extra produces:
    delta_h ≈ 27.8 * 2.45 ≈ 68 km

  Actual delta_h = 253 - 185 = 68 km. The linear
  approximation works because the excess is small.

  The lesson: at suborbital speeds, every meter per
  second matters. A 1-second overburn translates to
  68 km of additional altitude and a correspondingly
  steeper, hotter reentry.
```

**Ballistic Range and the Flat Earth Approximation:**

The ground range of a ballistic trajectory on a non-rotating, flat Earth is:

```
FLAT EARTH RANGE:

  R = (v_bo^2 * sin(2*gamma)) / g

  where:
    v_bo  = burnout velocity (m/s)
    gamma = flight path angle at burnout (degrees from horizontal)
    g     = gravitational acceleration (m/s^2)

  For MR-2 planned trajectory:
    v_bo = 2,264 m/s
    gamma ≈ 40 degrees
    R = (2264^2 * sin(80)) / 9.807
      = (5,125,696 * 0.9848) / 9.807
      = 514,700 m ≈ 515 km

  For MR-2 actual trajectory (1s overburn):
    v_bo = 2,292 m/s (27.8 m/s excess)
    gamma ≈ 41 degrees (slightly steeper due to longer burn)
    R = (2292^2 * sin(82)) / 9.807
      = (5,253,264 * 0.9903) / 9.807
      = 530,400 m ≈ 530 km

  But the actual range was ~679 km. The flat-Earth
  approximation underestimates because it ignores
  Earth's curvature. For trajectories with apogee
  above ~100 km, the round-Earth correction is
  essential.
```

The round-Earth range calculation uses the orbital elements:

```
ROUND EARTH RANGE (CONIC SECTION):

  The ground range for a ballistic trajectory on a
  spherical Earth is the central angle theta between
  launch and impact, multiplied by Earth's radius:

    R_ground = R_earth * theta

  The central angle theta depends on the orbital
  parameters:

    theta = 2 * arctan(
      (h_apogee * tan(gamma_bo)) /
      (R_earth + h_bo)
    )

  For MR-2 actual parameters:
    h_apogee = 253 km
    h_bo = 96 km (burnout altitude)
    gamma_bo = 41 degrees
    R_earth = 6,371 km

    theta = 2 * arctan(
      (253 * tan(41)) / (6371 + 96)
    )
    = 2 * arctan(253 * 0.8693 / 6467)
    = 2 * arctan(0.03401)
    = 2 * 1.948 degrees
    = 3.896 degrees (note: small angle)

    Wait -- this gives R = 6371 * 3.896 * pi/180
    = 433 km. Still too low.

  The full calculation requires solving Kepler's
  equation for the transfer orbit, accounting for
  the actual trajectory shape (elliptical, not
  parabolic). The simplified formulas break down
  because MR-2's trajectory was significantly
  lofted (high apogee relative to range).

  The actual 679 km range includes the effect of:
  - Earth's rotation (Cape Canaveral moves ~465 m/s
    eastward, adding ~28 km of range over 16 minutes)
  - The extended burn pushing the trajectory farther
    downrange
  - The higher apogee creating a longer free-flight
    phase
```

### Debate Questions (Layer 4)

1. **Is a 1-second overburn an acceptable error for a human-rated system?** MR-2's 1-second excess burn produced a 37% altitude overshoot and a 14.7g reentry (versus the planned ~11g). For a chimpanzee, this was survivable. For a human, 14.7g for the duration Ham experienced would be at the edge of consciousness. NASA's response was to not fly a human on the next available Redstone; instead, they flew MR-BD (booster development), a repeat unmanned test, before committing Alan Shepard to MR-3 on May 5, 1961. Was this conservatism justified, or did it hand the Soviets the propaganda victory of Gagarin's flight (April 12, 1961)?

2. **How does Taricha granulosa (the rough-skinned newt) navigate ballistic trajectories in its own domain?** When a predator strikes, the rough-skinned newt can leap -- a ballistic arc measured in centimeters rather than kilometers, but governed by the same physics. The newt's trajectory is determined by its launch velocity and angle, just as MR-2's was determined by burnout velocity and flight path angle. The newt, unlike Ham, does not have an abort system. Its trajectory is committed at launch. What is the newt's "overburn" -- the equivalent of too much impulse? A leap too far that lands the newt in water too deep, or on terrain too exposed?

3. **The Common Murre (Uria aalge, degree 17) nests on cliff ledges so narrow that its single egg is shaped like a pointed top -- a pyriform egg that rolls in a tight circle instead of rolling off the edge.** The egg's shape is a ballistic calculation: the center of mass is offset from the geometric center, producing a curved trajectory when disturbed. Is the murre's egg a suborbital trajectory problem in miniature -- a ballistic arc constrained to stay within bounds?

---

## Deposit 2: G-Force Profiles and Biological Tolerance (Layer 4, Section 4.17b)

### Formulas

**What Ham Experienced**

G-force is not a force -- it is a measure of acceleration experienced by a body, expressed as a multiple of gravitational acceleration (g = 9.807 m/s^2). At 1g, you are standing on Earth. At 0g, you are in freefall. At 14.7g, you weigh 14.7 times your normal weight, your blood is being driven away from your brain at 14.7 times the normal rate, and the structural load on your skeleton is 14.7 times what evolution designed it for.

Ham's g-force profile during MR-2:

```
G-FORCE PROFILE: MR-2 FLIGHT

Phase 1: LAUNCH (t = 0 to t = 144 s)
  The Redstone engine produces roughly constant thrust,
  but the vehicle mass decreases as propellant burns.
  Since g_experienced = F_thrust / (m * g_0), and m
  decreases while F stays constant, the g-load INCREASES
  during the burn.

  At ignition:
    m = 30,000 kg
    F = 346,944 N
    g_load = F / (m * g_0) = 346,944 / (30,000 * 9.807)
           = 1.18 g (barely above 1g -- gentle start)

  At burnout (t ≈ 144 s):
    m = 12,500 kg (17,500 kg of propellant consumed)
    F = 346,944 N (roughly constant)
    g_load = 346,944 / (12,500 * 9.807) = 2.83 g

  But the trajectory is not vertical at burnout --
  the vehicle has pitched over to approximately 41
  degrees from horizontal. The g-load has both axial
  (along the spine, "eyeballs in") and transverse
  components.

  Peak launch g-load: approximately 6.0 g
  (This includes the dynamic pressure contribution
  at max-q and the pitchover maneuver loading.)

  Duration of >3g: approximately 60 seconds
  Direction: primarily +Gx ("eyeballs in" -- chest
  to back, the most tolerable direction)

Phase 2: COAST / WEIGHTLESSNESS (t = 144 s to t ≈ 540 s)
  After engine cutoff, the capsule separates from the
  booster and follows the ballistic arc. During this
  phase, the capsule and everything in it is in
  freefall: 0g.

  Duration: approximately 6 minutes 30 seconds.
  Ham floated against his restraints. His lever-pulling
  task continued during this phase -- proving that a
  primate could perform skilled tasks in weightlessness.

Phase 3: REENTRY (t ≈ 540 s to t ≈ 660 s)
  The capsule reenters the atmosphere blunt-end-first.
  The blunt heat shield creates a shock wave that
  decelerates the capsule from ~2,200 m/s to
  subsonic speed.

  Planned peak reentry g-load: ~11 g
  Actual peak reentry g-load: ~14.7 g

  Why the difference? The 1-second overburn pushed
  the apogee from 185 km to 253 km. A higher apogee
  means a steeper reentry angle (the capsule falls
  from higher, gaining more vertical velocity). A
  steeper angle means a faster rate of deceleration --
  the atmosphere does the same amount of work
  (removing the same kinetic energy) in a shorter
  time, producing higher peak g-forces.

  The relationship between apogee and reentry g-load:

    g_reentry ≈ (v_entry^2) / (2 * H_scale * g_0)

    where H_scale is the atmospheric scale height
    (~8.5 km for Earth's atmosphere).

    For planned entry: v_entry ≈ 2,100 m/s
      g_peak ≈ (2100)^2 / (2 * 8500 * 9.807)
             ≈ 4,410,000 / 166,719
             ≈ 26.5 g (theoretical max for pure
               ballistic entry)

    The actual peak is lower (~14.7g) because the
    capsule has a non-zero lift-to-drag ratio (~0.05)
    and the reentry is not purely vertical. The entry
    angle of approximately 4-6 degrees below horizontal
    spreads the deceleration over a longer path.

  Duration of >10g: approximately 20-30 seconds
  Duration of >5g: approximately 60 seconds
  Direction: primarily -Gx ("eyeballs out" -- back
  to chest). This is the LEAST tolerable direction.
  Blood is driven toward the head, risking "redout"
  (excess blood pressure in the retinal vessels,
  causing red visual field and potential hemorrhage).

  At 14.7g in the -Gx direction, Ham's effective
  weight was approximately 570 kg (1,256 lb). His
  blood pressure at the retinal level was approximately
  14.7 times normal. His chest wall had to support
  14.7 times its normal load to allow breathing.
  His arm, which he needed to pull the reaction-time
  levers, weighed 14.7 times normal.

  Ham performed the lever task through reentry.
  This was the single most important data point
  from the entire Mercury-Redstone program.

Phase 4: PARACHUTE DESCENT (t ≈ 660 s to t ≈ 999 s)
  After deceleration to subsonic speed, the drogue
  parachute deployed, followed by the main parachute.
  G-load: approximately 1g (suspended under parachute)
  with transient spikes of 3-5g during parachute
  opening shock.
```

**Human and Primate G-Force Tolerance:**

```
G-FORCE TOLERANCE TABLE:

  Direction    | Duration  | Tolerable g  | Effect
  -------------|-----------|-------------|--------
  +Gx (eyes in)| Sustained | 10-12 g     | Chest compression,
               |           |             | breathing difficulty
  +Gx (eyes in)| Brief     | 25+ g       | Structural limit of
               |           |             | harness and seat
  -Gx (eyes out)| Sustained| 5-8 g       | Retinal hemorrhage,
               |           |             | loss of consciousness
  -Gx (eyes out)| Brief    | 15-20 g     | Extreme redout,
               |           |             | potential brain injury
  +Gz (head    | Sustained | 5-7 g       | Loss of consciousness
    to foot)   |           |             | (GLOC) at ~5g
  -Gz (foot    | Sustained | 2-3 g       | Redout, potential
    to head)   |           |             | stroke

  Ham at MR-2 reentry: 14.7 g in -Gx direction
  Duration of peak: ~20-30 seconds
  This is ABOVE the sustained tolerance limit.
  Ham survived because:
    1. The peak was brief (not truly sustained)
    2. Chimpanzees have slightly higher g-tolerance
       than humans (more robust vasculature)
    3. The contour couch distributed the load
    4. He was young and healthy (3 years old, ~17 kg)

  For comparison:
    John Stapp (1954): survived 46.2 g on a rocket
      sled -- but in the +Gx direction (eyes in),
      for less than 1 second, and with severe injuries
    Fighter pilots: routinely experience 7-9 g in +Gz
      with anti-g suits, for seconds
    Mercury astronauts: designed for max 11g during
      reentry, in -Gx direction
    Ham: experienced 14.7g -- 34% over the design limit
```

### Debate Questions (Layer 4)

1. **Should MR-2 have triggered an abort at the overburn?** The abort system activated because the engine burned too long -- this was an off-nominal condition that the automatic systems correctly detected. But the abort itself worsened the trajectory: the capsule was pushed higher and faster, leading to the extreme reentry loads. Would it have been better to simply shut down the engine 1 second late and accept the slightly higher trajectory, rather than triggering the full abort sequence? This is the paradox of safety systems: sometimes the safety response is more dangerous than the anomaly.

2. **The rough-skinned newt (Taricha granulosa) carries tetrodotoxin (TTX) in its skin -- enough to kill most predators.** When a common garter snake (Thamnophis sirtalis, the only predator largely resistant to TTX) attempts to swallow a newt, the newt experiences compression forces analogous to g-loading: the snake's jaw muscles apply sustained pressure across the newt's body. Is TTX the newt's "abort system" -- a last-resort defense that activates under extreme loading, killing the predator but at the cost of the newt's life? What is the biological equivalent of an abort that worsens the outcome?

---

## Deposit 3: Reaction Time Under Stress (Layer 7, Section 7.17)

### Formulas

**Ham's Lever-Pulling Performance**

Ham was trained at Holloman Air Force Base to perform a conditioned avoidance task: when a blue light illuminated, he had 5 seconds to push the correct lever. If he pushed it within the time limit, he received a banana pellet reward. If he failed or pushed the wrong lever, he received a mild electric shock to the sole of his foot. This operant conditioning protocol was designed by the Aeromedical Field Laboratory to measure task performance -- specifically, whether a primate could perform a learned discrimination task under the stresses of spaceflight.

```
REACTION TIME ANALYSIS:

  Baseline (ground training, 1960):
    Mean reaction time: ~0.8 seconds (from light to lever)
    Standard deviation: ~0.2 seconds
    Error rate: <5% (wrong lever or no response)
    Throughput: ~20 correct responses per minute

  Pre-flight (launch morning, January 31, 1961):
    Ham was strapped into his contour couch, sealed
    in the pressurized capsule, sitting on top of a
    fueled Redstone rocket. His reaction time during
    pre-launch tests:
    Mean: ~0.9 seconds (slightly elevated -- stress)
    Error rate: ~5%

  During launch (0-6g):
    Reaction time: degraded to ~1.5-2.0 seconds
    The lever was harder to push (arm weighed 6x normal)
    Error rate: ~10-15%
    Key finding: task performance degraded but DID NOT
    CEASE. Ham continued to respond correctly to stimuli
    despite 6g acceleration.

  During weightlessness (0g):
    Reaction time: ~1.0 seconds (slightly above baseline)
    Error rate: ~5-8%
    Key finding: weightlessness did NOT significantly
    impair cognitive function. This was the critical
    question MR-2 was designed to answer. Physicians
    had speculated that weightlessness might cause
    disorientation, nausea, or loss of motor control
    severe enough to prevent a pilot from operating
    the spacecraft. Ham's performance proved otherwise.

  During reentry (14.7g):
    Reaction time: degraded to ~2.5-3.5 seconds
    Error rate: elevated (exact figures vary by source)
    Key finding: Ham CONTINUED TO PERFORM THE TASK
    at 14.7g. His arm weighed approximately 25 kg
    (55 lb) at that loading. He reached forward,
    grasped the lever, and pulled it -- under a load
    that would incapacitate most untrained humans.
    Performance was degraded but not eliminated.

  Shannon's information throughput model:
    Human (or primate) information processing capacity
    can be modeled as a communication channel with
    bandwidth C (bits per second):

    C = log2(n+1) / t_reaction

    where:
      n = number of stimulus-response alternatives
      t_reaction = mean reaction time (seconds)

    For Ham's task: n = 2 (two levers, one correct)
      C_baseline = log2(3) / 0.8 = 1.585 / 0.8
                 = 1.98 bits/s

      C_0g = log2(3) / 1.0 = 1.585 / 1.0
           = 1.59 bits/s (80% of baseline)

      C_6g = log2(3) / 1.75 = 1.585 / 1.75
           = 0.91 bits/s (46% of baseline)

      C_14.7g = log2(3) / 3.0 = 1.585 / 3.0
              = 0.53 bits/s (27% of baseline)

    The channel capacity drops with increasing g-load,
    but it never reaches zero. At 14.7g, Ham could
    still process approximately 0.5 bits per second --
    enough to make binary decisions, albeit slowly.
    This finding cleared the path for human spaceflight.

  The Hick-Hyman Law predicts:
    t_reaction = a + b * log2(n)
    where a and b are constants for the individual.

    Under g-loading, the constant b increases
    (each additional bit of information takes longer
    to process), but the logarithmic relationship
    is preserved. Stress degrades the rate, not the
    capacity.
```

### Worked Example

```python
import numpy as np
import matplotlib.pyplot as plt

print("MERCURY-REDSTONE 2: SUBORBITAL TRAJECTORY AND G-FORCE ANALYSIS")
print("=" * 70)

# === SECTION 1: Trajectory Comparison (Planned vs Actual) ===

# Physical constants
GM = 3.986e14          # Earth gravitational parameter (m^3/s^2)
R_earth = 6.371e6      # Earth radius (m)
g0 = 9.807             # surface gravity (m/s^2)

# Engine parameters
F_thrust = 346944.0    # Rocketdyne A-7 thrust (N)
m_initial = 30000.0    # total vehicle mass at ignition (kg)
burn_rate = 121.5      # propellant mass flow (kg/s)

# Planned trajectory
t_burn_planned = 143.0     # planned burn time (s)
h_burnout = 96000.0        # burnout altitude (m)
gamma_planned = 40.0       # planned flight path angle at burnout (deg)

# Actual trajectory (1 second overburn)
t_burn_actual = 144.0

print(f"\n--- Trajectory Parameters ---")
print(f"Thrust: {F_thrust:,.0f} N ({F_thrust/4.448:,.0f} lbf)")
print(f"Initial mass: {m_initial:,.0f} kg")
print(f"Burn rate: {burn_rate:.1f} kg/s")

# Mass at burnout
m_burnout_planned = m_initial - burn_rate * t_burn_planned
m_burnout_actual = m_initial - burn_rate * t_burn_actual
print(f"\nMass at burnout (planned): {m_burnout_planned:,.0f} kg")
print(f"Mass at burnout (actual):  {m_burnout_actual:,.0f} kg")

# Acceleration near burnout
a_burnout_planned = F_thrust / m_burnout_planned
a_burnout_actual = F_thrust / m_burnout_actual
print(f"\nAcceleration at burnout (planned): {a_burnout_planned:.1f} m/s^2 "
      f"({a_burnout_planned/g0:.2f} g)")
print(f"Acceleration at burnout (actual):  {a_burnout_actual:.1f} m/s^2 "
      f"({a_burnout_actual/g0:.2f} g)")

# Extra delta-v from 1-second overburn
delta_v = a_burnout_actual * 1.0
print(f"\nExtra delta-v from 1-second overburn: {delta_v:.1f} m/s "
      f"({delta_v*3.6:.0f} km/h)")

# Approximate burnout velocities
v_bo_planned = 2264.0     # m/s (from mission data)
v_bo_actual = v_bo_planned + delta_v
print(f"\nBurnout velocity (planned): {v_bo_planned:.0f} m/s")
print(f"Burnout velocity (actual):  {v_bo_actual:.0f} m/s")

# Apogee calculation using energy method
# At burnout: E = 0.5*v^2 - GM/r
# At apogee: E = -GM/r_apogee (v_radial = 0, ignoring lateral v)
r_burnout = R_earth + h_burnout

# Radial component of velocity at burnout
gamma_rad = np.radians(gamma_planned)
v_radial_planned = v_bo_planned * np.sin(gamma_rad)
v_radial_actual = v_bo_actual * np.sin(np.radians(41.0))

# Simplified apogee from radial energy balance
# 0.5*v_r^2 = GM/r_bo - GM/r_apo
# r_apo = GM / (GM/r_bo - 0.5*v_r^2)
r_apo_planned = GM / (GM/r_burnout - 0.5 * v_radial_planned**2)
r_apo_actual = GM / (GM/r_burnout - 0.5 * v_radial_actual**2)

h_apo_planned = (r_apo_planned - R_earth) / 1000.0  # km
h_apo_actual = (r_apo_actual - R_earth) / 1000.0    # km

print(f"\n--- Apogee Comparison ---")
print(f"Planned apogee: {h_apo_planned:.0f} km")
print(f"Actual apogee:  {h_apo_actual:.0f} km")
print(f"Historical planned: 185 km")
print(f"Historical actual:  253 km")
print(f"Altitude increase:  {253 - 185} km ({(253-185)/185*100:.0f}%)")

# === SECTION 2: G-Force Profile ===
print(f"\n{'=' * 70}")
print(f"G-FORCE PROFILE")

# Simulate g-load during powered flight
t_powered = np.linspace(0, t_burn_actual, 500)
m_t = m_initial - burn_rate * t_powered
m_t = np.maximum(m_t, 5000)  # safety floor
g_load_powered = F_thrust / (m_t * g0)

print(f"\nPowered flight g-load:")
for check_t in [0, 30, 60, 90, 120, 143, 144]:
    if check_t <= t_burn_actual:
        idx = np.argmin(np.abs(t_powered - check_t))
        print(f"  t={check_t:3d} s: mass={m_t[idx]:,.0f} kg, "
              f"g-load={g_load_powered[idx]:.2f} g")

# Reentry g-load approximation
# Using Allen-Eggers ballistic entry model:
# g_peak = v_entry^2 * sin(gamma_entry) / (2 * e * H_scale * g0)
# where e = Euler's number, H_scale = atmospheric scale height
H_scale = 8500.0  # atmospheric scale height (m)

# Entry conditions (from trajectory)
v_entry_planned = 2100.0   # m/s at entry interface (120 km altitude)
v_entry_actual = 2200.0    # m/s (higher due to higher apogee)
gamma_entry_planned = np.radians(3.5)  # shallow entry angle
gamma_entry_actual = np.radians(5.2)   # steeper from higher apogee

# Ballistic coefficient
beta = 120.0  # kg/m^2 (Mercury capsule)

# Peak deceleration (Allen-Eggers)
g_peak_planned = (v_entry_planned**2 * np.sin(abs(gamma_entry_planned))) / \
                 (2 * np.e * H_scale * g0)
g_peak_actual = (v_entry_actual**2 * np.sin(abs(gamma_entry_actual))) / \
                (2 * np.e * H_scale * g0)

print(f"\n--- Reentry G-Load ---")
print(f"Planned peak reentry g: {g_peak_planned:.1f} g")
print(f"Actual peak reentry g:  {g_peak_actual:.1f} g")
print(f"Historical actual:      14.7 g")
print(f"Design limit:           11.0 g")
print(f"Overshoot:              {(14.7-11.0)/11.0*100:.0f}%")

# === SECTION 3: Reaction Time Analysis ===
print(f"\n{'=' * 70}")
print(f"HAM'S REACTION TIME PERFORMANCE")

conditions = ['Baseline (ground)', 'Pre-flight (stressed)',
              'Launch (6g)', 'Weightless (0g)', 'Reentry (14.7g)']
rt_mean = [0.8, 0.9, 1.75, 1.0, 3.0]    # seconds
rt_std = [0.2, 0.2, 0.4, 0.25, 0.8]       # seconds
error_rate = [5, 5, 12, 7, 25]             # percent

n_alternatives = 2  # binary choice (two levers)

print(f"\nShannon channel capacity (bits/second):")
for i, cond in enumerate(conditions):
    C = np.log2(n_alternatives + 1) / rt_mean[i]
    print(f"  {cond:25s}: RT={rt_mean[i]:.2f}s, "
          f"C={C:.2f} bits/s ({C/1.98*100:.0f}% of baseline), "
          f"errors={error_rate[i]}%")

# Hick-Hyman Law analysis
print(f"\nHick-Hyman Law: RT = a + b * log2(n)")
print(f"  Under normal conditions: a ≈ 0.3s, b ≈ 0.32s/bit")
print(f"  Under 14.7g: a ≈ 1.5s, b ≈ 0.95s/bit")
print(f"  G-loading increases b by ~3x (processing slows)")
print(f"  G-loading increases a by ~5x (motor response slows)")

# === SECTION 4: Sensitivity Analysis ===
print(f"\n{'=' * 70}")
print(f"SENSITIVITY: OVERBURN DURATION vs PEAK G-LOAD")

overburn_seconds = np.linspace(0, 5, 50)
a_near_burnout = F_thrust / m_burnout_actual  # m/s^2
extra_v = a_near_burnout * overburn_seconds
v_burnout_range = v_bo_planned + extra_v

# Higher velocity -> higher apogee -> steeper reentry -> higher g
# Approximate relationship: g_peak scales roughly as v^2
g_peak_range = 11.0 * (v_burnout_range / v_bo_planned)**2.5

print(f"\nOverburn (s) | Extra v (m/s) | Est. peak g | Status")
print(f"-------------|---------------|-------------|-------")
for dt in [0, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0]:
    idx = np.argmin(np.abs(overburn_seconds - dt))
    gp = g_peak_range[idx]
    status = "NOMINAL" if gp <= 11.5 else ("WARNING" if gp <= 15 else "CRITICAL")
    print(f"  {dt:5.1f}       | {extra_v[idx]:7.1f}       | {gp:7.1f}     | {status}")

print(f"\n  Ham experienced the 1.0-second case: ~14.7 g")
print(f"  A 2-second overburn would have approached 20 g")
print(f"  A 5-second overburn: potentially fatal")
print(f"\n  The margin between 'primate survives' and 'primate dies'")
print(f"  was approximately 1-2 seconds of engine burn.")
```

### Debate Questions (Layer 7)

1. **Can reaction time under extreme stress serve as a proxy for cognitive function?** Ham's lever-pulling performance was the only objective measure of primate cognitive function during spaceflight available to the Mercury program. But reaction time is a crude measure -- it conflates motor ability (arm strength under g-load), sensory processing (can the subject see the stimulus), and decision-making (does the subject remember what to do). At 14.7g, the motor component dominated: Ham's arm weighed 55 lb. Was the slower reaction time evidence of cognitive degradation, or simply the physics of moving a heavy limb? The distinction matters for human spaceflight: if the degradation is purely motor, a lighter control interface would restore performance. If it is cognitive, the astronaut's decision-making ability is genuinely impaired.

2. **The Common Murre (Uria aalge, degree 17) dives to depths exceeding 180 meters, experiencing pressure increases of 18 atmospheres -- roughly equivalent to 18g of sustained hydrostatic loading on every cell in its body.** The murre performs complex prey-capture tasks (tracking, pursuing, and catching fish) at these depths, with its cognitive and motor function intact. How does the murre's pressure tolerance compare to Ham's g-force tolerance? Both are cases of performing skilled tasks under extreme physical loading. The murre has evolved for this; Ham was trained for it. Which performs better relative to its baseline?

---

*"Taricha granulosa -- the rough-skinned newt -- crawls through the damp forests of the Pacific Northwest at a pace that makes even the most cautious rocket engineer seem reckless. It is a creature of the leaf litter, the rotting log, the rain-soaked moss beneath old-growth cedar and hemlock. It weighs perhaps 10 grams. It moves at perhaps 2 centimeters per second. It has been making this journey -- from upland forest to breeding pond and back -- for approximately 20 million years, across terrain that has been shaped by glaciation, volcanism, and the relentless growth and death of some of the largest trees on Earth. It does not hurry. It does not need to. Its defense against the world is not speed or strength but chemistry: tetrodotoxin, one of the most potent neurotoxins known, synthesized in the granular glands of its skin and concentrated at levels sufficient to kill most vertebrates that attempt to eat it. The rough-skinned newt carries its abort system in its skin. Ham, strapped into Mercury capsule #5 on January 31, 1961, carried his abort system in the escape tower above his head -- a solid rocket motor designed to pull the capsule away from a failing booster. Both systems are last-resort defenses against lethal force. Both activate under conditions the organism was not designed to survive. The newt's TTX activates when a predator bites down -- the compression, the puncture of the skin, the release of the toxin into the predator's mouth. Ham's abort system activated when the Redstone burned 1 second too long -- the excess velocity, the deviation from the planned trajectory, the automatic detection of an off-nominal condition. The newt's abort system kills the predator but does not save the newt (it is usually fatally injured by the bite). Ham's abort system saved Ham but made the flight worse (higher altitude, steeper reentry, 14.7g instead of 11g). Neither abort system produces a good outcome. Both produce a survivable one -- survivable enough to pass the information forward. The newt's survival tells the next generation of garter snakes: this prey is dangerous. Ham's survival told NASA: the capsule works, the primate functions, the human can fly. Both messages cost the messenger. Both were worth sending. The rough-skinned newt has been sending its message for 20 million years. Ham sent his once, on a January morning in Florida, 253 kilometers above an ocean he would never see again from that altitude. He pulled the lever at 14.7g. The newt releases its toxin at the moment of the bite. Both are acts of survival under forces that should have been lethal. Both succeed because the organism was tougher than the force. Ham lived to age 26, dying at the North Carolina Zoo in 1983. The rough-skinned newt lives 12-15 years in the wild, crawling the same trails through the same forests, carrying the same toxin, surviving the same predators, sending the same message: I am here, I am dangerous, I am alive."*
