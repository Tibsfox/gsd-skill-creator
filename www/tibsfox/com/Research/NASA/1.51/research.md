# NASA 1.51 -- Surveyor 2: The Midcourse Correction

## Mission Overview

**Mission:** Surveyor 2
**Launch:** September 20, 1966, 12:32:00 UTC, Launch Complex 36A, Cape Kennedy
**Lunar Impact:** September 23, 1966, ~03:18 UTC, southeast of Copernicus crater (~5.5 deg N, 12 deg W)
**Duration:** ~63 hours (launch to impact)
**Crew:** None -- robotic lunar lander
**Launch Vehicle:** Atlas-Centaur (Atlas SLV-3C / Centaur D, AC-7)
**Spacecraft Mass:** 292.0 kg (at launch), 995.2 kg wet (with retrorocket)
**Planned Landing Site:** Sinus Medii (Central Bay), ~0 deg N, 1.5 deg W
**Result:** FAILURE -- loss of spacecraft

## The Mission That Failed

Surveyor 2 is the first failure in the NASA Mission Series. It deserves the same depth and rigor as the successes, because failure in spaceflight is not the absence of data -- it is data of a different kind. What went wrong, why it went wrong, and what it meant for the missions that followed: these are the questions that make failure as valuable as success to the engineers who must build the next spacecraft.

The Surveyor program was JPL's answer to a question that had to be answered before Apollo could land on the Moon: what is the lunar surface like? In 1966, there were serious scientific arguments that the surface might be covered in meters-deep dust that would swallow a landing spacecraft. Thomas Gold of Cornell had proposed the "fairy castle" hypothesis -- that micrometeorite bombardment over billions of years had created a deep layer of extremely fine, loosely packed dust. If Gold was right, the Lunar Module would sink. The Apollo astronauts would not walk on the Moon. They would drown in it.

Surveyor 1, launched May 30, 1966, answered the question definitively by landing softly in Oceanus Procellarum and not sinking. The surface was firm. The bearing strength was adequate. The 292-kilogram spacecraft sat on its three landing legs and did not sink more than a few centimeters. The first 11,240 photographs showed a surface of fine-grained material -- regolith -- firm enough to support a spacecraft and, by extension, firm enough to support astronauts. The fairy castle hypothesis was dead. Apollo could land.

Surveyor 2 was supposed to extend this knowledge to a different site. Sinus Medii, near the center of the lunar nearside, was a potential Apollo landing zone. The terrain was different from Oceanus Procellarum -- higher elevation, closer to the highlands, potentially rockier. The mission objectives were identical to Surveyor 1's: soft landing, surface photography, surface bearing strength measurement, thermal environment characterization. But the landing site was more challenging, and the approach trajectory required a midcourse correction to achieve the precision needed for a safe landing in a more constrained target area.

## The Atlas-Centaur Launch Vehicle

The Atlas-Centaur was one of the most remarkable launch vehicles of the 1960s, and its history is inseparable from the Surveyor program's ambitions and limitations.

The Atlas booster stage was a "stage-and-a-half" design derived from the Atlas intercontinental ballistic missile. It used three engines -- two booster engines (Rocketdyne MA-3) that were jettisoned during ascent and a sustainer engine (Rocketdyne LR-105) that continued to burnout. The airframe was a "balloon tank" -- stainless steel so thin (0.01 inches, 0.25 mm) that the rocket would collapse under its own weight if not pressurized. The structural integrity of the Atlas came from internal pressure, not from the strength of the metal. This was a brilliant mass-saving design and a terrifying operational constraint: a depressurization event on the pad would destroy the vehicle.

The Centaur upper stage was the world's first production rocket stage to burn liquid hydrogen and liquid oxygen. The specific impulse -- a measure of propellant efficiency -- was 444 seconds, roughly 30% better than the kerosene-burning stages it replaced. The Centaur's high performance made the Surveyor mission possible: the mass margins were so tight that only liquid hydrogen's superior energy could deliver a 292-kilogram spacecraft to the Moon with enough fuel remaining for the terminal descent.

But liquid hydrogen was extraordinarily difficult to handle. It boils at minus 253 degrees Celsius, just 20 degrees above absolute zero. The insulation requirements were extreme. Hydrogen's low density (71 kg/m3, versus 820 kg/m3 for kerosene) meant the tanks were enormous. The RL-10 engines that powered the Centaur -- built by Pratt & Whitney -- were precision instruments, each producing 66.7 kN of thrust, each requiring hydrogen to be fed at exactly the right pressure, temperature, and flow rate. The development of the Centaur had been so troubled that NASA transferred management from MSFC to Lewis Research Center (now Glenn Research Center) in 1962, and the program nearly died several times before achieving its first successful flight in 1963.

