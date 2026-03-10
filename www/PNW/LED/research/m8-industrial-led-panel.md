# Industrial LED Status Panel Design

Industrial LED status panels translate machine states into instantly readable visual signals on the factory floor. From single indicator tower lights on a CNC cell to multi-station production dashboards visible across an entire facility, the design principles are the same: map every machine state to an unambiguous visual pattern, follow IEC color conventions, size the electrical outputs correctly, and ensure the panel survives decades of industrial environment exposure. This page covers tower light selection, color conventions, electrical design, panel layout, wiring, and SCADA/HMI integration.

---

## 1. LED Indicator Tower Lights (Stack Lights)

### 1.1 What They Are

Tower lights (also called signal towers, stack lights, or Andon lights) are vertical columns of colored light modules mounted on top of machines or above production cells. Each color tier can be steady, flashing, or off, communicating machine state at a glance from across the factory floor.

```
  Standard 5-tier tower light:

    +-------+
    | WHITE |  Tier 5: Operator request / information
    +-------+
    | BLUE  |  Tier 4: Communication / special condition
    +-------+
    | GREEN |  Tier 3: Normal operation / running
    +-------+
    | AMBER |  Tier 2: Warning / attention needed
    +-------+
    |  RED  |  Tier 1: Fault / danger / emergency stop
    +-------+
        |
    [Mounting pole]
        |
    [Machine]
```

### 1.2 Common Manufacturers and Models

| Manufacturer | Series | Tiers | LED Type | Voltage | Connection |
|-------------|--------|-------|----------|---------|------------|
| Patlite | LR series | 1-5 | High-brightness LED | 24V DC | M12 connector |
| Werma | KombiSIGN 71 | 1-5 | LED | 24V DC | Terminal block |
| Banner Engineering | TL50 | 1-5 | LED | 12-30V DC | M12 or pigtail |
| Allen-Bradley | 855T | 1-5 | LED | 24V DC | Prewired base |
| Eaton | SL7 | 1-4 | LED | 24V DC | Bayonet mount |

### 1.3 Electrical Specifications

| Parameter | Typical Value |
|-----------|--------------|
| Supply voltage | 24V DC (most common), 12V DC, 120V AC |
| Current per tier | 30-80 mA (LED type) |
| Total current (5 tiers) | 150-400 mA |
| Visibility distance | 15-50 meters (model dependent) |
| Ingress protection | IP54 to IP65 |
| Operating temperature | -20C to 50C |
| Lifespan | 50,000-100,000 hours (LED modules) |
| Mounting | M22 pole mount, direct mount, wall mount |

---

## 2. IEC 60073 Color Conventions

### 2.1 The Standard

IEC 60073 defines the meaning of indicator colors in industrial environments. Following this standard is not optional in professional installations -- operators are trained to react to these colors instinctively.

| Color | IEC 60073 Meaning | Machine State Examples |
|-------|-------------------|----------------------|
| Red | Danger, emergency, fault | E-stop active, safety fault, overcurrent |
| Amber/Yellow | Warning, abnormal, attention | Low material, door open, approaching limit |
| Green | Normal, safe, go | Machine running, cycle in progress, all clear |
| Blue | Mandatory action, communication | Operator input required, maintenance due |
| White | Neutral, information | Power on, system ready, no specific condition |

### 2.2 Blink Patterns and Their Meanings

| Pattern | Meaning | Typical Use |
|---------|---------|------------|
| Steady ON | Condition is active | Machine running (green steady) |
| Slow blink (1 Hz) | Attention needed | Warning condition (amber slow blink) |
| Fast blink (2 Hz) | Urgent attention | Fault requiring immediate response (red fast blink) |
| OFF | Condition is not active | Machine idle, no faults |

### 2.3 State Machine for 3-Color Tower

A standard state machine mapping for a machining center:

