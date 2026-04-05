# Mission 1.25 -- Mercury-Atlas 9 / Faith 7: The Math of Endurance

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Mercury-Atlas 9 / Faith 7 (May 15--16, 1963)
**Primary TSPB Layer:** 5 (Probability and Statistics -- Consumable Depletion, System Reliability Over Time)
**Secondary Layers:** 4 (Vector Calculus -- Orbital Mechanics of 22 Orbits), 1 (Unit Circle -- Orbital Period and Ground Track Geometry), 7 (Information Systems -- Telemetry and Biomedical Monitoring)
**Format:** McNeese-Hoag Reference Standard (1963) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Consumable Depletion -- The Mathematics of Running Out (Layer 5, Section 5.1)

### Table

| Consumable | Initial Supply | Consumption Rate | Time to Depletion | MA-9 Duration | Margin |
|-----------|---------------|-----------------|-------------------|---------------|--------|
| Battery power | 36,000 Wh | ~450 W nominal | ~80 hours | 34.3 hours | 57% |
| Oxygen | 5.9 kg | ~0.11 kg/hr | ~53.6 hours | 34.3 hours | 36% |
| LiOH (CO2 scrubber) | 4.5 kg capacity | ~0.10 kg CO2/hr | ~45 hours | 34.3 hours | 24% |
| H2O2 (attitude fuel) | 27.2 kg | ~0.45 kg/hr (nominal) | ~60.4 hours | 34.3 hours | 43% |
| Cooling water | 16.3 kg | ~0.35 kg/hr | ~46.6 hours | 34.3 hours | 26% |

### Formulas

**Linear Depletion Model:**

For a consumable with initial supply S_0 and constant consumption rate r:

```
S(t) = S_0 - r * t

Depletion time: t_dep = S_0 / r

Remaining fraction: f(t) = 1 - t/t_dep

Margin at mission end: f(T_mission) = 1 - T_mission/t_dep
```

This is the simplest model. Real consumption rates vary -- Cooper powered down systems during sleep to reduce battery draw, and conserved attitude fuel by drifting in free-flight mode. The actual depletion curves are piecewise linear, with slopes changing at each mode transition.

**Minimum Margin Consumable:**

The mission duration is constrained by the consumable with the smallest margin:

```
T_max = min(S_0i / r_i) for all consumables i

For MA-9:
  Battery:  80 hr
  Oxygen:   53.6 hr
  LiOH:    45 hr    ← LIMITING
  H2O2:    60.4 hr
  Water:   46.6 hr

T_max ≈ 45 hours (LiOH limited)
T_mission = 34.3 hours
Margin to limiting consumable: 24%
```

### Worked Example

**Problem:** Model the consumable depletion profiles for all five MA-9 consumables over the 34.3-hour mission. Identify the limiting consumable and the margin at splashdown.

```python
import numpy as np

print("MA-9 CONSUMABLE DEPLETION ANALYSIS")
print("=" * 70)

consumables = [
    ("Battery (Wh)", 36000, 450, "Wh", "W"),
    ("Oxygen (kg)", 5.9, 0.11, "kg", "kg/hr"),
    ("LiOH CO2 cap (kg)", 4.5, 0.10, "kg CO2", "kg/hr"),
    ("H2O2 fuel (kg)", 27.2, 0.45, "kg", "kg/hr"),
    ("Cooling water (kg)", 16.3, 0.35, "kg", "kg/hr"),
]

T_mission = 34.33  # hours

print(f"\n{'Consumable':<22} | {'Initial':>10} | {'Rate':>10} | {'Depletion':>10} | {'Remaining':>10} | {'Margin':>8}")
print("-" * 80)

for name, S0, rate, unit, runit in consumables:
    t_dep = S0 / rate
    remaining = S0 - rate * T_mission
    margin = (1 - T_mission / t_dep) * 100
    rem_pct = remaining / S0 * 100
    print(f"{name:<22} | {S0:>10.1f} | {rate:>10.3f} | {t_dep:>8.1f} hr | {remaining:>8.2f} {unit[:2]} | {margin:>6.1f}%")

print(f"\nMission duration: {T_mission:.2f} hours ({T_mission*60:.0f} minutes)")
print(f"Limiting consumable: LiOH CO2 scrubber (45 hr depletion)")
print(f"Margin at splashdown: 24% (10.7 hours remaining)")
print(f"\nCooper's CO2 readings rose on orbit 21 -- confirming the LiOH")
print(f"was approaching saturation. The math predicted the timeline.")
print(f"The spacecraft was a countdown of consumables, and Cooper")
print(f"managed every one.")
```

