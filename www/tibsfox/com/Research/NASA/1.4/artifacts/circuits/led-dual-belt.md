# DIY LED Circuit: Dual Van Allen Belt Radiation Profile

## The Circuit

A standalone electronic circuit that displays the dual Van Allen belt structure discovered by Pioneer 3. Two vertical columns of 5 LEDs each — left column (green) represents the inner belt, right column (blue) represents the outer belt — with a visible gap between them representing the slot region. A 555 timer and CD4017 decade counter scan both columns simultaneously, with different resistor values on each output creating an intensity profile that maps the actual radiation distribution.

**What it does:**
- Press the launch button
- Both columns scan from bottom (low altitude) to top (high altitude) over ~45 seconds
- Left column (inner belt, green LEDs): dim, dim, BRIGHT, BRIGHT, dim — peaking at positions 3-4 (~3,500 km)
- Right column (outer belt, blue LEDs): dim, dim, dim, BRIGHT, BRIGHT — peaking at positions 4-5 (~16,000 km)
- The gap between the columns represents the slot region where radiation drops
- After one full scan: LEDs reverse sequence (return trajectory), then all dark

**The lesson:** Earth has TWO radiation belts, not one. Pioneer 1 found the inner belt but couldn't resolve the full picture. Pioneer 3's dual Geiger-Muller tubes (shielded and unshielded) mapped both belts and the quiet slot between them. The two-column display with different peak positions makes the dual-belt structure instantly visible.

**Total cost: ~$13**

---

## Schematic

```
                    +9V
                     |
        +------------+-------------+
        |                          |
     555 TIMER                  CD4017
     (clock gen)               DECADE COUNTER
        |                          |
     pin 3 (out) -----> pin 14 (CLK)
        |                          |
       GND                        |
                    +--------------+--------------+
                    |    |    |    |    |    |    |    |    |    |
                   Q0   Q1   Q2   Q3   Q4   Q5   Q6   Q7   Q8   Q9
                    |    |    |    |    |    |    |    |    |    |
                   RI1  RI2  RI3  RI4  RI5  RO1  RO2  RO3  RO4  RO5
                    |    |    |    |    |    |    |    |    |    |
                   G1   G2   G3   G4   G5   B1   B2   B3   B4   B5
                    |    |    |    |    |    |    |    |    |    |
                   GND  GND  GND  GND  GND  GND  GND  GND  GND  GND

LEFT COLUMN (Inner Belt, Green):        RIGHT COLUMN (Outer Belt, Blue):
  G1 (dim)   — position 1 (~1,000 km)    B1 (dim)   — position 1 (~10,000 km)
  G2 (dim)   — position 2 (~2,000 km)    B2 (dim)   — position 2 (~12,000 km)
  G3 (BRIGHT)— position 3 (~3,500 km)    B3 (dim)   — position 3 (~14,000 km)
  G4 (BRIGHT)— position 4 (~4,500 km)    B4 (BRIGHT)— position 4 (~16,000 km)
  G5 (dim)   — position 5 (~6,000 km)    B5 (BRIGHT)— position 5 (~20,000 km)

The physical gap between left and right columns = the SLOT REGION
```

## Brightness Encoding via Resistor Values

The radiation intensity profile is encoded in the LED current-limiting resistors:

```
INNER BELT (Green LEDs):
  G1: 1K    resistor → dim     (low-altitude onset, sparse radiation)
  G2: 680R  resistor → medium  (inner belt rising)
  G3: 220R  resistor → BRIGHT  (inner belt peak — trapped protons, ~3,500 km)
  G4: 220R  resistor → BRIGHT  (inner belt sustained peak)
  G5: 1K    resistor → dim     (inner belt falling, approaching slot)

OUTER BELT (Blue LEDs):
  B1: 1K    resistor → dim     (slot/outer onset, sparse)
  B2: 1K    resistor → dim     (outer belt lower edge)
  B3: 680R  resistor → medium  (outer belt rising)
  B4: 330R  resistor → BRIGHT  (outer belt peak — trapped electrons, ~16,000 km)
  B5: 330R  resistor → BRIGHT  (outer belt sustained peak, ~20,000 km)

Note: Blue LEDs have higher forward voltage (~3.0V vs ~2.0V for green),
so the bright blues use 330R instead of 220R to achieve comparable
visual brightness. The different resistor values between green and blue
columns reflect the different physics: inner belt (proton-dominated,
more intense) vs outer belt (electron-dominated, broader).
```

