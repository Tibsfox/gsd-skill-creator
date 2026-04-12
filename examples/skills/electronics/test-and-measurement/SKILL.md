---
name: test-and-measurement
description: Bench instruments and measurement techniques for electronics — digital multimeter, oscilloscope, logic analyzer, spectrum analyzer, function generator, power supply, and their proper use. Covers probing technique, ground loops, loading effects, trigger modes, FFT mode pitfalls, signal integrity, noise budget analysis, and debugging workflows from "it doesn't work" to "here is the failure mechanism." Use when measuring, debugging, or characterizing any electronic circuit or firmware-hardware interaction.
type: skill
category: electronics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/skills/electronics/test-and-measurement/SKILL.md
superseded_by: null
---
# Test and Measurement

Every electronic system is ultimately debugged at the bench with a small set of instruments. The skill of using them well is not about knowing which button to press but about knowing what quantity you actually want to measure, how to avoid disturbing the circuit by measuring it, and how to read the results through the filter of instrument bandwidth, probe loading, and the occasional ground loop. This skill covers the bench instruments, their proper use, and the systematic workflows that turn "it doesn't work" into "here is the failure."

**Agent affinity:** brattain (experimental technique and surface physics), horowitz (bench practice and debugging intuition)

**Concept IDs:** elec-signal-ac-analysis, elec-sensor-actuator-systems

## The Bench Toolkit

A minimum bench for serious electronics work:

| Instrument | What it measures | Typical specification |
|---|---|---|
| Digital multimeter (DMM) | DC and AC voltage, current, resistance, continuity, sometimes capacitance and frequency | 4.5-6.5 digits, 100 kΩ/V input impedance |
| Oscilloscope | Voltage vs time on 2-4 channels | 100 MHz - 1 GHz bandwidth, 1-5 GS/s |
| Logic analyzer | Digital waveforms on 8-32 channels | 100 MHz - 500 MHz sample rate |
| Function generator | Synthesized waveforms | 20 MHz sine/square/arbitrary |
| DC power supply | Controlled DC voltage and current | 0-30 V, 0-3 A, CV/CC crossover |
| Soldering iron | Temperature-controlled, fine tip for SMT | 250-400 °C adjustable |

Beyond the core, a spectrum analyzer for RF work, an LCR meter for component characterization, a thermal camera for finding hotspots, and a constant-current electronic load for power supply testing round out most benches.

## Technique 1 — The Digital Multimeter

The DMM is the least glamorous and most-used instrument. Four core modes:

**DC voltage.** Non-invasive (high input impedance, 1-10 MΩ). Accurate to a few ppm on quality meters. Always start with voltage measurements before anything invasive.

**DC current.** Requires breaking the circuit and placing the meter in series. The meter's burden voltage (voltage drop across the shunt) can significantly alter the circuit for low-voltage rails. Use the lowest range that accommodates the expected current.

**Resistance.** Only valid on unpowered circuits. The meter supplies a small test current and measures the voltage drop. In-circuit resistance readings are usually wrong because parallel paths distort the result.

**Continuity.** A fast audible indication of short/open. Use it liberally after soldering — continuity and shorts are the two most common assembly defects.

**Gotcha: AC readings on a DMM.** Most handheld DMMs read average-responding, scaled-for-RMS — accurate only for pure sine waves. A true-RMS DMM correctly reports RMS for any waveform shape. For PWM, pulsed, or distorted signals, use a true-RMS meter or an oscilloscope.

## Technique 2 — The Oscilloscope

The oscilloscope plots voltage vs time. Proper use requires understanding bandwidth, sample rate, trigger, and probing.

**Bandwidth.** The 3 dB point of the instrument's frequency response. A 100 MHz oscilloscope attenuates a 100 MHz sine by 30% — more at higher frequencies. For digital edges, the rule of thumb is that bandwidth must be at least 5x the highest frequency of interest, where "frequency of interest" is typically 0.35 / rise_time.

**Sample rate.** How many samples per second per channel the ADC takes. For reliable edge measurements, sample rate should be at least 10x the signal bandwidth.

**Memory depth.** How many samples the scope can store per trigger. Deep memory lets you zoom in on a long acquisition without losing timing detail.

**Trigger modes:**

| Mode | Trigger condition | Use |
|---|---|---|
| Edge | Signal crosses a threshold going up or down | Most common; repeating waveforms |
| Pulse width | Pulse of specified width (equal, greater, less) | Glitch hunting |
| Runt | Pulse that fails to cross both thresholds | Catching weak drivers |
| Serial | Specific byte or protocol pattern | Protocol debug |
| Single | Capture once on trigger | One-shot events |

## Technique 3 — Probing Technique

Probes are easy to overlook and easy to get wrong. The probe is part of the measurement — choose it for the measurement.

**Passive 10x probe.** Most common. The 10x attenuation lets the probe present 10 MΩ input impedance instead of the scope's 1 MΩ, and reduces capacitive loading from 15-20 pF to 8-12 pF. The trade-off is reduced sensitivity.

**Active probe.** FET-input probe with very low input capacitance (1-2 pF) and high bandwidth. Essential for measuring high-speed signals without disturbing them. Expensive and fragile.

**Differential probe.** Two inputs referenced to each other rather than to ground. Essential for measuring signals where both ends are elevated above ground (like across an inductor in a switching converter).

