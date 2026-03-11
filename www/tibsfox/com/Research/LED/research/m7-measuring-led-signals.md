# Measuring LED & PWM Signals

This page covers the practical measurement procedures for LED electronics: measuring PWM dimming signals on oscilloscopes, decoding WS2812B and APA102 protocol data, using protocol decoders on Rigol and Siglent scopes, and testing LEDs with a multimeter's diode mode. Each section provides the exact scope settings, probe connections, and interpretation of results.

---

## Measuring PWM Dimming Signals

### What You Are Measuring

PWM (Pulse Width Modulation) dims LEDs by switching them on and off rapidly. The duty cycle (percentage of time the signal is HIGH) determines perceived brightness. A 50% duty cycle means the LED is on half the time, appearing ~50% as bright (perceived brightness follows a logarithmic curve, so 50% duty may look closer to 70% brightness to the eye).

The key measurements:
- **Frequency (f):** How many on/off cycles per second
- **Period (T):** Duration of one cycle (T = 1/f)
- **Duty cycle:** HIGH time / period (expressed as percentage)
- **Voltage levels:** Verify logic HIGH and LOW match expected values

### Scope Setup for PWM

```
Channel:      CH1 (yellow trace)
Probe:        10:1 passive probe
Coupling:     DC
V/div:        2V/div (for 5V signals) or 1V/div (for 3.3V signals)
Timebase:     1 ms/div (for ~1 kHz PWM)
              100 us/div (for ~10 kHz PWM)
              10 us/div (for ~100 kHz PWM)
Trigger:      Edge, rising, CH1, level = 2.5V (for 5V) or 1.65V (for 3.3V)
Trigger mode: Auto
```

### Connection Points

```
PWM Circuit:
                    MOSFET gate
  MCU GPIO ----+---- [Gate]
               |     [Drain] ---- LED Strip (-)
  Scope CH1 ---+     [Source] ---- GND
  probe tip            |
                       |
  Scope GND -----------+---- Power Supply GND
  (probe clip)
```

> **SAFETY WARNING:** Always connect the oscilloscope ground clip to the circuit ground (0V reference). Never connect the ground clip to a point that is at a voltage above ground -- the ground clip is internally connected to the scope chassis and building earth ground. Connecting it to a live point will create a short circuit.

### Reading the Waveform

```
Oscilloscope display:

  5V |  +--------+          +--------+          +--------+
     |  |        |          |        |          |        |
     |  |        |          |        |          |        |
     |  |        |          |        |          |        |
  0V +--+        +----------+        +----------+        +--
     |
     |--|  Thigh |-| Tlow  |
     |--|     T (period)    |

  Measurements:
    T = 1.0 ms  -->  f = 1/T = 1000 Hz
    Thigh = 0.5 ms
    Duty cycle = 0.5 / 1.0 = 50%
```

### Arduino PWM Frequencies

Arduino's `analogWrite()` produces PWM at different frequencies depending on the pin and timer:

| Arduino Board | Timer 0 Pins | Timer 1 Pins | Timer 2 Pins | Default Freq |
|--------------|-------------|-------------|-------------|-------------|
| Uno/Nano | 5, 6 | 9, 10 | 3, 11 | 490 Hz (T1/T2), 976 Hz (T0) |
| Mega | 4, 13 | 11, 12 | 9, 10 | 490 Hz (most), 976 Hz (T0) |
| ESP32 | Any (LEDC) | Any (LEDC) | Any (LEDC) | Configurable, 5 kHz default |

For LED dimming, 490 Hz may produce visible flicker for some people. See [Arduino LED Control](m2-arduino-led-control.md) for timer prescaler modification to increase PWM frequency.

### Measuring MOSFET Switching

When measuring the gate signal of a MOSFET in a [PWM dimmer circuit](m5-mosfet-pwm-dimmers.md), also check:

1. **Gate voltage:** Should reach the MOSFET's Vgs threshold (typically 2-4V for logic-level MOSFETs)
2. **Rise time:** Measure 10% to 90% transition time. Slow rise times cause the MOSFET to dissipate heat in its linear region.
3. **Ringing:** Overshoot on the gate signal can exceed the MOSFET's Vgs max rating. Add a gate resistor (100-470 ohm) if ringing exceeds 10% overshoot.

