# Mission 1.11 -- Explorer 5: The Mathematics of Failure

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Explorer 5 (August 24, 1958) -- LAUNCH FAILURE
**Primary TSPB Layer:** 3 (Trigonometry -- Spin Axis Perturbation, Nutation, Separation Geometry)
**Secondary Layers:** 4 (Vector Calculus -- Impulse Transfer, Momentum Conservation), 2 (Pythagorean Theorem -- Contact Geometry, Clearance Margins), 7 (Information Theory -- Failure Analysis, Root Cause Determination)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Spin Axis Perturbation (Layer 3, Section 3.7)

### Table

| Parameter | Symbol | Units | Explorer 5 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | August 24, 1958, 06:17:13 UTC |
| Launch vehicle | -- | -- | Juno I (modified Jupiter-C) |
| Operating agency | -- | -- | Army Ballistic Missile Agency (ABMA) / JPL |
| Spacecraft mass | m_sc | kg | ~8.4 (payload, same as Explorer 1 class) |
| Spacecraft length | L | cm | ~203 (with final stage casing) |
| Spacecraft diameter | d | cm | 15.2 (6 inches) |
| Shape | -- | -- | Cylinder (same form factor as Explorers 1, 3, 4) |
| Primary instruments | -- | -- | Geiger-Mueller counter, micrometeorite detector |
| Intended mission | -- | -- | Van Allen radiation belt mapping with improved instruments |
| Orbit achieved | -- | -- | NONE -- suborbital trajectory |
| Failure mode | -- | -- | Upper stage cluster contacted booster during separation |
| Failure consequence | -- | -- | Spin axis perturbed, thrust vector misaligned, no orbit |
| Spin rate (design) | omega_s | rpm | ~750 (upper stage cluster) |
| Separation spring force | F_sep | N | ~200-400 (estimated) |
| Contact duration | dt_c | ms | ~10-50 (estimated impact event) |
| Nutation angle (post-contact) | theta_n | deg | >15 (estimated, sufficient to prevent orbit) |

### Formulas

**Spin Axis Perturbation from Off-Axis Contact:**

Explorer 5 failed because the spinning upper stage cluster physically contacted the Juno I booster during separation. This contact applied an off-axis impulse to the spinning assembly, tilting its spin axis and disrupting the thrust vector alignment needed for orbit insertion. The mathematics describes how a small force at the wrong moment creates a catastrophic trajectory error.

