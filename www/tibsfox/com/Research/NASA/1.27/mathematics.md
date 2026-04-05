# Mission 1.27 -- Ranger 2: The Math of Being Stuck

## Track 3: TSPB Mathematics (McNeese-Hoag Format)

**Mission:** Ranger 2 (November 18, 1961)
**Primary TSPB Layer:** 4 (Vector Calculus -- Parking Orbit Dynamics, Gyroscope Physics)
**Secondary Layers:** 5 (Probability and Statistics -- Serial Reliability, Spore Dispersal), 2 (Algebra -- Orbital Decay)
**Format:** McNeese-Hoag Reference Standard (1961) -- Tables, Formulas, Worked Examples

---

## Deposit 1: The Parking Orbit (Layer 4, Section 4.27)

### Table

| Parameter | Symbol | Units | Ranger 2 Value |
|-----------|--------|-------|-----------------|
| Launch date | -- | -- | November 18, 1961, 08:12:21.5 UTC |
| Launch vehicle | -- | -- | Atlas-Agena B (Atlas 117D) |
| Operating agency | -- | -- | NASA / JPL |
| Spacecraft mass | m_sc | kg | 304 |
| Parking orbit perigee | h_p | km | 150 |
| Parking orbit apogee | h_a | km | 242 |
| Orbital inclination | i | deg | 33.3 |
| Orbital period | T | min | 88.3 |
| Intended final orbit apogee | h_target | km | ~1,100,000 |
| Contact duration | t_contact | hr | ~23 |
| Orbit lifetime | t_life | days | ~2 |
| Failure mode | -- | -- | Agena B roll gyroscope inoperative |
| Reentry date | -- | -- | November 20, 1961 |

### Formulas

**Parking Orbit Parameters:**

```
Semi-major axis: a = (r_p + r_a) / 2
  where r_p = R_E + h_p, r_a = R_E + h_a

Eccentricity: e = (r_a - r_p) / (r_a + r_p)

Orbital period: T = 2 * pi * sqrt(a^3 / mu)
  where mu = G * M_E = 3.986e14 m^3/s^2

Velocity at perigee: v_p = sqrt(mu * (2/r_p - 1/a))
Velocity at apogee: v_a = sqrt(mu * (2/r_a - 1/a))
```

For Ranger 2:
```
r_p = 6.371e6 + 150e3 = 6.521e6 m
r_a = 6.371e6 + 242e3 = 6.613e6 m
a = (6.521e6 + 6.613e6) / 2 = 6.567e6 m
e = (6.613e6 - 6.521e6) / (6.613e6 + 6.521e6) = 0.0070
T = 2 * pi * sqrt(6.567e6^3 / 3.986e14) = 5296 s = 88.3 min

This is a nearly circular orbit (e = 0.007).
The spacecraft circles Earth every 88 minutes.
It was supposed to leave after one orbit.
It stayed for ~33 orbits, then ceased to exist.
```

### Worked Example

**Problem:** Calculate the delta-v required for the Agena B restart burn to raise the apogee from 242 km to 1,100,000 km, and show what Ranger 2 missed.

```python
import numpy as np

mu = 3.986e14    # Earth gravitational parameter
R_e = 6.371e6    # Earth radius

# Parking orbit
h_p = 150e3      # perigee altitude
h_a = 242e3      # apogee altitude
r_p = R_e + h_p
r_a = R_e + h_a

# Parking orbit velocity at perigee
a_park = (r_p + r_a) / 2
v_park = np.sqrt(mu * (2/r_p - 1/a_park))

# Target orbit: perigee 150 km, apogee 1,100,000 km
h_target = 1_100_000e3
r_target = R_e + h_target
a_target = (r_p + r_target) / 2

# Required velocity at perigee for target orbit
v_target = np.sqrt(mu * (2/r_p - 1/a_target))

# Delta-v for the Agena restart burn
dv = v_target - v_park

print("RANGER 2: THE BURN THAT NEVER HAPPENED")
print("=" * 60)
print(f"\nParking orbit:")
print(f"  Perigee: {h_p/1e3:.0f} km, Apogee: {h_a/1e3:.0f} km")
print(f"  Velocity at perigee: {v_park:.0f} m/s = {v_park/1e3:.3f} km/s")
print(f"\nTarget orbit:")
print(f"  Perigee: {h_p/1e3:.0f} km, Apogee: {h_target/1e3:,.0f} km")
print(f"  Velocity at perigee: {v_target:.0f} m/s = {v_target/1e3:.3f} km/s")
print(f"\nRequired delta-v: {dv:.0f} m/s = {dv/1e3:.3f} km/s")
print(f"\nThe Agena B had ~{2400:.0f} m/s of delta-v capability.")
print(f"It needed {dv:.0f} m/s. It had plenty of fuel.")
print(f"But the gyroscope stopped, and the engine never lit.")
print(f"Ranger 2 died in an orbit it could have left")
print(f"with {dv:.0f} m/s -- the velocity of a fast car.")
```

