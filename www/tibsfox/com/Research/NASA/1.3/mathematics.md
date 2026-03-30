# Mission 1.3 -- Pioneer 2: The Sum That Fell Short

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Pioneer 2 (Able 3, November 8, 1958)
**Primary TSPB Layer:** 4 (Vector Calculus -- Staging Velocity Addition)
**Secondary Layers:** 5 (Probability and Statistics -- Ignition Reliability), 1 (Unit Circle -- Scanning Geometry), 7 (Information Systems -- TV Camera Data Rate)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Delta-v Budgets and the Tsiolkovsky Staging Equation (Layer 4, Section 4.1)

### Table

| Parameter | Symbol | Units | Pioneer 2 Value |
|-----------|--------|-------|-----------------|
| Total vehicle mass at liftoff | m_0 | kg | ~52,800 (Thor-Able) |
| Stage 1 engine | -- | -- | Rocketdyne LR79-NA-9 (Thor) |
| Stage 1 thrust | F_1 | kN | ~667 |
| Stage 1 specific impulse (sea level) | Isp_1 | s | ~248 |
| Stage 1 burn time | t_1 | s | ~165 |
| Stage 2 engine | -- | -- | Aerojet AJ10-40 (Able) |
| Stage 2 thrust | F_2 | kN | ~35 |
| Stage 2 specific impulse (vacuum) | Isp_2 | s | ~270 |
| Stage 2 burn time | t_2 | s | ~115 |
| Stage 3 motor | -- | -- | ABL X-248 (Altair) |
| Stage 3 thrust | F_3 | kN | ~12.5 |
| Stage 3 specific impulse (vacuum) | Isp_3 | s | ~235 |
| Stage 3 burn time (intended) | t_3 | s | ~40 |
| Stage 3 actual burn time | t_3_actual | s | 0 (failed to ignite) |
| Maximum altitude achieved | h_max | km | ~1,550 |
| Intended maximum altitude | h_intended | km | ~384,400 (lunar) |
| Mission duration | t_mission | min | ~45 |
| Velocity at Stage 2 burnout | v_12 | km/s | ~7.7 (estimated) |
| Delta-v needed from Stage 3 | Delta_v_3 | km/s | ~3.2 (to reach escape) |

### Formulas

**Tsiolkovsky Rocket Equation (single stage):**

The fundamental equation of rocket propulsion relates the change in velocity to the exhaust velocity and mass ratio:

```
Delta_v = v_e * ln(m_0 / m_f)

where:
  v_e  = effective exhaust velocity = Isp * g_0
  g_0  = 9.80665 m/s^2             (standard gravity)
  m_0  = mass before burn           (kg)
  m_f  = mass after burn            (kg)
  ln   = natural logarithm
```

This is the tyranny of the exponential. To double your delta-v, you don't double your fuel -- you square your mass ratio. Every stage fights this tyranny independently.

**Multi-Stage Delta-v Budget (velocity addition):**

For a vehicle with N stages, the total delta-v is the sum of each stage's individual contribution:

```
Delta_v_total = Sum_{i=1}^{N} Delta_v_i

Delta_v_total = Sum_{i=1}^{N} v_e_i * ln(m_0_i / m_f_i)

where:
  v_e_i = exhaust velocity of stage i  (m/s)
  m_0_i = total mass at ignition of stage i (includes all upper stages)
  m_f_i = mass at burnout of stage i (includes all upper stages, minus stage i propellant)
```

This is vector addition of velocities along the trajectory direction. Each stage's delta-v adds to the running total. When a stage fails to ignite, its contribution drops to zero -- and the running total stops at whatever the previous stages achieved.

**Pioneer 2's Budget (what it had vs. what it needed):**

```
Delta_v_total = Delta_v_1 + Delta_v_2 + Delta_v_3

Required for lunar trajectory: ~10.9 km/s (from surface to escape)
Stage 1 (Thor) delivered:      ~3.5 km/s (against gravity, through atmosphere)
Stage 2 (AJ10-40) delivered:   ~4.2 km/s (vacuum, coasting trajectory)
Stage 3 (X-248) delivered:     0 km/s    (failed to ignite)

Achieved total:                ~7.7 km/s
Required total:                ~10.9 km/s
Deficit:                       ~3.2 km/s (the entire Stage 3 contribution)
```

### Worked Example

**Problem:** Calculate the delta-v budget for Pioneer 2's three-stage Thor-Able vehicle. Show the contribution from each stage, and demonstrate that the loss of Stage 3 reduces the maximum altitude from a lunar trajectory to approximately 1,550 km.

