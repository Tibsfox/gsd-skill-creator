# Current-Limiting Resistor Calculations

Every LED circuit needs current limiting. The simplest and most common method is a series resistor. This page covers the math, worked examples, standard resistor values, and the tradeoffs between series and parallel LED configurations.

---

## The Fundamental Formula

The resistor drops the difference between the supply voltage and the LED forward voltage, limiting current to a safe value:

```
R = (Vs - Vf) / If

Where:
  R  = resistance (ohms)
  Vs = supply voltage (V)
  Vf = LED forward voltage (V)
  If = desired LED current (A)
```

This is a direct application of Ohm's Law: the resistor must drop the "excess" voltage (Vs - Vf), and the current through the resistor equals the current through the LED (they are in series).

### Worked Example 1: Single Red LED from 5V

```
Given:
  Vs = 5.0V (USB power)
  Vf = 2.0V (typical red LED)
  If = 15mA (operating at 75% of 20mA max)

R = (5.0 - 2.0) / 0.015
R = 3.0 / 0.015
R = 200 ohms

Nearest standard value: 220 ohms (E12 series)
Actual current: (5.0 - 2.0) / 220 = 13.6mA  (safe, well within spec)
```

### Worked Example 2: Single Blue LED from 3.3V

```
Given:
  Vs = 3.3V (microcontroller logic level)
  Vf = 3.2V (typical blue LED)
  If = 10mA

R = (3.3 - 3.2) / 0.010
R = 0.1 / 0.010
R = 10 ohms
```

This illustrates a problem: the voltage headroom is only 0.1V. A 10-ohm resistor provides almost no regulation. If Vf varies by even 0.05V (which is normal), the current swings wildly. **Rule of thumb:** you need at least 1V of headroom across the resistor for stable operation. For a blue LED, use a 5V supply instead:

```
R = (5.0 - 3.2) / 0.010 = 180 ohms  (much better regulation)
```

---

## Series LED Strings

When LEDs are connected in series, the same current flows through all of them. The formula extends to:

```
R = (Vs - n * Vf) / If

Where:
  n = number of LEDs in series
```

### Worked Example 3: Three White LEDs from 12V

```
Given:
  Vs = 12.0V
  Vf = 3.2V each (white LEDs)
  n  = 3 LEDs
  If = 20mA

Total Vf = 3 x 3.2 = 9.6V
R = (12.0 - 9.6) / 0.020
R = 2.4 / 0.020
R = 120 ohms

Nearest standard: 120 ohms (available in E12)
```

### Maximum LEDs in Series

The maximum number of LEDs in a series string is limited by the supply voltage:

```
n_max = floor((Vs - V_headroom) / Vf)

Where V_headroom is the minimum voltage drop across the resistor
(at least 1-2V recommended for stable operation)
```

| Supply | Red (2.0V) | Green (3.2V) | Blue (3.2V) | White (3.2V) |
|--------|-----------|-------------|------------|-------------|
| 5V | 1-2 | 1 | 1 | 1 |
| 9V | 3 | 2 | 2 | 2 |
| 12V | 5 | 3 | 3 | 3 |
| 24V | 10-11 | 6-7 | 6-7 | 6-7 |

Commercial 12V LED strips use this principle. A typical white 12V strip has groups of **3 LEDs + 1 resistor** in series, with these groups connected in parallel across the strip. This is why you can cut 12V strips every 3 LEDs.

---

## Parallel LED Branches

> **SAFETY WARNING:** Never connect LEDs directly in parallel without individual current-limiting resistors on each branch. Manufacturing Vf variation will cause current hogging -- the LED with the lowest Vf will attempt to carry all the current, overheat, and fail.

### Why Parallel LEDs Need Individual Resistors

Consider two LEDs in parallel, one with Vf = 1.95V and one with Vf = 2.05V:

```
Without individual resistors (DANGEROUS):
         R (shared)
  5V ---/\/\/---+--- LED1 (Vf=1.95V) --- GND
                |
                +--- LED2 (Vf=2.05V) --- GND

  At the junction, voltage must be the same for both LEDs.
  If junction = 2.0V:
    LED1 has 0.05V "excess" --> draws much more current (exponential!)
    LED2 is slightly below Vf --> draws almost no current
  Result: LED1 overloaded, LED2 barely lit.
```

