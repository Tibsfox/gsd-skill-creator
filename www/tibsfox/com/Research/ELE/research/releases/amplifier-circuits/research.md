# Amplifier Video Series: Deep Technical Analysis

**Source:** 8 YouTube transcripts — vacuum tube and transistor amplifier design  
**Clusters:** Electronics (ELC), Broadcasting (RBH)  
**Cross-cluster connections:** Music (S36 — 22 projects), HPC white-box compute, FoxFiber audio distribution  
**Date analyzed:** 2026-04-04

---

## College Mappings

| Department | Relevance |
|---|---|
| Electronics (Rosetta Core) | All 8 videos — core subject matter |
| Broadcasting / RF (RBH) | Output transformers, power stages, audio distribution chain |
| Music Technology (S36) | Guitar amp design, tonal character, studio preamp chain |
| Mathematics (Rosetta Core) | Gain calculations, efficiency derivations, impedance matching |
| Physics / Applied Science | Thermionic emission, electromagnetic induction, thermal biasing |

---

## Rosetta Cluster Connections

- **ELC (Electronics):** Primary cluster. All circuit topologies, biasing theory, component selection.
- **RBH (Broadcasting):** Power amp output stages, transformer coupling, signal distribution from studio to transmission.
- **S36 (Music — 22 projects):** Guitar amp design directly feeds Artemis music research. 12AX7 preamp stage is the canonical rock guitar tone chain. Push-pull EL84 = Orange AD30 = multiple music research cross-references.
- **HPC / White-box compute:** Class A biasing rationale at >30–40 GHz parallels workstation architecture decisions: highest linearity = highest compute predictability. Power-efficiency tradeoff maps exactly to CPU idle power design.
- **FoxFiber audio distribution:** Output transformer impedance matching (high plate Z → low speaker Z) is architecturally identical to FoxFiber's signal adaptation problem: high-impedance studio sources → low-impedance distribution endpoints.

---

## Video 1: Design and Build a Vacuum Tube Amplifier from Scratch

**Source:** `yt-tube-amp-scratch-9AABLml-ERE.en.vtt` | ~16 min

### Key Claims

1. A complete guitar/hi-fi amplifier can be built on a single chassis using a 12AX7 dual-triode preamp and a 6V6 beam power tetrode output stage.
2. The grid stopper resistor (68K, sourced from Fender tweed designs) prevents RF parasitic oscillation at the input grid.
3. Both 12AX7 triode stages use identical cathode bias: 1.5KΩ resistor + 25µF/25V bypass capacitor.
4. The bypass capacitor across the cathode resistor eliminates AC-signal degeneration, significantly increasing gain.
5. Coupling capacitors (0.02µF/600V) between stages block DC bias voltages from reaching the next stage's grid.
6. The volume potentiometer (1MΩ) sits between the two preamp stages and before the power amp grid — not at the input.
7. Negative feedback from the output transformer secondary stabilizes the power amp and reduces distortion.
8. The output transformer is mandatory: it converts the 6V6's high plate impedance to the speaker's low impedance, and blocks DC from the voice coil.

### Technical Details

**Signal chain:**  
Input jack → 68KΩ grid stopper → 12AX7 triode 1 (preamp stage 1) → 0.02µF coupling cap → 1MΩ volume pot → 12AX7 triode 2 (preamp stage 2) → 0.02µF coupling cap → 6V6 power tube (cathode-biased, class A single-ended) → output transformer → speaker

**Biasing:**
- 12AX7 preamp stages: 1.5KΩ cathode resistor, bypassed with 25µF/25V electrolytic
- 6V6 power stage: 470Ω cathode resistor (sets quiescent plate current)
- B+ supply: filtered DC from mains transformer + rectifier

**Coupling caps:** 0.02µF/600V (must be rated for high-voltage circuit)

**Output transformer wiring:** primary to plate + B+; secondary to speaker + ground; feedback tap from secondary back to first triode cathode or grid circuit.

### Numbers

| Parameter | Value |
|---|---|
| Grid stopper resistor | 68KΩ |
| Cathode resistor (each 12AX7 stage) | 1.5KΩ |
| Cathode bypass cap | 25µF / 25V |
| Coupling caps | 0.02µF / 600V |
| Volume pot | 1MΩ |
| 6V6 cathode resistor | 470Ω |

### Key Quotes

> "We're going to use a 68K grid stopper — that's what Fender used on their early tweed amps."

> "The bypass cap across the cathode resistor lets the AC signal bypass the resistor, which increases our gain considerably."

### Study Guide Topics

