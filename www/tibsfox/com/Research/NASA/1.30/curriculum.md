# Mission 1.30 -- Ranger 5: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Ranger 5 (October 18, 1962) -- Solar Panel Failure, 725 km Lunar Miss, Heliocentric Orbit
**Primary Departments:** Electrical Engineering, Reliability Engineering, Ecology
**Secondary Departments:** Bryology, Ornithology, Music History, Power Systems
**Organism:** Hylocomium splendens (Stair-step moss)
**Bird:** Stelgidopteryx serripennis (Northern Rough-winged Swallow, degree 29)
**Dedication:** Chuck Berry (October 18, 1926)

---

## Department Deposits

### Electrical Engineering (Primary)

**Wing:** Spacecraft Power Systems and Single-Point Failure
**Concept:** Solar photovoltaic power generation, battery backup, power-switching redundancy, and the catastrophic consequences of single-point failures in power distribution

**Deposit:** Ranger 5's power system architecture — 8,680 solar cells on two wing panels generating 135 W, routed through power-switching electronics to the spacecraft bus or to charge the silver-zinc backup battery — contained a single-point failure in the power-switching path. When a short circuit developed in this path approximately 75 minutes after launch, the solar array output was severed from the bus. The isolation diodes prevented the battery from draining through the fault, but could not restore the solar connection. The battery became the sole power source, depleting in 8 hours 44 minutes. Modern spacecraft power systems address this with redundant switching paths, cross-strapped power buses, and autonomous load-shedding algorithms that prioritize critical systems when total power drops below nominal.

### Reliability Engineering (Primary)

**Wing:** Distributed Failure Analysis and Organizational Root Causes
**Concept:** When three identical spacecraft fail in three different ways, the root cause is organizational, not technical

**Deposit:** Rangers 3, 4, and 5 were virtually identical Block II spacecraft. Each failed differently: guidance error (Ranger 3), timer failure (Ranger 4), power short circuit (Ranger 5). The distributed failure pattern indicated systemic quality issues — inadequate environmental testing, poor configuration management, gold-plated diodes that flaked in vacuum, and schedule pressure overriding quality requirements. The fix was organizational (JPL reorganization, new QA mandates, congressional oversight) rather than technical (no single component redesign would have saved all three missions). This principle — that distributed failures indicate organizational problems — became a cornerstone of aerospace reliability engineering.

### Ecology (Primary)

**Wing:** Bryophyte Ecology and Desiccation Tolerance
**Concept:** How organisms without vascular systems survive power failure through molecular-level protection

**Deposit:** Hylocomium splendens (stair-step moss) survives complete desiccation through a suite of molecular protections: trehalose sugar accumulation (forms a glassy matrix around proteins), LEA proteins (prevent protein aggregation), antioxidant enzymes (scavenge free radicals during rehydration), and controlled cell wall collapse. These mechanisms are the biological equivalent of spacecraft safe-mode design. Modern spacecraft incorporate analogous strategies: non-volatile memory (preserves state through power loss), low-power sleep modes (minimizes drain during anomalies), and autonomous recovery sequences (restores operations when power returns).

---

## TRY Sessions

### TRY 1: Battery Life Calculator (30 minutes, Python or pencil)

**Department:** Electrical Engineering
**Concept:** Given battery capacity (Wh) and power draw (W), calculate operating time. Then explore what happens when you can shed load — turning off non-essential systems to extend battery life.

**Exercise:**
- Start with Ranger 5's numbers: 1,000 Wh, 110 W draw. Calculate battery life.
- Now implement load shedding: turn off the camera (30 W savings), turn off the spectrometer (15 W), turn off the radar altimeter (10 W). Recalculate battery life at each step.
- At what power draw does the battery last 64 hours (time to Moon)?
- What does the spacecraft give up at each shedding stage? What is the minimum viable mission?

### TRY 2: Moss Rehydration Timer (30 minutes, hands-on + observation)

**Department:** Ecology
**Concept:** Observe desiccation tolerance in real time. Collect a piece of dry moss from a trail edge or fallen log (any moss species — Hylocomium if available, but any pleurocarpous moss will demonstrate the principle). Time how long it takes to rehydrate in a dish of water. Observe the color change, the unfurling of fronds, and the return to apparent vitality.

### TRY 3: Failure Mode Taxonomy (45 minutes, Python + critical thinking)

**Department:** Reliability Engineering
**Concept:** Classify the six Ranger failures by subsystem, type, and severity. Identify the pattern: no subsystem fails twice across different missions. Draw the conclusion: the root cause is systemic, not component-specific.

---

## DIY Projects

### DIY 1: Solar Panel Power Monitor ($25)

**Materials:** Small solar panel (5V, 1W), Arduino Uno, INA219 current sensor, OLED display, breadboard
**Build:** Connect the solar panel through the INA219 to a small load (LED string). Display real-time voltage, current, and power on the OLED. Monitor power output over a day — watch it rise in morning, peak at noon, fall in evening. Shade the panel briefly to simulate Ranger 5's power failure. Observe how quickly the system goes dark.
**Builds toward:** Solar installation monitoring business, home energy consulting.

### DIY 2: Moss Terrarium with Humidity Monitor ($20)

**Materials:** Glass jar, moss collected locally (with permission), BME280 sensor, Arduino Nano, small fan
**Build:** Create a sealed moss terrarium. Monitor humidity with the sensor. Periodically open the jar and run the fan to reduce humidity. Watch the moss response on the sensor data. Re-seal and watch recovery. The moss's humidity-dependent activity mirrors Ranger 5's power-dependent operation.
**Builds toward:** Terrarium design business, environmental monitoring service.

### DIY 3: Radio AM Detector Stage ($12)

**Materials:** 1N34A germanium diode, 100pF capacitor, 47kΩ resistor, earphone, wire
**Build:** Simple envelope detector for AM radio signals. Connect to v1.29's AM detector output for the next stage in the radio receiver series. The detector strips the carrier and extracts the audio — the inverse of what Ranger 5's dead carrier provided: a signal without content becomes content without a carrier.
**Builds toward:** Radio repair and electronics education business.

---

## Community Business Pathways

- **Solar power monitoring:** The solar panel power monitor DIY project teaches real-time energy measurement — directly applicable to home solar installation consulting and monitoring services.
- **Environmental monitoring:** Moss terrarium + humidity monitoring introduces the sensor-data-collection skills applicable to indoor air quality consulting, greenhouse management, and environmental compliance monitoring.
- **Electronics repair:** The AM detector circuit continues the radio receiver series, building toward complete radio troubleshooting and repair skills applicable to a home electronics business.
- **Reliability consulting:** The failure mode taxonomy exercise teaches systematic failure analysis — applicable to quality assurance consulting for small manufacturers and service businesses.