```
  Machine State           Red     Amber    Green
  ----------------        -----   ------   ------
  E-Stop Active           STEADY  off      off
  Fault (non-E-Stop)      BLINK   off      off
  Guard Open              off     BLINK    off
  Setup Mode              off     STEADY   off
  Idle / Ready            off     off      STEADY
  Auto Cycle Running      off     off      BLINK
  Cycle Complete          off     off      STEADY
  Material Low            off     BLINK    BLINK

  Priority (highest to lowest):
  E-Stop > Fault > Guard > Setup > Running > Idle
```

---

## 3. Current Calculation and Output Sizing

### 3.1 LED Current Per Indicator

Modern LED indicators draw far less current than their incandescent predecessors, but the aggregate current for a multi-LED panel can still exceed PLC output ratings.

```
  Single LED indicator:
    Forward voltage: 2.0V (red), 2.2V (amber), 3.2V (green), 3.4V (blue)
    Forward current: 20 mA (standard), 30 mA (high-brightness)

  Tower light tier (multiple LEDs in parallel behind diffuser):
    Typical: 40-80 mA at 24V DC (internal current limiting)

  Panel-mount indicator lamp (22mm, LED type):
    Typical: 10-20 mA at 24V DC (internal resistor)
```

### 3.2 PLC Output Module Sizing

PLC digital output modules have per-point and per-module current limits:

```
  Typical transistor output module (16-point):
    Per-point maximum:  0.5A
    Per-common maximum: 2.0A (shared among a group of 4-8 points)
    Module maximum:     4.0A (all points combined)

  LED panel with 24 indicators at 20mA each:
    Total current: 24 x 20mA = 480 mA
    Per-point: 20mA (well within 0.5A limit)
    Module total: 480mA (well within 4.0A limit)

  LED panel with 8 tower tiers at 80mA each:
    Total current: 8 x 80mA = 640 mA
    Per-point: 80mA (well within 0.5A limit)
    Module total: 640mA (well within 4.0A limit)
```

### 3.3 Relay vs Transistor Output for LEDs

| Output Type | Best For | LED Suitability |
|------------|---------|-----------------|
| Relay | High current, mixed AC/DC | Overkill for LEDs; wastes relay life |
| Transistor (sourcing) | 24V DC loads, PNP | Good for LED indicators |
| Transistor (sinking) | 24V DC loads, NPN | Good for LED indicators |

For LED-only panels, transistor output modules are preferred. They switch faster (enabling software-generated blink patterns via the PLC scan cycle), last indefinitely (no mechanical contacts), and cost less per point.

### 3.4 External Driver for High-Power LEDs

If the LED panel includes high-power LED modules (COB LEDs, LED flood panels), use an external driver stage:

```
  PLC Output (0.5A max)                    High-Power LED (1-5A)
  +-------------------+                    +------------------+
  |  Y0 (transistor)  |---[1K]---+        |                  |
  +-------------------+          |        |  COB LED Module  |
                            Gate |        |  (24V, 2A)       |
                                 |        +--------+---------+
                            +----+----+            |
                            | IRLZ44N |            |
                            | N-ch    |---Drain----+
                            | MOSFET  |
                            +----+----+
                                 |
                                GND (Source)
```

See [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) for complete MOSFET driver circuit design, component selection, and thermal management.

---

## 4. Panel Layout Design

### 4.1 8-Station Production Line Status Board

A typical status board for a production line with 8 stations:

```
  +================================================================+
  |                   PRODUCTION LINE STATUS                        |
  |                                                                |
  |  +------+  +------+  +------+  +------+                       |
  |  | STN 1|  | STN 2|  | STN 3|  | STN 4|                       |
  |  |      |  |      |  |      |  |      |                       |
  |  | (G)  |  | (G)  |  | (G)  |  | (G)  |  G = Green (Run)     |
  |  | (Y)  |  | (Y)  |  | (Y)  |  | (Y)  |  Y = Yellow (Warn)   |
  |  | (R)  |  | (R)  |  | (R)  |  | (R)  |  R = Red (Fault)     |
  |  +------+  +------+  +------+  +------+                       |
  |                                                                |
  |  +------+  +------+  +------+  +------+                       |
  |  | STN 5|  | STN 6|  | STN 7|  | STN 8|                       |
  |  |      |  |      |  |      |  |      |                       |
  |  | (G)  |  | (G)  |  | (G)  |  | (G)  |                       |
  |  | (Y)  |  | (Y)  |  | (Y)  |  | (Y)  |                       |
  |  | (R)  |  | (R)  |  | (R)  |  | (R)  |                       |
  |  +------+  +------+  +------+  +------+                       |
  |                                                                |
  |  [LINE TOTAL: __ / 8 Running]    [SHIFT: Day]                |
  |  [PARTS COUNT: ____]              [TIME: 14:32]               |
  +================================================================+

  Panel dimensions: ~600mm x 400mm
  Indicator size: 22mm panel-mount LED
  Legend labels: Engraved or printed, not handwritten
  Enclosure: Steel with window, or polycarbonate front
```

### 4.2 Indicator Spacing and Readability

| Viewing Distance | Minimum Indicator Size | Minimum Spacing |
|-----------------|----------------------|-----------------|
| 3m (at machine) | 16mm | 30mm center-to-center |
| 10m (across cell) | 22mm | 50mm center-to-center |
| 30m (across plant) | 50mm or tower light | 100mm+ or use tower |

### 4.3 Label Standards

- Use engraved nameplates (phenolic or stainless steel) for permanent labels
- Label every indicator with its function (not just color)
- Include station number and signal meaning
- Use consistent abbreviations: RUN, WARN, FLT, E-STOP, RDY
- Font size: minimum 5mm height for labels viewed at 3m

---

## 5. LED Indicator Arrays and PLC Scan Cycle

### 5.1 Direct Drive from PLC Outputs

For panels with fewer than 32 LEDs, connect each indicator directly to a PLC output point. The PLC scan cycle updates all outputs simultaneously at end of scan.

```
  PLC Output Module          LED Panel (inside enclosure)
  +-----------+              +-----------+
  | Y0  (Run1)|----- wire ---|> LED Green (Stn 1)
  | Y1 (Wrn1) |----- wire ---|> LED Yellow (Stn 1)
  | Y2 (Flt1) |----- wire ---|> LED Red (Stn 1)
  | Y3  (Run2)|----- wire ---|> LED Green (Stn 2)
  | ...        |              | ...
  | Y23(Flt8) |----- wire ---|> LED Red (Stn 8)
  +-----------+              +-----------+
       |                          |
      COM -------- 24V DC --------+
```

### 5.2 Blink Generation in PLC Logic

The PLC generates blink patterns using timer instructions. A shared flash generator creates the blink timing, and output rungs AND the flash bit with the LED command:

```
  === Flash Generator (500ms period = 1 Hz blink) ===

     |    Flash_TMR.DN                   TON                |
     +---]/[----------------------------[TON Flash_TMR 500]-+
     |                                                       |
     |    Flash_TMR.DN                   Flash_Bit           |
     +---] [-----------------------------( )----------------+

  === Station 1 LED Outputs ===

     |    Stn1_Run    Stn1_Blink                             |
     +---] [---------]/[--------------( ) Y0 (Green LED)----+
     |                                                       |
     |    Stn1_Run    Stn1_Blink    Flash_Bit                |
     +---] [---------] [-----------] [---( ) Y0 (Green LED)-+

  If Stn1_Run AND NOT Stn1_Blink: Green steady ON
  If Stn1_Run AND Stn1_Blink AND Flash_Bit: Green blinks
  If NOT Stn1_Run: Green OFF
```

See [PLC Ladder Logic for LED Control](m8-plc-ladder-logic.md) for complete timer instruction reference and safety interlock patterns.

