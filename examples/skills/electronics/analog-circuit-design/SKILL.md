---
name: analog-circuit-design
description: Design of active analog circuits built around operational amplifiers and discrete gain stages — inverting, non-inverting, difference, and instrumentation topologies, negative feedback and loop stability (gain-bandwidth product, phase margin, compensation), active filters (Sallen-Key, multiple-feedback biquad), sinusoidal and relaxation oscillators, comparators and Schmitt triggers, voltage references (bandgap, shunt, series), and linear versus switching voltage regulators. Covers how to pick a topology, close a feedback loop that stays stable, set gain and bandwidth, and choose a power-conversion approach. Use when designing an amplifier, filter, oscillator, reference, comparator, or regulator, or when reasoning about feedback stability, loop gain, phase margin, or op-amp non-idealities.
type: skill
category: electronics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-07-06
first_path: examples/skills/electronics/analog-circuit-design/SKILL.md
superseded_by: null
---
# Analog Circuit Design

Analog circuit design is the engineering discipline of shaping a continuous signal — amplifying it, filtering it, comparing it, generating it, or regulating a supply that powers it — using active devices wrapped in negative (or, for oscillators, positive) feedback. Where DC/AC circuit analysis tells you how a fixed network *behaves*, analog design is the inverse problem: you specify a gain, a bandwidth, a cutoff, a stability margin, or a rejection ratio, and you synthesize the topology and component values that meet it. The operational amplifier is the central building block because negative feedback lets an imperfect, high-gain device deliver a precise, predictable closed-loop response set almost entirely by passive ratios.

**Agent affinity:** horowitz (topology intuition, worked design examples, bench validation), shockley (device bias, small-signal models, output-stage behavior)

**Concept IDs:** elec-signal-ac-analysis, elec-passive-component-behavior, elec-ohms-law-fundamentals

## The Op-Amp and the Two Golden Rules

An ideal op-amp has infinite open-loop gain, infinite input impedance, zero output impedance, and infinite bandwidth. When it is wrapped in negative feedback and operating in its linear region, two rules follow and carry most first-order design work:

1. **No current flows into the inputs.** The input impedance is effectively infinite, so the feedback and source network sees no load from the op-amp inputs.
2. **The output does whatever it must to drive the two inputs to the same voltage.** This is the *virtual short*. When the non-inverting input sits at a reference, the inverting input is dragged to the same potential (a *virtual ground* if that reference is 0 V).

Every op-amp topology below is derived by applying these two rules plus Ohm's law and KCL at the summing junction. The rules hold only while the loop is closed and the output is not clipping or slewing.

## Technique 1 — The Four Canonical Op-Amp Topologies

**Inverting amplifier.** Input resistor R_in from the source to the inverting node, feedback resistor R_f from output to the inverting node, non-inverting input grounded. The inverting node is a virtual ground, so the closed-loop gain is **-R_f / R_in**. Input impedance equals R_in (the virtual ground makes it low); this is the summing-amplifier building block — multiple input resistors into the same virtual ground sum currents.

**Non-inverting amplifier.** Signal drives the non-inverting input directly; R_g from the inverting node to ground and R_f from output to the inverting node form a divider that feeds back a fraction of the output. Gain is **1 + R_f / R_g**, always ≥ 1, and the input impedance is the op-amp's own (very high). Set R_f = 0 (or R_g = ∞) and you have a unity-gain buffer / voltage follower for impedance isolation.

**Difference (differential) amplifier.** One op-amp with matched resistor pairs amplifies the difference of two inputs: with R_f/R_in on both the inverting path and the non-inverting divider, V_out = (R_f / R_in)(V_+ − V_−). Common-mode rejection depends entirely on resistor matching — a 1% mismatch caps the CMRR near 40–46 dB, which is why the single-op-amp difference amp is rarely used for small differential signals riding on large common-mode.

**Instrumentation amplifier.** Two non-inverting input buffers followed by a difference stage, with a single gain-setting resistor R_G bridging the two buffer feedback nodes: gain = (1 + 2R/R_G) · (difference-stage ratio). It gives very high input impedance on both inputs, gain set by one resistor, and CMRR that does not depend on matching the *input* resistors (the buffers pass common-mode with unity gain). This is the standard front end for bridge sensors, thermocouples, and biopotentials.