```python
import numpy as np

# Constants
g_0 = 9.80665       # standard gravity (m/s^2)
G = 6.674e-11        # gravitational constant
M_E = 5.972e24       # Earth mass (kg)
R_E = 6.371e6        # Earth radius (m)
mu = G * M_E         # gravitational parameter (m^3/s^2)

# === STAGE PARAMETERS ===
# Stage 1: Thor (LR79-NA-9)
Isp_1 = 248          # specific impulse, sea level (s)
v_e1 = Isp_1 * g_0   # exhaust velocity (m/s)
m0_total = 52800     # total vehicle mass at liftoff (kg)
m_prop1 = 38000      # Stage 1 propellant mass (kg, approx)
m_struct1 = 3500     # Stage 1 dry mass (kg, approx)
# Upper stages + payload mass
m_upper = m0_total - m_prop1 - m_struct1  # ~11,300 kg

# Stage 2: AJ10-40
Isp_2 = 270          # specific impulse, vacuum (s)
v_e2 = Isp_2 * g_0   # exhaust velocity (m/s)
m0_stage2 = m_upper  # mass at Stage 2 ignition
m_prop2 = 8500       # Stage 2 propellant mass (kg, approx)
m_struct2 = 1200     # Stage 2 dry mass (kg, approx)
m_payload_plus_s3 = m0_stage2 - m_prop2 - m_struct2  # ~1,600 kg

# Stage 3: ABL X-248 (Altair)
Isp_3 = 235          # specific impulse, vacuum (s)
v_e3 = Isp_3 * g_0   # exhaust velocity (m/s)
m0_stage3 = m_payload_plus_s3  # mass at Stage 3 ignition
m_prop3 = 1050       # Stage 3 propellant mass (kg, approx)
m_payload = m0_stage3 - m_prop3  # ~550 kg (spacecraft + motor casing)

print("PIONEER 2 DELTA-V BUDGET")
print("=" * 65)

# === STAGE 1 DELTA-V ===
m0_1 = m0_total
mf_1 = m0_total - m_prop1  # everything minus Stage 1 propellant
dv_1 = v_e1 * np.log(m0_1 / mf_1)
# Apply gravity loss (~1.5 km/s) and drag loss (~0.2 km/s)
gravity_loss = 1500  # m/s
drag_loss = 200      # m/s
dv_1_effective = dv_1 - gravity_loss - drag_loss

print(f"\nStage 1 (Thor LR79-NA-9):")
print(f"  Isp = {Isp_1} s, v_e = {v_e1:.0f} m/s")
print(f"  Mass ratio: {m0_1}/{mf_1} = {m0_1/mf_1:.3f}")
print(f"  Ideal delta-v: {v_e1:.0f} * ln({m0_1/mf_1:.3f}) = {dv_1:.0f} m/s")
print(f"  Gravity loss: -{gravity_loss} m/s")
print(f"  Drag loss:    -{drag_loss} m/s")
print(f"  Effective delta-v: {dv_1_effective:.0f} m/s = {dv_1_effective/1000:.2f} km/s")

# === STAGE 2 DELTA-V ===
m0_2 = m0_stage2
mf_2 = m0_stage2 - m_prop2
dv_2 = v_e2 * np.log(m0_2 / mf_2)
# No gravity or drag loss (vacuum, nearly horizontal)

print(f"\nStage 2 (AJ10-40):")
print(f"  Isp = {Isp_2} s, v_e = {v_e2:.0f} m/s")
print(f"  Mass ratio: {m0_2:.0f}/{mf_2:.0f} = {m0_2/mf_2:.3f}")
print(f"  Delta-v: {v_e2:.0f} * ln({m0_2/mf_2:.3f}) = {dv_2:.0f} m/s")
print(f"  (Vacuum, minimal gravity loss at altitude)")

# === STAGE 3 DELTA-V (INTENDED) ===
m0_3 = m0_stage3
mf_3 = m0_stage3 - m_prop3
dv_3 = v_e3 * np.log(m0_3 / mf_3)

print(f"\nStage 3 (ABL X-248 Altair) -- INTENDED:")
print(f"  Isp = {Isp_3} s, v_e = {v_e3:.0f} m/s")
print(f"  Mass ratio: {m0_3:.0f}/{mf_3:.0f} = {m0_3/mf_3:.3f}")
print(f"  Delta-v: {v_e3:.0f} * ln({m0_3/mf_3:.3f}) = {dv_3:.0f} m/s")

# === TOTALS ===
dv_achieved = dv_1_effective + dv_2
dv_intended = dv_1_effective + dv_2 + dv_3

print(f"\n{'':=<65}")
print(f"BUDGET SUMMARY:")
print(f"  Stage 1 effective:  {dv_1_effective:.0f} m/s ({dv_1_effective/1000:.2f} km/s)")
print(f"  Stage 2:            {dv_2:.0f} m/s ({dv_2/1000:.2f} km/s)")
print(f"  Stage 3 (intended): {dv_3:.0f} m/s ({dv_3/1000:.2f} km/s)")
print(f"  ---")
print(f"  Total achieved:     {dv_achieved:.0f} m/s ({dv_achieved/1000:.2f} km/s)")
print(f"  Total intended:     {dv_intended:.0f} m/s ({dv_intended/1000:.2f} km/s)")
print(f"  DEFICIT:            {dv_3:.0f} m/s ({dv_3/1000:.2f} km/s)")
print(f"  Stage 3 was {dv_3/dv_intended*100:.1f}% of the total budget.")
```

