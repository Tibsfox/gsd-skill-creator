# Circuit: Orbital Decay LED Display
## Mission 1.26 — Ranger 1

### Overview
Eight LEDs represent Ranger 1's orbit. They light in sequence (circling Earth), then progressively go dark from the bottom up as the orbit decays. When all LEDs are dark, a red "REENTRY" LED flashes. A potentiometer controls decay speed.

### Bill of Materials (~$12)

| Qty | Component | Value | Cost |
|-----|-----------|-------|------|
| 1 | 555 timer IC | NE555 | $0.50 |
| 1 | CD4017 decade counter | CD4017BE | $0.75 |
| 8 | LEDs | 3mm, mixed colors | $1.00 |
| 1 | LED | 3mm, red (reentry) | $0.15 |
| 9 | Resistors | 220Ω (LED current limit) | $0.50 |
| 1 | Potentiometer | 100KΩ (decay speed) | $0.50 |
| 1 | Capacitor | 10µF electrolytic | $0.20 |
| 1 | Capacitor | 100nF ceramic | $0.10 |
| 1 | Breadboard | half-size | $3.00 |
| 1 | Battery holder | 4xAA (6V) | $1.50 |
| -- | Jumper wires | assorted | $2.00 |

### Circuit Description

The 555 timer generates a clock signal whose frequency is set by the potentiometer (controlling "orbital period"). The CD4017 decade counter advances through its 10 outputs sequentially, lighting each LED in turn (simulating the spacecraft orbiting Earth).

A second 555 timer (or RC decay circuit) slowly reduces the supply voltage to the upper LEDs, causing them to dim and go dark from top to bottom — simulating the orbit decaying from higher to lower altitude. When only the bottom 1-2 LEDs remain lit, a transistor triggers the red "REENTRY" LED to flash.

### Schematic

```
6V Battery ──┬── 555 Timer (astable) ──┬── CD4017 ── Q0-Q7 → LEDs 1-8
             │                         │
             │   Pot (100K) controls    │
             │   oscillation rate       │
             │                         │
             └── RC Decay ────────────── Voltage divider to upper LEDs
                 (simulates orbit       (LEDs dim progressively)
                  altitude dropping)
                                        Q8 → Red "REENTRY" LED
                                        (flashes when counter reaches Q8)
```

### Learning Connection

The LEDs cycle at a rate that INCREASES as the orbit decays — because lower orbits have shorter periods. At 160 km, Ranger 1 completed an orbit every 88 minutes. As the orbit dropped to 140 km, 120 km, 100 km, the period decreased. The 555 timer's frequency should increase as the RC decay circuit lowers the voltage threshold. The spacecraft speeds up as it falls — counterintuitive but physically correct.

### Ranger 1 vs. Pioneer 4 (v1.5) Circuit Comparison

In the v1.5 circuit (Pioneer 4), the LEDs ascend and STAY ON — representing escape velocity achieved. In this v1.26 circuit, the LEDs circle and gradually GO DARK — representing orbital decay. The contrast is the lesson: Pioneer 4 escaped. Ranger 1 did not.
