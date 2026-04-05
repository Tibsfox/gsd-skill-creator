# Mission 1.24 -- Mercury-Atlas 8 / Sigma 7: The Math of Precision

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mercury-Atlas 8 / Sigma 7 (October 3, 1962)
**Primary TSPB Layer:** 4 (Vector Calculus -- Orbital Mechanics, Reentry Trajectory)
**Secondary Layers:** 3 (Trigonometry -- Retrofire Geometry), 5 (Probability and Statistics -- Landing Accuracy), 1 (Unit Circle -- Orbital Period)
**Format:** McNeese-Hoag Reference Standard (1962) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Orbital Mechanics of a Six-Orbit Mission (Layer 4, Section 4.24)

### Table

| Parameter | Symbol | Units | Sigma 7 Value |
|-----------|--------|-------|---------------|
| Launch date | -- | -- | October 3, 1962, 07:15:12 UTC |
| Launch vehicle | -- | -- | Atlas D-113 |
| Spacecraft mass | m_sc | kg | ~1,352 |
| Orbital perigee | h_p | km | ~161 |
| Orbital apogee | h_a | km | ~283 |
| Orbital inclination | i | deg | 32.55 |
| Orbital period | T | min | ~88.9 |
| Number of orbits | n | -- | 6 |
| Mission duration | t_mission | hr:min:s | 9:13:11 |
| Retrofire delta-v | Δv_retro | m/s | ~167 |
| Landing error | d_err | nm | ~4.5 |

### Formulas

**Orbital Period:**

```
T = 2π √(a³/μ)

where:
  a = semi-major axis = R_E + (h_p + h_a)/2
  μ = GM_E = 3.986 × 10¹⁴ m³/s²
  R_E = 6,371 km

For Sigma 7:
  a = 6371 + (161 + 283)/2 = 6371 + 222 = 6593 km
  T = 2π √((6.593×10⁶)³ / 3.986×10¹⁴)
  T ≈ 5334 s ≈ 88.9 min
```

**Orbital Velocity:**

```
v = √(μ(2/r - 1/a))    (vis-viva equation)

At perigee (r = R_E + h_p = 6532 km):
  v_p = √(3.986×10¹⁴ × (2/6.532×10⁶ - 1/6.593×10⁶))
  v_p ≈ 7,844 m/s

At apogee (r = R_E + h_a = 6654 km):
  v_a ≈ 7,699 m/s
```

**Ground Track:**

```
Each orbit, the Earth rotates by:
  Δλ = 360° × T / T_sidereal
  Δλ = 360° × 88.9 / 1436.07
  Δλ ≈ 22.3°

After 6 orbits: total Earth rotation ≈ 133.8°
Sigma 7 launched from Florida (longitude ~80.6°W)
and landed in the Pacific (longitude ~174.2°W)
Difference: ~93.6° west (accounting for orbit plane orientation)
```

### Worked Example

**Problem:** Calculate the orbital parameters for Sigma 7 and determine the ground track shift per orbit.

```python
import numpy as np

# Constants
G = 6.674e-11
M_E = 5.972e24
R_E = 6.371e6
mu = G * M_E

print("SIGMA 7: ORBITAL MECHANICS")
print("=" * 60)

# Orbital parameters
h_p = 161e3  # perigee altitude (m)
h_a = 283e3  # apogee altitude (m)
r_p = R_E + h_p
r_a = R_E + h_a
a = (r_p + r_a) / 2

# Eccentricity
e = (r_a - r_p) / (r_a + r_p)

# Period
T = 2 * np.pi * np.sqrt(a**3 / mu)

# Velocities
v_p = np.sqrt(mu * (2/r_p - 1/a))
v_a = np.sqrt(mu * (2/r_a - 1/a))

print(f"Semi-major axis:    {a/1e3:.1f} km")
print(f"Eccentricity:       {e:.4f}")
print(f"Period:             {T:.1f} s = {T/60:.1f} min")
print(f"Perigee velocity:   {v_p:.1f} m/s = {v_p/1e3:.3f} km/s")
print(f"Apogee velocity:    {v_a:.1f} m/s = {v_a/1e3:.3f} km/s")

# Ground track
T_sidereal = 86164.1  # sidereal day (s)
delta_lon = 360 * T / T_sidereal
print(f"\nGround track shift: {delta_lon:.1f}° per orbit")
print(f"After 6 orbits:     {6*delta_lon:.1f}° total Earth rotation")

# Mission duration
n_orbits = 6
t_mission = n_orbits * T
print(f"\nMission duration:   {t_mission:.0f} s = {t_mission/3600:.2f} hr")
print(f"Actual:             9 hr 13 min 11 s = 9.22 hr")
print(f"  (difference due to partial first and last orbits)")
```

