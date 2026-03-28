# Driver Alignment & Array Science

> **Domain:** Hi-Fidelity Audio Engineering
> **Module:** 4 -- Driver Alignment and Array Science
> **Through-line:** *Time is the hidden variable in loudspeaker design. Two drivers can both play the same frequency at the same level, and if one arrives 0.5 milliseconds after the other, the ear hears a coloration that no EQ can fix. The speed of sound -- 343 meters per second at 20 degrees Celsius -- is the ruler against which every multi-driver system is measured. Get the timing right and many speakers become one voice.*

---

## Table of Contents

1. [The Time Alignment Problem](#1-the-time-alignment-problem)
2. [Acoustic Center Calculation](#2-acoustic-center-calculation)
3. [The Delay Formula](#3-the-delay-formula)
4. [Lobing Behavior at Crossover Frequencies](#4-lobing-behavior-at-crossover-frequencies)
5. [Crossover Networks -- LR2 and LR4](#5-crossover-networks-lr2-and-lr4)
6. [FIR vs IIR Crossover Design](#6-fir-vs-iir-crossover-design)
7. [Line Array Coherent Coupling](#7-line-array-coherent-coupling)
8. [Cardioid Subwoofer Configurations](#8-cardioid-subwoofer-configurations)
9. [Acoustic Treatment Principles](#9-acoustic-treatment-principles)
10. [Worked Example -- Four-Speaker Alignment](#10-worked-example-four-speaker-alignment)
11. [Measurement and Verification](#11-measurement-and-verification)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Time Alignment Problem

Time-alignment in multi-driver loudspeakers was formally developed by Ed Long and Ronald Wickersham in 1975, presented at the 54th AES Convention in 1976. The core insight: in a multi-way speaker, the acoustic centers of the woofer and tweeter are physically offset. At the crossover frequency, both drivers are active; if their outputs do not arrive simultaneously at the listening position, destructive interference (lobing) occurs [1].

The main lobe tilts away from the desired axis, producing a coloration that cannot be corrected by EQ. This is not a frequency-domain problem -- it is a time-domain problem. EQ can change the amplitude at a frequency; it cannot change the arrival time of a wavefront.

```
TIME ALIGNMENT -- THE PROBLEM
================================================================

  SIDE VIEW OF A TWO-WAY SPEAKER
  ┌───────────────────────┐
  │                       │
  │    ┌───┐  Tweeter     │ <-- Acoustic center: 2 cm from baffle
  │    └───┘              │
  │                       │
  │    ┌───────┐          │
  │    │       │ Woofer   │ <-- Acoustic center: 5 cm behind baffle
  │    │       │          │
  │    └───────┘          │
  │                       │
  └───────────────────────┘

  Physical offset: ~3 cm
  Time difference: 3 cm / 34,300 cm/s = 0.087 ms
  At 2 kHz crossover: wavelength = 17.15 cm
  Phase error: (3/17.15) * 360 = 63 degrees

  63 degrees of phase error at crossover = audible coloration
```

---

## 2. Acoustic Center Calculation

The acoustic center of a loudspeaker driver is the point in space from which the wavefront appears to originate. For a piston-like driver, this is not the physical surface of the cone -- it is a virtual point that depends on the driver's radiation pattern, the frequency, and the baffle geometry [2].

### Practical Determination

1. **Measurement method:** Play a swept sine through the driver. Measure the impulse response at the listening position. The arrival time of the impulse identifies the acoustic center's distance.
2. **Driver type effects:** A horn-loaded driver has its acoustic center near the throat of the horn (deep inside the cabinet). A direct-radiating cone has its acoustic center near the cone surface. This is why horn-loaded systems often require less electronic delay correction than direct-radiating multi-way systems.
3. **Frequency dependence:** The acoustic center shifts with frequency. At low frequencies (long wavelength), the entire baffle acts as the radiating surface. At high frequencies, the radiation narrows to the center of the cone. This frequency-dependent shift is one reason why simple time delay alone cannot perfectly align a driver across its full operating bandwidth.

---

## 3. The Delay Formula

The fundamental formula for speaker delay alignment:

```
Delay (ms) = Distance (m) / 343 * 1000
```

Or in imperial:

```
Delay (ms) = Distance (ft) / 1125 * 1000
```

Where 343 m/s (1125 ft/s) is the speed of sound at 20 degrees Celsius (68 degrees F) at sea level. The speed of sound varies with temperature: approximately +0.6 m/s per degree Celsius increase [3].

### Multi-Speaker Alignment Procedure

For a multi-subwoofer system:
1. Measure the distance from each sub to the listening position (or primary audience area center).
2. Identify the farthest speaker. This becomes the reference -- it receives zero delay.
3. Add delay to all closer speakers equal to the difference in distance.

**Example:** Sub A is at 4 m, Sub B is at 3 m from the listening position.

```
Delay for Sub B = (4 - 3) / 343 * 1000 = 2.915 ms
```

Sub B receives 2.915 ms of electronic delay. Now both subwoofers' wavefronts arrive at the listening position simultaneously, and their outputs sum constructively.

---

## 4. Lobing Behavior at Crossover Frequencies

At the crossover frequency, both the low-frequency driver and the high-frequency driver are reproducing the same frequencies. Their combined output pattern depends on their relative amplitude, phase, and physical spacing [4].

### Constructive and Destructive Interference

When two sources are separated in space and reproduce the same frequency:
- **On-axis** (equidistant from both sources): Outputs arrive simultaneously and sum constructively.
- **Off-axis** (unequal distances): A path length difference creates a phase difference. At half-wavelength difference (180 degrees), destructive cancellation occurs.

The result is a pattern of lobes (maxima) and nulls (minima) that rotates and changes shape with frequency. At the crossover frequency, this lobing pattern is at its worst because both drivers are at maximum overlap.

### The Lobing Diagram

```
VERTICAL POLAR RESPONSE AT CROSSOVER (Unaligned)
================================================================

         90 deg (above)
            |
            |     /  Main lobe TILTED
            |   /     (should be at 0 deg)
            | /
  180 ------+-------> 0 deg (on axis)
            |\
            |  \   Null (cancellation)
            |    \
            |
         270 deg (below)

  CORRECTED (Time-aligned):
         90 deg
            |
            |
            |  Main lobe centered at 0 deg
            |
  180 ------+-------> 0 deg
            |
            |
            |
         270 deg
```

---

## 5. Crossover Networks -- LR2 and LR4

### Linkwitz-Riley Crossovers

Linkwitz-Riley crossovers are preferred for time-aligned systems because their outputs sum to unity at all frequencies when the drivers are time-aligned. Named after Siegfried Linkwitz and Russ Riley, who published the design in 1976 [5].

### LR2 (Second-Order, 12 dB/octave)

- Two cascaded first-order Butterworth filters.
- At the crossover frequency, each filter is at -6 dB. Sum: -6 dB + -6 dB = 0 dB (unity).
- Phase: Both outputs are in phase at crossover. No phase correction needed.
- Slope: 12 dB/octave -- gentler, wider overlap region.

### LR4 (Fourth-Order, 24 dB/octave)

- Two cascaded second-order Butterworth filters.
- At the crossover frequency, each filter is at -6 dB. Sum: unity.
- Phase: Both outputs are in phase at crossover.
- Slope: 24 dB/octave -- steeper, narrower overlap region. Less interference between drivers.

### Why LR Over Butterworth

A standard Butterworth crossover at the crossover point has each filter at -3 dB. The sum of two -3 dB signals in phase is +3 dB -- a 3 dB bump at the crossover frequency. Linkwitz-Riley avoids this by using the squared Butterworth characteristic, which produces -6 dB at the crossover point.

---

## 6. FIR vs IIR Crossover Design

### FIR Filters (Finite Impulse Response)

**Characteristics:** Linear phase. The group delay is constant across all frequencies -- no frequency-dependent phase distortion. Can implement arbitrary magnitude and phase responses. Can correct both magnitude and phase errors in a loudspeaker system [6].

**Advantages:**
- Phase-linear crossovers eliminate group delay distortion at crossover
- Can equalize the loudspeaker's own phase response
- Arbitrary filter shapes with no stability concerns

**Disadvantages:**
- Introduce latency proportional to filter length (half the filter length in samples)
- A 512-tap FIR at 48 kHz introduces ~5.3 ms of latency
- Higher computational cost than equivalent IIR

**Best for:** Studio monitoring, installed sound systems where latency is acceptable, high-end consumer speakers with DSP.

### IIR Filters (Infinite Impulse Response)

**Characteristics:** Minimum phase. Phase rotation is inherent to the frequency-dependent magnitude response. Low latency (typically <1 ms). Computationally efficient [7].

**Advantages:**
- Minimal latency -- critical for live sound (musician monitoring, lip-sync)
- Lower computational requirements
- Well-understood design methods (Butterworth, Linkwitz-Riley, Bessel)

**Disadvantages:**
- Phase rotation at crossover frequencies causes the lobing that time-alignment is trying to fix
- Cannot correct phase errors without also changing magnitude
- Stability concerns at extreme Q values

**Best for:** Live sound (FOH, monitors), powered speakers where latency budget is tight, analog crossover implementations.

---

## 7. Line Array Coherent Coupling

Multiple drivers mounted in a vertical column interact acoustically. When driver spacing is small relative to the wavelength of a given frequency, outputs add coherently (couple) to form a near-cylindrical wavefront [8].

### Cylindrical vs Spherical Propagation

- **Point source (single speaker):** Spherical propagation. SPL decreases by 6 dB per distance doubling (inverse square law).
- **Line source (coupled array):** Cylindrical propagation. SPL decreases by only 3 dB per distance doubling in the near field. This means a line array can throw sound farther with less level drop-off.

### Coupling Frequency Range

The coherent coupling frequency band is determined by driver spacing:

```
f_max_coupling = c / (2 * d)
```

Where `c` is the speed of sound (343 m/s) and `d` is the center-to-center distance between adjacent drivers.

**Example:** Drivers spaced 0.3 m apart:

```
f_max = 343 / (2 * 0.3) = 572 Hz
```

Below 572 Hz, the array couples coherently. Above 572 Hz, lobing begins and the array must rely on horn loading or waveguide control for pattern management.

### Practical Array Design

- Common spacing: 0.2-0.4 m
- Coupling range: 430-860 Hz
- Above coupling frequency: individual box horns control the pattern
- Below coupling frequency: the array acts as a unified source
- Array curvature (J-array, spiral array) controls vertical coverage distribution

---

## 8. Cardioid Subwoofer Configurations

A cardioid subwoofer array produces more output in one direction (toward the audience) and less in the opposite direction (toward the stage). This is achieved by combining front-facing and rear-facing subwoofers with appropriate delay and polarity adjustments [9].

### End-Fire Array

Multiple subwoofers stacked in a line pointing toward the audience, each with progressive delay. The rearward-traveling waves from each sub arrive at the back of the array at different times and cancel. The forward-traveling waves arrive at the audience in phase and sum.

### Gradient Configuration

Two subwoofers, one facing forward and one facing backward. The rear sub is delayed and polarity-inverted. The forward output sums constructively; the rearward output cancels. Typical rejection: 10-20 dB at the rear.

### Why Cardioid Subwoofers Matter

On a concert stage, uncontrolled subwoofer energy causes:
- Low-frequency rumble on stage that muddies monitoring
- Feedback potential in stage microphones
- Energy wasted radiating into areas where no audience is present

Cardioid subwoofer arrays solve these problems by directing bass energy toward the audience and suppressing it behind the array.

---

## 9. Acoustic Treatment Principles

Acoustic treatment modifies a room's acoustic behavior to make it suitable for critical listening or recording. It is distinct from soundproofing (isolation from external sound) [10].

### Absorption

Porous materials (fiberglass, mineral wool, open-cell foam) absorb sound energy by converting acoustic motion into heat through friction within the material's fibers. Absorption coefficient ranges from 0 (perfect reflection) to 1 (perfect absorption).

- **Broadband absorbers:** 4-6 inch thick rigid fiberglass panels (Owens Corning 703/705) at first reflection points absorb mid and high frequencies effectively. Low-frequency absorption requires thicker panels or air gaps behind the panel.
- **Bass traps:** Thick absorptive panels (6-12 inches) placed in room corners where low-frequency standing waves concentrate. Corners are the most effective locations because all room modes have pressure maxima at boundaries.

### Diffusion

Diffusers scatter reflected sound energy in multiple directions rather than absorbing it. This preserves the room's liveliness while eliminating strong discrete reflections.

- **Quadratic Residue Diffuser (QRD):** Wells of varying depth based on a quadratic residue sequence. Scatters sound across a designed frequency range. Effective bandwidth depends on well depth and spacing.
- **Skyline (primitive root) diffuser:** Two-dimensional diffuser with block heights based on a primitive root sequence. Scatters in both horizontal and vertical planes.
- **Placement:** Rear wall (behind listening position) and ceiling are the most common diffuser locations.

### Room Modes

Rectangular rooms have standing waves (modes) at frequencies determined by the room dimensions:

```
f = c / (2 * L)   (fundamental axial mode for dimension L)
```

Where `c` = 343 m/s and `L` = room dimension in meters.

**Example:** A room 5 meters long has an axial mode at 343 / (2 * 5) = 34.3 Hz, with harmonics at 68.6, 102.9, 137.2 Hz, etc.

Room modes cause uneven bass response: some frequencies are reinforced (peaks), others are cancelled (nulls). Treatment strategies: bass traps at pressure maxima (corners), subwoofer placement optimization, room dimension ratios that distribute modes evenly (Bolt area ratio, IEC 60268-13).

---

## 10. Worked Example -- Four-Speaker Alignment

**Scenario:** A small venue with four speakers:
- Two mains (L/R) on stands at 3.5 m from the mix position
- Two subwoofers on the floor at 2.8 m from the mix position

**Step 1: Identify the farthest speaker.**

The mains at 3.5 m are farthest. They become the reference (zero delay).

**Step 2: Calculate delay for the subwoofers.**

```
Distance difference = 3.5 - 2.8 = 0.7 m
Delay = 0.7 / 343 * 1000 = 2.041 ms
```

**Step 3: Apply 2.041 ms delay to both subwoofers.**

**Step 4: Verify with measurement.**

Use a measurement microphone at the mix position. Play pink noise through all speakers. Measure the impulse response. The impulse peaks from all four speakers should align within 0.1 ms.

**Step 5: Fine-tune the crossover.**

Set the crossover between subs and mains at 80-100 Hz. Use LR4 (24 dB/octave) slopes. Verify phase alignment at the crossover frequency by measuring the combined response -- there should be no cancellation notch at the crossover point.

```
ALIGNMENT RESULT
================================================================

  Before alignment:               After alignment:
  ┌──────────────────┐            ┌──────────────────┐
  │   Sub  Main      │            │   Sub  Main      │
  │   ↓    ↓         │            │   ↓    ↓         │
  │   ──┬───┬──      │            │   ───┬┬───       │
  │     │   │        │            │      ││          │
  │   2.04ms gap     │            │   Aligned        │
  │   at crossover:  │            │   at crossover:  │
  │   cancellation   │            │   coherent sum   │
  └──────────────────┘            └──────────────────┘
```

---

## 11. Measurement and Verification

### Measurement Tools

- **Measurement microphone:** Omnidirectional, calibrated, flat response (e.g., Earthworks M23, Dayton Audio EMM-6). The measurement microphone must be more accurate than the system under test.
- **Audio analyzer:** Software that generates test signals and analyzes the response. Common tools: Room EQ Wizard (REW, free), Smaart (professional live sound), ARTA (research-grade).
- **Test signals:** Swept sine (log sweep) for impulse response measurement. Pink noise for real-time analysis. White noise for broadband spectrum measurement.

### Key Measurements

| Measurement | What It Reveals | Target |
|-------------|----------------|--------|
| Impulse response | Time alignment, reflections | Single coherent peak |
| Frequency response | Tonal balance | +/- 3 dB, 40 Hz - 16 kHz |
| Phase response | Driver alignment at crossover | Smooth, no crossover null |
| RT60 | Reverberation time | 0.3-0.5s (control room) |
| STI (Speech) | Intelligibility | >0.75 (excellent) |

---

## 12. Cross-References

> **Related:** [Signal Capture](01-signal-capture.md) -- microphone placement and room acoustics affect what the preamp receives. [Enclosure Engineering](05-enclosure-engineering.md) -- horn loading and cabinet design determine the acoustic center. [System Fidelity](06-system-fidelity.md) -- measurement methodology applies to alignment verification.

**Series cross-references:**
- **SGL (Signal & Light):** FIR/IIR filter implementation in DSP hardware
- **DAA (Deep Audio Analyzer):** Phase analysis and group delay measurement
- **HFR (High Fidelity Radio):** Antenna array coherent coupling parallels speaker array coupling
- **GTP (Ground Truth):** Calibration and measurement discipline
- **SRG (Signal Routing):** Signal distribution to multi-speaker arrays

---

## 13. Sources

1. Long, E.M. and Wickersham, R.J. "A Time-Align Technique for Loudspeaker System Design." Presented at the 54th AES Convention, May 1976, Preprint 1108.
2. Purifi Audio. "Time/Phase Alignment, Acoustic Center, Lobing." purifi-audio.com, Technical Note, 2023.
3. Kinsler, L.E., Frey, A.R., Coppens, A.B., and Sanders, J.V. *Fundamentals of Acoustics.* 4th ed. Wiley, 2000.
4. Keele, D.B. "Low-Frequency Loudspeaker Assessment by Nearfield Sound-Pressure Measurement." *Journal of the Audio Engineering Society*, vol. 22, no. 3, pp. 154-162, 1974.
5. Linkwitz, S. "Active Crossover Networks for Noncoincident Drivers." *Journal of the Audio Engineering Society*, vol. 24, no. 1, pp. 2-8, January/February 1976.
6. Smith, J.O. *Introduction to Digital Filters with Audio Applications.* W3K Publishing, 2007. Online edition: ccrma.stanford.edu.
7. Oppenheim, A.V. and Schafer, R.W. *Discrete-Time Signal Processing.* 3rd ed. Pearson, 2010.
8. Ureda, M.S. "J and Spiral Line Arrays." Presented at the 111th AES Convention, Paper 5485, 2001.
9. Meyer Sound. "Cardioid Subwoofer Configurations." Application Note AN-004, meyersound.com, 2022.
10. Everest, F.A. and Pohlmann, K.C. *Master Handbook of Acoustics.* 6th ed. McGraw-Hill, 2015.
11. IEC 60268-13:2018. "Sound system equipment -- Part 13: Listening tests on loudspeakers." International Electrotechnical Commission.
12. Room EQ Wizard. "REW User Manual and Measurement Guide." roomeqwizard.com, Version 5.31, 2024.
13. Rindel, J.H. "Room Acoustic Prediction and Auralization." Presented at the 23rd International Congress on Acoustics, Aachen, 2019.
14. McCarthy, B. *Sound Systems: Design and Optimization.* 4th ed. Focal Press, 2016.
15. Owens Corning. "700 Series Fiberglas Insulation -- Acoustic Performance Data." Technical Data Sheet, 2023.

---

*Hi-Fidelity Audio Engineering -- Module 4: Driver Alignment & Array Science. Time is the hidden variable. Get the timing right and many speakers become one voice.*