---

## Measuring WS2812B Data Signals

### What You Are Measuring

The WS2812B uses a single-wire NZR (Non-Return-to-Zero) protocol at 800 kHz. Each bit is encoded as a specific pulse width:

```
WS2812B Bit Encoding:

  "0" bit (T0H = 0.4us, T0L = 0.85us):        "1" bit (T1H = 0.8us, T1L = 0.45us):

  +---+                                         +--------+
  |   |                                          |        |
  |   |                                          |        |
  +   +-----------+                              +        +------+
  |0.4|   0.85    |                              | 0.8    | 0.45 |
  |<->|<--------->|                              |<------>|<---->|
  |   1.25us total|                              | 1.25us total  |
```

Both bits have the same total period (1.25us) but different duty cycles. A "1" has a longer HIGH pulse, a "0" has a shorter HIGH pulse.

### Scope Setup for WS2812B

```
Channel:      CH1
Probe:        10:1 passive
Coupling:     DC
V/div:        2V/div (WS2812B operates at 5V logic)
Timebase:     1 us/div (see individual bits)
              or 10 us/div (see a full LED's 24 bits = 30us)
              or 500 us/div (see full strip update)
Trigger:      Edge, rising, CH1, level = 2.5V
Trigger mode: Normal (to catch specific patterns)
              or Single (one-shot capture of a frame)
```

### Connection Points

```
WS2812B Strip:

  MCU GPIO (Data Out) ---- DIN [WS2812B LED 0] DOUT ---- DIN [LED 1] ...
          |
  Scope CH1 probe tip
          |
  Scope GND clip ---- Circuit GND
```

Probe the **DIN** (Data In) pin of the first LED to see the full data stream from the MCU. Probing DOUT of any LED shows the data stream after that LED has stripped its 24 bits.

### Identifying Bits on the Waveform

At 1us/div timebase:

```
Scope display at 1 us/div:

  5V  +-+     +-------+   +-+     +-+     +-------+
      | |     |       |   | |     | |     |       |
      | |     |       |   | |     | |     |       |
  0V  + +-----+       +---+ +-----+ +-----+       +---
      |0|  0  |   1   | 0 | 0|  0 | 0|  0 |   1   |
       .4  .85   .8   .45  .4 .85  .4 .85   .8   .45
       us   us    us   us   us  us  us  us   us   us

  Reading left to right: 0, 1, 0, 0, 1 = binary 01001...
```

Use the scope's **cursor** function to measure pulse widths precisely. Place cursor A on the rising edge and cursor B on the falling edge; the delta reading gives the HIGH pulse width.

### Using Protocol Decoders

Modern oscilloscopes (Rigol DS1054Z, Siglent SDS1104X-E) include built-in protocol decoders that can automatically parse WS2812B data:

**Rigol DS1054Z WS2812B decode setup:**

1. Press **Decode** > **Protocol** > **NRZ** (or custom protocol, depending on firmware)
2. Set the data source to **CH1**
3. Configure bit timing thresholds:
   - "0" threshold: HIGH pulse < 0.6us
   - "1" threshold: HIGH pulse > 0.6us
