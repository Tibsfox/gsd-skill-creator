# Mission 1.13 -- Pioneer 5: The Mathematics of Distance

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Pioneer 5 (March 11, 1960)
**Primary TSPB Layer:** 2 (Pythagorean Theorem -- Inverse-Square Law for Signal Propagation, Deep Space Link Budget)
**Secondary Layers:** 4 (Vector Calculus -- Heliocentric Orbit Mechanics, Interplanetary Trajectories), 7 (Information Theory -- Shannon Capacity at Extreme Range, Signal-to-Noise), 1 (Unit Circle -- Planetary Positions, Orbital Angles)
**Format:** McNeese-Hoag Reference Standard (1959)

---

## Deposit 1: Deep Space Link Budget (Layer 2, Section 2.10)

### Table

| Parameter | Symbol | Units | Pioneer 5 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | March 11, 1960, 13:00 UTC |
| Launch vehicle | -- | -- | Thor-Able IV (three-stage) |
| Operating agency | -- | -- | NASA / Space Technology Laboratories (STL, now TRW/Northrop Grumman) |
| Spacecraft mass | m_sc | kg | 43.0 |
| Spacecraft shape | -- | -- | Sphere (66 cm diameter, solar-cell covered) |
| Primary instruments | -- | -- | Search coil magnetometer, proportional counter (cosmic rays), ion chamber, Geiger-Mueller tube, micrometeorite detector |
| Transmitter power (high) | P_t | W | 5.0 |
| Transmitter power (low) | P_t_low | W | 0.5 |
| Transmitter frequency | f | MHz | 378.2 |
| Antenna | -- | -- | Turnstile dipole (omnidirectional, ~2 dBi gain) |
| Ground station | -- | -- | Jodrell Bank (76.2 m dish, 250-ft steerable) and Cape Canaveral |
| Maximum communication distance | d_max | km | 36.2 × 10^6 (0.242 AU) |
| Last contact | -- | -- | June 26, 1960 (107 days after launch) |
| Heliocentric perihelion | r_p | AU | 0.806 |
| Heliocentric aphelion | r_a | AU | 0.995 |
| Orbital period | T | days | ~311.6 |
| Orbital inclination (ecliptic) | i | deg | ~3.35 |
| Data rate (close range) | R_close | bps | 64 |
| Data rate (maximum range) | R_far | bps | 1 |

### Formulas

**The Link Budget Equation -- Why You Can Hear a 5-Watt Whisper from 36 Million Kilometers:**

Pioneer 5 was the first true interplanetary probe. Not a lunar flyby like Pioneers 1-4, but a spacecraft placed into a heliocentric orbit between Earth and Venus, communicating back to Earth as the distance grew from thousands to tens of millions of kilometers. The fundamental question: how is it possible to detect a 5-watt signal at a distance of 36.2 million km? A 5-watt lightbulb is barely visible across a football field. Yet Pioneer 5's 5-watt transmitter was heard across a distance equivalent to the Earth-Sun separation divided by four.

The answer is the link budget -- an accounting of every gain and loss between the transmitter and receiver. It is a bookkeeping exercise, but the numbers it keeps track of span 200 orders of magnitude.