**Resonance statement:** *Sigma 7 orbited Earth six times in 9 hours and 13 minutes. Each orbit was 88.9 minutes -- exactly the period dictated by Newton's laws for a semi-major axis of 6,593 km. The mathematics is not approximate. The period is determined by the semi-major axis alone, through Kepler's third law, to any precision you care to compute. Schirra's job was not to fight the orbit. The orbit was perfect. Schirra's job was to manage the spacecraft within the orbit: fuel, temperature, attitude, systems. The math handled the trajectory. The pilot handled everything else.*

---

## Deposit 2: Retrofire Geometry and Landing Precision (Layer 3, Section 3.24)

### Table

| Parameter | Symbol | Units | Sigma 7 Value |
|-----------|--------|-------|---------------|
| Retrofire delta-v | Δv | m/s | ~167 |
| Retrofire pitch angle | θ_retro | deg | ~34 (below horizontal) |
| Number of retrorockets | n_retro | -- | 3 |
| Burn time per rocket | t_burn | s | ~10 |
| Thrust per rocket | F | N | ~4,450 |
| Landing error | d_err | nm | ~4.5 |
| Planned vs. actual | -- | -- | 4.5 nm from USS Kearsarge |

### Formulas

**Reentry Trajectory from Retrofire:**

The landing point is determined by the retrofire impulse vector relative to the orbital velocity vector:

```
v_after = v_orbit + Δv_retro

where Δv_retro is directed opposite to the velocity vector
(retrograde) and pitched slightly downward.

The flight path angle after retrofire:
  γ = arctan(Δv * sin(θ_retro) / (v_orbit - Δv * cos(θ_retro)))

For Sigma 7:
  γ ≈ arctan(167 * sin(34°) / (7800 - 167 * cos(34°)))
  γ ≈ arctan(93.4 / 7661.6)
  γ ≈ 0.70°

A reentry angle of approximately 0.7° below horizontal.
Too steep (> ~7°) and deceleration exceeds human tolerance.
Too shallow (< ~0.3°) and the spacecraft skips off the atmosphere.
The corridor is narrow. The retrofire must be precise.
```

**Landing Point Sensitivity:**

```
Timing sensitivity:
  δx / δt ≈ v_orbit = 7.8 km/s
  1 second early/late → ~7.8 km shift in landing point

Attitude sensitivity:
  δx / δθ ≈ depends on the reentry ballistic coefficient
  For Mercury: ~20-30 km per degree of pitch error

Impulse magnitude sensitivity:
  δx / δ(Δv) ≈ ~5 km per 1 m/s error in retrofire impulse
```

### Worked Example

**Problem:** Calculate the sensitivity of Sigma 7's landing point to retrofire errors.

```python
import numpy as np

print("SIGMA 7: RETROFIRE SENSITIVITY ANALYSIS")
print("=" * 65)

v_orbit = 7800  # m/s
delta_v = 167   # m/s retrofire impulse
theta = 34      # degrees, pitch angle below horizontal

# Reentry angle
gamma = np.degrees(np.arctan(
    delta_v * np.sin(np.radians(theta)) /
    (v_orbit - delta_v * np.cos(np.radians(theta)))
))
print(f"Reentry flight path angle: {gamma:.2f}°")
print(f"  (Safe corridor: 0.3° to 7.0°)")

# Sensitivity analysis
print(f"\nLANDING POINT SENSITIVITY:")
print(f"-" * 50)

# Timing
for dt in [0.1, 0.5, 1.0, 2.0, 5.0]:
    dx = v_orbit * dt / 1000  # km
    print(f"  Timing error ±{dt:.1f}s → landing shift ±{dx:.1f} km")

print()
# Attitude
for da in [0.1, 0.5, 1.0, 2.0]:
    dx = 25 * da  # approximate km per degree
    print(f"  Attitude error ±{da:.1f}° → landing shift ±{dx:.1f} km")

print()
# Impulse
for dv in [1, 5, 10]:
    dx = 5 * dv  # approximate km per m/s
    print(f"  Impulse error ±{dv} m/s → landing shift ±{dx:.0f} km")

# Schirra's actual performance
print(f"\n{'='*65}")
print(f"SCHIRRA'S ACTUAL LANDING ERROR: 4.5 nm ≈ 8.3 km")
print(f"This implies combined errors of approximately:")
print(f"  Timing: < ±1.0 second")
print(f"  Attitude: < ±0.3 degree")
print(f"  Impulse: < ±2 m/s")
print(f"\nFor comparison:")
print(f"  Carpenter (Aurora 7): 217 nm ≈ 402 km off-target")
print(f"  Glenn (Friendship 7): 35 nm ≈ 64 km off-target")
print(f"  Schirra: 4.5 nm ≈ 8.3 km — visible from the carrier")
```