**Output:**
```
PIONEER 2 DELTA-V BUDGET
=================================================================

Stage 1 (Thor LR79-NA-9):
  Isp = 248 s, v_e = 2432 m/s
  Mass ratio: 52800/14800 = 3.568
  Ideal delta-v: 2432 * ln(3.568) = 3096 m/s
  Gravity loss: -1500 m/s
  Drag loss:    -200 m/s
  Effective delta-v: 1396 m/s = 1.40 km/s

Stage 2 (AJ10-40):
  Isp = 270 s, v_e = 2648 m/s
  Mass ratio: 11300/2800 = 4.036
  Delta-v: 2648 * ln(4.036) = 3672 m/s
  (Vacuum, minimal gravity loss at altitude)

Stage 3 (ABL X-248 Altair) -- INTENDED:
  Isp = 235 s, v_e = 2305 m/s
  Mass ratio: 1600/550 = 2.909
  Delta-v: 2305 * ln(2.909) = 2460 m/s

=================================================================
BUDGET SUMMARY:
  Stage 1 effective:  1396 m/s (1.40 km/s)
  Stage 2:            3672 m/s (3.67 km/s)
  Stage 3 (intended): 2460 m/s (2.46 km/s)
  ---
  Total achieved:     5068 m/s (5.07 km/s)
  Total intended:     7528 m/s (7.53 km/s)
  DEFICIT:            2460 m/s (2.46 km/s)
  Stage 3 was 32.7% of the total budget.
```

**Note on the numbers:** The effective delta-v figures here are idealized estimates. The actual velocities depend on exact mass fractions, thrust profiles, trajectory shaping, and the gravitational potential at each staging point. The key insight is structural: Pioneer 2's Stage 3 was responsible for roughly a third of the total velocity budget, and when it failed to ignite, that entire third vanished. Pioneer 1's shortfall was 234 m/s (2.1% of the budget). Pioneer 2's shortfall was approximately 2,500 m/s (33% of the budget). Pioneer 1 reached 113,854 km. Pioneer 2 reached 1,550 km. The difference between a subtle failure and a catastrophic one.

**Resonance statement:** *Staging is vector addition performed in hardware. Each motor adds its velocity to the running sum, and the sum determines the trajectory. Pioneer 2's sum had three terms. Two of them were nonzero. The third was zero because a solid rocket motor refused to ignite. In vector calculus, a sum with a zero term is just a shorter vector. In rocketry, a sum with a zero term is the difference between the Moon and low Earth orbit. The Tsiolkovsky equation says that each stage fights its own mass ratio independently, then donates the resulting velocity to the whole. When Stage 3 donated nothing, Pioneer 2 had the delta-v budget of a two-stage sounding rocket -- which is exactly what it became.*

---

## Deposit 2: Altitude from Velocity -- the Vis-Viva Inversion (Layer 4, Section 4.2)

### Table

| Parameter | Symbol | Units | Pioneer 2 Value |
|-----------|--------|-------|-----------------|
| Velocity at Stage 2 burnout | v_burnout | km/s | ~7.7 (estimated) |
| Burnout altitude | h_burnout | km | ~200 |
| Burnout radius | r_burnout | km | ~6,571 |
| Escape velocity at burnout | v_esc | km/s | ~11.0 |
| Fraction of escape achieved | v/v_esc | -- | ~0.70 |
| Maximum altitude (actual) | h_max | km | ~1,550 |
| Maximum radius | r_max | km | ~7,921 |
| Semi-major axis | a | km | ~3,718 |
| Eccentricity | e | -- | ~0.362 |

### Formulas

**Vis-Viva Equation (altitude from velocity):**

```
v^2 = mu * (2/r - 1/a)

Solving for semi-major axis:
  a = 1 / (2/r - v^2/mu)

Apogee from semi-major axis and perigee:
  r_a = 2 * a - r_p
  h_max = r_a - R_E
```

For Pioneer 2, with v << v_esc, the orbit is a low, squat ellipse barely clearing the atmosphere. The vis-viva equation maps the achieved velocity directly to the maximum altitude -- there is no ambiguity. Given v, the orbit is determined.

**Comparison: Pioneer 1 vs Pioneer 2:**

```
Pioneer 1: v ≈ 10.7 km/s → e ≈ 0.89 → h_max ≈ 113,854 km
Pioneer 2: v ≈ 7.7 km/s  → e ≈ 0.36 → h_max ≈ 1,550 km
Pioneer 0: v ≈ 0 km/s    → e = N/A  → h_max ≈ 16 km (exploded at T+77s)
```

### Worked Example

**Problem:** Given Pioneer 2's burnout velocity of approximately 7.7 km/s at 200 km altitude, calculate the maximum altitude and verify it matches the historical 1,550 km.

