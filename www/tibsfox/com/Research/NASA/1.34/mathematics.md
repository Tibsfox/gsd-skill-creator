# Mission 1.34 -- Ranger 7: The Math of Seeing

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Ranger 7 (July 28-31, 1964)
**Primary TSPB Layer:** 5 (Probability and Statistics -- Crater Size-Frequency Distribution, Power Laws)
**Secondary Layers:** 4 (Vector Calculus -- Transfer Orbit, Impact Trajectory), 7 (Information Theory -- Image Data Rate, Channel Capacity), 1 (Unit Circle -- Vidicon Scanning, Image Resolution)
**Format:** McNeese-Hoag Reference Standard (1964) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Lunar Transfer Orbit -- Getting to the Moon (Layer 4, Section 4.34)

### Table

| Parameter | Symbol | Units | Ranger 7 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | July 28, 1964, 16:50:07 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B |
| Spacecraft mass | m_sc | kg | 365.7 |
| Transit time | t_transit | hr | 68.6 |
| Impact date | -- | -- | July 31, 1964, 13:25:49 UTC (camera on) |
| Impact time | -- | -- | July 31, 1964, 13:43:02 UTC (impact) |
| Impact velocity | v_impact | km/s | 2.62 |
| Impact location | -- | -- | 10.63°S, 20.68°W (Mare Cognitum) |
| Camera activation altitude | h_cam | km | ~2,110 |
| Imaging duration | t_img | min | 17.22 |
| Total images | N_img | -- | 4,308 |
| Last image altitude | h_last | m | ~480 |

### Formulas

**Hohmann-like Transfer Orbit:**

Ranger 7 followed an approximately Hohmann-like transfer from Earth parking orbit to lunar impact:

```
For a transfer from Earth (r_1 = 6,570 km, parking orbit)
to the Moon (r_2 = 384,400 km):

Semi-major axis of transfer:
  a_t = (r_1 + r_2) / 2 = (6,570 + 384,400) / 2 = 195,485 km

Transfer orbit period:
  T_t = 2*pi * sqrt(a_t^3 / mu_Earth)
  Transit time ≈ T_t / 2 ≈ 5 days (Hohmann)

Actual Ranger 7 transit: 68.6 hours ≈ 2.86 days
(faster than Hohmann due to higher injection velocity)
```

**Impact Velocity:**

```
At lunar distance, spacecraft velocity relative to Moon:
  v_approach ≈ 2.5-3.0 km/s (depends on exact trajectory)

Ranger 7 impact velocity: 2.62 km/s
  = 9,432 km/hr
  = approximately 6 times the speed of a rifle bullet
```

### Worked Example

```python
import numpy as np

print("RANGER 7: LUNAR TRANSFER ORBIT")
print("=" * 60)

# Constants
mu_earth = 3.986e14    # Earth gravitational parameter (m^3/s^2)
mu_moon = 4.905e12     # Moon gravitational parameter
R_earth = 6.371e6      # Earth radius (m)
d_moon = 3.844e8       # Earth-Moon distance (m)

# Parking orbit
h_park = 190e3         # parking orbit altitude (m)
r_park = R_earth + h_park

# Circular velocity in parking orbit
v_park = np.sqrt(mu_earth / r_park)
print(f"Parking orbit altitude: {h_park/1e3:.0f} km")
print(f"Circular velocity: {v_park:.0f} m/s = {v_park/1e3:.2f} km/s")

# Agena B injection (approximately)
# For transit time of 68.6 hours, need v > Hohmann
# Hohmann transfer velocity at r_park:
a_hohmann = (r_park + d_moon) / 2
v_hohmann = np.sqrt(mu_earth * (2/r_park - 1/a_hohmann))
print(f"\nHohmann injection velocity: {v_hohmann:.0f} m/s = {v_hohmann/1e3:.2f} km/s")
print(f"Delta-v from parking orbit: {v_hohmann - v_park:.0f} m/s")

# Faster transfer (68.6 hours vs ~120 hours for Hohmann)
# Ranger 7 used a direct ascent with higher injection velocity
v_injection = v_hohmann * 1.02  # approximately 2% faster
print(f"\nRanger 7 injection (est): {v_injection:.0f} m/s = {v_injection/1e3:.2f} km/s")

# Transit time
transit_hours = 68.6
print(f"Transit time: {transit_hours:.1f} hours = {transit_hours/24:.2f} days")

# Impact velocity
v_impact = 2620  # m/s
print(f"\nImpact velocity: {v_impact:.0f} m/s = {v_impact/1e3:.2f} km/s")
print(f"  = {v_impact*3.6:.0f} km/hr")
print(f"  = {v_impact/900:.1f}x rifle bullet speed")

# Imaging window
h_cam_on = 2110e3      # camera activation altitude
print(f"\nCamera activation: {h_cam_on/1e3:.0f} km altitude")
print(f"Imaging duration: 17.22 minutes = {17.22*60:.0f} seconds")
print(f"Total images: 4,308")
print(f"Images per second: {4308/(17.22*60):.1f}")
print(f"Average time between images: {17.22*60/4308:.2f} seconds")
```

