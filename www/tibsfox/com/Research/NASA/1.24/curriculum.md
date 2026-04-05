# Mission 1.24 -- Mercury-Atlas 8 / Sigma 7: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Mercury-Atlas 8 / Sigma 7 (October 3, 1962) -- Six Orbits, Precision Engineering Flight
**Primary Departments:** Engineering, Physics, Mathematics
**Secondary Departments:** Ecology/Hydrology, Communications, History
**Organism:** Castor canadensis (North American Beaver)
**Bird:** Pheucticus melanocephalus (Black-headed Grosbeak, degree 24, Allen Stone)
**Dedication:** Philo T. Farnsworth (August 19, 1906)

---

## Department Deposits

### Engineering (Primary)

**Wing:** Spacecraft Systems Management and Resource Conservation
**Concept:** The engineering discipline of managing finite resources across a mission timeline -- fuel budgets, power budgets, thermal management, and the optimization of multi-mode control systems

**Deposit:** Mercury-Atlas 8 was fundamentally a resource management mission. Schirra's primary objective was to demonstrate that the Mercury spacecraft could operate for six orbits with fuel reserves sufficient for safe recovery:
- Total hydrogen peroxide: 60 pounds (27.2 kg) for attitude control thrusters
- Consumed over 6 orbits (9h 13m): approximately 13.3 pounds (22.2%)
- Remaining at splashdown: approximately 46.7 pounds (77.8%)
- Compare: Glenn consumed ~23 lb in 3 orbits (38.3%); Carpenter consumed ~50 lb in 3 orbits (83.3%)
- Schirra achieved twice the mission duration with one-quarter the fuel consumption of Carpenter
- Strategy: drifting flight (no active attitude control) for maximum periods, minimum impulse corrections, selective use of automatic vs. manual vs. fly-by-wire control modes
- The fuel management data directly enabled MA-9 (Faith 7) -- Cooper's 34-hour, 22-orbit mission

This deposit feeds into every subsequent mission requiring multi-day resource management: Gemini endurance flights, Apollo translunar coast, ISS long-duration operations. The principle is universal: finite resources, extended timeline, disciplined consumption.

### Physics (Primary)

**Wing:** Orbital Mechanics and Reentry Precision
**Concept:** The physics of predicting where a spacecraft will land based on retrofire parameters -- the sensitivity of landing position to retrofire timing, attitude, and impulse magnitude

**Deposit:** Sigma 7's 4.5-nautical-mile landing accuracy was the most precise of any Mercury mission:
- Retrofire parameters: three solid retrorockets, each producing ~4,450 N for ~10 seconds, firing in sequence at 5-second intervals
- Total delta-v: approximately 167 m/s retrograde
- Retrofire attitude: pitch angle controlling the trajectory entry angle into the atmosphere
- A 1-degree error in retrofire pitch angle shifts the landing point by approximately 15-30 km
- A 1-second error in retrofire timing shifts the landing point by approximately 7-8 km (spacecraft moving at ~7.8 km/s)
- Schirra's landing error of 4.5 nm (~8.3 km) implies combined retrofire errors of less than 1 degree in attitude and less than 1 second in timing
- The ballistic coefficient of the Mercury capsule (non-lifting reentry) means landing position is almost entirely determined by the retrofire conditions

### Mathematics (Primary)

**Wing:** Optimization Under Constraints
**Concept:** The mathematics of minimizing resource consumption while meeting mission requirements -- constrained optimization with inequality constraints

**Deposit:** Schirra's fuel management is a solved optimization problem:
- Objective: minimize total fuel consumption C = integral(0 to T, c(t) dt)
- Constraints: attitude must be within tolerance for communications passes, retrofire, and experiments
- Control variable: choice of control mode (drift, auto, manual, FBW) at each time t
- Each mode has a characteristic consumption rate: drift ≈ 0, auto ≈ 0.8 lb/hr, manual ≈ 1.2 lb/hr (when actively correcting), FBW ≈ variable
- Solution: drift everywhere possible, activate control only when required, use minimum-impulse corrections
- This is a continuous-time optimal control problem solvable by Pontryagin's maximum principle or, in practice, by good engineering judgment -- which is what Schirra applied

### Ecology/Hydrology (Secondary)

**Wing:** Beaver Ecosystem Engineering
**Concept:** How Castor canadensis reshapes watersheds through dam construction, creating complex aquatic habitats from simple stream channels

