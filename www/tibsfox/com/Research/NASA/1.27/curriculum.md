# Mission 1.27 -- Ranger 2: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Ranger 2 (November 18, 1961) -- Stranded in Parking Orbit, Agena B Gyroscope Failure
**Primary Departments:** Physics, Engineering, Ecology
**Secondary Departments:** Mathematics, History, Communications
**Organism:** Polystichum munitum (Western sword fern)
**Bird:** Progne subis (Purple Martin, degree 26, Shaina Shepherd)
**Dedication:** Asa Gray (November 18, 1810)

---

## Department Deposits

### Physics (Primary)

**Wing:** Gyroscope Physics and Angular Momentum
**Concept:** How a spinning mass resists changes in orientation, and why the failure of a single gyroscope can doom a spacecraft

**Deposit:** Ranger 2's Agena B upper stage was stranded in parking orbit because a single roll-control gyroscope stopped spinning. The physics of this failure is the physics of angular momentum:
- Angular momentum: L = I * omega. A spinning rotor with moment of inertia I and angular velocity omega has angular momentum L along the spin axis
- Precession: When an external torque tau is applied perpendicular to L, the gyroscope precesses (rotates about the torque axis) at rate omega_p = tau / L, rather than tilting directly. This counterintuitive behavior makes gyroscopes useful as attitude references
- When the rotor stops spinning: omega → 0, L → 0, no resistance to rotation. The Agena B loses its roll reference. Without roll knowledge, the guidance cannot align for the restart burn
- The three-axis reference frame: three orthogonal gyroscopes define a stable platform in inertial space. Remove one axis and the platform is undefined in that dimension
- Ranger 2's specific failure: the roll gyro ceased operation during the parking orbit coast phase (~88 minutes). Probable cause: bearing lubrication failure in vacuum/thermal cycling environment
- This deposited forward into every subsequent spacecraft guidance system: redundant gyroscopes, hemispherical resonator gyros, ring laser gyros, and fiber optic gyros all evolved from the lesson that single-point failures in attitude reference are mission-killing

### Engineering (Primary)

**Wing:** Parking Orbit Technique and Two-Burn Mission Profiles
**Concept:** The innovation of parking orbits -- how they solved the launch window problem and created the restart problem

**Deposit:** Ranger 2 used the parking orbit technique that was new for American deep space missions in 1961:
- Direct ascent (Pioneer approach): single continuous burn from launch to injection. Simple but constraining -- launch windows measured in seconds
- Two-burn parking orbit (Ranger approach): first burn to low Earth orbit, coast to optimal injection point, second burn to escape/deep-space trajectory. Broader launch windows (minutes instead of seconds)
- The tradeoff: restart reliability. The Agena had to work twice. The second burn occurred after 88 minutes in microgravity, with propellants redistributed, temperatures changed, and mechanical components stressed by vacuum exposure
- Ranger 2's parking orbit: 150 x 242 km, 33.3° inclination, 88.3 minute period
- The Agena B was an upgrade from the Agena A used on Ranger 1, with improved restart capability -- but the roll gyroscope failure was a new failure mode not addressed by the upgrade
- The parking orbit technique became standard for all subsequent deep-space missions: every Apollo lunar injection, every Mariner departure, every Voyager launch used a parking orbit. Ranger 1 and 2 were the painful first demonstrations

### Ecology (Primary)

**Wing:** Understory Fern Ecology
**Concept:** Polystichum munitum as the dominant understory constant of the PNW forest -- the organism that holds the ground

**Deposit:** Western sword fern pairs with Ranger 2 through multiple resonance axes:
- Evergreen persistence: sword fern maintains its fronds year-round, photosynthesizing through the dark PNW winter. This constancy in adverse conditions parallels the Ranger program's persistence through consecutive failures
- Parallel redundancy: a single plant produces millions of spores per year. Individual success rate per spore: ~10^-6. But millions of attempts yield enough successes to make the species dominant. Compare to the Ranger program's serial vulnerability: one gyroscope fails, one mission lost
- Wrong-environment vulnerability: sword fern is adapted for moist shade. In full sun or dry conditions, it wilts rapidly. Ranger 2 was adapted for deep space. In the parking orbit, it exhausted its resources (nitrogen) in hours. Both organisms are exquisitely adapted to specific environments and helpless in the wrong one
- Soil stabilization: sword fern roots bind the upper soil layer, preventing erosion. This foundation-layer function parallels Ranger 2's role as an engineering foundation -- validating systems (attitude control, instruments) that subsequent missions built upon
- Frond production rate: 5-15 new fronds per plant per year, with each frond lasting 1-3 years. The plant accumulates 75-100 fronds, creating a dense canopy over the forest floor. Each frond is an independent photosynthetic unit -- damage to one does not kill the plant

---

## TRY Sessions

### TRY 1: Calculate How Long a Spacecraft Survives in a Parking Orbit

