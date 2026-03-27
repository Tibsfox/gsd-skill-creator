# LED Strip Power Supply Selection

Choosing the right power supply is as important as choosing the right LED strip. An undersized supply causes voltage sag, color shift, and premature failure. An oversized supply wastes money and cabinet space. This page covers voltage selection (12V vs 24V), supply types, sizing calculations, multi-strip topologies, and ripple effects on LED flicker. All recommendations here apply to the low-voltage DC side only.

> **SAFETY WARNING:** Power supplies connect to mains AC voltage. Selection and sizing is covered here, but physical installation and mains wiring must be performed by a licensed electrician. Never open or modify a mains-connected power supply.

---

## 1. Voltage Selection: 12V vs 24V

### 1.1 Why It Matters

LED strips come in 12V and 24V variants. The voltage choice affects maximum run length, wire gauge requirements, current draw, and voltage drop behavior. Higher voltage means lower current for the same power, which reduces resistive losses in wiring and connectors.

### 1.2 Comparison Table

| Parameter | 12V Strip | 24V Strip |
|-----------|-----------|-----------|
| Current at 60W | 5.0A | 2.5A |
| Voltage drop per meter (18 AWG) | 0.11V/m at 5A | 0.055V/m at 2.5A |
| Max single-end run (5% drop) | ~3m at 5A/m | ~6m at 2.5A/m |
| Cuttable segment | Every 3 LEDs | Every 6 LEDs |
| MOSFET selection | Same (V_DS rated 55V+) | Same |
| Common power supplies | Widely available | Widely available |
| Component voltage ratings | 16V+ capacitors | 35V+ capacitors |

### 1.3 When to Choose 12V

- Short runs under 3 meters
- Hobbyist projects where 12V components are on hand
- Applications requiring fine cut-point granularity (every 3 LEDs vs every 6)
- Automotive and marine systems that already run on 12V DC

### 1.4 When to Choose 24V

- Runs longer than 3 meters without power injection
- Multi-strip installations where total current draw is high
- Commercial or architectural lighting where wire gauge and conduit matter
- Reducing total system current to use thinner wires in constrained paths

### 1.5 Voltage Drop Calculation

Voltage drop along a copper strip causes LEDs at the far end to receive less voltage, resulting in dimmer output and color shift (warm white shifts cooler, RGB strips lose red first because red LEDs have the lowest forward voltage).

```
Voltage drop formula:
  V_drop = I * R_wire * L

Where:
  I      = current through the run (amps)
  R_wire = resistance per meter of the strip's copper traces (ohm/m)
  L      = length of the run (meters)

Typical strip trace resistance:
  12V strip, 60 LED/m: ~0.4 ohm/m for the power traces
  24V strip, 60 LED/m: ~0.4 ohm/m (same copper, half the current)

Example: 5m of 12V strip at 1A/m (5A total, single-end feed):
  V_drop at far end = 5A * 0.4 ohm/m * 5m = 10V drop
  Only 2V at the last LEDs — they will barely glow

This is why power injection is essential for any run over 2-3 meters.
See power injection strategies in detail at the cross-reference below.
```

---

## 2. Power Supply Types

### 2.1 Enclosed Switching Supplies (Mean Well LRS Series)

The Mean Well LRS series is the most common enclosed supply for LED projects. Metal case with ventilation holes, screw terminals for input and output, and a built-in potentiometer for output voltage adjustment.

```
  +------------------------------------------+
  |  MEAN WELL LRS-150-12                    |
  |                                          |
  |  Input: 85-264 VAC  |  Output: 12V 12.5A|
  |                      |  150W             |
  |  [AC L] [AC N] [GND] | [V+] [V+] [V-] [V-]
  +------------------------------------------+
      ^                       ^
      |                       |
   MAINS SIDE              DC SIDE
   (electrician only)      (user connects)
```

| Model | Voltage | Current | Wattage | Size (mm) | Cost |
|-------|---------|---------|---------|-----------|------|
| LRS-50-12 | 12V | 4.2A | 50W | 159x97x30 | $12-15 |
| LRS-100-12 | 12V | 8.5A | 100W | 159x97x30 | $15-20 |
| LRS-150-12 | 12V | 12.5A | 150W | 159x97x30 | $18-22 |
| LRS-200-24 | 24V | 8.8A | 200W | 215x115x30 | $22-28 |
| LRS-350-24 | 24V | 14.6A | 350W | 215x115x30 | $30-38 |

