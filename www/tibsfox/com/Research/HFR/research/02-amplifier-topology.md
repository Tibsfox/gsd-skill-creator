# Amplifier Topology & Circuit Design

> **Domain:** Analog Electronics
> **Module:** 2 -- Power Amplification and the Signal Chain
> **Through-line:** *The amplifier is the muscle of the audio chain -- it takes a millivolt-level signal and delivers the watts of current needed to move a speaker cone against the resistance of air. But muscle without control is violence. The art of amplifier design is delivering power with precision: vanishingly low distortion, flat frequency response from DC to daylight, and absolute authority over the speaker's motion. The topology you choose -- Class A, AB, D, or vacuum tube -- determines which laws of physics you exploit and which compromises you accept.*

---

## Table of Contents

1. [The Amplification Problem](#1-the-amplification-problem)
2. [Class A: The Purist's Topology](#2-class-a-the-purists-topology)
3. [Class AB: The Practical Compromise](#3-class-ab-the-practical-compromise)
4. [Class D: Switching Amplification](#4-class-d-switching-amplification)
5. [Vacuum Tube Amplifiers](#5-vacuum-tube-amplifiers)
6. [Negative Feedback Theory](#6-negative-feedback-theory)
7. [Damping Factor and Speaker Control](#7-damping-factor-and-speaker-control)
8. [Distortion Mechanisms](#8-distortion-mechanisms)
9. [Power Supply Design for Audio](#9-power-supply-design-for-audio)
10. [Amplifier Measurement and Specifications](#10-amplifier-measurement-and-specifications)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Amplification Problem

An audio power amplifier must perform a deceptively simple task: reproduce the input signal at a higher power level with no alteration. The input is typically 1-2V RMS from a preamplifier or DAC. The output must deliver 10-200W into a reactive, frequency-dependent load (the loudspeaker) whose impedance can swing from 4 ohms to 100 ohms within a single octave [1].

The amplifier must maintain linearity across a dynamic range exceeding 100 dB (a power ratio of 10,000,000,000:1), a frequency range of 20 Hz to 20 kHz (three decades), and load impedances from 2 ohms (paralleled speakers) to open circuit. It must do this while dissipating potentially hundreds of watts of heat, rejecting power supply noise by 80+ dB, and maintaining stability with the complex reactive load a loudspeaker presents.

```
AMPLIFIER CLASSES -- CONDUCTION ANGLE OVERVIEW
================================================================

  Class A:   Output devices conduct for full 360 degrees of the signal
             Max theoretical efficiency: 25% (transformer coupled)
                                         50% (complementary)

  Class AB:  Output devices conduct for 180-360 degrees
             Crossover region biased into Class A
             Max theoretical efficiency: 78.5%

  Class B:   Output devices conduct for exactly 180 degrees
             Max theoretical efficiency: 78.5%
             Crossover distortion at zero crossing

  Class D:   Output devices switch fully on or fully off
             Max theoretical efficiency: 100% (theoretical)
             Actual: 85-95% with real switches

  Class G/H: Rail-switching variants of Class AB
             Efficiency: 50-70% typical
```

> **SAFETY WARNING:** Audio power amplifiers operate at potentially lethal voltage levels. A 200W/8-ohm amplifier has rail voltages of +/- 56V DC. Vacuum tube amplifiers operate at 300-500V DC on the plates. These voltages can cause fatal electric shock. Output transformer-coupled tube amplifiers must never be operated without a speaker load connected -- the flyback voltage from the unloaded transformer can destroy the output tubes and present a shock hazard [2].

---

## 2. Class A: The Purist's Topology

### Operating Principle

In a Class A amplifier, the output transistor(s) conduct current throughout the entire signal cycle. The quiescent (no-signal) bias current is set at least as high as the peak output current, ensuring the device never approaches cutoff. This eliminates crossover distortion entirely -- there is no transition between conducting and non-conducting states [3].

### The Thermodynamic Cost

Class A's linearity comes at a severe thermodynamic price. The quiescent power dissipation equals the maximum output power, regardless of whether any signal is present. A Class A amplifier rated at 25W into 8 ohms dissipates 25W as heat with no signal and peaks at 50W total dissipation at full output (25W to speaker + 25W to heat). The maximum theoretical efficiency is 25% for transformer-coupled single-ended designs and 50% for push-pull complementary designs [4].

```
CLASS A POWER DISSIPATION
================================================================

  Single-ended, transformer coupled:
    P_dissipated = V_cc * I_q          (always)
    P_output_max = V_cc * I_q / 4      (at full signal)
    Efficiency_max = 25%

  Push-pull complementary:
    P_dissipated = 2 * V_cc * I_q      (at idle)
    P_output_max = V_cc * I_q          (at full signal)
    Efficiency_max = 50%

  Example: 25W Class A into 8 ohms (push-pull)
    V_peak = sqrt(2 * 25 * 8) = 20V
    I_peak = 20V / 8 = 2.5A
    I_q >= 2.5A (quiescent bias)
    V_rail >= 20V + headroom = ~28V
    P_idle = 2 * 28 * 2.5 = 140W (all heat!)
```

This is why Class A amplifiers of serious power rating require massive heatsinks, often operate warm enough to serve as room heaters, and are physically large relative to their output power. The Pass Labs XA25, a modern reference Class A design, weighs 21 kg and produces 25W per channel [5].

### Sonic Character

Class A amplifiers are prized for their subjective sonic character: the absence of crossover distortion produces a "seamless" quality through the zero-crossing region where music signals spend most of their time. The distortion spectrum is dominated by even-order harmonics (primarily 2nd), which are musically consonant. Critics note that the efficiency penalty and heat generation make Class A impractical for high-power applications [6].

---

## 3. Class AB: The Practical Compromise

### Biasing Into Class A for Small Signals

Class AB operation sets the quiescent bias current high enough that both output devices conduct simultaneously for small signals (operating in Class A), but allows them to alternate for large signals (transitioning to Class B). The bias point is chosen so that the Class A region extends to a few watts of output -- enough to cover the vast majority of typical listening levels [7].

### Crossover Distortion

The critical design challenge in Class AB is the transition from the Class A region (both devices conducting) to the Class B region (only one device conducting). At this transition, the combined transfer characteristic of the output stage develops a kink -- a rapid change in gain that produces high-order distortion products. This "crossover distortion" is most audible at low listening levels where the signal spends more time in the transition region [8].

The Vbe multiplier (bias servo) circuit maintains a constant voltage across the output transistor bases, tracking temperature to prevent thermal runaway while holding the crossover region as linear as possible. The precision of this bias circuit is one of the most critical aspects of Class AB amplifier design.

### Practical Class AB Design

Modern Class AB amplifiers achieve remarkable performance: THD+N below 0.001%, signal-to-noise ratios exceeding 120 dB, frequency response flat from 2 Hz to 200 kHz, and output power from 50W to 500W per channel. The theoretical maximum efficiency of 78.5% is approached only at full power; at typical listening levels (1-5W average), efficiency is typically 20-40% [9].

```
CLASS AB OUTPUT STAGE -- COMPLEMENTARY EMITTER FOLLOWER
================================================================

                    +Vcc (+45V)
                      |
                    [NPN output transistor Q1]
                      |
  Input -->--[Vbe]---+---> Output to speaker
             [bias]   |
                      |
                    [PNP output transistor Q2]
                      |
                    -Vcc (-45V)

  Quiescent point: Both Q1 and Q2 conduct ~50-100mA
  Small signals: Both conduct (Class A operation)
  Large signals: Only one conducts at a time (Class B)
  Transition: Bias network keeps crossover smooth
```

---

## 4. Class D: Switching Amplification

### Pulse-Width Modulation

Class D amplifiers use output devices as switches, operating in either the fully-on or fully-off state. The audio signal modulates the width of a high-frequency rectangular wave (PWM -- Pulse Width Modulation). The average value of the PWM signal tracks the input audio waveform. A low-pass output filter removes the switching frequency, leaving only the amplified audio [10].

```
CLASS D PWM OPERATION
================================================================

  Triangle wave   Audio input    PWM output
  (carrier)       (modulator)    (to filter)

      /\              ___          ___
     /  \            /   \        |   |
    /    \          /     \       |   |     |
   /      \        /       \      |   |     |
  /        \------/         \-----|   |-----|----
                                              |
                                              v
                                    LC output filter
                                              |
                                              v
                                         Speaker

  Switching frequency: 300kHz - 1MHz (typical)
  Output filter: 2nd or 4th order LC low-pass
  Cutoff: ~50-80kHz (well above audio band)
```

### Efficiency

Because the output transistors are either fully on (saturated, minimal voltage drop) or fully off (no current flow), the theoretical power dissipation is zero. In practice, switching losses during transitions, resistive losses in the on-state, and output filter losses result in efficiencies of 85-95% -- dramatically higher than Class A or AB [11].

This efficiency advantage has made Class D dominant in applications where heat dissipation is constrained: portable speakers, automotive audio, powered studio monitors, subwoofer amplifiers, and professional sound reinforcement. Modern Class D designs (Purifi, Hypex, ICEpower) achieve THD+N below 0.0005% -- matching or exceeding the best Class AB designs [12].

### The Self-Oscillating Topology

Advanced Class D designs (such as those by Bruno Putzeys at Purifi) use self-oscillating modulation rather than a fixed-frequency triangle wave. The switching frequency varies with the input signal, providing inherently higher loop gain at audio frequencies and dramatically reducing distortion. The Purifi Eigentakt module achieves 0.00017% THD at 1W -- a level previously achievable only by the finest Class A designs [13].

### EMI and Output Filter Considerations

The high-frequency switching generates electromagnetic interference (EMI) that must be carefully managed. The output filter (typically a second-order or fourth-order LC network) must attenuate the switching frequency by 40-60 dB while presenting a benign impedance to the speaker. Filter design must account for the speaker's complex impedance, which varies with frequency -- an output filter designed for a resistive load may ring or oscillate with a real speaker [14].

---

## 5. Vacuum Tube Amplifiers

### Thermionic Emission Physics

The vacuum tube (valve) operates on the principle of thermionic emission: heating a cathode causes electrons to boil off into a vacuum, forming a space charge. A positive voltage on the plate (anode) attracts these electrons, creating a current. A control grid between cathode and plate modulates this current flow -- a small voltage change on the grid produces a large change in plate current, providing voltage gain [15].

### Triode vs Pentode

The **triode** (three elements: cathode, grid, plate) was the first amplifying device, invented by Lee De Forest in 1906. Triodes have high plate resistance, moderate gain (mu = 10-100), and generate predominantly even-order harmonics (primarily 2nd). The distortion characteristic is "soft" -- the transfer curve rolls gently into compression rather than clipping sharply [16].

The **pentode** (five elements: cathode, control grid, screen grid, suppressor grid, plate) offers higher gain (mu = 100-2000) and higher plate resistance, but generates a more complex distortion spectrum with significant odd-order harmonics. Pentode distortion sounds "harder" and is preferred in guitar amplifiers but controversial in hi-fi designs [17].

### Output Transformer Coupling

Vacuum tubes operate at high voltage and low current (typically 300V/100mA), while speakers require low voltage and high current (20V/2.5A for 25W into 8 ohms). An output transformer performs the impedance transformation. The transformer's core material (grain-oriented silicon steel, amorphous metal, or nanocrystalline), winding technique, and interlayer insulation determine bandwidth, distortion, and transient response [18].

```
TUBE AMPLIFIER OUTPUT STAGE -- PUSH-PULL
================================================================

                    +B (300-500V DC)
                        |
                    [Output Transformer]
                    Primary: Center-tapped
                        |
              +---------+---------+
              |                   |
          [Tube V1]           [Tube V2]
          (signal +)          (signal -)
              |                   |
              +---[Cathode R]----+
                      |
                     GND

  The push-pull configuration cancels even-order harmonics
  in the transformer primary, reducing THD by 10-20dB
  compared to single-ended operation.

  Common output tube types:
    EL34:   25W/pair, warm British character
    KT88:   50W/pair, extended bass, American high-power
    6L6:    25W/pair, classic American, Fender character
    300B:   8W single-ended, triode holy grail
    2A3:    3.5W single-ended, purist triode
```

### Single-Ended Triode (SET) Amplifiers

The single-ended triode amplifier uses a single output tube (no push-pull cancellation) operating in Class A. It produces the highest proportion of 2nd harmonic distortion (typically 3-8% at rated power) and the lowest power output (2-8W). Despite -- or because of -- these technical limitations, SET amplifiers paired with high-efficiency horn speakers are revered by a segment of the audiophile community for their midrange transparency and natural timbre [19].

The 300B directly heated triode (originally designed by Western Electric in 1938 for telephone line amplification) remains the most prized SET output tube. Modern 300B tubes are manufactured by Elrog (Germany), KR Audio (Czech Republic), and several Chinese manufacturers.

---

## 6. Negative Feedback Theory

### The Feedback Principle

Harold Stephen Black invented the negative feedback amplifier at Bell Labs in 1927 (patented 1937). The principle: sample a fraction of the output signal and subtract it from the input. The resulting reduction in gain is traded for reduced distortion, extended bandwidth, and reduced output impedance [20].

```
NEGATIVE FEEDBACK -- BLOCK DIAGRAM
================================================================

  Input (+) --> [Summing junction] --> [Open-loop gain A] --> Output
                     ^(-) |
                     |    |
                     +----[Feedback network beta]<----+

  Closed-loop gain: Acl = A / (1 + A*beta)
  Distortion reduction: D_cl = D_ol / (1 + A*beta)
  Output impedance: Zout_cl = Zout_ol / (1 + A*beta)
  Bandwidth extension: BW_cl = BW_ol * (1 + A*beta)

  Where:
    A = open-loop gain (typically 60-100dB)
    beta = feedback fraction (typically 0.01-0.1)
    A*beta = loop gain (the crucial parameter)
```

### The Feedback Controversy

Negative feedback is the most debated topic in amplifier design. Proponents cite its measurable benefits: distortion reduction by 20-40 dB, output impedance reduction (increasing damping factor to 100-1000), and bandwidth extension. Critics argue that feedback can introduce transient intermodulation distortion (TIM) if the open-loop bandwidth is insufficient, and that it alters the harmonic distortion spectrum from benign low-order to potentially harsh high-order components [21].

The resolution lies in implementation quality: an amplifier with high open-loop bandwidth, stable phase margin, and sufficient loop gain at all audio frequencies benefits enormously from feedback. An amplifier with marginal open-loop performance may indeed sound worse with feedback than without it. Modern designs achieve open-loop bandwidths of 200 kHz to 2 MHz, rendering the TIM concern moot [22].

### Zero-Feedback Designs

Several notable amplifier designers (Nelson Pass, Jean Hiraga, Shigeru Murashima) have championed zero-feedback designs that rely entirely on the intrinsic linearity of the output devices. These designs typically use carefully selected JFETs, MOSFETs, or vacuum tubes operated in their most linear region, with deliberate avoidance of global negative feedback. The resulting amplifiers tend toward higher distortion figures (0.1-1% THD) but with a distortion spectrum dominated by low-order, musically consonant harmonics [23].

---

## 7. Damping Factor and Speaker Control

### Definition and Physics

Damping factor is the ratio of the speaker's nominal impedance to the amplifier's output impedance:

```
DF = Z_speaker / Z_amplifier_output

Example:
  8 ohm speaker / 0.01 ohm output impedance = 800 (typical solid-state)
  8 ohm speaker / 2 ohm output impedance = 4 (typical tube amp)
```

A high damping factor means the amplifier presents a near-short-circuit to the speaker's back-EMF, providing electromagnetic braking that controls cone motion after the driving signal ceases. This is particularly important at the speaker's resonant frequency, where the cone's tendency to ring is greatest [24].

### Practical Significance

The damping factor that matters is not the amplifier's output impedance alone, but the total source impedance including speaker cables. A 10-meter run of 1.5mm2 speaker cable adds approximately 0.24 ohms to the source impedance. If the amplifier has 0.01 ohm output impedance, the cable resistance dominates -- the effective damping factor drops from 800 to 33. This is why short, heavy-gauge speaker cables matter more than exotic amplifier specifications [25].

### Tube Amplifiers and Damping

Tube amplifiers with output transformers typically have damping factors of 2-10. This lower damping factor means the amplifier exercises less control over the speaker's resonant behavior, allowing more of the speaker's own character into the sound. This interaction between tube amplifier output impedance and speaker impedance curve is a significant contributor to the "tube sound" -- the amplifier and speaker form a more interactive, less deterministic system [26].

---

## 8. Distortion Mechanisms

### Total Harmonic Distortion (THD)

THD measures the ratio of harmonic distortion products to the fundamental signal, expressed as a percentage or in dB:

```
THD = sqrt(V2^2 + V3^2 + V4^2 + ... + Vn^2) / V1

Where Vn is the amplitude of the nth harmonic

Typical THD values:
  State-of-art Class D:   0.0002% (-114 dB)
  Reference Class AB:     0.001% (-100 dB)
  Good Class A:           0.01% (-80 dB)
  SET tube amplifier:     3-8% (-30 to -22 dB)
  Human audibility:       ~0.1% for low-order harmonics
                          ~0.01% for high-order harmonics
```

### Intermodulation Distortion (IMD)

IMD occurs when two or more signals interact in a nonlinear device, producing sum and difference frequencies that are not harmonically related to either input. A 19 kHz + 20 kHz two-tone test reveals IMD products at 1 kHz (difference) and 39 kHz (sum). The 1 kHz product falls in the middle of the audible band and is not masked by the input signals, making IMD potentially more audible than THD at equivalent levels [27].

### Transient Intermodulation Distortion (TIM)

TIM (also called slew-induced distortion or SID) occurs when a fast transient signal exceeds the amplifier's slew rate, causing the feedback loop to momentarily open as the output cannot track the input. The resulting distortion burst is brief but rich in high-order, inharmonic products. TIM was identified by Matti Otala in 1970 and sparked a debate about feedback design that reshaped amplifier engineering [28].

Modern amplifiers address TIM through: high slew rates (50-200 V/microsecond vs the 1-5 V/microsecond of 1970s designs), wide open-loop bandwidth, input bandwidth limiting (preventing transients faster than the amplifier can follow), and sufficient phase margin in the feedback loop.

### The Distortion Spectrum

Not all distortion is equally audible. Research by Earl Geddes and Lidia Lee (AES, 2003) showed that the audibility of distortion depends strongly on the order of the harmonics, not just the total level. Low-order harmonics (2nd, 3rd) are far less audible than high-order harmonics (7th, 9th, 11th) at the same level, because low-order harmonics are present in natural sounds and the auditory system is adapted to them [29].

This finding has significant implications for amplifier design philosophy: a Class A amplifier with 0.5% 2nd-harmonic distortion may sound cleaner than a feedback-rich amplifier with 0.01% THD whose distortion spectrum is dominated by high-order products.

---

## 9. Power Supply Design for Audio

### The Power Supply as Part of the Amplifier

The power supply is not an accessory -- it is an integral part of the amplifier's signal path. Every watt delivered to the speaker comes from the power supply, modulated by the output stage. Power supply ripple, noise, regulation, and transient response directly affect the amplifier's noise floor, dynamic performance, and distortion [30].

### Linear vs Switch-Mode Power Supplies

**Linear power supplies** (transformer, rectifier, filter capacitors, optional voltage regulator) are traditional in audio. They produce very low noise and ripple (after filtering) but are heavy, bulky, and 50-65% efficient. A 200W amplifier requires a transformer weighing 3-5 kg and filter capacitors totaling 20,000-80,000 microfarads [31].

**Switch-mode power supplies (SMPS)** use high-frequency switching (50-500 kHz) to achieve voltage conversion at 85-95% efficiency with dramatically reduced size and weight. Modern SMPS designs (such as those used in Hypex and ICEpower Class D modules) achieve noise and ripple performance comparable to linear supplies. The key is careful EMI filtering and layout to prevent switching noise from contaminating the audio signal [32].

### Capacitor Banks and Energy Storage

The filter capacitor bank stores energy to deliver instantaneous current during signal peaks. The capacitor bank must supply the peak current for the duration of the signal transient until the rectifier and transformer can respond. For a 200W amplifier driving bass transients at 50 Hz:

```
ENERGY STORAGE CALCULATION
================================================================

  Peak output current: I_peak = sqrt(2 * P / R) = sqrt(2 * 200 / 4) = 10A
  Duration of half-cycle at 50 Hz: 10ms
  Required charge: Q = I * t = 10 * 0.01 = 0.1 coulombs
  Voltage droop budget: 2V (acceptable ripple)
  Required capacitance: C = Q / V = 0.1 / 2 = 50,000 uF

  This is why high-power amplifiers have massive capacitor banks.
```

---

## 10. Amplifier Measurement and Specifications

### Key Specifications

| Parameter | Definition | Reference Standard |
|-----------|-----------|-------------------|
| THD+N | Total harmonic distortion plus noise | IEC 60268-3 |
| IMD (SMPTE) | 60 Hz + 7 kHz, 4:1 ratio | SMPTE RP120 |
| IMD (CCIF) | 19 kHz + 20 kHz, 1:1 ratio | IEC 60268-3 |
| SNR | Signal-to-noise ratio (A-weighted) | IEC 60268-3 |
| Damping factor | Z_load / Z_output | AES17-2020 |
| Slew rate | Maximum dV/dt at output | V/microsecond |
| Frequency response | -3dB points at rated power | IEC 60268-3 |
| Crosstalk | Channel separation | IEC 60268-3 |
| PSRR | Power supply rejection ratio | dB at 100/120 Hz |

### The Measurement-Listening Gap

The relationship between measured specifications and perceived sound quality is one of the most contentious topics in audio engineering. Amplifiers that measure identically can sound different to trained listeners in controlled comparisons, while amplifiers with dramatically different specifications may sound identical. The resolution is that standard measurements (single-frequency THD, broadband SNR) do not capture all perceptually relevant distortion mechanisms [33].

Recent research has focused on multitone distortion analysis, dynamic intermodulation testing, and frequency-dependent THD curves as better predictors of audible performance. The Audio Precision APx555 analyzer can perform 32-tone multitone analysis that reveals distortion mechanisms invisible to single-tone testing [34].

### Listening Tests and DBT

The double-blind test (DBT) is the gold standard for evaluating subjective audio differences. In a properly controlled DBT, neither the listener nor the test administrator knows which amplifier is playing. Statistical analysis (typically using a binomial or paired t-test) determines whether the listener can reliably distinguish between amplifiers. The AES has published guidelines for conducting listening tests (AES20-1996) [35].

---

## 11. Cross-References

> **Related:** [Speaker Physics](01-speaker-physics-transducers.md) -- impedance interaction, damping factor effects, crossover integration. [DAC Architectures](03-dac-architectures-digital-path.md) -- preamplifier interface, gain staging. [Room Acoustics](04-room-acoustics-psychoacoustics.md) -- power requirements for room volume, SPL targets.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** THD and IMD measurement methodology; distortion spectrum analysis
- **SGL (Signal & Light):** DSP implementation of digital amplifier control loops; Class D modulation theory
- **LED (LED & Controllers):** Current-source driver parallels with Class D output stages
- **EMG (Electric Motors):** H-bridge topology shared with Class D output stages
- **FQC (Frequency Continuum):** Harmonic series and distortion product analysis
- **BPS (Sensor Physics):** Thermal management; heatsink design for power dissipation

---

## 12. Sources

1. Self, D. *Audio Power Amplifier Design*. 6th ed. Focal Press, 2013.
2. IEC 60065. "Audio, Video and Similar Electronic Apparatus -- Safety Requirements." International Electrotechnical Commission.
3. Pass, N. "The Zen Amplifier." *The Audio Amateur*, 1994.
4. Leach, W.M. *Introduction to Electroacoustics and Audio Amplifier Design*. 4th ed. Kendall Hunt, 2010.
5. Pass Labs. "XA25 Technical Specifications." 2018.
6. Cordell, B. *Designing Audio Power Amplifiers*. 2nd ed. McGraw-Hill, 2019.
7. Oliver, B.M. "Distortion in Complementary-Pair Class B Amplifiers." *Hewlett-Packard Journal*, February 1971.
8. Baxandall, P.J. "Audio Power Amplifier Design." *Wireless World*, December 1978.
9. Cordell, B. "A MOSFET Power Amplifier with Error Correction." *J. Audio Eng. Soc.*, vol. 32, no. 1/2, 1984.
10. Putzeys, B. "Simple Self-Oscillating Class D Amplifier with Full Output Filter Control." AES Convention Preprint 6453, 2005.
11. Honda, J. and Adams, J. "Class D Audio Amplifier Basics." *International Rectifier Application Note AN-1071*.
12. Purifi Audio. "Eigentakt Amplifier Technology." Technical White Paper, 2019.
13. Putzeys, B. "The Eigentakt Amplifier: A Topology for Performance." Purifi Audio, 2020.
14. Poulsen, S. and Andersen, M. "Self-Oscillating PWM Modulators." *IEEE Transactions on Power Electronics*, 2005.
15. Langford-Smith, F. *Radiotron Designer's Handbook*. 4th ed. RCA, 1953.
16. Jones, M. *Valve Amplifiers*. 4th ed. Newnes, 2011.
17. Blencowe, M. *Designing Tube Preamps for Guitar and Bass*. 2nd ed. 2012.
18. Wolpert, S. and Wilder, K. "Understanding Audio Transformers." *Analog Devices Application Note AN-1368*.
19. Kondo, H. (Audio Note Japan). "Single-Ended Amplifier Design Philosophy." Technical Documentation.
20. Black, H.S. "Stabilized Feed-back Amplifiers." *Electrical Engineering*, vol. 53, no. 1, January 1934.
21. Cherry, E.M. "A New Distortion Mechanism in Class B Amplifiers." *J. Audio Eng. Soc.*, vol. 29, no. 5, 1981.
22. Baxandall, P.J. "Audio Power Amplifier Design -- Part 5." *Wireless World*, 1978.
23. Pass, N. "Leaving Class A." *The Audio Amateur*, 1998.
24. King, G. "Loudspeaker Voice Coils -- Part I: Damping." *J. Audio Eng. Soc.*, vol. 18, no. 1, 1970.
25. Greenhill, J. "Speaker Cables: Science or Snake Oil?" *Stereophile*, 2001.
26. Atkinson, J. "Tube Sound vs. Solid-State Sound." *Stereophile*, 1993.
27. Cabot, R.C. "Fundamentals of Modern Audio Measurement." *J. Audio Eng. Soc.*, vol. 47, no. 9, 1999.
28. Otala, M. "Transient Distortion in Transistorized Audio Power Amplifiers." *IEEE Trans. Audio Electroacoustics*, vol. AU-18, 1970.
29. Geddes, E.R. and Lee, L.W. "Auditory Perception of Nonlinear Distortion." AES Convention Preprint 5890, 2003.
30. Jung, W. and Didden, J. "Power Supply Design for Audio." *Analog Devices Application Note*, 2005.
31. Duncan, B. *High Performance Audio Power Amplifiers*. Newnes, 1996.
32. Nussbaum, S. "SMPS for Audio Amplifiers." *Hypex Electronics Technical Notes*, 2018.
33. Toole, F.E. "Listening Tests -- Turning Opinion into Fact." *J. Audio Eng. Soc.*, vol. 30, no. 6, 1982.
34. Audio Precision. "APx555 Audio Analyzer." Technical Documentation, 2020.
35. AES20-1996. "AES Recommended Practice for Professional Audio -- Subjective Evaluation of Loudspeakers." Audio Engineering Society.

---

*Hi-Fidelity Audio Reproduction -- Module 2: Amplifier Topology & Circuit Design. The amplifier's job is to be invisible -- to deliver power without leaving fingerprints on the signal. The topology determines where the fingerprints hide.*
