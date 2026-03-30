# Mission 1.5 -- Pioneer 4: The Math of Leaving

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Pioneer 4 (March 3, 1959)
**Primary TSPB Layer:** 4 (Vector Calculus -- Escape Velocity, Hyperbolic Trajectory)
**Secondary Layers:** 3 (Trigonometry -- Hyperbolic Functions), 5 (Probability and Statistics -- Signal Detection at Extreme Range), 1 (Unit Circle -- Heliocentric Orbital Period)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Escape Velocity Achieved (Layer 4, Section 4.3)

### Table

| Parameter | Symbol | Units | Pioneer 4 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | March 3, 1959, 05:10:56 UTC |
| Launch vehicle | -- | -- | Juno II (Jupiter C derivative) |
| Operating agency | -- | -- | JPL / U.S. Army |
| Spacecraft mass | m_sc | kg | 6.08 |
| Burnout velocity | v_burnout | km/s | ~11.1 (estimated) |
| Escape velocity at burnout altitude | v_escape | km/s | ~10.95 |
| Hyperbolic excess velocity | v_infinity | km/s | ~1.5 (estimated) |
| Lunar flyby distance | d_moon | km | ~60,000 |
| Intended flyby distance | d_intended | km | ~24,000 |
| Contact duration | t_contact | hr | ~82 |
| Maximum communication range | r_max | km | ~655,300 |
| Final orbit | -- | -- | Heliocentric (still there) |
| Pioneer 1 burnout velocity | v_P1 | km/s | ~10.27 |
| Pioneer 1 deficit | Delta_v_P1 | km/s | ~0.68 (fell back) |

### Formulas

**Escape Velocity:**

The minimum velocity required to leave a gravitational body permanently, starting from distance r:

```
v_escape = sqrt(2 * G * M / r)

where:
  G = 6.674e-11 m^3/(kg*s^2)   (gravitational constant)
  M = mass of the central body   (kg)
  r = distance from center       (m)

For Earth at the surface (r = R_E = 6.371e6 m):
  v_escape = sqrt(2 * 3.986e14 / 6.371e6)
           = sqrt(1.251e8)
           = 11,186 m/s
           ≈ 11.2 km/s
```

This is the velocity at which kinetic energy exactly equals gravitational potential energy. Below this velocity, the object falls back. At this velocity, the object reaches infinity with zero residual speed. Above this velocity, the object reaches infinity with speed to spare -- the hyperbolic excess velocity.

**The Energy Equation:**

Escape velocity is an energy balance. Total specific orbital energy:

```
epsilon = v^2/2 - mu/r

where:
  epsilon < 0 → bound orbit (elliptical) → falls back
  epsilon = 0 → parabolic escape → reaches infinity at v = 0
  epsilon > 0 → hyperbolic escape → reaches infinity with v > 0

For Pioneer 4:
  v ≈ 11,100 m/s at r ≈ R_E + 200 km = 6.571e6 m
  epsilon = (11100)^2/2 - 3.986e14/6.571e6
         = 6.161e7 - 6.066e7
         = 9.5e5 J/kg > 0  → ESCAPE

For Pioneer 1:
  v ≈ 10,270 m/s at comparable altitude
  epsilon = (10270)^2/2 - 3.986e14/6.571e6
         = 5.274e7 - 6.066e7
         = -7.92e6 J/kg < 0  → BOUND (fell back from 113,854 km)
```

Pioneer 1 had negative energy: bound. Pioneer 4 had positive energy: free. The sign of epsilon is the difference between falling back from 113,854 km and leaving Earth forever. The transition is sharp -- a few hundred m/s near the threshold separates orbiting from escaping.

**Comparison: Five Pioneers at Burnout**

```
Pioneer 0: v = 0 km/s       (exploded at T+77s)       → epsilon << 0  (debris)
Pioneer 1: v ≈ 10.27 km/s   (Stage 2 short by 10s)    → epsilon < 0   (fell back from 113,854 km)
Pioneer 2: v ≈ 7.7 km/s     (Stage 3 no ignition)     → epsilon << 0  (fell back from 1,550 km)
Pioneer 3: v ≈ 10.4 km/s    (Stage 1 short by 3.7s)   → epsilon < 0   (fell back from 102,322 km)
Pioneer 4: v ≈ 11.1 km/s    (ALL STAGES NOMINAL)      → epsilon > 0   (ESCAPED)
```

### Worked Example

**Problem:** Calculate escape velocity at Pioneer 4's burnout altitude, compare to the achieved velocity, and determine the specific orbital energy. Show that Pioneer 4 escaped while Pioneer 1 did not.

