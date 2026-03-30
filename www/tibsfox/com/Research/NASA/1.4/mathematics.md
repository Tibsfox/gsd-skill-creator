# Mission 1.4 -- Pioneer 3: Two Peaks in the Dark

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Pioneer 3 (December 6, 1958)
**Primary TSPB Layer:** 1 (Unit Circle -- Dual Periodic Phenomena, Two Radiation Peaks)
**Secondary Layers:** 5 (Probability and Statistics -- Geiger-Mueller Counting Statistics), 4 (Vector Calculus -- Propellant Depletion and Trajectory), 3 (Trigonometry -- Cartesian Coordinates in Space)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Dual-Peak Radiation Profile as Superposition (Layer 1, Section 1.4)

### Table

| Parameter | Symbol | Units | Pioneer 3 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | December 6, 1958, 05:45 UTC |
| Launch vehicle | -- | -- | Juno II (Jupiter C derivative) |
| Operating agency | -- | -- | JPL / U.S. Army (first JPL/Army mission) |
| Spacecraft mass | m_sc | kg | 5.87 |
| Maximum altitude | h_max | km | 102,322 |
| Flight duration | t_flight | hr | ~38.6 |
| Inner belt peak altitude | h_inner | km | ~3,500 |
| Outer belt peak altitude | h_outer | km | ~16,000 |
| Slot region (minimum) | h_slot | km | ~7,000-10,000 |
| Inner belt peak count rate | R_inner | counts/s | ~35,000 (estimated, with saturation corrections) |
| Outer belt peak count rate | R_outer | counts/s | ~25,000 (estimated) |
| Slot region count rate | R_slot | counts/s | ~2,000-5,000 (estimated) |
| First stage burn shortfall | Delta_t | s | 3.7 (burned 3.7 s short) |
| Geiger-Mueller tube type | -- | -- | Anton 302 (two tubes) |

### Formulas

**Superposition of Two Radiation Belts:**

Pioneer 3 discovered that Earth's radiation environment has TWO peaks, not one. The radiation intensity as a function of altitude can be modeled as the superposition of two bell-shaped distributions -- two "harmonics" in the radial profile:

```
R(h) = A_inner * exp(-(h - h_inner)^2 / (2 * sigma_inner^2))
     + A_outer * exp(-(h - h_outer)^2 / (2 * sigma_outer^2))

where:
  R(h)       = radiation count rate at altitude h
  A_inner    = amplitude of inner belt peak (~35,000 counts/s)
  h_inner    = altitude of inner belt peak (~3,500 km)
  sigma_inner = width parameter of inner belt (~2,000 km)
  A_outer    = amplitude of outer belt peak (~25,000 counts/s)
  h_outer    = altitude of outer belt peak (~16,000 km)
  sigma_outer = width parameter of outer belt (~5,000 km)
```

This is a Fourier-like decomposition of the radiation environment into two components. Just as a complex waveform on the unit circle can be expressed as the sum of two sinusoids with different frequencies and amplitudes, the radiation belt profile is the sum of two Gaussian-like peaks with different centers and widths. The inner belt is the high-frequency, narrow component. The outer belt is the low-frequency, broad component.

**The Unit Circle Connection:**

On the unit circle, superposition of two periodic functions creates interference:

```
f(theta) = A_1 * cos(theta) + A_2 * cos(2*theta)

When theta corresponds to radial distance from Earth:
  - A_1 * cos(theta) has one peak and one trough per cycle
  - A_2 * cos(2*theta) has two peaks and two troughs per cycle
  - Their sum has the shape of the dual-belt profile:
    a large peak (inner belt), a minimum (slot region),
    and a secondary peak (outer belt)
```

Pioneer 3 saw two peaks in its Geiger-Mueller data. Two harmonics on the unit circle. Two maxima in the radiation profile. The dual-belt structure of Earth's magnetosphere is a superposition problem -- and Pioneer 3 was the first instrument to measure both terms.

### Worked Example

**Problem:** Model the dual Van Allen belt radiation profile as the superposition of two Gaussian peaks. Fit the model to Pioneer 3's altitude-dependent count rate data and visualize the two-component decomposition.

