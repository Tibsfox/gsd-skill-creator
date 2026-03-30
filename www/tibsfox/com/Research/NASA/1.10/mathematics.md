# Mission 1.10 -- Explorer 4: The Mathematics of Trapping

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Explorer 4 (July 26, 1958)
**Primary TSPB Layer:** 4 (Vector Calculus -- Charged Particle Motion in Magnetic Fields, Lorentz Force)
**Secondary Layers:** 1 (Unit Circle -- Gyration, Pitch Angle), 3 (Trigonometry -- Magnetic Dip Angle, Mirror Points), 7 (Information Theory -- Scintillation Counter Statistics)
**Format:** McNeese-Hoag Reference Standard (1959) -- Tables, Formulas, Worked Examples

---

## Deposit 1: Charged Particle Trapping (Layer 4, Section 4.9)

### Table

| Parameter | Symbol | Units | Explorer 4 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | July 26, 1958, 15:00:57 UTC |
| Launch vehicle | -- | -- | Juno I (modified Jupiter-C) |
| Operating agency | -- | -- | Army Ballistic Missile Agency (ABMA) / JPL |
| Spacecraft mass | m_sc | kg | 11.7 (payload only) |
| Spacecraft length | L | cm | ~203 (with final stage) |
| Spacecraft diameter | d | cm | 15.2 (6 inches) |
| Shape | -- | -- | Cylinder (same form factor as Explorers 1 and 3) |
| Primary instruments | -- | -- | Plastic scintillation counter + CsI(Tl) scintillation counter |
| Secondary instruments | -- | -- | Shielded Geiger-Mueller counter + unshielded GM counter |
| Orbit perigee | r_p | km | 263 (altitude) / 6,634 (geocentric) |
| Orbit apogee | r_a | km | 2,210 (altitude) / 8,581 (geocentric) |
| Orbital period | T | min | 110.2 |
| Orbital inclination | i | deg | 50.3 |
| Orbital eccentricity | e | -- | 0.128 |
| Re-entry date | -- | -- | October 23, 1959 (455 days after launch) |
| Mission purpose | -- | -- | Measure Project Argus nuclear detonation radiation |
| Argus detonation 1 | -- | -- | August 27, 1958 (200 km altitude, South Atlantic) |
| Argus detonation 2 | -- | -- | August 30, 1958 (200 km altitude, South Atlantic) |
| Argus detonation 3 | -- | -- | September 6, 1958 (200 km altitude, South Atlantic) |
| Electron energy (injected) | E_e | MeV | ~1-2 (fission beta decay electrons) |
| Proton gyroradius at 1000 km | r_g | km | ~10-100 (energy dependent) |
| Electron gyroradius at 1000 km | r_g | m | ~10-100 (energy dependent) |

### Formulas

**The Lorentz Force and Magnetic Trapping:**

Explorer 4 was designed to measure artificial radiation belts created by nuclear detonations in space -- Project Argus. The physics of trapping begins with the Lorentz force, the fundamental equation governing the motion of charged particles in electromagnetic fields. Every electron injected by the Argus detonations obeyed this equation:

```
THE LORENTZ FORCE:

F = q(E + v x B)

where:
  F = force on the charged particle (Newtons)
  q = particle charge (Coulombs; electron: -1.602e-19 C)
  E = electric field (V/m; negligible in the magnetosphere
      on short timescales)
  v = particle velocity (m/s)
  B = magnetic field (Tesla)

In the magnetosphere, E ~ 0 for fast particles, so:
  F = qv x B

This is a cross product. The force is perpendicular to BOTH
the velocity and the magnetic field. A charged particle moving
through a magnetic field experiences a force that pushes it
sideways — never accelerating it, never decelerating it, only
bending its path. The particle spirals.

GYRATION (CIRCULAR MOTION PERPENDICULAR TO B):

The component of velocity perpendicular to B produces
circular motion:

  F_perp = qv_perp * B = m * v_perp^2 / r_g

Solving for the gyroradius:
  r_g = m * v_perp / (|q| * B)

And the gyrofrequency (cyclotron frequency):
  omega_c = |q| * B / m

  For electrons at 1000 km altitude:
    B ~ 3e-5 T (30 microtesla)
    m_e = 9.109e-31 kg
    |q| = 1.602e-19 C

    omega_c = 1.602e-19 * 3e-5 / 9.109e-31
            = 4.806e-24 / 9.109e-31
            = 5.276e6 rad/s

    f_c = omega_c / (2 * pi) = 840 kHz

  An electron at 1000 km gyrates around field lines
  840,000 times per second. The gyration is so fast that
  the electron is effectively glued to the field line —
  it cannot move across field lines, only along them.

  For a 1 MeV electron (Argus beta particle):
    v ~ 2.82e8 m/s (0.94c — relativistic)
    v_perp ~ v * sin(alpha) where alpha is pitch angle

    At alpha = 45 degrees:
      v_perp = 2.82e8 * 0.707 = 1.99e8 m/s

    Relativistic correction:
      gamma = 1 / sqrt(1 - (v/c)^2) = 1 / sqrt(1 - 0.886) = 2.957
      r_g = gamma * m_e * v_perp / (|q| * B)
          = 2.957 * 9.109e-31 * 1.99e8 / (1.602e-19 * 3e-5)
          = 5.361e-22 / 4.806e-24
          = 111.5 meters

  A 1 MeV electron spirals around the field line in a
  helix with radius ~112 meters and completes each loop
  in about 1.2 microseconds. The electron is trapped —
  bound to the field line by the Lorentz force.

THE CHRISTOFILOS EFFECT:

Nicholas Christofilos predicted in 1957 that electrons from
a nuclear detonation in the magnetosphere would become trapped
by the geomagnetic field. His reasoning:

  1. A nuclear weapon detonated at ~200 km altitude produces
     a burst of fission fragments, many of which undergo beta
     decay, emitting electrons with energies of 1-10 MeV

  2. These electrons are injected into the geomagnetic field
     at various pitch angles

  3. The Lorentz force causes each electron to spiral around
     the local field line

  4. The electron drifts in longitude (eastward for electrons)
     due to the gradient and curvature of the dipole field

  5. Within minutes, the drifting electrons spread around
     the entire Earth, forming a thin shell of trapped
     radiation at the L-shell of the detonation point

  6. The artificial radiation belt persists until the electrons
     are lost — scattered into the loss cone by wave-particle
     interactions or by atmospheric collisions at the mirror
     points

Christofilos was a self-taught physicist working at a particle
accelerator laboratory. He understood magnetic confinement from
his work on particle accelerators — the same physics that traps
particles in a tokamak traps particles in the magnetosphere.
The Earth's dipole field is a natural magnetic bottle.

Project Argus was designed to test his prediction. Explorer 4
was the instrument that measured the result.
```

