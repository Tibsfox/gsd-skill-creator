# WS2812B NZR Protocol Deep Dive

The WS2812B is the most widely used addressable LED in the maker and professional lighting world. Its single-wire NZR (Non-Return-to-Zero) protocol is simultaneously elegant and demanding -- transmitting 24 bits of color data per LED at 800 kHz through precise nanosecond timing on a single data pin. This page covers every detail of the protocol, the infamous 3.3V logic level problem, and the solutions.

---

## Protocol Overview

The WS2812B uses a cascaded data architecture. Each LED in the chain reads the first 24 bits it receives, then retransmits the remaining data to the next LED:

```
                WS2812B Cascaded Data Flow

  MCU --[24 bits + 24 bits + 24 bits]---> LED 1
                                            |
        LED 1 extracts first 24 bits        |
        (its color data)                    |
                                            |
        Remaining data forwarded:           v
        [24 bits + 24 bits]--> LED 2
                                  |
        LED 2 extracts first 24   |
        bits, forwards rest:      v
        [24 bits]--> LED 3
                       |
        LED 3 extracts |
        its 24 bits    v
        (nothing left to forward)
```

This means:
- No addressing needed -- position in the chain determines which data each LED receives
- Data for all LEDs is sent in one continuous stream
- The first 24 bits always go to the first LED, regardless of chain length
- Adding or removing LEDs at the end does not affect earlier LEDs

---

## Bit Encoding: NZR (Non-Return-to-Zero)

Each bit is encoded as a fixed-width pulse at 800 kHz (1.25 microseconds per bit). The bit value is determined by the ratio of HIGH time to LOW time:

### Timing Specification

| Symbol | Parameter | Duration | Tolerance |
|--------|-----------|----------|-----------|
| T0H | "0" bit HIGH time | 0.4 us (400 ns) | +/- 150 ns |
| T0L | "0" bit LOW time | 0.85 us (850 ns) | +/- 150 ns |
| T1H | "1" bit HIGH time | 0.8 us (800 ns) | +/- 150 ns |
| T1L | "1" bit LOW time | 0.45 us (450 ns) | +/- 150 ns |
| T_bit | Total bit period | 1.25 us | -- |
| T_reset | Reset (latch) | > 280 us | Newer: > 280 us |

### ASCII Timing Diagram

```
"0" bit (0.4 us HIGH, 0.85 us LOW):

         T0H          T0L
      |<-0.4us->|<---0.85us--->|
      +--------+               |
      |        |               |
  ----+        +---------------+----
      |<------1.25 us-------->|


"1" bit (0.8 us HIGH, 0.45 us LOW):

            T1H              T1L
      |<---0.8us--->|<-0.45us->|
      +-------------+          |
      |             |          |
  ----+             +----------+----
      |<------1.25 us-------->|


Reset (latch) signal -- hold LOW for > 280 us:

                   T_reset
      |<-------> 280 us+ <------->|
      |                            |
  ----+----------------------------+----
                 (LOW)
```

### What the Tolerance Means

The +/- 150 ns tolerance is both generous and unforgiving:

- **Generous:** A 400 ns HIGH pulse can be anywhere from 250-550 ns and still read as a "0"
- **Unforgiving:** The gap between a valid "0" HIGH (max 550 ns) and a valid "1" HIGH (min 650 ns) is only 100 ns. If your timing jitter exceeds this, data corruption occurs.

This is why software bit-banging on a Linux system (like a [Raspberry Pi](m2-raspberry-pi-gpio.md) without DMA) is unreliable -- the Linux scheduler can insert multi-microsecond delays at any point.

---

## Data Format: GRB, Not RGB

The WS2812B uses **GRB** byte order, which surprises many beginners:

```
24-bit data per LED:

  Bit 23 (MSB first)                         Bit 0
  |                                               |
  G7 G6 G5 G4 G3 G2 G1 G0  R7 R6 R5 R4 R3 R2 R1 R0  B7 B6 B5 B4 B3 B2 B1 B0
  |<--- Green (8 bits) --->| |<--- Red (8 bits) --->|  |<--- Blue (8 bits) --->|

  MSB transmitted first within each byte.
  Green byte transmitted first, then Red, then Blue.
```

