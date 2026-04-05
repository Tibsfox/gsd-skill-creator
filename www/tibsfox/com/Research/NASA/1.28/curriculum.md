# Mission 1.28 -- Ranger 3: College of Knowledge Curriculum

## Track 4: Department Mappings, TRY Sessions, DIY Projects, Fox Companies Pathways

**Mission:** Ranger 3 (January 26, 1962) -- First Block II Ranger, Guidance Error, Missed Moon by 36,793 km
**Primary Departments:** Aerospace Engineering, Control Systems, Lichenology
**Secondary Departments:** Physics, Mathematics, Aviation History, Ecology
**Organism:** Ramalina menziesii (lace lichen)
**Bird:** Tachycineta thalassina (Violet-green Swallow, degree 27, The Dynamics)
**Dedication:** Bessie Coleman (January 26, 1892)

---

## Department Deposits

### Aerospace Engineering (Primary)

**Wing:** Guidance and Navigation
**Concept:** Error propagation in guidance systems -- how component-level errors produce mission-level failures, and how midcourse correction budgets must be sized to worst-case scenarios

**Deposit:** Ranger 3 demonstrated the catastrophic potential of a single sign error in a guidance component. The booster autopilot's pitch-rate switching amplifier had an inverted polarity that passed component testing because the test checked magnitude but not sign. The error propagated through the flight trajectory: 375 m/s excess velocity at injection → 36,793 km miss at the Moon. The midcourse correction motor provided 34 m/s against a 375 m/s deviation -- 9% of the required correction. This deposit covers:
- Trajectory sensitivity analysis: ∂r/∂v ≈ 98 km/(m/s) for the Ranger 3 geometry
- Sign errors vs. magnitude errors in control systems (Layer 7 connection)
- Midcourse correction budget sizing: design to worst case, not typical case
- The dual-error phenomenon: autopilot sign inversion AND guidance computer error
- How Ranger 3's specific failure informed test procedure changes for all subsequent Atlas-Agena missions

### Control Systems (Primary)

**Wing:** Feedback Systems and Stability
**Concept:** Positive vs. negative feedback -- the sign of the feedback gain determines whether a system converges (stable) or diverges (unstable)

**Deposit:** Ranger 3's autopilot sign inversion is a textbook case of feedback polarity reversal. The switching amplifier was designed to provide negative feedback (rate damping), but the inverted sign converted it to positive feedback (rate amplification). In the time domain, negative feedback produces exponential convergence: error → 0. Positive feedback produces exponential divergence: error → infinity. The guidance computer's intervention prevented physical divergence (the vehicle did not tumble), but the interaction between the inverted autopilot and the corrective guidance commands produced the net velocity error. This deposit connects to the MCO Rule: all inter-system data must include explicit type, unit, and format metadata. The Mars Climate Orbiter (1999) failure -- pound-force vs. newtons -- is the same category of error applied to a different physical quantity.

### Lichenology (Primary)

**Wing:** Fog-Belt Ecology
**Concept:** Passive interception of diffuse resources -- how organisms optimize morphology for fog capture, and how threshold-dependent metabolisms create binary active/dormant states

**Deposit:** Ramalina menziesii's fog-capture strategy is a passive interception process that can be modeled quantitatively. The deposit covers:
- Fog capture rate as a function of projected area, wind speed, liquid water content, and capture efficiency
- Mesh morphology vs. solid plate: why holes in the net increase total capture
- Desiccation tolerance as a binary state function (active above 25% water content, dormant below)
- Lichen as indicator species: presence/absence maps fog frequency and air quality simultaneously
- Surface-area-to-volume optimization under structural constraints (maximize capture, minimize mass, survive wind)

---

## TRY Sessions

### TRY 1: Sign Error Simulator (30 minutes, Python or spreadsheet)

Build a simple feedback control system in Python (or a spreadsheet) with an adjustable gain K. Set K = -0.5 (negative feedback) and watch the error converge to zero over 10 iterations. Then flip the sign to K = +0.5 (positive feedback) and watch the error explode. Plot both on the same graph. The intersection of the two curves at step 0 is the moment of the sign inversion. Everything after that diverges. Discuss: at what step would you notice the error? At what step would it be too late to correct? For Ranger 3, the answer is: during the first stage burn (too late to correct by the time the error was detectable).

### TRY 2: Fog Net Water Harvester (45 minutes, outdoor activity)

Build a fog-catching net using a piece of mesh fabric (window screen, shade cloth, or cheesecloth) stretched on a frame. Set it up in a foggy or misty area (early morning, coastal, or after a humidifier). Collect water in a trough below the mesh. Measure the water collected per hour and the wind speed (estimate from tree motion or use a phone anemometer app). Calculate the capture efficiency by comparing actual water collected to theoretical maximum (projected area × wind speed × estimated humidity). Compare with Ramalina menziesii's estimated capture rate. Discuss: why is the mesh better than a solid sheet? Why does wind speed matter? What happens if there is no fog?

