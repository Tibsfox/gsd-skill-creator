# Speaker Physics & Transducer Design

> **Domain:** Electromechanical Physics
> **Module:** 1 -- Loudspeaker Science and Transduction
> **Through-line:** *The speaker is where electricity becomes weather. A voice coil in a magnetic gap converts current to force, force accelerates a cone, the cone displaces air molecules, and those molecules carry a pressure wave to your ear. Every fidelity failure in the entire chain converges at this final transformation -- the most brutally physical stage of the whole signal path. No amount of upstream perfection survives a bad transducer.*

---

## Table of Contents

1. [The Electromechanical Transducer Problem](#1-the-electromechanical-transducer-problem)
2. [Moving-Coil Driver Physics](#2-moving-coil-driver-physics)
3. [Thiele-Small Parameters](#3-thiele-small-parameters)
4. [Enclosure Acoustics](#4-enclosure-acoustics)
5. [Crossover Network Theory](#5-crossover-network-theory)
6. [Electrostatic Loudspeakers](#6-electrostatic-loudspeakers)
7. [Planar Magnetic and Ribbon Drivers](#7-planar-magnetic-and-ribbon-drivers)
8. [Horn Loading and Waveguides](#8-horn-loading-and-waveguides)
9. [The Loudspeaker as a System](#9-the-loudspeaker-as-a-system)
10. [Measurement and Characterization](#10-measurement-and-characterization)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Electromechanical Transducer Problem

A loudspeaker performs the inverse of what a microphone does: it converts an electrical signal into acoustic pressure. The fundamental challenge is that this conversion is never perfectly linear. The voice coil's inductance varies with excursion, the magnetic field is not perfectly uniform across the gap, the cone's mass and stiffness create resonances, the surround and spider introduce nonlinear restoring forces at large excursions, and the air load presented to the radiating surface is frequency-dependent [1].

The ideal transducer would have zero mass, infinite stiffness, perfectly uniform magnetic flux density across the entire excursion range, and radiate into an infinite baffle with no edge diffraction. Every real speaker departs from this ideal in measurable ways, and the science of speaker design is the art of minimizing these departures within the constraints of cost, size, weight, and the laws of physics.

```
ELECTROMECHANICAL ANALOGY -- THE SPEAKER AS A CIRCUIT
================================================================

  ELECTRICAL DOMAIN          MECHANICAL DOMAIN         ACOUSTIC DOMAIN
  Voltage (V)         <-->   Force (N)           <-->  Pressure (Pa)
  Current (A)         <-->   Velocity (m/s)      <-->  Volume velocity (m^3/s)
  Resistance (Ohm)    <-->   Mech. resistance    <-->  Acoustic resistance
  Inductance (H)      <-->   Mass (kg)           <-->  Acoustic mass
  Capacitance (F)     <-->   Compliance (m/N)    <-->  Acoustic compliance
  Transformer         <-->   BL product (T*m)    <-->  Sd (effective area)
```

The electromechanical analogy is the Rosetta Stone of speaker design. It allows the entire loudspeaker -- electrical, mechanical, and acoustic -- to be modeled as a single equivalent circuit and analyzed with the same tools used for any other network [2].

> **SAFETY WARNING:** Loudspeaker voice coils operate at significant power levels. A 100W amplifier driving an 8-ohm load produces 28.3V RMS and 3.5A RMS. At high power, voice coil temperatures can exceed 200C, risking thermal failure and fire. Always respect continuous and peak power ratings specified by the manufacturer [3].

---

## 2. Moving-Coil Driver Physics

### The Force Equation

The moving-coil (dynamic) driver is the dominant loudspeaker technology, accounting for over 95% of all transducers manufactured worldwide. The operating principle is Lorentz force: a current-carrying conductor in a magnetic field experiences a force proportional to the current, the magnetic flux density, and the length of the conductor [4].

```
F = BLi

Where:
  F = force on voice coil (Newtons)
  B = magnetic flux density in the gap (Tesla)
  L = length of wire in the magnetic field (meters)
  i = current through the voice coil (Amperes)
  BL = the "force factor" or "motor strength" (T*m)
```

The BL product is the single most important parameter defining a driver's motor strength. A high BL product means more force per ampere of current, which translates to higher sensitivity and better amplifier control over the cone's motion. Typical values range from 3-5 T*m for a midrange driver to 15-25 T*m for a high-performance woofer [5].

### The Back-EMF Problem

As the voice coil moves through the magnetic field, it generates a back-EMF (electromotive force) proportional to its velocity:

```
V_back = BL * v

Where:
  V_back = back-EMF voltage (V)
  v = voice coil velocity (m/s)
```

This back-EMF opposes the driving voltage and is the mechanism by which the amplifier "knows" what the speaker is doing. A high-damping-factor amplifier (low output impedance) effectively short-circuits this back-EMF, providing electromagnetic braking that controls cone motion after the driving signal ceases. This is why damping factor matters: it determines how quickly resonances and transients are controlled [6].

### Cone Motion and Resonance

The moving system (cone, voice coil, surround, spider) behaves as a mass-spring-damper system. The resonant frequency is:

```
fs = 1 / (2 * pi * sqrt(Mms * Cms))

Where:
  fs = free-air resonant frequency (Hz)
  Mms = total moving mass (voice coil + cone + air load) (kg)
  Cms = mechanical compliance of suspension (m/N)
```

Below resonance, the cone motion is controlled by the suspension stiffness (spring-controlled). At resonance, motion is limited only by damping (resistance-controlled). Above resonance, mass dominates and motion decreases at 12 dB/octave (mass-controlled). This fundamental behavior shapes the entire frequency response of the driver [7].

### Cone Materials and Their Acoustic Properties

The ideal cone material would have infinite stiffness, zero mass, and high internal damping. No material satisfies all three requirements simultaneously, so cone material selection is always a compromise [8]:

| Material | Density (kg/m3) | Stiffness | Damping | Typical Use |
|----------|----------------|-----------|---------|-------------|
| Paper (treated) | 300-600 | Moderate | High | Woofers, full-range |
| Polypropylene | 900 | Low | Very high | Budget woofers |
| Kevlar (woven) | 1440 | High | Moderate | Midrange (B&W tradition) |
| Aluminum | 2700 | Very high | Very low | Tweeters, midrange |
| Beryllium | 1850 | Extreme | Low | Reference tweeters |
| Carbon fiber | 1600 | Very high | Moderate | High-end woofers |
| Diamond (CVD) | 3500 | Extreme | Very low | Ultra-reference tweeters |

Beryllium has the highest speed of sound of any metal (12,890 m/s), pushing the first breakup mode well above the driver's operating range. This is why beryllium tweeters can operate to 40 kHz or beyond without breakup artifacts. The tradeoff is cost (beryllium vapor is toxic to machine) and brittleness [9].

---

## 3. Thiele-Small Parameters

### The Lumped Parameter Model

In 1961, A.N. Thiele published a landmark paper in the *Proceedings of the IRE Australia* applying electrical filter theory to loudspeaker enclosure design [10]. Richard Small extended this work at the University of Sydney in the early 1970s, developing the complete set of parameters that now bear both their names [11].

The Thiele-Small (T-S) parameters model the loudspeaker driver as a lumped-element electrical equivalent circuit, valid below the frequency where the cone begins to flex (the "pistonic range"). The key parameters are:

```
THIELE-SMALL PARAMETER SET
================================================================

  MECHANICAL:
    fs  = free-air resonance frequency (Hz)
    Qms = mechanical Q factor (losses in suspension)
    Qes = electrical Q factor (electromagnetic damping)
    Qts = total Q factor = (Qms * Qes) / (Qms + Qes)
    Vas = equivalent acoustic compliance volume (liters)
    Mms = total moving mass (grams)
    Cms = mechanical compliance (mm/N)
    Rms = mechanical resistance (N*s/m)
    BL  = force factor (T*m)

  ELECTRICAL:
    Re  = DC resistance of voice coil (Ohms)
    Le  = voice coil inductance (mH)
    Zmax = impedance at resonance (Ohms)

  SENSITIVITY:
    Sd  = effective radiating area (cm^2)
    eta0 = reference efficiency (%)
    SPL = sensitivity (dB/W/m)
```

### Interpreting the Parameters

**Qts** is the most immediately useful parameter for enclosure selection. A driver with Qts < 0.4 is suited to a vented (bass-reflex) enclosure. A driver with Qts between 0.5 and 0.7 works well in a sealed (acoustic suspension) enclosure. Qts > 0.7 suggests an open-baffle or free-air application [12].

**Vas** represents the volume of air that has the same compliance as the driver's suspension. A large Vas indicates a compliant suspension and typically requires a larger enclosure. The ratio of Vas to enclosure volume (Vb) determines the system Q and the low-frequency roll-off characteristic.

**Efficiency** for a typical home loudspeaker driver is strikingly low. The reference efficiency formula is:

```
eta0 = (4 * pi^2 * fs^3 * Vas) / (c^3 * Qes)

Typical values:
  Budget woofer:     0.2-0.5%
  High-end woofer:   0.5-2%
  Pro-audio woofer:  2-5%
  Horn-loaded:       10-25%
```

The vast majority of electrical energy delivered to a loudspeaker is converted to heat in the voice coil, not to acoustic output. A 200W amplifier driving a 1% efficient speaker produces 2W of acoustic power and 198W of heat [13].

---

## 4. Enclosure Acoustics

### Why Enclosures Exist

Without an enclosure, the front and rear radiation from a speaker cone would destructively interfere at low frequencies where the wavelength is much larger than the cone diameter. A 165mm (6.5") woofer would have effectively zero bass output below approximately 200 Hz in free air because the rear wave wraps around the baffle edge and cancels the front wave. The enclosure exists to prevent this cancellation [14].

### Sealed (Acoustic Suspension) Enclosures

The sealed enclosure was popularized by Edgar Villchur and Henry Kloss at Acoustic Research (AR) in the 1950s. The trapped air acts as an additional spring in parallel with the driver's mechanical suspension, raising the system resonant frequency:

```
fc = fs * sqrt(1 + Vas/Vb)

Where:
  fc = system resonant frequency
  fs = driver free-air resonance
  Vas = driver equivalent volume
  Vb = enclosure internal volume
```

The sealed enclosure provides a second-order (12 dB/octave) high-pass roll-off below resonance, the gentlest of all enclosure alignments. This gentle roll-off produces excellent transient response -- the system rings less than a ported design [15].

### Ported (Bass-Reflex) Enclosures

The bass-reflex enclosure, patented by Albert Thuras of Bell Labs in 1932, adds a tuned port (vent) that converts the enclosure into a Helmholtz resonator. At the port tuning frequency (fb), the port output is in phase with the cone output, reinforcing the bass. The system provides a fourth-order (24 dB/octave) high-pass roll-off -- steeper than sealed, but extending lower for the same enclosure volume [16].

```
BASS-REFLEX PORT TUNING
================================================================

  fb = (c / (2 * pi)) * sqrt(Sp / (Lv * Vb))

  Where:
    fb = port tuning frequency (Hz)
    c  = speed of sound (343 m/s)
    Sp = port cross-sectional area (m^2)
    Lv = effective port length (m) = physical length + end correction
    Vb = enclosure volume (m^3)

  Port air velocity at resonance:
    v_port = Vd * (2 * pi * fb) / Sp

  SAFETY: Port air velocity should not exceed ~10 m/s to avoid
  audible turbulence (chuffing). This sets the minimum port area.
```

### Transmission Line Enclosures

The transmission line (TL) enclosure, championed by A.R. Bailey in the 1960s and commercially developed by IMF and later PMC, uses a long, tapered, damped acoustic waveguide behind the driver. The line is typically one-quarter wavelength long at the driver's resonant frequency. The rear wave travels down the line, is progressively absorbed by the damping material, and what remains exits from the open end in phase with the front wave [17].

Transmission lines offer a unique combination: extended bass response with the transient quality of a sealed system. The tradeoff is size -- a line tuned to 35 Hz requires approximately 2.4 meters of internal path length.

---

## 5. Crossover Network Theory

### Why Multiple Drivers

No single driver can reproduce the entire audible frequency range (20 Hz to 20 kHz) with acceptable performance. A cone large enough to radiate bass efficiently (200mm+) will beam severely at high frequencies, and a diaphragm light enough for extended treble response cannot move enough air for bass. Multi-way systems divide the spectrum between specialized drivers using crossover networks [18].

### Filter Topologies

Crossover networks are electrical filters that divide the audio signal into frequency bands. The primary topologies are:

| Order | Slope | Filter Type | Acoustic Phase | Lobing |
|-------|-------|-------------|----------------|--------|
| 1st | 6 dB/oct | Butterworth | 0 degrees | None (ideal) |
| 2nd | 12 dB/oct | Linkwitz-Riley | 0 degrees | Minimal |
| 3rd | 18 dB/oct | Butterworth | 0 degrees | Moderate |
| 4th | 24 dB/oct | Linkwitz-Riley | 0 degrees | Minimal |

The Linkwitz-Riley alignment (named for Siegfried Linkwitz and Russ Riley) is preferred for even-order crossovers because it sums to a flat amplitude response when both drivers are in phase. The crossover frequency is where both outputs are at -6 dB, producing a flat sum (unity gain) [19].

### Passive vs Active Crossovers

**Passive crossovers** use inductors, capacitors, and resistors placed between the amplifier and the drivers. They are lossy (power is dissipated in component resistances), interact with the driver's impedance curve, and cannot be easily adjusted. However, they require only a single amplifier channel.

**Active crossovers** divide the signal before amplification, with each driver receiving its own dedicated amplifier channel. Advantages include: zero insertion loss, immunity to driver impedance variations, independent level and delay adjustment per driver, and the ability to implement arbitrary filter shapes digitally. The tradeoff is cost -- a three-way active system requires six amplifier channels and a DSP crossover [20].

```
PASSIVE vs ACTIVE SIGNAL FLOW
================================================================

  PASSIVE:
    Source --> Amplifier --> Passive XO --> Woofer
                                       --> Tweeter

  ACTIVE:
    Source --> Active XO --> Amp 1 --> Woofer
                         --> Amp 2 --> Tweeter
```

### Time Alignment

In a multi-way speaker, the acoustic centers of the drivers are at different physical distances from the listener. A tweeter dome sits several centimeters forward of the woofer cone's acoustic center. If uncorrected, the outputs arrive at the listener at different times, causing phase cancellation at the crossover frequency. Solutions include: stepped baffles, driver offset (physically recessing the tweeter), first-order crossovers (inherently time-aligned), and digital delay correction in active systems [21].

---

## 6. Electrostatic Loudspeakers

### Operating Principle

The electrostatic loudspeaker (ESL) uses a thin conductive diaphragm (typically Mylar coated with graphite or gold, thickness 2-12 micrometers) suspended between two perforated metal stators. A high DC bias voltage (1,500-5,000V) charges the diaphragm, and the audio signal is applied to the stators through a step-up transformer. The resulting electrostatic force drives the diaphragm in proportion to the audio signal [22].

```
ELECTROSTATIC SPEAKER -- CROSS SECTION
================================================================

  [Stator 1] |||||||  Audio signal (+)
             - - - -  Air gap (~1-2mm)
  [Diaphragm] ------  Bias voltage (2-5kV DC)
             - - - -  Air gap (~1-2mm)
  [Stator 2] |||||||  Audio signal (-)

  Force on diaphragm:
    F = (epsilon_0 * A * V_bias * V_signal) / d^2

  Where:
    epsilon_0 = permittivity of free space
    A = diaphragm area
    V_bias = DC bias voltage
    V_signal = audio signal voltage
    d = air gap distance
```

### Advantages and Limitations

ESLs offer extraordinarily low distortion (THD < 0.01% is typical), extremely low moving mass (the diaphragm may weigh less than a gram for a full-range panel), and uniform drive force across the entire radiating area -- eliminating the breakup modes that plague cone drivers. The result is exceptional transient response and transparency [23].

Limitations include: the requirement for a dedicated high-voltage bias supply, limited maximum SPL (air breakdown occurs at approximately 3 kV/mm), dipole radiation pattern (equal energy front and rear, requiring careful room placement), and limited bass extension for practical panel sizes. Hybrid designs (ESL panel for midrange/treble, conventional woofer for bass) address the bass limitation while preserving the electrostatic midrange [24].

---

## 7. Planar Magnetic and Ribbon Drivers

### Planar Magnetic (Isodynamic) Drivers

Planar magnetic drivers use a thin diaphragm with a conductive trace (voice coil) bonded directly to it, suspended in a magnetic field produced by an array of bar magnets arranged on one or both sides of the diaphragm. The force is distributed across the entire diaphragm surface rather than concentrated at a central voice coil, eliminating the cone breakup problem [25].

The planar magnetic driver combines advantages of both dynamic and electrostatic designs: low moving mass (like an ESL), no high-voltage bias requirement (unlike an ESL), and the ability to achieve high SPL (unlike most ESLs). Companies like Magnepan (since 1969) and Audeze (headphones) have made planar magnetic technology commercially successful.

### True Ribbon Drivers

A true ribbon driver uses the diaphragm itself as the conductor -- a thin corrugated aluminum foil strip (typically 2-10 micrometers thick) suspended between the poles of powerful magnets. The ribbon carries the signal current directly, with no separate voice coil. This produces the lowest possible moving mass of any electromagnetic transducer [26].

The ribbon's extremely low impedance (typically 0.1-0.5 ohms) requires a matching transformer to present a usable load to the amplifier. Modern ribbon tweeters (Fountek, RAAL) achieve bandwidth to 40 kHz and beyond with distortion below 0.1%.

```
DRIVER TECHNOLOGY COMPARISON
================================================================

  Technology      | Moving Mass | Max SPL | Distortion | Bandwidth
  ----------------+-------------+---------+------------+----------
  Dynamic cone    | 5-50g       | 120+ dB | 0.1-1%     | 2 decades
  Electrostatic   | 0.1-1g     | 105 dB  | <0.01%     | 3+ decades
  Planar magnetic | 0.5-5g     | 115 dB  | 0.05-0.3%  | 3 decades
  True ribbon     | 0.01-0.1g  | 108 dB  | <0.1%      | 3+ decades
  Balanced armature| 0.01g     | 110 dB  | 0.3-1%     | 2 decades
```

---

## 8. Horn Loading and Waveguides

### Acoustic Impedance Matching

The fundamental problem with a direct-radiating cone speaker is the enormous impedance mismatch between the cone and the air. The acoustic impedance of a 200mm cone is approximately 40 Pa*s/m3, while the acoustic impedance of free air at the cone surface is about 0.4 Pa*s/m3 -- a 100:1 mismatch. This means 99% of the mechanical energy is reflected back into the cone rather than radiated as sound [27].

A horn acts as an acoustic transformer, gradually matching the high impedance at the driver's diaphragm (the throat) to the low impedance of free air at the horn mouth. This can increase a driver's efficiency from 1-2% to 10-50%, a gain of 10-17 dB in sensitivity.

### Horn Profiles

The horn's flare rate (how quickly the cross-sectional area increases with distance) determines its low-frequency cutoff and directivity:

| Profile | Expansion Law | Character |
|---------|--------------|-----------|
| Exponential | S(x) = S0 * e^(mx) | Classic horn sound, sharp LF cutoff |
| Hyperbolic | S(x) = S0 * cosh^2(x/x0) | Extended LF response, smoother rolloff |
| Conical | S(x) = S0 * (1 + x/x0)^2 | Simplest to build, poorest LF loading |
| Tractrix | Ogee curve | Constant directivity, minimal reflections |
| Oblate spheroid | OS waveguide | Modern constant-directivity design |

The horn's low-frequency cutoff is determined by its mouth circumference equaling one wavelength: `f_cutoff = c / (pi * D_mouth)`. A horn with a 1-meter mouth diameter has a cutoff at approximately 109 Hz. This is why bass horns are enormous -- a horn loaded to 30 Hz requires a mouth nearly 4 meters across [28].

### Constant Directivity

Modern waveguide design (pioneered by Don Keele, Earl Geddes, and Patrick Flanagan) aims for constant directivity -- maintaining the same radiation pattern across the entire operating bandwidth. The oblate spheroidal waveguide achieves this by presenting a smoothly expanding impedance transition that controls directivity without the resonant honk of traditional exponential horns [29].

---

## 9. The Loudspeaker as a System

### System Design Philosophy

A loudspeaker is not a collection of drivers -- it is a system in which the enclosure, crossover, drivers, and their interactions with the listening room form an inseparable whole. The crossover must account for the drivers' natural roll-off characteristics, their acoustic offsets, their impedance curves, and the diffraction effects of the baffle [30].

### Baffle Diffraction

When a sound wave from the driver reaches the edge of the cabinet, part of the wavefront continues forward and part diffracts around the edge, creating a secondary source. This secondary source interferes with the primary radiation, producing a characteristic ripple in the frequency response. The first dip occurs at a frequency where the path-length difference equals one-half wavelength. For a typical bookshelf speaker (200mm baffle width), the first diffraction dip occurs near 1 kHz [31].

Solutions include: rounded cabinet edges (radius > 25mm), flush-mounted drivers (eliminating the step at the driver surround), curved cabinets (eliminating parallel edges entirely), and felt or foam rings around the driver to absorb the diffracted wave.

### Cabinet Resonances

The cabinet itself is an acoustic resonator. Internal standing waves (at frequencies where the cabinet dimension equals a half-wavelength) produce pressure peaks that drive the cabinet walls into vibration, radiating colored sound. Internal damping material (acoustic foam, polyester fiber, long-hair wool) absorbs these standing waves. The density and placement of damping material is critical: too little leaves resonances audible, too much over-damps the enclosure and raises the system Q [32].

Cabinet wall vibration is addressed through a combination of material stiffness (MDF, HDF, bamboo ply), bracing (internal struts that break up large panel areas), and damping compounds (bitumen pads, constrained-layer damping sheets) that convert vibrational energy to heat.

---

## 10. Measurement and Characterization

### Frequency Response

Frequency response is measured with the speaker in an anechoic environment (or using windowed quasi-anechoic techniques) at 1 meter on-axis, driven by a swept sine, MLS (maximum-length sequence), or log chirp signal. The result is expressed as SPL vs frequency, typically over 20 Hz to 20 kHz. A deviation of +/- 3 dB from a reference level is the standard tolerance for "flat" response in a home loudspeaker [33].

### Impedance

A loudspeaker is not a resistor. Its impedance varies dramatically with frequency, peaking at the resonant frequency (where impedance may reach 50-100 ohms) and falling to a minimum at higher frequencies (the nominal impedance, typically 4 or 8 ohms). The impedance curve reveals the resonant frequency, the enclosure tuning (ported designs show a double peak), and the crossover frequency [34].

### Distortion

THD (Total Harmonic Distortion) in loudspeakers is typically 0.5-3% at moderate levels -- far higher than any amplifier or DAC in the chain. At high SPL, distortion rises rapidly as the suspension and motor become increasingly nonlinear. The dominant distortion mechanisms are: voice coil offset from the magnetic gap center, suspension nonlinearity at large excursion, and flux modulation as the voice coil's own magnetic field interacts with the permanent magnet [35].

### Waterfall and CSD Plots

Cumulative Spectral Decay (CSD or "waterfall") plots show how quickly a speaker stops producing sound after the input signal ceases. They reveal resonant modes that continue to ring, coloring the sound with lingering energy at specific frequencies. A well-designed speaker shows rapid, uniform decay across the entire spectrum. Persistent ridges in the waterfall plot indicate resonance problems -- often cone breakup, cabinet resonance, or underdamped crossover behavior [36].

---

## 11. Cross-References

> **Related:** [Amplifier Topology](02-amplifier-topology.md) -- damping factor, impedance interaction, amplifier-speaker interface. [Room Acoustics](04-room-acoustics-psychoacoustics.md) -- room loading, boundary reinforcement, placement optimization. [Headphone Technology](05-headphone-technology-personal-audio.md) -- miniature transducer variants.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** Spectral analysis of speaker response; THD measurement techniques
- **SGL (Signal & Light):** DSP crossover implementation; FIR/IIR filter theory
- **EMG (Electric Motors):** Voice coil as linear motor; magnetic circuit design
- **LED (LED & Controllers):** Impedance matching parallels in driver circuits
- **BPS (Sensor Physics):** Microphone transducers as inverse of loudspeaker drivers
- **FQC (Frequency Continuum):** Fourier analysis of speaker cone breakup modes
- **SNL (Sound & Noise Lab):** Acoustic measurement methodology; anechoic technique

---

## 12. Sources

1. Borwick, J. (ed.). *Loudspeaker and Headphone Handbook*. 3rd ed. Focal Press, 2001.
2. Beranek, L.L. *Acoustics*. Acoustical Society of America, 1993. Chapter 3: Electromechanical analogies.
3. IEC 60268-5. "Sound System Equipment -- Part 5: Loudspeakers." International Electrotechnical Commission, 2003.
4. Newell, P. and Holland, K. *Loudspeakers: For Music Recording and Reproduction*. Focal Press, 2007.
5. Klippel, W. "Nonlinear Modeling of the Heat Transfer in Loudspeakers." *J. Audio Eng. Soc.*, vol. 52, no. 1/2, 2004.
6. Leach, W.M. "Impedance Compensation Networks for the Lossy Voice-Coil Inductance of Loudspeaker Drivers." *J. Audio Eng. Soc.*, vol. 52, no. 4, 2004.
7. Small, R.H. "Closed-Box Loudspeaker Systems Part I: Analysis." *J. Audio Eng. Soc.*, vol. 20, no. 10, 1972.
8. Shindo, T. et al. "Effect of Voice-Coil and Cone Combination on Loudspeaker Cone Vibration." *J. Audio Eng. Soc.*, vol. 28, 1980.
9. Materion Corporation. "Beryllium Speaker Dome Technology." Technical White Paper, 2019.
10. Thiele, A.N. "Loudspeakers in Vented Boxes." *Proceedings of the IRE Australia*, vol. 22, no. 8, 1961. Reprinted JAES 1971.
11. Small, R.H. "Vented-Box Loudspeaker Systems." *J. Audio Eng. Soc.*, Parts I-IV, vol. 21-22, 1973.
12. Dickason, V. *The Loudspeaker Design Cookbook*. 7th ed. Audio Amateur Press, 2006.
13. D'Appolito, J. *Testing Loudspeakers*. Audio Amateur Press, 1998.
14. Olson, H.F. "Direct Radiator Loudspeaker Enclosures." *J. Audio Eng. Soc.*, vol. 17, no. 1, 1969.
15. Villchur, E. "Problems of Bass Reproduction in Loudspeakers." *J. Audio Eng. Soc.*, vol. 5, no. 3, 1957.
16. Thuras, A.L. "Sound Translating Device." US Patent 1,869,178, 1932.
17. Bailey, A.R. "A Non-Resonant Loudspeaker Enclosure Design." *Wireless World*, October 1965.
18. Linkwitz, S. "Active Crossover Networks for Non-Coincident Drivers." *J. Audio Eng. Soc.*, vol. 24, no. 1, 1976.
19. Linkwitz, S. and Riley, R. "Crossover Networks for Loudspeakers." AES Convention Preprint, 1978.
20. Fincham, L.R. "A Bandpass Loudspeaker Enclosure." AES Convention Preprint 1512, 1979.
21. Vanderkooy, J. and Lipshitz, S.P. "Power Response of Loudspeakers with Noncoincident Drivers." *J. Audio Eng. Soc.*, vol. 34, no. 4, 1986.
22. Hunt, F.V. *Electroacoustics: The Analysis of Transduction and Its Historical Background*. Acoustical Society of America, 1982.
23. Baxandall, P.J. "Electrostatic Loudspeakers." Chapter in Borwick (2001).
24. Sanders, R. "An Electrostatic Speaker System." *Speaker Builder*, vol. 1, no. 2, 1980.
25. Klayman, A. "Planar Magnetic Transducer Design." AES Convention Preprint, 2010.
26. Raal Requisite. "True Ribbon Driver Technology." Technical Documentation, 2020.
27. Keele, D.B. "What's So Sacred About Exponential Horns?" AES Convention Preprint 1038, 1973.
28. Geddes, E.R. "Acoustic Waveguide Theory." *J. Audio Eng. Soc.*, vol. 37, no. 7/8, 1989.
29. Geddes, E.R. and Lee, L.W. "Auditory Perception of Nonlinear Distortion." AES Convention Preprint 5890, 2003.
30. Atkinson, J. "Loudspeaker System Design." *Stereophile*, technical measurement methodology.
31. Vanderkooy, J. "A Simple Theory of Cabinet Edge Diffraction." *J. Audio Eng. Soc.*, vol. 39, no. 12, 1991.
32. Harwood, H.D. "Loudspeaker Cabinet Diffraction." *BBC Research Department Report*, 1968.
33. AES2-2012. "AES Standard for Acoustics -- Methods of Measuring and Specifying the Performance of Loudspeakers for Professional Applications." Audio Engineering Society, 2012.
34. IEC 60268-5. "Sound System Equipment -- Part 5: Loudspeakers." Section 17: Impedance measurement.
35. Klippel, W. "Diagnosis and Remedy of Nonlinearities in Electrodynamical Transducers." AES Convention Preprint, 2006.
36. Bunton, J.D. and Small, R.H. "Cumulative Spectra, Tone Bursts, and Apodization." *J. Audio Eng. Soc.*, vol. 30, 1982.

---

*Hi-Fidelity Audio Reproduction -- Module 1: Speaker Physics & Transducer Design. Electricity becomes weather at the voice coil gap, and the art of fidelity is controlling that storm.*