**Current probe.** Measures current without breaking the circuit by sensing the magnetic field around a conductor. Expensive but irreplaceable for high-current measurements.

**The ground clip problem.** The ground lead on a passive probe forms an inductive loop whose resonance is typically 100-300 MHz. Using the alligator ground clip on high-speed signals adds huge artifacts. Use a spring-tip ground or a solder-on probe for edges faster than about 10 ns.

## Technique 4 — Ground Loops and Common-Mode

An instrument connected to a circuit shares a ground reference. Connecting two instruments (say, a DMM and an oscilloscope) via their grounds and via the circuit creates a loop. Current circulating in this loop via line-frequency magnetic fields produces a phantom 60 Hz (or 50 Hz) voltage on every measurement.

**Mitigation.**

- **Isolate where possible.** Battery-powered scopes, optical triggers, differential probes all break the loop.
- **Make the loop small.** Short ground leads minimize the loop area and the induced voltage.
- **Power everything from one outlet.** Equal ground potentials at the wall outlet reduce the driving voltage.
- **Never cut the safety ground on a test instrument to "fix" a ground loop.** This creates a shock hazard. The right fix is an isolation transformer on the device under test.

## Technique 5 — Logic Analyzer

A logic analyzer records many channels (8-32 or more) of digital data simultaneously. Unlike an oscilloscope, it does not show analog detail — it threshold-slices each channel and records timestamped transitions.

**When to reach for a logic analyzer instead of a scope:**

- **Multi-wire protocols.** I2C has two wires; SPI has four; a parallel data bus has 8-64. Scopes have 2-4 channels.
- **Long captures.** Logic analyzers have much deeper memory per channel than scopes.
- **Protocol decoding.** Most analyzers decode I2C, SPI, UART, USB, and other standard protocols into human-readable output.
- **Triggering on complex patterns.** Logic analyzers can trigger on "the third write to register 0x12 after an interrupt" kinds of conditions.

**When to stick with a scope:**

- Any question about voltage levels, rise times, or signal integrity.
- Mixed analog/digital signals.
- Very high-speed signals where the logic analyzer's bandwidth is inadequate.

## Technique 6 — The Debug Workflow

When a circuit doesn't work, the fastest path to root cause follows a systematic sequence, not random probing.

1. **Read the schematic.** Know what the circuit is supposed to do before measuring what it does. Debugging without the schematic is a waste of time.
2. **Check the power rails.** Every rail, everywhere. More bugs are bad power than anything else — wrong voltage, excessive ripple, missing decoupling.
3. **Check the clock.** A missing or wrong clock freezes the entire digital section. Verify frequency, amplitude, and that the clock actually reaches every consumer.
4. **Check the reset.** A stuck or glitching reset leaves the MCU in an undefined state. Verify timing and level.
5. **Check the boot indicators.** Any LED, UART message, or GPIO toggle that the firmware produces early. If these are absent, the CPU isn't executing; check power, clock, reset, and program memory.
6. **Follow the signal path.** Start from a known-good signal and move toward the failure, checking each node against the schematic's expected value.
7. **Minimize.** When the failure is elusive, remove complexity — disconnect loads, reduce clock speed, substitute a known-good section — until the problem either disappears or localizes.
8. **Document what works.** Once the system partially works, note the last-known-good state so regressions are immediately visible.

## Technique 7 — Noise Budget and Signal Integrity

Every measurement carries noise from the source, the circuit, the probe, and the instrument. A good bench engineer has a rough intuition for the noise floor at each stage and is suspicious of measurements close to it.

**Common noise sources:**

| Source | Magnitude | Character |
|---|---|---|
| Thermal (Johnson) noise in a resistor | sqrt(4 * kT * R * BW) | White, unavoidable |
| Shot noise in a junction | sqrt(2 * q * I * BW) | White, depends on current |
| 1/f (flicker) noise | device-dependent | Dominates at low frequency |
| Power supply ripple | 1 mV - 100 mV | Periodic, 50/60 Hz or switcher frequency |
| Digital crosstalk | varies | Correlated with digital activity |
| Ground bounce | varies | Transient, correlated with switching |

**Rule of thumb.** To measure a 1 μV signal you need the noise floor at least 10x lower, meaning your instrument and setup must contribute less than 100 nV RMS. Most benches cannot reach this without a low-noise preamp, shielding, and careful grounding.

## Cross-References

- **circuit-analysis-dc-ac skill:** Provides the theoretical framework for predicting what you are about to measure.
- **semiconductor-device-physics skill:** Explains what bias points you should see at test points.
- **brattain agent:** Primary agent for experimental technique and unusual device characterization.
- **horowitz agent:** Primary agent for practical bench debugging and intuition building.

## References

- Horowitz, P. & Hill, W. (2015). *The Art of Electronics*. 3rd ed. Cambridge University Press, appendix A.
- Williams, J. (1991). *Analog Circuit Design*. Butterworth-Heinemann.
- Johnson, H. & Graham, M. (2003). *High-Speed Signal Propagation*. Prentice Hall.
- Keysight Application Notes. "Oscilloscope Fundamentals" (5989-8064EN).
- Ott, H. (2009). *Electromagnetic Compatibility Engineering*. Wiley.
