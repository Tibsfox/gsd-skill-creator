# Mission 1.33 -- Ranger 6: The Math of Hitting What You Aimed At

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Ranger 6 (January 30, 1964)
**Primary TSPB Layer:** 4 (Vector Calculus -- Lunar Intercept Trajectory, Impact Geometry)
**Secondary Layers:** 5 (Probability -- Paschen Breakdown Statistics), 7 (Information Theory -- Zero-Data Mission), 1 (Unit Circle -- Orbital Period Ratios)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Lunar Intercept Trajectory (Layer 4, Section 4.7)

### Table

| Parameter | Symbol | Units | Ranger 6 Value |
|-----------|--------|-------|----------------|
| Launch date | -- | -- | January 30, 1964, 15:49:00 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B |
| Operating agency | -- | -- | JPL / NASA |
| Spacecraft mass | m_sc | kg | 381.3 |
| Transit time | t_transit | hr | ~65.5 |
| Midcourse correction | delta_v_mc | m/s | small (~5-10) |
| Impact velocity | v_impact | km/s | ~9.39 |
| Impact coordinates | -- | -- | 9.39°N, 21.48°E (Mare Tranquillitatis) |
| Target miss distance | d_miss | km | ~32 |
| Camera activation time | t_cam | min | 13 (before impact) |
| Cameras operational | -- | -- | 0 of 6 |
| Images returned | -- | -- | 0 |

### Formulas

**Lunar Intercept Velocity:**

A spacecraft falling from "infinity" toward the Moon acquires velocity from the Moon's gravitational pull:

```
v_impact = sqrt(v_approach^2 + v_escape_moon^2)

where:
  v_approach = velocity of spacecraft relative to Moon at large distance
  v_escape_moon = lunar escape velocity at the surface
               = sqrt(2 * G * M_moon / R_moon)
               = sqrt(2 * 4.905e12 / 1.737e6)
               = sqrt(5.647e6)
               ≈ 2,376 m/s ≈ 2.38 km/s

For Ranger 6:
  v_approach ≈ 9.1 km/s (velocity relative to Moon)
  v_impact = sqrt(9100^2 + 2376^2)
           = sqrt(82.81e6 + 5.65e6)
           = sqrt(88.46e6)
           ≈ 9,406 m/s ≈ 9.41 km/s

This is consistent with the observed 9.39 km/s impact velocity.
```

**Targeting Accuracy (Angular Miss):**

```
angular_miss = arctan(d_miss / d_total)

where:
  d_miss = 32 km (miss distance at Moon)
  d_total = 384,400 km (Earth-Moon distance)

angular_miss = arctan(32 / 384400)
             = 0.00483 degrees
             = 17.4 arcseconds

Ranger 6 hit within 17 arcseconds of the aim point — 
angular accuracy comparable to resolving a coin at 250 meters.
```

### Worked Example

**Problem:** Calculate Ranger 6's impact velocity on the Moon and the targeting accuracy expressed as angular and fractional error.

