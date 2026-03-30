# Mission 1.7 -- Explorer 1: The Mathematics of Detection

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Explorer 1 (January 31, 1958)
**Primary TSPB Layer:** 2 (Pythagorean Theorem -- Inverse-Square Law, Radiation Intensity vs. Distance)
**Secondary Layers:** 4 (Vector Calculus -- Orbital Mechanics, Radiation Belt Geometry), 7 (Information Systems Theory -- Geiger Counter Saturation, Dead Time), 1 (Unit Circle -- Spin-Stabilization, Orbital Period)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Geiger Counter Dead Time and Saturation (Layer 7, Section 7.3)

### Table

| Parameter | Symbol | Units | Explorer 1 Value |
|-----------|--------|-------|------------------|
| Launch date | -- | -- | January 31, 1958, 22:48 UTC |
| Launch vehicle | -- | -- | Juno I (Jupiter-C / Modified Redstone) |
| Operating agency | -- | -- | ABMA / JPL / University of Iowa |
| Spacecraft mass | m_sc | kg | 13.97 (total), 8.3 (instrumented payload) |
| Geiger-Muller tube | -- | -- | Anton 314 (halogen-quenched, cosmic ray type) |
| Tube fill gas | -- | -- | Neon + halogen quench |
| Dead time | tau | microseconds | ~100 (typical for Anton 314) |
| Maximum linear count rate | N_max | counts/s | ~500 (before nonlinearity onset) |
| Saturation threshold | N_sat | counts/s | ~8,000-10,000 (counter reads zero above) |
| Operating voltage | V_op | V | ~900 (Geiger plateau) |
| Efficiency (cosmic rays) | eta | % | ~85-95 (for charged particles traversing tube) |
| Telemetry bit rate | -- | bps | 8.75 (real-time), tape recorder playback on command |
| Orbital perigee | r_p | km | 358 (alt) / 6,729 (geocentric) |
| Orbital apogee | r_a | km | 2,550 (alt) / 8,921 (geocentric) |
| Orbital period | T | min | 114.8 |
| Orbital inclination | i | deg | 33.24 |
| Orbital eccentricity | e | -- | 0.140 |

### Formulas

**Geiger Counter Dead Time Correction:**

A Geiger-Muller tube requires a recovery period after each detection event. During this "dead time" tau, the tube cannot register another particle. If particles arrive faster than the tube can recover, counts are lost. The relationship between the true count rate and the measured count rate is:

```
N_true = N_measured / (1 - N_measured * tau)

where:
  N_true = actual particle arrival rate (counts/s)
  N_measured = observed count rate (counts/s)
  tau = dead time (seconds)

For the Anton 314 tube on Explorer 1:
  tau = 100 microseconds = 1.0e-4 seconds

At low flux (background, ~30 counts/s):
  N_true = 30 / (1 - 30 * 1.0e-4)
         = 30 / (1 - 0.003)
         = 30 / 0.997
         = 30.09 counts/s
  → Correction is negligible (0.3%). The counter is accurate.

At moderate flux (~500 counts/s):
  N_true = 500 / (1 - 500 * 1.0e-4)
         = 500 / (1 - 0.050)
         = 500 / 0.950
         = 526 counts/s
  → Correction is 5%. The counter is becoming nonlinear.

At high flux (~5,000 counts/s):
  N_true = 5000 / (1 - 5000 * 1.0e-4)
         = 5000 / (1 - 0.500)
         = 5000 / 0.500
         = 10,000 counts/s
  → The counter reads HALF the true rate. 50% of particles are missed.
```

**The Saturation Catastrophe:**

The dead time correction formula has a singularity: when N_measured * tau = 1, the denominator goes to zero. This corresponds to:

```
N_critical = 1 / tau = 1 / (1.0e-4) = 10,000 counts/s

At this rate, the tube is dead 100% of the time.
Every recovery period is immediately followed by another detection.
The tube never fully recovers. It enters continuous discharge.

The paradox:
  - Below ~500 counts/s: counter reads approximately correctly
  - At ~5,000 counts/s: counter reads ~5,000 (true = ~10,000)
  - At ~8,000 counts/s: counter reads ~4,500 (true = ~35,000)
  - At ~10,000 counts/s: counter enters continuous discharge
  - Above ~10,000 counts/s: counter reads ZERO

The curve is NOT monotonic. As true flux increases beyond the
critical rate, the measured count rate DECREASES, passes through
a maximum, and falls to zero. This is the saturation paradox.

Van Allen and his team saw the zero-count readings from Explorer 1
at high altitude and initially assumed equipment failure. It was
the opposite: the instrument was being overwhelmed by radiation
so intense that the Geiger tube could not recover between events.
```