```
THE LINK BUDGET (in decibels):

The link budget tallies power from transmitter to receiver:

  P_received = P_transmit + G_transmit - L_space - L_other + G_receive

All quantities in decibels (dB):
  P_transmit = transmitter output power (dBW)
  G_transmit = transmit antenna gain (dBi)
  L_space = free space path loss (dB)
  L_other = other losses (atmospheric, pointing, polarization)
  G_receive = receive antenna gain (dBi)

STEP 1: Transmitter Power
  P_t = 5 W = 10 * log10(5) = 6.99 dBW ~ 7.0 dBW

  Five watts. A nightlight. A single LED bulb. This is all
  Pioneer 5 had -- the spacecraft was 43 kg total, with solar
  cells generating approximately 30 watts total. The transmitter
  used 5 of those 30 watts. Economy of energy at interplanetary
  scale.

STEP 2: Transmit Antenna Gain
  Pioneer 5 used a turnstile dipole antenna -- essentially
  two crossed dipoles. It radiates nearly omnidirectionally:
  it does not need to point at Earth, which is critical because
  Pioneer 5 was spin-stabilized and could not aim its antenna.

  G_t ~ 2 dBi (factor of 1.6 above isotropic)

  This is almost nothing. A directed antenna could provide
  20-40 dBi of gain. But directing an antenna requires
  pointing, and Pioneer 5 could not point. The 2 dBi gain
  is the price of simplicity.

STEP 3: Free Space Path Loss
  This is where the inverse-square law dominates. A signal
  radiating from an isotropic source spreads over a sphere
  of area 4 * pi * d^2. At distance d, the power per unit
  area is:

  S = P / (4 * pi * d^2)

  In decibels, the free space path loss is:

  L_space = 20 * log10(d) + 20 * log10(f) + 20 * log10(4*pi/c)

  where d is in meters, f is in Hz, c = 3 × 10^8 m/s.

  For Pioneer 5 at maximum range:
    d = 36.2 × 10^9 m
    f = 378.2 × 10^6 Hz

  20 * log10(36.2e9) = 20 * 10.559 = 211.2 dB
  20 * log10(378.2e6) = 20 * 8.578 = 171.6 dB
  20 * log10(4*pi/c) = 20 * log10(4.189e-8) = -147.6 dB

  L_space = 211.2 + 171.6 - 147.6 = 235.2 dB

  235 dB of loss. This is a factor of 10^23.5 -- the signal
  power is divided by 3 × 10^23. Three hundred thousand
  billion billion. The inverse-square law is merciless at
  interplanetary distances.

STEP 4: Other Losses
  Atmospheric absorption at 378 MHz: negligible (~0.1 dB)
  Polarization mismatch: ~1 dB (spinning spacecraft,
    circularly polarized receive)
  Pointing loss: ~1 dB (Jodrell Bank tracking error)
  Total L_other ~ 2 dB

STEP 5: Receive Antenna Gain
  Jodrell Bank's 76.2-meter (250-foot) dish:
  G_r = 10 * log10(eta * (pi * D / lambda)^2)

  where:
    eta = aperture efficiency (~0.55 for a dish this large)
    D = 76.2 m
    lambda = c / f = 3e8 / 378.2e6 = 0.793 m

  G_r = 10 * log10(0.55 * (pi * 76.2 / 0.793)^2)
      = 10 * log10(0.55 * (301.8)^2)
      = 10 * log10(0.55 * 91,083)
      = 10 * log10(50,096)
      = 47.0 dBi

  The 76-meter dish is the hero of this story. Without it,
  Pioneer 5 would have been lost in the noise at a fraction
  of the range it actually achieved. Bernard Lovell built
  Jodrell Bank for radio astronomy. NASA borrowed it for
  deep space tracking. The dish provided 47 dB of gain --
  a factor of 50,000 in collected power compared to an
  isotropic antenna.

ASSEMBLING THE LINK BUDGET:
  P_received = P_t + G_t - L_space - L_other + G_r
             = 7.0 + 2.0 - 235.2 - 2.0 + 47.0
             = -181.2 dBW

  In watts: P_received = 10^(-181.2/10) = 7.6 × 10^-19 W

  Less than a femtowatt. Less than a single photon per
  microsecond at this frequency. The received signal is
  19 orders of magnitude below a watt.

CAN WE DETECT IT?

  The minimum detectable signal depends on the receiver's
  noise temperature and the required bandwidth:

  P_noise = k * T_sys * B

  where:
    k = Boltzmann constant = 1.381 × 10^-23 J/K
    T_sys = system noise temperature (K)
    B = receiver bandwidth (Hz)

  For Jodrell Bank in 1960:
    T_sys ~ 200 K (early parametric amplifier receivers)
    B = bandwidth set by data rate

  At the maximum range, the data rate was reduced to 1 bps.
  For binary detection, the minimum bandwidth is approximately
  equal to the data rate: B ~ 1 Hz.

  P_noise = 1.381e-23 * 200 * 1 = 2.76 × 10^-21 W
          = -205.6 dBW

  Signal-to-noise ratio:
  SNR = P_received - P_noise = -181.2 - (-205.6) = 24.4 dB

  A 24 dB SNR is excellent -- the signal is 250 times stronger
  than the noise floor. This is why Pioneer 5 was heard at
  36.2 million km: the combination of a large dish (47 dBi),
  a narrow bandwidth (1 Hz), and a low noise temperature
  (200 K) produced a receiver sensitive enough to detect the
  whisper of a 5-watt transmitter across interplanetary space.

  But notice the data rate: 1 bit per second. At close range,
  Pioneer 5 transmitted at 64 bps. As the distance increased
  and the signal weakened, the data rate was stepped down:
  64 -> 16 -> 8 -> 1 bps. Each factor-of-2 reduction in data
  rate recovers 3 dB of SNR (halving the bandwidth halves the
  noise power). The price of distance is speed. You can hear
  the signal, but you must listen more slowly.
```

### Worked Example

**Problem:** Compute the received signal power and SNR for Pioneer 5 at several distances, and determine the maximum data rate at each distance for a minimum SNR of 10 dB.