**Resonance statement:** *The delta-v for Ranger 2's injection burn was approximately 2,300 m/s -- the speed of a rifle bullet, the speed difference between going nowhere and going to deep space. The Agena B had enough propellant to deliver this velocity. The engine was capable. The propellants were settled. Everything was ready except a gyroscope the size of a tennis ball, spinning on a bearing thinner than a human hair. When the bearing seized, the 2,300 m/s of capability became irrelevant. The sword fern does not need a single bearing to reproduce. It broadcasts millions of spores on the wind, and if one in a million finds a suitable substrate, the species persists. The fern's redundancy is the antithesis of the Agena's serial fragility.*

---

## Deposit 2: Gyroscope Angular Momentum (Layer 4, Section 4.28)

### Table

| Parameter | Symbol | Units | Typical Agena Gyro |
|-----------|--------|-------|-------------------|
| Rotor mass | m_r | kg | ~0.3-0.5 |
| Rotor radius | r | m | ~0.025-0.035 |
| Spin rate | omega | rpm | 20,000-30,000 |
| Moment of inertia | I | kg*m^2 | ~1.5e-4 to 3e-4 |
| Angular momentum | L | kg*m^2/s | ~0.03-0.08 |
| Precession rate at 1 mN*m | omega_p | deg/s | ~1-3 |

### Formulas

**Angular Momentum of a Spinning Rotor:**

```
L = I * omega

For a solid disk: I = (1/2) * m * r^2
For a hollow ring: I = m * r^2

omega = 2 * pi * rpm / 60  (convert rpm to rad/s)
```

**Precession Under Applied Torque:**

```
omega_p = tau / (L * sin(theta))

For perpendicular torque (theta = 90°):
  omega_p = tau / L

Higher L (faster spin) → slower precession → more stable reference
L = 0 (stopped) → infinite precession rate → no stability → lost reference
```

### Worked Example

```python
import numpy as np

print("GYROSCOPE PHYSICS: WHY ONE STOPPED ROTOR KILLED RANGER 2")
print("=" * 65)

# Typical Agena B gyroscope parameters
m_r = 0.4          # rotor mass (kg)
r = 0.030          # rotor radius (m)
rpm = 24000        # spin rate

# Calculations
I = 0.5 * m_r * r**2                    # moment of inertia
omega = 2 * np.pi * rpm / 60            # angular velocity (rad/s)
L = I * omega                            # angular momentum

print(f"\nGyroscope Parameters:")
print(f"  Rotor mass:  {m_r} kg")
print(f"  Rotor radius: {r*100:.0f} cm")
print(f"  Spin rate:   {rpm:,} rpm = {omega:.0f} rad/s")
print(f"  Moment of inertia: {I:.2e} kg*m^2")
print(f"  Angular momentum:  {L:.4f} kg*m^2/s")

# Precession under disturbance torques
torques_mNm = [0.1, 0.5, 1.0, 5.0, 10.0]
print(f"\nPrecession Rate vs. Disturbance Torque:")
print(f"{'Torque (mN*m)':>15} | {'Precession (deg/s)':>20} | {'Attitude Drift/min':>20}")
print("-" * 60)
for tau_mNm in torques_mNm:
    tau = tau_mNm * 1e-3  # convert to N*m
    omega_p = tau / L     # precession rate (rad/s)
    drift_per_min = np.degrees(omega_p) * 60
    print(f"{tau_mNm:>15.1f} | {np.degrees(omega_p):>20.4f} | {drift_per_min:>20.2f}")

# What happens when the gyro stops
print(f"\n{'='*65}")
print(f"WHEN THE GYRO STOPS (omega → 0, L → 0):")
print(f"  Precession rate → infinity (any torque causes immediate rotation)")
print(f"  Attitude reference → undefined")
print(f"  Guidance system → cannot determine roll angle")
print(f"  Engine restart → cannot verify alignment → aborted")
print(f"  Mission → stranded in parking orbit")
print(f"  Outcome → atmospheric reentry in 2 days")
print(f"\nOne bearing. One rotor. One mission.")
```

