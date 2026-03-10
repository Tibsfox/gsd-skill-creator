# Oscilloscope Fundamentals

An oscilloscope is a voltage-versus-time graphing instrument. It captures electrical signals and plots them on a calibrated screen so you can see waveform shape, frequency, amplitude, rise time, noise, and protocol data. For LED work -- measuring PWM dimming signals, decoding addressable LED protocols, verifying power supply ripple -- an oscilloscope is the single most useful bench instrument after the multimeter.

---

## Oscilloscope Types

### Analog Oscilloscope (CRT)

The original design. An electron beam sweeps across a phosphor-coated cathode ray tube. The input voltage deflects the beam vertically; a timebase generator sweeps it horizontally. The result is a real-time trace of the waveform.

```
  Analog Oscilloscope (CRT) Block Diagram:

  Input --> Attenuator --> Vertical Amplifier --> Vertical Deflection Plates
                                                        |
                                                   +----+----+
                                                   | CRT     |
                                                   | Screen  |
                                                   +----+----+
                                                        |
  Timebase Generator --> Horizontal Amplifier --> Horizontal Deflection Plates

  Trigger circuit synchronizes timebase to signal edge.
```

Analog scopes display signals in true real-time with infinite time resolution (no sampling). However, they cannot store, save, or digitally analyze waveforms. They are largely obsolete for bench work but are still valued for their raw display of fast analog phenomena. Used scopes like the Tektronix 465B (100 MHz) can be found for $50-150 and remain excellent learning tools.

### Digital Storage Oscilloscope (DSO)

The modern standard. The input signal passes through an ADC (analog-to-digital converter) and is stored in memory as a sequence of digital samples. The waveform is then reconstructed on an LCD display.

```
  DSO Block Diagram:

  Input --> Attenuator --> ADC --> Sample Memory --> Display Processor --> LCD
                            ^                            |
                            |                     Trigger Logic
                        Sample Clock               Math/FFT
                                                   Protocol Decode
                                                   USB/LAN Export
```

| Feature | Analog | DSO |
|---------|--------|-----|
| Display | CRT phosphor | LCD |
| Storage | None (volatile trace) | Digital memory |
| Measurement | Manual cursors | Automatic (freq, duty, rise time) |
| Protocol decode | Not possible | WS2812B, SPI, I2C, UART |
| Export | Photo only | USB, screenshot, CSV |
| Dead time | None | Between acquisitions |
| Bandwidth | DC to rated BW | DC to rated BW |
| Price (entry) | $50-150 (used) | $300-500 (new) |

### Mixed-Signal Oscilloscope (MSO)

An MSO adds digital logic analyzer channels (typically 8 or 16) alongside the standard analog channels. The digital channels capture logic states (HIGH/LOW) with precise timing correlation to the analog traces.

For LED work, an MSO is valuable when you need to see an analog signal (e.g., LED forward voltage drop) alongside digital signals (e.g., SPI clock and data to an APA102 strip) on the same timebase. However, for most hobbyist LED projects, a DSO is sufficient.

---

## Key Specifications

### Bandwidth

Bandwidth is the frequency at which the oscilloscope's response drops to -3 dB (70.7% of true amplitude). A 100 MHz scope displays a 100 MHz sine wave at 70.7% of its actual amplitude -- already introducing significant measurement error.

**The 5x rule:** Choose a scope with bandwidth at least 5 times the highest frequency component of your signal.

```
Signal                          Highest Frequency     Minimum Scope BW
-------------------------------------------------------------------
PWM dimming (1 kHz)             ~50 kHz (harmonics)   50 MHz
WS2812B data (800 kHz)          ~4 MHz (harmonics)    20 MHz
APA102 SPI clock (24 MHz)       ~120 MHz (harmonics)  100 MHz (min)
RP2040 PIO output (133 MHz)     ~665 MHz              200+ MHz
Switching PSU noise (500 kHz)   ~2.5 MHz              25 MHz
```

For most LED work (PWM, WS2812B, SPI up to 10 MHz), a **50-100 MHz bandwidth scope** is adequate. The popular Rigol DS1054Z (50 MHz, upgradeable to 100 MHz) fits this range perfectly.

### Sampling Rate

The sampling rate determines how many voltage measurements the ADC takes per second. The relationship to bandwidth follows from the Nyquist theorem (see [Nyquist Sampling](m7-nyquist-sampling.md)):