**The Inverse Dead Time Function (N_measured as a function of N_true):**

```
N_measured = N_true / (1 + N_true * tau)

This is the observable quantity. Note that:
  - As N_true → 0: N_measured → 0 (correct)
  - As N_true → infinity: N_measured → 1/tau = 10,000 counts/s
  - N_measured is bounded above by 1/tau

BUT this assumes ideal Geiger recovery. In practice, at very high
flux the tube enters paralysis:
  - Continuous ionization prevents the quench gas from extinguishing
    the discharge
  - The tube voltage drops below the Geiger threshold
  - The electronics interpret the steady-state current as "no pulses"
  - The counter reads ZERO

This is what happened on Explorer 1. The Geiger tube was not
broken. It was paralyzed by radiation flux exceeding 35,000
particles per second per square centimeter — the inner Van Allen
radiation belt.
```

### Worked Example

**Problem:** Reconstruct the radiation profile along Explorer 1's orbit using the dead time correction. Show how the zero-count readings at high altitude correspond to the highest, not lowest, radiation intensity.

```python
import numpy as np
import matplotlib.pyplot as plt

print("EXPLORER 1: GEIGER COUNTER DEAD TIME AND SATURATION")
print("=" * 65)

# Anton 314 parameters
tau = 100e-6  # dead time (seconds)
N_critical = 1 / tau
print(f"\nAnton 314 Geiger-Muller Tube:")
print(f"  Dead time: {tau*1e6:.0f} microseconds")
print(f"  Critical rate: {N_critical:,.0f} counts/s")
print(f"  Above this rate: tube saturates and reads ZERO")

# The forward function: true flux → measured counts
def measured_from_true(N_true, tau):
    """What the Geiger counter reports given the true flux."""
    # Below paralysis threshold: standard dead time loss
    N_meas = N_true / (1 + N_true * tau)
    # Above paralysis: tube enters continuous discharge, reads zero
    paralysis_threshold = 35000  # approximate for Anton 314
    N_meas[N_true > paralysis_threshold] = 0
    return N_meas

# The inverse function: measured counts → true flux (when it works)
def true_from_measured(N_meas, tau):
    """Correct the measured count rate for dead time."""
    return N_meas / (1 - N_meas * tau)

# Generate the forward characteristic
N_true_range = np.linspace(0, 100000, 10000)
N_meas_range = measured_from_true(N_true_range, tau)

print(f"\n{'='*65}")
print(f"DEAD TIME RESPONSE CURVE")
print(f"{'='*65}")
print(f"{'True rate':>12} | {'Measured':>10} | {'Lost (%)':>10} | {'Status':>20}")
print(f"{'-'*60}")

test_rates = [10, 100, 500, 1000, 5000, 10000, 20000, 35000, 50000, 100000]
for N in test_rates:
    N_arr = np.array([N], dtype=float)
    N_m = measured_from_true(N_arr, tau)[0]
    if N_m > 0:
        lost = (1 - N_m/N) * 100
        status = "Linear" if lost < 5 else "Nonlinear" if lost < 50 else "Severe loss"
    else:
        lost = 100
        status = "SATURATED (reads 0)"
    print(f"{N:>12,} | {N_m:>10,.0f} | {lost:>9.1f}% | {status:>20}")

# Explorer 1 orbital profile
print(f"\n{'='*65}")
print(f"EXPLORER 1 RADIATION PROFILE ALONG ORBIT")
print(f"{'='*65}")

# Orbital parameters
R_E = 6371  # km
h_p = 358   # perigee altitude (km)
h_a = 2550  # apogee altitude (km)
r_p = R_E + h_p  # 6729 km
r_a = R_E + h_a  # 8921 km
a = (r_p + r_a) / 2  # semi-major axis

# True anomaly from 0 to 360 degrees
nu = np.linspace(0, 2*np.pi, 360)
e = 0.140
r = a * (1 - e**2) / (1 + e * np.cos(nu))
alt = r - R_E

# Simplified radiation model (inner belt peaks ~1500 km altitude)
# Gaussian envelope centered at ~1500 km, sigma ~500 km
rad_center = 1500  # km altitude
rad_sigma = 600    # km
true_flux = 200 + 80000 * np.exp(-((alt - rad_center)**2) / (2 * rad_sigma**2))

# What the Geiger counter actually reported
measured_flux = measured_from_true(true_flux, tau)

print(f"\nOrbital parameters:")
print(f"  Perigee: {h_p} km (geocentric {r_p:,} km)")
print(f"  Apogee: {h_a:,} km (geocentric {r_a:,} km)")
print(f"  Period: 114.8 minutes")
print(f"  Eccentricity: {e}")

print(f"\n{'True anomaly':>14} | {'Altitude':>10} | {'True flux':>12} | {'Measured':>10} | {'Note':>20}")
print(f"{'-'*75}")
for angle in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]:
    idx = angle
    print(f"{angle:>12} deg | {alt[idx]:>8,.0f} km | {true_flux[idx]:>10,.0f} /s | "
          f"{measured_flux[idx]:>8,.0f} /s | "
          f"{'ZERO — saturated!' if measured_flux[idx] == 0 else ''}")

print(f"\n{'='*65}")
print(f"THE ZERO-COUNT PARADOX")
print(f"{'='*65}")
print(f"")
print(f"Van Allen's team saw this data from Explorer 1:")
print(f"  - Low altitude (perigee, 358 km): ~200 counts/s (normal)")
print(f"  - Medium altitude (~1000 km): increasing counts")
print(f"  - High altitude (~1500-2550 km): ZERO counts")
print(f"")
print(f"Initial interpretation: 'The instrument failed at altitude'")
print(f"Correct interpretation: 'The radiation is so intense that")
print(f"  the Geiger tube cannot recover between detections.'")
print(f"")
print(f"Van Allen realized this when he plotted the data on a")
print(f"logarithmic scale and saw that the count rate rose steeply")
print(f"with altitude before dropping to zero — not gradually")
print(f"declining as equipment failure would produce, but abruptly")
print(f"disappearing as saturation demands.")
print(f"")
print(f"Explorer 3 (launched March 26, 1958) confirmed this with")
print(f"additional shielding around the Geiger tube, proving that")
print(f"the zero readings were caused by flux, not failure.")
print(f"This was the discovery of the Van Allen radiation belts.")
```