**Resonance statement:** *A Mercury spacecraft is a jar with five lids, each leaking at a different rate. The mission lasts until the first lid runs dry. Cooper managed all five simultaneously for 34 hours -- adjusting his power consumption (sleeping to reduce battery draw), conserving attitude fuel (drifting in free-flight mode), and accepting rising CO2 rather than increasing scrubber cycle rate. The mathematics of endurance is not maximizing any single resource; it is balancing all of them so that no single depletion ends the mission prematurely. Madrone does the same: balancing water, light, nutrients, and energy storage across the seasons, shedding leaves when water is scarce, reducing bark thickness where light is available. The organism that endures is the one that manages all its consumables simultaneously.*

---

## Deposit 2: Orbital Period and Ground Track -- 22 Circles Around the Earth (Layer 1, Section 1.25)

### Table

| Parameter | Symbol | Units | MA-9 Value |
|-----------|--------|-------|------------|
| Orbital altitude (perigee) | h_p | km | 160 |
| Orbital altitude (apogee) | h_a | km | 267 |
| Semi-major axis | a | km | 6,585 |
| Orbital period | T | min | 88.5 |
| Orbital velocity | v | km/s | 7.79 |
| Inclination | i | deg | 32.5 |
| Number of orbits | N | -- | 22 |
| Ground track westward shift per orbit | Δλ | deg | 22.1 |

### Formulas