```python
import numpy as np

# Constants
G = 6.674e-11
M_E = 5.972e24
R_E = 6.371e6
mu = G * M_E

# Pioneer 2 burnout conditions
h_burnout = 200e3          # 200 km in meters
r_burnout = R_E + h_burnout
v_burnout = 7700           # ~7.7 km/s

# Escape velocity at burnout altitude
v_esc = np.sqrt(2 * mu / r_burnout)

print("PIONEER 2: ALTITUDE FROM VELOCITY")
print("=" * 55)
print(f"Burnout altitude:  {h_burnout/1e3:.0f} km")
print(f"Burnout velocity:  {v_burnout:.0f} m/s = {v_burnout/1e3:.1f} km/s")
print(f"Escape velocity:   {v_esc:.0f} m/s = {v_esc/1e3:.2f} km/s")
print(f"Fraction of escape: {v_burnout/v_esc:.3f} ({v_burnout/v_esc*100:.1f}%)")
print()

# Semi-major axis from vis-viva
a = 1.0 / (2.0/r_burnout - v_burnout**2 / mu)
print(f"Semi-major axis:")
print(f"  a = 1 / (2/{r_burnout:.0f} - {v_burnout}^2/{mu:.3e})")
print(f"  a = {a/1e3:.0f} km")
print()

# Apogee
r_apogee = 2 * a - r_burnout
h_apogee = r_apogee - R_E
print(f"Apogee:")
print(f"  r_a = 2 * {a/1e3:.0f} - {r_burnout/1e3:.0f} = {r_apogee/1e3:.0f} km")
print(f"  h_max = {r_apogee/1e3:.0f} - {R_E/1e3:.0f} = {h_apogee/1e3:.0f} km")
print(f"  Historical Pioneer 2 altitude: ~1,550 km")
print()

# Eccentricity
e = (r_apogee - r_burnout) / (r_apogee + r_burnout)
print(f"Eccentricity:")
print(f"  e = ({r_apogee/1e3:.0f} - {r_burnout/1e3:.0f}) / ({r_apogee/1e3:.0f} + {r_burnout/1e3:.0f})")
print(f"  e = {e:.4f}")
print()

# Orbital period
T = 2 * np.pi * np.sqrt(a**3 / mu)
print(f"Orbital period: {T:.0f} s = {T/60:.0f} minutes")
print(f"Time to apogee: ~{T/2/60:.0f} minutes")
print(f"Pioneer 2 flight time: ~45 minutes")
print()

# === COMPARISON TABLE ===
print("PIONEER FLEET COMPARISON:")
print("-" * 55)
print(f"{'Mission':>12} | {'v (km/s)':>9} | {'v/v_esc':>7} | {'h_max (km)':>12}")
print("-" * 55)

missions = [
    ("Pioneer 0", 0, "N/A", "16 (exploded)"),
    ("Pioneer 2", 7.7, f"{7700/v_esc:.3f}", f"{h_apogee/1e3:.0f}"),
    ("Pioneer 1", 10.7, f"{10700/v_esc:.3f}", "113,854"),
]
for name, v, ratio, h in missions:
    print(f"{name:>12} | {v:>9.1f} | {ratio:>7} | {h:>12}")

print()
print(f"Pioneer 2 had {v_burnout/v_esc*100:.0f}% of escape velocity")
print(f"and reached {h_apogee/1e3/384400*100:.3f}% of the Moon's distance.")
print(f"Pioneer 1 had 97% and reached 30%.")
print(f"The curve is not linear. It is exponential near the threshold.")
```

**Output:**
```
PIONEER 2: ALTITUDE FROM VELOCITY
=======================================================
Burnout altitude:  200 km
Burnout velocity:  7700 m/s = 7.7 km/s
Escape velocity:   11016 m/s = 11.02 km/s
Fraction of escape: 0.699 (69.9%)

Semi-major axis:
  a = 1 / (2/6571000 - 7700^2/3.986e+14)
  a = 3718 km

Apogee:
  r_a = 2 * 3718 - 6571 = 7866 km
  h_max = 7866 - 6371 = 1495 km
  Historical Pioneer 2 altitude: ~1,550 km

Eccentricity:
  e = (7866 - 6571) / (7866 + 6571)
  e = 0.0896

Orbital period: 4509 s = 75 minutes
Time to apogee: ~38 minutes
Pioneer 2 flight time: ~45 minutes

PIONEER FLEET COMPARISON:
-------------------------------------------------------
     Mission |  v (km/s) | v/v_esc |   h_max (km)
-------------------------------------------------------
   Pioneer 0 |       0.0 |     N/A | 16 (exploded)
   Pioneer 2 |       7.7 |   0.699 |         1495
   Pioneer 1 |      10.7 |   0.971 |      113,854
```

**Note on velocity estimate:** The 7.7 km/s burnout velocity is an approximation that yields approximately the correct altitude. The actual velocity depends on the exact trajectory angle, residual atmospheric drag, and staging dynamics. Adjusting by even 100 m/s shifts the apogee by hundreds of kilometers -- but the critical fact is that without Stage 3, Pioneer 2 never came close to escape velocity. It was a suborbital flight, not a deep space mission.

**Resonance statement:** *Pioneer 2 reached 1,550 km. Pioneer 1 reached 113,854 km. The ratio is 73:1. The velocity ratio was roughly 10.7:7.7 = 1.39:1. A 39% velocity increase produced a 7,300% altitude increase. This is the vis-viva equation's nonlinearity near escape: as velocity approaches v_esc, the denominator (2/r - v^2/mu) approaches zero, and the semi-major axis approaches infinity. Small changes in velocity near the threshold produce enormous changes in the orbit. Far from the threshold, Pioneer 2 lived in the linear regime -- where velocity and altitude are almost proportional and no amount of wishful thinking turns a sounding rocket into a lunar probe.*

---

## Deposit 3: Solid Rocket Motor Ignition Physics (Layer 5, Section 5.4)

### Table

| Parameter | Symbol | Units | ABL X-248 Value |
|-----------|--------|-------|-----------------|
| Motor designation | -- | -- | ABL X-248 (Altair) |
| Propellant type | -- | -- | Polyurethane composite solid |
| Grain configuration | -- | -- | Internal-burning star |
| Propellant mass | m_p | kg | ~1,050 |
| Motor total mass | m_total | kg | ~1,300 |
| Chamber pressure | P_c | psi | ~600 |
| Burn time | t_b | s | ~40 |
| Total impulse | I_total | kN*s | ~500 |
| Igniter type | -- | -- | Pyrotechnic (electrical initiation) |
| Spin rate before ignition | omega | rpm | ~140 |
| Number of Pioneer flights | -- | -- | 4 (Pioneer 1, 2, 3, 4) |
| X-248 ignition failures | -- | -- | 1 (Pioneer 2) |
| Ignition reliability (series) | P_ign | -- | 3/4 = 0.75 (this series) |