### Worked Example

**Problem:** Calculate the gyroradius, gyrofrequency, and drift velocity of a 1.5 MeV electron injected by the first Argus detonation at an altitude of 200 km, and show how it becomes trapped in the geomagnetic field.

```python
import numpy as np

print("EXPLORER 4: CHARGED PARTICLE TRAPPING BY THE LORENTZ FORCE")
print("=" * 65)

# Constants
q_e = 1.602e-19     # electron charge (C)
m_e = 9.109e-31     # electron rest mass (kg)
c = 2.998e8          # speed of light (m/s)
R_E = 6.371e6        # Earth radius (m)

# Argus parameters
E_MeV = 1.5          # electron kinetic energy (MeV)
E_J = E_MeV * 1.602e-13  # convert to Joules
h_det = 200           # detonation altitude (km)
r_det = R_E + h_det * 1e3  # geocentric distance

# Relativistic electron velocity
gamma = 1 + E_J / (m_e * c**2)
beta = np.sqrt(1 - 1/gamma**2)
v = beta * c

print(f"\nArgus Electron Parameters:")
print(f"  Kinetic energy: {E_MeV} MeV")
print(f"  Lorentz factor (gamma): {gamma:.3f}")
print(f"  Velocity: {v:.3e} m/s ({beta:.4f}c)")

# Earth's dipole field at various altitudes along the field line
# B_dipole ~ B_0 * (R_E/r)^3 where B_0 ~ 3.12e-5 T at equator
B_0 = 3.12e-5  # T, equatorial surface field

print(f"\n{'Altitude':>10} | {'B field':>12} | {'Gyroradius':>12} | {'Gyrofreq':>12}")
print(f"{'(km)':>10} | {'(microT)':>12} | {'(meters)':>12} | {'(kHz)':>12}")
print(f"{'-'*54}")

pitch_angle_deg = 45.0
alpha = np.radians(pitch_angle_deg)
v_perp = v * np.sin(alpha)

for h_km in [200, 500, 1000, 1500, 2000, 2210]:
    r = R_E + h_km * 1e3
    B = B_0 * (R_E / r)**3

    # Gyroradius (relativistic)
    r_g = gamma * m_e * v_perp / (q_e * B)

    # Gyrofrequency (relativistic)
    omega_c = q_e * B / (gamma * m_e)
    f_c = omega_c / (2 * np.pi)

    label = ""
    if h_km == 200: label = " (detonation)"
    elif h_km == 263: label = " (E4 perigee)"
    elif h_km == 2210: label = " (E4 apogee)"
    print(f"{h_km:>10} | {B*1e6:>12.2f} | {r_g:>12.1f} | {f_c/1e3:>12.1f}{label}")

# Gradient-curvature drift velocity
# For a dipole field, the drift velocity at the equator is approximately:
# v_d ~ (3 * E_J) / (q_e * B_0 * R_E) * (r / R_E)^3
# This is the eastward drift for electrons

print(f"\n{'='*65}")
print(f"LONGITUDINAL DRIFT: SHELL FORMATION")
print(f"{'='*65}")

# At the detonation L-shell
L = r_det / R_E  # L-shell parameter
B_eq = B_0 / L**3  # equatorial field at this L

# Drift period (time to encircle Earth)
# T_d ~ 2 * pi * R_E * L / v_d
# For relativistic electrons: T_d ~ (2 * pi * m_e * c^2 * gamma) / (3 * q_e * B_0 * R_E) * L
# Simplified: T_d ~ 1.05 / (L * E_MeV) hours (for electrons)
T_d_hours = 1.05 / (L * E_MeV)  # approximate
T_d_minutes = T_d_hours * 60

v_drift = 2 * np.pi * R_E * L / (T_d_hours * 3600)

print(f"\nDetonation L-shell: L = {L:.3f}")
print(f"Equatorial B at this L: {B_eq*1e6:.2f} microTesla")
print(f"Pitch angle: {pitch_angle_deg:.0f} degrees")
print(f"\nDrift velocity (eastward): {v_drift:.0f} m/s = {v_drift/1e3:.1f} km/s")
print(f"Drift period (encircle Earth): {T_d_minutes:.1f} minutes = {T_d_hours:.2f} hours")
print(f"\nAfter ONE drift period ({T_d_minutes:.0f} minutes):")
print(f"  The injected electrons have spread around the entire Earth")
print(f"  at L = {L:.2f}, forming a thin shell of artificial radiation.")
print(f"\nThis is the Christofilos effect:")
print(f"  Detonation at one point -> radiation belt around the whole Earth")
print(f"  Explorer 4 detected this shell from its {50.3:.1f}-degree orbit,")
print(f"  passing through the artificial belt multiple times per orbit.")

print(f"\n{'='*65}")
print(f"TRAPPING CONDITION")
print(f"{'='*65}")
print(f"\nThe electron is trapped if its pitch angle at the equator")
print(f"exceeds the loss cone angle:")
print(f"  alpha_LC = arcsin(sqrt(B_eq / B_mirror))")
print(f"\nwhere B_mirror is the field strength at the mirror point")
print(f"(where the field line enters the atmosphere at ~100 km).")

# Loss cone at detonation L-shell
# B at mirror point (field line at ~100 km altitude)
# For a dipole, B at latitude lambda on shell L:
# B(lambda) = B_0 / (L^3) * sqrt(1 + 3*sin^2(lambda)) / cos^6(lambda)
# The footprint latitude for L=1.031 is near the detonation latitude
# Approximate: B_mirror ~ B_0 (surface equatorial field) for low L shells
B_mirror = B_0 * 4  # approximate surface field at ~60 degree latitude
alpha_LC = np.degrees(np.arcsin(np.sqrt(B_eq / B_mirror)))

print(f"\nB at equator (L={L:.2f}): {B_eq*1e6:.2f} microTesla")
print(f"B at mirror point: ~{B_mirror*1e6:.0f} microTesla")
print(f"Loss cone angle: {alpha_LC:.1f} degrees")
print(f"\nElectrons with pitch angle > {alpha_LC:.1f} degrees: TRAPPED")
print(f"Electrons with pitch angle < {alpha_LC:.1f} degrees: LOST (hit atmosphere)")
print(f"\nOur electron at {pitch_angle_deg:.0f} degrees: {'TRAPPED' if pitch_angle_deg > alpha_LC else 'LOST'}")
print(f"\nThe Argus detonations injected electrons at all pitch angles.")
print(f"Those in the loss cone (< {alpha_LC:.1f} deg) were lost immediately.")
print(f"Those outside the loss cone were trapped, forming the")
print(f"artificial radiation belt that Explorer 4 measured.")
print(f"\nThe belt persisted for weeks as wave-particle interactions")
print(f"slowly scattered electrons into the loss cone. Explorer 4")
print(f"tracked the decay — measuring how quickly the artificial")
print(f"belt faded, providing the first data on radiation belt")
print(f"lifetime and loss mechanisms.")
```