```python
import numpy as np

# Constants
G = 6.674e-11           # gravitational constant
M_moon = 7.342e22       # Moon mass (kg)
R_moon = 1.737e6        # Moon radius (m)
mu_moon = G * M_moon    # lunar gravitational parameter

print("RANGER 6: LUNAR INTERCEPT ANALYSIS")
print("=" * 65)

# Lunar escape velocity
v_esc_moon = np.sqrt(2 * mu_moon / R_moon)
print(f"Lunar escape velocity: {v_esc_moon:.0f} m/s = {v_esc_moon/1e3:.2f} km/s")

# Approach velocity (from translunar trajectory)
v_approach = 9100  # m/s (relative to Moon)

# Impact velocity
v_impact = np.sqrt(v_approach**2 + v_esc_moon**2)
print(f"\nApproach velocity:  {v_approach:.0f} m/s = {v_approach/1e3:.1f} km/s")
print(f"Impact velocity:    {v_impact:.0f} m/s = {v_impact/1e3:.2f} km/s")
print(f"Gravitational boost: {v_impact - v_approach:.0f} m/s")

# Impact energy
m_sc = 381.3  # kg
KE = 0.5 * m_sc * v_impact**2
print(f"\nImpact kinetic energy: {KE:.3e} J")
print(f"  = {KE/4.184e9:.1f} tons TNT equivalent")

# Targeting accuracy
d_miss = 32e3       # 32 km miss distance
d_total = 384400e3  # Earth-Moon distance (m)

angular_miss_rad = np.arctan(d_miss / d_total)
angular_miss_deg = np.degrees(angular_miss_rad)
angular_miss_arcsec = angular_miss_deg * 3600

fractional_error = d_miss / d_total

print(f"\n{'='*65}")
print(f"TARGETING ACCURACY")
print(f"{'='*65}")
print(f"Miss distance:    {d_miss/1e3:.0f} km")
print(f"Total distance:   {d_total/1e3:,.0f} km")
print(f"Angular error:    {angular_miss_arcsec:.1f} arcseconds")
print(f"                  ({angular_miss_deg:.5f} degrees)")
print(f"Fractional error: {fractional_error:.2e}")
print(f"                  ({fractional_error*100:.4f}%)")
print(f"")
print(f"Analogy: hitting a {d_miss/1e3:.0f}-km circle from {d_total/1e3:,.0f} km")
print(f"  Like hitting a dinner plate from 3.6 km away")
print(f"  Like hitting a quarter from 300 meters")
print(f"  Like threading a needle from across a football field")
print(f"")
print(f"The most accurate Ranger trajectory ever flown.")
print(f"Zero photographs returned.")
print(f"Perfect aim. Blind eyes.")
```

**Resonance statement:** *Ranger 6 hit the Moon within 32 km of the aim point — a targeting error of 0.0083%, or 17.4 arcseconds. From Earth, the Moon subtends about 31 arcminutes (1,860 arcseconds). Ranger 6's miss distance was less than 1% of the Moon's apparent diameter. This was navigation of extraordinary precision, achieved with 1964 computers, 1964 tracking stations, and a 65-hour trajectory through the gravitational fields of Earth, Moon, and Sun. The trajectory was a solved problem. The cameras were the unsolved problem. In mathematics, a function can be perfectly evaluated at the correct input and still return no useful output if the function itself is undefined at that point. Ranger 6's trajectory function was smooth and well-behaved. The camera function was undefined — destroyed by a singularity at T+107 seconds.*

---

## Deposit 2: Paschen Breakdown — The Physics of the Arc (Layer 5, Section 5.7)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Paschen minimum pressure (air) | p_min | torr | ~0.75 |
| Paschen minimum voltage (air, 1cm gap) | V_min | V | ~327 |
| Altitude at staging (Ranger 6) | h | km | ~90 |
| Pressure at 90 km altitude | p | torr | ~0.001-0.01 |
| Camera high voltage | V_cam | V | >10,000 |
| Gap distance (vidicon electrodes) | d | cm | ~0.1-1 |
| Breakdown regime | -- | -- | Paschen minimum |

### Formulas

**Paschen's Law:**

The breakdown voltage of a gas depends on the product of pressure and gap distance:

```
V_breakdown = B * (p * d) / (ln(A * p * d) - ln(ln(1 + 1/gamma)))

where:
  p = gas pressure (torr)
  d = electrode gap distance (cm)
  A, B = gas-specific constants (for air: A ≈ 15, B ≈ 365)
  gamma = secondary electron emission coefficient (~0.01)

The function V(p*d) has a MINIMUM — the Paschen minimum:
  At (p*d)_min ≈ 0.567 torr·cm for air
  V_min ≈ 327 V for air

Below the minimum (lower pressure), V increases (harder to break down)
Above the minimum (higher pressure), V increases
AT the minimum: arcing occurs at the LOWEST voltage
```

**At Ranger 6's Staging Altitude:**