```python
import numpy as np

print("PIONEER 5: DEEP SPACE LINK BUDGET")
print("=" * 65)

# Constants
c = 3.0e8           # speed of light (m/s)
k = 1.381e-23       # Boltzmann constant (J/K)
AU = 1.496e11        # 1 AU in meters

# Pioneer 5 parameters
P_t_W = 5.0          # transmitter power (W)
f_Hz = 378.2e6       # transmitter frequency (Hz)
lam = c / f_Hz        # wavelength (m)
G_t_dBi = 2.0        # transmit antenna gain (turnstile dipole)

# Jodrell Bank receiver
D_dish = 76.2         # dish diameter (m)
eta_dish = 0.55       # aperture efficiency
G_r_lin = eta_dish * (np.pi * D_dish / lam)**2
G_r_dBi = 10 * np.log10(G_r_lin)
T_sys = 200.0         # system noise temperature (K)
L_other_dB = 2.0      # miscellaneous losses (dB)

print(f"\nPioneer 5 Link Parameters:")
print(f"  Transmitter: {P_t_W} W = {10*np.log10(P_t_W):.1f} dBW")
print(f"  Frequency: {f_Hz/1e6:.1f} MHz, wavelength: {lam:.3f} m")
print(f"  Tx antenna gain: {G_t_dBi:.1f} dBi (turnstile dipole)")
print(f"  Rx dish: {D_dish} m, efficiency {eta_dish}")
print(f"  Rx antenna gain: {G_r_dBi:.1f} dBi")
print(f"  System noise temp: {T_sys} K")
print(f"  Other losses: {L_other_dB} dB")

# EIRP (Effective Isotropic Radiated Power)
EIRP_dBW = 10*np.log10(P_t_W) + G_t_dBi
print(f"\n  EIRP = {EIRP_dBW:.1f} dBW ({10**(EIRP_dBW/10):.1f} W effective)")

print(f"\n{'='*65}")
print(f"LINK BUDGET vs DISTANCE")
print(f"{'='*65}")
header = f"{'Distance':>14} | {'FSPL (dB)':>10} | {'P_rx (dBW)':>11} | {'P_rx (W)':>12} | {'Max Rate':>10}"
print(f"\n{header}")
print(f"{'-'*65}")

# Distances to evaluate
distances = [
    ("1,000 km", 1.0e6),
    ("100,000 km", 1.0e8),
    ("1 million km", 1.0e9),
    ("5 million km", 5.0e9),
    ("10 million km", 1.0e10),
    ("20 million km", 2.0e10),
    ("36.2 million km", 3.62e10),
    ("1 AU (150M km)", AU),
]

SNR_min_dB = 10.0   # minimum required SNR

for name, d_m in distances:
    # Free space path loss
    FSPL_dB = 20*np.log10(d_m) + 20*np.log10(f_Hz) + 20*np.log10(4*np.pi/c)

    # Received power
    P_rx_dBW = 10*np.log10(P_t_W) + G_t_dBi - FSPL_dB - L_other_dB + G_r_dBi
    P_rx_W = 10**(P_rx_dBW/10)

    # Maximum data rate for SNR_min
    # P_rx = k * T_sys * B * SNR_min_lin + noise
    # SNR = P_rx / (k * T_sys * B) >= SNR_min_lin
    # B_max = P_rx / (k * T_sys * SNR_min_lin)
    SNR_min_lin = 10**(SNR_min_dB/10)
    B_max = P_rx_W / (k * T_sys * SNR_min_lin)

    if B_max >= 1000:
        rate_str = f"{B_max/1000:.0f} kbps"
    elif B_max >= 1:
        rate_str = f"{B_max:.0f} bps"
    else:
        rate_str = f"{B_max*1000:.1f} mbps"

    print(f"{name:>14} | {FSPL_dB:>10.1f} | {P_rx_dBW:>11.1f} | {P_rx_W:>12.2e} | {rate_str:>10}")

print(f"\n  At 36.2 million km (Pioneer 5 max range):")
d_max = 3.62e10
FSPL_max = 20*np.log10(d_max) + 20*np.log10(f_Hz) + 20*np.log10(4*np.pi/c)
P_rx_max = 10**(( 10*np.log10(P_t_W) + G_t_dBi - FSPL_max - L_other_dB + G_r_dBi)/10)
SNR_1bps = P_rx_max / (k * T_sys * 1.0)
print(f"  SNR at 1 bps bandwidth: {10*np.log10(SNR_1bps):.1f} dB")
print(f"  Signal is {SNR_1bps:.0f}x above noise floor")
print(f"  Pioneer 5 was heard because the data rate was slowed to 1 bps")
print(f"  and Jodrell Bank's 76-m dish collected 50,000x more power")
print(f"  than a simple dipole antenna would have.")

print(f"\n{'='*65}")
print(f"THE INVERSE-SQUARE LAW IN ACTION")
print(f"{'='*65}")
print(f"\n  Signal power decreases as 1/d^2.")
print(f"  Double the distance -> 1/4 the power -> lose 6 dB.")
print(f"  10x the distance -> 1/100 the power -> lose 20 dB.")
print(f"\n  Pioneer 5 distance grew 36,000x from LEO to max range:")
print(f"    20 * log10(36000) = {20*np.log10(36000):.1f} dB of additional loss")
print(f"    That is a factor of {36000**2:.2e} in power reduction.")
print(f"\n  The only way to maintain communication:")
print(f"    1. Bigger receive dish (Jodrell Bank: 76 m)")
print(f"    2. Slower data rate (64 bps -> 1 bps)")
print(f"    3. Lower noise temperature (parametric amplifiers)")
print(f"  Pioneer 5 used all three.")
```

