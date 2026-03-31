# Mission 1.14 -- Echo 1: The Mathematics of Reflection

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Echo 1 (August 12, 1960)
**Primary TSPB Layer:** 3 (Trigonometry -- Radar Equation, Reflection Geometry, Bistatic Scattering)
**Secondary Layers:** 2 (Pythagorean Theorem -- Inverse-Square Law Applied Twice), 5 (Set Theory -- Signal Classification), 1 (Unit Circle -- Phase of Reflected Wave, Balloon Geometry)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Radar Equation for Passive Relay (Layer 3, Section 3.14)

### Table

| Parameter | Symbol | Units | Echo 1 Value |
|-----------|--------|-------|--------------|
| Launch date | -- | -- | August 12, 1960, 09:39 UTC |
| Launch vehicle | -- | -- | Thor-Delta (three-stage) |
| Operating agency | -- | -- | NASA / Langley Research Center + Bell Telephone Laboratories + JPL |
| Spacecraft mass | m_sc | kg | 76.2 (after inflation) |
| Spacecraft shape | -- | -- | Sphere (30.48 m diameter, aluminized Mylar balloon) |
| Balloon skin | -- | -- | Mylar (polyethylene terephthalate), 12.7 microns thick, vacuum-deposited aluminum coating |
| Orbital perigee | r_p | km | 1,519 |
| Orbital apogee | r_a | km | 1,687 |
| Orbital period | T | min | ~118.3 |
| Orbital inclination | i | deg | 47.2 |
| Apparent magnitude | m_v | -- | ~-1 to +2 (visible to naked eye, brighter than Sirius at perigee) |
| Transmitter (ground) | -- | -- | Bell Labs Holmdel, NJ: 2,390 MHz, 10 kW |
| Receiver (ground) | -- | -- | JPL Goldstone, CA: 2,390 MHz, 26-m dish |
| First transcontinental call | -- | -- | August 13, 1960 (Holmdel, NJ to Goldstone, CA) |
| Radar cross-section | sigma | m^2 | ~731 (geometric cross-section of 30.48-m sphere) |
| Operational lifetime | -- | -- | ~8 years (orbit decayed May 24, 1968) |

### Formulas

**The Bistatic Radar Equation -- Why Passive Relay is Beautiful and Impractical:**

Echo 1 was the simplest satellite ever built: a sphere. No electronics, no transmitter, no receiver, no attitude control, no solar panels, no computer. A balloon 100 feet across, made of 12.7-micron Mylar coated with vapor-deposited aluminum. It reflected radio signals the way a mirror reflects light -- passively, impartially, in all directions. Bell Telephone Laboratories transmitted a signal from Holmdel, New Jersey. The signal traveled upward to the balloon, bounced off the curved aluminum surface, and scattered in all directions. A tiny fraction of the scattered energy happened to fall on the 26-meter dish at Goldstone, California, 3,944 km away. That fraction was enough to carry a voice call.

The mathematics of this relay is the bistatic radar equation -- the radar equation generalized to the case where the transmitter and receiver are at different locations, both looking at the same target.