## 555 Timer Configuration

```
Astable mode — generates clock pulses for the CD4017:

        +9V
         |
         R1 (10K)
         |
         +---[pin 7 (discharge)]
         |
         R2 (82K)    ← use 47K + 50K trimpot for calibration
         |
         +---[pin 6 (threshold)]---[pin 2 (trigger)]
         |
         C1 (47uF electrolytic)
         |
        GND

  pin 8 (VCC) → +9V
  pin 1 (GND) → GND
  pin 4 (reset) → +9V (always enabled)
  pin 5 (control) → 0.01uF → GND (bypass)
  pin 3 (output) → CD4017 pin 14 (CLK)

Timing:
  f = 1.44 / ((R1 + 2*R2) * C1)
  f = 1.44 / ((10K + 164K) * 47uF) = 0.176 Hz → ~5.7 seconds per step
  Adjust R2 trimpot to target 4.5 seconds per step
  Total scan (10 steps): ~45 seconds
```

## CD4017 Wiring

```
CD4017 Decade Counter:
  pin 16 (VDD) → +9V
  pin 8  (VSS) → GND
  pin 13 (EN)  → GND (always enabled)
  pin 15 (RST) → Q9 carry (pin 11) via 0.01uF cap + 10K pulldown
                  (auto-reset after one full scan for return sequence)
  pin 14 (CLK) → 555 output

  Output assignments (scan left column first, then right):
  pin 3  (Q0) → RI1 (1K)   → G1 (green)   → GND
  pin 2  (Q1) → RI2 (680R) → G2 (green)   → GND
  pin 4  (Q2) → RI3 (220R) → G3 (green)   → GND   *** INNER PEAK ***
  pin 7  (Q3) → RI4 (220R) → G4 (green)   → GND   *** INNER PEAK ***
  pin 10 (Q4) → RI5 (1K)   → G5 (green)   → GND
  pin 1  (Q5) → RO1 (1K)   → B1 (blue)    → GND
  pin 5  (Q6) → RO2 (1K)   → B2 (blue)    → GND
  pin 6  (Q7) → RO3 (680R) → B3 (blue)    → GND
  pin 9  (Q8) → RO4 (330R) → B4 (blue)    → GND   *** OUTER PEAK ***
  pin 11 (Q9) → RO5 (330R) → B5 (blue)    → GND   *** OUTER PEAK ***
```

## Physical Layout

```
The layout on the breadboard is critical — it IS the data visualization.

BREADBOARD LAYOUT (top view):

    LEFT COLUMN          GAP          RIGHT COLUMN
    (Inner Belt)      (Slot Region)    (Outer Belt)

    G5 (dim)        [ ~2cm gap ]       B5 (BRIGHT)     ← highest altitude
    G4 (BRIGHT)     [ ~2cm gap ]       B4 (BRIGHT)
    G3 (BRIGHT)     [ ~2cm gap ]       B3 (medium)
    G2 (medium)     [ ~2cm gap ]       B2 (dim)
    G1 (dim)        [ ~2cm gap ]       B1 (dim)        ← lowest altitude

    [  555 timer  ]  [  CD4017  ]  [  battery  ]

Mount LEDs vertically with equal spacing.
Label altitudes on a strip of paper between the columns:
  Position 1: 1,000 km / 10,000 km
  Position 2: 2,000 km / 12,000 km
  Position 3: 3,500 km / 14,000 km
  Position 4: 4,500 km / 16,000 km
  Position 5: 6,000 km / 20,000 km

The physical gap between the columns represents the slot region
(~6,000-10,000 km) where Pioneer 3 measured markedly lower
radiation. This is the visual lesson: two peaks, one gap.
```

## Parts List

