# Modern Variants and CMOS Evolution

> **Domain:** Semiconductor Technology
> **Module:** 5 -- Modern Variants and CMOS Evolution
> **Through-line:** *The 555 has been manufactured by dozens of companies in quantities exceeding a billion per year for over fifty years. The architecture survived the transition from bipolar to CMOS, from through-hole to surface mount, from discrete to integrated -- because the design was right from the start.*

---

## Table of Contents

1. [The 555 Family Tree](#1-the-555-family-tree)
2. [Bipolar vs. CMOS](#2-bipolar-vs-cmos)
3. [Variant Comparison Table](#3-variant-comparison-table)
4. [The Dual and Quad Derivatives](#4-the-dual-and-quad-derivatives)
5. [Package Evolution](#5-package-evolution)
6. [Selection Guide](#6-selection-guide)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The 555 Family Tree

The 555 family spans multiple manufacturers, process technologies, and package formats. The original bipolar design has been complemented (but never replaced) by CMOS variants offering lower power consumption, wider supply voltage ranges, and higher operating frequencies [1][2][3]:

```
NE555/SE555 (Signetics, 1972) -- ORIGINAL BIPOLAR
├── LM555 (National Semi -> TI) -- Bipolar, most common designation
├── ICM7555 (Intersil -> Renesas) -- First CMOS variant (1978)
├── TLC555 (TI) -- CMOS, 600 uA quiescent, 2 MHz
├── LMC555 (National Semi -> TI) -- CMOS, ultra-low power, 1.5V minimum
├── CSS555 (Custom Silicon Solutions) -- Programmable timing
└── TS555 (ST Microelectronics) -- CMOS, rail-to-rail output
```

---

## 2. Bipolar vs. CMOS

The fundamental difference is the transistor technology on the die [1][2][3]:

### 2.1 Bipolar (NE555, LM555, SE555)

- **Process:** NPN/PNP bipolar junction transistors
- **Quiescent current:** ~10 mA -- significant for battery applications
- **Output drive:** Up to 200 mA source/sink -- the strongest output of any variant
- **Supply range:** 4.5-16V
- **Voltage divider:** Three 5 kohm resistors (total 15 kohm from Vcc to GND)
- **Output saturation:** Vcc - 1.5V typical (HIGH), 0.1-0.25V (LOW)

### 2.2 CMOS (TLC555, LMC555, ICM7555)

- **Process:** MOSFET transistors
- **Quiescent current:** 60-600 uA -- 15-150x lower than bipolar
- **Output drive:** 10-100 mA -- lower than bipolar but adequate for most applications
- **Supply range:** 1.5-18V (varies by variant) -- wider range, especially on the low end
- **Voltage divider:** 100 kohm+ resistors (minimal supply current draw)
- **Output saturation:** Near rail-to-rail (within 0.1-0.2V of Vcc and GND)

### 2.3 When to Choose Which

| Requirement | Choose |
|------------|--------|
| Maximum output current (>100 mA) | Bipolar (NE555/LM555) |
| Battery operation | CMOS (LMC555, ICM7555) |
| Supply voltage below 4.5V | CMOS (LMC555 works at 1.5V) |
| Highest frequency operation | CMOS (TLC555 to 2 MHz) |
| Rail-to-rail output | CMOS |
| Lowest cost | Bipolar (highest production volume) |

---

## 3. Variant Comparison Table

| Parameter | NE555 (Bipolar) | TLC555 (CMOS) | LMC555 (CMOS) | ICM7555 (CMOS) |
|-----------|-----------------|---------------|----------------|----------------|
| Supply Voltage | 4.5-16V | 2-15V | 1.5-15V | 2-18V |
| Quiescent Current | ~10 mA | ~600 uA | ~100 uA | ~60 uA |
| Output Current | 200 mA | 100 mA | 10 mA | 50-100 mA |
| Max Frequency | ~500 kHz | ~2 MHz | ~3 MHz | ~1 MHz |
| Input Current | ~500 nA | ~50 pA | ~20 pA | ~20 pA |
| Timing Accuracy | +/- 1% | +/- 2% | +/- 2% | +/- 2% |
| Manufacturer | NXP (originally Signetics) | Texas Instruments | Texas Instruments | Renesas (originally Intersil) |

Sources: Manufacturer datasheets [1][2][3][4].

---

## 4. The Dual and Quad Derivatives

### 4.1 556 -- Dual 555

Two independent 555 timers in a single 14-pin DIP package. Each timer has independent trigger, threshold, control voltage, discharge, reset, and output pins. Shared Vcc and GND [2].

**Applications:** Two-tone alarm generators, cascaded monostable delays, and any circuit requiring two timers in close proximity.

### 4.2 558 -- Quad 555

Four 555 timers in a single 16-pin DIP package. To fit four timers, some pins are shared or eliminated (no individual control voltage pins; shared reset). Output current reduced to ~100 mA per timer [2].

**Applications:** Sequential timing chains, multi-channel PWM, and high-density timer applications.

---

## 5. Package Evolution

The 555 has been manufactured in every major IC package format over its 50+ year history [1][2]:

| Package | Era | Pins | Size | Application |
|---------|-----|------|------|-------------|
| TO-5 (metal can) | 1972-1980s | 8 | Large | Original format; military |
| DIP-8 (plastic) | 1972-present | 8 | Medium | Prototyping, through-hole |
| SOIC-8 | 1990s-present | 8 | Small | Surface mount production |
| TSSOP-8 | 2000s-present | 8 | Very small | Space-constrained SMT |
| SOT-23-5 | 2010s-present | 5 | Tiny | Miniaturized applications |

The DIP-8 remains available and widely used for prototyping and education. Production designs have largely moved to SOIC-8 and smaller surface-mount formats [1].

---

## 6. Selection Guide

### 6.1 Decision Tree

```
Need 555 timer
├── Battery powered?
│   ├── YES: Supply < 3V?
│   │   ├── YES: LMC555 (1.5V minimum)
│   │   └── NO: ICM7555 (lowest quiescent, 60 uA)
│   └── NO: High output current needed?
│       ├── YES (>100 mA): NE555/LM555 (bipolar, 200 mA)
│       └── NO: TLC555 (CMOS, good all-rounder)
├── Frequency > 500 kHz?
│   └── YES: TLC555 (2 MHz) or LMC555 (3 MHz)
└── Need dual/quad?
    ├── Dual: 556 / TLC556 / ICM7556
    └── Quad: 558
```

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [SHE](../SHE/index.html) | CMOS 555 variants enable battery-powered smart home sensors and timing circuits |
| [LED](../LED/index.html) | CMOS variants enable low-power LED blinking circuits for battery-operated indicators |
| [BPS](../BPS/index.html) | Ultra-low-power ICM7555 enables battery-operated sensor timing with 60 uA quiescent |
| [EMG](../EMG/index.html) | Bipolar NE555's 200 mA output directly drives small motors or MOSFET gates for larger motors |
| [BCM](../BCM/index.html) | Surface-mount package selection for production PCB design; NEC component spacing |

---

## 8. Sources

1. [TI LM555/TLC555/LMC555 Datasheets](https://www.ti.com/)
2. [Renesas ICM7555/ICM7556 Datasheets](https://www.renesas.com/)
3. [NXP NE555 Datasheet (original lineage)](https://www.nxp.com/)
4. [Wikipedia -- 555 Timer IC: Variants](https://en.wikipedia.org/wiki/555_timer_IC)
