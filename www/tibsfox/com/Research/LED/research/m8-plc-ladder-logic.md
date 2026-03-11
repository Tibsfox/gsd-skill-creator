# PLC Ladder Logic for LED Control

Programmable Logic Controllers (PLCs) are the standard control platform in industrial automation. When LED indicators, status arrays, and warning lights must operate in safety-critical environments -- factory floors, process plants, machine cells -- PLCs provide the deterministic scan cycle, certified reliability, and safety interlock patterns that microcontrollers cannot match. This page covers IEC 61131-3 ladder logic fundamentals, output module selection for LED loads, timer/counter instructions for sequencing, and safety interlock design.

---

## 1. PLC Architecture Overview

### 1.1 What a PLC Is

A PLC is a ruggedized industrial computer designed for real-time control. Unlike a general-purpose microcontroller, a PLC:

- Runs a deterministic **scan cycle** (read inputs, execute logic, write outputs) every 1-20 ms
- Tolerates industrial environments: -20C to 60C, vibration, electrical noise, 24/7 operation
- Has certified reliability (MTBF > 100,000 hours for major brands)
- Supports hot-swappable I/O modules (replace hardware without power-down)
- Is programmed in standardized languages (IEC 61131-3)

### 1.2 Scan Cycle

```
  +------> Read Inputs (digital, analog)
  |              |
  |        Execute Logic (ladder rungs, top to bottom)
  |              |
  |        Update Outputs (all at once, end of scan)
  |              |
  +------<-------+

  Typical scan time: 1-10 ms for LED control programs
  Deterministic: every scan takes the same time (within jitter <1ms)
```

The scan cycle is the fundamental difference from event-driven microcontroller code. In a PLC, every output is recalculated every scan regardless of whether inputs changed. This eliminates race conditions and makes behavior 100% reproducible.

### 1.3 Major PLC Brands

| Brand | Series | Common In | Programming Software |
|-------|--------|-----------|---------------------|
| Allen-Bradley (Rockwell) | CompactLogix, MicroLogix | North America | Studio 5000, RSLogix |
| Siemens | S7-1200, S7-1500, LOGO! | Europe, worldwide | TIA Portal |
| Mitsubishi | FX5U, iQ-R | Asia, automotive | GX Works3 |
| WAGO | PFC200, 750 series | Europe, building automation | e!COCKPIT |
| Schneider Electric | Modicon M340, M580 | Process industry | EcoStruxure |
| Omron | NX1P, CP2E | Japan, packaging | Sysmac Studio |

For LED control learning and small projects, the Siemens LOGO! ($100-150) and Allen-Bradley Micro800 ($200-300) are the most accessible entry points.

---

## 2. IEC 61131-3 Ladder Logic

### 2.1 The Standard

IEC 61131-3 defines five programming languages for PLCs:

1. **Ladder Diagram (LD)** -- graphical, resembles relay logic schematics (this page)
2. **Function Block Diagram (FBD)** -- graphical, logic blocks with connections
3. **Structured Text (ST)** -- textual, resembles Pascal/C
4. **Instruction List (IL)** -- textual, assembly-like (deprecated)
5. **Sequential Function Chart (SFC)** -- state machine / sequence control

Ladder logic is the most widely used language for discrete I/O control, including LED indicators and status displays.

### 2.2 Rung Structure

A ladder diagram is drawn as horizontal "rungs" between two vertical power rails. Current flows from left rail (power) through contacts and coils to the right rail (return):

```
  Power Rail                                Return Rail
     |                                          |
     |    Input_1        Input_2      Output_1   |
     +---] [----------] [----------( )----------+
     |                                          |
     |    Input_3                    Output_2   |
     +---] [---------------------------( )-----+
     |                                          |
     |    Timer_Done     Start       Motor      |
     +---] [----------]/[----------( )----------+
     |                                          |

  ] [ = Normally Open contact (true when bit is ON)
  ]/[ = Normally Closed contact (true when bit is OFF)
  ( ) = Output coil (energized when rung has continuity)
```

### 2.3 Reading Ladder Logic

Each rung is a Boolean equation. The rung has "continuity" (the output energizes) when there is at least one continuous path of TRUE contacts from left rail to right rail.

```
  Rung 1:  Output_1 = Input_1 AND Input_2
  Rung 2:  Output_2 = Input_3
  Rung 3:  Motor = Timer_Done AND (NOT Start)
```

### 2.4 Parallel Branches (OR logic)

```
     |    Input_A                   Output_X   |
     +---] [--+--------------------( )----------+
     |        |                                 |
     |    Input_B                               |
     +---] [--+                                 |
     |                                          |

  Output_X = Input_A OR Input_B
```

### 2.5 Seal-In (Latch) Circuit

A common pattern for start/stop pushbutton control:

```
     |    Start_PB    Stop_PB       Motor_Run  |
     +---] [------+--]/[---------( )------------+
     |            |                             |
     |  Motor_Run |                             |
     +---] [------+                             |
     |                                          |

  Press Start -> Motor_Run turns ON
  Motor_Run contact seals the rung (maintains continuity after Start released)
  Press Stop -> breaks continuity -> Motor_Run turns OFF
```

---

## 3. Output Modules for LED Loads

### 3.1 Relay Output Modules

Relay outputs use mechanical contacts to switch loads. They handle both AC and DC, any voltage up to the relay rating.

| Parameter | Typical Value |
|-----------|--------------|
| Max voltage | 250 VAC / 30 VDC |
| Max current | 2A per point |
| Switching speed | 10-20 ms (mechanical) |
| Lifespan | 100,000 - 1,000,000 cycles |
| Isolation | Galvanic (relay coil isolates control from load) |

**Good for:** Individual LED indicators, pilot lights, signal towers where switching speed does not matter and the load is a simple on/off LED.

**Bad for:** PWM dimming (relay contacts cannot switch fast enough), high-frequency LED effects, addressable LED strips.

### 3.2 Transistor Output Modules (DC Only)

Transistor outputs use solid-state switching (typically MOSFET or darlington). They are faster but only switch DC loads.

| Parameter | Typical Value |
|-----------|--------------|
| Max voltage | 30 VDC |
| Max current | 0.5A per point |
| Switching speed | <1 ms |
| Lifespan | Unlimited (no mechanical wear) |
| Isolation | Optocoupler isolation |

**Good for:** Fast-switching LED loads, multiplexed indicator arrays, driving external MOSFET driver boards for LED strips.

**Bad for:** Directly driving high-power LED strips (0.5A per point is too low for most strips). Use the transistor output to drive the gate of an external power MOSFET -- see [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md).

### 3.3 Driving LED Strips from PLC Outputs

```
  PLC Transistor Output                  LED Strip
  +------------------+                  +-----------+
  |  Point Y0 (0.5A) |---[330 ohm]-+   |           |
  +------------------+             |   | +12V      |
                                   |   | Data/GND  |
                              Gate |   +-----------+
                                   |        |
                              +----+----+   |
                              | IRLZ44N |   |
                              | N-ch    |---+ (Drain)
                              | MOSFET  |
                              +----+----+
                                   |
                                  GND (Source)

  PLC Y0 output drives MOSFET gate (logic-level MOSFET)
  MOSFET switches the LED strip ground path
  External 12V PSU powers the strip directly
```

> **SAFETY WARNING:** Industrial PLC installations involve mains voltage wiring, motor starters, and safety circuits. All PLC cabinet wiring must comply with applicable electrical codes (NEC, IEC 60204-1) and be performed by qualified personnel. PLC output wiring to LED loads must maintain proper separation from high-voltage conductors and use appropriate wire gauge and overcurrent protection.

---

## 4. Timer Instructions for LED Sequencing

### 4.1 TON (Timer On-Delay)

The TON timer starts timing when its input goes TRUE. After the preset time elapses, its Done bit goes TRUE. When the input goes FALSE, the timer resets immediately.

```
     |    Start_Btn                  TON         |
     +---] [--------------------[TON T1 5000]---+
     |                                           |
     |    T1.DN                      LED_Green   |
     +---] [------------------------( )----------+
     |                                           |

  When Start_Btn is pressed, T1 begins counting.
  After 5000ms (5 seconds), T1.DN goes TRUE.
  LED_Green turns on after the 5-second delay.
  Release Start_Btn -> T1 resets -> LED_Green turns off.
```

### 4.2 TOF (Timer Off-Delay)

The TOF timer's Done bit is TRUE while the input is TRUE and remains TRUE for the preset time after the input goes FALSE.

```
     |    Motion_Sensor              TOF          |
     +---] [--------------------[TOF T2 30000]---+
     |                                            |
     |    T2.DN                      Lights_On    |
     +---] [------------------------( )-----------+
     |                                            |

  Lights stay on while motion is detected.
  After motion stops, lights stay on for 30 more seconds.
  Then T2.DN goes FALSE and lights turn off.
```

### 4.3 Sequential LED Pattern with Timers

A common industrial application: a rotating status indicator that cycles through colors:

```
  === LED Sequence: Red (2s) -> Yellow (2s) -> Green (2s) -> repeat ===

     |    Seq_Enable    T3.DN        TON              |
     +---] [--------+--]/[----[TON T1 2000]----------+
     |              |                                  |
     |    T2.DN     |                                  |
     +---]/[--------+                                  |
     |                                                 |
     |    T1.DN      T2.DN          TON               |
     +---] [--------]/[------[TON T2 2000]------------+
     |                                                 |
     |    T2.DN      T3.DN          TON               |
     +---] [--------]/[------[TON T3 2000]------------+
     |                                                 |
     |    Seq_Enable  T1.DN   T2.DN   LED_Red         |
     +---] [--------]/[-----]/[-----( )---------------+
     |                                                 |
     |    T1.DN       T2.DN          LED_Yellow        |
     +---] [--------]/[------------( )----------------+
     |                                                 |
     |    T2.DN       T3.DN          LED_Green         |
     +---] [--------]/[------------( )----------------+
     |                                                 |

  State 0: T1 timing, LED_Red ON
  State 1: T1 done, T2 timing, LED_Yellow ON
  State 2: T2 done, T3 timing, LED_Green ON
  State 3: T3 done -> resets T1 -> back to State 0
```

---

## 5. Counter Instructions for LED Control

### 5.1 CTU (Count Up)

```
     |    Pulse_Input                CTU              |
     +---] [--------------------[CTU C1 10]----------+
     |                                                |
     |    C1.DN                      Batch_Done_LED   |
     +---] [------------------------( )--------------+
     |                                                |
     |    Reset_Btn                  C1.RES           |
     +---] [------------------------( )--------------+
     |                                                |

  Count 10 pulses on Pulse_Input -> Batch_Done_LED turns on.
  Reset_Btn clears the counter.
  Application: LED indicates when a batch of 10 parts is complete.
```

### 5.2 Displaying Count on LED Bar

Use counter accumulated value to drive individual LEDs as a bar graph:

```
     |    C1.ACC >= 1                LED_1            |
     +---[GEQ C1.ACC 1]------------( )---------------+
     |    C1.ACC >= 2                LED_2            |
     +---[GEQ C1.ACC 2]------------( )---------------+
     |    C1.ACC >= 3                LED_3            |
     +---[GEQ C1.ACC 3]------------( )---------------+
     ...
     |    C1.ACC >= 10               LED_10           |
     +---[GEQ C1.ACC 10]-----------( )---------------+
```

---

## 6. Safety Interlock Patterns

### 6.1 Why Safety Interlocks Matter

In industrial environments, LED indicators are part of the safety system. A green light that incorrectly shows "safe to enter" when a machine is running can cause injury or death. Safety interlocks ensure:

- LED status accurately reflects machine state
- Failure modes default to a safe state (lights OFF or RED)
- Manual override is possible but logged
- Redundant sensing prevents single-point-of-failure

> **SAFETY WARNING:** Safety-critical interlock logic must be reviewed and validated by qualified safety engineers. The patterns shown here are educational examples. Production safety systems require risk assessment per ISO 13849 or IEC 62443, safety-rated PLCs (SIL-rated I/O), and documented validation procedures. Never deploy safety logic without professional review.

### 6.2 Machine Status Tower Light

A standard 3-color tower light (red/yellow/green) for a CNC machine cell:

```
  === Safety Status Tower Light ===

  Inputs:
    E_Stop     = Emergency stop circuit (NC contact, FALSE = pressed)
    Guard_Closed = Safety guard interlock switch
    Drive_Ready = Machine drive system ready signal
    Cycle_Run  = Machine in automatic cycle
    Fault      = Any machine fault detected

  === Rung 1: Emergency Stop Override (highest priority) ===
     |    E_Stop                                        |
     +---]/[---+-------------------------------( )--Red_Steady
     |         |
     |  Fault  |
     +---] [---+

  E_Stop pressed (NC opens) OR any Fault -> Red light ON (steady)

  === Rung 2: Guard Open Warning ===
     |    E_Stop   Guard_Closed                        |
     +---] [------]/[-------------------( )--Yellow_Flash
     |                                                  |

  Guard open (but E_Stop not pressed) -> Yellow flashing

  === Rung 3: Ready / Idle ===
     |    E_Stop   Guard_Closed  Drive_Ready  Cycle_Run |
     +---] [------] [----------] [----------]/[---( )--Green_Steady
     |                                                   |

  All safe + drive ready + NOT in cycle -> Green steady (ready to start)

  === Rung 4: Running ===
     |    E_Stop   Guard_Closed  Drive_Ready  Cycle_Run |
     +---] [------] [----------] [----------] [----( )--Green_Flash
     |                                                   |

  All safe + in cycle -> Green flashing (machine running)

  === Rung 5: Flash Generator (500ms on, 500ms off) ===
     |    Flash_TMR.DN                TON              |
     +---]/[-------------------[TON Flash_TMR 500]----+
     |                                                  |
     |    Flash_TMR.DN                Flash_Bit         |
     +---] [---------------------------( )-------------+
     |                                                  |

  === Rung 6: Flash Output Gating ===
     |    Yellow_Flash  Flash_Bit    Y_Tower_Yellow     |
     +---] [---------] [----------( )------------------+
     |                                                  |
     |    Green_Flash   Flash_Bit    Y_Tower_Green      |
     +---] [---------] [----------( )------------------+
     |                                                  |
     |    Green_Steady               Y_Tower_Green      |
     +---] [------------------------( )----------------+
     |                                                  |
     |    Red_Steady                 Y_Tower_Red        |
     +---] [------------------------( )----------------+
     |                                                  |
```

