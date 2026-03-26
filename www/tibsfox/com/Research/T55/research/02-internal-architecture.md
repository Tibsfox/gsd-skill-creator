# Internal Architecture and Operating Theory

> **Domain:** Analog IC Design
> **Module:** 2 -- Internal Architecture and Operating Theory
> **Through-line:** *Three resistors, two comparators, one flip-flop, one transistor, one output stage. Six functional blocks in an 8-pin package -- and the spaces between them are where the timing magic lives.*

---

## Table of Contents

1. [Component Census](#1-component-census)
2. [The Voltage Divider](#2-the-voltage-divider)
3. [The Comparators](#3-the-comparators)
4. [The SR Flip-Flop](#4-the-sr-flip-flop)
5. [The Discharge Transistor](#5-the-discharge-transistor)
6. [The Output Stage](#6-the-output-stage)
7. [Pin Configuration](#7-pin-configuration)
8. [Signal Flow Logic](#8-signal-flow-logic)
9. [Cross-References](#9-cross-references)
10. [Sources](#10-sources)

---

## 1. Component Census

The standard bipolar 555 (NE555) contains approximately 25 transistors, 2 diodes, and 15 resistors on a silicon die, packaged in an 8-pin dual in-line package (DIP-8). The CMOS variants (LMC555, ICM7555) use MOSFET transistors with higher-value voltage divider resistors (100 kohm+ vs. 5 kohm) [1][2].

### 1.1 Functional Block Diagram

```
                    Vcc (Pin 8)
                      |
                  [5k] R1
                      |-------- 2/3 Vcc reference
                  [5k] R2        |
                      |-------- 1/3 Vcc reference
                  [5k] R3        |         |
                      |          |         |
                    GND          |         |
                                 v         v
                          Upper Comp.  Lower Comp.
                          (Pin 6)      (Pin 2)
                               |         |
                               v         v
                            [ SR Flip-Flop ]
                               |         |
                               v         v
                         Discharge    Output
                         (Pin 7)     (Pin 3)
```

---

## 2. The Voltage Divider

Three matched resistors (5 kohm each in bipolar, 100 kohm+ in CMOS) connected in series between Vcc and GND establish two reference voltages [1][2]:

- **Upper reference:** 2/3 Vcc (at the junction of R1 and R2)
- **Lower reference:** 1/3 Vcc (at the junction of R2 and R3)

### 2.1 Why These Thresholds Matter

The 1/3 and 2/3 Vcc thresholds define the voltage window within which the timing capacitor oscillates. The ratio is fixed by the resistor network -- it tracks Vcc ratiometrically, meaning timing behavior is inherently independent of supply voltage. This is why the 555 works equally well at 5V and 15V [1][2].

### 2.2 The Control Voltage Pin

Pin 5 (Control Voltage) provides direct access to the upper comparator reference. An external voltage applied here shifts the 2/3 Vcc threshold, enabling voltage-controlled oscillator (VCO) operation. When unused, this pin should be bypassed to ground with a 10-100 nF capacitor to prevent noise from affecting timing accuracy [2][3].

---

## 3. The Comparators

Two internal comparators monitor the external timing capacitor voltage against the reference thresholds [1][2]:

### 3.1 Upper Comparator

- **Non-inverting input:** Threshold pin (pin 6)
- **Inverting input:** 2/3 Vcc reference
- **Action:** Outputs HIGH when threshold voltage exceeds 2/3 Vcc, resetting the flip-flop
- **Effect:** Output goes LOW, discharge transistor turns ON

### 3.2 Lower Comparator

- **Inverting input:** Trigger pin (pin 2)
- **Non-inverting input:** 1/3 Vcc reference
- **Action:** Outputs HIGH when trigger voltage drops below 1/3 Vcc, setting the flip-flop
- **Effect:** Output goes HIGH, discharge transistor turns OFF

The comparators are the "eyes" of the 555 -- they watch the capacitor voltage and signal when it crosses either boundary [2].

---

## 4. The SR Flip-Flop

The SR (Set-Reset) flip-flop is the memory element that holds the 555's state between comparator events [1][2]:

- **Set** by the lower comparator (trigger event)
- **Reset** by the upper comparator (threshold event)
- The Q-bar output controls both the discharge transistor and the output stage
- **Reset pin (pin 4)** overrides both comparator inputs -- pulling it LOW forces the flip-flop to the reset state regardless of the capacitor voltage

### 4.1 State Table

| Lower Comp | Upper Comp | Reset Pin | Flip-Flop State | Output | Discharge |
|-----------|-----------|-----------|----------------|--------|-----------|
| HIGH | LOW | HIGH | SET | HIGH | OFF |
| LOW | HIGH | HIGH | RESET | LOW | ON |
| LOW | LOW | HIGH | Hold | Previous | Previous |
| X | X | LOW | RESET (forced) | LOW | ON |

---

## 5. The Discharge Transistor

An NPN transistor with its collector connected to pin 7 (Discharge). The transistor is controlled by the flip-flop's Q-bar output [1][2]:

- **When flip-flop is RESET** (Q-bar HIGH): transistor ON, pin 7 pulled to ground -- capacitor discharges
- **When flip-flop is SET** (Q-bar LOW): transistor OFF, pin 7 open -- capacitor charges through external resistors

The discharge transistor provides the reset mechanism for the timing capacitor. In astable mode, it creates the separate discharge path through R2 that determines the LOW time of the output waveform [2].

---

## 6. The Output Stage

The bipolar 555's output stage is a totem-pole driver capable of both sourcing and sinking current [1][2][3]:

| Parameter | Bipolar (NE555) | CMOS (LMC555) | CMOS (ICM7555) |
|-----------|----------------|---------------|----------------|
| Source current | Up to 200 mA | 10-100 mA | 50-100 mA |
| Sink current | Up to 200 mA | 10-100 mA | 50-100 mA |
| Output voltage (HIGH) | Vcc - 1.5V typical | Vcc - 0.1V | Vcc - 0.2V |
| Output voltage (LOW) | 0.1-0.25V typical | 0.05V | 0.1V |

### 6.1 Drive Capability

The bipolar 555's 200 mA output current is remarkable for a timing IC. It can directly drive:

- LEDs (with current-limiting resistor)
- Small relays (with flyback diode)
- Piezo buzzers
- Logic inputs (TTL and CMOS compatible)
- Small motors (via transistor/MOSFET driver for larger motors)

---

## 7. Pin Configuration

| Pin | Name | Function |
|-----|------|----------|
| 1 | GND | Ground (0V reference) |
| 2 | Trigger | Input to lower comparator; output goes HIGH when voltage drops below 1/3 Vcc |
| 3 | Output | Timer output; sources or sinks up to 200 mA (bipolar) |
| 4 | Reset | Active-low master reset; overrides all other inputs. Normally tied to Vcc |
| 5 | Control Voltage | Access to upper comparator reference (2/3 Vcc); allows external modulation. Bypass to GND with 10-100 nF when unused |
| 6 | Threshold | Input to upper comparator; output goes LOW when voltage exceeds 2/3 Vcc |
| 7 | Discharge | Open-collector output of internal transistor; provides discharge path for timing capacitor |
| 8 | Vcc | Positive supply: 4.5-16V (bipolar), 2-18V (CMOS) |

---

## 8. Signal Flow Logic

The 555's behavior is a state machine with two stable output states governed by capacitor voltage relative to the two reference thresholds [2][3]:

1. **Trigger event** (Vpin2 < 1/3 Vcc): Lower comparator sets flip-flop -> output HIGH, discharge transistor OFF, capacitor charges
2. **Threshold event** (Vpin6 > 2/3 Vcc): Upper comparator resets flip-flop -> output LOW, discharge transistor ON, capacitor discharges
3. **Reset override** (Vpin4 < 0.7V): Flip-flop forced to reset regardless of comparator outputs
4. **Control voltage modulation**: External voltage on pin 5 shifts the upper threshold, enabling VCO operation

This charge-compare-discharge loop is the fundamental timing mechanism from which all three operating modes derive [2].

---

## 9. Cross-References

| Project | Connection |
|---------|------------|
| [SHE](../SHE/index.html) | Comparator circuits, voltage dividers, and flip-flop logic -- the 555 teaches all three analog building blocks |
| [EMG](../EMG/index.html) | The discharge transistor controls motor timing circuits the same way it controls the internal capacitor |
| [LED](../LED/index.html) | The output stage directly drives LEDs; the totem-pole driver is the same topology used in LED driver ICs |
| [BPS](../BPS/index.html) | Threshold-based state switching in the 555 parallels comparator-based threshold detection in sensor circuits |

---

## 10. Sources

1. [TI LM555 Datasheet](https://www.ti.com/product/LM555)
2. [Renesas ICM7555 Datasheet](https://www.renesas.com/)
3. [NXP NE555 Application Notes](https://www.nxp.com/)
