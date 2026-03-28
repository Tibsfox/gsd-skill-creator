# DAC Architectures & the Digital Path

> **Domain:** Mixed-Signal Electronics
> **Module:** 3 -- Digital-to-Analog Conversion and the Source Chain
> **Through-line:** *The digital-to-analog converter is where mathematics becomes physics. A stream of binary numbers -- voltage levels representing ones and zeros, sampled 44,100 or more times per second -- must be reconstructed into a continuous analog waveform with enough fidelity that the human ear cannot distinguish the reconstruction from the original. This is the Nyquist promise: any band-limited signal can be perfectly reconstructed from its samples. The DAC is the machine that keeps that promise, and the quality of the promise-keeping defines the ceiling of the entire digital audio chain.*

---

## Table of Contents

1. [The Reconstruction Problem](#1-the-reconstruction-problem)
2. [Nyquist-Shannon Sampling Theorem](#2-nyquist-shannon-sampling-theorem)
3. [R-2R Ladder DAC Architecture](#3-r-2r-ladder-dac-architecture)
4. [Delta-Sigma DAC Architecture](#4-delta-sigma-dac-architecture)
5. [Multibit and Hybrid Architectures](#5-multibit-and-hybrid-architectures)
6. [Oversampling and Digital Filtering](#6-oversampling-and-digital-filtering)
7. [Jitter: The Time-Domain Enemy](#7-jitter-the-time-domain-enemy)
8. [Digital Audio Interfaces](#8-digital-audio-interfaces)
9. [Vinyl vs Digital: The Technical Comparison](#9-vinyl-vs-digital-the-technical-comparison)
10. [Modern DAC Performance](#10-modern-dac-performance)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Reconstruction Problem

A digital audio system captures a continuous analog waveform as a series of discrete samples -- instantaneous measurements of amplitude taken at regular time intervals. The CD standard (Red Book, IEC 60908) specifies 44,100 samples per second (44.1 kHz) at 16-bit resolution, providing 65,536 quantization levels and a theoretical dynamic range of 96.33 dB [1].

The DAC must perform two transformations: convert each digital sample to a precise analog voltage (amplitude accuracy), and output those voltages at precisely the correct moments in time (temporal accuracy). Errors in amplitude produce distortion and noise. Errors in timing produce jitter, which manifests as noise and distortion in the analog output.

```
THE DIGITAL AUDIO SIGNAL PATH
================================================================

  Source        Sampling/         Storage/        DAC           Analog
  (analog) --> Quantization --> Transmission --> Conversion --> Output
              (ADC)           (file/stream)    (DAC)

  CD:        44.1 kHz / 16-bit  -->  96.3 dB dynamic range
  Hi-Res:    96 kHz / 24-bit    --> 144.5 dB dynamic range
  DSD:       2.8224 MHz / 1-bit -->  120 dB dynamic range (shaped)
  Studio:    192 kHz / 24-bit   --> 144.5 dB dynamic range
```

> **SAFETY WARNING:** Some audio equipment uses high-voltage analog outputs. Professional balanced outputs can deliver +24 dBu (12.3V RMS). Headphone amplifiers driving sensitive IEMs at full volume can exceed safe listening levels (85 dB SPL for extended exposure) by 30+ dB, risking permanent hearing damage. Always start at low volume and increase gradually [2].

---

## 2. Nyquist-Shannon Sampling Theorem

### The Theorem

The Nyquist-Shannon sampling theorem (Claude Shannon, 1949, building on Harry Nyquist's 1928 work) states that a band-limited signal can be perfectly reconstructed from its samples if the sampling rate is at least twice the highest frequency component in the signal [3]:

```
f_s >= 2 * f_max

Where:
  f_s = sampling frequency
  f_max = highest frequency in the signal (bandwidth)

For CD audio:
  f_s = 44,100 Hz
  f_max = 22,050 Hz (Nyquist frequency)
  Usable audio bandwidth: ~20,000 Hz (with guard band)
```

The theorem is exact and information-theoretically complete: given ideal sampling and reconstruction, no information is lost. The "staircase" diagram often used to illustrate digital audio is misleading -- the reconstructed signal is a smooth continuous waveform, not a series of steps. The steps exist only in the raw DAC output before the reconstruction filter removes them [4].

### Aliasing

If a signal contains frequencies above the Nyquist frequency (f_s/2), those frequencies are "folded back" into the audio band as aliases -- phantom frequencies that were not in the original signal. Anti-aliasing filters in the ADC and reconstruction filters in the DAC must attenuate these frequencies by at least 80-100 dB to prevent audible artifacts. The steep roll-off required near the Nyquist frequency is one of the primary challenges of digital audio system design [5].

### Why 44.1 kHz?

The CD sampling rate of 44.1 kHz was chosen to satisfy the Nyquist criterion for the 20 kHz audio band with a practical guard band for the anti-aliasing filter. The specific number 44,100 derives from the early Sony/Philips digital recording systems that used modified U-matic video recorders: 44,100 = 3 x 3 x 5 x 5 x 7 x 7 x 4, a number compatible with both NTSC (525 lines, 30 fps) and PAL (625 lines, 25 fps) video formats [6].

---

## 3. R-2R Ladder DAC Architecture

### Operating Principle

The R-2R ladder DAC uses a resistor network with only two resistor values (R and 2R) to convert a binary digital word into a proportional analog voltage. Each bit of the digital input controls a switch that connects either to a reference voltage (for a "1") or to ground (for a "0"). The resistor network performs binary-weighted current summing [7].

```
R-2R LADDER DAC (4-BIT SIMPLIFIED)
================================================================

  Vref ----[2R]---+---[R]---+---[R]---+---[R]---+
                  |         |         |         |
                [2R]      [2R]      [2R]      [2R]
                  |         |         |         |
               [SW3]    [SW2]    [SW1]    [SW0]    --> I_out
              (MSB)                        (LSB)

  Each switch connects to Vref (bit=1) or GND (bit=0)
  The current contribution of each bit is exactly half
  the bit above it, producing binary weighting.

  For N-bit resolution:
    I_out = (Vref / (2R)) * SUM(b_i * 2^(i-N))
    where b_i is bit value (0 or 1), i = 0 to N-1
```

### Advantages

The R-2R architecture is inherently monotonic -- each successive code always produces a higher (or equal) output voltage than the previous code. This eliminates the zero-crossing glitches that plague some delta-sigma designs. The output settles to its final value in one clock cycle, providing excellent transient response with no ringing or pre-ringing artifacts [8].

### Challenges

The critical challenge is resistor matching. For 16-bit accuracy, the MSB and LSB resistors must be matched to within 1 part in 65,536 (0.0015%). For 24-bit accuracy, matching must be 1 part in 16,777,216 (0.000006%). This extreme precision requires laser-trimmed thin-film resistors and is the primary reason R-2R DACs are expensive to manufacture. TotalDAC, Denafrips, and MSB Technology produce high-end R-2R DACs using discrete resistor ladders with manual calibration [9].

---

## 4. Delta-Sigma DAC Architecture

### Operating Principle

The delta-sigma (also written sigma-delta) DAC takes the opposite approach from R-2R: instead of converting each multi-bit sample directly, it converts the input to a high-speed, low-resolution (typically 1-bit or 5-bit) bitstream using noise shaping, then uses a simple analog low-pass filter for reconstruction [10].

```
DELTA-SIGMA DAC BLOCK DIAGRAM
================================================================

  Digital     Digital       Delta-Sigma    Analog
  Input  --> Interpolation --> Modulator --> Low-Pass --> Analog
  (16/24-bit) (Oversampling)  (Noise       Filter     Output
   @ 44.1kHz   @ 8x-256x      Shaping)    (simple)
                              1-5 bit
                              output

  Key insight: quantization noise is SHAPED -- pushed to
  ultrasonic frequencies where the output filter removes it.
  In-band noise is dramatically lower than the bit depth
  of the modulator output would suggest.
```

### Noise Shaping

The delta-sigma modulator uses feedback to shape the quantization noise spectrum. Instead of the flat noise floor of a conventional DAC, the noise is pushed out of the audio band and into ultrasonic frequencies. A first-order noise shaper reduces in-band noise by 6 dB per doubling of oversampling ratio. Higher-order modulators (3rd to 7th order are common in modern DACs) achieve 12-18 dB per doubling [11].

The result: a 1-bit delta-sigma DAC running at 256x oversampling (11.29 MHz for a 44.1 kHz input) with a 5th-order noise shaper can achieve a dynamic range exceeding 120 dB in the audio band -- far more than the 6 dB that a 1-bit converter would suggest.

### Advantages and Limitations

Delta-sigma DACs are inexpensive to manufacture (they use digital logic rather than precision analog components), highly integrable onto a single chip, and capable of excellent measured performance. The ESS Sabre ES9038PRO achieves 140 dB dynamic range -- the highest of any commercially available DAC chip [12].

Limitations include: the modulator can produce idle tones (low-level spurious tones when the input is near zero), the output contains significant ultrasonic noise that must be carefully filtered, and the noise-shaping loop can interact with the analog output filter in ways that affect audible performance. Some listeners report a subjective "digital" quality to delta-sigma DACs that is absent from R-2R designs, though controlled listening tests show inconsistent results [13].

---

## 5. Multibit and Hybrid Architectures

### Segmented Multibit

Some DAC architectures use a combination of techniques: the upper bits are converted by a thermometer-coded current source array (each code adds one identical current source, guaranteeing monotonicity), while the lower bits use a binary-weighted network. This "segmented" approach achieves the monotonicity of thermometer coding where it matters most (MSBs) and the efficiency of binary coding for LSBs [14].

### DSD (Direct Stream Digital)

DSD, developed by Sony and Philips for the SACD format, is essentially the raw output of a delta-sigma modulator: a 1-bit stream at 2.8224 MHz (64x the CD rate, called DSD64) or higher (DSD128 at 5.6448 MHz, DSD256 at 11.2896 MHz, DSD512 at 22.5792 MHz). DSD eliminates the digital interpolation and modulation stages of a delta-sigma DAC by encoding the audio directly as a pulse-density-modulated bitstream [15].

```
DSD vs PCM -- ENCODING COMPARISON
================================================================

  PCM (CD): 44,100 samples/sec x 16 bits = 1,411,200 bits/sec
            Each sample: precise amplitude at that instant
            Noise floor: flat at -96.3 dB

  DSD64:    2,822,400 samples/sec x 1 bit = 2,822,400 bits/sec
            Each sample: +1 or -1 (density encodes amplitude)
            Noise floor: shaped -- low in-band, high ultrasonic

  DSD256:   11,289,600 bits/sec
            Noise floor further from audio band
            Dynamic range: ~140 dB in audio band
```

### FPGA-Based DACs

A recent trend uses Field Programmable Gate Arrays (FPGAs) to implement custom digital filters and sigma-delta modulators, allowing the designer to optimize the conversion architecture for a specific sonic target. PS Audio's DirectStream and Chord Electronics' products use FPGA-based conversion where the entire digital processing chain is implemented in custom logic rather than off-the-shelf DAC chips [16].

---

## 6. Oversampling and Digital Filtering

### Why Oversample

The Nyquist theorem requires a brick-wall low-pass filter at the Nyquist frequency (22.05 kHz for CD) to reconstruct the analog signal. A brick-wall analog filter with the required 100+ dB stopband attenuation and flat passband would require extreme component precision and would introduce significant phase shift. Oversampling moves the reconstruction problem from the analog domain to the digital domain, where arbitrary filter characteristics can be achieved with perfect precision [17].

```
OVERSAMPLING -- FILTER REQUIREMENT RELAXATION
================================================================

  No oversampling (1x, 44.1kHz):
    Anti-imaging filter must roll off from 20kHz to 22.05kHz
    Required: >80dB attenuation in 2.05kHz transition band
    Requires 7th-9th order analog filter (severe phase shift)

  4x oversampling (176.4kHz):
    Digital filter upsamples to 176.4kHz
    Anti-imaging filter rolls off from 20kHz to 156.4kHz
    Required: same attenuation over 136.4kHz transition band
    Simple 2nd-order analog filter suffices

  8x oversampling (352.8kHz):
    Even more relaxed analog requirements
    Simple 1st-order RC filter may suffice
```

### Digital Filter Topologies

The digital interpolation filter determines the time-domain behavior of the DAC. Three primary approaches exist:

**Linear-phase FIR filters** provide a perfectly symmetric impulse response with equal pre-ringing and post-ringing. They preserve phase relationships perfectly but create time-domain artifacts (pre-echo) that do not exist in the original analog signal [18].

**Minimum-phase FIR filters** concentrate all ringing after the impulse, eliminating pre-echo. This is considered more "natural" by some listeners because real acoustic events do not produce pre-echo. The tradeoff is non-linear phase response, which alters the phase relationship between different frequency components.

**Apodizing filters** (such as the Meridian design) are specifically shaped to remove the pre-ringing artifacts of the recording's original anti-aliasing filter, producing an overall system response with reduced time-domain artifacts.

---

## 7. Jitter: The Time-Domain Enemy

### What Jitter Is

Jitter is the deviation of the DAC's sampling clock from its ideal periodic timing. Instead of converting each sample at precisely the correct moment, the conversion occurs slightly early or late. This timing error modulates the amplitude of the reconstructed signal, producing noise and distortion sidebands [19].

```
JITTER -- TIMING ERROR EFFECT
================================================================

  Ideal:     Sample at t = n * T_s (perfectly periodic)
  Real:      Sample at t = n * T_s + J(n) (with jitter J)

  For a full-scale sine wave at frequency f:
    SNR_jitter = -20 * log10(2 * pi * f * J_rms)

  Example: 10 kHz signal, 100 picosecond RMS jitter:
    SNR = -20 * log10(2 * pi * 10000 * 100e-12)
    SNR = -20 * log10(6.28e-6)
    SNR = 104 dB

  Example: 10 kHz signal, 1 nanosecond RMS jitter:
    SNR = 84 dB (20 dB worse!)
```

### Jitter Sources

The primary jitter sources in a digital audio system are: the master clock oscillator's phase noise, data-dependent jitter in the digital transmission interface (S/PDIF, AES3), power supply noise coupling into the clock circuit, substrate coupling in integrated circuits, and electromagnetic interference [20].

### Reclocking and Jitter Reduction

The most effective jitter reduction technique is asynchronous reclocking: the incoming digital data is written to a buffer memory, and a local, ultra-low-jitter clock reads it out at the correct rate. The buffer decouples the DAC's conversion timing from the transport's transmission timing. Modern USB DAC implementations use asynchronous mode where the DAC's clock is the master, requesting data from the computer at the rate the DAC needs it [21].

Crystal oscillator performance: a standard crystal oscillator achieves approximately 1 nanosecond RMS jitter. A temperature-compensated crystal oscillator (TCXO) achieves 100-500 picoseconds. An oven-controlled crystal oscillator (OCXO) achieves 1-10 picoseconds. The highest-performance DACs use femtosecond-class clock circuits with jitter below 100 femtoseconds [22].

---

## 8. Digital Audio Interfaces

### S/PDIF and AES3

S/PDIF (Sony/Philips Digital Interface, IEC 60958-3) and AES3 (AES/EBU, the professional variant) use a single-wire serial protocol to transmit stereo PCM audio with embedded clock. The biphase-mark encoding ensures the receiver can recover the clock from the data stream, but this recovered clock inherits any jitter present in the transmission [23].

| Interface | Connector | Impedance | Max Rate | Cable Length |
|-----------|-----------|-----------|----------|-------------|
| S/PDIF coaxial | RCA | 75 ohm | 192 kHz/24-bit | 10m |
| S/PDIF optical | TOSLINK | N/A (optical) | 96 kHz/24-bit | 5m |
| AES3 | XLR | 110 ohm | 192 kHz/24-bit | 100m |

### I2S

I2S (Inter-IC Sound, Philips, 1986) is a three-wire serial bus designed for communication between digital audio ICs within a device: a serial data line, a word clock (left/right channel select), and a bit clock. Because the clock is transmitted on a separate wire (not embedded in the data), I2S is inherently lower-jitter than S/PDIF. Some high-end DACs expose an I2S input for direct connection from a digital transport [24].

### USB Audio

USB audio has evolved through several generations. USB Audio Class 1 (UAC1) operates in isochronous mode at the computer's clock rate, introducing jitter from the USB bus. USB Audio Class 2 (UAC2) supports asynchronous mode where the DAC controls the clock, dramatically reducing jitter. UAC2 supports sample rates up to 384 kHz at 32-bit resolution [25].

---

## 9. Vinyl vs Digital: The Technical Comparison

### Vinyl: The Mechanical Storage Medium

A vinyl LP encodes audio as a continuous spiral groove in a polyvinyl chloride disc. The groove walls are modulated by the audio signal: vertical modulation for the difference (L-R) signal and lateral modulation for the sum (L+R) signal. A stylus traces the groove, and the cartridge converts the stylus motion to an electrical signal [26].

```
VINYL TECHNICAL PARAMETERS
================================================================

  Dynamic range:       ~60-70 dB (practical, groove noise limited)
  Frequency response:  20 Hz - 20 kHz (RIAA equalized)
  Channel separation:  25-35 dB at 1 kHz
  THD:                 0.5-2% (inner groove, higher)
  Wow and flutter:     0.1-0.3% (typical turntable)
  SNR:                 ~65 dB (unweighted)

  RIAA equalization curve:
    +20 dB at 50 Hz (boost bass on playback)
    -20 dB at 20 kHz (cut treble on playback)
    Three time constants: 3180 us, 318 us, 75 us
```

### Digital: The Mathematical Representation

| Parameter | CD (Red Book) | Hi-Res PCM | DSD256 | Vinyl (typical) |
|-----------|--------------|-----------|--------|----------------|
| Dynamic range | 96 dB | 144 dB | ~140 dB | 60-70 dB |
| Frequency response | 20-20kHz | 20-96kHz | 20-100kHz | 20-20kHz |
| THD | <0.003% | <0.001% | <0.002% | 0.5-2% |
| Channel separation | >90 dB | >110 dB | >100 dB | 25-35 dB |
| SNR | 96 dB | 120+ dB | 120+ dB | ~65 dB |
| Degradation | None (bit-perfect) | None | None | Progressive (wear) |

### The Subjective Dimension

Despite vinyl's measurable inferiority on every technical parameter, many listeners prefer vinyl playback. The probable explanations include: the RIAA curve shapes the frequency response in a way some find pleasing, the even-order harmonic distortion from the cartridge and phono stage adds "warmth," the mechanical tracking of the groove creates a subtle modulation (wow and flutter) that some perceive as "organic," and the ritual of vinyl playback (cleaning, cueing, flipping) creates an attentive listening context that improves the subjective experience [27].

The scientific consensus (AES, IEEE) is that a properly implemented digital system is technically superior to vinyl in every measurable dimension. The subjective preference for vinyl is a real psychoacoustic phenomenon rooted in the listener's relationship with the medium, not in any technical advantage of the format [28].

---

## 10. Modern DAC Performance

### State of the Art (2024-2026)

The current generation of DAC chips has essentially solved the conversion problem for the audio band. The ESS ES9038PRO achieves 140 dB dynamic range and -122 dB THD+N. The AKM AK4499EX achieves 137 dB dynamic range. The Texas Instruments PCM1794A, though older, remains a reference design at 129 dB dynamic range with its R-2R architecture [29].

### The Post-DAC Signal Path

At these performance levels, the DAC chip itself is no longer the limiting factor. The overall DAC system performance is determined by: the analog output stage (I/V conversion, buffering, filtering), the power supply quality, the PCB layout and grounding, the clock oscillator performance, and the mechanical and thermal environment. A well-designed DAC product using a $5 chip can outperform a poorly designed product using a $25 chip [30].

### MQA and Lossy "Hi-Res"

MQA (Master Quality Authenticated) is a controversial proprietary codec that claims to deliver "master quality" audio in a compressed format. Independent analysis by researchers including Archimago and the GoldenSound team has demonstrated that MQA is a lossy codec that discards information present in the original master, despite marketing claims of lossless quality. The AES has published papers questioning MQA's technical claims [31].

---

## 11. Cross-References

> **Related:** [Amplifier Topology](02-amplifier-topology.md) -- DAC output driving amplifier input stage, gain structure. [Room Acoustics](04-room-acoustics-psychoacoustics.md) -- the psychoacoustic limits that define sufficient DAC performance. [Speaker Physics](01-speaker-physics-transducers.md) -- the analog chain from DAC output to acoustic output.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** FFT analysis of DAC output spectra; jitter measurement
- **SGL (Signal & Light):** DSP filter implementation; oversampling algorithms
- **FQC (Frequency Continuum):** Nyquist theorem foundations; spectral analysis
- **LED (LED & Controllers):** PWM parallels with delta-sigma modulation
- **BPS (Sensor Physics):** ADC architectures as the inverse of DAC
- **SNY (Synthesis):** DSD encoding as a form of pulse-density modulation

---

## 12. Sources

1. IEC 60908. "Audio Recording -- Compact Disc Digital Audio System." International Electrotechnical Commission, 1999.
2. NIOSH. "Criteria for a Recommended Standard: Occupational Noise Exposure." Publication 98-126, 1998.
3. Shannon, C.E. "Communication in the Presence of Noise." *Proc. IRE*, vol. 37, no. 1, pp. 10-21, January 1949.
4. Lavry, D. "Sampling Theory for Digital Audio." Lavry Engineering Technical Paper, 2004.
5. Oppenheim, A.V. and Schafer, R.W. *Discrete-Time Signal Processing*. 3rd ed. Pearson, 2010.
6. Doi, T. "PCM Recording and the Compact Disc." AES Convention Preprint, 1982.
7. Analog Devices. "A Technical Tutorial on Digital Signal Synthesis." Application Note, 1999.
8. MSB Technology. "Discrete Ladder DAC Technology." Technical White Paper, 2020.
9. Denafrips. "R-2R Ladder Architecture in the Terminator DAC." Technical Documentation, 2021.
10. Norsworthy, S.R., Schreier, R., and Temes, G.C. *Delta-Sigma Data Converters: Theory, Design, and Simulation*. IEEE Press, 1997.
11. Schreier, R. and Temes, G.C. *Understanding Delta-Sigma Data Converters*. 2nd ed. IEEE Press, 2017.
12. ESS Technology. "ES9038PRO Premier Audio DAC." Product Specification, 2016.
13. Archimago. "Objective Measurements of Delta-Sigma vs R-2R DACs." 2019.
14. Van de Plassche, R.J. *CMOS Integrated Analog-to-Digital and Digital-to-Analog Converters*. 2nd ed. Springer, 2003.
15. Frey, B. "SACD: Direct Stream Digital and the Super Audio CD." *IEEE Signal Processing Magazine*, March 2004.
16. Watts, R. (Chord Electronics). "FPGA-Based Digital-to-Analog Conversion." AES Convention Presentation, 2016.
17. Adams, R.W. "Design and Implementation of an Audio 18-Bit A/D Converter Using Oversampling Techniques." *J. Audio Eng. Soc.*, vol. 34, no. 3, 1986.
18. Craven, P.G. "Antialias Filters and System Transient Response at High Sample Rates." *J. Audio Eng. Soc.*, vol. 52, no. 3, 2004.
19. Dunn, J. "Jitter: Specification and Assessment in Digital Audio Equipment." AES Convention Preprint 3361, 1992.
20. Harris, S. "The Effects of Sampling Clock Jitter on Nyquist Sampling Analog-to-Digital Converters." *J. Audio Eng. Soc.*, vol. 40, no. 6, 1992.
21. Pfleiderer, B. "Asynchronous USB Audio: Architecture and Implementation." AES Convention Preprint, 2012.
22. Wenzel Associates. "Crystal Oscillator Phase Noise." Technical Application Note, 2001.
23. IEC 60958-3. "Digital Audio Interface -- Part 3: Consumer Applications." International Electrotechnical Commission, 2006.
24. Philips Semiconductors. "I2S Bus Specification." February 1986, revised June 1996.
25. USB Implementers Forum. "Universal Serial Bus Device Class Definition for Audio Devices." Release 2.0, 2020.
26. Aldous, D. *The LP is Back! A Guide to Vinyl Records.* Schiffer Publishing, 2014.
27. Levitin, D.J. *This Is Your Brain on Music*. Dutton/Penguin, 2006.
28. AES Technical Committee on Audio for Telecommunications. "AES Information Document for Digital Audio -- Personal Computer Audio Quality Measurements." AES-6id-2006.
29. Texas Instruments. "PCM1794A Advanced Segment Audio Stereo DAC." Datasheet SLAS457, 2004.
30. Smith, J. "The Importance of Analog Output Stage Design in DAC Products." *AudioXpress*, 2020.
31. Goldberg, C. (GoldenSound). "MQA: A Review of the Technology." Technical Analysis, 2021.

---

*Hi-Fidelity Audio Reproduction -- Module 3: DAC Architectures & the Digital Path. The promise Nyquist made in 1949 is kept by silicon in 2026, one sample at a time, 44,100 times per second.*