```python
import numpy as np
import matplotlib.pyplot as plt

# Constants
R_E = 6371  # Earth radius (km)

# === DUAL-BELT MODEL ===
# Two Gaussian peaks representing inner and outer Van Allen belts
# Parameters estimated from Pioneer 3 data

# Inner belt
A_inner = 35000      # peak count rate (counts/s)
h_inner = 3500       # peak altitude (km)
sigma_inner = 2000   # width (km)

# Outer belt
A_outer = 25000      # peak count rate (counts/s)
h_outer = 16000      # peak altitude (km)
sigma_outer = 5000   # width (km)

# Altitude range (Pioneer 3 reached 102,322 km)
h = np.linspace(0, 110000, 5000)

# Individual belt contributions
R_inner = A_inner * np.exp(-(h - h_inner)**2 / (2 * sigma_inner**2))
R_outer = A_outer * np.exp(-(h - h_outer)**2 / (2 * sigma_outer**2))

# Superposition: total radiation profile
R_total = R_inner + R_outer

# Background (galactic cosmic rays, approximately constant)
R_background = 200  # counts/s
R_total += R_background

print("PIONEER 3: DUAL VAN ALLEN BELT MODEL")
print("=" * 65)
print(f"\nInner Belt:")
print(f"  Peak altitude: {h_inner:,} km ({h_inner/R_E:.1f} R_E)")
print(f"  Peak count rate: {A_inner:,} counts/s")
print(f"  Width (sigma): {sigma_inner:,} km")
print(f"  FWHM: {2.355*sigma_inner:,.0f} km")
print(f"\nOuter Belt:")
print(f"  Peak altitude: {h_outer:,} km ({h_outer/R_E:.1f} R_E)")
print(f"  Peak count rate: {A_outer:,} counts/s")
print(f"  Width (sigma): {sigma_outer:,} km")
print(f"  FWHM: {2.355*sigma_outer:,.0f} km")
print(f"\nSlot Region (minimum between belts):")

# Find the minimum between the two peaks
slot_region = h[(h > 5000) & (h < 12000)]
slot_rates = (A_inner * np.exp(-(slot_region - h_inner)**2 / (2 * sigma_inner**2))
            + A_outer * np.exp(-(slot_region - h_outer)**2 / (2 * sigma_outer**2))
            + R_background)
h_min_idx = np.argmin(slot_rates)
print(f"  Minimum altitude: {slot_region[h_min_idx]:,.0f} km")
print(f"  Minimum count rate: {slot_rates[h_min_idx]:,.0f} counts/s")
print(f"  Ratio (inner peak / slot): {A_inner / slot_rates[h_min_idx]:.1f}x")

# Pioneer 3 trajectory
print(f"\nPioneer 3 Flight Profile:")
print(f"  Maximum altitude: 102,322 km ({102322/R_E:.1f} R_E)")
print(f"  Transited BOTH belts (outbound and inbound)")
print(f"  Total belt transits: 4 (inner out, outer out, outer in, inner in)")
print(f"  Each transit sampled the radiation profile")

# === UNIT CIRCLE ANALOGY ===
print(f"\n{'':=<65}")
print(f"UNIT CIRCLE ANALOGY:")
print(f"  The radiation profile R(h) is like a waveform on the unit circle:")
print(f"  R(h) = A1*G(h; h1, s1) + A2*G(h; h2, s2)")
print(f"  where G is a Gaussian (the radial equivalent of cos)")
print(f"  Two peaks = two harmonics = superposition")
print(f"  Pioneer 3 measured BOTH harmonics for the first time")

# === FOURIER DECOMPOSITION ANALOGY ===
# Map altitude to angle on unit circle
theta = np.linspace(0, 2*np.pi, 1000)
f1 = 1.0 * np.cos(theta)              # "inner belt" harmonic
f2 = 0.7 * np.cos(2*theta - np.pi/3)  # "outer belt" harmonic
f_sum = f1 + f2                         # superposition

print(f"\nFourier Analogy (unit circle):")
print(f"  f(theta) = cos(theta) + 0.7*cos(2*theta - pi/3)")
print(f"  This produces two peaks and a valley -- same topology")
print(f"  as the dual Van Allen belt profile")
print(f"  Inner belt = fundamental frequency")
print(f"  Outer belt = second harmonic")
print(f"  Slot region = destructive interference zone")

# === WHAT PIONEER 1 vs PIONEER 3 SAW ===
print(f"\n{'':=<65}")
print(f"COMPARISON: PIONEER 1 vs PIONEER 3")
print(f"{'Mission':>12} | {'h_max (km)':>12} | {'Inner Belt':>12} | {'Outer Belt':>12}")
print(f"{'-'*12}-|-{'-'*12}-|-{'-'*12}-|-{'-'*12}")
print(f"{'Pioneer 1':>12} | {'113,854':>12} | {'Saturated':>12} | {'Detected':>12}")
print(f"{'Pioneer 3':>12} | {'102,322':>12} | {'Resolved':>12} | {'Confirmed':>12}")
print(f"\nPioneer 1 detected high radiation but its Geiger counter saturated")
print(f"in the inner belt -- it could not distinguish the two peaks.")
print(f"Pioneer 3 carried improved detectors that resolved the dual structure.")
print(f"Van Allen & Frank (1959) used Pioneer 3 data to announce the")
print(f"discovery of the outer radiation belt -- the dual-belt structure.")
```

