# Thermal Management & Power Design

Heat is the primary enemy of LED longevity. LEDs do not burn out suddenly like incandescent bulbs -- they gradually lose brightness as the semiconductor junction degrades from prolonged elevated temperatures. Proper thermal management is what separates a 50,000-hour LED installation from one that dims noticeably within a year.

---

## Thermal Runaway: The Positive Feedback Loop

The most dangerous thermal failure mode in LED circuits is **thermal runaway**. It works like this:

```
  LED heats up
       |
       v
  Junction temperature rises
       |
       v
  Forward voltage (Vf) decreases (~2mV per degree C)
       |
       v
  With constant voltage, current INCREASES
  (because Vs - Vf is now larger)
       |
       v
  More current = more heat
       |
       v
  LED heats up further  <------ POSITIVE FEEDBACK LOOP
       |
       v
  Eventually: junction failure, solder reflow, or fire
```

This is why [constant-current drivers](m1-current-drivers.md) are superior to constant-voltage with resistors for high-power LEDs. A constant-current driver holds the current fixed regardless of temperature-induced Vf changes, breaking the feedback loop.

### Temperature Coefficient of Vf

The forward voltage of an LED decreases with temperature. Typical temperature coefficients:

| LED Type | dVf/dT | Vf Change over 50C Rise |
|----------|--------|------------------------|
| Red (AlGaInP) | -2.0 mV/C | -100 mV |
| Green (InGaN) | -2.5 mV/C | -125 mV |
| Blue (InGaN) | -2.5 mV/C | -125 mV |
| White (InGaN + phosphor) | -2.5 mV/C | -125 mV |

For a 12V supply with a 120-ohm resistor driving three white LEDs (Vf = 9.6V nominal at 25C):

```
At 25C:  I = (12 - 9.6) / 120 = 20.0 mA
At 75C:  Vf drops by 3 x 125mV = 0.375V
         I = (12 - 9.225) / 120 = 23.1 mA  (+15.5%)

That 15% current increase causes more heating, which drops Vf further...
```

With a constant-current driver, the current stays at 20mA regardless of temperature. The driver simply reduces its output voltage to compensate.

---

## Junction Temperature and LED Lifetime

LED lifetime is directly related to junction temperature. Every 10C increase in junction temperature roughly halves the useful life of the LED.

### Lifetime vs Junction Temperature (Typical High-Power White LED)

| Junction Temp (Tj) | L70 Lifetime | Relative Lifetime |
|--------------------|--------------|--------------------|
| 65C | 100,000 hours | 4x baseline |
| 85C | 50,000 hours | 2x baseline |
| 105C | 25,000 hours | 1x baseline |
| 120C | 12,000 hours | 0.5x baseline |
| 135C | 6,000 hours | 0.25x baseline |
| 150C (max rated) | 3,000 hours | 0.12x baseline |

**L70** means the time until light output drops to 70% of initial. At 85C junction temperature, a quality LED lasts about 50,000 hours (5.7 years of continuous operation). At 135C, the same LED lasts only 6,000 hours (8 months continuous).

> **SAFETY WARNING:** LED junction temperatures above 150C risk catastrophic failure including desoldering, package cracking, and in enclosed fixtures, potential fire. Always design for junction temperatures below the manufacturer's absolute maximum rating, with at least 20C margin.

---

## Thermal Resistance Model

Heat flows from the LED junction to ambient air through a chain of thermal resistances, analogous to electrical resistance:

```
  Tj (Junction)
    |
    R_jc  (junction to case/pad)  -- determined by LED package
    |
  Tc (Case/Pad)
    |
    R_cs  (case to heatsink)  -- determined by mounting method
    |
  Ts (Heatsink surface)
    |
    R_sa  (heatsink to ambient)  -- determined by heatsink size/airflow
    |
  Ta (Ambient air)

  Tj = Ta + P_heat * (R_jc + R_cs + R_sa)
```

### Thermal Resistance Values

| Component | Symbol | Typical Value | Notes |
|-----------|--------|--------------|-------|
| Cree XP-L (junction to solder pad) | R_jc | 2.5 C/W | High-power LED |
| MCPCB to heatsink (thermal pad) | R_cs | 0.5-2.0 C/W | Depends on interface material |
| MCPCB to heatsink (thermal paste) | R_cs | 0.2-0.5 C/W | Arctic Silver, etc. |
| Small star heatsink (25mm) | R_sa | 12-18 C/W | Natural convection |
| Medium heatsink (50x50mm) | R_sa | 6-10 C/W | Natural convection |
| Large heatsink (100x100mm) | R_sa | 2-4 C/W | Natural convection |
| Fan-cooled heatsink | R_sa | 0.5-2 C/W | Forced convection |

### Worked Example: 3W LED Thermal Design