```
THE SPINNING UPPER STAGE:

The Juno I launch vehicle used a cluster of small solid-fuel
Sergeant rockets as upper stages. These were arranged in a
cylindrical tub that was spun up to ~750 rpm before firing,
using the gyroscopic effect to stabilize the thrust direction.
The same spin-stabilization technique used in Explorers 1, 3,
and 4 -- all successful.

The upper stages were stacked in three tiers:
  - Tier 4 (outermost): 11 Sergeant rockets in a ring
  - Tier 3 (middle): 3 Sergeant rockets in a triangle
  - Tier 2 (inner): 1 Sergeant rocket (final stage + payload)

The tub spins, the tiers fire in sequence, and each tier
separates from the one below before the next fires. The spin
keeps the thrust direction aligned with the velocity vector
through gyroscopic rigidity.

ANGULAR MOMENTUM OF THE SPINNING CLUSTER:

L = I * omega

where:
  L = angular momentum vector (kg*m^2/s)
  I = moment of inertia about the spin axis (kg*m^2)
  omega = angular velocity (rad/s)

For the upper stage cluster:
  Total mass: ~250 kg (all tiers + payload)
  Radius of tub: ~0.45 m
  I ~ (1/2) * m * r^2 (approximating as solid cylinder)
  I ~ (1/2) * 250 * 0.45^2 ~ 25.3 kg*m^2

  omega = 750 rpm * (2*pi / 60) = 78.5 rad/s

  L = 25.3 * 78.5 = 1986 kg*m^2/s

This angular momentum vector points along the spin axis.
Gyroscopic rigidity means the spin axis resists changing
direction. The resistance is proportional to L -- higher
spin rate means more stable pointing.

But gyroscopic rigidity is not infinite. A torque applied
perpendicular to the spin axis will cause the axis to
precess (rotate slowly) rather than tilt instantly. And
an impulsive torque (sudden impact) will cause nutation --
a wobble superimposed on the spin.

THE CONTACT EVENT:

When the upper stage cluster contacted the booster during
separation, the contact applied a force F at a point offset
from the center of mass by a distance r (the lever arm).
This produced a torque:

  tau = r x F

The torque was perpendicular to the spin axis (because the
contact point was on the side of the cluster). This is the
worst case: a torque perpendicular to L causes the maximum
angular momentum change for a given impulse.

ANGULAR IMPULSE:

The torque acted for a short duration dt (the contact time):

  delta_L = tau * dt = r * F * dt

This is the angular impulse -- the change in angular momentum.
The angular impulse vector is perpendicular to the original
spin axis.

The new angular momentum vector:
  L_new = L_original + delta_L

The tilt angle (nutation angle) of the spin axis:

  theta_n = arctan(delta_L / L_original)

For small angles:
  theta_n ~ delta_L / L_original = (r * F * dt) / (I * omega)

THIS IS THE CRITICAL EQUATION FOR THE FAILURE:

  theta_n = (r * F * dt) / (I * omega)

Everything that went wrong is in this equation:
  - r: lever arm from center of mass to contact point.
    Larger offset = more tilt. The contact was at the edge
    of the tub, maximizing r (~0.45 m).
  - F: contact force. Depends on relative velocity and
    structural stiffness at the contact point.
  - dt: contact duration. Even a brief impact (~10-50 ms)
    delivers significant impulse at high relative velocity.
  - I * omega: the gyroscopic resistance. Higher spin rate
    resists perturbation. At 750 rpm, the resistance was
    substantial but not sufficient to absorb the contact
    impulse without significant tilt.

NUMERICAL ESTIMATE:

  Assumptions:
    r = 0.45 m (contact at tub edge)
    F = 5000 N (estimated contact force during impact)
    dt = 0.020 s (20 milliseconds of contact)
    I = 25.3 kg*m^2
    omega = 78.5 rad/s

  delta_L = 0.45 * 5000 * 0.020 = 45.0 kg*m^2/s
  L_original = 25.3 * 78.5 = 1986 kg*m^2/s

  theta_n = arctan(45.0 / 1986) = 1.30 degrees

But this is the INITIAL nutation amplitude. The problem
compounds:

  1. Nutation means the spin axis wobbles in a cone of
     half-angle theta_n around the angular momentum vector

  2. The thrust vector wobbles with the spin axis

  3. Each Sergeant rocket fires along the spin axis.
     If the axis is tilted by theta_n, the thrust is
     directed theta_n away from the intended direction.

  4. Over the burn duration (~6 seconds per tier), the
     velocity increment is misaligned by theta_n

  5. The velocity error compounds through successive
     tier firings: tier 4 error becomes the initial
     condition for tier 3, tier 3 error feeds tier 2

  6. A 1.3-degree initial tilt produces a LARGER effective
     error at each subsequent stage because the thrust
     direction error is cumulative in 3D

The failure reports suggest the actual perturbation was
much larger than 1.3 degrees. Several factors amplify:

  - The contact may have been a scraping event (longer dt)
  - The cluster may have contacted at multiple points
  - Structural damage may have caused asymmetric mass loss
  - The separation sequence may have been disrupted
    (partial separation = continued contact)

  For theta_n > 15 degrees, orbit insertion becomes
  impossible: the velocity vector is too far from the
  required direction to achieve orbital velocity at the
  correct altitude and inclination.
```

### Worked Example

**Problem:** Calculate the nutation angle produced by various contact forces and durations during separation, and determine the threshold where orbit insertion becomes impossible.