### 5.3 Multiplexed Indicator Arrays

For panels with more LEDs than available PLC output points, use shift registers or I2C/SPI I/O expanders driven by the PLC:

```
  PLC (3 outputs)           74HC595 Shift Register          LEDs
  +-----------+             +------------------+            +------+
  | Y0 (Data) |---SER----->| SER    Q0-Q7     |---[R]----->| LED1 |
  | Y1 (Clock)|---SRCK---->| SRCK             |---[R]----->| LED2 |
  | Y2 (Latch)|---RCK----->| RCK              |---[R]----->| ...  |
  +-----------+             |             Q7'  |---> next   | LED8 |
                            +------------------+    595     +------+

  3 PLC outputs control 8+ LEDs via serial shift register.
  Cascade multiple 595s for 16, 24, 32+ LEDs.

  PLC must clock data out bit-by-bit. At 10ms scan time,
  clocking 24 bits takes 24 scans = 240ms to update all LEDs.
  Acceptable for status indicators (not for fast effects).
```

---

## 6. Panel Wiring and Enclosure

### 6.1 DIN Rail Terminal Blocks

Inside the panel enclosure, use DIN-rail-mounted terminal blocks for all connections. Terminal blocks provide:
- Secure screw connections (no wire nuts or solder)
- Easy troubleshooting (test points accessible)
- Wire labeling (numbered markers on each terminal)
- Strain relief (wires are clamped, not dangling)

```
  Panel enclosure interior layout:

  +--------------------------------------------------+
  |  [DIN Rail - Top]                                 |
  |  [Terminal blocks: 24V supply, GND, LED feeds]    |
  |                                                   |
  |  [DIN Rail - Middle]                              |
  |  [Terminal blocks: PLC output connections]         |
  |                                                   |
  |  [Wire duct / cable tray]                         |
  |                                                   |
  |  [DIN Rail - Bottom]                              |
  |  [Power supply, fuse holders, surge protection]   |
  +--------------------------------------------------+
      ^                                    ^
      |                                    |
   Cable entry                        Cable entry
   (from PLC)                         (to LED panel face)
```

### 6.2 Cable Tray and Wire Duct

- Use slotted wire duct (Panduit or equivalent) to route wires neatly between terminal blocks
- Separate signal wires from power wires (different duct channels)
- Label every wire at both ends using ferrule labels or wire markers
- Use ferrule crimps on all stranded wires entering terminal blocks

### 6.3 Enclosure Selection

| Rating | Environment | Example |
|--------|------------|---------|
| IP20 | Indoor, clean, dry | Office, lab, clean room |
| IP54 | Indoor, dusty, splash-resistant | General factory floor |
| IP65 | Washdown, outdoor, dusty | Food processing, outdoor |
| IP66 | High-pressure washdown | Pharmaceutical, chemical |

```
  Enclosure sizing:
    Width  = panel face width + 100mm clearance each side
    Height = panel face height + 200mm for terminal blocks
    Depth  = 150-200mm (room for wiring and components)

  Example: 8-station panel (600mm x 400mm face)
    Enclosure: 800mm x 700mm x 200mm, IP54 steel
    Includes:  LED panel face, DIN rails, terminal blocks,
               24V PSU, fuse holders, cable glands
```

### 6.4 Cable Glands

All cables entering and exiting the enclosure pass through cable glands that maintain the IP rating:

| Cable OD | Gland Size | Use |
|----------|-----------|-----|
| 3-6.5mm | PG7 / M12 | Single LED wire pair |
| 6-12mm | PG13.5 / M20 | Multi-conductor cable |
| 10-18mm | PG21 / M25 | Thick multi-conductor or shielded |

---

## 7. Example: 8-Station Production Line Status Board

### 7.1 Bill of Materials