**Deposit:** The beaver-mission pairing operates on multiple engineering levels:
- Beaver dam construction: site selection, foundation, structure, waterproofing, maintenance -- a complete engineering workflow
- Hydrological transformation: stream → pond → wetland → complex riparian ecosystem
- Biodiversity amplification: 150+ species benefit from beaver-created habitats in the PNW
- Resource management: beavers harvest selectively, cache food for winter, maintain dams continuously
- The parallel: Schirra's flight was ecosystem engineering for NASA. The data from Sigma 7 created the habitat (engineering confidence) that supported species (future missions) that could not exist without the dam (the textbook flight)

### Communications (Secondary)

**Wing:** The Mercury Tracking Network
**Concept:** The worldwide ground station network that maintained contact with Mercury spacecraft -- the first global real-time communication system for crewed spaceflight

**Deposit:** MA-8 used a network of 16 ground stations spanning the globe:
- Cape Canaveral, Bermuda, Canary Islands, Kano (Nigeria), Zanzibar, Indian Ocean ship, Muchea and Woomera (Australia), Canton Island, Hawaii, Guaymas (Mexico), California
- Each station had VHF and UHF voice, S-band telemetry, and C-band tracking radar
- Contact windows: typically 5-10 minutes per pass
- Between stations: no contact, pilot alone with spacecraft
- Schirra's communication discipline: brief, precise status reports, no extended discussion, information density per minute of contact time maximized

### History (Secondary)

**Wing:** Philo T. Farnsworth and the Invention of Electronic Television
**Concept:** The parallel between Farnsworth's systematic electronic scanning of images and Schirra's systematic scanning of spacecraft systems -- precision engineering applied to complex signals

**Deposit:** Farnsworth's connection to Sigma 7 runs through the concept of precision scanning:
- Television: scan an image line by line, 525 lines, 30 times per second. Every line must be precisely timed and positioned. Miss a line and the image tears.
- Sigma 7: scan spacecraft systems continuously for 9 hours. Every parameter must be within spec. Miss a trend and the system drifts.
- Both are monitoring systems that require disciplined, repetitive, precise observation
- Farnsworth was born August 19, 1906, in Utah -- a Western American inventor from the inland frontier
- The connection to Allen Stone (Chewelah, WA): both are from the rural inland West, both produce sophisticated art/engineering from modest origins

---

## TRY Sessions

### TRY 1: Calculate Mercury Fuel Budget Across All Six Flights

**Duration:** 30 minutes
**Difficulty:** Beginner
**Department:** Engineering / Mathematics

```python
import numpy as np

# Mercury orbital flight fuel data
flights = [
    ("MA-6 Friendship 7 (Glenn)", 3, 4.92, 23.0, 37.0, 61.7),
    ("MA-7 Aurora 7 (Carpenter)", 3, 4.93, 50.0, 10.0, 16.7),
    ("MA-8 Sigma 7 (Schirra)", 6, 9.22, 13.3, 46.7, 77.8),
    ("MA-9 Faith 7 (Cooper)", 22, 34.32, 42.0, 18.0, 30.0),
]

print("MERCURY ORBITAL FLIGHTS: FUEL MANAGEMENT COMPARISON")
print("=" * 85)
print(f"{'Mission':<35} {'Orbits':>6} {'Hours':>6} {'Used':>8} {'Left':>8} {'%Left':>6}")
print(f"{'':35} {'':>6} {'':>6} {'(lb)':>8} {'(lb)':>8} {'':>6}")
print("-" * 85)

for name, orbits, hours, used, left, pct in flights:
    rate = used / hours
    print(f"{name:<35} {orbits:>6} {hours:>6.1f} {used:>8.1f} {left:>8.1f} {pct:>5.1f}%"
          f"  ({rate:.2f} lb/hr)")

print()
print("KEY INSIGHT: Schirra flew TWICE as long as Glenn or Carpenter")
print("and used LESS fuel in total than either of them.")
print()
print("Fuel consumption rate (lb/hr):")
print("  Glenn:     4.67 lb/hr (nominal)")
print("  Carpenter: 10.14 lb/hr (DANGEROUS)")
print("  Schirra:   1.44 lb/hr (EXEMPLARY)")
print("  Cooper:    1.22 lb/hr (learned from Schirra)")
```

### TRY 2: Model Reentry Landing Accuracy

**Duration:** 45 minutes
**Difficulty:** Intermediate
**Department:** Physics / Mathematics