For Surveyor 2, the Atlas-Centaur performed flawlessly. AC-7, the seventh Centaur flight, launched from LC-36A at 12:32 UTC on September 20, 1966. The Atlas booster stage ignited, the booster engines were jettisoned on schedule, the sustainer burned to cutoff, the Centaur stage separated and ignited, and the parking orbit was achieved. The Centaur reignited for the translunar injection burn, and Surveyor 2 was on its way to the Moon. The launch vehicle that had nearly killed the program through years of development failures performed its job without error. The failure came later, and it came from the spacecraft, not the rocket.

## The Surveyor Spacecraft Design

The Surveyor spacecraft was a three-legged, open-frame structure built by Hughes Aircraft Company under JPL contract. The basic architecture was triangular: three aluminum landing legs with shock absorbers and crushable footpads, connected by a triangular frame that supported the solar panel, the high-gain antenna, the survey television camera, and the spacecraft electronics.

The propulsion system was the spacecraft's defining engineering challenge. It consisted of two elements:

**1. The solid-fuel retrorocket (Thiokol TE-364-2):** A single large solid-fuel motor mounted at the center of the spacecraft's underside. This motor provided the main deceleration burn during terminal descent, reducing the spacecraft's velocity from approximately 2,600 m/s (approach velocity) to approximately 110 m/s (post-retro velocity). The retrorocket fired for approximately 40 seconds and then was jettisoned. It was not throttleable and could not be restarted -- a single-use, all-or-nothing device. The timing of its ignition was critical: too early and the spacecraft would still be moving too fast at the surface; too late and the retro burn would be wasted on empty space.

**2. The vernier engines (Thiokol TD-339):** Three small liquid-propellant engines, each producing approximately 130 newtons of thrust at full throttle, continuously throttleable from 30% to 100%. The vernier engines burned hydrazine (N2H4) as fuel and nitrogen tetroxide (N2O4) as oxidizer -- a hypergolic combination that ignites spontaneously on contact, requiring no ignition system. The verniers served three critical functions:

- **Midcourse correction:** Adjusting the translunar trajectory after the Centaur injection burn, to redirect the spacecraft toward the precise landing site.
- **Terminal descent:** After the retrorocket was jettisoned, the verniers provided the final deceleration from ~110 m/s to zero, and the precise attitude control needed for a vertical soft landing.
- **Attitude control during burns:** By differential throttling -- varying the thrust of each engine independently -- the verniers could pitch, roll, and yaw the spacecraft, providing three-axis attitude control during any maneuver.

The three vernier engines were arranged 120 degrees apart on the spacecraft's underside, tilted slightly outward from vertical. Engine designations: vernier 1, vernier 2, and vernier 3. Each engine was a self-contained unit with its own propellant valves, thrust chamber, and throttle actuator. The propellant was stored in a central tank system and distributed to all three engines through a common manifold.

This is the architecture that failed.

## The Midcourse Correction Failure

Surveyor 2's translunar coast was nominal for the first 16 hours. The spacecraft separated from the Centaur at 13:04 UTC on September 20, established the correct cruise attitude (solar panel pointed at the Sun, high-gain antenna pointed at Earth), and began transmitting engineering telemetry at 4,400 bits per second. The Deep Space Network stations at Goldstone (California), Madrid (Spain), and Canberra (Australia) tracked the spacecraft continuously. The trajectory data indicated that a midcourse correction was needed -- the spacecraft was off the nominal trajectory by enough that, without correction, it would either miss the Moon or impact far from the intended landing site.

At approximately T+16h11m (around 04:43 UTC, September 21), JPL transmitted the commands for midcourse correction maneuver. The sequence was:

1. Attitude adjustment: reorient the spacecraft so the vernier engines point in the correct direction for the correction burn.
2. Vernier engine ignition: all three engines fire simultaneously.
3. Burn for the calculated duration to achieve the required delta-v.
4. Return to cruise attitude.

Steps 1 was completed normally. The spacecraft reoriented. Then step 2 was commanded. Vernier engines 1 and 2 ignited normally. Vernier engine 3 did not ignite.

