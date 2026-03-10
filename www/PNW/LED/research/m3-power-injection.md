# Power Injection & Strip Wiring

Voltage drop is the silent killer of LED strip installations. A 5V WS2812B strip fed from one end loses significant voltage over distance -- LEDs at the far end receive less than 5V, resulting in dimmer output, color shift (blue/green fade first because their higher Vf makes them more sensitive to voltage drop), and in extreme cases, data corruption. Power injection -- feeding power at multiple points along the strip -- is the solution.

---

## Understanding Voltage Drop

Every wire has resistance. Current flowing through that resistance causes a voltage drop (Ohm's Law: V = I * R). LED strips carry all their current through the thin copper traces on the flexible PCB -- and those traces have significant resistance.

### Copper Trace Resistance in LED Strips

Typical 5V LED strip specifications:

| Strip Type | Trace Width | Trace Thickness | Resistance per Meter | Resistance per 5m |
|-----------|-------------|----------------|---------------------|-------------------|
| Budget WS2812B (10mm wide) | 2mm per rail | 1 oz copper | ~0.4 ohm/m | ~2.0 ohm |
| Quality WS2812B (10mm wide) | 3mm per rail | 2 oz copper | ~0.2 ohm/m | ~1.0 ohm |
| Quality WS2812B (12mm wide) | 4mm per rail | 2 oz copper | ~0.15 ohm/m | ~0.75 ohm |
| 12V strip (10mm wide) | 2mm per rail | 1 oz copper | ~0.4 ohm/m | ~2.0 ohm |

### Voltage Drop Calculation

```
V_drop = I_total * R_wire

For 60 LEDs/m WS2812B strip, 5m, all white at full brightness:
  LEDs: 300 total
  Current per LED: 60 mA (all white)
  Total current: 300 * 0.060 = 18A

  But current is not uniform along the strip -- it decreases
  as each LED draws its share. The average voltage drop is
  calculated using the distributed load formula:

  V_drop = (I_total * R_total) / 2    (for uniformly distributed load)
  V_drop = (18A * 1.0 ohm) / 2 = 9V

  But we only have 5V supply! This is physically impossible --
  the LEDs cannot draw their full rated current. Instead, LEDs
  at the end are severely starved.
```

This demonstrates why 5m of dense WS2812B strip at full white **cannot work** from a single power feed point.

---

## Visualizing Voltage Drop

### Single-End Power Feed (Problem)

```
Power                                                   End of strip
Supply                                                  (no power)
  5V ===+==LED==LED==LED==LED==LED==LED==LED==LED==LED===>
  GND ==+==LED==LED==LED==LED==LED==LED==LED==LED==LED===>

  Voltage along strip:
  5.0V  4.8V  4.5V  4.2V  3.8V  3.5V  3.1V  2.8V  2.4V

  Result: First LEDs are bright. Last LEDs are dim, with blue/green
  fading first (they need 3.0-3.2V Vf). Red persists longer (1.8-2.2V Vf).
  The strip appears to shift from white to yellowish to reddish-dim.
```

### Power Injection at Both Ends (Better)

```
Power                                                   Power
Supply                                                  Supply
  5V ===+==LED==LED==LED==LED==LED==LED==LED==LED==LED===+== 5V
  GND ==+==LED==LED==LED==LED==LED==LED==LED==LED==LED===+== GND

  Voltage along strip:
  5.0V  4.9V  4.7V  4.5V  4.4V  4.5V  4.7V  4.9V  5.0V

  Current flows from both ends, meeting in the middle.
  Voltage dip is halved compared to single-end feed.
```

### Power Injection Every Meter (Best)

```
  PSU    inject    inject    inject    inject    PSU
   |       |         |         |         |       |
  5V ===+==LED==LED==+==LED==LED==+==LED==LED==+==LED==LED==+== 5V
  GND ==+==LED==LED==+==LED==LED==+==LED==LED==+==LED==LED==+== GND

  Voltage along strip:
  5.0V  4.95V  5.0V  4.95V  5.0V  4.95V  5.0V  4.95V  5.0V

  Maximum voltage drop < 0.1V anywhere on the strip.
  All LEDs operate at consistent brightness and color.
```

> **SAFETY WARNING:** When injecting power from multiple points, all power feeds must come from the SAME power supply (or supplies with common ground). Never connect two separate power supplies to the same strip without verifying their grounds are at the same potential. Floating grounds can cause ground loops, data corruption, and potential equipment damage.

---

## Power Injection Guidelines

### WS2812B (5V) Strips

| LED Density | Max Run Without Injection | Recommended Injection Interval |
|------------|--------------------------|-------------------------------|
| 30 LEDs/m | 3-4 meters | Every 2-3 meters |
| 60 LEDs/m | 1.5-2 meters | Every 1-1.5 meters |
| 144 LEDs/m | 0.5-1 meter | Every 0.5-1 meter |

**Rule of thumb:** Inject power every 50-100 WS2812B LEDs, or every meter for dense strips.

### APA102 (5V) Strips

APA102 strips have the same voltage drop characteristics as WS2812B (same 5V power rails). Follow the same injection intervals. The clock and data lines do not need injection -- only the 5V and GND rails.

For APA102 protocol details, see [APA102 SPI Protocol](m3-apa102-spi.md).

### 12V and 24V Strips

Higher voltage strips have proportionally less voltage drop because the current is lower for the same power:

```
Same 72W strip:
  At 5V:  72W / 5V  = 14.4A --> massive voltage drop
  At 12V: 72W / 12V = 6.0A  --> moderate voltage drop
  At 24V: 72W / 24V = 3.0A  --> minimal voltage drop
```

| Strip Voltage | Max Run Without Injection | Notes |
|--------------|--------------------------|-------|
| 5V (WS2812B) | 1-2 meters | Most injection-needy |
| 12V (analog or WS2815) | 5-7 meters | Much better |
| 24V (analog) | 10-15 meters | Best for long runs |

---

## Wiring Diagrams

### Injection Wiring: Parallel Bus

The most common approach -- run a heavy gauge power bus alongside the strip and tap off at injection points:

```
  Power Supply (5V, 30A)
       |               |
       |    +----------+------- 14 AWG bus wire (5V) ------+
       |    |           |                                    |
       +----+    +------+------+------+------+------+       |
       |         |      |      |      |      |      |       |
      [=LED=LED=LED=LED=LED=LED=LED=LED=LED=LED=LED=LED=LED=]
       |         |      |      |      |      |      |       |
       +----+    +------+------+------+------+------+       |
       |    |           |                                    |
       |    +----------+------- 14 AWG bus wire (GND) -----+
       |               |
      GND             GND

  Injection taps: every 50 LEDs (every ~1.7m at 30/m)
  Tap wire: 18-20 AWG, short (< 15cm)
  Bus wire: 14-16 AWG (carries full current)
```

### Injection Wiring: T-Tap from Center

For installations where power enters from the middle:

```
                        Power Supply
                             |
                 +-----------+-----------+
                 |           |           |
                 5V         GND         5V
                 |           |           |
  [=LED=LED=LED=LED=]  GND  [=LED=LED=LED=LED=]
  <--- Strip A --->|   |   |<--- Strip B --->
                   +---+---+
                       |
                      GND

  Current flows outward from center.
  Maximum voltage drop is half compared to single-end.
```

### Star Topology (Large Installations)

For installations with many strips (room perimeter, ceiling grid):

```
                    Power Supply
                    (5V, 60A)
                         |
           +------+------+------+------+
           |      |      |      |      |
        Strip1  Strip2  Strip3  Strip4  Strip5
        (5m)    (5m)    (5m)    (5m)    (5m)

  Each strip gets its own power feed directly from the PSU.
  Use heavy wire (12-14 AWG) from PSU to each strip.
  No strip-to-strip power connection needed.
```

---

## Wire Gauge Selection

### Current Capacity by AWG

| AWG | Diameter (mm) | Resistance (ohm/m) | Max Current (chassis) | Typical LED Use |
|-----|--------------|--------------------|-----------------------|----------------|
| 28 | 0.32 | 0.213 | 1.4A | Signal wires only |
| 24 | 0.51 | 0.084 | 3.5A | Short tap wires (< 15cm) |
| 22 | 0.64 | 0.053 | 5A | Tap wires, short runs |
| 20 | 0.81 | 0.033 | 7.5A | Strip-to-strip connections |
| 18 | 1.02 | 0.021 | 10A | Individual strip feeds (< 2m) |
| 16 | 1.29 | 0.013 | 15A | Power bus (< 3m) |
| 14 | 1.63 | 0.008 | 20A | Main power bus |
| 12 | 2.05 | 0.005 | 25A | Heavy installations |

### Voltage Drop in Feed Wires

```
V_drop = I * R_wire * 2    (x2 because current flows there AND back)

Example: 5A through 2 meters of 18 AWG wire
  V_drop = 5 * 0.021 * 2 * 2 = 0.42V
  That's 8.4% of a 5V supply!

Same example with 14 AWG:
  V_drop = 5 * 0.008 * 2 * 2 = 0.16V (3.2%)
```

> **SAFETY WARNING:** Undersized wires carrying high current generate heat. In enclosed spaces (behind walls, in channels), this heat cannot dissipate and poses a fire risk. Always use wire rated for the maximum current of your installation, not the typical operating current. LED strips often operate at 20-30% brightness on average, but the wiring must handle 100% load.

### Wire Gauge Selection Guide

| Current | Run < 1m | Run 1-3m | Run 3-5m | Run 5-10m |
|---------|---------|---------|---------|----------|
| 2A | 24 AWG | 22 AWG | 20 AWG | 18 AWG |
| 5A | 22 AWG | 20 AWG | 18 AWG | 16 AWG |
| 10A | 20 AWG | 18 AWG | 16 AWG | 14 AWG |
| 20A | 18 AWG | 16 AWG | 14 AWG | 12 AWG |
| 30A+ | 16 AWG | 14 AWG | 12 AWG | 10 AWG |

---

## Capacitor Placement

### Input Capacitor at Power Supply

Every LED strip installation should have a bulk capacitor across the power input:

```
  PSU 5V ----+----[====]----+---- Strip 5V
             |   1000uF 10V |
  PSU GND ---+----[====]----+---- Strip GND

  Purpose: Absorbs inrush current at power-on,
  smooths voltage dips during high-current effects.
```

**Sizing:** 1000 uF per 5m of strip, minimum. Use a capacitor rated for at least 2x the supply voltage (10V for 5V supply, 25V for 12V supply).

> **CAUTION — Capacitor Polarity:** Electrolytic capacitors are polarized. The negative lead (shorter leg, marked with a stripe) must connect to ground. Installing an electrolytic capacitor backwards will cause it to heat rapidly and can result in violent rupture, spraying hot electrolyte. Always verify polarity before applying power.

### Per-Strip Decoupling

For multiple strips in a star topology, add a 100-470 uF capacitor at the start of each strip:

```
  Bus 5V ---+---[100uF]---+--- Strip start
            |              |
  Bus GND --+--------------+--- Strip start GND
```

### Data Line Resistor

A 220-470 ohm resistor in series with the data line, placed close to the first LED, dampens signal reflections:

```
  MCU GPIO ---[330R]----> Strip DIN

  Without this resistor, signal ringing on the data line
  can cause the first LED to misinterpret data bits.
```

This is particularly important with longer wires (> 20cm) between the MCU and the first LED. The [WS2812B Protocol](m3-ws2812b-protocol.md) page covers data signal integrity in detail.

---

## Complete Wiring Example: 5m WS2812B Installation

### Bill of Materials

| Item | Specification | Quantity | Notes |
|------|--------------|----------|-------|
| LED strip | WS2812B 60/m, 5V, IP30 | 5m (1 reel) | 300 LEDs total |
| Power supply | 5V 30A (150W) Mean Well LRS-150-5 | 1 | 120% of 90W max |
| Power wire (bus) | 14 AWG silicone, red + black | 3m each | PSU to strip |
| Tap wire | 20 AWG silicone, red + black | 1m each | Injection points |
| Capacitor | 1000 uF 10V electrolytic | 1 | At PSU output |
| Capacitor | 100 uF 10V electrolytic | 3 | At injection points |
| Resistor | 330 ohm 1/4W | 1 | Data line |
| Level shifter | 74HCT125 | 1 | 3.3V to 5V data |
| Controller | ESP32 (for WLED) | 1 | See [ESP32 LED Control](m2-esp32-led.md) |

### Wiring Diagram

```
                    Mean Well LRS-150-5
                    +-------+-------+
                    | AC IN | 5V DC |
                    |  L N  | + -   |
                    +---+---+---+---+
                        |       |
                [1000uF]+       +
                        |       |
  5V bus (14 AWG) ======+=======+==========================================
                        |       |           |           |
                   [100uF]      |      [100uF]     [100uF]
                        |       |           |           |
  Strip: [=LED0===LED50===LED100===LED150===LED200===LED250===LED299=]
                        |       |           |           |
  GND bus (14 AWG) =====+=======+==========================================

  Data:
  ESP32 GPIO5 ---[330R]---[74HCT125]---> Strip DIN (at LED0)

  Power injection points: LED0, LED100, LED200
  (every 100 LEDs = every ~1.7m)
```

### Connection Method

**Soldering** is the most reliable connection for permanent installations. Use flux-core solder and tin the wire and pad separately before joining.

**Solder-less connectors** (clip-on, screw terminal) work for temporary installations but have higher contact resistance and can work loose with vibration or thermal cycling.

**JST-SM connectors** (the standard LED strip pigtail connector) are adequate for data connections but should not carry more than 3A. For power injection, solder directly to the strip's copper pads.

---

## Troubleshooting Voltage Drop

| Symptom | Cause | Solution |
|---------|-------|----------|
| Far LEDs dimmer than near LEDs | Voltage drop | Add power injection |
| Colors shift from white to yellow/red at end | Blue/green Vf too high for reduced voltage | Power injection |
| Strip works at low brightness but glitches at high | Power supply voltage sags under load | Larger PSU, power injection |
| First few LEDs flicker | Inrush current, no decoupling | Add 1000uF cap at input |
| Random data corruption on long strips | Voltage drop below WS2812B minimum operating voltage (3.5V) | Power injection |
| LEDs work but strip gets very warm | Excessive current through thin traces | Power injection reduces trace current |

---

## 12V vs 24V for Long Runs

For installations where long runs are unavoidable:

```
10m run at 10W/m = 100W total:

At 5V:   20A through traces. Voltage drop with 0.2 ohm/m traces:
         V_drop = (20 * 2.0) / 2 = 20V  (impossible, need injection every meter)

At 12V:  8.33A through traces. Same traces:
         V_drop = (8.33 * 2.0) / 2 = 8.33V  (still bad, inject every 3m)

At 24V:  4.17A through traces. Same traces:
         V_drop = (4.17 * 2.0) / 2 = 4.17V  (manageable, inject at ends)
```

This is why commercial installations use 24V strips whenever possible. For addressable LEDs, the [WS2815](m3-led-libraries.md) provides 12V operation with per-pixel control, significantly reducing power injection needs.

---

## Cross-References

- [WS2812B Protocol](m3-ws2812b-protocol.md) -- Protocol timing and data signal integrity
- [APA102 SPI Protocol](m3-apa102-spi.md) -- Power requirements for SPI-based strips
- [LED Fundamentals](m1-led-fundamentals.md) -- Forward voltage and why color shifts occur
- [Current Drivers](m1-current-drivers.md) -- Power supply sizing at 120%
- [Thermal Management](m1-thermal-management.md) -- Heat from traces and connections
- [WLED Setup](m5-wled-setup.md) -- Complete installation including power wiring
- [Glossary](00-glossary.md) -- AWG, PSU, and other terms

---

*Sources: QuinLED power injection guide (quinled.info), Adafruit NeoPixel Uberguide power section, SparkFun WS2812B hookup guide, Mean Well LRS-150 datasheet, NEC 310 (National Electrical Code for wire ampacity), Wired@Home wire gauge calculator, WLED project wiring documentation.*