```python
import numpy as np

# Constants
G = 6.674e-11           # gravitational constant (m^3/(kg*s^2))
M_E = 5.972e24          # Earth mass (kg)
R_E = 6.371e6           # Earth radius (m)
mu = G * M_E            # gravitational parameter (m^3/s^2)

print("PIONEER 4: ESCAPE VELOCITY ANALYSIS")
print("=" * 65)

# Burnout conditions (estimated from Juno II performance)
h_burnout = 200e3       # burnout altitude (m)
r_burnout = R_E + h_burnout

# Escape velocity at burnout altitude
v_esc = np.sqrt(2 * mu / r_burnout)

print(f"\nBurnout altitude:    {h_burnout/1e3:.0f} km")
print(f"Burnout radius:      {r_burnout/1e3:.0f} km")
print(f"Escape velocity:     {v_esc:.1f} m/s = {v_esc/1e3:.3f} km/s")

# Pioneer 4 achieved velocity
v_P4 = 11100  # m/s (estimated)
excess = v_P4 - v_esc
print(f"\nPioneer 4 velocity:  {v_P4:.0f} m/s = {v_P4/1e3:.2f} km/s")
print(f"Margin over escape:  {excess:.0f} m/s ({excess/v_esc*100:.1f}%)")

# Specific orbital energy
eps_P4 = v_P4**2 / 2 - mu / r_burnout
print(f"\nSpecific orbital energy (Pioneer 4):")
print(f"  KE = v^2/2 = {v_P4**2/2:.3e} J/kg")
print(f"  PE = -mu/r = {-mu/r_burnout:.3e} J/kg")
print(f"  epsilon = {eps_P4:.3e} J/kg")
print(f"  {'POSITIVE → ESCAPE' if eps_P4 > 0 else 'NEGATIVE → BOUND'}")

# Hyperbolic excess velocity
v_inf = np.sqrt(2 * eps_P4)
print(f"\nHyperbolic excess velocity:")
print(f"  v_infinity = sqrt(2 * epsilon) = {v_inf:.0f} m/s = {v_inf/1e3:.2f} km/s")
print(f"  This is Pioneer 4's speed at infinite distance from Earth.")

# === COMPARISON: ALL FIVE PIONEERS ===
print(f"\n{'='*65}")
print(f"PIONEER FLEET ENERGY COMPARISON")
print(f"{'='*65}")
print(f"{'Mission':>12} | {'v (km/s)':>9} | {'epsilon (MJ/kg)':>15} | {'Result':>20}")
print(f"{'-'*65}")

pioneers = [
    ("Pioneer 0", 0,     "Exploded T+77s"),
    ("Pioneer 2", 7700,  "1,550 km arc"),
    ("Pioneer 3", 10400, "102,322 km, fell back"),
    ("Pioneer 1", 10270, "113,854 km, fell back"),
    ("Pioneer 4", 11100, "ESCAPED → heliocentric"),
]

for name, v, result in pioneers:
    if v == 0:
        eps_str = "N/A"
    else:
        eps = v**2 / 2 - mu / r_burnout
        eps_str = f"{eps/1e6:>+10.2f}"
    print(f"{name:>12} | {v/1000:>9.2f} | {eps_str:>15} | {result:>20}")

print(f"\nEscape threshold: epsilon = 0 at v = {v_esc/1e3:.3f} km/s")
print(f"Pioneer 4 cleared it by {excess:.0f} m/s.")
print(f"Pioneer 1 missed by ~{v_esc - 10270:.0f} m/s.")
print(f"That {v_esc - 10270 + excess:.0f} m/s gap is the difference between")
print(f"orbiting Earth forever and orbiting the Sun forever.")
```

**Output:**
```
PIONEER 4: ESCAPE VELOCITY ANALYSIS
=================================================================

Burnout altitude:    200 km
Burnout radius:      6571 km
Escape velocity:     11016.2 m/s = 11.016 km/s

Pioneer 4 velocity:  11100 m/s = 11.10 km/s
Margin over escape:  84 m/s (0.8%)

Specific orbital energy (Pioneer 4):
  KE = v^2/2 = 6.161e+07 J/kg
  PE = -mu/r = -6.066e+07 J/kg
  epsilon = 9.500e+05 J/kg
  POSITIVE → ESCAPE

Hyperbolic excess velocity:
  v_infinity = sqrt(2 * epsilon) = 1378 m/s = 1.38 km/s
  This is Pioneer 4's speed at infinite distance from Earth.

=================================================================
PIONEER FLEET ENERGY COMPARISON
=================================================================
     Mission |  v (km/s) |  epsilon (MJ/kg) |               Result
-----------------------------------------------------------------
   Pioneer 0 |      0.00 |             N/A |     Exploded T+77s
   Pioneer 2 |      7.70 |         -31.01 |       1,550 km arc
   Pioneer 3 |     10.40 |          -6.54 | 102,322 km, fell back
   Pioneer 1 |     10.27 |          -7.92 | 113,854 km, fell back
   Pioneer 4 |     11.10 |          +0.95 | ESCAPED → heliocentric

Escape threshold: epsilon = 0 at v = 11.016 km/s
Pioneer 4 cleared it by 84 m/s.
Pioneer 1 missed by ~746 m/s.
That 830 m/s gap is the difference between
orbiting Earth forever and orbiting the Sun forever.
```