```
At h = 90 km: p ≈ 0.001-0.01 torr
With electrode gaps d ≈ 0.1-1 cm:
  p*d ≈ 0.001 to 0.01 torr·cm

This is in the LEFT branch of the Paschen curve —
below the minimum, where breakdown voltage INCREASES
with decreasing pressure. But inside the launch shroud,
the pressure may have been higher than ambient (outgassing,
trapped gas), placing p*d closer to the minimum.

With camera voltages >10,000 V and p*d anywhere near 
the Paschen minimum, arcing is virtually guaranteed.
The cameras were operating at 30x the minimum breakdown voltage.
```

### Worked Example

```python
import numpy as np

print("RANGER 6: PASCHEN BREAKDOWN ANALYSIS")
print("=" * 65)

# Paschen curve for air
A = 15.0       # 1/(torr·cm)
B = 365.0      # V/(torr·cm)
gamma = 0.01   # secondary electron emission coefficient

# Generate Paschen curve
pd_range = np.logspace(-1, 3, 1000)  # torr·cm
V_breakdown = B * pd_range / (np.log(A * pd_range) - np.log(np.log(1 + 1/gamma)))
V_breakdown = np.where(V_breakdown > 0, V_breakdown, np.nan)

# Find minimum
valid = ~np.isnan(V_breakdown)
min_idx = np.nanargmin(V_breakdown[valid])
pd_min = pd_range[valid][min_idx]
V_min = V_breakdown[valid][min_idx]

print(f"Paschen minimum:")
print(f"  p*d = {pd_min:.3f} torr·cm")
print(f"  V_breakdown = {V_min:.0f} V")

# Ranger 6 conditions
V_camera = 10000  # V (camera high voltage)
print(f"\nRanger 6 camera voltage: {V_camera:,} V")
print(f"Ratio to Paschen minimum: {V_camera/V_min:.0f}x")
print(f"")

# Pressure inside shroud at various altitudes
altitudes = [60, 70, 80, 90, 100, 110, 120]
# Approximate atmospheric pressure vs altitude (exponential decay)
p_sealevel = 760  # torr
H = 8.5  # scale height (km)

print(f"{'Altitude (km)':>15} | {'Pressure (torr)':>16} | {'p*d (d=0.5cm)':>14} | {'V_bd (V)':>10} | {'Arc?':>6}")
print(f"{'-'*70}")

for h in altitudes:
    p = p_sealevel * np.exp(-h / H)
    d = 0.5  # cm, typical electrode gap
    pd = p * d
    if pd > 0.1 and pd < 1000:
        V_bd_val = B * pd / (np.log(A * pd) - np.log(np.log(1 + 1/gamma)))
        if V_bd_val > 0:
            arc = "YES" if V_camera > V_bd_val else "NO"
            print(f"{h:>15} | {p:>16.4e} | {pd:>14.4e} | {V_bd_val:>10.0f} | {arc:>6}")
        else:
            print(f"{h:>15} | {p:>16.4e} | {pd:>14.4e} | {'N/A':>10} | {'N/A':>6}")
    else:
        print(f"{h:>15} | {p:>16.4e} | {pd:>14.4e} | {'outside':>10} | {'N/A':>6}")

print(f"\n{'='*65}")
print(f"The Paschen curve is U-shaped.")
print(f"At sea level (760 torr): V_breakdown >> 10,000 V. Safe.")
print(f"In hard vacuum (<1e-6 torr): no gas to ionize. Safe.")
print(f"At ~0.001-1 torr (60-110 km): Paschen minimum region.")
print(f"Camera voltage ({V_camera:,} V) far exceeds breakdown.")
print(f"Arc is CERTAIN if cameras receive power in this window.")
print(f"")
print(f"The staging transient powered the cameras at 90 km.")
print(f"The cameras arced. Six vidicon tubes destroyed.")
print(f"65.5 hours later, the blind spacecraft hit the Moon.")
```