The effect was immediate. Two engines firing on opposite sides of the spacecraft with the third silent created a net torque around the spacecraft's center of mass. The spacecraft began to rotate. The attitude control system attempted to compensate by throttling the active engines, but the asymmetry was too large. The rotation rate increased. Within seconds, the spacecraft was tumbling.

The tumble had cascading effects:

- **Antenna orientation degraded:** The high-gain antenna swept past Earth periodically as the spacecraft rotated, producing intermittent telemetry rather than continuous data. Each contact window lasted only seconds before the antenna swept away.
- **Solar panel orientation degraded:** The solar panel was no longer pointed at the Sun, reducing electrical power. Battery reserves were limited.
- **Thermal control disrupted:** The spacecraft's thermal design assumed a stable attitude with predictable sun exposure. The tumble exposed different surfaces to solar heating unpredictably, potentially causing temperature excursions in sensitive electronics.
- **Further commands difficult to execute:** Any command to fire the verniers again risked making the tumble worse, depending on the spacecraft's orientation at the moment of ignition.

JPL attempted to recover. Multiple command sequences were transmitted over the next several hours:

- Commands to fire all three vernier engines simultaneously, hoping that the third engine might respond to a second ignition attempt.
- Commands to shut down all engines and use the cold-gas attitude control jets to stabilize the tumble before trying again.
- Commands to fire individual engines in timed sequences calibrated to the tumble period, attempting to de-spin the spacecraft.

None succeeded. Vernier engine 3 never responded to any subsequent ignition command. The tumble continued. The telemetry became increasingly intermittent as the battery depleted and the antenna contacts grew shorter.

## Lunar Impact

On September 23, 1966, approximately 63 hours after launch, Surveyor 2 impacted the lunar surface southeast of Copernicus crater at approximately 5.5 degrees North latitude, 12 degrees West longitude. The impact velocity was approximately 2,700 m/s (6,000 miles per hour). At that velocity, the spacecraft was completely destroyed. No useful data was returned from the lunar surface.

The impact site was far from the intended landing site of Sinus Medii. Without the midcourse correction, the spacecraft followed a ballistic trajectory determined by the Centaur injection burn and the Moon's gravity, arriving at whatever point the uncorrected trajectory intersected the lunar surface. The spacecraft's final moments were unobserved -- the last telemetry was received hours before impact as the battery expired.

## Failure Investigation

The Surveyor 2 failure investigation was conducted by JPL and Hughes Aircraft Company. The conclusions were necessarily limited by the total loss of the spacecraft -- there was no wreckage to examine, no black box to recover, no physical evidence beyond the telemetry recorded before the tumble.

The most probable cause identified was a failure in the fuel supply system of vernier engine 3. Two specific mechanisms were considered most likely:

**1. Propellant valve failure:** The fuel valve or oxidizer valve of engine 3 failed to open when commanded. This could have resulted from a manufacturing defect, contamination in the valve mechanism, or thermal/mechanical damage during launch or the translunar coast.

**2. Propellant line blockage:** A blockage in the fuel line or oxidizer line feeding engine 3, preventing propellant from reaching the combustion chamber. Possible sources: manufacturing debris, propellant contamination, or a frozen slug of propellant at a cold point in the line (although the hypergolic propellants have relatively low freezing points).

The investigation could not distinguish between these causes with certainty. The telemetry indicated that the ignition command was received and that the propellant tank pressures were nominal, suggesting the problem was downstream of the tanks in the engine 3 feed system.

One critical design insight emerged: the Surveyor spacecraft had no redundancy in its vernier engine system. Three engines, each a single-string design, each essential for midcourse corrections and terminal descent. The failure of any single engine during a three-engine maneuver would produce exactly the outcome observed -- asymmetric thrust leading to uncontrollable tumble. The design team at Hughes had accepted this risk because adding redundancy (a fourth engine, cross-connected propellant manifolds, engine-out capability in the flight software) would have exceeded the mass budget. Every kilogram added to the spacecraft was a kilogram that the Atlas-Centaur could not lift to translunar velocity. The mass constraint made redundancy impossible. The mass constraint made failure inevitable -- not on this flight necessarily, but eventually, on some flight, a vernier engine would fail and the spacecraft would tumble.

## What Surveyor 2's Failure Meant for the Program

Surveyor 2 was the second of seven planned Surveyor missions. Its failure did not end the program, but it changed the program's risk calculus.

**Immediate effects:**