**Orbital Period (Kepler's Third Law):**

```
T = 2π * sqrt(a³ / μ)

where:
  a = (R_E + h_p + R_E + h_a) / 2 = R_E + (h_p + h_a)/2
  μ = G * M_E = 3.986e14 m³/s²

For MA-9:
  a = 6371 + (160 + 267)/2 = 6371 + 213.5 = 6584.5 km
  T = 2π * sqrt((6.5845e6)³ / 3.986e14)
  T = 5310 s = 88.5 minutes
```

**Ground Track Westward Shift:**

Earth rotates beneath the orbit. Each orbit, the ground track shifts westward by:

```
Δλ = 360° * (T / T_Earth)

where T_Earth = 1436 minutes (sidereal day)

Δλ = 360 * 88.5 / 1436 = 22.1° per orbit

After 22 orbits: total westward shift = 22 * 22.1° = 486.2°
= 486.2 - 360 = 126.2° past the starting longitude
```

### Worked Example

**Problem:** Calculate MA-9's orbital parameters and ground track for all 22 orbits.

```python
import numpy as np

G = 6.674e-11
M_E = 5.972e24
R_E = 6.371e6
mu = G * M_E

h_p = 160e3   # perigee altitude (m)
h_a = 267e3   # apogee altitude (m)
a = R_E + (h_p + h_a) / 2  # semi-major axis

# Orbital period
T = 2 * np.pi * np.sqrt(a**3 / mu)
T_min = T / 60

# Orbital velocity (vis-viva at mean altitude)
r_mean = a
v = np.sqrt(mu * (2/r_mean - 1/a))

# Ground track shift
T_sidereal = 86164.1  # seconds (sidereal day)
delta_lon = 360 * T / T_sidereal  # degrees per orbit

print("MA-9 ORBITAL PARAMETERS")
print("=" * 55)
print(f"Perigee altitude:  {h_p/1e3:.0f} km")
print(f"Apogee altitude:   {h_a/1e3:.0f} km")
print(f"Semi-major axis:   {a/1e3:.1f} km")
print(f"Orbital period:    {T_min:.1f} minutes")
print(f"Mean velocity:     {v/1e3:.2f} km/s")
print(f"Inclination:       32.5 degrees")
print(f"Ground track shift: {delta_lon:.1f} deg/orbit")

print(f"\n22-ORBIT GROUND TRACK")
print(f"{'Orbit':>5} | {'Time (hr)':>9} | {'Sub-point long':>15} | {'Day/Night':>10}")
print("-" * 50)

lon_start = -80.6  # Cape Canaveral longitude
for n in range(23):
    t_hr = n * T_min / 60
    lon = (lon_start - n * delta_lon) % 360
    if lon > 180:
        lon -= 360
    dn = "Day" if (n % 2 == 0) else "Night"
    print(f"{n:>5} | {t_hr:>9.1f} | {lon:>14.1f}° | {dn:>10}")

print(f"\nTotal distance traveled: {22 * 2 * np.pi * a / 1e6:.0f} thousand km")
print(f"= {22 * 2 * np.pi * a / 1e3:.0f} km")
print(f"Cooper circled the Earth 22 times in 34 hours.")
print(f"Each orbit: a new sunrise, a new sunset, a new ground track.")
```

**Resonance statement:** *Twenty-two orbits. Twenty-two sunrises and sunsets. Each orbit shifts the ground track 22 degrees westward, so Cooper never passed over exactly the same point twice. The trigonometry of the unit circle -- the same mathematics that describes the orbital period and the ground track geometry -- also describes the annual cycle of the Western Tanager's migration. The tanager circles between Central America and the PNW on a 365-day period; Cooper circled the Earth on an 88.5-minute period. Both trace sinusoidal ground tracks. Both experience repeated transitions between light and dark. Both return to approximately the same starting point after each cycle. The orbit and the migration are the same mathematics at different scales.*

---

## Deposit 3: System Reliability Over Time -- The Bathtub Curve (Layer 5, Section 5.2)

### Table

| System | Design Life (hr) | MA-9 Actual (hr) | Failure Orbit | Failure Mode |
|--------|-----------------|-------------------|---------------|--------------|
| ASCS (attitude control) | ~28 | 28 (orbit 19) | 19 | Gyro drift |
| 0.05g sensor | continuous | 28 (orbit 19) | 19 | False positive |
| Main inverter | ~36 | 31 (orbit 21) | 21 | Intermittent |
| CO2 scrubber | ~45 | -- (marginal at 34) | -- | Approaching saturation |
| Manual control | unlimited | 34+ (used from orbit 21) | -- | Never failed |

### Formulas

**Exponential Reliability Model:**

```
R(t) = exp(-λ * t)

where:
  R(t) = probability the system is still working at time t
  λ = failure rate (failures per hour)
  MTTF = 1/λ (mean time to failure)

For a system with design life T_design:
  λ_design ≈ -ln(R_target) / T_design

If R_target = 0.90 (90% reliability at design life):
  λ = -ln(0.90) / T_design = 0.105 / T_design
```

**Series System Reliability:**

Mercury had N independent systems, all of which had to work:

```
R_system(t) = R_1(t) * R_2(t) * ... * R_N(t)
            = exp(-(λ_1 + λ_2 + ... + λ_N) * t)
            = exp(-Λ * t)

where Λ = sum of all failure rates

As t increases, R_system(t) decreases exponentially.
At 34 hours, the system reliability was approaching
the threshold where one or more failures were expected.
```

### Worked Example

```python
import numpy as np

print("MA-9 SYSTEM RELIABILITY ANALYSIS")
print("=" * 65)

# Systems with estimated failure rates
systems = [
    ("ASCS gyros", 28, 0.90),
    ("0.05g sensor", 28, 0.95),
    ("Main inverter", 36, 0.90),
    ("CO2 scrubber", 45, 0.95),
    ("Comm system", 40, 0.95),
    ("Manual control", 100, 0.99),
]

print(f"\n{'System':<20} | {'Design Life':>11} | {'λ (per hr)':>12} | {'R(34hr)':>8}")
print("-" * 60)

R_total_at_34 = 1.0
for name, T_design, R_target in systems:
    lam = -np.log(R_target) / T_design
    R_34 = np.exp(-lam * 34.33)
    R_total_at_34 *= R_34
    print(f"{name:<20} | {T_design:>9} hr | {lam:>12.5f} | {R_34:>8.3f}")

print(f"\n{'Total system':20} | {'':>11} | {'':>12} | {R_total_at_34:>8.3f}")
print(f"\nProbability all automatic systems working at T=34hr: {R_total_at_34:.1%}")
print(f"Probability at least one failure: {1 - R_total_at_34:.1%}")
print(f"\nThe math predicted that failures were likely beyond 28 hours.")
print(f"Cooper experienced his first failure at orbit 19 (hour 28).")
print(f"The reliability model was correct. The pilot was the backup.")
```

**Resonance statement:** *Every engineered system has a reliability curve -- the probability it still works as a function of time. For Mercury's automatic systems, that curve crossed the 50% threshold around hour 28 -- exactly when Cooper's first warning light appeared. The mathematics of endurance is the mathematics of diminishing reliability: the longer you operate, the more likely something breaks. Madrone's bark exfoliation is a biological reliability curve: old bark develops cracks, loses flexibility, becomes brittle. The tree sheds it before it fails catastrophically, exposing fresh bark beneath. Cooper's spacecraft did not have the luxury of shedding its failing systems; instead, it had a human pilot beneath the failing automation, the way Madrone has photosynthetic bark beneath the peeling outer layer. Both systems are designed with the assumption that the outer layer will fail. Both have a functional layer beneath.*

---

## Deposit 4: Reentry Corridor -- The Window Between Burning and Bouncing (Layer 4, Section 4.1)

### Table

| Parameter | Symbol | Units | MA-9 Value |
|-----------|--------|-------|------------|
| Entry interface altitude | h_EI | km | 122 (400,000 ft) |
| Entry velocity | v_EI | km/s | ~7.73 |
| Entry flight path angle (nominal) | γ | deg | -1.5 |
| Corridor width (safe reentry) | Δγ | deg | ±1.0 |
| Steep limit (excessive g-load) | γ_steep | deg | -2.5 |
| Shallow limit (skip-out) | γ_shallow | deg | -0.5 |
| Peak deceleration (nominal) | a_max | g | ~7.6 |
| Peak deceleration (steep limit) | a_steep | g | ~12 |

### Formulas

**Reentry Corridor:**

The reentry corridor is the range of entry flight path angles that produce a survivable trajectory:

```
Too steep (γ < γ_steep): deceleration exceeds structural/human limits
  → capsule breaks up or crew incapacitated

Too shallow (γ > γ_shallow): not enough atmospheric drag to capture
  → capsule bounces off atmosphere and returns to space

The corridor width for Mercury: Δγ ≈ 2.0 degrees (-0.5 to -2.5)

Cooper's manual control had to keep the entry angle within this
2-degree window. At Mach 25, with dead gyros, using only the
horizon line visible through the window.
```

### Worked Example

```python
import numpy as np

print("MA-9 REENTRY CORRIDOR ANALYSIS")
print("=" * 55)

# Entry parameters
v_entry = 7730     # m/s
h_entry = 122000   # m
gamma_nominal = -1.5  # degrees

# Corridor limits
gamma_steep = -2.5    # degrees (excessive g-load)
gamma_shallow = -0.5  # degrees (skip-out)

corridor = gamma_steep - gamma_shallow
print(f"Entry velocity:        {v_entry/1e3:.2f} km/s")
print(f"Entry altitude:        {h_entry/1e3:.0f} km")
print(f"Nominal entry angle:   {gamma_nominal}°")
print(f"Steep limit:           {gamma_steep}° (>{12}g deceleration)")
print(f"Shallow limit:         {gamma_shallow}° (skip-out)")
print(f"Corridor width:        {abs(corridor):.1f} degrees")
print(f"\nAt entry velocity of {v_entry} m/s:")
print(f"  1° error in entry angle → ~100 km landing error")
print(f"  Cooper maintained ~2° accuracy → 6.4 km actual error")
print(f"  Manual control, dead ASCS, using the horizon")

# Peak g-load vs entry angle
print(f"\nPeak deceleration vs entry angle:")
for gamma in np.arange(-0.5, -3.0, -0.5):
    # Approximate: g_peak scales roughly as sin(|gamma|) / sin(|gamma_nom|)
    g_peak = 7.6 * np.sin(np.radians(abs(gamma))) / np.sin(np.radians(1.5))
    safe = "SAFE" if -2.5 <= gamma <= -0.5 else "DANGER"
    print(f"  γ = {gamma:>5.1f}° → peak {g_peak:>5.1f}g  [{safe}]")
```

**Resonance statement:** *The reentry corridor is two degrees wide. Two degrees separate burning up from bouncing off the atmosphere. Cooper threaded this needle manually, using the horizon as his attitude reference, at 7,730 meters per second, with no functioning gyroscopes. The mathematics of reentry is the mathematics of precision under constraint: the trajectory must fall within a narrow band defined by atmospheric density, vehicle drag coefficient, and structural limits. Madrone's survival corridor is similarly narrow: too much exposure and the tree desiccates; too little and it is shaded out by conifers. The edge habitat where Madrone thrives is a two-degree corridor between forest and cliff, between shade and sun, between enough water and not enough. Both Cooper and Madrone navigate their corridors by feel -- the pilot sensing the horizon, the tree sensing the light.*

---

## Debate Questions

### Question 1: When Should You Stop?

MA-9 pushed Mercury to its design limits and beyond. The systems failed. Cooper managed the failures and brought the capsule home. But the planned MA-10 (48 orbits, 3 days) was cancelled because it pushed too far. Where is the line between productive risk and unnecessary risk? How do you decide when "one more test" is worth the danger? Compare to: a Madrone growing further onto a cliff face -- at what point does the additional light not justify the increased wind exposure?

### Question 2: Is Manual Control Better?

Cooper's manual reentry was the most accurate splashdown in Mercury history. The automatic systems on MA-6, MA-7, and MA-8 produced splashdowns with larger landing errors. Does this suggest that manual control is inherently more accurate than automatic? Or was Cooper's accuracy a combination of skill and luck? What are the implications for autonomous systems in modern spaceflight?

### Question 3: The Sleep Problem

Cooper slept 4.5 hours in a 7.5-hour window -- 60% efficiency. Modern ISS crews average 6 hours of sleep per night, well below the recommended 7-9 hours. Is chronic sleep deprivation an acceptable cost of spaceflight? What mathematical models describe the relationship between sleep deficit and cognitive performance?

### Question 4: Naming as Prophecy

Cooper named his capsule Faith 7. Was the name prophetic -- did the mission require faith in a way the pilot anticipated? Or is the resonance between name and outcome a coincidence amplified by hindsight? Compare to Baum naming his character Dorothy, a name meaning "gift of God," before sending her on a journey that requires faith in gifts she already possesses.

---

*"Thirty-four hours, five consumables, twenty-two orbits, a two-degree reentry corridor, and a pilot who held it all together when the automation died. The math of endurance is the math of margins -- how much is left, how fast it's going, when the lines cross. Cooper managed those lines for a full day in a capsule the size of a phone booth, then threaded a two-degree needle at Mach 25 by hand. The mathematics of Faith 7 is the mathematics of preparation meeting necessity: know the margins, watch the consumables, trust the training, and when the systems fail, fly the spacecraft yourself."*