**Debate Question 1:** The link budget for Pioneer 5 shows that the received power at maximum range was approximately 10^-18 watts -- less than a single optical photon per microsecond. Yet the signal was detected reliably enough to extract scientific data at 1 bit per second. The detection works because the receiver bandwidth was narrowed to 1 Hz, integrating the signal over an entire second. This is the fundamental trade in communications: bandwidth for distance. At 64 bps near Earth, Pioneer 5 could transmit a complete magnetometer reading in seconds. At 1 bps at 36 million km, the same reading took a minute. The scientific data was identical in both cases -- the magnetometer's measurement did not change based on how quickly it was reported. What changed was the time resolution: near Earth, the probe could report changes happening second by second; at maximum range, it could only report minute-by-minute averages. The inverse-square law does not destroy information. It taxes the rate at which information can be transmitted. Shannon's theorem (Deposit 3) makes this precise: the capacity of the channel decreases as the square root of the signal power, which decreases as 1/d^2. Distance is a toll on communication speed, not communication possibility. As long as you are willing to wait long enough, the signal is there.

---

## Deposit 2: Heliocentric Orbit Mechanics (Layer 4, Section 4.11)

### Table

| Parameter | Symbol | Units | Value |
|-----------|--------|-------|-------|
| Pioneer 5 perihelion | r_p | AU | 0.806 |
| Pioneer 5 aphelion | r_a | AU | 0.995 |
| Semi-major axis | a | AU | 0.9005 |
| Orbital eccentricity | e | -- | 0.105 |
| Orbital period | T | days | ~311.6 |
| Venus semi-major axis | a_V | AU | 0.723 |
| Earth semi-major axis | a_E | AU | 1.000 |
| Pioneer 5 velocity at perihelion | v_p | km/s | ~33.3 |
| Pioneer 5 velocity at aphelion | v_a | km/s | ~27.0 |
| Earth's orbital velocity | v_E | km/s | ~29.8 |

### Formulas

**The Vis-Viva Equation -- Energy Determines Orbit:**

Pioneer 5 was launched into a heliocentric orbit between Earth and Venus. It did not go to Venus -- it entered a solar orbit with a perihelion of 0.806 AU and an aphelion of 0.995 AU. The orbit is entirely characterized by two numbers: the semi-major axis (a) and the eccentricity (e). From these, every other orbital parameter follows through the vis-viva equation -- the fundamental energy equation of orbital mechanics.

```
THE VIS-VIVA EQUATION:

  v^2 = GM_sun * (2/r - 1/a)

  where:
    v = orbital velocity at distance r from the Sun (m/s)
    G = gravitational constant = 6.674 × 10^-11 m^3 kg^-1 s^-2
    M_sun = solar mass = 1.989 × 10^30 kg
    GM_sun = 1.327 × 10^20 m^3/s^2
    r = current heliocentric distance (m)
    a = semi-major axis of the orbit (m)

  This equation encodes the total orbital energy:

  E = (1/2) * v^2 - GM/r = -GM/(2a)

  The first term is kinetic energy per unit mass.
  The second term is gravitational potential energy per unit mass.
  The sum is constant -- conserved at every point in the orbit.
  The semi-major axis alone determines the total energy.

PIONEER 5's ORBIT:

  Perihelion: r_p = 0.806 AU = 0.806 × 1.496e11 = 1.206 × 10^11 m
  Aphelion:   r_a = 0.995 AU = 0.995 × 1.496e11 = 1.489 × 10^11 m

  Semi-major axis:
    a = (r_p + r_a) / 2
      = (0.806 + 0.995) / 2
      = 0.9005 AU
      = 1.347 × 10^11 m

  Eccentricity:
    e = (r_a - r_p) / (r_a + r_p)
      = (0.995 - 0.806) / (0.995 + 0.806)
      = 0.189 / 1.801
      = 0.105

  Orbital period (Kepler's third law):
    T^2 = (4 * pi^2 / GM_sun) * a^3
    T = 2 * pi * sqrt(a^3 / GM_sun)
    T = 2 * pi * sqrt((1.347e11)^3 / 1.327e20)
    T = 2.693 × 10^7 s
    T = 311.7 days

  This is less than Earth's year (365.25 days) because
  Pioneer 5's orbit is smaller than Earth's. A smaller orbit
  means less energy, which means a shorter period.

VELOCITY AT PERIHELION AND APHELION:

  At perihelion (r = r_p):
    v_p = sqrt(GM_sun * (2/r_p - 1/a))
        = sqrt(1.327e20 * (2/1.206e11 - 1/1.347e11))
        = sqrt(1.327e20 * (1.658e-11 - 7.424e-12))
        = sqrt(1.327e20 * 9.160e-12)
        = sqrt(1.215e9)
        = 34,860 m/s = 34.9 km/s

  At aphelion (r = r_a):
    v_a = sqrt(GM_sun * (2/r_a - 1/a))
        = sqrt(1.327e20 * (2/1.489e11 - 1/1.347e11))
        = sqrt(1.327e20 * (1.343e-11 - 7.424e-12))
        = sqrt(1.327e20 * 6.005e-12)
        = sqrt(7.967e8)
        = 28,226 m/s = 28.2 km/s

  At aphelion, Pioneer 5 is moving at 28.2 km/s.
  Earth moves at 29.8 km/s.
  The difference is only 1.6 km/s -- Pioneer 5 slowly
  falls behind Earth as it moves along its orbit.

HOW DID PIONEER 5 GET INTO THIS ORBIT?

  Pioneer 5 launched from Earth, which orbits at ~29.8 km/s.
  To enter an orbit with aphelion at 0.995 AU (just inside
  Earth's orbit), the spacecraft needed to be slowed slightly
  relative to Earth. The launch from Cape Canaveral on a
  Thor-Able IV placed Pioneer 5 on a trajectory with a
  heliocentric velocity slightly less than Earth's.

  The required velocity deficit:
    v_launch = v_a (of transfer orbit) = ~28.2 km/s (at r ~ 1 AU)

  But Earth moves at 29.8 km/s. So Pioneer 5 needed to
  depart Earth with a velocity deficit of approximately
  1.6 km/s relative to Earth -- which translates to a
  hyperbolic excess velocity (v_infinity) of about 1.6 km/s.

  This is a modest requirement. The Thor-Able IV's third
  stage easily provided the necessary velocity. The challenge
  was not reaching the orbit but COMMUNICATING from it.
```