```
With individual resistors (CORRECT):
         R1
  5V ---/\/\/--- LED1 (Vf=1.95V) --- GND
    |    R2
    +---/\/\/--- LED2 (Vf=2.05V) --- GND

  Each resistor independently limits current regardless of Vf variation.
  LED1: I = (5.0 - 1.95) / 220 = 13.9mA
  LED2: I = (5.0 - 2.05) / 220 = 13.4mA
  Difference: only 0.5mA -- stable and safe.
```

---

## Standard Resistor Values: E12 and E24 Series

Resistors come in standard value series. The E12 series has 12 values per decade, and E24 has 24 values per decade. When your calculation gives a non-standard value, round **up** to the next standard value (this reduces current slightly, which is always the safe direction).

### E12 Series (12 values per decade, +/-10% tolerance)

```
1.0  1.2  1.5  1.8  2.2  2.7  3.3  3.9  4.7  5.6  6.8  8.2

Multiply by powers of 10:
  10   12   15   18   22   27   33   39   47   56   68   82
  100  120  150  180  220  270  330  390  470  560  680  820
  1K   1.2K 1.5K 1.8K 2.2K 2.7K 3.3K 3.9K 4.7K 5.6K 6.8K 8.2K
  10K  ...
```

### E24 Series (24 values per decade, +/-5% tolerance)

```
1.0  1.1  1.2  1.3  1.5  1.6  1.8  2.0  2.2  2.4  2.7  3.0
3.3  3.6  3.9  4.3  4.7  5.1  5.6  6.2  6.8  7.5  8.2  9.1
```

### Quick Reference: Common LED Resistor Values

| Supply | LED Color (Vf) | Target mA | Calculated R | Nearest E12 | Actual mA |
|--------|---------------|-----------|-------------|-------------|-----------|
| 3.3V | Red (2.0V) | 10 | 130 | 150 | 8.7 |
| 5V | Red (2.0V) | 15 | 200 | 220 | 13.6 |
| 5V | Green (3.2V) | 10 | 180 | 180 | 10.0 |
| 5V | Blue (3.2V) | 10 | 180 | 180 | 10.0 |
| 5V | White (3.2V) | 15 | 120 | 120 | 15.0 |
| 9V | Red (2.0V) | 15 | 467 | 470 | 14.9 |
| 12V | Red (2.0V) x3 | 20 | 300 | 330 | 18.2 |
| 12V | White (3.2V) x3 | 20 | 120 | 120 | 20.0 |
| 12V | Blue (3.2V) x3 | 20 | 120 | 120 | 20.0 |

---

## Power Dissipation in Resistors

The resistor converts excess voltage to heat. You must verify that the resistor's power rating is sufficient:

```
P = (Vs - Vf)^2 / R
  = If^2 * R
  = (Vs - Vf) * If
```

### Worked Example 4: Power Check

```
Given: 12V supply, 3 red LEDs in series (Vf = 6.0V total), R = 270 ohms

P = (12.0 - 6.0)^2 / 270
P = 36 / 270
P = 0.133W

A standard 1/4W (0.25W) resistor is sufficient.
A 1/8W (0.125W) resistor would be marginal -- avoid.
```

### Power Rating Selection Guide

| Dissipation | Minimum Rating | Recommended Rating |
|-------------|---------------|-------------------|
| < 0.125W | 1/8W (0.125W) | 1/4W (0.25W) |
| 0.125-0.25W | 1/4W (0.25W) | 1/2W (0.5W) |
| 0.25-0.5W | 1/2W (0.5W) | 1W |
| 0.5-1W | 1W | 2W |
| > 1W | Consider a [constant-current driver](m1-current-drivers.md) instead |

When power dissipation exceeds about 0.5W, a resistor is wasting significant energy as heat. At this point, a constant-current LED driver becomes more efficient. See [Current Drivers](m1-current-drivers.md).

---

## Voltage Headroom and Regulation Quality

The resistor only regulates well when it has enough voltage to drop. The "regulation ratio" shows how well a resistor controls current despite supply voltage variation:

```
Regulation ratio = V_resistor / Vs

Where V_resistor = Vs - Vf
```

| Scenario | Vs | Vf | V_resistor | Ratio | Regulation |
|----------|----|----|-----------|-------|------------|
| Red LED from 12V | 12V | 2.0V | 10.0V | 83% | Excellent |
| Red LED from 5V | 5V | 2.0V | 3.0V | 60% | Good |
| Blue LED from 5V | 5V | 3.2V | 1.8V | 36% | Acceptable |
| Blue LED from 3.3V | 3.3V | 3.2V | 0.1V | 3% | Terrible |