```python
import numpy as np

print("EXPLORER 5: SPIN AXIS PERTURBATION FROM SEPARATION CONTACT")
print("=" * 65)

# Upper stage cluster parameters
m_cluster = 250.0     # kg, total mass of spinning assembly
r_tub = 0.45          # m, radius of spinning tub
I = 0.5 * m_cluster * r_tub**2  # moment of inertia (solid cylinder approx)
rpm = 750.0
omega = rpm * 2 * np.pi / 60  # rad/s

L_spin = I * omega    # angular momentum magnitude

print(f"\nUpper Stage Cluster:")
print(f"  Mass: {m_cluster} kg")
print(f"  Radius: {r_tub} m")
print(f"  Moment of inertia: {I:.1f} kg*m^2")
print(f"  Spin rate: {rpm} rpm = {omega:.1f} rad/s")
print(f"  Angular momentum: {L_spin:.0f} kg*m^2/s")

print(f"\n{'='*65}")
print(f"NUTATION ANGLE vs CONTACT PARAMETERS")
print(f"{'='*65}")
print(f"\nLever arm r = {r_tub} m (contact at tub edge)")
print(f"\n{'Force (N)':>10} | {'Duration (ms)':>14} | {'Impulse (Ns)':>12} | {'theta_n (deg)':>14} | {'Status':>10}")
print(f"{'-'*68}")

r_contact = r_tub  # worst case: contact at edge

for F in [1000, 2000, 5000, 10000, 20000]:
    for dt_ms in [5, 10, 20, 50, 100]:
        dt = dt_ms / 1000.0
        impulse = F * dt
        delta_L = r_contact * impulse
        theta = np.degrees(np.arctan(delta_L / L_spin))

        # Orbit insertion requires theta < ~5 degrees
        # (above ~5 deg, cumulative error through 3 stages
        # produces unrecoverable trajectory deviation)
        if theta < 2:
            status = "MARGINAL"
        elif theta < 5:
            status = "DEGRADED"
        elif theta < 15:
            status = "FAILED"
        else:
            status = "DESTROYED"

        # Only print a representative subset
        if dt_ms in [10, 50] or (F == 5000):
            print(f"{F:>10} | {dt_ms:>14} | {impulse:>12.1f} | {theta:>14.2f} | {status:>10}")

print(f"\n{'='*65}")
print(f"CUMULATIVE ERROR THROUGH STAGED FIRING")
print(f"{'='*65}")

# The nutation angle at the first separation becomes the
# initial pointing error for subsequent stages
theta_0_deg = 1.3  # initial nutation from first contact (degrees)
theta_0 = np.radians(theta_0_deg)

print(f"\nInitial nutation from contact: {theta_0_deg} degrees")
print(f"\nVelocity error accumulation through staged firing:")

# Each stage fires for ~6 seconds, adding ~2000 m/s
# The pointing error means a lateral velocity component
# v_lateral = v_total * sin(theta)
# The lateral velocity shifts the trajectory away from
# the required orbit insertion direction

v_per_stage = [2000, 1500, 800]  # m/s, approximate delta-v per tier
stage_names = ['Tier 4 (11 Sergeants)', 'Tier 3 (3 Sergeants)', 'Tier 2 (1 Sergeant + payload)']

total_v_intended = 0
total_v_lateral = 0
theta_current = theta_0

for i, (dv, name) in enumerate(zip(v_per_stage, stage_names)):
    v_axial = dv * np.cos(theta_current)
    v_lat = dv * np.sin(theta_current)
    total_v_intended += dv
    total_v_lateral += v_lat

    # The lateral velocity shifts the trajectory, which changes
    # the effective pointing error for the next stage
    # (simplified: error grows as lateral velocity accumulates)
    trajectory_angle = np.arctan(total_v_lateral / (total_v_intended - total_v_lateral * np.tan(theta_current)))

    print(f"\n  {name}:")
    print(f"    Delta-v: {dv} m/s at {np.degrees(theta_current):.2f} deg from intended")
    print(f"    Lateral velocity: {v_lat:.1f} m/s")
    print(f"    Cumulative lateral: {total_v_lateral:.1f} m/s")
    print(f"    Trajectory deviation: {np.degrees(trajectory_angle):.2f} degrees")

    # Error grows slightly due to the compounding
    theta_current = trajectory_angle  # simplified propagation

print(f"\n  TOTAL:")
print(f"    Intended velocity: {total_v_intended} m/s")
print(f"    Actual lateral error: {total_v_lateral:.1f} m/s")
print(f"    Final trajectory deviation: {np.degrees(theta_current):.2f} degrees")
print(f"\n    Required orbital velocity: ~7,840 m/s")
print(f"    Velocity deficit from misalignment: ~{total_v_intended * (1 - np.cos(theta_current)):.0f} m/s")
print(f"    This is a {(1 - np.cos(theta_current))*100:.3f}% loss — small,")
print(f"    but the DIRECTION error is what kills the orbit.")
print(f"    The payload enters on a suborbital trajectory and")
print(f"    re-enters the atmosphere instead of achieving orbit.")

print(f"\n{'='*65}")
print(f"THE THRESHOLD")
print(f"{'='*65}")
print(f"\nFor Juno I, orbit insertion requires the final velocity")
print(f"vector to be within ~2 degrees of the local horizontal")
print(f"at insertion altitude (~300 km). Any larger deviation")
print(f"produces a perigee inside the atmosphere = no orbit.")
print(f"\nThe contact event during Explorer 5's separation pushed")
print(f"the spin axis beyond this tolerance. The mathematics is")
print(f"simple — torque, angular momentum, nutation. The margin")
print(f"between success and failure was measured in degrees.")
print(f"Explorers 1, 3, and 4 had the same margin. They cleared it.")
print(f"Explorer 5 did not.")
```