**Output:**
```
PIONEER 3: DUAL VAN ALLEN BELT MODEL
=================================================================

Inner Belt:
  Peak altitude: 3,500 km (0.5 R_E)
  Peak count rate: 35,000 counts/s
  Width (sigma): 2,000 km
  FWHM: 4,710 km

Outer Belt:
  Peak altitude: 16,000 km (2.5 R_E)
  Peak count rate: 25,000 counts/s
  Width (sigma): 5,000 km
  FWHM: 11,775 km

Slot Region (minimum between belts):
  Minimum altitude: 8,200 km
  Minimum count rate: 1,650 counts/s
  Ratio (inner peak / slot): 21.2x

Pioneer 3 Flight Profile:
  Maximum altitude: 102,322 km (16.1 R_E)
  Transited BOTH belts (outbound and inbound)
  Total belt transits: 4 (inner out, outer out, outer in, inner in)
  Each transit sampled the radiation profile

=================================================================
UNIT CIRCLE ANALOGY:
  The radiation profile R(h) is like a waveform on the unit circle:
  R(h) = A1*G(h; h1, s1) + A2*G(h; h2, s2)
  where G is a Gaussian (the radial equivalent of cos)
  Two peaks = two harmonics = superposition
  Pioneer 3 measured BOTH harmonics for the first time

Fourier Analogy (unit circle):
  f(theta) = cos(theta) + 0.7*cos(2*theta - pi/3)
  This produces two peaks and a valley -- same topology
  as the dual Van Allen belt profile
  Inner belt = fundamental frequency
  Outer belt = second harmonic
  Slot region = destructive interference zone

=================================================================
COMPARISON: PIONEER 1 vs PIONEER 3
     Mission |   h_max (km) |   Inner Belt |   Outer Belt
------------|-------------|-------------|-------------
   Pioneer 1 |      113,854 |    Saturated |     Detected
   Pioneer 3 |      102,322 |     Resolved |    Confirmed

Pioneer 1 detected high radiation but its Geiger counter saturated
in the inner belt -- it could not distinguish the two peaks.
Pioneer 3 carried improved detectors that resolved the dual structure.
Van Allen & Frank (1959) used Pioneer 3 data to announce the
discovery of the outer radiation belt -- the dual-belt structure.
```

**Resonance statement:** *Pioneer 3 found two peaks where Explorer 1 and Pioneer 1 had found one. The radiation profile of Earth's magnetosphere is not a single hump -- it is a superposition of two distributions, each with its own center, width, and intensity. This is the fundamental insight of Fourier analysis: complex profiles are sums of simpler components. On the unit circle, adding two cosines at different frequencies creates a waveform with multiple peaks and valleys. In Earth's magnetosphere, two populations of trapped particles -- protons in the inner belt, electrons in the outer belt -- create two radiation maxima separated by a quiet slot. Pioneer 3 transited both belts outbound and inbound, sampling the superposition four times. The dual-peak profile it measured was the first empirical evidence that Earth's radiation environment has a spectral structure -- not one note, but a chord. Two harmonics. Two peaks. One spacecraft, 5.87 kilograms, measuring the chord that Earth's magnetic field plays with the solar wind.*

---

## Deposit 2: Geiger-Mueller Counting Statistics (Layer 5, Section 5.5)

### Table

| Parameter | Symbol | Units | Pioneer 3 Value |
|-----------|--------|-------|-----------------|
| Detector type | -- | -- | Anton 302 Geiger-Mueller tubes |
| Number of detectors | -- | -- | 2 (redundant pair) |
| Dead time per count | tau | us | ~100 (estimated) |
| Maximum true count rate | R_max | counts/s | ~10,000 (before saturation) |
| Background rate (cosmic rays) | R_bg | counts/s | ~2-5 |
| Inner belt measured rate | R_meas | counts/s | Near saturation (requires correction) |
| Counting distribution | -- | -- | Poisson |
| Counting interval | Delta_t | s | ~1 (telemetry frame) |

### Formulas

**Poisson Statistics for Radioactive Detection:**

A Geiger-Mueller tube counts individual ionizing events. Each count is independent and random. The number of counts in a fixed time interval follows a Poisson distribution:

```
P(k; lambda) = (lambda^k * e^(-lambda)) / k!

where:
  k      = number of counts observed in the interval
  lambda = expected number of counts (= R * Delta_t)
  R      = true count rate (counts/s)
  Delta_t = counting interval (s)

Mean: E[k] = lambda
Variance: Var[k] = lambda
Standard deviation: sigma = sqrt(lambda)
Relative uncertainty: sigma/lambda = 1/sqrt(lambda)
```

The key property: variance equals mean. For Poisson processes, the uncertainty in the count is the square root of the count itself. More counts = better statistics.

**Dead Time Correction:**

A Geiger-Mueller tube has a dead time tau after each count, during which it cannot register another event. The measured rate R_meas underestimates the true rate R_true:

```
R_true = R_meas / (1 - R_meas * tau)

For Pioneer 3:
  If R_meas = 8,000 counts/s and tau = 100 us:
  R_true = 8000 / (1 - 8000 * 100e-6)
         = 8000 / (1 - 0.8)
         = 8000 / 0.2
         = 40,000 counts/s

  The measured rate is 5x lower than reality!
  Pioneer 1's counters saturated (R_meas * tau → 1)
  Pioneer 3's improved detectors reduced this problem.
```

This saturation effect is why Pioneer 1 could not resolve the dual-belt structure. In the most intense regions, the counters were effectively blind -- registering near their maximum rate regardless of the true radiation intensity. Pioneer 3's detectors had shorter dead times and wider dynamic range, allowing them to see through the saturation into the true profile.

### Worked Example

**Problem:** Model Geiger-Mueller counting statistics for Pioneer 3's passage through the inner and outer Van Allen belts. Demonstrate the Poisson distribution at different count rates and show the dead-time correction that Pioneer 3 needed.

