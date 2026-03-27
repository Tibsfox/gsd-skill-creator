# ASIC & FPGA DSP Implementation

> **Domain:** Custom Silicon Design
> **Module:** 2 -- Hardware Implementation of Digital Signal Processing
> **Through-line:** *The Amiga's Agnus, Denise, and Paula weren't general-purpose processors pretending to handle multimedia. They were purpose-built silicon for exactly the tasks they performed -- DMA-driven, cycle-deterministic, architecturally elegant.* Every FPGA filter engine and DSP ASIC follows the same principle: dedicate the silicon to the math, and the math runs at wire speed.

---

## Table of Contents

1. [The FPGA-to-ASIC Pipeline](#1-the-fpga-to-asic-pipeline)
2. [FIR Filter Implementation](#2-fir-filter-implementation)
3. [IIR Filter Implementation](#3-iir-filter-implementation)
4. [Fixed-Point Arithmetic and Quantization](#4-fixed-point-arithmetic-and-quantization)
5. [DSP Slice Architectures](#5-dsp-slice-architectures)
6. [Pipelining and Resource Optimization](#6-pipelining-and-resource-optimization)
7. [Agile Hardware Design: Chisel and FIRRTL](#7-agile-hardware-design-chisel-and-firrtl)
8. [Audio Codec Integration](#8-audio-codec-integration)
9. [Hearing Aid ASIC: A Complete Worked Example](#9-hearing-aid-asic-a-complete-worked-example)
10. [Timing Closure and Verification](#10-timing-closure-and-verification)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The FPGA-to-ASIC Pipeline

The modern DSP design flow typically begins with algorithm development in MATLAB or Python, transitions to hardware description language (HDL) implementation targeting an FPGA for prototyping, and optionally proceeds to ASIC tape-out for volume production [1].

```
DSP DESIGN PIPELINE
================================================================

  Algorithm           HDL               Synthesis          Physical
  Specification       Implementation    & Mapping          Design
  ┌──────────┐       ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ MATLAB   │       │ VHDL /   │      │ Yosys /  │      │ Place &  │
  │ Python   │──────>│ Verilog  │─────>│ Vivado / │─────>│ Route    │
  │ Simulink │       │ Chisel   │      │ Quartus  │      │ Timing   │
  └──────────┘       └──────────┘      └──────────┘      └──────────┘
       │                  │                 │                  │
       v                  v                 v                  v
  Floating-point     RTL simulation    Resource usage     Bitstream
  golden model       & verification   & timing est.      (FPGA) or
                                                         GDSII (ASIC)
```

### FPGA vs. ASIC Trade-offs

FPGAs offer reconfigurability and rapid iteration; ASICs offer optimized power, performance, and per-unit cost at volume. The crossover point depends on production volume [2]:

| Metric | FPGA | ASIC |
|---|---|---|
| NRE cost | $0 (dev board) | $100K--$10M+ |
| Unit cost (volume) | $10--$500 | $0.10--$50 |
| Reconfigurable | Yes | No |
| Clock frequency | 100--500 MHz | 500 MHz--3 GHz |
| Power efficiency | Moderate | High |
| Time to first silicon | Hours | 6--18 months |
| Volume crossover | -- | 10K--100K units |

MathWorks DSP HDL Toolbox provides a bridge, generating synthesizable HDL from MATLAB algorithm specifications. This reduces the algorithm-to-HDL translation effort but does not eliminate the need for HDL expertise in optimization and verification [3].

---

## 2. FIR Filter Implementation

FIR filters implement the convolution sum using multiply-accumulate (MAC) operations:

```
y(n) = sum_{k=0}^{N-1} h(k) * x(n-k)
```

Where `h(k)` are the filter coefficients and `x(n-k)` are delayed input samples.

### Architecture Options

**Fully Parallel:** One multiplier per tap, single-cycle latency. An N-tap filter requires N multipliers and N-1 adders. This architecture maximizes throughput but consumes the most resources.

```
FULLY PARALLEL FIR (4-tap example)
================================================================

  x(n) ──┬──> [z^-1] ──┬──> [z^-1] ──┬──> [z^-1] ──┐
          │              │              │              │
          v              v              v              v
        [* h0]         [* h1]         [* h2]         [* h3]
          │              │              │              │
          └──────> [+] <─┘──────> [+] <─┘──────> [+] <─┘
                                                    │
                                                    v
                                                  y(n)
```

**Fully Serial:** One multiplier shared across all taps, N-cycle latency. Minimum hardware cost but requires N clock cycles per output sample.

**Semi-Parallel:** K multipliers processing N/K taps each. Balances throughput against resources. For audio-rate signals, this is typically the optimal choice.

### Audio-Rate Optimization

At 48 kHz sampling with a 200 MHz FPGA clock, there are approximately 4,167 clock cycles available per sample. A single DSP slice can be time-multiplexed across many filter taps:

```
Available cycles per sample = f_clk / f_sample
                            = 200,000,000 / 48,000
                            = 4,167 cycles
```

This means a single MAC unit can implement a 4,167-tap FIR filter at 48 kHz sampling -- far more than any practical audio filter requires. Even at 192 kHz, there are 1,042 cycles per sample [4].

### Symmetric FIR Optimization

Linear-phase FIR filters have symmetric coefficients: `h(k) = h(N-1-k)`. This symmetry can be exploited to halve the number of multipliers by pre-adding symmetric input pairs before multiplication:

```
y(n) = sum_{k=0}^{N/2-1} h(k) * (x(n-k) + x(n-N+1+k))
```

A 16-tap symmetric FIR filter on a Xilinx Spartan-6 achieves resource reductions of 79% over conventional implementations by exploiting BRAM-based coefficient storage and LUT shift registers for sample delay lines [5].

---

## 3. IIR Filter Implementation

IIR filters offer sharper frequency responses with fewer coefficients but introduce feedback that can cause instability. The general IIR transfer function is:

```
H(z) = (b0 + b1*z^-1 + ... + bM*z^-M) / (1 + a1*z^-1 + ... + aN*z^-N)
```

### The Biquad: Standard Building Block

The biquad (second-order section) is the standard IIR building block. Its transfer function is:

```
H(z) = (b0 + b1*z^-1 + b2*z^-2) / (1 + a1*z^-1 + a2*z^-2)
```

Higher-order filters are implemented as cascades of biquad sections. This approach is strongly preferred over direct-form high-order implementations because:
- Each section's poles stay close to their designed positions after quantization
- A single unstable section can be identified and corrected independently
- Coefficient sensitivity scales with section order, not total filter order

### Direct Form I vs. Direct Form II

**Direct Form I** uses separate delay lines for numerator and denominator, requiring 2N+2 storage elements for an Nth-order section. It is less sensitive to coefficient quantization but uses more memory.

**Direct Form II** shares a single delay line between numerator and denominator, requiring only N+1 storage elements. It is more compact but more sensitive to internal overflow in fixed-point implementations.

**Transposed Direct Form II** is preferred for FPGA implementation because it minimizes the critical path length (the longest combinational delay between registers), enabling higher clock frequencies [6].

```
TRANSPOSED DIRECT FORM II BIQUAD
================================================================

  x(n) ──> [* b0] ──> [+] ──────────────────────────> y(n)
                        ^                               │
                        │                               v
                       [+] <── [z^-1] <── [+]         [* -a1]
                        ^                  ^            │
                        │                  │            v
                       [* b1]            [z^-1] <──── [+]
                                           ^            │
                                           │            v
                                          [+] <────── [* -a2]
                                           ^
                                           │
                                          [* b2] <── x(n)
```

---

## 4. Fixed-Point Arithmetic and Quantization

Fixed-point coefficient quantization is the critical challenge in FPGA DSP implementation. The mathematical filter design assumes infinite precision; the hardware provides finite wordlength [7].

### Wordlength Format

A fixed-point number in Q(m.f) format has m integer bits and f fractional bits, for a total of m+f+1 bits (including sign). The value of a Q(1.14) number, for example, ranges from -2.0 to +1.99994 with a resolution of 2^(-14) = 0.000061.

### Quantization Effects on Filter Stability

When poles are close to the unit circle in the z-plane (as required for narrow bandpass or notch filters), coefficient quantization can shift them outside the unit circle, causing instability:

```
POLE POSITION AND QUANTIZATION
================================================================

  Stable region: |z| < 1 (inside unit circle)

  Before quantization:        After 16-bit quantization:
  ┌────────────────────┐     ┌────────────────────┐
  │       * * *        │     │       * * *        │
  │     *       *      │     │     *       *      │
  │    *    .p    *     │     │    *    .     *    │
  │    *         *     │     │    *      p   *    │  <-- pole shifted
  │     *       *      │     │     *       *      │      outside circle
  │       * * *        │     │       * * *        │
  └────────────────────┘     └────────────────────┘
  Unit circle (stable)        Unit circle (UNSTABLE)
```

### Mitigation Strategies

1. **Cascaded second-order sections:** Limit each section to two poles, keeping them well inside the unit circle
2. **Sufficient fractional bits:** Use at least 14 of 16 total bits for the fractional part when filter bandwidth is narrow
3. **Simulation:** Always simulate the fixed-point implementation against a floating-point reference across the full input range
4. **Coefficient scaling:** Scale coefficients to maximize the use of available precision
5. **Double-precision accumulators:** Use a wider accumulator (e.g., 40-bit) to prevent truncation errors from accumulating during the MAC operations

### Quantization Noise Analysis

The signal-to-quantization-noise ratio (SQNR) for a B-bit fixed-point representation is approximately:

```
SQNR = 6.02 * B + 1.76 dB
```

| Wordlength | SQNR | Typical Application |
|---|---|---|
| 8-bit | 49.9 dB | Amiga Paula (original) |
| 16-bit | 98.1 dB | CD audio, basic DSP |
| 24-bit | 146.2 dB | Professional audio |
| 32-bit | 194.4 dB | Scientific computing |

---

## 5. DSP Slice Architectures

Modern FPGAs contain dedicated DSP slices -- hard-wired multiply-accumulate blocks optimized for signal processing [8].

### Xilinx DSP48E2 (UltraScale+)

- 27x18 bit pre-adder + multiplier + 48-bit accumulator
- Can perform one MAC per clock cycle
- Pattern detector for convergent rounding
- Cascade connections for multi-slice filter chains
- Available in quantities from 4 (Artix) to 6,840 (Virtex UltraScale+)

### Intel (Altera) Variable-Precision DSP

- Configurable as 27x27, 18x18, or 9x9 multipliers
- Supports IEEE 754 single-precision floating-point
- Hard-wired accumulator with 64-bit precision
- Cascade chain for systolic FIR arrays

### DSP Slice Utilization for Audio

A typical audio processing chain might require:
- 4 biquad EQ sections: 4 DSP slices (one per section, time-multiplexed)
- 64-tap FIR crossover filter: 1 DSP slice (fully serial at 48 kHz)
- Dynamic range compressor: 2 DSP slices (envelope + gain computation)

Total: 7 DSP slices -- a tiny fraction of what even a small FPGA provides. The challenge in audio DSP is not resources but timing and control logic [9].

---

## 6. Pipelining and Resource Optimization

### Pipeline Registers

Pipelining inserts register stages between combinational logic blocks, trading latency for throughput. Each pipeline stage adds one clock cycle of latency but allows the clock frequency to increase:

```
Without pipelining:           With 2-stage pipeline:
  A * B + C * D                 Cycle 1: A*B, C*D (parallel)
  Critical path: 2 mults       Cycle 2: sum
  + 1 add                      Critical path: 1 mult
  Max freq: ~150 MHz           Max freq: ~300 MHz
  Latency: 1 cycle             Latency: 2 cycles
```

For audio-rate DSP, the added pipeline latency (nanoseconds at FPGA clock rates) is negligible compared to sample-rate latency (microseconds). Pipeline freely.

### Resource Sharing

When multiple filters share the same FPGA, resource sharing through time-division multiplexing reduces total slice usage. A single DSP48 running at 200 MHz can implement:
- 4,167 independent 1-tap operations at 48 kHz
- Or equivalently, 65 independent 64-tap FIR filters

The control logic for multiplexing (address generators, coefficient ROM indexing, accumulator management) typically consumes more FPGA resources than the DSP slices themselves [10].

### Block RAM (BRAM) Usage

Coefficient storage and sample delay lines map naturally to FPGA block RAM:
- Coefficient ROM: dual-port BRAM, one port for coefficient read, one for configuration updates
- Delay line: circular buffer in BRAM, pointer incremented each sample
- FIFO: BRAM-based FIFO for crossing clock domains between audio codec and filter engine

---

## 7. Agile Hardware Design: Chisel and FIRRTL

The Chisel hardware construction language (a Scala DSL) enables rapid ASIC prototyping through parameterized generators and automated testing infrastructure [11].

### Why Chisel for DSP

Traditional HDL (VHDL/Verilog) describes hardware at the register-transfer level. Chisel describes hardware *generators* -- parameterized functions that produce RTL. A single Chisel FIR filter generator can produce filters of any tap count, coefficient width, and pipeline depth:

```
// Chisel FIR filter generator (pseudocode)
class FIR(numTaps: Int, coeffWidth: Int) extends Module {
  val io = IO(new Bundle {
    val in  = Input(SInt(coeffWidth.W))
    val out = Output(SInt((2*coeffWidth).W))
  })
  val coeffs = RegInit(VecInit(Seq.fill(numTaps)(0.S(coeffWidth.W))))
  val delays = RegInit(VecInit(Seq.fill(numTaps)(0.S(coeffWidth.W))))
  // Shift register
  delays(0) := io.in
  for (i <- 1 until numTaps) delays(i) := delays(i-1)
  // MAC chain
  io.out := (coeffs zip delays).map { case (c, d) => c * d }.reduce(_ + _)
}
```

### Splash2: A Chisel DSP ASIC Case Study

A UC Berkeley research group demonstrated a complete DSP spectrometer ASIC ("Splash2") with RTL designed by one person in eight weeks using Chisel generators [12]:
- **Design time:** 8 weeks (1 person) vs. estimated 16+ weeks in Verilog
- **Verification:** Chisel's built-in testers enabled rapid iteration
- **Tape-out:** Successfully fabricated and tested

A larger radar receive processor required approximately 300 engineering-weeks (a team of 8 over 9 months), representing a 56% reduction in development time compared to traditional HDL flows.

---

## 8. Audio Codec Integration

### I2S (Inter-IC Sound)

I2S is the standard digital audio interface between DSP/FPGA and audio codec chips [13]:

```
I2S TIMING DIAGRAM
================================================================

  BCLK:  ___┌──┐__┌──┐__┌──┐__┌──┐__┌──┐__┌──┐__
            │  │  │  │  │  │  │  │  │  │  │  │

  LRCLK: ──┘        └──────────────────┘        └──
           Left channel                Right channel

  DATA:  ──┤MSB│b1 │b2 │...│LSB│MSB│b1 │b2 │...│LSB│
```

- **BCLK (Bit Clock):** Clock for each data bit; frequency = sample_rate * bits_per_sample * 2 channels
- **LRCLK (Left-Right Clock):** Word select; frequency = sample_rate
- **DATA:** Serial audio data, MSB-first, 2's complement

At 48 kHz / 24-bit stereo: BCLK = 48,000 * 24 * 2 = 2.304 MHz

### S/PDIF (Sony/Philips Digital Interface)

S/PDIF encodes clock and data in a single biphase-mark-coded signal. Each audio frame contains two 32-bit subframes (left and right channels), with embedded channel status, user data, and parity bits. Maximum sample rate: 192 kHz at 24-bit [14].

### TDM (Time-Division Multiplexing)

TDM extends I2S to support more than two channels on a single data line. Each LRCLK period is divided into N time slots, each carrying one channel. Common configurations: 8-channel TDM (Cirrus Logic CS42888), 16-channel TDM (Analog Devices AD1938).

---

## 9. Hearing Aid ASIC: A Complete Worked Example

A signal processing ASIC for digital hearing aids, fabricated in 180nm CMOS, demonstrates the complete pipeline from algorithm specification through FPGA validation to ASIC fabrication [15].

### Architecture

- **18-band 1/3-octave ANSI S1.11 filter bank** using the Interpolated FIR (IFIR) technique
- **Dynamic range compression** with lookup-table-based logarithm for each band
- **SPI interface** for external codec communication and programmability
- **Total gate count:** ~50K equivalent gates
- **Power consumption:** 1.2 mW at 1.8V

### IFIR Filter Bank Design

The IFIR technique achieves narrow transition bands with far fewer coefficients than conventional FIR designs by cascading an interpolated (sparse) filter with a short image-rejection filter. For the hearing aid's 18-band filter bank, this reduces total multiplier count by approximately 4x compared to direct-form designs.

### FPGA Validation

Real-time testing used two ZedBoard FPGAs:
- **Board 1:** Hosted the design under test, running the complete hearing aid signal processing chain
- **Board 2:** Provided audio I/O via the integrated XADC (analog-to-digital converter on the Zynq SoC)

The FPGA prototype consumed approximately 15x more power than the final ASIC but provided bit-accurate functional verification before committing to silicon fabrication.

### Lessons for the Design Pipeline

1. Algorithm development in MATLAB established the golden reference model
2. Chisel/FIRRTL generated parameterized RTL from algorithm specifications
3. FPGA prototyping validated functional correctness with real audio signals
4. ASIC synthesis and tape-out used the verified RTL without modification
5. Post-silicon testing confirmed bit-exact match with FPGA prototype

> **SAFETY WARNING:** Hearing aid DSP systems must include hard-limiter output stages. The maximum permissible output for a hearing aid is 132 dB SPL (IEC 60118-13). A filter instability event (coefficient divergence) can produce output levels exceeding this limit within milliseconds, risking permanent hearing damage [16].

---

## 10. Timing Closure and Verification

### The Timing Closure Challenge

Timing closure ensures that all signal paths in the design meet setup and hold time requirements at the target clock frequency. For FPGA designs, the synthesis and place-and-route tools report timing violations as negative slack.

```
TIMING ANALYSIS
================================================================

  Setup time requirement:
    Data must be stable at register input at least t_setup
    before the clock edge.

  Hold time requirement:
    Data must remain stable at register input for at least
    t_hold after the clock edge.

  Slack = Required time - Arrival time
    Positive slack: timing met (margin available)
    Zero slack: timing exactly met (no margin)
    Negative slack: timing VIOLATED (design fails)
```

### Common Timing Issues in DSP Designs

1. **Long MAC chains** without pipeline registers create critical paths that limit clock frequency
2. **Clock domain crossings** between audio codec clock and FPGA system clock require synchronizer flip-flops or FIFO bridges
3. **BRAM read latency** (1-2 cycles) must be accounted for in coefficient lookup timing
4. **DSP slice cascade delays** accumulate when chaining multiple slices for wide multiplication

### Verification Methodology

A robust DSP verification flow includes:
- **RTL simulation:** Cycle-accurate verification against the floating-point golden model
- **Fixed-point co-simulation:** MATLAB/Simulink fixed-point model vs. HDL simulation
- **FPGA-in-the-loop:** Real-time testing with actual audio signals through the FPGA prototype
- **Corner analysis:** Verify operation across process, voltage, and temperature (PVT) corners

---

## 11. Cross-References

> **Related:** [Real-Time DSP Algorithms](01-real-time-dsp-algorithms.md) -- the algorithms implemented in hardware here. [Sound Filtering & Audio](03-sound-filtering-audio.md) -- practical audio filter applications. [LED Persistence of Vision](04-led-persistence-of-vision.md) -- RP2040 PIO as a programmable hardware engine.

**Series cross-references:**
- **DAA (Deep Audio Analyzer):** DSP algorithms from Module 1 implemented in silicon here
- **T55 (555 Timer):** Timing precision concepts parallel FPGA clock domain management
- **EMG (Electric Motors):** FPGA-based motor control shares DSP slice utilization patterns
- **GRD (Gradient Engine):** Hardware gradient computation architectures
- **LED (LED & Controllers):** RP2040 PIO as lightweight programmable hardware

---

## 12. Sources

1. MathWorks. "DSP HDL Toolbox: Design and generate synthesizable HDL code for DSP applications." Documentation, 2024.
2. Maxfield, C. *The Design Warrior's Guide to FPGAs*. Elsevier, 2004.
3. MathWorks. "HDL Coder: Generate VHDL and Verilog code for FPGA and ASIC designs." Documentation, 2024.
4. Xilinx. "DSP: Designing for Optimal Results." UG073, 2005.
5. Maamoun, M. "Efficient FPGA based architecture for high-order FIR filtering." IET Circuits, Devices & Systems, vol. 15, no. 3, pp. 271-280, 2021.
6. Springer JESIT. "High performance IIR filter implementation on FPGA." Journal of Electronic Science and Information Technology, 2021.
7. Oppenheim, A.V. and Schafer, R.W. *Discrete-Time Signal Processing*. 3rd ed. Prentice-Hall, 2010.
8. Xilinx. "UltraScale Architecture DSP Slice User Guide." UG579, 2023.
9. Intel. "Intel Stratix 10 Variable Precision DSP Blocks User Guide." UG-S10-DSP, 2023.
10. Meyer-Baese, U. *Digital Signal Processing with Field Programmable Gate Arrays*. 4th ed. Springer, 2014.
11. Bachrach, J. et al. "Chisel: Constructing Hardware in a Scala Embedded Language." Proc. DAC, pp. 1212-1221, 2012.
12. Bailey, S. "Rapid ASIC Design for Digital Signal Processors." UC Berkeley EECS-2020-32, 2020.
13. Philips Semiconductors. "I2S bus specification." Rev. June 1996.
14. IEC 60958-3:2021. "Digital audio interface -- Part 3: Consumer applications."
15. Deepu, C.J. et al. "Design and implementation of a signal processing ASIC for digital hearing aids." ScienceDirect, 2022.
16. IEC 60118-13:2019. "Electroacoustics -- Hearing aids -- Part 13: Electromagnetic compatibility (EMC)."

---

*Signal & Light -- Module 2: ASIC & FPGA DSP Implementation. Purpose-built silicon for deterministic execution: the Amiga Principle in every gate.*