**Resonance statement:** *Paschen's Law defines the U-shaped curve of breakdown voltage versus pressure-gap product. At sea level, air is a good insulator at moderate voltages. In hard vacuum, there is nothing to ionize. But at intermediate pressures — the pressures inside a launch shroud at 90 km altitude — the breakdown voltage reaches a minimum. Ranger 6's cameras were designed for vacuum. They briefly experienced Paschen-minimum conditions during staging. 10,000 volts met a gas at its most vulnerable. The result was inevitable. The mathematics of gas breakdown, known since Friedrich Paschen's 1889 experiments, predicted exactly what happened. No one had applied the analysis to the camera system during the ascent pressure transient. The math was available. The application was missed. Six cameras died because a well-known curve was not consulted.*

---

## Deposit 3: The Zero-Information Mission (Layer 7, Section 7.7)

### Table

| Parameter | Symbol | Units | Ranger 6 Value |
|-----------|--------|-------|----------------|
| Planned image count | N_planned | -- | ~3,000-5,000 |
| Actual image count | N_actual | -- | 0 |
| Information content (images) | I_images | bits | 0 |
| Information content (trajectory) | I_traj | bits | >10^6 |
| Information content (failure analysis) | I_failure | bits | >10^7 (qualitative) |
| Channel capacity (S-band) | C | bits/s | ~500,000 |
| Channel utilization | -- | -- | 0% (imaging), 100% (tracking) |

### Formulas

**Shannon Information of a Binary Outcome:**

```
The camera system had two possible states: WORKING or FAILED.
The prior probability of failure, given Rangers 1-5, was high.
But Ranger 6 was the first Block III with redesigned cameras.

H(camera) = -p_work * log2(p_work) - p_fail * log2(p_fail)

If p_fail = 0.5 (uncertain):
  H = -0.5 * log2(0.5) - 0.5 * log2(0.5) = 1 bit

The camera system returned exactly 1 bit of information:
it told NASA that the cameras DID NOT WORK.
That single bit — worth zero photographs —
was worth $170 million in failure analysis.
```

**The Paradox of Zero-Data Value:**

```
Value of mission = f(images) + f(trajectory) + f(failure_analysis)

For Ranger 7 (hypothetical, without Ranger 6):
  f(images_7) might be 0 (same failure would recur)

For Ranger 7 (actual, after Ranger 6 failure analysis):
  f(images_7) = 4,316 photographs

Therefore:
  Value(Ranger_6) >= Value(Ranger_7_images) - Value(Ranger_7_without_6)
  Value(Ranger_6) >= 4,316 photographs
  
A mission that returned zero images was worth more than
4,316 images, because without it, no images would have followed.
```

### Worked Example

```python
import numpy as np

print("RANGER 6: INFORMATION PARADOX")
print("=" * 65)

# Ranger program image counts
rangers = [
    ("Ranger 1", 1961, "Agena failure", 0),
    ("Ranger 2", 1961, "Agena failure", 0),
    ("Ranger 3", 1962, "Missed Moon", 0),
    ("Ranger 4", 1962, "Computer failure", 0),
    ("Ranger 5", 1962, "Power failure", 0),
    ("Ranger 6", 1964, "Camera failure", 0),
    ("Ranger 7", 1964, "SUCCESS", 4316),
    ("Ranger 8", 1965, "SUCCESS", 7137),
    ("Ranger 9", 1965, "SUCCESS", 5814),
]

print(f"{'Mission':<12} | {'Year':>4} | {'Result':<20} | {'Images':>7}")
print("-" * 55)
total = 0
for name, year, result, images in rangers:
    print(f"{name:<12} | {year:>4} | {result:<20} | {images:>7,}")
    total += images

print("-" * 55)
print(f"{'TOTAL':<12} | {'':>4} | {'':>20} | {total:>7,}")

print(f"\n{'='*65}")
print(f"INFORMATION ANALYSIS")
print(f"{'='*65}")

# Shannon entropy of success/failure for Ranger series
n_missions = 9
n_success = 3
n_failure = 6
p_success = n_success / n_missions
p_failure = n_failure / n_missions

H = -p_success * np.log2(p_success) - p_failure * np.log2(p_failure)
print(f"\nRanger program success rate: {n_success}/{n_missions} = {p_success:.1%}")
print(f"Shannon entropy of outcome: {H:.3f} bits/mission")
print(f"(Maximum entropy at 50/50: 1.000 bits/mission)")

# Information from Ranger 6
print(f"\nRanger 6 information content:")
print(f"  Photographs returned:         0")
print(f"  Trajectory data:              ~10^6 bits (Doppler, range)")
print(f"  Failure analysis:             Paschen breakdown mechanism")
print(f"  Design changes for Ranger 7:  100+ recommendations")
print(f"")
print(f"Images enabled by Ranger 6 failure analysis:")
print(f"  Ranger 7: {4316:>6,}")
print(f"  Ranger 8: {7137:>6,}")
print(f"  Ranger 9: {5814:>6,}")
print(f"  Total:    {4316+7137+5814:>6,}")
print(f"")
print(f"A mission that returned 0 photographs")
print(f"enabled {4316+7137+5814:,} photographs.")
print(f"The information content of failure")
print(f"exceeded the information content of success.")
```