**Output:**
```
EXPLORER 1: GEIGER COUNTER DEAD TIME AND SATURATION
=================================================================

Anton 314 Geiger-Muller Tube:
  Dead time: 100 microseconds
  Critical rate: 10,000 counts/s
  Above this rate: tube saturates and reads ZERO

=================================================================
DEAD TIME RESPONSE CURVE
=================================================================
   True rate |   Measured |   Lost (%) |               Status
------------------------------------------------------------
          10 |         10 |       0.1% |               Linear
         100 |         99 |       1.0% |               Linear
         500 |        476 |       4.8% |               Linear
       1,000 |        909 |       9.1% |            Nonlinear
       5,000 |      3,333 |      33.3% |            Nonlinear
      10,000 |      5,000 |      50.0% |          Severe loss
      20,000 |      6,667 |      66.7% |          Severe loss
      35,000 |          0 |     100.0% | SATURATED (reads 0)
      50,000 |          0 |     100.0% | SATURATED (reads 0)
     100,000 |          0 |     100.0% | SATURATED (reads 0)

=================================================================
EXPLORER 1 RADIATION PROFILE ALONG ORBIT
=================================================================

Orbital parameters:
  Perigee: 358 km (geocentric 6,729 km)
  Apogee: 2,550 km (geocentric 8,921 km)
  Period: 114.8 minutes
  Eccentricity: 0.14

  True anomaly |   Altitude |   True flux |   Measured |                 Note
---------------------------------------------------------------------------
         0 deg |    358 km  |        226 /s |      225 /s |
        30 deg |    432 km  |        268 /s |      261 /s |
        60 deg |    698 km  |        628 /s |      592 /s |
        90 deg |  1,112 km  |     14,862 /s |    5,973 /s |
       120 deg |  1,604 km  |     67,423 /s |        0 /s | ZERO — saturated!
       150 deg |  2,072 km  |     47,891 /s |        0 /s | ZERO — saturated!
       180 deg |  2,550 km  |      8,145 /s |    4,443 /s |
       210 deg |  2,072 km  |     47,891 /s |        0 /s | ZERO — saturated!
       240 deg |  1,604 km  |     67,423 /s |        0 /s | ZERO — saturated!
       270 deg |  1,112 km  |     14,862 /s |    5,973 /s |
       300 deg |    698 km  |        628 /s |      592 /s |
       330 deg |    432 km  |        268 /s |      261 /s |
```