**Worked example.** An inverting stage needs a gain of −10 and an input impedance of at least 10 kΩ. Choose R_in = 10 kΩ (sets both the input impedance and the gain denominator) and R_f = 100 kΩ. If the source can also drive a high impedance and you need +10 instead, use a non-inverting stage with R_g = 10 kΩ and R_f = 90 kΩ (gain 1 + 90/10 = 10).

## Technique 2 — Negative Feedback and Loop Stability

**Loop gain.** The behavior of a feedback amplifier is governed by the loop gain T = A·β, where A is the op-amp's open-loop gain and β is the fraction of the output fed back (β = R_g/(R_f+R_g) for the non-inverting topology; the closed-loop gain equals 1/β at low frequency). Large loop gain is what makes closed-loop response insensitive to A — but A rolls off with frequency, and when the loop's phase shift approaches −180° while |T| is still ≥ 1, the negative feedback becomes positive and the amplifier oscillates.

**Gain-bandwidth product (GBW).** A voltage-feedback op-amp is internally compensated to a single dominant pole, so its open-loop gain falls at −20 dB/decade and the product of closed-loop gain and bandwidth is a constant. A part with GBW = 10 MHz configured for a gain of 100 has a closed-loop bandwidth of only 100 kHz. Design the gain first, then confirm the resulting bandwidth is adequate — you cannot have both high gain and high bandwidth from one stage.

**Phase margin.** Phase margin is 180° minus the loop phase shift at the frequency where |T| = 1 (the crossover). A single-pole loop has 90° of margin and never oscillates. Additional poles — from a second op-amp stage, from a capacitive load on the output, or from the op-amp's own secondary pole — eat into the margin. Target ≥ 45° for a usable response; below ~45° the step response rings and the frequency response peaks, and at 0° it oscillates.

**Compensation.** Restore margin by (a) reducing loop gain (raising the noise gain), (b) adding a dominant pole to force crossover before the troublesome pole, or (c) adding a feedback zero to cancel a pole. The classic fixes are a small feedback capacitor across R_f (adds a zero that lifts phase near crossover) and an isolation resistor between the op-amp output and a capacitive load (moves the load pole outside the loop).

**Worked example.** An op-amp with GBW = 4 MHz drives a difference-amp gain of +4 (noise gain 4). Crossover is at 4 MHz / 4 = 1 MHz. If the layout adds a 20 pF load and the output resistance forms a pole near 1 MHz, phase margin collapses; a 20–50 Ω series isolation resistor plus a few-pF feedback cap pushes the margin back above 45°.

## Technique 3 — Active Filters

Active filters use op-amps to realize poles without inductors, providing gain and buffering between stages so sections do not interact.

**Sallen-Key.** A single op-amp (usually a unity-gain follower) with two Rs and two Cs realizes one complex-conjugate pole pair — a second-order low-pass, high-pass, or band-pass section. The cutoff is set by ω_0 = 1/√(R_1 R_2 C_1 C_2) and the quality factor Q by the component ratios. Simple and low-sensitivity at low Q; sensitive and prone to gain error at high Q (Q > ~10).

**Multiple-feedback (MFB) biquad.** An inverting topology with two feedback paths, also second-order, giving an inverting gain and generally better high-Q behavior and stopband rejection than Sallen-Key, at the cost of higher sensitivity of ω_0 to component tolerance. Preferred for band-pass sections and higher-Q low-pass stages.

**Cascading and alignment.** Higher-order filters are built by cascading second-order sections (plus one first-order section for odd orders). The pole-pair Q and frequency of each section come from the chosen alignment: **Butterworth** (maximally flat passband), **Chebyshev** (steeper roll-off, passband ripple), or **Bessel** (maximally flat group delay / clean step response). Pick the alignment from the requirement — flat magnitude, sharpest cutoff, or clean transient — then read the section Qs from a filter table.

**Worked example.** A 2nd-order Butterworth low-pass at f_c = 1 kHz using a unity-gain Sallen-Key: Butterworth Q = 0.707. Choose equal Cs and solve R and the ratio for ω_0 = 2π·1000 and Q = 0.707. The magnitude is flat to the corner and rolls off at −40 dB/decade above it.

## Technique 4 — Oscillators

Oscillators use *positive* feedback: sustained oscillation requires loop gain magnitude ≥ 1 and total loop phase = 0° (360°) at the oscillation frequency — the **Barkhausen criterion**.