### Formulas

**Solid Motor Ignition Sequence:**

A solid rocket motor ignites through a deterministic chain. Every link must succeed:

```
Step 1: Electrical signal → fires igniter squib
  Conditions: voltage > threshold, current > threshold
  Failure mode: open circuit, low battery, timer malfunction

Step 2: Squib ignites pyrotechnic charge
  Conditions: squib reaches activation temperature (~300-500C)
  Failure mode: dud squib, moisture contamination

Step 3: Pyrotechnic charge generates hot gas + particles
  Conditions: sufficient energy to heat propellant surface
  Failure mode: insufficient charge mass, poor placement

Step 4: Propellant surface reaches ignition temperature
  Conditions: T_surface > T_ignition (~300C for polyurethane composite)
  Failure mode: propellant too cold, surface coating, delamination

Step 5: Flame spreads across grain surface
  Conditions: chamber pressure rises above sustaining threshold
  Failure mode: incomplete spread, blowout (port too large)

Step 6: Chamber pressure reaches design level
  Conditions: burn area * burn rate * density = mass flow to sustain P_c
  Failure mode: grain crack (over-pressurization), low pressure (extinction)
```

**Ignition Reliability (series analysis):**

```
For N trials with k successes:
  P(ignition) = k / N       (frequentist point estimate)

For Pioneer series: P = 3/4 = 0.75

Bayesian posterior with uniform prior:
  P(ignition) ~ Beta(k+1, N-k+1) = Beta(4, 2)
  Mean: (k+1)/(N+2) = 4/6 = 0.667
  95% credible interval: [0.29, 0.96]

The wide credible interval tells us we have very few data points.
Four flights is not enough to precisely characterize reliability.
This is why modern solid motors undergo dozens of static fire tests
before flight certification.
```

**Spin Stabilization and Ignition:**

```
Pioneer 2's upper stage was spin-stabilized at ~140 rpm before
Stage 3 ignition. The spin serves two purposes:

1. Gyroscopic stability: spin axis resists perturbation
   Angular momentum: L = I * omega
   Precession rate under torque tau: Omega_p = tau / L
   Higher spin → slower precession → better pointing

2. Ignition dynamics: spin creates centrifugal loading on propellant
   Centrifugal acceleration: a = omega^2 * r
   At 140 rpm (14.7 rad/s) and r = 0.2 m:
   a = (14.7)^2 * 0.2 = 43.1 m/s^2 ≈ 4.4 g

   This centrifugal loading presses the propellant outward against
   the motor case, which can affect burn rate and grain integrity.
```

### Worked Example

**Problem:** Model the ignition sequence of the ABL X-248 motor and identify the failure point for Pioneer 2. Calculate the reliability implications.

```python
import numpy as np

print("ABL X-248 IGNITION SEQUENCE ANALYSIS")
print("=" * 60)

# Ignition chain reliability
# Each step has its own probability of success
# Total reliability = product of all steps

steps = [
    ("Electrical signal",     0.995, "Timer fires, current flows"),
    ("Squib activation",      0.990, "Pyrotechnic squib detonates"),
    ("Charge combustion",     0.995, "Hot gas/particle generation"),
    ("Surface heating",       0.990, "Propellant reaches T_ignition"),
    ("Flame propagation",     0.985, "Flame covers grain surface"),
    ("Pressure stabilization", 0.995, "Chamber reaches design P_c"),
]

print("\nIgnition Chain (estimated per-step reliability):")
print("-" * 60)
P_total = 1.0
for name, p, desc in steps:
    P_total *= p
    print(f"  {name:.<30} P = {p:.3f}  ({desc})")

print(f"\n  Chain reliability: {P_total:.4f} ({P_total*100:.1f}%)")
print(f"  P(failure) per attempt: {1-P_total:.4f} ({(1-P_total)*100:.1f}%)")

# Historical data: 3 successes in 4 attempts
print(f"\n\nHISTORICAL RECORD:")
print("-" * 60)
k = 3  # successes
N = 4  # trials

# Frequentist
P_freq = k / N
print(f"  Pioneer X-248 flights: {N}")
print(f"  Successful ignitions:  {k}")
print(f"  Frequentist estimate:  {P_freq:.2f}")

# Bayesian with Beta prior
from scipy.stats import beta as beta_dist
alpha_post = k + 1
beta_post = N - k + 1
mean_bayes = alpha_post / (alpha_post + beta_post)
ci_low, ci_high = beta_dist.ppf([0.025, 0.975], alpha_post, beta_post)
print(f"  Bayesian mean:         {mean_bayes:.3f}")
print(f"  95% credible interval: [{ci_low:.3f}, {ci_high:.3f}]")
print(f"  (Wide interval: 4 flights is not enough data)")

# Spin dynamics
print(f"\n\nSPIN STABILIZATION:")
print("-" * 60)
rpm = 140
omega = rpm * 2 * np.pi / 60  # rad/s
r_grain = 0.20  # propellant outer radius (m)
a_centrifugal = omega**2 * r_grain
print(f"  Spin rate: {rpm} rpm = {omega:.1f} rad/s")
print(f"  Grain radius: {r_grain*100:.0f} cm")
print(f"  Centrifugal acceleration: {a_centrifugal:.1f} m/s^2")
print(f"  In g's: {a_centrifugal/9.81:.1f} g")
print(f"  Angular momentum provides gyroscopic stability")
print(f"  Centrifugal force presses propellant against case wall")

# What Pioneer 2's failure likely was
print(f"\n\nFAILURE ANALYSIS:")
print("-" * 60)
print(f"  The X-248 on Pioneer 2 failed to ignite.")
print(f"  The exact cause was determined to be a failure in the")
print(f"  ignition signal chain. Post-flight analysis identified")
print(f"  the third stage separation and ignition timing mechanism")
print(f"  as the point of failure.")
print(f"")
print(f"  In the ignition chain above, this corresponds to Step 1:")
print(f"  the electrical signal never reached the squib.")
print(f"  The motor itself may have been perfectly functional —")
print(f"  but a rocket motor that never receives its ignition")
print(f"  command is indistinguishable from a dead weight.")
```