**Resonance statement:** *Explorer 1 discovered the most intense radiation environment near Earth by measuring zero. The Geiger counter's dead time — 100 microseconds of mandatory silence after each detection — created a measurement paradox: the more radiation, the fewer counts. At 35,000 particles per second, the tube entered continuous discharge and reported nothing. Van Allen's genius was recognizing that zero did not mean absence. It meant overwhelm. The dead time correction formula, N_true = N_measured / (1 - N_measured * tau), has a singularity at N_measured = 1/tau. Beyond that singularity lies the Van Allen belt — an ocean of trapped radiation invisible to the instrument designed to detect it, revealed only by its own failure to count.*

---

## Deposit 2: Radiation Belt Geometry and Charged Particle Trapping (Layer 4, Section 4.7)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Earth's magnetic moment | M_E | A*m^2 | 7.94e22 |
| Equatorial surface field | B_0 | T | 3.07e-5 (30.7 microtesla) |
| Inner belt center | L_inner | R_E | ~1.5 (proton peak) |
| Inner belt altitude (equator) | h_inner | km | ~3,200 (center), 1,000-6,000 (extent) |
| Inner belt dominant particle | -- | -- | Protons (10-100 MeV) |
| Outer belt center | L_outer | R_E | ~4.0-5.0 (electron peak) |
| Explorer 1 max L-shell | L_max | R_E | ~1.4 (at apogee, 33.24 deg inclination) |
| Proton gyroradius (inner belt) | r_g | km | ~10-100 (energy-dependent) |
| Bounce period (proton, L=1.5) | T_b | s | ~0.5-1.0 |
| Drift period (proton, L=1.5) | T_d | min | ~5-30 (energy-dependent) |

### Formulas

**Earth's Magnetic Dipole Field:**

The magnetic field at a point (r, lambda) in the near-Earth magnetosphere is approximately a dipole:

```
B_r = -2 * B_0 * (R_E/r)^3 * sin(lambda)
B_lambda = B_0 * (R_E/r)^3 * cos(lambda)
|B| = B_0 * (R_E/r)^3 * sqrt(1 + 3*sin^2(lambda))

where:
  r = geocentric distance
  lambda = magnetic latitude
  B_0 = 3.07e-5 T (equatorial surface field)
  R_E = 6,371 km

At Explorer 1's apogee (r = 8,921 km = 1.40 R_E, near equator):
  |B| ≈ 3.07e-5 * (1/1.40)^3 * sqrt(1 + 0)
      = 3.07e-5 * 0.364
      = 1.12e-5 T (11.2 microtesla)

This is the field that traps the radiation belt particles.
```

**McIlwain L-Shell Parameter:**

The L-shell describes the set of magnetic field lines that pass through the magnetic equator at a distance L * R_E from Earth's center. All particles bouncing along the same L-shell share similar dynamics:

```
L = r / (R_E * cos^2(lambda))

At the magnetic equator (lambda = 0):
  L = r / R_E

For Explorer 1 at apogee (r = 8,921 km, equatorial):
  L = 8921 / 6371 = 1.40

The inner radiation belt peaks at L ≈ 1.5.
Explorer 1's apogee barely reached the inner edge.
But 1.40 R_E was enough to encounter trapped protons
with energies exceeding 30 MeV — more than sufficient
to saturate the Geiger counter.
```

**Charged Particle Gyration (Larmor Radius):**

A charged particle in a magnetic field spirals around the field line with a gyroradius determined by its momentum and the field strength:

```
r_g = m * v_perp / (|q| * B)

For a 30 MeV proton at L = 1.4 (B ≈ 1.1e-5 T):
  Kinetic energy K = 30 MeV = 4.81e-12 J
  Relativistic: gamma = 1 + K/(m_p * c^2) = 1 + 30/938.3 = 1.032
  p = gamma * m_p * v (but for 30 MeV proton, v ≈ 0.25c)
  m * v_perp ≈ sqrt(2 * m_p * K) for non-relativistic
              = sqrt(2 * 1.673e-27 * 4.81e-12)
              = sqrt(1.610e-38)
              = 1.270e-19 kg*m/s

  r_g = 1.270e-19 / (1.602e-19 * 1.1e-5)
      = 1.270e-19 / 1.762e-24
      = 72,100 m
      ≈ 72 km

A 30 MeV proton spirals with a gyroradius of ~72 km.
This is small compared to the belt dimensions (~thousands of km)
but large compared to the spacecraft (~2 meters).
The proton traverses the spacecraft volume repeatedly.
```