4. Set word length to **24 bits** (one LED's worth of data)
5. Set bit order to **MSB first**, color order to **GRB** (WS2812B sends Green-Red-Blue)
6. Enable decode overlay

The scope will annotate each LED's data directly on the waveform, showing hex color values (e.g., `GRB: 00FF00` for full green).

**Siglent SDS1104X-E:** The Siglent uses a similar protocol decode interface. Navigate to **Decode** > **Protocol** > **Custom** and configure the same parameters.

If your scope does not have a WS2812B-specific decoder, you can use a **UART decoder** configured for 800 kbaud, 8-N-1 to get approximate decoding, though the bit boundaries will not align perfectly with the UART framing.

---

## Measuring APA102 SPI Signals

### What You Are Measuring

The APA102 uses a standard SPI interface with two wires: CLK (clock) and DAT (data / MOSI). Data is latched on the **rising edge** of the clock.

### Scope Setup for APA102

```
Channel 1:    CLK (clock signal)
Channel 2:    DAT (data / MOSI signal)
Probe:        10:1 passive on both channels
Coupling:     DC
V/div:        2V/div (5V logic) or 1V/div (3.3V logic)
Timebase:     500 ns/div (to see individual clock cycles at 10-24 MHz)
              or 10 us/div (to see a full LED frame of 32 bits)
              or 100 us/div (to see full strip update)
Trigger:      Edge, rising, CH1 (clock), level = 2.5V
```

### Two-Channel SPI Measurement

```
Scope display at 500 ns/div (showing 4 clock cycles):

CH1   +--+  +--+  +--+  +--+
(CLK) |  |  |  |  |  |  |  |
      +  +--+  +--+  +--+  +--
         ^     ^     ^     ^
         |     |     |     |
CH2   ---+--+--+--------+--+--
(DAT)    | 1|0 |  1   1 | 0|
         +--+  +--------+--+

Data is latched on rising edges of CLK:
  Edge 1: DAT=1 --> bit = 1
  Edge 2: DAT=0 --> bit = 0
  Edge 3: DAT=1 --> bit = 1
  Edge 4: DAT=1 --> bit = 1

Reading: 1011...
```

### Using SPI Protocol Decoder

**Rigol DS1054Z SPI decode:**

1. Press **Decode** > **Protocol** > **SPI**
2. Set CLK source = CH1, MOSI source = CH2
3. Set clock polarity = CPOL 0 (idle LOW)
4. Set clock phase = CPHA 0 (data latched on rising edge)
5. Set word size = 8 bits
6. Enable decode overlay

The scope will display decoded bytes directly on the waveform. The start frame (0x00 0x00 0x00 0x00) will be clearly visible, followed by LED data frames starting with 0xE0-0xFF (the 111 + brightness header).

See [APA102 SPI Protocol](m3-apa102-spi.md) for the frame structure to correlate decoded bytes to LED colors.

---

## Multimeter Diode Test Mode

### Testing LED Polarity and Forward Voltage

A digital multimeter's **diode test mode** applies a small test current (typically 1 mA) and displays the forward voltage drop. This is the fastest way to:

1. **Determine polarity** of an unknown LED
2. **Verify the LED is functional** (not open or shorted)
3. **Estimate forward voltage** for circuit design
4. **Sort LEDs by Vf** for matched strings

### Procedure

```
Multimeter set to DIODE TEST mode (diode symbol):

  Red probe (+) ----> LED Anode (+, longer lead)
  Black probe (-) --> LED Cathode (-, shorter lead, flat edge)

  Reading:
    1.8-2.2V --> Red/Orange/Yellow LED (GaAsP/AlGaInP)
    2.8-3.5V --> Green LED (InGaN)
    3.0-3.8V --> Blue/White LED (InGaN)
    OL (Open) --> Reversed polarity or dead LED

  The LED should glow faintly during the test.
  If it does not glow and reads OL, swap the probes.
  If it still reads OL, the LED is damaged.
```

### Interpreting Readings

| Reading | Meaning |
|---------|---------|
| 0.000 V | Short circuit (LED die shorted) |
| 0.5-0.7 V | Regular silicon diode, not an LED |
| 1.8-2.2 V | Red/orange/yellow LED (normal) |
| 2.8-3.8 V | Green/blue/white LED (normal) |
| OL (overload) | Open circuit, reversed polarity, or dead LED |

> **SAFETY WARNING:** Never use diode test mode on high-power LED modules while they are connected to a power supply. Disconnect all power before testing. Some high-power LED modules have parallel ESD protection diodes that will give misleading readings if the module is still in-circuit.

### Testing LEDs in a Strip

To test individual LEDs in a WS2812B or APA102 strip, you cannot use the multimeter directly on the data pin -- the integrated controller IC handles addressing. Instead, power the strip and use software to light individual LEDs for testing. If a specific LED appears dead:

1. Check solder joints on the strip (reflow with a soldering iron)
2. Check continuity of the data line through the dead LED (a broken LED blocks data to all downstream LEDs in WS2812B)
3. For APA102, check both CLK and DAT continuity

See [Power Injection](m3-power-injection.md) for diagnosing voltage drop issues in long strips.

---

## Advanced Measurement: Power Supply Ripple

### Why It Matters for LEDs

Switching power supplies (the most common type for LED projects) produce high-frequency ripple on their output. Excessive ripple can:

- Cause visible LED flicker at the switching frequency (typically 50-500 kHz)
- Interfere with WS2812B data timing (the NZR protocol is sensitive to power rail noise)
- Cause color errors in addressable LEDs

### Measurement Procedure

```
Channel:      CH1
Probe:        10:1 passive, shortest possible ground lead
Coupling:     AC (removes DC offset, shows only ripple)
V/div:        20 mV/div or 50 mV/div (ripple is small)
Timebase:     5 us/div (for 100-500 kHz switching frequency)
Trigger:      Edge, CH1, auto
Bandwidth:    20 MHz limit (filters out high-frequency probe noise)

Acceptable ripple:
  < 50 mV peak-to-peak for WS2812B strips
  < 100 mV peak-to-peak for analog LED strips
  < 20 mV peak-to-peak for precision color sensing (TCS34725)
```

The ground lead matters enormously for ripple measurement. The standard ground clip creates a loop antenna that picks up radiated noise, making ripple look worse than it actually is. Use the **ground spring** (tip-and-barrel) accessory for accurate ripple measurement.

---

## Measurement Checklist: Quick Reference

| What to Measure | Timebase | V/div | Trigger | Key Reading |
|----------------|----------|-------|---------|-------------|
| PWM 1 kHz | 1 ms/div | 2V/div | Rising, 2.5V | Duty cycle % |
| PWM 25 kHz | 20 us/div | 2V/div | Rising, 2.5V | Duty cycle % |
| WS2812B bits | 1 us/div | 2V/div | Rising, 2.5V | Pulse width: 0.4 vs 0.8us |
| WS2812B frame | 500 us/div | 2V/div | Rising, 2.5V | Full update time |
| APA102 SPI | 500 ns/div | 2V/div | Rising CLK | Clock freq, data alignment |
| PSU ripple | 5 us/div | 50mV/div (AC) | Auto | Peak-to-peak mV |
| MOSFET gate | 1 us/div | 5V/div | Rising, 2V | Rise time, ringing |

---

## Key Takeaways

- For PWM measurement: set timebase to show 1-3 complete cycles, trigger on rising edge at signal midpoint
- WS2812B "1" bits have ~0.8us HIGH pulse; "0" bits have ~0.4us HIGH pulse; use 1us/div timebase
- Protocol decoders on Rigol and Siglent scopes can auto-parse WS2812B and SPI data on the waveform
- Multimeter diode test mode reads forward voltage (1.8-2.2V red, 3.0-3.8V blue/white) and makes the LED glow faintly
- Power supply ripple measurement requires AC coupling, millivolt scale, and a short ground lead

---

## Cross-References

- [Oscilloscope Basics](m7-oscilloscope-basics.md) -- Scope types, bandwidth selection, probe compensation
- [Nyquist Sampling](m7-nyquist-sampling.md) -- Why sampling rate matters for accurate waveform capture
- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Complete WS2812B timing specification
- [APA102 SPI Protocol](m3-apa102-spi.md) -- SPI frame structure for APA102 decode
- [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- Gate drive circuits to measure
- [Glossary](00-glossary.md) -- Definitions of terms used throughout this series

---

*Sources: Rigol DS1054Z user manual and application notes, Siglent SDS1104X-E protocol analysis guide, Tektronix "Probing Techniques for Accurate Voltage Measurements," Keysight "Making Better Power Rail Measurements," WorldSemi WS2812B-V5 datasheet (timing specifications), Fluke multimeter application notes, SparkFun "How to Use a Multimeter" tutorial.*