```
Nyquist minimum:   Sampling rate >= 2 x bandwidth
Practical minimum: Sampling rate >= 5 x bandwidth (for shape accuracy)
Recommended:       Sampling rate >= 10 x bandwidth (for clean waveforms)

Example: 100 MHz bandwidth scope
  Nyquist min:  200 MSa/s (aliasing if signal near 100 MHz)
  Practical:    500 MSa/s
  Recommended:  1 GSa/s
```

Most entry-level DSOs (Rigol DS1054Z, Siglent SDS1104X-E) offer 500 MSa/s to 1 GSa/s, which is adequate for their rated bandwidth.

### Vertical Resolution

The vertical resolution (number of bits in the ADC) determines how finely the scope can distinguish voltage levels:

| Resolution | Levels | Sensitivity at 5V range | Sensitivity at 500mV range |
|-----------|--------|------------------------|---------------------------|
| 8-bit | 256 | 19.5 mV/level | 1.95 mV/level |
| 10-bit | 1024 | 4.88 mV/level | 0.49 mV/level |
| 12-bit | 4096 | 1.22 mV/level | 0.12 mV/level |

Most DSOs use 8-bit ADCs. This is adequate for digital signals (PWM, protocol data) but can be limiting for small-signal analog measurements. Higher-resolution scopes (12-16 bit) are significantly more expensive and typically unnecessary for LED work.

### Input Impedance

| Input Mode | Impedance | Use Case |
|-----------|-----------|----------|
| Standard | 1 MΩ // 15-25 pF | General measurement, most LED signals |
| 50Ω | 50 Ω | RF signals, matched transmission lines |

For LED work, always use **1 MΩ** input impedance (the default). The 50Ω mode is for RF applications and will overload or damage the input if you connect it to a signal with significant DC offset or current.

> **SAFETY WARNING:** Never connect a 50Ω input to a power rail or signal with more than ±5V. The low impedance will draw excessive current and may damage the scope's input stage. Most LED signals should be measured with the standard 1 MΩ high-impedance input.

---

## Probes

### Passive 10:1 Probes

The standard probe shipped with every oscilloscope. A 10:1 probe attenuates the signal by a factor of 10 before it reaches the scope, which:

- **Increases input impedance** to ~10 MΩ (reducing circuit loading)
- **Extends voltage range** by 10x (a 5V/div scope becomes 50V/div)
- **Reduces capacitive loading** on high-frequency signals

The tradeoff is reduced sensitivity -- a 10:1 probe divides small signals by 10, making them harder to see. For signals under 100mV, a 1:1 probe or direct BNC cable is better (at the cost of higher capacitive loading).

### Probe Compensation

Every passive probe has a small adjustable trimmer capacitor. This trimmer must be adjusted to match the probe's capacitance to the scope's input capacitance. An uncompensated probe produces frequency-dependent amplitude errors.

```
Scope's built-in calibration output: 1 kHz square wave, ~3V

Properly compensated probe:
  +-----+     +-----+     +-----+
  |     |     |     |     |     |     Flat tops and bottoms
  |     |     |     |     |     |     Sharp corners
  +     +-----+     +-----+     +---

Under-compensated probe:
  +--                    +--
  | \                    | \          Rounded top corners
  |  ----+     +----     |  ----+     Slow rise time
  |      |    /          |      |
  +      +---            +      +---

Over-compensated probe:
   +--+              +--+
  /    \             /    \           Spikes/overshoot at corners
  |     ----+  +---- |     ----+     Ring on edges
  |         | /      |         |
  +         +-       +         +---
```

**Compensation procedure:**

1. Connect probe to the scope's **CAL** or **COMP** output (1 kHz square wave)
2. Set timebase to 500us/div, vertical to 1V/div
3. Observe the square wave
4. Use a small screwdriver to adjust the trimmer on the probe until corners are square (no rounding, no overshoot)
5. This must be repeated when changing probes or oscilloscope channels

### Active Probes

Active probes contain a buffer amplifier at the probe tip, providing very low capacitive loading (<1 pF vs 10-15 pF for passive probes). They are essential for signals above ~200 MHz or for probing high-impedance circuits. Cost: $200-1000+. Not required for typical LED work.

### Current Probes

Current probes clamp around a wire and measure the magnetic field to determine current flow. Useful for measuring LED strip current draw without breaking the circuit. Available in AC-only (cheaper, $50-100) and AC/DC ($200+) variants.

