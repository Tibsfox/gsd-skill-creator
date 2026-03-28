# Light Systems & Light Art

> **Domain:** Electro-Optical Engineering
> **Module:** 2 -- LED Protocols, Persistence of Vision, Phase Synchronization, and Light Art
> **Through-line:** *Light is the fastest messenger, but the eye is a patient listener.* The human retina holds an afterimage for 40 milliseconds -- long enough for a spinning strip of LEDs to paint a floating message in midair, long enough for a strobe to freeze a water droplet in flight, long enough for the brain to stitch sixty discrete frames into the illusion of continuous motion. Every light art installation is a negotiation between photon physics and neural persistence.

---

## Table of Contents

1. [The Light Art Continuum](#1-the-light-art-continuum)
2. [Addressable LED Protocols](#2-addressable-led-protocols)
3. [WS2812B / NeoPixel Deep Dive](#3-ws2812b-neopixel-deep-dive)
4. [APA102 / DotStar Deep Dive](#4-apa102-dotstar-deep-dive)
5. [SK6812 RGBW and Beyond](#5-sk6812-rgbw-and-beyond)
6. [Persistence of Vision Fundamentals](#6-persistence-of-vision-fundamentals)
7. [POV Display Architectures](#7-pov-display-architectures)
8. [POV Timing Mathematics](#8-pov-timing-mathematics)
9. [Rotation Detection and Synchronization](#9-rotation-detection-and-synchronization)
10. [Holographic POV Displays](#10-holographic-pov-displays)
11. [Phase Synchronization for Performance](#11-phase-synchronization-for-performance)
12. [High-Current LED Safety](#12-high-current-led-safety)
13. [RP2040 PIO for LED Driving](#13-rp2040-pio-for-led-driving)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Light Art Continuum

Light systems in the sensing layer span a continuum from simple indicator LEDs to complex persistence-of-vision holographic displays. The unifying principle is timing: every application depends on precisely controlling when photons are emitted, for how long, and at what intensity. The Amiga Principle applies -- Denise, the custom video chip, could generate 4096 colors in HAM mode by manipulating hold-and-modify registers on every pixel, a trick that required deterministic timing the CPU could never provide alone. Modern LED protocols demand the same discipline [1].

### Light System Classes

```
LIGHT SYSTEM TAXONOMY
================================================================

Class 1: INDICATOR
  Purpose:  Status display (power, error, connection)
  LEDs:     Single-color, non-addressable
  Control:  GPIO high/low, simple PWM
  Timing:   Non-critical

Class 2: STRIP / ARRAY
  Purpose:  Decorative, functional illumination, data visualization
  LEDs:     WS2812B, APA102, SK6812 (addressable)
  Control:  Single-wire protocol or SPI
  Timing:   Microsecond-level for protocol compliance

Class 3: POV DISPLAY
  Purpose:  Floating images via persistence of vision
  LEDs:     APA102 (preferred) or WS2812B on rotating arm
  Control:  SPI + Hall effect sync + firmware timing
  Timing:   Sub-microsecond for column placement accuracy

Class 4: STAGE / INSTALLATION
  Purpose:  Large-scale artistic or architectural lighting
  LEDs:     DMX512-controlled fixtures, pixel-mapped arrays
  Control:  DMX512, Art-Net, sACN
  Timing:   23 ms universe refresh; sub-frame for effects
```

---

## 2. Addressable LED Protocols

The addressable LED ecosystem has converged on three primary protocols, each with distinct tradeoffs for sensing layer applications [2][3].

### Protocol Comparison Matrix

| Protocol | Interface | Data Rate | Clock | Colors | Refresh (300 LEDs) | Best For |
|---|---|---|---|---|---|---|
| WS2812B (NeoPixel) | Single-wire | 800 kHz | Embedded | RGB (24-bit) | 9 ms | Cost, simplicity |
| APA102 (DotStar) | SPI (2-wire) | Up to 20 MHz | External | RGB + 5-bit brightness | <1 ms | POV, high refresh |
| SK6812 | Single-wire | 800 kHz | Embedded | RGBW (32-bit) | 12 ms | Warm white accent |
| WS2815 | Single-wire | 800 kHz | Embedded | RGB (24-bit) | 9 ms | 12V, backup data line |
| 74HC595 cascade | SPI (parallel) | SPI clock | External | Per-resistor | <0.5 ms | Classic DIY POV |

### Data Format Comparison

**WS2812B:** Each LED receives 24 bits (GRB order: 8G + 8R + 8B). Data is clocked by signal timing -- a "1" bit is a long high pulse (700 ns) followed by a short low (600 ns); a "0" bit is a short high (350 ns) followed by a long low (800 ns). Tolerances are +/- 150 ns. A reset signal is a low period greater than 50 microseconds [4].

**APA102:** Each LED receives 32 bits: a start frame of 32 zero bits, then per-LED frames of `111xxxxx BBBBBBBB GGGGGGGG RRRRRRRR` where `xxxxx` is a 5-bit global brightness (0-31), followed by an end frame. Data is clocked by an external clock line -- no timing-critical bit encoding needed. This makes APA102 immune to interrupt-induced glitches [5].

---

## 3. WS2812B / NeoPixel Deep Dive

The WS2812B is the most widely deployed addressable LED in the hobbyist ecosystem. Its single-wire protocol simplifies wiring but imposes strict timing requirements that create engineering challenges on interrupt-heavy platforms [4].

### Electrical Characteristics

| Parameter | Typical Value | Notes |
|---|---|---|
| Supply voltage | 5V +/- 0.5V | 3.3V logic level works for data at short runs |
| Current per LED (max white) | 60 mA | 20 mA per color channel |
| Forward voltage (per color) | 1.8-2.2V (R), 3.0-3.2V (G), 3.0-3.2V (B) | Determines efficiency |
| Data rate | 800 kHz fixed | Cannot be changed |
| Power per LED (max) | 300 mW | At full white, full brightness |
| Operating temperature | -25 to +80 C | Outdoor use requires derating |

### Timing Requirements

```
WS2812B BIT TIMING
================================================================

  "0" bit:     ┌──┐
               │  │
           ────┘  └──────────
               350ns  800ns
               (+/-150ns each)

  "1" bit:     ┌──────┐
               │      │
           ────┘      └──────
               700ns   600ns
               (+/-150ns each)

  Reset:    ────────────────────
            > 50 us low (some datasheets say 80 us)
```

### 3.3V Data Level Issue

WS2812B specifies a logic high threshold of 0.7 * VDD. At 5V supply, this is 3.5V -- above the 3.3V output of ESP32, Pico, and most modern microcontrollers. In practice, many WS2812B LEDs work at 3.3V logic due to manufacturing margin, but this is out of spec and unreliable in production.

**Solutions:**
1. **Level shifter:** 74AHCT125 (single gate, 5V tolerant input, 5V output) -- recommended
2. **Sacrificial LED:** Wire the first LED at 3.3V VDD; its output is 3.3V high, which is in-spec for the next LED at 5V
3. **SN74HCT245:** 8-channel level shifter for parallel data lines

> **SAFETY WARNING:** A strip of 300 WS2812B LEDs at full white draws 18A at 5V (90W). This requires appropriately rated wiring (16 AWG minimum for 18A), a fuse on each power injection point, and power injection every 50-100 LEDs to prevent voltage droop and thermal damage. Never power long LED strips from microcontroller USB power.

---

## 4. APA102 / DotStar Deep Dive

The APA102 is the preferred LED for POV displays and high-refresh applications. Its SPI interface decouples data rate from LED timing, allowing updates at up to 20 MHz -- 25x faster than WS2812B [5].

### Why APA102 for POV

1. **No timing-critical bit encoding:** Data is clocked by an external clock line. Interrupts cannot corrupt the data stream.
2. **Global brightness control:** The 5-bit brightness register (0-31) provides hardware dimming independent of RGB values, enabling smooth fades without PWM flicker.
3. **Higher refresh rate:** At 20 MHz SPI, 300 LEDs update in 0.48 ms (vs 9 ms for WS2812B). For a POV display at 600 RPM, this means 20x more angular resolution.
4. **Start/end frame protocol:** Self-clocking propagation means the strip length is limited only by clock signal integrity, not by timing accumulation errors.

### APA102 Frame Format

```
APA102 DATA FRAME
================================================================

Start Frame:  [0x00] [0x00] [0x00] [0x00]   (32 zero bits)

LED Frame:    [111bbbbb] [BLUE] [GREEN] [RED]
              |  5-bit   |  8-bit per channel  |
              brightness

End Frame:    [0xFF] repeated ceil(N/2/8) times
              (N = number of LEDs)
```

### Refresh Rate Comparison for POV

| LED Count | WS2812B Update Time | APA102 Update Time (20 MHz) | Ratio |
|---|---|---|---|
| 72 LEDs | 2.16 ms | 0.12 ms | 18x faster |
| 144 LEDs | 4.32 ms | 0.23 ms | 19x faster |
| 300 LEDs | 9.00 ms | 0.48 ms | 19x faster |
| 600 LEDs | 18.00 ms | 0.96 ms | 19x faster |

---

## 5. SK6812 RGBW and Beyond

The SK6812 adds a dedicated warm white LED die alongside RGB, enabling higher CRI (Color Rendering Index) output. The white channel produces approximately 2700K warm white light at higher luminous efficiency than mixing RGB to produce white [6].

### RGBW Applications in Sensing Layer

- **Weather visualization:** Blue for cold, red for warm, white channel for intensity. The dedicated white LED prevents the "washed out" look of RGB white.
- **Circadian lighting:** Field stations with human occupants benefit from warm white at night to minimize circadian disruption.
- **Calibration reference:** The known spectral output of the white channel can serve as a reference for optical sensor calibration.

### Data Format

SK6812 uses the same single-wire protocol as WS2812B (800 kHz, timing-critical) but sends 32 bits per LED: 8G + 8R + 8B + 8W. The additional byte increases per-LED update time to 40 microseconds (vs 30 for WS2812B).

---

## 6. Persistence of Vision Fundamentals

Persistence of vision (POV) exploits the retina's approximately 40 ms afterimage duration to create the illusion of continuous images from discrete, rapidly switched light sources. The effect depends on three interacting phenomena [7][8]:

### Retinal Persistence

Photoreceptor cells continue generating electrical signals for 30-50 ms after light stimulation ends. Rhodopsin (rod pigment) has a longer recovery time than cone opsins, creating brightness-dependent persistence -- brighter flashes persist longer. This is advantageous for POV displays that operate at high LED brightness.

### Neural Integration Window

The visual cortex integrates signals over 100-200 ms, smoothing rapid fluctuations. This integration window creates the perception of continuous motion from discrete frames -- the same principle behind cinema (24 fps) and television (30/60 fps).

### Critical Flicker Frequency (CFF)

The CFF -- the rate above which discrete flashes appear continuous -- varies with conditions:

| Factor | Effect on CFF | Typical Range |
|---|---|---|
| Luminance | Higher brightness = higher CFF | 12-75 Hz |
| Stimulus size | Larger area = higher CFF | 5-10 Hz increase |
| Peripheral vision | Higher CFF in periphery | Up to 80 Hz |
| Wavelength | Green/yellow most sensitive | 50-65 Hz at moderate L |
| Age | Decreases with age | ~1 Hz/decade after 20 |

> **SAFETY WARNING:** Strobe frequencies between 3 Hz and 30 Hz can trigger photosensitive epileptic seizures in susceptible individuals (approximately 1 in 4000 people). POV displays operating below 50 Hz rotation speed may produce visible flicker in this danger zone. Always design for rotation speeds that produce refresh rates above 50 Hz. Mark all POV installations with photosensitive epilepsy warnings.

---

## 7. POV Display Architectures

Three primary mechanical architectures exist for POV displays, each with distinct engineering tradeoffs [7][9].

### Architecture Comparison

| Architecture | Mechanism | Typical RPM | Resolution | Complexity | Use Case |
|---|---|---|---|---|---|
| Rotary arm | Single arm spins 360 degrees | 600-3600 | 200-500 columns | Medium | Propeller clocks, globes |
| Reciprocating | Arm oscillates (wiper motion) | 300-600 | 100-200 columns | Low | Linear message displays |
| Flexible PCB globe | Full sphere rotation | 600-1200 | 200-400 columns | High | 3D volumetric display |

### Rotary Arm Design

The most common POV architecture mounts a strip of LEDs on a rigid arm that rotates continuously. Key components:

1. **Motor:** Brushless DC (BLDC) for smooth, controllable rotation. 600 RPM = 10 Hz = 100 ms per revolution.
2. **LED strip:** APA102 preferred for update speed. Mounted along the radius of rotation.
3. **Synchronization:** Hall effect sensor + magnet on the base to detect the zero-angle position each revolution.
4. **Microcontroller:** Pico 2 or Arduino Nano mounted on the rotating arm.
5. **Power:** Inductive transfer (preferred) or slip rings (simpler but wear-prone).
6. **Data:** Pre-loaded in flash memory. For real-time updates: WiFi (ESP32) or Bluetooth.

---

## 8. POV Timing Mathematics

The fundamental timing equation for a POV display relates rotation speed, LED count, column count, and LED update time [7][8].

### Core Equations

**Time per revolution:** `T_rev = 60 / RPM` (seconds)

**Time per column:** `T_col = T_rev / N_columns`

**LED update time:** `T_update = N_LEDs * T_per_LED`
- WS2812B: T_per_LED = 30 us (24 bits at 1.25 us/bit)
- APA102: T_per_LED = 1.6 us (32 bits at 20 MHz, plus overhead)

**Constraint:** `T_update < T_col` (LED update must complete before the next column position)

### Worked Example: 600 RPM, 144 LEDs, 360 Columns

```
POV TIMING CALCULATION
================================================================

RPM = 600 (10 Hz)
T_rev = 60 / 600 = 100 ms = 100,000 us
N_columns = 360 (1 degree per column)
T_col = 100,000 / 360 = 278 us per column

WS2812B update time for 144 LEDs:
  T_update = 144 * 30 us = 4,320 us
  4,320 us > 278 us  *** FAILS -- too slow ***

APA102 update time for 144 LEDs (20 MHz):
  T_update = (4 + 144*4 + 9) * 8 / 20,000,000
           = 4,648 bits / 20,000,000 = 232 us
  232 us < 278 us  *** PASSES -- 17% margin ***

APA102 at 10 MHz:
  T_update = 464 us
  464 us > 278 us  *** FAILS at 10 MHz ***

Maximum columns at 600 RPM with APA102 (20 MHz), 144 LEDs:
  N_max = 100,000 / 232 = 431 columns
```

### POV Resolution vs Speed Tradeoff Table

| RPM | T_rev (ms) | Max Columns (APA102, 144 LEDs) | Angular Resolution |
|---|---|---|---|
| 300 | 200 | 862 | 0.42 degrees |
| 600 | 100 | 431 | 0.84 degrees |
| 1200 | 50 | 215 | 1.67 degrees |
| 1800 | 33.3 | 143 | 2.52 degrees |
| 3600 | 16.7 | 72 | 5.0 degrees |

---

## 9. Rotation Detection and Synchronization

Accurate zero-angle detection is essential for a stable POV image. Three primary methods are used [8][10]:

### Hall Effect Sensor + Magnet

The most reliable method. A Hall effect sensor (e.g., A3144 or SS49E) is mounted on the stationary base, and a small neodymium magnet is mounted on the rotating arm at the zero position. The sensor outputs a digital pulse once per revolution.

- **Latency:** <1 us (limited by sensor response time)
- **Jitter:** <5 us (excellent for POV)
- **Cost:** <$1 for sensor + magnet
- **Durability:** No contact, no wear, indefinite life

### IR Interrupt (MOC7811)

An infrared emitter/detector pair with a slotted wheel. As the arm rotates, a slot or flag on the arm breaks the IR beam once per revolution. Used in early 8051-based POV projects [10].

- **Latency:** <10 us
- **Jitter:** <20 us
- **Cost:** <$0.50
- **Issue:** Ambient IR interference in bright sunlight; requires optical shielding

### Optical Encoder

A quadrature encoder provides not just zero-position but continuous angular position feedback. Overkill for basic POV but essential for variable-speed displays that must compensate for RPM changes mid-rotation.

- **Resolution:** 100-10,000 pulses per revolution
- **Cost:** $5-50 depending on resolution
- **Advantage:** Real-time RPM measurement; dynamic column timing adjustment

---

## 10. Holographic POV Displays

The University POV holographic display project (2024) demonstrated a fully wireless rotating POV globe using Raspberry Pi Pico on PTFE-substrate PCBs [9].

### Key Innovations

1. **PTFE PCB substrate:** Resists centrifugal forces at high RPM (thousands of G at the arm tips). Standard FR4 PCBs can delaminate at high rotation speeds.
2. **Inductive wireless power:** Eliminates slip rings entirely. A stationary coil on the base couples to a coil on the rotating arm through electromagnetic induction. Efficiency is typically 60-80% at the air gap distances involved.
3. **WiFi image streaming:** Python TCP server on a host computer sends image data to the Pico's WiFi module (if using Pico W) for real-time image updates.
4. **3D volumetric effect:** By tilting the rotation axis and using a curved LED strip, the display creates a volumetric sphere that can show 3D images from any viewing angle.

### Inductive Power Design Parameters

| Parameter | Typical Value | Notes |
|---|---|---|
| Operating frequency | 100-200 kHz | Higher frequency = smaller coils |
| Air gap | 5-15 mm | Limited by mechanical clearance |
| Efficiency | 60-80% | Drops rapidly beyond 15 mm gap |
| Power delivered | 2-10W | Sufficient for Pico + 144 LEDs at moderate brightness |
| Coil diameter | 30-50 mm | Ferrite core improves coupling |

---

## 11. Phase Synchronization for Performance

Phase synchronization -- ensuring multiple light sources flash at precisely controlled phase offsets -- is critical for both performance art (spinning poi, bike wheel displays, multi-element installations) and scientific stroboscopy [11].

### Multi-Node Sync Methods

| Method | Accuracy | Range | Cost | Use Case |
|---|---|---|---|---|
| Wired interrupt | <1 us | 10 m (cable) | <$1 | Fixed installation, multiple arms |
| GPS PPS | <1 us | Global | $10-15 per node | Geographically distributed strobing |
| WiFi NTP | <10 ms | Local network | $0 (ESP32 built-in) | Music-synced installations |
| Audio beat detection | <20 ms | Acoustic range | $2 (MEMS mic) | Live music reactive |
| LoRa time sync | <100 ms | 20 km | $15 per node | Outdoor art installations |

### GPS PPS for Distributed Strobing

GPS modules with PPS output provide sub-microsecond accuracy synchronized to UTC. By distributing GPS-synced nodes across a field or campsite, multiple POV displays or strobe installations can flash in perfect synchronization regardless of distance.

**Protocol:**
1. Each node acquires GPS lock and PPS signal
2. PPS rising edge triggers a hardware interrupt
3. Node counts PPS pulses to maintain a shared time base
4. Strobe patterns are expressed as offsets from the PPS edge
5. Phase offsets between nodes create traveling-wave effects across the installation

> **Related:** See [SGL](../SGL/) for SMPTE timecode synchronization, [BPS](../BPS/) for field sensor timing, [T55](../T55/) for GPS PPS hardware integration details.

---

## 12. High-Current LED Safety

LED installations consume significant power and present real electrical and thermal hazards. All designs in this module follow these safety boundaries [12][13].

### Current Budgeting

| Strip Length | LED Count | Max Current (full white) | Wire Gauge | Fuse Rating |
|---|---|---|---|---|
| 1 m (60/m) | 60 | 3.6 A | 20 AWG | 5 A |
| 2 m (60/m) | 120 | 7.2 A | 18 AWG | 10 A |
| 5 m (60/m) | 300 | 18 A | 16 AWG | 20 A |
| 5 m (144/m) | 720 | 43.2 A | 12 AWG | 50 A |

### Power Injection

Voltage drop along a strip causes LEDs far from the power source to appear dimmer and shift color (blue and green are more affected than red because they have higher forward voltages). Power injection every 50-100 LEDs is required for color accuracy.

```
POWER INJECTION PATTERN
================================================================

  PSU ──┬── LED 1-50 ──┬── LED 51-100 ──┬── LED 101-150
        │              │                │
        │         PSU ─┘           PSU ─┘
        │         (inject)         (inject)
        │
  Each injection point: own fuse, own wire pair to PSU
  MOSFET switch on data line for emergency cutoff
```

> **SAFETY WARNING:** LED strips running at full white for extended periods generate significant heat. A 5m strip of 60/m WS2812B at full white dissipates 90W. Proper heat sinking (aluminum channel, thermal tape) is required. Never mount LED strips directly on combustible surfaces without a thermal barrier. Include a MOSFET-controlled power cutoff that firmware can trigger on over-temperature.

---

## 13. RP2040 PIO for LED Driving

The RP2040's PIO subsystem is the ideal LED driver because it generates the protocol timing in hardware, completely immune to CPU interrupts and task scheduling [14].

### PIO WS2812 Implementation

A PIO state machine for WS2812B uses approximately 8 instructions:

```
PIO WS2812 STATE MACHINE (simplified)
================================================================

.program ws2812
.side_set 1

.wrap_target
  pull block           side 0    ; Get 24-bit RGB data from FIFO
  out null, 8          side 0    ; Discard padding (32-bit FIFO, 24-bit data)
bitloop:
  out x, 1            side 0 [T3-1] ; Shift out 1 bit to X
  jmp !x do_zero      side 1 [T1-1] ; If 0, jump; high for T1
  jmp bitloop          side 1 [T2-1] ; If 1, stay high for T1+T2
do_zero:
  nop                  side 0 [T2-1] ; Pull low for the zero case
.wrap

; T1, T2, T3 set for 800 kHz WS2812B timing
; PIO clock = 125 MHz, each instruction = 8 ns at full speed
```

### PIO APA102 Implementation

For APA102, the PIO generates SPI clock and data simultaneously. Because APA102 is clock-based (not timing-based), the PIO can run at any speed up to 62.5 MHz (half of the 125 MHz system clock), far exceeding the APA102's 20 MHz specification.

### Advantage: Interrupt Immunity

On an ESP32 running FreeRTOS, WiFi stack interrupts can arrive at any time and delay WS2812B bit timing by 10-50 microseconds, causing visible glitches. The PIO state machine runs independently of both cores and cannot be interrupted by any software event. The CPU can handle WiFi, Bluetooth, and sensor reading while the PIO drives the LED strip with perfect timing.

---

## 14. Cross-References

> **Related:** [LED](../LED/) -- LED controller selection and animation patterns. [SGL](../SGL/) -- DSP-driven audio-reactive LED effects and real-time signal-to-light conversion. [SHE](../SHE/) -- weatherproofing outdoor LED installations. [BPS](../BPS/) -- field deployment patterns for sensor+display nodes. [T55](../T55/) -- timing subsystems for phase synchronization. [SPA](../SPA/) -- spatial audio and light integration for immersive installations. [ECO](../ECO/) -- ecological monitoring with visual status displays. [EMG](../EMG/) -- emergency beacon and status display applications. [SYS](../SYS/) -- power distribution infrastructure for large installations. [PSS](../PSS/) -- power system sizing for LED arrays and field nodes.

---

## 15. Sources

1. Miner, J. et al. (1985): "Amiga Hardware Reference Manual." Commodore-Amiga, Inc.
2. WorldSemi (2023): "WS2812B Intelligent Control LED Datasheet v5."
3. APA Electronic Co. (2022): "APA102-2020 RGB LED with Integrated Driver Datasheet."
4. WorldSemi (2023): "WS2812B Timing Specifications." worldsemi.com
5. Sparkle Labs / SparkFun (2024): "APA102 Protocol Reference." sparkfun.com/datasheets/Components/LED/APA102.pdf
6. LEDinside (2024): "SK6812 RGBW LED Specification Overview." ledinside.com
7. Hackaday (2023): "POV Display Fundamentals -- Timing, Synchronization, and Design." hackaday.com
8. Make Magazine (2023): "Build a POV Globe." makezine.com
9. Circuit Cellar (Jul 2024): "Holographic POV Display using Raspberry Pi Pico on PTFE PCB." circuitcellar.com
10. Adafruit Industries (2024): "POV Tutorial -- Hall Effect Synchronization." learn.adafruit.com/genesis-poi
11. GPS.gov (2025): "GPS Timing Applications -- PPS Accuracy Specifications." gps.gov/technical/timing/
12. National Electrical Code (2023): NEC Article 725 -- Class 1, Class 2, and Class 3 Remote-Control Circuits.
13. Adafruit Industries (2024): "NeoPixel Uberguide -- Power and Wiring." learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels
14. Raspberry Pi Foundation (2024): "RP2040 PIO Programming Guide -- WS2812 Example." github.com/raspberrypi/pico-examples/tree/master/pio/ws2812
15. Texas Instruments (2023): "74AHCT125 Quadruple Bus Buffer with 3-State Outputs." ti.com/lit/ds/symlink/sn74ahct125.pdf
16. Qi Standard / WPC (2024): "Wireless Power Transfer -- Inductive Coupling Fundamentals." wirelesspowerconsortium.com