```python
import numpy as np

print("PIONEER 5: HELIOCENTRIC ORBIT")
print("=" * 60)

# Constants
GM_sun = 1.327e20    # m^3/s^2
AU = 1.496e11         # meters

# Pioneer 5 orbital elements
r_p_AU = 0.806
r_a_AU = 0.995
r_p = r_p_AU * AU
r_a = r_a_AU * AU
a = (r_p + r_a) / 2
e = (r_a - r_p) / (r_a + r_p)
T = 2 * np.pi * np.sqrt(a**3 / GM_sun)

print(f"\nOrbital Elements:")
print(f"  Perihelion: {r_p_AU} AU = {r_p/1e9:.3f} × 10^9 m")
print(f"  Aphelion:   {r_a_AU} AU = {r_a/1e9:.3f} × 10^9 m")
print(f"  Semi-major axis: {a/AU:.4f} AU")
print(f"  Eccentricity: {e:.4f}")
print(f"  Period: {T/86400:.1f} days ({T/86400/365.25:.3f} years)")

# Vis-viva at key points
print(f"\n{'='*60}")
print(f"VIS-VIVA: VELOCITY vs DISTANCE")
print(f"{'='*60}")
print(f"\n{'Location':>20} | {'r (AU)':>8} | {'v (km/s)':>10} | {'v_Earth':>8}")
print(f"{'-'*52}")

# Earth's velocity for comparison
v_earth = np.sqrt(GM_sun / AU) / 1000

for name, r_AU in [("Perihelion", r_p_AU), ("0.85 AU", 0.85),
                     ("0.90 AU (=a)", 0.9005), ("0.95 AU", 0.95),
                     ("Aphelion", r_a_AU)]:
    r = r_AU * AU
    v = np.sqrt(GM_sun * (2/r - 1/a))
    v_km = v / 1000
    print(f"{name:>20} | {r_AU:>8.3f} | {v_km:>10.2f} | {v_earth:>8.2f}")

print(f"\n  Earth's circular velocity: {v_earth:.2f} km/s")
v_aph = np.sqrt(GM_sun * (2/r_a - 1/a)) / 1000
print(f"  Pioneer 5 at aphelion: {v_aph:.2f} km/s")
print(f"  Velocity deficit: {v_earth - v_aph:.2f} km/s")
print(f"  Pioneer 5 slowly recedes from Earth after launch")

# Communication distance over time
print(f"\n{'='*60}")
print(f"COMMUNICATION DISTANCE vs TIME")
print(f"{'='*60}")
print(f"\n  Pioneer 5 and Earth both orbit the Sun, but at different")
print(f"  speeds (different semi-major axes). The distance between")
print(f"  them changes continuously.\n")

# Simplified: compute distance from anomaly propagation
# Use mean motion for both orbits
n_p5 = 2 * np.pi / T                      # Pioneer 5 mean motion
n_earth = 2 * np.pi / (365.25 * 86400)    # Earth mean motion

print(f"{'Day':>6} | {'P5 angle (deg)':>15} | {'Earth angle':>12} | {'Sep (AU)':>10} | {'Sep (Mkm)':>10}")
print(f"{'-'*60}")

for day in [0, 10, 20, 30, 50, 70, 90, 107]:
    t = day * 86400
    # Mean anomaly (simplified -- ignoring eccentricity for distance estimate)
    M_p5 = n_p5 * t
    M_earth = n_earth * t

    # Approximate positions (using circular approximation for distance)
    r_p5 = a  # average distance for simplified model
    r_e = AU

    # Angular separation
    theta_diff = M_earth - M_p5  # Earth moves slower in angle? No--
    # Pioneer 5 has smaller orbit, faster angular rate
    # But launched in same direction as Earth, so initially together

    # Better: compute actual angle difference
    # Pioneer 5 angle advances faster (shorter period)
    angle_p5_deg = np.degrees(M_p5) % 360
    angle_earth_deg = np.degrees(M_earth) % 360

    # Distance from law of cosines
    delta_angle = M_p5 - M_earth
    dist = np.sqrt(r_p5**2 + r_e**2 - 2*r_p5*r_e*np.cos(delta_angle))

    print(f"{day:>6} | {angle_p5_deg:>15.1f} | {angle_earth_deg:>12.1f} | {dist/AU:>10.4f} | {dist/1e9:>10.1f}")

print(f"\n  Last contact: day 107 at ~36.2 million km (0.242 AU)")
print(f"  Communication was lost not because the probe failed,")
print(f"  but because the signal became too weak to decode")
print(f"  even at 1 bps. Distance won.")
```