- Loss of Sinus Medii surface data. This landing site would not be characterized until Surveyor 6 successfully landed there in November 1967.
- Delay in the characterization of the central nearside for Apollo site selection.
- Increased scrutiny of the vernier engine system for all subsequent missions.

**Design changes for Surveyor 3 and beyond:**

- Enhanced testing of vernier engine propellant valves, including additional acceptance testing at Hughes Aircraft.
- Modifications to the propellant line routing to reduce the risk of blockage or cold spots.
- Improved telemetry for vernier engine health monitoring, allowing earlier detection of anomalies.
- Investigation of engine-out flight modes, although the mass constraints prevented implementation of true engine-out redundancy. Instead, the flight software was modified to include tumble-recovery sequences that could be invoked more quickly if a similar failure occurred.

**Surveyor program results (all 7 missions):**

| Mission | Launch Date | Result | Landing Site |
|---------|------------|--------|-------------|
| Surveyor 1 | May 30, 1966 | **SUCCESS** | Oceanus Procellarum |
| **Surveyor 2** | **Sep 20, 1966** | **FAILURE** | **(Impact SE of Copernicus)** |
| Surveyor 3 | Apr 17, 1967 | **SUCCESS** | Oceanus Procellarum |
| Surveyor 4 | Jul 14, 1967 | **FAILURE** | (Signal lost during retro burn) |
| Surveyor 5 | Sep 8, 1967 | **SUCCESS** | Mare Tranquillitatis |
| Surveyor 6 | Nov 7, 1967 | **SUCCESS** | Sinus Medii |
| Surveyor 7 | Jan 7, 1968 | **SUCCESS** | Near Tycho crater |

Five successes, two failures. A 71% success rate. Both failures were propulsion-related: Surveyor 2's vernier engine failure during midcourse correction, and Surveyor 4's loss of signal during the retrorocket burn (cause never determined, likely a retro motor failure or structural breakup during deceleration). The Surveyor program achieved its primary objective -- demonstrating that the lunar surface could support a landed spacecraft and characterizing multiple potential Apollo landing sites -- despite losing two of seven missions.

Surveyor 3 is particularly significant in the Surveyor 2 story because it demonstrated the design corrections. Launched April 17, 1967, Surveyor 3 successfully performed its midcourse correction with all three vernier engines firing normally. It soft-landed in Oceanus Procellarum on April 20 -- the same general area as Surveyor 1 but with a more precise targeting. The landing was not perfect: the spacecraft bounced twice because the vernier engines did not shut down immediately on surface contact (an issue with the radar altimeter/Doppler velocity sensor), but it came to rest undamaged and returned 6,315 photographs plus the first use of a surface sampler to dig into lunar regolith.

Two and a half years later, on November 19, 1969, Apollo 12 astronauts Pete Conrad and Alan Bean landed the Lunar Module *Intrepid* within 163 meters of Surveyor 3 -- a precision landing demonstration that proved the pinpoint capability needed for later Apollo missions. Conrad walked to Surveyor 3 and removed its television camera and surface sampler scoop, returning them to Earth for analysis. The camera showed evidence of micrometeorite impacts and solar radiation damage, but the spacecraft had survived 31 months on the lunar surface. The camera is now at the Smithsonian.

Pete Conrad -- the same Pete Conrad who flew Gemini 11 (NASA 1.50, degree 49 in this engine) to record altitude -- landed next to the spacecraft that had been Surveyor 2's immediate successor. The thread connects: Gemini 11 launched September 12, 1966. Surveyor 2 launched September 20, 1966. Surveyor 3 launched April 17, 1967. Conrad visited Surveyor 3 on November 19, 1969. The pilot who set the altitude record eight days before the first Surveyor failure eventually walked up to the spacecraft that proved the failure had been fixed.

## The Vernier Engine: Thiokol TD-339

The vernier engine that failed on Surveyor 2 was the Thiokol TD-339, a small throttleable bipropellant liquid rocket engine. Understanding its design illuminates why the failure was catastrophic and why redundancy was so difficult to implement.

**Propellants:** Hydrazine (N2H4) fuel, Nitrogen tetroxide (N2O4) oxidizer. Hypergolic -- ignites spontaneously on contact. No ignition system needed (no spark plug, no pyrotechnic, no laser). This eliminated one class of failure modes (ignition failure) but introduced another: the propellant valves had to seal perfectly, because any leakage would result in uncontrolled combustion.