```
THE BISTATIC RADAR EQUATION:

  The standard monostatic radar equation (transmitter and receiver
  co-located) is:

    P_rx = (P_t * G_t * sigma * G_r * lambda^2) / ((4*pi)^3 * R^4)

  where R is the range to the target. The 1/R^4 factor reflects
  the inverse-square law applied TWICE: once on the outbound path
  (transmitter to target) and once on the return path (target back
  to receiver).

  For a BISTATIC system (transmitter and receiver at different
  locations), the equation becomes:

    P_rx = (P_t * G_t * sigma_b * G_r * lambda^2) /
           ((4*pi)^3 * R_t^2 * R_r^2)

  where:
    P_t = transmitter power (W)
    G_t = transmit antenna gain (dimensionless or dBi)
    sigma_b = bistatic radar cross-section of the target (m^2)
    G_r = receive antenna gain (dimensionless or dBi)
    lambda = wavelength (m)
    R_t = distance from transmitter to target (m)
    R_r = distance from target to receiver (m)

  The 1/R^4 has split into 1/(R_t^2 * R_r^2). The signal
  is attenuated by the inverse-square law on each leg
  independently.

ECHO 1 PARAMETERS:

  Transmitter: Bell Labs Holmdel, NJ
    P_t = 10,000 W (10 kW) at 2,390 MHz
    G_t = 46 dBi (26-meter horn-reflector antenna, the
          famous "sugar scoop" antenna that would later
          discover the cosmic microwave background)
    lambda = c / f = 3e8 / 2.39e9 = 0.1255 m

  Target: Echo 1 balloon
    Diameter: D = 30.48 m (100 feet)
    The balloon is a conducting sphere much larger than the
    wavelength (D/lambda = 30.48/0.1255 = 243). In this
    regime (the optical limit), the radar cross-section of
    a sphere equals its geometric cross-section:

    sigma = pi * (D/2)^2 = pi * 15.24^2 = 729.7 m^2

    This is the monostatic (backscatter) RCS. For bistatic
    scattering from a large conducting sphere, the RCS is
    also approximately equal to the geometric cross-section
    for forward and near-forward scattering angles. Echo 1's
    spherical shape was chosen deliberately: no matter what
    angle the signal arrives from or what angle the receiver
    views from, the cross-section is the same. A sphere has
    no preferred direction. It scatters uniformly. This is
    the passive relay's great virtue -- and its fatal flaw.

  Receiver: JPL Goldstone, CA
    D_dish = 26 m (85-foot dish)
    eta = 0.55 (aperture efficiency)
    G_r = eta * (pi * D_dish / lambda)^2
        = 0.55 * (pi * 26 / 0.1255)^2
        = 0.55 * (651.0)^2
        = 0.55 * 423,801
        = 233,091
        = 53.7 dBi

  Geometry (typical pass):
    Balloon altitude: ~1,600 km (midpoint of orbit)
    Slant range from Holmdel to balloon: ~2,000 km (R_t)
    Slant range from balloon to Goldstone: ~2,500 km (R_r)

COMPUTING THE RECEIVED POWER:

  P_rx = (P_t * G_t_lin * sigma * G_r_lin * lambda^2) /
         ((4*pi)^3 * R_t^2 * R_r^2)

  Converting to linear units:
    P_t = 10,000 W
    G_t_lin = 10^(46/10) = 39,811
    sigma = 729.7 m^2
    G_r_lin = 233,091
    lambda^2 = 0.01576 m^2
    (4*pi)^3 = 1,984
    R_t = 2.0e6 m
    R_r = 2.5e6 m

  Numerator:
    10,000 * 39,811 * 729.7 * 233,091 * 0.01576
    = 10^4 * 3.98e4 * 7.30e2 * 2.33e5 * 1.58e-2
    = 1.065 × 10^15

  Denominator:
    1,984 * (2.0e6)^2 * (2.5e6)^2
    = 1,984 * 4.0e12 * 6.25e12
    = 1,984 * 2.5e25
    = 4.96 × 10^28

  P_rx = 1.065e15 / 4.96e28 = 2.15 × 10^-14 W
       = -136.7 dBW

  This is 10^-14 watts -- ten thousand times stronger than
  Pioneer 5's received signal at maximum range (-181 dBW).
  The difference comes from three factors:
    1. Echo 1 is 20-100x closer than Pioneer 5 at max range
    2. The transmitter is 10 kW instead of 5 W (33 dB more)
    3. The transmit antenna has 46 dBi gain instead of 2 dBi

  But the passive relay pays a brutal penalty: the reflected
  signal scatters in ALL directions, not just toward the
  receiver. Only the fraction falling within the receiver's
  solid angle contributes to the link. The rest is wasted.

THE FUNDAMENTAL PROBLEM WITH PASSIVE RELAY:

  Compare Echo 1 (passive) to Telstar 1 (active, launched 1962):

  Echo 1:
    Transmitter: 10 kW on the ground
    Relay: passive reflection (sigma = 730 m^2)
    Received power: ~10^-14 W at typical geometry
    Bandwidth: narrow (voice-grade, ~4 kHz)

  Telstar 1:
    Transmitter: ~2 W on the spacecraft
    Relay: active transponder (receive, amplify, retransmit)
    Received power: ~10^-12 W
    Bandwidth: wide (television, ~5 MHz)

  Telstar, with a 2-watt transmitter in orbit, delivered
  100x more received power than Echo 1 with a 10,000-watt
  transmitter on the ground. The difference is that Telstar's
  transmitter directed its energy toward the receiver, while
  Echo 1's balloon scattered it uniformly across the sky.

  The passive relay wastes energy as 4*pi steradians of
  scattering. The active transponder concentrates it into
  a directed beam. The ratio is the transmit antenna gain
  of the active satellite, typically 10-30 dB.

  This is why Echo 1 was a proof of concept, not a
  production system. It proved that satellite communication
  was physically possible -- that signals could be bounced
  off orbiting objects and detected on the ground. But the
  mathematics showed that active satellites would be orders
  of magnitude more efficient. The radar equation made this
  inevitable: 1/(R_t^2 * R_r^2) is unforgiving, and a passive
  scatterer cannot overcome the geometric spreading. Only an
  active transmitter in orbit can close the link budget for
  wideband communications.
```