As a guideline: aim for at least 20% regulation ratio. Below this, supply voltage ripple and temperature drift will cause visible brightness variation. For critical applications, use a [constant-current driver](m1-current-drivers.md) instead of a resistor.

---

## Interactive Calculation Method

When designing an LED circuit, follow this checklist:

1. **Determine supply voltage** (Vs): What power source are you using?
2. **Look up forward voltage** (Vf): Check the LED datasheet. Use the typical value, not min or max.
3. **Choose operating current** (If): 50-70% of rated max for longevity.
4. **Calculate resistance**: R = (Vs - n*Vf) / If
5. **Round up** to nearest E12/E24 standard value
6. **Verify actual current**: If = (Vs - n*Vf) / R_actual
7. **Check power dissipation**: P = (Vs - n*Vf) * If. Select appropriate resistor wattage.
8. **Check headroom**: Is (Vs - n*Vf) at least 1V? If not, consider a different supply voltage.

### Worked Example 5: Full Design Walkthrough

**Goal:** Drive 4 green LEDs from a 24V supply for an indicator panel.

```
Step 1: Vs = 24V
Step 2: Green LED Vf = 3.0V typical (InGaN, check datasheet)
Step 3: If = 12mA (60% of 20mA max)
Step 4: R = (24 - 4 x 3.0) / 0.012 = (24 - 12) / 0.012 = 12 / 0.012 = 1000 ohms
Step 5: 1K ohm is a standard E12 value -- use it directly
Step 6: Actual If = (24 - 12) / 1000 = 12mA (exact match)
Step 7: P = 12 x 0.012 = 0.144W -- use 1/4W resistor
Step 8: Headroom = 12V (50% ratio) -- excellent regulation
```

---

## Special Cases

### PWM-Driven LEDs

When an LED is driven by a microcontroller PWM output, the resistor calculation uses the **high-level output voltage** of the MCU pin, not the supply rail:

```
For Arduino (5V logic, VOH ~ 4.2V under load):
  R = (4.2 - Vf) / If

For 3.3V MCU (VOH ~ 2.8V under load):
  R = (2.8 - Vf) / If
```

Most MCU GPIO pins can source 10-25mA. Driving LEDs directly from a GPIO pin at 10mA with a resistor is fine for indicators. For higher-power LEDs, use a MOSFET as a switch. See [Arduino LED Control](m2-arduino-led-control.md) for PWM examples.

### Bi-Color LEDs

Bi-color LEDs have two dies wired in inverse parallel. Polarity determines color. Calculate the resistor for the color with the **lower** Vf (which will draw more current), then accept that the other color will be slightly dimmer.

### LED Arrays with Mixed Colors

If you must mix colors in a series string (not recommended), each LED drops its own forward voltage:

```
R = (Vs - Vf_red - Vf_green - Vf_blue) / If
R = (12 - 2.0 - 3.2 - 3.2) / 0.015
R = 3.6 / 0.015 = 240 ohms --> 270 ohms (E12)
```

---

## Common Mistakes

1. **Using the max Vf instead of typical** -- Results in too-small resistor for typical LEDs in the batch
2. **Forgetting to account for multiple LEDs in series** -- Use n*Vf, not just Vf
3. **Sharing one resistor across parallel LEDs** -- Always one resistor per branch
4. **Ignoring power rating** -- A 1/8W resistor in a 0.5W application will overheat and eventually fail
5. **Not leaving headroom** -- Less than 1V across the resistor means poor current regulation
6. **Using voltage dividers for LED current limiting** -- Voltage dividers are designed for high-impedance loads; LED current changes the divider ratio unpredictably

---

## Cross-References

- [LED Fundamentals](m1-led-fundamentals.md) -- Forward voltage by color, I-V curve behavior
- [Constant-Current Drivers](m1-current-drivers.md) -- When resistors are not enough
- [Thermal Management](m1-thermal-management.md) -- Heat dissipation in high-power circuits
- [Arduino LED Control](m2-arduino-led-control.md) -- PWM dimming with GPIO and resistors
- [Power Injection](m3-power-injection.md) -- Voltage drop and wire gauge for LED strips
- [Glossary](00-glossary.md) -- Terms and definitions

---

*Sources: SparkFun LED Resistor Calculator, Adafruit LED tutorial, Vishay resistor application notes, IEC 60063 (standard number series for resistors).*