- Why grid stopper resistors are needed (RF oscillation mechanism)
- Cathode bias vs. fixed bias: tradeoffs in stability and tone
- Why 600V coupling caps despite a ~300V B+ supply (transient headroom)
- Negative feedback loop: where it taps from and what it stabilizes

### DIY Try

Build the two-stage 12AX7 preamp section on a turret board. Verify with an oscilloscope: confirm signal inversion per stage, measure voltage gain with and without the cathode bypass cap. Expected gain increase with bypass cap: 3–10×.

---

## Video 2: How Tube Amplifiers Work — Pre-Amp and Power Amp

**Source:** `yt-tube-preamp-power-901iaPVVzY0.en.vtt` | ~21 min

### Key Claims

1. The B+ supply in a typical tube amp measures 320–325V DC after rectification and filtering.
2. The power supply uses an RC ladder (resistors + filter capacitors) to progressively smooth rectified AC into clean DC.
3. The 12AX7 plate load resistor is 100KΩ; voltage at the plate drops to approximately 150V DC under quiescent conditions.
4. A 16µF filter capacitor is used at the first filter stage off the rectifier.
5. Thermionic emission is described as electrons "boiling off" the cathode when heated — like "popcorn."
6. The plate acts as a vacuum for electrons: its high positive potential pulls electrons across the vacuum.
7. The heater circuit runs at 6.3V AC (filaments) with a separate 5V winding for the rectifier tube.
8. Filter caps store lethal charge even after the amp is powered off — this is the primary safety hazard.

### Technical Details

**Power supply chain:**  
Mains AC → mains transformer primary → secondary windings: (a) high-voltage winding → rectifier → filter caps + resistors → B+ DC rail; (b) 6.3V AC winding → heaters; (c) 5V winding → rectifier tube heater

**RC filter ladder:** Rectified DC → first filter cap (16µF) → series resistor → second filter cap → series resistor → third filter cap → cleanest DC to preamp stages. Each RC stage further attenuates 60/100Hz ripple.

**Triode operation:** Cathode heated → electrons emitted → plate at B+ (~320V) pulls electrons across vacuum → current flows cathode→plate. Control grid voltage modulates this current: negative grid repels electrons, reducing current; positive grid attracts, increasing current. AC signal on grid = AC modulation of plate current = amplified AC output across plate load resistor.

**Voltage at plates:** With 100KΩ plate load and ~320V B+, quiescent plate voltage drops to ~150V DC (implies ~1.7mA quiescent plate current: (320-150)/100K ≈ 1.7mA).

### Numbers

| Parameter | Value |
|---|---|
| B+ supply | 320–325V DC |
| Plate load resistor (12AX7) | 100KΩ |
| Quiescent plate voltage | ~150V DC |
| Implied quiescent current | ~1.7mA |
| First filter cap | 16µF |
| Heater supply | 6.3V AC |
| Rectifier heater supply | 5V AC |

### Key Quotes

> "Think of the plate as a vacuum for the electrons — they get pulled across the space between the cathode and the plate."

> "Those filter capacitors can hold enough charge to kill you even after you've switched the amp off. That's the main danger with tube equipment."

### Study Guide Topics

- RC ladder filter: why multiple stages are needed (ripple attenuation calculation)
- Voltage divider action of plate load resistor + tube impedance
- Why B+ must be DC (AC on supply = hum at 60Hz in audio output)
- Safety protocol for discharging filter caps before servicing

### DIY Try

Build the power supply section only: mains transformer → bridge/full-wave rectifier → 3-stage RC filter → measure ripple at each cap with oscilloscope. Calculate theoretical ripple reduction per stage. Verify B+ voltage with a high-voltage meter.

---

## Video 3: Understanding Vacuum Tube Amplifier Schematics — Push-Pull Part 3

**Source:** `yt-tube-pushpull-y3P7lAH3F7c.en.vtt` | ~31 min

### Key Claims

1. Push-pull topology splits the audio signal: one tube amplifies the positive half-cycle, the other amplifies the negative half-cycle; both outputs are recombined at the output transformer.
2. Class A means the device conducts for the full 360° of the input cycle — "gas pedal floored all the time."
3. Class AB is biased just above cutoff: both devices are slightly on at idle, eliminating crossover distortion while improving efficiency over Class A.
4. Class B devices only conduct when the signal exceeds the bias threshold — "only when you need them."
5. The Orange AD30 amplifier uses four ECC83 (12AX7) preamp valves and four EL84 power valves (two push-pull pairs) for 30W total output.
6. A GZ-34 thermionic rectifier is used instead of solid-state diodes — it produces a characteristic voltage sag under load, which is musically desirable.
7. There is no PNP equivalent vacuum tube, so push-pull tube amps require a phase inverter/splitter to generate antiphase drive signals.
8. Push-pull operation extends tube life compared to single-ended designs because each tube handles only half the signal cycle.