```
Given:
  LED: Cree XP-L, 3W (700mA x ~4.3V), R_jc = 2.5 C/W
  Heat generated: ~2.4W (LED is ~20% efficient, 80% becomes heat)
  Actually: P_heat = electrical power - optical power
           P_heat = 3W - 0.6W (est 20% efficiency) = 2.4W
  Ambient temperature: 35C (warm room)
  Target Tj: < 105C (for 25,000 hour life)

  Allowed thermal rise: 105 - 35 = 70C
  Total allowed R_th = 70 / 2.4 = 29.2 C/W

  R_jc = 2.5 C/W (LED package, fixed)
  R_cs = 1.0 C/W (thermal pad on MCPCB)
  R_sa = 29.2 - 2.5 - 1.0 = 25.7 C/W (heatsink needed)

  A small 25mm star heatsink (R_sa ~ 15 C/W) is more than adequate.

  Actual Tj = 35 + 2.4 * (2.5 + 1.0 + 15.0) = 35 + 44.4 = 79.4C
  This gives an L70 lifetime of ~60,000+ hours.
```

---

## Heatsink Selection

### Heatsink Types for LEDs

**Star PCBs (MCPCBs)** -- Metal-Core Printed Circuit Boards with a star shape, designed to bolt to a larger heatsink. The aluminum core conducts heat from the LED pad to the mounting surface. Available in 16mm, 20mm, and 25mm diameters for common LED packages.

```
  Star MCPCB (top view):
        ___
       /   \
   ___/     \___
  |  [LED pad]  |
  |   O     O   |  <-- mounting holes
   ---\     /---
       \___/

  Side view:
  +-----------+  Solder mask + copper traces
  |  Aluminum |  1.6mm aluminum core
  +-----------+  Thermal interface layer
  | Heatsink  |  Bolted to heatsink
  |           |
```

**Extruded aluminum heatsinks** -- Finned aluminum profiles that maximize surface area. Available in standard widths (25mm, 50mm, 100mm+). Cut to length as needed.

**PCB copper pours** -- For lower-power SMD LEDs on standard FR4 PCBs, a large copper pour connected to the thermal pad provides adequate heatsinking. Use thermal vias (0.3mm diameter, 1mm pitch) to conduct heat to the opposite side copper plane.

### Thermal Interface Materials

| Material | Thermal Conductivity | R_cs (typical) | Application |
|----------|---------------------|----------------|-------------|
| Bare contact (air gap) | 0.025 W/mK | 5-20 C/W | Never do this |
| Thermal pad (silicone) | 1-5 W/mK | 0.5-2.0 C/W | Easy, forgiving |
| Thermal paste | 2-8 W/mK | 0.2-0.5 C/W | Better performance |
| Thermal adhesive tape | 1-3 W/mK | 1.0-3.0 C/W | Convenient but higher R |
| Solder (direct) | 50 W/mK | < 0.1 C/W | Best, but permanent |

---

## Derating Curves

LED manufacturers provide derating curves showing maximum allowable current vs ambient temperature. As ambient temperature rises, the maximum safe current decreases to keep the junction temperature within limits.

### Typical Derating Example (1W High-Power LED)

```
  Max Current (mA)
  350 |*---------+
      |           \
  300 |            \
      |             \
  250 |              \
      |               \
  200 |                \
      |                 \
  150 |                  \
      |                   \
  100 |                    \
      +----+----+----+----+----
      25   50   75   100  125
           Ambient Temperature (C)
```

At 25C ambient, the LED can run at full 350mA. At 75C ambient (enclosed fixture in summer), derate to approximately 250mA. At 100C ambient (near an oven or engine), derate to 150mA.

### Practical Derating Guidelines

| Installation Environment | Ambient Temp | Derate Factor |
|-------------------------|-------------|---------------|
| Open air, temperature-controlled room | 25C | 1.0 (full rated) |
| Enclosed fixture, ventilated | 40-50C | 0.85 |
| Enclosed fixture, sealed | 50-65C | 0.70 |
| Outdoor, direct sun exposure | 45-60C | 0.75 |
| Industrial, near heat sources | 60-80C | 0.50-0.60 |
| Automotive underhood | 80-105C | 0.30-0.40 |

---

## PCB Thermal Design

### For SMD LEDs on FR4 PCBs

Standard FR4 fiberglass PCB has poor thermal conductivity (0.25 W/mK). To manage heat from SMD LEDs:

1. **Thermal pad connection** -- Connect the LED thermal pad to a copper pour. Most mid-power LEDs (5050, 2835) have an exposed pad on the bottom.

2. **Thermal vias** -- Array of small vias (0.3mm drill) under the thermal pad, connecting top copper to bottom copper pour. Fill with solder or conductive epoxy for best results.

```
  Top view of thermal via pattern:

  +-------------------+
  |  o  o  o  o  o    |
  |  o  o  o  o  o    |    o = thermal via (0.3mm)
  |  o [LED PAD] o    |    Pitch: 1.0-1.2mm
  |  o  o  o  o  o    |
  |  o  o  o  o  o    |
  +-------------------+
        Copper pour
```