### Worked Example

**Problem:** Compute the received signal power for Echo 1 at several geometries, and compare to an active relay satellite with a 2-watt transponder.

```python
import numpy as np

print("ECHO 1: BISTATIC RADAR EQUATION FOR PASSIVE RELAY")
print("=" * 65)

# Constants
c = 3.0e8           # speed of light (m/s)
k = 1.381e-23       # Boltzmann constant (J/K)
pi = np.pi

# Echo 1 parameters
D_balloon = 30.48    # balloon diameter (m) = 100 feet
sigma = pi * (D_balloon / 2)**2   # geometric cross-section (m^2)
f_Hz = 2.39e9        # frequency (Hz)
lam = c / f_Hz       # wavelength (m)

# Transmitter: Bell Labs Holmdel
P_t_W = 10000.0      # 10 kW
D_tx = 26.0           # horn-reflector antenna effective diameter
eta_tx = 0.55
G_t_lin = eta_tx * (pi * D_tx / lam)**2
G_t_dBi = 10 * np.log10(G_t_lin)

# Receiver: JPL Goldstone
D_rx = 26.0           # 26-m dish
eta_rx = 0.55
G_r_lin = eta_rx * (pi * D_rx / lam)**2
G_r_dBi = 10 * np.log10(G_r_lin)

print(f"\nEcho 1 Passive Relay Parameters:")
print(f"  Balloon diameter: {D_balloon:.2f} m ({D_balloon*3.281:.0f} ft)")
print(f"  Geometric cross-section (sigma): {sigma:.1f} m^2")
print(f"  Frequency: {f_Hz/1e9:.3f} GHz, wavelength: {lam*100:.2f} cm")
print(f"  D/lambda = {D_balloon/lam:.0f} (optical regime)")
print(f"  Transmitter: {P_t_W/1000:.0f} kW, antenna gain: {G_t_dBi:.1f} dBi")
print(f"  Receiver: {D_rx}-m dish, gain: {G_r_dBi:.1f} dBi")

print(f"\n{'='*65}")
print(f"RECEIVED POWER vs GEOMETRY")
print(f"{'='*65}")
header = f"{'R_t (km)':>10} | {'R_r (km)':>10} | {'P_rx (dBW)':>11} | {'P_rx (W)':>12}"
print(f"\n{header}")
print(f"{'-'*50}")

# Various geometries
geometries = [
    (1600, 1600, "Overhead both stations"),
    (2000, 2500, "Typical Holmdel-Goldstone pass"),
    (2500, 3000, "Low elevation pass"),
    (1600, 1600, "Best case (balloon at midpoint)"),
    (3000, 3500, "Near-horizon pass"),
]

for R_t_km, R_r_km, desc in geometries:
    R_t = R_t_km * 1000.0
    R_r = R_r_km * 1000.0

    P_rx = (P_t_W * G_t_lin * sigma * G_r_lin * lam**2) / \
           ((4*pi)**3 * R_t**2 * R_r**2)
    P_rx_dBW = 10 * np.log10(P_rx)

    print(f"{R_t_km:>10,} | {R_r_km:>10,} | {P_rx_dBW:>11.1f} | {P_rx:>12.2e}  {desc}")

print(f"\n{'='*65}")
print(f"PASSIVE vs ACTIVE: THE EFFICIENCY GAP")
print(f"{'='*65}")

# Compare Echo 1 (passive) to Telstar 1 (active)
R_t_typ = 2000e3   # 2,000 km
R_r_typ = 2500e3   # 2,500 km

# Echo 1 passive
P_echo = (P_t_W * G_t_lin * sigma * G_r_lin * lam**2) / \
         ((4*pi)**3 * R_t_typ**2 * R_r_typ**2)

# Telstar active (simplified): spacecraft receives, amplifies, retransmits
P_telstar_tx = 2.0      # 2 W spacecraft transmitter
G_telstar_tx = 10**(17/10)  # ~17 dBi spacecraft antenna
# Path loss on downlink only (uplink handled by onboard receiver)
FSPL_down = ((4*pi*R_r_typ)/lam)**2
P_telstar = (P_telstar_tx * G_telstar_tx * G_r_lin) / FSPL_down

print(f"\n  Echo 1 (passive, 10 kW ground TX):  {10*np.log10(P_echo):.1f} dBW = {P_echo:.2e} W")
print(f"  Telstar (active, 2 W space TX):     {10*np.log10(P_telstar):.1f} dBW = {P_telstar:.2e} W")
print(f"  Advantage of active relay: {10*np.log10(P_telstar/P_echo):.1f} dB")
print(f"  The active satellite delivers {P_telstar/P_echo:.0f}x more power")
print(f"  with {P_t_W/P_telstar_tx:.0f}x LESS transmitter power.")
print(f"\n  This is why Echo 1 proved the concept and")
print(f"  Telstar replaced it. The radar equation is merciless:")
print(f"  scattering into 4*pi steradians wastes almost everything.")
```