### Technical Details

**Five operational blocks of a valve amplifier:**
1. Preamp (voltage amplification, signal conditioning)
2. Phase splitter/inverter (generates +signal and −signal for push-pull drive)
3. Power amp output stage (push-pull pair)
4. Output transformer (impedance matching + signal recombination)
5. Power supply / rectifier (B+ generation)

**Phase inverter circuits:** Convert single-ended signal to balanced antiphase pair. Common topologies: split-load (cathodyne), long-tailed pair (differential), Paraphase.

**Orange AD30 architecture:**
- Input → 4× ECC83 preamp chain
- Phase inverter (from last ECC83)
- 2× EL84 push-pull pair (15W) × 2 = 30W total
- GZ-34 full-wave rectifier
- Output transformer (multiple speaker impedance taps: 4Ω, 8Ω, 16Ω)

**Class comparisons:**
| Class | Conduction angle | Efficiency | Distortion | Use case |
|---|---|---|---|---|
| A | 360° | ~20–25% | Lowest | Small signal, high fidelity |
| AB | >180° <360° | ~40–60% | Very low (biased above cutoff) | Most audio power amps |
| B | ~180° | ~78% theoretical | Crossover distortion | Inefficient for audio |

### Numbers

| Parameter | Value |
|---|---|
| AD30 total output power | 30W |
| ECC83 preamp stages | 4 |
| EL84 power stages | 4 (2 push-pull pairs) |
| EL84 pair output | 15W per pair |
| Class A efficiency | ~20–25% |
| Class B efficiency | ~78% theoretical |

### Key Quotes

> "Class A is like having your gas pedal floored the whole time — you're always using fuel whether you need it or not."

> "There's no PNP equivalent in the tube world, so we need a phase inverter to create the two antiphase signals for the push-pull pair."

### Study Guide Topics

- Phase inverter topologies: cathodyne vs. long-tailed pair — gain, balance, bandwidth tradeoffs
- Why output transformer has multiple impedance taps
- GZ-34 voltage sag: mechanism and musical effect
- Class AB crossover region: how small forward bias eliminates the dead zone

### DIY Try

Breadboard a long-tailed pair phase inverter (two halves of a 12AX7). Drive it with a signal generator at 1kHz, measure both outputs on a dual-trace oscilloscope. Verify 180° phase difference and matched amplitudes. Deliberately misbalance the tail resistor and observe output asymmetry.

---

## Video 4: Valve/Tube Amp Circuits EXPLAINED

**Source:** `yt-valve-circuits-_170IlG9iic.en.vtt` | ~18 min

### Key Claims

1. Thermionic emission is the physical mechanism: heating the cathode gives electrons enough energy to escape the metal surface into the vacuum.
2. A rectifier valve contains two diodes in a single glass envelope — a full-wave rectifier in one tube.
3. The triode adds a third electrode (control grid) between cathode and anode, allowing a small grid voltage to control a large plate current.
4. The Orange AD30's internal voltages span from 6.3V AC (heaters) to 335V DC (power valve anodes) — a ~53:1 range within the same chassis.
5. Mains input is 230V AC (European) or 110V AC (US); the mains transformer's secondary windings produce all internal voltages.
6. The GZ-34 thermionic rectifier produces characteristic voltage sag under load — a valued tonal quality in guitar amplifiers.
7. Safety: filter capacitors retain lethal voltages for hours after power-off; always discharge before touching internal components.
8. The five operational blocks (preamp, phase splitter, power amp, output transformer, rectifier) form the complete signal+power topology of every valve amp.

### Technical Details

**Thermionic emission chain:** Filament (6.3V AC) → heats cathode → electrons gain thermal energy → escape cathode surface → vacuum gap → attracted to anode (+335V DC) → current flows.

**Rectifier valve operation:** Two diodes in one envelope → full-wave rectification of high-voltage secondary AC → raw DC with 100/120Hz ripple → RC filter network → smooth B+ supply.

**Orange AD30 voltage map:**
| Rail | Voltage |
|---|---|
| Mains primary | 230V AC (110V US version) |
| Heater winding | 6.3V AC |
| Rectifier heater | 5V AC |
| Raw rectified output | ~400V DC (peak) |
| Filtered B+ at power valves | 335V DC |
| Preamp plate voltage (under load) | ~150–180V DC |

**Triode vs. rectifier diode:** Diode has only cathode + anode (one-way current). Triode adds grid between them. Grid voltage modulates plate current: more negative grid → less current; less negative → more current. Plate current follows grid signal — amplification.

### Numbers