3. **Copper pour sizing** -- For a 0.5W LED, provide at least 1 square centimeter of copper on both sides. For a 1W LED, 2-4 square centimeters. For 3W+, use an MCPCB.

### Metal-Core PCBs (MCPCBs)

For LEDs above 1W, MCPCBs are strongly recommended. Instead of FR4, the board substrate is:

- **Aluminum** (most common, 1-2 W/mK board-level conductivity)
- **Copper** (premium, 2-5 W/mK, expensive)

The LED is soldered to the top copper layer, which sits on a thin dielectric layer (0.075-0.15mm), which sits on the aluminum core. Heat flows through the thin dielectric directly into the metal core.

---

## LED Strip Thermal Considerations

LED strips generate less heat per LED than high-power modules, but the total heat across a 5-meter run can be significant:

```
5m of 5050 RGB strip at full white:
  Power: 72W
  Estimated heat: 72W x 0.75 = 54W (LEDs are ~25% efficient in strip form)

  54W spread across 5m = 10.8W/m
```

### Strip Cooling Methods

1. **Aluminum channel mounting** -- Extruded aluminum channels (often called "LED profiles") act as both diffuser mount and heatsink. A good aluminum channel reduces LED temperature by 10-20C compared to adhesive-backed direct mounting.

2. **Adequate spacing** -- Do not stack multiple strip runs directly on top of each other. Allow at least 25mm spacing between parallel runs.

3. **Ventilation** -- Strips in enclosed channels (covered with diffusers) run hotter than open-air strips. Ensure air can circulate through the ends of the channel.

4. **Duty cycle** -- LEDs driven at 50% average brightness (via PWM or color mixing) generate significantly less heat. Most decorative lighting rarely needs full white at full brightness.

> **SAFETY WARNING:** Never exceed the power rating of the adhesive backing on LED strips. Standard 3M VHB tape used on quality strips is rated to about 70-80C. If the strip runs hotter (due to excessive current, stacked runs, or poor ventilation), the adhesive fails and the strip detaches. In overhead installations, this creates a falling hazard.

---

## Thermal Measurement

### Practical Temperature Testing

1. **Infrared thermometer** -- Point-and-shoot temperature measurement. Aim at the LED package or heatsink surface. Set emissivity to 0.90-0.95 for painted/anodized surfaces, 0.10-0.30 for polished aluminum (unreliable without correction).

2. **Thermocouple** -- Attach a K-type thermocouple to the heatsink near the LED with thermal paste or Kapton tape. Read with a multimeter in temperature mode. More accurate than IR for metal surfaces.

3. **Thermal camera** -- Shows the complete thermal profile. FLIR ONE or similar phone-mounted cameras cost $200-400 and are invaluable for identifying hot spots.

### What Temperatures to Expect

| Component | Maximum Safe | Comfortable Range | Alarm Level |
|-----------|-------------|-------------------|-------------|
| LED junction (Tj) | 125-150C | 65-95C | > 110C |
| Heatsink surface | 80-100C | 40-60C | > 70C |
| PCB surface | 80-100C | 35-55C | > 65C |
| LED strip (surface) | 60-70C | 30-45C | > 55C |
| Wire insulation | 80-105C | < 60C | > 70C |

---

## Design Checklist for Thermal Management

1. **Calculate heat dissipation**: P_heat = P_electrical * (1 - efficiency). For indicator LEDs: ~80% heat. For high-power white: ~65-80% heat.
2. **Determine maximum Tj**: From LED datasheet, typically 125-150C. Design for 85-105C.
3. **Calculate thermal budget**: delta_T = Tj_target - Ta_max
4. **Sum thermal resistances**: R_jc (datasheet) + R_cs (interface material) + R_sa (heatsink)
5. **Check**: P_heat * R_total < delta_T? If not, use a bigger heatsink or add forced cooling.
6. **Derate** for enclosed fixtures and high ambient temperatures.
7. **Test**: Measure actual temperatures after 30 minutes of full-power operation. Compare to predictions.

---

## Cross-References

- [LED Fundamentals](m1-led-fundamentals.md) -- Forward voltage, I-V curve, and semiconductor physics
- [Current Drivers](m1-current-drivers.md) -- Driver ICs that prevent thermal runaway
- [Resistor Calculations](m1-resistor-calculations.md) -- Power dissipation in current-limiting resistors
- [Power Injection](m3-power-injection.md) -- Wire gauge and voltage drop for strip installations
- [ESP32 LED Control](m2-esp32-led.md) -- WiFi-connected LED control with thermal monitoring
- [MOSFET PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- MOSFET heat considerations in dimmer circuits

---

*Sources: Cree XP-L thermal design guide, Lumileds LUXEON application note AN-1163, OSRAM LED Fundamentals thermal management whitepaper, Bergquist thermal interface material selection guide, Mean Well LED driver application notes, IPC-2221 PCB design standard (thermal relief).*