**Debate Question 1:** Echo 1 proved that satellite communication was possible using passive reflection. Within two years, Telstar 1 proved that active transponders were vastly more efficient. The mathematics was known before Echo 1 launched -- the radar equation clearly showed that passive relay would be limited to narrowband, low-data-rate applications. So why build Echo 1 at all? The answer is threefold. First, Echo 1 had no electronics to fail -- it was a balloon, and it worked for eight years until atmospheric drag brought it down. Active satellites in 1960-62 had mean lifetimes measured in months (Telstar 1 failed after seven months due to radiation damage to its transistors). Second, Echo 1 was visible. It was the brightest artificial object in the night sky, and millions of people saw it. It made satellite communication tangible to the public in a way that an invisible active satellite never could. Third, Echo 1 established the legal and regulatory framework for satellite communications -- the first international agreements on frequency allocation and orbital slots were negotiated using Echo 1 as the existence proof that satellites could relay signals across national boundaries. The mathematics said passive was inefficient. The engineering said active was fragile. The politics said visible was powerful. Echo 1 optimized for the last two.

---

## Deposit 2: Balloon Geometry and Solid Angle (Layer 1, Section 1.14)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Balloon diameter | D | m | 30.48 (100 ft) |
| Balloon radius | r_b | m | 15.24 |
| Surface area | A_s | m^2 | 2,919.6 |
| Geometric cross-section | A_c | m^2 | 729.9 |
| Mylar thickness | t | microns | 12.7 (0.5 mil) |
| Mylar density | rho | kg/m^3 | 1,390 |
| Skin mass | m_skin | kg | ~51.4 |
| Internal gas mass | m_gas | kg | ~24.8 (sublimating benzoic acid + residual air) |
| Altitude | h | km | ~1,600 (average) |
| Solid angle of receiver from balloon | Omega_r | sr | ~1.0 × 10^-13 |

### Formulas

**Sphere Geometry and the Fraction of Energy Reaching the Receiver:**

Echo 1 was a sphere 30.48 meters in diameter -- 100 feet, the height of a ten-story building. It was the largest object ever placed in orbit at the time, and remained so until space stations decades later. Its purpose was to present a large, smooth, conducting surface to incoming radio signals and scatter them in all directions so that ground stations at various locations could receive the reflected energy.

The geometry of this scattering determines how much energy reaches any particular receiver.