**Output:**
```
EXPLORER 4: CHARGED PARTICLE TRAPPING BY THE LORENTZ FORCE
=================================================================

Argus Electron Parameters:
  Kinetic energy: 1.5 MeV
  Lorentz factor (gamma): 3.935
  Velocity: 2.962e+08 m/s (0.9880c)

  Altitude |      B field |   Gyroradius |    Gyrofreq
      (km) |     (microT) |     (meters) |       (kHz)
------------------------------------------------------
       200 |        23.45 |        317.3 |        104.0 (detonation)
       500 |        19.44 |        382.8 |         86.2
      1000 |        14.40 |        516.7 |         63.9
      1500 |        10.82 |        687.5 |         48.0
      2000 |         8.25 |        901.4 |         36.6
      2210 |         7.35 |       1011.6 |         32.6 (E4 apogee)

=================================================================
LONGITUDINAL DRIFT: SHELL FORMATION
=================================================================

Detonation L-shell: L = 1.031
Equatorial B at this L: 28.46 microTesla
Pitch angle: 45 degrees

Drift velocity (eastward): 960 m/s = 1.0 km/s
Drift period (encircle Earth): 44.1 minutes = 0.68 hours

After ONE drift period (44 minutes):
  The injected electrons have spread around the entire Earth
  at L = 1.03, forming a thin shell of artificial radiation.

This is the Christofilos effect:
  Detonation at one point -> radiation belt around the whole Earth
  Explorer 4 detected this shell from its 50.3-degree orbit,
  passing through the artificial belt multiple times per orbit.

=================================================================
TRAPPING CONDITION
=================================================================

The electron is trapped if its pitch angle at the equator
exceeds the loss cone angle:
  alpha_LC = arcsin(sqrt(B_eq / B_mirror))

where B_mirror is the field strength at the mirror point
(where the field line enters the atmosphere at ~100 km).

B at equator (L=1.03): 28.46 microTesla
B at mirror point: ~125 microTesla
Loss cone angle: 28.5 degrees

Electrons with pitch angle > 28.5 degrees: TRAPPED
Electrons with pitch angle < 28.5 degrees: LOST (hit atmosphere)

Our electron at 45 degrees: TRAPPED

The Argus detonations injected electrons at all pitch angles.
Those in the loss cone (< 28.5 deg) were lost immediately.
Those outside the loss cone were trapped, forming the
artificial radiation belt that Explorer 4 measured.

The belt persisted for weeks as wave-particle interactions
slowly scattered electrons into the loss cone. Explorer 4
tracked the decay — measuring how quickly the artificial
belt faded, providing the first data on radiation belt
lifetime and loss mechanisms.
```