| Parameter | Value |
|---|---|
| Power valve anode voltage | 335V DC |
| Heater supply | 6.3V AC |
| Mains (EU) | 230V AC |
| Mains (US) | 110V AC |
| GZ-34 configuration | Full-wave, 2 diodes in 1 envelope |

### Key Quotes

> "When you heat the cathode, you give the electrons enough energy to boil off the surface — that's thermionic emission."

> "Inside that one chassis you've got everything from 6.3 volts all the way up to 335 volts — you've got to know where you're putting your hands."

### Study Guide Topics

- Thermionic emission vs. field emission: why tubes need heaters
- Full-wave rectifier: center-tap vs. bridge topology; how a dual-diode tube achieves full-wave
- Why voltage sag is musically valued: dynamic compression effect under transient loads
- The meaning of "Class A" in a triode output stage: why it differs from Class A in solid-state

### DIY Try

Using a low-voltage signal tube (e.g., 12AU7 at reduced plate voltage on a safely designed test jig), measure the plate current vs. grid voltage (transfer characteristic curve). Plot several curves at different plate voltages to generate a family of characteristic curves. This directly maps to transistor Ic/Vbe curves.

---

## Video 5: Tutorial on Design and Characterization of Class-B and AB Amplifiers

**Source:** `yt-class-ab-design-YuVqccvgNPM.en.vtt` | ~40 min (Signal Path channel)

### Key Claims

1. Class A amplifiers are the most linear and fastest operating mode — circuits above 30–40 GHz exclusively use Class A because of this speed advantage.
2. Class A maximum theoretical efficiency is ~25%; practical efficiency is slightly lower (just over 20%).
3. Class A is "not very good for delivering power to small resistance loads" — a 10Ω speaker load wastes most of the supply power as heat in the transistor.
4. Class B eliminates the idle bias current entirely: when the input is 0V, both transistors are completely off, drawing zero DC current.
5. The crossover distortion problem in Class B is caused by the VBE dead zone: signals with peak amplitude less than 0.7V produce no output at all.
6. Class AB eliminates crossover distortion by biasing both devices slightly above cutoff — they are "just barely on" at idle.
7. In Class A, a 50mA quiescent current at 5V supply = 250mW of constant power dissipation regardless of signal level.
8. For power amplification into a 10Ω load, Class B or AB is the correct choice; Class A is correct for small-signal gain stages.

### Technical Details

**Class A common-emitter analysis:**
- Quiescent point: VCE = Vcc/2 for maximum symmetric swing
- Example: Vcc = 9V → target VCE = 4.5V
- Quiescent IC set by voltage divider bias (R1/R2 → base voltage → VBE drop → VE → emitter current ≈ collector current)
- Efficiency = AC power to load / DC supply power × 100%
- Maximum AC swing = Vcc/2 peak; maximum AC power to load = (Vcc/2)² / (2 × RL)
- Maximum efficiency: (Vcc²/8RL) / (Vcc × IC) = ~25% when RL is large

**Class B push-pull analysis:**
- Q1 (NPN): conducts when Vin > +0.7V (handles positive half-cycle)
- Q2 (PNP): conducts when Vin < −0.7V (handles negative half-cycle)
- At Vin = 0V: both off → zero idle current → zero idle power dissipation
- Dead zone: −0.7V < Vin < +0.7V → both transistors in cutoff → output = 0 → crossover distortion
- Demonstrated with 0.8Vpp signal (0.4V peak): both transistors stay in cutoff → no output
- Demonstrated with 2Vpp signal: both transistors conduct on their respective half-cycles

**Class AB biasing:**
- Small forward bias applied between bases: typically 2× VBE drop (~1.4V) from diodes or VBE multiplier
- This sets both transistors just at the edge of conduction at idle
- Eliminates the ±0.7V dead zone
- Idle current is small but nonzero — slightly less efficient than Class B at idle, but distortion-free

**10Ω load example:**
- Class A with 50mA idle, 5V supply: P_idle = 250mW, continuous
- This 250mW waste exists even when no signal is present
- Class B: idle power = 0W when no signal

### Numbers

| Parameter | Value |
|---|---|
| Class A maximum theoretical efficiency | ~25% |
| Class A practical efficiency | just over 20% |
| GHz threshold favoring Class A | >30–40 GHz |
| Class A example: Vcc | 9V |
| Class A optimal quiescent VCE | 4.5V (= Vcc/2) |
| Class A example: idle current | 50mA |
| Class A example: idle power waste | 250mW (5V × 50mA) |
| VBE dead zone (Class B) | ±0.7V |
| Signal below which crossover distortion occurs | <0.7V peak |
| Class B example load | 10Ω |
| Class AB VBE multiplier bias | ~1.4V (2× VBE) |