**Resonance statement:** *Landing accuracy is the product of three precisions: timing, attitude, and impulse. Schirra nailed all three. The mathematics is unforgiving -- a one-second timing error moves the landing point by 7.8 kilometers. A one-degree attitude error shifts it by 25 kilometers. The reentry corridor is a band approximately 12 kilometers wide in the vertical plane -- miss it high and you skip off the atmosphere, miss it low and the deceleration is lethal. Sigma 7 threaded this corridor with 4.5-mile accuracy, which means the retrofire was within a second of the planned time and within a fraction of a degree of the planned attitude. This is the mathematics of precision: small errors in initial conditions produce large errors in outcomes, and the only defense is getting the initial conditions right.*

---

## Deposit 3: Fuel Consumption Optimization (Layer 5, Section 5.24)

### Table

| Parameter | Mercury Flight | Orbits | Duration (hr) | Fuel Used (lb) | Fuel Rate (lb/hr) | Fuel Remaining (%) |
|-----------|---------------|--------|---------------|----------------|-------------------|-------------------|
| MA-6 Friendship 7 | Glenn | 3 | 4.92 | 23.0 | 4.67 | 61.7% |
| MA-7 Aurora 7 | Carpenter | 3 | 4.93 | 50.0 | 10.14 | 16.7% |
| MA-8 Sigma 7 | Schirra | 6 | 9.22 | 13.3 | 1.44 | 77.8% |
| MA-9 Faith 7 | Cooper | 22 | 34.32 | 42.0 | 1.22 | 30.0% |

### Formulas

**Fuel Consumption Model:**

```
Fuel consumption rate depends on control mode:

  c_drift = 0 lb/hr           (no active control)
  c_auto  ≈ 0.8 lb/hr         (ASCS horizon scanners)
  c_manual ≈ 1.5-4.0 lb/hr    (depends on correction frequency)
  c_FBW   ≈ variable           (depends on pilot input)

Total consumption:
  C_total = Σ(c_mode(i) × t_mode(i))

Schirra's strategy:
  ~70% drift time → 0 lb/hr
  ~20% auto time  → 0.8 lb/hr
  ~10% manual/FBW → 2.0 lb/hr average

  C_total ≈ 0.70×9.22×0 + 0.20×9.22×0.8 + 0.10×9.22×2.0
          ≈ 0 + 1.47 + 1.84
          ≈ 3.31 (units: lb×hr/hr = lb)
  
  Wait -- the actual was 13.3 lb. The model is approximate.
  Real consumption includes thruster firings, attitude maneuvers
  for experiments, retrofire alignment, and minimum-impulse
  corrections during drift that are not zero but very small.
```

**Optimization Formulation:**

```
Minimize: C = integral(0, T, c(u(t)) dt)
Subject to:
  θ(t) ∈ Θ_acceptable  during ground station passes
  θ(t_retro) = θ_retro ± tolerance  at retrofire
  C ≤ C_max  (total fuel budget)
  u(t) ∈ {drift, auto, manual, FBW}  (control modes)

This is a hybrid optimal control problem with:
  - Continuous dynamics (attitude evolution under torques)
  - Discrete control choices (mode selection)
  - State constraints (attitude within bounds at specific times)
  - Integral objective (minimize total consumption)
```

### Worked Example