**Sinusoidal (linear) oscillators.** A **Wien-bridge** oscillator uses an RC network that has zero phase shift at f = 1/(2πRC) and a non-inverting amplifier set to a gain of exactly 3 to satisfy the loop condition; amplitude is stabilized with a nonlinear element (lamp, JFET, or diode-clamp AGC) so the gain settles just above 3 without clipping. **Phase-shift** and **LC (Colpitts/Hartley)** oscillators are the alternatives at low audio and RF frequencies respectively; a crystal replaces the LC tank when frequency stability matters.

**Relaxation oscillators.** A comparator (or op-amp used open-loop) with positive feedback plus an RC timing network produces a square wave; the RC charges toward the switching threshold, the comparator flips, and the cycle repeats. Frequency is set by the RC time constant and the hysteresis ratio. This is the workhorse for clocks, PWM carriers, and simple tone generators.

**Worked example.** A Wien-bridge with R = 16 kΩ and C = 10 nF oscillates near f = 1/(2π·16k·10n) ≈ 1 kHz; the amplifier is a non-inverting stage whose nominal gain is set slightly above 3 with an AGC element trimming it back to 3 for a clean sinusoid.

## Technique 5 — Comparators and Schmitt Triggers

A **comparator** drives its output to one rail or the other depending on which input is higher; it is used open-loop (no negative feedback) and is often a dedicated part with a fast, rail-to-rail digital output rather than a general-purpose op-amp. Using a slow op-amp as a comparator invites sluggish edges and phase-reversal on input overdrive.

A **Schmitt trigger** adds *positive* feedback so the switching threshold depends on the current output state — two thresholds, an upper and a lower, separated by a hysteresis band. Hysteresis cleans up noisy or slowly-moving signals: once the input crosses the upper threshold and the output flips, noise must fall all the way back below the lower threshold to flip it back, preventing the multiple false transitions ("chatter") a plain comparator produces near its threshold. Set the hysteresis width from the expected noise amplitude via the positive-feedback divider ratio.

**Worked example.** A non-inverting Schmitt trigger with output rails at ±5 V and a positive-feedback divider of R_1 = 10 kΩ (to the reference) and R_2 = 100 kΩ (from output) has thresholds at roughly ±(R_1/R_2)·V_out ≈ ±0.5 V around the reference — comfortably wider than a few tens of millivolts of input noise.

## Technique 6 — Voltage References

A voltage reference produces a stable, low-drift output independent of supply and load — the anchor for ADCs, DACs, and regulators.

**Bandgap reference.** Sums a voltage with a negative temperature coefficient (a diode/base-emitter junction, ~−2 mV/°C) with a scaled "PTAT" voltage that has a positive coefficient (from the ΔV_BE of two junctions at different current densities). Tuned so the coefficients cancel, the sum sits near the silicon bandgap (~1.2 V) with very low temperature drift. This is the dominant on-chip reference.

**Shunt vs. series references.** A **shunt** reference behaves like a precision Zener — a two-terminal device fed through a resistor, drawing whatever current is needed to hold its terminal voltage; simple and tolerant of wide supply swings but continuously burns bias current. A **series** reference is a three-terminal regulator-like part that draws only its own quiescent current plus the load, more efficient and the usual choice for battery-powered designs. Specify a reference by **initial accuracy**, **temperature coefficient (ppm/°C)**, **output noise**, and **load/line regulation** — not just nominal voltage.

## Technique 7 — Linear vs. Switching Regulators

Both take an input voltage and produce a regulated output; they trade efficiency against noise and complexity.

**Linear regulator.** A pass transistor in series with the load, controlled by a feedback loop comparing a divided output against a reference, drops the excess voltage as heat. Efficiency ≈ V_out/V_in, so a 5 V→3.3 V drop is ~66% but a 12 V→3.3 V drop wastes most of the power. Linear regulators are quiet (no switching ripple), cheap, and simple — ideal for low-dropout post-regulation of noise-sensitive analog rails. A **low-dropout (LDO)** variant works with only a few hundred millivolts of headroom but needs attention to its output-capacitor ESR for loop stability.

**Switching regulator.** Stores energy in an inductor and chops it at high frequency, controlling the duty cycle to regulate the output. Because the pass element is either fully on or fully off, efficiency is typically 85–95% regardless of the conversion ratio, and topologies can step **down (buck)**, step **up (boost)**, or **invert/buck-boost**. The cost is switching ripple and EMI, a more complex compensated control loop, and layout sensitivity (the high-di/dt loop must be kept tight).