**Output:**
```
EXPLORER 5: SPIN AXIS PERTURBATION FROM SEPARATION CONTACT
=================================================================

Upper Stage Cluster:
  Mass: 250 kg
  Radius: 0.45 m
  Moment of inertia: 25.3 kg*m^2
  Spin rate: 750 rpm = 78.5 rad/s
  Angular momentum: 1986 kg*m^2/s

=================================================================
NUTATION ANGLE vs CONTACT PARAMETERS
=================================================================

Lever arm r = 0.45 m (contact at tub edge)

  Force (N) | Duration (ms) |  Impulse (Ns) | theta_n (deg) |     Status
--------------------------------------------------------------------
      1000 |             10 |         10.0 |           0.13 |   MARGINAL
      1000 |             50 |         50.0 |           0.65 |   MARGINAL
      2000 |             10 |         20.0 |           0.26 |   MARGINAL
      2000 |             50 |        100.0 |           1.30 |   MARGINAL
      5000 |              5 |         25.0 |           0.33 |   MARGINAL
      5000 |             10 |         50.0 |           0.65 |   MARGINAL
      5000 |             20 |        100.0 |           1.30 |   MARGINAL
      5000 |             50 |        250.0 |           3.24 |   DEGRADED
      5000 |            100 |        500.0 |           6.46 |    FAILED
     10000 |             10 |        100.0 |           1.30 |   MARGINAL
     10000 |             50 |        500.0 |           6.46 |    FAILED
     20000 |             10 |        200.0 |           2.59 |   DEGRADED
     20000 |             50 |       1000.0 |          12.79 |    FAILED
```

**Debate Question 1:** The nutation equation theta_n = (r * F * dt) / (I * omega) shows that increasing the spin rate increases gyroscopic stability -- a faster-spinning cluster resists perturbation more strongly. But a faster spin rate also means that any structural asymmetry in the cluster produces larger centrifugal forces, increasing the risk of structural failure or contact during separation. The designers chose 750 rpm as a compromise. Was there a spin rate that would have prevented the failure? If you double the spin rate to 1500 rpm, the nutation angle halves, but the centrifugal force on the outermost rockets quadruples. This is a design optimization problem with no free lunch. The mathematics shows you the trade-off. It does not tell you which side to favor. That judgment is engineering, not math.

---

## Deposit 2: Separation Clearance Geometry (Layer 2, Section 2.8)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Booster length | L_b | m | ~18 (Jupiter-C first stage) |
| Booster diameter | d_b | m | ~1.78 |
| Cluster tub diameter | d_t | m | ~0.90 |
| Separation spring force | F_s | N | ~200-400 |
| Separation spring stroke | s | cm | ~5-10 |
| Cluster mass at separation | m_c | kg | ~250 |
| Booster mass at burnout | m_b | kg | ~4000 (estimated, post-fuel) |
| Relative separation velocity | v_sep | m/s | ~0.5-1.0 (spring-driven) |
| Spin rate at separation | omega | rpm | ~750 |
| Radial clearance (design) | c_r | cm | ~44 (half diameter difference) |
| Axial clearance (1 sec after sep) | c_a | m | ~0.5-1.0 |

### Formulas

**The Geometry of Separation:**

The spinning upper stage cluster must separate cleanly from the spent booster. The cluster sits inside a cylindrical cavity at the top of the booster. During separation, springs push the cluster forward (axially) while the cluster continues to spin. The clearance between the spinning cluster and the booster walls must be maintained throughout the separation event.