### Key Quotes

> "If you're operating above 30 or 40 GHz none of those circuits are built using Class B or Class AB amplifiers — typically they are Class A because they're so fast."

> "The beauty of Class B is that the devices are not always turned on — this circuit consumes no power if there is no signal present at its input, which is perfect."

### Study Guide Topics

- VBE multiplier: how it produces a stable 2× VBE voltage for Class AB biasing and why it tracks temperature
- Efficiency derivation for Class A: why 25% is the theoretical maximum, not an engineering failure
- Crossover distortion: measure it on a scope — what does the waveform look like for a 0.8Vpp sine wave into a Class B stage?
- Large signal vs. small signal: why Class A is correct for preamp stages and Class AB for power stages

### DIY Try

Build a Class B complementary emitter follower on a breadboard (NPN + PNP, e.g. 2N3904 + 2N3906). Apply a 1kHz sine wave from a signal generator. Start at 0.5Vpp input and increase to 3Vpp while watching the output on an oscilloscope. Observe the crossover distortion region clearly on the scope, then add two diodes across the bases for Class AB biasing and watch the distortion disappear.

---

## Video 6: Push-Pull Pair — Class B, AB, and A Operation

**Source:** `yt-pushpull-class-S7jrirsfkNw.en.vtt` | ~34 min

### Key Claims

1. The NPN/PNP push-pull emitter follower pair achieves no voltage gain but provides current gain and impedance transformation.
2. The NPN transistor sources current to the load (handles positive half-cycle); the PNP transistor sinks current from the load (handles negative half-cycle).
3. Crossover distortion is caused by the 0.7V VBE threshold: a signal with 0.4V positive peak and 0.4V negative peak produces no output from either transistor.
4. A 2Vpp signal (1V positive, 1V negative) is sufficient to drive both transistors into conduction on their respective half-cycles.
5. Emitter resistors on the output stage are critical for stability and current limiting.
6. The push-pull emitter follower is an impedance transformer: presents high impedance to the signal source, drives a low-impedance load.
7. Class AB biasing (small forward bias at idle) eliminates the ±0.7V dead zone without requiring full Class A continuous conduction.
8. The topology allows each transistor to be optimized for one polarity — a fundamental advantage of complementary device design.

### Technical Details

**NPN emitter follower (positive half-cycle):**
- Input at base: Vout = Vin − 0.7V (VBE drop)
- Conduction condition: Vin > +0.7V
- Sources current from Vcc into load

**PNP emitter follower (negative half-cycle):**
- Input at base: Vout = Vin + 0.7V (VEB drop)
- Conduction condition: Vin < −0.7V
- Pulls current from load to Vss (or −Vcc)

**Dead zone analysis:**
- 0.8Vpp input (±0.4V): both transistors in cutoff → Vout = 0 for full cycle → complete output loss
- 2Vpp input (±1V): NPN conducts above 0V (adjusted by 0.7V threshold), PNP conducts below 0V → output ≈ input with ±0.7V offset correction

**Class AB modification:**
- Forward bias both bases ~1.4V apart at idle (diodes or transistor VBE multiplier)
- NPN starts conducting at slightly below 0V input
- PNP starts conducting at slightly above 0V input
- Overlap region: smooth crossover, no dead zone

**Emitter resistors (RE_out):**
- Small value resistors (e.g., 0.1–1Ω) in series with each emitter
- Provide thermal stability (prevent thermal runaway in high-current stages)
- Help balance current sharing between devices

### Numbers

| Parameter | Value |
|---|---|
| VBE threshold (NPN conduction) | +0.7V |
| VEB threshold (PNP conduction) | −0.7V |
| Minimum input for any output (Class B) | >0.7V peak |
| Dead zone width | 1.4V (±0.7V) |
| Example: signal causing full crossover loss | 0.8Vpp (±0.4V peak) |
| Example: signal that drives both devices | 2Vpp (±1V peak) |
| Voltage gain of emitter follower | ≈1 (unity) |

### Key Quotes

> "The NPN sources current to the load, the PNP pulls current from the load — they work as a complementary pair, each handling one half of the waveform."

> "With 0.8 volts peak to peak — 0.4 positive, 0.4 negative — both transistors stay in cutoff and you get nothing out. That's crossover distortion in action."

### Study Guide Topics

- Why emitter followers are used as output stages despite unity voltage gain (impedance transformation benefit)
- Thermal stability: how emitter resistors and VBE multiplier tracking prevent thermal runaway
- The role of each transistor's conduction region: draw both transistors' conduction thresholds on a single voltage axis
- Why the PNP transistor is oriented "upside down" relative to the NPN in the circuit

### DIY Try

