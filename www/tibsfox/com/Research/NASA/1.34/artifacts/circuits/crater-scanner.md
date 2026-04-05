# Circuit: Crater Scanner

## Optical Scanner for Detecting Craters in Printed Lunar Images

**Cost:** ~$30
**Difficulty:** Intermediate
**Connection:** Demonstrates how Ranger 7's cameras detected brightness variations on the lunar surface

### Components

| Component | Qty | Cost |
|-----------|-----|------|
| Arduino Nano | 1 | $8 |
| Photoresistor (CdS) | 1 | $1 |
| White LED | 1 | $0.25 |
| SG90 Servo motor | 1 | $3 |
| SSD1306 OLED 128x64 | 1 | $8 |
| 10K resistor | 1 | $0.10 |
| 220-ohm resistor | 1 | $0.10 |
| Breadboard + wires | 1 | $5 |

### How It Works

The LED illuminates a printed Ranger 7 image. The photoresistor measures reflected light intensity. The servo motor scans the sensor across the image on a horizontal arm. Brightness transitions (bright→dark→bright) indicate crater rim crossings. The Arduino counts transitions and displays the crater count on the OLED.

### The Physics

Ranger 7's vidicon cameras worked on the same principle: light from the lunar surface struck a photoconductive target, creating an electrical signal proportional to surface brightness. Crater rims appear as brightness transitions because of shadow geometry — the sun-facing rim is bright, the interior shadow is dark. This circuit recreates that detection at tabletop scale.

### Schematic

```
     5V ──┬── LED (+) ─── 220Ω ─── GND
           │
     5V ──┤── Photoresistor ──┬── A0 (Arduino)
           │                   │
           │                  10K
           │                   │
           │                  GND
           │
     D9 ──┴── Servo signal
```