---

## Deposit 2: Crater Size-Frequency Distribution -- The Power Law (Layer 5, Section 5.34)

### Table

| Parameter | Symbol | Units | Ranger 7 Value |
|-----------|--------|-------|-----------------|
| Power law exponent | b | -- | ~-2 (cumulative) |
| Crater diameter range | D | m | 1 to 10,000 |
| Cumulative number | N(>D) | per km^2 | varies with surface age |
| Mare Cognitum surface age | t_surface | Gyr | ~3.5-3.8 |
| Resolution (first frame) | res_first | m | ~2,000 |
| Resolution (last frame) | res_last | m | ~0.5 |

### Formulas

**Power-Law Size Distribution:**

Ranger 7's photographs revealed that lunar crater sizes follow a power law:

```
N(>D) = k * D^b

where:
  N(>D) = cumulative number of craters per km^2 with diameter > D
  D = crater diameter (m or km)
  k = constant (depends on surface age and location)
  b = power-law exponent ≈ -2 for mare surfaces

This means:
  10x smaller craters → 100x more of them
  100x smaller craters → 10,000x more of them

The distribution is scale-invariant: it looks the same at every
magnification. This is why Ranger 7 saw craters at every resolution
it achieved — from the 2 km first frames to the 0.5 m last frames.
The power law predicted craters at every scale, and Ranger confirmed it.
```

**Crater Production Function:**

```
The rate at which craters form on the Moon:

dN/dt = f(D) * phi(t)

where:
  f(D) = impactor flux as a function of size (power law)
  phi(t) = time-dependent bombardment rate

For the inner solar system, the impactor size distribution
follows: n(>d) ~ d^(-2.5) approximately

Since crater diameter D scales with impactor diameter d
approximately as D ~ d^(1.2) (pi-scaling), the crater
production function preserves the power-law form.

The cumulative count N(>D) on a surface of age T is:
  N(>D, T) = integral_0^T f(D) * phi(t') dt'

For a surface of known age (like Mare Cognitum, ~3.5 Gyr),
the crater density directly measures the integrated bombardment flux.
```

### Worked Example

```python
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

print("RANGER 7: CRATER SIZE-FREQUENCY DISTRIBUTION")
print("=" * 60)

# Power law parameters for Mare Cognitum (approximate)
# N(>D) = k * D^b, where D in meters
b = -2.0
k = 1e7  # craters per km^2, reference at D = 1 m

# Diameter range (meters)
D = np.logspace(0, 4, 100)  # 1 m to 10 km

# Cumulative crater count
N = k * D**b

print(f"Power law: N(>D) = {k:.0e} * D^{b:.1f}")
print(f"\nCrater counts per km^2:")
for d_val in [1, 10, 100, 1000, 10000]:
    n_val = k * d_val**b
    print(f"  D > {d_val:>6} m: {n_val:>10.1f} craters/km^2")

print(f"\nScale invariance demonstrated:")
print(f"  Ratio N(>1m)/N(>10m) = {(1)**b / (10)**b:.0f}x")
print(f"  Ratio N(>10m)/N(>100m) = {(10)**b / (100)**b:.0f}x")
print(f"  Ratio N(>100m)/N(>1km) = {(100)**b / (1000)**b:.0f}x")
print(f"  Each decade in size → 100x more craters (b = -2)")

# Ranger 7 resolution progression
print(f"\n{'='*60}")
print(f"RANGER 7 RESOLUTION PROGRESSION")
print(f"{'='*60}")
resolutions = [
    ("First frame", 2000, "13:25:49", 2110),
    ("5 min", 500, "13:30:49", 1500),
    ("10 min", 100, "13:35:49", 800),
    ("15 min", 10, "13:40:49", 200),
    ("Last frame", 0.5, "13:43:02", 0.48),
]

print(f"{'Time':>12} | {'Resolution (m)':>14} | {'Altitude (km)':>13} | {'Craters/km^2 visible':>20}")
print(f"{'-'*65}")
for label, res, time, alt in resolutions:
    n_vis = k * res**b
    print(f"{label:>12} | {res:>14.1f} | {alt:>13.1f} | {n_vis:>20.0f}")

print(f"\nFrom first frame to last:")
print(f"  Resolution improved by {2000/0.5:.0f}x")
print(f"  Visible craters increased by {(0.5)**b / (2000)**b:.0f}x")
print(f"  This is why every Ranger 7 frame showed NEW craters")
print(f"  that were invisible in the previous frame.")
```