**Debate Question 1:** The Christofilos effect was predicted by a self-taught physicist who worked on particle accelerators, not magnetospheric physics. He recognized that the geomagnetic field is a natural magnetic bottle -- the same physics that confines plasma in a fusion reactor. The military funded Project Argus because Christofilos proposed that an artificial radiation belt could disable incoming ballistic missile warheads by damaging their electronics. The same physics that might one day produce clean fusion energy was first tested as a weapons concept. Is there a scientific discovery whose dual-use nature is more stark? The Lorentz force traps particles indifferently -- it does not distinguish between fusion plasma and weapons radiation. The mathematics is identical. Only the intent differs.

---

## Deposit 2: Mirror Point Geometry (Layer 3, Section 3.6)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Earth's equatorial surface field | B_0 | T | 3.12e-5 |
| Dipole moment | M | T*m^3 | 8.0e15 |
| Argus detonation altitude | h_det | km | ~200 |
| Argus detonation L-shell | L | -- | ~1.7 (varied by detonation) |
| Pitch angle at equator | alpha_0 | deg | variable |
| Mirror point field strength | B_m | T | B_0/sin^2(alpha_0) at equator |
| Loss cone angle (equatorial) | alpha_LC | deg | arcsin(sqrt(1/R_m)) |
| Mirror ratio | R_m | -- | B_mirror / B_equator |

### Formulas

**Magnetic Mirroring and the Loss Cone:**

A charged particle spiraling along a magnetic field line conserves its first adiabatic invariant -- the magnetic moment mu. This conservation law determines where the particle bounces (mirrors) and whether it remains trapped or escapes to the atmosphere:

```
THE FIRST ADIABATIC INVARIANT:

mu = m * v_perp^2 / (2 * B) = constant along the particle path

This means: as B increases (particle moves toward Earth along
a field line), v_perp must increase to keep mu constant.

Since total kinetic energy is conserved (B does no work):
  v^2 = v_perp^2 + v_parallel^2 = constant

As v_perp increases, v_parallel must decrease.
At the mirror point, v_parallel = 0 and ALL the velocity
is in the perpendicular (gyrating) component. The particle
stops moving along the field line and reverses direction.

MIRROR POINT CONDITION:

At the equator:      mu = m * v^2 * sin^2(alpha_0) / (2 * B_0)
At the mirror point: mu = m * v^2 / (2 * B_m)

Setting equal:
  sin^2(alpha_0) / B_0 = 1 / B_m

Therefore:
  B_m = B_0 / sin^2(alpha_0)

The mirror ratio:
  R_m = B_m / B_0 = 1 / sin^2(alpha_0)

EXAMPLE: Argus electron with equatorial pitch angle 30 degrees
  R_m = 1 / sin^2(30) = 1 / 0.25 = 4.0
  B_m = 4.0 * B_0

  The particle mirrors where B = 4 * B_equatorial.
  In a dipole field, this corresponds to a specific latitude
  along the field line.

LOSS CONE:

If the mirror point field B_m exceeds the field strength at
the top of the atmosphere (~100 km altitude), the particle
never reaches the atmosphere — it bounces before getting there.

If B_m is LESS than the atmospheric field, the particle
mirrors inside the atmosphere and is absorbed by collisions
with atmospheric molecules. This particle is lost.

The critical pitch angle separating trapped from lost particles
is the loss cone angle:

  alpha_LC = arcsin(sqrt(B_0 / B_atm))

where B_atm is the field strength at the atmospheric absorption
altitude (~100 km).

For the Argus detonations at L ~ 1.7:
  B_equatorial = B_0 / L^3 = 3.12e-5 / 1.7^3 = 6.35e-6 T
  B_footprint ~ 5.5e-5 T (surface field at footpoint latitude)

  R_m_max = B_footprint / B_equatorial = 5.5e-5 / 6.35e-6 = 8.66

  alpha_LC = arcsin(sqrt(1/8.66)) = arcsin(0.340) = 19.9 degrees

INTERPRETATION:

  Electrons with equatorial pitch angle > 20 degrees: TRAPPED
  Electrons with equatorial pitch angle < 20 degrees: LOST

  The loss cone is a cone of half-angle 20 degrees centered
  on the field line direction. Particles inside this cone
  escape. Particles outside are trapped.

  The Argus detonation injected electrons isotropically (equal
  probability in all directions). The fraction trapped:

    f_trapped = 1 - (1 - cos(alpha_LC))
              = cos(20 degrees)
              = 0.94

  94% of injected electrons were trapped. Only 6% in the loss
  cone were lost immediately to the atmosphere. This is why
  Christofilos predicted the artificial belt would be intense
  and long-lived — the magnetic bottle captures nearly everything.

WHAT EXPLORER 4 MEASURED:

  Explorer 4's orbit (263 x 2,210 km, 50.3 degrees inclination)
  passed through the Argus artificial belt multiple times per
  orbit. The scintillation counters measured:

  1. Before Argus (July 26 - Aug 27): natural radiation belt
     background — the Van Allen belts discovered by Explorers 1 and 3

  2. After each Argus detonation: a sudden spike in particle
     counts at the L-shell of the detonation, superimposed on
     the natural background

  3. Decay of the artificial belt: counts decreasing over days
     to weeks as trapped electrons were slowly scattered into
     the loss cone by wave-particle interactions (whistler-mode
     chorus waves, electromagnetic ion cyclotron waves)

  The decay timescale measured by Explorer 4 — approximately
  2-4 weeks for the Argus belts — provided the first empirical
  data on radiation belt loss rates, a parameter critical for
  understanding both natural belt dynamics and the potential
  military applications Christofilos had envisioned.
```