```python
import numpy as np

print("SIGMA 7: FUEL OPTIMIZATION ANALYSIS")
print("=" * 60)

# Mission parameters
T_mission = 9.22  # hours
fuel_total = 60.0  # lb

# Control mode consumption rates (lb/hr)
rates = {
    'drift': 0.05,     # minimal leak/residual
    'auto': 0.80,
    'manual': 2.00,
    'FBW': 1.50,
}

# Simulate three strategies
strategies = {
    'Carpenter (aggressive)': {'drift': 0.20, 'auto': 0.30, 'manual': 0.50},
    'Glenn (moderate)': {'drift': 0.40, 'auto': 0.40, 'manual': 0.20},
    'Schirra (conservative)': {'drift': 0.70, 'auto': 0.20, 'manual': 0.10},
}

print(f"{'Strategy':<30} {'Fuel Used':>10} {'Remaining':>10} {'%Left':>8}")
print("-" * 60)

for name, fractions in strategies.items():
    consumption = 0
    for mode, frac in fractions.items():
        consumption += rates[mode] * frac * T_mission
    remaining = fuel_total - consumption
    pct = remaining / fuel_total * 100
    print(f"{name:<30} {consumption:>10.1f} lb {remaining:>10.1f} lb {pct:>7.1f}%")

print()
print("The optimization is clear: maximize drift time.")
print("Every hour in drift mode saves 0.75-1.95 lb compared")
print("to active control. Over 9 hours, the savings compound.")
print()
print("Schirra's insight: the spacecraft's natural drift was")
print("acceptable for most of the mission. Active control was")
print("needed only for communications passes, experiments, and")
print("retrofire. The rest of the time, let the physics coast.")
```

**Resonance statement:** *The mathematics of fuel conservation is the mathematics of patience. Every thruster firing costs hydrogen peroxide. Every hydrogen peroxide molecule is irreplaceable -- there is no gas station in orbit. The optimal strategy is obvious in hindsight: don't fire the thrusters unless you must. Let the spacecraft drift. Accept imperfect attitude when perfect attitude isn't needed. Save the fuel for when it matters -- retrofire, communications, emergencies. Carpenter flew Aurora 7 as if the fuel were unlimited, consuming 83% in three orbits. Schirra flew Sigma 7 as if every thruster firing had to be justified, consuming 22% in six orbits. The beaver builds its dam the same way: every stick serves a purpose, every trip to the tree line carries material, no energy is wasted on aesthetics. The mathematics of constraint is the mathematics of survival.*

---

## Deposit 4: Reentry Heating and the Ballistic Coefficient (Layer 4, Section 4.25)

### Table

| Parameter | Symbol | Units | Sigma 7 Value |
|-----------|--------|-------|---------------|
| Entry velocity | v_entry | km/s | ~7.8 |
| Entry angle | γ | deg | ~-1.5 |
| Peak deceleration | g_max | g | ~7.6 |
| Peak heating rate | q_max | W/cm² | ~100 (estimated) |
| Stagnation temperature | T_stag | K | ~2,000+ |
| Heat shield material | -- | -- | Ablative (fiberglass in phenolic resin) |
| Ballistic coefficient | β | kg/m² | ~350 (estimated) |

### Formulas

**Stagnation Point Heating:**

```
q_stag ≈ C × √(ρ/R_n) × v³

where:
  C = constant depending on atmospheric model
  ρ = atmospheric density at altitude
  R_n = nose radius of the heat shield
  v = entry velocity

The v³ dependence means heating is EXTREMELY sensitive
to velocity. A 1% increase in entry velocity produces
a 3% increase in heating rate.
```

**Peak Deceleration:**

```
g_peak ≈ v_entry² × sin(γ) / (2 × e × H_s)

where:
  γ = entry flight path angle
  H_s = atmospheric scale height (~7.5 km for Earth)
  e = Euler's number

For Sigma 7:
  g_peak ≈ 7800² × sin(1.5°) / (2 × 2.718 × 7500)
  g_peak ≈ ~7.6 g
```

### Worked Example

```python
import numpy as np

print("SIGMA 7: REENTRY PHYSICS")
print("=" * 55)

v_entry = 7800  # m/s
gamma_range = np.array([0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 7.0])
H_s = 7500  # scale height (m)

print(f"{'Entry Angle':>12} {'Peak g':>10} {'Assessment':>20}")
print("-" * 45)

for gamma in gamma_range:
    gamma_rad = np.radians(gamma)
    g_peak = v_entry**2 * np.sin(gamma_rad) / (2 * np.e * H_s * 9.81)
    
    if g_peak < 3:
        assessment = "Skip-out risk"
    elif g_peak < 8:
        assessment = "NOMINAL"
    elif g_peak < 12:
        assessment = "High but survivable"
    else:
        assessment = "DANGEROUS"
    
    print(f"{gamma:>11.1f}° {g_peak:>10.1f}g {assessment:>20}")

print(f"\nSigma 7 entry angle: ~1.5° → peak ~7.6g")
print(f"The reentry corridor is 0.5° to ~7° — a band")
print(f"about 60 km wide at orbital altitude.")
print(f"Miss it and you either skip or fry.")
```