```
SPHERE SURFACE GEOMETRY:

  Surface area of the balloon:
    A_s = 4 * pi * r_b^2
        = 4 * pi * (15.24)^2
        = 4 * pi * 232.3
        = 2,919.6 m^2

  This is approximately 0.7 acres -- the area of a small
  parking lot, or about half a football field. All of this
  surface is reflective aluminum.

  Geometric cross-section (silhouette):
    A_c = pi * r_b^2
        = pi * (15.24)^2
        = 729.9 m^2

  This is the area of the shadow the balloon casts in sunlight.
  It is also the radar cross-section for a sphere much larger
  than the wavelength (D >> lambda). The balloon intercepts
  electromagnetic energy proportional to its cross-section,
  not its surface area.

FRACTION OF REFLECTED ENERGY REACHING THE RECEIVER:

  When the balloon reflects an incoming signal, it scatters
  the energy approximately uniformly in the backward hemisphere
  (for a conducting sphere in the optical limit, the scattered
  energy is distributed over 4*pi steradians, but the forward-
  scattered and backward-scattered lobes dominate). For a
  first-order estimate, assume isotropic scattering into
  4*pi steradians.

  The receiver antenna subtends a solid angle:

    Omega_receiver = A_eff / R_r^2

  where A_eff is the effective area of the receiving antenna
  and R_r is the distance from the balloon to the receiver.

  For the Goldstone 26-m dish:
    A_eff = eta * pi * (D_dish/2)^2
          = 0.55 * pi * 13^2
          = 292.2 m^2

  At R_r = 2,500 km = 2.5 × 10^6 m:
    Omega_receiver = 292.2 / (2.5e6)^2
                   = 292.2 / 6.25e12
                   = 4.68 × 10^-11 sr

  The fraction of scattered energy captured:
    f = Omega_receiver / (4 * pi)
      = 4.68e-11 / 12.566
      = 3.72 × 10^-12

  Less than four parts per TRILLION of the reflected energy
  reaches the Goldstone dish. The rest goes elsewhere -- into
  space, into the ground, toward other continents, into the
  future (it travels outward forever at the speed of light).

  This is the passive relay penalty. An active satellite
  with even a modest directional antenna (say 17 dBi, a 30-
  degree beam) concentrates its transmitted energy into
  approximately 0.3 steradians instead of 12.6 steradians --
  a factor of 40. With a higher-gain antenna, the advantage
  grows accordingly. Echo 1's spherical symmetry was its
  virtue (any ground station could receive its reflection)
  and its curse (no ground station received much energy).

MASS BUDGET OF THE BALLOON:

  The Mylar skin was 12.7 microns thick (0.5 mil = 0.0005 in).
  Mylar (polyethylene terephthalate) has a density of
  approximately 1,390 kg/m^3.

  Skin volume:
    V_skin = A_s * t
           = 2,919.6 * 12.7e-6
           = 0.03708 m^3

  Skin mass:
    m_skin = rho * V_skin
           = 1,390 * 0.03708
           = 51.5 kg

  The aluminum coating adds negligible mass (a few hundred
  nanometers thick, density 2,700 kg/m^3, total ~2-3 grams
  over the entire surface).

  The remaining ~25 kg was the inflation system: sublimating
  benzoic acid and anthraquinone packed in the folded balloon.
  When exposed to solar heating in vacuum, these chemicals
  sublimated (solid → gas), inflating the balloon. No
  mechanical pump, no pressurized tank. Chemistry did the
  work of engineering.

  The entire satellite weighed 76.2 kg -- about the weight
  of an adult human. A 100-foot sphere that weighed as much
  as a person. The area-to-mass ratio was 38.3 m^2/kg --
  extraordinarily high, which made the balloon extremely
  sensitive to solar radiation pressure and atmospheric
  drag at its relatively low altitude.
```

```python
import numpy as np

print("ECHO 1: BALLOON GEOMETRY AND SOLID ANGLE")
print("=" * 60)

pi = np.pi
r_balloon = 15.24    # radius (m)
D_balloon = 30.48     # diameter (m)

# Surface geometry
A_surface = 4 * pi * r_balloon**2
A_cross = pi * r_balloon**2
V_balloon = (4/3) * pi * r_balloon**3

print(f"\nBalloon Geometry:")
print(f"  Diameter: {D_balloon:.2f} m ({D_balloon*3.281:.0f} ft)")
print(f"  Surface area: {A_surface:.1f} m^2 ({A_surface*10.764:.0f} ft^2)")
print(f"  Cross-section: {A_cross:.1f} m^2")
print(f"  Volume: {V_balloon:.0f} m^3 ({V_balloon*35.315:.0f} ft^3)")

# Mass budget
t_mylar = 12.7e-6      # thickness (m)
rho_mylar = 1390.0      # density (kg/m^3)
V_skin = A_surface * t_mylar
m_skin = rho_mylar * V_skin
m_total = 76.2

print(f"\nMass Budget:")
print(f"  Mylar thickness: {t_mylar*1e6:.1f} microns")
print(f"  Skin volume: {V_skin:.5f} m^3")
print(f"  Skin mass: {m_skin:.1f} kg")
print(f"  Inflation system: ~{m_total - m_skin:.1f} kg")
print(f"  Total: {m_total} kg")
print(f"  Area-to-mass ratio: {A_cross/m_total:.1f} m^2/kg")

# Solid angle calculation
print(f"\n{'='*60}")
print(f"SOLID ANGLE AND ENERGY FRACTION")
print(f"{'='*60}")

D_dish = 26.0    # receiver dish diameter (m)
eta_dish = 0.55
A_eff = eta_dish * pi * (D_dish/2)**2

distances_km = [1600, 2000, 2500, 3000, 3500]
print(f"\n  Receiver: {D_dish}-m dish, A_eff = {A_eff:.1f} m^2")
print(f"\n{'R_r (km)':>10} | {'Omega (sr)':>12} | {'Fraction':>14} | {'1 in N':>12}")
print(f"{'-'*55}")

for R_r_km in distances_km:
    R_r = R_r_km * 1000.0
    Omega = A_eff / R_r**2
    frac = Omega / (4 * pi)
    N = 1.0 / frac
    print(f"{R_r_km:>10,} | {Omega:>12.2e} | {frac:>14.2e} | 1 in {N:>.1e}")

print(f"\n  At typical geometry (2,500 km), less than 4 parts per")
print(f"  trillion of the reflected energy reaches the receiver.")
print(f"  The rest radiates into the universe. This is the cost")
print(f"  of omnidirectional scattering.")
```