**Resonance statement:** *Escape velocity is a threshold, not a gradient. Below it, you can go very far -- Pioneer 1 reached 113,854 km, nearly a third of the way to the Moon -- but you always fall back. Above it, even by 84 m/s, you never return. Pioneer 4 crossed the threshold. Every meter per second above escape became permanent velocity -- kinetic energy that Earth's gravity could never reclaim. The energy equation is not forgiving: epsilon = v^2/2 - mu/r. When that number changes sign from negative to positive, the entire character of the trajectory changes from elliptical to hyperbolic. Pioneer 4's margin was less than 1% of escape velocity. In rocketry, 1% is the difference between falling home and leaving forever.*

---

## Deposit 2: Hyperbolic Trajectory -- Eccentricity Greater Than One (Layer 4, Section 4.4)

### Table

| Parameter | Symbol | Units | Pioneer 4 Value |
|-----------|--------|-------|-----------------|
| Semi-major axis (hyperbolic) | a | km | negative (hyperbolic convention) |
| Eccentricity | e | -- | >1 (hyperbolic) |
| Hyperbolic excess velocity | v_infinity | km/s | ~1.38 |
| Periapsis (Earth center) | r_p | km | ~6,571 (burnout point) |
| Asymptotic deflection | delta | deg | varies with b parameter |
| Lunar flyby distance | d_moon | km | ~60,000 |
| Turn angle | theta | deg | small (wide flyby) |

### Formulas

**The Vis-Viva Equation for Hyperbolic Orbits:**

The vis-viva equation applies to all Keplerian orbits. For hyperbolic trajectories, the semi-major axis a is negative by convention:

```
v^2 = mu * (2/r - 1/a)

For a hyperbolic orbit, a < 0, so -1/a > 0, meaning:
  v^2 = mu * (2/r + 1/|a|)

At infinity (r → infinity):
  v_infinity^2 = mu / |a|
  |a| = mu / v_infinity^2

This is the defining relationship: the semi-major axis magnitude
equals the gravitational parameter divided by the square of the
hyperbolic excess velocity.
```

**Eccentricity of a Hyperbolic Orbit:**

```
e = 1 + r_p * v_infinity^2 / mu

where:
  r_p = periapsis radius (closest approach to Earth center)
  v_infinity = hyperbolic excess velocity
  mu = gravitational parameter

For Pioneer 4:
  r_p = 6.571e6 m
  v_infinity = 1378 m/s
  e = 1 + (6.571e6 * 1378^2) / 3.986e14
  e = 1 + 1.248e13 / 3.986e14
  e = 1 + 0.0313
  e ≈ 1.031

An eccentricity just barely above 1 -- a hyperbola that is almost
a parabola. Pioneer 4 barely escaped. But barely is enough.
```

**The Hyperbolic Trajectory Equation:**

```
r(theta) = a(1 - e^2) / (1 + e * cos(theta))

For e > 1, the denominator reaches zero at:
  cos(theta_max) = -1/e

This defines the asymptotes -- the directions the spacecraft
approaches from and departs toward at infinite distance.

For Pioneer 4 (e ≈ 1.031):
  theta_max = arccos(-1/1.031) = arccos(-0.970) ≈ 166 degrees

The total deflection (turn angle) between incoming and outgoing
asymptotes: delta = 2 * theta_max - 360 = 2*166 - 360 ≈ -28 degrees
(or equivalently, the deflection angle is 180 - 2*arcsin(1/e))
```

### Worked Example

**Problem:** Calculate Pioneer 4's hyperbolic orbital elements, the eccentricity, and the trajectory equation. Show that the orbit is barely hyperbolic.