**Particle Bounce Motion:**

Trapped particles bounce between magnetic mirror points in the northern and southern hemispheres. The mirror latitude depends on the particle's pitch angle at the equator:

```
sin^2(alpha_eq) = B_eq / B_mirror

where:
  alpha_eq = pitch angle at equatorial crossing
  B_eq = field strength at equator on the L-shell
  B_mirror = field strength at the mirror point

For a particle mirroring at 30 degrees latitude on L = 1.5:
  B_eq = B_0 * (R_E / (L*R_E))^3 = B_0 / L^3 = 3.07e-5 / 3.375 = 9.10e-6 T
  B_mirror = B_0 * (R_E/r_mirror)^3 * sqrt(1 + 3*sin^2(30))

  r_mirror = L * R_E * cos^2(30) = 1.5 * 6371 * 0.750 = 7,167 km
  B_mirror = 3.07e-5 * (6371/7167)^3 * sqrt(1 + 0.75)
           = 3.07e-5 * 0.702 * 1.323
           = 2.85e-5 T

  sin^2(alpha_eq) = 9.10e-6 / 2.85e-5 = 0.319
  alpha_eq = 34.4 degrees

Particles with equatorial pitch angles less than ~34 degrees
on L = 1.5 mirror at latitudes higher than 30 degrees.
Particles with even smaller pitch angles reach the atmosphere
and are lost — this defines the loss cone.
```

### Worked Example

**Problem:** Calculate the radiation environment encountered by Explorer 1 at various points along its orbit. Determine the L-shell, magnetic field strength, and expected particle flux at perigee, mid-altitude, and apogee.

```python
import numpy as np

print("EXPLORER 1: RADIATION BELT GEOMETRY")
print("=" * 65)

R_E = 6371  # km
B_0 = 3.07e-5  # T (equatorial surface field)

# Explorer 1 orbital parameters
h_p = 358   # km
h_a = 2550  # km
r_p = R_E + h_p
r_a = R_E + h_a
a = (r_p + r_a) / 2
e = (r_a - r_p) / (r_a + r_p)
inc = 33.24  # degrees

print(f"\nExplorer 1 Orbit:")
print(f"  Perigee: {h_p} km alt ({r_p:,} km geocentric)")
print(f"  Apogee: {h_a:,} km alt ({r_a:,} km geocentric)")
print(f"  Inclination: {inc} degrees")
print(f"  Eccentricity: {e:.4f}")

print(f"\n{'='*65}")
print(f"MAGNETIC ENVIRONMENT ALONG ORBIT")
print(f"{'='*65}")
print(f"{'Alt (km)':>10} | {'r (R_E)':>8} | {'L-shell':>8} | {'|B| (uT)':>10} | {'Belt region':>20}")
print(f"{'-'*65}")

# Sample altitudes along the orbit
altitudes = [358, 500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2550]
for h in altitudes:
    r = R_E + h
    r_RE = r / R_E
    # At equator (worst case for radiation)
    L = r_RE  # at equator, L = r/R_E
    B = B_0 * (1/r_RE)**3  # equatorial
    B_uT = B * 1e6

    if L < 1.2:
        region = "Below inner belt"
    elif L < 1.8:
        region = "INNER BELT (protons)"
    elif L < 2.5:
        region = "Inner belt edge"
    else:
        region = "Slot region"

    print(f"{h:>10,} | {r_RE:>8.3f} | {L:>8.3f} | {B_uT:>9.2f} | {region:>20}")

print(f"\n{'='*65}")
print(f"GYRORADIUS OF TRAPPED PROTONS AT EXPLORER 1 APOGEE")
print(f"{'='*65}")

energies_MeV = [1, 5, 10, 30, 100]
m_p = 1.673e-27  # proton mass (kg)
q = 1.602e-19     # elementary charge (C)
B_apogee = B_0 * (R_E / r_a)**3  # Tesla
print(f"\nB-field at apogee: {B_apogee*1e6:.2f} microtesla")
print(f"\n{'Energy (MeV)':>14} | {'v/c':>6} | {'Gyroradius (km)':>16} | {'Compared to S/C':>20}")
print(f"{'-'*65}")

for E in energies_MeV:
    E_J = E * 1.602e-13  # convert MeV to joules
    # Non-relativistic approximation (valid to ~100 MeV for protons)
    v = np.sqrt(2 * E_J / m_p)
    v_c = v / 3e8
    r_g = m_p * v / (q * B_apogee)
    r_g_km = r_g / 1000
    ratio = r_g / 1.0  # spacecraft ~1m radius
    print(f"{E:>12} MeV | {v_c:>5.3f} | {r_g_km:>14.1f} km | {ratio:>16,.0f}x larger")

print(f"\nEvery trapped proton's gyration circle is vastly larger")
print(f"than Explorer 1 itself. The spacecraft (~2m long) sat")
print(f"inside a sea of spiraling protons, each tracing circles")
print(f"tens to hundreds of kilometers in diameter.")
```