---

## Deposit 3: Solar Radiation Pressure on Echo 1 (Layer 2, Section 2.14)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Solar constant at 1 AU | S | W/m^2 | 1,361 |
| Speed of light | c | m/s | 2.998 × 10^8 |
| Radiation pressure (perfect reflection) | P_rad | Pa | 9.08 × 10^-6 |
| Balloon cross-section | A_c | m^2 | 729.9 |
| Force on balloon | F_rad | N | 6.63 × 10^-3 |
| Balloon mass | m | kg | 76.2 |
| Acceleration from radiation pressure | a_rad | m/s^2 | 8.7 × 10^-5 |
| Gravitational acceleration at 1,600 km altitude | g | m/s^2 | ~7.35 |

### Formulas

**Solar Radiation Pressure -- Why the Balloon Wrinkled and the Orbit Shifted:**

Echo 1 was the most radiation-sensitive spacecraft ever flown. Its enormous cross-section (730 m^2) and tiny mass (76 kg) gave it an area-to-mass ratio of 9.6 m^2/kg -- orders of magnitude higher than any conventional satellite. Solar radiation pressure, which is negligible for compact, heavy spacecraft, was a significant perturbation on Echo 1's orbit.

Light carries momentum. When a photon reflects off a surface, it transfers twice its momentum to the surface (once when it arrives, once when it departs in the opposite direction). The radiation pressure on a perfectly reflecting surface is:

```
RADIATION PRESSURE FROM SUNLIGHT:

  Solar flux at 1 AU:
    S = 1,361 W/m^2

  Each photon carries energy E = hf and momentum p = E/c = hf/c.
  A flux of S watts/m^2 carries momentum flux S/c per square meter.

  For ABSORPTION: the surface absorbs the photon's momentum.
    P_absorb = S / c
             = 1,361 / 2.998e8
             = 4.54 × 10^-6 Pa (pascals)

  For PERFECT REFLECTION: the photon's momentum is reversed.
    The momentum change is twice the incident momentum:
    P_reflect = 2 * S / c
              = 2 * 1,361 / 2.998e8
              = 9.08 × 10^-6 Pa

  Echo 1's aluminum-coated Mylar was highly reflective in
  the optical and infrared (reflectivity > 0.9), so the
  radiation pressure was close to the perfect reflection
  limit.

FORCE ON ECHO 1:

  The force equals the radiation pressure times the projected
  area (the cross-section facing the Sun):

    F_rad = P_reflect * A_cross
          = 9.08e-6 * 729.9
          = 6.63 × 10^-3 N

  Six millinewtons. The weight of a small insect. But
  applied continuously, 24 hours a day (except during
  eclipse), for eight years.

ACCELERATION:

  a_rad = F_rad / m
        = 6.63e-3 / 76.2
        = 8.70 × 10^-5 m/s^2

  Compare to gravitational acceleration at 1,600 km altitude:
    g = G * M_earth / (R_earth + h)^2
      = 6.674e-11 * 5.972e24 / (6371 + 1600)^2e6
      = 3.986e14 / (7971e3)^2
      = 3.986e14 / 6.354e13
      = 6.27 m/s^2

  Wait -- let me redo that properly:
    g = GM / r^2
      = 3.986e14 / (7.971e6)^2
      = 3.986e14 / 6.354e13
      = 6.27 m/s^2

  The ratio:
    a_rad / g = 8.70e-5 / 6.27 = 1.39 × 10^-5

  The radiation pressure acceleration is about 14 parts per
  million of gravity. Tiny. But perturbation theory teaches
  us that small forces, acting continuously over many orbits,
  produce cumulative effects. Over thousands of orbits, the
  radiation pressure measurably altered Echo 1's orbit:

  ORBITAL PERTURBATION EFFECTS:

  1. The orbit eccentricity oscillated with a period equal
     to the solar angle's precession rate. When the Sun was
     in the orbital plane, radiation pressure pushed the
     balloon away from the Sun on one side of the orbit
     (increasing the altitude) and toward the Sun on the
     other side (decreasing it). This changed the eccentricity.

  2. The mean altitude gradually decreased because the
     radiation pressure partially canceled the orbital
     velocity during portions of each orbit, reducing the
     total orbital energy. Combined with the much larger
     effect of atmospheric drag (even at 1,500+ km, there
     is a trace atmosphere), this eventually brought the
     balloon down.

  3. The balloon's skin wrinkled. Solar heating on one side
     and cooling on the other created temperature gradients
     that distorted the thin Mylar skin. Once a wrinkle
     formed, the inflation pressure (near-zero in space)
     could not smooth it out. The radar cross-section
     decreased as the balloon lost its smooth spherical
     shape, making the reflected signals more variable.
     Observers noted that Echo 1's reflected signal strength
     fluctuated significantly after the first few months --
     the balloon was slowly crumpling.

  The solar radiation pressure on Echo 1 was the first
  spacecraft measurement that confirmed the momentum of
  light at the engineering scale. The perturbation was
  predicted by Maxwell's equations (1865) and confirmed
  by Lebedev (1901) and Nichols & Hull (1903) in the
  laboratory. Echo 1 demonstrated it in orbit at a scale
  where it affected the spacecraft's trajectory.
```