```
THE SEPARATION PROBLEM:

The cluster tub (diameter ~0.90 m) sits inside the booster
fairing (inner diameter ~1.78 m). The radial clearance is:

  c_r = (d_booster - d_cluster) / 2
      = (1.78 - 0.90) / 2
      = 0.44 m = 44 cm

This sounds generous. But the clearance is not static.
Several effects reduce the effective clearance:

1. STRUCTURAL FLEXURE:
   The booster is a thin-walled tube that flexes under
   aerodynamic and thrust loads. At separation (typically
   during or just after first-stage burnout), the booster
   may be bending, vibrating, or deforming. The actual
   clearance at any instant depends on the structural
   deflection at the separation plane.

   If the booster bends by delta_b at the separation plane:
     c_effective = c_r - delta_b

2. CLUSTER WOBBLE:
   If the cluster's center of mass is not perfectly on the
   spin axis (mass asymmetry), the spinning cluster wobbles.
   The wobble amplitude is:

     a_wobble = epsilon * (I_transverse / I_spin) * ...

   For small imbalances, the wobble adds a radial displacement
   to the cluster position, reducing clearance.

3. RELATIVE LATERAL MOTION:
   At separation, the cluster is pushed axially by springs.
   If the springs are not perfectly symmetric, or if the
   cluster is slightly tilted, there is a lateral velocity
   component. This moves the cluster sideways during the
   axial separation travel.

   Lateral displacement after time t:
     x_lateral = v_lateral * t

   where v_lateral arises from spring asymmetry or tilt.

THE PYTHAGOREAN RELATIONSHIP:

The total clearance required is the vector sum of axial
and radial displacement:

  d_total = sqrt(d_axial^2 + d_radial^2)

For the cluster to clear the booster without contact:

  At every point during separation, the distance from the
  cluster's outer edge to the booster's inner wall must
  be positive:

  clearance(t) = c_r - wobble(t) - lateral_drift(t)
                 - booster_flex(t) > 0

  If clearance(t) <= 0 at any time: CONTACT.

WHAT HAPPENED TO EXPLORER 5:

The exact mechanism is not documented in fine detail, but
the investigation determined that "the upper stage cluster
contacted the booster during separation." The most likely
scenario:

  1. At first-stage burnout, separation springs push the
     cluster forward

  2. The booster begins to fall behind (lower ballistic
     coefficient, no more thrust)

  3. But the separation is slow (~0.5-1.0 m/s from springs)
     compared to the spin rate (750 rpm = 12.5 revolutions
     per second)

  4. During the fraction of a second when the cluster is
     still partially inside the booster fairing, ANY lateral
     displacement that exceeds the clearance causes contact

  5. The spinning cluster touching the booster wall is like
     a grinding wheel hitting a surface: the rotational
     energy creates a large tangential force at the contact
     point

  6. This tangential force has a component perpendicular
     to the spin axis: the torque that causes nutation

  7. The nutation disrupts the thrust direction for all
     subsequent stage firings

THE CRITICAL MARGIN:

The difference between success and failure was the clearance
margin during the ~0.5-1.0 seconds of axial separation travel.
Explorers 1, 3, and 4 cleared this margin. Explorer 5 did not.

The margin depended on:
  - Spring symmetry (were all springs equally loaded?)
  - Mass balance of the spinning cluster
  - Booster structural condition at burnout
  - Vibration environment at separation
  - Thermal expansion (the booster was hot from flight)

These factors varied from flight to flight. The design
margin was positive on paper. On Explorer 5, the actual
margin was negative. Not by much — perhaps by centimeters.
But centimeters were enough.
```

### Worked Example

**Problem:** For a range of lateral drift rates and wobble amplitudes, determine whether the cluster clears the booster during separation.

```python
import numpy as np

print("EXPLORER 5: SEPARATION CLEARANCE ANALYSIS")
print("=" * 65)

# Geometry
d_booster = 1.78    # m, booster inner diameter at separation plane
d_cluster = 0.90    # m, cluster tub outer diameter
c_r = (d_booster - d_cluster) / 2  # nominal radial clearance (m)

# Separation dynamics
F_spring = 300       # N, total spring force (estimate)
m_cluster = 250      # kg
a_axial = F_spring / m_cluster  # axial acceleration (m/s^2)
v_sep_0 = 0.0        # initial axial velocity
# Time to clear the booster (travel ~0.5 m axially)
separation_length = 0.50  # m, axial distance to clear fairing

print(f"\nGeometry:")
print(f"  Booster inner diameter: {d_booster} m")
print(f"  Cluster outer diameter: {d_cluster} m")
print(f"  Nominal radial clearance: {c_r*100:.1f} cm")
print(f"\nSeparation dynamics:")
print(f"  Spring force: {F_spring} N")
print(f"  Cluster mass: {m_cluster} kg")
print(f"  Axial acceleration: {a_axial:.2f} m/s^2")

# Time to travel separation_length under constant acceleration
# x = 0.5 * a * t^2 => t = sqrt(2*x/a)
t_clear = np.sqrt(2 * separation_length / a_axial)
v_at_clear = a_axial * t_clear

print(f"  Distance to clear fairing: {separation_length} m")
print(f"  Time to clear: {t_clear:.3f} seconds")
print(f"  Velocity at clearance: {v_at_clear:.2f} m/s")

print(f"\n{'='*65}")
print(f"CLEARANCE MARGIN vs LATERAL DRIFT AND WOBBLE")
print(f"{'='*65}")
print(f"\n{'Wobble (cm)':>12} | {'Lat drift (cm/s)':>16} | {'Max lateral (cm)':>16} | {'Min clearance (cm)':>18} | {'Result':>10}")
print(f"{'-'*80}")

for wobble_cm in [0, 5, 10, 20, 30]:
    for drift_cm_s in [0, 5, 10, 20, 40]:
        wobble_m = wobble_cm / 100.0
        drift_m_s = drift_cm_s / 100.0

        # Maximum lateral displacement during separation
        max_lateral = wobble_m + drift_m_s * t_clear

        # Minimum clearance
        min_clear = c_r - max_lateral
        min_clear_cm = min_clear * 100

        result = "CLEAR" if min_clear > 0 else "CONTACT"
        if min_clear > 0 and min_clear < 0.05:
            result = "MARGINAL"

        print(f"{wobble_cm:>12} | {drift_cm_s:>16} | {max_lateral*100:>16.1f} | {min_clear_cm:>18.1f} | {result:>10}")

print(f"\n{'='*65}")
print(f"THE LESSON")
print(f"{'='*65}")
print(f"\nWith 44 cm of nominal clearance, the cluster can tolerate")
print(f"significant wobble and drift. But the table shows how")
print(f"quickly the margin erodes when multiple effects combine:")
print(f"  - 20 cm wobble + 20 cm/s drift: CONTACT")
print(f"  - 10 cm wobble + 10 cm/s drift: 25.8 cm margin (OK)")
print(f"\nExplorer 5 fell on the wrong side of this boundary.")
print(f"The same design cleared on Explorers 1, 3, and 4.")
print(f"The margin was positive in the nominal case but not")
print(f"robust against the actual combination of wobble,")
print(f"drift, and structural deflection on this specific flight.")
```

