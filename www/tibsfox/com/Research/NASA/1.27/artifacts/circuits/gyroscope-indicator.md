# Gyroscope Indicator LED Ring

## Mission 1.27 — Ranger 2 Parking Orbit Gyroscope Failure

**What it is:** A ring of 8 LEDs driven by a 555 timer and CD4017 decade counter, simulating a gyroscope rotor. When a switch is closed (gyroscope running), the LEDs chase around the ring. When the switch opens (gyroscope failure), the chase stops and a red warning LED lights.

**Cost:** ~$12

### Schematic

```
  +5V
   |
  [555 Timer, astable mode]
   |  R1 = 1K, R2 = 10K, C1 = 10uF
   |  → ~7 Hz output (adjustable with R2)
   |
  [CD4017 Decade Counter]
   |  CLK ← 555 output (gated by SPST switch)
   |  Q0-Q7 → 8 LEDs (green, through 220Ω each)
   |  Q8, Q9 → not connected (reset to Q0)
   |
  [SPST Switch] between 555 output and CD4017 CLK
   |  Closed: gyro spinning → LEDs chase
   |  Open: gyro stopped → LEDs frozen
   |
  [Red LED] driven by inverted switch signal
   |  Switch closed → red LED off
   |  Switch open → red LED on → "GYROSCOPE FAILURE"
```

### Parts List

| Part | Qty | Cost |
|------|-----|------|
| 555 Timer IC | 1 | $0.50 |
| CD4017 Decade Counter | 1 | $0.80 |
| Green LEDs (3mm) | 8 | $1.00 |
| Red LED (5mm) | 1 | $0.25 |
| 220Ω resistors | 9 | $0.50 |
| 1KΩ resistor | 1 | $0.10 |
| 10KΩ potentiometer | 1 | $0.75 |
| 10µF capacitor | 1 | $0.25 |
| SPST switch | 1 | $0.50 |
| Breadboard | 1 | $3.00 |
| Jumper wires | -- | $1.50 |
| **Total** | | **~$9.15** |

### Operation

1. Power on with switch closed: LEDs chase in a circle → gyroscope spinning
2. Adjust potentiometer to change chase speed → spin rate
3. Open switch: LEDs freeze in place, red LED lights → **GYROSCOPE FAILURE**
4. The frozen LEDs represent the moment Ranger 2's roll gyroscope stopped
5. Close switch again: chase resumes → gyroscope restart (if only it had been that easy)

### The Connection

When the green LEDs are chasing, the ring has rotational symmetry — it looks the same from any angle, just like a spinning gyroscope maintains its reference regardless of the vehicle's attitude. When the chase stops, the symmetry breaks — one LED is lit and the others are dark. The ring has a specific, frozen orientation. This is what happened to the Agena B: the gyroscope stopped, the rotational reference was lost, and the vehicle was frozen in an orientation it could not verify or correct.