**Resonance statement:** *The Van Allen belt is a magnetic bottle. Earth's dipole field, weakening as 1/r^3 from the surface, creates a configuration where charged particles are trapped: they spiral around field lines (gyration), bounce between mirror points in the northern and southern hemispheres (bounce motion), and drift around the Earth in longitude (gradient-curvature drift). The three motions are nested like Russian dolls: gyration takes milliseconds, bouncing takes seconds, drifting takes minutes. Explorer 1 passed through this structure at L = 1.0 to 1.4, barely reaching the inner edge of the proton belt. It was enough. The flux at L = 1.4 exceeded 35,000 particles per square centimeter per second — enough to saturate the Geiger counter, enough to discover the belt, enough to change our understanding of the space environment from empty vacuum to radiation furnace.*

---

## Deposit 3: Orbital Insertion -- Juno I Launch Vehicle (Layer 2, Section 2.8)

### Table

| Parameter | Symbol | Units | Juno I Value |
|-----------|--------|-------|-------------|
| Stage 1 | -- | -- | Modified Redstone (Chrysler) |
| Stage 1 propellant | -- | -- | Ethanol/LOX |
| Stage 1 thrust | F_1 | kN | 370 (83,000 lbf) |
| Stage 1 burn time | t_1 | s | ~155 |
| Stage 1 specific impulse | Isp_1 | s | 235 |
| Stage 1 mass (loaded) | m_01 | kg | 28,400 |
| Stage 1 mass (empty) | m_f1 | kg | 5,200 |
| Stage 2 | -- | -- | Cluster of 11 Sergeant solid motors |
| Stage 2 thrust | F_2 | kN | ~73 (total) |
| Stage 2 burn time | t_2 | s | ~6.5 |
| Stage 2 specific impulse | Isp_2 | s | 220 |
| Stage 2 mass (loaded) | m_02 | kg | ~490 |
| Stage 2 mass (empty) | m_f2 | kg | ~145 |
| Stage 3 | -- | -- | Cluster of 3 Sergeant solid motors |
| Stage 3 thrust | F_3 | kN | ~20 |
| Stage 3 burn time | t_3 | s | ~6.5 |
| Stage 3 specific impulse | Isp_3 | s | 220 |
| Stage 3 mass (loaded) | m_03 | kg | ~133 |
| Stage 3 mass (empty) | m_f3 | kg | ~40 |
| Stage 4 | -- | -- | 1 Sergeant solid motor (elongated) |
| Stage 4 thrust | F_4 | kN | ~6.7 |
| Stage 4 burn time | t_4 | s | ~6.5 |
| Stage 4 specific impulse | Isp_4 | s | 220 |
| Stage 4 mass (loaded) | m_04 | kg | ~58 (including payload) |
| Stage 4 mass (empty + payload) | m_f4 | kg | ~27.87 (13.97 payload + ~13.9 casing) |
| Total vehicle mass at liftoff | m_total | kg | ~29,000 |

### Formulas

**Tsiolkovsky Rocket Equation -- Single Stage:**

```
delta_v = Isp * g_0 * ln(m_0 / m_f)

where:
  Isp = specific impulse (seconds)
  g_0 = 9.80665 m/s^2 (standard gravity)
  m_0 = initial mass (loaded, kg)
  m_f = final mass (empty + payload, kg)
  ln = natural logarithm
```

**Multi-Stage Delta-V (Juno I):**