**Pros:** Low cost, high efficiency (89-91%), adjustable output voltage (±10%), UL/CE/CB certified, widely available.

**Cons:** Not weatherproof (indoor use only), requires separate enclosure for dust/moisture, exposed screw terminals.

### 2.2 Weatherproof Supplies (Mean Well HLG Series)

The HLG series is a potted, IP65/IP67-rated supply designed for outdoor LED installations. Fully sealed aluminum case with flying leads or screw terminals.

| Model | Voltage | Current | Wattage | IP Rating | Cost |
|-------|---------|---------|---------|-----------|------|
| HLG-60H-12 | 12V | 5A | 60W | IP67 | $30-40 |
| HLG-120H-24 | 24V | 5A | 120W | IP67 | $45-55 |
| HLG-240H-24 | 24V | 10A | 240W | IP67 | $65-80 |

**Pros:** Outdoor rated, thermally potted (excellent heat dissipation), built-in PFC (power factor correction), dimmable variants available (suffix A/B/AB).

**Cons:** 2-3x cost of enclosed supplies, larger form factor, no voltage adjustment on standard models.

### 2.3 Open-Frame Supplies

Open-frame supplies are bare PCBs with no enclosure. They are intended for integration into a larger product enclosure.

**Use case:** Building a custom LED controller box where the supply is mounted inside your own enclosure.

**Warning:** Open-frame supplies expose mains-voltage components on the PCB. They must always be mounted inside a properly grounded enclosure with no user access to the exposed side.

### 2.4 Desktop Adapters (Wall-Wart Style)

For small projects under 60W, a desktop adapter with a barrel jack or screw terminal output is the simplest option. Pre-certified, fully insulated, and plug-and-play.

| Output | Current | Wattage | Connector | Cost |
|--------|---------|---------|-----------|------|
| 12V | 3A | 36W | 5.5x2.1mm barrel | $8-12 |
| 12V | 5A | 60W | Screw terminal | $12-18 |
| 24V | 2.5A | 60W | Screw terminal | $12-18 |

**Pros:** No mains wiring required (just plug into wall outlet), fully insulated, UL/CE certified.

**Cons:** Limited to ~60W, bulky, cable length limits placement.

---

## 3. Sizing Calculations

### 3.1 The 1.2x Safety Margin Rule

Never run a power supply at 100% rated capacity. Heat generation increases exponentially near maximum load, shortening supply life and reducing reliability. Always apply a minimum 1.2x (20%) safety margin.

```
Required PSU capacity = Total strip wattage x 1.2

Example: Two 5m strips at 14.4W/m each:
  Total wattage = 2 x 5m x 14.4W/m = 144W
  Required PSU  = 144W x 1.2 = 172.8W
  Select:         LRS-200-12 (200W) or LRS-200-24 (200W)
```

### 3.2 Common Strip Wattage Ratings

| Strip Type | LED/m | Wattage/m (12V) | Wattage/m (24V) |
|-----------|-------|-----------------|-----------------|
| 2835 Standard | 60 | 4.8W | 4.8W |
| 2835 High Density | 120 | 9.6W | 9.6W |
| 5050 RGB | 60 | 14.4W | 14.4W |
| 5050 RGBW | 60 | 18W | 18W |
| 2835 COB | 528 | 14W | 14W |
| WS2812B (addressable) | 60 | 18W (max) | N/A |
| SK6812 RGBW | 60 | 18W (max) | N/A |

**Note:** Addressable strips draw maximum power only when all LEDs are white at full brightness. Typical usage draws 30-50% of rated maximum. Size the PSU for the maximum case.

### 3.3 Worked Example: Kitchen Under-Cabinet Lighting

```
Installation:
  4 strips, each 1.2m long
  2835 High Density (120 LED/m), 24V, 9.6W/m
  Warm white (3000K), maximum brightness needed

Step 1: Total wattage
  4 x 1.2m x 9.6W/m = 46.08W

Step 2: Apply safety margin
  46.08W x 1.2 = 55.3W

Step 3: Select PSU
  HLG-60H-24 (60W, 24V, 2.5A) — fits with headroom
  Or desktop adapter: 24V 3A (72W) — simpler installation

Step 4: Verify current
  55.3W / 24V = 2.3A — within PSU rating of 2.5A
```

### 3.4 Addressable Strip Sizing

Addressable strips like WS2812B and SK6812 have variable current draw depending on the displayed pattern. The absolute worst case (all LEDs full white at 255,255,255) draws approximately 60mA per LED:

```
WS2812B worst case:
  60 LED/m x 60mA/LED = 3.6A/m at 5V
  For 5m strip: 300 LEDs x 60mA = 18A at 5V (90W)

Realistic usage (colorful animations, not full white):
  Average ~20mA/LED = 6A for 300 LEDs (30W)

PSU sizing should use the worst case:
  90W x 1.2 = 108W
  Select: 5V 25A supply (125W)
```

See [Power Injection & Strip Wiring](m3-power-injection.md) for injection point placement when driving long addressable strips, and [WLED Firmware Setup](m5-wled-setup.md) for software-based current limiting that prevents accidental full-white draws.

---

## 4. Multi-Strip Wiring Topologies

### 4.1 Star Topology (Recommended)

In a star topology, each strip has its own dedicated wire pair running directly back to the power supply. All wire pairs originate from the same PSU output terminals.

```
                    +------ [Strip 1] ------+
                    |                        |
  PSU [V+]----+----+------ [Strip 2] ------+----[V-] PSU
              |    |                        |    |
              |    +------ [Strip 3] ------+    |
              |    |                        |    |
              |    +------ [Strip 4] ------+    |
              |                                  |
              +----------------------------------+
                   Common ground bus

  Each strip gets its own V+ and V- wires back to the PSU.
  Wire gauge sized for individual strip current only.
  Fault in one run does not affect others.
```

**Advantages:**
- Each strip receives full voltage regardless of other strips' loads
- A short or fault on one strip does not affect others
- Wire gauge is sized for individual strip current (thinner wires per run)
- Easiest to troubleshoot

**Disadvantages:**
- More total wire required (each run goes all the way back to PSU)
- PSU terminal block may need bus bars for many connections

### 4.2 Daisy-Chain Topology (Use with Caution)

In a daisy chain, power jumps from one strip to the next. The first strip carries current for all downstream strips.

```
  PSU [V+]----[Strip 1]----[Strip 2]----[Strip 3]----[Strip 4]
  PSU [V-]----[Strip 1]----[Strip 2]----[Strip 3]----[Strip 4]

  Wire between PSU and Strip 1 carries current for ALL 4 strips.
  Wire between Strip 3 and Strip 4 carries current for Strip 4 only.
```

**Disadvantages:**
- The first wire segment carries the cumulative current of all strips
- Voltage drop accumulates: Strip 4 receives the lowest voltage
- A fault in Strip 2 takes down Strips 3 and 4
- Wire gauge for the first segment must handle total system current

**When acceptable:** Short runs (<1m between strips) with low current (<2A total).

### 4.3 Hybrid: Star + Injection

For long addressable strips, combine star-topology power with daisy-chained data:

```
  PSU [V+]----+--------+---------+---------+
              |        |         |         |
           [inject] [inject]  [inject]  [inject]
              |        |         |         |
  Data in --->===Strip (continuous, 5m)=====>
              |        |         |         |
  PSU [V-]----+--------+---------+---------+

  Power: star injection every 1-1.5m
  Data: single daisy chain from controller
```

This is the standard architecture for WLED installations. See [Power Injection & Strip Wiring](m3-power-injection.md) for injection spacing calculations.

---

## 5. Power Supply Ripple and LED Flicker

### 5.1 What Is Ripple?

A switching power supply converts AC mains to DC output through high-frequency switching (typically 50-200 kHz). The output is filtered but retains a small AC component called ripple. Ripple is specified as millivolts peak-to-peak (mVpp).

```
  Ideal DC output:  ___________________________________
                    12.00V

  Actual output:    ⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇
                    12.00V ± ripple

  Mean Well LRS-150-12 specified ripple: 120 mVpp
  That is ±60mV around nominal, or ±0.5% of 12V
```

### 5.2 Ripple Effect on LED Brightness

LEDs are current-driven devices. Small voltage ripple translates to current ripple, which causes brightness modulation. For resistor-biased LEDs, the relationship is:

```
LED current ripple = V_ripple / (R_series + R_dynamic)

Where:
  V_ripple   = PSU ripple voltage (peak-to-peak)
  R_series   = series current-limiting resistor
  R_dynamic  = LED dynamic resistance (~5-20 ohm for typical LEDs)

Example: 120mVpp ripple, 150 ohm series resistor, 10 ohm LED:
  I_ripple = 0.120V / (150 + 10) = 0.75 mA
  If DC operating current = 20 mA, ripple is 3.75%
  Visible? No — the ripple frequency (100-200 kHz) is far above CFF
```

### 5.3 When Ripple Matters

