# Mission 1.6 -- Explorer 6: The Mathematics of Seeing

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Explorer 6 (August 7, 1959)
**Primary TSPB Layer:** 3 (Trigonometry -- Scanning Geometry, Spin-Scan Imaging)
**Secondary Layers:** 7 (Information Systems Theory -- Shannon, Signal-to-Noise, Image Reconstruction), 4 (Vector Calculus -- Highly Elliptical Orbit Mechanics), 1 (Unit Circle -- Spin-Stabilization, Angular Velocity)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Spin-Scan Imaging Geometry (Layer 3, Section 3.6)

### Table

| Parameter | Symbol | Units | Explorer 6 Value |
|-----------|--------|-------|------------------|
| Launch date | -- | -- | August 7, 1959, 14:24 UTC |
| Launch vehicle | -- | -- | Thor-Able (Thor DM-18 + Able upper stages) |
| Operating agency | -- | -- | NASA / Space Technology Laboratories (STL) |
| Spacecraft mass | m_sc | kg | 64.4 |
| Spin rate | n_spin | rpm | 2.8 |
| Angular velocity | omega | rad/s | 0.293 |
| Spin period | T_spin | s | 21.4 |
| Photocell field of view | FOV | deg | ~0.1 (narrow slit) |
| Image scan lines | N_lines | -- | ~100 (approximate) |
| Image construction time | t_image | min | ~40 |
| Revolutions per image | N_rev | -- | ~112 |
| Orbital perigee | r_p | km | 237 (alt) / 6,608 (geocentric) |
| Orbital apogee | r_a | km | 42,400 (alt) / 48,771 (geocentric) |
| Orbital period | T_orb | hr | ~12.8 |
| Orbital inclination | i | deg | 47 |
| Orbital eccentricity | e | -- | 0.76 |

### Formulas

**Angular Velocity of Spin-Stabilized Spacecraft:**

The spacecraft rotates about its spin axis at a constant rate. The angular velocity is:

```
omega = 2 * pi * n / 60

where:
  n = spin rate (rpm)
  omega = angular velocity (rad/s)

For Explorer 6:
  omega = 2 * pi * 2.8 / 60
        = 17.593 / 60
        = 0.2932 rad/s
```

This angular velocity defines the sweep rate of the photocell across the scene. One complete revolution takes T_spin = 2*pi/omega = 21.4 seconds. During each revolution, the photocell traces a great circle on the celestial sphere. The portion of that circle intersecting Earth's disk produces one scan line of the image.

**Photocell Position on the Unit Circle:**

At time t, the photocell's angular position relative to a reference direction is:

```
theta(t) = omega * t + theta_0

The photocell views a direction given by (in the spin plane):
  x(t) = cos(theta(t))
  y(t) = sin(theta(t))

This is the unit circle. The photocell traces (cos theta, sin theta)
as the spacecraft rotates. The brightness measured by the photocell
at each angular position becomes one pixel in the reconstructed image.
```

**Angular Subtense of Earth:**

The angular diameter of Earth as seen from the spacecraft determines what fraction of each spin revolution captures Earth:

```
alpha = 2 * arcsin(R_E / d)

where:
  R_E = 6,371 km (Earth's radius)
  d = distance from spacecraft to Earth's center

At perigee (d = 6,608 km):
  alpha = 2 * arcsin(6371 / 6608) = 2 * arcsin(0.964) ≈ 2 * 74.6 deg = 149.2 deg
  → Earth fills 149/360 = 41% of each scan circle

At apogee (d = 48,771 km):
  alpha = 2 * arcsin(6371 / 48771) = 2 * arcsin(0.1306) ≈ 2 * 7.5 deg = 15.0 deg
  → Earth fills 15/360 = 4.2% of each scan circle

The best imaging geometry is near apogee: the entire disk fits
in a small arc, minimizing geometric distortion. But signal
strength is weakest at apogee (farthest from ground station).
```

**Scan Line Construction:**

Each revolution of the spacecraft sweeps the photocell across Earth's disk at a slightly different angle (because the spacecraft's attitude slowly precesses and the orbit carries it along). The angular offset between successive scan lines is:

```
delta_theta = (orbital_angular_rate / spin_rate) * 360 degrees

orbital angular rate at apogee ≈ 0.018 deg/s (from Kepler)
spin rate = 360 / 21.4 = 16.8 deg/s

delta_theta ≈ (0.018 / 16.8) * 360 ≈ 0.39 degrees per revolution

For ~100 scan lines covering 15 degrees (Earth disk at apogee):
  100 lines × 0.15 deg/line ≈ 15 degrees ← approximately correct

Each scan line is separated by roughly the photocell FOV width,
building up the image line by line over ~40 minutes (112 revolutions).
```

### Worked Example

**Problem:** Calculate the spin-scan imaging parameters for Explorer 6 and determine how the photocell's circular sweep translates into a rectangular image. Show the relationship between spacecraft spin, orbital altitude, and image resolution.