**Thrust:** 130 N nominal, throttleable from approximately 39 N (30%) to 130 N (100%). The throttle range was controlled by varying the propellant flow rate through the valves.

**Specific impulse:** Approximately 287 seconds. Adequate but not exceptional -- hypergolic propellants trade performance for operational simplicity.

**Mass per engine:** Approximately 3.6 kg. Three engines totaled roughly 10.8 kg -- a significant fraction of the spacecraft's dry mass budget.

**Operational lifetime:** The engines were designed for multiple starts and a cumulative burn time of several hundred seconds. The midcourse correction burn was short (a few seconds to a few tens of seconds, depending on the required delta-v). The terminal descent burn was longer (up to 40 seconds of active thrust after retrorocket jettison). The engines had to survive the translunar coast (cold, vacuum, zero-g) and then fire reliably after 16+ hours of dormancy.

This last point is critical. The vernier engines were ignited and tested briefly during the spacecraft's initial checkout after separation from the Centaur, then shut down for the coast phase, then commanded to fire again for the midcourse correction. The time between the checkout firing and the midcourse correction was many hours. During that time, the propellant in the lines between the tank and the engine was stationary, in vacuum, in cold. Any contamination, any manufacturing debris, any gas bubble that formed in the propellant could have migrated to a valve seat or an injector orifice and created a blockage. The engine that worked during checkout did not necessarily work after 16 hours of coast.

## The Geometry of Three-Engine Failure

The arrangement of three vernier engines at 120-degree intervals around the spacecraft's base was driven by the minimum number of engines needed for three-axis attitude control via differential throttling. Two engines cannot provide three-axis control. Four engines provide redundancy but cost mass. Three engines are the minimum viable control authority, and they leave zero margin for engine failure.

Consider the force balance when all three engines fire equally: each engine produces a thrust vector F tilted slightly outward from vertical. The horizontal components of the three vectors, spaced 120 degrees apart, cancel exactly. The vertical components add to produce a net downward thrust (upward deceleration). The spacecraft descends symmetrically.

Now remove one engine. Two engines firing at 120-degree spacing produce horizontal force components that do NOT cancel. The net force has a horizontal component that pushes the spacecraft sideways and -- because the thrust vectors do not pass through the center of mass -- a torque that rotates the spacecraft. The rotation increases the angular momentum. The remaining two engines cannot correct the rotation because any thrust adjustment that reduces the torque in one axis increases it in another. The system is dynamically unstable.

This is what happened to Surveyor 2. Engine 3 failed. Engines 1 and 2 produced a net torque. The tumble began. The cold-gas attitude control jets -- designed for fine pointing, not for countering main-engine torque -- were overwhelmed. The spacecraft spun up. The mission was lost.

The geometry is unforgiving: in a three-engine system, the loss of any one engine creates a two-engine system that is inherently unstable for any maneuver requiring symmetric thrust. This is a mathematical certainty, not an engineering choice. The Surveyor designers knew this. They accepted it because the mass budget allowed no alternative.

## Surveyor 2 in the Context of 1966

September 1966 was one of the most consequential months in spaceflight history. The chronology:

- **September 12:** Gemini 11 launches (Conrad and Gordon). First-orbit rendezvous, record altitude, tethered spaceflight.
- **September 15:** Gemini 11 splashdown. Four firsts in three days.
- **September 20:** Surveyor 2 launches. Atlas-Centaur nominal.
- **September 21:** Midcourse correction failure. Tumble begins.
- **September 23:** Surveyor 2 impacts the Moon.

Eight days separated the triumph of Gemini 11 from the failure of Surveyor 2. Eight days between the highest crewed altitude in history and the first American lunar probe failure. The contrast was stark: Gemini 11 demonstrated that humans could rendezvous on the first orbit, fly to record altitude, dock, tether, and reenter automatically. Surveyor 2 demonstrated that a single valve failure in a robotic spacecraft could destroy a mission that cost tens of millions of dollars.

The lesson was clear to the engineers of the time: the crewed program was succeeding, the robotic program was fragile. Gemini had humans in the loop who could troubleshoot, adapt, and recover. Surveyor had only the limited autonomy of its onboard systems and the time-delayed commands from JPL. When things went wrong, Gemini astronauts could fix them (Conrad talked Gordon through the exhausting EVA tether attachment; Armstrong regained control of the tumbling Gemini 8). When things went wrong on Surveyor, the spacecraft was alone with its failure.