Measure the crossover distortion threshold directly. Build a Class B complementary pair with no biasing. Connect a function generator with variable amplitude. Start at 0.1Vpp and increase by 0.1V steps, recording the output waveform at each step. Plot input amplitude vs. output amplitude to find the exact dead-zone boundary at ±0.7V.

---

## Video 7: Transistor Amplifiers — Class A, AB, B, and C Circuits

**Source:** `yt-transistor-amps-0e_OUyGCaBs.en.vtt` | ~18 min

### Key Claims

1. Class A is implemented as a common-emitter NPN amplifier: output is inverted and larger than the input.
2. The amplifier "transfers" DC supply power to the AC signal on the output — it does not create power, it redirects it.
3. Voltage gain = Vout / Vin; efficiency = (AC load power / DC supply power) × 100%.
4. Class A maximum efficiency is 25% — the transistor conducts for the full 360° of the cycle, wasting most supply power as heat.
5. Class A is best suited as a small-signal amplifier, not a power amplifier driving a low-impedance speaker.
6. A bypass capacitor across the emitter resistor (RE) allows the AC signal to bypass the resistor, greatly increasing voltage gain.
7. Coupling capacitors (C1 at input, C2 at output) block DC bias voltages from reaching the source or load while passing the AC signal.
8. Class A, B, AB, and C each represent a defined conduction angle — selecting the class is a tradeoff between linearity and power efficiency.

### Technical Details

**Common-emitter Class A circuit components:**
- RC (collector resistor): sets quiescent collector voltage; AC signal developed across RC
- RB (base resistor): part of base bias voltage divider
- R1: forms voltage divider with RB → sets base DC bias point
- RE (emitter resistor): DC stability (emitter degeneration); bypassed for AC gain
- C1 (input coupling cap): blocks DC from signal source
- C2 (output coupling cap): blocks DC from load
- Bypass cap across RE: short-circuits RE for AC, restoring full gain

**Operating point:**
- Target: VCE = Vcc/2 for maximum symmetric voltage swing
- Collector current set by base voltage divider + VBE + IE×RE

**Gain with and without bypass cap:**
- Without bypass: Av ≈ −RC / (re + RE) [re = 26mV/IC, small compared to RE]
- With bypass cap: Av ≈ −RC / re [re ≈ 26mV/IC for silicon BJT]
- Bypass cap can increase gain by factor of RE/re — often 10×–50×

**Conduction angles by class:**
| Class | Conduction angle | Primary use |
|---|---|---|
| A | 360° | Small-signal, linear stages |
| AB | 180° < θ < 360° | Audio power output |
| B | ~180° | Efficient power, with push-pull |
| C | <180° | RF power amplifiers, oscillators |

### Numbers

| Parameter | Value |
|---|---|
| Class A conduction angle | 360° |
| Class A maximum efficiency | 25% |
| Quiescent point target | VCE = Vcc/2 |
| Gain without bypass cap | ≈ −RC / (re + RE) |
| Gain with bypass cap | ≈ −RC / re |
| Gain improvement from bypass | Typically 10×–50× |

### Key Quotes

> "The transistor isn't creating power — it's transferring power from the DC supply and delivering it to the AC signal at the output."

> "Class A conducts for 360 degrees of the cycle — Q1 is always on. That makes it our most linear amplifier, but it means we're always burning power."

### Study Guide Topics

- Voltage divider bias: why it's preferred over single-resistor base bias (stability against beta variations)
- AC equivalent circuit: redraw the amplifier with all capacitors as short-circuits and all DC sources as short to ground
- Effect of RE on gain and input impedance: show the tradeoff between stability and gain
- Class C: why it's used in RF power amps despite severe distortion (resonant tank circuit restores the waveform)

### DIY Try

Build the Class A common-emitter amplifier with a BC547 (or 2N3904). Measure voltage gain twice: (1) with RE fully inserted, (2) with RE bypassed by a 100µF electrolytic. Compare the results to the formula Av = −RC/re. Verify signal inversion by comparing input and output waveforms on a dual-trace scope.

---

## Video 8: Small Signal Amplifiers

**Source:** `yt-small-signal-WgOKPF8LkA8.en.vtt` | ~58 min

### Key Claims

1. A PA system is the canonical teaching example for small signal amplifiers: microphone → small signal amp → power amp → speaker.
2. A microphone produces approximately 20mV peak-to-peak (±10mV) — far too small to drive a power amplifier directly.
3. A microphone works by electromagnetic induction: diaphragm moves → attached coil moves in a magnetic field → current induced.
4. A transformer can step up voltage (e.g., 10:1 turns ratio → 200mV from 20mV input) but cannot increase power; stepping up voltage reduces current proportionally (P = V × I, constant).
5. Only a transistor (active device) can increase signal power by drawing energy from a DC supply.
6. The NPN transistor operates as a current amplifier: small base current → proportionally larger collector current (current gain = hFE or β).
7. Both base current and collector current flow out of the emitter; the collector current is β times the base current.
8. To build a voltage amplifier (needed for preamp stages before a power amp), a collector resistor is added — changing collector current creates a voltage signal across the resistor.