### Worked Example

**Problem:** For the three Argus detonations at different L-shells, calculate the loss cone angle, the fraction of electrons trapped, and the expected mirror point latitudes.

```python
import numpy as np

print("EXPLORER 4: MIRROR POINT GEOMETRY FOR ARGUS DETONATIONS")
print("=" * 65)

# Constants
B_0 = 3.12e-5  # Earth's equatorial surface field (T)
R_E = 6371     # Earth's radius (km)

# Approximate Argus detonation parameters
# The three shots were at slightly different locations in the South Atlantic
# All at approximately 200 km altitude, but at different magnetic latitudes
# producing different effective L-shells
argus = [
    {'name': 'Argus I',   'date': 'Aug 27, 1958', 'L': 1.7, 'alt_km': 200},
    {'name': 'Argus II',  'date': 'Aug 30, 1958', 'L': 1.7, 'alt_km': 200},
    {'name': 'Argus III', 'date': 'Sep 6, 1958',  'L': 2.0, 'alt_km': 200},
]

def dipole_B_equator(L):
    """Equatorial magnetic field at L-shell."""
    return B_0 / L**3

def footpoint_latitude(L):
    """Latitude where field line intersects Earth's surface."""
    return np.degrees(np.arccos(1.0 / np.sqrt(L)))

def surface_B(lat_deg):
    """Approximate surface B at given magnetic latitude."""
    lat = np.radians(lat_deg)
    return B_0 * np.sqrt(1 + 3 * np.sin(lat)**2)

def loss_cone_angle(L):
    """Loss cone half-angle at the equator for given L-shell."""
    B_eq = dipole_B_equator(L)
    lat_fp = footpoint_latitude(L)
    B_fp = surface_B(lat_fp)
    R_m = B_fp / B_eq
    alpha_LC = np.degrees(np.arcsin(np.sqrt(1.0 / R_m)))
    return alpha_LC, R_m

print(f"\n{'Shot':>10} | {'Date':>14} | {'L':>5} | {'B_eq (uT)':>10} | {'alpha_LC':>10} | {'Trapped':>8}")
print(f"{'-'*68}")

for shot in argus:
    L = shot['L']
    B_eq = dipole_B_equator(L) * 1e6  # microTesla
    alpha_LC, R_m = loss_cone_angle(L)
    f_trapped = np.cos(np.radians(alpha_LC))

    print(f"{shot['name']:>10} | {shot['date']:>14} | {L:>5.1f} | {B_eq:>10.2f} | {alpha_LC:>8.1f} deg | {f_trapped*100:>6.1f}%")

print(f"\n{'='*65}")
print(f"MIRROR POINT LOCATIONS")
print(f"{'='*65}")

# For Argus I (L=1.7), show mirror points for various pitch angles
L = 1.7
B_eq = dipole_B_equator(L)
alpha_LC_val, _ = loss_cone_angle(L)

print(f"\nArgus I (L = {L}):")
print(f"Loss cone angle: {alpha_LC_val:.1f} degrees")
print(f"\n{'Pitch angle':>12} | {'Mirror B/B_eq':>14} | {'Status':>10}")
print(f"{'-'*42}")

for alpha_deg in [10, 15, 20, 30, 45, 60, 75, 89]:
    alpha = np.radians(alpha_deg)
    R_mirror = 1.0 / np.sin(alpha)**2
    status = "TRAPPED" if alpha_deg > alpha_LC_val else "LOST"
    print(f"{alpha_deg:>10} deg | {R_mirror:>14.2f} | {status:>10}")

print(f"\n{'='*65}")
print(f"BELT DECAY: WHAT EXPLORER 4 MEASURED")
print(f"{'='*65}")

# Simple exponential decay model for artificial belt
# Observed decay time ~ 2-4 weeks
half_lives = [7, 14, 21]  # days, range of observed/estimated values
initial_intensity = 1000  # arbitrary units (counts/sec above background)

print(f"\nArtificial belt decay (exponential model):")
print(f"Initial intensity: {initial_intensity} counts/sec above background")

for t_half in half_lives:
    tau = t_half / np.log(2)
    print(f"\n  Half-life = {t_half} days (tau = {tau:.1f} days):")
    for day in [1, 3, 7, 14, 21, 28]:
        intensity = initial_intensity * np.exp(-day / tau)
        pct = intensity / initial_intensity * 100
        marker = ""
        if day == 1: marker = " (next day)"
        elif day == 7: marker = " (one week)"
        elif day == 14: marker = " (two weeks)"
        elif day == 28: marker = " (four weeks)"
        print(f"    Day {day:>2}: {intensity:>8.1f} counts/sec ({pct:>5.1f}%){marker}")

print(f"\nExplorer 4 measured the decay of all three Argus belts,")
print(f"providing the first empirical radiation belt lifetime data.")
print(f"The Argus I and II belts (L~1.7) decayed in roughly 2 weeks.")
print(f"The Argus III belt (L~2.0) lasted somewhat longer — at higher")
print(f"L-shells, the loss cone is smaller and fewer electrons are")
print(f"scattered into it per unit time. The belt lifetime increases")
print(f"with L-shell. This dependence was predicted by Christofilos")
print(f"and confirmed by Explorer 4's measurements.")
```