**Debate Question 2:** Pioneer 5's orbit (0.806 x 0.995 AU) is sometimes called a "Venus-class" orbit because its perihelion is near Venus's orbital distance. But Pioneer 5 was not aimed at Venus -- it was aimed at interplanetary space itself. The mission's purpose was to measure the interplanetary medium between Earth and Venus: the magnetic field, the solar wind, the cosmic ray flux, the micrometeorite environment. The orbit was chosen not for its destination but for its journey. This represents a philosophical shift in space exploration: from "go there" (the Moon, Venus, Mars) to "be there" (exist in interplanetary space and report what you find). Pioneer 5 was the first mission designed to investigate the space between planets rather than the planets themselves. The vis-viva equation determines where the spacecraft goes. The link budget determines what it can say about where it is. Together, they define the envelope of interplanetary exploration: you can reach any orbit the rocket can provide, but you can only study what you can communicate back to Earth. Pioneer 5's orbit was modest -- it stayed between Earth and Venus, never approaching either planet closely. But it proved that a small spacecraft with a 5-watt transmitter could maintain communication across interplanetary distances, and that the interplanetary medium was accessible to direct measurement. Every subsequent interplanetary mission -- Mariner, Voyager, New Horizons -- built on this proof.

---

## Deposit 3: Shannon Capacity at Extreme Distance (Layer 7, Section 7.6)

### Formulas

**Shannon's Channel Capacity Theorem Applied to Deep Space:**

Claude Shannon proved in 1948 that every communication channel has a maximum data rate -- the channel capacity C -- that depends on the bandwidth B and the signal-to-noise ratio SNR:

```
SHANNON'S CHANNEL CAPACITY:

  C = B * log2(1 + SNR)

  where:
    C = channel capacity (bits per second)
    B = channel bandwidth (Hz)
    SNR = signal-to-noise ratio (linear, not dB)

  This is a theoretical maximum -- the best that any coding
  scheme can achieve. Real systems approach it but do not
  exceed it.

  For a deep space link, the SNR depends on distance:

  SNR = (P_t * G_t * G_r * lambda^2) / ((4*pi)^2 * d^2 * k * T_sys * B)

  Note: SNR depends on B (the bandwidth). If we substitute:

  C = B * log2(1 + P_rx / (k * T_sys * B))

  This means capacity depends on the RATIO of received power
  to noise power per hertz (P_rx / (k * T_sys)), which is
  called the "carrier-to-noise-density ratio" C/N0:

  C/N0 = P_rx / (k * T_sys)

  In dB-Hz: C/N0 (dB-Hz) = P_rx (dBW) - 10*log10(k*T_sys)

PIONEER 5 at MAXIMUM RANGE:

  P_rx ~ -181.2 dBW (from Deposit 1)
  k * T_sys = 1.381e-23 * 200 = 2.76e-21 W/Hz
  10*log10(k*T_sys) = -205.6 dBW/Hz

  C/N0 = -181.2 - (-205.6) = 24.4 dB-Hz
       = 10^2.44 = 275 Hz

  This means the theoretical maximum capacity is:

  C_max = C/N0 * log2(2) = 275 * 1 = 275 bps (at SNR=1 per bit)

  More precisely, using the Shannon limit for the additive
  white Gaussian noise channel:

  For each bit of information, you need Eb/N0 >= ln(2) = -1.59 dB.
  This is the ultimate Shannon limit.

  At Eb/N0 = 0 dB (SNR = 1 per bit, the practical limit
  for simple modulation in 1960):

  C_practical ~ C/N0 = 275 bps

  Pioneer 5's actual data rate at maximum range: 1 bps.
  That is 0.4% of the Shannon limit.

  Why so far below the limit? Because Pioneer 5 used
  simple amplitude-keyed modulation with no error correction
  coding. Modern deep space proths use turbo codes and LDPC
  codes that approach within 0.5 dB of the Shannon limit.
  If Pioneer 5 had modern coding, it could have transmitted
  at approximately 200 bps at maximum range instead of 1 bps.

THE DISTANCE-CAPACITY CURVE:

  Since P_rx ~ 1/d^2, and C ~ P_rx (at low SNR):

  C ~ 1/d^2

  Doubling the distance quarters the capacity.
  10x the distance reduces capacity by 100x.

  At launch (d ~ 1000 km):
    C_max ~ 275 * (36.2e6 / 1000)^2 ~ 3.6 × 10^11 bps
    (Absurdly high -- the link was not bandwidth-limited
    at close range. The 64 bps data rate was set by the
    onboard data system, not the link.)

  At 5 million km:
    C_max ~ 275 * (36.2 / 5)^2 ~ 14,400 bps

  At 36.2 million km:
    C_max ~ 275 bps (the Shannon limit)
    Actual: 1 bps (modulation efficiency ~0.4%)

  The gap between Shannon's limit and Pioneer 5's actual
  rate was closed over the following decades by coding theory.
  The gap between Pioneer 5's 5-watt transmitter and the
  400-watt transmitters of later missions was closed by
  bigger solar panels and nuclear power (RTGs).

INFORMATION CONTENT OF PIONEER 5's TELEMETRY:

  At 1 bps for 107 days, the total data returned was:
    107 days * 86400 s/day * 1 bps = 9.24 million bits

  In practice, only portions of each day had ground
  station coverage, and not all days used the 1 bps rate.
  A rough estimate of total data: approximately 5-10 Mbits
  over the mission lifetime.

  By modern standards, this is one photograph from a
  smartphone camera. Pioneer 5 spent 107 days transmitting
  what a modern phone uploads in a second.

  But those 5-10 Mbits contained the FIRST measurements
  of the interplanetary magnetic field, the FIRST direct
  detection of a magnetic storm from a solar flare in
  interplanetary space (at 5 million km on March 31, 1960),
  and the FIRST evidence that the solar wind was a
  continuous stream rather than intermittent bursts.

  Shannon's theorem says nothing about the VALUE of
  information. It measures the RATE. The rate was 1 bps.
  The value was incalculable.
```

```python
import numpy as np

print("PIONEER 5: SHANNON CAPACITY vs DISTANCE")
print("=" * 60)

# Link parameters (from Deposit 1)
P_t = 5.0             # W
f = 378.2e6           # Hz
c = 3e8
lam = c / f
G_t = 10**(2.0/10)    # linear
G_r = 10**(47.0/10)   # linear (Jodrell Bank)
L_other = 10**(2.0/10)
k = 1.381e-23
T_sys = 200.0

# Reference: compute C/N0 at each distance
def capacity_at_distance(d_m):
    """Compute Shannon capacity at distance d_m."""
    FSPL_lin = ((4 * np.pi * d_m) / lam)**2
    P_rx = P_t * G_t * G_r / (FSPL_lin * L_other)
    CN0 = P_rx / (k * T_sys)  # Hz
    # Shannon limit: C = CN0 * ln(2) for Eb/N0 = ln(2)
    # Practical: C ~ CN0 at Eb/N0 = 0 dB
    C_shannon = CN0 * np.log2(2)  # ultimate limit
    C_practical = CN0  # at Eb/N0 = 0 dB (1960s modulation)
    return P_rx, CN0, C_shannon, C_practical

print(f"\n{'Distance':>18} | {'P_rx (W)':>12} | {'C/N0 (Hz)':>10} | {'C_shannon':>12} | {'Actual':>8}")
print(f"{'-'*68}")

cases = [
    ("10,000 km", 1e7, 64),
    ("100,000 km", 1e8, 64),
    ("1 million km", 1e9, 64),
    ("5 million km", 5e9, 16),
    ("10 million km", 1e10, 8),
    ("20 million km", 2e10, 1),
    ("36.2 million km", 3.62e10, 1),
]

for name, d_m, actual_bps in cases:
    P_rx, CN0, C_sh, C_pr = capacity_at_distance(d_m)
    if C_sh >= 1e6:
        c_str = f"{C_sh/1e6:.0f} Mbps"
    elif C_sh >= 1e3:
        c_str = f"{C_sh/1e3:.0f} kbps"
    else:
        c_str = f"{C_sh:.0f} bps"
    print(f"{name:>18} | {P_rx:>12.2e} | {CN0:>10.0f} | {c_str:>12} | {actual_bps:>6} bps")

print(f"\n{'='*60}")
print(f"EFFICIENCY: PIONEER 5 vs SHANNON LIMIT")
print(f"{'='*60}")

P_rx_max, CN0_max, C_sh_max, _ = capacity_at_distance(3.62e10)
print(f"\n  At maximum range (36.2 million km):")
print(f"  Shannon limit: {C_sh_max:.0f} bps")
print(f"  Pioneer 5 actual: 1 bps")
print(f"  Efficiency: {1.0/C_sh_max * 100:.1f}%")
print(f"\n  Pioneer 5 operated at {1.0/C_sh_max * 100:.1f}% of the Shannon limit.")
print(f"  Modern deep space missions (Voyager, New Horizons) use turbo")
print(f"  codes that achieve ~80-90% of the Shannon limit.")
print(f"  The coding gain from 1960 to 2025: ~{10*np.log10(C_sh_max/1):.0f} dB")
print(f"\n  If Pioneer 5 had modern coding, at 36.2 million km it could")
print(f"  have transmitted at ~{C_sh_max * 0.8:.0f} bps instead of 1 bps --")
print(f"  a {C_sh_max * 0.8:.0f}x improvement with the same transmitter power.")

print(f"\n{'='*60}")
print(f"TOTAL MISSION DATA")
print(f"{'='*60}")
# Rough estimate: varying data rate over mission
days_at_64 = 10
days_at_16 = 20
days_at_8 = 20
days_at_1 = 57
coverage = 0.35  # fraction of time with ground station contact

total_bits = coverage * 86400 * (
    days_at_64 * 64 + days_at_16 * 16 + days_at_8 * 8 + days_at_1 * 1
)
print(f"\n  Estimated total data (with {coverage*100:.0f}% ground coverage):")
print(f"    Days at 64 bps: {days_at_64}")
print(f"    Days at 16 bps: {days_at_16}")
print(f"    Days at  8 bps: {days_at_8}")
print(f"    Days at  1 bps: {days_at_1}")
print(f"    Total bits: {total_bits:.2e} ({total_bits/8/1024:.0f} KB)")
print(f"\n  {total_bits/8/1024:.0f} KB. Less than a single JPEG photograph.")
print(f"  But those kilobytes contained the first measurements of")
print(f"  the interplanetary magnetic field, the first detection")
print(f"  of a solar flare's magnetic storm in deep space, and the")
print(f"  proof that a small probe could maintain contact across")
print(f"  the inner solar system. Shannon measures rate.")
print(f"  History measures consequence.")
```