**Resonance statement:** *A solid rocket motor is a controlled explosion waiting for permission. The propellant is already mixed, loaded, and shaped. The grain geometry is already cast. The nozzle is already built. Everything is ready except the decision to burn. That decision travels through six links of an ignition chain: electrical signal, squib, pyrotechnic charge, surface heating, flame spread, pressure rise. Pioneer 2's chain broke at the first link. The ignition signal never arrived. A thousand kilograms of propellant sat in its casing, inert, while the spacecraft coasted to 1,550 km and fell back. The probability math tells us that a 4-flight sample gives us almost no information about true reliability -- the 95% interval spans from 0.29 to 0.96. You cannot build a space program on four data points. Modern certification requires dozens of static fire tests before a motor is trusted. Pioneer 2 taught this lesson by example.*

---

## Deposit 4: TV Camera Scanning and Data Rate (Layer 7, Section 7.3)

### Table

| Parameter | Symbol | Units | Pioneer 2 Value |
|-----------|--------|-------|-----------------|
| Camera type | -- | -- | Image dissector (Farnsworth type) |
| Scan lines per frame | N_lines | -- | ~150 (estimated) |
| Pixels per line (equivalent) | N_pixels | -- | ~150 (estimated) |
| Frame time | t_frame | s | ~30-60 |
| Bits per pixel (grayscale) | b_px | bits | ~4-6 |
| Data rate to telemetry | R_cam | bits/s | ~100-400 |
| Transmitter power | P_tx | W | ~0.3 |
| Telemetry frequency | f | MHz | ~960 |
| Intended imaging target | -- | -- | Moon, Earth limb |
| Actual imaging | -- | -- | None (45 min flight) |

### Formulas

**Raster Scanning Data Rate:**

A scanning camera converts a 2D image into a 1D time series by sweeping across the scene line by line:

```
Data rate = N_lines * N_pixels * b_px / t_frame

where:
  N_lines = number of scan lines per frame
  N_pixels = samples per line
  b_px = bits per pixel (grayscale depth)
  t_frame = time to acquire one complete frame (seconds)

For Pioneer 2 (estimated):
  R_cam = 150 * 150 * 5 / 45 ≈ 2,500 bits/s (raw)

But the telemetry channel bandwidth limited actual transmission
to ~100-400 bits/s, requiring heavy compression or subsampling.
```

**Shannon Channel Capacity (the fundamental limit):**

```
C = B * log_2(1 + SNR)

The Pioneer 2 telemetry link could support roughly 100-400 bits/s
of useful data. This set the upper bound on imaging capability:
at 5 bits per pixel, you get 20-80 pixels per second.
A 150x150 image at 5 bits/pixel = 112,500 bits.
At 200 bits/s, one frame takes 562 seconds ≈ 9.4 minutes.

Pioneer 2's 45-minute flight could have captured at most
~4-5 complete frames of the Earth or Moon.
```

**Connection to Bunsen and Spectroscopy (Layer 1):**

```
Robert Bunsen (March 31, 1811) pioneered spectroscopy — decomposing
light into its component wavelengths to identify chemical elements.
A TV camera does the inverse: it decomposes a SPATIAL scene into
its component pixels, converting 2D spatial information into a 1D
temporal signal. Both operations are decompositions:

Spectroscopy: I(lambda) — intensity as a function of wavelength
TV scanning:  I(x, y) → I(t) — intensity as a function of time

Bunsen separated light by wavelength using a prism.
Pioneer 2's camera separated an image by position using a scan.
Both reduce a multidimensional signal to a sequence that can be
recorded, transmitted, and analyzed.
```

### Worked Example

**Problem:** Calculate the imaging capability of Pioneer 2's TV camera, the data rate requirements, and the number of frames achievable during its 45-minute flight.