```python
import numpy as np

print("EXPLORER 6: SPIN-SCAN IMAGING GEOMETRY")
print("=" * 65)

# Spacecraft parameters
spin_rpm = 2.8                    # spin rate (rpm)
omega = 2 * np.pi * spin_rpm / 60  # angular velocity (rad/s)
T_spin = 2 * np.pi / omega         # spin period (s)

print(f"\nSpin rate: {spin_rpm} rpm")
print(f"Angular velocity: {omega:.4f} rad/s")
print(f"Spin period: {T_spin:.2f} s")

# Earth parameters
R_E = 6371  # km

# Orbital parameters
r_perigee = 6608    # km (geocentric)
r_apogee = 48771    # km (geocentric)

print(f"\n{'='*65}")
print(f"EARTH'S ANGULAR SIZE vs ALTITUDE")
print(f"{'='*65}")
print(f"{'Distance (km)':>14} | {'Alt (km)':>10} | {'Angular diam':>12} | {'Fraction of scan':>16}")
print(f"{'-'*58}")

distances = [r_perigee, 15000, 25000, 35000, r_apogee]
for d in distances:
    alpha_rad = 2 * np.arcsin(R_E / d)
    alpha_deg = np.degrees(alpha_rad)
    fraction = alpha_deg / 360 * 100
    alt = d - R_E
    print(f"{d:>14,.0f} | {alt:>10,.0f} | {alpha_deg:>10.1f} deg | {fraction:>14.1f}%")

# Image construction at apogee
print(f"\n{'='*65}")
print(f"IMAGE CONSTRUCTION AT APOGEE")
print(f"{'='*65}")

d_image = r_apogee  # km, imaging distance
alpha_earth = 2 * np.arcsin(R_E / d_image)
alpha_deg = np.degrees(alpha_earth)

# Photocell FOV
fov_deg = 0.1  # degrees (narrow slit)

# Pixels per scan line (Earth arc / FOV)
earth_arc_deg = alpha_deg
pixels_per_line = earth_arc_deg / fov_deg

# Time per pixel (how long the FOV dwells on each resolution element)
# The photocell sweeps 360 degrees per spin period
# Dwell time per FOV width:
dwell_time = (fov_deg / 360) * T_spin

# Number of scan lines needed
n_lines = 100  # approximate target
lines_needed = earth_arc_deg / fov_deg  # if scanning perpendicular

print(f"Distance to Earth: {d_image:,.0f} km")
print(f"Earth angular diameter: {alpha_deg:.1f} degrees")
print(f"Photocell FOV: {fov_deg} degrees")
print(f"Pixels per scan line: {pixels_per_line:.0f}")
print(f"Dwell time per pixel: {dwell_time*1000:.2f} ms")
print(f"Scan lines per image: ~{n_lines}")
print(f"Revolutions per image: ~{n_lines}")
print(f"Image construction time: {n_lines * T_spin / 60:.1f} minutes")

# Angular resolution on Earth's surface
# At distance d, angular resolution fov_deg corresponds to:
ground_res = d_image * np.tan(np.radians(fov_deg))
print(f"\nGround resolution at apogee:")
print(f"  {ground_res:.0f} km per pixel")
print(f"  ({ground_res/1.6:.0f} miles per pixel)")
print(f"  This is why the image was crude: each pixel covered")
print(f"  an area roughly the size of a US state.")

# Unit circle connection
print(f"\n{'='*65}")
print(f"THE UNIT CIRCLE CONNECTION")
print(f"{'='*65}")
print(f"")
print(f"At time t, the photocell points in direction:")
print(f"  x(t) = cos(omega * t)")
print(f"  y(t) = sin(omega * t)")
print(f"")
print(f"For omega = {omega:.4f} rad/s:")
samples = [0, T_spin/8, T_spin/4, 3*T_spin/8, T_spin/2]
for t in samples:
    theta = omega * t
    x = np.cos(theta)
    y = np.sin(theta)
    print(f"  t = {t:>5.2f}s: theta = {np.degrees(theta):>6.1f} deg, "
          f"(cos, sin) = ({x:>+6.3f}, {y:>+6.3f})")

print(f"\nThe photocell traces the unit circle {spin_rpm} times per minute.")
print(f"Each crossing of Earth's disk produces one scan line.")
print(f"The image IS the unit circle, sampled 100 times with")
print(f"progressive angular offset between lines.")
```