**Debate Question 3:** Shannon's theorem gives the maximum data rate for a channel with a given signal-to-noise ratio. It is a theorem of mathematics, not physics -- it tells you what is possible, not how to achieve it. In 1960, Pioneer 5's modulation scheme (simple amplitude keying) operated at less than 1% of the Shannon limit. By 2025, deep space links using turbo codes and LDPC codes operate at 80-90% of the Shannon limit. The improvement came entirely from mathematics -- from coding theory developed by Berger, Forney, Berrou, and others between 1960 and 2000. The transmitter power did not change. The antenna sizes did not change (much). What changed was the algorithm that converted bits into symbols and symbols back into bits. The coding gain was approximately 25 dB -- equivalent to increasing the transmitter power by a factor of 300, or increasing the antenna diameter by a factor of 17. Mathematics, not hardware, closed the gap. Pioneer 5's 5-watt transmitter, combined with modern coding, would achieve at 36.2 million km what the actual Pioneer 5 achieved at approximately 2 million km. The inverse-square law is physics. The coding efficiency is mathematics. The tension between them defines the frontier of deep space communications: physics sets the noise floor, and mathematics determines how close to that floor you can operate. Shannon drew the line. Six decades of coding theory approached it. Pioneer 5 showed where the line was.

---

*"Douglas Adams was born on March 11, 1952, eight years to the day before Pioneer 5 launched. In The Hitchhiker's Guide to the Galaxy, Adams wrote that space is big -- 'really big -- you just won't believe how vastly, hugely, mind-bogglingly big it is.' Pioneer 5 was the first spacecraft to provide a quantitative measure of that bigness from inside it. Not a flyby of the Moon, not a failed attempt at Venus, but a spacecraft sitting in the interplanetary medium, transmitting data back to Earth from distances that grew by hundreds of thousands of kilometers every day. At 36.2 million km, the signal from Pioneer 5's 5-watt transmitter arrived at Jodrell Bank at a power level of 7.6 × 10^-19 watts -- a number so small that Adams might have described it as the probability of a sperm whale materializing in the upper atmosphere of Magrathea. The improbability of detecting that signal is not fiction. It is the link budget, worked through with the precision of a tax return. The inverse-square law reduces the signal by a factor of 10^23. The antenna gain recovers a factor of 50,000. The narrow bandwidth recovers another factor of 64. The low noise temperature provides the final margin. Each factor is documented, each loss accounted for, each gain earned by engineering. The Heart of Gold's Infinite Improbability Drive achieved the impossible by passing through every point in the universe simultaneously. Pioneer 5's 5-watt transmitter achieved the merely extraordinary by concentrating everything -- receiver sensitivity, antenna area, bandwidth reduction, integration time -- onto one weak signal from one small point in space. Adams understood that the universe is absurdly large and human technology is absurdly small, and that the comedy is in the mismatch. Pioneer 5 turned the comedy into arithmetic and found that the numbers, improbably, worked."*