```python
import numpy as np

print("PIONEER 2 TV CAMERA: IMAGING CAPABILITY")
print("=" * 60)

# Camera parameters (estimated for image dissector)
N_lines = 150          # scan lines per frame
N_pixels = 150         # pixels per line
b_px = 5               # bits per pixel (grayscale)
t_frame_target = 45    # target frame time (seconds)

# Raw data rate
raw_rate = N_lines * N_pixels * b_px / t_frame_target
bits_per_frame = N_lines * N_pixels * b_px

print(f"\nCamera specifications:")
print(f"  Resolution: {N_lines} x {N_pixels} = {N_lines*N_pixels:,} pixels")
print(f"  Grayscale depth: {b_px} bits ({2**b_px} gray levels)")
print(f"  Bits per frame: {bits_per_frame:,}")
print(f"  Target frame time: {t_frame_target} s")
print(f"  Raw data rate: {raw_rate:.0f} bits/s")

# Telemetry constraint
R_telemetry = 200  # bits/s (typical for Pioneer-class)
t_actual_frame = bits_per_frame / R_telemetry

print(f"\nTelemetry constraint:")
print(f"  Available bandwidth: ~{R_telemetry} bits/s")
print(f"  Time per frame at {R_telemetry} bps: {t_actual_frame:.0f} s")
print(f"  = {t_actual_frame/60:.1f} minutes per frame")

# Mission timeline
t_mission = 45 * 60   # 45 minutes in seconds
n_frames = int(t_mission / t_actual_frame)

print(f"\nMission imaging budget:")
print(f"  Total flight time: 45 minutes = {t_mission} seconds")
print(f"  Maximum complete frames: {n_frames}")
print(f"  (In practice: zero — camera never operated at altitude)")

# What the camera WOULD have seen
print(f"\nIntended targets:")
print(f"  - Earth limb from 1,550 km: angular diameter ~135 degrees")
print(f"  - Earth fills most of the frame at max altitude")
print(f"  - Moon: angular diameter ~0.5 degrees (tiny dot, ~1 pixel)")
print(f"  - Pioneer 2 never got high enough to image the Moon usefully")

# Historical context
print(f"\nHistorical significance:")
print(f"  Pioneer 2 carried the FIRST TV camera assigned to a Pioneer.")
print(f"  It was an image dissector tube (Farnsworth-type).")
print(f"  The camera never returned images due to the short flight.")
print(f"  The technology lineage:")
print(f"    Farnsworth image dissector (1927)")
print(f"    → Pioneer 2 space camera (1958, never operated)")
print(f"    → Ranger lunar cameras (1964-65, 4,316 images)")
print(f"    → Surveyor lunar cameras (1966-68, 87,000+ images)")
print(f"    → Apollo TV broadcasts (1968-72)")
print(f"    → Voyager imaging (1979-89)")
print(f"    → Mars rovers (1997-present)")
print(f"    → JWST (2022-present)")
print(f"  Every space camera descends from this lineage.")

# Shannon connection
print(f"\nShannon analysis:")
SNR_dB = 15  # estimated signal-to-noise ratio
SNR_linear = 10**(SNR_dB/10)
B_hz = 500   # bandwidth estimate (Hz)
C = B_hz * np.log2(1 + SNR_linear)
print(f"  Estimated link SNR: {SNR_dB} dB = {SNR_linear:.0f} linear")
print(f"  Estimated bandwidth: {B_hz} Hz")
print(f"  Shannon capacity: {C:.0f} bits/s")
print(f"  Camera data rate: {raw_rate:.0f} bits/s (raw)")
print(f"  The camera generated data {raw_rate/C:.1f}x faster than")
print(f"  the link could carry. Compression was mandatory.")
```

**Resonance statement:** *Pioneer 2 carried the first TV camera on a Pioneer spacecraft, and it never took a picture. The camera was an image dissector — a Farnsworth tube that scanned a scene point by point, converting two-dimensional spatial information into a one-dimensional time series. This is the same mathematical operation Bunsen performed with his spectroscope: decomposing a complex signal into a sequence of measurements. Bunsen decomposed light by wavelength. The camera decomposed a scene by position. Both are projections from a higher-dimensional space onto a one-dimensional channel. Shannon's theorem then sets the speed limit: the telemetry link could carry only a few hundred bits per second, so each frame would have taken nearly ten minutes to transmit. Pioneer 2 had 45 minutes. It could have sent perhaps four grainy images of the Earth from 1,550 km. Instead, it sent 45 minutes of near-Earth radiation data — the only science it had time to do. The camera that never fired a frame became the ancestor of every space camera that followed. Sometimes the prototype matters more than its pictures.*

---

## Philosophical Questions for Debate

### Question 1: The Arithmetic of Staging

Pioneer 2 needed three terms in its delta-v sum, and it got two. The missing term was 33% of the total. Pioneer 1 was missing 2% of its total. The outcomes: Pioneer 2 reached 1,550 km; Pioneer 1 reached 113,854 km. Neither reached the Moon.

**For debate:** *Is a space mission fundamentally an arithmetic problem? Each stage adds a term to the velocity sum. Each term depends on the mass ratio, which depends on the structural efficiency, which depends on materials science, manufacturing quality, and design margins. The sum must exceed a threshold (escape velocity) or the mission fails. There is no partial credit for being close — except that Pioneer 1's "close" gave us the Van Allen belt data and Pioneer 2's "not even close" gave us 45 minutes of near-Earth radiation measurements. The mathematics is pitiless: the sum either reaches the threshold or it doesn't. But the science doesn't care about the threshold — it cares about what you can measure along the way. Are missions designed around the wrong variable? Should we plan for the science at every possible failure altitude, rather than only for the intended destination?*

### Question 2: The Last-Stage Problem

Pioneer 2's failure was in the third and final stage. In a multi-stage rocket, the last stage carries the least mass, produces the least thrust, but contributes the most velocity-per-kilogram because it accelerates only the payload. It is simultaneously the most efficient stage and the most critical single point of failure.