---

## Deposit 3: Image Transmission -- Data Rate and Channel Capacity (Layer 7, Section 7.34)

### Table

| Parameter | Symbol | Units | Ranger 7 Value |
|-----------|--------|-------|-----------------|
| F-channel frame time | t_F | s | 2.56 |
| P-channel frame time | t_P | s | 0.2 |
| F-channel pixels | N_F | pixels | 1150 lines × 1150 pixels |
| P-channel pixels | N_P | pixels | 300 lines × 300 pixels |
| Transmitter power | P_tx | W | ~60 |
| Transmitter frequency | f | MHz | 960 |
| Data rate | R | kbps | ~600 (combined channels) |
| Total images | N_total | -- | 4,308 |
| Total data volume | V | Mbits | ~800 (estimated) |

### Formulas

**Image Data Rate:**

```
Each F-channel image: 1150 × 1150 pixels × 8 bits/pixel
  = 10,580,000 bits per frame
  Transmitted in 2.56 seconds
  Data rate: 10,580,000 / 2.56 = 4,132,813 bps ≈ 4.1 Mbps per camera

Each P-channel image: 300 × 300 pixels × 8 bits/pixel
  = 720,000 bits per frame
  Transmitted in 0.2 seconds
  Data rate: 720,000 / 0.2 = 3,600,000 bps ≈ 3.6 Mbps per camera

Total sustained data rate across all channels: ~600 kbps
(interleaved, with overhead for synchronization)
```

**Shannon Channel Capacity:**

```
C = B * log2(1 + SNR)

For Ranger 7's communication link:
  B = bandwidth ≈ 2 MHz (each channel)
  SNR at lunar distance ≈ 15 dB = 31.6 (linear)
  C = 2e6 * log2(1 + 31.6) = 2e6 * 5.03 = 10.06 Mbps

The achieved data rate (~600 kbps) was well below the
theoretical channel capacity — conservative design to
ensure reliable transmission. Ranger could not afford
to lose images to bit errors.
```

---

## Deposit 4: Resolution vs. Altitude -- The Imaging Equation (Layer 1, Section 1.34)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| F-camera focal length | f_F | mm | 25 |
| P-camera focal length | f_P | mm | 76 |
| Vidicon image size | d_vid | mm | 11 |
| F-channel scan lines | N_lines_F | -- | 1150 |
| P-channel scan lines | N_lines_P | -- | 300 |

### Formulas

**Ground Resolution:**

```
GSD (Ground Sample Distance) = h * d_pixel / f

where:
  h = altitude above surface (m)
  d_pixel = pixel size on vidicon (m)
  f = focal length (m)

For the P-channel telephoto camera (76mm lens):
  d_pixel = 11mm / 300 lines = 0.0367 mm = 3.67e-5 m
  GSD = h * 3.67e-5 / 0.076 = h * 4.82e-4 m/m

  At h = 2,110 km: GSD = 2,110,000 * 4.82e-4 = 1,018 m ≈ 1 km
  At h = 100 km:   GSD = 100,000 * 4.82e-4 = 48.2 m
  At h = 1 km:     GSD = 1,000 * 4.82e-4 = 0.48 m
  At h = 480 m:    GSD = 480 * 4.82e-4 = 0.23 m ← final frame

Resolution improves linearly with decreasing altitude.
Halve the altitude, halve the pixel size on the ground.
```