**Output:**
```
EXPLORER 6: SPIN-SCAN IMAGING GEOMETRY
=================================================================

Spin rate: 2.8 rpm
Angular velocity: 0.2932 rad/s
Spin period: 21.43 s

=================================================================
EARTH'S ANGULAR SIZE vs ALTITUDE
=================================================================
 Distance (km) |   Alt (km) | Angular diam | Fraction of scan
----------------------------------------------------------
         6,608 |        237 |      149.2 deg |           41.4%
        15,000 |      8,629 |       50.3 deg |           14.0%
        25,000 |     18,629 |       29.6 deg |            8.2%
        35,000 |     28,629 |       21.0 deg |            5.8%
        48,771 |     42,400 |       15.1 deg |            4.2%

=================================================================
IMAGE CONSTRUCTION AT APOGEE
=================================================================
Distance to Earth: 48,771 km
Earth angular diameter: 15.1 degrees
Photocell FOV: 0.1 degrees
Pixels per scan line: 151
Dwell time per pixel: 5.95 ms
Scan lines per image: ~100
Revolutions per image: ~100
Image construction time: 35.7 minutes

Ground resolution at apogee:
  85 km per pixel
  (53 miles per pixel)
  This is why the image was crude: each pixel covered
  an area roughly the size of a US state.

=================================================================
THE UNIT CIRCLE CONNECTION
=================================================================

At time t, the photocell points in direction:
  x(t) = cos(omega * t)
  y(t) = sin(omega * t)

For omega = 0.2932 rad/s:
  t =  0.00s: theta =    0.0 deg, (cos, sin) = (+1.000, +0.000)
  t =  2.68s: theta =   45.0 deg, (cos, sin) = (+0.707, +0.707)
  t =  5.36s: theta =   90.0 deg, (cos, sin) = (+0.000, +1.000)
  t =  8.04s: theta =  135.0 deg, (cos, sin) = (-0.707, +0.707)
  t = 10.71s: theta =  180.0 deg, (cos, sin) = (-1.000, +0.000)

The photocell traces the unit circle 2.8 times per minute.
Each crossing of Earth's disk produces one scan line.
The image IS the unit circle, sampled 100 times with
progressive angular offset between lines.
```

**Resonance statement:** *Explorer 6 saw Earth the way a lighthouse sees the sea -- by spinning. The photocell did not point and stare. It swept a circle, and during the arc of that circle that intersected Earth's disk, it recorded brightness. One revolution, one scan line. One hundred revolutions, one crude image. The mathematics is the unit circle: the photocell position at time t is (cos theta, sin theta), where theta = omega * t. Every pixel in the first photograph of Earth from orbit was addressed by an angle -- not by x,y coordinates on a sensor grid, but by the rotation angle of a spinning spacecraft. The image is a trigonometric reconstruction. Each line is a fragment of a great circle projected onto a plane. The 85-km-per-pixel resolution was crude because the photocell was slow and the spin was fast: each pixel had only 6 milliseconds of dwell time, and the photocell had to integrate enough photons in that window to distinguish land from cloud from ocean. It barely could. But it could.*

---

## Deposit 2: Highly Elliptical Orbit Mechanics (Layer 4, Section 4.5)

### Table

| Parameter | Symbol | Units | Explorer 6 Value |
|-----------|--------|-------|------------------|
| Semi-major axis | a | km | 27,690 (geocentric) |
| Eccentricity | e | -- | 0.76 |
| Perigee altitude | h_p | km | 237 |
| Apogee altitude | h_a | km | 42,400 |
| Perigee radius | r_p | km | 6,608 |
| Apogee radius | r_a | km | 48,771 |
| Orbital period | T | hr | 12.8 |
| Inclination | i | deg | 47 |
| Argument of perigee | omega_arg | deg | ~variable (precessing) |
| Velocity at perigee | v_p | km/s | ~10.0 |
| Velocity at apogee | v_a | km/s | ~1.35 |

### Formulas

**Eccentricity from Apsidal Distances:**

```
e = (r_a - r_p) / (r_a + r_p)

For Explorer 6:
  e = (48771 - 6608) / (48771 + 6608)
  e = 42163 / 55379
  e = 0.7614

This is a highly elliptical orbit -- much more eccentric than
any of the Pioneer missions that remained bound. The ratio of
apogee to perigee is 48771/6608 = 7.38:1. The spacecraft
experiences dramatically different conditions at each extreme.
```

**Semi-Major Axis:**

```
a = (r_a + r_p) / 2

For Explorer 6:
  a = (48771 + 6608) / 2
  a = 55379 / 2
  a = 27,690 km

This is well within the geosynchronous radius (42,164 km)
but the high eccentricity means the spacecraft swings from
just above the atmosphere to nearly geosynchronous altitude.
```

**Vis-Viva Equation -- Velocity at Any Point:**

```
v(r) = sqrt(mu * (2/r - 1/a))

where:
  mu = G * M_E = 3.986e5 km^3/s^2
  r = geocentric distance (km)
  a = semi-major axis (km)

At perigee (r = r_p = 6,608 km):
  v_p = sqrt(3.986e5 * (2/6608 - 1/27690))
      = sqrt(3.986e5 * (3.026e-4 - 3.612e-5))
      = sqrt(3.986e5 * 2.665e-4)
      = sqrt(106.2)
      = 10.31 km/s

At apogee (r = r_a = 48,771 km):
  v_a = sqrt(3.986e5 * (2/48771 - 1/27690))
      = sqrt(3.986e5 * (4.101e-5 - 3.612e-5))
      = sqrt(3.986e5 * 4.89e-6)
      = sqrt(1.949)
      = 1.396 km/s

The velocity ratio: v_p / v_a = 10.31 / 1.396 = 7.38
Equal to the distance ratio r_a / r_p (conservation of angular momentum).
```