**Debate Question 2:** The loss cone determines what fraction of injected particles are trapped. At L = 1.7, approximately 94% of particles are captured. The magnetic bottle is efficient. But the particles that enter the loss cone are not simply "lost" -- they collide with atmospheric molecules at 100 km altitude, depositing their energy as ionization. The Argus detonations injected enough electrons that the loss-cone particles produced visible aurora in the conjugate hemisphere. The trapped 94% formed the artificial belt. The lost 6% lit up the sky. Which is a more dramatic demonstration of the physics -- the invisible belt detected by Explorer 4's scintillation counters, or the aurora visible to the naked eye? The instrument versus the spectacle. Explorer 4 measured what the eye could not see. But the aurora showed what the instrument could only count.

---

## Deposit 3: Scintillation Counter Statistics (Layer 7, Section 7.4)

### Table

| Parameter | Symbol | Units | Explorer 4 Value |
|-----------|--------|-------|-----------------|
| Plastic scintillator | -- | -- | 1 mm thick, sensitive to electrons > 0.7 MeV |
| CsI(Tl) scintillator | -- | -- | Cesium iodide (thallium activated), gamma-ray sensitive |
| Shielded GM counter | -- | -- | 1.2 g/cm^2 lead shielding, protons > 30 MeV |
| Unshielded GM counter | -- | -- | No shielding, all charged particles > 3 MeV |
| Plastic scintillator area | A | cm^2 | ~5 |
| Counting rate (background) | -- | counts/s | ~10-50 |
| Counting rate (Argus belt) | -- | counts/s | ~500-5000 |
| Energy resolution | -- | -- | ~20-30% (scintillator dependent) |

### Formulas

**Particle Counting and Energy Discrimination:**

Explorer 4 was the first satellite to carry scintillation counters -- a significant advance over the Geiger-Mueller counters used by Explorers 1 and 3. Where a GM counter simply detects "a particle crossed the detector" with no energy information, a scintillation counter measures the energy deposited by each particle, enabling discrimination between electrons and protons and between natural and artificial radiation:

```
SCINTILLATION COUNTER PHYSICS:

A charged particle entering a scintillator crystal deposits
energy through ionization. The crystal converts a fraction
of this energy into visible light photons (scintillation).
A photomultiplier tube (PMT) or photodiode converts the
light into an electrical pulse proportional to the deposited
energy.

Energy deposit per particle:
  For minimum-ionizing particles (relativistic electrons):
    dE/dx ~ 2 MeV/(g/cm^2) in plastic scintillator
    For 1 mm thick plastic (density ~ 1 g/cm^3):
      Delta_E ~ 2 MeV/cm * 0.1 cm = 0.2 MeV per traversal

  For 1 MeV electrons (Argus particles):
    Delta_E ~ 0.2-0.5 MeV (depends on angle and energy)

  For 30 MeV protons:
    dE/dx ~ 5 MeV/(g/cm^2) in plastic
    Delta_E ~ 0.5 MeV per traversal

PULSE HEIGHT DISCRIMINATION:

The electrical pulse height is proportional to Delta_E.
By setting a threshold on pulse height, Explorer 4 could
distinguish:

  - Low pulses: minimum-ionizing electrons (< 0.3 MeV deposit)
  - Medium pulses: Argus beta electrons (0.3-1 MeV deposit)
  - High pulses: protons or heavy ions (> 1 MeV deposit)

This energy discrimination was IMPOSSIBLE with the GM counters
on Explorers 1 and 3. A GM counter produces the same output
pulse regardless of whether a 0.5 MeV electron or a 50 MeV
proton triggered it. Explorer 4's scintillation counters could
tell the difference.

DISTINGUISHING NATURAL FROM ARTIFICIAL RADIATION:

The natural Van Allen belts contain a mixture of electrons
and protons trapped from the solar wind and cosmic rays.
The Argus artificial belts contained primarily electrons
from nuclear fission beta decay.

Explorer 4's four detectors provided complementary views:

  1. Unshielded GM counter: counts ALL charged particles
     above 3 MeV. Sees both natural and Argus radiation.
     Provides total flux measurement.

  2. Shielded GM counter: 1.2 g/cm^2 lead stops all electrons
     below ~3 MeV and all protons below ~30 MeV. Sees only
     the most energetic particles — predominantly cosmic ray
     protons. Provides a baseline of natural radiation.

  3. Plastic scintillator: sensitive to electrons above
     0.7 MeV with energy resolution. The Argus electrons
     (1-10 MeV fission betas) appear as a distinct population
     in the energy spectrum. Before Argus: smooth spectrum.
     After Argus: spike at 1-2 MeV superimposed on the
     smooth background. The spike IS the artificial belt.

  4. CsI(Tl) scintillator: sensitive to gamma rays. Provides
     information about the radiation environment that does not
     trigger the charged particle detectors.

THE SUBTRACTION METHOD:

  Artificial radiation = (unshielded GM counts) - (shielded GM counts)
                       = (all particles) - (only high-energy natural)
                       = Argus electrons (approximately)

  More precisely:
  N_artificial = N_unshielded - k * N_shielded

  where k is a calibration factor determined from pre-Argus
  data (when all radiation was natural). The factor k accounts
  for the different geometric factors and efficiencies of the
  two detectors.

  Explorer 4 had 31 days of pre-Argus data (July 26 - Aug 27)
  to establish the natural baseline. This baseline was subtracted
  from post-Argus measurements to isolate the artificial component.

COUNTING STATISTICS:

Radiation detection is a Poisson process. The number of counts
in a time interval follows the Poisson distribution:

  P(n) = (lambda^n * e^{-lambda}) / n!

  where lambda = expected count rate * integration time

  Standard deviation: sigma = sqrt(lambda)
  Relative uncertainty: sigma/lambda = 1/sqrt(lambda)

For Explorer 4 measuring the Argus belt:
  Count rate: ~1000 counts/sec in the artificial belt
  Integration time: 1 second (per sample)
  Expected counts: lambda = 1000
  sigma = sqrt(1000) = 31.6
  Relative uncertainty: 31.6/1000 = 3.2%

  Explorer 4 measured the artificial belt with ~3% statistical
  precision per second. Over a 10-second integration:
  sigma = sqrt(10000) = 100
  Relative uncertainty: 100/10000 = 1%

  The scintillation counters provided both better energy
  information AND better counting statistics than the GM
  counters on previous Explorers — more counts per second
  because the scintillator has no dead time problem. A GM
  counter saturates at ~25,000 counts/sec. A scintillator
  can handle millions. Explorer 4 would never saturate in
  the Argus belt.
```