### Worked Example

```python
import numpy as np

print("RANGER 7: RESOLUTION vs ALTITUDE")
print("=" * 60)

# Camera parameters
cameras = {
    "F-channel (25mm wide)": {"f": 0.025, "lines": 1150, "vidicon": 0.011},
    "P-channel (76mm tele)": {"f": 0.076, "lines": 300, "vidicon": 0.011},
}

for name, params in cameras.items():
    d_pixel = params["vidicon"] / params["lines"]
    print(f"\n{name}:")
    print(f"  Pixel size on vidicon: {d_pixel*1e6:.1f} microns")

    altitudes_km = [2110, 1000, 500, 100, 10, 1, 0.48]
    print(f"  {'Altitude':>10} | {'GSD':>10} | {'Frame width':>12}")
    print(f"  {'-'*38}")
    for h_km in altitudes_km:
        h = h_km * 1e3
        gsd = h * d_pixel / params["f"]
        fov = h * params["vidicon"] / params["f"]
        print(f"  {h_km:>8.1f} km | {gsd:>8.1f} m | {fov/1e3:>10.1f} km")

# Resolution improvement factor
print(f"\n{'='*60}")
print(f"Resolution improvement from first to last frame:")
print(f"  First frame altitude: 2,110 km → GSD ≈ 1,000 m")
print(f"  Last frame altitude:  0.48 km  → GSD ≈ 0.23 m")
print(f"  Improvement factor: {2110/0.48:.0f}x")
print(f"  Pioneer 4 saw the Moon from 60,000 km (no camera).")
print(f"  Ranger 7 saw it from 480 meters. The universe resolves")
print(f"  when you get close enough to look.")
```

---

## Debate Questions

### Question 1: The Power Law Problem
Ranger 7 showed craters following a power-law size distribution with no visible lower bound. Does this mean craters exist at every scale, including sub-meter? What would this mean for an astronaut walking on the surface? At what scale does the power law break down, and why?

### Question 2: Resolution and Knowledge
Before Ranger 7, the Moon was "known" from telescopes at ~1 km resolution. After Ranger 7, it was known at ~0.5 m resolution. What changed? Did the Moon change, or did our knowledge of the Moon change? Is there a meaningful sense in which the Moon became a different object after Ranger 7?

### Question 3: The Six Failures
Rangers 1-6 failed for six different reasons. Each failure revealed a new weakness. Was the seventh-time success inevitable, or could the program have failed indefinitely? Compare to software testing: when you fix all known bugs, are there always unknown bugs remaining?

### Question 4: Image Transmission Trade-offs
Ranger 7 transmitted 4,308 images in 17 minutes at roughly 600 kbps. Modern lunar orbiters transmit at megabits per second. But Ranger's 17-minute window was fixed -- the spacecraft was going to crash. If you had 17 minutes and 600 kbps, how would you allocate the bandwidth? More low-resolution context images, or fewer high-resolution detail images?

### Question 5: The Naming of Mare Cognitum
"The Sea That Has Become Known" -- named before Ranger 7 by Renaissance astronomers who saw it through telescopes. Ranger 7 made it truly known. Is the original name a prediction or an irony? When does something become "known"?

---

*"Four thousand three hundred and eight frames between camera activation and impact. Each frame doubled the resolution of the last. Each showed craters that were invisible in the previous frame. The power law held at every scale: ten times smaller craters were a hundred times more abundant, all the way down to the resolution limit. Ranger 7 proved that the Moon is a fractal landscape -- self-similar at every magnification, structured at every scale. The seventeen minutes of imaging produced more lunar surface data than all telescopes in history. Then the spacecraft hit the surface at 2.62 km/s and became part of the landscape it had just photographed. The data survived. The camera did not. This is the math of seeing: resolution improves linearly with decreasing altitude, and the information content increases as the square. Get twice as close, see four times as much. Ranger 7 got 4,000 times closer than any telescope and saw 16 million times as much."*