**Duration:** 30 minutes
**Difficulty:** Beginner-Intermediate
**Department:** Physics / Orbital Mechanics
**What You Need:** Python 3.8+ or scientific calculator

**What You'll Learn:**
How atmospheric drag at low altitudes limits the lifetime of a spacecraft in a parking orbit, and why Ranger 2 only survived two days.

**The Exercise:**

**Step 1: Understand orbital decay**

```python
import numpy as np

# Atmospheric density model (exponential)
def rho(h_km):
    """Approximate atmospheric density at altitude h (km)"""
    # Scale height model
    if h_km < 200:
        rho0 = 2.789e-10  # kg/m^3 at 150 km
        H = 22.0           # scale height (km)
        return rho0 * np.exp(-(h_km - 150) / H)
    else:
        rho0 = 3.725e-12  # kg/m^3 at 300 km
        H = 29.7
        return rho0 * np.exp(-(h_km - 300) / H)

# Ranger 2 parameters
m = 304            # mass (kg)
Cd = 2.2           # drag coefficient
A = 4.0            # cross-sectional area (m^2)
h_perigee = 150    # perigee altitude (km)

# Atmospheric density at perigee
rho_p = rho(h_perigee)
print(f"Density at {h_perigee} km: {rho_p:.3e} kg/m^3")
print(f"That's about {rho_p/1.225:.1e} times sea level density")
print(f"Incredibly thin. But at 7.8 km/s, it adds up.")
```

**Step 2: Estimate orbital lifetime**

```python
# Simplified King-Hele orbital decay formula
mu = 3.986e14
R_e = 6.371e6
r_p = R_e + h_perigee * 1e3
v_p = np.sqrt(mu * (2/r_p - 2/(r_p + R_e + 242e3)))  # vis-viva at perigee

# Drag deceleration at perigee
a_drag = 0.5 * rho_p * v_p**2 * Cd * A / m
print(f"\nDrag deceleration at perigee: {a_drag:.4f} m/s^2")
print(f"That's tiny. But it acts every orbit at perigee.")

# Energy loss per orbit (approximate)
# delta_a per orbit ~ -2*pi*a^2 * rho_p * Cd * A / m (for nearly circular)
a = (r_p + R_e + 242e3) / 2
delta_a_per_orbit = -2 * np.pi * a**2 * rho_p * Cd * A / m
T_orbit = 88.3 * 60  # seconds
delta_a_per_day = delta_a_per_orbit * (86400 / T_orbit)

print(f"\nSemi-major axis decrease per orbit: {delta_a_per_orbit:.0f} m")
print(f"Semi-major axis decrease per day:   {delta_a_per_day/1000:.1f} km")

# Rough lifetime estimate
margin_km = (242 - 150) / 2  # km above minimum viable orbit
lifetime_days = margin_km / abs(delta_a_per_day/1000)
print(f"\nEstimated orbital lifetime: ~{lifetime_days:.0f} days")
print(f"Actual Ranger 2 lifetime: ~2 days (reentered Nov 20)")
```

**What Just Happened:**
You calculated why Ranger 2 only survived two days in its parking orbit. At 150 km perigee, the atmospheric density is vanishingly small by terrestrial standards, but at orbital velocity (7.8 km/s), even trace atmosphere creates drag that lowers the orbit on every pass. The spacecraft was never meant to stay here -- it was supposed to leave within one orbit. When the Agena couldn't restart, Ranger 2 was trapped in an orbit with a two-day expiration date.

---

### TRY 2: Build a Gyroscope from a Bicycle Wheel

**Duration:** 20 minutes
**Difficulty:** Beginner
**Department:** Physics
**What You Need:** A bicycle wheel (any size), string or rope. Cost: $0 if you have a bike.

**What You'll Learn:**
How angular momentum resists changes in orientation -- the same physics that the Agena B gyroscope was supposed to provide.

**The Exercise:**

1. Remove a wheel from a bicycle (or use a spare)
2. Hold the wheel by its axle, one hand on each end
3. Have someone spin the wheel fast (or push the tire with your hand)
4. While the wheel is spinning, try to tilt the axle
5. **Feel the resistance.** The spinning wheel pushes back against your attempt to change its orientation. This is angular momentum resisting torque -- precession.
6. Now try to turn (rotate) while holding the spinning wheel. The wheel will try to tilt you sideways -- the precession torque is perpendicular to both the spin axis and your applied torque.
7. Let the wheel slow down. As the spin rate decreases, the resistance decreases. When the wheel stops, there is zero resistance -- you can tilt the axle freely.

**Step 8: The Ranger 2 connection**

When the wheel was spinning fast, you couldn't easily change its orientation. That's what the Agena B gyroscope was supposed to do: maintain a fixed roll reference. When the gyroscope stopped spinning (like when you let the bicycle wheel slow to a stop), the reference disappeared. The Agena couldn't tell which way was "roll zero" and couldn't align for the restart burn. One stopped gyroscope → one lost mission.