### Why GRB?

The GRB order is a hardware design decision by WorldSemi (the WS2812B manufacturer). It has no technical advantage over RGB -- it is simply how the internal shift register is wired. Every library (NeoPixel, FastLED) handles this automatically, but if you are writing raw protocol code, getting the byte order wrong is a common source of incorrect colors.

### Color Examples (GRB Format)

| Color | Red | Green | Blue | GRB Data (hex) | GRB Data (binary) |
|-------|-----|-------|------|----------------|-------------------|
| Red | 255 | 0 | 0 | 0x00FF00 | 00000000 11111111 00000000 |
| Green | 0 | 255 | 0 | 0xFF0000 | 11111111 00000000 00000000 |
| Blue | 0 | 0 | 255 | 0x0000FF | 00000000 00000000 11111111 |
| White | 255 | 255 | 255 | 0xFFFFFF | 11111111 11111111 11111111 |
| Yellow | 255 | 255 | 0 | 0xFFFF00 | 11111111 11111111 00000000 |
| Off | 0 | 0 | 0 | 0x000000 | 00000000 00000000 00000000 |

---

## Interrupt Sensitivity

> **SAFETY WARNING:** The WS2812B protocol is extremely intolerant of interruptions during data transmission. Any pause longer than ~280 us (the reset threshold) in the middle of a data stream will cause the remaining LEDs to interpret subsequent data incorrectly. On microcontrollers, this means interrupts must be disabled during transmission.

### What Happens When an Interrupt Fires

```
Normal transmission (no interrupts):

  [LED1 data: 24 bits][LED2 data: 24 bits][LED3 data: 24 bits]
  |<----- continuous at 800 kHz, no gaps > 280 us ----->|


Corrupted transmission (interrupt during send):

  [LED1 data: 24 bits][LED2: 12 bits]---INTERRUPT (500 us)---[remaining 12 bits][LED3...]
                                        ^                     ^
                                        |                     |
                         This gap > 280 us triggers reset.    LED2 latches the
                         LED2 latches incomplete data.        first 12 bits of
                                                              what was meant for LED3.
  Result: LED2 shows wrong color. LED3 and beyond shift by 12 bits -- all wrong.
```

### Solutions by Platform

| Platform | Interrupt Strategy | See Page |
|----------|-------------------|----------|
| Arduino | `noInterrupts()` during `strip.show()` | [Arduino LED Control](m2-arduino-led-control.md) |
| ESP32 | RMT peripheral (hardware, no CPU) | [ESP32 LED Control](m2-esp32-led.md) |
| RP2040 | PIO state machine (hardware, no CPU) | [RP2040 PIO](m2-rp2040-pio.md) |
| Raspberry Pi | DMA via rpi_ws281x library | [Raspberry Pi GPIO](m2-raspberry-pi-gpio.md) |

The Arduino approach (disable interrupts) works but has side effects: `millis()` stops advancing, serial data can be lost, and other time-sensitive tasks stall. For long strips (300+ LEDs), the `show()` call blocks for **9+ milliseconds** with interrupts disabled. This is why the ESP32 (RMT) and RP2040 (PIO) are strongly preferred for large installations.

---

## The 3.3V Logic Level Problem

This is the single most common source of WS2812B reliability issues:

### The Problem

The WS2812B datasheet specifies:

```
VDD = 5V (power supply)
VIH = 0.7 x VDD = 0.7 x 5.0 = 3.5V minimum for logic HIGH

Most 3.3V microcontrollers output:
  VOH = 3.0-3.3V

3.3V < 3.5V --> DATA PIN DOES NOT RELIABLY REGISTER AS HIGH
```