### 6.3 Priority Encoding

Note the priority structure: E_Stop is checked first (highest priority), then guard status, then drive readiness. This ensures that a fault always overrides a "safe" indication. The normally-closed E_Stop contact means a wire break or disconnection also triggers the emergency state -- a fail-safe design.

### 6.4 Dual-Channel Safety Input

For SIL-2 or higher safety integrity, use redundant input channels:

```
     |    E_Stop_Ch1   E_Stop_Ch2   E_Stop_Valid      |
     +---] [---------] [----------( )------------------+
     |                                                  |
     |    E_Stop_Ch1   E_Stop_Ch2   Discrepancy_Fault  |
     +---] [---------]/[---+------( )------------------+
     |                     |                            |
     |    E_Stop_Ch1   E_Stop_Ch2                      |
     +---]/[---------] [---+                            |
     |                                                  |

  Both channels must agree. If they disagree (one open, one closed),
  a discrepancy fault is flagged and the system goes to safe state.
```

---

## 7. PLC vs. Microcontroller for LED Control

| Factor | PLC | Arduino/ESP32 |
|--------|-----|---------------|
| Reliability | >100,000 hr MTBF, industrial rated | Consumer electronics, no MTBF spec |
| Operating temp | -20C to 60C (standard) | 0C to 70C (typical) |
| Vibration/shock | Designed for factory floors | Not rated |
| Determinism | Guaranteed scan cycle <20ms | No real-time guarantee (interrupts can collide) |
| Safety certification | SIL-rated models available | Not available |
| Cost | $200-2000+ | $3-30 |
| Addressable LEDs | Not native (needs external driver) | Native (NeoPixel, FastLED, WLED) |
| Color effects | Not practical | Hundreds of effects |
| WiFi/cloud | Add-on modules | Built-in (ESP32) |
| Programming | Ladder logic, FBD | C/C++, Python, Arduino IDE |
| Best for | Safety indicators, status displays, interlocks | Decorative, smart home, creative |

The hybrid architecture described in [Hybrid PLC + ESP32 Architecture](m8-hybrid-plc-esp32.md) combines the strengths of both platforms.

---

## 8. Scan Cycle Timing for LED Applications

### 8.1 Why Scan Time Matters

If your PLC program has a 10ms scan time and you toggle an LED output every scan, the LED flashes at 50 Hz (on for 10ms, off for 10ms = 20ms period). This is visible flicker. Timer instructions with appropriate preset values are essential for human-visible LED patterns.

### 8.2 Typical Scan Times

| Program Size | Typical Scan Time | LED Application |
|-------------|-------------------|-----------------|
| 10 rungs | 1-2 ms | Simple indicator panel |
| 100 rungs | 3-8 ms | Machine status with interlocks |
| 500 rungs | 10-20 ms | Complex multi-station system |
| 1000+ rungs | 20-50 ms | Large system (unlikely for LED-only) |

For LED control, scan times under 10ms are typical. The timer resolution matches the scan time -- a timer with 1ms preset in a 10ms scan program actually triggers after 10ms (one scan). Design timer presets with scan time in mind.

---

## 9. Cross-References

- [Hybrid PLC + ESP32 Architecture](m8-hybrid-plc-esp32.md) -- integrate PLC safety with ESP32 smart LED control via Modbus TCP
- [MOSFET-Based PWM Dimmers](m5-mosfet-pwm-dimmers.md) -- the external MOSFET driver that PLC transistor outputs can control
- [LED Electronics Fundamentals](m1-led-fundamentals.md) -- current, voltage, and power calculations for industrial LED loads
- [Microcontroller Platform Comparison](m2-mcu-comparison.md) -- detailed comparison of MCU platforms including industrial considerations
- [WLED Firmware Setup](m5-wled-setup.md) -- the addressable LED platform that complements PLC-controlled indicators
- [Glossary](00-glossary.md) -- PLC, ladder logic, scan cycle, SIL, interlock definitions

---

*Sources: IEC 61131-3:2013 "Programmable Controllers -- Programming Languages", Rockwell Automation CompactLogix documentation, Siemens S7-1200 system manual, ISO 13849-1:2015 "Safety of machinery -- Safety-related parts of control systems", IEC 62443 "Industrial communication networks -- IT security", NFPA 79 "Electrical Standard for Industrial Machinery"*