```python
import numpy as np

# Retrofire sensitivity analysis
v_orbit = 7800  # m/s orbital velocity
delta_v_retro = 167  # m/s retrofire delta-v

print("SIGMA 7 REENTRY ACCURACY ANALYSIS")
print("=" * 60)

# Timing error sensitivity
for dt in [0.5, 1.0, 2.0, 5.0]:
    dx = v_orbit * dt / 1000  # km
    print(f"  Retrofire timing error {dt:.1f}s → landing shift ~{dx:.1f} km")

print()
# Attitude error sensitivity
for da in [0.5, 1.0, 2.0, 5.0]:
    dx = delta_v_retro * np.sin(np.radians(da)) / np.cos(np.radians(da)) * 50
    print(f"  Retrofire attitude error {da:.1f}° → landing shift ~{dx:.0f} km")

print()
print(f"Schirra's actual landing error: ~8.3 km (4.5 nautical miles)")
print(f"Carpenter's landing error: ~402 km")
print(f"Glenn's landing error: ~64 km")
print()
print("Sigma 7 demonstrated retrofire accuracy within ~1 second")
print("and ~1 degree of the plan. Engineering precision.")
```

### TRY 3: Build a Beaver Dam in Miniature

**Duration:** 1 hour
**Difficulty:** Beginner
**Department:** Ecology / Engineering
**What You Need:** A shallow tray or baking pan, popsicle sticks, modeling clay, water, small rocks. Cost: ~$5.

Build a miniature beaver dam across a tray with a small water flow (tilt the tray slightly and pour water from one end). Use popsicle sticks as the structural framework, modeling clay as the mud waterproofing, and small rocks as the foundation. Observe:
1. Without waterproofing (clay), the water flows through the sticks -- the dam leaks
2. With clay on the upstream face, the water is impounded -- the dam works
3. If you make the dam too tall without thickening the base, it collapses under water pressure
4. The optimal dam is thick at the base, sealed on the upstream face, and slightly lower than the bank height

This is the same engineering that the beaver applies: foundation, structure, waterproofing, dimensional scaling. And it's the same engineering that Schirra applied: every system serving its function, no gaps in the procedure, the whole structure holding because each element is designed for its role.

---

## DIY Projects

### DIY 1: Arduino Fuel Gauge That Tracks Consumption Over Time

**Duration:** 3-4 hours
**Difficulty:** Intermediate
**Cost:** ~$25

Build an Arduino-based fuel gauge that simulates Mercury hydrogen peroxide consumption. A potentiometer represents mission elapsed time. The OLED display shows fuel remaining, current consumption rate, and projected fuel at splashdown. LED bar graph shows fuel level visually.

Three modes:
- "Carpenter mode": aggressive fuel consumption, bar drops rapidly, warning at orbit 2
- "Glenn mode": moderate consumption, bar drops steadily, comfortable at orbit 3
- "Schirra mode": conservative consumption, bar barely moves, 78% remaining at orbit 6

The student switches modes and watches the consequences unfold on the display. Resource management becomes tangible.

### DIY 2: Build a Model Beaver Dam That Actually Holds Water

**Duration:** 4-6 hours
**Difficulty:** Intermediate
**Cost:** ~$15

Using a large plastic storage container as the stream channel, natural sticks from the yard, modeling clay, and small rocks, build a functioning beaver dam. The test: pour a liter of water above the dam. Does the water level rise above the dam? Does it hold for 10 minutes? Does it leak slowly or catastrophically?

Score the dam on:
- Water retention (how much stays upstream after 10 minutes)
- Structural integrity (does it collapse under hydraulic pressure?)
- Overflow management (does the water go over the top cleanly or undermine the base?)
- Repair time (how quickly can you fix a leak?)

### DIY 3: Plant a Willow Cutting for Beaver Habitat

**Duration:** 30 minutes (planting) + years (growing)
**Difficulty:** Beginner
**Cost:** Free (with permission to cut a willow branch)

Cut a 30-cm section of live willow branch (any Salix species), push it 15 cm into moist soil near a stream bank, and water it. Willows root from cuttings readily. In 2-3 years, the cutting will be a multi-stemmed shrub. In 10 years, it will be a small tree. Willows are the beaver's preferred food and construction material. Planting willows along a stream is planting beaver infrastructure -- the raw material that a beaver needs to build a dam. If beavers are present in the watershed, they will find the willows.

---

*"Sigma 7 was a flight built the way a beaver builds a dam: every element functional, every resource conserved, every specification met. The drama was in the absence of drama. The engineering was in making engineering look boring. Wally Schirra and the beaver understand the same principle: if you build it right, maintain it carefully, and conserve your resources, the structure holds. The dam impounds the water. The water creates the habitat. The habitat sustains the ecosystem. The flight produced the data. The data created the confidence. The confidence sustained the program. Sigma 7 was NASA's beaver dam -- the structure that held everything else."*