In practice, many WS2812B strips work at 3.3V logic -- the VIH threshold has margin, and some batches are more tolerant. But "works on my bench" is not reliable engineering. Temperature changes, different batches, longer wires, and voltage drop can all push a marginal signal into failure.

### Symptoms of Logic Level Problems

- First few LEDs work, rest are wrong colors or dark
- Random color glitches, especially at specific colors
- Works sometimes, fails after warming up
- Works with 10 LEDs, fails with 100
- Works in winter, fails in summer (VIH threshold rises with temperature)

### Solution 1: 74HCT125 Level Shifter (Recommended)

The 74HCT125 is a quad buffer with HCT-family input thresholds that accept 3.3V logic and output 5V:

```
                    74HCT125
                 +-----------+
  3.3V logic --->| 1A    1Y  |---> 5V logic to WS2812B
                 |            |
  GND        --->| 1OE  VCC  |<--- 5V
                 |            |
                 | GND        |
                 +-----------+

  Connection:
    Pin 1 (1OE) --> GND (always enabled)
    Pin 2 (1A)  --> MCU data output (3.3V)
    Pin 3 (1Y)  --> WS2812B DIN (5V level)
    Pin 7 (GND) --> GND
    Pin 14 (VCC) --> 5V

  Note: 74HCT family accepts VIL < 0.8V, VIH > 2.0V
  So 3.3V input is well above the 2.0V threshold.
```

Cost: $0.30-0.50. Footprint: 14-pin DIP or SOIC. This is the industry standard solution.

### Solution 2: Sacrificial First LED

A rougher but common approach: power the first WS2812B at 3.3V instead of 5V. Since VIH = 0.7 x VDD = 0.7 x 3.3 = 2.31V, the 3.3V logic signal easily exceeds this threshold. The first LED regenerates the signal at its output, which (since VDD for subsequent LEDs is 5V) is now a 5V logic level.

```
  3.3V MCU ----[data]----> LED 0 (powered at 3.3V)
                              |
                           [data out at ~3.3V]
                              |
                              v
                           LED 1 (powered at 5V, but first LED's output
                                  is 3.3V which is above 0.7 * 3.3 = 2.31V)
```

Downsides: First LED has reduced brightness and different color rendition at 3.3V. Not reliable with all WS2812B batches. The 74HCT125 solution is more robust.

### Solution 3: Pull-Up Resistor to 5V

A 470-ohm resistor from the data line to 5V can pull the 3.3V signal closer to 5V. This is a hack -- it works in some cases but adds load to the MCU output pin and can distort the signal at high frequencies. Not recommended for production designs.

---

## Reset Timing

After transmitting data for all LEDs, the data line must be held LOW for a minimum reset time before the next frame:

| Datasheet Version | Reset Time |
|-------------------|------------|
| Original WS2812B | > 50 us |
| Revised/newer batches | > 280 us |
| Safe recommendation | > 300 us |

The 280 us reset time was increased in newer silicon revisions. Using 300 us or longer ensures compatibility with all batches. Most libraries use 300 us.

---

## Timing Constraints on Maximum Frame Rate

The time to update N LEDs:

```
T_frame = N * 24 * 1.25 us + T_reset

For 60 LEDs:   T = 60 * 30 us + 300 us = 2100 us =  2.1 ms  --> 476 fps
For 150 LEDs:  T = 150 * 30 us + 300 us = 4800 us =  4.8 ms  --> 208 fps
For 300 LEDs:  T = 300 * 30 us + 300 us = 9300 us =  9.3 ms  --> 107 fps
For 600 LEDs:  T = 600 * 30 us + 300 us = 18300 us = 18.3 ms --> 54 fps
For 1000 LEDs: T = 1000 * 30 us + 300 us = 30300 us = 30.3 ms --> 33 fps
```

For most visual effects, 30-60 fps is sufficient. The protocol itself is not the bottleneck until you exceed ~1000 LEDs. The limiting factor is usually RAM (3 bytes per LED) and animation computation time.

---

## WS2812B Variants