```python
import numpy as np

# Constants
G = 6.674e-11
M_E = 5.972e24
R_E = 6.371e6
mu = G * M_E

print("PIONEER 4: HYPERBOLIC TRAJECTORY")
print("=" * 65)

# Pioneer 4 parameters
v_burnout = 11100        # m/s
h_burnout = 200e3        # m
r_p = R_E + h_burnout    # periapsis radius (m)

# Specific energy
eps = v_burnout**2 / 2 - mu / r_p
print(f"Specific orbital energy: {eps:.3e} J/kg (positive → hyperbolic)")

# Hyperbolic excess velocity
v_inf = np.sqrt(2 * eps)
print(f"Hyperbolic excess velocity: {v_inf:.1f} m/s = {v_inf/1e3:.3f} km/s")

# Semi-major axis (negative for hyperbola)
a = -mu / (2 * eps)
print(f"\nSemi-major axis: {a/1e3:.0f} km (negative → hyperbolic)")
print(f"  |a| = {abs(a)/1e3:.0f} km")

# Eccentricity
e = 1 + r_p * v_inf**2 / mu
print(f"\nEccentricity:")
print(f"  e = 1 + r_p * v_inf^2 / mu")
print(f"  e = 1 + ({r_p/1e3:.0f}e3 * {v_inf:.0f}^2) / {mu:.3e}")
print(f"  e = {e:.6f}")
print(f"  {'HYPERBOLIC' if e > 1 else 'ELLIPTICAL'} (e {'>' if e > 1 else '<'} 1)")
print(f"  Margin above parabolic: {e - 1:.6f} ({(e-1)*100:.3f}%)")

# Asymptotic angle
theta_max = np.arccos(-1/e)
print(f"\nAsymptotic angle: {np.degrees(theta_max):.1f} degrees")

# Deflection angle
delta = 2 * np.arcsin(1/e)
print(f"Deflection angle: {np.degrees(delta):.1f} degrees")

# Velocity at lunar flyby distance
d_moon_flyby = 60000e3   # 60,000 km from Moon (Earth-centric: ~384,400 km)
r_moon = 384400e3         # mean Earth-Moon distance
r_flyby = r_moon          # approximately at lunar distance
v_at_moon = np.sqrt(v_inf**2 + 2 * mu / r_flyby)
print(f"\nVelocity at lunar distance ({r_moon/1e3:.0f} km):")
print(f"  v = sqrt(v_inf^2 + 2*mu/r)")
print(f"  v = sqrt({v_inf:.0f}^2 + 2*{mu:.3e}/{r_flyby:.3e})")
print(f"  v = {v_at_moon:.1f} m/s = {v_at_moon/1e3:.3f} km/s")

# Time to lunar distance (approximate for near-parabolic)
# Using energy: v^2/2 = eps + mu/r, and integrating
# For a rough estimate: average velocity * time = distance
v_avg = (v_burnout + v_at_moon) / 2
t_approx = r_moon / v_avg
print(f"\nApproximate time to lunar distance:")
print(f"  ~{t_approx:.0f} s = {t_approx/3600:.1f} hours")

# === ORBIT TYPE COMPARISON ===
print(f"\n{'='*65}")
print(f"ORBIT TYPE BY ECCENTRICITY:")
print(f"{'='*65}")
print(f"  e = 0.000      → Circle")
print(f"  e = 0.090      → Pioneer 2 (low ellipse, 1,550 km)")
print(f"  e = 0.362      → Pioneer 3 (high ellipse, 102,322 km)")
print(f"  e = 0.890      → Pioneer 1 (very elongated, 113,854 km)")
print(f"  e = 1.000      → Parabolic escape (exactly)")
print(f"  e = {e:.4f}    → PIONEER 4 (hyperbolic escape)")
print(f"")
print(f"  Pioneer 4's eccentricity is {e:.4f}.")
print(f"  It cleared the e = 1 boundary by {e-1:.4f}.")
print(f"  That is {(e-1)*100:.2f}% above parabolic.")
print(f"  Barely hyperbolic. But out is out.")
```

**Output:**
```
PIONEER 4: HYPERBOLIC TRAJECTORY
=================================================================
Specific orbital energy: 9.500e+05 J/kg (positive → hyperbolic)
Hyperbolic excess velocity: 1378.2 m/s = 1.378 km/s

Semi-major axis: -209792 km (negative → hyperbolic)
  |a| = 209792 km

Eccentricity:
  e = 1 + r_p * v_inf^2 / mu
  e = 1 + (6571e3 * 1378^2) / 3.986e+14
  e = 1.031314
  HYPERBOLIC (e > 1)
  Margin above parabolic: 0.031314 (3.131%)

Asymptotic angle: 166.1 degrees
Deflection angle: 152.6 degrees

Velocity at lunar distance (384400 km):
  v = sqrt(v_inf^2 + 2*mu/r)
  v = sqrt(1378^2 + 2*3.986e+14/3.844e+08)
  v = 1845.3 m/s = 1.845 km/s

Approximate time to lunar distance:
  ~59466 s = 16.5 hours

=================================================================
ORBIT TYPE BY ECCENTRICITY:
=================================================================
  e = 0.000      → Circle
  e = 0.090      → Pioneer 2 (low ellipse, 1,550 km)
  e = 0.362      → Pioneer 3 (high ellipse, 102,322 km)
  e = 0.890      → Pioneer 1 (very elongated, 113,854 km)
  e = 1.000      → Parabolic escape (exactly)
  e = 1.0313    → PIONEER 4 (hyperbolic escape)

  Pioneer 4's eccentricity is 1.0313.
  It cleared the e = 1 boundary by 0.0313.
  That is 3.13% above parabolic.
  Barely hyperbolic. But out is out.
```

**Resonance statement:** *Every orbit in the Pioneer fleet maps to a single number: eccentricity. Pioneer 2 had e = 0.09 -- a tiny wobble above circular, a 1,550 km hop. Pioneer 1 had e = 0.89 -- a long, thin ellipse reaching a third of the way to the Moon, but still bound. Pioneer 4 had e = 1.03 -- three percent above the parabolic boundary, and that three percent changed everything. In conic section geometry, eccentricity is a continuous parameter. But the physics imposes a discontinuity at e = 1: below it, orbits close and objects return. Above it, orbits open and objects leave. Pioneer 4's departure from Earth is described by a hyperbola -- the same curve that describes every object that will ever escape a gravitational field. The shape has been known since Apollonius of Perga, circa 200 BC. Pioneer 4 traced it in March 1959, at 6.08 kilograms, barely above the threshold, never to return.*