### Worked Example

**Problem:** Compute the solar radiation pressure force on Echo 1, the resulting acceleration, and the velocity change over one orbit. Compare to a conventional satellite.

```python
import numpy as np

print("ECHO 1: SOLAR RADIATION PRESSURE")
print("=" * 60)

# Constants
c = 2.998e8          # speed of light (m/s)
S = 1361.0           # solar constant at 1 AU (W/m^2)
G = 6.674e-11        # gravitational constant
M_earth = 5.972e24   # Earth mass (kg)
R_earth = 6.371e6    # Earth radius (m)

# Echo 1 parameters
D_balloon = 30.48    # diameter (m)
r_balloon = D_balloon / 2
A_cross = np.pi * r_balloon**2
m_balloon = 76.2     # mass (kg)
h_orbit = 1600e3     # average altitude (m)
r_orbit = R_earth + h_orbit

# Radiation pressure
P_absorb = S / c
P_reflect = 2 * S / c
reflectivity = 0.92
P_actual = (1 + reflectivity) * S / c

F_rad = P_actual * A_cross
a_rad = F_rad / m_balloon

# Gravitational acceleration
g_orbit = G * M_earth / r_orbit**2

# Orbital period
T_orbit = 2 * np.pi * np.sqrt(r_orbit**3 / (G * M_earth))

print(f"\nSolar Radiation Pressure:")
print(f"  Solar flux: {S} W/m^2")
print(f"  Pressure (absorption): {P_absorb:.3e} Pa")
print(f"  Pressure (perfect reflection): {P_reflect:.3e} Pa")
print(f"  Pressure (actual, R={reflectivity}): {P_actual:.3e} Pa")

print(f"\nForce on Echo 1:")
print(f"  Cross-section: {A_cross:.1f} m^2")
print(f"  Force: {F_rad:.3e} N ({F_rad*1000:.2f} mN)")
print(f"  Acceleration: {a_rad:.3e} m/s^2")

print(f"\nComparison to gravity:")
print(f"  g at {h_orbit/1000:.0f} km: {g_orbit:.2f} m/s^2")
print(f"  a_rad / g = {a_rad/g_orbit:.2e}")
print(f"  Radiation pressure is {a_rad/g_orbit*1e6:.1f} parts per million of gravity")

# Velocity change per orbit
# Approximate: force acts along the Sun-satellite direction
# Over one orbit, the net effect depends on the orbit-Sun geometry
# Maximum delta-v per orbit: F/m * T (if force is always aligned)
delta_v_max = a_rad * T_orbit
print(f"\nOrbital period: {T_orbit/60:.1f} minutes")
print(f"  Maximum delta-v per orbit: {delta_v_max:.3f} m/s")
print(f"  Over 1000 orbits: {delta_v_max*1000:.1f} m/s")
print(f"  (actual effect is less due to varying Sun angle)")

print(f"\n{'='*60}")
print(f"COMPARISON: Echo 1 vs Conventional Satellite")
print(f"{'='*60}")

# Compare to a 1,000 kg satellite with A = 5 m^2
m_conv = 1000.0
A_conv = 5.0
F_conv = P_actual * A_conv
a_conv = F_conv / m_conv

print(f"\n  {'':>25} {'Echo 1':>12} {'Conventional':>12}")
print(f"  {'Mass (kg)':>25} {m_balloon:>12.1f} {m_conv:>12.1f}")
print(f"  {'Cross-section (m^2)':>25} {A_cross:>12.1f} {A_conv:>12.1f}")
print(f"  {'A/m ratio (m^2/kg)':>25} {A_cross/m_balloon:>12.1f} {A_conv/m_conv:>12.3f}")
print(f"  {'Force (N)':>25} {F_rad:>12.2e} {F_conv:>12.2e}")
print(f"  {'Acceleration (m/s^2)':>25} {a_rad:>12.2e} {a_conv:>12.2e}")
print(f"  {'a_rad/g ratio':>25} {a_rad/g_orbit:>12.2e} {a_conv/g_orbit:>12.2e}")
print(f"\n  Echo 1 is {(a_rad/a_conv):.0f}x more sensitive to radiation")
print(f"  pressure than a conventional satellite.")
print(f"  This is why it wrinkled, drifted, and eventually deorbited.")
```