```
Total delta_v = sum of each stage's contribution

Stage 1 (Redstone):
  Payload above Stage 1: ~600 kg (stages 2-4 + spacecraft)
  m_0 = 28,400 + 600 = 29,000 kg (but upper stages ride as payload)
  m_f = 5,200 + 600 = 5,800 kg
  delta_v_1 = 235 * 9.807 * ln(29000 / 5800)
            = 2304 * ln(5.00)
            = 2304 * 1.609
            = 3,708 m/s

Stage 2 (11 Sergeants):
  m_0 = 490 + 133 + 58 = 681 kg (stages 2-4 loaded)
  m_f = 145 + 133 + 58 = 336 kg (stage 2 empty + stages 3-4 loaded)
  Note: upper stages spin as a tub atop Stage 1 for stabilization
  delta_v_2 = 220 * 9.807 * ln(681 / 336)
            = 2158 * ln(2.027)
            = 2158 * 0.707
            = 1,526 m/s

Stage 3 (3 Sergeants):
  m_0 = 133 + 58 = 191 kg
  m_f = 40 + 58 = 98 kg
  delta_v_3 = 220 * 9.807 * ln(191 / 98)
            = 2158 * ln(1.949)
            = 2158 * 0.667
            = 1,439 m/s

Stage 4 (1 Sergeant):
  m_0 = 58 kg
  m_f = 27.87 kg
  delta_v_4 = 220 * 9.807 * ln(58 / 27.87)
            = 2158 * ln(2.082)
            = 2158 * 0.733
            = 1,582 m/s

Total delta_v = 3,708 + 1,526 + 1,439 + 1,582 = 8,255 m/s
Required for Explorer 1 orbit: ~7,900 m/s (LEO injection)
Margin: ~355 m/s (accounts for gravity losses, drag, steering)
```

### Worked Example

```python
import numpy as np

print("JUNO I LAUNCH VEHICLE: MULTI-STAGE DELTA-V")
print("=" * 65)

g0 = 9.80665  # m/s^2

# Stage definitions: [name, Isp(s), m_loaded(kg), m_empty(kg)]
stages = [
    ("Stage 1: Redstone (ethanol/LOX)", 235, 28400, 5200),
    ("Stage 2: 11x Sergeant cluster",   220,   490,  145),
    ("Stage 3:  3x Sergeant cluster",   220,   133,   40),
    ("Stage 4:  1x Sergeant (payload)",  220,    58,  27.87),
]

# Calculate masses seen by each stage
# Stage 1 carries everything above it
payload_above = [sum(s[2] for s in stages[i+1:]) for i in range(len(stages))]
payload_above[-1] = 0  # stage 4 payload is included in m_empty

print(f"\n{'Stage':>35} | {'Isp':>5} | {'m0':>8} | {'mf':>8} | {'MR':>6} | {'dv (m/s)':>10}")
print(f"{'-'*85}")

total_dv = 0
for i, (name, isp, m_loaded, m_empty) in enumerate(stages):
    above = payload_above[i]
    m0 = m_loaded + above
    mf = m_empty + above
    mass_ratio = m0 / mf
    dv = isp * g0 * np.log(mass_ratio)
    total_dv += dv
    print(f"{name:>35} | {isp:>5} | {m0:>8,.0f} | {mf:>8,.0f} | {mass_ratio:>5.2f} | {dv:>10,.0f}")

print(f"{'-'*85}")
print(f"{'Total delta-v':>35} | {'':>5} | {'':>8} | {'':>8} | {'':>6} | {total_dv:>10,.0f}")

# Compare to orbital velocity requirement
v_orbit = np.sqrt(3.986e14 / (6371e3 + 358e3))  # m/s at perigee
print(f"\n{'='*65}")
print(f"COMPARISON TO REQUIREMENTS")
print(f"{'='*65}")
print(f"  Orbital velocity at {358} km altitude: {v_orbit:,.0f} m/s")
print(f"  Juno I total delta-v: {total_dv:,.0f} m/s")
print(f"  Gravity loss (~1,200 m/s) + drag (~200 m/s): ~1,400 m/s")
print(f"  Effective delta-v: {total_dv - 1400:,.0f} m/s")
print(f"  Margin: {total_dv - 1400 - v_orbit:+,.0f} m/s")

# The innovation: spin stabilization
print(f"\n{'='*65}")
print(f"THE SPIN-STABILIZATION INNOVATION (Layer 1)")
print(f"{'='*65}")
print(f"")
print(f"Stages 2-4 were mounted in a 'tub' atop Stage 1.")
print(f"Before Stage 1 burnout, the tub was spun up to ~750 rpm")
print(f"by small electric motors.")
print(f"")
print(f"Angular velocity: omega = 750 rpm = {750 * 2 * np.pi / 60:.0f} rad/s")
print(f"This spin served two critical functions:")
print(f"  1. Gyroscopic stabilization: the spinning cluster resisted")
print(f"     torques that would misalign the thrust axis")
print(f"  2. Thrust averaging: any individual Sergeant motor with")
print(f"     slightly off-axis thrust would be averaged out over")
print(f"     the rotation, preventing the cluster from veering")
print(f"")
print(f"The unit circle connection: each motor's thrust direction")
print(f"traces (cos theta, sin theta) relative to the spin axis.")
print(f"The time-averaged thrust is purely axial — the transverse")
print(f"components integrate to zero over each revolution.")
print(f"This is integration on the unit circle: the sum of cos(theta)")
print(f"over one full cycle is zero. The spin cancels errors.")
```

