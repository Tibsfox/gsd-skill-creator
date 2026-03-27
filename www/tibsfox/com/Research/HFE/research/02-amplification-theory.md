# Amplification Theory -- Power Topology & Class Design

> **Domain:** Hi-Fidelity Audio Engineering
> **Module:** 2 -- Amplification Theory
> **Through-line:** *An amplifier's class defines its relationship with time. Class A stays on all the time -- wasteful, warm, and honest. Class D switches so fast that the gaps between its pulses are shorter than a single audio cycle. The topology determines the distortion signature, and the distortion signature determines what the ear hears.*

---

## Table of Contents

1. [The Amplification Problem](#1-the-amplification-problem)
2. [Class A -- Full Conduction](#2-class-a-full-conduction)
3. [Class B -- Push-Pull](#3-class-b-push-pull)
4. [Class AB -- The Practical Compromise](#4-class-ab-the-practical-compromise)
5. [Class C -- RF and Tuned Loads](#5-class-c-rf-and-tuned-loads)
6. [Class D -- Switching Amplification](#6-class-d-switching-amplification)
7. [Class G and H -- Rail Modulation](#7-class-g-and-h-rail-modulation)
8. [Distortion Signatures by Class](#8-distortion-signatures-by-class)
9. [The Class D Audiophile Evolution](#9-the-class-d-audiophile-evolution)
10. [Analog vs Digital Signal Chains](#10-analog-vs-digital-signal-chains)
11. [Amplifier Specifications and Measurement](#11-amplifier-specifications-and-measurement)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Amplification Problem

A power amplifier takes a line-level signal (~1-2 Vrms) and produces an amplified copy with sufficient voltage and current to drive a loudspeaker. The ideal amplifier would produce a mathematically perfect scaled replica of its input, adding nothing and subtracting nothing. Real amplifiers fail this ideal in specific, measurable, and audible ways that differ by topology [1].

The key metrics:
- **Efficiency:** Ratio of audio output power to total power consumed. The waste is heat.
- **Linearity:** How faithfully the output tracks the input. Non-linearity is distortion.
- **Distortion signature:** Which harmonics are produced, at what levels, and how they vary with frequency, amplitude, and load impedance.

Every amplifier class represents a different point on the efficiency-vs-linearity tradeoff curve. There is no free lunch: higher efficiency always comes with compromises in linearity or complexity.

---

## 2. Class A -- Full Conduction

In a Class A amplifier, the output device(s) conduct current throughout the entire 360 degrees of the input waveform cycle. The bias point is set so that the device is always on -- it never turns off, even with zero input signal. This means the amplifier is always dissipating power, most of it as heat [2].

### Characteristics

- **Conduction angle:** 360 degrees (full cycle)
- **Maximum theoretical efficiency:** 25% (single-ended), 50% (push-pull Class A)
- **Distortion signature:** Predominantly even-order harmonics (2nd, 4th) at low to moderate levels. The smoothest, most natural-sounding distortion profile.
- **Thermal behavior:** At idle, a Class A amplifier dissipates maximum heat. Under full signal, heat dissipation decreases. This is the opposite of every other class.
- **Typical THD at 1 kHz:** <0.025% (well-designed discrete, e.g., Pass Labs)

### Why It Sounds Good

The absence of crossover distortion is the primary advantage. Because the output device never turns off, there is no transition artifact at the zero-crossing point of the waveform. The even-order harmonics that Class A produces are musically consonant -- the second harmonic is one octave above the fundamental, a naturally pleasing interval. Listeners consistently rate even-order distortion as "warm" or "rich" rather than "harsh" or "gritty" [3].

### Practical Limitations

A 100-watt Class A amplifier draws approximately 400 watts from the mains at idle and dissipates 300 watts as heat -- continuously, regardless of whether music is playing. Heat sinks must be massive. Component life is shortened by thermal stress. This is why Class A is reserved for applications where sonic quality justifies the thermal and power cost: high-end studio monitors, mastering suites, and audiophile home systems.

---

## 3. Class B -- Push-Pull

In Class B, two output devices each handle one half of the waveform (180-degree conduction angle). One device handles the positive half-cycle; the other handles the negative half-cycle. Each device turns off completely during the opposite half-cycle [4].

### Characteristics

- **Conduction angle:** 180 degrees
- **Maximum theoretical efficiency:** 78.5%
- **Distortion signature:** Crossover distortion at the zero-crossing point where one device turns off and the other turns on. This produces odd-order harmonics (3rd, 5th, 7th) that are perceptually harsh.
- **Practical use:** Rarely used in pure form for audio. The crossover distortion is unacceptable for hi-fi applications.

### Crossover Distortion

The fundamental problem: as the signal crosses zero volts, there is a brief interval where neither output device is conducting. The signal is effectively disconnected from the load during this transition. The resulting waveform has a "notch" at every zero crossing. This notch is rich in odd-order harmonics, which are perceptually more objectionable than even-order at the same level.

### Why Crossover Distortion Is Especially Audible

Crossover distortion is amplitude-dependent in the worst possible way: it is proportionally highest at the lowest signal levels. At high signal levels, the notch is a small fraction of the waveform amplitude. At low signal levels (quiet passages), the notch becomes a large fraction -- potentially dominating the waveform. This means crossover distortion is most audible during the quietest, most delicate passages of music, exactly when the listener's attention is most focused on nuance. This is the opposite of clipping distortion, which only appears at high levels and is at least predictable in when it occurs.

---

## 4. Class AB -- The Practical Compromise

Class AB biases both output devices to conduct for slightly more than 180 degrees (typically 181-200 degrees), ensuring that both devices are conducting simultaneously in a small region around the zero-crossing point. This eliminates the crossover distortion dead zone of Class B while approaching Class B's efficiency advantage [5].

### Characteristics

- **Conduction angle:** 181-200 degrees
- **Efficiency:** 50-70% (between Class A and Class B)
- **Distortion:** Predominantly even-order at low levels (where both devices are in their Class A overlap region), transitioning to odd-order at higher levels as the signal moves beyond the overlap zone.
- **Thermal behavior:** Heat dissipation increases with signal level (opposite of Class A).
- **Typical THD at 1 kHz:** 0.003-0.05% (consumer); <0.01% (studio)

### The Dominant Topology

Class AB is the most common amplifier topology in consumer audio, professional PA, and studio monitoring. The vast majority of amplifiers sold worldwide are Class AB. The design is well-understood, reliable, and offers a practical balance between efficiency and distortion performance.

---

## 5. Class C -- RF and Tuned Loads

Class C amplifiers conduct for less than 180 degrees of the input cycle. The output is a series of current pulses rather than a continuous waveform. A tuned resonant circuit (tank circuit) at the output reconstructs the sinusoidal signal from these pulses [6].

### Characteristics

- **Conduction angle:** <180 degrees (typically 90-120 degrees)
- **Efficiency:** >78.5%, potentially exceeding 90%
- **Applications:** RF transmitters, radar, microwave amplification
- **Audio suitability:** None. The tuned output circuit works only for a single frequency or narrow band. Audio requires wideband amplification (20 Hz - 20 kHz minimum).

---

## 6. Class D -- Switching Amplification

Class D amplifiers use output transistors as switches -- they are either fully on or fully off, never in the linear region. The input audio signal modulates the duty cycle of a high-frequency switching waveform (PWM -- Pulse Width Modulation), typically at 300 kHz to 1 MHz. A low-pass output filter reconstructs the audio waveform from the PWM signal [7].

### Characteristics

- **Conduction mode:** Switching (not a conduction angle in the traditional sense)
- **Efficiency:** 90-95%+ (the output transistors dissipate minimal power because they are always either fully on or fully off)
- **Distortion sources:** Switching artifacts, dead-time distortion (the brief pause between one transistor turning off and the other turning on), output filter non-idealities, power supply modulation
- **Typical THD at 1 kHz:** 0.01-0.1% (basic designs); <0.001% (modern high-end designs)

### Modern Class D Architecture

Contemporary Class D amplifiers use feedback control loops that measure the output after the low-pass filter and correct errors in real time. Self-oscillating designs (where the switching frequency varies with the signal) can achieve extremely low distortion because the modulator and demodulator are inherently matched. The Purifi Eigentakt module, designed by Bruno Putzeys and Lars Risbo, achieves THD+N below 0.00015% at 1W into 4 ohms -- rivaling or exceeding the best Class A and Class AB designs in measured performance [8].

### Output Filter Design

The low-pass output filter is critical to Class D performance. Its purpose is to reconstruct the audio waveform from the PWM switching signal while rejecting the switching frequency and its harmonics. A typical output filter uses a second-order LC (inductor-capacitor) network with a cutoff frequency between 30-60 kHz -- well above the audio band but well below the switching frequency.

Filter component quality matters enormously. The inductor core material must handle the full switching current without saturating (which would cause distortion). Air-core inductors avoid core saturation entirely but require more turns and create larger magnetic fields. Ferrite cores are compact but must be carefully sized. The capacitor must be a film type (polyester or polypropylene) for low ESR and low dielectric absorption -- electrolytic capacitors are unsuitable for the output filter.

### Dead-Time Distortion

The most significant distortion mechanism in Class D is dead time. Both output transistors cannot be on simultaneously (this would short the power supply rails). A brief dead time (typically 20-100 nanoseconds) is inserted between one transistor turning off and the other turning on. During this dead time, the output is determined by the load current direction, not the input signal -- creating a non-linearity proportional to the dead time relative to the PWM period [9].

Modern designs minimize dead-time distortion through:
- **Shorter dead times** (GaN transistors enable <10 ns)
- **Dead-time compensation circuits** that adjust dead time based on load current direction
- **Self-oscillating topologies** where dead time is inherently minimized by the modulator design

### Thermal Advantage

A Class D amplifier producing 500 watts of output dissipates approximately 25-50 watts as heat (at 90-95% efficiency). The equivalent Class AB amplifier dissipates 250-350 watts as heat. This thermal advantage enables higher power density, smaller enclosures, lighter weight, and reduced cooling requirements. Professional PA systems with 10,000+ watts of total power are practical only with Class D amplification.

---

## 7. Class G and H -- Rail Modulation

Class G and H are variants of Class AB that improve efficiency by modulating the power supply voltage to track the audio signal level.

### Class G: Rail Switching

Multiple fixed power supply rails (e.g., +/-25V and +/-50V). The amplifier operates from the lower rail during quiet passages and switches to the higher rail only when the signal demands it. Efficiency improvement comes from reducing the voltage drop across the output transistors during low-level passages, which is where the amplifier spends most of its time with typical music [10].

### Class H: Rail Modulation

A single continuously variable power supply rail that tracks the envelope of the audio signal. As the signal level increases, the rail voltage increases to provide the necessary headroom. As the signal decreases, the rail drops to minimize waste. More complex than Class G but provides smoother transitions and potentially higher efficiency.

| Class | Conduction | Efficiency | THD Profile | Primary Use |
|-------|-----------|------------|-------------|-------------|
| A | 360 deg | <=25% | Even-order, lowest | Studio monitors, audiophile |
| B | 180 deg | <=78.5% | Crossover (odd) | Not used alone for audio |
| AB | 181-200 deg | 50-70% | Mixed, acceptable | Consumer, PA, studio |
| C | <180 deg | >78.5% | N/A (RF only) | Transmitters, radar |
| D | Switching | 90-95%+ | Switching artifacts | PA, powered speakers, hi-fi |
| G | Rail-switch | 70-85% | AB + switching noise | Pro PA, headphone amps |
| H | Rail-modulate | 75-88% | AB + tracking noise | Pro PA, mobile |

---

## 8. Distortion Signatures by Class

A critical psychoacoustic distinction: even-order harmonics (2nd, 4th, 6th) are generally perceived as more musically pleasant than odd-order harmonics (3rd, 5th, 7th). Higher-order harmonics are disproportionately audible -- the 10th harmonic is far more annoying at equivalent level than the 2nd [11].

### Why Harmonic Order Matters

- **2nd harmonic:** One octave above fundamental. Consonant, musically natural. The dominant distortion product of Class A amplifiers.
- **3rd harmonic:** One octave plus a fifth. Still somewhat consonant but with an edge. The dominant crossover distortion product of Class B and Class AB.
- **5th and above:** Increasingly dissonant intervals. The "gritty" or "harsh" character that listeners associate with poor amplification.
- **Even vs odd summary:** A tube Class A amplifier measuring 0.5% THD (predominantly 2nd harmonic) can sound more musical than a transistor Class AB measuring 0.05% THD (predominantly 3rd and 5th harmonics). The harmonic profile matters more than the total number.

### Measurement vs Perception

This is why THD as a single number is an incomplete specification. Two amplifiers with identical THD figures can sound dramatically different if one produces predominantly even-order harmonics and the other produces predominantly odd-order. Weighted harmonic distortion metrics that penalize higher-order and odd-order harmonics more heavily would be more perceptually accurate but are not yet standardized [12].

---

## 9. The Class D Audiophile Evolution

The historical criticism of Class D amplifiers -- that their PWM switching introduced audible artifacts -- has been substantially resolved by modern designs.

### Expert Positions

**Ralph Karsten, Atma-Sphere (2024):** "Class D can be better [than the other classes]... Right now, Class D can sound as good as Class A or Class AB, whether tube or solid state. It all has to do with distortion. Class D allows the designer to build an amp where the distortion versus frequency is a ruler-flat line across the audio band" [13].

**Greg Stidsen, NAD Director of Technology:** "In a linear amplifier such as Class A or AB, parts-matching and very close tolerances are required to get the best results, and even then, there is a limit to performance since the linearity of semiconductors varies considerably with temperature" [14]. Class D's switching topology is inherently less sensitive to component parameter drift, making it easier to achieve consistent performance across temperature and aging.

**Paul McGowan, PS Audio:** McGowan has documented the evolution of PS Audio's Class D designs from the "interesting but flawed" early Tripath-based amplifiers to the current M1200 hybrid design, which uses a vacuum tube input stage feeding a Class D output stage. The combination leverages tube even-order harmonics for character while using Class D efficiency for power delivery [15].

### Key Modern Class D Products

- **Purifi Eigentakt (1ET400A):** Designed by Bruno Putzeys (also creator of Mola-Mola and Kii Audio amplifiers) and Lars Risbo (co-founder of Purifi). THD+N < 0.00015% at 1W/4 ohm. Self-oscillating topology with multi-loop feedback that corrects output filter errors in real time. The Eigentakt module is widely OEM'd into audiophile amplifiers from manufacturers including NAD, March Audio, VTV Amplifier, and Apollon Audio.
- **NAD C 298:** Stereo power amplifier using Purifi 1ET400A modules in NAD's own implementation. Reviewed in Stereophile and AudioScienceReview as sonically competitive with Class A/AB references costing 3-5x the price. 185W per channel into 8 ohms with measured THD+N of 0.0003% at 1W.
- **Atma-Sphere Class D Monoblocks:** Ralph Karsten's design using GaN-FET output devices. Karsten's decades of experience with OTL (Output Transformer-Less) tube amplifiers informed his Class D topology -- he applied the same focus on distortion profile and speaker interaction that made his tube designs respected. 200W mono, bridgeable.
- **Fosi Audio V3:** Budget Class D using Texas Instruments TPA3255 chip. ~50W per channel, THD+N < 0.02% at rated power. Demonstrates how far even entry-level Class D has come -- performance that would have been considered audiophile-grade 20 years ago, available for under $100.
- **Hypex NC500:** Designed by Bruno Putzeys before he co-founded Purifi. 500W mono module widely used in active speakers and audiophile amplifiers. The NC500 established the template for high-performance Class D modules: self-oscillating topology, integrated power supply, and remarkably low distortion for its power rating.

### The Subjective Frontier

Despite measured performance that meets or exceeds Class A and Class AB, some listeners and reviewers maintain that Class D still sounds "different" -- not necessarily worse, but different. The proposed explanations include: different load-interaction behavior (Class D output impedance is dominated by the output filter, which is reactive), different intermodulation distortion profiles under complex music signals (as opposed to single-tone test signals), and psychoacoustic expectation bias. The debate is ongoing, and it highlights the gap between single-tone measurements and the complex, multi-frequency, dynamic nature of real music.

---

## 10. Analog vs Digital Signal Chains

### The Analog Chain

```
Source -> Preamp -> Console (EQ/Dynamics) -> Analog Tape -> Mixdown -> Master Tape
```

Each stage adds its character: transformer saturation, tube harmonics, tape compression, console summing. The noise floor is cumulative (RSS sum of all stages). Dynamic range is limited by the combined noise floor and headroom of the chain's weakest link. The analog chain is a series of imperfect stages whose imperfections are collectively perceived as "warmth" or "character" [16].

### The Digital Chain

```
Source -> Preamp -> ADC -> DAW (DSP) -> DAC -> Amplifier -> Speaker
```

After the ADC, all processing is mathematically precise within the word length. Adding two digital signals does not add noise. Processing in 32-bit float provides effectively unlimited headroom. The noise floor is fixed at the ADC's quantization noise. The digital chain is transparent -- it adds nothing, which is either a virtue (accuracy) or a deficit (character), depending on your philosophy [17].

### Hybrid Reality

Modern world-class recordings almost universally use hybrid chains: analog front-end (microphone, preamp, sometimes analog EQ/compression) for character, followed by digital conversion for processing flexibility, recall capability, and distribution. The debate over "analog vs digital" is a false dichotomy -- the question is which analog stages add value and where digital precision serves better.

### Analog Summing

A specific hybrid technique: routing individual DAW channel outputs through an external analog summing amplifier (e.g., Dangerous Music 2-Bus+, SSL Sigma, Heritage Audio MCM-32) before returning the stereo sum to the DAW. The claimed benefit is that analog summing produces subtle inter-channel crosstalk and harmonic interactions that digital summing (mathematically perfect floating-point addition) cannot replicate. Measured differences are typically below -80 dB, but proponents argue the subjective improvement is significant, particularly in dense mixes with many simultaneous sources. Whether the difference justifies the cost and complexity remains one of the audio industry's perennial debates.

### Monitoring Amplifier Selection

The monitor amplifier in a studio control room is arguably the most important amplifier in the signal chain -- it is the amplifier through which every mixing and mastering decision is auditioned. Studio monitor amplifiers are typically Class AB (for their established sonic character) or increasingly Class D (for their low heat output in enclosed spaces and consistent performance). Active studio monitors (with built-in amplification, e.g., Genelec, Neumann KH series, Adam Audio) use amplifiers optimized for the specific driver and enclosure, eliminating the user's amplifier selection variable.

---

## 11. Amplifier Specifications and Measurement

### Key Specifications

| Specification | Definition | Good Value (Hi-Fi) |
|--------------|-----------|-------------------|
| Power Output | Continuous watts into rated load | Rated at <0.1% THD |
| THD at 1 kHz | Total Harmonic Distortion | <0.01% (AB), <0.001% (D) |
| THD+N | THD plus broadband noise | <0.005% |
| SNR | Signal to noise ratio | >100 dB (A-weighted) |
| Frequency Response | Bandwidth at -3 dB | 10 Hz - 80 kHz (+/- 0.5 dB) |
| Damping Factor | Load impedance / output impedance | >200 (solid state) |
| Slew Rate | Maximum rate of output voltage change | >40 V/microsecond |

### Measurement Conditions

All amplifier specifications are meaningless without stated measurement conditions. THD varies with frequency, power level, and load impedance. A specification of "0.01% THD" without conditions is marketing, not engineering. Professional specifications always state: frequency (typically 1 kHz), output power (typically rated power or 1 watt), load impedance (4 or 8 ohms), and bandwidth of the measurement (20 Hz - 20 kHz or weighted) [18].

### Damping Factor

Damping factor is the ratio of the speaker impedance to the amplifier's output impedance:

```
Damping Factor = Z_load / Z_output
```

A high damping factor (>200 for solid-state, typically 20-50 for tube) indicates the amplifier has strong control over the speaker cone -- it can stop the cone quickly after a transient, preventing overshoot and ringing. Low damping factor allows the speaker's own resonant behavior to influence the sound. Tube amplifiers' characteristically "loose" bass is partly due to their lower damping factor.

Class D amplifiers present a unique damping factor situation because their output impedance includes the reactive impedance of the output LC filter. At the speaker's resonant frequency, the filter's impedance may be significant, effectively reducing damping factor at the frequency where control matters most. Well-designed Class D amplifiers compensate for this by including the output filter within the feedback loop.

### Power Compression

Power compression is the temporary loss of amplifier output caused by thermal effects under sustained high-power operation. As the output stage heats up, semiconductor parameters shift, and the amplifier delivers less power than it would at room temperature. A typical specification: "power compression at rated output, 1 hour: 1.5 dB" means the amplifier delivers 1.5 dB less power after one hour of continuous operation at rated power than it did at the start.

Class A amplifiers exhibit reverse power compression at the output stage (they cool down under signal), but their power supplies may still compress. Class D amplifiers have minimal power compression due to their low heat dissipation. This is one reason why Class D dominates professional PA -- in a four-hour concert, a Class D amplifier delivers consistent output while a Class AB may lose 1-3 dB over the same period.

---

## 12. Power Supply Design and Its Effect on Amplifier Performance

The power supply is often overlooked in amplifier discussions, but it directly affects distortion, noise, and dynamic capability. The amplifier's output is, fundamentally, a modulated version of its power supply -- any deficiency in the supply appears directly in the output [1].

### Linear Power Supplies

Traditional amplifiers use a transformer, rectifier, and filter capacitor bank. The transformer provides isolation and voltage conversion; the capacitor bank stores energy for instantaneous demand. Large capacitor banks (10,000-40,000 microfarads per rail) provide current reserve for bass transients. The trade-off: linear supplies are heavy, large, and generate heat in the regulator.

### Switch-Mode Power Supplies (SMPS)

Modern Class D amplifiers typically use switch-mode power supplies, which convert mains power at high frequency (50-200 kHz) rather than the mains frequency (50/60 Hz). Advantages: lighter weight, smaller transformer, higher efficiency. Disadvantages: switching noise can appear in the audio output if not properly filtered. Modern SMPS designs with PFC (Power Factor Correction) achieve noise floors comparable to or better than linear supplies.

### Power Supply Rejection Ratio (PSRR)

PSRR measures how well an amplifier rejects noise and ripple on its power supply rails. A well-designed amplifier achieves >80 dB PSRR, meaning 80 dB of power supply ripple attenuation before it reaches the output. Class D amplifiers are inherently more sensitive to power supply variation because the output stage directly modulates the supply rail -- making PSRR a critical design parameter.

## 13. Thermal Management and Reliability

### Heat as the Enemy of Linearity

Semiconductor parameters drift with temperature. As a transistor heats up, its gain changes, its threshold voltage shifts, and its on-resistance increases. In a Class AB amplifier, this thermal drift can cause the bias point to shift, changing the crossover distortion characteristics during a long listening session.

### Thermal Runaway

In Class A and Class AB output stages using bipolar transistors, a dangerous positive feedback loop is possible: as the transistor heats up, its base-emitter voltage decreases, causing it to draw more current, which generates more heat, which further decreases Vbe. Without thermal compensation (typically bias-sensing transistors mounted on the heat sink), this loop can destroy the output devices. MOSFET output stages are inherently more thermally stable because their temperature coefficient is negative -- as they heat up, they draw less current.

### Class A Thermal Behavior -- The Paradox

Class A amplifiers are unusual: they dissipate maximum heat at idle and less heat at full signal. This is because at idle, the full supply current flows through the output devices with no signal work being done -- all energy is waste heat. At full signal, more energy goes into driving the load and less is wasted. This inverted thermal profile means Class A amplifiers must be designed for worst-case (idle) thermal conditions, which is why they require massive heat sinks.

### Practical Thermal Design

| Class | Idle Power Dissipation | Max Signal Dissipation | Heatsink Requirement |
|-------|----------------------|----------------------|---------------------|
| A (100W) | ~400W | ~300W | Massive (natural or forced air) |
| AB (100W) | ~30W | ~200W | Moderate |
| D (100W) | ~5W | ~10W | Minimal (often no heatsink) |

## 14. Negative Feedback -- The Universal Correction Mechanism

### What Feedback Does

Negative feedback takes a fraction of the amplifier's output signal, inverts it, and subtracts it from the input. The error between the desired output and the actual output drives the correction. Applied correctly, feedback reduces distortion, extends bandwidth, reduces output impedance (increases damping factor), and stabilizes gain against component variations [1].

### The Feedback Trade-off

Feedback reduces the magnitude of distortion but cannot eliminate it. High feedback levels (>40 dB) can make the remaining distortion products higher-order (moving energy from 2nd and 3rd harmonics into 5th, 7th, and beyond). Since higher-order harmonics are perceptually more objectionable, excessive feedback can make an amplifier that measures better but sounds worse -- at least on music signals with complex harmonic structures.

### Stability and Feedback

Feedback creates a potential instability: if the phase shift through the amplifier reaches 180 degrees at a frequency where the loop gain is still greater than unity, positive feedback results and the amplifier oscillates. Compensation networks (typically a small capacitor in the feedback loop) ensure that the loop gain drops below unity before the phase shift reaches the critical 180-degree point. The relationship between gain margin and phase margin is described by the Nyquist stability criterion.

### Feedback in Different Classes

- **Class A:** Moderate feedback (20-30 dB) is typical. The inherently low distortion of Class A requires less feedback for good linearity.
- **Class AB:** Higher feedback (30-60 dB) is common to correct crossover distortion.
- **Class D:** The feedback loop must encompass the output filter to correct its errors. This is the fundamental innovation of the Eigentakt and similar self-oscillating designs -- the output filter is inside the loop, not outside it.
- **Zero-feedback designs:** Some audiophile amplifiers (Nelson Pass's First Watt series) use zero global feedback, relying entirely on circuit topology and device selection for linearity. These designs typically have higher measured THD but their proponents argue the distortion is more natural.

## 15. GaN-FET Technology and the Future of Class D

### Gallium Nitride (GaN) Transistors

GaN-FETs are a new semiconductor technology that offers significantly faster switching speeds, lower on-resistance, and lower gate charge compared to traditional silicon MOSFETs. For Class D amplifiers, faster switching means:

- **Lower dead-time distortion:** The brief pause between one output transistor turning off and the other turning on (dead time) is the primary source of distortion in Class D. Faster switching reduces this dead time.
- **Higher switching frequency:** GaN enables switching at 1 MHz+ versus 300-500 kHz for silicon. Higher switching frequency pushes switching artifacts further above the audio band, simplifying output filter design.
- **Lower output impedance:** GaN-FETs have lower Rds(on), reducing resistive losses and improving damping factor.

### Industry Adoption

Infineon's CoolGaN series and EPC's eGaN FETs are being adopted by high-end amplifier manufacturers. The Atma-Sphere Class D monoblocks use GaN output devices. Orchard Audio's Starkrimson amplifiers use GaN exclusively. The technology is still maturing but represents the likely future of high-performance Class D.

## 16. Cross-References

> **Related:** [Signal Capture](01-signal-capture.md) -- the preamp output feeds the amplifier chain. [Mixing & Space](03-mixing-and-space.md) -- console design uses the same amplifier topologies for summing buses. [System Fidelity](06-system-fidelity.md) -- THD and SNR measurement methodology for amplifiers.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Amplifier distortion analysis extends into computational tools
- **SGL (Signal & Light):** DSP-based amplifier modeling and correction
- **LED (LED Engineering):** Class D switching principles shared with LED driver design
- **FQC (Frequency Continuum):** Harmonic analysis and spectral decomposition
- **HFR (High Fidelity Radio):** RF amplifier classes (C) and broadcasting applications

---

## 17. Sources

1. Self, D. *Audio Power Amplifier Design.* 6th ed. Focal Press/Elsevier, 2013.
2. Pass, N. "The Class A Amplifier Site." firstwatt.com, accessed March 2026.
3. Hamm, R.O. "Tubes Versus Transistors -- Is There an Audible Difference?" *Journal of the Audio Engineering Society*, vol. 21, no. 4, pp. 267-273, May 1973.
4. Sedra, A.S. and Smith, K.C. *Microelectronic Circuits.* 8th ed. Oxford University Press, 2020.
5. Self, D. "Distortion in Power Amplifiers." 5th AES Convention Paper, 1996.
6. Krauss, H.L., Bostian, C.W., and Raab, F.H. *Solid State Radio Engineering.* Wiley, 1980.
7. Putzeys, B. "Simple Self-Oscillating Class D Amplifier with Full Output Filter Control." *AES 118th Convention*, Paper 6453, May 2005.
8. Purifi Audio. "1ET400A Eigentakt Amplifier Module Datasheet." purifi-audio.com, Rev 2.1, 2024.
9. Crown Audio. "Amplifier Technology: Class D vs Class AB for Professional Audio." Harman Professional, Application Note, 2022.
10. Sampei, T., et al. "Highest Efficiency and Super Quality Audio Amplifier Using MOS Power FETs in Class G Operation." *IEEE Transactions on Consumer Electronics*, vol. CE-24, no. 3, pp. 300-307, 1978.
11. Temme, S.F. "Audio Distortion Measurements." *AES Monograph*, Audio Precision, 2019.
12. Audio Precision Inc. "Understanding and Measuring THD and THD+N." Application Note AN-5, 2021.
13. Karsten, R. Interview on Class D amplification. *Atma-Sphere Music Systems*, 2024.
14. Stidsen, G. "NAD Class D Technology White Paper." *NAD Electronics*, Lenbrook Industries, 2023.
15. McGowan, P. "The Evolution of Class D at PS Audio." *PS Audio Blog*, psaudio.com, 2024.
16. Huber, D.M. and Runstein, R.E. *Modern Recording Techniques.* 9th ed. Focal Press, 2018.
17. Katz, B. *Mastering Audio: The Art and the Science.* 3rd ed. Focal Press, 2015.
18. IEC 60268-3:2018. "Sound system equipment -- Part 3: Amplifiers." International Electrotechnical Commission.

---

*Hi-Fidelity Audio Engineering -- Module 2: Amplification Theory. The topology determines the distortion signature. The distortion signature determines what the ear hears.*