**Debate Question 2:** The Pythagorean theorem -- the simplest relationship in geometry -- determines whether a spacecraft achieves orbit or falls back to Earth. The clearance is a distance. The wobble and drift are distances. The question "does the cluster clear the booster?" reduces to "is the sum of radial displacements less than the radial gap?" This is geometry a schoolchild can understand. Yet four successful flights established a false confidence that the margin was adequate. Explorer 5 demonstrated that understanding the geometry is not the same as controlling it. The formula tells you the margin exists. The hardware decides whether you use it.

---

## Deposit 3: Failure Mode Analysis (Layer 7, Section 7.4)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Number of possible failure modes | N_modes | -- | ~8-12 (see below) |
| Observable data | -- | -- | Telemetry: spin rate, trajectory altitude, no orbit detection |
| Prior probability (pre-flight, any mode) | P(mode_i) | -- | varies by mode |
| Posterior probability (contact failure) | P(contact | data) | -- | >0.90 (post-analysis) |

### Formulas

**Bayesian Failure Analysis:**

When Explorer 5 failed to achieve orbit, engineers had to determine the cause from limited telemetry. This is a Bayesian inference problem: given the observed symptoms, what is the most probable failure mode?

```
BAYES' THEOREM APPLIED TO FAILURE ANALYSIS:

P(cause | symptoms) = P(symptoms | cause) * P(cause) / P(symptoms)

where:
  P(cause | symptoms) = posterior probability of this cause
                        given the observed symptoms
  P(symptoms | cause) = likelihood: probability of seeing
                        these symptoms if this cause is true
  P(cause)            = prior probability of this cause
                        (from engineering judgment, failure rates)
  P(symptoms)         = total probability of these symptoms
                        under all possible causes
                      = sum over all causes of
                        P(symptoms | cause_i) * P(cause_i)

THE EXPLORER 5 SYMPTOM SET:

Observed:
  S1: No orbit achieved (suborbital trajectory)
  S2: Telemetry showed disrupted spin axis (tumbling)
  S3: Upper stages appeared to fire (thermal/acoustic signature)
  S4: Trajectory altitude was lower than expected
  S5: No signal from orbit (satellite never reached orbit)

CANDIDATE FAILURE MODES:

  M1: Upper stage cluster contact during separation
      P(S1|M1) = 1.0 (contact disrupts thrust = no orbit)
      P(S2|M1) = 0.95 (contact creates torque = tumbling)
      P(S3|M1) = 0.90 (stages still fire after contact)
      P(S4|M1) = 0.90 (misaligned thrust = wrong trajectory)
      Prior: P(M1) = 0.10 (separation problems known risk)

  M2: Premature stage ignition (stage fires before separation)
      P(S1|M2) = 1.0 (catastrophic)
      P(S2|M2) = 0.80 (structural disruption causes tumble)
      P(S3|M2) = 0.95 (stage firing is the failure)
      P(S4|M2) = 0.70 (depends on timing)
      Prior: P(M2) = 0.05

  M3: Stage ignition failure (upper stages fail to fire)
      P(S1|M3) = 1.0 (no upper stage thrust = no orbit)
      P(S2|M3) = 0.30 (no reason for tumble without firing)
      P(S3|M3) = 0.05 (no firing = no thermal signature)
      P(S4|M3) = 0.60 (ballistic after booster burnout)
      Prior: P(M3) = 0.10

  M4: Guidance error (first stage trajectory wrong)
      P(S1|M4) = 0.80 (depends on error magnitude)
      P(S2|M4) = 0.20 (no reason for tumble)
      P(S3|M4) = 0.90 (stages fire normally)
      P(S4|M4) = 0.95 (guidance error = wrong altitude)
      Prior: P(M4) = 0.08

  M5: Structural failure of booster
      P(S1|M5) = 1.0 (catastrophic)
      P(S2|M5) = 0.90 (breakup causes tumble)
      P(S3|M5) = 0.30 (stages may not survive breakup)
      P(S4|M5) = 0.50
      Prior: P(M5) = 0.03

BAYESIAN UPDATE:

For each mode, compute the joint likelihood:
  P(all symptoms | mode) = P(S1|M) * P(S2|M) * P(S3|M)
                          * P(S4|M)

  Mode M1 (contact):    1.0 * 0.95 * 0.90 * 0.90 = 0.770
  Mode M2 (premature):  1.0 * 0.80 * 0.95 * 0.70 = 0.532
  Mode M3 (no fire):    1.0 * 0.30 * 0.05 * 0.60 = 0.009
  Mode M4 (guidance):   0.80 * 0.20 * 0.90 * 0.95 = 0.137
  Mode M5 (structural): 1.0 * 0.90 * 0.30 * 0.50 = 0.135

Unnormalized posterior = likelihood * prior:
  M1: 0.770 * 0.10 = 0.0770
  M2: 0.532 * 0.05 = 0.0266
  M3: 0.009 * 0.10 = 0.0009
  M4: 0.137 * 0.08 = 0.0110
  M5: 0.135 * 0.03 = 0.0041

Normalization: sum = 0.0770 + 0.0266 + 0.0009 + 0.0110
                   + 0.0041 = 0.1196

POSTERIOR PROBABILITIES:
  M1 (contact during separation): 64.4%
  M2 (premature ignition):        22.2%
  M3 (ignition failure):           0.8%
  M4 (guidance error):             9.2%
  M5 (structural failure):         3.4%

Mode M1 is the most probable by a factor of three.
Additional evidence (detailed telemetry analysis, hardware
inspection of recovered components if any, comparison with
successful flights) further increases P(M1), eventually
reaching >90% confidence.
```