### TRY 3: Trajectory Sensitivity Calculator (30 minutes, Python)

Write a Python program that calculates miss distance at the Moon for a range of velocity errors (0 to 500 m/s) using the linear sensitivity model. Plot miss distance vs. velocity error. Mark Ranger 3's actual error (375 m/s) and the midcourse motor's maximum capability (50 m/s). Shade the region of errors that the midcourse motor can correct. Discuss: how large should the midcourse motor have been? What velocity error would produce a miss of exactly one Moon diameter (3,474 km)?

---

## DIY Projects

### DIY 1: Guidance Error LED Display ($12)

Build a circuit with two rows of LEDs representing the "planned trajectory" (green LEDs approaching a target, lighting sequentially) and the "actual trajectory" (red LEDs diverging from the target after a certain point). A single switch represents the sign inversion -- when flipped, the red LEDs activate instead of the green ones, and the trajectory diverges from the target. Use a 555 timer + CD4017 decade counter for the sequential lighting. The switch is the sign inversion: one position drives the counter forward (toward target); the other drives a second counter diverging.

### DIY 2: Fog Net for Your Garden ($8)

Build a larger fog-catching net using hardware store materials: a 1m × 1m frame of PVC pipe or dowels with shade cloth (30-50% shade rating) stretched across it. Mount it vertically, perpendicular to the prevailing morning breeze. Place a rain gutter or trough below to collect the water. Over a week, record daily water collection, morning visibility (as a fog indicator), and wind direction. Plot water collected vs. fog occurrence. The correlation is your lichen: water arrives only when the fog comes.

### DIY 3: Bessie Coleman Paper Airplane Challenge ($0)

Fold paper airplanes with a "guidance error" -- intentionally bend one wing slightly up and the other slightly down (creating asymmetric lift, analogous to the sign inversion). Launch and observe the trajectory. Then correct the error by making the wings symmetric. Measure the accuracy of both versions (distance from target). Discuss: Bessie Coleman's guidance error was not in her wings -- it was in the system that refused to let her fly. She corrected by changing the launch site (France instead of America). What is the analog of "changing the launch site" for a spacecraft?

---

## Community Business Pathways

### From Guidance Error Analysis to Quality Assurance

Ranger 3's failure was a quality assurance failure -- the component test procedure was incomplete. This connects to a business pathway:

**Learn:** Understand how small errors propagate into large failures (this mission's math and engineering deposits)

**Practice:** TRY Sessions 1 and 3 (sign error simulator, trajectory sensitivity calculator)

**Create:** Quality assurance and testing consulting for local small businesses. Every business has "sign inversions" -- processes that look correct in isolation but produce wrong results in context. A home-based QA consultant who can identify these systemic errors provides genuine value to small manufacturers, software shops, food producers, and any business where process errors accumulate.

**Contribute:** Partner with community colleges and trade schools to teach systematic error detection. The lesson from Ranger 3 is universal: test the right thing, not just the thing that is easy to test. This applies to plumbing (test for leaks AND direction of flow), electrical work (test for continuity AND polarity), food safety (test for temperature AND time), and software (test for correctness AND edge cases).

### From Fog Harvesting to Water Conservation

Ramalina menziesii's fog-capture strategy has direct analogs in community water conservation:

**Learn:** Understand passive water harvesting (this mission's organism and ecology deposits)

**Practice:** DIY Project 2 (fog net for your garden)

**Create:** Fog-net installation service for coastal communities. In the Pacific Northwest fog belt, fog nets can supplement garden irrigation without municipal water. A small business installing, maintaining, and optimizing fog nets for residential and community gardens provides a valuable service in areas with summer water restrictions. The lichen has been doing it for millions of years. The business just scales it up.

---

## Rosetta Stone Connections

| Source Domain | Target Domain | Translation |
|--------------|---------------|-------------|
| Guidance error (autopilot sign inversion) | R&B phase inversion (speaker wired backward) | Both: a single sign error destroys the system's intended output |
| Midcourse correction (insufficient delta-v) | Course correction in business (insufficient capital reserves) | Both: correction capability must be sized to worst case |
| Fog capture efficiency (mesh vs. solid) | Market outreach (targeted vs. broadcast) | Both: holes in the net increase capture by allowing flow-through |
| Lichen desiccation tolerance (binary state) | Business cash flow (above/below survival threshold) | Both: threshold-dependent systems are either active or dormant |
| Bessie Coleman's trajectory correction (change countries) | Business pivot (change markets when the current one excludes you) | Both: if the guidance system is broken, change the guidance system |