---

### TRY 3: Find and Identify Sword Fern in Your Neighborhood

**Duration:** 15-30 minutes
**Difficulty:** Beginner
**Department:** Ecology
**What You Need:** Your eyes, outdoors access. Cost: $0.

**What You'll Learn:**
How to identify the most common understory plant in the Pacific Northwest, and why it's everywhere.

**The Exercise:**

If you're in the PNW (western WA, OR, or BC), step outside and walk to the nearest patch of forest, park with trees, or even a shaded garden bed.

```
SWORD FERN IDENTIFICATION:

FRONDS:
  - 50-180 cm long (2-6 feet)
  - Once-pinnate: single row of leaflets (pinnae) on each side
  - Each pinna has a small "ear" (auricle) at the base
  - Dark green, leathery, slightly glossy
  - Arranged in a circular rosette from a central crown

SORI (undersurface):
  - Round dots in two rows on each pinna
  - Covered by round, umbrella-shaped indusia when immature
  - Visible without magnification on mature fronds

GROWTH FORM:
  - Dense, arching rosette
  - 75-100 fronds per mature plant
  - Crown at or just above ground level
  - Old fronds at periphery, new fronds in center

CONFUSION SPECIES:
  - Deer fern (Blechnum spicant): narrower fronds, ladder-like pinnae
  - Lady fern (Athyrium filix-femina): twice-pinnate (divided twice)
  - Sword fern is ONCE-pinnate with the auricle -- that's the key
```

When you find one, you've found the Ranger 2 organism. It's been holding this ground for millions of years. It'll be here long after the last satellite decays.

---

## DIY Projects

### DIY 1: Arduino Gyroscope Demonstration

**Duration:** 2-3 hours
**Difficulty:** Beginner-Intermediate
**Department:** Physics / Engineering
**Cost:** ~$15

**Materials:**
- Arduino Nano ($8)
- MPU-6050 gyroscope/accelerometer module ($3)
- SSD1306 OLED display ($8)
- Breadboard and wires ($5)

**What You Build:**
A real-time gyroscope display that shows angular velocity on all three axes. Mount the MPU-6050 on a platform, spin it, and watch the OLED display the angular rate. Then stop the spin and watch the rate drop to zero -- the moment the "gyroscope reference" is lost. The display shows "ATTITUDE REFERENCE: ACTIVE" when spinning and "ATTITUDE REFERENCE: LOST" when stopped, mimicking Ranger 2's guidance system state.

### DIY 2: Sword Fern Spore Print

**Duration:** 1-2 hours (setup) + overnight (collection)
**Difficulty:** Beginner
**Department:** Ecology
**Cost:** $0

**Materials:**
- One sword fern frond with mature sori (brown, not green)
- One sheet of white paper
- A book or weight
- Patience

**What You Build:**
Place the frond sori-side-down on white paper. Cover with another sheet of paper and weight. Leave overnight. The spores will fall onto the white paper, creating a pattern of dots that maps the sori arrangement on the pinna. The pattern is beautiful -- geometric, precise, millions of individual spores creating a visible deposit. This is the fern's "broadcast" -- the millions of tiny propagules it launches every year. Each dot on your spore print represents thousands of spores, each one a potential new plant.

### DIY 3: Build a Parking Orbit Simulator with LEDs

**Duration:** 2-3 hours
**Difficulty:** Intermediate
**Department:** Engineering / Physics
**Cost:** ~$12

**Materials:**
- Arduino Nano ($8)
- Ring of 12 WS2812B NeoPixel LEDs ($4)
- Push button ($0.50)
- Breadboard and wires

**What You Build:**
A circular LED display simulating a spacecraft in parking orbit. One LED (blue) represents the Agena+Ranger orbiting Earth. It circles the ring every 2 seconds (representing 88 minutes). At the correct position (the injection point), pressing the button simulates the Agena restart. If the "gyroscope" is working (random success, ~50% probability per orbit), the LED turns gold and spirals outward off the ring (escape to deep space). If the gyroscope has failed (LED turns red), pressing the button does nothing -- the spacecraft stays in the ring, circling until it fades to dark (reentry). The simulation teaches the parking orbit concept, the restart requirement, and the consequence of gyroscope failure.

---

*"Ranger 2 lasted two days in an orbit designed for ninety minutes. The sword fern lasts five hundred years on a forest floor designed for eternity. Both persist as long as their environment permits. The gyroscope that stopped spinning -- a rotor the size of a coin, a bearing thinner than a hair -- determined the difference between five months of deep-space science and forty-eight hours of atmospheric plasma. The fern does not depend on a single rotor. It depends on millions of spores, dozens of fronds, and the patience of centuries. Asa Gray, born November 18, 1810, classified the plants that persist. Ranger 2, launched November 18, 1961, became one of the things that did not."*