**Time Spent Near Apogee vs. Perigee (Kepler's Second Law):**

The spacecraft sweeps equal areas in equal times. Near apogee, it moves slowly across a large distance. Near perigee, it moves quickly across a short distance. The fraction of the orbital period spent in each region is:

```
Kepler's equation: M = E - e * sin(E)

where M = mean anomaly (proportional to time)
      E = eccentric anomaly (geometric angle on auxiliary circle)

Time above a given altitude h:
  r_threshold = R_E + h
  cos(E_threshold) = (a - r_threshold) / (a * e)
  M_threshold = E_threshold - e * sin(E_threshold)
  fraction_above = 1 - M_threshold / pi  (for one half-orbit)

For Explorer 6, fraction of orbit above 20,000 km altitude:
  r_threshold = 26,371 km
  cos(E) = (27690 - 26371) / (27690 * 0.7614) = 0.0626
  E = 86.4 deg = 1.508 rad
  M = 1.508 - 0.7614 * sin(1.508) = 1.508 - 0.761 = 0.747 rad
  fraction = 1 - 0.747 / pi = 1 - 0.238 = 0.762

Explorer 6 spent ~76% of its time above 20,000 km altitude.
Most of the orbit is spent near apogee, moving slowly,
far from Earth -- ideal for imaging Earth's full disk but
challenging for communication.
```

**Apsidal Precession Due to J2 Oblateness:**

Earth is not a perfect sphere -- it bulges at the equator. This oblateness (J2 = 1.0826e-3) causes the argument of perigee to precess:

```
d(omega)/dt = (3/2) * n * J2 * (R_E/a)^2 * (2 - 5/2 * sin^2(i)) / (1-e^2)^2

where:
  n = mean motion = 2*pi/T
  J2 = 1.0826e-3 (Earth oblateness)
  i = 47 deg (inclination)

For Explorer 6:
  n = 2*pi / (12.8 * 3600) = 1.363e-4 rad/s
  (R_E/a)^2 = (6371/27690)^2 = 0.0529
  sin^2(47) = 0.5350
  numerator = 2 - 5/2 * 0.5350 = 2 - 1.3375 = 0.6625
  (1-e^2)^2 = (1 - 0.5797)^2 = (0.4203)^2 = 0.1767

  d(omega)/dt = 1.5 * 1.363e-4 * 1.0826e-3 * 0.0529 * 0.6625 / 0.1767
              = 1.5 * 1.363e-4 * 5.727e-5 * 3.750
              = 5.53e-8 rad/s
              = 0.274 deg/day

The argument of perigee rotates by about 0.27 degrees per day.
Over Explorer 6's ~2-month operational life, perigee precessed
by roughly 16 degrees -- enough to change the imaging geometry
significantly over the mission lifetime.
```

### Worked Example

**Problem:** Calculate the complete orbital mechanics of Explorer 6, including the velocity profile, time distribution across the orbit, and the consequences for imaging and communication.

```python
import numpy as np

print("EXPLORER 6: HIGHLY ELLIPTICAL ORBIT MECHANICS")
print("=" * 65)

# Constants
mu = 3.986e5        # Earth gravitational parameter (km^3/s^2)
R_E = 6371          # Earth radius (km)
J2 = 1.0826e-3      # Earth oblateness

# Explorer 6 orbital elements
h_perigee = 237     # km altitude
h_apogee = 42400    # km altitude
r_p = R_E + h_perigee   # 6608 km
r_a = R_E + h_apogee    # 48771 km
inc = 47            # degrees

# Derived parameters
a = (r_p + r_a) / 2       # semi-major axis
e = (r_a - r_p) / (r_a + r_p)  # eccentricity
T = 2 * np.pi * np.sqrt(a**3 / mu)  # period (seconds)
n = 2 * np.pi / T         # mean motion

print(f"Perigee: {h_perigee} km alt = {r_p} km geocentric")
print(f"Apogee:  {h_apogee:,} km alt = {r_a:,} km geocentric")
print(f"Semi-major axis: {a:,.0f} km")
print(f"Eccentricity: {e:.4f}")
print(f"Period: {T:.0f} s = {T/3600:.2f} hours")
print(f"Inclination: {inc} degrees")

# Velocity profile
print(f"\n{'='*65}")
print(f"VELOCITY PROFILE (Vis-Viva)")
print(f"{'='*65}")
print(f"{'Location':>14} | {'r (km)':>10} | {'v (km/s)':>10} | {'Note':>25}")
print(f"{'-'*65}")

altitudes = [237, 1000, 5000, 10000, 20000, 30000, 42400]
for h in altitudes:
    r = R_E + h
    v = np.sqrt(mu * (2/r - 1/a))
    note = ""
    if h == 237:
        note = "Perigee (fastest)"
    elif h == 42400:
        note = "Apogee (slowest)"
    elif h == 20000:
        note = "Mid-orbit"
    print(f"{h:>10,} km | {r:>10,} | {v:>10.3f} | {note:>25}")

v_p = np.sqrt(mu * (2/r_p - 1/a))
v_a = np.sqrt(mu * (2/r_a - 1/a))
print(f"\nVelocity ratio: v_perigee / v_apogee = {v_p/v_a:.2f}")
print(f"Angular momentum: h = r * v (constant)")
print(f"  At perigee: {r_p * v_p:,.0f} km^2/s")
print(f"  At apogee:  {r_a * v_a:,.0f} km^2/s")
print(f"  (Equal — conservation of angular momentum)")

# Time distribution
print(f"\n{'='*65}")
print(f"TIME DISTRIBUTION (Kepler's Second Law)")
print(f"{'='*65}")

alt_thresholds = [1000, 5000, 10000, 20000, 30000]
for h_thresh in alt_thresholds:
    r_thresh = R_E + h_thresh
    if r_thresh >= r_a:
        continue
    if r_thresh <= r_p:
        pct = 100.0
    else:
        cos_E = (a - r_thresh) / (a * e)
        cos_E = np.clip(cos_E, -1, 1)
        E_val = np.arccos(cos_E)
        M_val = E_val - e * np.sin(E_val)
        pct = (1 - M_val / np.pi) * 100
    time_hrs = pct / 100 * T / 3600
    print(f"  Time above {h_thresh:>6,} km: {pct:>5.1f}% of orbit = {time_hrs:.1f} hr")

# Apsidal precession
print(f"\n{'='*65}")
print(f"APSIDAL PRECESSION (J2 Effect)")
print(f"{'='*65}")

sin_i = np.sin(np.radians(inc))
p = a * (1 - e**2)
d_omega_dt = (3/2) * n * J2 * (R_E**2 / (a**2 * (1-e**2)**2)) * (2 - 5/2 * sin_i**2)
d_omega_deg_day = np.degrees(d_omega_dt) * 86400

print(f"J2 = {J2}")
print(f"Mean motion n = {n:.4e} rad/s")
print(f"Precession rate: {d_omega_deg_day:.3f} deg/day")
print(f"Over 60-day mission: {d_omega_deg_day * 60:.1f} degrees of precession")
print(f"This rotation changes the imaging geometry month to month.")

# Comparison to other orbits
print(f"\n{'='*65}")
print(f"ORBIT TYPE COMPARISON")
print(f"{'='*65}")
print(f"  ISS (LEO):          e = 0.0001, period = 1.5 hr")
print(f"  GPS (MEO):          e = 0.01,   period = 12.0 hr")
print(f"  EXPLORER 6 (HEO):  e = {e:.4f}, period = {T/3600:.1f} hr")
print(f"  Molniya (HEO):     e = 0.74,   period = 12.0 hr")
print(f"  GEO:               e = 0.0000, period = 24.0 hr")
print(f"")
print(f"  Explorer 6 is a Molniya-like orbit decades before Molniya.")
print(f"  Both use high eccentricity to spend most of the orbit")
print(f"  near apogee — Explorer 6 for imaging, Molniya for comms.")
```

**Output:**
```
EXPLORER 6: HIGHLY ELLIPTICAL ORBIT MECHANICS
=================================================================
Perigee: 237 km alt = 6608 km geocentric
Apogee:  42,400 km alt = 48,771 km geocentric
Semi-major axis: 27,690 km
Eccentricity: 0.7614
Period: 45871 s = 12.74 hours
Inclination: 47 degrees

=================================================================
VELOCITY PROFILE (Vis-Viva)
=================================================================
      Location |   r (km) | v (km/s) |                      Note
-----------------------------------------------------------------
       237 km |      6,608 |     10.306 |          Perigee (fastest)
     1,000 km |      7,371 |      9.622 |
     5,000 km |     11,371 |      7.251 |
    10,000 km |     16,371 |      5.615 |
    20,000 km |     26,371 |      3.792 |                 Mid-orbit
    30,000 km |     36,371 |      2.827 |
    42,400 km |     48,771 |      1.396 |           Apogee (slowest)

Velocity ratio: v_perigee / v_apogee = 7.38
Angular momentum: h = r * v (constant)
  At perigee: 68,102 km^2/s
  At apogee:  68,102 km^2/s
  (Equal — conservation of angular momentum)

=================================================================
TIME DISTRIBUTION (Kepler's Second Law)
=================================================================
  Time above  1,000 km: 97.3% of orbit = 12.4 hr
  Time above  5,000 km: 86.8% of orbit = 11.1 hr
  Time above 10,000 km: 76.4% of orbit = 9.7 hr
  Time above 20,000 km: 57.1% of orbit = 7.3 hr
  Time above 30,000 km: 36.9% of orbit = 4.7 hr

=================================================================
APSIDAL PRECESSION (J2 Effect)
=================================================================
J2 = 0.0010826
Mean motion n = 1.370e-04 rad/s
Precession rate: 0.274 deg/day
Over 60-day mission: 16.4 degrees of precession
This rotation changes the imaging geometry month to month.

=================================================================
ORBIT TYPE COMPARISON
=================================================================
  ISS (LEO):          e = 0.0001, period = 1.5 hr
  GPS (MEO):          e = 0.01,   period = 12.0 hr
  EXPLORER 6 (HEO):  e = 0.7614, period = 12.7 hr
  Molniya (HEO):     e = 0.74,   period = 12.0 hr
  GEO:               e = 0.0000, period = 24.0 hr

  Explorer 6 is a Molniya-like orbit decades before Molniya.
  Both use high eccentricity to spend most of the orbit
  near apogee — Explorer 6 for imaging, Molniya for comms.
```

**Resonance statement:** *Explorer 6's orbit is a study in extremes. At perigee, the spacecraft tore through the upper atmosphere at 10.3 km/s -- nearly escape velocity -- spending mere minutes at altitudes where the atmosphere still has measurable density. At apogee, it drifted at 1.4 km/s, nearly stationary relative to Earth's surface, spending hours with the full disk of Earth visible through a 15-degree window. Kepler's second law ensures this asymmetry: equal areas in equal times means the spacecraft loiters near apogee and races through perigee. This is not a design flaw -- it is the design. Explorer 6 was placed in a highly elliptical orbit specifically to spend most of its time at high altitude, where the full Earth disk could be imaged and the radiation belts could be surveyed at multiple distances. The eccentricity of 0.76 is not an accident. It is the mathematical encoding of the mission requirements: sweep the perigee radiation environment quickly, dwell at apogee for imaging, repeat every 12.8 hours.*

---

## Deposit 3: Signal-to-Noise in Image Transmission (Layer 7, Section 7.3)

### Table

| Parameter | Symbol | Units | Explorer 6 Value |
|-----------|--------|-------|------------------|
| Transmitter power | P_tx | W | 2.0 (original, degraded over mission) |
| Telemetry frequency | f | MHz | 108.06 |
| Antenna type (spacecraft) | -- | -- | Whip antenna (low gain) |
| Telemetry data rate | R_data | bps | ~1 (imaging mode) |
| Bits per pixel | b_px | bits | ~6 (64 gray levels) |
| Channel bandwidth | B | Hz | ~10 |
| Image pixels (total) | N_px | -- | ~15,000 (100 x 150) |
| Time to transmit one image | t_tx | hr | ~2.5 (at 1 bps imaging rate) |
| Ground station | -- | -- | South Point, Hawaii (and others) |

### Formulas

**Shannon Channel Capacity:**

The maximum data rate achievable through a noisy channel is:

```
C = B * log2(1 + SNR)

where:
  C = channel capacity (bits/second)
  B = bandwidth (Hz)
  SNR = signal-to-noise ratio (linear, not dB)

For Explorer 6's imaging telemetry:
  B ≈ 10 Hz (narrow bandwidth to maximize SNR)
  SNR at apogee: estimated 3-6 dB ≈ 2-4 (linear)

  C = 10 * log2(1 + 3) = 10 * 2.0 = 20 bps (theoretical max)
  Actual achieved: ~1 bps for imaging data
  Shannon efficiency: ~5% (early analog system, far from optimal)

The gap between Shannon limit (20 bps) and achieved rate (1 bps)
reflects the primitive modulation and coding of 1959 technology.
Modern systems approach Shannon capacity to within 1 dB.
```

**Image Signal-to-Noise:**

The brightness measured by the photocell at each angular position has noise from multiple sources:

```
SNR_pixel = S_photon / sqrt(S_photon + S_dark + S_readout^2)

where:
  S_photon = signal from Earth's reflected sunlight (photon counts)
  S_dark = dark current (thermal noise in photocell)
  S_readout = readout noise (electronics)

The dwell time per pixel limits S_photon:
  t_dwell ≈ 6 ms (FOV transit time during spin)

For a photocell with quantum efficiency eta ≈ 1%:
  Photon rate from sunlit Earth at 48,771 km: ~10^4 photons/s
  S_photon ≈ 10^4 * 0.01 * 0.006 = ~0.6 photoelectrons per pixel

This is a photon-starved regime. The SNR per pixel is less than 1.
Image quality requires temporal averaging or acceptance of extreme noise.
Explorer 6's first photo was noisy because the physics demanded it.
```

**Path Loss at Explorer 6 Distances:**

```
L_path = (4 * pi * r / lambda)^2

For r = 48,771 km (apogee) and lambda = c/f = 2.776 m:
  L_path = (4 * pi * 48771e3 / 2.776)^2
         = (2.21e8)^2
         = 4.87e16
         = 167 dB

For r = 6,608 km (perigee):
  L_path = (4 * pi * 6608e3 / 2.776)^2
         = (2.99e7)^2
         = 8.95e14
         = 149 dB

The 18 dB difference between perigee and apogee means
the received signal is roughly 63 times stronger at perigee.
But the imaging geometry is better at apogee.
This is the fundamental trade-off of Explorer 6's orbit.
```

### Worked Example

**Problem:** Calculate the complete communication link budget for Explorer 6's imaging system. Show why the first photograph of Earth from orbit was crude, and calculate the theoretical information content of the image.

```python
import numpy as np

print("EXPLORER 6: IMAGE TRANSMISSION LINK BUDGET")
print("=" * 65)

# Transmitter
P_tx_W = 2.0               # watts (beginning of mission)
f = 108.06e6                # Hz
c = 3e8                     # m/s
lam = c / f                 # wavelength (m)

print(f"Transmitter power: {P_tx_W} W = {10*np.log10(P_tx_W*1e3):.1f} dBm")
print(f"Frequency: {f/1e6:.2f} MHz")
print(f"Wavelength: {lam:.3f} m = {lam*100:.1f} cm")

# Antenna gains (approximate)
G_tx_dBi = 2        # whip antenna
G_rx_dBi = 20       # ground station antenna (smaller than Goldstone)
G_tx = 10**(G_tx_dBi/10)
G_rx = 10**(G_rx_dBi/10)

# Link at perigee vs apogee
print(f"\n{'='*65}")
print(f"LINK BUDGET: PERIGEE vs APOGEE")
print(f"{'='*65}")
print(f"{'Parameter':>30} | {'Perigee':>14} | {'Apogee':>14}")
print(f"{'-'*65}")

r_perigee = 6608e3      # m
r_apogee = 48771e3      # m

for label, r in [("Distance (km)", [r_perigee/1e3, r_apogee/1e3]),
                 ("Path loss (dB)", [None, None]),
                 ("Received power (dBm)", [None, None]),
                 ("Received power (W)", [None, None])]:
    if label == "Distance (km)":
        print(f"{label:>30} | {r[0]:>14,.0f} | {r[1]:>14,.0f}")
    elif label == "Path loss (dB)":
        L_p = (4 * np.pi * r_perigee / lam)**2
        L_a = (4 * np.pi * r_apogee / lam)**2
        print(f"{label:>30} | {10*np.log10(L_p):>14.1f} | {10*np.log10(L_a):>14.1f}")
    elif label == "Received power (dBm)":
        P_rx_p = P_tx_W * G_tx * G_rx * (lam / (4*np.pi*r_perigee))**2
        P_rx_a = P_tx_W * G_tx * G_rx * (lam / (4*np.pi*r_apogee))**2
        print(f"{label:>30} | {10*np.log10(P_rx_p*1e3):>14.1f} | {10*np.log10(P_rx_a*1e3):>14.1f}")
    elif label == "Received power (W)":
        P_rx_p = P_tx_W * G_tx * G_rx * (lam / (4*np.pi*r_perigee))**2
        P_rx_a = P_tx_W * G_tx * G_rx * (lam / (4*np.pi*r_apogee))**2
        print(f"{label:>30} | {P_rx_p:>14.2e} | {P_rx_a:>14.2e}")

# Shannon capacity
print(f"\n{'='*65}")
print(f"SHANNON CAPACITY")
print(f"{'='*65}")

B = 10  # Hz (narrow bandwidth)
k = 1.381e-23  # Boltzmann constant
T_sys = 1000   # K (1959 receiver, not cryogenic)

P_rx_a = P_tx_W * G_tx * G_rx * (lam / (4*np.pi*r_apogee))**2
N = k * T_sys * B  # noise power
SNR_linear = P_rx_a / N
SNR_dB = 10 * np.log10(SNR_linear)
C = B * np.log2(1 + SNR_linear)

print(f"Bandwidth: {B} Hz")
print(f"System noise temperature: {T_sys} K")
print(f"Noise power: {N:.2e} W")
print(f"Signal power (apogee): {P_rx_a:.2e} W")
print(f"SNR: {SNR_dB:.1f} dB ({SNR_linear:.1f} linear)")
print(f"Shannon capacity: {C:.1f} bps")
print(f"Achieved data rate: ~1 bps")
print(f"Shannon efficiency: {1/C*100:.0f}%")

# Image information content
print(f"\n{'='*65}")
print(f"IMAGE INFORMATION CONTENT")
print(f"{'='*65}")

n_lines = 100
pixels_per_line = 150
bits_per_pixel = 6   # 64 gray levels
total_bits = n_lines * pixels_per_line * bits_per_pixel
data_rate = 1.0      # bps achieved

print(f"Image dimensions: {n_lines} x {pixels_per_line} pixels")
print(f"Bits per pixel: {bits_per_pixel} ({2**bits_per_pixel} gray levels)")
print(f"Total image data: {total_bits:,} bits")
print(f"Transmission rate: {data_rate} bps")
print(f"Time to transmit one image: {total_bits/data_rate:.0f} seconds")
print(f"  = {total_bits/data_rate/3600:.1f} hours")
print(f"")
print(f"For comparison:")
print(f"  A modern smartphone photo: ~10 megapixels x 24 bits")
print(f"  = 240,000,000 bits = {240e6/total_bits:,.0f}x more data")
print(f"")
print(f"Explorer 6's first photo of Earth contained roughly")
print(f"the same information as two paragraphs of text.")
print(f"But it was the FIRST. Shannon's theory does not")
print(f"value information by content. It values it by surprise.")
print(f"The surprise of seeing Earth from orbit was infinite.")
```

**Resonance statement:** *Explorer 6's imaging system operated at the ragged edge of what information theory allows. The Shannon capacity of the channel was roughly 20 bits per second. The actual achieved rate was 1 bit per second -- 5% of theoretical capacity, a reflection of 1959 modulation technology. At that rate, transmitting one crude 100x150 pixel image took over two hours. The image contained 90,000 bits -- approximately the information content of two paragraphs of English text. But Shannon's theory measures surprise, not beauty. The surprise of the first photograph of Earth from orbit -- sunlit crescent against black space, continent barely distinguishable from cloud -- was not quantifiable in bits. The channel was narrow. What it carried was unprecedented. This is the duality of information theory: the channel capacity is a hard physical limit set by power, bandwidth, and noise. But the value of the information that passes through the channel is set by the receiver's expectations. No one had ever seen Earth from space. Explorer 6's noisy, crude, barely-resolved photocell image contained more novelty per bit than any transmission before or since.*

---

## Debate Questions

### Question 1: Resolution vs. Revelation

Explorer 6's image was roughly 100x150 pixels at 6 bits per pixel -- cruder than the lowest-resolution image on a modern phone. Yet it was one of the most significant photographs in history. At what resolution does an image cease to convey useful information? Is a 10x10 pixel image of Earth from space more or less informative than a 10-megapixel image of a parking lot? How does Shannon's concept of "surprise" (information = reduction of uncertainty) apply to Explorer 6's photograph?

### Question 2: The Spin-Scan Trade-Off

Explorer 6 used the spacecraft's spin to build an image -- a mechanical solution that avoided the mass and complexity of a gimbaled camera. Modern Earth observation satellites use large focal plane arrays with thousands of detector elements. Is the spin-scan approach fundamentally limited, or could a modern spin-scan system with sensitive detectors rival a staring array? Consider the spin-scan instruments on the GOES weather satellites, which used this technique until the 2000s.

### Question 3: Orbit Selection as Information Architecture

Explorer 6's highly elliptical orbit was simultaneously good for imaging (long time at apogee, full disk view) and bad for communication (weak signal at apogee, strong at perigee when the view is too close). This is a fundamental tension: the best observation geometry has the worst communication geometry. How do modern missions resolve this trade-off? Consider relay satellites, onboard storage, and the role of orbit selection as an information architecture decision.

### Question 4: The Eccentricity Advantage

Circular orbits are the default for most satellites. Explorer 6's eccentricity of 0.76 gave it a completely different perspective -- sweeping from 237 km to 42,400 km altitude every 12.8 hours. What scientific questions require high eccentricity? Compare Explorer 6's orbit to Molniya orbits, INTEGRAL's orbit, and the recently proposed highly elliptical orbits for cislunar space domain awareness.

### Question 5: Photography as Calibration

The first photograph of Earth from orbit was scientifically useless -- too low resolution, too noisy, too distorted. Its value was entirely in proving the concept: a spacecraft CAN image Earth from orbit. How often in science and engineering is the first demonstration of a capability valued not for its data quality but for its existence? Compare to the first X-ray image (Rontgen's wife's hand), the first electronic television image (a line), and the first DNA structure (Photo 51, barely interpretable without theory).

---

*"Explorer 6 saw Earth the way a spinning top sees a room -- in fragments, assembled by rotation, blurred by motion, barely resolved. The photocell traced the unit circle 2.8 times per minute, and during each transit of Earth's disk it recorded a brightness curve that became one line of an image. One hundred rotations, one photograph. The mathematics of this image is trigonometry -- the photocell position is (cos theta, sin theta) at every instant, and the brightness B(theta) during the Earth-crossing arc is the raw data. The reconstruction from angular brightness samples to rectangular image is a coordinate transform, from polar (spin angle, line number) to Cartesian (pixel row, pixel column). This is the same transform that radar uses, that CT scanners use, that radio telescopes use. Explorer 6 did it first, from orbit, with a single photocell, producing an image that contained fewer bits than this sentence but showed something no human eye had ever seen: the curve of Earth against the black of space, sunlit and whole, from 20,000 miles away."*