| Item | Quantity | Description | Cost Each |
|------|----------|-------------|-----------|
| 22mm LED indicator, Green | 8 | 24V DC, panel mount | $4 |
| 22mm LED indicator, Yellow | 8 | 24V DC, panel mount | $4 |
| 22mm LED indicator, Red | 8 | 24V DC, panel mount | $4 |
| Steel enclosure, IP54 | 1 | 800x700x200mm | $120 |
| DIN rail terminal blocks | 30 | 2.5mm^2, screw type | $1.50 |
| DIN rail, 35mm | 2m | Standard TS35 | $8/m |
| Slotted wire duct | 2m | 40x40mm | $6/m |
| 24V 1A PSU | 1 | DIN rail mount | $25 |
| Cable glands, M20 | 4 | IP68 rated | $2 |
| Wire, 22 AWG | 50m | Stranded, multiple colors | $0.10/m |
| Ferrule crimps | 100 | Assorted sizes | $0.05 |
| Wire markers | 100 | Numbered, adhesive | $0.03 |
| Legend plates | 24 | Engraved, for each indicator | $2 |
| **Total** | | | **~$350** |

### 7.2 Wiring Schedule

```
  PLC Output   Terminal   Wire Color   LED Function
  ----------   --------   ----------   ------------------
  Y0           TB1-1      Green        Station 1 - Run
  Y1           TB1-2      Yellow       Station 1 - Warning
  Y2           TB1-3      Red          Station 1 - Fault
  Y3           TB1-4      Green        Station 2 - Run
  Y4           TB1-5      Yellow       Station 2 - Warning
  Y5           TB1-6      Red          Station 2 - Fault
  Y6           TB1-7      Green        Station 3 - Run
  Y7           TB1-8      Yellow       Station 3 - Warning
  Y8           TB2-1      Red          Station 3 - Fault
  Y9           TB2-2      Green        Station 4 - Run
  Y10          TB2-3      Yellow       Station 4 - Warning
  Y11          TB2-4      Red          Station 4 - Fault
  Y12          TB2-5      Green        Station 5 - Run
  ...
  Y23          TB3-6      Red          Station 8 - Fault

  COM (all)    TB4-1      Blue         24V DC common (+)
  GND          TB4-2      White/Black  0V DC common (-)
```

### 7.3 PLC Program Structure

```
  === Safety Layer (Rungs 1-10) ===
  Read all E-Stop, guard, and fault inputs.
  Compute safe states per station.
  Priority: E-Stop > Fault > Guard > Warning > Run

  === LED State Layer (Rungs 11-30) ===
  Map computed states to LED output bits.
  Apply blink patterns using shared flash generator.

  === Communication Layer (Rungs 31-35) ===
  Pack LED states into Modbus registers.
  Send to remote LED panels via Modbus TCP.

  === Diagnostics Layer (Rungs 36-40) ===
  Monitor LED current feedback (if available).
  Flag LED open/short faults.
  Log state changes to HMI historian.
```

---

## 8. SCADA/HMI Integration

### 8.1 Remote Monitoring

The physical LED panel shows status on the factory floor. A SCADA (Supervisory Control and Data Acquisition) system mirrors this status on office screens, mobile devices, and historian databases.

```
  Physical Panel                  SCADA/HMI System
  +-----------+                   +-----------+
  | LED Green | <--- PLC Y0      | Green dot  | <--- OPC UA tag
  | LED Yellow| <--- PLC Y1      | Yellow dot | <--- OPC UA tag
  | LED Red   | <--- PLC Y2      | Red dot    | <--- OPC UA tag
  +-----------+                   +-----------+
       |                               |
       v                               v
  Operator on floor              Manager in office
  sees physical LEDs             sees mirrored status
```

### 8.2 OPC UA Tag Mapping

Map each LED state to an OPC UA tag for SCADA consumption:

```
  Tag Name                    Data Type   PLC Address   Description
  ---------                   ---------   -----------   -----------
  Line1.Stn1.LED_Green        BOOL        Y0            Station 1 running
  Line1.Stn1.LED_Yellow       BOOL        Y1            Station 1 warning
  Line1.Stn1.LED_Red          BOOL        Y2            Station 1 fault
  Line1.Stn1.State            INT         MW100         Station 1 state code
  Line1.Stn1.StateText        STRING      MW102         "Running" / "Fault"
  Line1.TotalRunning          INT         MW200         Count of running stations
  Line1.TotalFaulted          INT         MW202         Count of faulted stations
```

### 8.3 Historian and Trend Analysis

Logging LED state changes to a historian database enables:
- **Downtime tracking:** How long was Station 3 in fault state today?
- **OEE calculation:** Overall Equipment Effectiveness from run/idle/fault durations
- **Pattern detection:** Station 7 faults every Tuesday at 14:00 -- scheduled maintenance needed?
- **Shift comparison:** Day shift averages 2 faults/hour, night shift averages 5 -- training issue?

```
  Historian log format:

  Timestamp              Station  State      Duration
  ---------------------  -------  ---------  --------
  2026-03-09 08:00:00    Stn 1    Running    -
  2026-03-09 08:14:32    Stn 1    Warning    14m 32s running
  2026-03-09 08:15:01    Stn 1    Fault      0m 29s warning
  2026-03-09 08:22:15    Stn 1    Running    7m 14s fault
```

---

## 9. Testing and Commissioning

### 9.1 Pre-Power Checks

| # | Check | Pass Criteria |
|---|-------|--------------|
| 1 | Continuity test each LED circuit | <10 ohm from PLC terminal to LED terminal |
| 2 | Insulation test between circuits | >1 Mohm at 500V DC |
| 3 | Terminal torque check | All screws tightened to specification |
| 4 | Wire routing review | Signal and power separated, all wires in duct |
| 5 | Label verification | Every wire labeled at both ends, matching schedule |

### 9.2 Functional Test Procedure

```
  Step 1: Apply 24V DC. Verify no LED illuminates (all PLC outputs OFF).
  Step 2: Force each PLC output ON individually.
          Verify correct LED illuminates at correct brightness.
  Step 3: Force all outputs ON simultaneously.
          Verify total current draw matches calculation (within 10%).
  Step 4: Run blink test: all LEDs blink at 1 Hz.
          Verify all LEDs blink synchronously (PLC scan synchronized).
  Step 5: Simulate each machine state (E-Stop, fault, warning, run).
          Verify LED pattern matches state machine specification.
  Step 6: Simulate communication loss (if Modbus panel).
          Verify failsafe state activates (all red blink).
```

---

## 10. Cross-References

- [PLC Ladder Logic for LED Control](m8-plc-ladder-logic.md) -- ladder logic for safety interlocks and LED sequencing
- [Hybrid PLC + ESP32 Architecture](m8-hybrid-plc-esp32.md) -- combining PLC status with ESP32 smart LED effects
- [Modbus Communication for LED Control](m8-modbus-communication.md) -- Modbus protocol for remote LED panel communication
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- external MOSFET drivers for high-power LED loads
- [LED Electronics Fundamentals](m1-led-fundamentals.md) -- forward voltage, current, and power for indicator LEDs
- [Power Supply Selection](m5-power-supply-selection.md) -- PSU sizing for panel power requirements
- [Glossary](00-glossary.md) -- IEC 60073, tower light, DIN rail, SCADA, OPC UA definitions

---

*Sources: IEC 60073:2002 "Basic and safety principles for man-machine interface -- Coding principles for indicators and actuators", IEC 60204-1:2016 "Safety of machinery -- Electrical equipment of machines", Patlite LR series technical manual, Werma KombiSIGN 71 configuration guide, Siemens S7-1200 system manual (output module specifications), Rockwell Automation "Selecting and Applying Pilot Lights and Indicators" (publication AG-2.4), NFPA 79 "Electrical Standard for Industrial Machinery"*
