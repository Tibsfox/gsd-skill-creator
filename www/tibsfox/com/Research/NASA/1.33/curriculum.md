# Mission 1.33 -- Ranger 6: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Ranger 6 (January 30, 1964) -- Perfect Trajectory, Dead Cameras
**Primary Departments:** Physics, Electrical Engineering, Spacecraft Design
**Secondary Departments:** Forestry/Ecology, Mathematics, History
**Organism:** Thuja plicata (Western Red Cedar)
**Bird:** Bombycilla garrulus (Bohemian Waxwing, degree 32, Luther Rabb)
**Dedication:** Mary Jackson (April 9, 1921 -- February 11, 2005)

---

## Department Deposits

### Physics (Primary)

**Wing:** Electromagnetic Transients and Paschen Breakdown
**Concept:** The physics of electrical arcing at intermediate pressures — the Paschen minimum that destroyed Ranger 6's cameras

**Deposit:** Ranger 6's camera failure is a textbook case of gas discharge physics. The cameras were destroyed by an electrical arc that occurred during a brief moment when three conditions coincided: (1) the camera power bus received transient energy from Atlas staging, (2) the residual atmosphere inside the launch shroud was at Paschen minimum pressure, and (3) the camera vidicon tubes contained electrode gaps operating at 10,000+ volts. Paschen's Law (V_breakdown = f(p × d)) describes a U-shaped curve: at high pressure, gas is hard to ionize; in hard vacuum, there is no gas to ionize; but at intermediate pressures (around 0.75 torr for air), the breakdown voltage reaches a minimum. Ranger 6's cameras were designed for the safety of hard vacuum. They experienced the danger of intermediate pressure.

This deposit connects to every mission involving high-voltage systems, plasma physics, spacecraft charging, and the design of systems that must transition through multiple environmental regimes.

### Electrical Engineering (Primary)

**Wing:** Electromagnetic Compatibility (EMC)
**Concept:** The design discipline of ensuring that electromagnetic transients from one system do not interfere with the operation of another

**Deposit:** The Ranger 6 camera failure is the founding case study of spacecraft EMC design. The electromagnetic transient from Atlas booster staging — pyrotechnic bolt firing, engine shutdown, explosive separation — coupled into the camera power bus through inadequately shielded wiring. The coupling path was characterized post-flight: structural grounds shared between the launch vehicle and spacecraft allowed the staging transient to propagate to the camera electronics. The corrective action included: (1) redesigned wiring harness with improved shielding, (2) isolation of the camera power bus from the spacecraft bus during ascent, (3) transient suppression on pyrotechnic circuits, and (4) new test protocols simulating the full ascent pressure profile. These measures became standard practice for all subsequent NASA spacecraft.

### Spacecraft Design (Primary)

**Wing:** Testing What You Fly, Flying What You Test
**Concept:** The principle that ground testing must replicate actual flight conditions, including transient and environmental conditions during configuration changes

**Deposit:** Ranger 6's cameras were tested in vacuum. They passed. They were tested with the spacecraft powered. They passed. But they were never tested while powered at Paschen minimum pressures — because the design assumed they would never be powered during that pressure regime. The failure mode existed in the gap between the test environment and the flight environment. The lesson: test the system in the conditions it will actually experience, including worst-case transient conditions during configuration changes. This principle — "test as you fly, fly as you test" — became a foundational maxim of spacecraft engineering after Ranger 6.

### Forestry / Ecology (Secondary)

**Wing:** Shade-Tolerant Species and Long-Term Forest Succession
**Concept:** Thuja plicata (Western Red Cedar) as the patient understory species that builds the forest's material culture

**Deposit:** Western red cedar's ecological strategy of shade tolerance and extreme longevity parallels Ranger 6's institutional contribution. The tree grows slowly in the shade of faster species, but its rot-resistant wood outlasts everything around it. A cedar nurse log persists for 300-500 years, supporting generations of seedlings that grow into the next forest. Ranger 6 "grew" in the shade of failure — six missions with zero science return — but its contribution (the failure analysis) outlasted its immediate outcome and supported the next generation of missions (Rangers 7-9, Surveyor, Apollo). The nurse log of failure analysis is the most durable product of the Ranger program.

### History (Secondary)

**Wing:** Invisible Structural Contributions
**Concept:** Mary Jackson and the unrecognized engineers who built NASA's foundations

**Deposit:** Mary Jackson's career — from human computer to aerospace engineer to diversity advocate — is a story of structural contributions that were invisible to the broader public for decades. Her engineering work on boundary layer analysis contributed to the design of vehicles that must transition through atmospheric pressure regimes — the same type of transition that destroyed Ranger 6's cameras. Jackson's work was recognized with NASA's headquarters building naming in 2020, fifty years after the bulk of her engineering career. Ranger 6 was recognized as a program-saving mission only in retrospect. Both Jackson and Ranger 6 did foundational work that was undervalued at the time and essential in hindsight.

---

## TRY Sessions & DIY Projects

### TRY 1: Paschen Breakdown Demonstration (30 min, Python)
Calculate and plot the Paschen breakdown curve for air. Identify the minimum. Mark the pressure range inside Ranger 6's launch shroud. Show that 10,000 V camera voltage far exceeds the breakdown threshold at Paschen minimum. Discuss: why was this not caught before flight?

### TRY 2: Targeting Accuracy Calculator (30 min, Python)
Given Earth-Moon distance and Ranger 6's miss distance of 32 km, calculate the angular targeting accuracy. Express it in arcseconds, as a fraction, and as a real-world analogy (e.g., hitting a dinner plate from 3.6 km). Compare with Rangers 3-5 targeting accuracy.

### TRY 3: Ranger Program Convergence Chart (45 min, Python + matplotlib)
Plot the nine Ranger missions on a timeline showing: (1) which reached the Moon, (2) which returned science data, (3) targeting accuracy for each. Identify the pattern: six failures, then three successes. Compare to the Pioneer convergence from mission 1.5. Is the pattern similar? Different?

### TRY 4: Zero-Information Paradox Analysis (30 min, discussion/Python)
Calculate Shannon information of a binary outcome (camera works / camera fails) for Ranger 6. Argue that the "zero-data" mission returned the highest-value information in the program. Build a simple model showing that failure analysis information content can exceed imaging data information content.

### DIY 1: EMC Shielding Demonstration ($10)
Build a simple high-voltage circuit (piezo igniter) and demonstrate arcing at different pressures using a jar with a valve. At sea level pressure: no arc across a 1-cm gap. Remove some air with a syringe: arc! Full vacuum (hard to achieve at home): no arc. The Paschen curve, demonstrated on a kitchen table.

### DIY 2: Radio Interference Filter ($12)
Build a simple LC low-pass filter that blocks high-frequency transients while passing DC power — the basic principle behind the camera power bus isolation that fixed Ranger 6's problem. Demonstrate with an oscilloscope (or LED brightness indicator) that the filter blocks spike transients from a relay coil while passing steady power.

### DIY 3: Cedar Bark Fiber Experiment (Free)
Collect a piece of naturally shed western red cedar bark (abundant in PNW forests and parks — never strip bark from a living tree). Separate the fibrous inner bark. Twist it into cordage. Test the strength. The same material Coast Salish peoples used for weaving. The Tree of Life, demonstrated in your hands.