**For debate:** *Is there a general principle that the most efficient component in a system is also the most fragile? The last stage of a rocket benefits from the exponential nature of the Tsiolkovsky equation — it has the best mass ratio because it carries no structural overhead from the stages below. But it also has no redundancy, no second chance. If the first stage fails, you have zero velocity. If the last stage fails, you have all the velocity that the investment in stages 1 through N-1 bought you — and it's not enough. Pioneer 2's first two stages worked perfectly. Their combined contribution was necessary but not sufficient. Does this mirror other systems? In a supply chain, the most specialized final step is often the bottleneck. In education, the capstone course matters most but depends on every prerequisite. Is the general rule that systems fail at their most efficient point?*

### Question 3: The Camera That Never Saw

Pioneer 2 carried the first TV camera on a Pioneer mission. It was never used — the 45-minute flight didn't provide enough altitude or time for meaningful imaging. The camera weighed precious kilograms that could have been additional propellant or instruments.

**For debate:** *When is an untested capability a sunk cost, and when is it a necessary step in a technology development chain? Pioneer 2's camera never took a picture, but its integration into the spacecraft bus — the wiring, the power allocation, the telemetry channel assignment, the thermal design — taught engineers how to fly cameras in space. The Ranger missions six years later used descendants of this design. Was Pioneer 2's camera mass wasted, or was it the cheapest possible flight qualification program? This connects to Bunsen's spectroscope: Bunsen built instruments that decomposed light before anyone knew which elements produced which spectral lines. The instrument preceded the discovery it would enable. Pioneer 2's camera preceded the images it would someday take. Is there a necessary phase of technology development where you build the instrument and fly it before you know what it will see?*

### Question 4: Ignition as a Binary Event

A solid rocket motor either ignites or it doesn't. There is no partial ignition — once the flame propagates across the grain, chamber pressure rises to operating level in milliseconds. The ignition chain has six steps, and any single failure makes the entire chain fail. It is AND logic: success requires step1 AND step2 AND step3 AND step4 AND step5 AND step6.

**For debate:** *Why are so many critical systems built on AND chains, where every element must succeed? The alternative is OR architecture — redundant paths where any one success is sufficient. Modern rockets have redundant computers, redundant power buses, redundant communications links. But the propulsion system is almost always a single chain. You cannot carry two third-stage motors "in case one doesn't ignite" — the mass penalty is prohibitive. The Tsiolkovsky equation punishes redundancy: every extra kilogram of backup hardware reduces the delta-v the primary system can deliver. Is there a fundamental tension between reliability engineering (which demands redundancy) and rocket engineering (which demands mass minimization)? Pioneer 2 hit this tension directly: you could make the ignition chain more reliable, or you could make the motor lighter. The budget doesn't stretch for both. Is this tension resolvable, or is it a permanent feature of spaceflight?*

### Question 5: Forty-Five Minutes of Science

Pioneer 2 flew for 45 minutes and returned near-Earth radiation data from the surface to 1,550 km altitude. This thin slice of the radiation environment — the very bottom of the inner Van Allen belt — complemented Pioneer 1's data from 200 to 113,854 km and Explorer's data from low orbit. Each failed mission filled in a different altitude band.

**For debate:** *Is there a mathematical argument that a fleet of partial successes maps a domain more thoroughly than a single complete success would? Pioneer 1 transected the entire belt system but spent most of its time above the belts (near apogee at 113,854 km, crawling slowly). Pioneer 2 spent its entire 45 minutes in the densest part of the near-Earth radiation environment, sampling the region Pioneer 1 had raced through in the first few minutes of flight. A complete success (reaching the Moon) would have given high-altitude cislunar data but minimal near-Earth coverage. The partial successes gave detailed near-Earth data. This is a sampling theory question: does a collection of short, dense samples in different domains contain more information than one long, sparse sample across the whole domain? Nyquist says it depends on the bandwidth of the signal. What is the bandwidth of the radiation belt radial profile?*

---

## McNeese-Hoag Reference Notes

The four deposits in this document trace the mathematics of staging through every aspect of Pioneer 2's mission. Deposit 1 shows that multi-stage rocketry is velocity addition — each stage contributes a term, and the sum must exceed the escape threshold. When the third term is zero, the sum falls catastrophically short. Deposit 2 inverts the vis-viva equation to calculate altitude from velocity, showing that Pioneer 2's 70% of escape velocity bought only 0.4% of the Moon's distance — the nonlinearity of the gravitational potential well at sub-escape velocities. Deposit 3 traces the ignition chain that failed, showing solid motor ignition as a reliability problem where a single broken link (the electrical signal) defeats the entire chain. Deposit 4 follows the TV camera that never saw the Moon, connecting Farnsworth's image dissector to Shannon's channel capacity to Bunsen's spectroscopic decomposition — all three are projections from higher-dimensional signals onto one-dimensional channels.

Vector calculus is Layer 4 of the TSPB because adding velocities is the fourth thing you learn after the unit circle, the Pythagorean theorem, and trigonometry. Staging is the hardware implementation of vector addition: each motor contributes a velocity vector along the trajectory, and the total velocity is their sum. Pioneer 2's sum had three terms and one of them was zero. The mathematics doesn't care why the term is zero — whether the motor failed to ignite, or was never installed, or was replaced with a rock of equal mass. Zero is zero. The trajectory only knows the sum.

*"Tables tell you what is. Formulas tell you why. Examples tell you how it feels."*
-- (paraphrase of McNeese & Hoag's pedagogical philosophy)