Ripple becomes problematic when:

1. **Low-frequency ripple (100/120 Hz):** Some cheap supplies have inadequate output filtering, allowing mains frequency (50/60 Hz) rectification ripple to pass through. This is visible as 100/120 Hz flicker. Quality supplies (Mean Well LRS, HLG) have negligible low-frequency ripple.

2. **PWM dimming interaction:** If the PSU ripple frequency is close to the PWM frequency, beat frequencies can produce visible flicker at the difference frequency. This is rare in practice because PWM frequencies (1-25 kHz) are well separated from switching frequencies (50-200 kHz).

3. **Camera/video capture:** High-speed cameras can detect ripple frequencies that are invisible to the eye. For video production lighting, use supplies with <50 mVpp ripple or add additional output filtering.

### 5.4 Adding Output Filtering

If the stock supply ripple is insufficient, add an LC filter to the output:

```
  PSU [V+] ---[L1 10uH]---+--- To LED strip [V+]
                           |
                      [C1 1000uF 25V]
                           |
  PSU [V-] ----------------+--- To LED strip [V-]

  L1: Inductor (10-100 uH, rated for full load current)
  C1: Electrolytic capacitor (1000-4700 uF)

  This forms a low-pass filter that attenuates switching ripple.
  Cutoff frequency: f = 1 / (2*pi*sqrt(L*C))
  10uH + 1000uF: f = 1.59 kHz — passes DC, blocks >10 kHz ripple
```

> **CAUTION -- Capacitor Polarity:** Electrolytic filter capacitors on PSU outputs are polarized. Reversed polarity causes rapid heating and potential rupture. The negative lead (marked with a stripe on the capacitor body) must connect to V- (ground). Always verify polarity before applying power.

---

## 6. Connecting Multiple Power Supplies

### 6.1 When You Need Multiple PSUs

Large installations may exceed the capacity of a single power supply. For example, 20 meters of 5050 RGB strip at 14.4W/m = 288W. Rather than sourcing a single 350W supply, you can use two 150W supplies.

### 6.2 Common Ground Requirement

When using multiple PSUs to power different sections of the same LED strip (or strips sharing a common data line), the PSU outputs must share a common ground (V- connected together). Without a common ground, voltage references differ between sections, causing data signal corruption and potential damage to addressable LED ICs.

```
  PSU A                              PSU B
  [V+A]---[Strip Section 1]         [V+B]---[Strip Section 2]
  [V-A]---+                         [V-B]---+
           |                                 |
           +---------------------------------+
                   Common Ground Bus
                   (heavy gauge wire)
```

### 6.3 Never Connect V+ Outputs Together

Connecting the V+ outputs of two PSUs in parallel is dangerous unless the supplies are specifically designed for current sharing (e.g., Mean Well models with parallel function, suffix P). Without active current sharing circuitry, small voltage differences between the two supplies cause one to source all the current while the other tries to sink it, potentially damaging both.

```
  WRONG — Do not do this:
  PSU A [V+] ---+--- Load
  PSU B [V+] ---+

  If PSU A outputs 12.05V and PSU B outputs 11.95V,
  PSU A drives current INTO PSU B through the load.
  PSU B's output stage sinks this current — exceeding design limits.
```

### 6.4 Correct Multi-PSU Architecture

Each PSU powers its own dedicated section of strip. The common ground provides the shared voltage reference for data signals.

```
  PSU A                    PSU B
  [V+A]--[Strip 1-10m]    [V+B]--[Strip 11-20m]
  [V-A]--+                [V-B]--+
          |                       |
          +---Common GND Bus------+

  Data line: Controller -> Strip 1 -> Strip 2 (continuous)
  Power: Each PSU feeds only its own strip section
  Ground: All PSUs share a common ground bus
```

---

## 7. Wire Gauge Selection

### 7.1 Wire Gauge Table

Select wire gauge based on the current carried and the acceptable voltage drop. For LED strips, keep voltage drop under 5% of the supply voltage (0.6V for 12V, 1.2V for 24V).

| AWG | Diameter (mm) | Resistance (ohm/m) | Max Current (chassis) | V Drop at 5A per meter |
|-----|--------------|--------------------|-----------------------|----------------------|
| 22 | 0.64 | 0.053 | 5A | 0.265V |
| 20 | 0.81 | 0.033 | 7A | 0.167V |
| 18 | 1.02 | 0.021 | 10A | 0.105V |
| 16 | 1.29 | 0.013 | 13A | 0.066V |
| 14 | 1.63 | 0.008 | 17A | 0.042V |
| 12 | 2.05 | 0.005 | 23A | 0.026V |