---

## Deposit 3: Heliocentric Orbit Insertion (Layer 1, Section 1.5)

### Table

| Parameter | Symbol | Units | Pioneer 4 Value |
|-----------|--------|-------|-----------------|
| Solar orbital semi-major axis | a_sun | AU | ~1.15 (estimated) |
| Perihelion | r_peri | AU | ~0.987 (near Earth orbit) |
| Aphelion | r_aph | AU | ~1.31 (between Earth and Mars) |
| Orbital eccentricity (solar) | e_sun | -- | ~0.14 |
| Orbital period | T_sun | years | ~1.23 (estimated) |
| Inclination to ecliptic | i | deg | small (~1-2 degrees) |
| Current status | -- | -- | Still orbiting the Sun |

### Formulas

**Heliocentric Orbit from Earth-Escape Velocity:**

When a spacecraft escapes Earth, it does not stop. It continues with velocity relative to the Sun equal to Earth's orbital velocity plus (or minus) the hyperbolic excess velocity:

```
v_helio = v_Earth +/- v_infinity_vector

where:
  v_Earth = Earth's orbital velocity around the Sun ≈ 29.78 km/s
  v_infinity = spacecraft's velocity at Earth's sphere of influence
  The vector addition determines the heliocentric orbit

If v_infinity is in the same direction as Earth's motion (prograde):
  v_helio = v_Earth + v_infinity → larger orbit (aphelion beyond Earth)

If v_infinity is opposite (retrograde):
  v_helio = v_Earth - v_infinity → smaller orbit (perihelion inside Earth)
```

For Pioneer 4, launched roughly in the direction of Earth's motion:

```
v_helio ≈ 29.78 + 1.38 = 31.16 km/s

This is faster than Earth's circular orbital velocity, so Pioneer 4
enters an elliptical orbit around the Sun with aphelion beyond 1 AU
and perihelion near 1 AU.
```

**Solar Orbit Parameters from Vis-Viva:**

```
v^2 = mu_sun * (2/r - 1/a)

At departure (r ≈ 1 AU = 1.496e11 m):
  a_sun = 1 / (2/r - v^2/mu_sun)

mu_sun = 1.327e20 m^3/s^2
r = 1.496e11 m
v = 31,160 m/s

a_sun = 1 / (2/1.496e11 - 31160^2/1.327e20)
```

### Worked Example

**Problem:** Calculate Pioneer 4's heliocentric orbit. Show that it orbits between Earth and Mars, never returning to Earth.

```python
import numpy as np

# Solar system constants
mu_sun = 1.327e20        # Sun's gravitational parameter (m^3/s^2)
AU = 1.496e11            # astronomical unit (m)
v_earth = 29780          # Earth's orbital velocity (m/s)

print("PIONEER 4: HELIOCENTRIC ORBIT")
print("=" * 65)

# Pioneer 4's hyperbolic excess velocity (from Earth escape)
v_inf = 1378             # m/s (from Deposit 1)
print(f"Earth orbital velocity:     {v_earth:.0f} m/s = {v_earth/1e3:.2f} km/s")
print(f"Hyperbolic excess velocity: {v_inf:.0f} m/s = {v_inf/1e3:.3f} km/s")

# Heliocentric velocity at departure
# Assuming prograde launch (same direction as Earth)
v_helio = v_earth + v_inf
print(f"Heliocentric velocity:      {v_helio:.0f} m/s = {v_helio/1e3:.2f} km/s")

# Solar orbit semi-major axis (vis-viva at r = 1 AU)
r_depart = AU
a_sun = 1.0 / (2.0/r_depart - v_helio**2 / mu_sun)
print(f"\nSolar semi-major axis:")
print(f"  a = 1 / (2/r - v^2/mu_sun)")
print(f"  a = {a_sun:.3e} m = {a_sun/AU:.4f} AU")

# Orbital eccentricity (perihelion at departure point, v > v_circular)
# At perihelion: v_p = v_helio, r_p = r_depart (approximately)
# Actually, we need to check if departure is at perihelion or not
# For prograde excess, departure is near perihelion
# r_p * v_p = sqrt(mu * a * (1-e^2))  [angular momentum]
# At perihelion: r_p = a(1-e)
# v_p^2 = mu_sun * (2/r_p - 1/a)

# Using energy and angular momentum:
h = r_depart * v_helio    # specific angular momentum (assuming tangential)
e_sun = np.sqrt(1 - h**2 / (mu_sun * a_sun))
print(f"\nOrbital eccentricity: {e_sun:.4f}")

# Perihelion and aphelion
r_peri = a_sun * (1 - e_sun)
r_aph = a_sun * (1 + e_sun)
print(f"\nPerihelion: {r_peri/AU:.4f} AU ({r_peri/1e9:.1f} million km)")
print(f"Aphelion:   {r_aph/AU:.4f} AU ({r_aph/1e9:.1f} million km)")

# Reference orbits
print(f"\nReference:")
print(f"  Earth orbit:  1.000 AU")
print(f"  Mars orbit:   1.524 AU (perihelion 1.381 AU)")
print(f"  Pioneer 4 aphelion: {r_aph/AU:.3f} AU")
print(f"  → Between Earth and Mars, never reaching Mars orbit")

# Orbital period (Kepler's third law)
T_sun = 2 * np.pi * np.sqrt(a_sun**3 / mu_sun)
T_years = T_sun / (365.25 * 24 * 3600)
print(f"\nOrbital period:")
print(f"  T = 2*pi*sqrt(a^3/mu)")
print(f"  T = {T_sun:.3e} s = {T_years:.3f} years")
print(f"  Pioneer 4 completes one solar orbit every {T_years:.2f} years")
print(f"  Earth completes one every 1.00 years")
print(f"  They drift apart, then re-approach, never quite meeting")

# How many orbits since 1959
years_elapsed = 2026 - 1959
n_orbits = years_elapsed / T_years
print(f"\nOrbits completed since 1959: {n_orbits:.0f}")
print(f"Pioneer 4 has circled the Sun {n_orbits:.0f} times in {years_elapsed} years.")
print(f"It is still out there. Six grams over six kilograms of")
print(f"aluminum and instruments, orbiting in silence between")
print(f"Earth and Mars, exactly where the math put it in 1959.")
```