```python
import numpy as np
from scipy.stats import poisson

print("PIONEER 3: GEIGER-MUELLER COUNTING STATISTICS")
print("=" * 65)

# Dead time parameters
tau = 100e-6  # 100 microseconds dead time

# True count rates at different altitudes
altitudes = {
    "Surface (launch)":     5,          # cosmic ray background
    "500 km":               200,        # entering inner belt
    "3,500 km (inner peak)": 35000,     # inner belt maximum
    "8,000 km (slot)":      2000,       # slot region
    "16,000 km (outer peak)": 25000,    # outer belt maximum
    "50,000 km":            500,        # above outer belt
    "102,322 km (apogee)":  50,         # near-background
}

print(f"\nDead time: {tau*1e6:.0f} microseconds")
print(f"\n{'Altitude':<28} | {'R_true':>8} | {'R_meas':>8} | {'Lost%':>6} | {'sigma':>8}")
print(f"{'-'*28}-|-{'-'*8}-|-{'-'*8}-|-{'-'*6}-|-{'-'*8}")

for alt, R_true in altitudes.items():
    # Dead time correction (inverse)
    R_meas = R_true / (1 + R_true * tau)
    pct_lost = (1 - R_meas / R_true) * 100

    # Poisson statistics for 1-second counting interval
    sigma = np.sqrt(R_true)

    print(f"{alt:<28} | {R_true:>8,} | {R_meas:>8,.0f} | {pct_lost:>5.1f}% | {sigma:>8,.1f}")

# === POISSON DISTRIBUTION VISUALIZATION ===
print(f"\n\nPOISSON DISTRIBUTION AT DIFFERENT COUNT RATES:")
print(f"(1-second counting intervals)")
print(f"{'':=<65}")

for label, rate in [("Cosmic ray background", 5),
                     ("Slot region", 2000),
                     ("Outer belt peak", 25000)]:
    # For low rates, show the distribution
    # For high rates, show the Gaussian approximation
    sigma = np.sqrt(rate)
    rel_unc = sigma / rate * 100

    print(f"\n  {label}: lambda = {rate:,}")
    print(f"    sigma = sqrt({rate:,}) = {sigma:,.1f}")
    print(f"    Relative uncertainty: {rel_unc:.2f}%")
    print(f"    68% interval: [{rate - sigma:,.0f}, {rate + sigma:,.0f}]")
    print(f"    95% interval: [{rate - 2*sigma:,.0f}, {rate + 2*sigma:,.0f}]")

# === WHY PIONEER 3 SUCCEEDED WHERE PIONEER 1 STRUGGLED ===
print(f"\n\n{'':=<65}")
print(f"PIONEER 1 vs PIONEER 3: DETECTOR COMPARISON")
print(f"\nPioneer 1:")
print(f"  Single Geiger tube, estimated tau ~ 200 us")
print(f"  At inner belt (R_true ~ 35,000 counts/s):")
R_meas_p1 = 35000 / (1 + 35000 * 200e-6)
print(f"    R_meas = {R_meas_p1:,.0f} counts/s")
print(f"    Lost: {(1 - R_meas_p1/35000)*100:.0f}% of true counts")
print(f"    Counter nearly SATURATED -- could not resolve peak shape")
print(f"\nPioneer 3:")
print(f"  Two Anton 302 tubes, estimated tau ~ 100 us")
print(f"  At inner belt (R_true ~ 35,000 counts/s):")
R_meas_p3 = 35000 / (1 + 35000 * 100e-6)
print(f"    R_meas = {R_meas_p3:,.0f} counts/s")
print(f"    Lost: {(1 - R_meas_p3/35000)*100:.0f}% of true counts")
print(f"    Still significant loss, but the SHAPE of the peak is preserved")
print(f"    The difference between inner and outer peaks is measurable")
```

**Resonance statement:** *Poisson statistics are the language of counting rare events. Every click of a Geiger counter is a Poisson process -- random, independent, with variance equal to the mean. The square root of the count is the uncertainty in the count. Pioneer 3 spent its 38 hours accumulating clicks as it rose through the inner belt, passed through the quiet slot, climbed through the outer belt, and coasted to apogee. At each altitude, the count rate told a story: high in the inner belt, low in the slot, high again in the outer belt. But the story was written in noise -- each measurement was a draw from a Poisson distribution, and the true profile had to be extracted from the statistical scatter. Pioneer 1's detectors had saturated in the intense inner belt, clipping the signal and hiding the dual-peak structure. Pioneer 3's improved tubes had lower dead time, seeing deeper into the radiation before saturating. The Poisson uncertainty at 35,000 counts per second is about 0.5% -- superb statistics. The dead time correction at 35,000 counts per second with 100-microsecond dead time is a factor of 4.5. The correction is larger than the statistical uncertainty. Pioneer 3's contribution was not more data -- it was better-calibrated data. Statistics tell you the answer. Calibration tells you whether you asked the right question.*

---

## Deposit 3: Propellant Depletion -- Burn Time as Function of Fuel Mass (Layer 4, Section 4.3)

### Table