---

## The Trigger System

The trigger circuit tells the oscilloscope **when** to begin capturing and displaying a waveform. Without triggering, the display shows an unstable, rolling mess because each sweep starts at a random point in the signal.

### Edge Trigger (Basic)

The most fundamental trigger mode. The scope begins a sweep when the signal crosses a voltage threshold in a specified direction:

```
                 Trigger Level = 2.5V
                      |
  5V  +---+     +---+ | +---+
      |   |     |   | v |   |
  0V  +   +---+ +   +---+   +---

      ^               ^
      |               |
  Rising edge     Rising edge
  triggers here   triggers here

  Scope captures from trigger point onward.
  Every sweep starts at the same point in the waveform --> stable display.
```

Trigger parameters:
- **Source:** Which channel to trigger from (CH1, CH2, EXT, LINE)
- **Level:** Voltage threshold (adjustable)
- **Slope:** Rising edge, falling edge, or both
- **Mode:** Auto (free-run if no trigger), Normal (wait for trigger), Single (one-shot capture)

### Advanced Trigger Modes

| Mode | Description | LED Use Case |
|------|-------------|-------------|
| Edge | Voltage crossing | PWM signals, clock edges |
| Pulse width | Trigger on pulse of specific duration | WS2812B bit detection (0.4us vs 0.8us) |
| Pattern | Trigger on logic pattern across channels | SPI chip select + clock alignment |
| Serial | Trigger on decoded protocol data | "Trigger when WS2812B sends color 0xFF0000" |
| Runt | Trigger on pulses that don't reach full amplitude | Detecting glitches on LED data lines |

For WS2812B measurement, **pulse width trigger** is particularly useful: set the trigger to capture pulses with a width of 0.7-0.9us to isolate "1" bits, or 0.3-0.5us to isolate "0" bits. See [Measuring LED Signals](m7-measuring-led-signals.md) for detailed measurement procedures.

---

## Practical Controls: The Front Panel

```
Oscilloscope Front Panel (simplified):

+---------------------------------------------------+
|  [CHANNEL 1]  [CHANNEL 2]  [TRIGGER]   [DISPLAY]  |
|                                                     |
|  VERTICAL          HORIZONTAL        TRIGGER        |
|  +---------+       +---------+       +---------+   |
|  | V/div   |       | s/div   |       | Level   |   |
|  | (volts  |       | (time   |       | (volts) |   |
|  |  per    |       |  per    |       |         |   |
|  | square) |       | square) |       | [Slope] |   |
|  +---------+       +---------+       | [Mode]  |   |
|  | Offset  |       | Position|       +---------+   |
|  +---------+       +---------+                      |
|  | AC/DC   |       | [RUN/   |       [AUTO]        |
|  | coupling|       |  STOP]  |       [SINGLE]      |
|  +---------+       +---------+       [FORCE]        |
|                                                     |
|  [MATH] [FFT] [MEASURE] [CURSOR] [DECODE]          |
+---------------------------------------------------+
|       [SCREEN / WAVEFORM DISPLAY]                   |
|  +-----+-----+-----+-----+-----+-----+-----+---+  |
|  |     |     |     |     |     |     |     |   |  |
|  |     |     |     |     |     |     |     |   |  |
|  |     |     |     |     |     |     |     |   |  |
|  +-----+-----+-----+-----+-----+-----+-----+---+  |
|     ^              ^                                |
|     |              |                                |
|  1 div = V/div   1 div = s/div                     |
+---------------------------------------------------+
```

### The Three Essential Controls

1. **V/div (Vertical Scale):** Sets the voltage represented by each vertical grid division. Start at 2V/div for 5V LED signals. Adjust until the waveform fills 60-80% of the screen vertically.

2. **s/div (Timebase / Horizontal Scale):** Sets the time represented by each horizontal grid division. For LED PWM at 1 kHz, start at 1ms/div (full period visible across ~1 division). For WS2812B protocol, use 1-2us/div.

3. **Trigger Level:** Set to the midpoint of the signal (typically 2.5V for 5V logic signals). Adjust until the waveform is stable on screen.

### Auto-Measure Function

Modern DSOs provide automatic measurements. The most useful for LED work:

| Measurement | What It Reports | LED Application |
|------------|-----------------|-----------------|
| Frequency | Signal frequency (Hz) | PWM frequency verification |
| Period | Time for one cycle | WS2812B bit timing |
| Duty Cycle | HIGH time / period (%) | PWM dimmer verification |
| Rise Time | 10% to 90% transition | Signal integrity check |
| Peak-Peak | Maximum - minimum voltage | Logic level verification |
| RMS | Root-mean-square voltage | Power calculation |

---

## Buying Guide for LED Work

### Entry Level ($300-500)

| Scope | Bandwidth | Sampling | Channels | Key Feature |
|-------|-----------|----------|----------|-------------|
| Rigol DS1054Z | 50 MHz (100 MHz hack) | 1 GSa/s | 4 | Protocol decode, huge community |
| Siglent SDS1104X-E | 100 MHz | 1 GSa/s | 4 | SPL (web server), 14 Mpts memory |
| Hantek DSO2D10 | 100 MHz | 1 GSa/s | 2 + AWG | Built-in signal generator |

The **Rigol DS1054Z** is the most recommended entry scope for LED work. It has four channels (essential for SPI: clock, data, chip select + analog), protocol decoders (SPI, I2C, UART), and a massive online community with tutorials and hack guides. The "100 MHz hack" unlocks bandwidth that is already present in the hardware. See [Measuring LED Signals](m7-measuring-led-signals.md) for measurement procedures using this scope.

### Mid-Range ($500-1500)

| Scope | Bandwidth | Sampling | Channels | Key Feature |
|-------|-----------|----------|----------|-------------|
| Siglent SDS1204X-E | 200 MHz | 1 GSa/s | 4 | 14 Mpts, serial decode |
| Rigol MSO5074 | 70 MHz | 8 GSa/s | 4A + 16D | MSO, deep memory |
| Keysight DSOX1204G | 70 MHz | 2 GSa/s | 4 + AWG | Keysight quality, built-in gen |

### What to Skip

- **USB scopes under $100:** Limited bandwidth, software-dependent, poor trigger systems. Better to save for a Rigol DS1054Z.
- **Handheld scopes:** Tiny screens, limited bandwidth, no protocol decode. Useful in the field but not as a primary bench instrument.
- **Vintage analog scopes:** Educational value, but no storage, no protocol decode, no auto-measure. Good as a second scope, not a primary tool.

For DIY scope alternatives, see [DIY Oscilloscopes](m7-diy-oscilloscopes.md).

---

## Essential Accessories

| Accessory | Purpose | Cost |
|-----------|---------|------|
| Probe set (matched to scope BW) | Signal measurement | $30-80 |
| Probe compensation screwdriver | Adjusting probe trimmers | Usually included |
| BNC-to-clips adapter | Quick connections | $5-10 |
| Ground spring (tip-ring) | Reduce ground loop for fast signals | $10-15 |
| USB flash drive | Saving screenshots and waveform data | $5 |

---

## Key Takeaways

- An oscilloscope plots voltage versus time; it is the essential instrument for LED signal debugging
- DSOs (Digital Storage Oscilloscopes) are the standard; MSOs add digital logic channels
- Choose bandwidth at 5x your highest signal frequency (50-100 MHz covers most LED work)
- Sampling rate should be 5-10x bandwidth for accurate waveform representation
- Probe compensation is mandatory -- an uncompensated probe gives wrong measurements
- Edge trigger is the starting point; pulse width trigger is powerful for WS2812B analysis
- The Rigol DS1054Z (~$350) is the most recommended entry-level scope for LED projects

---

## Cross-References

- [Measuring LED Signals](m7-measuring-led-signals.md) -- Step-by-step procedures for PWM, WS2812B, and SPI measurement
- [Nyquist Sampling](m7-nyquist-sampling.md) -- Sampling theorem, aliasing, and ADC resolution explained
- [DIY Oscilloscopes](m7-diy-oscilloscopes.md) -- Low-cost oscilloscope alternatives (DSO138, Pico, ESP32)
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- The protocol you will most often decode on a scope
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI timing that requires clock + data measurement
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: Tektronix "XYZs of Oscilloscopes" application note, Keysight "Evaluating Oscilloscope Fundamentals," Rigol DS1054Z user manual, Siglent SDS1104X-E specifications, Art of Electronics (Horowitz & Hill, 3rd ed.) Chapter 12, EEVblog oscilloscope tutorials, SparkFun "How to Use an Oscilloscope" guide.*