| Part | Value | Qty | Cost |
|------|-------|-----|------|
| 555 Timer IC (NE555) | - | 1 | $0.25 |
| CD4017 Decade Counter | - | 1 | $0.60 |
| LED (green, 5mm) | - | 5 | $0.50 |
| LED (blue, 5mm) | - | 5 | $0.75 |
| Resistor 220R | 1/4W | 2 | $0.10 |
| Resistor 330R | 1/4W | 2 | $0.10 |
| Resistor 680R | 1/4W | 2 | $0.10 |
| Resistor 1K | 1/4W | 4 | $0.20 |
| Resistor 10K | 1/4W | 2 | $0.10 |
| Resistor 47K + 50K trimpot | 1/4W | 1 | $0.40 |
| Capacitor 47uF electrolytic | 16V | 1 | $0.10 |
| Capacitor 0.01uF ceramic | - | 2 | $0.10 |
| Pushbutton (momentary) | - | 1 | $0.25 |
| 9V battery snap | - | 1 | $0.20 |
| 9V battery | - | 1 | $3.00 |
| Breadboard (full-size) | - | 1 | $5.00 |
| Jumper wire kit | - | 1 | $2.50 |
| **Total** | | | **~$13.25** |

## Build Instructions

1. **Mount the LEDs in two vertical columns.** Five green LEDs on the left, five blue LEDs on the right, with a visible gap (~2 cm) between columns. Bottom = lowest altitude, top = highest. This gap is the slot region. Make it visible and deliberate — it's the discovery.

2. **Wire the 555 timer** in astable mode with the RC values above. Verify ~4.5-second intervals with a test LED. Use the trimpot to calibrate.

3. **Connect the CD4017.** Feed the 555 output to pin 14. Wire each output to its corresponding LED through the correct resistor value. The resistor values ARE the data — get them right.

4. **Wire the auto-reset.** Connect Q9 (pin 11) through a 0.01uF cap and 10K pulldown to pin 15 (RST). After scanning all 10 positions, the counter resets and the display starts again — representing Pioneer 3's return trajectory.

5. **Wire the launch button.** Momentary pushbutton connected to the 555's reset (pin 4) through a pull-up. Press = start the scan.

6. **Test and observe.** Press the launch button and watch:
   - Green column scans: dim → dim → BRIGHT → BRIGHT → dim (inner belt profile)
   - Blue column scans: dim → dim → dim → BRIGHT → BRIGHT (outer belt profile)
   - The peaks are at DIFFERENT POSITIONS — that's the dual-belt structure
   - The gap between columns stays dark — that's the slot region

7. **Print altitude labels.** Create a printed strip with altitude markings and mount it between the two columns. Now the circuit is a wall-mounted radiation profile of near-Earth space.

## What You Learn

- **Dual-belt radiation structure** — the most important finding of Pioneer 3. Earth has two radiation belts, not one. They peak at different altitudes, are composed of different particles, and have a quiet gap between them. This circuit makes that structure physical and immediate.
- **Resistor selection as data encoding** — each resistor value represents a radiation measurement. The BOM is the dataset. Different resistance = different brightness = different radiation intensity at that altitude.
- **CD4017 sequential scanning** — the decade counter scans through 10 outputs in sequence. This is the same principle used in LED matrix displays, multiplexed segment drivers, and time-division multiplexing in communications.
- **555 timer as clock source** — continued from v1.2 and v1.3. The 555 generates the steady clock that drives the scan. Three circuits, three uses of the same timer IC.
- **Visualization as understanding** — the two-column layout with different peak positions teaches the dual-belt structure more effectively than any textbook paragraph. You see it, you get it.

## Fox Companies Connection

Eighth circuit in the NASA kit series. Pairs with v1.2's single-column Van Allen belt display. Together they tell the progression: v1.2 showed Pioneer 1's discovery of the inner belt (one column, one peak). This circuit shows Pioneer 3's expansion of that discovery (two columns, two peaks, one gap). Workshop upgrade: mount both circuits side by side on a demonstration board. Label the left display "Pioneer 1 — One Belt (1958)" and the right display "Pioneer 3 — Two Belts (1958)." The progression from one column to two columns IS the history of the discovery. Same timer, same counter, different resistors, different understanding.