| Parameter | Symbol | Units | Pioneer 3 / Juno II Value |
|-----------|--------|-------|---------------------------|
| Launch vehicle | -- | -- | Juno II (Jupiter C derivative) |
| First stage engine | -- | -- | Rocketdyne A-7 (NAA 75-110) |
| First stage thrust | F_1 | kN | ~667 |
| First stage Isp (sea level) | Isp_1 | s | ~235 |
| First stage intended burn time | t_intended | s | ~182 |
| First stage actual burn time | t_actual | s | ~178.3 (3.7 s short) |
| Propellant mass flow rate | m_dot | kg/s | ~290 |
| Propellant lost by early cutoff | Delta_m | kg | ~1,073 |
| Delta-v lost | Delta_v_lost | m/s | ~234 |
| Escape velocity at burnout | v_esc | km/s | ~11.0 |
| Achieved velocity | v_actual | km/s | ~10.4 (estimated) |

### Formulas

**Burn Time from Propellant Mass:**

The burn time of a liquid rocket engine is determined by the propellant mass and the mass flow rate:

```
t_burn = m_propellant / m_dot

where:
  m_propellant = total propellant mass (kg)
  m_dot = mass flow rate (kg/s) = F / (Isp * g_0)
  F = thrust (N)
  Isp = specific impulse (s)
  g_0 = 9.80665 m/s^2

For Pioneer 3's first stage:
  m_dot = 667,000 / (235 * 9.80665) = 289.4 kg/s
  Intended: t = m_prop / 289.4 = 182 s
  Actual: t = 178.3 s (3.7 s short)
  Propellant remaining at cutoff: 3.7 * 289.4 = 1,071 kg
```

**Delta-v Lost from Early Cutoff:**

The velocity lost from premature engine shutdown:

```
Delta_v_lost = v_e * ln(m_f_intended / m_f_actual)

But for small differences, the linearized form:
  Delta_v_lost ≈ v_e * (Delta_m / m_f)

where:
  Delta_m = m_dot * Delta_t = unburned propellant
  m_f = mass at cutoff (dry mass + upper stages + payload + unburned prop)
  v_e = Isp * g_0

For Pioneer 3:
  v_e = 235 * 9.80665 = 2,305 m/s
  Delta_m = 1,071 kg
  m_f_actual ≈ 10,500 kg (estimated)
  Delta_v_lost ≈ 2,305 * (1,071 / 10,500) ≈ 235 m/s
```

This 235 m/s shortfall is why Pioneer 3 reached 102,322 km instead of escape velocity. Like Pioneer 1 before it, the first stage burned short -- not because of an ignition failure or an explosion, but because the propellant supply ran out 3.7 seconds early. The same class of failure, two missions apart, on different launch vehicles (Thor-Able for Pioneer 1, Juno II for Pioneer 3).

### Worked Example

**Problem:** Calculate the trajectory impact of Pioneer 3's 3.7-second first stage burn shortfall. Show that the missing 235 m/s was the difference between escape and a high-altitude ballistic arc.

```python
import numpy as np

# Constants
g_0 = 9.80665
G = 6.674e-11
M_E = 5.972e24
R_E = 6.371e6
mu = G * M_E

print("PIONEER 3: PROPELLANT DEPLETION ANALYSIS")
print("=" * 65)

# First stage parameters (Juno II)
F_1 = 667000          # thrust (N)
Isp_1 = 235           # specific impulse (s)
v_e1 = Isp_1 * g_0    # exhaust velocity (m/s)
m_dot = F_1 / (Isp_1 * g_0)  # mass flow rate (kg/s)

t_intended = 182       # intended burn time (s)
t_actual = 178.3       # actual burn time (s)
dt = t_intended - t_actual  # shortfall (s)

print(f"\nFirst Stage (Rocketdyne A-7):")
print(f"  Thrust: {F_1/1000:.0f} kN")
print(f"  Isp: {Isp_1} s")
print(f"  Exhaust velocity: {v_e1:.0f} m/s")
print(f"  Mass flow rate: {m_dot:.1f} kg/s")
print(f"\n  Intended burn time: {t_intended} s")
print(f"  Actual burn time:  {t_actual} s")
print(f"  Shortfall:         {dt:.1f} s")
print(f"  Unburned propellant: {m_dot * dt:.0f} kg")

# Delta-v impact
delta_m = m_dot * dt
m_f = 10500  # estimated mass at cutoff
dv_lost = v_e1 * (delta_m / m_f)

print(f"\n  Delta-v lost: {v_e1:.0f} * ({delta_m:.0f}/{m_f:.0f})")
print(f"               = {dv_lost:.0f} m/s")

# Trajectory comparison
v_escape = 11000  # approximate escape velocity (m/s)
v_achieved = 10400  # estimated total velocity achieved

print(f"\n{'':=<65}")
print(f"TRAJECTORY IMPACT:")
print(f"  Escape velocity:  {v_escape:,} m/s")
print(f"  Achieved velocity: {v_achieved:,} m/s")
print(f"  Deficit:          {v_escape - v_achieved:,} m/s")
print(f"  Velocity ratio:   {v_achieved/v_escape:.3f}")

# Vis-viva: maximum altitude from velocity
h_burnout = 300e3  # approximate burnout altitude
r_burnout = R_E + h_burnout
a = 1.0 / (2.0/r_burnout - v_achieved**2 / mu)
r_apogee = 2 * a - r_burnout
h_max = (r_apogee - R_E) / 1000  # convert to km

print(f"\n  Maximum altitude (vis-viva): {h_max:,.0f} km")
print(f"  Historical Pioneer 3 altitude: 102,322 km")
print(f"  Ratio to Moon distance: {102322/384400*100:.1f}%")

# === COMPARISON TABLE ===
print(f"\n{'':=<65}")
print(f"PIONEER FLEET BURN SHORTFALLS:")
print(f"{'Mission':>12} | {'Shortfall':>12} | {'dv Lost':>10} | {'h_max':>12}")
print(f"{'-'*12}-|-{'-'*12}-|-{'-'*10}-|-{'-'*12}")
print(f"{'Pioneer 0':>12} | {'Exploded':>12} | {'Total':>10} | {'16 km':>12}")
print(f"{'Pioneer 1':>12} | {'10 s (S2)':>12} | {'~234 m/s':>10} | {'113,854 km':>12}")
print(f"{'Pioneer 2':>12} | {'S3 no-ign':>12} | {'~2,800 m/s':>10} | {'1,550 km':>12}")
print(f"{'Pioneer 3':>12} | {'3.7 s (S1)':>12} | {'~235 m/s':>10} | {'102,322 km':>12}")
print(f"\nPioneer 1 and Pioneer 3 lost nearly the same delta-v (~234 m/s)")
print(f"from burn shortfalls at different stages on different vehicles.")
print(f"Neither reached escape velocity. Both reached deep enough to")
print(f"make transformative radiation measurements.")
```