**Resonance statement:** *Ranger 6 returned zero photographs. In strict information-theoretic terms, the imaging channel delivered no data. But the mission returned something more valuable than photographs: the specific failure mode that had to be eliminated for any Ranger camera to work. The electromagnetic shielding redesign that followed Ranger 6 was worth 17,267 photographs — the combined output of Rangers 7, 8, and 9. In Shannon's framework, the surprise of an unexpected outcome carries more information than a predictable one. Ranger 6's trajectory was predictable (the navigation was working). The camera failure was unexpected in its specific mechanism (Paschen breakdown during staging). The unexpected outcome carried the highest information content. The mission that returned zero images was the most informative mission in the Ranger program.*

---

## Deposit 4: Transit Time and the Three-Body Problem (Layer 4, Section 4.8)

### Table

| Parameter | Symbol | Units | Ranger 6 Value |
|-----------|--------|-------|----------------|
| Transit time | t | hr | ~65.5 |
| Earth-Moon distance | d_EM | km | ~384,400 |
| Average transit velocity | v_avg | km/s | ~1.63 |
| Parking orbit altitude | h_park | km | ~185 |
| Parking orbit period | T_park | min | ~88 |
| Coast time in parking orbit | t_coast | min | ~20 |

### Formulas

**Hohmann-like Transfer to Moon:**

```
The simplest lunar transfer is a Hohmann-like ellipse
with perigee at parking orbit and apogee at lunar distance:

a_transfer = (r_park + r_moon) / 2
           = (6556 + 384400) km / 2
           ≈ 195,478 km

T_transfer = pi * sqrt(a_transfer^3 / mu_earth)
           = pi * sqrt((1.955e8)^3 / 3.986e14)
           ≈ 4.32e5 s ≈ 120 hours (for half-period)

Ranger 6's transit of ~65.5 hours is faster than a
minimum-energy Hohmann transfer, because the spacecraft
was injected at a velocity above Hohmann minimum.
This faster trajectory reduced transit time but increased
impact velocity.
```

### Worked Example