| Variant | Difference from WS2812B |
|---------|------------------------|
| WS2812 (original) | External current-limiting resistors needed |
| WS2812B | Built-in resistors, improved consistency |
| SK6812 | Compatible protocol, adds RGBW option (4 bytes/LED) |
| WS2813 | Dual data lines (backup if one LED fails), different timing |
| WS2815 | 12V version, individual pixel control at 12V |
| WS2812B-V5 | Enhanced protocol with backup data line |

The SK6812 is particularly notable for RGBW support -- a dedicated white LED channel provides cleaner, more efficient white light than mixing RGB. See [LED Libraries](m3-led-libraries.md) for library support.

---

## Complete Protocol Walkthrough

Sending the color **red** (R=255, G=0, B=0) to a single LED:

```
GRB format: G=0x00, R=0xFF, B=0x00

Binary: 00000000 11111111 00000000

Bit sequence (MSB first for each byte):

  G7=0 G6=0 G5=0 G4=0 G3=0 G2=0 G1=0 G0=0
  R7=1 R6=1 R5=1 R4=1 R3=1 R2=1 R1=1 R0=1
  B7=0 B6=0 B5=0 B4=0 B3=0 B2=0 B1=0 B0=0

Signal on data line:

  [0][0][0][0][0][0][0][0][1][1][1][1][1][1][1][1][0][0][0][0][0][0][0][0][RESET]
  |<---- Green = 0 ----->||<---- Red = 255 ----->||<---- Blue = 0 ------>|

  Each [0] = 0.4us HIGH + 0.85us LOW
  Each [1] = 0.8us HIGH + 0.45us LOW
  Total: 24 x 1.25 us = 30 us per LED
  RESET: 300 us LOW
```

---

## Power Considerations

Each WS2812B LED draws up to 60 mA at full white (20 mA per channel x 3 channels):

| LED Count | Max Current (all white) | Recommended PSU | Wire Gauge |
|-----------|------------------------|-----------------|------------|
| 30 | 1.8A | 5V 2.5A (12.5W) | 22 AWG |
| 60 | 3.6A | 5V 5A (25W) | 20 AWG |
| 150 | 9.0A | 5V 12A (60W) | 18 AWG |
| 300 | 18.0A | 5V 25A (125W) | 14-16 AWG |

For strips longer than 50-100 LEDs, power injection is essential. See [Power Injection](m3-power-injection.md).

---

## Debugging WS2812B Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| No LEDs light up | Wrong data pin, no power, reversed polarity | Check wiring, check 5V power |
| First LED wrong color, rest OK | GRB vs RGB byte order | Set library to NEO_GRB |
| Random flickering | 3.3V logic level issue | Add 74HCT125 level shifter |
| Colors drift over long strip | Voltage drop | Power injection every 50-100 LEDs |
| Last LEDs dim or wrong | Voltage drop | Power injection, heavier wire |
| Works briefly then glitches | Missing decoupling capacitor | Add 100uF at power input |
| Works with few LEDs, fails with many | Insufficient power supply | Size PSU at 120% of max load |

---

## Cross-References

- [APA102 SPI Protocol](m3-apa102-spi.md) -- Clock-based alternative without timing constraints
- [LED Libraries](m3-led-libraries.md) -- NeoPixel, FastLED, and WLED library comparison
- [Power Injection](m3-power-injection.md) -- Voltage drop and wiring for long WS2812B runs
- [Arduino LED Control](m2-arduino-led-control.md) -- Driving WS2812B from Arduino
- [ESP32 LED Control](m2-esp32-led.md) -- RMT peripheral for hardware WS2812B timing
- [RP2040 PIO](m2-rp2040-pio.md) -- PIO state machine WS2812B driver

---

*Sources: WorldSemi WS2812B datasheet (v5), WorldSemi WS2812B-V5 datasheet, Josh Levine "Understanding WS2812B" analysis, Tim's Blog "WS2812B Timing", Adafruit NeoPixel Uberguide, FastLED library documentation, cpldcpu WS2812 timing investigation.*