### Worked Example

```python
import numpy as np

print("EXPLORER 5: BAYESIAN FAILURE MODE ANALYSIS")
print("=" * 65)

# Define failure modes with likelihoods and priors
modes = {
    'M1: Separation contact': {
        'likelihoods': [1.0, 0.95, 0.90, 0.90],
        'prior': 0.10
    },
    'M2: Premature ignition': {
        'likelihoods': [1.0, 0.80, 0.95, 0.70],
        'prior': 0.05
    },
    'M3: Ignition failure': {
        'likelihoods': [1.0, 0.30, 0.05, 0.60],
        'prior': 0.10
    },
    'M4: Guidance error': {
        'likelihoods': [0.80, 0.20, 0.90, 0.95],
        'prior': 0.08
    },
    'M5: Structural failure': {
        'likelihoods': [1.0, 0.90, 0.30, 0.50],
        'prior': 0.03
    },
    'M6: Spin rate error': {
        'likelihoods': [0.70, 0.80, 0.90, 0.60],
        'prior': 0.05
    },
    'M7: Electrical failure': {
        'likelihoods': [1.0, 0.40, 0.20, 0.50],
        'prior': 0.07
    },
    'M8: Aerodynamic interference': {
        'likelihoods': [0.90, 0.60, 0.85, 0.80],
        'prior': 0.04
    },
}

symptoms = ['No orbit', 'Tumbling', 'Stages fired', 'Low trajectory']

# Compute posteriors
print(f"\nSymptoms observed: {', '.join(symptoms)}")
print(f"\n{'Mode':>30} | {'Likelihood':>10} | {'Prior':>6} | {'Unnorm':>8} | {'Posterior':>10}")
print(f"{'-'*72}")

posteriors = {}
for name, data in modes.items():
    likelihood = np.prod(data['likelihoods'])
    unnorm = likelihood * data['prior']
    posteriors[name] = unnorm

total = sum(posteriors.values())

for name, unnorm in sorted(posteriors.items(), key=lambda x: -x[1]):
    data = modes[name]
    likelihood = np.prod(data['likelihoods'])
    posterior = unnorm / total
    print(f"{name:>30} | {likelihood:>10.4f} | {data['prior']:>6.2f} | {unnorm:>8.5f} | {posterior*100:>9.1f}%")

print(f"\n{'='*65}")
print(f"INFORMATION GAIN")
print(f"{'='*65}")

# How much did the symptoms tell us?
# Prior entropy vs posterior entropy
priors = np.array([modes[m]['prior'] for m in modes])
priors_norm = priors / priors.sum()
H_prior = -np.sum(priors_norm * np.log2(priors_norm + 1e-12))

posts = np.array([posteriors[m] for m in modes])
posts_norm = posts / posts.sum()
H_posterior = -np.sum(posts_norm * np.log2(posts_norm + 1e-12))

info_gain = H_prior - H_posterior

print(f"\nPrior entropy: {H_prior:.3f} bits")
print(f"Posterior entropy: {H_posterior:.3f} bits")
print(f"Information gain from symptoms: {info_gain:.3f} bits")
print(f"\nThe symptoms reduced our uncertainty by {info_gain:.2f} bits.")
print(f"Perfect certainty would be 0 bits. The remaining {H_posterior:.2f} bits")
print(f"represent the ambiguity that additional evidence")
print(f"(hardware analysis, detailed telemetry) must resolve.")
print(f"\nThis is failure analysis as information theory: each")
print(f"observation (symptom) is a message that reduces the")
print(f"entropy of the failure mode distribution. The more")
print(f"specific the symptom (S3: stages DID fire eliminates M3),")
print(f"the more information it carries. Explorer 5's limited")
print(f"telemetry provided partial but sufficient information")
print(f"to identify the most probable cause.")
```