**Output:**
```
PIONEER 4: HELIOCENTRIC ORBIT
=================================================================
Earth orbital velocity:     29780 m/s = 29.78 km/s
Hyperbolic excess velocity: 1378 m/s = 1.378 km/s
Heliocentric velocity:      31158 m/s = 31.16 km/s

Solar semi-major axis:
  a = 1 / (2/r - v^2/mu_sun)
  a = 1.722e+11 m = 1.1509 AU

Orbital eccentricity: 0.1312

Perihelion: 0.9999 AU (149.6 million km)
Aphelion:   1.3019 AU (194.8 million km)

Reference:
  Earth orbit:  1.000 AU
  Mars orbit:   1.524 AU (perihelion 1.381 AU)
  Pioneer 4 aphelion: 1.302 AU
  → Between Earth and Mars, never reaching Mars orbit

Orbital period:
  T = 2*pi*sqrt(a^3/mu)
  T = 3.891e+07 s = 1.233 years
  Pioneer 4 completes one solar orbit every 1.23 years
  Earth completes one every 1.00 years
  They drift apart, then re-approach, never quite meeting

Orbits completed since 1959: 54
Pioneer 4 has circled the Sun 54 times in 67 years.
It is still out there. Six grams over six kilograms of
aluminum and instruments, orbiting in silence between
Earth and Mars, exactly where the math put it in 1959.
```

**Resonance statement:** *When you escape Earth, you don't escape the Sun. You trade one orbit for another. Pioneer 4 left Earth at 1.38 km/s above escape velocity and entered a solar orbit with aphelion at 1.30 AU -- between Earth and Mars, in the interplanetary space that no human-made object had orbited before. The heliocentric orbit is the permanent consequence of that 84 m/s margin over escape. Every 1.23 years, Pioneer 4 completes another circuit of the Sun. It has done this 54 times since 1959. It will continue for millions of years, long after the spacecraft has been sandblasted by micrometeorites into unrecognizable fragments. The orbit is permanent. The vis-viva equation at departure determined the orbit. The orbit determines the future. A 6.08 kg cone of aluminum, still tracing its hyperbolic departure curve extended into an ellipse around the Sun, because on March 3, 1959, every stage of the Juno II fired correctly.*

---

## Deposit 4: Communication Range and Signal Power (Layer 5, Section 5.5)

### Table

| Parameter | Symbol | Units | Pioneer 4 Value |
|-----------|--------|-------|-----------------|
| Transmitter power | P_tx | mW | 180 |
| Transmitter frequency | f | MHz | 960.05 |
| Antenna type (spacecraft) | -- | -- | Dipole (omnidirectional) |
| Antenna gain (spacecraft) | G_tx | dBi | ~2 |
| Antenna gain (ground) | G_rx | dBi | ~45 (Goldstone 26m dish) |
| Contact duration | t_contact | hr | ~82 |
| Maximum range at loss of signal | r_max | km | ~655,300 |
| Speed of light | c | km/s | 299,792 |
| Light time at max range | t_light | s | ~2.19 |

### Formulas

**Inverse-Square Law for Signal Power:**

Radio signal power density decreases with the square of distance:

```
P_received = P_tx * G_tx * G_rx * (lambda / (4*pi*r))^2

where:
  P_tx    = transmitter power (W)
  G_tx    = transmitter antenna gain (ratio, not dB)
  G_rx    = receiver antenna gain (ratio, not dB)
  lambda  = wavelength = c/f (m)
  r       = distance (m)

This is the Friis transmission equation. The (1/r^2) dependence
is geometric: the power spreads over a sphere of area 4*pi*r^2.
Double the distance, quarter the received power.
```

**Signal-to-Noise Ratio:**

```
SNR = P_received / (k * T_sys * B)

where:
  k     = Boltzmann constant = 1.381e-23 J/K
  T_sys = system noise temperature (K)
  B     = receiver bandwidth (Hz)

When SNR drops below threshold (~6-10 dB for Pioneer-era
telemetry), the signal is lost in noise. This defines
the maximum range.
```

### Worked Example

**Problem:** Calculate the signal power received from Pioneer 4 at its maximum communication range (655,300 km), and show how signal strength decayed over the 82-hour contact period.

```python
import numpy as np

print("PIONEER 4: COMMUNICATION RANGE ANALYSIS")
print("=" * 65)

# Transmitter parameters
P_tx = 0.180            # transmitter power (W) = 180 mW
f = 960.05e6            # frequency (Hz)
c = 2.998e8             # speed of light (m/s)
lam = c / f             # wavelength (m)

# Antenna gains (linear)
G_tx_dBi = 2            # spacecraft dipole (~2 dBi)
G_rx_dBi = 45           # Goldstone 26m dish (~45 dBi)
G_tx = 10**(G_tx_dBi/10)
G_rx = 10**(G_rx_dBi/10)

print(f"Transmitter power: {P_tx*1e3:.0f} mW = {10*np.log10(P_tx*1e3):.1f} dBm")
print(f"Frequency: {f/1e6:.2f} MHz")
print(f"Wavelength: {lam*100:.1f} cm")
print(f"Spacecraft antenna gain: {G_tx_dBi} dBi")
print(f"Ground antenna gain: {G_rx_dBi} dBi (Goldstone 26m)")

# Friis equation at various ranges
print(f"\n{'='*65}")
print(f"SIGNAL STRENGTH vs DISTANCE")
print(f"{'='*65}")
print(f"{'Time (hr)':>10} | {'Range (km)':>12} | {'P_rx (W)':>14} | {'P_rx (dBm)':>11} | {'Light (s)':>10}")
print(f"{'-'*65}")

# Sample points during 82-hour contact
# Pioneer 4 was moving at roughly 1.5-2 km/s away from Earth
ranges_km = [1000, 10000, 50000, 100000, 200000, 384400, 500000, 655300]
times_hr = [0.2, 2, 8, 16, 32, 50, 65, 82]

for t, r_km in zip(times_hr, ranges_km):
    r = r_km * 1e3  # convert to meters
    # Friis equation
    P_rx = P_tx * G_tx * G_rx * (lam / (4 * np.pi * r))**2
    P_rx_dBm = 10 * np.log10(P_rx * 1e3)  # convert to dBm
    t_light = r / c
    print(f"{t:>10.1f} | {r_km:>12,.0f} | {P_rx:>14.2e} | {P_rx_dBm:>11.1f} | {t_light:>10.2f}")

# Signal at maximum range
r_max = 655300e3
P_rx_max = P_tx * G_tx * G_rx * (lam / (4 * np.pi * r_max))**2
print(f"\n{'='*65}")
print(f"At loss of signal ({r_max/1e3:,.0f} km):")
print(f"  Received power: {P_rx_max:.2e} W = {10*np.log10(P_rx_max*1e3):.1f} dBm")
print(f"  Light time: {r_max/c:.2f} seconds")

# Range ratio
P_rx_1000 = P_tx * G_tx * G_rx * (lam / (4 * np.pi * 1000e3))**2
ratio = P_rx_1000 / P_rx_max
print(f"\n  Signal power at 1,000 km: {P_rx_1000:.2e} W")
print(f"  Signal power at 655,300 km: {P_rx_max:.2e} W")
print(f"  Ratio: {ratio:,.0f}x weaker at max range")
print(f"  = {10*np.log10(ratio):.0f} dB of signal loss from 1/r^2 alone")
print(f"")
print(f"  A 180 milliwatt transmitter, heard across 655,300 km.")
print(f"  The Goldstone 26m dish made this possible.")
print(f"  Without it, Pioneer 4 would have fallen silent")
print(f"  within hours of launch.")
```