**Debate Question 2:** Solar radiation pressure on Echo 1 was both a nuisance (it perturbed the orbit and wrinkled the balloon) and a landmark measurement (it confirmed the momentum of light at engineering scale). The same force that damaged the satellite also validated Maxwell's theory. Today, solar sails deliberately exploit this pressure for propulsion -- the Japanese IKAROS spacecraft (2010) used a 196 m^2 solar sail to demonstrate radiation-pressure propulsion in interplanetary space. IKAROS had an area-to-mass ratio of 0.61 m^2/kg. Echo 1 had 9.6 m^2/kg -- it would have been a more effective solar sail than IKAROS if it had been designed for it. The difference is intent: IKAROS was designed to harness radiation pressure; Echo 1 was designed despite it. The Physalia physalis -- the Portuguese man o' war -- faces an analogous problem. Its pneumatophore (gas-filled float) catches the wind like a sail, propelling the colony across the ocean surface. The wind is both the man o' war's propulsion and its hazard: it drives the colony into coastlines where it becomes stranded. The man o' war cannot control where the wind takes it any more than Echo 1 could control where the Sun's radiation pushed it. Both are sail-like structures at the mercy of a medium-borne force -- one electromagnetic, one aerodynamic -- and both demonstrated that sometimes the best engineering solution is to accept the perturbation rather than fight it.

---

*"Echo 1 was the Moon of the Space Age -- a bright, round, silent presence in the night sky that anyone could see. It rose in the west and crossed the sky in minutes, a steady point of light brighter than any star, silent as a balloon should be. Millions of people stood in their backyards and watched it, not knowing they were seeing a sphere of aluminum-coated Mylar thinner than a garbage bag, inflated by sublimating chemicals in the vacuum of space, 1,600 kilometers overhead and moving at 7.5 kilometers per second. They saw it because it was big -- 100 feet across, the largest object in orbit -- and because aluminum reflects sunlight with an efficiency that would shame most mirrors. The radio signals bouncing off it were invisible and inaudible to the watchers below. But the light was real, the trajectory was predictable, and the experience of standing on the ground and watching a human-made object sail silently across the stars was something that had never happened before in the history of the species. Physalia physalis, the Portuguese man o' war, sails the surface of the Pacific on a gas-filled bladder of tissue thinner than Echo 1's Mylar -- approximately 10 microns of living membrane stretched over a colony of specialized polyps, propelled by wind and current. It catches the light at the surface the way Echo 1 caught the light in orbit: iridescent, translucent, beautiful, and dangerous to touch. The man o' war's tentacles trail 30 meters below the float, armed with nematocysts that deliver a sting powerful enough to kill fish and agonize humans. Echo 1's legacy trails behind it too -- every communications satellite in geostationary orbit, every direct-broadcast television signal, every satellite phone call, every GPS fix, all descend from the proof that a signal could be reflected from orbit and received on the ground. The balloon proved the concept. The concept built the industry. The industry connected the world. And it started with something so simple that its entire schematic could be written in four words: inflate sphere, reflect signal."*