This tension -- human adaptability versus robotic fragility -- runs through the entire Apollo program. The decision to send humans to the Moon was partly a bet that human judgment, applied in real-time at the site, would overcome the kind of single-point failures that destroyed Surveyor 2. When Neil Armstrong piloted the Eagle past the boulder-strewn approach to the Sea of Tranquillity, manually overriding the computer's chosen landing site, he was doing exactly what Surveyor 2 could not do: adapting to circumstances that the pre-programmed trajectory did not anticipate. The vernier engine failed because it could not adapt. Armstrong succeeded because he could.

## The Atlas-Centaur Stack: A Technical Portrait

The complete launch vehicle for Surveyor 2 was designated Atlas SLV-3C / Centaur D (vehicle AC-7). The stack stood approximately 34.8 meters (114 feet) tall on the pad at LC-36A and weighed approximately 137,000 kg at liftoff.

**Atlas Stage:**
- Length: ~20.7 m
- Diameter: 3.05 m
- Propellants: RP-1 (kerosene) / LOX
- Engines: 2x Rocketdyne MA-3 booster (each 667 kN) + 1x Rocketdyne LR-105 sustainer (366 kN) + 2x LR-101 vernier (small, for roll control)
- Burn time: Booster ~135 s (then jettisoned), sustainer ~300 s total
- Structure: 0.25 mm stainless steel balloon tank (pressurized for structural rigidity)

**Centaur Stage:**
- Length: ~9.1 m
- Diameter: 3.05 m
- Propellants: Liquid hydrogen (LH2) / Liquid oxygen (LOX)
- Engines: 2x Pratt & Whitney RL-10A-3 (each 66.7 kN)
- Specific impulse: 444 s (the highest of any production upper stage in 1966)
- Burn time: First burn ~345 s (parking orbit insertion), second burn ~103 s (translunar injection)
- Insulation: 12 fiberglass / polyurethane foam panels around LH2 tank, jettisoned before first burn

**Mission Sequence:**
1. Atlas booster ignition (T-0)
2. Booster engine jettison (T+135 s, ~55 km altitude)
3. Atlas sustainer + Centaur insulation panel jettison
4. Atlas sustainer cutoff + staging (T+~300 s, ~150 km altitude)
5. Centaur first burn -- parking orbit insertion (~12 min)
6. Coast in parking orbit (~22 min)
7. Centaur second burn -- translunar injection (~103 s)
8. Spacecraft separation from Centaur (T+~44 min)
9. Centaur cold-gas attitude control maneuver to avoid recontact
10. Surveyor 2 translunar coast begins

Every step through #8 was completed successfully for Surveyor 2. The failure occurred 16 hours after step 8.

## Honoring the Failure

Surveyor 2 returned no photographs. It measured no soil. It tested no surface. It is the shortest entry in many Surveyor references -- a paragraph noting the failure, the probable cause, and a redirect to Surveyor 3. But the mission matters.

It matters because Surveyor 3 worked, and Surveyor 3 worked partly because Surveyor 2 failed. The enhanced valve testing, the modified propellant line routing, the improved health monitoring -- all products of the Surveyor 2 investigation. The failure taught the engineers what the success could not: where the system's fragility lived, what the actual (not theoretical) failure modes were, how a 292-kilogram spacecraft behaved when a 3.6-kilogram engine refused to ignite.

It matters because it established that the lunar program was not immune to loss. Surveyor 1's success had created confidence -- perhaps too much confidence. Surveyor 2's failure restored appropriate caution. The program was fragile. The Moon was unforgiving. A single valve, a single engine, a single missed ignition could convert a mission from triumph to debris.

It matters because the failure is honest. Surveyor 2 does not pretend to be something it wasn't. It launched on September 20, 1966, flew for three days, tumbled, and hit the Moon. The trajectory was ballistic from the moment the midcourse correction failed. There was no rescue, no recovery, no redemption arc. The spacecraft followed the physics to its conclusion. The engineers documented everything they could and built a better spacecraft.

And it matters because, two and a half years later, Pete Conrad walked up to Surveyor 3 -- the next spacecraft off the line, the one with the better valves -- and brought a piece of it home. The thread from Gemini 11 to Surveyor 2 to Surveyor 3 to Apollo 12 is a single continuous story: the pilot who proved first-orbit rendezvous eight days before the first Surveyor failure eventually stood on the Moon next to the spacecraft that proved the failure had been fixed. The midcourse correction that Surveyor 2 never completed, Conrad completed in person.

---