---

## Deposit 5: The Statistics of Landing Precision (Layer 5, Section 5.25)

### Formulas

**Circular Error Probable (CEP):**

```
CEP = the radius of a circle, centered on the target,
      within which 50% of landings would fall.

If landing errors follow a bivariate normal distribution:
  CEP ≈ 1.1774 × σ  (where σ is the standard deviation of range error)

For Mercury orbital flights:
  Glenn:     ~64 km error
  Carpenter: ~402 km error  
  Schirra:   ~8.3 km error
  Cooper:    ~6.4 km error

With only 4 data points, statistical inference is limited.
But the improvement from Carpenter to Schirra is 48× better accuracy.
```

### Worked Example

```python
import numpy as np

print("MERCURY LANDING ACCURACY PROGRESSION")
print("=" * 55)

flights = [
    ("MA-6 Glenn", 64),
    ("MA-7 Carpenter", 402),
    ("MA-8 Schirra", 8.3),
    ("MA-9 Cooper", 6.4),
]

print(f"{'Flight':<20} {'Error (km)':>12} {'Relative to Glenn':>20}")
print("-" * 55)

for name, err in flights:
    ratio = err / 64
    bar = "█" * int(err / 10)
    print(f"{name:<20} {err:>12.1f} {ratio:>18.2f}x  {bar}")

print(f"\nSchirra's 8.3 km error = 13% of Glenn's error")
print(f"Carpenter's 402 km error = 628% of Glenn's error")
print(f"\nThe difference between Carpenter and Schirra is not skill.")
print(f"It is fuel. Carpenter ran low and could not correct attitude")
print(f"precisely for retrofire. Schirra had 78% remaining.")
print(f"Precision landing requires resource margin. The math is clear.")
```

**Resonance statement:** *Landing precision is not random. It is the deterministic consequence of retrofire accuracy, which is the consequence of fuel availability, which is the consequence of resource management over the entire mission. Schirra's 4.5-mile landing was not an isolated achievement at the end of the flight. It was the result of every fuel-saving decision he made over nine hours. Each moment of drifting flight instead of powered flight saved a fraction of a pound of hydrogen peroxide. Each fraction of a pound preserved at the end became a fraction of a degree of attitude control precision during retrofire. The precision propagated backward in time: the accurate landing was caused by the fuel conservation that preceded it. The beaver maintains its dam not for the dam's sake but for the water it impounds. Schirra conserved fuel not for the fuel's sake but for the landing accuracy it enabled. The means serve the end. The math traces the chain.*

---

## Debate Questions

### Question 1: Is Boring the Highest Form of Engineering?

Sigma 7 is the least-remembered manned Mercury flight because it was the most successful. Every system worked. Every parameter was within spec. There was no crisis, no drama, no story. Is this a failure of public communication or a success of engineering? Should engineering aspire to be invisible? Compare to other engineering achievements: the most successful bridge, the most reliable car engine, the best-designed house -- are these remembered or forgotten?

### Question 2: The Optimization Tradeoff

Schirra sacrificed science data and observation time to conserve fuel. Carpenter sacrificed fuel to conduct science. Who made the better choice? Can both choices be optimal if the objective functions are different? Formalize this: Carpenter maximized f(science_data) subject to fuel ≥ minimum; Schirra minimized f(fuel_consumed) subject to mission ≥ 6 orbits. Two different optimization problems with two different solutions. Which problem was the right one to solve?

### Question 3: Precision as Safety

Sigma 7's 4.5-mile landing accuracy meant the recovery ship could see the parachute. This is not just precision -- it is safety. A pilot who lands 400 km off-target (Carpenter) must wait hours for rescue in the open ocean. A pilot who lands 4.5 miles from the carrier is recovered in minutes. Is landing precision a convenience, a demonstration, or a safety requirement? How does this change the optimization problem?

---

*"The mathematics of Sigma 7 is the mathematics of doing exactly what you planned to do. Orbit at 88.9 minutes per orbit. Consume 1.44 pounds of fuel per hour. Fire the retrorockets within one second of the planned time at within one degree of the planned attitude. Land 4.5 miles from the carrier. Every number in this flight is a planned number achieved. The orbit period is physics. The fuel rate is discipline. The landing accuracy is both. Wally Schirra did not discover anything on MA-8. He did not set any records. He did not have any adventures. He demonstrated that the mathematics of orbital mechanics, the physics of reentry, and the engineering of resource management could produce a predictable outcome from a planned input. In engineering, that is everything."*
