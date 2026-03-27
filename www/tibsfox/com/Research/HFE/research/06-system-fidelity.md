# System Fidelity & Case Studies

> **Domain:** Hi-Fidelity Audio Engineering
> **Module:** 6 -- System Fidelity and Case Studies
> **Through-line:** *THD is a number. The harmonic profile is the story. A tube Class A amplifier measuring 0.5% THD can sound more musical than a transistor Class AB measuring 0.05% -- because the human ear does not weight all harmonics equally. Funktion-One and Klipsch built their reputations not by chasing the lowest number, but by understanding which numbers matter.*

---

## Table of Contents

1. [The Measurement Problem](#1-the-measurement-problem)
2. [Total Harmonic Distortion (THD)](#2-total-harmonic-distortion-thd)
3. [THD vs THD+N](#3-thd-vs-thdn)
4. [Psychoacoustics of Distortion](#4-psychoacoustics-of-distortion)
5. [Signal-to-Noise Ratio](#5-signal-to-noise-ratio)
6. [SINAD, SFDR, and IMD](#6-sinad-sfdr-and-imd)
7. [The Complete Fidelity Metric Table](#7-the-complete-fidelity-metric-table)
8. [Case Study A -- Funktion-One](#8-case-study-a-funktion-one)
9. [Case Study B -- Klipsch Heritage](#9-case-study-b-klipsch-heritage)
10. [PNW Studios as Fidelity Case Studies](#10-pnw-studios-as-fidelity-case-studies)
11. [The Coherent Chain -- End-to-End Verification](#11-the-coherent-chain-end-to-end-verification)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Measurement Problem

Audio fidelity is the degree to which a system's output faithfully reproduces its input. The challenge: "faithful reproduction" is simultaneously an objective measurement problem (what do the instruments read?) and a subjective perception problem (what does the listener hear?). The two do not always agree, and understanding why is the core issue of this module [1].

The standard metrics -- THD, SNR, frequency response -- were developed for telephone engineering and later adopted by the audio industry. They capture important aspects of system performance but are incomplete descriptions of subjective quality. A system can measure well and sound poor, or measure modestly and sound excellent, depending on the nature and distribution of its imperfections.

This is not an argument against measurement. It is an argument for understanding what the measurements mean and what they do not mean.

---

## 2. Total Harmonic Distortion (THD)

THD is the ratio of the RMS sum of all harmonic components (2nd through nth) to the RMS level of the fundamental. Mathematically [2]:

```
THD = sqrt(V2^2 + V3^2 + V4^2 + ... + Vn^2) / V1
```

Where `V1` is the fundamental amplitude and `V2` through `Vn` are the harmonic amplitudes.

### Measurement Procedure

1. Apply a spectrally pure sine wave (the test signal) to the device under test.
2. Measure the output using FFT analysis to identify the amplitude of each harmonic.
3. Compute the RSS (root sum of squares) of all harmonics.
4. Divide by the fundamental amplitude.
5. Express as a percentage (for values >= 0.01%) or in dB (for lower values).

### Expression Convention

```
THD (%) = (RSS of harmonics / fundamental) * 100

THD (dB) = 20 * log10(RSS of harmonics / fundamental)

Examples:
  1%      = -40 dB
  0.1%    = -60 dB
  0.01%   = -80 dB
  0.001%  = -100 dB
  0.0001% = -120 dB
```

### Measurement Conditions

THD varies with:
- **Frequency:** Most devices show higher distortion at frequency extremes (below 100 Hz, above 10 kHz).
- **Level:** Distortion generally increases with signal level. Some devices (tubes, tape) show a characteristic "soft knee" where distortion rises gradually; others (op-amps, digital systems) show a sharp transition from low distortion to hard clipping.
- **Load impedance:** Amplifier distortion depends heavily on the load. THD at 8 ohms versus 4 ohms can differ by 6-10 dB.
- **Temperature:** Semiconductor parameters drift with temperature, affecting distortion.

A specification of "0.01% THD" without stating the test frequency, output level, and load impedance is meaningless.

---

## 3. THD vs THD+N

THD+N (Total Harmonic Distortion plus Noise) measures all signal energy in the output after removing the fundamental, including both harmonics and broadband noise [3].

### Measurement Method

1. Apply a sine wave to the device under test.
2. Use a notch filter (fundamental rejection filter) to remove the fundamental from the output.
3. Measure the RMS level of everything that remains (harmonics + noise + hum + interference).
4. Divide by the total signal level.

### THD vs THD+N: When They Differ

- **In a very low-noise system:** THD approximately equals THD+N, because the noise contribution is negligible.
- **In a noisy system:** THD+N can be significantly higher than THD. The noise floor dominates the measurement.
- **At low signal levels:** THD+N increases as the signal approaches the noise floor, even if actual harmonic distortion remains low.

### Which to Use?

- **THD:** Better for characterizing a specific non-linearity (e.g., comparing amplifier topologies).
- **THD+N:** Better for overall system performance, especially in systems where noise is a significant contributor.
- **In practice:** THD+N is the more commonly specified metric because it is easier to measure (requires only a notch filter, not a full FFT analysis) and captures a broader picture of signal degradation.

---

## 4. Psychoacoustics of Distortion

Research shows that the human ear does not weight all harmonic distortion equally. The order, distribution, and relationship of harmonics to the fundamental determine the perceived quality of the distortion [4].

### Even-Order vs Odd-Order Harmonics

- **Even-order harmonics (2nd, 4th, 6th):** Musically consonant. The 2nd harmonic is one octave above the fundamental. The 4th is two octaves. These intervals are the foundation of Western tonal music. Even-order distortion is perceived as "warmth," "richness," or "body."
- **Odd-order harmonics (3rd, 5th, 7th):** Less consonant. The 3rd is an octave plus a fifth -- still musical but with an edge. The 5th is two octaves plus a major third. Higher odd harmonics (7th, 9th) create dissonant intervals. Odd-order distortion is perceived as "harshness," "grit," or "edge."

### Higher-Order Audibility

The audibility of a harmonic increases disproportionately with its order. The 10th harmonic at -80 dB is far more audible and objectionable than the 2nd harmonic at -60 dB. This is because higher-order harmonics fall outside the critical band of the fundamental and are processed as separate tones rather than as part of the fundamental's timbre.

### Implications for Amplifier Selection

This explains the enduring preference for tube amplifiers in certain applications despite their measurably higher THD:
- **Tube Class A:** Predominantly 2nd and 4th harmonic. Musical, warm.
- **Solid-state Class AB:** Crossover distortion produces 3rd, 5th, 7th harmonics. Can sound "cold" or "harsh" even at very low THD levels.
- **Modern Class D:** Switching artifacts produce harmonics at high frequencies (above audio band). Within the audio band, well-designed Class D achieves extremely low THD with a benign harmonic profile.

> **SAFETY WARNING:** Prolonged exposure to sound levels above 85 dB SPL causes permanent hearing damage. When evaluating system fidelity at high output levels, use ear protection or limit exposure duration per NIOSH guidelines: 85 dB for 8 hours, 88 dB for 4 hours, 91 dB for 2 hours, 94 dB for 1 hour [5].

---

## 5. Signal-to-Noise Ratio

SNR is the ratio of the desired signal power to the noise floor power, expressed in dB [6]:

```
SNR (dB) = 10 * log10(P_signal / P_noise)
         = 20 * log10(V_signal / V_noise)
```

### A-Weighting

SNR is typically specified A-weighted, which applies a frequency-dependent weighting curve that approximates the ear's sensitivity. A-weighting deemphasizes low frequencies (where the ear is less sensitive) and emphasizes the 1-4 kHz range (where the ear is most sensitive). A-weighted SNR figures are typically 3-6 dB better than unweighted figures.

### Target Values

| Component | SNR Target | Context |
|-----------|-----------|---------|
| Professional preamp | >120 dB | A-weighted, at rated output |
| Consumer amplifier | >90 dB | A-weighted |
| Professional ADC | >115 dB | Dynamic range, A-weighted |
| CD (16-bit) | 96 dB | Theoretical maximum |
| 24-bit ADC | 144 dB | Theoretical; ~120 dB practical |

### SNR in the Signal Chain

The total SNR of a cascaded system is dominated by the stage with the worst SNR-to-gain ratio. This is why the preamplifier stage (Module 1) is critical: it has the highest gain and operates at the lowest signal levels. A preamp with 120 dB SNR that applies 60 dB of gain produces a signal with 60 dB of headroom above the noise floor. Any subsequent stage that degrades that margin reduces the system's overall SNR.

---

## 6. SINAD, SFDR, and IMD

### SINAD (Signal to Noise and Distortion)

SINAD combines SNR and THD+N into a single figure of merit [7]:

```
SINAD (dB) = 10 * log10(P_signal / (P_noise + P_distortion))
```

SINAD is the most comprehensive single-number metric for analog signal quality. A high SINAD means both low noise and low distortion. SINAD is particularly useful for characterizing ADC performance, where both quantization noise and conversion non-linearity contribute to signal degradation.

### SFDR (Spurious Free Dynamic Range)

SFDR measures the ratio of the fundamental signal to the largest single spurious component (spur) in the output, whether that spur is a harmonic, an intermodulation product, or a sampling artifact [8]:

```
SFDR (dBc) = 20 * log10(V_fundamental / V_worst_spur)
```

SFDR is important in ADC applications because it indicates the dynamic range available for detecting small signals in the presence of large ones. A receiver with 100 dBc SFDR can detect a signal 100 dB below a strong interferer.

### IMD (Intermodulation Distortion)

IMD measures the non-linear interaction between two or more signals of different frequencies. When two frequencies f1 and f2 pass through a non-linear system, products appear at f1+f2, f1-f2, 2f1-f2, 2f2-f1, etc. IMD is particularly revealing for audio systems because real music contains many simultaneous frequencies, and IMD products can fall at frequencies where no harmonic products exist [9].

**Standard IMD test methods:**
- **SMPTE/DIN:** 60 Hz + 7 kHz at 4:1 ratio. Measures modulation of the high-frequency tone by the low-frequency tone.
- **CCIF (twin-tone):** Two closely spaced high frequencies (e.g., 19 kHz + 20 kHz). Measures the difference-frequency product (1 kHz) that falls in the midband.

---

## 7. The Complete Fidelity Metric Table

| Metric | Definition | Typical Good Value | Measurement Standard |
|--------|-----------|-------------------|---------------------|
| THD | RSS sum of harmonics / fundamental | <0.01% (-80 dB) | AES17, IEC 60268-3 |
| THD+N | All non-fundamental energy / signal | <0.001% (-100 dB) | Audio Precision AN-5 |
| SNR | Signal power / noise power | >120 dB (A-weighted) | IEC 60268-3 |
| SINAD | Signal / (noise + distortion) | >110 dB | IEEE 1241 |
| SFDR | Fundamental / worst spur | >100 dBc | IEEE 1241 |
| IMD (SMPTE) | Modulation distortion, 60 Hz + 7 kHz | <0.01% | SMPTE RP120 |
| IMD (CCIF) | Difference product, 19 + 20 kHz | <0.003% | IEC 60268 |
| Frequency Response | Bandwidth deviation | +/- 0.5 dB, 20 Hz - 20 kHz | IEC 60268-5 |
| Channel Separation | Crosstalk between L/R | >100 dB | IEC 60268-3 |
| Dynamic Range | Max signal / noise floor | >115 dB | AES17 |

---

## 8. Case Study A -- Funktion-One

### Founding Philosophy

Funktion-One (founded 1992 by Tony Andrews and John Newsham, Dorking, Surrey, UK) is among the world's most respected professional audio manufacturers. Their design philosophy, stated by Andrews [10]:

> "Almost all modern loudspeakers require significant pre-set or controller EQ. In contrast, we have always designed acoustically flat loudspeaker systems, requiring only crossover filters, relative delays and gains. The advantages of this approach are headroom preservation and system linearity, as well as a clearer, more natural audio presentation."

This is a radical position in the professional audio industry, where most commercial PA systems require 20-40 parameters of corrective EQ per box to achieve flat response.

### Horn-Loaded Point-Source Design

Funktion-One uses horn-loaded configurations for all frequency ranges: bass, midrange, and high frequency. All drivers are aligned around a single acoustic center, minimizing time-alignment errors and phase distortion. The point-source configuration delivers consistent tonal balance at all listening positions -- the frequency response does not change significantly with angle [11].

### Coherent System Technology (CST)

Funktion-One's proprietary approach to system design that treats the entire chain -- from amplifier to driver to horn to room -- as a single coherent system. Each component is designed to work with the others; no component is intended for general-purpose use.

### The Berghain Installation

The sound system at Berghain (Berlin, Germany), widely considered one of the world's most powerful and highest-fidelity club installations, is a Funktion-One system. The system operates at only 10-20% of its full capacity during normal use, meaning it is always operating in its most linear region with maximum headroom. The installation demonstrates the philosophy: design for 10x the needed capacity, and the system will perform effortlessly at the operating point [12].

> **SAFETY WARNING:** Funktion-One systems at venues like Berghain routinely produce sustained SPL levels of 100-115 dB. At these levels, hearing damage can occur within minutes. Hearing protection should be worn at all times in high-SPL environments. NIOSH guidelines: 100 dB exposure limit is 15 minutes; 110 dB is less than 2 minutes [5].

### Funktion-One Design Principles Summary

1. **Acoustically flat by design** -- no corrective EQ required
2. **Horn loading on all frequency bands** -- efficiency and controlled directivity
3. **Point-source alignment** -- single acoustic center
4. **No corrective EQ philosophy** -- the system measures flat because it IS flat
5. **Berghain as proof** -- operates at 10-20% capacity, effortless headroom

---

## 9. Case Study B -- Klipsch Heritage

### Paul W. Klipsch -- The Engineer

Paul Klipsch (1904-2002) was an engineer who insisted on measurement-based design when the audio industry was rife with subjective claims. His four design principles -- high efficiency, low distortion, controlled directivity, flat response -- are directly measurable criteria, not subjective preferences [13].

### The Four Core Principles

1. **High efficiency / low distortion:** Horn loading achieves both by reducing cone excursion at any given SPL. Less excursion = less non-linear distortion. The Klipschorn's 105 dB sensitivity means a 10-watt amplifier produces concert-level volume.
2. **Controlled directivity:** The horn determines where the sound goes. Energy is directed at the listener, not wasted heating side walls.
3. **Wide dynamic range:** Efficient speakers have more headroom before thermal compression. A Klipschorn with a 200-watt amplifier can produce 128 dB SPL before thermal limiting.
4. **Flat frequency response:** Achieved through correct horn geometry -- the exponential flare rate is mathematically calculated to provide flat acoustic output, not corrected after the fact by EQ.

### Klipschorn Engineering Details

- **"Bifurcated trihedral exponential wave transmission line"** -- PWK's precise description of the folded bass horn that uses two room walls as its mouth extension
- **Bass horn:** Folded W-section, 15-inch driver. Corner loading extends effective mouth area from the cabinet's physical size to the room boundary area.
- **Construction:** 350+ screws, hand-fit joints, birch veneer panels. The mechanical precision is necessary because any air leak in the horn degrades low-frequency performance.
- **Continuous production since 1946.** The longest continuously produced speaker in history [14].

### The Jubilee -- PWK's Final Design

Paul Klipsch considered the Jubilee his ultimate refinement. Key improvements over the Klipschorn:

| Feature | Klipschorn | Jubilee |
|---------|-----------|---------|
| Bass loading | Corner horn (needs corner) | Vented enclosure (free-standing) |
| Bass drivers | 1 x 15-inch | 2 x 12-inch |
| Crossover points | 2 (600 Hz, 6 kHz) | 1 (340 Hz) |
| Crossover type | Passive | Active DSP (FIR-based) |
| Mid/HF horn | Separate mid + tweeter horns | K-402 (covers 340 Hz - 20 kHz) |
| Time alignment | Mechanical (baffle step) | DSP (FIR phase correction) |
| Sensitivity | 105 dB/W/m | 104 dB/W/m |

The single 340 Hz crossover point is critical: by eliminating the second crossover, the Jubilee avoids the phase and time-alignment complications inherent in three-way designs. The K-402 horn handles nearly the entire audible midrange and treble as a single coherent source.

---

## 10. PNW Studios as Fidelity Case Studies

### Robert Lang Studios -- Natural Acoustic Fidelity

Robert Lang Studios (Shoreline, WA) achieves its characteristic sound through the room itself rather than through processing. The wood-frame residential construction provides natural diffusion (irregular surfaces scatter sound) and moderate absorption (wood panels absorb selectively). The rooms were not designed as studios -- they evolved into studios, and their irregular dimensions avoid the parallel-surface standing wave problems that plague purpose-built rectangular rooms [15].

**Fidelity lesson:** Sometimes the best acoustic treatment is accident. The natural irregularity of a residential structure can outperform a geometrically perfect but acoustically problematic rectangular room.

### Bear Creek Studio -- Barn Acoustics

Bear Creek's tracking room (Woodinville, WA) exploits the barn's high ceilings and large volume to provide a long natural reverberation that complements acoustic and folk recordings. The room's RT60 is high by studio standards -- but for the music recorded there (Fleet Foxes, Brandi Carlile), the room IS the reverb. No plugin required [16].

**Fidelity lesson:** Fidelity is not always "accuracy." For some music, fidelity means faithfully capturing the interaction between the source and the room, including the room's character. The room is the first instrument.

### London Bridge Studio -- Controlled Environment

London Bridge (Shoreline, WA) represents the opposite approach: rooms designed and treated for control and isolation. The tighter, dryer rooms allow close-miking and multi-track isolation that grunge and rock production demands. Pearl Jam's "Ten" (1991) was mixed at London Bridge -- a record whose dense, layered production required precise separation between instruments [17].

**Fidelity lesson:** Control rooms must be neutral. Live rooms must serve the music. London Bridge provides both.

---

## 11. The Coherent Chain -- End-to-End Verification

The Coherent Chain Principle from the vision document: every stage in the audio signal path must preserve phase relationships, minimize non-linear distortion, and deliver the signal to the next stage with sufficient level to dominate the noise floor.

### End-to-End Verification Procedure

```
THE COHERENT CHAIN -- VERIFICATION MATRIX
================================================================

Stage           | Metric        | Target           | Module Ref
----------------|---------------|------------------|----------
Microphone      | Self-noise    | <15 dB-A         | M1
Preamp          | SNR           | >120 dB (A-wt)   | M1
Preamp          | THD at 1 kHz  | <0.025%           | M1
ADC             | Dynamic range | >115 dB           | M1
Console/DAW     | THD+N         | <-100 dB          | M3
Amplifier       | THD at 1 kHz  | <0.01% (AB/D)     | M2
Crossover       | Phase at Xover| <30 deg error     | M4
Alignment       | Time error    | <0.1 ms           | M4
Enclosure       | THD at Fb     | <5%               | M5
System          | Freq Response | +/-3 dB 40-16kHz  | M4
System          | SNR           | >100 dB           | M6
```

### The Weakest Link Rule

The system's overall fidelity is limited by its weakest stage. A studio with a $10,000 preamp, $5,000 ADC, and $200 powered monitors has the fidelity of the monitors. The chain is only as strong as its weakest link -- but identifying the weak link requires measuring every stage independently.

### Cross-Module Consistency Check

The speed of sound used in M4 (Driver Alignment) delay calculations must match the value used in M5 (Enclosure Engineering) quarter-wave calculations: 343 m/s at 20 degrees C (1130 ft/s). The amplifier class distortion signatures documented in M2 must be consistent with the psychoacoustic analysis in this module. The preamp SNR ceiling established in M1 must be referenced as the system SNR ceiling here.

---

## 12. Cross-References

> **Related:** [Signal Capture](01-signal-capture.md) -- preamp SNR ceiling is the system fidelity ceiling. [Amplification Theory](02-amplification-theory.md) -- amplifier class distortion signatures analyzed here. [Mixing & Space](03-mixing-and-space.md) -- mastering metrics reference the fidelity standards here. [Driver Alignment](04-driver-alignment.md) -- alignment verification is fidelity verification. [Enclosure Engineering](05-enclosure-engineering.md) -- Klipsch and Funktion-One case studies reference enclosure physics.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Extends fidelity measurement into computational multi-pass tools
- **SGL (Signal & Light):** Real-time DSP for measurement and correction
- **FQC (Frequency Continuum):** Fourier analysis foundations for THD measurement
- **GTP (Ground Truth):** Measurement methodology and calibration
- **LED (LED Engineering):** Perception science parallels (visual fidelity metrics)
- **SNY (Synthesis):** Synthesized signal fidelity for test signal generation

---

## 13. Sources

1. Audio Precision Inc. "Fundamentals of Modern Audio Measurement." Application Note, ap.com, 2020.
2. Analog Devices. "MT-053: Op Amp Distortion: HD, THD, THD+N, IMD, SFDR, ENOB." Tutorial, analog.com, 2009.
3. Audio Precision Inc. "Understanding and Measuring THD and THD+N." Application Note AN-5, 2021.
4. Temme, S.F. "Audio Distortion Measurements." AES Monograph, Audio Precision, 2019.
5. NIOSH. "Criteria for a Recommended Standard: Occupational Noise Exposure." Publication No. 98-126, National Institute for Occupational Safety and Health, 1998.
6. IEC 60268-3:2018. "Sound system equipment -- Part 3: Amplifiers." International Electrotechnical Commission.
7. IEEE 1241-2010. "IEEE Standard for Terminology and Test Methods for Analog-to-Digital Converters." IEEE, 2010.
8. Kester, W. *Data Conversion Handbook.* Analog Devices / Newnes, 2005.
9. Analog Devices. "Confused About Amplifier Distortion Specs?" *Analog Dialogue*, Vol. 47, 2013.
10. Andrews, T. "Funktion-One Design Philosophy." Funktion-One Research Ltd., funktion-one.com, accessed March 2026.
11. Funktion-One Research Ltd. "F1201 User Guide v1.41." Dorking, Surrey, UK.
12. Berghain / Panorama Bar. Sound system documentation. Referenced in multiple professional audio publications (Sound on Sound, February 2016; DJ Mag, 2019).
13. Klipsch, P.W. "A Note on Loudspeaker Design Principles." *Journal of the Audio Engineering Society*, 1969.
14. Klipsch Heritage. "Klipschorn History." klipsch.com/heritage, accessed March 2026.
15. Robert Lang Studios. "Studio History." robertlangstudios.com, accessed March 2026.
16. Bear Creek Studio. "The Room." bearcreekstudio.com, accessed March 2026.
17. London Bridge Studio. "Our History." londonbridgestudio.com, accessed March 2026.
18. Katz, B. *Mastering Audio: The Art and the Science.* 3rd ed. Focal Press, 2015.
19. Hamm, R.O. "Tubes Versus Transistors -- Is There an Audible Difference?" *Journal of the Audio Engineering Society*, vol. 21, no. 4, pp. 267-273, May 1973.
20. Toole, F.E. *Sound Reproduction: The Acoustics and Psychoacoustics of Loudspeakers and Rooms.* 3rd ed. Focal Press, 2018.

---

*Hi-Fidelity Audio Engineering -- Module 6: System Fidelity & Case Studies. THD is a number. The harmonic profile is the story. Funktion-One and Klipsch understood which numbers matter.*