```python
import numpy as np

print("RANGER 6: TRANSIT DYNAMICS")
print("=" * 65)

mu_earth = 3.986e14  # m^3/s^2
R_earth = 6.371e6    # m

# Parking orbit
h_park = 185e3       # m
r_park = R_earth + h_park
v_park = np.sqrt(mu_earth / r_park)
T_park = 2 * np.pi * np.sqrt(r_park**3 / mu_earth)

print(f"Parking orbit:")
print(f"  Altitude: {h_park/1e3:.0f} km")
print(f"  Velocity: {v_park:.0f} m/s = {v_park/1e3:.2f} km/s")
print(f"  Period:   {T_park:.0f} s = {T_park/60:.1f} min")

# Transit parameters
t_transit = 65.5 * 3600  # seconds
d_moon = 384400e3         # meters
v_avg = d_moon / t_transit

print(f"\nTransit:")
print(f"  Duration: {t_transit/3600:.1f} hours")
print(f"  Distance: {d_moon/1e3:,.0f} km")
print(f"  Avg velocity: {v_avg:.0f} m/s = {v_avg/1e3:.2f} km/s")

# Time of camera death vs total transit
t_arc = 107        # seconds after launch
t_dead = t_transit - t_arc

print(f"\nCamera timeline:")
print(f"  Cameras killed:     T+{t_arc} seconds ({t_arc/60:.1f} min)")
print(f"  Time flying blind:  {t_dead:.0f} s = {t_dead/3600:.1f} hours")
print(f"  Fraction of flight blind: {t_dead/t_transit*100:.1f}%")
print(f"  Cameras were dead for {t_dead/t_arc:.0f}x longer than they were alive")
print(f"")
print(f"  The arc lasted less than 1 second.")
print(f"  The blindness lasted {t_dead/3600:.1f} hours.")
print(f"  Ranger 6 flew for {t_dead/3600:.0f} hours as a 381-kg paperweight.")
```

**Resonance statement:** *Ranger 6 flew for 65.5 hours to the Moon. The cameras were killed at T+107 seconds. That means the spacecraft was blind for 65.47 hours — 99.95% of its flight time. For every second the cameras were alive (and dying), they were dead for 2,203 seconds. The asymmetry is staggering. One-fifty-thousandth of the mission determined the fate of the entire mission. In the mathematics of decision theory, this is a degenerate case: a system where 99.95% of the trajectory is irrelevant because a single-point failure at 0.05% of the timeline destroyed the output function. The trajectory was irreducibly perfect. The cameras were irreducibly dead. Both facts persisted simultaneously for 65 hours, indifferent to each other.*

---

## Debate Questions

### Question 1: Was Ranger 6 a Failure?

Ranger 6 returned zero photographs — the stated mission objective. By that metric, it failed completely. But its trajectory was the most accurate in the program's history, its failure analysis enabled Rangers 7-9, and its tracking data contributed to lunar gravitational models. Is a mission that returns zero primary science data but enables all subsequent science a failure? How should institutional learning be valued against direct scientific output?

### Question 2: The Paschen Minimum as a Design Blind Spot

The Paschen minimum was well-known physics in 1964 — Paschen published his law in 1889. The failure mode was predictable given the camera voltages and the ascent pressure profile. Why was it missed? Is this a failure of physics knowledge, engineering practice, or testing methodology? How can designers test for conditions they did not anticipate?

### Question 3: The Value of Zero

In information theory, a measurement that returns zero data still returns information — it tells you what does NOT work. Ranger 6 returned zero photographs but returned the specific failure mechanism that was killing cameras. Is zero data always zero value? Compare to null results in science, negative findings in medicine, and failed experiments in engineering.

### Question 4: The Trajectory as Vindication

The navigation team that guided Ranger 6 to within 32 km of the target delivered a perfect performance that was invisible because the cameras could not record it. Should the trajectory achievement be celebrated independently of the camera failure? How do we recognize partial successes within overall failures?

---

*"Ranger 6 hit the Moon within 32 kilometers of the aim point — 17.4 arcseconds of angular accuracy from 384,400 km away. Six television cameras, designed to photograph the lunar surface at resolutions no telescope could match, sat dead in their mounting brackets, killed by an electrical arc 65 hours earlier during a moment that lasted less than a second. The Paschen minimum — a well-known feature of gas breakdown physics, characterized in 1889 — created the conditions for the arc. The transient during Atlas staging provided the energy. The shielding between the staging event and the camera power bus was insufficient. The math of gas breakdown, the math of electromagnetic coupling, and the math of trajectory mechanics all worked exactly as their equations predicted. The trajectory equations delivered the spacecraft to the target. The Paschen equations destroyed the cameras. Both sets of mathematics were correct. Only one was consulted before flight."*