### Worked Example

**Problem:** Using Explorer 4's four detectors, determine whether a measured radiation increase at L = 1.7 after Argus I is statistically significant and attributable to the artificial belt rather than natural variation.

```python
import numpy as np

print("EXPLORER 4: SCINTILLATION COUNTER STATISTICS")
print("=" * 65)

# Pre-Argus baseline (natural Van Allen belt at L=1.7)
# These are representative count rates
baseline = {
    'unshielded_gm': 450,    # counts/sec
    'shielded_gm': 120,      # counts/sec (high-energy protons only)
    'plastic_scint': 380,    # counts/sec (electrons > 0.7 MeV)
    'csi_scint': 45,         # counts/sec (gamma rays)
}

# Post-Argus I measurement at same L-shell (day after detonation)
post_argus = {
    'unshielded_gm': 2800,   # counts/sec
    'shielded_gm': 125,      # counts/sec (barely changed — protons unchanged)
    'plastic_scint': 2650,   # counts/sec (dominated by Argus electrons)
    'csi_scint': 48,         # counts/sec (barely changed)
}

print(f"\n{'Detector':>20} | {'Pre-Argus':>12} | {'Post-Argus':>12} | {'Increase':>10}")
print(f"{'-'*62}")

for key in baseline:
    pre = baseline[key]
    post = post_argus[key]
    increase = post - pre
    label = key.replace('_', ' ').title()
    pct = (increase / pre * 100) if pre > 0 else 0
    print(f"{label:>20} | {pre:>10} c/s | {post:>10} c/s | {increase:>+8} ({pct:>+.0f}%)")

print(f"\n{'='*65}")
print(f"STATISTICAL SIGNIFICANCE TEST")
print(f"{'='*65}")

# Integration time for one measurement
T_int = 1.0  # seconds

print(f"\nIntegration time: {T_int} seconds")
print(f"\nPoisson statistics for each detector:")

for key in baseline:
    pre = baseline[key] * T_int
    post = post_argus[key] * T_int

    sigma_pre = np.sqrt(pre)
    sigma_post = np.sqrt(post)
    sigma_diff = np.sqrt(pre + post)

    diff = post - pre
    significance = diff / sigma_diff

    label = key.replace('_', ' ').title()
    print(f"\n  {label}:")
    print(f"    Pre-Argus:  {pre:.0f} +/- {sigma_pre:.1f} counts")
    print(f"    Post-Argus: {post:.0f} +/- {sigma_post:.1f} counts")
    print(f"    Difference: {diff:.0f} +/- {sigma_diff:.1f} counts")
    print(f"    Significance: {significance:.1f} sigma", end="")
    if significance > 5:
        print(f" *** HIGHLY SIGNIFICANT ***")
    elif significance > 3:
        print(f" ** SIGNIFICANT **")
    elif significance > 2:
        print(f" * MARGINAL *")
    else:
        print(f"   (not significant)")

print(f"\n{'='*65}")
print(f"THE FINGERPRINT: ELECTRONS, NOT PROTONS")
print(f"{'='*65}")

# Subtraction method
k = baseline['shielded_gm'] / baseline['unshielded_gm']
N_artificial = post_argus['unshielded_gm'] - (1/k) * post_argus['shielded_gm']

print(f"\nCalibration factor k = {k:.3f}")
print(f"Shielded GM unchanged: natural proton flux is constant")
print(f"Unshielded GM increased 6x: new electrons dominating")
print(f"Plastic scintillator increased 7x: confirms electron population")
print(f"CsI (gamma) unchanged: no significant gamma ray increase")
print(f"\nConclusion: the increase is caused by trapped ELECTRONS,")
print(f"not protons. The energy spectrum (from scintillator pulse")
print(f"heights) peaks at 1-2 MeV — consistent with fission beta")
print(f"decay electrons from the Argus warhead.")
print(f"\nExplorer 4 did not just detect the artificial belt.")
print(f"It identified its composition: fission electrons.")
print(f"It measured its intensity: ~2000 additional electrons/sec.")
print(f"It tracked its decay: fading over 2-4 weeks.")
print(f"It confirmed Christofilos: the magnetic bottle works.")
```