### Technical Details

**Microphone signal chain:**
- Sound waves → diaphragm → moving coil in permanent magnetic field → induced EMF ≈ 20mVpp
- Transformer step-up (optional): 1:10 ratio → 200mVpp, but current drops by 10× → power unchanged
- Transistor amplifier: uses supply power to amplify both voltage and current → power gain

**NPN transistor as current amplifier:**
- Base: control input (small current IB)
- Collector: output (large current IC = β × IB, typically β = 100–300)
- Emitter: sum of base + collector currents flows out: IE = IB + IC ≈ IC (for large β)

**Converting current amp to voltage amp:**
- Add collector resistor RC between Vcc and collector
- IC through RC produces voltage: Vc = Vcc − IC × RC
- Changing IC (from varying IB/Vin) changes Vc → voltage output signal
- Voltage gain: Av = ΔVc / ΔVin = −RC / re (common-emitter configuration)

**Biasing for voltage amplifier:**
- Need to set quiescent IC to center the operating point
- Use voltage divider at base (R1/R2) to set VB → VE = VB − 0.7V → IE = VE/RE → IC ≈ IE
- This is identical to Class A common-emitter circuit in Video 7 — same topology from a different pedagogical direction

**Signal path for PA system:**
1. Microphone: 20mVpp
2. Optional transformer: 200mVpp (voltage only, no power gain)
3. Small signal transistor amp (common-emitter): voltage and power gain → e.g., 2Vpp
4. Power amplifier (Class AB push-pull): voltage + current gain → speaker power (watts)
5. Speaker: electromagnetic coil converts current to acoustic energy

### Numbers

| Parameter | Value |
|---|---|
| Microphone output | ~20mVpp (±10mV) |
| Transformer step-up ratio (example) | 10:1 |
| Transformer output voltage | ~200mVpp |
| Transformer power change | None (P = V × I, constant) |
| Typical transistor β (hFE) | 100–300 |
| Small signal amp example supply | 10V |
| Collector resistor example | 1KΩ |

### Key Quotes

> "The transformer can step up the voltage, but it can't give us more power — for power we need a transistor."

> "Small current into the base, big current into the collector — and to get that current I need some kind of a power source."

### Study Guide Topics

- Electromagnetic induction in microphone transducers: Faraday's law → EMF = −N dΦ/dt
- Why transformer cannot amplify power: energy conservation, V×I constant in ideal transformer
- Transistor as controlled current source: IC = β × IB model and its limits (saturation, Early effect)
- Complete signal chain: calculate required gain at each stage to drive a 50W power amp from a 20mV microphone signal

### DIY Try

Build the complete PA signal chain at low power on a breadboard: use a small electret capsule as mic → common-emitter preamp (2N3904) → Class AB push-pull output stage → 8Ω speaker. Use an oscilloscope to measure signal at each stage. Observe signal growth from millivolts to volts, and confirm each stage's voltage gain matches the formula.

---

## Rosetta Translation Table

| Hardware/Analog Concept | Artemis-II / GSD Equivalent | Mapping Rationale |
|---|---|---|
| Tube preamp gain staging (12AX7 stage 1 → coupling cap → stage 2) | Gastown polecat task staging | Each stage amplifies and transforms the signal before passing it forward; coupling capacitors = clean handoff interfaces that block DC contamination |
| Push-pull topology (NPN + PNP, or EL84 pair) | refinery-merge | Two complementary halves each process one phase of the work; their outputs are combined at a shared transformer/merge point |
| Class AB biasing (small forward bias sets idle point between cutoff and full conduction) | trust-relationship.ts provisioning | Set the operating point between zero-trust (fully off = Class B cutoff) and full-trust (fully on = Class A); idle forward bias = provisional trust grant at session start |
| Feedback networks (output transformer secondary tapped back to input grid) | harness integrity loops | Output signal sampled and returned to input; reduces distortion and stabilizes gain — exactly what a harness integrity check does when it feeds back build/test results to stabilize the pipeline |
| Output transformer (invisible impedance converter between high-Z plate and low-Z speaker) | Invisible infrastructure | The transformer does no amplification — it silently matches impedances so the rest of the system can work; just as virtual ground and reference rails make op-amp circuits function without appearing in the signal path |

---