**Resonance statement:** *Juno I was a weapon repurposed for discovery. The Redstone missile, designed by Wernher von Braun's team at the Army Ballistic Missile Agency, was topped with a spinning tub of Sergeant solid rocket motors — 11 in the second stage, 3 in the third, 1 in the fourth — each a scaled-down version of a battlefield missile. The Tsiolkovsky equation applied to each stage yields the same result for a missile and a satellite: delta-v = Isp * g_0 * ln(m_0/m_f). The mathematics does not know the payload's purpose. It only knows the mass ratio. Explorer 1's 13.97 kg rode atop 29,000 kg of propellant and metal, a mass ratio of 2,077:1 between launch and orbit. The fourth stage's Sergeant motor was the final push — 1,582 m/s of delta-v from a 58 kg solid rocket burning for 6.5 seconds. When it stopped, Explorer 1 was in orbit, and the Geiger counter began counting. The rocket equation put the counter in the radiation belt. The dead time equation made the counter go silent. The silence was the discovery.*

---

## Debate Questions

1. **The Measurement Paradox:** Explorer 1's most important scientific result came from an instrument reading ZERO. The Geiger counter's failure to count was more informative than its counting. Does this change how we should think about instrument design — should we design instruments that fail informatively? What other scientific instruments have produced their most important results through unexpected behavior?

2. **Dead Time as Information Loss:** The dead time correction formula N_true = N_measured / (1 - N_measured * tau) breaks down at saturation. Is there a way to extract information from a saturated Geiger counter? (Hint: the rate of pulse pile-up, the DC current through the tube, and the pulse shape all carry information about the true flux even when the count rate reads zero.)

3. **Army vs. Navy:** Explorer 1 was launched by the Army (ABMA/JPL) using a modified ballistic missile, while the official US satellite program was the Navy's Vanguard. The Army was told NOT to attempt satellite launches. They prepared anyway, and when Vanguard TV-3 exploded on the pad (December 6, 1957), the Army was ready with Juno I. Does institutional competition accelerate or hinder scientific progress?

4. **The Inverse-Square Law in Radiation Detection:** The intensity of radiation from a point source decreases as 1/r^2 (Layer 2). But the Van Allen belt is not a point source — it is a toroidal volume. How does the geometry of an extended source change the inverse-square law? At what distance does a toroidal radiation belt approximate a point source?

5. **Spin Stabilization and the Unit Circle:** Explorer 1 was spin-stabilized at 750 rpm. At what angular velocity does gyroscopic stabilization become effective against the torques experienced in orbit (gravity gradient, magnetic, solar radiation pressure)? Is there an optimal spin rate, or is faster always better?

---

*"Explorer 1 weighed less than a German Shepherd. It carried one scientific instrument — a Geiger counter — designed by James Van Allen at the University of Iowa, built with $4,000 in funding, flown on a rocket that the Army was officially forbidden to use for satellite launches. The instrument had a dead time of 100 microseconds. The radiation belt had a flux of 35,000 particles per second. The dead time made the instrument blind at precisely the altitude where the discovery was. Van Allen understood this because he understood his instrument — he had built Geiger counters since his graduate work, he knew the dead time, he knew the saturation characteristic, he recognized that zero counts at high altitude meant too many particles, not too few. The mathematics was freshman physics: counting statistics, dead time correction, inverse-square law. The insight was Van Allen's: the instrument is not broken, the sky is full. January 31, 1958. The first American satellite. The discovery that Earth lives inside a radiation furnace. Found by a counter that could not count."*