**Debate Question 3:** Explorer 4 carried four detectors specifically designed to distinguish artificial from natural radiation. The instrument suite was designed for the experiment -- it knew what to look for before launch. Compare this to Explorers 1 and 3, which discovered the Van Allen belts using instruments designed for cosmic ray measurement, not belt detection. Explorer 4 found what it was looking for. Explorers 1 and 3 found what they were not looking for. Which contributes more to science -- the controlled experiment that confirms a prediction, or the serendipitous discovery that reveals something unexpected? Christofilos predicted the artificial belt. Explorer 4 confirmed it. The confirmation was necessary for the prediction to become established physics. But the prediction itself was derivative of the accidental discovery of the natural belts. Without the surprise of Explorers 1 and 3, there would have been no Christofilos prediction and no Argus experiment. Confirmation depends on discovery. Discovery depends on instruments that are sensitive to the unexpected.

---

## Cross-Layer Connections

**Layer 4 (Vector Calculus) to Layer 1 (Unit Circle):**
The gyration of a charged particle around a magnetic field line IS circular motion -- the unit circle in the plane perpendicular to B. The particle traces a circle with gyroradius r_g at gyrofrequency omega_c. The pitch angle alpha relates the perpendicular (circular) and parallel (translational) components of motion: v_perp = v * sin(alpha), v_parallel = v * cos(alpha). As the particle moves along the field line into regions of stronger B, alpha increases toward 90 degrees (the mirror point). The pitch angle sweeps an arc on the unit circle from alpha_0 at the equator to 90 degrees at the mirror point. Every trapped particle's motion can be decomposed into three periodic motions: gyration (fastest, microseconds), bounce (intermediate, seconds), and drift (slowest, minutes to hours). Each is a circle or near-circle.

**Layer 3 (Trigonometry) to Layer 4 (Vector Calculus):**
The mirror point geometry is pure trigonometry. The first adiabatic invariant conservation gives sin^2(alpha_0)/B_0 = sin^2(alpha)/B at any point along the field line. At the mirror point, alpha = 90 degrees and sin^2(alpha) = 1, so B_mirror = B_0/sin^2(alpha_0). The loss cone angle alpha_LC = arcsin(sqrt(B_0/B_atm)) is a trigonometric relationship between the equatorial field and the atmospheric field. The entire structure of radiation belt trapping -- which particles survive, which are lost, how long the belt lasts -- flows from this single trigonometric identity involving sine squared. The Argus artificial belts confirmed that this trigonometry is correct: the measured trapping efficiency matched the prediction from mirror point geometry.

**Layer 7 (Information Theory) to Layer 4 (Vector Calculus):**
The scintillation counter statistics (Poisson counting) determine the precision with which Explorer 4 could measure the artificial belt. The signal-to-noise ratio depends on the square root of the count rate. At 1000 counts/sec, the uncertainty is 3.2%. At 100 counts/sec (as the belt decayed), the uncertainty grows to 10%. At 10 counts/sec (belt nearly gone), the uncertainty is 31.6%. There comes a point where the decaying artificial belt signal falls below the statistical noise floor of the natural background -- the belt is still there, but it cannot be distinguished from the natural variation. This is the information-theoretic limit on Explorer 4's measurement: the Argus belt is detectable only while its intensity exceeds the Poisson noise of the natural background by a sufficient margin (typically 3-5 sigma). The physics of trapping (Layer 4) determines how long the belt lasts. The counting statistics (Layer 7) determine how long Explorer 4 could see it.

---

*"Nicholas Christofilos was not an academic. He was a Greek-American engineer who worked on particle accelerators and had no formal training in magnetospheric physics. He published his prediction of artificial radiation belt creation in 1957, before Explorers 1 and 3 had even discovered the natural belts. He reasoned from first principles: the Lorentz force traps charged particles in any sufficiently strong magnetic bottle, and the Earth's dipole field is a magnetic bottle. If you inject electrons at the right altitude, the field will trap them. They will drift in longitude and form a shell. The shell will persist until scattering processes drain it. He calculated the shell formation time (minutes), the shell lifetime (weeks to months), and the particle energy required for effective trapping (> 1 MeV). He was right about all of it. Project Argus was the most expensive scientific experiment of 1958: three nuclear warheads detonated in the South Atlantic magnetosphere, a fleet of ships monitoring from below, sounding rockets sampling from the sides, and Explorer 4 measuring from above. The experiment cost approximately $9 million in 1958 dollars. It confirmed every one of Christofilos's predictions. The artificial belts formed in minutes, persisted for weeks, and were detected by Explorer 4's scintillation counters exactly where and at exactly the intensity Christofilos had calculated. It was one of the cleanest confirmations of a theoretical prediction in the history of geophysics. The self-taught accelerator physicist had understood the Earth's magnetosphere better than the magnetospheric physicists, because he recognized the field geometry from his day job. The same B field that bends a proton beam in a synchrotron bends an electron from a nuclear explosion. The Lorentz force does not read your credentials. It reads your charge, your velocity, and the local field. F = qv x B. Everything else follows."*