## Cross-Cluster Research Connections

### Music Cluster (S36 — 22 projects)

The 12AX7 preamp topology documented in Videos 1–4 is the backbone of:
- All Marshall, Fender, Vox, Orange guitar amplifier circuits in the music cluster
- Studio condenser microphone preamp design (input transformer + triode stage)
- Tape machine record/repro amplifier design (Class A triode, custom EQ networks)

The phase inverter → push-pull EL84 chain in Video 3 directly maps to the Orange AD30 — a specific amp model referenced in music research projects. The GZ-34 voltage sag characteristic is a documented tonal element worth cataloguing in the music cluster alongside harmonic distortion profiles.

### Broadcasting Cluster (RBH)

- Output transformer impedance matching: the same principle governs RF transmitter output tank → coaxial feedline → antenna impedance matching (50Ω standard)
- Class AB efficiency matters for broadcast power stages: a 10kW AM transmitter using Class A would waste 30–40kW as heat; Class AB or C reduces this dramatically
- Push-pull topology in audio broadcast: balanced line drivers use the same complementary topology to drive 600Ω balanced lines
- Small signal chain (Video 8): directly maps to broadcast console signal path — mic preamp → line amp → power amp → transmitter input

### HPC / White-Box Compute

The Class A frequency advantage (>30–40 GHz remains Class A) directly maps to high-speed compute design:
- CPU input buffers and sense amplifiers in DRAM operate in Class A for linearity and speed
- GPU shader cores use Class A input stages in their sense amps
- The efficiency vs. linearity tradeoff is identical: server power budgets favor Class AB (efficiency) for power delivery networks, but signal integrity on high-speed traces requires Class A-like linear drivers

### FoxFiber Audio Distribution

The output transformer's function — converting high plate impedance (5–20KΩ) to speaker impedance (4–16Ω) — is architecturally identical to FoxFiber's distribution architecture:
- Studio source: high-impedance, line-level signal (~600Ω balanced)
- Distribution endpoint: low-impedance zone amplifier input (<100Ω)
- FoxFiber balun/matching network plays the same role as the output transformer: silent, lossless impedance conversion, DC isolation, and protection against ground loops

---

## Unified Study Guide — All 8 Videos

### Foundation Track (complete in order)

1. Thermionic emission and vacuum tube structure (Video 4)
2. The five operational blocks of any amplifier (Video 4)
3. B+ supply design: rectification and filtering (Video 2)
4. Triode operation: grid controls plate current (Video 2)
5. Class A common-emitter BJT amplifier (Video 7)
6. Bypass capacitor effect on gain (Video 7 + Video 8)
7. Small signal chain: mic → preamp → power amp (Video 8)
8. Transformer operation: impedance and voltage transformation (Video 8)

### Intermediate Track

9. Complete tube preamp signal chain (Video 1)
10. Cathode bias and coupling cap design rules (Video 1)
11. Class B crossover distortion: cause and measurement (Video 5 + Video 6)
12. NPN/PNP complementary push-pull operation (Video 6)
13. Class AB biasing techniques: diodes and VBE multiplier (Video 5)
14. Efficiency calculations across all amplifier classes (Video 5 + Video 7)

### Advanced Track

15. Phase inverter topologies for push-pull tube amps (Video 3)
16. Negative feedback in amplifier systems (Video 1 + Video 3)
17. Class A at microwave frequencies: why linearity wins at speed (Video 5)
18. GZ-34 voltage sag: mechanism and musical application (Video 3 + Video 4)
19. Output transformer design: turns ratio, primary impedance, multiple taps (Video 1 + Video 3)
20. Complete amplifier system design: Orange AD30 as case study (Videos 3 + 4)

---

## DIY Try Session Summary

| Session | Core Skill | Minimum Equipment |
|---|---|---|
| 1 | Bias a Class A common-emitter amplifier to VCE = Vcc/2; measure gain with/without bypass cap | Breadboard, 2N3904, resistors, oscilloscope, signal generator |
| 2 | Build Class B push-pull; observe crossover distortion threshold at ±0.7V input | Same + PNP 2N3906 |
| 3 | Add Class AB biasing with 1N4148 diodes; confirm crossover elimination | Same + 2× 1N4148 |
| 4 | Build a long-tailed pair phase splitter from 1/2 of an op-amp (or BJT pair); verify 180° antiphase output | Dual-trace oscilloscope required |
| 5 | Build and measure B+ supply: mains transformer + bridge rectifier + 3-stage RC filter; measure ripple at each stage | High-voltage safety precautions required |
| 6 | Full PA signal chain: electret mic → common-emitter preamp → Class AB output → 8Ω speaker | All above + electret capsule + small speaker |