### 7.2 Worked Example

```
Scenario: 12V strip, 5A total draw, PSU is 4 meters from strip
  (wire run = 4m each way = 8m total round trip)

Using 18 AWG:
  V_drop = 5A x 0.021 ohm/m x 8m = 0.84V
  Percentage: 0.84V / 12V = 7.0% — EXCEEDS 5% threshold

Using 16 AWG:
  V_drop = 5A x 0.013 ohm/m x 8m = 0.52V
  Percentage: 0.52V / 12V = 4.3% — ACCEPTABLE

Using 14 AWG:
  V_drop = 5A x 0.008 ohm/m x 8m = 0.32V
  Percentage: 0.32V / 12V = 2.7% — GOOD

Select 16 AWG minimum for this installation.
```

---

## 8. PSU Certification and Safety

### 8.1 Required Certifications

Any power supply connected to mains AC must carry recognized safety certifications. Look for these marks on the supply label:

| Mark | Region | Meaning |
|------|--------|---------|
| UL | North America | Underwriters Laboratories safety tested |
| CSA | Canada | Canadian Standards Association |
| CE | Europe | Conformite Europeenne (self-declared conformity) |
| CB | International | IECEE test report scheme |
| TUV | Germany/Europe | Independent safety testing |
| CCC | China | China Compulsory Certification |

**Mean Well supplies** carry UL, CE, and CB certifications on their standard product lines. This is one reason they dominate the LED supply market.

### 8.2 What Certification Means

Certification verifies:
- Input/output isolation meets creepage and clearance distances
- No single component failure causes electric shock or fire
- Temperature rise of internal components stays within limits
- EMI/EMC emissions comply with regional standards
- The supply has been tested to its rated specifications

### 8.3 Cheap Uncertified Supplies

Unbranded supplies from marketplace sellers often lack genuine certification. Some counterfeit the UL or CE marks. These supplies may:
- Have inadequate input/output isolation (shock hazard)
- Use undersized transformers that overheat under load
- Lack proper overcurrent protection (fire hazard)
- Produce excessive ripple or noise
- Fail prematurely under continuous operation

For any installation that will be unattended (permanent lighting), always use a supply from a reputable manufacturer with verifiable certification.

---

## 9. Overcurrent Protection

### 9.1 Fusing the DC Output

Even with a certified PSU, a short circuit on the DC wiring can cause fires if the wire heats up before the PSU's internal overcurrent protection trips. Add an inline fuse on the V+ output:

```
  PSU [V+] ---[Fuse]--- Distribution ---> Strip(s)

  Fuse rating = 1.25 x maximum expected current
  Example: 10A max load -> 12.5A fuse -> use standard 15A fuse

  Fuse types:
    - Blade fuse (automotive, cheap, easy to replace)
    - Glass tube fuse (panel mount, precise rating)
    - PTC resettable fuse (self-resetting after fault clears)
```

### 9.2 Per-Strip Fusing

In multi-strip installations, fuse each strip individually so a fault on one strip does not take down the entire installation:

```
  PSU [V+] ---+---[5A fuse]--- Strip 1
              |
              +---[5A fuse]--- Strip 2
              |
              +---[5A fuse]--- Strip 3
              |
              +---[5A fuse]--- Strip 4
```

---

## 10. Cross-References

- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- MOSFET circuit powered by the PSU selected here
- [WLED Firmware Setup](m5-wled-setup.md) -- software current limiting and PSU configuration in WLED
- [Power Injection & Strip Wiring](m3-power-injection.md) -- injection point spacing and wire routing for long runs
- [IR & RF Remote Control](m5-ir-rf-remote.md) -- remote dimming and switching of PSU-powered strips
- [LED Electronics Fundamentals](m1-led-fundamentals.md) -- Ohm's law, power calculations underlying PSU sizing
- [Thermal Management & Power Design](m1-thermal-management.md) -- heat dissipation in PSU enclosures and LED loads
- [Glossary](00-glossary.md) -- PSU, ripple, voltage drop, safety margin definitions

---

*Sources: Mean Well LRS series datasheet, Mean Well HLG series datasheet, UL 8750 "LED Equipment for Use in Lighting Products", IEC 61347-2-13 "LED driver safety", Adafruit NeoPixel Uberguide (power supply section), QuinLED power supply recommendations, American Wire Gauge (AWG) resistance tables per ASTM B258*