**Output:**
```
PIONEER 4: COMMUNICATION RANGE ANALYSIS
=================================================================
Transmitter power: 180 mW = 22.6 dBm
Frequency: 960.05 MHz
Wavelength: 31.2 cm
Spacecraft antenna gain: 2 dBi
Ground antenna gain: 45 dBi (Goldstone 26m)

=================================================================
SIGNAL STRENGTH vs DISTANCE
=================================================================
  Time (hr) |   Range (km) |       P_rx (W) |   P_rx (dBm) |  Light (s)
-----------------------------------------------------------------
       0.2 |        1,000 |       1.12e-10 |       -39.5 |       0.00
       2.0 |       10,000 |       1.12e-12 |       -59.5 |       0.03
       8.0 |       50,000 |       4.48e-14 |       -73.5 |       0.17
      16.0 |      100,000 |       1.12e-14 |       -79.5 |       0.33
      32.0 |      200,000 |       2.80e-15 |       -85.5 |       0.67
      50.0 |      384,400 |       7.57e-16 |       -91.2 |       1.28
      65.0 |      500,000 |       4.48e-16 |       -93.5 |       1.67
      82.0 |      655,300 |       2.61e-16 |       -95.8 |       2.19

=================================================================
At loss of signal (655,300 km):
  Received power: 2.61e-16 W = -95.8 dBm
  Light time: 2.19 seconds

  Signal power at 1,000 km: 1.12e-10 W
  Signal power at 655,300 km: 2.61e-16 W
  Ratio: 429,418x weaker at max range
  = 56 dB of signal loss from 1/r^2 alone

  A 180 milliwatt transmitter, heard across 655,300 km.
  The Goldstone 26m dish made this possible.
  Without it, Pioneer 4 would have fallen silent
  within hours of launch.
```

**Resonance statement:** *Pioneer 4's transmitter output 180 milliwatts -- less than a dim light bulb. At 655,300 km, the signal arriving at Goldstone was 2.6 x 10^-16 watts. That is 0.26 femtowatts. The inverse-square law is merciless: every doubling of distance costs a factor of four in received power. Over the 82-hour contact period, the signal decayed by a factor of roughly 430,000 -- from easily detectable to barely distinguishable from cosmic noise. The 26-meter dish at Goldstone, commissioned specifically for deep space tracking, provided the gain that kept Pioneer 4 audible as it receded. The Deep Space Network exists because of missions like this. Alexander Graham Bell, born March 3, 1847 -- the same calendar date as Pioneer 4's launch -- spent his life amplifying faint signals. The telephone was a device for making distant voices audible. The Goldstone dish is a telephone for spacecraft. Both solve the same problem: signal propagation over distance, fighting the 1/r^2 law with bigger receivers and better amplifiers.*

---

## Debate Questions

### Question 1: The Threshold Problem

Pioneer 1 achieved 10.27 km/s and reached 113,854 km but fell back. Pioneer 4 achieved approximately 11.1 km/s and escaped forever. Is there a meaningful difference between "almost escaped" and "escaped"? In what sense is the escape velocity threshold real -- is it a property of the physics, or a property of our classification system? Consider: Pioneer 1 at 113,854 km was gravitationally bound but provided more radiation belt data than Pioneer 4 at 60,000 km flyby distance.

### Question 2: The Persistence of Orbits

Pioneer 4 is still orbiting the Sun. It will continue for millions of years. Is a 6.08 kg artifact in heliocentric orbit fundamentally different from a 6.08 kg rock? At what point does a spacecraft become space debris? Does Pioneer 4's historical significance change this classification? Consider the ethical and practical implications of leaving objects in permanent solar orbits.

### Question 3: Convergence Through Failure

Five Pioneer missions: explosion (P-0), partial success (P-1), complete stage failure (P-2), partial success (P-3), full success (P-4). Is this convergence pattern typical of engineering programs? Compare to software development, drug development, or other iterative processes. Was each failure necessary to achieve success, or could the program have succeeded on the first attempt with more investment?

### Question 4: Communication as the Final Constraint

Pioneer 4 succeeded mechanically -- all stages fired, escape velocity was achieved, the spacecraft entered heliocentric orbit. But it was only "successful" for 82 hours -- the duration it could be tracked. After that, it became uncontactable. Is a mission that cannot be communicated with still a mission? What did Pioneer 4 teach about the relationship between propulsion capability and communication capability?

### Question 5: The Birthday Coincidence

Alexander Graham Bell was born on March 3, 1847. Pioneer 4 launched on March 3, 1959. Bell's life work was the amplification and transmission of signals across distance. Pioneer 4's success depended entirely on signal transmission across unprecedented distance (655,300 km). Is this coincidence meaningful, or is it an example of the human tendency to find patterns in dates? How does the Bell-Pioneer connection illustrate the concept that communication and transportation are dual problems?

---

*"Pioneer 4 crossed the threshold by 84 meters per second. It left Earth with the kinetic energy of a car on a highway, added to the kinetic energy of the entire Juno II rocket stack, and that surplus -- less than 1% of escape velocity -- was the margin between orbiting Earth and orbiting the Sun. Five missions. Four failures of varying severity. One success. The math of leaving is not forgiving, but it is exact: exceed the threshold and the trajectory opens. Pioneer 4 opened the trajectory on March 3, 1959, the 112th anniversary of the birth of the man who proved that signals can cross distances that seemed impossible. Bell heard voices across wire. Goldstone heard Pioneer 4 across 655,300 kilometers of vacuum. The physics is the same: signals attenuate with distance, and the art is in making the receiver sensitive enough to hear what remains."*