**Choosing.** Use a **linear/LDO** regulator when the input-to-output drop and load current are small, when cost/board area is tight, or when output noise must be minimal (analog and RF supplies). Use a **switcher** when the drop or current is large enough that a linear regulator's dissipation is unacceptable, or when stepping up. A common architecture is a switcher for the bulk conversion followed by an LDO to scrub ripple off a sensitive rail.

**Worked example.** Powering a 3.3 V, 1 A analog load from 12 V: a linear regulator dissipates (12 − 3.3)·1 = 8.7 W (needs a heatsink, ~27% efficient). A buck converter at 90% delivers the same 3.3 W while dissipating ~0.37 W — followed, if the ADC rail is noise-critical, by a small LDO from 3.3 V rough to 3.0 V clean.

## Decision Guidance — Which Building Block?

1. **Need to scale or buffer a signal?** Pick an op-amp topology by source impedance and sign: non-inverting/buffer for high input impedance, inverting for summing at a virtual ground, difference/instrumentation for a differential source.
2. **Amplifier rings, peaks, or oscillates?** It is a stability problem — check GBW-limited bandwidth and phase margin, then compensate (feedback cap, output isolation resistor, raise noise gain).
3. **Need to pass or reject a frequency band?** Use an active filter; pick Sallen-Key for low Q and MFB for high Q/band-pass, and choose Butterworth/Chebyshev/Bessel by the magnitude-vs-transient requirement.
4. **Need to generate a waveform?** Wien-bridge/LC for a clean sinusoid, relaxation (comparator + RC) for a square wave or PWM.
5. **Need a clean 1-bit decision from an analog level?** Comparator; add Schmitt hysteresis if the input is noisy or slow.
6. **Need a stable DC anchor?** Voltage reference — bandgap on-chip, shunt for simplicity, series for efficiency; spec by tempco and noise.
7. **Need to make a supply rail?** Linear/LDO for small drop or low noise, switcher for large drop, high current, or step-up.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Expecting full GBW gain at high frequency | Gain-bandwidth is constant; high gain means low bandwidth | Compute closed-loop BW = GBW / closed-loop gain and confirm it meets spec |
| Ignoring phase margin with a capacitive load | The load adds a pole inside the loop → ringing or oscillation | Add a series isolation resistor and/or a feedback capacitor |
| Using a single-op-amp difference amp for small differential signals | CMRR is limited by resistor matching (~40 dB at 1%) | Use an instrumentation amplifier |
| Using a general-purpose op-amp as a comparator | Slow edges, possible input phase-reversal, no defined logic output | Use a dedicated comparator; add hysteresis for noisy inputs |
| Comparator chatter near threshold | No hysteresis → noise crosses the threshold repeatedly | Add positive feedback (Schmitt trigger) sized to the noise |
| Sizing a linear regulator for a large V_in−V_out drop | Dissipation = (V_in − V_out)·I_load can be many watts | Use a switching regulator, or pre-regulate with a switcher |
| Specifying a reference by nominal voltage only | Drift and noise dominate real accuracy | Specify tempco (ppm/°C), initial accuracy, and output noise |
| Assuming Barkhausen gain = 1 gives a clean sine | Exactly 1 is unstable in practice; >1 clips | Set gain slightly high and stabilize amplitude with an AGC/clamp |

## Cross-References

- **circuit-analysis-dc-ac skill:** Supplies the nodal/mesh/phasor and Bode-plot machinery used to derive every closed-loop gain and stability margin here.
- **semiconductor-device-physics skill:** Explains the transistor small-signal models behind op-amp input stages, output stages, and discrete gain blocks.
- **signal-processing-dsp-basics skill:** Continues into the sampled domain, where these active anti-alias filters and references feed converters.
- **shockley agent:** Applies device bias and output-stage limits (slew rate, output swing, drive current) to real op-amp selection.
- **horowitz agent:** Teaches topology intuition and bench-validation workflow from the Art of Electronics analog chapters.

## References

- Horowitz, P. & Hill, W. (2015). *The Art of Electronics*. 3rd ed. Cambridge University Press.
- Sedra, A. & Smith, K. (2015). *Microelectronic Circuits*. 7th ed. Oxford.
- Franco, S. (2015). *Design with Operational Amplifiers and Analog Integrated Circuits*. 4th ed. McGraw-Hill.
- Mancini, R. (ed.) (2003). *Op Amps for Everyone*. Texas Instruments / Newnes.
- Williams, J. (ed.) (1991). *Analog Circuit Design: Art, Science, and Personalities*. Butterworth-Heinemann.