**Resonance statement:** *A gyroscope's stability is proportional to its angular momentum. Angular momentum is proportional to spin rate. When the spin rate reaches zero, the stability reaches zero -- instantaneously, completely, without gradation. There is no "partially working" gyroscope in attitude reference terms. It spins or it does not. It provides reference or it does not. The digital nature of this failure -- on/off, working/broken, reference/no reference -- contrasts with the analog redundancy of the sword fern. A fern with 50% of its fronds damaged still photosynthesizes at roughly 50% capacity. It degrades gracefully. The gyroscope degrades catastrophically: 100% functional at full spin, 0% functional at zero spin, and nothing useful in between.*

---

## Deposit 3: Serial System Reliability (Layer 5, Section 5.27)

### Table

| System Component | Estimated Reliability | Failure on Ranger 2? |
|-----------------|----------------------|---------------------|
| Atlas Stage 1 | 0.90 | No (nominal) |
| Atlas Sustainer | 0.95 | No (nominal) |
| Agena 1st Burn | 0.93 | No (nominal) |
| Agena Gyroscopes | 0.95 | **YES (roll gyro failed)** |
| Agena Restart | 0.85 | Not attempted (gyro failure) |
| Separation | 0.98 | No (nominal) |
| SC Attitude | 0.95 | No (worked until N2 depleted) |
| SC Instruments | 0.90 | No (worked until power loss) |

### Formulas

**Serial System Reliability:**

```
R_system = R_1 × R_2 × ... × R_n

For n identical components at reliability p:
  R_system = p^n

Probability of at least one failure:
  P_fail = 1 - R_system
```

### Worked Example

```python
import numpy as np

components = [
    ("Atlas Stage 1",   0.90, False),
    ("Atlas Sustainer",  0.95, False),
    ("Agena 1st Burn",  0.93, False),
    ("Agena Gyroscopes", 0.95, True),   # FAILED
    ("Agena Restart",   0.85, False),   # never attempted
    ("Separation",      0.98, False),
    ("SC Attitude Ctrl", 0.95, False),
    ("SC Instruments",  0.90, False),
]

print("RANGER 2: SERIAL RELIABILITY CHAIN")
print("=" * 65)
print(f"{'Component':<20} {'R':>6} {'Cumulative':>10} {'Status':>10}")
print("-" * 65)

R_cum = 1.0
for name, R, failed in components:
    R_cum *= R
    status = "** FAIL **" if failed else "OK"
    print(f"{name:<20} {R:>6.3f} {R_cum:>10.4f} {status:>10}")

print("-" * 65)
print(f"{'SYSTEM':<20} {'':>6} {R_cum:>10.4f}")
print(f"\nSystem reliability: {R_cum*100:.1f}%")
print(f"The mission was a coin flip before it launched.")
print(f"\nThe gyroscope (R=0.95) was NOT the weakest link.")
print(f"The Agena restart (R=0.85) was weaker.")
print(f"But the gyroscope failed first.")
print(f"Serial chains don't break at the weakest link.")
print(f"They break at whichever link fails FIRST.")
```

**Resonance statement:** *Serial reliability is merciless. Eight components, each above 85% reliable, yielding a system below 50%. The math does not care which component is weakest; it multiplies them all equally. Ranger 2's gyroscope (R=0.95) was not the least reliable component -- the Agena restart engine (R=0.85) was weaker. But the gyroscope failed before the restart was attempted, making the engine's reliability irrelevant. The sword fern's millions of spores are a biological rejection of serial architecture. Each spore runs its own serial chain (dispersal, germination, gametophyte, fertilization, establishment), but the chains are independent and parallel. One chain's failure does not affect the others. The fern launches ten million independent serial chains per year. The Ranger program launched two serial chains per year. The fern's math wins.*

---

## Deposit 4: Orbital Decay and Atmospheric Drag (Layer 2, Section 2.27)

### Table

| Parameter | Symbol | Units | Ranger 2 Value |
|-----------|--------|-------|-----------------|
| Perigee altitude | h_p | km | 150 |
| Atmospheric density at perigee | rho | kg/m^3 | ~2.8e-10 |
| Spacecraft mass | m | kg | 304 |
| Drag coefficient | C_d | -- | ~2.2 |
| Cross-sectional area | A | m^2 | ~4.0 |
| Orbital velocity at perigee | v_p | m/s | ~7,820 |
| Orbital lifetime | t_life | days | ~2 |

### Formulas

**Atmospheric Drag Force:**

```
F_drag = (1/2) * rho * v^2 * C_d * A

This force acts opposite to the velocity vector,
removing kinetic energy from the spacecraft on every
perigee passage. The energy loss lowers the orbit.
```

**Orbital Energy Loss Per Orbit:**

```
delta_E = -pi * rho_p * C_d * A * a * v_p^2

where rho_p is the density at perigee and the drag
integral is evaluated over one orbit, with drag
concentrated near perigee where density is highest.
```

### Worked Example