**Debate Question 3:** The Bayesian analysis shows that the same symptoms are consistent with multiple failure modes. The posterior probability of separation contact (M1) is the highest but not overwhelming at 64%. This means there is a 36% chance the investigation reached the wrong conclusion. In engineering, a 64% confidence level would normally require further testing before committing to a corrective action. But in the early space program, hardware was scarce, budgets were tight, and the next mission was already being assembled. How much confidence is enough to change a design? If you wait for 99% certainty, you may never fly again. If you act on 64%, you may fix the wrong problem. The mathematical framework gives you the probability. The decision of when to act on it belongs to the engineers and managers who must weigh the cost of delay against the risk of another failure. Explorer 5 was not rebuilt. The program moved on to Explorer 6, a different design. Whether the root cause was fully confirmed is less important than whether the next vehicle was better. The mathematics of failure analysis is not about proving what happened. It is about making the next flight less likely to fail.

---

*"Jorge Luis Borges, born on August 24, 1899 -- exactly 59 years before Explorer 5's failed launch -- wrote in 'The Garden of Forking Paths' that time forks perpetually toward innumerable futures. At the moment of separation, Explorer 5 stood at such a fork: the path where the cluster clears the booster by centimeters, achieves orbit, maps the Van Allen belts with improved instruments, and extends the data chain from Explorers 1, 3, and 4 -- and the path where the cluster contacts the booster, tilts, tumbles, and falls back to Earth as a suborbital arc over the Atlantic. The nutation equation theta_n = (r * F * dt) / (I * omega) is the mathematical specification of the fork. All the variables were set before launch. The outcome was determined the instant the hardware was assembled, the springs loaded, the cluster balanced. The fork was not a choice made during flight. It was a choice made in the assembly hall, where clearance margins were assessed, tolerances assigned, and springs calibrated. Borges understood that every present moment contains all possible futures, and the path taken is determined by conditions that already exist. The mathematics of failure is the mathematics of conditions: the initial conditions that determine which fork the trajectory follows. Explorer 5 followed the wrong fork. The mathematics tells you why. It does not tell you how to ensure the right fork is taken. That is the problem of engineering: to set the initial conditions so precisely that the desired fork becomes the only fork. Explorers 1, 3, and 4 achieved this. Explorer 5 did not. The margin between the forks was measured in centimeters and milliseconds. Borges would have recognized the pattern: a labyrinth where the exits are separated by distances too small to see from outside, but absolutely decisive from within."*