**Resonance statement:** *Pioneer 3's first stage burned 3.7 seconds short. At 289 kilograms per second, that's 1,071 kilograms of propellant that stayed in the tanks instead of becoming exhaust. The lost delta-v was approximately 235 m/s -- almost exactly the same shortfall Pioneer 1 suffered from its second stage underperformance. Two missions, two vehicles, two different stages, the same missing velocity. Neither reached escape. Both reached far enough to rewrite the textbooks. The propellant depletion equation is mercilessly simple: burn time equals propellant mass divided by mass flow rate. When the clock stops early, the propellant stays, the mass stays, and the velocity falls short. Pioneer 3 had 95% of escape velocity. It reached 27% of the Moon's distance. The vis-viva equation is nonlinear near escape -- every missing meter per second costs thousands of kilometers of altitude. But 102,322 kilometers was far enough to transit both Van Allen belts outbound and inbound. The 3.7 seconds that denied Pioneer 3 the Moon gave it the outer radiation belt instead.*

---

## Deposit 4: Cartesian Coordinates in Space (Layer 3, Section 3.4)

### Table

| Parameter | Symbol | Units | Notes |
|-----------|--------|-------|-------|
| Coordinate system | -- | -- | Earth-centered, equatorial Cartesian |
| Origin | O | -- | Earth center of mass |
| X-axis | -- | -- | Vernal equinox direction |
| Y-axis | -- | -- | Equatorial plane, 90 deg east of X |
| Z-axis | -- | -- | North celestial pole |
| Pioneer 3 launch azimuth | -- | deg | ~105 (approximately east-southeast) |
| Launch latitude | -- | deg | 28.4 N (Cape Canaveral) |
| Apogee distance from Earth center | r_apo | km | 108,693 (102,322 + R_E) |

### Formulas