```python
import numpy as np

mu = 3.986e14
R_e = 6.371e6

# Ranger 2 orbit
h_p = 150e3
h_a = 242e3
r_p = R_e + h_p
r_a = R_e + h_a
a = (r_p + r_a) / 2
v_p = np.sqrt(mu * (2/r_p - 1/a))

# Atmospheric density at 150 km (exponential model)
rho_150 = 2.8e-10  # kg/m^3

# Spacecraft parameters
m = 304.0     # kg
Cd = 2.2      # drag coefficient
A = 4.0       # cross-section area (m^2)

# Drag force at perigee
F_drag = 0.5 * rho_150 * v_p**2 * Cd * A
a_drag = F_drag / m

print("RANGER 2: ORBITAL DECAY")
print("=" * 55)
print(f"Perigee: {h_p/1e3:.0f} km")
print(f"Velocity at perigee: {v_p:.0f} m/s")
print(f"Atmospheric density: {rho_150:.2e} kg/m^3")
print(f"Drag force: {F_drag:.4f} N")
print(f"Drag deceleration: {a_drag:.6f} m/s^2")
print(f"  ({a_drag/9.81:.2e} g)")
print()

# Energy change per orbit
T = 2 * np.pi * np.sqrt(a**3 / mu)
# Simplified: drag acts mainly near perigee for ~100s
t_drag = 100  # seconds near perigee with significant drag
dv_per_orbit = a_drag * t_drag
print(f"Approx velocity loss per orbit: {dv_per_orbit:.2f} m/s")
print(f"Orbits per day: {86400/T:.1f}")
print(f"Velocity loss per day: {dv_per_orbit * 86400/T:.1f} m/s")
print(f"Altitude drop per day: ~20-40 km (perigee)")
print(f"")
print(f"At this rate, 150 km perigee drops to ~80 km")
print(f"(reentry threshold) in approximately 2-3 days.")
print(f"Ranger 2 reentered November 20 -- 2 days after launch.")
print(f"The orbit was its own death sentence.")
```

**Resonance statement:** *At 150 kilometers altitude, the atmosphere is nearly vacuum -- 10^-10 of sea-level density. But at 7,820 meters per second, even near-vacuum produces measurable drag. Each perigee passage costs a fraction of a meter per second. The orbit lowers. The perigee drops into denser air. The drag increases. The orbit lowers faster. The process is exponential at the end -- slow at first, then catastrophically fast as the spacecraft plunges into the dense lower atmosphere. Ranger 2's two-day lifetime was determined by the physics of atmospheric drag at 150 km altitude. The sword fern's five-century lifetime is determined by the biology of rhizome persistence in the moist understory. Both lifetimes are governed by the match between organism and environment. Move the fern to a desert and it dies in days. Move the spacecraft to deep space and it survives for decades. Ranger 2 was in the wrong environment, counting down.*

---

## Debate Questions

### Question 1: The Cost of Innovation

The parking orbit technique was an innovation that solved the launch window problem but created the restart problem. Should the Ranger program have used direct-ascent trajectories (like the Pioneers) instead of parking orbits? What is the engineering tradeoff between launch flexibility and restart reliability?

### Question 2: Parallel vs. Serial Strategies

The sword fern produces millions of spores per year with negligible success per spore. The Ranger program produced two missions per year with ~50% success per mission. Compare these strategies: which is more efficient? Which is more robust? Is there a mathematical optimum for the ratio of attempts to success probability?

### Question 3: Graceful Degradation vs. Catastrophic Failure

The sword fern degrades gracefully -- partial frond damage reduces but does not eliminate photosynthesis. The Agena gyroscope degrades catastrophically -- any reduction in spin rate below a threshold renders the instrument useless. Design systems that degrade gracefully. Are there spacecraft guidance systems that can tolerate partial gyroscope failure?

### Question 4: Asa Gray and Systematic Knowledge

Asa Gray built a classification system for American plants. His system persisted even when individual specimens were lost, damaged, or misidentified. Ranger 2's mission was lost, but the engineering knowledge it generated persisted in the Mariner and later Ranger designs. Is there a general principle about the persistence of systematic knowledge vs. individual instances?

---

*"Ranger 2 was stranded by a gyroscope the size of a hockey puck. The parking orbit that was supposed to last ninety minutes lasted two days -- not because anyone planned it that way, but because the door to deep space would not open. The math of being stuck is the math of a nearly circular orbit at 150 km: period 88 minutes, drag 10^-6 g, lifetime 48 hours. The sword fern has been in its orbit -- the understory circuit of photosynthesis, spore release, germination, growth, death, decomposition, nutrient return -- for millions of years. Its orbit does not decay. Its gyroscope is gravity, and gravity does not stop spinning."*