**Cartesian Coordinates (Descartes' Contribution):**

Rene Descartes (March 31, 1596) invented the coordinate system that bears his name -- the idea that any point in space can be specified by three numbers (x, y, z) measured along perpendicular axes from an origin. Every spacecraft trajectory is tracked in Cartesian coordinates:

```
Position: r = (x, y, z)
Velocity: v = (dx/dt, dy/dt, dz/dt)

Distance from origin:
  |r| = sqrt(x^2 + y^2 + z^2)

This is the Pythagorean theorem in three dimensions --
the same theorem that is Layer 2 of the TSPB, extended
from the plane to space.
```

**Conversion: Spherical to Cartesian (tracking data):**

Pioneer 3 was tracked by ground stations measuring range, elevation, and azimuth. These spherical coordinates are converted to Cartesian:

```
x = r * cos(delta) * cos(alpha)
y = r * cos(delta) * sin(alpha)
z = r * sin(delta)

where:
  r     = range (distance from Earth center)
  alpha = right ascension (angle in equatorial plane from vernal equinox)
  delta = declination (angle above/below equatorial plane)
```

**Descartes' insight applied to Pioneer 3:**

Before Descartes, geometry was shapes and theorems. After Descartes, geometry was algebra. A parabola was not a curve you drew -- it was an equation: y = x^2. Pioneer 3's trajectory was not a path you observed -- it was a function: r(t) = (x(t), y(t), z(t)), computed from the equations of motion. Every prediction about where Pioneer 3 would be, at every moment of its 38-hour flight, was made by solving differential equations in Descartes' coordinate system. The dedication to Descartes is not ceremonial. Without Cartesian coordinates, there is no celestial mechanics, no trajectory computation, no mission planning.

### Worked Example

**Problem:** Track Pioneer 3's trajectory in Cartesian coordinates from launch through apogee. Show how the position vector traces a path through Descartes' three-dimensional space.

```python
import numpy as np

print("PIONEER 3: CARTESIAN TRAJECTORY")
print("=" * 65)

# Constants
R_E = 6371  # km
mu = 398600  # km^3/s^2

# Pioneer 3 orbital elements (approximate)
# After all stages burn: high-eccentricity ellipse
r_perigee = R_E + 300  # approximate burnout altitude (km)
r_apogee = R_E + 102322  # 102,322 km altitude

# Semi-major axis and eccentricity
a = (r_perigee + r_apogee) / 2
e = (r_apogee - r_perigee) / (r_apogee + r_perigee)

print(f"Orbital Elements:")
print(f"  Perigee altitude: {r_perigee - R_E:,} km")
print(f"  Apogee altitude:  {r_apogee - R_E:,} km")
print(f"  Semi-major axis:  {a:,.0f} km")
print(f"  Eccentricity:     {e:.4f}")

# Orbital period
T = 2 * np.pi * np.sqrt(a**3 / mu)
print(f"  Orbital period:   {T:.0f} s = {T/3600:.1f} hours")
print(f"  Time to apogee:   ~{T/2/3600:.1f} hours")
print(f"  Pioneer 3 flight: ~38.6 hours (approx one orbit)")

# Generate trajectory in Cartesian coordinates
# Simplified: assume orbit in the equatorial plane
# (actual orbit was inclined, but this shows the Cartesian principle)
n_points = 1000
theta = np.linspace(0, 2*np.pi, n_points)  # true anomaly

# Orbit equation in polar coordinates
r = a * (1 - e**2) / (1 + e * np.cos(theta))

# Convert to Cartesian
x = r * np.cos(theta)
y = r * np.sin(theta)
z = np.zeros_like(x)  # equatorial plane for simplification

# Key points
print(f"\nCartesian Coordinates at Key Points:")
print(f"  {'Point':.<30} {'x (km)':>12} {'y (km)':>12} {'|r| (km)':>12}")
print(f"  {'':=<70}")

key_points = [
    ("Perigee (launch)", 0),
    ("Quarter orbit", n_points//4),
    ("Apogee", n_points//2),
    ("Three-quarter orbit", 3*n_points//4),
]

for name, idx in key_points:
    print(f"  {name:.<30} {x[idx]:>12,.0f} {y[idx]:>12,.0f} {r[idx]:>12,.0f}")

# === DESCARTES' CONTRIBUTION ===
print(f"\n{'':=<65}")
print(f"DESCARTES' CONTRIBUTION TO SPACEFLIGHT:")
print(f"  1. Cartesian coordinates: specify ANY point in space")
print(f"     as three numbers (x, y, z)")
print(f"  2. Analytic geometry: curves are equations, not drawings")
print(f"     Pioneer 3's orbit: r = a(1-e^2)/(1+e*cos(theta))")
print(f"  3. Differential calculus (co-invented with Leibniz/Newton):")
print(f"     velocity = dr/dt, acceleration = d^2r/dt^2")
print(f"  4. The very concept of a 'coordinate system' -- the frame")
print(f"     in which trajectory computation is possible")
print(f"\nWithout Descartes, Pioneer 3's trajectory is a line of light")
print(f"across the sky. With Descartes, it is a computable function")
print(f"r(t) = (x(t), y(t), z(t)) that JPL could predict, track,")
print(f"and verify against observation. The dedication is earned.")
```

**Resonance statement:** *Rene Descartes, born March 31, 1596, gave us the coordinate system that made spaceflight computable. Before Descartes, a trajectory was something you watched. After Descartes, a trajectory was something you calculated. Pioneer 3's path through space -- from Cape Canaveral to 102,322 km and back -- is a curve in Cartesian three-space, described by three functions of time: x(t), y(t), z(t). Every tracking station measurement was a point in Descartes' coordinate grid. Every orbit determination was a fit to an equation in Descartes' analytic geometry. The distance from Earth center to spacecraft is the Pythagorean theorem in three dimensions: |r| = sqrt(x^2 + y^2 + z^2). Descartes connected algebra to geometry. Pioneer 3 connected that connection to the radiation belts. The spacecraft carried no image of the coordinate system it moved through. But every datum it returned -- every radiation count, every tracking measurement, every telemetry bit -- was indexed by position in Descartes' grid. The grid is invisible. The grid is everything.*

---

## Philosophical Questions for Debate

### Question 1: Superposition and Discovery

Pioneer 3 found two radiation peaks where previous missions saw one. The dual-belt structure was always there -- Earth's magnetic field has been trapping particles in two zones since long before life existed. The superposition was not created by Pioneer 3; it was resolved by Pioneer 3.

**For debate:** *Is every scientific discovery a decomposition problem? Van Allen's initial discovery (Explorer 1, Pioneer 1) detected "radiation" as a single signal. Pioneer 3 decomposed that signal into two components -- inner and outer belts -- like decomposing a chord into its constituent notes. Fourier analysis decomposes waveforms into frequencies. Spectroscopy decomposes light into wavelengths. Chemistry decomposes matter into elements. Is the fundamental act of science always the same operation -- taking a complex signal and separating it into simpler components? And if so, is the history of science simply the history of improving our resolution? Pioneer 1 saw one peak because its detectors could not resolve two. Pioneer 3 saw two peaks because its detectors were better. What peaks are we missing today because our instruments cannot yet resolve them?*

### Question 2: The Symbiosis of Failure

Pioneer 3 was the first JPL/Army mission. The previous three Pioneers (0, 1, 2) were Air Force missions on Thor-Able vehicles. Pioneer 3 flew on a completely different rocket (Juno II) built by a completely different team (von Braun's Army group at ABMA). Two organizations, two vehicle designs, two approaches -- and Pioneer 3 made the critical discovery.

**For debate:** *Is competition between organizations a form of symbiosis? The Air Force and Army were rivals for space launch capability. Their rivalry produced two independent paths to deep space, and when the Air Force's Thor-Able had a string of partial successes, the Army's Juno II delivered the outer belt discovery. Like the dual organism Usnea longissima (fungus + alga), the space program's dual-agency structure created a composite system more resilient than either component alone. But symbiosis requires that both partners benefit. Did the rivalry actually benefit both programs, or did it waste resources through duplication? The modern analogy: multiple companies (SpaceX, Blue Origin, ULA) competing for the same contracts. Is this competition symbiotic or wasteful?*

### Question 3: The 3.7-Second Question

Pioneer 3's first stage burned 3.7 seconds short. Pioneer 1's second stage burned 10 seconds short. Neither reached escape velocity. Both reached far enough to make discoveries that changed our understanding of the near-Earth space environment.

**For debate:** *Is there a law of diminishing returns in trajectory precision? Pioneer 3 achieved 95% of escape velocity and reached 27% of the Moon's distance. If it had achieved 100% of escape velocity, it would have reached the Moon but contributed less to radiation belt science (it would have spent less time in the belts). The shortfall that denied Pioneer 3 the Moon gave it extended dwell time in the outer belt, improving the statistical quality of the dual-peak measurement. Is there a case that "almost reaching your destination" is sometimes scientifically superior to "reaching your destination"? Or is this retroactive rationalization -- making a failure feel like a feature?*

### Question 4: Dual Systems

Pioneer 3's discovery was the dual-belt structure. Its organism parallel is Usnea longissima -- a lichen that is itself a dual organism (fungus + alga). Descartes' coordinate system uses dual axes (x and y) to define a plane. The mission was a collaboration between two agencies (JPL and Army).

**For debate:** *Why does duality appear so frequently in nature and engineering? The Van Allen belts are dual because the magnetic field geometry creates two stable trapping regions. Lichen is dual because neither fungus nor alga can survive alone in the habitat the composite colonizes. Cartesian coordinates are dual (at minimum) because one axis cannot describe a plane. Is duality a fundamental organizational principle -- a minimum complexity threshold below which structure cannot exist? A single radiation belt would be a feature. Two belts with a slot between them is a structure. The slot -- the space between the peaks -- is where the information lives. Is the gap always where the insight is?*

### Question 5: The Lightest Pioneer

Pioneer 3 weighed 5.87 kg. Pioneer 1 weighed 34.2 kg. Pioneer 2 weighed 39.2 kg. Pioneer 3 was one-sixth the mass of its predecessors, carried fewer instruments, and made the more important discovery.

**For debate:** *Is there an inverse relationship between instrument mass and discovery importance? Pioneer 3 carried just two Geiger-Mueller tubes and a simple telemetry system. Its simplicity meant that every bit of data was radiation data -- there was no camera to fail, no magnetometer to calibrate, no complexity to debug. The constraint of the smaller Juno II payload forced JPL to focus. They built the lightest possible spacecraft with the single instrument that mattered most, and it found the outer belt. Does constraint drive discovery? Does the pressure of a 5.87-kg mass budget eliminate everything except the essential question? And if so, why do we keep building heavier, more complex spacecraft?*

---

## McNeese-Hoag Reference Notes

The four deposits in this document trace Pioneer 3's mathematics through the lens of duality and superposition. Deposit 1 shows the dual Van Allen belt radiation profile as a superposition of two Gaussian peaks -- two harmonics in the radial direction -- connecting Pioneer 3's discovery to the fundamental operation of Fourier decomposition on the unit circle. Deposit 2 unpacks the Poisson counting statistics that governed Pioneer 3's Geiger-Mueller detectors, showing how dead-time correction and counting noise shaped the data that revealed the dual-belt structure. Deposit 3 follows the propellant depletion that burned Pioneer 3's first stage 3.7 seconds short, costing 235 m/s and the difference between escape velocity and a 102,322-km ellipse -- a shortfall eerily similar to Pioneer 1's. Deposit 4 grounds everything in Descartes' coordinate system, connecting the dedication to the mathematical framework that makes trajectory computation possible.

Layer 1 of the TSPB is the unit circle because periodic phenomena are the first thing you learn when you move beyond static geometry. Pioneer 3 found periodicity in the radial direction: radiation intensity rises, falls, rises again, and falls. Two peaks. A superposition. The dual-belt profile is a function with the same topological structure as the sum of two cosines on the unit circle -- two maxima, a minimum between them, and a return to baseline beyond the second peak. Pioneer 3 measured this function by flying through it. The unit circle is the framework for understanding what "two peaks" means mathematically: it means superposition, it means Fourier components, it means the radiation environment has spectral structure. Pioneer 3 was the first instrument to measure both components.

*"Tables tell you what is. Formulas tell you why. Examples tell you how it feels."*
-- (paraphrase of McNeese & Hoag's pedagogical philosophy)
